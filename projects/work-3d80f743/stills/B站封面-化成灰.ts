// B 站封面 4:3 的「化成灰」版（几版让用户挑，比点击率；规格和共用画法见 B站封面画法.ts）。
// 打法：世界的规则 + 危机。字是成片首帧的第二句设定字「飘进天上的强光，/ 就会化成灰」（「化成灰」暖赭红）——第一版用的是
// 前一句（「一绝望就会飘起来」），这版把后果直接摆出来。画面是 0:27.10：千斤飘在半空，闭着眼哭，钥匙插在脚踝那把锁上、锁刚打开，
// 拴着哑铃的铁链就要松了，四周的天上飘满发着光往上去的人。字说飘上去会化成灰，画面里她正亲手打开锁——她为什么要这样、
// 有没有人拦住她，点进去才知道（下一秒沉沉就扑出楼顶）。不剧透（前半段）。
// 横屏这一刻她的左边是大片的天、右边是楼：封面往左一直取到横屏画到的地方（设计 x −793），右边停在楼前（1471）；
// 竖屏往上多画了天，她往下放，头顶上那片天放字。两张都没画到的上面两角是天，用竖屏边上一竖条拉开铺上。
// 0:26 前后她往上飘、脚下吊着整只哑铃那几帧更像设定图，但人连哑铃太高、横屏两边又是楼，放不下字。
import type { Scene, SceneOptions, Still } from "@frame/engine/types";
import { FONTS, line, loadFont } from "./抖音封面画法";
import { bloom } from "./小红书封面画法";
import { type Place, coverScene, loadFrames, paintMerged, toCover } from "./B站封面画法";

export const still: Still = { width: 1440, height: 1080 };

/** 锁刚打开（设计坐标：她 x 0–885、y 585–1460，脸 720,735，锁 315,990；铁链往下出画） */
const T_UNLOCK = 27.1;
/** lib/wide.ts act2 的 0–27.84：默认取景 */
const LENS = { k: 0.72 };
/** 封面取设计 x −793–1471、y 0–1698 */
const PLACE: Place = { z: 0.636, fx: 339, fy: 849 };

/** 下面和两边压一层暗紫（正片叠底），光点和她更跳，顶上放字的天不压，再亮一层暖白；她的脸那里亮一点 */
function grade(g: CanvasRenderingContext2D, k: number) {
  const off = document.createElement("canvas");
  off.width = g.canvas.width;
  off.height = g.canvas.height;
  const h = off.getContext("2d")!;
  h.setTransform(k, 0, 0, k, 0, 0);
  const [mx, my] = toCover(PLACE, 520, 1000);
  h.save();
  h.translate(mx, my);
  h.scale(1.45, 1);
  const edge = h.createRadialGradient(0, 0, 320, 0, 0, 820);
  edge.addColorStop(0, "rgba(118,62,128,0)");
  edge.addColorStop(1, "rgba(118,62,128,0.5)");
  h.fillStyle = edge;
  h.fillRect(-1600, -1600, 3200, 3200);
  h.restore();
  const down = h.createLinearGradient(0, 640, 0, 1080);
  down.addColorStop(0, "rgba(140,80,150,0)");
  down.addColorStop(1, "rgba(140,80,150,0.4)");
  h.fillStyle = down;
  h.fillRect(0, 0, 1440, 1080);
  h.globalCompositeOperation = "destination-in";
  const keepTop = h.createLinearGradient(0, 300, 0, 560);
  keepTop.addColorStop(0, "rgba(0,0,0,0)");
  keepTop.addColorStop(1, "rgba(0,0,0,1)");
  h.fillStyle = keepTop;
  h.fillRect(0, 0, 1440, 1080);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "multiply";
  g.drawImage(off, 0, 0);
  g.restore();
  g.save();
  g.globalCompositeOperation = "screen";
  g.translate(720, 160);
  g.scale(1.8, 1);
  const light = g.createRadialGradient(0, 0, 0, 0, 0, 420);
  light.addColorStop(0, "rgba(255,240,222,0.5)");
  light.addColorStop(1, "rgba(255,240,222,0)");
  g.fillStyle = light;
  g.fillRect(-1000, -1000, 2000, 2000);
  g.restore();
}

export async function createScene(options: SceneOptions): Promise<Scene> {
  return coverScene(options, async (g, k, signal) => {
    const font = "note" as const;
    await loadFont(font);
    const frames = await loadFrames(options, T_UNLOCK, LENS, PLACE.z, k, signal);
    paintMerged(g, k, frames, PLACE);
    bloom(g, k);
    grade(g, k);
    line(g, k, FONTS[font].family, { text: "飘进天上的强光，", x: 720, y: 190, size: 64 });
    line(g, k, FONTS[font].family, { text: "就会化成灰", accent: ["化成灰"], x: 720, y: 316, size: 128 });
  });
}
