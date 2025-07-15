import { useState } from "react";

interface RegisterModalProps {
  onSuccess: (usertag: string, password: string) => void;
  onClose: () => void;
}

export default function RegisterModal({ onSuccess, onClose }: RegisterModalProps) {
  const [usertag, setUsertag] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!usertag || !username || !password || !password2) {
      setError("Fill all fields.");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/users/${usertag}`);
    if (res.ok) {
      setLoading(false);
      setError("This usertag is already taken.");
      return;
    }
    const regRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usertag, username, password }),
    });
    const data = await regRes.json();
    setLoading(false);
    if (regRes.ok && data.success) {
      setSuccessMsg("Registration successful!");
      setTimeout(() => {
        onSuccess(usertag, password);
      }, 1000);
    } else {
      setError(data.error || "Registration failed.");
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 transition-all duration-300 bg-black/70">
      <div className="bg-white/10 border border-cyan-800/40 backdrop-blur-2xl shadow-2xl rounded-2xl w-[350px] p-8">
        <h2 className="text-2xl text-aqua font-black mb-4 text-center tracking-wide">Register</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-cyan-300 text-sm mb-1 font-semibold">Usertag (unique, e.g. 2)</label>
            <input
              type="text"
              placeholder="Choose a usertag"
              className="w-full p-3 mb-2 text-aqua bg-midnight border border-cyan-800 rounded-lg font-bold"
              value={usertag}
              onChange={e => setUsertag(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-cyan-300 text-sm mb-1 font-semibold">Display Name</label>
            <input
              type="text"
              placeholder="Display name"
              className="w-full p-3 mb-2 text-aqua bg-midnight border border-cyan-800 rounded-lg font-bold"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-cyan-300 text-sm mb-1 font-semibold">Password</label>
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 mb-2 text-aqua bg-midnight border border-cyan-800 rounded-lg"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-cyan-300 text-sm mb-1 font-semibold">Repeat Password</label>
            <input
              type="password"
              placeholder="Repeat password"
              className="w-full p-3 mb-2 text-aqua bg-midnight border border-cyan-800 rounded-lg"
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
          {successMsg && <div className="text-green-400 text-xs mb-2">{successMsg}</div>}
          <button
            type="submit"
            className="bg-aqua text-midnight px-4 py-2 rounded-full w-full mt-4 font-bold text-lg shadow hover:bg-cyan-400 transition"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <button
          onClick={onClose}
          className="mt-2 w-full text-cyan-300 hover:text-aqua text-xs font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
