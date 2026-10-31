// 小红书封面 3:4（1080×1440，双列信息流整张显示）「独沉」：B 站选定那张竖着重新摆（独沉画法.ts 的 TALL），和抖音竖封面是同一张图。
// 视频笔记右上角盖播放标：那里只有天顶的白。
import type { Scene, SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./B站封面画法";
import { TALL, paintDuchen } from "./独沉画法";

export const still: Still = { width: 1080, height: 1440 };

export async function createScene(options: SceneOptions): Promise<Scene> {
  return coverScene(options, (g, k) => paintDuchen(g, k, TALL), 1080);
}
