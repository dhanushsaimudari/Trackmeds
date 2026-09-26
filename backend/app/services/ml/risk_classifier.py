from typing import Dict, Any, List

class MLStockoutRiskClassifier:
    """
    Explainable Stockout Risk Classification Layer.
    Categorizes stockout risk into LOW, MEDIUM, HIGH, CRITICAL,
    and produces explicit human-readable operational rationales.
    """

    @staticmethod
    def classify_risk(
        days_to_stockout: int,
        predicted_daily_demand: float,
        current_stock: int,
        safety_stock: int,
        climate_severity: str = "Low",
        nearby_surplus_available: bool = False,
        expiring_batches_count: int = 0
    ) -> Dict[str, Any]:
        """
        Classifies risk level and constructs explainable rationale.
        """
        reasons: List[str] = []

        # 1. Evaluate stockout timeframe
        if days_to_stockout <= 5:
            risk_level = "Critical"
            stockout_prob = 0.95
            reasons.append(f"Projected stockout in {days_to_stockout} days")
        elif days_to_stockout <= 12:
            risk_level = "High"
            stockout_prob = 0.75
            reasons.append(f"Projected stockout in {days_to_stockout} days")
        elif days_to_stockout <= 25:
            risk_level = "Medium"
            stockout_prob = 0.40
            reasons.append(f"Stock buffer covers {days_to_stockout} days of demand")
        else:
            risk_level = "Low"
            stockout_prob = 0.10
            reasons.append(f"Healthy inventory buffer ({days_to_stockout} days remaining)")

        # 2. Safety stock deficit check
        if current_stock < safety_stock:
            reasons.append(f"Inventory ({current_stock} units) below safety threshold ({safety_stock} units)")

        # 3. Climate / External shock impact
        if climate_severity in ["High", "Extreme"]:
            reasons.append(f"Active {climate_severity} climate anomaly elevating regional demand")

        # 4. Nearby surplus availability & expiry intelligence
        if nearby_surplus_available:
            reasons.append("Nearby surplus facility identified for immediate redistribution")
        else:
            if risk_level in ["Critical", "High"]:
                reasons.append("No nearby internal surplus available; supplier replenishment required")

        if expiring_batches_count > 0:
            reasons.append(f"{expiring_batches_count} batch(es) approaching expiry within 45 days")

        # Build concise rationale string
        explanation_str = " + ".join(reasons)

        return {
            "risk_level": risk_level,
            "stockout_probability": stockout_prob,
            "risk_reason": explanation_str,
            "contributing_factors": reasons
        }


# Singleton Risk Classifier instance
risk_classifier_service = MLStockoutRiskClassifier()
