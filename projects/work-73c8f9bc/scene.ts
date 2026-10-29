// 《屏蔽》：visual.json 排列三幕、歌词层和颗粒层；"scene" 图层的 module 名称在这里注册。
// 各幕和歌词层在 acts/，颗粒层直接用素材库的。
import type { SceneOptions } from "@frame/engine/types";
import { createCompositionScene } from "@frame/engine/compositor";
import { timeline } from "@frame/engine/timeline";

export function createScene(options: SceneOptions) {
  return createCompositionScene(options, timeline().visual, {
    act1: () => import("./acts/act1"),
    act2: () => import("./acts/act2"),
    act3: () => import("./acts/act3"),
    lyrics: () => import("./acts/lyrics"),
    grain: () => import("@materials/s0rrow/code/grain"),
  });
}
