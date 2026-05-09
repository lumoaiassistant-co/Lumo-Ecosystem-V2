from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional, List
from datetime import datetime, timezone
from app.db.mongodb import get_database
from app.models.user import UserModel
from app.models.stats import UserStatsModel, Badge
from app.core.deps import get_current_user
from app.models.base import PyObjectId

router = APIRouter()

@router.get("/stats")
async def get_stats(
    child_id: Optional[PyObjectId] = Query(None),
    current_user: UserModel = Depends(get_current_user)
):
    """
    جلب إحصائيات الجيميفيكيشن الحالية لطفل معين (XP, Level, Badges).
    """
    db = get_database()
    stats_collection = db["user_stats"]
    
    query = {"user_email": current_user.email, "child_id": child_id}
    stats = await stats_collection.find_one(query)
    
    if not stats:
        # إرجاع قيم افتراضية لو الطفل لسه مجمعش أي XP بدل ما نكراش
        return {
            "current_xp": 0,
            "current_level": 1,
            "badges": [],
            "xp_to_next_level": 100
        }
    
    # تحويل الـ _id لنص لضمان التوافق مع JSON Response
    stats["id"] = str(stats["_id"])
    return stats

@router.post("/award")
async def award_xp(
    amount: int, 
    reason: str, # مثلاً: "task_completed", "quiz_passed", "focus_session"
    child_id: Optional[PyObjectId] = Query(None),
    current_user: UserModel = Depends(get_current_user)
):
    """
    إضافة XP للطفل، التحقق من ارتفاع المستوى (Level Up)، وفتح الأوسمة (Badges).
    """
    db = get_database()
    stats_collection = db["user_stats"]
    
    # 1. تحديد المستهدف (الأب أو طفل معين)
    query = {"user_email": current_user.email, "child_id": child_id}

    # 2. جلب الإحصائيات الحالية أو إنشاء واحدة جديدة لو مش موجودة
    stats_data = await stats_collection.find_one(query)
    
    if not stats_data:
        # إنشاء بروفايل إحصائيات افتراضي لو دي أول مرة الطفل يجمع XP
        new_stats = UserStatsModel(
            user_email=current_user.email,
            child_id=child_id,
            current_xp=0,
            current_level=1,
            xp_to_next_level=100
        )
        await stats_collection.insert_one(new_stats.model_dump(by_alias=True, exclude={"id"}))
        stats_data = new_stats.model_dump()

    # 3. حساب الـ XP والمستوى الجديد
    current_xp = stats_data.get("current_xp", 0)
    current_level = stats_data.get("current_level", 1)
    
    total_new_xp = current_xp + amount
    
    # منطق الـ Level Up (كل مستوى يحتاج 100 XP حالياً)
    new_level = 1 + (total_new_xp // 100)
    is_level_up = new_level > current_level

    updates = {
        "current_xp": total_new_xp,
        "current_level": new_level
    }

    # 4. منطق الأوسمة (Badge Logic)
    existing_badge_ids = [b["id"] for b in stats_data.get("badges", [])]
    new_badges_to_add = []

    # وسام: أول 100 نقطة (Centurion)
    if total_new_xp >= 100 and "first_100" not in existing_badge_ids:
        new_badges_to_add.append(Badge(
            id="first_100", 
            name="Centurion", 
            icon="💯", 
            description="You hit your first 100 XP! Legend!", 
            unlocked_at=datetime.now(timezone.utc)
        ).model_dump())

    # وسام: إنهاء أول مهمة
    if reason == "task_completed" and "task_master" not in existing_badge_ids:
        new_badges_to_add.append(Badge(
            id="task_master", 
            name="Mission Complete", 
            icon="✅", 
            description="Finished your first mission successfully!", 
            unlocked_at=datetime.now(timezone.utc)
        ).model_dump())

    # 5. تنفيذ التحديث في قاعدة البيانات
    update_op = {"$set": updates}
    if new_badges_to_add:
        update_op["$push"] = {"badges": {"$each": new_badges_to_add}}

    await stats_collection.update_one(query, update_op)

    return {
        "status": "success",
        "xp_added": amount,
        "current_total_xp": total_new_xp,
        "level_up": is_level_up,
        "new_level": new_level,
        "new_badges": [b["name"] for b in new_badges_to_add]
    }