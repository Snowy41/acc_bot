import { useEffect, useState } from "react";

export default function ScriptRunner() {
  const [scripts, setScripts] = useState<string[]>([]);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bots/")
      .then(res => res.json())
      .then(data => setScripts(data.scripts));
  }, []);

  const runScript = (script: string) => {
    setLoading(script);
    setOutput("");
    fetch("/api/bots/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script }),
    })
      .then(res => res.json())
      .then(data => {
        setOutput(data.output);
        setLoading(null);
      });
  };

  return (
    <div className="w-full max-w-xl bg-sidebar rounded-xl p-6 shadow-lg border border-midnight">
      <h2 className="text-aqua text-xl font-bold mb-3">Available Scripts</h2>
      <ul className="space-y-2">
        {scripts.map(script => (
          <li key={script} className="flex items-center justify-between bg-midnight rounded px-3 py-2">
            <span className="font-mono text-aqua">{script}</span>
            <button
              className="bg-aqua text-midnight px-3 py-1 rounded font-semibold shadow hover:bg-cyan-200 transition disabled:opacity-50"
              onClick={() => runScript(script)}
              disabled={loading !== null}
            >
              {loading === script ? "Running..." : "Run"}
            </button>
          </li>
        ))}
      </ul>
      {output && (
        <pre className="mt-4 bg-black text-green-400 rounded p-3 font-mono text-xs overflow-x-auto">
          {output}
        </pre>
      )}
    </div>
  );
}
