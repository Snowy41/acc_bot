import React, { useEffect, useRef } from "react";

const AnimatedCursorGlow: React.FC = () => {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };
    document.addEventListener("mousemove", move);
    return () => document.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed z-[9999] left-0 top-0"
      style={{
        width: 38,
        height: 38,
        marginLeft: -19,
        marginTop: -19,
        borderRadius: "50%",
        background: "radial-gradient(circle, #1cfcd4cc 0%, #15f8db33 70%, transparent 100%)",
        boxShadow: "0 0 16px 8px #15f8db77, 0 0 48px 12px #15f8db44",
        opacity: 0.85,
        animation: "cursor-pulse 1.4s infinite cubic-bezier(.4,0,.6,1)",
        willChange: "transform, opacity",
        mixBlendMode: "lighten",
      }}
    />
  );
};

export default AnimatedCursorGlow;
