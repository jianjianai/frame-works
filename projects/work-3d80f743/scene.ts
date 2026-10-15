import type { SceneOptions } from "@frame/engine/types";
import { createCompositionScene } from "@frame/engine/compositor";
import visual from "./visual.json";

// visual.json 排列图层；"scene" 图层的 module 名称在这里注册。
// film：《341个字》草稿，整支片在一个模块里按绝对时间绘制（代码在 film/）。
export function createScene(options: SceneOptions) {
  return createCompositionScene(options, visual, {
    film: () => import("./film/film"),
  });
}
