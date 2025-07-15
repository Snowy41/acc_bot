import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
}

export default function ProfilePage() {
  const { usertag = "" } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/users/${usertag}`)
      .then(res => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) setProfile(data);
      });
    fetch("/api/auth/status", { credentials: "include" })
      .then(res => res.json())
      .then(data => setCurrentUser(data.usertag || ""));
  }, [usertag]);

  if (notFound) return <div className="p-12 text-red-400 text-center">User not found</div>;
  if (!profile) return <div className="p-12 text-white text-center">Loading profile...</div>;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#111925] to-[#19283a]">
      <div className="bg-[#19212a] border border-cyan-900/40 rounded-2xl shadow-2xl p-10 max-w-lg w-full">
        <div className="flex flex-col items-center">

          {/* AVATAR WITH FRAME */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl font-bold text-midnight mb-4
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

          {/* DISPLAY NAME + BADGES */}
          <div className="flex items-center gap-3 mb-1">
            <h1
              className={
                "text-3xl font-bold" +
                (["owner", "rainbow"].includes((profile.frame || "").toLowerCase()) ||
                 profile.tags?.some(t => t.toLowerCase() === "owner" || t.toLowerCase() === "premium")
                  ? " username-animated-gradient"
                  : ""
                )
              }
              style={{ color: profile.color || "#fff" }}
            >
              {profile.username}
            </h1>
            {profile.isAdmin && (
              <span className="text-yellow-300 text-xl" title="Admin">
                🛡️
              </span>
            )}
            {profile.tags?.includes("Founder") && (
              <span className="text-pink-400 text-xl" title="Founder">
                👑
              </span>
            )}
            {profile.tags?.includes("Premium") && (
              <span className="text-blue-400 text-xl" title="Premium">
                💎
              </span>
            )}
          </div>

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
          <div className="flex flex-wrap gap-2 mb-4">
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

            {profile.social && (
              <div className="flex gap-6 mt-3 items-center justify-center">
                {/* GitHub */}
                {profile.social.github && (
                  <a href={profile.social.github} target="_blank" rel="noopener noreferrer" title="GitHub" className="text-aqua hover:text-white text-2xl">
                    <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2.1c-3.2.7-3.9-1.5-3.9-1.5-.5-1.2-1.2-1.5-1.2-1.5-1-.6.1-.6.1-.6 1.1.1 1.7 1.1 1.7 1.1 1 .1.7 2.2 2.6 2.5.5-.5.8-1.2.8-1.7-2.6-.3-5.4-1.3-5.4-5.7 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.7.1-3.4 0 0 1-.3 3.2 1.1.9-.3 1.8-.5 2.7-.5s1.8.2 2.7.5c2.2-1.4 3.2-1.1 3.2-1.1.6 1.7.2 3.1.1 3.4.8.9 1.2 2 1.2 3.2 0 4.4-2.8 5.4-5.5 5.7.4.3.8 1 .8 2.1v3c0 .3.2.7.8.6C20.7 21.4 24 17.1 24 12c0-6.3-5.2-11.5-12-11.5z"/></svg>
                  </a>
                )}
                {/* Discord */}
                {profile.social.discord && (
                  <div className="relative group flex items-center">
                    <span
                      className="text-[#7289da] hover:text-aqua transition text-2xl cursor-pointer"
                    >
                      {/* Discord SVG */}
                      <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                      </svg>
                    </span>
                    {/* Tooltip on hover */}
                    <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 scale-90 bg-[#232e43] px-4 py-2 rounded-lg border border-cyan-700 text-cyan-200 text-sm shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 whitespace-nowrap">
                      {profile.social.discord}
                    </span>
                  </div>
                )}
                {/* Twitter */}
                {profile.social.twitter && (
                  <a href={profile.social.twitter} target="_blank" rel="noopener noreferrer" title="Twitter" className="text-cyan-400 hover:text-aqua text-2xl">
                    <svg className="inline" width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.6a9.8 9.8 0 0 1-2.8.8A4.8 4.8 0 0 0 23.3 3a9.7 9.7 0 0 1-3 1.2A4.8 4.8 0 0 0 16.6 3c-2.7 0-4.8 2.2-4.8 4.8 0 .4 0 .8.1 1.1A13.5 13.5 0 0 1 3 4a4.7 4.7 0 0 0-.6 2.4c0 1.7.9 3.3 2.3 4.2a4.8 4.8 0 0 1-2.2-.6v.1c0 2.4 1.7 4.4 4 4.9a4.7 4.7 0 0 1-2.1.1 4.8 4.8 0 0 0 4.5 3.3A9.7 9.7 0 0 1 2 19.5a13.7 13.7 0 0 0 7.5 2.2c9.1 0 14-7.6 14-14.1 0-.2 0-.4 0-.5A9.6 9.6 0 0 0 24 4.6z"/>
                    </svg>
                  </a>
                )}
              </div>
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
