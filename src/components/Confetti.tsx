"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

export interface ConfettiHandle {
  burst: (x: number, y: number, count?: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  circle: boolean;
}

const COLORS = ["#34d399", "#fbbf24", "#38bdf8", "#fb7185", "#f8fafc", "#f472b6"];

/** Tiny dependency-free confetti canvas. Call burst(x, y, count) — keep counts modest. */
const Confetti = forwardRef<ConfettiHandle>(function Confetti(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parts = useRef<Particle[]>([]);
  const raf = useRef(0);
  const view = useRef({ w: 0, h: 0 });

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      raf.current = 0;
      return;
    }
    ctx.clearRect(0, 0, view.current.w, view.current.h);
    parts.current = parts.current.filter((p) => p.life < p.max);
    for (const p of parts.current) {
      p.life++;
      p.vy += 0.1;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(1 - p.life / p.max, 0);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.circle) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      }
      ctx.restore();
    }
    if (parts.current.length > 0) {
      raf.current = requestAnimationFrame(tick);
    } else {
      raf.current = 0;
      ctx.clearRect(0, 0, view.current.w, view.current.h);
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      burst(x, y, count = 14) {
        if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 1 + Math.random() * 2.5;
          parts.current.push({
            x,
            y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 1.5,
            life: 0,
            max: 80 + Math.random() * 40,
            size: 7 + Math.random() * 7,
            color: COLORS[(Math.random() * COLORS.length) | 0],
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.25,
            circle: Math.random() < 0.4,
          });
        }
        if (!raf.current) tick();
      },
    }),
    [tick],
  );

  useEffect(() => {
    const fit = () => {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.floor(window.innerWidth * dpr);
      c.height = Math.floor(window.innerHeight * dpr);
      c.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      view.current = { w: window.innerWidth, h: window.innerHeight };
    };
    fit();
    window.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" />;
});

export default Confetti;
