# 🌱 GreenSight

> AI-powered precision agriculture — see what your field can't tell you.

GreenSight combines Raspberry Pi field cameras, computer vision, and real-time weather data to help farmers detect crop stress, disease, and soil issues early — before they spread across a field.

Farmers can't fix problems they can't see. GreenSight makes the invisible visible.

---

## 🚜 Why GreenSight?

Most farmers still make treatment decisions by walking a field and eyeballing it, or by treating the entire field "just in case." That means:

- 💧 Wasted water from unnecessary irrigation
- 🧪 Excess pesticide/fungicide use — and runoff into the surrounding environment
- ⏱️ Problems caught late, after they've already spread
- 📉 Decisions made on incomplete information

GreenSight replaces guesswork with field-level, data-driven precision.

---

## ✨ Core Features

| Feature | Description |
|---|---|
| 🎥 **Automated Field Imaging** | Raspberry Pi cameras capture periodic images of crops and soil throughout the day |
| 🧠 **AI Computer Vision** | Detects unhealthy vegetation, weeds, fungal/disease stress, and soil moisture conditions |
| 🌦️ **Weather-Aware Risk Analysis** | Fuses vision output with Open-Meteo environmental data for smarter risk scoring |
| 🗺️ **Field Health Heat Map** | Visualizes per-region health scores and risk levels across a field |
| 💬 **Actionable Recommendations** | Converts raw data into plain-language advice, not just numbers |

---

## 🧩 How It Works

    Raspberry Pi Camera
            ↓
       Field Image
            ↓
    GreenSight Backend (FastAPI)
            ↓
      AI Computer Vision  ──────┐
            ↓                   │
    Crop / Soil Analysis         ├──→ Risk Assessment ──→ AI Recommendations
            ↓                   │
    Open-Meteo Weather Data ────┘
            ↓
    Heat Map + Weekly Report
            ↓
       Farmer Dashboard

### 1. Field Camera

A Raspberry Pi camera periodically photographs crops during the day and switches to motion-based nighttime monitoring using an illuminator, uploading images to the backend and clearing local storage after a successful upload.

### 2. AI Computer Vision

Each image is analyzed for vegetation health, weeds, disease stress, and visible soil condition, producing an overall health score and individual indicators (color health, density, growth, stress).

Overall Health Score: 82/100
Status: GOOD

Health Indicators:

    Color Health     ████████░░
    Density          ███████░░░
    Growth           █████████░
    Stress           ██░░░░░░░░

### 3. Weather + Agricultural Data

Vision output alone doesn't tell the full story. GreenSight pulls temperature, humidity, precipitation, leaf wetness probability, soil moisture/temperature, evapotranspiration, and more from Open-Meteo to contextualize what the camera sees.

### 4. Risk Analysis

Combines image findings with environmental conditions to estimate risk for fungal disease, over/underwatering, weed spread, crop stress, and pest/animal damage — each with a risk level, confidence score, and supporting factors.

### 5. Recommendations

Turns risk data into plain-language, actionable guidance:

> "High humidity and elevated soil moisture are increasing fungal disease risk. Avoid unnecessary irrigation and monitor the affected regions."

---

## 🖥️ Farmer Dashboard

A centralized view of everything a farmer needs at a glance:

- Overall field health & status
- Current weather + agricultural conditions
- Detected problems and risk indicators
- Forecast system
- AI recommendations
- AI Consultant

---

## 🏗️ System Architecture

    ┌────────────────┐     ┌──────────────────┐     ┌────────────────────┐
    │ Raspberry Pi   │────▶│   Backend API    │────▶│ AI / Computer      │
    │ + Camera       │     │   (FastAPI)      │     │ Vision Pipeline    │
    └────────────────┘     └────────┬─────────┘     └────────────────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │  Open-Meteo API  │
                           │ (weather + soil) │
                           └────────┬─────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │ Risk + Reports   │
                           │   JSON API       │
                           └────────┬─────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │    Frontend      │
                           │ Farmer Dashboard │
                           └──────────────────┘

---

## 🛠️ Tech Stack

### Frontend

- React + Vite
- Tailwind CSS
- Base44

### Backend

- Python
- FastAPI

### AI / Computer Vision

- Python-based CV pipeline
- Image analysis & region/object detection
- Health scoring models

### Hardware

- Raspberry Pi + Camera Module
- Nighttime infrared illuminator

### Environmental Data

- Open-Meteo API

### Deployment

- **Backend:** Render (or similar cloud host)
- **Frontend:** connected via REST API to backend

---

## 🌍 Real-World Impact

GreenSight reframes the core farming question from:

> "Should I treat my entire field?"

to:

> "Where is the problem, how serious is it, and does the whole field actually need treatment?"

This helps reduce unnecessary pesticide and fungicide use, excess irrigation and water waste, chemical runoff, and blanket field treatments — while supporting farmers moving toward more sustainable and organic practices.

GreenSight isn't designed to replace farmers — it's designed to give them better information to make better decisions.

---

## 📌 Roadmap

- [ ] Multi-camera field support
- [ ] Historical trend analytics per region

---

## 👀 Vision

> HEALTHIER CROPS. LESS WASTE. LESS CHEMICAL USE. LESS WATER WASTE. BETTER FARMING DECISIONS. A MORE SUSTAINABLE FUTURE.
