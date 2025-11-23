#!/usr/bin/env python3
"""
Quick test to check deals import
"""

try:
    from app.routers.deals import router
    print("✅ Deals router imported successfully")
    print(f"Router has {len(router.routes)} routes")
    
    from main import app
    print("✅ Main app imported successfully")
    
    deals_routes = [route for route in app.routes if hasattr(route, 'path') and '/deals' in route.path]
    print(f"Found {len(deals_routes)} deals routes in main app")
    
    if len(deals_routes) == 0:
        print("❌ No deals routes found in main app!")
    else:
        print("✅ Deals routes found in main app")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()














