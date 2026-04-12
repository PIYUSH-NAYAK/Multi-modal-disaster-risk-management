import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

BASE_DIR  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "daily-rainfall-at-state-level.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "flood_timeseries.pkl")

# Historically flood-prone states in India
FLOOD_PRONE_STATES = {
    "Assam", "Bihar", "Uttar Pradesh", "West Bengal", "Odisha",
    "Kerala", "Andhra Pradesh", "Telangana", "Uttarakhand",
    "Himachal Pradesh", "Arunachal Pradesh", "Manipur", "Tripura",
    "Maharashtra", "Gujarat", "Rajasthan"
}

# Monsoon months
MONSOON_MONTHS = {6, 7, 8, 9}

def train():
    print("Loading daily rainfall time-series dataset...")
    df = pd.read_csv(DATA_PATH)
    print(f"Rows loaded: {len(df)}")

    # Drop nulls
    df = df.dropna(subset=["actual", "normal", "deviation"])
    print(f"Rows after dropping nulls: {len(df)}")

    # Parse date
    df["date"]  = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.month
    df["year"]  = df["date"].dt.year

    # Clean deviation
    df["deviation"] = pd.to_numeric(df["deviation"], errors="coerce")
    df = df.dropna(subset=["deviation"])

    # Sort for rolling features
    df = df.sort_values(["state_name", "date"]).reset_index(drop=True)

    # Rolling features per state
    df["roll_7d"]  = df.groupby("state_name")["actual"].transform(
        lambda x: x.rolling(7,  min_periods=1).mean())
    df["roll_30d"] = df.groupby("state_name")["actual"].transform(
        lambda x: x.rolling(30, min_periods=1).mean())

    # Binary features
    df["is_monsoon"]     = df["month"].isin(MONSOON_MONTHS).astype(int)
    df["is_flood_prone"] = df["state_name"].isin(FLOOD_PRONE_STATES).astype(int)
    df["above_normal"]   = (df["deviation"] > 0).astype(int)

    # Flood label: deviation > 40% in monsoon month for flood-prone state
    # OR deviation > 80% in any month
    df["flood_risk"] = (
        ((df["deviation"] > 40) & (df["is_monsoon"] == 1) & (df["is_flood_prone"] == 1)) |
        (df["deviation"] > 80)
    ).astype(int)

    print(f"Flood risk YES: {df['flood_risk'].sum()} ({df['flood_risk'].mean()*100:.1f}%)")
    print(f"Flood risk NO : {(df['flood_risk']==0).sum()}")

    features = [
        "actual", "normal", "deviation",
        "roll_7d", "roll_30d", "month",
        "is_monsoon", "is_flood_prone", "above_normal"
    ]

    X = df[features]
    y = df["flood_risk"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced"
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    print("\n=== Modal 2 — Time-Series Model Performance ===")
    print(f"Accuracy : {acc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    print("\n=== Feature Importances ===")
    for feat, imp in sorted(zip(features, model.feature_importances_),
                            key=lambda x: x[1], reverse=True):
        print(f"  {feat:<25} : {imp:.4f}")

    # Save model + state stats for UI
    state_stats = df.groupby(["state_name", "month"]).agg(
        avg_actual=("actual", "mean"),
        avg_normal=("normal", "mean"),
        avg_deviation=("deviation", "mean"),
        flood_rate=("flood_risk", "mean")
    ).reset_index()

    joblib.dump({
        "model": model,
        "features": features,
        "state_stats": state_stats,
        "flood_prone_states": FLOOD_PRONE_STATES,
        "monsoon_months": MONSOON_MONTHS
    }, MODEL_PATH)
    print(f"\nModel saved → {MODEL_PATH}")

if __name__ == "__main__":
    train()
