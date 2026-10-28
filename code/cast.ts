// 配角：都建在基础模型（figure.ts）上，用一份「人物配置」生成外观（Look）：发型（cast-hair）、衣服（cast-wear：外衣版型、上衣、裤子）、
// 脸上的人物特点（cast-face：眉毛、皱纹、眼镜、胡子、胡茬、发卡）、帽子、领带、鞋、铃铛……
// 每个人有自己的轮廓和标志色（《引力》的人物表），全片一个拉一个时一眼认得出谁是谁。
// 用法：drawCast(ctx, CAST.周磊, pose, opts)——pose 是基础模型的姿势（可以用 playMove 的动作），画的时候按这个人的身高缩放。

import { type Ink, type P, type V2, Frame, add, clamp01, drawPart, fillShaded, rowSpan, smoothPath } from "./rig";
import {
  type DrawOptions,
  type HeadView,
  type Look,
  type Palette,
  type FaceView,
  type PoseIn,
  type Rig,
  BASE_COLORS,
  drawFigure,
  figureJoints,
  figurePose,
  legPaths,
  polyPath,
} from "./figure";
import { bootSoles, drawBoot } from "./chengtuo-draw";
import { type HairArtSrc, type HairStyle, drawBackHair, drawFrontHair, drawHairUnder } from "./cast-hair";
import { KID_FACE0, KID_FACE3, KID_HAIR, KID_LEGS } from "./cast-kid-art";
import { OLDZHONG_FACE0, OLDZHONG_FACE3, OLDZHONG_HAIR } from "./cast-oldzhong-art";
import { QINMOM_COAT, QINMOM_FACE0, QINMOM_FACE3, QINMOM_HAIR } from "./cast-qinmom-art";
import { SHITOUMOM_COAT, SHITOUMOM_FACE0, SHITOUMOM_FACE3, SHITOUMOM_HAIR, SHITOUMOM_LEGS } from "./cast-shitoumom-art";
import {
  type Garment,
  type Pants,
  type Top,
  drawArtShirt,
  drawGarment,
  drawPants,
  drawTop,
  fillSleeve,
  garmentCuff,
  garmentShirtClip,
  garmentPanels,
  onTorso,
  sleeveStripe,
  topCuff,
  topHasOwnCollar,
} from "./cast-wear";
import { ZHOULEI_SUIT } from "./cast-wear-art";
import { type BrowSpec, drawBrows, drawGlasses, drawHairclip, drawMustache, drawStubble, drawWrinkles } from "./cast-face";
import { ZHOULEI_FACE0, ZHOULEI_FACE3 } from "./cast-face-art";

export type { HairStyle } from "./cast-hair";
export type { Garment, GarmentKind, Pants, Top, TopKind } from "./cast-wear";
export type { BrowKind, BrowSpec } from "./cast-face";

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
  const fine = Math.hypot(ctx.getTransform().a, ctx.getTransform().b) * 130 > 60;
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
    // 毛线帽：圆圆地扣在头顶，几道针织的竖纹；一圈翻边（罗纹），翻边上一块小布标
    const dome = map([[-56, -22, 1], [-60, -56], [-40, -90], [0, -100], [40, -90], [60, -56], [56, -22, 1]]);
    drawPart(ctx, dome, hat.color, hat.shade, ink, ink.lw * 0.8);
    if (fine) {
      ctx.save();
      ctx.clip(dome);
      ctx.strokeStyle = "rgba(20,30,20,0.2)";
      ctx.lineWidth = ink.lw * 0.35;
      for (const x of [-36, -18, 0, 18, 36]) {
        ctx.beginPath();
        const a = H(sx(x * 0.25), -97);
        const b = H(sx(x), -30);
        ctx.moveTo(a[0], a[1]);
        ctx.quadraticCurveTo(...H(sx(x * 0.85), -70), b[0], b[1]);
        ctx.stroke();
      }
      ctx.restore();
    }
    const cuff = map([[-58, -12, 1], [-61, -38, 1], [61, -38, 1], [58, -12, 1]]);
    drawPart(ctx, cuff, hat.shade, null, ink, ink.lw * 0.8);
    if (fine) {
      ctx.save();
      ctx.clip(cuff);
      ctx.strokeStyle = "rgba(20,30,20,0.25)";
      ctx.lineWidth = ink.lw * 0.3;
      ctx.beginPath();
      for (let x = -60; x <= 60; x += 5) {
        const a = H(sx(x), -38);
        const b = H(sx(x), -12);
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
      }
      ctx.stroke();
      ctx.restore();
      const tag = map([[20, -33, 1], [34, -33, 1], [34, -21, 1], [20, -21, 1]]);
      drawPart(ctx, tag, "#e9e2d0", null, ink, ink.lw * 0.4);
    }
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
  /** 自己的线稿发型（换算脚本生成的，给了就不用 hair 的发型） */
  hairArt?: HairArtSrc;
  hairColor: string;
  hairShade?: string;
  /** 马尾的皮筋、发簪 */
  hairTie?: string;
  hat?: HatSpec;
  /** 外衣（几种版型，见 Garment）：size 大一号、long 下摆加长（负数收短） */
  coat?: Garment;
  /** 上衣的样子（领子、门襟、罗纹）；不写是素色圆领 */
  top?: Top;
  /** 裤子的细节（裤线、卷边、补丁、缝线） */
  pants?: Pants;
  /** 领带（西装） */
  tie?: string;
  /** 鞋（帆布鞋、皮鞋、布鞋，见 ShoeSpec）；"boots" 是和秤砣一样的大铁靴；"bare" 光脚 */
  shoes: ShoeSpec | "boots" | "bare";
  /** 铁靴相对身子放大多少（七岁的她穿着妈妈的大铁靴） */
  bootScale?: number;
  /** 眉毛（不写是基础模型的细眉） */
  brows?: BrowSpec;
  glasses?: string;
  /** 镜框的形状（默认圆框） */
  glassesShape?: "round" | "square";
  mustache?: string;
  /** 胡茬 */
  stubble?: boolean;
  /** 皱纹（老人）；"forehead" 连额头上两道 */
  wrinkles?: boolean | "forehead";
  /** 发卡 */
  hairclip?: string;
  /** 脚踝上的铃铛（小孩） */
  bell?: boolean;
  /** 上衣的圆领 */
  collar?: boolean;
  headScale?: number;
  /** 腿长（Look.legLength）：小孩腿短 */
  legLength?: number;
  /** 头再横着放宽（Look.headWidth）、眼睛连眉毛缩放（Look.eyeScale）、头发蓬松（HairPaint.volume） */
  headWidth?: number;
  /** 脸用自己的线稿（Look.face0 正面、face3 3/4） */
  face0?: FaceView;
  face3?: FaceView;
  /** 3/4 时肩关节再挪多少（Look.shoulderSide，袖子接到手画外衣的肩上） */
  shoulderSide?: { L?: V2; R?: V2 };
  eyeScale?: number;
  hairVolume?: number;
  width?: number;
  /** 腿（裤腿）粗细、裤脚那头的粗细、胳膊粗细（只改画法，关节位置不动）：基础模型是秤砣穿裤袜的细腿，
   *  她的小腿被铁靴盖着；配角穿矮帮鞋整条腿露出来，不加粗就是两根细棍，人显得被拉长 */
  legWidth?: number;
  legHem?: number;
  /** 膝盖那里的裤腿粗细（Look.legKnee）：直筒宽裤 */
  legKnee?: number;
  /** 照参考图描的裤腿（Look.legShape，cast-<名>-art.ts 的 <前缀>_LEGS） */
  legArt?: { L: V2[]; R: V2[] };
  armWidth?: number;
}

/** 配置 → 外观 */
export function castLook(spec: CastSpec): Look {
  const hp = { style: spec.hair, color: spec.hairColor, shade: spec.hairShade ?? spec.hairColor, tie: spec.hairTie, volume: spec.hairVolume, art: spec.hairArt };
  const coat = spec.coat;
  const shoes = spec.shoes;
  const top = spec.top;
  const col = { ...BASE_COLORS, ...spec.colors };
  const sleeve: [string, string] = coat ? [coat.color, coat.shade] : [col.top, col.topShade];
  const cuff = coat ? garmentCuff(coat) : topCuff(top, col);
  const hoodBack = coat?.kind === "hoodie" ? coat : top?.kind === "hoodie" ? { color: col.top, shade: col.topShade } : null;
  return {
    // 自己画眉毛时把基础模型的细眉藏起来
    colors: spec.brows ? { ...spec.colors, brow: "rgba(0,0,0,0)" } : spec.colors,
    collar: topHasOwnCollar(top) ? false : (spec.collar ?? true),
    headScale: spec.headScale,
    legLength: spec.legLength,
    headWidth: spec.headWidth,
    face0: spec.face0,
    face3: spec.face3,
    shoulderSide: spec.shoulderSide,
    torsoClip: coat?.art ? (rig) => garmentShirtClip(rig, coat.art!) : undefined,
    eyeScale: spec.eyeScale,
    width: spec.width,
    legWidth: spec.legWidth,
    legHem: spec.legHem,
    legKnee: spec.legKnee,
    legShape: spec.legArt,
    armWidth: spec.armWidth,
    sleeve: coat ? () => sleeve : undefined,
    shoulderOut: coat ? () => coat.shoulderOut ?? 4 * (coat.size ?? 1) : undefined,
    // 正面时上臂画在身子和外衣后面（和没穿外衣的老钟一样）：原来照主角的外套压在外衣上，袖子里侧那条线从腋下斜着往下收、
    // 外衣下摆又往外张，夹得胳膊上粗下细（用户 2026-10-28：周磊、千斤的妈妈、小石头「胳膊和身体的遮挡关系不对……老钟的就是对的」）
    armsOver: undefined,
    bodyPieces: coat ? (rig) => garmentPanels(rig, coat) : undefined,
    backHair: spec.hair === "none" && !spec.hairArt ? undefined : (ctx, rig, ink) => drawBackHair(ctx, rig, ink, hp),
    neckBack: hoodBack ? (ctx, rig, ink) => drawHood(ctx, rig, ink, hoodBack.color, hoodBack.shade) : undefined,
    // 分层头发的马尾、发圈：搭在肩上，压在外衣、领子上
    underHead: spec.hairArt?.layers?.tail || spec.hairArt?.layers?.tie ? (ctx, rig, ink) => drawHairUnder(ctx, rig, ink, hp) : undefined,
    overTorso: (ctx, rig, ink, sides) => {
      // 按线稿画的外衣带衬衫（周磊的西装）：衬衫领、领带、腰线也按线稿画；只有两片前襟（开衫）时里面的上衣照通用的画
      if (coat?.art?.collarL) drawArtShirt(ctx, rig, ink, coat.art, [col.top, col.topShade], spec.tie, [col.skin, col.skinShade], col.bottom);
      else {
        if (top) drawTop(ctx, rig, ink, top, col);
        if (spec.tie) drawTie(ctx, rig, ink, spec.tie);
      }
      if (coat) drawGarment(ctx, rig, ink, sides, coat);
    },
    frontHair: (ctx, h, ink) => {
      drawFrontHair(ctx, h, ink, hp);
      if (spec.hairclip) drawHairclip(ctx, h, ink, spec.hairclip);
      if (spec.hat) drawHat(ctx, h, spec.hat, ink);
    },
    face: (ctx, h, ink) => {
      if (spec.brows) drawBrows(ctx, h, ink, spec.brows);
      if (spec.stubble) drawStubble(ctx, h, ink);
      if (spec.wrinkles) drawWrinkles(ctx, h, ink, spec.wrinkles === "forehead");
      if (spec.mustache) drawMustache(ctx, h, ink, spec.mustache);
      if (spec.glasses) drawGlasses(ctx, h, ink, spec.glasses, spec.glassesShape ?? "round");
    },
    forearm:
      cuff || (top?.kind === "polo" && !coat)
        ? (ctx, rig, side, lower, ink) => {
            fillSleeve(ctx, rig, side, lower, ink, sleeve, cuff);
            if (top?.kind === "polo" && !coat) sleeveStripe(ctx, rig, side, lower, top.trim ?? "#fbf8f2", false);
          }
        : undefined,
    onUpperArm:
      top?.kind === "polo" && !coat ? (ctx, rig, side, upper) => sleeveStripe(ctx, rig, side, upper, top.trim ?? "#fbf8f2", true) : undefined,
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
      if (spec.pants) drawPants(ctx, rig, side, ink, spec.pants);
      if (spec.bell) drawBell(ctx, rig, side, ink);
    },
  };
}

/** 连帽：帽子搭在背后，从脖子两边、肩膀上面露出来（画在脖子、身子后面） */
function drawHood(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink, color: string, shade: string) {
  const { chest, u, pose } = rig;
  const br = pose.breath * 1.6;
  const on = ([x, y]: V2): V2 => chest.p(x + u * 12, y - br * clamp01(-y / 140));
  // 正面两头藏在肩膀后面；3/4 时靠后那一侧顺着后背弯下去、末端收进身子里面（原来是一条横的下沿加一个尖角，
  // 从后肩外面伸出来像一块方挡板，用户 2026-10-28：「小石头帽子」）
  const k = clamp01(u);
  const backMid: V2 = [37 + 3 * k, -166 + 6 * k];
  const backEnd: V2 = [34 - 12 * k, -146 + 12 * k];
  const pts: P[] = [[-34, -146, 1], [-37, -166], [-28, -184], [0, -190], [28, -184], [...backMid], k > 0.5 ? [...backEnd] : [...backEnd, 1]];
  const hood = smoothPath(pts.map(([x, y, c]) => [...on([x, y]), ...(c ? [c] : [])] as P));
  drawPart(ctx, hood, color, shade, ink, ink.lw * 0.85);
  // 帽口往里那一道
  ctx.save();
  ctx.clip(hood);
  ctx.strokeStyle = ink.line;
  ctx.lineWidth = ink.lw * 0.5;
  ctx.beginPath();
  const a = on([-24, -150]);
  ctx.moveTo(a[0], a[1]);
  ctx.quadraticCurveTo(...on([-26, -176]), ...on([0, -180]));
  ctx.quadraticCurveTo(...on([26, -176]), ...on([24, -150]));
  ctx.stroke();
  ctx.restore();
}

/** 领带：领口下面一个结，垂到肚子上（夹在外衣两片前襟之间）；领带上两道斜纹 */
function drawTie(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink, color: string) {
  const on = ([x, y]: V2) => rig.chest.p(...onTorso([x, y], rig.u));
  const path = (pts: P[]) => smoothPath(pts.map(([x, y, c]) => [...on([x, y]), ...(c ? [c] : [])] as P));
  const blade = path([[-4.5, -147, 1], [4.5, -147, 1], [9, -80], [0, -67, 1], [-9, -80]]);
  drawPart(ctx, blade, color, null, ink, ink.lw * 0.6);
  if (Math.hypot(ctx.getTransform().a, ctx.getTransform().b) * 600 > 260) {
    ctx.save();
    ctx.clip(blade);
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = ink.lw * 0.9;
    for (const y of [-132, -112, -92]) {
      const a = on([-12, y + 6]);
      const b = on([12, y - 6]);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }
    ctx.restore();
  }
  drawPart(ctx, path([[-6.5, -159, 1], [6.5, -159, 1], [4.5, -147, 1], [-4.5, -147, 1]]), color, null, ink, ink.lw * 0.6);
}

