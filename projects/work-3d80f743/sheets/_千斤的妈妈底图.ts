// 临时：千斤的妈妈的线稿底图（素材库 code/linebase.ts），给素材库 tools/线稿生成.mjs 做 SVG 里的对照层。
import { CAST } from "@materials/剪纸角色/code/cast";
import { lineBaseSample, lineBaseScene } from "@materials/剪纸角色/code/linebase";

export const sample = lineBaseSample;
export const createScene = lineBaseScene(CAST.千斤的妈妈);
