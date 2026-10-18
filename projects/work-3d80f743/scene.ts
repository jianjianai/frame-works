import type { SceneOptions } from "@frame/engine/types";
import { createCompositionScene } from "@frame/engine/compositor";
import visual from "./visual.json";

// visual.json 排列图层；"scene" 图层的 module 名称在这里注册。
export function createScene(options: SceneOptions) {
  return createCompositionScene(options, visual, {
    act1: () => import("./yinli/act1"),
    act2: () => import("./yinli/act2"),
    act3: () => import("./yinli/act3"),
    act4: () => import("./yinli/act4"),
    act5: () => import("./yinli/act5"),
  });
}
