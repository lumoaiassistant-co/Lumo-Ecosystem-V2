from pydantic import BaseModel
from typing import Optional

class FrameInput(BaseModel):
    """البيانات المرسلة من الكاميرا للتحليل"""
    child_id: str
    image_data: str # Base64 string

class VisionResponse(BaseModel):
    """البيانات العائدة من محرك YOLOv8 بعد التحليل"""
    status: str
    is_distracted: bool
    child_id: Optional[str] = None