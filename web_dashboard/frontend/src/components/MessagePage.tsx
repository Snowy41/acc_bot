import { useEffect, useState } from "react";
import ChatModal from "./ChatModal"; // Reusable chat window/modal
import { useNavigate } from "react-router-dom";

interface Conversation {
  usertag: string;      // Their tag
  username: string;     // Display name
  avatar?: string;
  lastMessage: string;
  lastTimestamp: number;
  unread: boolean;
}

export default function MessagesPage({ usertag }: { usertag: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatTarget, setChatTarget] = useState<string | null>(null);
  const [targetUsername, setTargetUsername] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/messages/list", { credentials: "include" })
      .then(res => res.json())
      .then(data => setConversations(data.conversations || []));
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h2 className="text-3xl font-extrabold text-aqua mb-8">Messages</h2>
      <div className="rounded-2xl bg-[#162030]/80 border border-cyan-900/40 shadow-xl p-6 mb-6">
        {conversations.length === 0 ? (
          <div className="text-cyan-300">No conversations yet.</div>
        ) : (
          <ul className="divide-y divide-cyan-900">
            {conversations.map(conv => (
              <li
                key={conv.usertag}
                className="flex items-center gap-4 py-4 cursor-pointer hover:bg-cyan-900/10 transition"
                onClick={() => {
                  setChatTarget(conv.usertag);
                  setTargetUsername(conv.username);
                }}
              >
                <img
                  src={conv.avatar || "/default.png"}
                  alt={conv.username}
                  className="w-12 h-12 rounded-full border border-cyan-800 shadow"
                  draggable={false}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-cyan-200 truncate">{conv.username} <span className="text-xs text-cyan-400">@{conv.usertag}</span></div>
                  <div className="text-cyan-300 text-sm truncate">{conv.lastMessage}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-cyan-500">{new Date(conv.lastTimestamp).toLocaleTimeString()}</span>
                  {conv.unread && (
                    <span className="w-2 h-2 rounded-full bg-aqua block" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Chat Window */}
      {chatTarget && (
        <ChatModal
          friend={chatTarget}
          onClose={() => setChatTarget(null)}
          currentUserTag={usertag}
          friendUsername={targetUsername}
        />
      )}
    </div>
  );
}
