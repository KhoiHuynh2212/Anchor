from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.auth import get_current_user_id
from app.core.database import get_db
from app.models.user import UserResponse
from datetime import datetime


class PushTokenRequest(BaseModel):
    expo_push_token: str


class ProfileUpdate(BaseModel):
    nickname: str | None = None
    motivation_style: str | None = None
    wake_time: str | None = None
    bed_time: str | None = None

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserResponse)
async def get_me(supabase_id: str = Depends(get_current_user_id)):
    """Get current user profile. Creates profile in MongoDB on first call."""
    db = get_db()
    user_doc = await db.users.find_one({"supabase_id": supabase_id})
    if not user_doc:
        # Lazily create a MongoDB profile for existing Supabase users.
        from app.core.auth import get_supabase

        supabase = get_supabase()
        try:
            user_info = supabase.auth.admin.get_user_by_id(supabase_id)
            email = user_info.user.email
            name = user_info.user.user_metadata.get("name", "")
        except Exception:
            raise HTTPException(status_code=404, detail="User profile not found.")

        now = datetime.utcnow()
        # Use an atomic upsert to avoid duplicate-key races under concurrent requests.
        await db.users.update_one(
            {"supabase_id": supabase_id},
            {
                "$setOnInsert": {
                    "supabase_id": supabase_id,
                    "nickname": None,
                    "motivation_style": "balanced",
                    "wake_time": "07:00",
                    "bed_time": "23:00",
                    "timezone": "America/Chicago",
                    "goals": [],
                    "onboarding_complete": False,
                    "created_at": now,
                },
                "$set": {
                    "email": email,
                    "name": name,
                    "updated_at": now,
                },
            },
            upsert=True,
        )
        user_doc = await db.users.find_one({"supabase_id": supabase_id})
    return UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        name=user_doc["name"],
        nickname=user_doc.get("nickname"),
        onboarding_complete=user_doc.get("onboarding_complete", False),
    )


@router.post("/sync", response_model=UserResponse)
async def sync_user(supabase_id: str = Depends(get_current_user_id)):
    """Called after Supabase login/register to ensure MongoDB profile exists."""
    from app.core.auth import get_supabase

    supabase = get_supabase()
    user_info = supabase.auth.admin.get_user_by_id(supabase_id)

    db = get_db()
    email = user_info.user.email
    name = user_info.user.user_metadata.get("name", "")
    now = datetime.utcnow()

    # Atomic upsert so multiple sync calls never race into DuplicateKeyError.
    await db.users.update_one(
        {"supabase_id": supabase_id},
        {
            "$setOnInsert": {
                "supabase_id": supabase_id,
                "nickname": None,
                "motivation_style": "balanced",
                "wake_time": "07:00",
                "bed_time": "23:00",
                "timezone": "America/Chicago",
                "goals": [],
                "onboarding_complete": False,
                "created_at": now,
            },
            "$set": {
                "email": email,
                "name": name,
                "updated_at": now,
            },
        },
        upsert=True,
    )
    user_doc = await db.users.find_one({"supabase_id": supabase_id})

    return UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        name=user_doc["name"],
        nickname=user_doc.get("nickname"),
        onboarding_complete=user_doc.get("onboarding_complete", False),
    )


@router.post("/push-token")
async def register_push_token(body: PushTokenRequest, user_id: str = Depends(get_current_user_id)):
    """Save Expo push token for the current user."""
    db = get_db()
    await db.users.update_one(
        {"supabase_id": user_id},
        {"$set": {"expo_push_token": body.expo_push_token, "updated_at": datetime.utcnow()}},
    )
    return {"status": "ok"}


@router.put("/me")
async def update_profile(body: ProfileUpdate, user_id: str = Depends(get_current_user_id)):
    """Update user profile fields."""
    db = get_db()
    update_fields = {"updated_at": datetime.utcnow()}
    for field in ["nickname", "motivation_style", "wake_time", "bed_time"]:
        value = getattr(body, field)
        if value is not None:
            update_fields[field] = value

    await db.users.update_one(
        {"supabase_id": user_id},
        {"$set": update_fields},
    )

    user_doc = await db.users.find_one({"supabase_id": user_id})
    return UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        name=user_doc["name"],
        nickname=user_doc.get("nickname"),
        onboarding_complete=user_doc.get("onboarding_complete", False),
    )
