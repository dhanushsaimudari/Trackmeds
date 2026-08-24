import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.all_models import Facility, Forecast, Inventory, Medicine, ExternalSignal
from app.schemas.all_schemas import AIAskRequest, AIAskResponse
from app.services.gemini.copilot import GeminiCopilotService
from app.services.resilience import FacilityResilienceEngine

router = APIRouter(prefix="/ai", tags=["AI Copilot"])

@router.post("/ask", response_model=AIAskResponse)
def ask_ai_copilot(
    req: AIAskRequest,
    db: Session = Depends(get_db)
):
    country = req.country or "India"
    region = req.region or "All"
    
    # 1. Fetch facilities
    query = db.query(Facility).filter(Facility.country == country)
    if region != "All":
        query = query.filter(Facility.district == region)
    
    facilities = query.all()
    fac_count = len(facilities)

    # 2. Critical Forecasts & Medicines
    fc_query = db.query(Forecast).join(Facility).filter(Facility.country == country)
    if region != "All":
        fc_query = fc_query.filter(Facility.district == region)
        
    critical_forecasts = fc_query.filter(Forecast.risk_level.in_(["Critical", "High"])).all()
    top_critical_meds = list(set(fc.medicine.name for fc in critical_forecasts))
    if not top_critical_meds:
        top_critical_meds = ["Oral Rehydration Salts (ORS)", "Amoxicillin 500mg", "Human Insulin 100IU/ml"]

    # 3. Expiry Risks
    expiring_count = db.query(Inventory).join(Facility).filter(
        Facility.country == country,
        Inventory.quantity > 0,
        Inventory.expiry_date <= (datetime.date.today() + datetime.timedelta(days=45))
    ).count()

    # 4. Regional Bed Metrics
    tot_beds = sum(f.total_beds or 0 for f in facilities)
    occ_beds = sum(f.occupied_beds or 0 for f in facilities)
    avail_beds = max(0, tot_beds - occ_beds)
    occ_pct = round((occ_beds / max(1, tot_beds)) * 100.0, 1)

    # 5. Regional Staffing Metrics
    d_req = sum(f.doctors_required or 0 for f in facilities)
    d_avail = sum(f.doctors_available or 0 for f in facilities)
    n_req = sum(f.nurses_required or 0 for f in facilities)
    n_avail = sum(f.nurses_available or 0 for f in facilities)
    tot_staff_req = max(1, d_req + n_req)
    tot_staff_avail = d_avail + n_avail
    staff_pct = round((tot_staff_avail / tot_staff_req) * 100.0, 1)

    # 6. Signal
    sig = db.query(ExternalSignal).filter(ExternalSignal.country == country).first()
    climate_sig = sig.observed_value if sig else "Monsoon Rainfall Anomaly"

    # 7. Integrated Deterministic Resilience Score
    res_data = FacilityResilienceEngine.calculate_facility_resilience(
        critical_meds_count=len(critical_forecasts),
        total_meds_monitored=12,
        total_beds=tot_beds,
        occupied_beds=occ_beds,
        doctors_req=d_req,
        doctors_avail=d_avail,
        nurses_req=n_req,
        nurses_avail=n_avail,
        support_req=15,
        support_avail=14,
        climate_risk_severity=sig.severity if sig else "Low"
    )

    context = {
        "country": country,
        "region": region,
        "facilities_monitored": fac_count or 12,
        "stockout_risks": len(critical_forecasts),
        "expiry_risks": expiring_count,
        "top_critical_medicines": top_critical_meds,
        "active_climate_signal": climate_sig,
        "bed_metrics": {
            "total_beds": tot_beds,
            "occupied_beds": occ_beds,
            "available_beds": avail_beds,
            "occupancy_rate_pct": occ_pct
        },
        "staffing_metrics": {
            "doctors_available": d_avail,
            "doctors_required": d_req,
            "nurses_available": n_avail,
            "nurses_required": n_req,
            "overall_staffing_pct": staff_pct
        },
        "resilience_score": res_data["overall_score"],
        "resilience_factors": res_data["main_factors"]
    }

    answer = GeminiCopilotService.ask_copilot(req.question, context)

    return AIAskResponse(
        answer=answer,
        supporting_data=context,
        timestamp=datetime.datetime.utcnow()
    )
