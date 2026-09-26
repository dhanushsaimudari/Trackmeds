import os
import sys
import unittest
import base64
import json
import datetime
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import SessionLocal
from app.seed import seed_database
from app.models.all_models import Facility, User, Inventory, EmergencyRequest, Redistribution

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

class TestAdversarialSecurityAudit(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        db = SessionLocal()
        seed_database(db)
        db.close()
        cls.client = TestClient(app)

        # Login National Admin
        r = cls.client.post("/api/auth/login", json={"email": "admin@trackmeds.org", "password": "admin123"})
        assert r.status_code == 200
        cls.admin_token = r.json()["access_token"]
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

        # Login State Officer (Maharashtra)
        r = cls.client.post("/api/auth/login", json={"email": "state.mh@trackmeds.org", "password": "state123"})
        assert r.status_code == 200
        cls.state_mh_token = r.json()["access_token"]
        cls.state_mh_headers = {"Authorization": f"Bearer {cls.state_mh_token}"}

        # Login District Officer (Pune)
        r = cls.client.post("/api/auth/login", json={"email": "district.pune@trackmeds.org", "password": "district123"})
        assert r.status_code == 200
        cls.dist_pune_token = r.json()["access_token"]
        cls.dist_pune_headers = {"Authorization": f"Bearer {cls.dist_pune_token}"}

        # Login PHC Staff (Haveli PHC Pune - FAC-IN-101)
        r = cls.client.post("/api/auth/login", json={"email": "phc.haveli@trackmeds.org", "password": "phc123"})
        assert r.status_code == 200
        cls.phc_haveli_token = r.json()["access_token"]
        cls.phc_haveli_headers = {"Authorization": f"Bearer {cls.phc_haveli_token}"}

    # -------------------------------------------------------------------------
    # 1. FORGED / TAMPERED TOKEN INJECTION
    # -------------------------------------------------------------------------
    def test_adv_01_forged_bearer_token(self):
        """Attacker crafts a token with modified sub/role and invalid signature."""
        header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
        payload = b64url(json.dumps({
            "sub": "USR-ADMIN-01",
            "email": "admin@trackmeds.org",
            "role": "NATIONAL_ADMIN",
            "exp": int((datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)).timestamp())
        }).encode())
        fake_token = f"{header}.{payload}.invalid_signature"

        res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {fake_token}"})
        self.assertEqual(res.status_code, 401)

    def test_adv_02_expired_token(self):
        """Attacker submits an expired JWT."""
        header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
        payload = b64url(json.dumps({
            "sub": "USR-PHC-01",
            "email": "phc.haveli@trackmeds.org",
            "role": "PHC_STAFF",
            "exp": int((datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=1)).timestamp())
        }).encode())
        from app.core.security import SECRET_KEY
        import hmac, hashlib
        sig = b64url(hmac.new(SECRET_KEY.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
        expired_token = f"{header}.{payload}.{sig}"

        res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        self.assertEqual(res.status_code, 401)

    # -------------------------------------------------------------------------
    # 2. CLIENT PRIVILEGE ESCALATION ON REGISTRATION
    # -------------------------------------------------------------------------
    def test_adv_03_registration_privilege_escalation_attempt(self):
        """Attacker tries to register directly as NATIONAL_ADMIN to gain immediate command."""
        hacker_email = "attacker@external-evil.com"
        reg_payload = {
            "email": hacker_email,
            "password": "evilpassword123",
            "name": "Malicious Actor",
            "requested_role": "NATIONAL_ADMIN",
            "state": "Maharashtra",
            "district": "Pune"
        }
        res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        # Must NOT be auto-approved
        self.assertEqual(data["user"]["approval_status"], "pending")
        hacker_token = data["access_token"]
        hacker_headers = {"Authorization": f"Bearer {hacker_token}"}

        # Attempt to access admin user listing endpoint with pending account
        res_admin_action = self.client.get("/api/auth/users", headers=hacker_headers)
        # NATIONAL_ADMIN requires approved status or will be denied
        db = SessionLocal()
        user_in_db = db.query(User).filter(User.email == hacker_email).first()
        self.assertEqual(user_in_db.approval_status, "pending")
        db.close()

    # -------------------------------------------------------------------------
    # 3. IDOR / BOLA ATTACKS
    # -------------------------------------------------------------------------
    def test_adv_04_idor_cross_district_bed_tampering(self):
        """PHC staff in Pune (FAC-IN-101) attempts to modify beds in Satara clinic (FAC-IN-103)."""
        payload = {"occupied_beds": 10, "total_beds": 50}
        res = self.client.put("/api/facilities/FAC-IN-103/beds", json=payload, headers=self.phc_haveli_headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("outside your assigned PHC", res.json()["detail"])

    def test_adv_05_idor_cross_state_facility_lookup(self):
        """State Officer in Maharashtra attempts to query Kerala facility directly."""
        res = self.client.get("/api/facilities/FAC-IN-201", headers=self.state_mh_headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("outside your assigned state", res.json()["detail"])

    def test_adv_06_idor_unauthorized_user_approval(self):
        """District Officer attempts to approve user account."""
        res = self.client.post("/api/auth/users/USR-DIST-01/approve", headers=self.dist_pune_headers)
        self.assertEqual(res.status_code, 403)

    def test_adv_07_idor_emergency_request_donor_spoofing(self):
        """PHC staff attempts to accept/fulfill an emergency SOS pretending to be a different clinic."""
        # Create valid emergency request first
        sos_payload = {
            "requesting_facility_id": "FAC-IN-101",
            "item_name": "Atropine 0.6mg Injection",
            "quantity_needed": 10,
            "urgency": "CRITICAL_SOS",
            "incident_description": "Organophosphate poisoning cluster"
        }
        res_create = self.client.post("/api/emergency-requests", json=sos_payload, headers=self.phc_haveli_headers)
        self.assertEqual(res_create.status_code, 200)
        sos_id = res_create.json()["id"]

        # PHC Haveli staff attempts to accept it pretending to be Satara Hub (FAC-IN-103)
        accept_payload = {
            "accepting_facility_id": "FAC-IN-103",
            "quantity_fulfilled": 10
        }
        res_accept = self.client.post(f"/api/emergency-requests/{sos_id}/accept", json=accept_payload, headers=self.phc_haveli_headers)
        self.assertEqual(res_accept.status_code, 403)

    # -------------------------------------------------------------------------
    # 4. TRANSFER IDEMPOTENCY & DOUBLE-SPEND DEFENSE
    # -------------------------------------------------------------------------
    def test_adv_08_double_approval_redistribution_blocked(self):
        """Approving an already approved redistribution order must return 400 Bad Request."""
        res_recs = self.client.get("/api/redistribution/recommendations?country=India", headers=self.admin_headers)
        self.assertEqual(res_recs.status_code, 200)
        recs = res_recs.json()
        self.assertGreater(len(recs), 0)
        rec_id = recs[0]["id"]

        # First approval: succeeds
        res_app1 = self.client.post(f"/api/redistribution/approve/{rec_id}", headers=self.admin_headers)
        self.assertEqual(res_app1.status_code, 200)

        # Second approval: must fail with 400
        res_app2 = self.client.post(f"/api/redistribution/approve/{rec_id}", headers=self.admin_headers)
        self.assertEqual(res_app2.status_code, 400)
        self.assertIn("already been approved", res_app2.json()["detail"])


if __name__ == "__main__":
    unittest.main()
