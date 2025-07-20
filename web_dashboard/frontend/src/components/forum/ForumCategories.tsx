import { Link } from "react-router-dom";

const categories = [
  { key: "announcement", label: "Announcements", icon: "📢", desc: "Official news and updates." },
  { key: "hacking", label: "Hacking", icon: "💻", desc: "Security, scripts, guides, tools." },
  { key: "cracking", label: "Cracking", icon: "🔓", desc: "Reverse engineering, unlocks, leaks." },
  { key: "marketplace", label: "Marketplace", icon: "🛒", desc: "Buy/sell services, bots, accounts." },
];

export default function ForumCategories() {
  return (
    <div className="w-full min-h-[90vh] relative overflow-x-hidden">
      {/* Background glow shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-[38vw] h-[30vh] bg-gradient-to-tl from-cyan-400/20 to-fuchsia-500/10 blur-2xl rounded-full" />
        <div className="absolute top-1/4 left-0 w-[22vw] h-[24vh] bg-gradient-to-br from-fuchsia-400/10 to-aqua/10 blur-2xl rounded-full" />
      </div>
      <div className="relative z-10">
        {/* Hero Title */}
        <div className="max-w-3xl mx-auto text-center mb-10 mt-16">
          <h2 className="text-4xl md:text-5xl font-black text-aqua tracking-tight mb-2">
            Community Forum
          </h2>
          <p className="text-lg text-cyan-100/80 font-medium max-w-xl mx-auto">
            Welcome to the hub. Pick a category to explore, share, or trade!
          </p>
        </div>
        {/* Announcement/Sticky Card */}
        <Link
          to="/forum/announcement"
          className="block mx-auto mb-12 max-w-2xl bg-white/10 border-2 border-yellow-300/40 shadow-lg
            rounded-2xl px-10 py-8 flex flex-col items-center hover:scale-[1.03] transition"
          style={{ boxShadow: "0 0 12px #ffe06633, 0 6px 24px #1b2a3822" }}
        >
          <span className="text-5xl mb-3">{categories[0].icon}</span>
          <h3 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-1 tracking-wide">
            Announcements
          </h3>
          <p className="text-yellow-900/80 text-base font-semibold">{categories[0].desc}</p>
        </Link>
        {/* Category Grid */}
        <div className="w-full max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-7">
          {categories.slice(1).map(cat => (
            <Link
              key={cat.key}
              to={`/forum/${cat.key}`}
              className="group flex flex-col items-center justify-center px-6 py-10 bg-[#212b38]/90 rounded-2xl border-2 border-cyan-900/30 shadow-xl hover:border-aqua hover:shadow-aqua/40 hover:scale-[1.02] transition-all duration-150 relative overflow-hidden"
            >
              <span className="text-4xl mb-2">{cat.icon}</span>
              <h4 className="text-xl font-bold text-aqua mb-2 group-hover:text-white transition">
                {cat.label}
              </h4>
              <p className="text-cyan-200 text-base text-center font-medium opacity-85">
                {cat.desc}
              </p>
              <span className="absolute bottom-4 right-6 text-cyan-400 text-xl group-hover:text-aqua transition">&rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
