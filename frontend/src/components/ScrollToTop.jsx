import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Prevent browser from restoring scroll position on refresh
if (typeof window !== "undefined") {
  window.history.scrollRestoration = "manual";
}

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
