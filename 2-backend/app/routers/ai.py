import logging
from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from datetime import datetime, timezone

from app.core.config import settings
from app.db.mongodb import get_database
from app.schemas.ai import ChatRequest, ChatResponse, SessionResponse
from app.models.user import UserModel
from app.models.chat import ChatModel
from app.models.session import SessionModel
from app.core.deps import get_current_user
from app.models.base import PyObjectId
from app.services.ai_service import AIService 

router = APIRouter()
logger = logging.getLogger(__name__)
ai_service = AIService() 

@router.get("/sessions", response_model=List[SessionResponse])
async def get_sessions(
    child_id: Optional[PyObjectId] = Query(None),
    current_user: UserModel = Depends(get_current_user)
):
    """جلب قائمة جلسات الدردشة السابقة."""
    db = get_database()
    query = {"user_email": current_user.email}
    if child_id:
        query["child_id"] = child_id
        
    sessions = await db["sessions"].find(query).sort("updated_at", -1).to_list(50)
    
    return [SessionResponse(id=str(s["_id"]), title=s["title"], updated_at=s["updated_at"]) for s in sessions]

@router.get("/history/{session_id}", response_model=List[ChatModel])
async def get_session_history(
    session_id: PyObjectId, 
    current_user: UserModel = Depends(get_current_user)
):
    """جلب سجل الرسائل لجلسة معينة."""
    db = get_database()
    
    session = await db["sessions"].find_one({"_id": session_id, "user_email": current_user.email})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = await db["chats"].find({"session_id": str(session_id)}).sort("created_at", 1).to_list(100)
    return messages

@router.post("/chat", response_model=ChatResponse)
async def chat_with_lumo(
    request: ChatRequest, 
    child_id: Optional[PyObjectId] = Query(None), 
    book_id: Optional[str] = Query(None), 
    current_user: UserModel = Depends(get_current_user)
):
    """
    التحدث مع Lumo AI.
    يستخدم AIService لمعالجة النصوص المستخرجة من الكتب.
    """
    db = get_database()
    chats_collection = db["chats"]
    sessions_collection = db["sessions"]

    try:
        current_session_id = request.session_id
        session_title = None

        # 1. جلب محتوى الكتاب (Context) باستخدام AIService
        book_context = ""
        book_info = None
        if book_id:
            try:
                book_info = await db["books"].find_one({"_id": PyObjectId(book_id)})
                if book_info:
                    # تنظيف المسار لضمان عمله في نظام التشغيل
                    file_path = book_info["file_url"].lstrip("/")
                    # استدعاء دالة القراءة (التي تحتوي على الـ DEBUG print)
                    book_context = ai_service.extract_text_from_pdf(file_path)
            except Exception as path_err:
                logger.error(f"Book context error: {path_err}")

        # 2. إدارة الجلسة
        if not current_session_id:
            title = f"📚 Study: {book_info['title']}" if book_info else " ".join(request.message.split()[:5]) + "..."
            new_session = SessionModel(
                user_email=current_user.email, 
                child_id=child_id, 
                title=title
            )
            result = await sessions_collection.insert_one(new_session.model_dump(by_alias=True, exclude={"id"}))
            current_session_id = str(result.inserted_id)
            session_title = title
        else:
            await sessions_collection.update_one(
                {"_id": PyObjectId(current_session_id)},
                {"$set": {"updated_at": datetime.now(timezone.utc)}}
            )

        # 3. جلب تاريخ الدردشة (آخر 15 رسالة)
        history_cursor = await db["chats"].find({"session_id": str(current_session_id)}).sort("created_at", 1).to_list(15)
        chat_history = [
            {"role": "user" if msg["role"] == "user" else "assistant", "content": msg["text"]}
            for msg in history_cursor
        ]

        # 4. حفظ رسالة المستخدم الحالية
        user_msg = ChatModel(
            session_id=str(current_session_id),
            user_email=current_user.email,
            child_id=child_id,
            role="user",
            text=request.message
        )
        await chats_collection.insert_one(user_msg.model_dump(by_alias=True, exclude={"id"}))

        # 5. استدعاء Lumo (مع تمرير النص المستخرج من الكتاب)
        ai_text = await ai_service.generate_response(
            user_message=request.message,
            chat_history=chat_history,
            book_text=book_context
        )

        # 6. حفظ رد الذكاء الاصطناعي
        ai_msg = ChatModel(
            session_id=str(current_session_id),
            user_email=current_user.email,
            child_id=child_id,
            role="model",
            text=ai_text
        )
        await chats_collection.insert_one(ai_msg.model_dump(by_alias=True, exclude={"id"}))
        
        return ChatResponse(
            response=ai_text, 
            session_id=str(current_session_id), 
            session_title=session_title
        )

    except Exception as e:
        logger.error(f"AI Chat Error: {e}")
        raise HTTPException(status_code=500, detail="Lumo is taking a short nap. Try again later!")

@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: PyObjectId, 
    current_user: UserModel = Depends(get_current_user)
):
    """حذف جلسة وكل الرسائل المتعلقة بها."""
    db = get_database()
    result = await db["sessions"].delete_one({"_id": session_id, "user_email": current_user.email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    await db["chats"].delete_many({"session_id": str(session_id)})
    return None