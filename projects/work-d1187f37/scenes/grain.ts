import type { SceneOptions } from "../../../src/engine/types";
import { seeded } from "../../../src/engine/math";
import { H, W, designScene } from "./lib/draw";

/** Film grain + vignette, composited with "overlay" blend (grey = no change). */
export function createScene(options: SceneOptions) {
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
  return designScene(options, 0, (ctx, abs) => {
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
  });
}
