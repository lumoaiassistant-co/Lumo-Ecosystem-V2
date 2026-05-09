from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from app.services.cv_engine import VisionEngine
import json
import logging

router = APIRouter()
vision_engine = VisionEngine()
logger = logging.getLogger("VisionRouter")

# --- 1️⃣ الـ WebSocket للتحليل اللحظي (Real-time Analysis) ---
@router.websocket("/ws/focus-guard")
async def focus_guard_websocket(websocket: WebSocket):
    await websocket.accept()
    logger.info("✅ FocusGuard WebSocket Connected")
    
    try:
        while True:
            # استلام الفريم (Base64 string) من الفرونت إند
            data = await websocket.receive_text()
            
            if not data:
                continue

            # معالجة الفريم باستخدام محرك YOLOv8 الجديد
            status, is_distracted = vision_engine.process_frame(data)
            
            # إرسال النتيجة فوراً للفرونت إند
            await websocket.send_json({
                "status": status,
                "is_distracted": is_distracted,
                "timestamp": str(websocket.scope.get("server_time", "")) # اختياريا للـ latency
            })
            
    except WebSocketDisconnect:
        logger.info("❌ FocusGuard WebSocket Disconnected")
    except Exception as e:
        logger.error(f"⚠️ WebSocket Error: {e}")
        await websocket.close(code=1011)

# --- 2️⃣ الـ POST Endpoint (موجود للحالات الخاصة أو الـ Snapshots) ---
@router.post("/analyze")
async def analyze_behavior(data: dict): # استخدمنا dict مؤقتاً لتسهيل التجربة
    if "image_data" not in data:
        raise HTTPException(status_code=400, detail="Missing image_data")
        
    status, is_alert = vision_engine.process_frame(data["image_data"])
    
    return {
        "status": status,
        "alert": is_alert,
        "child_id": data.get("child_id")
    }