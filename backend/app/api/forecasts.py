import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.all_models import Forecast, Facility, Medicine, Consumption
from app.schemas.all_schemas import ForecastResponse
from app.services.forecasting.engine import ForecastingEngine
from app.core.security import get_current_user, apply_rbac_facility_filter, enforce_facility_access, enforce_role, User

router = APIRouter(prefix="/forecasts", tags=["Forecasts"])

@router.get("", response_model=List[ForecastResponse])
def get_forecasts(
    country: str = Query(default="All"),
    state: str = Query(default="All"),
    risk_level: str = Query(default="All"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = datetime.date.today()
    query = db.query(Forecast).join(Facility).join(Medicine)

    if country != "All":
        query = query.filter(Facility.country == country)
    if state != "All":
        query = query.filter(Facility.state == state)
    if risk_level != "All":
        query = query.filter(Forecast.risk_level == risk_level)

    # Server-side RBAC scoping
    query = apply_rbac_facility_filter(query, current_user, Facility)

    forecasts = query.order_by(Forecast.risk_level.asc(), Forecast.predicted_stockout_date.asc()).all()
    results = []

    for fc in forecasts:
        days_until = (fc.predicted_stockout_date - today).days if fc.predicted_stockout_date else 99

        results.append(ForecastResponse(
            id=fc.id,
            facility_id=fc.facility_id,
            facility_name=fc.facility.name,
            medicine_id=fc.medicine_id,
            medicine_name=fc.medicine.name,
            predicted_daily_demand=fc.predicted_daily_demand,
            predicted_stockout_date=fc.predicted_stockout_date,
            days_until_stockout=max(days_until, 0),
            stockout_probability=fc.stockout_probability,
            confidence=fc.confidence,
            risk_level=fc.risk_level,
            risk_reason=fc.risk_reason,
            generated_at=fc.generated_at
        ))

    return results

@router.get("/demand-trend")
def get_demand_trend(
    facility_id: str = Query(default="FAC-IN-101"),
    medicine_id: str = Query(default="MED-ORS"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Enforce facility access authorization
    enforce_facility_access(current_user, facility_id, db)

    today = datetime.date.today()
    start_date = today - datetime.timedelta(days=30)

    # 1. Historical consumption points
    consumptions = db.query(Consumption).filter(
        Consumption.facility_id == facility_id,
        Consumption.medicine_id == medicine_id,
        Consumption.date >= start_date
    ).order_by(Consumption.date.asc()).all()

    historical_data = []
    for c in consumptions:
        historical_data.append({
            "date": c.date.strftime("%Y-%m-%d"),
            "demand": c.quantity_used,
            "type": "Historical"
        })

    # 2. Future 30-day forecast projection points
    fc = db.query(Forecast).filter(
        Forecast.facility_id == facility_id,
        Forecast.medicine_id == medicine_id
    ).first()

    daily_proj = fc.predicted_daily_demand if fc else 45.0
    forecast_data = []

    for i in range(1, 31):
        future_d = today + datetime.timedelta(days=i)
        variance = 1.0 + (0.05 * (i % 5 - 2))
        forecast_data.append({
            "date": future_d.strftime("%Y-%m-%d"),
            "demand": round(daily_proj * variance, 1),
            "type": "Forecast"
        })

    return {
        "facility_id": facility_id,
        "medicine_id": medicine_id,
        "historical": historical_data,
        "forecast": forecast_data
    }

@router.post("/run")
def run_forecasting_pipeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    enforce_role(current_user, ["NATIONAL_ADMIN", "STATE_OFFICER", "DISTRICT_OFFICER"])
    ForecastingEngine.refresh_all_forecasts(db)
    return {"status": "success", "message": "Predictive forecasting engine completed successfully."}
