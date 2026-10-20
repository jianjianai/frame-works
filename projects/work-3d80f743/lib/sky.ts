// 第二幕第五镜「但我还想做些什么」（24.0–25.8，做 24.15 些 24.36 什 24.60 么 24.78）：高空。
// 千斤家那栋楼（左）和最高那栋楼（右）中间的巷子上空，她家的楼顶早就落在脚下；越往上天越亮，顶上就是白。
// 24.02 鼓整套进来时切过来：她吊着铁链和哑铃从画面下面飘上来、慢下来悬住（那头的分量和她一样了），闭着眼；
//「做」睁开眼盯着脚踝上的锁；「些」拔下黄发卡；「什么」把拴着的腿蜷上来、弯腰把发卡伸进锁眼一拧；
// 25.02（底鼓）「咔」锁开，铁链从脚踝上滑脱，连着哑铃掉下去；她伸直身子张开手往上飘（和片头光里的女人一个样子）。
// 镜头：先框住「她—铁链—哑铃」一竖条，几乎不动、跟着她慢慢升；然后直直推到锁上，「咔」一顿；锁开以后跟着她往上退开，
// 露出头顶的白和最高那栋楼的楼顶（下一镜沉沉就在那里收床单）。

import { beatAt } from "@frame/engine/tempo";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import type { MoveKey, PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { INK, drawGlow, drawSilhouette } from "./world";
import { drawPerson } from "./people";
import { LIMP, fade, live } from "./motion";
import { QIANJIN } from "./poses2";
import { drawDumbbell } from "./shop";
import { drawChain, drawPadlock } from "./home";

type V2 = [number, number];
const b = beatAt;

export const SKY_T = {
  /** 鼓整套进来：切到高空 */
  cut: b(48),
  /** 「做」睁开眼 */
  eyes: 24.15,
  /** 「些」手伸到头上拔发卡、拔下来 */
  pin0: 24.36,
  pin1: 24.52,
  /** 「什」把拴着的腿蜷上来、弯腰凑到锁上 */
  curl: 24.6,
  /** 「么」发卡伸进锁眼、一拧 */
  insert: 24.8,
  /** 「咔」锁开（底鼓） */
  click: b(50),
  /** 铁链从脚踝上滑脱，连着哑铃掉下去 */
  drop: 25.07,
  /** 下一句「其实还想要说很多」 */
  end: 25.8,
};

const QJ = CAST.千斤;
/** 发卡拔下来以后：头上没有发卡 */
const QJ_NOPIN = { ...QJ, hairclip: undefined };
/** 她在巷子上空的位置（左边是她家那栋楼的上空，右边 230 是最高那栋楼） */
const X5 = -3935;
/** 悬住时脚踝的高度（切过来那一刻），之后跟着很慢地往上升 */
const HOVER = -6950;
const V_HOVER = 120;
/** 从画面下面冲上来、慢下来：多远、多快慢下来 */
const ENTER = 900;
const TAU = 0.25;
/** 锁开以后往上飘：最后的速度、多快加上去 */
const V_FREE = 1150;
const TAU_FREE = 0.3;
/** 铁链从锁到哑铃中心多长（和第四镜一样） */
const CHAIN = 505;
const G = 2600;

export function makeSky() {
  const T = SKY_T;
  // ——— 千斤 ———
  const move = live(
    [
      { t: T.cut - 0.5, x: 0, p: QIANJIN.吊着飘 },
      { t: T.cut, p: QIANJIN.吊着飘 },
      { t: T.eyes + 0.08, ease: "out", p: QIANJIN.睁眼看锁 },
      { t: T.pin0 + 0.08, ease: "inOut", p: QIANJIN.拔发卡 },
      { t: T.pin1 + 0.04, ease: "out", p: QIANJIN.睁眼看锁 },
      { t: T.curl + 0.16, ease: "inOut", p: QIANJIN.弯腰开锁 },
      { t: T.click + 0.03, p: QIANJIN.弯腰开锁 },
      { t: T.drop + 0.24, ease: "out", p: QIANJIN.张手 },
      { t: 30, p: QIANJIN.张手 },
    ] as MoveKey[],
    {
      look: lookOf(QJ),
      base: { wind: 1.1 },
      idle: true,
      seed: 62,
      springs: LIMP,
      add: (t, o) => {
        const s = (f: number, p: number) => Math.sin(t * f + p);
        o.rot += 3 * s(0.7, 0.4);
        o.lean += 1.5 * s(0.9, 1.1);
        o.shoulderR += 3 * s(1.0, 2.4);
        o.hipR += 3 * s(0.85, 1.7);
        // 「咔」：一震
        const k = kick(t, T.click, 0.1);
        o.neck -= 6 * k;
        o.lean += 4 * k;
      },
    },
  );
  /** 脚踝：从画面下面冲上来、慢下来悬住，跟着很慢地升；锁开以后越飘越快 */
  const ankleAt = (t: number): V2 => {
    const a = Math.max(0, t - T.cut);
    let y = HOVER - V_HOVER * a + ENTER * Math.exp(-a / TAU);
    const d = t - T.drop;
    if (d > 0) y -= V_FREE * (d - TAU_FREE * (1 - Math.exp(-d / TAU_FREE)));
    return [X5 + 8 * Math.sin(t * 1.1), y];
  };
  const qjAt = (t: number) => {
    const f = move(t);
    const j = castJoints(QJ, f.pose);
    const an = ankleAt(t);
    return { pose: f.pose, x: an[0] - j.ankleL[0], y: an[1] - j.ankleL[1], ankle: an, j };
  };
  const chestOf = (q: ReturnType<typeof qjAt>): V2 => [q.x + (q.j.shoulderL[0] + q.j.shoulderR[0]) / 2, q.y + (q.j.shoulderL[1] + q.j.shoulderR[1]) / 2 + 40];
  /** 锁（锁身上沿）：挂在脚踝下面；掉下去以后跟着铁链往下落 */
  const dropFrom = (): V2 => {
    const a = ankleAt(T.drop);
    return [a[0] + 4, a[1] + 30];
  };
  const lockAt = (t: number): V2 => {
    if (t <= T.drop) {
      const a = ankleAt(t);
      return [a[0] + 4, a[1] + 30];
    }
    const L0 = dropFrom();
    const d = t - T.drop;
    // 刚滑脱时还往上带了一点（她在升），然后掉下去，被风往外吹一点
    return [L0[0] - 30 * d, L0[1] - V_HOVER * d + 0.5 * G * d * d];
  };
  const keyhole = (t: number): V2 => {
    const L = lockAt(t);
    return [L[0], L[1] + 11];
  };
  /** 吊着的哑铃：在铁链下面慢慢荡（第四镜拖上来时荡起来的余势），一边慢慢拧 */
  const bellAt = (t: number) => {
    const L = lockAt(t);
    const a = t - T.cut;
    const th = 0.13 * Math.sin(2.5 * a + 0.7) * Math.exp(-a / 1.4) + 0.03 * Math.sin(t * 1.3);
    return { x: L[0] + CHAIN * Math.sin(th), y: L[1] + CHAIN * Math.cos(th), phi: 0.9 + 0.35 * Math.sin(t * 0.8), rot: -0.35 * th };
  };

  /** 她的姿势加上手：拔发卡、攥着锁、把发卡伸进锁眼 */
  const posed = (t: number) => {
    const q = qjAt(t);
    const pose: PoseIn = { ...q.pose };
    const head: V2 = [q.x + q.j.head[0], q.y + q.j.head[1]];
    const release = 1 - fade(t, T.click + 0.04, T.click + 0.2);
    const reach = (side: "L" | "R", p: V2, w: number) => {
      if (w <= 0) return;
      const k = QJ.scale;
      const key = side === "L" ? "armL" : "armR";
      pose[key] = { ...(pose[key] as object), to: [(p[0] - q.x) / k, (p[1] - q.y) / k], ik: Math.min(1, w) };
    };
    // 近处的手：伸到头上的发卡（头的左上），拔下来拿到胸前，再凑到锁眼上
    const clip: V2 = [head[0] - 16, head[1] - 34];
    const chest = chestOf(q);
    const hold: V2 = [chest[0] - 60, chest[1] + 10];
    const kh = keyhole(t);
    const atLock: V2 = [kh[0] - 30, kh[1] - 12];
    const twist = E.io(ph(t, T.insert, T.click - 0.03));
    const inLock: V2 = [kh[0] - 24 + 4 * twist, kh[1] - 8 - 6 * twist];
    let hl: V2 = clip;
    if (t > T.pin1) hl = lerp(clip, hold, E.io(ph(t, T.pin1, T.curl)));
    if (t > T.curl) hl = lerp(hold, atLock, E.io(ph(t, T.curl, T.insert - 0.02)));
    if (t > T.insert - 0.02) hl = lerp(atLock, inLock, E.out(ph(t, T.insert - 0.02, T.insert + 0.06)));
    reach("L", hl, fade(t, T.pin0 - 0.06, T.pin0 + 0.06) * release);
    // 远处的手：攥住锁身
    const L = lockAt(t);
    reach("R", [L[0] + 18, L[1] + 14], fade(t, T.curl + 0.02, T.curl + 0.14) * release);
    return { ...q, pose, spec: t >= T.pin1 - 0.06 ? QJ_NOPIN : QJ, pinTip: t >= T.insert ? kh : null };
  };

  // ——— 远处满天往上飘的人（这个世界里到处都有人飘向白）：按切过来那一帧的取景排，越远越小越淡 ———
  const far: { x: number; y0: number; D: number; v: number; h: number; ph: number; a: number }[] = [];
  {
    const c0 = camAt(T.cut);
    let s = 91;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 34; i++) {
      const D = [2.6, 3.6, 5][i % 3];
      const sx = -60 + r() * 1200;
      const sy = 100 + r() * 1700;
      // 别落在她身上那一竖条里
      if (sx > 300 && sx < 720 && sy > 150 && sy < 1600) continue;
      far.push({ x: c0.x + ((sx - 540) * D) / c0.z, y0: c0.y + ((sy - 960) * D) / c0.z, D, v: 40 + r() * 70, h: 590 * (0.3 + r() * 0.15), ph: r() * 6.28, a: 0.5 + 0.3 * r() });
    }
    // 近一点的三个（画面左边那一大片天里，看得出满天都是人）
    for (const [sx, sy, h] of [
      [120, 640, 0.46],
      [250, 1420, 0.42],
      [60, 1720, 0.4],
    ]) {
      const D = 2.3;
      far.push({ x: c0.x + ((sx - 540) * D) / c0.z, y0: c0.y + ((sy - 960) * D) / c0.z, D, v: 60, h: 590 * h, ph: sx * 0.01, a: 0.7 });
    }
  }

  /** 眼泪：闭着眼的时候从眼角往上飘（睁开眼就停了；锁开以后又笑着流下来） */
  const drawTears = (g: CanvasRenderingContext2D, t: number, head: V2) => {
    const k = (1 - fade(t, T.eyes, T.eyes + 0.15)) + fade(t, T.drop + 0.1, T.drop + 0.35);
    if (k <= 0.01) return;
    g.save();
    g.fillStyle = "rgba(170,214,240,0.9)";
    for (let i = 0; i < 4; i++) {
      const u = (t * 0.6 + i / 4) % 1;
      g.globalAlpha = k * Math.min(1, u * 8) * (1 - u) ** 0.8;
      const r = 5 + 2.5 * Math.min(1, u * 4);
      g.beginPath();
      g.ellipse(head[0] - 18 + (i % 2 ? 14 : -6) + 10 * Math.sin(t * 2 + i) * u, head[1] + 8 - u * 240, r * 0.75, r, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  };

  /** 远处的人：画 D 在 [d0, d1) 里的那几层（setCam 按那一层设好变换） */
  const drawFar = (g: CanvasRenderingContext2D, t: number, d0: number, d1: number, setCam: (D: number) => void) => {
    let last = 0;
    for (const p of far) {
      if (p.D < d0 || p.D >= d1) continue;
      if (p.D !== last) {
        setCam(p.D);
        last = p.D;
      }
      const y = p.y0 - p.v * (t - T.cut);
      drawGlow(g, p.x, y - p.h * 0.45, p.h * 1.2, 0.5 * p.a);
      drawSilhouette(g, p.x, y, p.h, t, p.ph, 0.45 * p.a, "120,84,100");
    }
  };

  /** 画她、发卡、锁、铁链、哑铃、拴在脚踝上的半截红线（人这一层，世界坐标） */
  const drawPeople = (g: CanvasRenderingContext2D, t: number, z: number) => {
    const q = posed(t);
    const lw = 3.2 / Math.sqrt(Math.max(0.3, z));
    const L = lockAt(t);
    const d = bellAt(t);
    const dropped = t > T.drop;
    // 哑铃和铁链（锁开以后连着锁一起往下掉）
    drawDumbbell(g, d.x, d.y, d.phi, d.rot, 1, lw);
    // 脚踝上还拴着第四镜绷断的那半截红线
    const an = q.ankle;
    const sw = 10 * Math.sin(t * 2.3);
    drawRedEnd(g, [an, [an[0] + 8, an[1] + 26], [an[0] - 4 + sw, an[1] + 58]]);
    drawPerson(g, q.spec, q.pose, q.x, q.y, z);
    // 铁链：锁还扣着时在脚踝上绕两圈；锁开以后两圈松开、从脚上滑下去
    const slip = E.in2(ph(t, T.click + 0.02, T.drop));
    if (!dropped) drawChain(g, [[d.x, d.y - 6], L], [an[0], an[1] + 26 * slip]);
    else drawChain(g, [[d.x, d.y - 6], [L[0], L[1] - 4]]);
    const open = E.out(ph(t, T.click - 0.01, T.click + 0.05));
    drawPadlock(g, L[0], L[1], open, dropped ? 0.05 + 2.2 * (t - T.drop) : 0.05);
    // 发卡：在近处那只手里（手腕 → 手掌的方向），伸进锁眼以后尖在锁眼上
    if (t >= T.pin1 - 0.06 && t < T.drop + 0.05) {
      const jj = castJoints(QJ, q.pose);
      const pp: V2 = [q.x + jj.palmL[0], q.y + jj.palmL[1]];
      const pw: V2 = [q.x + jj.wristL[0], q.y + jj.wristL[1]];
      const dx = pp[0] - pw[0];
      const dy = pp[1] - pw[1];
      const l = Math.hypot(dx, dy) || 1;
      const from: V2 = [pp[0] + (dx / l) * 2, pp[1] + (dy / l) * 2];
      let to: V2 = [pp[0] + (dx / l) * 30, pp[1] + (dy / l) * 30];
      if (q.pinTip) {
        // 伸进锁眼：尖在锁眼上（手离得远时只朝锁眼那边伸 34，不拉长）
        const ex = q.pinTip[0] - from[0];
        const ey = q.pinTip[1] - from[1];
        const el = Math.hypot(ex, ey) || 1;
        to = el <= 38 ? q.pinTip : [from[0] + (ex / el) * 34, from[1] + (ey / el) * 34];
      }
      drawPin(g, from, to, lw);
    }
    drawTears(g, t, [q.x + q.j.head[0], q.y + q.j.head[1]]);
  };

  return { qjAt, posed, lockAt, keyhole, bellAt, chestOf, drawFar, drawPeople };
}

const lerp = (a: V2, b2: V2, u: number): V2 => [a[0] + (b2[0] - a[0]) * u, a[1] + (b2[1] - a[1]) * u];

/** 拴在脚踝上的半截红线 */
function drawRedEnd(g: CanvasRenderingContext2D, pts: V2[]) {
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  g.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
  g.strokeStyle = INK;
  g.lineWidth = 6.5;
  g.stroke();
  g.strokeStyle = "#d8352b";
  g.lineWidth = 3.6;
  g.stroke();
  g.restore();
}

/** 黄发卡（一字夹）：深色描边、亮黄 */
function drawPin(g: CanvasRenderingContext2D, from: V2, to: V2, lw: number) {
  g.save();
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(from[0], from[1]);
  g.lineTo(to[0], to[1]);
  g.strokeStyle = INK;
  g.lineWidth = Math.max(5, lw * 2.4);
  g.stroke();
  g.strokeStyle = "#f2c94c";
  g.lineWidth = Math.max(2.6, lw * 1.3);
  g.stroke();
  g.restore();
}

// ——————————————— 镜头 ———————————————
/** 切过来时：框住「她—铁链—哑铃」一竖条（她在上面、哑铃在下面），右边是最高那栋楼的墙；跟着她悬住的高度很慢地升 */
function camAt(t: number): Cam {
  const a = Math.max(0, t - SKY_T.cut);
  const y = HOVER - V_HOVER * a;
  return aim(X5 + 40, y + 60, 540, 960, 1.15);
}

/**
 * ⑤ 的镜头：先几乎不动（她从下面冲上来、慢下来悬住，镜头跟着她悬住的高度慢慢升）；「什」直直推到锁上（2.35 倍，锁和她低着的脸），
 * 「咔」一顿；锁开以后跟着她往上退开（E.io），落在「白—楼顶—往上飘的她」上（0.91 倍，白在画面最上面）。
 */
export function skyCam(t: number, sky: ReturnType<typeof makeSky>): Cam {
  const T = SKY_T;
  let c = camAt(t);
  // 推到锁上：锁在画面中间偏上
  const push = E.io(ph(t, T.curl - 0.04, T.insert + 0.08));
  if (push > 0) {
    // 锁和她低着的脸都在画面里（脸在锁的左上）
    const kh = sky.keyhole(Math.min(t, T.drop));
    const A = aim(kh[0] - 80, kh[1] - 40, 560, 900, 2.35);
    c = camLerp(c, A, push);
  }
  // 锁开以后：跟着她往上退开（一直跟着她的胸口，先快后稳），落在「白在最上面、楼顶在右上、她在左下往上飘」上
  if (t > T.drop) {
    // 25.6 就退到能看见整个楼顶：右上角楼顶上收床单的沉沉（用户 2026-10-19：「这一幕主角应该就在右上角了」）
    const u = E.out(ph(t, T.drop + 0.02, 25.62));
    const q = sky.chestOf(sky.qjAt(t));
    const C = aim(q[0], q[1], 540 + (326 - 540) * u, 900 + (1330 - 900) * u, 2.35 * Math.pow(0.91 / 2.35, u));
    c = camLerp(c, C, E.io(ph(t, T.drop, T.drop + 0.2)));
  }
  // 「咔」：往里一顿
  c = { ...c, z: c.z * (1 + 0.05 * kick(t, T.click, 0.1)) };
  return c;
}

export function skyShake(t: number) {
  return 6 * kick(t, SKY_T.click, 0.07);
}

/** 高空的光：比门口亮、暖，暗角轻 */
export function skyLook(t: number) {
  return { vig: 0.16, warm: 0.85 + 0.1 * fade(t, SKY_T.drop, SKY_T.end) };
}
