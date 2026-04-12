import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: "/", label: "Home" },
    { to: "/predict", label: "Predict" },
    { to: "/about", label: "About" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="text-2xl transition-transform duration-300 group-hover:scale-110">🌍</span>
            <span className="text-white font-bold text-lg tracking-tight">
              Disaster<span className="text-indigo-400">AI</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  pathname === l.to
                    ? "text-white bg-white/[0.08]"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {l.label}
                {pathname === l.to && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-400 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Toggle menu"
          >
            <div className="flex flex-col gap-1.5">
              <span
                className={`block w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                  mobileOpen ? "rotate-45 translate-y-[4px]" : ""
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                  mobileOpen ? "-rotate-45 -translate-y-[4px]" : ""
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileOpen ? "max-h-48 pb-4" : "max-h-0"
          }`}
        >
          <div className="flex flex-col gap-1 pt-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  pathname === l.to
                    ? "text-white bg-white/[0.08]"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
