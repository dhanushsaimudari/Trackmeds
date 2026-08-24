import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import SessionLocal
from app.seed import seed_database
from app.services.resilience import FacilityResilienceEngine

class TestTrackMedsPlatform(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Seed test database once
        db = SessionLocal()
        seed_database(db)
        db.close()
        cls.client = TestClient(app)

    def test_01_notifications_endpoint(self):
        res = self.client.get("/api/notifications")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)

    def test_02_facilities_bed_and_staff_visibility(self):
        res = self.client.get("/api/facilities?country=India")
        self.assertEqual(res.status_code, 200)
        facs = res.json()
        self.assertGreater(len(facs), 0)

        f = facs[0]
        self.assertIn("total_beds", f)
        self.assertIn("occupied_beds", f)
        self.assertIn("occupancy_rate", f)
        self.assertIn("bed_risk_status", f)
        self.assertIn("doctors_available", f)
        self.assertIn("nurses_available", f)
        self.assertIn("staffing_percentage", f)
        self.assertIn("staff_risk_status", f)
        self.assertIn("resilience_score", f)
        self.assertIn("main_factors", f)

    def test_03_facility_bed_update_endpoint(self):
        fac_id = "FAC-IN-101"
        res = self.client.put(f"/api/facilities/{fac_id}/beds", json={
            "occupied_beds": 38,
            "total_beds": 40
        })
        self.assertEqual(res.status_code, 200)
        f = res.json()
        self.assertEqual(f["occupied_beds"], 38)
        self.assertEqual(f["total_beds"], 40)
        self.assertEqual(f["occupancy_rate"], 95.0)
        self.assertEqual(f["bed_risk_status"], "CRITICAL")

    def test_04_facility_staff_update_endpoint(self):
        fac_id = "FAC-IN-101"
        res = self.client.put(f"/api/facilities/{fac_id}/staff", json={
            "doctors_available": 6,
            "nurses_available": 12,
            "support_available": 10
        })
        self.assertEqual(res.status_code, 200)
        f = res.json()
        self.assertEqual(f["doctors_available"], 6)
        self.assertEqual(f["nurses_available"], 12)
        self.assertIn("staffing_percentage", f)

    def test_05_dashboard_summary(self):
        res = self.client.get("/api/dashboard/summary?country=India")
        self.assertEqual(res.status_code, 200)
        d = res.json()
        self.assertGreaterEqual(d["facilities_monitored"], 1)
        self.assertGreaterEqual(d["medicines_tracked"], 1)
        self.assertIn("total_regional_beds", d)
        self.assertIn("occupied_regional_beds", d)
        self.assertIn("regional_bed_occupancy_pct", d)
        self.assertIn("total_doctors_available", d)
        self.assertIn("total_nurses_available", d)
        self.assertIn("resilience_score", d)

    def test_06_deterministic_resilience_engine(self):
        score_data = FacilityResilienceEngine.calculate_facility_resilience(
            critical_meds_count=1,
            total_meds_monitored=12,
            total_beds=100,
            occupied_beds=50, # 50% occupancy -> bed score 50
            doctors_req=10,
            doctors_avail=9,
            nurses_req=20,
            nurses_avail=18,
            support_req=10,
            support_avail=9, # 36/40 = 90% staff score
            climate_risk_severity="Low" # 100 risk score
        )
        # Expected: 0.35*(82) + 0.25*(50) + 0.25*(90) + 0.15*(100) = 28.7 + 12.5 + 22.5 + 15 = 78.7
        self.assertAlmostEqual(score_data["overall_score"], 78.7, delta=1.5)
        self.assertIn("status", score_data)
        self.assertIn("main_factors", score_data)

    def test_07_emergency_scenario_load_and_reset(self):
        # 1. Trigger Scenario
        res_load = self.client.post("/api/demo/load-emergency-scenario")
        self.assertEqual(res_load.status_code, 200)
        data = res_load.json()
        self.assertEqual(data["status"], "success")

        # Verify shock details in summary
        res_sum = self.client.get("/api/dashboard/summary?country=India")
        self.assertEqual(res_sum.status_code, 200)
        d = res_sum.json()
        self.assertTrue(d["health_supply_shock_detected"])

        # 2. Reset Database
        res_reset = self.client.post("/api/demo/reset-database")
        self.assertEqual(res_reset.status_code, 200)
        self.assertEqual(res_reset.json()["status"], "success")

    def test_08_scenario_simulator_api(self):
        res = self.client.post("/api/scenario/simulate", json={
            "demand_increase_pct": 50.0,
            "weather_severity": "High",
            "outbreak_severity": "Moderate",
            "transport_disruption": 15.0,
            "supplier_delay_days": 5,
            "country": "India"
        })
        self.assertEqual(res.status_code, 200)
        d = res.json()
        self.assertGreater(d["before_interventions_facilities_at_risk"], 0)
        self.assertGreater(d["estimated_cost_saved"], 0)
        self.assertIsInstance(d["facilities_comparison"], list)

    def test_09_fefo_redistribution_recommendations(self):
        res = self.client.get("/api/redistribution/recommendations?country=India")
        self.assertEqual(res.status_code, 200)
        recs = res.json()
        self.assertIsInstance(recs, list)

    def test_10_gemini_copilot_grounded_questions(self):
        # Test Bed question
        res_bed = self.client.post("/api/ai/ask", json={"question": "What is the bed occupancy rate in Maharashtra?", "country": "India"})
        self.assertEqual(res_bed.status_code, 200)
        self.assertIn("occupancy", res_bed.json()["answer"].lower())

        # Test Staff question
        res_staff = self.client.post("/api/ai/ask", json={"question": "Which facilities have medical staff shortages?", "country": "India"})
        self.assertEqual(res_staff.status_code, 200)
        ans_staff = res_staff.json()["answer"].lower()
        self.assertTrue(any(w in ans_staff for w in ["staff", "personnel", "doctor", "nurse"]))

        # Test Resilience question
        res_res = self.client.post("/api/ai/ask", json={"question": "Why is the facility resilience score low?", "country": "India"})
        self.assertEqual(res_res.status_code, 200)
        self.assertIn("resilience", res_res.json()["answer"].lower())

    def test_11_privacy_safeguards(self):
        # Verify no PII fields in API responses
        res = self.client.get("/api/facilities")
        self.assertEqual(res.status_code, 200)
        raw_text = res.text.lower()
        self.assertNotIn("patient", raw_text)
        self.assertNotIn("ssn", raw_text)
        self.assertNotIn("diagnosis", raw_text)

if __name__ == "__main__":
    unittest.main()
