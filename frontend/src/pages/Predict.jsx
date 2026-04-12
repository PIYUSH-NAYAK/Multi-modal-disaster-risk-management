import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { predictEarthquake } from "../api";
import ResultCard from "../components/ResultCard";
import locations from "../data/locations";

const disasterTypes = [
  { value: "earthquake", label: "🌋 Earthquake" },
  { value: "flood",      label: "🌊 Flood — Coming Soon",   disabled: true },
  { value: "cyclone",    label: "🌀 Cyclone — Coming Soon", disabled: true },
];

const states = Object.keys(locations).sort();

function SelectField({ label, value, onChange, disabled, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 appearance-none cursor-pointer"
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

function LoadingSpinner() {
  return (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function Predict() {
  const [searchParams] = useSearchParams();
  const [disaster, setDisaster]   = useState("earthquake");
  const [state, setState]         = useState("");
  const [city, setCity]           = useState("");
  const [depth, setDepth]         = useState("");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const cityList   = state ? locations[state] : [];
  const cityObj    = cityList.find((c) => c.city === city);

  useEffect(() => {
    const type = searchParams.get("type");
    if (type) setDisaster(type);
  }, [searchParams]);

  useEffect(() => {
    setCity("");
    setResult(null);
    setError(null);
  }, [state]);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [disaster]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      let res;
      if (disaster === "earthquake") {
        res = await predictEarthquake({
          latitude:  cityObj.lat,
          longitude: cityObj.lon,
          depth:     parseFloat(depth),
        });
      }
      setResult(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Something went wrong. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = state && city && depth.toString().trim() !== "";

  return (
    <div className="relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-glow pointer-events-none" />

      <div className="relative max-w-xl mx-auto px-6 py-16 sm:py-20">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-gray-400 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            AI-Powered Prediction
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            Disaster Risk Predictor
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Select your state and city to get an AI-powered risk assessment.
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="animate-fade-in-up glass rounded-2xl p-6 sm:p-8 space-y-6 glow-sm"
        >
          {/* Disaster Type */}
          <SelectField
            label="Disaster Type"
            value={disaster}
            onChange={(e) => setDisaster(e.target.value)}
          >
            {disasterTypes.map((d) => (
              <option key={d.value} value={d.value} disabled={d.disabled}>
                {d.label}
              </option>
            ))}
          </SelectField>

          {/* State */}
          <SelectField
            label="State / UT"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="">Select a state…</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectField>

          {/* City */}
          <SelectField
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={!state}
          >
            <option value="">Select a city…</option>
            {cityList.map((c) => (
              <option key={c.city} value={c.city}>{c.city}</option>
            ))}
          </SelectField>

          {/* Resolved coordinates */}
          {cityObj && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Latitude</p>
                <p className="text-white text-sm font-mono font-medium">{cityObj.lat}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Longitude</p>
                <p className="text-white text-sm font-mono font-medium">{cityObj.lon}</p>
              </div>
            </div>
          )}

          {/* Depth */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Depth (km)
              <span className="text-gray-600 font-normal ml-2 text-xs">(typical: 5 – 100 km)</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 10"
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              required
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 placeholder-gray-600 transition-all duration-200"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-fade-in">
              <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/[0.06] disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:shadow-none hover:-translate-y-0.5 disabled:translate-y-0"
          >
            {loading ? (
              <>
                <LoadingSpinner />
                Analyzing...
              </>
            ) : (
              "Predict Risk"
            )}
          </button>
        </form>

        <ResultCard result={result} />
      </div>
    </div>
  );
}
