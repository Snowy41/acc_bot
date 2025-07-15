import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal";

interface ProfilePanelProps {
  loggedIn: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
  user: string;
  setUser: (user: string) => void;
  userColor: string;
  displayName: string;
}

export default function ProfilePanel({ loggedIn, setLoggedIn, user, setUser, userColor, displayName }: ProfilePanelProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setLoggedIn(false);
    setUser("");
    setDropdownOpen(false);
    navigate("/");
  };

  if (!loggedIn) {
    return (
      <>
        <div className="fixed top-0 right-0 z-30 flex items-center gap-4 p-4">
          <button
            className="bg-gradient-to-tr from-aqua to-cyan-400 text-midnight px-5 py-2 rounded-full shadow-xl font-bold hover:from-cyan-300 hover:to-aqua transition border-2 border-cyan-400/60"
            onClick={() => setShowLoginModal(true)}
          >
            Log in
          </button>
        </div>
        {showLoginModal && (
          <LoginModal
            onLogin={(username: string) => {
              setLoggedIn(true);
              setUser(username);
              setShowLoginModal(false);
            }}
            onClose={() => setShowLoginModal(false)}
            onRegister={() => {}}
          />
        )}
      </>
    );
  }

  return (
    <div className="fixed top-0 right-0 z-30 flex items-center gap-4 p-4 select-none">
      <div
        className="relative flex items-center gap-2 bg-white/10 border border-cyan-900/40 backdrop-blur-xl rounded-full px-4 py-2 shadow-xl cursor-pointer hover:bg-cyan-900/20 transition"
        onClick={() => setDropdownOpen((v) => !v)}
        tabIndex={0}
        style={{ boxShadow: "0 6px 16px #13e0f544" }}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-aqua to-cyan-500 flex items-center justify-center font-bold text-lg text-midnight shadow-inner border-2 border-aqua/80">
          <span>{displayName[0]?.toUpperCase() || "👤"}</span>
        </div>
        <span className="font-semibold hidden sm:block" style={{ color: userColor }}>
          {displayName}
        </span>
        <svg className="w-4 h-4 ml-1 text-cyan-300 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {dropdownOpen && (
          <div
            className="absolute right-0 top-14 mt-2 w-48 rounded-xl bg-[#232e43]/95 border border-cyan-900/40 shadow-2xl overflow-hidden z-50 animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <Link
              to={`/profile/${user}`}
              className="block w-full text-left px-5 py-3 text-cyan-300 hover:bg-cyan-800/30 hover:text-aqua transition"
              onClick={() => setDropdownOpen(false)}
              tabIndex={0}
            >
              View Profile
            </Link>
            <button
              className="w-full text-left px-5 py-3 text-red-300 hover:bg-red-700/20 hover:text-red-100 border-t border-cyan-900/30 transition"
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
