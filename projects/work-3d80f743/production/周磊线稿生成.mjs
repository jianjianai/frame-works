// 生成给用户手画的周磊线稿底稿：public/ref/周磊-线稿.svg（正面）、周磊-侧面线稿.svg（3/4 朝左）。
// 用法：node production/周磊线稿生成.mjs <底图目录>（SVG 已经有了时只换「现在的周磊」那张对照图，用户画的线不动）
//   底图目录里放 front-white.png / front-black.png / side-white.png / side-black.png：
//   临时样片（sheets/_周磊底图.ts）按线稿坐标画两倍大的现在的周磊，白底、黑底各一张，这里两张一比算出透明底。
// 坐标和主角的线稿（作品 5b227852 的 秤砣-线稿.svg）完全一样：460×820，
//   身体 ((X − 229.5)·0.905, (Y − 463.8)·0.905)，头顶 141.43、下巴 276.28、地面 772。
// 参考图 public/ref/比例参考-男人.png 和主角共用一套横线（头顶 158、膝 692，参考图像素），按这两条对到线稿：×0.8588。
import fs from "node:fs";
import path from "node:path";
import sharp from "/app/node_modules/.pnpm/sharp@0.35.4_@types+node@26.6.3/node_modules/sharp/dist/index.mjs";

const dir = process.argv[2];
const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const REF = path.join(root, "public/ref/比例参考-男人.png");
const K = (600 - 141.43) / (692 - 158);
const OY = 141.43 - 158 * K;
// 参考图里正面、3/4 两个人的中心（参考图像素）和裁切的左右
const VIEWS = {
  front: { cx: 138, crop: [0, 268] },
  side: { cx: 372, crop: [268, 495] },
};

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
  const { cx, crop } = VIEWS[view];
  const meta = await sharp(REF).metadata();
  const h = Math.min(meta.height, 940);
  const jpg = await sharp(REF).extract({ left: crop[0], top: 0, width: crop[1] - crop[0], height: h }).flatten({ background: "#ffffff" }).jpeg({ quality: 88 }).toBuffer();
  return {
    data: jpg.toString("base64"),
    x: +(229.5 - (cx - crop[0]) * K).toFixed(2),
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
 <!-- 周磊${name}线稿（用户手画，AI 照着改代码）：坐标和主角的《秤砣-线稿.svg》${front ? "" : "《秤砣-侧面线稿.svg》"}完全一样，
      身体 ((X − 229.5)·0.905, (Y − 463.8)·0.905)，头顶 141.43、下巴 276.28、地面 772（对齐线是主角的高度）。
      图层：参考图（背景）→ 对齐线 → 现在的周磊（对照，默认隐藏）→ ${front ? "周磊·头部 → 周磊·身体" : "侧面·头部 → 侧面·身体"}（在这里画）。
      由 production/周磊线稿生成.mjs 生成。 -->
 <g class="layer" id="ref">
  <title>参考图（背景：比例参考-男人的${front ? "正面" : " 3/4"}）</title>
  <image id="ref-image" x="${ref.x}" y="${ref.y}" width="${ref.w}" height="${ref.h}" opacity="0.45" preserveAspectRatio="none" xlink:href="data:image/jpeg;base64,${ref.data}"/>
 </g>
 <g class="layer" id="guides">
  <title>对齐线（主角的高度）</title>
${guides()}
 </g>
 <g class="layer" id="now" style="display:none">
  <title>现在的周磊（对照，默认隐藏）</title>
  <image id="now-image" x="0" y="0" width="460" height="820" opacity="0.6" preserveAspectRatio="none" xlink:href="data:image/png;base64,${now}"/>
 </g>
 <g class="layer" id="${p}head">
  <title>${front ? "周磊·头部" : "侧面·头部"}（在这里画）</title>
 </g>
 <g class="layer" id="${p}body">
  <title>${front ? "周磊·身体" : "侧面·身体"}（在这里画）</title>
 </g>
</svg>
`;
}

// 文件已经有了（用户画过）：只换「现在的周磊」那张图，别的一概不动
for (const [view, file] of [["front", "周磊-线稿.svg"], ["side", "周磊-侧面线稿.svg"]]) {
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
