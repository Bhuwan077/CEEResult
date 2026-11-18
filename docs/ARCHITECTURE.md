# System Architecture: Nepal CEE Entrance Result Checker

This document outlines the software architecture, technical decisions, and data processing workflows for the **CEE Result Checker Nepal** platform.

---

## 1. High-Level Architectural Diagram

```
+---------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                    |
|                                                                                 |
|   +-------------------------------------+   +-------------------------------+   |
|   |         Student Interface           |   |       Admin Controller        |   |
|   |   - Instant Symbol No. Search       |   |   - PDF Upload & Validation   |   |
|   |   - Printable Merit Scorecard       |   |   - Record Review & In-Place  |   |
|   |   - Program & Year Filtering        |   |     Error Correction          |   |
|   |   - Leading-Zero Safe Display       |   |   - Publish / Unpublish Gating|   |
|   +-------------------------------------+   +-------------------------------+   |
|                     ^                                       ^                   |
|                     | React 18 + Vite + Tailwind CSS        |                   |
+---------------------|---------------------------------------|-------------------+
                      | (HTTPS / REST)                        |
                      v                                       v
+---------------------------------------------------------------------------------+
|                                APPLICATION LAYER                                |
|                                                                                 |
|   FastAPI REST Backend (Python 3.12)                                            |
|   ├── Search Router (Rate Limiting, Exact String Matching, RLS Enforcement)     |
|   ├── Admin Router (JWT Bearer Auth, Audit Trails, CRUD Dataset Management)     |
|   └── PDF Processing Engine                                                     |
|       ├── Searchability Detector (Text layer density vs Raster bitmap)          |
|       ├── PyMuPDF Vector Text Extractor (Spatial Reading Order)                 |
|       ├── Tesseract OCR Engine (300 DPI Rasterization + Confidence Tracking)   |
|       ├── Adaptive Layout Parser (Column Heuristics & RegEx Normalizers)        |
|       └── Data Validator (Leading-Zero Preserver, Duplicate & Anomaly Flagger)  |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|                                PERSISTENCE LAYER                                |
|                                                                                 |
|   Supabase / PostgreSQL 14+                                                     |
|   ├── `examinations` (Metadata, PDF audit path, publication_status)             |
|   ├── `students` (VARCHAR symbol_number INDEXED, scores, merit rank, review)    |
|   ├── `admins` (Bcrypt password hashes, role-based authorization)               |
|   └── Row-Level Security (RLS) & `search_student_result` Stored Procedure        |
+---------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Pillars

### A. Strict Leading Zero Preservation
A critical design requirement is that CEE symbol numbers (e.g. `00101`, `00452`, `01053`) must never lose leading zeros:
- **Database Column:** Defined as `VARCHAR(50) NOT NULL` (never `INT` or `BIGINT`).
- **Pydantic Validation:** String sanitization with `TRIM()`; numeric casting is strictly forbidden.
- **CSV & Export:** Formatted as `="00101"` to prevent Excel/spreadsheets from stripping leading zeros.
- **Frontend Input:** Managed as a raw string with mono-spaced styling and length counters.

### B. Dual PDF Support: Searchable vs Non-Searchable (Scanned)
Official result publications in Nepal vary each year: some are direct digital exports (searchable vector text), while others are physical scanned pages or flat rasters.
1. **Detection:** The engine samples the document and counts character density vs embedded images.
2. **Path 1 (Searchable):** PyMuPDF (`fitz`) extracts words with spatial coordinates `(x0, y0, x1, y1)`. Words on the same horizontal baseline are sorted left-to-right to reconstruct table rows with zero column confusion.
3. **Path 2 (Scanned):** PyMuPDF renders pages at 300 DPI. Images undergo grayscale conversion, contrast enhancement, and sharpening before being passed to Tesseract OCR with PSM 6 (single uniform block) or PSM 4. Word-level confidence scores are calculated.

### C. Human-in-the-Loop Review & Publication Gating
- If OCR confidence for any word is below 80%, or if character anomalies (e.g. `@`, `#`, unusual digits in names) or duplicate symbol numbers appear, the record is flagged (`is_flagged_for_review = TRUE`).
- Unverified results are placed in `reviewing` status.
- Administrators can review all records in a dedicated modal, edit fields in-place, and resolve flags before publishing.
- **Public Search Protection:** Public API requests join on `publication_status = 'published'`. Draft and reviewing datasets are completely inaccessible to public queries.

### D. High-Concurrency Performance & Rate Limiting
- Public search endpoints are protected by an in-memory sliding-window rate limiter (60 requests/minute per client IP) to block denial-of-service and brute force scrapes.
- Symbol number lookups hit a B-Tree index on `students(symbol_number)` for sub-millisecond query execution.
