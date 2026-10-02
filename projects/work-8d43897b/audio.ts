/**
 * Original score and Foley for “为什么越刷越累”.
 * Every sound is evaluated at absolute source time, so seeking and rendering
 * short windows produce the same score. No AudioContext or timers are created.
 */
type AudioRequest = {
  trackId?: string;
  context: BaseAudioContext;
  destination: AudioNode;
  when?: number;
  offset?: number;
  duration?: number;
  rate?: number;
};

type Stereo = { left: Float32Array; right: Float32Array; start: number; sampleStart: number; sr: number };
type Palette = { sine: Float32Array; bass: Float32Array; pluck: Float32Array; pad: Float32Array };

const BPM = 128;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const LENGTH = 90;

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function smooth(value: number): number {
  const x = clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
}

function hz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function palette(): Palette {
  const size = 4096;
  const sine = new Float32Array(size);
  const bass = new Float32Array(size);
  const pluck = new Float32Array(size);
  const pad = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    const phase = i * Math.PI * 2 / size;
    const s = Math.sin(phase);
    sine[i] = s;
    // Rounded oscillators avoid the brittle, unfiltered saw-wave sound.
    bass[i] = (s + 0.27 * Math.sin(phase * 2) + 0.12 * Math.sin(phase * 3)
      + 0.035 * Math.sin(phase * 5)) / 1.35;
    pluck[i] = (s + 0.19 * Math.sin(phase * 2) + 0.06 * Math.sin(phase * 3)) / 1.21;
    pad[i] = (s + 0.10 * Math.sin(phase * 3) + 0.028 * Math.sin(phase * 5)) / 1.10;
  }
  return { sine, bass, pluck, pad };
}

function osc(table: Float32Array, phase: number): number {
  const at = (phase - Math.floor(phase)) * table.length;
  const index = at | 0;
  const fraction = at - index;
  return table[index] + (table[(index + 1) & (table.length - 1)] - table[index]) * fraction;
}

function noise(sample: number, seed: number): number {
  let n = (sample | 0) ^ seed;
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
  return ((n ^ (n >>> 16)) >>> 0) / 2147483648 - 1;
}

function bounds(out: Stereo, at: number, duration: number): [number, number] {
  return [Math.max(0, Math.ceil(at * out.sr - out.sampleStart - 1e-5)),
    Math.min(out.left.length, Math.ceil((at + duration) * out.sr - out.sampleStart - 1e-5))];
}

function add(out: Stereo, index: number, value: number, pan = 0): void {
  // Constant-power balance, lightly narrowed so mono listening stays robust.
  out.left[index] += value * (0.7071 - pan * 0.25);
  out.right[index] += value * (0.7071 + pan * 0.25);
}

function kick(out: Stereo, tables: Palette, at: number, volume: number): void {
  const [first, last] = bounds(out, at, 0.34);
  for (let i = first; i < last; i++) {
    const age = (out.sampleStart + i) / out.sr - at;
    const pitchDrop = Math.exp(-age / 0.022);
    const phase = 46 * age + 106 * 0.022 * (1 - pitchDrop);
    const attack = smooth(age / 0.0025);
    const body = osc(tables.sine, phase) * Math.exp(-age / 0.102);
    const tick = noise((out.sampleStart + i + 1e-5) | 0, 301) * Math.exp(-age / 0.006) * 0.08;
    add(out, i, (body + tick) * attack * volume * (1 - smooth((age - 0.31) / 0.03)));
  }
}

function snare(out: Stereo, tables: Palette, at: number, volume: number): void {
  const [first, last] = bounds(out, at, 0.28);
  for (let i = first; i < last; i++) {
    const age = (out.sampleStart + i) / out.sr - at;
    const sample = (out.sampleStart + i + 1e-5) | 0;
    const n = noise(sample, 431);
    const high = n - noise(sample - 1, 431) * 0.56;
    const body = osc(tables.sine, 178 * age) * Math.exp(-age / 0.040) * 0.31;
    let clap = 0;
    for (const tap of [0, 0.010, 0.024]) {
      if (age >= tap) clap += Math.exp(-(age - tap) / 0.030) * 0.13;
    }
    const envelope = smooth(age / 0.0015);
    add(out, i, (high * (Math.exp(-age / 0.077) * 0.42 + clap) + body) * volume * envelope
      * (1 - smooth((age - 0.25) / 0.03)), 0.06);
  }
}

