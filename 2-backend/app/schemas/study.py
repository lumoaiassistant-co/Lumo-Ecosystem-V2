from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
from app.models.base import PyObjectId
from datetime import datetime

class BookResponse(BaseModel):
    """الشكل النهائي للكتاب اللي هيروح للـ React"""
    
    # ✅ يقرأ من _id (مونجو) ويبعته باسم id عشان الـ Key في React
    id: str = Field(validation_alias="_id", serialization_alias="id") 
    
    title: str
    author: Optional[str] = "Lumo Library" # قيمة افتراضية لو مش موجود
    
    # ✅ يقرأ من cover_url ويبعته باسم thumbnail
    thumbnail: str = Field(validation_alias="cover_url", serialization_alias="thumbnail")
    
    # ✅ يقرأ من file_url ويبعته بنفس الاسم
    file_url: str = Field(validation_alias="file_url", serialization_alias="file_url")
    
    description: str
    category: str
    
    # ✅ يقرأ من pagesCount من الداتابيز ويبعته pagesCount للفرونت
    pages_count: int = Field(validation_alias="pagesCount", serialization_alias="pagesCount")
    
    # ✅ مستوى الصعوبة الجديد
    difficulty: str 
    
    # ✅ يقرأ من created_at ويبعته upload_date
    upload_date: datetime = Field(validation_alias="created_at", serialization_alias="upload_date")

    model_config = ConfigDict(
        from_attributes=True, 
        populate_by_name=True,
        arbitrary_types_allowed=True
    )

    # ✅ محول لضمان أن الـ ID دائماً String لراحة الفرونت إند
    @field_validator("id", mode="before")
    @classmethod
    def convert_id(cls, v):
        return str(v)

class CategoryResponse(BaseModel):
    """لتنظيم الـ Tabs في واجهة المكتبة"""
    name: str
    slug: str  # الاسم المستخدم في الفلترة (مثل math)
    icon: str  # الإيموجي
    color: str  # كود اللون