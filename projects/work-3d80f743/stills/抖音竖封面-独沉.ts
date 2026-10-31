// 抖音竖封面 3:4（1080×1440：个人主页、双列信息流）「独沉」：和小红书那张是同一张图（独沉画法.ts 的 TALL）。
// 个人主页左下角盖点赞数：那里只有城。
import type { Scene, SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./B站封面画法";
import { TALL, paintDuchen } from "./独沉画法";

export const still: Still = { width: 1080, height: 1440 };

export async function createScene(options: SceneOptions): Promise<Scene> {
  return coverScene(options, (g, k) => paintDuchen(g, k, TALL), 1080);
}
