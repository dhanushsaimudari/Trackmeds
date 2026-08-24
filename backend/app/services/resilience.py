import datetime
from typing import Dict, Any, List
from app.config import settings

class FacilityResilienceEngine:
    """
    Transparent, Deterministic, Explainable Facility & Regional Resilience Score Engine.
    
    Formula:
    Facility Resilience (0-100) =
        0.35 * Medicine Stability Score (0-100) +
        0.25 * Bed Availability Score (0-100) +
        0.25 * Personnel Availability Score (0-100) +
        0.15 * Supply Chain Risk Score (0-100)
    """

    @staticmethod
    def calculate_facility_resilience(
        critical_meds_count: int,
        total_meds_monitored: int,
        total_beds: int,
        occupied_beds: int,
        doctors_req: int,
        doctors_avail: int,
        nurses_req: int,
        nurses_avail: int,
        support_req: int,
        support_avail: int,
        climate_risk_severity: str = "Low"
    ) -> Dict[str, Any]:
        
        # 1. Medicine Availability Score (Weight: 35%)
        # Base 100, deducting for each critical medicine forecast
        med_score = max(0.0, 100.0 - (critical_meds_count * 18.0))
        med_score = min(100.0, med_score)

        # 2. Bed Availability Score (Weight: 25%)
        total_beds_safe = max(1, total_beds)
        occupied_beds_safe = min(total_beds_safe, max(0, occupied_beds))
        occupancy_rate = (occupied_beds_safe / total_beds_safe) * 100.0
        
        # Bed score is inverse of occupancy rate
        bed_score = max(0.0, 100.0 - occupancy_rate)
        bed_score = min(100.0, bed_score)

        # Determine Bed Status
        if occupancy_rate > settings.BED_CRITICAL_THRESHOLD:
            bed_status = "CRITICAL"
        elif occupancy_rate >= settings.BED_WARNING_THRESHOLD:
            bed_status = "WARNING"
        else:
            bed_status = "NORMAL"

        # 3. Personnel Availability Score (Weight: 25%)
        total_req = max(1, doctors_req + nurses_req + support_req)
        total_avail = max(0, doctors_avail + nurses_avail + support_avail)
        staffing_pct = min(100.0, (total_avail / total_req) * 100.0)
        
        staff_score = staffing_pct

        # Determine Staff Status
        if staffing_pct < settings.STAFF_CRITICAL_THRESHOLD:
            staff_status = "CRITICAL"
        elif staffing_pct <= settings.STAFF_WARNING_THRESHOLD:
            staff_status = "WARNING"
        else:
            staff_status = "HEALTHY"

        # 4. Supply Chain Climate Risk Score (Weight: 15%)
        severity_map = {
            "Extreme": 30.0,
            "High": 55.0,
            "Moderate": 80.0,
            "Low": 100.0
        }
        supply_risk_score = severity_map.get(climate_risk_severity, 90.0)

        # Calculate Overall Resilience Score (0-100)
        overall_score = round(
            (0.35 * med_score) +
            (0.25 * bed_score) +
            (0.25 * staff_score) +
            (0.15 * supply_risk_score),
            1
        )
        overall_score = max(0.0, min(100.0, overall_score))

        # Determine Facility Status
        if overall_score >= 80.0:
            status = "Healthy"
        elif overall_score >= 60.0:
            status = "Warning"
        else:
            status = "Critical"

        # Generate Main Factors / Key Drivers
        main_factors: List[str] = []
        if critical_meds_count > 0:
            main_factors.append(f"{critical_meds_count} essential medicine(s) at critical stockout risk (< 7 days buffer)")
        else:
            main_factors.append("Medicine inventory levels within safe operational buffers")

        if bed_status == "CRITICAL":
            main_factors.append(f"Critical bed occupancy at {occupancy_rate:.1f}% (Capacity threshold > {settings.BED_CRITICAL_THRESHOLD:.0f}%)")
        elif bed_status == "WARNING":
            main_factors.append(f"Elevated bed occupancy at {occupancy_rate:.1f}%")
        else:
            main_factors.append(f"Normal bed occupancy at {occupancy_rate:.1f}% ({total_beds_safe - occupied_beds_safe} beds available)")

        nurse_pct = (nurses_avail / max(1, nurses_req)) * 100.0
        if staff_status == "CRITICAL":
            main_factors.append(f"Severe medical staffing shortage ({staffing_pct:.1f}% overall, Nurse ratio {nurse_pct:.0f}%)")
        elif staff_status == "WARNING":
            main_factors.append(f"Moderate staffing constraints ({staffing_pct:.1f}% overall availability)")
        else:
            main_factors.append(f"Adequate medical personnel attendance ({staffing_pct:.1f}%)")

        if climate_risk_severity in ["High", "Extreme"]:
            main_factors.append(f"External climate shock detected ({climate_risk_severity} severity alert)")

        return {
            "overall_score": overall_score,
            "status": status,
            "components": {
                "medicine_stability_score": round(med_score, 1),
                "bed_availability_score": round(bed_score, 1),
                "personnel_availability_score": round(staff_score, 1),
                "supply_chain_risk_score": round(supply_risk_score, 1)
            },
            "bed_metrics": {
                "total_beds": total_beds_safe,
                "occupied_beds": occupied_beds_safe,
                "available_beds": max(0, total_beds_safe - occupied_beds_safe),
                "occupancy_rate": round(occupancy_rate, 1),
                "status": bed_status
            },
            "staff_metrics": {
                "doctors_required": doctors_req,
                "doctors_available": doctors_avail,
                "nurses_required": nurses_req,
                "nurses_available": nurses_avail,
                "support_required": support_req,
                "support_available": support_avail,
                "staffing_percentage": round(staffing_pct, 1),
                "status": staff_status
            },
            "main_factors": main_factors
        }
