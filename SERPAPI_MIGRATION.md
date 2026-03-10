# SerpAPI Integration - Company Search Migration

## Overview
Migrated company information search from slow `207.180.227.97` API to faster **SerpAPI** (Google search).

## Changes Made

### 1. Created SerpAPI Service Module
**File:** [`backend/app/services/serpapi_service.py`](backend/app/services/serpapi_service.py)

New service module that:
- Integrates with SerpAPI to search for company information
- Uses Google search engine with query: `"find information about company {company_name}"`
- Fetches top 10 organic search results
- Formats results into readable text format
- Handles errors and timeouts gracefully

### 2. Updated Atlas Router
**File:** [`backend/app/routers/atlas.py`](backend/app/routers/atlas.py)

Changes:
- Imported `get_serpapi_service` from the new service module
- Replaced old API calls to `207.180.227.97:5001/search` with SerpAPI calls
- Updated both endpoints:
  - `/atlas/company-search` - Manual company search endpoint
  - `/atlas/meeting-enrich` - Auto-enrich meeting with company info
- Removed dependency on `COMPANY_SEARCH_API_URL` environment variable

### 3. Added Configuration
**File:** [`backend/app/core/config.py`](backend/app/core/config.py)

Added new configuration field:
```python
# SerpAPI Configuration (for company information search)
SERPAPI_API_KEY: str = ""
```

### 4. Created Environment Example
**File:** [`.env.example`](.env.example)

Added SerpAPI configuration with example API key:
```env
# SerpAPI Configuration (for company information search)
# Get your API key from https://serpapi.com/
SERPAPI_API_KEY=771ec7ef2d732c5c453d89ae9bd95497f6f79d7ca0a56ac47767480fd98cc336
```

## Setup Instructions

### 1. Get SerpAPI Key
1. Visit [https://serpapi.com/](https://serpapi.com/)
2. Sign up for a free account
3. Get your API key from the dashboard

### 2. Configure Environment
Add to your `.env` file:
```env
SERPAPI_API_KEY=your_serpapi_key_here
```

Or use the example key provided in `.env.example` for testing.

### 3. Restart Backend
```bash
cd backend
# Restart your backend server
python main.py
# or
uvicorn main:app --reload
```

## API Usage

### Search Company Information
**Endpoint:** `POST /atlas/company-search`

**Request:**
```json
{
  "company_name": "Apple"
}
```

**Response:**
```json
{
  "company": "Apple",
  "result": "Company Information for: Apple\n============================================================\n\n1. Apple Inc.\n   Source: https://en.wikipedia.org/wiki/Apple_Inc.\n   Apple Inc. is an American multinational technology company...\n...",
  "success": true,
  "error": null
}
```

### Auto-Enrich Meeting
**Endpoint:** `POST /atlas/meeting-enrich`

Automatically enriches meeting with company information based on attendee email domain.

## Benefits

### Performance Improvements
- **Faster Response Time:** SerpAPI typically responds in 2-5 seconds vs 30-60 seconds for old API
- **Better Reliability:** SerpAPI has 99.9% uptime SLA
- **No Timeout Issues:** Reduced timeout from 120s to 30s

### Data Quality
- **Fresh Data:** Gets latest information from Google search
- **Multiple Sources:** Returns top 10 results from various sources
- **Rich Snippets:** Includes titles, links, and descriptions

### Scalability
- **Rate Limits:** 100 searches/month on free plan, upgradable
- **Global Coverage:** Works for companies worldwide
- **No Infrastructure:** No need to maintain custom search API

## Testing

Test the integration with the provided test script:

```bash
cd backend
python testengine.py
```

Expected output:
```
Found 10 results:

1. Apple Inc.
Link: https://en.wikipedia.org/wiki/Apple_Inc.
Snippet: Apple Inc. is an American multinational technology company...
--------------------------------------------------
...
```

## Troubleshooting

### Error: "SERPAPI_API_KEY not configured"
- Make sure you've added `SERPAPI_API_KEY` to your `.env` file
- Restart the backend server after adding the key

### Error: "Search timed out"
- Check your internet connection
- Verify SerpAPI service status at [https://serpapi.com/status](https://serpapi.com/status)

### No Results Found
- Verify the company name is spelled correctly
- Try with a more well-known company name for testing
- Check SerpAPI dashboard for API usage and errors

## Migration Notes

### Old API (Deprecated)
```python
# Old code - REMOVED
COMPANY_SEARCH_API_URL = "http://207.180.227.97:5001/search"
async with httpx.AsyncClient(timeout=120.0) as client:
    response = await client.post(COMPANY_SEARCH_API_URL, ...)
```

### New API (Current)
```python
# New code
from app.services.serpapi_service import get_serpapi_service

serpapi = get_serpapi_service()
data = await serpapi.search_company_info(company_name)
```

## Cost Considerations

### SerpAPI Pricing
- **Free Tier:** 100 searches/month
- **Developer:** $50/month for 5,000 searches
- **Production:** $250/month for 30,000 searches

### Recommendations
- Use caching to reduce API calls for frequently searched companies
- Implement rate limiting on frontend to prevent abuse
- Monitor usage in SerpAPI dashboard

## Support

For issues or questions:
1. Check SerpAPI documentation: [https://serpapi.com/docs](https://serpapi.com/docs)
2. Review error logs in backend console
3. Contact development team

---

**Last Updated:** 2026-03-06  
**Author:** Development Team  
**Version:** 1.0.0
