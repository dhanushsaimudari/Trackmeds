import math
import datetime
from sqlalchemy.orm import Session
from app.models.all_models import Facility, Medicine, Inventory, Forecast, Redistribution, Consumption

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates the great-circle distance between two points in km."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

class RedistributionOptimizer:
    """
    Multi-criteria stock redistribution & expiry waste prevention engine.
    Matches critical deficit facilities with nearby surplus/expiring stock hubs.
    """

    @staticmethod
    def generate_recommendations(db: Session, country_filter: str = None) -> list:
        today = datetime.date.today()
        recommendations = []

        # Fetch forecasts where stockout risk is Critical or High
        query = db.query(Forecast).join(Facility).filter(Forecast.risk_level.in_(["Critical", "High"]))
        if country_filter:
            query = query.filter(Facility.country == country_filter)
        
        deficit_forecasts = query.all()

        for df in deficit_forecasts:
            dest_facility = df.facility
            medicine = df.medicine
            daily_demand = df.predicted_daily_demand or 10.0

            # Total current inventory at destination
            dest_invs = db.query(Inventory).filter(
                Inventory.facility_id == dest_facility.id,
                Inventory.medicine_id == medicine.id
            ).all()
            dest_current_stock = sum(inv.quantity for inv in dest_invs)

            # Deficit needed to reach 20 days safety stock
            target_stock = int(daily_demand * 20)
            needed_quantity = max(target_stock - dest_current_stock, 300)

            # Search for candidate source facilities in same country
            candidate_sources = db.query(Facility).filter(
                Facility.id != dest_facility.id,
                Facility.country == dest_facility.country
            ).all()

            best_match = None
            best_score = -99999.0

            for src in candidate_sources:
                # Check source inventory for this medicine
                src_invs = db.query(Inventory).filter(
                    Inventory.facility_id == src.id,
                    Inventory.medicine_id == medicine.id,
                    Inventory.quantity > 0
                ).all()
                src_total_stock = sum(inv.quantity for inv in src_invs)

                if src_total_stock <= medicine.safety_stock_level:
                    continue  # Source cannot donate below safety stock

                # Surplus available at source
                available_surplus = src_total_stock - medicine.safety_stock_level
                if available_surplus < 100:
                    continue

                # Distance calculation
                dist_km = haversine_distance(
                    src.latitude, src.longitude,
                    dest_facility.latitude, dest_facility.longitude
                )
                if dist_km > 350:  # Max realistic transport radius for emergency redistribution
                    continue

                # Check if source has expiring batch
                expiring_batch = None
                expiry_bonus = 0.0
                for inv in src_invs:
                    days_left = (inv.expiry_date - today).days
                    if 10 <= days_left <= 60:
                        expiring_batch = inv
                        expiry_bonus = 50.0  # High priority to move expiring stock
                        break

                # Scoring function: Balance closeness, available surplus, and expiry urgency
                score = (100.0 - dist_km * 0.2) + (min(available_surplus, needed_quantity) * 0.1) + expiry_bonus

                if score > best_score:
                    best_score = score
                    transfer_qty = min(available_surplus, needed_quantity)
                    best_match = {
                        "source_facility": src,
                        "destination_facility": dest_facility,
                        "medicine": medicine,
                        "quantity": transfer_qty,
                        "distance_km": dist_km,
                        "expiring_batch": expiring_batch,
                        "estimated_waste_avoided": round(transfer_qty * medicine.unit_cost, 2)
                    }

            if best_match:
                src = best_match["source_facility"]
                med = best_match["medicine"]
                dist = best_match["distance_km"]
                qty = best_match["quantity"]
                val = best_match["estimated_waste_avoided"]

                exp_note = ""
                if best_match["expiring_batch"]:
                    exp_date_str = best_match["expiring_batch"].expiry_date.strftime("%Y-%m-%d")
                    exp_note = f" Prioritizes Batch #{best_match['expiring_batch'].batch_number} (expires {exp_date_str}) to prevent inventory wastage."

                reason = (
                    f"Redistribute {qty} units of {med.name} from {src.name} to {dest_facility.name} "
                    f"over {dist} km.{exp_note} Dest projected stockout in {df.predicted_stockout_date}. "
                    f"Estimated expiry waste avoided: ₹{val:,.2f}."
                )

                rec_id = f"RD-{src.id}-{dest_facility.id}-{med.id}"
                
                # Check if recommendation already exists in DB
                existing_rd = db.query(Redistribution).filter(Redistribution.id == rec_id).first()
                if not existing_rd:
                    new_rd = Redistribution(
                        id=rec_id,
                        source_facility_id=src.id,
                        destination_facility_id=dest_facility.id,
                        medicine_id=med.id,
                        quantity=qty,
                        distance_km=dist,
                        reason=reason,
                        status="Recommended"
                    )
                    db.add(new_rd)
                    db.commit()
                    db.refresh(new_rd)
                    existing_rd = new_rd

                recommendations.append({
                    "id": existing_rd.id,
                    "source_facility_id": src.id,
                    "source_facility_name": src.name,
                    "destination_facility_id": dest_facility.id,
                    "destination_facility_name": dest_facility.name,
                    "medicine_id": med.id,
                    "medicine_name": med.name,
                    "quantity": qty,
                    "distance_km": dist,
                    "reason": reason,
                    "status": existing_rd.status,
                    "estimated_waste_avoided_value": val,
                    "expiry_date": best_match["expiring_batch"].expiry_date if best_match["expiring_batch"] else None,
                    "created_at": existing_rd.created_at
                })

        return recommendations
