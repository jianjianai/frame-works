// 配角：都建在基础模型（figure.ts）上，用一份「人物配置」生成外观（Look）：发型、帽子、外衣、领带、鞋、眼镜、胡子……
// 每个人有自己的轮廓和标志色（《引力》的人物表），全片一个拉一个时一眼认得出谁是谁。
// 用法：drawCast(ctx, CAST.周磊, pose, opts)——pose 是基础模型的姿势（可以用 playMove 的动作），画的时候按这个人的身高缩放。

import { type Ink, type P, type V2, Frame, add, angleOf, clamp01, drawPart, fillShaded, lerp, loopSin, rowSpan, smoothPath } from "./rig";
import {
  type DrawOptions,
  type HeadView,
  type Look,
  type Palette,
  type PoseIn,
  type Rig,
  BASE_COLORS,
  drawFigure,
  eyeAt,
  figureJoints,
  legPaths,
  polyPath,
  rotateV,
} from "./figure";
import { bootSoles, coatPanels, drawBoot, drawCoat } from "./chengtuo-draw";

// ——— 发型（头的坐标：脸最宽处半宽 41，下巴 y = 48，眼睛 y ≈ 8，耳朵 x ±33..55、y 0..28，脸的上沿 y ≈ −53） ———
export type HairStyle = "short" | "kid" | "bob" | "bun" | "long" | "ponytail" | "receding" | "none";

interface HairShape {
  /** 后面的头发（画在身子后面）：头的坐标 */
  back: P[];
  /** 前面的头发（刘海、鬓角，画在脸上面）：贴着脸边的会跟着脸转身 */
  front: P[][];
  /** 披下来的部分从这个高度往下跟着受力飘 */
  pivot?: number;
  /** 漂起来时一缕一缕的长度 */
  float?: number;
}

const HAIR: Record<Exclude<HairStyle, "none">, HairShape> = {
  // 男人的短发：头顶一层，侧分的短刘海，鬓角到耳朵上面
  short: {
    back: [[-50, 8], [-55, -30], [-44, -62], [-14, -76], [18, -75], [46, -60], [56, -28], [51, 8], [40, 14], [-40, 14]],
    front: [
      [[-47, 4, 1], [-50, -30], [-36, -60], [-8, -70], [24, -68], [46, -52], [50, -22], [46, 2, 1], [40, -18], [30, -30], [12, -24, 1], [6, -34], [-10, -28, 1], [-24, -30], [-40, -16]],
    ],
  },
  // 小孩：毛茸茸的短发，刘海一撮一撮
  kid: {
    back: [[-52, 14], [-58, -26], [-46, -62], [-14, -78], [20, -77], [48, -60], [58, -24], [52, 14], [40, 20], [-40, 20]],
    front: [
      [[-49, 10, 1], [-54, -28], [-40, -62], [-6, -74], [30, -68], [50, -46], [52, -14], [48, 8, 1], [42, -10, 1], [34, -12], [26, -24, 1], [16, -12], [6, -24, 1], [-4, -12], [-14, -24, 1], [-24, -12], [-34, -22, 1], [-42, -6]],
    ],
  },
  // 齐肩短发（千斤）：齐刘海、两边垂到下巴
  bob: {
    back: [[-60, 46], [-64, -18], [-50, -60], [-14, -78], [20, -77], [52, -58], [64, -16], [60, 46], [48, 56], [-48, 56]],
    pivot: 10,
    float: 70,
    front: [
      [[-54, 50, 1], [-56, -24], [-42, -62], [-8, -72], [28, -68], [50, -48], [56, -20], [54, 50, 1], [44, 46], [42, 10], [40, -10, 1], [-40, -10, 1], [-42, 10], [-44, 46]],
    ],
  },
  // 盘发（老太太、千斤的妈妈）：往后梳，头顶后面一个髻
  bun: {
    back: [[-50, 6], [-56, -30], [-46, -60], [-18, -74], [12, -78], [26, -96], [52, -92], [58, -70], [54, -52], [58, -26], [52, 8], [40, 14], [-40, 14]],
    front: [[[-47, 6, 1], [-50, -26], [-38, -58], [-6, -68], [26, -64], [46, -48], [50, -20], [46, 6, 1], [40, -16], [24, -36], [0, -40], [-22, -38], [-40, -18]]],
  },
  // 长发披在背后（光里的女人、秤砣的妈妈）：中分，两边一缕到胸口
  long: {
    back: [[-62, 120], [-70, 20], [-66, -34], [-48, -66], [-12, -80], [22, -79], [52, -64], [68, -30], [72, 22], [64, 120], [30, 134], [-28, 134]],
    pivot: 6,
    float: 150,
    front: [
      [[-52, 70, 1], [-56, -20], [-44, -58], [-12, -72], [0, -60, 1], [-8, -40], [-26, -24], [-40, -6], [-44, 30], [-46, 70]],
      [[52, 70, 1], [56, -20], [44, -58], [12, -72], [0, -60, 1], [8, -40], [26, -24], [40, -6], [44, 30], [46, 70]],
    ],
  },
  // 低马尾（小石头的妈妈）：侧分，脑后一把垂到肩上
  ponytail: {
    back: [[-50, 8], [-56, -30], [-46, -62], [-14, -76], [20, -75], [48, -60], [58, -28], [56, 6], [62, 30], [66, 92], [50, 112], [38, 90], [40, 30], [36, 16], [-40, 14]],
    pivot: 20,
    float: 100,
    front: [
      [[-47, 6, 1], [-52, -28], [-38, -60], [-6, -71], [28, -66], [48, -48], [52, -18], [48, 8, 1], [42, -12], [24, -30], [-2, -36], [-22, -30], [-38, -14]],
    ],
  },
  // 头顶秃了、两边一圈白头发（老钟）
  receding: {
    back: [[-52, 12], [-60, -14], [-56, -42], [-44, -46], [-46, -20], [-30, -8], [30, -8], [46, -20], [44, -46], [56, -42], [60, -14], [52, 12], [40, 18], [-40, 18]],
    front: [
      [[-46, 10, 1], [-56, -12], [-52, -40], [-42, -44], [-40, -26], [-36, -8], [-38, 6]],
      [[46, 10, 1], [56, -12], [52, -40], [42, -44], [40, -26], [36, -8], [38, 6]],
    ],
  },
};

