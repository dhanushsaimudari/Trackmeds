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

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Health Supply Chain Resilience Command Center for BRICS Nations",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs"
)

# CORS middleware for React / Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(facilities_router, prefix=settings.API_V1_STR)
app.include_router(inventory_router, prefix=settings.API_V1_STR)
app.include_router(forecasts_router, prefix=settings.API_V1_STR)
app.include_router(redistribution_router, prefix=settings.API_V1_STR)
app.include_router(suppliers_router, prefix=settings.API_V1_STR)
app.include_router(scenario_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(demo_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_event():
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

@app.get("/")
def root():
    return {
        "title": "TRACKMEDS Command Center API",
        "version": settings.VERSION,
        "docs": "/api/docs",
        "status": "online"
    }
