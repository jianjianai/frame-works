// 第四幕 1:35.49–1:53.88「赤脚」
import type { SceneOptions } from "@frame/engine/types";
import { makeAct } from "./core";
import { chorus2Shots } from "./chorus2";

export function createScene(options: SceneOptions) {
  return makeAct(options, 95.49, [...chorus2Shots]);
}
