// 副歌二 1:35.49–1:52 + 静 1:52–1:53.88
// S43 95.49–96.7（屋里，天快亮）：镜头从地上松开的绳结，顺着她的脚绳抬上去：她贴在天花板上睡着——两个人的结开了，门开着。她睁开眼，
//     一把一把拽着绳子下来，脚跺进靴子「咚」，扑到窗前往下看——
// S44–S51 96.6–112.0 一镜到底（窗外，全城最高那栋楼）：镜头穿出窗户顺着楼墙往下坠，落到街心：小石头光着脚站着，妈妈那件橘色外套空着摊在地上，
//     他把「妈妈，明天见」举向白——白里那个橘色的影子朝他张开手，他的脚离了地。镜头顺着楼墙甩上去：她站上窗台，跳了下去；
//     镜头跟着她往下坠，一扇扇窗擦过去，98.51「咚」砸在街上，石板炸开；她冲过去一跃，在半空抓住他的手——两个人没有落回来，一起往上升，
//     她的靴子也离了地；窗里的人看了一眼，拉上窗帘。她看看他，看看自己的铁靴——妈妈用过的办法：镜头落到靴子上，她把靴子一只一只脱下来，
//     套在他光着的脚上；松手，他一沉，104.01「咚」落回街上，一块砖从靴口滚出来：「活下去」，她写给自己的字。镜头顺着他的视线甩上去：
//     她赤着脚往上升，比谁都快，穿过天亮时还没散完的网，网上的人睁开眼看着她过去；她低头冲他笑了一下——镜头顺着她的视线落回去：
//     小石头穿着那双大靴子仰着头，和十二年前的她同一个构图（叠一下那一格）；镜头再顺着他的视线甩上去：她擦过自己的窗，升进刺眼的光里
// S52 112.0–112.9（静）：老钟坐在窗后端着茶杯，等不到她的脚步声
// S53 112.9–113.88（静）：和全片第一帧同一个构图：白的边上，她张着手，闭着眼，头发的边缘开始化成灰；白里一个锈红色的女人朝她张开手——是妈妈
import { type C, type Cam, type Shot, W, H, E, ph, kick, shake, jolt, applyCam, vignette, clamp, mix, smearV, camLerp, flash, fill } from "./core";
import { figure, pose, rope, stone, type Fig, type Pt, walk } from "./figure";
import { ash, BEDPOST, TOWER_TOP, WHITE, crack, ghost, whiteBand, sky } from "./world";
import { qinRoom, facades } from "./sets";
import { ground } from "./world";
import { bigBoot, hand } from "./props";
import { qinFloatSleep } from "./pre1";
import { webDraw } from "./web";
import { mirrorCam, GZ0 } from "./inter1";
import { LOOKS, PAL, blend, crowdLook } from "./palette";
import { pre2Tail } from "./pre2";

const lerpPt = (a: Pt, b: Pt, e: number): Pt => [mix(a[0], b[0], e), mix(a[1], b[1], e)];
const win = (t: number, a: number, b: number, c: number, d: number) => E.io(ph(t, a, b)) * (1 - E.io(ph(t, c, d)));
const aimC = (p: Pt, s: Pt, z: number): Cam => ({ x: p[0] - (s[0] - W / 2) / z, y: p[1] - (s[1] - H / 2) / z, z });
const toS = (k: Cam, p: Pt): Pt => [(p[0] - k.x) * k.z + W / 2, (p[1] - k.y) * k.z + H / 2];
/** 两个取景之间甩过去：位置 E.io，倍数中途退到 zMid（看得见一路擦过去的楼） */
function whip(a: Cam, b: Cam, e: number, zMid: number): Cam {
  const k = camLerp(a, b, E.io(e));
  const dip = Math.sin(Math.PI * clamp(e));
  return { ...k, z: Math.exp(mix(Math.log(k.z), Math.log(zMid), dip)) };
}

// ---------- 时间 ----------
const T_WAKE = 95.75; // 睁开眼
const T_PULL = 95.82; // 一把一把拽着绳子下来
const T_BOOTS = 96.263; // 脚跺进靴子「咚」
const T_WINDOW = 96.55; // 扑到窗前往下看
const T_OUT = 96.6; // 镜头穿出窗户往下坠
const T_STREET = 97.25; // 落到街心的小石头
const T_KID_UP = 97.4; // 他的脚离了地
const T_WHIP = 97.72; // 镜头顺着楼墙甩上去
const T_JUMP = 97.96; // 她跳了下去
const T_CATCH = 99.013; // 楼的一半高：她在半空里抱住往上飘的他（用户 2026-10-15）
const T_HUG = T_CATCH + 0.25;
const H_C = 4300; // 抱住时他的脚离地多高（楼的一半）
const T_STOP = 100.263; // 惯性带着两个人往下坠，快到地面时坠不动了
const H_STOP = 8; // 停住的高度：他的脚尖离石板只差一点
const RISE_V = 150; // 停住以后又开始往上飘
const T_DECIDE = 101.91; // 看看他，看看自己的铁靴
const SHUT = [100.763, 101.013, 101.263, 101.513, 101.763]; // 旁边窗里的人一个一个关上窗、关灯
const BOOT1: [number, number, number] = [102.2, 102.5, 102.78]; // 抬脚拔下来、拿过去、套上他的脚
const BOOT2: [number, number, number] = [102.85, 103.12, 103.38];
const T_RELEASE = 103.5; // 松手
const T_KID_LAND = 104.013; // 「咚」
const T_BRICK_OUT = 104.05;
const T_PICK = 104.6; // 他捡起砖
// 近景（用户：「这里改成手拿着砖块的特写，更能抒发情感」）：镜头追着滚出来的砖推到妈妈那件外套上，溶进他低头看见的近景
const CU0 = 104.62; // 近景完全溶进来
const CU_GRAB = 104.8; // 两只小手抓住砖
const CU_LIFT = 105.12; // 捧到眼前、翻正：「活下去」
const TEARS: [number, number][] = [
  [105.38, -62], // 眼泪砸在砖上（时刻、落在砖面上的横向位置）
  [105.66, 50],
];
const CU1 = 105.86; // 他抬起头：近景往下滑走，溶回顺着他的视线甩上去的镜头
const T_UPWARD = 105.93; // 镜头顺着他的视线甩上去
const T_SMILE = 106.95; // 她低头冲他笑
const T_GAZE_DOWN = 107.55; // 顺着她的视线落回去
const T_MIRROR = 107.94;
const T_GAZE_UP = 109.55;
const T_GLARE = 111.5;
const T_SILENT = 112.0;
const T_EDGE = 112.9;

// ---------- 地方：她住的那栋楼（x=0，楼顶 TOWER_TOP），楼脚下的街 ----------
export const KX = 230; // 小石头站的地方（楼脚下的街心）
export const X4 = KX; // 旧名字（活下去、尾声还在用）
const QL = 40; // 她落地的地方
const SILL = TOWER_TOP + 240; // 她窗台的高度
const COAT_X = KX - 64; // 妈妈那件外套空着摊在地上

