/**
 * 下雪（《屏蔽》work-73c8f9bc）：按绝对时间飘落的雪花，确定性（同一时刻画出来一样，可以任意跳转）。
 * snow(ctx, abs, { x, y, w, h, n, seed, speed, size, alpha, drift, color })：在 (x, y, w, h) 里画 n 片雪，默认铺满画面。
 * 远景小而密、近景大而虚：近的一层用 filtered(ctx, "blur(4px)", …) 包起来再叠一次（见预览）。窗户里的雪先 clip 到窗框。
 */
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { Ctx, H, W, beginFrame, fillBg, filtered, glow, hash, vgrad } from "../draw";

export const snowOptions = z.object({
  n: z.number().int().min(1).max(600).default(120).describe("雪花数量"),
  seed: z.number().int().default(1).describe("随机种子（同一画面里的几层用不同的种子）"),
  speed: z.number().min(0).max(600).default(90).describe("下落速度（设计单位/秒）"),
  size: z.number().min(0.5).max(30).default(4).describe("雪花半径"),
  alpha: z.number().min(0).max(1).default(0.85).describe("不透明度"),
  drift: z.number().min(0).max(120).default(24).describe("左右飘的幅度"),
  x: z.number().optional().describe("区域左边（默认 -40）"),
  y: z.number().optional().describe("区域上边（默认 -40）"),
  w: z.number().optional().describe("区域宽（默认铺满画面）"),
  h: z.number().optional().describe("区域高（默认铺满画面）"),
  color: z.string().optional().describe("颜色（默认白）"),
});
export type SnowOptions = z.input<typeof snowOptions>;

/** Falling snow in the rect (x, y, w, h): `n` flakes drifting down, deterministic in `abs`. */
export function snow(c: Ctx, abs: number, o: SnowOptions = {}) {
  const x0 = o.x ?? -40,
    y0 = o.y ?? -40,
    w = o.w ?? W + 80,
    h = o.h ?? H + 80;
  const sp = o.speed ?? 90,
    sz = o.size ?? 4,
    dr = o.drift ?? 24;
  const n = o.n ?? 120,
    seed = o.seed ?? 1;
  c.save();
  c.fillStyle = o.color ?? "#ffffff";
  for (let i = 0; i < n; i++) {
    const r1 = hash(seed + i * 1.37),
      r2 = hash(seed + i * 2.91),
      r3 = hash(seed + i * 4.13);
    const v = sp * (0.55 + 0.9 * r3);
    const y = y0 + ((r2 * h + abs * v) % h);
    const x = x0 + r1 * w + Math.sin(abs * (0.6 + r3) + i) * dr;
    const r = sz * (0.45 + r3);
    c.globalAlpha = (o.alpha ?? 0.85) * (0.5 + 0.5 * r1);
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

export const resources = defineResources({
  snow: resource({
    kind: "effect",
    title: "下雪",
    description:
      "按绝对时间飘落的雪花（确定性，可任意跳转）。默认铺满画面；给 x/y/w/h 只下在一个区域里（窗户里的雪先 clip 到窗框）。远景用小而密的一层，近景再叠一层大而虚的（filtered blur 4px、size 9–12、speed 160），雪夜就有了景深。",
    tags: ["雪", "下雪", "雪夜", "冬天", "天气", "粒子"],
    usage: 'snow(ctx, abs, { n: 150, seed: 41, speed: 90, size: 3.2 }); filtered(ctx, "blur(4px)", (k) => snow(k, abs, { n: 30, seed: 43, speed: 160, size: 9, alpha: 0.55 }), "nearSnow")',
    params: snowOptions,
    presets: {
      大雪: { n: 320, speed: 140, size: 5, drift: 40 },
      窗外小雪: { n: 50, speed: 60, size: 3, drift: 12 },
    },
    preview: {
      width: 1080,
      height: 1920,
      duration: 4,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        fillBg(ctx, vgrad(ctx, 0, H, [[0, "#070b1d"], [0.6, "#1a1f3a"], [1, "#2a2a40"]]));
        glow(ctx, 760, 520, 520, "rgba(255,180,100,0.35)");
        snow(ctx, t, p);
        filtered(ctx, "blur(4px)", (k) => snow(k, t, { ...p, n: Math.round(p.n / 5), seed: p.seed + 2, speed: p.speed * 1.8, size: p.size * 2.6, alpha: p.alpha * 0.6 }), "snowPreviewNear");
      },
    },
  }),
});
