// 没有自己参考图的配角：给他新建一对线稿 SVG（public/ref/<角色>-线稿.svg、-侧面线稿.svg），用来照「光头底图」分层画头发
// （用户 2026-10-29：千斤、阿满、年轻人、大叔、女学生、沉沉的妈妈、七岁的沉沉、路人「头看起来很长像是大头娃娃」）。
// 用法（在作品文件夹里）：node production/头部底稿.mjs <角色> <借谁的脸：主角|周磊|千斤的妈妈|老钟|小石头的妈妈>
// - 参考图层：production/光头底图/<脸>.png（sheets/_光头底图.ts 按线稿坐标画的两倍大、不画头发的头，左正面、右 3/4，各 480×640，
//   是线稿 X 120–360、Y 100–420 那一块）；3/4 那张按 figure.ts 的 headDx（头往后挪）挪回来，和线稿坐标对齐。
// - 身体图层：借来的脸（素材库里的 FaceView 常量换回线稿坐标）：face、ear-l/ear-r、eye-l/eye-r、nose、mouth，线稿换算.mjs 的
//   刘海上沿抬高（liftTops）要用 face 和眼睛。头发图层由 素材库 tools/头发描点.mjs 写。
// 文件已经有了就只换参考图层和身体图层，头发图层不动。
import fs from "node:fs";
import path from "node:path";

const [who, faceKey] = process.argv.slice(2);
const L = "/data/libraries/frame-works/剪纸角色/code/";
const K = 0.905;
const Y0 = 463.8 + (-162.7 - 55) / K;
const X0 = { front: 229.5, side: 229.5 + (10 * Math.sin(-0.7) + 8) / K };

// ——— 读素材库里的脸 ———
const grabArr = (src, at) => {
  const a = src.indexOf("[", src.indexOf("=", at));
  let d = 0;
  let j = a;
  for (; j < src.length; j++) {
    if (src[j] === "[") d++;
    else if (src[j] === "]" && !--d) break;
  }
  return new Function(`return (${src.slice(a, j + 1).replace(/ as V2/g, "")})`)();
};
function facesOf(key) {
  if (key === "主角") {
    const fig = fs.readFileSync(L + "figure.ts", "utf8");
    const side = fs.readFileSync(L + "figure-side.ts", "utf8");
    const curve = grabArr(fig, fig.indexOf("const FACE_CURVE"));
    const left = [...curve].reverse().map(([x, y]) => [-x, y]);
    const sideIris = side.slice(side.indexOf("export const SIDE_IRIS"));
    const num = (re) => sideIris.match(re).slice(1).map(Number);
    const [rx0, ry0, rrx, rry] = num(/R: \{ c: \[(-?[\d.]+), (-?[\d.]+)\] as V2, rx: ([\d.]+), ry: ([\d.]+)/);
    const [lx0, ly0, lrx, lry] = num(/L: \{ c: \[(-?[\d.]+), (-?[\d.]+)\] as V2, rx: ([\d.]+), ry: ([\d.]+)/);
    const sm = grabArr(side, side.indexOf("export const SIDE_MOUTH"));
    const sn = grabArr(side, side.indexOf("export const SIDE_NOSE"));
    return {
      front: {
        face: [...curve, ...left.slice(1)],
        iris: { R: { c: [-20.52, 7.97], rx: 6.97, ry: 9.96 }, L: { c: [20.52, 7.97], rx: 6.97, ry: 9.96 } },
        nose: [[0.3, 19.1], [0.5, 20.9], [0, 22]],
        mouth: [[-7.32, 32], [7.32, 32]],
        ears: { L: grabArr(fig, fig.indexOf("const EAR_L")), R: grabArr(fig, fig.indexOf("const EAR_R")) },
      },
      side: {
        face: grabArr(side, side.indexOf("export const SIDE_FACE")),
        iris: { R: { c: [rx0, ry0], rx: rrx, ry: rry }, L: { c: [lx0, ly0], rx: lrx, ry: lry } },
        nose: [sn[0], sn[3], sn[6]],
        mouth: [sm[0], sm[sm.length - 1]],
        ears: {},
      },
    };
  }
  const files = { 周磊: ["cast-face-art.ts", "ZHOULEI"], 千斤的妈妈: ["cast-qinmom-art.ts", "QINMOM"], 老钟: ["cast-oldzhong-art.ts", "OLDZHONG"], 小石头的妈妈: ["cast-shitoumom-art.ts", "SHITOUMOM"] };
  const [f, pre] = files[key];
  const s = fs.readFileSync(L + f, "utf8");
  const view = (v) => {
    const i = s.indexOf(`export const ${pre}_FACE${v}`);
    const body = s.slice(s.indexOf("{", i), s.indexOf("\n  };", i) + 4).replace(/ as V2\[\]| as V2/g, "");
    return new Function(`return (${body})`)();
  };
  return { front: view("0"), side: view("3") };
}

// ——— 3/4 的头往后挪多少（figure.ts 的 headDx3：按脸的前沿对到主角） ———
function bez(pts, n = 16) {
  const o = [pts[0]];
  for (let i = 0; i + 3 < pts.length; i += 3) {
    const [a, b, c, d] = pts.slice(i, i + 4);
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const u = 1 - t;
      o.push([0, 1].map((j) => u * u * u * a[j] + 3 * u * u * t * b[j] + 3 * u * t * t * c[j] + t * t * t * d[j]));
    }
  }
  return o;
}
function rowLeft(p, y) {
  const xs = [];
  for (let i = 0; i < p.length; i++) {
    const [a, b] = [p[i], p[(i + 1) % p.length]];
    if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) xs.push(a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]));
  }
  return xs.length ? Math.min(...xs) : undefined;
}
function profileX(face) {
  const p = bez(face);
  const yb = Math.max(...p.map((q) => q[1]));
  const chin = p.filter((q) => q[1] > yb - 1.5);
  const cx = chin.reduce((a, q) => a + q[0], 0) / chin.length;
  return ((rowLeft(p, 9) ?? cx) + (rowLeft(p, 30) ?? cx) + cx) / 3;
}
export function headDxOf(key) {
  if (key === "主角") return 0;
  return profileX(facesOf("主角").side.face) - profileX(facesOf(key).side.face);
}

