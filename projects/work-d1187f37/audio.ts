import { createAudioRack } from "../../src/engine/audio-adapters";
import { createPcmAudio, StereoPcm } from "../../src/engine/procedural-audio";
import { seeded } from "../../src/engine/math";

/** Synthesized sound effects for 《unhappy》· 同一段聊天两个视角 (all deterministic). Each entry is one
 *  clip in audio.json (generated source, module "sfx", trackId = name); start times follow scenes/lib/timeline.ts. */
const SR = 48000;
const TAU = Math.PI * 2;

function buffer(seconds: number): StereoPcm {
  const n = Math.ceil(seconds * SR);
  return [new Float32Array(n), new Float32Array(n)];
}
function add(pcm: StereoPcm, at: number, dur: number, fn: (t: number, i: number) => number, gain = 1, pan = 0) {
  const start = Math.floor(at * SR);
  const n = Math.floor(dur * SR);
  const gl = gain * Math.min(1, 1 - pan),
    gr = gain * Math.min(1, 1 + pan);
  for (let i = 0; i < n && start + i < pcm[0].length; i++) {
    const v = fn(i / SR, i);
    pcm[0][start + i] += v * gl;
    pcm[1][start + i] += v * gr;
  }
}
const attack = (t: number, a = 0.004) => Math.min(1, t / a);
function lowpass(seed: number, k: number) {
  const r = seeded(seed);
  let a = 0,
    b = 0;
  return () => {
    const x = r() * 2 - 1;
    a += k * (x - a);
    b += k * (a - b);
    return b;
  };
}
function thud(pcm: StereoPcm, at: number, f = 70, gain = 0.6, dur = 0.35, seed = 1) {
  const nz = lowpass(seed, 0.08);
  add(pcm, at, dur, (t) => attack(t, 0.002) * (Math.sin(TAU * (f + 40 * Math.exp(-t * 30)) * t) * Math.exp(-t * 14) + nz() * 2.5 * Math.exp(-t * 30)), gain);
}
function tone(pcm: StereoPcm, at: number, f: number, dur: number, gain: number, pan = 0, decay = 6) {
  add(pcm, at, dur, (t) => attack(t, 0.003) * (Math.sin(TAU * f * t) * 0.7 + Math.sin(TAU * f * 2 * t) * 0.2) * Math.exp(-t * decay), gain, pan);
}
/** keyboard taps: n per second for `dur` seconds */
function taps(dur: number, rate: number, seed: number, pitch = 1, gain = 0.16) {
  const pcm = buffer(dur + 0.1);
  const r = seeded(seed);
  for (let t = 0; t < dur; t += 1 / rate) {
    const at = t + r() * 0.02;
    const nz = seeded(seed + Math.floor(t * 100));
    add(pcm, at, 0.04, (u) => (nz() * 2 - 1) * Math.exp(-u * 280) + Math.sin(TAU * 1700 * pitch * u) * 0.35 * Math.exp(-u * 320), gain * (0.8 + r() * 0.4));
  }
  return pcm;
}

