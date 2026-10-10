/**
 * s0rrow 几支片子的合成音效库（全部代码合成、固定种子、确定性）：每个音效有中文名、时长和重音时刻 hit。
 * 作品直接用：resources_search 的 kind: "sound" 找，audio_place 的 sound: "s0rrow/code/sfx.ts#<名称>" 放到音轨（或从「素材 → 资源」拖），
 * audio.json 里是生成音源 { module: "materials/s0rrow/code/sfx.ts", trackId: "<名称>" }，不用拷进作品的 audio.ts。
 * 混音：音效轨增益 1.3–1.4、送混响 bus（1.4 s，0.2），音乐不要对音效做 duck（用户要求：音效响时不压低音乐）。
 */
import { defineSounds } from "@frame/engine/resources";
import { seeded } from "@frame/engine/math";
import type { StereoPcm } from "@frame/engine/procedural-audio";

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
/** one-pole low-pass state for filtered noise */
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


/** brighter notification bell (first video) */
function bell(pcm: StereoPcm, at: number, gain = 0.5, pitch = 1, pan = 0) {
  add(pcm, at, 0.7, (t) => attack(t) * (Math.sin(TAU * 1568 * pitch * t) * 0.6 * Math.exp(-t * 7) + Math.sin(TAU * 2349 * pitch * t) * 0.3 * Math.exp(-t * 12) + Math.sin(TAU * 3136 * pitch * t) * 0.12 * Math.exp(-t * 20)), gain, pan);
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

function tone(pcm: StereoPcm, at: number, f: number, dur: number, gain: number, pan = 0, decay = 6) {
  add(pcm, at, dur, (t) => attack(t, 0.003) * (Math.sin(TAU * f * t) * 0.7 + Math.sin(TAU * f * 2 * t) * 0.2) * Math.exp(-t * decay), gain, pan);
}
/** a soft swish of air (a page, a pair of sunglasses coming off, a whip-pan): filtered noise that brightens */
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

/** The generators, by name. */
const make: Record<string, () => StereoPcm> = {
  // ---------------- first video 《i have no friends》
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
  send: () => {
    const pcm = buffer(0.4);
    const { r, filt } = noiseVoice(21);
    add(pcm, 0, 0.35, (t) => filt(r() * 2 - 1, 0.04 + 0.4 * (t / 0.35)) * Math.sin((Math.PI * t) / 0.35) * 2.2, 0.35);
    return pcm;
  },
  fail: () => {
    const pcm = buffer(0.5);
    add(pcm, 0, 0.45, (t) => {
      const f = 330 - 150 * Math.min(1, t / 0.25);
      return attack(t) * Math.exp(-t * 8) * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2 * f * t));
    }, 0.42);
    return pcm;
  },
  match: () => {
    const pcm = buffer(0.8);
    const { r, filt } = noiseVoice(31);
    add(pcm, 0, 0.18, (t) => (r() > 0.9 ? r() * 2 - 1 : 0) * Math.exp(-t * 10), 0.5);
    add(pcm, 0.12, 0.6, (t) => filt(r() * 2 - 1, 0.08) * Math.min(1, t / 0.05) * Math.exp(-t * 5) * 4, 0.35);
    return pcm;
  },
  blow: () => {
    const pcm = buffer(0.9);
    const { r, filt } = noiseVoice(41);
    add(pcm, 0, 0.8, (t) => filt(r() * 2 - 1, 0.12) * Math.min(1, t / 0.08) * Math.exp(-Math.max(0, t - 0.15) * 5) * 4, 0.45);
    return pcm;
  },
  flood: () => {
    const pcm = buffer(2.6);
    const pitches = [1, 1.122, 1, 0.891, 1.189, 1, 1.26];
    for (let i = 0; i < 7; i++) {
      bell(pcm, i * 0.2, 0.42, pitches[i], i % 2 ? 0.3 : -0.3);
      buzz(pcm, i * 0.2, 0.17, 0.16);
    }
    buzz(pcm, 1.4, 0.5, 0.18);
    return pcm;
  },
  splat: () => {
    const pcm = buffer(0.5);
    const { r, filt } = noiseVoice(61);
    add(pcm, 0, 0.3, (t) => Math.sin(TAU * (110 - 60 * t) * t) * Math.exp(-t * 18), 0.6);
    add(pcm, 0, 0.35, (t) => filt(r() * 2 - 1, 0.2) * Math.exp(-t * 12) * 3, 0.4);
    return pcm;
  },
  pop: () => {
    const pcm = buffer(1.4);
    const { r } = noiseVoice(71);
    add(pcm, 0, 0.25, (t) => (r() * 2 - 1) * Math.exp(-t * 45) + Math.sin(TAU * 140 * t) * Math.exp(-t * 25), 0.55);
    const s2 = seeded(72);
    for (let k = 0; k < 22; k++) {
      const at = 0.08 + s2() * 1.1;
      const f = 3000 + s2() * 3000;
      add(pcm, at, 0.08, (t) => Math.sin(TAU * f * t) * Math.exp(-t * 60), 0.07, s2() * 2 - 1);
    }
    return pcm;
  },
  reply: () => {
    const pcm = buffer(0.8);
    bell(pcm, 0, 0.3, 1.189);
    return pcm;
  },
  // ---------------- second video 《unhappy》
  // keys jingling outside the door
  keys: () => {
    const pcm = buffer(0.7);
    const r = seeded(11);
    for (let k = 0; k < 9; k++) tink(pcm, k * 0.05 + r() * 0.03, 2400 + r() * 2200, 0.12, r() * 0.6 - 0.3);
    return pcm;
  },
  // latch click + a short creak as the door swings
  doorOpen: () => {
    const pcm = buffer(0.8);
    const r = seeded(12);
    add(pcm, 0, 0.05, (t) => (r() * 2 - 1) * Math.exp(-t * 200), 0.5);
    add(pcm, 0.08, 0.6, (t) => {
      const f = 300 + 120 * Math.sin(t * 9) + 200 * t;
      return Math.sin(TAU * f * t + Math.sin(TAU * 31 * t) * 2) * Math.sin((Math.PI * t) / 0.6) * 0.5;
    }, 0.12);
    return pcm;
  },
  doorClose: () => {
    const pcm = buffer(0.5);
    thud(pcm, 0, 80, 0.45, 0.4, 13);
    const r = seeded(14);
    add(pcm, 0.05, 0.04, (t) => (r() * 2 - 1) * Math.exp(-t * 250), 0.35);
    return pcm;
  },
  // his room door, further away
  roomDoor: () => {
    const pcm = buffer(0.5);
    thud(pcm, 0, 65, 0.32, 0.4, 15);
    return pcm;
  },
  // the ball rolled onto the bed, and back
  ball: () => {
    const pcm = buffer(1.4);
    thud(pcm, 0, 160, 0.18, 0.15, 16);
    thud(pcm, 0.85, 150, 0.15, 0.15, 17);
    return pcm;
  },
  // the morning door slam
  slam: () => {
    const pcm = buffer(0.7);
    thud(pcm, 0, 58, 0.85, 0.6, 18);
    const r = seeded(19);
    add(pcm, 0.01, 0.06, (t) => (r() * 2 - 1) * Math.exp(-t * 120), 0.5);
    return pcm;
  },
  // a small dry cough (two huffs)
  cough: () => {
    const pcm = buffer(0.6);
    for (const at of [0, 0.22]) {
      const nz = lowpass(20 + at * 10, 0.25);
      add(pcm, at, 0.16, (t) => attack(t, 0.006) * Math.exp(-t * 22) * (nz() * 3 + Math.sin(TAU * 220 * t) * 0.3), 0.35);
    }
    return pcm;
  },
  // squeaky bunny toy
  squeak: () => {
    const pcm = buffer(0.35);
    add(pcm, 0, 0.3, (t) => {
      const f = 1300 + 900 * Math.sin(Math.PI * Math.min(1, t / 0.28));
      return attack(t, 0.01) * Math.sin(TAU * f * t) * Math.sin((Math.PI * t) / 0.3) * (0.7 + 0.3 * Math.sin(TAU * 40 * t));
    }, 0.18);
    return pcm;
  },
  // rain: steady hiss + scattered drops (15s)
  rain: () => {
    const dur = 15;
    const pcm = buffer(dur);
    const nzL = lowpass(31, 0.35),
      nzR = lowpass(32, 0.35);
    const n = Math.floor(dur * SR);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const env = Math.min(1, t / 0.8) * Math.min(1, (dur - t) / 0.8);
      pcm[0][i] += nzL() * 0.55 * env;
      pcm[1][i] += nzR() * 0.55 * env;
    }
    const r = seeded(33);
    for (let k = 0; k < 600; k++) {
      const at = r() * (dur - 0.1);
      const f = 1800 + r() * 3500;
      add(pcm, at, 0.03, (t) => Math.sin(TAU * f * t) * Math.exp(-t * 200), 0.05 + r() * 0.05, r() * 1.6 - 0.8);
    }
    return pcm;
  },
  // its heart, slowing
  heartbeat: () => {
    const pcm = buffer(2.4);
    const beats = [0, 0.5, 1.1, 1.8];
    beats.forEach((at, i) => {
      const g = 0.75 - i * 0.12;
      add(pcm, at, 0.18, (t) => attack(t, 0.01) * Math.sin(TAU * 52 * t) * Math.exp(-t * 18), g);
      add(pcm, at + 0.17, 0.2, (t) => attack(t, 0.01) * Math.sin(TAU * 46 * t) * Math.exp(-t * 16), g * 0.7);
    });
    return pcm;
  },
  // flashlight switch
  click: () => {
    const pcm = buffer(0.15);
    const r = seeded(41);
    add(pcm, 0, 0.06, (t) => (r() * 2 - 1) * Math.exp(-t * 400) + Math.sin(TAU * 2400 * t) * 0.4 * Math.exp(-t * 220), 0.35);
    return pcm;
  },
  // running footsteps through puddles
  splash: () => {
    const pcm = buffer(0.9);
    for (let k = 0; k < 4; k++) {
      const nz = lowpass(42 + k, 0.5);
      add(pcm, k * 0.18, 0.16, (t) => attack(t, 0.004) * nz() * 3 * Math.exp(-t * 26), 0.35, k % 2 ? 0.3 : -0.3);
      thud(pcm, k * 0.18, 90, 0.15, 0.1, 50 + k);
    }
    return pcm;
  },
  // automatic doors sliding open
  whoosh: () => {
    const pcm = buffer(0.6);
    const r = seeded(51);
    let a = 0;
    add(pcm, 0, 0.55, (t) => {
      const k = 0.03 + 0.25 * (t / 0.55);
      a += k * (r() * 2 - 1 - a);
      return a * 3 * Math.sin((Math.PI * t) / 0.55);
    }, 0.3);
    return pcm;
  },
  // light box switching on
  xray: () => {
    const pcm = buffer(0.9);
    const r = seeded(52);
    add(pcm, 0, 0.05, (t) => (r() * 2 - 1) * Math.exp(-t * 300), 0.4);
    add(pcm, 0.02, 0.8, (t) => Math.sin(TAU * 100 * t) * 0.3 * Math.min(1, t / 0.05) * Math.exp(-t * 3), 0.25);
    return pcm;
  },
  // cash slammed on the counter, coins scattering
  cash: () => {
    const pcm = buffer(1.4);
    thud(pcm, 0, 75, 0.8, 0.45, 53);
    const r = seeded(54);
    for (let k = 0; k < 18; k++) tink(pcm, 0.02 + r() * 0.9 * r(), 2600 + r() * 2600, 0.11, r() * 1.4 - 0.7);
    return pcm;
  },
  // tape-rewind sweep into his point of view
  rewind: () => {
    const pcm = buffer(0.7);
    const r = seeded(55);
    let a = 0;
    add(pcm, 0, 0.65, (t) => {
      const k = 0.02 + 0.5 * (t / 0.65) ** 2;
      a += k * (r() * 2 - 1 - a);
      return a * 2.4 * Math.min(1, t / 0.1) * Math.min(1, (0.65 - t) / 0.05) + Math.sin(TAU * (300 + 2000 * t * t) * t) * 0.08;
    }, 0.35);
    return pcm;
  },
  // red pen scratching the hook's claim out
  pen: () => {
    const pcm = buffer(1.4);
    for (let k = 0; k < 7; k++) {
      const nz = lowpass(60 + k, 0.6);
      const at = k < 2 ? k * 0.15 : 0.4 + (k - 2) * 0.17;
      add(pcm, at, 0.12, (t) => nz() * Math.sin((Math.PI * t) / 0.12) * 1.6, 0.2);
    }
    return pcm;
  },
  // phone: swipe, tap, and the "enough" chime
  swipe: () => {
    const pcm = buffer(0.3);
    const nz = lowpass(70, 0.3);
    add(pcm, 0, 0.22, (t) => nz() * Math.sin((Math.PI * t) / 0.22) * 2, 0.22);
    return pcm;
  },
  tap: () => {
    const pcm = buffer(0.2);
    add(pcm, 0, 0.12, (t) => Math.sin(TAU * 1800 * t) * Math.exp(-t * 90), 0.3);
    return pcm;
  },
  chime: () => {
    const pcm = buffer(1.2);
    ding(pcm, 0, 0.35, 1);
    ding(pcm, 0.14, 0.35, 1.335);
    return pcm;
  },
  // "手术中" light goes out
  lightOff: () => {
    const pcm = buffer(0.3);
    const r = seeded(80);
    add(pcm, 0, 0.05, (t) => (r() * 2 - 1) * Math.exp(-t * 300), 0.35);
    return pcm;
  },
  // calendar pages flicking through 14 days
  flips: () => {
    const pcm = buffer(2.0);
    for (let k = 0; k < 14; k++) {
      const nz = lowpass(90 + k, 0.55);
      add(pcm, k * 0.128, 0.07, (t) => nz() * 2 * Math.exp(-t * 50), 0.18, (k % 2) * 0.4 - 0.2);
    }
    return pcm;
  },
  // its tail thumping the blanket
  thumps: () => {
    const pcm = buffer(1.2);
    for (let k = 0; k < 4; k++) thud(pcm, k * 0.22, 110, 0.22 - k * 0.02, 0.18, 100 + k);
    return pcm;
  },
  // ---------------- 《unhappy》second story (同一段聊天两个视角)
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
  typing2: () => taps(1.0, 9, 3),
  typingLong: () => taps(2.6, 9, 4),
  // backspace held: faster, lower clicks
  del: () => taps(1.0, 12, 5, 0.7, 0.14),
  send2: () => {
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
  whoosh2: () => {
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
  rewind2: () => {
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
  heartFast: () => {
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
  shutter: () => {
    const pcm = buffer(0.3);
    const r = seeded(70);
    add(pcm, 0, 0.05, (t) => (r() * 2 - 1) * Math.exp(-t * 200), 0.4);
    add(pcm, 0.07, 0.06, (t) => (r() * 2 - 1) * Math.exp(-t * 160), 0.32);
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
  run: () => {
    const pcm = buffer(2.1);
    for (let k = 0; k < 12; k++) thud(pcm, k * 0.17, 120, 0.22, 0.1, 90 + k);
    return pcm;
  },
  // convenience-store door chime + the payment beep
  store: () => {
    const pcm = buffer(1.2);
    tone(pcm, 0, 1175, 0.6, 0.18, 0, 4);
    tone(pcm, 0.22, 880, 0.7, 0.18, 0, 4);
    return pcm;
  },
  pay: () => {
    const pcm = buffer(0.3);
    tone(pcm, 0, 2637, 0.12, 0.2, 0, 20);
    return pcm;
  },
  door: () => {
    const pcm = buffer(0.5);
    thud(pcm, 0, 90, 0.4, 0.35, 101);
    return pcm;
  },
  // the milk set down on the desk + a little sparkle
  milk: () => {
    const pcm = buffer(1.0);
    thud(pcm, 0, 140, 0.3, 0.2, 111);
    const r = seeded(112);
    for (let k = 0; k < 8; k++) tone(pcm, 0.05 + k * 0.05, 2600 + r() * 2000, 0.25, 0.05, r() * 1.4 - 0.7, 18);
    return pcm;
  },
  sparkle: () => {
    const pcm = buffer(1.0);
    const r = seeded(120);
    for (let k = 0; k < 10; k++) tone(pcm, k * 0.06, 2000 + r() * 2600, 0.3, 0.05, r() * 1.4 - 0.7, 14);
    return pcm;
  },
  stickerPop: () => {
    const pcm = buffer(0.3);
    add(pcm, 0, 0.12, (t) => Math.sin(TAU * (400 + 900 * t * 8) * t) * Math.exp(-t * 30), 0.25);
    return pcm;
  },
  // ---------------- 《i have no friends》重置版
  // 上课铃: an electric school bell, the clapper hammering ~22 times a second on a bell with a few inharmonic
  // partials, then ringing out
  bellElectric: () => {
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
  // a party horn blown alone: a buzzy paper reed with a flutter, cut short, then a weak little deflating bleat as it
  // sags back (phase integrated, so the pitch bends cleanly). (The music is never ducked under sound effects.)
  horn: () => {
    const pcm = buffer(1.1);
    let ph = 0;
    add(pcm, 0, 0.44, (t) => {
      const env = Math.min(1, t / 0.025) * (t < 0.3 ? 1 : Math.max(0, 1 - (t - 0.3) / 0.14));
      const f = 400 + 16 * Math.sin(TAU * 8 * t) - 40 * Math.max(0, t - 0.24);
      ph += (TAU * f) / SR;
      const reed = Math.tanh(2.4 * Math.sin(ph)) + 0.3 * Math.sin(2 * ph) + 0.18 * Math.sin(3 * ph);
      return env * reed * (0.82 + 0.18 * Math.sin(TAU * 33 * t));
    }, 0.14);
    let ph2 = 0;
    add(pcm, 0.5, 0.55, (t) => {
      const env = Math.min(1, t / 0.05) * Math.exp(-t * 4.5);
      ph2 += (TAU * (310 - 150 * t)) / SR;
      return env * Math.tanh(1.8 * Math.sin(ph2)) * (0.8 + 0.2 * Math.sin(TAU * 21 * t));
    }, 0.07);
    return pcm;
  },
  // the notification flood, faster: seven bells + vibration every 0.12 s (match the notifications on screen)
  floodFast: () => {
    const pcm = buffer(2.6);
    const pitches = [1, 1.122, 1, 0.891, 1.189, 1, 1.26];
    for (let i = 0; i < 7; i++) {
      bell(pcm, i * 0.12, 0.42, pitches[i], i % 2 ? 0.3 : -0.3);
      buzz(pcm, i * 0.12, 0.1, 0.16);
    }
    buzz(pcm, 0.84, 0.4, 0.18);
    return pcm;
  },
  // ---------------- 《mirrors》（瑕疵：0）
  // a sheet of newspaper slid across the mirror and slapped flat (the slap 0.89 s in — start the clip 0.89 s early)
  paperSlap: () => {
    const pcm = buffer(1.25);
    const nz = lowpass(211, 0.5);
    add(pcm, 0, 0.86, (t) => nz() * (0.3 + 0.7 * (t / 0.86)) * (1 + 0.5 * Math.sin(t * 90)) * 1.4, 0.16);
    const nz2 = lowpass(212, 0.7);
    add(pcm, 0.89, 0.14, (t) => nz2() * Math.exp(-t * 38) * 3, 0.5);
    thud(pcm, 0.89, 120, 0.32, 0.22, 213);
    return pcm;
  },
  // masking tape torn off the roll and pressed down
  tape: () => {
    const pcm = buffer(0.25);
    const nz = lowpass(221, 0.8);
    add(pcm, 0, 0.14, (t) => nz() * (0.6 + 0.4 * Math.sign(Math.sin(t * 900))) * Math.sin((Math.PI * t) / 0.14) * 2, 0.26);
    return pcm;
  },
  // a felt pen scratching: four strokes (a ring, a strike-out)
  scribble: () => {
    const pcm = buffer(0.55);
    for (let k = 0; k < 4; k++) {
      const nz = lowpass(230 + k, 0.6);
      add(pcm, k * 0.1, 0.1, (t) => nz() * Math.sin((Math.PI * t) / 0.1) * 1.6, 0.18);
    }
    return pcm;
  },
  // an incoming video call: a marimba figure with the phone buzzing on every beat (8 notes 0.254 s apart — retime to
  // the song's half-beats)
  ring: () => {
    const pcm = buffer(2.1);
    const notes = [1047, 1319, 1568, 1319];
    for (let k = 0; k < 8; k++) tone(pcm, k * 0.254, notes[k % 4], 0.3, 0.15, 0, 14);
    for (let k = 0; k < 4; k++) buzz(pcm, k * 0.508, 0.22, 0.15);
    return pcm;
  },
  // declining a call: du-du
  hangup: () => {
    const pcm = buffer(0.3);
    tone(pcm, 0, 520, 0.09, 0.22, 0, 20);
    tone(pcm, 0.1, 440, 0.12, 0.22, 0, 16);
    return pcm;
  },
  // dragging a slider all the way (a rising whistle on a swish)
  slider: () => {
    const pcm = buffer(0.5);
    swish(pcm, 0, 0.42, 241, 0.2, 0.5);
    let ph = 0;
    add(pcm, 0, 0.42, (t) => {
      ph += (TAU * (600 + 1600 * (t / 0.42))) / SR;
      return Math.sin(ph) * Math.sin((Math.PI * t) / 0.42);
    }, 0.05);
    return pcm;
  },
  // a number flipping to its final value: a bright ding and a sprinkle (「瑕疵：0」)
  zero: () => {
    const pcm = buffer(1.1);
    ding(pcm, 0, 0.3, 1.0);
    ding(pcm, 0.08, 0.24, 1.5);
    const r = seeded(251);
    for (let k = 0; k < 8; k++) tone(pcm, 0.05 + k * 0.05, 2400 + r() * 2400, 0.25, 0.05, r() * 1.4 - 0.7, 16);
    return pcm;
  },
  // diving onto the couch under a blanket
  dive: () => {
    const pcm = buffer(0.8);
    thud(pcm, 0, 80, 0.4, 0.3, 271);
    const nz = lowpass(272, 0.35);
    add(pcm, 0.02, 0.6, (t) => nz() * Math.sin((Math.PI * t) / 0.6) * 1.6, 0.22);
    return pcm;
  },
  // a clock ticking fast (the night going by)
  ticks: () => {
    const pcm = buffer(0.55);
    for (let k = 0; k < 10; k++) add(pcm, k * 0.05, 0.02, (t) => Math.sin(TAU * 3200 * t) * Math.exp(-t * 400), 0.12, (k % 2) * 0.3 - 0.15);
    return pcm;
  },
  // an alarm clock's twin bells
  alarm: () => {
    const pcm = buffer(0.8);
    for (let k = 0; k < 15; k++) add(pcm, k * 0.045, 0.06, (t) => attack(t, 0.001) * (Math.sin(TAU * 2350 * t) * 0.6 + Math.sin(TAU * 3720 * t) * 0.3) * Math.exp(-t * 30), 0.16, (k % 2) * 0.3 - 0.15);
    return pcm;
  },
  // paper peeled off glass
  peel: () => {
    const pcm = buffer(0.25);
    const r = seeded(281);
    const nz = lowpass(282, 0.7);
    add(pcm, 0, 0.18, (t) => nz() * (r() > 0.55 ? 1.2 : 0.5) * Math.sin((Math.PI * t) / 0.18) * 2, 0.24);
    return pcm;
  },
  // a metal door onto the roof (a thud with a little ring)
  metalDoor: () => {
    const pcm = buffer(0.7);
    thud(pcm, 0, 90, 0.32, 0.35, 291);
    tone(pcm, 0.01, 330, 0.5, 0.06, 0, 7);
    tone(pcm, 0.01, 497, 0.4, 0.04, 0, 9);
    return pcm;
  },
  // sunglasses sliding down a nose (a falling whistle)
  slip: () => {
    const pcm = buffer(0.4);
    let ph = 0;
    add(pcm, 0, 0.3, (t) => {
      ph += (TAU * (1400 - 1000 * (t / 0.3))) / SR;
      return Math.sin(ph) * Math.sin((Math.PI * t) / 0.3);
    }, 0.12);
    return pcm;
  },
  // stopping dead (「黑猫！」): a scuff, a thud, a tink
  freeze: () => {
    const pcm = buffer(0.6);
    const nz = lowpass(311, 0.5);
    add(pcm, 0, 0.16, (t) => nz() * Math.sin((Math.PI * t) / 0.16) * 2.4, 0.28);
    thud(pcm, 0.02, 90, 0.4, 0.3, 312);
    tink(pcm, 0.02, 1760, 0.1);
    return pcm;
  },
  // a page turning over (one; `flips` is fourteen)
  flip: () => {
    const pcm = buffer(0.2);
    swish(pcm, 0, 0.14, 321, 0.22, 0.6);
    return pcm;
  },
  // a bedsheet thrown over a mirror: it flaps open in the air, then settles (the fwump 0.5 s in)
  sheet: () => {
    const pcm = buffer(0.9);
    const nz = lowpass(361, 0.25);
    add(pcm, 0, 0.5, (t) => nz() * Math.sin((Math.PI * t) / 0.5) * (0.7 + 0.3 * Math.sin(TAU * 13 * t)) * 2.2, 0.3);
    swish(pcm, 0.02, 0.36, 362, 0.22, 0.45);
    const nz2 = lowpass(363, 0.12);
    add(pcm, 0.5, 0.3, (t) => nz2() * Math.exp(-t * 12) * 3, 0.32);
    thud(pcm, 0.5, 70, 0.12, 0.2, 364);
    return pcm;
  },
  // a short whip of air for a whip-pan or a rush into a close-up (start it ~0.15 s before the cut)
  whip: () => {
    const pcm = buffer(0.35);
    swish(pcm, 0, 0.28, 331, 0.2, 0.35);
    return pcm;
  },
  // all the paper torn off a mirror at once
  rip: () => {
    const pcm = buffer(0.7);
    const r = seeded(351);
    const nz = lowpass(352, 0.75);
    add(pcm, 0, 0.55, (t) => nz() * (r() > 0.6 ? 1 : 0.4) * Math.exp(-t * 4) * 2.4, 0.38);
    thud(pcm, 0, 100, 0.22, 0.2, 353);
    return pcm;
  },
  // the end-card double tap: two taps and a little pop
  doubleTap: () => {
    const pcm = buffer(0.7);
    for (const at of [0, 0.14]) add(pcm, at, 0.1, (t) => Math.sin(TAU * 1800 * t) * Math.exp(-t * 90), 0.22);
    add(pcm, 0.16, 0.18, (t) => Math.sin(TAU * (500 + 1200 * t * 5) * t) * Math.exp(-t * 18), 0.22);
    return pcm;
  },
};

/** Every sound: its title, length (the clip length when placed) and where its main hit lands. */
export default defineSounds(SR, {
  // ---------------- 《i have no friends》
  typing: { title: "打字（手机键盘）", duration: 1.8, tags: ["手机", "打字", "键盘"], make: make.typing },
  send: { title: "发送消息（嗖）", duration: 0.4, hit: 0.17, tags: ["手机", "发送", "消息"], make: make.send },
  fail: { title: "发送失败（红色感叹号）", duration: 0.5, hit: 0, tags: ["手机", "失败", "提示"], make: make.fail },
  match: { title: "划火柴", duration: 0.8, hit: 0.01, tags: ["火柴", "蜡烛", "生日"], make: make.match },
  blow: { title: "吹蜡烛", duration: 0.9, hit: 0.1, tags: ["蜡烛", "生日", "吹"], make: make.blow },
  flood: { title: "消息轰炸（一串通知）", duration: 2.6, tags: ["手机", "通知", "消息"], make: make.flood },
  splat: { title: "蛋糕糊脸（啪）", duration: 0.5, hit: 0.01, tags: ["蛋糕", "派对", "啪"], make: make.splat },
  pop: { title: "礼花（砰）", duration: 1.4, hit: 0, tags: ["礼花", "派对", "庆祝"], make: make.pop },
  reply: { title: "回复提示音", duration: 0.8, hit: 0, tags: ["手机", "消息", "提示"], make: make.reply },
  // ---------------- 《unhappy》小狗版
  keys: { title: "门外的钥匙声", duration: 0.7, hit: 0.35, tags: ["钥匙", "门", "回家"], make: make.keys },
  doorOpen: { title: "开门（锁舌和吱呀）", duration: 0.8, hit: 0, tags: ["门", "开门", "家"], make: make.doorOpen },
  doorClose: { title: "关门", duration: 0.5, hit: 0, tags: ["门", "关门", "家"], make: make.doorClose },
  roomDoor: { title: "远处的房门", duration: 0.5, hit: 0, tags: ["门", "房间"], make: make.roomDoor },
  ball: { title: "球滚到床上又滚回来", duration: 1.4, tags: ["球", "玩具", "狗"], make: make.ball },
  slam: { title: "用力摔门", duration: 0.7, hit: 0.01, tags: ["门", "摔门", "生气"], make: make.slam },
  cough: { title: "小声干咳", duration: 0.6, hit: 0.01, tags: ["咳嗽", "狗", "生病"], make: make.cough },
  squeak: { title: "吱吱叫的兔子玩具", duration: 0.35, hit: 0.15, tags: ["玩具", "兔子", "狗"], make: make.squeak },
  rain: { title: "雨声（15 秒）", duration: 15, tags: ["雨", "下雨", "环境声", "天气"], description: "持续的雨声加零星的雨滴，15 秒；长环境声单独放一轨。", make: make.rain },
  heartbeat: { title: "心跳（越来越慢）", duration: 2.4, tags: ["心跳", "生病", "紧张"], make: make.heartbeat },
  click: { title: "手电开关", duration: 0.15, hit: 0, tags: ["开关", "手电", "咔哒"], make: make.click },
  splash: { title: "踩着水洼跑", duration: 0.9, tags: ["脚步", "水", "雨", "跑"], make: make.splash },
  whoosh: { title: "自动门滑开", duration: 0.6, hit: 0.3, tags: ["门", "自动门", "医院"], make: make.whoosh },
  xray: { title: "灯箱亮起", duration: 0.9, hit: 0, tags: ["灯", "医院", "X光"], make: make.xray },
  cash: { title: "钱拍在柜台上、硬币散落", duration: 1.4, hit: 0.02, tags: ["钱", "硬币", "付钱"], make: make.cash },
  rewind: { title: "倒带（切到另一个视角）", duration: 0.7, tags: ["倒带", "转场", "视角"], description: "磁带倒带的上扫，切到另一个人的视角时用。", make: make.rewind },
  pen: { title: "红笔划掉", duration: 1.4, tags: ["笔", "划掉", "红笔"], make: make.pen },
  swipe: { title: "手机滑动", duration: 0.3, hit: 0.1, tags: ["手机", "滑动"], make: make.swipe },
  tap: { title: "手机点击", duration: 0.2, hit: 0, tags: ["手机", "点击"], make: make.tap },
  chime: { title: "手机提示音（达成）", duration: 1.2, hit: 0.14, tags: ["手机", "提示", "完成"], make: make.chime },
  lightOff: { title: "「手术中」灯灭", duration: 0.3, hit: 0, tags: ["灯", "医院", "手术"], make: make.lightOff },
  flips: { title: "日历翻页（十四天）", duration: 2, tags: ["日历", "翻页", "时间流逝"], make: make.flips },
  thumps: { title: "尾巴拍被子", duration: 1.2, tags: ["狗", "尾巴", "开心"], make: make.thumps },
  // ---------------- 《unhappy》聊天版
  um: { title: "收到消息（两个轻音）", duration: 0.9, hit: 0.09, tags: ["手机", "消息", "提示"], make: make.um },
  note: { title: "朋友的通知（更轻更高）", duration: 0.6, hit: 0, tags: ["手机", "通知"], make: make.note },
  typing2: { title: "打字（1 秒）", duration: 1.1, tags: ["手机", "打字", "键盘"], make: make.typing2 },
  typingLong: { title: "打字（2.6 秒）", duration: 2.7, tags: ["手机", "打字", "键盘"], make: make.typingLong },
  del: { title: "长按删除", duration: 1.1, tags: ["手机", "删除", "键盘"], make: make.del },
  send2: { title: "发送消息（聊天版）", duration: 0.4, hit: 0.17, tags: ["手机", "发送", "消息"], make: make.send2 },
  lamp: { title: "台灯开关", duration: 0.15, hit: 0, tags: ["灯", "开关", "台灯"], make: make.lamp },
  powerOff: { title: "关机", duration: 0.6, hit: 0, tags: ["手机", "关机"], make: make.powerOff },
  rustle: { title: "被子窸窣", duration: 0.8, tags: ["被子", "床", "窸窣"], make: make.rustle },
  whoosh2: { title: "镜头甩过街道推进窗户", duration: 0.8, tags: ["转场", "甩镜", "风声"], description: "0.7 秒逐渐变亮的噪声，镜头甩过街道、推进窗户时用。", make: make.whoosh2 },
  rewind2: { title: "倒带（聊天版）", duration: 0.7, tags: ["倒带", "转场"], make: make.rewind2 },
  heartFast: { title: "心跳加速", duration: 1.8, tags: ["心跳", "紧张", "心动"], make: make.heartFast },
  bell: { title: "下课铃（叮——叮——）", duration: 1.6, tags: ["铃", "学校", "下课"], make: make.bell },
  steps: { title: "脚步", duration: 0.8, tags: ["脚步", "走路"], make: make.steps },
  shutter: { title: "拍照快门", duration: 0.3, hit: 0, tags: ["拍照", "快门", "手机"], make: make.shutter },
  birds: { title: "清晨鸟叫", duration: 1.6, tags: ["鸟", "清晨", "环境声"], make: make.birds },
  boot: { title: "开机", duration: 0.9, hit: 0, tags: ["手机", "开机"], make: make.boot },
  run: { title: "跑步", duration: 2.1, tags: ["脚步", "跑"], make: make.run },
  store: { title: "便利店门铃", duration: 1.2, hit: 0.22, tags: ["便利店", "门铃", "商店"], make: make.store },
  pay: { title: "付款提示音", duration: 0.3, hit: 0, tags: ["付款", "手机", "商店"], make: make.pay },
  door: { title: "开门（聊天版）", duration: 0.5, hit: 0, tags: ["门", "开门"], make: make.door },
  milk: { title: "牛奶放在桌上", duration: 1, hit: 0.01, tags: ["牛奶", "桌子", "放下"], make: make.milk },
  sparkle: { title: "闪光（叮铃）", duration: 1, tags: ["闪光", "可爱", "提示"], make: make.sparkle },
  stickerPop: { title: "贴纸弹出", duration: 0.3, hit: 0, tags: ["贴纸", "手机", "弹出"], make: make.stickerPop },
  // ---------------- 《i have no friends》重置版
  bellElectric: { title: "电铃上课铃", duration: 1.25, tags: ["铃", "学校", "上课"], make: make.bellElectric },
  horn: { title: "派对喇叭（吹出又泄气）", duration: 1.1, tags: ["派对", "喇叭", "生日"], description: "一个人吹的派对喇叭：嗡嗡的纸簧加颤音，突然断掉，再泄气地软软叫一声。放在「不压歌曲」的音效轨。", make: make.horn },
  floodFast: { title: "消息轰炸（快，七条）", duration: 2.6, tags: ["手机", "通知", "消息"], description: "七声铃加振动，间隔 0.12 秒，对上画面上的通知。", make: make.floodFast },
  // ---------------- 《mirrors》（瑕疵：0）
  paperSlap: { title: "报纸啪地糊上镜子", duration: 1.25, hit: 0.89, tags: ["报纸", "纸", "镜子", "啪"], description: "一张报纸滑过镜子，然后啪地糊平：啪在第 0.89 秒，片段要提前 0.89 秒开始。", make: make.paperSlap },
  tape: { title: "撕下胶带按上", duration: 0.25, hit: 0.07, tags: ["胶带", "纸"], make: make.tape },
  scribble: { title: "记号笔划（四笔）", duration: 0.55, tags: ["笔", "记号笔", "圈"], description: "四笔记号笔的摩擦声（画圈、划掉）。", make: make.scribble },
  ring: { title: "视频来电铃声", duration: 2.1, tags: ["手机", "来电", "铃声"], description: "马林巴乐句，每拍手机振动一下（8 个音间隔 0.254 秒，按歌曲的半拍重新卡点）。", make: make.ring },
  hangup: { title: "挂断（嘟嘟）", duration: 0.3, hit: 0.1, tags: ["手机", "挂断"], make: make.hangup },
  slider: { title: "拖动滑条", duration: 0.5, tags: ["手机", "滑条", "拖动"], make: make.slider },
  zero: { title: "数字翻到 0（叮和闪光）", duration: 1.1, hit: 0.08, tags: ["数字", "提示", "完成"], make: make.zero },
  dive: { title: "扑进沙发盖毯子", duration: 0.8, hit: 0, tags: ["沙发", "毯子", "扑"], make: make.dive },
  ticks: { title: "钟表快走（一夜过去）", duration: 0.55, tags: ["时钟", "时间流逝"], make: make.ticks },
  alarm: { title: "闹钟双铃", duration: 0.8, tags: ["闹钟", "早上", "铃"], make: make.alarm },
  peel: { title: "从玻璃上揭纸", duration: 0.25, hit: 0.08, tags: ["纸", "揭"], make: make.peel },
  metalDoor: { title: "天台铁门", duration: 0.7, hit: 0.01, tags: ["门", "铁门", "天台"], make: make.metalDoor },
  slip: { title: "墨镜滑下鼻梁", duration: 0.4, tags: ["墨镜", "滑"], make: make.slip },
  freeze: { title: "急停（摩擦、闷响、叮）", duration: 0.6, hit: 0.03, tags: ["停下", "惊讶"], make: make.freeze },
  flip: { title: "翻一页", duration: 0.2, hit: 0.08, tags: ["翻页", "纸", "书"], make: make.flip },
  sheet: { title: "床单扔到镜子上", duration: 0.9, hit: 0.5, tags: ["床单", "布", "扔"], description: "床单在空中翻开再落下：落地的闷响在第 0.5 秒。", make: make.sheet },
  whip: { title: "甩镜头的风声", duration: 0.35, hit: 0.15, tags: ["转场", "甩镜", "冲镜", "风声"], description: "甩镜或冲进特写的一下风声：比切点早约 0.15 秒开始。", make: make.whip },
  rip: { title: "一下撕掉所有的纸", duration: 0.7, hit: 0, tags: ["纸", "撕"], make: make.rip },
  doubleTap: { title: "双击点赞（两下和啵）", duration: 0.7, tags: ["点赞", "双击", "手机", "结尾"], make: make.doubleTap },
});
