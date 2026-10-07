import { clamp } from "../../../../src/engine/math";
import { C, Ctx, F, Pt, blob, inkLine, measure, paint, poly, rr, text } from "./draw";
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
