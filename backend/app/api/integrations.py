from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from app.core.auth import get_current_user_id
from app.core.database import get_db
from app.services import google_integration as google
from app.services import todoist_integration as todoist

router = APIRouter(prefix="/integrations", tags=["integrations"])


class TodoistConnect(BaseModel):
    api_token: str


@router.get("/google/auth-url")
async def google_auth_url():
    """Get Google OAuth2 authorization URL."""
    url = google.get_auth_url()
    return {"auth_url": url}


@router.post("/google/callback")
async def google_callback(code: str, user_id: str = Depends(get_current_user_id)):
    """Exchange Google authorization code for tokens."""
    try:
        tokens = await google.exchange_code(code)
        db = get_db()
        await db.users.update_one(
            {"supabase_id": user_id},
            {"$set": {
                "integrations.google": {
                    "access_token": tokens.get("access_token"),
                    "refresh_token": tokens.get("refresh_token"),
                    "connected_at": datetime.utcnow(),
                },
            }},
        )
        return {"status": "connected"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google auth failed: {str(e)}")


@router.post("/google/sync")
async def google_sync(user_id: str = Depends(get_current_user_id)):
    """Trigger manual Google Calendar + Gmail sync."""
    events = await google.sync_calendar(user_id)
    emails = await google.scan_gmail(user_id)
    return {
        "events_synced": len(events),
        "emails_scanned": len(emails),
    }


@router.post("/todoist/connect")
async def todoist_connect(body: TodoistConnect, user_id: str = Depends(get_current_user_id)):
    """Store Todoist API token."""
    db = get_db()
    await db.users.update_one(
        {"supabase_id": user_id},
        {"$set": {
            "integrations.todoist": {
                "api_token": body.api_token,
                "connected_at": datetime.utcnow(),
            },
        }},
    )
    return {"status": "connected"}


@router.post("/todoist/sync")
async def todoist_sync(user_id: str = Depends(get_current_user_id)):
    """Trigger manual Todoist task sync."""
    tasks = await todoist.sync_tasks(user_id)
    return {"tasks_synced": len(tasks)}
