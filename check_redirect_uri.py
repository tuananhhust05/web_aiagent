#!/usr/bin/env python3
"""
Check redirect URI configuration
"""

import sys
import os
sys.path.append('backend')

from app.core.config import settings
from app.services.google_auth import google_auth_service

print("🔍 Checking redirect URI configuration...")
print("=" * 50)

print(f"📋 Config redirect URI: {settings.GOOGLE_REDIRECT_URI}")
print(f"📋 Service redirect URI: {google_auth_service.redirect_uri}")

# Generate auth URL
auth_url = google_auth_service.get_google_auth_url('test_state')
print(f"📋 Generated auth URL: {auth_url}")

# Parse redirect URI from URL
from urllib.parse import urlparse, parse_qs
parsed = urlparse(auth_url)
params = parse_qs(parsed.query)

if 'redirect_uri' in params:
    actual_redirect_uri = params['redirect_uri'][0]
    print(f"📋 Actual redirect URI in URL: {actual_redirect_uri}")
    
    if actual_redirect_uri == settings.GOOGLE_REDIRECT_URI:
        print("✅ Redirect URI matches configuration")
    else:
        print("❌ Redirect URI mismatch!")
        print(f"   Config: {settings.GOOGLE_REDIRECT_URI}")
        print(f"   URL:    {actual_redirect_uri}")
else:
    print("❌ No redirect_uri found in auth URL")

print("\n📋 Google Cloud Console should have:")
print(f"   Authorized redirect URIs: {settings.GOOGLE_REDIRECT_URI}")
print(f"   Authorized JavaScript origins: https://forskale.com")

