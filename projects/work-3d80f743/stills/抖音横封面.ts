// 抖音横封面 4:3（创作者中心的「横封面」：搜索、电脑网页），画法在 抖音封面画法.ts。
import type { SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./抖音封面画法";

export const still: Still = { width: 1440, height: 1080 };

export function createScene(options: SceneOptions) {
  return coverScene(options, "横");
}
