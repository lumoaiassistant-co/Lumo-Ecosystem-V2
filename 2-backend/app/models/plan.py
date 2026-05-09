from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from app.models.base import PyObjectId

class PlanModel(BaseModel):
    """
    تعريف المهمة (Task/Plan) في قاعدة بيانات MongoDB.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_email: str = Field(...)
    # ربط المهمة بطفل معين (اختياري، لو None تبقى للأب نفسه)
    child_id: Optional[PyObjectId] = None 
    
    title: str = Field(...)
    subject: str = Field(...)
    duration: str = Field(...)
    day: str = Field(...)
    color: str = Field(...)
    is_completed: bool = Field(default=False)
    
    # 🚀 مهم جداً عشان نعرف مين صاحب الفكرة (الأب أم الطفل)
    created_by: str = Field(default="child") # "parent" or "child"
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )