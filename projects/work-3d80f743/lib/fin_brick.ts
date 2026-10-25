// 重做那一段（lib/fin_t.ts）里的两块砖：她那块「活下去」（她写给自己、插不进塞满的铁靴的那块；背面最后由他写上「沉沉，明天见」）、
// 他那块「妈妈，明天见」。画法和 lib/write5.ts 一样（屋里那块砖的坐标：底边中点 (428, 1356)，116 × 40；龙藏体手写），
// 背面的字按这里的时间写（T9.write0–write1，五 他在她摊开的手边写）。

import { E, ph } from "./cam";
import { part } from "./world";
import { HAND_FONT } from "./note";
import { T9 } from "./fin_t";

type V2 = [number, number];

const BRICK = { x: 428, y: 1356, w: 116, h: 40 };
/** 砖的中心（砖自己的坐标） */
const BC: V2 = [BRICK.x, BRICK.y - BRICK.h / 2];

interface Glyph {
  ch: string;
  c: V2;
  size: number;
  rot: number;
  at: [number, number] | null;
  rows: number;
  box: [number, number, number, number];
  stroke: (u: number) => V2;
}
const charC = (i: number): V2 => [BRICK.x - 34 + i * 34, BRICK.y - 22];
/** 她的「活下去」：龙藏体 29 号 */
const HER_WORDS: Glyph[] = [..."活下去"].map((ch, i) => ({
  ch,
  c: [charC(i)[0], charC(i)[1] + [0, 1, -1][i]] as V2,
  size: 29,
  rot: [-0.03, 0.04, -0.05][i],
  at: null,
  rows: 3,
  box: [charC(i)[0] - 16, charC(i)[1] - 15, 32, 30],
  stroke: () => charC(i),
}));
/** 小孩的字：一行挤在砖上，小一号、歪歪扭扭；at 给了就按时间两行来回划出来 */
function kidWords(text: string, dy: number[], sizes: number[], rots: number[], at: ([number, number] | null)[]): Glyph[] {
  const chs = [...text];
  const adv = chs.map((c) => (c === "，" ? 11 : 19));
  const total = adv.reduce((a, b) => a + b, 0);
  let x = BRICK.x - total / 2;
  return chs.map((ch, i) => {
    const cx = x + adv[i] / 2;
    x += adv[i];
    const c: V2 = [cx, BRICK.y - 20 + dy[i]];
    const size = sizes[i];
    const w = size * 1.1;
    const stroke = (u: number): V2 => {
      const k = Math.min(2 - 1e-6, Math.max(0, u) * 2);
      const r = Math.floor(k);
      const v = k - r;
      const dir = r % 2 === 0 ? 1 : -1;
      return [cx + dir * size * 0.42 * (2 * v - 1), c[1] - size * 0.16 + r * size * 0.32 + 1.5 * Math.sin(v * Math.PI * 4 + i * 1.5 + r)];
    };
    return { ch, c, size, rot: rots[i], at: at[i], rows: 2, box: [cx - w / 2, c[1] - w / 2, w, w], stroke };
  });
}
const GIFT_WORDS = kidWords("妈妈，明天见", [1, -1, 3, 0, 2, -1], [20, 19, 20, 20, 21, 20], [-0.07, 0.05, 0, -0.04, 0.06, -0.05], [null, null, null, null, null, null]);
/** 他写在她那块背面的「沉沉，明天见」：六个字一个一个写（逗号快一点） */
const SHEN_AT: [number, number][] = (() => {
  const w = [1, 1, 0.45, 1, 1, 1];
  const gap = 0.06;
  const total = T9.write1 - T9.write0 - gap * 5;
  const unit = total / w.reduce((a, b) => a + b, 0);
  let t = T9.write0;
  return w.map((k) => {
    const a = t;
    t += k * unit;
    const b = t;
    t += gap;
    return [a, b] as [number, number];
  });
})();
const SHEN_WORDS = kidWords("沉沉，明天见", [0, 2, 3, -1, 1, -2], [21, 20, 20, 20, 20, 21], [0.05, -0.06, 0, 0.04, -0.05, 0.06], SHEN_AT);

