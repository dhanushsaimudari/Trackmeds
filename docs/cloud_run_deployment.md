# Google Cloud Run Deployment Guide for TrackMeds

This guide provides step-by-step instructions to build, configure, and deploy the TrackMeds backend and frontend on Google Cloud Run.

---

## 1. Architecture Overview

- **Backend:** Containerized FastAPI application running as a stateless service on Google Cloud Run. Auto-scales from 0 to 10+ instances based on incoming concurrency.
- **Database:** Google Cloud SQL (PostgreSQL) or Google Cloud Firestore / Spanner. For standard SQL, configure `DATABASE_URL` with Cloud SQL Auth Proxy.
- **Frontend:** Static SPA built with Vite and deployed either to Firebase Hosting / Cloud Storage + Cloud CDN or a lightweight NGINX Cloud Run container.
- **Authentication:** Firebase Authentication / Google Identity Platform with backend JWT verification.
- **Secrets:** Google Cloud Secret Manager for sensitive environment variables (`SECRET_KEY`, `GEMINI_API_KEY`, Firebase Service Account).

---

## 2. Prerequisites

1. **Google Cloud SDK (`gcloud` CLI):**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
2. **Artifact Registry / Container Registry API enabled:**
   ```bash
   gcloud services enable \
     run.googleapis.com \
     artifactregistry.googleapis.com \
     cloudbuild.googleapis.com \
     secretmanager.googleapis.com
   ```
3. **Artifact Registry Repository:**
   ```bash
   gcloud artifacts repositories create trackmeds-repo \
     --repository-format=docker \
     --location=asia-south1 \
     --description="TrackMeds Docker Repository"
   ```

---

## 3. Secret Management Configuration

Store sensitive secrets in Secret Manager rather than baking them into images:

```bash
# 1. Backend Session/JWT Secret Key
gcloud secrets create trackmeds-secret-key --replication-policy="automatic"
echo -n "YOUR_SECURE_RANDOM_SECRET_KEY" | gcloud secrets versions add trackmeds-secret-key --data-file=-

# 2. Gemini API Key
gcloud secrets create trackmeds-gemini-api-key --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add trackmeds-gemini-api-key --data-file=-

# 3. Firebase Service Account JSON (Optional for Firebase Admin SDK)
gcloud secrets create trackmeds-firebase-sa --replication-policy="automatic"
gcloud secrets versions add trackmeds-firebase-sa --data-file=serviceAccountKey.json
```

---

## 4. Build and Deploy Backend Container

### Option A: Direct Build and Deploy with Google Cloud Build

From the `backend/` folder:

```bash
cd backend

# Submit build to Google Cloud Build
gcloud builds submit --tag asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/trackmeds-repo/trackmeds-backend:latest .

# Deploy to Cloud Run with Secret References & IAM Configuration
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
  --set-env-vars="ENVIRONMENT=production,FIREBASE_PROJECT_ID=trackmeds-health,ALLOWED_ORIGINS=https://trackmeds.web.app" \
  --set-secrets="SECRET_KEY=trackmeds-secret-key:latest,GEMINI_API_KEY=trackmeds-gemini-api-key:latest"
```

---

## 5. Frontend Deployment (Firebase Hosting)

From the `frontend/` folder:

```bash
cd frontend

# Set production environment variables
export VITE_API_URL="https://trackmeds-backend-xxxxx-el.a.run.app"
export VITE_FIREBASE_PROJECT_ID="trackmeds-health"

# Build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

---

## 6. Verification and Health Check

Once deployed, verify the service endpoints:

```bash
# Verify health check
curl -X GET https://trackmeds-backend-xxxxx-el.a.run.app/api/health

# Output:
# {"status":"ok","version":"2.1.0","app":"TrackMeds Emergency Medicine Resilience Platform"}
```
