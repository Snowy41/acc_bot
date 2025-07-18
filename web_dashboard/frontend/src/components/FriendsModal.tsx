import { useEffect, useState } from "react";
import ChatModal from "./ChatModal";

export default function FriendsModal({
  open,
  onClose,
  usertag,
  onlineUsers = [],
}: {
  open: boolean;
  onClose: () => void;
  usertag: string;
  onlineUsers: string[];
}) {
  const [friends, setFriends] = useState<string[]>([]);
  const [chatTarget, setChatTarget] = useState<string | null>(null);
  const [pending, setPending] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/api/friends/list", { credentials: "include" })
        .then(res => res.json())
        .then(data => setFriends(data.friends || []));
      fetch("/api/friends/requests", { credentials: "include" })
        .then(res => res.json())
        .then(data => setPending(data.requests || []));
      setLoading(false);
    }
  }, [open]);

  const removeFriend = async (friendTag: string) => {
    if (!confirm(`Remove @${friendTag}?`)) return;
    await fetch("/api/friends/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ friendTag }),
    });
    setFriends(friends => friends.filter(f => f !== friendTag));
  };

  const acceptRequest = async (requesterTag: string) => {
    await fetch("/api/friends/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ requesterTag }),
    });
    setPending((prev) => prev.filter((r) => r !== requesterTag));
    setFriends(friends => [...friends, requesterTag]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-[#101820cc] backdrop-blur-[2.5px] flex items-center justify-center z-50 animate__animated animate__fadeIn">
      <div
        className="w-full max-w-lg rounded-3xl shadow-2xl border border-cyan-800/50 flex flex-col overflow-hidden relative"
        style={{
          background: "linear-gradient(125deg, rgba(21,31,46,0.98) 80%, #12fff133 120%)",
          boxShadow: "0 0 32px #18f0ff33, 0 0 2px #19e3f566",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-8 py-6 bg-[#1a2232]/95 border-b border-cyan-800">
          <h2 className="text-2xl font-black text-aqua tracking-wide flex-1">Your Friends</h2>
          <button
            onClick={onClose}
            className="text-red-300 hover:text-red-500 text-2xl font-bold px-2 transition absolute right-4 top-3"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="px-8 pt-7 pb-6 flex flex-col gap-9" style={{ minHeight: "350px" }}>
          {/* Friends List */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-bold text-cyan-400">Friends ({friends.length})</span>
            </div>
            {loading ? (
              <div className="text-cyan-300 py-8 text-center">Loading...</div>
            ) : friends.length === 0 ? (
              <div className="text-cyan-600 py-6 text-center">No friends yet. Add some!</div>
            ) : (
              <ul className="space-y-4">
                {friends.map(friend => (
                  <li
                    key={friend}
                    className="flex items-center gap-4 bg-[#1a2232]/80 border border-cyan-900/30 rounded-xl px-5 py-3 shadow-md transition group"
                  >
                    <span className="text-lg font-bold text-cyan-200">
                      @{friend}
                    </span>
                    {onlineUsers.includes(friend) && (
                      <span className="ml-2 w-3 h-3 bg-green-400 rounded-full shadow-lg inline-block animate-pulse"></span>
                    )}
                    <div className="flex gap-2 ml-auto">
                      <button
                        className="bg-aqua hover:bg-cyan-400 text-midnight text-xs font-bold px-4 py-1.5 rounded-full shadow transition"
                        onClick={() => setChatTarget(friend)}
                      >
                        💬 Chat
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow transition"
                        onClick={() => removeFriend(friend)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pending Requests */}
          <div>
            <div className="mb-2 font-bold text-cyan-400">Pending Requests ({pending.length})</div>
            {pending.length === 0 ? (
              <div className="text-cyan-600">No pending requests.</div>
            ) : (
              <ul className="space-y-2">
                {pending.map(r => (
                  <li
                    key={r}
                    className="flex items-center justify-between bg-cyan-900/30 px-5 py-3 rounded-xl shadow"
                  >
                    <span className="text-base font-medium text-cyan-200">@{r}</span>
                    <button
                      className="bg-aqua text-midnight px-4 py-1 rounded-full font-bold text-xs hover:bg-cyan-400 transition"
                      onClick={() => acceptRequest(r)}
                    >
                      Accept
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* ChatModal for in-friend DMs */}
        {chatTarget && (
          <ChatModal
            friend={chatTarget}
            onClose={() => setChatTarget(null)}
            currentUserTag={usertag}
            friendUsername={chatTarget}
          />
        )}
      </div>
    </div>
  );
}
