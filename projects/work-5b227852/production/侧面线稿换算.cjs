// 用法：node 侧面线稿换算.cjs <秤砣-侧面线稿.svg> <输出目录>，在输出目录写素材库「剪纸角色」的 code/figure-side.ts（基础模型：脸、眼珠、鼻子、嘴、脖子、身子）
// 和 code/chengtuo-side.ts（秤砣的刘海）。不给输出目录时两个文件都打到屏幕上。按位置认出每一块，不依赖 id。
// 侧面线稿 → 代码常量。按 AGENTS 的映射：
// 身体：((X−229.5)·0.905, (Y−463.8)·0.905)
// 头：  ((X−HX)·0.905, (Y−276.28)·0.905 + 48)，HX = 229.5 + 10·sin(−0.7)/0.905（3/4 时脖子往前挪 6.44，头的原点跟着挪）
const fs = require("fs");
const svg = fs.readFileSync(process.argv[2], "utf8");
const K = 0.905;
const HX = 229.5 + (10 * Math.sin(-0.7)) / K;
const head = ([X, Y]) => [(X - HX) * K, (Y - 276.28) * K + 48];
const body = ([X, Y]) => [(X - 229.5) * K, (Y - 463.8) * K];
const r2 = (v) => Math.round(v * 100) / 100;

function parsePath(d) {
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g);
  let i = 0, cmd = "", cur = [0, 0], start = [0, 0];
  const subs = [];
  let pts = null;
  const num = () => parseFloat(toks[i++]);
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toLowerCase();
    if (C === "m") {
      const p = [num(), num()];
      cur = rel ? [cur[0] + p[0], cur[1] + p[1]] : p;
      start = cur;
      pts = [cur];
      subs.push(pts);
      cmd = rel ? "l" : "L";
    } else if (C === "c") {
      const a = [num(), num()], b = [num(), num()], c = [num(), num()];
      const o = rel ? cur : [0, 0];
      const A = [o[0] + a[0], o[1] + a[1]], B = [o[0] + b[0], o[1] + b[1]], E = [o[0] + c[0], o[1] + c[1]];
      pts.push(A, B, E);
      cur = E;
    } else if (C === "l") {
      const p = [num(), num()];
      const E = rel ? [cur[0] + p[0], cur[1] + p[1]] : p;
      pts.push([cur[0] + (E[0] - cur[0]) / 3, cur[1] + (E[1] - cur[1]) / 3], [cur[0] + (2 * (E[0] - cur[0])) / 3, cur[1] + (2 * (E[1] - cur[1])) / 3], E);
      cur = E;
    } else if (C === "z") {
      if (Math.hypot(cur[0] - start[0], cur[1] - start[1]) > 0.01) {
        const E = start;
        pts.push([cur[0] + (E[0] - cur[0]) / 3, cur[1] + (E[1] - cur[1]) / 3], [cur[0] + (2 * (E[0] - cur[0])) / 3, cur[1] + (2 * (E[1] - cur[1])) / 3], E);
      }
      cur = start;
    } else throw new Error("unsupported " + cmd);
  }
  return subs;
}

