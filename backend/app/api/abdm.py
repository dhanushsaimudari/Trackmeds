"""
Ayushman Bharat Digital Mission (ABDM) Endpoints
Enables Health Facility Registry (HFR) lookups, M1/M2/M3 compliance validation, and FHIR R4 Dispense bundles.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.api.auth import get_current_user
from app.services.abdm.hfr_client import ABDMService

router = APIRouter(prefix="/abdm", tags=["ABDM & HFR"])


class HFRVerifyRequest(BaseModel):
    facility_id: str


class FHIRDispenseRequest(BaseModel):
    facility_id: str
    medicine_name: str
    batch_number: str
    quantity: int = Field(..., gt=0, le=100000, description="Dispensed quantity units")
    abha_id: Optional[str] = "ABHA-91-8201-9921"


@router.get("/facilities", response_model=List[Dict[str, Any]])
def get_hfr_facilities(current_user: Dict[str, Any] = Depends(get_current_user)):
    """List all health facilities registered in ABDM HFR."""
    return ABDMService.get_all_hfr_facilities()


@router.get("/facility/{facility_id}")
def verify_facility_hfr(facility_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Verify facility compliance with ABDM HFR and fetch M1-M3 milestones."""
    return ABDMService.verify_hfr_facility(facility_id)


@router.post("/fhir-dispense")
def generate_fhir_dispense(request: FHIRDispenseRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Generate ABDM FHIR R4 MedicationDispense bundle for e-prescription fulfillment."""
    return ABDMService.generate_fhir_dispense_bundle(
        facility_id=request.facility_id,
        medicine_name=request.medicine_name,
        batch_number=request.batch_number,
        quantity=request.quantity,
        abha_id=request.abha_id
    )
