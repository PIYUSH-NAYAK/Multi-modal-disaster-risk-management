const colors = {
  Low:      { bar: "bg-green-500",  text: "text-green-400",  bg: "bg-green-900/30"  },
  Moderate: { bar: "bg-yellow-500", text: "text-yellow-400", bg: "bg-yellow-900/30" },
  High:     { bar: "bg-orange-500", text: "text-orange-400", bg: "bg-orange-900/30" },
  Extreme:  { bar: "bg-red-500",    text: "text-red-400",    bg: "bg-red-900/30"    },
};

export default function RiskGauge({ level, pct, label }) {
  const c = colors[level] || colors.Moderate;

  return (
    <div className={`rounded-xl p-6 border border-gray-700 ${c.bg} text-center`}>
      <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-6xl font-black mb-1 ${c.text}`}>{pct}%</p>
      <p className={`text-2xl font-bold mb-4 ${c.text}`}>{level} Risk</p>

      {/* Bar */}
      <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
        <div
          className={`h-4 rounded-full transition-all duration-1000 ${c.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>Low</span><span>Moderate</span><span>High</span><span>Extreme</span>
      </div>
    </div>
  );
}
