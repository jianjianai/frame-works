import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { createLottieScene } from "@frame/engine/lottie-adapter";
import { assetUrl, type Scene, type SceneOptions } from "@frame/engine/types";

const INK = "#151719";
const FONT = '"Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3);
const loopTime = (t: number, rate = 1) => ((t * rate) % 3 + 3) % 3;
const holdTime = (t: number) => Math.max(0, Math.min(3 - 1 / 30, t));

export const likeOptions = z.object({
  label: z.string().max(12).default("喜欢就点个赞").describe("点赞提示文字，最多 12 字"),
  from: z.number().int().min(0).max(999999).default(1240).describe("开始计数"),
  to: z.number().int().min(0).max(999999).default(1280).describe("结束计数"),
  seconds: z.number().min(0.2).max(10).default(1.6).describe("数字增长时长（秒）"),
  theme: z.enum(["paper", "ink"]).default("paper").describe("卡片配色"),
});
export const loadingOptions = z.object({
  label: z.string().max(12).default("灵感酝酿中").describe("进度提示文字，最多 12 字"),
  seconds: z.number().min(1).max(20).default(4).describe("进度到达 100% 的秒数"),
  rate: z.number().min(0.25).max(3).default(1).describe("Lottie 循环播放速度"),
  theme: z.enum(["paper", "ink"]).default("ink").describe("卡片配色"),
});
export const successOptions = z.object({
  label: z.string().max(12).default("已加入灵感收藏").describe("完成提示，最多 12 字"),
  detail: z.string().max(22).default("下一次创作，从这里开始").describe("第二行提示，最多 22 字"),
  theme: z.enum(["paper", "ink"]).default("paper").describe("卡片配色"),
});
type Painter = (ctx: CanvasRenderingContext2D, t: number, icon: Scene) => void;
function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, weight = 700) {
  ctx.fillStyle = color; ctx.font = weight + " " + size + "px " + FONT;
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillText(s, x, y, Math.max(1, 754 - x));
}
function panel(ctx: CanvasRenderingContext2D, theme: "paper" | "ink") {
  ctx.fillStyle = theme === "paper" ? "#fffdf4" : INK;
  ctx.beginPath(); ctx.roundRect(5, 5, 790, 270, 38); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
}
async function widget(options: SceneOptions, src: string, paint: Painter): Promise<Scene> {
  const icon = await createLottieScene({ width: 256, height: 256, quality: options.quality }, assetUrl(src));
  const canvas = document.createElement("canvas");
  canvas.width = options.width; canvas.height = options.height;
  const ctx = canvas.getContext("2d")!;
  return {
    canvas,
    render(t) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      const s = Math.min(canvas.width / 800, canvas.height / 280);
      ctx.setTransform(s, 0, 0, s, (canvas.width - 800 * s) / 2, (canvas.height - 280 * s) / 2);
      paint(ctx, t, icon);
    },
    dispose() { icon.dispose(); canvas.width = canvas.height = 1; },
  };
}
/** Create once, render at any absolute time, drawImage(scene.canvas), then dispose. */
export async function createLikeCounter(options: SceneOptions, input: z.input<typeof likeOptions> = {}): Promise<Scene> {
  const p = likeOptions.parse(input);
  return widget(options, "materials/Lottie动效/lottie/heart-pop.json", (ctx, t, icon) => {
    panel(ctx, p.theme); const fg = p.theme === "paper" ? INK : "#fffdf4";
    icon.render(loopTime(t)); ctx.drawImage(icon.canvas, 24, 28, 218, 218);
    text(ctx, p.label, 266, 78, 30, fg, 500);
    const count = Math.round(p.from + (p.to - p.from) * ease(t / p.seconds));
    text(ctx, count.toLocaleString("en-US"), 260, 185, 80, fg, 800);
    text(ctx, "LIKES", 266, 230, 21, p.theme === "paper" ? "#666761" : "#c9cebe", 500);
  });
}
export async function createLoadingCard(options: SceneOptions, input: z.input<typeof loadingOptions> = {}): Promise<Scene> {
  const p = loadingOptions.parse(input);
  return widget(options, "materials/Lottie动效/lottie/orbit-loader.json", (ctx, t, icon) => {
    panel(ctx, p.theme); const fg = p.theme === "paper" ? INK : "#fffdf4";
    ctx.fillStyle = "#edeede"; ctx.beginPath(); ctx.arc(127, 140, 96, 0, Math.PI * 2); ctx.fill();
    icon.render(loopTime(t, p.rate)); ctx.drawImage(icon.canvas, 27, 40, 200, 200);
    const progress = clamp(t / p.seconds);
    text(ctx, p.label, 264, 95, 34, fg);
    text(ctx, Math.floor(progress * 100) + "%", 264, 174, 54, fg, 800);
    ctx.fillStyle = p.theme === "ink" ? "#494d3e" : "#e2e6d7"; ctx.beginPath(); ctx.roundRect(267, 214, 468, 14, 7); ctx.fill();
    if (progress > 0) { ctx.fillStyle = p.theme === "ink" ? "#caff45" : INK; ctx.beginPath(); ctx.roundRect(267, 214, Math.max(14, 468 * progress), 14, 7); ctx.fill(); }
  });
}
export async function createSuccessChip(options: SceneOptions, input: z.input<typeof successOptions> = {}): Promise<Scene> {
  const p = successOptions.parse(input);
  return widget(options, "materials/Lottie动效/lottie/check-draw.json", (ctx, t, icon) => {
    panel(ctx, p.theme); const fg = p.theme === "paper" ? INK : "#fffdf4";
    icon.render(holdTime(t)); ctx.drawImage(icon.canvas, 25, 30, 218, 218);
    text(ctx, p.label, 265, 127, 40, fg, 800);
    text(ctx, p.detail, 266, 184, 24, p.theme === "paper" ? "#686b63" : "#c9cebe", 500);
  });
}
async function preview(ctx: CanvasRenderingContext2D, t: number, make: () => Promise<Scene>) {
  // Preview API has no Canvas dispose hook: own and dispose each temporary scene here.
  const scene = await make();
  try { await scene.render(t); ctx.drawImage(scene.canvas, 0, 0, 800, 280); } finally { scene.dispose(); }
}
export const resources = defineResources({
  likeCounter: resource({
    kind: "ui", title: "Lottie 点赞与计数", description: "心动贴纸与增长数字组成的卡片，适合短视频互动引导。以绝对时间绘制，可倒退。", tags: ["Lottie", "点赞", "计数", "互动"],
    usage: "const card = await createLikeCounter({ width: 800, height: 280, quality: 'standard' }, { from: 1240, to: 1280 }); await card.render(t); ctx.drawImage(card.canvas, x, y, w, h); 销毁时 card.dispose()",
    params: likeOptions, presets: { 心动: { label: "喜欢就点个赞", from: 1240, to: 1280, theme: "paper" }, 破万: { label: "谢谢你的喜欢", from: 9980, to: 10000, theme: "ink" } },
    preview: { engine: "canvas", width: 800, height: 280, duration: 3, time: 1.5, background: "#ebe8dc", draw: (ctx, t, p) => preview(ctx, t, () => createLikeCounter({width:800,height:280,quality:"standard"},p)) },
  }),
  loadingCard: resource({
    kind: "ui", title: "Lottie 加载进度卡", description: "循环加载贴纸与确定性百分比；速度、时长和文案可调。", tags: ["Lottie", "加载", "进度"],
    usage: "const card = await createLoadingCard(options, { seconds: 4, rate: 1.25 }); await card.render(t); ctx.drawImage(card.canvas, x, y, w, h); 销毁时 card.dispose()",
    params: loadingOptions, presets: { 酝酿灵感: { label: "灵感酝酿中", seconds: 4, rate: 1.25, theme: "ink" }, 快速加载: { label: "美好即将发生", seconds: 2, rate: 2, theme: "paper" } },
    preview: { engine: "canvas", width: 800, height: 280, duration: 4, time: 2, background: "#ebe8dc", draw: (ctx, t, p) => preview(ctx, t, () => createLoadingCard({width:800,height:280,quality:"standard"},p)) },
  }),
  successChip: resource({
    kind: "ui", title: "Lottie 完成提示", description: "描边勾选配双行反馈文案，动画结束后稳定停留在完成状态。", tags: ["Lottie", "勾选", "完成", "收藏"],
    usage: "const card = await createSuccessChip(options, { label: '已加入灵感收藏' }); await card.render(t); ctx.drawImage(card.canvas, x, y, w, h); 销毁时 card.dispose()",
    params: successOptions, presets: { 收藏成功: { label: "已加入灵感收藏", detail: "下一次创作，从这里开始", theme: "paper" }, 深色完成: { label: "心动已收到", detail: "谢谢每一个小小的喜欢", theme: "ink" } },
    preview: { engine: "canvas", width: 800, height: 280, duration: 3, time: 1.4, background: "#ebe8dc", draw: (ctx, t, p) => preview(ctx, t, () => createSuccessChip({width:800,height:280,quality:"standard"},p)) },
  }),
});
