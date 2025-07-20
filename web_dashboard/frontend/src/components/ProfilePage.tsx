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
          className="relative border border-cyan-900/40 rounded-2xl shadow-2xl p-10 bg-[rgba(25,33,42,0.80)]"
          style={{
            width: "540px", // set this to your desired profile card width
            minWidth: "340px",
            maxWidth: "95vw",
          }}
        >
          {/* Grid: 3 columns, Avatar perfectly centered in col 2 */}
          <div className="grid grid-cols-3 gap-0 items-start w-full">
            {/* Left: empty for spacing */}
            <div />
            {/* Center: avatar */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 mb-4 flex items-center justify-center">
                {/* Avatar code as before */}
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
            </div>
            {/* Right: empty */}
            <div />
            {/* Below: the "batch" row, starts in col 2, ends in col 3 */}
            <div />
            <div className="col-span-2 flex flex-row items-center w-full" style={{marginLeft: "0"}}>
              {/* Username + badges */}
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
                <span className="ml-6">
                  <ReputationBar rep={profile.reputation} />
                </span>
              )}
            </div>
            <div />
            {/* Now below, center rest of card as normal */}
            <div className="col-span-3 flex flex-col items-center w-full">
              {/* Usertag and ID */}
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
              {/* Tags row, centered */}
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                {/* ...tags... */}
              </div>
              {/* ...rest of profile, all centered... */}
            </div>
          </div>
        </div>
        {/* CSS for glows... */}
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
