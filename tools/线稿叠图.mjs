// 把线稿 SVG 里画的线（洋红）叠在参考图上、或叠在「现在的样子」上，出一张 PNG 看对不对得上（用 Read 看图）。
// 用法（在作品文件夹里）：node <工具目录>/线稿叠图.mjs <角色> <ref|now> [输出目录]
//   ref：参考图 + 线（看描的线贴不贴参考图）；now：现在的样子 + 线（看代码画出来的贴不贴线，先用 线稿生成.mjs 更新对照层）。
//   输出 <角色>-<ref|now>-front.png / -side.png（只裁头到膝那一段，两倍大），默认在系统临时目录 frame-线稿叠图/。
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { WORK, sharp } from "./描图工具.mjs";

const [who, mode, dirArg] = process.argv.slice(2);
if (!who || !["ref", "now"].includes(mode)) throw new Error("用法：node <工具目录>/线稿叠图.mjs <角色> <ref|now> [输出目录]");
const root = WORK;
const outDir = dirArg ?? path.join(os.tmpdir(), "frame-线稿叠图");
fs.mkdirSync(outDir, { recursive: true });
for (const [file, view] of [[`${who}-线稿.svg`, "front"], [`${who}-侧面线稿.svg`, "side"]]) {
  let s = fs.readFileSync(path.join(root, "public/ref", file), "utf8");
  if (mode === "ref") s = s.replace(/(<image id="ref-image"[^>]*?)opacity="[^"]*"/, '$1opacity="0.9"');
  else s = s.replace(/<image id="ref-image"[^>]*\/>/, "").replace(/(<g class="layer" id="now") style="display:none"/, "$1").replace(/(<image id="now-image"[^>]*?)opacity="[^"]*"/, '$1opacity="0.55"');
  // 线一律画成洋红细线、不填色（用户画的是黑描边浅红填，描图.mjs 写的是蓝描边浅蓝填）
  s = s.replace(/<path\b([^>]*)\/>/g, (m, attrs) => {
    const clean = attrs.replace(/\s(fill|fill-opacity|stroke|stroke-opacity|stroke-width)="[^"]*"/g, "");
    return `<path${clean} fill="none" stroke="#e0007a" stroke-width="0.9"/>`;
  });
  const out = path.join(outDir, `${who}-${mode}-${view}.png`);
  await sharp(Buffer.from(s), { density: 144 }).flatten({ background: "#ffffff" }).extract({ left: 160, top: 240, width: 600, height: 1000 }).png().toFile(out);
  console.log(out);
}
