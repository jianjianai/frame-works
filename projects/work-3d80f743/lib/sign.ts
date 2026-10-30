// 副歌一⑧「邦」一直拖着的这 4 秒（60.02–64.02；小节线 60.021、62.022、64.023；62–64 是整句最响的地方）。还在十二年前：
// 天上的妈妈从外套怀里掏出一块小木牌，拿铅笔一个字一个字竖着写下「活下去」，低头看着女儿把牌子递出去，61.518 丢下来；
// 镜头跟着木牌往下掉（一边掉一边退开），62.018（小节线）「咚」砸在她的铁靴跟前，弹一下靠在靴子上。两个路人低着头走过。
// 她蹲下去捡起来抱在胸前；63.018 天上一亮——妈妈到了白里——灰像雪一样落下来，她抱着牌子仰着头，镜头慢慢推近。
// 一亮以后她就跪着抱着木牌望着天，不再做别的动作，间奏第一拍 64.013 溶到公交站（lib/grow.ts；用户 2026-10-26：「这个改成她拿着砖看天空，不做其他动作了」，
// 原来接着把木牌插进靴子、站起来迈一步）。镜头 63.3 起交给间奏，慢慢退开、顺着她的视线往上抬。
// （同一天用户又说插木牌、站起来「又太快了，需要把前面的借过来一点」：整个 ⑧ 提前一拍（SHIFT），借⑦拉开以后跟着妈妈往上漂的那 0.7 秒；
// ⑧ 里各个动作之间的间隔不变、仍然一拍一拍卡着：「活」落在「邦」开头的小节线 60.02，丢 61.013，落地 61.513，天上一亮 62.513（整句最响处的一下）。
// 以下注释里的时刻是提前以前的）
// （2026-10-26 用户：「把前面的几个镜头缩短时间给这几个镜头，但是需要对上音乐的节奏」：原来仰着头抱着牌子停到 64.04 才插、
// 再站起来走两步，65.013 才溶过去；⑧ 前面的写字、丢、落地、一亮都卡着拍子没动，只压了这一截，省下 1 秒给两次救人）

import { castJoints, passerby } from "@materials/剪纸角色/code/cast";
import { type MoveKey, type PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { seeded } from "@frame/engine/math";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, H, W, aim, camLerp, kick, ph, toScreen } from "./cam";
import { drawGlow, moteSprite, part } from "./world";
import { live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { type Walker, drawPerson, walkerAt } from "./people";
import { pose } from "./dawn";
import { HAND_FONT } from "./note";
import { KID, KID7_KEYS, KID_OPTS, KID_POSES, KID_X, MAMA, MAMA7_KEYS, MAMA_OPTS, MAMA_POSES, mamaRoot } from "./memory";

type V2 = [number, number];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const rotV = (p: V2, r: number): V2 => [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)];

/** ⑧ 整个提前一拍（借⑦最后跟着妈妈往上漂的那一截，留给最后她抱着木牌望天） */
const SHIFT = -0.5;
export const SIGN_T = {
  /** 从⑦接过来（妈妈要动之前） */
  start: 59.5,
  /** 近处的手伸进外套怀里，掏出木牌，远处的手接住 */
  pocket: 60.05 + SHIFT,
  out: 60.2 + SHIFT,
  hand: 60.42 + SHIFT,
  /** 半拍一个字：活 下 去（竖着写；「活」在「邦」开头的小节线上） */
  chars: [
    [60.518 + SHIFT, 60.72 + SHIFT],
    [60.768 + SHIFT, 60.97 + SHIFT],
    [61.018 + SHIFT, 61.24 + SHIFT],
  ] as [number, number][],
  /** 两只手捧着递出去，低头看着女儿；往下一送，丢下来 */
  show: 61.3 + SHIFT,
  toss: 61.42 + SHIFT,
  rel: beatAt(122),
  /** 「咚」砸在她的铁靴跟前 */
  land: beatAt(123),
  /** 蹲下去、捡起来、抱在胸前 */
  crouch: 62.2 + SHIFT,
  grab: 62.45 + SHIFT,
  hug: 62.75 + SHIFT,
  /** 天上一亮：妈妈到了白里（整句最响处的一下） */
  flash: beatAt(125),
  /** 镜头交给间奏（lib/grow.ts）；她这一层一直画到溶完（act3 的 drawPast：十二年前那一层都走这里） */
  end: 63.3,
};
const T = SIGN_T;