/** 小石头的脚离地多高：越飘越快飘到楼的一半 → 被她抱住，惯性带着往下坠、越坠越慢 → 快到地面停住 → 又开始往上飘 → 她把靴子套在他脚上，松手，他落回街上 */
function kidH(t: number): number {
  if (t < T_KID_UP) return 0;
  if (t < T_CATCH) return H_C * Math.pow(ph(t, T_KID_UP, T_CATCH), 1.7);
  if (t < T_STOP) {
    const T = T_STOP - T_CATCH;
    const v0 = (2 * (H_C - H_STOP)) / T;
    const s = t - T_CATCH;
    return H_C - (v0 * s - (0.5 * v0 * s * s) / T);
  }
  if (t < T_RELEASE) {
    const s = t - T_STOP;
    return H_STOP + RISE_V * Math.max(0, s - 0.3 * (1 - Math.exp(-s / 0.3)));
  }
  if (t < T_KID_LAND) {
    const h0: number = kidH(T_RELEASE - 1e-4);
    return h0 * (1 - Math.pow(ph(t, T_RELEASE, T_KID_LAND), 2));
  }
  return 0;
}
/** 她的胯在哪（窗外） */
function qinHip(t: number): Pt {
  if (t < T_JUMP) return [12, SILL - 96];
  if (t < T_CATCH) {
    // 从窗口跳下去，越坠越快，正好在楼的一半迎上往上飘的他（按抱住的时刻反推重力）
    const s = t - T_JUMP;
    const y0 = SILL - 96 - 30;
    const yC = -H_C - 136;
    const g = (2 * (yC - y0)) / (T_CATCH - T_JUMP) ** 2;
    return [mix(12, KX - 22, E.io(ph(t, T_JUMP, T_CATCH))), y0 + 0.5 * g * s * s];
  }
  if (t < T_RELEASE + 0.02) {
    // 抱着他：一起往下坠 → 停住 → 一起往上飘
    const kh = kidH(t);
    return [KX - 22, -kh - 96 - 40 + 20 * E.io(ph(t, T_CATCH, T_HUG))];
  }
  // 赤着脚往上升，比谁都快；快到楼顶时慢下来，擦过自己的窗，升进光里
  const h0 = kidH(T_RELEASE - 1e-4) + 96 + 20;
  const u = ph(t, T_RELEASE, 111.2);
  const h = mix(h0, -TOWER_TOP - 60, 1 - Math.pow(1 - u, 2.1));
  // 先往右飘进还没散完的网（网上挂着的人睁开眼看着她过去），再飘回自己那扇窗
  const x = mix(mix(KX - 22, 600, E.io(ph(t, 103.8, 106.2))), 70, E.io(ph(t, 108.6, 110.6)));
  return [x, -h - 96 + (t > 111.2 ? -60 * (t - 111.2) : 0)];
}

// ---------- 小石头 ----------
const KID = { kind: "kid" as const, bell: true, barefoot: true, rim: 0.85 };
function kidFig(t: number): Fig {
  const h = kidH(t);
  if (t < T_CATCH) {
    // 光着脚站在街心，把砖举向白；脚离了地，两只手伸向天上
    const reach = E.io(ph(t, T_KID_UP - 0.2, T_KID_UP + 0.4));
    return { ...KID, x: KX + Math.sin(t * 1.3) * 4 * reach, y: -h, grounded: true, facing: -1, head: 1.05, aR: Math.PI - 0.2, aL: mix(-0.4, -(Math.PI - 0.5), reach), float: clamp(h / 60) * 0.6, eyes: "open", tears: 1 };
  }
  if (t < T_RELEASE) {
    // 被她抱在怀里，脸贴着她
    const q = qinHip(t);
    const hug = E.io(ph(t, T_CATCH, T_HUG));
    return { ...KID, x: mix(KX, q[0] + 26, hug), y: -h - mix(0, 18, hug), grounded: true, facing: -1, head: mix(1.0, -0.2, hug), lean: -0.1 * hug, aR: mix(Math.PI - 0.2, 0.9, hug), aL: mix(-2.5, -0.6, hug), float: 0.5, eyes: hug > 0.5 ? "closed" : "wide", tears: 1, legL: 0.15, legR: -0.12, kneeL: 0.3, kneeR: 0.2 };
  }
  // 掉下去、落地、穿着那双大靴子站在街上；捡起滚出来的砖，看
  const land = kick(t, T_KID_LAND, 0.12);
  const pick = win(t, T_PICK - 0.25, T_PICK, T_PICK + 0.2, T_PICK + 0.4);
  const read = E.io(ph(t, T_PICK + 0.2, T_PICK + 0.5));
  const lookUp = E.io(ph(t, T_UPWARD - 0.15, T_UPWARD + 0.15));
  const falling = t < T_KID_LAND;
  return { ...KID, x: KX - 12, y: -h - 10, grounded: true, facing: -1, head: falling ? 0.9 : mix(-0.6 * read, 1.05, lookUp), lean: 0.3 * pick, kneeL: 0.8 * land + 0.9 * pick, kneeR: 0.7 * land + 0.8 * pick, aL: falling ? -2.6 : read > 0 ? undefined : -0.3, aR: falling ? 2.6 : read > 0 ? undefined : 0.3, hL: read > 0.02 ? brickHand(t) : undefined, hR: read > 0.02 ? [brickHand(t)[0] + 12, brickHand(t)[1] + 2] : undefined, float: falling ? 0.4 : 0, eyes: "open", tears: 1 };
}
const brickHand = (t: number): Pt => {
  const read = E.io(ph(t, T_PICK + 0.2, T_PICK + 0.5));
  return lerpPt([KX - 40, -30], [KX - 34, -98], read);
};
/** 她靴子里滚出来的那块砖：她写给自己的「活下去」（灰白的，不暖） */
function fallenBrick(t: number): Pt | null {
  if (t < T_BRICK_OUT) return null;
  if (t < T_PICK) {
    const u = ph(t, T_BRICK_OUT, T_BRICK_OUT + 0.35);
    return [KX - 20 - 40 * u, -40 + 40 * u * u - 50 * Math.sin(Math.PI * u)];
  }
  const h = brickHand(t);
  return [h[0] + 6, h[1] - 4];
}

