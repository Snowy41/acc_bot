import { Link } from "react-router-dom";
import ParticleBackground from "./ParticleBackground"; // adjust import if needed

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center z-10">
      <ParticleBackground />
      {/* Main content overlay */}
      <div className="w-full flex flex-col items-center justify-center pt-20 pb-16 z-20 relative">
        {/* Logo & title */}
        <div className="flex flex-col items-center mb-4">
          <div className="flex flex-col items-center justify-center select-none">
            <img
              src="/logo_for_website.png"
              alt="vanish.rip logo"
              className="max-w-xs w-full h-auto rounded-xl shadow-lg drop-shadow-lg border border-cyan-900/40"
              draggable={false}
              style={{
                filter: "drop-shadow(0 0 32px #18f0ff66)"
              }}
            />
            <h1 className="text-[2.9rem] md:text-[4.1rem] font-extrabold tracking-wide text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-aqua bg-clip-text drop-shadow-lg text-center mb-0 leading-[1.1]">
              vanish.rip
            </h1>
            <div className="text-cyan-400 text-xl md:text-2xl font-semibold uppercase tracking-widest mt-2 mb-1 drop-shadow-md text-center">
              <span className="bg-[#181f2b]/70 px-5 py-2 rounded-full shadow">Underground Forum & Market</span>
            </div>
          </div>
          <div className="mt-5 text-cyan-200 max-w-2xl text-center text-lg md:text-xl px-3 font-medium drop-shadow">
            The next-gen blackmarket for accounts, leaks, tools, info, and trade.
            <span className="block text-cyan-300/80 mt-2">
              Uncensored. Anonymous. Built by and for the scene.
            </span>
          </div>
        </div>

        {/* Call-to-action buttons */}
        <div className="flex flex-col md:flex-row gap-5 mt-8 mb-6 items-center">
          <Link
            to="/forum"
            className="rounded-full px-10 py-4 bg-aqua/90 hover:bg-aqua text-midnight text-xl font-extrabold shadow-lg tracking-wide transition"
          >
            <span className="drop-shadow">Enter Forum</span>
          </Link>
          <Link
            to="/shop"
            className="rounded-full px-10 py-4 bg-cyan-500/80 hover:bg-cyan-400 text-midnight text-xl font-extrabold shadow-lg tracking-wide transition"
          >
            Marketplace
          </Link>
          <Link
            to="/register"
            className="rounded-full px-10 py-4 bg-white/10 hover:bg-aqua/20 text-aqua border-2 border-aqua/60 text-lg font-bold shadow transition"
          >
            Register
          </Link>
        </div>

        {/* Features / selling points */}
        <div className="w-full flex flex-wrap justify-center gap-8 mt-6 mb-8 z-10">
          <div className="flex flex-col items-center bg-[#161f2b]/95 border border-cyan-800/40 rounded-2xl p-7 min-w-[230px] max-w-xs shadow-md hover:shadow-aqua/30 transition">
            <span className="text-aqua text-3xl mb-2">🕵️‍♂️</span>
            <div className="text-cyan-200 font-bold text-lg mb-1">Maximum Privacy</div>
            <div className="text-cyan-300 text-[15px] text-center">No email. No logs. No limits. Surf via Tor or clearnet—your identity is your secret.</div>
          </div>
          <div className="flex flex-col items-center bg-[#161f2b]/95 border border-cyan-800/40 rounded-2xl p-7 min-w-[230px] max-w-xs shadow-md hover:shadow-aqua/30 transition">
            <span className="text-aqua text-3xl mb-2">💸</span>
            <div className="text-cyan-200 font-bold text-lg mb-1">Crypto Market</div>
            <div className="text-cyan-300 text-[15px] text-center">Buy & sell: accounts, leaks, tools, services. XMR & escrow wallet for secure trade.</div>
          </div>
          <div className="flex flex-col items-center bg-[#161f2b]/95 border border-cyan-800/40 rounded-2xl p-7 min-w-[230px] max-w-xs shadow-md hover:shadow-aqua/30 transition">
            <span className="text-aqua text-3xl mb-2">💬</span>
            <div className="text-cyan-200 font-bold text-lg mb-1">Live Community</div>
            <div className="text-cyan-300 text-[15px] text-center">DMs, chat, review, trade, leak, and discuss. Reputation and tag system built-in.</div>
          </div>
          <div className="flex flex-col items-center bg-[#161f2b]/95 border border-cyan-800/40 rounded-2xl p-7 min-w-[230px] max-w-xs shadow-md hover:shadow-aqua/30 transition">
            <span className="text-aqua text-3xl mb-2">🛡️</span>
            <div className="text-cyan-200 font-bold text-lg mb-1">Security First</div>
            <div className="text-cyan-300 text-[15px] text-center">End-to-end encrypted DMs. Cloudflare + onion. Advanced anti-LE & anti-scam protection.</div>
          </div>
        </div>

        {/* Links to key sections */}
        <div className="flex flex-wrap justify-center gap-4 mt-2 mb-6">
          <Link to="/forum" className="text-cyan-300 underline hover:text-aqua text-base transition">
            Forum Categories
          </Link>
          <Link to="/shop" className="text-cyan-300 underline hover:text-aqua text-base transition">
            Account Shop
          </Link>
          <Link to="/faq" className="text-cyan-300 underline hover:text-aqua text-base transition">
            FAQ / How it Works
          </Link>
          <a href="https://yourtor.onion" className="text-cyan-400 underline hover:text-aqua text-base transition" rel="noopener noreferrer" target="_blank">
            Tor Mirror
          </a>
          <Link to="/register" className="text-cyan-300 underline hover:text-aqua text-base transition">
            Sign Up
          </Link>
        </div>
      </div>
      {/* Footer */}
      <div className="absolute bottom-3 w-full flex justify-center pointer-events-none select-none">
        <span className="text-xs text-cyan-800/70 font-mono tracking-wide">vanish.rip &copy; {new Date().getFullYear()} | Underground. Private. Free.</span>
      </div>
    </div>
  );
}
