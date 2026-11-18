"""
PDF Text Extraction Module for Nepal CEE Result Checker
Handles PDF type detection (Searchable vs Non-searchable/Scanned)
Uses PyMuPDF (fitz) for fast, accurate text extraction with coordinate-based
horizontal line reconstruction to perfectly capture tabular examination results.
"""

import os
from typing import Dict, List, Tuple, Any, Optional
from itertools import groupby
import pymupdf as fitz


class PDFExtractor:
    """
    Extracts text from PDF files and determines whether they are text-searchable
    or scanned raster images requiring OCR.
    """

    # Minimum average characters per page to consider a PDF searchable
    SEARCHABLE_CHAR_THRESHOLD = 50

    def __init__(self, max_file_size_mb: int = 50):
        self.max_file_size_bytes = max_file_size_mb * 1024 * 1024

    def validate_pdf(self, file_path_or_bytes: Any) -> Tuple[bool, str]:
        """
        Validates file integrity, type, and size.
        Returns (is_valid, error_message).
        """
        if isinstance(file_path_or_bytes, str):
            if not os.path.exists(file_path_or_bytes):
                return False, f"File not found: {file_path_or_bytes}"
            file_size = os.path.getsize(file_path_or_bytes)
            if file_size > self.max_file_size_bytes:
                return False, f"File exceeds maximum allowed size of {self.max_file_size_bytes // (1024*1024)}MB"
            try:
                doc = fitz.open(file_path_or_bytes)
                if doc.page_count == 0:
                    doc.close()
                    return False, "PDF contains no pages."
                doc.close()
                return True, "Valid PDF"
            except Exception as e:
                return False, f"Invalid or corrupted PDF file: {str(e)}"
        elif isinstance(file_path_or_bytes, (bytes, bytearray)):
            if len(file_path_or_bytes) > self.max_file_size_bytes:
                return False, f"File exceeds maximum allowed size of {self.max_file_size_bytes // (1024*1024)}MB"
            try:
                doc = fitz.open(stream=file_path_or_bytes, filetype="pdf")
                if doc.page_count == 0:
                    doc.close()
                    return False, "PDF contains no pages."
                doc.close()
                return True, "Valid PDF"
            except Exception as e:
                return False, f"Invalid or corrupted PDF stream: {str(e)}"
        else:
            return False, "Unsupported input type. Provide file path or bytes."

    def detect_searchability(self, doc: fitz.Document, sample_pages: int = 5) -> Tuple[bool, Dict[str, Any]]:
        """
        Automatically detects whether the PDF has an extractable text layer.
        Samples the first N pages and calculates text density vs image presence.
        """
        total_pages = doc.page_count
        pages_to_check = min(sample_pages, total_pages)
        total_chars = 0
        pages_with_text = 0
        pages_with_images = 0

        page_stats = []
        for i in range(pages_to_check):
            page = doc[i]
            text = page.get_text("text").strip()
            char_count = len(text)
            total_chars += char_count
            image_list = page.get_images(full=True)
            has_images = len(image_list) > 0

            if char_count >= self.SEARCHABLE_CHAR_THRESHOLD:
                pages_with_text += 1
            if has_images:
                pages_with_images += 1

            page_stats.append({
                "page": i + 1,
                "char_count": char_count,
                "image_count": len(image_list),
                "has_text": char_count >= self.SEARCHABLE_CHAR_THRESHOLD
            })

        avg_chars = total_chars / max(1, pages_to_check)
        # Searchable if the majority of checked pages have sufficient text density
        is_searchable = pages_with_text >= (pages_to_check / 2.0) and avg_chars >= self.SEARCHABLE_CHAR_THRESHOLD

        detection_info = {
            "is_searchable": is_searchable,
            "total_pages": total_pages,
            "sampled_pages": pages_to_check,
            "avg_chars_per_page": round(avg_chars, 2),
            "pages_with_text": pages_with_text,
            "pages_with_images": pages_with_images,
            "page_stats": page_stats,
            "extraction_method": "direct_text_layer" if is_searchable else "ocr_required"
        }

        return is_searchable, detection_info

    def extract_text_layer(self, doc: fitz.Document) -> List[Dict[str, Any]]:
        """
        Extracts structured lines from a searchable PDF.
        Uses coordinate-based horizontal word grouping (spatial reading order)
        to reconstruct table rows with high fidelity.
        """
        pages_data = []

        for page_num in range(doc.page_count):
            page = doc[page_num]
            raw_text = page.get_text("text")

            # Extract words with coordinates: (x0, y0, x1, y1, word, block_no, line_no, word_no)
            words = page.get_text("words")
            structured_lines = []

            if words:
                # Group words that share the same horizontal baseline (within tolerance of 6 points)
                # Sort primarily by vertical Y coordinate, then by horizontal X coordinate
                words_sorted = sorted(words, key=lambda w: (round(w[1] / 6.0) * 6.0, w[0]))
                for _, group in groupby(words_sorted, key=lambda w: round(w[1] / 6.0) * 6.0):
                    line_words = list(group)
                    # Sort left to right
                    line_words.sort(key=lambda w: w[0])
                    assembled_line = " ".join([w[4] for w in line_words]).strip()
                    if assembled_line:
                        structured_lines.append(assembled_line)
            else:
                # Fallback to plain text splitlines if word extraction yielded nothing
                for line in raw_text.splitlines():
                    clean_l = line.strip()
                    if clean_l:
                        structured_lines.append(clean_l)

            pages_data.append({
                "page_number": page_num + 1,
                "raw_text": raw_text,
                "lines": structured_lines,
                "char_count": len(raw_text)
            })

        return pages_data

    def process(self, file_path_or_bytes: Any) -> Dict[str, Any]:
        """
        Main entry point for PDF text extraction.
        Validates the PDF, detects if searchable or scanned, and extracts text if searchable.
        """
        is_valid, msg = self.validate_pdf(file_path_or_bytes)
        if not is_valid:
            return {
                "success": False,
                "error": msg,
                "is_searchable": False,
                "pages": []
            }

        doc = None
        try:
            if isinstance(file_path_or_bytes, str):
                doc = fitz.open(file_path_or_bytes)
            else:
                doc = fitz.open(stream=file_path_or_bytes, filetype="pdf")

            is_searchable, detection_info = self.detect_searchability(doc)

            extracted_pages = []
            if is_searchable:
                extracted_pages = self.extract_text_layer(doc)

            return {
                "success": True,
                "is_searchable": is_searchable,
                "detection_info": detection_info,
                "total_pages": doc.page_count,
                "pages": extracted_pages
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Extraction failed: {str(e)}",
                "is_searchable": False,
                "pages": []
            }
        finally:
            if doc:
                doc.close()
