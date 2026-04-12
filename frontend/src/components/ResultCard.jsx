const colorMap = {
  green:  { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-300", glow: "shadow-emerald-500/10" },
  yellow: { bg: "bg-yellow-500/10",  border: "border-yellow-500/30",  text: "text-yellow-400",  badge: "bg-yellow-500/20 text-yellow-300",  glow: "shadow-yellow-500/10" },
  orange: { bg: "bg-orange-500/10",  border: "border-orange-500/30",  text: "text-orange-400",  badge: "bg-orange-500/20 text-orange-300",  glow: "shadow-orange-500/10" },
  red:    { bg: "bg-red-500/10",     border: "border-red-500/30",     text: "text-red-400",     badge: "bg-red-500/20 text-red-300",     glow: "shadow-red-500/10" },
};

export default function ResultCard({ result }) {
  if (!result) return null;

  const c = colorMap[result.risk_color] || colorMap.yellow;

  return (
    <div className={`mt-8 rounded-2xl border ${c.border} ${c.bg} backdrop-blur-sm shadow-lg ${c.glow} animate-result-entrance`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
            <svg className={`w-5 h-5 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-white text-lg font-bold">Prediction Result</h3>
        </div>
        <span className={`${c.badge} text-xs font-bold px-3 py-1.5 rounded-full`}>
          {result.risk_level}
        </span>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 gap-3 p-6">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Predicted Magnitude</p>
          <p className={`text-3xl sm:text-4xl font-bold ${c.text}`}>{result.predicted_magnitude}</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Risk Level</p>
          <p className={`text-3xl sm:text-4xl font-bold ${c.text}`}>{result.risk_level}</p>
        </div>
      </div>

      {/* Message */}
      <div className="mx-6 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
        <p className="text-gray-300 text-sm leading-relaxed">{result.message}</p>
      </div>

      {/* Input summary */}
      <div className="p-6 pt-4">
        <p className="text-[11px] uppercase tracking-wider text-gray-600 mb-3">Input Parameters</p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(result.inputs).map(([key, val]) => (
            <div key={key} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">{key}</p>
              <p className="text-white text-sm font-semibold">{val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
