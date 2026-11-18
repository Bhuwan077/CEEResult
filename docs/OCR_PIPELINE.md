# OCR & PDF Processing Pipeline Documentation

This document explains the detection, extraction, rasterization, parsing, and validation pipeline used in the **CEE Result Checker Nepal** platform.

---

## 1. Pipeline Stages

```
[ Uploaded PDF ]
       │
       ▼
[ 1. Validate PDF Header & Magic Bytes (%PDF) ]
       │
       ▼
[ 2. Auto-Detect Searchability Layer ]
       ├── Text Density >= 50 chars/page?
       │        ├── YES ──► [ Direct PyMuPDF Vector Extraction ]
       │        │                 └── Spatial Reading Order Reassembly
       │        │
       │        └── NO  ──► [ High-Resolution Rasterization (300 DPI) ]
       │                          └── Preprocessing (Contrast + Sharpening)
       │                          └── Tesseract OCR (PSM 6, OEM 3)
       │                          └── Word & Line-Level Confidence Calculation
       ▼
[ 3. Adaptive Layout Parser ]
       ├── Filter Header/Pagination Noise
       ├── Token Pattern Matching (SN, Symbol, Name, Score, Rank, Status, Quota)
       └── Program Inference (MBBS, BDS, Nursing, BAMS, Allied)
       │
       ▼
[ 4. Validation & Quality Assurance ]
       ├── Normalize Symbol Numbers (String type, preserve leading zeros)
       ├── Validate Score Range (0.00 to 200.00)
       ├── Detect Duplicate Symbol Numbers
       └── Flag Anomalies:
             - Low OCR Confidence (< 80%)
             - Noise characters in names (@, #, digits)
             - Missing mandatory fields
       │
       ▼
[ 5. Staged Review Interface ]
       ├── Human verification & in-place edit
       └── Explicit Admin Confirmation to Publish
```

---

## 2. Technical Details

### Searchability Detection
A PDF is classified as searchable if:
1. PyMuPDF `page.get_text("text")` averages over 50 characters per page across the first 5 pages.
2. The ratio of text-containing pages to total checked pages is greater than 50%.
If text is absent or consists solely of single-letter watermark fragments while page contains large raster images, the pipeline flags the file as **scanned** and triggers the OCR engine.

### Spatial Reading Order Reassembly
Tables in digital PDFs often store text out of visual reading order (e.g. column by column or block by block).
Our extractor extracts raw words with coordinates `(x0, y0, x1, y1)`.
It groups words sharing a horizontal baseline within a vertical threshold of 6 points, and sorts words left-to-right. This reconstructs complete tabular rows regardless of how the table was internally drawn.

### OCR Image Preprocessing
For scanned PDFs, each page is rasterized at **300 DPI**.
1. **Grayscale:** Drops unnecessary color noise while maintaining glyph contrast.
2. **Contrast Enhancement:** `ImageEnhance.Contrast` (factor 1.8) clarifies faint dot-matrix or toner-faded letters.
3. **Sharpening:** Mild convolution filter to crisp up letter edges.

### Confidence Scoring
Tesseract's `image_to_data` outputs per-word confidence (0-100).
- If the average confidence of a line falls below 75%, or if individual candidate names or symbol numbers have confidence below 80%, the record is flagged.
- An alert note is attached: `Low OCR confidence (72.4%)`.
- The administrator can inspect the flagged record side-by-side with the original PDF in the Admin Dashboard.
