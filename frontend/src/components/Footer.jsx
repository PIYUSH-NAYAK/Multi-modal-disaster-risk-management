export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌍</span>
            <span className="text-sm font-semibold text-gray-300">DisasterAI</span>
            <span className="text-xs text-gray-600">•</span>
            <span className="text-xs text-gray-500">Multi-Modal Risk Intelligence</span>
          </div>
          <p className="text-xs text-gray-600">
            Built as a 6th Semester Mini Project · Powered by Machine Learning
          </p>
        </div>
      </div>
    </footer>
  );
}
