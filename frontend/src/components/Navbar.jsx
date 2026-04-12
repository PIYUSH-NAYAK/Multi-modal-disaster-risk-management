import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();

  const links = [
    { to: "/", label: "Home" },
    { to: "/predict", label: "Predict" },
    { to: "/about", label: "About" },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌍</span>
        <span className="text-white font-bold text-lg tracking-tight">
          DisasterAI
        </span>
      </div>
      <div className="flex gap-6">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`text-sm font-medium transition-colors ${
              pathname === l.to
                ? "text-blue-400 border-b-2 border-blue-400 pb-1"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