function hat(out: Stereo, at: number, volume: number, open = false): void {
  const lifetime = open ? 0.23 : 0.085;
  const [first, last] = bounds(out, at, lifetime);
  for (let i = first; i < last; i++) {
    const age = (out.sampleStart + i) / out.sr - at;
    const sample = (out.sampleStart + i + 1e-5) | 0;
    const high = noise(sample, 811) - noise(sample - 1, 811) * 0.85;
    const envelope = Math.exp(-age / (open ? 0.060 : 0.016)) * smooth(age / 0.001)
      * (1 - smooth((age - lifetime + 0.012) / 0.012));
    add(out, i, high * envelope * volume, open ? 0.36 : -0.26);
  }
}

function bassNote(out: Stereo, tables: Palette, at: number, note: number,
  gate: number, volume: number, round = false): void {
  const release = 0.10;
  const [first, last] = bounds(out, at, gate + release);
  const frequency = hz(note);
  let phase = ((out.sampleStart + first) / out.sr - at) * frequency;
  const step = frequency / out.sr;
  for (let i = first; i < last; i++, phase += step) {
    const age = (out.sampleStart + i) / out.sr - at;
    const envelope = smooth(age / 0.012) * (age < gate ? 1 : 1 - smooth((age - gate) / release));
    const tone = round ? osc(tables.sine, phase) : osc(tables.bass, phase);
    const sub = osc(tables.sine, phase * 0.5) * 0.16;
    add(out, i, (tone + sub) * envelope * volume * (1 - 0.22 * Math.min(age / gate, 1)));
  }
}

function pluck(out: Stereo, tables: Palette, at: number, note: number, volume: number,
  decay = 0.16, pan = 0): void {
  const [first, last] = bounds(out, at, decay * 6);
  const frequency = hz(note);
  let phase = ((out.sampleStart + first) / out.sr - at) * frequency;
  const step = frequency / out.sr;
  for (let i = first; i < last; i++, phase += step) {
    const age = (out.sampleStart + i) / out.sr - at;
    const envelope = smooth(age / 0.008) * Math.exp(-age / decay)
      * (1 - smooth((age - decay * 5) / decay));
    add(out, i, osc(tables.pluck, phase) * envelope * volume, pan);
  }
}

function echoedPluck(out: Stereo, tables: Palette, at: number, note: number, volume: number,
  decay = 0.16, pan = 0): void {
  pluck(out, tables, at, note, volume, decay, pan);
  pluck(out, tables, at + BEAT * 0.75, note, volume * 0.28, decay, -pan * 0.8);
  pluck(out, tables, at + BEAT * 1.5, note, volume * 0.09, decay, pan * 0.6);
}

function chord(out: Stereo, tables: Palette, at: number, notes: number[], duration: number,
  volume: number, attack = 0.7): void {
  const release = Math.min(1.2, duration * 0.28);
  const [first, last] = bounds(out, at, duration + release);
  for (let n = 0; n < notes.length; n++) {
    const frequency = hz(notes[n]);
    const ageAtFirst = (out.sampleStart + first) / out.sr - at;
    let phaseL = ageAtFirst * frequency * 0.9991 + n * 0.073;
    let phaseR = ageAtFirst * frequency * 1.0009 + n * 0.073 + 0.10;
    const stepL = frequency * 0.9991 / out.sr;
    const stepR = frequency * 1.0009 / out.sr;
    for (let i = first; i < last; i++, phaseL += stepL, phaseR += stepR) {
      const age = (out.sampleStart + i) / out.sr - at;
      const envelope = smooth(age / attack) * (age < duration ? 1 : 1 - smooth((age - duration) / release));
      const breath = 0.94 + osc(tables.sine, age * 0.19 + n * 0.21) * 0.06;
      out.left[i] += osc(tables.pad, phaseL) * volume * envelope * breath;
      out.right[i] += osc(tables.pad, phaseR) * volume * envelope * breath;
    }
  }
}

