#!/usr/bin/env python3
"""
Simple test to check if deals can be imported
"""

try:
    print("Testing deals import...")
    
    # Test 1: Import deals router
    from app.routers.deals import router
    print("✅ Deals router imported successfully")
    
    # Test 2: Check router routes
    print(f"Router has {len(router.routes)} routes:")
    for route in router.routes:
        if hasattr(route, 'path'):
            print(f"  {route.path}")
    
    # Test 3: Import main app
    from main import app
    print("✅ Main app imported successfully")
    
    # Test 4: Check if deals routes are in main app
    deals_routes = [route for route in app.routes if hasattr(route, 'path') and '/deals' in route.path]
    print(f"Found {len(deals_routes)} deals routes in main app:")
    for route in deals_routes:
        print(f"  {route.path}")
    
    print("\n✅ All tests passed!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()











