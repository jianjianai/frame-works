// 抖音竖封面 3:4 的第三版「引力」：故事的一句话「人不是被地拉住的 / 是被人拉住的」，结局她抱住他那一刻。画法在 抖音封面画法.ts。
import type { SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./抖音封面画法";

export const still: Still = { width: 1080, height: 1440 };

export function createScene(options: SceneOptions) {
  return coverScene(options, "竖", "引力");
}
