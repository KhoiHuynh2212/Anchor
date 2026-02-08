import json
import asyncio
import time
from google import genai
from google.genai import types
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

# Configure Gemini client (new SDK)
client = genai.Client(api_key=settings.gemini_api_key)

_gemini_disabled_until: float = 0.0


async def _get_user_profile(user_id: str) -> dict:
    db = get_db()
    user = await db.users.find_one({"supabase_id": user_id})
    if not user:
        return {}
    nickname = (user.get("nickname") or "").strip() if isinstance(user.get("nickname"), str) else user.get("nickname")
    name = (user.get("name") or "").strip()
    resolved_nickname = nickname or name or "friend"
    return {
        "nickname": resolved_nickname,
        "name": name,
        "motivation_style": user.get("motivation_style", "balanced"),
        "goals": user.get("goals", []),
        "wake_time": user.get("wake_time", "07:00"),
        "bed_time": user.get("bed_time", "23:00"),
    }


def _is_quota_or_rate_limit_error(err: Exception) -> bool:
    msg = str(err)
    return (
        "RESOURCE_EXHAUSTED" in msg
        or "Quota exceeded" in msg
        or "rate limit" in msg.lower()
        or "429" in msg
    )


def _extract_section_lines(context: str, header: str) -> list[str]:
    """Extract bullet lines following a section header like 'Tasks:'."""
    if not context:
        return []
    lines = context.splitlines()
    try:
        start_idx = lines.index(header) + 1
    except ValueError:
        return []
    items: list[str] = []
    for line in lines[start_idx:]:
        if not line.strip():
            continue
        # Stop when next section begins (e.g. 'Goals:' / 'Skills:' etc).
        if line.endswith(":") and not line.lstrip().startswith("-"):
            break
        if line.lstrip().startswith("-"):
            items.append(line.lstrip()[1:].strip())
    return items


def _fallback_morning_brief(profile: dict, knowledge_context: str) -> str:
    nickname = profile.get("nickname", "friend")
    tasks = _extract_section_lines(knowledge_context, "Tasks:")
    events = _extract_section_lines(knowledge_context, "Today's Events:")

    focus = tasks[0] if tasks else None
    next_event = events[0] if events else None

    parts: list[str] = [f"Good morning, {nickname}."]
    if focus or next_event:
        parts.append("Here's a quick, practical plan for today:")
        if focus:
            parts.append(f"- Focus: {focus}")
        if next_event:
            parts.append(f"- Next event: {next_event}")
        parts.append("Pick one small win you can finish in 20 minutes to build momentum.")
    else:
        parts.append("I don't have your tasks/events loaded yet—tell me your top 1 priority for today and I’ll help you shape it into a simple plan.")
    return "\n".join(parts)


def _fallback_checkin_response(profile: dict, message: str) -> str:
    nickname = profile.get("nickname", "friend")
    message = (message or "").strip()

    if not message:
        return (
            f"Hey {nickname}. Before we dive in—how are you feeling right now (one or two words)?\n\n"
            "Then tell me one small win from today, even if it feels minor."
        )

    return (
        f"Got it, {nickname}. Thanks for saying it out loud.\n\n"
        "Two quick questions:\n"
        "1) What was the best moment of your day?\n"
        "2) What was the hardest part—and what do you need from tomorrow to make it 10% easier?"
    )


async def _call_gemini(prompt: str, temperature: float = 0.8, max_tokens: int = 500) -> str:
    global _gemini_disabled_until

    if not settings.gemini_api_key:
        print("[Gemini] WARNING: No API key configured — returning empty response")
        return ""

    if time.time() < _gemini_disabled_until:
        remaining = int(_gemini_disabled_until - time.time())
        print(f"[Gemini] Rate-limit cooldown active — {remaining}s remaining, returning empty")
        return ""

    print(f"[Gemini] Calling model={settings.gemini_model}, prompt length={len(prompt)}")
    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=settings.gemini_model,
            contents=SAGE_BASE_PERSONALITY + "\n\n" + prompt,
            config=types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )
        print(f"[Gemini] Success — response length={len(response.text)}")
        return response.text
    except Exception as e:
        print(f"[Gemini] API error: {type(e).__name__}: {e}")
        if _is_quota_or_rate_limit_error(e):
            # Avoid hammering the API when we're rate-limited / out of quota.
            _gemini_disabled_until = time.time() + 90
        return ""


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
    if not text.strip():
        text = _fallback_morning_brief(profile, knowledge_context)
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
    if not response_text.strip():
        # Keep onboarding moving even if Gemini is unavailable.
        response_text = (
            f"Thanks — that helps, {profile.get('nickname', 'friend')}.\n\n"
            "To keep going: what’s one goal you care about right now, and what usually gets in the way?"
            "\n\n[ENTITIES]{\"entities\": []}[/ENTITIES]"
        )

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
    if not response_text.strip():
        response_text = _fallback_checkin_response(profile, message)
    return {"response": response_text}


async def extract_insights(conversation_text: str) -> dict:
    prompt = INSIGHT_EXTRACTION_PROMPT.format(conversation=conversation_text)
    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=800,
            ),
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
        return {"mood": "neutral", "accomplishments": [], "blockers": [], "action_items": [], "summary": "", "entities": []}


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
            client.models.generate_content,
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=300,
            ),
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
