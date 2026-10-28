// 《<角色>-线稿.svg》（正面）、《<角色>-侧面线稿.svg》（3/4 朝左）身体图层里的线（按 id 认：描图.mjs 描的，或用户照这些 id 画的）
// → 素材库「剪纸角色」code/cast-<名>-art.ts（这个人的脸、头发）。
// 用法（在作品文件夹里）：node <工具目录>/线稿换算.mjs <角色> <输出目录>，写 cast-<file>-art.ts.txt（再 material_write put work_file
//   放进素材库 code/，人物配置里 face0 / face3 / hairArt 用导出的 <prefix>_FACE0 / <prefix>_FACE3 / <prefix>_HAIR）。
//   file、prefix 在作品的 production/线稿配置.mjs 里这个角色的 art。
// id：face 脸的整圈（盖在头发下面的那截是圆顶）、ear-l / ear-r 耳朵（3/4 只有 ear-r，近处那只）、eye-l / eye-r 眼珠（画面左 / 右）、
// nose、mouth、hair-back 头发后面那片（画在身子后面）、fringe 刘海（头发盖在脸上的那块：发际线 + 脸的圆顶）。
// 配角的骨架、头的大小和主角一样（用户 2026-10-27：「胳膊和腿的和脖子，身体主框架，头的框架代码是可以共用的」），线原样落在主角的骨架上。
// 用户自己画、线没有 id 时按位置给线加上 id 再换算（作品 3d80f743 的 周磊线稿换算.mjs 是按画的顺序认的例子）。
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { bbox, fmt, layerPathsById, resample, sample, toHead } from "./线稿换算工具.mjs";

const who = process.argv[2];
const outDir = process.argv[3];
const all = (await import(pathToFileURL(path.join(process.cwd(), "production/线稿配置.mjs")).href)).default;
const C = all[who]?.art;
if (!C || !outDir) throw new Error("用法（在作品文件夹里）：node <工具目录>/线稿换算.mjs <角色> <输出目录>；production/线稿配置.mjs 里这个角色要有 art: { file, prefix }。有的角色：" + Object.keys(all).join("、"));
const root = process.cwd();
const F = layerPathsById(fs.readFileSync(path.join(root, `public/ref/${who}-线稿.svg`), "utf8"), "body");
const S = layerPathsById(fs.readFileSync(path.join(root, `public/ref/${who}-侧面线稿.svg`), "utf8"), "side-body");
// 必须有的；hair-back / fringe（秃顶的没有）、brow-l / brow-r（眉毛）、hair-1、hair-2…（单独的几块头发）可以没有，但正面和 3/4 要一致
for (const [n, v] of [["正面", F], ["3/4", S]]) for (const id of ["face", "eye-l", "eye-r", "nose", "mouth", "ear-r"]) if (!v[id]) throw new Error(`${n}少了 ${id}`);
for (const id of ["hair-back", "fringe"]) if (!F[id] !== !S[id]) throw new Error(`${id} 正面和 3/4 要么都有、要么都没有`);
const piecesOf = (v) => Object.keys(v).filter((k) => /^hair-\d+$/.test(k)).sort((a, b) => +a.slice(5) - +b.slice(5));
if (piecesOf(F).length !== piecesOf(S).length) throw new Error(`单独的几块头发正面 ${piecesOf(F).length} 块、3/4 ${piecesOf(S).length} 块，要一样多（按从左到右对应）`);

const hF = toHead("front");
const hS = toHead("side");
const r2 = (p) => `[${p[0].toFixed(2)}, ${p[1].toFixed(2)}]`;
const bezOut = (p, map) => fmt(map([p.segs[0][0], ...p.segs.flatMap((s) => [s[1], s[2], s[3]])]));
/** 眼珠：描的是参考图里深色的眼珠（外侧那道白月牙基础模型自己画），中心、半径照描的 */
const iris = (p, map) => {
  const b = bbox(map(sample(p.segs)));
  return `{ c: [${((b[0] + b[2]) / 2).toFixed(2)}, ${((b[1] + b[3]) / 2).toFixed(2)}] as V2, rx: ${((b[2] - b[0]) / 2).toFixed(2)}, ry: ${((b[3] - b[1]) / 2).toFixed(2)} }`;
};
const ends = (p, map) => {
  const q = map(sample(p.segs));
  return [q[0], q[q.length - 1]];
};
const noseOf = (p, map) => {
  const q = map(sample(p.segs));
  const [ns, ne, nm] = [q[0], q[q.length - 1], q[Math.floor(q.length / 2)]];
  return [ns, [2 * nm[0] - (ns[0] + ne[0]) / 2, 2 * nm[1] - (ns[1] + ne[1]) / 2], ne];
};
const view = (v, map, ears) => `{
    face: ${bezOut(v.face, map)} as V2[],
    iris: { R: ${iris(v["eye-l"], map)}, L: ${iris(v["eye-r"], map)} },
    nose: [${noseOf(v.nose, map).map(r2).join(", ")}] as V2[],
    mouth: [${ends(v.mouth, map).map(r2).join(", ")}] as V2[],
    ears: { ${ears.map(([k, id]) => `${k}: ${bezOut(v[id], map)} as V2[]`).join(", ")} },${
      v["brow-l"] && v["brow-r"] ? `\n    brows: { R: ${r2(center(v["brow-l"], map))} as V2, L: ${r2(center(v["brow-r"], map))} as V2 },` : ""
    }
  }`;
