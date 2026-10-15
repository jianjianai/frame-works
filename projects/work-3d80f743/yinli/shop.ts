// 哑铃店：她住的那栋最高的楼脚下。前奏结尾全城的远景里就看得见它，主歌一第一镜从全城扎进店门口——两边用同一个画法，接得上。
import { type C, E, ph, mix } from "./core";
import { figure, walk, type Fig, type Pt } from "./figure";
import { dumbbell, dumbbellShop } from "./props";

export const SHOP = -1950; // 哑铃店门脸中心（她住的那栋最高的楼脚下）
export const BIG_S = 2.0; // 店门口展台上最大的那只
export const BIG_X = SHOP + 150;
const PLINTH = 22; // 展台高
const BIG_REST: Pt = [BIG_X, -PLINTH - 17 * BIG_S];

/** 买哑铃的人（都低着头）：x0 → x1 走，hold 是手里哑铃的大小（0 = 空手） */
const BUYERS = [
  { x0: SHOP - 90, x1: SHOP - 470, a: 15.9, b: 17.82, hold: 0.8, kind: "man" as const, look: { top: "#8fa7c9", bottom: "#5d6a8a" } },
  { x0: SHOP - 110, x1: SHOP - 110, a: 0, b: 0, hold: 0, kind: "plain" as const, look: { top: "#c9a27a", bottom: "#6e5a4a" }, face: -1 as const }, // 在柜台前排队
  { x0: SHOP - 40, x1: SHOP - 40, a: 0, b: 0, hold: 0, kind: "worker" as const, look: { top: "#9cc4a8", bottom: "#5e7466" }, face: -1 as const },
  { x0: SHOP + 20, x1: SHOP + 560, a: 16.0, b: 17.6, hold: 0.6, kind: "plain" as const, look: { top: "#d9c9a8", bottom: "#7a6f62" } },
  { x0: SHOP + 760, x1: SHOP + 460, a: 15.9, b: 17.2, hold: 0, kind: "man" as const, look: { top: "#a9b8c4", bottom: "#5b6670" } }, // 赶来买的人
  { x0: SHOP - 200, x1: SHOP - 560, a: 16.4, b: 17.82, hold: 1.0, kind: "worker" as const, look: { top: "#c48f86", bottom: "#6a5050" } },
];

// 千斤的妈妈从街那头走过来（全城的远景里就在走），走到展台前慢下来停住
const MOM_STOP = BIG_X - 62;
const MOM_V = 130;
const MOM_BRAKE = 0.5;
const T_ARRIVE = 16.8;
function momX(t: number) {
  if (t < T_ARRIVE - MOM_BRAKE) return MOM_STOP - (MOM_V * MOM_BRAKE) / 2 - MOM_V * (T_ARRIVE - MOM_BRAKE - t);
  return MOM_STOP - ((MOM_V * MOM_BRAKE) / 2) * (1 - ph(t, T_ARRIVE - MOM_BRAKE, T_ARRIVE)) ** 2;
}
/** 千斤的妈妈：走到展台前，指着最大的那只；蹲下去抱起来（很沉，膝盖一直弯着），抱在怀里一步一步往外挪 */
function momBuy(t: number): { f: Fig; d: Pt; rot: number } {
  const arrive = E.io(ph(t, T_ARRIVE - 0.4, T_ARRIVE));
  const crouch = E.io(ph(t, 16.95, 17.15)) * (1 - E.io(ph(t, 17.15, 17.45)) * 0.6);
  const lift = E.io(ph(t, 17.12, 17.45));
  const shuffle = ph(t, 17.45, 17.82);
  const x = momX(t) + 34 * shuffle;
  const w = walk(t * 1.5, 0.32 * (1 - arrive) + 0.12 * (shuffle > 0 ? 1 : 0));
  const point = Math.sin(Math.PI * ph(t, 16.6, 16.98));
  const hug: Pt = [x + 52, -78]; // 抱在胸口下面，脸露出来
  const d: Pt = lift > 0 ? [mix(BIG_REST[0], hug[0], lift), mix(BIG_REST[1], hug[1], lift) + 3 * Math.sin(t * 20) * lift] : BIG_REST;
  const f: Fig = {
    x,
    y: 20,
    kind: "woman",
    facing: 1,
    lean: 0.45 * crouch - 0.14 * lift,
    head: -0.35 + 0.35 * point - 0.2 * crouch,
    legL: w.legL,
    legR: w.legR,
    kneeL: w.kneeL + 1.0 * crouch + 0.35 * lift,
    kneeR: w.kneeR + 0.8 * crouch + 0.3 * lift,
    hR: crouch > 0.05 || lift > 0 ? [d[0] - 12, d[1] + 2] : point > 0.02 ? [mix(x + 20, x + 62, point), mix(-90, -150, point)] : undefined,
    hL: crouch > 0.05 || lift > 0 ? [d[0] - 26, d[1] + 5] : undefined,
    rim: 0.6,
    eyes: lift > 0.4 ? "open" : undefined,
  };
  return { f, d, rot: 0.04 * lift * Math.sin(t * 9) };
}

/** 店、店主、买哑铃的人、展台上最大的那只和千斤的妈妈（已经套好镜头） */
export function shopScene(c: C, t: number) {
  dumbbellShop(c, SHOP);
  // 店主在柜台后面
  figure(c, { x: SHOP - 200, y: -10, kind: "worker", facing: 1, head: -0.1, aR: 0.9, bendR: -1.2, tone: 0.1, rim: 0.4, look: { top: "#e2a94f", bottom: "#6b5a48" }, eyes: "smile" }, t);
  // 买哑铃的人
  BUYERS.forEach((b, i) => {
    const moving = b.b > b.a;
    const p = moving ? ph(t, b.a, b.b) : 0;
    const x = mix(b.x0, b.x1, p);
    const face = b.face ?? (b.x1 < b.x0 ? -1 : 1);
    const w = walk(t * 1.5 + i * 0.37, moving && p > 0 && p < 1 ? 0.34 : 0);
    const hand: Pt = [x + face * 12, -66];
    figure(c, { x, y: 0, kind: b.kind, facing: face, lean: b.hold ? -face * 0.06 : 0, head: -0.6, legL: w.legL, legR: w.legR, kneeL: w.kneeL, kneeR: w.kneeR, hR: b.hold ? hand : undefined, aL: w.aL, tone: 0.12 + (i % 3) * 0.08, rim: 0.35, look: b.look }, t);
    if (b.hold) dumbbell(c, hand[0], hand[1] + 4, b.hold);
  });
  // 展台和最大的那只
  c.fillStyle = "#8c6a8f";
  c.fillRect(BIG_X - 95, -PLINTH, 190, PLINTH);
  c.fillStyle = "#e45f6a";
  c.fillRect(BIG_X - 95, -PLINTH, 190, 5);
  const m = momBuy(t);
  figure(c, m.f, t);
  dumbbell(c, m.d[0], m.d[1], BIG_S, m.rot);
}
