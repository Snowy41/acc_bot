import { useState, useEffect, useRef } from "react";

// Utility to highlight search in logs
function highlightLog(text: string, query: string) {
  if (!query) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
  return text.split('\n').map((line, i) =>
    <div key={i} className="whitespace-pre-wrap">
      {line.split(re).map((part, j) =>
        part.toLowerCase() === query.toLowerCase()
          ? <span key={j} className="bg-aqua/60 text-midnight rounded px-1">{part}</span>
          : part
      )}
    </div>
  );
}
const colorizeLine = (line: string) => {
  if (/error/i.test(line)) return "text-red-400";
  if (/warn/i.test(line)) return "text-yellow-300";
  if (/info/i.test(line)) return "text-cyan-300";
  return "text-gray-100";
};

export default function LogViewer() {
  const [logs, setLogs] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [logContent, setLogContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/logs/list")
      .then((res) => res.json())
      .then((data) => setLogs(data.logs))
      .catch(() => setLogs([]));
  }, []);

  const loadLog = (file: string) => {
    setLoading(true);
    setError("");
    setSelected(file);
    fetch(`/api/logs/view?file=${encodeURIComponent(file)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setLogContent("");
        } else {
          setLogContent(data.content);
        }
        setLoading(false);
        setTimeout(() => {
          logRef.current?.scrollTo(0, logRef.current.scrollHeight);
        }, 0);
      })
      .catch(() => {
        setError("Failed to load log content");
        setLoading(false);
      });
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-16">
      <div className="bg-white/10 border border-cyan-700/40 shadow-2xl backdrop-blur-xl rounded-3xl p-0">
        <div className="flex items-center justify-between px-8 py-6 bg-[#1b2435] border-b border-cyan-800 rounded-t-3xl">
          <h2 className="text-3xl text-aqua font-bold">Log Viewer</h2>
          <div className="flex gap-2 flex-wrap">
            {logs.length === 0 && <span className="text-gray-400">No .log files found</span>}
            {logs.map((log) => (
              <button
                key={log}
                className={`px-3 py-1 rounded text-xs font-mono border transition
                  ${selected === log ? "bg-aqua text-midnight border-aqua" : "bg-midnight text-aqua border-cyan-800 hover:bg-aqua/20"}
                `}
                onClick={() => loadLog(log)}
              >
                {log}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 px-8 py-3 bg-[#212b38] border-b border-cyan-800">
          <input
            type="text"
            className="bg-[#162a3a] border border-cyan-800 text-aqua rounded px-3 py-2 w-full font-mono placeholder-gray-400"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div
          ref={logRef}
          className="font-mono text-[14px] leading-6 p-5 overflow-auto bg-[#10192b] min-h-[320px] max-h-[540px] rounded-b-3xl"
        >
          {loading ? (
            <span className="text-cyan-400">Loading...</span>
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : (
            logContent.split('\n').map((line, i) => (
              <div key={i} className={colorizeLine(line)}>
                {highlightLog(line, search)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
