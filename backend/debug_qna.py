"""Debug script to  check Q&A data in MongoDB"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGO_URI = "mongodb://admin:password123@mongodb:27017/agentvoice?authSource=admin"
DB_NAME = "agentvoice"

async def debug_qna():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # 1. List all users
    print("\n=== All Users ===")
    users_coll = db.users
    all_users = await users_coll.find({}).to_list(length=100)
    print(f"Total users in DB: {len(all_users)}")
    
    for u in all_users[:10]:
        print(f"\n- _id: {u['_id']} (type: {type(u['_id']).__name__})")
        print(f"  email: {u.get('email')}")
        print(f"  company_id: {u.get('company_id')}")
    
    # 2. List all Q&A org_ids
    print("\n=== Unique organization_ids in Q&A ===")
    qna_coll = db.atlas_qna
    org_ids = await qna_coll.distinct("organization_id")
    for oid in org_ids:
        if oid:
            count = await qna_coll.count_documents({"organization_id": oid})
            print(f"  org_id: {oid} -> {count} Q&As")
    
    # 3. Try to find user by email instead
    print("\n=== Find user by email ===")
    user = await users_coll.find_one({"email": {"$exists": True}})
    if user:
        print(f"  Found user: {user.get('email')}")
        print(f"  _id: {user['_id']}")
        print(f"  _id as str: {str(user['_id'])}")
        
        # Check if this user's id matches any org_id in Q&A
        user_id_str = str(user['_id'])
        qna_count = await qna_coll.count_documents({"organization_id": user_id_str})
        print(f"  Q&A with org_id={user_id_str}: {qna_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_qna())
