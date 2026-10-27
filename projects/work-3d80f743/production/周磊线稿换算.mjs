// 用户在《周磊-线稿.svg》（正面）、《周磊-侧面线稿.svg》（3/4 朝左）里画的线 → 素材库「剪纸角色」的
//   code/cast-hair-art.ts（周磊的碎发）、code/cast-face-art.ts（周磊 3/4 的脸：轮廓、眼珠、鼻子、嘴）。
// 用法：node production/周磊线稿换算.mjs <输出目录>，写 cast-hair-art.ts.txt、cast-face-art.ts.txt（再 material_write put work_file 放进素材库）
// 按路径在「身体」图层里的顺序认（用户没给 id）：正面第 4 条是头发（外轮廓 + 发际线围成的一圈）、第 5 条是刘海下沿（开口的线）、
// 第 6 条是头顶一道发丝，第 9 条是嘴，第 12、13 条是两只眼睛；侧面第 1 条是脸、第 2 条是刘海（闭合）、第 3 条是后面的头发（闭合）、
// 第 4 条是耳朵，第 5、6 条是远处、近处的眉毛，第 9、10 条是近处、远处的眼睛，第 11 条是嘴，第 12 条是鼻子。换了画法要先核对下面打印的包围盒。
// 坐标：线稿 → 身体 ((X − 229.5)·0.905, (Y − 463.8)·0.905) → 头的坐标（按周磊的 headScale、headWidth / headWidthSide、width 反算，
// 3/4 时脖子往前 6.44、头往后 8）：x = (X − X0) / kx，y = (Y − 225.68) / 1.0608。
// 3/4 的脸用用户的线稿以后，3/4 时头不用另外收窄：headWidthSide 和 headWidth 一样（1.07）。
// 读 SVG 路径这些通用的部分用素材库「剪纸角色」tools/线稿换算工具.mjs：先找作品里复制过来的 production/线稿工具/，
// 再找服务器上素材库的工作目录 /data/libraries/<作品库>/剪纸角色/tools/
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const TOOLS = (() => {
  const local = path.join(path.dirname(new URL(import.meta.url).pathname), "线稿工具");
  if (fs.existsSync(path.join(local, "线稿换算工具.mjs"))) return local;
  const libs = "/data/libraries";
  for (const repo of fs.existsSync(libs) ? fs.readdirSync(libs) : []) {
    const d = path.join(libs, repo, "剪纸角色/tools");
    if (fs.existsSync(path.join(d, "线稿换算工具.mjs"))) return d;
  }
  throw new Error("找不到素材库「剪纸角色」的 tools/：用 material_read 把它复制到 production/线稿工具/");
})();
const { bbox, layerPaths, parsePath, parseTransform, resample, sample } = await import(pathToFileURL(path.join(TOOLS, "线稿换算工具.mjs")).href);

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const outDir = process.argv[2];
// 周磊的胳膊、脖子、腿和主角一样（用户 2026-10-27：「脸头发衣服用我的线条，胳膊脖子，腿都和主角一样就行」）：头不缩放、体型不加宽，
// 用户的线原样落在主角的骨架上
const ZL = { hs: 1, hwF: 1, hwS: 1, w: 1 };
const K = 0.905;
const NECK_Y = -162.7;
const HEAD_UP = 55;
const Y0 = 463.8 + (NECK_Y - ZL.hs * HEAD_UP) / K;
const KY = ZL.hs / K;
const MAP = {
  front: { x0: 229.5, kx: (ZL.hs * ZL.hwF) / K },
  side: { x0: 229.5 + (ZL.w * 10 * Math.sin(-0.7) + ZL.hs * ZL.hwS * 8) / K, kx: (ZL.hs * ZL.hwS) / K },
};

