// 作品的 scene.ts（s0rrow 风格 MV 的模板）：visual.json 排列各幕、歌词层和颗粒层；"scene" 图层的 module 名称在这里注册，
// 幕数和 visual.json 保持一致。各幕和歌词层是作品自己的文件，颗粒层直接用素材库的。
import type { SceneOptions } from "@frame/engine/types";
import { createCompositionScene } from "@frame/engine/compositor";
import visual from "./visual.json";

export function createScene(options: SceneOptions) {
  return createCompositionScene(options, visual, {
    act1: () => import("./scenes/act1"),
    act2: () => import("./scenes/act2"),
    act3: () => import("./scenes/act3"),
    act4: () => import("./scenes/act4"),
    lyrics: () => import("./scenes/lyrics"),
    grain: () => import("@materials/s0rrow/code/grain"),
  });
}
