import { useState, useEffect, useRef } from "react";
import { socket } from "../socket";

interface MessageEmbed {
  id: string;
  title: string;
  price: string | number;
  desc: string;
  category: string;
  seller: string;
  sellerTag: string;
}

interface ChatMessage {
  from: string;
  to: string;
  text: string;
  timestamp: number;
  embed?: MessageEmbed;
}


export default function ChatModal({
  friend,
  onClose,
  currentUserTag,
  friendUsername,
  initialMessage = "",
  embed: initialEmbed, // Only used for first message
}: {
  friend: string;
  onClose: () => void;
  currentUserTag: string;
  friendUsername?: string;
  initialMessage?: string;
  embed?: MessageEmbed;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialMessage);
  const [pendingEmbed, setPendingEmbed] = useState<MessageEmbed | undefined>(initialEmbed);
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
    const handler = (data: ChatMessage) => {
      if ((data.from === friend || data.to === friend) && data.text) {
        setMessages(prev => [...prev, data]);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    };
    socket.on("dm", handler);
    return () => {
      socket.off("dm", handler);
    };
  }, [friend]);

  // --- Send Message (with optional embed) ---
  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    // Send embed with message if pendingEmbed exists
    socket.emit("dm", {
      to: friend,
      text,
      embed: pendingEmbed,
    });
    setInput("");
    setPendingEmbed(undefined); // only send embed once, unless reset
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
          className="flex-1 flex flex-col px-5 py-5 overflow-y-auto overflow-x-hidden"
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
                  <div className="flex flex-col max-w-[80%]">
                    {/* EMBED CARD (if this message has one) */}
                    {msg.embed && (
                      <div className="mb-1 p-3 rounded-xl border border-cyan-800 bg-[#162030]/80 shadow"
                        style={{marginBottom: "6px"}}
                      >
                        <div className="font-bold text-aqua text-base mb-1">{msg.embed.title}</div>
                        <div className="text-cyan-300 text-sm">{msg.embed.desc}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-lg font-black text-aqua">${msg.embed.price}</span>
                          <span className="text-xs text-cyan-400 bg-cyan-900/40 rounded px-2 py-1">{msg.embed.category}</span>
                          <span className="text-xs text-cyan-400">by @{msg.embed.seller}</span>
                          <a
                            href={`/forum/marketplace/${msg.embed.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 px-3 py-1 bg-aqua text-midnight rounded-full text-xs font-bold shadow hover:bg-cyan-400 transition"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    )}
                    <div
                      className={`px-4 py-3 rounded-[1.4rem] text-base font-medium shadow
                        transition
                        ${isMe
                          ? "bg-gradient-to-tr from-aqua to-cyan-400 text-midnight rounded-br-md border border-aqua/60"
                          : "bg-cyan-900/50 text-white border border-cyan-800 rounded-bl-md"
                        }
                        whitespace-pre-wrap break-words
                      `}
                    >
                      {msg.text}
                      <div className="text-[11px] text-right opacity-60 mt-2 font-mono">
                        {formatTime(msg.timestamp)}
                      </div>
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
          {/* If there is a pending embed to send, preview it above the input */}
          {pendingEmbed && (
            <div className="absolute bottom-24 left-8 right-8 mb-2 p-3 rounded-xl border border-cyan-700 bg-[#142030]/80 shadow-lg flex flex-col z-40">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-bold text-aqua">{pendingEmbed.title}</div>
                  <div className="text-cyan-300 text-sm">{pendingEmbed.desc}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg font-black text-aqua">${pendingEmbed.price}</span>
                    <span className="text-xs text-cyan-400 bg-cyan-900/40 rounded px-2 py-1">{pendingEmbed.category}</span>
                    <span className="text-xs text-cyan-400">by @{pendingEmbed.seller}</span>
                    <a
                      href={`/forum/marketplace/${pendingEmbed.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 px-2 py-1 bg-aqua text-midnight rounded-full text-xs font-bold shadow hover:bg-cyan-400 transition"
                    >
                      View
                    </a>
                  </div>
                </div>
                <button
                  className="ml-4 px-3 py-1 bg-red-400 text-white rounded-full font-bold text-xs hover:bg-red-500 transition"
                  onClick={() => setPendingEmbed(undefined)}
                >
                  ×
                </button>
              </div>
              <span className="text-xs text-cyan-400 mt-1">This offer will be attached to your next message.</span>
            </div>
          )}
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
