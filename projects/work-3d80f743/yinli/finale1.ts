// 活下去 1:53.88–2:09.87：四遍「活下去」（用户 2026-10-15 改）：小石头从她的铁靴里走出来，光着脚往上飞去找她；
// 其他人一个一个抓住他，连成一条人链往上长；他抓住她的脚踝，她握住他的手（尾声里一起落下来）
// S54 113.88–129.87 一镜到底：
//   113.88 唤醒：「咚！」小石头穿着她的大靴子跺了一下地，抬头看天——1:54.3 一只脚一只脚从靴子里走出来，光着的脚离了地；
//     老钟听见那一声，推开十年没开过的窗，扑出窗口一把抓住他的脚踝，另一只手死死扳着窗框
//   116.2 镜头顺着两个人的视线一路升上去，穿过灰和网，升到白的边上：她睁开眼，低头
//   117.9 奔涌：顺着她的视线扎回街上：门一扇扇打开，人们走上街；老钟扳不住窗框被拽出了窗，周磊扑上来抓住他的脚踝，
//     后来的人一个接一个从下面抓上来（每个人站在地上拽着，等下一个人抓住自己，再被拽离地面，鞋留在街上）
//   121.89 壮阔：镜头贴着人链往上走，擦过一扇扇亮起来的窗、还没散完的网
//   125.82 抓住：最顶上，小石头伸手抓住她的脚踝（和 0:05.6 她抓住周磊同一个构图，上下颠倒）；镜头往后拉：
//     一条从地面连到天上的手；白里的妈妈放下了手；推回去：她低头看着他，他松开一只手伸上来，她握住了
import { type C, type Cam, type Shot, W, H, E, ph, kick, shake, jolt, applyCam, vignette, clamp, mix, smearV, camLerp, flash } from "./core";
import { figure, pose, glowDot, type Fig, type Pt, walk } from "./figure";
import { ash, crack, WHITE, ghost } from "./world";
import { crowd, bigBoot } from "./props";
import { towerWorld, whiteGaze } from "./chorus2";
import { drawChain, drawRunners, chainCount, memberHip, shoesOnStreet, CX, BX, QIN_HIP, T_JOIN, type ChainState } from "./chain";
import { PAL } from "./palette";

const lerpPt = (a: Pt, b: Pt, e: number): Pt => [mix(a[0], b[0], e), mix(a[1], b[1], e)];
const win = (t: number, a: number, b: number, c: number, d: number) => E.io(ph(t, a, b)) * (1 - E.io(ph(t, c, d)));
const aimC = (p: Pt, s: Pt, z: number): Cam => ({ x: p[0] - (s[0] - W / 2) / z, y: p[1] - (s[1] - H / 2) / z, z });
function whip(a: Cam, b: Cam, e: number, zMid: number): Cam {
  const k = camLerp(a, b, E.io(e));
  const dip = Math.sin(Math.PI * clamp(e));
  return { ...k, z: Math.exp(mix(Math.log(k.z), Math.log(zMid), dip)) };
}

export const STOMPS = [113.9];
const QTX = CX - 60; // 她停在白边上的地方
/** 她：停在白边上，张着手 */
export function qinTop(t: number, o: Partial<Fig> = {}): Fig {
  return { x: QTX, y: QIN_HIP, grounded: false, kind: "qin", facing: 1, float: 1, barefoot: true, boots: false, aL: -2.6 + Math.sin(t) * 0.08, aR: 2.5, head: 0.6, legL: -0.1, legR: 0.22, kneeL: 0.35, kneeR: 0.25, rim: 1, eyes: "closed", tears: 1, ...o };
}
/** 她的右手和小石头的右手握在一起的地方：她弯下腰往下够，他松开一只手往上够（跟着她走） */
export const handMeet = (qinHip: Pt): Pt => [qinHip[0] + 60, qinHip[1]];

