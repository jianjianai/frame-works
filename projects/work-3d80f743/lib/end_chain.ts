// 终章的人链（时刻、谁、多高、怎么摆在 lib/end_rise.ts；他在 lib/end_pair.ts；老钟在窗里那段在 lib/end_zhong.ts）。
// 用户 2026-10-25 第二次改：下面的人是在救他。老钟被拽出窗（118.1）以后吊在他脚下；她救过的人一个接一个从街两边、铺子里跑来，
// 在老钟家窗户底下（X_JOIN）蹲一下、跳起来，两只手攥住最下面那个人的脚踝，被一起拽上去；最后一个（ANCHOR）不跳，两腿蹬开站在街上
// 攥住，人链钉在地上的那一点（PIVOT）不动。整条人链从他的脚踝连到 PIVOT，跟着他绕 PIVOT 左右摆；他那头一摆，一节节往下传，
// 中间弯成一道波浪（lib/end_rise.ts 的 waveDev），再加一点风往左吹的弯。「后奏二」（TE.let0）人链的形状定住，从上往下一个个松手，各自从原本的位置像花一样散开慢慢飘下来，落在街上；最后一个松开手站着。

import { type MoveKey, type PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type Cam, E, ph, viewOf } from "./cam";
import { drawTinted } from "./world";
import { ARMS, live } from "./motion";
import { drawPerson } from "./people";
import { TE, type V2, mix } from "./end_t";
import { ANCHOR, CROUCH, DRIFT, HANG, LEAP, LOOKUP, PULLED, STRIDE, WATCH } from "./end_poses";
import { MEMBERS, type Member, PIVOT, X_JOIN, linkLen, wavePolyline } from "./end_rise";
import { kidAt } from "./end_pair";
import { zhongNow } from "./end_zhong";

const N = MEMBERS.length;
const RUN_V = 820;
/** 第 k 个人抓上来的时刻（老钟：被拽出窗那一刻） */
const JOIN = MEMBERS.map((_, k) => (k === 0 ? TE.zOut : TE.joins[k - 1]));
/** 松手的时刻（从上往下）；最后一个站在街上，最后松开 */
const LET = MEMBERS.map((_, k) => TE.let0 + 0.06 * k);
/** 最后一个人站的地方（两只手正好在 PIVOT） */
const ANCHOR_AT = (() => {
  const m = MEMBERS[N - 1];
  const j = castJoints(m.spec, ANCHOR(m.face) as PoseIn);
  return [PIVOT[0] - (j.palmL[0] + j.palmR[0]) / 2, 0] as V2;
})();
/** 起跳的地方：X_JOIN 跑过来的那一边；最后一个跑到 ANCHOR_AT 站住 */
const TAKEOFF = MEMBERS.map((m) => (m.anchor ? ANCHOR_AT[0] : X_JOIN + (m.from < X_JOIN ? -150 : 150)));
/** 门（铺子）里出来的人：门开的时刻（先站住抬头看一下） */
const DOOR_T: Record<string, number> = { 阿满: 118.3, 年轻人: 118.55 };

interface Plan {
  m: Member;
  k: number;
  join: number;
  /** 起跑 */
  run0: number;
  /** 上街（出现）的时刻 */
  appear: number;
  let: number;
  /** 落地以后朝哪 */
  face: number;
  spot: number;
}
const PLANS: Plan[] = MEMBERS.map((m, k) => {
  const join = JOIN[k];
  const run = Math.abs(m.from - TAKEOFF[k]) / RUN_V;
  const run0 = join - (m.anchor ? 0.15 : 0.35) - run;
  const appear = m.door ? Math.min(DOOR_T[m.name] ?? run0, run0 - 0.6) : run0;
  const spot = m.anchor ? ANCHOR_AT[0] : m.spot;
  const face = m.anchor ? m.face : spot < -2400 ? 0.5 : -0.5;
  return { m, k, join, run0: Math.max(run0, appear + 0.5), appear, let: LET[k], face, spot };
});

