/**
 * TRACKMEDS Master Offline & Seed Dataset
 * Structured according to production database schemas and India public health system nodes.
 * Used for zero-latency local fallback and synchronization.
 */

import {
  Facility,
  Medicine,
  InventoryItem,
  RedistributionItem,
  ReplenishmentItem,
  SupplierItem,
  DashboardSummary,
  User,
  EmergencySOSRequest
} from '../types';
import { ALL_INDIA_STATES, getIndiaFacilities } from './indiaGeoData';


export const SEED_USERS: User[] = [
  {
    id: 'USR-ADMIN-01',
    email: 'admin@trackmeds.org',
    name: 'Dr. Rajesh Varma',
    role: 'NATIONAL_ADMIN',
    created_at: new Date().toISOString()
  },
  {
    id: 'USR-STATE-01',
    email: 'state.mh@trackmeds.org',
    name: 'Sanjay Patil',
    role: 'STATE_OFFICER',
    state: 'Maharashtra',
    created_at: new Date().toISOString()
  },
  {
    id: 'USR-DIST-01',
    email: 'district.pune@trackmeds.org',
    name: 'Ananya Deshmukh',
    role: 'DISTRICT_OFFICER',
    state: 'Maharashtra',
    district: 'Pune',
    created_at: new Date().toISOString()
  },
  {
    id: 'USR-PHC-01',
    email: 'phc.haveli@trackmeds.org',
    name: 'Nurse Inspector Kavita',
    role: 'PHC_STAFF',
    state: 'Maharashtra',
    district: 'Pune',
    facility_id: 'FAC-IN-101',
    created_at: new Date().toISOString()
  },
  {
    id: 'USR-SUPP-01',
    email: 'supplier.cipla@trackmeds.org',
    name: 'Vikram Malhotra',
    role: 'SUPPLIER',
    supplier_id: 'SUP-01',
    created_at: new Date().toISOString()
  }
];