// ——— 木牌 ———
/** 竖着的一块小木板（世界里 48 × 86），字竖着写，一个字 25 */
export const BOARD = { w: 48, h: 86 };
const CHAR_Y = [-26, 0, 26];
const WORD = "活下去";
const ROWS = 3;

/** 写第 i 个字写到 u 时笔尖在木牌上的位置（木牌坐标）：来回划三行 */
function charStroke(i: number, u: number): V2 {
  const cy = CHAR_Y[i];
  const k = Math.min(ROWS - 1e-6, Math.max(0, u) * ROWS);
  const r = Math.floor(k);
  const v = k - r;
  const dir = r % 2 === 0 ? 1 : -1;
  return [dir * (-10 + 20 * v), cy - 8 + r * 8 + 2 * Math.sin(v * Math.PI * 4 + i * 1.7 + r)];
}
/** 铅笔尖在木牌上的哪（木牌坐标；没在写时 null） */
function tipAt(t: number): V2 | null {
  const C = T.chars;
  if (t < T.hand || t >= T.show) return null;
  if (t < C[0][0]) return mix([20, -46], charStroke(0, 0), E.io(ph(t, T.hand, C[0][0])));
  for (let i = 0; i < 3; i++) {
    const [a, b] = C[i];
    if (t <= b) return charStroke(i, ph(t, a, b));
    const next = i < 2 ? C[i + 1][0] : T.show;
    if (t < next) {
      const from = charStroke(i, 1);
      const to: V2 = i < 2 ? charStroke(i + 1, 0) : [26, 30];
      const u = E.io(ph(t, b, next));
      const p = mix(from, to, u);
      // 抬笔挪到下一个字：往外让一点
      return [p[0] + 6 * Math.sin(Math.PI * u), p[1]];
    }
  }
  return null;
}

