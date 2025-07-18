import { useEffect, useState } from "react";
import { socket } from "../socket";
import AdminStatsPanel from "./AdminStatsPanel";
import Username from "./Username";

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
}

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
  useEffect(() => {
    fetch("/api/auth/status", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setRole(data.role || "user");
        setIsAdmin(data.role === "admin");
        setIsPremium(data.role === "admin" || data.role === "premium");
        if (data.isAdmin) {
          fetch("/api/users", { credentials: "include" })
            .then(res => res.json())
            .then(u => setUsers(u.users || []));

          fetch("/api/admin/chats", { credentials: "include" })
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

    if (!socket.connected) {
      socket.connect(); // ✅ call outside cleanup
    }

    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect); // ✅ cleanup as expected
    };
  }, []);


  const handleSelect = (user: User) => {
    setSelected(user);
    setEdit({
      ...user,
      animatedColors: user.animatedColors ? [...user.animatedColors] : [],
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
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        username: edit.username,
        color: edit.color,
        tags: edit.tags,
        bio: edit.bio,
        role: edit.role || selected.role || "user",  // <-- always include the current role!
        animatedColors: edit.animatedColors, // <-- include this
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

  const handleTagAdd = (tag: string) => {
    if (!tag.trim() || edit.tags?.includes(tag.trim())) return;
    setEdit({ ...edit, tags: [...(edit.tags || []), tag.trim()] });
  };

  const handleTagRemove = (tag: string) => {
    setEdit({ ...edit, tags: (edit.tags || []).filter(t => t !== tag) });
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
          {/* Only render the inside if showChats is true */}
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
                <div className="bg-[#1b2435] border border-cyan-900/40 p-4 rounded-xl max-h-[400px] overflow-y-auto space-y-3">
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
                socket.emit("system_message", { text: broadcastMsg });
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

        {/* All Users Table */}
        <div className="flex flex-col md:flex-row gap-10 items-start w-full px-4 md:px-12">
          <div className="flex-1 min-w-[380px]">
            <div className="bg-[#1b2435]/95 border border-cyan-900/40 rounded-2xl shadow-2xl p-6">
              <h3 className="text-xl font-bold text-aqua mb-6">All Users</h3>
              <div className="overflow-x-auto rounded border border-cyan-900/40 bg-[#162030] shadow p-4 max-h-80">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-cyan-300 bg-[#212e3c]">
                      <th className="px-4 py-2 text-left">Display Name</th>
                      <th className="px-4 py-2 text-left">Usertag</th>
                      <th className="px-4 py-2 text-left">Tags</th>
                      <th className="px-4 py-2">Color</th>
                      <th className="px-4 py-2">Admin</th>
                      <th className="px-4 py-2">Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.usertag}
                        className={`transition ${
                          selected?.usertag === user.usertag ? "bg-cyan-900/30" : "hover:bg-cyan-900/10"
                        }`}
                      >
                        <td className="px-4 py-2 font-semibold" style={{ color: user.color || "#fff" }}>
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
                        <td className="px-4 py-2 font-mono">@{user.usertag}</td>
                        <td className="px-4 py-2">
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
                        <td className="px-4 py-2 text-center">{user.role === "admin" ? "✔️" : ""}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            className="px-3 py-1 rounded bg-aqua/60 text-midnight font-bold hover:bg-aqua/90 transition"
                            onClick={() => handleSelect(user)}
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

          {/* User Editor Panel */}
          {selected && (
            <div className="w-full md:w-[400px] bg-[#18212e]/90 border border-cyan-900/40 rounded-2xl p-8 shadow-2xl sticky top-28">
              <h3 className="text-xl font-bold text-aqua mb-4">Edit User</h3>
              <div className="mb-5">
                <label className="block text-cyan-300 mb-1">Usertag</label>
                <span className="font-mono text-cyan-300 bg-cyan-900/30 px-3 py-2 rounded">{`@${selected.usertag}`}</span>
              </div>
              <div className="mb-5">
                <label className="block text-cyan-300 mb-1">Display Name</label>
                <input
                  className="w-full px-4 py-2 rounded-lg bg-[#232e43] text-white mb-2 border border-cyan-800"
                  value={edit.username || ""}
                  onChange={(e) => setEdit({ ...edit, username: e.target.value })}
                />
              </div>
                <div className="mb-5">
                  <label className="block text-cyan-300 mb-1">Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      className="w-10 h-10 rounded border-2 border-cyan-800 bg-[#232e43] cursor-pointer"
                      value={edit.color || "#ffffff"}
                      onChange={(e) => setEdit({ ...edit, color: e.target.value })}
                      style={{ minWidth: "2.5rem", minHeight: "2.5rem" }}
                    />
                    <input
                      className="px-4 py-2 rounded-lg bg-[#232e43] text-white border border-cyan-800 w-36"
                      value={edit.color || ""}
                      onChange={(e) => setEdit({ ...edit, color: e.target.value })}
                      placeholder="#RRGGBB"
                      maxLength={9}
                    />
                    {/* Show a small preview swatch */}
                    <span
                      className="w-8 h-8 rounded-full border border-cyan-900 shadow"
                      style={{ background: edit.color || "#fff", display: "inline-block" }}
                    ></span>
                  </div>
                </div>
              <div className="mb-5">
                <label className="block text-cyan-300 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {edit.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="bg-cyan-900/60 text-cyan-200 text-xs px-2 py-1 rounded-full border border-cyan-700 shadow-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        className="ml-1 text-red-400 font-bold hover:text-red-600"
                        onClick={() => handleTagRemove(tag)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  className="px-2 py-1 rounded bg-[#232e43] text-white w-full"
                  placeholder="Add tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      handleTagAdd(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>
              <div className="mb-5">
                <label className="block text-cyan-300 mb-1">Bio</label>
                <textarea
                  className="w-full px-4 py-2 rounded bg-[#232e43] text-white"
                  rows={2}
                  value={edit.bio || ""}
                  onChange={(e) => setEdit({ ...edit, bio: e.target.value })}
                />
              </div>
              <div className="mb-5">
                <label className="block text-cyan-300 mb-1">
                  Animated Username Colors<br />
                  <span className="text-xs text-cyan-200">
                    Select two HEX colors for the gradient effect.
                  </span>
                </label>
                <div className="flex gap-4 items-center">
                  <div className="flex flex-col items-center">
                    <input
                      type="color"
                      className="w-10 h-10 rounded border-2 border-cyan-800 bg-[#232e43] cursor-pointer"
                      value={edit.animatedColors?.[0] || "#18f0ff"}
                      onChange={e =>
                        setEdit({
                          ...edit,
                          animatedColors: [
                            e.target.value,
                            edit.animatedColors?.[1] || "#d275fa"
                          ]
                        })
                      }
                      style={{ minWidth: "2.5rem", minHeight: "2.5rem" }}
                    />
                    <span className="text-xs text-cyan-400 mt-1">{edit.animatedColors?.[0] || "#18f0ff"}</span>
                  </div>
                  <span className="text-cyan-300 font-bold px-2">→</span>
                  <div className="flex flex-col items-center">
                    <input
                      type="color"
                      className="w-10 h-10 rounded border-2 border-cyan-800 bg-[#232e43] cursor-pointer"
                      value={edit.animatedColors?.[1] || "#d275fa"}
                      onChange={e =>
                        setEdit({
                          ...edit,
                          animatedColors: [
                            edit.animatedColors?.[0] || "#18f0ff",
                            e.target.value
                          ]
                        })
                      }
                      style={{ minWidth: "2.5rem", minHeight: "2.5rem" }}
                    />
                    <span className="text-xs text-cyan-400 mt-1">{edit.animatedColors?.[1] || "#d275fa"}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <Username
                    animated={
                      !!(edit.animatedColors &&
                      edit.animatedColors[0] &&
                      edit.animatedColors[1])
                    }
                    colors={edit.animatedColors}
                    className="text-lg"
                  >
                    {edit.username || selected?.username}
                  </Username>
                </div>
              </div>
              <button
                className="bg-aqua text-midnight px-4 py-2 rounded font-bold mt-2 w-full hover:bg-cyan-400 transition"
                onClick={handleSave}
              >
                Save Changes
              </button>
              {successMsg && <div className="text-green-400 mt-2">{successMsg}</div>}
            </div>
          )}
        </div>
      </div>
      {showStats && <AdminStatsPanel onClose={() => setShowStats(false)} />}
    </div>
  );
}
