import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { fetchAlerts, geocodeCity, fetchCityWeather } from "../api";
import LiveAlerts from "../components/LiveAlerts";

const disasters = [
  {
    type: "earthquake",
    icon: "🌋",
    title: "Earthquake",
    desc: "Predict earthquake magnitude from location and depth using 7,051 USGS India seismic records.",
    stats: "7,051 records",
    gradient: "from-orange-500/15 via-amber-500/5 to-transparent",
    border: "border-orange-500/25 hover:border-orange-500/60",
    iconBg: "bg-orange-500/15",
    iconRing: "ring-1 ring-orange-500/30",
    accent: "text-orange-400",
    accentBg: "bg-orange-500/10",
    glowColor: "rgba(249,115,22,0.15)",
    available: true,
  },
  {
    type: "flood",
    icon: "🌊",
    title: "Flood",
    desc: "Multi-modal AI fusing 3 RF models with live weather data for precise flood probability.",
    stats: "2,19,277 records",
    gradient: "from-blue-500/15 via-cyan-500/5 to-transparent",
    border: "border-blue-500/25 hover:border-blue-500/60",
    iconBg: "bg-blue-500/15",
    iconRing: "ring-1 ring-blue-500/30",
    accent: "text-blue-400",
    accentBg: "bg-blue-500/10",
    glowColor: "rgba(59,130,246,0.15)",
    available: true,
  },
  {
    type: "cyclone",
    icon: "🌀",
    title: "Cyclone",
    desc: "Predict cyclone intensity from atmospheric pressure, wind speed and sea surface temperature.",
    stats: "Coming soon",
    gradient: "from-purple-500/15 via-violet-500/5 to-transparent",
    border: "border-purple-500/20 hover:border-purple-500/30",
    iconBg: "bg-purple-500/15",
    iconRing: "ring-1 ring-purple-500/20",
    accent: "text-purple-400",
    accentBg: "bg-purple-500/10",
    glowColor: "rgba(139,92,246,0.10)",
    available: false,
  },
];

const THREAT_STYLES = {
  Low:      { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400", bar: "from-emerald-400 to-emerald-500", pct: 18 },
  Moderate: { text: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/20",  dot: "bg-yellow-400",  bar: "from-yellow-400 to-amber-500",   pct: 45 },
  High:     { text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  dot: "bg-orange-400",  bar: "from-orange-400 to-red-500",     pct: 72 },
  Extreme:  { text: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     dot: "bg-red-400",     bar: "from-red-400 to-red-600",        pct: 92 },
};

const THREAT_ORDER = { Extreme: 4, High: 3, Moderate: 2, Low: 1 };

function WeatherConditionIcon({ condition }) {
  if (!condition) return "🌡";
  const c = condition.toLowerCase();
  if (c.includes("rain") || c.includes("drizzle")) return "🌧";
  if (c.includes("storm") || c.includes("thunder")) return "⛈";
  if (c.includes("cloud")) return "☁️";
  if (c.includes("fog") || c.includes("mist") || c.includes("haze")) return "🌫";
  if (c.includes("clear") || c.includes("sunny")) return "☀️";
  return "🌤";
}

const ALERTS_CACHE_KEY  = "disasterai_alerts_cache";
const PINNED_CITY_KEY   = "disasterai_pinned_city";

function getPinnedCity() {
  try { return JSON.parse(localStorage.getItem(PINNED_CITY_KEY)); } catch { return null; }
}
function setPinnedCity(city) {
  try { localStorage.setItem(PINNED_CITY_KEY, JSON.stringify(city)); } catch {}
}
function getTopCityFromCache() {
  try {
    const raw = localStorage.getItem(ALERTS_CACHE_KEY);
    if (!raw) return null;
    const { cities, ts } = JSON.parse(raw);
    if (Date.now() - ts > 5 * 60 * 1000) return null;
    return [...cities].sort((a, b) => (THREAT_ORDER[b.threat] || 0) - (THREAT_ORDER[a.threat] || 0))[0] || null;
  } catch { return null; }
}

/* ── City search picker inside the card ── */
function CityPicker({ onSelect, onClose }) {
  const [query, setQuery]           = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching]   = useState(false);
  const [adding, setAdding]         = useState(null);
  const debounceRef = useRef(null);
  const inputRef    = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleInput = (val) => {
    setQuery(val);
    if (!val.trim()) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await geocodeCity(val.trim());
        setSuggestions(res.data.cities || []);
      } catch {}
      finally { setSearching(false); }
    }, 400);
  };

  const handleSelect = async (c) => {
    setAdding(c.name);
    try {
      const res = await fetchCityWeather(c.lat, c.lon, c.name, c.state);
      onSelect(res.data);
    } catch {}
    finally { setAdding(null); }
  };

  return (
    <div className="absolute inset-0 z-20 rounded-2xl bg-gray-900/98 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-sm font-semibold text-white">Choose your city</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-xs transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.06]">
          Cancel
        </button>
      </div>

      {/* Search input */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="relative">
          {searching ? (
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder="Search any Indian city…"
            className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-lg pl-9 pr-3 py-2 text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {suggestions.length > 0 ? (
          suggestions.map((c) => (
            <button
              key={`${c.name}-${c.lat}`}
              onClick={() => adding === null && handleSelect(c)}
              disabled={adding !== null}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.05] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">📍</span>
                <div>
                  <p className="text-sm font-semibold text-white">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.state}</p>
                </div>
              </div>
              {adding === c.name ? (
                <svg className="w-4 h-4 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <span className="text-[10px] text-indigo-400 font-semibold">Select →</span>
              )}
            </button>
          ))
        ) : query && !searching ? (
          <p className="text-center text-sm text-gray-600 py-8">No Indian cities found</p>
        ) : !query ? (
          <p className="text-center text-xs text-gray-600 py-8">Type a city name to search</p>
        ) : null}
      </div>
    </div>
  );
}

