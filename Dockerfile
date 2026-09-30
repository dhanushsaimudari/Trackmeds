# =============================================================================
# Stage 1: Build React / Vite Frontend
# =============================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
# Build-time environment variables embedded into the static bundle
ENV VITE_API_BASE_URL=""
ENV VITE_GOOGLE_MAPS_API_KEY="AIzaSyBjAJK3n2OscEWHH7fBM6DTRjFTIihApPo"
ENV VITE_FIREBASE_API_KEY="AIzaSyB2Fh2BiLZaDjjELIBpn8hLcbtlx-QLK4Q"
ENV VITE_FIREBASE_AUTH_DOMAIN="trackmeds-india.firebaseapp.com"
ENV VITE_FIREBASE_PROJECT_ID="trackmeds-india"
ENV VITE_FIREBASE_STORAGE_BUCKET="trackmeds-india.firebasestorage.app"
ENV VITE_FIREBASE_MESSAGING_SENDER_ID="859158037487"
ENV VITE_FIREBASE_APP_ID="1:859158037487:web:2ab50fd22401cf25346c1a"

RUN npm run build

# =============================================================================
# Stage 2: Build Python Backend Dependencies
# =============================================================================
FROM python:3.12-slim AS backend-builder
WORKDIR /install

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt
RUN pip install --no-cache-dir --prefix=/install firebase-admin

# =============================================================================
# Stage 3: Unified Full-Stack Production Container
# =============================================================================
FROM python:3.12-slim

# Dedicated non-root user
RUN groupadd -r trackmeds && useradd -r -g trackmeds -d /home/trackmeds -s /bin/bash trackmeds

WORKDIR /app

# Copy python dependencies from builder
COPY --from=backend-builder /install /usr/local

# Copy backend application source
COPY backend/ /app

# Copy compiled frontend into static directory
COPY --from=frontend-builder /frontend/dist /app/static

# Set permissions
RUN chown -R trackmeds:trackmeds /app

USER trackmeds

# Environment configuration
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:' + str(__import__('os').environ.get('PORT', 8000)) + '/api/health')" || exit 1

# Launch uvicorn listening on 0.0.0.0 and dynamic $PORT
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
