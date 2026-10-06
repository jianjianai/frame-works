// 用酷狗 KRC 取逐字歌词时间，输出 scenes/lib/krc.ts。
// 用法：node tools/fetch-krc.mjs "歌手 - 歌名" <音频毫秒数> > scenes/lib/krc.ts
// 先核对返回的 KRC 时长和本地音频一致；挑几个字用频谱图抽查。
import zlib from "node:zlib";

const [keyword, duration = ""] = process.argv.slice(2);
if (!keyword) throw new Error('用法：node fetch-krc.mjs "歌手 - 歌名" <毫秒>');
const KEY = [64, 71, 97, 119, 94, 50, 116, 71, 81, 54, 49, 45, 206, 210, 110, 105];

const search = await (
  await fetch(`http://krcs.kugou.com/search?ver=1&man=yes&client=mobi&keyword=${encodeURIComponent(keyword)}&duration=${duration}&hash=`)
).json();
const cand = search.candidates?.[0];
if (!cand) throw new Error("没有搜到候选：" + JSON.stringify(search).slice(0, 200));
console.error("candidate", cand.id, cand.song, cand.singer, "duration(ms)", cand.duration);

const dl = await (
  await fetch(`http://lyrics.kugou.com/download?ver=1&client=pc&id=${cand.id}&accesskey=${cand.accesskey}&fmt=krc&charset=utf8`)
).json();
const raw = Buffer.from(dl.content, "base64").subarray(4);
for (let i = 0; i < raw.length; i++) raw[i] ^= KEY[i % KEY.length];
const text = zlib.inflateSync(raw).toString("utf8");

// 行：[lineStartMs,lineDurMs]<offMs,durMs,0>字<offMs,durMs,0>字…（偏移相对行起点）
// 这里把字合并成英文单词：以空格开头的字是新词的开始。
const lines = [];
for (const m of text.matchAll(/^\[(\d+),(\d+)\](.*)$/gm)) {
  const lineStart = Number(m[1]);
  const words = [];
  for (const g of m[3].matchAll(/<(\d+),(\d+),\d+>([^<]*)/g)) {
    const start = (lineStart + Number(g[1])) / 1000;
    const dur = Number(g[2]) / 1000;
    const str = g[3];
    if (!words.length || /^\s/.test(str)) words.push([start, dur, str.trim()]);
    else {
      const w = words[words.length - 1];
      w[1] = start + dur - w[0];
      w[2] += str;
    }
  }
  if (words.length) lines.push(words);
}
console.log("export const LYRIC_WORDS: [number, number, string][][] = " + JSON.stringify(lines, null, 1) + ";");
