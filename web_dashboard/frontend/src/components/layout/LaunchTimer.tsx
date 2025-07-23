import { useState, useEffect } from "react";

// Define the steps in the timeline with descriptions
const timelineSteps = [
  { step: "DAY 1: Refactor, Harden, and Organize Everything", description: "Refactor backend (main.py), split routes (forum, user, tokens, market). Update DB schema..." },
  { step: "DAY 2: Token/Credit Payments, Escrow, Withdrawals", description: "Backend: /api/deposit, /api/withdraw, per-user deposit address, auto-update balances..." },
  { step: "DAY 3: Security, Anti-Abuse, 'OG' Forums, Panic/Nuke", description: "Complete system-wide rate limiting, audit for XSS/SQLi/CSRF..." },
  { step: "DAY 4: Offshore Hosting Prep & Migration", description: "Register ProtonMail (over VPN), register for 2–3 offshore VPSs..." },
  { step: "DAY 5: Red Team, Testing, Launch Prep", description: "Invite trusted friend(s) to try to break everything: register, trade, DM, spam..." }
];

export default function LaunchTimer({ onBypass }: { onBypass: () => void }) {
  const [now, setNow] = useState(Date.now());
  const [currentStep, setCurrentStep] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
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

  // Update the timeline step
  const updateStep = (newStep: string) => {
    setCurrentStep(timelineSteps.findIndex((step) => step.step === newStep));
    // Send update to backend API (Flask)
    fetch('/api/timeline-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: newStep })
    }).then(response => response.json())
      .then(data => {
        console.log("Step updated:", data);
      });
  };

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
        {/* Timeline */}
        <div className="flex items-center justify-center w-full mb-6">
          <div className="relative w-full flex items-center">
            {timelineSteps.map((step, idx) => (
              <div
                key={step.step}
                className={`w-8 h-8 rounded-full 
                  ${currentStep >= idx ? "bg-aqua" : "bg-gray-700"} 
                  ${hoveredStep === idx ? "scale-125" : "scale-100"} 
                  transition-all duration-300 ease-in-out 
                  cursor-pointer flex justify-center items-center`}
                onClick={() => updateStep(step.step)}
                onMouseEnter={() => setHoveredStep(idx)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <div className="text-xs text-white font-bold">{idx + 1}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hovering description */}
        {hoveredStep !== null && (
          <div className="text-cyan-200 mt-4 p-4 text-lg bg-[#131f29] rounded-lg shadow-xl">
            {timelineSteps[hoveredStep].description}
          </div>
        )}

        {/* Countdown */}
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
        className="absolute top-10 right-10 text-aqua font-bold hover:opacity-80"
        onClick={() => setShowLogin(true)}
      >
        Admin Login (to update timeline)
      </button>

      {/* Admin Login Modal */}
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
