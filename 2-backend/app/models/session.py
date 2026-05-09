from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from app.models.base import PyObjectId

class SessionModel(BaseModel):
    """
    تمثيل جلسة محادثة كاملة (عنوان الجلسة ووقت آخر تحديث).
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_email: str = Field(...)
    child_id: Optional[PyObjectId] = None
    
    title: str = Field(default="New Mission Briefing 🚀")
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )