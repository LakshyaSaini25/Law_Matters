# app/models/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime, date
from enum import Enum

# -------------------------
# Enums
# -------------------------
class CourtType(str, Enum):
    SC = "SC"
    HC = "HC"
    DISTRICT = "District"

class PartyType(str, Enum):
    PETITIONER = "Petitioner"
    RESPONDENT = "Respondent"

class CaseStatus(str, Enum):
    ACTIVE = "Active"
    DISPOSED = "Disposed"

class DocumentCategory(str, Enum):
    PETITION = "Petition"
    JUDGMENT = "Judgment"
    HEARING_NOTE = "Hearing Note"
    EVIDENCE = "Evidence"
    OTHER = "Other"

# -------------------------
# Timeline item (for Matter timeline)
# -------------------------
class TimelineItem(BaseModel):
    event_type: str
    text: str
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None

# -------------------------
# MATTER Schemas (for existing matters)
# -------------------------
class MatterCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "open"
    client_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    court: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = []

class MatterUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    client_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    court: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_archived: Optional[bool] = None

class MatterOut(BaseModel):
    id: str = Field(..., alias="_id")
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
        allow_population_by_field_name = True
        json_encoders = {
            object: lambda v: str(v)
        }

# -------------------------
# CASE Schemas
# -------------------------
class CaseCreate(BaseModel):
    case_title: str
    case_number: str
    court_type: CourtType
    court_name_id: str
    judge_name: Optional[str] = None
    filing_date: date
    category_id: str
    subcategory_id: Optional[str] = None
    client_id: str
    assigned_lawyer_id: str
    status: Optional[CaseStatus] = CaseStatus.ACTIVE
    created_by: str

class CaseUpdate(BaseModel):
    case_title: Optional[str] = None
    case_number: Optional[str] = None
    court_type: Optional[CourtType] = None
    court_name_id: Optional[str] = None
    judge_name: Optional[str] = None
    filing_date: Optional[date] = None
    category_id: Optional[str] = None
    subcategory_id: Optional[str] = None
    client_id: Optional[str] = None
    assigned_lawyer_id: Optional[str] = None
    status: Optional[CaseStatus] = None

class CaseOut(BaseModel):
    id: str = Field(..., alias="_id")
    case_title: str
    case_number: str
    court_type: CourtType
    court_name_id: str
    judge_name: Optional[str] = None
    filing_date: date
    category_id: str
    subcategory_id: Optional[str] = None
    client_id: str
    assigned_lawyer_id: str
    status: CaseStatus
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        allow_population_by_field_name = True

# -------------------------
# Case Party Schemas
# -------------------------
class CasePartyCreate(BaseModel):
    party_type: PartyType
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None

class CasePartyUpdate(BaseModel):
    party_type: Optional[PartyType] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class CasePartyOut(BaseModel):
    id: str = Field(..., alias="_id")
    case_id: str
    party_type: PartyType
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None

    class Config:
        allow_population_by_field_name = True

# -------------------------
# Case Hearing Schemas
# -------------------------
class CaseHearingCreate(BaseModel):
    case_id: str
    hearing_date: date
    stage: Optional[str] = None
    courtroom: Optional[str] = None
    order_summary: Optional[str] = None
    next_hearing_date: Optional[date] = None
    purpose_next: Optional[str] = None
    order_file: Optional[str] = None
    assigned_lawyer_id: Optional[str] = None

class CaseHearingUpdate(BaseModel):
    hearing_date: Optional[date] = None
    stage: Optional[str] = None
    courtroom: Optional[str] = None
    order_summary: Optional[str] = None
    next_hearing_date: Optional[date] = None
    purpose_next: Optional[str] = None
    order_file: Optional[str] = None
    assigned_lawyer_id: Optional[str] = None

class CaseHearingOut(BaseModel):
    id: str = Field(..., alias="_id")
    case_id: str
    hearing_date: date
    stage: Optional[str] = None
    courtroom: Optional[str] = None
    order_summary: Optional[str] = None
    next_hearing_date: Optional[date] = None
    purpose_next: Optional[str] = None
    order_file: Optional[str] = None
    assigned_lawyer_id: Optional[str] = None

    class Config:
        allow_population_by_field_name = True

# -------------------------
# Case Document Schemas
# -------------------------
class CaseDocumentCreate(BaseModel):
    case_id: str
    category: DocumentCategory
    document_name: str
    file_path: str
    notes: Optional[str] = None
    uploaded_by: str

class CaseDocumentUpdate(BaseModel):
    category: Optional[DocumentCategory] = None
    document_name: Optional[str] = None
    file_path: Optional[str] = None
    notes: Optional[str] = None

class CaseDocumentOut(BaseModel):
    id: str = Field(..., alias="_id")
    case_id: str
    category: DocumentCategory
    document_name: str
    file_path: str
    notes: Optional[str] = None
    uploaded_by: str
    uploaded_at: datetime

    class Config:
        allow_population_by_field_name = True

# -------------------------
# Case Note Schemas
# -------------------------
class CaseNoteCreate(BaseModel):
    case_id: str
    content: str
    created_by: str

class CaseNoteUpdate(BaseModel):
    content: Optional[str] = None

class CaseNoteOut(BaseModel):
    id: str = Field(..., alias="_id")
    case_id: str
    content: str
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True

# -------------------------
# Case Task Schemas
# -------------------------
class CaseTaskCreate(BaseModel):
    case_id: str
    title: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = "open"
    priority: Optional[str] = "medium"

class CaseTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    priority: Optional[str] = None

class CaseTaskOut(BaseModel):
    id: str = Field(..., alias="_id")
    case_id: str
    title: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None
    status: str
    priority: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True

# -------------------------
# Comprehensive Case Output with related data
# -------------------------
class CaseDetailOut(CaseOut):
    """Extended case output with related data"""
    parties: Optional[List[CasePartyOut]] = []
    hearings: Optional[List[CaseHearingOut]] = []
    documents: Optional[List[CaseDocumentOut]] = []
    notes: Optional[List[CaseNoteOut]] = []
    tasks: Optional[List[CaseTaskOut]] = []