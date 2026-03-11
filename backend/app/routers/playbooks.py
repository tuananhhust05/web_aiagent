from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime
from bson import ObjectId

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.playbook import (
    PlaybookTemplateCreate,
    PlaybookTemplateUpdate,
    PlaybookTemplateResponse,
    PlaybookTemplateListResponse,
)

router = APIRouter()


@router.get("", response_model=PlaybookTemplateListResponse)
async def list_playbooks(
    limit: int = Query(100, ge=1, le=200),
    template_type: Optional[str] = Query(None, description="Filter by template type: personal, team, suggested"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    collection = db.playbook_templates
    query_filter = {"user_id": current_user.id}
    if template_type is not None:
        query_filter["template_type"] = template_type
    cursor = (
        collection.find(query_filter)
        .sort("is_default", -1)
        .sort("created_at", -1)
        .limit(limit)
    )
    records = await cursor.to_list(length=limit)
    out = []
    for r in records:
        r["id"] = str(r["_id"])
        r.pop("_id", None)
        out.append(r)
    total = await collection.count_documents(query_filter)
    return PlaybookTemplateListResponse(templates=out, total=total)


@router.post("", response_model=PlaybookTemplateResponse)
async def create_playbook(
    payload: PlaybookTemplateCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    collection = db.playbook_templates
    now = datetime.utcnow()
    doc = {
        "user_id": current_user.id,
        "name": payload.name,
        "rules": [r.dict() for r in payload.rules],
        "is_default": False,
        "template_type": payload.template_type.value if payload.template_type else "personal",
        "prompt": payload.prompt,
        "meeting_type": payload.meeting_type.value if payload.meeting_type else "all",
        "title_keyword": payload.title_keyword,
        "active": payload.active if payload.active is not None else True,
        "created_at": now,
        "updated_at": now,
    }
    res = await collection.insert_one(doc)
    created = await collection.find_one({"_id": res.inserted_id})
    created["id"] = str(created["_id"])
    created.pop("_id", None)
    return created


@router.get("/{template_id}", response_model=PlaybookTemplateResponse)
async def get_playbook(
    template_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    collection = db.playbook_templates
    try:
        oid = ObjectId(template_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid playbook id")
    doc = await collection.find_one({"_id": oid, "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Playbook not found")
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


@router.put("/{template_id}", response_model=PlaybookTemplateResponse)
async def update_playbook(
    template_id: str,
    payload: PlaybookTemplateUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    collection = db.playbook_templates
    try:
        oid = ObjectId(template_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid playbook id")
    existing = await collection.find_one({"_id": oid, "user_id": current_user.id})
    if not existing:
        raise HTTPException(status_code=404, detail="Playbook not found")

    update_doc = {"updated_at": datetime.utcnow()}
    if payload.name is not None:
        update_doc["name"] = payload.name
    if payload.rules is not None:
        update_doc["rules"] = [r.dict() for r in payload.rules]
    if payload.is_default is not None:
        update_doc["is_default"] = payload.is_default
    if payload.template_type is not None:
        update_doc["template_type"] = payload.template_type.value
    if payload.prompt is not None:
        update_doc["prompt"] = payload.prompt
    if payload.meeting_type is not None:
        update_doc["meeting_type"] = payload.meeting_type.value
    if payload.title_keyword is not None:
        update_doc["title_keyword"] = payload.title_keyword
    if payload.active is not None:
        update_doc["active"] = payload.active

    # If setting default true, clear other defaults
    if payload.is_default is True:
        await collection.update_many(
            {"user_id": current_user.id, "_id": {"$ne": oid}},
            {"$set": {"is_default": False, "updated_at": datetime.utcnow()}},
        )

    await collection.update_one({"_id": oid}, {"$set": update_doc})
    doc = await collection.find_one({"_id": oid})
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


@router.post("/{template_id}/set-default", response_model=PlaybookTemplateResponse)
async def set_default_playbook(
    template_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    collection = db.playbook_templates
    try:
        oid = ObjectId(template_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid playbook id")
    existing = await collection.find_one({"_id": oid, "user_id": current_user.id})
    if not existing:
        raise HTTPException(status_code=404, detail="Playbook not found")
    now = datetime.utcnow()
    await collection.update_many(
        {"user_id": current_user.id},
        {"$set": {"is_default": False, "updated_at": now}},
    )
    await collection.update_one({"_id": oid}, {"$set": {"is_default": True, "updated_at": now}})
    doc = await collection.find_one({"_id": oid})
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


@router.delete("/{template_id}")
async def delete_playbook(
    template_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    collection = db.playbook_templates
    try:
        oid = ObjectId(template_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid playbook id")
    doc = await collection.find_one({"_id": oid, "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Playbook not found")
    await collection.delete_one({"_id": oid})
    return {"message": "Deleted"}

