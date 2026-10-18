import type { SceneOptions } from "../../src/engine/types";
import { createCompositionScene } from "../../src/engine/compositor";
import visual from "./visual.json";

// visual.json 排列图层；"scene" 图层的 module 名称在这里注册。幕数和 visual.json 保持一致。
export function createScene(options: SceneOptions) {
  return createCompositionScene(options, visual, {
    act1: () => import("./scenes/act1-shots"),
    act2: () => import("./scenes/act2-shots"),
    act3: () => import("./scenes/act3-shots"),
    act4: () => import("./scenes/act4-shots"),
    lyrics: () => import("./scenes/lyrics"),
    grain: () => import("./scenes/grain"),
  });
}
