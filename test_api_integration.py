#!/usr/bin/env python3
"""
Test script to verify API integration
"""
import requests
import json
from datetime import datetime

# Test data
BASE_URL = "http://localhost:8000"
TEST_USER = {
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpassword123",
    "company_name": "Test Company"
}

def test_api_integration():
    """Test the complete API integration"""
    print("🧪 Testing API Integration...")
    
    # Test 1: Health check
    print("\n1. Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return
    
    # Test 2: Register user
    print("\n2. Testing user registration...")
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json=TEST_USER)
        if response.status_code == 200:
            print("✅ User registration passed")
            token_data = response.json()
            token = token_data["access_token"]
            print(f"   Token: {token[:20]}...")
        else:
            print(f"❌ User registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ User registration error: {e}")
        return
    
    # Test 3: Get KPI summary
    print("\n3. Testing KPI summary...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/calls/kpis/summary", headers=headers)
        if response.status_code == 200:
            print("✅ KPI summary passed")
            kpi_data = response.json()
            print(f"   Total calls: {kpi_data['total_calls']}")
            print(f"   Success rate: {kpi_data['call_success_rate']}%")
        else:
            print(f"❌ KPI summary failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ KPI summary error: {e}")
    
    # Test 4: Get calls list
    print("\n4. Testing calls list...")
    try:
        response = requests.get(f"{BASE_URL}/api/calls", headers=headers)
        if response.status_code == 200:
            print("✅ Calls list passed")
            calls_data = response.json()
            print(f"   Found {len(calls_data)} calls")
        else:
            print(f"❌ Calls list failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Calls list error: {e}")
    
    # Test 5: Create a test call
    print("\n5. Testing call creation...")
    try:
        test_call = {
            "phone_number": "+1234567890",
            "agent_name": "Test Agent",
            "call_type": "outbound",
            "duration": 120,
            "status": "completed",
            "sentiment": "positive",
            "sentiment_score": 0.8,
            "feedback": "Test call feedback",
            "meeting_booked": True
        }
        response = requests.post(f"{BASE_URL}/api/calls", json=test_call, headers=headers)
        if response.status_code == 200:
            print("✅ Call creation passed")
            call_data = response.json()
            print(f"   Call ID: {call_data['id']}")
        else:
            print(f"❌ Call creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Call creation error: {e}")
    
    print("\n🎉 API integration test completed!")

if __name__ == "__main__":
    test_api_integration()


