from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from app.models.base import PyObjectId

class UserModel(BaseModel):
    """
    تعريف اليوزر في قاعدة البيانات (MongoDB).
    مدعوم بحقول الربط بين الأب والطفل ونظام الموافقة.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    email: EmailStr = Field(...)
    hashed_password: str = Field(...)
    first_name: str = Field(...)
    last_name: str = Field(...)
    age: int = Field(...)
    role: str = Field(default="child") 
    
    # 🔗 حقول الربط:
    # parent_id: الـ ID الفعلي للأب في الداتابيز
    parent_id: Optional[PyObjectId] = Field(default=None)
    
    # ✅ الحقل الجديد والمطلوب عشان الشات يشتغل:
    # parent_email: الإيميل الفعلي للأب اللي الفرونت إند بيكلمه
    parent_email: Optional[EmailStr] = Field(default=None) 
    
    # pending_parent_email: الإيميل اللي الطفل كتبه وقت التسجيل (للموافقة)
    pending_parent_email: Optional[EmailStr] = Field(default=None)
    
    # is_approved: حالة الحساب
    is_approved: bool = Field(default=True) 

    quiz_pin: Optional[str] = None 
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )