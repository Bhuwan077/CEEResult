"""
Security and Sanitization Utilities for CEE Result Checker.
"""

import os
import re
from typing import Tuple


def sanitize_filename(filename: str) -> str:
    """Removes path traversal characters and unsafe symbols from filenames."""
    basename = os.path.basename(filename)
    # Replace spaces and unsafe chars with underscore
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', basename)
    return clean[:120]


def validate_pdf_upload(filename: str, content: bytes, max_size_mb: int = 50) -> Tuple[bool, str]:
    """
    Validates uploaded file extension, size, and PDF magic bytes.
    """
    if not filename.lower().endswith(".pdf"):
        return False, "Only official PDF files (.pdf) are allowed."

    if len(content) > max_size_mb * 1024 * 1024:
        return False, f"File size exceeds maximum allowed limit of {max_size_mb}MB."

    # Validate PDF Magic Bytes (%PDF)
    if not content.startswith(b"%PDF"):
        return False, "File is not a valid PDF document (magic bytes header mismatch)."

    return True, "Valid"
