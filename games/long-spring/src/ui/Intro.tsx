"use client";
/**
 * The opening of the story: seven pictures, each slowly alive (a slow camera, hair in the wind, floating memories,
 * blinking eyes, glowing light, petals and mist), with a line of narration under each, read aloud.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { speak } from "../voice";

type Rect = [number, number, number, number]; // x, y, w, h as fractions of the picture
type Part =
  | { kind: "sway"; r: Rect; amp: number; dir?: 1 | -1 }
  | { kind: "float"; c: [number, number, number]; amp: number; ph: number }
  | { kind: "pulse"; c: [number, number, number]; amp: number }
  | { kind: "spin"; c: [number, number, number]; speed: number }
  | { kind: "glow"; c: [number, number, number]; rgb: string }
  | { kind: "blink"; c: [number, number, number]; ph: number }
  | { kind: "ink"; c: [number, number, number] }
  | { kind: "shake"; r: Rect; amp: number };
type Slide = { src: string; text: string; focus: [number, number]; parts: Part[]; motes: "petals" | "seeds" | "ash" | "mist" | "sparks" | "none"; tint?: string };

const SLIDES: Slide[] = [
  {
    src: "01", focus: [0.5, 0.45], motes: "petals",
    text: "Before there were kings, there was the wood. And the wood dreamed.",
    parts: [
      { kind: "sway", r: [0.32, 0.12, 0.36, 0.32], amp: 3 },
      { kind: "glow", c: [0.63, 0.62, 0.09], rgb: "255,230,150" },
      { kind: "spin", c: [0.63, 0.62, 0.07], speed: 0.08 },
    ],
  },
  {
    src: "02", focus: [0.5, 0.4], motes: "petals",
    text: "It took what was left of a queen at the foot of a ravine, and gave her roots, and rain, and a new name. Brigid. The one who carries the spring.",
    parts: [
      { kind: "glow", c: [0.6, 0.62, 0.1], rgb: "255,230,150" },
      { kind: "sway", r: [0.36, 0.2, 0.08, 0.32], amp: 3, dir: -1 },
      { kind: "sway", r: [0.56, 0.2, 0.08, 0.32], amp: 3 },
      { kind: "float", c: [0.69, 0.47, 0.06], amp: 2.5, ph: 0 },
    ],
  },
  {
    src: "03", focus: [0.5, 0.38], motes: "seeds", tint: "rgba(200,205,200,0.08)",
    text: "But the land could not give back what she had been. Her memories drifted away like seeds on the wind.",
    parts: [
      { kind: "float", c: [0.36, 0.3, 0.05], amp: 5, ph: 0 },
      { kind: "float", c: [0.565, 0.215, 0.045], amp: 5, ph: 1 },
      { kind: "float", c: [0.645, 0.32, 0.05], amp: 5, ph: 2 },
      { kind: "float", c: [0.325, 0.465, 0.05], amp: 5, ph: 3 },
      { kind: "float", c: [0.38, 0.615, 0.055], amp: 5, ph: 4 },
      { kind: "float", c: [0.68, 0.545, 0.055], amp: 5, ph: 5 },
      { kind: "float", c: [0.62, 0.645, 0.055], amp: 5, ph: 6 },
      { kind: "sway", r: [0.3, 0.55, 0.12, 0.35], amp: 2, dir: -1 },
      { kind: "sway", r: [0.58, 0.55, 0.12, 0.35], amp: 2 },
    ],
  },
  {
    src: "04", focus: [0.5, 0.5], motes: "ash",
    text: "The kings dug too deep, and woke what lay below. Now the dark is closing round the world, and everything it touches forgets it was ever alive.",
    parts: [
      { kind: "spin", c: [0.5, 0.17, 0.06], speed: 0.25 },
      { kind: "glow", c: [0.5, 0.17, 0.1], rgb: "255,120,60" },
      { kind: "ink", c: [0.49, 0.5, 0.13] },
      { kind: "ink", c: [0.27, 0.37, 0.05] },
      { kind: "ink", c: [0.7, 0.36, 0.045] },
      { kind: "ink", c: [0.68, 0.6, 0.06] },
    ],
  },
  {
    src: "05", focus: [0.53, 0.52], motes: "mist",
    text: "The rot has many mouths. It hunts whatever still remembers.",
    parts: [
      { kind: "pulse", c: [0.53, 0.53, 0.11], amp: 0.06 },
      { kind: "pulse", c: [0.2, 0.35, 0.06], amp: 0.08 },
      { kind: "pulse", c: [0.76, 0.37, 0.06], amp: 0.08 },
      { kind: "pulse", c: [0.72, 0.74, 0.05], amp: 0.08 },
      { kind: "blink", c: [0.82, 0.245, 0.03], ph: 0 },
      { kind: "blink", c: [0.87, 0.56, 0.028], ph: 1.3 },
      { kind: "blink", c: [0.82, 0.775, 0.028], ph: 2.1 },
      { kind: "blink", c: [0.14, 0.71, 0.024], ph: 0.7 },
      { kind: "blink", c: [0.23, 0.53, 0.02], ph: 2.7 },
      { kind: "blink", c: [0.33, 0.21, 0.022], ph: 1.8 },
      { kind: "shake", r: [0.1, 0.5, 0.28, 0.42], amp: 2 },
    ],
  },
  {
    src: "06", focus: [0.55, 0.48], motes: "sparks",
    text: "Yet every memory she wins back is a place the dark must give up. Where she remembers, the land remembers. And the spring returns.",
    parts: [
      { kind: "glow", c: [0.555, 0.495, 0.11], rgb: "255,236,160" },
      { kind: "pulse", c: [0.555, 0.495, 0.07], amp: 0.05 },
      { kind: "shake", r: [0.0, 0.4, 0.26, 0.5], amp: 3 },
      { kind: "float", c: [0.7, 0.44, 0.05], amp: 2, ph: 0 },
    ],
  },
  {
    src: "07", focus: [0.55, 0.45], motes: "petals",
    text: "Somewhere at the end of that road lies the last thing she lost. Ride, Brigid. Win back the world, one memory at a time.",
    parts: [
      { kind: "sway", r: [0.19, 0.14, 0.24, 0.32], amp: 5, dir: -1 },
      { kind: "glow", c: [0.72, 0.42, 0.12], rgb: "255,230,150" },
      { kind: "spin", c: [0.72, 0.43, 0.07], speed: 0.06 },
    ],
  },
];

type Mote = { x: number; y: number; vx: number; vy: number; r: number; ph: number; c: string };

export function Intro({ onDone, voice: voiceOn, calm }: { onDone: () => void; voice: boolean; calm: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [i, setI] = useState(0);
  const [voice, setVoice] = useState(voiceOn);
  const [shown, setShown] = useState(0);
  const imgs = useRef<HTMLImageElement[]>([]);
  const start = useRef(performance.now());
  const prev = useRef<{ i: number; t: number } | null>(null);
  const spoken = useRef(false);
  const timeUp = useRef(false);
  const stopVoice = useRef<() => void>(() => {});
  const iRef = useRef(0);
  const motes = useRef<Mote[]>([]);
  const btn = useRef<HTMLButtonElement>(null);
  const reduce = calm || (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  // load the pictures
  useEffect(() => {
    imgs.current = SLIDES.map((s) => {
      const im = new Image();
      im.src = `/long-spring/intro/${s.src}.webp`;
      return im;
    });
    btn.current?.focus({ preventScroll: true });
    return () => stopVoice.current();
  }, []);

  const next = useCallback(() => {
    const n = iRef.current + 1;
    stopVoice.current();
    if (n >= SLIDES.length) return onDone();
    prev.current = { i: iRef.current, t: performance.now() };
    iRef.current = n;
    setI(n);
  }, [onDone]);

  // each slide: its voice, and its time; it moves on when both are done
  useEffect(() => {
    start.current = performance.now();
    spoken.current = !voice;
    timeUp.current = false;
    setShown(0);
    const s = SLIDES[i];
    const words = s.text.split(/\s+/).length;
    const dur = Math.max(6500, words * 420 + 2500);
    const tm = setTimeout(() => {
      timeUp.current = true;
      if (spoken.current) next();
    }, dur);
    if (voice) {
      // let the picture come in first
      const vt = setTimeout(() => {
        stopVoice.current = speak(s.text, () => {
          spoken.current = true;
          if (timeUp.current) setTimeout(next, 900);
        });
      }, 700);
      return () => {
        clearTimeout(tm);
        clearTimeout(vt);
      };
    }
    return () => clearTimeout(tm);
  }, [i, voice, next]);

  // the words come in a few at a time, as they are read
  useEffect(() => {
    const words = SLIDES[i].text.split(/\s+/).length;
    if (shown >= words) return;
    const t = setTimeout(() => setShown((n) => n + 1), reduce ? 0 : 230);
    return () => clearTimeout(t);
  }, [shown, i, reduce]);

  // drawing
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const cv = canvas.current;
      if (!cv) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = cv.clientWidth;
      const H = cv.clientHeight;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
      }
      const g = cv.getContext("2d")!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = "#0a0806";
      g.fillRect(0, 0, W, H);
      const now = performance.now();
      const p = prev.current;
      const fade = p ? Math.min(1, (now - p.t) / 1200) : 1;
      if (p && fade < 1) paint(g, W, H, p.i, (now - start.current) / 1000 + 8, 1);
      paint(g, W, H, iRef.current, (now - start.current) / 1000, p ? fade : Math.min(1, (now - start.current) / 900));
      if (p && fade >= 1) prev.current = null;
    };
    const paint = (g: CanvasRenderingContext2D, W: number, H: number, k: number, t: number, alpha: number) => {
      const s = SLIDES[k];
      const im = imgs.current[k];
      if (!im || !im.complete || !im.naturalWidth) return;
      g.save();
      g.globalAlpha = alpha;
      // the picture fills the screen (contain), and the camera drifts slowly in towards its focus
      const base = Math.min(W / im.naturalWidth, H / im.naturalHeight);
      const zoom = reduce ? 1 : 1 + Math.min(1, t / 12) * 0.07;
      const sc = base * zoom;
      const dw = im.naturalWidth * sc;
      const dh = im.naturalHeight * sc;
      const fx = s.focus[0] * im.naturalWidth * sc;
      const fy = s.focus[1] * im.naturalHeight * sc;
      const ox = (W - im.naturalWidth * base) / 2 - (fx - s.focus[0] * im.naturalWidth * base);
      const oy = (H - im.naturalHeight * base) / 2 - (fy - s.focus[1] * im.naturalHeight * base);
      g.drawImage(im, ox, oy, dw, dh);
      const P = (fx2: number, fy2: number) => [ox + fx2 * dw, oy + fy2 * dh] as const;
      const S = (fr: number) => fr * dw;
      const src = (fx2: number, fy2: number) => [fx2 * im.naturalWidth, fy2 * im.naturalHeight] as const;
      if (!reduce)
        for (const part of s.parts) {
          if (part.kind === "sway") {
            // hair in the wind: thin strips of the picture slide sideways, more towards the free end
            const [rx, ry, rw, rh] = part.r;
            const n = 40;
            for (let j = 0; j < n; j++) {
              const f = j / n;
              const [sx, sy] = src(rx, ry + rh * f);
              const [x, y] = P(rx, ry + rh * f);
              const off = Math.sin(t * 1.6 + f * 6) * part.amp * (0.3 + f) * (part.dir ?? 1) * (dw / 1200);
              g.drawImage(im, sx, sy, rw * im.naturalWidth, (rh * im.naturalHeight) / n + 1, x + off, y, S(rw), (rh * dh) / n + 1);
            }
          } else if (part.kind === "float" || part.kind === "pulse" || part.kind === "spin" || part.kind === "shake") {
            const [cx, cy, r] = part.kind === "shake" ? [part.r[0] + part.r[2] / 2, part.r[1] + part.r[3] / 2, Math.max(part.r[2], part.r[3]) / 2] : part.c;
            const [x, y] = P(cx, cy);
            const rr = S(r);
            g.save();
            g.beginPath();
            if (part.kind === "shake") {
              const [rx, ry, rw, rh] = part.r;
              const [x0, y0] = P(rx, ry);
              g.rect(x0, y0, S(rw), rh * dh);
            } else g.arc(x, y, rr, 0, Math.PI * 2);
            g.clip();
            g.translate(x, y);
            if (part.kind === "float") g.translate(Math.sin(t * 0.9 + part.ph) * 1.2, Math.sin(t * 1.3 + part.ph) * part.amp * (dw / 1200));
            if (part.kind === "pulse") g.scale(1 + Math.sin(t * 2.2) * part.amp, 1 + Math.sin(t * 2.2) * part.amp * 1.3);
            if (part.kind === "spin") g.rotate(t * part.speed);
            if (part.kind === "shake") g.translate(-Math.abs(Math.sin(t * 1.4)) * part.amp * 3 * (dw / 1200), Math.sin(t * 9) * part.amp * 0.4);
            g.translate(-x, -y);
            g.drawImage(im, ox, oy, dw, dh);
            g.restore();
          } else if (part.kind === "glow") {
            const [x, y] = P(part.c[0], part.c[1]);
            const rr = S(part.c[2]) * (1 + Math.sin(t * 1.5) * 0.08);
            const gr = g.createRadialGradient(x, y, 0, x, y, rr * 2);
            gr.addColorStop(0, `rgba(${part.rgb},${(0.35 + Math.sin(t * 1.5) * 0.1).toFixed(3)})`);
            gr.addColorStop(1, `rgba(${part.rgb},0)`);
            g.globalCompositeOperation = "lighter";
            g.fillStyle = gr;
            g.fillRect(x - rr * 2, y - rr * 2, rr * 4, rr * 4);
            g.globalCompositeOperation = "source-over";
          } else if (part.kind === "blink") {
            // an eye closes now and then
            const cyc = (t + part.ph) % 3.4;
            if (cyc < 0.18) {
              const [x, y] = P(part.c[0], part.c[1]);
              const rr = S(part.c[2]);
              g.fillStyle = "#0c0808";
              g.beginPath();
              g.ellipse(x, y, rr * 1.1, rr * 0.7 * Math.sin((cyc / 0.18) * Math.PI) + 0.5, 0, 0, Math.PI * 2);
              g.fill();
            }
          } else if (part.kind === "ink") {
            // the rot breathes and spreads
            const [x, y] = P(part.c[0], part.c[1]);
            const rr = S(part.c[2]) * (1 + Math.min(1, t / 10) * 0.35 + Math.sin(t * 1.1) * 0.05);
            const gr = g.createRadialGradient(x, y, rr * 0.2, x, y, rr);
            gr.addColorStop(0, "rgba(6,4,8,0.55)");
            gr.addColorStop(1, "rgba(6,4,8,0)");
            g.fillStyle = gr;
            g.beginPath();
            g.arc(x, y, rr, 0, Math.PI * 2);
            g.fill();
          }
        }
      if (s.tint) {
        g.fillStyle = s.tint;
        g.fillRect(ox, oy, dw, dh);
      }
      // what drifts over the picture
      if (!reduce && s.motes !== "none" && alpha > 0.2) drawMotes(g, ox, oy, dw, dh, s.motes, k);
      g.restore();
    };
    const drawMotes = (g: CanvasRenderingContext2D, ox: number, oy: number, dw: number, dh: number, kind: Slide["motes"], k: number) => {
      const M = motes.current;
      const want = kind === "mist" ? 14 : 40;
      if ((M as Mote[] & { k?: number }).k !== k) {
        M.length = 0;
        (M as Mote[] & { k?: number }).k = k;
      }
      while (M.length < want) {
        const cols = kind === "petals" ? ["#ffd8e6", "#ffffff", "#f0b8cc"] : kind === "seeds" ? ["#efeadc"] : kind === "ash" ? ["#ff8a5a", "#3a2a2a"] : kind === "sparks" ? ["#fff4b0", "#ffffff", "#c8ffb0"] : ["#5a8a4a"];
        M.push({
          x: Math.random(), y: Math.random(), vx: kind === "seeds" ? 0.03 + Math.random() * 0.03 : (Math.random() - 0.3) * 0.02,
          vy: kind === "ash" ? -0.01 - Math.random() * 0.01 : kind === "mist" ? 0 : 0.012 + Math.random() * 0.015,
          r: kind === "mist" ? 0.08 + Math.random() * 0.08 : 0.003 + Math.random() * 0.003, ph: Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)],
        });
      }
      const dt = 1 / 60;
      g.save();
      g.beginPath();
      g.rect(ox, oy, dw, dh);
      g.clip();
      for (const m of M) {
        m.ph += dt;
        m.x += (m.vx + Math.sin(m.ph) * 0.004) * dt * (kind === "mist" ? 0.6 : 1);
        m.y += m.vy * dt;
        if (kind === "mist") m.x += 0.01 * dt;
        if (m.x > 1.1) m.x = -0.1;
        if (m.x < -0.1) m.x = 1.1;
        if (m.y > 1.05) m.y = -0.05;
        if (m.y < -0.05) m.y = 1.05;
        const x = ox + m.x * dw;
        const y = oy + m.y * dh;
        if (kind === "mist") {
          const gr = g.createRadialGradient(x, y, 0, x, y, m.r * dw);
          gr.addColorStop(0, "rgba(90,150,80,0.22)");
          gr.addColorStop(1, "rgba(90,150,80,0)");
          g.fillStyle = gr;
          g.fillRect(x - m.r * dw, y - m.r * dw, m.r * dw * 2, m.r * dw * 2);
        } else if (kind === "seeds") {
          g.strokeStyle = m.c;
          g.globalAlpha = 0.7;
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x + 5, y - 5);
          g.moveTo(x, y);
          g.lineTo(x + 6, y - 1);
          g.stroke();
          g.globalAlpha = 1;
        } else {
          g.fillStyle = m.c;
          g.beginPath();
          g.ellipse(x, y, m.r * dw * 1.6, m.r * dw, m.ph * 2, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.restore();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        e.preventDefault();
        stopVoice.current();
        onDone();
      } else if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowRight") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [next, onDone]);

  const words = SLIDES[i].text.split(/\s+/);
  return (
    <div className="ls-intro" role="dialog" aria-modal="true" aria-label="The beginning of the story">
      <canvas ref={canvas} className="ls-intro-cv" onClick={next} aria-hidden="true" />
      <p className="ls-intro-text" aria-live="polite">
        <span className="sr-only">{SLIDES[i].text}</span>
        <span aria-hidden="true">
          {words.map((w, k) => (
            <span key={`${i}-${k}`} className={k < shown ? "is-in" : ""}>
              {w}{" "}
            </span>
          ))}
        </span>
      </p>
      <div className="ls-intro-bar">
        <span className="ls-intro-dots" aria-hidden="true">
          {SLIDES.map((_, k) => (
            <span key={k} className={k === i ? "is-on" : k < i ? "is-done" : ""} />
          ))}
        </span>
        <button
          type="button"
          className="ls-chipbtn"
          aria-pressed={voice}
          onClick={() => {
            if (voice) stopVoice.current();
            setVoice(!voice);
          }}
        >
          {voice ? "🔊 Voice" : "🔈 Voice off"}
        </button>
        <button type="button" className="ls-chipbtn" onClick={next}>
          Next ▸
        </button>
        <button
          type="button"
          className="ls-chipbtn"
          ref={btn}
          onClick={() => {
            stopVoice.current();
            onDone();
          }}
        >
          Skip ▸▸
        </button>
      </div>
    </div>
  );
}
