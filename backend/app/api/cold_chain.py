"""
IoT Cold-Chain Telemetry Endpoints
Provides real-time Ice Lined Refrigerator (ILR) sensor logs and temperature breach alerts.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from pydantic import BaseModel, Field
from app.api.auth import get_current_user
from app.services.iot.cold_chain import ColdChainService

router = APIRouter(prefix="/cold-chain", tags=["IoT Cold-Chain"])


class IngestTelemetryRequest(BaseModel):
    facility_id: str
    temperature: float = Field(..., ge=-50.0, le=60.0, description="Temperature in Celsius")
    humidity: float = Field(default=55.0, ge=0.0, le=100.0, description="Relative Humidity percentage")
    battery: int = Field(default=95, ge=0, le=100)


@router.get("/facility/{facility_id}")
def get_facility_cold_chain(facility_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetch live IoT telemetry for the specified facility's cold-chain biological storage."""
    return ColdChainService.get_facility_telemetry(facility_id)


@router.post("/telemetry")
def ingest_telemetry(request: IngestTelemetryRequest):
    """Ingest IoT telemetry packet from edge sensors (unauthenticated or gateway HMAC)."""
    return ColdChainService.ingest_sensor_reading(
        facility_id=request.facility_id,
        temperature=request.temperature,
        humidity=request.humidity,
        battery=request.battery
    )
