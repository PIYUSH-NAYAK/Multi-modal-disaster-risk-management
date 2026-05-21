import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

export const predictEarthquake = (data) =>
  api.post("/predict/earthquake", data);

export const predictFlood = (data) =>
  api.post("/predict/flood", data);

export const predictFloodQuick = (data) =>
  api.post("/predict/flood/quick", data);

export const fetchWeather = (lat, lon) =>
  api.get("/weather", { params: { lat, lon } });

export const fetchClimate = (lat, lon, month) =>
  api.get("/climate", { params: { lat, lon, month } });

export const fetchAlerts = () =>
  api.get("/alerts");

export const geocodeCity = (name) =>
  api.get("/geocode", { params: { name } });

export const fetchCityWeather = (lat, lon, name, state) =>
  api.get("/weather/city", { params: { lat, lon, name, state } });

export default api;
