// 照参考图分层画头发（AI 自己画，或者给用户一版初稿）：点写在一个 JSON 里，看叠图、写进线稿 SVG 的头发图层，再用 线稿换算.mjs 换算。
// 在作品文件夹里运行：
//   node <工具目录>/头发描点.mjs 看 <角色> <front|side> X0 Y0 X1 Y1 放大 <输出.png> [点.json]
//     参考图按线稿坐标放大（X0..X1、Y0..Y1 是线稿坐标），叠 5 一格的网格（10 的整数标数）、身体图层里的脸和五官（绿）、描的旧头发（橙），
//     给了点.json 再叠上画的每一块（粗线、点的编号，方框是角点）。用 Read 看 PNG，对着网格读坐标、改点。
//   node <工具目录>/头发描点.mjs 写 <角色> <点.json> [--force]
//     写进 public/ref/<角色>-线稿.svg、-侧面线稿.svg 的头发图层（没有就建；同 id 的先删掉再写，写的线带 data-by="ai"）；身体图层里描的旧头发
//     （hair-back、fringe、hair-数字、hair-tail、hair-tie）第一次写时挪进隐藏图层「描的头发（旧）」，换算就不读它们了。
//     头发图层里已经有用户画的线（没有 data-by="ai" 的）时不写：用户画的不覆盖（真要覆盖加 --force）。
// 点.json：{ "front": { "<id>": { "layer": "hair-back", "pts": [[X, Y], [X, Y, 1], …] } }, "side": { … } }（线稿坐标，顺时针逆时针都行）。
//   第三项 1 是角点（尖、缝的底），其余是顺滑点（按前后两点取切线）。正面和 3/4 的同一块 id 一样、点一样多、从同一个位置起，
//   换算就按顺序一个对一个；做不到的在线稿配置的 art.hairMarks 里写对应（见 头发分层.mjs）。
// layer：hair-bun 发髻（一直在后面那片后面）、hair-back 后面那片、hair-bangs 刘海、hair-lock-l 画面左边的鬓发（3/4 时远处、藏到脸后面）、
//   hair-lock-r 画面右边的鬓发、hair-tail 马尾、hair-tie 发圈。
// 作品 3d80f743 的 production/头发描点/ 是例子（老钟、千斤的妈妈、周磊、小石头，2026-10-28）。
import fs from "node:fs";
import path from "node:path";
import { WORK, configOf, sharp } from "./描图工具.mjs";
import { layerPathsById, sample } from "./线稿换算工具.mjs";

/** 角点（第三项 1）和顺滑点 → 三次贝塞尔段 [起点, 控1, 控2, 终点]：顺滑点按前后两点的方向（Catmull-Rom）取切线，角点两边的控制点缩在点上 */
export function toBezier(pts) {
  const n = pts.length;
  const tan = pts.map((p, i) => {
    if (p[2]) return [0, 0];
    const a = pts[(i - 1 + n) % n];
    const b = pts[(i + 1) % n];
    return [(b[0] - a[0]) / 2, (b[1] - a[1]) / 2];
  });
  return pts.map((p, i) => {
    const q = pts[(i + 1) % n];
    const [t0, t1] = [tan[i], tan[(i + 1) % n]];
    return [[p[0], p[1]], [p[0] + t0[0] / 3, p[1] + t0[1] / 3], [q[0] - t1[0] / 3, q[1] - t1[1] / 3], [q[0], q[1]]];
  });
}
const dOf = (pts) => {
  const segs = toBezier(pts);
  const f = (v) => +v.toFixed(2);
  return `M${f(segs[0][0][0])},${f(segs[0][0][1])} ` + segs.map((s) => `C${s.slice(1).map((q) => `${f(q[0])},${f(q[1])}`).join(" ")}`).join(" ") + " Z";
};

const TITLES = {
  "hair-bun": "头发⓪·发髻（一直在后面那片后面）",
  "hair-back": "头发①·后面那片（头顶、后脑勺：画在身子后面，几块合起来描外轮廓）",
  "hair-bangs": "头发②·刘海（压在脸上的一缕一缕）",
  "hair-lock-l": "头发③·画面左边的鬓发（转到 3/4 时在远处，藏到脸后面）",
  "hair-lock-r": "头发④·画面右边的鬓发",
  "hair-tail": "头发⑤·马尾（后面那片下面）",
  "hair-tie": "头发⑥·发圈",
};
const STYLE = 'data-by="ai" fill="#ff0000" fill-opacity="0.07" stroke="#000000" stroke-opacity="0.47"';
const svgFile = (who, view) => path.join(WORK, "public/ref", `${who}-${view === "front" ? "线稿" : "侧面线稿"}.svg`);