// ---------- 时间 ----------
const T_LOOKUP = 114.02; // 抬头看天：她在那上面
const OUT_L = 114.3; // 1:54.3 左脚从靴子里抽出来
const OUT_R = 114.52; // 右脚
const T_LIFT = 114.8; // 光着的脚离了地
const T_LAO_OPEN = 115.25; // 老钟推开窗
const T_LAO_GRAB = 115.75; // 扑出窗口，一把抓住他的脚踝
const T_CRANE = 116.2; // 镜头顺着两个人的视线升上去
const T_TOP = 117.45;
const T_EYES = 117.55; // 她睁开眼
const T_DIVE = 117.9; // 顺着她的视线扎回街上
const T_STREET = 118.35;
const DOORS: [number, number][] = [
  [-121, 118.4],
  [471, 118.55],
  [-813, 118.5],
  [1022, 118.65],
];
const ZL0 = 471; // 周磊从紫房子的门里冲出来
const T_LAO_OUT = 118.8; // 老钟扳不住窗框，被拽出了窗
const T_RIDE = 121.89;
const T_ANKLE = 126.05; // 小石头抓住她的脚踝
const T_PULL = 126.6; // 镜头往后拉
const T_BACK = 128.4; // 推回去
const T_HAND = 129.6; // 她握住他的手

// ---------- 地方 ----------
const LAO: Pt = [430, -230]; // 老钟的窗（一楼，紫房子上），窗台的高度
const HOLD_X = 340; // 老钟拽住他的地方（窗口左边）
const HOLD_FEET = -330; // 被拽住时他的脚底
const KID_LEG = -pose({ kind: "kid", x: 0, y: 0, grounded: true, barefoot: true }).hip[1]; // 他胯到脚底的高度
const OLD_LEG = -pose({ kind: "old", x: 0, y: 0, grounded: true }).hip[1];
const S0: ChainState = { n: chainCount(T_JOIN), drop: 0 };

