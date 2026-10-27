// 看分离出来的人声：画频谱（out.ppm）+ 打印每 20 毫秒的音高、响度、高频，用来逐字认字的起点。
// 用法：node vocal-look.mjs <vocals44.f32> <起秒> <止秒> [逐字时间,逗号隔开]
// 图：竖白线整秒、灰虚线 0.1 秒、上沿绿刻度是拍子（119.99 BPM，第一拍 0.013）、红/青短线是给的时间；下面橙色是频谱变化、蓝色是响度。
import fs from "node:fs";
const SR = 44100, N = 2048, HOP = 220;
const [VOC, A, B, MARKS = ""] = process.argv.slice(2);
const b = fs.readFileSync(VOC);
const st = new Float32Array(b.buffer, b.byteOffset, b.length / 4);
const n = st.length / 2;
const mono = new Float32Array(n); for (let i = 0; i < n; i++) mono[i] = (st[2 * i] + st[2 * i + 1]) / 2;
const win = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
const LOG = Math.log2(N), rev = new Uint32Array(N); for (let i = 0; i < N; i++) { let r = 0; for (let k = 0; k < LOG; k++) r |= ((i >> k) & 1) << (LOG - 1 - k); rev[i] = r; }
const twr = new Float64Array(N / 2), twi = new Float64Array(N / 2); for (let i = 0; i < N / 2; i++) { twr[i] = Math.cos((-2 * Math.PI * i) / N); twi[i] = Math.sin((-2 * Math.PI * i) / N); }
function fft(re, im) { for (let i = 0; i < N; i++) { const j = rev[i]; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2, step = N / 2; len <= N; len <<= 1, step >>= 1) { const h = len >> 1; for (let i = 0; i < N; i += len) for (let j = 0, k = 0; j < h; j++, k += step) { const a = i + j, c = a + h, wr = twr[k], wi = twi[k]; const tr = re[c] * wr - im[c] * wi, ti = re[c] * wi + im[c] * wr; re[c] = re[a] - tr; im[c] = im[a] - ti; re[a] += tr; im[a] += ti; } } }
export function frames(t0, t1) {
  const out = []; const re = new Float64Array(N), im = new Float64Array(N);
  for (let s = Math.floor(t0 * SR) - N / 2; s < t1 * SR - N / 2; s += HOP) {
    for (let i = 0; i < N; i++) { const k = s + i; re[i] = (k >= 0 && k < n ? mono[k] : 0) * win[i]; im[i] = 0; }
    fft(re, im); const mag = new Float32Array(N / 2); for (let k = 0; k < N / 2; k++) mag[k] = Math.hypot(re[k], im[k]);
    out.push({ t: (s + N / 2) / SR, mag });
  }
  return out;
}
const bin = (hz) => (hz * N) / SR;
export function features(F) {
  let prev = null;
  return F.map((f) => {
    let e = 0; for (let k = Math.round(bin(80)); k < bin(8000); k++) e += f.mag[k] ** 2;
    let hf = 0; for (let k = Math.round(bin(3000)); k < bin(10000); k++) hf += f.mag[k] ** 2;
    const lg = new Float32Array(Math.round(bin(6000))); for (let k = Math.round(bin(100)); k < lg.length; k++) lg[k] = Math.log(1e-3 + f.mag[k]);
    let flux = 0; if (prev) for (let k = 0; k < lg.length; k++) flux += Math.max(0, lg[k] - prev[k]); prev = lg;
    // f0 via harmonic sum
    let best = 0, bm = 0;
    for (let m = 48; m <= 84; m += 0.1) { const f0 = 440 * 2 ** ((m - 69) / 12); let s = 0; for (let h = 1; h <= 6; h++) { const x = bin(f0 * h), i = Math.floor(x), fr = x - i; s += (f.mag[i] * (1 - fr) + f.mag[i + 1] * fr) * 0.85 ** (h - 1); } if (s > best) { best = s; bm = m; } }
    const half = (() => { const f0 = 440 * 2 ** ((bm - 12 - 69) / 12); let s = 0; for (let h = 1; h <= 6; h++) { const x = bin(f0 * h), i = Math.floor(x), fr = x - i; s += (f.mag[i] * (1 - fr) + f.mag[i + 1] * fr) * 0.85 ** (h - 1); } return s; })();
    return { t: f.t, e: 10 * Math.log10(e + 1e-12), hf: 10 * Math.log10(hf + 1e-12), flux, m: bm, sal: best };
  });
}
export function image(t0, t1, out, marks = [], fmax = 4000, PX = 600) {
  const F = frames(t0, t1), FH = 480, AX = 24, GH = 90;
  const W = Math.round((t1 - t0) * PX), H = AX + FH + GH;
  const img = new Uint8Array(W * H * 3);
  const set = (x, y, r, g, b2) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const o = (y * W + x) * 3; img[o] = r; img[o + 1] = g; img[o + 2] = b2; };
  let mx = 0; for (const f of F) for (const v of f.mag) if (v > mx) mx = v;
  const fe = features(F); const emax = Math.max(...fe.map((x) => x.e)), fmx = Math.max(...fe.map((x) => x.flux));
  for (let i = 0; i < F.length; i++) {
    const x0 = Math.round((F[i].t - t0) * PX), x1 = Math.max(x0 + 1, Math.round((F[i].t + HOP / SR - t0) * PX));
    for (let y = 0; y < FH; y++) { const hz = 80 + (fmax - 80) * (1 - y / FH), bx = bin(hz), k = Math.floor(bx), fr = bx - k; const v = F[i].mag[k] * (1 - fr) + F[i].mag[k + 1] * fr;
      const db = 20 * Math.log10(v / mx + 1e-9); const q = Math.max(0, Math.min(1, (db + 60) / 55));
      for (let x = x0; x < x1; x++) set(x, AX + y, q * 255, q * q * 240, q ** 3 * 200 + (1 - q) * 20); }
    const ev = Math.max(0, Math.min(1, (fe[i].e - emax + 45) / 45)), fv = fe[i].flux / fmx;
    for (let x = x0; x < x1; x++) { for (let y = 0; y < ev * 40; y++) set(x, H - 1 - y, 60, 190, 255); for (let y = 0; y < fv * 40; y++) set(x, H - 46 - y, 255, 120, 60); }
  }
  for (let k = Math.ceil(t0 * 20); k <= t1 * 20; k++) { const x = Math.round((k / 20 - t0) * PX); const major = k % 20 === 0, mid = k % 2 === 0;
    for (let y = 0; y < (major ? H : mid ? AX : AX / 2); y++) set(x, y, major ? 255 : 160, major ? 255 : 160, major ? 255 : 160);
    if (mid && !major) for (let y = AX; y < H; y += 6) set(x, y, 110, 110, 110); }
  for (let k = Math.ceil((t0 - 0.013) * 2); k <= (t1 - 0.013) * 2; k++) { const x = Math.round((0.013 + k / 2 - t0) * PX); for (let y = 0; y < AX; y++) { set(x, y, 0, 255, 0); set(x + 1, y, 0, 255, 0); } }
  marks.forEach((s, j) => { const x = Math.round((s - t0) * PX); const c = j % 2 ? [255, 60, 60] : [60, 255, 255]; for (let y = AX; y < AX + 60; y++) { set(x, y, ...c); set(x + 1, y, ...c); } });
  fs.writeFileSync(out + ".ppm", Buffer.concat([Buffer.from(`P6 ${W} ${H} 255\n`), Buffer.from(img)]));
}
image(+A, +B, "out", MARKS.split(",").filter(Boolean).map(Number), 4000, 600);
{
  const fe = features(frames(+A, +B));
  const emax = Math.max(...fe.map((x) => x.e)), hmax = Math.max(...fe.map((x) => x.hf));
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  for (let i = 0; i + 4 <= fe.length; i += 4) {
    const g = fe.slice(i, i + 4);
    const m = g.reduce((a, x) => a + x.m, 0) / 4, mi = Math.round(m);
    const e = Math.max(...g.map((x) => x.e)) - emax, h = Math.max(...g.map((x) => x.hf)) - hmax;
    console.log(`${g[0].t.toFixed(3)} ${(names[mi % 12] + (Math.floor(mi / 12) - 1)).padEnd(4)} 响度${e.toFixed(0).padStart(4)} ${"=".repeat(Math.max(0, Math.round((e + 40) / 2))).padEnd(20)} 高频${h.toFixed(0).padStart(4)}`);
  }
}
