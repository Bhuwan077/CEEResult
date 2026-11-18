"""
Integration Test Suite for Nepal CEE Result Checker Backend & PDF Pipeline.
"""

import os
import sys
import pytest
from httpx import AsyncClient, ASGITransport

# Add backend and pdf-processor to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
root_dir = os.path.dirname(backend_dir)
pdf_proc_dir = os.path.join(root_dir, "pdf-processor")
sys.path.insert(0, backend_dir)
sys.path.insert(0, pdf_proc_dir)

from app.main import app
from pipeline import CEEProcessingPipeline


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert "CEE Result Checker Nepal" in data["app"]


@pytest.mark.asyncio
async def test_search_preserves_leading_zeros():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Search for symbol '00101'
        res = await client.post("/api/search", json={"symbol_number": "00101"})
        assert res.status_code == 200
        data = res.json()
        assert data["found"] is True
        assert len(data["results"]) >= 1
        result = data["results"][0]
        assert result["symbol_number"] == "00101"
        assert result["student_name"] == "Aarav Sharma"
        assert result["score"] == 186.75
        assert result["rank"] == 1
        assert result["qualification_status"] == "Qualified"


@pytest.mark.asyncio
async def test_search_ignores_surrounding_whitespace():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Search with accidental leading/trailing spaces
        res = await client.post("/api/search", json={"symbol_number": "   00102   "})
        assert res.status_code == 200
        data = res.json()
        assert data["found"] is True
        result = data["results"][0]
        assert result["symbol_number"] == "00102"
        assert result["student_name"] == "Bibek Thapa"


@pytest.mark.asyncio
async def test_search_not_found_message():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/search", json={"symbol_number": "99999999"})
        assert res.status_code == 200
        data = res.json()
        assert data["found"] is False
        assert len(data["results"]) == 0
        assert "No published result found" in data["message"]


@pytest.mark.asyncio
async def test_unpublished_results_hidden_from_public():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Symbol '20001' belongs to Exam 3 which is in 'reviewing' state (unpublished)
        res = await client.post("/api/search", json={"symbol_number": "20001"})
        assert res.status_code == 200
        data = res.json()
        assert data["found"] is False


@pytest.mark.asyncio
async def test_admin_login_and_jwt_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Incorrect credentials
        bad = await client.post("/api/admin/login", json={"username": "admin", "password": "WrongPassword"})
        assert bad.status_code == 401

        # 2. Correct credentials
        good = await client.post("/api/admin/login", json={"username": "admin", "password": "Admin@CEE2024"})
        assert good.status_code == 200
        token_data = good.json()
        assert "access_token" in token_data
        token = token_data["access_token"]

        # 3. Access protected admin examinations list
        headers = {"Authorization": f"Bearer {token}"}
        auth_res = await client.get("/api/admin/examinations", headers=headers)
        assert auth_res.status_code == 200
        exams = auth_res.json()
        assert len(exams) >= 3


def test_pdf_processing_pipeline():
    pipeline = CEEProcessingPipeline()
    sample_dir = os.path.join(root_dir, "sample-data")
    searchable_pdf = os.path.join(sample_dir, "sample_cee_result_searchable.pdf")
    scanned_pdf = os.path.join(sample_dir, "sample_cee_result_scanned.pdf")

    # 1. Searchable PDF
    res1 = pipeline.process_pdf(searchable_pdf)
    assert res1["success"] is True
    assert res1["is_searchable"] is True
    assert res1["total_records"] == 15
    symbols = [r["symbol_number"] for r in res1["records"]]
    assert "00101" in symbols
    assert "00204" in symbols

    # 2. Scanned PDF
    res2 = pipeline.process_pdf(scanned_pdf)
    assert res2["success"] is True
    assert res2["is_searchable"] is False
    assert res2["extraction_method"] == "tesseract_ocr"
    # Should flag records for review due to OCR
    assert res2["flagged_records"] > 0
