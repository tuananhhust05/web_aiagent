#!/usr/bin/env python3
"""
Test script for LinkedIn integration
This script tests the LinkedIn service functionality
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.linkedin_service import linkedin_service

async def test_linkedin_service():
    """Test the LinkedIn service functionality"""
    print("🔗 Testing LinkedIn Service Integration")
    print("=" * 50)
    
    # Test 1: Test API connection
    print("\n1. Testing LinkedIn API connection...")
    connection_result = await linkedin_service.test_connection()
    print(f"   Connection test result: {connection_result}")
    
    # Test 2: Test sending message to a single contact
    print("\n2. Testing single LinkedIn message...")
    test_profile = "https://www.linkedin.com/in/quangngx"
    test_message = "Hi, i have a good new , i really want to share with you"
    
    single_result = await linkedin_service.send_message_to_contact(
        test_profile, 
        test_message
    )
    print(f"   Single message result: {single_result}")
    
    # Test 3: Test sending messages to multiple contacts
    print("\n3. Testing multiple LinkedIn messages...")
    test_profiles = [
        "https://www.linkedin.com/in/quangngx",
        "https://www.linkedin.com/in/test-profile"
    ]
    
    multiple_result = await linkedin_service.send_messages_to_contacts(
        test_profiles, 
        test_message
    )
    print(f"   Multiple messages result: {multiple_result}")
    
    print("\n✅ LinkedIn service testing completed!")

if __name__ == "__main__":
    asyncio.run(test_linkedin_service())
