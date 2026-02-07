from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Message(BaseModel):
    role: str  # assistant, user
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    audio_url: Optional[str] = None
    metadata: dict = {}


class ConversationInsights(BaseModel):
    mood: str = "neutral"  # positive, neutral, negative
    accomplishments: list[str] = []
    blockers: list[str] = []
    action_items: list[str] = []


class Conversation(BaseModel):
    user_id: str
    type: str  # onboarding, morning_brief, evening_checkin, nudge_response
    messages: list[Message] = []
    summary: Optional[str] = None
    insights: Optional[ConversationInsights] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ChatMessage(BaseModel):
    message: str = ""
    audio_base64: Optional[str] = None
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    ai_response: str
    audio_base64: Optional[str] = None
    conversation_id: str
    complete: bool = False
    insights: Optional[ConversationInsights] = None
    extracted_entities: list[dict] = []
