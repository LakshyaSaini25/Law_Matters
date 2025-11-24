# app/routers/matters.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Any, Dict
from datetime import datetime
from bson import ObjectId
from ..db.mongo import get_db
from ..models.schemas import MatterCreate, MatterOut, TimelineItem, MatterUpdate

router = APIRouter(prefix="/matters", tags=["matters"])

# helper to convert ObjectId instances to strings recursively
def _convert_objectid(obj: Any) -> Any:
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _convert_objectid(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_convert_objectid(v) for v in obj]
    return obj

# ---------- Create a matter ----------
@router.post("/", response_model=MatterOut)
async def create_matter(payload: MatterCreate):
    db = get_db()
    now = datetime.utcnow()
    doc: Dict[str, Any] = payload.dict()
    # store references embedded lightly (client/assigned_to will be populated by frontend or other endpoints)
    if payload.client_id:
        doc["client"] = {"client_id": ObjectId(payload.client_id)}
        doc.pop("client_id", None)
    else:
        doc["client"] = None

    if payload.assigned_to_id:
        doc["assigned_to"] = {"user_id": ObjectId(payload.assigned_to_id)}
        doc.pop("assigned_to_id", None)
    else:
        doc["assigned_to"] = None

    doc.update({
        "timeline": [],
        "is_archived": False,
        "created_at": now,
        "updated_at": now
    })

    res = await db.matters.insert_one(doc)
    created = await db.matters.find_one({"_id": res.inserted_id})
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create matter")
    created = _convert_objectid(created)
    # ensure response shape matches MatterOut (Pydantic will validate/rename _id -> id)
    return created

# ---------- List matters with optional filtering ----------
@router.get("/", response_model=List[MatterOut])
async def list_matters(status: Optional[str] = Query(None), skip: int = 0, limit: int = 20):
    db = get_db()
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    cursor = db.matters.find(query).sort("created_at", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        items.append(_convert_objectid(doc))
    return items

# ---------- Get single matter ----------
@router.get("/{id}", response_model=MatterOut)
async def get_matter(id: str):
    db = get_db()
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    doc = await db.matters.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Matter not found")
    return _convert_objectid(doc)

# ---------- Update matter (partial) ----------
@router.patch("/{id}", response_model=MatterOut)
async def update_matter(id: str, payload: MatterUpdate):
    db = get_db()
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")

    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items()}
    # handle client_id / assigned_to_id rename if present
    if "client_id" in update_data:
        update_data["client"] = {"client_id": ObjectId(update_data.pop("client_id"))} if update_data.get("client_id") else None
    if "assigned_to_id" in update_data:
        update_data["assigned_to"] = {"user_id": ObjectId(update_data.pop("assigned_to_id"))} if update_data.get("assigned_to_id") else None

    update_data["updated_at"] = datetime.utcnow()

    res = await db.matters.update_one({"_id": oid}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Matter not found")

    doc = await db.matters.find_one({"_id": oid})
    return _convert_objectid(doc)

# ---------- Delete matter ----------
@router.delete("/{id}", status_code=204)
async def delete_matter(id: str):
    db = get_db()
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    res = await db.matters.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Matter not found")
    return

# ---------- Add timeline item ----------
@router.post("/{id}/timeline", response_model=TimelineItem)
async def add_timeline_item(id: str, item: TimelineItem):
    db = get_db()
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")

    item_dict = item.dict()
    item_dict["created_at"] = item_dict.get("created_at") or datetime.utcnow()
    res = await db.matters.update_one(
        {"_id": oid},
        {"$push": {"timeline": item_dict}, "$set": {"updated_at": datetime.utcnow()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Matter not found")
    # return the stored timeline item (with created_at set)
    return item_dict

# ---------- Toggle archive (convenience) ----------
@router.post("/{id}/archive", response_model=MatterOut)
async def archive_matter(id: str, archive: bool = True):
    db = get_db()
    try:
        oid = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")

    res = await db.matters.update_one({"_id": oid}, {"$set": {"is_archived": archive, "updated_at": datetime.utcnow()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Matter not found")
    doc = await db.matters.find_one({"_id": oid})
    return _convert_objectid(doc)
