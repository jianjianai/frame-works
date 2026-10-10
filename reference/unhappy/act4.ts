import type { SceneOptions } from "@frame/engine/types";
import { phase, smooth } from "@frame/engine/math";
import { C, Ctx, F, H, W, camera, card, designScene, easeOut, flash, oval, paint, text } from "@materials/s0rrow/code/draw";
import { drawKid } from "@materials/s0rrow/code/kid";
import { drawDog } from "@materials/s0rrow/code/dog";
import { coverTree } from "@materials/s0rrow/code/places";
import { heart } from "@materials/s0rrow/code/sets";
import { BAR, END } from "./timeline";

/** ACT 4 (49.14 – 55.3s) · 尾声: the tree from the cover. He sits against the trunk, 豆豆 asleep at his side,
 *  his hand on its head. "其实他每天都摸了 / 在你睡着以后". Rewatch hint: the helmet at 0:02. */

function leaves(ctx: Ctx, abs: number) {
  for (let i = 0; i < 9; i++) {
    const t = ((abs - BAR(24)) * 0.16 + i * 0.13) % 1;
    const x = 80 + ((i * 137) % 920) + Math.sin(abs * 1.4 + i) * 50;
    const y = -40 + t * 1500;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(abs * 1.5 + i);
    oval(ctx, 0, 0, 16, 8, 2000 + i, 0.6);
    paint(ctx, i % 2 ? "#c98a4b" : "#a8582e", "rgba(40,20,10,0.7)", 2.5);
    ctx.restore();
  }
}

export function createScene(options: SceneOptions) {
  return designScene(options, BAR(24), (ctx, abs) => {
    const t = abs - BAR(24);
    ctx.save();
    camera(ctx, 560, 900, 1.12 - 0.08 * smooth(t / 6), 0, 0, -40);
    coverTree(ctx, abs, { warm: 0.6 });
    // 豆豆 curled up asleep beside him, his hand resting on its head
    drawDog(ctx, 430, 1080, 0.82, { pose: "curl", breathe: abs * 0.3 });
    const stroke = Math.sin(t * 2.2) * 10;
    drawKid(ctx, 700, 660 + Math.sin(t * 1.4) * 2, 0.72, {
      body: "full",
      legs: "sitFloor",
      eyes: "shut",
      mouth: "smile",
      tilt: 0.14,
      turn: -0.3,
      arms: "custom",
      handL: [-250 + stroke, 560 - Math.abs(stroke) * 0.3],
      shapeL: "flat",
      handR: [80, 420],
    });
    leaves(ctx, abs);
    // a small heart drifts up from the sleeping dog
    const hk = phase(abs, 52.0, 54.2);
    if (hk > 0 && hk < 1) {
      ctx.save();
      ctx.globalAlpha = Math.sin(hk * Math.PI);
      heart(ctx, 470 + Math.sin(hk * 6) * 20, 1010 - hk * 260, 22, "#ff7fa8", 2050);
      ctx.restore();
    }
    ctx.restore();
    // the last lines
    const a1 = smooth(phase(abs, 49.6, 50.1));
    const a2 = smooth(phase(abs, 50.85, 51.35));
    const fade = 1 - phase(abs, END - 0.8, END - 0.1);
    if (a1 > 0) text(ctx, "其实他每天都摸了", W / 2, 360 - (1 - a1) * 20, { size: 84, font: F.cn, fill: "#fff", stroke: C.ink, lw: 14, alpha: a1 * fade });
    if (a2 > 0) text(ctx, "在你睡着以后", W / 2, 480 - (1 - a2) * 20, { size: 84, font: F.cn, fill: "#ffd166", stroke: C.ink, lw: 14, alpha: a2 * fade });
    card(ctx, "回看第 2 秒 · 他手里拿的是什么？", W / 2, 1340, smooth(phase(abs, 52.4, 52.8)) * fade, 40, "center");
    flash(ctx, phase(abs, END - 0.7, END), "#000");
    void easeOut;
    void H;
  });
}
