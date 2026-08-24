# 🏥 TRACKMEDS — AI-Powered Health Supply Chain Resilience

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald?style=for-the-badge&logo=github)](https://github.com/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-BRICS_Hackathon_Track_3-0EA5E9?style=for-the-badge&logo=googlecloud)](https://brics-hackathon.google.com)
[![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini_3.6_Flash-8E7CC3?style=for-the-badge&logo=googlegemini)](https://ai.google.dev/)
[![React](https://img.shields.io/badge/Frontend-React_18_%7C_Vite_%7C_TS-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_%7C_Python_3.10-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> **PREDICT health-supply disruptions before they become critical shortages, PREVENT expiry waste using existing regional inventory, and OPTIMIZE procurement intelligence for national health ministries.**

Built for the **Google Cloud "Build with AI: Code for Communities — BRICS Edition" Hackathon**, **Track 3 — Smart Health & Supply Chain Resilience**.

---

## 📌 Problem & Impact Statement

Public health supply chains across **BRICS member nations (India, China, South Africa, Brazil, Russia)** face severe operational strain. Primary Health Centers (PHCs) and district hospitals frequently run out of essential, life-saving medicines (e.g., Artemether, Insulin, Amoxicillin, ORS) during unexpected climate events, monsoons, or seasonal disease outbreaks.

### The Dual Challenge in Public Health Logistics:
1. **Critical Stockouts**: Facilities run completely out of stock during demand spikes because traditional procurement systems rely on static 30-day historical averages rather than real-time climate and epidemiological signals.
2. **Preventable Expiry Waste**: Millions of dollars in essential medicines expire on warehouse shelves in neighboring districts due to a lack of cross-district visibility and automated inter-facility redistribution tools.

**TRACKMEDS** bridges this gap as a **Federated AI Health Logistics Command Center**, enabling proactive stockout prediction, expiry-aware redistribution, and explainable AI procurement guidance.

---

## 💡 Key Capabilities (3-Pillar Framework)

```
                    +-------------------------------------------------------+
                    |                   TRACKMEDS ENGINE                    |
                    +---------------------------+---------------------------+
                                                |
          +-------------------------------------+-------------------------------------+
          |                                     |                                     |
          v                                     v                                     v
+-------------------+                 +-------------------+                 +-------------------+
|    1. PREDICT     |                 |    2. PREVENT     |                 |    3. OPTIMIZE    |
| Facility Stockouts|                 |  Medicine Expiry  |                 |  AI Procurement   |
| 30 Days Ahead     |                 |  & Stock Waste    |                 |   & Copilot Q&A   |
+-------------------+                 +-------------------+                 +-------------------+
```

### 1. 🔮 PREDICT: Climate & Epidemiological Demand Forecasting
- **Multi-Factor Risk Engine**: Combines historical consumption rates, safety stock thresholds, seasonal disease curves, and real-time weather/monsoon rainfall anomalies.
- **Stockout Horizon**: Computes exact `Days Until Stockout = Current Stock / Weather-Adjusted Daily Consumption` for every facility-medicine pair with confidence scores.
- **Automated Shock Alerts**: Detects sudden supply shocks (e.g., 240mm heavy rainfall trigger in Maharashtra) and alerts regional commanders instantly.

### 2. 🛡️ PREVENT: Expiry Intelligence & Inter-Facility Redistribution
- **Cross-District Visibility**: Maps surplus inventory across Primary Health Centers (PHCs), Community Health Centers (CHCs), and Central Storage Warehouses.
- **Expiry Prioritization (FEFO)**: Prioritizes First-Expired, First-Out (FEFO) batches to prevent shelf waste.
- **Geographic Optimization**: Recommends cost-effective stock transfers within a configurable transport radius (< 350 km) before authorizing new external procurement orders.

### 3. 🧠 OPTIMIZE: Google Gemini 3.6 AI Procurement Copilot
- **Explainable AI Briefings**: Synthesizes complex multi-facility supply metrics into concise, executive-level purchase order justification briefings for health ministry officials.
- **Natural Language Copilot**: Answers operational logistics questions in real time (e.g., *"What is the stockout risk for Artemether in Maharashtra?"* or *"Where can we route surplus Insulin?"*).
- **Interactive "What-If" Scenario Simulator**: Simulates climate disasters, transport blockages, or disease outbreaks with live Before vs. After impact visualization.

---

## 🏛️ System Architecture

```mermaid
graph TD
    A[React + Vite + TypeScript Frontend\nTailwind CSS | Leaflet GIS | Recharts] <-- REST API (JSON) --> B[FastAPI Backend Engine\nPython 3.10 | Pydantic | SQLAlchemy]
    
    B --> C[Predictive Forecasting Module\nMoving Average + Climate & Outbreak Factors]
    B --> D[Redistribution Optimization Module\nFEFO Expiry Matching & Radius Distance Matrix]
    B --> E[Weather Signal Service\nMonsoon & Climate Anomaly Ingestion]
    B --> F[Google Gemini 3.6 AI Engine\nGemini 3.6 Flash / Fallback Rules]
    
    C --> G[(SQLite Database\nFacilities, Medicines, Inventory, Alerts)]
    D --> G
    E --> G
    F --> G
```

---

## ✨ Feature Breakdown

- 📊 **National Command Center Dashboard**: Real-time KPI summary bar showing Facilities Monitored, Medicines Tracked, Active Stockout Risks, Expiry Warnings, and calculated Health Supply Resilience Scores.
- 🛏️ **Facility Bed Availability System**: Facility-level tracking of total beds, occupied beds, emergency beds, ICU capacity, and occupancy rate with configurable risk thresholds (NORMAL <75%, WARNING 75–90%, CRITICAL >90%).
- 🩺 **Medical Personnel Availability System**: Aggregated operational workforce tracking for doctors, nurses, and support staff with staffing risk thresholds (HEALTHY $\ge$85%, WARNING 70–85%, CRITICAL <70%) without PII.
- 🧮 **Deterministic Resilience Engine**: Explainable 0–100 score combining Medicine Stability (35%), Bed Occupancy (25%), Staff Attendance (25%), and Climate Risk (15%).
- 🗺️ **Interactive GIS Map**: Color-coded map visualization (Green = Healthy, Amber = Warning, Red = Critical) with interactive popups displaying facility capacity, bed occupancy, medical staff attendance, and stock health.
- 📦 **Batch-Level Inventory Tracking**: Comprehensive inventory management with FEFO tracking, unit costs, supplier IDs, and safety buffer indicators.
- 🔀 **Redistribution Hub**: Recommends optimal transfer routes between surplus & deficit facilities, displaying estimated transport distance (km), transfer quantities, and financial waste avoided.
- 🎛️ **Emergency Scenario Simulator**: Slider controls for demand surge %, weather severity, outbreak risk, transport delay %, and supplier lead times to model emergency readiness.
- 🤖 **Gemini AI Copilot Drawer**: Slide-over interactive AI assistant supporting natural language query execution grounded directly in regional stock, bed occupancy, staffing, and resilience data.
- 🌐 **BRICS Multi-Nation & Multilingual**: Native filter toggle for **India 🇮🇳**, **China 🇨🇳**, **South Africa 🇿🇦**, **Brazil 🇧🇷**, **Russia 🇷🇺**, and **English / Hindi (हिन्दी)** interface support.

---

## 🤖 Google AI & Gemini 3.6 Integration Architecture

TRACKMEDS enforces a strict architectural boundary between **numerical data processing** and **generative AI analysis**:

| Layer | Responsibility | Implementation |
| :--- | :--- | :--- |
| **Deterministic Calculations** | Computes stockout dates, bed occupancy, staffing %, resilience scores, distance matrices, inventory balances, and cost savings deterministically without hallucination risk. | FastAPI, Python Math & SQLAlchemy |
| **Generative Interpretation** | Converts complex logistical metrics into natural-language briefings, anomaly reasoning, and copilot responses. | Google Gemini 3.6 Flash (`google-genai` SDK) |
| **Fail-Safe Fallback** | Ensures 100% demo uptime and offline operation when `GEMINI_API_KEY` is absent. | Built-in rule-based NLP fallback engine |

### AI Safety & Compliance Principles:
- **Zero Patient Health Information (PHI)**: Strictly operates on anonymized, aggregated facility stock levels, bed counts, and staff totals. No patient or employee records are stored or processed.
- **Non-Clinical Scope**: Restricted purely to supply chain logistics. Prohibits clinical diagnostic advice or treatment recommendations.

---

## 🗺️ Hackathon Track 3 Alignment Matrix

| Hackathon Challenge Requirement | TRACKMEDS Solution Feature |
| :--- | :--- |
| **Visibility into medicine stocks** | Real-time batch-level inventory table with FEFO expiry tracking & safety stock levels. |
| **Bed availability visibility** | Facility-level bed capacity, occupied beds, emergency beds, ICU beds & occupancy % tracking (`/api/facilities/beds/summary`). |
| **Medical personnel attendance** | Aggregated doctor, nurse, and support staff availability tracking (`/api/facilities/staff/summary`). |
| **Demand forecasting** | Climate- and outbreak-adjusted 30-day predictive engine (`/api/forecasts`). |
| **Early warning alerts for stockouts** | Real-time automated shock detection and color-coded risk notifications. |
| **Recommended cross-district redistribution** | Distance-aware greedy optimization matching deficit facilities with nearby surplus hubs. |
| **Scalable across BRICS member countries** | Multi-country data adapters for India, China, South Africa, Brazil, and Russia. |
| **Explainable AI Integration** | Google Gemini 3.6 Flash generative rationale for procurement & logistics recommendations. |

---

## 💻 Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Leaflet GIS (`react-leaflet`), Recharts.
- **Backend**: FastAPI, Python 3.10, Pydantic v2, SQLAlchemy, Uvicorn.
- **AI & ML**: Google Gemini 3.6 Flash (`google-genai` SDK), Custom Time-Series Forecasting & Distance Optimization Algorithms.
- **Database**: SQLite (Development / Demo), fully compatible with PostgreSQL / Cloud SQL for production scale.

---

## 🚀 Local Setup & Installation Guide

### Prerequisites
- **Python 3.10+**
- **Node.js v18+** & **npm**

### 1. Repository Setup
```bash
git clone https://github.com/your-username/TRACKMEDS.git
cd TRACKMEDS
cp .env.example .env
```

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Seed initial database with BRICS health data & emergency scenarios
python -m app.seed

# Launch FastAPI backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
> 📍 **API Documentation**: Access Swagger UI at `http://127.0.0.1:8000/api/docs`

### 3. Frontend Setup
```bash
# Navigate to frontend (in a new terminal window)
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
> 🌐 **Application UI**: Open your browser at `http://localhost:3000/`

### 4. 🌐 Deployment Guide (Vercel Frontend + Render Backend)

#### **Backend Deployment (Render)**
1. Deploy `backend/` on [Render.com](https://render.com/) as a **Web Service** (`Python 3`).
2. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Copy your Render API URL (e.g. `https://trackmeds-api.onrender.com`).

#### **Frontend Deployment (Vercel)**
1. Import repository to [Vercel.com](https://vercel.com/new). Select `frontend/` as Root Directory.
2. In Environment Variables, set:
   - `VITE_API_BASE_URL` = `https://trackmeds-api.onrender.com`
3. Click **Deploy**!

> 💡 *Note: The app includes a **Backend Connection Toast Notification** that displays `"Fetching Backend Server..."` and notifies judges `"Fetched Successfully!"` once Render completes its initial spin-up.*

---

## 🧪 3-Minute Hackathon Demo Walkthrough for Judges

1. **National Command Overview**:
   - Open `http://localhost:3000/`.
   - Observe the real-time **Resilience Score** and KPI ribbon across BRICS facilities.
   - Use the **Country Selector** dropdown in the header to filter between **India 🇮🇳**, **China 🇨🇳**, **South Africa 🇿🇦**, **Brazil 🇧🇷**, and **Russia 🇷🇺**.

2. **Trigger Emergency Disaster Scenario**:
   - Click the **"🔥 Load Emergency Scenario"** button in the header navigation.
   - Watch the system trigger a simulated **Monsoon Flood Demand Shock** in Maharashtra, India.
   - Observe the map markers turn **Red (Critical)** for affected facilities and a critical system alert notification pop up.

3. **Inspect Predictive Forecast & Expiry Redistribution**:
   - Scroll down to the **Redistribution Hub** section.
   - Note how the algorithm automatically identifies neighboring surplus facilities (e.g., Pune Regional Storage) with stock expiring in <60 days and calculates a transfer route to resolve the deficit.

4. **Interact with Gemini 3.6 AI Copilot**:
   - Click the **AI Copilot / Briefing** button.
   - View the generated **Executive Procurement Briefing** explaining why redistribution is prioritized over new commercial purchases.
   - Type a prompt in the Copilot chat: *"Which facilities in Maharashtra are at risk of stockout for Artemether?"* and receive an immediate grounded AI answer.

---

## 📚 Project Documentation Links

Detailed technical blueprints and specifications can be found in the [`/docs`](file:///c:/Users/Hi/Desktop/bricks%20hackathon/docs) folder:
- 🏗️ [`docs/architecture.md`](file:///c:/Users/Hi/Desktop/bricks%20hackathon/docs/architecture.md) — System architecture, module boundaries, and API contracts.
- 🤖 [`docs/ai-design.md`](file:///c:/Users/Hi/Desktop/bricks%20hackathon/docs/ai-design.md) — Google Gemini 3.6 AI integration, prompt design, and fallbacks.
- 🔒 [`docs/privacy.md`](file:///c:/Users/Hi/Desktop/bricks%20hackathon/docs/privacy.md) — Non-PHI data privacy framework and compliance safeguards.
- 🗄️ [`docs/data-model.md`](file:///c:/Users/Hi/Desktop/bricks%20hackathon/docs/data-model.md) — Entity relationships, database schemas, and data dictionary.
- 🎬 [`docs/demo-scenario.md`](file:///c:/Users/Hi/Desktop/bricks%20hackathon/docs/demo-scenario.md) — Step-by-step judge walkthrough script and evaluation guide.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p center="align">
  <b>Built with ❤️ using Google Cloud & Gemini AI for BRICS Community Resilience.</b>
</p>
