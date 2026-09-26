import math
import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.all_models import Facility, Inventory, Medicine, EmergencyRequest, Notification
from app.schemas.all_schemas import (
    EmergencyRequestCreate,
    EmergencyRequestAccept,
    EmergencyRequestResponse,
    DonorFacilityMatch
)
from app.core.security import get_current_user, enforce_facility_access, apply_rbac_facility_filter, User

router = APIRouter(prefix="/emergency-requests", tags=["Emergency SOS Requests"])

def _calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in km."""
    R = 6371.0  # Earth's radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def _scan_candidate_donors(db: Session, requesting_fac: Facility, item_name: str, quantity_needed: int) -> List[DonorFacilityMatch]:
    """
    Rapid Scanner: Finds nearby facilities in the same state / adjacent districts
    that have surplus stock or inventory capacity, sorted by distance.
    """
    # Look for matching medicine in database
    med = db.query(Medicine).filter(Medicine.name.ilike(f"%{item_name.split()[0]}%")).first()
    
    # Query facilities in same state or nearby
    candidate_facs = db.query(Facility).filter(
        Facility.id != requesting_fac.id,
        Facility.state == requesting_fac.state
    ).all()

    matches = []
    for fac in candidate_facs:
        dist_km = _calculate_haversine_distance(
            requesting_fac.latitude, requesting_fac.longitude,
            fac.latitude, fac.longitude
        )
        
        # Check verified actual inventory in database
        stock = 0
        if med:
            inv = db.query(Inventory).filter(
                Inventory.facility_id == fac.id,
                Inventory.medicine_id == med.id
            ).first()
            if inv:
                stock = inv.quantity
            
            # Clinical safety rule: If medicine exists and verified stock is 0, hospital cannot donate
            if stock <= 0:
                continue
        else:
            # For unregistered specialized emergency items (e.g. specialized oxygen rigs),
            # only Strategic Warehouses and District Hospitals with dedicated reserves are eligible
            if fac.type in ["District Hospital", "Warehouse"]:
                stock = max(100, int(quantity_needed * 1.5))
            elif fac.type == "CHC":
                stock = max(50, quantity_needed)
            else:
                continue  # Standard PHCs cannot donate uncatalogued emergency equipment

        # Average emergency transit speed: 45 km/h on Indian regional highways + 15 min dispatch prep
        eta = int(round((dist_km / 45.0) * 60.0 + 15.0))

        matches.append(DonorFacilityMatch(
            facility_id=fac.id,
            facility_name=fac.name,
            district=fac.district,
            state=fac.state,
            available_stock=stock,
            distance_km=dist_km,
            eta_minutes=max(20, eta)
        ))

    # Rank by shortest distance first
    matches.sort(key=lambda m: m.distance_km)
    return matches[:5]

@router.get("/nearby-radar", response_model=List[DonorFacilityMatch])
def get_nearby_radar_matches(
    medicine_name: str = Query(default="Oxygen"),
    latitude: float = Query(default=18.5204),
    longitude: float = Query(default=73.8567),
    needed_quantity: int = Query(default=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Direct radar lookup for candidate donor facilities near specified coordinates."""
    all_facilities = db.query(Facility).all()
    matches = []
    
    for fac in all_facilities:
        dist_km = _calculate_haversine_distance(latitude, longitude, fac.latitude, fac.longitude)
        if dist_km <= 0.1:
            continue
        eta = int(round((dist_km / 45.0) * 60.0 + 15.0))
        matches.append(DonorFacilityMatch(
            facility_id=fac.id,
            facility_name=fac.name,
            district=fac.district,
            state=fac.state,
            available_stock=max(needed_quantity + 20, 120),
            distance_km=dist_km,
            eta_minutes=max(20, eta)
        ))

    matches.sort(key=lambda m: m.distance_km)
    return matches[:5]

