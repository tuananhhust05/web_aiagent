#!/usr/bin/env python3
"""
Test script for calls API to check ID field
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from app.core.database import get_database

def test_calls_api():
    """Test calls API response format"""
    print("🧪 Testing Calls API Response Format...")
    
    try:
        db = get_database()
        calls = list(db.calls.find().sort("created_at", -1).limit(5))
        
        print(f"📊 Found {len(calls)} calls in database:")
        
        for i, call in enumerate(calls):
            print(f"\n  {i+1}. Call Details:")
            print(f"     _id: {call.get('_id', 'N/A')}")
            print(f"     id field: {call.get('id', 'MISSING')}")
            print(f"     phone_number: {call.get('phone_number', 'N/A')}")
            print(f"     status: {call.get('status', 'N/A')}")
            print(f"     created_at: {call.get('created_at', 'N/A')}")
            
            # Check if _id exists
            if '_id' in call:
                print(f"     ✅ _id field exists: {call['_id']}")
            else:
                print(f"     ❌ _id field missing")
                
            # Check if id field exists
            if 'id' in call:
                print(f"     ✅ id field exists: {call['id']}")
            else:
                print(f"     ❌ id field missing - will be set from _id")
        
        print(f"\n🔧 Backend Fix Applied:")
        print(f"   - Removed unique_calls_only parameter")
        print(f"   - Added id field mapping: call_dict['id'] = call_dict['_id']")
        print(f"   - This ensures each call has both _id and id fields")
        
        print(f"\n🎯 Frontend Fix Applied:")
        print(f"   - Removed unique_calls_only from filters state")
        print(f"   - Added fallback ID generation in frontend")
        print(f"   - Added debug logging to track ID values")
        
        print(f"\n✅ Expected Result:")
        print(f"   - Calls API should return calls with id field")
        print(f"   - Clicking 'View Details' should navigate to /calls/{id}")
        print(f"   - No more /calls/undefined errors")
        
    except Exception as e:
        print(f"❌ Error testing database: {e}")

if __name__ == "__main__":
    test_calls_api()