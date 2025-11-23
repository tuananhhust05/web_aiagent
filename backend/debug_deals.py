#!/usr/bin/env python3
"""
Debug deals import issue
"""

import sys
import os
import traceback

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def debug_imports():
    """Debug import issues step by step"""
    print("🔍 Debugging deals import...")
    
    try:
        print("1. Testing app import...")
        import app
        print("   ✅ app imported")
    except Exception as e:
        print(f"   ❌ app import failed: {e}")
        traceback.print_exc()
        return
    
    try:
        print("2. Testing app.routers import...")
        import app.routers
        print("   ✅ app.routers imported")
    except Exception as e:
        print(f"   ❌ app.routers import failed: {e}")
        traceback.print_exc()
        return
    
    try:
        print("3. Testing app.models import...")
        import app.models
        print("   ✅ app.models imported")
    except Exception as e:
        print(f"   ❌ app.models import failed: {e}")
        traceback.print_exc()
        return
    
    try:
        print("4. Testing app.models.deal import...")
        from app.models.deal import DealCreate, DealResponse
        print("   ✅ app.models.deal imported")
    except Exception as e:
        print(f"   ❌ app.models.deal import failed: {e}")
        traceback.print_exc()
        return
    
    try:
        print("5. Testing app.routers.deals import...")
        from app.routers.deals import router
        print("   ✅ app.routers.deals imported")
        print(f"   Router routes: {len(router.routes)}")
    except Exception as e:
        print(f"   ❌ app.routers.deals import failed: {e}")
        traceback.print_exc()
        return
    
    try:
        print("6. Testing main import...")
        from main import app
        print("   ✅ main imported")
        
        # Check deals routes
        deals_routes = [route for route in app.routes if hasattr(route, 'path') and '/deals' in route.path]
        print(f"   Deals routes in main app: {len(deals_routes)}")
        
        for route in deals_routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                methods = list(route.methods) if route.methods else []
                print(f"     {methods} {route.path}")
        
    except Exception as e:
        print(f"   ❌ main import failed: {e}")
        traceback.print_exc()
        return
    
    print("\n✅ All imports successful!")

if __name__ == "__main__":
    debug_imports()














