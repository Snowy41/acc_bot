import { Link } from "react-router-dom";

const categories = [
  { key: "announcement", label: "Announcements", icon: "📢", desc: "Official news and updates." },
  { key: "hacking", label: "Hacking", icon: "💻", desc: "Security, scripts, guides, tools." },
  { key: "cracking", label: "Cracking", icon: "🔓", desc: "Reverse engineering, unlocks, leaks." },
  { key: "marketplace", label: "Marketplace", icon: "🛒", desc: "Buy/sell services, bots, accounts." },
];

export default function ForumCategories() {
  return (
    <div className="w-full min-h-[95vh] relative overflow-x-hidden">
      {/* BG GLOW/SHAPES */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-[40vw] h-[30vh] bg-gradient-to-tl from-cyan-400/30 to-fuchsia-500/10 blur-2xl rounded-full" />
        <div className="absolute top-1/4 left-0 w-[25vw] h-[28vh] bg-gradient-to-br from-fuchsia-400/10 to-aqua/10 blur-2xl rounded-full" />
      </div>
      <div className="relative z-10">
        {/* Section "glass" card */}
        <div className="max-w-4xl mx-auto mt-24 mb-24 bg-white/10 border border-cyan-700/40 shadow-[0_6px_36px_0_rgba(0,255,255,0.09)] backdrop-blur-xl rounded-3xl px-0 pb-14 pt-10">
          {/* Hero Title */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-aqua tracking-tight drop-shadow-lg mb-2">
              Community Forum
            </h2>
            <p className="text-lg text-cyan-100/80 font-medium max-w-xl mx-auto drop-shadow">
              Share knowledge, trade, and connect with other users.<br />
              Pick a category to get started.
            </p>
          </div>
          {/* FEATURED ANNOUNCEMENTS */}
          <Link
            to="/forum/announcement"
            className="block mx-auto mb-12 max-w-2xl bg-gradient-to-tr from-aqua to-cyan-700/80 border-2 border-aqua/60 shadow-lg shadow-cyan-300/10
              rounded-2xl px-10 py-8 flex flex-col items-center hover:scale-[1.04] transition"
            style={{ boxShadow: "0 0 0 2px #12fff180, 0 6px 24px #1b2a3855" }}
          >
            <span className="text-5xl mb-3 animate-pulse">{categories[0].icon}</span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-midnight mb-1 tracking-wide drop-shadow">Announcements</h3>
            <p className="text-cyan-900/80 text-base font-semibold drop-shadow">{categories[0].desc}</p>
          </Link>
          {/* CATEGORY LIST */}
          <div className="w-full max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.slice(1).map(cat => (
              <Link
                key={cat.key}
                to={`/forum/${cat.key}`}
                className="group flex flex-col items-center justify-center px-8 py-12 bg-[#212b38]/90 rounded-2xl border-2 border-cyan-900/30 shadow-xl hover:border-aqua hover:shadow-aqua/40 hover:scale-[1.03] transition-all duration-150 relative overflow-hidden"
              >
                {/* Neon icon shadow effect */}
                <span
                  className="text-5xl mb-3"
                  style={{
                    textShadow:
                      "0 0 18px #36f1cd99, 0 2px 8px #14d4ff, 0 0 1.5px #12fff1",
                  }}
                >
                  {cat.icon}
                </span>
                <h4 className="text-2xl font-bold text-aqua mb-2 group-hover:text-white transition">
                  {cat.label}
                </h4>
                <p className="text-cyan-200 text-base opacity-85 text-center font-medium">
                  {cat.desc}
                </p>
                <span className="absolute bottom-6 right-8 text-cyan-400 text-xl group-hover:text-aqua transition">&rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
