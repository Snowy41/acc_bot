import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal";
import Username from "./Username";

interface ProfilePanelProps {
  loggedIn: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
  user: string;
  setUser: (user: string) => void;
  userColor: string;
  displayName: string;
  userAvatar: string;
  userRole: string;
  animatedColors?: string[];
}


export default function ProfilePanel({
  loggedIn,
  setLoggedIn,
  user,
  setUser,
  userColor,
  displayName,
  userAvatar,
  userRole,
  animatedColors, // ✅ ADD THIS LINE

}: ProfilePanelProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const [userTags, setUserTags] = useState<string[]>([]);

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
        <div className="flex items-center gap-4 select-none">
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
    <div className="relative flex items-center gap-3 select-none z-50">
      {/* Profile Button */}
      <button
        className={`
          flex items-center gap-3 px-4 py-2 rounded-2xl shadow-lg border border-cyan-300/30
          bg-gradient-to-tr from-cyan-900/50 via-[#192f44]/80 to-cyan-800/30
          backdrop-blur-xl transition hover:bg-cyan-800/40 focus:outline-none relative
          group
        `}
        style={{
          boxShadow: "0 2px 18px #12fff155, 0 1px 5px #13e0f544",
        }}
        onClick={() => setDropdownOpen(v => !v)}
        tabIndex={0}
      >
        <span className="w-10 h-10 rounded-full overflow-hidden border-2 border-aqua/80 shadow-[0_0_8px_#18f0ff44] bg-midnight flex items-center justify-center">
          {userAvatar && userAvatar !== "" ? (
            <img
              src={userAvatar}
              alt="avatar"
              className="w-full h-full object-cover"
              onError={e => {
                e.currentTarget.style.display = "none";
              }}
              draggable={false}
            />
          ) : (
            <span className="text-2xl text-aqua font-bold flex items-center justify-center w-full h-full">
              👤
            </span>
          )}
        </span>
        <Username
          animated={Array.isArray(animatedColors) && animatedColors.length === 2}
          colors={animatedColors}
          className="font-semibold text-cyan-50 max-w-[120px] truncate text-base tracking-wide"
          style={
            !animatedColors?.length
              ? {
                  color: userColor || "#ffffff",
                  textShadow: "0 0 5px #12fff155",
                }
              : undefined
          }
        >
          {displayName}
        </Username>

        <svg className="w-4 h-4 ml-1 text-cyan-300 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {/* Dropdown */}
      {dropdownOpen && (
        <div
          className="absolute top-14 right-0 w-52 rounded-2xl shadow-2xl border border-cyan-900/40 bg-[#16293d]/90
                     animate-fade-in p-2 z-50"
          style={{
            boxShadow: "0 4px 32px #18f0ff44, 0 0 0 2px #18f0ff22",
            minWidth: 180,
          }}
          onClick={e => e.stopPropagation()}
        >
          <Link
            to={`/profile/${user}`}
            className="block w-full text-left px-5 py-3 rounded-xl text-aqua font-semibold hover:bg-cyan-900/30 hover:text-cyan-50 transition"
            onClick={() => setDropdownOpen(false)}
            tabIndex={0}
          >
            View Profile
          </Link>
          <button
            className="w-full text-left px-5 py-3 rounded-xl text-red-300 font-semibold hover:bg-red-700/20 hover:text-red-100 border-t border-cyan-900/20 transition mt-1"
            onClick={e => {
              e.stopPropagation();
              logout();
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
