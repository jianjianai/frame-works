// B 站封面 4:3「独沉」（用户 2026-10-31 从海报几版里选定，已导出）：黄昏，满城的人都往天顶的白里飘，只有楼顶正中间的她站着仰头，
// 字「城里人都说，她是 / 最沉的人」。画法和两种尺寸的摆法在 独沉画法.ts（小红书、抖音的「独沉」也用它），这张是 WIDE。
import type { Scene, SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./B站封面画法";
import { WIDE, paintDuchen } from "./独沉画法";

export const still: Still = { width: 1440, height: 1080 };

export async function createScene(options: SceneOptions): Promise<Scene> {
  return coverScene(options, (g, k) => paintDuchen(g, k, WIDE));
}
