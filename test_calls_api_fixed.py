#!/usr/bin/env python3
"""
Test the fixed calls API
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_calls_api_no_filters():
    """Test calls API without any filters"""
    print("🧪 Testing Calls API without filters...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/calls/")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            calls = response.json()
            print(f"✅ Retrieved {len(calls)} calls")
            for call in calls[:3]:
                print(f"   - {call.get('phone_number')} | {call.get('status')} | {call.get('created_at')}")
        else:
            print(f"❌ Failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_calls_api_with_empty_filters():
    """Test calls API with empty filter values"""
    print("\n🧪 Testing Calls API with empty filters...")
    
    try:
        # Test with empty string filters (should work now)
        params = {
            "phone_number": "",
            "start_date": "",
            "end_date": "",
            "agent_name": "",
            "call_type": "",
            "status": "",
            "sentiment": "",
            "unique_calls_only": False,
            "limit": 50,
            "offset": 0
        }
        
        response = requests.get(f"{BASE_URL}/api/calls/", params=params)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            calls = response.json()
            print(f"✅ Retrieved {len(calls)} calls with empty filters")
        else:
            print(f"❌ Failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_calls_api_with_valid_filters():
    """Test calls API with valid filters"""
    print("\n🧪 Testing Calls API with valid filters...")
    
    try:
        params = {
            "phone_number": "123",
            "call_type": "outbound",
            "status": "completed",
            "limit": 10,
            "offset": 0
        }
        
        response = requests.get(f"{BASE_URL}/api/calls/", params=params)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            calls = response.json()
            print(f"✅ Retrieved {len(calls)} calls with filters")
        else:
            print(f"❌ Failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Testing Fixed Calls API")
    print("=" * 50)
    
    test_calls_api_no_filters()
    test_calls_api_with_empty_filters()
    test_calls_api_with_valid_filters()
    
    print("\n" + "=" * 50)
    print("✅ Test completed!")
