// 草稿音效：全部用代码合成（不用素材库）。每个音效是一条生成音轨，audio.json 的片段把它们放到对应的时刻。
import { createAudioRack } from "@frame/engine/audio-adapters";
import { createPcmAudio, type StereoPcm } from "@frame/engine/procedural-audio";

const SR = 48000;
const buf = (sec: number): StereoPcm => {
  const n = Math.max(1, Math.floor(sec * SR));
  return [new Float32Array(n), new Float32Array(n)];
};
function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
/** 低频的一下闷响（可带下滑的音高） */
function thump(o: StereoPcm, at: number, freq: number, decay: number, amp: number, sweep = 0) {
  const [L, R] = o;
  const i0 = Math.floor(at * SR);
  let ph = 0;
  for (let i = i0; i < L.length; i++) {
    const t = (i - i0) / SR;
    const e = Math.exp(-t / decay);
    if (e < 0.0005) break;
    ph += (2 * Math.PI * freq * (1 + sweep * Math.exp(-t * 40))) / SR;
    const v = Math.sin(ph) * e * amp * Math.min(1, t * 2000);
    L[i] += v;
    R[i] += v;
  }
}
/** 一段噪声（一阶低通，lp 越小越闷），pan -1..1 */
function noise(o: StereoPcm, at: number, decay: number, amp: number, lp: number, seed: number, pan = 0, hp = 0) {
  const [L, R] = o;
  const r = rand(seed);
  const i0 = Math.floor(at * SR);
  let y = 0;
  let y2 = 0;
  for (let i = i0; i < L.length; i++) {
    const t = (i - i0) / SR;
    const e = Math.exp(-t / decay);
    if (e < 0.0005) break;
    y += lp * (r() * 2 - 1 - y);
    y2 += hp * (y - y2);
    const v = (y - y2) * e * amp * Math.min(1, t * 3000);
    L[i] += v * (1 - Math.max(0, pan));
    R[i] += v * (1 + Math.min(0, pan));
  }
}
/** 金属的一声 */
function ping(o: StereoPcm, at: number, freq: number, decay: number, amp: number) {
  const [L, R] = o;
  const i0 = Math.floor(at * SR);
  for (let i = i0; i < L.length; i++) {
    const t = (i - i0) / SR;
    const e = Math.exp(-t / decay);
    if (e < 0.0005) break;
    const v = Math.sin(2 * Math.PI * freq * t) * e * amp;
    L[i] += v;
    R[i] += v * 0.9;
  }
}
/** 碎渣：很多细小的颗粒声 */
function grains(o: StereoPcm, at: number, span: number, count: number, amp: number, seed: number) {
  const r = rand(seed);
  for (let k = 0; k < count; k++) noise(o, at + r() * span, 0.004 + r() * 0.006, amp * (0.4 + r() * 0.6), 0.5, seed + k * 13, (r() - 0.5) * 0.8, 0.3);
}
/** 结尾淡出，避免爆音 */
function tail(o: StereoPcm, sec: number) {
  const n = Math.floor(sec * SR);
  for (const ch of o) for (let i = 0; i < n && i < ch.length; i++) ch[ch.length - 1 - i] *= i / n;
  return o;
}

