"""
Debug script to check Gmail OAuth status for a user.
Run: python  debug_gmail.py
"""
import asyncio
from pymongo import MongoClient
from bson import ObjectId

MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "agentvoice"

def debug_gmail():
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Get all users with gmail fields
    users = list(db.users.find({}))
    
    print("=" * 80)
    print("GMAIL DEBUG - Checking all users")
    print("=" * 80)
    
    for user in users:
        user_id = user.get("_id")
        email = user.get("email", "N/A")
        
        print(f"\n--- User: {email} (ID: {user_id}, type: {type(user_id).__name__}) ---")
        
        # Gmail fields
        gmail_connected = user.get("google_gmail_connected", False)
        gmail_scope = user.get("google_gmail_scope", "")
        access_token = user.get("google_access_token", "")
        token_expiry = user.get("google_token_expiry", None)
        refresh_token = user.get("google_refresh_token", "")
        gmail_refresh_token = user.get("google_gmail_refresh_token", "")
        
        print(f"  google_gmail_connected: {gmail_connected}")
        print(f"  google_gmail_scope: {gmail_scope}")
        print(f"  google_access_token: {'Yes (' + str(len(access_token)) + ' chars)' if access_token else 'NO'}")
        print(f"  google_token_expiry: {token_expiry}")
        print(f"  google_refresh_token: {'Yes (' + str(len(refresh_token)) + ' chars)' if refresh_token else 'NO'}")
        print(f"  google_gmail_refresh_token: {'Yes (' + str(len(gmail_refresh_token)) + ' chars)' if gmail_refresh_token else 'NO'}")
        
        # Check if has send permission based on scope
        has_send = False
        if gmail_scope:
            has_send = (
                "gmail.modify" in gmail_scope.lower() or
                "gmail.send" in gmail_scope.lower() or
                "gmail.compose" in gmail_scope.lower()
            )
        print(f"  => Has send permission (based on scope): {has_send}")
        
        # All gmail-related fields
        gmail_fields = [k for k in user.keys() if 'gmail' in k.lower() or 'google' in k.lower()]
        print(f"  All Google/Gmail fields: {gmail_fields}")
    
    client.close()

if __name__ == "__main__":
    debug_gmail()
