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
