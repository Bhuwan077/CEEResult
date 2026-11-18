"""
Adaptive Result Layout Parser for Nepal CEE (Medical Education Commission) PDFs.
Capable of parsing various CEE result formats, columnar layouts, and merit lists.
Extracts candidate records without hardcoded schema assumptions.
"""

import re
from typing import Dict, List, Any, Optional, Tuple


class CEEParser:
    """
    Adaptive CEE PDF line parser.
    Identifies candidate records, symbol numbers, names, ranks, scores,
    and qualification statuses across various published MEC layout formats.
    """

    # Headers and noise to filter out
    NOISE_PATTERNS = [
        r"GOVERNMENT\s+OF\s+NEPAL",
        r"MEDICAL\s+EDUCATION\s+COMMISSION",
        r"DIRECTORATE\s+OF\s+EXAMINATION",
        r"COMMON\s+ENTRANCE\s+EXAMINATION",
        r"MECEE-[A-Z]+",
        r"ENTRANCE\s+EXAMINATION\s+RESULT",
        r"MERIT\s+LIST",
        r"PAGE\s+\d+\s+OF\s+\d+",
        r"DATE\s*:\s*\d{4}[-/.]\d{2}[-/.]\d{2}",
        r"SN\s+ROLL\s+NO",
        r"SYMBOL\s+NO",
        r"CANDIDATE\s+NAME",
        r"FULL\s+NAME",
        r"MERIT\s+RANK",
        r"OBTAINED\s+SCORE",
        r"TOTAL\s+SCORE",
        r"QUALIFICATION\s+STATUS"
    ]

    # Regex patterns for CEE field extraction
    SCORE_PATTERN = re.compile(r'\b(1\d{2}(?:\.\d{1,2})?|200(?:\.00?)?|[0-9]{1,2}(?:\.\d{1,2})?)\b')
    SYMBOL_PATTERN = re.compile(r'\b(0*[0-9]{4,10})\b')
    STATUS_PATTERN = re.compile(r'\b(QUALIFIED|NOT\s+QUALIFIED|PASSED|FAILED|ELIGIBLE|DISQUALIFIED|WITHHELD)\b', re.IGNORECASE)
    CATEGORY_PATTERN = re.compile(
        r'\b(OPEN|FEMALE(?:\s+QUOTA)?|JANAJATI(?:\s+QUOTA)?|MADHESI(?:\s+QUOTA)?|DALIT(?:\s+QUOTA)?|THARU(?:\s+QUOTA)?|MUSLIM|PICCHADIYEKO|BACKWARD(?:\s+REG)?|GOVERNMENT|SCHOLARSHIP|PAYING|FOREIGN)\b',
        re.IGNORECASE
    )
    CATEGORY_WORDS = {'OPEN', 'FEMALE', 'JANAJATI', 'MADHESI', 'DALIT', 'THARU', 'MUSLIM', 'PICCHADIYEKO', 'BACKWARD', 'QUOTA', 'REG', 'REGION'}

    def is_header_or_noise(self, line: str) -> bool:
        """Determines if a line is a document header, table title, or pagination noise."""
        line_clean = line.strip().upper()
        if len(line_clean) < 3:
            return True

        for pat in self.NOISE_PATTERNS:
            if re.search(pat, line_clean):
                return True

        return False

    def parse_single_line(self, line: str, page_number: int = 1, line_index: int = 0) -> Optional[Dict[str, Any]]:
        """
        Parses an individual text line into a structured candidate dictionary.
        Returns None if the line does not represent a student record.
        """
        line_str = line.strip()
        if not line_str or self.is_header_or_noise(line_str):
            return None

        # A valid candidate record in CEE must contain at least a numeric symbol number
        tokens = line_str.split()
        if len(tokens) < 3:
            return None

        # 1. Search for Symbol Number
        # Usually 4-10 digits, often starting with leading zeros (e.g., '00101', '10101')
        symbol_matches = list(self.SYMBOL_PATTERN.finditer(line_str))
        if not symbol_matches:
            return None

        # 2. Extract Qualification Status if present
        status = None
        status_match = self.STATUS_PATTERN.search(line_str)
        if status_match:
            status_raw = status_match.group(1).upper()
            if "NOT QUALIFIED" in status_raw or "FAILED" in status_raw or "DISQUALIFIED" in status_raw:
                status = "Not Qualified"
            else:
                status = "Qualified"

        # 3. Extract Category / Quota if present
        category = None
        cat_match = self.CATEGORY_PATTERN.search(line_str)
        if cat_match:
            category = cat_match.group(0).title()

        # 4. Token-level analysis
        # Look for: SN, Symbol No, Name (words), Score (decimal/int <= 200), Rank (int)
        symbol_num = None
        rank_val = None
        score_val = None
        name_tokens = []
        remarks_tokens = []

        # Heuristic layout detection by analyzing token types
        # Identify numeric candidates
        numeric_indices = []
        for idx, t in enumerate(tokens):
            clean_t = t.replace(',', '').replace('%', '')
            if re.match(r'^\d+(\.\d+)?$', clean_t):
                numeric_indices.append((idx, clean_t))

        if not numeric_indices:
            return None

        # In CEE result layouts:
        # Pattern A: [SN] [SymbolNo] [Candidate Name...] [Score] [Rank] [Status] [Category]
        # Pattern B: [Rank] [SymbolNo] [Candidate Name...] [Score] [Status]
        # Pattern C: [SymbolNo] [Candidate Name...] [Rank] [Score]

        # Let's locate the symbol number token
        symbol_token_idx = -1
        for idx, val in numeric_indices:
            # Symbol number is typically 4 to 8 digits, e.g. 00101, 10101
            # SN is typically 1 to 4 digits starting from 1
            if len(val) >= 4 and symbol_num is None:
                symbol_num = val
                symbol_token_idx = idx
                break

        # If no 4+ digit number, check if second number could be symbol
        if symbol_num is None and len(numeric_indices) >= 2:
            symbol_token_idx = numeric_indices[1][0]
            symbol_num = numeric_indices[1][1]

        if not symbol_num:
            return None

        # Look for score (float with dot, or number between 30 and 200)
        score_token_idx = -1
        for idx, val in numeric_indices:
            if idx == symbol_token_idx:
                continue
            if '.' in val:
                try:
                    f_val = float(val)
                    if 0.0 <= f_val <= 200.0:
                        score_val = f_val
                        score_token_idx = idx
                        break
                except ValueError:
                    pass

        # If score not found with dot, check integer scores
        if score_val is None:
            for idx, val in numeric_indices:
                if idx == symbol_token_idx:
                    continue
                try:
                    i_val = float(val)
                    if 30.0 <= i_val <= 200.0 and score_val is None:
                        # Could be score
                        score_val = i_val
                        score_token_idx = idx
                except ValueError:
                    pass

        # Look for rank (integer, usually 1 to 20000)
        rank_token_idx = -1
        for idx, val in numeric_indices:
            if idx in (symbol_token_idx, score_token_idx):
                continue
            if '.' not in val:
                try:
                    i_rank = int(val)
                    # If this is at the very beginning (index 0), it might be SN or Rank
                    if rank_val is None and i_rank >= 1:
                        rank_val = i_rank
                        rank_token_idx = idx
                except ValueError:
                    pass

        # Extract name: alphabetical tokens occurring between symbol number and score/rank/status
        # or between SN and score
        for idx, t in enumerate(tokens):
            if idx in (symbol_token_idx, score_token_idx, rank_token_idx):
                continue
            
            clean_alpha = re.sub(r'[^a-zA-Z.]', '', t)
            if not clean_alpha:
                continue

            # Skip known status or category words if they match
            if status_match and t.upper() in status_match.group(0).upper():
                continue
            if cat_match and t.upper() in cat_match.group(0).upper():
                continue
            if t.upper() in self.CATEGORY_WORDS:
                continue

            name_tokens.append(t)

        student_name = " ".join(name_tokens).strip() if name_tokens else None

        # If name is empty, attempt regex extraction on the line segment
        if not student_name:
            name_cand = re.search(r'[A-Za-z]+(?:\s+[A-Za-z]+){1,4}', line_str)
            if name_cand:
                cand_str = name_cand.group(0).strip()
                if not any(noise.lower() in cand_str.lower() for noise in ["qualified", "female", "open", "result", "rank"]):
                    student_name = cand_str

        # If status was not explicitly extracted, infer from score (CEE passing mark is 50% = 100/200)
        if status is None and score_val is not None:
            if score_val >= 100.0:
                status = "Qualified"
            elif score_val > 0:
                status = "Not Qualified"

        return {
            "symbol_number": symbol_num,
            "student_name": student_name,
            "rank": rank_val,
            "score": score_val,
            "qualification_status": status,
            "category": category,
            "program": None,  # Inferred at document or header level
            "remarks": None,
            "raw_line": line_str,
            "page_number": page_number,
            "line_index": line_index
        }

    def detect_program_from_text(self, full_text: str) -> Optional[str]:
        """
        Detects the CEE program (MBBS, BDS, B.Sc Nursing, BAMS, etc.) from the PDF header or text.
        """
        text_upper = full_text.upper()
        if "MBBS" in text_upper and "BDS" in text_upper:
            return "MBBS / BDS"
        elif "MBBS" in text_upper:
            return "MBBS"
        elif "BDS" in text_upper:
            return "BDS"
        elif "B.SC NURSING" in text_upper or "BSC NURSING" in text_upper:
            return "B.Sc Nursing"
        elif "BAMS" in text_upper:
            return "BAMS"
        elif "B.PHARM" in text_upper or "BPHARM" in text_upper:
            return "B.Pharm"
        elif "MD/MS" in text_upper or "POSTGRADUATE" in text_upper:
            return "MD / MS"
        return "CEE General"

    def parse_pages(self, pages_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Parses all lines across all pages and returns the list of candidate records.
        """
        all_records = []
        combined_text = ""

        for p_data in pages_data:
            page_num = p_data.get("page_number", 1)
            lines = p_data.get("lines", [])
            raw_text = p_data.get("raw_text", "")
            combined_text += " " + raw_text

            for idx, line in enumerate(lines):
                parsed = self.parse_single_line(line, page_number=page_num, line_index=idx)
                if parsed:
                    all_records.append(parsed)

        # Detect program if available
        detected_prog = self.detect_program_from_text(combined_text)
        for rec in all_records:
            if not rec.get("program"):
                rec["program"] = detected_prog

        return all_records
