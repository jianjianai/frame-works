import { createAudioRack } from "../../src/engine/audio-adapters";
import { createPcmAudio, type StereoPcm } from "../../src/engine/procedural-audio";

// 手机振动的“嗡——嗡——”：开头钩子和结尾循环各用一次
const SR = 48000;
function vibration(): StereoPcm {
  const len = Math.round(SR * 0.7);
  const l = new Float32Array(len), r = new Float32Array(len);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
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

export const { generators, createAudio } = createAudioRack({ buzz: createPcmAudio({ main: vibration }, SR) });
