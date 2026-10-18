// 用法：node 服装线稿换算.cjs <秤砣-服装线稿.svg> <秤砣-服装侧面线稿.svg> > chengtuo-costume.ts
// 输出素材库「剪纸角色」code/chengtuo-costume.ts：外套、袖标、铁靴各块按 id 认（改线稿时 id 别改），
// 坐标换成身体坐标 ((X−229.5)·0.905, (Y−463.8)·0.905)，和《秤砣-线稿.svg》一样。
// 路径支持 M L H V C S Q T Z（大小写都行）和图层、元素上的 transform；圆点用 circle / ellipse。
const fs = require("fs");
const K = 0.905;
const body = ([X, Y]) => [(X - 229.5) * K, (Y - 463.8) * K];
const r2 = (v) => Math.round(v * 100) / 100;

// ——— transform ———
const mulM = (a, b) => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
];
const ID = [1, 0, 0, 1, 0, 0];
function parseTransform(t) {
  let m = ID;
  if (!t) return m;
  for (const [, fn, args] of t.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const v = args.split(/[\s,]+/).filter(Boolean).map(Number);
    let n;
    if (fn === "matrix") n = v;
    else if (fn === "translate") n = [1, 0, 0, 1, v[0], v[1] || 0];
    else if (fn === "scale") n = [v[0], 0, 0, v[1] ?? v[0], 0, 0];
    else if (fn === "rotate") {
      const a = (v[0] * Math.PI) / 180;
      const c = Math.cos(a), s = Math.sin(a);
      const [cx, cy] = [v[1] || 0, v[2] || 0];
      n = mulM(mulM([1, 0, 0, 1, cx, cy], [c, s, -s, c, 0, 0]), [1, 0, 0, 1, -cx, -cy]);
    } else throw new Error("不支持的 transform：" + fn);
    m = mulM(m, n);
  }
  return m;
}
const apply = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

// ——— 路径 → 三次贝塞尔点列 [起点, 控制, 控制, 终点, 控制, 控制, 终点, …] ———
function parsePath(d) {
  const toks = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g);
  let i = 0, cmd = "", cur = [0, 0], start = [0, 0], lastC = null, lastQ = null;
  const subs = [];
  let pts = null;
  const num = () => parseFloat(toks[i++]);
  const line = (E) => pts.push([cur[0] + (E[0] - cur[0]) / 3, cur[1] + (E[1] - cur[1]) / 3], [cur[0] + (2 * (E[0] - cur[0])) / 3, cur[1] + (2 * (E[1] - cur[1])) / 3], E);
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toLowerCase();
    const o = rel ? cur : [0, 0];
    const pt = () => { const x = num(), y = num(); return [o[0] + x, o[1] + y]; };
    let c2 = null, q1 = null;
    if (C === "m") {
      cur = pt();
      start = cur;
      pts = [cur];
      subs.push({ pts, closed: false });
      cmd = rel ? "l" : "L";
    } else if (C === "l") {
      const E = pt();
      line(E);
      cur = E;
    } else if (C === "h") {
      const E = [rel ? cur[0] + num() : num(), cur[1]];
      line(E);
      cur = E;
    } else if (C === "v") {
      const E = [cur[0], rel ? cur[1] + num() : num()];
      line(E);
      cur = E;
    } else if (C === "c" || C === "s") {
      const A = C === "c" ? pt() : lastC ? [2 * cur[0] - lastC[0], 2 * cur[1] - lastC[1]] : cur;
      const B = pt(), E = pt();
      pts.push(A, B, E);
      c2 = B;
      cur = E;
    } else if (C === "q" || C === "t") {
      const Q = C === "q" ? pt() : lastQ ? [2 * cur[0] - lastQ[0], 2 * cur[1] - lastQ[1]] : cur;
      const E = pt();
      pts.push([cur[0] + (2 / 3) * (Q[0] - cur[0]), cur[1] + (2 / 3) * (Q[1] - cur[1])], [E[0] + (2 / 3) * (Q[0] - E[0]), E[1] + (2 / 3) * (Q[1] - E[1])], E);
      q1 = Q;
      cur = E;
    } else if (C === "z") {
      if (Math.hypot(cur[0] - start[0], cur[1] - start[1]) > 0.01) line(start);
      subs[subs.length - 1].closed = true;
      cur = start;
    } else throw new Error("不支持的路径命令：" + cmd + "（弧线 A 请在编辑器里转成曲线）");
    lastC = c2;
    lastQ = q1;
  }
  return subs;
}

