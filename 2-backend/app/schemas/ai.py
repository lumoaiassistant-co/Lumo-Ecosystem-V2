from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime
from app.models.base import PyObjectId

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    session_id: Optional[str] = None # لو مبعوتش، السيستم هيعمل جلسة جديدة
    message: str
    # الـ history اختياري لأننا دلوقت بنجيبه من الـ DB في الباك اند لأمان أكتر
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    response: str
    session_id: str
    session_title: Optional[str] = None

class SessionResponse(BaseModel):
    id: PyObjectId = Field(alias="id") # الـ React مستني id مش _id
    title: str
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True, 
        populate_by_name=True,
        arbitrary_types_allowed=True
    )