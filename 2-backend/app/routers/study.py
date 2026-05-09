from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
import shutil
import os
from typing import List, Optional
from app.models.study import BookModel
from app.models.user import UserModel
from app.schemas.study import BookResponse
from app.db.mongodb import get_database
from app.core.deps import get_current_user
from app.models.base import PyObjectId
from app.routers.gamification import award_xp

router = APIRouter()

@router.post("/upload", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def upload_book(
    title: str = Form(...),
    category: str = Form(...),
    pages_count: int = Form(...), # الحقل الجديد
    difficulty: str = Form(...),  # الحقل الجديد
    file: UploadFile = File(...),
    cover: Optional[UploadFile] = File(None), # غلاف اختياري
    current_user: UserModel = Depends(get_current_user)
):
    """
    رفع كتاب جديد مع دعم الغلاف المخصص ومعلومات الكتاب الإضافية.
    """
    # 1. تحديد إيميل العائلة الموحد
    user_role = getattr(current_user, "role", "parent")
    parent_email = getattr(current_user, "parent_email", None)
    family_email = parent_email if user_role == "child" and parent_email else current_user.email

    # 2. حفظ ملف الـ PDF الأساسي
    folder_path = f"static/books/{category.lower()}"
    os.makedirs(folder_path, exist_ok=True)
    safe_filename = file.filename.replace(" ", "_")
    file_location = f"{folder_path}/{safe_filename}"
    
    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save PDF: {str(e)}")

    # 3. حفظ صورة الغلاف لو موجودة، وإلا نستخدم الافتراضي
    cover_url = "/static/covers/default_book.png"
    if cover:
        cover_folder = f"static/covers/{category.lower()}"
        os.makedirs(cover_folder, exist_ok=True)
        # تسمية مميزة للغلاف لمنع التداخل
        cover_filename = f"cover_{title.replace(' ', '_')}_{cover.filename.replace(' ', '_')}"
        cover_location = f"{cover_folder}/{cover_filename}"
        try:
            with open(cover_location, "wb") as buffer:
                shutil.copyfileobj(cover.file, buffer)
            cover_url = f"/{cover_location}"
        except:
            pass # لو فشل رفع الغلاف، بيكمل بالافتراضي عادي

    # 4. تخزين البيانات في MongoDB
    db = get_database()
    book_data = BookModel(
        user_email=family_email,
        title=title,
        category=category.lower(),
        file_url=f"/{file_location}",
        cover_url=cover_url,
        description=f"Educational book for {category}: {title}",
        pages_count=pages_count, # حفظ عدد الصفحات
        difficulty=difficulty   # حفظ مستوى الصعوبة
    )
    
    result = await db["books"].insert_one(book_data.model_dump(by_alias=True, exclude={"id"}))
    book_data.id = result.inserted_id
    
    return book_data

@router.get("/books", response_model=List[BookResponse], response_model_by_alias=True)
async def get_my_books(
    q: Optional[str] = None, 
    category: str = "all", 
    current_user: UserModel = Depends(get_current_user)
):
    """جلب الكتب بناءً على إيميل العائلة."""
    db = get_database()
    
    user_role = getattr(current_user, "role", "parent")
    parent_email = getattr(current_user, "parent_email", None)
    family_email = parent_email if user_role == "child" and parent_email else current_user.email

    query_filter = {"user_email": family_email}
    
    if category and category != "all":
        query_filter["category"] = category.lower()
    
    if q:
        query_filter["title"] = {"$regex": q, "$options": "i"}

    cursor = db["books"].find(query_filter)
    books = await cursor.to_list(length=100)
    
    return books

@router.delete("/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: PyObjectId, current_user: UserModel = Depends(get_current_user)):
    """حذف الكتاب وملفاته من السيرفر."""
    db = get_database()
    
    user_role = getattr(current_user, "role", "parent")
    parent_email = getattr(current_user, "parent_email", None)
    family_email = parent_email if user_role == "child" and parent_email else current_user.email
    
    book = await db["books"].find_one({"_id": book_id, "user_email": family_email})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found or unauthorized")

    # حذف ملف الـ PDF
    file_path = book["file_url"].lstrip("/")
    if os.path.exists(file_path):
        os.remove(file_path)

    # حذف صورة الغلاف لو لم تكن الافتراضية
    if book["cover_url"] != "/static/covers/default_book.png":
        cover_path = book["cover_url"].lstrip("/")
        if os.path.exists(cover_path):
            os.remove(cover_path)

    await db["books"].delete_one({"_id": book_id})
    return None

@router.post("/session/complete")
async def complete_study_session(
    child_id: PyObjectId,
    duration_minutes: int,
    current_user: UserModel = Depends(get_current_user)
):
    xp_earned = duration_minutes * 2
    try:
        result = await award_xp(
            amount=xp_earned,
            reason="focus_session",
            child_id=child_id,
            current_user=current_user
        )
        return {
            "message": "Study session recorded! Great job!",
            "xp_earned": xp_earned,
            "details": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to award XP: {str(e)}")