// ——— 读一张线稿：外套 / 袖标 / 铁靴三个图层里带 id 的元素 ———
function read(file) {
  const svg = fs.readFileSync(file, "utf8");
  const out = { paths: {}, dots: {} };
  for (const layer of ["coat", "band", "boots"]) {
    const at = svg.search(new RegExp(`<g\\b[^>]*\\bid="${layer}"`));
    if (at < 0) continue;
    // 图层范围：到和它配对的 </g>
    const re = /<g\b[^>]*?(\/?)>|<\/g>/g;
    re.lastIndex = at;
    let depth = 0, end = svg.length;
    for (let m; (m = re.exec(svg)); ) {
      if (m[0].startsWith("</")) depth--;
      else if (!m[1]) depth++;
      if (depth === 0) { end = m.index; break; }
    }
    const part = svg.slice(at, end);
    // 嵌套 g 的 transform 依次乘上（Inkscape 挪过图层会加）
    const stack = [];
    let m0 = ID;
    for (const m of part.matchAll(/<(\/?)(g|path|circle|ellipse)\b([^>]*?)(\/?)>/g)) {
      const [, close, tag, attrs, self] = m;
      const attr = (n) => (attrs.match(new RegExp(`\\s${n}="([^"]*)"`)) || [])[1];
      if (tag === "g") {
        if (close) m0 = stack.pop() ?? ID;
        else if (!self) { stack.push(m0); m0 = mulM(m0, parseTransform(attr("transform"))); }
        continue;
      }
      const id = attr("id");
      if (!id || close) continue;
      const M = mulM(m0, parseTransform(attr("transform")));
      if (tag === "path") {
        const subs = parsePath(attr("d"));
        out.paths[id] = subs.map((s) => ({ closed: s.closed, pts: s.pts.map((p) => body(apply(M, p)).map(r2)) }));
      } else {
        const rx = +(attr("rx") ?? attr("r")), ry = +(attr("ry") ?? attr("r"));
        const c = body(apply(M, [+attr("cx"), +attr("cy")])).map(r2);
        out.dots[id] = { c, r: r2(Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2])) * ((rx + ry) / 2) * K) };
      }
    }
  }
  return out;
}

const front = read(process.argv[2]);
const side = read(process.argv[3]);
const need = (o, id) => {
  const p = o.paths[id];
  if (!p) throw new Error("线稿里找不到 id=" + id);
  return p[0].pts;
};
const list = (pts) => "[" + pts.map(([x, y]) => `[${x}, ${y}]`).join(", ") + "]";
const dot = (o, id) => {
  const d = o.dots[id];
  if (!d) throw new Error("线稿里找不到圆点 id=" + id);
  return `{ c: [${d.c[0]}, ${d.c[1]}] as V2, r: ${d.r} }`;
};
const byPrefix = (o, prefix, kind) =>
  Object.keys(o[kind])
    .filter((k) => k.startsWith(prefix))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

const L = [];
L.push("// 由 projects/work-5b227852/production/服装线稿换算.cjs 从《秤砣-服装线稿.svg》《秤砣-服装侧面线稿.svg》生成，别手改：改线稿再重新生成。");
L.push("// 身体坐标（和 chengtuo-draw.ts 的线稿一样）：三次贝塞尔点列 [起点, 控制, 控制, 终点, …]。");
L.push('import type { V2 } from "./rig";');
L.push("");
L.push("/** 外套正面：画面左边那片 l、右边那片 r（转到 3/4 朝左时 l 是远的那片） */");
L.push("export const COAT_FRONT = {");
for (const [k, id] of [["l", "coat-l"], ["r", "coat-r"], ["lapelL", "lapel-l"], ["lapelR", "lapel-r"], ["pocketL", "pocket-l"], ["pocketR", "pocket-r"]])
  L.push(`  ${k}: ${list(need(front, id))} as V2[],`);
L.push("};");
L.push("/** 外套 3/4 朝左：远的那片 far、近的那片 near */");
L.push("export const COAT_SIDE = {");
for (const [k, id] of [["l", "coat-far"], ["r", "coat-near"], ["lapelL", "lapel-far"], ["lapelR", "lapel-near"], ["pocketL", "pocket-far"], ["pocketR", "pocket-near"]])
  L.push(`  ${k}: ${list(need(side, id))} as V2[],`);
L.push("};");
L.push("/** 袖口翻边（画在画面右边那只手臂的前臂上）、肩头的铆钉 */");
L.push(`export const CUFF: V2[] = ${list(need(front, "cuff"))};`);
L.push(`export const SHOULDER_RIVET = ${dot(front, "rivet")};`);
L.push("/** 袖标（画在画面右边那只手臂的上臂上） */");
L.push(`export const BAND: V2[] = ${list(need(front, "band"))};`);
L.push("/** 铁靴：画面左边那只（脚尖朝画面左） */");
L.push("export const BOOT = {");
L.push(`  body: ${list(need(front, "boot"))} as V2[],`);
L.push(`  sole: ${list(need(front, "boot-sole"))} as V2[],`);
L.push(`  rim: ${list(need(front, "boot-rim"))} as V2[],`);
L.push(`  brick: ${list(need(front, "boot-brick"))} as V2[],`);
L.push(`  ropes: [${byPrefix(front, "boot-rope", "paths").map((id) => list(need(front, id))).join(", ")}] as V2[][],`);
L.push(`  rust: [${byPrefix(front, "boot-rust", "paths").map((id) => list(need(front, id))).join(", ")}] as V2[][],`);
L.push(`  rivets: [${byPrefix(front, "boot-rivet", "dots").filter((id) => id !== "boot-rivet-front").map((id) => dot(front, id)).join(", ")}],`);
L.push(`  frontRivet: ${dot(front, "boot-rivet-front")},`);
L.push("};");
process.stdout.write(L.join("\n") + "\n");
