import { useEffect, useState } from "react";

type TerminalLine =
  | { type: "cmd"; command: string }
  | { type: "output"; output: string; color?: string };

const USERNAME = "anon";
const HOST = "vanish";
const PROMPT = "$";
const introLines: TerminalLine[] = [
  { type: "cmd", command: "nc vanish.rip 31337" },
  { type: "cmd", command: "ssh -o ProxyCommand=onion vanish" },
  { type: "cmd", command: "vanish --connect --crypto" },
  { type: "output", output: "🔓 AUTH OK — entering underground...", color: "gold" },
  { type: "output", output: "🎉 WELCOME TO vanish.rip — forum & marketplace loaded.", color: "cyan" },
];

// Helper for zero-padding
function pad(num: number) {
  return num < 10 ? "0" + num : "" + num;
}

// Generate the timestamps ONCE per session
function buildStaticTimestamps(count: number) {
  const now = new Date();
  now.setMilliseconds(0);
  const timestamps: string[] = [];
  for (let i = 0; i < count; ++i) {
    const t = new Date(now.getTime() + i * 1000);
    timestamps.push(
      `[${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}]`
    );
  }
  return timestamps;
}

function getPromptColored(typed: string, idx: number, entry: TerminalLine, ts: string) {
  if (entry.type !== "cmd") return <span className="text-white">{typed}</span>;
  const fullPrompt = `${ts} ${USERNAME}@${HOST}:~${PROMPT} `;
  const total = fullPrompt.length;
  if (typed.length <= ts.length + 1)
    return <span className="text-cyan-300">{typed}</span>;
  if (typed.length <= total) {
    return (
      <>
        <span className="text-cyan-300">{typed.slice(0, ts.length)}</span>{" "}
        <span className="text-green-400">
          {typed.slice(ts.length + 1, ts.length + 1 + USERNAME.length)}
        </span>
        <span className="text-white">
          {typed.slice(ts.length + 1 + USERNAME.length, ts.length + 2 + USERNAME.length)}
        </span>
        <span className="text-blue-400">
          {typed.slice(ts.length + 2 + USERNAME.length, ts.length + 2 + USERNAME.length + HOST.length)}
        </span>
        <span className="text-white">
          {typed.slice(ts.length + 2 + USERNAME.length + HOST.length, total - 2)}
        </span>
        <span className="text-yellow-400">{typed.slice(total - 2, total - 1)}</span>
        <span className="text-white">{typed.slice(total - 1, total)}</span>
      </>
    );
  }
  return (
    <>
      <span className="text-cyan-300">{ts}</span>{" "}
      <span className="text-green-400">{USERNAME}</span>
      <span className="text-white">@</span>
      <span className="text-blue-400">{HOST}</span>
      <span className="text-white">:~</span>
      <span className="text-yellow-400">{PROMPT}</span>
      <span className="text-white"> {typed.slice(total)}</span>
    </>
  );
}

function getOutputColored(typed: string, idx: number, entry: TerminalLine, ts: string) {
  const prefix = `${ts} `;
  const color =
    entry.type === "output" && entry.color === "gold"
      ? "text-amber-300"
      : entry.type === "output" && entry.color === "cyan"
      ? "text-aqua"
      : "text-white";
  if (typed.length <= prefix.length)
    return <span className="text-cyan-300">{typed}</span>;
  return (
    <>
      <span className="text-cyan-300">{prefix}</span>
      <span className={color}>{typed.slice(prefix.length)}</span>
    </>
  );
}

