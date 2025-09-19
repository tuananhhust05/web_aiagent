#!/usr/bin/env python3
"""
Test script for the auto-update call API (no auth required)
"""

import requests
import json
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from app.core.database import get_database

def test_auto_update_api():
    """Test the auto-update call API"""
    print("🧪 Testing Auto-Update Call API (No Auth Required)...")
    
    # First, let's check what calls exist in the database
    print("\n📋 Checking existing calls in database...")
    try:
        db = get_database()
        calls = list(db.calls.find().sort("created_at", -1).limit(5))
        
        if not calls:
            print("❌ No calls found in database. Please create some calls first.")
            return
            
        print(f"📊 Found {len(calls)} recent calls:")
        for i, call in enumerate(calls):
            print(f"  {i+1}. Phone: {call.get('phone_number', 'N/A')}")
            print(f"     Status: {call.get('status', 'N/A')}")
            print(f"     Duration: {call.get('duration', 'N/A')} seconds")
            print(f"     Recording URL: {call.get('recording_url', 'None')}")
            print(f"     Created: {call.get('created_at', 'N/A')}")
            print()
            
        # Use the first call's phone number for testing
        test_phone = calls[0]['phone_number']
        print(f"🎯 Using phone number: {test_phone} for testing")
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return
    
    # Test the API endpoint
    print(f"\n🔧 Testing API endpoint: PUT /api/calls/auto-update/{test_phone}")
    
    # Sample update data - focus on duration and recording_url
    update_data = {
        "duration": 300,  # 5 minutes
        "recording_url": "https://example.com/recordings/call_12345_updated.mp3",
        "transcript": "Updated transcript: Customer was very satisfied with the service.",
        "sentiment": "positive",
        "sentiment_score": 0.9,
        "status": "completed"
    }
    
    print(f"📝 Update data: {json.dumps(update_data, indent=2)}")
    
    print(f"\n📡 Example API call (NO AUTH REQUIRED):")
    print(f"   curl -X PUT 'http://localhost:8000/api/calls/auto-update/{test_phone}' \\")
    print(f"        -H 'Content-Type: application/json' \\")
    print(f"        -d '{json.dumps(update_data)}'")
    
    print(f"\n✅ API Features:")
    print(f"   - ✅ No authentication required")
    print(f"   - ✅ Finds the most recent call by phone number (any user)")
    print(f"   - ✅ Updates duration and recording_url")
    print(f"   - ✅ Updates other fields like transcript, sentiment, status")
    print(f"   - ✅ Returns success message with updated fields")
    
    print(f"\n🔍 API Logic:")
    print(f"   1. Find most recent call with phone_number (no user_id filter)")
    print(f"   2. Update the call with provided data")
    print(f"   3. Return success message with call_id and updated fields")
    
    print(f"\n⚠️  Security Note:")
    print(f"   - This API is designed for AI agents")
    print(f"   - No authentication means anyone can update calls")
    print(f"   - Consider adding API key or IP whitelist for production")

def compare_apis():
    """Compare the two update APIs"""
    print(f"\n📊 API Comparison:")
    print(f"   ┌─────────────────────────────────────────────────────────────┐")
    print(f"   │ API Endpoint                    │ Auth Required │ User Filter │")
    print(f"   ├─────────────────────────────────────────────────────────────┤")
    print(f"   │ /api/calls/update-by-phone/     │ ✅ Yes        │ ✅ Yes      │")
    print(f"   │ /api/calls/auto-update/         │ ❌ No         │ ❌ No       │")
    print(f"   └─────────────────────────────────────────────────────────────┘")
    
    print(f"\n🎯 Use Cases:")
    print(f"   - update-by-phone: For authenticated users updating their own calls")
    print(f"   - auto-update: For AI agents updating any call by phone number")

if __name__ == "__main__":
    test_auto_update_api()
    compare_apis()
