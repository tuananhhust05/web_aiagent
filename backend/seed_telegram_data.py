import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

async def seed_telegram_data():
    # Connect to MongoDB
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("MONGODB_DATABASE", "agentvoice")]
    
    # Sample user ID (you'll need to replace this with a real user ID from your users collection)
    user_id = "507f1f77bcf86cd799439011"  # Replace with actual user ID
    
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
    
    # Sample Telegram campaigns
    telegram_campaigns = [
        {
            "name": "Welcome Campaign",
            "message": "Welcome to our Telegram channel! We're excited to have you here.",
            "status": "draft",
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Product Launch",
            "message": "🚀 Exciting news! Our new product is now available. Check it out!",
            "status": "sent",
            "sent_at": datetime.utcnow(),
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    try:
        # Insert contacts
        contacts_collection = db["telegram_contacts"]
        await contacts_collection.insert_many(telegram_contacts)
        print(f"✅ Inserted {len(telegram_contacts)} Telegram contacts")
        
        # Insert campaigns
        campaigns_collection = db["telegram_campaigns"]
        await campaigns_collection.insert_many(telegram_campaigns)
        print(f"✅ Inserted {len(telegram_campaigns)} Telegram campaigns")
        
        print("🎉 Telegram data seeded successfully!")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_telegram_data())
