// 小红书封面三版的画法（3:4，1080×1440），三个静帧各导入一版：stills/小红书封面1-盯了我三年.ts（她缩在被子里、
// 眼睛往窗外瞟 + 陌生号的通知）、小红书封面2-下面都有他.ts（评论和@ 里一整列同一个灰头像，红笔圈出来）、
// 小红书封面3-是我爸.ts（他收到「爸，这么晚还不睡？」，边哭边笑）。前两版留着悬念，第三版直接把反转说出来。
// 按成片的 1080×1920 设计坐标画，封面是中间 y 240–1680 那一块。第一、三版的画面就是成片那一刻的 act1 / act3（不带
// 歌词），第二版用成片的手机、光斑和小红书界面重新摆。字用成片钩子的样式（站酷快乐体、墨色描边、第二行暖黄）。
// 这里不导出 createScene（不是静帧本身）。
import type { Scene, SceneOptions } from "@frame/engine/types";
import { C, Ctx, F, H, W, beginFrame, blit, buffer, glow, measure, text } from "@materials/s0rrow/code/draw";
import { filmGrain } from "@materials/s0rrow/code/grain";
import { createScene as act1Scene } from "../acts/act1";
import { ACT3_START, createScene as act3Scene } from "../acts/act3";
import { drawPhone, halo, type PhoneSpec } from "../acts/shots";
import { roomBokeh } from "../acts/world";
import { xhsBanner, xhsComments } from "../acts/redbook";
import { ACC_A, DAD_CALLS_HER, wxBanner } from "../acts/ui";

/** the 3:4 cover is this band of the 1080×1920 design */
const TOP = 240;
const BOTTOM = 1680;
/** the film frames are rendered this much denser than the cover (they are zoomed in a little) */
const Q = 1.4;
const YELLOW = "#ffd166";
const PEN = "#ff3348";

/** The cover `page` (0, 1, 2) as a still scene; options.width/height is the still's size (3:4). */
export async function coverScene(options: SceneOptions, page: 0 | 1 | 2): Promise<Scene> {
  const s = options.width / W;
  const film = { ...options, width: Math.round(W * s * Q), height: Math.round(H * s * Q) };
  const scene = page === 0 ? await act1Scene(film) : page === 2 ? await act3Scene(film) : null;
  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext("2d")!;
  const grain = filmGrain();
  return {
    canvas,
    render() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(s, 0, 0, s, 0, -TOP * s);
      if (page === 0) cover1(ctx, scene!);
      else if (page === 1) cover2(ctx);
      else cover3(ctx, scene!);
      // the film's grain and vignette over everything
      const g = buffer(ctx, "coverGrain");
      grain(g, 0.5);
      blit(ctx, g, "overlay", 0.5);
    },
    dispose() {
      scene?.dispose?.();
      canvas.width = canvas.height = 1;
    },
  };
}

// ---------------------------------------------------------------- pieces
/** A film frame (`scene` rendered at its own time `local`) placed so that its design point (fx, fy) sits in the middle of
 *  the canvas, zoomed `z`. */
function still(c: Ctx, scene: Scene, local: number, fx: number, fy: number, z: number) {
  scene.render(local);
  c.save();
  c.imageSmoothingQuality = "high";
  c.translate(W / 2, H / 2);
  c.scale(z, z);
  c.translate(-fx, -fy);
  c.drawImage(scene.canvas, 0, 0, W, H);
  c.restore();
}

/** a dark band behind a headline, fading out toward `to` */
function shade(c: Ctx, from: number, to: number, a: number) {
  const g = c.createLinearGradient(0, from, 0, to);
  g.addColorStop(0, `rgba(8,8,16,${a})`);
  g.addColorStop(0.55, `rgba(8,8,16,${(a * 0.55).toFixed(3)})`);
  g.addColorStop(1, "rgba(8,8,16,0)");
  c.fillStyle = g;
  c.fillRect(0, Math.min(from, to), W, Math.abs(to - from));
}

/** One headline line in the film's hook style, shrunk to fit 960 wide: a soft dark halo, the ink outline, the fill. */
function headline(c: Ctx, s: string, y: number, size: number, fill: string) {
  const sz = size * Math.min(1, 960 / measure(c, s, size, F.cn));
  c.save();
  c.globalAlpha = 0.45;
  text(c, s, W / 2, y + sz * 0.06, { size: sz, font: F.cn, fill: "rgba(0,0,0,0.6)", stroke: "rgba(0,0,0,0.6)", lw: sz * 0.42 });
  c.restore();
  text(c, s, W / 2, y, { size: sz, font: F.cn, fill, stroke: C.ink, lw: sz * 0.2 });
}

/** a phone-screen element (600-wide screen units) drawn big on the cover: its point (sx, sy) lands on (x, y) */
function onCover(c: Ctx, x: number, y: number, k: number, rot: number, sx: number, sy: number, draw: (c: Ctx) => void) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(k, k);
  c.translate(-sx, -sy);
  draw(c);
  c.restore();
}

