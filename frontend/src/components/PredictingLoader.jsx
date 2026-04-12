export default function PredictingLoader({ disaster }) {
  const labels = {
    earthquake: ["Loading seismic model…", "Analyzing depth & coordinates…", "Calculating magnitude risk…"],
    flood:      ["Loading historical rainfall data…", "Running multi-modal fusion…", "Analyzing geospatial patterns…"],
  };
  const steps = labels[disaster] || labels.earthquake;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Top status card */}
      <div className="glass rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 flex items-center gap-5">
        {/* Spinning ring */}
        <div className="relative shrink-0 w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full border border-indigo-400/20 border-t-indigo-400/60 animate-spin [animation-duration:1.5s]" style={{ animationDirection: "reverse" }} />
          <div className="absolute inset-0 flex items-center justify-center text-xl">
            {disaster === "earthquake" ? "🌋" : "🌊"}
          </div>
        </div>
        <div>
          <p className="text-white font-semibold text-base">Analyzing risk…</p>
          <p className="text-indigo-300/60 text-sm mt-0.5">
            {disaster === "flood" ? "Running 3 ML models + late fusion" : "Running Random Forest model"}
          </p>
          {/* Animated dots */}
          <div className="flex gap-1.5 mt-3">
            {steps.map((s, i) => (
              <div
                key={i}
                className="h-1 rounded-full bg-indigo-500 animate-pulse"
                style={{
                  width: `${20 + i * 8}px`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "1s",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step labels */}
      <div className="glass rounded-2xl p-5 space-y-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-3 animate-pulse"
            style={{ animationDelay: `${i * 0.3}s`, animationDuration: "1.4s" }}
          >
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
            </div>
            <p className="text-gray-400 text-sm">{step}</p>
          </div>
        ))}
      </div>

      {/* Skeleton cards */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass rounded-xl p-4 space-y-3 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}>
            <div className="flex justify-between items-center">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06]" />
              <div className="w-12 h-4 rounded-full bg-white/[0.06]" />
            </div>
            <div className="w-3/4 h-3 rounded bg-white/[0.06]" />
            <div className="w-16 h-7 rounded bg-white/[0.06]" />
            <div className="w-full h-1.5 rounded-full bg-white/[0.06]" />
            <div className="w-full h-3 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 space-y-3 animate-pulse" style={{ animationDelay: "0.2s" }}>
          <div className="w-24 h-3 rounded bg-white/[0.06]" />
          <div className="grid grid-cols-3 gap-2">
            {[0,1,2].map(i => <div key={i} className="h-12 rounded-lg bg-white/[0.06]" />)}
          </div>
        </div>
        <div className="glass rounded-2xl p-5 space-y-3 animate-pulse" style={{ animationDelay: "0.35s" }}>
          <div className="w-32 h-3 rounded bg-white/[0.06]" />
          <div className="w-full h-2.5 rounded-full bg-white/[0.06]" />
          <div className="grid grid-cols-2 gap-2">
            {[0,1].map(i => <div key={i} className="h-10 rounded-lg bg-white/[0.06]" />)}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 animate-pulse" style={{ animationDelay: "0.5s" }}>
        <div className="w-40 h-3 rounded bg-white/[0.06] mb-4" />
        <div className="h-40 rounded-xl bg-white/[0.04]" />
      </div>
    </div>
  );
}
