import type { SceneOptions } from "../../src/engine/types";
import { createCompositionScene } from "../../src/engine/compositor";
import visual from "./visual.json";

// visual.json 排列图层；"scene" 图层的 module 名称在这里注册。
// 重置版删掉了原来的第二幕（第二遍副歌的情绪蒙太奇）和第三幕（秋千），原文件在作品 bdd5c2f8 和素材库 reference/ 里。
export function createScene(options: SceneOptions) {
  return createCompositionScene(options, visual, {
    act1: () => import("./scenes/act1"),
    act4: () => import("./scenes/act4"),
    act5: () => import("./scenes/act5"),
    act6: () => import("./scenes/act6"),
    lyrics: () => import("./scenes/lyrics"),
    grain: () => import("./scenes/grain"),
  });
}