/** a red-pen loop (ellipse drawn once round and a little past where it started, white under the ink) */
function penLoop(c: Ctx, x: number, y: number, rx: number, ry: number, rot: number, lw = 6) {
  const path = () => {
    c.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = -2.2 + (i / 64) * (Math.PI * 2 + 0.55);
      const wob = 1 + 0.035 * Math.sin(a * 3 + 1) + 0.05 * (i / 64);
      const px = Math.cos(a) * rx * wob, py = Math.sin(a) * ry * wob;
      const X = x + px * Math.cos(rot) - py * Math.sin(rot), Y = y + px * Math.sin(rot) + py * Math.cos(rot);
      i ? c.lineTo(X, Y) : c.moveTo(X, Y);
    }
  };
  c.save();
  c.lineCap = "round";
  c.lineJoin = "round";
  path();
  c.strokeStyle = "rgba(255,255,255,0.9)";
  c.lineWidth = lw + 5;
  c.stroke();
  path();
  c.strokeStyle = PEN;
  c.lineWidth = lw;
  c.stroke();
  c.restore();
}

/** handwriting in red pen (Long Cang) with a white edge */
function pen(c: Ctx, s: string, x: number, y: number, size: number, rot = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  text(c, s, 0, 0, { size, font: F.pen, fill: PEN, stroke: "#fff", lw: size * 0.16 });
  c.restore();
}

/** a red-pen arrow from a to b, bowed by `bend` */
function penArrow(c: Ctx, a: [number, number], b: [number, number], bend: number, lw = 7) {
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  const ang = Math.atan2(b[1] - my, b[0] - mx);
  const head = (k: number) => {
    c.moveTo(b[0] - Math.cos(ang - 0.5) * k, b[1] - Math.sin(ang - 0.5) * k);
    c.lineTo(b[0], b[1]);
    c.lineTo(b[0] - Math.cos(ang + 0.5) * k, b[1] - Math.sin(ang + 0.5) * k);
  };
  for (const [col, w] of [["rgba(255,255,255,0.9)", lw + 5], [PEN, lw]] as [string, number][]) {
    c.save();
    c.lineCap = "round";
    c.lineJoin = "round";
    c.strokeStyle = col;
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(a[0], a[1]);
    c.quadraticCurveTo(mx, my, b[0], b[1]);
    head(30);
    c.stroke();
    c.restore();
  }
}

// ---------------------------------------------------------------- 第一版：盯了我三年
/** Her, hiding behind the duvet, her eyes darting to the window (act1 at 4.4 s, the 表情特写); the hook on top, and the
 *  stranger's first comment as the notification that started it, over the duvet. */
function cover1(c: Ctx, her: Scene) {
  // her eyes at about (535, 750) of the film frame; they land a little under the middle, big enough to read in the feed
  still(c, her, 4.4, 540, 719, 1.3);
  beginFrame(c, 4.4);
  shade(c, TOP - 60, 780, 0.62);
  headline(c, "一个没头像的陌生号", 372, 100, "#fff");
  headline(c, "盯了我三年", 532, 150, YELLOW);
  // the notification, big and a touch tilted, lit from behind by the phone
  glow(c, 540, 1450, 520, "rgba(170,190,255,0.16)");
  onCover(c, 540, 1452, 1.5, -0.025, 300, 170, (k) => xhsBanner(k, 1, { name: ACC_A, body: "这么晚还不睡？", rose: true, details: true }));
}

// ---------------------------------------------------------------- 第二版：下面都有他
/** Her 评论和@ held up close: row after row of the same grey avatar, three years of dates; red pen rings the avatars
 *  and 「瘦了」. */
const P2: PhoneSpec = { cx: 612, cy: 1352, s: 1.1, rot: 0.045 };
function cover2(c: Ctx) {
  beginFrame(c, 3.3);
  roomBokeh(c, 3.3, { dark: 0.3 });
  halo(c, P2, 0.9);
  drawPhone(c, 3.3, P2, (p) => {
    // rows 2–7 (2026-01 back to 2024-12): 又熬夜 · 和谁出去了 · 瘦了 · 别哭 · 到家了吗 · 那个男生是谁
    xhsComments(p, { scroll: 300, time: "02:47" });
    penLoop(p, 64, 548, 56, 352, 0.02, 6);
    penLoop(p, 182, 564, 82, 36, -0.04, 6);
  });
  beginFrame(c, 3.3);
  shade(c, TOP - 60, 760, 0.66);
  headline(c, "我发的每条笔记", 372, 104, "#fff");
  headline(c, "下面都有他", 532, 150, YELLOW);
  // the note in the margin, pointing at the column of grey avatars
  pen(c, "全是", 132, 905, 78, -0.08);
  pen(c, "同一个人", 150, 990, 66, -0.08);
  penArrow(c, [190, 1040], [318, 1120], -0.25);
}

// ---------------------------------------------------------------- 第三版：是我爸
/** Him in the booth, laughing through his tears at the phone (act3 at 44.0 s); her WeChat at the top the way it
 *  dropped onto his lock screen; the reveal at the bottom over his dark coat. */
function cover3(c: Ctx, him: Scene) {
  // his eyes at about (513, 669) of the film frame
  still(c, him, 44.0 - ACT3_START, 540, 698, 1.05);
  beginFrame(c, 44);
  shade(c, TOP - 40, 640, 0.35);
  onCover(c, 540, 446, 1.4, 0, 300, 167, (k) => wxBanner(k, 1, DAD_CALLS_HER, "爸，这么晚还不睡？", true));
  shade(c, BOTTOM + 40, 1150, 0.78);
  headline(c, "被我拉黑的陌生号", 1418, 100, "#fff");
  headline(c, "是我爸", 1572, 170, YELLOW);
}