const PILOT_FACILITIES: Facility[] = [
  // --- 🇮🇳 MAHARASHTRA NETWORK ---
  {
    id: 'FAC-IN-101',
    name: 'PHC Haveli Pune',
    type: 'PHC',
    state: 'Maharashtra',
    district: 'Pune',
    country: 'India',
    latitude: 18.5204,
    longitude: 73.8567,
    population_served: 45000,
    capacity: 40,
    status: 'Critical',
    stock_health_score: 42,
    critical_medicines_count: 2,
    total_beds: 40,
    occupied_beds: 38,
    available_beds: 2,
    emergency_beds: 8,
    icu_beds: 4,
    occupancy_rate: 95.0,
    bed_risk_status: 'CRITICAL',
    doctors_required: 8,
    doctors_available: 5,
    nurses_required: 20,
    nurses_available: 14,
    support_required: 15,
    support_available: 14,
    staffing_percentage: 70.0,
    staff_risk_status: 'WARNING',
    daily_footfall: 160,
    baseline_footfall: 100,
    footfall_surge_pct: 60.0,
    resilience_score: 54,
    main_factors: ['Acute ORS & Amoxicillin Deficit', 'Bed Over-capacity (95%)', 'Monsoon Surge (+60% footfall)']
  },
  {
    id: 'FAC-IN-102',
    name: 'PHC Shirur Pune',
    type: 'PHC',
    state: 'Maharashtra',
    district: 'Pune',
    country: 'India',
    latitude: 18.8262,
    longitude: 74.3768,
    population_served: 38000,
    capacity: 30,
    status: 'Warning',
    stock_health_score: 68,
    critical_medicines_count: 1,
    total_beds: 30,
    occupied_beds: 24,
    available_beds: 6,
    emergency_beds: 6,
    icu_beds: 2,
    occupancy_rate: 80.0,
    bed_risk_status: 'WARNING',
    doctors_required: 8,
    doctors_available: 7,
    nurses_required: 20,
    nurses_available: 18,
    support_required: 15,
    support_available: 14,
    staffing_percentage: 90.0,
    staff_risk_status: 'HEALTHY',
    daily_footfall: 115,
    baseline_footfall: 90,
    footfall_surge_pct: 27.8,
    resilience_score: 72,
    main_factors: ['Amoxicillin below safety threshold', 'Elevated seasonal attendance']
  },
  {
    id: 'FAC-IN-103',
    name: 'CHC Satara Central',
    type: 'CHC',
    state: 'Maharashtra',
    district: 'Satara',
    country: 'India',
    latitude: 17.6805,
    longitude: 73.9937,
    population_served: 120000,
    capacity: 120,
    status: 'Healthy',
    stock_health_score: 91,
    critical_medicines_count: 0,
    total_beds: 120,
    occupied_beds: 78,
    available_beds: 42,
    emergency_beds: 20,
    icu_beds: 12,
    occupancy_rate: 65.0,
    bed_risk_status: 'NORMAL',
    doctors_required: 20,
    doctors_available: 18,
    nurses_required: 50,
    nurses_available: 48,
    support_required: 35,
    support_available: 34,
    staffing_percentage: 95.0,
    staff_risk_status: 'HEALTHY',
    daily_footfall: 240,
    baseline_footfall: 230,
    footfall_surge_pct: 4.3,
    resilience_score: 89,
    main_factors: ['Surplus ORS & Antibiotics Buffer', 'Safe Inter-district Donor Hub']
  },
  {
    id: 'FAC-IN-104',
    name: 'District Hospital Pune',
    type: 'District Hospital',
    state: 'Maharashtra',
    district: 'Pune',
    country: 'India',
    latitude: 18.5308,
    longitude: 73.8474,
    population_served: 500000,
    capacity: 450,
    status: 'Healthy',
    stock_health_score: 88,
    critical_medicines_count: 0,
    total_beds: 450,
    occupied_beds: 310,
    available_beds: 140,
    emergency_beds: 60,
    icu_beds: 40,
    occupancy_rate: 68.9,
    bed_risk_status: 'NORMAL',
    doctors_required: 60,
    doctors_available: 56,
    nurses_required: 160,
    nurses_available: 152,
    support_required: 100,
    support_available: 95,
    staffing_percentage: 94.0,
    staff_risk_status: 'HEALTHY',
    daily_footfall: 680,
    baseline_footfall: 650,
    footfall_surge_pct: 4.6,
    resilience_score: 92,
    main_factors: ['Stable Multi-Specialty Clinical Reserve']
  },
  {
    id: 'FAC-IN-105',
    name: 'PHC Baramati',
    type: 'PHC',
    state: 'Maharashtra',
    district: 'Pune',
    country: 'India',
    latitude: 18.1517,
    longitude: 74.5771,
    population_served: 42000,
    capacity: 35,
    status: 'Healthy',
    stock_health_score: 87,
    critical_medicines_count: 0,
    total_beds: 35,
    occupied_beds: 20,
    available_beds: 15,
    emergency_beds: 6,
    icu_beds: 2,
    occupancy_rate: 57.1,
    bed_risk_status: 'NORMAL',
    doctors_required: 8,
    doctors_available: 8,
    nurses_required: 20,
    nurses_available: 19,
    support_required: 15,
    support_available: 15,
    staffing_percentage: 97.0,
    staff_risk_status: 'HEALTHY',
    daily_footfall: 95,
    baseline_footfall: 90,
    footfall_surge_pct: 5.5,
    resilience_score: 91,
    main_factors: ['Stable stock levels']
  },
  {
    id: 'FAC-IN-111',
    name: 'Regional Medical Depot Pune',
    type: 'Warehouse',
    state: 'Maharashtra',
    district: 'Pune',
    country: 'India',
    latitude: 18.5074,
    longitude: 73.8077,
    population_served: 2500000,
    capacity: 1200,
    status: 'Healthy',
    stock_health_score: 96,
    critical_medicines_count: 0,
    total_beds: 0,
    occupied_beds: 0,
    available_beds: 0,
    emergency_beds: 0,
    icu_beds: 0,
    occupancy_rate: 0,
    bed_risk_status: 'NORMAL',
    doctors_required: 2,
    doctors_available: 2,
    nurses_required: 4,
    nurses_available: 4,
    support_required: 30,
    support_available: 28,
    staffing_percentage: 95.0,
    staff_risk_status: 'HEALTHY',
    daily_footfall: 30,
    baseline_footfall: 30,
    footfall_surge_pct: 0.0,
    resilience_score: 98,
    main_factors: ['Central High-Volume State Reserve']
  },

  // --- 🇮🇳 KERALA NETWORK ---
  {
    id: 'FAC-IN-201',
    name: 'PHC Aluva Kochi',
    type: 'PHC',
    state: 'Kerala',
    district: 'Ernakulam',
    country: 'India',
    latitude: 10.1004,
    longitude: 76.3570,
    population_served: 52000,
    capacity: 45,
    status: 'Warning',
    stock_health_score: 69,
    critical_medicines_count: 1,
    total_beds: 45,
    occupied_beds: 35,
    available_beds: 10,
    emergency_beds: 8,
    icu_beds: 4,
    occupancy_rate: 77.8,
    bed_risk_status: 'WARNING',
    doctors_required: 8,
    doctors_available: 7,
    nurses_required: 22,
    nurses_available: 19,
    support_required: 15,
    support_available: 14,
    staffing_percentage: 89.0,
    staff_risk_status: 'HEALTHY',
    daily_footfall: 135,
    baseline_footfall: 110,
    footfall_surge_pct: 22.7,
    resilience_score: 75,
    main_factors: ['Seasonal inhaler demand elevation']
  },
  {
    id: 'FAC-IN-202',
    name: 'CHC Ernakulam North',
    type: 'CHC',
    state: 'Kerala',
    district: 'Ernakulam',
    country: 'India',
    latitude: 9.9816,
    longitude: 76.2999,
    population_served: 140000,
    capacity: 150,
    status: 'Healthy',
    stock_health_score: 93,
    critical_medicines_count: 0,
    total_beds: 150,
    occupied_beds: 95,
    available_beds: 55,
    emergency_beds: 22,
    icu_beds: 15,
    occupancy_rate: 63.3,
    bed_risk_status: 'NORMAL',
    doctors_required: 22,
    doctors_available: 21,
    nurses_required: 55,
    nurses_available: 53,
    support_required: 35,
    support_available: 34,
    staffing_percentage: 96.0,
    staff_risk_status: 'HEALTHY',
    daily_footfall: 290,
    baseline_footfall: 280,
    footfall_surge_pct: 3.6,
    resilience_score: 93,
    main_factors: ['Strong buffer stock']
  },

  // --- 🇮🇳 GUJARAT NETWORK ---
  {
    id: 'FAC-IN-301',
    name: 'PHC Sanand Ahmedabad',
    type: 'PHC',
    state: 'Gujarat',
    district: 'Ahmedabad',
    country: 'India',
    latitude: 22.9922,
    longitude: 72.3813,
    population_served: 49000,
    capacity: 40,
    status: 'Healthy',
    stock_health_score: 89,
    critical_medicines_count: 0,
    total_beds: 40,
    occupied_beds: 22,
    available_beds: 18,
    emergency_beds: 8,
    icu_beds: 3,
    occupancy_rate: 55.0,
    bed_risk_status: 'NORMAL',
    doctors_required: 8,
    doctors_available: 8,
    nurses_required: 20,
    nurses_available: 19,
    support_required: 15,
    support_available: 14,
    staffing_percentage: 95.0,
    staff_risk_status: 'HEALTHY',
    daily_footfall: 110,
    baseline_footfall: 105,
    footfall_surge_pct: 4.8,
    resilience_score: 90,
    main_factors: ['Optimal inventory distribution']
  },

  // --- 🇮🇳 KARNATAKA NETWORK ---
  {
    id: 'FAC-IN-401',
    name: 'PHC Devanahalli Bengaluru Rural',
    type: 'PHC',
    state: 'Karnataka',
    district: 'Bengaluru Rural',
    country: 'India',
    latitude: 13.2483,
    longitude: 77.7126,
    population_served: 54000,
    capacity: 45,
    status: 'Healthy',
    stock_health_score: 92,
    critical_medicines_count: 0,
    total_beds: 45,
    occupied_beds: 25,
    available_beds: 20,
    emergency_beds: 8,
    icu_beds: 4,
    occupancy_rate: 55.5,
    bed_risk_status: 'NORMAL',
    doctors_required: 8,
    doctors_available: 8,
    nurses_required: 20,
    nurses_available: 20,
    support_required: 15,
    support_available: 15,
    staffing_percentage: 100.0,
    staff_risk_status: 'HEALTHY',
    daily_footfall: 120,
    baseline_footfall: 115,
    footfall_surge_pct: 4.3,
    resilience_score: 94,
    main_factors: ['Full staffing and balanced stock']
  }
];

