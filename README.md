# Multi-Modal Disaster Risk Intelligence System

AI-powered disaster risk prediction for India using real historical data.

## Stack
- **Backend**: FastAPI + scikit-learn
- **Frontend**: React 18 + Vite + Tailwind CSS
- **ML**: Random Forest (trained on USGS + Kaggle India datasets)

## Setup

### 1. Clone & create virtual environment
```bash
python3 -m venv venv
source venv/bin/activate      
pip install -r backend/requirements.txt
```

### 2. Train the model
```bash
python3 train/train_earthquake.py
```

### 3. Start backend
```bash
uvicorn backend.main:app --reload --port 8000
```

### 4. Start frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/predict/earthquake` | Earthquake prediction |
| GET | `/model-info` | Model metadata |

## Modules
| Disaster | Status | Dataset |
|----------|--------|---------|
| Earthquake | Live | 7,051 India USGS records |
| Flood | Coming Soon | 10,000 India records |
| Cyclone | Coming Soon | — |
