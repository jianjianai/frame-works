// B 站封面 4:3 的「拽人的 / 被拽的」版（几版让用户挑，比点击率；规格和共用画法见 B站封面画法.ts）。
// 打法：站队提问 + 两个人的情绪近景。字是片尾评论区那道题「你是拽人的，/ 还是被拽的？」：没看过的人也能代进自己
// （我是撑着别人的那个，还是被撑着的那个），又是片子收尾抛给评论区的话题，点进去、看完都有话说。画面是 0:37.45 夜里的楼顶
// （和小红书第三张同一刻）：千斤捧着那块亮着的「活下去」，她搂着千斤，两个人闭着眼哭着笑——一个拽人、一个被拽，正好是这道题。
// 不剧透（前半段）。竖屏中间、横屏接两边（横屏这一镜 0.8），头顶上那片夜里的天放字。
import type { Scene, SceneOptions, Still } from "@frame/engine/types";
import { FONTS, loadFont } from "./抖音封面画法";
import { bloom, nightLine } from "./小红书封面画法";
import { type Place, coverScene, loadFrames, paintMerged, toCover } from "./B站封面画法";

export const still: Still = { width: 1440, height: 1080 };

/** 两个人都闭着眼哭着笑、砖刚亮起来（设计坐标：头顶 y 530、两张脸 430,770 / 740,790，砖 x 410–660、y 1020–1090） */
const T_GLOW = 37.45;
/** lib/wide.ts act2 的 35.88–37.79：夜里楼顶两个人的近景 */
const LENS = { k: 0.8, oy: 20 };
/** 封面取设计 x −208–1358、y 95–1269：头顶在封面 400，砖（封面 y 850–915）在 16:9 的下沿以内，上面是夜里的天 */
const PLACE: Place = { z: 0.92, fx: 575, fy: 682 };

/** 夜里的调子：四周压进深紫，顶上再暗一点托住字；砖那里再亮一层暖光（整张画面的光从砖上来） */
function grade(g: CanvasRenderingContext2D) {
  const [bx, by] = toCover(PLACE, 535, 1055);
  const [mx, my] = toCover(PLACE, 585, 850);
  g.save();
  g.translate(mx, my);
  g.scale(1.5, 1);
  const edge = g.createRadialGradient(0, 0, 330, 0, 0, 800);
  edge.addColorStop(0, "rgba(28,20,44,0)");
  edge.addColorStop(0.6, "rgba(28,20,44,0.38)");
  edge.addColorStop(1, "rgba(28,20,44,0.85)");
  g.fillStyle = edge;
  g.fillRect(-1600, -1600, 3200, 3200);
  g.restore();
  const top = g.createLinearGradient(0, 0, 0, 420);
  top.addColorStop(0, "rgba(24,16,36,0.85)");
  top.addColorStop(0.55, "rgba(24,16,36,0.45)");
  top.addColorStop(1, "rgba(24,16,36,0)");
  g.fillStyle = top;
  g.fillRect(0, 0, 1440, 420);
  g.save();
  g.globalCompositeOperation = "screen";
  const glow = g.createRadialGradient(bx, by, 0, bx, by, 300);
  glow.addColorStop(0, "rgba(255,200,120,0.24)");
  glow.addColorStop(1, "rgba(255,200,120,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, 1440, 1080);
  g.restore();
}

export async function createScene(options: SceneOptions): Promise<Scene> {
  return coverScene(options, async (g, k, signal) => {
    const font = "note" as const;
    await loadFont(font);
    const frames = await loadFrames(options, T_GLOW, LENS, PLACE.z, k, signal);
    paintMerged(g, k, frames, PLACE, "contrast(1.16)");
    bloom(g, k);
    grade(g);
    nightLine(g, k, FONTS[font].family, "你是拽人的，", "拽人的", 720, 196, 104);
    nightLine(g, k, FONTS[font].family, "还是被拽的？", "被拽的", 720, 322, 104);
  });
}
