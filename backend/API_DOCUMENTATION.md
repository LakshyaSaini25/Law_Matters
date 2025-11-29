# Law Matters API - Complete CRUD Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
Currently using simple bearer token. Add to headers:
```
Authorization: Bearer <token>
```

---

## 📋 CASES MANAGEMENT

### 1. Create a New Case
**POST** `/cases/`

**Request Body:**
```json
{
  "case_title": "John Doe vs State",
  "case_number": "2024/HC/1234",
  "court_type": "HC",
  "court_name_id": "507f1f77bcf86cd799439011",
  "judge_name": "Hon. Justice Smith",
  "filing_date": "2024-01-15",
  "category_id": "507f1f77bcf86cd799439012",
  "subcategory_id": "507f1f77bcf86cd799439013",
  "client_id": "507f1f77bcf86cd799439014",
  "assigned_lawyer_id": "507f1f77bcf86cd799439015",
  "status": "Active",
  "created_by": "507f1f77bcf86cd799439016"
}
```

**Response:** `201 Created`
```json
{
  "id": "507f1f77bcf86cd799439017",
  "case_title": "John Doe vs State",
  "case_number": "2024/HC/1234",
  "court_type": "HC",
  "court_name_id": "507f1f77bcf86cd799439011",
  "judge_name": "Hon. Justice Smith",
  "filing_date": "2024-01-15",
  "category_id": "507f1f77bcf86cd799439012",
  "subcategory_id": "507f1f77bcf86cd799439013",
  "client_id": "507f1f77bcf86cd799439014",
  "assigned_lawyer_id": "507f1f77bcf86cd799439015",
  "status": "Active",
  "created_by": "507f1f77bcf86cd799439016",
  "created_at": "2024-11-29T10:00:00",
  "updated_at": "2024-11-29T10:00:00"
}
```

---

### 2. List All Cases (with Filters)
**GET** `/cases/`

**Query Parameters:**
- `status` (optional): "Active" or "Disposed"
- `court_type` (optional): "SC", "HC", "District"
- `assigned_lawyer_id` (optional): Filter by lawyer
- `client_id` (optional): Filter by client
- `skip` (default: 0): Pagination offset
- `limit` (default: 20, max: 100): Results per page

**Examples:**
```
GET /cases/
GET /cases/?status=Active&skip=0&limit=20
GET /cases/?assigned_lawyer_id=507f1f77bcf86cd799439015
GET /cases/?court_type=HC&status=Active
```

**Response:** `200 OK`
```json
[
  {
    "id": "507f1f77bcf86cd799439017",
    "case_title": "John Doe vs State",
    ...
  }
]
```

---

### 3. Get Case with All Details
**GET** `/cases/{case_id}`

**Path Parameters:**
- `case_id`: MongoDB ObjectId

**Response:** `200 OK` - Returns case with all related data:
```json
{
  "id": "507f1f77bcf86cd799439017",
  "case_title": "John Doe vs State",
  "case_number": "2024/HC/1234",
  "...": "...",
  "parties": [
    {
      "id": "...",
      "case_id": "507f1f77bcf86cd799439017",
      "party_type": "Petitioner",
      "name": "John Doe",
      "phone": "+91-9876543210",
      "address": "123 Main St"
    }
  ],
  "hearings": [
    {
      "id": "...",
      "hearing_date": "2024-12-15",
      "stage": "Arguments",
      "...": "..."
    }
  ],
  "documents": [...],
  "notes": [...],
  "tasks": [...]
}
```

---

### 4. Update Case
**PATCH** `/cases/{case_id}`

**Request Body (all fields optional):**
```json
{
  "case_title": "Updated Title",
  "judge_name": "Hon. Justice Updated",
  "status": "Disposed",
  "assigned_lawyer_id": "507f1f77bcf86cd799439020"
}
```

**Response:** `200 OK` - Updated case object

---

### 5. Delete Case (and all related data)
**DELETE** `/cases/{case_id}`

**Response:** `204 No Content`

---

## 👥 CASE PARTIES MANAGEMENT

### 1. Add Party (Petitioner/Respondent)
**POST** `/cases/{case_id}/parties`

