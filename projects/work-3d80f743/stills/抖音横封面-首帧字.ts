// 抖音横封面 4:3 的第二版：画面和 抖音横封面.ts 一样，字换成首帧的两句设定字。画法在 抖音封面画法.ts。
import type { SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./抖音封面画法";

export const still: Still = { width: 1440, height: 1080 };

export function createScene(options: SceneOptions) {
  return coverScene(options, "横", "首帧");
}
