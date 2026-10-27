// 人声分离：UVR 的 Kim_Vocal_2（MDX-Net，ONNX），照 kuielab demix_base 的切块做法。只用来核对歌词时间。
// 用法：node separate-vocals.mjs <mix44.f32（44.1kHz 双声道 f32le）> <Kim_Vocal_2.onnx> <输出 vocals44.f32>
// 需要 onnxruntime-node（在临时目录 npm install onnxruntime-node@1.20.1，把这个脚本放进去跑）。
// 模型参数：n_fft 7680、hop 1024、dim_f 3072、dim_t 256；7680 不是 2 的幂，DFT 用 Bluestein（16384 点 FFT）。
import fs from "node:fs";
import ort from "onnxruntime-node";
const NFFT = 7680, HOP = 1024, DIMF = 3072, DIMT = 256, NB = NFFT / 2 + 1;
const CHUNK = HOP * (DIMT - 1), TRIM = NFFT / 2, GEN = CHUNK - 2 * TRIM;
// ---- power-of-two FFT ----
const M = 16384, LOGM = 14;
const rev = new Uint32Array(M); for (let i = 0; i < M; i++) { let r = 0; for (let b = 0; b < LOGM; b++) r |= ((i >> b) & 1) << (LOGM - 1 - b); rev[i] = r; }
const twr = new Float64Array(M / 2), twi = new Float64Array(M / 2);
for (let i = 0; i < M / 2; i++) { twr[i] = Math.cos((-2 * Math.PI * i) / M); twi[i] = Math.sin((-2 * Math.PI * i) / M); }
function fft2(re, im) { // in place, forward
  for (let i = 0; i < M; i++) { const j = rev[i]; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2, step = M / 2; len <= M; len <<= 1, step >>= 1) {
    const half = len >> 1;
    for (let i = 0; i < M; i += len) for (let j = 0, k = 0; j < half; j++, k += step) {
      const a = i + j, b = a + half, wr = twr[k], wi = twi[k];
      const tr = re[b] * wr - im[b] * wi, ti = re[b] * wi + im[b] * wr;
      re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; } }
}
// ---- Bluestein DFT of size NFFT ----
const cwr = new Float64Array(NFFT), cwi = new Float64Array(NFFT);
for (let k = 0; k < NFFT; k++) { const a = (Math.PI * ((k * k) % (2 * NFFT))) / NFFT; cwr[k] = Math.cos(a); cwi[k] = -Math.sin(a); } // w = exp(-i pi k^2/N)
const Bre = new Float64Array(M), Bim = new Float64Array(M);
for (let k = 0; k < NFFT; k++) { Bre[k] = cwr[k]; Bim[k] = -cwi[k]; if (k) { Bre[M - k] = cwr[k]; Bim[M - k] = -cwi[k]; } }
fft2(Bre, Bim);
const Are = new Float64Array(M), Aim = new Float64Array(M);
function dft(xr, xi, outR, outI) { // forward DFT size NFFT
  Are.fill(0); Aim.fill(0);
  for (let k = 0; k < NFFT; k++) { Are[k] = xr[k] * cwr[k] - xi[k] * cwi[k]; Aim[k] = xr[k] * cwi[k] + xi[k] * cwr[k]; }
  fft2(Are, Aim);
  for (let k = 0; k < M; k++) { const r = Are[k] * Bre[k] - Aim[k] * Bim[k], i = Are[k] * Bim[k] + Aim[k] * Bre[k]; Are[k] = r; Aim[k] = -i; } // conj for inverse
  fft2(Are, Aim); // inverse via conj trick: ifft(z) = conj(fft(conj z))/M
  for (let k = 0; k < NFFT; k++) { const r = Are[k] / M, i = -Aim[k] / M; outR[k] = r * cwr[k] - i * cwi[k]; outI[k] = r * cwi[k] + i * cwr[k]; }
}
const win = new Float64Array(NFFT); for (let n = 0; n < NFFT; n++) win[n] = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / NFFT);
// STFT of a stereo chunk (CHUNK samples each) -> Float32Array [4, DIMF, DIMT]
const fr = new Float64Array(NFFT), fi = new Float64Array(NFFT), Zr = new Float64Array(NFFT), Zi = new Float64Array(NFFT);
function stft(L, R) {
  const out = new Float32Array(4 * DIMF * DIMT), P = NFFT / 2, n = L.length;
  const at = (x, j) => { j -= P; if (j < 0) j = -j; if (j >= n) j = 2 * (n - 1) - j; return x[j]; };
  for (let t = 0; t < DIMT; t++) {
    for (let k = 0; k < NFFT; k++) { fr[k] = at(L, t * HOP + k) * win[k]; fi[k] = at(R, t * HOP + k) * win[k]; }
    dft(fr, fi, Zr, Zi);
    for (let k = 3; k < DIMF; k++) { const nk = (NFFT - k) % NFFT;
      const lr = (Zr[k] + Zr[nk]) / 2, li = (Zi[k] - Zi[nk]) / 2; // X_L = (Z[k] + conj Z[N-k])/2
      const rr = (Zi[k] + Zi[nk]) / 2, ri = -(Zr[k] - Zr[nk]) / 2; // X_R = (Z[k] - conj Z[N-k])/(2i)
      out[(0 * DIMF + k) * DIMT + t] = lr; out[(1 * DIMF + k) * DIMT + t] = li; out[(2 * DIMF + k) * DIMT + t] = rr; out[(3 * DIMF + k) * DIMT + t] = ri; }
  }
  return out;
}
function istft(spec) { // spec [4, DIMF, DIMT] -> [L, R] of length CHUNK
  const total = NFFT + HOP * (DIMT - 1);
  const yl = new Float64Array(total), yr = new Float64Array(total), env = new Float64Array(total);
  const Xr = new Float64Array(NFFT), Xi = new Float64Array(NFFT);
  for (let t = 0; t < DIMT; t++) {
    // build Z = X_L + i X_R over full spectrum (Hermitian for each), then x = IDFT(Z): re = xL, im = xR
    Xr.fill(0); Xi.fill(0);
    for (let k = 0; k < DIMF; k++) {
      const lr = spec[(0 * DIMF + k) * DIMT + t], li = spec[(1 * DIMF + k) * DIMT + t], rr = spec[(2 * DIMF + k) * DIMT + t], ri = spec[(3 * DIMF + k) * DIMT + t];
      // Z[k] = XL[k] + i XR[k]
      Xr[k] += lr - ri; Xi[k] += li + rr;
      if (k > 0) { const nk = NFFT - k; // XL[N-k] = conj XL[k], XR[N-k] = conj XR[k]; Z[N-k] = conj XL + i conj XR
        Xr[nk] += lr + ri; Xi[nk] += -li + rr; }
    }
    // inverse DFT: x = conj(DFT(conj(Z)))/N
    for (let k = 0; k < NFFT; k++) Xi[k] = -Xi[k];
    dft(Xr, Xi, Zr, Zi);
    for (let k = 0; k < NFFT; k++) { const xl = Zr[k] / NFFT, xr = -Zi[k] / NFFT; const o = t * HOP + k;
      yl[o] += xl * win[k]; yr[o] += xr * win[k]; env[o] += win[k] * win[k]; }
  }
  const L = new Float32Array(CHUNK), R = new Float32Array(CHUNK);
  for (let i = 0; i < CHUNK; i++) { const o = i + NFFT / 2, e = env[o] > 1e-11 ? env[o] : 1; L[i] = yl[o] / e; R[i] = yr[o] / e; }
  return [L, R];
}
const [IN, MODEL, OUT] = process.argv.slice(2);
const buf = fs.readFileSync(IN);
const mix = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
const n = mix.length / 2;
const pad = GEN - (n % GEN);
const PL = new Float32Array(TRIM + n + pad + TRIM), PR = new Float32Array(PL.length);
for (let i = 0; i < n; i++) { PL[TRIM + i] = mix[2 * i]; PR[TRIM + i] = mix[2 * i + 1]; }
const sess = await ort.InferenceSession.create(MODEL, { intraOpNumThreads: 8 });
const outL = new Float32Array(n + pad), outR = new Float32Array(n + pad);
const t0 = Date.now();
for (let i = 0, c = 0; i < n + pad; i += GEN, c++) {
  const spec = stft(PL.subarray(i, i + CHUNK), PR.subarray(i, i + CHUNK));
  const res = await sess.run({ input: new ort.Tensor("float32", spec, [1, 4, DIMF, DIMT]) });
  const [L, R] = istft(res.output.data);
  outL.set(L.subarray(TRIM, CHUNK - TRIM), i); outR.set(R.subarray(TRIM, CHUNK - TRIM), i);
  console.error(`chunk ${c} @${(i / 44100).toFixed(1)}s ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
const o = new Float32Array(2 * n); for (let i = 0; i < n; i++) { o[2 * i] = outL[i] * 1.009; o[2 * i + 1] = outR[i] * 1.009; }
fs.writeFileSync(OUT, Buffer.from(o.buffer));
console.error("done");
