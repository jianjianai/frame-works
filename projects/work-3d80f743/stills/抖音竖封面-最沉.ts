// 抖音竖封面 3:4 的第四版「最沉」：不剧透（「城里都说，她是 / 最沉的人」，第二幕她在半空抱住飘起来的千斤）。
// 画法在 抖音封面画法.ts。
import type { SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./抖音封面画法";

export const still: Still = { width: 1080, height: 1440 };

export function createScene(options: SceneOptions) {
  return coverScene(options, "竖", "最沉");
}
