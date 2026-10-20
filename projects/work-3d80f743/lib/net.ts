// 副歌一①「只因为 / 你那渴望自由的心脏 / 困在一张没空隙的网」（39.39–43.92）。字（酷狗逐字）：只 39.39 因 39.72 为 39.84（拖到 40.7），
// 40.016 副歌鼓进来；你 40.74 那 40.80 渴 40.86 望 40.92 自 40.98 由 41.04 的 41.10 心 41.37 脏 41.70；困 41.94 在 42.09 一 42.15 张 42.21
// 没 42.27 空 42.33 隙 42.39 的 42.45 网 42.51（拖到 43.9）。
// 一个镜头：从她的屋子退出窗外（⑧推进窗反过来）：夜里最高那栋楼的顶层，她那扇亮着的窗。副歌一进来，窗外的巷子里一个人往上飘——
// 张着手、闭着眼笑，越飘越快，从她窗外升过去，扑向头顶的白；「困」拴在他脚踝上的红绳一下绷直，把他拽住（另一头拴在他家的窗上，
// 就在她家楼下几层）。镜头往后一路退到整座城：天上到处是这样被拴住的人，一根根红绳从城里的窗、楼顶拉上来，缠成一张盖住整座城的网。
// 她拴着自己（脚绳是她自己拴在椅子上的），他们是被家里人拴住的。

