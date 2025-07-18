import React, { useEffect, useRef } from "react";

const AnimatedCursor: React.FC = () => {
  const ringRef = useRef<HTMLDivElement>(null);

  // For trailing effect (delay the ring a bit)
  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    document.addEventListener("mousemove", move);

    // Animate: smoothly interpolate the ring toward the mouse
    let animationId: number;
    const animate = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.22;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.22;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0)`;
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      document.removeEventListener("mousemove", move);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      ref={ringRef}
      className="pointer-events-none fixed z-[9999] left-0 top-0"
      style={{
        width: 52,
        height: 52,
        marginLeft: -26,
        marginTop: -26,
        borderRadius: "50%",
        border: "2px solid #15f8dbcc",
        boxShadow: "0 0 22px 4px #15f8db99, 0 0 64px 8px #15f8db44",
        background: "rgba(21, 248, 219, 0.09)",
        opacity: 0.8,
        transition: "border-color 0.2s",
        pointerEvents: "none",
        willChange: "transform",
        mixBlendMode: "lighten",
      }}
    />
  );
};

export default AnimatedCursor;
