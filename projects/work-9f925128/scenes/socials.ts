// 抖音风格的图文作品页（深色，600×1280 屏幕坐标，画在素材库 mirrors/phoneui 的 phone() 里）：照片、右侧的头像 / 赞 / 评论 /
// 收藏 / 分享，左下的昵称、配文（第二行折叠在「展开」里）、日期，底部评论框；双击时的大爱心 heartBurst。
// 以后的片子也会用到：定稿后搬进素材库。
import { clamp } from "@frame/engine/math";
import { C, Ctx, F, Pt, backOut, blob, easeOut, inkLine, measure, paint, rr, text } from "@materials/s0rrow/code/draw";
import { drawKid } from "@materials/s0rrow/code/kid";
import { SW, statusBar } from "@materials/s0rrow/code/mirrors/phoneui";

/** where the photo sits on the screen (600 wide, 3:4) */
export const PHOTO = { x: 0, y: 196, w: 600, h: 800 };
/** the like button (screen units) */
export const LIKE_AT: Pt = [536, 690];
const RED = "#fe2c55";

export interface PostView {
  /** status bar clock */
  time: string;
  /** draws the photo into w × h at the origin */
  photo: (c: Ctx, w: number, h: number) => void;
  author: string;
  caption: string;
  /** the folded second line, shown as `expand` goes 0 → 1 */
  more?: string;
  expand?: number;
  date: string;
  /** 0 white … 1 red */
  liked: number;
  /** like count; 0 shows 「赞」 */
  likes: number;
  /** 0..1 over the like button's bounce */
  likePop?: number;
  /** pinch zoom: photo point (cx, cy) shown k times bigger at photo point (tx, ty) */
  zoom?: { k: number; cx: number; cy: number; tx?: number; ty?: number };
  /** the overlays (buttons, caption) fade while zooming: 1 shown */
  ui?: number;
}

