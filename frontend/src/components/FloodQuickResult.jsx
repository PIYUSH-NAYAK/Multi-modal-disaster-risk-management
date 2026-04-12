import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const riskColors = {
  green:  { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", bar: "bg-emerald-500", badge: "bg-emerald-500/20 text-emerald-300" },
  yellow: { bg: "bg-yellow-500/10",  border: "border-yellow-500/30",  text: "text-yellow-400",  bar: "bg-yellow-500",  badge: "bg-yellow-500/20 text-yellow-300"  },
  orange: { bg: "bg-orange-500/10",  border: "border-orange-500/30",  text: "text-orange-400",  bar: "bg-orange-500",  badge: "bg-orange-500/20 text-orange-300"  },
  red:    { bg: "bg-red-500/10",     border: "border-red-500/30",     text: "text-red-400",     bar: "bg-red-500",     badge: "bg-red-500/20 text-red-300"     },
};

const riskEmoji = { Low: "✅", Moderate: "⚠️", High: "🚨", Extreme: "🆘" };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value} mm</p>)}
    </div>
  );
};

export default function FloodQuickResult({ result }) {
  if (!result) return null;
  const c = riskColors[result.overall_color] || riskColors.yellow;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Big risk header */}
      <div className={`rounded-2xl border ${c.border} ${c.bg} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{riskEmoji[result.overall_risk]}</span>
            <div>
              <p className="text-gray-400 text-sm">{result.state} · {result.month}</p>
              <p className={`text-3xl font-black ${c.text}`}>{result.overall_pct}%</p>
              <p className={`text-lg font-bold ${c.text}`}>{result.overall_risk} Flood Risk</p>
            </div>
          </div>
          <span className={`text-sm font-bold px-4 py-2 rounded-full ${c.badge}`}>
            {result.overall_risk}
          </span>
        </div>
        <div className="w-full bg-white/[0.06] rounded-full h-2.5 overflow-hidden">
          <div className={`h-2.5 rounded-full ${c.bar} transition-all duration-1000 ease-out`} style={{ width: `${result.overall_pct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-600 mt-1.5">
          <span>Low</span><span>Moderate</span><span>High</span><span>Extreme</span>
        </div>
      </div>

      {/* Plain message */}
      <div className={`rounded-xl border ${c.border} ${c.bg} px-5 py-4`}>
        <p className="text-gray-200 text-sm leading-relaxed">{result.message}</p>
      </div>

      {/* Stats + Chart side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Stats */}
        <div className="space-y-3">
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Quick Stats</p>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Avg Rainfall in {result.month}</span>
                  <span className="text-white font-bold">{result.avg_rainfall} mm</span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.min((result.avg_rainfall / 500) * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Historical Flood Rate</span>
                  <span className={`font-bold ${result.flood_frequency_pct >= 60 ? "text-orange-400" : result.flood_frequency_pct >= 40 ? "text-yellow-400" : "text-emerald-400"}`}>
                    {result.flood_frequency_pct}%
                  </span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${result.flood_frequency_pct >= 60 ? "bg-orange-500" : result.flood_frequency_pct >= 40 ? "bg-yellow-500" : "bg-emerald-500"}`}
                    style={{ width: `${result.flood_frequency_pct}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-gray-400 text-sm">Season</span>
                <span className={`font-semibold text-sm ${result.is_monsoon ? "text-blue-400" : "text-gray-400"}`}>
                  {result.is_monsoon ? "🌧️ Monsoon" : "☀️ Dry season"}
                </span>
              </div>
            </div>
          </div>

          {/* What to do */}
          {result.recommendations?.length > 0 && (
            <div className={`glass rounded-2xl p-5 border ${c.border}`}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">What to do</p>
              <ul className="space-y-1.5">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className={`mt-0.5 font-bold shrink-0 ${c.text}`}>→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Chart */}
        {result.monthly_chart?.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Typical Monthly Rainfall</p>
            <p className="text-xs text-gray-600 mb-4">{result.state} — highlighted: {result.month}</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={result.monthly_chart} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "#4b5563", fontSize: 9 }} tickFormatter={(v) => v.slice(0, 3)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4b5563", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="actual" name="Avg (mm)" fill="#6366f1" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
