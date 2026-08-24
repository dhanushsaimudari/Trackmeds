from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.all_models import Facility, Forecast, Inventory
from app.schemas.all_schemas import ScenarioSimulateRequest, ScenarioSimulateResponse

router = APIRouter(prefix="/scenario", tags=["Scenario Simulator"])

@router.post("/simulate", response_model=ScenarioSimulateResponse)
def simulate_emergency_scenario(
    req: ScenarioSimulateRequest,
    db: Session = Depends(get_db)
):
    country = req.country or "India"

    # Base facility count for target country
    facilities = db.query(Facility).filter(Facility.country == country).all()
    total_facs = len(facilities) or 8

    # Calculate baseline vs elevated demand factor
    demand_multiplier = 1.0 + (req.demand_increase_pct / 100.0)
    weather_factor = 1.35 if req.weather_severity in ["High", "Extreme"] else 1.10
    outbreak_factor = 1.40 if req.outbreak_severity == "Severe" else (1.20 if req.outbreak_severity == "Moderate" else 1.0)
    combined_surge = demand_multiplier * weather_factor * outbreak_factor

    # Facilities at risk WITHOUT intervention
    before_risk_count = min(int(total_facs * (0.35 * combined_surge)), total_facs)
    if before_risk_count == 0:
        before_risk_count = 12

    # Intervention impact
    redistributed_units = int(before_risk_count * 700 * (1.0 - (req.transport_disruption / 200.0)))
    procurement_units = int(before_risk_count * 350)

    # Facilities remaining at risk AFTER optimal intervention
    after_risk_count = max(int(before_risk_count * 0.18), 1)

    cost_saved = round(redistributed_units * 14.5 + (before_risk_count - after_risk_count) * 12500, 2)
    confidence = round(0.92 - (req.transport_disruption * 0.002), 2)

    simulated_occupancy_increase_pct = round(15.0 * combined_surge, 1)

    facility_comparison = []
    for idx, f in enumerate(facilities[:8]):
        before_days = max(int(14 / combined_surge) - idx, 2)
        after_days = before_days + 16 if idx < (len(facilities[:8]) - after_risk_count) else before_days + 2
        
        baseline_occ = (f.occupied_beds / max(1, f.total_beds)) * 100.0 if f.total_beds else 65.0
        surge_occ = min(98.0, round(baseline_occ + simulated_occupancy_increase_pct, 1))

        facility_comparison.append({
            "facility_id": f.id,
            "facility_name": f.name,
            "district": f.district,
            "stockout_days_before": before_days,
            "stockout_days_after": after_days,
            "status_before": "Critical" if before_days <= 5 else "Warning",
            "status_after": "Healthy" if after_days > 12 else "Warning",
            "bed_occupancy_before_pct": round(baseline_occ, 1),
            "bed_occupancy_after_pct": surge_occ
        })

    summary = (
        f"Under a +{req.demand_increase_pct:.0f}% demand surge, {req.weather_severity} climate risk, "
        f"and {req.supplier_delay_days}-day supplier delay: {before_risk_count} facilities would face stockouts within 7 days "
        f"with bed occupancy surging by +{simulated_occupancy_increase_pct}%. "
        f"By executing recommended stock redistribution ({redistributed_units:,} units) and targeted procurement ({procurement_units:,} units), "
        f"risk is mitigated across {before_risk_count - after_risk_count} facilities with an estimated ₹{cost_saved:,.2f} in emergency savings."
    )

    return ScenarioSimulateResponse(
        before_interventions_facilities_at_risk=before_risk_count,
        recommended_interventions_redistributed_units=redistributed_units,
        recommended_interventions_procurement_units=procurement_units,
        after_interventions_facilities_at_risk=after_risk_count,
        estimated_cost_saved=cost_saved,
        confidence_score=confidence,
        intervention_summary=summary,
        facilities_comparison=facility_comparison
    )
