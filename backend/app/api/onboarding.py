from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user_id
from app.core.database import get_db
from app.models.user import OnboardingAnswers
from app.models.conversation import ChatMessage, ChatResponse
from app.services import ai_engine, knowledge_graph as kg
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/answers")
async def submit_answers(answers: OnboardingAnswers, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    await db.users.update_one(
        {"supabase_id": user_id},
        {"$set": {
            "nickname": answers.nickname,
            "goals": answers.goals,
            "motivation_style": answers.motivation_style,
            "wake_time": answers.wake_time,
            "bed_time": answers.bed_time,
            "updated_at": datetime.utcnow(),
        }},
        upsert=True,
    )
    # Create goal nodes in knowledge graph
    for goal in answers.goals:
        await kg.create_node(user_id, "goal", goal, {"priority": "medium", "status": "in_progress"}, source="onboarding")

    return {"status": "ok"}


@router.post("/chat", response_model=ChatResponse)
async def chat(msg: ChatMessage, user_id: str = Depends(get_current_user_id)):
    db = get_db()

    # Get or create conversation
    if msg.conversation_id:
        conv = await db.conversations.find_one({"_id": ObjectId(msg.conversation_id), "user_id": user_id})
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv = {
            "user_id": user_id,
            "type": "onboarding",
            "messages": [],
            "created_at": datetime.utcnow(),
        }
        result = await db.conversations.insert_one(conv)
        conv["_id"] = result.inserted_id

    # Build conversation history string
    history_lines = []
    for m in conv.get("messages", []):
        role = "Sage" if m["role"] == "assistant" else "User"
        history_lines.append(f"{role}: {m['content']}")
    history = "\n".join(history_lines) if history_lines else "This is the start of the conversation."

    # Get AI response
    result = await ai_engine.chat_onboarding(user_id, msg.message, history)

    # Save messages
    user_msg = {"role": "user", "content": msg.message, "timestamp": datetime.utcnow()}
    ai_msg = {"role": "assistant", "content": result["response"], "timestamp": datetime.utcnow()}
    try:
        await db.conversations.update_one(
            {"_id": conv["_id"]},
            {"$push": {"messages": {"$each": [user_msg, ai_msg]}}},
        )
    except Exception:
        # Demo-first: if Mongo hiccups (e.g. operation cancelled during reload),
        # still return the AI response instead of failing the whole request.
        pass

    # Add extracted entities to knowledge graph
    if result.get("entities"):
        await kg.add_entities_from_ai(user_id, result["entities"])

    return ChatResponse(
        ai_response=result["response"],
        conversation_id=str(conv["_id"]),
        complete=result.get("complete", False),
        extracted_entities=result.get("entities", []),
    )


@router.post("/complete")
async def complete_onboarding(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    await db.users.update_one(
        {"supabase_id": user_id},
        {"$set": {"onboarding_complete": True, "updated_at": datetime.utcnow()}},
    )
    return {"status": "ok", "onboarding_complete": True}
