import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const socket: Socket = io("http://localhost:5000", {
  transports: ["websocket"],
  withCredentials: true,
});

export default function BotMonitor() {
  const { botName: platform } = useParams<{ botName: string }>();
  const navigate = useNavigate();

  const [scripts, setScripts] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<{ [key: string]: string }>({});
  const [logs, setLogs] = useState<{ [key: string]: string[] }>({});
  const [isRunning, setIsRunning] = useState<{ [key: string]: boolean }>({});
  const [isStarting, setIsStarting] = useState<{ [key: string]: boolean }>({});
  const [isStopping, setIsStopping] = useState<{ [key: string]: boolean }>({});

  // WebSocket listeners
  useEffect(() => {
    const handleLog = ({ script, output }: { script: string; output: string }) => {
      setLogs((prev) => ({
        ...prev,
        [script]: [...(prev[script] || []), output],
      }));
      setIsRunning((prev) => ({ ...prev, [script]: true }));
    };
    socket.on("bot_log", handleLog);
    return () => {
      socket.off("bot_log", handleLog);
    };
  }, []);

  // WebSocket debug
  useEffect(() => {
    socket.on("connect", () => {});
    socket.on("disconnect", () => {});
    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  // Fetch scripts by platform prefix
  useEffect(() => {
    fetch("/api/bots")
      .then((res) => res.json())
      .then((data) => {
        const filtered = (data.bots || []).filter((name: string) =>
          name.startsWith(`${platform}_`)
        );
        setScripts(filtered);
      });
  }, [platform]);

  const startScript = async (script: string) => {
    if (isStarting[script]) return;
    setIsStarting((prev) => ({ ...prev, [script]: true }));
    setStatuses((prev) => ({ ...prev, [script]: "Starting..." }));
    setLogs((prev) => ({ ...prev, [script]: [] }));
    const res = await fetch("/api/start_bot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bot_name: script }),
    });
    const data = await res.json();
    setStatuses((prev) => ({
      ...prev,
      [script]: data.message || "Bot started.",
    }));
    setIsRunning((prev) => ({ ...prev, [script]: true }));
    setIsStarting((prev) => ({ ...prev, [script]: false }));
  };

  const stopScript = async (script: string) => {
    if (isStopping[script]) return;
    setIsStopping((prev) => ({ ...prev, [script]: true }));
    setStatuses((prev) => ({ ...prev, [script]: "Stopping..." }));
    const res = await fetch("/api/stop_bot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bot_name: script }),
    });
    const data = await res.json();
    setStatuses((prev) => ({
      ...prev,
      [script]: data.message || "Bot stopped.",
    }));
    setIsRunning((prev) => ({ ...prev, [script]: false }));
    setIsStopping((prev) => ({ ...prev, [script]: false }));
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-16">
      <div className="bg-white/10 border border-cyan-700/40 shadow-2xl backdrop-blur-xl rounded-3xl p-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl text-aqua font-bold tracking-wide">
            Monitoring Platform: <span className="text-white">{platform}</span>
          </h2>
          <button
            onClick={() => navigate("/botSelection")}
            className="bg-gradient-to-r from-cyan-800 to-cyan-600 text-white px-5 py-2 rounded-xl shadow hover:bg-cyan-700 font-bold transition"
          >
            ← Back to Bots
          </button>
        </div>
        {scripts.length === 0 ? (
          <p className="text-cyan-300">No scripts found for this platform.</p>
        ) : (
          <div className="space-y-10">
            <AnimatePresence>
              {scripts.map((script, idx) => (
                <motion.div
                  key={script}
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 30, scale: 0.97 }}
                  transition={{ duration: 0.32, delay: idx * 0.08 }}
                  className="bg-[#19212a]/90 p-6 rounded-2xl border border-cyan-900/30 shadow-2xl"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-aqua">{script}</h3>
                      <p className="text-cyan-300">
                        Status: {statuses[script] || "Idle"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="bg-aqua hover:bg-cyan-400 text-midnight px-5 py-2 rounded-lg font-bold shadow transition disabled:opacity-50"
                        onClick={() => startScript(script)}
                        disabled={isStarting[script] || isRunning[script]}
                      >
                        {isStarting[script] ? "Starting..." : "Start"}
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-bold shadow transition disabled:opacity-50"
                        onClick={() => stopScript(script)}
                        disabled={isStopping[script] || !isRunning[script]}
                      >
                        {isStopping[script] ? "Stopping..." : "Stop"}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {isRunning[script] && (
                      <motion.div
                        key="terminal"
                        initial={{ height: 0, opacity: 0, scaleY: 0.98 }}
                        animate={{ height: "auto", opacity: 1, scaleY: 1 }}
                        exit={{ height: 0, opacity: 0, scaleY: 0.98 }}
                        transition={{ duration: 0.32 }}
                        className="bg-[#0a0a0a]/90 border border-cyan-800 rounded-lg p-4 mt-4 overflow-hidden"
                      >
                        <div className="text-cyan-400 font-bold mb-2">
                          {script} – Terminal
                        </div>
                        <motion.div
                          className="bg-black text-green-400 font-mono text-sm p-2 h-64 overflow-y-auto rounded border border-cyan-700 whitespace-pre-wrap"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.15 }}
                          ref={(el) => {
                            if (el) el.scrollTop = el.scrollHeight;
                          }}
                        >
                          {(logs[script] && logs[script].length > 0) ? (
                            logs[script].flatMap((line, idx) =>
                              line
                                .split("\n")
                                .filter(Boolean)
                                .map((part, subIdx) => (
                                  <motion.div
                                    key={`${idx}-${subIdx}`}
                                    initial={{ opacity: 0, x: 24 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.15, delay: idx * 0.03 + subIdx * 0.01 }}
                                  >
                                    [{script}] {part}
                                  </motion.div>
                                ))
                            )
                          ) : (
                            <div className="text-gray-500 italic">
                              🚫 No logs received for {script}
                            </div>
                          )}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
