// 配角线稿工具的通用部分：sharp、作品文件夹和配置；从平涂的参考图里按颜色描出轮廓线：分色得到二值图（mask）→ 形态学处理、
// 连通块 → 沿边界描一圈 → 顺滑。给 线稿生成.mjs、描图.mjs、看颜色.mjs、线稿叠图.mjs 用。坐标都是参考图像素（x 往右、y 往下）。
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** 作品文件夹：工具都在作品文件夹（projects/<名称>/）里运行，参考图、线稿 SVG、配置都按它找 */
export const WORK = process.cwd();
/** sharp：从作品往上找 node_modules（作品库根目录链接了引擎的 node_modules），找不到再用 FRAME 服务器上的 */
export const sharp = await (async () => {
  try {
    return createRequire(path.join(WORK, "_.js"))("sharp");
  } catch {
    return (await import("/app/node_modules/.pnpm/sharp@0.35.4_@types+node@26.6.3/node_modules/sharp/dist/index.mjs")).default;
  }
})();
/** 作品的配置 production/线稿配置.mjs：{ <角色>: { ref, lines, views, trace?, art? } } */
export async function loadConfig() {
  const f = path.join(WORK, "production/线稿配置.mjs");
  if (!fs.existsSync(f)) throw new Error(`在作品文件夹里运行（现在是 ${WORK}），作品里要有 production/线稿配置.mjs（写法见素材库「剪纸角色」README 的「配角线稿工具」）`);
  return (await import(pathToFileURL(f).href)).default;
}
/** 这个角色的配置；没有就报错并列出有的 */
export async function configOf(who, usage) {
  const all = await loadConfig();
  if (!who || !all[who]) throw new Error(`${usage}\n角色（production/线稿配置.mjs 里有的）：${Object.keys(all).join("、")}`);
  return all[who];
}

export async function loadImage(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  return { W, H, px: (x, y) => [data[(y * W + x) * 3], data[(y * W + x) * 3 + 1], data[(y * W + x) * 3 + 2]] };
}

/** 一张二值图：W×H，m[y*W+x] 为 1 是选中 */
export const mask = (W, H, fn) => {
  const m = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) m[y * W + x] = fn(x, y) ? 1 : 0;
  return { W, H, m };
};
const disk = (r) => {
  const o = [];
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r + r * 0.5) o.push([dx, dy]);
  return o;
};
export function dilate(a, r) {
  const { W, H, m } = a;
  const out = new Uint8Array(W * H);
  const k = disk(r);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!m[y * W + x]) continue;
      for (const [dx, dy] of k) {
        const X = x + dx;
        const Y = y + dy;
        if (X >= 0 && Y >= 0 && X < W && Y < H) out[Y * W + X] = 1;
      }
    }
  return { W, H, m: out };
}
export function erode(a, r) {
  const inv = { W: a.W, H: a.H, m: a.m.map((v) => 1 - v) };
  const d = dilate(inv, r);
  return { W: a.W, H: a.H, m: d.m.map((v) => 1 - v) };
}
export const close = (a, r) => erode(dilate(a, r), r);
export const open = (a, r) => dilate(erode(a, r), r);
export const and = (a, b) => ({ W: a.W, H: a.H, m: a.m.map((v, i) => v & b.m[i]) });
export const or = (a, b) => ({ W: a.W, H: a.H, m: a.m.map((v, i) => v | b.m[i]) });
export const not = (a) => ({ W: a.W, H: a.H, m: a.m.map((v) => 1 - v) });
export const count = (a) => a.m.reduce((s, v) => s + v, 0);

/** 连通块（4 邻接），按面积从大到小：[{ mask, area, box: [x0,y0,x1,y1] }] */
export function components(a) {
  const { W, H, m } = a;
  const lab = new Int32Array(W * H).fill(-1);
  const out = [];
  for (let i = 0; i < W * H; i++) {
    if (!m[i] || lab[i] >= 0) continue;
    const id = out.length;
    const stack = [i];
    lab[i] = id;
    const pix = [];
    let x0 = W;
    let y0 = H;
    let x1 = 0;
    let y1 = 0;
    while (stack.length) {
      const j = stack.pop();
      pix.push(j);
      const x = j % W;
      const y = (j / W) | 0;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx;
        const Y = y + dy;
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const k = Y * W + X;
        if (m[k] && lab[k] < 0) {
          lab[k] = id;
          stack.push(k);
        }
      }
    }
    const cm = new Uint8Array(W * H);
    for (const j of pix) cm[j] = 1;
    out.push({ mask: { W, H, m: cm }, area: pix.length, box: [x0, y0, x1, y1] });
  }
  return out.sort((p, q) => q.area - p.area);
}
/** 填洞：从边上灌进来的背景以外都算里面 */
export function fillHoles(a) {
  const inv = not(a);
  const { W, H } = a;
  const seen = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) for (const y of [0, H - 1]) if (inv.m[y * W + x]) stack.push(y * W + x);
  for (let y = 0; y < H; y++) for (const x of [0, W - 1]) if (inv.m[y * W + x]) stack.push(y * W + x);
  for (const i of stack) seen[i] = 1;
  while (stack.length) {
    const j = stack.pop();
    const x = j % W;
    const y = (j / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx;
      const Y = y + dy;
      if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const k = Y * W + X;
      if (inv.m[k] && !seen[k]) {
        seen[k] = 1;
        stack.push(k);
      }
    }
  }
  return { W, H, m: seen.map((v) => 1 - v) };
}