const ALL_GENERATED_FACILITIES = getIndiaFacilities('All', 'All');
const existingFacilityIds = new Set(PILOT_FACILITIES.map(f => f.id));
export const SEED_FACILITIES: Facility[] = [
  ...PILOT_FACILITIES,
  ...ALL_GENERATED_FACILITIES.filter(f => !existingFacilityIds.has(f.id))
];

export const SEED_INVENTORY: InventoryItem[] = [

  {
    id: 'INV-101-ORS',
    facility_id: 'FAC-IN-101',
    facility_name: 'PHC Haveli Pune',
    medicine_id: 'MED-ORS',
    medicine_name: 'Oral Rehydration Salts (ORS)',
    category: 'Rehydration',
    unit: 'sachets',
    batch_number: 'B-2026-0012',
    quantity: 280,
    expiry_date: '2026-11-20',
    days_to_expiry: 74,
    daily_consumption: 48,
    safety_stock_level: 1200,
    predicted_stockout_date: '2026-09-12',
    days_to_stockout: 4,
    risk_level: 'Critical',
    last_updated: new Date().toISOString()
  },
  {
    id: 'INV-101-AMX',
    facility_id: 'FAC-IN-101',
    facility_name: 'PHC Haveli Pune',
    medicine_id: 'MED-AMX',
    medicine_name: 'Amoxicillin 500mg',
    category: 'Antibiotics',
    unit: 'tablets',
    batch_number: 'B-2026-0044',
    quantity: 320,
    expiry_date: '2026-12-15',
    days_to_expiry: 99,
    daily_consumption: 38,
    safety_stock_level: 800,
    predicted_stockout_date: '2026-09-16',
    days_to_stockout: 6,
    risk_level: 'High',
    last_updated: new Date().toISOString()
  },
  {
    id: 'INV-103-ORS',
    facility_id: 'FAC-IN-103',
    facility_name: 'CHC Satara Central',
    medicine_id: 'MED-ORS',
    medicine_name: 'Oral Rehydration Salts (ORS)',
    category: 'Rehydration',
    unit: 'sachets',
    batch_number: 'B-2026-0120',
    quantity: 2600,
    expiry_date: '2026-10-18',
    days_to_expiry: 41,
    daily_consumption: 45,
    safety_stock_level: 1200,
    predicted_stockout_date: '2026-11-05',
    days_to_stockout: 58,
    risk_level: 'Low',
    last_updated: new Date().toISOString()
  },
  {
    id: 'INV-111-ORS',
    facility_id: 'FAC-IN-111',
    facility_name: 'Regional Medical Depot Pune',
    medicine_id: 'MED-ORS',
    medicine_name: 'Oral Rehydration Salts (ORS)',
    category: 'Rehydration',
    unit: 'sachets',
    batch_number: 'B-2026-0880',
    quantity: 11000,
    expiry_date: '2027-04-30',
    days_to_expiry: 235,
    daily_consumption: 80,
    safety_stock_level: 2500,
    predicted_stockout_date: '2027-01-20',
    days_to_stockout: 138,
    risk_level: 'Low',
    last_updated: new Date().toISOString()
  }
];

