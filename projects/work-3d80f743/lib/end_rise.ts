// 终章的人链：谁、什么时候抓上来、他（人链顶上）在哪（纯数字，不画人；他在 lib/end_pair.ts，人链在 lib/end_chain.ts）。
// 用户 2026-10-25 第二次改：下面的人是在救他，不是拖住他——老钟从窗里攥住往上飘的他，被拽出窗；街上的人一个抓住一个的脚踝，
// 人链一节节长上去（开头 0.42 秒一个，越接越快，第二声里就接到顶）；最后一个站在街上不离地，人链钉在地上的那一点（PIVOT）不动。整条人链像一根被风吹的线，
// 绕着这一点摆：第二声笔直不摆（第二声里就接到顶）；第三声几乎不动（镜头从上往下看过每一个人）；第四声先往右荡、再往左，
// 「在这反乌托邦里」接着往左荡，句子唱完荡到倒挂在楼顶栏杆上的她跟前（TE.arrive）。

import { CAST, type CastSpec, passerby } from "@materials/剪纸角色/code/cast";
import { STUDENT, UNCLE } from "./saved";
import { E, ph } from "./cam";
import { TE, type V2 } from "./end_t";
import { CORNER, X_K } from "./end_map";

export interface Member {
  spec: CastSpec;
  name: string;
  /** 吊着时朝哪（正数朝右）：跑过来的那一边 */
  face: number;
  /** 从哪跑来（根的 x）；从铺子里出来的给门的位置 */
  from: number;
  door?: boolean;
  /** 散开、落回街上以后站在哪（她落地、给他穿外套的那一片空出来） */
  spot: number;
  /** 最后一个：站在街上不离地，人链钉在地上的那一点 */
  anchor?: boolean;
}
/** 人链里的人，从上往下（他在最上面，不在这张表里）：老钟、她救过的人（认得出的先来），再是这些年被她拽下来的人 */
export const MEMBERS: Member[] = [
  { spec: CAST.老钟, name: "老钟", face: -0.45, from: -1545, spot: -1560 },
  { spec: CAST.周磊, name: "周磊", face: -0.45, from: -520, spot: -2960 },
  { spec: CAST.千斤, name: "千斤", face: 0.45, from: -3400, spot: -3090 },
  { spec: CAST.千斤的妈妈, name: "千斤的妈妈", face: 0.45, from: -3600, spot: -3220 },
  { spec: CAST.阿满, name: "阿满", face: 0.45, from: -2380, door: true, spot: -1430 },
  { spec: CAST.老太太, name: "老太太", face: 0.45, from: -3300, spot: -3350 },
  { spec: CAST.年轻人, name: "年轻人", face: -0.45, from: -1030, door: true, spot: -1300 },
  { spec: UNCLE, name: "戴眼镜的大叔", face: -0.45, from: -300, spot: -1170 },
  { spec: STUDENT, name: "扎马尾的女学生", face: 0.45, from: -3800, spot: -3480 },
  { spec: passerby(3), name: "路人3", face: -0.45, from: -200, spot: -1040 },
  { spec: passerby(14), name: "路人14", face: 0.45, from: -3900, spot: -3610 },
  { spec: passerby(20), name: "路人20", face: -0.45, from: -100, spot: -910 },
  { spec: passerby(9), name: "路人9", face: 0.45, from: -4000, spot: -3740 },
  { spec: passerby(5), name: "路人5", face: -0.45, from: 0, spot: -780 },
  { spec: passerby(16), name: "路人16", face: 0.45, from: -4100, spot: -3870 },
  { spec: passerby(18), name: "路人18", face: -0.45, from: 100, spot: -650 },
  { spec: passerby(7), name: "路人7", face: 0.45, from: -4200, spot: 0, anchor: true },
];
/** 吊着（两只手举直）时两只手心的中点在根上方多高；远处那只脚踝（下面的人抓这里）在根上方多高（lib/end_poses 的 HANG 量的） */
const HAND_UP: Record<string, number> = { 老钟: 562, 周磊: 621, 千斤: 550, 千斤的妈妈: 586, 阿满: 609, 老太太: 515, 年轻人: 597 };
const ANKLE_UP: Record<string, number> = { 老钟: 66, 周磊: 72, 千斤: 64, 千斤的妈妈: 68, 阿满: 71, 老太太: 60, 年轻人: 70 };
export const handUp = (m: Member) => HAND_UP[m.name] ?? 575 * (m.spec.scale / 0.99);
export const ankleUp = (m: Member) => ANKLE_UP[m.name] ?? 66 * (m.spec.scale / 0.99);
/** 一节有多长：手心到远处那只脚踝 */
export const linkLen = (m: Member) => handUp(m) - ankleUp(m);
/** 跳起来根能离地多高（老太太是年轻人托上去的；最后一个不跳，站着够） */
export const jumpOf = (m: Member) => (m.anchor ? 0 : m.name === "老太太" ? 150 : 230);
/** 他远处那只脚踝在根上方多高（老钟、下面的人攥这里） */
export const KID_ANKLE_UP = 38;

