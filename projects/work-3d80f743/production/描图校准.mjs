// 临时：描图参数校准（用户 2026-10-29：「你把我描的做过满意的拿去参数调优，调优之后重新描」）。
// 用描图工具在用户亲手画过线的人的参考图上再描一遍（public/ref/校准*-线稿.svg），和用户的线逐块比：
// 闭合的块（脸、耳朵、头发外轮廓）按 8 倍栅格化比面积、IoU，描的轮廓上每一点到用户轮廓的带符号距离（在用户的块外面为正，线稿单位）；
// 眼睛比包围盒。用法（在作品文件夹里）：先给沙盒生成线稿、描图（production/线稿配置.mjs 里的 校准周磊 / 校准小石头 / 校准小石头的妈妈）：
//   node <工具>/线稿生成.mjs 校准周磊 <底图目录>；node <工具>/描图.mjs 校准周磊（另外两个同样）；再 node production/描图校准.mjs [--png 目录]
//   （--png 出叠图：用户的线红、描的线蓝）。比完把 public/ref/校准*-线稿.svg 删掉（每张带一张参考图，很大）。
// 2026-10-29 校准的结果（线稿单位）：脸（眼睛以下）描的和用户画的差 0.2 以内（扩 2 像素，参数不动）；头发外轮廓描的在用户的线里面 0.4–0.85；
//   耳朵原来扩 3 像素，比用户画的大一圈（面积 1.25–1.59 倍、外沿偏外 1–2），改成扩半条描边（earGrow 1.5）后 0.96–1.20 倍、偏移 ±0.5；
//   眼睛原来只描深色的眼珠（周磊那张只描到上眼线，宽 7–10、高 5–9），用户画的是整只眼睛（眼珠 + 眼白 + 上眼线，22.9×18.2），
//   改成 eyesWhole 描整只眼睛后 23.1×17.5，换算成眼珠和用户画的周磊差 1 以内
import fs from "node:fs";
import { layerPaths, layerPathsById, sample } from "/data/libraries/frame-works/剪纸角色/tools/线稿换算工具.mjs";
import { sharp } from "/data/libraries/frame-works/剪纸角色/tools/描图工具.mjs";