export const SEED_REDISTRIBUTIONS: RedistributionItem[] = [
  {
    id: 'RD-FAC-IN-103-FAC-IN-101-MED-ORS',
    source_facility_id: 'FAC-IN-103',
    source_facility_name: 'CHC Satara Central',
    destination_facility_id: 'FAC-IN-101',
    destination_facility_name: 'PHC Haveli Pune',
    medicine_id: 'MED-ORS',
    medicine_name: 'Oral Rehydration Salts (ORS)',
    quantity: 700,
    distance_km: 84.5,
    reason: 'Redistribute 700 units from CHC Satara Central to PHC Haveli Pune over 84.5 km. Prioritizes Batch #B-2026-0120 (expires in 41 days) to resolve projected stockout.',
    status: 'Recommended',
    estimated_waste_avoided_value: 10500.0,
    ai_explanation: 'Transferring 700 units from CHC Satara Central addresses immediate critical stockout at PHC Haveli Pune (84.5 km distance). Saves an estimated ₹10,500 in expiring inventory.',
    created_at: new Date().toISOString()
  },
  {
    id: 'RD-FAC-IN-111-FAC-IN-102-MED-AMX',
    source_facility_id: 'FAC-IN-111',
    source_facility_name: 'Regional Medical Depot Pune',
    destination_facility_id: 'FAC-IN-102',
    destination_facility_name: 'PHC Shirur Pune',
    medicine_id: 'MED-AMX',
    medicine_name: 'Amoxicillin 500mg',
    quantity: 500,
    distance_km: 62.0,
    reason: 'Dispatch 500 units from Pune Regional Depot to PHC Shirur over 62.0 km to re-establish required 20-day antibiotic safety buffer.',
    status: 'Recommended',
    estimated_waste_avoided_value: 4250.0,
    ai_explanation: 'Proactive intra-district dispatch eliminates clinic antibiotic gap prior to the standard monthly replenishment cycle.',
    created_at: new Date().toISOString()
  }
];

