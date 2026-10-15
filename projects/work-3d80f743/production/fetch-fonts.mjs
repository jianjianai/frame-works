// 收集 film/*.ts 里所有会画到画面上的中文、标点和数字，下载 Noto Serif SC 700 的子集。
// 画面上的中文变了就重新运行：node production/fetch-fonts.mjs
import fs from "node:fs";
const dir = new URL("../film/", import.meta.url);
let text = "0123456789¥.…·，。？！：、「」 ";
for (const f of fs.readdirSync(dir)) if (f.endsWith(".ts")) text += fs.readFileSync(new URL(f, dir), "utf8");
const chars = [...new Set([...text].filter((c) => /[　-〿一-鿿＀-￯0-9¥.…·]/.test(c) || c === " "))].join("");
console.log("chars", chars.length);
const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const css = await (await fetch("https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&text=" + encodeURIComponent(chars), { headers: { "User-Agent": ua } })).text();
const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]);
if (urls.length !== 1) throw new Error("expected one font url, got " + urls.length + "\n" + css.slice(0, 400));
const buf = Buffer.from(await (await fetch(urls[0], { headers: { "User-Agent": ua } })).arrayBuffer());
fs.writeFileSync(new URL("../public/fonts/serif.woff2", import.meta.url), buf);
console.log("saved", buf.length, "bytes");
