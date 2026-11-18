"""
Generates realistic Sample CEE Result PDFs for testing:
1. Searchable PDF (text layer with PyMuPDF/reportlab)
2. Non-searchable PDF (Scanned image-only PDF)
All data is clearly marked as FICTIONAL TEST DATA.
"""

import os
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import fitz  # PyMuPDF


# Fictional Test Students
SAMPLE_STUDENTS = [
    {"sn": "1", "symbol": "00101", "name": "Aarav Sharma", "score": "186.75", "rank": "1", "status": "Qualified", "cat": "Open"},
    {"sn": "2", "symbol": "00102", "name": "Bibek Thapa", "score": "184.50", "rank": "2", "status": "Qualified", "cat": "Open"},
    {"sn": "3", "symbol": "00103", "name": "Pooja Karki", "score": "182.00", "rank": "3", "status": "Qualified", "cat": "Female Quota"},
    {"sn": "4", "symbol": "00104", "name": "Rohan Shrestha", "score": "180.25", "rank": "4", "status": "Qualified", "cat": "Janajati"},
    {"sn": "5", "symbol": "00105", "name": "Samikshya Adhikari", "score": "179.00", "rank": "5", "status": "Qualified", "cat": "Female Quota"},
    {"sn": "6", "symbol": "00204", "name": "Deepak Chaudhary", "score": "172.50", "rank": "12", "status": "Qualified", "cat": "Tharu Quota"},
    {"sn": "7", "symbol": "00318", "name": "Kritika Joshi", "score": "168.00", "rank": "25", "status": "Qualified", "cat": "Open"},
    {"sn": "8", "symbol": "00452", "name": "Prashant Dahal", "score": "161.75", "rank": "48", "status": "Qualified", "cat": "Open"},
    {"sn": "9", "symbol": "00789", "name": "Suman Tamang", "score": "153.25", "rank": "105", "status": "Qualified", "cat": "Janajati"},
    {"sn": "10", "symbol": "01053", "name": "Anjali Yadav", "score": "145.00", "rank": "210", "status": "Qualified", "cat": "Madhesi Quota"},
    {"sn": "11", "symbol": "01290", "name": "Nabin Giri", "score": "137.50", "rank": "380", "status": "Qualified", "cat": "Open"},
    {"sn": "12", "symbol": "02341", "name": "Prakash Bishwokarma", "score": "128.00", "rank": "540", "status": "Qualified", "cat": "Dalit Quota"},
    {"sn": "13", "symbol": "03890", "name": "Ramesh Bahadur Malla", "score": "112.50", "rank": "890", "status": "Qualified", "cat": "Backward Reg"},
    {"sn": "14", "symbol": "04512", "name": "Sunita Gurung", "score": "101.00", "rank": "1240", "status": "Qualified", "cat": "Janajati"},
    {"sn": "15", "symbol": "05999", "name": "Bikash Rana", "score": "84.50", "rank": "-", "status": "Not Qualified", "cat": "Open"}
]


def create_searchable_pdf(output_path: str):
    """Generates an authentic looking text-based (searchable) CEE result PDF."""
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        alignment=1,  # Center
        textColor=colors.HexColor('#0f2942')
    )

    sub_style = ParagraphStyle(
        'HeaderSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        alignment=1,
        textColor=colors.HexColor('#334155')
    )

    fictional_banner = ParagraphStyle(
        'Banner',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        alignment=1,
        textColor=colors.HexColor('#dc2626')
    )

    elements = []

    # Official-style Header
    elements.append(Paragraph("GOVERNMENT OF NEPAL", title_style))
    elements.append(Paragraph("MEDICAL EDUCATION COMMISSION", title_style))
    elements.append(Paragraph("DIRECTORATE OF EXAMINATION - SANOTHIMI, BHAKTAPUR", sub_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("COMMON ENTRANCE EXAMINATION (MECEE-BL 2024)", title_style))
    elements.append(Paragraph("MERIT LIST - PROGRAM: MBBS / BDS", sub_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("*** FICTIONAL TEST DATA - FOR SYSTEM TESTING ONLY ***", fictional_banner))
    elements.append(Spacer(1, 10))

    # Table Data
    table_data = [
        ["SN", "Roll No", "Candidate Name", "Score", "Merit Rank", "Status", "Category"]
    ]

    for s in SAMPLE_STUDENTS:
        table_data.append([
            s["sn"],
            s["symbol"],
            s["name"],
            s["score"],
            s["rank"],
            s["status"],
            s["cat"]
        ])

    table = Table(table_data, colWidths=[35, 60, 180, 55, 65, 80, 75])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f2942')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8.5),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
        ('TOPPADDING', (0, 0), (-1, 0), 5),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (2, 1), (2, -1), 'LEFT'),  # Candidate name left-aligned
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 15))
    elements.append(Paragraph("Note: Minimum qualifying score for MBBS/BDS entrance is 50th percentile (100.00 marks).", sub_style))

    doc.build(elements)
    print(f"[OK] Generated searchable PDF: {output_path}")


def create_scanned_pdf(searchable_pdf_path: str, output_path: str):
    """
    Renders the searchable PDF pages into raster bitmap images,
    adds subtle noise/scan effects, and packages into an image-only (non-searchable) PDF.
    """
    src_doc = fitz.open(searchable_pdf_path)
    scanned_doc = fitz.open()

    for page in src_doc:
        # Render high-res bitmap pixmap (200 DPI)
        pix = page.get_pixmap(dpi=200)
        img_bytes = pix.tobytes("png")
        pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # Simulate scanning artifacts: slightly rotate, blur, and slight grayscale contrast
        pil_img = pil_img.rotate(0.3, resample=Image.BICUBIC, expand=False, fillcolor="white")
        pil_img = pil_img.filter(ImageFilter.GaussianBlur(radius=0.3))

        # Convert back to PDF page
        buf = io.BytesIO()
        pil_img.save(buf, format="JPEG", quality=85)
        buf.seek(0)

        # Create a new page in destination PDF with the image
        img_doc = fitz.open(stream=buf.read(), filetype="jpeg")
        rect = page.rect
        new_page = scanned_doc.new_page(width=rect.width, height=rect.height)
        new_page.insert_image(rect, stream=buf.getvalue())
        img_doc.close()

    src_doc.close()
    scanned_doc.save(output_path)
    scanned_doc.close()
    print(f"[OK] Generated scanned (non-searchable) PDF: {output_path}")


if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    searchable_file = os.path.join(out_dir, "sample_cee_result_searchable.pdf")
    scanned_file = os.path.join(out_dir, "sample_cee_result_scanned.pdf")

    create_searchable_pdf(searchable_file)
    create_scanned_pdf(searchable_file, scanned_file)
