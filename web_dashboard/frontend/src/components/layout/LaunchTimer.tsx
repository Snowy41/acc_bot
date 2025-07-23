import { useState, useEffect } from "react";

export default function LaunchTimer({ onBypass }: { onBypass: () => void }) {
  const [now, setNow] = useState(Date.now());
  const [showLogin, setShowLogin] = useState(false);

  // Set your launch time (example: August 1st, 2025)
  const launchAt = new Date("2025-08-01T18:00:00Z").getTime();

  // Update the time remaining every second
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(launchAt - now, 0);
  const days = Math.floor(remaining / 1000 / 60 / 60 / 24);
  const hours = Math.floor((remaining / 1000 / 60 / 60) % 24);
  const mins = Math.floor((remaining / 1000 / 60) % 60);
  const secs = Math.floor((remaining / 1000) % 60);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center min-h-screen bg-gradient-to-tr from-[#17232d] to-[#13334b] z-50">
      <h1 className="text-5xl font-black text-aqua mb-7 drop-shadow-lg tracking-tight text-center">
        vanish.rip<br />Launching Soon
      </h1>
      <div
        className="relative flex flex-col items-center w-full max-w-xl px-10 py-12 rounded-3xl shadow-[0_4px_48px_#13e0f533] border border-cyan-800/60
        bg-gradient-to-br from-[#18212e]/70 via-[#111a24]/90 to-[#181d32]/70
        backdrop-blur-2xl"
        style={{
          boxShadow:
            "0 0 36px #18f0ff55, 0 1.5px 0px 1px #18f0ff13, 0 0 0.5px #13e0f544",
        }}
      >
        {/* Countdown Timer */}
        <div className="flex justify-center gap-6 mb-3 w-full">
          <div className="flex flex-col items-center">
            <span className="text-xs text-cyan-300 mb-1 tracking-wider">days</span>
            <span className="text-5xl md:text-6xl font-mono font-bold text-white">{String(days).padStart(2, "0")}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-cyan-300 mb-1 tracking-wider">hours</span>
            <span className="text-5xl md:text-6xl font-mono font-bold text-white">{String(hours).padStart(2, "0")}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-cyan-300 mb-1 tracking-wider">min</span>
            <span className="text-5xl md:text-6xl font-mono font-bold text-white">{String(mins).padStart(2, "0")}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-cyan-300 mb-1 tracking-wider">sec</span>
            <span className="text-5xl md:text-6xl font-mono font-bold text-white">{String(secs).padStart(2, "0")}</span>
          </div>
        </div>
      </div>

      {/* Admin control: Update the current step */}
      <button
        aria-label="Admin/tester login"
        onClick={() => setShowLogin(true)}
        style={{
          position: "absolute",
          top: 12,
          right: 18,
          opacity: 0.10,
          width: 36,
          height: 36,
          zIndex: 100,
        }}
        className="rounded-full hover:opacity-60 focus:opacity-80 transition border border-transparent focus:border-aqua"
      >
        <span className="sr-only">Login</span>
        <span style={{ fontSize: 26 }}>🔒</span>
      </button>

      {/* Actual login modal, shown only if you click the bypass */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="relative bg-[#1a2232]/90 border border-cyan-800 p-8 rounded-2xl">
            <button
              className="absolute top-2 right-3 text-lg text-red-300 hover:text-red-500"
              onClick={() => setShowLogin(false)}
            >
              ×
            </button>
            <button
              onClick={onBypass}
              className="bg-gradient-to-r from-aqua via-cyan-300 to-blue-400 text-midnight px-8 py-3 rounded-full font-extrabold shadow-lg text-2xl hover:bg-aqua/80 transition"
            >
              Open Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
