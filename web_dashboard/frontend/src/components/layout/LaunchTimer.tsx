import { useState, useEffect } from "react";

export default function LaunchTimer({ onBypass }: { onBypass: () => void }) {
  // SET LAUNCH DATE HERE (UTC recommended)
  const launchAt = new Date("2025-08-01T18:00:00Z").getTime();
  const [now, setNow] = useState(Date.now());
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = Math.max(launchAt - now, 0);
  const days = Math.floor(remaining / 1000 / 60 / 60 / 24);
  const hours = Math.floor((remaining / 1000 / 60 / 60) % 24);
  const mins = Math.floor((remaining / 1000 / 60) % 60);
  const secs = Math.floor((remaining / 1000) % 60);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center min-h-screen
      bg-gradient-to-tr from-[#15202b] via-[#112532] to-[#131930] z-50
      animate__animated animate__fadeIn">
      <h1 className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-aqua via-cyan-400 to-fuchsia-400 drop-shadow-xl text-center mb-10">
        vanish.rip
      </h1>
      <div
        className="relative flex flex-col items-center w-full max-w-xl px-10 py-12 rounded-3xl shadow-[0_4px_48px_#13e0f533] border border-cyan-800/60
        bg-gradient-to-br from-[#18212e]/70 via-[#111a24]/90 to-[#181d32]/70
        backdrop-blur-2xl"
        style={{
          boxShadow:
            "0 0 36px #18f0ff55, 0 1.5px 0px 1px #18f0ff13, 0 0 0.5px #13e0f533",
        }}
      >
        <span className="mb-6 text-xl font-bold tracking-wide text-cyan-400/80 uppercase letter-spacing-[0.13em] text-center">
          LAUNCH COUNTDOWN
        </span>
        <div className="grid grid-cols-4 gap-7 w-full max-w-lg mb-4">
          {[{ label: "days", value: days }, { label: "hrs", value: hours }, { label: "min", value: mins }, { label: "sec", value: secs }].map(
            ({ label, value }) => (
              <div key={label} className="flex flex-col items-center w-full">
                <span className="mb-2 text-[13px] font-mono text-cyan-300/80 tracking-widest uppercase">{label}</span>
                <span
                  className="text-5xl md:text-6xl font-mono font-extrabold px-3 py-2 rounded-2xl bg-[#142634]/70 border border-cyan-700/30 shadow-inner
                  text-aqua tracking-widest select-none"
                  style={{
                    textShadow:
                      "0 2px 16px #12fff155, 0 1px 5px #13e0f544, 0 0 2px #18f0ff99",
                  }}
                >
                  {String(value).padStart(2, "0")}
                </span>
              </div>
            )
          )}
        </div>
        <div className="mt-4 text-cyan-200 text-lg font-semibold text-center tracking-wide">
          We launch in
          <span className="mx-2 text-aqua">{days}</span>days,
          <span className="mx-2 text-aqua">{hours}</span>hrs,
          <span className="mx-2 text-aqua">{mins}</span>min,
          <span className="mx-2 text-aqua">{secs}</span>sec
        </div>
        <div className="mt-3 text-cyan-500/90 text-sm text-center opacity-80 font-mono">
          {remaining === 0 ? "We're live!" : "Follow our socials for exclusive updates"}
        </div>
      </div>

      {/* Nearly invisible bypass/login button */}
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate__animated animate__fadeIn">
          <div className="relative bg-[#1a2232]/95 border border-cyan-800 p-8 rounded-2xl shadow-2xl">
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