function sweep(out: Stereo, tables: Palette, at: number, duration: number, volume: number,
  seed: number, direction = 1, tone = 0): void {
  const [first, last] = bounds(out, at, duration);
  for (let i = first; i < last; i++) {
    const age = (out.sampleStart + i) / out.sr - at;
    const progress = age / duration;
    const envelope = smooth(progress / 0.36) * (1 - smooth((progress - 0.45) / 0.55));
    const sample = (out.sampleStart + i + 1e-5) | 0;
    const softNoise = (noise(sample, seed) + noise(sample - 1, seed) + noise(sample - 2, seed)) / 3;
    const chirpPhase = (direction > 0 ? 110 : 430) * age + direction * 150 * age * age / duration;
    const value = softNoise * 0.8 + osc(tables.sine, chirpPhase) * tone;
    add(out, i, value * envelope * volume, direction * (progress - 0.5) * 1.2);
  }
}

function renderMusic(out: Stereo, tables: Palette): void {
  const minorChords = [[59, 62, 66, 69], [55, 59, 62, 66], [57, 62, 66, 69], [57, 61, 64, 71]];
  const roots = [35, 31, 38, 33];
  // Two-bar harmony; the familiar phrase returns with a major resolution later.
  for (let at = 0, index = 0; at < 42; at += BAR * 2, index++) {
    chord(out, tables, at, minorChords[index % 4], Math.min(BAR * 2, 42.2 - at), 0.022, at === 0 ? 0.25 : 0.52);
  }
  chord(out, tables, 43.05, [59, 62, 66, 73], 4.8, 0.020, 0.50);
  chord(out, tables, 48.0, [55, 59, 62, 66], 3.7, 0.024, 0.65);
  for (let at = 52, index = 0; at < 66; at += BAR * 2, index++) {
    chord(out, tables, at, minorChords[(index + 2) % 4], Math.min(BAR * 2, 66 - at), 0.028, 0.40);
  }
  chord(out, tables, 66, [57, 62, 66, 69, 76], 5.3, 0.025, 0.62);
  chord(out, tables, 71.5, [57, 61, 64, 71], 3.8, 0.027, 0.65);
  chord(out, tables, 75.5, [55, 59, 62, 69], 3.8, 0.027, 0.65);
  chord(out, tables, 79.5, [57, 62, 66, 69, 76], 5.6, 0.023, 0.75);
  chord(out, tables, 86, [50, 57, 62, 66, 69], 3.3, 0.025, 0.50);

  // Drum arrangement grows, leaves a full pocket for the reveal, then settles.
  const firstBeat = Math.max(0, Math.floor((out.start - 0.4) / BEAT));
  const lastBeat = Math.ceil((out.start + out.left.length / out.sr) / BEAT);
  for (let b = firstBeat; b <= lastBeat; b++) {
    const at = b * BEAT;
    if (at >= 42.0) continue;
    const beatInBar = b % 4;
    const warm = at >= 66;
    const early = at < 7;
    if ((!early || beatInBar !== 1) && (!warm || beatInBar === 0 || beatInBar === 2)) {
      kick(out, tables, at, warm ? 0.36 : at >= 32 && at < 42 ? 0.49 : 0.43);
    }
    if (beatInBar === 1 || beatInBar === 3) {
      if (!early || beatInBar === 3) snare(out, tables, at, warm ? 0.105 : 0.17);
    }
    if (at >= 7) {
      hat(out, at, warm ? 0.021 : 0.033);
      hat(out, at + BEAT * 0.5, warm ? 0.031 : 0.044, !warm && beatInBar === 2);
      if (at >= 18 && at < 42 && (b % 2 === 0 || at >= 32)) {
        hat(out, at + BEAT * 0.25, 0.020);
        hat(out, at + BEAT * 0.75, 0.024);
      }
    }
  }
  const recoveryFirst = Math.max(0, Math.floor((out.start - 52 - 0.4) / BEAT));
  const recoveryLast = Math.ceil((out.start + out.left.length / out.sr - 52) / BEAT);
  for (let n = recoveryFirst; n <= recoveryLast; n++) {
    const at = 52 + n * BEAT;
    if (at >= 85) break;
    const beatInBar = n % 4;
    const warm = at >= 66;
    if (!warm || beatInBar === 0 || beatInBar === 2) kick(out, tables, at, warm ? 0.36 : 0.41);
    if (beatInBar === 1 || beatInBar === 3) snare(out, tables, at, warm ? 0.105 : 0.135);
    hat(out, at, warm ? 0.021 : 0.026);
    hat(out, at + BEAT * 0.5, warm ? 0.031 : 0.033);
  }

  // Syncopation gives motion without resorting to a repeating notification beep.
  const firstBar = Math.max(0, Math.floor((out.start - 3) / BAR));
  const lastBar = Math.ceil((out.start + out.left.length / out.sr) / BAR);
  for (let bar = firstBar; bar <= lastBar; bar++) {
    const barAt = bar * BAR;
    if (barAt >= 42 || barAt + BAR <= 0) continue;
    const root = roots[Math.floor(bar / 2) % 4];
    const pattern = barAt < 7 ? [0, 2.5] : barAt < 18 ? [0, 1.5, 2.5] : [0, 0.75, 1.5, 2, 2.75, 3.5];
    for (let n = 0; n < pattern.length; n++) {
      const at = barAt + pattern[n] * BEAT;
      if (at >= 42) continue;
      bassNote(out, tables, at, root + (n === pattern.length - 1 && bar % 2 === 1 ? 12 : 0),
        BEAT * (barAt < 18 ? 0.80 : 0.44), barAt >= 32 ? 0.19 : 0.165);
    }
    const phrase = [66, 71, 69, 66, 74, 73, 71, 66];
    const rhythms = [0.5, 1.25, 2, 3.25];
    if (barAt >= 3.75) {
      for (let n = 0; n < rhythms.length; n++) {
        const at = barAt + rhythms[n] * BEAT;
        if (at >= 41.8) continue;
        echoedPluck(out, tables, at, phrase[(bar % 2) * 4 + n],
          barAt >= 32 ? 0.059 : barAt >= 18 ? 0.049 : 0.039, 0.14, n % 2 ? 0.42 : -0.42);
      }
    }
  }
  // Small anticipatory fill before the cut; no abrasive alarm or siren.
  for (let n = 0; n < 6; n++) {
    const at = 40.9 + n * 0.145;
    snare(out, tables, at, 0.028 + n * 0.010);
  }
  sweep(out, tables, 17.4, 0.6, 0.085, 215);
  sweep(out, tables, 31.25, 0.70, 0.105, 273);
  sweep(out, tables, 50.8, 1.15, 0.070, 917);

  // The recovered pulse starts on the character's hand, rather than an arbitrary bar.
  for (let n = 0; n < 72; n++) {
    const at = 52 + n * BEAT;
    if (at >= 85) break;
    const root = at < 66 ? [38, 33, 35, 31][Math.floor((at - 52) / (BAR * 2)) % 4]
      : at < 71.5 ? 38 : at < 75.5 ? 33 : at < 79.5 ? 31 : 38;
    if (at < 66 || n % 2 === 0) bassNote(out, tables, at, root, BEAT * 0.58, at >= 79 ? 0.092 : 0.122, true);
  }
  // One motif, first restless and later spacious; delayed notes connect the cuts.
  const warmPhrase = [74, 69, 66, 64, 66, 69, 73, 74];
  for (let n = 0; n < 28; n++) {
    const at = 52.5 + n * BEAT * (n < 12 ? 2 : 2.5);
    if (at >= 84.5) break;
    echoedPluck(out, tables, at, warmPhrase[n % warmPhrase.length], at < 66 ? 0.047 : 0.058, 0.30, n % 2 ? 0.38 : -0.38);
  }
  [0, 0.32, 0.68, 1.20].forEach((delay, index) =>
    echoedPluck(out, tables, 86.25 + delay, [62, 66, 69, 74][index], 0.045, 0.48, index % 2 ? 0.25 : -0.25));

  for (let i = 0; i < out.left.length; i++) {
    const time = (out.sampleStart + i) / out.sr;
    let envelope = smooth(time / 0.065) * (1 - smooth((time - 88.3) / 1.7));
    if (time >= 42 && time < 43.05) envelope *= 1 - smooth((time - 42) / 0.55);
    // Gentle kick-sidechain; foreground speech retains a steady, uncluttered bed.
    if ((time < 42 || (time >= 52 && time < 85))) {
      const origin = time >= 52 ? 52 : 0;
      const age = (time - origin) % BEAT;
      envelope *= 1 - 0.19 * Math.exp(-age / 0.078);
    }
    const l = out.left[i] * envelope * 1.7;
    const r = out.right[i] * envelope * 1.7;
    out.left[i] = clamp(l * 0.96 / (1 + 0.30 * Math.abs(l)), -0.96, 0.96);
    out.right[i] = clamp(r * 0.96 / (1 + 0.30 * Math.abs(r)), -0.96, 0.96);
  }
}

