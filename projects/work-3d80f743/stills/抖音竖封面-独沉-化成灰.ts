// 抖音竖封面 3:4「独沉」换文案的对比版（2026-11-01 改文案时给用户挑的，见 独沉画法.ts 的 COPIES.化成灰）：画面和正式那张一样，只换字。
import type { Scene, SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./B站封面画法";
import { COPIES, TALL, paintDuchen } from "./独沉画法";

export const still: Still = { width: 1080, height: 1440 };

export async function createScene(options: SceneOptions): Promise<Scene> {
  return coverScene(options, (g, k) => paintDuchen(g, k, TALL, COPIES.化成灰), 1080);
}
