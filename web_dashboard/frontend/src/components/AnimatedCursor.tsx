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

  // Animate opacity for pulse (not size)
  useEffect(() => {
    let frame = 0;
    let requestId: number;
    const animate = () => {
      if (glowRef.current) {
        // Subtle opacity pulse between 0.42 and 0.7
        const opacity = 0.42 + 0.28 * Math.abs(Math.sin(frame / 40));
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
        width: 36,
        height: 36,
        marginLeft: -18,
        marginTop: -18,
        borderRadius: "50%",
        background: "radial-gradient(circle, #15f8db55 0%, #15f8db22 60%, transparent 100%)",
        boxShadow: "0 0 14px 6px #15f8db33, 0 0 40px 10px #15f8db22",
        willChange: "opacity, transform",
        mixBlendMode: "lighten",
        border: "none",
        pointerEvents: "none",
      }}
    />
  );
};

export default AnimatedCursor;
