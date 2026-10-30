// 抖音横封面 4:3 的第四版「最沉」：不剧透（「城里都说，她是 / 最沉的人」，第二幕她在半空抱住飘起来的千斤）。
// 画法在 抖音封面画法.ts。
import type { SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./抖音封面画法";

export const still: Still = { width: 1440, height: 1080 };

export function createScene(options: SceneOptions) {
  return coverScene(options, "横", "最沉");
}
