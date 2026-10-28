// 《<角色>-线稿.svg》（正面）、《<角色>-侧面线稿.svg》（3/4 朝左）身体图层里的线（按 id 认：描图.mjs 描的，或用户照这些 id 画的）
// → 素材库「剪纸角色」code/cast-<名>-art.ts（这个人的脸、头发）。
// 用法（在作品文件夹里）：node <工具目录>/线稿换算.mjs <角色> <输出目录>，写 cast-<file>-art.ts.txt（再 material_write put work_file
//   放进素材库 code/，人物配置里 face0 / face3 / hairArt 用导出的 <prefix>_FACE0 / <prefix>_FACE3 / <prefix>_HAIR）。
//   file、prefix 在作品的 production/线稿配置.mjs 里这个角色的 art。
// id：face 脸的整圈（盖在头发下面的那截是圆顶）、ear-l / ear-r 耳朵（3/4 只有 ear-r，近处那只）、eye-l / eye-r 眼珠（画面左 / 右）、
// ear-line-l / ear-line-r 耳朵里的一道线（不闭合，可以没有；3/4 只有 ear-line-r）、
// nose、mouth、hair-back 头发后面那片（画在身子后面）、fringe 刘海（头发盖在脸上的那块：发际线 + 脸的圆顶）、
// hair-tail 马尾（画在最后面）、hair-tie 发圈（压在马尾顶上，人物配置的 hairTie 色）。
// 分层画的头发（用户一块一块画的，见 头发分层.mjs：图层 hair-back、hair-bangs、hair-lock-l、hair-lock-r、hair-tail、hair-tie）：
// 有的话头发只用它（输出 layers），身体图层里描的 hair-back / fringe / hair-tail / hair-tie 不用；对应的标志点在 art.hairMarks。
// leg-l / leg-r（可以没有，只在正面那张）：两条裤腿的轮廓（画面左那条是 l），换算成 <prefix>_LEGS（人物配置的 legArt）。
// coat-l / coat-r（可以没有）：敞怀外衣两片前襟的门襟和下摆（门襟上端 → 下摆外角，画面左那片是 l），换算成 <prefix>_COAT（cast-wear.ts 的 GarmentArt）。
// 配角的骨架、头的大小和主角一样（用户 2026-10-27：「胳膊和腿的和脖子，身体主框架，头的框架代码是可以共用的」），线原样落在主角的骨架上。
// 用户自己画、线没有 id 时按位置给线加上 id 再换算（作品 3d80f743 的 周磊线稿换算.mjs 是按画的顺序认的例子）。
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { COAT_SHOULDER, K, LEG_REST, NECK_SIDE, bbox, fmt, layerPathsById, resample, sample, toBody, toHead } from "./线稿换算工具.mjs";
import { hairLayersOf, matchPiece } from "./头发分层.mjs";

const who = process.argv[2];
const outDir = process.argv[3];
const all = (await import(pathToFileURL(path.join(process.cwd(), "production/线稿配置.mjs")).href)).default;
const C = all[who]?.art;
if (!C || !outDir) throw new Error("用法（在作品文件夹里）：node <工具目录>/线稿换算.mjs <角色> <输出目录>；production/线稿配置.mjs 里这个角色要有 art: { file, prefix }。有的角色：" + Object.keys(all).join("、"));
const root = process.cwd();
const svgF = fs.readFileSync(path.join(root, `public/ref/${who}-线稿.svg`), "utf8");
const svgS = fs.readFileSync(path.join(root, `public/ref/${who}-侧面线稿.svg`), "utf8");
const F = layerPathsById(svgF, "body");
const S = layerPathsById(svgS, "side-body");
const LAYERS = hairLayersOf(svgF, svgS);
// 必须有的；hair-back / fringe（秃顶的没有）、brow-l / brow-r（眉毛）、hair-1、hair-2…（单独的几块头发）可以没有，但正面和 3/4 要一致
for (const [n, v] of [["正面", F], ["3/4", S]]) for (const id of ["face", "eye-l", "eye-r", "nose", "mouth", "ear-r"]) if (!v[id]) throw new Error(`${n}少了 ${id}`);
for (const id of ["hair-back", "fringe", "hair-tail", "hair-tie"]) if (!F[id] !== !S[id]) throw new Error(`${id} 正面和 3/4 要么都有、要么都没有`);
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
      ears.some(([, id]) => v[id.replace("ear", "ear-line")])
        ? `\n    earLines: { ${ears.filter(([, id]) => v[id.replace("ear", "ear-line")]).map(([k, id]) => `${k}: ${bezOut(v[id.replace("ear", "ear-line")], map)} as V2[]`).join(", ")} },`
        : ""
    }${
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
/** 马尾、发圈：闭合的一圈（转身时按头顶 / 最右 / 最低 / 最左对应，和后面那片一样） */
const loopOf = (p) => sample(p.segs, 8).slice(0, -1);

/** 分层头发：每块正面 ↔ 3/4 逐点对应好 */
const layersSrc = () => {
  const kinds = ["back", "front", "far", "tail", "tie"].filter((k) => LAYERS[k]);
  const body = kinds.map((k) => `\n    ${k}: [${LAYERS[k].map(({ id, f, s }) => {
    const m = matchPiece(id, f, s, hF, hS, C.hairMarks?.[id]);
    console.error(`头发 ${id}（${k}）：${m.how}，${m.pairs} 个标志点，${m.front.length} 个点`);
    return `\n      // ${id}\n      { front: ${fmt(m.front)} as V2[], side: ${fmt(m.side)} as V2[] },`;
  }).join("")}\n    ],`).join("");
  return `\n  layers: {${body}\n  },`;
};

const src = `// ${who}的脸和头发（正面、3/4 朝画面左）：作品的 \`public/ref/${who}-线稿.svg\`、\`${who}-侧面线稿.svg\` 里的线
// （照参考图描的，tools/描图.mjs；${LAYERS ? "头发、耳朵是用户分层画的" : ""}）。由 tools/线稿换算.mjs 生成，
// 别手改：改线稿再重新生成。头的坐标（头不缩放：骨架、头的大小和主角一样，身高另外按 scale 缩）。

