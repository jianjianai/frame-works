// 分层画的头发（用户照参考图一块一块画的）：正面、3/4 两张线稿里同一块头发逐点对应起来。线稿换算.mjs 用它。
// 图层（3/4 那张前面加 side-）：hair-back 后面那片（头顶、后脑勺、翘出来的碎发）、hair-bangs 刘海、hair-lock-l / hair-lock-r 鬓发
// （画面左那边的 hair-lock-l 转到 3/4 时在远处，藏到脸后面）、hair-tail 马尾、hair-tie 发圈；每块一条闭合的路径，正面和 3/4 的同一块 id 一样。
// 对应：两张各自按画的节点取点（节点原样保留：尖的地方还是尖的），在「标志点」处对齐，两个标志点之间按弧长比例逐点对应——
// 两张的点都留着、另一张在同样的比例处插一个点。标志点是两张图里同一个位置的节点（缕的尖、顶、两头），
// 在线稿配置的 art.hairMarks 里写 { <id>: [[正面节点, 3/4 节点], …] }（节点从 0 数，按路径里的顺序；和起点重合的最后一个节点不算）；
// 不写时：两张节点一样多就按顺序一个对一个（同样的画法、同样的起点），不然按最左、最上、最右、最低四个点。
import { bez, layerPathsById } from "./线稿换算工具.mjs";

export const HAIR_LAYERS = { "hair-back": "back", "hair-bangs": "front", "hair-lock-l": "far", "hair-lock-r": "front", "hair-tail": "tail", "hair-tie": "tie" };

/** 两张线稿里的分层头发：{ back: [{ id, f, s }], front: […], far, tail, tie }（f、s 是路径），没有分层头发时返回 null */
export function hairLayersOf(svgF, svgS) {
  const out = {};
  let any = false;
  for (const [layer, kind] of Object.entries(HAIR_LAYERS)) {
    let F, S;
    try {
      F = layerPathsById(svgF, layer);
      S = layerPathsById(svgS, "side-" + layer);
    } catch {
      continue;
    }
    const ids = Object.keys(F);
    if (!ids.length && !Object.keys(S).length) continue;
    for (const id of ids) if (!S[id]) throw new Error(`头发 ${id}：3/4 那张里没有（同一块两张的 id 要一样）`);
    for (const id of Object.keys(S)) if (!F[id]) throw new Error(`头发 ${id}：正面那张里没有`);
    (out[kind] ??= []).push(...ids.map((id) => ({ id, f: F[id], s: S[id] })));
    any = true;
  }
  return any ? out : null;
}