// ——————————————— 动作 ———————————————
let MOVES: ReturnType<typeof live>[] | null = null;
function moves() {
  if (MOVES) return MOVES;
  MOVES = PLANS.map((p) => {
    const f = p.m.face;
    const keys: MoveKey[] = [];
    if (p.k === 0) {
      // 老钟：被拽出窗以后吊着（窗里被拽起来那段在 lib/end_zhong.ts，交接时已经是这个样子）
      keys.push({ t: TE.zOut - 0.4, x: 0, p: HANG(f, 0) });
      keys.push({ t: TE.zOut + 0.4, p: HANG(f, 0) });
    } else {
      const t0 = Math.min(p.appear, p.run0) - 0.4;
      if (p.m.door) {
        // 从铺子里出来：走两步，站住，第一次抬头看天
        keys.push({ t: t0, x: 0, p: STRIDE(f, false, false) });
        keys.push({ t: p.appear + 0.25, ease: "inOut", p: STRIDE(f, true, false) });
        keys.push({ t: p.appear + 0.5, ease: "inOut", p: LOOKUP(f, p.k % 2 === 1) });
        keys.push({ t: p.run0, p: LOOKUP(f, p.k % 2 === 1) });
      } else keys.push({ t: t0, x: 0, p: STRIDE(f, false, true) });
      // 跑过去：一步 0.17 秒
      let a = true;
      const runEnd = p.join - (p.m.anchor ? 0.15 : 0.36);
      for (let t = p.run0 + 0.17; t < runEnd; t += 0.17) {
        keys.push({ t, ease: "inOut", p: STRIDE(f, a, true) });
        a = !a;
      }
      if (p.m.anchor) {
        // 最后一个：刹住，两腿蹬开，两只手举起来攥住，身子往后坐
        keys.push({ t: p.join, ease: "out", squash: 0.06, p: ANCHOR(f) });
      } else {
        // 蹲一下攒劲、跳起来够、攥住
        keys.push({ t: p.join - 0.3, ease: "inOut", p: CROUCH(f) });
        keys.push({ t: p.join - 0.06, ease: "out", p: LEAP(f) });
        // 越接越快，最后 0.1 秒就有下一个人抓上来：吊好的姿势要在那之前到
        const gap = PLANS[p.k + 1] ? PLANS[p.k + 1].join - p.join : 0.3;
        keys.push({ t: p.join + Math.min(0.3, gap - 0.06), ease: "inOut", p: HANG(f, p.k) });
      }
    }
    // 下面的人抓住了自己的脚踝：那条腿拽直、往下一坠
    const next = PLANS[p.k + 1];
    let last = p.m.anchor ? ANCHOR(f) : HANG(f, p.k);
    if (next) {
      keys.push({ t: next.join - 0.02, p: last });
      keys.push({ t: next.join + 0.1, ease: "out", squash: -0.05, p: PULLED(f, p.k) });
      keys.push({ t: next.join + 0.4, ease: "inOut", p: PULLED(f, p.k) });
      last = PULLED(f, p.k);
    }
    if (p.m.anchor) {
      // 松开手，站着仰头看她
      keys.push({ t: p.let, p: last });
      keys.push({ t: p.let + 0.6, ease: "inOut", p: WATCH(p.face, p.face > 0 ? -0.2 : 0.2) });
    } else {
      // 松手，像落叶一样慢慢飘下来；落地膝盖一弯，看着她，哭着笑
      keys.push({ t: p.let, p: last });
      keys.push({ t: p.let + 0.5, ease: "inOut", p: DRIFT(f, p.k) });
      const land = landOf(p.k);
      keys.push({ t: land - 0.25, p: DRIFT(p.face, p.k) });
      keys.push({ t: land, ease: "inOut", squash: 0.07, p: WATCH(p.face, p.face > 0 ? 0.4 : -0.4) });
      keys.push({ t: land + 0.25, ease: "out", p: WATCH(p.face, p.face > 0 ? 0.4 : -0.4) });
    }
    keys.push({ t: 153, p: keys[keys.length - 1].p });
    return live(keys, { look: lookOf(p.m.spec), base: { wind: -0.8 }, idle: true, seed: 1200 + p.k * 7, springs: ARMS, follow: 0 });
  });
  return MOVES;
}

// ——————————————— 人链的形状 ———————————————
const rot = (v: V2, a: number): V2 => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
const palmMid = (j: ReturnType<typeof castJoints>): V2 => [(j.palmL[0] + j.palmR[0]) / 2, (j.palmL[1] + j.palmR[1]) / 2];
const ankleMid = (j: ReturnType<typeof castJoints>): V2 => [(j.ankleL[0] + j.ankleR[0]) / 2, (j.ankleL[1] + j.ankleR[1]) / 2];
interface Link {
  /** 两只手攥着的地方、身子偏离竖直多少（正 = 下面往右）、根（画的时候从这里转） */
  P: V2;
  th: number;
  R: V2;
  /** 这个人的脚踝（下面的人攥这里） */
  ankle: V2;
}
/**
 * 这一刻已经在人链里的人（从上往下）：人链的形状是从他的脚踝到 PIVOT 的一道波浪线（lib/end_rise.ts 的 wavePolyline：
 * 他那头一摆，一节节往下传）；每个人的手攥在上面那个人的脚踝上，身子朝着这条线上「再往下一节」（按线的长度量）的那一点。
 * 最后一个站在街上，不在线上（两只手按 IK 攥住上面那个人的脚踝）
 */