// ---------- 秤砣（窗外） ----------
const Q = { kind: "qin" as const, rim: 0.9 };
/** 两只靴子：她脚上 → 被她拔下来拿着 → 他脚上 */
function bootState(t: number, s: [number, number, number], qj: ReturnType<typeof pose>, kj: ReturnType<typeof pose>, side: "L" | "R"): { p: Pt; on: "qin" | "move" | "kid"; rot: number } {
  const qa = side === "L" ? qj.anL : qj.anR;
  const ka = side === "L" ? kj.anL : kj.anR;
  if (t < s[0] + 0.12) return { p: qa, on: "qin", rot: 0 };
  if (t < s[2]) {
    const e = E.io(ph(t, s[0] + 0.12, s[2]));
    return { p: lerpPt([qj.handR[0], qj.handR[1] + 10], ka, e), on: "move", rot: 0.6 * Math.sin(Math.PI * e) };
  }
  return { p: ka, on: "kid", rot: 0 };
}
function qinFig(t: number): Fig {
  const [x, y] = qinHip(t);
  if (t < T_JUMP) {
    // 站上窗台，低头往下看；蹲一下
    const crouch = E.io(ph(t, T_JUMP - 0.18, T_JUMP));
    return { ...Q, x, y: y + 20 * crouch, grounded: false, facing: 1, boots: true, head: -0.9, lean: 0.25 * crouch, kneeL: 0.6 * crouch, kneeR: 0.5 * crouch, aL: -0.5, aR: 0.6, eyes: "wide" };
  }
  // 往下坠：张开手伸向底下的他
  if (t < T_CATCH) {
    const reach = E.io(ph(t, T_CATCH - 0.25, T_CATCH));
    return { ...Q, x, y, grounded: false, facing: 1, boots: true, float: 0.7, head: mix(-0.6, -0.9, reach), aL: mix(-2.4, -0.8, reach), aR: mix(2.2, 0.9, reach), legL: 0.1, legR: -0.15, kneeL: 0.2, kneeR: 0.35, eyes: "wide" };
  }
  const kj = pose(kidFig(Math.min(t, T_RELEASE - 1e-3)));
  if (t < T_RELEASE + 0.02) {
    // 抱着他往上升，靴子离了地；看看他，看看自己的铁靴；把靴子一只一只脱下来套在他脚上
    const hug = E.io(ph(t, T_CATCH, T_HUG));
    const look = win(t, T_DECIDE, T_DECIDE + 0.15, BOOT1[0] - 0.1, BOOT1[0]); // 低头看靴子
    const bare1 = t > BOOT1[0] + 0.12;
    const bare2 = t > BOOT2[0] + 0.12;
    const up1 = win(t, BOOT1[0] - 0.12, BOOT1[0] + 0.05, BOOT1[0] + 0.15, BOOT1[0] + 0.3);
    const up2 = win(t, BOOT2[0] - 0.12, BOOT2[0] + 0.05, BOOT2[0] + 0.15, BOOT2[0] + 0.3);
    const reachGround = win(t, T_STOP - 0.55, T_STOP - 0.2, T_STOP + 0.25, T_STOP + 0.6); // 快到地面了：两只脚使劲往下够石板
    const base: Fig = { ...Q, x, y, grounded: false, facing: 1, boots: !(bare1 && bare2), barefoot: bare1 && bare2, float: 0.55 * (1 - reachGround), lean: -0.05 - 0.2 * Math.max(up1, up2), head: look > 0 ? mix(0.2, -0.95, look) : -0.3 - 0.4 * Math.max(up1, up2) - 0.5 * reachGround, legL: mix(-0.05, 0.02, reachGround), legR: mix(0.12, -0.02, reachGround), kneeL: mix(0.3, 0, reachGround), kneeR: mix(0.4, 0, reachGround), eyes: t > T_DECIDE + 0.3 ? "open" : "wide", tears: t > T_STOP ? 1 : 0 };
    const j0 = pose(base);
    if (up1 > 0) base.fR = lerpPt(j0.anR, [x + 26, y + 30], up1);
    if (up2 > 0) base.fL = lerpPt(j0.anL, [x + 22, y + 34], up2);
    const holdK: Pt = [kj.neck[0] + 4, kj.neck[1] + 16];
    let hR: Pt = lerpPt([kj.handL[0] - 4, kj.handL[1] + 4], [kj.hip[0] + 4, kj.hip[1] - 4], hug);
    for (const b of [BOOT1, BOOT2]) {
      const go = win(t, b[0] - 0.08, b[0] + 0.1, b[2] - 0.02, b[2] + 0.1);
      if (go > 0) {
        const jj = pose(base);
        const e = E.io(ph(t, b[0] + 0.12, b[2]));
        const from: Pt = b === BOOT1 ? jj.anR : jj.anL;
        const to: Pt = b === BOOT1 ? kj.anR : kj.anL;
        hR = lerpPt(hR, lerpPt([from[0], from[1] - 6], [to[0], to[1] - 8], e), go);
      }
    }
    return { ...base, hL: lerpPt([x + 10, y - 40], holdK, hug), hR };
  }
  // 赤着脚往上升；低头冲他笑；擦过自己的窗，升进光里
  const smile = t > T_SMILE;
  const lookDown = win(t, T_SMILE - 0.3, T_SMILE, 109.9, 110.3);
  return { ...Q, x, y, grounded: false, facing: 1, barefoot: true, boots: false, float: 1, lean: 0.05, aL: -2.5 + Math.sin(t * 1.2) * 0.1, aR: 2.4, legL: 0.05, legR: -0.08, kneeL: 0.25, kneeR: 0.3, head: lookDown > 0 ? mix(0.6, -0.9, lookDown) : 0.6, eyes: smile && t < 110.3 ? "smile" : t > 110.3 ? "closed" : "open", tears: 1 };
}

/** 旁边窗里的人：探出头看着两个人坠下来、停住、又往上飘——一个一个关上窗、拉上窗帘、关了灯（用户：「旁边的人关窗户，这样更绝望」） */
const WITNESS: [number, number][] = [
  [118, -420],
  [330, -430],
  [96, -640],
  [352, -600],
  [128, -860],
];
function witnesses(c: C, t: number, pair: Pt) {
  WITNESS.forEach(([x, y], i) => {
    const at = SHUT[i];
    const back = E.io(ph(t, at - 0.3, at - 0.05)); // 缩回屋里
    const shut = E.io(ph(t, at - 0.08, at)); // 两扇窗「啪」地合上
    const curtain = E.io(ph(t, at + 0.05, at + 0.3));
    const dark = E.io(ph(t, at + 0.35, at + 0.6)); // 灯也关了
    c.fillStyle = blend("#f7d27a", "#5d5878", dark);
    c.fillRect(x - 40, y - 50, 80, 100);
    if (curtain < 1) {
      c.save();
      c.beginPath();
      c.rect(x - 40, y - 50, 80, 100);
      c.clip();
      // 看着他们：头跟着两个人转
      const dy = pair[1] - y;
      const head = clamp(dy / 500, -0.8, 0.8);
      figure(c, { x: x + (i % 2 ? 8 : -8) + (i % 2 ? 10 : -10) * back, y: y + 60 + 14 * back, s: 0.75 * (1 - 0.15 * back), kind: (["plain", "woman", "man", "old", "woman"] as const)[i], facing: x < pair[0] ? 1 : -1, head: mix(head, -0.7, back), look: crowdLook(i * 5 + 2), tone: 0.1 + 0.3 * back, rim: 0.3, tie: false, hL: back < 0.5 ? [x + (x < pair[0] ? 20 : -20), y + 10] : undefined }, t);
      c.restore();
    }
    // 窗帘拉上
    c.fillStyle = blend(blend("#b98fa8", "#6d5a80", 0.3), "#3f3a58", dark * 0.6);
    c.fillRect(x - 40, y - 50, 40 * curtain, 100);
    c.fillRect(x + 40 - 40 * curtain, y - 50, 40 * curtain, 100);
    // 两扇窗：开着时朝外推开（只看得见窄窄的侧边），合上时盖住窗口
    c.strokeStyle = "#8a6f7a";
    c.lineWidth = 6;
    const wHalf = 40 * mix(0.18, 1, shut);
    c.strokeRect(x - 40 - (1 - shut) * 14, y - 50, wHalf, 100);
    c.strokeRect(x + 40 + (1 - shut) * 14 - wHalf, y - 50, wHalf, 100);
    if (shut > 0.02) {
      c.fillStyle = `rgba(220,232,245,${0.25 * shut})`;
      c.fillRect(x - 40, y - 50, 80 * shut, 100);
    }
    c.fillStyle = "#8a6f7a";
    c.fillRect(x - 46, y - 56, 92, 6);
    c.fillRect(x - 46, y + 50, 92, 6);
  });
}

