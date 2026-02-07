import json
import asyncio
import google.generativeai as genai
from app.config import settings
from app.core.prompts import (
    SAGE_BASE_PERSONALITY,
    MORNING_BRIEF_PROMPT,
    EVENING_CHECKIN_PROMPT,
    ONBOARDING_CHAT_PROMPT,
    NUDGE_GENERATION_PROMPT,
    INSIGHT_EXTRACTION_PROMPT,
)
from app.services import knowledge_graph as kg
from app.core.database import get_db

# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)
model = genai.GenerativeModel(settings.gemini_model)


async def _get_user_profile(user_id: str) -> dict:
    db = get_db()
    user = await db.users.find_one({"supabase_id": user_id})
    if not user:
        return {}
    return {
        "nickname": user.get("nickname", user.get("name", "friend")),
        "name": user.get("name", ""),
        "motivation_style": user.get("motivation_style", "balanced"),
        "goals": user.get("goals", []),
        "wake_time": user.get("wake_time", "07:00"),
        "bed_time": user.get("bed_time", "23:00"),
    }


async def _call_gemini(prompt: str, temperature: float = 0.8, max_tokens: int = 500) -> str:
    try:
        response = await asyncio.to_thread(
            model.generate_content,
            SAGE_BASE_PERSONALITY + "\n\n" + prompt,
            generation_config={"temperature": temperature, "max_output_tokens": max_tokens},
        )
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        return "I'm having a moment — let me gather my thoughts. Could you try again?"


async def generate_morning_brief(user_id: str) -> dict:
    profile = await _get_user_profile(user_id)
    knowledge_context = await kg.get_relevant_context(user_id)

    prompt = MORNING_BRIEF_PROMPT.format(
        motivation_style=profile.get("motivation_style", "balanced"),
        user_profile=json.dumps(profile, indent=2),
        today_context="Check the knowledge graph for today's events and tasks.",
        knowledge_context=knowledge_context,
    )

    text = await _call_gemini(prompt)
    return {"text": text, "nickname": profile.get("nickname", "friend")}


async def chat_onboarding(user_id: str, message: str, conversation_history: str) -> dict:
    profile = await _get_user_profile(user_id)

    prompt = ONBOARDING_CHAT_PROMPT.format(
        nickname=profile.get("nickname", "friend"),
        goals=", ".join(profile.get("goals", ["not yet shared"])),
        motivation_style=profile.get("motivation_style", "balanced"),
        conversation_history=conversation_history,
    )

    # Add user message context
    prompt += f"\n\nUser just said: {message}\n\nRespond as Sage. Also return a JSON block at the end with any entities you extracted, like:\n[ENTITIES]{{\"entities\": [{{\"type\": \"contact\", \"label\": \"Name\", \"properties\": {{}}}}]}}[/ENTITIES]\nIf there's nothing to extract, return [ENTITIES]{{\"entities\": []}}[/ENTITIES]\nIf this conversation feels complete (4-5 exchanges done), add [COMPLETE] at the very end."

    response_text = await _call_gemini(prompt)

    # Parse entities
    entities = []
    complete = False
    clean_text = response_text

    if "[ENTITIES]" in response_text:
        try:
            start = response_text.index("[ENTITIES]") + len("[ENTITIES]")
            end = response_text.index("[/ENTITIES]")
            entity_json = response_text[start:end].strip()
            parsed = json.loads(entity_json)
            entities = parsed.get("entities", [])
            clean_text = response_text[:response_text.index("[ENTITIES]")].strip()
        except (ValueError, json.JSONDecodeError):
            pass

    if "[COMPLETE]" in clean_text:
        complete = True
        clean_text = clean_text.replace("[COMPLETE]", "").strip()

    return {"response": clean_text, "entities": entities, "complete": complete}


async def chat_evening_checkin(user_id: str, message: str, conversation_history: str) -> dict:
    profile = await _get_user_profile(user_id)
    knowledge_context = await kg.get_relevant_context(user_id)

    # Fetch recent check-in summaries for continuity
    db = get_db()
    recent_context = ""
    recent_checkins = db.conversations.find(
        {"user_id": user_id, "type": "evening_checkin", "insights": {"$exists": True}},
        sort=[("created_at", -1)],
        limit=3,
    )
    summaries = []
    async for conv in recent_checkins:
        insights = conv.get("insights", {})
        if insights.get("summary"):
            summaries.append(insights["summary"])
    if summaries:
        recent_context = "\n\nRecent check-in summaries:\n" + "\n".join(f"- {s}" for s in summaries)

    prompt = EVENING_CHECKIN_PROMPT.format(
        nickname=profile.get("nickname", "friend"),
        motivation_style=profile.get("motivation_style", "balanced"),
        knowledge_context=knowledge_context + recent_context,
        today_context="Refer to the knowledge graph for today's events and tasks.",
        conversation_history=conversation_history,
    )

    if message:
        prompt += f"\n\nUser just said: {message}"

    response_text = await _call_gemini(prompt)
    return {"response": response_text}


async def extract_insights(conversation_text: str) -> dict:
    prompt = INSIGHT_EXTRACTION_PROMPT.format(conversation=conversation_text)
    try:
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config={"temperature": 0.3, "max_output_tokens": 500},
        )
        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
        return json.loads(text)
    except Exception as e:
        print(f"Insight extraction error: {e}")
        return {"mood": "neutral", "accomplishments": [], "blockers": [], "action_items": [], "summary": ""}


async def generate_nudge(user_id: str, nudge_type: str) -> dict:
    profile = await _get_user_profile(user_id)
    knowledge_context = await kg.get_relevant_context(user_id)

    prompt = NUDGE_GENERATION_PROMPT.format(
        nudge_type=nudge_type,
        nickname=profile.get("nickname", "friend"),
        motivation_style=profile.get("motivation_style", "balanced"),
        knowledge_context=knowledge_context,
    )

    try:
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config={"temperature": 0.7, "max_output_tokens": 300},
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
        return json.loads(text)
    except Exception as e:
        print(f"Nudge generation error: {e}")
        return {"title": "Time for a check-in", "body": "How are things going?", "emoji": ""}