const layer = svg.slice(svg.indexOf('id="side-head"'));
const els = [...layer.matchAll(/<(path|ellipse)\b([^>]*)\/>/g)].map((m) => {
  const attr = (n) => (m[2].match(new RegExp(`\\s${n}="([^"]*)"`)) || [])[1];
  if (attr("transform") && !/^(matrix\(1 0 0 1 0 0\)|translate\(0 0\))$/.test(attr("transform").trim())) throw new Error("transform " + attr("transform"));
  return m[1] === "ellipse"
    ? { kind: "ellipse", id: attr("id"), cx: +attr("cx"), cy: +attr("cy"), rx: +attr("rx"), ry: +attr("ry") }
    : { kind: "path", id: attr("id"), subs: parsePath(attr("d")) };
});
// 按位置认出每一块
const bbox = (pts) => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};
const out = {};
for (const e of els) {
  if (e.kind === "ellipse") {
    (out.iris ??= []).push(e);
    continue;
  }
  const b = bbox(e.subs[0]);
  const w = b.x1 - b.x0, h = b.y1 - b.y0;
  let name;
  if (b.y0 > 280 && h > 100) name = "torso";
  else if (w < 3 && h < 4) name = "nose";
  else if (h < 3) name = "mouth";
  else if (b.y1 < 220 && w > 80) name = "bangs";
  else if (w > 60 && h > 80) name = "face";
  else if (b.y0 > 255 && b.y1 < 295) name = "neck";
  else name = "unknown";
  console.error(name, e.id ?? "", JSON.stringify(b));
  out[name] = e.subs;
}
const fmt = (pts) => "[" + pts.map((p) => `[${r2(p[0])}, ${r2(p[1])}]`).join(", ") + "]";
const iris = out.iris.sort((a, b) => a.cx - b.cx);
const lines = [];
lines.push(`/** 脸（3/4 朝左，头的坐标） */\nexport const SIDE_FACE: V2[] = ${fmt(out.face[0].map(head))};`);
lines.push(`/** 眼珠：中心和半径（远侧 R 在画面左，近侧 L 在画面右） */\nexport const SIDE_IRIS = {\n  R: { c: [${head([iris[0].cx, iris[0].cy]).map(r2).join(", ")}] as V2, rx: ${r2(iris[0].rx * K)}, ry: ${r2(iris[0].ry * K)} },\n  L: { c: [${head([iris[1].cx, iris[1].cy]).map(r2).join(", ")}] as V2, rx: ${r2(iris[1].rx * K)}, ry: ${r2(iris[1].ry * K)} },\n};`);
lines.push(`/** 鼻子（一小笔） */\nexport const SIDE_NOSE: V2[] = ${fmt(out.nose[0].map(head))};`);
lines.push(`/** 嘴（不笑时的一道线） */\nexport const SIDE_MOUTH: V2[] = ${fmt(out.mouth[0].map(head))};`);
lines.push(`/** 脖子（身体坐标） */\nexport const SIDE_NECK: V2[] = ${fmt(out.neck[0].map(body))};`);
lines.push(`/** 身子（毛衣，身体坐标） */\nexport const SIDE_TORSO: V2[] = ${fmt(out.torso[0].map(body))};`);

const IMPORT = 'import type { V2 } from "./rig";';
const figureSide = [
  "// 基础模型 3/4 侧面（朝画面左）的线稿：用户在 `秤砣-侧面线稿.svg`（作品 5b227852 的 public/ref/）里画的，和正面线稿同一套坐标。",
  "// 由作品 5b227852 的 `production/侧面线稿换算.cjs` 生成，别手改。",
  "// 换算：身体 ((X − 229.5)·0.905, (Y − 463.8)·0.905)；",
  `//      头   ((X − ${r2(HX)})·0.905, (Y − 276.28)·0.905 + 48)——3/4 时脖子往前挪 6.44，头的原点跟着挪到线稿的 x = ${r2(HX)}。`,
  "// 路径都是 [起点, 控制点1, 控制点2, 终点, 控制点1, …]（三次贝塞尔）。转身时和正面的同一块逐点对应、按比例混合（figure.ts）。",
  "",
  IMPORT,
  "",
  ...lines,
].join("\n") + "\n";
const chengtuoSide = [
  "// 秤砣的刘海 3/4 侧面（朝画面左）的外轮廓，和基础模型的侧面线稿一起由作品 5b227852 的 `production/侧面线稿换算.cjs` 生成（头的坐标），别手改。",
  "",
  IMPORT,
  "",
  `/** 刘海的外轮廓（下沿是一条直线，缝由代码按正面的缝补上） */\nexport const SIDE_BANGS: V2[] = ${fmt(out.bangs[0].map(head))};`,
].join("\n") + "\n";
const dir = process.argv[3];
if (dir) {
  const path = require("path");
  fs.writeFileSync(path.join(dir, "figure-side.ts"), figureSide);
  fs.writeFileSync(path.join(dir, "chengtuo-side.ts"), chengtuoSide);
} else console.log(figureSide + "\n" + chengtuoSide);
