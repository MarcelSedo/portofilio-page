/** Tiny beeps and thuds made on the spot with Web Audio. Off until the player turns sound on. */
let ctx: AudioContext | null = null;
let on = false;
let svol = 0.8;

export function setSoundVolume(v: number) {
  svol = Math.max(0, Math.min(1, v));
}

export function setSound(v: boolean) {
  on = v;
  if (v && !ctx && typeof AudioContext !== "undefined") ctx = new AudioContext();
  if (v) ctx?.resume();
}

function tone(freq: number, dur: number, type: OscillatorType, vol = 0.08, slide = 0) {
  if (!on || !ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol * svol * 1.25, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur);
}

function noise(dur: number, vol = 0.12) {
  if (!on || !ctx) return;
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ctx.createBufferSource();
  const g = ctx.createGain();
  g.gain.value = vol * svol * 1.25;
  s.buffer = buf;
  s.connect(g).connect(ctx.destination);
  s.start();
}

export const sfx = {
  seed: () => tone(880, 0.06, "square", 0.04),
  pick: () => (tone(523, 0.08, "square", 0.05), setTimeout(() => tone(784, 0.1, "square", 0.05), 70)),
  jump: () => tone(300, 0.15, "triangle", 0.06, 300),
  duck: () => tone(260, 0.1, "triangle", 0.05, -120),
  hit: () => (noise(0.18, 0.15), tone(110, 0.2, "sawtooth", 0.06, -60)),
  crash: () => noise(0.25, 0.12),
  roar: () => tone(90, 0.5, "sawtooth", 0.07, -40),
  kill: () => (noise(0.12, 0.1), tone(180, 0.2, "square", 0.05, -120)),
  arrow: () => tone(1200, 0.08, "triangle", 0.04, -600),
  chime: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.25, "triangle", 0.05), i * 110)),
  death: () => (noise(0.5, 0.18), tone(160, 0.8, "sawtooth", 0.07, -120)),
  fanfare: () => {
    [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, "triangle", 0.05), i * 90));
    setTimeout(() => [523, 659, 784].forEach((f) => tone(f, 0.7, "triangle", 0.035)), 480);
  },
  eat: () => (noise(0.3, 0.14), tone(70, 0.4, "sawtooth", 0.07, -30)),
  mission: () => [784, 988, 1319].forEach((f, i) => setTimeout(() => tone(f, 0.12, "square", 0.04), i * 80)),
};
