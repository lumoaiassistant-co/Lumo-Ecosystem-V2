from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
from app.models.base import PyObjectId

class BookModel(BaseModel):
    """
    تمثيل بيانات الكتاب التعليمي داخل مكتبة لومو.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    
    # ✅ الحقل ده ضروري عشان نعرف مين الأب اللي رفع الكتاب ونظهره لابنه
    user_email: str = Field(...) 
    
    title: str = Field(...)
    author: str = Field(default="Lumo AI Library")
    
    # الروابط الأساسية
    cover_url: str = Field(...)  # رابط صورة الغلاف (Thumbnail)
    file_url: str = Field(...)   # رابط ملف الـ PDF
    
    description: str = Field(...)
    category: str = Field(...)   # Math, Science, Coding, History...
    
    # بيانات إضافية للتشجيع
    pages_count: int = Field(default=0, alias="pagesCount")
    difficulty: str = Field(default="Easy") # Easy, Medium, Hard
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class StudyCategoryModel(BaseModel):
    """
    تصنيفات المكتبة (عشان الفرونت إند يعرض Tabs لكل مادة).
    """
    name: str # اسم المادة
    icon: str # الإيموجي أو الأيقونة
    color: str # لون القسم في التصميم