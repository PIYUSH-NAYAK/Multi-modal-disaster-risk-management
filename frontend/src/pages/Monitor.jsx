import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchAlerts, geocodeCity, fetchCityWeather } from "../api";

const THREAT_CONFIG = {
  Low:      { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400", bar: "bg-emerald-400",  badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" },
  Moderate: { text: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/20",  dot: "bg-yellow-400",  bar: "bg-yellow-400",   badge: "bg-yellow-500/15  text-yellow-300  border-yellow-500/25"  },
  High:     { text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  dot: "bg-orange-400",  bar: "bg-orange-400",   badge: "bg-orange-500/15  text-orange-300  border-orange-500/25"  },
  Extreme:  { text: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     dot: "bg-red-400",     bar: "bg-red-400",      badge: "bg-red-500/15     text-red-300     border-red-500/25"     },
};
const THREAT_ORDER = { Extreme: 4, High: 3, Moderate: 2, Low: 1 };
const THREAT_PCT   = { Low: 18, Moderate: 45, High: 72, Extreme: 92 };

const CACHE_KEY        = "disasterai_alerts_cache";
const CUSTOM_CITIES_KEY = "disasterai_custom_cities";
const CACHE_TTL        = 5 * 60 * 1000;

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { cities, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return cities;
  } catch {}
  return null;
}
function writeCache(cities) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ cities, ts: Date.now() })); } catch {}
}
function readCustomCities() {
  try {
    const raw = localStorage.getItem(CUSTOM_CITIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function writeCustomCities(cities) {
  try { localStorage.setItem(CUSTOM_CITIES_KEY, JSON.stringify(cities)); } catch {}
}

function WeatherIcon({ condition }) {
  if (!condition) return <span>🌡</span>;
  const c = condition.toLowerCase();
  if (c.includes("rain") || c.includes("drizzle")) return <span>🌧</span>;
  if (c.includes("storm") || c.includes("thunder")) return <span>⛈</span>;
  if (c.includes("cloud")) return <span>☁️</span>;
  if (c.includes("fog") || c.includes("mist") || c.includes("haze")) return <span>🌫</span>;
  if (c.includes("clear") || c.includes("sunny")) return <span>☀️</span>;
  return <span>🌤</span>;
}

function CityCard({ city, onRemove, isCustom }) {
  const cfg = THREAT_CONFIG[city.threat] || THREAT_CONFIG.Low;
  return (
    <div className={`group relative rounded-2xl border ${cfg.border} bg-gradient-to-br ${cfg.bg} to-transparent p-5 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-200`}>
      {isCustom && (
        <button
          onClick={() => onRemove(city.name)}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-white/[0.08] hover:bg-red-500/20 text-gray-500 hover:text-red-400 flex items-center justify-center text-xs transition-all"
        >✕</button>
      )}

      <div className="flex items-start justify-between gap-3 pr-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-white">{city.name}</p>
            {isCustom && (
              <span className="text-[9px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full">custom</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{city.state}</p>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${city.threat === "High" || city.threat === "Extreme" ? "animate-pulse" : ""}`} />
          {city.threat}
        </span>
      </div>

      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span className="text-xl"><WeatherIcon condition={city.condition} /></span>
          <span className="text-sm text-gray-300">{city.condition || "—"}</span>
        </div>
        <span className="text-xl font-black text-white">{city.temperature}°<span className="text-xs font-normal text-gray-500">C</span></span>
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-gray-600 mb-1.5">
          <span className="uppercase tracking-wider font-semibold">Flood Risk</span>
          <span className={`font-bold ${cfg.text}`}>{city.threat}</span>
        </div>
        <div className="w-full bg-white/[0.06] rounded-full h-1.5">
          <div className={`h-1.5 rounded-full ${cfg.bar}`} style={{ width: `${THREAT_PCT[city.threat] || 18}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: "🌧", label: "Rainfall",  value: `${city.rainfall_mm}mm` },
          { icon: "💧", label: "Humidity",  value: `${city.humidity}%` },
          { icon: "🏞", label: "Discharge", value: city.river_discharge ? `${city.river_discharge}` : "—" },
        ].map((m) => (
          <div key={m.label} className="rounded-lg bg-white/[0.02] border border-white/[0.05] px-2 py-2 text-center">
            <span className="text-sm">{m.icon}</span>
            <p className="text-[10px] text-gray-600 mt-0.5">{m.label}</p>
            <p className="text-xs font-bold text-gray-300">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="relative flex items-center justify-center w-20 h-20">
        <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-500/10 animate-ping" style={{ animationDuration: "1.2s" }} />
        <span className="absolute inline-flex h-14 w-14 rounded-full bg-indigo-500/10 animate-ping" style={{ animationDuration: "1.2s", animationDelay: "0.3s" }} />
        <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/30">
          <span className="text-2xl">📡</span>
        </div>
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-sm font-semibold text-white">Fetching live weather data</p>
        <p className="text-xs text-gray-500">Connecting to Open-Meteo across monitored cities…</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-52 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-shimmer" />
        ))}
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
  { value: "threat",      label: "Threat Level" },
  { value: "rainfall",    label: "Rainfall" },
  { value: "humidity",    label: "Humidity" },
  { value: "temperature", label: "Temperature" },
  { value: "name",        label: "City Name" },
];

/* Geocoding dropdown — shown when user wants to add a city not in the list */
function AddCityPanel({ query, existingNames, onAdd, onClose }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [adding, setAdding]           = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    geocodeCity(query.trim())
      .then(res => { if (!cancelled) setSuggestions(res.data.cities || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query]);

  const handleSelect = async (city) => {
    setAdding(city.name);
    try {
      const res = await fetchCityWeather(city.lat, city.lon, city.name, city.state);
      onAdd(res.data);
      onClose();
    } catch {}
    finally { setAdding(null); }
  };

  return (
    <div className="mt-3 rounded-2xl border border-indigo-500/20 bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <p className="text-xs font-semibold text-indigo-300">Search results for &ldquo;{query}&rdquo;</p>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xs px-2 py-1 rounded-lg hover:bg-white/[0.06] transition-colors">✕ Cancel</button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 px-4 py-5 text-sm text-gray-500">
          <svg className="w-4 h-4 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Looking up cities in India…
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <p className="px-4 py-5 text-sm text-gray-500 text-center">No Indian cities found for &ldquo;{query}&rdquo;</p>
      )}

      {!loading && suggestions.map((city) => {
        const already = existingNames.has(city.name);
        const isAdding = adding === city.name;
        return (
          <button
            key={`${city.name}-${city.lat}`}
            onClick={() => !already && !isAdding && handleSelect(city)}
            disabled={already || !!adding}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm border-b border-white/[0.04] last:border-0 transition-colors ${
              already ? "opacity-40 cursor-default" : "hover:bg-white/[0.06] cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-3 text-left">
              <span className="text-base">📍</span>
              <div>
                <p className="font-semibold text-white">{city.name}</p>
                <p className="text-xs text-gray-500">{city.state}</p>
              </div>
            </div>
            {isAdding ? (
              <svg className="w-4 h-4 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : already ? (
              <span className="text-[10px] text-gray-600 font-medium">Already shown</span>
            ) : (
              <span className="text-[10px] text-indigo-400 font-semibold">+ Add</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function Monitor() {
  const cached = readCache();
  const [defaultCities, setDefaultCities] = useState([]);
  const [customCities,  setCustomCities]  = useState(() => readCustomCities());
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState(false);
  const [lastUpdated,   setLastUpdated]   = useState(null);

  const [search,       setSearch]       = useState("");
  const [threatFilter, setThreatFilter] = useState("All");
  const [sortBy,       setSortBy]       = useState("threat");
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Persist custom cities to localStorage whenever they change
  useEffect(() => { writeCustomCities(customCities); }, [customCities]);

  const load = (background = false) => {
    if (background) setRefreshing(true);
    else { setLoading(true); setError(false); }

    Promise.all([
      fetchAlerts().then(r => r.data.cities),
      new Promise(res => setTimeout(res, background ? 0 : 2000)),
    ])
      .then(([fresh]) => {
        setDefaultCities(fresh);
        writeCache(fresh);
        setLastUpdated(new Date());
        setError(false);
      })
      .catch(() => {
        if (!background) {
          if (cached) { setDefaultCities(cached); setLastUpdated(new Date()); }
          else setError(true);
        }
      })
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { load(false); }, []);

  const handleAddCity = useCallback((cityData) => {
    setCustomCities(prev => {
      if (prev.some(c => c.name === cityData.name)) return prev;
      return [cityData, ...prev];
    });
  }, []);

  const handleRemoveCity = useCallback((name) => {
    setCustomCities(prev => prev.filter(c => c.name !== name));
  }, []);

  const allCities    = useMemo(() => [...customCities, ...defaultCities], [customCities, defaultCities]);
  const existingNames = useMemo(() => new Set(allCities.map(c => c.name)), [allCities]);

  const filtered = useMemo(() => {
    let list = [...allCities];

    // Local text filter — searches name and state
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.state && c.state.toLowerCase().includes(q))
      );
    }

    if (threatFilter !== "All") list = list.filter(c => c.threat === threatFilter);

    list.sort((a, b) => {
      const aCustom = customCities.some(c => c.name === a.name);
      const bCustom = customCities.some(c => c.name === b.name);
      if (aCustom !== bCustom) return aCustom ? -1 : 1;
      switch (sortBy) {
        case "threat":      return (THREAT_ORDER[b.threat] || 0) - (THREAT_ORDER[a.threat] || 0);
        case "rainfall":    return b.rainfall_mm - a.rainfall_mm;
        case "humidity":    return b.humidity - a.humidity;
        case "temperature": return b.temperature - a.temperature;
        case "name":        return a.name.localeCompare(b.name);
        default:            return 0;
      }
    });
    return list;
  }, [allCities, customCities, threatFilter, sortBy, search]);

  const counts = useMemo(() =>
    allCities.reduce((acc, c) => { acc[c.threat] = (acc[c.threat] || 0) + 1; return acc; }, {}),
  [allCities]);

  const noLocalMatch = search.trim().length > 0 && filtered.length === 0;

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 animate-fade-in">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs font-semibold text-indigo-300 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Live Monitoring · Open-Meteo
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">City Weather Monitor</h1>
            <p className="text-gray-500 text-sm mt-2">
              Live flood risk across India — search any city powered by Open-Meteo.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {lastUpdated && (
              <span className="text-xs text-gray-600">
                Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              onClick={() => load(false)}
              disabled={loading || refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass glass-hover text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${refreshing || loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* ── Threat summary ── */}
        {!loading && (
          <div className="flex flex-wrap gap-3 mb-6 animate-fade-in">
            {["Extreme", "High", "Moderate", "Low"].map((level) => {
              const cfg = THREAT_CONFIG[level];
              const count = counts[level] || 0;
              return (
                <button
                  key={level}
                  onClick={() => setThreatFilter(prev => prev === level ? "All" : level)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                    threatFilter === level
                      ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                      : "glass glass-hover text-gray-400 hover:text-white border-white/[0.06]"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  {level}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${count > 0 ? cfg.bg : "bg-white/[0.05]"} font-bold`}>{count}</span>
                </button>
              );
            })}
            {threatFilter !== "All" && (
              <button onClick={() => setThreatFilter("All")} className="text-xs text-gray-500 hover:text-white px-3 py-2 rounded-xl glass glass-hover transition-colors">
                Clear ✕
              </button>
            )}
          </div>
        )}

        {/* ── Search + Sort ── */}
        {!loading && (
          <div className="mb-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search input — filters existing cities */}
              <div className="relative flex-1 max-w-md">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setShowAddPanel(false); }}
                  placeholder="Search by city or state…"
                  className="w-full bg-gray-900/80 border border-white/[0.1] text-white rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(""); setShowAddPanel(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors text-xs"
                  >✕</button>
                )}
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="appearance-none bg-gray-900/60 border border-white/[0.08] text-gray-300 rounded-xl pl-4 pr-9 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>

            {/* "Add city" panel — only shown when search finds no local match */}
            {noLocalMatch && (
              <div className="mt-3">
                {!showAddPanel ? (
                  <button
                    onClick={() => setShowAddPanel(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-sm text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                  >
                    <span className="text-base">🔍</span>
                    <span>Can&rsquo;t find <strong className="text-indigo-200">{search}</strong>? Search Open-Meteo and add it</span>
                    <span className="ml-auto text-xs font-semibold text-indigo-400">+ Add city</span>
                  </button>
                ) : (
                  <AddCityPanel
                    query={search}
                    existingNames={existingNames}
                    onAdd={handleAddCity}
                    onClose={() => setShowAddPanel(false)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Content ── */}
        {loading && <LoadingState />}

        {error && !loading && (
          <div className="flex items-center gap-3 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-medium">Could not fetch live data</p>
              <p className="text-red-400/60 text-xs mt-0.5">Make sure the backend is running on port 8000</p>
            </div>
            <button onClick={() => load(false)} className="ml-auto shrink-0 px-4 py-2 rounded-xl glass glass-hover text-xs font-semibold">Retry</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-xs text-gray-600 mb-5 font-medium">
              {filtered.length} {filtered.length === 1 ? "city" : "cities"} shown
              {customCities.length > 0 && ` · ${customCities.length} custom`}
              {threatFilter !== "All" && ` · filtered: ${threatFilter}`}
              {search.trim() && !noLocalMatch && ` · matching "${search}"`}
            </p>

            {noLocalMatch && !showAddPanel && (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-gray-400 font-semibold">No cities match &ldquo;{search}&rdquo;</p>
                <p className="text-gray-600 text-sm mt-1">Use the button above to search Open-Meteo and add it</p>
              </div>
            )}

            {noLocalMatch && showAddPanel && (
              <div className="text-center py-8 text-gray-600 text-sm">
                Select a city from the panel above to add it to your dashboard.
              </div>
            )}

            {!noLocalMatch && filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-gray-400 font-semibold">No cities match the active filter</p>
                <button onClick={() => setThreatFilter("All")} className="mt-4 px-4 py-2 rounded-xl glass glass-hover text-sm text-gray-400 hover:text-white transition-colors">
                  Clear filter
                </button>
              </div>
            )}

            {filtered.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(city => (
                  <CityCard
                    key={city.name}
                    city={city}
                    isCustom={customCities.some(c => c.name === city.name)}
                    onRemove={handleRemoveCity}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
