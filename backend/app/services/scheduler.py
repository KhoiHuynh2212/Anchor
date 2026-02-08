from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from app.core.database import get_db
from app.services import ai_engine
from app.services import push_notifications as push
from datetime import datetime, timedelta

scheduler = AsyncIOScheduler()


async def generate_morning_briefs():
    """Generate morning briefs for all users at their wake time."""
    db = get_db()
    now = datetime.utcnow()
    current_hour = f"{now.hour:02d}:00"

    async for user in db.users.find({"onboarding_complete": True}):
        wake_time = user.get("wake_time", "07:00")
        if wake_time[:2] + ":00" != current_hour:
            continue

        user_id = user["supabase_id"]
        try:
            brief = await ai_engine.generate_morning_brief(user_id)
            from app.services.voice import text_to_speech_base64
            audio = await text_to_speech_base64(brief["text"])

            await db.briefs.update_one(
                {"user_id": user_id, "date": now.strftime("%Y-%m-%d")},
                {"$set": {
                    "user_id": user_id,
                    "date": now.strftime("%Y-%m-%d"),
                    "text": brief["text"],
                    "nickname": brief["nickname"],
                    "audio_base64": audio,
                    "generated_at": now,
                }},
                upsert=True,
            )

            token = user.get("expo_push_token")
            if token:
                await push.send_push(
                    token,
                    f"Good morning, {brief['nickname']}!",
                    "Your morning brief is ready.",
                    {"screen": "Brief"},
                )
        except Exception as e:
            print(f"Morning brief error for {user_id}: {e}")


async def send_nudges():
    """Send contextual nudges 3x daily."""
    db = get_db()
    now = datetime.utcnow()
    hour = now.hour

    if hour == 10:
        nudge_type = "goal_check_in"
    elif hour == 14:
        nudge_type = "deadline_reminder"
    elif hour == 18:
        nudge_type = "reflection_prompt"
    else:
        return

    async for user in db.users.find({"onboarding_complete": True}):
        user_id = user["supabase_id"]
        try:
            nudge_data = await ai_engine.generate_nudge(user_id, nudge_type)
            nudge_doc = {
                "user_id": user_id,
                "type": nudge_type,
                "title": nudge_data.get("title", "Check in"),
                "body": nudge_data.get("body", ""),
                "emoji": nudge_data.get("emoji", ""),
                "status": "pending",
                "scheduled_for": now,
                "created_at": now,
            }
            await db.nudges.insert_one(nudge_doc)

            token = user.get("expo_push_token")
            if token:
                await push.send_push(
                    token,
                    nudge_data.get("title", "Check in"),
                    nudge_data.get("body", ""),
                    {"screen": "Nudges"},
                )
        except Exception as e:
            print(f"Nudge error for {user_id}: {e}")


async def evening_checkin_prompt():
    """Send evening check-in reminder 1hr before bedtime."""
    db = get_db()
    now = datetime.utcnow()
    current_hour = f"{now.hour:02d}:00"

    async for user in db.users.find({"onboarding_complete": True}):
        bed_time = user.get("bed_time", "23:00")
        bed_hour = int(bed_time.split(":")[0])
        reminder_hour = f"{(bed_hour - 1) % 24:02d}:00"

        if reminder_hour != current_hour:
            continue

        token = user.get("expo_push_token")
        if token:
            nickname = user.get("nickname", user.get("name", "friend"))
            try:
                await push.send_push(
                    token,
                    f"Evening reflection time, {nickname}",
                    "Take a few minutes to check in with yourself.",
                    {"screen": "Check-in"},
                )
            except Exception as e:
                print(f"Evening reminder error: {e}")


async def sync_todoist_tasks():
    """Auto-sync Todoist tasks for users with integration enabled."""
    from app.services import todoist_integration as todoist
    db = get_db()

    # Find all users with Todoist connected
    async for user in db.users.find({
        "integrations.todoist.api_token": {"$exists": True},
        "onboarding_complete": True,
    }):
        user_id = user["supabase_id"]
        api_token = user.get("integrations", {}).get("todoist", {}).get("api_token")

        if not api_token:
            continue

        try:
            tasks = await todoist.sync_tasks(user_id, api_token)
            print(f"Todoist sync for {user_id}: {len(tasks)} tasks")
        except Exception as e:
            print(f"Todoist sync error for {user_id}: {e}")
            # Continue to next user instead of failing entire job


def start_scheduler():
    """Start all scheduled jobs."""
    scheduler.add_job(
        generate_morning_briefs,
        CronTrigger(minute=0),
        id="morning_briefs",
        replace_existing=True,
    )
    scheduler.add_job(
        send_nudges,
        CronTrigger(hour="10,14,18", minute=0),
        id="nudges",
        replace_existing=True,
    )
    scheduler.add_job(
        evening_checkin_prompt,
        CronTrigger(minute=0),
        id="evening_checkin",
        replace_existing=True,
    )
    scheduler.add_job(
        sync_todoist_tasks,
        CronTrigger(hour="0,6,12,18", minute=15),
        id="todoist_sync",
        replace_existing=True,
    )
    scheduler.start()
    print("Scheduler started: morning briefs, nudges, evening check-in, todoist sync")


def stop_scheduler():
    """Stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("Scheduler stopped")
