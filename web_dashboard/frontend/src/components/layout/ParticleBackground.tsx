import React, { useRef, useEffect } from "react";

// Theme colors that match your UI
const PARTICLE_COLORS = ["#25f4ee", "#18baff", "#55ffe0", "#1bd6e8"];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

const PARTICLE_COUNT = 50;
const MAX_LINE_DIST = 120;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
};

const createParticle = (w: number, h: number): Particle => ({
  x: randomBetween(0, w),
  y: randomBetween(0, h),
  vx: randomBetween(-0.15, 0.15),
  vy: randomBetween(-0.09, 0.09),
  size: randomBetween(2.2, 4.5),
  color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
});

const ParticleBackground: React.FC = () => {const canvasRef = useRef<HTMLCanvasElement | null>(null);
const particles = useRef<Particle[]>([]);
const animationRef = useRef<number | undefined>(undefined);



  // Handle resizing
  const resize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    // Initialize particles
    const w = window.innerWidth;
    const h = window.innerHeight;
    particles.current = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(w, h)
    );

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current!);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Move particles
      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      }

      // Draw lines between close particles
      for (let i = 0; i < particles.current.length; i++) {
        for (let j = i + 1; j < particles.current.length; j++) {
          const a = particles.current[i];
          const b = particles.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_LINE_DIST) {
            ctx.save();
            ctx.globalAlpha = 1 - dist / MAX_LINE_DIST;
            ctx.strokeStyle = "#18f0ff"; // subtle cyan line
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Draw particles
      for (const p of particles.current) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => cancelAnimationFrame(animationRef.current!);
  }, []);

  // Canvas styling: behind everything, full screen, no pointer events
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        background: "linear-gradient(135deg,#141a24 0%,#10141f 100%)",
        opacity: 1,
        transition: "opacity 0.3s",
      }}
      aria-hidden
    />
  );
};

export default ParticleBackground;
