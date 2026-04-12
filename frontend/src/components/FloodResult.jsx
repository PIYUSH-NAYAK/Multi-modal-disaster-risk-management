import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const riskColors = {
  green:  { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", bar: "bg-emerald-500", badge: "bg-emerald-500/20 text-emerald-300" },
  yellow: { bg: "bg-yellow-500/10",  border: "border-yellow-500/30",  text: "text-yellow-400",  bar: "bg-yellow-500",  badge: "bg-yellow-500/20 text-yellow-300"  },
  orange: { bg: "bg-orange-500/10",  border: "border-orange-500/30",  text: "text-orange-400",  bar: "bg-orange-500",  badge: "bg-orange-500/20 text-orange-300"  },
  red:    { bg: "bg-red-500/10",     border: "border-red-500/30",     text: "text-red-400",     bar: "bg-red-500",     badge: "bg-red-500/20 text-red-300"     },
};

const factorColors = {
  red:    "text-red-400 bg-red-500/10 border-red-500/20",
  orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  green:  "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const modalIcons = { tabular: "🌧️", timeseries: "📈", geospatial: "🌍" };

function WaterLevelBar({ water_level, warning_level, danger_level }) {
  const max = Math.max(danger_level * 1.3, water_level * 1.1, 1);
  const pct       = Math.min((water_level / max) * 100, 100);
  const warnPct   = Math.min((warning_level / max) * 100, 100);
  const dangerPct = Math.min((danger_level  / max) * 100, 100);
  const barColor  = water_level >= danger_level ? "bg-red-500" : water_level >= warning_level ? "bg-orange-500" : "bg-emerald-500";

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>Water Level: <span className="font-bold text-white">{water_level}m</span></span>
        <span className="text-gray-500">Danger: {danger_level}m</span>
      </div>
      <div className="relative w-full bg-white/[0.06] rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
        <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/60" style={{ left: `${warnPct}%` }} />
        <div className="absolute top-0 bottom-0 w-0.5 bg-red-500/60"    style={{ left: `${dangerPct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 mt-1">
        <span>0m</span>
        <span className="text-yellow-500/70">⚠ {warning_level}m</span>
        <span className="text-red-500/70">🔴 {danger_level}m</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value} mm</p>)}
    </div>
  );
};

export default function FloodResult({ result }) {
  if (!result) return null;
  const c = riskColors[result.overall_color] || riskColors.yellow;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header row */}
      <div className={`rounded-2xl border ${c.border} ${c.bg} px-6 py-5 flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center`}>
            <span className={`text-4xl font-black ${c.text}`}>{result.overall_pct}%</span>
          </div>
          <div>
            <p className="text-white text-xl font-bold">{result.overall_risk} Flood Risk</p>
            <p className="text-gray-400 text-sm">{result.state} · {result.month}</p>
            <div className="w-48 bg-white/[0.06] rounded-full h-1.5 mt-2">
              <div className={`h-1.5 rounded-full ${c.bar} transition-all duration-1000`} style={{ width: `${result.overall_pct}%` }} />
            </div>
          </div>
        </div>
        <span className={`text-sm font-bold px-4 py-2 rounded-full ${c.badge}`}>{result.overall_risk}</span>
      </div>

      {/* Modal breakdown — 3 cards */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Multi-Modal Breakdown · Late Fusion</p>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(result.modal_predictions).map(([key, m]) => {
            const mc = riskColors[m.color] || riskColors.yellow;
            return (
              <div key={key} className={`rounded-xl border ${mc.border} ${mc.bg} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl">{modalIcons[key]}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mc.badge}`}>{m.risk}</span>
                </div>
                <p className="text-white font-semibold text-sm mb-1">{m.name}</p>
                <p className={`text-3xl font-black ${mc.text} mb-2`}>{m.pct}%</p>
                <div className="w-full bg-white/[0.06] rounded-full h-1">
                  <div className={`h-1 rounded-full ${mc.bar}`} style={{ width: `${m.pct}%` }} />
                </div>
                <p className="text-gray-500 text-[10px] mt-2 leading-relaxed">{m.description}</p>
                <p className="text-gray-600 text-[10px] mt-1">Weight: {(result.fusion_weights[key] * 100).toFixed(0)}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rainfall + River stats side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Rainfall */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Rainfall Analysis</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Actual", value: `${result.rainfall_stats.actual} mm`, highlight: false },
              { label: "Normal", value: `${result.rainfall_stats.normal} mm`, highlight: false },
              {
                label: "Deviation",
                value: `${result.rainfall_stats.deviation > 0 ? "+" : ""}${result.rainfall_stats.deviation}%`,
                highlight: true,
                positive: result.rainfall_stats.deviation > 0,
              },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{s.label}</p>
                <p className={`font-bold text-sm ${s.highlight ? (s.positive ? "text-orange-400" : "text-emerald-400") : "text-white"}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          {result.rainfall_stats.is_monsoon && (
            <p className="text-xs text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
              🌧️ Peak monsoon month — elevated risk period
            </p>
          )}
        </div>

        {/* River */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">River Water Level</p>
          <WaterLevelBar
            water_level={result.river_stats.water_level}
            warning_level={result.river_stats.warning_level}
            danger_level={result.river_stats.danger_level}
          />
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Warning", value: `${result.river_stats.warning_level}m`, exceeded: result.river_stats.above_warning && !result.river_stats.above_danger },
              { label: "Danger",  value: `${result.river_stats.danger_level}m`,  exceeded: result.river_stats.above_danger },
            ].map((r) => (
              <div key={r.label} className={`rounded-lg px-3 py-2 border text-xs ${r.exceeded ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-white/[0.03] border-white/[0.06] text-gray-400"}`}>
                {r.label}: <span className="font-bold">{r.value}</span>
                {r.exceeded && <span className="ml-1 font-bold">↑ Exceeded</span>}
              </div>
            ))}
          </div>
          {result.river_stats.station_count > 0 && (
            <p className="text-[10px] text-gray-600">{result.river_stats.station_count} gauge stations monitored</p>
          )}
        </div>
      </div>

      {/* Chart + Key factors side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Monthly chart */}
        {result.monthly_chart?.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Monthly Rainfall — {result.state}</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={result.monthly_chart} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "#4b5563", fontSize: 9 }} tickFormatter={(v) => v.slice(0, 3)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4b5563", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "10px", color: "#6b7280" }} />
                <Bar dataKey="actual" name="Actual (mm)" fill="#6366f1" radius={[2, 2, 0, 0]} />
                <Bar dataKey="normal" name="Normal (mm)" fill="rgba(255,255,255,0.08)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Key factors */}
        {result.key_factors?.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Key Risk Factors</p>
            <div className="space-y-2">
              {result.key_factors.map((f, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs rounded-lg border px-3 py-2.5 ${factorColors[f.level] || factorColors.orange}`}>
                  <span>{f.level === "red" ? "🔴" : f.level === "orange" ? "🟠" : "🟢"}</span>
                  <span className="leading-relaxed">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Geo stats + Recommendations side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Historical Flood Profile</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Flood Rate</p>
              <p className="text-2xl font-bold text-indigo-400">{result.geo_stats.flood_frequency_pct}%</p>
              <p className="text-[10px] text-gray-600 mt-1">of years</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Monsoon Avg</p>
              <p className="text-2xl font-bold text-indigo-400">{result.geo_stats.historical_monsoon_avg}<span className="text-sm">mm</span></p>
              <p className="text-[10px] text-gray-600 mt-1">Jun–Sep</p>
            </div>
          </div>
        </div>

        {result.recommendations?.length > 0 && (
          <div className={`glass rounded-2xl p-5 border ${c.border}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Recommended Actions</p>
            <ul className="space-y-1.5">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className={`mt-0.5 font-bold ${c.text}`}>→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Message */}
      <div className={`rounded-xl border ${c.border} ${c.bg} px-5 py-3`}>
        <p className="text-gray-300 text-sm">{result.message}</p>
      </div>
    </div>
  );
}
