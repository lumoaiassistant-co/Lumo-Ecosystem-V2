from pydantic import BaseModel
from typing import Optional, Any, Dict

class CallSignalSchema(BaseModel):
    # نوع الإشارة: call_request, call_response, offer, answer, ice_candidate
    type: str 
    # الإيميل اللي بيبعت
    sender_email: str
    # الإيميل اللي هيستقبل
    receiver_email: str
    # نوع المكالمة (voice أو video)
    call_mode: Optional[str] = "video"
    # البيانات التقنية (SDP أو ICE Candidates)
    signal_data: Optional[Any] = None
    # حالة الرد (accepted, rejected, busy)
    status: Optional[str] = None

class IceServerSchema(BaseModel):
    urls: list[str]
    username: Optional[str] = None
    credential: Optional[str] = None