export const SEED_REPLENISHMENTS: ReplenishmentItem[] = [
  {
    id: 'RPL-FAC-IN-101-MED-INS',
    facility_id: 'FAC-IN-101',
    facility_name: 'PHC Haveli Pune',
    medicine_id: 'MED-INS',
    medicine_name: 'Human Insulin 100IU/ml',
    quantity_required: 150,
    urgency: 'High',
    expected_stockout_date: '2026-09-20',
    recommended_supplier_id: 'SUP-04',
    recommended_supplier_name: 'Biocon Biologics Distribution',
    status: 'Recommended',
    reason: 'Internal safe surplus exhausted across regional district network. Direct manufacturer requisition required.',
    created_at: new Date().toISOString()
  },
  {
    id: 'RPL-FAC-IN-102-MED-OXY',
    facility_id: 'FAC-IN-102',
    facility_name: 'PHC Shirur Pune',
    medicine_id: 'MED-OXY',
    medicine_name: 'Oxytocin 10IU/ml Injection',
    quantity_required: 200,
    urgency: 'Critical',
    expected_stockout_date: '2026-09-18',
    recommended_supplier_id: 'SUP-05',
    recommended_supplier_name: 'Hetero Labs National Reserves',
    status: 'Recommended',
    reason: 'Critical maternal health buffer maintenance for institutional delivery caseload.',
    created_at: new Date().toISOString()
  }
];

export const SEED_SUPPLIERS: SupplierItem[] = [
  { id: 'SUP-01', name: 'Cipla Healthcare Logistics', region: 'Maharashtra, India', average_lead_time_days: 4, reliability_score: 0.97, contact_status: 'Active' },
  { id: 'SUP-02', name: 'Sun Pharma Supply Chain', region: 'Gujarat, India', average_lead_time_days: 5, reliability_score: 0.95, contact_status: 'Active' },
  { id: 'SUP-03', name: "Dr. Reddy's Laboratories Emergency Depot", region: 'Telangana, India', average_lead_time_days: 4, reliability_score: 0.96, contact_status: 'Active' },
  { id: 'SUP-04', name: 'Biocon Biologics Distribution', region: 'Karnataka, India', average_lead_time_days: 5, reliability_score: 0.94, contact_status: 'Active' },
  { id: 'SUP-05', name: 'Hetero Labs National Reserves', region: 'Telangana, India', average_lead_time_days: 3, reliability_score: 0.98, contact_status: 'Active' }
];

export const SEED_EMERGENCY_REQUESTS: EmergencySOSRequest[] = [
  {
    id: 'SOS-2026-0891',
    requesting_facility_id: 'FAC-IN-101',
    requesting_facility_name: 'PHC Haveli Pune',
    requesting_state: 'Maharashtra',
    requesting_district: 'Pune',
    item_name: 'Oxygen Cylinders 40L (Medical Grade)',
    quantity_needed: 100,
    urgency: 'MASS_CASUALTY',
    incident_description: 'Multi-vehicle highway bus accident near Hadapsar. 38 trauma victims arriving with acute respiratory trauma. Local reserve exhausted.',
    status: 'OPEN_BROADCAST',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    matched_donors: [
      {
        facility_id: 'FAC-IN-104',
        facility_name: 'District Hospital Pune',
        district: 'Pune',
        state: 'Maharashtra',
        available_stock: 180,
        distance_km: 12.4,
        eta_minutes: 25,
        contact_phone: '+91-20-2612-4400'
      },
      {
        facility_id: 'FAC-IN-111',
        facility_name: 'Regional Medical Depot Pune',
        district: 'Pune',
        state: 'Maharashtra',
        available_stock: 350,
        distance_km: 18.2,
        eta_minutes: 35,
        contact_phone: '+91-20-2567-8900'
      },
      {
        facility_id: 'FAC-IN-103',
        facility_name: 'CHC Satara Central',
        district: 'Satara',
        state: 'Maharashtra',
        available_stock: 95,
        distance_km: 84.5,
        eta_minutes: 75,
        contact_phone: '+91-2162-234567'
      }
    ]
  },
  {
    id: 'SOS-2026-0884',
    requesting_facility_id: 'FAC-IN-102',
    requesting_facility_name: 'PHC Shirur Pune',
    requesting_state: 'Maharashtra',
    requesting_district: 'Pune',
    item_name: 'Anti-Snake Venom (Polyvalent) 10ml',
    quantity_needed: 30,
    urgency: 'CRITICAL_SOS',
    incident_description: 'Flooding in riverside settlements resulted in 4 severe Russell Viper envenomations within 2 hours. Stock depleted.',
    status: 'IN_TRANSIT',
    accepting_facility_id: 'FAC-IN-104',
    accepting_facility_name: 'District Hospital Pune',
    quantity_fulfilled: 30,
    distance_km: 48.0,
    eta_minutes: 42,
    created_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  }
];

