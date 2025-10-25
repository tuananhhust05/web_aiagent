#!/usr/bin/env python3
"""
Simple test for deals API without starting server
"""

import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_deals_import():
    """Test if deals can be imported"""
    try:
        print("🔧 Testing deals import...")
        
        # Test import
        from app.routers.deals import router
        print("✅ Deals router imported successfully")
        
        # Check routes
        print(f"📋 Router has {len(router.routes)} routes:")
        for route in router.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                methods = list(route.methods) if route.methods else []
                print(f"   {methods} {route.path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error importing deals: {e}")
        return False

def test_main_app():
    """Test if main app includes deals"""
    try:
        print("\n🔧 Testing main app...")
        
        from main import app
        print("✅ Main app imported successfully")
        
        # Check if deals routes are in app
        deals_routes = []
        for route in app.routes:
            if hasattr(route, 'path') and '/deals' in route.path:
                deals_routes.append(route)
        
        print(f"📋 Found {len(deals_routes)} deals routes in main app:")
        for route in deals_routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                methods = list(route.methods) if route.methods else []
                print(f"   {methods} {route.path}")
        
        return len(deals_routes) > 0
        
    except Exception as e:
        print(f"❌ Error testing main app: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing Deals API Setup...")
    
    # Test 1: Import deals router
    deals_ok = test_deals_import()
    
    # Test 2: Check main app
    app_ok = test_main_app()
    
    if deals_ok and app_ok:
        print("\n✅ All tests passed! Deals API should be working.")
        print("💡 If you still get 404, try restarting the server.")
    else:
        print("\n❌ Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()




