from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI(title="Disaster Risk Intelligence API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models at startup
models = {}

def load_models():
    model_files = {
        "earthquake": "earthquake.pkl",
    }
    for name, filename in model_files.items():
        path = os.path.join(BASE_DIR, "models", filename)
        if os.path.exists(path):
            models[name] = joblib.load(path)
            print(f"Loaded model: {name}")
        else:
            print(f"Model not found: {path}")

load_models()


# ── Schemas ──────────────────────────────────────────────

class EarthquakeInput(BaseModel):
    latitude: float
    longitude: float
    depth: float


# ── Risk mapping ─────────────────────────────────────────

def earthquake_risk(magnitude: float) -> dict:
    if magnitude < 3.0:
        return {"level": "Low", "color": "green", "message": "Minor earthquake. No significant damage expected."}
    elif magnitude < 5.0:
        return {"level": "Moderate", "color": "yellow", "message": "Moderate earthquake. Minor damage possible."}
    elif magnitude < 7.0:
        return {"level": "High", "color": "orange", "message": "Strong earthquake. Significant damage expected. Take precautions."}
    else:
        return {"level": "Extreme", "color": "red", "message": "Major earthquake. Severe damage. Evacuate immediately."}


# ── Endpoints ────────────────────────────────────────────

@app.get("/")
def health_check():
    return {
        "status": "running",
        "models_loaded": list(models.keys()),
        "version": "1.0.0"
    }


@app.post("/predict/earthquake")
def predict_earthquake(data: EarthquakeInput):
    if "earthquake" not in models:
        raise HTTPException(status_code=503, detail="Earthquake model not loaded")

    if not (8 <= data.latitude <= 37):
        raise HTTPException(status_code=400, detail="Latitude must be within India bounds (8 to 37)")
    if not (68 <= data.longitude <= 97):
        raise HTTPException(status_code=400, detail="Longitude must be within India bounds (68 to 97)")
    if data.depth < 0:
        raise HTTPException(status_code=400, detail="Depth cannot be negative")

    features = np.array([[data.latitude, data.longitude, data.depth]])
    magnitude = round(float(models["earthquake"].predict(features)[0]), 2)
    risk = earthquake_risk(magnitude)

    return {
        "disaster_type": "earthquake",
        "inputs": {
            "latitude": data.latitude,
            "longitude": data.longitude,
            "depth": data.depth
        },
        "predicted_magnitude": magnitude,
        "risk_level": risk["level"],
        "risk_color": risk["color"],
        "message": risk["message"]
    }


@app.get("/model-info")
def model_info():
    return {
        "earthquake": {
            "features": ["latitude", "longitude", "depth"],
            "target": "magnitude",
            "type": "regression",
            "training_rows": 7051,
            "r2_score": 0.3564,
            "mae": 0.3580
        }
    }