import { type CastSpec, castJoints, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import { type Angles, type MoveKey, type PoseIn, figurePose } from "@materials/剪纸角色/code/chengtuo";
import { seeded } from "@frame/engine/math";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, H, W, aim, camLerp, kick, ph } from "./cam";
import { type Block, INK, LAYERS, QJ_HOME, STREET, TOWER, drawGlow, drawSilhouette, drawTinted } from "./world";
import { LIMP, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";
import { twelveCam } from "./write";
import { homeWindow } from "./night";
import { DAWN_T, nightGlow } from "./dawn";

type V2 = [number, number];

export const NET_T = {
  start: 39.39,
  /** 退出窗外，停在「她亮着的窗 + 楼顶 + 头顶的白」上 */
  out: 40.1,
  /** 他升到画面中间以后镜头跟上去、往上抬 */
  follow0: 41.3,
  follow1: 41.72,
  /** 「心」「脏」：他胸口那团光跳一下 */
  heart: 41.37,
  heart2: 41.7,
  /** 「困」：红绳绷直（小节线） */
  yank: beatAt(84),
  /** 往后退开，落在整座城上 */
  pull0: 42.06,
  wide: 43.7,
  end: 43.92,
};

function pose(lean: number, rest: Omit<Angles, "lean">, arms: (lean: number) => Angles): Angles {
  return { lean, ...rest, ...arms(lean) };
}

// ——— 往上飘的那个人（路人，短发：失重只给一点，|face| 别停在 0.2–0.45，头发会画成尖） ———
const MAN: CastSpec = passerby(5);
const MAN_POSES = {
  /** 往上飘：远处的手伸向白、近处的手往后，腿拖在后面，仰着头、闭着眼笑（松了一口气） */
  升: pose(-6, { face: -0.85, ground: false, float: 0.12, rot: -4, ...legL(-8, -44, -50), ...legR(12, -24, -46), neck: 22, expression: "释然", blink: 1, smile: 0.45 }, (l) => ({
    ...armL(-30, 24, -10, "open", l),
    ...armR(165, 12, 8, "open", l),
  })),
  /** 被拽住：腿一下被扯直，两只手甩到头顶，睁大眼 */
  拽住: pose(4, { face: -0.85, ground: false, float: 0, rot: 4, ...legL(-2, -2, -40), ...legR(34, -56, -30), neck: -14, expression: "吓一跳", lookY: 0.4 }, (l) => ({
    ...armL(150, 30, 0, "open", l),
    ...armR(172, 20, 0, "open", l),
  })),
  /** 悬着：远处的手还举着，近处的手垂下来，低头看着拴住他的那根绳子 */
  悬着: pose(0, { face: -0.85, ground: false, float: 0, rot: 2, ...legL(0, -4, -44), ...legR(20, -40, -36), neck: -18, expression: "难过", sad: 0.85, lookX: 0.1, lookY: 0.8 }, (l) => ({
    ...armL(20, 30, 0, "relax", l),
    ...armR(150, 24, 0, "open", l),
  })),
};
const manMove = live(
  [
    { t: 39.3, x: 0, p: MAN_POSES.升 },
    { t: NET_T.yank - 0.01, p: MAN_POSES.升 },
    { t: NET_T.yank + 0.07, ease: "out", p: MAN_POSES.拽住 },
    { t: NET_T.yank + 0.42, ease: "inOut", p: MAN_POSES.悬着 },
    { t: 44.5, p: MAN_POSES.悬着 },
  ] as MoveKey[],
  { look: lookOf(MAN), base: { wind: 0.5 }, idle: true, seed: 31, springs: LIMP, follow: 0 },
);
/** 他在最高那栋楼左边的巷子里往上飘（她那扇窗在巷子右边的墙上） */
const MAN_X = -3880;
/** 「困」那一刻他的胯在哪、往上飘得多快（越靠近白越快：每秒 650 → 1010） */
const Y_TOP = -8760;
const V_YANK = 1010;
const ACC = 180;
/** 他的胯（世界坐标）：「困」之前一路往上；那一下停住、被拽得往下一沉再弹两下 */
/** ② 天亮时他也被收回家里的窗（比别人早一点） */
const MAN_REEL = DAWN_T.reel0 + 0.25;
function manHip(t: number): V2 {
  const x = MAN_X + 18 * Math.sin(t * 1.3);
  const tau = NET_T.yank - t;
  if (tau > 0) return [x, Y_TOP + V_YANK * tau - 0.5 * ACC * tau * tau];
  const d = -tau;
  const y = Y_TOP + 115 * Math.exp(-d / 0.16) * Math.sin(d * 17) + 24 * (1 - Math.exp(-d / 0.3));
  const u = E.io(ph(t, MAN_REEL, MAN_REEL + 0.7));
  const back: V2 = [MAN_ANCHOR[0], MAN_ANCHOR[1] - 330];
  return [x + (back[0] - x) * u, y + (back[1] - y) * u];
}
/** 他还看得见多少（收进窗里以后淡掉） */
const manA = (t: number) => 1 - ph(E.io(ph(t, MAN_REEL, MAN_REEL + 0.7)), 0.75, 1);
/** 他这一刻：姿势、根、胯、近处那只脚踝（红绳拴在这里） */
export function manAt(t: number) {
  const pose = { ...manMove(t).pose };
  const j = castJoints(MAN, pose);
  const hip = manHip(t);
  const root: V2 = [hip[0] - j.hip[0], hip[1] - j.hip[1]];
  return { pose, root, hip, ankle: [root[0] + j.ankleL[0], root[1] + j.ankleL[1]] as V2, chest: [root[0] + (j.shoulderL[0] + j.shoulderR[0]) / 2, root[1] + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 40] as V2 };
}

// ——— 楼上的窗（和 lib/world.ts 的 geomOf 同一套算法）：红绳拴在窗外防飘栏底下的托板上 ———
/** 第 f 层（0 是最上面一层）第 i 扇窗的托板中点（世界 / 层坐标） */
function sillOf(b: Block, f: number, i: number): V2 {
  const u = b.fh / 128;
  const w = b.w / u;
  const top = -b.floors * 128 - 60;
  const units = Math.max(2, Math.round(w / 150));
  const uw = (w - 40) / units;
  const wx = 20 + uw * Math.min(units - 1, Math.max(0, i)) + uw * 0.18;
  const ww = uw * 0.64;
  const y = top + 70 + f * 128;
  return [b.x + (wx + ww / 2) * u, (y + 74 + 16) * u];
}
const colsOf = (b: Block) => Math.max(2, Math.round(b.w / (b.fh / 128) / 150));
/** 楼顶的女儿墙上（拴不到窗的矮楼） */
const roofOf = (b: Block, k: number): V2 => [b.x + b.w * k, -b.floors * b.fh - 40];

/** 他家的窗：最高那栋楼最左边那一列，她家往下第六层 */
const MAN_ANCHOR = sillOf(TOWER, 6, 0);
/** 红绳多长：「困」那一刻正好绷直 */
let manRopeLen = 0;
const manRope = () => (manRopeLen ||= Math.hypot(manAt(NET_T.yank).ankle[0] - MAN_ANCHOR[0], manAt(NET_T.yank).ankle[1] - MAN_ANCHOR[1]));

// ——— 网：天上被拴住的人（按镜头落在整座城上那一刻的取景排，远的层被透视压向画面中间，按画面位置排才铺得满） ———
/** 最后落在整座城上的取景：白在画面上面约 1/6，最高那栋楼在中间，城在下面 */
export const WIDE = aim(-3210, 0, 540, 1955, 0.185);
const atWide = (sx: number, sy: number, D: number): V2 => [WIDE.x + ((sx - W / 2) * D) / WIDE.z, WIDE.y + ((sy - H / 2) * D) / WIDE.z];

interface Hanger {
  D: number;
  /** 胯（层坐标）、身高、红绳那头拴在哪 */
  x: number;
  y: number;
  h: number;
  anchor: V2;
  ph: number;
  /** ② 天亮时被家里人收回窗里：从这一刻起收 */
  reel: number;
  /** 离镜头近的画成真人（姿势算一次存着），远的画成剪影 */
  spec: CastSpec | null;
  pose: PoseIn | null;
}

/** 远处的人：张着手往上够（剪影），近一点的两种：两只手都举着往上够、一只手举着低着头 */
const HANG_A: Angles = pose(0, { face: 0.85, ground: false, float: 0, rot: 6, ...legL(-6, -30, -40), ...legR(8, -18, -36), neck: 18, expression: "难过", sad: 0.7, blink: 0.5, wind: 0.4 }, (l) => ({
  ...armL(150, 20, 0, "open", l),
  ...armR(166, 14, 0, "open", l),
}));
const HANG_B: Angles = pose(4, { face: -0.85, ground: false, float: 0, rot: -4, ...legL(-2, -12, -44), ...legR(10, -26, -40), neck: -22, expression: "难过", sad: 0.9, lookY: 0.9, wind: 0.4 }, (l) => ({
  ...armL(16, 26, 0, "relax", l),
  ...armR(152, 20, 0, "open", l),
}));

function buildNet(): Hanger[] {
  const out: Hanger[] = [];
  // 人这一层：几个离他近的（镜头往后退时一个个出现），拴在千斤家那栋楼、最高那栋楼、左边矮楼的窗上
  const near: [number, number, Block, number, number, Angles, number][] = [
    // 胯 x、胯 y、拴在哪栋楼、第几层、第几扇、姿势、第几个路人
    [-4560, -8640, QJ_HOME, 13, 0, HANG_B, 12],
    [-2480, -8840, TOWER, 9, 2, HANG_A, 22],
    [-5380, -8930, STREET[5], 1, 1, HANG_A, 3],
    [-1660, -8580, TOWER, 16, 2, HANG_B, 17],
    [-6150, -8760, STREET[6], 0, 0, HANG_B, 27],
    [-2680, -9010, TOWER, 4, 2, HANG_A, 8],
  ];
  near.forEach(([x, y, b, f, i, p, n], k) => {
    const spec = passerby(n);
    out.push({ D: 1, x, y, h: 590 * spec.scale, anchor: f < 0 ? roofOf(b, 0.5) : sillOf(b, f, i), ph: k * 1.7, reel: 0, spec, pose: figurePose({ ...p }, 40 + k * 0.37, lookOf(spec)) });
  });
  // 远处三层：在最后那个取景里铺满白下面那一片天，越靠近白越密；红绳拴到那一层的楼上（往左或往右斜，彼此交叉成网）
  const r = seeded(84);
  const layers: [number, number, number][] = [
    // D、人数、身高（相对）
    [4, 52, 0.95],
    [2.2, 36, 0.95],
    [1.5, 18, 0.95],
  ];
  for (const [D, n, hk] of layers) {
    const L = LAYERS.find((l) => l.D === D)!;
    for (let k = 0; k < n; k++) {
      const sx = -70 + ((k + 0.15 + 0.7 * r()) / n) * 1220;
      // 越靠近白越密，往下也有（绳子长短不一），网才铺得满整片天
      const sy = 270 + 700 * Math.pow(r(), 1.25);
      const [x, y] = atWide(sx, sy, D);
      // 红绳往哪边斜：在画面上左右各偏 120–380，拴在那里的楼上，比人至少低 220（画面上）
      const tx = sx + (r() < 0.5 ? -1 : 1) * (180 + 380 * r());
      const lx = atWide(tx, 0, D)[0];
      const minY = atWide(0, sy + 260, D)[1];
      let best: Block | null = null;
      let bd = 1e9;
      for (const b of L.blocks) {
        const d = lx < b.x ? b.x - lx : lx > b.x + b.w ? lx - b.x - b.w : 0;
        if (d < bd) {
          bd = d;
          best = b;
        }
      }
      let anchor: V2 = [lx, 0];
      if (best) {
        const b = best;
        const cols = colsOf(b);
        const col = Math.min(cols - 1, Math.max(0, Math.floor(((lx - b.x) / b.w) * cols)));
        // 层：在比人低 220 以下的那些层里挑（偏上面几层）；楼太矮就拴在楼顶
        const fMin = Math.max(0, Math.ceil((minY + b.floors * b.fh) / b.fh - 1));
        if (fMin < b.floors - 1) {
          const f = Math.min(b.floors - 2, fMin + Math.floor(Math.pow(r(), 1.6) * (b.floors - 1 - fMin)));
          anchor = sillOf(b, f, col);
        } else anchor = roofOf(b, (col + 0.5) / cols);
        if (anchor[1] < minY) anchor = [anchor[0], minY + 40];
      }
      out.push({ D, x, y, h: 590 * hk * (0.85 + 0.3 * r()), anchor, ph: r() * 6.28, reel: 0, spec: D <= 1.5 ? passerby(Math.floor(r() * 40)) : null, pose: null });
    }
  }
  for (const p of out) if (p.spec && !p.pose) p.pose = figurePose({ ...(p.ph > 3.1 ? HANG_A : HANG_B), face: p.ph > 4.7 || p.ph < 1.5 ? 0.85 : -0.85 }, 40 + p.ph, lookOf(p.spec));
  // 天亮时一个个被收回窗里（随机先后，和满城的窗一组组灭一样）
  const rr = seeded(441);
  for (const p of out) p.reel = DAWN_T.reel0 + (DAWN_T.reel1 - DAWN_T.reel0) * rr();
  return out;
}
export const NET = buildNet();

/** 收回窗里要多久（越收越快、到窗口收住） */
const REEL = 0.6;
/**
 * 一个被拴住的人这一刻：被白往上扯、一下一下慢慢晃；天亮时顺着红绳被收回窗里（快到窗口时淡掉：进了窗）。a：还看得见多少。
 * reel false：不收（四「赤脚」又一个天快亮，网还挂着）
 */
function hangerAt(p: Hanger, t: number, reel = true) {
  const bob = 10 * Math.sin(t * 1.1 + p.ph) + 5 * Math.sin(t * 2.3 + p.ph * 2);
  const sway = 0.05 * Math.sin(t * 0.8 + p.ph);
  const x = p.x + 8 * Math.sin(t * 0.7 + p.ph);
  const y = p.y + bob;
  const u = reel ? E.io(ph(t, p.reel, p.reel + REEL)) : 0;
  const back: V2 = [p.anchor[0], p.anchor[1] - p.h * 0.3];
  return { x: x + (back[0] - x) * u, y: y + (back[1] - y) * u, rot: sway * (1 - u), a: 1 - ph(u, 0.72, 1) };
}

/** 画一根红绳（层坐标；px 是画面上的粗细，近了按世界里的粗细）：外面一圈很淡的红光，深色描边，红芯 */
export function rope(g: CanvasRenderingContext2D, pts: V2[], scale: number, px: number, ink: boolean, glow = 1) {
  const path = new Path2D();
  path.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 2) path.lineTo(pts[1][0], pts[1][1]);
  else {
    for (let i = 1; i < pts.length - 1; i++) path.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    path.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  }
  const w = Math.max(3.6, px / scale);
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  if (glow > 0) {
    g.globalCompositeOperation = "lighter";
    g.strokeStyle = `rgba(255,70,60,${0.1 * glow})`;
    g.lineWidth = w * 3.2;
    g.stroke(path);
    g.globalCompositeOperation = "source-over";
  }
  if (ink) {
    g.strokeStyle = INK;
    g.lineWidth = w + Math.max(2.9, 1.7 / scale);
    g.stroke(path);
  }
  g.strokeStyle = "#e0443a";
  g.lineWidth = w;
  g.stroke(path);
  g.restore();
}