const sounds: Record<string, () => StereoPcm> = {
  // the message-received chime (two soft notes)
  um: () => {
    const pcm = buffer(0.9);
    tone(pcm, 0, 1318, 0.6, 0.32, 0, 9);
    tone(pcm, 0.09, 1760, 0.7, 0.28, 0, 8);
    return pcm;
  },
  // her friend's notification on her phone: lighter, higher
  note: () => {
    const pcm = buffer(0.6);
    tone(pcm, 0, 2093, 0.5, 0.22, 0.2, 12);
    return pcm;
  },
  typing: () => taps(1.0, 9, 3),
  typingLong: () => taps(2.6, 9, 4),
  // backspace held: faster, lower clicks
  del: () => taps(1.0, 12, 5, 0.7, 0.14),
  send: () => {
    const pcm = buffer(0.4);
    const r = seeded(21);
    let a = 0;
    add(pcm, 0, 0.35, (t) => {
      const k = 0.04 + 0.4 * (t / 0.35);
      a += k * (r() * 2 - 1 - a);
      return a * Math.sin((Math.PI * t) / 0.35) * 2.2;
    }, 0.32);
    return pcm;
  },
  lamp: () => {
    const pcm = buffer(0.15);
    const r = seeded(31);
    add(pcm, 0, 0.06, (t) => (r() * 2 - 1) * Math.exp(-t * 400) + Math.sin(TAU * 2300 * t) * 0.4 * Math.exp(-t * 220), 0.35);
    return pcm;
  },
  // powering off: a falling blip
  powerOff: () => {
    const pcm = buffer(0.6);
    add(pcm, 0, 0.5, (t) => attack(t) * Math.sin(TAU * (900 - 700 * Math.min(1, t / 0.4)) * t) * Math.exp(-t * 7), 0.25);
    return pcm;
  },
  rustle: () => {
    const pcm = buffer(0.8);
    const nz = lowpass(41, 0.35);
    add(pcm, 0, 0.7, (t) => nz() * Math.sin((Math.PI * t) / 0.7) * (1.6 + Math.sin(t * 40) * 0.4), 0.3);
    return pcm;
  },
  // the camera swinging across the street and in through her window: noise that brightens, swells and dies
  whoosh: () => {
    const pcm = buffer(0.8);
    const r = seeded(140);
    let a = 0,
      b = 0;
    add(pcm, 0, 0.7, (t) => {
      const u = t / 0.7;
      const k = 0.015 + 0.22 * u * u;
      a += k * (r() * 2 - 1 - a);
      b += k * (a - b);
      return b * 3.4 * Math.sin(Math.PI * Math.min(1, u * 1.12)) ** 1.5;
    }, 0.3);
    return pcm;
  },
  rewind: () => {
    const pcm = buffer(0.7);
    const r = seeded(55);
    let a = 0;
    add(pcm, 0, 0.65, (t) => {
      const k = 0.02 + 0.5 * (t / 0.65) ** 2;
      a += k * (r() * 2 - 1 - a);
      return a * 2.4 * Math.min(1, t / 0.1) * Math.min(1, (0.65 - t) / 0.05) + Math.sin(TAU * (300 + 2000 * t * t) * t) * 0.08;
    }, 0.3);
    return pcm;
  },
  // her heart pounding behind the book
  heartbeat: () => {
    const pcm = buffer(1.8);
    for (let k = 0; k < 4; k++) {
      const at = k * 0.4;
      add(pcm, at, 0.16, (t) => attack(t, 0.01) * Math.sin(TAU * 58 * t) * Math.exp(-t * 18), 0.7);
      add(pcm, at + 0.14, 0.18, (t) => attack(t, 0.01) * Math.sin(TAU * 50 * t) * Math.exp(-t * 16), 0.5);
    }
    return pcm;
  },
  // school bell: 叮——叮——
  bell: () => {
    const pcm = buffer(1.6);
    tone(pcm, 0, 988, 1.0, 0.22, -0.2, 2.5);
    tone(pcm, 0.45, 784, 1.1, 0.22, 0.2, 2.5);
    return pcm;
  },
  steps: () => {
    const pcm = buffer(0.8);
    for (let k = 0; k < 5; k++) thud(pcm, k * 0.13, 180, 0.12, 0.08, 60 + k);
    return pcm;
  },
  birds: () => {
    const pcm = buffer(1.6);
    const r = seeded(80);
    for (let k = 0; k < 7; k++) {
      const at = r() * 1.3,
        f0 = 3200 + r() * 1400;
      add(pcm, at, 0.12, (t) => attack(t, 0.005) * Math.sin(TAU * (f0 + 900 * Math.sin(t * 60)) * t) * Math.exp(-t * 18), 0.08, r() * 1.4 - 0.7);
    }
    return pcm;
  },
  boot: () => {
    const pcm = buffer(0.9);
    tone(pcm, 0, 523, 0.8, 0.18, 0, 3);
    tone(pcm, 0, 784, 0.8, 0.14, 0, 3);
    return pcm;
  },
  sparkle: () => {
    const pcm = buffer(1.0);
    const r = seeded(120);
    for (let k = 0; k < 10; k++) tone(pcm, k * 0.06, 2000 + r() * 2600, 0.3, 0.05, r() * 1.4 - 0.7, 14);
    return pcm;
  },
  pop: () => {
    const pcm = buffer(0.3);
    add(pcm, 0, 0.12, (t) => Math.sin(TAU * (400 + 900 * t * 8) * t) * Math.exp(-t * 30), 0.25);
    return pcm;
  },
};

export const { generators, createAudio } = createAudioRack({ sfx: createPcmAudio(sounds, SR) });
