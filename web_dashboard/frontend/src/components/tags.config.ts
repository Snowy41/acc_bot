// tags.config.ts
export const TAGS: Record<string, {
  label: string,
  emoji: string,
  bg: string,
  textColor?: string,
  className?: string,
  border?: string,
  description?: string,  // for tooltips if you want!
}> = {
  Owner: {
    label: "Owner",
    emoji: "💠",
    bg: "from-pink-500 via-aqua to-cyan-400",
    className: "animate-cyber-glitch",
    border: "border-aqua border-2",
  },
  Founder: {
    label: "Founder",
    emoji: "👑",
    bg: "from-yellow-400 via-yellow-300 to-amber-500",
    className: "cyber-underline font-bold",
    textColor: "#181a1c",
    border: "border-yellow-400 border-2",
  },
  Legend: {
    label: "Legend",
    emoji: "🌟",
    bg: "from-yellow-400 via-fuchsia-400 to-aqua",
    className: "animate-holo-shine font-extrabold",
    textColor: "#181a1c",
    border: "border-fuchsia-300 border-2"
  },
  OG: {
    label: "OG",
    emoji: "🦾",
    bg: "from-fuchsia-400 via-cyan-400 to-aqua",
    className: "animate-matrix-rain font-bold text-cyan-50",
  },
  Trusted: {
    label: "Trusted",
    emoji: "🛡️",
    bg: "from-green-400 via-cyan-400 to-blue-300",
    className: "animate-cyber-pulse text-cyan-100",
  },
  Premium: {
    label: "Premium",
    emoji: "💎",
    bg: "from-blue-400 via-cyan-400 to-emerald-300",
    className: "animate-holo-shine font-extrabold",
  },
  Plug: {
    label: "Plug",
    emoji: "🔌",
    bg: "from-emerald-500 via-green-400 to-cyan-400",
    className: "animate-cyber-glitch text-neutral-900",
  },
  Vendor: {
    label: "Vendor",
    emoji: "🛒",
    bg: "from-orange-400 via-yellow-200 to-yellow-400",
    className: "cyber-underline text-neutral-900 font-bold",
    border: "border-yellow-300 border-2"
  },
  Whale: {
    label: "Whale",
    emoji: "🐋",
    bg: "from-blue-300 via-blue-400 to-aqua",
    className: "animate-holo-shine text-neutral-900 font-extrabold",
  },
  Ghost: {
    label: "Ghost",
    emoji: "👻",
    bg: "from-cyan-400 via-white to-cyan-400",
    className: "animate-ghost-fade typewriter-cyber text-cyan-200",
  },
  Analyst: {
    label: "Analyst",
    emoji: "🕵️",
    bg: "from-gray-600 via-slate-300 to-cyan-400",
    className: "animate-matrix-rain text-cyan-100",
  },
  Operator: {
    label: "Operator",
    emoji: "📡",
    bg: "from-emerald-400 via-cyan-400 to-blue-400",
    className: "animate-holo-shine text-cyan-100",
  },
  "Service Pro": {
    label: "Service Pro",
    emoji: "🛠️",
    bg: "from-green-300 via-cyan-300 to-blue-200",
    className: "animate-cyber-pulse text-cyan-100",
  },
  "Power Seller": {
    label: "Power Seller",
    emoji: "🔥",
    bg: "from-yellow-200 via-orange-400 to-pink-500",
    className: "animate-holo-shine text-black font-bold",
  },
  Scammer: {
    label: "Scammer",
    emoji: "🚩",
    bg: "from-red-700 via-red-400 to-yellow-300",
    className: "animate-cyber-glitch font-bold text-white",
  },
  Newbie: {
    label: "Newbie",
    emoji: "🟢",
    bg: "from-gray-500 via-gray-200 to-lime-300",
    textColor: "#191a1c",
  },
  Admin: {
    label: "Admin",
    emoji: "🛡️",
    bg: "from-blue-900 via-cyan-600 to-fuchsia-400",
    className: "animate-holo-shine",
    textColor: "#fff"
  },
  // ...add more as you wish!
};
