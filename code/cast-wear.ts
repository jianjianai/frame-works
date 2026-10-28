// 配角的衣服：外衣（几种版型都从秤砣外套的两片前襟改出来：收短、门襟合拢、换领子、换口袋）、上衣（领子、门襟、罗纹）、裤子（裤线、卷边、补丁）。
// 坐标：身体坐标（胸口的坐标系，领口 y ≈ −160、肩 y ≈ −145、腰 y ≈ −70、上衣下摆 y ≈ −6）。外衣的点在 size、long 换算之前（on 里换算），
// 和秤砣的外套一样跟着胸口走、呼吸。3/4 时胸口正中那条线从领口 x ≈ −11 斜到下摆 −24（mid），远的那半边压窄。
// 原来配角的外衣都是秤砣外套换个颜色（两个大方贴袋、一样的翻领），周磊的西装、阿满的夹克、妈妈们的外套站在一起分不出来。

import {
  type Ink,
  type P,
  type V2,
  Frame,
  bezierPolyline,
  clamp01,
  clockwisePoly,
  drawPart,
  fillShaded,
  lerp,
  lerpPts,
  marksByBox,
  matchOutlines,
  polylinePath,
  rowSpan,
  smoothPath,
} from "./rig";
import { type Rig, faceOf, fillBodyPart, legPaths, neckOutline, polyPath, strokeBodyPart, torsoPaths } from "./figure";
import { COAT_FRONT, COAT_SIDE } from "./chengtuo-costume";

// ——— 外衣 ———
/**
 * coat 秤砣那样的敞怀外套（大贴袋、翻领）；suit 西装（腰上一粒扣合拢成 V、缺角翻领、胸袋、带盖的口袋，下摆切圆角，露出衬衫袖口）；
 * jacket 工装夹克（短到胯、罗纹下摆和袖口、拉链拉到胸口、翻领、两个带盖的胸袋）；cardigan 开衫（门襟一条罗纹边和一排小扣子、罗纹下摆和袖口）；
 * workcoat 工装外套（立领、一排大扣子、带盖的大口袋和胸袋；hem 给了就是下摆缝铅的一圈格子）；hoodie 连帽外套（帽子搭在背后、拉链、抽绳、罗纹）；
 * trench 系腰带的长外套（大翻领、腰带在腰上系住、下摆散开）
 */
export type GarmentKind = "coat" | "suit" | "jacket" | "cardigan" | "workcoat" | "hoodie" | "trench";
export interface Garment {
  kind?: GarmentKind;
  color: string;
  shade: string;
  /** 整件放大（以领口为中心，大一号） */
  size?: number;
  /** 下摆往下多长（负数是收短） */
  long?: number;
  /** 下摆缝的一圈铅（小石头妈妈的外套） */
  hem?: string;
  /** 罗纹、门襟边、腰带的颜色（默认外衣的阴影色） */
  trim?: string;
  /** 扣子的颜色 */
  button?: string;
  /** 胸口绣一朵小花：花瓣的颜色（按线稿画的开衫，画在左片） */
  flower?: string;
  /** 袖子太长卷了几道（小孩穿大人的外套） */
  rolled?: boolean;
  /** 正面时两个肩关节各往外挪多少（不写是 4 × size；秤砣的外套是 6） */
  shoulderOut?: number;
  /** 按线稿画的外衣（周磊的西装 cast-wear-art.ts、千斤的妈妈的开衫 cast-qinmom-art.ts）：两片前襟（西装还有翻领、衬衫领、领带、腰线）按线稿画，不走版型；kind 只用来定袖口 */
  art?: GarmentArt;
}

/**
 * 手画的外衣：每一块是 [正面, 3/4] 两组逐点对应好的点（身体坐标），转身时按比例混合。
 * l / r 两片前襟（画面左 / 右，3/4 时 l 是远的那片），opening 衣襟中间敞开的那块（身子只画在它里面），
 * lapelL / lapelR 翻领，collarL / collarR 衬衫领，knot 领结，tie 领带，waist 腰线（衣襟中间露出来的衬衫下沿，往下是通用的裆和裤腿），
 * neck 领口的 V（两片衬衫领里侧之间、领结上面，露出后面的脖子）。
 * 翻领往下都可以没有：开衫只有两片前襟和敞开的那块，里面的上衣照通用的画（cast.ts：有衬衫领才按线稿画衬衫）。
 * edgeL / edgeR 两道门襟（下摆 → 脖子边）：总是描边。3/4 时远处那道门襟穿过远处那只胳膊的肩膀圈，前襟的描边在那里不描（肩膀和袖子连成一块），
 * 没有翻领盖着（开衫）就断掉一截
 */
export interface GarmentArt {
  l: [V2[], V2[]];
  r: [V2[], V2[]];
  opening: [V2[], V2[]];
  lapelL?: [V2[], V2[]];
  lapelR?: [V2[], V2[]];
  collarL?: [V2[], V2[]];
  collarR?: [V2[], V2[]];
  knot?: [V2[], V2[]];
  tie?: [V2[], V2[]];
  waist?: [V2[], V2[]];
  neck?: [V2[], V2[]];
  edgeL?: [V2[], V2[]];
  edgeR?: [V2[], V2[]];
}
/** 手画外衣的一块放到现在的姿势上（呼吸时胸口以上起伏，和身子一样） */
function artOn(rig: Rig): (p: V2) => V2 {
  const br = rig.pose.breath * 1.6;
  return ([x, y]) => rig.chest.p(x, y - br * clamp01(-y / 140));
}
const artAt = (rig: Rig, art: GarmentArt, k: keyof GarmentArt) => lerpPts(...artFor(rig, art)[k]!, rig.u);

/**
 * 身子镜像（朝右）时用的手画外衣：左右两片的正面对调（照参考图描的两片不完全对称，直接翻过去一过正面就错开一点），
 * 3/4 的形状还是各片自己的（远的那片还是远的）。两片的点要一一对应（右片第 i 个点镜像过来就是左片第 i 个点附近）才对调，
 * 不然照旧整个翻过去。敞开的那块：正面镜像、倒过来排（第 i 个点对上对面那个点）
 */
const ART_FLIP = new WeakMap<GarmentArt, GarmentArt>();
function artFor(rig: Rig, art: GarmentArt): GarmentArt {
  if (!rig.mir) return art;
  let f = ART_FLIP.get(art);
  if (!f) ART_FLIP.set(art, (f = flipArt(art)));
  return f;
}
function flipArt(a: GarmentArt): GarmentArt {
  const mx = (P: V2[]) => P.map(([x, y]): V2 => [-x, y]);
  const near = (P: V2[], Q: V2[]) => P.length === Q.length && P.reduce((s, p, i) => s + Math.hypot(p[0] - Q[i][0], p[1] - Q[i][1]), 0) / P.length < 4;
  const swap = (x?: [V2[], V2[]], y?: [V2[], V2[]]): [[V2[], V2[]] | undefined, [V2[], V2[]] | undefined] =>
    x && y && near(mx(y[0]), x[0]) ? [[mx(y[0]), x[1]], [mx(x[0]), y[1]]] : [x, y];
  const [l, r] = swap(a.l, a.r);
  const [edgeL, edgeR] = swap(a.edgeL, a.edgeR);
  const [lapelL, lapelR] = swap(a.lapelL, a.lapelR);
  const [collarL, collarR] = swap(a.collarL, a.collarR);
  const mo = [...mx(a.opening[0])].reverse();
  return { ...a, l: l!, r: r!, edgeL, edgeR, lapelL, lapelR, collarL, collarR, opening: near(mo, a.opening[0]) ? [mo, a.opening[1]] : a.opening };
}
/** 手画外衣里面衬衫露出来的地方（Look.torsoClip）：衣襟中间敞开的那块（西装底下不画） */
export function garmentShirtClip(rig: Rig, art: GarmentArt): Path2D[] {
  return [polylinePath(artAt(rig, art, "opening"), artOn(rig))];
}
/** 衣襟里从腰线往下涂裤子的颜色涂到哪：衬衫（通用的身子）下摆在 y ≈ −5，涂过它和它的描边，下面接上通用的裆和裤腿 */
const WAIST_BAND_BOTTOM = 4;

