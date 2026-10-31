// 抖音横封面 4:3（1440×1080：搜索、电脑网页）「独沉」：和 B 站那张是同一张图（同样 4:3，独沉画法.ts 的 WIDE）。
import type { Scene, SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./B站封面画法";
import { WIDE, paintDuchen } from "./独沉画法";

export const still: Still = { width: 1440, height: 1080 };

export async function createScene(options: SceneOptions): Promise<Scene> {
  return coverScene(options, (g, k) => paintDuchen(g, k, WIDE));
}
