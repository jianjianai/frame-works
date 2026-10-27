// 从平涂的参考图描配角的头：脸、耳朵、眼珠、鼻子、嘴、头发后面那片、刘海，写进作品的
// public/ref/<角色>-线稿.svg（正面）、<角色>-侧面线稿.svg（3/4 朝左）的「身体」图层（每条线有 id，用户可以在编辑器里改）。
// 用法（在作品文件夹里）：node <工具目录>/描图.mjs <角色> [--debug]（--debug 只出调试图：头发后面那片淡紫、脸的整圈肉色、刘海棕色，不写 SVG）
//   SVG 先用 线稿生成.mjs 生成；这里会把身体图层里的线整个换掉——用户改过线就别再跑。
//   角色的配置在作品的 production/线稿配置.mjs：ref、lines、trace（split 正面和 3/4 之间的竖线、head 头部那一条的上下、
//   faceTop / faceBottom 脸那块皮肤的盒子顶和底不超过多少、neckTop 脖子那块的盒子顶不低于多少、neckRow 量脖子中心的那一行、
//   isHair / isSkin / isMark 头发、皮肤、鼻嘴的颜色）。颜色用 看颜色.mjs 看；跑 --debug 看分得对不对再写。
// 参考图和主角的线稿用同一套横线：按头顶、膝两条线对到线稿；横着按脖子对齐：正面脖子中心对中线 229.5，
// 3/4 对主角 3/4 脖子的中心 218.05（线稿 y 278–288 是直的）——打出来的「脖子中心」填进配置的 views.cx。
// 只描头：衣服、鞋用素材库的通用版型（或用户另画）。
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { WORK, configOf, loadImage, mask, components, close, open, dilate, and, or, not, fillHoles, outline, smoothLoop, resampleLoop, debugPNG } from "./描图工具.mjs";

const sum = (p) => p[0] + p[1] + p[2];
const who = process.argv[2];
const cfg = await configOf(who, "用法：node <工具目录>/描图.mjs <角色> [--debug]");
if (!cfg.trace) throw new Error(`production/线稿配置.mjs 里 ${who} 没有 trace（描图的配置）`);
const C = { ...cfg.trace, ref: cfg.ref, lines: cfg.lines };
const root = WORK;
const DEBUG = process.argv.includes("--debug");
const DEBUG_DIR = path.join(os.tmpdir(), "frame-描图");
if (DEBUG) fs.mkdirSync(DEBUG_DIR, { recursive: true });
const REF = path.join(root, C.ref);
const K = (600 - 141.43) / (C.lines[1] - C.lines[0]);
const img = await loadImage(REF);
const { W, H, px } = img;
const [Y0, Y1] = C.head;
const inHead = (y) => y >= Y0 && y <= Y1;
const isHair = C.isHair;
const isSkin = C.isSkin;
const isMark = (p) => C.isMark(p) && !isHair(p);