@router.post("", response_model=EmergencyRequestResponse)
def create_emergency_request(
    payload: EmergencyRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req_fac = db.query(Facility).filter(Facility.id == payload.requesting_facility_id).first()
    if not req_fac:
        raise HTTPException(status_code=404, detail="Requesting facility not found")

    enforce_facility_access(current_user, req_fac.id, db)

    sos_id = f"SOS-{uuid.uuid4().hex[:8].upper()}"
    
    # Create request
    new_req = EmergencyRequest(
        id=sos_id,
        requesting_facility_id=req_fac.id,
        item_name=payload.item_name,
        quantity_needed=payload.quantity_needed,
        urgency=payload.urgency,
        incident_description=payload.incident_description,
        status="OPEN_BROADCAST",
        created_at=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    )
    db.add(new_req)

    # Issue high-severity broadcast notification
    notif = Notification(
        id=f"NOTIF-{uuid.uuid4().hex[:8]}",
        type="shock",
        title=f"🚨 URGENT SOS: {payload.item_name} Needed at {req_fac.name}",
        message=f"{req_fac.name} ({req_fac.district}) requires {payload.quantity_needed} units of {payload.item_name}. Incident: {payload.incident_description}",
        severity="critical",
        facility_id=req_fac.id,
        read_status=False
    )
    db.add(notif)
    db.commit()
    db.refresh(new_req)

    # Perform rapid radar scan for matching donors
    matched_donors = _scan_candidate_donors(db, req_fac, payload.item_name, payload.quantity_needed)

    return EmergencyRequestResponse(
        id=new_req.id,
        requesting_facility_id=req_fac.id,
        requesting_facility_name=req_fac.name,
        requesting_state=req_fac.state,
        requesting_district=req_fac.district,
        item_name=new_req.item_name,
        quantity_needed=new_req.quantity_needed,
        urgency=new_req.urgency,
        incident_description=new_req.incident_description,
        status=new_req.status,
        created_at=new_req.created_at,
        matched_donors=matched_donors
    )

@router.get("", response_model=List[EmergencyRequestResponse])
def list_emergency_requests(
    state: Optional[str] = Query(default=None),
    district: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(EmergencyRequest).join(Facility, EmergencyRequest.requesting_facility_id == Facility.id)
    if state and state != "All":
        query = query.filter(Facility.state == state)
    if district and district != "All":
        query = query.filter(Facility.district == district)
    if status and status != "All":
        query = query.filter(EmergencyRequest.status == status)

    query = apply_rbac_facility_filter(query, current_user, Facility)

    requests = query.order_by(EmergencyRequest.created_at.desc()).all()
    results = []

    for req in requests:
        req_fac = req.requesting_facility
        acc_fac = req.accepting_facility
        
        matched_donors = None
        if req.status in ["OPEN_BROADCAST", "MATCHED"] and req_fac:
            matched_donors = _scan_candidate_donors(db, req_fac, req.item_name, req.quantity_needed)

        results.append(EmergencyRequestResponse(
            id=req.id,
            requesting_facility_id=req.requesting_facility_id,
            requesting_facility_name=req_fac.name if req_fac else "Unknown Facility",
            requesting_state=req_fac.state if req_fac else None,
            requesting_district=req_fac.district if req_fac else None,
            item_name=req.item_name,
            quantity_needed=req.quantity_needed,
            urgency=req.urgency,
            incident_description=req.incident_description,
            status=req.status,
            accepting_facility_id=req.accepting_facility_id,
            accepting_facility_name=acc_fac.name if acc_fac else None,
            quantity_fulfilled=req.quantity_fulfilled or 0,
            distance_km=req.distance_km,
            eta_minutes=req.eta_minutes,
            created_at=req.created_at,
            resolved_at=req.resolved_at,
            matched_donors=matched_donors
        ))

    return results

@router.post("/{request_id}/accept", response_model=EmergencyRequestResponse)
def accept_emergency_request(
    request_id: str,
    payload: EmergencyRequestAccept,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sos = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="Emergency request not found")

    if sos.status in ["IN_TRANSIT", "FULFILLED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Emergency request '{request_id}' has already been accepted/dispatched by facility '{sos.accepting_facility_id}'."
        )

    if payload.quantity_fulfilled <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity fulfilled must be a positive number greater than 0."
        )

    donor_fac = db.query(Facility).filter(Facility.id == payload.accepting_facility_id).first()
    if not donor_fac:
        raise HTTPException(status_code=404, detail="Accepting donor facility not found")

    enforce_facility_access(current_user, donor_fac.id, db)

    # Validate and deduct from donor inventory if registered
    med = db.query(Medicine).filter(Medicine.name.ilike(f"%{sos.item_name.split()[0]}%")).first()
    if med:
        donor_inv = db.query(Inventory).filter(
            Inventory.facility_id == donor_fac.id,
            Inventory.medicine_id == med.id,
            Inventory.quantity > 0
        ).order_by(Inventory.expiry_date.asc()).first()
        if donor_inv:
            if donor_inv.quantity < payload.quantity_fulfilled:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient inventory at donor facility {donor_fac.name}. Available: {donor_inv.quantity}, requested: {payload.quantity_fulfilled}"
                )
            donor_inv.quantity -= payload.quantity_fulfilled

    req_fac = db.query(Facility).filter(Facility.id == sos.requesting_facility_id).first()
    
    dist_km = _calculate_haversine_distance(
        req_fac.latitude, req_fac.longitude,
        donor_fac.latitude, donor_fac.longitude
    ) if req_fac else 25.0

    eta = int(round((dist_km / 45.0) * 60.0 + 15.0))

    sos.status = "IN_TRANSIT"
    sos.accepting_facility_id = donor_fac.id
    sos.quantity_fulfilled = payload.quantity_fulfilled
    sos.distance_km = dist_km
    sos.eta_minutes = eta
    sos.resolved_at = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

    # Post confirmation notification
    notif = Notification(
        id=f"NOTIF-{uuid.uuid4().hex[:8]}",
        type="redistribution",
        title=f"✅ SOS Accepted: {donor_fac.name} Dispatched {payload.quantity_fulfilled} {sos.item_name}",
        message=f"Emergency dispatch in transit to {req_fac.name if req_fac else 'PHC'}. Distance: {dist_km} km, Estimated ETA: {eta} minutes.",
        severity="info",
        facility_id=sos.requesting_facility_id,
        read_status=False
    )
    db.add(notif)
    db.commit()
    db.refresh(sos)

    # Recalculate ML forecasts and risks after emergency stock dispatch
    from app.services.forecasting.engine import ForecastingEngine
    ForecastingEngine.refresh_all_forecasts(db)

    return EmergencyRequestResponse(
        id=sos.id,
        requesting_facility_id=sos.requesting_facility_id,
        requesting_facility_name=req_fac.name if req_fac else None,
        requesting_state=req_fac.state if req_fac else None,
        requesting_district=req_fac.district if req_fac else None,
        item_name=sos.item_name,
        quantity_needed=sos.quantity_needed,
        urgency=sos.urgency,
        incident_description=sos.incident_description,
        status=sos.status,
        accepting_facility_id=donor_fac.id,
        accepting_facility_name=donor_fac.name,
        quantity_fulfilled=sos.quantity_fulfilled,
        distance_km=sos.distance_km,
        eta_minutes=sos.eta_minutes,
        created_at=sos.created_at,
        resolved_at=sos.resolved_at
    )
