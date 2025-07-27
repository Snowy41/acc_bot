import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ParticleBackground from "./ParticleBackground";

export default function HomePage() {
  // Terminal-style intro loading animation
  const [loadingDone, setLoadingDone] = useState(false);
  const [terminalText, setTerminalText] = useState("");
  const fullText = [
    "Initializing secure connection...",
    "Authenticating via onion relay...",
    "Bypassing surface web...",
    "Decrypted handshake complete.",
    "Access granted. Welcome to vanish.rip."
  ];

  useEffect(() => {
    let i = 0, line = 0, currentLine = "";
    function typeNext() {
      if (line < fullText.length) {
        if (i < fullText[line].length) {
          setTerminalText(prev => prev + fullText[line][i]);
          i++;
          setTimeout(typeNext, 26);
        } else {
          setTerminalText(prev => prev + "\n");
          line++;
          i = 0;
          setTimeout(typeNext, 320);
        }
      } else {
        setTimeout(() => setLoadingDone(true), 450);
      }
    }
    typeNext();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center z-10 select-none">
      <ParticleBackground />

      {/* Terminal intro overlay */}
      {!loadingDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c141f]/95 backdrop-blur-xl pointer-events-none transition-all duration-500">
          <div className="text-aqua font-mono text-[1.25rem] md:text-[1.5rem] px-8 py-6 rounded-lg shadow-2xl border-2 border-cyan-800/40 bg-[#111d29]/90 w-[410px] max-w-[90vw] whitespace-pre leading-snug tracking-wide animate-pulse">
            {terminalText}
            {!terminalText.endsWith("\n") && <span className="animate-pulse text-cyan-300">|</span>}
          </div>
        </div>
      )}

      {/* Main HomePage content, appears after loading */}
      <div className={`w-full flex flex-col items-center justify-center pt-20 pb-16 z-20 relative transition-opacity duration-700 ${loadingDone ? "opacity-100" : "opacity-0 pointer-events-none select-none"}`}>
        {/* Logo and site title */}
        <div className="flex flex-col items-center mb-4">
          <img
            src="/logo_for_website.png"
            alt="vanish.rip logo"
            className="h-[100px] w-auto rounded-[2.5rem] shadow-2xl border border-cyan-800/30 bg-[#141a24] p-3 mb-3"
            style={{ objectFit: "contain", maxHeight: "100px" }}
            draggable={false}
          />
          <h1 className="text-[2.6rem] md:text-[4.1rem] font-extrabold tracking-wide text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-aqua bg-clip-text drop-shadow-lg text-center mb-0 leading-[1.1]">
            vanish.rip
          </h1>
          <div className="text-cyan-400 text-xl md:text-2xl font-semibold uppercase tracking-widest mt-2 mb-1 drop-shadow-md text-center">
            <span className="bg-[#181f2b]/70 px-5 py-2 rounded-full shadow">Underground Forum & Market</span>
          </div>
          <div className="mt-5 text-cyan-200 max-w-2xl text-center text-lg md:text-xl px-3 font-medium drop-shadow">
            The next-gen blackmarket for accounts, leaks, tools, info, and trade.<br />
            <span className="block text-cyan-300/80 mt-2">
              Uncensored. Anonymous. Built by and for the scene.
            </span>
          </div>
        </div>
        {/* Buttons: Marketplace, Shop, Forum */}
        <div className="flex flex-col md:flex-row gap-6 mt-10 mb-8 items-center">
          <Link
            to="/marketplace"
            className="rounded-full px-10 py-4 text-[1.27rem] font-extrabold shadow-lg tracking-wide
              bg-gradient-to-r from-[#12fff2] via-[#0ae0ff] to-[#1dffe2]
              text-midnight border-none transition-all
              hover:brightness-110 hover:scale-105 hover:shadow-aqua/50"
          >
            <span className="drop-shadow">Marketplace</span>
          </Link>
          <Link
            to="/shop"
            className="rounded-full px-10 py-4 text-[1.17rem] font-extrabold shadow-lg tracking-wide
              bg-gradient-to-r from-[#61f1ff] via-[#12f0ff] to-[#0086f7]
              text-midnight border-none transition-all
              hover:brightness-110 hover:scale-105 hover:shadow-cyan-500/50"
          >
            Shop
          </Link>
          <Link
            to="/forum"
            className="rounded-full px-10 py-4 text-[1.17rem] font-extrabold shadow-lg tracking-wide
              bg-gradient-to-r from-[#1ce2ff] via-[#0ae0ff] to-[#56ffd6]
              text-midnight border-none transition-all
              hover:brightness-110 hover:scale-105 hover:shadow-cyan-300/40"
          >
            Enter Forum
          </Link>
        </div>
        {/* Features / Selling points */}
        <div className="w-full flex flex-wrap justify-center gap-8 mt-8 mb-8 z-10">
          <div className="flex flex-col items-center bg-[#181f2b]/95 border border-cyan-800/40 rounded-2xl p-7 min-w-[240px] max-w-xs shadow-md hover:shadow-aqua/30 transition-all">
            <span className="text-aqua text-3xl mb-2">🕵️‍♂️</span>
            <div className="text-cyan-200 font-bold text-lg mb-1">Maximum Privacy</div>
            <div className="text-cyan-300 text-[15px] text-center">No email. No logs. No limits. Surf via Tor or clearnet—your identity is your secret.</div>
          </div>
          <div className="flex flex-col items-center bg-[#181f2b]/95 border border-cyan-800/40 rounded-2xl p-7 min-w-[240px] max-w-xs shadow-md hover:shadow-aqua/30 transition-all">
            <span className="text-aqua text-3xl mb-2">💸</span>
            <div className="text-cyan-200 font-bold text-lg mb-1">Crypto Market</div>
            <div className="text-cyan-300 text-[15px] text-center">Buy & sell: accounts, leaks, tools, services. XMR & escrow wallet for secure trade.</div>
          </div>
          <div className="flex flex-col items-center bg-[#181f2b]/95 border border-cyan-800/40 rounded-2xl p-7 min-w-[240px] max-w-xs shadow-md hover:shadow-aqua/30 transition-all">
            <span className="text-aqua text-3xl mb-2">💬</span>
            <div className="text-cyan-200 font-bold text-lg mb-1">Live Community</div>
            <div className="text-cyan-300 text-[15px] text-center">DMs, chat, review, trade, leak, and discuss. Reputation and tag system built-in.</div>
          </div>
          <div className="flex flex-col items-center bg-[#181f2b]/95 border border-cyan-800/40 rounded-2xl p-7 min-w-[240px] max-w-xs shadow-md hover:shadow-aqua/30 transition-all">
            <span className="text-aqua text-3xl mb-2">🛡️</span>
            <div className="text-cyan-200 font-bold text-lg mb-1">Security First</div>
            <div className="text-cyan-300 text-[15px] text-center">End-to-end encrypted DMs. Cloudflare + onion. Advanced anti-LE & anti-scam protection.</div>
          </div>
        </div>
        {/* Section links */}
        <div className="flex flex-wrap justify-center gap-4 mt-2 mb-6">
          <Link to="/forum" className="text-cyan-300 underline hover:text-aqua text-base transition">
            Forum Categories
          </Link>
          <Link to="/marketplace" className="text-cyan-300 underline hover:text-aqua text-base transition">
            Marketplace
          </Link>
          <Link to="/shop" className="text-cyan-300 underline hover:text-aqua text-base transition">
            Shop
          </Link>
          <Link to="/faq" className="text-cyan-300 underline hover:text-aqua text-base transition">
            FAQ / How it Works
          </Link>
          <a href="https://yourtor.onion" className="text-cyan-400 underline hover:text-aqua text-base transition" rel="noopener noreferrer" target="_blank">
            Tor Mirror
          </a>
        </div>
      </div>
      {/* Footer */}
      <div className="absolute bottom-3 w-full flex justify-center pointer-events-none select-none">
        <span className="text-xs text-cyan-800/70 font-mono tracking-wide">vanish.rip &copy; {new Date().getFullYear()} | Underground. Private. Free.</span>
      </div>
    </div>
  );
}
