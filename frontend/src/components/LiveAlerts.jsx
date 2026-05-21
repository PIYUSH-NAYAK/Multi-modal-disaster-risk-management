import { useEffect, useState } from "react";
import { fetchAlerts } from "../api";

const THREAT_CONFIG = {
  Low:      { bar: "bg-emerald-400", text: "text-emerald-400", badge: "bg-emerald-400/10 border-emerald-400/20", dot: "bg-emerald-400", ring: "ring-emerald-400/20" },
  Moderate: { bar: "bg-yellow-400",  text: "text-yellow-400",  badge: "bg-yellow-400/10  border-yellow-400/20",  dot: "bg-yellow-400",  ring: "ring-yellow-400/20"  },
  High:     { bar: "bg-orange-400",  text: "text-orange-400",  badge: "bg-orange-400/10  border-orange-400/20",  dot: "bg-orange-400",  ring: "ring-orange-400/20"  },
  Extreme:  { bar: "bg-red-400",     text: "text-red-400",     badge: "bg-red-400/10     border-red-400/20",     dot: "bg-red-400",    ring: "ring-red-400/20"     },
};

function WeatherIcon({ condition }) {
  if (!condition) return "🌡";
  const c = condition.toLowerCase();
  if (c.includes("rain") || c.includes("drizzle")) return "🌧";
  if (c.includes("storm") || c.includes("thunder")) return "⛈";
  if (c.includes("cloud")) return "☁️";
  if (c.includes("fog") || c.includes("mist") || c.includes("haze")) return "🌫";
  if (c.includes("snow")) return "❄️";
  if (c.includes("clear") || c.includes("sunny")) return "☀️";
  return "🌤";
}

function CityCard({ city }) {
  const cfg = THREAT_CONFIG[city.threat] || THREAT_CONFIG.Low;
  return (
    <div className={`group relative flex gap-4 px-5 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200`}>
      {/* Threat color bar */}
      <div className={`w-0.5 self-stretch rounded-full shrink-0 ${cfg.bar} opacity-70`} />

      {/* City + weather info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white">{city.name}</p>
              <span className="text-[10px] text-gray-600 font-medium">{city.state}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
              <span><WeatherIcon condition={city.condition} /></span>
              {city.condition} · {city.temperature}°C
            </p>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.badge} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${city.threat === "High" || city.threat === "Extreme" ? "animate-pulse" : ""}`} />
            {city.threat}
          </span>
        </div>

        {/* Metrics row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <span className="text-blue-400">🌧</span>
            <span className="text-gray-300 font-medium">{city.rainfall_mm}</span>mm rain
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <span>💧</span>
            <span className="text-gray-300 font-medium">{city.humidity}</span>% humidity
          </span>
          {city.river_discharge && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <span className="text-cyan-400">🏞</span>
              <span className="text-gray-300 font-medium">{city.river_discharge}</span>
              <span>m³/s</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex gap-4 px-5 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
      <div className="w-0.5 self-stretch rounded-full bg-white/[0.06] animate-shimmer" />
      <div className="flex-1 space-y-2.5">
        <div className="flex justify-between">
          <div className="h-3.5 w-24 rounded-md bg-white/[0.06] animate-shimmer" />
          <div className="h-5 w-16 rounded-full bg-white/[0.06] animate-shimmer" />
        </div>
        <div className="h-3 w-36 rounded-md bg-white/[0.04] animate-shimmer" />
        <div className="flex gap-4">
          <div className="h-3 w-16 rounded-md bg-white/[0.04] animate-shimmer" />
          <div className="h-3 w-16 rounded-md bg-white/[0.04] animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

const CACHE_KEY = "disasterai_alerts_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 min

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

export default function LiveAlerts() {
  const cached = readCache();
  const [cities, setCities]         = useState([]);
  const [loading, setLoading]       = useState(true);   // always show loader for 2s
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = (background = false) => {
    if (background) { setRefreshing(true); }
    else { setLoading(true); setError(false); }

    const minDelay = background ? 0 : 2000;

    Promise.all([
      fetchAlerts().then(r => r.data.cities),
      new Promise(res => setTimeout(res, minDelay)),
    ])
      .then(([fresh]) => {
        setCities(fresh);
        writeCache(fresh);
        setLastUpdated(new Date());
        setError(false);
      })
      .catch(() => {
        if (!background) {
          // show cached on error if available
          if (cached) { setCities(cached); setLastUpdated(new Date()); }
          else setError(true);
        }
      })
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => {
    load(false);
    const interval = setInterval(() => load(true), CACHE_TTL);
    return () => clearInterval(interval);
  }, []);

  const highCount = cities.filter((c) => c.threat === "High" || c.threat === "Extreme").length;
  const threatCounts = cities.reduce((acc, c) => { acc[c.threat] = (acc[c.threat] || 0) + 1; return acc; }, {});

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Live Monitoring</p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">City Weather Alerts</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time flood risk across 10 major Indian cities</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Threat summary pills */}
          {!loading && !error && Object.entries(THREAT_CONFIG).map(([level, cfg]) =>
            threatCounts[level] ? (
              <div key={level} className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg.badge} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {threatCounts[level]} {level}
              </div>
            ) : null
          )}

          {/* Refresh / last updated */}
          <button
            onClick={() => load(false)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass glass-hover text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className={`w-3 h-3 ${loading || refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {lastUpdated ? lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Refresh"}
          </button>
        </div>
      </div>

      {/* High risk banner */}
      {highCount > 0 && !loading && (
        <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm">
          <span className="text-lg">⚠️</span>
          <span className="font-medium">{highCount} {highCount === 1 ? "city" : "cities"} at elevated flood risk</span>
          <span className="text-orange-400/60 text-xs ml-auto hidden sm:block">High or Extreme threat level detected</span>
        </div>
      )}

      {/* Grid */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          {/* Radar ping */}
          <div className="relative flex items-center justify-center w-20 h-20">
            <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-500/10 animate-ping" style={{ animationDuration: "1.2s" }} />
            <span className="absolute inline-flex h-14 w-14 rounded-full bg-indigo-500/10 animate-ping" style={{ animationDuration: "1.2s", animationDelay: "0.3s" }} />
            <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/30">
              <span className="text-2xl">📡</span>
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-1.5">
            <p className="text-sm font-semibold text-white">Fetching live weather data</p>
            <p className="text-xs text-gray-500">Connecting to Open-Meteo across 10 cities…</p>
          </div>

          {/* Animated dots row */}
          <div className="flex items-center gap-2">
            {["Patna", "Mumbai", "Kolkata", "Chennai", "Delhi"].map((name, i) => (
              <div
                key={name}
                className="flex flex-col items-center gap-1.5 animate-pulse"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: "1.2s" }}
              >
                <div className="w-2 h-2 rounded-full bg-indigo-400/60" />
                <span className="text-[9px] text-gray-600">{name}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1 h-1 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-[9px] text-gray-600">+5 more</span>
            </div>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-3 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-medium">Could not fetch live alerts</p>
            <p className="text-red-400/60 text-xs mt-0.5">Make sure the backend is running on port 8000</p>
          </div>
          <button onClick={load} className="ml-auto shrink-0 px-3 py-1.5 rounded-lg glass glass-hover text-xs font-medium text-red-300 hover:text-white transition-colors">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cities.slice(0, 10).map((city) => <CityCard key={city.name} city={city} />)}
        </div>
      )}
    </section>
  );
}
