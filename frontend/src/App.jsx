import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Predict from "./pages/Predict";
import About from "./pages/About";
import Monitor from "./pages/Monitor";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
<div className="min-h-screen bg-gray-950 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/monitor" element={<Monitor />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
