#!/usr/bin/env python3
"""
Initialize deals collection in MongoDB
"""

import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def init_deals_collection():
    """Initialize deals collection with indexes"""
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.DATABASE_NAME]
        
        print("🔧 Connecting to MongoDB...")
        
        # Create deals collection
        deals_collection = db.deals
        
        # Create indexes for better performance
        print("📊 Creating indexes for deals collection...")
        
        # Index on user_id for user isolation
        await deals_collection.create_index("user_id")
        
        # Index on status for filtering
        await deals_collection.create_index("status")
        
        # Index on contact_id for relationship queries
        await deals_collection.create_index("contact_id")
        
        # Index on campaign_id for relationship queries
        await deals_collection.create_index("campaign_id")
        
        # Compound index for user_id + status for efficient filtering
        await deals_collection.create_index([("user_id", 1), ("status", 1)])
        
        # Index on created_at for sorting
        await deals_collection.create_index("created_at")
        
        # Text index for search functionality
        await deals_collection.create_index([("name", "text"), ("description", "text")])
        
        print("✅ Deals collection initialized successfully!")
        
        # Check if collection exists and show stats
        stats = await db.command("collStats", "deals")
        print(f"📈 Collection stats: {stats}")
        
    except Exception as e:
        print(f"❌ Error initializing deals collection: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(init_deals_collection())










