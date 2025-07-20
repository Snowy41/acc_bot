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

  // Only opacity pulse
  useEffect(() => {
    let frame = 0;
    let requestId: number;
    const animate = () => {
      if (glowRef.current) {
        // Subtle opacity pulse between 0.23 and 0.53
        const opacity = 0.23 + 0.3 * Math.abs(Math.sin(frame / 40));
        glowRef.current.style.opacity = String(opacity);
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
        width: 52,
        height: 52,
        marginLeft: -26,
        marginTop: -26,
        borderRadius: "50%",
        // The key: transparent at center, glow just outside, then fade away
        background: "radial-gradient(circle, transparent 45%, #15f8db66 60%, transparent 100%)",
        boxShadow: "0 0 36px 0px #15f8db33, 0 0 80px 0px #15f8db22",
        willChange: "opacity, transform",
        mixBlendMode: "lighten",
        border: "none",
        pointerEvents: "none",
      }}
    />
  );
};

export default AnimatedCursor;
