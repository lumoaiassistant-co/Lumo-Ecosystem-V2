from fastapi import APIRouter, status, HTTPException, Depends
from datetime import timedelta
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from app.services.auth import create_user, authenticate_user
from app.core.config import settings
from app.utils.security import create_access_token
from app.db.mongodb import get_database

router = APIRouter()

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate):
    """
    تسجيل مستخدم جديد مع معالجة منطق الربط بين الأب والطفل.
    """
    db = get_database()

    # 1. لو المستخدم طفل، نتحقق من وجود إيميل الأب
    if user.role == "child":
        if not user.parent_email:
            raise HTTPException(
                status_code=400, 
                detail="Parent email is required for child registration."
            )
        
        # ✅ التأكد من أن الأب مسجل وتحويل الإيميل لـ lowercase لضمان الدقة
        parent_email_lower = user.parent_email.lower()
        parent = await db["users"].find_one({"email": parent_email_lower, "role": "parent"})
        
        if not parent:
            raise HTTPException(
                status_code=404, 
                detail="Parent email not found. Please ask your parent to sign up first."
            )
        
        # تحديث بيانات اليوزر قبل الإرسال للـ service (لو الـ schema بتسمح)
        user.parent_email = parent_email_lower

    # 2. إنشاء المستخدم في قاعدة البيانات عبر الـ Service
    new_user = await create_user(user)

    # 3. تحويل الموديل لـ Response 
    return UserResponse(
        **new_user.model_dump(),
        has_pin=False
    )

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """
    تسجيل الدخول وإرجاع التوكن وبيانات اليوزر الأساسية.
    """
    # 1. التحقق من اليوزر (الايميل والباسورد)
    user = await authenticate_user(user_credentials)
    
    # 2. التحقق من حالة الموافقة للطفل
    if user.role == "child" and not user.is_approved:
        # بنسمح له يدخل والفرونت إند بيعرض شاشة "بانتظار الموافقة"
        pass

    # 3. إنشاء التوكن
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.email).lower()}, 
        expires_delta=access_token_expires
    )
    
    # 4. تجهيز بيانات اليوزر للرد (تأكد إن UserResponse فيها حقل parent_email)
    # الـ user.model_dump() دلوقتي هيطلع فيها الـ parent_email الجديد
    user_response = UserResponse(
        **user.model_dump(),
        has_pin=bool(user.quiz_pin)
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user_response
    }