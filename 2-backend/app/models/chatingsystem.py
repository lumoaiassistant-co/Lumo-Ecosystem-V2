from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional
from app.models.base import PyObjectId

class MessageModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    sender_email: str = Field(...)
    receiver_email: str = Field(...)
    message: str = Field(...)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_read: bool = Field(default=False)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True