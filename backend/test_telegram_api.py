import requests
import json

# Test data
BASE_URL = "http://localhost:8000"
TEST_CONTACT = {
    "username": "test_user",
    "first_name": "Test",
    "last_name": "User",
    "is_active": True
}

def test_telegram_api():
    print("🧪 Testing Telegram API...")
    
    # You'll need to get a valid auth token first
    # For now, let's just test the endpoints structure
    
    headers = {
        "Content-Type": "application/json",
        # "Authorization": "Bearer YOUR_TOKEN_HERE"  # Add your token here
    }
    
    try:
        # Test GET contacts
        print("\n1. Testing GET /api/telegram/contacts")
        response = requests.get(f"{BASE_URL}/api/telegram/contacts", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
        # Test POST contact (will fail without auth, but we can see the structure)
        print("\n2. Testing POST /api/telegram/contacts")
        response = requests.post(
            f"{BASE_URL}/api/telegram/contacts", 
            headers=headers,
            json=TEST_CONTACT
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
    except Exception as e:
        print(f"❌ Error testing API: {e}")

if __name__ == "__main__":
    test_telegram_api()
