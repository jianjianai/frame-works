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
  /** 0..1 over the button's little dip when the like is taken back */
  likeShrink?: number;
  /** pinch zoom: photo point (cx, cy) shown k times bigger at photo point (tx, ty) */
  zoom?: { k: number; cx: number; cy: number; tx?: number; ty?: number };
  /** the overlays (buttons, caption) fade while zooming: 1 shown */
  ui?: number;
  /** 0..1: a yellow highlighter sweeps under the unfolded line (用荧光笔划出要看的那一句) */
  highlight?: number;
}
/** where the folded line sits once unfolded (screen units, left edge and centre line) */
export const MORE_AT: Pt = [30, 1136];
/** where 「展开」 sits on the folded caption, for the thumb */
export function unfoldAt(ctx: Ctx, caption: string): Pt {
  return [30 + measure(ctx, caption, 31, F.ui) + 10 + measure(ctx, "…展开", 29, F.ui, 700) * 0.66, 1136];
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
function likeButton(ctx: Ctx, liked: number, likes: number, pop: number, shrink = 1) {
  const [x, y] = LIKE_AT;
  const k = 1 + 0.32 * Math.sin(Math.PI * clamp(pop)) * (pop < 1 ? 1 : 0) - 0.2 * Math.sin(Math.PI * clamp(shrink)) * (shrink < 1 ? 1 : 0);
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
/** his avatar (on her phone): a round crop of him now, the mop and the sleepy eyes, on blue */
export function hisAvatar(ctx: Ctx, x: number, y: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#bcd6f2";
  ctx.fill();
  ctx.clip();
  drawKid(ctx, x, y + r * 0.32, r / 150, { body: "bust", eyes: "sleepy", mouth: "flat", seed: 63 });
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
  likeButton(ctx, v.liked, v.likes, v.likePop ?? 1, v.likeShrink ?? 1);
  commentButton(ctx, LIKE_AT[0], 822);
  starButton(ctx, LIKE_AT[0], 950);
  shareButton(ctx, LIKE_AT[0], 1074);
  // name, caption (folded), date: unfolding pushes the name and the first line up, the new line takes its place
  const ex = clamp(v.expand ?? 0);
  const up = v.more ? 46 * easeOut(ex) : 0;
  text(ctx, "@" + v.author, 30, 1088 - up, { size: 33, font: F.ui, weight: 700, fill: "#fff", align: "left", shadow: 6 });
  text(ctx, v.caption, 30, 1136 - up, { size: 31, font: F.ui, fill: "#f2f2f2", align: "left", shadow: 6 });
  if (v.more) {
    if (ex < 1) {
      const x = 30 + measure(ctx, v.caption, 31, F.ui) + 10;
      text(ctx, "…展开", x, 1136 - up, { size: 29, font: F.ui, weight: 700, fill: "#d8d8d8", align: "left", shadow: 6, alpha: 1 - ex });
    }
    if (ex > 0) {
      const y = 1136 - up + 46;
      const hl = clamp(v.highlight ?? 0);
      if (hl > 0) {
        // a marker stroke behind the lower half of the words, drawn left to right
        const w = measure(ctx, v.more, 31, F.ui) + 12;
        ctx.save();
        ctx.globalAlpha *= 0.62;
        ctx.strokeStyle = "#ffd23f";
        ctx.lineCap = "round";
        ctx.lineWidth = 24;
        ctx.beginPath();
        ctx.moveTo(26, y + 7);
        ctx.quadraticCurveTo(26 + (w * hl) / 2, y + 4, 26 + w * hl, y + 8);
        ctx.stroke();
        ctx.restore();
      }
      text(ctx, v.more, 30, y, { size: 31, font: F.ui, weight: 700, fill: "#ffffff", align: "left", shadow: 6, alpha: clamp((ex - 0.35) / 0.65) });
    }
  }
  text(ctx, v.date, 30, 1182, { size: 24, font: F.ui, fill: "rgba(235,235,235,0.65)", align: "left" });
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

// ---------------------------------------------------------------- the text-post editor (发文字)
/** where 「发布」 sits (screen units) */
export const PUBLISH_AT: Pt = [515, 120];
export interface PublishView {
  time: string;
  /** what he has typed so far */
  text: string;
  /** a blinking caret after the text */
  caret?: boolean;
  /** 0..1 the 「发布」 button pressed */
  press?: number;
  /** 0..1 the 「发布成功」 toast */
  toast?: number;
}
/** Douyin's text post (文字): the words big on a dusky card, 「发布」 top right, a toast when it's out. */
export function publishScreen(ctx: Ctx, v: PublishView) {
  ctx.fillStyle = "#0d0d0f";
  ctx.fillRect(0, 0, SW, 1280);
  statusBar(ctx, v.time);
  // ×, title, 发布
  ctx.save();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(28, 104);
  ctx.lineTo(56, 132);
  ctx.moveTo(56, 104);
  ctx.lineTo(28, 132);
  ctx.stroke();
  ctx.restore();
  text(ctx, "文字", SW / 2, 120, { size: 32, font: F.ui, weight: 700, fill: "#fff" });
  const pr = clamp(v.press ?? 0);
  ctx.fillStyle = pr > 0.5 ? "#c81f42" : RED;
  rr(ctx, PUBLISH_AT[0] - 60, PUBLISH_AT[1] - 28, 120, 56, 28);
  ctx.fill();
  text(ctx, "发布", PUBLISH_AT[0], PUBLISH_AT[1] + 1, { size: 28, font: F.ui, weight: 700, fill: "#fff" });
  // the card
  ctx.save();
  rr(ctx, 34, 196, 532, 700, 30);
  const g = ctx.createLinearGradient(0, 196, 0, 896);
  g.addColorStop(0, "#2f2a5c");
  g.addColorStop(0.55, "#8a4f7c");
  g.addColorStop(1, "#e08a5c");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  const w = measure(ctx, v.text, 116, F.ui, 700);
  text(ctx, v.text, SW / 2, 540, { size: 116, font: F.ui, weight: 700, fill: "#fff", shadow: 10 });
  if (v.caret) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(SW / 2 + w / 2 + 8, 486, 6, 108);
  }
  text(ctx, "# 添加话题", 60, 950, { size: 28, font: F.ui, fill: "rgba(255,255,255,0.55)", align: "left" });
  text(ctx, "谁可以看 · 公开", 60, 1010, { size: 28, font: F.ui, fill: "rgba(255,255,255,0.55)", align: "left" });
  const t = clamp(v.toast ?? 0);
  if (t > 0) {
    ctx.save();
    ctx.globalAlpha *= Math.min(1, t * 4) * Math.min(1, (1 - t) * 4);
    ctx.fillStyle = "rgba(34,34,38,0.94)";
    rr(ctx, SW / 2 - 150, 600, 300, 150, 22);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(SW / 2 - 24, 652);
    ctx.lineTo(SW / 2 - 6, 670);
    ctx.lineTo(SW / 2 + 26, 636);
    ctx.stroke();
    text(ctx, "发布成功", SW / 2, 712, { size: 30, font: F.ui, weight: 700, fill: "#fff" });
    ctx.restore();
  }
}

// ---------------------------------------------------------------- her profile (主页)
/** the grid's tiles (screen units): 3 columns of 3:4 thumbnails under the header */
export const GRID = { top: 690, w: 198, h: 264, gap: 3 };
export interface ProfileView {
  time: string;
  /** how far the page is scrolled (screen units, 0 = the header at the top) */
  scroll: number;
  /** number of posts */
  count: number;
  /** draws post i's thumbnail (0 = newest) into w × h at the origin */
  tile: (c: Ctx, i: number, w: number, h: number) => void;
  /** like count shown on tile i */
  likes: (i: number) => number;
  /** the tile under his thumb (dims a little) */
  pressed?: number;
}
/** where tile i sits on the page (before scrolling) */
export const tileRect = (i: number): [number, number, number, number] => [
  (i % 3) * (GRID.w + GRID.gap),
  GRID.top + Math.floor(i / 3) * (GRID.h + GRID.gap),
  GRID.w,
  GRID.h,
];
/** Her profile page: cover, avatar, name, bio, counts, 已关注 / 私信, the 作品 tab and the grid of her posts. */
export function profileScreen(ctx: Ctx, v: ProfileView) {
  ctx.fillStyle = "#0d0d0f";
  ctx.fillRect(0, 0, SW, 1280);
  ctx.save();
  ctx.translate(0, -v.scroll);
  // cover: a sunflower field at dusk
  const g = ctx.createLinearGradient(0, 0, 0, 260);
  g.addColorStop(0, "#f2b46c");
  g.addColorStop(1, "#7a5a8e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, 260);
  for (let i = 0; i < 9; i++) {
    const x = 30 + i * 68,
      y = 200 + (i % 2) * 22;
    ctx.fillStyle = "#3c5a2e";
    ctx.fillRect(x - 3, y, 6, 70);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      ctx.fillStyle = "#ffcc33";
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * 14, y + Math.sin(a) * 14, 9, 5, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#6b3e1e";
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(13,13,15,0.25)";
  ctx.fillRect(0, 0, SW, 260);
  herAvatar(ctx, 104, 284, 68);
  text(ctx, "小满", 196, 300, { size: 42, font: F.ui, weight: 700, fill: "#fff", align: "left" });
  text(ctx, "抖音号：xiaoman0609", 196, 346, { size: 23, font: F.ui, fill: "rgba(255,255,255,0.55)", align: "left" });
  text(ctx, "向日葵会一直朝着太阳", 36, 414, { size: 27, font: F.ui, fill: "rgba(255,255,255,0.85)", align: "left" });
  const stats: [string, string][] = [["2.3万", "获赞"], ["128", "关注"], ["1206", "粉丝"]];
  let sx = 36;
  for (const [n, l] of stats) {
    text(ctx, n, sx, 472, { size: 30, font: F.ui, weight: 700, fill: "#fff", align: "left" });
    const w = measure(ctx, n, 30, F.ui, 700);
    text(ctx, l, sx + w + 8, 474, { size: 24, font: F.ui, fill: "rgba(255,255,255,0.55)", align: "left" });
    sx += w + 8 + measure(ctx, l, 24, F.ui) + 36;
  }
  for (const [x, label] of [[36, "已关注"], [314, "私信"]] as [number, string][]) {
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    rr(ctx, x, 518, 250, 64, 10);
    ctx.fill();
    text(ctx, label, x + 125, 551, { size: 27, font: F.ui, weight: 700, fill: "#fff" });
  }
  text(ctx, "作品 " + v.count, 150, 640, { size: 29, font: F.ui, weight: 700, fill: "#fff" });
  text(ctx, "喜欢", 450, 640, { size: 29, font: F.ui, fill: "rgba(255,255,255,0.5)" });
  ctx.fillStyle = "#fff";
  ctx.fillRect(110, 672, 80, 5);
  // the grid: only the rows on screen are drawn
  const first = Math.max(0, Math.floor((v.scroll - GRID.top) / (GRID.h + GRID.gap)) * 3);
  const last = Math.min(v.count, Math.ceil((v.scroll + 1280 - GRID.top) / (GRID.h + GRID.gap) + 1) * 3);
  for (let i = first; i < last; i++) {
    const [x, y, w, h] = tileRect(i);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.translate(x, y);
    v.tile(ctx, i, w, h);
    const sh = ctx.createLinearGradient(0, h - 60, 0, h);
    sh.addColorStop(0, "rgba(0,0,0,0)");
    sh.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = sh;
    ctx.fillRect(0, h - 60, w, 60);
    // a small outlined heart (drawn: the font may not have ♡) and the count
    ctx.save();
    heartPath(ctx, 22, h - 22, 22);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.restore();
    text(ctx, String(v.likes(i)), 38, h - 20, { size: 21, font: F.ui, weight: 700, fill: "#fff", align: "left" });
    if (v.pressed === i) {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }
  ctx.restore();
  // the status bar stays on top, over a dark band once the header has scrolled away
  const band = clamp(v.scroll / 200);
  if (band > 0) {
    ctx.fillStyle = `rgba(13,13,15,${(0.95 * band).toFixed(3)})`;
    ctx.fillRect(0, 0, SW, 90);
  }
  statusBar(ctx, v.time);
}

// ---------------------------------------------------------------- messages (私信)
/** the app's own little icon for notifications: a dark rounded square with a white heart-ish swirl */
function appIcon(ctx: Ctx, x: number, y: number, r: number) {
  ctx.fillStyle = "#111";
  rr(ctx, x - r, y - r, r * 2, r * 2, r * 0.45);
  ctx.fill();
  heartPath(ctx, x, y + 2, r * 1.15);
  ctx.fillStyle = RED;
  ctx.fill();
}
/** a message notification dropping from the top of the screen (k 0..1 in, then it stays) */
export function dmBanner(ctx: Ctx, k: number, title: string, body: string) {
  if (k <= 0) return;
  const y = -150 + 180 * backOut(clamp(k));
  ctx.save();
  ctx.translate(0, y);
  ctx.fillStyle = "rgba(44,44,48,0.96)";
  rr(ctx, 20, 20, SW - 40, 128, 30);
  ctx.fill();
  appIcon(ctx, 74, 84, 30);
  text(ctx, title, 124, 66, { size: 29, font: F.ui, weight: 700, fill: "#fff", align: "left" });
  text(ctx, "现在", SW - 54, 66, { size: 22, font: F.ui, fill: "rgba(255,255,255,0.55)", align: "right" });
  text(ctx, body, 124, 108, { size: 27, font: F.ui, fill: "rgba(255,255,255,0.88)", align: "left" });
  ctx.restore();
}
export type DmItem = { t: "time"; text: string } | { t: "msg"; me?: boolean; text: string };
export interface DmView {
  time: string;
  name: string;
  /** the title reads 「对方正在输入…」 */
  typing: boolean;
  items: DmItem[];
  /** 0..1 her typing bubble (three dots) at the bottom; < 0.01 hidden */
  bubble: number;
  /** for the dots' animation */
  abs: number;
  /** the other person's avatar (default hers: the chat on his phone) */
  other?: (ctx: Ctx, x: number, y: number, r: number) => void;
  /** what is typed in the box (with the keyboard up) */
  draft?: string;
  caret?: boolean;
  keyboard?: boolean;
  /** 0..1 the delete key pressed */
  delHot?: number;
}
/** the keyboard's delete key and the 「发送」 button (screen units), for the thumb */
export const DM_DEL: Pt = [548, 1072];
export const DM_SEND: Pt = [528, 802];
const KB_TOP = 850;
/** a dark phone keyboard (pinyin, so qwerty), from KB_TOP to the bottom; `delHot` lights the delete key */
function dmKeyboard(ctx: Ctx, delHot: number) {
  ctx.fillStyle = "#1c1c1f";
  ctx.fillRect(0, KB_TOP, SW, 1280 - KB_TOP);
  ["qwertyuiop", "asdfghjkl", "zxcvbnm"].forEach((row, r) => {
    const n = row.length,
      kw = 50,
      gap = 7;
    const x0 = (SW - (n * kw + (n - 1) * gap)) / 2;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (kw + gap),
        y = KB_TOP + 18 + r * 92;
      ctx.fillStyle = "#3a3a3d";
      rr(ctx, x, y, kw, 76, 9);
      ctx.fill();
      text(ctx, row[i], x + kw / 2, y + 40, { size: 30, font: F.ui, fill: "#ececec" });
    }
  });
  // shift and delete either side of the last letter row
  const y3 = KB_TOP + 18 + 2 * 92;
  ctx.fillStyle = "#2a2a2d";
  rr(ctx, 12, y3, 68, 76, 9);
  ctx.fill();
  ctx.fillStyle = delHot > 0.01 ? `rgb(${Math.round(42 + 60 * delHot)},${Math.round(42 + 60 * delHot)},${Math.round(45 + 60 * delHot)})` : "#2a2a2d";
  rr(ctx, SW - 80, y3, 68, 76, 9);
  ctx.fill();
  ctx.save();
  ctx.strokeStyle = "#ececec";
  ctx.lineWidth = 3.5;
  ctx.lineJoin = "round";
  const [dx, dy] = DM_DEL;
  ctx.beginPath();
  ctx.moveTo(dx - 20, dy);
  ctx.lineTo(dx - 9, dy - 13);
  ctx.lineTo(dx + 18, dy - 13);
  ctx.lineTo(dx + 18, dy + 13);
  ctx.lineTo(dx - 9, dy + 13);
  ctx.closePath();
  ctx.moveTo(dx - 1, dy - 6);
  ctx.lineTo(dx + 11, dy + 6);
  ctx.moveTo(dx + 11, dy - 6);
  ctx.lineTo(dx - 1, dy + 6);
  ctx.stroke();
  ctx.restore();
  // the bottom row: 123, the space bar, 换行
  const y4 = KB_TOP + 18 + 3 * 92;
  ctx.fillStyle = "#2a2a2d";
  rr(ctx, 12, y4, 110, 76, 9);
  ctx.fill();
  rr(ctx, SW - 122, y4, 110, 76, 9);
  ctx.fill();
  ctx.fillStyle = "#3a3a3d";
  rr(ctx, 134, y4, SW - 268, 76, 9);
  ctx.fill();
  text(ctx, "123", 67, y4 + 40, { size: 26, font: F.ui, fill: "#ececec" });
  text(ctx, "换行", SW - 67, y4 + 40, { size: 26, font: F.ui, fill: "#ececec" });
  text(ctx, "空格", SW / 2, y4 + 40, { size: 26, font: F.ui, fill: "rgba(236,236,236,0.7)" });
}
/** where her last message bubble sits (screen units), so a camera can find it */
export const DM_BUBBLE: Pt = [250, 470];
/** The chat with her (dark): newest at the top of the conversation area under the title, her avatar left, the three
 *  dots of her typing at the bottom. */
export function dmScreen(ctx: Ctx, v: DmView) {
  ctx.fillStyle = "#0f0f11";
  ctx.fillRect(0, 0, SW, 1280);
  // title bar
  ctx.fillStyle = "#18181b";
  ctx.fillRect(0, 0, SW, 160);
  statusBar(ctx, v.time);
  chevron(ctx, 40, 122);
  if (v.typing) {
    const blink = 0.55 + 0.45 * Math.abs(Math.sin(v.abs * 4.5));
    text(ctx, "对方正在输入…", SW / 2, 122, { size: 31, font: F.ui, weight: 700, fill: "#7cd3ff", alpha: blink });
  } else text(ctx, v.name, SW / 2, 122, { size: 31, font: F.ui, weight: 700, fill: "#fff" });
  ctx.fillStyle = "#fff";
  for (const d of [-14, 0, 14]) {
    ctx.beginPath();
    ctx.arc(556 + d, 122, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // the conversation, from the top
  let y = 240;
  for (const it of v.items) {
    if (it.t === "time") {
      text(ctx, it.text, SW / 2, y, { size: 22, font: F.ui, fill: "rgba(255,255,255,0.4)" });
      y += 70;
      continue;
    }
    const w = measure(ctx, it.text, 33, F.ui) + 48;
    const bx = it.me ? SW - 120 - w : 120;
    if (!it.me) (v.other ?? herAvatar)(ctx, 66, y + 34, 32);
    ctx.fillStyle = it.me ? "#3b82f6" : "#2c2c30";
    rr(ctx, bx, y, w, 70, 18);
    ctx.fill();
    text(ctx, it.text, bx + 24, y + 36, { size: 33, font: F.ui, fill: "#fff", align: "left" });
    y += 100;
  }
  // her typing bubble, right under the last message (so it stays in the top half, clear of the lyrics)
  const b = clamp(v.bubble);
  if (b > 0.01) {
    ctx.save();
    ctx.globalAlpha *= b;
    const by = y + 20;
    (v.other ?? herAvatar)(ctx, 66, by + 34, 32);
    ctx.fillStyle = "#2c2c30";
    rr(ctx, 120, by, 130, 70, 18);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const a = 0.35 + 0.65 * Math.max(0, Math.sin(v.abs * 7 - i * 0.9));
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(157 + i * 28, by + 35 - 5 * Math.max(0, Math.sin(v.abs * 7 - i * 0.9)), 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  // input bar (above the keyboard when it is up): the draft, the caret and a 「发送」 button once there is text
  const top = v.keyboard ? KB_TOP - 96 : 1160;
  ctx.fillStyle = "#18181b";
  ctx.fillRect(0, top, SW, 1280 - top);
  ctx.fillStyle = "#2a2a2e";
  rr(ctx, 30, top + 26, v.draft ? 416 : 440, 66, 33);
  ctx.fill();
  if (v.draft) {
    text(ctx, v.draft, 60, top + 60, { size: 31, font: F.ui, fill: "#fff", align: "left" });
    ctx.fillStyle = RED;
    rr(ctx, DM_SEND[0] - 62, top + 30, 124, 58, 29);
    ctx.fill();
    text(ctx, "发送", DM_SEND[0], top + 60, { size: 27, font: F.ui, weight: 700, fill: "#fff" });
  } else text(ctx, "发送消息…", 62, top + 60, { size: 27, font: F.ui, fill: "rgba(255,255,255,0.4)", align: "left" });
  if (v.caret) {
    ctx.fillStyle = "#4ea1ff";
    ctx.fillRect(60 + (v.draft ? measure(ctx, v.draft, 31, F.ui) + 3 : 0), top + 40, 3.5, 40);
  }
  if (v.keyboard) dmKeyboard(ctx, v.delHot ?? 0);
}

// ---------------------------------------------------------------- her lock screen
export interface LockView {
  time: string;
  date: string;
  /** draws the wallpaper into SW × 1280 at the origin */
  wallpaper: (c: Ctx, w: number, h: number) => void;
  /** notifications on the lock screen: [title, body, when] */
  notes: [string, string, string][];
}
/** A lock screen: the wallpaper, the big clock and date, notification cards under them. */
export function lockScreen(ctx: Ctx, v: LockView) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, SW, 1280);
  ctx.clip();
  v.wallpaper(ctx, SW, 1280);
  const g = ctx.createLinearGradient(0, 0, 0, 560);
  g.addColorStop(0, "rgba(0,0,0,0.45)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, 560);
  ctx.restore();
  statusBar(ctx, "");
  text(ctx, v.date, SW / 2, 214, { size: 30, font: F.ui, weight: 700, fill: "rgba(255,255,255,0.92)", shadow: 8 });
  text(ctx, v.time, SW / 2, 330, { size: 170, font: F.ui, weight: 700, fill: "#fff", shadow: 12 });
  v.notes.forEach(([title, body, when], i) => {
    const y = 470 + i * 150;
    ctx.fillStyle = "rgba(40,40,46,0.78)";
    rr(ctx, 24, y, SW - 48, 128, 30);
    ctx.fill();
    appIcon(ctx, 80, y + 64, 30);
    text(ctx, title, 132, y + 46, { size: 29, font: F.ui, weight: 700, fill: "#fff", align: "left" });
    text(ctx, when, SW - 56, y + 46, { size: 22, font: F.ui, fill: "rgba(255,255,255,0.55)", align: "right" });
    text(ctx, body, 132, y + 88, { size: 27, font: F.ui, fill: "rgba(255,255,255,0.88)", align: "left" });
  });
}

// ---------------------------------------------------------------- 「…」 menu on her own post, and the private post
/** where the menu's rows sit (screen units): 删除, 权限设置 → 仅自己可见 */
export const MENU_DELETE: Pt = [300, 1000];
export const MENU_PRIVATE: Pt = [300, 1104];
/** the 「…」 button on the post page (top right) */
export const MORE_BTN: Pt = [556, 122];
/** The sheet that slides up over her post when she taps 「…」: share row, then 删除 (red) and 仅自己可见. `k` 0..1 in;
 *  `hot` 0..1 lights a row under her thumb (which row: `row`). */
export function postMenu(ctx: Ctx, k: number, row: "delete" | "private" | null, hot: number) {
  if (k <= 0) return;
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${(0.45 * clamp(k)).toFixed(3)})`;
  ctx.fillRect(0, 0, SW, 1280);
  const y0 = 700 + 580 * (1 - easeOut(clamp(k)));
  ctx.translate(0, y0 - 700);
  ctx.fillStyle = "#232326";
  rr(ctx, 0, 700, SW, 640, 34);
  ctx.fill();
  text(ctx, "分享给朋友", 40, 760, { size: 26, font: F.ui, fill: "rgba(255,255,255,0.55)", align: "left" });
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = ["#2e9cf0", "#07c160", "#ffb72b", "#ff5a7a", "#8a6cf0"][i];
    ctx.beginPath();
    ctx.arc(80 + i * 110, 840, 40, 0, Math.PI * 2);
    ctx.fill();
  }
  const rows: [Pt, string, string, "delete" | "private"][] = [
    [MENU_DELETE, "删除", "#ff4d6a", "delete"],
    [MENU_PRIVATE, "设为仅自己可见", "#ffffff", "private"],
  ];
  for (const [[x, y], label, col, id] of rows) {
    ctx.fillStyle = row === id && hot > 0 ? `rgba(255,255,255,${(0.1 + 0.1 * hot).toFixed(3)})` : "rgba(255,255,255,0.06)";
    rr(ctx, 30, y - 44, SW - 60, 88, 18);
    ctx.fill();
    text(ctx, label, x, y + 2, { size: 31, font: F.ui, weight: 700, fill: col });
  }
  text(ctx, "取消", SW / 2, 1210, { size: 29, font: F.ui, fill: "rgba(255,255,255,0.7)" });
  ctx.restore();
}
/** a toast in the middle of the screen with a lock (k 0..1: in, hold, out) */
export function toast(ctx: Ctx, k: number, label: string) {
  if (k <= 0 || k >= 1) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, k * 5) * Math.min(1, (1 - k) * 5);
  const w = Math.max(320, measure(ctx, label, 34, F.ui, 700) + 90);
  ctx.fillStyle = "rgba(30,30,34,0.96)";
  rr(ctx, SW / 2 - w / 2, 500, w, 190, 26);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  rr(ctx, SW / 2 - 24, 546, 48, 40, 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(SW / 2, 546, 15, Math.PI, 0);
  ctx.stroke();
  text(ctx, label, SW / 2, 640, { size: 34, font: F.ui, weight: 700, fill: "#fff" });
  ctx.restore();
}
/** her post as he sees it once she has made it private: the photo gone grey, a lock and 「作品已设为私密」 (k 0..1) */
export function privateOver(ctx: Ctx, k: number) {
  if (k <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(k);
  ctx.fillStyle = "#151517";
  ctx.fillRect(0, 160, SW, 1120);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  rr(ctx, SW / 2 - 46, 556, 92, 76, 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(SW / 2, 556, 30, Math.PI, 0);
  ctx.stroke();
  text(ctx, "作品已设为私密", SW / 2, 700, { size: 33, font: F.ui, weight: 700, fill: "rgba(255,255,255,0.8)" });
  text(ctx, "仅作者自己可见", SW / 2, 752, { size: 25, font: F.ui, fill: "rgba(255,255,255,0.45)" });
  ctx.restore();
}

// ---------------------------------------------------------------- his text post 「算了。」
export interface TextPostView {
  time: string;
  author: string;
  text: string;
  date: string;
  liked: number;
  likes: number;
  likePop?: number;
  avatar: (ctx: Ctx, x: number, y: number, r: number) => void;
}
/** His text post as a post page: the words big on the dusky card (as he published it), the buttons down the right. */
export function textPostScreen(ctx: Ctx, v: TextPostView) {
  ctx.fillStyle = "#0d0d0f";
  ctx.fillRect(0, 0, SW, 1280);
  ctx.save();
  rr(ctx, 0, 196, SW, 800, 0);
  const g = ctx.createLinearGradient(0, 196, 0, 996);
  g.addColorStop(0, "#2f2a5c");
  g.addColorStop(0.55, "#8a4f7c");
  g.addColorStop(1, "#e08a5c");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  text(ctx, v.text, SW / 2 - 30, 590, { size: 120, font: F.ui, weight: 700, fill: "#fff", shadow: 10 });
  statusBar(ctx, v.time);
  chevron(ctx, 40, 122);
  v.avatar(ctx, LIKE_AT[0], 566, 40);
  likeButton(ctx, v.liked, v.likes, v.likePop ?? 1, 1);
  commentButton(ctx, LIKE_AT[0], 822);
  starButton(ctx, LIKE_AT[0], 950);
  shareButton(ctx, LIKE_AT[0], 1074);
  text(ctx, "@" + v.author, 30, 1088, { size: 33, font: F.ui, weight: 700, fill: "#fff", align: "left", shadow: 6 });
  text(ctx, v.date, 30, 1182, { size: 24, font: F.ui, fill: "rgba(235,235,235,0.65)", align: "left" });
}
