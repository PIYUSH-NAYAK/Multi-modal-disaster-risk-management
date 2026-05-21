from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import joblib
import numpy as np
import os
import asyncio
import httpx

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI(title="Disaster Risk Intelligence API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models = {}

def load_models():
    files = {
        "earthquake":       "earthquake.pkl",
        "flood_tabular":    "flood_tabular.pkl",
        "flood_tabular_enc":"flood_tabular_encoders.pkl",
        "flood_timeseries": "flood_timeseries.pkl",
        "flood_geo":        "flood_geo.pkl",
    }
    for name, filename in files.items():
        path = os.path.join(BASE_DIR, "models", filename)
        if os.path.exists(path):
            models[name] = joblib.load(path)
            print(f"✓ Loaded: {name}")
        else:
            print(f"✗ Not found: {path}")

load_models()


# ── Schemas ──────────────────────────────────────────────────

class EarthquakeInput(BaseModel):
    latitude:  float
    longitude: float
    depth:     float

class FloodInput(BaseModel):
    state:          str
    month:          int
    rainfall:       float
    water_level:    Optional[float] = None
    humidity:       float
    soil_type:      str
    land_cover:     str
    river_discharge: Optional[float] = None

class FloodQuickInput(BaseModel):
    state: str
    month: int


# ── Risk helpers ─────────────────────────────────────────────

def score_to_risk(score: float) -> dict:
    if score < 0.30:
        return {"level": "Low",      "color": "green",  "score": round(score, 3)}
    elif score < 0.50:
        return {"level": "Moderate", "color": "yellow", "score": round(score, 3)}
    elif score < 0.70:
        return {"level": "High",     "color": "orange", "score": round(score, 3)}
    else:
        return {"level": "Extreme",  "color": "red",    "score": round(score, 3)}

def earthquake_risk(magnitude: float) -> dict:
    if magnitude < 3.0:
        return {"level": "Low",      "color": "green",  "message": "Minor earthquake. No significant damage expected."}
    elif magnitude < 5.0:
        return {"level": "Moderate", "color": "yellow", "message": "Moderate earthquake. Minor damage possible."}
    elif magnitude < 7.0:
        return {"level": "High",     "color": "orange", "message": "Strong earthquake. Significant damage expected."}
    else:
        return {"level": "Extreme",  "color": "red",    "message": "Major earthquake. Severe damage. Evacuate immediately."}

FLOOD_RECOMMENDATIONS = {
    "Low":      ["Continue normal monitoring", "No immediate action required", "Check weather forecasts regularly"],
    "Moderate": ["Monitor river levels closely", "Alert local authorities", "Prepare emergency kits", "Check drainage systems"],
    "High":     ["Issue flood warnings immediately", "Activate flood control rooms", "Begin evacuation planning", "Alert district administration", "Deploy NDRF teams"],
    "Extreme":  ["Mandatory evacuation of low-lying areas", "Deploy emergency response teams immediately", "Open relief camps", "Issue red alert", "Contact NDMA immediately", "Suspend ferry/boat services"],
}

MONSOON_MONTHS = {6, 7, 8, 9}
MONTH_NAMES = ["","January","February","March","April","May","June",
               "July","August","September","October","November","December"]

# Seasonality index: how likely is flooding in this state+month (0.0–1.0)
# Based on real Indian flood calendar — replaces unreliable TS model output
# Months: [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
FLOOD_SEASONALITY = {
    "Assam":              [0.02, 0.02, 0.03, 0.05, 0.15, 0.70, 0.95, 0.92, 0.80, 0.35, 0.05, 0.02],
    "Bihar":              [0.02, 0.02, 0.02, 0.03, 0.04, 0.35, 0.80, 0.90, 0.75, 0.25, 0.05, 0.02],
    "Kerala":             [0.03, 0.02, 0.02, 0.03, 0.10, 0.72, 0.85, 0.80, 0.55, 0.30, 0.10, 0.04],
    "West Bengal":        [0.02, 0.02, 0.02, 0.03, 0.05, 0.40, 0.75, 0.85, 0.72, 0.30, 0.05, 0.02],
    "Odisha":             [0.02, 0.02, 0.02, 0.03, 0.05, 0.40, 0.65, 0.80, 0.85, 0.70, 0.15, 0.03],
    "Uttar Pradesh":      [0.02, 0.02, 0.02, 0.02, 0.03, 0.20, 0.55, 0.75, 0.65, 0.15, 0.04, 0.02],
    "Uttarakhand":        [0.03, 0.03, 0.03, 0.04, 0.06, 0.40, 0.78, 0.82, 0.50, 0.12, 0.04, 0.03],
    "Tamil Nadu":         [0.08, 0.05, 0.03, 0.03, 0.04, 0.10, 0.15, 0.20, 0.35, 0.65, 0.82, 0.72],
    "Andhra Pradesh":     [0.04, 0.03, 0.03, 0.03, 0.04, 0.20, 0.45, 0.55, 0.55, 0.72, 0.65, 0.10],
    "Telangana":          [0.03, 0.02, 0.02, 0.03, 0.04, 0.20, 0.50, 0.60, 0.55, 0.40, 0.15, 0.04],
    "Maharashtra":        [0.02, 0.02, 0.02, 0.03, 0.04, 0.40, 0.72, 0.70, 0.50, 0.20, 0.05, 0.02],
    "Gujarat":            [0.02, 0.02, 0.02, 0.02, 0.03, 0.25, 0.55, 0.62, 0.38, 0.10, 0.03, 0.02],
    "Rajasthan":          [0.01, 0.01, 0.01, 0.01, 0.02, 0.08, 0.22, 0.28, 0.15, 0.05, 0.02, 0.01],
    "Punjab":             [0.02, 0.02, 0.02, 0.02, 0.03, 0.10, 0.40, 0.48, 0.30, 0.08, 0.03, 0.02],
    "Himachal Pradesh":   [0.04, 0.04, 0.05, 0.06, 0.08, 0.35, 0.72, 0.78, 0.45, 0.10, 0.04, 0.03],
    "Jammu and Kashmir":  [0.05, 0.06, 0.08, 0.10, 0.10, 0.25, 0.45, 0.50, 0.35, 0.10, 0.06, 0.05],
    "Delhi":              [0.01, 0.01, 0.01, 0.01, 0.02, 0.10, 0.42, 0.50, 0.30, 0.07, 0.02, 0.01],
    "Manipur":            [0.03, 0.03, 0.04, 0.08, 0.15, 0.55, 0.72, 0.68, 0.55, 0.20, 0.06, 0.03],
    "Tripura":            [0.03, 0.03, 0.04, 0.08, 0.15, 0.55, 0.70, 0.65, 0.52, 0.18, 0.05, 0.03],
    "Meghalaya":          [0.04, 0.04, 0.06, 0.10, 0.20, 0.65, 0.85, 0.80, 0.65, 0.25, 0.06, 0.04],
    "Madhya Pradesh":     [0.02, 0.02, 0.02, 0.02, 0.03, 0.20, 0.50, 0.58, 0.42, 0.12, 0.03, 0.02],
    "Chhattisgarh":       [0.02, 0.02, 0.02, 0.03, 0.04, 0.25, 0.55, 0.62, 0.48, 0.15, 0.04, 0.02],
    "Jharkhand":          [0.02, 0.02, 0.02, 0.03, 0.04, 0.28, 0.58, 0.65, 0.52, 0.18, 0.04, 0.02],
    "Karnataka":          [0.02, 0.02, 0.02, 0.03, 0.05, 0.35, 0.55, 0.58, 0.45, 0.30, 0.10, 0.03],
}
# Default for states not in the table
DEFAULT_SEASONALITY = [0.02, 0.02, 0.02, 0.03, 0.04, 0.30, 0.50, 0.55, 0.40, 0.15, 0.05, 0.02]

def get_seasonality(state: str, month: int) -> float:
    table = FLOOD_SEASONALITY.get(state, DEFAULT_SEASONALITY)
    return table[month - 1]

# Minimum geographic flood proneness per state — overrides geo model when it's too low
STATE_BASE_RISK = {
    "Assam": 0.95, "Bihar": 0.90, "West Bengal": 0.85, "Odisha": 0.85,
    "Kerala": 0.88, "Uttar Pradesh": 0.85, "Uttarakhand": 0.82,
    "Tamil Nadu": 0.88, "Andhra Pradesh": 0.82, "Telangana": 0.72,
    "Maharashtra": 0.78, "Gujarat": 0.72, "Himachal Pradesh": 0.75,
    "Manipur": 0.78, "Tripura": 0.75, "Meghalaya": 0.85, "Jharkhand": 0.70,
    "Chhattisgarh": 0.68, "Karnataka": 0.70, "Madhya Pradesh": 0.65,
    "Punjab": 0.60, "Jammu and Kashmir": 0.65,
    "Delhi": 0.65, "Rajasthan": 0.35, "Haryana": 0.55,
}

def get_geo_base(state: str, geo_prob: float) -> float:
    """Use state base risk as floor when geo model underestimates."""
    base = STATE_BASE_RISK.get(state, 0.60)
    return max(geo_prob, base)


# ── Flood prediction helpers ──────────────────────────────────

def get_timeseries_features(state: str, month: int, rainfall: float):
    ts_data = models["flood_timeseries"]
    stats   = ts_data["state_stats"]

    # Get historical stats for this state+month
    row = stats[(stats["state_name"] == state) & (stats["month"] == month)]

    if len(row) == 0:
        normal    = rainfall * 0.8
        deviation = 25.0
    else:
        normal    = float(row["avg_normal"].iloc[0])
        if rainfall > 0 and normal > 0:
            raw_dev = ((rainfall - normal) / normal) * 100
            # Cap deviation at ±200% — beyond that the model extrapolates wildly
            deviation = float(np.clip(raw_dev, -100, 200))
        else:
            deviation = float(row["avg_deviation"].iloc[0])

    is_monsoon   = 1 if month in MONSOON_MONTHS else 0
    is_flood_prone = 1 if state in ts_data["flood_prone_states"] else 0
    above_normal = 1 if deviation > 0 else 0

    return {
        "features": [rainfall, normal, deviation, rainfall, rainfall, month,
                     is_monsoon, is_flood_prone, above_normal],
        "normal":    round(normal, 2),
        "deviation": round(deviation, 2),
        "is_monsoon": is_monsoon,
    }

def get_geo_features(state: str):
    geo_data    = models["flood_geo"]
    state_geo   = geo_data["state_geo"]
    state_danger = geo_data["state_danger"]
    flood_freq  = geo_data["flood_freq"]

    # Find best matching subdivision
    state_lower = state.lower()
    matched = None
    for subdiv in state_geo["SUBDIVISION"].tolist():
        if any(w in subdiv.lower() for w in state_lower.split()):
            matched = subdiv
            break

    if matched:
        row = state_geo[state_geo["SUBDIVISION"] == matched].iloc[0]
        lat, lon     = float(row["lat"]), float(row["lon"])
        annual_avg   = float(row["annual_avg"])
        monsoon_avg  = float(row["monsoon_avg"])
        freq         = float(row["flood_freq"])
    else:
        lat, lon     = 20.5, 78.9
        annual_avg   = 1200.0
        monsoon_avg  = 800.0
        freq         = flood_freq.get(state, 0.40)

    monsoon_zscore = (monsoon_avg - 650) / 200

    # River danger levels
    danger_row = state_danger[state_danger["State"].str.lower() == state.lower()]
    if len(danger_row) > 0:
        warning_level = float(danger_row["avg_warning"].iloc[0])
        danger_level  = float(danger_row["avg_danger"].iloc[0])
        station_count = int(danger_row["station_count"].iloc[0])
    else:
        warning_level = 6.0
        danger_level  = 7.5
        station_count = 0

    jun = jul = aug = sep = monsoon_avg / 4

    features = [lat, lon, annual_avg, monsoon_avg, annual_avg * 0.3,
                jun, jul, aug, sep, freq, monsoon_zscore]

    return {
        "features":      features,
        "warning_level": round(warning_level, 2),
        "danger_level":  round(danger_level, 2),
        "station_count": station_count,
        "flood_freq":    round(freq, 2),
        "monsoon_avg":   round(monsoon_avg, 2),
    }

def get_key_factors(data: FloodInput, ts: dict, geo: dict, water_level: float) -> list:
    factors = []
    if ts["deviation"] > 50:
        factors.append({"level": "red",    "text": f"Rainfall {ts['deviation']:.0f}% above normal for {MONTH_NAMES[data.month]}"})
    elif ts["deviation"] > 20:
        factors.append({"level": "orange", "text": f"Rainfall {ts['deviation']:.0f}% above normal"})
    elif ts["deviation"] < -20:
        factors.append({"level": "green",  "text": f"Rainfall {abs(ts['deviation']):.0f}% below normal — low risk"})

    if water_level >= geo["danger_level"]:
        factors.append({"level": "red",    "text": f"Water level {water_level}m — ABOVE danger threshold ({geo['danger_level']}m)"})
    elif water_level >= geo["warning_level"]:
        factors.append({"level": "orange", "text": f"Water level {water_level}m — above warning level ({geo['warning_level']}m)"})

    if ts["is_monsoon"]:
        factors.append({"level": "orange", "text": f"Peak monsoon month ({MONTH_NAMES[data.month]}) — historically high risk"})

    if data.soil_type == "Clay":
        factors.append({"level": "orange", "text": "Clay soil — poor water absorption, high runoff"})
    elif data.soil_type == "Sandy":
        factors.append({"level": "green",  "text": "Sandy soil — good drainage, lower flood risk"})

    if data.land_cover == "Urban":
        factors.append({"level": "orange", "text": "Urban land — impervious surfaces increase flood risk"})
    elif data.land_cover == "Forest":
        factors.append({"level": "green",  "text": "Forest land — natural absorption reduces flood risk"})

    if geo["flood_freq"] >= 0.70:
        factors.append({"level": "red",    "text": f"{data.state} is historically highly flood-prone ({int(geo['flood_freq']*100)}% historical flood rate)"})
    elif geo["flood_freq"] >= 0.50:
        factors.append({"level": "orange", "text": f"{data.state} has moderate historical flood frequency"})

    return factors


# ── Monthly rainfall stats for chart ─────────────────────────

def get_monthly_chart(state: str):
    ts_data = models["flood_timeseries"]
    stats   = ts_data["state_stats"]
    state_stats = stats[stats["state_name"] == state]

    chart = []
    for m in range(1, 13):
        row = state_stats[state_stats["month"] == m]
        if len(row) > 0:
            chart.append({
                "month": MONTH_NAMES[m],
                "actual": round(float(row["avg_actual"].iloc[0]), 1),
                "normal": round(float(row["avg_normal"].iloc[0]), 1),
            })
        else:
            chart.append({"month": MONTH_NAMES[m], "actual": 0, "normal": 0})
    return chart


# ── Endpoints ─────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {"status": "running", "models_loaded": list(models.keys()), "version": "2.0.0"}


@app.post("/predict/earthquake")
def predict_earthquake(data: EarthquakeInput):
    if "earthquake" not in models:
        raise HTTPException(status_code=503, detail="Earthquake model not loaded")
    if not (8 <= data.latitude <= 37):
        raise HTTPException(status_code=400, detail="Latitude must be within India bounds (8–37)")
    if not (68 <= data.longitude <= 97):
        raise HTTPException(status_code=400, detail="Longitude must be within India bounds (68–97)")
    if data.depth < 0:
        raise HTTPException(status_code=400, detail="Depth cannot be negative")

    features  = np.array([[data.latitude, data.longitude, data.depth]])
    magnitude = round(float(models["earthquake"].predict(features)[0]), 2)
    risk      = earthquake_risk(magnitude)

    return {
        "disaster_type":      "earthquake",
        "inputs":             {"latitude": data.latitude, "longitude": data.longitude, "depth": data.depth},
        "predicted_magnitude": magnitude,
        "risk_level":         risk["level"],
        "risk_color":         risk["color"],
        "message":            risk["message"],
    }


@app.post("/predict/flood")
def predict_flood(data: FloodInput):
    required = ["flood_tabular", "flood_tabular_enc", "flood_timeseries", "flood_geo"]
    for m in required:
        if m not in models:
            raise HTTPException(status_code=503, detail=f"Model {m} not loaded")
    if not (1 <= data.month <= 12):
        raise HTTPException(status_code=400, detail="Month must be 1–12")
    if data.rainfall < 0:
        raise HTTPException(status_code=400, detail="Rainfall cannot be negative")

    enc = models["flood_tabular_enc"]

    # Encode soil/land
    try:
        soil_enc = enc["soil_type"].transform([data.soil_type])[0]
    except ValueError:
        soil_enc = 0
    try:
        land_enc = enc["land_cover"].transform([data.land_cover])[0]
    except ValueError:
        land_enc = 0

    # Default values for missing inputs
    river_discharge = data.river_discharge or (data.rainfall * 15)
    # State-based typical water level averages (m) — used when user doesn't provide it
    STATE_WATER_LEVELS = {
        "Assam": 8.0, "Bihar": 7.5, "Kerala": 6.5, "Odisha": 6.0,
        "West Bengal": 6.5, "Uttar Pradesh": 5.5, "Andhra Pradesh": 5.0,
        "Telangana": 4.5, "Maharashtra": 5.0, "Gujarat": 4.5,
    }
    water_level = data.water_level if data.water_level is not None else STATE_WATER_LEVELS.get(data.state, 5.0)
    elevation   = 80.0
    temperature     = 28.0
    population_density = 500.0
    infrastructure  = 1
    historical_floods = 1 if data.state in ["Assam", "Bihar", "Kerala", "Odisha", "West Bengal"] else 0

    # Modal 1 — Tabular
    tab_features = np.array([[
        data.rainfall, temperature, data.humidity,
        river_discharge, water_level, elevation,
        land_enc, soil_enc,
        population_density, infrastructure, historical_floods
    ]])
    tab_prob = float(models["flood_tabular"].predict_proba(tab_features)[0][1])

    # Modal 2 — Time-Series (always uses historical avg rainfall for consistency with Quick Check)
    ts_data   = models["flood_timeseries"]
    ts_stats  = ts_data["state_stats"]
    ts_row    = ts_stats[(ts_stats["state_name"] == data.state) & (ts_stats["month"] == data.month)]
    ts_rain   = float(ts_row["avg_actual"].iloc[0]) if len(ts_row) > 0 else data.rainfall
    ts = get_timeseries_features(data.state, data.month, ts_rain)
    ts_features = np.array([ts["features"]])
    ts_prob = float(models["flood_timeseries"]["model"].predict_proba(ts_features)[0][1])

    # Modal 3 — Geospatial
    geo = get_geo_features(data.state)
    geo_features = np.array([geo["features"]])
    geo_prob = float(models["flood_geo"]["model"].predict_proba(geo_features)[0][1])

    # Seasonality — replaces broken TS model; geo base captures geographic risk
    seasonality = get_seasonality(data.state, data.month)
    geo_seasonal = get_geo_base(data.state, geo_prob) * seasonality

    # Tabular fine-tunes based on user inputs (rainfall, humidity etc.)
    # Treated as a ±adjustment, not a dominant signal (50.75% accuracy)
    tab_adjustment = (tab_prob - 0.5) * 0.20
    final_score = round(float(np.clip(geo_seasonal + tab_adjustment, 0.0, 1.0)), 3)
    overall     = score_to_risk(final_score)

    # Key factors
    key_factors = get_key_factors(data, ts, geo, water_level)

    # Monthly chart data
    monthly_chart = get_monthly_chart(data.state)

    # Recommendations
    recommendations = FLOOD_RECOMMENDATIONS.get(overall["level"], [])

    return {
        "disaster_type": "flood",
        "state":         data.state,
        "month":         MONTH_NAMES[data.month],

        "overall_risk":  overall["level"],
        "overall_score": overall["score"],
        "overall_color": overall["color"],
        "overall_pct":   round(final_score * 100, 1),

        "modal_predictions": {
            "tabular": {
                "name":        "Hydro-Meteorological",
                "probability": round(tab_prob, 3),
                "pct":         round(tab_prob * 100, 1),
                "risk":        score_to_risk(tab_prob)["level"],
                "color":       score_to_risk(tab_prob)["color"],
                "description": "Based on rainfall, humidity, water level, soil & land type"
            },
            "timeseries": {
                "name":        "Time-Series Rainfall",
                "probability": round(ts_prob, 3),
                "pct":         round(ts_prob * 100, 1),
                "risk":        score_to_risk(ts_prob)["level"],
                "color":       score_to_risk(ts_prob)["color"],
                "description": "Based on daily rainfall patterns & deviation from normal"
            },
            "geospatial": {
                "name":        "Geospatial",
                "probability": round(geo_prob, 3),
                "pct":         round(geo_prob * 100, 1),
                "risk":        score_to_risk(geo_prob)["level"],
                "color":       score_to_risk(geo_prob)["color"],
                "description": "Based on geographic location, river basins & historical patterns"
            }
        },

        "fusion_weights": {"tabular": "±adjustment", "geospatial": "base", "seasonality": "multiplier"},

        "rainfall_stats": {
            "actual":      data.rainfall,
            "normal":      ts["normal"],
            "deviation":   ts["deviation"],
            "is_monsoon":  bool(ts["is_monsoon"]),
            "month_name":  MONTH_NAMES[data.month],
        },

        "river_stats": {
            "water_level":    water_level,
            "water_level_estimated": data.water_level is None,
            "warning_level":  geo["warning_level"],
            "danger_level":   geo["danger_level"],
            "station_count":  geo["station_count"],
            "above_warning":  water_level >= geo["warning_level"],
            "above_danger":   water_level >= geo["danger_level"],
        },

        "geo_stats": {
            "flood_frequency_pct": round(geo["flood_freq"] * 100, 1),
            "historical_monsoon_avg": geo["monsoon_avg"],
        },

        "key_factors":    key_factors,
        "monthly_chart":  monthly_chart,
        "recommendations": recommendations,
        "message": f"{'⚠️ High flood risk' if overall['level'] in ['High','Extreme'] else '✓ Manageable flood risk'} detected for {data.state} in {MONTH_NAMES[data.month]}."
    }


@app.post("/predict/flood/quick")
def predict_flood_quick(data: FloodQuickInput):
    """Simple flood risk — user only provides state + month. All values auto-filled from historical averages."""
    required = ["flood_timeseries", "flood_geo"]
    for m in required:
        if m not in models:
            raise HTTPException(status_code=503, detail=f"Model {m} not loaded")
    if not (1 <= data.month <= 12):
        raise HTTPException(status_code=400, detail="Month must be 1–12")

    # Pull historical average rainfall for this state+month from timeseries stats
    ts_data = models["flood_timeseries"]
    stats   = ts_data["state_stats"]
    row     = stats[(stats["state_name"] == data.state) & (stats["month"] == data.month)]

    if len(row) > 0:
        avg_rainfall = float(row["avg_actual"].iloc[0])
        avg_normal   = float(row["avg_normal"].iloc[0])
    else:
        avg_rainfall = 100.0
        avg_normal   = 100.0

    # Use historical average as the rainfall input
    ts   = get_timeseries_features(data.state, data.month, avg_rainfall)
    geo  = get_geo_features(data.state)
    geo_features = np.array([geo["features"]])
    geo_prob = float(models["flood_geo"]["model"].predict_proba(geo_features)[0][1])

    # Fusion: geo base (floored by state risk) × seasonality
    seasonality = get_seasonality(data.state, data.month)
    final_score = round(float(np.clip(get_geo_base(data.state, geo_prob) * seasonality, 0.0, 1.0)), 3)
    overall     = score_to_risk(final_score)

    monthly_chart = get_monthly_chart(data.state)
    recommendations = FLOOD_RECOMMENDATIONS.get(overall["level"], [])

    plain_messages = {
        "Low":      f"Historically, {data.state} sees low flood activity in {MONTH_NAMES[data.month]}. Conditions are generally safe.",
        "Moderate": f"{data.state} has a moderate chance of flooding in {MONTH_NAMES[data.month]}. Stay updated with local weather alerts.",
        "High":     f"High flood risk in {data.state} during {MONTH_NAMES[data.month]}. Avoid low-lying areas and be prepared.",
        "Extreme":  f"Extreme flood risk in {data.state} in {MONTH_NAMES[data.month]}. This is historically one of the most dangerous periods — take precautions immediately.",
    }

    return {
        "state":         data.state,
        "month":         MONTH_NAMES[data.month],
        "overall_risk":  overall["level"],
        "overall_color": overall["color"],
        "overall_pct":   round(final_score * 100, 1),
        "is_monsoon":    bool(ts["is_monsoon"]),
        "avg_rainfall":  round(avg_rainfall, 1),
        "normal_rainfall": round(avg_normal, 1),
        "flood_frequency_pct": round(geo["flood_freq"] * 100, 1),
        "monthly_chart": monthly_chart,
        "recommendations": recommendations,
        "message": plain_messages.get(overall["level"], ""),
    }


def _weather_code_to_condition(code: int) -> str:
    if code in range(51, 68) or code in range(80, 83):
        return "Rain"
    elif code in range(95, 100):
        return "Thunderstorm"
    elif code == 0:
        return "Clear"
    elif code in range(1, 4):
        return "Partly Cloudy"
    return "Cloudy"


@app.get("/weather")
async def get_live_weather(lat: float, lon: float):
    """Live current weather + river discharge for a location."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            weather_r, flood_r = await asyncio.gather(
                client.get("https://api.open-meteo.com/v1/forecast", params={
                    "latitude": lat, "longitude": lon,
                    "current": "precipitation,relative_humidity_2m,temperature_2m,rain,weather_code",
                    "daily": "precipitation_sum",
                    "past_days": 1, "forecast_days": 1,
                    "timezone": "Asia/Kolkata",
                }),
                client.get("https://flood-api.open-meteo.com/v1/flood", params={
                    "latitude": lat, "longitude": lon,
                    "daily": "river_discharge",
                    "past_days": 1, "forecast_days": 1,
                }),
            )
            weather_r.raise_for_status()
            weather_data = weather_r.json()
            flood_data   = flood_r.json() if flood_r.status_code == 200 else {}
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Weather API error: {type(e).__name__}: {e}")

    current    = weather_data.get("current", {})
    daily_rain = weather_data.get("daily", {}).get("precipitation_sum", [0, 0])
    today_rainfall = round(sum(v for v in daily_rain if v is not None), 1)

    discharge_list = flood_data.get("daily", {}).get("river_discharge", [])
    river_discharge = round(float(discharge_list[-1]), 1) if discharge_list else None

    code = current.get("weather_code", 0)
    return {
        "rainfall_mm":      today_rainfall,
        "humidity":         round(current.get("relative_humidity_2m", 0)),
        "temperature":      round(current.get("temperature_2m", 0), 1),
        "current_rain":     round(current.get("rain", 0), 1),
        "river_discharge":  river_discharge,
        "condition":        _weather_code_to_condition(code),
        "weather_code":     code,
        "live":             True,
        "source":           "current",
    }


@app.get("/climate")
async def get_climate_normals(lat: float, lon: float, month: int):
    """Historical monthly averages (1984–2023) for a location + Flood API 7-month forecast."""
    if not 1 <= month <= 12:
        raise HTTPException(status_code=400, detail="month must be 1–12")

    # Build 10-year date range for that month across 2014-2023
    start = f"2014-{month:02d}-01"
    import calendar
    last_day = calendar.monthrange(2023, month)[1]
    end = f"2023-{month:02d}-{last_day}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            hist_r, flood_r = await asyncio.gather(
                client.get("https://archive-api.open-meteo.com/v1/archive", params={
                    "latitude": lat, "longitude": lon,
                    "start_date": start, "end_date": end,
                    "daily": "precipitation_sum,relative_humidity_2m_mean,temperature_2m_mean",
                    "timezone": "Asia/Kolkata",
                }),
                client.get("https://flood-api.open-meteo.com/v1/flood", params={
                    "latitude": lat, "longitude": lon,
                    "daily": "river_discharge",
                    "forecast_days": 92,
                }),
            )
            hist_r.raise_for_status()
            hist_data  = hist_r.json()
            flood_data = flood_r.json() if flood_r.status_code == 200 else {}
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Climate API error: {type(e).__name__}: {e}")

    daily = hist_data.get("daily", {})

    def safe_avg(lst):
        vals = [v for v in (lst or []) if v is not None]
        return round(sum(vals) / len(vals), 1) if vals else 0

    avg_rainfall  = safe_avg(daily.get("precipitation_sum", []))
    avg_humidity  = round(safe_avg(daily.get("relative_humidity_2m_mean", [])))
    avg_temp      = safe_avg(daily.get("temperature_2m_mean", []))

    # Pick river discharge closest to target month from forecast
    discharge_list = flood_data.get("daily", {}).get("river_discharge", [])
    flood_dates    = flood_data.get("daily", {}).get("time", [])
    month_str      = f"-{month:02d}-"
    month_discharge = [
        v for t, v in zip(flood_dates, discharge_list)
        if month_str in t and v is not None
    ]
    avg_discharge = round(sum(month_discharge) / len(month_discharge), 1) if month_discharge else None

    return {
        "rainfall_mm":     avg_rainfall,
        "humidity":        avg_humidity,
        "temperature":     avg_temp,
        "river_discharge": avg_discharge,
        "live":            False,
        "source":          "historical",
        "years":           "2014–2023",
    }


ALERT_CITIES = [
    {"name": "Patna",            "state": "Bihar",             "lat": 25.5941, "lon": 85.1376},
    {"name": "Guwahati",         "state": "Assam",             "lat": 26.1445, "lon": 91.7362},
    {"name": "Mumbai",           "state": "Maharashtra",       "lat": 19.0760, "lon": 72.8777},
    {"name": "Kolkata",          "state": "West Bengal",       "lat": 22.5726, "lon": 88.3639},
    {"name": "Chennai",          "state": "Tamil Nadu",        "lat": 13.0827, "lon": 80.2707},
    {"name": "Bhubaneswar",      "state": "Odisha",            "lat": 20.2961, "lon": 85.8245},
    {"name": "Hyderabad",        "state": "Telangana",         "lat": 17.3850, "lon": 78.4867},
    {"name": "Lucknow",          "state": "Uttar Pradesh",     "lat": 26.8467, "lon": 80.9462},
    {"name": "Delhi",            "state": "Delhi",             "lat": 28.6139, "lon": 77.2090},
    {"name": "Kochi",            "state": "Kerala",            "lat":  9.9312, "lon": 76.2673},
    {"name": "Ahmedabad",        "state": "Gujarat",           "lat": 23.0225, "lon": 72.5714},
    {"name": "Pune",             "state": "Maharashtra",       "lat": 18.5204, "lon": 73.8567},
    {"name": "Jaipur",           "state": "Rajasthan",         "lat": 26.9124, "lon": 75.7873},
    {"name": "Bhopal",           "state": "Madhya Pradesh",    "lat": 23.2599, "lon": 77.4126},
    {"name": "Nagpur",           "state": "Maharashtra",       "lat": 21.1458, "lon": 79.0882},
    {"name": "Varanasi",         "state": "Uttar Pradesh",     "lat": 25.3176, "lon": 82.9739},
    {"name": "Visakhapatnam",    "state": "Andhra Pradesh",    "lat": 17.6868, "lon": 83.2185},
    {"name": "Thiruvananthapuram","state": "Kerala",           "lat":  8.5241, "lon": 76.9366},
    {"name": "Chandigarh",       "state": "Chandigarh",        "lat": 30.7333, "lon": 76.7794},
    {"name": "Srinagar",         "state": "Jammu & Kashmir",   "lat": 34.0837, "lon": 74.7973},
]

import time as _time

_alerts_cache: dict = {"data": None, "ts": 0.0}
_ALERTS_TTL = 300  # 5 minutes

@app.get("/alerts")
async def get_city_alerts():
    """Live weather + river discharge for 10 major Indian flood-prone cities. Cached 5 min."""
    now = _time.monotonic()
    if _alerts_cache["data"] and now - _alerts_cache["ts"] < _ALERTS_TTL:
        return _alerts_cache["data"]

    async def fetch_city(city):
        try:
            async with httpx.AsyncClient(timeout=6.0) as c:
                weather_r, flood_r = await asyncio.gather(
                    c.get("https://api.open-meteo.com/v1/forecast", params={
                        "latitude": city["lat"], "longitude": city["lon"],
                        "current": "precipitation,relative_humidity_2m,temperature_2m,weather_code",
                        "daily": "precipitation_sum",
                        "past_days": 1, "forecast_days": 1,
                        "timezone": "Asia/Kolkata",
                    }),
                    c.get("https://flood-api.open-meteo.com/v1/flood", params={
                        "latitude": city["lat"], "longitude": city["lon"],
                        "daily": "river_discharge",
                        "past_days": 1, "forecast_days": 1,
                    }),
                )
                weather_data = weather_r.json() if weather_r.status_code == 200 else {}
                flood_data   = flood_r.json()   if flood_r.status_code == 200   else {}
        except Exception:
            weather_data, flood_data = {}, {}

        current    = weather_data.get("current", {})
        daily      = weather_data.get("daily", {})
        rain_today = daily.get("precipitation_sum") or [0, 0]
        rainfall   = round(sum(v for v in rain_today if v is not None), 1)

        discharge_list  = [v for v in flood_data.get("daily", {}).get("river_discharge", []) if v is not None]
        river_discharge = round(float(discharge_list[-1]), 1) if discharge_list else None

        code     = current.get("weather_code", 0)
        humidity = current.get("relative_humidity_2m", 0) or 0

        if rainfall > 100 or (river_discharge and river_discharge > 5000):
            threat = "Extreme"
        elif rainfall > 50 or humidity > 85:
            threat = "High"
        elif rainfall > 15 or humidity > 70:
            threat = "Moderate"
        else:
            threat = "Low"

        return {
            **city,
            "rainfall_mm":     rainfall,
            "current_rain":    round(current.get("precipitation", 0) or 0, 1),
            "humidity":        round(humidity),
            "temperature":     round(current.get("temperature_2m", 0) or 0, 1),
            "river_discharge": river_discharge,
            "condition":       _weather_code_to_condition(code),
            "threat":          threat,
        }

    # Fetch all 10 cities fully in parallel — no batching, no sleep
    results = await asyncio.gather(*[fetch_city(c) for c in ALERT_CITIES])
    payload = {"cities": list(results), "cached_at": int(_time.time())}
    _alerts_cache["data"] = payload
    _alerts_cache["ts"]   = now
    return payload


@app.get("/geocode")
async def geocode_city(name: str, limit: int = 10):
    """Search Indian cities via Open-Meteo geocoding API."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as c:
            r = await c.get("https://geocoding-api.open-meteo.com/v1/search", params={
                "name": name, "count": 20, "language": "en", "format": "json",
            })
        results = r.json().get("results", []) if r.status_code == 200 else []
    except Exception:
        results = []

    india = [r for r in results if r.get("country_code") == "IN"]
    return {"cities": [
        {
            "name":  r["name"],
            "state": r.get("admin1", ""),
            "lat":   r["latitude"],
            "lon":   r["longitude"],
        }
        for r in india[:limit]
    ]}


@app.get("/weather/city")
async def get_city_weather(lat: float, lon: float, name: str, state: str = ""):
    """Fetch live weather for any lat/lon (used by Monitor page custom city search)."""
    try:
        async with httpx.AsyncClient(timeout=6.0) as c:
            weather_r, flood_r = await asyncio.gather(
                c.get("https://api.open-meteo.com/v1/forecast", params={
                    "latitude": lat, "longitude": lon,
                    "current": "precipitation,relative_humidity_2m,temperature_2m,weather_code",
                    "daily": "precipitation_sum",
                    "past_days": 1, "forecast_days": 1,
                    "timezone": "Asia/Kolkata",
                }),
                c.get("https://flood-api.open-meteo.com/v1/flood", params={
                    "latitude": lat, "longitude": lon,
                    "daily": "river_discharge",
                    "past_days": 1, "forecast_days": 1,
                }),
            )
            weather_data = weather_r.json() if weather_r.status_code == 200 else {}
            flood_data   = flood_r.json()   if flood_r.status_code == 200   else {}
    except Exception:
        weather_data, flood_data = {}, {}

    current    = weather_data.get("current", {})
    daily      = weather_data.get("daily", {})
    rain_today = daily.get("precipitation_sum") or [0, 0]
    rainfall   = round(sum(v for v in rain_today if v is not None), 1)

    discharge_list  = [v for v in flood_data.get("daily", {}).get("river_discharge", []) if v is not None]
    river_discharge = round(float(discharge_list[-1]), 1) if discharge_list else None

    code     = current.get("weather_code", 0)
    humidity = current.get("relative_humidity_2m", 0) or 0

    if rainfall > 100 or (river_discharge and river_discharge > 5000):
        threat = "Extreme"
    elif rainfall > 50 or humidity > 85:
        threat = "High"
    elif rainfall > 15 or humidity > 70:
        threat = "Moderate"
    else:
        threat = "Low"

    return {
        "name": name, "state": state, "lat": lat, "lon": lon,
        "rainfall_mm":     rainfall,
        "humidity":        round(humidity),
        "temperature":     round(current.get("temperature_2m", 0) or 0, 1),
        "river_discharge": river_discharge,
        "condition":       _weather_code_to_condition(code),
        "threat":          threat,
    }


@app.get("/model-info")
def model_info():
    return {
        "earthquake": {"features": ["latitude", "longitude", "depth"], "type": "regression", "r2": 0.356},
        "flood": {
            "modals": 3,
            "modal_1": {"name": "Tabular", "features": 11, "model": "RandomForest"},
            "modal_2": {"name": "Time-Series", "features": 9,  "model": "RandomForest"},
            "modal_3": {"name": "Geospatial", "features": 11, "model": "RandomForest"},
            "fusion":  "weighted average (0.4 + 0.4 + 0.2)"
        }
    }