// ——— 人链钉在地上的那一点：最后一个人站在这里，两只手举着攥住上面那个人的脚踝 ———
/** 下面的人跑过来、跳起来抓的地方：老钟家那扇窗底下（坑的右边） */
export const X_JOIN = -1600;
/** 最后一个人（ANCHOR 姿势：蹲低、身子往后坐着拽，两只手往前上方攥着）两只手心离地多高（lib/end_poses 的 ANCHOR 量的） */
export const ANCHOR_HAND_UP = 353;
/** 人链绕着摆的那一点（最后一个人攥着的地方） */
export const PIVOT: V2 = [X_JOIN, -ANCHOR_HAND_UP];

// ——— 他（人链顶上）离地多高 ———
/** 老钟从窗里攥住他时、被拽出窗时，他的根离地多高。攥住时老钟两只脚还在屋里地上，身子往左探出窗（ZHONG.扑：两只手心的中点在根左边 234、
 * 上面 461，castJoints 量的），手正好够到他远处那只脚踝：461 − 38 − 10 ≈ 433 */
export const H_GRAB = 433;
export const H_OUT = 1000;
/** 他到她跟前时横着在哪：倒挂在楼顶右边那个角上的她右边一点，举着的砖正好在她脸跟前 */
// 用户 2026-10-27（2:11.47）：「让他们距离远一点，小石头用力向左递，她用左手接」——原来 + 150
export const X_ARRIVE = CORNER[0] + 360;

