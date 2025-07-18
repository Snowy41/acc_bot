import React, { useEffect, useRef } from "react";

const AnimatedCursor: React.FC = () => {
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

  // Animation via JS (pulse effect)
  useEffect(() => {
    let frame = 0;
    let requestId: number;
    const animate = () => {
      if (glowRef.current) {
        // Pulse between 1 and 1.14x scale and 0.7-1 opacity
        const scale = 1 + 0.14 * Math.sin(frame / 32);
        const opacity = 0.72 + 0.28 * Math.abs(Math.sin(frame / 32));
        glowRef.current.style.opacity = String(opacity);
        glowRef.current.style.transform += ` scale(${scale})`;
      }
      frame++;
      requestId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(requestId);
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed z-[9999] left-0 top-0"
      style={{
        width: 54, // covers normal cursor + glow
        height: 54,
        marginLeft: -27,
        marginTop: -27,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(21,248,219,0.26) 0%, rgba(21,248,219,0.12) 55%, transparent 90%)",
        boxShadow: "0 0 36px 14px #15f8db44, 0 0 88px 20px #15f8db26",
        opacity: 0.9,
        willChange: "transform, opacity",
        mixBlendMode: "lighten",
        pointerEvents: "none",
        border: "none",
      }}
    />
  );
};

export default AnimatedCursor;
