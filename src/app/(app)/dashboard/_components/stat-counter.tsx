"use client";

import { useEffect, useState } from "react";

/**
 * Count-up island for the dashboard stat tiles. The final value is the resting
 * base state, so SSR and the reduced-motion / hidden-tab paths render the real
 * number directly and it can never get stuck at 0.
 */
export function StatCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || document.hidden || value <= 0) {
      setDisplay(value);
      return;
    }

    setDisplay(0);
    let raf = 0;
    const duration = 850;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    const safety = window.setTimeout(() => setDisplay(value), duration + 250);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
    };
  }, [value]);

  return <>{display}</>;
}
