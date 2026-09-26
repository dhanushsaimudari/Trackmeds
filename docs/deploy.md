# TRACKMEDS — Production & Git Deployment Guide

This guide provides end-to-end instructions for deploying TRACKMEDS across various production environments: **Google Cloud Run**, **Vercel**, **Docker Compose**, and **Linux Virtual Private Servers (VPS)**.

---

## 📋 Table of Contents
1. [Git Repository Setup & Pre-Flight Checklist](#1-git-repository-setup--pre-flight-checklist)
2. [Environment Variables & Secrets Reference](#2-environment-variables--secrets-reference)
3. [Deployment Option A: Docker Compose (Fastest Full-Stack)](#3-deployment-option-a-docker-compose-fastest-full-stack)
4. [Deployment Option B: Google Cloud Run + Firebase Hosting](#4-deployment-option-b-google-cloud-run--firebase-hosting)
5. [Deployment Option C: Vercel (One-Click Serverless Deploy)](#5-deployment-option-c-vercel-one-click-serverless-deploy)
6. [Deployment Option D: Linux VPS (Ubuntu / Nginx / Systemd)](#6-deployment-option-d-linux-vps-ubuntu--nginx--systemd)
7. [Database Setup: SQLite vs PostgreSQL](#7-database-setup-sqlite-vs-postgresql)
8. [Post-Deployment Smoke Test & Verification](#8-post-deployment-smoke-test--verification)

---

## 1. Git Repository Setup & Pre-Flight Checklist

Before pushing to your remote Git repository (GitHub / GitLab):

1. **Verify `.gitignore` protects secrets**:
   Ensure `.env`, `*.db`, `pytest-cache-*`, `node_modules/`, and service account keys are NOT committed:
   ```bash
   git status
   ```
2. **Execute Full Automated Test Suite**:
   Ensure all 42 backend regression & security tests pass:
   ```bash
   cd backend
   python -m pytest tests/ -v -p no:cacheprovider
   # Output: 42 passed, 0 failed
   ```
3. **Verify Frontend Build**:
   ```bash
   cd frontend
   npm run build
   # Output: dist/ generated without TypeScript or bundling errors
   ```

---

## 2. Environment Variables & Secrets Reference

Create `.env` using `.env.example` as a template:

| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `SECRET_KEY` | **Yes (Prod)** | `replace-with-a-32char-random-secret` | Cryptographic secret for signing JWT auth tokens. |
| `ENVIRONMENT` | No | `production` (or `development`) | Toggles debug mode and relaxed CORS rules. |
| `PORT` | No | `8000` | Port listened to by backend (dynamically provided by Cloud Run / Render). |
| `DATABASE_URL` | No | `sqlite:///./trackmeds.db` | Database connection string. Use `postgresql://user:pass@host:5432/trackmeds` for PostgreSQL. |
| `GEMINI_API_KEY` | Optional | `AIzaSy...` | Google GenAI API key for Gemini 3.6 Flash. If omitted, deterministic clinical fallback is used. |
| `WEATHER_API_KEY`| Optional | `openweather-key-here` | OpenWeatherMap API key. If omitted, regional monsoon/heatwave telemetry is simulated. |
| `ALLOWED_ORIGINS`| Optional | `https://your-domain.com,https://trackmeds.web.app` | Comma-separated list of trusted CORS frontend origins. |
| `VITE_API_BASE_URL` | Frontend | `http://localhost:8000` (or `https://api.yourdomain.com`) | REST API URL accessed by frontend browser code. |

---

## 3. Deployment Option A: Docker Compose (Fastest Full-Stack)

With Docker and Docker Compose installed:

```bash
# 1. Clone repository
git clone https://github.com/dhanushsaimudari/Trackmeds.git
cd Trackmeds

# 2. Configure production environment
cp .env.example .env
# Edit .env with your SECRET_KEY and optional GEMINI_API_KEY

# 3. Build and launch all containers
docker compose up -d --build

# 4. Check container health
docker compose ps
```

- **Frontend Application**: Accessible at `http://your-server-ip:80` (or `http://localhost:80`)
- **Backend API**: Accessible at `http://your-server-ip:8000/api/docs`
- **Health Check**: `curl http://localhost:8000/api/health`

To stop containers:
```bash
docker compose down
```

---

## 4. Deployment Option B: Google Cloud Run + Firebase Hosting

### Step 1: Deploy Backend to Google Cloud Run

```bash
# 1. Set Google Cloud project
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com

# 2. Create Artifact Registry repository
gcloud artifacts repositories create trackmeds-repo \
  --repository-format=docker \
  --location=asia-south1 \
  --description="TrackMeds Docker Repository"

# 3. Build backend container using Cloud Build
cd backend
gcloud builds submit --tag asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/trackmeds-repo/trackmeds-backend:latest .

# 4. Store secrets in Secret Manager
echo -n "YOUR_LONG_SECURE_JWT_SECRET" | gcloud secrets create trackmeds-secret-key --data-file=-
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create trackmeds-gemini-key --data-file=-

# 5. Deploy to Cloud Run
gcloud run deploy trackmeds-backend \
  --image asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/trackmeds-repo/trackmeds-backend:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 8000 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars="ENVIRONMENT=production,ALLOWED_ORIGINS=https://trackmeds-health.web.app" \
  --set-secrets="SECRET_KEY=trackmeds-secret-key:latest,GEMINI_API_KEY=trackmeds-gemini-key:latest"
```

Note the output URL: e.g., `https://trackmeds-backend-xxxxx-el.a.run.app`.

### Step 2: Deploy Frontend to Firebase Hosting

```bash
cd ../frontend

# Set production API URL
export VITE_API_BASE_URL="https://trackmeds-backend-xxxxx-el.a.run.app"

# Build production bundle
npm ci
npm run build

# Deploy via Firebase CLI
npm install -g firebase-tools
firebase login
firebase deploy --only hosting
```

---

## 5. Deployment Option C: Vercel (One-Click Serverless Deploy)

The repository includes a root `vercel.json` configured with `@vercel/python` for the backend API and `@vercel/static-build` for the React frontend:

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/), click **Add New Project** and import the `Trackmeds` repository.
3. Configure Environment Variables in the Vercel project settings:
   - `SECRET_KEY`: Random 32+ character string.
   - `GEMINI_API_KEY`: Your Google GenAI key.
   - `ENVIRONMENT`: `production`
4. Click **Deploy**.
   - Vercel automatically builds `frontend/` into static assets and routes `/api/*` to `api/index.py` (FastAPI backend).

---

## 6. Deployment Option D: Linux VPS (Ubuntu / Nginx / Systemd)

### 1. Install System Dependencies
```bash
sudo apt update && sudo apt install -y python3-pip python3-venv nginx git
```

### 2. Setup Backend Systemd Service
```bash
cd /var/www
sudo git clone https://github.com/dhanushsaimudari/Trackmeds.git
cd Trackmeds/backend

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.seed
```

Create `/etc/systemd/system/trackmeds.service`:
```ini
[Unit]
Description=TRACKMEDS FastAPI Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/Trackmeds/backend
EnvironmentFile=/var/www/Trackmeds/backend/.env
ExecStart=/var/www/Trackmeds/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable trackmeds
sudo systemctl start trackmeds
```

### 3. Build Frontend & Setup Nginx
```bash
cd /var/www/Trackmeds/frontend
npm ci
npm run build
```

Configure `/etc/nginx/sites-available/trackmeds`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/Trackmeds/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/trackmeds /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 7. Database Setup: SQLite vs PostgreSQL

- **Default (SQLite)**: TRACKMEDS defaults to `sqlite:///./trackmeds.db`. Ideal for single-node deployments, demos, and rapid provisioning.
- **Production (PostgreSQL)**:
  1. Spin up a Managed PostgreSQL instance (Google Cloud SQL, AWS RDS, Supabase, or ElephantSQL).
  2. Set `DATABASE_URL` in `.env`:
     ```
     DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@db-host:5432/trackmeds
     ```
  3. Ensure `psycopg2-binary` or `asyncpg` is installed:
     ```bash
     pip install psycopg2-binary
     ```
  4. Run initial seeding:
     ```bash
     python -m app.seed
     ```

---

## 8. Post-Deployment Smoke Test & Verification

Once deployed, run these 3 quick checks:

```bash
# 1. Health check endpoint
curl -X GET https://your-domain.com/api/health
# Expected: {"status":"ok","version":"2.1.0","app":"TrackMeds Emergency Medicine Resilience Platform"}

# 2. Verify Database & Facilities Endpoint
curl -X GET https://your-domain.com/api/facilities
# Expected: JSON array containing 17 seeded Indian healthcare facilities (PHCs, CHCs, DHs)

# 3. Verify Gemini 3.6 Flash / Fallback AI Copilot
curl -X POST https://your-domain.com/api/ai/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"Why is ORS demand increasing in Maharashtra?","country":"India"}'
# Expected: Grounded clinical/monsoon analysis citing waterborne surge without repetitive generic templates
```
