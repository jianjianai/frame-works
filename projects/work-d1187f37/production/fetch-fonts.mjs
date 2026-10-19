// 重新生成 public/fonts/*.woff2：收集 scenes/ 里用到的所有字符，向 Google Fonts 请求只含这些字的子集。
// 改了画面里的中文文字后运行：node production/fetch-fonts.mjs
import fs from "node:fs";import path from "node:path";
const dir=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
const out=path.join(dir,"public/fonts");fs.mkdirSync(out,{recursive:true});
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith(".ts")?[path.join(d,e.name)]:[])}
let chars=new Set();for(const f of walk(path.join(dir,"scenes")))for(const ch of fs.readFileSync(f,"utf8"))if(ch.codePointAt(0)>127)chars.add(ch);
for(let c=32;c<127;c++)chars.add(String.fromCharCode(c));
// 画面里用到、但不在 scenes/ 源码里的符号加在这里
["‹","·","…","—","“","”","（","）","，","。","！","？","：","♥","✆","❚","◀","▶","ᛒ","✓","¥"].forEach(c=>chars.add(c));
const text=[...chars].join("");
console.log("chars",chars.size);
const UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const fonts=[["ZCOOL+KuaiLe","400","zcool-kuaile.woff2",true],["Long+Cang","400","long-cang.woff2",true],["Noto+Sans+SC","400","noto-sans-sc-400.woff2",true],["Noto+Sans+SC","700","noto-sans-sc-700.woff2",true],["Gochi+Hand","400","gochi-hand.woff2",false],["Permanent+Marker","400","permanent-marker.woff2",false]];
(async()=>{for(const [fam,wt,file,sub] of fonts){
 const t=sub?text:text.replace(/[^\x20-\x7e’‘“”…—]/g,"");
 const url=`https://fonts.googleapis.com/css2?family=${fam}:wght@${wt}&text=${encodeURIComponent(t)}`;
 const css=await (await fetch(url,{headers:{"User-Agent":UA}})).text();
 const m=[...css.matchAll(/url\((https:[^)]+)\)/g)].map(x=>x[1]);
 if(m.length!==1){console.log(fam,"urls",m.length,css.slice(0,300));}
 const buf=Buffer.from(await (await fetch(m[0])).arrayBuffer());fs.writeFileSync(path.join(out,file),buf);console.log(file,buf.length);
}})();
