from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class IntegrationGoogle(BaseModel):
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    connected_at: Optional[datetime] = None


class IntegrationTodoist(BaseModel):
    api_token: Optional[str] = None
    connected_at: Optional[datetime] = None


class Integrations(BaseModel):
    google: Optional[IntegrationGoogle] = None
    todoist: Optional[IntegrationTodoist] = None


class UserProfile(BaseModel):
    supabase_id: str
    email: str
    name: str
    nickname: Optional[str] = None
    motivation_style: str = "balanced"  # gentle | balanced | direct
    wake_time: str = "07:00"
    bed_time: str = "23:00"
    timezone: str = "America/Chicago"
    goals: list[str] = []
    onboarding_complete: bool = False
    expo_push_token: Optional[str] = None
    integrations: Integrations = Field(default_factory=Integrations)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class OnboardingAnswers(BaseModel):
    nickname: str
    goals: list[str]
    motivation_style: str
    wake_time: str
    bed_time: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    nickname: Optional[str] = None
    onboarding_complete: bool = False
