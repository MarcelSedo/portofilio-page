/**
 * Tiny sounds for Emma, made with the Web Audio API (no audio files).
 * Nothing plays until the player has tapped something, and everything can be switched off.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let music: { stop: () => void } | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** A plucked note: harpsichord-ish, short and bright. */
function pluck(freq: number, at: number, dur = 0.35, type: OscillatorType = "triangle", vol = 0.6) {
  const a = audio();
  if (!a || !master) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master);
  o.start(at);
  o.stop(at + dur + 0.05);
}

const N = (n: number) => 440 * Math.pow(2, (n - 69) / 12); // MIDI note → Hz

export type Sfx = "door" | "clue" | "page" | "solve" | "wrong" | "pick";

export function sfx(kind: Sfx) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.01;
  if (kind === "door") (pluck(N(88), t, 0.5, "sine", 0.5), pluck(N(84), t + 0.18, 0.7, "sine", 0.5));
  if (kind === "clue") [76, 79, 84].forEach((n, i) => pluck(N(n), t + i * 0.07, 0.4));
  if (kind === "pick") [84, 91].forEach((n, i) => pluck(N(n), t + i * 0.06, 0.3, "sine"));
  if (kind === "solve") [72, 76, 79, 84, 88].forEach((n, i) => pluck(N(n), t + i * 0.08, 0.5));
  if (kind === "wrong") (pluck(N(52), t, 0.3, "square", 0.25), pluck(N(49), t + 0.15, 0.4, "square", 0.25));
  if (kind === "page") {
    const len = Math.floor(a.sampleRate * 0.12);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.4;
    const src = a.createBufferSource();
    const f = a.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 2000;
    src.buffer = buf;
    src.connect(f).connect(master!);
    src.start(t);
  }
}

/** A little waltz on the harpsichord, for the ball. Loops until stopped. */
export function startWaltz() {
  const a = audio();
  if (!a || music) return;
  // bass + two chord notes, 3/4, I – IV – V – I in G major
  const bars = [
    [43, 59, 62], [48, 60, 64], [50, 62, 66], [43, 59, 62],
    [40, 59, 64], [48, 60, 64], [50, 62, 66], [43, 55, 59],
  ];
  const melody = [74, 76, 78, 79, 81, 79, 78, 76, 74, 72, 71, 74, 76, 74, 72, 71, 69, 71, 74, 72, 71, 67, 71, 74];
  const beat = 0.42;
  let stopped = false;
  let next = a.currentTime + 0.05;
  let bar = 0;
  const schedule = () => {
    if (stopped) return;
    while (next < a.currentTime + 1.2) {
      const [b, c1, c2] = bars[bar % bars.length];
      pluck(N(b), next, 0.5, "triangle", 0.45);
      pluck(N(c1), next + beat, 0.25, "square", 0.08);
      pluck(N(c2), next + beat, 0.25, "square", 0.08);
      pluck(N(c1), next + beat * 2, 0.25, "square", 0.08);
      pluck(N(c2), next + beat * 2, 0.25, "square", 0.08);
      for (let k = 0; k < 3; k++) pluck(N(melody[(bar * 3 + k) % melody.length]), next + k * beat, 0.38, "triangle", 0.3);
      next += beat * 3;
      bar++;
    }
    timer = window.setTimeout(schedule, 300);
  };
  let timer = window.setTimeout(schedule, 0);
  music = {
    stop: () => {
      stopped = true;
      window.clearTimeout(timer);
      music = null;
    },
  };
}
export function stopWaltz() {
  music?.stop();
}
