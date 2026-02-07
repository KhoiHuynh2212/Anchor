import httpx
from app.core.database import get_db

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push(expo_push_token: str, title: str, body: str, data: dict = None) -> bool:
    """Send a push notification via Expo Push API."""
    if not expo_push_token or not expo_push_token.startswith("ExponentPushToken"):
        return False

    payload = {
        "to": expo_push_token,
        "title": title,
        "body": body,
        "sound": "default",
    }
    if data:
        payload["data"] = data

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(EXPO_PUSH_URL, json=payload)
            response.raise_for_status()
            return True
    except Exception as e:
        print(f"Push notification error: {e}")
        return False


async def send_to_user(user_id: str, title: str, body: str, data: dict = None) -> bool:
    """Look up user's push token and send notification."""
    db = get_db()
    user = await db.users.find_one({"supabase_id": user_id})
    if not user:
        return False

    token = user.get("expo_push_token")
    if not token:
        return False

    return await send_push(token, title, body, data)
