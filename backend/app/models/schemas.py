# app/models/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

# -------------------------
# Timeline item
# -------------------------
class TimelineItem(BaseModel):
    event_type: str
    text: str
    created_by: Optional[str] = None  # store user id as string
    created_at: Optional[datetime] = None

# -------------------------
# Input: create matter
# -------------------------
class MatterCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "open"
    client_id: Optional[str] = None   # string ObjectId
    assigned_to_id: Optional[str] = None
    court: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = []

# -------------------------
# Input: partial update
# -------------------------
class MatterUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    client_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    court: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_archived: Optional[bool] = None

# -------------------------
# Output: Matter
# -------------------------
class MatterOut(BaseModel):
    id: str = Field(..., alias="_id")   # return Mongo _id as string
    title: str
    description: Optional[str] = None
    status: str
    client: Optional[Dict[str, Any]] = None
    assigned_to: Optional[Dict[str, Any]] = None
    timeline: Optional[List[TimelineItem]] = []
    tags: Optional[List[str]] = []
    is_archived: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        # allow population from Mongo's _id field
        allow_population_by_field_name = True
        json_encoders = {
            # in case bson.ObjectId still sneaks in, encode as string
            # we don't import ObjectId here to avoid extra dependency in schema
            object: lambda v: str(v)
        }
