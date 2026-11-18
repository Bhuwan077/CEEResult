-- ====================================================================
-- Nepal CEE Entrance Result Checker - Sample Test Data (Fictional)
-- All names, symbol numbers, and scores are fictional test data.
-- ====================================================================

-- 1. Insert Default Administrator (Password: Admin@CEE2024)
-- bcrypt hash for 'Admin@CEE2024'
INSERT INTO admins (id, username, email, password_hash, full_name, role, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin',
    'admin@ceenepal.edu.np',
    '$2b$12$eOszMh8T7e3l7vMfx930IOfu1.mSjP0gO.wP88N1V2x.xO/E4K6re',
    'CEE Examination Controller',
    'superadmin',
    TRUE
)
ON CONFLICT (username) DO NOTHING;

-- 2. Insert Sample Examinations
-- Exam 1: Published 2024 MECEE-BL (MBBS/BDS)
INSERT INTO examinations (
    id, examination_name, examination_year, program, source_pdf_url, source_pdf_filename,
    is_searchable_pdf, publication_status, total_records, verified_records, flagged_records, published_at
)
VALUES (
    'e1111111-1111-1111-1111-111111111111',
    'MECEE-BL 2024 - Bachelor Level (MBBS/BDS)',
    '2024',
    'MBBS / BDS',
    '/uploads/mecee_bl_2024_mbbs_sample.pdf',
    'MECEE_BL_2024_Result_MBBS_BDS.pdf',
    TRUE,
    'published',
    15,
    15,
    0,
    timezone('utc'::text, now()) - interval '7 days'
)
ON CONFLICT (id) DO NOTHING;

-- Exam 2: Published 2024 MECEE-BL (B.Sc Nursing / BAMS / B.Pharm)
INSERT INTO examinations (
    id, examination_name, examination_year, program, source_pdf_url, source_pdf_filename,
    is_searchable_pdf, publication_status, total_records, verified_records, flagged_records, published_at
)
VALUES (
    'e2222222-2222-2222-2222-222222222222',
    'MECEE-BL 2024 - Allied Health & Nursing (B.Sc Nursing/BAMS/B.Pharm)',
    '2024',
    'B.Sc Nursing / BAMS / B.Pharm',
    '/uploads/mecee_bl_2024_allied_sample.pdf',
    'MECEE_BL_2024_Allied_Result.pdf',
    TRUE,
    'published',
    10,
    10,
    0,
    timezone('utc'::text, now()) - interval '3 days'
)
ON CONFLICT (id) DO NOTHING;

