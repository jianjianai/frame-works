// 那块写着「活下去」的砖（⑩ 她从屋里抱出来、⑪ 放进千斤手里）：和屋里写字时同一块（屋里 116×40、她 1.22 倍 → 世界里 95×33），
// 正面朝镜头、字是她的手写（龙藏体）；warm 0..1 暖起来，和前奏里砖亮起来一样变成暖金色。

import { part } from "./world";
import { HAND_FONT } from "./note";

export const WORD_BRICK = { w: 95, h: 33 };

/** 画一块写着字的砖：中心 (cx, cy)，转 rot（弧度），warm 暖起来多少 */
export function drawWordBrick(g: CanvasRenderingContext2D, cx: number, cy: number, word: string, rot = 0, warm = 0, lw = 3) {
  const { w, h } = WORD_BRICK;
  const mix = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * warm)).join(",")})`;
  g.save();
  g.translate(cx, cy);
  g.rotate(rot);
  const p = new Path2D();
  p.roundRect(-w / 2, -h / 2, w, h, 4);
  part(g, p, mix([203, 198, 189], [255, 214, 150]), mix([178, 173, 164], [236, 176, 108]), lw, [3, 3]);
  g.fillStyle = warm > 0.5 ? "#6a3a20" : "#3f3140";
  g.font = `${h * 0.66}px ${HAND_FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(word, 0, 1, w - 8);
  g.restore();
}
