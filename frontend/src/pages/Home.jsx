import { useNavigate } from "react-router-dom";

const disasters = [
  {
    type: "earthquake",
    icon: "🌋",
    title: "Earthquake",
    desc: "Predict earthquake magnitude based on location and depth using USGS India seismic data.",
    stats: "7,051 records",
    gradient: "from-orange-500/20 to-amber-500/10",
    border: "border-orange-500/20 hover:border-orange-500/40",
    iconBg: "bg-orange-500/10",
    accent: "text-orange-400",
    available: true,
  },
  {
    type: "flood",
    icon: "🌊",
    title: "Flood",
    desc: "Assess flood risk using rainfall, river discharge, water level and terrain data.",
    stats: "10,000 records",
    gradient: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/20 hover:border-blue-500/40",
    iconBg: "bg-blue-500/10",
    accent: "text-blue-400",
    available: true,
  },
  {
    type: "cyclone",
    icon: "🌀",
    title: "Cyclone",
    desc: "Predict cyclone intensity from atmospheric pressure, wind speed and sea surface temperature.",
    stats: "Coming soon",
    gradient: "from-purple-500/20 to-violet-500/10",
    border: "border-purple-500/20 hover:border-purple-500/40",
    iconBg: "bg-purple-500/10",
    accent: "text-purple-400",
    available: false,
  },
];

const stats = [
  { label: "Earthquake Records", value: "7,051", icon: "📊" },
  { label: "Flood Records", value: "2,19,277", icon: "📈" },
  { label: "ML Models", value: "5", icon: "🤖" },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-glow" />
        <div className="absolute inset-0 bg-grid" />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="animate-fade-in-down inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-gray-300 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI-Powered Disaster Intelligence
            </div>

            {/* Heading */}
            <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-balance">
              Multi-Modal Disaster
              <br />
              <span className="gradient-text">Risk Intelligence</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in-up text-gray-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              Predict disaster risk across India using machine learning models trained on
              real historical seismic, flood, and cyclone records.
            </p>

            {/* CTA buttons */}
            <div className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/predict")}
                className="group relative inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5"
              >
                Start Predicting
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <button
                onClick={() => navigate("/about")}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white font-medium px-6 py-3.5 rounded-xl glass glass-hover"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Disaster Modules */}
      <section className="relative max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-3">
            Modules
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            Disaster Risk Models
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {disasters.map((d, i) => (
            <div
              key={d.type}
              role={d.available ? "button" : undefined}
              tabIndex={d.available ? 0 : undefined}
              className={`group relative rounded-2xl border bg-gradient-to-br ${d.gradient} ${d.border} p-6 flex flex-col gap-4 transition-all duration-300 ${
                d.available
                  ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                  : "opacity-50 cursor-default"
              }`}
              onClick={() => d.available && navigate(`/predict?type=${d.type}`)}
              onKeyDown={(e) => d.available && e.key === "Enter" && navigate(`/predict?type=${d.type}`)}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${d.iconBg} flex items-center justify-center text-2xl`}>
                {d.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">{d.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{d.desc}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <span className="text-xs text-gray-500 font-medium">{d.stats}</span>
                {d.available ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Live
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-600">Coming Soon</span>
                )}
              </div>

              {/* Hover arrow for available cards */}
              {d.available && (
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg className={`w-5 h-5 ${d.accent}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl mb-3">{s.icon}</div>
                <p className="text-3xl sm:text-4xl font-bold text-white mb-2">{s.value}</p>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
