-- ====================================================================
-- Nepal CEE Entrance Result Checker - Database Schema Migration
-- Database: Supabase / PostgreSQL 14+
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Examinations Table
CREATE TABLE IF NOT EXISTS examinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examination_name VARCHAR(255) NOT NULL,
    examination_year VARCHAR(20) NOT NULL,
    program VARCHAR(100) NOT NULL DEFAULT 'All Programs',
    source_pdf_url TEXT,
    source_pdf_filename VARCHAR(255),
    is_searchable_pdf BOOLEAN DEFAULT TRUE,
    publication_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft', 'reviewing', 'published', 'archived')),
    total_records INTEGER NOT NULL DEFAULT 0,
    verified_records INTEGER NOT NULL DEFAULT 0,
    flagged_records INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on publication status for instant filtering
CREATE INDEX IF NOT EXISTS idx_examinations_pub_status ON examinations (publication_status);
CREATE INDEX IF NOT EXISTS idx_examinations_year_program ON examinations (examination_year, program);

-- 3. Create Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examination_id UUID NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
    symbol_number VARCHAR(50) NOT NULL,
    student_name VARCHAR(255),
    rank INTEGER,
    score NUMERIC(6, 2),
    qualification_status VARCHAR(50),
    program VARCHAR(100),
    category VARCHAR(100),
    remarks TEXT,
    additional_data JSONB DEFAULT '{}'::jsonb,
    ocr_confidence NUMERIC(5, 2) DEFAULT 100.00,
    is_flagged_for_review BOOLEAN DEFAULT FALSE,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_exam_symbol UNIQUE (examination_id, symbol_number)
);

-- Fast lookup indexes
-- Critical: symbol_number must be indexed for sub-millisecond query performance
CREATE INDEX IF NOT EXISTS idx_students_symbol ON students (symbol_number);
CREATE INDEX IF NOT EXISTS idx_students_exam_id ON students (examination_id);
CREATE INDEX IF NOT EXISTS idx_students_flagged ON students (examination_id, is_flagged_for_review);
CREATE INDEX IF NOT EXISTS idx_students_rank ON students (examination_id, rank);

-- 4. Create Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL DEFAULT 'Administrator',
    role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'moderator')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_examinations_updated_at ON examinations;
CREATE TRIGGER trg_examinations_updated_at
BEFORE UPDATE ON examinations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_admins_updated_at ON admins;
CREATE TRIGGER trg_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Row Level Security (RLS) Configuration
ALTER TABLE examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Anonymous users (Students checking results) can ONLY select published examinations
DROP POLICY IF EXISTS "Public can view published examinations" ON examinations;
CREATE POLICY "Public can view published examinations"
ON examinations FOR SELECT
TO anon, authenticated
USING (publication_status = 'published');

-- Anonymous users can ONLY view student records for published examinations
DROP POLICY IF EXISTS "Public can view students from published examinations" ON students;
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

-- Service role / Admin bypass policy (applied by Supabase service key or admin auth)
DROP POLICY IF EXISTS "Service role full access on examinations" ON examinations;
CREATE POLICY "Service role full access on examinations"
ON examinations FOR ALL
TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on students" ON students;
CREATE POLICY "Service role full access on students"
ON students FOR ALL
TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on admins" ON admins;
CREATE POLICY "Service role full access on admins"
ON admins FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- 7. High-Performance Search Stored Procedure
-- Searches by exact normalized symbol number across published examinations
CREATE OR REPLACE FUNCTION search_student_result(
    p_symbol_number TEXT,
    p_examination_id UUID DEFAULT NULL
)
RETURNS TABLE (
    student_id UUID,
    symbol_number VARCHAR,
    student_name VARCHAR,
    rank INTEGER,
    score NUMERIC,
    qualification_status VARCHAR,
    program VARCHAR,
    category VARCHAR,
    remarks TEXT,
    additional_data JSONB,
    examination_id UUID,
    examination_name VARCHAR,
    examination_year VARCHAR,
    exam_program VARCHAR,
    published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    clean_symbol TEXT;
BEGIN
    -- Trim whitespace
    clean_symbol := TRIM(p_symbol_number);
    
    RETURN QUERY
    SELECT 
        s.id AS student_id,
        s.symbol_number,
        s.student_name,
        s.rank,
        s.score,
        s.qualification_status,
        s.program,
        s.category,
        s.remarks,
        s.additional_data,
        e.id AS examination_id,
        e.examination_name,
        e.examination_year,
        e.program AS exam_program,
        e.published_at
    FROM students s
    INNER JOIN examinations e ON e.id = s.examination_id
    WHERE e.publication_status = 'published'
      AND s.symbol_number = clean_symbol
      AND (p_examination_id IS NULL OR e.id = p_examination_id)
    ORDER BY e.examination_year DESC, e.created_at DESC;
END;
$$;
