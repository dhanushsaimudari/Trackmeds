# TRACKMEDS Data Model & Schema

## Entity Relationship Summary

```text
[ Supplier ] (1) <------- (*) [ Medicine ] (1) <------- (*) [ Inventory ] (*) -------> (1) [ Facility ]
                                   ^                                                      ^
                                   |                                                      |
                                  (*)                                                    (*)
                            [ Consumption ]                                        [ ExternalSignal ] (Region)
                                   ^
                                   |
                                  (*)
                             [ Forecast ]
                                   ^
                                   |
                                  (*)
                          [ Redistribution ] (Source & Destination Facilities)
```

## Schema Field Descriptions

### 1. Facility
- `id` (String, Primary Key)
- `name` (String)
- `type` (Enum: PHC, CHC, District Hospital, Regional Warehouse)
- `district` (String)
- `country` (Enum: India, Brazil, South Africa)
- `latitude` (Float)
- `longitude` (Float)
- `population_served` (Integer)
- `capacity` (Integer)
- `status` (Enum: Healthy, Warning, Critical)

### 2. Medicine
- `id` (String, Primary Key)
- `name` (String)
- `category` (Enum: Antibiotics, Rehydration, Insulin, Vaccines, Analgesics, Maternal)
- `unit` (String: tablets, vials, sachet, doses)
- `safety_stock_level` (Integer)
- `unit_cost` (Float)
- `supplier_id` (String, Foreign Key)

### 3. Inventory
- `id` (String, Primary Key)
- `facility_id` (String, Foreign Key)
- `medicine_id` (String, Foreign Key)
- `batch_number` (String)
- `quantity` (Integer)
- `expiry_date` (Date)
- `last_updated` (DateTime)

### 4. Consumption
- `id` (String, Primary Key)
- `facility_id` (String, Foreign Key)
- `medicine_id` (String, Foreign Key)
- `date` (Date)
- `quantity_used` (Integer)

### 5. Supplier
- `id` (String, Primary Key)
- `name` (String)
- `region` (String)
- `average_lead_time_days` (Integer)
- `reliability_score` (Float, 0.0 - 1.0)
- `contact_status` (Enum: Active, Delayed, Restructured)

### 6. Forecast
- `id` (String, Primary Key)
- `facility_id` (String, Foreign Key)
- `medicine_id` (String, Foreign Key)
- `predicted_daily_demand` (Float)
- `predicted_stockout_date` (Date)
- `stockout_probability` (Float, 0.0 - 1.0)
- `confidence` (Float, 0.0 - 1.0)
- `generated_at` (DateTime)

### 7. Redistribution
- `id` (String, Primary Key)
- `source_facility_id` (String, Foreign Key)
- `destination_facility_id` (String, Foreign Key)
- `medicine_id` (String, Foreign Key)
- `quantity` (Integer)
- `distance_km` (Float)
- `reason` (String)
- `status` (Enum: Recommended, Approved, In Transit, Completed)

### 8. ExternalSignal
- `id` (String, Primary Key)
- `region` (String)
- `country` (String)
- `signal_type` (Enum: Monsoon Rainfall, Flood Warning, Heatwave, Disease Outbreak)
- `severity` (Enum: Low, Moderate, High, Extreme)
- `observed_value` (String)
- `forecast_value` (String)
- `source` (String)
- `timestamp` (DateTime)
