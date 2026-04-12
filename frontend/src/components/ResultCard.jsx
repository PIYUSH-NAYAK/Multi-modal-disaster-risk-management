const colorMap = {
  green:  { bg: "bg-green-900",  border: "border-green-500",  text: "text-green-400",  badge: "bg-green-500" },
  yellow: { bg: "bg-yellow-900", border: "border-yellow-500", text: "text-yellow-400", badge: "bg-yellow-500" },
  orange: { bg: "bg-orange-900", border: "border-orange-500", text: "text-orange-400", badge: "bg-orange-500" },
  red:    { bg: "bg-red-900",    border: "border-red-500",    text: "text-red-400",    badge: "bg-red-500" },
};

export default function ResultCard({ result }) {
  if (!result) return null;

  const c = colorMap[result.risk_color] || colorMap.yellow;

  return (
    <div className={`mt-8 p-6 rounded-xl border-2 ${c.bg} ${c.border} animate-pulse-once`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-xl font-bold">Prediction Result</h3>
        <span className={`${c.badge} text-white text-sm font-bold px-3 py-1 rounded-full`}>
          {result.risk_level}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Predicted Magnitude</p>
          <p className={`text-4xl font-bold ${c.text}`}>{result.predicted_magnitude}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Risk Level</p>
          <p className={`text-4xl font-bold ${c.text}`}>{result.risk_level}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-gray-300 text-sm">{result.message}</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {Object.entries(result.inputs).map(([key, val]) => (
          <div key={key} className="bg-gray-800 rounded-lg p-2">
            <p className="text-gray-500 text-xs capitalize">{key}</p>
            <p className="text-white text-sm font-semibold">{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