/* ── Live dashboard card shown in hero ── */
function HeroDashboard() {
  const [city, setCity]         = useState(getPinnedCity() || getTopCityFromCache());
  const [loading, setLoading]   = useState(!getPinnedCity() && !getTopCityFromCache());
  const [picking, setPicking]   = useState(false);

  useEffect(() => {
    if (city) return;
    fetchAlerts()
      .then((res) => {
        const cities = res.data.cities || [];
        const top = [...cities].sort(
          (a, b) => (THREAT_ORDER[b.threat] || 0) - (THREAT_ORDER[a.threat] || 0)
        )[0];
        setCity(top || null);
      })
      .catch(() => setCity(null))
      .finally(() => setLoading(false));
  }, []);

  const handlePick = (newCity) => {
    setCity(newCity);
    setPinnedCity(newCity);
    setPicking(false);
  };

  const cfg = city ? (THREAT_STYLES[city.threat] || THREAT_STYLES.Low) : THREAT_STYLES.Moderate;
  const month = new Date().toLocaleString("en-IN", { month: "long" });

  return (
    <div className="relative w-full max-w-sm mx-auto lg:mx-0">
      {/* Ambient glow */}
      <div className={`absolute -inset-4 rounded-3xl blur-2xl opacity-60 ${city ? `bg-gradient-to-br ${cfg.bg} via-indigo-600/10 to-purple-600/10` : "bg-indigo-600/10"}`} />
      <div className="absolute -inset-1 bg-gradient-to-br from-white/[0.04] to-white/[0.01] rounded-3xl blur-sm" />

      {/* Main card */}
      <div className="relative rounded-2xl border border-white/[0.1] bg-gray-900/90 backdrop-blur-xl shadow-2xl overflow-hidden">

        {/* City picker overlay */}
        {picking && <CityPicker onSelect={handlePick} onClose={() => setPicking(false)} />}

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="text-base">🌊</span>
            <span className="text-sm font-semibold text-white">Live Weather Monitor</span>
          </div>
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-5 w-16 rounded-full bg-white/[0.06] animate-shimmer" />
            ) : city ? (
              <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                {city.threat.toUpperCase()}
              </span>
            ) : (
              <span className="text-[10px] text-gray-500">Offline</span>
            )}
            {!loading && (
              <button
                onClick={() => setPicking(true)}
                title="Change city"
                className="w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors"
              >
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {loading ? (
            /* Skeleton */
            <div className="space-y-4">
              <div className="h-4 w-40 rounded bg-white/[0.06] animate-shimmer" />
              <div className="h-14 w-32 mx-auto rounded-xl bg-white/[0.06] animate-shimmer" />
              <div className="h-2 w-full rounded-full bg-white/[0.06] animate-shimmer" />
              <div className="grid grid-cols-3 gap-2">
                {[0,1,2].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.06] animate-shimmer" />)}
              </div>
            </div>
          ) : city ? (
            <>
              {/* Location + time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span className="font-medium text-white">{city.name}</span>
                  <span className="text-gray-600">·</span>
                  <span>{city.state}</span>
                  {getPinnedCity() && (
                    <span className="text-[9px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full font-semibold">pinned</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-600 font-medium">{month}</span>
              </div>

              {/* Condition + temp */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <span className="text-2xl"><WeatherConditionIcon condition={city.condition} /></span>
                  <div>
                    <p className="text-sm font-semibold text-white">{city.condition || "Clear"}</p>
                    <p className="text-[11px] text-gray-500">Current condition</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">{city.temperature}°</p>
                  <p className="text-[10px] text-gray-600">Celsius</p>
                </div>
              </div>

              {/* Threat risk bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Flood Risk Level</span>
                  <span className={`text-sm font-black ${cfg.text}`}>{cfg.pct}%</span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${cfg.bar}`}
                    style={{ width: `${cfg.pct}%`, transition: "width 1.5s ease" }}
                  />
                </div>
              </div>

              {/* Weather metrics */}
              <div className="grid grid-cols-3 gap-2 pb-1">
                {[
                  { icon: "🌧", label: "Rainfall",  val: `${city.rainfall_mm}mm` },
                  { icon: "💧", label: "Humidity",  val: `${city.humidity}%` },
                  { icon: "🏞", label: "Discharge", val: city.river_discharge ? `${city.river_discharge}` : "—" },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg bg-white/[0.02] border border-white/[0.05] px-2 py-2 text-center">
                    <span className="text-sm">{m.icon}</span>
                    <p className="text-[10px] text-gray-600 mt-0.5">{m.label}</p>
                    <p className="text-xs font-bold text-gray-300">{m.val}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-sm text-gray-600">
              Start backend to see live data
            </div>
          )}
        </div>

        {/* Bottom strip */}
        {!loading && city && (
          <div className={`px-5 py-2.5 border-t ${cfg.border} ${cfg.bg} flex items-center justify-between`}>
            <p className={`text-[11px] font-semibold ${cfg.text}`}>
              {city.threat === "Extreme" || city.threat === "High"
                ? "⚠️ Elevated flood risk detected"
                : city.threat === "Moderate"
                ? "🟡 Monitor weather conditions"
                : "✅ Conditions normal"}
            </p>
            <span className="text-[10px] text-gray-600">Live · Open-Meteo</span>
          </div>
        )}
      </div>

    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="text-white">

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">

        {/* ── Background layers ── */}
        <div className="absolute inset-0 bg-grid opacity-40" />

        {/* Large gradient orbs */}
        <div className="absolute top-0 left-[-20%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none" />

        {/* ── Content ── */}
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-28 md:pt-28 md:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: Text */}
            <div>
              {/* Badge */}
              <div className="animate-fade-in-down inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs font-semibold text-indigo-300 mb-8 tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                AI-Powered · India · Real-Time Data
              </div>

              {/* Heading */}
              <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.08] mb-6">
                Predict Disaster
                <br />
                <span className="gradient-text">Risk with AI</span>
                <br />
                <span className="text-gray-300 font-semibold text-3xl sm:text-4xl lg:text-4xl">before it hits.</span>
              </h1>

              {/* Subtitle */}
              <p className="animate-fade-in-up delay-200 text-gray-400 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                Machine learning models trained on real Indian seismic, flood, and rainfall records —
                fused with live Open-Meteo weather data for accurate predictions.
              </p>

              {/* CTAs */}
              <div className="animate-fade-in-up delay-300 flex flex-wrap items-center gap-4 mb-12">
                <button
                  onClick={() => navigate("/predict")}
                  className="group inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-7 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 text-sm"
                >
                  Start Predicting
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
                <button
                  onClick={() => navigate("/about")}
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white font-medium px-5 py-3.5 rounded-xl glass glass-hover text-sm transition-all"
                >
                  How it works
                  <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>

              {/* Mini stats row */}
              <div className="animate-fade-in-up delay-400 flex flex-wrap gap-6">
                {[
                  { value: "2.3L+", label: "Training records", color: "text-indigo-400" },
                  { value: "4",     label: "Live ML models",   color: "text-emerald-400" },
                  { value: "10",    label: "Cities monitored", color: "text-cyan-400" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className={`text-2xl font-black ${s.color} leading-none`}>{s.value}</p>
                    <p className="text-[11px] text-gray-600 font-medium mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Dashboard preview */}
            <div className="animate-fade-in-up delay-300 hidden lg:block">
              <HeroDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FEATURE STRIP
      ══════════════════════════════════════════════ */}
      <section className="border-y border-white/[0.04] bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[
              { icon: "🛰", text: "Live Open-Meteo weather integration" },
              { icon: "🧠", text: "Multi-modal late-fusion AI" },
              { icon: "📡", text: "Real-time city alerts" },
              { icon: "🌍", text: "India-specific datasets" },
              { icon: "⚡", text: "FastAPI + React stack" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-2 text-sm text-gray-500">
                <span className="text-base">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          DISASTER MODULES
      ══════════════════════════════════════════════ */}
      <section className="relative max-w-6xl mx-auto px-6 py-24">
        {/* Section label */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 mb-3">Prediction Modules</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Choose a disaster type
          </h2>
          <p className="text-gray-500 text-sm mt-3 max-w-md mx-auto">
            Each module is powered by independent ML models trained on real Indian hazard data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {disasters.map((d) => (
            <div
              key={d.type}
              role={d.available ? "button" : undefined}
              tabIndex={d.available ? 0 : undefined}
              className={`group relative rounded-2xl border bg-gradient-to-br ${d.gradient} ${d.border} p-7 flex flex-col gap-5 transition-all duration-300 ${
                d.available
                  ? "cursor-pointer hover:-translate-y-2 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                  : "opacity-40 cursor-default"
              }`}
              style={d.available ? { "--glow": d.glowColor } : undefined}
              onClick={() => d.available && navigate(`/predict?type=${d.type}`)}
              onKeyDown={(e) => d.available && e.key === "Enter" && navigate(`/predict?type=${d.type}`)}
            >
              {/* Glow overlay on hover */}
              {d.available && (
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 60px -20px ${d.glowColor}` }} />
              )}

              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl ${d.iconBg} ${d.iconRing} flex items-center justify-center text-3xl`}>
                {d.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2.5">{d.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{d.desc}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mb-0.5">Dataset</p>
                  <p className="text-xs text-gray-300 font-bold">{d.stats}</p>
                </div>
                {d.available ? (
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full ${d.accentBg} border ${d.border.split(" ")[0]} ${d.accent}`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${d.accent.replace("text-", "bg-")}`} />
                    Live
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-gray-600 bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>

              {/* Arrow on hover */}
              {d.available && (
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 transition-all duration-200">
                  <div className={`w-8 h-8 rounded-xl ${d.accentBg} flex items-center justify-center`}>
                    <svg className={`w-4 h-4 ${d.accent}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section className="relative border-t border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/10 to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 mb-3">Architecture</p>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">How the AI works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: "📡",
                title: "Live Data Ingestion",
                desc: "Select your location — live Open-Meteo API fetches current rainfall, humidity, temperature and river discharge automatically.",
                color: "text-blue-400",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20",
              },
              {
                step: "02",
                icon: "🧠",
                title: "Multi-Modal Inference",
                desc: "3 independent Random Forest classifiers — Hydro-Met, Time-Series, and Geospatial — each analyse different data dimensions.",
                color: "text-indigo-400",
                bg: "bg-indigo-500/10",
                border: "border-indigo-500/20",
              },
              {
                step: "03",
                icon: "⚖️",
                title: "Weighted Late Fusion",
                desc: "A calibrated fusion layer combines all 3 modal outputs with seasonality-aware weights to produce the final risk score.",
                color: "text-purple-400",
                bg: "bg-purple-500/10",
                border: "border-purple-500/20",
              },
            ].map((s) => (
              <div key={s.step} className="relative rounded-2xl glass p-7 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center text-2xl`}>
                    {s.icon}
                  </div>
                  <span className={`text-5xl font-black ${s.color} opacity-20 leading-none`}>{s.step}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          LIVE ALERTS
      ══════════════════════════════════════════════ */}
      <div className="relative border-t border-white/[0.04]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        <LiveAlerts />
      </div>

      {/* ══════════════════════════════════════════════
          BOTTOM STATS / CTA
      ══════════════════════════════════════════════ */}
      <section className="relative border-t border-white/[0.04] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-20">
            {[
              { label: "Earthquake Records", value: "7,051",    sub: "USGS · India seismic catalog",             icon: "🌋", color: "text-orange-400" },
              { label: "Flood Records",       value: "2,19,277", sub: "IMD · Tabular + TS + Geospatial",          icon: "🌊", color: "text-blue-400"   },
              { label: "Live ML Models",      value: "4",        sub: "Random Forest · Late-fusion ensemble",     icon: "🤖", color: "text-indigo-400" },
            ].map((s) => (
              <div key={s.label} className="text-center group">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass mb-5 text-2xl group-hover:scale-110 transition-transform duration-300">
                  {s.icon}
                </div>
                <p className={`text-4xl font-black ${s.color} mb-1`}>{s.value}</p>
                <p className="text-sm font-semibold text-gray-300 mb-1">{s.label}</p>
                <p className="text-[11px] text-gray-600">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* CTA block */}
          <div className="text-center">
            <div className="inline-block rounded-3xl border border-white/[0.08] bg-white/[0.02] px-12 py-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                Ready to predict disaster risk?
              </h2>
              <p className="text-gray-500 text-sm mb-7 max-w-sm mx-auto">
                Select your location, get live weather data, and see AI-powered risk analysis in seconds.
              </p>
              <button
                onClick={() => navigate("/predict")}
                className="group inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
              >
                Open Predictor
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
