#!/usr/bin/env python3
"""
Simple test to check if deals API is working
"""

import requests
import json

def test_deals_api():
    """Test deals API endpoints"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Deals API...")
    
    # Test endpoints
    endpoints = [
        "/api/deals",
        "/api/deals/stats", 
        "/api/deals/contacts/list",
        "/api/deals/campaigns/list"
    ]
    
    for endpoint in endpoints:
        try:
            print(f"\n📡 Testing {endpoint}...")
            response = requests.get(f"{base_url}{endpoint}")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 401:
                print("   ✅ Endpoint exists (401 Unauthorized - expected without auth)")
            elif response.status_code == 404:
                print("   ❌ Endpoint not found (404)")
            else:
                print(f"   Response: {response.text[:200]}...")
                
        except requests.exceptions.ConnectionError:
            print("   ❌ Connection failed - is the server running?")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n✅ API test completed!")

if __name__ == "__main__":
    test_deals_api()






