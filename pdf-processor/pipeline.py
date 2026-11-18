"""
Unified PDF Processing Pipeline for Nepal CEE Results.
Orchestrates:
1. Validation & File Check
2. Searchability Detection (Text vs Scanned)
3. Direct Text Extraction (PyMuPDF) or OCR (Tesseract / high-res raster)
4. Layout Parsing (Adaptive CEE table logic)
5. Normalization, Deduplication & Validation
6. Summary Generation & Review Flags
"""

import os
from typing import Dict, List, Any, Optional

try:
    from .extract_text import PDFExtractor
    from .ocr_processor import OCRProcessor
    from .parser import CEEParser
    from .validator import CEEValidator
    from .export_results import CEEExporter
except ImportError:
    from extract_text import PDFExtractor
    from ocr_processor import OCRProcessor
    from parser import CEEParser
    from validator import CEEValidator
    from export_results import CEEExporter


class CEEProcessingPipeline:
    """
    Complete end-to-end processing pipeline for Nepal CEE entrance results.
    """

    def __init__(self, tesseract_cmd: Optional[str] = None):
        self.extractor = PDFExtractor()
        self.ocr_processor = OCRProcessor(tesseract_cmd=tesseract_cmd)
        self.parser = CEEParser()
        self.validator = CEEValidator()
        self.exporter = CEEExporter()

    def process_pdf(
        self,
        file_path_or_bytes: Any,
        examination_id: Optional[str] = None,
        force_ocr: bool = False
    ) -> Dict[str, Any]:
        """
        Executes the entire processing pipeline on a PDF file or bytes stream.
        """
        # Step 1 & 2: Extract text and detect searchability
        extraction_res = self.extractor.process(file_path_or_bytes)
        if not extraction_res["success"]:
            return {
                "success": False,
                "error": extraction_res.get("error", "Failed to extract text from PDF"),
                "is_searchable": False,
                "records": [],
                "summary": {}
            }

        is_searchable = extraction_res["is_searchable"] and not force_ocr
        pages_data = extraction_res.get("pages", [])
        overall_confidence = 100.0
        extraction_method = "direct_text_layer"

        # Step 3: If non-searchable or force_ocr, trigger OCR
        if not is_searchable:
            extraction_method = "tesseract_ocr"
            ocr_res = self.ocr_processor.process_scanned_pdf(file_path_or_bytes)
            if not ocr_res["success"]:
                # If Tesseract is unavailable or failed
                return {
                    "success": False,
                    "error": ocr_res.get("error", "OCR processing failed or Tesseract is not installed."),
                    "is_searchable": False,
                    "extraction_method": "ocr_required_but_unavailable",
                    "tesseract_available": self.ocr_processor.is_available(),
                    "records": [],
                    "summary": {}
                }

            # Map OCR pages to parser pages format
            pages_data = []
            for p in ocr_res["pages"]:
                pages_data.append({
                    "page_number": p["page_number"],
                    "raw_text": p["raw_text"],
                    "lines": p["lines"]
                })
            overall_confidence = ocr_res.get("overall_confidence", 85.0)

        # Step 4: Parse lines into candidate records
        raw_records = self.parser.parse_pages(pages_data)

        # Step 5: Validate, normalize symbol numbers, detect duplicates
        default_conf = overall_confidence if not is_searchable else 100.0
        validated_records, summary = self.validator.validate_and_deduplicate_dataset(
            raw_records,
            default_confidence=default_conf
        )

        # Step 6: Package full report
        summary["is_searchable"] = is_searchable
        summary["extraction_method"] = extraction_method
        summary["total_pages"] = extraction_res.get("total_pages", len(pages_data))
        summary["ocr_confidence"] = overall_confidence if not is_searchable else 100.0
        summary["examination_id"] = examination_id

        # Flag general warning if any records need review
        summary["requires_admin_review"] = summary["flagged_records"] > 0 or not is_searchable

        return {
            "success": True,
            "is_searchable": is_searchable,
            "extraction_method": extraction_method,
            "total_records": summary["total_records"],
            "verified_records": summary["verified_records"],
            "flagged_records": summary["flagged_records"],
            "duplicate_count": summary["duplicate_count"],
            "summary": summary,
            "records": validated_records
        }