/**
 * 一个连通块的外轮廓（marching squares，顶点在像素边的中点上），顺时针（y 朝下），首尾不重复。
 * 只走最外面那一圈：先填洞。
 */
export function outline(a) {
  const f = fillHoles(a);
  const { W, H, m } = f;
  const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? m[y * W + x] : 0);
  // 找最上面一行最左的点，从它左上角的格子出发
  let sx = -1;
  let sy = -1;
  for (let y = 0; y < H && sx < 0; y++)
    for (let x = 0; x < W; x++)
      if (m[y * W + x]) {
        sx = x;
        sy = y;
        break;
      }
  // 格点 (gx, gy) 是像素 (gx-1..gx, gy-1..gy) 四个的公共角；沿边走，左手边是外面
  const pts = [];
  let gx = sx;
  let gy = sy;
  let dir = 0; // 0 右 1 下 2 左 3 上
  const D = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const start = [gx, gy, dir];
  for (let n = 0; n < W * H * 4; n++) {
    pts.push([gx, gy]);
    // 当前格点四周：a 左上 b 右上 c 左下 d 右下
    const nx = gx + D[dir][0];
    const ny = gy + D[dir][1];
    gx = nx;
    gy = ny;
    const A = at(gx - 1, gy - 1);
    const B = at(gx, gy - 1);
    const C = at(gx - 1, gy);
    const Dd = at(gx, gy);
    // 右手是里面：按走向看前左、前右两个像素决定转向
    const cell = { 0: [B, Dd], 1: [Dd, C], 2: [C, A], 3: [A, B] }[dir];
    const [leftPx, rightPx] = cell;
    if (rightPx && !leftPx) {
      // 直走
    } else if (leftPx) dir = (dir + 3) % 4; // 左转
    else dir = (dir + 1) % 4; // 右转
    if (gx === start[0] && gy === start[1] && dir === start[2]) break;
  }
  return pts;
}

/** 沿闭合折线做高斯平滑（sigma 以点数计） */
export function smoothLoop(pts, sigma = 2, closed = true) {
  const n = pts.length;
  const r = Math.ceil(sigma * 3);
  const w = Array.from({ length: 2 * r + 1 }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)));
  return pts.map((_, i) => {
    let sx = 0;
    let sy = 0;
    let sw = 0;
    for (let k = -r; k <= r; k++) {
      let j = i + k;
      if (closed) j = (j + n) % n;
      else if (j < 0 || j >= n) continue;
      sx += pts[j][0] * w[k + r];
      sy += pts[j][1] * w[k + r];
      sw += w[k + r];
    }
    return [sx / sw, sy / sw];
  });
}
/** 按弧长取 n 个点（closed：首尾相接、不重复） */
export function resampleLoop(pts, n, closed = true) {
  const P = closed ? [...pts, pts[0]] : pts;
  const d = [0];
  for (let i = 1; i < P.length; i++) d.push(d[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = d[d.length - 1];
  const out = [];
  const m = closed ? n : n - 1;
  let j = 0;
  for (let k = 0; k < n; k++) {
    const t = (L * k) / m;
    while (j < d.length - 2 && d[j + 1] < t) j++;
    const u = (t - d[j]) / (d[j + 1] - d[j] || 1);
    out.push([P[j][0] + (P[j + 1][0] - P[j][0]) * u, P[j][1] + (P[j + 1][1] - P[j][1]) * u]);
  }
  return out;
}
/** 调试：把几张二值图叠成一张彩色 PNG */
export async function debugPNG(file, W, H, layers) {
  const buf = Buffer.alloc(W * H * 3, 255);
  for (const [a, rgb] of layers)
    for (let i = 0; i < W * H; i++)
      if (a.m[i]) {
        buf[i * 3] = rgb[0];
        buf[i * 3 + 1] = rgb[1];
        buf[i * 3 + 2] = rgb[2];
      }
  await sharp(buf, { raw: { width: W, height: H, channels: 3 } }).png().toFile(file);
}
