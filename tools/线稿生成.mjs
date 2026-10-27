// 生成配角的线稿底稿：作品的 public/ref/<角色>-线稿.svg（正面）、<角色>-侧面线稿.svg（3/4 朝左）。
// 用法（在作品文件夹 projects/<名称>/ 里）：node <工具目录>/线稿生成.mjs <角色> <底图目录>
//   （SVG 已经有了时只换「现在的样子」那张对照图，画好的线不动）。角色的配置在作品的 production/线稿配置.mjs（ref、lines、views）。
//   底图目录里放 front-white.png / front-black.png / side-white.png / side-black.png：样片 sheets/_<角色>底图.ts
//   （素材库 code/linebase.ts）按线稿坐标画两倍大的现在的样子，白底、黑底各一张，这里两张一比算出透明底。
// 坐标和主角的线稿（作品 5b227852 的 秤砣-线稿.svg）完全一样：460×820，
//   身体 ((X − 229.5)·0.905, (Y − 463.8)·0.905)，头顶 141.43、下巴 276.28、地面 772。
// 参考图和主角共用一套横线（头顶、膝两条，参考图像素各张不同），按这两条对到线稿；横着按 views 的 cx 对到 x0。
import fs from "node:fs";
import path from "node:path";
import { WORK, configOf, sharp } from "./描图工具.mjs";

const who = process.argv[2];
const dir = process.argv[3];
const cfg = await configOf(dir ? who : undefined, "用法：node <工具目录>/线稿生成.mjs <角色> <底图目录>");
const root = WORK;
const REF = path.join(root, cfg.ref);
const K = (600 - 141.43) / (cfg.lines[1] - cfg.lines[0]);
const OY = 141.43 - cfg.lines[0] * K;
const VIEWS = cfg.views;

/** 白底、黑底两张 → 透明底 PNG（base64） */
async function matte(view) {
  const read = (f) => sharp(path.join(dir, `${view}-${f}.png`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const [w, b] = await Promise.all([read("white"), read("black")]);
  const { width, height } = w.info;
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    let d = 0;
    for (let c = 0; c < 3; c++) d += w.data[i * 3 + c] - b.data[i * 3 + c];
    const a = Math.max(0, Math.min(1, 1 - d / 3 / 255));
    for (let c = 0; c < 3; c++) out[i * 4 + c] = a > 0 ? Math.min(255, Math.round(b.data[i * 3 + c] / a)) : 0;
    out[i * 4 + 3] = Math.round(a * 255);
  }
  const png = await sharp(out, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
  return png.toString("base64");
}

/** 参考图裁出这个人 → JPEG（base64）和它在线稿里的位置 */
async function refCrop(view) {
  const { cx, crop, x0 = 229.5 } = VIEWS[view];
  const meta = await sharp(REF).metadata();
  const h = Math.min(meta.height, 940);
  const jpg = await sharp(REF).extract({ left: crop[0], top: 0, width: crop[1] - crop[0], height: h }).flatten({ background: "#ffffff" }).jpeg({ quality: 88 }).toBuffer();
  return {
    data: jpg.toString("base64"),
    x: +(x0 - (cx - crop[0]) * K).toFixed(2),
    y: +OY.toFixed(2),
    w: +((crop[1] - crop[0]) * K).toFixed(2),
    h: +(h * K).toFixed(2),
  };
}

const GUIDES = [
  [141.43, "头顶"],
  [232.05, "眼睛"],
  [276.28, "下巴"],
  [306, "肩关节"],
  [463.8, "胯关节"],
  [600, "膝"],
  [701.5, "脚踝"],
  [772, "地面"],
];
const guides = () =>
  [
    `  <line x1="229.5" x2="229.5" y1="120" y2="790" stroke="#2f7de1" stroke-opacity="0.25" stroke-dasharray="2,4" stroke-width="0.6"/>`,
    ...GUIDES.flatMap(([y, t]) => [
      `  <line x1="10" x2="450" y1="${y}" y2="${y}" stroke="#2f7de1" stroke-opacity="0.35" stroke-dasharray="4,4" stroke-width="0.8"/>`,
      `  <text x="12" y="${(y - 2).toFixed(2)}" fill="#2f7de1" fill-opacity="0.6" font-size="8" font-family="sans-serif">${t}</text>`,
    ]),
  ].join("\n");

async function build(view) {
  const ref = await refCrop(view);
  const now = await matte(view);
  const front = view === "front";
  const name = front ? "正面" : "侧面（3/4 朝画面左）";
  const p = front ? "" : "side-";
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="460" height="820">
 <!-- ${who}${name}线稿：坐标和主角的《秤砣-线稿.svg》${front ? "" : "《秤砣-侧面线稿.svg》"}完全一样，
      身体 ((X − 229.5)·0.905, (Y − 463.8)·0.905)，头顶 141.43、下巴 276.28、地面 772（对齐线是主角的高度）。
      图层：参考图（背景）→ 对齐线 → 现在的${who}（对照，默认隐藏）→ ${front ? `${who}·头部 → ${who}·身体` : "侧面·头部 → 侧面·身体"}（在这里画）。
      由素材库「剪纸角色」tools/线稿生成.mjs 生成。 -->
 <g class="layer" id="ref">
  <title>参考图（背景：比例参考-男人的${front ? "正面" : " 3/4"}）</title>
  <image id="ref-image" x="${ref.x}" y="${ref.y}" width="${ref.w}" height="${ref.h}" opacity="0.45" preserveAspectRatio="none" xlink:href="data:image/jpeg;base64,${ref.data}"/>
 </g>
 <g class="layer" id="guides">
  <title>对齐线（主角的高度）</title>
${guides()}
 </g>
 <g class="layer" id="now" style="display:none">
  <title>现在的${who}（对照，默认隐藏）</title>
  <image id="now-image" x="0" y="0" width="460" height="820" opacity="0.6" preserveAspectRatio="none" xlink:href="data:image/png;base64,${now}"/>
 </g>
 <g class="layer" id="${p}head">
  <title>${front ? `${who}·头部` : "侧面·头部"}（在这里画）</title>
 </g>
 <g class="layer" id="${p}body">
  <title>${front ? `${who}·身体` : "侧面·身体"}（在这里画）</title>
 </g>
</svg>
`;
}

// 文件已经有了（画过线）：只换「现在的样子」那张图，别的一概不动
for (const [view, file] of [["front", `${who}-线稿.svg`], ["side", `${who}-侧面线稿.svg`]]) {
  const out = path.join(root, "public/ref", file);
  if (fs.existsSync(out)) {
    const old = fs.readFileSync(out, "utf8");
    const now = await matte(view);
    const re = /(<image id="now-image"[^>]*?xlink:href=")data:image\/png;base64,[^"]*"/;
    if (!re.test(old)) throw new Error(file + " 里没找到 now-image");
    const next = old.replace(re, `$1data:image/png;base64,${now}"`);
    fs.writeFileSync(out, next);
  } else fs.writeFileSync(out, await build(view));
  console.log(out, fs.statSync(out).size);
}
