import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
import joblib
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "flood_risk_dataset_india.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "flood_tabular.pkl")
ENC_PATH   = os.path.join(BASE_DIR, "models", "flood_tabular_encoders.pkl")

def train():
    print("Loading tabular flood dataset...")
    df = pd.read_csv(DATA_PATH)
    print(f"Rows loaded: {len(df)}")

    # Remove unrealistic elevation (Himalayan peaks can't flood)
    df = df[df["Elevation (m)"] <= 5000]
    print(f"Rows after elevation filter: {len(df)}")

    # Encode categorical columns
    le_land  = LabelEncoder()
    le_soil  = LabelEncoder()
    df["Land Cover Enc"] = le_land.fit_transform(df["Land Cover"])
    df["Soil Type Enc"]  = le_soil.fit_transform(df["Soil Type"])

    features = [
        "Rainfall (mm)", "Temperature (°C)", "Humidity (%)",
        "River Discharge (m³/s)", "Water Level (m)", "Elevation (m)",
        "Land Cover Enc", "Soil Type Enc",
        "Population Density", "Infrastructure", "Historical Floods"
    ]
    target = "Flood Occurred"

    X = df[features]
    y = df[target].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train: {len(X_train)} | Test: {len(X_test)}")

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    print("\n=== Modal 1 — Tabular Model Performance ===")
    print(f"Accuracy : {acc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    print("\n=== Feature Importances ===")
    for feat, imp in sorted(zip(features, model.feature_importances_),
                            key=lambda x: x[1], reverse=True):
        print(f"  {feat:<35} : {imp:.4f}")

    joblib.dump(model, MODEL_PATH)
    joblib.dump({"land_cover": le_land, "soil_type": le_soil,
                 "features": features}, ENC_PATH)
    print(f"\nModel saved → {MODEL_PATH}")

if __name__ == "__main__":
    train()
