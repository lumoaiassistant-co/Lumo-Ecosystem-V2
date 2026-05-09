from fastapi import Depends, HTTPException, status, WebSocket, Query
from fastapi.security import OAuth2PasswordBearer
import jwt 
from pydantic import ValidationError
from app.core.config import settings
from app.db.mongodb import get_database
from app.models.user import UserModel
from typing import Optional

# تعريف مكان تسجيل الدخول عشان Swagger UI يعرف يبعت التوكن صح
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserModel:
    """
    التحقق من صحة التوكن وجلب بيانات المستخدم الحالي (لطلبات HTTP العادية).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
            
    except (jwt.PyJWTError, ValidationError):
        raise credentials_exception

    db = get_database()
    user_data = await db["users"].find_one({"email": email})
    
    if user_data is None:
        raise credentials_exception
        
    return UserModel(**user_data)

# --- التحديث الجديد لدعم نظام الشات (WebSockets) ---

async def get_current_user_ws(token: Optional[str] = Query(None)) -> Optional[UserModel]:
    """
    التحقق من التوكن أثناء فتح اتصال WebSocket.
    بناخد التوكن من الـ Query String: ws://.../ws?token=your_jwt_here
    """
    if token is None:
        return None

    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            return None
            
        db = get_database()
        user_data = await db["users"].find_one({"email": email})
        
        if user_data is None:
            return None
            
        return UserModel(**user_data)
    except:
        return None