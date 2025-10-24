#!/usr/bin/env python3
"""
Test only import
"""

import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing import...")
    from app.routers.deals import router
    print("✅ Import successful")
    print(f"Router: {router}")
    print(f"Routes: {len(router.routes)}")
except Exception as e:
    print(f"❌ Import failed: {e}")
    import traceback
    traceback.print_exc()