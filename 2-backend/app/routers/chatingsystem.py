from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException
from typing import Dict, Optional, List
from app.db.mongodb import get_database
from app.core.deps import get_current_user_ws, get_current_user
from app.models.user import UserModel
from datetime import datetime, timezone 
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # تخزين الاتصالات النشطة بالإيميل (Lowercase)
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_email: str):
        await websocket.accept()
        self.active_connections[user_email.lower()] = websocket

    def disconnect(self, user_email: str):
        email_lower = user_email.lower()
        if email_lower in self.active_connections:
            del self.active_connections[email_lower]

    async def send_personal_message(self, message: dict, user_email: str):
        email_lower = user_email.lower()
        if email_lower in self.active_connections:
            websocket = self.active_connections[email_lower]
            await websocket.send_json(message)

manager = ConnectionManager()

# --- 1️⃣ جلب تاريخ المحادثة ---
@router.get("/history/{other_email:path}")
async def get_chat_history(
    other_email: str, 
    current_user: UserModel = Depends(get_current_user)
):
    db = get_database()
    my_email = current_user.email.lower()
    target_email = other_email.lower()
    
    query = {
        "$or": [
            {"sender_email": my_email, "receiver_email": target_email},
            {"sender_email": target_email, "receiver_email": my_email}
        ]
    }
    
    cursor = db["user_messages"].find(query).sort("timestamp", 1)
    messages = await cursor.to_list(length=500)
    
    for msg in messages:
        msg["_id"] = str(msg["_id"])
        if isinstance(msg["timestamp"], datetime):
            msg["timestamp"] = msg["timestamp"].replace(tzinfo=timezone.utc).isoformat()
            
    return messages

# --- 2️⃣ الـ Badge ---
@router.get("/unread-counts")
async def get_unread_counts(current_user: UserModel = Depends(get_current_user)):
    db = get_database()
    pipeline = [
        {"$match": {"receiver_email": current_user.email.lower(), "is_read": False}},
        {"$group": {"_id": "$sender_email", "count": {"$sum": 1}}}
    ]
    cursor = db["user_messages"].aggregate(pipeline)
    results = await cursor.to_list(length=100)
    return {item["_id"]: item["count"] for item in results}

# --- 3️⃣ تصفير العداد ---
@router.post("/mark-read/{sender_email:path}")
async def mark_messages_as_read(
    sender_email: str, 
    current_user: UserModel = Depends(get_current_user)
):
    db = get_database()
    result = await db["user_messages"].update_many(
        {"sender_email": sender_email.lower(), "receiver_email": current_user.email.lower(), "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"status": "success", "modified_count": result.modified_count}

# --- 4️⃣ الـ WebSocket (Live Chat, Calling & Vision Alerts) ---
@router.websocket("/ws/{user_email:path}")
async def websocket_endpoint(
    websocket: WebSocket, 
    user_email: str,
    token: Optional[str] = Query(None) 
):
    user = await get_current_user_ws(token)
    
    if not user or user.email.lower() != user_email.lower():
        await websocket.close(code=1008) 
        return

    await manager.connect(websocket, user.email.lower())
    db = get_database()
    
    try:
        while True:
            data = await websocket.receive_text()
            incoming_data = json.loads(data)
            
            # ✅ تحديث القائمة لتشمل تنبيهات الرؤية الحاسوبية
            special_signals = [
                "call_request", "call_response", "offer", "answer", 
                "ice_candidate", "receiver_ringing", "end_call", "call_rejected",
                "distraction_alert" # 🚨 إشارة التشتت الجديدة
            ]
            
            # --- معالجة الإشارات الخاصة (Signaling & Alerts) ---
            if "type" in incoming_data and incoming_data["type"] in special_signals:
                msg_type = incoming_data["type"]
                receiver_email = incoming_data['receiver'].lower()
                
                # إعداد الحمولة (Payload) للإرسال
                payload = {
                    "type": msg_type,
                    "sender_email": user.email.lower(),
                    "data": incoming_data.get("data"), # بيحتوي على الـ snapshot والـ status
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }

                # ✨ تحسين: لو الإشارة "تنبيه تشتت"، نسيفها في سجل المراقبة (Monitoring Logs)
                if msg_type == "distraction_alert":
                    vision_log = {
                        "child_email": user.email.lower(),
                        "parent_email": receiver_email,
                        "status": incoming_data.get("data", {}).get("status", "Distracted"),
                        "snapshot": incoming_data.get("data", {}).get("snapshot"),
                        "timestamp": datetime.now(timezone.utc)
                    }
                    await db["vision_events"].insert_one(vision_log)

                # تمرير الإشارة للمستلم فوراً
                await manager.send_personal_message(payload, receiver_email)
                continue 

            # --- معالجة الرسايل (شات عادي أو سجل مكالمات) ---
            if 'msg' in incoming_data:
                now = datetime.now(timezone.utc)
                msg_content = incoming_data['msg']
                msg_type = "call_log" if msg_content.startswith("CALL_LOG:") else "text"
                
                new_message = {
                    "sender_email": user.email.lower(),
                    "receiver_email": incoming_data['receiver'].lower(),
                    "message": msg_content,
                    "type": msg_type,
                    "timestamp": now,
                    "is_read": False 
                }
                
                result = await db["user_messages"].insert_one(new_message)
                new_message["_id"] = str(result.inserted_id)
                new_message["timestamp"] = now.isoformat()

                await manager.send_personal_message(new_message, incoming_data['receiver'].lower())
                
                await websocket.send_json({
                    "status": "sent", 
                    "message_id": str(result.inserted_id),
                    "timestamp": new_message["timestamp"],
                    "type": msg_type
                })

    except WebSocketDisconnect:
        manager.disconnect(user.email.lower())
    except Exception as e:
        print(f"❌ Error in WS for {user_email}: {e}")
        manager.disconnect(user_email.lower())