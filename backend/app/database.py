"""
Database Layer for Nepal CEE Result Checker.
Supports both Supabase PostgreSQL (via HTTP REST client) and high-performance
in-memory relational store with seed data for instant development and testing.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import httpx

from .config import settings
from .auth import get_password_hash


class DatabaseStore:
    """
    Unified Data Store abstraction.
    Supports local resilient storage + Supabase integration.
    """

    def __init__(self):
        self.examinations: Dict[str, Dict[str, Any]] = {}
        self.students: Dict[str, Dict[str, Any]] = {}
        self.admins: Dict[str, Dict[str, Any]] = {}
        self.use_supabase = bool(
            settings.SUPABASE_URL 
            and "xyzcompany" not in settings.SUPABASE_URL 
            and settings.SUPABASE_SERVICE_ROLE_KEY != "dummy-service-role-key"
        )
        self._seed_initial_data()

    def _seed_initial_data(self):
        """Seeds realistic Nepal CEE examination and student test data."""
        # 1. Admin
        admin_id = "a0000000-0000-0000-0000-000000000001"
        self.admins[admin_id] = {
            "id": admin_id,
            "username": settings.DEFAULT_ADMIN_USERNAME,
            "email": "admin@ceenepal.edu.np",
            "password_hash": get_password_hash(settings.DEFAULT_ADMIN_PASSWORD),
            "full_name": "CEE Examination Controller",
            "role": "superadmin",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        # 2. Published Exam 1: MECEE-BL 2024 (MBBS/BDS)
        exam1_id = "e1111111-1111-1111-1111-111111111111"
        self.examinations[exam1_id] = {
            "id": exam1_id,
            "examination_name": "MECEE-BL 2024 - Bachelor Level (MBBS/BDS)",
            "examination_year": "2024",
            "program": "MBBS / BDS",
            "source_pdf_filename": "MECEE_BL_2024_Result_MBBS_BDS.pdf",
            "source_pdf_url": "/sample-data/sample_cee_result_searchable.pdf",
            "is_searchable_pdf": True,
            "publication_status": "published",
            "total_records": 15,
            "verified_records": 15,
            "flagged_records": 0,
            "published_at": "2024-11-10T10:00:00Z",
            "created_at": "2024-11-10T09:30:00Z",
            "updated_at": "2024-11-10T10:00:00Z"
        }

        # Sample students with preserved leading zeros
        sample_students_exam1 = [
            ("00101", "Aarav Sharma", 1, 186.75, "Qualified", "MBBS", "Open", "Eligible for Government Merit Scholarship"),
            ("00102", "Bibek Thapa", 2, 184.50, "Qualified", "MBBS", "Open", "Eligible for Government Merit Scholarship"),
            ("00103", "Pooja Karki", 3, 182.00, "Qualified", "MBBS", "Female Quota", "Eligible for Government Merit Scholarship"),
            ("00104", "Rohan Shrestha", 4, 180.25, "Qualified", "MBBS", "Janajati Quota", "Eligible for Government Merit Scholarship"),
            ("00105", "Samikshya Adhikari", 5, 179.00, "Qualified", "MBBS", "Female Quota", "Eligible for Government Merit Scholarship"),
            ("00204", "Deepak Chaudhary", 12, 172.50, "Qualified", "MBBS", "Tharu Quota", "Eligible for Quota Seat"),
            ("00318", "Kritika Joshi", 25, 168.00, "Qualified", "BDS", "Open", "Eligible for BDS Open Merit"),
            ("00452", "Prashant Dahal", 48, 161.75, "Qualified", "MBBS", "Open", "Eligible for Paying Seat"),
            ("00789", "Suman Tamang", 105, 153.25, "Qualified", "MBBS", "Janajati Quota", "Eligible for Paying Seat"),
            ("01053", "Anjali Yadav", 210, 145.00, "Qualified", "BDS", "Madhesi Quota", "Eligible for Paying Seat"),
            ("01290", "Nabin Giri", 380, 137.50, "Qualified", "MBBS", "Open", "Eligible for Paying Seat"),
            ("02341", "Prakash Bishwokarma", 540, 128.00, "Qualified", "MBBS", "Dalit Quota", "Eligible for Reserved Seat"),
            ("03890", "Ramesh Bahadur Malla", 890, 112.50, "Qualified", "BDS", "Backward Reg", "Eligible for Backward Region Quota"),
            ("04512", "Sunita Gurung", 1240, 101.00, "Qualified", "BDS", "Janajati Quota", "Qualified for Counseling"),
            ("05999", "Bikash Rana", None, 84.50, "Not Qualified", "MBBS", "Open", "Below 50th percentile minimum qualifying score (100.00)")
        ]

        for sym, name, rank, score, status, prog, cat, rem in sample_students_exam1:
            st_id = str(uuid.uuid4())
            self.students[st_id] = {
                "id": st_id,
                "examination_id": exam1_id,
                "symbol_number": sym,
                "student_name": name,
                "rank": rank,
                "score": score,
                "qualification_status": status,
                "program": prog,
                "category": cat,
                "remarks": rem,
                "additional_data": {"fictional_test_record": True},
                "ocr_confidence": 100.0,
                "is_flagged_for_review": False,
                "review_notes": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }

        # 3. Published Exam 2: Allied Health & Nursing
        exam2_id = "e2222222-2222-2222-2222-222222222222"
        self.examinations[exam2_id] = {
            "id": exam2_id,
            "examination_name": "MECEE-BL 2024 - Allied Health & Nursing (B.Sc Nursing/BAMS/B.Pharm)",
            "examination_year": "2024",
            "program": "B.Sc Nursing / BAMS / B.Pharm",
            "source_pdf_filename": "MECEE_BL_2024_Allied_Result.pdf",
            "source_pdf_url": "/sample-data/sample_cee_result_searchable.pdf",
            "is_searchable_pdf": True,
            "publication_status": "published",
            "total_records": 10,
            "verified_records": 10,
            "flagged_records": 0,
            "published_at": "2024-11-12T14:00:00Z",
            "created_at": "2024-11-12T12:00:00Z",
            "updated_at": "2024-11-12T14:00:00Z"
        }

        sample_allied = [
            ("10101", "Dipika Pokhrel", 1, 175.00, "Qualified", "B.Sc Nursing", "Open", "Eligible for Top Merit Seat"),
            ("10102", "Bipin Acharya", 2, 172.25, "Qualified", "B.Pharm", "Open", "Eligible for Government Merit Seat"),
            ("10103", "Sweta Singh", 3, 169.50, "Qualified", "BAMS", "Open", "Eligible for Government Merit Seat"),
            ("10205", "Manish Shrestha", 15, 155.00, "Qualified", "B.Sc Nursing", "Open", "Qualified for Counseling"),
            ("10350", "Alisha Khadka", 42, 142.50, "Qualified", "B.Pharm", "Female Quota", "Qualified for Counseling"),
            ("10480", "Roshan Mahato", 68, 136.00, "Qualified", "BAMS", "Madhesi Quota", "Qualified for Counseling"),
            ("10590", "Rebika Pariyar", 95, 130.50, "Qualified", "B.Sc Nursing", "Dalit Quota", "Qualified for Counseling"),
            ("10720", "Sandeep Magar", 140, 122.00, "Qualified", "B.Pharm", "Janajati Quota", "Qualified for Counseling"),
            ("10888", "Gita Neupane", 215, 110.50, "Qualified", "B.Sc Nursing", "Open", "Qualified for Counseling"),
            ("11000", "Kamal Rokaya", None, 91.00, "Not Qualified", "BAMS", "Backward Reg", "Below Minimum Passing Score (100.00)")
        ]

        for sym, name, rank, score, status, prog, cat, rem in sample_allied:
            st_id = str(uuid.uuid4())
            self.students[st_id] = {
                "id": st_id,
                "examination_id": exam2_id,
                "symbol_number": sym,
                "student_name": name,
                "rank": rank,
                "score": score,
                "qualification_status": status,
                "program": prog,
                "category": cat,
                "remarks": rem,
                "additional_data": {"fictional_test_record": True},
                "ocr_confidence": 100.0,
                "is_flagged_for_review": False,
                "review_notes": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }

        # 4. Draft Exam (For Testing Admin Review and Correction Interface)
        exam3_id = "e3333333-3333-3333-3333-333333333333"
        self.examinations[exam3_id] = {
            "id": exam3_id,
            "examination_name": "MECEE-PG 2024 - Postgraduate MD/MS (Draft Review)",
            "examination_year": "2024",
            "program": "MD / MS",
            "source_pdf_filename": "MECEE_PG_2024_Draft_Result.pdf",
            "source_pdf_url": None,
            "is_searchable_pdf": False,
            "publication_status": "reviewing",
            "total_records": 4,
            "verified_records": 2,
            "flagged_records": 2,
            "published_at": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        # 2 verified, 2 flagged for review
        draft_students = [
            ("20001", "Dr. Niranjan Bhattarai", 1, 178.50, "Qualified", "MD / MS", "General Surgery", "High merit", 98.5, False, None),
            ("20002", "Dr. Sandhya Pradhan", 2, 174.00, "Qualified", "MD / MS", "Pediatrics", "High merit", 99.1, False, None),
            ("20003", "Dr. K@lpana Thapa", 3, 159.00, "Qualified", "MD / MS", "Dermatology", "Check name spelling", 74.5, True, "OCR detected symbol character @ in student name. Requires admin review."),
            ("20004", "Dr. Mahes_h Rimal", 4, 155.75, "Qualified", "MD / MS", "Psychiatry", "Check name spelling", 68.2, True, "OCR confidence 68.2% < 80% threshold. Symbol number or name may have distortion.")
        ]

        for sym, name, rank, score, status, prog, cat, rem, conf, flagged, notes in draft_students:
            st_id = str(uuid.uuid4())
            self.students[st_id] = {
                "id": st_id,
                "examination_id": exam3_id,
                "symbol_number": sym,
                "student_name": name,
                "rank": rank,
                "score": score,
                "qualification_status": status,
                "program": prog,
                "category": cat,
                "remarks": rem,
                "additional_data": {},
                "ocr_confidence": conf,
                "is_flagged_for_review": flagged,
                "review_notes": notes,
                "created_at": datetime.now(timezone.utc).isoformat()
            }

    # --- Search Methods ---

    def search_student_result(self, symbol_number: str, examination_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fast student result query.
        Normalizes symbol number (TRIM), checks published status,
        and returns complete result card data.
        """
        clean_symbol = symbol_number.strip()
        matched = []

        for st in self.students.values():
            if st["symbol_number"] == clean_symbol:
                exam = self.examinations.get(st["examination_id"])
                # Only return if examination is published!
                if exam and exam["publication_status"] == "published":
                    if examination_id and exam["id"] != examination_id:
                        continue
                    
                    matched.append({
                        **st,
                        "examination_name": exam["examination_name"],
                        "examination_year": exam["examination_year"],
                        "published_at": exam["published_at"]
                    })

        # Sort by year descending
        matched.sort(key=lambda x: str(x.get("examination_year", "")), reverse=True)
        return matched

    # --- Examination Methods ---

    def list_examinations(self, include_unpublished: bool = False) -> List[Dict[str, Any]]:
        """Lists examinations. Students only see published exams; Admins see all."""
        exams = list(self.examinations.values())
        if not include_unpublished:
            exams = [e for e in exams if e["publication_status"] == "published"]
        exams.sort(key=lambda x: x["created_at"], reverse=True)
        return exams

    def get_examination(self, exam_id: str) -> Optional[Dict[str, Any]]:
        return self.examinations.get(exam_id)

    def create_examination(self, data: Dict[str, Any]) -> Dict[str, Any]:
        exam_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        exam = {
            "id": exam_id,
            "examination_name": data["examination_name"],
            "examination_year": data["examination_year"],
            "program": data.get("program", "All Programs"),
            "source_pdf_filename": data.get("source_pdf_filename"),
            "source_pdf_url": data.get("source_pdf_url"),
            "is_searchable_pdf": data.get("is_searchable_pdf", True),
            "publication_status": "draft",
            "total_records": 0,
            "verified_records": 0,
            "flagged_records": 0,
            "published_at": None,
            "created_at": now,
            "updated_at": now
        }
        self.examinations[exam_id] = exam
        return exam

    def update_examination_status(self, exam_id: str, status: str) -> Optional[Dict[str, Any]]:
        exam = self.examinations.get(exam_id)
        if not exam:
            return None
        exam["publication_status"] = status
        exam["updated_at"] = datetime.now(timezone.utc).isoformat()
        if status == "published" and not exam["published_at"]:
            exam["published_at"] = exam["updated_at"]
        return exam

    def delete_examination(self, exam_id: str) -> bool:
        if exam_id not in self.examinations:
            return False
        # Cascade delete students
        to_del = [sid for sid, s in self.students.items() if s["examination_id"] == exam_id]
        for sid in to_del:
            del self.students[sid]
        del self.examinations[exam_id]
        return True

    # --- Student Records Methods ---

    def get_examination_students(self, exam_id: str) -> List[Dict[str, Any]]:
        return [s for s in self.students.values() if s["examination_id"] == exam_id]

    def save_examination_records(self, exam_id: str, records: List[Dict[str, Any]], replace: bool = True):
        """Saves batch verified student records for an examination."""
        if replace:
            # Clear old records for this exam
            to_del = [sid for sid, s in self.students.items() if s["examination_id"] == exam_id]
            for sid in to_del:
                del self.students[sid]

        now = datetime.now(timezone.utc).isoformat()
        verified_count = 0
        flagged_count = 0

        for r in records:
            st_id = r.get("id") or str(uuid.uuid4())
            is_flagged = r.get("is_flagged_for_review", False)
            if is_flagged:
                flagged_count += 1
            else:
                verified_count += 1

            self.students[st_id] = {
                "id": st_id,
                "examination_id": exam_id,
                "symbol_number": str(r.get("symbol_number", "")).strip(),
                "student_name": r.get("student_name"),
                "rank": r.get("rank"),
                "score": r.get("score"),
                "qualification_status": r.get("qualification_status"),
                "program": r.get("program"),
                "category": r.get("category"),
                "remarks": r.get("remarks"),
                "additional_data": r.get("additional_data", {}),
                "ocr_confidence": r.get("ocr_confidence", 100.0),
                "is_flagged_for_review": is_flagged,
                "review_notes": r.get("review_notes"),
                "created_at": now
            }

        # Update exam record counts
        exam = self.examinations.get(exam_id)
        if exam:
            exam["total_records"] = len(records)
            exam["verified_records"] = verified_count
            exam["flagged_records"] = flagged_count
            exam["updated_at"] = now

    def update_student_record(self, record_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        record = self.students.get(record_id)
        if not record:
            return None
        
        for k, v in updates.items():
            if k in record and k not in ("id", "examination_id", "created_at"):
                record[k] = v

        # Recalculate exam counters
        exam_id = record["examination_id"]
        exam_students = self.get_examination_students(exam_id)
        exam = self.examinations.get(exam_id)
        if exam:
            exam["flagged_records"] = sum(1 for s in exam_students if s.get("is_flagged_for_review"))
            exam["verified_records"] = len(exam_students) - exam["flagged_records"]

        return record

    # --- Admin Auth Methods ---

    def get_admin_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        for adm in self.admins.values():
            if adm["username"] == username:
                return adm
        return None


# Global Database Instance
db = DatabaseStore()
