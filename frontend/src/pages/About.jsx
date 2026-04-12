const datasets = [
  { name: "Earthquakes_India_Master.csv", rows: "7,051", source: "USGS + Kaggle", disaster: "Earthquake", icon: "🌋" },
  { name: "flood_risk_dataset_india.csv", rows: "10,000", source: "Kaggle", disaster: "Flood — Tabular", icon: "🌊" },
  { name: "daily-rainfall-at-state-level.csv", rows: "2,04,876", source: "IMD", disaster: "Flood — Time-Series", icon: "📈" },
  { name: "Rainfall_Data_LL.csv + metadata_indofloods.csv", rows: "4,187 + 214", source: "IMD + IWRIS", disaster: "Flood — Geospatial", icon: "🌍" },
];

const models = [
  { name: "Random Forest Regressor", disaster: "Earthquake", r2: "0.356", mae: "0.358", features: "latitude, longitude, depth", status: "Live", icon: "🌋" },
  { name: "RF Classifier — Hydro-Met", disaster: "Flood (Modal 1)", r2: "—", mae: "—", features: "rainfall, humidity, water level, soil & land type", status: "Live", icon: "🌊" },
  { name: "RF Classifier — Time-Series", disaster: "Flood (Modal 2)", r2: "—", mae: "—", features: "daily rainfall deviation, monsoon patterns, 7d/30d rolling", status: "Live", icon: "📈" },
  { name: "RF Classifier — Geospatial", disaster: "Flood (Modal 3)", r2: "—", mae: "—", features: "lat/lon, river basins, annual rainfall, historical flood freq", status: "Live", icon: "🌍" },
  { name: "Random Forest Classifier", disaster: "Cyclone", r2: "—", mae: "—", features: "wind speed, pressure, temperature", status: "Soon", icon: "🌀" },
];

const techStack = [
  { layer: "ML", tech: "scikit-learn, pandas, numpy — 5 RF models", icon: "🧠" },
  { layer: "Backend", tech: "FastAPI, Uvicorn, joblib — Late Fusion API", icon: "⚡" },
  { layer: "Frontend", tech: "React 19, Vite, Tailwind CSS, Recharts", icon: "🎨" },
  { layer: "HTTP", tech: "Axios, REST API", icon: "🔌" },
];

function SectionHeader({ label, title }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">{label}</p>
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
  );
}

export default function About() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-glow pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 py-16 sm:py-20">
        {/* Page Header */}
        <div className="mb-14 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-gray-400 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Project Documentation
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            About the Project
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Multi-Modal Disaster Risk Intelligence System — built as a 6th Semester Mini Project.
          </p>
        </div>

        {/* Overview */}
        <section className="mb-14 animate-fade-in-up">
          <SectionHeader label="Overview" title="What is DisasterAI?" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-5 sm:col-span-2">
              <p className="text-gray-300 text-sm leading-relaxed">
                This system uses machine learning to predict disaster risk across Earthquake, Flood,
                and Cyclone hazards for locations within India. Each hazard module is trained on real
                historical datasets and exposed through a REST API built with FastAPI. The frontend
                is built with React and Vite. Flood prediction uses a multi-modal late-fusion approach
                combining three independently trained Random Forest classifiers.
              </p>
            </div>
            <div className="glass rounded-2xl p-5 flex flex-col gap-3">
              {[
                { label: "Disaster Types", value: "3" },
                { label: "ML Models", value: "5" },
                { label: "Total Records", value: "2.3L+" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">{s.label}</span>
                  <span className="text-indigo-400 font-bold text-lg">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Datasets */}
        <section className="mb-14 animate-fade-in-up">
          <SectionHeader label="Data" title="Datasets Used" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {datasets.map((d) => (
              <div key={d.name} className="glass glass-hover rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-lg shrink-0">
                    {d.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white text-sm font-semibold">{d.name}</p>
                        <p className="text-gray-500 text-xs mt-1">Source: {d.source}</p>
                        <p className="text-gray-600 text-xs mt-0.5">{d.disaster}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-indigo-400 text-lg font-bold">{d.rows}</p>
                        <p className="text-gray-600 text-[11px] uppercase tracking-wider">rows</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Models */}
        <section className="mb-14 animate-fade-in-up">
          <SectionHeader label="Models" title="Machine Learning Models" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {models.map((m) => (
              <div key={m.disaster} className="glass glass-hover rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-base shrink-0">
                    {m.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white font-semibold text-sm">{m.disaster}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        m.status === "Live"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-white/[0.04] text-gray-500"
                      }`}>
                        {m.status === "Live" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 align-middle" />}
                        {m.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-gray-400 text-xs"><span className="text-gray-600">Algorithm:</span> {m.name}</p>
                  <p className="text-gray-400 text-xs"><span className="text-gray-600">Features:</span> {m.features}</p>
                  {m.r2 !== "—" && (
                    <div className="flex gap-4 pt-1">
                      <span className="text-xs"><span className="text-gray-600">R²:</span> <span className="text-indigo-400 font-semibold">{m.r2}</span></span>
                      <span className="text-xs"><span className="text-gray-600">MAE:</span> <span className="text-indigo-400 font-semibold">{m.mae}</span></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="animate-fade-in-up">
          <SectionHeader label="Stack" title="Technologies Used" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {techStack.map((t) => (
              <div key={t.layer} className="glass glass-hover rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-base shrink-0">
                    {t.icon}
                  </div>
                  <div>
                    <p className="text-indigo-400 text-[11px] font-semibold uppercase tracking-wider mb-1">{t.layer}</p>
                    <p className="text-gray-300 text-sm">{t.tech}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