// ---------- 小石头（接上人链以前） ----------
/** 站着穿着靴子跺地 → 抬头 → 一只脚一只脚从靴子里走出来 → 飘起来 → 被老钟拽住脚踝，一直往上挣 → 老钟被拽出窗 */
function kidSolo(t: number): Fig {
  const look = E.io(ph(t, T_LOOKUP, T_LOOKUP + 0.2));
  const base = { kind: "kid" as const, bell: true, barefoot: true, rim: 0.9, tears: 1, facing: 1 as const };
  if (t < T_LIFT) {
    const stomp = win(t, STOMPS[0] - 0.12, STOMPS[0] - 0.02, STOMPS[0], STOMPS[0] + 0.2);
    const upL = win(t, OUT_L - 0.1, OUT_L + 0.02, OUT_L + 0.08, OUT_L + 0.2);
    const upR = win(t, OUT_R - 0.1, OUT_R + 0.02, OUT_R + 0.08, OUT_R + 0.2);
    const out = E.io(ph(t, OUT_L, OUT_R + 0.15));
    const heel = E.io(ph(t, T_LIFT - 0.2, T_LIFT)); // 踮起脚
    return {
      ...base,
      x: BX - 30 * out,
      y: mix(-10, 0, out) - 6 * heel,
      grounded: true,
      head: t < T_LOOKUP ? 0.45 : mix(0.45, 1.05, look) - 0.5 * Math.max(upL, upR),
      legR: 0.35 * stomp + 0.25 * upR,
      kneeR: 0.9 * stomp + 1.1 * upR,
      legL: 0.25 * upL,
      kneeL: 1.1 * upL,
      aL: mix(-0.6, -2.7, heel),
      aR: mix(0.6, 2.6, heel),
      eyes: "wide",
    };
  }
  // 离了地：两只手伸向天上
  const rise = E.in2(ph(t, T_LIFT, T_LAO_GRAB));
  const tug = t > T_LAO_GRAB ? 18 * Math.sin((t - T_LAO_GRAB) * 9) * Math.exp(-(t - T_LAO_GRAB) * 2) : 0; // 被拽住那一下弹回来
  const strain = E.io(ph(t, T_LAO_GRAB, T_LAO_OUT)); // 一直往上挣，老钟被拽得越探越出来
  const feet = mix(0, HOLD_FEET, rise) - 40 * strain + tug;
  let x = mix(BX - 30, HOLD_X, E.io(ph(t, T_LIFT, T_LAO_GRAB)));
  let hip = feet - KID_LEG;
  if (t > T_LAO_OUT) {
    // 老钟被拽出窗：两个人荡到人链的位置
    const e = E.io(ph(t, T_LAO_OUT, T_JOIN));
    const [cx, cy] = memberHip(0, S0, t);
    x = mix(x, cx, e);
    hip = mix(hip, cy, e);
  }
  return { ...base, x, y: hip, grounded: false, facing: -1, float: 0.8, head: 1.0, aL: Math.PI - 0.25 + Math.sin(t * 2) * 0.08, aR: Math.PI + 0.2, legL: -0.08, legR: 0.12, kneeL: 0.2, kneeR: 0.1, eyes: "wide" };
}
/** 老钟：在窗里（窗台以下看不见）→ 推开窗 → 扑出窗口抓住他的脚踝，另一只手扳着窗框 → 被拽出窗 */
function laoFig(t: number, kidAnkle: Pt): Fig {
  const open = E.out(ph(t, T_LAO_OPEN, T_LAO_OPEN + 0.3));
  const up = E.io(ph(t, T_LAO_OPEN + 0.15, T_LAO_OPEN + 0.4));
  const lunge = E.out(ph(t, T_LAO_GRAB - 0.2, T_LAO_GRAB));
  const strain = E.io(ph(t, T_LAO_GRAB, T_LAO_OUT));
  const look: Fig = { x: LAO[0] + 10 - 60 * lunge - 30 * strain, y: LAO[1] + 120, grounded: true, kind: "old", facing: -1, head: mix(mix(-0.1, 1.0, up), 0.6, lunge), lean: -0.55 * lunge - 0.25 * strain, tone: 0.05, stone: 0.8, rim: 0.6, eyes: up > 0.5 ? "wide" : "open", tears: up, aL: -0.6 - up * 1.4, aR: 1.0 };
  if (lunge > 0.01) {
    look.hR = lerpPt([LAO[0] - 40, LAO[1] - 120], [kidAnkle[0] + 4, kidAnkle[1] + 4], lunge);
    look.hL = lerpPt([LAO[0] - 30, LAO[1] - 110], [LAO[0] + 70, LAO[1] - 140], lunge); // 扳着窗框
    if (strain > 0) look.hL = [LAO[0] + 70 - 6 * Math.sin(t * 40) * strain, LAO[1] - 140];
  }
  if (t < T_LAO_OUT) return look;
  // 被拽出了窗：荡到人链里，双手攥着他的脚踝
  const e = E.io(ph(t, T_LAO_OUT, T_JOIN));
  const [cx, cy] = memberHip(1, S0, t);
  const inHip = pose(look).hip;
  return { x: mix(inHip[0], cx, e), y: mix(inHip[1], cy, e), grounded: false, kind: "old", facing: 1, float: 0.5, head: 0.9, lean: mix(-0.5, 0, e), tone: 0.05, stone: 0.8, rim: 0.6, eyes: "wide", tears: 1, barefoot: true, legL: -0.2, legR: 0.3, kneeL: 0.5, kneeR: 0.3, hR: [kidAnkle[0] + 2, kidAnkle[1] + 4], hL: [kidAnkle[0] - 3, kidAnkle[1] + 26] };
}
/** 周磊：从门里冲出来，跑到窗下，伸手——一把抓住被拽出窗的老钟的脚踝（之后由人链接着画） */
function zhouLei(t: number, laoAnkle: Pt): Fig | null {
  if (t < DOORS[1][1] || t >= T_JOIN) return null;
  const run = E.io(ph(t, DOORS[1][1], T_JOIN - 0.2));
  const x = mix(ZL0, CX, run);
  const w = walk((t - 118.5) * 2.4, run > 0 && run < 1 ? 0.6 : 0);
  const reach = E.io(ph(t, T_JOIN - 0.3, T_JOIN));
  const f: Fig = { x, y: 0, grounded: true, kind: "man", facing: -1, tie: true, legL: w.legL, legR: w.legR, kneeL: w.kneeL, kneeR: w.kneeR, lean: run < 1 ? -0.25 : 0, head: 1.0, aL: mix(w.aL ?? -0.4, Math.PI - 0.5, reach), aR: mix(w.aR ?? 0.4, Math.PI + 0.4, reach), stone: 0.8, rim: 0.75, eyes: "wide" };
  void laoAnkle;
  return f;
}
// ---------- 镜头 ----------
const bootCam: Cam = aimC([BX + 4, -40], [W / 2, 1100], 4.2);
const faceCam: Cam = aimC([BX - 2, -178], [W / 2, 880], 4.6); // 抬头：推到他仰着的脸
const outCam: Cam = aimC([BX - 16, -120], [W / 2, 1200], 2.5); // 退开：一只脚一只脚从靴子里走出来
const laoCam: Cam = aimC([(HOLD_X + LAO[0]) / 2 - 20, -300], [W / 2, 1060], 2.0); // 他升起来，框进老钟的窗
const laoClose: Cam = aimC([(HOLD_X + LAO[0]) / 2 - 30, -360], [W / 2, 1000], 2.6);
const topCam = aimC([QTX, QIN_HIP - 30], [W / 2, 900], 3.0);
const streetCam = aimC([CX + 110, -300], [W / 2, 1150], 1.45);
function chainTop(t: number): Pt {
  const n = chainCount(t);
  if (n <= 0) return [CX, -300];
  return memberHip(0, { n, drop: 0 }, t);
}
function camAt(t: number): Cam {
  if (t < T_LOOKUP) return bootCam;
  let k = camLerp(bootCam, faceCam, E.io(ph(t, T_LOOKUP, T_LOOKUP + 0.22)));
  k = camLerp(k, outCam, E.io(ph(t, OUT_L - 0.06, OUT_R + 0.12)));
  // 光着的脚离了地：镜头跟着他升起来，框进老钟的窗
  k = camLerp(k, laoCam, E.io(ph(t, T_LIFT - 0.05, T_LAO_OPEN + 0.15)));
  k = camLerp(k, laoClose, E.io(ph(t, T_LAO_GRAB - 0.15, T_LAO_GRAB + 0.35)));
  if (t < T_CRANE) return k;
  if (t < T_TOP) return whip(laoClose, topCam, ph(t, T_CRANE, T_TOP), 0.22); // 顺着两个人的视线一路升上去
  if (t < T_DIVE) return { ...topCam, z: topCam.z * (1 + 0.04 * ph(t, T_TOP, T_DIVE)) };
  if (t < T_STREET) return whip(topCam, streetCam, ph(t, T_DIVE, T_STREET), 0.22); // 顺着她的视线扎回街上
  // 人链往上长：镜头跟着最上面的小石头往上、往后退
  const grow = (s: number) => {
    const top = chainTop(s);
    const z = mix(1.45, 0.82, E.io(ph(s, 119.4, T_RIDE)));
    return aimC([CX + 40, Math.min(-300, top[1] + 380)], [W / 2, 1000], z);
  };
  k = camLerp(streetCam, grow(t), E.io(ph(t, 119.2, 119.9)));
  if (t < T_RIDE) return k;
  // 贴着人链往上走
  const ride = (s: number) => {
    const top = chainTop(s);
    return aimC([CX - 30, top[1] + 260], [W / 2, 900], mix(0.82, 0.66, E.io(ph(s, T_RIDE, 125.4))));
  };
  k = camLerp(grow(T_RIDE), ride(t), E.io(ph(t, T_RIDE, T_RIDE + 0.5)));
  if (t < 125.4) return k;
  // 最顶上：小石头伸手抓住她的脚踝（和开场上下颠倒）
  const qa = pose(qinTop(t)).anR;
  const grabCam = aimC([qa[0] + 10, qa[1] + 110], [W / 2, 860], 3.0);
  k = camLerp(ride(125.4), grabCam, E.io(ph(t, 125.4, 125.95)));
  if (t < T_PULL) return k;
  // 往后拉：一条从地面连到天上的手
  const wide: Cam = { x: CX, y: -4700, z: 0.205 };
  k = whip(grabCam, wide, ph(t, T_PULL, 127.5), 0.2);
  if (t < T_BACK) return { ...k, z: k.z * (1 - 0.02 * ph(t, 127.5, T_BACK)) };
  // 推回去：她低头看着他，他松开一只手伸上来，她握住
  const handCam = aimC([QTX + 40, QIN_HIP + 90], [W / 2, 900], 2.8);
  return camLerp(wide, handCam, E.io(ph(t, T_BACK, 129.1)));
}

