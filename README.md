<div align="center">

# KisanSat (کسان سیٹ)

### Multi-Agent Crop Advisory System for Pakistani Farmers

[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-1C3C3C?logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![Claude Sonnet 4](https://img.shields.io/badge/Claude-Sonnet%204-CC785C?logo=anthropic&logoColor=white)](https://anthropic.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![NASA POWER](https://img.shields.io/badge/NASA-POWER%20API-E03C31?logo=nasa&logoColor=white)](https://power.larc.nasa.gov)
[![Prithvi-EO](https://img.shields.io/badge/Prithvi--EO-2.0--300M-4285F4)](https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M)

**AI Mustaqbil 2.0 Hackathon** | Theme 4: Agriculture & Food Security | Hard Tier

**Team Mustaqbil** (Ibrahim Samad)

</div>

---

## Problem Statement

8 million smallholder farmers in Pakistan make life-or-death crop decisions — what to plant, when to irrigate, how to manage pests — with **zero access to agronomists or satellite intelligence**. Post-harvest losses hit 15–20%. Drought, floods, and locust swarms destroy livelihoods with no early warning. NASA monitors every inch of Pakistan's farmland from space, but this data never reaches the people who need it most.

## Why Multi-Agent?

No single model can handle weather forecasting, soil analysis, pest detection, market intelligence, and multilingual advisory generation simultaneously. Each of these domains requires **distinct tools, APIs, and reasoning strategies**. KisanSat uses 5 specialist agents + 1 supervisor, each with non-overlapping responsibilities, orchestrated via LangGraph with parallel execution to deliver comprehensive advisory in seconds.

## Agent Architecture

![KisanSat Architecture](docs/architecture.svg)

```
Supervisor (validates input, coordinates pipeline)
    |
    +---> Weather Agent --------+
    |                           |
    +---> Soil & Crop Agent ----+---> Pest & Disease Agent ---> Advisory Agent ---> Final Report
    |                           |
    +---> Market Agent ---------+
```

Weather, Soil/Crop, and Market run **in parallel** (Wave 1). Pest/Disease depends on weather data (Wave 2). Advisory synthesizes everything last.

| Agent | Role | Tools / APIs | Key Output |
|-------|------|-------------|------------|
| **Supervisor** | Validates input, orchestrates pipeline, handles errors | LangGraph StateGraph | Agent coordination, error recovery |
| **Weather** | Retrieves + interprets weather data, drought/flood risk | NASA POWER API, OpenWeatherMap | Weather summary, drought score, 7-day forecast |
| **Soil & Crop** | Analyzes soil moisture, vegetation health, crop suitability | Agromonitoring (NDVI/EVI), Prithvi-EO-2.0 | Soil moisture, NDVI score, crop recommendations |
| **Pest & Disease** | Predicts pest/disease risk from weather + season + region | XGBoost, EfficientNet-B3, FAO Locust Watch | Risk level, pest alerts, prevention actions |
| **Market** | Fetches commodity prices, trends, sell timing | API Ninjas, Pakistan AMIS reference data | Prices (PKR), trend direction, optimal sell window |
| **Advisory** | Synthesizes all outputs into explainable recommendation | Claude Sonnet 4 (langchain-anthropic) | Bilingual advisory (EN + Urdu), reasoning chain |

## Tech Stack

### Backend
- Python 3.12, FastAPI, LangGraph 1.1.x, langchain-anthropic (Claude Sonnet 4)
- httpx (async HTTP), Pydantic v2 (strict validation), WebSocket (real-time status)
- uv (package manager)

### Frontend
- Next.js 16.2 (App Router, React 19, Server Components)
- TypeScript 5.7 (strict mode), Tailwind CSS v4
- Framer Motion, Three.js / React Three Fiber, GSAP, Lenis
- shadcn/ui, Recharts, Leaflet

### ML Models
- **Prithvi-EO-2.0-300M** — NASA/IBM geospatial foundation model for vegetation analysis
- **EfficientNet-B3** — Crop disease detection (38 PlantVillage classes)
- **LSTM** — Time-series crop yield prediction from historical weather + NDVI
- **XGBoost** — Ensemble pest risk scoring (10 Pakistan-specific pest profiles)

### Data Sources
- NASA POWER API — Temperature, precipitation, humidity, solar radiation
- Agromonitoring API — NDVI, EVI, soil moisture, satellite imagery
- OpenWeatherMap — Current weather + 5-day forecast
- API Ninjas Commodity — International crop prices
- FAO Locust Watch — Desert locust tracking
- Pakistan AMIS — Local wholesale market prices

## Project Structure

```
mustaqbil/
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI app + CORS + lifespan
│   │   ├── agents/
│   │   │   ├── weather_agent.py      # NASA POWER + OpenWeatherMap
│   │   │   ├── soil_crop_agent.py    # Agromonitoring NDVI/soil + crop DB
│   │   │   ├── pest_disease_agent.py # Pest DB + FAO Locust + XGBoost + EfficientNet
│   │   │   ├── market_agent.py       # Commodity prices + mandi data
│   │   │   ├── advisory_agent.py     # Claude Sonnet 4 synthesis (EN+UR)
│   │   │   ├── supervisor.py         # State init + final report builder
│   │   │   └── graph.py              # LangGraph StateGraph with fan-out
│   │   ├── schemas/                  # 8 Pydantic v2 schema modules
│   │   ├── api/routes.py             # REST + WebSocket endpoints
│   │   └── core/config.py            # pydantic-settings from .env
│   ├── ml/
│   │   ├── prithvi.py                # Prithvi-EO-2.0-300M inference
│   │   ├── efficientnet.py           # Crop disease classifier (38 classes)
│   │   ├── xgboost_pest.py           # Pest risk scoring
│   │   ├── lstm_yield.py             # Yield time-series forecaster
│   │   └── base.py                   # Shared ML utilities
│   ├── pyproject.toml
│   └── .env.example
├── frontend/
│   └── src/
│       └── components/               # React + Tailwind components
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/query` | Run full multi-agent pipeline, returns `FinalReport` |
| `GET` | `/api/health` | Health check with version and timestamp |
| `WS` | `/ws/agent-status` | Real-time agent execution status stream |

<details>
<summary><strong>Example Request</strong></summary>

```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "latitude": 31.5204,
      "longitude": 74.3587,
      "district": "Lahore",
      "province": "Punjab"
    },
    "crop": "wheat",
    "season": "rabi",
    "language": "en",
    "question": "What should I do about my wheat crop this week?"
  }'
```

</details>

## How to Run

### Prerequisites

- Python 3.12+ and [uv](https://docs.astral.sh/uv/)
- Node.js 20+ and [pnpm](https://pnpm.io/)

### Backend
```bash
cd backend
uv sync
cp .env.example .env  # Add your API keys
uv run uvicorn app.main:app --port 8000
```

API docs available at `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude Sonnet 4 for advisory synthesis |
| `OPENWEATHERMAP_API_KEY` | Recommended | Real-time weather + 5-day forecast |
| `AGROMONITORING_API_KEY` | Recommended | NDVI satellite imagery + soil data |
| `API_NINJAS_API_KEY` | Optional | Live commodity prices |
| `NASA_EARTHDATA_TOKEN` | Optional | Enhanced satellite data access |

> All agents degrade gracefully when API keys are missing — the system works with partial data and reports confidence scores accordingly.

## Responsible AI

- Every recommendation includes **WHY** — full reasoning chain visible to the user
- System **advises only** — never takes autonomous real-world actions
- Missing data handled gracefully with explicit warnings
- Disclaimer on every output: *"AI advisory tool. Consult local agricultural extension services for critical decisions."*
- All outputs include confidence scores (0–1) so farmers know reliability
- No discriminatory proxies in ML models
- Bilingual output (English + Urdu) for accessibility

## Impact Data (Real Sources)

| Statistic | Value | Source |
|-----------|-------|--------|
| People food insecure in Pakistan | **11 million** | WFP/IPC Pakistan, 2024 |
| People affected by 2022 floods | **33 million** | Nature Scientific Reports, 2023 |
| Cropland destroyed (2022 floods) | **1.1 million hectares** | Nature Scientific Reports, 2023 |
| Cotton production lost (2022) | **88%** | Nature Scientific Reports, 2023 |
| Cannot afford healthy diet | **82%** | WFP Pakistan |
| Children stunted | **40%** | WFP Pakistan |
| Global Hunger Index rank | **109th of 127** | GHI 2024 |

## Demo

> [Demo video link — to be added]

## References

- [NASA POWER API](https://power.larc.nasa.gov/) — Climate & weather data
- [WFP Pakistan](https://www.wfp.org/countries/pakistan) — Food security statistics
- [IPC Pakistan](https://www.ipcinfo.org/) — Food insecurity classification
- [Nature Scientific Reports](https://www.nature.com/articles/s41598-023-30347-y) — Pakistan 2022 flood crop losses
- [FAO Locust Watch](https://locust-hub-hqfao.hub.arcgis.com/) — Desert locust tracking
- [Prithvi-EO-2.0](https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M) — NASA/IBM geospatial foundation model

---

Built with NASA satellite intelligence, Claude Sonnet 4, and LangGraph multi-agent orchestration.