/** 受力朝上的程度（0 垂着 → 1 失重漂起来） */
function upness(field: V2) {
  const fl = Math.hypot(field[0], field[1]) || 1;
  return clamp01((-field[1] / fl + 0.2) / 1.0);
}

/** 垂着、被风吹的头发：pivot 以下的点绕 (0, pivot) 往受力的左右方向转，越往下转得越多 */
function flowHair(pts: P[], field: V2, pivot: number | undefined, t: number): P[] {
  if (pivot === undefined) return pts;
  const side = Math.max(-1.3, Math.min(1.3, Math.atan2(-field[0], Math.max(0.25, Math.abs(field[1])))));
  return pts.map((p) => {
    const d = p[1] - pivot;
    if (d <= 0) return p;
    const w = clamp01(d / 110);
    const wob = 0.06 * loopSin(t, 3, p[0] * 0.05 + d * 0.02) * w * Math.min(1, Math.abs(field[0]) + 0.2);
    const q = rotateV([p[0], d], side * w * 0.8 + wob);
    return [q[0], pivot + q[1], p[2]] as P;
  });
}

/**
 * 漂起来的头发：从头顶一圈长出一缕一缕，往外、往上漾（和秤砣失重时一样，像在水里）。
 * length：头发有多长（长发 150、短发 70），按时间慢慢摆。
 */
function floatLocks(head: Frame, uh: number, length: number, t: number, field: V2): Path2D[] {
  const out: Path2D[] = [];
  const N = 7;
  const wind = Math.max(-1, Math.min(1, field[0]));
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1);
    const th = -Math.PI * (0.06 + 0.88 * k);
    const root: V2 = [Math.cos(th) * 50 + uh * 8, -18 + Math.sin(th) * 50];
    const out0: V2 = [Math.cos(th), Math.sin(th)];
    const dir0: V2 = [out0[0] * 0.75 + wind * 0.4, out0[1] * 0.4 - 1];
    const dl = Math.hypot(dir0[0], dir0[1]);
    const dir: V2 = [dir0[0] / dl, dir0[1] / dl];
    const L = length * (0.75 + 0.25 * Math.sin(i * 2.3 + 1));
    const left: V2[] = [];
    const right: V2[] = [];
    const M = 10;
    for (let j = 0; j <= M; j++) {
      const u = j / M;
      const sway = Math.sin(u * Math.PI) * 10 * Math.sin(t * 1.3 + i * 1.7) + u * u * 14 * Math.sin(t * 0.9 + i);
      const c: V2 = [root[0] + dir[0] * L * u - dir[1] * sway, root[1] + dir[1] * L * u + dir[0] * sway];
      const w = 21 * (1 - u * 0.92) * (1 - 0.35 * u * u) + 1.5;
      left.push([c[0] - dir[1] * w, c[1] + dir[0] * w]);
      right.push([c[0] + dir[1] * w, c[1] - dir[0] * w]);
    }
    const pts = [...left, ...right.reverse()].map((p) => [...head.p(p[0], p[1])] as P);
    out.push(smoothPath(pts));
  }
  return out;
}

// ——— 帽子 ———
export interface HatSpec {
  kind: "cap" | "beanie";
  color: string;
  shade: string;
  /** 帽徽 */
  badge?: string;
}

