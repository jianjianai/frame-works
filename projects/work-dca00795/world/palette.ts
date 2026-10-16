// 沉州的颜色：柔和的粉、杏、薄荷、雾蓝、奶油、淡紫的楼，暖黄的窗；天是粉橙到淡紫，「白」是发光的暖白。
// 题材再沉，画面也要好看、不压抑（经验库「画面风格」）：情绪靠光和颜色讲，夜是靛蓝不是黑。
import * as THREE from "three";

export const WALLS = ["#eab7b3", "#f3cba3", "#bcdcc6", "#aac4dc", "#f2e3c4", "#cbbbdc", "#e9c6d9", "#c4d8d2", "#f0d2b8", "#b9c9e6"].map(
  (c) => new THREE.Color(c),
);

export interface Mood {
  /** 天顶（白）、天的上部、地平线的雾、低处的雾 */
  white: string;
  skyHigh: string;
  haze: string;
  hazeLow: string;
  /** 雾的浓度（越大越近就看不清） */
  fog: number;
  /** 环境光（天/地）和主光 */
  hemiSky: string;
  hemiGround: string;
  hemi: number;
  sun: string;
  sunI: number;
  /** 窗里的灯：亮着的比例、颜色 */
  windowsLit: number;
  windowLight: string;
  glass: string;
  /** 灰的颜色 */
  ash: string;
}

export const DAY: Mood = {
  white: "#fffaf1",
  skyHigh: "#ffe6d6",
  haze: "#f1d3dc",
  hazeLow: "#d9cbe2",
  fog: 0.0015,
  hemiSky: "#fff2e6",
  hemiGround: "#cdbfdc",
  hemi: 1.55,
  sun: "#fff6ea",
  sunI: 1.5,
  windowsLit: 0.18,
  windowLight: "#ffe2a6",
  glass: "#8d93b8",
  ash: "#fbe9ef",
};

export const DAWN: Mood = {
  ...DAY,
  white: "#fff3ea",
  skyHigh: "#ffd2bf",
  haze: "#f4c2c4",
  hazeLow: "#c6b6d8",
  hemiSky: "#ffe2d2",
  windowsLit: 0.35,
};

export const NIGHT: Mood = {
  white: "#eef1ff",
  skyHigh: "#9aa6dc",
  haze: "#5b5f9c",
  hazeLow: "#3e4380",
  fog: 0.0026,
  hemiSky: "#9fa7e0",
  hemiGround: "#3c3f78",
  hemi: 1.15,
  sun: "#d6dcff",
  sunI: 0.9,
  windowsLit: 0.55,
  windowLight: "#ffd690",
  glass: "#3d4274",
  ash: "#dfe2ff",
};

export function mixMood(a: Mood, b: Mood, k: number): Mood {
  const c = (x: string, y: string) => "#" + new THREE.Color(x).lerp(new THREE.Color(y), k).getHexString();
  const n = (x: number, y: number) => x + (y - x) * k;
  return {
    white: c(a.white, b.white),
    skyHigh: c(a.skyHigh, b.skyHigh),
    haze: c(a.haze, b.haze),
    hazeLow: c(a.hazeLow, b.hazeLow),
    fog: n(a.fog, b.fog),
    hemiSky: c(a.hemiSky, b.hemiSky),
    hemiGround: c(a.hemiGround, b.hemiGround),
    hemi: n(a.hemi, b.hemi),
    sun: c(a.sun, b.sun),
    sunI: n(a.sunI, b.sunI),
    windowsLit: n(a.windowsLit, b.windowsLit),
    windowLight: c(a.windowLight, b.windowLight),
    glass: c(a.glass, b.glass),
    ash: c(a.ash, b.ash),
  };
}
