import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.all_models import Inventory, Facility, Medicine, Forecast, Consumption
from app.schemas.all_schemas import InventoryResponse
from app.core.security import get_current_user, apply_rbac_facility_filter, User

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("", response_model=List[InventoryResponse])
def get_inventory(
    country: str = Query(default="All"),
    state: str = Query(default="All"),
    district: str = Query(default="All"),
    facility_id: str = Query(default="All"),
    category: str = Query(default="All"),
    risk_level: str = Query(default="All"),
    search: str = Query(default=""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = datetime.date.today()

    query = db.query(Inventory).join(Facility).join(Medicine)

    if country != "All":
        query = query.filter(Facility.country == country)
    if state != "All":
        query = query.filter(Facility.state == state)
    if district != "All":
        query = query.filter(Facility.district == district)
    if facility_id != "All":
        query = query.filter(Inventory.facility_id == facility_id)
    if category != "All":
        query = query.filter(Medicine.category == category)

    # Server-side RBAC scoping
    query = apply_rbac_facility_filter(query, current_user, Facility)

    if search:
        query = query.filter(
            (Medicine.name.ilike(f"%{search}%")) |
            (Facility.name.ilike(f"%{search}%")) |
            (Inventory.batch_number.ilike(f"%{search}%"))
        )

    inventories = query.all()
    results = []

    # Preload forecasts to eliminate N+1 queries
    fac_med_pairs = [(inv.facility_id, inv.medicine_id) for inv in inventories]
    forecast_map = {
        (fc.facility_id, fc.medicine_id): fc
        for fc in db.query(Forecast).filter(
            Forecast.facility_id.in_([p[0] for p in fac_med_pairs])
        ).all()
    } if fac_med_pairs else {}

    for inv in inventories:
        days_to_exp = (inv.expiry_date - today).days

        # Fetch forecast from memory map
        fc = forecast_map.get((inv.facility_id, inv.medicine_id))

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
def get_inventory_risks(
    country: str = Query(default="All"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = datetime.date.today()

    query = db.query(Inventory).join(Facility).filter(Inventory.quantity > 0)
    if country != "All":
        query = query.filter(Facility.country == country)

    # Server-side RBAC scoping
    query = apply_rbac_facility_filter(query, current_user, Facility)

    all_invs = query.all()

    # Preload forecasts to eliminate N+1 in risks
    all_fcs = {
        (fc.facility_id, fc.medicine_id): fc
        for fc in db.query(Forecast).all()
    }

    stockout_count = 0
    expiry_count = 0
    warning_count = 0

    for inv in all_invs:
        fc = all_fcs.get((inv.facility_id, inv.medicine_id))

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


from pydantic import BaseModel, Field
from fastapi import HTTPException, status
from app.core.security import enforce_facility_access
from app.services.forecasting.engine import ForecastingEngine
import uuid

class InventoryCreateRequest(BaseModel):
    facility_id: str
    medicine_id: str
    batch_number: str
    quantity: int = Field(gt=0, description="Quantity to add must be positive integer")
    expiry_date: datetime.date

class InventoryConsumeRequest(BaseModel):
    facility_id: str
    medicine_id: str
    quantity: int = Field(gt=0, description="Quantity to consume must be positive integer")
    batch_number: Optional[str] = None


@router.post("", response_model=InventoryResponse)
def add_or_update_inventory(
    req: InventoryCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Adds medicine inventory to a health facility with server-side RBAC scoping,
    batch tracking, non-negative validation, and automated ML forecast recalculation.
    """
    today = datetime.date.today()

    fac = db.query(Facility).filter(Facility.id == req.facility_id).first()
    if not fac:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Facility '{req.facility_id}' not found."
        )

    enforce_facility_access(current_user, fac.id, db)

    med = db.query(Medicine).filter(Medicine.id == req.medicine_id).first()
    if not med:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine '{req.medicine_id}' not found in registry."
        )

    if req.expiry_date <= today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot add stock with past or today's expiry date ({req.expiry_date}). Batch is already expired."
        )

    # Check for existing batch at this facility
    inv = db.query(Inventory).filter(
        Inventory.facility_id == fac.id,
        Inventory.medicine_id == med.id,
        Inventory.batch_number == req.batch_number
    ).first()

    if inv:
        inv.quantity += req.quantity
        inv.expiry_date = req.expiry_date
        inv.last_updated = datetime.datetime.now(datetime.timezone.utc)
    else:
        inv = Inventory(
            id=f"INV-{uuid.uuid4().hex[:8].upper()}",
            facility_id=fac.id,
            medicine_id=med.id,
            batch_number=req.batch_number,
            quantity=req.quantity,
            expiry_date=req.expiry_date,
            last_updated=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(inv)

    db.commit()
    db.refresh(inv)

    # Trigger complete ML demand forecast & stockout risk recalculation
    ForecastingEngine.refresh_all_forecasts(db)

    # Fetch updated forecast for response
    fc = db.query(Forecast).filter(
        Forecast.facility_id == fac.id,
        Forecast.medicine_id == med.id
    ).first()

    days_to_exp = (inv.expiry_date - today).days
    pred_date = fc.predicted_stockout_date if fc else None
    daily_cons = fc.predicted_daily_demand if fc else 35.0
    r_level = fc.risk_level if fc else "Low"
    days_to_so = (pred_date - today).days if pred_date else int(inv.quantity / max(daily_cons, 1.0))

    return InventoryResponse(
        id=inv.id,
        facility_id=inv.facility_id,
        facility_name=fac.name,
        medicine_id=inv.medicine_id,
        medicine_name=med.name,
        category=med.category,
        unit=med.unit,
        batch_number=inv.batch_number,
        quantity=inv.quantity,
        expiry_date=inv.expiry_date,
        days_to_expiry=days_to_exp,
        daily_consumption=daily_cons,
        safety_stock_level=med.safety_stock_level,
        predicted_stockout_date=pred_date,
        days_to_stockout=max(days_to_so, 0),
        risk_level=r_level,
        last_updated=inv.last_updated
    )


@router.post("/consume")
def consume_inventory(
    req: InventoryConsumeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Consumes medicine inventory at a health facility under FEFO protocol,
    records consumption history, guards against negative stock, and recalculates forecasts.
    """
    today = datetime.date.today()

    fac = db.query(Facility).filter(Facility.id == req.facility_id).first()
    if not fac:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Facility '{req.facility_id}' not found."
        )

    enforce_facility_access(current_user, fac.id, db)

    med = db.query(Medicine).filter(Medicine.id == req.medicine_id).first()
    if not med:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine '{req.medicine_id}' not found."
        )

    # Query candidate batches in FEFO order (oldest expiry first)
    query = db.query(Inventory).filter(
        Inventory.facility_id == fac.id,
        Inventory.medicine_id == med.id,
        Inventory.quantity > 0
    )
    if req.batch_number:
        query = query.filter(Inventory.batch_number == req.batch_number)

    batches = query.order_by(Inventory.expiry_date.asc()).all()
    total_available = sum(b.quantity for b in batches)

    if total_available < req.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient inventory to consume. Available: {total_available}, requested: {req.quantity}."
        )

    remaining_to_deduct = req.quantity
    batches_affected = []

    for b in batches:
        if remaining_to_deduct <= 0:
            break
        deduct_from_batch = min(b.quantity, remaining_to_deduct)
        b.quantity -= deduct_from_batch
        b.last_updated = datetime.datetime.now(datetime.timezone.utc)
        remaining_to_deduct -= deduct_from_batch
        batches_affected.append({
            "batch_number": b.batch_number,
            "deducted": deduct_from_batch,
            "remaining_batch_stock": b.quantity
        })

    # Record consumption event
    cons_record = Consumption(
        id=f"CON-{uuid.uuid4().hex[:8].upper()}",
        facility_id=fac.id,
        medicine_id=med.id,
        date=today,
        quantity_used=req.quantity
    )
    db.add(cons_record)
    db.commit()

    # Recalculate ML demand forecasts and risks
    ForecastingEngine.refresh_all_forecasts(db)

    # Fetch updated forecast
    fc = db.query(Forecast).filter(
        Forecast.facility_id == fac.id,
        Forecast.medicine_id == med.id
    ).first()

    return {
        "success": True,
        "facility_id": fac.id,
        "facility_name": fac.name,
        "medicine_id": med.id,
        "medicine_name": med.name,
        "quantity_consumed": req.quantity,
        "remaining_total_stock": total_available - req.quantity,
        "batches_affected": batches_affected,
        "updated_risk_level": fc.risk_level if fc else "Low",
        "updated_predicted_stockout_date": str(fc.predicted_stockout_date) if fc and fc.predicted_stockout_date else None
    }

