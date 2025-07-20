import React from "react";

// Blackhat/marketplace themed rep levels:
const levels = [
  { min: 5000, title: "Mythic", emoji: "🦾", color: "#0ff0fc" },
  { min: 3000, title: "Kingpin", emoji: "👑", color: "#ffe066" },
  { min: 2000, title: "Black Market", emoji: "🕵️", color: "#ffba49" },
  { min: 1500, title: "Ghost", emoji: "👻", color: "#00ffd0" },
  { min: 1200, title: "Power Seller", emoji: "🔥", color: "#fc49d5" },
  { min: 900,  title: "Service Pro", emoji: "🛠️", color: "#6fc7f7" },
  { min: 700, title: "Operator", emoji: "📡", color: "#ad6fff" },
  { min: 500,  title: "Trusted", emoji: "🛡️", color: "#2dc5ff" },
  { min: 300,  title: "Vendor", emoji: "🛒", color: "#ffe066" },
  { min: 150,  title: "Verified", emoji: "✅", color: "#00ffe7" },
  { min: 50,   title: "Buyer", emoji: "💵", color: "#49fced" },
  { min: 0,    title: "Fresh Drop", emoji: "🟤", color: "#8e9296" },
];

export function ReputationBar({ rep = 0 }: { rep: number }) {
  const level = levels.find(lvl => rep >= lvl.min)!;
  const nextLevel = levels.find(lvl => rep < lvl.min) || null;
  const nextMin = nextLevel ? nextLevel.min : rep + 100;
  const prevMin = level.min;
  const progress = Math.min(1, (rep - prevMin) / ((nextMin - prevMin) || 1));
  const siteMax = 5000;

  return (
    <div className="w-full p-2 px-3 rounded-lg" style={{
      background: "rgba(10,32,42,0.65)",
      border: "1.5px solid #19e3f555",
      boxShadow: "0 2px 16px #12fff144, 0 0 4px #19e3f511"
    }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl" style={{ textShadow: "0 1px 2px #000" }}>{level.emoji}</span>
        <span className="font-bold text-base tracking-wide" style={{
          color: level.color,
          textShadow: "0 0 4px #1bd6e8"
        }}>{level.title} Rep</span>
        <span className="text-cyan-200 font-mono text-xs ml-2">
          {rep} <span className="opacity-70 mx-1">/</span>
          <span className="text-cyan-400">{siteMax}</span>
        </span>
      </div>
      <div className="w-full h-2.5 rounded-xl bg-[#1a2330] overflow-hidden shadow-inner">
        <div
          className="h-2.5 rounded-xl transition-all duration-300"
          style={{
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${level.color} 20%, #00fff7 100%)`,
            boxShadow: `0 0 16px 2px ${level.color}44, 0 2px 12px #0ff6`
          }}
        />
      </div>
      {nextLevel && nextLevel.min < siteMax && (
        <div className="text-xs text-cyan-400 mt-1 opacity-80" style={{ letterSpacing: "0.02em" }}>
          Next: <span style={{ color: nextLevel.color }}>{nextLevel.title}</span> at {nextLevel.min} rep
        </div>
      )}
    </div>
  );
}
