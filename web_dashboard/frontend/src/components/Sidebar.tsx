import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  Bars3Icon,
  XMarkIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const nav = [
  { name: "Home", icon: HomeIcon, key: "home", path: "/" },
  { name: "Forum", icon: UserGroupIcon, key: "forum", path: "/forum" },
  { name: "Shop", icon: ShoppingBagIcon, key: "shop", path: "/shop" },
  { name: "Logs", icon: ClipboardDocumentListIcon, key: "logs", path: "/logs" },
  { name: "Bot Selection", icon: UserGroupIcon, key: "botSelection", path: "/botSelection" },
  { name: "Support", icon: ClipboardDocumentListIcon, key: "support", path: "/support" },
];

export default function Sidebar({
  active,
  setActive,
  isAdmin,
  isPremium,
  isModerator,   // <--- ADD THIS
}: {
  active: string,
  setActive: (k: string) => void,
  isAdmin?: boolean,
  isPremium?: boolean,
  isModerator?: boolean,   // <--- ADD THIS
}) {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    const activeNav = nav.find((item) => item.path === currentPath);
    if (activeNav) setActive(activeNav.key);
    if (currentPath === "/admin") setActive("admin-panel");
    if (currentPath === "/moderation") setActive("moderation");
  }, [location, setActive]);

  return (
    <div
      className={`
        flex flex-col h-screen transition-all duration-300 z-20
        ${open ? "w-60" : "w-20"}
        border-r border-cyan-800/40
        shadow-[8px_0_28px_0_rgba(21,235,255,0.13)]
        backdrop-blur-2xl
        relative
      `}
      style={{
        backgroundColor: "rgba(16, 24, 41, 0.80)",
        boxShadow:
          "8px 0 24px 0 #19e3f566, 0 4px 40px 0 #18f0ff18, 0 0px 0px 1px #1bd6e811",
        borderRight: "2.5px solid rgba(18,244,255,0.09)"
      }}
    >
      <div className="flex items-center h-[56px] px-3">
        {open && (
          <img
            src="/logo_for_website.png"
            alt="Vanish Logo"
            className="h-[42px] w-auto mr-2 rounded drop-shadow"
            style={{ objectFit: "contain", maxHeight: "42px" }}
            draggable={false}
          />
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          className="ml-auto p-2 hover:bg-cyan-800/20 rounded transition"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {open ? (
            <XMarkIcon className="h-7 w-7 text-aqua drop-shadow-[0_0_6px_#18f0ff]" />
          ) : (
            <Bars3Icon className="h-7 w-7 text-aqua drop-shadow-[0_0_6px_#18f0ff]" />
          )}
        </button>
      </div>
      <nav className="flex-1 flex flex-col mt-2 gap-2">
        {nav.slice(0, 1).map((item) => (
          <SidebarItem
            key={item.key}
            item={item}
            open={open}
            active={active}
            setActive={setActive}
          />
        ))}
        {isAdmin && (
          <Link
            to="/admin"
            className={`
              group flex items-center gap-3 px-4 py-3 mx-1 rounded-xl transition font-bold
              bg-gradient-to-tr from-[#ffe97a] via-yellow-400 to-[#fff7cc]
              text-midnight shadow-[0_0_16px_#ffe97a99]
              border border-yellow-300/50 relative overflow-hidden
              ${open ? "justify-start" : "justify-center"}
            `}
            onClick={() => setActive("admin-panel")}
            style={{
              boxShadow: "0 0 18px #ffe97aaa, 0 0 0 2px #ffd30030",
              border: "1.5px solid #ffe97a88",
              opacity: 1,
            }}
          >
            <span className="h-6 w-6 flex items-center justify-center drop-shadow-[0_0_4px_#ffe97a99]">🛡️</span>
            {open && <span className="font-bold">Admin Panel</span>}
            <span className="absolute top-0 right-0 h-2 w-2 bg-yellow-400 rounded-full shadow-lg animate-pulse"></span>
          </Link>
        )}
        {(isAdmin || isModerator) && (
          <Link
            to="/moderation"
            className={`
              group flex items-center gap-3 px-4 py-3 mx-1 rounded-xl transition font-bold
              bg-gradient-to-tr from-[#b2bfff] via-indigo-400 to-[#b4bfff]
              text-midnight shadow-[0_0_16px_#7da8fa77]
              border border-indigo-400/50 my-2 relative overflow-hidden
              ${open ? "justify-start" : "justify-center"}
            `}
            onClick={() => setActive("moderation")}
            style={{
              boxShadow: "0 0 18px #b2bfff88, 0 0 0 2px #7da8fa33",
              border: "1.5px solid #7da8fa88",
              opacity: 1,
            }}
          >
            <span className="h-6 w-6 flex items-center justify-center drop-shadow-[0_0_4px_#7da8fa]">
              <ShieldCheckIcon className="h-6 w-6 text-indigo-400" />
            </span>
            {open && <span className="font-bold">Moderation</span>}
            <span className="absolute top-0 right-0 h-2 w-2 bg-indigo-400 rounded-full shadow-lg animate-pulse"></span>
          </Link>
        )}
        {nav.slice(1).map((item) => {
          if (
            (item.key === "logs" || item.key === "botSelection") &&
            !isPremium
          ) return null;
          return (
            <SidebarItem
              key={item.key}
              item={item}
              open={open}
              active={active}
              setActive={setActive}
            />
          );
        })}
      </nav>
    </div>
  );
}

// --- SidebarItem ---

function SidebarItem({
  item,
  open,
  active,
  setActive,
}: {
  item: { name: string; icon: any; key: string; path: string };
  open: boolean;
  active: string;
  setActive: (k: string) => void;
}) {
  const isActive = active === item.key;

  return (
    <Link
      to={item.path}
      className={`
        group flex items-center gap-3 px-4 py-3 mx-1 rounded-xl transition-all duration-150 relative
        ${isActive
          ? "bg-gradient-to-tr from-[#22f0ff] to-[#1257c7] text-midnight shadow-[0_0_16px_#22f0ffcc] opacity-100"
          : "bg-transparent hover:bg-white/10 text-white/80 opacity-80"
        }
        ${open ? "justify-start" : "justify-center"}
      `}
      onClick={() => setActive(item.key)}
      style={
        isActive
          ? { boxShadow: "0 0 16px #12fff199, 0 1px 6px 1px #0ff7", opacity: 1 }
          : { opacity: 0.80 }
      }
    >
      <item.icon
        className={`
          h-6 w-6
          ${isActive
            ? "text-midnight drop-shadow-[0_0_6px_#1bd6e8]"
            : "text-cyan-400 group-hover:text-aqua transition-colors duration-150"
          }
        `}
      />
      {open && (
        <span
          className={`font-semibold tracking-wide text-[1.08rem] transition-all
            ${isActive ? "text-midnight" : "text-cyan-50 group-hover:text-aqua"}
          `}
        >
          {item.name}
        </span>
      )}
      {isActive && (
        <span className="absolute -left-2 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-aqua shadow-lg blur-[1px]"></span>
      )}
    </Link>
  );
}
