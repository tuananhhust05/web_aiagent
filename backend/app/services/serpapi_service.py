"""
SerpAPI service for company information search.
Replaces the slow 207.180.227.97 API with faster SerpAPI Google search.
"""

import httpx
from typing import Optional, Dict, Any
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class SerpAPIService:
    """Service to search for company information using SerpAPI."""
    
    def __init__(self):
        """Initialize SerpAPI service with API key from settings."""
        self.api_key = settings.SERPAPI_API_KEY
        self.base_url = "https://serpapi.com/search"
        
        if not self.api_key:
            logger.warning("[SERPAPI] SERPAPI_API_KEY not configured in settings")
    
    async def search_company_info(self, company_name: str) -> Dict[str, Any]:
        """
        Search for company information using SerpAPI.
        
        Args:
            company_name: Name of the company to search for
            
        Returns:
            Dict with 'company' and 'result' keys containing company name and search results
            
        Raises:
            Exception: If API key is missing or API call fails
        """
        if not self.api_key:
            raise Exception("SERPAPI_API_KEY not configured in environment variables")
        
        if not company_name or not company_name.strip():
            raise ValueError("Company name cannot be empty")
        
        company_name = company_name.strip()
        
        # Construct search query to find company information
        search_query = f"find information about company {company_name}"
        
        logger.info(f"[SERPAPI] Searching for company: {company_name}")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {
                    "engine": "google",
                    "q": search_query,
                    "api_key": self.api_key,
                    "num": 10,  # Number of results to fetch
                }
                
                response = await client.get(self.base_url, params=params)
                
                if response.status_code != 200:
                    logger.error(f"[SERPAPI] API returned {response.status_code}: {response.text}")
                    raise Exception(f"SerpAPI returned status {response.status_code}")
                
                data = response.json()
                
                # Extract organic results
                organic_results = data.get("organic_results", [])
                
                if not organic_results:
                    logger.warning(f"[SERPAPI] No results found for company: {company_name}")
                    return {
                        "company": company_name,
                        "result": ""
                    }
                
                # Format results into a text string similar to the old API format
                result_text = self._format_results(organic_results, company_name)
                
                logger.info(f"[SERPAPI] Found {len(organic_results)} results for {company_name}: {len(result_text)} chars")
                
                return {
                    "company": company_name,
                    "result": result_text
                }
                
        except httpx.TimeoutException:
            logger.error(f"[SERPAPI] Timeout searching for {company_name}")
            raise Exception("Search timed out. Please try again.")
        except Exception as e:
            logger.error(f"[SERPAPI] Error searching for {company_name}: {str(e)}")
            raise
    
    async def search_linkedin_url(self, email: str) -> Optional[str]:
        """
        Search for a LinkedIn profile URL by email using SerpAPI.
        Query: "linkedin {email}"
        Returns the first result URL if it matches linkedin.com/in/{username}, else None.
        """
        logger.info(f"[SERPAPI-LINKEDIN] >>> search_linkedin_url called with email={email}")
        logger.info(f"[SERPAPI-LINKEDIN] api_key configured = {bool(self.api_key)}, "
                     f"key_prefix = {self.api_key[:8] + '...' if self.api_key else 'EMPTY'}")

        if not self.api_key:
            logger.warning("[SERPAPI-LINKEDIN] SERPAPI_API_KEY not configured, cannot search LinkedIn")
            return None

        if not email or not email.strip():
            logger.warning("[SERPAPI-LINKEDIN] Empty email provided, returning None")
            return None

        search_query = f"linkedin {email.strip()}"
        logger.info(f"[SERPAPI-LINKEDIN] Search query: '{search_query}'")
        logger.info(f"[SERPAPI-LINKEDIN] Base URL: {self.base_url}")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {
                    "engine": "google",
                    "q": search_query,
                    "api_key": self.api_key,
                    "num": 5,
                }
                logger.info(f"[SERPAPI-LINKEDIN] Sending GET request to {self.base_url} ...")
                response = await client.get(self.base_url, params=params)
                logger.info(f"[SERPAPI-LINKEDIN] Response status: {response.status_code}")

                if response.status_code != 200:
                    logger.error(f"[SERPAPI-LINKEDIN] LinkedIn search returned {response.status_code}, "
                                 f"body={response.text[:500]}")
                    return None

                data = response.json()
                organic_results = data.get("organic_results", [])
                search_info = data.get("search_information", {})
                logger.info(f"[SERPAPI-LINKEDIN] Response: organic_results={len(organic_results)}, "
                            f"total_results={search_info.get('total_results', 'N/A')}, "
                            f"time_taken={search_info.get('time_taken_displayed', 'N/A')}")

                if not organic_results:
                    logger.warning(f"[SERPAPI-LINKEDIN] No organic results for '{search_query}'")
                    # Log what keys the response has for debugging
                    logger.debug(f"[SERPAPI-LINKEDIN] Response keys: {list(data.keys())}")
                    return None

                # Log all result links for debugging
                for i, result in enumerate(organic_results[:5]):
                    link = result.get("link", "")
                    title = result.get("title", "")[:60]
                    logger.info(f"[SERPAPI-LINKEDIN] Result #{i+1}: link={link} | title={title}")

                # Check the first result link
                # Support country-code subdomains like it.linkedin.com, uk.linkedin.com, etc.
                import re
                linkedin_profile_pattern = re.compile(
                    r"https?://(?:[a-z]{2,3}\.)?linkedin\.com/in/[^/?#\s]+", re.IGNORECASE
                )

                for result in organic_results:
                    link = result.get("link", "")
                    match = linkedin_profile_pattern.match(link)
                    if match:
                        linkedin_url = match.group(0)
                        logger.info(f"[SERPAPI-LINKEDIN] ✅ Found LinkedIn URL for {email}: {linkedin_url}")
                        return linkedin_url

                logger.info(f"[SERPAPI-LINKEDIN] ❌ No LinkedIn profile URL matched pattern in results for {email}")
                return None

        except httpx.TimeoutException:
            logger.error(f"[SERPAPI-LINKEDIN] Timeout searching LinkedIn for {email}")
            return None
        except Exception as e:
            logger.error(f"[SERPAPI-LINKEDIN] Error searching LinkedIn for {email}: {e}", exc_info=True)
            return None

    def _format_results(self, organic_results: list, company_name: str) -> str:
        """
        Format organic search results into a readable text format.
        
        Args:
            organic_results: List of organic search results from SerpAPI
            company_name: Name of the company being searched
            
        Returns:
            Formatted text string with company information
        """
        if not organic_results:
            return ""
        
        formatted_parts = []
        formatted_parts.append(f"Company Information for: {company_name}\n")
        formatted_parts.append("=" * 60 + "\n\n")
        
        for i, result in enumerate(organic_results, 1):
            title = result.get("title", "No title")
            link = result.get("link", "")
            snippet = result.get("snippet", "No description available")
            
            formatted_parts.append(f"{i}. {title}\n")
            if link:
                formatted_parts.append(f"   Source: {link}\n")
            formatted_parts.append(f"   {snippet}\n")
            formatted_parts.append("-" * 60 + "\n")
        
        return "\n".join(formatted_parts)


# Singleton instance
_serpapi_service: Optional[SerpAPIService] = None


def get_serpapi_service() -> SerpAPIService:
    """Get or create singleton SerpAPI service instance."""
    global _serpapi_service
    if _serpapi_service is None:
        _serpapi_service = SerpAPIService()
    return _serpapi_service
