// B 站封面 4:3 的「谁来拽住她」版（几版让用户挑，比点击率；规格和共用画法见 B站封面画法.ts）。
// 打法：提问 + 一个人的夜。字是抖音的标题「她拽住了全城飘起来的人 / 可谁来拽住她？」：前半句交代她是做什么的，后半句把好奇心
// 放到她自己身上。画面是 1:13.10 主歌二：夜里她一个人光着脚坐在窗框上，歪着头，眼泪挂在脸上，手里攥着拴住她的那根绳子；
// 窗外的城是倒挂着的（这一段屋子是倒着的，她往下就是天上的白）。拽住全城的人自己也撑不住了，正好接上「可谁来拽住她？」。
// 不剧透（中段，这一夜后来怎么了不说）。脸是几版里最大的之一，冷蓝的夜和暖墙，和其他几版的颜色拉开。
// 竖屏中间、横屏接两边（横屏这一镜收近到 1.3），比横屏稍远一点（1.2），她的头顶上让出窗外那片倒挂的城放字。
import type { Scene, SceneOptions, Still } from "@frame/engine/types";
import { FONTS, loadFont } from "./抖音封面画法";
import { bloom, nightLine } from "./小红书封面画法";
import { type Place, coverScene, loadFrames, paintMerged, toCover } from "./B站封面画法";

export const still: Still = { width: 1440, height: 1080 };

/** 她坐在窗框上、歪着头哭（设计坐标：头顶 y 872、脸 x 560–720 y 900–1080，坐着的窗台 y 1348；绳子从她手里往右上斜出画面） */
const T_SILL = 73.1;
/** lib/wide.ts act4 的 0–73.91：收近到 1.3、往左上挪 */
const LENS = { k: 1.3, ox: -44, oy: -65 };
/** 封面取设计 x −10–1190、y 539–1439：头顶在封面 400，上面是窗外倒挂的城；窗台在 16:9 的下沿附近 */
const PLACE: Place = { z: 1.2, fx: 590, fy: 989 };

/** 夜里的调子：四周压进深蓝紫，顶上再暗一点托住字；她的脸那里留着亮 */
function grade(g: CanvasRenderingContext2D) {
  const [fx, fy] = toCover(PLACE, 640, 1000);
  g.save();
  g.translate(fx, fy);
  g.scale(1.45, 1);
  const edge = g.createRadialGradient(0, 0, 300, 0, 0, 780);
  edge.addColorStop(0, "rgba(22,18,40,0)");
  edge.addColorStop(0.6, "rgba(22,18,40,0.35)");
  edge.addColorStop(1, "rgba(22,18,40,0.8)");
  g.fillStyle = edge;
  g.fillRect(-1600, -1600, 3200, 3200);
  g.restore();
  const top = g.createLinearGradient(0, 0, 0, 380);
  top.addColorStop(0, "rgba(18,14,34,0.7)");
  top.addColorStop(0.6, "rgba(18,14,34,0.3)");
  top.addColorStop(1, "rgba(18,14,34,0)");
  g.fillStyle = top;
  g.fillRect(0, 0, 1440, 380);
}

export async function createScene(options: SceneOptions): Promise<Scene> {
  return coverScene(options, async (g, k, signal) => {
    const font = "cover" as const;
    await loadFont(font);
    const frames = await loadFrames(options, T_SILL, LENS, PLACE.z, k, signal);
    paintMerged(g, k, frames, PLACE, "contrast(1.08)");
    bloom(g, k);
    grade(g);
    nightLine(g, k, FONTS[font].family, "她拽住了全城飘起来的人", "拽住", 690, 180, 58);
    nightLine(g, k, FONTS[font].family, "可谁来拽住她？", "拽住她", 690, 296, 116);
  });
}
