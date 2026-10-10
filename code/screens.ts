/**
 * 《unhappy》的手机界面（600×1280 屏幕坐标，在 phone() 的 screen 回调里画）：相册看小狗照片 photoScreen（可显示日期说明）、
 * 存钱目标 savingsScreen、外卖接单 orderScreen；另有便利贴 stickyNote、小狗照片 puppyPhoto。
 */
import { z } from "zod";
import { clamp } from "@frame/engine/math";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, F, Pt, beginFrame, blob, inkLine, loadFonts, measure, paint, poly, rr, text } from "./draw";
import { bunnyToy, drawDog } from "./dog";
import { SH, SW, statusBar } from "./phone";

/** Phone screens for 「unhappy」 (600×1280 screen units). */

/** The photo on his phone: 豆豆 as a puppy in a cardboard box, the day he found it. */
export function puppyPhoto(ctx: Ctx, x: number, y: number, w: number, h: number, abs: number) {
  ctx.save();
  rr(ctx, x, y, w, h, 18);
  ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#f6e7c8");
  g.addColorStop(1, "#e6c99a");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // a towel-lined cardboard box
  const cx = x + w / 2,
    by = y + h * 0.74;
  poly(ctx, [[cx - w * 0.36, by - h * 0.1], [cx + w * 0.36, by - h * 0.1], [cx + w * 0.4, y + h + 20], [cx - w * 0.4, y + h + 20]], 2300, 1.2);
  paint(ctx, "#c49a62", C.ink, 5);
  inkLine(ctx, [[cx - w * 0.3, by + h * 0.02], [cx + w * 0.3, by + h * 0.02]], 2301, 3, "#9a7448");
  blob(ctx, [[cx - w * 0.34, by - h * 0.1], [cx - w * 0.1, by - h * 0.16], [cx + w * 0.2, by - h * 0.15], [cx + w * 0.34, by - h * 0.1], [cx, by - h * 0.04]], 2302, 1.5);
  paint(ctx, "#9fc7e8", C.ink, 4);
  // the puppy peeking up, big eyes, holding its little bunny
  drawDog(ctx, cx, by - h * 0.26, w / 520, { view: "front", pose: "head", young: 1, eyes: "open", look: [0, -0.3], ears: 0.5, headTilt: Math.sin(abs * 1.2) * 0.03 });
  bunnyToy(ctx, cx + w * 0.24, by - h * 0.1, w / 900, -0.4, 2310);
  ctx.restore();
  rr(ctx, x, y, w, h, 18);
  paint(ctx, null, "rgba(0,0,0,0.25)", 3);
}

/** Photo viewer. `caption` 0..1 shows the date bar (hidden in the dog's view, revealed later). */
export function photoScreen(ctx: Ctx, abs: number, o: { caption?: number; zoom?: number; heart?: number } = {}) {
  ctx.fillStyle = "#0d0d10";
  ctx.fillRect(0, 0, SW, SH);
  const z = o.zoom ?? 1;
  ctx.save();
  ctx.translate(SW / 2, 600);
  ctx.scale(z, z);
  ctx.translate(-SW / 2, -600);
  puppyPhoto(ctx, 30, 300, SW - 60, 620, abs);
  ctx.restore();
  statusBar(ctx, { time: "01:12", airplane: false, battery: 0.18 });
  text(ctx, "‹", 40, 120, { size: 56, font: F.ui, fill: "#fff" });
  text(ctx, "1 / 2308", SW / 2, 120, { size: 28, font: F.ui, weight: 700, fill: "#fff" });
  const cap = clamp(o.caption ?? 0);
  if (cap > 0) {
    ctx.save();
    ctx.globalAlpha = cap;
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    rr(ctx, 30, 960, SW - 60, 150, 20);
    ctx.fill();
    text(ctx, "2016年6月3日", 60, 1000, { size: 28, font: F.ui, weight: 700, fill: "#fff", align: "left" });
    text(ctx, "捡到你的那天", 60, 1052, { size: 40, font: F.ui, weight: 700, fill: "#ffd166", align: "left" });
    ctx.restore();
  }
  // favourite heart
  const hk = o.heart ?? 1;
  ctx.save();
  ctx.translate(SW - 80, 1210);
  ctx.scale(hk, hk);
  blob(ctx, [[0, 6], [-14, -8], [-26, -2], [-24, 12], [0, 32], [24, 12], [26, -2], [14, -8]], 2320, 0.5);
  paint(ctx, "#ff4d6d", null);
  ctx.restore();
}

