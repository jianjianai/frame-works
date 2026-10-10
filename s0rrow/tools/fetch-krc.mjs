// 用酷狗 KRC 取逐字歌词时间，输出作品的 scenes/krc.ts（素材库 code/lyrics.ts 的 lyricLines 用它）。
// 用法：把这个脚本拷到作品的 production/，node production/fetch-krc.mjs "歌手 - 歌名" <音频毫秒数> > scenes/krc.ts
// 先核对 stderr 打印的 KRC 时长和本地音频一致，再抽查几个词的时间。
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

// 行：[行起点ms,行时长ms]<偏移ms,时长ms,0>字…（偏移相对行起点）。
// 空格跟在字后面（"Today " "I "），所以上一个字以空格结尾时开始新词。
const r3 = (n) => Math.round(n * 1000) / 1000;
const lines = [];
for (const m of text.matchAll(/^\[(\d+),(\d+)\](.*)$/gm)) {
  const lineStart = Number(m[1]);
  const words = [];
  let open = false;
  for (const g of m[3].matchAll(/<(\d+),(\d+),\d+>([^<]*)/g)) {
    const start = (lineStart + Number(g[1])) / 1000;
    const end = start + Number(g[2]) / 1000;
    const str = g[3];
    if (str.trim()) {
      if (open) {
        const w = words[words.length - 1];
        w[1] = end - w[0];
        w[2] += str.trim();
      } else words.push([start, end - start, str.trim()]);
    }
    open = !/\s$/.test(str) && str.trim() !== "";
  }
  const joined = words.map((w) => w[2]).join(" ");
  // 跳过开头的歌名、作词作曲等信息行
  if (!words.length || /[：:]|^.* - .*$/.test(joined)) continue;
  lines.push(words.map(([s, d, w]) => [r3(s), r3(d), w]));
}
console.log(`// Word timings from Kugou KRC (${keyword}), seconds in song time. [start, duration, word]`);
console.log("export const LYRIC_WORDS: [number, number, string][][] = [");
for (const l of lines) console.log("  " + JSON.stringify(l) + ",");
console.log("];");
