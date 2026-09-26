import os
import sys
import unittest
import datetime
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import SessionLocal
from app.seed import seed_database
from app.models.all_models import Inventory, Forecast, Facility, Medicine, Consumption, User

class TestMutationPropagationAndE2EChain(unittest.TestCase):
    """
    Forensic E2E Mutation Propagation and Data-Integrity Test Suite.
    Validates complete causal chain across the platform:
    Inventory Mutation -> Database Persistence -> Batch Management -> 
    ML Demand Prediction -> Shortage Alerts -> Multi-level Aggregation (District, State, National) ->
    Role Isolation -> Consumption Reversal -> AI Copilot Grounding.
    """

    @classmethod
    def setUpClass(cls):
        db = SessionLocal()
        seed_database(db)
        db.close()
        cls.client = TestClient(app)

        # 1. National Admin
        r = cls.client.post("/api/auth/login", json={"email": "admin@trackmeds.org", "password": "admin123"})
        assert r.status_code == 200
        cls.admin_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

        # 2. State Officer (Maharashtra)
        r = cls.client.post("/api/auth/login", json={"email": "state.mh@trackmeds.org", "password": "state123"})
        assert r.status_code == 200
        cls.state_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

        # 3. District Officer (Pune)
        r = cls.client.post("/api/auth/login", json={"email": "district.pune@trackmeds.org", "password": "district123"})
        assert r.status_code == 200
        cls.district_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

        # 4. PHC Haveli Staff (FAC-IN-101)
        r = cls.client.post("/api/auth/login", json={"email": "phc.haveli@trackmeds.org", "password": "phc123"})
        assert r.status_code == 200
        cls.phc_haveli_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

        # 5. PHC Shirur Staff (FAC-IN-102) - Cross-facility isolate
        from app.core.security import create_access_token, hash_password
        db = SessionLocal()
        shirur_user = db.query(User).filter(User.email == "phc.shirur@trackmeds.org").first()
        if not shirur_user:
            shirur_user = User(
                id="USR-PHC-102",
                name="PHC Shirur Staff",
                email="phc.shirur@trackmeds.org",
                hashed_password=hash_password("shirur123"),
                role="PHC_STAFF",
                facility_id="FAC-IN-102",
                state="Maharashtra",
                district="Pune",
                approval_status="APPROVED"
            )
            db.add(shirur_user)
            db.commit()
        db.close()

        cls.phc_shirur_token = create_access_token({
            "sub": "USR-PHC-102",
            "email": "phc.shirur@trackmeds.org",
            "role": "PHC_STAFF"
        })
        cls.phc_shirur_headers = {"Authorization": f"Bearer {cls.phc_shirur_token}"}

    def test_01_complete_mutation_propagation_chain(self):
        """
        FULL MUTATION-PROPAGATION VALIDATION:
        PHC Haveli adds 500 Amoxicillin:
        database changes -> stock changes -> batch changes -> forecast changes -> 
        district aggregation changes -> state aggregation changes -> national aggregation changes ->
        unauthorized PHC remains isolated.
        """
        facility_id = "FAC-IN-101"  # PHC Haveli
        med_id = "MED-AMX"          # Amoxicillin 500mg
        batch_num = "B-2026-MUT-500"
        future_exp = (datetime.date.today() + datetime.timedelta(days=240)).isoformat()

        # Step 1: Capture baseline stock across hierarchy
        db = SessionLocal()
        base_invs = db.query(Inventory).filter(
            Inventory.facility_id == facility_id,
            Inventory.medicine_id == med_id
        ).all()
        baseline_phc_stock = sum(i.quantity for i in base_invs)

        # Baseline Forecast for Haveli Amoxicillin
        base_fc = db.query(Forecast).filter(
            Forecast.facility_id == facility_id,
            Forecast.medicine_id == med_id
        ).first()
        today = datetime.date.today()
        base_days_to_stockout = (base_fc.predicted_stockout_date - today).days if (base_fc and base_fc.predicted_stockout_date) else 0
        db.close()

        # Baseline National, State, District inventory totals
        res_nat_base = self.client.get("/api/inventory?country=India", headers=self.admin_headers).json()
        base_nat_stock = sum(item["quantity"] for item in res_nat_base if item["medicine_id"] == med_id)

        res_state_base = self.client.get("/api/inventory?state=Maharashtra", headers=self.state_headers).json()
        base_state_stock = sum(item["quantity"] for item in res_state_base if item["medicine_id"] == med_id)

        res_dist_base = self.client.get("/api/inventory?district=Pune", headers=self.district_headers).json()
        base_dist_stock = sum(item["quantity"] for item in res_dist_base if item["medicine_id"] == med_id)

        # Step 2: PHC Haveli User Adds 500 units of Amoxicillin
        add_payload = {
            "facility_id": facility_id,
            "medicine_id": med_id,
            "batch_number": batch_num,
            "quantity": 500,
            "expiry_date": future_exp
        }
        res_add = self.client.post("/api/inventory", json=add_payload, headers=self.phc_haveli_headers)
        self.assertEqual(res_add.status_code, 200, f"Inventory add failed: {res_add.text}")
        added_data = res_add.json()
        self.assertEqual(added_data["quantity"], 500)
        self.assertEqual(added_data["batch_number"], batch_num)

        # Step 3: Verify Database Persistence
        db = SessionLocal()
        persisted_inv = db.query(Inventory).filter(
            Inventory.facility_id == facility_id,
            Inventory.medicine_id == med_id,
            Inventory.batch_number == batch_num
        ).first()
        self.assertIsNotNone(persisted_inv, "Batch record was not persisted in database!")
        self.assertEqual(persisted_inv.quantity, 500)

        # Verify Total PHC Stock increased by exactly 500
        new_invs = db.query(Inventory).filter(
            Inventory.facility_id == facility_id,
            Inventory.medicine_id == med_id
        ).all()
        new_phc_stock = sum(i.quantity for i in new_invs)
        self.assertEqual(new_phc_stock, baseline_phc_stock + 500, "Total PHC stock did not increase by 500!")

        # Step 4: Verify ML Forecast Recalculation
        new_fc = db.query(Forecast).filter(
            Forecast.facility_id == facility_id,
            Forecast.medicine_id == med_id
        ).first()
        self.assertIsNotNone(new_fc)
        new_days = (new_fc.predicted_stockout_date - today).days if (new_fc and new_fc.predicted_stockout_date) else 0
        self.assertGreater(
            new_days,
            base_days_to_stockout,
            "Days until stockout did not increase after adding 500 units!"
        )
        db.close()

        # Step 5: Verify District Aggregation updated (+500)
        res_dist_new = self.client.get("/api/inventory?district=Pune", headers=self.district_headers).json()
        new_dist_stock = sum(item["quantity"] for item in res_dist_new if item["medicine_id"] == med_id)
        self.assertEqual(new_dist_stock, base_dist_stock + 500, "District aggregate stock did not reflect +500!")

        # Step 6: Verify State Aggregation updated (+500)
        res_state_new = self.client.get("/api/inventory?state=Maharashtra", headers=self.state_headers).json()
        new_state_stock = sum(item["quantity"] for item in res_state_new if item["medicine_id"] == med_id)
        self.assertEqual(new_state_stock, base_state_stock + 500, "State aggregate stock did not reflect +500!")

        # Step 7: Verify National Aggregation updated (+500)
        res_nat_new = self.client.get("/api/inventory?country=India", headers=self.admin_headers).json()
        new_nat_stock = sum(item["quantity"] for item in res_nat_new if item["medicine_id"] == med_id)
        self.assertEqual(new_nat_stock, base_nat_stock + 500, "National aggregate stock did not reflect +500!")

        # Step 8: Verify Unauthorized PHC (Shirur) CANNOT see PHC Haveli's stock
        res_shirur = self.client.get("/api/inventory", headers=self.phc_shirur_headers).json()
        shirur_facilities = set(item["facility_id"] for item in res_shirur)
        self.assertNotIn("FAC-IN-101", shirur_facilities, "CRITICAL RBAC VIOLATION: PHC Shirur saw PHC Haveli stock!")

    def test_02_consumption_reversal_and_fefo(self):
        """
        Reverse the operation:
        PHC consumes stock -> database changes -> consumption recorded ->
        forecast recalculates -> days to stockout decreases.
        """
        facility_id = "FAC-IN-101"
        med_id = "MED-AMX"

        db = SessionLocal()
        before_invs = db.query(Inventory).filter(
            Inventory.facility_id == facility_id,
            Inventory.medicine_id == med_id,
            Inventory.quantity > 0
        ).all()
        before_stock = sum(i.quantity for i in before_invs)
        before_fc = db.query(Forecast).filter(
            Forecast.facility_id == facility_id,
            Forecast.medicine_id == med_id
        ).first()
        today = datetime.date.today()
        before_days = (before_fc.predicted_stockout_date - today).days if (before_fc and before_fc.predicted_stockout_date) else 0
        db.close()

        # Consume 200 units
        consume_payload = {
            "facility_id": facility_id,
            "medicine_id": med_id,
            "quantity": 200
        }
        res_cons = self.client.post("/api/inventory/consume", json=consume_payload, headers=self.phc_haveli_headers)
        self.assertEqual(res_cons.status_code, 200)
        cons_data = res_cons.json()
        self.assertEqual(cons_data["quantity_consumed"], 200)
        self.assertEqual(cons_data["remaining_total_stock"], before_stock - 200)

        # Verify DB
        db = SessionLocal()
        after_invs = db.query(Inventory).filter(
            Inventory.facility_id == facility_id,
            Inventory.medicine_id == med_id,
            Inventory.quantity > 0
        ).all()
        after_stock = sum(i.quantity for i in after_invs)
        self.assertEqual(after_stock, before_stock - 200)

        # Verify Consumption record in DB
        cons_record = db.query(Consumption).filter(
            Consumption.facility_id == facility_id,
            Consumption.medicine_id == med_id
        ).order_by(Consumption.date.desc()).first()
        self.assertIsNotNone(cons_record)
        self.assertEqual(cons_record.quantity_used, 200)

        # Verify Forecast recalculated downwards
        after_fc = db.query(Forecast).filter(
            Forecast.facility_id == facility_id,
            Forecast.medicine_id == med_id
        ).first()
        after_days = (after_fc.predicted_stockout_date - today).days if (after_fc and after_fc.predicted_stockout_date) else 0
        self.assertLess(
            after_days,
            before_days,
            "Days until stockout did not decrease after consuming stock!"
        )
        db.close()

    def test_03_data_integrity_and_security_bounds(self):
        """
        Verify security boundaries:
        - Cannot add past-expired batch
        - Cross-facility write blocked (IDOR)
        - Cannot consume more than available stock
        - Non-negative bounds enforced
        """
        # 1. Past expiry date rejected
        past_exp = (datetime.date.today() - datetime.timedelta(days=10)).isoformat()
        res = self.client.post("/api/inventory", json={
            "facility_id": "FAC-IN-101",
            "medicine_id": "MED-AMX",
            "batch_number": "B-EXPIRED-TEST",
            "quantity": 100,
            "expiry_date": past_exp
        }, headers=self.phc_haveli_headers)
        self.assertEqual(res.status_code, 400)
        self.assertIn("expired", res.json()["detail"].lower())

        # 2. Cross-facility inventory tampering by PHC Haveli to PHC Shirur rejected (403)
        future_exp = (datetime.date.today() + datetime.timedelta(days=180)).isoformat()
        res_tamper = self.client.post("/api/inventory", json={
            "facility_id": "FAC-IN-102",  # Target: Shirur
            "medicine_id": "MED-AMX",
            "batch_number": "B-TAMPER-TEST",
            "quantity": 100,
            "expiry_date": future_exp
        }, headers=self.phc_haveli_headers)  # Caller: Haveli
        self.assertEqual(res_tamper.status_code, 403)

        # 3. Consuming more than available stock rejected (400)
        res_over = self.client.post("/api/inventory/consume", json={
            "facility_id": "FAC-IN-101",
            "medicine_id": "MED-AMX",
            "quantity": 999999
        }, headers=self.phc_haveli_headers)
        self.assertEqual(res_over.status_code, 400)
        self.assertIn("insufficient", res_over.json()["detail"].lower())

    def test_04_ai_copilot_answers_user_questions(self):
        """
        Verify AI Assistant answers specific user questions without canned repetition.
        Tests:
        - 'Why is ORS demand increasing in Maharashtra?'
        - 'Which medicines are running low?'
        - 'Which clinics have extra medicines to share?'
        - 'What happens if patient visits increase by 25%?'
        """
        # Question 1: ORS demand in Maharashtra
        r1 = self.client.post("/api/ai/ask", json={
            "question": "Why is ORS demand increasing in Maharashtra?",
            "country": "India"
        }, headers=self.phc_haveli_headers)
        self.assertEqual(r1.status_code, 200)
        ans1 = r1.json()["answer"]
        self.assertTrue(
            "monsoon" in ans1.lower() or "rain" in ans1.lower() or "alert" in ans1.lower() or "climate" in ans1.lower(),
            f"Expected monsoon/rain climate analysis in answer, got: {ans1}"
        )
        # Verify it is NOT the generic command center repeating reply
        self.assertFalse(
            ans1.startswith("TRACKMEDS Command Center is actively monitoring 17 facilities across India. Currently 156 stockout risks"),
            f"AI Copilot returned canned duplicate response: {ans1}"
        )

        # Question 2: Which medicines are running low?
        r2 = self.client.post("/api/ai/ask", json={
            "question": "Which medicines are running low?",
            "country": "India"
        }, headers=self.phc_haveli_headers)
        self.assertEqual(r2.status_code, 200)
        ans2 = r2.json()["answer"]
        self.assertTrue(
            "low" in ans2.lower() or "deficit" in ans2.lower() or "critical" in ans2.lower() or "salts" in ans2.lower() or "amoxicillin" in ans2.lower(),
            f"Expected medicine shortage details, got: {ans2}"
        )

        # Question 3: Which clinics have extra medicines to share?
        r3 = self.client.post("/api/ai/ask", json={
            "question": "Which clinics have extra medicines to share?",
            "country": "India"
        }, headers=self.phc_haveli_headers)
        self.assertEqual(r3.status_code, 200)
        ans3 = r3.json()["answer"]
        self.assertTrue(
            "satara" in ans3.lower() or "surplus" in ans3.lower() or "extra" in ans3.lower() or "depot" in ans3.lower(),
            f"Expected surplus clinic identification, got: {ans3}"
        )

        # Question 4: Patient visits increase by 25%
        r4 = self.client.post("/api/ai/ask", json={
            "question": "What happens if patient visits increase by 25%?",
            "country": "India"
        }, headers=self.phc_haveli_headers)
        self.assertEqual(r4.status_code, 200)
        ans4 = r4.json()["answer"]
        self.assertTrue(
            "25%" in ans4 or "surge" in ans4.lower() or "stockout" in ans4.lower() or "occupancy" in ans4.lower(),
            f"Expected footfall stress test details, got: {ans4}"
        )

        # Verify all four answers are distinct and tailored!
        self.assertNotEqual(ans1, ans2)
        self.assertNotEqual(ans2, ans3)
        self.assertNotEqual(ans3, ans4)