function thud(out: Stereo, tables: Palette, at: number, volume: number, seed: number,
  duration = 0.24, pitch = 95): void {
  const [first, last] = bounds(out, at, duration);
  for (let i = first; i < last; i++) {
    const age = (out.sampleStart + i) / out.sr - at;
    const sample = (out.sampleStart + i + 1e-5) | 0;
    const cloth = (noise(sample, seed) + noise(sample - 1, seed)) * 0.14;
    const body = osc(tables.sine, pitch * age - 32 * age * age);
    const envelope = smooth(age / 0.003) * Math.exp(-age / (duration * 0.20))
      * (1 - smooth((age - duration + 0.02) / 0.02));
    add(out, i, (body * 0.67 + cloth) * volume * envelope);
  }
}

function chime(out: Stereo, tables: Palette, at: number, note: number, volume: number,
  duration = 1.0, pan = 0): void {
  const [first, last] = bounds(out, at, duration);
  const frequency = hz(note);
  for (let i = first; i < last; i++) {
    const age = (out.sampleStart + i) / out.sr - at;
    const envelope = smooth(age / 0.006) * Math.exp(-age / (duration * 0.24)) * (1 - smooth(age / duration));
    const tone = osc(tables.sine, frequency * age) + osc(tables.sine, frequency * 2.003 * age) * 0.18;
    add(out, i, tone * volume * envelope, pan);
  }
}

