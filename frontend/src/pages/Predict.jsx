import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { predictEarthquake, predictFlood, predictFloodQuick } from "../api";
import ResultCard from "../components/ResultCard";
import FloodResult from "../components/FloodResult";
import FloodQuickResult from "../components/FloodQuickResult";
import PredictingLoader from "../components/PredictingLoader";
import locations from "../data/locations";

const disasterTypes = [
  { value: "earthquake", label: "🌋 Earthquake" },
  { value: "flood",      label: "🌊 Flood" },
  { value: "cyclone",    label: "🌀 Cyclone — Coming Soon", disabled: true },
];

const SOIL_TYPES  = ["Clay", "Loam", "Sandy", "Silt", "Peat"];
const LAND_COVERS = ["Agricultural", "Forest", "Grassland", "Urban", "Wetland"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const states = Object.keys(locations).sort();

// ── Shared fields ─────────────────────────────────────────────

function SelectField({ label, value, onChange, disabled, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}
        {hint && <span className="text-gray-600 font-normal ml-2 text-xs">{hint}</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full bg-gray-900 border border-white/[0.08] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 appearance-none cursor-pointer"
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, placeholder, min, max, step, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}
        {hint && <span className="text-gray-600 font-normal ml-2 text-xs">{hint}</span>}
      </label>
      <input
        type="number"
        step={step || "0.1"}
        min={min || "0"}
        max={max}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full bg-gray-900 border border-white/[0.08] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 placeholder-gray-600 transition-all duration-200"
      />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
      <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      {message}
    </div>
  );
}

function SubmitButton({ valid, loading, label }) {
  return (
    <button
      type="submit"
      disabled={!valid || loading}
      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/[0.05] disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:shadow-none"
    >
      {loading ? (<><LoadingSpinner />Analyzing…</>) : label}
    </button>
  );
}

// ── Earthquake Form ───────────────────────────────────────────