const CORNERS: V2[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
function pair(front: V2[], side: V2[], boxF: V2[], boxS: V2[] = boxF, perSeg = 12): [V2[], V2[]] {
  const a = clockwisePoly(bezierPolyline(front));
  const b = clockwisePoly(bezierPolyline(side));
  return matchOutlines(a, marksByBox(a, boxF), b, marksByBox(b, boxS), perSeg);
}
/** 前襟两片：l 正面画面左边那片（3/4 远的那片），r 右边那片。每片 48 个点：l 的 12–24、r 的 36–47 和 0 是门襟（上 → 下 / 下 → 上） */
const TURN = {
  l: pair(COAT_FRONT.l, COAT_SIDE.l, CORNERS),
  r: pair(COAT_FRONT.r, COAT_SIDE.r, CORNERS),
  pocketL: pair(COAT_FRONT.pocketL, COAT_SIDE.pocketL, CORNERS, CORNERS, 6),
  pocketR: pair(COAT_FRONT.pocketR, COAT_SIDE.pocketR, CORNERS, CORNERS, 6),
  lapelL: pair(COAT_FRONT.lapelL, COAT_SIDE.lapelL, [[1, 0], [1, 1], [0, 0.2]], [[1, 0], [0, 1], [0.4, 0.25]], 8),
  lapelR: pair(COAT_FRONT.lapelR, COAT_SIDE.lapelR, [[0, 0], [1, 0.25], [0, 1]], undefined, 8),
};
type Box = { x0: number; y0: number; w: number; h: number };
const bbox = (pts: V2[]): Box => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return { x0, y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 };
};
const BOX = {
  l: [bbox(TURN.l[0]), bbox(TURN.l[1])] as [Box, Box],
  r: [bbox(TURN.r[0]), bbox(TURN.r[1])] as [Box, Box],
};

/** 3/4 时胸口正中那条线（领口 −11、下摆 −24） */
export const midLine = (y: number, u: number) => u * lerp(-11, -24, clamp01((y + 160) / 150));
/** 贴在身子正面的东西（口袋、门襟、扣子）正面 → 现在：远的那半边压窄、近的那半边略宽 */
export function onTorso([x, y]: V2, u: number): V2 {
  const m = midLine(y, u);
  return [m + x * (x < 0 ? 1 - 0.3 * u : 1 + 0.15 * u), y];
}

interface Shape {
  l: V2[];
  r: V2[];
  /** 身体坐标（换算前）→ 画面 */
  on: (p: V2) => V2;
  u: number;
  /** 前襟上的点（正面换算前的坐标）→ 现在（按这片前襟的包围盒） */
  deco: (side: "l" | "r", p: V2) => V2;
  /** 门襟合拢的地方（V 的底）：左右两片的门襟在这里交叉，扣子在 x 上 */
  vee?: { y: number; x: number; l: V2; r: V2 };
}

/** 门襟：上端 top、V 的底 b、下摆角 bottom；中间两段用几个点连起来 */
function frontEdge(top: V2, b: V2, hemY: number, cut: number, side: 1 | -1, curve = 1.6): V2[] {
  const out: V2[] = [];
  const n1 = 6;
  for (let i = 0; i <= n1; i++) out.push([lerp(top[0], b[0], i / n1), lerp(top[1], b[1], i / n1)]);
  const n2 = 8;
  for (let i = 1; i <= n2; i++) {
    const k = i / n2;
    out.push([b[0] - side * cut * k ** curve, lerp(b[1], hemY, k)]);
  }
  return out;
}

/**
 * 只在一边的细节（一排扣子、扣眼、胸袋、绣花）画在哪一片上：身子镜像（朝右）时整个人是按朝左画好再翻过去的，
 * 这些细节要换到另一片上画，翻过去才还在她身上原来那一侧（不然一过正面就跳到另一边、朝右时也反了；用户 2026-10-28：
 * 「头发和衣服不能左右简单镜像，不然左右旋转时会跳动」）。side 是画的时候的那片（l 画面左），返回它在她身上算哪一片
 */
const own = (rig: Rig, side: "l" | "r"): "l" | "r" => (rig.mir ? (side === "l" ? "r" : "l") : side);

/** 外衣两片前襟放到现在的姿势上（按版型改过形状） */
export function garmentShape(rig: Rig, g: Garment): Shape {
  const { chest, u, pose } = rig;
  const size = g.size ?? 1;
  const long = g.long ?? 0;
  const br = pose.breath * 1.6;
  if (g.art) {
    const art = artFor(rig, g.art);
    return { l: lerpPts(...art.l, u), r: lerpPts(...art.r, u), on: artOn(rig), u, deco: (_side, p) => p };
  }
  const NECK_Y = -156;
  const on = ([x0, y0]: V2): V2 => {
    const x = x0 * size;
    const y = NECK_Y + (y0 - NECK_Y) * size + long * clamp01((y0 + 60) / 100);
    return chest.p(x, y - br * clamp01(-y / 140));
  };
  let l = lerpPts(...TURN.l, u);
  let r = lerpPts(...TURN.r, u);
  const boxes = { l: BOX.l, r: BOX.r };
  const deco = (side: "l" | "r", [x, y]: V2): V2 => {
    const [bf, bs] = boxes[side];
    const nx = (x - bf.x0) / bf.w;
    const ny = (y - bf.y0) / bf.h;
    return [lerp(bf.x0, bs.x0, u) + nx * lerp(bf.w, bs.w, u), lerp(bf.y0, bs.y0, u) + ny * lerp(bf.h, bs.h, u)];
  };
  const kind = g.kind ?? "coat";
  let vee: Shape["vee"];
  // 门襟合拢：V 的底在 vy（两片在正中线交叉 ov），往下切开 cut（西装的圆角）或者一直合着（夹克的拉链）
  const close = (vy: number, ov: number, cut: number, curve = 1.6) => {
    const c = midLine(vy, u);
    const hemL = l[24][1];
    const hemR = r[36][1];
    const bl: V2 = [c + ov, vy];
    const brr: V2 = [c - ov, vy];
    const edgeL = frontEdge(l[12], bl, hemL, cut, 1, curve);
    const edgeR = frontEdge(r[0], brr, hemR, cut, -1, curve);
    l = [...l.slice(0, 12), ...edgeL, ...l.slice(25)];
    r = [...r.slice(0, 36), ...edgeR.slice(1).reverse()];
    vee = { y: vy, x: c, l: bl, r: brr };
  };
  if (kind === "suit") close(-64, 3.5, 9);
  else if (kind === "jacket") close(-112, 1.2, 0);
  else if (kind === "trench") close(-60, 5, 13, 1.2);
  return { l, r, on, u, deco, vee };
}

/** 外衣的两片前襟（压在身上的手臂按它们裁描边：Look.bodyPieces） */
export function garmentPanels(rig: Rig, g: Garment): Path2D[] {
  const s = garmentShape(rig, g);
  return [polylinePath(s.l, s.on), polylinePath(s.r, s.on)];
}

/** 沿着门襟（top → b）的坐标：t 沿边、w 往外（离开正中线）→ 身体坐标 */
function alongEdge(top: V2, b: V2, out: 1 | -1) {
  const d: V2 = [b[0] - top[0], b[1] - top[1]];
  const L = Math.hypot(d[0], d[1]) || 1;
  const t: V2 = [d[0] / L, d[1] / L];
  // 往外的法线：右边那片朝 +x
  const n: V2 = [t[1] * out, -t[0] * out];
  if (n[0] * out < 0) {
    n[0] = -n[0];
    n[1] = -n[1];
  }
  return ([s, w]: V2): V2 => [top[0] + t[0] * s * L + n[0] * w, top[1] + t[1] * s * L + n[1] * w];
}

