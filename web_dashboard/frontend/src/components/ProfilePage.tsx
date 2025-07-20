import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Username from "./Username";
import {ReputationBar} from "./ReputationBar";
import {TagSection} from "./TagSection";

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
      className="border border-cyan-900/40 rounded-2xl shadow-2xl p-16"
      style={{
        background: "rgba(25, 33, 42, 0.88)",
        maxWidth: "1080px",
        minWidth: "620px",
        minHeight: "520px",
      }}
    >
      <div className="flex flex-col items-center w-full">
        {/* AVATAR */}
        <div className="w-24 h-24 mb-4 flex items-center justify-center">
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

        {/* Username + badges row, centered */}
        <div className="flex flex-row items-center justify-center mb-2">
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
        </div>

        {/* @usertag and ID row, centered */}
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

        {/* TAGS row — now a dedicated component! */}
        <TagSection tags={profile.tags || []} />

        {/* STATUS BADGES row, centered */}
        <div className="flex gap-4 mb-4 justify-center">
          {profile.isBanned && (
            <span className="bg-red-700/70 text-white text-xs px-3 py-1 rounded-full">Banned</span>
          )}
          {profile.isMuted && (
            <span className="bg-yellow-600/60 text-white text-xs px-3 py-1 rounded-full">Muted</span>
          )}
        </div>

        {/* BIO row, centered */}
        <p className="text-white text-center mb-6">{profile.bio}</p>

        {/* SOCIAL LINKS row, centered */}
        {profile.social && (
          <div className="flex gap-6 mb-6 items-center justify-center">
            {/* GitHub */}
            {profile.social.github && (
              <a href={profile.social.github} target="_blank" rel="noopener noreferrer" title="GitHub"
                className="text-aqua hover:text-white text-2xl transition">
                <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2.1c-3.2.7-3.9-1.5-3.9-1.5-.5-1.2-1.2-1.5-1.2-1.5-1-.6.1-.6.1-.6 1.1.1 1.7 1.1 1.7 1.1 1 .1.7 2.2 2.6 2.5.5-.5.8-1.2.8-1.7-2.6-.3-5.4-1.3-5.4-5.7 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.7.1-3.4 0 0 1-.3 3.2 1.1.9-.3 1.8-.5 2.7-.5s1.8.2 2.7.5c2.2-1.4 3.2-1.1 3.2-1.1.6 1.7.2 3.1.1 3.4.8.9 1.2 2 1.2 3.2 0 4.4-2.8 5.4-5.5 5.7.4.3.8 1 .8 2.1v3c0 .3.2.7.8.6C20.7 21.4 24 17.1 24 12c0-6.3-5.2-11.5-12-11.5z"/></svg>
              </a>
            )}
            {/* Discord */}
            {profile.social.discord && (
              <span
                className="text-[#7289da] hover:text-aqua transition text-2xl cursor-pointer"
                title={profile.social.discord}
              >
                {/* Discord SVG */}
                <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                </svg>
              </span>
            )}
            {/* Twitter */}
            {profile.social.twitter && (
              <a href={profile.social.twitter} target="_blank" rel="noopener noreferrer" title="Twitter"
                className="text-cyan-400 hover:text-aqua text-2xl transition">
                <svg className="inline" width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.6a9.8 9.8 0 0 1-2.8.8A4.8 4.8 0 0 0 23.3 3a9.7 9.7 0 0 1-3 1.2A4.8 4.8 0 0 0 16.6 3c-2.7 0-4.8 2.2-4.8 4.8 0 .4 0 .8.1 1.1A13.5 13.5 0 0 1 3 4a4.7 4.7 0 0 0-.6 2.4c0 1.7.9 3.3 2.3 4.2a4.8 4.8 0 0 1-2.2-.6v.1c0 2.4 1.7 4.4 4 4.9a4.7 4.7 0 0 1-2.1.1 4.8 4.8 0 0 0 4.5 3.3A9.7 9.7 0 0 1 2 19.5a13.7 13.7 0 0 0 7.5 2.2c9.1 0 14-7.6 14-14.1 0-.2 0-.4 0-.5A9.6 9.6 0 0 0 24 4.6z"/>
                </svg>
              </a>
            )}
          </div>
        )}

        {/* REPUTATION BAR */}
        {typeof profile.reputation === "number" && (
          <div className="mt-8 flex justify-center w-full">
            <ReputationBar rep={profile.reputation} />
          </div>
        )}
        {/* FRIEND/REMOVE/EDIT BUTTONS */}
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
