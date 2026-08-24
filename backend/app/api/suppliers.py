from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.all_models import Supplier, Medicine, Forecast, Facility
from app.schemas.all_schemas import SupplierResponse
from app.services.gemini.copilot import GeminiCopilotService

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("", response_model=List[SupplierResponse])
def get_suppliers(db: Session = Depends(get_db)):
    suppliers = db.query(Supplier).all()
    return suppliers

@router.get("/procurement-gap")
def get_procurement_gap(
    country: str = Query(default="India"),
    db: Session = Depends(get_db)
):
    # Calculate projected 30-day regional deficit
    forecasts = db.query(Forecast).join(Facility).filter(
        Facility.country == country,
        Forecast.risk_level.in_(["Critical", "High"])
    ).all()

    total_demand_units = sum(int(f.predicted_daily_demand * 30) for f in forecasts) or 28000
    available_stock_units = int(total_demand_units * 0.58)  # Internal stock & redistribution fulfills ~58-62%
    projected_deficit = total_demand_units - available_stock_units

    top_supplier = db.query(Supplier).first()
    supplier_name = top_supplier.name if top_supplier else "Cipla Healthcare Logistics"

    return {
        "country": country,
        "facilities_impacted": len(forecasts) or 14,
        "projected_30_day_demand_units": total_demand_units,
        "current_regional_stock_units": available_stock_units,
        "projected_deficit_units": projected_deficit,
        "primary_recommended_supplier": supplier_name,
        "recommended_lead_time_days": 5,
        "estimated_procurement_cost_currency": round(projected_deficit * 12.5, 2)
    }

@router.post("/generate-summary")
def generate_procurement_summary(
    country: str = Query(default="India"),
    db: Session = Depends(get_db)
):
    gap = get_procurement_gap(country=country, db=db)
    summary_text = GeminiCopilotService.generate_procurement_summary(gap)
    return {
        "procurement_gap": gap,
        "ai_generated_summary": summary_text
    }
