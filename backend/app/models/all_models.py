import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Date, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False)  # PHC, CHC, District Hospital, Warehouse
    state = Column(String, nullable=False, index=True)  # Maharashtra, Kerala, Gujarat, etc.
    district = Column(String, nullable=False, index=True)
    country = Column(String, nullable=False, index=True)  # India, Brazil, South Africa
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    population_served = Column(Integer, default=50000)
    capacity = Column(Integer, default=100)
    status = Column(String, default="Healthy")  # Healthy, Warning, Critical

    # --- Bed Availability System ---
    total_beds = Column(Integer, default=60)
    occupied_beds = Column(Integer, default=35)
    emergency_beds = Column(Integer, default=10)
    icu_beds = Column(Integer, default=8)
    last_beds_updated = Column(DateTime, default=utcnow)

    # --- Patient Footfall Telemetry System ---
    daily_footfall = Column(Integer, default=120)
    baseline_footfall = Column(Integer, default=100)
    last_footfall_updated = Column(DateTime, default=utcnow)

    # --- Medical Personnel Availability System ---
    doctors_required = Column(Integer, default=8)
    doctors_available = Column(Integer, default=7)
    nurses_required = Column(Integer, default=20)
    nurses_available = Column(Integer, default=18)
    support_required = Column(Integer, default=15)
    support_available = Column(Integer, default=14)
    last_staff_updated = Column(DateTime, default=utcnow)

    inventories = relationship("Inventory", back_populates="facility", cascade="all, delete-orphan")
    consumptions = relationship("Consumption", back_populates="facility", cascade="all, delete-orphan")
    forecasts = relationship("Forecast", back_populates="facility", cascade="all, delete-orphan")
    users = relationship("User", back_populates="facility")
    replenishments = relationship("Replenishment", back_populates="facility", cascade="all, delete-orphan")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False)  # Antibiotics, Rehydration, Insulin, Vaccines, Analgesics, Maternal
    unit = Column(String, nullable=False)  # tablets, vials, sachets, doses
    safety_stock_level = Column(Integer, default=500)
    unit_cost = Column(Float, default=10.0)
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=True)

    supplier = relationship("Supplier", back_populates="medicines")
    inventories = relationship("Inventory", back_populates="medicine", cascade="all, delete-orphan")
    consumptions = relationship("Consumption", back_populates="medicine", cascade="all, delete-orphan")
    forecasts = relationship("Forecast", back_populates="medicine", cascade="all, delete-orphan")
    replenishments = relationship("Replenishment", back_populates="medicine", cascade="all, delete-orphan")


class Inventory(Base):
    __tablename__ = "inventories"

    id = Column(String, primary_key=True, index=True)
    facility_id = Column(String, ForeignKey("facilities.id"), nullable=False, index=True)
    medicine_id = Column(String, ForeignKey("medicines.id"), nullable=False, index=True)
    batch_number = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    expiry_date = Column(Date, nullable=False, index=True)
    last_updated = Column(DateTime, default=utcnow)

    facility = relationship("Facility", back_populates="inventories")
    medicine = relationship("Medicine", back_populates="inventories")


