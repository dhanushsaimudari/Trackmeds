import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.all_models import Facility, Medicine, Inventory, Consumption, Forecast, ExternalSignal

class ForecastingEngine:
    """
    Predictive analytical engine for health supply chain stockout risk calculation.
    Combines moving average historical consumption, seasonality factors,
    and external environmental/weather risk multipliers.
    """
    
    @staticmethod
    def run_forecast_for_facility(db: Session, facility_id: str, medicine_id: str) -> dict:
        today = datetime.date.today()
        start_date = today - datetime.timedelta(days=30)
        
        # 1. Fetch historical consumption (past 30 days)
        consumptions = db.query(Consumption).filter(
            Consumption.facility_id == facility_id,
            Consumption.medicine_id == medicine_id,
            Consumption.date >= start_date
        ).all()
        
        total_used = sum(c.quantity_used for c in consumptions)
        days_logged = len(set(c.date for c in consumptions)) or 1
        base_daily_demand = max(total_used / max(days_logged, 1), 5.0)  # Default min daily usage
        
        # 2. Check total current inventory for facility + medicine
        inventories = db.query(Inventory).filter(
            Inventory.facility_id == facility_id,
            Inventory.medicine_id == medicine_id,
            Inventory.quantity > 0
        ).all()
        current_stock = sum(inv.quantity for inv in inventories)
        
        # 3. Fetch external weather signal for facility district/country
        facility = db.query(Facility).filter(Facility.id == facility_id).first()
        weather_multiplier = 1.0
        if facility:
            signal = db.query(ExternalSignal).filter(
                ExternalSignal.region == facility.district
            ).order_by(ExternalSignal.timestamp.desc()).first()
            
            if signal:
                if signal.severity == "Extreme":
                    weather_multiplier = 1.45
                elif signal.severity == "High":
                    weather_multiplier = 1.25
                elif signal.severity == "Moderate":
                    weather_multiplier = 1.10
        
        # 4. Seasonality adjustment (e.g. current month factor)
        current_month = today.month
        seasonality_factor = 1.15 if current_month in [6, 7, 8, 9] else 1.0  # Monsoon/Summer surge
        
        # 5. Final predicted daily demand
        predicted_daily_demand = round(base_daily_demand * seasonality_factor * weather_multiplier, 1)
        
        # 6. Days until stockout & predicted date
        if predicted_daily_demand > 0:
            days_to_stockout = int(current_stock / predicted_daily_demand)
        else:
            days_to_stockout = 999
            
        predicted_stockout_date = today + datetime.timedelta(days=days_to_stockout)
        
        # 7. Risk level categorization
        if days_to_stockout <= 5:
            risk_level = "Critical"
            stockout_prob = 0.95
        elif days_to_stockout <= 12:
            risk_level = "High"
            stockout_prob = 0.75
        elif days_to_stockout <= 25:
            risk_level = "Medium"
            stockout_prob = 0.40
        else:
            risk_level = "Low"
            stockout_prob = 0.10
            
        confidence = 0.88 if days_logged >= 20 else 0.75
        
        return {
            "facility_id": facility_id,
            "medicine_id": medicine_id,
            "current_stock": current_stock,
            "predicted_daily_demand": predicted_daily_demand,
            "days_until_stockout": days_to_stockout,
            "predicted_stockout_date": predicted_stockout_date,
            "stockout_probability": stockout_prob,
            "confidence": confidence,
            "risk_level": risk_level
        }

    @staticmethod
    def refresh_all_forecasts(db: Session):
        facilities = db.query(Facility).all()
        medicines = db.query(Medicine).all()
        
        for fac in facilities:
            for med in medicines:
                result = ForecastingEngine.run_forecast_for_facility(db, fac.id, med.id)
                
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
                    existing.generated_at = datetime.datetime.utcnow()
                else:
                    new_fc = Forecast(
                        id=f"FC-{fac.id}-{med.id}",
                        facility_id=fac.id,
                        medicine_id=med.id,
                        predicted_daily_demand=result["predicted_daily_demand"],
                        predicted_stockout_date=result["predicted_stockout_date"],
                        stockout_probability=result["stockout_probability"],
                        confidence=result["confidence"],
                        risk_level=result["risk_level"]
                    )
                    db.add(new_fc)
        db.commit()