async function look(who, view, X0, Y0, X1, Y1, Z, out, file) {
  const cfg = await configOf(who, "用法见文件开头");
  const K = (600 - 141.43) / (cfg.lines[1] - cfg.lines[0]);
  const v = cfg.views[view];
  const x0 = v.x0 ?? 229.5;
  const toPx = (X, Y) => [v.cx + (X - x0) / K, cfg.lines[0] + (Y - 141.43) / K];
  const [pa, pb] = [toPx(X0, Y0), toPx(X1, Y1)];
  const W = Math.round((X1 - X0) * Z);
  const H = Math.round((Y1 - Y0) * Z);
  // 参考图四周补白再裁正好那一块，缩放到画布大小
  const PAD = 400;
  const ext = await sharp(path.join(WORK, cfg.ref)).extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: "#ffffff" }).png().toBuffer();
  const img = await sharp(ext)
    .extract({ left: Math.round(pa[0]) + PAD, top: Math.round(pa[1]) + PAD, width: Math.max(1, Math.round(pb[0] - pa[0])), height: Math.max(1, Math.round(pb[1] - pa[1])) })
    .resize(W, H, { fit: "fill" })
    .png()
    .toBuffer();
  const P = ([X, Y]) => [((X - X0) * Z).toFixed(1), ((Y - Y0) * Z).toFixed(1)];
  let s = "";
  for (let X = Math.ceil(X0 / 5) * 5; X <= X1; X += 5) {
    const major = X % 10 === 0;
    s += `<line x1="${P([X, Y0])[0]}" y1="0" x2="${P([X, Y0])[0]}" y2="${H}" stroke="${major ? "#0060ff" : "#60a0ff"}" stroke-opacity="${major ? 0.35 : 0.18}"/>`;
    if (major) s += `<text x="${+P([X, Y0])[0] + 2}" y="12" font-size="11" fill="#0040c0">${X}</text>`;
  }
  for (let Y = Math.ceil(Y0 / 5) * 5; Y <= Y1; Y += 5) {
    const major = Y % 10 === 0;
    s += `<line x1="0" y1="${P([X0, Y])[1]}" x2="${W}" y2="${P([X0, Y])[1]}" stroke="${major ? "#0060ff" : "#60a0ff"}" stroke-opacity="${major ? 0.35 : 0.18}"/>`;
    if (major) s += `<text x="2" y="${+P([X0, Y])[1] - 2}" font-size="11" fill="#0040c0">${Y}</text>`;
  }
  const body = layerPathsById(fs.readFileSync(svgFile(who, view), "utf8"), view === "front" ? "body" : "side-body");
  const line = (segs, color, width, closed) => {
    const pts = sample(segs, 12);
    return `<path d="M${pts.map(P).map((q) => q.join(",")).join(" L")}${closed ? " Z" : ""}" fill="none" stroke="${color}" stroke-width="${width}" stroke-opacity="0.9"/>`;
  };
  for (const [id, p] of Object.entries(body)) {
    if (/^(face|ear|eye|nose|mouth)/.test(id)) s += line(p.segs, "#00b050", 1.5, p.closed);
    if (/^(hair|fringe)/.test(id)) s += line(p.segs, "#ff8000", 1.2, p.closed);
  }
  if (file) {
    const spec = JSON.parse(fs.readFileSync(file, "utf8"))[view] ?? {};
    const cols = ["#e00060", "#a000e0", "#0090c0", "#c06000", "#008040", "#4040ff", "#c0a000", "#ff0000"];
    Object.entries(spec).forEach(([id, pc], k) => {
      const c = cols[k % cols.length];
      const sg = toBezier(pc.pts);
      s += `<path d="M${P(sg[0][0]).join(",")} ${sg.map((q) => "C" + q.slice(1).map(P).map((r) => r.join(",")).join(" ")).join(" ")} Z" fill="${c}" fill-opacity="0.12" stroke="${c}" stroke-width="2.2"/>`;
      pc.pts.forEach(([x, y, corner], i) => {
        const [px, py] = P([x, y]);
        s += corner ? `<rect x="${px - 4}" y="${py - 4}" width="8" height="8" fill="none" stroke="${c}" stroke-width="1.5"/>` : `<circle cx="${px}" cy="${py}" r="3" fill="${c}"/>`;
        s += `<text x="${+px + 4}" y="${+py - 4}" font-size="10" fill="${c}">${i}</text>`;
      });
      const [lx, ly] = P(pc.pts[0]);
      s += `<text x="${+lx + 6}" y="${+ly + 14}" font-size="12" font-weight="bold" fill="${c}">${id}</text>`;
    });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } })
    .composite([{ input: img, left: 0, top: 0 }, { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`), left: 0, top: 0 }])
    .png()
    .toFile(out);
  console.log("写好", out, W, "×", H);
}

function write(who, file, force = false) {
  const spec = JSON.parse(fs.readFileSync(file, "utf8"));
  // 先检查两张：头发图层里有用户画的线（不带 data-by="ai"）就不写
  for (const view of ["front", "side"]) {
    const s = fs.readFileSync(svgFile(who, view), "utf8");
    const pre = view === "side" ? "side-" : "";
    const theirs = [];
    for (const layer of Object.keys(TITLES)) {
      const m = s.match(new RegExp(`<g class="layer" id="${pre}${layer}"[^>]*>([\\s\\S]*?)\\n </g>`));
      if (m) for (const [el] of m[1].matchAll(/<path\b[^>]*>/g)) if (!/data-by="ai"/.test(el)) theirs.push(el.match(/\sid="([^"]*)"/)?.[1] ?? "?");
    }
    if (theirs.length && !force)
      throw new Error(`${path.basename(svgFile(who, view))} 的头发图层里有用户画的线（${theirs.join("、")}），不覆盖。真要覆盖加 --force`);
  }
  for (const view of ["front", "side"]) {
    const f = svgFile(who, view);
    let s = fs.readFileSync(f, "utf8");
    const pre = view === "side" ? "side-" : "";
    const bodyId = view === "side" ? "side-body" : "body";
    // 描的旧头发挪进隐藏图层（只挪一次）
    if (!s.includes(`id="${pre}old-hair"`)) {
      const m = s.match(new RegExp(`(<g class="layer" id="${bodyId}"[^>]*>)([\\s\\S]*?)(\\n </g>)`));
      if (!m) throw new Error("没有身体图层 " + bodyId);
      const old = [];
      const kept = m[2].replace(/\n\s*<path id="(hair-back|fringe|hair-\d+|hair-tail|hair-tie)"[^>]*\/>/g, (all, id) => {
        old.push(all.replace(`id="${id}"`, `id="old-${id}"`));
        return "";
      });
      const layer = old.length ? `\n <g class="layer" id="${pre}old-hair" style="display:none">\n  <title>描的头发（旧，单层，只当参考）</title>${old.join("")}\n </g>` : "";
      s = s.replace(m[0], m[1] + kept + m[3] + layer);
    }
    for (const layer of Object.keys(TITLES)) {
      const id = pre + layer;
      if (!s.includes(`id="${id}"`)) s = s.replace(/\n<\/svg>\s*$/, `\n <g class="layer" id="${id}">\n  <title>${TITLES[layer]}</title>\n </g>\n</svg>\n`);
    }
    for (const [pid, pc] of Object.entries(spec[view] ?? {})) {
      s = s.replace(new RegExp(`\\n\\s*<path\\b[^>]*\\sid="${pid}"[^>]*/>`, "g"), "");
      const re = new RegExp(`(<g class="layer" id="${pre}${pc.layer}"[^>]*>\\s*<title>[^<]*</title>)`);
      if (!re.test(s)) throw new Error("没有图层 " + pre + pc.layer);
      s = s.replace(re, `$1\n  <path id="${pid}" d="${dOf(pc.pts)}" ${STYLE}/>`);
    }
    fs.writeFileSync(f, s);
    console.log("写好", f);
  }
}

const [cmd, who, ...rest] = process.argv.slice(2);
if (cmd === "看") {
  const [view, X0, Y0, X1, Y1, Z, out, file] = rest;
  await look(who, view, +X0, +Y0, +X1, +Y1, +Z, out, file);
} else if (cmd === "写") write(who, rest[0], rest.includes("--force"));
else throw new Error("用法：头发描点.mjs 看 <角色> <front|side> X0 Y0 X1 Y1 放大 <输出.png> [点.json] ｜ 头发描点.mjs 写 <角色> <点.json>");
