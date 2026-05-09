from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.base import PyObjectId

class PlanBase(BaseModel):
    title: str
    subject: str
    duration: str
    day: str
    color: str
    is_completed: bool = False 

class PlanCreate(PlanBase):
    child_id: Optional[PyObjectId] = None # ضيفنا دي عشان تستلمها من الـ body لو حبيت

class PlanUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    duration: Optional[str] = None
    day: Optional[str] = None
    color: Optional[str] = None
    is_completed: Optional[bool] = None

class PlanResponse(PlanBase):
    """الشكل النهائي للمهمة عند إرسالها للـ Frontend"""
    # التعديل السحري: بنقوله خد القيمة من _id وسميها id
    id: PyObjectId = Field(alias="_id") 
    created_by: str = "child"
    created_at: Optional[datetime] = None 

    model_config = ConfigDict(
        populate_by_name=True, # مهم جداً
        from_attributes=True,
        arbitrary_types_allowed=True
    )