const read = (f) => fs.readFileSync(`public/ref/${f}`, "utf8");
const pts = (p) => sample(p.segs, 16);
const bbox = (q) => [Math.min(...q.map((p) => p[0])), Math.min(...q.map((p) => p[1])), Math.max(...q.map((p) => p[0])), Math.max(...q.map((p) => p[1]))];
function inside(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const insideAny = (polys, x, y) => polys.some((p) => inside(p, x, y));
/** 点到折线（闭合）的距离 */
function distTo(poly, [x, y]) {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return best;
}
/** A（描的，几块）和 B（用户的，几块）：面积比、IoU、A 的边到 B 的边带符号距离（A 在 B 外面为正）。yMin/yMax 只比这几行 */
function compare(A, B, { yMin = -Infinity, yMax = Infinity } = {}) {
  const all = [...A, ...B].flat();
  const [x0, y0, x1, y1] = bbox(all);
  const S = 4;
  let a = 0, b = 0, both = 0;
  for (let y = Math.max(y0, yMin); y <= Math.min(y1, yMax); y += 1 / S)
    for (let x = x0; x <= x1; x += 1 / S) {
      const ia = insideAny(A, x, y), ib = insideAny(B, x, y);
      a += ia; b += ib; both += ia && ib;
    }
  const Bb = B.map((p) => p);
  const ds = [];
  for (const poly of A) for (const p of poly) if (p[1] >= yMin && p[1] <= yMax) {
    // 离 B 的边最近的距离，在 B 外面为正
    const d = Math.min(...Bb.map((q) => distTo(q, p)));
    ds.push(insideAny(B, p[0], p[1]) ? -d : d);
  }
  ds.sort((p, q) => p - q);
  const mean = ds.reduce((s, v) => s + v, 0) / (ds.length || 1);
  return { ratio: a / (b || 1), iou: both / (a + b - both || 1), mean, med: ds[Math.floor(ds.length / 2)], p10: ds[Math.floor(ds.length * 0.1)], p90: ds[Math.floor(ds.length * 0.9)] };
}
const fmt = (r) => `面积比 ${r.ratio.toFixed(3)}  IoU ${r.iou.toFixed(3)}  边的偏移 平均 ${r.mean.toFixed(2)}  中位 ${r.med.toFixed(2)}  (10% ${r.p10.toFixed(2)} / 90% ${r.p90.toFixed(2)})`;
const eyeCmp = (a, b) => {
  const A = bbox(a), B = bbox(b);
  const c = (q) => [(q[0] + q[2]) / 2, (q[1] + q[3]) / 2];
  return `描的 ${(A[2] - A[0]).toFixed(1)}×${(A[3] - A[1]).toFixed(1)} @${c(A).map((v) => v.toFixed(1))}   用户 ${(B[2] - B[0]).toFixed(1)}×${(B[3] - B[1]).toFixed(1)} @${c(B).map((v) => v.toFixed(1))}`;
};

const out = {};
const png = process.argv.indexOf("--png") > 0 ? process.argv[process.argv.indexOf("--png") + 1] : null;
const drawn = [];

// ——— 周磊：脸、耳朵、眼睛、鼻子嘴、头发都是用户画的（周磊线稿换算.mjs 的顺序）———
{
  const UF = layerPaths(read("周磊-线稿.svg"), "body");
  const US = layerPaths(read("周磊-侧面线稿.svg"), "side-body");
  const TF = layerPathsById(read("校准周磊-线稿.svg"), "body");
  const TS = layerPathsById(read("校准周磊-侧面线稿.svg"), "side-body");
  const uFace = pts(UF[0]), uFace3 = pts(US[0]);
  // 脸只比眼睛以下（发际线以上描的是藏在头发里的圆顶，用户画的也是）
  const eyeY = (bbox(pts(UF[11]))[1] + bbox(pts(UF[11]))[3]) / 2;
  const eyeY3 = (bbox(pts(US[8]))[1] + bbox(pts(US[8]))[3]) / 2;
  console.log("周磊 正面 脸（眼睛以下）", fmt(compare([pts(TF.face)], [uFace], { yMin: eyeY })));
  console.log("周磊 3/4 脸（眼睛以下）", fmt(compare([pts(TS.face)], [uFace3], { yMin: eyeY3 })));
  console.log("周磊 正面 耳朵 左", fmt(compare([pts(TF["ear-l"])], [pts(UF[2])])));
  console.log("周磊 正面 耳朵 右", fmt(compare([pts(TF["ear-r"])], [pts(UF[1])])));
  console.log("周磊 3/4 耳朵", fmt(compare([pts(TS["ear-r"])], [pts(US[3])])));
  console.log("周磊 正面 眼睛 左", eyeCmp(pts(TF["eye-l"]), pts(UF[11])));
  console.log("周磊 正面 眼睛 右", eyeCmp(pts(TF["eye-r"]), pts(UF[12])));
  console.log("周磊 3/4 眼睛 远", eyeCmp(pts(TS["eye-l"]), pts(US[9])));
  console.log("周磊 3/4 眼睛 近", eyeCmp(pts(TS["eye-r"]), pts(US[8])));
  console.log("周磊 3/4 头发后面那片", fmt(compare([pts(TS["hair-back"])], [pts(US[2])])));
  drawn.push(["周磊-front", [uFace, pts(UF[1]), pts(UF[2]), pts(UF[11]), pts(UF[12]), pts(UF[3])], [pts(TF.face), pts(TF["ear-l"]), pts(TF["ear-r"]), pts(TF["eye-l"]), pts(TF["eye-r"]), pts(TF["hair-back"])]]);
  drawn.push(["周磊-side", [uFace3, pts(US[3]), pts(US[8]), pts(US[9]), pts(US[2])], [pts(TS.face), pts(TS["ear-r"]), pts(TS["eye-l"]), pts(TS["eye-r"]), pts(TS["hair-back"])]]);
}
// ——— 小石头、小石头的妈妈：耳朵、头发是用户画的（分层头发的图层合起来就是外轮廓）———
for (const who of ["小石头", "小石头的妈妈"]) {
  for (const [view, file, body, pre] of [["正面", `${who}-线稿.svg`, "body", ""], ["3/4", `${who}-侧面线稿.svg`, "side-body", "side-"]]) {
    const svg = read(file);
    const U = layerPathsById(svg, body);
    const T = layerPathsById(read(`校准${file}`), body);
    const hair = [];
    for (const l of ["hair-bun", "hair-back", "hair-bangs", "hair-lock-l", "hair-lock-r", "hair-tail"]) if (svg.includes(`id="${pre + l}"`)) hair.push(...Object.values(layerPathsById(svg, pre + l)).map(pts));
    const traced = [pts(T["hair-back"]), ...(T["hair-tail"] ? [pts(T["hair-tail"])] : [])];
    console.log(`${who} ${view} 头发外轮廓`, fmt(compare(traced, hair)));
    for (const e of ["ear-l", "ear-r"]) if (U[e] && T[e]) console.log(`${who} ${view} ${e}`, fmt(compare([pts(T[e])], [pts(U[e])])));
    drawn.push([`${who}-${view === "正面" ? "front" : "side"}`, [...hair, ...["ear-l", "ear-r"].filter((e) => U[e]).map((e) => pts(U[e]))], [...traced, ...["ear-l", "ear-r"].filter((e) => T[e]).map((e) => pts(T[e]))]]);
  }
}
if (png) {
  fs.mkdirSync(png, { recursive: true });
  for (const [name, user, traced] of drawn) {
    const all = [...user, ...traced].flat();
    const [x0, y0, x1, y1] = bbox(all);
    const Z = 4, W = Math.round((x1 - x0 + 10) * Z), H = Math.round((y1 - y0 + 10) * Z);
    const P = (q) => q.map(([x, y]) => `${((x - x0 + 5) * Z).toFixed(1)},${((y - y0 + 5) * Z).toFixed(1)}`).join(" ");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#fff"/>${user.map((q) => `<polygon points="${P(q)}" fill="none" stroke="#e00030" stroke-width="2"/>`).join("")}${traced.map((q) => `<polygon points="${P(q)}" fill="none" stroke="#0050ff" stroke-width="1.5"/>`).join("")}</svg>`;
    await sharp(Buffer.from(svg)).png().toFile(`${png}/${name}.png`);
  }
  console.log("叠图写在", png);
}
