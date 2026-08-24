# TRACKMEDS Privacy & Security Architecture

## Non-PHI Privacy Commitment

TRACKMEDS is built strictly for **macro-level health logistics and resource planning**. It operates exclusively on aggregated, facility-level data:

- **Facility Stock Balances**: e.g., Primary Health Center (PHC) 102 currently holds 1,400 units of ORS.
- **Batch Expiry Dates**: e.g., Batch #ORS-2026B expires on 2026-11-15.
- **Aggregated Facility Daily Consumption**: e.g., PHC 102 consumed 45 units yesterday.
- **Environmental Signals**: Regional climate data (rainfall mm, temperature °C).

### Data Exclusions

The platform explicitly prohibits and contains zero fields for:
- Patient Names or Social Identifiers (Aadhaar, CPF, National ID).
- Individual Medical Records or Diagnostic Histories.
- Patient Addresses or Contact Details.
- Individual Prescriptions or Provider-Patient Interactions.

## Role Simulation Framework

TRACKMEDS implements conceptual access controls simulating real-world governance:

1. **National Admin**: Full visibility across all BRICS member nations, national stock metrics, cross-district procurement oversight.
2. **District Officer**: Regional visibility filtered to specific districts/states, managing local facility redistributions.
3. **PHC Manager**: Facility-level focus on stock balances, local consumption rates, and incoming redistribution shipments.
