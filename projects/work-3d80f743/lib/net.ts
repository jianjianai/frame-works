// 副歌一①「只因为 / 你那渴望自由的心脏 / 困在一张没空隙的网」（39.39–43.92）。字（酷狗逐字）：只 39.39 因 39.72 为 39.84（拖到 40.7），
// 40.016 副歌鼓进来；你 40.74 那 40.80 渴 40.86 望 40.92 自 40.98 由 41.04 的 41.10 心 41.37 脏 41.70；困 41.94 在 42.09 一 42.15 张 42.21
// 没 42.27 空 42.33 隙 42.39 的 42.45 网 42.51（拖到 43.9）。
// 2026-10-21 用户重做（「之前做的不太行，这次换个地图的地方」）：
// 一个镜头：⑫ 最后画面倒着、还在顺时针转——转场一甩切过来，接着同一个方向转、越转越慢，副歌鼓进来（40.016）时正好转正。
// 最高那栋楼右边（楼面一排排窗在画面左边往下刷过去，下面是老钟家左边那栋五层楼），一个人张着手、仰着脸笑着往上飞，越飞越快——
// 渴望自由；「心」「脏」胸口那团光跳两下；快到白的时候，「困」拴在他脚踝上的红绳一下绷直，把他拽住（另一头拴在他家的窗上）。
// 他刚被拽住，一个没被拴住的人从他身边冲上去，「网」碰到白，散成光点和灰——他抬头看着。
// 镜头一下往后撤，越撤越慢，落在整座城上：天上到处是和他一样被红绳拴住的人，一根根红绳从城里的窗、楼顶拉上来，交错成一张盖住整座城的网；
// 网上面没被拴住的人一拍一个（三拍里 1、2、3 个）冲进白里，炸开彩色的光环、化成灰落下来（和序章一样）。
// 她拴着自己（脚绳是她自己拴在椅子上的），他们是被家里人拴住的。

