"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

interface Props {
  locale: Locale;
  label: string;
}

function msToNextBerlinMidnight(now: Date): number {
  const berlinNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const next = new Date(berlinNow);
  next.setHours(24, 0, 0, 0);
  return Math.max(0, next.getTime() - berlinNow.getTime());
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export default function Countdown({ label }: Props) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const tick = () => setMs(msToNextBerlinMidnight(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="text-sm text-slate-400">
      {label}: <span className="font-mono font-semibold text-slate-200">{fmt(ms)}</span>
    </p>
  );
}
