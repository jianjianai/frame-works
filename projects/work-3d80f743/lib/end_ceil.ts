// 终章「就请你」（95.40–96.02）：切回天花板上的两张床（和四①结尾同一个取景：她睡着的脸、空着的手）——
// 她的手在床缝里攥了个空，猛地睁眼，扭头：他那张床空了，解开的红绳垂着。画法照 lib/bed.ts 的 drawCeiling（CeilingCast 换两个人和灯光）。

import { type MoveKey, CHENGTUO } from "@materials/剪纸角色/code/chengtuo";
import { lookOf } from "@materials/剪纸角色/code/cast";
import { E, ph } from "./cam";
import { ARMS, live } from "./motion";
import { CLASP, type CeilingCast, HER as BED_HER, HER_BED, HIS_BED, STONE_BED, placeHer, placeHim } from "./bed";
import { TE, mix } from "./end_t";

const SLEEP = { ...BED_HER.睡, headTurn: 0.48, smile: 0.4 };
const SHOCK = { ...BED_HER.睡, headTurn: 0.5, expression: "惊" as const, sad: 0.4, smile: -0.3, wide: 1, lookX: 0.6, lookY: 0.2, handL: "open" as const };
const LOOK = { ...BED_HER.睡, headTurn: 0.66, expression: "惊" as const, sad: 0.8, smile: -0.5, open: 0.35, wide: 1, lookX: 1, lookY: 0.1, handL: "open" as const };
const herBedMove = live(
  [
    { t: 95.0, x: 0, items: { boots: false, bricks: 0, gloves: false }, p: SLEEP },
    { t: TE.grope - 0.08, p: SLEEP },
    // 手在床缝里攥了一下：空的
    { t: TE.grope + 0.04, ease: "out", p: { ...SLEEP, smile: 0, handL: "fist" } },
    // 猛地睁眼
    { t: TE.wake - 0.02, p: { ...SLEEP, smile: 0, handL: "fist" } },
    { t: TE.wake + 0.06, ease: "out", p: SHOCK },
    // 扭头看他那张空床
    { t: TE.look, p: SHOCK },
    { t: TE.look + 0.14, ease: "out", p: LOOK },
    { t: 97, p: LOOK },
  ] as MoveKey[],
  { look: CHENGTUO, base: { wind: 0 }, idle: true, seed: 1101, springs: ARMS, follow: 0 },
);
/** 他那张床空着时也给一个他（只用来定红绳垂下来的地方） */
const himGone = placeHim({ ...live([{ t: 90, x: 0, p: { face: -0.55, ground: false } }] as MoveKey[], { look: lookOf(STONE_BED), springs: {}, follow: 0 })(91).pose }, CLASP, [HIS_BED.x1 - 50, -150]);
export function wakeCast(t: number): CeilingCast {
  // 她近处那只手：伸在床缝上（他走了，空着）；醒来扭头时往他那张床上摸过去
  const reach = E.io(ph(t, TE.look - 0.02, TE.look + 0.2));
  const hand = mix(CLASP, [HIS_BED.x0 + 70, -232], reach);
  const her = placeHer({ ...herBedMove(t).pose }, hand, [HER_BED.x0 + 70, -120]);
  // 天快亮：比他走的时候（四①）亮一点
  return { her, him: himGone, lightT: 87.42, untie: 1, empty: true };
}
