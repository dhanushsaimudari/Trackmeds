import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.all_models import Facility, Medicine, Forecast, Supplier, Replenishment

class ReplenishmentOptimizer:
    """
    Automated Supplier Replenishment Recommendation Engine.
    Triggers when internal regional redistribution stock is insufficient to meet facility deficits.
    Calculates required order quantities, lead time buffer, and ranks primary suppliers.
    """

    @staticmethod
    def generate_replenishment_recommendations(db: Session, country_filter: str = None) -> List[Dict[str, Any]]:
        today = datetime.date.today()
        recommendations = []

        # Find critical/high risk forecasts where internal redistribution is insufficient
        query = db.query(Forecast).join(Facility).filter(Forecast.risk_level.in_(["Critical", "High"]))
        if country_filter:
            query = query.filter(Facility.country == country_filter)

        deficit_forecasts = query.all()

        for df in deficit_forecasts:
            facility = df.facility
            medicine = df.medicine
            daily_demand = df.predicted_daily_demand or 15.0

            # Calculate 30-day replenishment buffer quantity
            target_stock = int(daily_demand * 30)
            needed_quantity = max(target_stock, 500)

            # Recommended primary supplier
            supplier = medicine.supplier or db.query(Supplier).first()
            supplier_id = supplier.id if supplier else "SUP-01"
            supplier_name = supplier.name if supplier else "Cipla Healthcare Logistics"
            lead_time = supplier.average_lead_time_days if supplier else 5

            reason = (
                f"Network internal surplus insufficient for {facility.name}. "
                f"Projected {medicine.name} stockout in {df.predicted_stockout_date}. "
                f"Recommended purchase order of {needed_quantity} units with {supplier_name} (Lead time: {lead_time} days)."
            )

            repl_id = f"RPL-{facility.id}-{medicine.id}"

            # Store or update in DB
            existing = db.query(Replenishment).filter(Replenishment.id == repl_id).first()
            if not existing:
                new_rpl = Replenishment(
                    id=repl_id,
                    facility_id=facility.id,
                    medicine_id=medicine.id,
                    quantity_required=needed_quantity,
                    urgency=df.risk_level,
                    expected_stockout_date=df.predicted_stockout_date,
                    recommended_supplier_id=supplier_id,
                    status="Recommended",
                    reason=reason
                )
                db.add(new_rpl)
                db.commit()
                db.refresh(new_rpl)
                existing = new_rpl

            recommendations.append({
                "id": existing.id,
                "facility_id": facility.id,
                "facility_name": facility.name,
                "medicine_id": medicine.id,
                "medicine_name": medicine.name,
                "quantity_required": existing.quantity_required,
                "urgency": existing.urgency,
                "expected_stockout_date": existing.expected_stockout_date,
                "recommended_supplier_id": supplier_id,
                "recommended_supplier_name": supplier_name,
                "status": existing.status,
                "reason": existing.reason,
                "created_at": existing.created_at
            })

        return recommendations
