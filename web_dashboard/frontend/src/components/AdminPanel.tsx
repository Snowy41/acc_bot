import { useEffect, useState } from "react";

interface User {
  username: string;
  usertag: string;
  uid?: number;
  bio?: string;
  is_admin?: boolean;
  is_banned?: boolean;
  is_muted?: boolean;
  color?: string;
  tags?: string[];
}

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<User | null>(null);
  const [edit, setEdit] = useState<Partial<User>>({});
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/status", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setIsAdmin(data.isAdmin || false);
        if (data.isAdmin) {
          fetch("/api/users")
            .then(res => res.json())
            .then(u => setUsers(u.users || []))
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });
  }, []);

  const handleSelect = (user: User) => {
    setSelected(user);
    setEdit({
      ...user,
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
        bio: edit.bio
      }),
    });
    setSuccessMsg("Profile updated!");
    fetch("/api/users").then(res => res.json()).then(u => setUsers(u.users || []));
  };

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
        <h2 className="text-4xl text-aqua font-extrabold mb-12 text-center tracking-wide">Admin Panel</h2>
        <div className="flex flex-col md:flex-row gap-10 items-start w-full px-4 md:px-12">
          {/* ALL USERS TABLE */}
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
                        className={`transition ${selected?.usertag === user.usertag ? "bg-cyan-900/30" : "hover:bg-cyan-900/10"}`}
                      >
                        <td className="px-4 py-2 font-semibold" style={{ color: user.color || "#fff" }}>
                          {user.username}
                        </td>
                        <td className="px-4 py-2 font-mono">
                          @{user.usertag}
                          {user.uid && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded border border-cyan-900/40 font-mono" style={{ background: 'rgba(120,130,140,0.08)', color: '#90a0b7', opacity: 0.7 }}>
                              ID: {user.uid}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {user.tags && user.tags.length > 0 &&
                            user.tags.map(tag => (
                              <span key={tag} className="inline-block bg-cyan-900/40 text-cyan-200 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                {tag}
                              </span>
                            ))
                          }
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-block w-5 h-5 rounded-full border" style={{ background: user.color || "#fff" }}></span>
                        </td>
                        <td className="px-4 py-2 text-center">{user.is_admin ? "✔️" : ""}</td>
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
          {/* EDIT USER PANEL */}
          <div className="w-full md:w-[400px] bg-[#18212e]/90 border border-cyan-900/40 rounded-2xl p-8 shadow-2xl sticky top-28">
            <h3 className="text-xl font-bold text-aqua mb-4">Edit User</h3>
            {!selected ? (
              <div className="text-cyan-300">Select a user to edit.</div>
            ) : (
              <>
                {/* Usertag (not editable) */}
                <div className="mb-5 flex gap-4 items-center">
                  <div>
                    <label className="block text-cyan-300 mb-1">Usertag</label>
                    <span className="font-mono text-cyan-300 bg-cyan-900/30 px-3 py-2 rounded">{`@${selected.usertag}`}</span>
                    {selected.uid && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded border border-cyan-900/40 font-mono" style={{ background: 'rgba(120,130,140,0.08)', color: '#90a0b7', opacity: 0.7 }}>
                        ID: {selected.uid}
                      </span>
                    )}
                  </div>
                </div>
                {/* Display Name (editable) */}
                <div className="mb-5">
                  <label className="block text-cyan-300 mb-1">Display Name</label>
                  <input
                    className="w-full px-4 py-2 rounded-lg bg-[#232e43] text-white mb-2 border border-cyan-800"
                    value={edit.username || ""}
                    onChange={e => setEdit({ ...edit, username: e.target.value })}
                  />
                </div>
                {/* Color */}
                <div className="mb-5">
                  <label className="block text-cyan-300 mb-1">Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={edit.color || "#fff"}
                      onChange={e => setEdit({ ...edit, color: e.target.value })}
                      className="w-8 h-8 rounded-full border-none cursor-pointer"
                    />
                    <span className="px-3 py-2 rounded-lg font-bold" style={{ background: edit.color, color: "#111" }}>
                      {edit.username}
                    </span>
                  </div>
                </div>
                {/* Tags */}
                <div className="mb-5">
                  <label className="block text-cyan-300 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {edit.tags?.map(tag => (
                      <span key={tag} className="bg-cyan-900/60 text-cyan-200 text-xs px-2 py-1 rounded-full border border-cyan-700 shadow-sm flex items-center gap-1">
                        {tag}
                        <button className="ml-1 text-red-400 font-bold hover:text-red-600" onClick={() => handleTagRemove(tag)}>&times;</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="px-2 py-1 rounded bg-[#232e43] text-white"
                      placeholder="Add tag"
                      onKeyDown={e => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          handleTagAdd(e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                </div>
                {/* Bio */}
                <div className="mb-5">
                  <label className="block text-cyan-300 mb-1">Bio</label>
                  <textarea
                    className="w-full px-4 py-2 rounded bg-[#232e43] text-white"
                    rows={2}
                    value={edit.bio || ""}
                    onChange={e => setEdit({ ...edit, bio: e.target.value })}
                  />
                </div>
                <button
                  className="bg-aqua text-midnight px-4 py-2 rounded font-bold mt-2 w-full hover:bg-cyan-400 transition"
                  onClick={handleSave}
                >
                  Save Changes
                </button>
                {successMsg && <div className="text-green-400 mt-2">{successMsg}</div>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
