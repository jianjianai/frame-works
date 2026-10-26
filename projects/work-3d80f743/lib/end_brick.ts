// 终章（lib/end_t.ts）里的两块砖：她那块（正面她写的「活下去」——写给自己、塞进靴筒的那块；背面是他写的「沉沉，明天见」，
// 观众到楼顶她翻过来才看见）、他那块「妈妈，明天见」。画法和 lib/write5.ts 一样（屋里那块砖的坐标：底边中点 (428, 1356)，116 × 40；
// 龙藏体手写）；街上的人按 1 倍画，砖按屋里的 1/1.22（BS）。

import { part } from "./world";
import { HAND_FONT } from "./note";

type V2 = [number, number];

const BRICK = { x: 428, y: 1356, w: 116, h: 40 };
/** 砖的中心（砖自己的坐标） */
const BC: V2 = [BRICK.x, BRICK.y - BRICK.h / 2];

interface Glyph {
  ch: string;
  c: V2;
  size: number;
  rot: number;
}
const charC = (i: number): V2 => [BRICK.x - 34 + i * 34, BRICK.y - 22];
/** 她的「活下去」：龙藏体 29 号 */
const HER_WORDS: Glyph[] = [..."活下去"].map((ch, i) => ({ ch, c: [charC(i)[0], charC(i)[1] + [0, 1, -1][i]] as V2, size: 29, rot: [-0.03, 0.04, -0.05][i] }));
/** 小孩的字：一行挤在砖上，小一号、歪歪扭扭 */
function kidWords(text: string, dy: number[], sizes: number[], rots: number[]): Glyph[] {
  const chs = [...text];
  const adv = chs.map((c) => (c === "，" ? 11 : 19));
  const total = adv.reduce((a, b) => a + b, 0);
  let x = BRICK.x - total / 2;
  return chs.map((ch, i) => {
    const cx = x + adv[i] / 2;
    x += adv[i];
    return { ch, c: [cx, BRICK.y - 20 + dy[i]] as V2, size: sizes[i], rot: rots[i] };
  });
}
const GIFT_WORDS = kidWords("妈妈，明天见", [1, -1, 3, 0, 2, -1], [20, 19, 20, 20, 21, 20], [-0.07, 0.05, 0, -0.04, 0.06, -0.05]);
/** 他写在她那块背面的「沉沉，明天见」（和「妈妈，明天见」一样大、一样歪） */
const SHEN_WORDS = kidWords("沉沉，明天见", [0, 2, 3, -1, 1, -2], [21, 20, 20, 20, 20, 21], [0.05, -0.06, 0, 0.04, -0.05, 0.06]);

function drawGlyphs(g: CanvasRenderingContext2D, words: Glyph[]) {
  g.fillStyle = "#3f3140";
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (const gl of words) {
    g.save();
    g.translate(gl.c[0], gl.c[1]);
    g.rotate(gl.rot);
    g.font = `${gl.size}px ${HAND_FONT}`;
    g.fillText(gl.ch, 0, 0);
    g.restore();
  }
}
const brickPath = () => {
  const B = BRICK;
  const p = new Path2D();
  p.roundRect(B.x - B.w / 2, B.y - B.h, B.w, B.h, 5);
  return p;
};
function front(g: CanvasRenderingContext2D, lw: number) {
  part(g, brickPath(), "#cbc6bd", "#b2ada4", 3.5 * lw, [4, 4]);
}
/** 背面：颜色暗一点、几个小坑（翻过来时分得出正反） */
function back(g: CanvasRenderingContext2D, lw: number) {
  const B = BRICK;
  part(g, brickPath(), "#c2bdb3", "#aaa59b", 3.5 * lw, [4, 4]);
  g.fillStyle = "rgba(118,108,102,0.38)";
  for (const [dx, dy, r] of [
    [-30, -26, 2.4],
    [12, -14, 1.9],
    [38, -29, 1.6],
    [-9, -9, 1.5],
  ]) {
    g.beginPath();
    g.arc(B.x + dx, B.y + dy, r, 0, Math.PI * 2);
    g.fill();
  }
}

/**
 * 画一块砖：kind「her」她那块（flipY > 0 背面朝外：「沉沉，明天见」；< 0 正面「活下去」），「gift」他那块「妈妈，明天见」。
 * 中心 c、转 rot、缩放 size（街上 BS）；flipY 竖着的倍数（剪纸绕长边一翻：cos 过 0 时换面）；warm 0–1 亮起来时砖面叠一层暖光；
 * blank：背面还没写字（第一视角里他捡起来时背面朝上）
 */
export function drawEndBrick(g: CanvasRenderingContext2D, kind: "her" | "gift", c: V2, rot: number, size: number, flipY: number, warm = 0, lw = 1, blank = false) {
  g.save();
  g.translate(c[0], c[1]);
  g.rotate(rot);
  g.scale(size, size * Math.max(0.04, Math.abs(flipY)));
  g.translate(-BC[0], -BC[1]);
  if (kind === "gift") {
    front(g, lw);
    drawGlyphs(g, GIFT_WORDS);
  } else if (flipY > 0) {
    back(g, lw);
    if (!blank) drawGlyphs(g, SHEN_WORDS);
  } else {
    front(g, lw);
    drawGlyphs(g, HER_WORDS);
  }
  if (warm > 0.01) {
    // 亮起来：砖面上叠一层暖光（字照样看得清）
    const p = brickPath();
    g.globalCompositeOperation = "soft-light";
    g.fillStyle = `rgba(255,190,110,${0.75 * warm})`;
    g.fill(p);
    g.globalCompositeOperation = "source-over";
    g.fillStyle = `rgba(255,236,190,${0.22 * warm})`;
    g.fill(p);
  }
  g.restore();
}
export const BRICK_WH: V2 = [BRICK.w, BRICK.h];
/** 街上的砖按屋里的 1/1.22 画 */
export const BS = 1 / 1.22;
/** 砖的半长（街上的大小），两只手捏在两头往里一点 */
export const HALF = (BRICK.w * BS) / 2 - 6;
