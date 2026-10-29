// 小红书封面第一版「盯了我三年」，画法在 小红书封面画法.ts。
import type { SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./小红书封面画法";

export const still: Still = { width: 1080, height: 1440 };

export function createScene(options: SceneOptions) {
  return coverScene(options, 0);
}