// ——— SVG ———
const f2 = (v) => +v.toFixed(2);
const toL = (view) => ([x, y]) => [f2(x / K + X0[view]), f2(y / K + Y0)];
const cubic = (pts, map, close = true) => {
  const q = pts.map(map);
  let d = `M${q[0].join(",")}`;
  for (let i = 1; i + 2 < q.length; i += 3) d += ` C${q[i].join(",")} ${q[i + 1].join(",")} ${q[i + 2].join(",")}`;
  return d + (close ? " Z" : "");
};
const ellipse = ({ c, rx, ry }, map) => {
  const k = 0.5523;
  const [x, y] = c;
  const pts = [
    [x + rx, y], [x + rx, y + ry * k], [x + rx * k, y + ry], [x, y + ry], [x - rx * k, y + ry], [x - rx, y + ry * k], [x - rx, y],
    [x - rx, y - ry * k], [x - rx * k, y - ry], [x, y - ry], [x + rx * k, y - ry], [x + rx, y - ry * k], [x + rx, y],
  ];
  return cubic(pts, map);
};
const LINE = 'fill="none" stroke="#000000" stroke-width="1"';
function bodyLayer(fv, view) {
  const map = toL(view);
  const p = (id, d) => `\n  <path id="${id}" d="${d}" ${LINE}/>`;
  let s = p("face", cubic(fv.face, map));
  if (view === "front") {
    if (fv.ears?.L) s += p("ear-l", cubic(fv.ears.L, map));
    if (fv.ears?.R) s += p("ear-r", cubic(fv.ears.R, map));
  } else if (fv.ears?.R) s += p("ear-r", cubic(fv.ears.R, map));
  s += p("eye-l", ellipse(fv.iris.R, map)) + p("eye-r", ellipse(fv.iris.L, map));
  const n = fv.nose.map(map);
  s += p("nose", `M${n[0].join(",")} Q${n[1].join(",")} ${n[2].join(",")}`);
  const m = fv.mouth.map(map);
  s += p("mouth", `M${m[0].join(",")} L${m[1].join(",")}`);
  return s;
}

const guides = fs.readFileSync("public/ref/千斤的妈妈-线稿.svg", "utf8").match(/ <g class="layer" id="guides">[\s\S]*?\n <\/g>/)[0];
const base = fs.readFileSync(`production/光头底图/${faceKey}.png`);
const sharp = (await import("/data/libraries/frame-works/剪纸角色/tools/描图工具.mjs")).sharp;
const faces = facesOf(faceKey);
const dx = headDxOf(faceKey) / K;
for (const view of ["front", "side"]) {
  const crop = await sharp(base).extract({ left: view === "front" ? 0 : 480, top: 0, width: 480, height: 640 }).png().toBuffer();
  const imgX = view === "front" ? 120 : 120 - dx;
  const pre = view === "side" ? "side-" : "";
  const file = path.join("public/ref", `${who}-${view === "front" ? "线稿" : "侧面线稿"}.svg`);
  const refLayer = ` <g class="layer" id="ref">\n  <title>参考图（背景：不画头发的头，${faceKey}的脸，sheets/_光头底图.ts）</title>\n  <image id="ref-image" x="${f2(imgX)}" y="100" width="240" height="320" opacity="0.5" preserveAspectRatio="none" xlink:href="data:image/png;base64,${crop.toString("base64")}"/>\n </g>`;
  const body = ` <g class="layer" id="${pre}body">\n  <title>${who}·脸（借${faceKey}的，只当参考，换算只取头发）</title>${bodyLayer(faces[view], view)}\n </g>`;
  if (fs.existsSync(file)) {
    let s = fs.readFileSync(file, "utf8");
    s = s.replace(/ <g class="layer" id="ref">[\s\S]*?\n <\/g>/, refLayer).replace(new RegExp(` <g class="layer" id="${pre}body">[\\s\\S]*?\\n <\\/g>`), body);
    fs.writeFileSync(file, s);
    console.log("换了参考图层和身体图层", file);
    continue;
  }
  const s = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="460" height="820">
 <!-- ${who}${view === "front" ? "正面" : "3/4（朝画面左）"}线稿：坐标和主角的《秤砣-线稿.svg》一样，身体 ((X − 229.5)·0.905, (Y − 463.8)·0.905)。
      没有自己的参考图：脸借${faceKey}的，头发照「不画头发的头」分层画（hair-* 图层）。由作品的 production/头部底稿.mjs 生成。 -->
${refLayer}
${guides}
${body}
</svg>
`;
  fs.writeFileSync(file, s);
  console.log("写好", file);
}
console.log("3/4 头往后挪", headDxOf(faceKey).toFixed(2), "（参考图 cx 用", (699 + 2 * dx).toFixed(1), "）");
