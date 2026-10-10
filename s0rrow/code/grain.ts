/**
 * 胶片颗粒和暗角：灰色（128 = 不变）的颗粒图块每秒换 24 次，叠加方式 overlay。作品在 visual.json 里放一个盖住全片的 scene 图层
 * （module 注册为 grain: () => import("@materials/s0rrow/code/grain")，blend: "overlay"，opacity 0.5）。
 */
import { z } from "zod";
import type { SceneOptions } from "@frame/engine/types";
import { seeded } from "@frame/engine/math";
import { defineResources, resource } from "@frame/engine/resources";
import { Ctx, H, W, beginFrame, blit, buffer, designScene } from "./draw";
import { drawKid } from "./kid";
import { classroom } from "./sets";

/** Film grain + vignette in design units, to be composited with "overlay" blend (grey = no change). */
export function filmGrain(): (ctx: Ctx, abs: number) => void {
  const random = seeded(2024);
  const TILE = 240;
  const tiles: HTMLCanvasElement[] = [];
  for (let k = 0; k < 6; k++) {
    const c = document.createElement("canvas");
    c.width = c.height = TILE;
    const g = c.getContext("2d")!;
    const img = g.createImageData(TILE, TILE);
    for (let i = 0; i < TILE * TILE; i++) {
      const v = 128 + (random() + random() + random() - 1.5) * 70;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    tiles.push(c);
  }
  const vignette = document.createElement("canvas");
  vignette.width = W / 4;
  vignette.height = H / 4;
  {
    const g = vignette.getContext("2d")!;
    const r = g.createRadialGradient(W / 8, H / 8, H * 0.12, W / 8, H / 8, H * 0.32);
    r.addColorStop(0, "rgb(128,128,128)");
    r.addColorStop(1, "rgb(52,52,56)");
    g.fillStyle = r;
    g.fillRect(0, 0, W / 4, H / 4);
  }
  return (ctx, abs) => {
    ctx.drawImage(vignette, 0, 0, W, H);
    const f = Math.floor(abs * 24);
    const tile = tiles[f % tiles.length];
    const pattern = ctx.createPattern(tile, "repeat")!;
    const ox = (f * 97) % TILE,
      oy = (f * 61) % TILE;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.translate(-ox, -oy);
    ctx.scale(1.5, 1.5);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };
}

/** The grain layer (a scene module for visual.json: blend "overlay", opacity about 0.5). */
export function createScene(options: SceneOptions) {
  const grain = filmGrain();
  return designScene(options, 0, (ctx, abs) => grain(ctx, abs));
}

// ---------------------------------------------------------------- resources (preview and catalog)
let previewGrain: ((ctx: Ctx, abs: number) => void) | null = null;

export const resources = defineResources({
  grain: resource({
    kind: "effect",
    title: "胶片颗粒和暗角",
    description:
      "全片的胶片颗粒（每秒换 24 次）和暗角。作品用法：scene.ts 的 loaders 里注册 grain: () => import(\"@materials/s0rrow/code/grain\")，visual.json 加一个盖住全片的 scene 图层，blend \"overlay\"，transform.opacity 0.5。在自己的代码里用 filmGrain() 拿到画法，画进离屏后用 overlay 叠上。",
    tags: ["颗粒", "胶片", "暗角", "质感", "图层"],
    usage: "visual.json: { \"source\": { \"kind\": \"scene\", \"module\": \"grain\", \"engine\": \"canvas\" }, \"blend\": \"overlay\", \"transform\": { \"opacity\": 0.5 } }",
    params: z.object({ opacity: z.number().min(0).max(1).default(0.5).describe("图层不透明度") }),
    preview: {
      width: W,
      height: H,
      duration: 1,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        classroom(ctx, t);
        drawKid(ctx, 560, 820, 1.05, { arms: "table", eyes: "open" });
        previewGrain ??= filmGrain();
        const layer = buffer(ctx, "grainPreview");
        previewGrain(layer, t);
        blit(ctx, layer, "overlay", p.opacity);
      },
    },
  }),
});
