// 分镜占位：还没做的分镜显示编号、标题和要拍的内容（做好的分镜盖在它上面）。全部做完后删掉这一层。
import type { SceneOptions } from "@frame/engine/types";
import { clamp } from "@frame/engine/math";
import { F, W, designScene, fillBg, rr, text, vgrad } from "@materials/s0rrow/code/draw";
import { END, SHOTS } from "./timeline";

export function createScene(options: SceneOptions) {
  return designScene(options, 0, (ctx, t) => {
    let i = 0;
    while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= t) i++;
    const s = SHOTS[i];
    const end = SHOTS[i + 1]?.at ?? END;
    fillBg(ctx, vgrad(ctx, 0, 1920, [[0, "#0d1124"], [1, "#151a30"]]));
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 12]);
    rr(ctx, 120, 560, W - 240, 520, 28);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, `分镜 ${s.n}`, W / 2, 660, { size: 54, font: F.cn, fill: "#ffd166" });
    text(ctx, s.title, W / 2, 770, { size: 76, font: F.cn, fill: "#ffffff" });
    text(ctx, s.detail, W / 2, 880, { size: 38, font: F.cn, fill: "rgba(255,255,255,0.75)" });
    text(ctx, "待制作", W / 2, 990, { size: 34, font: F.cn, fill: "rgba(255,255,255,0.4)" });
    // how far into this shot
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    rr(ctx, 200, 1040, W - 400, 8, 4);
    ctx.fill();
    ctx.fillStyle = "rgba(255,209,102,0.7)";
    rr(ctx, 200, 1040, (W - 400) * clamp((t - s.at) / (end - s.at)), 8, 4);
    ctx.fill();
  });
}
