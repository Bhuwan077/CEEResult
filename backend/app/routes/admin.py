"""
Admin API Routes for Nepal CEE Result Checker.
Includes Authentication, PDF Upload & OCR Pipeline Trigger, Record Review/Editing,
and Publishing Control.
"""

import os
import sys
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse

from ..config import settings
from ..models import (
    AdminLoginRequest, TokenResponse, AdminUserOut,
    ExaminationCreate, ExaminationOut, ExaminationStatusUpdate,
    StudentRecordUpdate, BatchImportRequest
)
from ..database import db
from ..auth import verify_password, create_access_token, get_current_admin
from ..utils.security import sanitize_filename, validate_pdf_upload

# Import PDF processing pipeline
# Add root path to find pdf-processor package
cee_nepal_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
pdf_proc_dir = os.path.join(cee_nepal_root, "pdf-processor")
if pdf_proc_dir not in sys.path:
    sys.path.insert(0, pdf_proc_dir)

try:
    from pipeline import CEEProcessingPipeline
except ImportError:
    import importlib.util
    spec = importlib.util.spec_from_file_location("pipeline", os.path.join(pdf_proc_dir, "pipeline.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    CEEProcessingPipeline = mod.CEEProcessingPipeline

router = APIRouter(prefix="/api/admin", tags=["Admin Portal"])
pipeline_instance = CEEProcessingPipeline()


@router.post("/login", response_model=TokenResponse)
async def admin_login(creds: AdminLoginRequest):
    """Admin Login - Validates credentials and returns JWT bearer token."""
    admin = db.get_admin_by_username(creds.username)
    if not admin or not verify_password(creds.password, admin["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password. Default is admin / Admin@CEE2024"
        )

    token = create_access_token({
        "sub": admin["username"],
        "id": admin["id"],
        "email": admin["email"],
        "full_name": admin["full_name"],
        "role": admin["role"]
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        admin=AdminUserOut(
            id=admin["id"],
            username=admin["username"],
            email=admin["email"],
            full_name=admin["full_name"],
            role=admin["role"]
        )
    )


@router.get("/me", response_model=AdminUserOut)
async def get_current_user_profile(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """Returns profile information for the authenticated admin."""
    return AdminUserOut(**current_admin)


@router.get("/examinations", response_model=List[ExaminationOut])
async def list_all_examinations(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """Lists all examination datasets (draft, reviewing, published, archived)."""
    exams = db.list_examinations(include_unpublished=True)
    return [ExaminationOut(**e) for e in exams]


@router.post("/examinations", response_model=ExaminationOut)
async def create_new_examination(
    payload: ExaminationCreate,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """Creates a new CEE examination dataset record."""
    exam = db.create_examination(payload.model_dump())
    return ExaminationOut(**exam)


@router.post("/examinations/{examination_id}/upload")
async def upload_and_process_pdf(
    examination_id: str,
    file: UploadFile = File(...),
    force_ocr: bool = Form(False),
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Uploads official result PDF and executes processing pipeline:
    1. Validates PDF format and file size.
    2. Automatically detects Searchable vs Scanned/Image PDF.
    3. Extracts text via PyMuPDF or Tesseract OCR.
    4. Parses structured student records with leading-zero preservation.
    5. Normalizes fields, flags low-confidence/duplicate records.
    6. Returns extraction preview for administrative verification.
    """
    exam = db.get_examination(examination_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Examination not found.")

    # Read file content
    content = await file.read()
    clean_name = sanitize_filename(file.filename or "result.pdf")
    
    is_valid, err_msg = validate_pdf_upload(clean_name, content, settings.MAX_UPLOAD_SIZE_MB)
    if not is_valid:
        raise HTTPException(status_code=400, detail=err_msg)

    # Save original PDF for auditing and verification
    save_filename = f"{examination_id}_{uuid.uuid4().hex[:8]}_{clean_name}"
    save_path = os.path.join(settings.UPLOAD_DIR, save_filename)
    with open(save_path, "wb") as f:
        f.write(content)

    # Execute PDF extraction pipeline
    result = pipeline_instance.process_pdf(save_path, examination_id=examination_id, force_ocr=force_ocr)
    if not result["success"]:
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": result.get("error", "PDF processing failed"),
                "is_searchable": result.get("is_searchable", False),
                "extraction_method": result.get("extraction_method"),
                "records": []
            }
        )

    # Update examination metadata
    exam["source_pdf_filename"] = clean_name
    exam["source_pdf_url"] = f"/uploads/{save_filename}"
    exam["is_searchable_pdf"] = result["is_searchable"]
    exam["publication_status"] = "reviewing"

    # Stage extracted records into database
    records = result.get("records", [])
    db.save_examination_records(examination_id, records, replace=True)

    return {
        "success": True,
        "message": f"Successfully processed PDF. Extracted {len(records)} candidate records.",
        "examination_id": examination_id,
        "is_searchable": result["is_searchable"],
        "extraction_method": result["extraction_method"],
        "total_records": result["total_records"],
        "verified_records": result["verified_records"],
        "flagged_records": result["flagged_records"],
        "duplicate_count": result["duplicate_count"],
        "summary": result["summary"],
        "records": records[:100]  # Return preview records
    }


@router.get("/examinations/{examination_id}/records")
async def get_examination_records(
    examination_id: str,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """Retrieves all candidate records for an examination (for review and editing)."""
    exam = db.get_examination(examination_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Examination not found.")

    students = db.get_examination_students(examination_id)
    # Sort: flagged records first, then by rank or symbol
    students.sort(key=lambda s: (not s.get("is_flagged_for_review", False), s.get("rank") or 999999))
    return {
        "examination": exam,
        "total_records": len(students),
        "records": students
    }


@router.put("/records/{record_id}")
async def update_single_record(
    record_id: str,
    updates: StudentRecordUpdate,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """Allows admin to correct extraction errors or verify a flagged candidate record."""
    updated = db.update_student_record(record_id, updates.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Student record not found.")
    return {"success": True, "record": updated}


@router.post("/examinations/{examination_id}/import")
async def import_and_confirm_records(
    examination_id: str,
    payload: BatchImportRequest,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Imports and commits reviewed records to the examination dataset.
    Optionally publishes immediately.
    """
    exam = db.get_examination(examination_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Examination not found.")

    records = [r.model_dump() for r in payload.records]
    db.save_examination_records(examination_id, records, replace=True)

    if payload.publish_now:
        db.update_examination_status(examination_id, "published")

    return {
        "success": True,
        "message": f"Successfully imported {len(records)} verified records.",
        "publication_status": exam["publication_status"]
    }


@router.post("/examinations/{examination_id}/status")
async def update_publication_status(
    examination_id: str,
    payload: ExaminationStatusUpdate,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Toggles publication status ('published', 'draft', 'reviewing', 'archived').
    Only 'published' examination results are queryable by students.
    """
    updated_exam = db.update_examination_status(examination_id, payload.status)
    if not updated_exam:
        raise HTTPException(status_code=404, detail="Examination not found.")
    return {
        "success": True,
        "examination_id": examination_id,
        "publication_status": updated_exam["publication_status"],
        "published_at": updated_exam.get("published_at")
    }


@router.delete("/examinations/{examination_id}")
async def delete_examination_dataset(
    examination_id: str,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """Deletes an examination and all associated student result records."""
    success = db.delete_examination(examination_id)
    if not success:
        raise HTTPException(status_code=404, detail="Examination not found.")
    return {"success": True, "message": "Examination dataset deleted successfully."}
