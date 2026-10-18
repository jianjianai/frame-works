// 画面风格：柔和的扁平插画 + 细颗粒。粉橙到淡紫的天，发光的「白」，粉白色的落灰像雪；
// 人物圆润、有表情，每个人一个标志色（人链里认得出来）。夜里是靛蓝，不是黑。
import { clamp, mix } from "./core";

export const PAL = {
  // 天：从白往下到地面（白天 / 夜里）
  skyDay: ["#ffffff", "#fff3e6", "#ffe0cf", "#f6c8cd", "#d9c4e3", "#b8c2e2"],
  skyNight: ["#f6f3ff", "#cfd2f4", "#959fdb", "#6670b0", "#474f8c", "#353b72"],
  haze: "#dccfe5",
  hazeNight: "#5b6299",
  ground: "#d2c5cc",
  groundDeep: "#b3a5b4",
  groundNight: "#6a6890",
  cobble: "#bcaebb",
  ash: "#fff8f6",
  ashOnBright: "#c9b7cf",
  ink: "#3e3149", // 描边、字的阴影
  warm: "#ffc56e",
  warmRGB: "255,196,120",
  lit: "#ffd27a",
  unlit: "#9a99c0",
  unlitNight: "#3c4377",
  wood: "#b07d5e",
  woodDark: "#82593f",
  buildings: ["#e6aaa8", "#f0c39f", "#b9d1b1", "#a9c1de", "#efe0c4", "#c8b4de", "#f1b9c9", "#a0c9c3", "#e9cf9f"],
};

export interface Look {
  skin: string;
  hair: string;
  top: string;
  bottom: string;
  shoe: string;
  legs?: string; // 裙子下面的腿（袜子）
  accent?: string; // 围巾、领带、发卡
  cap?: string;
}
export const LOOKS: Record<string, Look> = {
  qin: { skin: "#f5d3bf", hair: "#4a3430", top: "#465f93", bottom: "#465f93", shoe: "#5d3f34", legs: "#4b3f55", accent: "#f0b44a" },
  kid: { skin: "#f7dac7", hair: "#3e2d29", top: "#6fb07a", bottom: "#4f6797", shoe: "#8a5440", accent: "#e65a4f" },
  man: { skin: "#f1cdb8", hair: "#2f2829", top: "#7d8fb4", bottom: "#5f6c8c", shoe: "#3b3234", accent: "#3a72d8" },
  woman: { skin: "#f4d0bd", hair: "#3a2b2b", top: "#b9a2d9", bottom: "#9786c3", shoe: "#6b4e57", legs: "#6f5f80" },
  mom: { skin: "#f4d0bd", hair: "#4b302a", top: "#cc6d58", bottom: "#ab584b", shoe: "#5a3d33", legs: "#6a4a46" },
  girl: { skin: "#f6d6c4", hair: "#2a2226", top: "#e0524a", bottom: "#8a3d4a", shoe: "#5e4b63", legs: "#5d4c6a", accent: "#ffd35c" },
  old: { skin: "#efcdb8", hair: "#efe9e2", top: "#a9835f", bottom: "#706c82", shoe: "#4d3c35" },
  weigher: { skin: "#efcbb6", hair: "#2f2829", top: "#41508a", bottom: "#36406c", shoe: "#26283a", cap: "#41508a" },
  worker: { skin: "#eec8b0", hair: "#3b2d27", top: "#b5835b", bottom: "#5c6378", shoe: "#45363a", cap: "#5f9a72" },
  little: { skin: "#f7d9c6", hair: "#4a3430", top: "#f2c65c", bottom: "#f2c65c", shoe: "#7b5a48", legs: "#d9a54a" },
  plain: { skin: "#f1cfbb", hair: "#3a2e2e", top: "#9fb8d8", bottom: "#6f7898", shoe: "#4a3d40" },
};
/** 路人的衣服和伞：按种子挑 */
const TOPS = ["#e7a3a0", "#9fc1df", "#b6d3ae", "#f0c99a", "#c9b2df", "#f2b6c6", "#a3cdc6", "#e8d39f", "#d7a9cf"];
const BOTTOMS = ["#6f7898", "#7d6a8e", "#5f6c8c", "#8a7766", "#6b7b7a"];
/** 小石头的妈妈：杏色外套（千斤的妈妈穿紫色，不能撞色） */
export const KID_MOM_LOOK = { top: "#f2b28c", bottom: "#c98b6c", legs: "#7d6266" };
export const UMBRELLAS = ["#e65a4f", "#f0b44a", "#5fa8a0", "#7d8fd6", "#e88fb0", "#8fc16f", "#f28c5a", "#b38ad6"];
export function crowdLook(seed: number): Partial<Look> {
  const r = (k: number) => Math.abs(Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1;
  return { top: TOPS[Math.floor(r(1) * TOPS.length)], bottom: BOTTOMS[Math.floor(r(2) * BOTTOMS.length)] };
}

// ---------- 颜色运算 ----------
function hexRGB(c: string): number[] {
  const v = parseInt(c.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
export function blend(a: string, b: string, t: number) {
  const x = hexRGB(a);
  const y = hexRGB(b);
  const k = clamp(t);
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${h(mix(x[0], y[0], k))}${h(mix(x[1], y[1], k))}${h(mix(x[2], y[2], k))}`;
}
export const darker = (c: string, k: number) => blend(c, "#2a2035", k);
export const lighter = (c: string, k: number) => blend(c, "#ffffff", k);
export function rgba(c: string, a: number) {
  const x = hexRGB(c);
  return `rgba(${x[0]},${x[1]},${x[2]},${a})`;
}