const sounds = {
  /** 指节敲薄墙：咚 */
  knock: () => {
    const o = buf(0.3);
    thump(o, 0, 150, 0.035, 0.55, 0.6);
    noise(o, 0, 0.008, 0.35, 0.35, 11);
    return tail(o, 0.05);
  },
  /** 一巴掌捂住墙缝 */
  slap: () => {
    const o = buf(0.35);
    noise(o, 0, 0.045, 0.6, 0.25, 21);
    thump(o, 0, 95, 0.06, 0.5, 0.3);
    return tail(o, 0.05);
  },
  /** 小刀掉在地上，弹两下 */
  clatter: () => {
    const o = buf(0.7);
    [0, 0.085, 0.15].forEach((at, k) => {
      const a = [0.4, 0.22, 0.1][k];
      ping(o, at, 2400, 0.09, a);
      ping(o, at, 3650, 0.06, a * 0.8);
      ping(o, at, 5230, 0.04, a * 0.6);
      noise(o, at, 0.01, a, 0.6, 31 + k);
    });
    return tail(o, 0.08);
  },
  /** 拳头砸墙 */
  bang: () => {
    const o = buf(0.45);
    thump(o, 0, 70, 0.11, 0.9, 0.8);
    noise(o, 0, 0.04, 0.5, 0.15, 41);
    noise(o, 0.01, 0.2, 0.1, 0.05, 43);
    return tail(o, 0.06);
  },
  /** 刀尖挖墙：一下戳进去，碎渣掉下来 */
  dig: () => {
    const o = buf(0.35);
    thump(o, 0, 180, 0.02, 0.3, 0.2);
    noise(o, 0, 0.06, 0.45, 0.55, 51, 0, 0.25);
    grains(o, 0.02, 0.18, 9, 0.25, 53);
    return tail(o, 0.05);
  },
  /** 扒墙、墙裂开 */
  crumble: () => {
    const o = buf(0.7);
    grains(o, 0, 0.5, 34, 0.3, 61);
    noise(o, 0, 0.25, 0.12, 0.04, 63);
    return tail(o, 0.1);
  },
  /** 墙塌了（短，0.5 秒内收住，静音段必须是真的静音） */
  collapse: () => {
    const o = buf(0.5);
    thump(o, 0, 55, 0.16, 1.0, 0.5);
    noise(o, 0, 0.14, 0.55, 0.05, 71);
    grains(o, 0.02, 0.35, 50, 0.32, 73);
    return tail(o, 0.12);
  },
  /** 他开口前吸的一口气 */
  breath: () => {
    const o = buf(0.4);
    const [L, R] = o;
    const r = rand(81);
    let y = 0;
    for (let i = 0; i < L.length; i++) {
      const t = i / SR;
      y += 0.09 * (r() * 2 - 1 - y);
      const e = Math.sin(Math.PI * Math.min(1, t / 0.4)) ** 1.5;
      L[i] = R[i] = y * e * 0.5;
    }
    return o;
  },
  /** 手指在他手背上轻敲 */
  tap: () => {
    const o = buf(0.18);
    thump(o, 0, 210, 0.025, 0.35);
    noise(o, 0, 0.004, 0.1, 0.4, 91);
    return tail(o, 0.04);
  },
  /** 小孩敲墙 */
  kidTap: () => {
    const o = buf(0.18);
    thump(o, 0, 265, 0.02, 0.3, 0.3);
    noise(o, 0, 0.003, 0.08, 0.45, 95);
    return tail(o, 0.04);
  },
  /** 甩镜的风声 */
  whoosh: () => {
    const o = buf(0.42);
    const [L, R] = o;
    const r = rand(101);
    let y = 0;
    let y2 = 0;
    for (let i = 0; i < L.length; i++) {
      const u = i / L.length;
      const lp = 0.03 + 0.22 * Math.sin(Math.PI * u);
      y += lp * (r() * 2 - 1 - y);
      y2 += 0.02 * (y - y2);
      const e = Math.sin(Math.PI * u) ** 2;
      const v = (y - y2) * e * 0.5;
      L[i] = v * (1.2 - u);
      R[i] = v * (0.2 + u);
    }
    return o;
  },
  /** 结尾双击点赞的轻响 */
  pop: () => {
    const o = buf(0.16);
    const [L, R] = o;
    let ph = 0;
    for (let i = 0; i < L.length; i++) {
      const t = i / SR;
      ph += (2 * Math.PI * (900 - 500 * Math.min(1, t / 0.06))) / SR;
      const v = Math.sin(ph) * Math.exp(-t / 0.045) * 0.35;
      L[i] = R[i] = v;
    }
    return o;
  },
};

export const { generators, createAudio } = createAudioRack({ sfx: createPcmAudio(sounds, SR) });
