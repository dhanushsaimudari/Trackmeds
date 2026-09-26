import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import SessionLocal
from app.seed import seed_database

class TestAuthAndSecurityAudit(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        db = SessionLocal()
        seed_database(db)
        db.close()
        cls.client = TestClient(app)

        # 1. Admin login
        r = cls.client.post("/api/auth/login", json={"email": "admin@trackmeds.org", "password": "admin123"})
        assert r.status_code == 200, f"Admin login failed: {r.text}"
        cls.admin_token = r.json()["access_token"]
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

        # 2. PHC Staff login (Haveli PHC - FAC-IN-101)
        r = cls.client.post("/api/auth/login", json={"email": "phc.haveli@trackmeds.org", "password": "phc123"})
        assert r.status_code == 200, f"PHC login failed: {r.text}"
        cls.phc_token = r.json()["access_token"]
        cls.phc_headers = {"Authorization": f"Bearer {cls.phc_token}"}

    def test_01_user_registration_and_pending_approval(self):
        """New users registering with privileged roles or non-internal domains must default to pending approval status."""
        test_email = "newdoctor@hospital.in"
        reg_payload = {
            "email": test_email,
            "password": "securepassword123",
            "name": "Dr. Ramesh Sharma",
            "requested_role": "DISTRICT_OFFICER",
            "state": "Maharashtra",
            "district": "Pune",
            "facility_id": "FAC-IN-101"
        }
        res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("user", data)
        self.assertEqual(data["user"]["approval_status"], "pending")
        self.assertEqual(data["user"]["email"], test_email)

        # Pending user can login but approval_status indicates pending
        login_res = self.client.post("/api/auth/login", json={"email": test_email, "password": "securepassword123"})
        self.assertEqual(login_res.status_code, 200)
        self.assertEqual(login_res.json()["user"]["approval_status"], "pending")

        # Admin approves the user
        user_id = data["user"]["id"]
        approve_res = self.client.post(f"/api/auth/users/{user_id}/approve", headers=self.admin_headers)
        self.assertEqual(approve_res.status_code, 200)
        self.assertEqual(approve_res.json()["approval_status"], "approved")

    def test_02_phc_cannot_access_unauthorized_endpoints(self):
        """PHC staff cannot approve users or trigger federated training rounds."""
        res_approve = self.client.post("/api/auth/users/USR-ADMIN-01/approve", headers=self.phc_headers)
        self.assertEqual(res_approve.status_code, 403)

        res_federated = self.client.post("/api/federated/train-round", headers=self.phc_headers)
        self.assertEqual(res_federated.status_code, 403)

    def test_03_emergency_request_facility_rbac_enforcement(self):
        """PHC staff cannot create an emergency request for a facility they do not belong to."""
        tampered_request = {
            "requesting_facility_id": "FAC-IN-201",  # Kerala PHC, but user is Pune PHC Haveli FAC-IN-101
            "item_name": "Artesunate 60mg Injection",
            "quantity_needed": 40,
            "urgency": "CRITICAL_SOS",
            "incident_description": "Mass casualty surge outside local jurisdiction"
        }
        res = self.client.post("/api/emergency-requests", json=tampered_request, headers=self.phc_headers)
        # Should be blocked with 403 Forbidden due to enforce_facility_access
        self.assertEqual(res.status_code, 403)

    def test_04_ai_stock_commit_requires_valid_facility(self):
        """Committing parsed invoices without a valid facility_id returns 422 validation error."""
        invalid_commit = {
            "facility_id": "",
            "items": [
                {
                    "medicine_name": "Paracetamol 500mg",
                    "batch_number": "BATCH-TEST-99",
                    "quantity": 100,
                    "expiry_date": "2027-12-31"
                }
            ]
        }
        res = self.client.post("/api/ai/commit-stock", json=invalid_commit, headers=self.admin_headers)
        self.assertEqual(res.status_code, 422)


if __name__ == "__main__":
    unittest.main()
