#!/usr/bin/env python3
"""
Test script to verify contact ID fix
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
    "status": "lead",
    "source": "manual"
}

def test_contact_id_fix():
    """Test that contact ID is properly returned"""
    print("🧪 Testing Contact ID Fix...")
    
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
            contact_id = contact_data.get('id')
            print(f"   Contact ID: {contact_id}")
            print(f"   Contact ID type: {type(contact_id)}")
            
            if contact_id and contact_id != 'undefined':
                print("✅ Contact ID is properly set")
            else:
                print("❌ Contact ID is undefined or invalid")
                return
        else:
            print(f"❌ Contact creation failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Contact creation error: {e}")
        return
    
    # Step 3: Get contacts list
    print("\n3. Getting contacts list...")
    try:
        response = requests.get(f"{BASE_URL}/api/contacts", headers=headers)
        if response.status_code == 200:
            print("✅ Contacts list passed")
            contacts_data = response.json()
            print(f"   Found {len(contacts_data)} contacts")
            
            if contacts_data:
                first_contact = contacts_data[0]
                contact_id = first_contact.get('id')
                print(f"   First contact ID: {contact_id}")
                print(f"   First contact ID type: {type(contact_id)}")
                
                if contact_id and contact_id != 'undefined':
                    print("✅ Contact ID in list is properly set")
                else:
                    print("❌ Contact ID in list is undefined or invalid")
                    return
        else:
            print(f"❌ Contacts list failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Contacts list error: {e}")
        return
    
    # Step 4: Get specific contact
    print("\n4. Getting specific contact...")
    try:
        response = requests.get(f"{BASE_URL}/api/contacts/{contact_id}", headers=headers)
        if response.status_code == 200:
            print("✅ Get specific contact passed")
            contact_data = response.json()
            retrieved_id = contact_data.get('id')
            print(f"   Retrieved contact ID: {retrieved_id}")
            
            if retrieved_id == contact_id:
                print("✅ Contact ID matches")
            else:
                print("❌ Contact ID mismatch")
        else:
            print(f"❌ Get specific contact failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Get specific contact error: {e}")
    
    print("\n🎉 Contact ID fix test completed!")

if __name__ == "__main__":
    test_contact_id_fix()


