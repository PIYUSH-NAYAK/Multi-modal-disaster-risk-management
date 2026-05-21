import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-gray-950/60 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-base">
                🌍
              </div>
              <span className="text-white font-bold text-base tracking-tight">
                Disaster<span className="text-indigo-400">AI</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Multi-Modal Disaster Risk Intelligence System for India.
              Built using real historical seismic, flood, and weather datasets.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-600 mb-3">Navigation</p>
            <div className="flex flex-col gap-2">
              {[
                { to: "/", label: "Home" },
                { to: "/monitor", label: "Monitor" },
                { to: "/predict", label: "Predict" },
                { to: "/about", label: "About" },
              ].map((l) => (
                <Link key={l.to} to={l.to} className="text-sm text-gray-500 hover:text-gray-300 transition-colors duration-200">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Data Sources */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-600 mb-3">Data Sources</p>
            <div className="flex flex-col gap-2">
              {[
                "USGS — Seismic data",
                "IMD — Rainfall records",
                "Open-Meteo — Live weather",
                "IWRIS — Flood data",
              ].map((s) => (
                <p key={s} className="text-sm text-gray-500">{s}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            6th Semester Mini Project · Machine Learning · FastAPI · React
          </p>
          <div className="flex items-center gap-4 text-[11px] text-gray-700">
            <span>scikit-learn</span>
            <span>·</span>
            <span>FastAPI</span>
            <span>·</span>
            <span>Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
