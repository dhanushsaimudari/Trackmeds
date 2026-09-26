import datetime
import numpy as np
from typing import Dict, Any, List
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sqlalchemy.orm import Session
from app.models.all_models import Facility, Medicine, Inventory, Consumption, ExternalSignal

class MLDemandForecaster:
    """
    Modular Traditional Machine Learning Demand Forecasting Service.
    Uses Scikit-Learn Random Forest & Linear Regression on structured historical consumption,
    facility demographics, rolling statistics, calendar seasonality, and environmental signals.
    """

    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
        self._is_trained = False

    def extract_features(
        self,
        facility: Facility,
        medicine: Medicine,
        consumptions: List[Consumption],
        signal: ExternalSignal = None,
        target_date: datetime.date = None
    ) -> np.ndarray:
        """
        Extracts tabular ML feature vector for demand prediction.
        """
        if target_date is None:
            target_date = datetime.date.today()

        # 1. Historical consumption metrics (last 30 days)
        if consumptions:
            quantities = [c.quantity_used for c in consumptions]
            mean_7d = np.mean(quantities[-7:]) if len(quantities) >= 7 else np.mean(quantities)
            mean_30d = np.mean(quantities)
            std_30d = np.std(quantities) if len(quantities) > 1 else 2.0
            
            # Trend slope (last 7 days vs previous 7 days)
            if len(quantities) >= 14:
                recent_7 = np.mean(quantities[-7:])
                prev_7 = np.mean(quantities[-14:-7])
                trend_slope = (recent_7 - prev_7) / max(1.0, prev_7)
            else:
                trend_slope = 0.0
        else:
            mean_7d = 35.0
            mean_30d = 30.0
            std_30d = 5.0
            trend_slope = 0.0

        # 2. Calendar / Seasonality
        day_of_week = target_date.weekday()
        month = target_date.month
        is_monsoon_season = 1 if month in [6, 7, 8, 9] else 0

        # 3. Facility Demographics & Footfall Telemetry
        pop_served = (facility.population_served or 50000) / 100000.0  # Normalized
        facility_capacity = (facility.capacity or 40) / 100.0
        
        # Patient footfall surge signal (e.g., 160 visits vs 100 baseline = 1.6x surge)
        curr_footfall = float(facility.daily_footfall or 100)
        base_footfall = max(1.0, float(facility.baseline_footfall or 100))
        footfall_surge_ratio = curr_footfall / base_footfall
        normalized_footfall = curr_footfall / 500.0

        # 4. Climate / Anomaly Signal
        climate_severity_val = 0.0
        if signal:
            if signal.severity == "Extreme":
                climate_severity_val = 1.0
            elif signal.severity == "High":
                climate_severity_val = 0.7
            elif signal.severity == "Moderate":
                climate_severity_val = 0.4

        # 5. Medicine Criticality / Category feature encoding (Deterministic map, zero hash-randomization)
        category_map = {
            "Antibiotics": 0.1,
            "Rehydration": 0.2,
            "Insulin": 0.3,
            "Vaccines": 0.4,
            "Analgesics": 0.5,
            "Maternal": 0.6,
            "Cardiovascular": 0.7,
            "Respiratory": 0.8
        }
        med_category_code = category_map.get(medicine.category, 0.5)

        features = np.array([
            mean_7d,
            mean_30d,
            std_30d,
            trend_slope,
            day_of_week,
            month,
            is_monsoon_season,
            pop_served,
            facility_capacity,
            footfall_surge_ratio,
            normalized_footfall,
            climate_severity_val,
            med_category_code
        ])
        return features

    def train_online(self, db: Session):
        """
        Trains/fits the ML model dynamically on historical consumption records in the DB.
        Guarantees zero target leakage by partitioning strictly into prior windows.
        """
        consumptions = db.query(Consumption).order_by(Consumption.date.asc()).all()
        if len(consumptions) < 20:
            self._is_trained = False
            return

        X_list = []
        y_list = []

        # Group consumption by facility + medicine
        facility_map = {f.id: f for f in db.query(Facility).all()}
        medicine_map = {m.id: m for m in db.query(Medicine).all()}
        signal_map = {s.region: s for s in db.query(ExternalSignal).all()}

        # Group historical consumption series by (facility_id, medicine_id)
        from collections import defaultdict
        history_map = defaultdict(list)
        for c in consumptions:
            history_map[(c.facility_id, c.medicine_id)].append(c)

        # Sample historical windows (X, y) without target leakage
        for (fac_id, med_id), c_list in history_map.items():
            if len(c_list) < 8:
                continue
            fac = facility_map.get(fac_id)
            med = medicine_map.get(med_id)
            if not fac or not med:
                continue
            sig = signal_map.get(fac.district)

            # Slide window: use prior 7 to 30 days to predict next day
            for idx in range(7, len(c_list), 3):
                target_record = c_list[idx]
                prior_records = c_list[max(0, idx - 30):idx]
                feats = self.extract_features(fac, med, prior_records, sig, target_record.date)
                X_list.append(feats)
                y_list.append(target_record.quantity_used)

        if len(X_list) >= 10:
            X = np.array(X_list)
            y = np.array(y_list)
            self.model.fit(X, y)
            self._is_trained = True

    def predict_daily_demand(
        self,
        db: Session,
        facility: Facility,
        medicine: Medicine,
        current_stock: int
    ) -> Dict[str, Any]:
        """
        Generates ML numerical forecast for daily medicine demand.
        Integrates local Random Forest model with global decentralized Federated Learning weights.
        """
        import json
        from app.models.all_models import FederatedRound

        today = datetime.date.today()

        # Fetch historical consumption for this facility & medicine
        start_date = today - datetime.timedelta(days=30)
        consumptions = db.query(Consumption).filter(
            Consumption.facility_id == facility.id,
            Consumption.medicine_id == medicine.id,
            Consumption.date >= start_date
        ).order_by(Consumption.date.asc()).all()

        # Fetch external climate signal
        signal = db.query(ExternalSignal).filter(
            ExternalSignal.region == facility.district
        ).order_by(ExternalSignal.timestamp.desc()).first()

        # Extract ML feature vector
        feats = self.extract_features(facility, medicine, consumptions, signal, today)

        if not self._is_trained:
            self.train_online(db)

        curr_footfall = float(facility.daily_footfall or 100)
        base_footfall = max(1.0, float(facility.baseline_footfall or 100))
        surge_ratio = curr_footfall / base_footfall

        if self._is_trained:
            pred_local = float(self.model.predict(feats.reshape(1, -1))[0])
            if surge_ratio > 1.1:
                pred_local = pred_local * (0.5 + 0.5 * surge_ratio)
        else:
            # Baseline deterministic ML estimate
            mean_usage = np.mean([c.quantity_used for c in consumptions]) if consumptions else 35.0
            mult = 1.35 if (signal and signal.severity in ["High", "Extreme"]) else 1.0
            pred_local = float(mean_usage * mult * surge_ratio)

        # Blend with Decentralized Federated Learning Global Model Weights
        latest_fed_round = db.query(FederatedRound).order_by(FederatedRound.round_number.desc()).first()
        fed_blended = False
        pred_demand = pred_local

        if latest_fed_round and latest_fed_round.model_weights_json:
            try:
                fed_weights = json.loads(latest_fed_round.model_weights_json)
                # Feature weights for top 5 parameters: rolling_7d, rolling_30d, trend, footfall, climate
                w_7d = fed_weights.get("rolling_7d_mean", 0.40)
                w_30d = fed_weights.get("rolling_30d_mean", 0.28)
                w_trend = fed_weights.get("trend_slope", 0.14)
                w_surge = fed_weights.get("daily_footfall_ratio", 0.35)
                w_clim = fed_weights.get("climate_severity", 0.22)

                fed_score = (
                    feats[0] * w_7d +
                    feats[1] * w_30d +
                    (feats[3] * 10.0) * w_trend +
                    (surge_ratio * 20.0) * w_surge +
                    (feats[11] * 15.0) * w_clim
                )
                # 70% local model + 30% federated global intelligence
                pred_demand = 0.70 * pred_local + 0.30 * max(5.0, fed_score)
                fed_blended = True
            except Exception:
                pred_demand = pred_local

        # Enforce minimum positive threshold
        pred_demand = round(max(pred_demand, 5.0), 1)

        # Calculate stockout horizon
        days_to_stockout = int(current_stock / pred_demand) if pred_demand > 0 else 999
        predicted_stockout_date = today + datetime.timedelta(days=days_to_stockout)

        # Calculate error estimate & confidence metric
        days_logged = len(set(c.date for c in consumptions))
        confidence = round(min(0.95, 0.70 + (days_logged / 100.0)), 2)
        error_margin = round(pred_demand * (1.0 - confidence), 1)

        return {
            "predicted_daily_demand": pred_demand,
            "days_until_stockout": days_to_stockout,
            "predicted_stockout_date": predicted_stockout_date,
            "confidence": confidence,
            "error_margin": error_margin,
            "features_used": {
                "rolling_7d_mean": round(float(feats[0]), 1),
                "trend_slope": round(float(feats[3]), 2),
                "daily_footfall": int(curr_footfall),
                "footfall_surge_ratio": round(surge_ratio, 2),
                "climate_severity": signal.severity if signal else "None"
            }
        }


# Singleton ML Forecaster instance
forecaster_service = MLDemandForecaster()
