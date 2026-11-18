# API Documentation: Nepal CEE Result Checker

Base URL: `http://localhost:8000` (or your Render production URL)  
Interactive OpenAPI / Swagger UI: `http://localhost:8000/docs`

---

## 1. Student Public Endpoints

### `POST /api/search`
Searches candidate results by exact symbol number across all published examinations.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "symbol_number": "00101",
  "examination_id": "e1111111-1111-1111-1111-111111111111" // Optional filter
}
```

**Response (200 OK - Found):**
```json
{
  "success": true,
  "found": true,
  "query_symbol": "00101",
  "message": "Found 1 result(s) for symbol number '00101'.",
  "results": [
    {
      "id": "st-uuid",
      "examination_id": "e1111111-1111-1111-1111-111111111111",
      "symbol_number": "00101",
      "student_name": "Aarav Sharma",
      "rank": 1,
      "score": 186.75,
      "qualification_status": "Qualified",
      "program": "MBBS",
      "category": "Open",
      "remarks": "Eligible for Government Merit Scholarship",
      "examination_name": "MECEE-BL 2024 - Bachelor Level (MBBS/BDS)",
      "examination_year": "2024",
      "published_at": "2024-11-10T10:00:00Z"
    }
  ]
}
```

**Response (200 OK - Not Found):**
```json
{
  "success": true,
  "found": false,
  "query_symbol": "99999",
  "message": "No published result found for symbol number '99999'. Please verify your symbol number...",
  "results": []
}
```

---

### `GET /api/examinations`
Returns all officially published examinations available for student result lookup.

**Response (200 OK):**
```json
[
  {
    "id": "e1111111-1111-1111-1111-111111111111",
    "examination_name": "MECEE-BL 2024 - Bachelor Level (MBBS/BDS)",
    "examination_year": "2024",
    "program": "MBBS / BDS",
    "source_pdf_filename": "MECEE_BL_2024_Result_MBBS_BDS.pdf",
    "is_searchable_pdf": true,
    "publication_status": "published",
    "total_records": 15,
    "verified_records": 15,
    "flagged_records": 0,
    "published_at": "2024-11-10T10:00:00Z",
    "created_at": "2024-11-10T09:30:00Z"
  }
]
```

---

## 2. Admin Controller Endpoints

All endpoints beneath `/api/admin/*` (except `/login`) require the HTTP Authorization header:
`Authorization: Bearer <JWT_ACCESS_TOKEN>`

### `POST /api/admin/login`
Authenticates an administrator and returns a JWT Bearer token.

**Request:**
```json
{
  "username": "admin",
  "password": "Admin@CEE2024"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "admin": {
    "id": "a0000000-0000-0000-0000-000000000001",
    "username": "admin",
    "email": "admin@ceenepal.edu.np",
    "full_name": "CEE Examination Controller",
    "role": "superadmin"
  }
}
```

---

### `POST /api/admin/examinations/{id}/upload`
Uploads a new result PDF and triggers the automated extraction & OCR pipeline.

**Headers:**
- `Authorization: Bearer <TOKEN>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- `file`: PDF binary file (required, max 50MB)
- `force_ocr`: boolean string (`"true"` / `"false"`)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully processed PDF. Extracted 15 candidate records.",
  "examination_id": "e1111111-1111-1111-1111-111111111111",
  "is_searchable": true,
  "extraction_method": "direct_text_layer",
  "total_records": 15,
  "verified_records": 15,
  "flagged_records": 0,
  "duplicate_count": 0,
  "records": [...]
}
```

---

### `GET /api/admin/examinations/{id}/records`
Returns all candidate records for an examination with OCR confidence and review flags.

---

### `PUT /api/admin/records/{record_id}`
Allows an administrator to correct extraction errors or clear flags on an individual candidate record.

**Request:**
```json
{
  "symbol_number": "00452",
  "student_name": "Prashant Dahal",
  "score": 161.75,
  "rank": 48,
  "qualification_status": "Qualified",
  "category": "Open",
  "is_flagged_for_review": false,
  "review_notes": null
}
```

---

### `POST /api/admin/examinations/{id}/status`
Toggles publication status (`"published"`, `"draft"`, `"reviewing"`, `"archived"`).

**Request:**
```json
{
  "status": "published"
}
```

---

### `DELETE /api/admin/examinations/{id}`
Deletes an obsolete examination dataset and cascades deletion to all associated candidate records.
