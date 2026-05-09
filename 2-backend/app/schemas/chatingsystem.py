from pydantic import BaseModel
from datetime import datetime
from app.models.base import PyObjectId

class MessageCreate(BaseModel):
    receiver_email: str
    message: str

class MessageResponse(BaseModel):
    id: PyObjectId
    sender_email: str
    receiver_email: str
    message: str
    timestamp: datetime
    is_read: bool

    class Config:
        from_attributes = True