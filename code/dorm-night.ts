/**
 * 宿舍夜晚·近景（《屏蔽》回忆里室友笑她爸的评论那一镜）：只画一个近景需要的东西——左边雪夜的窗（月亮、对面楼的暖窗、雪、
 * 窗帘），右上床铺的栏杆和夹灯（主光，一道光柱照下来）、一小格书架和绿植、顶上一串下垂的串灯；夜色直接用暗色画，
 * 不靠压暗调色（把整间亮宿舍 multiply 压暗会糊成灰紫色的泥）。人物在它之后画，前景桌沿 dormNightDesk 在人物之后画。
 * 画面坐标 1080×1920；用作近景背景时整张 blur 3px，运镜时背景跟镜头动 0.45。
 */
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { Ctx, H, Pt, W, beginFrame, blob, fillBg, glow, hash, inkLine, lightShaft, loadFonts, oval, paint, poly, rbox, vgrad } from "./draw";
import { desk } from "./sets";
import { snow } from "./blocked/snow";

export const dormNightOptions = z.object({
  snow: z.boolean().default(true).describe("窗外下雪"),
});
export type DormNightOptions = z.input<typeof dormNightOptions>;
export const dormNightDeskOptions = z.object({
  mug: z.boolean().default(true).describe("桌上右边的粉色杯子（冒热气）"),
});
export type DormNightDeskOptions = z.input<typeof dormNightDeskOptions>;

/** the window on the left (the roommates sit under it, lit from behind) */
export const DORM_NIGHT_WINDOW = { x0: 60, y0: 250, x1: 520, y1: 700 };
/** the clip lamp on her bunk's rail: the key light on whoever sits at her desk */
export const DORM_NIGHT_LAMP: Pt = [936, 352];

/** The dorm at night, close: the snowy window with the city on the left, her bunk with a clip lamp on the right, a
 *  shelf and a plant, fairy lights sagging across the top. Screen coordinates; draw it first, figures after. */
