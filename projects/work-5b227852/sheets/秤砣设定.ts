// 秤砣设定图：t 当页码。0 转面，1 表情，2 动作姿势，3 以后转身过渡（正面线稿 ↔ 侧面线稿）。
import type { Scene, SceneOptions } from "@frame/engine/types";
import { EXPRESSIONS, NEUTRAL, POSES, STAND34, drawChengtuo, float, holdBrick, jumpGrab, kneelGive, type PoseIn } from "@materials/剪纸角色/code/chengtuo";

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

function figure(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, pose: PoseIn) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = "rgba(90,70,110,0.12)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 110, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  drawChengtuo(ctx, pose);
  ctx.restore();
}

function expressions(ctx: CanvasRenderingContext2D) {
  label(ctx, "秤砣 · 表情", W / 2, 90, 44);
  const names = Object.keys(EXPRESSIONS);
  const cols = 3;
  const cw = W / cols;
  const ch = 400;
  names.forEach((name, i) => {
    const cx = cw * (i % cols) + cw / 2;
    const cy = 330 + Math.floor(i / cols) * ch;
    const s = 2.3;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cx - cw / 2 + 14, cy - 170, cw - 28, 330, 28);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fill();
    ctx.clip();
    ctx.translate(cx, cy + 497 * s + 15);
    ctx.scale(s, s);
    const face = i % 2 === 0 ? 0 : -0.6;
    const e = { ...NEUTRAL, ...EXPRESSIONS[name] };
    drawChengtuo(ctx, { face, expr: e, t: 0.3, neck: name === "仰望" ? 0.25 : name === "难过" || name === "心疼" ? -0.12 : 0 }, { line: 0.8 });
    ctx.restore();
    label(ctx, name, cx, cy + 200, 28);
  });
}

function gallery(ctx: CanvasRenderingContext2D) {
  label(ctx, "秤砣 · 片子里的动作", W / 2, 90, 44);
  const list: [string, PoseIn, boolean?][] = [
    ["蹲（起跳前）", jumpGrab(0.45)],
    ["空中抓住", jumpGrab(0.97)],
    ["落地", jumpGrab(1.55)],
    ["单膝跪·掏砖", kneelGive(1.0).pose],
    ["递砖", kneelGive(2.2).pose, true],
    ...Object.entries(POSES).map(([k, v]) => [k, v] as [string, PoseIn]),
  ];
  const cols = 4;
  const cw = W / cols;
  const ch = 335;
  list.forEach(([name, pose, brick], i) => {
    const cx = cw * (i % cols) + cw / 2;
    const base = 440 + Math.floor(i / cols) * ch;
    const s = 0.47;
    ctx.save();
    ctx.translate(cx + (name === "倒着睡" ? -30 : 0), base - (name === "倒着睡" ? 40 : 0));
    ctx.scale(s, s);
    ctx.fillStyle = "rgba(90,70,110,0.12)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 110, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    drawChengtuo(ctx, { ...pose, t: 0.4 }, brick ? { hold: { L: holdBrick } } : {});
    ctx.restore();
    label(ctx, name, cx, base + 42, 24);
  });
}

function turnaround(ctx: CanvasRenderingContext2D) {
  label(ctx, "秤砣 · 转面", W / 2, 90, 44);
  const y = 820;
  figure(ctx, 190, y, 1.0, STAND34);
  figure(ctx, 540, y, 1.0, {});
  figure(ctx, 890, y, 1.0, { ...STAND34, face: 1 });
  label(ctx, "3/4 朝左", 190, y + 70);
  label(ctx, "正面", 540, y + 70);
  label(ctx, "3/4 朝右", 890, y + 70);
  // 光脚、飘起来
  const y2 = 1700;
  figure(ctx, 300, y2, 1.0, {
    face: 0,
    legL: { boot: false },
    legR: { boot: false },
    items: { bricks: 0 },
  });
  label(ctx, "光脚", 300, y2 + 70);
  figure(ctx, 770, y2 - 60, 0.9, float(0.6));
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
