import httpx
from datetime import datetime
from app.core.database import get_db
from app.services import knowledge_graph as kg

TODOIST_API = "https://api.todoist.com/rest/v2"


async def upsert_task_node(user_id: str, task: dict):
    """Create or update task node, deduplicating by todoist_id."""
    db = get_db()
    todoist_id = task.get("id", "")

    # Skip tasks without valid ID
    if not todoist_id:
        print(f"Skipping Todoist task without ID: {task.get('content', 'Unknown')}")
        return None

    # Check if node already exists
    existing = await db.knowledge_graph.find_one({
        "user_id": user_id,
        "node_type": "task",
        "properties.todoist_id": todoist_id,
        "deleted_at": {"$exists": False},
    })

    due = task.get("due", {})
    priority_map = {1: "low", 2: "medium", 3: "high", 4: "urgent"}

    task_data = {
        "label": task.get("content", "Untitled Task"),
        "properties": {
            "due": due.get("date", "") if due else "",
            "priority": priority_map.get(task.get("priority", 1), "low"),
            "todoist_id": todoist_id,
            "description": (task.get("description") or "")[:200],
            "project_id": task.get("project_id", ""),
        },
        "updated_at": datetime.utcnow(),
    }

    if existing:
        # Update existing node
        await db.knowledge_graph.update_one(
            {"_id": existing["_id"]},
            {"$set": task_data}
        )
        existing.update(task_data)
        return existing
    else:
        # Create new node
        return await kg.create_node(
            user_id=user_id,
            node_type="task",
            label=task_data["label"],
            properties=task_data["properties"],
            source="todoist",
        )


async def sync_tasks(user_id: str, api_token: str = None) -> list:
    """Fetch active tasks from Todoist and upsert as knowledge graph nodes."""
    if not api_token:
        db = get_db()
        user = await db.users.find_one({"supabase_id": user_id})
        api_token = user.get("integrations", {}).get("todoist", {}).get("api_token", "")

    if not api_token:
        return []

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{TODOIST_API}/tasks",
                headers={"Authorization": f"Bearer {api_token}"},
                params={"filter": "7 days"},
            )
            response.raise_for_status()
            tasks = response.json()

        created = []
        for task in tasks:
            node = await upsert_task_node(user_id, task)
            if node:  # Skip None results from tasks without IDs
                created.append(node)
        return created
    except Exception as e:
        print(f"Todoist sync error for {user_id}: {e}")
        return []
