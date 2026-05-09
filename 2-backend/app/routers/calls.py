from fastapi import APIRouter, Depends, HTTPException
from app.core.deps import get_current_user
from app.models.user import UserModel
from typing import List, Dict

router = APIRouter()

# --- جلب إعدادات خوادم الـ WebRTC (ICE Servers) ---
@router.get("/ice-servers")
async def get_ice_servers(current_user: UserModel = Depends(get_current_user)):
    # دي خوادم جوجل المجانية، في الإنتاج الفعلي (Production) ممكن تستخدم خوادم Twilio أو صيانة خادم TURN خاص بيك
    return {
        "iceServers": [
            {"urls": "stun:stun.l.google.com:19302"},
            {"urls": "stun:stun1.l.google.com:19302"},
            {"urls": "stun:stun2.l.google.com:19302"},
        ]
    }

# --- (اختياري) سجل المكالمات الفائتة أو النشطة ---
@router.get("/active-calls")
async def get_active_calls(current_user: UserModel = Depends(get_current_user)):
    # ممكن نطور دي لاحقاً لو حابب تظهر لو الأب في مكالمة حالياً
    return {"active": False}