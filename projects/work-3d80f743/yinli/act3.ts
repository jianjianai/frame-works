// 第三幕 1:11.97–1:35.49「明天见」
import type { SceneOptions } from "@frame/engine/types";
import { makeAct } from "./core";
import { verse2Shots } from "./verse2";
import { pre2Shots } from "./pre2";

export function createScene(options: SceneOptions) {
  return makeAct(options, 71.97, [...verse2Shots, ...pre2Shots]);
}
