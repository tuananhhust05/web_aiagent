"""
Company Data Pool — Centralized cache for company information fetched via Tavily.

Stores search results in MongoDB collection `company_data_pool` so that repeated
lookups for the same company name do NOT trigger additional Tavily API calls.

Usage:
    from app.services.company_data_pool import get_company_data_pool
    pool = get_company_data_pool()
    data = await pool.get_company_info("Acme Corp")      # returns cached or fresh
    url  = await pool.get_linkedin_url("john@acme.com")   # returns cached or fresh
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from app.core.database import get_database

logger = logging.getLogger(__name__)

# MongoDB collection names
COMPANY_POOL_COLLECTION = "company_data_pool"
LINKEDIN_URL_POOL_COLLECTION = "linkedin_url_pool"

# Cache TTL: how long before we consider cached data stale (30 days)
COMPANY_CACHE_TTL_DAYS = 30
LINKEDIN_CACHE_TTL_DAYS = 30


class CompanyDataPool:
    """
    Centralized data pool for company information and LinkedIn URL lookups.

    Before calling Tavily, checks MongoDB cache first.
    After a successful Tavily call, stores results in MongoDB for future reuse.
    All data is shared across users (not user-scoped).
    """

    async def get_company_info(self, company_name: str) -> Dict[str, Any]:
        """
        Get company info — from cache if available, otherwise from Tavily.

        Args:
            company_name: Company name to search for

        Returns:
            Dict with 'company' and 'result' keys
        """
        if not company_name or not company_name.strip():
            return {"company": company_name or "", "result": ""}

        company_name = company_name.strip()
        cache_key = company_name.lower()

        # Step 1: Check cache
        cached = await self._get_cached_company(cache_key)
        if cached is not None:
            logger.info(
                f"[COMPANY-POOL] ✅ Cache HIT for '{company_name}' "
                f"(cached at {cached.get('cached_at', 'unknown')})"
            )
            return {
                "company": cached.get("company_name", company_name),
                "result": cached.get("search_result", ""),
            }

        # Step 2: Call Tavily
        logger.info(f"[COMPANY-POOL] ❌ Cache MISS for '{company_name}', calling Tavily...")
        from app.services.tavily_service import get_tavily_service

        tavily = get_tavily_service()
        try:
            data = await tavily.search_company_info(company_name)
            search_result = data.get("result", "")

            # Step 3: Store in cache
            await self._store_company_cache(
                cache_key=cache_key,
                company_name=company_name,
                search_result=search_result,
            )

            logger.info(
                f"[COMPANY-POOL] 💾 Cached company info for '{company_name}' "
                f"({len(search_result)} chars)"
            )
            return data

        except Exception as e:
            logger.error(f"[COMPANY-POOL] Tavily search failed for '{company_name}': {e}")
            raise

    async def get_linkedin_url(self, email: str) -> Optional[str]:
        """
        Get LinkedIn URL for an email — from cache if available, otherwise from Tavily.

        Args:
            email: Email address to search LinkedIn for

        Returns:
            LinkedIn profile URL or None
        """
        if not email or not email.strip():
            return None

        email = email.strip().lower()

        # Step 1: Check cache
        cached = await self._get_cached_linkedin(email)
        if cached is not None:
            linkedin_url = cached.get("linkedin_url")
            logger.info(
                f"[LINKEDIN-POOL] ✅ Cache HIT for '{email}': {linkedin_url or '(no URL found previously)'}"
            )
            # Return the cached URL (may be None if previous search found nothing)
            return linkedin_url

        # Step 2: Call Tavily
        logger.info(f"[LINKEDIN-POOL] ❌ Cache MISS for '{email}', calling Tavily...")
        from app.services.tavily_service import get_tavily_service

        tavily = get_tavily_service()
        try:
            linkedin_url = await tavily.search_linkedin_url(email)

            # Step 3: Store in cache (even if None, to avoid re-searching)
            await self._store_linkedin_cache(
                email=email,
                linkedin_url=linkedin_url,
            )

            logger.info(
                f"[LINKEDIN-POOL] 💾 Cached LinkedIn result for '{email}': "
                f"{linkedin_url or '(not found)'}"
            )
            return linkedin_url

        except Exception as e:
            logger.error(f"[LINKEDIN-POOL] Tavily LinkedIn search failed for '{email}': {e}")
            return None

    # ─── Cache read helpers ───

    async def _get_cached_company(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Check MongoDB for cached company info. Returns None if not found or expired."""
        try:
            db = get_database()
            doc = await db[COMPANY_POOL_COLLECTION].find_one({"cache_key": cache_key})
            if not doc:
                return None

            # Check TTL
            cached_at = doc.get("cached_at")
            if cached_at and isinstance(cached_at, datetime):
                if datetime.utcnow() - cached_at > timedelta(days=COMPANY_CACHE_TTL_DAYS):
                    logger.info(f"[COMPANY-POOL] Cache expired for '{cache_key}'")
                    return None

            return doc
        except Exception as e:
            logger.error(f"[COMPANY-POOL] Cache read error: {e}")
            return None

    async def _get_cached_linkedin(self, email: str) -> Optional[Dict[str, Any]]:
        """Check MongoDB for cached LinkedIn URL. Returns None if not found or expired."""
        try:
            db = get_database()
            doc = await db[LINKEDIN_URL_POOL_COLLECTION].find_one({"email": email})
            if not doc:
                return None

            # Check TTL
            cached_at = doc.get("cached_at")
            if cached_at and isinstance(cached_at, datetime):
                if datetime.utcnow() - cached_at > timedelta(days=LINKEDIN_CACHE_TTL_DAYS):
                    logger.info(f"[LINKEDIN-POOL] Cache expired for '{email}'")
                    return None

            return doc
        except Exception as e:
            logger.error(f"[LINKEDIN-POOL] Cache read error: {e}")
            return None

    # ─── Cache write helpers ───

    async def _store_company_cache(
        self,
        cache_key: str,
        company_name: str,
        search_result: str,
    ) -> None:
        """Store company info in MongoDB cache."""
        try:
            db = get_database()
            now = datetime.utcnow()
            await db[COMPANY_POOL_COLLECTION].update_one(
                {"cache_key": cache_key},
                {
                    "$set": {
                        "cache_key": cache_key,
                        "company_name": company_name,
                        "search_result": search_result,
                        "cached_at": now,
                        "updated_at": now,
                    },
                    "$setOnInsert": {
                        "created_at": now,
                    },
                },
                upsert=True,
            )
        except Exception as e:
            logger.error(f"[COMPANY-POOL] Cache write error for '{company_name}': {e}")

    async def _store_linkedin_cache(
        self,
        email: str,
        linkedin_url: Optional[str],
    ) -> None:
        """Store LinkedIn URL in MongoDB cache."""
        try:
            db = get_database()
            now = datetime.utcnow()
            await db[LINKEDIN_URL_POOL_COLLECTION].update_one(
                {"email": email},
                {
                    "$set": {
                        "email": email,
                        "linkedin_url": linkedin_url,
                        "cached_at": now,
                        "updated_at": now,
                    },
                    "$setOnInsert": {
                        "created_at": now,
                    },
                },
                upsert=True,
            )
        except Exception as e:
            logger.error(f"[LINKEDIN-POOL] Cache write error for '{email}': {e}")

    async def invalidate_company(self, company_name: str) -> bool:
        """Remove a company from the cache (e.g. force refresh)."""
        try:
            db = get_database()
            cache_key = company_name.strip().lower()
            result = await db[COMPANY_POOL_COLLECTION].delete_one({"cache_key": cache_key})
            deleted = result.deleted_count > 0
            if deleted:
                logger.info(f"[COMPANY-POOL] Invalidated cache for '{company_name}'")
            return deleted
        except Exception as e:
            logger.error(f"[COMPANY-POOL] Cache invalidation error: {e}")
            return False

    async def invalidate_linkedin(self, email: str) -> bool:
        """Remove a LinkedIn URL from the cache (e.g. force refresh)."""
        try:
            db = get_database()
            result = await db[LINKEDIN_URL_POOL_COLLECTION].delete_one(
                {"email": email.strip().lower()}
            )
            deleted = result.deleted_count > 0
            if deleted:
                logger.info(f"[LINKEDIN-POOL] Invalidated cache for '{email}'")
            return deleted
        except Exception as e:
            logger.error(f"[LINKEDIN-POOL] Cache invalidation error: {e}")
            return False

    async def get_pool_stats(self) -> Dict[str, Any]:
        """Get statistics about the data pool."""
        try:
            db = get_database()
            company_count = await db[COMPANY_POOL_COLLECTION].count_documents({})
            linkedin_count = await db[LINKEDIN_URL_POOL_COLLECTION].count_documents({})
            linkedin_found = await db[LINKEDIN_URL_POOL_COLLECTION].count_documents(
                {"linkedin_url": {"$ne": None}}
            )
            return {
                "company_records": company_count,
                "linkedin_records": linkedin_count,
                "linkedin_found": linkedin_found,
                "linkedin_not_found": linkedin_count - linkedin_found,
            }
        except Exception as e:
            logger.error(f"[COMPANY-POOL] Stats error: {e}")
            return {}


# ─── Singleton ───
_company_data_pool: Optional[CompanyDataPool] = None


def get_company_data_pool() -> CompanyDataPool:
    """Get or create singleton CompanyDataPool instance."""
    global _company_data_pool
    if _company_data_pool is None:
        _company_data_pool = CompanyDataPool()
    return _company_data_pool
