import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.all_models import Facility, Inventory, Forecast, ExternalSignal
from app.schemas.all_schemas import FacilityResponse, FacilityBedsUpdate, FacilityStaffUpdate
from app.services.resilience import FacilityResilienceEngine

router = APIRouter(prefix="/facilities", tags=["Facilities"])

def _build_facility_response(fac: Facility, db: Session) -> FacilityResponse:
    # 1. Critical medicines count
    critical_count = db.query(Forecast).filter(
        Forecast.facility_id == fac.id,
        Forecast.risk_level.in_(["Critical", "High"])
    ).count()

    # 2. Climate signal severity for facility region
    climate_sig = db.query(ExternalSignal).filter(
        ExternalSignal.country == fac.country,
        ExternalSignal.region == fac.district
    ).first()
    climate_severity = climate_sig.severity if climate_sig else "Low"

    # 3. Calculate Deterministic Resilience Metrics
    res_data = FacilityResilienceEngine.calculate_facility_resilience(
        critical_meds_count=critical_count,
        total_meds_monitored=12,
        total_beds=fac.total_beds or 60,
        occupied_beds=fac.occupied_beds or 35,
        doctors_req=fac.doctors_required or 8,
        doctors_avail=fac.doctors_available or 7,
        nurses_req=fac.nurses_required or 20,
        nurses_avail=fac.nurses_available or 18,
        support_req=fac.support_required or 15,
        support_avail=fac.support_available or 14,
        climate_risk_severity=climate_severity
    )

    bed_m = res_data["bed_metrics"]
    staff_m = res_data["staff_metrics"]

    # Stock health score is the medicine stability component
    health_score = res_data["components"]["medicine_stability_score"]

    return FacilityResponse(
        id=fac.id,
        name=fac.name,
        type=fac.type,
        district=fac.district,
        country=fac.country,
        latitude=fac.latitude,
        longitude=fac.longitude,
        population_served=fac.population_served,
        capacity=fac.capacity,
        status=res_data["status"],
        stock_health_score=health_score,
        critical_medicines_count=critical_count,
        # Bed metrics
        total_beds=bed_m["total_beds"],
        occupied_beds=bed_m["occupied_beds"],
        available_beds=bed_m["available_beds"],
        emergency_beds=fac.emergency_beds or 10,
        icu_beds=fac.icu_beds or 8,
        occupancy_rate=bed_m["occupancy_rate"],
        bed_risk_status=bed_m["status"],
        # Staff metrics
        doctors_required=staff_m["doctors_required"],
        doctors_available=staff_m["doctors_available"],
        nurses_required=staff_m["nurses_required"],
        nurses_available=staff_m["nurses_available"],
        support_required=staff_m["support_required"],
        support_available=staff_m["support_available"],
        staffing_percentage=staff_m["staffing_percentage"],
        staff_risk_status=staff_m["status"],
        # Integrated Resilience
        resilience_score=res_data["overall_score"],
        resilience_breakdown=res_data["components"],
        main_factors=res_data["main_factors"],
        last_updated=fac.last_beds_updated or datetime.datetime.utcnow()
    )


@router.get("", response_model=List[FacilityResponse])
def get_facilities(
    country: str = Query(default="All"),
    district: str = Query(default="All"),
    status: str = Query(default="All"),
    db: Session = Depends(get_db)
):
    query = db.query(Facility)

    if country != "All":
        query = query.filter(Facility.country == country)
    if district != "All":
        query = query.filter(Facility.district == district)

    facilities = query.all()
    results = []

    for fac in facilities:
        resp = _build_facility_response(fac, db)
        if status != "All" and resp.status != status:
            continue
        results.append(resp)

    return results


@router.get("/beds/summary")
def get_bed_availability_summary(
    country: str = Query(default="All"),
    region: str = Query(default="All"),
    db: Session = Depends(get_db)
):
    query = db.query(Facility)
    if country != "All":
        query = query.filter(Facility.country == country)
    if region != "All":
        query = query.filter(Facility.district == region)

    facilities = query.all()
    total_b = sum(f.total_beds or 0 for f in facilities)
    occ_b = sum(f.occupied_beds or 0 for f in facilities)
    avail_b = max(0, total_b - occ_b)
    em_b = sum(f.emergency_beds or 0 for f in facilities)
    icu_b = sum(f.icu_beds or 0 for f in facilities)
    occ_pct = round((occ_b / max(1, total_b)) * 100.0, 1)

    status = "CRITICAL" if occ_pct > 90.0 else ("WARNING" if occ_pct >= 75.0 else "NORMAL")

    return {
        "country": country,
        "region": region,
        "total_beds": total_b,
        "occupied_beds": occ_b,
        "available_beds": avail_b,
        "emergency_beds": em_b,
        "icu_beds": icu_b,
        "occupancy_percentage": occ_pct,
        "risk_status": status,
        "last_updated": datetime.datetime.utcnow()
    }


