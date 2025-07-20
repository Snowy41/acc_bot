// TagSection.tsx
import React from "react";
import "./tags.css"; // Place the animations below in tags.css

const TAG_STYLES: Record<string, {
  color?: string,
  textColor?: string,
  bg?: string,
  emoji?: string,
  className?: string,
  border?: string,
  glitch?: boolean,
  typewriter?: boolean,
  underline?: boolean,
  style?: React.CSSProperties
}> = {
  owner: {
    emoji: "💠",
    color: "#fff",
    textColor: "#232528",
    bg: "from-pink-500 via-aqua to-cyan-400",
    className: "animate-glitch-glow relative",
    border: "border-aqua border-2",
    glitch: true,
  },
  founder: {
    emoji: "👑",
    color: "#ffc700",
    textColor: "#232528",
    bg: "from-yellow-400 via-yellow-300 to-amber-500",
    className: "animate-underline-cyber",
    border: "border-yellow-400 border-2",
    underline: true,
  },
  legend: {
    emoji: "🌟",
    textColor: "#fff",
    color: "#ffe066",
    bg: "from-yellow-400 via-fuchsia-400 to-aqua",
    className: "animate-shadow-flicker",
    border: "border-fuchsia-300 border-2"
  },
  ghost: {
    emoji: "👻",
    color: "#b2fff6",
    textColor: "#646464",
    bg: "from-cyan-400 via-white to-cyan-400",
    className: "animate-typewriter",
    border: "border-cyan-200 border-2",
    typewriter: true,
  },
  trusted: {
    emoji: "🛡️",
    color: "#65ffc6",
    textColor: "#7a7a7a",
    bg: "from-green-400 via-cyan-400 to-blue-300",
    className: "animate-neon-glow",
    border: "border-green-200 border-2"
  },
  whale: {
    emoji: "🐋",
    color: "#3de1ff",
    textColor: "#3c454f",
    bg: "from-blue-300 via-blue-400 to-aqua",
    className: "animate-float-whale",
    border: "border-blue-200 border-2"
  },
  plug: {
    emoji: "🔌",
    textColor: "#fff",
    color: "#39ff97",
    bg: "from-emerald-500 via-green-400 to-cyan-400",
    className: "animate-glitch-horizontal",
    border: "border-emerald-300 border-2",
    glitch: true
  },
  vendor: {
    emoji: "🛒",
    color: "#ffa23d",
    textColor: "#fff",
    bg: "from-orange-400 via-yellow-200 to-yellow-400",
    className: "animate-underline-cyber",
    border: "border-yellow-300 border-2",
    underline: true
  },
  og: {
    emoji: "🦾",
    textColor: "#8f8f8f",
    color: "#6affff",
    bg: "from-fuchsia-400 via-cyan-400 to-aqua",
    className: "animate-glow-shift",
    border: "border-fuchsia-200 border-2"
  },
  scammer: {
    emoji: "🚩",
    textColor: "#282828",
    color: "#fff",
    bg: "from-red-700 via-red-400 to-yellow-300",
    className: "animate-scanline",
    border: "border-red-400 border-2"
  },
};

export function TagSection({ tags = [] }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {tags.map((tag, idx) => {
        const lower = tag.toLowerCase();
        const style = TAG_STYLES[lower] || {};
        return (
            <span
              key={tag + idx}
              className={`
                px-4 py-1 rounded-full font-semibold text-xs relative
                shadow-md
                ${style.bg ? `bg-gradient-to-r ${style.bg}` : "bg-cyan-900/60"}
                ${style.className || ""}
                ${style.border || ""}
                group
                overflow-hidden
              `}
              style={{
                color: style.textColor || style.color || "#fff",
                ...style.style
              }}
              title={tag}
            >
              {/* Emoji */}
              {style.emoji && <span className="mr-2">{style.emoji}</span>}
              {/* Tag text */}
              <span className={`
                z-10 font-bold tracking-wide
                ${style.glitch ? "glitch-text" : ""}
                ${style.typewriter ? "typewriter-text" : ""}
              `}>
                {tag}
                {style.typewriter && <span className="typewriter-cursor">_</span>}
              </span>
              {style.underline && <span className="underline-animate"></span>}
            </span>
        );
      })}
    </div>
  );
}
