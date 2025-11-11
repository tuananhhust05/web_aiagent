#!/usr/bin/env python3
"""
Minimal test to check deals import
"""

import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_minimal():
    """Minimal test"""
    try:
        print("🔧 Testing minimal import...")
        
        # Test 1: Import just the router
        from app.routers.deals import router
        print("✅ Deals router imported")
        
        # Test 2: Check if router has routes
        print(f"📋 Router has {len(router.routes)} routes")
        
        # Test 3: List all routes
        for i, route in enumerate(router.routes):
            if hasattr(route, 'path'):
                print(f"   {i+1}. {route.path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_minimal()










