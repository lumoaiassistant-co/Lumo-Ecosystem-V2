from fastapi import APIRouter, Depends, HTTPException, Query, status
import ollama
import json
import logging
from typing import List
from app.core.config import settings
from app.db.mongodb import get_database
from app.models.user import UserModel
from app.models.quiz import QuizModel, Question
from app.schemas.quiz import QuizCreate, QuizResponse, QuizGenerateRequest, QuizSubmit
from app.core.deps import get_current_user
from app.models.base import PyObjectId
from app.routers.gamification import award_xp

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/generate", response_model=List[Question])
async def generate_quiz(request: QuizGenerateRequest):
    """
    توليد أسئلة كويز ذكية باستخدام Llama 3.2 المحلي.
    """
    prompt = f"""
    Generate a educational quiz for a child about: "{request.topic}".
    Difficulty: {request.difficulty}.
    Number of questions: {request.num_questions}.
    
    The output MUST be a JSON object with a "questions" key.
    Each question must have: question_text, question_type (mcq), options (list of 4), 
    correct_answer (must be one of the options), and points (int).
    """

    try:
        client = ollama.AsyncClient(host=settings.OLLAMA_BASE_URL)
        response = await client.chat(
            model=settings.OLLAMA_MODEL,
            messages=[{'role': 'user', 'content': prompt}],
            format='json' # إجبار الموديل على الرد بتنسيق JSON
        )

        data = json.loads(response['message']['content'])
        questions = data.get("questions", [])
        
        # التأكد من أن الداتا مطابقة لموديل Question
        return [Question(**q) for q in questions]

    except Exception as e:
        logger.error(f"AI Quiz Generation Error: {e}")
        raise HTTPException(status_code=500, detail="Lumo's quiz engine is busy. Try again!")

@router.post("/", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(quiz: QuizCreate, current_user: UserModel = Depends(get_current_user)):
    db = get_database()
    
    quiz_model = QuizModel(
        user_email=current_user.email,
        **quiz.model_dump()
    )
    
    result = await db["quizzes"].insert_one(quiz_model.model_dump(by_alias=True, exclude={"id"}))
    quiz_model.id = result.inserted_id
    return quiz_model

@router.get("/", response_model=List[QuizResponse])
async def get_quizzes(child_id: PyObjectId, current_user: UserModel = Depends(get_current_user)):
    db = get_database()
    cursor = db["quizzes"].find({"child_id": child_id, "user_email": current_user.email})
    return await cursor.to_list(100)

@router.patch("/{quiz_id}/submit", response_model=QuizResponse)
async def submit_quiz(
    quiz_id: PyObjectId, 
    submission: QuizSubmit, 
    current_user: UserModel = Depends(get_current_user)
):
    db = get_database()
    
    result = await db["quizzes"].find_one_and_update(
        {"_id": quiz_id, "user_email": current_user.email},
        {"$set": {
            "is_completed": True, 
            "score": submission.score,
            "user_answers": submission.user_answers 
        }},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Quiz not found")

    try:
        await award_xp(
            amount=submission.score, 
            reason="quiz_passed",
            child_id=result["child_id"],
            current_user=current_user
        )
    except Exception as e:
        # بنعمل لوج للغلط بس مش بنوقف العملية عشان الكويز اتسيف خلاص
        logger.error(f"Failed to award XP after quiz: {e}")
        
    return result

@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(quiz_id: PyObjectId, current_user: UserModel = Depends(get_current_user)):
    db = get_database()
    result = await db["quizzes"].delete_one({"_id": quiz_id, "user_email": current_user.email})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return None