export function dormNight(c: Ctx, abs: number, o: DormNightOptions = {}) {
  const LAMP = DORM_NIGHT_LAMP;
  fillBg(c, vgrad(c, 0, H, [[0, "#1b1322"], [0.3, "#2a1d2d"], [0.62, "#35252f"], [1, "#1f161d"]]));
  // the lamp's warmth on the wall behind her, the window's cold on the left
  glow(c, LAMP[0] - 60, LAMP[1] + 300, 700, "rgba(255,178,110,0.3)");
  glow(c, 290, 760, 560, "rgba(120,150,220,0.14)");
  // ---- the window
  const { x0, y0, x1, y1 } = DORM_NIGHT_WINDOW;
  rbox(c, x0 - 22, y0 - 22, x1 - x0 + 44, y1 - y0 + 44, 10, 95001, 0.4);
  paint(c, "#2c2333", "#120c16", 4);
  c.save();
  rbox(c, x0, y0, x1 - x0, y1 - y0, 6, 95002, 0.3);
  c.clip();
  fillBg(c, vgrad(c, y0, y1, [[0, "#162544"], [0.6, "#2e4268"], [1, "#4c5c80"]]));
  // the moon, high on the right of the glass
  glow(c, 420, 330, 150, "rgba(205,220,255,0.45)");
  oval(c, 420, 330, 24, 24, 95003, 0.3);
  paint(c, "#eef1f7", null);
  // the city across the campus: blocks with a few warm windows, the nearest darkest
  for (let i = 0; i < 7; i++) {
    const bx = x0 - 30 + i * 74,
      bh = 120 + hash(i * 3.1 + 2) * 150,
      by = y1 - bh;
    c.fillStyle = i % 2 ? "#18223d" : "#1e2a47";
    c.fillRect(bx, by, 66, bh);
    for (let r = 0; r < 6; r++)
      for (let q = 0; q < 3; q++) {
        if (hash(i * 7.3 + r * 2.9 + q * 1.7) < 0.62) continue;
        c.fillStyle = "rgba(255,206,130,0.85)";
        c.fillRect(bx + 9 + q * 19, by + 16 + r * 26, 8, 11);
      }
  }
  // snow on the roofs and in the air
  c.fillStyle = "rgba(220,228,245,0.55)";
  c.fillRect(x0, y1 - 14, x1 - x0, 14);
  if (o.snow ?? true) snow(c, abs, { x: x0, y: y0, w: x1 - x0, h: y1 - y0, n: 40, seed: 95, speed: 45, size: 3, alpha: 0.75, drift: 12 });
  c.restore();
  for (const x of [(x0 + x1) / 2 - 5]) {
    rbox(c, x, y0, 10, y1 - y0, 2, 95010, 0.2);
    paint(c, "#3a3242", "#120c16", 2);
  }
  rbox(c, x0, (y0 + y1) / 2 - 4, x1 - x0, 9, 2, 95011, 0.2);
  paint(c, "#3a3242", "#120c16", 2);
  // the sill catches the window's light
  poly(c, [[x0 - 34, y1 + 18], [x1 + 34, y1 + 18], [x1 + 44, y1 + 40], [x0 - 44, y1 + 40]], 95012, 0.4);
  paint(c, "#4a4458", "#120c16", 3);
  inkLine(c, [[x0 - 30, y1 + 20], [x1 + 30, y1 + 20]], 95013, 2.5, "rgba(170,195,245,0.6)", 0.2);
  // curtains, gathered at both sides, the window's light along their inner folds
  for (const [cx, dir] of [[x0 - 30, 1], [x1 + 30, -1]] as [number, number][]) {
    const pts: Pt[] = [[cx - 40 * dir, y0 - 60], [cx + 34 * dir, y0 - 60], [cx + 20 * dir, y0 + 200], [cx + 30 * dir, y1 + 60], [cx - 46 * dir, y1 + 64], [cx - 52 * dir, y0 + 210]];
    poly(c, pts, 95020 + cx, 0.8);
    paint(c, "#6b3e52", "#170e15", 3.5);
    for (let i = 0; i < 4; i++) inkLine(c, [[cx - 30 * dir + i * 14 * dir, y0 - 50], [cx - 28 * dir + i * 12 * dir, y1 + 50]], 95030 + cx + i, 2, i % 2 ? "rgba(30,14,26,0.4)" : "rgba(190,150,190,0.22)", 0.4);
    inkLine(c, [[cx + 30 * dir, y0 - 50], [cx + 18 * dir, y0 + 200], [cx + 26 * dir, y1 + 50]], 95040 + cx, 3, "rgba(150,175,235,0.45)", 0.4);
  }
  inkLine(c, [[x0 - 90, y0 - 64], [x1 + 90, y0 - 64]], 95050, 6, "#151018", 0.2);
  // ---- her bunk up on the right: the rail, the mattress, her pink bed curtain pulled to the side
  poly(c, [[650, 150], [1140, 150], [1140, 318], [650, 318]], 95060, 0.4);
  paint(c, "#2a1f2b", "#120c16", 3);
  blob(c, [[690, 230], [760, 196], [1140, 200], [1140, 290], [690, 292]], 95061, 0.8);
  paint(c, "#7a5a75", "#1a1019", 3);
  for (const y of [300, 330]) {
    rbox(c, 640, y, 520, 16, 4, 95062 + y, 0.4);
    paint(c, "#5c5a6a", "#120c16", 3);
    inkLine(c, [[650, y + 3], [1140, y + 3]], 95064 + y, 2, "rgba(255,210,160,0.5)", 0.2);
  }
  poly(c, [[1010, 90], [1140, 90], [1140, 620], [1090, 640], [1040, 610], [1000, 330]], 95066, 0.6);
  paint(c, "#8a4d66", "#1a1019", 3.5);
  for (let i = 0; i < 4; i++) inkLine(c, [[1020 + i * 28, 100], [1012 + i * 30, 600]], 95067 + i, 1.8, "rgba(40,16,30,0.35)", 0.4);
  // the ladder down to her desk
  for (const x of [668, 712]) {
    inkLine(c, [[x, 330], [x, 1300]], 95070 + x, 9, "#3c3848", 0.3);
    inkLine(c, [[x - 2, 335], [x - 2, 1290]], 95071 + x, 2.5, "rgba(255,200,150,0.35)", 0.2);
  }
  for (let y = 440; y < 1300; y += 120) inkLine(c, [[668, y], [712, y]], 95072 + y, 8, "#3c3848", 0.2);
  // a small shelf under the bunk: a few books and a little plant, warm in the lamplight
  rbox(c, 760, 560, 330, 18, 3, 95080, 0.3);
  paint(c, "#6a4e3c", "#1a1019", 3);
  let bx = 790;
  for (const [w, h, col] of [[26, 96, "#b0745e"], [32, 112, "#5d7aa0"], [22, 86, "#c9a660"], [30, 104, "#8a5a78"]] as [number, number, string][]) {
    rbox(c, bx, 560 - h, w, h, 2, 95081 + bx, 0.3);
    paint(c, col, "#1a1019", 2.2);
    bx += w + 4;
  }
  poly(c, [[972, 520], [1010, 520], [1004, 560], [978, 560]], 95090, 0.3);
  paint(c, "#a8765a", "#1a1019", 2);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.45;
    oval(c, 991 + Math.cos(a) * 22, 506 + Math.sin(a) * 22, 8, 20, 95091 + i, 0.4, a + Math.PI / 2);
    paint(c, "#6f8d62", "#1a1019", 1.6);
  }
  // the clip lamp on the rail, and its cone of light down over her desk
  lightShaft(c, [[LAMP[0] - 30, LAMP[1] + 14], [LAMP[0] + 34, LAMP[1] + 14], [LAMP[0] + 240, 1320], [LAMP[0] - 420, 1320]], LAMP[0], LAMP[1] + 14, LAMP[0] - 80, 1300, "255,206,140", 0.2, 30, "dormNightCone");
  inkLine(c, [[LAMP[0] + 30, 336], [LAMP[0] + 40, 300], [LAMP[0] + 6, 320]], 95100, 5, "#2e2c38", 0.3);
  blob(c, [[LAMP[0] - 34, LAMP[1] + 8], [LAMP[0] - 18, LAMP[1] - 18], [LAMP[0] + 22, LAMP[1] - 16], [LAMP[0] + 36, LAMP[1] + 10]], 95101, 0.5);
  paint(c, "#e8dcc4", "#1a1019", 3);
  oval(c, LAMP[0], LAMP[1] + 10, 34, 8, 95102, 0.3);
  paint(c, "#fff1c8", null);
  glow(c, LAMP[0], LAMP[1] + 14, 220, "rgba(255,214,150,0.55)");
  glow(c, LAMP[0], LAMP[1] + 14, 60, "rgba(255,244,214,0.9)");
  // ---- the fairy lights, sagging across the top in two loops; bulbs at uneven spacing, the near ones bigger
  const string = (t: number): Pt => {
    const loop = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
    const x = -40 + 1180 * t;
    const y = (t < 0.5 ? 120 : 150) + 120 * Math.sin(Math.PI * loop);
    return [x, y];
  };
  const wire: Pt[] = [];
  for (let i = 0; i <= 60; i++) wire.push(string(i / 60));
  inkLine(c, wire, 95110, 2, "#120c16", 0.2);
  c.save();
  c.globalCompositeOperation = "screen";
  for (let i = 0; i < 15; i++) {
    const t = (i + 0.3 + 0.4 * hash(i * 3.3)) / 15;
    const [x, y] = string(t);
    const tw = 0.85 + 0.15 * Math.sin(abs * (1.3 + hash(i * 2.1)) + i * 2.2);
    glow(c, x, y + 10, 60 + 20 * hash(i * 5.1), `rgba(${i % 4 === 1 ? "255,170,190" : "255,206,140"},${(0.5 * tw).toFixed(3)})`);
    oval(c, x, y + 10, 6, 9, 95120 + i, 0.2);
    paint(c, i % 4 === 1 ? "#ffd0dc" : "#ffeab8", null);
  }
  c.restore();
}

