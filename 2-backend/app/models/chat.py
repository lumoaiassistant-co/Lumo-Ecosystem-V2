from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from app.models.base import PyObjectId

class ChatModel(BaseModel):
    """
    سجل رسالة واحدة داخل المحادثة (خاص بشات الـ AI).
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    session_id: str = Field(...)  # بنخزنه كـ string لسهولة الفلترة
    user_email: str = Field(...)
    child_id: Optional[PyObjectId] = None # مربوط بطفل معين أم لا
    
    role: str = Field(...) # "user" or "model" (assistant)
    text: str = Field(...)
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )