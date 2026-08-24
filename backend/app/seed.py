import datetime
import random
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.all_models import (
    Facility, Medicine, Inventory, Consumption, Supplier, Forecast, Redistribution, ExternalSignal, Notification
)
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

    print("[SEED] Seeding TRACKMEDS database with realistic BRICS health supply chain data...")

    today = datetime.date.today()

    # 1. Seed Suppliers
    suppliers_data = [
        {"id": "SUP-01", "name": "Cipla Healthcare Logistics", "region": "Maharashtra, India", "average_lead_time_days": 5, "reliability_score": 0.96, "contact_status": "Active"},
        {"id": "SUP-02", "name": "Sun Pharma Supply Chain", "region": "Gujarat, India", "average_lead_time_days": 6, "reliability_score": 0.94, "contact_status": "Active"},
        {"id": "SUP-03", "name": "Fiocruz Farmanguinhos", "region": "Rio de Janeiro, Brazil", "average_lead_time_days": 7, "reliability_score": 0.92, "contact_status": "Active"},
        {"id": "SUP-04", "name": "Aspen Pharmacare Global", "region": "Gauteng, South Africa", "average_lead_time_days": 8, "reliability_score": 0.91, "contact_status": "Active"},
        {"id": "SUP-05", "name": "Hetero Labs Emergency Reserves", "region": "Telangana, India", "average_lead_time_days": 4, "reliability_score": 0.98, "contact_status": "Active"},
    ]
    for s in suppliers_data:
        db.add(Supplier(**s))
    db.commit()

    # 2. Seed Medicines
    medicines_data = [
        {"id": "MED-ORS", "name": "Oral Rehydration Salts (ORS)", "category": "Rehydration", "unit": "sachets", "safety_stock_level": 1200, "unit_cost": 15.0, "supplier_id": "SUP-01"},
        {"id": "MED-AMX", "name": "Amoxicillin 500mg", "category": "Antibiotics", "unit": "tablets", "safety_stock_level": 800, "unit_cost": 8.5, "supplier_id": "SUP-01"},
        {"id": "MED-PCM", "name": "Paracetamol 500mg", "category": "Analgesics", "unit": "tablets", "safety_stock_level": 1500, "unit_cost": 3.0, "supplier_id": "SUP-02"},
        {"id": "MED-INS", "name": "Human Insulin 100IU/ml", "category": "Insulin", "unit": "vials", "safety_stock_level": 300, "unit_cost": 240.0, "supplier_id": "SUP-03"},
        {"id": "MED-BCG", "name": "BCG Tuberculosis Vaccine", "category": "Vaccines", "unit": "doses", "safety_stock_level": 500, "unit_cost": 65.0, "supplier_id": "SUP-04"},
        {"id": "MED-OXY", "name": "Oxytocin 10IU/ml Injection", "category": "Maternal", "unit": "ampoules", "safety_stock_level": 400, "unit_cost": 45.0, "supplier_id": "SUP-05"},
        {"id": "MED-ALM", "name": "Artemether/Lumefantrine 80/480mg", "category": "Antimalarial", "unit": "tablets", "safety_stock_level": 600, "unit_cost": 35.0, "supplier_id": "SUP-01"},
        {"id": "MED-MET", "name": "Metformin 500mg", "category": "Chronic Care", "unit": "tablets", "safety_stock_level": 1000, "unit_cost": 5.0, "supplier_id": "SUP-02"},
        {"id": "MED-AZM", "name": "Azithromycin 250mg", "category": "Antibiotics", "unit": "tablets", "safety_stock_level": 500, "unit_cost": 18.0, "supplier_id": "SUP-01"},
        {"id": "MED-CTR", "name": "Ceftriaxone 1g Injection", "category": "Antibiotics", "unit": "vials", "safety_stock_level": 250, "unit_cost": 85.0, "supplier_id": "SUP-05"},
        {"id": "MED-ZNC", "name": "Zinc Sulfate 20mg", "category": "Rehydration", "unit": "tablets", "safety_stock_level": 900, "unit_cost": 4.0, "supplier_id": "SUP-01"},
        {"id": "MED-SAL", "name": "Salbutamol Inhaler 100mcg", "category": "Respiratory", "unit": "inhalers", "safety_stock_level": 350, "unit_cost": 120.0, "supplier_id": "SUP-04"},
    ]
    for m in medicines_data:
        db.add(Medicine(**m))
    db.commit()

    # 3. Seed Facilities for all 5 BRICS Countries (India, China, South Africa, Brazil, Russia)
    facilities_data = [
        # --- 🇮🇳 INDIA (Maharashtra, Kerala, Gujarat, Delhi NCR) ---
        {"id": "FAC-IN-101", "name": "PHC Haveli Pune", "type": "PHC", "district": "Maharashtra", "country": "India", "latitude": 18.5204, "longitude": 73.8567, "population_served": 45000, "capacity": 40, "status": "Critical"},
        {"id": "FAC-IN-102", "name": "PHC Shirur Pune", "type": "PHC", "district": "Maharashtra", "country": "India", "latitude": 18.8262, "longitude": 74.3768, "population_served": 38000, "capacity": 30, "status": "Warning"},
        {"id": "FAC-IN-103", "name": "CHC Satara Central", "type": "CHC", "district": "Maharashtra", "country": "India", "latitude": 17.6805, "longitude": 73.9937, "population_served": 120000, "capacity": 120, "status": "Healthy"},
        {"id": "FAC-IN-104", "name": "District Hospital Pune", "type": "District Hospital", "district": "Maharashtra", "country": "India", "latitude": 18.5308, "longitude": 73.8474, "population_served": 500000, "capacity": 450, "status": "Healthy"},
        {"id": "FAC-IN-105", "name": "PHC Baramati", "type": "PHC", "district": "Maharashtra", "country": "India", "latitude": 18.1517, "longitude": 74.5771, "population_served": 42000, "capacity": 35, "status": "Healthy"},
        {"id": "FAC-IN-106", "name": "PHC Aluva Kochi", "type": "PHC", "district": "Kerala", "country": "India", "latitude": 10.1004, "longitude": 76.3570, "population_served": 52000, "capacity": 45, "status": "Warning"},
        {"id": "FAC-IN-107", "name": "CHC Ernakulam North", "type": "CHC", "district": "Kerala", "country": "India", "latitude": 9.9816, "longitude": 76.2999, "population_served": 140000, "capacity": 150, "status": "Healthy"},
        {"id": "FAC-IN-108", "name": "PHC Sanand Ahmedabad", "type": "PHC", "district": "Gujarat", "country": "India", "latitude": 22.9922, "longitude": 72.3813, "population_served": 49000, "capacity": 40, "status": "Healthy"},
        {"id": "FAC-IN-109", "name": "District Hospital Vadodara", "type": "District Hospital", "district": "Gujarat", "country": "India", "latitude": 22.3072, "longitude": 73.1812, "population_served": 320000, "capacity": 280, "status": "Healthy"},
        {"id": "FAC-IN-110", "name": "PHC Dwarka New Delhi", "type": "PHC", "district": "Delhi NCR", "country": "India", "latitude": 28.5921, "longitude": 77.0460, "population_served": 75000, "capacity": 60, "status": "Warning"},
        {"id": "FAC-IN-111", "name": "Regional Medical Depot Pune", "type": "Warehouse", "district": "Maharashtra", "country": "India", "latitude": 18.5074, "longitude": 73.8077, "population_served": 2000000, "capacity": 1000, "status": "Healthy"},

        # --- 🇨🇳 CHINA (Guangdong, Hubei, Sichuan, Shanghai) ---
        {"id": "FAC-CN-201", "name": "Tianhe District Health Clinic", "type": "PHC", "district": "Guangdong", "country": "China", "latitude": 23.1291, "longitude": 113.3242, "population_served": 95000, "capacity": 80, "status": "Critical"},
        {"id": "FAC-CN-202", "name": "Shenzhen Nanshan Medical Hub", "type": "CHC", "district": "Guangdong", "country": "China", "latitude": 22.5333, "longitude": 113.9300, "population_served": 180000, "capacity": 160, "status": "Healthy"},
        {"id": "FAC-CN-203", "name": "Guangdong Provincial Supply Depot", "type": "Warehouse", "district": "Guangdong", "country": "China", "latitude": 23.1600, "longitude": 113.2300, "population_served": 2500000, "capacity": 1200, "status": "Healthy"},
        {"id": "FAC-CN-204", "name": "Wuhan Wuchang Community Health", "type": "PHC", "district": "Hubei", "country": "China", "latitude": 30.5538, "longitude": 114.3159, "population_served": 88000, "capacity": 75, "status": "Warning"},
        {"id": "FAC-CN-205", "name": "Hubei General Hospital Wuhan", "type": "District Hospital", "district": "Hubei", "country": "China", "latitude": 30.5928, "longitude": 114.3055, "population_served": 450000, "capacity": 400, "status": "Healthy"},
        {"id": "FAC-CN-206", "name": "Chengdu Wuhou Health Center", "type": "PHC", "district": "Sichuan", "country": "China", "latitude": 30.6420, "longitude": 104.0430, "population_served": 72000, "capacity": 65, "status": "Healthy"},
        {"id": "FAC-CN-207", "name": "Pudong New Area Health Station", "type": "PHC", "district": "Shanghai", "country": "China", "latitude": 31.2211, "longitude": 121.5440, "population_served": 110000, "capacity": 90, "status": "Warning"},
        {"id": "FAC-CN-208", "name": "Shanghai Central Medical Logistics Depot", "type": "Warehouse", "district": "Shanghai", "country": "China", "latitude": 31.2304, "longitude": 121.4737, "population_served": 3000000, "capacity": 1500, "status": "Healthy"},

        # --- 🇿🇦 SOUTH AFRICA (Gauteng, Western Cape, KwaZulu-Natal) ---
        {"id": "FAC-ZA-301", "name": "Soweto Community Health Clinic", "type": "PHC", "district": "Gauteng", "country": "South Africa", "latitude": -26.2485, "longitude": 27.8540, "population_served": 85000, "capacity": 60, "status": "Critical"},
        {"id": "FAC-ZA-302", "name": "Sandton Medical Depot Johannesburg", "type": "Warehouse", "district": "Gauteng", "country": "South Africa", "latitude": -26.1076, "longitude": 28.0567, "population_served": 1500000, "capacity": 900, "status": "Healthy"},
        {"id": "FAC-ZA-303", "name": "Pretoria Central Hospital", "type": "District Hospital", "district": "Gauteng", "country": "South Africa", "latitude": -25.7479, "longitude": 28.1878, "population_served": 320000, "capacity": 250, "status": "Healthy"},
        {"id": "FAC-ZA-304", "name": "Khayelitsha District Clinic", "type": "CHC", "district": "Western Cape", "country": "South Africa", "latitude": -34.0417, "longitude": 18.6792, "population_served": 110000, "capacity": 90, "status": "Healthy"},
        {"id": "FAC-ZA-305", "name": "Cape Town Regional Supply Hub", "type": "Warehouse", "district": "Western Cape", "country": "South Africa", "latitude": -33.9249, "longitude": 18.4241, "population_served": 1200000, "capacity": 800, "status": "Healthy"},
        {"id": "FAC-ZA-306", "name": "Durban Umlazi Community Clinic", "type": "PHC", "district": "KwaZulu-Natal", "country": "South Africa", "latitude": -29.9678, "longitude": 30.8845, "population_served": 92000, "capacity": 70, "status": "Warning"},
        {"id": "FAC-ZA-307", "name": "Pietermaritzburg Regional Clinic", "type": "CHC", "district": "KwaZulu-Natal", "country": "South Africa", "latitude": -29.6006, "longitude": 30.3794, "population_served": 130000, "capacity": 100, "status": "Healthy"},

        # --- 🇧🇷 BRAZIL (São Paulo, Rio de Janeiro, Minas Gerais) ---
        {"id": "FAC-BR-401", "name": "UBS Central São Paulo", "type": "PHC", "district": "São Paulo", "country": "Brazil", "latitude": -23.5505, "longitude": -46.6333, "population_served": 65000, "capacity": 50, "status": "Warning"},
        {"id": "FAC-BR-402", "name": "UBS Pinheiros SP", "type": "PHC", "district": "São Paulo", "country": "Brazil", "latitude": -23.5617, "longitude": -46.7019, "population_served": 48000, "capacity": 40, "status": "Healthy"},
        {"id": "FAC-BR-403", "name": "Hospital Regional Campinas", "type": "District Hospital", "district": "São Paulo", "country": "Brazil", "latitude": -22.9099, "longitude": -47.0626, "population_served": 350000, "capacity": 300, "status": "Healthy"},
        {"id": "FAC-BR-404", "name": "Depósito Central São Paulo", "type": "Warehouse", "district": "São Paulo", "country": "Brazil", "latitude": -23.5400, "longitude": -46.6200, "population_served": 2000000, "capacity": 1100, "status": "Healthy"},
        {"id": "FAC-BR-405", "name": "Depósito Estadual Rio de Janeiro", "type": "Warehouse", "district": "Rio de Janeiro", "country": "Brazil", "latitude": -22.9068, "longitude": -43.1729, "population_served": 1800000, "capacity": 850, "status": "Healthy"},
        {"id": "FAC-BR-406", "name": "UBS Copacabana RJ", "type": "PHC", "district": "Rio de Janeiro", "country": "Brazil", "latitude": -22.9690, "longitude": -43.1869, "population_served": 58000, "capacity": 45, "status": "Critical"},
        {"id": "FAC-BR-407", "name": "UBS Belo Horizonte Central", "type": "PHC", "district": "Minas Gerais", "country": "Brazil", "latitude": -19.9167, "longitude": -43.9345, "population_served": 78000, "capacity": 60, "status": "Healthy"},
        {"id": "FAC-BR-408", "name": "Hospital das Clínicas MG", "type": "District Hospital", "district": "Minas Gerais", "country": "Brazil", "latitude": -19.9240, "longitude": -43.9280, "population_served": 400000, "capacity": 350, "status": "Healthy"},

        # --- 🇷🇺 RUSSIA (Moscow Oblast, Saint Petersburg, Novosibirsk Oblast) ---
        {"id": "FAC-RU-501", "name": "Moscow Central District Clinic", "type": "PHC", "district": "Moscow Oblast", "country": "Russia", "latitude": 55.7558, "longitude": 37.6173, "population_served": 105000, "capacity": 85, "status": "Critical"},
        {"id": "FAC-RU-502", "name": "Khimki Community Health Center", "type": "PHC", "district": "Moscow Oblast", "country": "Russia", "latitude": 55.8889, "longitude": 37.4408, "population_served": 64000, "capacity": 50, "status": "Warning"},
        {"id": "FAC-RU-503", "name": "Moscow Regional Medical Depot", "type": "Warehouse", "district": "Moscow Oblast", "country": "Russia", "latitude": 55.7800, "longitude": 37.7000, "population_served": 2800000, "capacity": 1400, "status": "Healthy"},
        {"id": "FAC-RU-504", "name": "Nevsky District Clinic SPb", "type": "PHC", "district": "Saint Petersburg", "country": "Russia", "latitude": 59.9343, "longitude": 30.3351, "population_served": 88000, "capacity": 70, "status": "Healthy"},
        {"id": "FAC-RU-505", "name": "Saint Petersburg Medical Supply Hub", "type": "Warehouse", "district": "Saint Petersburg", "country": "Russia", "latitude": 59.9500, "longitude": 30.3000, "population_served": 1500000, "capacity": 950, "status": "Healthy"},
        {"id": "FAC-RU-506", "name": "Novosibirsk Central Hospital", "type": "District Hospital", "district": "Novosibirsk Oblast", "country": "Russia", "latitude": 55.0084, "longitude": 82.9357, "population_served": 310000, "capacity": 270, "status": "Warning"},
        {"id": "FAC-RU-507", "name": "Siberia Medical Supply Depot", "type": "Warehouse", "district": "Novosibirsk Oblast", "country": "Russia", "latitude": 55.0300, "longitude": 82.9000, "population_served": 1100000, "capacity": 750, "status": "Healthy"}
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

    # 4. Seed Inventory Batches & Expiry Dates
    print("[INFO] Creating inventory batches & expiry dates...")
    facilities = db.query(Facility).all()
    medicines = db.query(Medicine).all()

    inv_counter = 1
    for fac in facilities:
        for med in medicines:
            # Deterministically create stock levels: Critical facilities have low stock, Warehouses have high surplus
            if "Critical" in fac.status:
                qty = random.randint(150, 450)
            elif "Warning" in fac.status:
                qty = random.randint(500, 900)
            elif "Warehouse" in fac.type:
                qty = random.randint(5000, 12000)
            else:
                qty = random.randint(1400, 3500)

            # Create 1 primary batch
            batch_no = f"B-2026-{inv_counter:04d}"
            # Some batches expire in 20-35 days (triggers expiry intelligence alert!)
            if inv_counter % 7 == 0:
                expiry_days = random.randint(18, 35)
            else:
                expiry_days = random.randint(120, 365)
                
            exp_date = today + datetime.timedelta(days=expiry_days)

            db.add(Inventory(
                id=f"INV-{inv_counter:04d}",
                facility_id=fac.id,
                medicine_id=med.id,
                batch_number=batch_no,
                quantity=qty,
                expiry_date=exp_date,
                last_updated=datetime.datetime.utcnow()
            ))
            inv_counter += 1

            # For high-surplus CHCs, add an extra expiring batch for redistribution
            if "CHC" in fac.type and med.id == "MED-ORS":
                db.add(Inventory(
                    id=f"INV-{inv_counter:04d}",
                    facility_id=fac.id,
                    medicine_id=med.id,
                    batch_number=f"B-EXP-{inv_counter:04d}",
                    quantity=1800,
                    expiry_date=today + datetime.timedelta(days=25),
                    last_updated=datetime.datetime.utcnow()
                ))
                inv_counter += 1

    db.commit()

    # 5. Seed Historical Consumption Data (Past 90 Days)
    print("[INFO] Generating 90 days of consumption history...")
    for day_offset in range(90, 0, -1):
        hist_date = today - datetime.timedelta(days=day_offset)
        for fac in facilities:  # Seed all facilities across all 5 BRICS countries with detailed daily logs
            for med in medicines[:6]:
                # Base usage + random variance
                base_used = random.randint(25, 65)
                # Elevate usage for facilities during climate/monsoon shock periods
                if fac.district in ["Maharashtra", "Guangdong", "Gauteng", "São Paulo", "Moscow Oblast"] and med.id in ["MED-ORS", "MED-AMX"]:
                    base_used = int(base_used * 1.45)

                db.add(Consumption(
                    id=f"CON-{fac.id[-3:]}-{med.id[-3:]}-{day_offset}",
                    facility_id=fac.id,
                    medicine_id=med.id,
                    date=hist_date,
                    quantity_used=base_used
                ))
    db.commit()

    # 6. Seed External Signals (Climate/Outbreak for all 5 BRICS countries)
    signals_data = [
        # India
        {
            "id": "SIG-IN-01",
            "region": "Maharashtra",
            "country": "India",
            "signal_type": "Monsoon Anomaly",
            "severity": "High",
            "observed_value": "240 mm rainfall in 48h (88% Humidity)",
            "forecast_value": "+45% surge in acute rehydration & antibiotic demand projected over next 14 days",
            "source": "OpenWeather / India Meteorological Dept"
        },
        {
            "id": "SIG-IN-02",
            "region": "Kerala",
            "country": "India",
            "signal_type": "Tropical Humidity Spike",
            "severity": "Moderate",
            "observed_value": "180 mm rainfall (92% Humidity)",
            "forecast_value": "Elevated viral fever risk; rehydration reserve buffer recommended",
            "source": "State Health Surveillance Unit"
        },
        # China
        {
            "id": "SIG-CN-01",
            "region": "Guangdong",
            "country": "China",
            "signal_type": "Typhoon Heavy Rainfall",
            "severity": "High",
            "observed_value": "290 mm precipitation (94% Humidity)",
            "forecast_value": "+50% acute respiratory & rehydration demand surge projected",
            "source": "China Meteorological Administration"
        },
        {
            "id": "SIG-CN-02",
            "region": "Hubei",
            "country": "China",
            "signal_type": "Seasonal Flu Wave",
            "severity": "Moderate",
            "observed_value": "12°C, High Humidity",
            "forecast_value": "Antiviral & antibiotic reserve buffer recommended",
            "source": "Hubei CDC Surveillance"
        },
        # South Africa
        {
            "id": "SIG-ZA-01",
            "region": "Gauteng",
            "country": "South Africa",
            "signal_type": "Dry Season Dust & Respiratory Wave",
            "severity": "High",
            "observed_value": "14°C, 22% Humidity, Dust Storm Warning",
            "forecast_value": "+40% surge in respiratory infections & rehydration demand projected",
            "source": "South African Weather Service"
        },
        # Brazil
        {
            "id": "SIG-BR-01",
            "region": "São Paulo",
            "country": "Brazil",
            "signal_type": "Precipitation Wave",
            "severity": "High",
            "observed_value": "31°C, 84% Humidity, Heavy Rain",
            "forecast_value": "+30% surge in anti-pyretic & insulin footfall projected",
            "source": "INMET Brazil Climate Adapter"
        },
        # Russia
        {
            "id": "SIG-RU-01",
            "region": "Moscow Oblast",
            "country": "Russia",
            "signal_type": "Extreme Cold Snap",
            "severity": "High",
            "observed_value": "-22°C Cold Wave, Heavy Snow",
            "forecast_value": "+40% surge in respiratory antibiotics & chronic care supply demand",
            "source": "Roshydromet Russia"
        }
    ]
    for sig in signals_data:
        db.add(ExternalSignal(**sig))
    db.commit()

    # 7. Run Forecasting & Redistribution Engines to generate predictions & recommendations
    print("[INFO] Executing initial predictive forecasting & redistribution optimization...")
    ForecastingEngine.refresh_all_forecasts(db)
    RedistributionOptimizer.generate_recommendations(db)
    NotificationManager.generate_system_notifications(db)

    print("[SUCCESS] TRACKMEDS Seed Complete! Database is populated and operational.")

    if close_at_end:
        db.close()

if __name__ == "__main__":
    seed_database()
