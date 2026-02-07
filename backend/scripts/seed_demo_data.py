"""Seed demo data for hackathon demo user 'Alex'."""
from datetime import datetime
from app.core.database import get_db


async def seed():
    db = get_db()

    # Check if seed user already exists
    existing = await db.users.find_one({"nickname": "Alex", "email": "alex@demo.com"})
    if existing:
        user_id = existing["supabase_id"]
        # Clear existing demo data
        await db.knowledge_graph.delete_many({"user_id": user_id})
        await db.nudges.delete_many({"user_id": user_id})
        await db.conversations.delete_many({"user_id": user_id})
        await db.briefs.delete_many({"user_id": user_id})
    else:
        user_id = "demo-user-alex"
        user_doc = {
            "supabase_id": user_id,
            "email": "alex@demo.com",
            "name": "Alex Demo",
            "nickname": "Alex",
            "motivation_style": "balanced",
            "wake_time": "07:30",
            "bed_time": "23:00",
            "timezone": "America/Chicago",
            "goals": [
                "Land a software engineering internship at Google by May 2026",
                "Finish AI/ML course on Coursera by March 2026",
                "Run a half marathon in April 2026",
            ],
            "onboarding_complete": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        await db.users.insert_one(user_doc)

    # ── Knowledge Graph Nodes ──
    nodes = [
        {"user_id": user_id, "node_type": "goal", "label": "Google SWE Internship",
         "properties": {"priority": "high", "status": "in_progress", "target_date": "2026-05-01"},
         "edges": [], "source": "onboarding", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        {"user_id": user_id, "node_type": "goal", "label": "Complete AI/ML Coursera Course",
         "properties": {"priority": "medium", "status": "in_progress", "target_date": "2026-03-15"},
         "edges": [], "source": "onboarding", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        {"user_id": user_id, "node_type": "goal", "label": "Run Half Marathon",
         "properties": {"priority": "medium", "status": "in_progress", "target_date": "2026-04-20"},
         "edges": [], "source": "onboarding", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        {"user_id": user_id, "node_type": "deadline", "label": "AI4All Application Due",
         "properties": {"date": "2026-02-10", "priority": "high"},
         "edges": [], "source": "onboarding", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        {"user_id": user_id, "node_type": "deadline", "label": "Coursera Week 5 Quiz",
         "properties": {"date": "2026-02-09", "priority": "medium"},
         "edges": [], "source": "onboarding", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        {"user_id": user_id, "node_type": "contact", "label": "James Park",
         "properties": {"company": "Google", "role": "SWE", "relationship": "LinkedIn connection"},
         "edges": [], "source": "onboarding_chat", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        {"user_id": user_id, "node_type": "contact", "label": "Prof. Sarah Chen",
         "properties": {"role": "AI/ML Professor", "relationship": "course instructor"},
         "edges": [], "source": "onboarding_chat", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        {"user_id": user_id, "node_type": "skill", "label": "Python",
         "properties": {"level": "intermediate"},
         "edges": [], "source": "onboarding_chat", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        {"user_id": user_id, "node_type": "skill", "label": "React Native",
         "properties": {"level": "beginner"},
         "edges": [], "source": "onboarding_chat", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        {"user_id": user_id, "node_type": "interest", "label": "Running",
         "properties": {"frequency": "3x/week"},
         "edges": [], "source": "onboarding_chat", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        # Calendar events as nodes
        {"user_id": user_id, "node_type": "event", "label": "Team standup",
         "properties": {"time": "10:00 AM", "duration": "30m", "color": "#0077B6"},
         "edges": [], "source": "calendar_event", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        {"user_id": user_id, "node_type": "event", "label": "AI/ML Coursera - Week 5",
         "properties": {"time": "2:00 PM", "duration": "1h", "color": "#00B4D8"},
         "edges": [], "source": "calendar_event", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        {"user_id": user_id, "node_type": "event", "label": "5K training run",
         "properties": {"time": "6:00 PM", "duration": "45m", "color": "#7CAE7A"},
         "edges": [], "source": "calendar_event", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        {"user_id": user_id, "node_type": "event", "label": "Study group - Algorithms",
         "properties": {"time": "8:00 PM", "duration": "1.5h", "color": "#D4A04A"},
         "edges": [], "source": "calendar_event", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        # Tasks as nodes
        {"user_id": user_id, "node_type": "task", "label": "Submit AI4All application",
         "properties": {"due": "2026-02-10", "priority": "high", "project": "Career", "icon": "target"},
         "edges": [], "source": "manual", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        {"user_id": user_id, "node_type": "task", "label": "Complete Coursera Week 5 quiz",
         "properties": {"due": "2026-02-09", "priority": "medium", "project": "Learning", "icon": "book"},
         "edges": [], "source": "manual", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        {"user_id": user_id, "node_type": "task", "label": "Update resume with hackathon project",
         "properties": {"due": "2026-02-15", "priority": "low", "project": "Career", "icon": "file"},
         "edges": [], "source": "manual", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},

        {"user_id": user_id, "node_type": "task", "label": "Message James about Google referral",
         "properties": {"due": "2026-02-08", "priority": "high", "project": "Career", "icon": "message"},
         "edges": [], "source": "manual", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
    ]

    result = await db.knowledge_graph.insert_many(nodes)
    node_ids = {nodes[i]["label"]: str(result.inserted_ids[i]) for i in range(len(nodes))}

    # ── Edges ──
    edges_to_add = [
        ("Google SWE Internship", "James Park", "can_help_with", 0.9),
        ("Google SWE Internship", "Python", "requires", 0.8),
        ("Complete AI/ML Coursera Course", "Prof. Sarah Chen", "related_to", 0.7),
        ("AI4All Application Due", "Google SWE Internship", "supports", 0.9),
        ("Run Half Marathon", "Running", "requires", 0.8),
    ]

    for source_label, target_label, relationship, weight in edges_to_add:
        if source_label in node_ids and target_label in node_ids:
            from bson import ObjectId
            await db.knowledge_graph.update_one(
                {"_id": ObjectId(node_ids[source_label])},
                {"$push": {"edges": {
                    "target_id": node_ids[target_label],
                    "relationship": relationship,
                    "weight": weight,
                }}},
            )

    # ── Pre-generated Nudges ──
    nudges = [
        {
            "user_id": user_id,
            "type": "deadline_reminder",
            "title": "AI4All deadline is in 3 days",
            "body": "You mentioned this is important for your Google internship goal. Want to block an hour today to finalize your application?",
            "emoji": "target",
            "status": "responded",
            "scheduled_for": datetime.utcnow(),
            "created_at": datetime.utcnow(),
        },
        {
            "user_id": user_id,
            "type": "goal_check_in",
            "title": "How's the Coursera quiz prep going?",
            "body": "Week 5 quiz is due tomorrow. You've completed 3 of 5 modules. A 45-minute session this afternoon would put you in great shape.",
            "emoji": "book",
            "status": "opened",
            "scheduled_for": datetime.utcnow(),
            "created_at": datetime.utcnow(),
        },
        {
            "user_id": user_id,
            "type": "reflection_prompt",
            "title": "Reach out to James at Google?",
            "body": "Your task to message James is due today. Here's a warm opener you could use: 'Hey James! I'm applying for the SWE internship...'",
            "emoji": "message",
            "status": "pending",
            "scheduled_for": datetime.utcnow(),
            "created_at": datetime.utcnow(),
        },
    ]
    await db.nudges.insert_many(nudges)

    # ── Sample Morning Brief (fallback) ──
    brief = {
        "user_id": user_id,
        "text": "Good morning, Alex! Yesterday was solid — you made progress on your Coursera modules and got that training run in. Today you've got a team standup at 10, then your AI/ML lecture at 2. Your 5K training run is at 6 — perfect way to decompress. Here's what I'd focus on: your Coursera Week 5 quiz is due tomorrow, so try to squeeze in some review this afternoon. And that AI4All application? It's due in 3 days — let's make sure you're not scrambling at the last minute. You've got this, Alex. One thing at a time.",
        "nickname": "Alex",
        "audio_base64": "",
        "calendar_events": [
            {"title": "Team standup", "time": "10:00 AM", "duration": "30m"},
            {"title": "AI/ML Coursera - Week 5", "time": "2:00 PM", "duration": "1h"},
            {"title": "5K training run", "time": "6:00 PM", "duration": "45m"},
            {"title": "Study group - Algorithms", "time": "8:00 PM", "duration": "1.5h"},
        ],
        "tasks": [
            {"title": "Submit AI4All application", "due": "Feb 10", "priority": "high"},
            {"title": "Complete Coursera Week 5 quiz", "due": "Tomorrow", "priority": "medium"},
            {"title": "Message James about Google referral", "due": "Today", "priority": "high"},
        ],
        "generated_at": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow(),
    }
    await db.briefs.insert_one(brief)

    return {
        "status": "seeded",
        "user_id": user_id,
        "nodes_created": len(nodes),
        "edges_created": len(edges_to_add),
        "nudges_created": len(nudges),
    }


# Allow running directly: python -m scripts.seed_demo_data
if __name__ == "__main__":
    import asyncio
    from app.core.database import connect_db, close_db

    async def main():
        await connect_db()
        result = await seed()
        print(result)
        await close_db()

    asyncio.run(main())
