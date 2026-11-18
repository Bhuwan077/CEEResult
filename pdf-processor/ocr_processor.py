"""
OCR Processing Engine for Scanned / Non-Searchable CEE Result PDFs
Converts PDF pages to high-resolution raster images and runs Tesseract OCR.
Calculates word/line-level confidence scores to flag uncertain extractions for admin verification.
Includes fallback simulation engine for development environments lacking native Tesseract binaries.
"""

import os
import shutil
import io
import re
from typing import Dict, List, Any, Optional, Tuple
from PIL import Image, ImageEnhance, ImageFilter
import pymupdf as fitz
import pytesseract
from pytesseract import Output


class OCRProcessor:
    """
    Robust OCR pipeline for scanned CEE result sheets.
    Supports image preprocessing (contrast enhancement, binarization, noise removal),
    coordinate-based line extraction, and confidence calculation.
    """

    # Common Tesseract paths on Windows & Linux
    STANDARD_TESSERACT_PATHS = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"C:\Users\MSI\AppData\Local\Programs\Tesseract-OCR\tesseract.exe",
        "/usr/bin/tesseract",
        "/usr/local/bin/tesseract"
    ]

    CONFIDENCE_THRESHOLD = 75.0  # Flag records below 75% OCR confidence

    def __init__(self, tesseract_cmd: Optional[str] = None):
        self.tesseract_available = False
        self._init_tesseract(tesseract_cmd)

    def _init_tesseract(self, explicit_cmd: Optional[str] = None):
        """Locates and configures the Tesseract binary."""
        if explicit_cmd and os.path.exists(explicit_cmd):
            pytesseract.pytesseract.tesseract_cmd = explicit_cmd
            self.tesseract_available = True
            return

        which_tess = shutil.which("tesseract")
        if which_tess:
            pytesseract.pytesseract.tesseract_cmd = which_tess
            self.tesseract_available = True
            return

        for path in self.STANDARD_TESSERACT_PATHS:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                self.tesseract_available = True
                return

        self.tesseract_available = False

    def is_available(self) -> bool:
        """Returns True if Tesseract OCR binary is ready for execution."""
        return self.tesseract_available

    def preprocess_image(self, pil_image: Image.Image) -> Image.Image:
        """
        Preprocesses scanned page image to maximize OCR recognition accuracy:
        - Converts to Grayscale
        - Increases contrast
        - Applies mild sharpening
        """
        gray = pil_image.convert("L")
        enhancer = ImageEnhance.Contrast(gray)
        enhanced = enhancer.enhance(1.8)
        sharpened = enhanced.filter(ImageFilter.SHARPEN)
        return sharpened

    def render_pdf_page_to_image(self, page: fitz.Page, dpi: int = 300) -> Image.Image:
        """
        Renders a PyMuPDF page into a high-DPI PIL Image for optimal OCR clarity.
        """
        pix = page.get_pixmap(dpi=dpi)
        img_bytes = pix.tobytes("png")
        return Image.open(io.BytesIO(img_bytes))

    def ocr_page(self, pil_image: Image.Image, page_num: int = 1) -> Dict[str, Any]:
        """
        Performs OCR on a PIL image and extracts text, line groupings,
        and per-line confidence scores.
        """
        if not self.tesseract_available:
            # Development fallback simulation: allows testing the review & flag workflow
            # without requiring local machine C:\ root admin rights
            return self._simulate_ocr_for_dev(pil_image, page_num)

        try:
            preprocessed = self.preprocess_image(pil_image)
            custom_config = r'--oem 3 --psm 6'
            
            data = pytesseract.image_to_data(preprocessed, config=custom_config, output_type=Output.DICT)
            lines_data = self._reconstruct_lines_with_confidence(data)
            
            total_words = 0
            sum_conf = 0.0
            for item in lines_data:
                for conf in item["word_confidences"]:
                    if conf > 0:
                        sum_conf += conf
                        total_words += 1
                        
            avg_confidence = (sum_conf / max(1, total_words)) if total_words > 0 else 0.0
            raw_text = "\n".join([item["line_text"] for item in lines_data])

            return {
                "success": True,
                "page_number": page_num,
                "raw_text": raw_text,
                "lines": [item["line_text"] for item in lines_data],
                "detailed_lines": lines_data,
                "avg_confidence": round(avg_confidence, 2),
                "is_low_confidence": avg_confidence < self.CONFIDENCE_THRESHOLD,
                "is_simulated": False
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"OCR failed for page {page_num}: {str(e)}",
                "page_number": page_num,
                "lines": [],
                "avg_confidence": 0.0,
                "is_simulated": False
            }

    def _simulate_ocr_for_dev(self, pil_image: Image.Image, page_num: int) -> Dict[str, Any]:
        """
        Development fallback: when Tesseract binary is not installed on the local developer machine,
        simulates OCR extraction with realistic OCR noise and low-confidence flags so that
        the administrative review modal and manual verification workflow can be fully exercised.
        """
        simulated_lines = [
            "GOVERNMENT OF NEPAL MEDICAL EDUCATION COMMISSION",
            "COMMON ENTRANCE EXAMINATION (MECEE-BL 2024)",
            "SN Roll No Candidate Name Score Merit Rank Status Category",
            "1 00101 Aarav Sharma 186.75 1 Qualified Open",
            "2 00102 Bibek Thapa 184.50 2 Qualified Open",
            "3 00103 Pooja Karki 182.00 3 Qualified Female Quota",
            "4 00104 Rohan Shrestha 180.25 4 Qualified Janajati",
            "5 00105 Samikshya Adhikari 179.00 5 Qualified Female Quota",
            "6 00204 Deepak Chaudhary 172.50 12 Qualified Tharu Quota",
            "7 00318 Kritika Joshi 168.00 25 Qualified Open",
            # Simulated OCR artifact line to test the admin review flag
            "8 00452 Pr@shant Dahal 161.75 48 Qualified Open",
            "9 00789 Suman Tamang 153.25 105 Qualified Janajati",
            "10 01053 Anjali Yadav 145.00 210 Qualified Madhesi Quota",
            "15 05999 Bikash Rana 84.50 - Not Qualified Open"
        ]

        return {
            "success": True,
            "page_number": page_num,
            "raw_text": "\n".join(simulated_lines),
            "lines": simulated_lines,
            "detailed_lines": [],
            "avg_confidence": 76.5,
            "is_low_confidence": True,
            "is_simulated": True,
            "notice": "Processed using development OCR fallback simulation. In production, configure native Tesseract binary."
        }

    def _reconstruct_lines_with_confidence(self, data: Dict[str, List]) -> List[Dict[str, Any]]:
        """
        Groups OCR words into visual lines and aggregates confidence scores.
        """
        lines_by_key: Dict[Tuple[int, int, int], List[Dict[str, Any]]] = {}
        
        n_boxes = len(data['text'])
        for i in range(n_boxes):
            text = data['text'][i].strip()
            conf = float(data['conf'][i])
            if not text:
                continue
            
            block_num = data['block_num'][i]
            par_num = data['par_num'][i]
            line_num = data['line_num'][i]
            key = (block_num, par_num, line_num)
            
            if key not in lines_by_key:
                lines_by_key[key] = []
                
            lines_by_key[key].append({
                "word": text,
                "conf": conf,
                "left": data['left'][i],
                "top": data['top'][i],
                "width": data['width'][i],
                "height": data['height'][i]
            })

        structured_lines = []
        for key, words in lines_by_key.items():
            line_text = " ".join([w["word"] for w in words])
            valid_confs = [w["conf"] for w in words if w["conf"] >= 0]
            avg_conf = sum(valid_confs) / max(1, len(valid_confs)) if valid_confs else 0.0
            
            structured_lines.append({
                "line_text": line_text,
                "avg_confidence": round(avg_conf, 2),
                "word_confidences": valid_confs,
                "has_low_confidence": any(c < self.CONFIDENCE_THRESHOLD for c in valid_confs),
                "words": words
            })

        return structured_lines

    def process_scanned_pdf(self, file_path_or_bytes: Any, dpi: int = 300) -> Dict[str, Any]:
        """
        Renders all pages of a scanned PDF and executes OCR on each page.
        """
        doc = None
        try:
            if isinstance(file_path_or_bytes, str):
                doc = fitz.open(file_path_or_bytes)
            else:
                doc = fitz.open(stream=file_path_or_bytes, filetype="pdf")

            pages_results = []
            overall_sum_conf = 0.0
            pages_processed = 0

            for page_idx in range(doc.page_count):
                page = doc[page_idx]
                img = self.render_pdf_page_to_image(page, dpi=dpi)
                res = self.ocr_page(img, page_num=page_idx + 1)
                pages_results.append(res)
                if res["success"]:
                    overall_sum_conf += res["avg_confidence"]
                    pages_processed += 1

            doc.close()

            overall_avg_conf = (overall_sum_conf / max(1, pages_processed)) if pages_processed > 0 else 0.0

            return {
                "success": pages_processed > 0,
                "total_pages": len(pages_results),
                "pages": pages_results,
                "overall_confidence": round(overall_avg_conf, 2),
                "requires_manual_review": overall_avg_conf < self.CONFIDENCE_THRESHOLD or not self.tesseract_available,
                "tesseract_available": self.tesseract_available
            }
        except Exception as e:
            if doc:
                doc.close()
            return {
                "success": False,
                "error": f"Failed to process scanned PDF: {str(e)}",
                "total_pages": 0,
                "pages": [],
                "overall_confidence": 0.0,
                "requires_manual_review": True,
                "tesseract_available": self.tesseract_available
            }
