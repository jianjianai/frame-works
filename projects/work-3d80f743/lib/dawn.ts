// 副歌一②（43.92 起）共用的东西：43.92 从整座城的夜里直接切到天亮的街上（最高那栋楼右边那栋五层楼前），天亮的颜色、
// 第一幕老钟家那条街、小石头和妈妈的配置。②–⑥ 的人和东西在 lib/mother.ts，镜头在 lib/streetcam.ts。

import { CAST } from "@materials/剪纸角色/code/cast";
import { type Angles } from "@materials/剪纸角色/code/chengtuo";
import { E, ph } from "./cam";
import { type Block } from "./world";
import { type House } from "./props";

export const DAWN_T = {
  /** 2026-10-21 用户：「这里不要继续展示城市全景了，直接切下一个剧情，这句时间给下个剧情」——43.92 直接切到天亮的街上 */
  start: 43.92,
  /** 天亮：切过来是刚亮的清晨（还有一点蓝），「并非没光亮」暖光一点点亮起来 */
  sky0: 43.92,
  sky1: 45.5,
  lights0: 43.92,
  lights1: 45.2,
  /** 天上的网收回窗里（画面外） */
  reel0: 44.0,
  reel1: 45.3,
};

/** [天黑了多少, 城里的窗亮了多少]：①整段是夜；切到街上是刚亮的清晨，暖光一点点亮起来（还留一点粉） */
export function dawnSky(t: number): [number, number] {
  const T = DAWN_T;
  if (t < T.start) return [1, 1];
  const u = E.io(ph(t, T.sky0, T.sky1));
  return [0.5 - 0.32 * u, 0.45 - 0.4 * Math.pow(ph(t, T.lights0, T.lights1), 0.8)];
}
/** 夜里人身上那团光：天亮了就没了 */
export const nightGlow = (t: number) => (t < DAWN_T.start ? 1 : 0);

// ——— 街上：最高那栋楼右边那栋五层楼前（第一幕老钟家左边那栋），和第一幕同一条街 ———
/** 第一幕老钟家（一楼窗后是老钟）和它左右的邻居：和 scenes/act1.ts 里的一样（老钟家 −2025…−1225） */
export const ZHONG_HOUSE: House = { x0: -2025, x1: -1225, top: -1480, win: { x: -1545, w: 330, sill: -300, top: -660 } };
export const ZHONG_NEIGHBORS: Block[] = [
  { x: ZHONG_HOUSE.x1 + 60, w: 280, floors: 1, fh: 300, wall: "#e8c9a6", wallShade: "#d9b690", seed: 311, shop: "#c96a52", plainRoof: true },
  { x: ZHONG_HOUSE.x0 - 60 - 560, w: 560, floors: 5, fh: 230, wall: "#e6b39d", wallShade: "#d69f88", seed: 312, shop: "#6f8f86" },
];

export const STONE = CAST.小石头;
export const MOM = CAST.小石头的妈妈;
/** 妈妈站在哪（根的 x）：五层楼的铺面前 */
export const MOM_X = -2330;

export function pose(lean: number, rest: Omit<Angles, "lean">, arms: (lean: number) => Angles): Angles {
  return { lean, ...rest, ...arms(lean) };
}
