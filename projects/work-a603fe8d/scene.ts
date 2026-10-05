import type { SceneOptions } from "../../src/engine/types";
import { createCompositionScene } from "../../src/engine/compositor";
import visual from "./visual.json";

// visual.json 排列图层；"scene" 图层的 module 名称在这里注册。
export function createScene(options: SceneOptions) {
  return createCompositionScene(options, visual, {
    mv: () => import("./scenes/mv"),
  });
}
