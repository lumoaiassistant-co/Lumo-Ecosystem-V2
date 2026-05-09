from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.db.mongodb import get_database
from app.models.user import UserModel
from app.models.child import ChildModel
from app.schemas.child import ChildCreate, ChildResponse, ChildUpdate
from app.schemas.user import UserCreate 
from app.services.auth import create_user 
from app.core.deps import get_current_user
from app.models.base import PyObjectId

router = APIRouter()

@router.get("/children", response_model=List[ChildResponse])
async def get_children(current_user: UserModel = Depends(get_current_user)):
    db = get_database()
    # جلب الأطفال المربوطين بإيميل الأب الحالي
    cursor = db["children"].find({"parent_email": current_user.email})
    children = await cursor.to_list(length=20)
    return children

@router.post("/children", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
async def add_child(child: ChildCreate, current_user: UserModel = Depends(get_current_user)):
    db = get_database()
    
    # 🔥 الخطوة 1: إنشاء "حساب مستخدم" للطفل (Auth Account)
    try:
        user_data = UserCreate(
            email=child.email, 
            password=child.password, 
            firstName=child.name,
            lastName=current_user.last_name, 
            age=child.age,
            role="child",
            parentEmail=current_user.email
        )
        
        # نكريت اليوزر (هتتولى تشفير الباسورد وحفظه في كولكشن users)
        new_user = await create_user(user_data)
        
        # تفعيل الحساب فوراً لأن الأب هو اللي بيكريه
        await db["users"].update_one(
            {"_id": new_user.id},
            {"$set": {"is_approved": True}}
        )

    except Exception as e:
        # لو الإيميل متسجل قبل كدة مثلاً
        raise HTTPException(status_code=400, detail=f"Could not create account: {str(e)}")

    # 🔥 الخطوة 2: إنشاء "بروفايل الطفل" (Profile Data) في كولكشن children
    child_model = ChildModel(
        parent_email=current_user.email,
        child_email=child.email, # ✅ الربط الجوهري
        name=child.name,
        age=child.age,
        grade=child.grade,
        avatar=child.avatar,
        total_xp=0,
        level=1
    )
    
    child_dict = child_model.model_dump(by_alias=True, exclude={"id"})
    result = await db["children"].insert_one(child_dict)
    child_model.id = result.inserted_id
    
    return child_model

@router.patch("/children/{child_id}", response_model=ChildResponse)
async def update_child(
    child_id: PyObjectId, 
    child_update: ChildUpdate, 
    current_user: UserModel = Depends(get_current_user)
):
    db = get_database()
    update_data = {k: v for k, v in child_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")

    result = await db["children"].find_one_and_update(
        {"_id": child_id, "parent_email": current_user.email},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Child profile not found")
    return result

@router.delete("/children/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_child(child_id: PyObjectId, current_user: UserModel = Depends(get_current_user)):
    db = get_database()
    
    # نجيب إيميل الطفل قبل المسح عشان نشيل حسابه كمان
    child = await db["children"].find_one({"_id": child_id, "parent_email": current_user.email})
    if not child:
        raise HTTPException(status_code=404, detail="Child profile not found")

    # 1. مسح حساب الـ Login من كولكشن users
    await db["users"].delete_one({"email": child.get("child_email")})
    
    # 2. مسح بروفايل الطفل من كولكشن children
    await db["children"].delete_one({"_id": child_id})
    
    return None