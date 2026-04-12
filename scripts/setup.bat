@echo off
setlocal EnableDelayedExpansion
title DisasterAI Setup

:: ── Colors via PowerShell ────────────────────────────────────
set "PS=powershell -NoProfile -Command"

echo.
echo  =====================================================
echo   Multi-Modal Disaster Risk Intelligence System
echo   Setup Script
echo  =====================================================
echo.

:: ── Check Python ─────────────────────────────────────────────
echo [1/6] Checking prerequisites
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python not found.
    echo          Install from https://python.org/downloads
    echo          Make sure to check "Add Python to PATH" during install.
    pause
    exit /b 1
)
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PY_VER=%%v
echo  [OK] Python %PY_VER% found

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found.
    echo          Install from https://nodejs.org
    pause
    exit /b 1
)
for /f %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% found

:: Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] npm not found. Reinstall Node.js.
    pause
    exit /b 1
)
for /f %%v in ('npm --version') do set NPM_VER=%%v
echo  [OK] npm %NPM_VER% found

:: ── Virtual environment ───────────────────────────────────────
echo.
echo [2/6] Setting up Python virtual environment
echo.

if exist "venv\Scripts\activate.bat" (
    echo  [OK] Virtual environment already exists - skipping
) else (
    echo  [..] Creating virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo  [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo  [OK] Virtual environment created
)

call venv\Scripts\activate.bat
echo  [OK] Virtual environment activated

:: ── Install Python dependencies ───────────────────────────────
echo.
echo [3/6] Installing Python dependencies
echo.

echo  [..] Running pip install...
pip install -q -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo  [ERROR] pip install failed
    pause
    exit /b 1
)
echo  [OK] Python dependencies installed

:: ── Train ML models ───────────────────────────────────────────
echo.
echo [4/6] Training ML models
echo.

if exist "models\earthquake.pkl" (
    echo  [OK] Earthquake model - already trained, skipping
) else (
    echo  [..] Training: Earthquake (Random Forest Regressor)...
    python train\train_earthquake.py
    echo  [OK] Earthquake model done
)

if exist "models\flood_tabular.pkl" (
    echo  [OK] Flood Tabular model - already trained, skipping
) else (
    echo  [..] Training: Flood Tabular (Hydro-Meteorological)...
    python train\train_flood_tabular.py
    echo  [OK] Flood Tabular model done
)

if exist "models\flood_timeseries.pkl" (
    echo  [OK] Flood Time-Series model - already trained, skipping
) else (
    echo  [..] Training: Flood Time-Series (Rainfall Patterns)...
    python train\train_flood_timeseries.py
    echo  [OK] Flood Time-Series model done
)

if exist "models\flood_geo.pkl" (
    echo  [OK] Flood Geospatial model - already trained, skipping
) else (
    echo  [..] Training: Flood Geospatial (River Basins)...
    python train\train_flood_geo.py
    echo  [OK] Flood Geospatial model done
)

:: ── Frontend dependencies ─────────────────────────────────────
echo.
echo [5/6] Installing frontend dependencies
echo.

if exist "frontend\node_modules" (
    echo  [OK] node_modules already exists - skipping npm install
) else (
    echo  [..] Running npm install...
    cd frontend
    npm install --silent
    cd ..
    echo  [OK] Frontend dependencies installed
)

:: ── Start servers ─────────────────────────────────────────────
echo.
echo [6/6] Starting servers
echo.

:: Kill anything on port 8000
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)

echo  [..] Starting backend on http://localhost:8000 ...
start "DisasterAI Backend" /min cmd /c "call venv\Scripts\activate.bat && uvicorn backend.main:app --host 0.0.0.0 --port 8000"

:: Wait for backend
set READY=0
for /l %%i in (1,1,15) do (
    if !READY! == 0 (
        timeout /t 1 /nobreak >nul
        curl -s http://localhost:8000/ >nul 2>&1
        if !errorlevel! == 0 set READY=1
    )
)

if !READY! == 1 (
    echo  [OK] Backend is ready
) else (
    echo  [WARN] Backend may not have started yet. Check the backend window.
)

echo.
echo  =====================================================
echo   Everything is set up!
echo  =====================================================
echo   Frontend  ->  http://localhost:5173
echo   Backend   ->  http://localhost:8000
echo   API Docs  ->  http://localhost:8000/docs
echo  =====================================================
echo   The frontend will open in this window.
echo   Close the "DisasterAI Backend" taskbar window to stop.
echo  =====================================================
echo.

cd frontend
npm run dev

pause
