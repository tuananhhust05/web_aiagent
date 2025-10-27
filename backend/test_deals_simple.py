#!/usr/bin/env python3
"""
Simple test for Deals API
"""

import requests
import json

def test_deals_api():
    """Test deals API endpoints"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Deals API...")
    
    # Test 1: Health check
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
        return
    
    # Test 2: Get deals (should return 401 without auth)
    print("\n2. Testing GET /api/deals (without auth)...")
    try:
        response = requests.get(f"{base_url}/api/deals?page=1&limit=10")
        print(f"   Status: {response.status_code}")
        if response.status_code == 404:
            print("   ❌ 404 Not Found - Router not loaded properly")
        elif response.status_code == 401:
            print("   ✅ 401 Unauthorized - Router working, auth required")
        else:
            print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 3: Check if deals router is loaded
    print("\n3. Testing router loading...")
    try:
        response = requests.get(f"{base_url}/docs")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ API docs accessible")
        else:
            print("   ❌ API docs not accessible")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_deals_api()