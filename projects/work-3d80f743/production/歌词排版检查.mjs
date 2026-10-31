// 歌词排版检查（2026-10-30）：照 scenes/lyrics.ts 的 build() 算每句什么时候出来、什么时候退完、和前后句叠不叠，
// 标出出了抖音安全区的排列，列出同时在画面上的相邻两句。改了某句的位置以后跑一下，看前后句的时机有没有跟着变
// （位置决定和前后句叠不叠，叠就一先一后、不叠就提前出来、晚一点退）。
// 用法：node production/歌词排版检查.mjs        竖屏
//       node production/歌词排版检查.mjs w      B 站横屏（按 wb 换算的底子算时机）
// 只看数，画面还是要用 preview_frames 取句中、句尾和切点前后看。
import fs from "node:fs";
import { stripTypeScriptTypes } from "node:module";
const W = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const mode = process.argv[2] ?? "v";
const src = fs.readFileSync(`${W}/scenes/lyrics.ts`, "utf8");
const a = src.indexOf("const LOOK: Look[] = [");
const b = src.indexOf("// ——— 运行时 ———");
const lookSrc = src.slice(a, b).replace("const LOOK: Look[] =", "LOOK =");
const tsrc = fs.readFileSync(`${W}/lib/lyrics_t.ts`, "utf8");
const la = tsrc.indexOf("export const LYRICS");
const lyrSrc = tsrc.slice(la).replace("export const LYRICS: LyricTiming[] =", "LYRICS =");
const js = stripTypeScriptTypes(`let LOOK: any, LYRICS: any;\n${lookSrc}\n${lyrSrc}\n`, { mode: "strip" }) + "\nreturn { LOOK, LYRICS };";
const stub = { netCam: () => ({ r: 0 }), NET_T: { end: 44 }, netShake: () => 0, callZoom: () => 1, chainCam: () => ({ z: 1 }) };
const { LOOK, LYRICS } = new Function(...Object.keys(stub), js)(...Object.values(stub));
const arrsOf = (L) => {
  const first = { x: L.x, y: L.y, dir: L.dir ?? "h", size: L.size ?? 62, gap: L.gap ?? 0.1, rows: L.rows ?? 1, t: -1 };
  const arrs = [first];
  for (const r of [...(L.re ?? [])].sort((p, q) => p.t - q.t)) {
    const p = arrs[arrs.length - 1];
    arrs.push({ x: r.x ?? p.x, y: r.y ?? p.y, dir: r.dir ?? p.dir, size: r.size ?? p.size, gap: r.gap ?? p.gap, rows: r.rows ?? p.rows, t: r.t });
  }
  return arrs;
};
function slots(a, n) {
  const adv = a.size * (1 + a.gap);
  const per = Math.ceil(n / a.rows);
  return Array.from({ length: n }, (_, j) => {
    const r = Math.floor(j / per);
    const inRow = Math.min(per, n - r * per);
    const o = (j - r * per - (inRow - 1) / 2) * adv;
    const across = (r - (a.rows - 1) / 2) * a.size * 1.32;
    return a.dir === "v" ? [a.x - across, a.y + o] : [a.x + o, a.y + across];
  });
}
function boxOf(a, n) {
  const ps = slots(a, n);
  const h = a.size * 0.62;
  return { x0: Math.min(...ps.map((p) => p[0])) - h, x1: Math.max(...ps.map((p) => p[0])) + h, y0: Math.min(...ps.map((p) => p[1])) - h, y1: Math.max(...ps.map((p) => p[1])) + h };
}
const overlaps = (p, q) => p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1;
// 横屏换算用的排列（wb：竖屏重排以前的，横屏不跟着变）
const pick = (L) => (mode === "w" && L.wb ? { ...L, ...L.wb } : L);
const base = LYRICS.map((tm, i) => ({ tm, L: pick(LOOK[i]), arrs: arrsOf(pick(LOOK[i])) }));
const lines = base.map(({ tm, L, arrs }, i) => {
  const n = [...tm.text].length;
  const prev = base[i - 1];
  const next = base[i + 1];
  const withPrev = !!prev && overlaps(boxOf(prev.arrs[prev.arrs.length - 1], [...prev.tm.text].length), boxOf(arrs[0], n));
  const withNext = !!next && overlaps(boxOf(arrs[arrs.length - 1], n), boxOf(next.arrs[0], [...next.tm.text].length));
  const lead = L.lead ?? (withPrev ? 0.14 : 0.4);
  const tIn = tm.t[0] - lead;
  const nextT0 = next?.tm.t[0] ?? 999;
  const out = L.out ?? (withNext ? Math.max(tm.t[n - 1] + 0.1, nextT0 - 0.27) : Math.min(tm.end + 0.25, nextT0 + 0.2));
  const dOut = L.dOut ?? (withNext ? 0.12 : 0.35);
  const stagger = L.stagger ?? (withNext ? 0 : 0.03);
  const exit = L.exit ?? "fade";
  const gone = out + dOut + (n - 1) * stagger;
  return { i, text: tm.text, n, t0: tm.t[0], end: tm.end, tIn, out, gone, exit, withPrev, withNext, arrs, boxes: arrs.map((q) => ({ t: q.t, ...boxOf(q, n) })) };
});
const SAFE = { top: 250, bottom: 1460, rightLow: 900, rightHigh: 1020, left: 60 };
for (const l of lines) {
  const flags = [];
  for (const bx of l.boxes) {
    if (bx.y0 < SAFE.top) flags.push(`上沿 ${bx.y0.toFixed(0)}`);
    if (bx.y1 > SAFE.bottom) flags.push(`下沿 ${bx.y1.toFixed(0)}`);
    if (bx.x0 < SAFE.left) flags.push(`左 ${bx.x0.toFixed(0)}`);
    if (bx.y1 > 880 && bx.x1 > SAFE.rightLow) flags.push(`右下按钮 x1 ${bx.x1.toFixed(0)} y1 ${bx.y1.toFixed(0)}`);
    if (bx.x1 > SAFE.rightHigh) flags.push(`右 ${bx.x1.toFixed(0)}`);
  }
  const arr = l.arrs.map((q) => `${q.t > 0 ? q.t + "→" : ""}(${q.x},${q.y}${q.dir === "v" ? ",竖" : ""}${q.rows > 1 ? "," + q.rows + "行" : ""},${q.size})`).join(" ");
  console.log(`${String(l.i).padStart(2)} ${l.text.padEnd(11, "　")} 出 ${l.tIn.toFixed(2)} 唱 ${l.t0.toFixed(2)}–${l.end.toFixed(2)} 退 ${l.out.toFixed(2)} 完 ${l.gone.toFixed(2)} ${l.exit.padEnd(5)} ${l.withPrev ? "叠上" : "    "}${l.withNext ? "叠下" : "    "} ${arr} ${flags.join(" ")}`);
}
// 同时在画面上的几句
console.log("\n同时在画面上：");
for (let i = 0; i + 1 < lines.length; i++) {
  const p = lines[i], q = lines[i + 1];
  const ov = Math.min(p.gone, q.gone) - q.tIn;
  if (ov > 0.05) console.log(`  ${p.i}「${p.text}」和 ${q.i}「${q.text}」 ${q.tIn.toFixed(2)}–${Math.min(p.gone, q.gone).toFixed(2)}（${ov.toFixed(2)} 秒）`);
}