// ——— 正面 ———
const F = layerPaths(fs.readFileSync(path.join(root, "public/ref/周磊-线稿.svg"), "utf8"), "body");
const S = layerPaths(fs.readFileSync(path.join(root, "public/ref/周磊-侧面线稿.svg"), "utf8"), "side-body");
// 3/4 的衣服（S[13]…S[24]：西装、翻领、衬衫领、领结、领带、腰线）整体往左挪到主角的身子上（用户 2026-10-27：「脖子和腿的位置是对的，
// 错的是身体，身体要整体向左移」）：用户照参考图画的 3/4 身子比主角的靠后，挪多少按用户画的脖子（S[12]）在 y 278 的中心
// − 主角 3/4 脖子在同一高度的中心（_周磊底图.ts 7–8 秒量的描边中线 202.8 / 233.3）。脸、头发不挪（下巴本来就在主角的脖子上）
const BODY3_DX = (() => {
  const pts = sample(S[12].segs, 60).filter((p) => Math.abs(p[1] - 278) < 1.5);
  const userNeck = (Math.min(...pts.map((p) => p[0])) + Math.max(...pts.map((p) => p[0]))) / 2;
  return (202.8 + 233.3) / 2 - userNeck;
})();
console.error("3/4 衣服往左挪", BODY3_DX.toFixed(2), "线稿单位");
for (let i = 13; i <= 24; i++) S[i] = { ...S[i], segs: S[i].segs.map((sg) => sg.map(([x, y]) => [x + BODY3_DX, y])) };
const ring = F[3];
const fringeLine = F[4];
const strandF = F[5];
console.error("正面 头发一圈", bbox(sample(ring.segs)), "刘海下沿", bbox(sample(fringeLine.segs)), "发丝", bbox(sample(strandF.segs)));
// 头发一圈：从左鬓角起，外轮廓翻过头顶到右鬓角最低的那一点，再沿发际线绕回来。外轮廓是前半段
let cut = 0;
ring.segs.forEach((s, i) => {
  if (s[3][0] > 240 && s[3][1] > ring.segs[cut][3][1]) cut = i;
});
const outer = sample(ring.segs.slice(0, cut + 1));
console.error("  外轮廓到第", cut + 1, "段，终点", outer[outer.length - 1].map((v) => +v.toFixed(1)));
// 后面那片（正面）：外轮廓，底下从右鬓角直接连回左鬓角（藏在脸和耳朵后面）
const backF = outer;
// 刘海那片（正面）：刘海下沿 + 从它的右端沿外轮廓（往里收 5，不盖住外轮廓的描边）翻过头顶回到左端
const fl = sample(fringeLine.segs);
const [S0, E0] = [fl[0], fl[fl.length - 1]];
const near = (p) => outer.reduce((bi, q, i) => (Math.hypot(q[0] - p[0], q[1] - p[1]) < Math.hypot(outer[bi][0] - p[0], outer[bi][1] - p[1]) ? i : bi), 0);
const iE = near(E0);
const iS = near(S0);
const C = [229, 232];
const inset = (q, d = 5) => {
  const l = Math.hypot(C[0] - q[0], C[1] - q[1]) || 1;
  return [q[0] + ((C[0] - q[0]) / l) * d, q[1] + ((C[1] - q[1]) / l) * d];
};
// 外轮廓从左鬓角顺时针（经过头顶）到右鬓角：右端 iE 往回走到左端 iS 就是翻过头顶的那一段
const arc = [];
for (let i = iE; i >= iS; i--) arc.push(inset(outer[i]));
const fringeF = [...fl, ...arc];
console.error("  刘海那片：下沿", fl.length, "点，翻过头顶", arc.length, "点");

// ——— 侧面 ———
// 刘海（闭合）：从左端沿下沿（一个个发尖）到右端（第 18 段的终点），再翻过头顶回到左端
const fringeSZig = sample(S[1].segs.slice(0, 18));
const fringeSArc = sample(S[1].segs.slice(18));
const fringeS = [...fringeSZig, ...fringeSArc];
const backS = sample(S[2].segs);
console.error("侧面 刘海", bbox(fringeS), "后面的头发", bbox(backS));

