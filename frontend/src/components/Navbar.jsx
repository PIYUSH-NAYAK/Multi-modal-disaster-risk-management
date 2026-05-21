import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: "/", label: "Home" },
    { to: "/monitor", label: "Monitor" },
    { to: "/about", label: "About" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-gray-950/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-base transition-all duration-300 group-hover:bg-indigo-600/30 group-hover:scale-105">
              🌍
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Disaster<span className="text-indigo-400">AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
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
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-400 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* CTA + mobile menu */}
          <div className="flex items-center gap-3">
            <Link
              to="/predict"
              className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${
                pathname === "/predict"
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/15 hover:shadow-indigo-500/25 hover:-translate-y-px"
              }`}
            >
              <span className="hidden sm:inline">Predict Now</span>
              <span className="sm:hidden">Predict</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Toggle menu"
            >
              <div className="flex flex-col gap-1.5 w-5">
                <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-[7px] w-full" : "w-full"}`} />
                <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${mobileOpen ? "opacity-0 w-0" : "w-4"}`} />
                <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-[7px] w-full" : "w-full"}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? "max-h-48 pb-4" : "max-h-0"}`}>
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
