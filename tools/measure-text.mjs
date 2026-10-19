#!/usr/bin/env node
// 量字宽、看一段字在给定宽度里怎么换行（海外版排英文用，不用开浏览器）。直接读 TTF 的 cmap 和 hmtx，不算字距调整，
// 和画布上的结果差一两个像素；排定以后仍然看截图。
//
// 用法：node measure-text.mjs <字体.ttf> <字号> [最大宽度] "文字" ["文字" …]
//   node measure-text.mjs fonts/noto-sans-sc-400.ttf 37 "That's not true!!"
//       → 只量宽度
//   node measure-text.mjs fonts/noto-sans-sc-400.ttf 37 404 "I finally solved that physics problem!! …"
//       → 按单词换行（和 dm.ts 的 layoutText 一样："\n" 是硬换行，比一行还长的词按字母切开），列出每行和它的宽度
// 常用的数：dm.ts 聊天字 37px（Noto Sans SC），气泡里一行最宽 404、输入框 396；歌词 Gochi Hand 68px，最宽 820。
// 字体文件在素材库的 fonts/（服务器上素材库的工作副本里，找不到就 find / -name gochi-hand.ttf）。
import { readFileSync } from "node:fs";

function loadFont(path) {
  const d = readFileSync(path);
  const tables = {};
  const n = d.readUInt16BE(4);
  for (let i = 0; i < n; i++) {
    const o = 12 + 16 * i;
    tables[d.toString("latin1", o, o + 4)] = d.readUInt32BE(o + 8);
  }
  const upm = d.readUInt16BE(tables.head + 18);
  const nhm = d.readUInt16BE(tables.hhea + 34);
  const hmtx = tables.hmtx;
  // character → glyph (cmap format 12 if there is one, else 4)
  const cmap = tables.cmap;
  const sub = [];
  for (let i = 0; i < d.readUInt16BE(cmap + 2); i++) {
    const o = cmap + d.readUInt32BE(cmap + 4 + 8 * i + 4);
    sub.push([d.readUInt16BE(o), o]);
  }
  const f12 = sub.find(([f]) => f === 12),
    f4 = sub.find(([f]) => f === 4);
  const glyph = (cp) => {
    if (f12) {
      const o = f12[1];
      for (let i = 0; i < d.readUInt32BE(o + 12); i++) {
        const s = d.readUInt32BE(o + 16 + 12 * i),
          e = d.readUInt32BE(o + 20 + 12 * i);
        if (cp >= s && cp <= e) return d.readUInt32BE(o + 24 + 12 * i) + cp - s;
      }
      return 0;
    }
    const o = f4[1],
      seg = d.readUInt16BE(o + 6) / 2;
    for (let i = 0; i < seg; i++) {
      const end = d.readUInt16BE(o + 14 + 2 * i);
      if (cp > end) continue;
      const start = d.readUInt16BE(o + 16 + 2 * seg + 2 * i);
      if (cp < start) return 0;
      const delta = d.readInt16BE(o + 16 + 4 * seg + 2 * i);
      const ro = o + 16 + 6 * seg + 2 * i,
        range = d.readUInt16BE(ro);
      if (!range) return (cp + delta) & 0xffff;
      const g = d.readUInt16BE(ro + range + 2 * (cp - start));
      return g ? (g + delta) & 0xffff : 0;
    }
    return 0;
  };
  const adv = (ch) => d.readUInt16BE(hmtx + 4 * Math.min(glyph(ch.codePointAt(0)), nhm - 1));
  return (s, size) => (Array.from(s).reduce((w, ch) => w + adv(ch), 0) * size) / upm;
}

/** lines no wider than maxW: at spaces, "\n" is a hard break, a word longer than a line is cut */
function wrap(width, s, size, maxW) {
  const out = [];
  for (const para of s.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const joined = line ? `${line} ${word}` : word;
      if (!line || width(joined, size) <= maxW) line = joined;
      else {
        out.push(line);
        line = word;
      }
      while (line.length > 1 && width(line, size) > maxW) {
        let k = line.length - 1;
        while (k > 1 && width(line.slice(0, k), size) > maxW) k--;
        out.push(line.slice(0, k));
        line = line.slice(k);
      }
    }
    out.push(line);
  }
  return out;
}

const [font, sizeArg, ...rest] = process.argv.slice(2);
if (!font || !sizeArg || !rest.length) {
  console.error('用法：node measure-text.mjs <字体.ttf> <字号> [最大宽度] "文字" …');
  process.exit(1);
}
const width = loadFont(font);
const size = Number(sizeArg);
const maxW = rest.length > 1 && /^\d+(\.\d+)?$/.test(rest[0]) ? Number(rest.shift()) : 0;
for (const s of rest) {
  if (!maxW) console.log(`${Math.round(width(s, size))}  ${s}`);
  else {
    const lines = wrap(width, s, size, maxW);
    console.log(`${lines.length} 行  ${s.length > 40 ? s.slice(0, 40) + "…" : s}`);
    for (const l of lines) console.log(`  ${String(Math.round(width(l, size))).padStart(4)}  ${l}`);
  }
}
