# Database Schema Documentation: Nepal CEE Result Checker

Database Engine: **PostgreSQL 14+ / Supabase**

---

## 1. Table: `examinations`
Stores metadata and audit references for each published or draft examination.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique examination identifier |
| `examination_name` | `VARCHAR(255)` | `NOT NULL` | e.g. "MECEE-BL 2024 (MBBS/BDS)" |
| `examination_year` | `VARCHAR(20)` | `NOT NULL` | Examination year (e.g. "2024" or "2081 B.S.") |
| `program` | `VARCHAR(100)` | `NOT NULL DEFAULT 'All Programs'` | e.g. "MBBS", "BDS", "Allied" |
| `source_pdf_url` | `TEXT` | `NULL` | Stored PDF file path or CDN URL |
| `source_pdf_filename`| `VARCHAR(255)` | `NULL` | Original uploaded filename |
| `is_searchable_pdf` | `BOOLEAN` | `DEFAULT TRUE` | Detected PDF type (Text Layer vs Scanned/OCR) |
| `publication_status`| `VARCHAR(20)` | `CHECK ('draft', 'reviewing', 'published', 'archived')` | Public visibility gating |
| `total_records` | `INTEGER` | `DEFAULT 0` | Total student records in dataset |
| `verified_records` | `INTEGER` | `DEFAULT 0` | High-confidence records verified |
| `flagged_records` | `INTEGER` | `DEFAULT 0` | Records requiring admin verification |
| `published_at` | `TIMESTAMPTZ` | `NULL` | Timestamp when published |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT timezone('utc', now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT timezone('utc', now())` | Last update timestamp |

**Indexes:**
- `CREATE INDEX idx_examinations_pub_status ON examinations (publication_status);`
- `CREATE INDEX idx_examinations_year_program ON examinations (examination_year, program);`

---

## 2. Table: `students`
Stores individual candidate results with preserved leading zeros.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique candidate result record ID |
| `examination_id` | `UUID` | `REFERENCES examinations(id) ON DELETE CASCADE` | Associated examination |
| `symbol_number` | `VARCHAR(50)` | `NOT NULL` | Exact symbol number (e.g. "00101") |
| `student_name` | `VARCHAR(255)` | `NULL` | Candidate full name (if published) |
| `rank` | `INTEGER` | `NULL` | Merit rank or merit position |
| `score` | `NUMERIC(6, 2)` | `NULL` | Total obtained score (0.00 to 200.00) |
| `qualification_status`| `VARCHAR(50)` | `NULL` | "Qualified", "Not Qualified", "Eligible" |
| `program` | `VARCHAR(100)` | `NULL` | Program name (e.g. MBBS, BDS) |
| `category` | `VARCHAR(100)` | `NULL` | Reservation quota (e.g. Open, Female Quota) |
| `remarks` | `TEXT` | `NULL` | Official counseling remarks / notes |
| `additional_data` | `JSONB` | `DEFAULT '{}'::jsonb` | Extracted raw line, page index |
| `ocr_confidence` | `NUMERIC(5, 2)` | `DEFAULT 100.00` | Percentage confidence (0 - 100) |
| `is_flagged_for_review`| `BOOLEAN` | `DEFAULT FALSE` | True if low confidence or parsing anomaly |
| `review_notes` | `TEXT` | `NULL` | Human review reason / warning |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT timezone('utc', now())` | Record insertion timestamp |

**Indexes & Unique Constraints:**
- `CREATE INDEX idx_students_symbol ON students (symbol_number);` (Primary fast lookup)
- `CREATE INDEX idx_students_exam_id ON students (examination_id);`
- `CREATE UNIQUE INDEX uq_exam_symbol ON students (examination_id, symbol_number);` (Duplicate prevention per exam)

---

## 3. Row-Level Security (RLS) Policies

```sql
-- Public can ONLY view records belonging to officially published examinations
CREATE POLICY "Public can view students from published examinations"
ON students FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM examinations e
        WHERE e.id = students.examination_id
        AND e.publication_status = 'published'
    )
);
```
