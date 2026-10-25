// 重做的四声「活下去」+ 尾奏里的人链（时刻、谁、多高在 lib/fin_rise.ts；他在 lib/fin_cast.ts；老钟在窗里那段在 lib/fin_zhong.ts）。
// 草稿的做法：门一扇扇打开，人们走上街、第一次抬头；她救过的人一个接一个从街两边跑来，最下面那个人站在街上抓着上面那个人的脚踝，
// 人链往上一提，他被拽离地面（鞋留在街上），下一个人正好跑到跟前举起手抓住他——一条从地面连到天上的手。每个人胸前挂着她送的那块砖。
// 「在这反乌托邦里」整条人链一下子沉了，一节节落回街上：最下面的人先着地，松开手往两边站开，仰着头看她落下来；
// 她落地以后，她救过的那几个走过来把手放在她的肩上、背上。

import { type MoveKey, type PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { type CastSpec, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type Cam, E, ph, viewOf } from "./cam";
import { drawGlow, drawTinted, part } from "./world";
import { ARMS, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { drawPerson } from "./people";
import { T9, herm, mix } from "./fin_t";
import { BASE_X, JOIN_T, MEMBERS, type Member, handUp } from "./fin_rise";
import { X_LAND, herAt, kidAt } from "./fin_cast";
import { ZHONG_IN } from "./fin_zhong";
import { jointsOf } from "@materials/剪纸角色/code/chengtuo";

type V2 = [number, number];
type Angles = ReturnType<typeof pose>;

// ——————————————— 姿势（f：朝向，正数朝右） ———————————————
const stride = (f: number, run: boolean, a: boolean): Angles => {
  const k = a ? 1 : -1;
  const lean = run ? 16 : 4;
  return pose(lean, { face: f, ground: false, ...legR(k * (run ? 38 : 22), run ? -40 : -14, 0), ...legL(-k * (run ? 32 : 18), run ? -50 : -22, 0), neck: run ? 10 : 8, expression: "坚定", lookY: -0.5 }, (l) => ({
    ...armL(-k * (run ? 46 : 20), run ? 80 : 20, 0, run ? "fist" : "relax", l),
    ...armR(k * (run ? 46 : 20), run ? 80 : 20, 0, run ? "fist" : "relax", l),
  }));
};
/** 站在街上抬头看（第一次抬头）：吓一跳，远处那只手指着天上 */
const LOOK = (f: number, point: boolean): Angles =>
  pose(-4, { face: f, ground: false, ...legR(6, -6), ...legL(-4, -2), neck: 28, expression: "吓一跳", lookX: 0, lookY: -1 }, (l) => ({
    ...armL(10, 20, 0, "relax", l),
    ...(point ? armR(150, 10, 0, "point", l) : armR(14, 24, 0, "relax", l)),
  }));
/** 站在街上把手举直，抓住上面那个人的脚踝 */
const REACH = (f: number): Angles =>
  pose(-2, { face: f, ground: false, ...legR(4, -2), ...legL(-4, -2), neck: 30, expression: "坚定", lookY: -1 }, (l) => ({
    ...armL(172, 4, 0, "grip", l),
    ...armR(168, 6, 0, "grip", l),
  }));
/** 吊着：两只手攥着上面那个人的脚踝（IK），腿悬着，仰着头 */
const HANG = (f: number): Angles =>
  pose(-4, { face: f, ground: false, float: 0.1, ...legR(6, -24, -40), ...legL(-8, -16, -44), neck: 24, expression: "坚定", lookY: -1 }, (l) => ({
    ...armL(172, 4, 0, "grip", l),
    ...armR(168, 6, 0, "grip", l),
  }));
/** 下面的人抓住了自己远处那只脚踝：那条腿被拽直，另一条蜷一点 */
const PULLED = (f: number): Angles => ({ ...HANG(f), ...legR(2, -2, -30), ...legL(20, -50, -40) });
/** 被拽离地面那一下：脚尖点着，鞋留在街上 */
const TIPTOE = (f: number): Angles => ({ ...REACH(f), ...legR(4, -2, -40), ...legL(-4, -2, -40) });
/** 落回街上站着，仰头看着她，哭着笑 */
const WATCH = (f: number): Angles =>
  pose(-2, { face: f, ground: false, ...legR(6, -6), ...legL(-4, -2), neck: 26, expression: "哭着笑", tears: 1, lookX: 0, lookY: -1 }, (l) => ({
    ...armL(8, 24, 0, "relax", l),
    ...armR(10, 26, 0, "relax", l),
  }));
/** 看着她（落地以后），哭着笑 */
const SMILE = (f: number, lx: number): Angles => ({ ...WATCH(f), neck: 4, lookX: lx, lookY: 0.2 });
/** 走过来把远处那只手放在她肩上（IK） */
const TOUCH = (f: number, lx: number): Angles => ({ ...SMILE(f, lx), ...armR(96, 30, 0, "open", 0) });

// ——————————————— 每个人的安排 ———————————————
interface Plan {
  m: Member;
  k: number;
  /** 上街的时刻（从门里出来 / 从街头跑进画面）；有的先站住抬头看一会儿 */
  t0: number;
  /** 站住抬头看（门里出来的）的地方和时刻；之后跑过去 */
  look?: { x: number; t: number; point: boolean };
  /** 起跑的时刻（跑到最下面那个人脚底下，正好在 join 举起手） */
  run0: number;
  /** 抓住的时刻 */
  join: number;
  /** 落回街上以后站在哪（根的 x）、朝哪 */
  spot: number;
  spotFace: number;
  /** 走过来把手放在她 / 他身上：哪只肩、从哪个时刻起 */
  touch?: { at: number; x: number; to: "herL" | "herR" | "kid" };
}
const RUN_V = 900;
/** 落地以后站开的地方：往两边一左一右 */
const SPOTS = [-1560, -2360, -1440, -2500, -1300, -2640, -1180, -2760, -1060, -2880, -940, -3000, -820, -3120, -700, -3240];
const PLANS: Plan[] = MEMBERS.map((m, k) => {
  const join = JOIN_T[k];
  const dist = Math.abs(m.from - BASE_X);
  const run0 = join - 0.18 - dist / RUN_V;
  const fromDoor = m.door !== undefined;
  const t0 = fromDoor ? T9.doors[(k % 2) + (k > 3 ? 2 : 0)] ?? T9.doors[0] : run0;
  const look = fromDoor ? { x: (m.door as number) + (m.from < BASE_X ? 60 : -60), t: t0 + 0.4, point: k % 2 === 1 } : undefined;
  const spot = k === 0 ? -1820 : SPOTS[k % SPOTS.length];
  return { m, k, t0, look, run0: Math.max(run0, look ? look.t + 0.3 : run0), join, spot, spotFace: spot < X_LAND ? 0.6 : -0.6 };
});
// 她落地以后走过来把手放在她肩上、他背上的：千斤（她近处那只肩）、周磊（他背上）、老钟、阿满、老太太
const TOUCHERS: [string, number, number, "herL" | "herR" | "kid"][] = [
  ["千斤", T9.hands, X_LAND - 175, "herL"],
  ["周磊", T9.hands + 0.25, X_LAND + 330, "kid"],
  ["老钟", T9.hands + 0.5, X_LAND - 330, "herL"],
  ["阿满", T9.hands + 0.7, X_LAND + 470, "kid"],
  ["老太太", T9.hands + 0.9, X_LAND - 470, "herL"],
];
for (const [name, at, x, to] of TOUCHERS) {
  const p = PLANS.find((q) => q.m.name === name);
  if (p) p.touch = { at, x, to };
}

// ——————————————— 人链的形状：每个人吊在上一个人远处那只脚踝下面 ———————————————
const SPEC_BARE = new Map<CastSpec, CastSpec>();
/** 被拽离地面以后光着脚（鞋留在街上） */
const bare = (s: CastSpec) => {
  let b = SPEC_BARE.get(s);
  if (!b) SPEC_BARE.set(s, (b = { ...s, shoes: "bare" }));
  return b;
};
/** 吊着时两只手心中点相对根（按朝向） */
const palmMid = (m: Member, f: number): V2 => [f < 0 ? -16 * m.spec.scale : 16 * m.spec.scale, -handUp(m)];

/** 人链沉下来以后第 k 个人落地的时刻（他的根落到街面那一刻） */
let LAND_AT: number[] | null = null;

interface MemberNow {
  spec: CastSpec;
  pose: PoseIn;
  root: V2;
  /** 远处那只脚踝（下面的人抓这里） */
  ankle: V2;
  /** 在人链里吊着 */
  hanging: boolean;
  /** 画不画（还没上街的不画；老钟在窗里那段由 lib/fin_zhong.ts 画） */
  on: boolean;
  /** 鞋留在街上的地方（被拽离地面以后） */
  shoes: V2 | null;
  /** 胸口（挂着她的砖） */
  chest: V2;
}
let MOVES: ReturnType<typeof live>[] | null = null;
function moves() {
  if (MOVES) return MOVES;
  MOVES = PLANS.map((p) => {
    const f = p.m.face;
    const keys: MoveKey[] = [];
    const t0 = Math.min(p.t0, p.run0) - 0.6;
    if (p.look) {
      // 从门里出来：走两步，站住，第一次抬头看天
      keys.push({ t: t0, x: 0, p: stride(f, false, false) });
      keys.push({ t: p.t0 + 0.2, ease: "inOut", p: stride(f, false, true) });
      keys.push({ t: p.look.t, ease: "inOut", p: LOOK(f, p.look.point) });
      keys.push({ t: p.run0, p: LOOK(f, p.look.point) });
    } else keys.push({ t: t0, x: 0, p: stride(f, true, false) });
    // 跑过去：一步 0.17 秒
    let a = true;
    for (let t = p.run0 + 0.17; t < p.join - 0.3; t += 0.17) {
      keys.push({ t, ease: "inOut", p: stride(f, true, a) });
      a = !a;
    }
    // 举起手，抓住，被拽离地面（脚尖点着）
    keys.push({ t: p.join - 0.12, ease: "inOut", p: REACH(f) });
    keys.push({ t: p.join + 0.12, ease: "inOut", p: TIPTOE(f) });
    keys.push({ t: p.join + 0.4, ease: "inOut", p: HANG(f) });
    // 下面的人抓住了自己的脚踝：那条腿拽直、往下一坠
    const next = PLANS[p.k + 1];
    if (next) {
      keys.push({ t: next.join - 0.02, p: HANG(f) });
      keys.push({ t: next.join + 0.1, ease: "out", squash: -0.05, p: PULLED(f) });
      keys.push({ t: next.join + 0.4, ease: "inOut", p: PULLED(f) });
    }
    // 沉下来：着地、松手、往旁边站开，仰头看她落下来；她落地以后看着她笑
    const land = landAt(p.k);
    keys.push({ t: land - 0.2, p: next ? PULLED(f) : HANG(f) });
    keys.push({ t: land, ease: "inOut", squash: 0.07, p: WATCH(p.spotFace) });
    keys.push({ t: land + 0.22, ease: "out", p: WATCH(p.spotFace) });
    const walkEnd = land + 0.9;
    keys.push({ t: walkEnd, ease: "inOut", p: WATCH(p.spotFace) });
    keys.push({ t: T9.land - 0.1, p: WATCH(p.spotFace) });
    keys.push({ t: T9.land + 0.5, ease: "inOut", p: SMILE(p.spotFace, p.spotFace > 0 ? 0.5 : -0.5) });
    if (p.touch) {
      const tf = p.touch.x < X_LAND ? 0.6 : -0.6;
      keys.push({ t: p.touch.at - 0.5, p: SMILE(p.spotFace, p.spotFace > 0 ? 0.5 : -0.5) });
      keys.push({ t: p.touch.at, ease: "inOut", p: SMILE(tf, tf > 0 ? 0.6 : -0.6) });
      keys.push({ t: p.touch.at + 0.45, ease: "inOut", p: TOUCH(tf, tf > 0 ? 0.6 : -0.6) });
      keys.push({ t: T9.rise - 0.1, p: TOUCH(tf, tf > 0 ? 0.6 : -0.6) });
      keys.push({ t: T9.rise + 0.4, ease: "inOut", p: SMILE(tf, tf > 0 ? 0.5 : -0.5) });
    }
    keys.push({ t: 154, p: keys[keys.length - 1].p });
    return live(keys, { look: lookOf(p.m.spec), base: { wind: 0.85 }, idle: true, seed: 900 + p.k * 7, springs: ARMS, follow: 0 });
  });
  return MOVES;
}

/** 第 k 个人吊着时的根（不算沉下来以后着地）：吊在上面那个人（k = 0 是他）远处那只脚踝下面 */
const hangMemo = new Map<number, V2[]>();
function hangRoots(t: number): V2[] {
  const key = Math.round(t * 1e4);
  const hit = hangMemo.get(key);
  if (hit) return hit;
  const out: V2[] = [];
  // 他远处那只脚踝（老钟攥着的地方）
  let above: V2 = kidAt(t).ankleR;
  for (let k = 0; k < PLANS.length; k++) {
    const p = PLANS[k];
    const f = p.m.face;
    const pm = palmMid(p.m, f);
    const root: V2 = [above[0] - pm[0], above[1] - pm[1]];
    out.push(root);
    // 这个人远处那只脚踝（拽直的那条腿）
    above = [root[0] + (f < 0 ? -34 : 34) * p.m.spec.scale, root[1] - 62 * (p.m.spec.scale / 0.97)];
  }
  if (hangMemo.size > 200) hangMemo.clear();
  hangMemo.set(key, out);
  return out;
}
/** 人链沉下来以后第 k 个人着地的时刻 */
function landAt(k: number): number {
  if (!LAND_AT) {
    LAND_AT = PLANS.map(() => T9.land);
    for (let i = 0; i < PLANS.length; i++) {
      for (let t = T9.sink; t < T9.land; t += 0.01) {
        if (hangRoots(t)[i][1] >= -2) {
          LAND_AT[i] = t;
          break;
        }
      }
    }
  }
  return LAND_AT[k];
}

/** 第 k 个人这一刻 */
const memo = new Map<number, MemberNow[]>();
export function chainNow(t: number): MemberNow[] {
  const key = Math.round(t * 1e4);
  const hit = memo.get(key);
  if (hit) return hit;
  const mv = moves();
  const roots = hangRoots(t);
  const out = PLANS.map((p, k) => {
    const f = p.m.face;
    const pose0: PoseIn = { ...mv[k](t).pose };
    let root: V2;
    let hanging = false;
    let on = true;
    let shoes: V2 | null = null;
    // 站在哪抓住的（脚底下，也是鞋留下的地方）
    const standX = roots[k][0];
    const land = landAt(k);
    if (k === 0 && t < T9.zhongOut) {
      on = false;
      root = roots[0];
    } else if (k === 0 && t < T9.zhongOut + 0.3) {
      // 老钟扳不住窗框，被拽出了窗：从窗里探着身子的地方一下被拽到他脚底下吊着
      hanging = true;
      const u = E.out(ph(t, T9.zhongOut, T9.zhongOut + 0.3));
      root = mix([ZHONG_IN[0] - 30, ZHONG_IN[1]], roots[0], u);
    } else if (t < p.t0) {
      on = false;
      root = [p.m.from, 0];
    } else if (t < p.join) {
      // 上街：门里出来站住抬头 → 跑到最下面那个人脚底下
      const lookX = p.look ? p.look.x : p.m.from;
      if (p.look && t < p.run0) root = [lookX + (p.m.from - lookX) * (1 - E.out(ph(t, p.t0, p.look.t))), 0];
      else {
        const u = ph(t, p.run0, p.join - 0.14);
        const x0 = p.look ? lookX : p.m.from;
        root = [x0 + (standX - x0) * (u < 1 ? u : 1), 0];
        if (u >= 1) root = [standX, 0];
      }
    } else if (t < land || t < T9.sink) {
      // 吊在人链里：抓住那一下还站在街上（被拽离地面：脚底从街面起来）
      hanging = true;
      root = roots[k];
      if (root[1] > 0) root = [root[0], 0];
      shoes = [standXAtJoin(k), 0];
    } else {
      // 落回街上：松手，往旁边站开（走几步），站着仰头看她落下来
      const r0: V2 = [roots[k][0], 0];
      const u = E.io(ph(t, land + 0.15, land + 0.9));
      root = [r0[0] + (p.spot - r0[0]) * u, 14 + 40 * (k % 3) * u];
      shoes = [standXAtJoin(k), 0];
      if (p.touch && t > p.touch.at - 0.5) {
        const w = E.io(ph(t, p.touch.at - 0.5, p.touch.at + 0.2));
        root = [root[0] + (p.touch.x - root[0]) * w, root[1] + (24 - root[1]) * w];
      }
    }
    const spec = t >= p.join + 0.1 ? bare(p.m.spec) : p.m.spec;
    const sc = spec.scale;
    const loc = (q: V2): V2 => [(f > 0 ? -1 : 1) * (q[0] - root[0]) / sc, (q[1] - root[1]) / sc];
    // 两只手攥着上面那个人远处那只脚踝（抓住前 0.1 秒伸过去；落地松手）
    if (t >= p.join - 0.12 && t < land + 0.1 && (k > 0 || t >= T9.zhongOut)) {
      const a = aboveAnkle(t, k, roots);
      const w = E.io(ph(t, p.join - 0.12, p.join)) * (1 - E.io(ph(t, land, land + 0.1)));
      pose0.armL = { ...(pose0.armL as object), to: loc([a[0] - 5, a[1] + 2]), ik: w } as PoseIn["armL"];
      pose0.armR = { ...(pose0.armR as object), to: loc([a[0] + 6, a[1] + 14]), ik: w } as PoseIn["armR"];
    }
    // 走过来把手放在她的肩上、他的背上
    if (p.touch && t > p.touch.at) {
      const w = E.io(ph(t, p.touch.at + 0.1, p.touch.at + 0.5)) * (1 - E.io(ph(t, T9.rise - 0.1, T9.rise + 0.3)));
      if (w > 0) {
        const target = touchPoint(t, p.touch.to);
        pose0.armR = { ...(pose0.armR as object), to: loc(target), ik: w } as PoseIn["armR"];
      }
    }
    const j = castJoints(spec, pose0);
    const ankle: V2 = [root[0] + j.ankleR[0], root[1] + j.ankleR[1]];
    const chest: V2 = [root[0] + (j.shoulderL[0] + j.shoulderR[0]) / 2, root[1] + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 34 * sc];
    return { spec, pose: pose0, root, ankle, hanging, on, shoes, chest };
  });
  if (memo.size > 200) memo.clear();
  memo.set(key, out);
  return out;
}
/** 上面那个人远处那只脚踝（世界坐标）：按吊着的根推出来 */
function aboveAnkle(t: number, k: number, roots: V2[]): V2 {
  if (k === 0) return kidAt(t).ankleR;
  const p = PLANS[k - 1];
  const r = roots[k - 1];
  const f = p.m.face;
  return [r[0] + (f < 0 ? -34 : 34) * p.m.spec.scale, r[1] - 62 * (p.m.spec.scale / 0.97)];
}
/** 抓住那一刻站在哪（鞋留在这里） */
const STAND_AT = new Map<number, number>();
function standXAtJoin(k: number) {
  let x = STAND_AT.get(k);
  if (x === undefined) STAND_AT.set(k, (x = hangRoots(PLANS[k].join)[k][0]));
  return x;
}
/** 手放上去的地方：她近处那只肩膀 / 她远处那只肩膀 / 他的背 */
function touchPoint(t: number, to: "herL" | "herR" | "kid"): V2 {
  if (to === "kid") {
    const k = kidAt(t);
    return [k.chest[0] + 26, k.chest[1] - 6];
  }
  const h = herAt(t);
  const j = jointsOf(h.pose);
  const s = to === "herL" ? j.shoulderL : j.shoulderR;
  return [h.root[0] + s[0], h.root[1] + s[1] + 6];
}

// ——————————————— 画 ———————————————
/** 一双鞋留在街上（按这个人原来穿的鞋的颜色；光脚的人不留） */
function drawShoes(g: CanvasRenderingContext2D, spec: CastSpec, at: V2, k: number, line: number) {
  const s = spec.shoes;
  if (s === "bare" || s === "boots") return;
  const col = s.color;
  const shade = s.shade;
  for (const [dx, rot] of [
    [-16, -0.08 + 0.12 * Math.sin(k * 2.1)],
    [18, 0.1 + 0.1 * Math.sin(k * 1.3)],
  ]) {
    g.save();
    g.translate(at[0] + dx * spec.scale, at[1] - 2);
    g.rotate(rot);
    const p = new Path2D();
    p.moveTo(-26, 0);
    p.quadraticCurveTo(-28, -16, -12, -18);
    p.lineTo(8, -16);
    p.quadraticCurveTo(26, -12, 28, 0);
    p.closePath();
    part(g, p, col, shade, 2.6 * line, [3, 2]);
    g.restore();
  }
}
/** 胸前挂着的她送的砖：一根红绳挂在脖子上，一小块砖（亮着一点暖光） */
function drawNeckBrick(g: CanvasRenderingContext2D, chest: V2, sc: number, line: number, t: number, k: number) {
  const sw = Math.sin(t * 2.2 + k) * 0.08;
  g.save();
  g.translate(chest[0], chest[1]);
  g.rotate(sw);
  g.strokeStyle = "#c8443a";
  g.lineWidth = 2.2 * line;
  g.beginPath();
  g.moveTo(-12 * sc, -40 * sc);
  g.lineTo(0, -4 * sc);
  g.lineTo(12 * sc, -40 * sc);
  g.stroke();
  const b = new Path2D();
  b.roundRect(-15 * sc, -6 * sc, 30 * sc, 12 * sc, 2);
  part(g, b, "#d6cfc2", "#bfb7a8", 2 * line, [2, 2]);
  g.fillStyle = "#3f3140";
  g.fillRect(-9 * sc, -1.5 * sc, 18 * sc, 2.4 * sc);
  g.restore();
}
/** 人链里、街上的人（世界坐标）。part：front 画在她前面（落地以后比她靠前的），back 后面，all 全画 */
export function drawChain(g: CanvasRenderingContext2D, t: number, cam: Cam, part2: "all" | "back" | "front" = "all") {
  const v = viewOf(cam, 1);
  const line = 1 / Math.sqrt(Math.max(0.3, cam.z));
  const all = chainNow(t);
  // 鞋：留在街上（人链最下面那一圈）
  if (part2 !== "front" && v.y1 > -200)
    for (let k = 0; k < all.length; k++) if (all[k].shoes) drawShoes(g, PLANS[k].m.spec, all[k].shoes as V2, k, line);
  // 吊在人链里的人胸前那块砖亮着：远景里连成一串暖光
  if (part2 !== "front" && cam.z < 0.7)
    for (const m of all) if (m.on && m.hanging) drawGlow(g, m.chest[0], m.chest[1], Math.max(60, 26 / cam.z), 0.55);
  const vis = all
    .map((m, k) => ({ m, k }))
    .filter(({ m }) => m.on && m.root[0] > v.x0 - 300 && m.root[0] < v.x1 + 300 && m.root[1] - 720 < v.y1 && m.root[1] + 150 > v.y0)
    .filter(({ m }) => part2 === "all" || (part2 === "front") === (m.root[1] > 30 && !m.hanging));
  if (!vis.length) return;
  let box: [number, number, number, number] = [1e9, 1e9, -1e9, -1e9];
  for (const { m } of vis) box = [Math.min(box[0], m.root[0] - 420), Math.min(box[1], m.root[1] - 720), Math.max(box[2], m.root[0] + 420), Math.max(box[3], m.root[1] + 140)];
  drawTinted(g, box, (gg) => {
    // 先抓住的先画（上面的），后面的压在前面（抓脚踝的手在上一个人的脚前面）
    for (const { m, k } of vis) {
      drawPerson(gg, m.spec, m.pose, m.root[0], m.root[1], cam.z);
      drawNeckBrick(gg, m.chest, m.spec.scale, line, t, k);
    }
  }, 0.85);
}
/** 人链最顶上的砖亮得最多的那一串：给镜头算人链的顶（他的根）和底 */
export const chainPlans = PLANS;
export { landAt };
void mix;
void herm;
