import { createAudioRack } from "../../src/engine/audio-adapters";
import { createPcmAudio, StereoPcm } from "../../src/engine/procedural-audio";
import { seeded } from "../../src/engine/math";

/** 《瑕疵：0》 sound effects, all synthesised and deterministic (recipes adapted from the s0rrow library's
 *  sfx-audio.ts). Each is a generated source in audio.json (module "sfx", trackId = the name below) on the 音效 track;
 *  clip starts follow the story events in scenes/lib/timeline.ts (EV). */
const SR = 48000;
const TAU = Math.PI * 2;

function buffer(seconds: number): StereoPcm {
  const n = Math.ceil(seconds * SR);
  return [new Float32Array(n), new Float32Array(n)];
}
/** mix a mono voice fn(t) into the buffer from `at` seconds */
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
/** two-pole low-passed noise (k: 0..1, higher = brighter) */
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
function tink(pcm: StereoPcm, at: number, f: number, gain = 0.2, pan = 0) {
  add(pcm, at, 0.4, (t) => attack(t, 0.001) * (Math.sin(TAU * f * t) * 0.6 + Math.sin(TAU * f * 2.76 * t) * 0.3 + Math.sin(TAU * f * 5.4 * t) * 0.12) * Math.exp(-t * 14), gain, pan);
}
function ding(pcm: StereoPcm, at: number, gain = 0.4, pitch = 1, pan = 0) {
  add(pcm, at, 0.9, (t) => attack(t) * (Math.sin(TAU * 1046 * pitch * t) * 0.6 * Math.exp(-t * 5) + Math.sin(TAU * 2093 * pitch * t) * 0.25 * Math.exp(-t * 9)), gain, pan);
}
function tone(pcm: StereoPcm, at: number, f: number, dur: number, gain: number, pan = 0, decay = 6) {
  add(pcm, at, dur, (t) => attack(t, 0.003) * (Math.sin(TAU * f * t) * 0.7 + Math.sin(TAU * f * 2 * t) * 0.2) * Math.exp(-t * decay), gain, pan);
}
/** the phone vibrating against a hand */
function buzz(pcm: StereoPcm, at: number, dur = 0.3, gain = 0.22) {
  add(pcm, at, dur, (t) => {
    const env = Math.min(1, t / 0.02) * Math.min(1, (dur - t) / 0.04);
    return Math.tanh(3 * Math.sin(TAU * 165 * t)) * (0.6 + 0.4 * Math.sin(TAU * 28 * t)) * env;
  }, gain);
}
/** a soft swish of air (a page, a pair of sunglasses coming off) */
function swish(pcm: StereoPcm, at: number, dur: number, seed: number, gain: number, bright = 0.3) {
  const r = seeded(seed);
  let a = 0,
    b = 0;
  add(pcm, at, dur, (t) => {
    const u = t / dur;
    const k = 0.02 + bright * u;
    a += k * (r() * 2 - 1 - a);
    b += k * (a - b);
    return b * 3 * Math.sin(Math.PI * u);
  }, gain);
}

