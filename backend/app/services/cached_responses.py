from app.core.database import get_db
from datetime import datetime

FALLBACK_BRIEF = {
    "text": (
        "Good morning, Alex! Yesterday was a solid day — you knocked out some prep for your "
        "AI4All project and got in a good run. Today's looking productive: you've got your "
        "Coursera AI/ML quiz at 2pm and a study session with James at 4pm. I'd focus on "
        "getting that quiz prep done this morning while you're fresh. Your half marathon "
        "training is on track — maybe a light jog this evening? Remember, consistency beats "
        "intensity. Let's make today count!"
    ),
    "nickname": "Alex",
    "audio_base64": "",
    "calendar_events": [
        {"title": "Morning workout", "time": "7:00 AM", "duration": "45 min"},
        {"title": "AI4All team standup", "time": "10:00 AM", "duration": "30 min"},
        {"title": "Coursera AI/ML Quiz", "time": "2:00 PM", "duration": "1 hr"},
        {"title": "Study session with James", "time": "4:00 PM", "duration": "1.5 hr"},
    ],
    "tasks": [
        {"title": "Complete AI4All app feature", "due": "Feb 10", "priority": "high", "icon": "target"},
        {"title": "Coursera quiz prep", "due": "Today", "priority": "high", "icon": "book"},
        {"title": "Update resume", "due": "Feb 12", "priority": "medium", "icon": "file"},
        {"title": "Message James about study group", "due": "Today", "priority": "medium", "icon": "message"},
    ],
}

FALLBACK_CHECKIN_RESPONSES = [
    "Hey Alex! How are you feeling this evening? Take a moment to settle in — I'm here whenever you're ready to reflect on your day.",
    "That sounds like a meaningful day. What felt like your biggest win today?",
    "I appreciate you sharing that. Was there anything that felt challenging or didn't go as planned?",
    "It's totally natural to have those moments. What's one thing you'd like to carry into tomorrow?",
    "I love that intention. Here's what I'm taking away from our chat: you had a productive day with real progress on your goals, and you're being thoughtful about what comes next. Rest well tonight, Alex — you've earned it.",
]


async def get_cached_brief(user_id: str) -> dict | None:
    """Get a previously generated brief from the database."""
    db = get_db()
    today = datetime.utcnow().strftime("%Y-%m-%d")
    brief = await db.briefs.find_one({"user_id": user_id, "date": today})
    if brief:
        brief["_id"] = str(brief["_id"])
        return brief
    return None


def get_fallback_brief() -> dict:
    """Return hardcoded demo brief for Alex."""
    return FALLBACK_BRIEF.copy()


def get_fallback_checkin_response(turn: int) -> str:
    """Return scripted response for demo when Gemini fails."""
    if turn < len(FALLBACK_CHECKIN_RESPONSES):
        return FALLBACK_CHECKIN_RESPONSES[turn]
    return "Thank you for sharing tonight. Sleep well — I'll be here tomorrow."
