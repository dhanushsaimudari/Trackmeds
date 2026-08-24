from pydantic import BaseModel, Field
from typing import List, Optional
import datetime

# --- Facility Schemas ---
class FacilityBase(BaseModel):
    name: str
    type: str
    district: str
    country: str
    latitude: float
    longitude: float
    population_served: int
    capacity: int
    status: str

class FacilityResponse(FacilityBase):
    id: str
    stock_health_score: Optional[float] = 92.0
    critical_medicines_count: Optional[int] = 0

    # Bed Availability System
    total_beds: int = 60
    occupied_beds: int = 35
    available_beds: int = 25
    emergency_beds: int = 10
    icu_beds: int = 8
    occupancy_rate: float = 58.3
    bed_risk_status: str = "NORMAL"

    # Medical Personnel Availability System
    doctors_required: int = 8
    doctors_available: int = 7
    nurses_required: int = 20
    nurses_available: int = 18
    support_required: int = 15
    support_available: int = 14
    staffing_percentage: float = 91.1
    staff_risk_status: str = "HEALTHY"

    # Integrated Deterministic Resilience
    resilience_score: float = 88.5
    resilience_breakdown: Optional[dict] = None
    main_factors: List[str] = []
    last_updated: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class FacilityBedsUpdate(BaseModel):
    occupied_beds: int = Field(ge=0)
    total_beds: Optional[int] = Field(default=None, ge=1)
    emergency_beds: Optional[int] = Field(default=None, ge=0)
    icu_beds: Optional[int] = Field(default=None, ge=0)

class FacilityStaffUpdate(BaseModel):
    doctors_available: int = Field(ge=0)
    nurses_available: int = Field(ge=0)
    support_available: int = Field(ge=0)
    doctors_required: Optional[int] = Field(default=None, ge=1)
    nurses_required: Optional[int] = Field(default=None, ge=1)
    support_required: Optional[int] = Field(default=None, ge=1)


# --- Medicine Schemas ---
class MedicineBase(BaseModel):
    name: str
    category: str
    unit: str
    safety_stock_level: int
    unit_cost: float
    supplier_id: Optional[str] = None

class MedicineResponse(MedicineBase):
    id: str

    class Config:
        from_attributes = True


# --- Inventory Schemas ---
class InventoryResponse(BaseModel):
    id: str
    facility_id: str
    facility_name: Optional[str] = None
    medicine_id: str
    medicine_name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    batch_number: str
    quantity: int
    expiry_date: datetime.date
    days_to_expiry: Optional[int] = None
    daily_consumption: Optional[float] = 0.0
    safety_stock_level: Optional[int] = 500
    predicted_stockout_date: Optional[datetime.date] = None
    days_to_stockout: Optional[int] = None
    risk_level: Optional[str] = "Low"
    last_updated: datetime.datetime

    class Config:
        from_attributes = True


# --- Forecast Schemas ---
class ForecastResponse(BaseModel):
    id: str
    facility_id: str
    facility_name: str
    medicine_id: str
    medicine_name: str
    predicted_daily_demand: float
    predicted_stockout_date: Optional[datetime.date]
    days_until_stockout: Optional[int]
    stockout_probability: float
    confidence: float
    risk_level: str
    generated_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Redistribution Schemas ---
class RedistributionResponse(BaseModel):
    id: str
    source_facility_id: str
    source_facility_name: str
    destination_facility_id: str
    destination_facility_name: str
    medicine_id: str
    medicine_name: str
    quantity: int
    distance_km: float
    reason: str
    status: str
    estimated_waste_avoided_value: Optional[float] = 0.0
    expiry_date: Optional[datetime.date] = None
    ai_explanation: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- External Signal Schemas ---
class ExternalSignalResponse(BaseModel):
    id: str
    region: str
    country: str
    signal_type: str
    severity: str
    observed_value: str
    forecast_value: str
    source: str
    timestamp: datetime.datetime

    class Config:
        from_attributes = True


# --- Supplier Schemas ---
class SupplierResponse(BaseModel):
    id: str
    name: str
    region: str
    average_lead_time_days: int
    reliability_score: float
    contact_status: str

    class Config:
        from_attributes = True


# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    severity: str
    facility_id: Optional[str]
    read_status: bool
    timestamp: datetime.datetime

    class Config:
        from_attributes = True


# --- Dashboard Summary Schema ---
class DashboardSummaryResponse(BaseModel):
    facilities_monitored: int
    medicines_tracked: int
    stockout_risks: int
    expiry_risks: int
    demand_anomalies: int
    resilience_score: float
    waste_avoided_currency: float
    health_supply_shock_detected: bool
    shock_details: Optional[dict] = None
    country: str
    region: str

    # Bed & Staff Visibility Aggregate Metrics
    total_regional_beds: int = 0
    occupied_regional_beds: int = 0
    available_regional_beds: int = 0
    regional_bed_occupancy_pct: float = 0.0
    bed_risk_summary: str = "NORMAL"

    total_doctors_available: int = 0
    total_doctors_required: int = 0
    total_nurses_available: int = 0
    total_nurses_required: int = 0
    regional_staffing_pct: float = 0.0
    staff_risk_summary: str = "HEALTHY"

    resilience_breakdown_summary: Optional[dict] = None


# --- AI Chat Schemas ---
class AIAskRequest(BaseModel):
    question: str
    country: Optional[str] = "India"
    region: Optional[str] = "All"
    context_facility_id: Optional[str] = None

class AIAskResponse(BaseModel):
    answer: str
    supporting_data: dict
    timestamp: datetime.datetime


# --- Scenario Simulation Schemas ---
class ScenarioSimulateRequest(BaseModel):
    demand_increase_pct: float = Field(default=30.0, ge=0, le=200)
    weather_severity: str = Field(default="High")  # Low, Moderate, High, Extreme
    outbreak_severity: str = Field(default="Moderate")  # None, Moderate, Severe
    transport_disruption: float = Field(default=20.0, ge=0, le=100)  # % transport delay
    supplier_delay_days: int = Field(default=5, ge=0, le=30)
    country: Optional[str] = "India"

class ScenarioSimulateResponse(BaseModel):
    before_interventions_facilities_at_risk: int
    recommended_interventions_redistributed_units: int
    recommended_interventions_procurement_units: int
    after_interventions_facilities_at_risk: int
    estimated_cost_saved: float
    confidence_score: float
    intervention_summary: str
    facilities_comparison: List[dict]
