import {useEffect, useRef, useState} from "react";
import { socket } from "../../socket";
import AdminStatsPanel from "./AdminStatsPanel";
import Username from "../profile/Username";
import {ReputationBar} from "../profile/ReputationBar";
import { TAGS } from "../shared/tags.config";
import { TagSection } from "../shared/TagSection";

interface User {
  username: string;
  usertag: string;
  uid?: number;
  bio?: string;
  is_banned?: boolean;
  is_muted?: boolean;
  color?: string;
  tags?: string[];
  role?: "admin" | "user" | string;
  animatedColors?: string[];
  reputation?: number;
  balance?: number;
}
const timelineSteps = [
  "DAY 1: Refactor, Harden, and Organize Everything",
  "DAY 2: Token/Credit Payments, Escrow, Withdrawals",
  "DAY 3: Security, Anti-Abuse, 'OG' Forums, Panic/Nuke",
  "DAY 4: Offshore Hosting Prep & Migration",
  "DAY 5: Red Team, Testing, Launch Prep"
];

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<User | null>(null);
  const [edit, setEdit] = useState<Partial<User>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [allChats, setAllChats] = useState<{ [key: string]: any[] }>({});
  const [selectedChatKey, setSelectedChatKey] = useState<string | null>(null);
  const [showChats, setShowChats] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [role, setRole] = useState("user");
  const [isPremium, setIsPremium] = useState(false);
  const sortedChatKeys = Object.keys(allChats).sort((a, b) => {
    const lastA = allChats[a]?.[allChats[a].length - 1]?.timestamp || 0;
    const lastB = allChats[b]?.[allChats[b].length - 1]?.timestamp || 0;
    return lastB - lastA; // most recent first
  });
  const [timelineStepIdx, setTimelineStepIdx] = useState(0);
  const [aiScores, setAiScores] = useState<{ [id: string]: number }>({});
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number>(0);

  useEffect(() => {
    fetch("/api/auth/status", {credentials: "include"})
        .then(res => res.json())
        .then(data => {
          setRole(data.role || "user");
          setIsAdmin(data.role === "admin");
          setIsPremium(data.role === "admin" || data.role === "premium");
          if (data.isAdmin) {
            fetch("/api/users", {credentials: "include"})
                .then(res => res.json())
                .then(u => setUsers(u.users || []));
            fetch("/api/admin/chats", {credentials: "include"})
                .then(res => res.json())
                .then(data => {
                  if (data.chats) setAllChats(data.chats);
                });
          }
        })
        .catch(err => {
          console.error("❌ Failed to fetch admin data:", err);
        })
        .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onConnect = () => console.log("✅ Socket connected (AdminPanel)");
    if (!socket.connected) socket.connect();
    socket.on("connect", onConnect);
    return () => {
      socket.off("connect", onConnect);
    };
  }, []);

  useEffect(() => {
    fetch("/api/timeline-step").then(r => r.json()).then(data => {
      setTimelineStepIdx(data.current ?? 0);
    });
  }, []);

  useEffect(() => {
    fetch("/api/admin/ai/scores", {credentials: "include"})
        .then(res => res.json())
        .then(data => setAiScores(data.scores || {}));
  }, []);

  const updateTimelineStep = (idx: number) => {
    fetch("/api/timeline-step", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({step: idx})
    })
        .then(res => res.json())
        .then(data => {
          if (data.ok) setTimelineStepIdx(idx);
        });
  };

  const handleSelect = (user: User) => {
    setSelectedSession(null); // Close AI score editor
    const parsedColors = typeof user.animatedColors === "string"
        ? JSON.parse(user.animatedColors)
        : user.animatedColors;
    setSelected(user);
    setEdit({
      ...user,
      animatedColors: parsedColors ? [...parsedColors] : [],
      tags: user.tags ? [...user.tags] : [],
      color: user.color || "#fff",
      username: user.username || "",
    });
    setSuccessMsg("");
  };

  const handleSave = async () => {
    if (!selected) return;
    await fetch(`/api/users/${selected.usertag}`, {
      method: "PATCH",
      headers: {"Content-Type": "application/json"},
      credentials: "include",
      body: JSON.stringify({
        username: edit.username,
        color: edit.color,
        tags: edit.tags,
        bio: edit.bio,
        role: edit.role || selected.role || "user",
        animatedColors: edit.animatedColors,
        reputation: edit.reputation,
      }),
    });
    setSuccessMsg("Profile updated!");
    fetch("/api/users")
        .then(res => res.json())
        .then(u => setUsers(u.users || []));
  };

  function formatChatLabel(key: string): string {
    const tags = key.split("_");
    if (tags.length !== 2) return key;
    const user1 = users.find(u => u.usertag === tags[0]);
    const user2 = users.find(u => u.usertag === tags[1]);
    const name1 = user1?.username || `@${tags[0]}`;
    const name2 = user2?.username || `@${tags[1]}`;
    return `${name1} ↔ ${name2}`;
  }

  const saveField = async (data: Partial<User>) => {
    if (!selected) return;
    const res = await fetch(`/api/users/${selected.usertag}`, {
      method: "PATCH",
      credentials: "include",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      setSuccessMsg("Saved!");
    }
  };

  const adjustBalance = async (delta: number) => {
    if (!selected) return;
    const res = await fetch("/api/admin/adjust-balance", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      credentials: "include",
      body: JSON.stringify({
        usertag: selected.usertag,
        amount: delta,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setSuccessMsg(`Balance updated (${delta > 0 ? "+" : ""}${delta})`);
    } else {
      setSuccessMsg("Failed to update balance");
    }
  };

  if (loading) return <div className="text-white p-10">Loading...</div>;
  if (!isAdmin) return <div className="text-red-400 p-10">You are not an admin.</div>;

  return (
      <div className="w-full max-w-6xl mx-auto mt-16 mb-16 relative">
        <div className="bg-white/10 border border-cyan-700/40 shadow-[0_6px_36px_0_rgba(0,255,255,0.08)] backdrop-blur-xl rounded-3xl px-0 py-10">
          <h2 className="text-4xl text-aqua font-extrabold mb-6 text-center tracking-wide">Admin Panel</h2>
          {/* Animated chat viewer container */}
          <div
              className={`transition-[opacity,transform,max-height] duration-500 ease-in-out transform overflow-hidden ${
                  showChats
                      ? "opacity-100 translate-y-0 max-h-[1000px] pointer-events-auto"
                      : "opacity-0 -translate-y-2 max-h-0 pointer-events-none"
              } px-4 md:px-12 mb-12`}
          >
            <div
                className={`flex flex-col md:flex-row gap-8 transition-opacity duration-500 ${
                    showChats ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            >
              <div className="w-full md:w-1/3">
                <h3 className="text-cyan-300 font-semibold mb-2">Chat Threads</h3>
                <ul className="space-y-2 bg-[#1b2435] border border-cyan-900/40 p-4 rounded-xl max-h-80 overflow-y-auto">
                  {sortedChatKeys.map((key) => (
                      <li
                          key={key}
                          onClick={() => setSelectedChatKey(key)}
                          className={`cursor-pointer px-3 py-2 rounded hover:bg-cyan-800/40 ${
                              selectedChatKey === key ? "bg-cyan-800/60 text-aqua" : "text-white"
                          }`}
                      >
                        {formatChatLabel(key)}
                      </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1">
                <h3 className="text-cyan-300 font-semibold mb-2">
                  {selectedChatKey ? formatChatLabel(selectedChatKey) : "Messages"}
                </h3>
                <div
                    className="bg-[#1b2435] border border-cyan-900/40 p-4 rounded-xl max-h-[400px] overflow-y-auto space-y-3">
                  {selectedChatKey ? (
                      allChats[selectedChatKey]?.map((msg, idx) => (
                          <div key={idx} className="bg-cyan-800/20 p-3 rounded">
                            <div className="text-sm text-cyan-200 font-semibold">{msg.from} → {msg.to}</div>
                            <div className="text-white">{msg.text}</div>
                            <div className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleString()}</div>
                          </div>
                      ))
                  ) : (
                      <div className="text-gray-400">Select a thread to view messages.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Broadcast Message */}
          <div className="w-full px-4 md:px-12 mb-10">
            <h3 className="text-lg font-semibold text-cyan-300 mb-2">Send Broadcast Message</h3>
            <div className="flex gap-3">
              <input
                  type="text"
                  className="flex-grow px-4 py-2 rounded-lg bg-[#232e43] text-white border border-cyan-800"
                  placeholder="Enter system message"
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
              />
              <button
                  className="bg-aqua text-midnight px-4 py-2 rounded font-bold hover:bg-cyan-400 transition"
                  onClick={() => {
                    if (!broadcastMsg.trim()) return;
                    socket.emit("system_message", {text: broadcastMsg});
                    setBroadcastMsg("");
                  }}
              >
                Broadcast
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-between items-center px-4 md:px-12 mb-6">
            <h2 className="text-4xl text-aqua font-extrabold tracking-wide">Admin Panel</h2>
            <div className="flex gap-4">
              <button
                  className="bg-blue-500 text-white font-bold px-4 py-2 rounded hover:bg-blue-600 transition"
                  onClick={() => setShowChats(!showChats)}
              >
                {showChats ? "Hide Chats" : "View Chats"}
              </button>
              <button
                  className="bg-cyan-600 text-white font-bold px-4 py-2 rounded hover:bg-cyan-700 transition"
                  onClick={() => setShowStats(true)}
              >
                View Stats
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-cyan-900/20 border border-cyan-800 rounded-2xl my-10 p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-aqua mb-3">Launch Timeline Control</h3>
            <div className="flex flex-col gap-3">
              {timelineSteps.map((step, idx) => (
                  <button
                      key={idx}
                      className={`px-4 py-2 rounded-lg text-lg font-bold transition ${
                          timelineStepIdx === idx
                              ? "bg-aqua text-midnight border-aqua border-2 opacity-90"
                              : "bg-cyan-950/50 text-cyan-200 border border-cyan-700 hover:bg-cyan-800/80 hover:text-aqua"
                      }`}
                      disabled={timelineStepIdx === idx}
                      onClick={() => updateTimelineStep(idx)}
                  >
                    {step}
                  </button>
              ))}
            </div>
            <div className="mt-4 text-cyan-300">
              <b>Current step:</b> {timelineSteps[timelineStepIdx]}
            </div>
            <div className="text-sm text-cyan-600 mt-2">
              This will update the splash page timeline for all users. Delete <code>launch_timeline.json</code> after
              launch to remove this.
            </div>
          </div>

          {/* -------------- FIRST ROW: All Users Table + Edit User Panel -------------- */}
      <div className="flex flex-row gap-10 w-full px-4 md:px-12 mb-16">
        {/* All Users Table */}
        <div className="flex-1 min-w-[380px]">
          <div className="flex-1 min-w-[380px]">
          <div className="bg-[#1b2435]/95 border border-cyan-900/40 rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-aqua mb-6">All Users</h3>
            <div className="rounded border border-cyan-900/40 bg-[#162030] shadow p-4 max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-cyan-300 bg-[#212e3c]">
                    <th className="px-4 py-2 text-left">Display Name</th>
                    <th className="px-4 py-2 text-left">Usertag</th>
                    <th className="px-4 py-2 text-left">Tags</th>
                    <th className="px-4 py-2">Color</th>
                    <th className="px-4 py-2">Admin</th>
                    <th className="px-4 py-2 w-20">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.usertag}
                      className={`transition ${selected?.usertag === user.usertag ? "bg-cyan-900/30" : "hover:bg-cyan-900/10"}`}
                    >
                      <td className="px-4 py-2 font-semibold truncate max-w-[120px]" style={{ color: user.color || "#fff" }}>
                        <Username
                          animated={
                            (user.animatedColors && user.animatedColors.length === 2)
                            || user.role === "admin"
                          }
                          colors={user.animatedColors}
                        >
                          {user.username}
                        </Username>
                      </td>
                      <td className="px-4 py-2 font-mono truncate max-w-[120px]">@{user.usertag}</td>
                      <td className="px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                        {(user.tags || []).map((tag) => (
                          <span
                            key={tag}
                            className="inline-block bg-cyan-900/40 text-cyan-200 text-xs px-2 py-1 rounded-full mr-1 mb-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className="inline-block w-5 h-5 rounded-full border"
                          style={{ background: user.color || "#fff" }}
                        ></span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {user.role === "admin" && "✔️"}
                        {user.role === "moderator" && (
                          <span className="ml-1 px-2 py-0.5 bg-indigo-700/30 border border-indigo-400/50 text-indigo-200 rounded text-[11px] font-bold">
                            MOD
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 w-20 text-center">
                        <button
                          className="px-3 py-1 rounded bg-aqua/60 text-midnight font-bold hover:bg-aqua/90 transition"
                          onClick={() => {
                            setSelected(user); // Select user for editing
                            setSelectedSession(null); // Close AI score edit dialog if open
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
        {/* Edit User Panel (next to users table, only when selected and not editing AI) */}
        {selected && !selectedSession && (
          <div className="w-full max-w-[400px] bg-[#18212e]/90 border border-cyan-900/40 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-aqua mb-4">Edit User</h3>
            {/* Usertag */}
            <div className="mb-5">
              <label className="block text-cyan-300 mb-1">Usertag</label>
              <span className="font-mono text-cyan-300 bg-cyan-900/30 px-3 py-2 rounded">
                @{selected.usertag}
              </span>
            </div>
            {/* Username */}
            <div className="mb-5">
              <label className="block text-cyan-300 mb-1">Display Name</label>
              <input
                className="w-full px-4 py-2 rounded-lg bg-[#232e43] text-white mb-2 border border-cyan-800"
                value={edit.username || ""}
                onChange={(e) => setEdit({ ...edit, username: e.target.value })}
              />
              <button
                onClick={() => saveField({ username: edit.username })}
                className="bg-aqua text-midnight px-4 py-1 rounded font-bold text-sm hover:bg-cyan-400 transition mt-2"
              >
                Save
              </button>
            </div>
            {/* Color */}
            <div className="mb-5">
              <label className="block text-cyan-300 mb-1">Color</label>
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="color"
                  className="w-10 h-10 rounded border-2 border-cyan-800 bg-[#232e43] cursor-pointer"
                  value={edit.color || "#ffffff"}
                  onChange={(e) => setEdit({ ...edit, color: e.target.value })}
                />
                <input
                  className="px-4 py-2 rounded-lg bg-[#232e43] text-white border border-cyan-800 w-36"
                  value={edit.color || ""}
                  onChange={(e) => setEdit({ ...edit, color: e.target.value })}
                  placeholder="#RRGGBB"
                />
              </div>
            </div>
            {/* Tags */}
            <div className="mb-5">
              <label className="block text-cyan-300 mb-1">Tags</label>
              <TagDropdownOverlay
                selectedTags={edit.tags || []}
                setTags={(newTags) => {
                  setEdit({ ...edit, tags: newTags });
                  saveField({ tags: newTags });
                }}
              />
            </div>
            {/* Bio */}
            <div className="mb-5">
              <label className="block text-cyan-300 mb-1">Bio</label>
              <textarea
                className="w-full px-4 py-2 rounded bg-[#232e43] text-white mb-2"
                rows={2}
                value={edit.bio || ""}
                onChange={(e) => setEdit({ ...edit, bio: e.target.value })}
              />
              <button
                onClick={() => saveField({ bio: edit.bio })}
                className="bg-aqua text-midnight px-4 py-1 rounded font-bold text-sm hover:bg-cyan-400 transition mt-2"
              >
                Save
              </button>
            </div>
            {/* Reputation */}
            <div className="mb-5">
              <label className="block text-cyan-300 mb-1">Reputation</label>
              <input
                type="number"
                className="w-full px-4 py-2 rounded-lg bg-[#232e43] text-white border border-cyan-800"
                value={edit.reputation ?? 0}
                min={0}
                max={100}
                onChange={(e) =>
                  setEdit({ ...edit, reputation: parseInt(e.target.value) })
                }
              />
              <ReputationBar rep={edit.reputation ?? 0} />
              <button
                onClick={() => saveField({ reputation: edit.reputation })}
                className="bg-aqua text-midnight px-4 py-1 rounded font-bold text-sm hover:bg-cyan-400 transition mt-2"
              >
                Save
              </button>
            </div>
            {/* Balance */}
            <div className="mb-5">
              <label className="block text-cyan-300 mb-1">Balance</label>
              <div className="flex gap-2">
                <button
                  onClick={() => adjustBalance(100)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-3 py-1 rounded"
                >
                  +100
                </button>
                <button
                  onClick={() => adjustBalance(-100)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1 rounded"
                >
                  -100
                </button>
              </div>
            </div>
            {/* Animated Colors */}
            <div className="mb-5">
              <label className="block text-cyan-300 mb-1">Animated Username Colors</label>
              <div className="flex gap-4 items-center">
                <input
                  type="color"
                  value={edit.animatedColors?.[0] || "#18f0ff"}
                  onChange={(e) => {
                    const newColors = [e.target.value, edit.animatedColors?.[1] || "#d275fa"];
                    setEdit({ ...edit, animatedColors: newColors });
                    saveField({ animatedColors: newColors });
                  }}
                  className="w-10 h-10 rounded border-2 border-cyan-800 cursor-pointer"
                />
                <span className="text-cyan-300">→</span>
                <input
                  type="color"
                  value={edit.animatedColors?.[1] || "#d275fa"}
                  onChange={(e) => {
                    const newColors = [edit.animatedColors?.[0] || "#18f0ff", e.target.value];
                    setEdit({ ...edit, animatedColors: newColors });
                    saveField({ animatedColors: newColors });
                  }}
                  className="w-10 h-10 rounded border-2 border-cyan-800 cursor-pointer"
                />
              </div>
            </div>
            {/* Role */}
            <div className="mb-5">
              <label className="block text-cyan-300 mb-1">Role</label>
              <select
                className="w-full px-4 py-2 rounded-lg bg-[#232e43] text-white border border-cyan-800"
                value={edit.role || selected.role || "user"}
                onChange={(e) => {
                  const role = e.target.value;
                  setEdit({ ...edit, role });
                  saveField({ role });
                }}
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {successMsg && <div className="text-green-400 mt-2">{successMsg}</div>}
          </div>
        )}
      </div>

      {/* -------------- SECOND ROW: AI Table + AI Score Edit -------------- */}
      <div className="flex flex-row gap-10 w-full px-4 md:px-12">
        {/* AI Risk Scores Table */}
        <div className="flex-1 my-10 bg-[#1b2435]/90 border border-cyan-900/40 rounded-2xl shadow-2xl p-6">
          <h3 className="text-xl font-bold text-aqua mb-6">AI Risk Scores (Debug)</h3>
          <div className="overflow-x-auto rounded border border-cyan-900/40 bg-[#162030] shadow p-4 max-h-80">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-cyan-300 bg-[#212e3c]">
                  <th className="px-4 py-2 text-left">Session/User ID</th>
                  <th className="px-4 py-2 text-left">Risk Score</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(aiScores).map(([id, score]) => (
                  <tr key={id}>
                    <td className="px-4 py-2 font-mono">{id}</td>
                    <td className="px-4 py-2">{score}</td>
                    <td className="px-4 py-2">
                      <button
                        className="px-3 py-1 rounded bg-yellow-400/80 text-black font-bold hover:bg-yellow-500 mr-2"
                        onClick={() => {
                          setSelected(null); // Close user editor if open
                          setSelectedSession(id);
                          setEditScore(score as number);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 bg-red-500 text-white rounded font-bold hover:bg-red-600"
                        onClick={async () => {
                          await fetch(`/api/admin/ai/scores/${id}`, { method: "DELETE", credentials: "include" });
                          setAiScores(prev => { const p = { ...prev }; delete p[id]; return p; });
                        }}
                      >
                        Reset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* AI Score Edit Dialog (next to AI scores, only when editing AI) */}
        {selectedSession && !selected && (
          <div className="w-full max-w-[400px] bg-[#212940] p-8 rounded-2xl shadow-2xl self-start">
            <h3 className="text-lg font-bold mb-3">
              Edit AI Risk Score for <span className="font-mono">{selectedSession}</span>
            </h3>
            <input
              className="mb-4 px-4 py-2 border rounded text-black"
              type="number"
              value={editScore}
              onChange={e => setEditScore(Number(e.target.value))}
            />
            <div>
              <button
                className="px-5 py-2 bg-aqua text-black rounded font-bold mr-4"
                onClick={async () => {
                  await fetch(`/api/admin/ai/scores/${selectedSession}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ score: editScore }),
                  });
                  setAiScores(prev => ({ ...prev, [selectedSession]: editScore }));
                  setSelectedSession(null);
                }}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded"
                onClick={() => setSelectedSession(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    {showStats && <AdminStatsPanel onClose={() => setShowStats(false)} />}
  </div>
);
}

