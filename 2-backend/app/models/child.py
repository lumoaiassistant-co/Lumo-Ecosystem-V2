from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from app.models.base import PyObjectId

class ChildModel(BaseModel):
    """
    تعريف بروفايل الطفل في قاعدة البيانات.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    parent_email: str = Field(...) 
    
    # ✅ الحقل اللي كان ناقص ومسبب الـ 500 Internal Error:
    child_email: str = Field(...) 
    
    name: str = Field(...)
    age: int = Field(...)
    grade: str = Field(...)
    avatar: str = Field(default="student")
    
    total_xp: int = Field(default=0)
    level: int = Field(default=1)
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )