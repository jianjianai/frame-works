// 主歌一 0:15.9–0:31.9：哑铃店（千斤的妈妈买走最大的一只）→ 锁在九十八层的千斤 → 哑铃掉下天井 → 楼梯追逐 → 扑出去抓住她
import { type C, type Cam, type Shot, W, H, E, ph, kcam, kick, shake, jolt, applyCam, smearV, vignette, mix, flash, camLerp } from "./core";
import { figure, pose, rope, stone, type Fig, type Pt, walk } from "./figure";
import { ash, door, shoes, tower, crack, FLOOR, TOWER_TOP } from "./world";
import { street } from "./sets";
import { PAL } from "./palette";
import { dumbbell, dumbbellShop, padlock, chain, hand } from "./props";
import { beat, INTRO_END, qinWalking, introStreetLife } from "./intro";


// ---------- S05 15.9–17.82：哑铃店开着门，很多人在买；穿紫衣服的女人（千斤的妈妈）买走了最大的那只 ----------
const SHOP = -1950; // 哑铃店门脸中心（她住的那栋最高的楼脚下）
const BIG_S = 2.0; // 店门口展台上最大的那只
const BIG_X = SHOP + 150;
const PLINTH = 22; // 展台高
const BIG_REST: Pt = [BIG_X, -PLINTH - 17 * BIG_S];
const camS05 = (t: number) =>
  kcam(t, [
    [15.9, INTRO_END],
    [16.5, { x: SHOP + 20, y: -330, z: 1.6 }, E.io], // 往左摇到店门口：一店的人
    [17.0, { x: BIG_X - 60, y: -230, z: 2.0 }, E.io], // 落到她和那只最大的哑铃
    [17.82, { x: BIG_X + 10, y: -120, z: 3.0 }, E.out], // 她抱起来：越推越慢，推到怀里的哑铃上（下一镜在同一个位置接上，换了地方）
  ]);
