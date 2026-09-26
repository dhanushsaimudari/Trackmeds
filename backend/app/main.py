from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed import seed_database

# API Routers
from app.api.dashboard import router as dashboard_router
from app.api.facilities import router as facilities_router
from app.api.inventory import router as inventory_router
from app.api.forecasts import router as forecasts_router
from app.api.redistribution import router as redistribution_router
from app.api.suppliers import router as suppliers_router
from app.api.scenario import router as scenario_router
from app.api.ai import router as ai_router
from app.api.demo import router as demo_router
from app.api.auth import router as auth_router
from app.api.federated import router as federated_router
from app.api.emergency_requests import router as emergency_requests_router
from app.api.abdm import router as abdm_router
from app.api.cold_chain import router as cold_chain_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    # Check if database has facilities; if not, automatically seed
    db = SessionLocal()
    try:
        from app.models.all_models import Facility
        count = db.query(Facility).count()
        if count == 0:
            seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Federated AI Health Supply Chain Resilience Decision Platform",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    lifespan=lifespan
)

# CORS middleware for React / Vite frontend
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
custom_origins = os.getenv("ALLOWED_ORIGINS", "")
if custom_origins:
    ALLOWED_ORIGINS.extend([o.strip() for o in custom_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(facilities_router, prefix=settings.API_V1_STR)
app.include_router(inventory_router, prefix=settings.API_V1_STR)
app.include_router(forecasts_router, prefix=settings.API_V1_STR)
app.include_router(redistribution_router, prefix=settings.API_V1_STR)
app.include_router(suppliers_router, prefix=settings.API_V1_STR)
app.include_router(scenario_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(demo_router, prefix=settings.API_V1_STR)
app.include_router(federated_router, prefix=settings.API_V1_STR)
app.include_router(emergency_requests_router, prefix=settings.API_V1_STR)
app.include_router(abdm_router, prefix=settings.API_V1_STR)
app.include_router(cold_chain_router, prefix=settings.API_V1_STR)


@app.get("/")
@app.get("/api/health")
def root_and_health():
    return {
        "title": "TRACKMEDS Command Center API",
        "version": settings.VERSION,
        "docs": "/api/docs",
        "status": "online",
        "environment": settings.ENVIRONMENT
    }