/** Her desk in front: just the edge of it and a mug, warm under the lamp. Draw it after the figures (it hides
 *  their lower edge); a soft blur (2.5px) keeps it out of focus. */
export function dormNightDesk(c: Ctx, abs: number, o: DormNightDeskOptions = {}) {
  const y = 1262;
  desk(c, y, { props: false, wood: "#5a3f2e", detailed: true });
  glow(c, 860, y + 140, 520, "rgba(255,186,120,0.18)");
  if (o.mug ?? true) {
    // her mug on the right
    const mx = 905,
      my = y + 150;
    oval(c, mx + 10, my + 108, 82, 18, 95200, 0.4);
    paint(c, "rgba(20,10,16,0.4)", null);
    rbox(c, mx - 70, my - 40, 140, 150, 26, 95201, 0.6);
    paint(c, "#a8808e", "#1a1019", 4);
    oval(c, mx, my - 40, 70, 18, 95202, 0.4);
    paint(c, "#5a3a2a", "#1a1019", 3);
    rbox(c, mx + 62, my - 6, 46, 70, 22, 95203, 0.4);
    paint(c, null, "#1a1019", 9);
    rbox(c, mx + 62, my - 6, 46, 70, 22, 95203, 0.4);
    paint(c, null, "#a8808e", 5);
    for (let i = 0; i < 2; i++) {
      const sx = mx - 16 + i * 30,
        sh = Math.sin(abs * 1.3 + i * 2) * 6;
      c.beginPath();
      c.moveTo(sx, my - 50);
      c.bezierCurveTo(sx + 14 + sh, my - 90, sx - 14 + sh, my - 120, sx + 4, my - 160);
      c.strokeStyle = "rgba(240,225,220,0.22)";
      c.lineWidth = 4;
      c.stroke();
    }
  }
  const v = c.createLinearGradient(0, y, 0, H);
  v.addColorStop(0, "rgba(20,10,16,0)");
  v.addColorStop(1, "rgba(20,10,16,0.55)");
  c.fillStyle = v;
  c.fillRect(-60, y - 20, W + 120, H - y + 80);
}