/** 第 k 个人（k ≥ 1）跳起来攥住上面那个人的脚踝那一刻，他的根离地多高（竖着叠起来算；摆开的角度另算） */
function hAtJoin(k: number): number {
  const m = MEMBERS[k];
  let h = (m.anchor ? ANCHOR_HAND_UP : handUp(m)) + jumpOf(m);
  for (let j = 0; j < k; j++) h += linkLen(MEMBERS[j]);
  return h - KID_ANKLE_UP;
}
/** 人链长成以后他的根离地多高（竖着叠起来） */
export const H_TOP = hAtJoin(MEMBERS.length - 1);
/** [时刻, 高度] 的节点：攥住、拽出窗、每个人抓上来 */
const KNOTS: [number, number][] = [
  [TE.zGrab, H_GRAB],
  [TE.zGrab + 1.2, H_GRAB + 70],
  [TE.zOut, H_OUT],
  ...TE.joins.map((t, i): [number, number] => [t, hAtJoin(i + 1)]),
];
/** 单调三次插值（Fritsch–Carlson）：过每个节点、不冲过头 */
const SLOPES: number[] = (() => {
  const n = KNOTS.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((KNOTS[i + 1][1] - KNOTS[i][1]) / (KNOTS[i + 1][0] - KNOTS[i][0]));
  const m: number[] = [d[0] * 0.3];
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (3 * (KNOTS[i + 1][0] - KNOTS[i - 1][0])) / ((2 * KNOTS[i + 1][0] - KNOTS[i][0] - KNOTS[i - 1][0]) / d[i - 1] + (KNOTS[i + 1][0] + KNOTS[i][0] - 2 * KNOTS[i - 1][0]) / d[i]));
  m.push(0);
  return m;
})();
/** 他的根离地多高（竖着叠起来：115.02 老钟攥住 → 最后一个人站住），每接上一个人整条往下一坠 */
export function chainH(t: number): number {
  const K = KNOTS;
  if (t <= K[0][0]) return K[0][1];
  if (t >= K[K.length - 1][0]) return K[K.length - 1][1];
  let i = 0;
  while (t > K[i + 1][0]) i++;
  const [t0, h0] = K[i];
  const [t1, h1] = K[i + 1];
  const dt = t1 - t0;
  const u = (t - t0) / dt;
  const u2 = u * u;
  const u3 = u2 * u;
  const h = (2 * u3 - 3 * u2 + 1) * h0 + (u3 - 2 * u2 + u) * dt * SLOPES[i] + (-2 * u3 + 3 * u2) * h1 + (u3 - u2) * dt * SLOPES[i + 1];
  // 接上一个人：整条往下一坠 30（0.25 秒弹回来）
  let dip = 0;
  for (const tj of TE.joins) {
    const d = t - tj;
    if (d > 0 && d < 0.6) dip += 30 * Math.exp(-d / 0.12) * Math.cos(d * 9);
  }
  return h - dip;
}

// ——— 随风摆：他横着在哪（节点之间按余弦走：到两头慢下来，像摆） ———
// 用户 2026-10-25：「随风摇摆的速度太慢了，这里应该是第一次左边没够到，第二次摇过去刚好够到」——半个来回 1.2 秒；
// 第四声里往左荡第一次差一点没够到她，荡回去，第二次正好荡到她跟前；用户 2026-10-26（2:07.77）改成「这一个摇摆直接就到主角了」；（2:07.69）「原本位置向右远一点」：126.45 荡到右边更远（−950），往左荡过去，整幅切走时还差一截，特写里才到（TE.arrive）
// 用户 2026-10-26（2:01.80）：「这整个镜头人链不要摇摆，下个镜头不要硬切，改成向前推镜，下个镜头推镜完成之后就可以摇摆了」——
// 第二声那一镜里他从窗前（X_K）慢慢回到 PIVOT 正上方，人链长的时候笔直；跟着他往上时轻轻摆一下。
// 用户 2026-10-26（2:07.43）：第三声镜头拉远，整条人链从静止起摆，先向右、再向左；第四声镜头推到他身上，跟着他往左荡过去，把砖递给她（TE.arrive）
const SWAY: [number, number][] = [
  [TE.zOut, X_K + 10],
  [119.6, PIVOT[0]],
  // 用户 2026-10-26（2:04.12）：「向右摇摆之后向左，摇摆慢一点」——第三声从静止慢慢荡到右边（1.8 秒），再一口气慢慢往左荡过去（4.3 秒），
  // 第四声镜头推到他身上时他正往左荡，一直荡到她跟前（TE.arrive）；中途不再荡回去（之前 2:04.58「这里不要摇摆得这么近」的那一下也就没有了）
  // 用户 2026-10-26（2:00.86）：「这里也要有小摇摆」——镜头跟着他往上的那一段轻轻摆一下：先往右一点、再往左一点（各 150），
  // 从左边那一点直接接上第三声往右的那一大下（中间不停）
  [120.4, PIVOT[0] + 150],
  [121.2, PIVOT[0] - 150],
  // 用户 2026-10-26（2:13.10）：第三声镜头从他往下把人一个个看过去——人链几乎不动（慢慢回到正中）；
  // 第四声镜头从街上往后拉开，人链先往右荡（2.4 秒），再一口气往左荡（4 秒），推到他身上时还在往左，句子唱完正好荡到她跟前（TE.arrive）
  [TE.sweepEnd - 0.1, PIVOT[0] - 20],
  [TE.swingR, -850],
  [TE.arrive, X_ARRIVE],
];
/** 他的根横着在哪（老钟攥住以后） */
export function swayX(t: number): number {
  if (t <= SWAY[0][0]) return X_K + 10 + 8 * Math.sin(t * 2.1) * E.io(ph(t, TE.zGrab, TE.zGrab + 0.5));
  if (t >= SWAY[SWAY.length - 1][0]) return SWAY[SWAY.length - 1][1];
  let i = 0;
  while (t > SWAY[i + 1][0]) i++;
  const [t0, x0] = SWAY[i];
  const [t1, x1] = SWAY[i + 1];
  const u = (t - t0) / (t1 - t0);
  return x0 + (x1 - x0) * (1 - Math.cos(Math.PI * u)) * 0.5;
}

