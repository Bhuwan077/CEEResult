"""
Pydantic Data Models and API Schemas for Nepal CEE Result Checker.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


# --- Search Models ---

class SearchRequest(BaseModel):
    """Student Result Search Query."""
    symbol_number: str = Field(..., description="Student Symbol / Roll Number (leading zeros preserved)")
    examination_id: Optional[str] = Field(None, description="Optional specific examination UUID filter")

    @field_validator("symbol_number")
    @classmethod
    def clean_symbol(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Symbol number cannot be blank.")
        # Ensure only alphanumeric and common hyphens
        return s


class StudentResult(BaseModel):
    """Detailed Result Card Data for a Student."""
    id: Optional[str] = None
    examination_id: str
    symbol_number: str
    student_name: Optional[str] = None
    rank: Optional[int] = None
    score: Optional[float] = None
    qualification_status: Optional[str] = None
    program: Optional[str] = None
    category: Optional[str] = None
    remarks: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None
    examination_name: Optional[str] = None
    examination_year: Optional[str] = None
    published_at: Optional[str] = None
    ocr_confidence: Optional[float] = 100.0


class SearchResponse(BaseModel):
    """Response returned to student search request."""
    success: bool
    found: bool
    query_symbol: str
    message: str
    results: List[StudentResult] = []


# --- Admin Authentication Models ---

class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminUserOut(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminUserOut


# --- Examination Management Models ---

class ExaminationCreate(BaseModel):
    examination_name: str
    examination_year: str
    program: str = "All Programs"


class ExaminationOut(BaseModel):
    id: str
    examination_name: str
    examination_year: str
    program: str
    source_pdf_filename: Optional[str] = None
    source_pdf_url: Optional[str] = None
    is_searchable_pdf: bool = True
    publication_status: str
    total_records: int = 0
    verified_records: int = 0
    flagged_records: int = 0
    published_at: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None


class ExaminationStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(draft|reviewing|published|archived)$")


# --- Record Verification & Review Models ---

class StudentRecordUpdate(BaseModel):
    id: Optional[str] = None
    symbol_number: str
    student_name: Optional[str] = None
    rank: Optional[int] = None
    score: Optional[float] = None
    qualification_status: Optional[str] = None
    program: Optional[str] = None
    category: Optional[str] = None
    remarks: Optional[str] = None
    ocr_confidence: Optional[float] = 100.0
    is_flagged_for_review: bool = False
    review_notes: Optional[str] = None


class BatchImportRequest(BaseModel):
    examination_id: str
    records: List[StudentRecordUpdate]
    publish_now: bool = False


class ProcessingSummaryOut(BaseModel):
    examination_id: str
    is_searchable: bool
    extraction_method: str
    total_records: int
    verified_records: int
    flagged_records: int
    duplicate_count: int
    records: List[StudentRecordUpdate]
    summary_notes: Optional[List[str]] = []
