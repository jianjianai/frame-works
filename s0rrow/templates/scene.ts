import type { SceneOptions } from "../../src/engine/types";
import { createCompositionScene } from "../../src/engine/compositor";
import visual from "./visual.json";

// visual.json 排列图层；"scene" 图层的 module 名称在这里注册。
export function createScene(options: SceneOptions) {
  return createCompositionScene(options, visual, {
    act1: () => import("./scenes/act1"),
    act2: () => import("./scenes/act2"),
    act3: () => import("./scenes/act3"),
    act4: () => import("./scenes/act4"),
    act5: () => import("./scenes/act5"),
    act6: () => import("./scenes/act6"),
    lyrics: () => import("./scenes/lyrics"),
    grain: () => import("./scenes/grain"),
  });
}
