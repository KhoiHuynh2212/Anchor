from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user_id
from app.core.database import get_db
from pydantic import BaseModel
from app.models.conversation import ChatMessage, ChatResponse, ConversationInsights
from app.services import ai_engine
from app.services import knowledge_graph as kg
from app.services.voice import speech_to_text, text_to_speech_base64
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/checkin", tags=["checkin"])


class StartCheckinRequest(BaseModel):
    voice_mode: bool = True


@router.post("/start")
async def start_checkin(body: StartCheckinRequest = StartCheckinRequest(), user_id: str = Depends(get_current_user_id)):
    db = get_db()

    # Create a new conversation
    conv = {
        "user_id": user_id,
        "type": "evening_checkin",
        "messages": [],
        "created_at": datetime.utcnow(),
    }
    result = await db.conversations.insert_one(conv)
    conversation_id = str(result.inserted_id)

    # Get initial AI prompt
    ai_result = await ai_engine.chat_evening_checkin(user_id, "", "This is the start of the conversation.")
    ai_response = ai_result["response"]

    # Generate audio for AI response (only in voice mode)
    audio_base64 = None
    if body.voice_mode:
        audio_base64 = await text_to_speech_base64(ai_response)

    # Save AI message
    ai_msg = {"role": "assistant", "content": ai_response, "timestamp": datetime.utcnow()}
    await db.conversations.update_one(
        {"_id": result.inserted_id},
        {"$push": {"messages": ai_msg}},
    )

    return {
        "conversation_id": conversation_id,
        "ai_response": ai_response,
        "audio_base64": audio_base64,
    }


@router.post("/message", response_model=ChatResponse)
async def send_message(msg: ChatMessage, user_id: str = Depends(get_current_user_id)):
    db = get_db()

    if not msg.conversation_id:
        raise HTTPException(status_code=400, detail="conversation_id required")

    conv = await db.conversations.find_one({"_id": ObjectId(msg.conversation_id), "user_id": user_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Handle voice input
    user_text = msg.message
    if msg.audio_base64 and not user_text:
        user_text = await speech_to_text(msg.audio_base64)
        if not user_text:
            user_text = "(voice message could not be transcribed)"

    # Build conversation history
    history_lines = []
    for m in conv.get("messages", []):
        role = "Sage" if m["role"] == "assistant" else "User"
        history_lines.append(f"{role}: {m['content']}")
    history = "\n".join(history_lines) if history_lines else "This is the start."

    # Get AI response
    ai_result = await ai_engine.chat_evening_checkin(user_id, user_text, history)
    ai_response = ai_result["response"]

    # Generate audio (only in voice mode)
    audio_base64 = None
    if msg.voice_mode:
        audio_base64 = await text_to_speech_base64(ai_response)

    # Save messages
    user_msg = {"role": "user", "content": user_text, "timestamp": datetime.utcnow()}
    ai_msg = {"role": "assistant", "content": ai_response, "timestamp": datetime.utcnow()}
    await db.conversations.update_one(
        {"_id": ObjectId(msg.conversation_id)},
        {"$push": {"messages": {"$each": [user_msg, ai_msg]}}},
    )

    # Check if conversation should end (after ~5 exchanges)
    total_messages = len(conv.get("messages", [])) + 2
    complete = total_messages >= 10  # 5 exchanges = 10 messages

    insights = None
    entities = []
    if complete:
        # Extract insights
        all_messages = conv.get("messages", []) + [user_msg, ai_msg]
        conv_text = "\n".join([f"{'Sage' if m['role'] == 'assistant' else 'User'}: {m['content']}" for m in all_messages])
        insight_data = await ai_engine.extract_insights(conv_text)

        insights = ConversationInsights(
            mood=insight_data.get("mood", "neutral"),
            accomplishments=insight_data.get("accomplishments", []),
            blockers=insight_data.get("blockers", []),
            action_items=insight_data.get("action_items", []),
        )

        # Save insights to conversation
        await db.conversations.update_one(
            {"_id": ObjectId(msg.conversation_id)},
            {"$set": {
                "summary": insight_data.get("summary", ""),
                "insights": insight_data,
            }},
        )

        # Extract entities and persist to knowledge graph
        entities = list(insight_data.get("entities", []))
        extracted_labels = {(e.get("type"), (e.get("label") or "").strip().lower()) for e in entities}

        # Auto-convert action_items → task entities
        for item in insight_data.get("action_items", []):
            if ("task", item.strip().lower()) not in extracted_labels:
                entities.append({"type": "task", "label": item.strip(), "properties": {"source_field": "action_item"}})
                extracted_labels.add(("task", item.strip().lower()))

        # Auto-convert blockers → blocker entities
        for item in insight_data.get("blockers", []):
            if ("blocker", item.strip().lower()) not in extracted_labels:
                entities.append({"type": "blocker", "label": item.strip(), "properties": {"source_field": "blocker"}})
                extracted_labels.add(("blocker", item.strip().lower()))

        if entities:
            await kg.add_entities_from_ai(user_id, entities, source="evening_checkin")

    return ChatResponse(
        ai_response=ai_response,
        audio_base64=audio_base64,
        conversation_id=msg.conversation_id,
        complete=complete,
        insights=insights,
        extracted_entities=entities if complete else [],
    )