/** 一小块（眉毛）的中心 */
const center = (p, map) => {
  const b = bbox(map(sample(p.segs)));
  return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
};

// ——— 刘海：正面和 3/4 逐点对应 ———
// 刘海 = 头发 ∩ 脸的整圈（描图时往外扩了一点，盖住脸的描边）：轮廓上贴着脸的圆顶那段是「顶」，其余是发际线（下沿）。
// 两张都排成：发际线从左端走到右端，再沿圆顶从右回到左，各按弧长取同样多的点（周磊那次学到的：按最高 / 最左对应会让一绺扫过眼睛）
const BOTTOM = 120;
const TOP = 70;
function fringeOf(v) {
  const face = sample(v.face.segs, 12);
  let ring = sample(v.fringe.segs, 12).slice(0, -1);
  const dist = (p) => Math.min(...face.map((q) => Math.hypot(q[0] - p[0], q[1] - p[1])));
  const onTop = ring.map((p) => dist(p) < 2.6);
  // 最长的一段贴着圆顶的
  let best = [0, -1];
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    if (!onTop[i] || onTop[(i - 1 + n) % n]) continue;
    let j = i;
    while (onTop[(j + 1) % n] && j - i < n) j++;
    if (j - i > best[1] - best[0]) best = [i, j];
  }
  const top = [];
  for (let k = best[0]; k <= best[1]; k++) top.push(ring[k % n]);
  const bottom = [];
  for (let k = best[1] + 1; k < best[0] + n; k++) bottom.push(ring[k % n]);
  // 发际线从左走到右；圆顶从右回到左
  if (bottom[0][0] > bottom[bottom.length - 1][0]) bottom.reverse();
  if (top[0][0] < top[top.length - 1][0]) top.reverse();
  return [...resample([bottom[0], ...bottom, ...top.slice(0, 1)].slice(0, -1), BOTTOM), ...resample(top, TOP)];
}
const backOf = (v) => sample(v["hair-back"].segs, 8).slice(0, -1);

const src = `// ${who}的脸和头发（正面、3/4 朝画面左）：作品的 \`public/ref/${who}-线稿.svg\`、\`${who}-侧面线稿.svg\` 里的线
// （照参考图描的，tools/描图.mjs）。由 tools/线稿换算.mjs 生成，
// 别手改：改线稿再重新生成。头的坐标（头不缩放：骨架、头的大小和主角一样，身高另外按 scale 缩）。

import type { FaceView } from "./figure";
import type { V2 } from "./rig";

/** 正面的脸（耳朵 L 画面左、R 画面右） */
export const ${C.prefix}_FACE0: FaceView = ${view(F, hF, [["L", "ear-l"], ["R", "ear-r"]])};
/** 3/4（朝画面左）的脸：眼珠 R 远处（画面左）、L 近处；耳朵只有近处那只（画面右） */
export const ${C.prefix}_FACE3: FaceView = ${view(S, hS, [["R", "ear-r"]])};
/** 头发：后面那片（转身时按头顶 / 最右 / 最低 / 最左对应）、刘海（已经逐点对应好：发际线对发际线、圆顶对圆顶）、单独的几块（秃顶两鬓） */
export const ${C.prefix}_HAIR = {${
  F["hair-back"] ? `\n  back: { front: ${fmt(hF(backOf(F)))} as V2[], side: ${fmt(hS(backOf(S)))} as V2[] },` : ""
}${F.fringe ? `\n  fringe: { front: ${fmt(hF(fringeOf(F)))} as V2[], side: ${fmt(hS(fringeOf(S)))} as V2[] },` : ""}${
  piecesOf(F).length
    ? `\n  pieces: [${piecesOf(F).map((id) => `\n    { front: ${fmt(hF(sample(F[id].segs, 8).slice(0, -1)))} as V2[], side: ${fmt(hS(sample(S[id].segs, 8).slice(0, -1)))} as V2[] },`).join("")}\n  ],`
    : ""
}
};
`;
fs.writeFileSync(path.join(outDir, `cast-${C.file}-art.ts.txt`), src);
console.error(`写好 cast-${C.file}-art.ts.txt`, src.length, "字");
