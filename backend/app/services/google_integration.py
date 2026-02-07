import httpx
from datetime import datetime, timedelta
from urllib.parse import urlencode
from app.config import settings
from app.core.database import get_db
from app.services import knowledge_graph as kg

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"
GOOGLE_GMAIL_API = "https://gmail.googleapis.com/gmail/v1"

SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
]


def get_auth_url() -> str:
    """Generate Google OAuth2 authorization URL."""
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_code(code: str) -> dict:
    """Exchange authorization code for tokens."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        response.raise_for_status()
        return response.json()


async def refresh_token(user_id: str) -> str:
    """Refresh the access token for a user."""
    db = get_db()
    user = await db.users.find_one({"supabase_id": user_id})
    if not user or not user.get("integrations", {}).get("google", {}).get("refresh_token"):
        raise ValueError("No Google refresh token found")

    refresh_tok = user["integrations"]["google"]["refresh_token"]

    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "refresh_token": refresh_tok,
                "grant_type": "refresh_token",
            },
        )
        response.raise_for_status()
        data = response.json()

    new_access = data["access_token"]
    await db.users.update_one(
        {"supabase_id": user_id},
        {"$set": {"integrations.google.access_token": new_access}},
    )
    return new_access


async def _get_access_token(user_id: str) -> str:
    """Get a valid access token, refreshing if needed."""
    db = get_db()
    user = await db.users.find_one({"supabase_id": user_id})
    token = user.get("integrations", {}).get("google", {}).get("access_token", "")
    if not token:
        raise ValueError("No Google access token")
    return token


async def sync_calendar(user_id: str) -> list:
    """Fetch today's events from Google Calendar and add as knowledge graph nodes."""
    try:
        access_token = await _get_access_token(user_id)
    except ValueError:
        return []

    now = datetime.utcnow()
    time_min = now.replace(hour=0, minute=0, second=0).isoformat() + "Z"
    time_max = (now.replace(hour=0, minute=0, second=0) + timedelta(days=1)).isoformat() + "Z"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GOOGLE_CALENDAR_API}/calendars/primary/events",
                headers={"Authorization": f"Bearer {access_token}"},
                params={
                    "timeMin": time_min,
                    "timeMax": time_max,
                    "singleEvents": "true",
                    "orderBy": "startTime",
                },
            )
            if response.status_code == 401:
                access_token = await refresh_token(user_id)
                response = await client.get(
                    f"{GOOGLE_CALENDAR_API}/calendars/primary/events",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params={
                        "timeMin": time_min,
                        "timeMax": time_max,
                        "singleEvents": "true",
                        "orderBy": "startTime",
                    },
                )
            response.raise_for_status()
            data = response.json()

        events = data.get("items", [])
        created = []
        for event in events:
            start = event.get("start", {})
            time_str = start.get("dateTime", start.get("date", ""))
            node = await kg.create_node(
                user_id=user_id,
                node_type="event",
                label=event.get("summary", "Untitled Event"),
                properties={
                    "time": time_str,
                    "location": event.get("location", ""),
                    "description": event.get("description", "")[:200],
                    "google_event_id": event.get("id", ""),
                },
                source="calendar_event",
            )
            created.append(node)
        return created
    except Exception as e:
        print(f"Calendar sync error for {user_id}: {e}")
        return []


async def scan_gmail(user_id: str) -> list:
    """Fetch recent emails and extract actionable items."""
    try:
        access_token = await _get_access_token(user_id)
    except ValueError:
        return []

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GOOGLE_GMAIL_API}/users/me/messages",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"maxResults": 10, "q": "is:unread"},
            )
            if response.status_code == 401:
                access_token = await refresh_token(user_id)
                response = await client.get(
                    f"{GOOGLE_GMAIL_API}/users/me/messages",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params={"maxResults": 10, "q": "is:unread"},
                )
            response.raise_for_status()
            messages = response.json().get("messages", [])

        created = []
        for msg_ref in messages[:5]:
            async with httpx.AsyncClient() as client:
                msg_response = await client.get(
                    f"{GOOGLE_GMAIL_API}/users/me/messages/{msg_ref['id']}",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params={"format": "metadata", "metadataHeaders": ["Subject", "From"]},
                )
                if msg_response.status_code != 200:
                    continue
                msg_data = msg_response.json()

            headers = {h["name"]: h["value"] for h in msg_data.get("payload", {}).get("headers", [])}
            subject = headers.get("Subject", "No Subject")
            sender = headers.get("From", "Unknown")

            node = await kg.create_node(
                user_id=user_id,
                node_type="task",
                label=f"Email: {subject}",
                properties={
                    "from": sender,
                    "gmail_id": msg_ref["id"],
                    "snippet": msg_data.get("snippet", "")[:200],
                },
                source="gmail_scan",
            )
            created.append(node)
        return created
    except Exception as e:
        print(f"Gmail scan error for {user_id}: {e}")
        return []
