#!/usr/bin/env python3
"""
Test script for Deals API endpoints
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

def test_deals_endpoints():
    """Test all deals API endpoints"""
    client = TestClient(app)
    
    print("🧪 Testing Deals API Endpoints...")
    
    # Test 1: Get deals list (should return 401 without auth)
    print("\n1. Testing GET /api/deals (without auth)...")
    response = client.get("/api/deals?page=1&limit=10")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test 2: Get deals stats (should return 401 without auth)
    print("\n2. Testing GET /api/deals/stats (without auth)...")
    response = client.get("/api/deals/stats")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test 3: Get contacts list (should return 401 without auth)
    print("\n3. Testing GET /api/deals/contacts/list (without auth)...")
    response = client.get("/api/deals/contacts/list")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test 4: Get campaigns list (should return 401 without auth)
    print("\n4. Testing GET /api/deals/campaigns/list (without auth)...")
    response = client.get("/api/deals/campaigns/list")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test 5: Check if routes are registered
    print("\n5. Checking registered routes...")
    routes = [route.path for route in app.routes]
    deals_routes = [route for route in routes if '/deals' in route]
    print(f"   Deals routes found: {deals_routes}")
    
    print("\n✅ API endpoint tests completed!")

if __name__ == "__main__":
    test_deals_endpoints()










