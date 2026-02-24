"""
Script to clean up duplicate todo_items and add unique index.
Run this once to fix the duplicate bug.

Usage:
    python -m app.scripts.fix_todo_duplicates
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


async def fix_duplicates():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    print("=== Fixing duplicate todo_items ===")
    
    # Find duplicates by source + source_id + user_id
    pipeline = [
        {"$match": {"source_id": {"$ne": None}}},
        {"$group": {
            "_id": {"user_id": "$user_id", "source": "$source", "source_id": "$source_id"},
            "count": {"$sum": 1},
            "ids": {"$push": "$_id"},
            "first_created": {"$min": "$created_at"},
        }},
        {"$match": {"count": {"$gt": 1}}},
    ]
    
    duplicates = await db.todo_items.aggregate(pipeline).to_list(length=1000)
    
    total_deleted = 0
    for dup in duplicates:
        ids = dup["ids"]
        # Keep the first one (oldest), delete the rest
        ids_to_delete = ids[1:]
        if ids_to_delete:
            result = await db.todo_items.delete_many({"_id": {"$in": ids_to_delete}})
            total_deleted += result.deleted_count
            print(f"  Deleted {result.deleted_count} duplicates for source_id={dup['_id']['source_id']}")
    
    print(f"\nTotal duplicates deleted: {total_deleted}")
    
    # Create unique index
    print("\n=== Creating unique index ===")
    try:
        await db.todo_items.create_index(
            [("user_id", 1), ("source", 1), ("source_id", 1)],
            unique=True,
            sparse=True,  # Allow null source_id (manual tasks)
            name="unique_source_task",
        )
        print("Created unique index: unique_source_task")
    except Exception as e:
        if "already exists" in str(e):
            print("Index already exists")
        else:
            print(f"Error creating index: {e}")
    
    # Show current counts
    total = await db.todo_items.count_documents({})
    print(f"\nTotal todo_items in DB: {total}")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(fix_duplicates())
