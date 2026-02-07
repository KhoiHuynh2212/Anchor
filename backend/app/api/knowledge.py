from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user_id
from app.models.knowledge import NodeCreate, GraphResponse
from app.services import knowledge_graph as kg
from app.core.database import get_db
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


class NodeUpdate(BaseModel):
    label: str | None = None
    properties: dict | None = None
    node_type: str | None = None


@router.get("/graph")
async def get_graph(user_id: str = Depends(get_current_user_id)):
    nodes = await kg.get_user_graph(user_id)
    return GraphResponse(nodes=nodes)


@router.post("/nodes")
async def create_node(body: NodeCreate, user_id: str = Depends(get_current_user_id)):
    node = await kg.create_node(
        user_id=user_id,
        node_type=body.node_type,
        label=body.label,
        properties=body.properties,
        edges=[e.model_dump() for e in body.edges],
        source=body.source,
    )
    node["_id"] = str(node["_id"])
    return node


@router.put("/nodes/{node_id}")
async def update_node(node_id: str, body: NodeUpdate, user_id: str = Depends(get_current_user_id)):
    """Update a knowledge graph node."""
    db = get_db()
    update_fields = {"updated_at": datetime.utcnow()}
    if body.label is not None:
        update_fields["label"] = body.label
    if body.properties is not None:
        update_fields["properties"] = body.properties
    if body.node_type is not None:
        update_fields["node_type"] = body.node_type

    result = await db.knowledge_graph.update_one(
        {"_id": ObjectId(node_id), "user_id": user_id},
        {"$set": update_fields},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Node not found")
    return {"status": "updated"}


@router.delete("/nodes/{node_id}")
async def delete_node(node_id: str, user_id: str = Depends(get_current_user_id)):
    """Soft delete a knowledge graph node."""
    db = get_db()
    result = await db.knowledge_graph.update_one(
        {"_id": ObjectId(node_id), "user_id": user_id},
        {"$set": {"deleted_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Node not found")
    return {"status": "deleted"}
