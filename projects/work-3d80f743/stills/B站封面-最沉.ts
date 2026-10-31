// B 站封面 4:3 的「最沉」版（几版让用户挑，比点击率；规格和共用画法见 B站封面画法.ts）。
// 打法：反差。字是成片的设定字「城里都说，她是 / 最沉的人」，画面却是她自己飘起来——0:38.60 夜里台灯下，她脱了铁靴，
// 光着脚从椅子上浮起来，闭着眼笑，脚踝上的绳子垂到椅子腿，空铁靴倒在桌下写好字的砖旁边（和小红书第二张同一刻）。
// 「最沉」和飘起来对不上，点进去才知道为什么；她一脱靴子就飘是 0:38 交代的设定，不碰结局。暖灯夜景，主角一个人。
// 横屏这一镜屋子往右多画了一面墙（墙上的日历），字放在那面墙上；竖屏往上多画了，头顶让出 16:9 的上沿。
import type { Scene, SceneOptions, Still } from "@frame/engine/types";
import { FONTS, loadFont } from "./抖音封面画法";
import { bloom, nightLine } from "./小红书封面画法";
import { type Place, coverScene, loadFrames, paintMerged, toCover } from "./B站封面画法";

export const still: Still = { width: 1440, height: 1080 };

/** 她光着脚从椅子上浮起来（设计坐标：头顶 y 315、脸 x 470–600、脚 1418；日历 x 957–1207 y 335–627） */
const T_FLOAT = 38.6;
/** lib/wide.ts act2 的 37.79 起：默认取景 */
const LENS = { k: 0.72 };
/** 封面取设计 x −182–1818、y 72–1572：她在左边，头顶在封面 175；右边是墙 */
const PLACE: Place = { z: 0.72, fx: 818, fy: 822 };

/** 台灯下的调子：四个角和顶上压进屋里的暗处（两张成片都没画到的角落藏在里面），台灯和她那里留着光 */
function grade(g: CanvasRenderingContext2D) {
  const [lx, ly] = toCover(PLACE, 330, 900);
  g.save();
  g.translate(lx, ly);
  g.scale(1.5, 1.1);
  const edge = g.createRadialGradient(0, 0, 320, 0, 0, 820);
  edge.addColorStop(0, "rgba(43,27,28,0)");
  edge.addColorStop(0.6, "rgba(43,27,28,0.4)");
  edge.addColorStop(1, "rgba(43,27,28,0.88)");
  g.fillStyle = edge;
  g.fillRect(-1600, -1600, 3200, 3200);
  g.restore();
  const top = g.createLinearGradient(0, 0, 0, 200);
  top.addColorStop(0, "rgba(36,22,24,0.75)");
  top.addColorStop(1, "rgba(36,22,24,0)");
  g.fillStyle = top;
  g.fillRect(0, 0, 1440, 200);
}

export async function createScene(options: SceneOptions): Promise<Scene> {
  return coverScene(options, async (g, k, signal) => {
    const font = "note" as const;
    await loadFont(font);
    const frames = await loadFrames(options, T_FLOAT, LENS, PLACE.z, k, signal);
    // 竖屏左上角有个架子（设计 x 40 以左），铺底的那一竖条躲开它
    paintMerged(g, k, frames, PLACE, "contrast(1.1)", [44, 1032]);
    bloom(g, k);
    grade(g);
    nightLine(g, k, FONTS[font].family, "城里都说，她是", "", 1090, 500, 64);
    nightLine(g, k, FONTS[font].family, "最沉的人", "最沉", 1090, 630, 132);
  });
}
