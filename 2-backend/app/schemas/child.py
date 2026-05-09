from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from app.models.base import PyObjectId

class ChildBase(BaseModel):
    name: str
    age: int
    grade: str
    avatar: str = "student"

class ChildCreate(ChildBase):
    """
    🔥 التعديل هنا: لازم الحقول دي تكون موجودة عشان الـ Router 
    يستخدمها في إنشاء حساب الـ User (Login).
    """
    email: EmailStr 
    password: str = Field(..., min_length=6)

class ChildUpdate(BaseModel):
    """البيانات المسموح بتحديثها (كلها اختيارية)"""
    name: Optional[str] = None
    age: Optional[int] = None
    grade: Optional[str] = None
    avatar: Optional[str] = None
    is_active: Optional[bool] = None

class ChildResponse(ChildBase):
    """الشكل اللي هيرجع للـ Frontend"""
    # ✅ الـ Alias عشان يقرأ من مونجو صح
    id: PyObjectId = Field(alias="_id") 
    
    # ✅ ربط الإيميل عشان الفرونت إند يعرف الحساب ده بتاع مين
    child_email: EmailStr 
    
    total_xp: int = 0
    level: int = 1
    is_active: bool = True

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        arbitrary_types_allowed=True
    )