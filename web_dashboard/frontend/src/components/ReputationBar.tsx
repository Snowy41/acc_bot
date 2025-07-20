// ReputationBar.tsx
import React from "react";

export function ReputationBar({ rep = 0, max = 100 }: { rep: number; max?: number }) {
  let badge = "Bronze", color = "#bb9457", emoji = "🥉";
  if (rep >= 75) { badge = "Platinum"; color = "#49fced"; emoji = "🌟"; }
  else if (rep >= 30) { badge = "Gold"; color = "#ffe066"; emoji = "🥇"; }
  else if (rep >= 10) { badge = "Silver"; color = "#d0d5df"; emoji = "🥈"; }
  const barProgress = Math.min(1, rep / max);

  return (
    <div className="w-full my-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{emoji}</span>
        <span className="text-xs font-bold" style={{ color }}>{badge} Rep</span>
        <span className="text-cyan-300 font-mono text-xs ml-2">{rep} / {max}</span>
      </div>
      <div className="w-32 h-2 rounded bg-cyan-900/40 overflow-hidden">
        <div
          className="h-2 rounded transition-all"
          style={{
            width: `${barProgress * 100}%`,
            background: `linear-gradient(90deg, ${color} 60%, #1bd6e8 100%)`
          }}
        />
      </div>
    </div>
  );
}