/** 白里的人影：朝下面的人张开手（画在画面坐标里） */
function vision(c: C, x: number, y: number, s: number, a: number, col: string, t: number) {
  if (a <= 0.01) return;
  c.save();
  const g = c.createRadialGradient(x, y, 0, x, y, 420 * s);
  g.addColorStop(0, `rgba(255,252,246,${0.7 * a})`);
  g.addColorStop(1, "rgba(255,252,246,0)");
  c.fillStyle = g;
  c.fillRect(x - 420 * s, y - 420 * s, 840 * s, 840 * s);
  c.translate(x, y);
  c.scale(s, s);
  figure(c, { x: 0, y: 0, grounded: false, kind: "woman", facing: 1, aL: -2.2, aR: 2.2, bendL: 0.1, bendR: -0.1, float: 0.35, rim: 0, ink: 0.1, alpha: a * 0.65, eyes: "closed", look: { skin: "#fff3ea", hair: blend(col, "#ffffff", 0.55), top: blend(col, "#ffffff", 0.45), bottom: blend(col, "#ffffff", 0.55), shoe: "#fff3ea", legs: blend(col, "#ffffff", 0.6) } }, t);
  c.restore();
}

// ---------- 镜头（窗外一镜到底） ----------
const winCam = aimC([10, SILL - 140], [W / 2, 820], 2.3);
const kidCam = (t: number) => aimC([KX - 10, -kidH(t) - 120], [W / 2, 1120], mix(2.3, 2.55, ph(t, T_STREET, T_WHIP)));
/** 她跳下去以后：镜头退开，两个人都在画面里——她从白底下往下坠，他在楼的一半往上飘；越近推得越近，撞上 */
const fallCam = (t: number) => {
  const q = qinHip(t);
  const top = q[1] - 150;
  const bot = -kidH(t) + 30;
  const z = Math.max(0.24, Math.min(2.0, 1450 / Math.max(1, bot - top)));
  // 他还没进画面时，让她留在画面上半截
  const cy = Math.min((top + bot) / 2, top + 0.78 * (H / 2 / z));
  return aimC([mix(q[0], KX, 0.5), cy], [W / 2, H / 2], z);
};
/** 抱住以后一起往下坠，越坠越慢：镜头跟着两个人，街面从画面底下升上来——停在她的靴底离石板只差一点的地方 */
const pairCam = (t: number) => {
  const kh = kidH(t);
  const near = E.io(clamp(1 - (kh - H_STOP) / 1100));
  const hush = E.io(ph(t, T_STOP - 0.3, T_STOP + 0.3)); // 停住的那一下：推近靴底和石板之间那一点缝
  return aimC([KX - 14, -kh - mix(110, 70, hush)], [W / 2, mix(860, 980, near)], mix(1.9, 2.5, near) * (1 + 0.12 * hush));
};
/** 又开始往上飘：镜头跟着她，慢慢退开——两边的窗一扇一扇关上 */
const riseCam = (t: number) => {
  const q = qinHip(t);
  return aimC([q[0] + 20, q[1] - 20], [W / 2, 900], mix(2.4, 1.75, E.io(ph(t, T_STOP + 0.3, SHUT[SHUT.length - 1] + 0.3))));
};
const bootsCam = (t: number) => {
  const q = qinHip(t);
  return aimC([q[0] + 22, q[1] + 60], [W / 2, 900], 3.0 * (1 + 0.06 * E.out(ph(t, BOOT1[0], T_RELEASE))));
};
const dropCam = (t: number) => aimC([KX - 12, -kidH(t) - 90], [W / 2, 1000], 2.6);
const groundCam = (t: number) => aimC([KX - 20, -80], [W / 2, 1150], 2.7 * (1 + 0.05 * ph(t, T_KID_LAND, T_PICK)));
const brickCam = aimC([KX - 28, -100], [W / 2, 1000], 4.4);
const brickFloor = aimC([KX - 60, 0], [W / 2, 1000], 6.5); // 落在妈妈外套上的那块砖（和近景里砖的位置、大小对上）
const herCam = (t: number) => {
  const q = qinHip(t);
  return aimC([q[0], q[1] - 30], [W / 2, 820], 1.3);
};
const herClose = (t: number) => {
  const q = qinHip(t);
  return aimC([q[0] + 4, q[1] - 70], [W / 2, 820], 3.0);
};
function camOut(t: number): Cam {
  if (t < T_STREET) return whip(winCam, kidCam(T_STREET), ph(t, T_OUT, T_STREET), 0.32); // 穿出窗户，顺着楼墙往下坠
  if (t < T_WHIP) return kidCam(t);
  if (t < T_JUMP) return whip(kidCam(T_WHIP), winCam, ph(t, T_WHIP, T_JUMP - 0.04), 0.3); // 顺着楼墙甩上去：她站上窗台
  if (t < T_CATCH) return camLerp(winCam, fallCam(t), E.io(ph(t, T_JUMP, T_JUMP + 0.3))); // 她跳下去，镜头退开：他在楼的一半往上飘，迎上来
  if (t < T_STOP + 0.25) return camLerp(fallCam(T_CATCH), pairCam(t), E.out(ph(t, T_CATCH, T_CATCH + 0.25))); // 抱住：一起往下坠，越坠越慢
  let k = camLerp(pairCam(T_STOP + 0.25), riseCam(t), E.io(ph(t, T_STOP + 0.25, T_STOP + 0.9))); // 停住了——又开始往上飘
  if (t < T_DECIDE) return k;
  // 她低头看靴子：镜头落到靴子上，跟着靴子走，越推越慢
  k = camLerp(k, bootsCam(t), E.io(ph(t, T_DECIDE, BOOT1[0] + 0.1)));
  if (t < T_RELEASE) return k;
  // 松手：镜头跟着他往下掉
  const kd = camLerp(bootsCam(T_RELEASE), dropCam(t), E.io(ph(t, T_RELEASE, T_RELEASE + 0.2)));
  if (t < T_KID_LAND) return kd;
  // 落地；砖从靴口滚出来——镜头追着它推到落在妈妈外套上的那块砖，溶进近景
  k = camLerp(dropCam(T_KID_LAND), groundCam(t), E.out(ph(t, T_KID_LAND, T_KID_LAND + 0.3)));
  k = camLerp(k, brickFloor, E.io(ph(t, 104.18, CU0 - 0.06)));
  k = camLerp(k, brickCam, E.io(ph(t, CU_GRAB, CU1 - 0.2))); // 近景盖着的时候换回他捧着砖的中景，好接甩上去
  if (t < T_UPWARD) return k;
  // 顺着他的视线甩上去：她赤着脚往上升，穿过网；她低头冲他笑——推近她的脸
  k = whip(brickCam, herCam(t), ph(t, T_UPWARD, T_UPWARD + 0.42), 0.35);
  k = camLerp(k, herClose(t), E.io(ph(t, T_SMILE - 0.45, T_SMILE)));
  if (t < T_GAZE_DOWN) return k;
  // 顺着她的视线落回去：穿着大靴子仰着头的小石头（构图 A，和十二年前同一个）
  const mc = (s: number) => mirrorCam(s, T_MIRROR, KX - 12);
  if (t < T_MIRROR) return whip(herClose(T_GAZE_DOWN), mc(T_MIRROR), ph(t, T_GAZE_DOWN, T_MIRROR), 0.3);
  if (t < T_GAZE_UP) return mc(t);
  // 再顺着他的视线甩上去：她擦过自己的窗，升进光里
  const top = (s: number) => {
    const q = qinHip(s);
    return aimC([q[0] - 40, q[1] - 10], [W / 2, 900], mix(2.0, 1.4, ph(s, 110.3, T_SILENT)));
  };
  return whip(mc(T_GAZE_UP), top(t), ph(t, T_GAZE_UP, T_GAZE_UP + 0.42), 0.3);
}

