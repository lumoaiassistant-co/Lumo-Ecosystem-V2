from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional, List
from app.models.user import UserModel
from app.models.stats import UserStatsModel, FocusMetric, BehaviorMetric, Badge
from app.schemas.dashboard import DashboardStatsResponse
from app.core.deps import get_current_user
from app.db.mongodb import get_database
from app.models.base import PyObjectId
from datetime import datetime, timezone
import json

router = APIRouter()

# --- 1️⃣ الإحصائيات العامة (الكود الأصلي كما هو) ---
@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    child_id: Optional[str] = Query(None),
    current_user: UserModel = Depends(get_current_user)
):
    """
    جلب إحصائيات الداشبورد الأساسية.
    """
    db = get_database()
    stats_collection = db["user_stats"]

    target_child_id = None
    if child_id and child_id not in ["null", "undefined", ""]:
        try:
            target_child_id = PyObjectId(child_id)
        except Exception:
            target_child_id = None

    query = {"user_email": current_user.email, "child_id": target_child_id}
    user_stats = await stats_collection.find_one(query)

    if user_stats:
        return user_stats

    # إنشاء سجل افتراضي في حالة عدم الوجود
    empty_stats = UserStatsModel(
        user_email=current_user.email,
        child_id=target_child_id,
        current_xp=0,
        current_level=1,
        xp_to_next_level=100,
        badges=[
            Badge(
                id="starter", 
                name="New Explorer", 
                icon="🚀", 
                description="Welcome to Lumo AI!", 
                unlocked_at=datetime.now(timezone.utc)
            )
        ],
        focus_data=[
            FocusMetric(day=d, focus=0, distractions=0) 
            for d in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        ],
        behavior_data=[
            BehaviorMetric(subject='Focus', value=0),
            BehaviorMetric(subject='Completion', value=0),
            BehaviorMetric(subject='Consistency', value=0),
            BehaviorMetric(subject='Study Time', value=0),
            BehaviorMetric(subject='Engagement', value=0),
        ],
        notifications=[] 
    )

    stats_dict = empty_stats.model_dump(by_alias=True, exclude={"id"})
    result = await stats_collection.insert_one(stats_dict)
    newly_created_stats = await stats_collection.find_one({"_id": result.inserted_id})
    
    return newly_created_stats

# --- ✅ 2️⃣ جلب سجلات التشتت (جديد لصفحة Monitoring) ---
@router.get("/vision-logs/{child_id}")
async def get_vision_logs(
    child_id: str,
    current_user: UserModel = Depends(get_current_user)
):
    db = get_database()
    
    # 1. نجيب إيميل الطفل الأول بناءً على الـ ID عشان نربطه بجدول الـ vision_events
    try:
        child_oid = PyObjectId(child_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Child ID format")
        
    child = await db["children"].find_one({"_id": child_oid, "parent_email": current_user.email.lower()})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # 2. نجيب الأحداث الخاصة بالطفل ده من كولكشن vision_events (اللي عملناها في chatingsystem)
    cursor = db["vision_events"].find(
        {"child_email": child["email"].lower()}
    ).sort("timestamp", -1).limit(50) # آخر 50 حدث تشتت
    
    events = await cursor.to_list(length=50)
    
    # تنسيق البيانات للفرونت إند (id, timestamp, status, snapshot)
    formatted_logs = []
    for event in events:
        formatted_logs.append({
            "id": str(event["_id"]),
            "timestamp": event["timestamp"].isoformat() if isinstance(event["timestamp"], datetime) else event["timestamp"],
            "status": event.get("status", "Distracted"),
            "snapshot": event.get("snapshot")
        })
        
    return formatted_logs

# --- ✅ 3️⃣ جلب إحصائيات التركيز للشارت (جديد لصفحة Monitoring) ---
@router.get("/focus-stats/{child_id}")
async def get_focus_stats(
    child_id: str,
    current_user: UserModel = Depends(get_current_user)
):
    db = get_database()
    
    try:
        child_oid = PyObjectId(child_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Child ID format")

    # جلب بيانات الـ focus_data من جدول الـ user_stats
    stats = await db["user_stats"].find_one({"child_id": child_oid, "user_email": current_user.email.lower()})
    
    if not stats or "focus_data" not in stats:
        # لو مفيش داتا، نرجع داتا صفرية شيك عشان الشارت ميبقاش فاضي
        return [
            {"time": d, "focus": 0} 
            for d in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        ]

    # تحويل شكل البيانات من (day, focus, distractions) إلى (time, focus) اللي الفرونت إند مستنيها
    chart_ready_data = [
        {"time": item["day"], "focus": item["focus"]} 
        for item in stats["focus_data"]
    ]
    
    return chart_ready_data