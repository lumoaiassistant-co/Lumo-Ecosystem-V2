from fastapi import HTTPException, status
from app.db.mongodb import get_database
from app.models.user import UserModel
from app.schemas.user import UserCreate, UserLogin
from app.utils.security import get_password_hash, verify_password

async def create_user(user_in: UserCreate) -> UserModel:
    db = get_database()
    users_collection = db["users"]
    
    # 1. التأكد من أن الإيميل مش مستخدم
    existing_user = await users_collection.find_one({"email": user_in.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 2. تشفير الباسورد وتحضير الموديل
    hashed_password = get_password_hash(user_in.password)
    
    # منطق الموافقة (Approval Logic)
    is_approved = True if user_in.role == "parent" else False

    # ✅ التعديل الجوهري هنا:
    # بنسيف إيميل الأب في الحقلين عشان الشات يقرأه فوراً (parent_email)
    # وعشان يفضل في قائمة الانتظار للربط (pending_parent_email)
    p_email = user_in.parent_email.lower() if user_in.parent_email else None

    user_model = UserModel(
        email=user_in.email.lower(),
        hashed_password=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        age=user_in.age,
        role=user_in.role,
        is_approved=is_approved,
        parent_email=p_email,          # 🔥 السطر ده هو اللي كان ناقص يا بطل!
        pending_parent_email=p_email   # حفظه برضه هنا للـ Tracking
    )

    # 3. الحفظ في مونجو
    user_dict = user_model.model_dump(by_alias=True, exclude={"id"})
    new_user = await users_collection.insert_one(user_dict)
    
    # 4. إرجاع الموديل مع الـ ID الجديد
    user_model.id = new_user.inserted_id
    return user_model

async def authenticate_user(user_in: UserLogin) -> UserModel:
    """يتحقق من البيانات ويرجع اليوزر لو سليم"""
    db = get_database()
    users_collection = db["users"]

    # البحث بالإيميل lowercase لضمان التطابق
    user_data = await users_collection.find_one({"email": user_in.email.lower()})
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    if not verify_password(user_in.password, user_data["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return UserModel(**user_data)