export function TagDropdownOverlay({
  selectedTags,
  setTags,
}: {
  selectedTags: string[];
  setTags: (tags: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const tagKeys = Object.keys(TAGS);

  // Show just one tag, or "+ Add Tag" if none
  const preview = selectedTags.length > 0 ? (
    <TagSection tags={[selectedTags[0]]} />
  ) : (
    <span className="bg-cyan-900/70 text-cyan-100 rounded-full px-4 py-1 text-xs">+ Add Tag</span>
  );

  return (
    <div className="relative w-full">
      {/* Row: preview tag or Add button */}
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan-700 bg-cyan-900/70 hover:bg-aqua/10 transition cursor-pointer text-left"
        onClick={() => setOpen(!open)}
        tabIndex={0}
      >
        {preview}
        {selectedTags.length > 1 && (
          <span className="ml-3 text-xs text-cyan-200">{`+${selectedTags.length - 1}`}</span>
        )}
        <span className="ml-auto text-cyan-400">{open ? "▲" : "▼"}</span>
      </button>
      {/* Overlay Dropdown */}
      {open && (
        <div
          ref={ref}
          className="absolute z-30 left-0 top-12 w-[98%] md:w-72 bg-[#141d26] border border-cyan-800 rounded-xl shadow-2xl py-2 max-h-64 overflow-y-auto custom-scrollbar animate-fade-in"
          style={{
            minWidth: "190px",
            maxHeight: "calc(5 * 2.5rem + 0.5rem)", // 5 rows tall max
          }}
        >
          {tagKeys.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                type="button"
                key={tag}
                onClick={() => {
                  setTags(
                    isSelected
                      ? selectedTags.filter((t) => t !== tag)
                      : [...selectedTags, tag]
                  );
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent
                  ${isSelected
                    ? "bg-aqua/40 border-aqua text-aqua font-bold"
                    : "bg-cyan-900/30 hover:bg-cyan-900 text-cyan-100"}
                  transition cursor-pointer mb-1`}
                tabIndex={0}
              >
                <TagSection tags={[tag]} />
                <span className="ml-2 text-xs font-mono">{tag}</span>
                {isSelected && <span className="ml-auto text-green-300 font-bold">✔</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}