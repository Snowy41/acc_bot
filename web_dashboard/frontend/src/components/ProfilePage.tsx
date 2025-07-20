import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Username from "./Username";
import {ReputationBar} from "./ReputationBar";

interface Profile {
  username: string;     // Display name
  usertag: string;      // Unique tag (string/number)
  uid?: number;         // Unique ID (optional)
  isAdmin?: boolean;
  isBanned?: boolean;
  isMuted?: boolean;
  bio?: string;
  tags?: string[];
  color?: string;
  frame?: string;
  banner?: string;
  isOnline?: boolean;
  social?: { github?: string; discord?: string; twitter?: string };
  avatar?: string;     // URL to avatar image
  role?: string; // <-- Add this!
  animatedColors?: string[];
  reputation?: number;
}

export default function ProfilePage() {
  const {usertag = "" } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const navigate = useNavigate();
  const [isFriend, setIsFriend] = useState(false);



  useEffect(() => {
      fetch(`/api/users/${usertag}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (data) setProfile(data);
    })
    .catch((err) => {
      console.error("Profile fetch error:", err);
      setNotFound(true);
    });
fetch("/api/auth/status", { credentials: "include" })
  .then(res => res.json())
  .then(data => {
    setCurrentUser(data.usertag || "");
        // ✅ check if they are friends
      if (data.usertag && data.usertag !== usertag) {
          fetch("/api/friends/list", { credentials: "include" })
            .then(res => res.json())
            .then(friendData => {
              if (Array.isArray(friendData.friends) && friendData.friends.includes(usertag)) {
                setIsFriend(true);
              }
            });
        }
    });
  }, [usertag]);

    if (notFound) return <div className="p-12 text-red-400 text-center">User not found</div>;
    if (!profile) return <div className="p-12 text-white text-center">Loading profile...</div>;

    // ✅ Now it's safe to access profile.animatedColors
    let parsedColors: string[] = [];

    try {
      parsedColors =
        typeof profile.animatedColors === "string"
          ? JSON.parse(profile.animatedColors)
          : Array.isArray(profile.animatedColors)
          ? profile.animatedColors
          : [];
    } catch (e) {
      console.warn("Invalid animatedColors in ProfilePage:", profile.animatedColors);
      parsedColors = [];
}


return (
  <div className="min-h-screen w-full flex flex-col items-center justify-center">
    <div
      className="border border-cyan-900/40 rounded-2xl shadow-2xl p-10"
      style={{
        background: "rgba(25, 33, 42, 0.80)",
        maxWidth: "min(98vw, 680px)",
        width: "fit-content",
        minWidth: "340px"
      }}
    >
      <div className="flex flex-col items-center w-full">

        {/* AVATAR */}
        <div className="w-24 h-24 flex items-center justify-center mb-4 relative">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl font-bold text-midnight
              shadow-xl border-2
              ${profile.frame === "gold" ? "border-yellow-400 shadow-yellow-300" : ""}
              ${profile.frame === "aqua-glow" ? "border-aqua shadow-aqua animate-glow" : ""}
              ${profile.frame === "rainbow" ? "rainbow-frame" : ""}
              ${!profile.frame ? "border-aqua/70" : ""}
            `}
            style={
              profile.frame === "rainbow"
                ? {
                  borderWidth: 4,
                  borderStyle: "solid",
                  borderImage: "linear-gradient(90deg, #f00, #0ff, #f0f, #0f0, #ff0, #f00) 1"
                }
                : undefined
            }
          >
            {profile.avatar && profile.avatar !== "" ? (
              <div className="w-[92%] h-[92%] rounded-full overflow-hidden">
                <img
                  src={profile.avatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-midnight">
                {profile.username[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        </div>

        {/* === THE BATCH ROW: Username, Badges, Rep Bar === */}
        <div className="flex flex-row items-center justify-center gap-4 mb-2 w-full">
          <span className="flex items-center">
            <Username
              animated={parsedColors.length === 2}
              colors={parsedColors}
              className="text-3xl"
              style={
                parsedColors.length !== 2
                  ? { color: profile.color || "#fff" }
                  : undefined
              }
            >
              {profile.username}
            </Username>
            {profile.isAdmin && (
              <span className="ml-2 text-yellow-300 text-xl" title="Admin">🛡️</span>
            )}
            {profile.tags?.includes("Founder") && (
              <span className="ml-2 text-pink-400 text-xl" title="Founder">👑</span>
            )}
            {profile.tags?.includes("Premium") && (
              <span className="ml-2 text-blue-400 text-xl" title="Premium">💎</span>
            )}
          </span>
          {typeof profile.reputation === "number" && (
            <span className="flex-shrink-0">
              <ReputationBar rep={profile.reputation} />
            </span>
          )}
        </div>

        {/* @usertag and ID, centered below batch */}
        <div className="flex items-center justify-center mb-2">
          <span className="text-cyan-300 font-mono text-base">@{profile.usertag}</span>
          {profile.uid && (
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded border border-cyan-900/40 font-mono"
              style={{
                background: 'rgba(120,130,140,0.08)',
                color: '#90a0b7',
                opacity: 0.7,
                letterSpacing: '0.05em'
              }}
              title="Internal User ID"
            >
              ID: {profile.uid}
            </span>
          )}
        </div>

        {/* TAGS */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {profile.tags && profile.tags.length > 0 &&
            profile.tags.map(tag => {
              const lower = tag.toLowerCase();
              if (lower === "owner") {
                return (
                  <span
                    key={tag}
                    className="relative inline-flex items-center px-4 py-1 rounded-full font-semibold text-xs
                      bg-gradient-to-r from-pink-500 via-aqua to-cyan-400
                      text-white shadow-md border-2 border-aqua
                      animate-pulse-owner overflow-hidden"
                    style={{ boxShadow: "0 0 16px 2px #12fff1cc, 0 0 2px #ff3b82cc" }}
                  >
                    <span className="z-10 font-bold tracking-wide">Owner</span>
                    <span className="absolute left-0 top-0 w-full h-full pointer-events-none">
                      <span className="absolute left-2 top-1 w-2 h-2 bg-white/70 rounded-full animate-sparkle"></span>
                      <span className="absolute right-3 bottom-1 w-1.5 h-1.5 bg-yellow-400/80 rounded-full animate-sparkle2"></span>
                    </span>
                  </span>
                );
              }
              if (lower === "founder") {
                return (
                  <span
                    key={tag}
                    className="relative inline-flex items-center px-4 py-1 rounded-full font-semibold text-xs
                      bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-500
                      text-yellow-900 shadow-md border-2 border-yellow-400
                      animate-shimmer-founder overflow-hidden"
                    style={{
                      boxShadow: "0 0 16px 3px #ffe06688, 0 0 2px #fbbf24cc"
                    }}
                  >
                    <span className="z-10 font-bold tracking-wide flex items-center">
                      <span className="mr-1">👑</span>Founder
                    </span>
                    <span className="absolute inset-0 w-full h-full pointer-events-none">
                      <span className="absolute left-1/2 top-1/2 w-16 h-16 bg-yellow-200/50 rounded-full blur-2xl opacity-60 animate-founder-glow"></span>
                      <span className="absolute left-1/2 top-1/2 w-10 h-10 bg-white/30 rounded-full blur opacity-30 animate-founder-glow2"></span>
                    </span>
                  </span>
                );
              }
              return (
                <span
                  key={tag}
                  className="bg-cyan-900/60 text-cyan-200 text-xs px-3 py-1 rounded-full border border-cyan-700 shadow-sm"
                >
                  {tag}
                </span>
              );
            })
          }
        </div>

        {/* STATUS BADGES */}
        <div className="flex gap-4 mb-4">
          {profile.isBanned && (
            <span className="bg-red-700/70 text-white text-xs px-3 py-1 rounded-full">Banned</span>
          )}
          {profile.isMuted && (
            <span className="bg-yellow-600/60 text-white text-xs px-3 py-1 rounded-full">Muted</span>
          )}
          {profile.isAdmin && (
            <span className="bg-aqua/80 text-midnight text-xs px-3 py-1 rounded-full font-bold">Admin</span>
          )}
        </div>

        {/* BIO */}
        <p className="text-white text-center mb-6">{profile.bio}</p>

        {/* Social Links */}
        {profile.social && (
          <div className="flex gap-6 mt-3 items-center justify-center">
            {/* ...social links as before... */}
          </div>
        )}

        {/* Friend/Remove/Edit Buttons */}
        {currentUser && currentUser !== profile.usertag && (
          isFriend ? (
            <button
              className="mt-4 px-5 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
              onClick={async () => {
                await fetch("/api/friends/remove", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ friendTag: profile.usertag }),
                });
                setIsFriend(false);
              }}
            >
              Remove Friend
            </button>
          ) : (
            <button
              className="mt-4 px-5 py-2 bg-aqua text-midnight rounded-lg font-semibold hover:bg-cyan-400 transition"
              onClick={async () => {
                const res = await fetch("/api/friends/add", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ friendTag: profile.usertag }),
                });
                const data = await res.json();
                alert(data.message || "Friend request sent!");
              }}
            >
              Add Friend
            </button>
          )
        )}

        {/* EDIT BUTTON */}
        {currentUser && currentUser === profile.usertag && (
          <button
            className="px-5 py-2 bg-aqua text-midnight rounded-lg font-semibold mt-6 hover:bg-cyan-400 transition"
            onClick={() => navigate(`/profile/${profile.usertag}/edit`)}
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
    {/* Animations for tags/badges... */}
    <style>{`
      @keyframes glowPulse {
        0% { box-shadow: 0 0 4px #00ffff88, 0 0 8px #00ffff44; }
        50% { box-shadow: 0 0 12px #00ffffaa, 0 0 24px #00ffff77; }
        100% { box-shadow: 0 0 4px #00ffff88, 0 0 8px #00ffff44; }
      }
      .animate-glow {
        animation: glowPulse 2s ease-in-out infinite;
      }
    `}</style>
  </div>
);


}
