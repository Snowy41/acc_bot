import { useEffect, useState } from "react";

export default function AIBrainMonitor() {
  const [log, setLog] = useState<any[]>([]);
  const [riskDb, setRiskDb] = useState<{ [id: string]: number }>({});
  const [error, setError] = useState("");

  useEffect(() => {
    let timer: any;
    const fetchLog = async () => {
      try {
        const res = await fetch("/ai/admin/log?admin_key=YT123");
        const data = await res.json();
        setLog(data.log.reverse());
        setRiskDb(data.risk_db);
        setError("");
      } catch {
        setError("Failed to load log.");
      }
      timer = setTimeout(fetchLog, 2500); // poll every 2.5s
    };
    fetchLog();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-5xl mx-auto my-12 p-8 bg-[#1c2635]/90 rounded-2xl shadow-2xl border border-cyan-700/30 text-white">
      <h1 className="text-2xl text-aqua font-bold mb-6">AI Brain Monitor</h1>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      <div className="mb-10">
        <h2 className="text-cyan-300 font-semibold text-lg mb-2">Current Risk Scores:</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(riskDb)
            .sort(([, a], [, b]) => b - a)
            .map(([id, score]) => (
              <span key={id} className={`px-3 py-1 rounded-xl bg-cyan-800/50 text-aqua font-mono text-sm ${score >= 10 ? "bg-red-800/70 text-red-300" : ""}`}>
                {id}: {score}
              </span>
            ))}
        </div>
      </div>
      <h2 className="text-cyan-300 font-semibold text-lg mb-2">Recent AI Events:</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="px-3 py-1 text-left">Time</th>
              <th className="px-3 py-1 text-left">Session/User</th>
              <th className="px-3 py-1 text-left">Event</th>
              <th className="px-3 py-1 text-left">Risk</th>
              <th className="px-3 py-1 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {log.map((evt, idx) => (
              <tr key={idx} className="border-b border-cyan-900/30 hover:bg-cyan-900/10">
                <td className="px-3 py-1 font-mono text-cyan-400">{evt.ts ? new Date(evt.ts * 1000).toLocaleTimeString() : ""}</td>
                <td className="px-3 py-1 font-mono">{evt.session_id}</td>
                <td className="px-3 py-1">{evt.event}</td>
                <td className="px-3 py-1 font-mono">{evt.risk}</td>
                <td className="px-3 py-1 text-cyan-200">{JSON.stringify(evt.data)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
