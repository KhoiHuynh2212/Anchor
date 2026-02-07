from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Nudge(BaseModel):
    user_id: str
    type: str  # goal_check_in, deadline_reminder, reflection_prompt
    title: str
    body: str
    emoji: str = ""
    related_nodes: list[str] = []
    status: str = "pending"  # pending, delivered, opened, responded, snoozed
    scheduled_for: datetime = Field(default_factory=datetime.utcnow)
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    response: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class NudgeResponse(BaseModel):
    response_text: str


class NudgeSnooze(BaseModel):
    snooze_minutes: int = 30
