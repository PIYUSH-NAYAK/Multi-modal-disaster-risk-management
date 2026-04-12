const datasets = [
  { name: "Earthquakes_India_Master.csv", rows: "7,051", source: "USGS + Kaggle", disaster: "Earthquake" },
  { name: "flood_risk_dataset_india.csv", rows: "10,000", source: "Kaggle", disaster: "Flood" },
];

const models = [
  { name: "Random Forest Regressor", disaster: "Earthquake", r2: "0.356", mae: "0.358", features: "latitude, longitude, depth", status: "Live" },
  { name: "Random Forest Classifier", disaster: "Flood", r2: "—", mae: "—", features: "rainfall, river level, humidity", status: "Soon" },
  { name: "Random Forest Classifier", disaster: "Cyclone", r2: "—", mae: "—", features: "wind speed, pressure, temperature", status: "Soon" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-gray-950 text-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">About the Project</h1>
        <p className="text-gray-400 mb-10 text-sm">
          Multi-Modal Disaster Risk Intelligence System — built as a 6th Semester Mini Project.
        </p>

        {/* Overview */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3 text-blue-400">Overview</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            This system uses machine learning to predict disaster risk across Earthquake, Flood,
            and Cyclone hazards for locations within India. Each hazard module is trained on real
            historical datasets and exposed through a REST API built with FastAPI. The frontend
            is built with React and Vite.
          </p>
        </section>

        {/* Datasets */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3 text-blue-400">Datasets Used</h2>
          <div className="space-y-3">
            {datasets.map((d) => (
              <div key={d.name} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white text-sm font-medium">{d.name}</p>
                    <p className="text-gray-500 text-xs mt-1">Source: {d.source}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-400 text-sm font-bold">{d.rows}</p>
                    <p className="text-gray-500 text-xs">rows</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Models */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3 text-blue-400">ML Models</h2>
          <div className="space-y-3">
            {models.map((m) => (
              <div key={m.disaster} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white font-medium">{m.disaster}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${m.status === "Live" ? "bg-green-600 text-white" : "bg-gray-700 text-gray-400"}`}>
                    {m.status}
                  </span>
                </div>
                <p className="text-gray-400 text-xs">Algorithm: {m.name}</p>
                <p className="text-gray-400 text-xs">Features: {m.features}</p>
                {m.r2 !== "—" && (
                  <p className="text-gray-400 text-xs">R²: {m.r2} | MAE: {m.mae}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section>
          <h2 className="text-xl font-semibold mb-3 text-blue-400">Tech Stack</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { layer: "ML", tech: "scikit-learn, pandas, numpy" },
              { layer: "Backend", tech: "FastAPI, Uvicorn, joblib" },
              { layer: "Frontend", tech: "React 18, Vite, Tailwind CSS" },
              { layer: "HTTP", tech: "Axios, REST API" },
            ].map((t) => (
              <div key={t.layer} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <p className="text-blue-400 text-xs font-semibold uppercase mb-1">{t.layer}</p>
                <p className="text-gray-300 text-sm">{t.tech}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