**Request Body:**
```json
{
  "party_type": "Petitioner",
  "name": "John Doe",
  "phone": "+91-9876543210",
  "address": "123 Main Street, City"
}
```

**Response:** `201 Created`

---

### 2. List All Parties for a Case
**GET** `/cases/{case_id}/parties`

**Response:** `200 OK`
```json
[
  {
    "id": "...",
    "case_id": "507f1f77bcf86cd799439017",
    "party_type": "Petitioner",
    "name": "John Doe",
    "phone": "+91-9876543210",
    "address": "123 Main Street"
  }
]
```

---

### 3. Update a Party
**PATCH** `/cases/{case_id}/parties/{party_id}`

**Request Body:**
```json
{
  "phone": "+91-9999999999",
  "address": "New Address"
}
```

**Response:** `200 OK` - Updated party object

---

### 4. Delete a Party
**DELETE** `/cases/{case_id}/parties/{party_id}`

**Response:** `204 No Content`

---

## 📅 CASE HEARINGS MANAGEMENT

### 1. Add Hearing
**POST** `/cases/{case_id}/hearings`

**Request Body:**
```json
{
  "hearing_date": "2024-12-15",
  "stage": "Arguments",
  "courtroom": "Court No. 5",
  "order_summary": "Case adjourned till next date",
  "next_hearing_date": "2025-01-20",
  "purpose_next": "Final hearing",
  "order_file": "/uploads/order_2024_12_15.pdf",
  "assigned_lawyer_id": "507f1f77bcf86cd799439015"
}
```

**Response:** `201 Created`

---

### 2. List All Hearings for a Case
**GET** `/cases/{case_id}/hearings`

**Response:** `200 OK` - List of hearings (sorted by date, newest first)

---

### 3. Update a Hearing
**PATCH** `/cases/{case_id}/hearings/{hearing_id}`

**Request Body:**
```json
{
  "stage": "Final Hearing",
  "order_summary": "Judgment reserved"
}
```

**Response:** `200 OK` - Updated hearing object

---

### 4. Delete a Hearing
**DELETE** `/cases/{case_id}/hearings/{hearing_id}`

**Response:** `204 No Content`

---

## 📄 CASE DOCUMENTS MANAGEMENT

### 1. Add Document
**POST** `/cases/{case_id}/documents`

**Request Body:**
```json
{
  "category": "Petition",
  "document_name": "Original Petition",
  "file_path": "/uploads/cases/2024_HC_1234/petition.pdf",
  "notes": "Filed on 2024-01-15",
  "uploaded_by": "507f1f77bcf86cd799439018"
}
```

**Document Categories:**
- `Petition`
- `Judgment`
- `Hearing Note`
- `Evidence`
- `Other`

**Response:** `201 Created`

---

### 2. List Documents for a Case
**GET** `/cases/{case_id}/documents`

**Query Parameters:**
- `category` (optional): Filter by category

**Examples:**
```
GET /cases/507f1f77bcf86cd799439017/documents
GET /cases/507f1f77bcf86cd799439017/documents?category=Judgment
```

**Response:** `200 OK` - List of documents (sorted by upload date, newest first)

---

### 3. Update a Document
**PATCH** `/cases/{case_id}/documents/{document_id}`

**Request Body:**
```json
{
  "document_name": "Updated Document Name",
  "notes": "Updated notes"
}
```

**Response:** `200 OK` - Updated document object

---

### 4. Delete a Document
**DELETE** `/cases/{case_id}/documents/{document_id}`

**Response:** `204 No Content`

---

## 📝 CASE NOTES MANAGEMENT

### 1. Add Note
**POST** `/cases/{case_id}/notes`

**Request Body:**
```json
{
  "content": "Important strategy discussion - need to file rejoinder soon",
  "created_by": "507f1f77bcf86cd799439018"
}
```

**Response:** `201 Created`

---

### 2. List All Notes for a Case
**GET** `/cases/{case_id}/notes`

**Response:** `200 OK` - List of notes (sorted by creation date, newest first)

---

### 3. Update a Note
**PATCH** `/cases/{case_id}/notes/{note_id}`

**Request Body:**
```json
{
  "content": "Updated note content"
}
```