/** 剪影的脚（红绳拴在这里）：和 drawSilhouette 画的腿对上 */
function silhouetteFoot(x: number, y: number, h: number, rot: number): V2 {
  const s = h / 140;
  const fx = -9 * s;
  const fy = 86 * s;
  return [x + fx * Math.cos(rot) - fy * Math.sin(rot), y + fx * Math.sin(rot) + fy * Math.cos(rot)];
}

/** 两段直线的交点（在两段上才算） */
export function cross(a: V2, b: V2, c: V2, d: V2): V2 | null {
  const r: V2 = [b[0] - a[0], b[1] - a[1]];
  const q: V2 = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * q[1] - r[1] * q[0];
  if (Math.abs(den) < 1e-9) return null;
  const u = ((c[0] - a[0]) * q[1] - (c[1] - a[1]) * q[0]) / den;
  const v = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  return u > 0.02 && u < 0.98 && v > 0.02 && v < 0.98 ? [a[0] + r[0] * u, a[1] + r[1] * u] : null;
}
/** 绳结：两根红绳缠在一起的地方一个小疙瘩（网就是这些结连起来的） */
export function knot(g: CanvasRenderingContext2D, p: V2, s: number, D: number) {
  const r = Math.max(4, (D > 3 ? 2 : D > 2 ? 2.5 : 3) / s);
  g.beginPath();
  g.ellipse(p[0], p[1], r * 1.25, r, 0.6, 0, Math.PI * 2);
  g.fillStyle = "#b8302a";
  g.fill();
  if (D <= 1.5) {
    g.strokeStyle = INK;
    g.lineWidth = Math.max(2, 1.1 / s);
    g.stroke();
  }
}

