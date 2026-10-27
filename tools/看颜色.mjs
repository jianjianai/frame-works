// 看参考图一块地方有哪些颜色（给 描图.mjs 定头发、皮肤的颜色范围用）。
// 用法（在作品文件夹里）：node <工具目录>/看颜色.mjs <参考图> <x0> <y0> <x1> <y1> [x,y …]
//   打出这块里最多的 24 种颜色（每个通道按 16 取整，后面是像素数），再打出后面给的几个点的颜色。
//   例：node ../../.materials/剪纸角色/tools/看颜色.mjs public/ref/比例参考-小孩.png 50 165 240 335 140,190 140,280
import { loadImage } from "./描图工具.mjs";

const [file, ...rest] = process.argv.slice(2);
const [x0, y0, x1, y1] = rest.slice(0, 4).map(Number);
if (!file || [x0, y0, x1, y1].some((v) => !Number.isFinite(v))) throw new Error("用法：node <工具目录>/看颜色.mjs <参考图> <x0> <y0> <x1> <y1> [x,y …]");
const { px } = await loadImage(file);
const hist = new Map();
for (let y = y0; y < y1; y++)
  for (let x = x0; x < x1; x++) {
    const k = px(x, y).map((v) => (v >> 4) << 4).join(",");
    hist.set(k, (hist.get(k) ?? 0) + 1);
  }
console.log([...hist].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([k, v]) => `${k}:${v}`).join("  "));
for (const s of rest.slice(4)) {
  const [x, y] = s.split(",").map(Number);
  console.log(`(${x}, ${y})`, px(x, y).join(", "));
}
