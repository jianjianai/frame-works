// 小红书封面第二版「下面都有他」，画法在 小红书封面画法.ts。
import type { SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./小红书封面画法";

export const still: Still = { width: 1080, height: 1440 };

export function createScene(options: SceneOptions) {
  return coverScene(options, 1);
}
