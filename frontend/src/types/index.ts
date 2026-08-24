export type Country = 'India' | 'Brazil' | 'South Africa' | 'China' | 'Russia' | 'All';
export type UserRole = 'National Admin' | 'District Officer' | 'PHC Manager';
export type Language = 'en' | 'hi';

export interface DashboardSummary {
  facilities_monitored: number;
  medicines_tracked: number;
  stockout_risks: number;
  expiry_risks: number;
  demand_anomalies: number;
  resilience_score: number;
  waste_avoided_currency: number;
  health_supply_shock_detected: boolean;
  shock_details?: {
    title: string;
    region: string;
    country: string;
    severity: string;
    affected_facilities_count: number;
    projected_duration: string;
    observed_cause: string;
    recommended_action: string;
  };
  country: string;
  region: string;
  total_regional_beds?: number;
  occupied_regional_beds?: number;
  available_regional_beds?: number;
  regional_bed_occupancy_pct?: number;
  bed_risk_summary?: 'NORMAL' | 'WARNING' | 'CRITICAL';
  total_doctors_available?: number;
  total_doctors_required?: number;
  total_nurses_available?: number;
  total_nurses_required?: number;
  regional_staffing_pct?: number;
  staff_risk_summary?: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  resilience_breakdown_summary?: Record<string, number>;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  district: string;
  country: string;
  latitude: number;
  longitude: number;
  population_served: number;
  capacity: number;
  status: 'Healthy' | 'Warning' | 'Critical';
  stock_health_score: number;
  critical_medicines_count: number;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  emergency_beds: number;
  icu_beds: number;
  occupancy_rate: number;
  bed_risk_status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  doctors_required: number;
  doctors_available: number;
  nurses_required: number;
  nurses_available: number;
  support_required: number;
  support_available: number;
  staffing_percentage: number;
  staff_risk_status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  resilience_score: number;
  resilience_breakdown?: Record<string, number>;
  main_factors?: string[];
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  unit: string;
  safety_stock_level: number;
  unit_cost: number;
  supplier_id?: string;
}

export interface InventoryItem {
  id: string;
  facility_id: string;
  facility_name: string;
  medicine_id: string;
  medicine_name: string;
  category: string;
  unit: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  days_to_expiry: number;
  daily_consumption: number;
  safety_stock_level: number;
  predicted_stockout_date?: string;
  days_to_stockout: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  last_updated: string;
}

export interface ForecastItem {
  id: string;
  facility_id: string;
  facility_name: string;
  medicine_id: string;
  medicine_name: string;
  predicted_daily_demand: number;
  predicted_stockout_date?: string;
  days_until_stockout: number;
  stockout_probability: number;
  confidence: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  generated_at: string;
}

export interface RedistributionItem {
  id: string;
  source_facility_id: string;
  source_facility_name: string;
  destination_facility_id: string;
  destination_facility_name: string;
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  distance_km: number;
  reason: string;
  status: 'Recommended' | 'Approved' | 'In Transit' | 'Completed';
  estimated_waste_avoided_value: number;
  expiry_date?: string;
  ai_explanation?: string;
  created_at: string;
}

export interface SupplierItem {
  id: string;
  name: string;
  region: string;
  average_lead_time_days: number;
  reliability_score: number;
  contact_status: string;
}

export interface NotificationItem {
  id: string;
  type: 'stockout' | 'expiry' | 'anomaly' | 'redistribution' | 'shock';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  facility_id?: string;
  read_status: boolean;
  timestamp: string;
}

export interface ScenarioRequest {
  demand_increase_pct: number;
  weather_severity: string;
  outbreak_severity: string;
  transport_disruption: number;
  supplier_delay_days: number;
  country: string;
}

export interface ScenarioResponse {
  before_interventions_facilities_at_risk: number;
  recommended_interventions_redistributed_units: number;
  recommended_interventions_procurement_units: number;
  after_interventions_facilities_at_risk: number;
  estimated_cost_saved: number;
  confidence_score: number;
  intervention_summary: string;
  facilities_comparison: Array<{
    facility_id: string;
    facility_name: string;
    district: string;
    stockout_days_before: number;
    stockout_days_after: number;
    status_before: string;
    status_after: string;
  }>;
}
