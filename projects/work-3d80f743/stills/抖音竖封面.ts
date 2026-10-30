// 抖音竖封面 3:4（创作者中心的「竖封面」：个人主页、双列信息流），画法在 抖音封面画法.ts。
import type { SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./抖音封面画法";

export const still: Still = { width: 1080, height: 1440 };

export function createScene(options: SceneOptions) {
  return coverScene(options, "竖");
}
