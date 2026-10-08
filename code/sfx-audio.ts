import { createAudioRack } from "../../src/engine/audio-adapters";
import { createPcmAudio, StereoPcm } from "../../src/engine/procedural-audio";
import { seeded } from "../../src/engine/math";

/** 合成音效库（全部确定性）。复制为作品根目录的 audio.ts；audio.json 里每个音效是一个 generated 源
 *  （module "sfx", trackId = 下面的名字），clip 的 start 对齐画面事件时间。不用的音效可以删掉。
 *  第一支《i have no friends》：typing/send/fail/match/blow/flood/splat/pop/reply
 *  第二支《unhappy》：keys/doorOpen/doorClose/roomDoor/ball/slam/cough/squeak/rain/heartbeat/click/splash/
 *  whoosh/xray/cash/rewind/pen/swipe/tap/chime/lightOff/flips/thumps（小狗版）
 *  《unhappy》聊天版：um/note/typing2/typingLong/del/send2/lamp/powerOff/rustle/whoosh2/rewind2/heartFast/bell/steps/shutter/
 *  birds/boot/run/store/pay/door/milk/sparkle/stickerPop
 *  《i have no friends》重置版：bellElectric（电铃上课铃）/horn（派对喇叭，放「不压歌曲」的音效轨）/floodFast（七条通知间隔 0.12 秒） */
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
  // sags back (phase integrated, so the pitch bends cleanly). Put it on a track the music does not duck under.
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
};

export const { generators, createAudio } = createAudioRack({ sfx: createPcmAudio(sounds, SR) });