export default function TerminalIntro({ onFinish }: { onFinish?: () => void }) {
  // Create the timestamps only once when the component mounts
  const [timestamps] = useState(() => buildStaticTimestamps(introLines.length));
  const [typedLines, setTypedLines] = useState<string[]>([""]);
  const [done, setDone] = useState(false);
  const [cursor, setCursor] = useState({ line: 0, char: 0 });
  const [blinking, setBlinking] = useState(true);

  useEffect(() => {
    if (!done) {
      const interval = setInterval(() => setBlinking((b) => !b), 350);
      return () => clearInterval(interval);
    }
  }, [done]);

  useEffect(() => {
    if (done) return;
    const { line, char } = cursor;
    const entry = introLines[line];
    if (!entry) {
      setTimeout(() => setDone(true), 600);
      if (onFinish) setTimeout(onFinish, 900);
      return;
    }
    const ts = timestamps[line] || "[00:00:00]";
    let lineStr = "";
    if (entry.type === "cmd")
      lineStr = `${ts} ${USERNAME}@${HOST}:~${PROMPT} ${entry.command}`;
    else lineStr = `${ts} ${entry.output}`;
    if (char === 0 && typedLines.length === line)
      setTypedLines((d) => [...d, ""]);
    if (char < lineStr.length) {
      setTimeout(() => {
        setTypedLines((d) => {
          const arr = [...d];
          arr[line + 1] = (arr[line + 1] || "") + lineStr[char];
          return arr;
        });
        setCursor((pos) => ({ line, char: char + 1 }));
      }, entry.type === "cmd" ? 15 + Math.random() * 17 : 25);
    } else {
      setTimeout(() => {
        setTypedLines((d) => {
          const arr = [...d];
          arr[line + 1] = arr[line + 1] + "\n";
          return arr;
        });
        setCursor({ line: line + 1, char: 0 });
      }, entry.type === "cmd" ? 300 + Math.random() * 210 : 880 + Math.random() * 220);
    }
    // eslint-disable-next-line
  }, [cursor, done]);

  const nextLine = (() => {
    const line = cursor.line;
    if (line < introLines.length) {
      const ts = timestamps[line] || "[00:00:00]";
      const entry = introLines[line];
      if (entry.type === "cmd")
        return `${ts} ${USERNAME}@${HOST}:~${PROMPT} ${entry.command}`;
      else return `${ts} ${entry.output}`;
    }
    return "";
  })();

  const displayLines = typedLines.slice(1).map((l, i, arr) =>
    i === arr.length - 1 && !done ? l + (blinking ? "█" : " ") : l
  );

  const charWidth = 12.7;
  const minWidth = 400,
    maxWidth = 780;
  const widestLen = Math.max(
    ...displayLines.map((l) => l.length),
    nextLine.length
  );
  const boxWidth = Math.min(Math.max(minWidth, widestLen * charWidth + 58), maxWidth);

  return (
    <div
      className={`relative font-mono text-aqua text-[1.18rem] md:text-[1.28rem] px-8 py-8 rounded-2xl border border-cyan-800/40 bg-[#111e26]/98 shadow-2xl transition-all duration-700
        ${done ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      style={{
        width: boxWidth,
        minWidth,
        maxWidth,
        whiteSpace: "pre",
        lineHeight: 1.54,
        margin: "0 auto",
        marginTop: "6vh",
        marginBottom: "6vh",
        boxShadow: "0 10px 54px #18fff966, 0 3px 18px #0ff7",
        zIndex: 1100,
        background: "linear-gradient(133deg, #101c24 80%, #182c36 100%)",
      }}
    >
      {/* Mac-style bar */}
      <div className="absolute left-0 top-0 w-full flex items-center h-7 px-6 bg-[#1c2432]/95 rounded-t-2xl border-b border-cyan-800/30 z-10">
        <div className="flex gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
          <span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span>
          <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
        </div>
        <span className="ml-4 text-xs text-cyan-900/70 tracking-widest font-semibold select-none">
          vanish.rip — Secure Terminal
        </span>
      </div>
      <div style={{ marginTop: 24 }}></div>
      {displayLines.map((l, idx) => {
        const entry = introLines[idx];
        const ts = timestamps[idx] || "[00:00:00]";
        if (!entry) return <span key={idx} className="text-white">{l}</span>;
        if (entry.type === "cmd")
          return <div key={idx}>{getPromptColored(l, idx, entry, ts)}</div>;
        else
          return <div key={idx}>{getOutputColored(l, idx, entry, ts)}</div>;
      })}
    </div>
  );
}
