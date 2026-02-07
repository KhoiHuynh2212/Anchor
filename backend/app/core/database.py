from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db]
    await db.users.create_index("supabase_id", unique=True)
    await db.knowledge_graph.create_index("user_id")
    await db.conversations.create_index("user_id")
    await db.nudges.create_index([("user_id", 1), ("scheduled_for", 1)])
    await db.briefs.create_index([("user_id", 1), ("date", 1)], unique=True)


async def close_db():
    global client
    if client:
        client.close()


def get_db():
    return db