class Consumption(Base):
    __tablename__ = "consumptions"

    id = Column(String, primary_key=True, index=True)
    facility_id = Column(String, ForeignKey("facilities.id"), nullable=False, index=True)
    medicine_id = Column(String, ForeignKey("medicines.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    quantity_used = Column(Integer, nullable=False, default=0)

    facility = relationship("Facility", back_populates="consumptions")
    medicine = relationship("Medicine", back_populates="consumptions")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    region = Column(String, nullable=False)
    average_lead_time_days = Column(Integer, default=7)
    reliability_score = Column(Float, default=0.95)  # 0.0 to 1.0
    contact_status = Column(String, default="Active")

    medicines = relationship("Medicine", back_populates="supplier")
    users = relationship("User", back_populates="supplier")
    replenishments = relationship("Replenishment", back_populates="recommended_supplier")


class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(String, primary_key=True, index=True)
    facility_id = Column(String, ForeignKey("facilities.id"), nullable=False, index=True)
    medicine_id = Column(String, ForeignKey("medicines.id"), nullable=False, index=True)
    predicted_daily_demand = Column(Float, nullable=False)
    predicted_stockout_date = Column(Date, nullable=True)
    stockout_probability = Column(Float, default=0.0)
    confidence = Column(Float, default=0.9)
    risk_level = Column(String, default="Low")  # Low, Medium, High, Critical
    risk_reason = Column(Text, nullable=True)  # Explainable classification rationale
    generated_at = Column(DateTime, default=utcnow)

    facility = relationship("Facility", back_populates="forecasts")
    medicine = relationship("Medicine", back_populates="forecasts")


class Redistribution(Base):
    __tablename__ = "redistributions"

    id = Column(String, primary_key=True, index=True)
    source_facility_id = Column(String, ForeignKey("facilities.id"), nullable=False)
    destination_facility_id = Column(String, ForeignKey("facilities.id"), nullable=False)
    medicine_id = Column(String, ForeignKey("medicines.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    distance_km = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String, default="Recommended")  # Recommended, Approved, In Transit, Completed
    created_at = Column(DateTime, default=utcnow)

    source_facility = relationship("Facility", foreign_keys=[source_facility_id])
    destination_facility = relationship("Facility", foreign_keys=[destination_facility_id])
    medicine = relationship("Medicine")


class ExternalSignal(Base):
    __tablename__ = "external_signals"

    id = Column(String, primary_key=True, index=True)
    region = Column(String, nullable=False, index=True)
    country = Column(String, nullable=False, index=True)
    signal_type = Column(String, nullable=False)  # Weather, Disease, Anomaly
    severity = Column(String, nullable=False)  # Low, Moderate, High, Extreme
    observed_value = Column(String, nullable=False)
    forecast_value = Column(String, nullable=False)
    source = Column(String, default="OpenWeather API")
    timestamp = Column(DateTime, default=utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    type = Column(String, nullable=False)  # stockout, expiry, anomaly, redistribution, shock
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String, default="info")  # info, warning, critical
    facility_id = Column(String, nullable=True)
    read_status = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # NATIONAL_ADMIN, STATE_OFFICER, DISTRICT_OFFICER, PHC_STAFF, SUPPLIER
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)
    facility_id = Column(String, ForeignKey("facilities.id"), nullable=True)
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=True)
    approval_status = Column(String, default="approved")  # pending, approved, rejected
    created_at = Column(DateTime, default=utcnow)

    facility = relationship("Facility", back_populates="users")
    supplier = relationship("Supplier", back_populates="users")


class Replenishment(Base):
    __tablename__ = "replenishments"

    id = Column(String, primary_key=True, index=True)
    facility_id = Column(String, ForeignKey("facilities.id"), nullable=False, index=True)
    medicine_id = Column(String, ForeignKey("medicines.id"), nullable=False, index=True)
    quantity_required = Column(Integer, nullable=False)
    urgency = Column(String, default="High")  # Low, Medium, High, Critical
    expected_stockout_date = Column(Date, nullable=True)
    recommended_supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=True)
    status = Column(String, default="Recommended")  # Recommended, Approved, Ordered, Fulfilled
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    facility = relationship("Facility", back_populates="replenishments")
    medicine = relationship("Medicine", back_populates="replenishments")
    recommended_supplier = relationship("Supplier", back_populates="replenishments")


class FederatedRound(Base):
    __tablename__ = "federated_rounds"

    id = Column(String, primary_key=True, index=True)
    round_number = Column(Integer, nullable=False, unique=True)
    global_model_version = Column(String, nullable=False)
    participating_nodes_count = Column(Integer, default=4)
    samples_aggregated = Column(Integer, default=0)
    training_loss = Column(Float, default=0.0)
    validation_mae = Column(Float, default=0.0)
    epsilon_privacy_spent = Column(Float, default=0.0)
    model_weights_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)


class FederatedNode(Base):
    __tablename__ = "federated_nodes"

    id = Column(String, primary_key=True, index=True)
    node_name = Column(String, nullable=False)  # e.g., Maharashtra State Health AI Node
    region = Column(String, nullable=False, index=True)  # Maharashtra, Kerala, Gujarat, Karnataka
    country = Column(String, default="India", index=True)
    local_samples_count = Column(Integer, default=0)
    local_accuracy = Column(Float, default=0.92)
    last_contribution_round = Column(Integer, default=1)
    status = Column(String, default="Active")  # Active, Syncing, Idle
    last_sync = Column(DateTime, default=utcnow)


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(String, primary_key=True, index=True)
    requesting_facility_id = Column(String, ForeignKey("facilities.id"), nullable=False, index=True)
    item_name = Column(String, nullable=False)  # e.g. Oxygen Cylinders 40L, Anti-Snake Venom, Amoxicillin 500mg
    quantity_needed = Column(Integer, nullable=False)
    urgency = Column(String, default="CRITICAL_SOS")  # CRITICAL_SOS, HIGH, MASS_CASUALTY
    incident_description = Column(Text, nullable=False)
    status = Column(String, default="OPEN_BROADCAST")  # OPEN_BROADCAST, MATCHED, ACCEPTED, IN_TRANSIT, FULFILLED, CANCELLED
    
    accepting_facility_id = Column(String, ForeignKey("facilities.id"), nullable=True)
    quantity_fulfilled = Column(Integer, default=0)
    distance_km = Column(Float, nullable=True)
    eta_minutes = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=utcnow)
    resolved_at = Column(DateTime, nullable=True)

    requesting_facility = relationship("Facility", foreign_keys=[requesting_facility_id])
    accepting_facility = relationship("Facility", foreign_keys=[accepting_facility_id])



