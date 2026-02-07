from app.core.database import get_db
from bson import ObjectId
from datetime import datetime


async def create_node(user_id: str, node_type: str, label: str, properties: dict = None, edges: list = None, source: str = "manual"):
    db = get_db()
    node = {
        "user_id": user_id,
        "node_type": node_type,
        "label": label,
        "properties": properties or {},
        "edges": edges or [],
        "source": source,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.knowledge_graph.insert_one(node)
    node["_id"] = result.inserted_id
    return node


async def create_edge(user_id: str, source_node_id: str, target_node_id: str, relationship: str, weight: float = 0.5):
    db = get_db()
    edge = {"target_id": target_node_id, "relationship": relationship, "weight": weight}
    await db.knowledge_graph.update_one(
        {"_id": ObjectId(source_node_id), "user_id": user_id},
        {"$push": {"edges": edge}},
    )
    return edge


async def get_user_graph(user_id: str):
    db = get_db()
    nodes = []
    async for node in db.knowledge_graph.find({"user_id": user_id}):
        node["_id"] = str(node["_id"])
        nodes.append(node)
    return nodes


async def get_relevant_context(user_id: str, context_type: str = "general"):
    """Build a text summary of the user's knowledge graph for AI prompt context."""
    nodes = await get_user_graph(user_id)
    if not nodes:
        return "No knowledge graph data available yet."

    sections = []

    goals = [n for n in nodes if n["node_type"] == "goal"]
    if goals:
        goal_lines = []
        for g in goals:
            props = g.get("properties", {})
            line = f"- {g['label']}"
            if props.get("priority"):
                line += f" (priority: {props['priority']})"
            if props.get("target_date"):
                line += f" (target: {props['target_date']})"
            goal_lines.append(line)
        sections.append("Goals:\n" + "\n".join(goal_lines))

    deadlines = [n for n in nodes if n["node_type"] == "deadline"]
    if deadlines:
        dl_lines = [f"- {d['label']}: {d.get('properties', {}).get('date', 'no date')}" for d in deadlines]
        sections.append("Upcoming Deadlines:\n" + "\n".join(dl_lines))

    contacts = [n for n in nodes if n["node_type"] == "contact"]
    if contacts:
        c_lines = []
        for c in contacts:
            props = c.get("properties", {})
            line = f"- {c['label']}"
            if props.get("role"):
                line += f" ({props['role']})"
            if props.get("company"):
                line += f" at {props['company']}"
            c_lines.append(line)
        sections.append("Key Contacts:\n" + "\n".join(c_lines))

    skills = [n for n in nodes if n["node_type"] == "skill"]
    if skills:
        s_lines = [f"- {s['label']} ({s.get('properties', {}).get('level', 'unknown')})" for s in skills]
        sections.append("Skills:\n" + "\n".join(s_lines))

    tasks = [n for n in nodes if n["node_type"] == "task"]
    if tasks:
        t_lines = []
        for t in tasks:
            props = t.get("properties", {})
            line = f"- {t['label']}"
            if props.get("due"):
                line += f" (due: {props['due']})"
            if props.get("priority"):
                line += f" [{props['priority']}]"
            t_lines.append(line)
        sections.append("Tasks:\n" + "\n".join(t_lines))

    events = [n for n in nodes if n["node_type"] == "event"]
    if events:
        e_lines = []
        for e in events:
            props = e.get("properties", {})
            line = f"- {e['label']}"
            if props.get("time"):
                line += f" at {props['time']}"
            if props.get("duration"):
                line += f" ({props['duration']})"
            e_lines.append(line)
        sections.append("Today's Events:\n" + "\n".join(e_lines))

    return "\n\n".join(sections) if sections else "No relevant context found."


async def add_entities_from_ai(user_id: str, entities: list[dict]):
    """Add extracted entities from AI conversation to the knowledge graph."""
    created = []
    for entity in entities:
        node = await create_node(
            user_id=user_id,
            node_type=entity.get("type", "interest"),
            label=entity.get("label", ""),
            properties=entity.get("properties", {}),
            source="onboarding_chat",
        )
        created.append(node)
    return created
