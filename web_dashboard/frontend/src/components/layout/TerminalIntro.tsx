import { useEffect, useState } from "react";

const USERNAME = "anon";
const HOST = "vanish";
const PROMPT = "$";

type TerminalLine =
  | { type: "cmd"; command: string }
  | { type: "output"; output: string; color?: string };

const introLines: TerminalLine[] = [
  { type: "cmd", command: "nc vanish.rip 31337" },
  { type: "cmd", command: "ssh -o ProxyCommand=onion vanish" },
  { type: "cmd", command: "vanish --connect --crypto" },
  { type: "output", output: "🔓 AUTH OK — entering underground...", color: "gold" },
  { type: "output", output: "🎉 WELCOME TO vanish.rip — forum & marketplace loaded.", color: "cyan" },
];

function getTimestamp(offset = 0) {
  const d = new Date(Date.now() - 20000 + offset * 1350);
  return `[${d.toLocaleTimeString("en-GB", { hour12: false })}]`;
}

export default function TerminalIntro({ onFinish }: { onFinish?: () => void }) {
  const [typedLines, setTypedLines] = useState<string[]>([""]);
  const [done, setDone] = useState(false);
  const [cursor, setCursor] = useState({ line: 0, char: 0 });
  const [blinking, setBlinking] = useState(true);

  // Blinking block cursor (█)
  useEffect(() => {
    if (!done) {
      const interval = setInterval(() => setBlinking((b) => !b), 350);
      return () => clearInterval(interval);
    }
  }, [done]);

  // Typing effect per char
  useEffect(() => {
    if (done) return;
    const { line, char } = cursor;
    if (line >= introLines.length) {
      setTimeout(() => setDone(true), 800);
      if (onFinish) setTimeout(onFinish, 1200);
      return;
    }
    const ts = getTimestamp(line);
    const entry = introLines[line];
     if (!entry) {
        setDone(true);
        if (onFinish) setTimeout(onFinish, 600);
        return;
      }
    let basePrompt = ts + " ";
    if (entry.type === "cmd")
      basePrompt += `<span class="text-green-400">${USERNAME}</span>@<span class="text-blue-400">${HOST}</span>:~<span class="text-yellow-400">${PROMPT}</span> <span class="text-white">${entry.command}</span>`;
    else
      basePrompt += entry.output
        ? `<span class="text-${entry.color === "gold" ? "amber-300" : entry.color === "cyan" ? "aqua" : "white"}">${entry.output}</span>`
        : "";

    // Remove any previous span tags for typing per char
    const noTags = basePrompt.replace(/<[^>]+>/g, "");

    if (char === 0 && typedLines.length === line)
      setTypedLines((d) => [...d, ""]);
    if (char < noTags.length) {
      setTimeout(() => {
        setTypedLines((d) => {
          const arr = [...d];
          arr[line + 1] = (arr[line + 1] || "") + noTags[char];
          return arr;
        });
        setCursor((pos) => ({ line, char: char + 1 }));
      }, entry.type === "cmd" ? 13 + Math.random() * 19 : 27);
    } else {
      setTimeout(() => {
        setTypedLines((d) => {
          const arr = [...d];
          arr[line + 1] = arr[line + 1] + "\n";
          return arr;
        });
        setCursor({ line: line + 1, char: 0 });
      }, entry.type === "cmd" ? 320 + Math.random() * 270 : 920 + Math.random() * 220);
    }
    // eslint-disable-next-line
  }, [cursor, done]);

  // For rendering, apply spans for color after fully typed
    function colorize(line: string, idx: number) {
      const entry = introLines[idx];
      if (!entry) return <span className="text-white">{line}</span>;

      if (entry.type === "cmd") {
        const ts = getTimestamp(idx);
        const command = entry.command;
        // Split the prompt into colored spans, then append the command
        return (
          <span>
            <span className="text-cyan-300">{ts}</span>{" "}
            <span className="text-green-400">{USERNAME}</span>
            <span className="text-white">@</span>
            <span className="text-blue-400">{HOST}</span>
            <span className="text-white">:~</span>
            <span className="text-yellow-400">{PROMPT}</span>
            <span className="text-white"> {command}</span>
          </span>
        );
      }
      if (entry.type === "output" && entry.output) {
        const ts = getTimestamp(idx);
        const color =
          entry.color === "gold"
            ? "text-amber-300"
            : entry.color === "cyan"
            ? "text-aqua"
            : "text-white";
        return (
          <span>
            <span className="text-cyan-300">{ts}</span>{" "}
            <span className={color}>{entry.output}</span>
          </span>
        );
      }
      // fallback: just the line
      return <span className="text-white">{line}</span>;
    }

    // fallback: just the line
    return <span className="text-white">{line}</span>;
  }

  // Always compute the next line's length for box width
  const nextLine = (() => {
    const line = cursor.line;
    if (line < introLines.length) {
      const ts = getTimestamp(line);
      const entry = introLines[line];
      if (entry.type === "cmd")
        return `${ts} ${USERNAME}@${HOST}:~${PROMPT} ${entry.command}`;
      else return `${ts} ${entry.output}`;
    }
    return "";
  })();

  const displayLines = typedLines.slice(1).map((l, i, arr) =>
    i === arr.length - 1 && !done
      ? l + (blinking ? "█" : " ")
      : l
  );

  // Get max length (typed or next line)
  const charWidth = 12.5;
  const minWidth = 370,
    maxWidth = 760;
  const widestLen = Math.max(
    ...displayLines.map((l) => l.length),
    nextLine.length
  );
  const boxWidth = Math.min(Math.max(minWidth, widestLen * charWidth + 52), maxWidth);

  return (
    <div
      className={`relative font-mono text-aqua text-[1.17rem] md:text-[1.22rem] px-7 py-8 rounded-2xl border border-cyan-800/40 bg-[#111e26]/98 shadow-2xl transition-all duration-700
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
      {/* Mac-style window controls */}
      <div className="absolute left-5 top-4 flex gap-2">
        <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
        <span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span>
        <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
      </div>
      <div className="mt-5" />
      {displayLines.map((l, idx) => (
        <div
          key={idx}
          style={{
            minHeight: "1.5em",
            display: "flex",
            alignItems: "center"
          }}
        >
          {colorize(l, idx)}
        </div>
      ))}
    </div>
  );
}
