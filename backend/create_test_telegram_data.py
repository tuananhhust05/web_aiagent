import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

async def create_test_data():
    # Connect to MongoDB
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("MONGODB_DATABASE", "agentvoice")]
    
    # Get the first user from the database
    users_collection = db["users"]
    user = await users_collection.find_one({})
    
    if not user:
        print("❌ No users found in database. Please create a user first.")
        return
    
    user_id = str(user["_id"])
    print(f"✅ Found user: {user.get('email', 'Unknown')} (ID: {user_id})")
    
    # Sample Telegram contacts
    telegram_contacts = [
        {
            "username": "john_doe",
            "first_name": "John",
            "last_name": "Doe",
            "is_active": True,
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "username": "jane_smith",
            "first_name": "Jane",
            "last_name": "Smith",
            "is_active": True,
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "username": "bob_wilson",
            "first_name": "Bob",
            "last_name": "Wilson",
            "is_active": False,
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    try:
        # Clear existing test data
        contacts_collection = db["telegram_contacts"]
        await contacts_collection.delete_many({"user_id": user_id})
        print("🧹 Cleared existing test data")
        
        # Insert new contacts
        result = await contacts_collection.insert_many(telegram_contacts)
        print(f"✅ Inserted {len(result.inserted_ids)} Telegram contacts")
        
        # Show the created contacts
        contacts = await contacts_collection.find({"user_id": user_id}).to_list(length=None)
        for contact in contacts:
            print(f"  - {contact['first_name']} {contact['last_name']} (@{contact['username']}) - ID: {contact['_id']}")
        
        print("🎉 Test data created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating test data: {e}")
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_test_data())
