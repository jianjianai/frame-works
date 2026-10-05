import { createAudioRack } from "../../src/engine/audio-adapters";
import { createPcmAudio, type StereoPcm } from "../../src/engine/procedural-audio";

const SR = 48000;
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

// 手机振动的“嗡——嗡——”
function vibration(): StereoPcm {
  const len = Math.round(SR * 0.7);
  const l = new Float32Array(len), r = new Float32Array(len);
  const rnd = rng(7);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const on = (t < 0.3 ? 1 : 0) + (t > 0.38 && t < 0.68 ? 1 : 0);
    const edge = Math.min(1, (t % 0.38) / 0.015, (0.3 - (t % 0.38)) / 0.02);
    const env = on * Math.max(0, edge);
    const motor = Math.sin(2 * Math.PI * 165 * t) * 0.6 + Math.sign(Math.sin(2 * Math.PI * 165 * t)) * 0.25;
    const rattle = rnd() * 0.25 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 82 * t));
    const v = (motor + rattle) * env * 0.32;
    l[i] = v;
    r[i] = v;
  }
  return [l, r];
}

// 开头 1.6 秒：暴雨 + 两声雷（与画面的两次闪电对齐：0s、0.18s）
function storm(): StereoPcm {
  const len = Math.round(SR * 1.6);
  const l = new Float32Array(len), r = new Float32Array(len);
  const nl = rng(11), nr = rng(23), nt = rng(5);
  let lpL = 0, lpR = 0, brown = 0, rum = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    // 雨：白噪声的高频部分，双声道不相关
    const wl = nl(), wr = nr();
    lpL += 0.35 * (wl - lpL);
    lpR += 0.35 * (wr - lpR);
    const rainEnv = Math.min(1, t / 0.02) * (t < 0.9 ? 1 : Math.max(0, 1 - (t - 0.9) / 0.7));
    const rainL = (wl - lpL) * 0.16 * rainEnv, rainR = (wr - lpR) * 0.16 * rainEnv;
    // 雷：炸裂声 + 低沉的滚雷
    const w = nt();
    brown = brown * 0.995 + w * 0.05;
    rum += 0.02 * (brown - rum);
    const crack = Math.exp(-t / 0.05) * 0.55 + (t > 0.18 ? Math.exp(-(t - 0.18) / 0.04) * 0.35 : 0);
    const rumbleEnv = Math.min(1, t / 0.06) * Math.exp(-t / 0.7);
    const thunder = w * crack + rum * 9 * rumbleEnv;
    l[i] = rainL + thunder * 0.9;
    r[i] = rainR + thunder * 0.9;
  }
  return [l, r];
}

export const { generators, createAudio } = createAudioRack({
  buzz: createPcmAudio({ main: vibration }, SR),
  storm: createPcmAudio({ main: storm }, SR),
});