function drawHat(ctx: CanvasRenderingContext2D, h: HeadView, hat: HatSpec, ink: Ink) {
  const { H, uh } = h;
  const sx = (x: number) => x - uh * 14 * (1 - Math.abs(x) / 70);
  const map = (pts: P[]) => smoothPath(pts.map(([x, y, c]) => [...H(sx(x), y), ...(c ? [c] : [])] as P));
  if (hat.kind === "cap") {
    // 制服帽：圆顶 + 一圈帽墙 + 往前的帽檐
    drawPart(ctx, map([[-54, -40, 1], [-58, -66], [-40, -96], [0, -106], [40, -96], [58, -66], [54, -40, 1]]), hat.color, hat.shade, ink, ink.lw * 0.8);
    drawPart(ctx, map([[-54, -26, 1], [-56, -46, 1], [56, -46, 1], [54, -26, 1]]), hat.color, hat.shade, ink, ink.lw * 0.8);
    drawPart(ctx, map([[-50, -26, 1], [-26, -18], [26, -18], [50, -26, 1], [20, -30], [-20, -30]]), "#242a3a", null, ink, ink.lw * 0.7);
    if (hat.badge) {
      const c = H(sx(0), -56);
      ctx.fillStyle = hat.badge;
      ctx.strokeStyle = ink.line;
      ctx.lineWidth = ink.lw * 0.4;
      ctx.beginPath();
      ctx.arc(c[0], c[1], 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // 毛线帽：圆圆地扣在头顶，一圈翻边
    drawPart(ctx, map([[-56, -22, 1], [-60, -56], [-40, -90], [0, -100], [40, -90], [60, -56], [56, -22, 1]]), hat.color, hat.shade, ink, ink.lw * 0.8);
    drawPart(ctx, map([[-58, -14, 1], [-60, -36, 1], [60, -36, 1], [58, -14, 1]]), hat.shade, null, ink, ink.lw * 0.8);
  }
}

// ——— 鞋 ———
// 矮帮的鞋：鞋口在脚踝下面一截，裤脚到鞋口之间露出一段袜子（不给袜子就是脚踝）；后跟、鞋头、整条鞋底分清楚。
// （2026-10-19 重画。原来的鞋是一坨圆包、鞋底像垫在下面的一块板，鞋口离裤脚还空着一截，用户：「鞋子没做好」。
//   鞋口直接接到裤脚、整只鞋盖住脚踝的话，人物的脚踝离地很高，鞋就成了又方又笨的高筒靴。）
// 坐标：脚的坐标系（原点在脚踝，+y 顺着小腿往下，脚尖朝 −x；地面在 y ≈ 66），画面左边那只，另一只镜像。
export type ShoeStyle = "sneaker" | "leather" | "cloth";
/** sneaker 帆布鞋（白橡胶底、包头、鞋带）、leather 皮鞋（薄底 + 鞋跟、鞋头一道高光，默认）、cloth 布鞋（厚白千层底、一圈针脚） */
export interface ShoeSpec {
  color: string;
  shade: string;
  /** 鞋底的颜色（皮鞋默认铁灰，帆布鞋、布鞋默认米白） */
  sole?: string;
  style?: ShoeStyle;
  /** 袜子的颜色；不给就露出脚踝（皮肤色） */
  sock?: string;
}

const SHOE_UPPER: Record<ShoeStyle, P[]> = {
  sneaker: [[18, 25, 1], [22, 33], [23, 50], [21, 58, 1], [-50, 58, 1], [-57, 53], [-56, 44], [-46, 39], [-32, 35], [-22, 27], [-17, 19], [-11, 21], [2, 25]],
  leather: [[18, 27, 1], [22, 35], [22, 52], [20, 59, 1], [-52, 59, 1], [-60, 55], [-58, 47], [-46, 42], [-30, 38], [-20, 30], [-14, 26], [2, 28]],
  cloth: [[18, 30, 1], [22, 37], [22, 52], [20, 57, 1], [-50, 57, 1], [-57, 52], [-55, 44], [-43, 40], [-26, 36], [-14, 31], [2, 31]],
};
/** 帆布鞋：白橡胶底（前头微微翘起来）、橡胶包头、鞋口里面露出来的一小块里子 */
const SNEAKER_SOLE: P[] = [[24, 54, 1], [24, 63], [20, 67], [-48, 67], [-57, 64], [-59, 57], [-55, 54, 1]];
const SNEAKER_TOE: P[] = [[-38, 55, 1], [-40, 47], [-50, 42], [-58, 46], [-59, 53], [-56, 55, 1]];
const SNEAKER_INSIDE: P[] = [[18, 25, 1], [2, 25], [-11, 21], [-6, 26], [8, 29]];
/** 皮鞋：前掌一条薄底、后面一个鞋跟（中间足弓那里空着） */
const LEATHER_SOLE: P[] = [[-8, 57, 1], [-8, 62, 1], [-52, 63], [-62, 61], [-61, 56, 1]];
const LEATHER_HEEL: P[] = [[21, 56, 1], [21, 67, 1], [4, 67, 1], [3, 56, 1]];
/** 布鞋：厚厚的千层底 */
const CLOTH_SOLE: P[] = [[23, 53, 1], [23, 63], [19, 67], [-47, 67], [-57, 63], [-58, 55], [-53, 53, 1]];
/** 穿着鞋时着地的点（鞋底一圈）：皮鞋前掌翘着、跟着地 */
const SHOE_GROUND: Record<ShoeStyle, V2[]> = {
  sneaker: [[-50, 66], [-30, 67], [0, 67], [20, 66]],
  leather: [[-54, 62], [-30, 62.5], [5, 67], [20, 67]],
  cloth: [[-50, 66], [-30, 67], [0, 67], [18, 66]],
};

/**
 * 鞋绕鞋口里的一点转（脚踝顺着小腿往下 SHOE_PIVOT）：基础模型的脚踝在裤脚那里、离鞋口还有一截，
 * 脚尖一绷（飘着、踮脚）绕它转的鞋会被一截横着的「脚脖子」挑出去。站着时和绕脚踝转一样。
 */
const SHOE_PIVOT = 22;
function shoeMap(rig: Rig, side: "L" | "R") {
  const limb = rig.legs[side];
  const fx = side === "R" || rig.u >= 0.25 ? 1 : -1;
  const [px, py] = new Frame(limb.end[0], limb.end[1], limb.a2).p(0, SHOE_PIVOT);
  const f = new Frame(px, py, limb.tip.a);
  return ([x, y]: V2): V2 => f.p(x * fx, y - SHOE_PIVOT);
}

function shoeSoles(rig: Rig, side: "L" | "R", style: ShoeStyle): V2[] {
  return SHOE_GROUND[style].map(shoeMap(rig, side));
}

function shoeLine(ctx: CanvasRenderingContext2D, pts: V2[], m: (p: V2) => V2, color: string, lw: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  pts.forEach((p, i) => {
    const q = m(p);
    if (i) ctx.lineTo(q[0], q[1]);
    else ctx.moveTo(q[0], q[1]);
  });
  ctx.stroke();
}

function drawShoe(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink, shoe: ShoeSpec) {
  const style = shoe.style ?? "leather";
  const limb = rig.legs[side];
  const fx = side === "R" || rig.u >= 0.25 ? 1 : -1;
  const shin = new Frame(limb.end[0], limb.end[1], limb.a2);
  const m = shoeMap(rig, side);
  const path = (pts: P[]) => smoothPath(pts.map(([x, y, c]) => [...m([x, y]), ...(c ? [c] : [])] as P));
  const lw = ink.lw * 0.8;
  const stroke = (p: Path2D, w = lw) => {
    ctx.strokeStyle = ink.line;
    ctx.lineWidth = w;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke(p);
  };
  // 袜子或者脚踝：一截能弯的软管，上头跟着小腿（藏在裤脚里），下头跟着鞋（藏在鞋口里）；只描两边
  const tl = shin.p(-13, -2);
  const tr = shin.p(16, -2);
  const bl = m([-15 * fx, 38]);
  const br = m([17 * fx, 38]);
  const sock = new Path2D();
  sock.moveTo(tl[0], tl[1]);
  sock.lineTo(tr[0], tr[1]);
  sock.lineTo(br[0], br[1]);
  sock.lineTo(bl[0], bl[1]);
  sock.closePath();
  fillShaded(ctx, sock, shoe.sock ?? rig.look.colors?.skin ?? BASE_COLORS.skin, null, ink);
  const id = (p: V2) => p;
  shoeLine(ctx, [tl, bl], id, ink.line, lw);
  shoeLine(ctx, [tr, br], id, ink.line, lw);
  const upper = path(SHOE_UPPER[style]);
  fillShaded(ctx, upper, shoe.color, shoe.shade, ink);
  ctx.save();
  ctx.clip(upper);
  if (style === "sneaker") {
    ctx.fillStyle = "rgba(60,50,60,0.28)";
    ctx.fill(path(SNEAKER_INSIDE));
    // 鞋带：脚背上两道
    shoeLine(ctx, [[-20, 28], [-11, 31]], m, ink.line, ink.lw * 0.55);
    shoeLine(ctx, [[-27, 32], [-18, 35]], m, ink.line, ink.lw * 0.55);
  } else if (style === "leather") {
    // 鞋头一道高光、脚背上系带的那一块
    shoeLine(ctx, [[-36, 44], [-45, 46], [-52, 49]], m, "rgba(255,255,255,0.35)", ink.lw * 1.3);
    shoeLine(ctx, [[-16, 30], [-22, 36], [-30, 40]], m, ink.line, ink.lw * 0.5);
  } else {
    // 布鞋：鞋口到鞋头一道中缝
    shoeLine(ctx, [[-16, 34], [-26, 39], [-36, 42]], m, ink.line, ink.lw * 0.5);
  }
  ctx.restore();
  stroke(upper);
  const sole = shoe.sole ?? (style === "leather" ? "#4a4d57" : "#f6f2ea");
  if (style === "sneaker") {
    const s = path(SNEAKER_SOLE);
    fillShaded(ctx, s, sole, null, ink);
    // 底下一道浅灰的大底
    ctx.save();
    ctx.clip(s);
    ctx.fillStyle = "rgba(120,110,100,0.22)";
    ctx.fill(path([[-70, 63, 1], [40, 63, 1], [40, 80, 1], [-70, 80, 1]]));
    ctx.restore();
    stroke(s);
    const toe = path(SNEAKER_TOE);
    fillShaded(ctx, toe, sole, null, ink);
    stroke(toe, lw * 0.9);
  } else if (style === "leather") {
    const h = path(LEATHER_HEEL);
    fillShaded(ctx, h, sole, null, ink);
    stroke(h);
    const s = path(LEATHER_SOLE);
    fillShaded(ctx, s, sole, null, ink);
    stroke(s);
  } else {
    const s = path(CLOTH_SOLE);
    fillShaded(ctx, s, sole, null, ink);
    // 千层底中间一圈针脚
    ctx.save();
    ctx.clip(s);
    ctx.setLineDash([3, 4]);
    shoeLine(ctx, [[19, 60], [-44, 60], [-53, 58]], m, "rgba(90,80,70,0.55)", ink.lw * 0.45);
    ctx.restore();
    stroke(s);
  }
  // 裤脚压在袜子、鞋口上面：把小腿最下面一截再画一遍（和原来一样先描两倍粗的边再填色，接缝看不出来）。
  // 脚尖朝下、脚踝弯得很厉害时（飘着），袜子的上角、鞋跟不会从裤脚边上戳出来
  const leg = legPaths(rig, side)[1];
  const col = { ...BASE_COLORS, ...rig.look.colors };
  ctx.save();
  ctx.clip(polyPath([[-90, -36], [90, -36], [90, 26], [-90, 26]], ([x, y]) => shin.p(x, y)));
  ctx.strokeStyle = ink.line;
  ctx.lineWidth = ink.lw * 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke(leg);
  fillShaded(ctx, leg, col.bottom, col.bottomShade, ink);
  ctx.restore();
}

// ——— 人物配置 ———
export interface CastSpec {
  /** 名字（中文） */
  name: string;
  /** 身高（相对秤砣：1 = 和她一样高，全身约 590） */
  scale: number;
  /** 配色：皮肤、眼睛、上衣 top、下装 bottom…… */
  colors: Partial<Palette>;
  hair: HairStyle;
  hairColor: string;
  hairShade?: string;
  hat?: HatSpec;
  /** 外衣（用秤砣外套的版型）：size 大一号、long 下摆加长 */
  coat?: { color: string; shade: string; size?: number; long?: number; hem?: string };
  /** 领带（西装） */
  tie?: string;
  /** 鞋（帆布鞋、皮鞋、布鞋，见 ShoeSpec）；"boots" 是和秤砣一样的大铁靴；"bare" 光脚 */
  shoes: ShoeSpec | "boots" | "bare";
  /** 铁靴相对身子放大多少（七岁的她穿着妈妈的大铁靴） */
  bootScale?: number;
  glasses?: string;
  mustache?: string;
  /** 皱纹（老人） */
  wrinkles?: boolean;
  /** 发卡 */
  hairclip?: string;
  /** 脚踝上的铃铛（小孩） */
  bell?: boolean;
  /** 上衣的圆领 */
  collar?: boolean;
  headScale?: number;
  width?: number;
}

/** 配置 → 外观 */
export function castLook(spec: CastSpec): Look {
  const hair = spec.hair === "none" ? null : HAIR[spec.hair];
  const hairColor = spec.hairColor;
  const hairShade = spec.hairShade ?? hairColor;
  const coat = spec.coat;
  const shoes = spec.shoes;
  return {
    colors: spec.colors,
    collar: spec.collar ?? true,
    headScale: spec.headScale,
    width: spec.width,
    sleeve: coat ? () => [coat.color, coat.shade] : undefined,
    shoulderOut: coat ? () => 4 * (coat.size ?? 1) : undefined,
    armsOver: coat ? () => true : undefined,
    bodyPieces: coat ? (rig) => coatPanels(rig, coat.size, coat.long) : undefined,
    backHair: hair
      ? (ctx, rig, ink) => {
          const { head, thh, field, pose } = rig;
          const uh = -thh / 0.62;
          const f = rotateV(field, -head.a);
          const up = hair.pivot === undefined ? 0 : upness(f);
          // 垂着的一整片和漂起来的一缕一缕之间交叉淡入淡出
          const aDown = 1 - clamp01((up - 0.35) / 0.3);
          if (aDown > 0) {
            const pts = flowHair(hair.back, f, hair.pivot, pose.t);
            const path = smoothPath(pts.map(([x, y, c]) => [...head.p(x + uh * (6 + clamp01((y + 20) / 80) * 8), y), ...(c ? [c] : [])] as P));
            ctx.save();
            ctx.globalAlpha *= aDown;
            drawPart(ctx, path, hairColor, hairShade, ink, ink.lw * 0.9);
            ctx.restore();
          }
          if (aDown < 1) {
            ctx.save();
            ctx.globalAlpha *= 1 - aDown;
            const locks = floatLocks(head, uh, hair.float ?? 120, pose.t, f);
            ctx.strokeStyle = ink.line;
            ctx.lineWidth = ink.lw * 1.8;
            ctx.lineJoin = "round";
            for (const l of locks) ctx.stroke(l);
            for (const l of locks) fillShaded(ctx, l, hairColor, hairShade, ink);
            // 头顶那一层还在
            const cap = smoothPath(HAIR.short.back.map(([x, y, c]) => [...head.p(x * 1.04 + uh * 6, y), ...(c ? [c] : [])] as P));
            drawPart(ctx, cap, hairColor, hairShade, ink, ink.lw * 0.9);
            ctx.restore();
          }
        }
      : undefined,
    overTorso: (ctx, rig, ink, sides) => {
      if (spec.tie) drawTie(ctx, rig, ink, spec.tie);
      if (coat) {
        drawCoat(ctx, rig, ink, sides, coat.color, coat.shade, coat.size, coat.long);
        if (coat.hem) drawHem(ctx, rig, ink, coat);
      }
    },
    frontHair: (ctx, h, ink) => {
      if (hair) {
        const f = rotateV(h.rig.field, -h.rig.head.a);
        const up = hair.pivot === undefined ? 0 : upness(f);
        for (const part of hair.front) {
          // 漂起来时垂在脸边的那缕往外、往上翻（绕它的上端转）
          const flowed = flowHair(part, f, hair.pivot, h.rig.pose.t);
          const pts =
            up > 0 && hair.pivot !== undefined
              ? flowed.map((p) => {
                  const d = p[1] - hair.pivot!;
                  if (d <= 0) return p;
                  const s = p[0] < 0 ? -1 : 1;
                  const q = rotateV([p[0] - s * 44, d], -s * up * 2.2 * clamp01(d / 60));
                  return [s * 44 + q[0], hair.pivot! + q[1], p[2]] as P;
                })
              : flowed;
          const path = smoothPath(pts.map(([x, y, c]) => [...h.place([x, y]), ...(c ? [c] : [])] as P));
          fillShaded(ctx, path, hairColor, null, ink);
          h.strokeOnSkin(path, []);
        }
      }
      if (spec.hairclip) {
        const a = h.place([-30, -18]);
        const b = h.place([-12, -24]);
        ctx.strokeStyle = ink.line;
        ctx.lineCap = "round";
        ctx.lineWidth = ink.lw * 2.6;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
        ctx.strokeStyle = spec.hairclip;
        ctx.lineWidth = ink.lw * 1.6;
        ctx.stroke();
      }
      if (spec.hat) drawHat(ctx, h, spec.hat, ink);
    },
    face: (ctx, h, ink) => {
      if (spec.glasses) drawGlasses(ctx, h, ink, spec.glasses);
      if (spec.mustache) drawMustache(ctx, h, ink, spec.mustache);
      if (spec.wrinkles) drawWrinkles(ctx, h, ink);
    },
    shoe: shoes === "bare" ? undefined : () => true,
    soles:
      shoes === "boots"
        ? (rig, side) => {
            const k = spec.bootScale ?? 1;
            const a = rig.legs[side].end;
            return bootSoles(rig, side).map(([x, y]) => [a[0] + (x - a[0]) * k, a[1] + (y - a[1]) * k] as V2);
          }
        : shoes === "bare"
          ? undefined
          : (rig, side) => shoeSoles(rig, side, shoes.style ?? "leather"),
    overLeg: (ctx, rig, side, ink) => {
      const lp = side === "L" ? rig.pose.legL : rig.pose.legR;
      if (shoes === "boots") {
        if (lp.boot) {
          const k = spec.bootScale ?? 1;
          const a = rig.legs[side].end;
          ctx.save();
          ctx.translate(a[0], a[1]);
          ctx.scale(k, k);
          ctx.translate(-a[0], -a[1]);
          drawBoot(ctx, rig, side, { ...ink, lw: ink.lw / k });
          ctx.restore();
        }
      } else if (shoes !== "bare" && lp.boot) drawShoe(ctx, rig, side, ink, shoes);
      if (spec.bell) drawBell(ctx, rig, side, ink);
    },
  };
}

/** 领带：领口下面一个结，垂到肚子上（夹在外衣两片前襟之间） */
function drawTie(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink, color: string) {
  const cx = lerp(0, -12, rig.u);
  const on = ([x, y]: V2) => rig.chest.p(cx + x, y);
  const path = (pts: P[]) => smoothPath(pts.map(([x, y, c]) => [...on([x, y]), ...(c ? [c] : [])] as P));
  drawPart(ctx, path([[-6, -158, 1], [6, -158, 1], [5, -146, 1], [-5, -146, 1]]), color, null, ink, ink.lw * 0.6);
  drawPart(ctx, path([[-5, -146, 1], [5, -146, 1], [9, -78], [0, -66, 1], [-9, -78]]), color, null, ink, ink.lw * 0.6);
}

/** 外衣下摆缝的一圈铅（小石头妈妈的橘色外套）：下摆里面一道深色 */
function drawHem(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink, coat: NonNullable<CastSpec["coat"]>) {
  const panels = coatPanels(rig, coat.size, coat.long);
  const size = coat.size ?? 1;
  const long = coat.long ?? 0;
  const y0 = -156 + (40 + 156) * size + long;
  const band = new Path2D();
  const a = rig.chest.p(-200, y0 - 16);
  const b = rig.chest.p(200, y0 - 16);
  const c = rig.chest.p(200, y0 + 40);
  const d = rig.chest.p(-200, y0 + 40);
  band.moveTo(...a);
  band.lineTo(...b);
  band.lineTo(...c);
  band.lineTo(...d);
  band.closePath();
  for (const p of panels) {
    ctx.save();
    ctx.clip(p);
    ctx.fillStyle = coat.hem!;
    ctx.fill(band);
    ctx.strokeStyle = ink.line;
    ctx.lineWidth = ink.lw * 0.5;
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.stroke();
    ctx.restore();
  }
}

function drawGlasses(ctx: CanvasRenderingContext2D, h: HeadView, ink: Ink, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = ink.lw * 0.55;
  const pts: V2[] = [];
  for (const s of [-1, 1]) {
    const e = eyeAt(s, h.uh);
    const c = h.H(e.x, e.y + 1);
    const rx = 12.5 * e.sx;
    ctx.beginPath();
    ctx.ellipse(c[0], c[1], rx, 11, h.rig.head.a, 0, Math.PI * 2);
    ctx.stroke();
    pts.push(h.H(e.x - s * rx, e.y));
  }
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  ctx.lineTo(pts[1][0], pts[1][1]);
  ctx.stroke();
}

function drawMustache(ctx: CanvasRenderingContext2D, h: HeadView, ink: Ink, color: string) {
  const cx = lerp(0, -26, h.uh);
  const w = lerp(1, 0.7, h.uh);
  const path = smoothPath(
    ([[-11, 27.5], [0, 25, 1], [11, 27.5], [8, 30.5], [0, 28.5], [-8, 30.5]] as P[]).map(([x, y, c]) => [...h.H(cx + x * w, y), ...(c ? [c] : [])] as P),
  );
  drawPart(ctx, path, color, null, ink, ink.lw * 0.4);
}

function drawWrinkles(ctx: CanvasRenderingContext2D, h: HeadView, ink: Ink) {
  ctx.strokeStyle = "rgba(120,90,80,0.55)";
  ctx.lineWidth = ink.lw * 0.35;
  ctx.lineCap = "round";
  for (const s of [-1, 1]) {
    const e = eyeAt(s, h.uh);
    // 眼角两道细纹、法令纹一道
    for (const dy of [-2, 3]) {
      const a = h.H(e.x + s * 12 * e.sx, e.y + dy);
      const b = h.H(e.x + s * 17 * e.sx, e.y + dy * 1.6);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }
    const a = h.H(e.x + s * 2, 22);
    const b = h.H(e.x + s * 6, 34);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo(a[0] + s * 4, (a[1] + b[1]) / 2, b[0], b[1]);
    ctx.stroke();
  }
}

/** 脚踝上的铃铛：大人隔着一条街也听得见他还在地上 */
function drawBell(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink) {
  if (side !== "L") return;
  const limb = rig.legs[side];
  const p = new Frame(limb.end[0], limb.end[1], limb.a2).p(-6, -6);
  ctx.fillStyle = "#f2c94c";
  ctx.strokeStyle = ink.line;
  ctx.lineWidth = ink.lw * 0.5;
  ctx.beginPath();
  ctx.arc(p[0], p[1], 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ink.line;
  ctx.beginPath();
  ctx.arc(p[0], p[1] + 3, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

// ——— 片子里的人（《引力》） ———
const SKIN = { skin: "#fbe2d3", skinShade: "#f0cab7" };
const SKIN_WARM = { skin: "#f6d6c1", skinShade: "#e8bfa8" };
const SKIN_OLD = { skin: "#f3d9c9", skinShade: "#e2bfae" };

export const CAST = {
  /** 周磊：35 岁的职员，灰蓝西装、蓝领带；开场第一个被她拽回来的人 */
  周磊: {
    name: "周磊",
    scale: 1.06,
    width: 1.1,
    colors: { ...SKIN, top: "#f4f2ec", topShade: "#e2ded4", bottom: "#4f5d76", bottomShade: "#424e64" },
    collar: false,
    hair: "short",
    hairColor: "#2f2e33",
    coat: { color: "#6b7d9c", shade: "#5a6b88", size: 1.02 },
    tie: "#3f63a8",
    shoes: { color: "#2d2a31", shade: "#232027", sole: "#3c3940", style: "leather", sock: "#3a3741" },
  } as CastSpec,
  /** 称重员：全城最厚的铁靴、藏蓝制服帽；也是轻的 */
  称重员: {
    name: "称重员",
    scale: 1.1,
    width: 1.2,
    colors: { ...SKIN_WARM, top: "#3d4a6b", topShade: "#333e5a", bottom: "#323b55", bottomShade: "#2a3249" },
    collar: false,
    hair: "short",
    hairColor: "#3a3539",
    hat: { kind: "cap", color: "#2f3b5c", shade: "#27314c", badge: "#e8c25a" },
    coat: { color: "#3d4a6b", shade: "#333e5a", size: 1.04 },
    mustache: "#3a3539",
    shoes: "boots",
  } as CastSpec,
  /** 老钟：七十多岁，白头发、棕毛衣、眼镜；每天等她的脚步声 */
  老钟: {
    name: "老钟",
    scale: 0.96,
    width: 1.06,
    colors: { ...SKIN_OLD, top: "#9a6a4a", topShade: "#85593d", bottom: "#5e5248", bottomShade: "#4f443b" },
    hair: "receding",
    hairColor: "#ecebe6",
    hairShade: "#d6d4cc",
    glasses: "#5a4a40",
    wrinkles: true,
    shoes: { color: "#5a4636", shade: "#4b3a2d", style: "leather", sock: "#4a4650" },
  } as CastSpec,
  /** 小石头：7 岁，绿外套、脚踝上一只铃铛 */
  小石头: {
    name: "小石头",
    scale: 0.6,
    headScale: 1.42,
    colors: { ...SKIN, top: "#f3efe4", topShade: "#e1dccd", bottom: "#56627a", bottomShade: "#48536a", blush: "250,140,140" },
    hair: "kid",
    hairColor: "#2f2e33",
    coat: { color: "#68a86f", shade: "#57925e" },
    bell: true,
    shoes: { color: "#c9574a", shade: "#b0473b", style: "sneaker", sock: "#f7f3ee" },
  } as CastSpec,
  /** 小石头裹着妈妈的橘色外套（大一号、下摆缝了一圈铅）：副歌一以后一直穿着 */
  小石头穿妈妈的外套: {
    name: "小石头",
    scale: 0.6,
    headScale: 1.42,
    colors: { ...SKIN, top: "#f3efe4", topShade: "#e1dccd", bottom: "#56627a", bottomShade: "#48536a", blush: "250,140,140" },
    hair: "kid",
    hairColor: "#2f2e33",
    coat: { color: "#f29a4a", shade: "#de8538", size: 1.32, long: 70, hem: "#8a6a5a" },
    bell: true,
    shoes: { color: "#c9574a", shade: "#b0473b", style: "sneaker", sock: "#f7f3ee" },
  } as CastSpec,
  /** 小石头的妈妈：年轻的轻户，橘色外套（下摆缝了一圈铅）、低马尾 */
  小石头的妈妈: {
    name: "小石头的妈妈",
    scale: 0.98,
    colors: { ...SKIN, top: "#f7ead8", topShade: "#e9d8c0", bottom: "#6a5a66", bottomShade: "#5a4b56" },
    hair: "ponytail",
    hairColor: "#5b3f33",
    hairShade: "#4c342a",
    coat: { color: "#f29a4a", shade: "#de8538", long: 30, hem: "#8a6a5a" },
    shoes: { color: "#7a5a4a", shade: "#674b3d", style: "leather" },
  } as CastSpec,
  /** 千斤：16 岁，红毛衣、黄发卡、齐肩短发 */
  千斤: {
    name: "千斤",
    scale: 0.94,
    colors: { ...SKIN, top: "#e2574c", topShade: "#c9473d", bottom: "#3d3f52", bottomShade: "#333545" },
    hair: "bob",
    hairColor: "#2c2a30",
    hairclip: "#f2c94c",
    shoes: { color: "#6b4a3f", shade: "#5a3d33", style: "sneaker", sock: "#f7f3ee" },
  } as CastSpec,
  /** 千斤的妈妈：紫衣服、盘发，在哑铃厂打两份工 */
  千斤的妈妈: {
    name: "千斤的妈妈",
    scale: 1.0,
    colors: { ...SKIN_WARM, top: "#b9a3d6", topShade: "#a48ec2", bottom: "#4f465e", bottomShade: "#433b50" },
    hair: "bun",
    hairColor: "#3a3036",
    coat: { color: "#8e6bbf", shade: "#7a59a8", long: 40 },
    shoes: { color: "#4a3f52", shade: "#3d3445", style: "leather" },
  } as CastSpec,
  /** 阿满：四十多岁的压锭工，绿帽子、棕夹克 */
  阿满: {
    name: "阿满",
    scale: 1.04,
    width: 1.16,
    colors: { ...SKIN_WARM, top: "#d8cfb8", topShade: "#c6bca4", bottom: "#4f5361", bottomShade: "#434653" },
    hair: "short",
    hairColor: "#3a3539",
    hat: { kind: "beanie", color: "#5c9a64", shade: "#4c8554" },
    coat: { color: "#8c6a4c", shade: "#77593e" },
    shoes: { color: "#3e3a3f", shade: "#322f33", style: "leather", sock: "#3a3741" },
  } as CastSpec,
  /** 窗口的老太太（千斤用砖救下的） */
  老太太: {
    name: "老太太",
    scale: 0.88,
    colors: { ...SKIN_OLD, top: "#bfaee0", topShade: "#a998cc", bottom: "#6a6273", bottomShade: "#5a5362" },
    hair: "bun",
    hairColor: "#dcdad4",
    hairShade: "#c6c3bb",
    wrinkles: true,
    shoes: { color: "#3a3540", shade: "#2e2a33", style: "cloth", sock: "#f7f3ee" },
  } as CastSpec,
  /** 周磊拽下来的年轻人 */
  年轻人: {
    name: "年轻人",
    scale: 1.02,
    colors: { ...SKIN, top: "#4fa8a3", topShade: "#3f938e", bottom: "#3f4757", bottomShade: "#353c4a" },
    collar: false,
    hair: "kid",
    hairColor: "#3b3035",
    shoes: { color: "#f0ede6", shade: "#dcd8cf", sole: "#e9e3d8", style: "sneaker" },
  } as CastSpec,
  /** 秤砣的妈妈（锈红色）：只在回忆和白里出现 */
  秤砣的妈妈: {
    name: "秤砣的妈妈",
    scale: 1.0,
    colors: { ...SKIN, top: "#f3e2d6", topShade: "#e4cfc0", bottom: "#5c4a4c", bottomShade: "#4d3d3f" },
    hair: "long",
    hairColor: "#2c2a30",
    coat: { color: "#b75b44", shade: "#a04a35", long: 50 },
    shoes: "bare",
  } as CastSpec,
  /** 七岁的秤砣：穿着妈妈那双大铁靴 */
  小时候的秤砣: {
    name: "小时候的秤砣",
    scale: 0.58,
    headScale: 1.42,
    bootScale: 1.55,
    colors: { ...SKIN, top: "#f4c95d", topShade: "#e2b54a", bottom: "#5d6177", bottomShade: "#4f5266", blush: "250,140,140" },
    hair: "bob",
    hairColor: "#2c2a30",
    shoes: "boots",
  } as CastSpec,
  /** 开场光里的女人：割断了脚绳，张着手、闭着眼笑 */
  光里的女人: {
    name: "光里的女人",
    scale: 0.98,
    colors: { ...SKIN, top: "#f6c7cf", topShade: "#e8b2bc", bottom: "#c7b3d8", bottomShade: "#b39fc6" },
    hair: "long",
    hairColor: "#3a3036",
    shoes: "bare",
  } as CastSpec,
};

/** 路人的鞋：黑皮鞋、白帆布鞋、棕皮鞋、藏蓝帆布鞋轮着穿 */
const PASSERBY_SHOES: ShoeSpec[] = [
  { color: "#3e3a3f", shade: "#322f33", style: "leather", sock: "#3a3741" },
  { color: "#f2efe8", shade: "#ddd8ce", sole: "#e8e2d6", style: "sneaker", sock: "#e9e6df" },
  { color: "#5a4636", shade: "#4b3a2d", style: "leather", sock: "#45414b" },
  { color: "#4e5a78", shade: "#424d68", style: "sneaker", sock: "#f2efe8" },
];

/** 路人（打伞走过、链上后来跑来的人）：几种衣服、发型、鞋轮着用 */
export function passerby(i: number): CastSpec {
  const tops = ["#9ccbd8", "#f2b8a2", "#c6d89a", "#e7c9e9", "#f4d58a", "#a9b8e8", "#e8a7a7", "#a8d8c0"];
  const coats = ["#6f8fb5", "#c47a6a", "#7aa56f", "#9a7ab8", "#c9a24f", "#5f7f9a", "#b56b80", "#5f9a88"];
  const hairs: HairStyle[] = ["short", "bob", "bun", "ponytail", "short", "long", "kid", "receding"];
  const hc = ["#2f2e33", "#4b3530", "#3a3036", "#5b3f33", "#2c2a30", "#6a5040", "#2f2e33", "#d8d6d0"];
  const k = ((i % 8) + 8) % 8;
  const j = ((i * 3 + 1) % 8 + 8) % 8;
  return {
    name: `路人${i}`,
    scale: 0.92 + ((i * 37) % 13) / 100,
    width: 1 + ((i * 17) % 9) / 60,
    colors: { ...(i % 3 ? SKIN : SKIN_WARM), top: tops[k], topShade: tops[k], bottom: "#4e5266", bottomShade: "#434657" },
    hair: hairs[j],
    hairColor: hc[j],
    coat: i % 2 ? { color: coats[(k + 3) % 8], shade: coats[(k + 3) % 8], long: (i * 13) % 40 } : undefined,
    shoes: PASSERBY_SHOES[((i * 5) % 4 + 4) % 4],
  };
}

const LOOKS = new WeakMap<CastSpec, Look>();
/** 这个人的外观（同一份配置只生成一次） */
export function lookOf(spec: CastSpec): Look {
  let l = LOOKS.get(spec);
  if (!l) LOOKS.set(spec, (l = castLook(spec)));
  return l;
}

/** 画一个配角：原点在两脚之间的地面，按这个人的身高缩放 */
export function drawCast(ctx: CanvasRenderingContext2D, spec: CastSpec, pose: PoseIn, opts: DrawOptions = {}) {
  ctx.save();
  ctx.scale(spec.scale, spec.scale);
  drawFigure(ctx, pose, lookOf(spec), opts);
  ctx.restore();
}

/** 配角的关节在画面里的位置（已按身高、体型缩放），用来对齐道具和别的人 */
export function castJoints(spec: CastSpec, pose: PoseIn) {
  const j = figureJoints(pose, lookOf(spec));
  const k = spec.scale;
  const w = spec.width ?? 1;
  const out = {} as typeof j;
  for (const key of Object.keys(j) as (keyof typeof j)[]) out[key] = [j[key][0] * k * w, j[key][1] * k];
  return out;
}

export { rowSpan, add };
