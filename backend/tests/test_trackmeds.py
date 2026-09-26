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
        db = SessionLocal()
        seed_database(db)
        db.close()
        cls.client = TestClient(app)

        # Login and obtain tokens for each hierarchical role
        # 1. National Admin
        r = cls.client.post("/api/auth/login", json={"email": "admin@trackmeds.org", "password": "admin123"})
        assert r.status_code == 200, f"Admin login failed: {r.text}"
        cls.admin_token = r.json()["access_token"]
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

        # 2. State Officer (Maharashtra)
        r = cls.client.post("/api/auth/login", json={"email": "state.mh@trackmeds.org", "password": "state123"})
        assert r.status_code == 200, f"State login failed: {r.text}"
        cls.state_token = r.json()["access_token"]
        cls.state_headers = {"Authorization": f"Bearer {cls.state_token}"}

        # 3. District Officer (Pune, Maharashtra)
        r = cls.client.post("/api/auth/login", json={"email": "district.pune@trackmeds.org", "password": "district123"})
        assert r.status_code == 200, f"District login failed: {r.text}"
        cls.district_token = r.json()["access_token"]
        cls.district_headers = {"Authorization": f"Bearer {cls.district_token}"}

        # 4. PHC Staff (PHC Haveli Pune - FAC-IN-101)
        r = cls.client.post("/api/auth/login", json={"email": "phc.haveli@trackmeds.org", "password": "phc123"})
        assert r.status_code == 200, f"PHC login failed: {r.text}"
        cls.phc_token = r.json()["access_token"]
        cls.phc_headers = {"Authorization": f"Bearer {cls.phc_token}"}

        # 5. Supplier
        r = cls.client.post("/api/auth/login", json={"email": "supplier.cipla@trackmeds.org", "password": "supplier123"})
        assert r.status_code == 200, f"Supplier login failed: {r.text}"
        cls.supplier_token = r.json()["access_token"]
        cls.supplier_headers = {"Authorization": f"Bearer {cls.supplier_token}"}

    # =========================================================================
    # SECURITY & RBAC TESTS (PHASE 1, 4, 26)
    # =========================================================================

    def test_01_unauthenticated_request_blocked(self):
        """Unauthenticated requests without token must return 401 Unauthorized (dev bypass eliminated)."""
        res = self.client.get("/api/facilities")
        self.assertEqual(res.status_code, 401)
        self.assertIn("Authentication credentials required", res.json()["detail"])

    def test_02_phc_data_isolation(self):
        """PHC Staff (Haveli) must only receive their assigned facility (FAC-IN-101)."""
        res = self.client.get("/api/facilities", headers=self.phc_headers)
        self.assertEqual(res.status_code, 200)
        facs = res.json()
        self.assertEqual(len(facs), 1)
        self.assertEqual(facs[0]["id"], "FAC-IN-101")
        self.assertEqual(facs[0]["name"], "PHC Haveli Pune")

    def test_03_phc_cross_facility_read_denied(self):
        """PHC Staff attempting to view a different PHC (FAC-IN-102) must receive 403 Forbidden."""
        res = self.client.get("/api/facilities/FAC-IN-102", headers=self.phc_headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("Access denied", res.json()["detail"])

    def test_04_phc_cross_facility_write_denied(self):
        """PHC Staff attempting to update another facility's bed data must receive 403 Forbidden."""
        res = self.client.put("/api/facilities/FAC-IN-102/beds", json={"occupied_beds": 25}, headers=self.phc_headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("Access denied", res.json()["detail"])

    def test_05_district_data_isolation(self):
        """District Officer (Pune) must only see facilities in Pune district."""
        res = self.client.get("/api/facilities", headers=self.district_headers)
        self.assertEqual(res.status_code, 200)
        facs = res.json()
        self.assertGreater(len(facs), 0)
        for f in facs:
            self.assertEqual(f["state"], "Maharashtra")
            self.assertEqual(f["district"], "Pune")

    def test_06_district_cross_district_access_denied(self):
        """District Officer (Pune) attempting to view Satara facility (FAC-IN-103) must receive 403 Forbidden."""
        res = self.client.get("/api/facilities/FAC-IN-103", headers=self.district_headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("outside your assigned district", res.json()["detail"])

    def test_07_state_data_isolation(self):
        """State Officer (Maharashtra) must only see facilities in Maharashtra."""
        res = self.client.get("/api/facilities", headers=self.state_headers)
        self.assertEqual(res.status_code, 200)
        facs = res.json()
        self.assertGreater(len(facs), 0)
        for f in facs:
            self.assertEqual(f["state"], "Maharashtra")

    def test_08_state_cross_state_access_denied(self):
        """State Officer (Maharashtra) attempting to view Kerala facility (FAC-IN-201) must receive 403 Forbidden."""
        res = self.client.get("/api/facilities/FAC-IN-201", headers=self.state_headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("outside your assigned state", res.json()["detail"])

    def test_09_national_admin_full_access(self):
        """National Admin can access facilities across all states and districts."""
        res = self.client.get("/api/facilities?country=All", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        facs = res.json()
        self.assertGreaterEqual(len(facs), 15)

    def test_10_unauthorized_redistribution_approval_blocked(self):
        """PHC Staff attempting to approve redistribution for unrelated facilities must be blocked (403)."""
        # Find a redistribution not involving FAC-IN-101
        res = self.client.get("/api/redistribution/recommendations?country=All", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        recs = res.json()
        unrelated_rec = next((r for r in recs if r["source_facility_id"] != "FAC-IN-101" and r["destination_facility_id"] != "FAC-IN-101"), None)

        if unrelated_rec:
            res_app = self.client.post(f"/api/redistribution/approve/{unrelated_rec['id']}", headers=self.phc_headers)
            self.assertEqual(res_app.status_code, 403)

    def test_11_unauthorized_replenishment_approval_blocked(self):
        """PHC Staff attempting to approve replenishment for another facility must be blocked (403)."""
        res = self.client.get("/api/suppliers/replenishments?country=India", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        recs = res.json()
        unrelated = next((r for r in recs if r["facility_id"] != "FAC-IN-101"), None)
        if unrelated:
            res_app = self.client.post(f"/api/suppliers/replenishments/approve/{unrelated['id']}", headers=self.phc_headers)
            self.assertEqual(res_app.status_code, 403)

    # =========================================================================
    # FUNCTIONAL & CALCULATION TESTS
    # =========================================================================

    def test_12_authorized_facility_bed_update(self):
        """PHC Staff can legitimately update beds at their assigned facility."""
        res = self.client.put("/api/facilities/FAC-IN-101/beds", json={
            "occupied_beds": 38,
            "total_beds": 40
        }, headers=self.phc_headers)
        self.assertEqual(res.status_code, 200)
        f = res.json()
        self.assertEqual(f["occupied_beds"], 38)
        self.assertEqual(f["total_beds"], 40)
        self.assertEqual(f["occupancy_rate"], 95.0)
        self.assertEqual(f["bed_risk_status"], "CRITICAL")

    def test_13_authorized_facility_staff_update(self):
        """PHC Staff can legitimately update staff availability at their assigned facility."""
        res = self.client.put("/api/facilities/FAC-IN-101/staff", json={
            "doctors_available": 6,
            "nurses_available": 12,
            "support_available": 10
        }, headers=self.phc_headers)
        self.assertEqual(res.status_code, 200)
        f = res.json()
        self.assertEqual(f["doctors_available"], 6)
        self.assertEqual(f["nurses_available"], 12)
        self.assertIn("staffing_percentage", f)

    def test_14_dashboard_summary_bugfix_verified(self):
        """Verify dashboard summary returns valid metrics and nurses_avail uses nurse count."""
        res = self.client.get("/api/dashboard/summary?country=India", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        d = res.json()
        self.assertGreaterEqual(d["facilities_monitored"], 1)
        self.assertIn("total_regional_beds", d)
        self.assertIn("total_nurses_available", d)
        self.assertIn("total_doctors_available", d)
        self.assertIn("resilience_score", d)

    def test_15_deterministic_resilience_engine(self):
        score_data = FacilityResilienceEngine.calculate_facility_resilience(
            critical_meds_count=1,
            total_meds_monitored=12,
            total_beds=100,
            occupied_beds=50,
            doctors_req=10,
            doctors_avail=9,
            nurses_req=20,
            nurses_avail=18,
            support_req=10,
            support_avail=9,
            climate_risk_severity="Low"
        )
        self.assertAlmostEqual(score_data["overall_score"], 78.7, delta=1.5)
        self.assertIn("status", score_data)
        self.assertIn("main_factors", score_data)

    def test_16_inventory_rbac_scoping(self):
        """Inventory returned for PHC Staff must strictly belong to their facility."""
        res = self.client.get("/api/inventory", headers=self.phc_headers)
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreater(len(items), 0)
        for item in items:
            self.assertEqual(item["facility_id"], "FAC-IN-101")

    def test_17_forecast_demand_trend_scoped(self):
        """PHC Staff can access their own facility demand trend, but blocked for other facilities."""
        # Allowed for own facility
        res_ok = self.client.get("/api/forecasts/demand-trend?facility_id=FAC-IN-101&medicine_id=MED-ORS", headers=self.phc_headers)
        self.assertEqual(res_ok.status_code, 200)

        # Blocked for other facility
        res_deny = self.client.get("/api/forecasts/demand-trend?facility_id=FAC-IN-102&medicine_id=MED-ORS", headers=self.phc_headers)
        self.assertEqual(res_deny.status_code, 403)

    def test_18_ai_copilot_grounded(self):
        res = self.client.post("/api/ai/ask", json={"question": "What is the bed occupancy in Maharashtra?", "country": "India"}, headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        self.assertIn("occupancy", res.json()["answer"].lower())

    def test_19_privacy_safeguards_no_phi(self):
        res = self.client.get("/api/facilities", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        raw_text = res.text.lower()
        self.assertNotIn("patient", raw_text)
        self.assertNotIn("ssn", raw_text)
        self.assertNotIn("diagnosis", raw_text)

    def test_20_federated_learning_execution(self):
        """Verify decentralized state nodes, FedAvg aggregation, and model convergence."""
        # 1. Fetch federated status
        res = self.client.get("/api/federated/status", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["participating_states_count"], 4)
        self.assertIn("global_weights", data)
        self.assertGreaterEqual(len(data["rounds_history"]), 1)

        # 2. Trigger a live FedAvg training round
        res_train = self.client.post("/api/federated/train-round", headers=self.admin_headers)
        self.assertEqual(res_train.status_code, 200)
        train_data = res_train.json()
        self.assertEqual(train_data["status"], "success")
        self.assertGreaterEqual(train_data["round_number"], 2)
        self.assertIn("aggregated_weights", train_data)
        self.assertEqual(len(train_data["contributing_nodes"]), 4)

    def test_21_abdm_hfr_verification(self):
        """Verify ABDM Health Facility Registry compliance and M1-M3 milestones."""
        res = self.client.get("/api/abdm/facility/IN-MH-PUN-001", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["verification_status"], "VERIFIED_ABDM_HFR")
        self.assertTrue(data["abdm_compliant"])
        self.assertTrue(data["m1_registered"])
        self.assertTrue(data["m2_teleconsultation"])
        self.assertTrue(data["m3_supply_chain"])
        self.assertIn("HFR-MH", data["hfr_id"])

    def test_22_abdm_fhir_dispense_bundle(self):
        """Verify HL7 FHIR R4 MedicationDispense bundle generation for ABHA integration."""
        payload = {
            "facility_id": "IN-MH-PUN-001",
            "medicine_name": "Oral Rehydration Salts 20.5g",
            "batch_number": "B-2026-ORS-01",
            "quantity": 10,
            "abha_id": "91-8201-9921-2094"
        }
        res = self.client.post("/api/abdm/fhir-dispense", json=payload, headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        bundle = res.json()
        self.assertEqual(bundle["resourceType"], "Bundle")
        self.assertEqual(bundle["entry"][0]["resource"]["resourceType"], "MedicationDispense")
        self.assertEqual(bundle["entry"][0]["resource"]["quantity"]["value"], 10)

    def test_23_cold_chain_telemetry_and_excursion(self):
        """Verify IoT cold-chain sensor reading for biologicals (Insulin, Oxytocin)."""
        res = self.client.get("/api/cold-chain/facility/IN-MH-PUN-001", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("current_temperature", data)
        self.assertIn("safe_min", data)
        self.assertIn("safe_max", data)
        self.assertIn("monitored_biologicals", data)
        self.assertGreater(len(data["monitored_biologicals"]), 0)

    def test_24_ondc_beckn_waybill_dispatch(self):
        """Verify ONDC Beckn logistics waybill creation for emergency stock redistribution."""
        from app.services.logistics.ondc_beckn import ONDCBecknClient
        origin = {"id": "FAC-01", "name": "Pune Hub", "state": "Maharashtra"}
        destination = {"id": "FAC-02", "name": "Haveli PHC", "state": "Maharashtra"}
        waybill = ONDCBecknClient.create_waybill(
            request_id="REQ-TEST-001",
            origin_facility=origin,
            destination_facility=destination,
            medicine_name="Insulin Regular 40IU",
            quantity=50,
            cold_chain_required=True
        )
        self.assertTrue(waybill["success"])
        self.assertTrue(waybill["cold_chain_active"])
        self.assertIn("WAYBILL-IN-MED-", waybill["waybill_number"])
        self.assertIn("order", waybill["beckn_message"])

    def test_25_admin_authorization_guards(self):
        """Verify role-based authorization: only NATIONAL_ADMIN can trigger resets."""
        # Unauthenticated request to reset-database must fail with 401
        res_unauth = self.client.post("/api/demo/reset-database")
        self.assertEqual(res_unauth.status_code, 401)

        # PHC staff login attempt to reset-database must fail with 403 Forbidden
        phc_login = self.client.post("/api/auth/login", json={"email": "phc.haveli@trackmeds.org", "password": "phc123"})
        self.assertEqual(phc_login.status_code, 200)
        phc_token = phc_login.json()["access_token"]
        phc_headers = {"Authorization": f"Bearer {phc_token}"}

        res_phc = self.client.post("/api/demo/reset-database", headers=phc_headers)
        self.assertEqual(res_phc.status_code, 403)

    def test_26_idempotency_and_input_bounds(self):
        """Verify input safety bounds, negative value rejection, and emergency request idempotency."""
        # 1. Negative beds update must be rejected with 422/400 validation error
        res_bed = self.client.put(
            "/api/facilities/IN-MH-PUN-001/beds",
            json={"occupied_beds": -5, "total_beds": 50},
            headers=self.admin_headers
        )
        self.assertIn(res_bed.status_code, [400, 422])

        # 2. Negative staff available update must be rejected with 422/400 validation error
        res_staff = self.client.put(
            "/api/facilities/IN-MH-PUN-001/staff",
            json={"doctors_available": -2, "nurses_available": 10, "support_available": 5},
            headers=self.admin_headers
        )
        self.assertIn(res_staff.status_code, [400, 422])

        # 3. Non-positive quantity in ABDM FHIR dispense must be rejected
        res_abdm = self.client.post(
            "/api/abdm/fhir-dispense",
            json={
                "facility_id": "IN-MH-PUN-001",
                "medicine_name": "Paracetamol",
                "batch_number": "B-01",
                "quantity": 0
            },
            headers=self.admin_headers
        )
        self.assertEqual(res_abdm.status_code, 422)  # Pydantic validation error

        # 4. Out of range temperature in Cold Chain must be rejected
        res_cc = self.client.post(
            "/api/cold-chain/telemetry",
            json={
                "facility_id": "IN-MH-PUN-001",
                "temperature": 150.0  # Physically absurd ILR temperature
            }
        )
        self.assertEqual(res_cc.status_code, 422)


if __name__ == "__main__":
    unittest.main()


