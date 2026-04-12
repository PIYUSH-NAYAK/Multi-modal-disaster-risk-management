import { useNavigate } from "react-router-dom";

const disasters = [
  {
    type: "earthquake",
    icon: "🌋",
    title: "Earthquake",
    desc: "Predict earthquake magnitude based on location and depth using USGS India seismic data.",
    stats: "7,051 records",
    color: "from-orange-900 to-orange-800",
    border: "border-orange-700",
    available: true,
  },
  {
    type: "flood",
    icon: "🌊",
    title: "Flood",
    desc: "Assess flood risk using rainfall, river discharge, water level and terrain data.",
    stats: "10,000 records",
    color: "from-blue-900 to-blue-800",
    border: "border-blue-700",
    available: false,
  },
  {
    type: "cyclone",
    icon: "🌀",
    title: "Cyclone",
    desc: "Predict cyclone intensity from atmospheric pressure, wind speed and sea surface temperature.",
    stats: "Coming soon",
    color: "from-purple-900 to-purple-800",
    border: "border-purple-700",
    available: false,
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="text-center py-20 px-6">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Multi-Modal Disaster Risk
          <br />Intelligence System
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          AI-powered disaster risk prediction for India using real historical data.
          Built with Random Forest ML models trained on verified seismic, flood and cyclone records.
        </p>
        <button
          onClick={() => navigate("/predict")}
          className="mt-8 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
        >
          Start Predicting →
        </button>
      </div>

      {/* Disaster Cards */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-300">
          Disaster Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {disasters.map((d) => (
            <div
              key={d.type}
              className={`bg-gradient-to-br ${d.color} border ${d.border} rounded-xl p-6 flex flex-col gap-3 ${
                d.available ? "cursor-pointer hover:scale-105 transition-transform" : "opacity-60"
              }`}
              onClick={() => d.available && navigate(`/predict?type=${d.type}`)}
            >
              <div className="text-4xl">{d.icon}</div>
              <h3 className="text-xl font-bold">{d.title}</h3>
              <p className="text-gray-300 text-sm flex-1">{d.desc}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{d.stats}</span>
                {d.available ? (
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">Live</span>
                ) : (
                  <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded-full">Soon</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-t border-gray-800 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center px-6">
          {[
            { label: "Earthquake Records", value: "7,051" },
            { label: "Flood Records", value: "10,000" },
            { label: "ML Models", value: "3" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-blue-400">{s.value}</p>
              <p className="text-gray-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