/** Savings tracker: 豆豆的手术费. */
export function savingsScreen(ctx: Ctx, abs: number, amount: number, target = 8600, done = 0) {
  ctx.fillStyle = "#f6f3ec";
  ctx.fillRect(0, 0, SW, SH);
  statusBar(ctx, { time: "01:24", airplane: false, battery: 0.16, dark: true });
  text(ctx, "存钱目标", SW / 2, 130, { size: 30, font: F.ui, weight: 700, fill: "#333" });
  // card
  ctx.fillStyle = "#fff";
  rr(ctx, 30, 190, SW - 60, 520, 28);
  ctx.fill();
  text(ctx, "豆豆的手术费", SW / 2, 260, { size: 44, font: F.ui, weight: 700, fill: "#222" });
  const k = clamp(amount / target);
  const amt = "¥" + Math.round(amount).toLocaleString("en-US");
  text(ctx, amt, SW / 2, 380, { size: 92, font: F.ui, weight: 700, fill: done > 0.5 ? "#2fa36b" : "#e8343c" });
  text(ctx, "目标 ¥" + target.toLocaleString("en-US"), SW / 2, 460, { size: 30, font: F.ui, fill: "#888" });
  ctx.fillStyle = "#eee";
  rr(ctx, 70, 520, SW - 140, 34, 17);
  ctx.fill();
  ctx.fillStyle = done > 0.5 ? "#2fa36b" : "#ff9f0a";
  rr(ctx, 70, 520, (SW - 140) * k, 34, 17);
  ctx.fill();
  const left = Math.max(0, target - amount);
  text(ctx, left > 0 ? `还差 ¥${Math.round(left)}` : "够了！", SW / 2, 620, { size: 40, font: F.ui, weight: 700, fill: left > 0 ? "#555" : "#2fa36b" });
  // income list
  const rows: [string, string][] = [
    ["外卖配送 32 单", "+¥186"],
    ["外卖配送 29 单", "+¥163"],
    ["卖掉游戏机", "+¥900"],
    ["外卖配送 35 单", "+¥201"],
  ];
  rows.forEach(([a, b], i) => {
    const y = 780 + i * 100;
    ctx.fillStyle = "#fff";
    rr(ctx, 30, y - 40, SW - 60, 84, 18);
    ctx.fill();
    text(ctx, a, 60, y + 2, { size: 30, font: F.ui, fill: "#333", align: "left" });
    text(ctx, b, SW - 60, y + 2, { size: 30, font: F.ui, weight: 700, fill: "#2fa36b", align: "right" });
  });
}

/** Delivery app: a new order card with the 接单 button. `press` 0..1. */
export function orderScreen(ctx: Ctx, abs: number, press = 0, accepted = 0) {
  ctx.fillStyle = "#e9eef2";
  ctx.fillRect(0, 0, SW, SH);
  // doodle map
  ctx.strokeStyle = "#c9d3da";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  for (const [a, b] of [[[0, 300], [600, 380]], [[160, 0], [220, 800]], [[0, 640], [600, 560]], [[420, 120], [380, 800]]] as [Pt, Pt][]) {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
  ctx.strokeStyle = "#ffb000";
  ctx.lineWidth = 8;
  ctx.setLineDash([16, 12]);
  ctx.beginPath();
  ctx.moveTo(190, 520);
  ctx.lineTo(210, 360);
  ctx.lineTo(400, 330);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const [px, py, col] of [[190, 520, "#2f80ed"], [400, 330, "#e8343c"]] as [number, number, string][]) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px, py, 18, 0, Math.PI * 2);
    ctx.fill();
  }
  statusBar(ctx, { time: "01:31", airplane: false, battery: 0.15, dark: true });
  // order card
  ctx.fillStyle = "#fff";
  rr(ctx, 24, 700, SW - 48, 540, 30);
  ctx.fill();
  text(ctx, accepted > 0.5 ? "已接单" : "新订单", 60, 760, { size: 40, font: F.ui, weight: 700, fill: accepted > 0.5 ? "#2fa36b" : "#222", align: "left" });
  text(ctx, "2.3 km · 凌晨加价", 60, 820, { size: 30, font: F.ui, fill: "#666", align: "left" });
  text(ctx, "¥9.5", SW - 60, 790, { size: 64, font: F.ui, weight: 700, fill: "#ff7a00", align: "right" });
  text(ctx, "取：24小时便利店", 60, 900, { size: 30, font: F.ui, fill: "#333", align: "left" });
  text(ctx, "送：幸福里 7 栋", 60, 950, { size: 30, font: F.ui, fill: "#333", align: "left" });
  const bw = (SW - 120) * (1 - 0.04 * press);
  ctx.fillStyle = accepted > 0.5 ? "#9ad1b4" : "#ffb000";
  rr(ctx, SW / 2 - bw / 2, 1060, bw, 120, 60);
  ctx.fill();
  text(ctx, accepted > 0.5 ? "✓ 已接单" : "接单", SW / 2, 1121, { size: 50, font: F.ui, weight: 700, fill: "#fff" });
}

