from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class KnowledgeEdge(BaseModel):
    target_id: str
    relationship: str  # requires, knows, has_deadline, can_help_with, related_to, blocks, supports
    weight: float = 0.5


class KnowledgeNode(BaseModel):
    user_id: str
    node_type: str  # goal, contact, deadline, skill, interest, value
    label: str
    properties: dict = {}
    edges: list[KnowledgeEdge] = []
    source: str = "manual"  # onboarding_chat, gmail_scan, calendar_event, manual
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class NodeCreate(BaseModel):
    node_type: str
    label: str
    properties: dict = {}
    edges: list[KnowledgeEdge] = []
    source: str = "manual"


class GraphResponse(BaseModel):
    nodes: list[dict]
    edges: list[dict] = []
