import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.config import settings
from app.database import get_db
from app.models.all_models import ExternalSignal, Forecast, Facility, Inventory, Notification
from app.schemas.all_schemas import NotificationResponse
from app.seed import seed_database
from app.services.forecasting.engine import ForecastingEngine
from app.services.optimization.redistribution import RedistributionOptimizer
from app.core.security import get_current_user, enforce_role, User

router = APIRouter(prefix="", tags=["Demo & System"])

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifs = db.query(Notification).order_by(Notification.timestamp.desc()).all()
    return notifs

@router.post("/demo/load-emergency-scenario")
def load_emergency_demo_scenario(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers the central Hackathon Demo Narrative:
    Monsoon Anomaly in Maharashtra -> Demand Surge for ORS -> PHC Haveli stockout risk + 92% Bed Occupancy Surge -> Satara CHC redistribution recommendation.
    """
    enforce_role(current_user, ["NATIONAL_ADMIN", "STATE_OFFICER"])
    today = datetime.date.today()

    # 1. Elevate External Signal
    sig = db.query(ExternalSignal).filter(ExternalSignal.region == "Maharashtra").first()
    if sig:
        sig.severity = "Extreme"
        sig.observed_value = "310 mm torrential rainfall in 24h (94% humidity)"
        sig.forecast_value = "SEVERE MONSOON ANOMALY: +65% acute rehydration & antibiotic surge."
    
    # 2. Elevate demand, drop medicine inventory, surge bed occupancy & lower staff at FAC-IN-101 & FAC-IN-102
    inv_101 = db.query(Inventory).filter(
        Inventory.facility_id == "FAC-IN-101",
        Inventory.medicine_id == "MED-ORS"
    ).first()
    if inv_101:
        inv_101.quantity = 280  # Low stock: stockout in 4 days!

    fac_101 = db.query(Facility).filter(Facility.id == "FAC-IN-101").first()
    if fac_101:
        fac_101.status = "Critical"
        fac_101.daily_footfall = 195  # Patient footfall surge to 195% of baseline!
        fac_101.occupied_beds = int((fac_101.total_beds or 40) * 0.95)  # 95% Bed Occupancy Surge!
        fac_101.nurses_available = max(8, int((fac_101.nurses_required or 20) * 0.55))  # Nurse availability drops to 55%
        fac_101.last_beds_updated = datetime.datetime.now(datetime.timezone.utc)
        fac_101.last_staff_updated = datetime.datetime.now(datetime.timezone.utc)
        fac_101.last_footfall_updated = datetime.datetime.now(datetime.timezone.utc)

    fac_102 = db.query(Facility).filter(Facility.id == "FAC-IN-102").first()
    if fac_102:
        fac_102.status = "Warning"
        fac_102.daily_footfall = 145  # Footfall surge to 145%
        fac_102.occupied_beds = int((fac_102.total_beds or 30) * 0.88)
        fac_102.nurses_available = max(10, int((fac_102.nurses_required or 20) * 0.65))
        fac_102.last_footfall_updated = datetime.datetime.now(datetime.timezone.utc)

    # 3. Refresh forecasts & redistribution
    ForecastingEngine.refresh_all_forecasts(db)
    recs = RedistributionOptimizer.generate_recommendations(db, country_filter="India")

    # 4. Insert Emergency Shock Notification
    now_dt = datetime.datetime.now(datetime.timezone.utc)
    notif_id = f"NOTIF-SHOCK-{now_dt.timestamp()}"
    shock_notif = Notification(
        id=notif_id,
        type="shock",
        title="⚡ HEALTH SUPPLY SHOCK DETECTED: Monsoon Anomaly in Maharashtra",
        message="Severe 310mm rainfall event & 95% bed occupancy surge detected. Projected ORS stockout at PHC Haveli in 4 days. Optimal redistribution route calculated.",
        severity="critical",
        facility_id="FAC-IN-101",
        read_status=False
    )
    db.add(shock_notif)
    db.commit()

    return {
        "status": "success",
        "message": "Emergency monsoon demo scenario loaded successfully!",
        "shock_event": "Monsoon Anomaly in Maharashtra (310mm Rainfall)",
        "critical_facility": "PHC Haveli Pune (FAC-IN-101)",
        "predicted_stockout_days": 4,
        "bed_occupancy_surge_pct": 95.0,
        "nurse_availability_pct": 55.0,
        "recommendations_generated": len(recs)
    }

@router.post("/demo/reset-database")
def reset_demo_database(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    enforce_role(current_user, ["NATIONAL_ADMIN"])
    if settings.ENVIRONMENT == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Database reset operation is disabled in production environment."
        )
    seed_database(db)
    return {"status": "success", "message": "TRACKMEDS database reset to initial seed state."}
