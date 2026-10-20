// 五③ 尾奏第三、四小节（140.02–144.02；142.02 小节线）：人链。
// 140.02 站在街上看的人一下子都朝老钟脚下跑过去；一个跳起来抓住上一个人的脚踝：141.02 周磊抓住老钟，141.52 千斤，142.02 阿满，
// 142.52 年轻人把老太太托上去、她抓住阿满，143.02 年轻人自己跳起来抓住老太太；前奏里被她拽下来的戴眼镜的大叔、扎马尾的女学生
// 从街两头跑来，143.27、143.52 半拍一个接上。每接上一个人，人链升一节、往下一坠（lib/t53.ts），最下面那个人的脚总是刚好够得着；
// 最后一个人抓住以后整条人链离开街面，越升越快。哑铃店里的人不进人链（不是她救过的人），留在街上看（lib/chain.ts）。
// 坐标是世界坐标；他在 lib/coatoff.ts，老钟在 lib/morning8.ts，街上的人五②怎么出来在 lib/chain.ts，时刻在 lib/t53.ts。

import { type MoveKey, type PoseIn, figurePose, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { CAST, type CastSpec, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type Cam, E, aim, kick, ph, viewOf } from "./cam";
import { drawTinted } from "./world";
import { live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { drawPerson } from "./people";
import { LINK_T, linkLiftSmooth } from "./t53";
import { CROWD, type Walker, breath, lookUp, stride } from "./chain";
import { liftAt, stoneC4, stoneX } from "./coatoff";
import { zhongAnkle, zhongAt } from "./morning8";
import { STUDENT, UNCLE } from "./saved";
import { diveHer } from "./dive";
import { HER_LAND, LAND_T, releaseOf } from "./t55";

type V2 = [number, number];
const T = LINK_T;
const G = T.grabs;
export { LINK_T };

// ——— 姿势（f：朝向，正数朝右） ———
type Angles = ReturnType<typeof pose>;
type Gait = "run" | "jog" | "walk";
/** 跑过去：五②那套步子，盯着人链最下面 */
const RUN = (f: number, a: boolean, gait: Gait): Angles => ({ ...stride(f, gait !== "walk", a), expression: "坚定", lookY: -0.7 });
/** 起跳前一蹲：膝盖弯下去、两只手甩到身后，仰头盯着要抓的脚踝（lift 把胯放低，脚还踩在街面上） */
const CROUCH = (f: number): Angles =>
  pose(24, { face: f, ground: false, lift: -61, ...legR(64, -104, 0), ...legL(40, -90, 0), neck: 30, expression: "坚定", lookY: -1 }, (l) => ({
    ...armL(-46, 36, 0, "open", l),
    ...armR(-38, 44, 0, "open", l),
  }));
/** 跳起来：身子朝要抓的地方往前上方扑，两只手往前上方够，前腿提膝、后腿蹬直（往后仰的话像被风吹回去） */
const LEAP = (f: number): Angles =>
  pose(14, { face: f, ground: false, lift: 0, ...legR(40, -70, -10), ...legL(-22, -24, -30), neck: 26, expression: "使劲", lookY: -1 }, (l) => ({
    ...armL(158, 10, 0, "open", l),
    ...armR(150, 14, 0, "open", l),
  }));
/** 吊着：两只手攥着上面那个人的脚踝（IK），腿悬着，仰着头 */
const HANG = (f: number): Angles =>
  pose(-4, { face: f, ground: false, lift: 0, float: 0.1, ...legR(6, -24, -40), ...legL(-8, -16, -44), neck: 24, expression: "坚定", lookY: -1 }, (l) => ({
    ...armL(170, 6, 0, "grip", l),
    ...armR(166, 8, 0, "grip", l),
  }));
/** 下面的人抓住了自己远处那只脚踝：那条腿被拽直，另一条蜷一点 */
const PULLED = (f: number): Angles => ({ ...HANG(f), ...legR(2, -2, -30), ...legL(20, -50, -40) });
/** 老太太膝盖一弯、被托上去：两只手往上够，腿悬着 */
const BENT = (f: number): Angles => ({ ...CROUCH(f), lift: -30, neck: 34 });
const LIFTED = (f: number): Angles =>
  pose(-6, { face: f, ground: false, lift: 0, ...legR(10, -34, -30), ...legL(-10, -44, -40), neck: 28, expression: "坚定", lookY: -1 }, (l) => ({
    ...armL(170, 10, 0, "open", l),
    ...armR(164, 14, 0, "open", l),
  }));
/** 年轻人蹲下扶住她的腰（两只手 IK 在她腰上） */
const BOOST_LOW = (f: number): Angles =>
  pose(22, { face: f, ground: false, lift: -44, ...legR(60, -96, 0), ...legL(30, -76, 0), neck: 10, expression: "使劲", lookY: -0.3 }, (l) => ({
    ...armL(80, 40, 0, "open", l),
    ...armR(76, 46, 0, "open", l),
  }));
/** 站起来把她往上托：两只手举过头顶 */
const BOOST_UP = (f: number): Angles =>
  pose(-4, { face: f, ground: false, lift: 0, ...legR(6, -6), ...legL(-4, -2), neck: 30, expression: "使劲", lookY: -1 }, (l) => ({
    ...armL(160, 20, 0, "open", l),
    ...armR(156, 24, 0, "open", l),
  }));

/** 五⑤ 天上松了手往下飘：两只手往上张开，腿悬着，仰头看着抱在一起的两个人，哭着笑 */
const DRIFT = (f: number): Angles =>
  pose(-4, { face: f, ground: false, lift: 0, float: 0.1, ...legR(14, -34, -30), ...legL(-10, -46, -36), neck: 24, expression: "哭着笑", tears: 1, lookY: -0.8 }, (l) => ({
    ...armL(126, 30, 0, "open", l),
    ...armR(116, 36, 0, "open", l),
  }));
/** 五⑤ 落回街上站着，看着她笑（lx：眼睛往哪边看） */
const STAND = (f: number, lx: number): Angles =>
  pose(0, { face: f, ground: false, lift: 0, ...legR(6, -6), ...legL(-4, -2), neck: 6, expression: "微笑", lookX: lx, lookY: 0.1 }, (l) => ({
    ...armL(8, 24, 0, "relax", l),
    ...armR(10, 26, 0, "relax", l),
  }));
/** 走过来把手放上去（远处那只手 IK 到她肩上 / 他背上） */
const REACH = (f: number, lx: number): Angles => ({ ...STAND(f, lx), ...armR(104, 30, 0, "open", 0) });

// ——— 人链里的人 ———
interface Plan {
  /** 五②里站在街上的那个人；从街头跑来的给 spec、from、seed */
  walker: Walker | null;
  spec?: CastSpec;
  from?: V2;
  seed?: number;
  /** 什么时候起跑、跑还是走；跑的时候朝哪（正数朝右；吊着时朝向不变，|face| 收到 0.6） */
  t0: number;
  gait: Gait;
  face: number;
  /** 抓住上一个人脚踝的时刻；从脚踝的哪一边跳上去（正数在右边，跑过来的那边） */
  grab: number;
  side: number;
  role: "boosted" | "booster" | null;
  /**
   * 五⑤ 落回街上以后站在哪（根）、朝哪；hand：走过来把手放在哪（her 她近处那只肩膀，kid 他背上），从哪走过来、什么时候放上去；
   * drift：天上松手以后往哪边飘（正数往右）
   */
  spot: V2;
  spotFace: number;
  drift: number;
  hand?: { to: "her" | "kid"; from: V2; at: number };
}
const PLANS: Plan[] = [
  // 周磊：从右边，跑得最快，第一个跳起来抓住老钟
  { walker: CROWD[2], t0: 140.05, gait: "run", face: -0.85, grab: G[0], side: 1, role: null, spot: [-2700, 26], spotFace: -0.6, drift: 1, hand: { to: "kid", from: [-2620, 30], at: LAND_T.hand2 } },
  // 千斤：从左边跑来
  { walker: CROWD[3], t0: 140.08, gait: "run", face: 0.85, grab: G[1], side: -1, role: null, spot: [-3010, 64], spotFace: 0.6, drift: -1, hand: { to: "her", from: [-3100, 70], at: LAND_T.hand1 } },
  // 阿满：从左边小跑过来
  { walker: CROWD[0], t0: 140.55, gait: "jog", face: 0.7, grab: G[2], side: -1, role: null, spot: [-2480, 18], spotFace: -0.6, drift: 1 },
  // 老太太：从左边小跑过来，年轻人把她托上去
  { walker: CROWD[4], t0: 140.14, gait: "jog", face: 0.7, grab: G[3], side: -1, role: "boosted", spot: [-2270, 88], spotFace: -0.6, drift: -1 },
  // 年轻人：等周磊跳上去以后从右边小跑过来，先托老太太，再自己跳起来抓住她
  { walker: CROWD[1], t0: 141.05, gait: "jog", face: -0.7, grab: G[4], side: 1, role: "booster", spot: [-2370, 60], spotFace: -0.6, drift: 1 },
  // 戴眼镜的大叔：从街的右头跑来
  { walker: null, spec: UNCLE, from: [-150, 40], seed: 531, t0: 141.62, gait: "run", face: -0.85, grab: G[5], side: 1, role: null, spot: [-2170, 30], spotFace: -0.6, drift: -1 },
  // 扎马尾的女学生：从街的左头跑来
  { walker: null, spec: STUDENT, from: [-3250, 52], seed: 532, t0: 141.6, gait: "run", face: 0.85, grab: G[6], side: -1, role: null, spot: [-2070, 66], spotFace: -0.6, drift: 1 },
];
const sgn = (x: number) => (x > 0 ? 1 : -1);
const hangFace = (p: Plan) => 0.6 * sgn(p.face);
/** 跑完到抓住：蹲 0.1 秒、跳 0.22 秒 */
const PLANT = 0.32;
const LEAP_T = 0.22;
/** 起跳的地方离要抓的那一点多远（从旁边斜着跳上去，不从吊着的人脚底下钻过去）；老太太在年轻人左边被托起来 */
const TAKE_DX = 160;
const BOOST_TAKE_DX = 110;
const BOOST_DX = 190;
/** 起跳的地方离墙根多远 */
const Y_TAKE = 12;
/** 跑到起跳的地方以后蹲下去那一下，身子还往前滑一点 */
const SLIDE = 16;

/** 关键帧：五②站住抬头看的那些原样接着，再跑、蹲、跳、抓住、吊着 */
function keysOf(p: Plan, next: number | null, i: number): MoveKey[] {
  const f = p.face;
  const F = hangFace(p);
  const w = p.walker;
  const keys: MoveKey[] = w ? [...w.keys, { t: p.t0, p: lookUp(w.face, w.lx, w.point) }] : [{ t: p.t0 - 0.8, x: 0, p: RUN(f, false, p.gait) }];
  const step = p.gait === "run" ? 0.17 : p.gait === "jog" ? 0.19 : 0.24;
  let a = true;
  for (let t = p.t0 + step; t < runEnd(p) - 0.06; t += step) {
    keys.push({ t, ease: "inOut", p: RUN(f, a, p.gait) });
    a = !a;
  }
  if (p.role === "boosted") {
    // 站住、膝盖一弯，被托起来往上够
    keys.push({ t: T.boost0, ease: "out", p: BENT(f) }, { t: T.lift0, p: BENT(f) });
    keys.push({ t: T.lift0 + 0.14, ease: "out", squash: -0.05, p: LIFTED(f) }, { t: p.grab, p: LIFTED(f) });
  } else {
    if (p.role === "booster") {
      // 蹲下扶住她的腰，站起来把她往上托；松手，再蹲一下自己跳起来
      keys.push({ t: T.boost0 + 0.02, ease: "out", p: BOOST_LOW(f) }, { t: T.lift0, p: BOOST_LOW(f) });
      keys.push({ t: G[3] - 0.02, ease: "inOut", p: BOOST_UP(f) }, { t: G[3] + 0.1, p: BOOST_UP(f) });
      keys.push({ t: p.grab - LEAP_T, ease: "inOut", squash: 0.08, p: CROUCH(f) });
    } else keys.push({ t: p.grab - LEAP_T, ease: "out", squash: 0.08, p: CROUCH(f) });
    keys.push({ t: p.grab - LEAP_T + 0.1, ease: "out", squash: -0.07, p: LEAP(f) }, { t: p.grab, p: LEAP(f) });
  }
  // 抓住以后吊着；下面的人抓住自己的脚踝时，那条腿被拽直、往下一坠
  keys.push({ t: p.grab + 0.14, ease: "out", p: HANG(F) });
  const hang = next === null ? HANG(F) : PULLED(F);
  if (next !== null) keys.push({ t: next - 0.02, p: HANG(F) }, { t: next + 0.08, ease: "out", squash: -0.05, p: PULLED(F) });
  // 五⑤ 松手往下飘；落回街上站着看她（跳过去的那几秒里换朝向、换姿势，画面里看不见）；走过来的那两个人走几步、把手放上去
  const r = releaseOf(i, PLANS.length);
  keys.push({ t: r - 0.02, p: hang }, { t: r + 0.35, ease: "out", p: DRIFT(F) }, { t: 151, p: DRIFT(F) });
  const lx = p.spot[0] < -2900 ? 0.6 : -0.6;
  const st = STAND(p.spotFace, lx);
  keys.push({ t: 153.5, ease: "inOut", p: st });
  if (p.hand) {
    const w0 = LAND_T.walk0 + (p.hand.to === "kid" ? 0.15 : 0);
    keys.push({ t: w0, p: st });
    let a = true;
    for (let t = w0 + 0.22; t < p.hand.at - 0.2; t += 0.22) {
      keys.push({ t, ease: "inOut", p: { ...RUN(p.spotFace, a, "walk"), expression: "微笑", lookX: lx, lookY: 0.1 } });
      a = !a;
    }
    keys.push({ t: p.hand.at - 0.12, ease: "inOut", p: st }, { t: p.hand.at + 0.12, ease: "inOut", p: REACH(p.spotFace, lx) });
    keys.push({ t: 160, p: REACH(p.spotFace, lx) });
  } else keys.push({ t: 160, p: st });
  return keys;
}
/** 跑到哪一刻：一般是抓住前 0.32 秒；老太太跑到年轻人跟前站住，年轻人早一点到 */
function runEnd(p: Plan) {
  return p.role === "boosted" ? T.boost0 : p.role === "booster" ? T.boost0 - 0.08 : p.grab - PLANT;
}

interface Member extends Plan {
  spec: CastSpec;
  from: V2;
  move: ReturnType<typeof live>;
  /** 吊着时根相对上一个人脚踝：两只手举直，手心正好在脚踝上（留一点，胳膊微微弯着） */
  hang: V2;
}
const MEMBERS: Member[] = PLANS.map((p, i) => {
  const spec = p.spec ?? p.walker!.spec;
  const opts = p.walker ? p.walker.opts : { ...CROWD[0].opts, look: lookOf(spec), seed: p.seed };
  const move = live(keysOf(p, i + 1 < PLANS.length ? PLANS[i + 1].grab : null, i), opts);
  const j = castJoints(spec, figurePose(HANG(hangFace(p)), 0, lookOf(spec)));
  const hang: V2 = [-(j.palmL[0] + j.palmR[0]) / 2, -(j.palmL[1] + j.palmR[1]) / 2 - 6];
  return { ...p, spec, from: p.from ?? [p.walker!.x1, p.walker!.y1], move, hang };
});

// ——— 每个人这一刻在哪 ———
interface State {
  root: V2;
  pose: PoseIn;
  /** 远处那只脚踝（下一个人抓的地方） */
  ankle: V2;
}
/** 同一时刻的整条人链只算一次（镜头、画人、下一个人的 IK 都要用） */
const CACHE = new Map<number, (State | undefined)[]>();
function slot(t: number) {
  const k = Math.round(t * 1e4);
  let s = CACHE.get(k);
  if (!s) {
    if (CACHE.size > 48) CACHE.delete(CACHE.keys().next().value!);
    s = [];
    CACHE.set(k, s);
  }
  return s;
}
/** 老钟的脚踝（同一时刻只算一次） */
let zKey = NaN;
let zVal: V2 = [0, 0];
function zhongAnkleAt(t: number): V2 {
  if (t !== zKey) {
    zVal = zhongAnkle(t);
    zKey = t;
  }
  return zVal;
}
/** 第 i 个人要抓的脚踝：周磊抓老钟的，后面的抓前一个人的（都是远处那只） */
const ankleAbove = (i: number, t: number): V2 => (i === 0 ? zhongAnkleAt(t) : stateAt(i - 1, t).ankle);

/** 抓住那一刻：根在哪（上一个人的脚踝 + 吊着的偏移）、人链在往哪走多快（跳上去的速度接上它） */
const GRAB_AT: ({ root: V2; v: V2 } | undefined)[] = [];
function grabAt(i: number) {
  return (GRAB_AT[i] ??= (() => {
    const m = MEMBERS[i];
    const a = ankleAbove(i, m.grab);
    const b = ankleAbove(i, m.grab - 0.02);
    return { root: [a[0] + m.hang[0], a[1] + m.hang[1]] as V2, v: [(a[0] - b[0]) / 0.02, (a[1] - b[1]) / 0.02] as V2 };
  })());
}
/** 起跳的地方：要抓的那一点旁边（跑过来的那一边）；年轻人站在老太太右边托她，就从那里跳 */
function takeOf(i: number): V2 {
  const m = MEMBERS[i];
  if (m.role === "booster") return [takeOf(i - 1)[0] + BOOST_DX, Y_TAKE];
  return [grabAt(i).root[0] + m.side * (m.role === "boosted" ? BOOST_TAKE_DX : TAKE_DX), Y_TAKE];
}

/** 跑：起跑 0.2 秒加速，最后 0.15 秒慢下来（还带着三成多的速度蹲下去、往前滑一点） */
function runX(t: number, t0: number, t1: number, x0: number, x1: number) {
  const D = x1 - x0;
  const dur = t1 - t0;
  const a = Math.min(0.2, dur * 0.3);
  const d = Math.min(0.15, dur * 0.25);
  const ve = 0.35;
  const V = D / (a / 2 + (dur - a - d) + (d * (1 + ve)) / 2);
  const s = t - t0;
  if (s <= 0) return x0;
  if (s < a) return x0 + (V * s * s) / (2 * a);
  if (s < dur - d) return x0 + V * (a / 2 + (s - a));
  const e = Math.min(s, dur) - (dur - d);
  return x0 + V * (a / 2 + (dur - a - d) + e - ((1 - ve) * e * e) / (2 * d));
}
/** 三次 Hermite：从 p0（速度 v0）到 p1（速度 v1），用 dt 秒 */
function hermite(p0: V2, v0: V2, p1: V2, v1: V2, dt: number, u: number): V2 {
  const u2 = u * u;
  const u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1;
  const h10 = u3 - 2 * u2 + u;
  const h01 = -2 * u3 + 3 * u2;
  const h11 = u3 - u2;
  return [h00 * p0[0] + h10 * dt * v0[0] + h01 * p1[0] + h11 * dt * v1[0], h00 * p0[1] + h10 * dt * v0[1] + h01 * p1[1] + h11 * dt * v1[1]];
}

/** 第 i 个人的根：站着 → 跑 → 蹲（往前滑一点）→ 跳上去（或被托上去）→ 吊在上一个人脚下（一点晃） */
/** 吊着时的根：上一个人的脚踝 + 两只手举直的偏移 + 一节节往下传的晃（像一根绳子，抓住那一刻从 0 起） */
function hangRoot(i: number, t: number): V2 {
  const m = MEMBERS[i];
  const a = ankleAbove(i, t);
  const sway = 11 * Math.sin(t * 2 - i * 0.8) * Math.min(1, (t - m.grab) / 0.4);
  return [a[0] + m.hang[0] + sway, a[1] + m.hang[1]];
}
/** 五⑤ 松手那一刻的根和速度（往下飘时接上） */
const RELEASE_AT: ({ root: V2; v: V2 } | undefined)[] = [];
function releaseAt(i: number) {
  return (RELEASE_AT[i] ??= (() => {
    const r = releaseOf(i, MEMBERS.length);
    const a = hangRoot(i, r);
    const b = hangRoot(i, r - 0.02);
    return { root: a, v: [(a[0] - b[0]) / 0.02, (a[1] - b[1]) / 0.02] as V2 };
  })());
}
function rootOf(i: number, t: number): V2 {
  const m = MEMBERS[i];
  const take = takeOf(i);
  const dir = sgn(take[0] - m.from[0]);
  const t1 = runEnd(m);
  const tUp = m.role === "boosted" ? T.lift0 : m.grab - LEAP_T;
  // 五⑤ 松了手：天上接着松手那一刻的速度，往一边飘开、越落越快一点；落回街上以后站在自己的位置（走过来的那两个人从 from 走过来）
  const rel = releaseOf(i, MEMBERS.length);
  if (t >= rel) {
    if (t < LAND_T.street0 - 1) {
      const R = releaseAt(i);
      const d = t - rel;
      return [R.root[0] + R.v[0] * d + m.drift * (140 * d + 90 * d * d), R.root[1] + R.v[1] * d + 160 * d * d];
    }
    if (m.hand) {
      const w0 = LAND_T.walk0 + (m.hand.to === "kid" ? 0.15 : 0);
      const u = E.io(ph(t, w0, m.hand.at - 0.12));
      return [m.hand.from[0] + (m.spot[0] - m.hand.from[0]) * u, m.hand.from[1] + (m.spot[1] - m.hand.from[1]) * u];
    }
    return m.spot;
  }
  if (t >= m.grab) return hangRoot(i, t);
  if (t >= tUp) {
    const g = grabAt(i);
    const v0: V2 = m.role === "boosted" ? [0, -150] : [dir * 260, -350];
    return hermite(take, v0, g.root, g.v, m.grab - tUp, (t - tUp) / (m.grab - tUp));
  }
  if (t <= m.t0) return m.from;
  // 跑到起跳的地方前面一点（蹲下去时再往前滑 SLIDE）；年轻人走到老太太右边站住
  const end = m.role === "booster" ? take[0] : take[0] - dir * SLIDE;
  if (t < t1) {
    const u = ph(t, m.t0, t1);
    return [runX(t, m.t0, t1, m.from[0], end), m.from[1] + (take[1] - m.from[1]) * u];
  }
  if (m.role === "booster") return take;
  return [end + dir * SLIDE * E.out(ph(t, t1, tUp)), take[1]];
}

/** 第 i 个人这一刻：根、姿势（抓住前 0.08 秒起两只手 IK 到上一个人的脚踝；年轻人托老太太时两只手 IK 在她腰上）、远处那只脚踝 */
function stateAt(i: number, t: number): State {
  const s = slot(t);
  const hit = s[i];
  if (hit) return hit;
  const m = MEMBERS[i];
  const root = rootOf(i, t);
  const p: PoseIn = { ...m.move(t).pose };
  const face = (p.face as number | undefined) ?? m.face;
  const sc = m.spec.scale;
  const loc = (q: V2): V2 => [((face > 0 ? -1 : 1) * (q[0] - root[0])) / sc, (q[1] - root[1]) / sc];
  const rel = releaseOf(i, MEMBERS.length);
  const wGrab = E.io(ph(t, m.grab - 0.08, m.grab + 0.02)) * (1 - E.io(ph(t, rel, rel + 0.12)));
  // 五⑤ 走过来的那两个人：远处那只手放到她近处那只肩膀上 / 他背上
  const wHand = m.hand ? E.io(ph(t, m.hand.at - 0.12, m.hand.at + 0.1)) : 0;
  if (wHand > 0 && m.hand) {
    let q: V2;
    if (m.hand.to === "her") {
      const h = diveHer(t);
      const j = jointsOf(h.pose);
      q = [h.root[0] + j.shoulderL[0] - 20, h.root[1] + j.shoulderL[1] + 6];
    } else {
      const k = stoneC4(t);
      const kj = castJoints(k.spec, k.pose);
      q = [k.root[0] + (kj.shoulderL[0] + kj.shoulderR[0]) / 2 + 26, k.root[1] + (kj.shoulderL[1] + kj.shoulderR[1]) / 2 + 30];
    }
    p.armR = { ...(p.armR as object), to: loc(q), ik: wHand } as PoseIn["armR"];
  }
  if (wGrab > 0) {
    const a = ankleAbove(i, t);
    p.armL = { ...(p.armL as object), to: loc([a[0] - 5, a[1] + 2]), ik: wGrab } as PoseIn["armL"];
    p.armR = { ...(p.armR as object), to: loc([a[0] + 6, a[1] + 12]), ik: wGrab } as PoseIn["armR"];
  } else if (m.role === "booster") {
    const wB = E.io(ph(t, T.boost0, T.boost0 + 0.1)) * (1 - E.io(ph(t, G[3] + 0.04, G[3] + 0.14)));
    if (wB > 0) {
      const o = stateAt(i - 1, t);
      const hip = castJoints(MEMBERS[i - 1].spec, o.pose).hip;
      const h: V2 = [o.root[0] + hip[0], o.root[1] + hip[1]];
      p.armL = { ...(p.armL as object), to: loc([h[0] + 18, h[1] + 4]), ik: wB } as PoseIn["armL"];
      p.armR = { ...(p.armR as object), to: loc([h[0] - 4, h[1] - 6]), ik: wB } as PoseIn["armR"];
    }
  }
  const j = castJoints(m.spec, p);
  const st: State = { root, pose: p, ankle: [root[0] + j.ankleR[0], root[1] + j.ankleR[1]] };
  s[i] = st;
  return st;
}

/** 这一刻人链里每个人（五④接着用）：人、根、姿势、远处那只脚踝、抓住的时刻 */
export function chainAt(t: number) {
  return MEMBERS.map((m, i) => ({ spec: m.spec, grab: m.grab, ...stateAt(i, t) }));
}

/** 人链里的人（五③起由这里画，五②站在街上时由 lib/chain.ts 画）：先抓住的先画，后面的压在前面（抓脚踝的手在上一个人的脚前面） */
export function drawLink(g: CanvasRenderingContext2D, t: number, cam: Cam, part: "all" | "back" | "front" = "all") {
  if (t < T.start) return;
  // 五⑤ 落回街上以后按远近画（连老钟一起）：比她靠后的先画，她和他画完再画比她靠前的（千斤放在她肩上的手、周磊放在他背上的手压在上面）
  if (t >= LAND_T.street0 - 1) {
    drawStreetFolk(g, t, cam, part);
    return;
  }
  const v = viewOf(cam, 1);
  const items: { m: Member; s: State }[] = [];
  for (let i = 0; i < MEMBERS.length; i++) {
    const m = MEMBERS[i];
    if (!m.walker && t < m.t0) continue;
    // 吊着的人要算出上面整条链；还在地上的先看位置在不在画面里
    if (t < m.grab) {
      const r = rootOf(i, t);
      if (r[0] < v.x0 - 300 || r[0] > v.x1 + 300) continue;
    }
    const s = stateAt(i, t);
    if (s.root[0] < v.x0 - 300 || s.root[0] > v.x1 + 300 || s.root[1] - 800 > v.y1 || s.root[1] + 200 < v.y0) continue;
    items.push({ m, s });
  }
  if (!items.length) return;
  // 年轻人等着托老太太、托她的时候画在最后面（不挡住在他跟前起跳的阿满；扶腰的手藏在她身后）；松手以后照常（抓她脚踝的手在她脚前面）
  if (t < G[3] + 0.15) {
    const b = items.findIndex((it) => it.m.role === "booster");
    if (b > 0) items.unshift(...items.splice(b, 1));
  }
  const xs = items.map((it) => it.s.root[0]);
  const ys = items.map((it) => it.s.root[1]);
  drawTinted(g, [Math.min(...xs) - 400, Math.min(...ys) - 800, Math.max(...xs) + 400, Math.max(...ys) + 160], (gg) => {
    for (const it of items) drawPerson(gg, it.m.spec, it.s.pose, it.s.root[0], it.s.root[1], cam.z);
  }, 0.85);
}

/** 五⑤ 落回街上的一群人（她救过的人和老钟）：back 比她（根离墙 HER_LAND[1]）靠后的，front 靠前的；离镜头近的后画 */
function drawStreetFolk(g: CanvasRenderingContext2D, t: number, cam: Cam, part: "all" | "back" | "front") {
  const v = viewOf(cam, 1);
  const folk: { spec: CastSpec; pose: PoseIn; root: V2 }[] = MEMBERS.map((m, i) => ({ spec: m.spec, ...stateAt(i, t) }));
  const z = zhongAt(t);
  folk.push({ spec: CAST.老钟, pose: z.pose, root: z.root });
  const sel = folk
    .filter((f) => (part === "all" ? true : part === "back" ? f.root[1] <= HER_LAND[1] : f.root[1] > HER_LAND[1]))
    .filter((f) => f.root[0] > v.x0 - 300 && f.root[0] < v.x1 + 300 && f.root[1] - 800 < v.y1)
    .sort((a, b) => a.root[1] - b.root[1]);
  if (!sel.length) return;
  const xs = sel.map((f) => f.root[0]);
  drawTinted(g, [Math.min(...xs) - 400, -900, Math.max(...xs) + 400, 260], (gg) => {
    for (const f of sel) drawPerson(gg, f.spec, f.pose, f.root[0], f.root[1], cam.z);
  }, 0.85);
}

// ——— 镜头 ———
/** 人链最上面（他举着的砖）离街面多高的平滑估计：不算一下一下的坠（镜头跟它走，不跟真实的顶，不然一节一节地抖） */
let TOP0: number | null = null;
function topH(t: number): number {
  TOP0 ??= -stoneC4(T.start).root[1] + 400;
  // 五④ 起他照 lib/coatoff.ts 的 giveAt 越升越慢地升到她跟前（平滑的，不再有一下一下的坠）
  if (t > T.end) return topH(T.end) + liftAt(t) - liftAt(T.end);
  return TOP0 + 110 * (t - T.start) + linkLiftSmooth(t);
}
const smin = (a: number, b: number, k: number) => -k * Math.log(Math.exp(-a / k) + Math.exp(-b / k));
const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);
/**
 * 五③的镜头：接着五②退开的那个远景（0.42 倍）。人链越接越长，街面在画面上慢慢往下沉（镜头抬起来让出地方）；
 * 人链顶上的砖快到画面上边时开始往后退，平滑地退到正好装得下（越接越快，退得也越快），退到 0.31 倍为止（只退不推）；
 * 之后跟着整条人链往上走：砖留在画面上边（越升越快时慢一点跟，砖往上走一点），街面从画面底下出去。
 * 左右慢慢挪到人链上。周磊抓住老钟那一下轻轻一顿。
 */
export function cam53(t: number): Cam {
  const [bx, by] = breath(t);
  const gs0 = 1199.2 + 480 * E.io(ph(t, 140.4, 143.2));
  const top = topH(t);
  const z = smax(0.31, smin(0.42, (gs0 - 220) / top, 0.012), 0.012);
  const ytop = 220 - 70 * E.io(ph(t, 143.4, 144.3));
  const gs = smax(gs0, ytop + z * top, 20);
  const xc = -1760 + (stoneX(t) + 40 + 1760) * E.io(ph(t, 140.3, 143.4));
  const c = aim(xc + bx / z, by / z, 540, gs, z);
  const kk = kick(t, G[0], 0.1);
  return { ...c, z: c.z * (1 + 0.02 * kk), y: c.y + (6 * kk * Math.sin((t - G[0]) * 50)) / c.z };
}
