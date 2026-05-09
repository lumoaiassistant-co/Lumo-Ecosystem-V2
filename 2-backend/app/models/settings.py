from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from app.models.base import PyObjectId

class NotificationSettings(BaseModel):
    distractions: bool = True
    tasks: bool = True
    achievements: bool = True
    # استخدمنا alias عشان التوافق مع الفرونت إند
    weekly_report: bool = Field(default=False, alias="weeklyReport")

    model_config = ConfigDict(populate_by_name=True)

class UserSettingsModel(BaseModel):
    """
    تخزين إعدادات حساب الأب.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_email: str = Field(...)
    theme: str = Field(default="auto")
    focus_sensitivity: int = Field(default=70)
    notifications: NotificationSettings = Field(default_factory=NotificationSettings)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )