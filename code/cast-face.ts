// 配角脸上的人物特点：眉毛（男人粗、老人白而浓、往下耷）、皱纹、眼镜、胡子、胡茬、发卡。
// 眉毛跟着表情动（和基础模型的眉毛一样：难过内端抬、使劲内端压、惊讶整条抬），画在刘海上面。
// 基础模型的眉毛是一根细线（秤砣的，被刘海挡着只露出一点），男人、老人的脸上露出整条眉毛时显得秀气，换成这里的。

import { type Ink, type P, type V2, drawPart, lerp, ribbonPts, smoothPath } from "./rig";
import { type HeadView, eyeAt } from "./figure";

/**
 * thick 男人的粗眉（内端粗、往外收尖，几乎是直的）；bushy 老人的浓眉（白，外端往下耷，有几根翘出来）；
 * kid 小孩的短眉（短、圆头）；soft 女人的细眉（比基础模型的粗一点、弯一点）
 */
export type BrowKind = "thick" | "bushy" | "kid" | "soft";
export interface BrowSpec {
  kind: BrowKind;
  color: string;
}

/** 眉毛的中线（内端 → 外端）：[往脸中间多远, 高]，相对这只眼睛的眼珠中心；每一点的粗细 */
const BROWS: Record<BrowKind, { pts: V2[]; w: number[] }> = {
  thick: { pts: [[3.5, -24], [-4, -25.5], [-11, -25.5], [-17, -23.5]], w: [3.4, 3.1, 2.4, 1.0] },
  bushy: { pts: [[4.5, -25], [-3, -27.5], [-10, -27], [-17, -22.5]], w: [3.8, 4.2, 3.6, 1.6] },
  kid: { pts: [[1.5, -25], [-5, -27], [-11, -26]], w: [2.4, 2.4, 1.4] },
  soft: { pts: [[2.5, -23], [-4, -25.5], [-10, -25.3], [-15.5, -22.5]], w: [1.5, 1.7, 1.3, 0.6] },
};

export function drawBrows(ctx: CanvasRenderingContext2D, h: HeadView, ink: Ink, spec: BrowSpec) {
  const e = h.rig.pose.expr;
  const lift = -4 * e.wide - 1 * e.happy + 0.6 * e.blink;
  const b = BROWS[spec.kind];
  // 眼睛缩放（Look.eyeScale）时眉毛跟着眼睛：离眼珠中心的距离一起缩，粗细不变
  const es = h.rig.look.eyeScale ?? 1;
  for (const s of [-1, 1]) {
    const eye = eyeAt(s, h.uh);
    // 眼睛坐标 → 头的坐标：d 往脸中间为正（左边那只眼睛往 +x）
    const n = b.pts.length;
    const pts = b.pts.map(([d, y], i): V2 => {
      const t = i / (n - 1);
      const dy = lift + e.sad * (-5.5 * (1 - t) + 2.2 * t) + e.fierce * (5 * (1 - t) - 1.6 * t);
      return h.H(eye.x - s * d * eye.sx * es, eye.y + (y + dy) * eye.sy * es);
    });
    const widths = b.w.map((w) => w * (0.9 + 0.1 * eye.sx));
    ctx.fillStyle = spec.color;
    ctx.fill(smoothPath(ribbonPts(pts, widths, 0.6)));
    if (spec.kind === "bushy") {
      // 浓眉外端几根翘出来、往下耷
      ctx.strokeStyle = spec.color;
      ctx.lineCap = "round";
      ctx.lineWidth = ink.lw * 0.45;
      const tip = pts[n - 1];
      const prev = pts[n - 2];
      for (const [k, dy] of [[0.6, 3.5], [0.9, 1.2]] as const) {
        const a: V2 = [lerp(prev[0], tip[0], k), lerp(prev[1], tip[1], k)];
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(a[0] + (tip[0] - prev[0]) * 0.35, a[1] + dy);
        ctx.stroke();
      }
    }
    // 粗眉、浓眉描一道很细的边（白眉毛在皮肤上才看得出）
    if (spec.kind === "bushy") {
      ctx.strokeStyle = "rgba(90,80,80,0.55)";
      ctx.lineWidth = ink.lw * 0.25;
      ctx.stroke(smoothPath(ribbonPts(pts, widths, 0.6)));
    }
  }
}

