# CEE Result Checker Nepal

A production-ready, responsive web application for checking and managing **Common Entrance Examination (CEE)** results conducted in Nepal (by the Medical Education Commission - MEC).

Designed for high reliability, strict data integrity (preserving exact leading zeros), dual-pipeline PDF ingestion (both searchable digital PDFs and scanned image PDFs with OCR), and administrative human-in-the-loop verification.

---

## 🌟 Key Features

### 1. Student Interface
- **Mobile-First & Android Optimized:** Responsive layout with clean white/navy blue educational palette (`#0f2942`).
- **Exact Leading-Zero Preservation:** Queries like `00101` or `01053` strictly preserve leading zeros without integer truncation.
- **Accurate Merit Scorecard:** Shows Candidate Name, Merit Rank, Obtained Score (/200), Pass/Fail Status, Program, Reservation Quota, and Counseling Remarks.
- **One-Click Printable Slip:** Dedicated print stylesheet for students to save or print their official verification scorecard.
- **Quick Demo Chips:** Single-tap sample numbers (`00101`, `00102`, `00204`, `05999`, `10101`) for instant testing.

### 2. Dual PDF Ingestion & OCR Pipeline
- **Auto-Detects Searchability:** Automatically checks whether an uploaded PDF contains a digital vector text layer or requires OCR.
- **PyMuPDF Spatial Reading Order:** Solves table scrambling by sorting words along horizontal baselines to reconstruct tabular rows.
- **Tesseract OCR (300 DPI):** Converts non-searchable or scanned physical pages into high-resolution images, enhances contrast, and extracts text with confidence metrics.
- **Anomaly & Confidence Flags:** Flags records with OCR confidence below 80%, unexpected characters in names (`@`, `#`), or duplicate symbol numbers.
- **Human Verification Guardrail:** Low-confidence records are held in a `reviewing` state. Results are **never** silently published without administrator approval.

### 3. Administrative Console
- **Secure JWT Authentication:** Passwords hashed with `bcrypt`.
- **In-Place Record Reviewer:** Paginated table allowing controllers to inspect flagged records side-by-side with the uploaded PDF, edit typos, and approve records.
- **Publication Gating:** Toggle datasets between `Draft`, `Reviewing`, and `Published`. Public search endpoints can **only** query published examinations.
- **Dataset Management:** Create datasets per academic program (MBBS, BDS, B.Sc Nursing, BAMS, Allied) and year.

---

## 📁 Repository Structure

```
cee-nepal/
├── frontend/                     # React 18 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── admin/                # Admin Console (Login, Dashboard, Uploader, Reviewer)
│   │   ├── components/           # UI Components (Navbar, Footer, SearchCard, ResultCard)
│   │   ├── hooks/                # Custom React Hooks (useAuth, useSearch)
│   │   ├── pages/                # Student Pages (Home, ResultDetail, About, Privacy)
│   │   ├── services/             # API Client & Auth Session Management
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/                      # Python 3.12 + FastAPI Backend
│   ├── app/
│   │   ├── auth.py               # Bcrypt hashing & JWT verification
│   │   ├── config.py             # Pydantic Settings
│   │   ├── database.py           # Unified Data Store (Supabase + In-Memory Fallback)
│   │   ├── main.py               # FastAPI entrypoint, CORS, static mounts
│   │   ├── models.py             # Pydantic request/response schemas
│   │   ├── routes/
│   │   │   ├── admin.py          # Admin endpoints (Upload, Review, Publish, Delete)
│   │   │   ├── examinations.py   # Public examination listings
│   │   │   └── search.py         # Rate-limited symbol number search
│   │   └── utils/
│   │       ├── rate_limiter.py   # Sliding-window IP rate limiter
│   │       └── security.py       # File sanitization & validation
│   ├── migrations/
│   │   ├── 001_initial_schema.sql # PostgreSQL schema, RLS policies, indexes
│   │   └── 002_sample_data.sql   # Realistic fictional test data
│   ├── supabase/
│   │   └── functions/
│   │       └── search-results/   # Supabase Edge Function (Deno)
│   ├── Dockerfile
│   └── requirements.txt
│
├── pdf-processor/                # Core PDF Ingestion & OCR Pipeline
│   ├── extract_text.py           # Searchability detection & PyMuPDF extractor
│   ├── ocr_processor.py          # Tesseract OCR & Confidence scoring
│   ├── parser.py                 # Adaptive CEE layout & regex table parser
│   ├── validator.py              # Leading-zero normalizer & duplicate detector
│   ├── export_results.py         # JSON/CSV/PostgreSQL exporter
│   └── pipeline.py               # Unified end-to-end processing orchestrator
│
├── sample-data/
│   ├── generate_sample_pdfs.py   # Script to generate sample CEE PDFs
│   ├── sample_cee_result_searchable.pdf # Digital text-based CEE PDF
│   └── sample_cee_result_scanned.pdf    # Rasterized scanned CEE PDF
│
├── docs/                         # Architecture, API & Deployment Documentation
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_SCHEMA.md
│   ├── OCR_PIPELINE.md
│   └── DEPLOYMENT_GUIDE.md
│
├── .env.example
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm

### 2. Backend Setup
```bash
cd cee-nepal/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API will be accessible at: `http://localhost:8000`
- Interactive API Docs: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd cee-nepal/frontend
npm install
npm run dev
```
- Web Application will be live at: `http://localhost:5173`

### 4. Admin Login Credentials
- **Username:** `admin`
- **Password:** `Admin@CEE2024`

---

## 🧪 Testing the Dual PDF Processing Pipeline

You can generate fresh fictional sample PDFs and test both extraction pathways:
```bash
# 1. Generate sample searchable and scanned PDFs
python cee-nepal/sample-data/generate_sample_pdfs.py

# 2. Run the automated test verification script
python cee-nepal/pdf-processor/test_pipeline.py
```

### Demonstration Symbol Numbers (Fictional Data)
| Symbol Number | Candidate Name | Score | Rank | Status | Category |
|---|---|---|---|---|---|
| `00101` | Aarav Sharma | 186.75 | #1 | Qualified | Open |
| `00102` | Bibek Thapa | 184.50 | #2 | Qualified | Open |
| `00103` | Pooja Karki | 182.00 | #3 | Qualified | Female Quota |
| `00204` | Deepak Chaudhary | 172.50 | #12 | Qualified | Tharu Quota |
| `01053` | Anjali Yadav | 145.00 | #210 | Qualified | Madhesi Quota |
| `05999` | Bikash Rana | 84.50 | - | Not Qualified | Open |
| `10101` | Dipika Pokhrel | 175.00 | #1 | Qualified | B.Sc Nursing |

---

## 🔒 Security & Performance Features
- **SQL Injection Prevention:** Strictly parameterized SQL queries and Supabase RPC functions.
- **Row-Level Security (RLS):** Prevents anonymous public users from viewing unpublished or draft results.
- **Sliding-Window Rate Limiter:** Protects public search endpoints (60 req/min/IP).
- **Audit Preservation:** Original uploaded PDFs are archived on disk for administrative verification.
- **Immutable String Identifiers:** Symbol numbers are never coerced to numbers, preventing leading-zero drop bugs.

---

## 📜 Disclaimer
This application is an independent result verification platform built for Nepal CEE entrance candidates. All sample data included in the repository is strictly fictional and intended for system development and testing. Official examination results are gazetted by the Medical Education Commission (MEC), Nepal.
