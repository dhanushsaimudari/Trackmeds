import datetime
from sqlalchemy.orm import Session
from app.models.all_models import Facility, Medicine, Inventory, Forecast, ExternalSignal
from app.services.ml.demand_forecast import forecaster_service
from app.services.ml.risk_classifier import risk_classifier_service

class ForecastingEngine:
    """
    Predictive analytical engine for health supply chain stockout risk calculation.
    Uses Machine Learning demand forecaster (Scikit-Learn) and Explainable Risk Classifier.
    """

    @staticmethod
    def run_forecast_for_facility(db: Session, facility_id: str, medicine_id: str) -> dict:
        today = datetime.date.today()

        facility = db.query(Facility).filter(Facility.id == facility_id).first()
        medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()

        if not facility or not medicine:
            return {}

        # 1. Total current inventory for facility + medicine
        inventories = db.query(Inventory).filter(
            Inventory.facility_id == facility_id,
            Inventory.medicine_id == medicine_id,
            Inventory.quantity > 0
        ).all()
        current_stock = sum(inv.quantity for inv in inventories)

        # 2. Run ML Demand Forecasting
        ml_result = forecaster_service.predict_daily_demand(db, facility, medicine, current_stock)

        predicted_daily_demand = ml_result["predicted_daily_demand"]
        days_to_stockout = ml_result["days_until_stockout"]
        predicted_stockout_date = ml_result["predicted_stockout_date"]
        confidence = ml_result["confidence"]

        # 3. Check climate signal
        signal = db.query(ExternalSignal).filter(
            ExternalSignal.region == facility.district
        ).order_by(ExternalSignal.timestamp.desc()).first()
        climate_severity = signal.severity if signal else "Low"

        # 4. Check expiring batches
        expiring_count = sum(1 for inv in inventories if (inv.expiry_date - today).days <= 45)

        # 5. Run Explainable Risk Classifier
        risk_res = risk_classifier_service.classify_risk(
            days_to_stockout=days_to_stockout,
            predicted_daily_demand=predicted_daily_demand,
            current_stock=current_stock,
            safety_stock=medicine.safety_stock_level,
            climate_severity=climate_severity,
            expiring_batches_count=expiring_count
        )

        return {
            "facility_id": facility_id,
            "medicine_id": medicine_id,
            "current_stock": current_stock,
            "predicted_daily_demand": predicted_daily_demand,
            "days_until_stockout": days_to_stockout,
            "predicted_stockout_date": predicted_stockout_date,
            "stockout_probability": risk_res["stockout_probability"],
            "confidence": confidence,
            "risk_level": risk_res["risk_level"],
            "risk_reason": risk_res["risk_reason"]
        }

    @staticmethod
    def refresh_all_forecasts(db: Session):
        facilities = db.query(Facility).all()
        medicines = db.query(Medicine).all()

        for fac in facilities:
            for med in medicines:
                result = ForecastingEngine.run_forecast_for_facility(db, fac.id, med.id)
                if not result:
                    continue

                existing = db.query(Forecast).filter(
                    Forecast.facility_id == fac.id,
                    Forecast.medicine_id == med.id
                ).first()

                if existing:
                    existing.predicted_daily_demand = result["predicted_daily_demand"]
                    existing.predicted_stockout_date = result["predicted_stockout_date"]
                    existing.stockout_probability = result["stockout_probability"]
                    existing.confidence = result["confidence"]
                    existing.risk_level = result["risk_level"]
                    existing.risk_reason = result["risk_reason"]
                    existing.generated_at = datetime.datetime.now(datetime.timezone.utc)
                else:
                    new_fc = Forecast(
                        id=f"FC-{fac.id}-{med.id}",
                        facility_id=fac.id,
                        medicine_id=med.id,
                        predicted_daily_demand=result["predicted_daily_demand"],
                        predicted_stockout_date=result["predicted_stockout_date"],
                        stockout_probability=result["stockout_probability"],
                        confidence=result["confidence"],
                        risk_level=result["risk_level"],
                        risk_reason=result["risk_reason"]
                    )
                    db.add(new_fc)
        db.commit()