/** 皱纹（老人）：眼角两道细纹、眼袋、法令纹、额头两道 */
export function drawWrinkles(ctx: CanvasRenderingContext2D, h: HeadView, ink: Ink, forehead: boolean) {
  ctx.strokeStyle = "rgba(130,92,80,0.5)";
  ctx.lineWidth = ink.lw * 0.32;
  ctx.lineCap = "round";
  const e = h.rig.pose.expr;
  const seg = (pts: V2[]) => {
    ctx.beginPath();
    const q = pts.map(([x, y]) => h.H(x, y));
    ctx.moveTo(q[0][0], q[0][1]);
    if (q.length === 3) ctx.quadraticCurveTo(q[1][0], q[1][1], q[2][0], q[2][1]);
    else for (const p of q.slice(1)) ctx.lineTo(p[0], p[1]);
    ctx.stroke();
  };
  for (const s of [-1, 1]) {
    const eye = eyeAt(s, h.uh);
    const ox = eye.x + s * 12.5 * eye.sx;
    // 眼角的鱼尾纹（笑起来更深）
    for (const dy of [-1.5, 3]) seg([[ox, eye.y + dy], [ox + s * 3 * eye.sx, eye.y + dy * 1.4], [ox + s * 5.5 * eye.sx, eye.y + dy * 1.9]]);
    // 眼袋：眼睛下面一道弧
    const by = eye.y + 11.5 - 3 * e.happy;
    seg([[eye.x - s * 5 * eye.sx, by], [eye.x + s * 1 * eye.sx, by + 2.4], [eye.x + s * 7 * eye.sx, by]]);
    // 法令纹
    const mx = lerp(0, -26, h.uh);
    seg([[mx + s * 9 * lerp(1, 0.7, h.uh), 22], [mx + s * 12.5 * lerp(1, 0.7, h.uh), 28], [mx + s * 12 * lerp(1, 0.7, h.uh), 34]]);
  }
  if (forehead) {
    const cx = lerp(0, -14, h.uh);
    for (const y of [-34, -28]) seg([[cx - 13, y + 1], [cx, y - 1.2], [cx + 13, y + 1]]);
  }
}

/** 眼镜：round 圆框（老钟）、square 方框（大叔）。镜框有点粗，镜片淡淡一层，右上一道反光 */
export function drawGlasses(ctx: CanvasRenderingContext2D, h: HeadView, ink: Ink, color: string, shape: "round" | "square") {
  const a = h.rig.head.a;
  const rims: { c: V2; rx: number; ry: number }[] = [];
  for (const s of [-1, 1]) {
    const e = eyeAt(s, h.uh);
    rims.push({ c: h.H(e.x, e.y + 1), rx: (shape === "round" ? 12.5 : 13.5) * e.sx, ry: shape === "round" ? 11 : 9.5 });
  }
  const rimPath = (r: (typeof rims)[number]) => {
    const p = new Path2D();
    if (shape === "round") p.ellipse(r.c[0], r.c[1], r.rx, r.ry, a, 0, Math.PI * 2);
    else {
      // 圆角方框
      const k = 3.5;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const P0 = (x: number, y: number): V2 => [r.c[0] + x * c - y * sn, r.c[1] + x * sn + y * c];
      const pts: P[] = [
        [-r.rx, -r.ry + k], [-r.rx, -r.ry], [-r.rx + k, -r.ry, 1], [r.rx - k, -r.ry, 1], [r.rx, -r.ry], [r.rx, -r.ry + k, 1],
        [r.rx, r.ry - k, 1], [r.rx, r.ry], [r.rx - k, r.ry, 1], [-r.rx + k, r.ry, 1], [-r.rx, r.ry], [-r.rx, r.ry - k, 1],
      ];
      smoothPath(pts.map(([x, y, cc]) => [...P0(x, y), ...(cc ? [cc] : [])] as P), true, p);
    }
    return p;
  };
  for (const r of rims) {
    const p = rimPath(r);
    // 镜片：淡淡一层冷色，右上一道反光
    ctx.fillStyle = "rgba(210,228,240,0.22)";
    ctx.fill(p);
    ctx.save();
    ctx.clip(p);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = ink.lw * 0.7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(r.c[0] + r.rx * 0.15, r.c[1] - r.ry * 0.65);
    ctx.lineTo(r.c[0] + r.rx * 0.6, r.c[1] - r.ry * 0.2);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = color;
    ctx.lineWidth = ink.lw * 0.75;
    ctx.stroke(p);
  }
  // 鼻梁上的横梁、往耳朵去的镜腿
  ctx.strokeStyle = color;
  ctx.lineWidth = ink.lw * 0.6;
  ctx.lineCap = "round";
  const [L, R] = rims;
  const inner = (r: (typeof rims)[number], s: number): V2 => [r.c[0] - s * r.rx * Math.cos(a) * 0.98, r.c[1] - s * r.rx * Math.sin(a) * 0.98 - 1.5];
  const pl = inner(L, -1);
  const pr = inner(R, 1);
  ctx.beginPath();
  ctx.moveTo(pl[0], pl[1]);
  ctx.quadraticCurveTo((pl[0] + pr[0]) / 2, (pl[1] + pr[1]) / 2 - 3, pr[0], pr[1]);
  ctx.stroke();
  for (const [r, s] of [
    [L, -1],
    [R, 1],
  ] as const) {
    const o: V2 = [r.c[0] + s * r.rx * Math.cos(a), r.c[1] + s * r.rx * Math.sin(a) - 2];
    // 转到 3/4 时远的那只镜腿藏到脸后面
    if (s < 0 && h.uh > 0.4) continue;
    const ear = h.place([s * 40, 3]);
    ctx.beginPath();
    ctx.moveTo(o[0], o[1]);
    ctx.lineTo(lerp(o[0], ear[0], 0.9), lerp(o[1], ear[1], 0.9));
    ctx.stroke();
  }
}

