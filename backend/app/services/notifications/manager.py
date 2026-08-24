import datetime
from sqlalchemy.orm import Session
from app.models.all_models import Notification, Forecast, Inventory, Facility

class NotificationManager:
    """
    Automated notification generator for critical health supply chain events.
    """

    @staticmethod
    def generate_system_notifications(db: Session):
        today = datetime.date.today()

        # 1. Critical Stockout Forecast Notifications
        critical_forecasts = db.query(Forecast).filter(Forecast.risk_level == "Critical").all()
        for fc in critical_forecasts:
            fac = fc.facility
            med = fc.medicine
            days = (fc.predicted_stockout_date - today).days if fc.predicted_stockout_date else 4
            notif_id = f"NOTIF-SO-{fc.id}"

            existing = db.query(Notification).filter(Notification.id == notif_id).first()
            if not existing:
                notif = Notification(
                    id=notif_id,
                    type="stockout",
                    title=f"🔴 Critical Stockout Warning: {med.name}",
                    message=f"{fac.name} in {fac.district} is projected to run out of {med.name} in {days} days.",
                    severity="critical",
                    facility_id=fac.id,
                    read_status=False
                )
                db.add(notif)

        # 2. Expiry Risk Notifications (< 30 days to expiry)
        expiring_invs = db.query(Inventory).filter(
            Inventory.quantity > 0,
            Inventory.expiry_date <= (today + datetime.timedelta(days=30))
        ).all()
        for inv in expiring_invs:
            fac = inv.facility
            med = inv.medicine
            days_left = (inv.expiry_date - today).days
            notif_id = f"NOTIF-EXP-{inv.id}"

            existing = db.query(Notification).filter(Notification.id == notif_id).first()
            if not existing:
                notif = Notification(
                    id=notif_id,
                    type="expiry",
                    title=f"🟠 Expiry Risk: {med.name} (Batch #{inv.batch_number})",
                    message=f"{inv.quantity} units of {med.name} at {fac.name} expire in {days_left} days. Immediate redistribution recommended.",
                    severity="warning",
                    facility_id=fac.id,
                    read_status=False
                )
                db.add(notif)

        db.commit()
