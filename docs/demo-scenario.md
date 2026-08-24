# TRACKMEDS End-to-End Demo Script for Hackathon Judges

## Core Demo Narrative: Severe Weather Impact & Supply Chain Defense

### 1. External Signal Detection
- **Action**: Click "Load Emergency Demo Scenario" on the header ribbon.
- **Event**: A heavy monsoon signal (240mm rainfall in Maharashtra district) is ingested into the system.
- **Outcome**: The Health Supply Shock card triggers automatically on the Overview page: `HEALTH SUPPLY SHOCK DETECTED: Monsoon Anomaly in Maharashtra Region`.

### 2. Stockout & Anomaly Prediction
- **Observation**: The system identifies elevated demand (+45% daily consumption for Oral Rehydration Salts & Amoxicillin).
- **Result**: Primary Health Center `PHC-102 (Pune)` projected stockout drops from 22 days down to 4 days. Status changes to **Critical (Red)**.

### 3. Expiry Risk & Nearby Surplus Discovery
- **Observation**: The Expiry Intelligence engine scans nearby facilities for expiring inventory.
- **Result**: `CHC-204 (Satara, 42 km away)` holds 1,800 units of ORS expiring in 25 days with surplus safety buffer.

### 4. Optimal Stock Redistribution Recommendation
- **Action**: Open the **Redistribution Page**.
- **Result**: Optimization engine generates route: `Move 800 units ORS from CHC-204 -> PHC-102`.
- **Metrics**: Avoids ₹48,000 in expiry waste, extends PHC-102 coverage by 14 days, resolves immediate stockout.
- **Gemini Explanation**: Click "Explain Rationale" -> Gemini provides clear operational reasoning explaining distance feasibility, expiry urgency, and recipient deficit.

### 5. Procurement Deficit & Supplier Escalation
- **Observation**: After full regional redistribution, a net regional deficit of 4,500 units remains.
- **Action**: Navigate to **Suppliers Page** -> Click "Generate Procurement Briefing".
- **Result**: Gemini synthesizes a supplier purchase order recommendation specifying lead times, target supplier reliability, and emergency delivery windows.

### 6. Emergency Scenario Simulation
- **Action**: Navigate to **Scenario Simulator**.
- **Action**: Adjust sliders (Demand Increase: +35%, Weather Risk: Extreme, Supplier Delay: 7 Days).
- **Outcome**: Interactive charts display **Before Intervention** (14 PHCs at stockout risk) vs **After Recommended Intervention** (2 PHCs remaining at risk, 92% risk mitigation score).
