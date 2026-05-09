from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
from datetime import datetime, timezone
from app.models.base import PyObjectId

class Question(BaseModel):
    question_text: str
    question_type: str 
    options: List[str] = [] 
    correct_answer: str
    points: int = 5 

class QuizModel(BaseModel):
    """
    موديل الاختبار المخزن في MongoDB.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_email: str = Field(...)
    child_id: PyObjectId = Field(...) 
    title: str = Field(...)
    topic: str = Field(...)
    duration_minutes: int = Field(default=15)
    questions: List[Question]
    
    is_completed: bool = False
    score: Optional[int] = None
    user_answers: Optional[Dict[str, str]] = None 
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )