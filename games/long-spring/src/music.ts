/**
 * The music of The Long Spring, made on the spot with Web Audio. No recordings.
 *
 * Ethereal and Celtic rather than tribal: a slow wash of chords, a harp picking out each chord, a high, airy woman's
 * voice without words floating over it (long vowels, lots of room and an echo), and a tin whistle that plays the
 * old airs. A light bodhrán comes in only when the hunt is close, and then the harp runs like a reel.
 *
 * The land sets the colour: low and dark in The Rot, lighter land by land, the whistle leading in Bloom,
 * and at the golden gate only harp, whistle and a bird. When Brigid falls, a slow lament.
 * Browsers let sound start only after the player has done something, so `unlockMusic` runs on the first key or click.
 */
let ctx: BaseAudioContext | null = null;
/** when rendering ahead of time (a preview), how far to schedule */
let horizon: number | null = null;
let master: GainNode | null = null;
let voiceBus: GainNode | null = null;
let pipeBus: GainNode | null = null;
let harpBus: GainNode | null = null;
let padBus: GainNode | null = null;
let drumBus: GainNode | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let on = true;
let vol = 0.6;
type Mood = "menu" | "ride" | "death" | "finale";
let mood: Mood = "menu";
let land = 0;
let danger = 0;
let step = 0;
let nextT = 0;
let noteAt = 0;
let tune: Note[] = [];
let noteIdx = 0;
let phrase = 0;
let nextBird = 0;

type Note = [number | null, string, number];
const VOWELS: Record<string, [number, number][]> = {
  a: [[800, 1], [1150, 0.5], [2900, 0.2]],
  o: [[450, 1], [800, 0.45], [2830, 0.15]],
  u: [[325, 1], [700, 0.3], [2700, 0.1]],
  e: [[400, 1], [2100, 0.4], [2800, 0.2]],
  i: [[310, 1], [2500, 0.35], [3200, 0.2]],
};
// airs in eighths of 6/8, semitones above D: [note or null for a breath, vowel, length]
const AIR: Note[] = [
  [7, "a", 3], [9, "a", 1], [10, "o", 2], [9, "o", 2], [7, "a", 2], [5, "u", 2],
  [7, "a", 4], [null, "", 2], [12, "e", 2], [10, "o", 2], [9, "a", 2], [7, "a", 3], [5, "u", 1],
  [3, "o", 2], [5, "u", 2], [7, "a", 4], [null, "", 2], [14, "i", 2], [12, "e", 1], [10, "o", 1], [9, "a", 2],
  [7, "a", 2], [5, "u", 2], [2, "o", 2], [0, "u", 6], [null, "", 6],
];
const DEEP: Note[] = [
  [0, "o", 3], [3, "o", 3], [2, "u", 2], [0, "o", 4], [null, "", 2],
  [-2, "u", 3], [0, "o", 3], [3, "a", 2], [5, "a", 4], [3, "o", 2], [2, "u", 2], [0, "o", 6], [null, "", 4],
  [7, "a", 3], [5, "o", 1], [3, "o", 2], [2, "u", 2], [0, "u", 2], [-2, "u", 2], [0, "o", 6], [null, "", 6],
];
const BRIGHT: Note[] = [
  [12, "i", 1], [14, "i", 1], [16, "e", 2], [14, "i", 1], [12, "e", 1], [11, "i", 2], [9, "e", 2], [7, "a", 2],
  [9, "e", 1], [11, "i", 1], [12, "i", 4], [null, "", 2], [16, "i", 2], [19, "i", 2], [17, "e", 1], [16, "i", 1],
  [14, "e", 2], [12, "i", 4], [null, "", 2], [11, "i", 1], [12, "i", 1], [14, "e", 2], [12, "i", 2], [9, "a", 2], [7, "a", 6], [null, "", 4],
];
// chords, as semitones above D; each lasts two bars
const Dm = [0, 3, 7];
const D = [0, 4, 7];
const Bb = [-4, 0, 3];
const C = [-2, 2, 5];
const F = [3, 7, 10];
const G = [-7, -3, 0];
const Gm = [-7, -4, 0];
const A = [-5, -1, 2];
const D4 = 293.66;
const hz = (n: number) => D4 * Math.pow(2, n / 12);

