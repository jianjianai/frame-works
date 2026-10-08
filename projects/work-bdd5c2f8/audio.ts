import { createAudioRack } from "../../src/engine/audio-adapters";
import { createPcmAudio, StereoPcm } from "../../src/engine/procedural-audio";
import { seeded } from "../../src/engine/math";

/** Small synthesized sound effects for the story beats (all deterministic). */
const SR = 48000;
const TAU = Math.PI * 2;

function buffer(seconds: number): StereoPcm {
  const n = Math.ceil(seconds * SR);
  return [new Float32Array(n), new Float32Array(n)];
}
/** Mix a mono voice `fn(t)` into the buffer starting at `at` seconds. */
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

function ding(pcm: StereoPcm, at: number, gain = 0.5, pitch = 1, pan = 0) {
  add(
    pcm,
    at,
    0.7,
    (t) =>
      attack(t) *
      (Math.sin(TAU * 1568 * pitch * t) * 0.6 * Math.exp(-t * 7) +
        Math.sin(TAU * 2349 * pitch * t) * 0.3 * Math.exp(-t * 12) +
        Math.sin(TAU * 3136 * pitch * t) * 0.12 * Math.exp(-t * 20)),
    gain,
    pan,
  );
}
function buzz(pcm: StereoPcm, at: number, dur = 0.3, gain = 0.22) {
  add(pcm, at, dur, (t) => {
    const env = Math.min(1, t / 0.02) * Math.min(1, (dur - t) / 0.04);
    return Math.tanh(3 * Math.sin(TAU * 165 * t)) * (0.6 + 0.4 * Math.sin(TAU * 28 * t)) * env;
  }, gain);
}
function noiseVoice(seed: number) {
  const r = seeded(seed);
  let lp = 0,
    lp2 = 0;
  return { r, filt: (x: number, k: number) => ((lp += k * (x - lp)), (lp2 += k * (lp - lp2)), lp2) };
}