function trace(view) {
  const [xa, xb] = view === "front" ? [0, C.split] : [C.split, W];
  const inView = (x, y) => x >= xa && x < xb && inHead(y);
  const hairM = mask(W, H, (x, y) => inView(x, y) && isHair(px(x, y)));
  const skinM = mask(W, H, (x, y) => inView(x, y) && isSkin(px(x, y)));
  const hairComp = components(hairM);
  const hair = close(hairComp[0].mask, 2);
  const skinComp = components(skinM).filter((c) => c.area > 25);
  // 脸：面积最大、在头发下面的那块；脖子在下巴下面
  let face = skinComp.find((c) => c.box[1] < C.faceTop && c.box[3] < C.faceBottom);
  let fb = face.box;
  const ears = skinComp.filter((c) => c !== face && c.box[1] > fb[1] && c.box[3] < fb[3] + 4 && (c.box[2] < fb[0] + 6 || c.box[0] > fb[2] - 6));
  if (!ears.length) {
    // 3/4：耳朵前面那道弧线没封口，耳朵和脸连成一块皮肤。开运算把细的连接断开，右边脸外面那块是耳朵
    const parts = components(open(face.mask, 2)).filter((c) => c.area > 20);
    const ear = parts.find((c) => c.box[0] > (fb[0] + fb[2]) / 2 && c.box[3] - c.box[1] < 60 && c !== parts[0]);
    if (ear) {
      const earM = and(face.mask, dilate(ear.mask, 2));
      const faceM = and(face.mask, not(earM));
      ears.push({ mask: earM, area: 0, box: ear.box });
      face = { ...components(faceM)[0] };
      fb = face.box;
    }
  }
  const neck = skinComp.find((c) => c.box[1] >= C.neckTop && c !== face);
  // 眼睛：头发颜色、在脸里面的两块
  const eyes = hairComp.slice(1).filter((c) => c.area > 40 && c.area < 900 && c.box[0] > fb[0] && c.box[2] < fb[2] && c.box[1] > fb[1] + 10 && c.box[3] < fb[3]);
  eyes.sort((p, q) => p.box[0] - q.box[0]);
  // 嘴那一笔中间颜色浅，断成几截：先横着连上（闭运算）再分块
  const markM = mask(W, H, (x, y) => inView(x, y) && x > fb[0] + 4 && x < fb[2] - 4 && y > eyes[0].box[3] + 2 && y < fb[3] - 3 && isMark(px(x, y)));
  const marks = components(and(close(markM, 3), dilate(markM, 3))).filter((c) => c.area >= 3);
  marks.sort((p, q) => p.box[1] - q.box[1]);
  const nose = marks[0];
  const mouth = marks.reduce((a, c) => (c.box[2] - c.box[0] > a.box[2] - a.box[0] ? c : a), marks[0]);

  // 脸的整圈：看得见的皮肤（往外扩到描边中间）里，挨着头发的那段（发际线）换成一个圆顶（藏在头发底下）
  // 眼睛也算脸（3/4 远处那只眼睛贴着脸边，不算进来脸就缺一块）
  // 闭运算把眼线贴着脸边的那道小缺口补上
  const faceVis = close(dilate(eyes.reduce((m, c) => or(m, c.mask), face.mask), 2), 4);
  const hairNear = dilate(hair, 3);
  let fo = smoothLoop(outline(faceVis), 2);
  // 发际线：挨着头发、又在眼睛上面的那段（眼睛以下挨着头发的是脸边：头发在脸旁边，不在脸上面）
  const eyeTop = Math.min(...eyes.map((c) => c.box[1]));
  const onHair = fo.map(([x, y]) => y < eyeTop - 2 && hairNear.m[Math.round(y) * W + Math.round(x)] === 1);
  // 最长的一段不挨头发的（下巴、两颊）
  let best = [0, 0];
  for (let i = 0; i < fo.length; i++) {
    if (onHair[i]) continue;
    let j = i;
    while (!onHair[(j + 1) % fo.length] && j - i < fo.length) j++;
    if (j - i > best[1] - best[0]) best = [i, j];
    if (j >= fo.length) break;
    i = j;
  }
  const jaw = [];
  for (let k = best[0]; k <= best[1]; k++) jaw.push(fo[k % fo.length]);
  // 顺时针：下巴那段从右边上端走到左边上端
  const E1 = jaw[jaw.length - 1];
  const E0 = jaw[0];
  const fw = fb[2] - fb[0];
  const chin = Math.max(...jaw.map((p) => p[1]));
  const top = chin - 1.2 * fw;
  // 圆顶：左上端 → 头顶 → 右上端（三次曲线，两头竖直）
  const domeN = 40;
  const [L, R] = E1[0] < E0[0] ? [E1, E0] : [E0, E1];
  const h = (Math.min(L[1], R[1]) - top) / 0.75;
  const bez = (a, b, c, d, t) => [0, 1].map((k) => (1 - t) ** 3 * a[k] + 3 * (1 - t) ** 2 * t * b[k] + 3 * (1 - t) * t * t * c[k] + t ** 3 * d[k]);
  const from = jaw[jaw.length - 1];
  const to = jaw[0];
  const dome = Array.from({ length: domeN - 1 }, (_, i) => bez(from, [from[0], from[1] - h], [to[0], to[1] - h], to, (i + 1) / domeN));
  const faceFull = smoothLoop([...jaw, ...dome], 1.5);
  const faceFullM = mask(W, H, (x, y) => inside(faceFull, x, y));

  // 头发后面那片：头发 ∪ 脸在嘴上面的那块，填洞，外轮廓
  const yCut = (eyes[0].box[3] + mouth.box[1]) / 2;
  const backM = fillHoles(or(dilate(hair, 1), and(faceFullM, mask(W, H, (x, y) => y < yCut))));
  const back = smoothLoop(outline(components(backM)[0].mask), 1.5);
  // 刘海：头发 ∩ 脸的整圈（往外扩一点盖住脸的描边）
  const fringeM = and(dilate(hair, 1), dilate(faceFullM, 2));
  const fringe = smoothLoop(outline(components(fringeM)[0].mask), 1.5);

  const earLines = ears.map((c) => smoothLoop(outline(dilate(c.mask, 3)), 1.5));
  const eyeBox = (c) => {
    const [x0, y0, x1, y1] = c.box;
    return { cx: (x0 + x1 + 1) / 2, cy: (y0 + y1 + 1) / 2, rx: (x1 - x0 + 1) / 2 + 0.5, ry: (y1 - y0 + 1) / 2 + 0.5 };
  };
  const ends = (c) => {
    const pts = [];
    for (let i = 0; i < W * H; i++) if (c.mask.m[i]) pts.push([i % W, (i / W) | 0]);
    const l = pts.reduce((a, p) => (p[0] < a[0] ? p : a));
    const r = pts.reduce((a, p) => (p[0] > a[0] ? p : a));
    const mid = pts.filter((p) => Math.abs(p[0] - (l[0] + r[0]) / 2) < 1.5).reduce((a, p) => (p[1] > a[1] ? p : a), [0, -1]);
    return [l, mid[1] >= 0 ? mid : [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2], r].map(([x, y]) => [x + 0.5, y + 0.5]);
  };
  // 脖子中心：对齐用（参考图 neckRow 那一行，下巴描边下面；主角的脖子在线稿 y 278–288 是直的）
  // 脖子一边有阴影（不算皮肤色），量皮肤会偏：从脖子盒子的中间往两边找描边（最深的那几格）
  const row = C.neckRow;
  const mid = Math.round((neck.box[0] + neck.box[2]) / 2);
  const isInk = (x) => sum(px(x, row)) < 300;
  let l = mid;
  while (l > xa && !isInk(l)) l--;
  let r = mid;
  while (r < xb - 1 && !isInk(r)) r++;
  const neckC = (l + r + 1) / 2;
  if (DEBUG)
    debugPNG(path.join(DEBUG_DIR, `${who}-${view}.png`), W, H, [
      [backM, [200, 190, 230]],
      [faceFullM, [250, 220, 200]],
      [fringeM, [120, 80, 60]],
    ]);
  return { face: faceFull, ears: earLines, eyes: eyes.map(eyeBox), nose: ends(nose), mouth: ends(mouth), back, fringe, neckC, fb };
}
function inside(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// ——— 参考图像素 → 线稿坐标 ———
const NECK_SVG = { front: 229.5, side: (202.8 + 233.3) / 2 };
const toSvg = (view, neckC) => ([x, y]) => [NECK_SVG[view] + (x - neckC) * K, 141.43 + (y - C.lines[0]) * K];

/** 折线 → SVG 路径（闭合的用 Catmull-Rom 转三次曲线，大约每 step 个线稿单位一个节点，好在编辑器里改） */
function pathD(pts, closed, step = 5) {
  const L = pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  const n = Math.max(closed ? 6 : 2, Math.round(L / step));
  const q = resampleLoop(pts, n, closed);
  const f = (v) => v.toFixed(2);
  if (q.length === 2 || (!closed && q.length < 3)) return `M${f(q[0][0])},${f(q[0][1])} L${q.slice(1).map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}`;
  const at = (i) => q[closed ? (i + q.length) % q.length : Math.max(0, Math.min(q.length - 1, i))];
  let d = `M${f(q[0][0])},${f(q[0][1])}`;
  const last = closed ? q.length : q.length - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return closed ? d + " Z" : d;
}
const ellipseD = (e, map) => {
  const pts = Array.from({ length: 24 }, (_, i) => [e.cx + e.rx * Math.cos((i / 24) * Math.PI * 2), e.cy + e.ry * Math.sin((i / 24) * Math.PI * 2)]).map(map);
  return pathD(pts, true, 3);
};

const STYLE = 'fill="#00a0ff" fill-opacity="0.07" stroke="#0060c0" stroke-opacity="0.8"';
function pathsFor(view) {
  const t = trace(view);
  const map = toSvg(view, t.neckC);
  const P = (id, pts, closed, step) => `  <path id="${id}" d="${pathD(pts.map(map), closed, step)}" ${STYLE}/>`;
  const out = [P("hair-back", t.back, true, 4), P("fringe", t.fringe, true, 3), P("face", t.face, true, 5)];
  // 耳朵：正面按左右，3/4 只有近处那只（画面右）
  t.ears.sort((a, b) => a[0][0] - b[0][0]);
  if (view === "front") {
    out.push(P("ear-l", t.ears[0], true, 3), P("ear-r", t.ears[t.ears.length - 1], true, 3));
  } else out.push(P("ear-r", t.ears[t.ears.length - 1], true, 3));
  // 眼睛：画面左那只是 eye-l
  out.push(`  <path id="eye-l" d="${ellipseD(t.eyes[0], map)}" ${STYLE}/>`, `  <path id="eye-r" d="${ellipseD(t.eyes[t.eyes.length - 1], map)}" ${STYLE}/>`);
  out.push(P("nose", t.nose, false, 1), P("mouth", t.mouth, false, 2));
  console.error(view, "脖子中心（参考图）", t.neckC, "眼睛", t.eyes.length, "耳朵", t.ears.length);
  return out.join("\n");
}

// 写进 SVG 的「身体」图层（原来这一层里的线整个换掉；文件由 线稿生成.mjs 先生成）。--debug 只出调试图、不写
if (DEBUG) for (const v of ["front", "side"]) pathsFor(v);
else for (const [view, file, layer] of [
  ["front", `${who}-线稿.svg`, "body"],
  ["side", `${who}-侧面线稿.svg`, "side-body"],
]) {
  const f = path.join(root, "public/ref", file);
  const svg = fs.readFileSync(f, "utf8");
  const re = new RegExp(`(<g class="layer" id="${layer}"[^>]*>\\s*<title>[^<]*</title>)[\\s\\S]*?(\\n </g>)`);
  if (!re.test(svg)) throw new Error(file + " 里没有图层 " + layer);
  fs.writeFileSync(f, svg.replace(re, `$1\n${pathsFor(view)}$2`));
  console.error("写好", file);
}