/** what each land sounds like */
const LANDS = [
  { tunes: [DEEP, AIR], chords: [Dm, Bb, C, Dm], shift: -5, voice: 0.9, pipe: 0, harp: 0.6, pad: 1, bright: 0 },
  { tunes: [AIR, DEEP], chords: [Dm, C, F, C], shift: 0, voice: 0.9, pipe: 0.35, harp: 0.8, pad: 0.9, bright: 0.3 },
  { tunes: [AIR, BRIGHT], chords: [Dm, C, G, Dm], shift: 0, voice: 0.75, pipe: 0.6, harp: 0.9, pad: 0.8, bright: 0.6 },
  { tunes: [BRIGHT, AIR], chords: [D, G, C, D], shift: 0, voice: 0.5, pipe: 1, harp: 1, pad: 0.7, bright: 1 },
];
const FINALE = { chords: [G, D, C, D] };
const LAMENT = { chords: [Dm, Bb, Gm, A] };

function noiseBuf(c: BaseAudioContext, sec: number) {
  const b = c.createBuffer(1, Math.ceil(c.sampleRate * sec), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function build(offline?: OfflineAudioContext) {
  if (ctx || (!offline && typeof AudioContext === "undefined")) return;
  ctx = offline ?? new AudioContext();
  const c = ctx;
  master = c.createGain();
  master.gain.value = 0;
  master.connect(c.destination);
  // a long cathedral of a room
  const len = c.sampleRate * 4.5;
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
  }
  const rev = c.createConvolver();
  rev.buffer = buf;
  const wet = c.createGain();
  wet.gain.value = 0.7;
  rev.connect(wet).connect(master);
  // an echo that answers a dotted beat later
  const delay = c.createDelay(2);
  delay.delayTime.value = 0.42;
  const fb = c.createGain();
  fb.gain.value = 0.38;
  const dl = c.createBiquadFilter();
  dl.type = "lowpass";
  dl.frequency.value = 2600;
  delay.connect(dl).connect(fb).connect(delay);
  const dwet = c.createGain();
  dwet.gain.value = 0.35;
  dl.connect(dwet);
  dwet.connect(master);
  dwet.connect(rev);
  const bus = (dry: number, send: number, echo: number) => {
    const b = c.createGain();
    b.gain.value = dry;
    b.connect(master!);
    const s = c.createGain();
    s.gain.value = send;
    b.connect(s).connect(rev);
    if (echo) {
      const e = c.createGain();
      e.gain.value = echo;
      b.connect(e).connect(delay);
    }
    return b;
  };
  voiceBus = bus(0.55, 1.2, 0.6);
  pipeBus = bus(0.6, 0.8, 0.35);
  harpBus = bus(0.7, 0.7, 0.25);
  padBus = bus(0.5, 0.9, 0);
  drumBus = bus(0.7, 0.2, 0);
}

/** a high, airy voice: soft attack, long vowels, a slow vibrato */
function sing(t: number, freq: number, vowel: string, dur: number, next: string, level: number) {
  if (!ctx || !voiceBus || level <= 0) return;
  const c = ctx;
  const src = c.createOscillator();
  src.type = "sawtooth";
  const src2 = c.createOscillator();
  src2.type = "sine";
  for (const o of [src, src2]) {
    o.frequency.setValueAtTime(freq * 0.985, t);
    o.frequency.exponentialRampToValueAtTime(freq, t + 0.14);
  }
  const vib = c.createOscillator();
  const vibG = c.createGain();
  vib.frequency.value = 4.6 + Math.random() * 0.5;
  vibG.gain.setValueAtTime(0, t);
  vibG.gain.linearRampToValueAtTime(freq * 0.009, t + Math.min(0.8, dur * 0.7));
  vib.connect(vibG);
  vibG.connect(src.frequency);
  vibG.connect(src2.frequency);
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.4 * level, t + 0.25);
  env.gain.setValueAtTime(0.38 * level, t + dur * 0.8);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
  const mix = c.createGain();
  mix.gain.value = 0.22;
  src.connect(mix);
  const s2 = c.createGain();
  s2.gain.value = 1.4;
  src2.connect(s2).connect(mix);
  const breath = c.createBufferSource();
  breath.buffer = noiseBuf(c, dur + 0.6);
  const bh = c.createBiquadFilter();
  bh.type = "highpass";
  bh.frequency.value = 3000;
  const ng = c.createGain();
  ng.gain.value = 0.08;
  breath.connect(bh).connect(ng).connect(mix);
  const out = c.createGain();
  VOWELS[vowel].forEach(([f, gain], i) => {
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 6 + i * 2;
    bp.frequency.setValueAtTime(f, t);
    if (VOWELS[next]) bp.frequency.linearRampToValueAtTime(VOWELS[next][i][0], t + dur);
    const gg = c.createGain();
    gg.gain.value = gain * 2;
    mix.connect(bp).connect(gg).connect(out);
  });
  // a little of the pure tone straight through: the "ooh" of a choir
  const pure = c.createGain();
  pure.gain.value = 0.25;
  src2.connect(pure).connect(out);
  out.connect(env).connect(voiceBus);
  for (const n of [src, src2, vib, breath]) {
    n.start(t);
    n.stop(t + dur + 0.6);
  }
}

