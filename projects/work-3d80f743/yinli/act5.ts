// 第五幕 1:53.88–2:32「引力」
import type { SceneOptions } from "@frame/engine/types";
import { makeAct } from "./core";
import { finale1Shots } from "./finale1";
import { finale2Shots } from "./finale2";

export function createScene(options: SceneOptions) {
  return makeAct(options, 113.88, [...finale1Shots, ...finale2Shots]);
}
