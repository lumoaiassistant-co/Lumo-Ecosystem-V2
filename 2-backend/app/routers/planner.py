from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.db.mongodb import get_database
from app.models.user import UserModel
from app.models.plan import PlanModel
from app.schemas.plan import PlanCreate, PlanResponse, PlanUpdate
from app.core.deps import get_current_user
from app.models.base import PyObjectId

router = APIRouter()

# --- 1. جلب المهام ---
@router.get("/", response_model=List[PlanResponse])
async def get_my_plans(
    child_id: Optional[PyObjectId] = Query(None), 
    current_user: UserModel = Depends(get_current_user)
):
    """جلب كل المهام، مع إمكانية الفلترة لطفل معين"""
    db = get_database()
    query = {"user_email": current_user.email}
    
    if child_id:
        query["child_id"] = child_id 
        
    plans = await db["plans"].find(query).to_list(length=100)
    return plans

# --- 2. إنشاء مهمة جديدة ---
@router.post("/", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    plan: PlanCreate, 
    child_id: Optional[PyObjectId] = Query(None), 
    current_user: UserModel = Depends(get_current_user)
):
    """إنشاء مهمة وضمان عدم تكرار الـ child_id في الـ Arguments"""
    db = get_database()
    
    # تحويل البيانات لقاموس واستبعاد child_id لو موجود في الـ Schema
    # عشان هنضيفه إحنا يدوي ونمنع الـ TypeError
    plan_data = plan.model_dump(exclude={"child_id"})
    
    plan_model = PlanModel(
        **plan_data, 
        user_email=current_user.email,
        child_id=child_id,
        created_by="parent" if child_id else "child"
    )
    
    # الحفظ في MongoDB
    # بنستخدم by_alias=True عشان يحفظها _id على الهارد ديسك
    plan_dict = plan_model.model_dump(by_alias=True, exclude={"id"})
    new_plan = await db["plans"].insert_one(plan_dict)
    
    # تحديث الـ id في الموديل قبل ما نرجعه
    plan_model.id = new_plan.inserted_id
    return plan_model

# --- 3. تحديث مهمة (مثل تغيير الحالة لـ Done) ---
@router.patch("/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: PyObjectId, 
    update_data: PlanUpdate, 
    current_user: UserModel = Depends(get_current_user)
):
    """تحديث جزئي للمهمة"""
    db = get_database()
    
    data_to_update = update_data.model_dump(exclude_unset=True)

    if not data_to_update:
        raise HTTPException(status_code=400, detail="No changes provided")

    result = await db["plans"].find_one_and_update(
        {"_id": plan_id, "user_email": current_user.email},
        {"$set": data_to_update},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Task not found or unauthorized")
        
    return result

# --- 4. حذف مهمة ---
@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: PyObjectId, 
    current_user: UserModel = Depends(get_current_user)
):
    """حذف المهمة نهائياً من قاعدة البيانات"""
    db = get_database()
    
    result = await db["plans"].delete_one({"_id": plan_id, "user_email": current_user.email})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found or unauthorized")
        
    return None