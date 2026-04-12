#!/usr/bin/env bash
set -e

# ── Colors ───────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

TICK="${GREEN}✔${RESET}"
CROSS="${RED}✘${RESET}"
ARROW="${CYAN}→${RESET}"

# ── Banner ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║   Multi-Modal Disaster Risk Intelligence System      ║${RESET}"
echo -e "${BOLD}${BLUE}║   Setup Script                                       ║${RESET}"
echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════════╝${RESET}"
echo ""

# ── Helpers ───────────────────────────────────────────────────
step() { echo -e "\n${BOLD}${CYAN}[ $1 ]${RESET} $2"; }
ok()   { echo -e "  ${TICK}  $1"; }
warn() { echo -e "  ${YELLOW}⚠${RESET}  $1"; }
fail() { echo -e "  ${CROSS}  ${RED}$1${RESET}"; exit 1; }
info() { echo -e "  ${ARROW}  $1"; }

# ── Check prerequisites ───────────────────────────────────────
step "1/6" "Checking prerequisites"

if command -v python3 &>/dev/null; then
    PY_VER=$(python3 --version 2>&1 | awk '{print $2}')
    ok "Python $PY_VER found"
    PYTHON=python3
elif command -v python &>/dev/null; then
    PY_VER=$(python --version 2>&1 | awk '{print $2}')
    ok "Python $PY_VER found"
    PYTHON=python
else
    fail "Python not found. Install from https://python.org/downloads"
fi

# Check Python >= 3.10
PY_MAJOR=$(echo "$PY_VER" | cut -d. -f1)
PY_MINOR=$(echo "$PY_VER" | cut -d. -f2)
if [ "$PY_MAJOR" -lt 3 ] || { [ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -lt 10 ]; }; then
    fail "Python 3.10+ required (found $PY_VER)"
fi

if command -v node &>/dev/null; then
    NODE_VER=$(node --version)
    ok "Node.js $NODE_VER found"
else
    fail "Node.js not found. Install from https://nodejs.org"
fi

if command -v npm &>/dev/null; then
    NPM_VER=$(npm --version)
    ok "npm $NPM_VER found"
else
    fail "npm not found. Reinstall Node.js from https://nodejs.org"
fi

# ── Virtual environment ───────────────────────────────────────
step "2/6" "Setting up Python virtual environment"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."  # Move to project root (script lives in scripts/)

if [ -d "venv" ]; then
    ok "Virtual environment already exists — skipping creation"
else
    info "Creating venv..."
    $PYTHON -m venv venv
    ok "Virtual environment created"
fi

# Activate
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
else
    fail "Could not find venv activation script"
fi
ok "Virtual environment activated"

# ── Install Python dependencies ───────────────────────────────
step "3/6" "Installing Python dependencies"

info "Running pip install..."
pip install -q -r backend/requirements.txt
ok "Python dependencies installed"

# ── Train ML models ───────────────────────────────────────────
step "4/6" "Training ML models"

MODELS=(
    "models/earthquake.pkl:train/train_earthquake.py:Earthquake (Random Forest Regressor)"
    "models/flood_tabular.pkl:train/train_flood_tabular.py:Flood Tabular (Hydro-Meteorological)"
    "models/flood_timeseries.pkl:train/train_flood_timeseries.py:Flood Time-Series (Rainfall Patterns)"
    "models/flood_geo.pkl:train/train_flood_geo.py:Flood Geospatial (River Basins)"
)

for entry in "${MODELS[@]}"; do
    MODEL_FILE=$(echo "$entry" | cut -d: -f1)
    TRAIN_SCRIPT=$(echo "$entry" | cut -d: -f2)
    MODEL_NAME=$(echo "$entry" | cut -d: -f3)

    if [ -f "$MODEL_FILE" ]; then
        ok "$MODEL_NAME — already trained, skipping"
    else
        info "Training: $MODEL_NAME..."
        $PYTHON "$TRAIN_SCRIPT"
        ok "$MODEL_NAME — done"
    fi
done

# ── Frontend dependencies ─────────────────────────────────────
step "5/6" "Installing frontend dependencies"

if [ -d "frontend/node_modules" ]; then
    ok "node_modules already exists — skipping npm install"
else
    info "Running npm install..."
    cd frontend
    npm install --silent
    cd ..
    ok "Frontend dependencies installed"
fi

# ── Start servers ─────────────────────────────────────────────
step "6/6" "Starting servers"

# Kill anything on port 8000 first
if command -v fuser &>/dev/null; then
    fuser -k 8000/tcp 2>/dev/null || true
elif command -v lsof &>/dev/null; then
    PID=$(lsof -ti:8000 2>/dev/null || true)
    [ -n "$PID" ] && kill -9 $PID 2>/dev/null || true
fi

info "Starting backend on http://localhost:8000 ..."
uvicorn backend.main:app --host 0.0.0.0 --port 8000 > /tmp/disaster_backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
for i in {1..15}; do
    if curl -s http://localhost:8000/ > /dev/null 2>&1; then
        ok "Backend is ready (PID $BACKEND_PID)"
        break
    fi
    sleep 1
done

if ! curl -s http://localhost:8000/ > /dev/null 2>&1; then
    warn "Backend may not have started. Check /tmp/disaster_backend.log"
fi

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║   Everything is set up!                              ║${RESET}"
echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}${GREEN}║   Frontend → http://localhost:5173                   ║${RESET}"
echo -e "${BOLD}${GREEN}║   Backend  → http://localhost:8000                   ║${RESET}"
echo -e "${BOLD}${GREEN}║   API Docs → http://localhost:8000/docs              ║${RESET}"
echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}${GREEN}║   Press Ctrl+C to stop the frontend                  ║${RESET}"
echo -e "${BOLD}${GREEN}║   Backend PID: $BACKEND_PID (kill with: kill $BACKEND_PID)          ║${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${RESET}"
echo ""

# Start frontend in foreground (so Ctrl+C stops it cleanly)
cd frontend
npm run dev
