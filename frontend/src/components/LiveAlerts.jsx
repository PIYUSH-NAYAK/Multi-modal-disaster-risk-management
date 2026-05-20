import { useEffect, useState } from "react";
import { fetchAlerts } from "../api";

const THREAT_STYLES = {
  Low:      { bar: "bg-emerald-400", text: "text-emerald-400", badge: "bg-emerald-400/10 border-emerald-400/20" },
  Moderate: { bar: "bg-yellow-400",  text: "text-yellow-400",  badge: "bg-yellow-400/10  border-yellow-400/20"  },
  High:     { bar: "bg-orange-400",  text: "text-orange-400",  badge: "bg-orange-400/10  border-orange-400/20"  },
  Extreme:  { bar: "bg-red-400",     text: "text-red-400",     badge: "bg-red-400/10     border-red-400/20"     },
};

function CityCard({ city }) {
  const style = THREAT_STYLES[city.threat] || THREAT_STYLES.Low;
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all duration-200">
      {/* Threat bar */}
      <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: "transparent" }}>
        <div className={`w-1 h-full rounded-full ${style.bar}`} />
      </div>

      {/* City info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-white truncate">{city.name}</p>
          <span className="text-[10px] text-gray-500 truncate">{city.state}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>🌧 {city.rainfall_mm}mm</span>
          <span>💧 {city.humidity}%</span>
          {city.river_discharge && <span>🏞 {city.river_discharge} m³/s</span>}
        </div>
      </div>

      {/* Condition + threat */}
      <div className="text-right shrink-0">
        <p className="text-xs text-gray-400 mb-1">{city.condition} · {city.temperature}°C</p>
        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge} ${style.text}`}>
          {city.threat}
        </span>
      </div>
    </div>
  );
}

export default function LiveAlerts() {
  const [cities, setCities]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = () => {
    setLoading(true);
    setError(false);
    fetchAlerts()
      .then((res) => {
        setCities(res.data.cities);
        setLastUpdated(new Date());
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  const highCount = cities.filter((c) => c.threat === "High" || c.threat === "Extreme").length;

  return (
    <section className="max-w-6xl mx-auto px-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Live Monitoring</p>
          </div>
          <h2 className="text-2xl font-bold text-white">City Weather Alerts</h2>
        </div>
        <div className="text-right">
          {highCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 mb-2">
              ⚠ {highCount} city{highCount > 1 ? "ies" : ""} at elevated risk
            </div>
          )}
          {lastUpdated && (
            <p className="text-[11px] text-gray-600">
              Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <span>⚠</span> Could not fetch live alerts. Is the backend running?
          <button onClick={load} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cities.map((city) => <CityCard key={city.name} city={city} />)}
        </div>
      )}
    </section>
  );
}
