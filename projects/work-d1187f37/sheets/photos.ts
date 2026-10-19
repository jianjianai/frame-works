// 设定图：她相册里头像前面的三张照片。只用来看，不在时间轴上。
import type { SceneOptions } from "@frame/engine/types";
import { designScene, fillBg } from "@materials/s0rrow/code/draw";
import { HER_ALBUM, PH, PW } from "../acts/photos";

export function createScene(options: SceneOptions) {
  return designScene(options, 0, (ctx) => {
    fillBg(ctx, "#222");
    const s = 520 / PW;
    HER_ALBUM.forEach((draw, i) => {
      ctx.save();
      ctx.translate(14 + (i % 2) * 540, 120 + Math.floor(i / 2) * (PH * s + 40));
      ctx.scale(s, s);
      ctx.beginPath();
      ctx.rect(0, 0, PW, PH);
      ctx.clip();
      draw(ctx);
      ctx.restore();
    });
  });
}
