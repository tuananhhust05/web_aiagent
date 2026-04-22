import logging
import json
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel
from bson import ObjectId

from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.services.strategy_service import StrategyService

logger = logging.getLogger(__name__)
router = APIRouter()

STRATEGY_CACHE_COLLECTION = "strategy_briefings"
CACHE_TTL_HOURS = 1


class BriefingRequest(BaseModel):
    force_refresh: bool = False


@router.post("/briefing/{deal_id}")
async def generate_briefing(
    deal_id: str = Path(...),
    request: BriefingRequest = BriefingRequest(),
    current_user: UserResponse = Depends(get_current_active_user),
):
    db = get_database()
    user_id = str(current_user.id)

    # Validate deal_id format
    if not ObjectId.is_valid(deal_id):
        raise HTTPException(status_code=400, detail="Invalid deal ID format")

    oid = ObjectId(deal_id)

    # Fetch deal — try both user_id and owner_id field naming conventions
    deal = await db.deals.find_one({"_id": oid, "user_id": user_id})
    if not deal:
        deal = await db.deals.find_one({"_id": oid, "owner_id": user_id})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # Check cache (skip if force_refresh)
    if not request.force_refresh:
        cached = await db[STRATEGY_CACHE_COLLECTION].find_one(
            {"user_id": user_id, "deal_id": deal_id}
        )
        if cached and cached.get("generated_at"):
            generated_at = cached["generated_at"]
            if isinstance(generated_at, str):
                generated_at = datetime.fromisoformat(generated_at.replace("Z", "+00:00"))
            if generated_at.tzinfo is None:
                generated_at = generated_at.replace(tzinfo=timezone.utc)
            age = datetime.now(timezone.utc) - generated_at
            if age < timedelta(hours=CACHE_TTL_HOURS):
                briefing = cached.get("briefing", {})
                return {**briefing, "cache_hit": True}

    # Fetch associated contact (best-effort)
    contact: Optional[dict] = None
    contact_id = deal.get("contact_id") or deal.get("contactId")
    if contact_id:
        try:
            cid = ObjectId(contact_id) if ObjectId.is_valid(str(contact_id)) else None
            if cid:
                contact = await db.contacts.find_one({"_id": cid})
        except Exception:
            pass

    # Enrich deal with stage name if missing
    if not deal.get("stage_name") and deal.get("stage_id"):
        try:
            stage = await db.pipeline_stages.find_one({"_id": ObjectId(str(deal["stage_id"]))})
            if stage:
                deal = {**deal, "stage_name": stage.get("name", "")}
        except Exception:
            pass

    # Run strategy AI pipeline
    service = StrategyService()
    briefing = await service.generate(deal=deal, contact=contact, db=db, user_id=user_id)

    # Persist to cache (upsert)
    try:
        await db[STRATEGY_CACHE_COLLECTION].update_one(
            {"user_id": user_id, "deal_id": deal_id},
            {"$set": {
                "user_id": user_id,
                "deal_id": deal_id,
                "briefing": briefing,
                "generated_at": datetime.now(timezone.utc),
            }},
            upsert=True,
        )
    except Exception as exc:
        logger.warning("[strategy] Cache upsert failed (non-fatal): %s", exc)

    return {**briefing, "cache_hit": False}


@router.delete("/briefing/{deal_id}/cache")
async def clear_briefing_cache(
    deal_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_active_user),
):
    db = get_database()
    await db[STRATEGY_CACHE_COLLECTION].delete_one(
        {"user_id": str(current_user.id), "deal_id": deal_id}
    )
    return {"deleted": True}