function renderFoley(out: Stereo, tables: Palette): void {
  // Sofa: cloth movement followed by a soft, weighty landing.
  sweep(out, tables, 0.40, 0.38, 0.18, 178, -1);
  thud(out, tables, 0.72, 0.35, 193, 0.35, 67);
  chime(out, tables, 1.10, 78, 0.080, 0.50, -0.15);
  chime(out, tables, 1.20, 83, 0.057, 0.50, 0.15);
  [7, 11, 15].forEach((at, index) => {
    sweep(out, tables, at - 0.16, 0.34, 0.20, 242 + index * 13, index % 2 ? -1 : 1, 0.10);
    thud(out, tables, at + 0.04, 0.12, 271 + index, 0.14, 125);
  });
  sweep(out, tables, 17.72, 0.43, 0.16, 812, -1, 0.09);
  for (let n = 0; n < 18; n++) thud(out, tables, 18.18 + n * BEAT, 0.065, 518 + n, 0.075, 170);
  sweep(out, tables, 31.78, 0.50, 0.24, 655, 1, 0.14);
  chime(out, tables, 32.15, 78, 0.075, 0.60, 0.3);
  // The revelation gets a downward air movement and a single low impact.
  sweep(out, tables, 42.68, 0.36, 0.27, 328, -1, 0.16);
  thud(out, tables, 43.02, 0.40, 998, 0.65, 54);
  chime(out, tables, 43.10, 66, 0.13, 1.7, -0.2);
  chime(out, tables, 43.18, 73, 0.072, 1.4, 0.2);
  // Hand brake and timer turn: a soft friction sweep, then three tactile clicks.
  sweep(out, tables, 51.83, 0.42, 0.19, 751, -1, 0.15);
  thud(out, tables, 52.20, 0.13, 642, 0.16, 132);
  [52.43, 52.55, 52.68].forEach((at, index) => thud(out, tables, at, 0.092 - index * 0.012, 648 + index, 0.07, 220));
  chime(out, tables, 60.03, 79, 0.13, 1.10, -0.1);
  chime(out, tables, 60.17, 86, 0.073, 0.90, 0.1);
  thud(out, tables, 64.12, 0.20, 810, 0.15, 190);
  sweep(out, tables, 63.94, 0.21, 0.055, 829, -1);
  chime(out, tables, 68.04, 86, 0.047, 0.55, 0.16);
  // A few asymmetric drops make the water moment feel physical.
  [68.23, 68.31, 68.47, 68.62, 68.85].forEach((at, index) =>
    chime(out, tables, at, [80, 77, 82, 74, 79][index], 0.030, 0.15, index % 2 ? -0.15 : 0.15));
  sweep(out, tables, 68.19, 0.78, 0.071, 146, -1);
  [72.07, 72.57, 73.12, 73.64, 74.16, 74.69].forEach((at, index) => {
    thud(out, tables, at, 0.14 - index * 0.009, 267 + index, 0.18, index % 2 ? 77 : 91);
    sweep(out, tables, at - 0.10, 0.15, 0.032, 330 + index, index % 2 ? -1 : 1);
  });
  thud(out, tables, 80.04, 0.11, 500, 0.08, 230);
  sweep(out, tables, 80.11, 0.36, 0.10, 508, -1);
  thud(out, tables, 80.41, 0.23, 513, 0.34, 71);
  sweep(out, tables, 85.82, 0.85, 0.16, 604, 1, 0.07);
  [0, 0.16, 0.35].forEach((delay, index) =>
    chime(out, tables, 86.1 + delay, [62, 66, 69][index], 0.055, 1.1, index * 0.2 - 0.2));
  for (let i = 0; i < out.left.length; i++) {
    out.left[i] = clamp(out.left[i], -0.8, 0.8);
    out.right[i] = clamp(out.right[i], -0.8, 0.8);
  }
}

