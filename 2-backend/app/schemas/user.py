from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.base import PyObjectId 

class UserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    age: int
    role: str = Field(default="child") # 'parent' or 'child'

    model_config = ConfigDict(populate_by_name=True)

class UserCreate(UserBase):
    password: str = Field(min_length=6)
    accept_policy: bool = Field(alias="acceptPolicy", default=True)
    
    # الحقل المطلوب لربط الطفل بالأب وقت التسجيل
    parent_email: Optional[EmailStr] = Field(default=None, alias="parentEmail")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PinRequest(BaseModel):
    pin: str = Field(min_length=4, max_length=6)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"

class UserResponse(UserBase):
    # ✅ الـ id من مونجو
    id: PyObjectId = Field(alias="_id") 
    is_active: bool
    created_at: datetime
    has_pin: bool = False
    
    # 🔗 حقول الربط الجديدة في الـ Response
    is_approved: bool = True
    parent_id: Optional[PyObjectId] = Field(default=None, alias="parentId")
    
    # ✅ الحقل اللي كان ناقص ومسبب الـ Identity Error:
    # بيسمح للفرونت إند يعرف إيميل الأب فوراً بعد الـ Login
    parent_email: Optional[EmailStr] = Field(default=None, alias="parentEmail")
    
    pending_parent_email: Optional[EmailStr] = Field(default=None, alias="pendingParentEmail")
    
    model_config = ConfigDict(
        from_attributes=True, 
        populate_by_name=True, 
        arbitrary_types_allowed=True
    )

# تحديث الـ Model عشان يقرأ الـ UserResponse داخل الـ Token
UserResponse.model_rebuild()