// ---------------------------------------------------------------- icons (clean UI shapes)
function heartPath(ctx: Ctx, cx: number, cy: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + 0.44 * s);
  ctx.bezierCurveTo(cx - 0.66 * s, cy + 0.02 * s, cx - 0.58 * s, cy - 0.54 * s, cx - 0.27 * s, cy - 0.54 * s);
  ctx.bezierCurveTo(cx - 0.1 * s, cy - 0.54 * s, cx, cy - 0.42 * s, cx, cy - 0.3 * s);
  ctx.bezierCurveTo(cx, cy - 0.42 * s, cx + 0.1 * s, cy - 0.54 * s, cx + 0.27 * s, cy - 0.54 * s);
  ctx.bezierCurveTo(cx + 0.58 * s, cy - 0.54 * s, cx + 0.66 * s, cy + 0.02 * s, cx, cy + 0.44 * s);
  ctx.closePath();
}
const mix = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * clamp(t))).join(",")})`;
function shadowed(ctx: Ctx, draw: () => void) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  draw();
  ctx.restore();
}
function label(ctx: Ctx, s: string, x: number, y: number) {
  text(ctx, s, x, y, { size: 23, font: F.ui, weight: 700, fill: "#fff", shadow: 6 });
}
/** the like button: white heart → red with a bounce and a few sparks */
function likeButton(ctx: Ctx, liked: number, likes: number, pop: number) {
  const [x, y] = LIKE_AT;
  const k = 1 + 0.32 * Math.sin(Math.PI * clamp(pop)) * (pop < 1 ? 1 : 0);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  shadowed(ctx, () => {
    heartPath(ctx, 0, 0, 62);
    ctx.fillStyle = mix([250, 250, 250], [254, 44, 85], liked);
    ctx.fill();
  });
  ctx.restore();
  if (pop > 0 && pop < 1) {
    // sparks flying out of the button
    ctx.save();
    ctx.strokeStyle = RED;
    ctx.lineCap = "round";
    ctx.lineWidth = 4;
    ctx.globalAlpha *= 1 - pop;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
      const r0 = 40 + 30 * easeOut(pop),
        r1 = r0 + 14 * (1 - pop);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
      ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.restore();
  }
  label(ctx, likes > 0 ? String(likes) : "赞", x, y + 52);
}
function commentButton(ctx: Ctx, x: number, y: number) {
  shadowed(ctx, () => {
    ctx.beginPath();
    ctx.ellipse(x, y - 2, 32, 27, 0, 0, Math.PI * 2);
    ctx.moveTo(x - 20, y + 18);
    ctx.lineTo(x - 26, y + 34);
    ctx.lineTo(x - 6, y + 22);
    ctx.fillStyle = "#fafafa";
    ctx.fill();
  });
  ctx.fillStyle = "#2a2a2e";
  for (const d of [-13, 0, 13]) {
    ctx.beginPath();
    ctx.arc(x + d, y - 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  label(ctx, "评论", x, y + 52);
}
function starButton(ctx: Ctx, x: number, y: number) {
  shadowed(ctx, () => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 15 : 34;
      ctx.lineTo(x + Math.cos(a) * r, y + 2 + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#fafafa";
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.fillStyle = "#fafafa";
    ctx.fill();
  });
  label(ctx, "收藏", x, y + 52);
}
function shareButton(ctx: Ctx, x: number, y: number) {
  shadowed(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(x + 30, y - 4);
    ctx.lineTo(x + 4, y - 30);
    ctx.lineTo(x + 4, y - 15);
    ctx.bezierCurveTo(x - 22, y - 14, x - 32, y + 6, x - 30, y + 28);
    ctx.bezierCurveTo(x - 20, y + 10, x - 6, y + 6, x + 4, y + 7);
    ctx.lineTo(x + 4, y + 22);
    ctx.closePath();
    ctx.fillStyle = "#fafafa";
    ctx.fill();
  });
  label(ctx, "分享", x, y + 52);
}
/** her avatar: a round crop of her smiling, on pink */
export function herAvatar(ctx: Ctx, x: number, y: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd9e2";
  ctx.fill();
  ctx.clip();
  drawKid(ctx, x, y + r * 0.3, r / 150, { who: "girl", body: "bust", outfit: "cardigan", eyes: "happy", mouth: "smile", seed: 61 });
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  ctx.stroke();
}
function chevron(ctx: Ctx, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 18);
  ctx.lineTo(x - 6, y);
  ctx.lineTo(x + 10, y + 18);
  ctx.stroke();
  ctx.restore();
}
function searchIcon(ctx: Ctx, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x - 4, y - 4, 15, 0, Math.PI * 2);
  ctx.moveTo(x + 7, y + 7);
  ctx.lineTo(x + 17, y + 17);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- the page
/** The post page (dark): the photo full width, the buttons down the right, name / caption / date bottom left. */
export function postScreen(ctx: Ctx, v: PostView) {
  ctx.fillStyle = "#0d0d0f";
  ctx.fillRect(0, 0, SW, 1280);
  // the photo (pinch zoom keeps it inside its frame)
  ctx.save();
  ctx.beginPath();
  ctx.rect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
  ctx.clip();
  ctx.translate(PHOTO.x, PHOTO.y);
  if (v.zoom) {
    const { k, cx, cy } = v.zoom;
    ctx.translate(v.zoom.tx ?? cx, v.zoom.ty ?? cy);
    ctx.scale(k, k);
    ctx.translate(-cx, -cy);
  }
  v.photo(ctx, PHOTO.w, PHOTO.h);
  ctx.restore();
  const ui = clamp(v.ui ?? 1);
  if (ui <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= ui;
  // legibility gradients
  let g = ctx.createLinearGradient(0, 0, 0, 250);
  g.addColorStop(0, "rgba(0,0,0,0.6)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, 250);
  g = ctx.createLinearGradient(0, 880, 0, 1280);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 880, SW, 400);
  statusBar(ctx, v.time);
  chevron(ctx, 40, 122);
  searchIcon(ctx, 486, 120);
  ctx.fillStyle = "#fff";
  for (const d of [-14, 0, 14]) {
    ctx.beginPath();
    ctx.arc(556 + d, 122, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // right column
  herAvatar(ctx, LIKE_AT[0], 566, 40);
  likeButton(ctx, v.liked, v.likes, v.likePop ?? 1);
  commentButton(ctx, LIKE_AT[0], 822);
  starButton(ctx, LIKE_AT[0], 950);
  shareButton(ctx, LIKE_AT[0], 1074);
  // name, caption (folded), date
  const ex = clamp(v.expand ?? 0);
  text(ctx, "@" + v.author, 30, 1088, { size: 33, font: F.ui, weight: 700, fill: "#fff", align: "left", shadow: 6 });
  text(ctx, v.caption, 30, 1136, { size: 31, font: F.ui, fill: "#f2f2f2", align: "left", shadow: 6 });
  if (v.more) {
    if (ex < 1) {
      const x = 30 + measure(ctx, v.caption, 31, F.ui) + 10;
      text(ctx, "…展开", x, 1136, { size: 29, font: F.ui, weight: 700, fill: "#d8d8d8", align: "left", shadow: 6, alpha: 1 - ex });
    }
    if (ex > 0) text(ctx, v.more, 30, 1136 + 46 * easeOut(ex), { size: 31, font: F.ui, fill: "#f2f2f2", align: "left", shadow: 6, alpha: ex });
  }
  text(ctx, v.date, 30, 1182 + (v.more ? 46 * easeOut(ex) : 0), { size: 24, font: F.ui, fill: "rgba(235,235,235,0.65)", align: "left" });
  // comment bar
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  rr(ctx, 24, 1226, 404, 40, 20);
  ctx.fill();
  text(ctx, "善语结善缘，恶言伤人心", 46, 1247, { size: 22, font: F.ui, fill: "rgba(255,255,255,0.45)", align: "left" });
  ctx.restore();
}

/** Douyin's double-tap heart: pops at (x, y) tilted by `rot`, holds, then floats up, grows and fades. k 0..1 over
 *  about 0.9 s. Hand-drawn (ink outline), with a few sparks as it lands. */
export function heartBurst(ctx: Ctx, x: number, y: number, k: number, rot = -0.15, size = 150, seed = 4100) {
  if (k <= 0 || k >= 1) return;
  const inK = backOut(clamp(k / 0.2));
  const outK = clamp((k - 0.55) / 0.45);
  const s = size * (inK * 1.0 + 0.55 * easeOut(outK));
  ctx.save();
  ctx.translate(x, y - 70 * easeOut(outK));
  ctx.rotate(rot);
  ctx.globalAlpha *= 1 - outK;
  ctx.scale(s / 100, s / 100);
  blob(ctx, [[0, 42], [-30, 18], [-52, -6], [-52, -32], [-34, -50], [-12, -48], [0, -32], [12, -48], [34, -50], [52, -32], [52, -6], [30, 18]], seed, 0.9);
  paint(ctx, RED, C.ink, 5);
  // a shine on the upper left lobe
  blob(ctx, [[-38, -30], [-30, -40], [-18, -38], [-30, -24]], seed + 1, 0.4);
  paint(ctx, "rgba(255,255,255,0.75)", null);
  ctx.restore();
  // sparks as it lands
  const sp = clamp((k - 0.04) / 0.32);
  if (sp > 0 && sp < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - sp;
    for (let i = 0; i < 6; i++) {
      const a = rot - Math.PI / 2 + (i - 2.5) * 0.5;
      const r0 = size * (0.62 + 0.4 * easeOut(sp)),
        r1 = r0 + size * 0.18 * (1 - sp);
      inkLine(ctx, [[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]], seed + 10 + i, 6, "#ffd166", 0.5);
    }
    ctx.restore();
  }
}