/** a tin whistle: pure and breathy, with a cut (grace note) into the longer notes */
function pipe(t: number, freq: number, dur: number, level: number) {
  if (!ctx || !pipeBus || level <= 0) return;
  const c = ctx;
  const o = c.createOscillator();
  o.type = "sine";
  const o2 = c.createOscillator();
  o2.type = "triangle";
  const f = freq * 2;
  if (dur > 0.3) {
    o.frequency.setValueAtTime(f * 1.122, t);
    o.frequency.setValueAtTime(f, t + 0.045);
  } else o.frequency.setValueAtTime(f, t);
  o2.frequency.value = f;
  const vib = c.createOscillator();
  const vg = c.createGain();
  vib.frequency.value = 5.8;
  vg.gain.setValueAtTime(0, t);
  vg.gain.linearRampToValueAtTime(f * 0.007, t + Math.min(0.4, dur));
  vib.connect(vg);
  vg.connect(o.frequency);
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.2 * level, t + 0.03);
  env.gain.setValueAtTime(0.17 * level, t + dur * 0.85);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
  const g2 = c.createGain();
  g2.gain.value = 0.2;
  o.connect(env);
  o2.connect(g2).connect(env);
  const air = c.createBufferSource();
  air.buffer = noiseBuf(c, dur + 0.1);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = f * 1.5;
  bp.Q.value = 3;
  const ag = c.createGain();
  ag.gain.value = 0.04;
  air.connect(bp).connect(ag).connect(env);
  env.connect(pipeBus);
  for (const n of [o, o2, vib, air]) {
    n.start(t);
    n.stop(t + dur + 0.12);
  }
}

/** a harp string, plucked */
function harp(t: number, freq: number, level: number) {
  if (!ctx || !harpBus || level <= 0) return;
  const c = ctx;
  const o = c.createOscillator();
  o.type = "triangle";
  o.frequency.value = freq;
  const o2 = c.createOscillator();
  o2.type = "sine";
  o2.frequency.value = freq * 2;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16 * level, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0.06 * level, t);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  o.connect(g).connect(harpBus);
  o2.connect(g2).connect(harpBus);
  o.start(t);
  o2.start(t);
  o.stop(t + 1.9);
  o2.stop(t + 0.6);
}