/** A yellow sticky note (the vet's instructions on the wall). */
export function stickyNote(ctx: Ctx, x: number, y: number, s: number, rot: number, lines: string[], seed = 2400, mark = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  poly(ctx, [[-150, -120], [150, -124], [154, 120], [-146, 124]], seed, 1.4);
  paint(ctx, "#ffe680", C.ink, 5);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(-60, -136, 120, 30);
  lines.forEach((l, i) => text(ctx, l, 0, -54 + i * 62, { size: 46, font: F.pen, fill: "#222" }));
  if (mark > 0) {
    // red underline under the last line
    const w = measure(ctx, lines[lines.length - 1], 46, F.pen);
    ctx.save();
    ctx.globalAlpha *= clamp(mark * 2);
    inkLine(ctx, [[-w / 2, -54 + (lines.length - 1) * 62 + 30], [-w / 2 + w * clamp(mark), -54 + (lines.length - 1) * 62 + 26]], seed + 1, 6, C.red);
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- resources (preview and catalog)
/** Previews of whole screens: the 600×1280 screen units. */
const SCREEN = { width: 600, height: 1280, duration: 2, prepare: loadFonts };

export const resources = defineResources({
  photoScreen: resource({
    kind: "ui",
    title: "相册看图（小狗照片）",
    description: "手机相册里的一张照片：豆豆小时候在纸箱里（捡到它的那天）。caption 0..1 显示底部的日期说明（小狗视角里先隐藏，后面揭示），zoom 放大，heart 点赞的心。",
    tags: ["相册", "照片", "小狗", "手机"],
    usage: "phone(ctx, cx, cy, s, rot, (c) => photoScreen(c, abs, { caption, zoom, heart }))",
    params: z.object({
      caption: z.number().min(0).max(1).default(1).describe("日期说明"),
      zoom: z.number().min(1).max(2).default(1).describe("放大"),
      heart: z.number().min(0).max(1).default(0).describe("点赞的心"),
    }),
    preview: {
      ...SCREEN,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        photoScreen(ctx, t, p);
      },
    },
  }),
  savingsScreen: resource({
    kind: "ui",
    title: "存钱目标（手术费）",
    description: "记账 App 的存钱目标：豆豆的手术费，进度条到 target；done 1 时显示完成。",
    tags: ["存钱", "记账", "手机", "进度"],
    usage: "savingsScreen(c, abs, amount, target, done)",
    params: z.object({
      amount: z.number().min(0).max(8600).default(5230).describe("已存"),
      target: z.number().min(1000).max(20000).default(8600).describe("目标"),
      done: z.number().min(0).max(1).default(0).describe("完成"),
    }),
    preview: {
      ...SCREEN,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        savingsScreen(ctx, t, p.amount, p.target, p.done);
      },
    },
  }),
  orderScreen: resource({
    kind: "ui",
    title: "外卖接单",
    description: "外卖骑手 App：涂鸦地图上一张新订单卡片和“接单”按钮；press 按下，accepted 接单后的样子。",
    tags: ["外卖", "接单", "骑手", "手机"],
    usage: "orderScreen(c, abs, press, accepted)",
    params: z.object({
      press: z.number().min(0).max(1).default(0).describe("按下"),
      accepted: z.number().min(0).max(1).default(0).describe("已接单"),
    }),
    preview: {
      ...SCREEN,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        orderScreen(ctx, t, p.press, p.accepted);
      },
    },
  }),
  stickyNote: resource({
    kind: "prop",
    title: "便利贴",
    description: "一张黄色便利贴（兽医写在墙上的注意事项、贴在牛奶上的留言），lines 每行一句；mark 0..1 在最后一行下面画红线。",
    tags: ["便利贴", "留言", "纸条"],
    usage: "stickyNote(ctx, x, y, s, rot, [\"一天两次\", \"别让它舔伤口\"], seed, mark)",
    params: z.object({
      line1: z.string().default("一天两次").describe("第一行"),
      line2: z.string().default("别让它舔伤口").describe("第二行"),
      mark: z.number().min(0).max(1).default(0).describe("最后一行下的红线"),
    }),
    preview: {
      width: 600,
      height: 600,
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        stickyNote(ctx, 300, 300, 1.4, -0.05, [p.line1, p.line2], 2400, p.mark);
      },
    },
  }),
  puppyPhoto: resource({
    kind: "prop",
    title: "小狗照片（纸箱里）",
    description: "豆豆小时候在纸箱里的照片，画进 (x, y, w, h) 的圆角框（相册、回忆、相框里用同一张）。",
    tags: ["照片", "小狗", "回忆"],
    usage: "puppyPhoto(ctx, x, y, w, h, abs)",
    preview: {
      width: 600,
      height: 600,
      duration: 2,
      draw(ctx, t) {
        beginFrame(ctx, t);
        puppyPhoto(ctx, 50, 50, 500, 500, t);
      },
    },
  }),
});