const sounds: Record<string, () => StereoPcm> = {
  // keyboard taps while he types "其实…今天是我生日" (9 characters)
  typing: () => {
    const pcm = buffer(1.8);
    const r = seeded(3);
    for (let k = 0; k < 9; k++) {
      const at = k * (1.55 / 9) + r() * 0.04;
      const n = seeded(10 + k);
      add(pcm, at, 0.05, (t) => (n() * 2 - 1) * Math.exp(-t * 260) + Math.sin(TAU * 1800 * t) * 0.3 * Math.exp(-t * 300), 0.18);
    }
    return pcm;
  },
  // message send swoosh
  send: () => {
    const pcm = buffer(0.4);
    const { r, filt } = noiseVoice(21);
    add(pcm, 0, 0.35, (t) => {
      const k = 0.04 + 0.4 * (t / 0.35);
      return filt(r() * 2 - 1, k) * Math.sin((Math.PI * t) / 0.35) * 2.2;
    }, 0.35);
    return pcm;
  },
  // soft "failed" bonk
  fail: () => {
    const pcm = buffer(0.5);
    add(pcm, 0, 0.45, (t) => {
      const f = 330 - 150 * Math.min(1, t / 0.25);
      return attack(t) * Math.exp(-t * 8) * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2 * f * t));
    }, 0.42);
    return pcm;
  },
  // match strike + flame catching
  match: () => {
    const pcm = buffer(0.8);
    const { r, filt } = noiseVoice(31);
    add(pcm, 0, 0.18, (t) => (r() > 0.9 ? r() * 2 - 1 : 0) * Math.exp(-t * 10), 0.5);
    add(pcm, 0.12, 0.6, (t) => filt(r() * 2 - 1, 0.08) * Math.min(1, t / 0.05) * Math.exp(-t * 5) * 4, 0.35);
    return pcm;
  },
  // blowing out the candle
  blow: () => {
    const pcm = buffer(0.9);
    const { r, filt } = noiseVoice(41);
    add(pcm, 0, 0.8, (t) => filt(r() * 2 - 1, 0.12) * Math.min(1, t / 0.08) * Math.exp(-Math.max(0, t - 0.15) * 5) * 4, 0.45);
    return pcm;
  },
  // airplane-mode toggle tap
  click: () => {
    const pcm = buffer(0.15);
    const r = seeded(51);
    add(pcm, 0, 0.08, (t) => (r() * 2 - 1) * Math.exp(-t * 500) + Math.sin(TAU * 2600 * t) * 0.5 * Math.exp(-t * 200), 0.4);
    return pcm;
  },
  // the notification flood: seven dings + vibration (matches act5 NOTE_AT)
  flood: () => {
    const pcm = buffer(2.6);
    const pitches = [1, 1.122, 1, 0.891, 1.189, 1, 1.26];
    for (let i = 0; i < 7; i++) {
      ding(pcm, i * 0.2, 0.42, pitches[i], (i % 2 ? 0.3 : -0.3));
      buzz(pcm, i * 0.2, 0.17, 0.16);
    }
    buzz(pcm, 1.4, 0.5, 0.18);
    return pcm;
  },
  // cake in the face
  splat: () => {
    const pcm = buffer(0.5);
    const { r, filt } = noiseVoice(61);
    add(pcm, 0, 0.3, (t) => Math.sin(TAU * (110 - 60 * t) * t) * Math.exp(-t * 18), 0.6);
    add(pcm, 0, 0.35, (t) => filt(r() * 2 - 1, 0.2) * Math.exp(-t * 12) * 3, 0.4);
    return pcm;
  },
  // party popper + confetti sparkle
  pop: () => {
    const pcm = buffer(1.4);
    const { r } = noiseVoice(71);
    add(pcm, 0, 0.25, (t) => (r() * 2 - 1) * Math.exp(-t * 45) + Math.sin(TAU * 140 * t) * Math.exp(-t * 25), 0.55);
    const s = seeded(72);
    for (let k = 0; k < 22; k++) {
      const at = 0.08 + s() * 1.1;
      const f = 3000 + s() * 3000;
      add(pcm, at, 0.08, (t) => Math.sin(TAU * f * t) * Math.exp(-t * 60), 0.07, s() * 2 - 1);
    }
    return pcm;
  },
  // softer single ding for the replies in the outro
  reply: () => {
    const pcm = buffer(0.8);
    ding(pcm, 0, 0.3, 1.189);
    return pcm;
  },
  // 上课铃 in the corridor memory (act1 11.69): an electric school bell, the clapper hammering ~22 times a second on a
  // bell with a few inharmonic partials, then ringing out
  bell: () => {
    const dur = 0.85;
    const pcm = buffer(dur + 0.4);
    const partials: [number, number][] = [[1240, 0.5], [2980, 0.28], [4310, 0.12], [620, 0.18]];
    const r = seeded(81);
    add(pcm, 0, dur + 0.35, (t) => {
      const env = attack(t, 0.01) * (t < dur ? 1 : Math.exp(-(t - dur) * 9));
      const hit = (t * 22) % 1;
      const strikes = t < dur ? Math.exp(-hit * 4) : 0;
      const ring = partials.reduce((s, [f, a]) => s + a * Math.sin(TAU * f * t), 0);
      const click = t < dur ? (r() * 2 - 1) * Math.exp(-hit * 40) * 0.25 : 0;
      return env * (ring * (0.35 + 0.65 * strikes) + click);
    }, 0.32);
    return pcm;
  },
  // a light tap on the glass: the double tap of the like prompt at the end
  tap: () => {
    const pcm = buffer(0.2);
    add(pcm, 0, 0.12, (t) => attack(t, 0.002) * Math.sin(TAU * (400 + 900 * t * 8) * t) * Math.exp(-t * 30), 0.25);
    return pcm;
  },
};

export const { generators, createAudio } = createAudioRack({ sfx: createPcmAudio(sounds, SR) });