/**
 * 画网里 D 那一层的人和红绳（当前变换已经是那一层的镜头）。z：镜头倍数。人这一层（D = 1）的他另外画（drawMan），
 * extra：同一层里还要一起算绳结的红绳（他的）。近的两层画成真人（一层蒙一次夜色），远的画成剪影。reel false：网不收
 */
export function drawNetLayer(g: CanvasRenderingContext2D, t: number, D: number, z: number, extra: [V2, V2][] = [], reel = true) {
  const s = z / D;
  // 远处几层只在镜头退开以后才看得见（近景里它们会被透视推到白里面去）
  const fade = D > 1 ? Math.min(1, Math.max(0, (0.62 - z) / 0.25)) : 1;
  if (fade <= 0.003) return;
  const ga = g.globalAlpha;
  g.globalAlpha = ga * fade;
  const real = D <= 1.5;
  const items = NET.filter((p) => p.D === D && hangerAt(p, t, reel).a > 0.002).map((p) => {
    const q = hangerAt(p, t, reel);
    let foot: V2;
    let j: ReturnType<typeof castJoints> | null = null;
    let k = 1;
    if (real && p.spec && p.pose) {
      // 按胯放：胯在 (q.x, q.y)，整个人绕胯转 q.rot
      j = castJoints(p.spec, p.pose);
      k = p.h / (590 * p.spec.scale);
      const dx = (j.ankleL[0] - j.hip[0]) * k;
      const dy = (j.ankleL[1] - j.hip[1]) * k;
      foot = [q.x + dx * Math.cos(q.rot) - dy * Math.sin(q.rot), q.y + dx * Math.sin(q.rot) + dy * Math.cos(q.rot)];
    } else foot = silhouetteFoot(q.x, q.y, p.h, 0.12 * Math.sin(t * 0.8 + p.ph));
    return { p, q, foot, j, k };
  });
  const px = D > 3 ? 1.2 : D > 2 ? 1.5 : D > 1.2 ? 2 : 2.4;
  const ga1 = g.globalAlpha;
  for (const it of items) {
    g.globalAlpha = ga1 * it.q.a;
    rope(g, [it.foot, it.p.anchor], s, px, D <= 1.5 && s > 0.3, D > 3 ? 0.6 : 1);
  }
  g.globalAlpha = ga1;
  // 绳结：同一层里两根红绳交叉的地方
  const segs: [V2, V2][] = [...items.map((it) => [it.foot, it.p.anchor] as [V2, V2]), ...extra];
  for (let a = 0; a < segs.length; a++)
    for (let b = a + 1; b < segs.length; b++) {
      const c = cross(segs[a][0], segs[a][1], segs[b][0], segs[b][1]);
      if (c) knot(g, c, s, D);
    }
  const nightK = nightGlow(t);
  for (const it of items) drawGlow(g, it.q.x, it.q.y - it.p.h * 0.25, it.p.h * 0.95 + 18 / s, 0.5 * nightK * it.q.a);
  if (real) {
    const reals = items.filter((it) => it.j);
    if (reals.length) {
      let box: [number, number, number, number] = [1e9, 1e9, -1e9, -1e9];
      for (const it of reals) {
        const h = it.p.h;
        box = [Math.min(box[0], it.q.x - h * 0.7), Math.min(box[1], it.q.y - h * 0.85), Math.max(box[2], it.q.x + h * 0.7), Math.max(box[3], it.q.y + h * 0.7)];
      }
      drawTinted(g, box, (gg) => {
        for (const it of reals) {
          gg.save();
          gg.globalAlpha = it.q.a;
          gg.translate(it.q.x, it.q.y);
          gg.rotate(it.q.rot);
          gg.scale(it.k, it.k);
          drawPerson(gg, it.p.spec!, it.p.pose!, -it.j!.hip[0], -it.j!.hip[1], s * it.k);
          gg.restore();
        }
      }, 0.85);
    }
  } else for (const it of items) drawSilhouette(g, it.q.x, it.q.y, it.p.h, t, it.p.ph, 0.9 * it.q.a, "92,62,86");
  g.globalAlpha = ga;
}