import type { FaceView } from "./figure";
import type { V2 } from "./rig";

/** 正面的脸（耳朵 L 画面左、R 画面右） */
export const ${C.prefix}_FACE0: FaceView = ${view(F, hF, [["L", "ear-l"], ["R", "ear-r"]])};
/** 3/4（朝画面左）的脸：眼珠 R 远处（画面左）、L 近处；耳朵只有近处那只（画面右） */
export const ${C.prefix}_FACE3: FaceView = ${view(S, hS, [["R", "ear-r"]])};
/** 头发：${LAYERS ? "分层画的（后面那片、压在脸上的几缕、马尾、发圈，每块正面和 3/4 已经逐点对应好）" : "后面那片（转身时按头顶 / 最右 / 最低 / 最左对应）、刘海（已经逐点对应好：发际线对发际线、圆顶对圆顶）、单独的几块（秃顶两鬓）"} */
export const ${C.prefix}_HAIR = {${LAYERS ? layersSrc() : ""}${
  LAYERS ? "" : F["hair-back"] ? `\n  back: { front: ${fmt(hF(backOf(F)))} as V2[], side: ${fmt(hS(backOf(S)))} as V2[] },` : ""
}${!LAYERS && F.fringe ? `\n  fringe: { front: ${fmt(hF(fringeOf(F)))} as V2[], side: ${fmt(hS(fringeOf(S)))} as V2[] },` : ""}${
  !LAYERS && F["hair-tail"] ? `\n  tail: { front: ${fmt(hF(loopOf(F["hair-tail"])))} as V2[], side: ${fmt(hS(loopOf(S["hair-tail"])))} as V2[] },` : ""
}${!LAYERS && F["hair-tie"] ? `\n  tie: { front: ${fmt(hF(loopOf(F["hair-tie"])))} as V2[], side: ${fmt(hS(loopOf(S["hair-tie"])))} as V2[] },` : ""}${
  !LAYERS && piecesOf(F).length
    ? `\n  pieces: [${piecesOf(F).map((id) => `\n    { front: ${fmt(hF(sample(F[id].segs, 8).slice(0, -1)))} as V2[], side: ${fmt(hS(sample(S[id].segs, 8).slice(0, -1)))} as V2[] },`).join("")}\n  ],`
    : ""
}
};
`;
// ——— 敞怀外衣（coat-l / coat-r）：两片前襟，正面和 3/4 逐点对应 ———
// 每片按同样的几段：肩线（脖子边 → 肩头，主角外套的）、侧缝（肩头 → 腋下 → 拐角 → 下摆外角）、下摆（外角 → 门襟下端的角）、
// 门襟（下端 → 上端）、领口（门襟上端 → 脖子边）。肩、腋下是主角外套的（胳膊和主角一样，袖子盖在上面）；侧缝从腋下直着下来接到描的下摆外角。
// 下摆被手挡住、描到的外角在腋下里面时（3/4 近处那片），下摆照原来的高度往外接到腋下正下方再拐上去
const N = { A: 13, C1: 6, C2: 16, C3: 6, D: 14, E: 30, F: 6 };
const join = (...parts) => parts.flatMap((p, i) => (i ? p.slice(1) : p));
const line = (a, b) => [a, b];
function coatPanel(v, view, side) {
  const p = sample(v[`coat-${side}`].segs, 16);
  // 门襟从肩线那一行开始：描到的立领（比脖子边还高的那一截）不要，立领另外画（cast-wear.ts 的 standCollar），
  // 不然领口立起两个尖角
  while (p.length > 3 && p[0][1] < NECK_SIDE[view][side][1]) p.shift();
  // 门襟下端的角：l 在右下（x + y 最大），r 在左下（y − x 最大）
  const ci = p.reduce((bi, q, i) => ((side === "l" ? q[0] + q[1] : q[1] - q[0]) > (side === "l" ? p[bi][0] + p[bi][1] : p[bi][1] - p[bi][0]) ? i : bi), 0);
  const top = p[0];
  const neck = NECK_SIDE[view][side];
  const sh = COAT_SHOULDER[view][side];
  const under = sh[sh.length - 1];
  const outside = side === "l" ? p[p.length - 1][0] <= under[0] : p[p.length - 1][0] >= under[0];
  // 下摆被手挡住：描到的最后几个点是沿着手往上拐的，去掉（不然往外接的那截比下摆高一块）
  if (!outside) {
    const yb = Math.max(...p.slice(ci).map((q) => q[1]));
    while (p.length > ci + 2 && p[p.length - 1][1] < yb - 1) p.pop();
  }
  const end = p[p.length - 1];
  const corner = outside ? end : [under[0], end[1]];
  const A = resample([neck, ...sh.slice(1, 13)], N.A);
  const C = join(resample(sh.slice(12), N.C1), resample(line(under, corner), N.C2), resample(line(corner, end), N.C3));
  const D = resample(p.slice(ci).reverse(), N.D);
  const E = resample(p.slice(0, ci + 1).reverse(), N.E);
  const F = resample(line(top, neck), N.F);
  return { E, F, neck, edge: join(E, F), all: join(A, C, D, E, F).slice(0, -1) };
}
// 衣襟中间敞开的那块（里面的上衣只画在这里面）：左片门襟（下 → 上）、领口，往上包住脖子，再右片领口、门襟（上 → 下）
const opening = (l, r) => [...l.E, ...l.F.slice(1), [l.neck[0], 262], [r.neck[0], 262], ...[...r.F].reverse(), ...[...r.E].reverse().slice(1)];
let coatSrc = "";
if (F["coat-l"] || S["coat-l"]) {
  for (const [n, v] of [["正面", F], ["3/4", S]]) for (const id of ["coat-l", "coat-r"]) if (!v[id]) throw new Error(`${n}少了 ${id}`);
  const P = { front: { l: coatPanel(F, "front", "l"), r: coatPanel(F, "front", "r") }, side: { l: coatPanel(S, "side", "l"), r: coatPanel(S, "side", "r") } };
  const B = (pts) => fmt(pts.map(toBody));
  const pairOut = (a, b) => `[${B(a)}, ${B(b)}] as [V2[], V2[]]`;
  coatSrc = `
