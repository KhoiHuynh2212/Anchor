import httpx
from app.core.database import get_db
from app.services import knowledge_graph as kg

TODOIST_API = "https://api.todoist.com/rest/v2"


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
                params={"filter": "today | overdue"},
            )
            response.raise_for_status()
            tasks = response.json()

        created = []
        for task in tasks:
            due = task.get("due", {})
            priority_map = {1: "low", 2: "medium", 3: "high", 4: "urgent"}
            node = await kg.create_node(
                user_id=user_id,
                node_type="task",
                label=task.get("content", "Untitled Task"),
                properties={
                    "due": due.get("date", "") if due else "",
                    "priority": priority_map.get(task.get("priority", 1), "low"),
                    "todoist_id": task.get("id", ""),
                    "description": task.get("description", "")[:200],
                    "project_id": task.get("project_id", ""),
                },
                source="todoist",
            )
            created.append(node)
        return created
    except Exception as e:
        print(f"Todoist sync error for {user_id}: {e}")
        return []