// ——— 人链中间的波：他那头一摆，一节节往下传，人链弯成一道波浪（用户：「人链太直了，中间需要也有左右摇摆的传递，形成一个波浪」） ———
/** 摆动从他那头传到地上那一点要多久 */
const WAVE_TAU = 1.05;
/**
 * 人链上离 PIVOT 比例 s（0 = PIVOT，1 = 他）那一点横着偏离「PIVOT—他」这条直线多少：
 * 那一点跟着他晚 (1 − s)·WAVE_TAU 秒的位置走（两头不动，中间放大 1.5 倍），再加一点风往左吹的弯
 */
export function waveDev(t: number, s: number): number {
  return 1.5 * s * (swayX(t - (1 - s) * WAVE_TAU) - swayX(t)) - 60 * 4 * s * (1 - s);
}
/** 这道波浪线比直线长多少（他离 PIVOT 要近这么多，人链的长度才不变，最后一个人才攥得住） */
function waveExtra(t: number, chord: number): number {
  const n = 24;
  let len = 0;
  let px = 0;
  let py = 0;
  for (let i = 1; i <= n; i++) {
    const s = i / n;
    const x = waveDev(t, s);
    const y = chord * s;
    len += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return len - chord;
}
/** 人链这一刻的形状：从他的脚踝 K 到 PIVOT 的折线（n + 1 个点，第一个是 K） */
export function wavePolyline(t: number, K: V2, n = 32): V2[] {
  const pts: V2[] = [];
  for (let i = 0; i <= n; i++) {
    const s = 1 - i / n;
    pts.push([PIVOT[0] + (K[0] - PIVOT[0]) * s + waveDev(t, s), PIVOT[1] + (K[1] - PIVOT[1]) * s]);
  }
  return pts;
}
/**
 * 人链顶上（他）的根：拽出窗以后整条人链绕着 PIVOT 摆（他离 PIVOT 的距离 = 竖着叠起来的长度，减去人链弯成波浪多出来的长度），
 * 横着按 swayX，竖着跟着角度往下降一点；拽出窗那 0.6 秒从「竖着叠」过渡到「绕着摆」
 */
export function chainTop(t: number): V2 {
  const S = chainH(t);
  const x = swayX(t);
  if (t <= TE.zOut) return [x, -S];
  const dist = S + KID_ANKLE_UP - ANCHOR_HAND_UP;
  const D = dist - waveExtra(t, dist);
  const sn = Math.max(-0.95, Math.min(0.95, (x - PIVOT[0]) / D));
  const yP = PIVOT[1] - D * Math.sqrt(1 - sn * sn) + KID_ANKLE_UP;
  const w = E.io(ph(t, TE.zOut, TE.zOut + 0.6));
  return [x, -S + (yP + S) * w];
}
/** 他到她跟前那一刻的根 */
export const K_ARRIVE: V2 = chainTop(TE.arrive);
/** 人链已经钉在地上了（最后一个人站住） */
export const anchoredAt = (t: number) => t >= TE.joins[TE.joins.length - 1];
export type { V2 };