**Response:** `200 OK` - Updated note object

---

### 4. Delete a Note
**DELETE** `/cases/{case_id}/notes/{note_id}`

**Response:** `204 No Content`

---

## ✅ CASE TASKS MANAGEMENT

### 1. Add Task
**POST** `/cases/{case_id}/tasks`

**Request Body:**
```json
{
  "title": "File rejoinder",
  "description": "Need to file rejoinder before 15th Dec",
  "assigned_to": "507f1f77bcf86cd799439015",
  "due_date": "2024-12-14",
  "status": "open",
  "priority": "high"
}
```

**Status:** "open", "in_progress", "completed"  
**Priority:** "low", "medium", "high"

**Response:** `201 Created`

---

### 2. List Tasks for a Case
**GET** `/cases/{case_id}/tasks`

**Query Parameters:**
- `status` (optional): "open", "in_progress", "completed"
- `assigned_to` (optional): Filter by user

**Examples:**
```
GET /cases/507f1f77bcf86cd799439017/tasks
GET /cases/507f1f77bcf86cd799439017/tasks?status=open
GET /cases/507f1f77bcf86cd799439017/tasks?assigned_to=507f1f77bcf86cd799439015
```

**Response:** `200 OK` - List of tasks (sorted by due date)

---

### 3. Update a Task
**PATCH** `/cases/{case_id}/tasks/{task_id}`

**Request Body:**
```json
{
  "status": "completed",
  "priority": "medium"
}
```

**Response:** `200 OK` - Updated task object

---

### 4. Delete a Task
**DELETE** `/cases/{case_id}/tasks/{task_id}`

**Response:** `204 No Content`

---

## 🔍 COMMON ERROR RESPONSES

### 400 Bad Request
```json
{
  "detail": "Invalid ID format"
}
```

### 404 Not Found
```json
{
  "detail": "Case not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to create case"
}
```

---

## 📊 WORKFLOW EXAMPLES

### Create a Complete Case with Details
```bash
# 1. Create case
POST /cases/
# Response: case_id = "507f1f77bcf86cd799439017"

# 2. Add petitioner
POST /cases/507f1f77bcf86cd799439017/parties
# Body: { "party_type": "Petitioner", "name": "John Doe", ... }

# 3. Add respondent
POST /cases/507f1f77bcf86cd799439017/parties
# Body: { "party_type": "Respondent", "name": "State", ... }

# 4. Add first hearing
POST /cases/507f1f77bcf86cd799439017/hearings
# Body: { "hearing_date": "2024-12-15", ... }

# 5. Upload petition document
POST /cases/507f1f77bcf86cd799439017/documents
# Body: { "category": "Petition", "document_name": "Original Petition", ... }

# 6. Add important note
POST /cases/507f1f77bcf86cd799439017/notes
# Body: { "content": "Key strategy points...", ... }

# 7. Create task
POST /cases/507f1f77bcf86cd799439017/tasks
# Body: { "title": "File rejoinder", "due_date": "2024-12-14", ... }

# 8. Get complete case
GET /cases/507f1f77bcf86cd799439017
# Response: Case with all parties, hearings, documents, notes, tasks
```

---

## ✨ Testing with cURL

```bash
# Create case
curl -X POST http://localhost:8000/cases/ \
  -H "Content-Type: application/json" \
  -d '{
    "case_title": "Test Case",
    "case_number": "2024/HC/0001",
    "court_type": "HC",
    "court_name_id": "507f1f77bcf86cd799439011",
    "judge_name": "Judge Smith",
    "filing_date": "2024-11-29",
    "category_id": "507f1f77bcf86cd799439012",
    "client_id": "507f1f77bcf86cd799439014",
    "assigned_lawyer_id": "507f1f77bcf86cd799439015",
    "status": "Active",
    "created_by": "507f1f77bcf86cd799439016"
  }'

# List cases
curl http://localhost:8000/cases/

# Get case details
curl http://localhost:8000/cases/507f1f77bcf86cd799439017
```

---

## 🚀 Running the Server

```bash
cd x:\myFullStack\law_matters\backend
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for interactive Swagger documentation.