-- Exam 3: Draft (Unpublished) Exam - For testing admin review and publication workflow
INSERT INTO examinations (
    id, examination_name, examination_year, program, source_pdf_url, source_pdf_filename,
    is_searchable_pdf, publication_status, total_records, verified_records, flagged_records, published_at
)
VALUES (
    'e3333333-3333-3333-3333-333333333333',
    'MECEE-PG 2024 - Postgraduate MD/MS (Draft Test)',
    '2024',
    'MD / MS',
    '/uploads/mecee_pg_2024_draft.pdf',
    'MECEE_PG_2024_Draft_Result.pdf',
    FALSE,
    'reviewing',
    8,
    6,
    2,
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Sample Students for Published Exam 1 (MECEE-BL 2024 MBBS/BDS)
-- Notice symbol numbers with leading zeros (e.g. '00101', '00204', '01053')
INSERT INTO students (
    examination_id, symbol_number, student_name, rank, score, qualification_status,
    program, category, remarks, additional_data, ocr_confidence, is_flagged_for_review
)
VALUES
    ('e1111111-1111-1111-1111-111111111111', '00101', 'Aarav Sharma', 1, 186.75, 'Qualified', 'MBBS', 'Open', 'Eligible for Government Merit Scholarship', '{"district": "Kathmandu", "attempt": 1}', 100.0, FALSE),
    ('e1111111-1111-1111-1111-111111111111', '00102', 'Bibek Thapa', 2, 184.50, 'Qualified', 'MBBS', 'Open', 'Eligible for Government Merit Scholarship', '{"district": "Kaski", "attempt": 1}', 100.0, FALSE),
    ('e1111111-1111-1111-1111-111111111111', '00103', 'Pooja Karki', 3, 182.00, 'Qualified', 'MBBS', 'Female Quota', 'Eligible for Government Merit Scholarship', '{"district": "Morang", "attempt": 1}', 100.0, FALSE),
    ('e1111111-1111-1111-1111-111111111111', '00104', 'Rohan Shrestha', 4, 180.25, 'Qualified', 'MBBS', 'Janajati Quota', 'Eligible for Government Merit Scholarship', '{"district": "Lalitpur", "attempt": 1}', 100.0, FALSE),
    ('e1111111-1111-1111-1111-111111111111', '00105', 'Samikshya Adhikari', 5, 179.00, 'Qualified', 'MBBS', 'Female Quota', 'Eligible for Government Merit Scholarship', '{"district": "Chitwan", "attempt": 1}', 100.0, FALSE),
    ('e1111111-1111-1111-1111-111111111111', '00204', 'Deepak Chaudhary', 12, 172.50, 'Qualified', 'MBBS', 'Tharu Quota', 'Eligible for Quota Seat', '{"district": "Dang", "attempt": 1}', 100.0, FALSE),
    ('e1111111-1111-1111-1111-111111111111', '00318', 'Kritika Joshi', 25, 168.00, 'Qualified', 'BDS', 'Open', 'Eligible for BDS Open Merit', '{"district": "Kanchanpur", "attempt": 1}', 100.0, FALSE),
    ('e1111111-1111-1111-1111-111111111111', '00452', 'Prashant Dahal', 48, 161.75, 'Qualified', 'MBBS', 'Open', 'Eligible for Paying Seat', '{"district": "Jhapa", "attempt": 2}', 100.0, FALSE),
    ('e1111111-1111-1111-1111-111111111111', '00789', 'Suman Tamang', 105, 153.25, 'Qualified', 'MBBS', 'Janajati Quota', 'Eligible for Paying Seat', '{"district": "Kavre", "attempt": 1}', 100.0, FALSE),
    ('e1111111-1111-1111-1111-111111111111', '01053', 'Anjali Yadav', 210, 145.00, 'Qualified', 'BDS', 'Madhesi Quota', 'Eligible for Paying Seat', '{"district": "Dhanusha", "attempt": 1}', 100.0, FALSE),
    ('e1111111-1111-1111-1111-111111111111', '01290', 'Nabin Giri', 380, 137.50, 'Qualified', 'MBBS', 'Open', 'Eligible for Paying Seat', '{"district": "Rupandehi", "attempt": 2}', 100.0, FALSE),
    ('e1111111-1111-1111-1111-111111111111', '02341', 'Prakash Bishwokarma', 540, 128.00, 'Qualified', 'MBBS', 'Dalit Quota', 'Eligible for Reserved Seat', '{"district": "Palpa", "attempt": 1}', 100.0, FALSE),
    ('e1111111-1111-1111-1111-111111111111', '03890', 'Ramesh Bahadur Malla', 890, 112.50, 'Qualified', 'BDS', 'Pichhadiyeko Kshetra', 'Eligible for Backward Region Quota', '{"district": "Jumla", "attempt": 1}', 100.0, FALSE),
    ('e1111111-1111-1111-1111-111111111111', '04512', 'Sunita Gurung', 1240, 101.00, 'Qualified', 'BDS', 'Janajati Quota', 'Qualified for Counseling', '{"district": "Lamjung", "attempt": 2}', 100.0, FALSE),
    ('e1111111-1111-1111-1111-111111111111', '05999', 'Bikash Rana', NULL, 84.50, 'Not Qualified', 'MBBS', 'Open', 'Below 50th percentile minimum qualifying score (100.00)', '{"district": "Surkhet", "attempt": 1}', 100.0, FALSE)
ON CONFLICT (examination_id, symbol_number) DO NOTHING;

-- 4. Insert Sample Students for Published Exam 2 (Allied Health)
INSERT INTO students (
    examination_id, symbol_number, student_name, rank, score, qualification_status,
    program, category, remarks, additional_data, ocr_confidence, is_flagged_for_review
)
VALUES
    ('e2222222-2222-2222-2222-222222222222', '10101', 'Dipika Pokhrel', 1, 175.00, 'Qualified', 'B.Sc Nursing', 'Open', 'Eligible for Top Merit Seat', '{"district": "Tanahun"}', 100.0, FALSE),
    ('e2222222-2222-2222-2222-222222222222', '10102', 'Bipin Acharya', 2, 172.25, 'Qualified', 'B.Pharm', 'Open', 'Eligible for Government Merit Seat', '{"district": "Syangja"}', 100.0, FALSE),
    ('e2222222-2222-2222-2222-222222222222', '10103', 'Sweta Singh', 3, 169.50, 'Qualified', 'BAMS', 'Open', 'Eligible for Government Merit Seat', '{"district": "Saptari"}', 100.0, FALSE),
    ('e2222222-2222-2222-2222-222222222222', '10205', 'Manish Shrestha', 15, 155.00, 'Qualified', 'B.Sc Nursing', 'Open', 'Qualified for Counseling', '{"district": "Bhaktapur"}', 100.0, FALSE),
    ('e2222222-2222-2222-2222-222222222222', '10350', 'Alisha Khadka', 42, 142.50, 'Qualified', 'B.Pharm', 'Female Quota', 'Qualified for Counseling', '{"district": "Sindhupalchok"}', 100.0, FALSE),
    ('e2222222-2222-2222-2222-222222222222', '10480', 'Roshan Mahato', 68, 136.00, 'Qualified', 'BAMS', 'Madhesi Quota', 'Qualified for Counseling', '{"district": "Siraha"}', 100.0, FALSE),
    ('e2222222-2222-2222-2222-222222222222', '10590', 'Rebika Pariyar', 95, 130.50, 'Qualified', 'B.Sc Nursing', 'Dalit Quota', 'Qualified for Counseling', '{"district": "Gorkha"}', 100.0, FALSE),
    ('e2222222-2222-2222-2222-222222222222', '10720', 'Sandeep Magar', 140, 122.00, 'Qualified', 'B.Pharm', 'Janajati Quota', 'Qualified for Counseling', '{"district": "Makwanpur"}', 100.0, FALSE),
    ('e2222222-2222-2222-2222-222222222222', '10888', 'Gita Neupane', 215, 110.50, 'Qualified', 'B.Sc Nursing', 'Open', 'Qualified for Counseling', '{"district": "Nawalparasi"}', 100.0, FALSE),
    ('e2222222-2222-2222-2222-222222222222', '11000', 'Kamal Rokaya', NULL, 91.00, 'Not Qualified', 'BAMS', 'Pichhadiyeko Kshetra', 'Below Minimum Passing Score (100.00)', '{"district": "Dolpa"}', 100.0, FALSE)
ON CONFLICT (examination_id, symbol_number) DO NOTHING;

-- 5. Insert Draft Student Records for Exam 3 (Demonstrating Flagged/Review status)
INSERT INTO students (
    examination_id, symbol_number, student_name, rank, score, qualification_status,
    program, category, remarks, additional_data, ocr_confidence, is_flagged_for_review, review_notes
)
VALUES
    ('e3333333-3333-3333-3333-333333333333', '20001', 'Dr. Niranjan Bhattarai', 1, 178.50, 'Qualified', 'MD / MS', 'General Surgery', 'High merit', '{}', 98.5, FALSE, NULL),
    ('e3333333-3333-3333-3333-333333333333', '20002', 'Dr. Sandhya Pradhan', 2, 174.00, 'Qualified', 'MD / MS', 'Pediatrics', 'High merit', '{}', 99.1, FALSE, NULL),
    ('e3333333-3333-3333-3333-333333333333', '20003', 'Dr. Anup Regmi', 3, 171.25, 'Qualified', 'MD / MS', 'Internal Medicine', 'High merit', '{}', 95.0, FALSE, NULL),
    ('e3333333-3333-3333-3333-333333333333', '20004', 'Dr. Urmila Shah', 4, 168.00, 'Qualified', 'MD / MS', 'Obstetrics & Gynecology', 'High merit', '{}', 97.4, FALSE, NULL),
    ('e3333333-3333-3333-3333-333333333333', '20005', 'Dr. Binod Gautam', 5, 165.50, 'Qualified', 'MD / MS', 'Orthopedics', 'High merit', '{}', 96.0, FALSE, NULL),
    ('e3333333-3333-3333-3333-333333333333', '20006', 'Dr. Sushil Lama', 6, 162.00, 'Qualified', 'MD / MS', 'Radiology', 'High merit', '{}', 94.2, FALSE, NULL),
    -- Flagged records with OCR confidence low or character artifact
    ('e3333333-3333-3333-3333-333333333333', '20007', 'Dr. K@lpana Thapa', 7, 159.00, 'Qualified', 'MD / MS', 'Dermatology', 'Check name spelling', '{}', 74.5, TRUE, 'OCR detected symbol character @ in student name. Requires admin review.'),
    ('e3333333-3333-3333-3333-333333333333', '20008', 'Dr. Mahes_h Rimal', 8, 155.75, 'Qualified', 'MD / MS', 'Psychiatry', 'Check name spelling', '{}', 68.2, TRUE, 'OCR confidence 68.2% < 80% threshold. Symbol number or name may have distortion.')
ON CONFLICT (examination_id, symbol_number) DO NOTHING;
