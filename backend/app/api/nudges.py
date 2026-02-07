from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user_id
from app.core.database import get_db
from app.models.nudge import NudgeResponse, NudgeSnooze
from datetime import datetime, timedelta
from bson import ObjectId

router = APIRouter(prefix="/nudges", tags=["nudges"])


@router.get("/")
async def get_nudges(user_id: str = Depends(get_current_user_id)):
    db = get_db()
    nudges = []
    async for nudge in db.nudges.find({"user_id": user_id}).sort("scheduled_for", -1).limit(20):
        nudge["_id"] = str(nudge["_id"])
        nudges.append(nudge)
    return {"nudges": nudges}


@router.post("/{nudge_id}/respond")
async def respond_to_nudge(nudge_id: str, body: NudgeResponse, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    result = await db.nudges.update_one(
        {"_id": ObjectId(nudge_id), "user_id": user_id},
        {"$set": {"status": "responded", "response": body.response_text, "opened_at": datetime.utcnow()}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Nudge not found")
    return {"status": "responded"}


@router.post("/{nudge_id}/snooze")
async def snooze_nudge(nudge_id: str, body: NudgeSnooze, user_id: str = Depends(get_current_user_id)):
    db = get_db()
    new_time = datetime.utcnow() + timedelta(minutes=body.snooze_minutes)
    result = await db.nudges.update_one(
        {"_id": ObjectId(nudge_id), "user_id": user_id},
        {"$set": {"status": "snoozed", "scheduled_for": new_time}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Nudge not found")
    return {"status": "snoozed", "new_time": new_time.isoformat()}