/** 木牌上写出来的字：笔尖划过一行，那一行就出来；歪歪扭扭，每个字转一点 */
function drawWords(g: CanvasRenderingContext2D, t: number) {
  for (let i = 0; i < 3; i++) {
    const [a, b] = T.chars[i];
    if (t <= a) continue;
    const u = ph(t, a, b);
    const cy = CHAR_Y[i];
    g.save();
    if (u < 1) {
      const clip = new Path2D();
      const k = u * ROWS;
      const r = Math.floor(k);
      const v = k - r;
      const top = cy - 13;
      const rowH = 26 / ROWS;
      if (r > 0) clip.rect(-15, top, 30, rowH * r);
      const w = 30 * v;
      clip.rect(r % 2 === 0 ? -15 : 15 - w, top + rowH * r, w, rowH);
      g.clip(clip);
    }
    g.translate(0, cy + [1, -1, 1][i]);
    g.rotate([-0.04, 0.03, -0.02][i]);
    g.fillStyle = "#3a2c34";
    g.font = `25px ${HAND_FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(WORD[i], 0, 0);
    g.restore();
  }
}

/** 画木牌：中心 c、转 rot（弧度）；z 是镜头倍数（描边跟着人一起按 1/√z 调细） */
export function drawBoard(g: CanvasRenderingContext2D, c: V2, rot: number, t: number, z: number, alpha = 1) {
  const { w, h } = BOARD;
  const lw = 3.2 / Math.sqrt(Math.max(0.3, z));
  g.save();
  g.globalAlpha *= alpha;
  g.translate(c[0], c[1]);
  g.rotate(rot);
  const p = new Path2D();
  p.roundRect(-w / 2, -h / 2, w, h, 4);
  part(g, p, "#dcbf93", "#c8a679", lw, [3, 3]);
  // 木纹（贴着两边，不压字）
  g.strokeStyle = "rgba(140,98,62,0.3)";
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-w / 2 + 5, -h / 2 + 8);
  g.bezierCurveTo(-w / 2 + 9, -10, -w / 2 + 3, 16, -w / 2 + 7, h / 2 - 6);
  g.moveTo(w / 2 - 5, -h / 2 + 12);
  g.bezierCurveTo(w / 2 - 2, 4, w / 2 - 8, 22, w / 2 - 5, h / 2 - 10);
  g.stroke();
  // 顶上一个小钉眼
  g.fillStyle = "#6b4d3a";
  g.beginPath();
  g.arc(0, -h / 2 + 6, 2.2, 0, Math.PI * 2);
  g.fill();
  drawWords(g, t);
  g.restore();
}

/** 短铅笔：从手心画到笔尖 */
function drawPencil(g: CanvasRenderingContext2D, palm: V2, tip: V2, z: number) {
  const dx = palm[0] - tip[0];
  const dy = palm[1] - tip[1];
  const len = Math.max(40, Math.hypot(dx, dy) * 1.5);
  const lw = 2.4 / Math.sqrt(Math.max(0.3, z));
  g.save();
  g.translate(tip[0], tip[1]);
  g.rotate(Math.atan2(dy, dx));
  const cone = new Path2D();
  cone.moveTo(0, 0);
  cone.lineTo(9, -3.2);
  cone.lineTo(9, 3.2);
  cone.closePath();
  part(g, cone, "#ecd2a6", null, lw);
  g.fillStyle = "#3a2c34";
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(3, -1.1);
  g.lineTo(3, 1.1);
  g.fill();
  const body = new Path2D();
  body.rect(9, -3.2, len - 9, 6.4);
  part(g, body, "#d9a441", "#c18d33", lw, [1, 1]);
  g.restore();
}

// ——— 妈妈 ———
const M8 = {
  /** 低头看着手里的木牌写字，含着泪笑 */
  写: pose(6, { face: -0.6, ground: false, float: 0.22, rot: -2, ...legR(10, -26, -54), ...legL(-6, -18, -56), neck: -34, expression: "含泪", smile: 0.35, sad: 0.5, lookX: -0.1, lookY: 1 }, (l) => ({
    ...armL(40, 70, 0, "grip", l),
    ...armR(40, 60, 0, "grip", l),
  })),
  /** 两只手捧着木牌往下递，低头看着女儿 */
  给: pose(10, { face: -0.6, ground: false, float: 0.22, rot: -4, ...legR(10, -26, -54), ...legL(-6, -18, -56), neck: -26, expression: "含泪", smile: 0.6, tears: 0.7, lookX: -0.45, lookY: 1 }, (l) => ({
    ...armL(40, 20, 0, "grip", l),
    ...armR(40, 20, 0, "grip", l),
  })),
};
const mamaMove8 = live(
  [
    ...MAMA7_KEYS.filter((k) => k.t < T.start),
    { t: 60.3 + SHIFT, ease: "inOut", p: M8.写 },
    { t: 61.26 + SHIFT, p: M8.写 },
    { t: 61.4 + SHIFT, ease: "inOut", p: M8.给 },
    { t: T.rel + 0.04, p: M8.给 },
    { t: T.rel + 0.3, ease: "inOut", p: MAMA_POSES.看她 },
    { t: 64.5, p: MAMA_POSES.看她 },
  ] as MoveKey[],
  MAMA_OPTS,
);
/** 她的根：⑦ 那样慢慢往上；丢下木牌以后越飘越快（镜头已经跟着木牌下去了） */
const mamaRoot8 = (t: number): V2 => {
  const r = mamaRoot(t);
  const d = Math.max(0, t - T.rel);
  return [r[0], r[1] - 1600 * d * d];
};

/** 木牌在她手里时的中心（角色坐标）和转角：胸口前面（写最下面那个字时近处那只手也够得着） */
const HOLD: V2 = [-34, -340];
function heldLocal(t: number): { c: V2; rot: number } {
  if (t < T.hand) {
    const u = E.io(ph(t, T.out, T.hand));
    return { c: mix([2, -356], HOLD, u), rot: 0.35 + (-0.05 - 0.35) * u };
  }
  if (t < T.show) return { c: HOLD, rot: -0.05 };
  if (t < T.toss) {
    const u = E.io(ph(t, T.show, T.toss));
    return { c: add(HOLD, [-30 * u, 14 * u]), rot: -0.05 + 0.08 * u };
  }
  // 往前下方一送：越送越快，松手（两只手伸直了正好够得着）
  const u = ph(t, T.toss, T.rel);
  return { c: add(HOLD, [-30 - 16 * u * u, 14 + 18 * u * u]), rot: 0.03 + 0.1 * u * u };
}

/** 妈妈这一刻（世界坐标）：两只手按 IK——近处那只伸进怀里掏木牌、捏着铅笔写字、再和远处那只一起捧着递下去 */
export function mamaAt8(t: number) {
  const root = mamaRoot8(t);
  const mp: PoseIn = { ...mamaMove8(t).pose };
  const loc = (p: V2): V2 => [p[0] - root[0], p[1] - root[1]];
  const wL = E.io(ph(t, T.pocket, T.pocket + 0.12)) * (1 - E.io(ph(t, T.rel, T.rel + 0.2)));
  const wR = E.io(ph(t, T.hand - 0.14, T.hand)) * (1 - E.io(ph(t, T.rel, T.rel + 0.2)));
  const held = t >= T.out && t < T.rel ? heldLocal(t) : null;
  // 松手以后两只手停在松手那一刻的地方慢慢放开（IK 的分量淡掉），不往别处甩
  const hk = heldLocal(Math.min(t, T.rel - 1e-4));
  const edge = (side: number): V2 => add(hk.c, rotV([side * (BOARD.w / 2 + 3), 10], hk.rot));
  let tip: V2 | null = null;
  // 近处那只手（L）：先伸进怀里
  let toL: V2 = [6, -372];
  if (t >= T.out && t < T.hand) toL = edge(1);
  const bt = tipAt(t);
  if (held && bt) {
    tip = add(held.c, rotV(bt, held.rot));
    toL = add(tip, [16, 20]);
    // 写完最后一个字挪回木牌右边
    toL = mix(toL, edge(1), E.io(ph(t, T.show - 0.06, T.show)));
  } else if (t >= T.show) toL = edge(1);
  if (wL > 0.001) mp.armL = { ...(mp.armL as object), to: toL, ik: wL } as PoseIn["armL"];
  // 远处那只手从前面捏住木牌左边（画在木牌前面：手藏在木牌后面时只露出往外拐的肘，像叉着腰）
  if (wR > 0.001) mp.armR = { ...(mp.armR as object), to: add(hk.c, rotV([-(BOARD.w / 2 + 4), 16], hk.rot)), ik: wR, layer: "front", chest: "over" } as PoseIn["armR"];
  const mj = castJoints(MAMA, mp);
  const palmL: V2 = add(root, mj.palmL as V2);
  return {
    pose: mp,
    root,
    board: held ? { c: add(root, held.c), rot: held.rot } : null,
    tip: tip ? add(root, tip) : null,
    palmL,
    chest: add(root, [(mj.shoulderL[0] + mj.shoulderR[0]) / 2, mj.shoulderL[1] + 40]) as V2,
  };
}

// ——— 木牌掉下来 ———
/** 靠在她前面那只铁靴上：往左靠，左下角着地，上半截在她跪下来够得着的地方 */
const LEAN = -0.2;
const LAND_C: V2 = [KID_X + 72, -((BOARD.h / 2) * Math.cos(LEAN) + (BOARD.w / 2) * Math.sin(-LEAN))];
let FALL: { c0: V2; v0: V2; a: V2; r0: number } | null = null;
function fall() {
  if (FALL) return FALL;
  const dt = 0.01;
  const a = mamaAt8(T.rel - 1e-4).board!;
  const b = mamaAt8(T.rel - dt).board!;
  const v0: V2 = [(a.c[0] - b.c[0]) / dt, (a.c[1] - b.c[1]) / dt];
  const D = T.land - T.rel;
  const acc: V2 = [(2 * (LAND_C[0] - a.c[0] - v0[0] * D)) / (D * D), (2 * (LAND_C[1] - a.c[1] - v0[1] * D)) / (D * D)];
  FALL = { c0: a.c, v0, a: acc, r0: a.rot };
  return FALL;
}

/** 木牌这一刻在哪（世界坐标）：妈妈手里 → 掉下来（转一圈）→ 砸在靴子跟前弹一下、靠在靴子上 → 她手里 */
export function boardAt(t: number): { c: V2; rot: number; who: "mama" | "air" | "ground" | "kid" } | null {
  if (t < T.out) return null;
  if (t < T.rel) {
    const m = mamaAt8(t).board!;
    return { ...m, who: "mama" };
  }
  if (t < T.land) {
    const F = fall();
    const s = t - T.rel;
    const D = T.land - T.rel;
    const c: V2 = [F.c0[0] + F.v0[0] * s + 0.5 * F.a[0] * s * s, F.c0[1] + F.v0[1] * s + 0.5 * F.a[1] * s * s];
    // 一边掉一边转一圈（逆时针），落地时正好靠成 LEAN
    const rot = F.r0 + (LEAN - 2 * Math.PI - F.r0) * (s / D);
    return { c, rot, who: "air" };
  }
  if (t < T.grab) {
    // 砸下去弹一下：先往右歪着跳起来一点，再靠回靴子上
    const u = ph(t, T.land, T.land + 0.2);
    const hop = 14 * Math.sin(Math.PI * u) * (1 - u * 0.3);
    return { c: [LAND_C[0] + 4 * Math.sin(Math.PI * u), LAND_C[1] - hop], rot: LEAN + 0.16 * Math.sin(Math.PI * u), who: "ground" };
  }
  const k = kidAt8(t);
  return { c: k.boardC, rot: k.boardRot, who: "kid" };
}

// ——— 七岁的她 ———
/** 单膝跪的腿（和第一幕沉沉跪下递砖一样）：前腿 R 大腿放平、小腿立着（大腿朝镜头压短），后膝 L 着地、后脚靴尖点地 */
const KNEEL = { ...legR(96, -98), ...legL(-6, -134, -140), thighR: 0.65 };
const K8 = {
  /** 「咚」一下，低头看着脚边的木牌 */
  看牌: pose(8, { face: 0.72, ...legR(6, -6), ...legL(-6, -4), neck: -34, expression: "含泪", sad: 0.9, tears: 0.8, lookX: 0.4, lookY: 1 }, (l) => ({
    ...armL(12, 20, 0, "relax", l),
    ...armR(26, 24, 0, "open", l),
  })),
  /** 跪下去够木牌（她手短、穿着大铁靴蹲不下去够不着地：单膝跪，前脚踩稳、后膝着地，身子往前压；
   *  头用 neck 往回扶，头的转角不超过 36°，不然齐耳短发翻成一圈尖） */
  跪: pose(56, { face: 0.72, ...KNEEL, neck: 22, expression: "含泪", sad: 0.9, tears: 0.8, lookX: 0.4, lookY: 1 }, (l) => ({
    ...armL(80, 10, 0, "open", l),
    ...armR(90, 10, 0, "open", l),
  })),
  /** 跪着把木牌抱在胸前，低头看着上面的字，嘴抖 */
  抱: pose(14, { face: 0.72, ...KNEEL, neck: -26, expression: "含泪", sad: 0.95, tears: 1, wobble: 0.7, smile: -0.3, lookX: 0.2, lookY: 0.8 }, (l) => ({
    ...armL(30, 90, 0, "grip", l),
    ...armR(30, 90, 0, "grip", l),
  })),
  /** 抱着木牌仰起头看天：妈妈不见了 */
  仰: pose(4, { face: 0.72, ...KNEEL, neck: 30, expression: "仰望", sad: 0.9, tears: 1, open: 0.22, blush: 0.6, lookX: 0.3, lookY: -1 }, (l) => ({
    ...armL(30, 90, 0, "grip", l),
    ...armR(30, 90, 0, "grip", l),
  })),
};
/** 她的关键帧（间奏原样抄过去再往后接；最后一帧停在间奏要动之前） */
export const KID8_KEYS: MoveKey[] = [
    ...KID7_KEYS.filter((k) => k.t < T.start),
    { t: T.rel + 0.09, p: KID_POSES.够 },
    // 木牌掉下来时（镜头在跟着木牌往下扎，看不见她）两只手放下来，落地时已经低头看着它（手臂按弹簧跟，要早一点放）
    { t: T.rel + 0.41, ease: "inOut", p: K8.看牌 },
    { t: T.crouch, p: K8.看牌 },
    { t: T.grab - 0.03, ease: "inOut", p: K8.跪 },
    { t: T.grab + 0.05, p: K8.跪 },
    { t: T.hug, ease: "inOut", p: K8.抱 },
    { t: T.flash + 0.04, p: K8.抱 },
    { t: T.flash + 0.42, ease: "inOut", p: K8.仰 },
    { t: T.end + 0.03, p: K8.仰 },
] as MoveKey[];
const kidMove8 = live(KID8_KEYS, KID_OPTS);

/** 抱在胸前时木牌的中心（相对她站着时的根）：仰头以后抱得更紧一点 */
const HUG_C: V2 = [-4, -132];
const HUG_C2: V2 = [-8, -136];
/** 抱着木牌时两只手比抓在木牌两边再挪多少（她自己的坐标：朝左写，往下为正）、手腕弯多少（度） */
const HUG_HANDS = { L: [16.6, 32.4] as V2, R: [-5.4, 41.5] as V2, hL: 57.25, hR: -33.24 };
/** 她站着时前面那只脚踝（R）离根多远：跪下去时把根往后挪，前脚钉在原地（胯往后坐到脚跟上） */
let ANKLE0: number | null = null;
export function kidAt8(t: number) {
  const kp: PoseIn = { ...kidMove8(t).pose };
  const s = KID.scale;
  ANKLE0 ??= castJoints(KID, { ...kidMove8(T.start).pose }).ankleR[0];
  const root: V2 = [KID_X + ANKLE0 - castJoints(KID, kp).ankleR[0], 0];
  // 朝右（face > 0）整套镜像：角色坐标 x 取反、再除以缩放
  const loc = (p: V2): V2 => [-(p[0] - root[0]) / s, (p[1] - root[1]) / s];
  let boardC: V2 = LAND_C;
  let boardRot = LEAN;
  if (t >= T.grab) {
    const u = E.io(ph(t, T.grab, T.hug));
    const hug = mix(HUG_C, HUG_C2, E.io(ph(t, T.flash + 0.04, T.flash + 0.42)));
    boardC = mix(LAND_C, add([KID_X, 0], hug), u);
    boardRot = LEAN + (0.06 - LEAN) * u;
  }
  const w = E.io(ph(t, T.grab - 0.12, T.grab));
  if (w > 0.001) {
    // 在地上时抓上半截（她够不着下面），抱起来以后两只手挪到两边
    const up = 1 - E.io(ph(t, T.grab, T.hug));
    const eL = add(boardC, rotV([-(BOARD.w / 2 + 2), 6 - 34 * up], boardRot));
    const eR = add(boardC, rotV([BOARD.w / 2 + 2, 2 - 30 * up], boardRot));
    // 抱起来以后两只手托在木牌下半截（用户 2026-10-30 在「调整画面」1:02.74 摆的，HUG_HANDS：她自己的坐标里再挪多少、手腕弯多少）
    const hu = 1 - up;
    const off = (p: V2, d: V2): V2 => [p[0] + d[0] * hu, p[1] + d[1] * hu];
    const rad = Math.PI / 180;
    kp.armL = { ...(kp.armL as object), to: off(loc(eL), HUG_HANDS.L), ik: w, h: HUG_HANDS.hL * rad * hu } as PoseIn["armL"];
    // 远处那只（R）的前臂和手画在铁靴、木牌前面（用户 2026-10-30：「右手还是被鞋子遮挡」），上臂照旧在身子后面
    kp.armR = { ...(kp.armR as object), to: off(loc(eR), HUG_HANDS.R), ik: w, h: HUG_HANDS.hR * rad * hu, fore: "front" } as PoseIn["armR"];
  }
  return { pose: kp, root, boardC, boardRot };
}

// ——— 路人：低着头走过，谁也不抬头 ———
const WALKERS: Walker[] = [
  // 刚从她身边走过去：木牌砸下来时一左一右低着头往外走，谁也没回头，很快走出画面（只剩她一个人）。
  // 第一版两个人在她身后擦肩走过：同一层、挨得近，低着的头像在看她，三个人站在一起像一家人
  { spec: passerby(25), x0: -2324, dir: 1, step: 0.5, t0: 0, seed: 81, wind: 0.3 },
  { spec: passerby(12), x0: -2615, dir: -1, step: 0.5, t0: 0.3, seed: 82, wind: 0.3 },
];
const WALK_FROM = 61.6 + SHIFT;
const WALK_TO = 63.2 + SHIFT;

/** 画⑧里街上和天上的人（人这一层，世界坐标）；木牌在谁手里就画在谁的身子和近处那只手臂之间 */
export function drawSign8(g: CanvasRenderingContext2D, t: number, z: number) {
  if (t > WALK_FROM && t < WALK_TO)
    for (const w of WALKERS) {
      const p = walkerAt(w, t - WALK_FROM);
      drawPerson(g, w.spec, p.pose, p.x, 0, z);
    }
  const b = boardAt(t);
  // 妈妈（丢下以后很快飘出画面）
  if (t < T.rel + 0.8) {
    const m = mamaAt8(t);
    drawGlow(g, m.chest[0], m.chest[1], 340, 0.35);
    const boardIn = b && b.who === "mama" ? b : null;
    const wm = g.getTransform();
    drawPerson(g, MAMA, m.pose, m.root[0], m.root[1], z, {
      beforeFrontArms: boardIn
        ? (cc: CanvasRenderingContext2D) => {
            cc.save();
            cc.setTransform(wm);
            drawBoard(cc, boardIn.c, boardIn.rot, t, z, Math.min(1, (t - T.out) / 0.06));
            cc.restore();
          }
        : undefined,
    });
    if (m.tip) drawPencil(g, m.palmL, m.tip, z);
  }
  // 她
  const k = kidAt8(t);
  g.save();
  g.fillStyle = "rgba(96,62,70,0.22)";
  g.beginPath();
  g.ellipse(k.root[0] + 10, 6, 120, 18, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  const inArms = b && (b.who === "kid" || b.who === "ground") ? b : null;
  const wk = g.getTransform();
  // 跪下去捡、抱着木牌时近处那只手（L）压在铁靴上面（用户 2026-10-30，1:02.74：「手不要被鞋子遮挡」）：先画她（不画这只胳膊），再单画这只胳膊
  const armOnTop = t >= T.grab - 0.12;
  drawPerson(g, KID, k.pose, k.root[0], k.root[1], z, {
    beforeFrontArms: inArms
      ? (cc: CanvasRenderingContext2D) => {
          cc.save();
          cc.setTransform(wk);
          drawBoard(cc, inArms.c, inArms.rot, t, z);
          cc.restore();
        }
      : undefined,
    skipArms: armOnTop ? ["L"] : undefined,
  });
  if (armOnTop) drawPerson(g, KID, k.pose, k.root[0], k.root[1], z, { onlyArm: "L" });
}

/** 掉在半空的木牌（画在拖影后面，保持清楚） */
export function drawFallingBoard(g: CanvasRenderingContext2D, t: number, z: number) {
  const b = boardAt(t);
  if (b && b.who === "air") drawBoard(g, b.c, b.rot, t, z);
}

/** 砸下去扬起的一小团灰（世界坐标） */
export function drawDust(g: CanvasRenderingContext2D, t: number) {
  const d = t - T.land;
  if (d < 0 || d > 0.6) return;
  const r = seeded(84);
  g.save();
  for (let i = 0; i < 7; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const sp = 60 + r() * 90;
    const x = LAND_C[0] + dir * (8 + sp * (1 - Math.exp(-d / 0.18)));
    const y = -4 - (10 + r() * 22) * (1 - Math.exp(-d / 0.2));
    const rad = 7 + r() * 8 + 26 * d;
    g.globalAlpha = 0.4 * (1 - d / 0.6);
    g.fillStyle = "#cdb9a4";
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

// ——— 天上一亮、灰落下来 ———
/** 天上一亮：从画面顶上照下来的一片白（妈妈到了白里） */
export const memFlash = (t: number) => {
  const d = t - T.flash;
  return d < 0 ? 0 : 0.55 * Math.min(1, d / 0.05) * Math.exp(-d / 0.34);
};
export function drawMemFlash(g: CanvasRenderingContext2D, base: DOMMatrix, t: number) {
  const a = memFlash(t);
  if (a < 0.005) return;
  g.save();
  g.setTransform(base);
  const gr = g.createLinearGradient(0, 0, 0, H * 0.85);
  gr.addColorStop(0, `rgba(255,248,234,${a})`);
  gr.addColorStop(1, "rgba(255,248,234,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.fillStyle = `rgba(255,248,234,${a * 0.22})`;
  g.fillRect(0, 0, W, H);
  g.restore();
}

/** 灰：和现在那场一样，从上往下一层层显出来，慢慢飘落到她身上 */
const ASH = (() => {
  const r = seeded(83);
  return Array.from({ length: 120 }, () => ({ x: KID_X - 560 + r() * 1120, y: -1250 + r() * 1250, v: 40 + r() * 50, s: 3 + r() * 5, ph: r() * 6.28, glow: r() < 0.3 }));
})();
export function drawMemAsh(g: CanvasRenderingContext2D, t: number, z: number) {
  const d = t - T.flash;
  if (d < 0.08) return;
  const spr = moteSprite();
  g.save();
  for (const f of ASH) {
    const delay = 0.08 + ((f.y + 1250) / 1250) * 0.6;
    const a = Math.min(1, Math.max(0, (d - delay) / 0.35));
    if (a <= 0) continue;
    const x = f.x + 20 * Math.sin(t * 1.3 + f.ph) + 9 * Math.sin(t * 2.9 + f.ph * 2);
    const y = f.y + f.v * (d - delay);
    const r = Math.max(1.6 / z, f.s);
    const tw = 0.7 + 0.3 * Math.sin(t * 4 + f.ph * 3);
    g.globalAlpha = a * tw * 0.9;
    g.fillStyle = f.glow ? "#f6ead8" : "#b49eb2";
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    if (f.glow) {
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = a * tw * 0.4;
      g.drawImage(spr, x - r * 4, y - r * 4, r * 8, r * 8);
      g.globalCompositeOperation = "source-over";
    }
  }
  g.restore();
}

// ——— 镜头 ———
/** 落地时的取景：她和靠在靴子上的木牌在画面下半截，后面走过去的路人 */
const C0 = aim(KID_X + 40, -190, 540, 1180, 1.5);
/**
 * ⑧的镜头（以⑦的镜头为底）：60.02 起柔和起步、一路减速推到妈妈手里的木牌上（她的脸在上面，2.3 倍，写字时再慢慢推一点）；
 * 61.518 她松手，镜头跟着木牌往下掉，一边掉一边退到 1.5 倍：木牌先几乎停在画面上（镜头和它一起掉），最后一下镜头刹住、
 * 木牌自己砸下去（「咚」+3%、震）；之后停住，62.45 起慢慢推近抱着木牌仰头的她
 */
export function signCam(t: number, base: (t: number) => Cam): Cam {
  if (t <= T.start) return base(t);
  const zA = (tt: number) => 2.9 * (1 + 0.06 * E.io(ph(tt, 60.6 + SHIFT, T.rel)));
  const holdPt = (tt: number) => add(mamaRoot8(Math.min(tt, T.rel)), [-34, -340]);
  const camA = (tt: number) => aim(...holdPt(tt), 540, 1100, zA(tt));
  if (t < T.rel) return camLerp(base(t), camA(t), E.settle(ph(t, T.start, 60.95 + SHIFT)));
  if (t < T.land) {
    // 按「木牌在画面上的位置」算镜头（它在画面上只往下走）：刚松手时镜头不动，看着它从她手里掉下去，0.1 秒里镜头越来越跟得上
    // （镜头的速度 = 木牌的速度 × smoothstep）；之后跟着它往下扎、一边退开，它在画面上慢慢挪到落地时 C0 里的位置；
    // 落地那一下镜头一下停住（砸下去的一震）
    const A = camA(T.rel);
    const F = fall();
    const s0 = toScreen(A, F.c0[0], F.c0[1]);
    const s1 = toScreen(C0, LAND_C[0], LAND_C[1]);
    const b = boardAt(t)!.c;
    const L = 0.1;
    // 头 L 秒里它在画面上多走的一段：∫ (v0 + a·s)·(1 − smoothstep(s / L))·z ds
    const lead = (i: 0 | 1, u: number) => A.z * L * (F.v0[i] * (u - u ** 3 + u ** 4 / 2) + F.a[i] * L * (u * u / 2 - (3 * u ** 4) / 4 + (2 * u ** 5) / 5));
    const u1 = ph(t, T.rel, T.rel + L);
    const u2 = E.io(ph(t, T.rel + L, T.land));
    const sx = s0[0] + lead(0, u1) + (s1[0] - s0[0] - lead(0, 1)) * u2;
    const sy = s0[1] + lead(1, u1) + (s1[1] - s0[1] - lead(1, 1)) * u2;
    const z = A.z * Math.pow(C0.z / A.z, E.io(ph(t, T.rel + 0.05, T.land - 0.04)));
    return aim(b[0], b[1], sx, sy, z);
  }
  // 推近：跪着的她在画面下三分之一（地面一直在画面 1465–1500 附近，不上下晃），上面是走过去的路人和落下来的灰
  let c = { ...C0, z: C0.z * (1 + 0.03 * kick(t, T.land, 0.1)) };
  const u = E.io(ph(t, T.grab, T.end + 0.3));
  if (u > 0) c = camLerp(c, aim(KID_X, -130, 470, 1250, 2.1), u);
  return c;
}
export const signShake = (t: number) => 8 * kick(t, T.land, 0.08);
