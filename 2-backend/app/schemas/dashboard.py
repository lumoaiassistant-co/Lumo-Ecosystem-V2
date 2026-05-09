from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.models.stats import FocusMetric, BehaviorMetric, Notification, Badge
from app.models.base import PyObjectId

class DashboardStatsResponse(BaseModel):
    # ✅ إضافة الـ id مع الـ alias عشان يقرا من المونجو صح
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    
    focus_data: List[FocusMetric]
    behavior_data: List[BehaviorMetric]
    notifications: List[Notification]
    
    current_xp: int = Field(default=0)
    current_level: int = Field(default=1)
    xp_to_next_level: int = Field(default=100)
    
    badges: List[Badge] = Field(default_factory=list)
    
    # ✅ الإعدادات السحرية
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        arbitrary_types_allowed=True
    )