#!/usr/bin/env python3
"""
Test script to verify contact creation functionality
"""
import requests
import json

# Test data
BASE_URL = "http://localhost:8000"
TEST_USER = {
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpassword123",
    "company_name": "Test Company"
}

TEST_CONTACT = {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "company": "Acme Corp",
    "job_title": "Sales Manager",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postal_code": "10001",
    "status": "lead",
    "source": "manual",
    "notes": "Test contact for API verification"
}

def test_contact_creation():
    """Test the contact creation functionality"""
    print("🧪 Testing Contact Creation...")
    
    # Step 1: Register user
    print("\n1. Registering test user...")
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json=TEST_USER)
        if response.status_code == 200:
            print("✅ User registration passed")
            token_data = response.json()
            token = token_data["access_token"]
            print(f"   Token: {token[:20]}...")
        else:
            print(f"❌ User registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ User registration error: {e}")
        return
    
    # Step 2: Create contact
    print("\n2. Creating test contact...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/api/contacts", json=TEST_CONTACT, headers=headers)
        if response.status_code == 200:
            print("✅ Contact creation passed")
            contact_data = response.json()
            print(f"   Contact ID: {contact_data['id']}")
            print(f"   Name: {contact_data['first_name']} {contact_data['last_name']}")
            print(f"   Email: {contact_data['email']}")
            print(f"   Company: {contact_data['company']}")
        else:
            print(f"❌ Contact creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Contact creation error: {e}")
    
    # Step 3: Get contacts list
    print("\n3. Getting contacts list...")
    try:
        response = requests.get(f"{BASE_URL}/api/contacts", headers=headers)
        if response.status_code == 200:
            print("✅ Contacts list passed")
            contacts_data = response.json()
            print(f"   Found {len(contacts_data)} contacts")
            if contacts_data:
                print(f"   First contact: {contacts_data[0]['first_name']} {contacts_data[0]['last_name']}")
        else:
            print(f"❌ Contacts list failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Contacts list error: {e}")
    
    print("\n🎉 Contact creation test completed!")

if __name__ == "__main__":
    test_contact_creation()


