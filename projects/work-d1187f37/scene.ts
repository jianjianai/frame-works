import type { SceneOptions } from "@frame/engine/types";
import { createCompositionScene } from "@frame/engine/compositor";
import { timeline } from "@frame/engine/timeline";

// visual.json 排列图层；"scene" 图层的 module 名称在这里注册。幕数和 visual.json 保持一致。
export function createScene(options: SceneOptions) {
  return createCompositionScene(options, timeline().visual, {
    act1: () => import("./acts/act1"),
    act2: () => import("./acts/act2"),
    act3: () => import("./acts/act3"),
    act4: () => import("./acts/act4"),
    lyrics: () => import("./acts/lyrics"),
    grain: () => import("@materials/s0rrow/code/grain"),
  });
}
