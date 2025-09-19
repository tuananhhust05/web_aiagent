from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def init_db():
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    print("Connected to MongoDB")

async def close_db():
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")

def get_database():
    return db.client[settings.MONGODB_DATABASE] 