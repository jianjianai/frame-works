// B 站封面「躲着我」（4:3，悬念版），画法在 B站封面画法.ts。
import type { SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./B站封面画法";

export const still: Still = { width: 1440, height: 1080 };

export function createScene(options: SceneOptions) {
  return coverScene(options, "躲着我");
}