const NODE_N = 12;
/** 零长的段（线稿坐标里四个点都挤在 0.05 以内：闭合时 z 补的一小截） */
const zero = (seg) => seg.every((q) => Math.hypot(q[0] - seg[0][0], q[1] - seg[0][1]) < 0.05);
/** 闭合路径 → 折线（每段 NODE_N 个点）、每个节点在折线里的下标（零长的段去掉：节点并到下一个） */
function nodePoly(p, map) {
  const pts = [];
  const at = [];
  p.segs.forEach((seg) => {
    at.push(pts.length);
    if (zero(seg)) return;
    for (let k = 0; k < NODE_N; k++) pts.push(bez(seg, k / NODE_N));
  });
  const m = map(pts);
  const N = m.length;
  // 去掉和下一个点重合的点（下标往前挪）
  const keep = [];
  const idx = new Array(N);
  for (let i = 0; i < N; i++) {
    idx[i] = keep.length;
    const q = m[(i + 1) % N];
    if (Math.hypot(q[0] - m[i][0], q[1] - m[i][1]) > 1e-3) keep.push(m[i]);
  }
  const nodes = at.map((i) => idx[i % N] % keep.length);
  // 统一成画面上顺时针（y 朝下）
  let area = 0;
  for (let i = 0; i < keep.length; i++) {
    const [x0, y0] = keep[i];
    const [x1, y1] = keep[(i + 1) % keep.length];
    area += x0 * y1 - x1 * y0;
  }
  if (area >= 0) return { pts: keep, nodes };
  const n = keep.length;
  return { pts: [...keep].reverse(), nodes: nodes.map((i) => (n - 1 - i) % n) };
}
/** 闭合折线从下标 a 走到 b（绕回；a == b 走一整圈）：点和每个点的累计弧长（0..1） */
function walk(pts, a, b) {
  const n = pts.length;
  const out = [pts[a]];
  for (let i = (a + 1) % n; ; i = (i + 1) % n) {
    out.push(pts[i]);
    if (i === b) break;
  }
  const d = [0];
  for (let i = 1; i < out.length; i++) d.push(d[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  const L = d[d.length - 1] || 1;
  return { out, s: d.map((v) => v / L) };
}
function at(w, s) {
  let j = 1;
  while (j < w.s.length - 1 && w.s[j] < s) j++;
  const u = (s - w.s[j - 1]) / (w.s[j] - w.s[j - 1] || 1);
  const [a, b] = [w.out[j - 1], w.out[j]];
  return [a[0] + (b[0] - a[0]) * Math.max(0, Math.min(1, u)), a[1] + (b[1] - a[1]) * Math.max(0, Math.min(1, u))];
}
const r2 = (p) => [+p[0].toFixed(2), +p[1].toFixed(2)];

/**
 * 一块头发正面 ↔ 3/4 逐点对应：返回 { front, side, marks }（点数一样，头的坐标）。
 * marks：[[正面节点, 3/4 节点], …]，不写按上面说的默认
 */
export function matchPiece(id, f, s, mapF, mapS, marks) {
  const A = nodePoly(f, mapF);
  const B = nodePoly(s, mapS);
  // 节点去重（零长段并到下一个节点后会重复）
  const uniq = (v) => [...new Set(v.nodes)];
  let pairs;
  let how;
  if (marks) {
    pairs = marks.map(([i, j]) => [A.nodes[i], B.nodes[j]]);
    how = "配置的标志点";
  } else if (uniq(A).length === uniq(B).length) {
    // 两张从同一个节点起、绕向一样时按顺序一个对一个：按原始顺序配，再统一绕向
    const ua = f.segs.map((_, i) => A.nodes[i]).filter((v, i, a) => a.indexOf(v) === i);
    const ub = s.segs.map((_, i) => B.nodes[i]).filter((v, i, a) => a.indexOf(v) === i);
    pairs = ua.map((v, k) => [v, ub[k]]);
    how = "节点按顺序";
  } else {
    pairs = boxPairs(A.pts, B.pts);
    how = "最左、最上、最右、最低";
  }
  return { ...correspond(id, A.pts, B.pts, pairs, how), how, pairs: pairs.length };
}

/** 最左、最上、最右、最低四个点（重合的去掉）：[[A 的下标, B 的下标], …] */
function boxPairs(A, B) {
  const box = (P) => {
    const by = (fn) => P.reduce((bi, q, i) => (fn(q) > fn(P[bi]) ? i : bi), 0);
    return [by((q) => -q[0]), by((q) => -q[1]), by((q) => q[0]), by((q) => q[1])];
  };
  const [ba, bb] = [box(A), box(B)];
  return ba.map((v, k) => [v, bb[k]]).filter((p, k, all) => all.findIndex((q) => q[0] === p[0] || q[1] === p[1]) === k);
}

/** 两条顺时针的闭合折线在标志点 pairs 处对齐，两个标志点之间按弧长比例逐点对应（两条的点都留着） */
function correspond(id, A, B, pairs, how) {
  // 按 A 的顺序排好，检查 B 的顺序一致
  pairs = [...pairs].sort((p, q) => p[0] - q[0]);
  const nB = B.length;
  const rel = pairs.map((p) => (p[1] - pairs[0][1] + nB) % nB);
  for (let k = 1; k < rel.length; k++)
    if (rel[k] <= rel[k - 1]) throw new Error(`头发 ${id}：标志点在正面和 3/4 的顺序不一样（${how}）：${JSON.stringify(pairs)}`);
  const front = [];
  const side = [];
  for (let k = 0; k < pairs.length; k++) {
    const [a0, b0] = pairs[k];
    const [a1, b1] = pairs[(k + 1) % pairs.length];
    const wa = walk(A, a0, pairs.length === 1 ? a0 : a1);
    const wb = walk(B, b0, pairs.length === 1 ? b0 : b1);
    // 两张的点都留着：合在一起的弧长比例（不含终点：下一段的起点）
    const ss = [...new Set([...wa.s, ...wb.s].map((v) => +v.toFixed(5)))].filter((v) => v < 1 - 1e-5).sort((p, q) => p - q);
    for (const v of ss) {
      front.push(r2(at(wa, v)));
      side.push(r2(at(wb, v)));
    }
  }
  return { front, side };
}
