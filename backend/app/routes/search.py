"""
Public Search API Routes for Nepal CEE Results.
Provides ultra-fast symbol-number lookup with leading-zero preservation and rate limiting.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from ..models import SearchRequest, SearchResponse, StudentResult
from ..database import db
from ..utils.rate_limiter import check_search_rate_limit

router = APIRouter(prefix="/api/search", tags=["Student Search"])


@router.post("", response_model=SearchResponse, dependencies=[Depends(check_search_rate_limit)])
async def search_result_post(query: SearchRequest):
    """
    Search CEE Result by Symbol Number (POST endpoint).
    - Preserves leading zeros.
    - Trims surrounding spaces.
    - Only returns records from published examinations.
    """
    clean_symbol = query.symbol_number.strip()
    results = db.search_student_result(clean_symbol, query.examination_id)

    if not results:
        return SearchResponse(
            success=True,
            found=False,
            query_symbol=clean_symbol,
            message=f"No published result found for symbol number '{clean_symbol}'. Please verify your symbol number or check if the result for your examination program has been officially published.",
            results=[]
        )

    formatted_results = [StudentResult(**r) for r in results]
    return SearchResponse(
        success=True,
        found=True,
        query_symbol=clean_symbol,
        message=f"Found {len(formatted_results)} result(s) for symbol number '{clean_symbol}'.",
        results=formatted_results
    )


@router.get("/{symbol_number}", response_model=SearchResponse, dependencies=[Depends(check_search_rate_limit)])
async def search_result_get(
    symbol_number: str,
    examination_id: Optional[str] = Query(None, description="Optional examination UUID filter")
):
    """
    Search CEE Result by Symbol Number (GET endpoint for direct links / bookmarks).
    """
    clean_symbol = symbol_number.strip()
    results = db.search_student_result(clean_symbol, examination_id)

    if not results:
        return SearchResponse(
            success=True,
            found=False,
            query_symbol=clean_symbol,
            message=f"No published result found for symbol number '{clean_symbol}'.",
            results=[]
        )

    formatted_results = [StudentResult(**r) for r in results]
    return SearchResponse(
        success=True,
        found=True,
        query_symbol=clean_symbol,
        message=f"Found {len(formatted_results)} result(s).",
        results=formatted_results
    )