/** 脚踝上的铃铛：拴在一根红绳上（大人隔着一条街也听得见他还在地上） */
function drawBell(ctx: CanvasRenderingContext2D, rig: Rig, side: "L" | "R", ink: Ink) {
  if (side !== "L") return;
  const limb = rig.legs[side];
  const f = new Frame(limb.end[0], limb.end[1], limb.a2);
  // 红绳绕脚踝一圈
  ctx.strokeStyle = ink.line;
  ctx.lineCap = "round";
  ctx.lineWidth = ink.lw * 1.2;
  ctx.beginPath();
  ctx.moveTo(...f.p(-15, 4));
  ctx.quadraticCurveTo(...f.p(0, 8), ...f.p(17, 4));
  ctx.stroke();
  ctx.strokeStyle = "#c8443c";
  ctx.lineWidth = ink.lw * 0.6;
  ctx.stroke();
  // 铃铛：圆圆的一只，中间一道缝，下面一道口，左上一点亮
  const c = f.p(-6, 12);
  const r = 6.5;
  ctx.fillStyle = "#f2c94c";
  ctx.strokeStyle = ink.line;
  ctx.lineWidth = ink.lw * 0.5;
  ctx.beginPath();
  ctx.arc(c[0], c[1], r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(c[0] - r * 0.85, c[1] + 0.5);
  ctx.lineTo(c[0] + r * 0.85, c[1] + 0.5);
  ctx.lineWidth = ink.lw * 0.35;
  ctx.stroke();
  ctx.fillStyle = ink.line;
  ctx.beginPath();
  ctx.arc(c[0], c[1] + 3.3, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.beginPath();
  ctx.arc(c[0] - 2.4, c[1] - 2.4, 1.3, 0, Math.PI * 2);
  ctx.fill();
}

// ——— 片子里的人（《引力》） ———
const SKIN = { skin: "#fbe2d3", skinShade: "#f0cab7" };
const SKIN_WARM = { skin: "#f6d6c1", skinShade: "#e8bfa8" };
const SKIN_OLD = { skin: "#f3d9c9", skinShade: "#e2bfae" };
const MAN_BROW = (color = "#2a282e"): BrowSpec => ({ kind: "thick", color });

export const CAST = {
  /** 周磊：35 岁的职员，灰蓝西装（腰上一粒扣、缺角翻领、胸袋）、白衬衫、蓝领带；开场第一个被她拽回来的人 */
  周磊: {
    name: "周磊",
    scale: 1.06,
    // 脸、头发、西装照用户手画的线稿（作品 3d80f743 的 public/ref/周磊-线稿.svg、周磊-侧面线稿.svg，
    // cast-face-art.ts、cast-hair-art.ts、cast-wear-art.ts）；胳膊、脖子、腿和主角一样（用户 2026-10-27）：不加宽、不加粗、头不缩放，
    // 用户的线原样落在主角的骨架上
    face0: ZHOULEI_FACE0,
    face3: ZHOULEI_FACE3,
    colors: { ...SKIN, top: "#f4f2ec", topShade: "#e2ded4", bottom: "#4f5d76", bottomShade: "#424e64" },
    hair: "tousled",
    hairColor: "#2f2e33",
    top: { kind: "shirt", button: "none" },
    // 西装是用户画的（敞怀）；正面肩关节往外挪 6，和秤砣的外套一样
    coat: { kind: "suit", color: "#6b7d9c", shade: "#5a6b88", shoulderOut: 6, button: "#2f3442", art: ZHOULEI_SUIT },
    tie: "#3f63a8",
    pants: { crease: true },
    brows: MAN_BROW(),
    shoes: { color: "#2d2a31", shade: "#232027", sole: "#3c3940", style: "leather", sock: "#3a3741" },
  } as CastSpec,
  /** 称重员：全城最厚的铁靴、藏蓝制服帽；也是轻的 */
  称重员: {
    name: "称重员",
    scale: 1.1,
    // 骨架、头的大小和主角一样，只按 scale 缩放；脸用参考图描的（成年男人：参考图「男人」，周磊的脸）
    face0: ZHOULEI_FACE0,
    face3: ZHOULEI_FACE3,
    colors: { ...SKIN_WARM, top: "#3d4a6b", topShade: "#333e5a", bottom: "#323b55", bottomShade: "#2a3249" },
    collar: false,
    hair: "short",
    hairColor: "#3a3539",
    hat: { kind: "cap", color: "#2f3b5c", shade: "#27314c", badge: "#e8c25a" },
    coat: { kind: "jacket", color: "#3d4a6b", shade: "#333e5a", size: 1.04 },
    mustache: "#3a3539",
    brows: MAN_BROW("#3a3539"),
    shoes: "boots",
  } as CastSpec,
  /** 老钟：七十多岁，头顶秃了、两鬓和后脑勺一圈白头发，白眉毛，圆框眼镜；棕色 V 领毛衣套着浅色衬衫；每天等她的脚步声 */
  老钟: {
    name: "老钟",
    scale: 0.96,
    // 骨架和主角一样；秃顶的头、脸和两鬓的白发照参考图描的（作品 3d80f743 的 public/ref/老钟-线稿.svg、侧面线稿.svg，cast-oldzhong-art.ts）
    face0: OLDZHONG_FACE0,
    face3: OLDZHONG_FACE3,
    colors: { ...SKIN_OLD, top: "#9a6a4a", topShade: "#85593d", bottom: "#5e5248", bottomShade: "#4f443b" },
    hair: "receding",
    hairArt: OLDZHONG_HAIR,
    hairColor: "#ecebe6",
    hairShade: "#d6d4cc",
    top: { kind: "vneck", trim: "#86593c", under: "#efe9dc" },
    brows: { kind: "bushy", color: "#e9e6df" },
    glasses: "#5a4a40",
    wrinkles: "forehead",
    pants: { crease: true },
    shoes: { color: "#5a4636", shade: "#4b3a2d", style: "leather", sock: "#4a4650" },
  } as CastSpec,
  /** 小石头：7 岁，毛茸茸的头发、头顶一根呆毛；绿色连帽外套，里面一件米白条纹 T 恤；脚踝上红绳拴着一只铃铛 */
  小石头: {
    name: "小石头",
    // 身高、头身比照参考图里大人和小孩站在一起的那张（作品 3d80f743 的 public/ref/比例参考-大人和小孩.png）：
    // 小孩是大人（周磊 1.06）的 0.716（头发顶到鞋底 629 / 878 像素）；头（头发顶→下巴）和上身（下巴→上衣下摆）一样长、
    // 下身（下摆→鞋底）是上身的 1.36 倍。只按 scale 缩小时头太小、腿太长，像大人的缩小版（用户 2026-10-28）：
    // 头以脖子为中心放大 1.335、腿缩到 0.70，全身从 634.5 变成 610.7，scale 跟着从 0.76 调到 0.79（身高比还是 0.716）
    scale: 0.79,
    headScale: 1.335,
    legLength: 0.7,
    // 裤腿横着收到 0.87：照大人和小孩的参考图量，一条裤腿大腿那里约 104、往下收到 90，我们的 108–116（用户 2026-10-28：「腿太粗了」）
    legWidth: 0.87,
    // 骨架、头的大小、胳膊腿和主角一样（参考图里的小孩和主角用同一套横线），只是整个人按 scale 缩小；
    // 脸和头发是照参考图描的（作品 3d80f743 的 public/ref/小石头-线稿.svg、小石头-侧面线稿.svg，cast-kid-art.ts）
    // 裤腿也照参考图描：又宽又直的牛仔裤（用户 2026-10-28：「小石头的腿太细了，导致看起来像是大人的缩小版」）
    face0: KID_FACE0,
    face3: KID_FACE3,
    legArt: KID_LEGS,
    colors: { ...SKIN, top: "#f5f1e6", topShade: "#e3decf", bottom: "#56627a", bottomShade: "#48536a", blush: "250,140,140" },
    hair: "kid",
    hairArt: KID_HAIR,
    hairColor: "#2f2e33",
    top: { kind: "tee", stripes: "#dfe7ee" },
    coat: { kind: "hoodie", color: "#68a86f", shade: "#57925e", trim: "#5a9561" },
    pants: { cuff: "#6a7690" },
    brows: { kind: "kid", color: "#2f2e33" },
    bell: true,
    shoes: { color: "#c9574a", shade: "#b0473b", style: "sneaker", sock: "#f7f3ee" },
  } as CastSpec,
  /** 小石头裹着妈妈的橘色外套（爸爸留下的工装外套，大一号、袖子卷了两道、下摆缝了一圈铅）：副歌一以后一直穿着 */
  小石头穿妈妈的外套: {
    name: "小石头",
    scale: 0.79,
    headScale: 1.335,
    legLength: 0.7,
    // 裤腿横着收到 0.87：照大人和小孩的参考图量，一条裤腿大腿那里约 104、往下收到 90，我们的 108–116（用户 2026-10-28：「腿太粗了」）
    legWidth: 0.87,
    face0: KID_FACE0,
    face3: KID_FACE3,
    legArt: KID_LEGS,
    colors: { ...SKIN, top: "#f5f1e6", topShade: "#e3decf", bottom: "#56627a", bottomShade: "#48536a", blush: "250,140,140" },
    hair: "kid",
    hairArt: KID_HAIR,
    hairColor: "#2f2e33",
    top: { kind: "tee", stripes: "#dfe7ee" },
    coat: { kind: "workcoat", color: "#f29a4a", shade: "#de8538", size: 1.32, long: 70, hem: "#8a6a5a", rolled: true },
    pants: { cuff: "#6a7690" },
    brows: { kind: "kid", color: "#2f2e33" },
    bell: true,
    shoes: { color: "#c9574a", shade: "#b0473b", style: "sneaker", sock: "#f7f3ee" },
  } as CastSpec,
  /** 小石头的妈妈：年轻的轻户，穿着丈夫留下的橘色工装外套（立领、大扣子、下摆缝了一圈铅）、米白毛衣、低马尾 */
  小石头的妈妈: {
    name: "小石头的妈妈",
    scale: 0.98,
    // 骨架、头的大小和主角一样，只按 scale 缩放；脸、低马尾、工装外套（门襟、下摆）、直筒裤腿照用户 2026-10-28 生成的参考图描的
    // （作品 3d80f743 的 public/ref/小石头的妈妈-线稿.svg、侧面线稿.svg，cast-shitoumom-art.ts）。原来借千斤的妈妈的脸、通用的低马尾、
    // 主角外套版型的工装外套（下摆外张、大口袋），用户：「小石头妈妈的建模问题很大」。颜色照旧
    face0: SHITOUMOM_FACE0,
    face3: SHITOUMOM_FACE3,
    legArt: SHITOUMOM_LEGS,
    // 参考图里两只脚在胯底下、裤腿竖直；我们的骨架两脚分开、裤腿跟着往外撇，照描的宽窄显得像喇叭裤：收窄一点
    legWidth: 0.88,
    colors: { ...SKIN, top: "#f7ead8", topShade: "#e9d8c0", bottom: "#6a5a66", bottomShade: "#5a4b56" },
    hair: "ponytail",
    hairArt: SHITOUMOM_HAIR,
    // 头发、发圈照参考图的颜色（接近黑的深棕、橙红的发圈；用户 2026-10-28：「头发也没做好」）
    hairColor: "#463636",
    hairShade: "#3a2c2c",
    hairTie: "#cd6548",
    // 米白高领毛衣：领子包住脖子到下巴底下（用户 2026-10-28：「脖子这里没画对」）
    top: { kind: "sweater", trim: "#eadcc6", turtle: true },
    coat: { kind: "workcoat", color: "#f29a4a", shade: "#de8538", hem: "#8a6a5a", art: SHITOUMOM_COAT },
    brows: { kind: "soft", color: "#3a2c2c" },
    shoes: { color: "#7a5a4a", shade: "#674b3d", style: "leather" },
  } as CastSpec,
  /** 千斤：16 岁，红毛衣（粗罗纹领，领口露出白衬衫领）、侧分的齐耳短发，黄色一字夹别住刘海 */
  千斤: {
    name: "千斤",
    scale: 0.94,
    // 骨架、头的大小和主角一样，只按 scale 缩放；脸是主角的（年轻的女孩）
    colors: { ...SKIN, top: "#e2574c", topShade: "#c9473d", bottom: "#3d3f52", bottomShade: "#333545" },
    hair: "sidebob",
    hairColor: "#2c2a30",
    hairclip: "#f2c94c",
    top: { kind: "sweater", trim: "#cc4a40", under: "#f7f4ee" },
    brows: { kind: "soft", color: "#2c2a30" },
    shoes: { color: "#6b4a3f", shade: "#5a3d33", style: "sneaker", sock: "#f7f3ee" },
  } as CastSpec,
  /** 千斤的妈妈：紫色开衫、盘发，在哑铃厂打两份工 */
  千斤的妈妈: {
    name: "千斤的妈妈",
    scale: 1.0,
    // 骨架和主角一样；脸、盘发和开衫照参考图描的（作品 3d80f743 的 public/ref/千斤的妈妈-线稿.svg、侧面线稿.svg，cast-qinmom-art.ts）。
    // 开衫原来是秤砣外套的版型加长、下摆张开、两个贴袋，显得很胖（用户 2026-10-28）：两片前襟改成描的，门襟直、下摆在胯下面一点
    face0: QINMOM_FACE0,
    face3: QINMOM_FACE3,
    colors: { ...SKIN_WARM, top: "#b9a3d6", topShade: "#a48ec2", bottom: "#4f465e", bottomShade: "#433b50" },
    hair: "bun",
    hairArt: QINMOM_HAIR,
    hairColor: "#3a3036",
    top: { kind: "crew" },
    // 门襟罗纹边、右片一排小扣子、左胸绣一朵小花（用户 2026-10-28：「加一点装饰，好看点」）
    coat: { kind: "cardigan", color: "#8e6bbf", shade: "#7a59a8", trim: "#7d5cad", button: "#efe6f6", flower: "#f6dbe6", art: QINMOM_COAT },
    brows: { kind: "soft", color: "#3a3036" },
    shoes: { color: "#4a3f52", shade: "#3d3445", style: "leather" },
  } as CastSpec,
  /** 阿满：四十多岁的压锭工，绿毛线帽、棕色工装夹克（翻领、拉链、两个带盖的胸袋、罗纹下摆）、胡茬，膝盖上打着补丁 */
  阿满: {
    name: "阿满",
    scale: 1.04,
    // 骨架、头的大小和主角一样，只按 scale 缩放；脸用参考图描的（成年男人：参考图「男人」，周磊的脸）
    face0: ZHOULEI_FACE0,
    face3: ZHOULEI_FACE3,
    colors: { ...SKIN_WARM, top: "#d8cfb8", topShade: "#c6bca4", bottom: "#4f5361", bottomShade: "#434653" },
    hair: "short",
    hairColor: "#3a3539",
    hat: { kind: "beanie", color: "#5c9a64", shade: "#4c8554" },
    coat: { kind: "jacket", color: "#8c6a4c", shade: "#77593e", trim: "#6f5239", button: "#3a302a" },
    pants: { patch: "#5d6272" },
    brows: MAN_BROW("#3a3539"),
    stubble: true,
    shoes: { color: "#3e3a3f", shade: "#322f33", style: "leather", sock: "#3a3741" },
  } as CastSpec,
  /** 窗口的老太太（千斤用砖救下的）：淡紫的对襟盘扣褂子，花白的盘发插一根发簪，布鞋 */
  老太太: {
    name: "老太太",
    scale: 0.88,
    // 骨架、头的大小和主角一样，只按 scale 缩放；脸用参考图「老人」描的（老钟的脸：带头顶的整个头，盘发盖在上面）——
    // 千斤的妈妈的脸窄、额头低，盘发的发际线是按基础模型的脸画的，盖在她脸上一直压到眉毛
    face0: OLDZHONG_FACE0,
    face3: OLDZHONG_FACE3,
    colors: { ...SKIN_OLD, top: "#bfaee0", topShade: "#a998cc", bottom: "#6a6273", bottomShade: "#5a5362" },
    hair: "bun",
    hairColor: "#dcdad4",
    hairShade: "#c6c3bb",
    hairTie: "#b8443e",
    top: { kind: "duijin", trim: "#8f7cb8" },
    brows: { kind: "bushy", color: "#d9d6cf" },
    wrinkles: "forehead",
    shoes: { color: "#3a3540", shade: "#2e2a33", style: "cloth", sock: "#f7f3ee" },
  } as CastSpec,
  /** 周磊拽下来的年轻人：中分，青绿连帽衫（抽绳、袋鼠兜），牛仔裤卷着裤脚 */
  年轻人: {
    name: "年轻人",
    scale: 1.02,
    // 骨架、头的大小和主角一样，只按 scale 缩放；脸用参考图描的（成年男人：参考图「男人」，周磊的脸）
    face0: ZHOULEI_FACE0,
    face3: ZHOULEI_FACE3,
    colors: { ...SKIN, top: "#4fa8a3", topShade: "#3f938e", bottom: "#3f4757", bottomShade: "#353c4a" },
    hair: "curtain",
    hairColor: "#3b3035",
    top: { kind: "hoodie", trim: "#f1ede4" },
    pants: { cuff: "#566079", seam: "rgba(230,190,120,0.7)" },
    brows: MAN_BROW("#3b3035"),
    shoes: { color: "#f0ede6", shade: "#dcd8cf", sole: "#e9e3d8", style: "sneaker" },
  } as CastSpec,
  /** 秤砣的妈妈（锈红色）：只在回忆和白里出现。系腰带的锈红长外套、米白衬衫，长直发中分 */
  秤砣的妈妈: {
    name: "秤砣的妈妈",
    scale: 1.0,
    // 骨架、头的大小和主角一样，只按 scale 缩放；脸用参考图描的（成年女人：参考图「女人」，千斤的妈妈的脸）
    face0: QINMOM_FACE0,
    face3: QINMOM_FACE3,
    colors: { ...SKIN, top: "#f3e2d6", topShade: "#e4cfc0", bottom: "#5c4a4c", bottomShade: "#4d3d3f" },
    hair: "long",
    hairColor: "#2c2a30",
    top: { kind: "crew" },
    coat: { kind: "trench", color: "#b75b44", shade: "#a04a35", long: 50, trim: "#9a4632", button: "#5a3028" },
    brows: { kind: "soft", color: "#2c2a30" },
    shoes: "bare",
  } as CastSpec,
  /** 七岁的秤砣：穿着妈妈那双大铁靴；鹅黄毛衣配白色小圆领，齐耳短发 */
  小时候的秤砣: {
    name: "小时候的秤砣",
    // 脸是主角的；头身比照小石头（大人和小孩站在一起的参考图量的）：头以脖子为中心放大 1.335、腿缩到 0.7、小孩的直筒裤腿。
    // 原来是十九岁的她只按 scale 0.58 缩小：头小、腿长、腿细，像大人的缩小版，个子也只有三四岁（用户 2026-10-28：「先改沉沉」）。
    // 现在和小石头一样高（十九岁的她的 0.75）。铁靴是妈妈那双：世界里的大小不变（0.58 × 1.55）
    scale: 0.79,
    headScale: 1.335,
    legLength: 0.7,
    legArt: KID_LEGS,
    legWidth: 0.87,
    bootScale: (0.58 * 1.55) / 0.79,
    colors: { ...SKIN, top: "#f4c95d", topShade: "#e2b54a", bottom: "#5d6177", bottomShade: "#4f5266", blush: "250,140,140" },
    hair: "bob",
    hairColor: "#2c2a30",
    top: { kind: "peter" },
    shoes: "boots",
  } as CastSpec,
  /** 开场光里的女人：割断了脚绳，张着手、闭着眼笑 */
  光里的女人: {
    name: "光里的女人",
    scale: 0.98,
    // 骨架、头的大小和主角一样；脸是主角的（年轻的女人，和《引力》里 lib/woman.ts 的她一样）
    colors: { ...SKIN, top: "#f6c7cf", topShade: "#e8b2bc", bottom: "#c7b3d8", bottomShade: "#b39fc6" },
    hair: "long",
    hairColor: "#3a3036",
    shoes: "bare",
  } as CastSpec,
};

// ——— 《引力》间奏里被她拽下来的两个人（作品 3d80f743 原来写在 lib/saved.ts）：高潮的人链里会回来，穿出场时的衣服 ———
/** 扎马尾的女学生：高马尾、碎刘海，浅蓝的运动校服（白色立领、拉链、袖子上两道白杠）；学校门口被十六岁的她拽下来 */
export const SCHOOLGIRL: CastSpec = {
  name: "扎马尾的女学生",
  scale: 0.9,
  // 骨架、头的大小和主角一样，只按 scale 缩放；脸是主角的（年轻的女孩）
  colors: { ...CAST.年轻人.colors, top: "#bcd5ec", topShade: "#a6c2dd", bottom: "#3f4a6b", bottomShade: "#353e5a" },
  hair: "highpony",
  hairColor: "#2f2e33",
  hairTie: "#e06c7a",
  top: { kind: "polo", trim: "#f7f5f0" },
  brows: { kind: "soft", color: "#2f2e33" },
  shoes: { color: "#f2efe8", shade: "#ddd8ce", sole: "#e8e2d6", style: "sneaker", sock: "#f2efe8" },
};
/** 戴眼镜的大叔：方框眼镜，棕色夹克（翻领、拉链、胸袋）里面一件衬衫，西裤；公交站被十岁的她拽下来 */
export const GLASSES_UNCLE: CastSpec = {
  name: "戴眼镜的大叔",
  scale: 1.04,
  // 骨架、头的大小和主角一样，只按 scale 缩放；脸用参考图「男人」描的（周磊的脸）
  face0: ZHOULEI_FACE0,
  face3: ZHOULEI_FACE3,
  colors: { ...CAST.周磊.colors, top: "#d9d3c6", topShade: "#c9c2b3", bottom: "#4b4340", bottomShade: "#3f3835" },
  hair: "short",
  hairColor: "#3a3539",
  glasses: "#3a3539",
  glassesShape: "square",
  top: { kind: "shirt" },
  coat: { kind: "jacket", color: "#8b6b4f", shade: "#76593f", size: 1.02, trim: "#6e533b" },
  brows: { kind: "thick", color: "#3a3539" },
  pants: { crease: true },
  shoes: { color: "#3e3a3f", shade: "#322f33", style: "leather", sock: "#3a3741" },
};

// ——— 七到十二岁的秤砣（作品 3d80f743 原来写在 lib/grow.ts） ———
/** 七到十二岁的身高（相对七岁的比例：七岁就是 CAST.小时候的秤砣，和小石头一样高） */
const YOUNG_HEIGHT = [0.75, 0.78, 0.81, 0.835, 0.85, 0.865];
/** 站直时头顶（头发底下，头按 headScale 放大以后）离地多高（角色单位，不乘 scale） */
function crownOf(spec: CastSpec): number {
  const look = lookOf(spec);
  const j = figureJoints(figurePose({ face: 0 }, 0, look), look);
  const hs = spec.headScale ?? 1;
  return -(j.neck[1] + (j.head[1] - j.neck[1]) * hs) + 53 * hs;
}
const YOUNG = new Map<number, CastSpec>();
/**
 * 七到十二岁的秤砣：七岁是小孩的头身比（头大、腿短、直筒裤腿，和小石头一样），头、腿长、裤腿宽一年年往十三岁（现在的她，
 * 大人的头身比）过渡，身高按 YOUNG_HEIGHT；铁靴还是妈妈那双（世界里一样大），相对身子越来越合脚；十岁穿上藏青外套。
 * 十三岁起是现在的她（秤砣）按身高缩小
 */
export function youngChengtuo(age: number): CastSpec {
  const a = Math.max(7, Math.min(12, Math.round(age)));
  let spec = YOUNG.get(a);
  if (spec) return spec;
  const KID = CAST.小时候的秤砣;
  const i = a - 7;
  if (i === 0) spec = KID;
  else {
    const k = i / 6;
    const grown: CastSpec = {
      ...KID,
      headScale: (KID.headScale ?? 1) + (1 - (KID.headScale ?? 1)) * k,
      legLength: (KID.legLength ?? 1) + (1 - (KID.legLength ?? 1)) * k,
      legWidth: (KID.legWidth ?? 1) + (0.66 - (KID.legWidth ?? 1)) * k,
    };
    const scale = (KID.scale * (YOUNG_HEIGHT[i] / YOUNG_HEIGHT[0]) * crownOf(KID)) / crownOf(grown);
    spec = { ...grown, scale };
  }
  spec = {
    ...spec,
    name: `${a}岁的秤砣`,
    bootScale: (KID.scale * (KID.bootScale ?? 1)) / spec.scale,
    coat: i >= 3 ? { color: "#353f55", shade: "#2b3346" } : undefined,
  };
  YOUNG.set(a, spec);
  return spec;
}

/** 路人的鞋：黑皮鞋、白帆布鞋、棕皮鞋、藏蓝帆布鞋轮着穿 */
const PASSERBY_SHOES: ShoeSpec[] = [
  { color: "#3e3a3f", shade: "#322f33", style: "leather", sock: "#3a3741" },
  { color: "#f2efe8", shade: "#ddd8ce", sole: "#e8e2d6", style: "sneaker", sock: "#e9e6df" },
  { color: "#5a4636", shade: "#4b3a2d", style: "leather", sock: "#45414b" },
  { color: "#4e5a78", shade: "#424d68", style: "sneaker", sock: "#f2efe8" },
];
/** 路人的外衣轮着用几种版型 */
const PASSERBY_COATS = ["jacket", "cardigan", "coat", "workcoat", "hoodie", "suit", "cardigan", "jacket"] as const;
const PASSERBY_TOPS: (Top | undefined)[] = [undefined, { kind: "sweater" }, { kind: "shirt" }, undefined, { kind: "tee" }, { kind: "sweater" }, undefined, { kind: "shirt" }];

/** 颜色暗一点（外衣的阴影、罗纹） */
function darker(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** 路人（打伞走过、链上后来跑来的人）：几种衣服、发型、鞋轮着用 */
export function passerby(i: number): CastSpec {
  const tops = ["#9ccbd8", "#f2b8a2", "#c6d89a", "#e7c9e9", "#f4d58a", "#a9b8e8", "#e8a7a7", "#a8d8c0"];
  const coats = ["#6f8fb5", "#c47a6a", "#7aa56f", "#9a7ab8", "#c9a24f", "#5f7f9a", "#b56b80", "#5f9a88"];
  const hairs: HairStyle[] = ["short", "bob", "bun", "ponytail", "short", "long", "kid", "receding"];
  const hc = ["#2f2e33", "#4b3530", "#3a3036", "#5b3f33", "#2c2a30", "#6a5040", "#2f2e33", "#d8d6d0"];
  const k = ((i % 8) + 8) % 8;
  const j = ((i * 3 + 1) % 8 + 8) % 8;
  const c = coats[(k + 3) % 8];
  const kind = PASSERBY_COATS[((i * 5 + 2) % 8 + 8) % 8];
  const hair = hairs[j];
  const man = hair === "short" || hair === "kid" || hair === "receding";
  return {
    name: `路人${i}`,
    scale: 0.92 + ((i * 37) % 13) / 100,
    // 骨架、头的大小和主角一样；脸按男女老少用参考图描的（男人：周磊的脸，秃顶的老人：老钟的脸，女人：千斤的妈妈的脸）
    face0: hair === "receding" ? OLDZHONG_FACE0 : man ? ZHOULEI_FACE0 : QINMOM_FACE0,
    face3: hair === "receding" ? OLDZHONG_FACE3 : man ? ZHOULEI_FACE3 : QINMOM_FACE3,
    colors: { ...(i % 3 ? SKIN : SKIN_WARM), top: tops[k], topShade: darker(tops[k], 0.92), bottom: "#4e5266", bottomShade: "#434657" },
    hair,
    hairColor: hc[j],
    top: PASSERBY_TOPS[k],
    coat: i % 2 ? { kind, color: c, shade: darker(c, 0.88), long: kind === "suit" || kind === "jacket" ? -14 : (i * 13) % 40, trim: darker(c, 0.82) } : undefined,
    brows: man ? MAN_BROW(hc[j] === "#d8d6d0" ? "#cfcbc4" : hc[j]) : undefined,
    wrinkles: hair === "receding" || undefined,
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
