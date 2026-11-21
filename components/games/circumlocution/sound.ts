/**
 * Office noises made with the Web Audio API: a rubber stamp, paper, the bell,
 * the five o'clock chime. Nothing plays before the first tap; all of it can be muted.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let on = true;

export function setSound(v: boolean) {
  on = v;
}

function audio() {
  if (typeof window === "undefined" || !on) return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.2;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(dur: number, freq: number, vol: number, at = 0) {
  const a = audio();
  if (!a || !master) return;
  const t = a.currentTime + at;
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = freq;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

function tone(freq: number, dur: number, vol: number, at = 0, type: OscillatorType = "sine") {
  const a = audio();
  if (!a || !master) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export type Sfx = "stamp" | "paper" | "bell" | "chime" | "pancks";

export function sfx(kind: Sfx) {
  if (!on) return;
  if (kind === "stamp") {
    tone(70, 0.18, 0.9, 0, "sine");
    noise(0.09, 900, 0.7);
  } else if (kind === "paper") {
    noise(0.22, 3200, 0.25);
  } else if (kind === "bell") {
    tone(1568, 0.6, 0.35, 0, "triangle");
    tone(2093, 0.4, 0.15, 0.01, "sine");
  } else if (kind === "chime") {
    [784, 659, 523, 392].forEach((f, i) => tone(f, 0.9, 0.3, i * 0.32, "triangle"));
  } else if (kind === "pancks") {
    // a short snort, steam-engine style
    noise(0.12, 500, 0.5);
    noise(0.12, 500, 0.4, 0.16);
  }
}