/** 敞怀外衣（开衫）：两片前襟、中间敞开的那块、两道门襟（下摆 → 脖子边，总是描边），身体坐标，[正面, 3/4] 逐点对应（cast-wear.ts 的 GarmentArt）。门襟、下摆照参考图描的，肩、腋下是主角外套的 */
export const ${C.prefix}_COAT: GarmentArt = {
  l: ${pairOut(P.front.l.all, P.side.l.all)},
  r: ${pairOut(P.front.r.all, P.side.r.all)},
  opening: ${pairOut(opening(P.front.l, P.front.r), opening(P.side.l, P.side.r))},
  edgeL: ${pairOut(P.front.l.edge, P.side.l.edge)},
  edgeR: ${pairOut(P.front.r.edge, P.side.r.edge)},
};
`;
}
// ——— 裤腿（leg-l / leg-r）：只取宽窄，绕着主角的胯、膝、脚踝重新摆 ———
// 参考图里的人站得直（两脚在胯底下），主角的腿往外撇：照原样放上去裤腿就和骨头对不上。一行一行量裤腿的外沿、里沿离这条腿中线
// （裆以下每行外沿、里沿的中点拟合的一条直线）多远，放到主角这条腿的骨头上（胯 → 膝 → 脚踝）同样的高度：大腿一样长，
// 小腿按参考图的膝盖到裤脚拉到主角的膝盖到脚踝下面 legHem（默认 5）。裆以上里沿是正中，裆往下 30 慢慢过渡到骨头旁边。上沿接到 y −11（藏在上衣里）
const KNEE_Y = 123.28;
const smooth01 = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function legOf(path, side) {
  const ring = sample(path.segs, 12).map(([X, Y]) => [(X - 229.5) * K, (Y - 463.8) * K]);
  const ys = ring.map((p) => p[1]);
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const out = side === "R" ? -1 : 1;
  const rows = [];
  for (let y = y0 + 0.5; y < y1 - 0.4; y += 1.5) {
    const xs = [];
    for (let i = 0; i < ring.length; i++) {
      const [a, b] = [ring[i], ring[(i + 1) % ring.length]];
      if ((a[1] - y) * (b[1] - y) < 0) xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
    }
    if (xs.length < 2) continue;
    rows.push({ y, outer: out < 0 ? Math.min(...xs) : Math.max(...xs), inner: out < 0 ? Math.max(...xs) : Math.min(...xs) });
  }
  // 裆：里沿还在正中（两条腿连着）的最低那一行（上沿的两个圆角也离开正中，不能从上往下找第一行）
  const crotch = Math.max(...rows.filter((r) => r.y < KNEE_Y && Math.abs(r.inner) <= 1.5).map((r) => r.y));
  // 参考图这条腿的中线：最小二乘拟合 x = a + b·y
  console.error(side, "裆", crotch.toFixed(1), "裤脚", y1.toFixed(1));
  const fit = rows.filter((r) => r.y > crotch + 15 && r.y < y1 - 8);
  const my = fit.reduce((t, r) => t + r.y, 0) / fit.length;
  const mx = fit.reduce((t, r) => t + (r.outer + r.inner) / 2, 0) / fit.length;
  const b = fit.reduce((t, r) => t + (r.y - my) * ((r.outer + r.inner) / 2 - mx), 0) / fit.reduce((t, r) => t + (r.y - my) ** 2, 0);
  const mid = (y) => mx + b * (y - my);
  // 裤腰那几行被上衣下摆挡住、只描到下摆中间露出来的那一截：往上看外沿离中线一下子收进去 3 以上，就当是被挡住了，
  // 那几行用下面第一行完整的外沿（不然裤腿上沿留一个台阶）
  for (let i = rows.length - 2; i >= 0; i--) {
    const o = (r) => out * (r.outer - mid(r.y));
    if (rows[i].y < KNEE_Y && o(rows[i]) < o(rows[i + 1]) - 3) {
      const keep = rows[i + 1].outer - mid(rows[i + 1].y);
      for (let k = i; k >= 0; k--) rows[k] = { ...rows[k], outer: mid(rows[k].y) + keep };
      break;
    }
  }
  const { hip, knee, ankle } = LEG_REST[side];
  // 裤脚落在脚踝下面多少（配置的 art.legHem，默认 5：小孩的卷边裤脚在脚踝上；长裤盖到鞋面给 20 多）
  const hem = ankle[1] + (C.legHem ?? 5);
  const mapY = (y) => (y <= KNEE_Y ? y : KNEE_Y + ((y - KNEE_Y) * (hem - KNEE_Y)) / (y1 - KNEE_Y));
  const bone = (Y) => (Y <= knee[1] ? hip[0] + ((knee[0] - hip[0]) * (Y - hip[1])) / (knee[1] - hip[1]) : knee[0] + ((ankle[0] - knee[0]) * (Y - knee[1])) / (ankle[1] - knee[1]));
  const outerPts = rows.map((r) => [bone(mapY(r.y)) + r.outer - mid(r.y), mapY(r.y)]);
  const innerPts = rows.map((r) => [(bone(mapY(r.y)) + r.inner - mid(r.y)) * smooth01(crotch, crotch + 30, r.y), mapY(r.y)]);
  const last = rows.length - 1;
  return [[outerPts[0][0], -11.3], ...outerPts, [outerPts[last][0], hem], [innerPts[last][0], hem], ...innerPts.reverse(), [0, -8]];
}
let legSrc = "";
if (F["leg-l"] || F["leg-r"]) {
  for (const id of ["leg-l", "leg-r"]) if (!F[id]) throw new Error(`正面少了 ${id}`);
  const r2 = (pts) => fmt(pts.map(([x, y]) => [+x.toFixed(2), +y.toFixed(2)]));
  legSrc = `
/** 裤腿（人物配置的 legArt）：正面站直时的轮廓，身体坐标，L 画面右、R 画面左。宽窄照参考图描的，绕着主角的胯、膝、脚踝摆（关节和主角一样） */
export const ${C.prefix}_LEGS = {
  L: ${r2(legOf(F["leg-r"], "L"))} as V2[],
  R: ${r2(legOf(F["leg-l"], "R"))} as V2[],
};
`;
}
const out = coatSrc ? src.replace('import type { FaceView } from "./figure";', 'import type { GarmentArt } from "./cast-wear";\nimport type { FaceView } from "./figure";') + coatSrc + legSrc : src + legSrc;
fs.writeFileSync(path.join(outDir, `cast-${C.file}-art.ts.txt`), out);
console.error(`写好 cast-${C.file}-art.ts.txt`, out.length, "字", coatSrc ? "（有外衣）" : "", legSrc ? "（有裤腿）" : "");
