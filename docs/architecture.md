# TRACKMEDS Architecture Documentation

## System Architecture Overview

TRACKMEDS is a modular, high-resilience health supply-chain platform designed for national and regional health ministries across BRICS nations. The system decouples analytical computations (demand forecasting, inventory optimization, distance matrix calculations) from AI interpretation layers (Gemini 3.6 operational briefings, natural language Q&A).

```
+-----------------------------------------------------------------------+
|                            USER INTERFACE                             |
|         React 18 + Vite + TypeScript + Tailwind CSS + Leaflet          |
|    (National Command Center Dashboard, GIS Map, Emergency Simulator)  |
+-----------------------------------+-----------------------------------+
                                    |
                            REST API (JSON)
                                    |
+-----------------------------------v-----------------------------------+
|                        FASTAPI BACKEND SERVICE                        |
|  +---------------------+  +---------------------+  +---------------+  |
|  | Forecasting Engine  |  |  Redistribution     |  | Notification  |  |
|  | (Moving Ave + Risk) |  |  Optimizer          |  |  Manager      |  |
|  +----------+----------+  +----------+----------+  +-------+-------+  |
|             |                        |                     |          |
|  +----------v------------------------v---------------------v-------+  |
|  |                SQLAlchemy ORM + Pydantic Schemas                 |  |
|  +-----------------------------------+-----------------------------+  |
+-----------------------------------|-----------------------------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
+-----------v-----------+                       +-----------v-----------+
|   SQLite / PostgreSQL |                       |   External Adapters   |
|   Database Layer      |                       |   (OpenWeather API)   |
+-----------------------+                       +-----------+-----------+
                                                            |
                                                +-----------v-----------+
                                                |     Gemini 3.6 AI     |
                                                |   Interpretation Layer|
                                                +-----------------------+
```

## Core Modules

### 1. Data Layer (`backend/app/models/`, `backend/app/database.py`)
- SQLite storage for local hackathon demo, instantly upgradeable to PostgreSQL via `DATABASE_URL`.
- Clean relational models covering Facilities, Essential Medicines, Inventory Batches, Daily Consumption Logs, Suppliers, Forecasts, Redistribution Plan Orders, and External Signals.

### 2. Analytical Engine (`backend/app/services/forecasting/`, `optimization/`)
- Deterministic numerical processing.
- Stockout prediction using moving averages, seasonal factors, and weather-adjusted consumption multipliers.
- Multi-criteria greedy optimization for stock redistribution: matching surplus PHCs with deficit PHCs based on distance, safety stock buffer, stockout urgency, and expiring batch prioritization.

### 3. Gemini AI Layer (`backend/app/services/gemini/`)
- Powered by Google Gemini 3.6 Flash / Pro.
- Generates natural language operational explanations for stockout risks, redistribution rationale, supplier procurement summaries, and interactive Copilot Q&A.
- Strict AI Safety: Zero medical treatment or dosage generation; Gemini receives verified structured JSON context from analytical calculations.
- Fallback Mode: Intelligent rule-based NLP synthesis if API keys are missing.

### 4. External Signals Adapter (`backend/app/services/weather/`)
- Connects to OpenWeather REST API when `WEATHER_API_KEY` is present.
- Falls back gracefully to realistic regional climate data (monsoon rainfall, heatwave indicators, extreme humidity) per country (India, Brazil, South Africa).

### 5. Frontend Shell (`frontend/`)
- Vite-powered Single Page Application (SPA).
- Dark Slate theme (`#0B1326`) with Glassmorphism UI elements inspired by Stitch design system.
- Recharts for time-series demand visualization and stockout risk distribution.
- React-Leaflet for interactive GIS map displaying facilities, status badges, and animated redistribution supply paths.
