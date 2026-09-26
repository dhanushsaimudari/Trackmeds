# Multi-stage production build for TrackMeds backend
FROM python:3.12-slim as builder

WORKDIR /install

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt
RUN pip install --no-cache-dir --prefix=/install firebase-admin

FROM python:3.12-slim

# Create dedicated non-root user
RUN groupadd -r trackmeds && useradd -r -g trackmeds -d /home/trackmeds -s /bin/bash trackmeds

WORKDIR /app

# Copy python dependencies from builder
COPY --from=builder /install /usr/local

# Copy application source code
COPY . /app

# Set ownership
RUN chown -R trackmeds:trackmeds /app

USER trackmeds

# Cloud Run dynamic PORT defaults to 8000
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:' + str(__import__('os').environ.get('PORT', 8000)) + '/api/health')" || exit 1

# Launch uvicorn listening on 0.0.0.0 and dynamic $PORT
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