// ---------- 画 ----------
const reachAt = (t: number) => E.io(ph(t, 128.9, T_HAND));
function chainState(t: number): ChainState {
  const n = chainCount(t);
  const qa = pose(qinTop(t)).anR;
  const r = reachAt(t);
  const st: ChainState = { n, drop: 0, qinAnkle: qa, grab: E.out(ph(t, T_ANKLE - 0.2, T_ANKLE)), pull: r };
  if (r > 0) st.topHand = lerpPt([qa[0] + 4, qa[1] + 4], handMeet([QTX, QIN_HIP]), r);
  return st;
}
function qinNow(t: number): Fig {
  const open = t > T_EYES;
  const look = E.io(ph(t, T_EYES + 0.1, T_EYES + 0.35));
  const r = reachAt(t);
  const hR: Pt | undefined = r > 0.02 ? lerpPt([QTX + 30, QIN_HIP - 120], handMeet([QTX, QIN_HIP]), r) : undefined;
  return qinTop(t, { eyes: open ? (t > 128.4 ? "open" : "wide") : "closed", head: mix(0.6, -1.0, look), lean: 0.4 * r, aR: hR ? undefined : mix(2.5, 1.5, look), hR, tears: 1 });
}
/** 老钟的窗：窗里的灯、窗扇往外推开（十年没开过，推的时候抖一下）；人在窗台以下看不见 */
function laoWindow(c: C, t: number, lao: Fig | null) {
  const open = E.out(ph(t, T_LAO_OPEN, T_LAO_OPEN + 0.3));
  c.fillStyle = "#ffd27a";
  c.globalAlpha = 0.9;
  c.fillRect(LAO[0] - 80, LAO[1] - 150, 160, 150);
  c.globalAlpha = 1;
  if (lao) {
    c.save();
    c.beginPath();
    c.rect(LAO[0] - 600, LAO[1] - 800, 1200, 800);
    c.clip();
    figure(c, lao, t);
    c.restore();
  }
  const jit = Math.sin(t * 60) * 3 * win(t, T_LAO_OPEN - 0.1, T_LAO_OPEN, T_LAO_OPEN + 0.1, T_LAO_OPEN + 0.2);
  // 两扇百叶窗：关着的时候是一扇窗，推开以后贴在两边
  const panel = (x0: number, w: number) => {
    if (w < 0) {
      x0 += w;
      w = -w;
    }
    c.fillStyle = "#c99a74";
    c.fillRect(x0, LAO[1] - 150, w, 150);
    c.strokeStyle = "#8a5a42";
    c.lineWidth = 3;
    for (let i = 1; i < 7; i++) {
      c.beginPath();
      c.moveTo(x0 + 4, LAO[1] - 150 + i * 21);
      c.lineTo(x0 + w - 4, LAO[1] - 150 + i * 21);
      c.stroke();
    }
    c.lineWidth = 6;
    c.strokeRect(x0, LAO[1] - 150, w, 150);
  };
  panel(LAO[0] - 80 - open * 70 + jit, 80 * (1 - open * 0.65));
  panel(LAO[0] + 80 + open * 20 - jit, -80 * (1 - open * 0.65));
  c.fillStyle = "#8a6a5a";
  c.fillRect(LAO[0] - 90, LAO[1] - 4, 180, 10);
  // 被拽出窗时掉下来的一双拖鞋
  if (t > T_LAO_OUT) {
    const u = clamp((t - T_LAO_OUT) / 0.45);
    c.fillStyle = "#7d6a8a";
    for (const [dx, sp] of [
      [-20, 0.8],
      [10, 1.3],
    ]) {
      c.save();
      c.translate(LAO[0] + dx - 40 * u, mix(LAO[1] - 4, -6, u * u));
      c.rotate(u * 5 * sp);
      c.beginPath();
      c.ellipse(0, 0, 13, 6, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }
}
function drawAll(c: C, t: number, k: Cam) {
  const st = chainState(t);
  const lights = 0.6 * E.io(ph(t, 121.0, 125.5));
  towerWorld(c, t, k, { dawn: 0.75, lights });
  c.save();
  applyCam(c, k);
  // 她那栋楼的窗：人链经过的地方一扇扇亮起来
  if (st.n > 1) {
    const topY = memberHip(0, st, t)[1];
    c.fillStyle = PAL.lit;
    for (let r = 0; r < 29; r++) {
      const wy = -(r + 1) * 300 + 80;
      if (wy < topY - 200) continue;
      for (let q = 0; q < 5; q++) {
        if ((r * 5 + q) % 3 === 0) continue;
        c.globalAlpha = 0.85 * clamp((wy - topY + 200) / 600);
        c.fillRect(-430 + q * 180, wy, 60, 110);
      }
    }
    c.globalAlpha = 1;
  }
  // 接上人链以前的两个人
  const kidF = t < T_JOIN ? kidSolo(t) : null;
  const kidJ = kidF ? pose(kidF) : null;
  const lao = t < T_JOIN && kidJ && t > T_LAO_OPEN - 0.5 ? laoFig(t, kidJ.anR) : null;
  laoWindow(c, t, lao && t < T_LAO_OUT ? lao : null);
  shoesOnStreet(c, st.n);
  for (const st0 of STOMPS) crack(c, BX, 0, 90, ph(t, st0, st0 + 0.15));
  // 门一扇扇打开，人们走上街，抬起头
  for (const [dx, at] of DOORS) {
    const open = E.out(ph(t, at, at + 0.25));
    if (open <= 0) continue;
    c.fillStyle = PAL.lit;
    c.globalAlpha = 0.85 * open;
    c.fillRect(dx - 50, -230, 100, 230);
    c.globalAlpha = 1;
  }
  const out = ph(t, 118.5, 119.1);
  if (t > 118.4) {
    crowd(c, t, [-121 + 90 * out, -40 + 60 * out, -813 + 160 * out, -700 + 120 * out, 600 + 30 * out, 1022 - 160 * out, 900 - 100 * out], -20, { tone: 0.2, seed: 44, umbrella: false, look: E.io(ph(t, 118.7, 119.2)), s: 0.9 });
  }
  // 她的铁靴：他从里面走出来以后一直立在街上
  bigBoot(c, BX - 9, 2, 0.95, 1);
  bigBoot(c, BX + 11, 2, 0.95, 1);
  if (kidF && kidJ) {
    if (lao && t >= T_LAO_OUT) figure(c, lao, t);
    const zl = zhouLei(t, lao ? pose(lao).anR : [CX, -200]);
    if (zl) figure(c, zl, t);
    figure(c, kidF, t);
    if (t < OUT_L + 0.1) {
      // 还穿着靴子：靴子画在他脚上（盖住光脚）
      bigBoot(c, BX - 9, 2, 0.95, 1);
      bigBoot(c, BX + 11, 2, 0.95, 1);
    } else if (t < OUT_R + 0.1) bigBoot(c, BX + 11, 2, 0.95, 1);
  }
  const vy0 = k.y - (H / 2 + 400) / k.z;
  const vy1 = k.y + (H / 2 + 400) / k.z;
  // 她救过的人：一个接一个从街两边跑过来，抓住最下面那个人的脚踝
  if (t >= T_JOIN) drawRunners(c, t, st.n);
  if (t >= T_JOIN) drawChain(c, t, st, vy0, vy1, { warm: 1, glow: k.z < 0.5 ? 150 : 0 });
  // 她（白的边上）
  if (k.y - H / 2 / k.z < QIN_HIP + 300) figure(c, qinNow(t), t);
  // 白里的妈妈：张着手 → 放下了手
  const lower = E.io(ph(t, 126.9, 127.9));
  if (t > T_ANKLE) {
    c.save();
    c.translate(QTX, WHITE - 500);
    c.scale(4.5, 4.5);
    ghost(c, 0, 0, 1, 0.8 * (1 - lower * 0.6), 1 - lower, t);
    c.restore();
  }
  if (t > T_HAND) {
    const m = handMeet([QTX, QIN_HIP]);
    glowDot(c, m[0], m[1], 9, 1);
  }
  c.restore();
  ash(c, t, k, { n: 0.45 });
  // 她在白边上睁开眼：白光压下来
  const top = k.y < QIN_HIP + 1200 ? 1 : 0;
  if (top) whiteGaze(c, t, 0.45, 0, 1);
}

const s54: Shot = {
  a: 113.88,
  b: 129.87,
  draw(c, t) {
    const k0 = camAt(t);
    const hit = kick(t, STOMPS[0], 0.1);
    const k = jolt({ ...k0, z: k0.z * (1 + 0.03 * hit) }, shake(t, 14 * hit + 7 * kick(t, T_LAO_GRAB, 0.1) + 9 * kick(t, T_JOIN, 0.1) + 8 * kick(t, T_ANKLE, 0.12), 5));
    const kp = camAt(t - 1 / 60);
    const v = Math.abs((k0.y - kp.y) * k0.z) + Math.abs(Math.log(k0.z / kp.z)) * 500;
    const draw = (c: C) => drawAll(c, t, k);
    if (v > 8) smearV(c, Math.min(220, v * 0.55), draw);
    else draw(c);
    flash(c, 0.35 * kick(t, T_HAND, 0.2), "#ffd9a8");
    vignette(c, 0.35);
    // 静音里白的边上那一镜 → 「咚」：从一片白里砸出来
    flash(c, 1 - E.out(ph(t, 113.88, 114.12)), "#fffdf8");
  },
};

export const finale1Shots: Shot[] = [s54];
export type { Pt };
