"""
Public Examination API Routes.
Provides list of officially published CEE examination programs and years.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from ..models import ExaminationOut
from ..database import db

router = APIRouter(prefix="/api/examinations", tags=["Examinations"])


@router.get("", response_model=List[ExaminationOut])
async def get_published_examinations():
    """
    Returns list of all published CEE examinations available for student result lookup.
    """
    exams = db.list_examinations(include_unpublished=False)
    return [ExaminationOut(**e) for e in exams]


@router.get("/{examination_id}", response_model=ExaminationOut)
async def get_examination_detail(examination_id: str):
    """
    Returns details for a single published examination.
    """
    exam = db.get_examination(examination_id)
    if not exam or exam["publication_status"] != "published":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examination not found or has not been published yet."
        )
    return ExaminationOut(**exam)
