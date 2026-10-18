// 秤砣设定图：t 当页码。0 转面，1 表情，2 片子里的姿势，3 以后转身过渡（正面线稿 ↔ 侧面线稿）。
import type { Scene, SceneOptions } from "@frame/engine/types";
import { EXPRESSIONS, POSES, chengtuo, drawChengtuo, float, type ChengtuoOptions } from "@materials/剪纸角色/code/chengtuo";

const W = 1080;
const H = 1920;

function bg(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#fbeee6");
  g.addColorStop(1, "#f3e3ea");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size = 30) {
  ctx.fillStyle = "#6b5a6e";
  ctx.font = `600 ${size}px "PingFang SC", "Noto Sans SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
}

function figure(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, o: ChengtuoOptions) {
  ctx.fillStyle = "rgba(90,70,110,0.12)";
  ctx.beginPath();
  ctx.ellipse(x, y, 110 * s, 14 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  chengtuo(ctx, x, y, s, o, 0.3);
}

function expressions(ctx: CanvasRenderingContext2D) {
  label(ctx, "秤砣 · 表情", W / 2, 80, 44);
  const names = Object.keys(EXPRESSIONS);
  const cols = 4;
  const cw = W / cols;
  const ch = 352;
  names.forEach((name, i) => {
    const cx = cw * (i % cols) + cw / 2;
    const cy = 120 + Math.floor(i / cols) * ch;
    const s = 2.15;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cx - cw / 2 + 10, cy, cw - 20, ch - 52, 24);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fill();
    ctx.clip();
    // 一半正面、一半 3/4，表情在两个角度都看得到
    const face = i % 2 === 0 ? 0 : -0.6;
    chengtuo(ctx, cx + 4, cy + 150 + 497 * s, s, { face, expression: name as ChengtuoOptions["expression"], line: 0.8 }, 0.37);
    ctx.restore();
    label(ctx, name, cx, cy + ch - 18, 26);
  });
}

function gallery(ctx: CanvasRenderingContext2D) {
  label(ctx, "秤砣 · 片子里的姿势", W / 2, 80, 44);
  const names = Object.keys(POSES);
  const cols = 4;
  const cw = W / cols;
  const ch = 352;
  names.forEach((name, i) => {
    const { items, ...o } = POSES[name];
    const cx = cw * (i % cols) + cw / 2;
    const base = 120 + (Math.floor(i / cols) + 1) * ch - 64;
    const s = Math.min(0.46, 270 / (600 + Math.max(0, o.lift ?? 0)));
    ctx.fillStyle = "rgba(90,70,110,0.12)";
    ctx.beginPath();
    ctx.ellipse(cx, base, 110 * s * 2, 14 * s * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    chengtuo(ctx, cx, base, s, { ...o, ...(items as object), brickL: name === "递砖" } as ChengtuoOptions, 0.4);
    label(ctx, name, cx, base + 38, 24);
  });
}

function turnaround(ctx: CanvasRenderingContext2D) {
  label(ctx, "秤砣 · 转面", W / 2, 90, 44);
  const y = 820;
  chengtuo(ctx, 190, y, 1.0, POSES.站 as ChengtuoOptions, 0.3);
  chengtuo(ctx, 540, y, 1.0, {}, 0.3);
  chengtuo(ctx, 890, y, 1.0, { ...(POSES.站 as ChengtuoOptions), face: 1 }, 0.3);
  label(ctx, "3/4 朝左", 190, y + 70);
  label(ctx, "正面", 540, y + 70);
  label(ctx, "3/4 朝右", 890, y + 70);
  // 光脚、飘起来
  const y2 = 1700;
  chengtuo(ctx, 300, y2, 1.0, { boots: false, bricks: 0 }, 0.3);
  label(ctx, "光脚", 300, y2 + 70);
  const f = float(0.6);
  ctx.save();
  ctx.translate(770, y2 - 40);
  ctx.scale(0.9, 0.9);
  drawChengtuo(ctx, f.pose);
  ctx.restore();
  label(ctx, "飘起来（头发、围巾往上）", 760, y2 + 70);
}

/** 转身过渡：上面一排从正面到 3/4 的五步，下面全身和头的特写来回转 */
function turning(ctx: CanvasRenderingContext2D, t: number) {
  label(ctx, "秤砣 · 转身过渡", W / 2, 90, 44);
  const steps = [0, -0.25, -0.5, -0.75, -1];
  steps.forEach((f, i) => {
    const x = 120 + i * 210;
    figure(ctx, x, 640, 0.72, { face: f });
    label(ctx, f === 0 ? "正面" : f === -1 ? "3/4" : `${-f}`, x, 690, 26);
  });
  // 0 → 3/4 朝左 → 0 → 3/4 朝右 → 0，4 秒一圈
  const face = -Math.sin(((t - 3) / 4) * Math.PI * 2);
  figure(ctx, 270, 1780, 1.6 * 0.62, { face });
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(560, 820, 470, 560, 28);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fill();
  ctx.clip();
  const s = 3.1;
  ctx.translate(795, 1120 + 497 * s);
  ctx.scale(s, s);
  drawChengtuo(ctx, { face, t }, { line: 0.7 });
  ctx.restore();
  label(ctx, `face = ${face.toFixed(2)}`, 795, 1430, 26);
}

export function createScene({ width, height }: SceneOptions): Scene {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  return {
    canvas,
    render(t) {
      ctx.setTransform(width / W, 0, 0, height / H, 0, 0);
      bg(ctx);
      const page = Math.floor(t);
      if (page === 0) turnaround(ctx);
      else if (page === 1) expressions(ctx);
      else if (page === 2) gallery(ctx);
      else turning(ctx, t);
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
