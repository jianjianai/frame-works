// 第二幕 0:39.99–1:11.97「她飘得最高」
import type { SceneOptions } from "@frame/engine/types";
import { makeAct } from "./core";
import { chorus1Shots } from "./chorus1";
import { inter1Shots } from "./inter1";

export function createScene(options: SceneOptions) {
  return makeAct(options, 39.99, [...chorus1Shots, ...inter1Shots]);
}
