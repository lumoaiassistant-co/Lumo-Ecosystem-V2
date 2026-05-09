from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class NotificationSettingsSchema(BaseModel):
    distractions: bool
    tasks: bool
    achievements: bool
    weekly_report: bool = Field(alias="weeklyReport")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    focus_sensitivity: Optional[int] = None
    # هنا خلينا الإشعارات برضه اختيارية للتحديث الجزئي
    notifications: Optional[NotificationSettingsSchema] = None

class SettingsResponse(BaseModel):
    theme: str
    focus_sensitivity: int
    notifications: NotificationSettingsSchema

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)