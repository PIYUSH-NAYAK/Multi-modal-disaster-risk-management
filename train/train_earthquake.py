import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "Earthquakes_India_Master.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "earthquake.pkl")

def train():
    print("Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    print(f"Total rows loaded: {len(df)}")

    # Features and target
    features = ["latitude", "longitude", "depth"]
    target = "mag"

    df = df[features + [target]].dropna()
    print(f"Rows after dropping nulls: {len(df)}")

    X = df[features]
    y = df[target]

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"Train size: {len(X_train)} | Test size: {len(X_test)}")

    # Train model
    print("\nTraining Random Forest...")
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    r2  = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)

    print("\n=== Model Performance ===")
    print(f"R² Score : {r2:.4f}")
    print(f"MAE      : {mae:.4f}")

    print("\n=== Feature Importances ===")
    for feat, imp in zip(features, model.feature_importances_):
        print(f"  {feat:<12} : {imp:.4f}")

    # Save model
    joblib.dump(model, MODEL_PATH)
    print(f"\nModel saved → {MODEL_PATH}")

if __name__ == "__main__":
    train()
