import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.all_models import Inventory, Facility, Medicine, Forecast, Consumption
from app.schemas.all_schemas import InventoryResponse

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("", response_model=List[InventoryResponse])
def get_inventory(
    country: str = Query(default="All"),
    district: str = Query(default="All"),
    facility_id: str = Query(default="All"),
    category: str = Query(default="All"),
    risk_level: str = Query(default="All"),
    search: str = Query(default=""),
    db: Session = Depends(get_db)
):
    today = datetime.date.today()

    query = db.query(Inventory).join(Facility).join(Medicine)

    if country != "All":
        query = query.filter(Facility.country == country)
    if district != "All":
        query = query.filter(Facility.district == district)
    if facility_id != "All":
        query = query.filter(Inventory.facility_id == facility_id)
    if category != "All":
        query = query.filter(Medicine.category == category)
    if search:
        query = query.filter(
            (Medicine.name.ilike(f"%{search}%")) |
            (Facility.name.ilike(f"%{search}%")) |
            (Inventory.batch_number.ilike(f"%{search}%"))
        )

    inventories = query.all()
    results = []

    for inv in inventories:
        days_to_exp = (inv.expiry_date - today).days

        # Fetch forecast if available
        fc = db.query(Forecast).filter(
            Forecast.facility_id == inv.facility_id,
            Forecast.medicine_id == inv.medicine_id
        ).first()

        pred_date = fc.predicted_stockout_date if fc else None
        daily_cons = fc.predicted_daily_demand if fc else 35.0
        r_level = fc.risk_level if fc else "Low"

        days_to_so = (pred_date - today).days if pred_date else int(inv.quantity / max(daily_cons, 1.0))

        if risk_level != "All" and r_level != risk_level:
            continue

        results.append(InventoryResponse(
            id=inv.id,
            facility_id=inv.facility_id,
            facility_name=inv.facility.name,
            medicine_id=inv.medicine_id,
            medicine_name=inv.medicine.name,
            category=inv.medicine.category,
            unit=inv.medicine.unit,
            batch_number=inv.batch_number,
            quantity=inv.quantity,
            expiry_date=inv.expiry_date,
            days_to_expiry=days_to_exp,
            daily_consumption=daily_cons,
            safety_stock_level=inv.medicine.safety_stock_level,
            predicted_stockout_date=pred_date,
            days_to_stockout=max(days_to_so, 0),
            risk_level=r_level,
            last_updated=inv.last_updated
        ))

    return results

@router.get("/risks")
def get_inventory_risks(country: str = Query(default="All"), db: Session = Depends(get_db)):
    today = datetime.date.today()

    query = db.query(Inventory).join(Facility).filter(Inventory.quantity > 0)
    if country != "All":
        query = query.filter(Facility.country == country)

    all_invs = query.all()

    stockout_count = 0
    expiry_count = 0
    warning_count = 0

    for inv in all_invs:
        fc = db.query(Forecast).filter(
            Forecast.facility_id == inv.facility_id,
            Forecast.medicine_id == inv.medicine_id
        ).first()

        if fc and fc.risk_level in ["Critical", "High"]:
            stockout_count += 1
        elif (inv.expiry_date - today).days <= 30:
            expiry_count += 1
        elif fc and fc.risk_level == "Medium":
            warning_count += 1

    return {
        "stockout_risks_count": stockout_count,
        "expiry_risks_count": expiry_count,
        "warning_stock_count": warning_count,
        "healthy_stock_count": len(all_invs) - (stockout_count + expiry_count + warning_count)
    }
