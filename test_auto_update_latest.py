#!/usr/bin/env python3
"""
Test script for the new auto-update-latest API endpoint
"""

import requests
import json
from datetime import datetime

# API endpoint
API_BASE = "https://4skale.com"
ENDPOINT = f"{API_BASE}/api/calls/auto-update-latest"

# Test data
test_data = {
    "duration": 120,  # 2 minutes
    "recording_url": "https://example.com/recording/audio_123.mp3",
    "transcript": "This is a test transcript for the latest call.",
    "sentiment": "positive",
    "sentiment_score": 0.85,
    "status": "completed",
    "meeting_booked": True,
    "notes": "Test update via auto-update-latest API"
}

def test_auto_update_latest():
    """Test the auto-update-latest endpoint"""
    print("🧪 Testing auto-update-latest API endpoint...")
    print(f"📍 Endpoint: {ENDPOINT}")
    print(f"📊 Test data: {json.dumps(test_data, indent=2)}")
    print("-" * 50)
    
    try:
        # Make the request
        response = requests.put(
            ENDPOINT,
            json=test_data,
            headers={
                "Content-Type": "application/json"
            },
            timeout=30
        )
        
        print(f"📡 Status Code: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS!")
            print(f"📋 Response: {json.dumps(result, indent=2)}")
            
            # Verify the response structure
            expected_fields = ["message", "call_id", "phone_number", "updated_fields"]
            for field in expected_fields:
                if field in result:
                    print(f"✅ {field}: {result[field]}")
                else:
                    print(f"❌ Missing field: {field}")
                    
        elif response.status_code == 404:
            print("❌ NOT FOUND - No calls in database")
            print(f"📄 Response: {response.text}")
            
        else:
            print(f"❌ ERROR - Status: {response.status_code}")
            print(f"📄 Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ REQUEST ERROR: {e}")
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")

def test_with_different_data():
    """Test with different update data"""
    print("\n" + "="*50)
    print("🧪 Testing with different data...")
    
    # Test with minimal data
    minimal_data = {
        "duration": 60,
        "status": "completed"
    }
    
    print(f"📊 Minimal test data: {json.dumps(minimal_data, indent=2)}")
    
    try:
        response = requests.put(
            ENDPOINT,
            json=minimal_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"📡 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS with minimal data!")
            print(f"📋 Response: {json.dumps(result, indent=2)}")
        else:
            print(f"❌ ERROR: {response.status_code}")
            print(f"📄 Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    print("🚀 Starting auto-update-latest API tests...")
    print(f"⏰ Test started at: {datetime.now()}")
    print("="*60)
    
    # Test 1: Full data update
    test_auto_update_latest()
    
    # Test 2: Minimal data update
    test_with_different_data()
    
    print("\n" + "="*60)
    print("🏁 Tests completed!")
    print(f"⏰ Test finished at: {datetime.now()}")