/** 他的红绳：「困」之前松着（在风里一弯一弯地拖在他脚下），那一下绷直、弹两下 */
function manRopePts(t: number, ankle: V2): V2[] {
  const B = MAN_ANCHOR;
  const d = Math.hypot(ankle[0] - B[0], ankle[1] - B[1]);
  // 拽住以后绳子一直绷着（天亮时家里人往回收，也是绷着的）
  const slack = t > NET_T.yank ? 0 : Math.max(0, manRope() - d);
  const n: V2 = [-(B[1] - ankle[1]) / d, (B[0] - ankle[0]) / d];
  const dy = t - NET_T.yank;
  const amp = 0.55 * Math.sqrt(slack * 60) + (dy > 0 ? 40 * Math.exp(-dy / 0.12) * Math.sin(dy * 2 * Math.PI * 7) : 0);
  const pts: V2[] = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    const wv = amp * Math.sin(Math.PI * u) * Math.sin(u * 7 + t * 5.2) * (dy > 0 ? 1 : 1 - 0.6 * u);
    pts.push([ankle[0] + (B[0] - ankle[0]) * u + n[0] * wv, ankle[1] + (B[1] - ankle[1]) * u + n[1] * wv]);
  }
  return pts;
}

/** 他的红绳拉直以后（「困」以后）的那一段：和人这一层别人的红绳一起算绳结 */
export function manRopeSeg(t: number): [V2, V2][] {
  return t > NET_T.yank + 0.15 && manA(t) > 0.5 ? [[manAt(t).ankle, MAN_ANCHOR]] : [];
}

