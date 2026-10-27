// 酷狗 KRC：列出所有候选、逐个下载解密，打印每一句的逐字时间（秒）。
// 用法：node fetch-krc-all.mjs "歌手 - 歌名" <音频毫秒>
import zlib from "node:zlib";
const [keyword, duration = ""] = process.argv.slice(2);
const KEY = [64, 71, 97, 119, 94, 50, 116, 71, 81, 54, 49, 45, 206, 210, 110, 105];
const s = await (await fetch(`http://krcs.kugou.com/search?ver=1&man=yes&client=mobi&keyword=${encodeURIComponent(keyword)}&duration=${duration}&hash=`)).json();
for (const c of s.candidates ?? []) {
  const dl = await (await fetch(`http://lyrics.kugou.com/download?ver=1&client=pc&id=${c.id}&accesskey=${c.accesskey}&fmt=krc&charset=utf8`)).json();
  const raw = Buffer.from(dl.content, "base64").subarray(4);
  for (let i = 0; i < raw.length; i++) raw[i] ^= KEY[i % KEY.length];
  const text = zlib.inflateSync(raw).toString("utf8");
  console.log(`=== ${c.id} ${c.song} | ${c.singer} ${c.duration}ms`);
  for (const m of text.matchAll(/^\[(\d+),(\d+)\](.*)$/gm)) {
    const ls = +m[1];
    const chars = [];
    for (const g of m[3].matchAll(/<(\d+),(\d+),\d+>([^<]*)/g))
      for (const ch of [...g[3]]) if (ch.trim()) chars.push(`${ch}${((ls + +g[1]) / 1000).toFixed(2)}/${(+g[2] / 1000).toFixed(2)}`);
    // 连着好几个字都是 0.06 秒，多半是挤坏了的句子
    const n06 = chars.filter((x) => x.endsWith("/0.06")).length;
    console.log(`${n06 >= 3 ? "##" : "  "} ${(ls / 1000).toFixed(2)} ${chars.join(" ")}`);
  }
}