import { type CastSpec, castJoints, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import { type Angles, type MoveKey, type PoseIn, figurePose } from "@materials/剪纸角色/code/chengtuo";
import { seeded } from "@frame/engine/math";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, H, W, aim, camLerp, kick, ph } from "./cam";
import { type Block, INK, LAYERS, QJ_HOME, STREET, TOWER, Y_WHITE, drawAshFall, drawBurst, drawGlow, drawSilhouette, drawTinted, whiteEdge } from "./world";
import { LIMP, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";
import { DAWN_T, nightGlow } from "./dawn";
import { NET_SPIN0 } from "./write";

type V2 = [number, number];

export const NET_T = {
  start: 39.39,
  /** 转场接过来还在转，越转越慢，副歌鼓进来时转正 */
  upright: 39.99,
  /** 「心」「脏」：他胸口那团光跳一下 */
  heart: 41.37,
  heart2: 41.7,
  /** 「困」：红绳绷直（小节线） */
  yank: beatAt(84),
  /** 往后暴退拉远（只下移到半空楼腰，不到地面） */
  pull0: 42.08,
  wide: 43.35,
  end: 43.92,
};
/** 没被拴住、冲进白里化成灰的人碰到白的那几拍：「网」一个，之后一拍两个、一拍三个 */
export const ASH_BEATS = [beatAt(85), beatAt(86), beatAt(87)];

function pose(lean: number, rest: Omit<Angles, "lean">, arms: (lean: number) => Angles): Angles {
  return { lean, ...rest, ...arms(lean) };
}

// ——— 往上飘的那个人（路人，短发：失重只给一点，|face| 别停在 0.2–0.45，头发会画成尖） ———
const MAN: CastSpec = passerby(5);
const MAN_POSES = {
  /** 往上飞：两只手张开、胸口挺着，腿拖在后面（风从头顶往下吹）。人一绝望才会飘起来：仰着脸、眼睛半睁着望向白、含着泪，嘴角一点苦笑（终于能逃开了的解脱） */
  飞: pose(-10, { face: -0.85, ground: false, float: 0.12, rot: -2, ...legL(-10, -40, -50), ...legR(14, -30, -46), neck: 26, expression: "含泪", sad: 0.75, blink: 0.45, smile: 0.25, open: 0.08, tears: 0.85, blush: 0.4, lookX: -0.2, lookY: -1 }, (l) => ({
    ...armL(-62, 18, -10, "open", l),
    ...armR(120, 16, 8, "open", l),
  })),
  /** 往上飘：远处的手伸向白、近处的手往后，腿拖在后面，仰着头、泪流着盯着白、嘴微微张开（伸手去够那道光：想挣脱一切的渴望，也是绝望） */
  升: pose(-6, { face: -0.85, ground: false, float: 0.12, rot: -4, ...legL(-8, -44, -50), ...legR(12, -24, -46), neck: 22, expression: "含泪", sad: 0.9, wide: 0.2, blink: 0.15, smile: 0.1, open: 0.18, tears: 1, blush: 0.45, lookX: -0.2, lookY: -1 }, (l) => ({
    ...armL(-30, 24, -10, "open", l),
    ...armR(165, 12, 8, "open", l),
  })),
  /** 被拽住：腿一下被扯直，两只手甩到头顶，睁大眼 */
  拽住: pose(4, { face: -0.85, ground: false, float: 0, rot: 4, ...legL(-2, -2, -40), ...legR(34, -56, -30), neck: -14, expression: "吓一跳", lookY: 0.4 }, (l) => ({
    ...armL(150, 30, 0, "open", l),
    ...armR(172, 20, 0, "open", l),
  })),
  /** 抬头看：旁边那个人冲进白里散成灰，他仰着脸看着，嘴微张 */
  抬头看: pose(0, { face: -0.85, ground: false, float: 0, rot: 2, ...legL(0, -4, -44), ...legR(20, -40, -36), neck: 24, expression: "难过", sad: 0.9, lookX: 0.3, lookY: -0.7 }, (l) => ({
    ...armL(24, 30, 0, "relax", l),
    ...armR(120, 40, 0, "open", l),
  })),
  /** 悬着：远处的手还举着，近处的手垂下来，低头看着拴住他的那根绳子 */
  悬着: pose(0, { face: -0.85, ground: false, float: 0, rot: 2, ...legL(0, -4, -44), ...legR(20, -40, -36), neck: -18, expression: "难过", sad: 0.85, lookX: 0.1, lookY: 0.8 }, (l) => ({
    ...armL(20, 30, 0, "relax", l),
    ...armR(150, 24, 0, "open", l),
  })),
};
const manMove = live(
  [
    // 张开手往上飞；「渴望自由」两只手往白伸过去；「困」被拽住；旁边那个人散成灰时抬头看；之后低头看着拴住他的绳子
    { t: 39.3, x: 0, p: MAN_POSES.飞 },
    { t: 40.65, p: MAN_POSES.飞 },
    { t: 41.05, ease: "inOut", p: MAN_POSES.升 },
    { t: NET_T.yank - 0.01, p: MAN_POSES.升 },
    { t: NET_T.yank + 0.07, ease: "out", p: MAN_POSES.拽住 },
    { t: ASH_BEATS[0] - 0.12, ease: "inOut", p: MAN_POSES.抬头看 },
    { t: ASH_BEATS[0] + 0.5, p: MAN_POSES.抬头看 },
    { t: ASH_BEATS[0] + 0.95, ease: "inOut", p: MAN_POSES.悬着 },
    { t: 44.5, p: MAN_POSES.悬着 },
  ] as MoveKey[],
  { look: lookOf(MAN), base: { wind: 0.65 }, idle: true, seed: 31, springs: LIMP, follow: 0 },
);
/** 他在最高那栋楼右边往上飞（楼面在他左边；下面是老钟家左边那栋五层楼和②的那条街） */
const MAN_X = -2440;
/** 「困」那一刻他的胯在哪；从街边低处（五层楼一二层高）起飞，转正后猛烈加速冲向白光 */
const Y_TOP = -8760;
const Y_START = -450;
const FLY = NET_T.yank - NET_T.start;
/** 位移曲线：转场段在低处蓄势起飞（40.0 转正时在 -860，40.31 在 -1320 刚掠过五层楼顶），之后高次幂破空狂飙（末速度约 6900/秒） */
const flyFrac = (u: number) => 0.11 * u + 0.89 * Math.pow(u, 2.35);
const flyDeriv = (u: number) => 0.11 + 0.89 * 2.35 * Math.pow(u, 1.35);
/** 他的胯（世界坐标）：「困」之前一路往上；那一下停住、被拽得往下一沉再弹两下 */
/** ② 天亮时他也被收回家里的窗（比别人早一点） */
const MAN_REEL = DAWN_T.reel0 + 0.25;
function manHip(t: number): V2 {
  const x = MAN_X + 14 * Math.sin(t * 1.3);
  const u0 = ph(t, NET_T.start, NET_T.yank);
  if (t < NET_T.yank) return [x, Y_START + (Y_TOP - Y_START) * flyFrac(u0)];
  const d = t - NET_T.yank;
  const y = Y_TOP + 165 * Math.exp(-d / 0.16) * Math.sin(d * 17) + 32 * (1 - Math.exp(-d / 0.3));
  const u = E.io(ph(t, MAN_REEL, MAN_REEL + 0.7));
  const back: V2 = [MAN_ANCHOR[0], MAN_ANCHOR[1] - 330];
  return [x + (back[0] - x) * u, y + (back[1] - y) * u];
}
/** 他往上飞的速度（每秒，世界坐标）：镜头竖着拖影和气流线按它算 */
export const manSpeed = (t: number) => (t < NET_T.start || t >= NET_T.yank ? 0 : ((Y_START - Y_TOP) / FLY) * flyDeriv(ph(t, NET_T.start, NET_T.yank)));
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

/** 他家的窗：最高那栋楼最右边那一列，往下第二十八层（一楼高处，从低处起飞时红绳一直在他脚下） */
const MAN_ANCHOR = sillOf(TOWER, 27, colsOf(TOWER) - 1);
/** 红绳多长：「困」那一刻正好绷直 */
let manRopeLen = 0;
const manRope = () => (manRopeLen ||= Math.hypot(manAt(NET_T.yank).ankle[0] - MAN_ANCHOR[0], manAt(NET_T.yank).ankle[1] - MAN_ANCHOR[1]));

// ——— 网：天上被拴住的人（按镜头拉开后的半空取景排，远的层被透视压向画面中间，按画面位置排才铺得满） ———
/** 拉远后的半空大远景：只下移到塔楼半腰（画面底边在 y ≈ -2685，不到地面 y = 0），漫天红绳巨网与白光铺满画面 */
export const WIDE = aim(-3080, -7150, 540, 960, 0.215);
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
    [-5160, -8640, QJ_HOME, 13, 0, HANG_B, 12],
    [-1960, -8860, TOWER, 9, 2, HANG_A, 22],
    [-5980, -8930, STREET[5], 1, 1, HANG_A, 3],
    [-1420, -8600, TOWER, 16, 2, HANG_B, 17],
    [-6750, -8760, STREET[6], 0, 0, HANG_B, 27],
    [-2950, -9010, TOWER, 4, 2, HANG_A, 8],
    // 2026-10-21 加：他被拽住以后镜头往后撤，先看见身边一圈和他一样被拴着的人，往下到半空也铺满
    [-3420, -8700, QJ_HOME, 6, 1, HANG_B, 31],
    [-1000, -8930, STREET[0], 2, 0, HANG_A, 35],
    [-3950, -8980, TOWER, 14, 0, HANG_A, 14],
    [-700, -8560, STREET[0], 4, 1, HANG_B, 19],
    [-5600, -8820, QJ_HOME, 20, 0, HANG_A, 25],
    [-3260, -8760, TOWER, 24, 1, HANG_B, 6],
    [-2120, -7650, TOWER, 19, 2, HANG_B, 11],
    [-4880, -7420, QJ_HOME, 18, 1, HANG_A, 16],
    [-1560, -7180, STREET[0], 3, 0, HANG_A, 23],
    [-2860, -6850, TOWER, 22, 1, HANG_B, 29],
    [-5480, -6920, QJ_HOME, 22, 0, HANG_B, 34],
  ];
  near.forEach(([x, y, b, f, i, p, n], k) => {
    const spec = passerby(n);
    out.push({ D: 1, x, y, h: 590 * spec.scale, anchor: f < 0 ? roofOf(b, 0.5) : sillOf(b, f, i), ph: k * 1.7, reel: 0, spec, pose: figurePose({ ...p }, 40 + k * 0.37, lookOf(spec)) });
  });
  // 远处三层：在半空大远景里铺满白下面整片天，越靠近白越密；红绳拴到那一层的楼上（往左或往右斜，彼此交叉成网）
  const r = seeded(84);
  const layers: [number, number, number][] = [
    // D、人数、身高（相对）
    [4, 58, 0.95],
    [2.2, 42, 0.95],
    [1.5, 22, 0.95],
  ];
  for (const [D, n, hk] of layers) {
    const L = LAYERS.find((l) => l.D === D)!;
    for (let k = 0; k < n; k++) {
      const sx = -120 + ((k + 0.15 + 0.7 * r()) / n) * 1320;
      // 越靠近白越密，往下铺到半空（绳子长短不一），网才铺得满整片天
      const sy = 520 + 960 * Math.pow(r(), 1.2);
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
  const amp = Math.min(140, 0.55 * Math.sqrt(slack * 60)) + (dy > 0 ? 40 * Math.exp(-dy / 0.12) * Math.sin(dy * 2 * Math.PI * 7) : 0);
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

/** 破空飞升时的气流速度线（越飞越快越明显，「困」那一刻停住消失） */
const STREAKS: [number, number, number, number][] = [
  [-290, 0.0, 260, 2.2],
  [270, 0.18, 310, 2.4],
  [-420, 0.37, 220, 1.8],
  [390, 0.53, 280, 2.0],
  [-180, 0.68, 240, 1.9],
  [210, 0.83, 290, 2.1],
];

/** 画他（人这一层，世界坐标）：气流线、红绳、胸口那团光（「心」「脏」各跳一下，拽住以后暗下去）、人 */
export function drawMan(g: CanvasRenderingContext2D, t: number, z: number) {
  if (t < NET_T.start || manA(t) <= 0.002) return;
  const ga = g.globalAlpha;
  g.globalAlpha = ga * manA(t);
  const m = manAt(t);
  // 破空速度线：速度起来以后在身边掠过
  const spd = manSpeed(t);
  const sk = ph(spd, 1400, 5600);
  if (sk > 0.01) {
    g.save();
    g.strokeStyle = "rgba(235,240,255,0.42)";
    g.lineCap = "round";
    for (const [dx, phase, len, w] of STREAKS) {
      const cyc = ((t * 4.8 + phase) % 1);
      const a = Math.sin(Math.PI * cyc) * sk;
      if (a <= 0.02) continue;
      const sx = m.hip[0] + dx;
      const sy = m.hip[1] - 480 + cyc * 920;
      const l = len * (0.55 + 0.85 * sk);
      g.globalAlpha = ga * a * 0.48;
      g.lineWidth = w / z;
      g.beginPath();
      g.moveTo(sx, sy);
      g.lineTo(sx, sy + l);
      g.stroke();
    }
    g.restore();
  }
  rope(g, manRopePts(t, m.ankle), z, 2.4, true);
  const beat = Math.exp(-Math.max(0, t - NET_T.heart) / 0.18) * (t > NET_T.heart ? 1 : 0) + Math.exp(-Math.max(0, t - NET_T.heart2) / 0.18) * (t > NET_T.heart2 ? 1 : 0);
  const near = Math.min(1, Math.max(0, (m.hip[1] + 7400) / -1360));
  const glow = (0.45 + 0.35 * near + 0.42 * beat) * (t > NET_T.yank ? 0.7 + 0.3 * Math.exp(-(t - NET_T.yank) / 0.4) : 1);
  drawGlow(g, m.chest[0], m.chest[1], 200 + 120 * near + 75 * beat + 20 / z, glow * nightGlow(t));
  drawTinted(g, [m.root[0] - 420, m.root[1] - 700, m.root[0] + 420, m.root[1] + 120], (gg) => drawPerson(gg, MAN, m.pose, m.root[0], m.root[1], z), 0.85);
  g.globalAlpha = ga;
}

// ——— 没被拴住的人：从城里冲上来、碰到白散成灰（一拍一下，和序章一样） ———
interface Free {
  /** 胯 x、碰到白那一刻、往上冲多快（每秒）、碰到白以前多久出现、多大、彩色光环多大 */
  x: number;
  tb: number;
  speed: number;
  span: number;
  k: number;
  burst: number;
  spec: CastSpec;
  pose: PoseIn;
}
/** 冲向白：两只手举过头顶、仰着脸闭着眼笑 */
const FREE_POSE: Angles = pose(-6, { face: 0.85, ground: false, float: 0.15, rot: 3, ...legL(-8, -40, -50), ...legR(10, -26, -46), neck: 24, expression: "释然", blink: 1, smile: 0.5 }, (l) => ({
  ...armL(160, 14, 0, "open", l),
  ...armR(172, 10, 0, "open", l),
}));
const FREE: Free[] = (() => {
  const list: [number, number, number, number, number, number, number][] = [
    // 胯 x、第几拍、每秒冲多快、提前多久出现、大小、光环、第几个路人
    // 「网」：他刚被拽住，一个人从他身后下面冲上来、从他右边擦过去，就在他眼前散掉（镜头刚开始往后撤）
    [MAN_X + 330, 0, 3800, 0.75, 1, 1.05, 33],
    // 之后一拍两个、一拍三个，在网上面那一片天里（半空大远景里）
    [-4600, 1, 2500, 1.3, 0.95, 0.58, 9],
    [-1500, 1, 2500, 1.3, 0.95, 0.58, 21],
    [-5500, 2, 2600, 1.5, 1, 0.68, 4],
    [-3200, 2, 2600, 1.5, 1, 0.88, 15],
    [-950, 2, 2600, 1.5, 1, 0.68, 28],
  ];
  return list.map(([x, b, speed, span, k, burst, n]) => {
    const spec = passerby(n);
    return { x, tb: ASH_BEATS[b], speed, span, k, burst, spec, pose: figurePose({ ...FREE_POSE, face: n % 2 ? 0.85 : -0.85 }, 50 + n, lookOf(spec)) };
  });
})();
/** 一个没被拴住的人的胯（碰到白以前）：从下面冲上来、越冲越快（之前不画：在画面外的城里） */
function freeHip(p: Free, t: number): V2 | null {
  const d = p.tb - t;
  if (t >= p.tb + 0.28 || d > p.span) return null;
  const top = whiteEdge(p.x, p.tb) + 330 * p.k;
  const dd = Math.max(0, d);
  return [p.x + 10 * Math.sin(t * 1.7 + p.x), top + p.speed * dd * (1 + 0.35 * dd)];
}
/**
 * 画没被拴住的人（人这一层，世界坐标）：身上一团暖光，越靠近白越亮；碰到白以后 0.28 秒里从头顶往下一截截没了
 * （光环、灰在 drawFreeBursts 里，画在最上面）
 */
export function drawFree(g: CanvasRenderingContext2D, t: number, z: number) {
  for (const p of FREE) {
    const h = freeHip(p, t);
    if (!h) continue;
    const j = castJoints(p.spec, p.pose);
    const near = Math.min(1, Math.max(0, 1 - (h[1] - Y_WHITE) / 1400));
    drawGlow(g, h[0], h[1] - 200 * p.k, 300 * p.k * (1 + 0.5 * near) + 24 / z, (0.45 + 0.5 * near) * nightGlow(t));
    g.save();
    if (t > p.tb) {
      // 从头顶往下一截截散掉
      const top = h[1] - 520 * p.k + 760 * p.k * E.in2(ph(t, p.tb, p.tb + 0.28));
      g.beginPath();
      g.rect(h[0] - 800, top, 1600, 2000);
      g.clip();
    }
    const hpx = 590 * p.k * z;
    if (hpx < 70) drawSilhouette(g, h[0], h[1], 590 * p.k * p.spec.scale, t, p.x, 0.9, "92,62,86");
    else
      drawTinted(g, [h[0] - 420 * p.k, h[1] - 640 * p.k, h[0] + 420 * p.k, h[1] + 420 * p.k], (gg) => {
        gg.translate(h[0], h[1]);
        gg.scale(p.k, p.k);
        drawPerson(gg, p.spec, p.pose, -j.hip[0], -j.hip[1], z * p.k);
      }, 0.8);
    g.restore();
  }
}
/** 碰到白的那一下：彩色光环、散开的灰（画在最上面，画面坐标） */
export function drawFreeBursts(g: CanvasRenderingContext2D, base: DOMMatrix, cam: Cam, t: number) {
  for (const p of FREE) {
    if (t < p.tb) continue;
    const y = whiteEdge(p.x, p.tb);
    drawBurst(g, base, cam, p.x, y, t - p.tb, p.burst);
    drawAshFall(g, base, cam, p.x, y + 180 * p.k, t - p.tb, 0.95 * p.burst);
    drawAshFall(g, base, cam, p.x + 40, y + 420 * p.k, t - p.tb - 0.08, 0.8 * p.burst);
  }
}
/** 碰到白时画面一亮（第三拍最亮） */
export const netFlash = (t: number) => 0.18 * kick(t, ASH_BEATS[0], 0.14) + 0.16 * kick(t, ASH_BEATS[1], 0.14) + 0.38 * kick(t, ASH_BEATS[2], 0.16);

// ——— 镜头 ———
/** 他身子的中间（画面绕着这一点转） */
function manMid(t: number): V2 {
  const m = manAt(t);
  return [m.hip[0], m.hip[1] - 120];
}
/**
 * 这一镜的镜头（情绪运镜：破空起飞 → 渴望自由越推越急 → 被拽住猛停 → 暴退半空大网 + 倾斜震撼）：
 * 1. 转场落定（39.39–39.99「只因为」）：接着上一镜顺时针旋转，(1 − u)² 越转越慢，40.016 副歌鼓进来时转正并带一下鼓点落定冲击（+3.5%）；
 *    落定在低处中景（1.08 倍），他在画面偏下（555, 1090），身后五层楼、树冠与高塔同框，看清从低处起飞。
 * 2. 破空疾冲 + 渴望自由（40.00–42.017「你那渴望自由的心脏」）：他猛烈加速往上飙，镜头追赶不及，他在画面上从下半截（1090）一路往上冲到
 *    上半截（760，单调向上不回落）；同时按「期待/渴望」情绪曲线（pow 2.15）越推越快逼近他仰望白光的脸和伸出的手（1.08 → 1.54 倍），
 *    画面随冲势带一点仰望倾斜（-0.035）；「心」「脏」两拍随胸口光芒连续递进急顶（+4%、+6%）。
 * 3. 「困」（42.017）：红绳瞬间绷直，他急停下坠，镜头因惯性往上猛冲过头 115px 再拽回、画面回正、猛震一顿（+6.5%）。
 * 4. 震撼（42.08–43.92「在一张没空隙的网」）：从 1.54 倍近景一口气暴退拉远到 0.215 倍半空大远景（E.out 先快后慢），只往下移到塔楼半腰
 *    （c.y = -7150，不到地面），漫天被拴住的人和交错的红绳巨网铺满视野；拉开时镜头逆时针旋转（和暴退一起甩起来，到切走一共约 13.7°），转着拉开有广角的张力，配合三拍
 *    冲进白光化灰的连续爆闪、光环与震动，营造强烈的压迫与震撼。
 */
export function netCam(t: number): Cam {
  const T = NET_T;
  const p = manMid(Math.min(t, T.yank));
  // 转场中从正中 (540, 980) 落到起飞位 (555, 1090)（在 39.82 转正前完成）；之后全程单调往上冲到 (588, 760)
  const spinPlace = E.io(ph(t, T.start, 39.82));
  const rushUp = Math.pow(ph(t, 39.85, T.yank), 1.55);
  const sx = 540 + 15 * spinPlace + 33 * rushUp;
  const sy = 980 + 110 * spinPlace - 330 * rushUp;
  // 渴望自由：越推越快逼近（pow 2.15，1.08 → 1.54 倍，单向推进不来回）
  const yearn = Math.pow(ph(t, T.upright, T.yank), 2.15);
  const z = 1.08 * Math.pow(1.54 / 1.08, yearn);
  const u = ph(t, T.start, T.upright);
  // 飞升时带一点仰望微倾，「困」拽住瞬间回正
  const tilt = -0.035 * Math.sin(Math.PI * ph(t, T.upright, T.yank));
  let c = aim(p[0], p[1], sx, sy, z, NET_SPIN0 * (1 - u) * (1 - u) + tilt);
  // 副歌鼓进落定（40.016）+「心」「脏」两拍递进急顶
  c = {
    ...c,
    z: c.z * (1 + 0.035 * kick(t, 40.016, 0.12) + 0.04 * kick(t, T.heart, 0.12) + 0.06 * kick(t, T.heart2, 0.13)),
  };
  // 「困」：他一下停住，镜头惯性往上猛冲过头再拽回，往里一顿
  const dy = t - T.yank;
  if (dy > 0) c = { ...c, y: c.y - 115 * Math.exp(-dy / 0.1) * Math.sin(Math.min(Math.PI, dy * 22)), z: c.z * (1 + 0.065 * kick(t, T.yank, 0.1)) };
  // 一下往后暴退拉远（E.out），只往下移到半空楼腰（WIDE，不到地面），之后压出强烈的震撼倾斜角
  if (t > T.pull0) {
    const back = E.out(ph(t, T.pull0, T.wide));
    const zb = c.z * Math.pow(WIDE.z / c.z, back);
    const [wx, wy] = [W / 2 + (p[0] - WIDE.x) * WIDE.z, H / 2 + (p[1] - WIDE.y) * WIDE.z];
    const m = E.out(ph(t, T.pull0 + 0.04, T.wide));
    const sx0 = W / 2 + (p[0] - c.x) * c.z;
    const sy0 = H / 2 + (p[1] - c.y) * c.z;
    // 镜头逆时针旋转（画面里的城顺时针转开）：和暴退一起甩起来（E.out），到 WIDE 以后不停、继续慢慢转到切走，
    // 转着拉开像广角把整座城卷进画面；三拍化灰每一拍再往同一方向一震
    const shockTilt =
      0.17 * E.out(ph(t, T.pull0 + 0.06, T.wide)) +
      0.07 * ph(t, T.wide, T.end) +
      0.012 * kick(t, ASH_BEATS[0], 0.14) +
      0.015 * kick(t, ASH_BEATS[1], 0.14) +
      0.024 * kick(t, ASH_BEATS[2], 0.18);
    c = aim(p[0], p[1], sx0 + (wx - sx0) * m, sy0 + (wy - sy0) * m, zb, shockTilt);
  }
  // 碰到白：三拍连续冲击，镜头一惊（第三拍最重）
  c = { ...c, z: c.z * (1 + 0.024 * kick(t, ASH_BEATS[0], 0.11) + 0.028 * kick(t, ASH_BEATS[1], 0.11) + 0.045 * kick(t, ASH_BEATS[2], 0.14)) };
  const drift = ph(t, T.wide, T.end + 0.5);
  return drift > 0 ? { ...c, z: c.z * (1 - 0.07 * E.out(drift)) } : c;
}
/** 鼓进落定、「心」「脏」跳动、「困」猛拽、碰到白三拍震撼各一震 */
export const netShake = (t: number) =>
  6 * kick(t, 40.016, 0.08) +
  5 * kick(t, NET_T.heart, 0.08) +
  7 * kick(t, NET_T.heart2, 0.08) +
  24 * kick(t, NET_T.yank, 0.08) +
  9 * kick(t, ASH_BEATS[0], 0.09) +
  11 * kick(t, ASH_BEATS[1], 0.09) +
  16 * kick(t, ASH_BEATS[2], 0.12);
/** 退到整座城上时，远处那几栋高楼从雾里浮出来（和第一幕全城那个镜头一样） */
export const netWide = (c: Cam) => Math.min(1, Math.max(0, (0.62 - c.z) / 0.3));
