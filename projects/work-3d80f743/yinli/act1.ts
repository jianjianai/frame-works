// 第一幕 0:00–0:39.99「最沉的人」
import type { SceneOptions } from "@frame/engine/types";
import { makeAct } from "./core";
import { introShots } from "./intro";
import { verse1Shots } from "./verse1";
import { pre1Shots } from "./pre1";
import { webShotA } from "./web";

export function createScene(options: SceneOptions) {
  return makeAct(options, 0, [...introShots, ...verse1Shots, ...pre1Shots, webShotA]);
}
