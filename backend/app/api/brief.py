from fastapi import APIRouter, Depends
from app.core.auth import get_current_user_id
from app.core.database import get_db
from app.services import ai_engine
from app.services.voice import text_to_speech_base64
from datetime import datetime, date

router = APIRouter(prefix="/brief", tags=["brief"])


@router.get("/today")
async def get_today_brief(user_id: str = Depends(get_current_user_id)):
    db = get_db()

    # Check for cached brief from today
    today_start = datetime.combine(date.today(), datetime.min.time())
    cached = await db.briefs.find_one(
        {"user_id": user_id, "created_at": {"$gte": today_start}},
        sort=[("created_at", -1)],
    )
    if cached:
        cached["_id"] = str(cached["_id"])
        return cached

    # Generate new brief
    brief_data = await ai_engine.generate_morning_brief(user_id)

    # Generate audio
    audio_base64 = await text_to_speech_base64(brief_data["text"])

    # Get events and tasks from knowledge graph
    from app.services import knowledge_graph as kg
    nodes = await kg.get_user_graph(user_id)
    events = [n for n in nodes if n.get("node_type") == "event"]
    tasks = [n for n in nodes if n.get("node_type") == "task"]

    brief = {
        "user_id": user_id,
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


@router.post("/generate")
async def generate_brief(user_id: str = Depends(get_current_user_id)):
    """Force regenerate today's brief."""
    db = get_db()
    # Delete today's cached brief
    today_start = datetime.combine(date.today(), datetime.min.time())
    await db.briefs.delete_many({"user_id": user_id, "created_at": {"$gte": today_start}})

    # Re-generate
    return await get_today_brief(user_id=user_id)