const FRAME = { width: 1080, height: 1920, duration: 3, prepare: loadFonts };
export const resources = defineResources({
  dormNight: resource({
    kind: "set",
    title: "宿舍夜晚·近景背景",
    description: "一个近景镜头需要的宿舍夜景：左边雪夜的窗（月亮、对面楼的暖窗、雪、窗帘，坐在窗下的人被它勾冷轮廓），右上床铺栏杆上的夹灯（主光 + 一道暖光柱，位置 DORM_NIGHT_LAMP）、一小格书架和绿植、顶上一串下垂的串灯。夜色直接画，不靠压暗调色。人物在它之后画，前景用 dormNightDesk；做近景背景时整张 blur 3px。",
    tags: ["宿舍", "夜晚", "回忆", "雪夜窗", "夹灯", "串灯", "近景", "背景"],
    usage: "filtered(ctx, 'blur(3px)', (k) => dormNight(k, abs, { snow: true }), 'bg'); /* 人物（用 DORM_NIGHT_LAMP 打光）*/ dormNightDesk(ctx, abs)",
    params: dormNightOptions,
    preview: { ...FRAME, draw(c, t, p) { beginFrame(c, t); dormNight(c, t, p); dormNightDesk(c, t); } },
  }),
  dormNightDesk: resource({
    kind: "set",
    title: "宿舍夜晚·前景桌沿",
    description: "她的书桌前沿（木纹、暖光池）和一只冒热气的粉色杯子，往下渐暗；在坐着的人物之后画，挡住半身下沿，放在歌词带下面。",
    tags: ["宿舍", "桌面", "前景", "杯子", "夜晚"],
    usage: "filtered(ctx, 'blur(2.5px)', (k) => dormNightDesk(k, abs, { mug: true }), 'desk')",
    params: dormNightDeskOptions,
    preview: { ...FRAME, draw(c, t, p) { beginFrame(c, t); fillBg(c, "#2a1d2d"); dormNightDesk(c, t, p); } },
  }),
});
