import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.routers import (
    auth, users, planner, ai, dashboard, 
    settings as settings_router, children, 
    study, gamification, quiz, vision, chatingsystem,
    calls  # ✅ تم إضافة راوتر المكالمات هنا
)

# إعداد اللوجر
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 📁 إعداد فولدرات التخزين ---
def create_upload_dirs():
    """إنشاء المجلدات اللازمة لرفع الكتب والصور لو مش موجودة"""
    dirs = [
        "static/books/math",
        "static/books/science",
        "static/books/ict",
        "static/books/coding",
        "static/books/history",
        "static/covers"
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    logger.info("📁 Static directories are ready.")

create_upload_dirs()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # كود ينفذ عند تشغيل السيرفر
    try:
        await connect_to_mongo()
        logger.info("✅ Database connection established.")
    except Exception as e:
        logger.error(f"❌ Could not connect to database: {e}")
    
    yield
    
    # كود ينفذ عند إغلاق السيرفر
    await close_mongo_connection()
    logger.info("🛑 Database connection closed.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# --- 🌐 CORS Middleware ---
# ✅ التعديل النهائي: استخدام Regex للسماح بأي IP محلي بمرونة كاملة
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://.*", 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 🖼️ Static Files Serving ---
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Global Exception Handler ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
    )

# --- 🛡️ Register Routers ---
api_prefix = settings.API_V1_STR

app.include_router(auth.router, prefix=f"{api_prefix}/auth", tags=["Authentication"])
app.include_router(users.router, prefix=f"{api_prefix}/users", tags=["Users"])
app.include_router(planner.router, prefix=f"{api_prefix}/planner", tags=["Planner"])
app.include_router(ai.router, prefix=f"{api_prefix}/ai", tags=["AI Tutor"])
app.include_router(dashboard.router, prefix=f"{api_prefix}/dashboard", tags=["Dashboard"])
app.include_router(settings_router.router, prefix=f"{api_prefix}/settings", tags=["Settings"]) 
app.include_router(children.router, prefix=f"{api_prefix}/parent", tags=["Children Management"])
app.include_router(study.router, prefix=f"{api_prefix}/study", tags=["Study Zone"])
app.include_router(gamification.router, prefix=f"{api_prefix}/game", tags=["Gamification"])
app.include_router(quiz.router, prefix=f"{api_prefix}/quizzes", tags=["Quizzes"])

# ✅ تسجيل راوتر المكالمات الجديد (WebRTC) لحل مشكلة الـ 404
app.include_router(calls.router, prefix=f"{api_prefix}/calls", tags=["WebRTC Calls"])

# ✅ تأكيد تسجيل الـ Vision Router
app.include_router(vision.router, prefix=f"{api_prefix}/vision", tags=["Computer Vision"])

# ✅ تسجيل الـ Chat System
app.include_router(chatingsystem.router, prefix=f"{api_prefix}/chat-system", tags=["User Chat"])

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "status": "online 🚀",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    # التأكد من تشغيل السيرفر على 0.0.0.0 للسماح بالاتصالات الخارجية
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)