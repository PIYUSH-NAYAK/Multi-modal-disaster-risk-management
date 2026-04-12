#Requires -Version 5.1
<#
.SYNOPSIS
    Sets up and runs the Multi-Modal Disaster Risk Intelligence System.
.DESCRIPTION
    Checks prerequisites, creates virtual environment, installs dependencies,
    trains ML models, and starts both backend and frontend servers.
.NOTES
    Run with: .\setup.ps1
    If blocked by execution policy, run first:
        Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
#>

$ErrorActionPreference = "Stop"

# ── Colors ────────────────────────────────────────────────────
function Write-Header($text) {
    Write-Host ""
    Write-Host "  $text" -ForegroundColor Cyan -NoNewline
    Write-Host ""
}
function Write-Ok($text)   { Write-Host "  " -NoNewline; Write-Host "[OK]" -ForegroundColor Green -NoNewline; Write-Host " $text" }
function Write-Info($text) { Write-Host "  " -NoNewline; Write-Host " -> " -ForegroundColor DarkCyan -NoNewline; Write-Host " $text" }
function Write-Warn($text) { Write-Host "  " -NoNewline; Write-Host "[WARN]" -ForegroundColor Yellow -NoNewline; Write-Host " $text" }
function Write-Fail($text) {
    Write-Host "  " -NoNewline
    Write-Host "[ERROR]" -ForegroundColor Red -NoNewline
    Write-Host " $text"
    Read-Host "Press Enter to exit"
    exit 1
}
function Write-Step($num, $total, $text) {
    Write-Host ""
    Write-Host "[$num/$total] " -ForegroundColor Blue -NoNewline
    Write-Host $text -ForegroundColor White
    Write-Host ""
}

# ── Banner ────────────────────────────────────────────────────
Write-Host ""
Write-Host "  =====================================================" -ForegroundColor Blue
Write-Host "   Multi-Modal Disaster Risk Intelligence System" -ForegroundColor White
Write-Host "   Setup Script (PowerShell)" -ForegroundColor Gray
Write-Host "  =====================================================" -ForegroundColor Blue
Write-Host ""

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)  # project root
Set-Location $Root

# ── Step 1 — Prerequisites ────────────────────────────────────
Write-Step 1 6 "Checking prerequisites"

# Python
try {
    $pyVer = (python --version 2>&1).ToString().Split(" ")[1]
    $parts = $pyVer.Split(".")
    if ([int]$parts[0] -lt 3 -or ([int]$parts[0] -eq 3 -and [int]$parts[1] -lt 10)) {
        Write-Fail "Python 3.10+ required (found $pyVer). Download: https://python.org/downloads"
    }
    Write-Ok "Python $pyVer"
} catch {
    Write-Fail "Python not found. Install from https://python.org/downloads and check 'Add to PATH'."
}

# Node.js
try {
    $nodeVer = (node --version 2>&1).ToString()
    Write-Ok "Node.js $nodeVer"
} catch {
    Write-Fail "Node.js not found. Install from https://nodejs.org"
}

# npm
try {
    $npmVer = (npm --version 2>&1).ToString()
    Write-Ok "npm $npmVer"
} catch {
    Write-Fail "npm not found. Reinstall Node.js from https://nodejs.org"
}

# ── Step 2 — Virtual environment ─────────────────────────────
Write-Step 2 6 "Setting up Python virtual environment"

if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Ok "Virtual environment already exists — skipping"
} else {
    Write-Info "Creating virtual environment..."
    python -m venv venv
    Write-Ok "Virtual environment created"
}

& "venv\Scripts\Activate.ps1"
Write-Ok "Virtual environment activated"

# ── Step 3 — Python dependencies ─────────────────────────────
Write-Step 3 6 "Installing Python dependencies"

Write-Info "Running pip install..."
pip install -q -r backend\requirements.txt
Write-Ok "Python dependencies installed"

# ── Step 4 — Train ML models ──────────────────────────────────
Write-Step 4 6 "Training ML models"

$models = @(
    @{ File = "models\earthquake.pkl";     Script = "train\train_earthquake.py";     Name = "Earthquake (Random Forest Regressor)" },
    @{ File = "models\flood_tabular.pkl";  Script = "train\train_flood_tabular.py";  Name = "Flood Tabular (Hydro-Meteorological)" },
    @{ File = "models\flood_timeseries.pkl"; Script = "train\train_flood_timeseries.py"; Name = "Flood Time-Series (Rainfall Patterns)" },
    @{ File = "models\flood_geo.pkl";      Script = "train\train_flood_geo.py";      Name = "Flood Geospatial (River Basins)" }
)

foreach ($m in $models) {
    if (Test-Path $m.File) {
        Write-Ok "$($m.Name) — already trained, skipping"
    } else {
        Write-Info "Training: $($m.Name)..."
        python $m.Script
        Write-Ok "$($m.Name) — done"
    }
}

# ── Step 5 — Frontend dependencies ───────────────────────────
Write-Step 5 6 "Installing frontend dependencies"

if (Test-Path "frontend\node_modules") {
    Write-Ok "node_modules already exists — skipping npm install"
} else {
    Write-Info "Running npm install..."
    Set-Location frontend
    npm install --silent
    Set-Location $Root
    Write-Ok "Frontend dependencies installed"
}

# ── Step 6 — Start servers ────────────────────────────────────
Write-Step 6 6 "Starting servers"

# Kill anything on port 8000
$portPid = (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue).OwningProcess
if ($portPid) {
    Stop-Process -Id $portPid -Force -ErrorAction SilentlyContinue
}

Write-Info "Starting backend on http://localhost:8000 ..."
$backendJob = Start-Process -FilePath "powershell" `
    -ArgumentList "-NoProfile -Command `"& 'venv\Scripts\Activate.ps1'; uvicorn backend.main:app --host 0.0.0.0 --port 8000`"" `
    -PassThru -WindowStyle Minimized

# Wait for backend to be ready
$ready = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:8000/" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        $ready = $true
        break
    } catch {}
}

if ($ready) {
    Write-Ok "Backend is ready (PID $($backendJob.Id))"
} else {
    Write-Warn "Backend may not have started yet. Check the backend window."
}

Write-Host ""
Write-Host "  =====================================================" -ForegroundColor Green
Write-Host "   Everything is set up!" -ForegroundColor White
Write-Host "  =====================================================" -ForegroundColor Green
Write-Host "   Frontend  ->  http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend   ->  http://localhost:8000" -ForegroundColor Cyan
Write-Host "   API Docs  ->  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  =====================================================" -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop the frontend" -ForegroundColor Gray
Write-Host "   Close the backend window to stop the API server" -ForegroundColor Gray
Write-Host "  =====================================================" -ForegroundColor Green
Write-Host ""

Set-Location frontend
npm run dev
