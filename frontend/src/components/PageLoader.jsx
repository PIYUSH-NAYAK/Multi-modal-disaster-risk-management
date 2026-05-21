import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function PageLoader() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Start the bar
    setWidth(0);
    setVisible(true);

    // Quickly animate to ~80% then hold
    const t1 = setTimeout(() => setWidth(70), 10);
    const t2 = setTimeout(() => setWidth(85), 400);

    // Complete and hide
    const t3 = setTimeout(() => setWidth(100), 700);
    const t4 = setTimeout(() => setVisible(false), 1000);

    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
        style={{
          width: `${width}%`,
          transition: width === 0
            ? "none"
            : width === 100
            ? "width 0.2s ease-in"
            : "width 0.6s cubic-bezier(0.1, 0.5, 0.5, 1)",
        }}
      />
    </div>
  );
}
