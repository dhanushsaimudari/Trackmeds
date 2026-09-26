# TRACKMEDS Data Model & Schema

## Entity Relationship Summary

```text
[ User ] (RBAC & Facility Scope)
   |
   +---> [ Facility ] <------- (*) [ Inventory ] (*) -------> (1) [ Medicine ] <------- (1) [ Supplier ]
              ^                         ^                                ^
              |                         |                                |
             (*)                       (*)                              (*)
      [ ColdChainLog ]           [ Consumption ]                   [ Forecast ]
              ^                         ^                                ^
              |                         |                                |
             (*)                       (*)                              (*)
      [ ExternalSignal ]       [ EmergencyRequest ]            [ RedistributionPlan ]
                                        ^
                                        |
                                       (*)
                                   [ AuditLog ]
```

---

## Schema Field Descriptions

### 1. Facility
- `id` (String, Primary Key, e.g. `FAC-IN-101`)
- `name` (String, e.g. `Haveli Primary Health Centre`)
- `type` (Enum: PHC, CHC, SDH, District Hospital, Regional Warehouse)
- `district` (String, e.g. `Pune`)
- `state` (String, e.g. `Maharashtra`)
- `country` (Enum: India, Brazil, South Africa)
- `latitude` / `longitude` (Float)
- `total_beds` / `occupied_beds` (Integer)
- `doctors_count` / `nurses_count` (Integer)
- `population_served` (Integer)
- `status` (Enum: Healthy, Warning, Critical)

### 2. Medicine
- `id` (String, Primary Key, e.g. `MED-AMX`, `MED-ORS`)
- `name` (String, e.g. `Amoxicillin 500mg`, `Oral Rehydration Salts`)
- `category` (Enum: Antibiotics, Rehydration, Insulin, Vaccines, Analgesics, Maternal)
- `unit` (String: tablets, vials, sachet, doses)
- `safety_stock_level` (Integer)
- `unit_cost` (Float)
- `supplier_id` (String, Foreign Key)

### 3. Inventory
- `id` (String, Primary Key)
- `facility_id` (String, Foreign Key -> `Facility.id`)
- `medicine_id` (String, Foreign Key -> `Medicine.id`)
- `batch_number` (String, e.g. `B-AMX-2026-A`)
- `quantity` (Integer, non-negative enforced)
- `expiry_date` (Date, must be > current date on ingestion)
- `last_updated` (DateTime)

### 4. Consumption
- `id` (String, Primary Key)
- `facility_id` (String, Foreign Key)
- `medicine_id` (String, Foreign Key)
- `date` (Date)
- `quantity_used` (Integer, consumed via FEFO)

### 5. Forecast
- `id` (String, Primary Key)
- `facility_id` (String, Foreign Key)
- `medicine_id` (String, Foreign Key)
- `predicted_daily_demand` (Float)
- `predicted_stockout_date` (Date)
- `stockout_probability` (Float, 0.0 - 1.0)
- `risk_level` (Enum: Low, Medium, High, Critical)
- `generated_at` (DateTime)

### 6. RedistributionPlan
- `id` (String, Primary Key)
- `source_facility_id` (String, Foreign Key)
- `destination_facility_id` (String, Foreign Key)
- `medicine_id` (String, Foreign Key)
- `quantity` (Integer)
- `distance_km` (Float)
- `priority_score` (Float)
- `status` (Enum: Recommended, Approved, In Transit, Delivered)

### 7. EmergencyRequest
- `id` (String, Primary Key)
- `requester_facility_id` (String, Foreign Key)
- `donor_facility_id` (String, Foreign Key, Optional)
- `medicine_id` (String, Foreign Key)
- `quantity` (Integer)
- `urgency` (Enum: Low, Medium, High, Critical)
- `status` (Enum: Pending, Accepted, Fulfilled, Rejected)
- `notes` (String)
- `created_at` (DateTime)

### 8. ColdChainLog
- `id` (String, Primary Key)
- `facility_id` (String, Foreign Key)
- `equipment_id` (String, e.g. `ILR-PUN-01`)
- `temperature_celsius` (Float, safe range: 2.0°C - 8.0°C)
- `humidity_percent` (Float)
- `is_excursion` (Boolean, true if out of safe bounds)
- `timestamp` (DateTime)

### 9. User (Authentication & RBAC)
- `id` (String, Primary Key)
- `email` (String, Unique)
- `name` (String)
- `role` (Enum: PHC_USER, DISTRICT_OFFICER, STATE_OFFICER, NATIONAL_ADMIN)
- `facility_id` (String, Foreign Key, for PHC_USER)
- `district` (String, for DISTRICT_OFFICER)
- `state` (String, for STATE_OFFICER)
- `country` (String, e.g. `India`)
- `is_active` (Boolean, requires admin approval for high privilege)
- `hashed_password` (String, cryptographic `salt$hash` format)
