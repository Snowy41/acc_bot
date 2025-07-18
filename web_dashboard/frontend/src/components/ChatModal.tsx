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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/messages/${friend}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setMessages(data.messages || []);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });
  }, [friend]);

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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-[#121a24] border border-cyan-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between bg-cyan-900/20 p-4 border-b border-cyan-800">
          <div className="flex items-center gap-3">
            <span className="text-aqua font-semibold text-lg">
              {friendUsername ? friendUsername : "@" + friend}
            </span>
          </div>
          <button onClick={onClose} className="text-red-300 hover:text-red-500 text-xl font-bold">
            ×
          </button>
        </div>

        {/* Chat body */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#18222f] space-y-3">
          {messages.map((msg, i) => {
            const isMe = msg.from === currentUserTag;
            return (
              <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] p-3 rounded-xl text-sm shadow ${
                  isMe
                    ? "bg-aqua text-midnight rounded-br-none"
                    : "bg-cyan-900/40 text-white rounded-bl-none"
                }`}>
                  <div>{msg.text}</div>
                  <div className="text-[10px] text-right opacity-50 mt-1">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef}></div>
        </div>

        {/* Input */}
        <div className="flex gap-2 p-4 bg-cyan-900/10 border-t border-cyan-800">
          <input
            className="flex-1 px-4 py-2 rounded-lg bg-cyan-900/30 text-white border border-cyan-700 placeholder-cyan-400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            autoFocus
          />
          <button
            onClick={sendMessage}
            className="bg-aqua px-4 py-2 rounded-lg text-midnight font-bold hover:bg-cyan-400"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