const sounds: Record<string, () => StereoPcm> = {
  // act 1 — the last sheet slides across the mirror and is slapped flat (slap 0.89 s in)
  paperSlap: () => {
    const pcm = buffer(1.25);
    const nz = lowpass(11, 0.5);
    add(pcm, 0, 0.86, (t) => nz() * (0.3 + 0.7 * (t / 0.86)) * (1 + 0.5 * Math.sin(t * 90)) * 1.4, 0.16);
    const nz2 = lowpass(12, 0.7);
    add(pcm, 0.89, 0.14, (t) => nz2() * Math.exp(-t * 38) * 3, 0.5);
    thud(pcm, 0.89, 120, 0.32, 0.22, 13);
    return pcm;
  },
  // masking tape torn off the roll and pressed down
  tape: () => {
    const pcm = buffer(0.25);
    const nz = lowpass(21, 0.8);
    add(pcm, 0, 0.14, (t) => nz() * (0.6 + 0.4 * Math.sign(Math.sin(t * 900))) * Math.sin((Math.PI * t) / 0.14) * 2, 0.26);
    return pcm;
  },
  // a felt pen scratching (rings, strike-outs, her writing)
  scribble: () => {
    const pcm = buffer(0.55);
    for (let k = 0; k < 4; k++) {
      const nz = lowpass(30 + k, 0.6);
      add(pcm, k * 0.1, 0.1, (t) => nz() * Math.sin((Math.PI * t) / 0.1) * 1.6, 0.18);
    }
    return pcm;
  },
  // a message arriving (two soft notes)
  um: () => {
    const pcm = buffer(0.9);
    tone(pcm, 0, 1318, 0.6, 0.3, 0, 9);
    tone(pcm, 0.09, 1760, 0.7, 0.26, 0, 8);
    return pcm;
  },
  // her sticker popping in
  pop: () => {
    const pcm = buffer(0.3);
    add(pcm, 0, 0.12, (t) => Math.sin(TAU * (400 + 900 * t * 8) * t) * Math.exp(-t * 30), 0.24);
    return pcm;
  },
  // the video call ringing: a marimba figure, the phone buzzing on every beat (2.03 s = 4 beats)
  ring: () => {
    const pcm = buffer(2.1);
    const notes = [1047, 1319, 1568, 1319];
    for (let k = 0; k < 8; k++) tone(pcm, k * 0.254, notes[k % 4], 0.3, 0.15, 0, 14);
    for (let k = 0; k < 4; k++) buzz(pcm, k * 0.508, 0.22, 0.15);
    return pcm;
  },
  // hanging up: du-du
  hangup: () => {
    const pcm = buffer(0.3);
    tone(pcm, 0, 520, 0.09, 0.22, 0, 20);
    tone(pcm, 0.1, 440, 0.12, 0.22, 0, 16);
    return pcm;
  },
  // dragging the 祛斑 slider all the way
  slider: () => {
    const pcm = buffer(0.5);
    swish(pcm, 0, 0.42, 41, 0.2, 0.5);
    let ph = 0;
    add(pcm, 0, 0.42, (t) => {
      ph += (TAU * (600 + 1600 * (t / 0.42))) / SR;
      return Math.sin(ph) * Math.sin((Math.PI * t) / 0.42);
    }, 0.05);
    return pcm;
  },
  // 瑕疵：0 — a bright ding and a sprinkle
  zero: () => {
    const pcm = buffer(1.1);
    ding(pcm, 0, 0.3, 1.0);
    ding(pcm, 0.08, 0.24, 1.5);
    const r = seeded(51);
    for (let k = 0; k < 8; k++) tone(pcm, 0.05 + k * 0.05, 2400 + r() * 2400, 0.25, 0.05, r() * 1.4 - 0.7, 16);
    return pcm;
  },
  // the photo sent
  send: () => {
    const pcm = buffer(0.4);
    const r = seeded(61);
    let a = 0;
    add(pcm, 0, 0.35, (t) => {
      const k = 0.04 + 0.4 * (t / 0.35);
      a += k * (r() * 2 - 1 - a);
      return a * Math.sin((Math.PI * t) / 0.35) * 2.2;
    }, 0.3);
    return pcm;
  },
  // act 2 — into the couch under the blanket
  dive: () => {
    const pcm = buffer(0.8);
    thud(pcm, 0, 80, 0.4, 0.3, 71);
    const nz = lowpass(72, 0.35);
    add(pcm, 0.02, 0.6, (t) => nz() * Math.sin((Math.PI * t) / 0.6) * 1.6, 0.22);
    return pcm;
  },
  // the night going by: the clock ticking fast
  ticks: () => {
    const pcm = buffer(0.55);
    for (let k = 0; k < 10; k++) add(pcm, k * 0.05, 0.02, (t) => Math.sin(TAU * 3200 * t) * Math.exp(-t * 400), 0.12, (k % 2) * 0.3 - 0.15);
    return pcm;
  },
  // the alarm clock's bells
  alarm: () => {
    const pcm = buffer(0.8);
    for (let k = 0; k < 15; k++) add(pcm, k * 0.045, 0.06, (t) => attack(t, 0.001) * (Math.sin(TAU * 2350 * t) * 0.6 + Math.sin(TAU * 3720 * t) * 0.3) * Math.exp(-t * 30), 0.16, (k % 2) * 0.3 - 0.15);
    return pcm;
  },
  // the newspaper peeled off the glass
  peel: () => {
    const pcm = buffer(0.25);
    const r = seeded(81);
    const nz = lowpass(82, 0.7);
    add(pcm, 0, 0.18, (t) => nz() * (r() > 0.55 ? 1.2 : 0.5) * Math.sin((Math.PI * t) / 0.18) * 2, 0.24);
    return pcm;
  },
  // act 3 — the metal door onto the roof
  door: () => {
    const pcm = buffer(0.7);
    thud(pcm, 0, 90, 0.32, 0.35, 91);
    tone(pcm, 0.01, 330, 0.5, 0.06, 0, 7);
    tone(pcm, 0.01, 497, 0.4, 0.04, 0, 9);
    return pcm;
  },
  // the sunglasses sliding down his nose
  slip: () => {
    const pcm = buffer(0.4);
    let ph = 0;
    add(pcm, 0, 0.3, (t) => {
      ph += (TAU * (1400 - 1000 * (t / 0.3))) / SR;
      return Math.sin(ph) * Math.sin((Math.PI * t) / 0.3);
    }, 0.12);
    return pcm;
  },
  run: () => {
    const pcm = buffer(1.9);
    for (let k = 0; k < 11; k++) thud(pcm, k * 0.165, 130, 0.2, 0.1, 100 + k);
    return pcm;
  },
  // 「黑猫！」 — he stops dead
  freeze: () => {
    const pcm = buffer(0.6);
    const nz = lowpass(111, 0.5);
    add(pcm, 0, 0.16, (t) => nz() * Math.sin((Math.PI * t) / 0.16) * 2.4, 0.28);
    thud(pcm, 0.02, 90, 0.4, 0.3, 112);
    tink(pcm, 0.02, 1760, 0.1);
    return pcm;
  },
  // act 4 — a page turning over
  flip: () => {
    const pcm = buffer(0.2);
    swish(pcm, 0, 0.14, 121, 0.22, 0.6);
    return pcm;
  },
  // off come the sunglasses / the mask / the cap
  // act 1 — a bedsheet thrown over the tall mirror: it flaps open in the air, then settles (fwump 0.5 s in)
  sheet: () => {
    const pcm = buffer(0.9);
    const nz = lowpass(161, 0.25);
    add(pcm, 0, 0.5, (t) => nz() * Math.sin((Math.PI * t) / 0.5) * (0.7 + 0.3 * Math.sin(TAU * 13 * t)) * 2.2, 0.3);
    swish(pcm, 0.02, 0.36, 162, 0.22, 0.45);
    const nz2 = lowpass(163, 0.12);
    add(pcm, 0.5, 0.3, (t) => nz2() * Math.exp(-t * 12) * 3, 0.32);
    thud(pcm, 0.5, 70, 0.12, 0.2, 164);
    return pcm;
  },
  whoosh: () => {
    const pcm = buffer(0.35);
    swish(pcm, 0, 0.28, 131, 0.2, 0.35);
    return pcm;
  },
  // her lock screen
  chime: () => {
    const pcm = buffer(1.2);
    ding(pcm, 0, 0.26, 1);
    ding(pcm, 0.14, 0.26, 1.335);
    return pcm;
  },
  // warm sparkle (he laughs; 「这下一样了」)
  sparkle: () => {
    const pcm = buffer(1.0);
    const r = seeded(141);
    for (let k = 0; k < 10; k++) tone(pcm, k * 0.06, 2000 + r() * 2600, 0.3, 0.05, r() * 1.4 - 0.7, 14);
    return pcm;
  },
  // act 5 — all the paper torn off the mirror
  rip: () => {
    const pcm = buffer(0.7);
    const r = seeded(151);
    const nz = lowpass(152, 0.75);
    add(pcm, 0, 0.55, (t) => nz() * (r() > 0.6 ? 1 : 0.4) * Math.exp(-t * 4) * 2.4, 0.38);
    thud(pcm, 0, 100, 0.22, 0.2, 153);
    return pcm;
  },
  // the double tap at the end: two taps and a little pop
  doubleTap: () => {
    const pcm = buffer(0.7);
    for (const at of [0, 0.14]) add(pcm, at, 0.1, (t) => Math.sin(TAU * 1800 * t) * Math.exp(-t * 90), 0.22);
    add(pcm, 0.16, 0.18, (t) => Math.sin(TAU * (500 + 1200 * t * 5) * t) * Math.exp(-t * 18), 0.22);
    return pcm;
  },
};

export const { generators, createAudio } = createAudioRack({ sfx: createPcmAudio(sounds, SR) });
