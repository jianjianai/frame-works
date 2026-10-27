// 线稿换算的通用部分：读 SVG 里的路径（认 M L H V C S Q T Z 大小写和 transform）、取点、按弧长重采样、线稿坐标 → 头的坐标。
// 线稿换算.mjs（按 id 认线）用它；作品里自己写的换算脚本（例：作品 3d80f743 的 周磊线稿换算.mjs，按画的顺序认线）也可以用。

/** 线稿坐标 → 头的坐标（头不缩放、体型不加宽：配角的骨架和主角一样）。3/4 时脖子往前 6.44、头往后 8 */
export const K = 0.905;
const NECK_Y = -162.7;
const HEAD_UP = 55;
export const Y0 = 463.8 + (NECK_Y - HEAD_UP) / K;
export const KY = 1 / K;
export const MAP = {
  front: { x0: 229.5, kx: 1 / K },
  side: { x0: 229.5 + (10 * Math.sin(-0.7) + 8) / K, kx: 1 / K },
};
export const toHead = (view) => (pts) => pts.map(([X, Y]) => [+((X - MAP[view].x0) / MAP[view].kx).toFixed(2), +((Y - Y0) / KY).toFixed(2)]);
/** 线稿坐标 → 身体坐标（原点在胯） */
export const toBody = ([X, Y]) => [+((X - 229.5) * K).toFixed(2), +((Y - 463.8) * K).toFixed(2)];
export const fmt = (pts) => "[" + pts.map(([x, y]) => `[${x}, ${y}]`).join(", ") + "]";

// ——— SVG 路径 ———
export function parseTransform(s) {
  let m = [1, 0, 0, 1, 0, 0];
  const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
  for (const [, fn, args] of (s ?? "").matchAll(/(\w+)\(([^)]*)\)/g)) {
    const v = args.split(/[\s,]+/).filter(Boolean).map(Number);
    if (fn === "matrix") m = mul(m, v);
    else if (fn === "translate") m = mul(m, [1, 0, 0, 1, v[0], v[1] ?? 0]);
    else if (fn === "scale") m = mul(m, [v[0], 0, 0, v[1] ?? v[0], 0, 0]);
    else throw new Error("不认识的变换 " + fn);
  }
  return ([x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}
/** d → 子路径，每条是三次贝塞尔段 [p0, c1, c2, p3] 的列表（绝对坐标），closed 标记 */
export function parsePath(d) {
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g);
  let i = 0;
  const num = () => +toks[i++];
  const subs = [];
  let cur = null;
  let p = [0, 0];
  let start = [0, 0];
  let lastC = null;
  let cmd = null;
  const line = (q) => cur.segs.push([p, [p[0] + (q[0] - p[0]) / 3, p[1] + (q[1] - p[1]) / 3], [p[0] + (2 * (q[0] - p[0])) / 3, p[1] + (2 * (q[1] - p[1])) / 3], q]);
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase();
    const o = rel ? p : [0, 0];
    const pt = () => [o[0] + num(), o[1] + num()];
    switch (cmd.toLowerCase()) {
      case "m": {
        p = pt();
        start = p;
        cur = { segs: [], closed: false };
        subs.push(cur);
        cmd = rel ? "l" : "L";
        lastC = null;
        break;
      }
      case "l": {
        const q = pt();
        line(q);
        p = q;
        lastC = null;
        break;
      }
      case "h": {
        const q = [rel ? p[0] + num() : num(), p[1]];
        line(q);
        p = q;
        lastC = null;
        break;
      }
      case "v": {
        const q = [p[0], rel ? p[1] + num() : num()];
        line(q);
        p = q;
        lastC = null;
        break;
      }
      case "c": {
        const c1 = pt();
        const c2 = pt();
        const q = pt();
        cur.segs.push([p, c1, c2, q]);
        lastC = c2;
        p = q;
        break;
      }
      case "s": {
        const c1 = lastC ? [2 * p[0] - lastC[0], 2 * p[1] - lastC[1]] : p;
        const c2 = pt();
        const q = pt();
        cur.segs.push([p, c1, c2, q]);
        lastC = c2;
        p = q;
        break;
      }
      case "q": {
        const c = pt();
        const q = pt();
        cur.segs.push([p, [p[0] + (2 / 3) * (c[0] - p[0]), p[1] + (2 / 3) * (c[1] - p[1])], [q[0] + (2 / 3) * (c[0] - q[0]), q[1] + (2 / 3) * (c[1] - q[1])], q]);
        lastC = null;
        p = q;
        break;
      }
      case "z": {
        if (Math.hypot(p[0] - start[0], p[1] - start[1]) > 1e-6) line(start);
        cur.closed = true;
        p = start;
        lastC = null;
        break;
      }
      default:
        throw new Error("不认识的路径命令 " + cmd);
    }
  }
  return subs;
}
export function bez([p0, c1, c2, p3], t) {
  const a = 1 - t;
  return [0, 1].map((k) => a * a * a * p0[k] + 3 * a * a * t * c1[k] + 3 * a * t * t * c2[k] + t * t * t * p3[k]);
}
/** 段 → 折线（每段 n 个点，去掉重合的点） */
export function sample(segs, n = 10) {
  const pts = [segs[0][0]];
  for (const s of segs) for (let k = 1; k <= n; k++) pts.push(bez(s, k / n));
  return pts.filter((q, i) => i === 0 || Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) > 0.05);
}
/** 某个图层里的 path（按顺序）：{ segs, closed, tf } */
export function layerPaths(svg, id) {
  const m = svg.match(new RegExp(`<g class="layer" id="${id}"[^>]*>([\\s\\S]*?)</g>`));
  if (!m) throw new Error("没有图层 " + id);
  return [...m[1].matchAll(/<path\b([^>]*)\/?>/g)].map(([, attrs]) => {
    const d = attrs.match(/\sd="([^"]*)"/)[1];
    const tf = parseTransform(attrs.match(/\stransform="([^"]*)"/)?.[1]);
    const subs = parsePath(d).map((s) => ({ ...s, segs: s.segs.map((seg) => seg.map(tf)) }));
    if (subs.length !== 1) throw new Error("一条 path 里有多段子路径");
    return subs[0];
  });
}
export const bbox = (pts) => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map((v) => +v.toFixed(1));
};
/** 某个图层里带 id 的 path：{ id: { segs, closed } } */
export function layerPathsById(svg, id) {
  const m = svg.match(new RegExp(`<g class="layer" id="${id}"[^>]*>([\\s\\S]*?)</g>`));
  if (!m) throw new Error("没有图层 " + id);
  const out = {};
  for (const [, attrs] of m[1].matchAll(/<path\b([^>]*)\/?>/g)) {
    const pid = attrs.match(/\sid="([^"]*)"/)?.[1];
    if (!pid) continue;
    const d = attrs.match(/\sd="([^"]*)"/)[1];
    const tf = parseTransform(attrs.match(/\stransform="([^"]*)"/)?.[1]);
    const subs = parsePath(d).map((s) => ({ ...s, segs: s.segs.map((seg) => seg.map(tf)) }));
    out[pid] = subs[0];
  }
  return out;
}
/** 按弧长重新取 n 个点（含两端） */
export function resample(pts, n) {
  const d = [0];
  for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = d[d.length - 1];
  const out = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const t = (L * k) / (n - 1);
    while (j < d.length - 2 && d[j + 1] < t) j++;
    const u = (t - d[j]) / (d[j + 1] - d[j] || 1);
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]);
  }
  return out;
}