/** 缺角翻领（西装、长外套）：领子从领口绕上去，缺口在 0.2 左右，驳头往下收到扣子 */
const NOTCH_LAPEL: [number, number, number?][] = [
  [0, 0, 1], [-0.07, 3], [-0.07, 10], [0.0, 15], [0.13, 15, 1], [0.17, 9, 1], [0.21, 17, 1], [0.3, 19], [0.55, 12], [0.8, 5], [1, 0, 1],
];
/** 工装夹克的翻领：领尖压在胸口 */
const SHIRT_COLLAR: [number, number, number?][] = [[0, 0, 1], [-0.1, 2, 1], [-0.08, 12], [0.06, 17], [0.5, 13, 1], [0.34, 5], [0.22, 0]];

const BUTTON = "#3a3438";

function dot(ctx: CanvasRenderingContext2D, [x, y]: V2, r: number, fill: string, ink: Ink, holes = false) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = ink.line;
  ctx.lineWidth = ink.lw * 0.4;
  ctx.stroke();
  if (holes && r > 2.5) {
    ctx.fillStyle = ink.line;
    for (const [dx, dy] of [[-0.3, -0.3], [0.3, 0.3]]) {
      ctx.beginPath();
      ctx.arc(x + dx * r, y + dy * r, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function line(ctx: CanvasRenderingContext2D, pts: V2[], color: string, lw: number, dash?: number[]) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  if (dash) ctx.setLineDash([]);
}

/** 一条罗纹带：在身体坐标 y0..y1 之间（换算前），裁在 clip 里：填色、上沿一道线、竖着的细纹 */
function ribBand(ctx: CanvasRenderingContext2D, clip: Path2D, on: (p: V2) => V2, y0: number, y1: number, color: string, ink: Ink, fine: boolean, x0 = -120, x1 = 120) {
  ctx.save();
  ctx.clip(clip);
  const band = polyPath([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], on);
  ctx.fillStyle = color;
  ctx.fill(band);
  if (fine) {
    ctx.strokeStyle = "rgba(30,25,35,0.22)";
    ctx.lineWidth = ink.lw * 0.3;
    ctx.beginPath();
    // 竖纹从中线往两边排（左右对称：镜像过来还在原来的位置）
    for (let x = Math.ceil(x0 / 4.2) * 4.2; x <= x1; x += 4.2) {
      const a = on([x, y0 + 2]);
      const b = on([x, y1]);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
    }
    ctx.stroke();
  }
  line(ctx, [on([x0, y0]), on([x1, y0])], ink.line, ink.lw * 0.55);
  ctx.restore();
}

/** 画面上每个单位多少像素：太小时细节（罗纹、针脚、扣眼）不画 */
function ppu(ctx: CanvasRenderingContext2D) {
  const m = ctx.getTransform();
  return Math.hypot(m.a, m.b);
}

/** 外衣（Look.overTorso 里画在上衣后面）：两片前襟和领子、口袋、扣子、罗纹 */
export function drawGarment(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink, sides: ("L" | "R")[], g: Garment) {
  const s = garmentShape(rig, g);
  if (g.art) {
    drawArtGarment(ctx, rig, ink, sides, g, g.art, s);
    return;
  }
  const kind = g.kind ?? "coat";
  const { on, deco, u } = s;
  const lw = ink.lw * 0.8;
  const fine = ppu(ctx) * 600 > 260;
  const trim = g.trim ?? g.shade;
  const button = g.button ?? BUTTON;
  const panels = { l: polylinePath(s.l, on), r: polylinePath(s.r, on) };
  const drawPanel = (side: "l" | "r") => {
    const panel = panels[side];
    fillBodyPart(ctx, rig, panel, g.color, g.shade, ink, sides);
    ctx.save();
    ctx.clip(panel);
    const pocket = side === "l" ? TURN.pocketL : TURN.pocketR;
    const pk = lerpPts(...pocket, u);
    const pb = bbox(pk);
    const pocketBox = (fx0: number, fy0: number, fx1: number, fy1: number): V2[] => [
      [pb.x0 + pb.w * fx0, pb.y0 + pb.h * fy0],
      [pb.x0 + pb.w * fx1, pb.y0 + pb.h * fy0],
      [pb.x0 + pb.w * fx1, pb.y0 + pb.h * fy1],
      [pb.x0 + pb.w * fx0, pb.y0 + pb.h * fy1],
    ];
    const flap = (pts: V2[], btn: boolean) => {
      // 口袋盖：上沿两角方、下沿两角圆一点
      const [a, b, c, d] = pts.map(on);
      const p = new Path2D();
      p.moveTo(a[0], a[1]);
      p.lineTo(b[0], b[1]);
      p.lineTo(c[0], c[1]);
      p.lineTo(d[0], d[1]);
      p.closePath();
      drawPart(ctx, p, g.color, g.shade, ink, lw * 0.8);
      if (btn) dot(ctx, [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2 - 2.2], 2.4, button, ink);
    };
    if (kind === "coat") {
      // 秤砣那件外套的版型：大贴袋、翻领
      drawPart(ctx, polylinePath(pk, on), g.color, g.shade, ink, lw);
      drawPart(ctx, polylinePath(lerpPts(...(side === "l" ? TURN.lapelL : TURN.lapelR), u), on), g.color, g.shade, ink, lw);
    } else if (kind === "suit") {
      flap(pocketBox(0.02, 0.0, 1.0, 0.24), false);
      if (own(rig, side) === "r") {
        // 胸袋：左胸一道斜的开口（镜像时画在另一片上、左右反过来）
        const k = side === "r" ? 1 : -1;
        const a = deco(side, [k * 25, -112]);
        const b = deco(side, [k * 42, -115]);
        const p = polyPath([a, b, [b[0], b[1] + 4.2], [a[0], a[1] + 4.2]], on);
        drawPart(ctx, p, g.color, g.shade, ink, lw * 0.7);
      }
    } else if (kind === "jacket") {
      const side0 = side === "l" ? 1 : -1;
      const a = deco(side, [side0 * -44, -116]);
      const b = deco(side, [side0 * -24, -116]);
      const box: V2[] = [a, b, [b[0], b[1] + 21], [a[0], a[1] + 21]];
      drawPart(ctx, polyPath(box, on), g.color, g.shade, ink, lw * 0.8);
      flap([a, b, [b[0], b[1] + 8], [a[0], a[1] + 8]], true);
    } else if (kind === "workcoat") {
      drawPart(ctx, polylinePath(pk, on), g.color, g.shade, ink, lw);
      flap(pocketBox(-0.04, -0.06, 1.04, 0.24), true);
      if (own(rig, side) === "r") {
        const k = side === "r" ? 1 : -1;
        const a = deco(side, [k * 24, -118]);
        const b = deco(side, [k * 42, -118]);
        const box: V2[] = [a, b, [b[0], b[1] + 19], [a[0], a[1] + 19]];
        drawPart(ctx, polyPath(box, on), g.color, g.shade, ink, lw * 0.8);
        flap([a, b, [b[0], b[1] + 7], [a[0], a[1] + 7]], true);
      }
    } else if (kind === "cardigan") {
      // 小小的贴袋，袋口一道罗纹
      const box = pocketBox(0.1, 0.3, 0.92, 1.0);
      drawPart(ctx, polyPath(box, on), g.color, g.shade, ink, lw * 0.7);
      ribBand(ctx, polyPath(box, on), on, box[0][1], box[0][1] + 5, trim, ink, fine);
    } else if (kind === "hoodie") {
      const box = pocketBox(0.12, 0.12, 0.95, 0.85);
      // 斜插袋：一道斜的袋口
      const a = on(box[side === "l" ? 1 : 0]);
      const b = on(box[side === "l" ? 3 : 2]);
      line(ctx, [a, b], ink.line, lw * 0.75);
    }
    ctx.restore();
  };
  // 远的那片先画，近的那片（门襟压在上面）后画
  drawPanel("l");
  strokeBodyPart(ctx, rig, panels.l, ink, sides);
  drawPanel("r");
  strokeBodyPart(ctx, rig, panels.r, ink, sides);

  // 罗纹下摆（夹克、开衫、连帽外套）、缝铅的下摆（工装外套）
  const hemY = (side: "l" | "r") => (side === "l" ? s.l : s.r).reduce((m, p) => Math.max(m, p[1]), -1e9);
  if (kind === "jacket" || kind === "cardigan" || kind === "hoodie") {
    const h = kind === "jacket" ? 13 : 9;
    for (const side of ["l", "r"] as const) ribBand(ctx, panels[side], on, hemY(side) - h, hemY(side) + 30, trim, ink, fine);
  }
  if (g.hem) for (const side of ["l", "r"] as const) leadHem(ctx, panels[side], on, hemY(side), g.hem, ink, fine);

  // 门襟、领子
  const V = s.vee;
  if (kind === "suit" || kind === "trench") {
    if (V) {
      const big = kind === "trench" ? 1.3 : 1;
      for (const [side, top, b, out] of [
        ["l", s.l[12], V.l, -1],
        ["r", s.r[0], V.r, 1],
      ] as const) {
        const m = alongEdge(top, b, out);
        const pts = NOTCH_LAPEL.map(([t, w, c]) => [...on(m([t, w * big])), ...(c ? [1] : [])] as P);
        const lapel = smoothPath(pts);
        ctx.save();
        ctx.clip(panels[side]);
        drawPart(ctx, lapel, g.color, g.shade, ink, lw * 0.8);
        ctx.restore();
      }
      if (kind === "suit") {
        // 扣子：一粒扣在 V 的底，下面一粒没扣
        dot(ctx, on([V.x, V.y + 1]), 3, button, ink, true);
        const k = 26;
        const d = 9 * (k / 64) ** 1.6 + 3.5;
        dot(ctx, on([rig.mir ? V.l[0] - d : V.r[0] + d, V.y + k]), 3, button, ink, true);
      } else {
        // 双排扣（腰带上面两对），腰带系着、带扣在正中，垂下来一截
        for (const y of [-92, -74]) for (const dx of [-9, 9]) dot(ctx, on([V.x + dx, y]), 2.6, button, ink, true);
        trenchBelt(ctx, rig, s, g, ink);
      }
    }
  } else if (kind === "jacket" && V) {
    // 拉链：从 V 的底拉到下摆，拉头一小块
    const hem = Math.max(hemY("l"), hemY("r"));
    line(ctx, [on([V.x, V.y]), on([V.x, hem])], ink.line, lw * 0.7);
    if (fine) line(ctx, [on([V.x - 1.4, V.y + 4]), on([V.x - 1.4, hem - 13])], "rgba(30,25,35,0.35)", ink.lw * 0.5, [1.2, 1.8]);
    const zp = on([V.x + 0.5, V.y + 7]);
    ctx.fillStyle = "#c9c4bb";
    ctx.strokeStyle = ink.line;
    ctx.lineWidth = ink.lw * 0.4;
    ctx.beginPath();
    ctx.rect(zp[0] - 2.2, zp[1] - 3.5, 4.4, 8.5);
    ctx.fill();
    ctx.stroke();
    for (const [top, b, out] of [
      [s.l[12], V.l, -1],
      [s.r[0], V.r, 1],
    ] as const) {
      const m = alongEdge(top, b, out);
      const pts = SHIRT_COLLAR.map(([t, w, c]) => [...on(m([t, w])), ...(c ? [1] : [])] as P);
      drawPart(ctx, smoothPath(pts), g.color, g.shade, ink, lw * 0.85);
    }
  } else if (kind === "cardigan") {
    // 门襟一条罗纹边，右片上一排小扣子
    for (const [side, edge] of [
      ["l", s.l.slice(12, 25)],
      ["r", s.r.slice(36).concat([s.r[0]]).reverse()],
    ] as const) {
      const out = side === "l" ? -1 : 1;
      const band: V2[] = [...edge, ...edge.map(([x, y]) => [x + out * 6.5, y] as V2).reverse()];
      const bp = polyPath(band, on);
      ctx.save();
      ctx.clip(panels[side]);
      drawPart(ctx, bp, trim, null, ink, lw * 0.6);
      ctx.restore();
      if (own(rig, side) === "r") for (const y of [-128, -100, -72, -44]) {
        const e = edge.reduce((a, p) => (Math.abs(p[1] - y) < Math.abs(a[1] - y) ? p : a), edge[0]);
        dot(ctx, on([e[0] + out * 3.3, y]), 2.2, g.button ?? "#f4efe6", ink);
      }
    }
  } else if (kind === "workcoat") {
    // 立领：贴着脖子立起来一圈（两头在领口前面，绕到脖子后面），领口一道明线
    standCollar(ctx, rig, ink, g.color, g.shade, lw);
    // 扣子在她的左片（l）门襟上；镜像时画在 r 那片上
    const onL = own(rig, "l") === "l";
    const edge = onL ? s.l.slice(12, 25) : s.r.slice(36).concat([s.r[0]]);
    for (const y of [-130, -96, -62, -28]) {
      const e = edge.reduce((a, p) => (Math.abs(p[1] - y) < Math.abs(a[1] - y) ? p : a), edge[0]);
      dot(ctx, on([e[0] + (onL ? -5 : 5), y]), 3.4, g.button ?? "#5a4a40", ink, true);
    }
  } else if (kind === "hoodie") {
    // 拉链齿：两片门襟各一道
    if (fine) for (const edge of [s.l.slice(12, 24), s.r.slice(37)]) line(ctx, edge.map(on), "rgba(30,25,35,0.45)", ink.lw * 0.6, [1.4, 1.6]);
  }
}

/** 按线稿画的开衫门襟那条罗纹边有多宽（身体坐标） */
const ART_BAND = 6;
/** 折线在 y 那一行的 x（没有交点时取最近的点） */
function xAt(pts: V2[], y: number): number {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (y0 !== y1 && (y0 - y) * (y1 - y) <= 0) return x0 + ((y - y0) / (y1 - y0)) * (x1 - x0);
  }
  return pts.reduce((a, p) => (Math.abs(p[1] - y) < Math.abs(a[1] - y) ? p : a), pts[0])[0];
}
/**
 * 按线稿画的工装外套（kind workcoat，小石头的妈妈：用户 2026-10-28 生成的参考图）：右片门襟边上一排五颗深色大扣子，左片对应五道扣眼短线，
 * 两片各一个斜插袋（袋口靠门襟那头高、外侧低），下摆一圈深色的边（hem：缝着铅）。位置按门襟的长度（领口 → 下摆）比例摆，离门襟的距离往前襟里面量
 */
function workcoatDetails(ctx: CanvasRenderingContext2D, ink: Ink, g: Garment, s: Shape, panel: Path2D, buttons: boolean, e: V2[], inward: number) {
  const ys = e.map((p) => p[1]);
  const top = Math.min(...ys);
  const hem = Math.max(...ys);
  const H = hem - top;
  const at = (k: number) => top + H * k;
  const lw = ink.lw * 0.8;
  ctx.save();
  ctx.clip(panel);
  if (g.hem) ribBand(ctx, panel, s.on, hem - 10, hem + 30, g.hem, ink, false);
  // 斜插袋：袋口一道斜线，外面一道细线（袋片）
  const y0 = hem - 0.3 * H;
  const y1 = hem - 0.185 * H;
  const p0: V2 = [xAt(e, y0) + inward * 32, y0];
  const p1: V2 = [xAt(e, y1) + inward * 45, y1];
  line(ctx, [s.on(p0), s.on(p1)], ink.line, lw * 0.75);
  line(ctx, [s.on([p0[0], p0[1] + 2.5]), s.on([p1[0] - inward * 3, p1[1] + 4])], ink.line, lw * 0.35);
  ctx.restore();
  for (let i = 0; i < 5; i++) {
    const y = lerp(at(0.155), hem - 0.12 * H, i / 4);
    if (buttons) dot(ctx, s.on([xAt(e, y) + inward * 10.5, y]), 4.4, g.button ?? "#5a4a40", ink);
    else line(ctx, [s.on([xAt(e, y) + inward * 3.5, y]), s.on([xAt(e, y) + inward * 11.5, y])], ink.line, lw * 0.6);
  }
}

/** 绣的一朵小花：五片花瓣、花心，右下一片叶子（开衫的胸口） */
function embroideredFlower(ctx: CanvasRenderingContext2D, [x, y]: V2, r: number, petal: string, ink: Ink) {
  ctx.strokeStyle = ink.line;
  ctx.lineWidth = ink.lw * 0.3;
  ctx.fillStyle = "#86a96f";
  ctx.beginPath();
  ctx.ellipse(x + r * 0.95, y + r * 0.95, r * 0.85, r * 0.4, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = petal;
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#f0c75e";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/**
 * 手画的外衣：两片前襟（远的先画），翻领裁在前襟里面。
 * 开衫（kind cardigan）：门襟一条罗纹边（trim），给了 button 右片的边上一排小扣子，给了 flower 左片胸口绣一朵小花
 * （用户 2026-10-28：「千金妈妈衣服加一点装饰，好看点」；竖着的边和扣子显瘦，不加横的罗纹下摆和口袋）
 */
function drawArtGarment(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink, sides: ("L" | "R")[], g: Garment, art: GarmentArt, s: Shape) {
  const lw = ink.lw * 0.8;
  for (const [side, lapel, edge] of [
    ["l", "lapelL", "edgeL"],
    ["r", "lapelR", "edgeR"],
  ] as const) {
    const panel = polylinePath(s[side], s.on);
    fillBodyPart(ctx, rig, panel, g.color, g.shade, ink, sides);
    if (art[lapel]) {
      ctx.save();
      ctx.clip(panel);
      drawPart(ctx, polylinePath(artAt(rig, art, lapel), s.on), g.color, g.shade, ink, lw * 0.8);
      ctx.restore();
    }
    strokeBodyPart(ctx, rig, panel, ink, sides);
    if (!art[edge]) continue;
    const e = artAt(rig, art, edge);
    // 往前襟里面（离开敞开的那块）
    const inward = side === "l" ? -1 : 1;
    const cardigan = g.kind === "cardigan";
    if (cardigan) {
      const band: V2[] = [...e, ...e.map(([x, y]) => [x + inward * ART_BAND, y] as V2).reverse()];
      ctx.save();
      ctx.clip(panel);
      drawPart(ctx, polyPath(band, s.on), g.trim ?? g.shade, null, ink, lw * 0.6);
      ctx.restore();
    }
    line(ctx, e.map(s.on), ink.line, ink.lw);
    if (g.kind === "workcoat") workcoatDetails(ctx, ink, g, s, panel, own(rig, side) === "r", e, inward);
    if (cardigan && own(rig, side) === "r" && g.button)
      for (const y of [-124, -90, -56, -22, 12]) dot(ctx, s.on([xAt(e, y) + (inward * ART_BAND) / 2, y]), 2.2, g.button, ink);
    if (cardigan && own(rig, side) === "l" && g.flower) {
      const y = -88;
      ctx.save();
      ctx.clip(panel);
      embroideredFlower(ctx, s.on([xAt(e, y) + inward * (ART_BAND + lerp(7, 6, s.u)), y]), 4, g.flower, ink);
      ctx.restore();
    }
  }
  // 工装外套的立领：贴着脖子立起来一圈（线稿只描到肩线，立领和版型的工装外套一样画）
  if (g.kind === "workcoat") standCollar(ctx, rig, ink, g.color, g.shade, lw);
}

/**
 * 手画外衣里面露出来的东西（画在外衣前面）：领口 V 里的脖子、腰线（衬衫的下沿）、领带（斜纹）、领结、衬衫领。
 * shirt / skin：衬衫、皮肤的 [颜色, 阴影色]
 */
export function drawArtShirt(
  ctx: CanvasRenderingContext2D,
  rig: Rig,
  ink: Ink,
  art: GarmentArt,
  shirt: [string, string],
  tie: string | undefined,
  skin: [string, string],
  pants: string,
) {
  const on = artOn(rig);
  const lw = ink.lw * 0.8;
  // 领口的 V 里露出后面的脖子：通用的脖子在这块里再画一遍（盖住身子领口那道线；和通用圆领挖掉领口、露出后面的脖子一样）
  if (art.neck) {
    ctx.save();
    ctx.clip(polylinePath(artAt(rig, art, "neck"), on));
    drawPart(ctx, torsoPaths(rig).neck, skin[0], skin[1], ink, ink.lw * 0.6);
    ctx.restore();
  }
  // 腰线：衬衫掩在裤子里的下沿。衬衫和秤砣的毛衣一样画到胯（裆和大腿的上沿藏在它下面），衣襟里从腰线往下涂裤子的颜色，
  // 涂过衬衫下摆和它的描边，下面接上通用的裆和裤腿（只涂不描，和裤子同色）
  if (art.waist) {
    const w = artAt(rig, art, "waist");
    const [w0, w1] = [w[0], w[w.length - 1]];
    const band: V2[] = [[w0[0] - 60, w0[1]], ...w, [w1[0] + 60, w1[1]], [w1[0] + 60, WAIST_BAND_BOTTOM], [w0[0] - 60, WAIST_BAND_BOTTOM]];
    ctx.save();
    ctx.clip(polylinePath(artAt(rig, art, "opening"), on));
    ctx.fillStyle = pants;
    ctx.fill(polylinePath(band, on));
    ctx.restore();
    line(ctx, w.map(on), ink.line, lw * 0.7);
  }
  if (tie && art.tie) {
    const pts = artAt(rig, art, "tie");
    const blade = polylinePath(pts, on);
    drawPart(ctx, blade, tie, null, ink, lw * 0.75);
    if (ppu(ctx) * 600 > 260) {
      const ys = pts.map((p) => p[1]);
      const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
      ctx.save();
      ctx.clip(blade);
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = ink.lw * 0.9;
      for (const f of [0.18, 0.38, 0.58, 0.78]) {
        const y = lerp(y0, y1, f);
        const span = rowSpan(pts, y);
        if (!span) continue;
        const a = on([span[0] - 4, y + 6]);
        const b = on([span[1] + 4, y - 6]);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  for (const k of ["collarL", "collarR"] as const) if (art[k]) drawPart(ctx, polylinePath(artAt(rig, art, k), on), shirt[0], shirt[1], ink, lw * 0.75);
  // 领结压在衬衫领上：3/4 时左边的领尖正好压着领结左上角，领子后画就缺一个角（用户 2026-10-27）
  if (tie && art.knot) drawPart(ctx, polylinePath(artAt(rig, art, "knot"), on), tie, null, ink, lw * 0.75);
}

/** 下摆缝了一圈铅：深色的一圈，针脚分成一格一格，每格里鼓着一块 */
function leadHem(ctx: CanvasRenderingContext2D, clip: Path2D, on: (p: V2) => V2, hemY: number, color: string, ink: Ink, fine: boolean) {
  const y0 = hemY - 17;
  ctx.save();
  ctx.clip(clip);
  ctx.fillStyle = color;
  ctx.fill(polyPath([[-160, y0], [160, y0], [160, hemY + 30], [-160, hemY + 30]], on));
  line(ctx, [on([-160, y0]), on([160, y0])], ink.line, ink.lw * 0.5);
  if (fine) {
    // 每格里一块铅鼓出来（亮一点的一团），格子之间一道针脚（一格一格合成一条路径画）
    const lumps = new Path2D();
    const stitch = new Path2D();
    for (let x = -150; x <= 150; x += 13) {
      const c = on([x + 6.5, y0 + 8.5]);
      lumps.moveTo(c[0] + 4.2, c[1]);
      lumps.ellipse(c[0], c[1], 4.2, 5, 0, 0, Math.PI * 2);
      const a = on([x, y0 + 2.5]);
      const b = on([x, hemY - 1]);
      stitch.moveTo(a[0], a[1]);
      stitch.lineTo(b[0], b[1]);
    }
    const a = on([-160, y0 + 2.6]);
    const b = on([160, y0 + 2.6]);
    stitch.moveTo(a[0], a[1]);
    stitch.lineTo(b[0], b[1]);
    ctx.fillStyle = "rgba(255,240,225,0.16)";
    ctx.fill(lumps);
    ctx.strokeStyle = "rgba(250,235,215,0.55)";
    ctx.lineWidth = ink.lw * 0.32;
    ctx.setLineDash([1.6, 1.6]);
    ctx.stroke(stitch);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

/** 长外套的腰带：在 V 的底那一圈，正中打个结、两头垂下来 */
function trenchBelt(ctx: CanvasRenderingContext2D, rig: Rig, s: Shape, g: Garment, ink: Ink) {
  const V = s.vee!;
  const trim = g.trim ?? g.shade;
  const { on } = s;
  const y = V.y;
  for (const side of ["l", "r"] as const) {
    ctx.save();
    ctx.clip(polylinePath(side === "l" ? s.l : s.r, on));
    const band = polyPath([[-160, y - 6], [160, y - 6], [160, y + 6], [-160, y + 6]], on);
    drawPart(ctx, band, trim, null, ink, ink.lw * 0.55);
    ctx.restore();
  }
  // 带扣，穿过去的那头垂下来一截
  const sway = 0.06 * Math.sin(rig.pose.t * 2.1);
  const k = new Frame(...on([V.x, y]), rig.chest.a);
  const f = new Frame(...k.p(6, 3), k.a - 0.08 + sway);
  drawPart(ctx, polyPath([[-3.4, 0], [3.4, 0], [3.6, 22], [0, 26], [-3.6, 22]], ([x, yy]) => f.p(x, yy)), trim, null, ink, ink.lw * 0.55);
  const buckle = polyPath([[-6, -7.5], [6, -7.5], [6, 7.5], [-6, 7.5]], ([x, yy]) => k.p(x, yy));
  drawPart(ctx, buckle, "#c9b48a", null, ink, ink.lw * 0.55);
  drawPart(ctx, polyPath([[-3, -4.5], [3, -4.5], [3, 4.5], [-3, 4.5]], ([x, yy]) => k.p(x, yy)), trim, null, ink, ink.lw * 0.45);
}

/** 立领（工装外套）：贴着脖子立起来的一圈，两头在领口前面，后面那半圈从脖子两边露出来 */
function standCollar(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink, color: string, shade: string, lw: number) {
  const { chest, u, pose } = rig;
  const br = pose.breath * 1.6;
  const raw = ([x, y]: V2): V2 => chest.p(x, y - br * clamp01(-y / 140));
  const neckC = u * -10;
  const nk = ([x, y]: V2): V2 => raw([neckC + x * (x < 0 ? 1 - 0.12 * u : 1 + 0.1 * u), y]);
  for (const s of [-1, 1]) {
    const p = smoothPath(([[s * 9, -158, 1], [s * 12, -166], [s * 12, -175, 1], [s * 19, -174], [s * 24, -168, 1], [s * 27, -157, 1]] as P[]).map(([x, y, c]) => [...nk([x, y]), ...(c ? [c] : [])] as P));
    drawPart(ctx, p, color, shade, ink, lw * 0.8);
    line(ctx, [nk([s * 12.5, -170]), nk([s * 23, -166])], "rgba(30,25,35,0.35)", ink.lw * 0.35, [1.4, 1.6]);
  }
}

// ——— 袖子 ———
/** 前臂填色：袖子的颜色，袖口那一截（前臂局部 y from..to，肘为原点、+y 往手腕）另一种颜色（衬衫袖口、罗纹、卷起来的袖子） */
export function fillSleeve(
  ctx: CanvasRenderingContext2D,
  rig: Rig,
  side: "L" | "R",
  lower: Path2D,
  ink: Ink,
  base: [string, string],
  cuff?: { from: number; to: number; color: string; ribs?: boolean; wide?: number },
) {
  fillShaded(ctx, lower, base[0], base[1], ink);
  if (!cuff) return;
  const limb = rig.arms[side];
  const f = new Frame(limb.mid[0], limb.mid[1], limb.a2);
  const map = ([x, y]: V2) => f.p(x, y);
  const band = polyPath([[-40, cuff.from], [40, cuff.from], [40, cuff.to], [-40, cuff.to]], map);
  if (cuff.wide) {
    // 卷起来的袖子：比袖子宽一圈的几道翻边，画在前臂上面（不裁）
    const w = cuff.wide;
    for (let i = 0; i < 2; i++) {
      const y0 = cuff.from + i * ((cuff.to - cuff.from) / 2);
      const y1 = y0 + (cuff.to - cuff.from) / 2 + 1;
      const p = smoothPath(
        ([[-w, y0, 1], [0, y0 - 1.5], [w, y0, 1], [w + 0.6, y1, 1], [0, y1 + 1.2], [-w - 0.6, y1, 1]] as P[]).map(([x, y, c]) => [...map([x, y]), ...(c ? [c] : [])] as P),
      );
      drawPart(ctx, p, cuff.color, base[1], ink, ink.lw * 0.7);
    }
    return;
  }
  ctx.save();
  ctx.clip(lower);
  ctx.fillStyle = cuff.color;
  ctx.fill(band);
  line(ctx, [map([-40, cuff.from]), map([40, cuff.from])], ink.line, ink.lw * 0.5);
  if (cuff.ribs && ppu(ctx) * 600 > 260) {
    ctx.strokeStyle = "rgba(30,25,35,0.22)";
    ctx.lineWidth = ink.lw * 0.3;
    ctx.beginPath();
    for (let x = -24; x <= 24; x += 4) {
      const a = map([x, cuff.from + 1.5]);
      const b = map([x, cuff.to]);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** 每种外衣的袖口 */
export function garmentCuff(g: Garment): { from: number; to: number; color: string; ribs?: boolean; wide?: number } | undefined {
  const kind = g.kind ?? "coat";
  if (g.rolled) return { from: 50, to: 66, color: g.color, wide: 19 };
  if (kind === "suit") return { from: 63, to: 75, color: "#f4f2ec" };
  if (kind === "jacket" || kind === "cardigan" || kind === "hoodie") return { from: 60, to: 75, color: g.trim ?? g.shade, ribs: true };
  return undefined;
}

// ——— 上衣 ———
/**
 * crew 圆领（基础模型的圆领）；sweater 毛衣（粗罗纹领、罗纹下摆和袖口；under 给了就是领口露出一圈衬衫领）；shirt 衬衫（尖领、门襟一排扣子）；
 * vneck V 领毛衣套衬衫（老钟）；tee T 恤（stripes 横条纹）；hoodie 连帽衫（帽子搭在背后、抽绳、袋鼠兜、罗纹）；
 * duijin 对襟盘扣褂子（老太太：立领、正中一排盘扣、滚边）；peter 小圆领（小女孩）；polo 校服（立领、拉链、袖子两道白杠）
 */
export type TopKind = "crew" | "sweater" | "shirt" | "vneck" | "tee" | "hoodie" | "duijin" | "peter" | "polo";
export interface Top {
  kind: TopKind;
  /** 罗纹、滚边、条纹、袖子白杠的颜色 */
  trim?: string;
  /** 毛衣里面露出来的衬衫领、V 领里的衬衫 */
  under?: string;
  /** T 恤的横条纹 */
  stripes?: string;
  /** 扣子 */
  button?: string;
  /** 毛衣是高领：领子是一个筒，从领口包住脖子到下巴底下（小石头的妈妈） */
  turtle?: boolean;
}

/** 基础模型画不画圆领（这几种上衣自己画领子） */
export const topHasOwnCollar = (t?: Top) => !!t && t.kind !== "crew" && t.kind !== "tee" && (t.kind !== "sweater" || !!t.turtle);

/**
 * 高领毛衣的领子（用户 2026-10-28：小石头的妈妈「脖子这里没画对」——参考图里米白的高领把脖子整个包住、到下巴底下，原来是圆领，露着脖子）：
 * 脖子的轮廓每一行往两边放宽一圈，从领口往上一直到脖子顶上（藏在头后面，头压住上沿）；底边不描，和毛衣接成一片；
 * 下巴底下一道翻折线。画在外衣前面那层之前，外衣的立领压在它两边
 */
function turtleneck(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink, colors: { top: string; topShade: string }, lw: number) {
  const { pts, on } = neckOutline(rig);
  const PAD = 3.5;
  // 填到脖子轮廓的底（约 −147）下面，盖住脖子下沿那道描边；两边的线描到领口（再往下被外衣盖住）
  const FILL_BOTTOM = -140;
  const LINE_BOTTOM = -150;
  const top = Math.min(...pts.map((p) => p[1])) + 1;
  const rows = (y0: number, y1: number) => {
    const left: V2[] = [];
    const right: V2[] = [];
    const n = Math.max(2, Math.ceil((y1 - y0) / 1.5));
    for (let i = 0; i <= n; i++) {
      const y = lerp(y0, y1, i / n);
      const sp = rowSpan(pts, Math.min(y, -150));
      if (!sp) continue;
      left.push([sp[0] - PAD, y]);
      right.push([sp[1] + PAD, y]);
    }
    return [...left.reverse(), ...right];
  };
  const fill = rows(top, FILL_BOTTOM);
  if (fill.length < 4) return;
  const tube = polyPath(fill, on);
  // 不加右下那道阴影：筒的底边和毛衣接着，阴影会在领口横出一道带子
  fillShaded(ctx, tube, colors.top, null, ink);
  // 两边和上沿描边（底边和毛衣接着，不描）
  line(ctx, rows(top, LINE_BOTTOM).map(on), ink.line, lw * 0.8);
  // 翻折线：下巴往下三分之一（下巴按这个人的脸算：配角描的脸下巴高低不一样；低头抬头时跟着走），两头稍往上弯
  const face = faceOf(rig);
  const chin = rig.head.p(0, Math.max(...face.map((p) => p[1])));
  const [dx, dy] = [chin[0] - rig.chest.x, chin[1] - rig.chest.y];
  const chinY = -dx * Math.sin(rig.chest.a) + dy * Math.cos(rig.chest.a);
  const fy = Math.min(-152, chinY + (LINE_BOTTOM - chinY) / 3);
  const sp = rowSpan(pts, fy);
  if (sp) {
    const [a, b] = [sp[0] - PAD + 1, sp[1] + PAD - 1];
    const fold: V2[] = Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      return [lerp(a, b, t), fy + 2 * Math.sin(Math.PI * t)];
    });
    ctx.save();
    ctx.clip(tube);
    line(ctx, fold.map(on), ink.line, lw * 0.55);
    ctx.restore();
  }
}

/** 上衣的细节（Look.overTorso 里先画，外衣盖在上面） */
export function drawTop(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink, top: Top, colors: { top: string; topShade: string }) {
  const { chest, u, pose } = rig;
  const br = pose.breath * 1.6;
  const raw = ([x, y]: V2): V2 => chest.p(x, y - br * clamp01(-y / 140));
  const on = (p: V2) => raw(onTorso(p, u));
  const { torso } = torsoPaths(rig);
  const fine = ppu(ctx) * 600 > 260;
  const lw = ink.lw * 0.75;
  const trim = top.trim ?? colors.topShade;
  const neckC = u * -10;
  // 领口贴着脖子的那一圈：正面 ±11.5，3/4 往左挪、远的那边压窄
  const nk = ([x, y]: V2): V2 => raw([neckC + x * (x < 0 ? 1 - 0.12 * u : 1 + 0.1 * u), y]);
  // 下摆罗纹（毛衣、连帽衫、校服）
  if (top.kind === "sweater" || top.kind === "hoodie" || top.kind === "polo" || top.kind === "vneck") ribBand(ctx, torso, raw, -18, 20, trim, ink, fine);
  if (top.kind === "tee" && top.stripes) {
    ctx.save();
    ctx.clip(torso);
    ctx.fillStyle = top.stripes;
    for (let y = -150; y < 0; y += 15) ctx.fill(polyPath([[-120, y], [120, y], [120, y + 6], [-120, y + 6]], raw));
    ctx.restore();
  }
  if (top.kind === "sweater" && top.turtle) turtleneck(ctx, rig, ink, colors, lw);
  else if (top.kind === "sweater") {
    // 粗罗纹领：领口一圈带竖纹
    const ring = smoothPath(([[-14, -165, 1], [0, -158], [14, -165, 1], [19, -160], [0, -149], [-19, -160]] as P[]).map(([x, y, c]) => [...nk([x, y]), ...(c ? [c] : [])] as P));
    drawPart(ctx, ring, trim, null, ink, lw * 0.7);
    if (top.under)
      // 毛衣里面的衬衫领：两片小尖领翻在毛衣领上
      for (const s of [-1, 1]) {
        const p = smoothPath(([[s * 2, -158, 1], [s * 13, -165], [s * 20, -160, 1], [s * 9, -146, 1]] as P[]).map(([x, y, c]) => [...nk([x, y]), ...(c ? [c] : [])] as P));
        drawPart(ctx, p, top.under, null, ink, lw * 0.7);
      }
  } else if (top.kind === "shirt" || top.kind === "vneck") {
    if (top.kind === "vneck") {
      // V 领：毛衣上开一个 V，里面是衬衫，V 的边一道罗纹
      const vee = polyPath([[-16, -162], [16, -162], [0, -116]], on);
      ctx.save();
      ctx.clip(torso);
      drawPart(ctx, vee, top.under ?? "#f2efe8", null, ink, lw * 0.6);
      ctx.restore();
      const rib = (s: number) => polyPath([[s * 16, -162], [s * 22, -162], [0, -108], [0, -116]], on);
      for (const s of [-1, 1]) drawPart(ctx, rib(s), trim, null, ink, lw * 0.55);
    } else if (top.button !== "none") {
      // 门襟一排扣子
      line(ctx, [on([1.5, -150]), on([1.5, -8])], "rgba(30,25,35,0.35)", ink.lw * 0.45);
      for (const y of [-138, -112, -86, -60, -34]) dot(ctx, on([4.5, y]), 1.7, top.button ?? "#f8f6f0", ink);
    }
    // 尖领：两片从脖子后面绕过来，领尖压在胸口
    const collarColor = top.kind === "vneck" ? (top.under ?? "#f2efe8") : colors.top;
    for (const s of [-1, 1]) {
      const p = smoothPath(([[s * 1, -158, 1], [s * 10, -170], [s * 15, -167], [s * 19, -158, 1], [s * 8, -142, 1]] as P[]).map(([x, y, c]) => [...nk([x, y]), ...(c ? [c] : [])] as P));
      drawPart(ctx, p, collarColor, null, ink, lw * 0.7);
    }
  } else if (top.kind === "hoodie") {
    // 抽绳、袋鼠兜
    for (const s of [-1, 1]) {
      const a = nk([s * 7, -158]);
      const sw = 1.5 * Math.sin(pose.t * 2 + s);
      const b = on([s * 9 + sw, -122]);
      line(ctx, [a, b], ink.line, ink.lw * 1.15);
      line(ctx, [a, b], trim, ink.lw * 0.55);
      dot(ctx, b, 1.6, "#e9e4da", ink);
    }
    const pk = smoothPath(
      ([[-24, -64, 1], [24, -64, 1], [33, -40], [36, -20, 1], [-36, -20, 1], [-33, -40]] as P[]).map(([x, y, c]) => [...on([x, y]), ...(c ? [c] : [])] as P),
    );
    ctx.save();
    ctx.clip(torso);
    drawPart(ctx, pk, colors.top, colors.topShade, ink, lw * 0.8);
    ctx.restore();
  } else if (top.kind === "duijin") {
    // 立领一圈、正中对襟、一排盘扣、滚边
    const collar = smoothPath(([[-13, -172, 1], [13, -172, 1], [15, -160], [3, -157, 1], [-3, -157, 1], [-15, -160]] as P[]).map(([x, y, c]) => [...nk([x, y]), ...(c ? [c] : [])] as P));
    drawPart(ctx, collar, colors.top, colors.topShade, ink, lw * 0.7);
    line(ctx, [nk([-13, -170]), nk([13, -170])], trim, ink.lw * 0.7);
    line(ctx, [on([0, -157]), on([0, -6])], trim, ink.lw * 1.1);
    line(ctx, [on([0, -157]), on([0, -6])], ink.line, ink.lw * 0.35);
    for (const y of [-146, -122, -98, -74, -50]) {
      // 盘扣：一个结 + 两边各一道横的扣条
      const a = on([-7, y]);
      const b = on([7, y]);
      line(ctx, [a, b], ink.line, ink.lw * 1.2);
      line(ctx, [a, b], trim, ink.lw * 0.6);
      dot(ctx, on([0, y]), 2.3, trim, ink);
    }
  } else if (top.kind === "peter") {
    // 小圆领：两片白色的圆领
    for (const s of [-1, 1]) {
      const p = smoothPath(([[s * 1, -158, 1], [s * 8, -165], [s * 20, -164], [s * 29, -156], [s * 25, -140], [s * 10, -137], [s * 1, -147, 1]] as P[]).map(([x, y, c]) => [...nk([x, y]), ...(c ? [c] : [])] as P));
      drawPart(ctx, p, top.trim ?? "#fbf8f2", null, ink, lw * 0.7);
    }
  } else if (top.kind === "polo") {
    // 校服：立领、拉链
    const collar = smoothPath(([[-13, -172, 1], [13, -172, 1], [15, -160], [2, -156, 1], [-2, -156, 1], [-15, -160]] as P[]).map(([x, y, c]) => [...nk([x, y]), ...(c ? [c] : [])] as P));
    drawPart(ctx, collar, trim, null, ink, lw * 0.7);
    line(ctx, [on([0, -156]), on([0, -6])], ink.line, ink.lw * 0.6);
    const zp = on([1, -150]);
    ctx.fillStyle = "#d9d5cc";
    ctx.beginPath();
    ctx.rect(zp[0] - 1.8, zp[1] - 2, 3.6, 7);
    ctx.fill();
    ctx.strokeStyle = ink.line;
    ctx.lineWidth = ink.lw * 0.35;
    ctx.stroke();
  }
}

/** 上衣的袖口（没穿外衣时）：毛衣、连帽衫的罗纹，衬衫的袖口 */
export function topCuff(top: Top | undefined, colors: { top: string; topShade: string }) {
  if (!top) return undefined;
  if (top.kind === "sweater" || top.kind === "hoodie" || top.kind === "vneck") return { from: 60, to: 75, color: top.trim ?? colors.topShade, ribs: true };
  if (top.kind === "polo") return { from: 62, to: 75, color: top.trim ?? colors.topShade };
  return undefined;
}

/** 校服袖子上的两道白杠（Look.onUpperArm、前臂里也画） */
export function sleeveStripe(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", clip: Path2D, color: string, upper: boolean) {
  const limb = rig.arms[side];
  const sx = side === "L" ? 1 : -1;
  const f = upper ? new Frame(limb.root[0], limb.root[1], limb.a1) : new Frame(limb.mid[0], limb.mid[1], limb.a2);
  ctx.save();
  ctx.clip(clip);
  ctx.fillStyle = color;
  for (const dx of [9, 14]) ctx.fill(polyPath([[sx * dx, -20], [sx * (dx + 2.6), -20], [sx * (dx + 2.6), 90], [sx * dx, 90]], ([x, y]) => f.p(x, y)));
  ctx.restore();
}

// ——— 裤子 ———
export interface Pants {
  /** 西裤的裤线 */
  crease?: boolean;
  /** 裤脚卷起来一道（颜色） */
  cuff?: string;
  /** 膝盖上的补丁（颜色） */
  patch?: string;
  /** 牛仔裤的缝线（颜色） */
  seam?: string;
}

/** 裤子的细节（每条腿画完、鞋画完以后） */
export function drawPants(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink, pants: Pants) {
  const limb = rig.legs[side];
  const [thigh, shin] = legPaths(rig, side);
  const fine = ppu(ctx) * 600 > 260;
  const ft = new Frame(limb.root[0], limb.root[1], limb.a1);
  const fs = new Frame(limb.mid[0], limb.mid[1], limb.a2);
  // 朝左时腿的正面在画面左边（−x）
  const fx = side === "R" || rig.u >= 0.25 ? 1 : -1;
  if (pants.crease && fine) {
    ctx.save();
    ctx.clip(thigh);
    line(ctx, [ft.p(-3 * fx, 14), ft.p(-3 * fx, 140)], "rgba(20,20,35,0.22)", ink.lw * 0.45);
    ctx.restore();
    ctx.save();
    ctx.clip(shin);
    line(ctx, [fs.p(-4 * fx, -10), fs.p(-6 * fx, 100)], "rgba(20,20,35,0.22)", ink.lw * 0.45);
    ctx.restore();
  }
  if (pants.seam && fine) {
    ctx.save();
    ctx.clip(thigh);
    line(ctx, [ft.p(12 * fx, 10), ft.p(13 * fx, 140)], pants.seam, ink.lw * 0.35, [2, 2]);
    ctx.restore();
    ctx.save();
    ctx.clip(shin);
    line(ctx, [fs.p(13 * fx, -10), fs.p(12 * fx, 100)], pants.seam, ink.lw * 0.35, [2, 2]);
    ctx.restore();
  }
  if (pants.patch) {
    ctx.save();
    ctx.clip(shin);
    const p = smoothPath(([[-14, -6], [12, -8], [14, 14], [-12, 16]] as P[]).map(([x, y]) => [...fs.p(x * fx, y)] as P));
    drawPart(ctx, p, pants.patch, null, ink, ink.lw * 0.45);
    if (fine) {
      ctx.setLineDash([1.6, 1.8]);
      ctx.strokeStyle = "rgba(250,240,225,0.6)";
      ctx.lineWidth = ink.lw * 0.3;
      ctx.stroke(smoothPath(([[-11, -3], [9, -5], [11, 11], [-9, 13]] as P[]).map(([x, y]) => [...fs.p(x * fx, y)] as P)));
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
  if (pants.cuff) {
    ctx.save();
    ctx.clip(shin);
    const L = Math.hypot(limb.end[0] - limb.mid[0], limb.end[1] - limb.mid[1]);
    const band = polyPath([[-40, L - 18], [40, L - 18], [40, L + 30], [-40, L + 30]], ([x, y]) => fs.p(x, y));
    ctx.fillStyle = pants.cuff;
    ctx.fill(band);
    line(ctx, [fs.p(-40, L - 18), fs.p(40, L - 18)], ink.line, ink.lw * 0.5);
    ctx.restore();
  }
}
