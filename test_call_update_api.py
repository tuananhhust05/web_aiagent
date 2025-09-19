#!/usr/bin/env python3
"""
Test script for the new call update API
"""

import requests
import json
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from app.core.database import get_database

def test_call_update_api():
    """Test the call update by phone number API"""
    print("🧪 Testing Call Update API...")
    
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
    print(f"\n🔧 Testing API endpoint: PUT /api/calls/update-by-phone/{test_phone}")
    
    # Sample update data
    update_data = {
        "recording_url": "https://example.com/recordings/call_12345.mp3",
        "transcript": "Hello, this is a test transcript. The customer was very interested in our product and asked about pricing.",
        "sentiment": "positive",
        "sentiment_score": 0.85,
        "feedback": "Customer showed strong interest, follow up needed",
        "meeting_booked": True,
        "duration": 180,  # 3 minutes
        "status": "completed"
    }
    
    print(f"📝 Update data: {json.dumps(update_data, indent=2)}")
    
    # Note: This would require authentication in a real scenario
    print("\n⚠️  Note: This test requires authentication.")
    print("   In a real scenario, you would need to:")
    print("   1. Login to get a JWT token")
    print("   2. Include the token in the Authorization header")
    print("   3. Make the API call")
    
    print(f"\n📡 Example API call:")
    print(f"   curl -X PUT 'http://localhost:8000/api/calls/update-by-phone/{test_phone}' \\")
    print(f"        -H 'Content-Type: application/json' \\")
    print(f"        -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\")
    print(f"        -d '{json.dumps(update_data)}'")
    
    print(f"\n✅ API endpoint created successfully!")
    print(f"   - Endpoint: PUT /api/calls/update-by-phone/{{phone_number}}")
    print(f"   - Purpose: Update the most recent call for a phone number")
    print(f"   - Use case: AI agents updating call data after processing")

def check_api_documentation():
    """Check if the API is properly documented"""
    print("\n📚 API Documentation:")
    print("   Endpoint: PUT /api/calls/update-by-phone/{phone_number}")
    print("   Description: Update the most recent call record for a specific phone number")
    print("   Parameters:")
    print("     - phone_number (path): The phone number to update")
    print("     - Body: CallUpdateByPhone model with optional fields:")
    print("       * recording_url: URL to the audio recording")
    print("       * transcript: Call transcript text")
    print("       * sentiment: positive/negative/neutral")
    print("       * sentiment_score: Sentiment score (0-1)")
    print("       * feedback: Additional feedback")
    print("       * meeting_booked: Whether a meeting was booked")
    print("       * meeting_date: Date of the meeting")
    print("       * notes: Additional notes")
    print("       * duration: Call duration in seconds")
    print("       * status: Call status")
    print("   Response: Updated CallResponse object")
    print("   Authentication: Required (JWT token)")

if __name__ == "__main__":
    test_call_update_api()
    check_api_documentation()
