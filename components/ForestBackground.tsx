"use client";

import { useEffect, useRef, useState } from "react";

// Back to front. factor < 1 = moves slower than the page (further away), > 1 = closer.
const LAYERS = [
  { file: "00-sky", factor: 0.3 },
  { file: "10-far-trees", factor: 0.45 },
  { file: "15-fog-far", factor: 0.5 },
  { file: "20-mid-trees", factor: 0.62 },
  { file: "25-rocks", factor: 0.75 },
  { file: "30-stag", factor: 0.75 },
  { file: "35-fog-mid", factor: 0.82 },
  { file: "40-giant-tree", factor: 1 },
  { file: "50-creatures", factor: 1 },
  { file: "60-lights", factor: 1, twinkle: true },
  { file: "70-foreground", factor: 1.15 },
  { file: "80-fog-front", factor: 1.1 },
];

const ASPECT = 3; // artwork is 1:3 (600×1800 / 1200×3600)
const MAX_WIDTH = 900; // must match the desktop column width in globals.css

/**
 * Decorative parallax forest. Render once, first thing inside <body>.
 * Images: /public/forest/1x/*.webp (phones) and /public/forest/2x/*.webp (desktop, retina).
 */
export function ForestBackground() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [size, setSize] = useState<"1x" | "2x">("1x");

  // Pick image size by layout width (and retina), not by DPR alone
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px), (min-resolution: 2dppx)");
    const pick = () => setSize(mq.matches ? "2x" : "1x");
    pick();
    mq.addEventListener("change", pick);
    return () => mq.removeEventListener("change", pick);
  }, []);

  // Parallax on scroll
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const sceneH = Math.min(window.innerWidth, MAX_WIDTH) * ASPECT;
      const scrollable = document.documentElement.scrollHeight - vh;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;

      LAYERS.forEach((layer, i) => {
        const el = refs.current[i];
        if (!el) return;
        const f = reduce ? 1 : layer.factor;
        const y = -progress * Math.max(sceneH - vh, 0) * f;
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

 return (
    <div aria-hidden="true" className="forest-bg">
      <div
        className="forest-ambient"
        style={{
          backgroundImage: `url(/forest/1x/10-far-trees.webp), url(/forest/1x/00-sky.webp)`,
        }}
      />
      <div className="forest-scene">
        {LAYERS.map((layer, i) => (
          <div
            key={layer.file}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={`forest-layer${layer.twinkle ? " forest-twinkle" : ""}`}
            style={{ backgroundImage: `url(/forest/${size}/${layer.file}.webp)` }}
          />
        ))}
      </div>
    </div>
  );
}