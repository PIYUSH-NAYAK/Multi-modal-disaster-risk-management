const colorMap = {
  green:  { border: "border-green-700",  bg: "bg-green-900/20",  text: "text-green-400",  badge: "bg-green-600"  },
  yellow: { border: "border-yellow-700", bg: "bg-yellow-900/20", text: "text-yellow-400", badge: "bg-yellow-600" },
  orange: { border: "border-orange-700", bg: "bg-orange-900/20", text: "text-orange-400", badge: "bg-orange-600" },
  red:    { border: "border-red-700",    bg: "bg-red-900/20",    text: "text-red-400",    badge: "bg-red-600"    },
};

const icons = {
  tabular:    "🌧️",
  timeseries: "📈",
  geospatial: "🌍",
};

export default function ModalCards({ modals, weights }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-300 mb-3">Modal Breakdown</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(modals).map(([key, m]) => {
          const c = colorMap[m.color] || colorMap.yellow;
          return (
            <div key={key} className={`rounded-xl border p-4 ${c.border} ${c.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icons[key]}</span>
                <span className={`text-xs text-white px-2 py-0.5 rounded-full font-semibold ${c.badge}`}>
                  {m.risk}
                </span>
              </div>
              <p className="text-white font-semibold text-sm mb-1">{m.name}</p>
              <p className={`text-3xl font-black ${c.text}`}>{m.pct}%</p>
              <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                <div className={`h-2 rounded-full ${c.badge}`} style={{ width: `${m.pct}%` }} />
              </div>
              <p className="text-gray-500 text-xs mt-2">{m.description}</p>
              <p className="text-gray-600 text-xs mt-1">Weight: {(weights[key] * 100).toFixed(0)}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
