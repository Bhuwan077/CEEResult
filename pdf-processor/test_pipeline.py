"""
Test verification script for PDF Processor Pipeline.
"""

import os
import sys

# Add parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pdf_processor.pipeline import CEEProcessingPipeline

def run_tests():
    pipeline = CEEProcessingPipeline()
    sample_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample-data")
    searchable_pdf = os.path.join(sample_dir, "sample_cee_result_searchable.pdf")
    scanned_pdf = os.path.join(sample_dir, "sample_cee_result_scanned.pdf")

    print("--- 1. Testing Searchable PDF Detection & Extraction ---")
    res1 = pipeline.process_pdf(searchable_pdf)
    print(f"Success: {res1['success']}")
    print(f"Detected is_searchable: {res1['is_searchable']}")
    print(f"Extraction Method: {res1['extraction_method']}")
    print(f"Total Records Extracted: {res1['total_records']}")
    print(f"Verified Records: {res1['verified_records']}")
    print(f"Flagged Records: {res1['flagged_records']}")
    
    assert res1["success"] is True, "Pipeline failed on searchable PDF"
    assert res1["is_searchable"] is True, "Failed to detect searchable PDF"
    assert res1["total_records"] >= 10, f"Expected at least 10 records, got {res1['total_records']}"

    # Verify leading zeros preserved
    symbols = [r["symbol_number"] for r in res1["records"]]
    print(f"Extracted Symbols: {symbols[:5]}")
    assert "00101" in symbols, f"Leading zeros failed! Symbols: {symbols}"
    print("[PASS] Searchable PDF processed perfectly with leading zeros preserved!")

    print("\n--- 2. Testing Scanned PDF Detection ---")
    res2 = pipeline.extractor.process(scanned_pdf)
    print(f"Scanned PDF is_searchable detected: {res2['is_searchable']}")
    print(f"Detection Info: {res2['detection_info']['extraction_method']}")
    assert res2["is_searchable"] is False, "Failed to identify scanned PDF as non-searchable"
    print("[PASS] Non-searchable scanned PDF correctly identified as requiring OCR!")

if __name__ == "__main__":
    run_tests()