/** 画他（人这一层，世界坐标）：红绳、胸口那团光（「心」「脏」各跳一下，拽住以后暗下去）、人 */
export function drawMan(g: CanvasRenderingContext2D, t: number, z: number) {
  if (t < NET_T.start || manA(t) <= 0.002) return;
  const ga = g.globalAlpha;
  g.globalAlpha = ga * manA(t);
  const m = manAt(t);
  rope(g, manRopePts(t, m.ankle), z, 2.4, true);
  const beat = Math.exp(-Math.max(0, t - NET_T.heart) / 0.18) * (t > NET_T.heart ? 1 : 0) + Math.exp(-Math.max(0, t - NET_T.heart2) / 0.18) * (t > NET_T.heart2 ? 1 : 0);
  const near = Math.min(1, Math.max(0, (m.hip[1] + 7400) / -1360));
  const glow = (0.45 + 0.35 * near + 0.35 * beat) * (t > NET_T.yank ? 0.7 + 0.3 * Math.exp(-(t - NET_T.yank) / 0.4) : 1);
  drawGlow(g, m.chest[0], m.chest[1], 200 + 120 * near + 60 * beat + 20 / z, glow * nightGlow(t));
  drawTinted(g, [m.root[0] - 420, m.root[1] - 700, m.root[0] + 420, m.root[1] + 120], (gg) => drawPerson(gg, MAN, m.pose, m.root[0], m.root[1], z), 0.85);
  g.globalAlpha = ga;
}

