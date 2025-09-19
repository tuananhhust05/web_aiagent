#!/usr/bin/env python3
"""
Check calls data in database
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from app.core.database import get_database

def check_calls_data():
    """Check calls data in database"""
    print("🔍 Checking calls data in database...")
    
    try:
        db = get_database()
        calls = list(db.calls.find())
        
        print(f"📊 Total calls in database: {len(calls)}")
        
        if calls:
            print("\n📋 Recent calls:")
            for i, call in enumerate(calls[:10]):
                print(f"  {i+1}. Phone: {call.get('phone_number', 'N/A')}")
                print(f"     Status: {call.get('status', 'N/A')}")
                print(f"     Agent: {call.get('agent_name', 'N/A')}")
                print(f"     Created: {call.get('created_at', 'N/A')}")
                print(f"     User ID: {call.get('user_id', 'N/A')}")
                print()
        else:
            print("❌ No calls found in database")
            
    except Exception as e:
        print(f"❌ Error checking database: {e}")

if __name__ == "__main__":
    check_calls_data()


