"""
Simple test to verify SerpAPI integration
"""
import asyncio
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_serpapi():
    """Test SerpAPI service"""
    from app.services.serpapi_service import get_serpapi_service
    
    print("=" * 60)
    print("Testing SerpAPI Integration")
    print("=" * 60)
    
    serpapi = get_serpapi_service()
    
    # Test 1: Check API key
    print(f"\n1. API Key configured: {'Yes' if serpapi.api_key else 'No'}")
    if serpapi.api_key:
        print(f"   API Key: {serpapi.api_key[:20]}...{serpapi.api_key[-10:]}")
    else:
        print("   ERROR: API Key not found!")
        return
    
    # Test 2: Search for a company
    print(f"\n2. Searching for company: Apple")
    try:
        result = await serpapi.search_company_info("Apple")
        print(f"   [OK] Search successful!")
        print(f"   Company: {result['company']}")
        print(f"   Result length: {len(result['result'])} characters")
        print(f"\n   First 500 characters of result:")
        print(f"   {result['result'][:500]}...")
    except Exception as e:
        print(f"   [ERROR] Search failed!")
        print(f"   Error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(test_serpapi())
