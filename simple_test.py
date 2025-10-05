#!/usr/bin/env python3
"""
Simple test to check redirect URI
"""

# Test the current redirect URI
redirect_uri = "https://4skale.com:8000/api/auth/login/google"

print("🔍 Current redirect URI configuration:")
print(f"📋 Backend redirect URI: {redirect_uri}")

print("\n📋 Google Cloud Console should have:")
print(f"   Authorized redirect URIs: {redirect_uri}")
print(f"   Authorized JavaScript origins: https://4skale.com")

print("\n🔍 Common redirect URI issues:")
print("1. Missing /api prefix in Google Console")
print("2. Wrong port (8000 vs 3000)")
print("3. HTTP vs HTTPS mismatch")
print("4. Trailing slash differences")

print("\n📋 Try these redirect URIs in Google Console:")
print("   https://4skale.com:8000/api/auth/login/google")
print("   https://4skale.com:8000/auth/login/google")
print("   https://4skale.com:3000/api/auth/login/google")
print("   https://4skale.com:3000/auth/login/google")

