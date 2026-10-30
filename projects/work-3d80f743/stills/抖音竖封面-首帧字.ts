// 抖音竖封面 3:4 的第二版：画面和 抖音竖封面.ts 一样，字换成首帧的两句设定字。画法在 抖音封面画法.ts。
import type { SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./抖音封面画法";

export const still: Still = { width: 1080, height: 1440 };

export function createScene(options: SceneOptions) {
  return coverScene(options, "竖", "首帧");
}
