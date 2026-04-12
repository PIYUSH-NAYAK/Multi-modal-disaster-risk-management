import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { predictEarthquake } from "../api";
import ResultCard from "../components/ResultCard";
import locations from "../data/locations";

const disasterTypes = [
  { value: "earthquake", label: "🌋 Earthquake" },
  { value: "flood",      label: "🌊 Flood — Coming Soon",   disabled: true },
  { value: "cyclone",    label: "🌀 Cyclone — Coming Soon", disabled: true },
];

const states = Object.keys(locations).sort();

export default function Predict() {
  const [searchParams] = useSearchParams();
  const [disaster, setDisaster]   = useState("earthquake");
  const [state, setState]         = useState("");
  const [city, setCity]           = useState("");
  const [depth, setDepth]         = useState("");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // selected city object { city, lat, lon }
  const cityList   = state ? locations[state] : [];
  const cityObj    = cityList.find((c) => c.city === city);

  useEffect(() => {
    const type = searchParams.get("type");
    if (type) setDisaster(type);
  }, [searchParams]);

  // reset city when state changes
  useEffect(() => {
    setCity("");
    setResult(null);
    setError(null);
  }, [state]);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [disaster]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      let res;
      if (disaster === "earthquake") {
        res = await predictEarthquake({
          latitude:  cityObj.lat,
          longitude: cityObj.lon,
          depth:     parseFloat(depth),
        });
      }
      setResult(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Something went wrong. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = state && city && depth.toString().trim() !== "";

  return (
    <div className="min-h-screen bg-gray-950 text-white py-12 px-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Disaster Risk Predictor</h1>
        <p className="text-gray-400 mb-8 text-sm">
          Select your state and city to get an AI-powered risk assessment.
        </p>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 border border-gray-700 space-y-5">

          {/* Disaster Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Disaster Type
            </label>
            <select
              value={disaster}
              onChange={(e) => setDisaster(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
            >
              {disasterTypes.map((d) => (
                <option key={d.value} value={d.value} disabled={d.disabled}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              State / UT
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Select State --</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!state}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">-- Select City --</option>
              {cityList.map((c) => (
                <option key={c.city} value={c.city}>{c.city}</option>
              ))}
            </select>
          </div>

          {/* Show resolved coordinates */}
          {cityObj && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-lg px-4 py-2.5">
                <p className="text-gray-500 text-xs mb-0.5">Latitude</p>
                <p className="text-white text-sm font-mono">{cityObj.lat}</p>
              </div>
              <div className="bg-gray-800 rounded-lg px-4 py-2.5">
                <p className="text-gray-500 text-xs mb-0.5">Longitude</p>
                <p className="text-white text-sm font-mono">{cityObj.lon}</p>
              </div>
            </div>
          )}

          {/* Depth */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Depth (km)
              <span className="text-gray-500 font-normal ml-2 text-xs">(typical: 5 – 100 km)</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 10"
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder-gray-600"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-900 border border-red-600 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? "Predicting..." : "Predict Risk"}
          </button>
        </form>

        <ResultCard result={result} />
      </div>
    </div>
  );
}
