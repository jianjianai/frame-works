// visual.json 排列各幕、歌词层和颗粒层；"scene" 图层的 module 名称在这里注册。
import type { SceneOptions } from "@frame/engine/types";
import { createCompositionScene } from "@frame/engine/compositor";
import visual from "./visual.json";

export function createScene(options: SceneOptions) {
  return createCompositionScene(options, visual, {
    storyboard: () => import("./scenes/storyboard"),
    act1: () => import("./scenes/act1"),
    act2: () => import("./scenes/act2"),
    act3: () => import("./scenes/act3"),
    lyrics: () => import("./scenes/lyrics"),
    grain: () => import("@materials/s0rrow/code/grain"),
  });
}
