# Free-Tier Deployment Guide: Nepal CEE Result Checker

This guide outlines step-by-step instructions for deploying the CEE Result Checker application across **Vercel** (Frontend), **Render** (Backend), and **Supabase** (Database).

---

## 1. Database Setup: Supabase (PostgreSQL)

1. Create a free account at [supabase.com](https://supabase.com).
2. Create a new project (e.g. `cee-result-nepal`) in the Singapore or Mumbai region for low latency to Nepal.
3. Open the **SQL Editor** in the Supabase Dashboard.
4. Execute `backend/migrations/001_initial_schema.sql` to create:
   - `examinations`, `students`, and `admins` tables.
   - B-Tree indexes on `symbol_number` and `examination_id`.
   - Row-Level Security (RLS) policies allowing public read access ONLY to published examinations.
   - `search_student_result` stored procedure.
5. (Optional) Execute `backend/migrations/002_sample_data.sql` to populate realistic test data for verification.
6. Note down your **Project URL**, **Anon Key**, and **Service Role Key** under `Project Settings > API`.

---

## 2. Backend Setup: Render (Python / FastAPI)

1. Sign up at [render.com](https://render.com).
2. Create a **New Web Service** and link your Git repository.
3. Configure the service settings:
   - **Root Directory:** `backend`
   - **Environment:** `Python`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
4. **Environment Variables on Render:**
   | Key | Example Value |
   |---|---|
   | `SUPABASE_URL` | `https://your-proj.supabase.co` |
   | `SUPABASE_KEY` | `<your-supabase-anon-key>` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `<your-service-role-key>` |
   | `JWT_SECRET` | `<random-64-character-hex-string>` |
   | `DEFAULT_ADMIN_USERNAME` | `admin` |
   | `DEFAULT_ADMIN_PASSWORD` | `<secure-custom-password>` |
   | `SEARCH_RATE_LIMIT_PER_MINUTE`| `60` |

### Adding Tesseract to Render (Docker Deployment Option)
For non-searchable scanned PDF OCR in Render, deploy as a **Docker** service using the included `backend/Dockerfile`:
```dockerfile
FROM python:3.12-slim
RUN apt-get update && apt-get install -y tesseract-ocr libtesseract-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 3. Frontend Setup: Vercel (React / Vite)

1. Sign up at [vercel.com](https://vercel.com).
2. Click **Add New Project** and select your GitHub repository.
3. Configure project settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables on Vercel:**
   | Key | Example Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://cee-result-backend.onrender.com` |
5. Click **Deploy**. Vercel will build and deploy the application globally across edge CDNs.
