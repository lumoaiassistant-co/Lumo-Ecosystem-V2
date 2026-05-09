from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
from app.models.base import PyObjectId

class FocusMetric(BaseModel):
    day: str # Mon, Tue...
    focus: int # نسبة التركيز 0-100
    distractions: int # عدد التشتتات

class BehaviorMetric(BaseModel):
    subject: str # Focus, Completion...
    value: int # 0-100

class Notification(BaseModel):
    id: str # معرف التنبيه
    type: str # warning, info, success
    message: str
    time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    severity: str # high, medium, low

class Badge(BaseModel):
    id: str
    name: str
    icon: str 
    description: str
    unlocked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserStatsModel(BaseModel):
    """
    تخزين الإحصائيات، نظام التحفيز، والتنبيهات لكل مستخدم أو طفل.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_email: str = Field(...)
    child_id: Optional[PyObjectId] = None # مربوط بطفل معين أو الأب نفسه
    
    # === نظام التحفيز (Gamification) ===
    current_xp: int = Field(default=0)
    current_level: int = Field(default=1)
    xp_to_next_level: int = Field(default=100)
    badges: List[Badge] = Field(default_factory=list)
    
    # === بيانات التحليل (Analytics) ===
    focus_data: List[FocusMetric] = Field(default_factory=list)
    behavior_data: List[BehaviorMetric] = Field(default_factory=list)
    notifications: List[Notification] = Field(default_factory=list)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )