import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { HomeIcon, ClipboardDocumentListIcon, Bars3Icon, XMarkIcon, UserGroupIcon } from "@heroicons/react/24/outline";

const nav = [
  { name: "Home", icon: HomeIcon, key: "home", path: "/" },
  { name: "Logs", icon: ClipboardDocumentListIcon, key: "logs", path: "/logs" },
  { name: "Forum", icon: UserGroupIcon, key: "forum", path: "/forum" },
  { name: "Bot Selection", icon: UserGroupIcon, key: "botSelection", path: "/botSelection" },
];

export default function Sidebar({
  active,
  setActive,
  isAdmin,
}: { active: string, setActive: (k: string) => void, isAdmin?: boolean }) {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    const activeNav = nav.find((item) => item.path === currentPath);
    if (activeNav) {
      setActive(activeNav.key);
    }
    if (currentPath === "/admin") setActive("admin-panel");
  }, [location, setActive]);

  return (
    <div className={`flex flex-col h-screen bg-white/10 border-r border-cyan-800/30 backdrop-blur-2xl shadow-[0_10px_60px_0_rgba(0,255,255,0.06)] transition-all duration-300 z-10 ${open ? "w-56" : "w-16"}`}>
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <button
          onClick={() => setOpen((o) => !o)}
          className="p-2 hover:bg-midnight/40 rounded transition"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? <XMarkIcon className="h-6 w-6 text-aqua" /> : <Bars3Icon className="h-6 w-6 text-aqua" />}
        </button>
      </div>
      <nav className="flex-1 flex flex-col mt-2 gap-2">
        {nav.slice(0, 1).map((item) => (
          <Link
            key={item.key}
            to={item.path}
            className={`group flex items-center gap-3 px-4 py-3 mx-1 rounded-xl transition
              ${active === item.key ? "bg-gradient-to-tr from-aqua to-cyan-800 text-midnight shadow-md" : "hover:bg-cyan-900/30 hover:text-aqua"}
              ${open ? "justify-start" : "justify-center"}
            `}
            onClick={() => setActive(item.key)}
            style={active === item.key ? { boxShadow: "0 0 14px #12fff188" } : {}}
          >
            <item.icon className={`h-6 w-6 ${active === item.key ? "text-midnight" : "text-cyan-400 group-hover:text-aqua"}`} />
            {open && <span className={`font-bold ${active === item.key ? "text-midnight" : "text-white"}`}>{item.name}</span>}
          </Link>
        ))}

        {/* Admin Panel Button */}
        {isAdmin && (
          <Link
            to="/admin"
            className={`group flex items-center gap-3 px-4 py-3 mx-1 rounded-xl transition font-bold bg-gradient-to-tr from-yellow-400 to-yellow-300 text-midnight shadow-lg border-2 border-yellow-400 my-2
              ${open ? "justify-start" : "justify-center"}
            `}
            onClick={() => setActive("admin-panel")}
            style={{ boxShadow: "0 0 16px #f2d02499" }}
          >
            <span className="h-6 w-6 flex items-center justify-center">🛡️</span>
            {open && <span className="font-bold">Admin Panel</span>}
          </Link>
        )}

        {/* Render the rest of the nav */}
        {nav.slice(1).map((item) => (
          <Link
            key={item.key}
            to={item.path}
            className={`group flex items-center gap-3 px-4 py-3 mx-1 rounded-xl transition
              ${active === item.key ? "bg-gradient-to-tr from-aqua to-cyan-800 text-midnight shadow-md" : "hover:bg-cyan-900/30 hover:text-aqua"}
              ${open ? "justify-start" : "justify-center"}
            `}
            onClick={() => setActive(item.key)}
            style={active === item.key ? { boxShadow: "0 0 14px #12fff188" } : {}}
          >
            <item.icon className={`h-6 w-6 ${active === item.key ? "text-midnight" : "text-cyan-400 group-hover:text-aqua"}`} />
            {open && <span className={`font-bold ${active === item.key ? "text-midnight" : "text-white"}`}>{item.name}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
