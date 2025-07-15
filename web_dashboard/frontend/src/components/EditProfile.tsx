import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function EditProfile() {
  const { usertag = "" } = useParams();
  const [bio, setBio] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [social, setSocial] = useState<{ github?: string; discord?: string; twitter?: string }>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/users/${usertag}`)
      .then(res => res.json())
      .then(data => {
        setBio(data.bio || "");
        setNewUsername(data.username || "");
        setSocial(typeof data.social === "object" && data.social ? data.social : {});
        setLoading(false);
      });
  }, [usertag]);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/users/${usertag}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: newUsername, bio, social }),
    });
    setSuccessMsg("Profile updated!");
    setTimeout(() => setSuccessMsg(""), 1500);
    setTimeout(() => navigate(`/profile/${usertag}`), 1200);
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="w-full max-w-xl mx-auto mt-20">
      <div className="bg-white/10 border border-cyan-700/40 shadow-2xl backdrop-blur-xl rounded-3xl p-10">
        <h2 className="text-3xl text-aqua font-bold mb-8 text-center tracking-wide">Edit Profile</h2>
        <form onSubmit={handleSaveAll}>
          {/* Display Name */}
          <div className="mb-8">
            <label className="block text-cyan-300 mb-1 font-semibold">Display Name</label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-[#232e43] text-white border border-cyan-800 mb-2"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
            />
          </div>
          {/* Bio */}
          <div className="mb-8">
            <label className="block text-cyan-300 mb-1 font-semibold">Bio</label>
            <textarea
              className="w-full px-4 py-3 rounded-lg bg-[#232e43] text-white border border-cyan-800"
              rows={5}
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
          </div>
          {/* Social Links */}
          <div className="mb-10">
            <label className="block text-cyan-300 mb-2 font-semibold">Social Links</label>
            <input
              className="w-full px-4 py-2 rounded-lg bg-[#232e43] text-white border border-cyan-800 mb-2"
              placeholder="GitHub (https://github.com/yourname)"
              value={social.github || ""}
              onChange={e => setSocial({ ...social, github: e.target.value })}
            />
            <input
              className="w-full px-4 py-2 rounded-lg bg-[#232e43] text-white border border-cyan-800 mb-2"
              placeholder="Discord (Name#1234)"
              value={social.discord || ""}
              onChange={e => setSocial({ ...social, discord: e.target.value })}
            />
            <input
              className="w-full px-4 py-2 rounded-lg bg-[#232e43] text-white border border-cyan-800"
              placeholder="Twitter (https://twitter.com/yourname)"
              value={social.twitter || ""}
              onChange={e => setSocial({ ...social, twitter: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="bg-aqua text-midnight px-4 py-2 rounded-lg font-bold shadow hover:bg-cyan-400 transition mt-2 w-full text-lg"
          >
            Save All Changes
          </button>
          {successMsg && <div className="text-green-400 text-center font-bold mt-4">{successMsg}</div>}
        </form>
      </div>
    </div>
  );
}
