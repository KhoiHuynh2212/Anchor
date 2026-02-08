from fastapi import APIRouter, Depends
from app.core.auth import get_current_user_id
from app.core.database import get_db
from app.services import ai_engine
from app.services.voice import text_to_speech_base64
from datetime import datetime, date
from pymongo.errors import DuplicateKeyError

router = APIRouter(prefix="/brief", tags=["brief"])


@router.get("/today")
async def get_today_brief(user_id: str = Depends(get_current_user_id)):
    db = get_db()

    today_str = date.today().strftime("%Y-%m-%d")

    # Check for cached brief from today (by stable key).
    # Using `date` avoids issues with older docs missing `created_at`.
    cached = await db.briefs.find_one({"user_id": user_id, "date": today_str})
    if cached:
        # If the user changed their nickname, regenerate so the *text greeting*
        # updates too (otherwise the cached text keeps saying the old name).
        user_doc = await db.users.find_one({"supabase_id": user_id})
        current_nickname = (user_doc or {}).get("nickname") or (user_doc or {}).get("name") or None
        if current_nickname and current_nickname != cached.get("nickname"):
            # Re-generate using the latest profile.
            brief_data = await ai_engine.generate_morning_brief(user_id)
            audio_base64 = await text_to_speech_base64(brief_data["text"])
            from app.services import knowledge_graph as kg
            nodes = await kg.get_user_graph(user_id)
            events = [n for n in nodes if n.get("node_type") == "event"]
            tasks = [n for n in nodes if n.get("node_type") == "task"]

            await db.briefs.update_one(
                {"_id": cached["_id"]},
                {"$set": {
                    "text": brief_data["text"],
                    "nickname": brief_data.get("nickname", "friend"),
                    "audio_base64": audio_base64,
                    "calendar_events": [{"title": e["label"], **e.get("properties", {})} for e in events],
                    "tasks": [{"title": t["label"], **t.get("properties", {})} for t in tasks],
                    "generated_at": datetime.utcnow().isoformat(),
                }},
            )
            cached = await db.briefs.find_one({"user_id": user_id, "date": today_str})

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
        "date": today_str,
        "text": brief_data["text"],
        "nickname": brief_data.get("nickname", "friend"),
        "audio_base64": audio_base64,
        "calendar_events": [{"title": e["label"], **e.get("properties", {})} for e in events],
        "tasks": [{"title": t["label"], **t.get("properties", {})} for t in tasks],
        "generated_at": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow(),
    }
    try:
        result = await db.briefs.insert_one(brief)
        brief["_id"] = str(result.inserted_id)
    except DuplicateKeyError:
        # Another request (or an older doc) already created today's brief.
        cached = await db.briefs.find_one({"user_id": user_id, "date": today_str})
        if cached:
            cached["_id"] = str(cached["_id"])
            return cached
        raise

    return brief


@router.post("/generate")
async def generate_brief(user_id: str = Depends(get_current_user_id)):
    """Force regenerate today's brief."""
    db = get_db()
    today_str = date.today().strftime("%Y-%m-%d")
    await db.briefs.delete_many({"user_id": user_id, "date": today_str})

    # Re-generate
    return await get_today_brief(user_id=user_id)
