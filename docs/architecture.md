# TRACKMEDS Architecture Documentation

## System Architecture Overview

TRACKMEDS is a modular, high-resilience health supply-chain platform designed for national and regional health ministries across BRICS nations. The system decouples analytical computations (demand forecasting, inventory optimization, distance matrix calculations) from AI interpretation layers (Gemini 3.6 operational briefings, natural language Q&A).

```
+-----------------------------------------------------------------------------------------+
|                                    USER INTERFACE                                       |
|             React 18 + Vite + TypeScript + Tailwind CSS + Leaflet / Google Maps         |
|     (National Command Center Dashboard, GIS Map, Emergency Simulator, Smart Ingestion)  |
+--------------------------------------------+--------------------------------------------+
                                             |
                                     REST API (JSON)
                                             |
+--------------------------------------------v--------------------------------------------+
|                                 FASTAPI BACKEND SERVICE                                 |
|  +-----------------------+  +-----------------------+  +-----------------------------+  |
|  |   Forecasting Engine  |  |   Redistribution      |  |   Emergency SOS &           |  |
|  |   (Holt-Winters ML)   |  |   Optimizer           |  |   Replenishment Manager     |  |
|  +-----------+-----------+  +-----------+-----------+  +--------------+--------------+  |
|              |                          |                             |                 |
|  +-----------v--------------------------v-----------------------------v--------------+  |
|  |                         SQLAlchemy ORM + Pydantic v2 Schemas                      |  |
|  +--------------------------------------+--------------------------------------------+  |
+-----------------------------------------|-----------------------------------------------+
                                          |
                  +-----------------------+-----------------------+
                  |                                               |
+-----------------v-----------------+           +-----------------v-----------------+
|        SQLite / PostgreSQL        |           |         External Adapters         |
|        Database Layer             |           |   (OpenWeather API / ABDM HFR)    |
| (FEFO Batches, Audits, Facilities)|           +-----------------+-----------------+
+-----------------------------------+                             |
                                                        +---------v---------+
                                                        |   Gemini 3.6 AI   |
                                                        |  (Flash & Cascade)|
                                                        +-------------------+
```

---

## Core Modules & Design Rationale

### 1. Data Layer (`backend/app/models/`, `backend/app/database.py`)
- SQLite storage for rapid local evaluation, instantly upgradeable to PostgreSQL via `DATABASE_URL`.
- Clean relational models:
  - `Facility`: Hierarchical public health facilities (PHC, CHC, SDH, DH) across India, Brazil, and South Africa.
  - `Medicine`: Essential formulations with safety stock parameters and clinical categories.
  - `Inventory`: Batch-tracked stock with strict expiration date validation (`expiry_date > today`).
  - `Consumption`: FEFO-ordered operational usage logs.
  - `Forecast`: Machine learning stockout projections and daily demand trends.
  - `RedistributionPlan`: Inter-facility transfer orders with phantom allocation prevention.
  - `EmergencyRequest`: P2P clinic SOS broadcast and donor matching with atomic stock deduction.
  - `ColdChainLog`: Real-time ILR sensor telemetry and thermal excursion alerts.
  - `User`: Cryptographically hashed passwords with role-based scoping (National, State, District, PHC).

### 2. Analytical & Machine Learning Engine (`backend/app/services/forecasting/`)
- Deterministic numerical processing decoupled from generative models.
- Stockout prediction combining rolling consumption rates, patient footfall surge ratios, and climate multipliers (e.g. monsoon rainfall driving diarrheal illness).
- Dynamic Recalculation: Ingestion (`POST /api/inventory`), FEFO consumption (`POST /api/inventory/consume`), and emergency transfers trigger instant forecast re-estimation across all facilities.

### 3. Gemini 3.6 AI Layer (`backend/app/services/gemini/`)
- Powered by Google GenAI SDK (`google-genai`) with **Gemini 3.6 Flash** (`gemini-3.6-flash`).
- Fallback Cascade: Gracefully attempts `gemini-3.6-flash` -> `gemini-2.5-flash` -> `gemini-1.5-flash` -> `DeterministicCopilot.ask_fallback`.
- Offline Clinical Fallback: Delivers contextual, grounded answers for monsoon surges, stockouts, surplus donor facilities, and patient footfall spikes without hallucination or generic duplication.
- Strict Safety: Zero medical treatment or dosage generation; only operational supply-chain intelligence.

### 4. Security & Access Control
- JWT Bearer authentication with cryptographic salt hashing (`salt$hash`).
- Strict Role-Based Access Control (RBAC):
  - `PHC_USER`: Scoped strictly to own facility. Cross-facility reads/writes blocked with 403 Forbidden.
  - `DISTRICT_OFFICER`: Scoped to assigned district.
  - `STATE_OFFICER`: Scoped to assigned state.
  - `NATIONAL_ADMIN`: Pan-India command visibility and administrative controls.
- Defensive Protections: Blocks IDOR tampering, double-spend approvals, past-dated inventory entries, and negative inventory balances.

### 5. Automated Verification & Testing
- 42 comprehensive automated tests verifying all adversarial attack vectors, RBAC boundaries, full mutation-propagation chains, and core platform workflows with 100% pass rate.
