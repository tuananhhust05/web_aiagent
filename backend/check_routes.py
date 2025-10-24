#!/usr/bin/env python3
"""
Check if deals routes are properly registered
"""

import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app

def check_routes():
    """Check registered routes"""
    print("🔍 Checking registered routes...")
    
    routes = []
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            routes.append({
                'path': route.path,
                'methods': list(route.methods) if route.methods else []
            })
    
    print(f"\n📋 Total routes: {len(routes)}")
    
    # Find deals routes
    deals_routes = [route for route in routes if '/deals' in route['path']]
    
    print(f"\n🎯 Deals routes found: {len(deals_routes)}")
    for route in deals_routes:
        print(f"   {route['methods']} {route['path']}")
    
    # Check if deals router is imported
    print(f"\n🔧 Checking imports...")
    try:
        from app.routers import deals
        print("   ✅ deals router imported successfully")
    except ImportError as e:
        print(f"   ❌ Failed to import deals router: {e}")
    
    # Check if deals models are imported
    try:
        from app.models.deal import DealCreate, DealResponse
        print("   ✅ deals models imported successfully")
    except ImportError as e:
        print(f"   ❌ Failed to import deals models: {e}")

if __name__ == "__main__":
    check_routes()