function EarthquakeForm({ onResult, onLoading }) {
  const [state, setState]     = useState("");
  const [city, setCity]       = useState("");
  const [depth, setDepth]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const cityList = state ? locations[state] : [];
  const cityObj  = cityList.find((c) => c.city === city);

  useEffect(() => { setCity(""); onResult(null); }, [state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    onResult(null);
    setLoading(true);
    onLoading(true);
    try {
      const res = await predictEarthquake({ latitude: cityObj.lat, longitude: cityObj.lon, depth: parseFloat(depth) });
      onResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  const valid = state && city && depth.toString().trim() !== "";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SelectField label="State / UT" value={state} onChange={(e) => setState(e.target.value)}>
        <option value="">Select a state…</option>
        {states.map((s) => <option key={s} value={s}>{s}</option>)}
      </SelectField>

      <SelectField label="City" value={city} onChange={(e) => setCity(e.target.value)} disabled={!state}>
        <option value="">Select a city…</option>
        {cityList.map((c) => <option key={c.city} value={c.city}>{c.city}</option>)}
      </SelectField>

      {cityObj && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Latitude</p>
            <p className="text-white text-sm font-mono">{cityObj.lat}</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Longitude</p>
            <p className="text-white text-sm font-mono">{cityObj.lon}</p>
          </div>
        </div>
      )}

      <NumberField label="Depth (km)" value={depth} onChange={setDepth} placeholder="e.g. 10" hint="(5–100 km typical)" />

      {error && <ErrorBox message={error} />}
      <SubmitButton valid={valid} loading={loading} label="Predict Magnitude" />
    </form>
  );
}

// ── Flood Quick Form ──────────────────────────────────────────

function FloodQuickForm({ onResult, onLoading }) {
  const [state, setState]     = useState("");
  const [month, setMonth]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    onResult(null);
    setLoading(true);
    onLoading(true);
    try {
      const res = await predictFloodQuick({ state, month: parseInt(month) });
      onResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SelectField label="State / UT" value={state} onChange={(e) => setState(e.target.value)}>
        <option value="">Select your state…</option>
        {states.map((s) => <option key={s} value={s}>{s}</option>)}
      </SelectField>

      <SelectField label="Month" value={month} onChange={(e) => setMonth(e.target.value)}>
        <option value="">Select a month…</option>
        {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
      </SelectField>

      <p className="text-xs text-gray-600">
        Uses historical rainfall & geospatial records — no other inputs needed.
      </p>

      {error && <ErrorBox message={error} />}
      <SubmitButton valid={state && month} loading={loading} label="Check Flood Risk" />
    </form>
  );
}

// ── Flood Detailed Form ───────────────────────────────────────

function FloodDetailedForm({ onResult, onLoading }) {
  const [state, setState]           = useState("");
  const [month, setMonth]           = useState("");
  const [rainfall, setRainfall]     = useState("");
  const [waterLevel, setWaterLevel] = useState("");
  const [humidity, setHumidity]     = useState("");
  const [soilType, setSoilType]     = useState("Clay");
  const [landCover, setLandCover]   = useState("Agricultural");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    onResult(null);
    setLoading(true);
    onLoading(true);
    try {
      const res = await predictFlood({
        state, month: parseInt(month),
        rainfall: parseFloat(rainfall), water_level: parseFloat(waterLevel),
        humidity: parseFloat(humidity), soil_type: soilType, land_cover: landCover,
      });
      onResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  const valid = state && month && rainfall && waterLevel && humidity;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="State / UT" value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">Select a state…</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectField>
        <SelectField label="Month" value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">Month…</option>
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </SelectField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Rainfall (mm)" value={rainfall} onChange={setRainfall} placeholder="e.g. 250" />
        <NumberField label="Water Level (m)" value={waterLevel} onChange={setWaterLevel} placeholder="e.g. 5.5" />
      </div>
      <NumberField label="Humidity (%)" value={humidity} onChange={setHumidity} placeholder="e.g. 80" min="0" max="100" step="1" />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Soil Type" value={soilType} onChange={(e) => setSoilType(e.target.value)}>
          {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectField>
        <SelectField label="Land Cover" value={landCover} onChange={(e) => setLandCover(e.target.value)}>
          {LAND_COVERS.map((l) => <option key={l} value={l}>{l}</option>)}
        </SelectField>
      </div>
      <p className="text-xs text-gray-600">
        Try: Assam + July + 285mm + 7m + 85% for an extreme-risk example.
      </p>
      {error && <ErrorBox message={error} />}
      <SubmitButton valid={valid} loading={loading} label="Predict Flood Risk" />
    </form>
  );
}

// ── Flood wrapper with mode toggle ────────────────────────────

function FloodForm({ onResult, onLoading, onModeChange }) {
  const [mode, setMode] = useState("quick");

  const handleMode = (m) => { setMode(m); onResult(null); onModeChange(m); };

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg bg-white/[0.04] p-1 gap-1">
        {["quick", "detailed"].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleMode(m)}
            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all duration-200 ${
              mode === m ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            {m === "quick" ? "Quick Check" : "Detailed Analysis"}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        {mode === "quick"
          ? "Pick your state and month — AI uses historical patterns."
          : "Enter real-time conditions for a precise multi-modal prediction."}
      </p>
      {mode === "quick"    && <FloodQuickForm    onResult={onResult} onLoading={onLoading} />}
      {mode === "detailed" && <FloodDetailedForm onResult={onResult} onLoading={onLoading} />}
    </div>
  );
}

// ── Empty state placeholder ───────────────────────────────────

function EmptyState({ disaster }) {
  const hints = {
    earthquake: [
      { icon: "📍", text: "Select your state and city" },
      { icon: "📏", text: "Enter the estimated depth in km" },
      { icon: "🤖", text: "Get predicted magnitude & risk level" },
    ],
    flood: [
      { icon: "🗺️", text: "Pick your state and month" },
      { icon: "📊", text: "AI analyses historical rainfall patterns" },
      { icon: "⚠️", text: "See flood probability and what to do" },
    ],
  };
  const steps = hints[disaster] || hints.earthquake;

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-12 py-20">
      <div className="text-6xl mb-6 opacity-20">
        {disaster === "earthquake" ? "🌋" : disaster === "flood" ? "🌊" : "🌀"}
      </div>
      <h3 className="text-lg font-semibold text-gray-400 mb-2">
        Fill the form to get your prediction
      </h3>
      <p className="text-sm text-gray-600 mb-10 max-w-xs">
        Results will appear here — including risk level, analysis charts, and recommendations.
      </p>
      <div className="space-y-4 w-full max-w-xs text-left">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-lg shrink-0">
              {s.icon}
            </div>
            <p className="text-sm text-gray-500">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function Predict() {
  const [searchParams] = useSearchParams();
  const [disaster, setDisaster]   = useState("earthquake");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [floodMode, setFloodMode] = useState("quick");

  useEffect(() => {
    const type = searchParams.get("type");
    if (type && !disasterTypes.find((d) => d.value === type)?.disabled) {
      setDisaster(type);
    }
  }, [searchParams]);

  const handleDisasterChange = (val) => {
    setDisaster(val);
    setResult(null);
    setLoading(false);
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)]">
      <div className="absolute inset-0 bg-glow pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-gray-400 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            AI-Powered Prediction
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Disaster Risk Predictor
          </h1>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">

          {/* LEFT — Form panel */}
          <div className="lg:sticky lg:top-24">
            <div className="glass rounded-2xl p-6 space-y-5 border border-white/[0.06]">
              {/* Disaster Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">
                  Disaster Type
                </label>
                <div className="flex flex-col gap-2">
                  {disasterTypes.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      disabled={d.disabled}
                      onClick={() => handleDisasterChange(d.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 text-left ${
                        disaster === d.value
                          ? "border-indigo-500/50 bg-indigo-500/10 text-white"
                          : d.disabled
                          ? "border-white/[0.04] bg-white/[0.01] text-gray-600 cursor-not-allowed"
                          : "border-white/[0.06] bg-white/[0.02] text-gray-400 hover:text-white hover:border-white/[0.12] hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className="text-lg">{d.value === "earthquake" ? "🌋" : d.value === "flood" ? "🌊" : "🌀"}</span>
                      <span>{d.disabled ? d.label : (d.value === "earthquake" ? "Earthquake" : d.value === "flood" ? "Flood" : "Cyclone")}</span>
                      {disaster === d.value && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-white/[0.06]" />

              {disaster === "earthquake" && <EarthquakeForm onResult={setResult} onLoading={setLoading} />}
              {disaster === "flood"      && <FloodForm onResult={setResult} onLoading={setLoading} onModeChange={setFloodMode} />}
            </div>
          </div>

          {/* RIGHT — Results panel */}
          <div className="min-h-[500px]">
            {loading && <PredictingLoader disaster={disaster} />}
            {!loading && !result && <EmptyState disaster={disaster} />}
            {!loading && result && disaster === "earthquake" && <ResultCard result={result} />}
            {!loading && result && disaster === "flood" && floodMode === "quick"    && <FloodQuickResult result={result} />}
            {!loading && result && disaster === "flood" && floodMode === "detailed" && <FloodResult result={result} />}
          </div>

        </div>
      </div>
    </div>
  );
}
