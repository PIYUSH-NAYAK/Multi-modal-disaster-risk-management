from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import joblib
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI(title="Disaster Risk Intelligence API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
    water_level:    float
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
        deviation = float(row["avg_deviation"].iloc[0])
        if rainfall > 0 and normal > 0:
            deviation = ((rainfall - normal) / normal) * 100

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

def get_key_factors(data: FloodInput, ts: dict, geo: dict) -> list:
    factors = []
    if ts["deviation"] > 50:
        factors.append({"level": "red",    "text": f"Rainfall {ts['deviation']:.0f}% above normal for {MONTH_NAMES[data.month]}"})
    elif ts["deviation"] > 20:
        factors.append({"level": "orange", "text": f"Rainfall {ts['deviation']:.0f}% above normal"})
    elif ts["deviation"] < -20:
        factors.append({"level": "green",  "text": f"Rainfall {abs(ts['deviation']):.0f}% below normal — low risk"})

    if data.water_level >= geo["danger_level"]:
        factors.append({"level": "red",    "text": f"Water level {data.water_level}m — ABOVE danger threshold ({geo['danger_level']}m)"})
    elif data.water_level >= geo["warning_level"]:
        factors.append({"level": "orange", "text": f"Water level {data.water_level}m — above warning level ({geo['warning_level']}m)"})

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
    elevation       = 80.0
    temperature     = 28.0
    population_density = 500.0
    infrastructure  = 1
    historical_floods = 1 if data.state in ["Assam", "Bihar", "Kerala", "Odisha", "West Bengal"] else 0

    # Modal 1 — Tabular
    tab_features = np.array([[
        data.rainfall, temperature, data.humidity,
        river_discharge, data.water_level, elevation,
        land_enc, soil_enc,
        population_density, infrastructure, historical_floods
    ]])
    tab_prob = float(models["flood_tabular"].predict_proba(tab_features)[0][1])

    # Modal 2 — Time-Series
    ts = get_timeseries_features(data.state, data.month, data.rainfall)
    ts_features = np.array([ts["features"]])
    ts_prob = float(models["flood_timeseries"]["model"].predict_proba(ts_features)[0][1])

    # Modal 3 — Geospatial
    geo = get_geo_features(data.state)
    geo_features = np.array([geo["features"]])
    geo_prob = float(models["flood_geo"]["model"].predict_proba(geo_features)[0][1])

    # Fusion — weighted combination
    final_score = round((0.40 * tab_prob) + (0.40 * ts_prob) + (0.20 * geo_prob), 3)
    overall     = score_to_risk(final_score)

    # Key factors
    key_factors = get_key_factors(data, ts, geo)

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

        "fusion_weights": {"tabular": 0.40, "timeseries": 0.40, "geospatial": 0.20},

        "rainfall_stats": {
            "actual":      data.rainfall,
            "normal":      ts["normal"],
            "deviation":   ts["deviation"],
            "is_monsoon":  bool(ts["is_monsoon"]),
            "month_name":  MONTH_NAMES[data.month],
        },

        "river_stats": {
            "water_level":   data.water_level,
            "warning_level": geo["warning_level"],
            "danger_level":  geo["danger_level"],
            "station_count": geo["station_count"],
            "above_warning": data.water_level >= geo["warning_level"],
            "above_danger":  data.water_level >= geo["danger_level"],
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
    ts = get_timeseries_features(data.state, data.month, avg_rainfall)
    ts_features = np.array([ts["features"]])
    ts_prob = float(models["flood_timeseries"]["model"].predict_proba(ts_features)[0][1])

    geo = get_geo_features(data.state)
    geo_features = np.array([geo["features"]])
    geo_prob = float(models["flood_geo"]["model"].predict_proba(geo_features)[0][1])

    # Fusion: timeseries 60%, geospatial 40% (no tabular — no user inputs)
    final_score = round((0.60 * ts_prob) + (0.40 * geo_prob), 3)
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