@router.get("/staff/summary")
def get_staff_availability_summary(
    country: str = Query(default="All"),
    region: str = Query(default="All"),
    db: Session = Depends(get_db)
):
    query = db.query(Facility)
    if country != "All":
        query = query.filter(Facility.country == country)
    if region != "All":
        query = query.filter(Facility.district == region)

    facilities = query.all()
    doc_req = sum(f.doctors_required or 0 for f in facilities)
    doc_avail = sum(f.doctors_available or 0 for f in facilities)
    nurse_req = sum(f.nurses_required or 0 for f in facilities)
    nurse_avail = sum(f.nurses_available or 0 for f in facilities)
    sup_req = sum(f.support_required or 0 for f in facilities)
    sup_avail = sum(f.support_available or 0 for f in facilities)

    tot_req = max(1, doc_req + nurse_req + sup_req)
    tot_avail = doc_avail + nurse_avail + sup_avail
    staffing_pct = round((tot_avail / tot_req) * 100.0, 1)

    status = "CRITICAL" if staffing_pct < 70.0 else ("WARNING" if staffing_pct <= 85.0 else "HEALTHY")

    return {
        "country": country,
        "region": region,
        "doctors": {"required": doc_req, "available": doc_avail, "pct": round((doc_avail/max(1, doc_req))*100, 1)},
        "nurses": {"required": nurse_req, "available": nurse_avail, "pct": round((nurse_avail/max(1, nurse_req))*100, 1)},
        "support": {"required": sup_req, "available": sup_avail, "pct": round((sup_avail/max(1, sup_req))*100, 1)},
        "overall_staffing_percentage": staffing_pct,
        "risk_status": status,
        "last_updated": datetime.datetime.utcnow()
    }


@router.get("/{facility_id}", response_model=FacilityResponse)
def get_facility_by_id(facility_id: str, db: Session = Depends(get_db)):
    fac = db.query(Facility).filter(Facility.id == facility_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Facility not found")

    return _build_facility_response(fac, db)


@router.put("/{facility_id}/beds", response_model=FacilityResponse)
def update_facility_beds(
    facility_id: str,
    beds_data: FacilityBedsUpdate,
    db: Session = Depends(get_db)
):
    fac = db.query(Facility).filter(Facility.id == facility_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Facility not found")

    if beds_data.total_beds is not None:
        fac.total_beds = beds_data.total_beds
    
    fac.occupied_beds = min(fac.total_beds, beds_data.occupied_beds)

    if beds_data.emergency_beds is not None:
        fac.emergency_beds = beds_data.emergency_beds
    if beds_data.icu_beds is not None:
        fac.icu_beds = beds_data.icu_beds

    fac.last_beds_updated = datetime.datetime.utcnow()
    db.commit()
    db.refresh(fac)

    return _build_facility_response(fac, db)


@router.put("/{facility_id}/staff", response_model=FacilityResponse)
def update_facility_staff(
    facility_id: str,
    staff_data: FacilityStaffUpdate,
    db: Session = Depends(get_db)
):
    fac = db.query(Facility).filter(Facility.id == facility_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Facility not found")

    if staff_data.doctors_required is not None:
        fac.doctors_required = staff_data.doctors_required
    if staff_data.nurses_required is not None:
        fac.nurses_required = staff_data.nurses_required
    if staff_data.support_required is not None:
        fac.support_required = staff_data.support_required

    fac.doctors_available = min(fac.doctors_required, staff_data.doctors_available)
    fac.nurses_available = min(fac.nurses_required, staff_data.nurses_available)
    fac.support_available = min(fac.support_required, staff_data.support_available)

    fac.last_staff_updated = datetime.datetime.utcnow()
    db.commit()
    db.refresh(fac)

    return _build_facility_response(fac, db)
