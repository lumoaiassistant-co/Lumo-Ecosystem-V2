from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

# إعداد الـ logging عشان تظهر لك رسائل واضحة في الـ Terminal
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def connect_to_mongo():
    """فتح الاتصال بقاعدة البيانات واختباره"""
    try:
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        # اختبار الاتصال بـ Ping
        await db.client.admin.command('ping')
        logger.info("🚀 LumoDB: Successfully connected to MongoDB!")
    except Exception as e:
        logger.error(f"❌ LumoDB: Connection error: {e}")
        raise e

async def close_mongo_connection():
    """قفل الاتصال عند إغلاق السيرفر"""
    if db.client:
        db.client.close()
        logger.info("💤 LumoDB: MongoDB connection closed.")

def get_database():
    """هذه الدالة هي اللي هنستخدمها في الـ Routers"""
    if db.client is None:
        raise ConnectionError("Database client is not initialized!")
    return db.client[settings.DATABASE_NAME]