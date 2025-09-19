#!/usr/bin/env python3
"""
Test script to verify call functionality
"""

import requests
import json
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from app.core.config import settings

BASE_URL = "http://localhost:8000"

def test_call_creation():
    """Test creating a call record"""
    print("🧪 Testing Call Creation...")
    
    # Test data
    call_data = {
        "phone_number": "+1234567890",
        "agent_name": "Manual Call",
        "call_type": "outbound",
        "duration": 0,
        "status": "completed",
        "meeting_booked": False,
        "notes": "Call to John Doe"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/calls/",
            json=call_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            call = response.json()
            print(f"✅ Call created successfully!")
            print(f"   Call ID: {call.get('id')}")
            print(f"   Phone: {call.get('phone_number')}")
            print(f"   Status: {call.get('status')}")
            print(f"   Notes: {call.get('notes')}")
            return call.get('id')
        else:
            print(f"❌ Failed to create call: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating call: {e}")
        return None

def test_get_calls():
    """Test getting calls list"""
    print("\n🧪 Testing Get Calls...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/calls/")
        
        if response.status_code == 200:
            calls = response.json()
            print(f"✅ Retrieved {len(calls)} calls")
            for call in calls[:3]:  # Show first 3 calls
                print(f"   - {call.get('phone_number')} | {call.get('status')} | {call.get('notes')}")
        else:
            print(f"❌ Failed to get calls: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error getting calls: {e}")

def test_get_kpi_summary():
    """Test getting KPI summary"""
    print("\n🧪 Testing KPI Summary...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/calls/kpis/summary")
        
        if response.status_code == 200:
            kpis = response.json()
            print(f"✅ Retrieved KPI summary:")
            print(f"   Total Calls: {kpis.get('total_calls', 0)}")
            print(f"   Success Rate: {kpis.get('success_rate', 0):.1f}%")
            print(f"   Avg Duration: {kpis.get('avg_duration', 0):.1f}s")
            print(f"   Meetings Booked: {kpis.get('meetings_booked', 0)}")
        else:
            print(f"❌ Failed to get KPI summary: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error getting KPI summary: {e}")

def main():
    print("🚀 Testing Call Functionality")
    print("=" * 50)
    
    # Test call creation
    call_id = test_call_creation()
    
    # Test getting calls
    test_get_calls()
    
    # Test KPI summary
    test_get_kpi_summary()
    
    print("\n" + "=" * 50)
    print("✅ Call functionality test completed!")
    
    if call_id:
        print(f"\n💡 You can view the call details at: {BASE_URL}/api/calls/{call_id}")
        print(f"💡 You can view all calls at: {BASE_URL}/api/calls/")
        print(f"💡 You can view KPI summary at: {BASE_URL}/api/calls/kpis/summary")

if __name__ == "__main__":
    main()


