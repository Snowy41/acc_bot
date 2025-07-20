import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Username from "./Username";
import {ReputationBar} from "./ReputationBar";
import {TagSection} from "../shared/TagSection";

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
      className="border border-cyan-700/50 bg-[#172230] bg-opacity-95 rounded-3xl shadow-[0_10px_60px_0_rgba(0,255,255,0.11)] p-14"
      style={{
        maxWidth: "1080px",
        minWidth: "620px",
        minHeight: "540px",
        boxShadow: "0 2px 38px 0 #18f0ff22, 0 0 1px #18f0ff55"
      }}
    >
      <div className="flex flex-col items-center w-full">
        {/* AVATAR */}
        <div className="w-28 h-28 mb-5 flex items-center justify-center">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center text-5xl font-bold text-midnight shadow-xl border-4
              ${profile.frame === "gold" ? "border-yellow-300 shadow-yellow-200" : ""}
              ${profile.frame === "aqua-glow" ? "border-cyan-400 shadow-cyan-400/40 animate-glow" : ""}
              ${profile.frame === "rainbow" ? "rainbow-frame" : ""}
              ${!profile.frame ? "border-cyan-400/70" : ""}
            `}
            style={profile.frame === "rainbow"
              ? { borderWidth: 5, borderStyle: "solid", borderImage: "linear-gradient(90deg,#f00,#0ff,#f0f,#0f0,#ff0,#f00) 1" }
              : undefined}
          >
            {profile.avatar ? (
              <div className="w-[93%] h-[93%] rounded-full overflow-hidden">
                <img
                  src={profile.avatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  onError={e => { e.currentTarget.style.display = "none"; }}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-midnight">
                {profile.username[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        </div>

        {/* USERNAME ROW */}
        <div className="flex items-center justify-center mb-3">
          <Username
            animated={parsedColors.length === 2}
            colors={parsedColors}
            className="text-4xl font-extrabold drop-shadow-lg tracking-wide"
            style={parsedColors.length !== 2 ? { color: profile.color || "#fff" } : undefined}
          >
            {profile.username}
          </Username>
          {profile.isAdmin && (
            <span className="ml-3 text-yellow-300 text-2xl drop-shadow-glow" title="Admin">🛡️</span>
          )}
          {profile.tags?.includes("Founder") && (
            <span className="ml-2 text-pink-400 text-2xl drop-shadow-glow" title="Founder">👑</span>
          )}
          {profile.tags?.includes("Premium") && (
            <span className="ml-2 text-blue-400 text-2xl drop-shadow-glow" title="Premium">💎</span>
          )}
        </div>

        {/* USERTAG & ID */}
        <div className="flex items-center justify-center mb-2">
          <span className="text-cyan-300 font-mono text-lg tracking-tight">@{profile.usertag}</span>
          {profile.uid && (
            <span className="ml-3 text-xs px-3 py-0.5 rounded-full border border-cyan-800/40 bg-cyan-900/30 font-mono text-cyan-200 shadow-inner"
              style={{ letterSpacing: "0.06em", opacity: 0.9 }}
              title="Internal User ID"
            >
              ID: {profile.uid}
            </span>
          )}
        </div>

        {/* TAGS */}
        <TagSection tags={profile.tags || []} />

        {/* STATUS BADGES */}
        <div className="flex gap-4 mb-5 justify-center">
          {profile.isBanned && (
            <span className="bg-red-700/80 text-white text-xs px-4 py-1 rounded-xl border border-red-400/50 shadow font-bold uppercase tracking-wider">Banned</span>
          )}
          {profile.isMuted && (
            <span className="bg-yellow-600/80 text-white text-xs px-4 py-1 rounded-xl border border-yellow-300/50 shadow font-bold uppercase tracking-wider">Muted</span>
          )}
        </div>

        {/* BIO */}
        <p className="text-cyan-100 text-center mb-8 text-base leading-relaxed max-w-xl px-3">{profile.bio}</p>

        {/* SOCIAL LINKS (cyber style) */}
        {profile.social && (
          <div className="flex gap-8 mb-10 items-center justify-center">
            {profile.social.github && (
              <a href={profile.social.github} target="_blank" rel="noopener noreferrer" title="GitHub"
                className="hover:text-aqua transition text-3xl text-cyan-400 glow-link">
                <i className="fab fa-github"></i>
              </a>
            )}
            {profile.social.discord && (
              <a
                href={`https://discord.com/users/${profile.social.discord.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                title={profile.social.discord}
                className="hover:text-aqua transition text-3xl text-[#7289da] glow-link"
              >
                <i className="fab fa-discord"></i>
              </a>
            )}
            {profile.social.twitter && (
              <a href={profile.social.twitter} target="_blank" rel="noopener noreferrer" title="Twitter"
                className="hover:text-aqua transition text-3xl text-cyan-400 glow-link">
                <i className="fab fa-twitter"></i>
              </a>
            )}
          </div>
        )}

        {/* REPUTATION BAR AT THE VERY BOTTOM */}
        {typeof profile.reputation === "number" && (
          <div className="mt-10 w-full flex justify-center">
            <ReputationBar rep={profile.reputation} />
          </div>
        )}

        {/* FRIEND / REMOVE / EDIT BUTTONS */}
        <div className="mt-8 flex flex-col items-center gap-3 w-full">
          {currentUser && currentUser !== profile.usertag && (
            isFriend ? (
              <button
                className="w-48 px-5 py-2 bg-gradient-to-r from-red-600 via-pink-600 to-red-400 text-white rounded-xl font-semibold hover:bg-red-700 shadow transition"
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
                className="w-48 px-5 py-2 bg-gradient-to-r from-cyan-400 via-aqua to-blue-400 text-midnight rounded-xl font-semibold hover:bg-cyan-500 shadow transition"
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

          {currentUser && currentUser === profile.usertag && (
            <button
              className="w-48 px-5 py-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 text-midnight rounded-xl font-semibold hover:bg-cyan-400 shadow transition"
              onClick={() => navigate(`/profile/${profile.usertag}/edit`)}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
    {/* Tag/owner/founder glows etc — CSS is in your tags.css */}
    <style>{`
      .glow-link {
        filter: drop-shadow(0 0 6px #12fff1bb);
        transition: filter 0.2s;
      }
      .glow-link:hover {
        filter: drop-shadow(0 0 18px #13f0ff) brightness(1.25);
      }
      .drop-shadow-glow { filter: drop-shadow(0 0 6px #19e3f5); }
      .rainbow-frame {
        border: 3px solid;
        border-image: linear-gradient(90deg, #f00, #0ff, #f0f, #0f0, #ff0, #f00) 1;
      }
    `}</style>
  </div>
);



}
