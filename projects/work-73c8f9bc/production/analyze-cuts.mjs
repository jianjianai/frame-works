// Analyse where to cut the song: per-beat chroma similarity between repeated choruses and the exact lag between them.
// node production/analyze-cuts.mjs
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ffmpeg = require("/app/node_modules/.pnpm/ffmpeg-static@5.3.0_supports-color@8.1.1/node_modules/ffmpeg-static");

const SR = 22050;
const file = new URL("../public/music/stalk-ur-socials-s0rrow.flac", import.meta.url).pathname;
const out = spawnSync(ffmpeg, ["-v", "error", "-i", file, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
const buf = out.stdout;
const x = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
console.log("samples", x.length, "dur", (x.length / SR).toFixed(3));

// FFT (radix 2)
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k], ai = im[i + k];
        const br = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const bi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ar + br; im[i + k] = ai + bi;
        re[i + k + len / 2] = ar - br; im[i + k + len / 2] = ai - bi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
const N = 2048, HOP = 256;
const frames = Math.floor((x.length - N) / HOP);
const win = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
const chroma = [], flux = new Float32Array(frames), mags = [];
let prev = null;
for (let f = 0; f < frames; f++) {
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let i = 0; i < N; i++) re[i] = x[f * HOP + i] * win[i];
  fft(re, im);
  const mag = new Float32Array(N / 2);
  for (let k = 0; k < N / 2; k++) mag[k] = Math.log1p(10 * Math.hypot(re[k], im[k]));
  const c = new Float32Array(12);
  for (let k = 4; k < N / 2; k++) {
    const hz = (k * SR) / N;
    if (hz < 80 || hz > 5000) continue;
    const pc = ((Math.round(12 * Math.log2(hz / 440)) % 12) + 12) % 12;
    c[pc] += mag[k];
  }
  chroma.push(c);
  // coarse 64-band log spectrum for direct comparison
  const bands = new Float32Array(64);
  for (let b = 0; b < 64; b++) {
    const lo = Math.floor(2 * Math.pow(N / 4, b / 64)), hi = Math.max(lo + 1, Math.floor(2 * Math.pow(N / 4, (b + 1) / 64)));
    let s = 0;
    for (let k = lo; k < hi; k++) s += mag[k];
    bands[b] = s / (hi - lo);
  }
  mags.push(bands);
  if (prev) {
    let s = 0;
    for (let k = 0; k < N / 2; k++) s += Math.max(0, mag[k] - prev[k]);
    flux[f] = s;
  }
  prev = mag;
}
const ft = (f) => (f * HOP + N / 2) / SR; // frame centre time
const fi = (t) => Math.round((t * SR - N / 2) / HOP);
const BEAT = 60 / 124.59, B0 = 0.009;
const cos = (a, b) => {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return d / Math.sqrt(na * nb + 1e-9);
};
const beatChroma = (k) => {
  const a = fi(B0 + k * BEAT), b = fi(B0 + (k + 1) * BEAT);
  const c = new Float32Array(12);
  for (let f = Math.max(0, a); f < Math.min(frames, b); f++) for (let i = 0; i < 12; i++) c[i] += chroma[f][i];
  return c;
};
function compare(name, k0, k1, lagBeats) {
  const sims = [];
  for (let k = k0; k < k1; k++) sims.push(cos(beatChroma(k), beatChroma(k + lagBeats)).toFixed(3));
  console.log(name, sims.join(" "));
}
compare("C1 vs C2 (beats 0-31 vs 32-63)", 0, 32, 32);
compare("C3 vs C4 (beats 96-127 vs 128-159)", 96, 128, 32);
compare("C1 vs C3", 0, 32, 96);
compare("B vs C2 (beats 64-95 vs 32-63)", 64, 96, -32);

// exact lag via onset-envelope cross-correlation
function lag(t0, t1, nominal, search = 0.06) {
  const a0 = fi(t0), a1 = fi(t1);
  let best = -1e9, bestL = 0;
  const step = 1;
  for (let l = Math.round((nominal - search) * SR / HOP); l <= Math.round((nominal + search) * SR / HOP); l += step) {
    let s = 0, na = 0, nb = 0;
    for (let f = a0; f < a1; f++) { const p = flux[f], q = flux[f + l] ?? 0; s += p * q; na += p * p; nb += q * q; }
    const c = s / Math.sqrt(na * nb + 1e-9);
    if (c > best) { best = c; bestL = l; }
  }
  return [(bestL * HOP) / SR, best];
}
const nominal = 32 * BEAT;
console.log("nominal 8 bars", nominal.toFixed(4));
console.log("C1->C2 lag", lag(1, 14.5, nominal).map((v) => v.toFixed(4)).join(" "));
console.log("C3->C4 lag", lag(46.5, 60.5, nominal).map((v) => v.toFixed(4)).join(" "));
console.log("C1->C3 lag", lag(1, 14.5, 3 * nominal, 0.1).map((v) => v.toFixed(4)).join(" "));

// how different are two passages, frame by frame (64-band log spectrum, mean abs diff), around candidate cuts
function diffAt(ta, tb, span = 0.6) {
  const rows = [];
  for (let t = -span; t <= span + 1e-6; t += 0.05) {
    const fa = fi(ta + t), fb = fi(tb + t);
    let d = 0;
    for (let b = 0; b < 64; b++) d += Math.abs(mags[fa][b] - mags[fb][b]);
    rows.push(`${(ta + t).toFixed(2)}:${(d / 64).toFixed(2)}`);
  }
  console.log(`diff ${ta.toFixed(2)} vs ${tb.toFixed(2)}:`, rows.join(" "));
}
const L1 = lag(1, 14.5, nominal)[0], L2 = lag(46.5, 60.5, nominal)[0];
diffAt(14.95, 14.95 + L1, 0.8);
diffAt(46.0, 46.0 + L2, 0.8);
diffAt(47.0, 47.0 + L2, 0.8);
// loudness per beat (rms) around the candidates
function rmsAt(t0, t1) {
  const a = Math.floor(t0 * SR), b = Math.floor(t1 * SR);
  let s = 0;
  for (let i = a; i < b; i++) s += x[i] * x[i];
  return (10 * Math.log10(s / (b - a) + 1e-12)).toFixed(1);
}
const row = [];
for (let t = 13.5; t < 16.5; t += 0.1) row.push(`${t.toFixed(1)}:${rmsAt(t, t + 0.1)}`);
console.log("rms C1 end", row.join(" "));
const row2 = [];
for (let t = 28.8; t < 31.8; t += 0.1) row2.push(`${t.toFixed(1)}:${rmsAt(t, t + 0.1)}`);
console.log("rms C2 end", row2.join(" "));
const row3 = [];
for (let t = 44.6; t < 47.0; t += 0.1) row3.push(`${t.toFixed(1)}:${rmsAt(t, t + 0.1)}`);
console.log("rms B end", row3.join(" "));
const row4 = [];
for (let t = 60.2; t < 62.6; t += 0.1) row4.push(`${t.toFixed(1)}:${rmsAt(t, t + 0.1)}`);
console.log("rms C3 end", row4.join(" "));
const row5 = [];
for (let t = 75.8; t < 78.0; t += 0.1) row5.push(`${t.toFixed(1)}:${rmsAt(t, t + 0.1)}`);
console.log("rms tail", row5.join(" "));
