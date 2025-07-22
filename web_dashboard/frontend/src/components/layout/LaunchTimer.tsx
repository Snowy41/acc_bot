import { useState, useEffect } from "react";

export default function LaunchTimer({ onBypass }: { onBypass: () => void }) {
  // Set your launch date/time here (UTC recommended)
  const launchAt = new Date("2025-08-01T18:00:00Z").getTime();
  const [now, setNow] = useState(Date.now());
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(launchAt - now, 0);
  const hours = Math.floor(remaining / 1000 / 60 / 60);
  const mins = Math.floor((remaining / 1000 / 60) % 60);
  const secs = Math.floor((remaining / 1000) % 60);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center min-h-screen bg-gradient-to-tr from-[#17232d] to-[#13334b] z-50">
      <h1 className="text-5xl font-black text-aqua mb-6 drop-shadow-lg tracking-tight text-center">
        vanish.rip<br />Launching Soon
      </h1>
      <div className="bg-[#131f29]/70 border border-cyan-800 rounded-3xl shadow-2xl p-12 mb-7 flex flex-col items-center">
        <div className="text-3xl md:text-5xl font-bold text-white mb-4 font-mono flex gap-4">
          <span>{String(hours).padStart(2, "0")}</span>:
          <span>{String(mins).padStart(2, "0")}</span>:
          <span>{String(secs).padStart(2, "0")}</span>
        </div>
        <div className="text-cyan-200 text-lg mb-2 text-center">
          Launches in <b>{hours}</b> hours <b>{mins}</b> minutes <b>{secs}</b> seconds
        </div>
        <div className="text-cyan-700 text-sm opacity-80">Follow our socials for updates.</div>
      </div>
      {/* Nearly invisible bypass button */}
      <button
        aria-label="Admin/tester login"
        onClick={() => setShowLogin(true)}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          opacity: 0.12,
          width: 32,
          height: 32,
          zIndex: 100
        }}
        className="rounded-full hover:opacity-70 focus:opacity-60 transition border border-transparent focus:border-aqua"
      >
        <span className="sr-only">Login</span>
        <span style={{ fontSize: 24 }}>🔒</span>
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
            {/* Call parent to show login modal */}
            <button
              onClick={onBypass}
              className="bg-aqua text-midnight px-8 py-3 rounded-full font-bold shadow-lg text-2xl"
            >
              Open Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
