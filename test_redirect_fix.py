#!/usr/bin/env python3
"""
Test script to verify the redirect fix for FastAPI endpoints
"""

import requests
import json

def test_api_endpoints():
    """Test various API endpoints to check for redirects"""
    base_url = "https://4skale.com"
    
    print("🧪 Testing API Endpoints for Redirect Issues...")
    print(f"Base URL: {base_url}")
    
    # Test endpoints
    endpoints = [
        "/api/contacts",
        "/api/contacts/",
        "/api/calls",
        "/api/calls/",
        "/api/auth/register",
        "/api/users",
        "/health"
    ]
    
    for endpoint in endpoints:
        url = f"{base_url}{endpoint}"
        print(f"\n🔍 Testing: {url}")
        
        try:
            # Test GET request
            response = requests.get(url, timeout=10, allow_redirects=False)
            
            print(f"   Status: {response.status_code}")
            print(f"   Headers: {dict(response.headers)}")
            
            if response.status_code == 307:
                print(f"   ❌ REDIRECT DETECTED!")
                if 'Location' in response.headers:
                    print(f"   Redirects to: {response.headers['Location']}")
            elif response.status_code in [200, 401, 422]:  # 401 = auth required, 422 = validation error
                print(f"   ✅ No redirect (expected status)")
            else:
                print(f"   ⚠️  Unexpected status: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Error: {e}")
    
    print(f"\n📋 Summary:")
    print(f"   - Status 307 = Temporary Redirect (problem)")
    print(f"   - Status 200 = Success")
    print(f"   - Status 401 = Authentication required (normal)")
    print(f"   - Status 422 = Validation error (normal)")

def test_specific_contacts_endpoint():
    """Test the specific contacts endpoint that was causing issues"""
    print(f"\n🎯 Testing Specific Contacts Endpoint...")
    
    # Test with search parameter
    url = "https://4skale.com/api/contacts?search="
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=10, allow_redirects=False)
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 307:
            print("❌ Still getting redirect!")
        else:
            print("✅ No redirect!")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_api_endpoints()
    test_specific_contacts_endpoint()
