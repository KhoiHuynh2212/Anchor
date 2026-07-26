from fastapi import APIRouter
from app.core.database import get_db
from app.services import ai_engine
from app.services.voice import text_to_speech_base64
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/trigger-brief/{user_id}")
async def trigger_brief(user_id: str):
    """Manually trigger morning brief generation for a user. No auth required (hackathon convenience)."""
    brief_data = await ai_engine.generate_morning_brief(user_id)
    audio_base64 = await text_to_speech_base64(brief_data["text"])

    db = get_db()
    from app.services import knowledge_graph as kg
    nodes = await kg.get_user_graph(user_id)
    events = [n for n in nodes if n.get("node_type") == "event"]
    tasks = [n for n in nodes if n.get("node_type") == "task"]

    brief = {
        "user_id": user_id,
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "text": brief_data["text"],
        "nickname": brief_data.get("nickname", "friend"),
        "audio_base64": audio_base64,
        "calendar_events": [{"title": e["label"], **e.get("properties", {})} for e in events],
        "tasks": [{"title": t["label"], **t.get("properties", {})} for t in tasks],
        "generated_at": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow(),
    }
    await db.briefs.insert_one(brief)
    brief["_id"] = str(brief.get("_id", ""))
    return brief


@router.post("/trigger-nudges/{user_id}")
async def trigger_nudges(user_id: str):
    """Manually trigger nudge generation. No auth required."""
    nudges = []
    for nudge_type in ["goal_check_in", "deadline_reminder", "reflection_prompt"]:
        nudge_data = await ai_engine.generate_nudge(user_id, nudge_type)
        db = get_db()
        nudge = {
            "user_id": user_id,
            "type": nudge_type,
            "title": nudge_data.get("title", "Check-in time"),
            "body": nudge_data.get("body", ""),
            "emoji": nudge_data.get("emoji", ""),
            "status": "pending",
            "scheduled_for": datetime.utcnow(),
            "created_at": datetime.utcnow(),
        }
        result = await db.nudges.insert_one(nudge)
        nudge["_id"] = str(result.inserted_id)
        nudges.append(nudge)
    return {"nudges": nudges}


@router.post("/seed")
async def seed_data():
    """Seed demo data. No auth required."""
    from scripts.seed_demo_data import seed
    result = await seed()
    return result