/** a wash of a chord: detuned voices through a soft, slowly opening filter */
function pad(t: number, chord: number[], dur: number, level: number, low: number) {
  if (!ctx || !padBus || level <= 0) return;
  const c = ctx;
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(500, t);
  f.frequency.linearRampToValueAtTime(1400, t + dur * 0.6);
  f.frequency.linearRampToValueAtTime(700, t + dur);
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.06 * level, t + 1.2);
  env.gain.setValueAtTime(0.06 * level, t + dur - 0.2);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.6);
  f.connect(env).connect(padBus);
  for (const n of chord)
    for (const det of [-7, 7]) {
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = hz(n - 12 + low);
      o.detune.value = det;
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 1.7);
    }
  // the root, deep and round
  const sub = c.createOscillator();
  sub.type = "sine";
  sub.frequency.value = hz(chord[0] - 24 + low);
  const sg = c.createGain();
  sg.gain.value = 0.5;
  sub.connect(sg).connect(f);
  sub.start(t);
  sub.stop(t + dur + 1.7);
}

function bird(t: number) {
  if (!ctx || !pipeBus) return;
  const c = ctx;
  const n = 2 + Math.floor(Math.random() * 5);
  const base = 2600 + Math.random() * 1600;
  for (let k = 0; k < n; k++) {
    const s = t + k * (0.07 + Math.random() * 0.05);
    const o = c.createOscillator();
    o.type = "sine";
    const up = Math.random() < 0.6;
    o.frequency.setValueAtTime(base * (up ? 0.8 : 1.25), s);
    o.frequency.exponentialRampToValueAtTime(base * (up ? 1.3 : 0.85), s + 0.06);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.06, s + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.07);
    o.connect(g).connect(pipeBus);
    o.start(s);
    o.stop(s + 0.09);
  }
}

/** a bodhrán, light: only when the hunt is close */
function drum(t: number, strong: boolean, amp: number) {
  if (!ctx || !drumBus || amp <= 0) return;
  const c = ctx;
  if (strong) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.2);
    g.gain.setValueAtTime(0.6 * amp, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    o.connect(g).connect(drumBus);
    o.start(t);
    o.stop(t + 0.3);
  }
  const n = c.createBufferSource();
  n.buffer = noiseBuf(c, 0.08);
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = strong ? 1200 : 2600;
  f.Q.value = 1.1;
  const g = c.createGain();
  g.gain.setValueAtTime((strong ? 0.22 : 0.12) * amp, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  n.connect(f).connect(g).connect(drumBus);
  n.start(t);
}

function nextTune() {
  if (mood === "death") return DEEP;
  if (mood === "finale") return BRIGHT;
  const L = mood === "menu" ? LANDS[Math.min(land, 1)] : LANDS[land];
  return L.tunes[phrase++ % L.tunes.length];
}

