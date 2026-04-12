import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

export const predictEarthquake = (data) =>
  api.post("/predict/earthquake", data);

export default api;
