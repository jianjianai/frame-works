// 临时：给没有自己参考图的配角画头发用的底图（不在时间轴上）。按线稿坐标画成两倍大（和素材库 code/linebase.ts 一样），
// 不画头发、帽子、发卡，头不放大：每张脸两页，偶数秒正面、奇数秒 3/4。素材库 tools/头发描点.mjs 看 的时候当参考图。
import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { CAST, type CastSpec, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import { drawFigure, figureJoints, figurePose } from "@materials/剪纸角色/code/chengtuo";

const bald = (spec: CastSpec): CastSpec => ({ ...spec, hair: "none", hairArt: undefined, hat: undefined, hairclip: undefined, headScale: undefined });
/** 主角的脸、周磊的脸、老钟的脸、千斤的妈妈的脸、小石头的妈妈的脸 */
export const FACES = [CAST.千斤, CAST.年轻人, passerby(2), CAST.秤砣的妈妈, CAST.小石头的妈妈].map(bald);
export const sample: Sample = { duration: FACES.length * 2 };
const K = 0.905;
const S = 2;

export function createScene({ width, height }: SceneOptions): Scene {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  return {
    canvas,
    render(t) {
      const i = Math.min(FACES.length * 2 - 1, Math.floor(t));
      const look = lookOf(FACES[i >> 1]);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = "#fff";
      g.fillRect(0, 0, width, height);
      const pose = figurePose({ face: i % 2 ? -1 : 0 }, 0.3, look);
      const hip = figureJoints(pose, look).hip;
      const r = width / 1080;
      g.setTransform((r * S) / K, 0, 0, (r * S) / K, 229.5 * S * r, 463.8 * S * r);
      g.translate(-hip[0], -hip[1]);
      drawFigure(g, pose, look);
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
