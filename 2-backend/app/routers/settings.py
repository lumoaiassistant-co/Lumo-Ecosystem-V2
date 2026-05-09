from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import UserModel
from app.models.settings import UserSettingsModel
from app.schemas.settings import SettingsResponse, SettingsUpdate
from app.core.deps import get_current_user
from app.db.mongodb import get_database

router = APIRouter()

@router.get("/", response_model=SettingsResponse)
async def get_settings(current_user: UserModel = Depends(get_current_user)):
    db = get_database()
    # البحث عن إعدادات المستخدم
    settings = await db["settings"].find_one({"user_email": current_user.email})

    if settings:
        return settings

    # 🛠️ إذا لم توجد إعدادات (أول مرة)، ننشئها ونعيدها مع الـ ID الجديد
    new_settings = UserSettingsModel(user_email=current_user.email)
    settings_dict = new_settings.model_dump(by_alias=True, exclude={"id"})
    
    result = await db["settings"].insert_one(settings_dict)
    # إضافة الـ ID الذي أنشأه مونجو للقاموس لضمان استجابة كاملة للفرونت إند
    settings_dict["_id"] = result.inserted_id
    
    return settings_dict

@router.patch("/", response_model=SettingsResponse)
async def update_settings(update_data: SettingsUpdate, current_user: UserModel = Depends(get_current_user)):
    db = get_database()
    
    # تحويل البيانات واستبعاد الحقول التي لم يتم إرسالها (لتجنب مسح القيم القديمة)
    raw_data = update_data.model_dump(exclude_unset=True, by_alias=True)
    
    if not raw_data:
        raise HTTPException(status_code=400, detail="No data provided to update")

    # --- 💡 منطق الـ Flattening لتحديث الحقول المتداخلة ---
    update_dict = {}
    for key, value in raw_data.items():
        if key == "notifications" and isinstance(value, dict):
            for sub_key, sub_value in value.items():
                update_dict[f"notifications.{sub_key}"] = sub_value
        else:
            update_dict[key] = value

    # تحديث الوثيقة أو إنشاؤها إن لم تكن موجودة (upsert)
    result = await db["settings"].find_one_and_update(
        {"user_email": current_user.email},
        {"$set": update_dict},
        upsert=True,
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Failed to update settings")
        
    return result

@router.delete("/reset", status_code=status.HTTP_204_NO_CONTENT)
async def reset_account(current_user: UserModel = Depends(get_current_user)):
    """
    🚀 Danger Zone: مسح شامل لبيانات الحساب.
    """
    db = get_database()
    email = current_user.email
    
    # حذف كل ما يرتبط بالمستخدم في الكولكشنز المختلفة
    await db["users"].delete_one({"email": email})
    await db["settings"].delete_one({"user_email": email})
    await db["children"].delete_many({"parent_email": email})
    await db["plans"].delete_many({"user_email": email})
    await db["chats"].delete_many({"user_email": email})
    await db["sessions"].delete_many({"user_email": email})
    await db["user_stats"].delete_many({"user_email": email})
    
    return None