// ——— 换到头的坐标 ———
const toHead = (view) => (pts) => pts.map(([X, Y]) => [+((X - MAP[view].x0) / MAP[view].kx).toFixed(2), +((Y - Y0) / KY).toFixed(2)]);
// 刘海正面和 3/4 逐点对应：下沿对下沿（左端 → 右端）、翻过头顶那段对那段，按弧长各取同样多的点
// （按最高 / 最右 / 最低 / 最左对应时正面最低的是左鬓角、3/4 是中间的发尖，转到一半有一绺扫过眼睛）
const ZIG = 120;
const ARC = 80;
const fringeMatchedF = [...resample(fl, ZIG), ...resample(arc, ARC).slice(1, -1)];
const fringeMatchedS = [...resample(fringeSZig, ZIG), ...resample(fringeSArc, ARC).slice(1, -1)];
const fmt = (pts) => "[" + pts.map(([x, y]) => `[${x}, ${y}]`).join(", ") + "]";
const src = `// 周磊的碎发：用户在作品 3d80f743 的 \`public/ref/周磊-线稿.svg\`（正面）、\`周磊-侧面线稿.svg\`（3/4 朝左）里画的线。
// 由作品 3d80f743 的 \`production/周磊线稿换算.mjs\` 生成，别手改：改线稿再重新生成。
// 头的坐标（脸最宽处半宽 41、下巴 y = 48、眼睛 y ≈ 8），按周磊的 headScale ${ZL.hs}、headWidth ${ZL.hwF}、width ${ZL.w} 反算：
// 换了这几个数要重新生成。都是折线（按段取的点），转身时正面和 3/4 两张逐点对应、按比例混合（cast-hair.ts）。

import type { V2 } from "./rig";

export const TOUSLED = {
  /** 后面那片（画在身子后面）：外轮廓，正面底下藏在脸后面直接连回去 */
  back: { front: ${fmt(toHead("front")(backF))} as V2[], side: ${fmt(toHead("side")(backS))} as V2[] },
  /** 刘海那片（盖在脸上，只描压在皮肤上的边）：正面和 3/4 已经逐点对应好（下沿对下沿、头顶对头顶） */
  fringe: { front: ${fmt(toHead("front")(fringeMatchedF))} as V2[], side: ${fmt(toHead("side")(fringeMatchedS))} as V2[] },
  /** 头顶的发丝（只有正面） */
  strands: [${fmt(toHead("front")(sample(strandF.segs, 6)))} as V2[]],
};
`;
// ——— 脸（正面、3/4）———
// 眼睛：用户画的椭圆就是眼睛的外框（眼珠 + 外侧的月牙）：基础模型的眼睛横着从眼珠内侧 −6.97 到外侧月牙 10.6、竖着 ±9.96，
// 按椭圆的宽高缩放，眼珠中心从椭圆中心往里挪半个差（月牙在外侧）。嘴：两个嘴角（宽度照画的）。鼻子：起点、控制点、终点。
const hF = toHead("front");
const hS = toHead("side");
const boxOf = (pts) => {
  const b = bbox(pts);
  return { c: [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], w: b[2] - b[0], h: b[3] - b[1] };
};
const IRIS_RX = 6.97;
const EYE_OUT = 10.6;
/** s：-1 画面左那只（R）、1 画面右那只（L） */
const iris = (path, map, s) => {
  const e = boxOf(map(sample(path.segs)));
  const sx = e.w / (IRIS_RX + EYE_OUT);
  return `{ c: [${(e.c[0] - (s * (EYE_OUT - IRIS_RX) * sx) / 2).toFixed(2)}, ${e.c[1].toFixed(2)}] as V2, rx: ${(IRIS_RX * sx).toFixed(2)}, ry: ${(e.h / 2).toFixed(2)} }`;
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
const r2 = (p) => `[${p[0].toFixed(2)}, ${p[1].toFixed(2)}]`;
const bezOut = (segs, map) => fmt(map([segs[0][0], ...segs.flatMap((s) => [s[1], s[2], s[3]])]));
const view = ({ face, eyeR, eyeL, nose, mouth, ears, browR, browL }, map) => `{
    face: ${bezOut(face.segs, map)} as V2[],
    iris: { R: ${iris(eyeR, map, -1)}, L: ${iris(eyeL, map, 1)} },
    nose: [${noseOf(nose, map).map(r2).join(", ")}] as V2[],
    mouth: [${ends(mouth, map).map(r2).join(", ")}] as V2[],
    ears: { ${Object.entries(ears).map(([k, p]) => `${k}: ${bezOut(p.segs, map)} as V2[]`).join(", ")} },
    brows: { R: ${r2(boxOf(map(sample(browR.segs))).c)} as V2, L: ${r2(boxOf(map(sample(browL.segs))).c)} as V2 },
  }`;
const faceSrc = `// 周磊的脸（正面、3/4 朝画面左）：轮廓、眼睛、鼻子、嘴、耳朵、眉毛的位置都是用户在作品 3d80f743 的
// \`public/ref/周磊-线稿.svg\`、\`周磊-侧面线稿.svg\` 里画的线。由作品 3d80f743 的 \`production/周磊线稿换算.mjs\` 生成，别手改：改线稿再重新生成。
// 头的坐标（脸最宽处半宽约 41、下巴 y ≈ 48），头不缩放（周磊的头和主角的骨架一样）。转身时正面逐点过渡到 3/4（figure.ts 的 Look.face0 / face3）。
// 眼睛：用户画的椭圆是整只眼睛的外框，换算成基础模型的眼珠中心和半径（眼珠 6.97 × 9.96 时整只眼睛宽 17.57、高 19.92）。

import type { FaceView } from "./figure";
import type { V2 } from "./rig";

/** 正面 */
export const ZHOULEI_FACE0: FaceView = ${view({ face: F[0], eyeR: F[11], eyeL: F[12], nose: F[13], mouth: F[8], ears: { L: F[2], R: F[1] }, browR: F[6], browL: F[7] }, hF)};
/** 3/4（朝画面左）：远侧 R 在画面左，近侧 L 在画面右；耳朵只有近处那只（R，画面右） */
export const ZHOULEI_FACE3: FaceView = ${view({ face: S[0], eyeR: S[9], eyeL: S[8], nose: S[11], mouth: S[10], ears: { R: S[3] }, browR: S[4], browL: S[5] }, hS)};
`;
// ——— 西装（身体坐标：原点在胯，x 按 width 反算）———
// 正面 F[15] 是西装的外轮廓（身子连两只袖子，敞怀），F[16]、F[17] 两条翻领，F[20]、F[21] 衬衫领，F[22] 领结，F[23] 领带，F[24] 腰线；
// 3/4 S[13] 近处（画面右）的肩和袖子，S[14] 远处（画面左）的肩和袖子，S[15]、S[16] 两条翻领，S[18]、S[19] 衬衫领，S[20] 领结，
// S[21] 远处那片前襟，S[22] 近处那片前襟，S[23] 腰线，S[24] 领带。
// 两片前襟正面和 3/4 按同样的几段逐点对应：肩线（领口 → 肩）、袖窿（肩 → 腋下，藏在袖子下面）、侧缝（腋下 → 下摆外角）、
// 下摆（外角 → 门襟角）、门襟（下摆 → 门襟上端）、领口（门襟上端 → 领口）。翻领：翻领的边（领口 → 翻折点）、门襟（翻折点 → 上端）、领口。
const toBody = ([X, Y]) => [+(((X - 229.5) * K) / ZL.w).toFixed(2), +((Y - 463.8) * K).toFixed(2)];
const seg = (path, i) => path.segs[i];
const rev = ([a, b, c, d]) => [d, c, b, a];
const lineSeg = (a, b) => [a, [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3], [a[0] + (2 * (b[0] - a[0])) / 3, a[1] + (2 * (b[1] - a[1])) / 3], b];
/** 几段曲线连成一条，按弧长取 n 个点 */
const edge = (segs, n) => resample(sample(segs, 24), n);
/** 一段曲线在 y0..y1 之间的那一截（从 y0 那头到 y1 那头） */
const cutY = (sg, y0, y1, n) => {
  const pts = sample([sg], 200);
  const inside = (y) => (y0 < y1 ? y >= y0 && y <= y1 : y <= y0 && y >= y1);
  let part = pts.filter((p) => inside(p[1]));
  if (Math.abs(part[0][1] - y0) > Math.abs(part[part.length - 1][1] - y0)) part = part.reverse();
  return resample(part, n);
};
const N = { A: 14, B: 8, C: 24, D: 12, E: 30, F: 8 };
const join = (...parts) => parts.flatMap((p, i) => (i ? p.slice(1) : p));
const panel = ({ A, B, C, D, E, F }) => ({ A, B, C, D, E, F, all: join(A, B, C, D, E, F).slice(0, -1) });
const sF = F[15];
/**
 * 量出来的描边外沿 → 西装的线：先顺几遍（像素是半格半格的、凸包有折角），再沿法线往里收 1.66（西装的描边一半在线外面）。
 * inLeft：沿着点走时身子在左手边（y 朝下：左手边是 (ty, −tx)），从脖子往左下走的那边肩膀是 true，往右下走的是 false
 */
function insetEdge(edgePts, inLeft, passes = 1) {
  let sm = edgePts;
  for (let k = 0; k < passes; k++)
    sm = sm.map((p, i, a) => (i === 0 || i === a.length - 1 ? p : [(a[i - 1][0] + 2 * p[0] + a[i + 1][0]) / 4, (a[i - 1][1] + 2 * p[1] + a[i + 1][1]) / 4]));
  const sg = inLeft ? 1 : -1;
  return sm.map((p, i) => {
    const a = sm[Math.max(0, i - 1)];
    const b = sm[Math.min(sm.length - 1, i + 1)];
    const t = [b[0] - a[0], b[1] - a[1]];
    const l = Math.hypot(t[0], t[1]) || 1;
    return [p[0] + sg * (t[1] / l) * 1.66, p[1] - sg * (t[0] / l) * 1.66];
  });
}
/** 折线按大约 1 个单位一个点加密（好顺） */
const dense = (pts) => pts.flatMap((p, i) => {
  if (i === 0) return [p];
  const a = pts[i - 1];
  const n = Math.max(1, Math.ceil(Math.hypot(p[0] - a[0], p[1] - a[1])));
  return Array.from({ length: n }, (_, k) => [a[0] + ((p[0] - a[0]) * (k + 1)) / n, a[1] + ((p[1] - a[1]) * (k + 1)) / n]);
});
const quad = (a, c, b, n = 16) => Array.from({ length: n }, (_, k) => {
  const t = (k + 1) / n;
  return [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
});
/**
 * 正面的两个肩（用户 2026-10-27：「正面肩膀坑坑洼洼的这个地方修一下」）：西装穿着时上臂压在西装上，通用胳膊顶上那个圆头比用户画的肩线高出约 5、
 * 圆头和袖子之间往里凹一点，接出两处台阶。西装的肩线改走「西装的线 + 圆头 + 袖子」外沿的凸包（_周磊底图.ts 0–1 秒正面量的描边外沿），
 * 从圆头最宽处用一段二次曲线顺进袖子（起点竖直、终点和袖子同一个斜度），往里收 1.66；胳膊在肩膀圈里压着西装的描边不画，接成一条线。
 */
const FRONT_SHOULDER_EDGE = {
  // 左：凸包 (206,280) → 圆头顶 (180.5,292)(179,293) → (164.5,303) → 最宽 (164,304.5)；袖子 x = 162.5 − 0.375·(y − 318)
  L: [...dense([[206, 280], [180.5, 292], [179, 293], [164.5, 303], [164, 304.5]]), ...quad([164, 304.5], [164, 314], [159.5, 326])],
  // 右：和左边对称量的；袖子 x = 296 + 0.375·(y − 318)
  R: [...dense([[250.5, 280], [278, 292], [279.5, 293], [293, 303], [294, 304.5]]), ...quad([294, 304.5], [294, 312.7], [299, 326])],
};
const FRONT_SHOULDER = { L: insetEdge(FRONT_SHOULDER_EDGE.L, true, 4), R: insetEdge(FRONT_SHOULDER_EDGE.R, false, 4) };
const P = sF.segs.map((s) => s[0]);
// 肩线：用户画的线从脖子走到 y 279，往下接 FRONT_SHOULDER（圆头、袖子的外沿），袖窿从它的末端连到腋下
const userTo279 = (sg) => sample([sg], 60).filter((p) => p[1] < 279);
const panelFL = panel({
  A: resample([...userTo279(rev(seg(sF, 0))), ...FRONT_SHOULDER.L], N.A),
  B: edge([lineSeg(FRONT_SHOULDER.L[FRONT_SHOULDER.L.length - 1], P[13])], N.B),
  C: edge([rev(seg(sF, 12))], N.C),
  D: edge([rev(seg(sF, 11))], N.D),
  E: edge([rev(seg(sF, 10))], N.E),
  F: edge([rev(seg(sF, 9)), lineSeg(P[9], P[1])], N.F),
});
const panelFR = panel({
  A: resample([...userTo279(seg(sF, 1)), ...FRONT_SHOULDER.R], N.A),
  B: edge([lineSeg(FRONT_SHOULDER.R[FRONT_SHOULDER.R.length - 1], P[5])], N.B),
  C: edge([seg(sF, 5)], N.C),
  D: edge([seg(sF, 6)], N.D),
  E: edge([seg(sF, 7)], N.E),
  F: edge([seg(sF, 8), lineSeg(P[9], P[1])], N.F),
});
const sl = S[14];
const fl3 = S[21];
// 胳膊和主角一样（用户 2026-10-27）：3/4 时主角的肩比参考图里男人的窄，西装的两个肩角挪到主角的肩上（主角 3/4 的肩在这个高度的轮廓，
// _周磊底图.ts 7–8 秒量的），肩线从领口那头起按弧长渐渐挪过去，袖窿从新的肩角直接连到腋下（藏在袖子下面 / 远处的胳膊从它后面露出来）
// near：近处的胳膊画在西装前面，西装的肩角收在胳膊里面（量出来的描边外沿往里 4，胳膊的路径在外沿往里 3.3），不从袖子外面冒出来
const CORNER3 = { far: [169.5, 305.0], near: [267.5, 305.0] };
/**
 * 主角 3/4 远处的肩到上臂外沿（_周磊底图.ts 7–8 秒画不穿外衣的基础模型量的描边外沿，y 284…323）。
 * 胳膊的描边在路径外面 lw（3.3 线稿单位），西装的描边一半在外面：西装的线放在量出来的外沿往里 1.66，两条描边的外沿接成一条，
 * 一直走到上臂直的那一段（y ≈ 323），肩头那块圆的盖在西装下面（原来停在肩头的外沿上，和胳膊的描边接出一个台阶）
 */
const FAR_SHOULDER3_EDGE = [[202, 284], [197, 287], [191, 290], [185, 293], [178, 296], [174, 299], [171.5, 302], [169.5, 305], [168, 308], [166, 311], [164.5, 314], [163, 317], [162, 320], [160.5, 323]];
const FAR_SHOULDER3 = insetEdge(FAR_SHOULDER3_EDGE, true);
// 肩线照用户画的走（翻领的上半截贴着它，整条挪了翻领会被裁掉），只在靠肩角那头拐到主角的肩上：
// 远处那只（主角的肩更宽）从用户的肩角接着往外连到主角的肩；近处那只（主角的肩更窄）在 x 过了 keepX 以后直接连到主角的肩
const shoulderTo = (segs, to, keepX) => {
  const pts = sample(segs, 40);
  const kept = keepX === undefined ? pts : pts.filter((p) => p[0] <= keepX);
  return resample([...kept, to], N.A);
};
const armL3 = fl3.segs[2][3];
const panelSL = panel({
  // 远处的肩：主角 3/4 的肩比用户画的高、宽（身子在西装底下不画，肩那块要西装盖住）：从领口直接接上主角的肩的轮廓走到肩角
  A: resample([sl.segs[0][0], ...FAR_SHOULDER3], N.A),
  B: edge([lineSeg(FAR_SHOULDER3[FAR_SHOULDER3.length - 1], armL3)], N.B),
  C: edge([rev(seg(fl3, 2))], N.C),
  D: edge([rev(seg(fl3, 1))], N.D),
  E: edge([rev(seg(fl3, 0))], N.E),
  F: edge([lineSeg(fl3.segs[0][0], sl.segs[0][0])], N.F),
});
const sr = S[13];
const fr3 = S[22];
// 近处那片的侧缝：从下摆外角往上到领口后面，腋下那一截以上藏在袖子下面；袖窿从肩连到侧缝上和腋下一样高的那一点
const armY = sr.segs[4][3][1];
const sideUp = sample([seg(fr3, 3)], 200);
const armPt = sideUp.reduce((a, p) => (Math.abs(p[1] - armY) < Math.abs(a[1] - armY) ? p : a));
const panelSR = panel({
  A: shoulderTo([seg(sr, 0)], CORNER3.near, 262),
  B: edge([lineSeg(CORNER3.near, armPt)], N.B),
  C: cutY(seg(fr3, 3), armPt[1], fr3.segs[3][0][1], N.C),
  D: edge([rev(seg(fr3, 2))], N.D),
  E: edge([rev(seg(fr3, 1)), rev(seg(fr3, 0))], N.E),
  F: edge([lineSeg(fr3.segs[0][0], sr.segs[0][0])], N.F),
});
// 衣襟中间敞开的那块（原来的身子只画在这里面：3/4 时身子比西装往前凸；整件外轮廓裁的话，衬衫在西装边上留一圈发丝白边）：
// 远处那片的门襟（下摆 → 上端）、领口，再接近处那片的领口、门襟（倒着走）
const opening = (l, r) => join(l.E, l.F, [...r.F].reverse(), [...r.E].reverse()).slice(0, -1);
// 翻领：翻领的边 + 门襟上翻折点到上端那一截 + 领口
const lapel = (lineSegs, frontSeg, y0, y1, neckSegs) => join(edge(lineSegs, 36), cutY(frontSeg, y0, y1, 16), edge(neckSegs, 6)).slice(0, -1);
const lapelFL = lapel(F[16].segs, seg(sF, 10), F[16].segs[4][3][1], P[10][1], [rev(seg(sF, 9)), lineSeg(P[9], F[16].segs[0][0])]);
const lapelFR = lapel(F[17].segs, seg(sF, 7), F[17].segs[4][3][1], P[8][1], [seg(sF, 8), lineSeg(P[9], F[17].segs[0][0])]);
const lapelSL = lapel(S[15].segs, seg(fl3, 0), S[15].segs[4][3][1], fl3.segs[0][0][1], [lineSeg(fl3.segs[0][0], S[15].segs[0][0])]);
const lapelSR = lapel(S[16].segs, seg(fr3, 0), fr3.segs[0][3][1], fr3.segs[0][0][1], [lineSeg(fr3.segs[0][0], S[16].segs[0][0])]);
// 闭合的小块（衬衫领、领结）：顺时针、从最低的那一点起，按弧长取 n 个点
const loop = (path, n) => {
  let pts = sample(path.segs, 24);
  if (!path.closed) pts = [...pts, pts[0]];
  let area = 0;
  for (let i = 0; i + 1 < pts.length; i++) area += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
  if (area < 0) pts = pts.reverse();
  const ring = pts.slice(0, -1);
  const lo = ring.reduce((bi, p, i) => (p[1] > ring[bi][1] ? i : bi), 0);
  const rot = [...ring.slice(lo), ...ring.slice(0, lo), ring[lo]];
  return resample(rot, n + 1).slice(0, -1);
};
// 领带：左上 → 左 → 尖 → 右 → 右上 → 左上（正面 0..4 是左上、左、尖、右、右上；3/4 倒过来画的）
const bladeF = join(...[0, 1, 2, 3, 4].map((i, k) => edge([seg(F[23], i)], [24, 10, 10, 24, 6][k]))).slice(0, -1);
const bladeS = join(...[3, 2, 1, 0, 4].map((i, k) => edge([rev(seg(S[24], i))], [24, 10, 10, 24, 6][k]))).slice(0, -1);
// 领口的 V：两片衬衫领里侧之间、领结上面，露出后面的脖子（cast-wear 在这块里把通用的脖子再画一遍，盖住身子领口那道线）。
// 正面：左领里侧上 → 里侧下 → 右领里侧下 → 里侧上，再往上包住脖子；3/4 同样的顺序（左领的里侧是闭合时补的那条边）
const neckV = (lTop, lBot, rBot, rTop) => [lTop, lBot, rBot, rTop, [rTop[0] + 2, 255], [lTop[0] - 2, 255]];
const neckF = neckV(F[20].segs[1][0], F[20].segs[2][0], F[21].segs[0][0], F[21].segs[5][0]);
const neckS = neckV(S[18].segs[0][0], S[18].segs[2][3], S[19].segs[0][0], S[19].segs[2][3]);
// 领结画在衬衫领上面（3/4 时左边的领尖压着领结左上角，用户：「领带缺一个角」）。正面用户画的领结上半截两角伸到衬衫领底下，
// 画在上面就盖住领子：正面只留两片领子中间露出来的那块（领结按两片领尖的下沿裁，Sutherland–Hodgman）
const knotF = (() => {
  let poly = sample(F[22].segs, 16).slice(0, -1);
  const keep = (a, b, inside) => {
    const side = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    const want = Math.sign(side(inside));
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const P = poly[i];
      const Q = poly[(i + 1) % poly.length];
      const sp = side(P) * want;
      const sq = side(Q) * want;
      if (sp >= 0) out.push(P);
      if (sp * sq < 0) {
        const t = sp / (sp - sq);
        out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]);
      }
    }
    poly = out;
  };
  const mid = [229, 310];
  keep(F[20].segs[2][0], F[20].segs[3][0], mid);
  keep(F[21].segs[0][0], F[21].segs[1][0], mid);
  return { segs: poly.map((p, i) => lineSeg(p, poly[(i + 1) % poly.length])), closed: true };
})();
const waistF = edge(F[24].segs, 16);
const waistS = edge(S[23].segs, 16);
console.error("西装 正面两片", panelFL.all.length, panelFR.all.length, "3/4", panelSL.all.length, panelSR.all.length, "近处腋下", armPt.map((v) => +v.toFixed(1)));
const B = (pts) => fmt(pts.map(toBody));
const pairOut = (a, b) => `[${B(a)}, ${B(b)}] as [V2[], V2[]]`;
const suitSrc = `// 周磊的西装（敞怀）：用户在作品 3d80f743 的 \`public/ref/周磊-线稿.svg\`（正面）、\`周磊-侧面线稿.svg\`（3/4 朝左）里画的线。
// 由作品 3d80f743 的 \`production/周磊线稿换算.mjs\` 生成，别手改：改线稿再重新生成。
// 身体坐标（原点在两个胯关节连线的中点，y 向下），x 按周磊的 width ${ZL.w} 反算。每一块都是 [正面, 3/4] 两组点，已经逐点对应好，
// 转身时按比例混合（cast-wear.ts 的 GarmentArt）。l 是画面左边那片（3/4 时远的那片），r 是右边那片。

import type { GarmentArt } from "./cast-wear";
import type { V2 } from "./rig";

export const ZHOULEI_SUIT: GarmentArt = {
  l: ${pairOut(panelFL.all, panelSL.all)},
  r: ${pairOut(panelFR.all, panelSR.all)},
  opening: ${pairOut(opening(panelFL, panelFR), opening(panelSL, panelSR))},
  lapelL: ${pairOut(lapelFL, lapelSL)},
  lapelR: ${pairOut(lapelFR, lapelSR)},
  collarL: ${pairOut(loop(F[20], 40), loop(S[18], 40))},
  collarR: ${pairOut(loop(F[21], 40), loop(S[19], 40))},
  knot: ${pairOut(loop(knotF, 30), loop(S[20], 30))},
  tie: ${pairOut(bladeF, bladeS)},
  waist: ${pairOut(waistF, waistS)},
  neck: ${pairOut(neckF, neckS)},
};
`;
fs.writeFileSync(path.join(outDir, "cast-wear-art.ts.txt"), suitSrc);
fs.writeFileSync(path.join(outDir, "cast-hair-art.ts.txt"), src);
fs.writeFileSync(path.join(outDir, "cast-face-art.ts.txt"), faceSrc);
console.error("头的坐标换算", JSON.stringify({ Y0: +Y0.toFixed(2), KY: +KY.toFixed(4), MAP }));
