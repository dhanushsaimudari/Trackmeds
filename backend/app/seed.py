import datetime
import random
import json
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.all_models import (
    Facility, Medicine, Inventory, Consumption, Supplier, Forecast,
    Redistribution, ExternalSignal, Notification, User, FederatedNode, FederatedRound
)
from app.core.security import hash_password
from app.services.forecasting.engine import ForecastingEngine
from app.services.optimization.redistribution import RedistributionOptimizer
from app.services.notifications.manager import NotificationManager

def seed_database(db: Session = None):
    close_at_end = False
    if db is None:
        db = SessionLocal()
        close_at_end = True

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    print("[SEED] Seeding TRACKMEDS database with authentic Indian Public Health System data...")

    today = datetime.date.today()

    # 1. Seed Verified Pharmaceutical Suppliers (Indian Public Healthcare Network)
    suppliers_data = [
        {"id": "SUP-01", "name": "Cipla Healthcare Logistics", "region": "Maharashtra, India", "average_lead_time_days": 4, "reliability_score": 0.97, "contact_status": "Active"},
        {"id": "SUP-02", "name": "Sun Pharma Supply Chain", "region": "Gujarat, India", "average_lead_time_days": 5, "reliability_score": 0.95, "contact_status": "Active"},
        {"id": "SUP-03", "name": "Dr. Reddy's Laboratories Emergency Depot", "region": "Telangana, India", "average_lead_time_days": 4, "reliability_score": 0.96, "contact_status": "Active"},
        {"id": "SUP-04", "name": "Biocon Biologics Distribution", "region": "Karnataka, India", "average_lead_time_days": 5, "reliability_score": 0.94, "contact_status": "Active"},
        {"id": "SUP-05", "name": "Hetero Labs National Reserves", "region": "Telangana, India", "average_lead_time_days": 3, "reliability_score": 0.98, "contact_status": "Active"},
    ]
    for s in suppliers_data:
        db.add(Supplier(**s))
    db.commit()

    # 2. Seed Users (RBAC default role accounts across administrative tiers)
    users_data = [
        {
            "id": "USR-ADMIN-01",
            "email": "admin@trackmeds.org",
            "hashed_password": hash_password("admin123"),
            "name": "Dr. Rajesh Varma",
            "role": "NATIONAL_ADMIN",
            "state": None,
            "district": None,
            "facility_id": None,
            "supplier_id": None,
            "approval_status": "approved"
        },
        {
            "id": "USR-DHANUSH-01",
            "email": "dhanush@gmail.com",
            "hashed_password": hash_password("dhanush123"),
            "name": "Dhanush Sai Mudari",
            "role": "NATIONAL_ADMIN",
            "state": None,
            "district": None,
            "facility_id": None,
            "supplier_id": None,
            "approval_status": "approved"
        },
        {
            "id": "USR-STATE-01",
            "email": "state.mh@trackmeds.org",
            "hashed_password": hash_password("state123"),
            "name": "Sanjay Patil",
            "role": "STATE_OFFICER",
            "state": "Maharashtra",
            "district": None,
            "facility_id": None,
            "supplier_id": None
        },
        {
            "id": "USR-DIST-01",
            "email": "district.pune@trackmeds.org",
            "hashed_password": hash_password("district123"),
            "name": "Ananya Deshmukh",
            "role": "DISTRICT_OFFICER",
            "state": "Maharashtra",
            "district": "Pune",
            "facility_id": None,
            "supplier_id": None
        },
        {
            "id": "USR-PHC-01",
            "email": "phc.haveli@trackmeds.org",
            "hashed_password": hash_password("phc123"),
            "name": "Nurse Inspector Kavita",
            "role": "PHC_STAFF",
            "state": "Maharashtra",
            "district": "Pune",
            "facility_id": "FAC-IN-101",
            "supplier_id": None
        },
        {
            "id": "USR-SUPP-01",
            "email": "supplier.cipla@trackmeds.org",
            "hashed_password": hash_password("supplier123"),
            "name": "Vikram Malhotra",
            "role": "SUPPLIER",
            "state": None,
            "district": None,
            "facility_id": None,
            "supplier_id": "SUP-01"
        }
    ]
    for u in users_data:
        db.add(User(**u))
    db.commit()

    # 3. Seed Essential Medicines (WHO / National List of Essential Medicines - India)
    medicines_data = [
        {"id": "MED-ORS", "name": "Oral Rehydration Salts (ORS)", "category": "Rehydration", "unit": "sachets", "safety_stock_level": 1200, "unit_cost": 15.0, "supplier_id": "SUP-01"},
        {"id": "MED-AMX", "name": "Amoxicillin 500mg", "category": "Antibiotics", "unit": "tablets", "safety_stock_level": 800, "unit_cost": 8.5, "supplier_id": "SUP-01"},
        {"id": "MED-PCM", "name": "Paracetamol 500mg", "category": "Analgesics", "unit": "tablets", "safety_stock_level": 1500, "unit_cost": 3.0, "supplier_id": "SUP-02"},
        {"id": "MED-INS", "name": "Human Insulin 100IU/ml", "category": "Insulin", "unit": "vials", "safety_stock_level": 300, "unit_cost": 240.0, "supplier_id": "SUP-04"},
        {"id": "MED-BCG", "name": "BCG Tuberculosis Vaccine", "category": "Vaccines", "unit": "doses", "safety_stock_level": 500, "unit_cost": 65.0, "supplier_id": "SUP-04"},
        {"id": "MED-OXY", "name": "Oxytocin 10IU/ml Injection", "category": "Maternal", "unit": "ampoules", "safety_stock_level": 400, "unit_cost": 45.0, "supplier_id": "SUP-05"},
        {"id": "MED-ALM", "name": "Artemether/Lumefantrine 80/480mg", "category": "Antimalarial", "unit": "tablets", "safety_stock_level": 600, "unit_cost": 35.0, "supplier_id": "SUP-01"},
        {"id": "MED-MET", "name": "Metformin 500mg", "category": "Chronic Care", "unit": "tablets", "safety_stock_level": 1000, "unit_cost": 5.0, "supplier_id": "SUP-02"},
        {"id": "MED-AZM", "name": "Azithromycin 250mg", "category": "Antibiotics", "unit": "tablets", "safety_stock_level": 500, "unit_cost": 18.0, "supplier_id": "SUP-03"},
        {"id": "MED-CTR", "name": "Ceftriaxone 1g Injection", "category": "Antibiotics", "unit": "vials", "safety_stock_level": 250, "unit_cost": 85.0, "supplier_id": "SUP-05"},
        {"id": "MED-ZNC", "name": "Zinc Sulfate 20mg", "category": "Rehydration", "unit": "tablets", "safety_stock_level": 900, "unit_cost": 4.0, "supplier_id": "SUP-01"},
        {"id": "MED-SAL", "name": "Salbutamol Inhaler 100mcg", "category": "Respiratory", "unit": "inhalers", "safety_stock_level": 350, "unit_cost": 120.0, "supplier_id": "SUP-03"},
    ]
    for m in medicines_data:
        db.add(Medicine(**m))
    db.commit()

    # 4. Seed Facilities: Indian Public Healthcare Network across Key States
    facilities_data = [
        # --- 🇮🇳 MAHARASHTRA CORRIDOR (Pune, Satara, Solapur, Nashik) ---
        {
            "id": "FAC-IN-101",
            "name": "PHC Haveli Pune",
            "type": "PHC",
            "state": "Maharashtra",
            "district": "Pune",
            "country": "India",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "population_served": 45000,
            "capacity": 40,
            "status": "Critical",
            "daily_footfall": 160,
            "baseline_footfall": 100
        },
        {
            "id": "FAC-IN-102",
            "name": "PHC Shirur Pune",
            "type": "PHC",
            "state": "Maharashtra",
            "district": "Pune",
            "country": "India",
            "latitude": 18.8262,
            "longitude": 74.3768,
            "population_served": 38000,
            "capacity": 30,
            "status": "Warning",
            "daily_footfall": 115,
            "baseline_footfall": 90
        },
        {
            "id": "FAC-IN-103",
            "name": "CHC Satara Central",
            "type": "CHC",
            "state": "Maharashtra",
            "district": "Satara",
            "country": "India",
            "latitude": 17.6805,
            "longitude": 73.9937,
            "population_served": 120000,
            "capacity": 120,
            "status": "Healthy",
            "daily_footfall": 240,
            "baseline_footfall": 230
        },
        {
            "id": "FAC-IN-104",
            "name": "District Hospital Pune",
            "type": "District Hospital",
            "state": "Maharashtra",
            "district": "Pune",
            "country": "India",
            "latitude": 18.5308,
            "longitude": 73.8474,
            "population_served": 500000,
            "capacity": 450,
            "status": "Healthy",
            "daily_footfall": 680,
            "baseline_footfall": 650
        },
        {
            "id": "FAC-IN-105",
            "name": "PHC Baramati",
            "type": "PHC",
            "state": "Maharashtra",
            "district": "Pune",
            "country": "India",
            "latitude": 18.1517,
            "longitude": 74.5771,
            "population_served": 42000,
            "capacity": 35,
            "status": "Healthy",
            "daily_footfall": 95,
            "baseline_footfall": 90
        },
        {
            "id": "FAC-IN-106",
            "name": "CHC Solapur North",
            "type": "CHC",
            "state": "Maharashtra",
            "district": "Solapur",
            "country": "India",
            "latitude": 17.6599,
            "longitude": 75.9064,
            "population_served": 110000,
            "capacity": 100,
            "status": "Healthy",
            "daily_footfall": 210,
            "baseline_footfall": 200
        },
        {
            "id": "FAC-IN-111",
            "name": "Regional Medical Depot Pune",
            "type": "Warehouse",
            "state": "Maharashtra",
            "district": "Pune",
            "country": "India",
            "latitude": 18.5074,
            "longitude": 73.8077,
            "population_served": 2500000,
            "capacity": 1200,
            "status": "Healthy",
            "daily_footfall": 30,
            "baseline_footfall": 30
        },

        # --- 🇮🇳 KERALA NETWORK (Ernakulam, Thiruvananthapuram, Alappuzha) ---
        {
            "id": "FAC-IN-201",
            "name": "PHC Aluva Kochi",
            "type": "PHC",
            "state": "Kerala",
            "district": "Ernakulam",
            "country": "India",
            "latitude": 10.1004,
            "longitude": 76.3570,
            "population_served": 52000,
            "capacity": 45,
            "status": "Warning",
            "daily_footfall": 135,
            "baseline_footfall": 110
        },
        {
            "id": "FAC-IN-202",
            "name": "CHC Ernakulam North",
            "type": "CHC",
            "state": "Kerala",
            "district": "Ernakulam",
            "country": "India",
            "latitude": 9.9816,
            "longitude": 76.2999,
            "population_served": 140000,
            "capacity": 150,
            "status": "Healthy",
            "daily_footfall": 290,
            "baseline_footfall": 280
        },
        {
            "id": "FAC-IN-203",
            "name": "District Hospital Ernakulam",
            "type": "District Hospital",
            "state": "Kerala",
            "district": "Ernakulam",
            "country": "India",
            "latitude": 9.9723,
            "longitude": 76.2785,
            "population_served": 420000,
            "capacity": 380,
            "status": "Healthy",
            "daily_footfall": 560,
            "baseline_footfall": 530
        },
        {
            "id": "FAC-IN-204",
            "name": "Kerala Central Medical Depot Trivandrum",
            "type": "Warehouse",
            "state": "Kerala",
            "district": "Thiruvananthapuram",
            "country": "India",
            "latitude": 8.5241,
            "longitude": 76.9366,
            "population_served": 3000000,
            "capacity": 1500,
            "status": "Healthy",
            "daily_footfall": 40,
            "baseline_footfall": 40
        },

        # --- 🇮🇳 GUJARAT NETWORK (Ahmedabad, Vadodara, Gandhinagar) ---
        {
            "id": "FAC-IN-301",
            "name": "PHC Sanand Ahmedabad",
            "type": "PHC",
            "state": "Gujarat",
            "district": "Ahmedabad",
            "country": "India",
            "latitude": 22.9922,
            "longitude": 72.3813,
            "population_served": 49000,
            "capacity": 40,
            "status": "Healthy",
            "daily_footfall": 110,
            "baseline_footfall": 105
        },
        {
            "id": "FAC-IN-302",
            "name": "District Hospital Vadodara",
            "type": "District Hospital",
            "state": "Gujarat",
            "district": "Vadodara",
            "country": "India",
            "latitude": 22.3072,
            "longitude": 73.1812,
            "population_served": 350000,
            "capacity": 300,
            "status": "Healthy",
            "daily_footfall": 430,
            "baseline_footfall": 410
        },
        {
            "id": "FAC-IN-303",
            "name": "Gujarat State Medical Depot Gandhinagar",
            "type": "Warehouse",
            "state": "Gujarat",
            "district": "Gandhinagar",
            "country": "India",
            "latitude": 23.2156,
            "longitude": 72.6369,
            "population_served": 2800000,
            "capacity": 1400,
            "status": "Healthy",
            "daily_footfall": 35,
            "baseline_footfall": 35
        },

        # --- 🇮🇳 KARNATAKA NETWORK (Bengaluru Rural, Mysuru, Belagavi) ---
        {
            "id": "FAC-IN-401",
            "name": "PHC Devanahalli Bengaluru Rural",
            "type": "PHC",
            "state": "Karnataka",
            "district": "Bengaluru Rural",
            "country": "India",
            "latitude": 13.2483,
            "longitude": 77.7126,
            "population_served": 54000,
            "capacity": 45,
            "status": "Healthy",
            "daily_footfall": 120,
            "baseline_footfall": 115
        },
        {
            "id": "FAC-IN-402",
            "name": "CHC Nelamangala",
            "type": "CHC",
            "state": "Karnataka",
            "district": "Bengaluru Rural",
            "country": "India",
            "latitude": 13.0984,
            "longitude": 77.3876,
            "population_served": 130000,
            "capacity": 110,
            "status": "Healthy",
            "daily_footfall": 230,
            "baseline_footfall": 220
        },
        {
            "id": "FAC-IN-403",
            "name": "Karnataka Drugs & Logistics Depot Bengaluru",
            "type": "Warehouse",
            "state": "Karnataka",
            "district": "Bengaluru Urban",
            "country": "India",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "population_served": 4000000,
            "capacity": 1800,
            "status": "Healthy",
            "daily_footfall": 50,
            "baseline_footfall": 50
        }
    ]

    for f in facilities_data:
        ftype = f.get("type", "PHC")
        fstatus = f.get("status", "Healthy")

        if ftype == "PHC":
            t_beds = random.randint(30, 50)
            o_beds = random.randint(35, 46) if fstatus in ["Critical", "Warning"] else random.randint(18, 30)
            em_beds = random.randint(6, 12)
            i_beds = random.randint(2, 6)
            d_req, d_avail = 8, (5 if fstatus == "Critical" else 7)
            n_req, n_avail = 20, (14 if fstatus == "Critical" else 18)
            s_req, s_avail = 15, 14
        elif ftype == "CHC":
            t_beds = random.randint(100, 160)
            o_beds = random.randint(110, 148) if fstatus in ["Critical", "Warning"] else random.randint(60, 95)
            em_beds = random.randint(15, 25)
            i_beds = random.randint(10, 18)
            d_req, d_avail = 20, (15 if fstatus == "Critical" else 18)
            n_req, n_avail = 50, (38 if fstatus == "Critical" else 46)
            s_req, s_avail = 35, 32
        elif ftype == "District Hospital":
            t_beds = random.randint(250, 450)
            o_beds = random.randint(320, 420) if fstatus in ["Critical", "Warning"] else random.randint(160, 260)
            em_beds = random.randint(40, 70)
            i_beds = random.randint(25, 50)
            d_req, d_avail = 60, 54
            n_req, n_avail = 160, 145
            s_req, s_avail = 100, 92
        else: # Warehouse
            t_beds, o_beds, em_beds, i_beds = 0, 0, 0, 0
            d_req, d_avail = 2, 2
            n_req, n_avail = 4, 4
            s_req, s_avail = 30, 28

        f["total_beds"] = t_beds
        f["occupied_beds"] = min(t_beds, o_beds)
        f["emergency_beds"] = em_beds
        f["icu_beds"] = i_beds
        f["doctors_required"] = d_req
        f["doctors_available"] = d_avail
        f["nurses_required"] = n_req
        f["nurses_available"] = n_avail
        f["support_required"] = s_req
        f["support_available"] = s_avail

        db.add(Facility(**f))
    db.commit()

    # 5. Seed Inventory Batches & Expiry Dates
    print("[INFO] Creating inventory batches & expiry dates...")
    facilities = db.query(Facility).all()
    medicines = db.query(Medicine).all()

    inv_counter = 1
    for fac in facilities:
        for med in medicines:
            if "Critical" in fac.status:
                qty = random.randint(150, 420)
            elif "Warning" in fac.status:
                qty = random.randint(500, 850)
            elif "Warehouse" in fac.type:
                qty = random.randint(6000, 14000)
            else:
                qty = random.randint(1500, 3800)

            batch_no = f"B-2026-{inv_counter:04d}"
            if inv_counter % 6 == 0:
                expiry_days = random.randint(20, 35)  # Triggers expiry intelligence
            else:
                expiry_days = random.randint(140, 365)
                
            exp_date = today + datetime.timedelta(days=expiry_days)

            db.add(Inventory(
                id=f"INV-{fac.id}-{med.id}",
                facility_id=fac.id,
                medicine_id=med.id,
                batch_number=batch_no,
                quantity=qty,
                expiry_date=exp_date,
                last_updated=datetime.datetime.now(datetime.timezone.utc)
            ))
            inv_counter += 1
    db.commit()

    # 6. Seed Historical Consumption Records (90 Days of structured operational data)
    print("[INFO] Generating 90 days of consumption history correlated with footfall...")
    for fac in facilities:
        for med in medicines:
            base_usage = 45 if "Hospital" in fac.type else (15 if "Warehouse" in fac.type else 28)
            footfall_factor = (fac.daily_footfall or 100) / 100.0

            for d in range(1, 91):
                past_date = today - datetime.timedelta(days=d)
                # Weekend effect + footfall correlation + random noise
                day_multiplier = 0.8 if past_date.weekday() >= 5 else 1.15
                consumed = int(base_usage * day_multiplier * footfall_factor + random.randint(-4, 5))
                consumed = max(2, consumed)

                db.add(Consumption(
                    id=f"CS-{fac.id}-{med.id}-{d}",
                    facility_id=fac.id,
                    medicine_id=med.id,
                    date=past_date,
                    quantity_used=consumed
                ))
    db.commit()

    # 7. Seed Meteorological & Epidemiological Risk Signals (India Context)
    signals_data = [
        {
            "id": "SIG-IN-01",
            "region": "Pune",
            "country": "India",
            "signal_type": "IMD Monsoon Alert",
            "severity": "High",
            "observed_value": "240mm torrential rain in 48h, 92% humidity",
            "forecast_value": "+45% acute diarrheal & monsoon rehydration demand surge projected",
            "source": "India Meteorological Department (IMD)"
        },
        {
            "id": "SIG-IN-02",
            "region": "Satara",
            "country": "India",
            "signal_type": "Western Ghats Precipitation",
            "severity": "Moderate",
            "observed_value": "110mm rainfall, high river levels",
            "forecast_value": "+20% antibiotic & waterborne infection rate expected",
            "source": "Maharashtra State Disaster Management Authority"
        },
        {
            "id": "SIG-IN-03",
            "region": "Ernakulam",
            "country": "India",
            "signal_type": "Coastal Monsoon High Humidity",
            "severity": "Moderate",
            "observed_value": "88% humidity, 31°C",
            "forecast_value": "+25% seasonal flu and respiratory inhaler consumption",
            "source": "Kerala Health Directorate Surveillance"
        },
        {
            "id": "SIG-IN-04",
            "region": "Ahmedabad",
            "country": "India",
            "signal_type": "Heat & Seasonal Dehydration",
            "severity": "Moderate",
            "observed_value": "41°C peak temperature",
            "forecast_value": "+30% ORS & IV fluids demand buffer recommendation",
            "source": "Gujarat State Health Portal"
        },
        {
            "id": "SIG-IN-05",
            "region": "Bengaluru Rural",
            "country": "India",
            "signal_type": "Seasonal Urban Respiratory Wave",
            "severity": "Low",
            "observed_value": "AQI 118, 24°C",
            "forecast_value": "Stable consumption pattern within standard safety buffer",
            "source": "Karnataka State Pollution & Health Board"
        }
    ]
    for sig in signals_data:
        db.add(ExternalSignal(**sig))
    db.commit()

    # 8. Seed Decentralized Federated Learning State Nodes & Baseline Round
    print("[INFO] Initializing Federated Learning decentralized regional state nodes...")
    federated_nodes = [
        {"id": "FED-NODE-MH", "node_name": "Maharashtra State Health AI Node", "region": "Maharashtra", "country": "India", "local_samples_count": 1890, "local_accuracy": 0.942, "last_contribution_round": 1, "status": "Active"},
        {"id": "FED-NODE-KL", "node_name": "Kerala State Healthcare Telemetry Node", "region": "Kerala", "country": "India", "local_samples_count": 1080, "local_accuracy": 0.951, "last_contribution_round": 1, "status": "Active"},
        {"id": "FED-NODE-GJ", "node_name": "Gujarat Public Health Intelligence Node", "region": "Gujarat", "country": "India", "local_samples_count": 810, "local_accuracy": 0.938, "last_contribution_round": 1, "status": "Active"},
        {"id": "FED-NODE-KA", "node_name": "Karnataka State Health Logistics Node", "region": "Karnataka", "country": "India", "local_samples_count": 810, "local_accuracy": 0.945, "last_contribution_round": 1, "status": "Active"},
    ]
    for fn in federated_nodes:
        db.add(FederatedNode(**fn))
    db.commit()

    # Baseline Federated Round 1
    sample_weights = {
        "rolling_7d_mean": 0.42,
        "rolling_30d_mean": 0.28,
        "trend_slope": 0.14,
        "daily_footfall_ratio": 0.35,
        "climate_severity": 0.22
    }
    db.add(FederatedRound(
        id="FED-ROUND-1",
        round_number=1,
        global_model_version="v1.0-fedavg-baseline",
        participating_nodes_count=4,
        samples_aggregated=4590,
        training_loss=0.082,
        validation_mae=2.45,
        epsilon_privacy_spent=0.45,
        model_weights_json=json.dumps(sample_weights),
        created_at=datetime.datetime.now(datetime.timezone.utc)
    ))
    db.commit()

    # 9. Run Forecasting & Redistribution Engines to generate initial live predictions
    print("[INFO] Executing initial predictive forecasting & redistribution optimization...")
    ForecastingEngine.refresh_all_forecasts(db)
    RedistributionOptimizer.generate_recommendations(db)
    NotificationManager.generate_system_notifications(db)

    print("[SUCCESS] TRACKMEDS Seed Complete! Database is populated and operational.")

    if close_at_end:
        db.close()

if __name__ == "__main__":
    seed_database()