function schedule() {
  if (!ctx) return;
  const L = LANDS[mood === "menu" ? Math.min(land, 1) : land];
  const d = mood === "ride" ? danger : 0;
  const bpm = mood === "death" ? 50 : mood === "menu" ? 66 : mood === "finale" ? 72 : 78 + d * 40;
  const eighth = 60 / bpm / 2;
  const chords = mood === "death" ? LAMENT.chords : mood === "finale" ? FINALE.chords : L.chords;
  const low = mood === "death" ? -5 : L.shift;
  while (nextT < (horizon ?? ctx.currentTime + 0.2)) {
    const pos = step % 6;
    const bar = Math.floor(step / 6);
    const chord = chords[Math.floor(bar / 2) % chords.length];
    // the wash of the chord, every two bars
    if (pos === 0 && bar % 2 === 0) pad(nextT, chord, eighth * 12, mood === "finale" ? 0.5 : L.pad, low);
    // the harp: a gentle broken chord, a running reel when the hunt is close
    const harpLvl = mood === "death" ? 0.5 : mood === "finale" ? 1 : L.harp;
    const pattern = [0, 1, 2, 3, 2, 1];
    const notes = [...chord, chord[0] + 12];
    if (mood !== "death" || pos % 3 === 0) {
      harp(nextT, hz(notes[pattern[pos]] + low + (L.bright > 0.5 ? 12 : 0)), harpLvl * (0.55 + (pos === 0 ? 0.3 : 0)));
      if (d > 0.4) harp(nextT + eighth / 2, hz(notes[pattern[(pos + 3) % 6]] + low + 12), harpLvl * 0.4);
    }
    // the bodhrán only for the chase
    if (d > 0.25) {
      const amp = Math.min(1, (d - 0.25) * 1.6);
      drum(nextT, pos === 0 || pos === 3, amp);
      if (d > 0.6) drum(nextT + eighth / 2, false, amp * 0.8);
    }
    if (mood === "finale" && nextT >= nextBird) {
      bird(nextT);
      nextBird = nextT + 0.6 + Math.random() * 1.8;
    }
    if (step >= noteAt) {
      if (noteIdx >= tune.length) {
        tune = nextTune();
        noteIdx = 0;
      }
      const [n, v, len] = tune[noteIdx];
      const nextV = tune[(noteIdx + 1) % tune.length][1];
      if (n !== null) {
        const f = hz(n + (mood === "death" ? -5 : mood === "finale" ? 0 : L.shift));
        const dur = len * eighth * 0.98;
        // the voice floats an octave above the air; the whistle plays it as it is
        const voice = mood === "finale" ? 0.3 : mood === "death" ? 0.8 : mood === "menu" ? 0.8 : L.voice * (1 - d * 0.4);
        const whistle = mood === "finale" ? 0.9 : mood === "death" ? 0 : mood === "menu" ? 0.25 : L.pipe;
        sing(nextT, f * 2, v, dur, nextV, voice);
        pipe(nextT, f, dur, whistle);
      }
      noteAt = step + len;
      noteIdx++;
    }
    step++;
    nextT += eighth;
  }
}

function level() {
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(on ? vol : 0, ctx.currentTime, 0.6);
}

function restartTune() {
  tune = nextTune();
  noteIdx = 0;
  noteAt = step;
}

/** call on the first key or click: from then on the music can play */
export function unlockMusic() {
  if (!on) return;
  build();
  if (!ctx) return;
  if (ctx instanceof AudioContext) void ctx.resume();
  if (!timer) {
    step = noteAt = noteIdx = 0;
    tune = nextTune();
    nextT = ctx.currentTime + 0.1;
    timer = setInterval(schedule, 50);
  }
  level();
}
export function setMusic(v: boolean) {
  on = v;
  if (v) unlockMusic();
  else level();
}
export function setMusicVolume(v: number) {
  vol = Math.max(0, Math.min(1, v));
  level();
}
export function setMusicMood(m: Mood) {
  if (m === mood) return;
  mood = m;
  restartTune();
}
/** 0 The Rot … 3 Bloom */
export function setMusicLand(n: number) {
  const k = Math.max(0, Math.min(LANDS.length - 1, n));
  if (k === land) return;
  land = k;
  if (mood === "ride") restartTune();
}
/** 0 calm … 1 a monster at your neck */
export function setMusicDanger(d: number) {
  danger = Math.max(0, Math.min(1, d));
}

/** render a stretch of the music to a buffer, for listening outside the game (the game itself never calls this) */
export async function renderMusic(seconds: number, m: Mood, landIndex: number, dangerLevel: number): Promise<AudioBuffer> {
  const off = new OfflineAudioContext(2, Math.ceil(44100 * seconds), 44100);
  const keep = { ctx, master, voiceBus, pipeBus, harpBus, padBus, drumBus };
  ctx = null;
  build(off);
  master!.gain.value = 0.9;
  mood = m;
  land = landIndex;
  danger = dangerLevel;
  step = noteAt = noteIdx = phrase = 0;
  tune = nextTune();
  nextT = 0.05;
  nextBird = 0;
  horizon = seconds - 0.5;
  schedule();
  horizon = null;
  const buf = await off.startRendering();
  ({ ctx, master, voiceBus, pipeBus, harpBus, padBus, drumBus } = keep);
  return buf;
}
