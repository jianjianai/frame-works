// B 站封面「瑕疵」（4:3），画法在 B站封面画法.ts。
import type { SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./B站封面画法";

export const still: Still = { width: 1440, height: 1080 };

export function createScene(options: SceneOptions) {
  return coverScene(options, "瑕疵");
}
