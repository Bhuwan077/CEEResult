"""
Export Results Module for Nepal CEE Result Checker.
Exports parsed student datasets into JSON, Excel-safe CSV, or inserts directly
into Supabase PostgreSQL database tables.
"""

import json
import csv
import io
from typing import List, Dict, Any, Optional


class CEEExporter:
    """
    Handles exporting and persisting verified CEE examination result datasets.
    """

    @staticmethod
    def to_json(records: List[Dict[str, Any]], indent: int = 2) -> str:
        """Serializes records to formatted JSON string."""
        return json.dumps(records, indent=indent, default=str)

    @staticmethod
    def to_csv(records: List[Dict[str, Any]], excel_safe: bool = True) -> str:
        """
        Exports records to CSV.
        When excel_safe is True, prefixes symbol numbers with a tab or quotes
        to prevent spreadsheet software from stripping leading zeros.
        """
        if not records:
            return ""

        output = io.StringIO()
        fieldnames = [
            "symbol_number", "student_name", "rank", "score",
            "qualification_status", "program", "category",
            "ocr_confidence", "is_flagged_for_review", "review_notes", "page_number"
        ]

        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()

        for rec in records:
            row = dict(rec)
            # Ensure symbol number maintains leading zero in Excel
            sym = str(row.get("symbol_number", ""))
            if excel_safe and sym.startswith("0"):
                row["symbol_number"] = f'="{sym}"'
            writer.writerow(row)

        return output.getvalue()

    @staticmethod
    def prepare_db_records(
        records: List[Dict[str, Any]],
        examination_id: str
    ) -> List[Dict[str, Any]]:
        """
        Formats records for batch insertion into the PostgreSQL 'students' table.
        """
        db_records = []
        for r in records:
            db_records.append({
                "examination_id": examination_id,
                "symbol_number": str(r.get("symbol_number", "")).strip(),
                "student_name": r.get("student_name"),
                "rank": r.get("rank"),
                "score": r.get("score"),
                "qualification_status": r.get("qualification_status"),
                "program": r.get("program"),
                "category": r.get("category"),
                "remarks": r.get("remarks"),
                "additional_data": {
                    "raw_line": r.get("raw_line"),
                    "page_number": r.get("page_number")
                },
                "ocr_confidence": r.get("ocr_confidence", 100.0),
                "is_flagged_for_review": r.get("is_flagged_for_review", False),
                "review_notes": r.get("review_notes")
            })
        return db_records