// ——— 镜头 ———
/** 退出窗外以后：她那扇窗在画面右下（640, 1100），左边是他飘上来的巷子，上面是楼顶和白 */
const OUT = (() => {
  const w = homeWindow();
  return aim(w.x + w.w / 2, w.y + w.h / 2, 640, 1100, 0.85);
})();

/**
 * 这一镜的镜头：从她的屋子（⑫最后一帧）退出窗外（E.io，0.7 秒退 13 倍，副歌鼓进来时停稳）；停着几乎不动，他从画面下面升上来、
 * 从她窗外过去；他升到画面中间以后镜头跟着他往上抬（往左挪一点，他在画面 400、1000）；「困」他一下停住，镜头冲过去一点再一顿；
 * 然后柔和起步、一路减速地往后退到整座城（E.settle，1.6 秒），最后极慢地漂一点
 */
export function netCam(t: number): Cam {
  const T = NET_T;
  let c = camLerp(twelveCam(T.start), OUT, E.io(ph(t, T.start, T.out)));
  // 停着时也极慢地往上漂一点（不死）
  c = { ...c, y: c.y - 40 * E.io(ph(t, T.out, T.follow1)) };
  // 跟着他往上：他在画面 (400, 1000)
  const w = E.io(ph(t, T.follow0, T.follow1));
  if (w > 0) {
    const h = manHip(Math.min(t, T.yank));
    c = camLerp(c, aim(h[0], h[1] - 60, 400, 1000, 0.85), w);
  }
  // 「困」：他一下停住，镜头冲过去一点再回来，往里一顿
  const dy = t - T.yank;
  if (dy > 0) c = { ...c, y: c.y - 70 * Math.exp(-dy / 0.1) * Math.sin(Math.min(Math.PI, dy * 22)), z: c.z * (1 + 0.05 * kick(t, T.yank, 0.1)) };
  // 退到整座城上，再极慢地漂
  const back = E.settle(ph(t, T.pull0, T.wide));
  if (back > 0) c = camLerp(c, WIDE, back);
  const drift = ph(t, T.wide, T.end + 0.5);
  return drift > 0 ? { ...c, z: c.z * (1 - 0.02 * E.io(drift)) } : c;
}
/** 「困」那一下画面一震 */
export const netShake = (t: number) => 22 * kick(t, NET_T.yank, 0.08);
/** 退到整座城上时，远处那几栋高楼从雾里浮出来（和第一幕全城那个镜头一样） */
export const netWide = (c: Cam) => Math.min(1, Math.max(0, (0.62 - c.z) / 0.3));
