# app/routers/cases.py
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional, Any, Dict
from datetime import datetime, date
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..db.mongo import get_database
from ..models.schemas import (
    CaseCreate, CaseUpdate, CaseOut, CaseDetailOut,
    CasePartyCreate, CasePartyUpdate, CasePartyOut,
    CaseHearingCreate, CaseHearingUpdate, CaseHearingOut,
    CaseDocumentCreate, CaseDocumentUpdate, CaseDocumentOut,
    CaseNoteCreate, CaseNoteUpdate, CaseNoteOut,
    CaseTaskCreate, CaseTaskUpdate, CaseTaskOut
)

router = APIRouter(prefix="/cases", tags=["cases"])

# Helper to convert ObjectId instances to strings recursively
def _convert_objectid(obj: Any) -> Any:
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _convert_objectid(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_convert_objectid(v) for v in obj]
    return obj

# Helper to serialize document for MongoDB (convert dates, enums, etc.)
def _serialize_document(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Pydantic model dict to MongoDB-compatible format"""
    serialized = {}
    for key, value in doc.items():
        if value is None:
            serialized[key] = None
        elif isinstance(value, date) and not isinstance(value, datetime):
            # Convert date to datetime at midnight UTC
            serialized[key] = datetime.combine(value, datetime.min.time())
        elif hasattr(value, "value"):
            # Convert Enum to its value
            serialized[key] = value.value
        else:
            serialized[key] = value
    return serialized

# ==========================================
# CASES CRUD
# ==========================================

@router.post("/", response_model=CaseOut, status_code=201)
async def create_case(payload: CaseCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Create a new case"""
    now = datetime.utcnow()
    
    case_data = payload.dict()
    case_data = _serialize_document(case_data)
    
    case_doc = {
        **case_data,
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.cases.insert_one(case_doc)
    created = await db.cases.find_one({"_id": result.inserted_id})
    
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create case")
    
    return _convert_objectid(created)

@router.get("/", response_model=List[CaseOut])
async def list_cases(
    status: Optional[str] = Query(None),
    court_type: Optional[str] = Query(None),
    assigned_lawyer_id: Optional[str] = Query(None),
    client_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """List all cases with optional filtering"""
    query: Dict[str, Any] = {}
    
    if status:
        query["status"] = status
    if court_type:
        query["court_type"] = court_type
    if assigned_lawyer_id:
        try:
            query["assigned_lawyer_id"] = ObjectId(assigned_lawyer_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid assigned_lawyer_id format")
    if client_id:
        try:
            query["client_id"] = ObjectId(client_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid client_id format")
    
    cursor = db.cases.find(query).sort("filing_date", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        items.append(_convert_objectid(doc))
    
    return items

@router.get("/{case_id}", response_model=CaseDetailOut)
async def get_case(case_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get case details with all related data"""
    try:
        oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid case_id format")
    
    case = await db.cases.find_one({"_id": oid})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Fetch related data
    parties = []
    async for party in db.case_parties.find({"case_id": oid}):
        parties.append(_convert_objectid(party))
    
    hearings = []
    async for hearing in db.case_hearings.find({"case_id": oid}).sort("hearing_date", -1):
        hearings.append(_convert_objectid(hearing))
    
    documents = []
    async for doc in db.case_documents.find({"case_id": oid}).sort("uploaded_at", -1):
        documents.append(_convert_objectid(doc))
    
    notes = []
    async for note in db.case_notes.find({"case_id": oid}).sort("created_at", -1):
        notes.append(_convert_objectid(note))
    
    tasks = []
    async for task in db.case_tasks.find({"case_id": oid}).sort("created_at", -1):
        tasks.append(_convert_objectid(task))
    
    case_detail = _convert_objectid(case)
    case_detail["parties"] = parties
    case_detail["hearings"] = hearings
    case_detail["documents"] = documents
    case_detail["notes"] = notes
    case_detail["tasks"] = tasks
    
    return case_detail

@router.patch("/{case_id}", response_model=CaseOut)
async def update_case(
    case_id: str,
    payload: CaseUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update case details"""
    try:
        oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid case_id format")
    
    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items()}
    update_data = _serialize_document(update_data)
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.cases.update_one({"_id": oid}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case = await db.cases.find_one({"_id": oid})
    return _convert_objectid(case)

@router.delete("/{case_id}", status_code=204)
async def delete_case(case_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Delete a case and all related data"""
    try:
        oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid case_id format")
    
    # Delete case and all related documents
    await db.cases.delete_one({"_id": oid})
    await db.case_parties.delete_many({"case_id": oid})
    await db.case_hearings.delete_many({"case_id": oid})
    await db.case_documents.delete_many({"case_id": oid})
    await db.case_notes.delete_many({"case_id": oid})
    await db.case_tasks.delete_many({"case_id": oid})
    
    return

# ==========================================
# CASE PARTIES CRUD
# ==========================================

@router.post("/{case_id}/parties", response_model=CasePartyOut, status_code=201)
async def add_party(
    case_id: str,
    payload: CasePartyCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Add a party (petitioner/respondent) to a case"""
    try:
        oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid case_id format")
    
    # Verify case exists
    case = await db.cases.find_one({"_id": oid})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    party_data = payload.dict()
    party_data = _serialize_document(party_data)
    
    party_doc = {
        **party_data,
        "case_id": oid,
        "created_at": datetime.utcnow()
    }
    
    result = await db.case_parties.insert_one(party_doc)
    created = await db.case_parties.find_one({"_id": result.inserted_id})
    
    return _convert_objectid(created)

@router.get("/{case_id}/parties", response_model=List[CasePartyOut])
async def list_parties(case_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """List all parties for a case"""
    try:
        oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid case_id format")
    
    parties = []
    async for party in db.case_parties.find({"case_id": oid}):
        parties.append(_convert_objectid(party))
    
    return parties

@router.patch("/{case_id}/parties/{party_id}", response_model=CasePartyOut)
async def update_party(
    case_id: str,
    party_id: str,
    payload: CasePartyUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update a party"""
    try:
        case_oid = ObjectId(case_id)
        party_oid = ObjectId(party_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items()}
    update_data = _serialize_document(update_data)
    
    result = await db.case_parties.update_one(
        {"_id": party_oid, "case_id": case_oid},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Party not found")
    
    party = await db.case_parties.find_one({"_id": party_oid})
    return _convert_objectid(party)

@router.delete("/{case_id}/parties/{party_id}", status_code=204)
async def delete_party(
    case_id: str,
    party_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a party"""
    try:
        case_oid = ObjectId(case_id)
        party_oid = ObjectId(party_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    result = await db.case_parties.delete_one({"_id": party_oid, "case_id": case_oid})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Party not found")
    
    return

# ==========================================
# CASE HEARINGS CRUD
# ==========================================

@router.post("/{case_id}/hearings", response_model=CaseHearingOut, status_code=201)
async def add_hearing(
    case_id: str,
    payload: CaseHearingCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Add a hearing to a case"""
    try:
        oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid case_id format")
    
    # Verify case exists
    case = await db.cases.find_one({"_id": oid})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    hearing_data = payload.dict()
    hearing_data = _serialize_document(hearing_data)
    
    hearing_doc = {
        **hearing_data,
        "case_id": oid,
        "created_at": datetime.utcnow()
    }
    
    result = await db.case_hearings.insert_one(hearing_doc)
    
    # Update case with next hearing date
    if payload.next_hearing_date:
        await db.cases.update_one(
            {"_id": oid},
            {"$set": {"updated_at": datetime.utcnow()}}
        )
    
    created = await db.case_hearings.find_one({"_id": result.inserted_id})
    return _convert_objectid(created)

@router.get("/{case_id}/hearings", response_model=List[CaseHearingOut])
async def list_hearings(case_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """List all hearings for a case"""
    try:
        oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid case_id format")
    
    hearings = []
    async for hearing in db.case_hearings.find({"case_id": oid}).sort("hearing_date", -1):
        hearings.append(_convert_objectid(hearing))
    
    return hearings

@router.patch("/{case_id}/hearings/{hearing_id}", response_model=CaseHearingOut)
async def update_hearing(
    case_id: str,
    hearing_id: str,
    payload: CaseHearingUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update a hearing"""
    try:
        case_oid = ObjectId(case_id)
        hearing_oid = ObjectId(hearing_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items()}
    update_data = _serialize_document(update_data)
    
    result = await db.case_hearings.update_one(
        {"_id": hearing_oid, "case_id": case_oid},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hearing not found")
    
    hearing = await db.case_hearings.find_one({"_id": hearing_oid})
    return _convert_objectid(hearing)

@router.delete("/{case_id}/hearings/{hearing_id}", status_code=204)
async def delete_hearing(
    case_id: str,
    hearing_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a hearing"""
    try:
        case_oid = ObjectId(case_id)
        hearing_oid = ObjectId(hearing_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    result = await db.case_hearings.delete_one({"_id": hearing_oid, "case_id": case_oid})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hearing not found")
    
    return

# ==========================================
# CASE DOCUMENTS CRUD
# ==========================================

@router.post("/{case_id}/documents", response_model=CaseDocumentOut, status_code=201)
async def add_document(
    case_id: str,
    payload: CaseDocumentCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Add a document to a case"""
    try:
        oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid case_id format")
    
    # Verify case exists
    case = await db.cases.find_one({"_id": oid})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    document_data = payload.dict()
    document_data = _serialize_document(document_data)
    
    document_doc = {
        **document_data,
        "case_id": oid,
        "uploaded_at": datetime.utcnow()
    }
    
    result = await db.case_documents.insert_one(document_doc)
    created = await db.case_documents.find_one({"_id": result.inserted_id})
    
    return _convert_objectid(created)

@router.get("/{case_id}/documents", response_model=List[CaseDocumentOut])
async def list_documents(
    case_id: str,
    category: Optional[str] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """List all documents for a case, optionally filtered by category"""
    try:
        oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid case_id format")
    
    query = {"case_id": oid}
    if category:
        query["category"] = category
    
    documents = []
    async for doc in db.case_documents.find(query).sort("uploaded_at", -1):
        documents.append(_convert_objectid(doc))
    
    return documents

@router.patch("/{case_id}/documents/{document_id}", response_model=CaseDocumentOut)
async def update_document(
    case_id: str,
    document_id: str,
    payload: CaseDocumentUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update a document"""
    try:
        case_oid = ObjectId(case_id)
        document_oid = ObjectId(document_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items()}
    update_data = _serialize_document(update_data)
    
    result = await db.case_documents.update_one(
        {"_id": document_oid, "case_id": case_oid},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document = await db.case_documents.find_one({"_id": document_oid})
    return _convert_objectid(document)

@router.delete("/{case_id}/documents/{document_id}", status_code=204)
async def delete_document(
    case_id: str,
    document_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a document"""
    try:
        case_oid = ObjectId(case_id)
        document_oid = ObjectId(document_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    result = await db.case_documents.delete_one({"_id": document_oid, "case_id": case_oid})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return

# ==========================================
# CASE NOTES CRUD
# ==========================================

@router.post("/{case_id}/notes", response_model=CaseNoteOut, status_code=201)
async def add_note(
    case_id: str,
    payload: CaseNoteCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Add a note to a case"""
    try:
        oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid case_id format")
    
    # Verify case exists
    case = await db.cases.find_one({"_id": oid})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    note_doc = {
        **payload.dict(),
        "case_id": oid,
        "created_at": datetime.utcnow()
    }
    
    result = await db.case_notes.insert_one(note_doc)
    created = await db.case_notes.find_one({"_id": result.inserted_id})
    
    return _convert_objectid(created)

@router.get("/{case_id}/notes", response_model=List[CaseNoteOut])
async def list_notes(case_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """List all notes for a case"""
    try:
        oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid case_id format")
    
    notes = []
    async for note in db.case_notes.find({"case_id": oid}).sort("created_at", -1):
        notes.append(_convert_objectid(note))
    
    return notes

@router.patch("/{case_id}/notes/{note_id}", response_model=CaseNoteOut)
async def update_note(
    case_id: str,
    note_id: str,
    payload: CaseNoteUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update a note"""
    try:
        case_oid = ObjectId(case_id)
        note_oid = ObjectId(note_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.case_notes.update_one(
        {"_id": note_oid, "case_id": case_oid},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    
    note = await db.case_notes.find_one({"_id": note_oid})
    return _convert_objectid(note)

@router.delete("/{case_id}/notes/{note_id}", status_code=204)
async def delete_note(
    case_id: str,
    note_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a note"""
    try:
        case_oid = ObjectId(case_id)
        note_oid = ObjectId(note_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    result = await db.case_notes.delete_one({"_id": note_oid, "case_id": case_oid})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return

# ==========================================
# CASE TASKS CRUD
# ==========================================

@router.post("/{case_id}/tasks", response_model=CaseTaskOut, status_code=201)
async def add_task(
    case_id: str,
    payload: CaseTaskCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Add a task to a case"""
    try:
        oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid case_id format")
    
    # Verify case exists
    case = await db.cases.find_one({"_id": oid})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    task_data = payload.dict()
    task_data = _serialize_document(task_data)
    
    task_doc = {
        **task_data,
        "case_id": oid,
        "created_at": datetime.utcnow()
    }
    
    result = await db.case_tasks.insert_one(task_doc)
    created = await db.case_tasks.find_one({"_id": result.inserted_id})
    
    return _convert_objectid(created)

@router.get("/{case_id}/tasks", response_model=List[CaseTaskOut])
async def list_tasks(
    case_id: str,
    status: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """List all tasks for a case, optionally filtered"""
    try:
        oid = ObjectId(case_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid case_id format")
    
    query = {"case_id": oid}
    if status:
        query["status"] = status
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    tasks = []
    async for task in db.case_tasks.find(query).sort("due_date", 1):
        tasks.append(_convert_objectid(task))
    
    return tasks

@router.patch("/{case_id}/tasks/{task_id}", response_model=CaseTaskOut)
async def update_task(
    case_id: str,
    task_id: str,
    payload: CaseTaskUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update a task"""
    try:
        case_oid = ObjectId(case_id)
        task_oid = ObjectId(task_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items()}
    update_data = _serialize_document(update_data)
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.case_tasks.update_one(
        {"_id": task_oid, "case_id": case_oid},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = await db.case_tasks.find_one({"_id": task_oid})
    return _convert_objectid(task)

@router.delete("/{case_id}/tasks/{task_id}", status_code=204)
async def delete_task(
    case_id: str,
    task_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a task"""
    try:
        case_oid = ObjectId(case_id)
        task_oid = ObjectId(task_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    result = await db.case_tasks.delete_one({"_id": task_oid, "case_id": case_oid})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return