export function createAudio(options: AudioRequest | any) {
  const context = options?.context as BaseAudioContext;
  const destination = options?.destination as AudioNode;
  let source: AudioBufferSourceNode | undefined;
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (source) {
      try { source.stop(); } catch { /* already ended */ }
      try { source.disconnect(); } catch { /* already disconnected */ }
    }
  };
  if (!context || !destination || !['music', 'foley'].includes(options.trackId)) return { dispose };
  const offset = clamp(Number.isFinite(options.offset) ? options.offset : 0, 0, LENGTH);
  // Normal previews request short windows; exports can request the entire score.
  const duration = clamp(Number.isFinite(options.duration) ? options.duration : 10, 0, LENGTH - offset);
  if (duration <= 0) return { dispose };
  const sr = context.sampleRate;
  const frames = Math.max(1, Math.ceil(duration * sr));
  const buffer = context.createBuffer(2, frames, sr);
  const rawStart = offset * sr;
  const sampleStart = Math.abs(rawStart - Math.round(rawStart)) < 1e-5 ? Math.round(rawStart) : rawStart;
  const out: Stereo = { left: buffer.getChannelData(0), right: buffer.getChannelData(1),
    start: sampleStart / sr, sampleStart, sr };
  const tables = palette();
  if (options.trackId === 'music') renderMusic(out, tables);
  else renderFoley(out, tables);
  source = context.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = clamp(Number.isFinite(options.rate) ? options.rate : 1, 0.1, 8);
  source.connect(destination);
  source.start(Number.isFinite(options.when) ? options.when : context.currentTime);
  return { dispose };
}
