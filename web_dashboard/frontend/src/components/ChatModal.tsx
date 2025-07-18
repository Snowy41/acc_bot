import { useState, useEffect, useRef } from "react";
import { socket } from "../socket";

export default function ChatModal({
  friend,
  onClose,
  currentUserTag,
  friendUsername,
  initialMessage = "",
}: {
  friend: string;
  onClose: () => void;
  currentUserTag: string;
  friendUsername?: string;
  initialMessage?: string;
}) {
  const [messages, setMessages] = useState<{ from: string; text: string; timestamp: number }[]>([]);
  const [input, setInput] = useState(initialMessage);
  const [friendAvatar, setFriendAvatar] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch avatar and online status
  useEffect(() => {
    fetch(`/api/users/${friend}`)
      .then(res => res.json())
      .then(data => {
        setFriendAvatar(data.avatar || "/default.png");
      });
    fetch("/api/online-users")
      .then(res => res.json())
      .then(data => setIsOnline(data.online?.includes(friend)));
  }, [friend]);

  // Fetch messages
  useEffect(() => {
    fetch(`/api/messages/${friend}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setMessages(data.messages || []);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });
  }, [friend]);

  // Listen for new DMs
  useEffect(() => {
    const handler = (data: any) => {
      if (data.from === friend || data.to === friend) {
        setMessages(prev => [...prev, data]);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    };
    socket.on("dm", handler);
    return () => {
      socket.off("dm", handler);
    };
  }, [friend]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    socket.emit("dm", { to: friend, text });
    setInput("");
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // --- UI Starts Here ---
  return (
    <div className="fixed inset-0 bg-[#11151cdd] backdrop-blur-[2.5px] flex items-center justify-center z-50 animate__animated animate__fadeIn">
      <div
        className="w-full max-w-2xl md:max-w-xl rounded-3xl shadow-2xl border border-cyan-800/50 flex flex-col overflow-hidden relative"
        style={{
          background: "linear-gradient(125deg, rgba(13,24,43,0.96) 80%, #12fff199 120%)",
          boxShadow: "0 0 36px #18f0ff33, 0 0 2px #19e3f566",
        }}
      >
        {/* HEADER */}
        <div className="flex items-center gap-4 px-7 py-4 bg-[#1a2232]/90 border-b border-cyan-800 shadow-[0_2px_16px_0_#16e8ff33] relative">
          <img
            src={friendAvatar || "/default.png"}
            alt={friendUsername || friend}
            className="w-11 h-11 rounded-full border-2 border-aqua shadow-sm"
            draggable={false}
          />
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-aqua text-xl drop-shadow-[0_0_4px_#13e0f5] tracking-wide">
                {friendUsername || "@" + friend}
              </span>
              {isOnline && (
                <span className="ml-2 text-green-400 font-bold text-xs animate-pulse">● Online</span>
              )}
            </div>
            <span className="text-cyan-400 text-xs opacity-70">@{friend}</span>
          </div>
          <button
            onClick={onClose}
            className="text-red-300 hover:text-red-500 text-2xl font-bold px-2 transition absolute right-2 top-1"
            aria-label="Close chat"
          >
            ×
          </button>
        </div>

        {/* MESSAGES */}
        <div
          className="flex-1 flex flex-col px-5 py-5 overflow-y-auto bg-gradient-to-tr from-[#18222f]/95 to-[#1e2d47]/95"
          style={{
            minHeight: "320px",
            background: "radial-gradient(ellipse at bottom right, #162030cc 75%, #18222fcc 100%)",
          }}
        >
          {messages.length === 0 ? (
            <div className="text-cyan-200/80 text-center pt-8 opacity-80">No messages yet. Say hi!</div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.from === currentUserTag;
              return (
                <div
                  key={i}
                  className={`flex w-full my-1 ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-[1.4rem] text-base font-medium shadow
                      transition
                      ${isMe
                        ? "bg-gradient-to-tr from-aqua to-cyan-400 text-midnight rounded-br-md border border-aqua/60"
                        : "bg-cyan-900/50 text-white border border-cyan-800 rounded-bl-md"
                      }
                      ${isMe ? "animate__animated animate__fadeInRight" : "animate__animated animate__fadeInLeft"}
                    `}
                    style={{
                      marginRight: isMe ? 0 : "auto",
                      marginLeft: isMe ? "auto" : 0,
                    }}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                    <div className="text-[11px] text-right opacity-60 mt-2 font-mono">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef}></div>
        </div>

        {/* INPUT */}
        <div className="flex items-center gap-2 px-6 py-5 bg-[#1b2537]/90 border-t border-cyan-800">
          <input
            className="flex-1 px-5 py-3 rounded-2xl bg-cyan-900/20 text-white text-lg border border-cyan-700 focus:border-aqua outline-none placeholder-cyan-400 transition-all shadow-md"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message and press Enter..."
            autoFocus
            maxLength={1200}
          />
          <button
            onClick={sendMessage}
            className="bg-aqua hover:bg-cyan-300 text-midnight px-6 py-2 rounded-full font-extrabold text-lg shadow transition-all active:scale-95"
            style={{
              boxShadow: "0 1px 8px #12fff122, 0 0 0 1.5px #19e3f588"
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