// ---------- 画 ----------
/** 窗外的世界：天、白、城、她那栋楼（窗开着）、天亮时还没散完的网、楼脚下的街 */
function drawOut(c: C, t: number, k: Cam) {
  const q = qinHip(t);
  webDraw(c, t, { cam: k, dawn: 0.42, noQin: true, wake: t > T_RELEASE ? { x: q[0], y: q[1], r: 1300 } : undefined });
  c.save();
  applyCam(c, k);
  // 她的窗开着，防飘栏推开了
  c.fillStyle = "#fffaf0";
  c.fillRect(-140, TOWER_TOP + 70, 280, 170);
  c.save();
  c.translate(-140, TOWER_TOP + 70);
  c.transform(0.3, 0.06, 0, 1, 0, 0);
  c.fillStyle = "#6b5a6e";
  for (let i = 0; i <= 6; i++) c.fillRect(i * 46, 0, 6, 170);
  c.restore();
  // 屋里：倒钉在天花板上的床、一屋子的砖（她升过去的时候看得见）
  if (t > 109.5) {
    c.fillStyle = "#e8b8a6";
    c.fillRect(-120, TOWER_TOP + 76, 200, 14);
    c.fillStyle = "#d8c9c6";
    for (let i = 0; i < 9; i++) c.fillRect(-120 + i * 26, TOWER_TOP + 220, 22, 14);
  }
  // 楼脚下的街
  facades(c, k, {});
  ground(c, k, {});
  witnesses(c, t, q);
  // 妈妈那件外套空着摊在地上
  c.fillStyle = "#f39a5f";
  c.beginPath();
  c.ellipse(COAT_X, -8, 34, 9, 0.05, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#6b6a80";
  for (let i = 0; i < 4; i++) c.fillRect(COAT_X - 26 + i * 15, -6, 8, 6);
  crack(c, KX - 12, 0, 70, ph(t, T_KID_LAND, T_KID_LAND + 0.18));
  puff(c, t, T_KID_LAND, KX - 12, 120, 0.7);
  // 人
  const kf = kidFig(t);
  // 往上飘的人身上带着一团暖光（远看像一盏灯，和前奏里满天飘的人一样）：他飘得越高越亮；被她抱住的那一下暖光炸开
  const glow = t < T_CATCH ? clamp((kidH(t) - 40) / 600) : Math.max(0, 1 - (t - T_CATCH) / 0.9);
  if (glow > 0.01) {
    const cy = kf.y - 70;
    const r = Math.max(90, 46 / k.z) * (t < T_CATCH ? 1 : 1 + 2.6 * E.out(clamp((t - T_CATCH) / 0.9)));
    const g = c.createRadialGradient(kf.x, cy, 0, kf.x, cy, r);
    g.addColorStop(0, `rgba(255,226,170,${0.85 * glow})`);
    g.addColorStop(0.35, `rgba(255,196,160,${0.42 * glow})`);
    g.addColorStop(1, "rgba(255,210,190,0)");
    c.fillStyle = g;
    c.fillRect(kf.x - r, cy - r, r * 2, r * 2);
  }
  // 她往下坠：身后拖着几道风的线，远看是一道往下砸的影子
  if (t > T_JUMP && t < T_CATCH) {
    const [hx, hy] = qinHip(t);
    const v = (t - T_JUMP) / (T_CATCH - T_JUMP);
    const px = 1 / k.z;
    const halo = c.createRadialGradient(hx, hy - 40, 0, hx, hy - 40, Math.max(110, 44 * px));
    halo.addColorStop(0, "rgba(255,250,246,0.55)");
    halo.addColorStop(1, "rgba(255,250,246,0)");
    c.fillStyle = halo;
    c.fillRect(hx - 300 * Math.max(1, px / 2.5), hy - 340 * Math.max(1, px / 2.5), 600 * Math.max(1, px / 2.5), 600 * Math.max(1, px / 2.5));
    c.strokeStyle = "rgba(255,250,246,0.6)";
    c.lineCap = "round";
    c.lineWidth = Math.max(3, 2.5 * px);
    for (let i = 0; i < 5; i++) {
      const ox = (i - 2) * 26 + (i % 2 ? 6 : -6);
      const len = (120 + 260 * v) * (0.7 + 0.15 * (i % 3)) * Math.max(1, px / 3);
      const y0 = hy - 170 - (i % 2) * 30;
      c.beginPath();
      c.moveTo(hx + ox, y0);
      c.lineTo(hx + ox, y0 - len);
      c.stroke();
    }
  }
  const kj = figure(c, kf, t);
  // 他手里那块「妈妈，明天见」
  if (t < T_CATCH + 0.4) stone(c, kj.handR[0], kj.handR[1] - 12, 11, "妈妈，明天见", 0.2, 0.05);
  let qj: ReturnType<typeof pose> | null = null;
  if (t > T_WHIP - 0.3) qj = figure(c, qinFig(t), t);
  // 靴子：在她脚上（figure 画）→ 拿在手里 → 套到他脚上
  if (qj && t > BOOT1[0] && t < 120) {
    for (const [b, side] of [
      [BOOT1, "R"],
      [BOOT2, "L"],
    ] as [[number, number, number], "L" | "R"][]) {
      if (t < b[0] + 0.12) continue;
      const st = bootState(t, b, qj, kj, side);
      bigBoot(c, st.p[0], st.p[1] + 2, 1, -1, st.rot);
    }
  }
  if (t > T_RELEASE) {
    bigBoot(c, kj.anL[0], kj.anL[1] + 2, 1, -1, 0);
    bigBoot(c, kj.anR[0], kj.anR[1] + 2, 1, -1, 0);
  }
  const fb = fallenBrick(t);
  if (fb) stone(c, fb[0], fb[1], t > T_PICK ? 12 : 10, "活下去", 0, t > T_PICK ? -0.06 : 1.2);
  c.restore();
  // 白里那个橘色的影子（他的妈妈）
  const his = win(t, T_STREET, T_STREET + 0.3, T_WHIP, T_WHIP + 0.1);
  vision(c, W / 2 - 60, 330, 1.9, his, "#f39a5f", t);
}
function puff(c: C, t: number, at: number, x: number, size: number, dur: number) {
  const u = t - at;
  if (u < 0 || u > dur) return;
  c.save();
  c.fillStyle = PAL.ash;
  c.globalAlpha = 0.85 * (1 - u / dur);
  for (let i = 0; i < 14; i++) {
    const a = (i / 13) * Math.PI;
    const r = 14 + u * size * (0.7 + (i % 3) * 0.2);
    c.beginPath();
    c.ellipse(x + Math.cos(a) * r * 1.4, -6 - Math.sin(a) * r * 0.25 - u * 20, 8 + u * 26, 5 + u * 12, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
/** 近景（他低头看见的）：砖落在妈妈那件空外套上，脚上是她的铁靴；两只小手伸过去捡起来、捧到眼前翻正——「活下去」，
 *  她每晚写给自己、塞进靴子里的字；眼泪一滴一滴砸在砖上。画在画面坐标里，外面一层溶进溶出 */
const KID_SLEEVE = LOOKS.kid.top;
const KID_SKIN = LOOKS.kid.skin;
function brickClose(c: C, t: number) {
  const reach = E.out(ph(t, CU0 - 0.12, CU_GRAB)); // 两只手伸过去
  const grip = E.io(ph(t, CU_GRAB - 0.05, CU_GRAB + 0.06));
  const lift = E.io(ph(t, CU_GRAB + 0.04, CU_LIFT)); // 捧到眼前
  const push = 1 + 0.1 * E.out(ph(t, CU_LIFT, CU1)); // 捧着看的时候镜头慢慢往里推
  const tilt = E.in2(ph(t, CU1 - 0.06, CU1 + 0.2)); // 他抬头：画面往下滑走
  const tremble = lift * Math.sin(t * 23) * 2.4; // 手在抖
  const squeeze = Math.max(0, ...TEARS.map(([tt]) => win(t, tt - 0.05, tt + 0.05, tt + 0.25, tt + 0.5))); // 眼泪落下时攥紧
  c.save();
  c.translate(W / 2, 980 + tilt * 1150);
  c.scale(push, push);
  c.translate(-W / 2, -980);
  // ---- 地面（捧起砖以后虚掉）：石板、他落地砸出的裂纹、妈妈那件外套、脚上她的铁靴 ----
  c.save();
  if (lift > 0.02) c.filter = `blur(${(10 * lift).toFixed(1)}px)`;
  c.fillStyle = "#ddd3dc";
  c.fillRect(-300, -600, W + 600, H + 1800);
  c.strokeStyle = "rgba(120,100,125,0.3)";
  c.lineWidth = 5;
  for (let i = 0; i < 16; i++) {
    const y = -200 + i * 160;
    c.beginPath();
    for (let x = -300; x < W + 300; x += 180) {
      c.moveTo(x + (i % 2) * 90, y);
      c.quadraticCurveTo(x + (i % 2) * 90 + 90, y - 18, x + (i % 2) * 90 + 170, y);
    }
    c.stroke();
  }
  c.strokeStyle = "rgba(90,70,95,0.6)";
  c.lineWidth = 7;
  c.lineCap = "round";
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * (0.12 + 0.76 * (i / 8));
    const len = 260 + ((i * 97) % 300);
    c.beginPath();
    c.moveTo(560, 1780);
    c.lineTo(560 + Math.cos(a) * len * 0.5 + ((i * 37) % 40) - 20, 1780 + Math.sin(a) * len * 0.5);
    c.lineTo(560 + Math.cos(a) * len, 1780 + Math.sin(a) * len);
    c.stroke();
  }
  // 妈妈那件橘色外套，空着摊在地上（下摆一排铅块）
  c.fillStyle = "#f39a5f";
  c.strokeStyle = "#3e3149";
  c.lineWidth = 6;
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(330, 790);
  c.lineTo(470, 760);
  c.lineTo(600, 762);
  c.lineTo(740, 800);
  c.lineTo(930, 900);
  c.lineTo(880, 990);
  c.lineTo(770, 950);
  c.lineTo(790, 1250);
  c.lineTo(300, 1262);
  c.lineTo(318, 960);
  c.lineTo(170, 1010);
  c.lineTo(130, 920);
  c.closePath();
  c.fill();
  c.stroke();
  c.strokeStyle = "#d77d48";
  c.lineWidth = 8;
  for (const [x0, y0, x1, y1] of [
    [420, 820, 400, 1200],
    [640, 830, 680, 1190],
    [520, 790, 540, 1240],
  ]) {
    c.beginPath();
    c.moveTo(x0, y0);
    c.quadraticCurveTo((x0 + x1) / 2 + 30, (y0 + y1) / 2, x1, y1);
    c.stroke();
  }
  c.fillStyle = "#6b6a80";
  for (let i = 0; i < 9; i++) c.fillRect(320 + i * 52, 1222, 34, 26);
  // 他脚上她的那双铁靴（画面最下面，靴尖朝前）
  for (const [x, y] of [
    [410, 1830],
    [680, 1850],
  ]) {
    c.fillStyle = "#5d3f34";
    c.strokeStyle = "#3e3149";
    c.lineWidth = 9;
    c.beginPath();
    c.moveTo(x - 115, y + 260);
    c.lineTo(x - 115, y - 60);
    c.quadraticCurveTo(x - 115, y - 190, x, y - 190);
    c.quadraticCurveTo(x + 115, y - 190, x + 115, y - 60);
    c.lineTo(x + 115, y + 260);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = "rgba(255,235,220,0.25)";
    c.beginPath();
    c.ellipse(x - 30, y - 110, 40, 22, -0.3, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  // ---- 砖：落在外套上 → 捧到眼前，翻正 ----
  const bx = W / 2 + tremble * 0.6;
  const by = mix(1000, 860, lift) + tremble;
  const r = mix(65, 185, lift);
  const rot = mix(1.2, -0.04, lift);
  if (lift < 0.95) {
    c.fillStyle = `rgba(60,40,70,${0.28 * (1 - lift)})`;
    c.beginPath();
    c.ellipse(bx + 14 + 60 * lift, by + 18 + 120 * lift, r * 1.15, r * 0.75, rot, 0, Math.PI * 2);
    c.fill();
  }
  stone(c, bx, by, r, "活下去", 0, rot);
  // 眼泪的湿印：砸在字上，慢慢洇开
  for (const [tt, dx] of TEARS) {
    const u = ph(t, tt, tt + 0.35);
    if (t < tt) continue;
    c.fillStyle = "rgba(70,60,100,0.32)";
    c.beginPath();
    c.ellipse(bx + dx, by - 12, 12 + 26 * E.out(u), 9 + 19 * E.out(u), 0.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.45)";
    c.beginPath();
    c.ellipse(bx + dx - 7, by - 18, 4 + 5 * u, 2.5 + 2.5 * u, 0.2, 0, Math.PI * 2);
    c.fill();
  }
  // ---- 两只小手：从画面下面（他身上）伸过去，捧住砖的两个下角 ----
  const hs = 1.75 * (r / 185);
  const g = mix(0.1, 0.72, grip) + 0.18 * squeeze;
  for (const side of [-1, 1] as const) {
    const grab: Pt = [bx + side * (1.02 * r - 10 * hs), by + 0.62 * r + 22 * hs];
    const far: Pt = [bx + side * 300, 2300];
    const p = lerpPt(far, grab, reach);
    const ang = side < 0 ? -1.047 : 1.047;
    // 前臂：从画面下面（他身上）伸过来，离镜头越近越粗
    const wrist: Pt = [p[0] + side * 0.5 * 40 * hs, p[1] + 0.87 * 40 * hs];
    const base: Pt = [bx + side * 330, H + 160];
    const nx = -(base[1] - wrist[1]);
    const ny = base[0] - wrist[0];
    const nl = Math.hypot(nx, ny) || 1;
    const w0 = 22 * hs;
    const w1 = 120;
    const arm = () => {
      c.beginPath();
      c.moveTo(wrist[0] + (nx / nl) * w0, wrist[1] + (ny / nl) * w0);
      c.lineTo(base[0] + (nx / nl) * w1, base[1] + (ny / nl) * w1);
      c.lineTo(base[0] - (nx / nl) * w1, base[1] - (ny / nl) * w1);
      c.lineTo(wrist[0] - (nx / nl) * w0, wrist[1] - (ny / nl) * w0);
      c.closePath();
    };
    c.lineJoin = "round";
    c.strokeStyle = "#3e3149";
    c.lineWidth = 8;
    c.fillStyle = KID_SLEEVE;
    arm();
    c.fill();
    c.stroke();
    // 袖子上的一道亮
    c.strokeStyle = "rgba(255,255,255,0.22)";
    c.lineWidth = 10;
    c.beginPath();
    c.moveTo(wrist[0] + (nx / nl) * w0 * 0.4, wrist[1] + (ny / nl) * w0 * 0.4);
    c.lineTo(base[0] + (nx / nl) * w1 * 0.4, base[1] + (ny / nl) * w1 * 0.4);
    c.stroke();
    hand(c, p[0], p[1], hs, ang, { grip: g, left: side > 0, tone: KID_SLEEVE, skin: KID_SKIN });
  }
  // ---- 眼泪：从画面上面（他的脸）掉下来 ----
  for (const [tt, dx] of TEARS) {
    const u = ph(t, tt - 0.36, tt);
    if (u <= 0) continue;
    if (u < 1) {
      const y = mix(80, by - 12, u * u);
      const sz = mix(62, 26, u);
      c.fillStyle = "rgba(225,238,255,0.92)";
      c.strokeStyle = "rgba(110,130,185,0.75)";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(bx + dx, y - sz * 1.7);
      c.quadraticCurveTo(bx + dx + sz * 1.05, y + sz * 0.1, bx + dx, y + sz);
      c.quadraticCurveTo(bx + dx - sz * 1.05, y + sz * 0.1, bx + dx, y - sz * 1.7);
      c.fill();
      c.stroke();
      c.fillStyle = "rgba(255,255,255,0.95)";
      c.beginPath();
      c.ellipse(bx + dx - sz * 0.3, y - sz * 0.2, sz * 0.18, sz * 0.3, 0.3, 0, Math.PI * 2);
      c.fill();
    } else {
      // 砸开的一圈小水珠
      const v = ph(t, tt, tt + 0.18);
      if (v < 1) {
        c.fillStyle = `rgba(225,238,255,${0.85 * (1 - v)})`;
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI * (0.1 + 0.2 * i);
          c.beginPath();
          c.arc(bx + dx + Math.cos(a) * 40 * v, by - 12 + Math.sin(a) * 26 * v, 5 * (1 - v) + 2, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
  }
  // ---- 还在下的灰 ----
  c.fillStyle = "rgba(255,250,252,0.85)";
  for (let i = 0; i < 16; i++) {
    const x = ((i * 137 + 40) % 1160) - 40 + Math.sin(t * 1.3 + i) * 18;
    const y = (((i * 331) % 2000) + (t - CU0) * (70 + (i % 3) * 30)) % 2000 - 40;
    c.beginPath();
    c.arc(x, y, 4 + (i % 4) * 1.6, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  vignette(c, 0.42);
}

/** 屋里（天快亮）：绳结开了；她贴在天花板上睡着 → 醒来 → 拽着绳子下来 → 脚跺进靴子 → 扑到窗前 */
function roomP(t: number) {
  return 1 - E.io(ph(t, T_PULL, T_BOOTS - 0.12));
}
function drawRoom(c: C, t: number, k: Cam) {
  c.save();
  applyCam(c, k);
  qinRoom(c, t, { night: 0.45, boots: t < T_BOOTS - 0.08 ? 1 : undefined, glare: 1, doorOpen: 1 });
  // 地上：他解开的那截红绳，空着
  rope(c, [-150, -4], [-60, -8], 4, 2.6);
  if (t < T_BOOTS - 0.1) {
    const p = roomP(t);
    const f = qinFloatSleep(t, p, { eyes: t > T_WAKE ? "wide" : "closed" });
    const pre = pose(f);
    const pulling = t > T_PULL;
    const hand: Pt = [mix(pre.anR[0], BEDPOST[0], 0.5), mix(pre.anR[1], BEDPOST[1], 0.5)];
    const j = figure(c, pulling ? { ...f, hR: hand, hL: [hand[0] + 24, hand[1] - 10 + Math.sin(t * 30) * 8] } : f, t);
    rope(c, BEDPOST, j.anR, pulling ? 0 : 6, 3.2);
  } else {
    const go = E.io(ph(t, T_BOOTS, T_WINDOW));
    const w = walk((t - T_BOOTS) * 2.6, go < 1 ? 0.6 : 0);
    const x = mix(-40, 40, go);
    const j = figure(c, { ...Q, x, y: 0, facing: 1, boots: true, lean: go < 1 ? 0.3 : 0.4, legL: w.legL, legR: w.legR, kneeL: w.kneeL + 0.5 * kick(t, T_BOOTS, 0.12), kneeR: w.kneeR, head: go < 1 ? 0.2 : -0.6, hL: go > 0.8 ? [x + 60, -200] : undefined, eyes: "wide" }, t);
    rope(c, BEDPOST, j.anR, 30, 3.2);
  }
  c.restore();
}
const roomCam = (t: number): Cam => {
  const rope0 = aimC([-110, -10], [W / 2, 1050], 4.0);
  const up = aimC([-250, -420], [W / 2, 900], 2.4);
  let k = camLerp(rope0, up, E.io(ph(t, 95.55, 95.85)));
  const win0 = aimC([30, -350], [W / 2, 900], 2.2);
  k = camLerp(k, win0, E.io(ph(t, 96.0, T_WINDOW)));
  // 穿出窗户
  return { ...k, z: k.z * Math.exp(1.2 * E.in2(ph(t, T_WINDOW, T_OUT + 0.12))) };
};

const s43: Shot = {
  a: 95.49,
  b: 112.0,
  draw(c, t) {
    if (t < T_OUT + 0.12) {
      const k = jolt(roomCam(t), shake(t, 9 * kick(t, T_BOOTS, 0.1), 3));
      if (t < T_OUT) {
        drawRoom(c, t, k);
        vignette(c, 0.45);
        // 从掉在地上的那块砖溶过来：同一块地板，一夜过去，天快亮了
        const e = E.io(ph(t, 95.49, 95.85));
        if (e < 1) {
          c.save();
          c.globalAlpha = 1 - e;
          pre2Tail(c, Math.min(t, 95.489));
          c.restore();
        }
        return;
      }
      // 穿出窗户：屋子 → 窗外（溶在拖影里）
      const e = E.io(ph(t, T_OUT, T_OUT + 0.12));
      smearV(c, 120, (c) => {
        drawRoom(c, t, k);
        c.save();
        c.globalAlpha = e;
        drawOut(c, t, camOut(t));
        c.restore();
      });
      return;
    }
    const k0 = camOut(t);
    const k = jolt({ ...k0, z: k0.z * (1 + 0.05 * kick(t, T_CATCH, 0.12) + 0.03 * kick(t, T_KID_LAND, 0.12)) }, shake(t, 22 * kick(t, T_CATCH, 0.12) + 14 * kick(t, T_KID_LAND, 0.12), 7));
    const kp = camOut(t - 1 / 60);
    const v = Math.abs((k0.y - kp.y) * k0.z) + Math.abs(Math.log(k0.z / kp.z)) * 500;
    const draw = (c: C) => drawOut(c, t, k);
    if (v > 6) smearV(c, Math.min(220, v * 0.6), draw);
    else draw(c);
    // 近景：他捡起她的砖，捧在手里看（推到地上的砖时溶进来，他抬头时往下滑走、溶回去）
    const ce = win(t, CU0 - 0.14, CU0, CU1 - 0.02, CU1 + 0.2);
    if (ce > 0.01) {
      c.save();
      c.globalAlpha = ce;
      if (t > CU1 - 0.06) smearV(c, 160 * Math.sin(Math.PI * ph(t, CU1 - 0.06, CU1 + 0.2)), (c) => brickClose(c, t));
      else brickClose(c, t);
      c.restore();
    }
    // 构图 A：叠一下十二年前那一格（七岁的她，穿着同一双大靴子）
    const past = win(t, T_MIRROR, T_MIRROR + 0.12, T_MIRROR + 0.45, T_MIRROR + 0.8);
    if (past > 0.01) {
      c.save();
      c.globalAlpha = 0.45 * past;
      c.filter = "sepia(0.7)";
      applyCam(c, mirrorCam(t, T_MIRROR, KX - 12));
      figure(c, { x: KX - 12, y: -10, kind: "little", facing: -1, head: 1.0, barefoot: true, aL: -0.15, aR: 0.15, rim: 0.4 }, t);
      bigBoot(c, KX - 18, -12, 1, -1, 0);
      c.restore();
    }
    // 她升进刺眼的光里
    const glare = E.io(ph(t, T_GLARE, T_SILENT));
    if (glare > 0.01) fill(c, "#fffdf8", glare);
    vignette(c, 0.35);
    void GZ0;
  },
};

// ---------- 静：老钟坐在窗后端着茶杯，等不到她的脚步声 ----------
const s52: Shot = {
  a: T_SILENT,
  b: T_EDGE,
  xin: 0.3,
  draw(c, t) {
    fill(c, "#d9cfe2");
    const z = 3.0 * (1 + 0.015 * ph(t, T_SILENT, T_EDGE));
    c.save();
    c.translate(W / 2, 1000);
    c.scale(z, z);
    // 一楼的窗：亮着灯，窗台上一只茶杯
    c.fillStyle = "#c9b4de";
    c.fillRect(-300, -420, 600, 700);
    c.fillStyle = "#f7d27a";
    c.fillRect(-120, -210, 240, 260);
    figure(c, { x: 10, y: 46, kind: "old", facing: -1, head: -0.15, hR: [-30, -36], hL: [-24, -30], rim: 0.5, eyes: "open", tone: 0 }, t);
    c.fillStyle = "#ffffff";
    c.fillRect(-36, -44, 14, 12);
    c.fillStyle = "#8a6a5a";
    c.fillRect(-130, -216, 260, 10);
    c.fillRect(-130, 46, 260, 12);
    c.restore();
    ash(c, t, { x: 0, y: -200, z: 2 }, { n: 0.3, speed: 0.6 });
    vignette(c, 0.45);
  },
};

// ---------- 静：白的边上（和全片第一帧同一个构图） ----------
const s53: Shot = {
  a: T_EDGE,
  b: 113.88,
  xin: 0.25,
  draw(c, t) {
    const chest: Pt = [0, -8940];
    const k: Cam = { ...aimC(chest, [540, 700], 3.7 * (1 + 0.03 * ph(t, T_EDGE, 113.88))), r: -0.03 };
    sky(c, k);
    whiteBand(c, k, t, 1.2, 1);
    c.save();
    applyCam(c, k);
    const reach = E.io(ph(t, 113.3, 113.85));
    const j = figure(c, { x: chest[0], y: chest[1] + 30, grounded: false, kind: "qin", facing: 1, float: 1, barefoot: true, boots: false, aL: -2.6 + 0.5 * reach, aR: 2.6 - 0.9 * reach, legL: 0.05, legR: -0.08, kneeL: 0.2, kneeR: 0.3, head: 0.65, eyes: "closed", tears: 1, rim: 1 }, t);
    // 头发的边缘开始发亮、化成灰
    c.fillStyle = "rgba(255,240,250,0.9)";
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = 16 + ((t * 30 + i * 7) % 20);
      c.beginPath();
      c.arc(j.head[0] + Math.cos(a) * r, j.head[1] + Math.sin(a) * r - ((t * 40 + i * 11) % 30), 1.8, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    // 白里一个锈红色的女人朝她张开手——是妈妈
    vision(c, W / 2 + 40, 250, 2.6, E.io(ph(t, T_EDGE + 0.15, T_EDGE + 0.6)), LOOKS.mom.top, t);
    flash(c, 0.25 * kick(t, T_EDGE, 0.2), "#ffffff");
    vignette(c, 0.25);
    flash(c, E.in2(ph(t, 113.62, 113.88)), "#fffdf8"); // 她把手伸过去——一片白（下一镜第一脚「咚」从白里砸出来）
    void ghost;
    void WHITE;
  },
};

/** 穿着她那双大靴子的小石头（活下去、尾声用） */
export function kidInBoots(c: C, t: number, f: Fig) {
  const j = figure(c, { kind: "kid", barefoot: true, bell: false, ...f }, t);
  bigBoot(c, j.anL[0], j.anL[1] + 2, 0.95, (f.facing ?? 1) as number);
  bigBoot(c, j.anR[0], j.anR[1] + 2, 0.95, (f.facing ?? 1) as number);
  return j;
}
/** 屏幕上方的白光（活下去用） */
export function whiteGaze(c: C, t: number, a: number, ghostA: number, arms = 1, gx = W / 2, gy = 420, gs = 3.2) {
  if (a <= 0) return;
  const g = c.createLinearGradient(0, 0, 0, 1100);
  g.addColorStop(0, `rgba(255,255,255,${a})`);
  g.addColorStop(0.55, `rgba(255,255,255,${0.45 * a})`);
  g.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, W, 1100);
  if (ghostA > 0) {
    c.save();
    c.translate(gx, gy);
    c.scale(gs, gs);
    ghost(c, 0, 0, 1, ghostA, arms, t);
    c.restore();
  }
}

/** 她那栋楼脚下的街（活下去、尾声接着用）：天、白、城、楼、网（dawn 越大散得越干净）、临街的房子、地面 */
export function towerWorld(c: C, t: number, k: Cam, o: { dawn?: number; lights?: number } = {}) {
  webDraw(c, t, { cam: k, dawn: o.dawn ?? 0.9, noQin: true });
  c.save();
  applyCam(c, k);
  facades(c, k, { lights: o.lights ?? 0 });
  ground(c, k, {});
  c.restore();
}

export const chorus2Shots: Shot[] = [s43, s52, s53];
void toS;
