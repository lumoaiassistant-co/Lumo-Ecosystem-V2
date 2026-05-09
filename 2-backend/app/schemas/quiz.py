from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
from app.models.quiz import Question
from app.models.base import PyObjectId

class QuizCreate(BaseModel):
    title: str
    topic: str
    duration_minutes: int
    questions: List[Question]
    child_id: PyObjectId

class QuizGenerateRequest(BaseModel):
    topic: str
    num_questions: int = 5
    difficulty: str = "easy" # easy, medium, hard

class QuizSubmit(BaseModel):
    score: int
    user_answers: Dict[str, str] 

class QuizResponse(BaseModel):
    id: PyObjectId = Field(alias="id")
    title: str
    topic: str
    duration_minutes: int
    questions: List[Question]
    child_id: PyObjectId
    is_completed: bool
    score: Optional[int] = None
    user_answers: Optional[Dict[str, str]] = None 

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)