/** 买哑铃的人（都低着头）：x0 → x1 走，hold 是手里哑铃的大小（0 = 空手） */
const BUYERS = [
  { x0: SHOP - 90, x1: SHOP - 470, a: 15.9, b: 17.82, hold: 0.8, kind: "man" as const, look: { top: "#8fa7c9", bottom: "#5d6a8a" } },
  { x0: SHOP - 110, x1: SHOP - 110, a: 0, b: 0, hold: 0, kind: "plain" as const, look: { top: "#c9a27a", bottom: "#6e5a4a" }, face: -1 as const }, // 在柜台前排队
  { x0: SHOP - 40, x1: SHOP - 40, a: 0, b: 0, hold: 0, kind: "worker" as const, look: { top: "#9cc4a8", bottom: "#5e7466" }, face: -1 as const },
  { x0: SHOP + 20, x1: SHOP + 560, a: 16.0, b: 17.6, hold: 0.6, kind: "plain" as const, look: { top: "#d9c9a8", bottom: "#7a6f62" } },
  { x0: SHOP + 760, x1: SHOP + 460, a: 15.9, b: 17.2, hold: 0, kind: "man" as const, look: { top: "#a9b8c4", bottom: "#5b6670" } }, // 赶来买的人
  { x0: SHOP - 200, x1: SHOP - 560, a: 16.4, b: 17.82, hold: 1.0, kind: "worker" as const, look: { top: "#c48f86", bottom: "#6a5050" } },
];
/** 千斤的妈妈：走到展台前，指着最大的那只；蹲下去抱起来（很沉，膝盖一直弯着），抱在怀里一步一步往外挪 */
function momBuy(t: number): { f: Fig; d: Pt; rot: number } {
  const arrive = E.out(ph(t, 16.2, 16.8));
  const crouch = E.io(ph(t, 16.95, 17.15)) * (1 - E.io(ph(t, 17.15, 17.45)) * 0.6);
  const lift = E.io(ph(t, 17.12, 17.45));
  const shuffle = ph(t, 17.45, 17.82);
  const x = mix(BIG_X - 330, BIG_X - 62, arrive) + 34 * shuffle;
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
const s05: Shot = {
  a: 15.9,
  b: 17.82,
  draw(c, t) {
    const k = camS05(t);
    street(c, k, t, {});
    c.save();
    applyCam(c, k);
    c.save();
    c.translate(-2050, 0);
    tower(c, {});
    c.restore();
    dumbbellShop(c, SHOP);
    // 店主在柜台后面
    figure(c, { x: SHOP - 200, y: -10, kind: "worker", facing: 1, head: -0.1, aR: 0.9, bendR: -1.2, tone: 0.1, rim: 0.4, look: { top: "#e2a94f", bottom: "#6b5a48" }, eyes: "smile" }, t);
    // 前奏的街接过来：街上的人还在，她接着往前走；镜头往左摇走，把他们留在画外
    if (t < 16.6) {
      // 镜头摇走以后他们都在画外，不再画（免得打伞的路人又走进最后的近景）
      introStreetLife(c, t);
      figure(c, qinWalking(t), t);
    }
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
    c.restore();
    ash(c, t, k, { n: 0.5 });
    vignette(c, 0.4);
  },
};

// ---------- 千斤：穿红衣服的女孩，飘在自己家门口的半空里，脚踝上一根红线拴在路边的铁桩上 ----------
// 和哑铃店不是一个地方：她家在城另一头一条安静的小街上（世界坐标往右挪 HOME_OFF）。
// 换地方用匹配剪辑：上一镜推到妈妈怀里的哑铃上，这一镜同一只哑铃在画面同一个位置、同样大小，她还在往前挪，镜头退开才看出已经到了家门口
const HOME_OFF = 6300;
const POST_X = BIG_X + 140 + HOME_OFF; // 路边的铁桩
const HOME_DOOR = POST_X + 170; // 她家的门，门口还摆着爸爸的一双空鞋
const POST_H = 58;
/** 千斤家门口（导歌一「妄想用它拯救你」在这里把砖给她） */
export const HOME = { post: POST_X, postH: POST_H, door: HOME_DOOR };
const GIRL_X = POST_X + 40;
const GIRL_HIGH = -760; // 飘着时胯的高度
export const GIRL_LOOK = { top: "#e0524a", bottom: "#8a3d4a", legs: "#5d4c6a" };
const T_HAUL0 = 19.0; // 妈妈抓住红线，一把一把往下拽
const T_HAUL1 = 19.9;
const T_LOCK = 20.013; // 铁链锁上脚踝，「咔」
const T_UNTIE = 20.2; // 解开红线
const T_SINK = 20.62; // 哑铃坠着她落到地上
const T_GIVE0 = 20.6; // 妈妈把哑铃抱起来放进她怀里
const T_GIVE1 = 21.15;
const T_LEAVE = 21.2;
const MOM0 = BIG_X - 28 + HOME_OFF; // 和上一镜结尾她在画面上的位置一样
const MOM_STAND = POST_X - 95;
const DB_GROUND: Pt = [POST_X - 52, 20 - 17 * BIG_S];
/** 千斤的胯的高度 */
function girlY(t: number) {
  const bob = Math.sin(t * 1.1) * 8;
  if (t < T_HAUL0) return GIRL_HIGH + bob;
  const haul = E.io(ph(t, T_HAUL0, T_HAUL1));
  const low = -250;
  if (t < T_UNTIE) return mix(GIRL_HIGH, low, haul) + bob * (1 - haul) - 10 * Math.sin(Math.PI * ph(t, T_HAUL1, T_UNTIE));
  // 红线一松，哑铃坠着她往下落（越落越快），落地一沉
  const s = ph(t, T_UNTIE, T_SINK);
  return mix(low, 20 - 98, s * s);
}
function girlFig(t: number): Fig {
  const y = girlY(t);
  if (t < T_SINK) {
    const fl = 0.85 * (1 - 0.6 * ph(t, T_HAUL0, T_UNTIE));
    return { x: GIRL_X + Math.sin(t * 0.8) * 12 * (1 - ph(t, T_HAUL0, T_HAUL1)), y, grounded: false, kind: "girl", facing: -1, float: fl, aL: -1.9 + Math.sin(t * 1.3) * 0.2, aR: 1.8 + Math.sin(t * 1.1) * 0.2, head: t < T_HAUL0 ? 0.6 : mix(0.6, -0.4, ph(t, T_HAUL0, 19.4)), eyes: t < T_HAUL0 ? "closed" : "wide", rim: 0.6, look: GIRL_LOOK };
  }
  // 站在地上：接过哑铃，抱在怀里，膝盖一弯；看着妈妈走远，低头看怀里的哑铃，再抬头看天——
  // 脚跟慢慢离地，抱着哑铃又飘了起来（哑铃也压不住她）
  const take = E.io(ph(t, T_GIVE0 + 0.3, T_GIVE1));
  const land = kick(t, T_SINK, 0.12);
  const down = win6(t, 21.95, 22.2, 22.3, 22.45);
  const up = E.io(ph(t, 22.35, 22.8));
  const tip = E.io(ph(t, 22.7, T_RISE));
  const h = riseH(t);
  const hug: Pt = [GIRL_X - 32, -70 - h];
  return {
    x: GIRL_X + Math.sin(t * 0.8) * 6 * ph(t, T_RISE, 23.94),
    y: 20 - h,
    kind: "girl",
    facing: -1,
    lean: -0.1 * take + 0.08 * land - 0.06 * up,
    kneeL: (0.5 * land + 0.45 * take) * (1 - tip) + 0.25 * tip,
    kneeR: (0.4 * land + 0.4 * take) * (1 - tip) + 0.4 * tip,
    float: 0.75 * tip,
    hL: take > 0.02 ? lerpPt([GIRL_X - 20, -70], [hug[0] + 8, hug[1] + 4], take) : undefined,
    hR: take > 0.02 ? lerpPt([GIRL_X - 10, -60], [hug[0] + 22, hug[1] + 2], take) : undefined,
    head: -0.4 + 0.4 * take - 0.5 * down + 1.0 * up,
    eyes: t > T_RISE ? "closed" : "open",
    tears: t > 21.5 ? 1 : 0,
    rim: 0.6,
    look: GIRL_LOOK,
  };
}
const T_RISE = 23.013; // 脚离地（卡拍）
/** 妈妈走了以后她飘起来的高度：先慢后快 */
const riseH = (t: number) => {
  const s = Math.max(0, t - T_RISE);
  return 60 * s + 300 * s * s;
};
const win6 = (t: number, a: number, b: number, c: number, d: number) => E.io(ph(t, a, b)) * (1 - E.io(ph(t, c, d)));
const lerpPt = (a: Pt, b: Pt, e: number): Pt => [mix(a[0], b[0], e), mix(a[1], b[1], e)];
/** 妈妈：抱着哑铃挪到铁桩边放下 → 抬头看女儿 → 抓住红线一把一把往下拽 → 铁链锁上她的脚踝 → 解开红线 → 把哑铃抱起来放进她怀里 → 转身走了 */
function momTether(t: number): { f: Fig; d: Pt } {
  const walkTo = E.io(ph(t, 17.82, 18.3));
  const setDown = E.io(ph(t, 18.3, 18.55));
  const toLock = E.io(ph(t, 19.85, 20.0)) * (1 - E.io(ph(t, 20.12, 20.3)));
  const leave = ph(t, T_LEAVE, 22.5);
  let x = mix(MOM0, MOM_STAND, walkTo) + 50 * toLock;
  if (t > T_GIVE0) x = mix(MOM_STAND, MOM_STAND + 40, E.io(ph(t, T_GIVE0 + 0.2, T_GIVE1))) - 300 * E.in2(leave);
  const w = walk(t * 1.5, (walkTo > 0 && walkTo < 1 ? 0.14 : 0) + (leave > 0 ? 0.36 : 0));
  // 哑铃的位置
  const carry: Pt = [MOM0 + 52 + (MOM_STAND - MOM0) * walkTo, -78];
  const pick = E.io(ph(t, T_GIVE0, T_GIVE0 + 0.25));
  const give = E.io(ph(t, T_GIVE0 + 0.25, T_GIVE1));
  let d: Pt = lerpPt(carry, DB_GROUND, setDown);
  if (t > T_GIVE0) d = lerpPt(lerpPt(DB_GROUND, [MOM_STAND + 70, -80], pick), [GIRL_X - 32, -70], give);
  if (t > T_GIVE1) d = [GIRL_X - 32 + Math.sin(t * 0.8) * 6 * ph(t, T_RISE, 23.94), -70 - riseH(t)];
  const hauling = t > T_HAUL0 - 0.1 && t < T_HAUL1;
  const pull = Math.sin((t - T_HAUL0) * Math.PI * 4); // 一把一把
  const gj = pose(girlFig(t));
  let hL: Pt | undefined;
  let hR: Pt | undefined;
  if (t < 18.55 || (t > T_GIVE0 && t < T_GIVE1)) {
    hR = [d[0] - 12, d[1] + 2];
    hL = [d[0] - 26, d[1] + 5];
  } else if (hauling) {
    hR = [x + 30, -150 - 30 * pull];
    hL = [x + 34, -110 + 30 * pull];
  } else if (toLock > 0.05) {
    hR = [gj.anR[0] - 4, gj.anR[1] + 6];
    hL = [gj.anR[0] - 12, gj.anR[1] + 14];
  } else if (t > T_UNTIE - 0.05 && t < T_UNTIE + 0.35) hR = [POST_X - 6, -POST_H + 2];
  const lookUp = E.io(ph(t, 18.45, 18.8)) * (1 - E.io(ph(t, 19.3, 19.7)));
  const crouch = E.io(ph(t, 18.3, 18.45)) * (1 - E.io(ph(t, 18.45, 18.6))) + pick * (1 - give);
  const f: Fig = {
    x,
    y: 20,
    kind: "woman",
    facing: leave > 0.05 ? -1 : 1,
    lean: 0.4 * crouch - (hauling ? 0.18 : 0),
    head: -0.3 + 0.9 * lookUp,
    legL: w.legL,
    legR: w.legR,
    kneeL: w.kneeL + 0.9 * crouch + (hauling ? 0.3 : 0) + (t < 18.3 ? 0.35 : 0),
    kneeR: w.kneeR + 0.8 * crouch + (hauling ? 0.25 : 0) + (t < 18.3 ? 0.3 : 0),
    hL: leave > 0.05 ? undefined : hL,
    hR: leave > 0.05 ? undefined : hR,
    rim: 0.6,
    eyes: "open",
  };
  return { f, d };
}
function tether(c: C, t: number) {
  // 铁桩
  c.fillStyle = "#5d5a72";
  c.fillRect(POST_X - 9, -POST_H, 18, POST_H);
  c.fillStyle = "#7c7894";
  c.fillRect(POST_X - 12, -POST_H - 6, 24, 8);
  const gj = pose(girlFig(t));
  // 红线：铁桩 → （妈妈拽着时经过她的手）→ 她的脚踝；解开以后松下去、从桩上滑走
  if (t < T_UNTIE + 0.35) {
    const loose = ph(t, T_UNTIE, T_UNTIE + 0.35);
    const top: Pt = [POST_X, -POST_H];
    if (t > T_HAUL0 - 0.1 && t < T_HAUL1) {
      const m = pose(momTether(t).f);
      rope(c, top, m.handL, -6, 3);
      rope(c, m.handR, gj.anR, 10, 3);
    } else rope(c, [top[0] + 30 * loose, top[1] + 40 * loose], gj.anR, 20 + 120 * loose, 3);
  }
}
function chainToAnkle(c: C, t: number, d: Pt) {
  if (t < T_LOCK - 0.1) return;
  const gj = pose(girlFig(t));
  const end: Pt = [d[0] + 40 * BIG_S * (gj.anR[0] > d[0] ? 1 : -1) * 0.95, d[1]];
  chain(c, end, [gj.anR[0], gj.anR[1] + 4], 12, 0.7);
  padlock(c, gj.anR[0] + 2, gj.anR[1] + 14, 0.32, Math.max(0, 1 - E.out(ph(t, T_LOCK - 0.12, T_LOCK))));
}

// ---------- S06 17.82–23.94：她抬头——女儿飘在半空，一根红线牵在地上；她把女儿拽下来，换成哑铃和铁链锁上，把哑铃放进她怀里；
// 妈妈走了，镜头留给千斤（情绪运镜）：看着妈妈的背影 → 低头看怀里的哑铃 → 抬头看天，镜头屏着气慢慢推近她的脸、四周暗下来；
// 23.013 脚离地，她抱着哑铃又飘了起来——镜头往后、往上退，越退越远（孤独），门口爸爸的空鞋留在画面底下 ----------
const camS06 = (t: number) =>
  kcam(t, [
    [17.82, { x: BIG_X + 10 + HOME_OFF, y: -120, z: 3.0 }], // 和上一镜最后一帧同一个取景（哑铃在同一个位置）
    [18.05, { x: BIG_X + 20 + HOME_OFF, y: -150, z: 2.6 }, E.out], // 退开：已经在家门口
    [18.3, { x: POST_X - 60, y: -190, z: 2.3 }, E.io],
    [18.95, { x: POST_X + 15, y: -690, z: 2.0 }, E.io], // 顺着红线抬上去：穿红衣服的女孩飘在半空
    [19.9, { x: POST_X - 30, y: -250, z: 2.2 }, E.io], // 跟着她被一把一把拽下来
    [20.65, { x: POST_X - 25, y: -170, z: 2.4 }, E.io],
    [21.84, { x: GIRL_X - 20, y: -150, z: 3.0 }, E.out], // 妈妈走了，推近她
    [22.9, { x: GIRL_X - 12, y: -165, z: 3.5 }, E.io], // 心酸：几乎不动，极慢地凑近她的脸
    [23.013, { x: GIRL_X - 12, y: -160, z: 3.45 }, E.io], // 脚离地的一下：镜头一顿
    [23.94, { x: GIRL_X + 40, y: -430, z: 1.7 }, E.io], // 她飘起来：往后、往上退，越退越远，爸爸的空鞋在画面底下
  ]);
const s06: Shot = {
  a: 17.82,
  b: 23.94,
  xin: 0.3, // 匹配剪辑上叠一点溶解：同一只哑铃，背景从店换成她家门口
  draw(c, t) {
    const k = jolt(camS06(t), shake(t, 9 * kick(t, T_SINK, 0.12) + 4 * kick(t, T_LOCK, 0.08), 3));
    street(c, k, t, {});
    c.save();
    applyCam(c, k);
    c.save();
    c.translate(-2050, 0);
    tower(c, {});
    c.restore();
    // 她家门口：门、门口爸爸的一双空鞋（他去年冬天上去了）
    door(c, HOME_DOOR, 0, { open: 0, w: 120, h: 240 });
    shoes(c, HOME_DOOR + 78, 0, 1, 1.1, "#5b7fc1");
    tether(c, t);
    const m = momTether(t);
    const giving = t > T_GIVE0;
    if (!giving) dumbbell(c, m.d[0], m.d[1], BIG_S, 0);
    figure(c, girlFig(t), t);
    figure(c, m.f, t);
    if (giving) dumbbell(c, m.d[0], m.d[1], BIG_S, 0.03 * Math.sin(t * 9) * (1 - ph(t, T_GIVE1, 21.5)));
    chainToAnkle(c, t, m.d);
    c.restore();
    ash(c, t, k, { n: 0.5 });
    // 她飘起来时，头顶的白光压下来
    const glow = E.io(ph(t, 22.8, 23.94));
    if (glow > 0.01) {
      const g = c.createLinearGradient(0, 0, 0, H * 0.7);
      g.addColorStop(0, `rgba(255,250,240,${0.55 * glow})`);
      g.addColorStop(1, "rgba(255,250,240,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    vignette(c, 0.4 + 0.18 * win6(t, 21.9, 22.8, 23.1, 23.6));
  },
};

// ---------- 高空：全城最高那栋楼（她住在楼顶）和旁边矮一点的楼，千斤在两栋楼中间的缝里往上飘 ----------
// 世界坐标：最高那栋楼在 x=0（楼顶 TOWER_TOP），旁边的楼 B 在 x 720–1500；千斤在 x≈615 的楼缝里
const ROOF = TOWER_TOP - 12; // 她站在楼顶上的脚底
const B_X0 = 720;
const B_X1 = 1500;
const GX = 615;
const T_PICK = 24.55; // 拔下发卡，捅锁
const T_OPEN = 25.013; // 锁开了
const T_REL = 25.1; // 松手：哑铃掉下去
const T_HIT = 25.77; // 哑铃砸到地上
const T_LEAP = 27.78; // 她从楼顶跳下去
const GH_REL = -8250; // 松手时千斤的胯
const QH0 = ROOF - 96; // 楼顶上她的胯
const QX_EDGE = 470;
/** 千斤的胯的高度：抱着哑铃时慢慢升；松手以后越升越快（到每秒 200） */
function gHip(t: number) {
  if (t < T_REL) return GH_REL + 40 * (T_REL - t);
  const s = t - T_REL;
  return GH_REL - (s < 0.667 ? 40 * s + 120 * s * s : 80 + 200 * (s - 0.667));
}
/** 她往下跳：自由落体，两个人的胯一样高的那一刻抓住 */
const qDive = (t: number) => QH0 + 1350 * Math.max(0, t - T_LEAP) ** 2;
const T_CATCH = (() => {
  let s = T_LEAP;
  while (qDive(s) < gHip(s) && s < T_LEAP + 2) s += 0.0005;
  return s;
})();
const CATCH_Y = gHip(T_CATCH);
const CATCH_X = GX - 30;
const QVX = (CATCH_X - QX_EDGE) / (T_CATCH - T_LEAP);
// 抓住以后：她重、千斤轻，两个人一起往下坠，很快被千斤的「轻」托住，变成慢慢往下飘（最沉的人和最轻的人抵消了）
const V_PAIR0 = (3 * 2700 * (T_CATCH - T_LEAP) - 200) / 4;
const V_DRIFT = 55;
const TAU = 0.18;
const T_LAND2 = 30.1;
const pairDrop = (s: number) => V_DRIFT * s + (V_PAIR0 - V_DRIFT) * TAU * (1 - Math.exp(-s / TAU));
export const HIGH_RB = CATCH_Y + pairDrop(T_LAND2 - T_CATCH) + 96; // 楼 B 的楼顶（两个人正好落在这里）
const LAND_X = 880;
export const HIGH_SIT = { girl: LAND_X + 50, qin: LAND_X - 75 }; // 落地以后：千斤坐着，她跪在旁边（导歌一接着用）
const pairHip = (t: number): Pt => [mix(CATCH_X, LAND_X, E.io(ph(t, T_CATCH, T_LAND2))), CATCH_Y + pairDrop(Math.min(t, T_LAND2) - T_CATCH)];

/** 两栋楼、天、白、城、街 */
export function highSet(c: C, k: Cam, t: number, o: { street?: boolean } = {}) {
  if (o.street !== false) street(c, k, t, {});
  c.save();
  applyCam(c, k);
  tower(c, { qinWindow: 0.6 });
  const RB = HIGH_RB;
  c.fillStyle = "#e3b9a6";
  c.fillRect(B_X0, RB, B_X1 - B_X0, -RB);
  c.fillStyle = "#f3d6c8";
  c.fillRect(B_X0 - 10, RB - 12, B_X1 - B_X0 + 20, 14);
  c.fillStyle = "#b98f86";
  for (let r = 0; r < 28; r++) for (let q = 0; q < 4; q++) c.fillRect(B_X0 + 70 + q * 180, RB + 90 + r * FLOOR, 60, 110);
  // 楼 B 楼顶上的小门房
  c.fillStyle = "#c99d8c";
  c.fillRect(1260, RB - 150, 160, 150);
  c.fillStyle = PAL.woodDark;
  c.fillRect(1300, RB - 110, 60, 110);
  c.restore();
}

/** 千斤（高空） */
function girlHigh(t: number): Fig {
  const L = { look: GIRL_LOOK, kind: "girl" as const, rim: 0.6 };
  if (t >= T_LAND2) {
    // 落在楼 B 的楼顶上：坐在她身边，靠在她肩上哭；她还轻，身子总往上浮一点，被她搂住
    const slide = E.io(ph(t, T_LAND2, T_LAND2 + 0.35));
    const x = mix(LAND_X + 36, HIGH_SIT.qin + 72, slide);
    const lift = 10 * Math.sin((t - T_LAND2) * 2.2) ** 2;
    const y = HIGH_RB - 20 - lift;
    return { ...L, x, y, grounded: false, facing: -1, float: 0.55, legL: 1.2, kneeL: 1.6, legR: 1.0, kneeR: 1.5, lean: -0.42 * slide, head: -0.35, hL: [HIGH_SIT.qin + 24, HIGH_RB - 112], hR: [HIGH_SIT.qin + 34, HIGH_RB - 98], eyes: "closed", tears: 1 };
  }
  if (t >= T_CATCH) {
    // 被她抱住：两手搂着她的脖子，脸埋在她肩上
    const p = pairHip(t);
    return { ...L, x: p[0] + 36, y: p[1] - 6, grounded: false, facing: -1, float: 0.7, lean: -0.2, head: -0.15, hL: [p[0] + 4, p[1] - 70], hR: [p[0] + 12, p[1] - 58], legL: 0.1, legR: -0.1, kneeL: 0.4, kneeR: 0.6, eyes: "closed", tears: 1 };
  }
  const y = gHip(t);
  if (t >= T_REL) {
    // 松了手：张开手往上飘，闭着眼；看见她扑下来，睁大眼睛
    const see = t > T_LEAP + 0.1;
    return { ...L, x: GX + Math.sin(t * 0.9) * 8, y, grounded: false, facing: -1, float: 0.9, aL: -2.2 + Math.sin(t * 1.3) * 0.15, aR: 2.2 + Math.sin(t * 1.1) * 0.15, head: see ? 0.5 : 0.7, eyes: see ? "wide" : "closed", tears: 1 };
  }
  // 抱着哑铃往上飘：低头看城 → 抬头看白 → 拔下发卡，膝盖收上来，捅脚踝上的锁
  const down = win6(t, 23.95, 24.15, 24.25, 24.4);
  const up = win6(t, 24.25, 24.45, 24.5, 24.65);
  const curl = E.io(ph(t, 24.5, 24.75));
  const f: Fig = { ...L, x: GX, y, grounded: false, facing: -1, float: 0.75, legL: -0.1 * curl, legR: mix(0.05, -1.25, curl), kneeL: 0.3, kneeR: mix(0.4, 1.7, curl), head: -0.2 - 0.6 * down + 0.9 * up - 0.4 * curl, eyes: "open", tears: 1 };
  const j = pose(f);
  return { ...f, hL: [GX - 30, y - 22], hR: t > T_PICK ? [j.anR[0] - 2, j.anR[1] - 6] : t > 24.4 ? lerpPt([GX - 20, y - 40], [j.head[0], j.top + 6], E.io(ph(t, 24.4, T_PICK))) : [GX - 18, y - 18] };
}
/** 她（高空）：在楼顶边上往下看 → 退两步 → 冲到边上 → 跳下去 → 抱住千斤一起往下飘 → 落在楼 B 楼顶，跪在她旁边 */
function qinHigh(t: number): Fig {
  const L = { kind: "qin" as const, rim: 0.8 };
  if (t >= T_LAND2) {
    // 跪在她旁边，把她搂住（她还在往上浮），低头看着她
    const kneel = E.io(ph(t, T_LAND2, T_LAND2 + 0.35));
    const x = mix(LAND_X, HIGH_SIT.qin, kneel);
    const gj = pose(girlHigh(t));
    return { ...L, x, y: HIGH_RB, facing: 1, legL: mix(0.1, 1.3, kneel), kneeL: mix(0.6, 1.7, kneel), legR: mix(-0.1, 1.1, kneel), kneeR: mix(0.5, 1.5, kneel), lean: 0.1, head: -0.4, hR: [gj.neck[0] + 10, gj.neck[1] + 10], hL: [gj.hip[0] - 6, gj.hip[1] - 22], eyes: "open" };
  }
  if (t >= T_CATCH) {
    const p = pairHip(t);
    const gj = pose(girlHigh(t));
    const brace = E.io(ph(t, T_LAND2 - 0.3, T_LAND2));
    return { ...L, x: p[0], y: p[1], grounded: false, facing: 1, float: 0.5 * (1 - brace), lean: 0.1, hL: [gj.neck[0] + 6, gj.neck[1] + 6], hR: [gj.hip[0] + 4, gj.hip[1] - 26], legL: mix(-0.3, 0.05, brace), legR: mix(0.35, -0.05, brace), kneeL: mix(0.7, 0.3, brace), kneeR: mix(0.4, 0.2, brace), head: -0.45, eyes: "closed" };
  }
  if (t >= T_LEAP) {
    // 扑下去：身子前倾，两手伸向她
    const s = t - T_LEAP;
    const x = QX_EDGE + QVX * s;
    const gj = pose(girlHigh(t));
    const reach = E.out(ph(t, T_LEAP, T_CATCH));
    return { ...L, x, y: qDive(t), grounded: false, facing: 1, float: 0.6, lean: 0.55, hL: lerpPt([x + 40, qDive(t) - 120], [gj.hip[0] - 6, gj.hip[1] - 40], reach), hR: lerpPt([x + 50, qDive(t) - 100], [gj.hip[0] - 2, gj.hip[1] - 20], reach), legL: -0.9, legR: -0.5, kneeL: 1.0, kneeR: 0.6, head: 0.2, eyes: "wide" };
  }
  // 楼顶上：趴在边上往下看 → 退两步 → 冲过去 → 一蹲
  const back = E.io(ph(t, 26.95, 27.25));
  const run = E.in2(ph(t, 27.3, 27.62));
  const x = mix(mix(QX_EDGE - 60, QX_EDGE - 170, back), QX_EDGE, run);
  const crouch = E.io(ph(t, 27.6, T_LEAP));
  const peer = 1 - back;
  const w = walk(t * 2.4, back > 0 && back < 1 ? 0.3 : run > 0 && run < 1 ? 0.6 : 0);
  return { ...L, x, y: ROOF, facing: 1, lean: 0.35 * peer + 0.3 * run * (1 - crouch) + 0.25 * crouch, head: -0.9 * peer + 0.3 * (1 - peer), legL: w.legL - 0.3 * crouch, legR: w.legR + 0.2 * crouch, kneeL: w.kneeL + 1.0 * crouch, kneeR: w.kneeR + 0.8 * crouch, aL: 0.6 * crouch, aR: -0.5 * crouch, eyes: "wide" };
}
/** 哑铃：抱在她怀里 → 松手，掉进楼缝，砸在街上 */
function dumbbellHigh(t: number): { p: Pt; rot: number } | null {
  const held: Pt = [GX - 30, gHip(Math.min(t, T_REL)) - 18];
  if (t < T_REL) return { p: held, rot: 0 };
  if (t < T_HIT) return { p: [held[0], mix(held[1], -17 * BIG_S, E.in2(ph(t, T_REL, T_HIT)))], rot: (t - T_REL) * 5 };
  return { p: [held[0], -17 * BIG_S + 6], rot: 0.15 };
}
function drawHigh(c: C, t: number) {
  const d = dumbbellHigh(t);
  // 抱住以后千斤画在前面（脸贴在她肩上看得见）
  const hugging = t >= T_CATCH;
  if (hugging) figure(c, qinHigh(t), t);
  const gj = figure(c, girlHigh(t), t);
  if (d) dumbbell(c, d.p[0], d.p[1], BIG_S, d.rot);
  // 铁链和锁：锁开之前连着脚踝和哑铃；锁开了，链子从脚踝上滑下去，跟着哑铃掉
  if (d && t < T_HIT) {
    const open = t > T_OPEN;
    const end: Pt = open ? [d.p[0] + 50, d.p[1] + 60 + 300 * E.in2(ph(t, T_OPEN, T_REL + 0.2))] : [gj.anR[0], gj.anR[1] + 4];
    chain(c, [d.p[0] + 70, d.p[1]], end, 14, 0.7);
    padlock(c, end[0] + 2, end[1] + 12, 0.32, open ? 1 : 0);
  }
  // 发卡（黄的）
  if (t > T_PICK - 0.15 && t < T_REL) {
    const h = gj.handR;
    c.strokeStyle = "#f2c64a";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(h[0], h[1]);
    c.lineTo(h[0] - 10, h[1] + 12);
    c.stroke();
  }
  // 脚踝上被锁磨红的印子
  if (t > T_OPEN) {
    c.strokeStyle = "rgba(190,70,60,0.85)";
    c.lineWidth = 2.5;
    c.beginPath();
    c.ellipse(gj.anR[0], gj.anR[1] - 3, 6, 2.5, 0, 0, Math.PI * 2);
    c.stroke();
  }
  if (!hugging) figure(c, qinHigh(t), t);

  // 哑铃砸到地上：裂纹和一圈灰
  if (t > T_HIT) {
    crack(c, GX - 30, 0, 160, ph(t, T_HIT, T_HIT + 0.2));
    const u = t - T_HIT;
    c.fillStyle = `rgba(245,232,236,${0.85 * Math.exp(-u * 2)})`;
    for (let i = 0; i < 16; i++) {
      c.beginPath();
      c.arc(GX - 30 + Math.cos(i * 1.3) * u * 300, -10 - Math.abs(Math.sin(i * 1.7)) * u * 200, 20 + u * 34, 0, Math.PI * 2);
      c.fill();
    }
  }
}
const aimAt = (p: Pt, s: Pt, z: number): Cam => ({ x: p[0] - (s[0] - W / 2) / z, y: p[1] - (s[1] - H / 2) / z, z });
const toScr = (k: Cam, p: Pt): Pt => [(p[0] - k.x) * k.z + W / 2, (p[1] - k.y) * k.z + H / 2];

// ---------- S07 23.94–25.77：高空。她已经飘得很高了，在两栋楼中间；情绪运镜：低头看城、抬头看白，拔下发卡捅开锁，松手——哑铃掉下去，镜头追着它砸到街上 ----------
// 换场：匹配溶解——千斤在画面同一个位置、同样大小，背景从家门口换成高空
const MATCH_S: Pt = (() => {
  const k = camS06(23.94);
  const j = pose(girlFig(23.94));
  return toScr(k, j.hip);
})();
function camS07(t: number): Cam {
  const hip = (tt: number): Pt => [GX, gHip(tt)];
  const k0 = aimAt(hip(23.94), MATCH_S, 0.95); // 溶进来时更远：头顶就是白，旁边是两栋楼的楼顶——已经飘得很高了
  const k1 = aimAt(hip(24.5), [540, 980], 2.5); // 屏着气慢慢凑近她
  const lock = (): Pt => {
    const j = pose(girlHigh(24.95));
    return j.anR;
  };
  const k2 = aimAt(lock(), [540, 1060], 3.7); // 决绝：直直地落到锁上
  let k: Cam;
  if (t < 24.5) k = camLerp(k0, k1, E.io(ph(t, 23.94, 24.5)));
  else if (t < 24.95) k = camLerp(k1, k2, E.out(ph(t, 24.5, 24.95)));
  else k = { ...k2, z: k2.z * (1 + 0.012 * kick(t, T_OPEN, 0.12)) }; // 锁开的一下：一顿
  // 松手以后：镜头追着哑铃往下掉，越拉越远，砸地前落定
  const chase = E.io(ph(t, 25.15, 25.32));
  if (chase > 0) {
    const d = dumbbellHigh(t)!;
    const e = ph(t, T_REL, T_HIT);
    const z = Math.exp(mix(Math.log(3.2), Math.log(1.5), Math.sin(Math.PI * Math.min(1, e * 1.1)) * 0.9 + 0.1 * e));
    k = camLerp(k, aimAt(d.p, [540, mix(1000, 1180, e)], z), chase);
  }
  return k;
}
const s07: Shot = {
  a: 23.94,
  b: 25.77,
  xin: 0.35,
  draw(c, t) {
    const k = camS07(t);
    const v = Math.abs((k.y - camS07(t - 1 / 60).y) * k.z);
    smearV(c, t > 25.2 ? v * 0.6 : 0, (c) => {
      highSet(c, k, t);
      c.save();
      applyCam(c, k);
      drawHigh(c, t);
      c.restore();
    });
    ash(c, t, k, { n: 0.45 });
    // 头顶的白光
    const g = c.createLinearGradient(0, 0, 0, H * 0.6);
    g.addColorStop(0, `rgba(255,250,240,${0.45 * (1 - ph(t, 25.15, 25.5))})`);
    g.addColorStop(1, "rgba(255,250,240,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    vignette(c, 0.45 + 0.1 * win6(t, 24.4, 24.8, 25.05, 25.3));
    flash(c, 0.18 * kick(t, T_OPEN, 0.08));
  },
};

// ---------- S08 25.77–31.92：一镜：哑铃砸地 → 镜头顺着楼缝甩上去，掠过往上飘的千斤，落到楼顶上的她 → 她从楼顶跳下去，在空中抱住她 →
// 两个人慢慢往下飘（最沉的人抱着最轻的人），镜头先推近、再退远看两栋楼和天上的白 → 30.1 落在旁边楼的楼顶上，她搂着千斤（砖到导歌一「妄想用它拯救你」才给） ----------
function camS08(t: number): Cam {
  const impact: Cam = { x: GX - 30, y: -170, z: 2.0 };
  const peerCam = (tt: number): Cam => ({ x: 520, y: mix(QH0, gHip(tt), 0.5) - 20, z: 1.45 });
  if (t < 26.0) return impact;
  if (t < 26.6) return camLerp(impact, peerCam(26.6), E.io(ph(t, 26.0, 26.6))); // 甩上去
  if (t < T_LEAP) {
    const k = peerCam(t);
    return { ...k, z: k.z * (1 + 0.12 * E.io(ph(t, 26.6, T_LEAP))) }; // 慢慢逼近：她在上，千斤在下
  }
  const s = t - 0.05;
  const mid: Pt = s < T_CATCH ? lerpPt(pose(qinHigh(s)).hip, pose(girlHigh(s)).hip, 0.5) : pairHip(s);
  const follow: Cam = { x: mid[0], y: mid[1] - 30, z: 1.8 };
  let k = camLerp({ ...peerCam(T_LEAP), z: peerCam(T_LEAP).z * 1.12 }, follow, E.io(ph(t, T_LEAP, T_LEAP + 0.25)));
  // 抱住以后：推近两个人
  k = { ...k, z: k.z * Math.exp(Math.log(1.45) * E.out(ph(t, T_CATCH, 28.9))) };
  // 「请你等等我」第二遍：退远，两栋楼和白里，两个小小的人慢慢往下飘
  const wide: Cam = { x: mid[0] + 60, y: mid[1] - 220, z: 0.85 };
  k = camLerp(k, wide, win6(t, 28.9, 29.45, 29.65, T_LAND2 - 0.1));
  // 落在楼顶：镜头跟着落定
  // 落在楼顶：镜头落定在两个人身上，再慢慢推近（她搂着她，越推越慢）
  const sitA: Cam = { x: HIGH_SIT.qin + 40, y: HIGH_RB - 90, z: 2.4 };
  const sitB: Cam = { x: HIGH_SIT.qin + 45, y: HIGH_RB - 85, z: 3.1 };
  const sit = camLerp(sitA, sitB, E.out(ph(t, 30.5, 31.92)));
  return camLerp(k, sit, E.io(ph(t, T_LAND2 - 0.3, 30.5)));
}
const s08: Shot = {
  a: 25.77,
  b: 31.92,
  draw(c, t) {
    const k0 = camS08(t);
    const k = jolt(k0, shake(t, 18 * kick(t, T_HIT, 0.14) + 8 * kick(t, T_CATCH, 0.1) + 4 * kick(t, T_LAND2, 0.1), 4));
    const v = Math.abs((k0.y - camS08(t - 1 / 60).y) * k0.z);
    smearV(c, t > 26.0 && t < 26.7 ? v * 0.6 : 0, (c) => {
      highSet(c, k, t);
      c.save();
      applyCam(c, k);
      drawHigh(c, t);
      c.restore();
    });
    ash(c, t, k, { n: 0.5 });
    const glow = 0.4 * win6(t, 26.3, 26.7, 31.3, 31.9);
    if (glow > 0.01) {
      const g = c.createLinearGradient(0, 0, 0, H * 0.6);
      g.addColorStop(0, `rgba(255,250,240,${glow})`);
      g.addColorStop(1, "rgba(255,250,240,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    // 抱住的那一下，和往下飘的时候：暖光
    const warm = win6(t, T_CATCH, T_CATCH + 0.5, 31.6, 31.92);
    if (warm > 0.01) {
      const p = toScr(k, pairHip(Math.min(t, T_LAND2)));
      const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], 520);
      g.addColorStop(0, `rgba(${PAL.warmRGB},${0.25 * warm})`);
      g.addColorStop(1, `rgba(${PAL.warmRGB},0)`);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    vignette(c, 0.4);
    flash(c, 0.2 * kick(t, T_CATCH, 0.1));
  },
};

export const verse1Shots: Shot[] = [s05, s06, s07, s08];
void H;