/** 小胡子（称重员） */
export function drawMustache(ctx: CanvasRenderingContext2D, h: HeadView, ink: Ink, color: string) {
  const cx = lerp(0, -26, h.uh);
  const w = lerp(1, 0.7, h.uh);
  const path = smoothPath(
    ([[-12, 28], [-6, 25.5], [0, 26.5, 1], [6, 25.5], [12, 28], [9, 31], [3, 29.5], [0, 30, 1], [-3, 29.5], [-9, 31]] as P[]).map(
      ([x, y, c]) => [...h.H(cx + x * w, y), ...(c ? [c] : [])] as P,
    ),
  );
  drawPart(ctx, path, color, null, ink, ink.lw * 0.4);
}

/** 胡茬（阿满）：下巴和两腮一片淡淡的青，几个小点 */
export function drawStubble(ctx: CanvasRenderingContext2D, h: HeadView, ink: Ink) {
  const face = h.skins[h.skins.length - 1];
  ctx.save();
  ctx.clip(face);
  const cx = lerp(0, -18, h.uh);
  const c = h.H(cx, 44);
  const g = ctx.createRadialGradient(c[0], c[1], 2, c[0], c[1], 30);
  g.addColorStop(0, "rgba(90,105,120,0.2)");
  g.addColorStop(0.7, "rgba(90,105,120,0.12)");
  g.addColorStop(1, "rgba(90,105,120,0)");
  ctx.fillStyle = g;
  ctx.fillRect(c[0] - 40, c[1] - 40, 80, 80);
  ctx.fillStyle = "rgba(60,62,72,0.4)";
  const dots: V2[] = [[-14, 36], [-9, 40], [-3, 42], [4, 42], [10, 39], [15, 35], [-12, 41], [6, 45], [-5, 46], [0, 38], [12, 43], [-17, 33]];
  for (const [x, y] of dots) {
    const p = h.H(cx + x * lerp(1, 0.75, h.uh), y);
    ctx.beginPath();
    ctx.arc(p[0], p[1], ink.lw * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** 发卡（千斤）：一字夹，夹头一个小星星 */
export function drawHairclip(ctx: CanvasRenderingContext2D, h: HeadView, ink: Ink, color: string, at: [V2, V2] = [[-34, -27], [-17, -33]]) {
  const a = h.place(at[0]);
  const b = h.place(at[1]);
  ctx.strokeStyle = ink.line;
  ctx.lineCap = "round";
  ctx.lineWidth = ink.lw * 2.4;
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = ink.lw * 1.4;
  ctx.stroke();
  // 夹头的小星星
  const c = b;
  const R = 5.2;
  const pts: P[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5 + h.rig.head.a;
    const r = i % 2 ? R * 0.48 : R;
    pts.push([c[0] + Math.cos(ang) * r, c[1] + Math.sin(ang) * r, 1]);
  }
  drawPart(ctx, smoothPath(pts), color, null, ink, ink.lw * 0.45);
}
