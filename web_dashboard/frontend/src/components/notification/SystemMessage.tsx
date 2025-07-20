import { useEffect, useState } from "react";
import "animate.css";

export default function SystemMessage({ text }: { text: string }) {
  const [visible, setVisible] = useState(true);
  const [animClass, setAnimClass] = useState("animate__fadeInDown");

  useEffect(() => {
    setVisible(true);
    setAnimClass("animate__fadeInDown");

    const timer = setTimeout(() => {
      setAnimClass("animate__fadeOutUp");
      setTimeout(() => setVisible(false), 500);
    }, 4000);

    return () => clearTimeout(timer);
  }, [text]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999]">
      <div
        className={`text-white text-lg px-6 py-4 rounded-xl border-2 shadow-xl backdrop-blur-lg
          bg-[#1b2435]/90 border-aqua animate__animated ${animClass}`}
        style={{
          fontWeight: 600,
          letterSpacing: "0.5px",
          boxShadow: "0 0 16px rgba(0, 255, 255, 0.35)",
          textShadow: "0 1px 2px rgba(0,0,0,0.6)",
        }}
      >
        <span className="mr-2 text-aqua text-xl">📣</span>
        {text}
      </div>
    </div>
  );
}