const layoutMemo = new Map<number, Link[]>();
function layout(t: number): Link[] {
  // 松手以后，还攥着的人留在各自原本的位置（不往上收到他脚下），从那里一个个松开、飘下来（用户 2026-10-26）
  if (t >= TE.let0) t = TE.let0 - 1e-3;
  const key = Math.round(t * 1e4);
  const hit = layoutMemo.get(key);
  if (hit) return hit;
  const mv = moves();
  const out: Link[] = [];
  const P0 = kidAt(t).ankleR;
  const line = wavePolyline(t, P0);
  const acc: number[] = [0];
  for (let i = 1; i < line.length; i++) acc.push(acc[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  const along = (d: number): V2 => {
    if (d >= acc[acc.length - 1]) {
      // 比线还长（还没钉在地上时最下面那几个人）：顺着最后一段往下伸
      const a = line[line.length - 2];
      const b = line[line.length - 1];
      const L = acc[acc.length - 1] - acc[acc.length - 2] || 1;
      const over = d - acc[acc.length - 1];
      return [b[0] + ((b[0] - a[0]) / L) * over, b[1] + ((b[1] - a[1]) / L) * over];
    }
    let i = 1;
    while (acc[i] < d) i++;
    const u = (d - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
    return [line[i - 1][0] + (line[i][0] - line[i - 1][0]) * u, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * u];
  };
  let P = P0;
  let cum = 0;
  for (let k = 0; k < N; k++) {
    if (t < JOIN[k] || t >= LET[k] + 0.001) {
      out.push({ P, th: 0, R: P, ankle: P });
      continue;
    }
    const p = PLANS[k];
    if (p.m.anchor) {
      out.push({ P, th: 0, R: ANCHOR_AT, ankle: ANCHOR_AT });
      continue;
    }
    const pose = mv[k](t).pose;
    const j = castJoints(p.m.spec, pose);
    cum += linkLen(p.m);
    const target = along(cum);
    const th = Math.atan2(target[0] - P[0], target[1] - P[1]);
    const pm = palmMid(j);
    const R: V2 = [P[0] - rot(pm, -th)[0], P[1] - rot(pm, -th)[1]];
    const am = ankleMid(j);
    const ankle: V2 = [R[0] + rot(am, -th)[0], R[1] + rot(am, -th)[1]];
    out.push({ P, th, R, ankle });
    P = ankle;
  }
  if (layoutMemo.size > 300) layoutMemo.clear();
  layoutMemo.set(key, out);
  return out;
}

/** 第 k 个人落地的时刻（松手时离地越高落得越晚） */
const LAND_AT = new Map<number, number>();
function landOf(k: number): number {
  let v = LAND_AT.get(k);
  if (v === undefined) {
    // 松手那一刻他离地多高：按人链里的位置估（老钟在顶上 ≈ 他的高度）
    const h = Math.max(300, 8600 - 520 * k);
    v = Math.min(141.6, LET[k] + 1.4 + h / 2900);
    LAND_AT.set(k, v);
  }
  return v;
}

// ——————————————— 每个人这一刻 ———————————————
export interface MemberNow {
  m: Member;
  pose: PoseIn;
  /** 根（画的时候从这里转 −th） */
  R: V2;
  th: number;
  on: boolean;
}
const herm1 = (a: number, va: number, b: number, vb: number, dt: number, u: number) => {
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * a + (u3 - 2 * u2 + u) * dt * va + (-2 * u3 + 3 * u2) * b + (u3 - u2) * dt * vb;
};
export function memberAt(t: number, k: number): MemberNow {
  const p = PLANS[k];
  const pose: PoseIn = { ...moves()[k](t).pose };
  const off: MemberNow = { m: p.m, pose, R: [0, 0], th: 0, on: false };
  if (k === 0 && t < TE.zOut) return off;
  if (k > 0 && t < p.appear) return off;
  const L = layout(t);
  if (k === 0 && t < TE.zOut + 0.35) {
    // 老钟被拽出窗：从窗外探着身子的地方接到他脚底下吊着
    const z0 = zhongNow(TE.zOut - 0.001);
    const u = E.out(ph(t, TE.zOut, TE.zOut + 0.35));
    return { m: p.m, pose, R: mix(z0.root, L[0].R, u), th: L[0].th * u, on: true };
  }
  if (p.m.anchor) {
    // 最后一个：跑过来，站住，两只手举起来攥住上面那个人的脚踝；松开以后站着
    let x = ANCHOR_AT[0];
    if (t < p.join - 0.15) x = t < p.run0 ? p.m.from : p.m.from + (ANCHOR_AT[0] - p.m.from) * ph(t, p.run0, p.join - 0.15);
    if (t >= p.join - 0.12 && t < p.let + 0.3) {
      const a = L[k - 1].ankle;
      const sc = p.m.spec.scale;
      const mir = p.m.face > 0 ? -1 : 1;
      const w = E.io(ph(t, p.join - 0.12, p.join)) * (1 - E.io(ph(t, p.let, p.let + 0.3)));
      const loc = (q: V2): V2 => [(mir * (q[0] - x)) / sc, q[1] / sc];
      pose.armL = { ...(pose.armL as object), to: loc([a[0] - 4, a[1] + 2]), ik: w } as PoseIn["armL"];
      pose.armR = { ...(pose.armR as object), to: loc([a[0] + 4, a[1] + 14]), ik: w } as PoseIn["armR"];
    }
    return { m: p.m, pose, R: [x, 0], th: 0, on: true };
  }
  if (t >= p.join && t < p.let) return { m: p.m, pose, R: L[k].R, th: L[k].th, on: true };
  if (k > 0 && t < p.join) {
    // 跑过来、蹲、跳起来
    const tTake = p.join - 0.25;
    if (t < tTake) {
      const x = t < p.run0 ? p.m.from : p.m.from + (TAKEOFF[k] - p.m.from) * ph(t, p.run0, p.join - 0.36);
      return { m: p.m, pose, R: [x, 0], th: 0, on: true };
    }
    const J = layout(p.join)[k];
    const u = (t - tTake) / 0.25;
    const x = herm1(TAKEOFF[k], 0, J.R[0], 0, 0.25, u);
    const y = herm1(0, -1600, J.R[1], -900, 0.25, u);
    return { m: p.m, pose, R: [x, y], th: J.th * E.io(u), on: true };
  }
  // 松了手：从人链里的位置慢慢飘下来、往两边散开，落在自己的地方
  const land = landOf(k);
  const A = layout(p.let - 0.001)[k];
  if (t < land) {
    const D = land - p.let;
    const u = (t - p.let) / D;
    const out = (p.spot > A.R[0] ? 1 : -1) * 900;
    const x = herm1(A.R[0], out, p.spot, 0, D, u);
    const s = u * u * (3 - 2 * u);
    const y = A.R[1] * (1 - s);
    return { m: p.m, pose, R: [x, y], th: A.th * (1 - E.io(Math.min(1, u * 1.6))), on: true };
  }
  return { m: p.m, pose, R: [p.spot, 0], th: 0, on: true };
}

/** 画一个人（根在 R，绕根转 −th） */
function drawMember(g: CanvasRenderingContext2D, n: MemberNow, z: number) {
  g.save();
  g.translate(n.R[0], n.R[1]);
  g.rotate(-n.th);
  drawPerson(g, n.m.spec, n.pose, 0, 0, z);
  g.restore();
}
/** 人链里的人、街上的人（老钟出窗以前由 lib/end_zhong.ts 画）。only：只画哪几个（按序号） */
export function drawChain(g: CanvasRenderingContext2D, t: number, cam: Cam, only?: (k: number) => boolean) {
  const v = viewOf(cam, 1);
  // 上面的人先画：下面的人攥着他的脚踝，手压在上面
  for (let k = 0; k < N; k++) {
    if (only && !only(k)) continue;
    const n = memberAt(t, k);
    if (!n.on) continue;
    if (n.R[0] < v.x0 - 700 || n.R[0] > v.x1 + 700 || n.R[1] < v.y0 - 900 || n.R[1] > v.y1 + 900) continue;
    drawTinted(g, [n.R[0] - 700, n.R[1] - 900, n.R[0] + 700, n.R[1] + 400], (gg) => drawMember(gg, n, cam.z), 0.85);
  }
}
/** 人链顶上往下第 s（0 = 他的脚踝，1 = 最下面那个人的脚踝 / 最后一个人的手）处在世界里的哪（镜头顺着人链用） */
export function chainPoint(t: number, s: number): V2 {
  const L = layout(t).filter((_, k) => t >= JOIN[k] && t < LET[k] && !MEMBERS[k].anchor);
  if (!L.length) return kidAt(t).ankleR;
  const pts: V2[] = [L[0].P, ...L.map((l) => l.ankle)];
  const f = Math.max(0, Math.min(1, s)) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(f));
  return mix(pts[i], pts[i + 1], f - i);
}
/** 人链最下面那个人的脚踝 */
export const chainBottom = (t: number) => chainPoint(t, 1);
/** 人链里第 k 个人的头在世界里的哪（画的时候从根 R 转 −th） */
export function memberHead(t: number, k: number): V2 {
  const n = memberAt(t, k);
  const h = castJoints(n.m.spec, n.pose).head;
  const c = Math.cos(-n.th);
  const sn = Math.sin(-n.th);
  return [n.R[0] + h[0] * c - h[1] * sn, n.R[1] + h[0] * sn + h[1] * c];
}
export { zhongNow, ANCHOR_AT };
