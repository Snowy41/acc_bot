import { useEffect, useRef, useState } from "react";

const USERNAME = "anon";
const HOST = "vanish";
const PROMPT = "$";

const introLines = [
  { command: "nc vanish.rip 31337", output: "" },
  { command: "ssh -o ProxyCommand=onion vanish", output: "" },
  { command: "vanish --connect --crypto", output: "" },
  { command: "", output: "🔓 AUTH OK — entering underground..." },
  { command: "", output: "🎉 WELCOME TO vanish.rip — forum & marketplace loaded." },
];

function getTimestamp(offset: number) {
  const d = new Date(Date.now() - 20000 + offset * 1350);
  return `[${d.toLocaleTimeString("en-GB", { hour12: false })}]`;
}

export default function TerminalIntro({ onFinish }: { onFinish?: () => void }) {
  const [typedLines, setTypedLines] = useState<string[]>([""]);
  const [done, setDone] = useState(false);
  const [cursor, setCursor] = useState({ line: 0, char: 0 });
  const [blinking, setBlinking] = useState(true);

  // Cursor animation
  useEffect(() => {
    if (!done) {
      const interval = setInterval(() => setBlinking((b) => !b), 350);
      return () => clearInterval(interval);
    }
  }, [done]);

  // Type out each line like a real hacker shell
  useEffect(() => {
    if (done) return;
    const { line, char } = cursor;

    if (line >= introLines.length) {
      setTimeout(() => setDone(true), 800);
      if (onFinish) setTimeout(onFinish, 1200);
      return;
    }

    const ts = getTimestamp(line);
    const command = introLines[line].command;
    const output = introLines[line].output;

    let basePrompt = ts + " ";
    if (command)
      basePrompt += `${USERNAME}@${HOST}:~${PROMPT} ` + command;
    else
      basePrompt += " ";

    const lineText = command ? basePrompt : basePrompt + output;

    if (char === 0 && typedLines.length === line) {
      setTypedLines((d) => [...d, ""]);
    }

    if (char < lineText.length) {
      setTimeout(() => {
        setTypedLines((d) => {
          const arr = [...d];
          arr[line + 1] = (arr[line + 1] || "") + lineText[char];
          return arr;
        });
        setCursor((pos) => ({ line, char: char + 1 }));
      }, command ? 16 + Math.random() * 34 : 30); // Faster for commands, slower for output
    } else {
      // Pause longer for output, short for commands
      setTimeout(() => {
        setTypedLines((d) => {
          const arr = [...d];
          arr[line + 1] = arr[line + 1] + "\n";
          return arr;
        });
        setCursor({ line: line + 1, char: 0 });
      }, command ? 330 + Math.random() * 300 : 900 + Math.random() * 320);
    }
    // eslint-disable-next-line
  }, [cursor, done]);

  // Only the current line gets a blinking block cursor (█)
  const displayLines = typedLines.slice(1).map((l, i, arr) =>
    i === arr.length - 1 && !done
      ? l + (blinking ? "█" : " ")
      : l
  );

  // Dynamic width for terminal
  const longest = displayLines.reduce((a, b) => (b.length > a.length ? b : a), "");
  const charWidth = 11.3;
  const minWidth = 330, maxWidth = 640;
  const boxWidth = Math.min(Math.max(minWidth, longest.length * charWidth + 40), maxWidth);

  return (
    <div
      className={`font-mono text-aqua text-[1.13rem] md:text-[1.24rem] px-7 py-7 rounded-2xl border border-cyan-800/40 bg-[#0e1a23]/95 shadow-xl transition-all duration-700 
        ${done ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      style={{
        width: boxWidth,
        minWidth,
        maxWidth,
        whiteSpace: "pre",
        lineHeight: 1.45,
        letterSpacing: "0.015em",
        margin: "0 auto",
        marginTop: "6vh",
        marginBottom: "6vh",
        boxShadow: "0 8px 40px #19e3f555, 0 2px 14px #0ff7",
        zIndex: 1200,
      }}
    >
      {displayLines.length ? displayLines.join("") : ""}
    </div>
  );
}
