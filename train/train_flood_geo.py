import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAIN_PATH  = os.path.join(BASE_DIR, "data", "Rainfall_Data_LL.csv")
META_PATH  = os.path.join(BASE_DIR, "data", "metadata_indofloods.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "flood_geo.pkl")

# Known flood-prone subdivisions with historical flood frequency
FLOOD_FREQ = {
    "Assam & Meghalaya": 0.85,
    "Arunachal Pradesh": 0.70,
    "Naga Mani Mizo Tripura": 0.65,
    "Sub Himalayan West Bengal & Sikkim": 0.75,
    "Gangetic West Bengal": 0.70,
    "Orissa": 0.65,
    "Jharkhand": 0.45,
    "Bihar": 0.80,
    "East Uttar Pradesh": 0.70,
    "West Uttar Pradesh": 0.55,
    "Uttarakhand": 0.65,
    "Himachal Pradesh": 0.50,
    "Jammu & Kashmir": 0.45,
    "Punjab": 0.40,
    "Haryana Delhi & Chandigarh": 0.35,
    "Rajasthan": 0.30,
    "Gujarat": 0.55,
    "Konkan & Goa": 0.60,
    "Madhya Maharashtra": 0.40,
    "Marathwada": 0.35,
    "Vidarbha": 0.40,
    "Coastal Andhra Pradesh": 0.65,
    "Telangana": 0.55,
    "Rayalseema": 0.40,
    "Tamil Nadu": 0.50,
    "Coastal Karnataka": 0.60,
    "North Interior Karnataka": 0.40,
    "South Interior Karnataka": 0.40,
    "Kerala": 0.70,
    "Lakshadweep": 0.20,
    "Andaman & Nicobar Islands": 0.55,
    "Saurashtra & Kutch": 0.35,
    "West Madhya Pradesh": 0.40,
    "East Madhya Pradesh": 0.45,
    "Chhattisgarh": 0.50,
    "Madhya Pradesh": 0.45,
}

def train():
    print("Loading geospatial rainfall dataset...")
    df = pd.read_csv(RAIN_PATH)
    print(f"Rows loaded: {len(df)}")

    df = df.dropna(subset=["Latitude", "Longitude", "ANNUAL"])

    # Add flood frequency label per subdivision
    df["flood_freq"] = df["SUBDIVISION"].map(FLOOD_FREQ).fillna(0.40)

    # Monsoon rainfall (Jun-Sep)
    df["monsoon_avg"] = df[["JUN","JUL","AUG","SEP"]].mean(axis=1)

    # Pre-monsoon (Mar-May)
    df["premonsoon_avg"] = df[["MAR","APR","MAY"]].mean(axis=1)

    # Flood label: high monsoon rainfall + high historical frequency
    df["monsoon_zscore"] = (df["monsoon_avg"] - df["monsoon_avg"].mean()) / df["monsoon_avg"].std()
    df["flood_risk"] = (
        (df["flood_freq"] >= 0.60) |
        ((df["flood_freq"] >= 0.45) & (df["monsoon_zscore"] > 0.5))
    ).astype(int)

    print(f"Flood risk YES: {df['flood_risk'].sum()} ({df['flood_risk'].mean()*100:.1f}%)")

    features = [
        "Latitude", "Longitude", "ANNUAL",
        "monsoon_avg", "premonsoon_avg",
        "JUN", "JUL", "AUG", "SEP",
        "flood_freq", "monsoon_zscore"
    ]

    X = df[features].fillna(0)
    y = df["flood_risk"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced"
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    print("\n=== Modal 3 — Geospatial Model Performance ===")
    print(f"Accuracy : {acc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # State to subdivision mapping for API use
    state_geo = df.groupby("SUBDIVISION").agg(
        lat=("Latitude", "mean"),
        lon=("Longitude", "mean"),
        annual_avg=("ANNUAL", "mean"),
        monsoon_avg=("monsoon_avg", "mean"),
        flood_freq=("flood_freq", "mean")
    ).reset_index()

    # Load river danger levels from metadata
    meta = pd.read_csv(META_PATH)
    state_danger = meta.groupby("State").agg(
        avg_warning=("Warning Level", "mean"),
        avg_danger=("Danger Level", "mean"),
        station_count=("GaugeID", "count")
    ).reset_index()

    joblib.dump({
        "model": model,
        "features": features,
        "state_geo": state_geo,
        "state_danger": state_danger,
        "flood_freq": FLOOD_FREQ
    }, MODEL_PATH)

    print(f"\nModel saved → {MODEL_PATH}")

if __name__ == "__main__":
    train()
