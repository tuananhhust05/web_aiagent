#!/usr/bin/env python3
"""
Test if deals module can be imported correctly
"""

try:
    print("🔧 Testing imports...")
    
    # Test 1: Import deals router
    print("1. Importing deals router...")
    from app.routers import deals
    print("   ✅ Deals router imported successfully")
    
    # Test 2: Import deals models
    print("2. Importing deals models...")
    from app.models.deal import DealCreate, DealResponse, DealStats
    print("   ✅ Deals models imported successfully")
    
    # Test 3: Check router instance
    print("3. Checking router instance...")
    print(f"   Router: {deals.router}")
    print(f"   Router routes: {len(deals.router.routes)}")
    
    # Test 4: Check main app
    print("4. Checking main app...")
    from main import app
    print(f"   App routes: {len(app.routes)}")
    
    # Find deals routes
    deals_routes = [route for route in app.routes if hasattr(route, 'path') and '/deals' in route.path]
    print(f"   Deals routes in app: {len(deals_routes)}")
    
    for route in deals_routes:
        print(f"     {route.path}")
    
    print("\n✅ All imports successful!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")