export const getSeedSummary = (country = 'India', state = 'All', district = 'All'): DashboardSummary => {
  let facs = SEED_FACILITIES;
  if (country !== 'All') {
    facs = facs.filter(f => f.country.toLowerCase() === country.toLowerCase());
  }
  if (state !== 'All') {
    facs = facs.filter(f => f.state?.toLowerCase() === state.toLowerCase());
  }
  if (district !== 'All') {
    facs = facs.filter(f => f.district?.toLowerCase() === district.toLowerCase());
  }

  // If filtered set is empty, fall back to procedural generation for that state
  if (facs.length === 0 && state !== 'All') {
    facs = getIndiaFacilities(state, district);
  }

  const totalBeds = facs.reduce((acc, f) => acc + (f.total_beds || 0), 0) || 450;
  const occBeds = facs.reduce((acc, f) => acc + (f.occupied_beds || 0), 0) || 280;
  const docsAvail = facs.reduce((acc, f) => acc + (f.doctors_available || 0), 0) || 54;
  const docsReq = facs.reduce((acc, f) => acc + (f.doctors_required || 0), 0) || 60;
  const nurseAvail = facs.reduce((acc, f) => acc + (f.nurses_available || 0), 0) || 140;
  const nurseReq = facs.reduce((acc, f) => acc + (f.nurses_required || 0), 0) || 155;
  const totalFootfall = facs.reduce((acc, f) => acc + (f.daily_footfall || 0), 0) || 980;

  const targetStateName = state !== 'All' ? state : 'Maharashtra';
  const stateObj = ALL_INDIA_STATES.find(s => s.name.toLowerCase() === targetStateName.toLowerCase()) || ALL_INDIA_STATES[0];

  return {
    facilities_monitored: facs.length > 0 ? facs.length : 12,
    medicines_tracked: 12,
    stockout_risks: facs.filter(f => f.status === 'Critical').length || 1,
    expiry_risks: Math.max(1, Math.round(facs.length * 0.15)),
    demand_anomalies: state !== 'All' ? 2 : 5,
    resilience_score: Math.round(facs.reduce((acc, f) => acc + (f.resilience_score || 80), 0) / Math.max(1, facs.length)) || 85,
    waste_avoided_currency: state !== 'All' ? 182000 : 482000,
    health_supply_shock_detected: true,
    shock_details: {
      title: `${stateObj.name} Sentinel Health Telemetry Alert`,
      region: district !== 'All' ? district : (stateObj.districts[0]?.name || stateObj.name),
      country: 'India',
      severity: 'High',
      affected_facilities_count: Math.max(2, Math.round(facs.length * 0.3)),
      projected_duration: '14 Days',
      observed_cause: `${stateObj.climateZone}: ${stateObj.epidemicRisks.join('; ')}.`,
      recommended_action: `Initiate proactive FEFO balancing of anti-infectives & emergency resources across ${stateObj.name} transit corridors.`
    },
    country: 'India',
    region: state !== 'All' ? state : 'All',
    total_regional_beds: totalBeds,
    occupied_regional_beds: occBeds,
    available_regional_beds: Math.max(0, totalBeds - occBeds),
    regional_bed_occupancy_pct: Math.round((occBeds / Math.max(1, totalBeds)) * 100),
    bed_risk_summary: (occBeds / Math.max(1, totalBeds)) > 0.85 ? 'CRITICAL' : ((occBeds / Math.max(1, totalBeds)) > 0.70 ? 'WARNING' : 'NORMAL'),
    total_doctors_available: docsAvail,
    total_doctors_required: docsReq,
    total_nurses_available: nurseAvail,
    total_nurses_required: nurseReq,
    regional_staffing_pct: Math.round((nurseAvail / Math.max(1, nurseReq)) * 100),
    staff_risk_summary: (nurseAvail / Math.max(1, nurseReq)) < 0.75 ? 'WARNING' : 'HEALTHY',
    total_daily_footfall: totalFootfall,
    average_footfall_surge_pct: 18.5
  };
};

