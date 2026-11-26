/** Small, soft sounds made with Web Audio: no files. */
let ctx: AudioContext | null = null;
let on = true;
let rainNode: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

export function setSound(v: boolean) { on = v; if (!v) stopRain(); }
function ac() {
  if (!on) return null;
  if (!ctx) { try { ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { return null; } }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}
function tone(freq: number, dur: number, type: OscillatorType = "triangle", vol = 0.08, when = 0) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + when;
  const o = a.createOscillator(); const g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
}
export const sfx = {
  blip() { tone(880, 0.04, "square", 0.015); },
  select() { tone(660, 0.06, "triangle", 0.05); },
  find() { [784, 988, 1319].forEach((f, i) => tone(f, 0.35, "triangle", 0.06, i * 0.09)); },
  wrong() { tone(220, 0.18, "sawtooth", 0.03); tone(196, 0.22, "sawtooth", 0.03, 0.08); },
  object() { tone(523, 0.12, "square", 0.05); tone(784, 0.25, "square", 0.05, 0.1); },
  door() { tone(180, 0.12, "triangle", 0.05); },
  rub() { tone(1800 + Math.random() * 400, 0.03, "sine", 0.02); },
  stitch() { tone(1200, 0.05, "sine", 0.03); },
  note(deg: number) { const f = [0, 261.6, 293.7, 329.6, 349.2, 392.0][deg] || 261.6; tone(f, 0.7, "triangle", 0.09); tone(f * 2, 0.5, "sine", 0.02); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.4, "triangle", 0.06, i * 0.11)); },
};
export function startRain(level = 1) {
  const a = ac(); if (!a) return;
  if (rainNode) { rainNode.gain.gain.setTargetAtTime(0.05 * level, a.currentTime, 0.4); return; }
  const len = a.sampleRate * 2; const buf = a.createBuffer(1, len, a.sampleRate); const d = buf.getChannelData(0);
  let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5 + w * 0.05; }
  const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
  const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1400;
  const gain = a.createGain(); gain.gain.value = 0; gain.gain.setTargetAtTime(0.05 * level, a.currentTime, 0.6);
  src.connect(f).connect(gain).connect(a.destination); src.start();
  rainNode = { src, gain };
}
export function stopRain() {
  if (!rainNode || !ctx) return;
  const r = rainNode; rainNode = null;
  r.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5); setTimeout(() => { try { r.src.stop(); } catch { /* already stopped */ } }, 2500);
}
