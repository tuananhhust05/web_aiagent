"""
Tavily search service for company information and LinkedIn URL lookup.
Replaces SerpAPI with Tavily Search API (https://api.tavily.com/search).
"""

import httpx
import re
from typing import Optional, Dict, Any
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class TavilyService:
    """Service to search for company information and LinkedIn URLs using Tavily API."""

    def __init__(self):
        """Initialize Tavily service with API key from settings."""
        self.api_key = settings.API_TAVILY_KEY
        self.base_url = "https://api.tavily.com/search"

        if not self.api_key:
            logger.warning("[TAVILY] API_TAVILY_KEY not configured in settings")

    async def search_company_info(self, company_name: str) -> Dict[str, Any]:
        """
        Search for company information using Tavily API.

        Args:
            company_name: Name of the company to search for

        Returns:
            Dict with 'company' and 'result' keys containing company name and search results

        Raises:
            Exception: If API key is missing or API call fails
        """
        if not self.api_key:
            raise Exception("API_TAVILY_KEY not configured in environment variables")

        if not company_name or not company_name.strip():
            raise ValueError("Company name cannot be empty")

        company_name = company_name.strip()

        # Construct search query to find company information
        search_query = f"find information about company {company_name}"

        logger.info(f"[TAVILY] Searching for company: {company_name}")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {
                    "query": search_query,
                    "search_depth": "basic",
                    "max_results": 10,
                    "include_answer": True,
                }
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                }

                response = await client.post(self.base_url, json=payload, headers=headers)

                if response.status_code != 200:
                    logger.error(f"[TAVILY] API returned {response.status_code}: {response.text}")
                    raise Exception(f"Tavily API returned status {response.status_code}")

                data = response.json()

                results = data.get("results", [])
                answer = data.get("answer", "")

                if not results and not answer:
                    logger.warning(f"[TAVILY] No results found for company: {company_name}")
                    return {
                        "company": company_name,
                        "result": "",
                    }

                # Format results into a text string similar to the old SerpAPI format
                result_text = self._format_results(results, company_name, answer)

                logger.info(
                    f"[TAVILY] Found {len(results)} results for {company_name}: {len(result_text)} chars"
                )

                return {
                    "company": company_name,
                    "result": result_text,
                }

        except httpx.TimeoutException:
            logger.error(f"[TAVILY] Timeout searching for {company_name}")
            raise Exception("Search timed out. Please try again.")
        except Exception as e:
            logger.error(f"[TAVILY] Error searching for {company_name}: {str(e)}")
            raise

    async def search_linkedin_url(self, email: str) -> Optional[str]:
        """
        Search for a LinkedIn profile URL by email using Tavily API.
        Query: "linkedin {email}"
        Returns the first result URL if it matches linkedin.com/in/{username}, else None.
        """
        logger.info(f"[TAVILY-LINKEDIN] >>> search_linkedin_url called with email={email}")
        logger.info(
            f"[TAVILY-LINKEDIN] api_key configured = {bool(self.api_key)}, "
            f"key_prefix = {self.api_key[:12] + '...' if self.api_key else 'EMPTY'}"
        )

        if not self.api_key:
            logger.warning("[TAVILY-LINKEDIN] API_TAVILY_KEY not configured, cannot search LinkedIn")
            return None

        if not email or not email.strip():
            logger.warning("[TAVILY-LINKEDIN] Empty email provided, returning None")
            return None

        search_query = f"linkedin {email.strip()}"
        logger.info(f"[TAVILY-LINKEDIN] Search query: '{search_query}'")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {
                    "query": search_query,
                    "search_depth": "basic",
                    "max_results": 5,
                    "include_answer": True,
                }
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                }

                logger.info(f"[TAVILY-LINKEDIN] Sending POST request to {self.base_url} ...")
                response = await client.post(self.base_url, json=payload, headers=headers)
                logger.info(f"[TAVILY-LINKEDIN] Response status: {response.status_code}")

                if response.status_code != 200:
                    logger.error(
                        f"[TAVILY-LINKEDIN] LinkedIn search returned {response.status_code}, "
                        f"body={response.text[:500]}"
                    )
                    return None

                data = response.json()
                results = data.get("results", [])
                logger.info(
                    f"[TAVILY-LINKEDIN] Response: results={len(results)}, "
                    f"response_time={data.get('response_time', 'N/A')}s"
                )

                if not results:
                    logger.warning(f"[TAVILY-LINKEDIN] No results for '{search_query}'")
                    return None

                # Log all result URLs for debugging
                for i, result in enumerate(results[:5]):
                    url = result.get("url", "")
                    title = result.get("title", "")[:60]
                    score = result.get("score", 0)
                    logger.info(
                        f"[TAVILY-LINKEDIN] Result #{i+1}: url={url} | title={title} | score={score}"
                    )

                # Check result URLs for LinkedIn profile pattern
                # Support country-code subdomains like it.linkedin.com, uk.linkedin.com, etc.
                linkedin_profile_pattern = re.compile(
                    r"https?://(?:[a-z]{2,3}\.)?linkedin\.com/in/[^/?#\s]+", re.IGNORECASE
                )

                for result in results:
                    url = result.get("url", "")
                    match = linkedin_profile_pattern.match(url)
                    if match:
                        linkedin_url = match.group(0)
                        logger.info(
                            f"[TAVILY-LINKEDIN] ✅ Found LinkedIn URL for {email}: {linkedin_url}"
                        )
                        return linkedin_url

                logger.info(
                    f"[TAVILY-LINKEDIN] ❌ No LinkedIn profile URL matched pattern in results for {email}"
                )
                return None

        except httpx.TimeoutException:
            logger.error(f"[TAVILY-LINKEDIN] Timeout searching LinkedIn for {email}")
            return None
        except Exception as e:
            logger.error(f"[TAVILY-LINKEDIN] Error searching LinkedIn for {email}: {e}", exc_info=True)
            return None

    def _format_results(self, results: list, company_name: str, answer: str = "") -> str:
        """
        Format Tavily search results into a readable text format.

        Args:
            results: List of search results from Tavily API
            company_name: Name of the company being searched
            answer: AI-generated answer summary from Tavily (if available)

        Returns:
            Formatted text string with company information
        """
        if not results and not answer:
            return ""

        formatted_parts = []
        formatted_parts.append(f"Company Information for: {company_name}\n")
        formatted_parts.append("=" * 60 + "\n\n")

        # Include Tavily's AI-generated answer if available
        if answer:
            formatted_parts.append(f"Summary: {answer}\n")
            formatted_parts.append("-" * 60 + "\n")

        for i, result in enumerate(results, 1):
            title = result.get("title", "No title")
            url = result.get("url", "")
            content = result.get("content", "No description available")

            formatted_parts.append(f"{i}. {title}\n")
            if url:
                formatted_parts.append(f"   Source: {url}\n")
            formatted_parts.append(f"   {content}\n")
            formatted_parts.append("-" * 60 + "\n")

        return "\n".join(formatted_parts)


# Singleton instance
_tavily_service: Optional[TavilyService] = None


def get_tavily_service() -> TavilyService:
    """Get or create singleton Tavily service instance."""
    global _tavily_service
    if _tavily_service is None:
        _tavily_service = TavilyService()
    return _tavily_service