function drawGlyphs(g: CanvasRenderingContext2D, t: number, words: Glyph[]) {
  for (const gl of words) {
    if (gl.at && t <= gl.at[0]) continue;
    const [cx, cy] = gl.c;
    const u = gl.at ? ph(t, gl.at[0], gl.at[1]) : 1;
    g.save();
    if (u < 1) {
      const clip = new Path2D();
      const k = u * gl.rows;
      const r = Math.floor(k);
      const v = k - r;
      const [bx, top, bw, bh] = gl.box;
      const rowH = bh / gl.rows;
      if (r > 0) clip.rect(bx, top, bw, rowH * r);
      const w = bw * v;
      clip.rect(r % 2 === 0 ? bx : bx + bw - w, top + rowH * r, w, rowH);
      g.clip(clip);
    }
    g.translate(cx, cy);
    g.rotate(gl.rot);
    g.fillStyle = "#3f3140";
    g.font = `${gl.size}px ${HAND_FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(gl.ch, 0, 0);
    g.restore();
  }
}
function front(g: CanvasRenderingContext2D, lw: number) {
  const B = BRICK;
  const p = new Path2D();
  p.roundRect(B.x - B.w / 2, B.y - B.h, B.w, B.h, 5);
  part(g, p, "#cbc6bd", "#b2ada4", 3.5 * lw, [4, 4]);
}
/** 背面（没写字以前几个小坑；颜色暗一点，翻过来时分得出正反） */
function back(g: CanvasRenderingContext2D, lw: number) {
  const B = BRICK;
  const p = new Path2D();
  p.roundRect(B.x - B.w / 2, B.y - B.h, B.w, B.h, 5);
  part(g, p, "#c2bdb3", "#aaa59b", 3.5 * lw, [4, 4]);
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
 * 画一块砖：kind「her」她那块（flipY > 0 背面朝外：写上了的「沉沉，明天见」；< 0 正面「活下去」），「gift」他那块「妈妈，明天见」。
 * 中心 c、转 rot、缩放 size（街上的人按 1 倍画：屋里的 1/1.22）；flipY 竖着的倍数（剪纸绕长边一翻）；warm 0–1 亮起来时砖面叠一层暖光
 */
export function drawFinBrick(g: CanvasRenderingContext2D, kind: "her" | "gift", c: V2, rot: number, size: number, flipY: number, t: number, warm = 0, lw = 1) {
  g.save();
  g.translate(c[0], c[1]);
  g.rotate(rot);
  g.scale(size, size * Math.max(0.04, Math.abs(flipY)));
  g.translate(-BC[0], -BC[1]);
  if (kind === "gift") {
    front(g, lw);
    drawGlyphs(g, t, GIFT_WORDS);
  } else if (flipY > 0) {
    back(g, lw);
    drawGlyphs(g, t, SHEN_WORDS);
  } else {
    front(g, lw);
    drawGlyphs(g, t, HER_WORDS);
  }
  if (warm > 0.01) {
    // 亮起来：砖面上叠一层暖光（字照样看得清）
    const B = BRICK;
    const p = new Path2D();
    p.roundRect(B.x - B.w / 2, B.y - B.h, B.w, B.h, 5);
    g.globalCompositeOperation = "soft-light";
    g.fillStyle = `rgba(255,190,110,${0.75 * warm})`;
    g.fill(p);
    g.globalCompositeOperation = "source-over";
    g.fillStyle = `rgba(255,236,190,${0.22 * warm})`;
    g.fill(p);
  }
  g.restore();
}
/** 写字时笔尖在砖上的哪（砖自己的坐标，相对中心）：先悬在第一个字上方，一个字一个字写，字之间抬笔挪过去；写完挪到砖的右头外面 */
export function shenTip(t: number): V2 {
  const todo = SHEN_WORDS as (Glyph & { at: [number, number] })[];
  const away: V2 = [BRICK.x + BRICK.w / 2 + 10, BRICK.y - 34];
  const first = todo[0].stroke(0);
  let p: V2;
  if (t < todo[0].at[0]) {
    const u = E.in2(ph(t, todo[0].at[0] - 0.14, todo[0].at[0]));
    p = [first[0] + 6 * (1 - u), first[1] - 14 * (1 - u)];
  } else {
    p = away;
    for (let i = 0; i < todo.length; i++) {
      const [a, b] = todo[i].at;
      if (t <= b) {
        p = todo[i].stroke(ph(t, a, b));
        break;
      }
      const last = i === todo.length - 1;
      const next = last ? b + 0.22 : todo[i + 1].at[0];
      if (t < next) {
        const from = todo[i].stroke(1);
        const to: V2 = last ? away : todo[i + 1].stroke(0);
        const u = E.io(ph(t, b, next));
        p = [from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u - (last ? 0 : 10 * Math.sin(Math.PI * u))];
        break;
      }
    }
  }
  return [p[0] - BC[0], p[1] - BC[1]];
}
/** 写到第几个字了（0–5，连续的）：镜头跟着它往右挪，不跟笔尖来回划 */
export const shenProgress = (t: number) => 5 * E.io(ph(t, SHEN_AT[0][0], SHEN_AT[5][1]));
export const BRICK_WH: V2 = [BRICK.w, BRICK.h];
