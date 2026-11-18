"""
Record Validation and Normalization Module for Nepal CEE Results.
Enforces data integrity, preserves leading zeros, detects duplicates,
and flags anomalous or low-confidence records for admin review.
"""

import re
from typing import Dict, List, Any, Tuple, Set, Optional


class CEEValidator:
    """
    Validates, normalizes, and categorizes extracted student records.
    Ensures that errors are flagged for human review rather than silently discarded or published.
    """

    MAX_CEE_SCORE = 200.0
    MIN_CEE_SCORE = 0.0
    OCR_CONFIDENCE_THRESHOLD = 80.0

    # Suspicious characters in names (often OCR artifacts)
    SUSPICIOUS_NAME_CHARS = re.compile(r'[@#$%^&*_+={}\[\]|\\<>]')

    def normalize_symbol_number(self, symbol: Any) -> str:
        """
        Normalizes symbol number:
        - Converts to string
        - Strips whitespace
        - Preserves leading zeros (e.g. '00101' stays '00101')
        """
        if symbol is None:
            return ""
        s = str(symbol).strip()
        # Remove any surrounding quotes or brackets if present
        s = s.strip('"\'()[]{}')
        return s

    def normalize_name(self, name: Optional[str]) -> Tuple[Optional[str], List[str]]:
        """
        Cleans candidate name and detects potential OCR corruption.
        Returns (clean_name, warnings).
        """
        if not name:
            return None, ["Missing student name"]

        warnings = []
        name_clean = " ".join(name.strip().split())

        # Check for suspicious characters
        if self.SUSPICIOUS_NAME_CHARS.search(name_clean):
            warnings.append(f"Name contains unusual characters: '{name_clean}'")

        # Check if name contains numbers (e.g., 'Samikshya 12' from OCR confusion)
        if re.search(r'\d', name_clean):
            warnings.append(f"Name contains numeric digits: '{name_clean}'")

        # Remove strange characters if minor
        cleaned = re.sub(r'[@#$%^&*_+={}\[\]|\\<>]', '', name_clean)
        cleaned = " ".join(cleaned.split())

        return cleaned, warnings

    def validate_record(
        self,
        record: Dict[str, Any],
        seen_symbols: Dict[str, int],
        default_confidence: float = 100.0
    ) -> Dict[str, Any]:
        """
        Validates a single candidate record and sets flags/notes.
        """
        flags: List[str] = []
        is_flagged = False

        # 1. Symbol Number Validation & Normalization
        raw_symbol = record.get("symbol_number")
        symbol = self.normalize_symbol_number(raw_symbol)
        record["symbol_number"] = symbol

        if not symbol or len(symbol) < 3:
            flags.append("Invalid or missing symbol number")
            is_flagged = True
        else:
            # Check duplicate
            seen_symbols[symbol] = seen_symbols.get(symbol, 0) + 1
            if seen_symbols[symbol] > 1:
                flags.append(f"Duplicate symbol number '{symbol}' detected in dataset (occurrence #{seen_symbols[symbol]})")
                is_flagged = True

        # 2. Name Normalization & Validation
        raw_name = record.get("student_name")
        clean_name, name_warnings = self.normalize_name(raw_name)
        record["student_name"] = clean_name
        if name_warnings:
            flags.extend(name_warnings)
            is_flagged = True

        # 3. Score Validation
        score = record.get("score")
        if score is not None:
            try:
                score_flt = float(score)
                record["score"] = round(score_flt, 2)
                if score_flt < self.MIN_CEE_SCORE or score_flt > self.MAX_CEE_SCORE:
                    flags.append(f"Score {score_flt} is outside valid CEE range ({self.MIN_CEE_SCORE}-{self.MAX_CEE_SCORE})")
                    is_flagged = True
            except (ValueError, TypeError):
                flags.append(f"Non-numeric score value: '{score}'")
                is_flagged = True

        # 4. Rank Validation
        rank = record.get("rank")
        if rank is not None:
            try:
                rank_int = int(rank)
                record["rank"] = rank_int
                if rank_int < 1:
                    flags.append(f"Invalid rank value: {rank_int}")
                    is_flagged = True
            except (ValueError, TypeError):
                flags.append(f"Non-numeric rank value: '{rank}'")
                is_flagged = True

        # 5. OCR Confidence Check
        confidence = record.get("ocr_confidence", default_confidence)
        record["ocr_confidence"] = float(confidence)
        if record["ocr_confidence"] < self.OCR_CONFIDENCE_THRESHOLD:
            flags.append(f"Low OCR confidence ({record['ocr_confidence']}%)")
            is_flagged = True

        record["is_flagged_for_review"] = is_flagged
        record["review_notes"] = "; ".join(flags) if flags else None

        return record

    def validate_and_deduplicate_dataset(
        self,
        records: List[Dict[str, Any]],
        default_confidence: float = 100.0
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Validates the entire extracted dataset, marks duplicates,
        and generates processing statistics.
        """
        seen_symbols: Dict[str, int] = {}
        validated_records: List[Dict[str, Any]] = []

        # First pass: count symbol frequencies
        for rec in records:
            norm_sym = self.normalize_symbol_number(rec.get("symbol_number"))
            if norm_sym:
                seen_symbols[norm_sym] = seen_symbols.get(norm_sym, 0) + 1

        # Second pass: validate each record and check if duplicate
        verified_count = 0
        flagged_count = 0
        duplicates_set: Set[str] = set()

        for rec in records:
            # Re-run single record check with awareness of total duplicates
            raw_symbol = self.normalize_symbol_number(rec.get("symbol_number"))
            validated = self.validate_record(rec, {}, default_confidence=default_confidence)

            # Mark if duplicate
            if raw_symbol and seen_symbols.get(raw_symbol, 0) > 1:
                duplicates_set.add(raw_symbol)
                validated["is_flagged_for_review"] = True
                dup_note = f"Duplicate symbol number: '{raw_symbol}' appears {seen_symbols[raw_symbol]} times"
                if validated["review_notes"]:
                    validated["review_notes"] += f"; {dup_note}"
                else:
                    validated["review_notes"] = dup_note

            if validated["is_flagged_for_review"]:
                flagged_count += 1
            else:
                verified_count += 1

            validated_records.append(validated)

        summary = {
            "total_records": len(validated_records),
            "verified_records": verified_count,
            "flagged_records": flagged_count,
            "duplicate_count": len(duplicates_set),
            "duplicates_list": list(duplicates_set),
            "is_clean": flagged_count == 0
        }

        return validated_records, summary
