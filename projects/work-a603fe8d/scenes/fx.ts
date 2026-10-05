import type { Scene, SceneOptions } from "../../../src/engine/types";
import { DW, DH, SANS, clamp, phase, smooth, seeded, hash, makeEnv, loadFonts, offscreen, END, text } from "./lib";

// 全片最上层：胶片颗粒、暗角、切镜闪白、歌曲署名。time = 作品时间
const CUTS = [2.9, 6.16, 13.94, 17.01, 20.65, 23.7, 27.39, 30.69, 34.27];
const BIG = [9.2, 37.61];

export async function createScene({ width: W, height: H, quality }: SceneOptions): Promise<Scene> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const env = await makeEnv(quality);
  await loadFonts();
  const s = W / DW;
  const random = seeded(9);
  const gw = 360, gh = 640;
  const grains = Array.from({ length: quality === "draft" ? 2 : 4 }, () => {
    const { canvas: c, ctx: g } = offscreen(gw, gh);
    const img = g.createImageData(gw, gh);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  });
  const { canvas: vig, ctx: vg } = offscreen(DW, DH);
  const rg = vg.createRadialGradient(DW / 2, DH * 0.48, DH * 0.25, DW / 2, DH * 0.5, DH * 0.78);
  rg.addColorStop(0, "rgba(0,0,0,0)");
  rg.addColorStop(1, "rgba(0,0,0,0.7)");
  vg.fillStyle = rg;
  vg.fillRect(0, 0, DW, DH);

  return {
    canvas,
    render(t) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.setTransform(s, 0, 0, s, 0, 0);
      ctx.globalAlpha = 1;
      ctx.drawImage(vig, 0, 0);
      // 颗粒
      const f = Math.floor(t * 24);
      ctx.save();
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = 0.12;
      const g = grains[f % grains.length];
      const ox = hash(f * 2.3) * DW, oy = hash(f * 4.1) * DH;
      ctx.translate(-ox, -oy);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) ctx.drawImage(g, i * DW, j * DH, DW, DH);
      ctx.restore();
      // 胶片划痕
      if (hash(f * 9.1) < 0.35) {
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(hash(f * 5.7) * DW, 0, 2, DH);
      }
      // 切镜闪白
      let flash = 0;
      for (const c of CUTS) if (t >= c) flash = Math.max(flash, Math.exp(-(t - c) / 0.07) * 0.45);
      for (const c of BIG) if (t >= c) flash = Math.max(flash, Math.exp(-(t - c) / 0.3));
      // 副歌里随鼓点的曝光闪动
      if (t > 9.2 && t < 37.5) flash = Math.max(flash, env.pulse(t) * 0.07);
      if (flash > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${clamp(flash)})`;
        ctx.fillRect(0, 0, DW, DH);
      }
      // 歌曲署名
      const credit = smooth(phase(t, 1.6, 2.0)) * (1 - smooth(phase(t, 34.0, 34.27)));
      if (credit > 0) {
        ctx.save();
        ctx.globalAlpha = credit * 0.75;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(64, 166, 9, 0, Math.PI * 2);
        ctx.arc(86, 160, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(71, 126, 3, 40);
        ctx.fillRect(93, 120, 3, 40);
        ctx.fillRect(71, 120, 25, 6);
        ctx.restore();
        text(ctx, "可是，妈妈 - 6moon9", 112, 150, 28, { font: SANS, weight: 500, color: "#fff", align: "left", alpha: credit * 0.75, shadow: "rgba(0,0,0,0.8)", blur: 6 });
      }
      // 首尾不压黑：结尾会接回开头的来电画面，循环播放无缝
    },
    dispose() {
      for (const g of grains) g.width = g.height = 1;
      vig.width = vig.height = 1;
      canvas.width = canvas.height = 1;
    },
  };
}
