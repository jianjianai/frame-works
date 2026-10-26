// 《引力》的合成音效：29 个短音效和循环环境声，全部用数学合成为立体声 PCM（48 kHz），
// 在 audio.json 里作为 module "sfx" 的生成音源摆放（trackId 就是文件末尾 createPcmAudio 里的名字）。
// - 每个声音有自己的固定种子：什么时候生成、按什么顺序生成，结果都一模一样。
// - 导入时只定义函数；第一次准备音频时才计算。
// - 峰值统一归一到约 -3 dBFS（0.7），音量用片段 gain 调；150 Hz 以下左右声道相同（低频单声道）。
// - 主击（重音）在 0 秒；例外：whoosh 最响在 0.38 秒、flare 的「轰」在 0.55 秒、door 关上在 0.6 秒、swish 最响在 0.12 秒、
//   skid 停住在 0.22 秒、warm 最亮在约 0.05 秒、rise 最响在 1.45 秒；iron（第二幕：夺过哑铃）、chain（抓起铁链）、snap（红线绷断）主击 0 秒；hollow（空靴筒）两下在 0 和 0.07 秒。
// - 只生成作品里实际放了的音效（lazy）。
// - hum / crowd / wind / tram 首尾无缝，片段可以设 loop = 素材长度（8 / 10 / 8 / 6 秒）。
// - 生成音源不支持片段的 pitch（半音移调）；要变调用片段的 rate（同时变速）。
import { createAudioRack } from "@frame/engine/audio-adapters";
import { createPcmAudio } from "@frame/engine/procedural-audio";

const SR = 48000;
const TAU = Math.PI * 2;
const LN1000 = Math.log(1000); // 衰减 60 dB
type Pcm = [Float32Array, Float32Array];
type Rand = () => number;
type Env = (t: number) => number;
/** 振动模态：[频率 Hz, 幅度, 衰减 60 dB 用的秒数] */
type Mode = [number, number, number];

// ———————————————— 基础工具 ————————————————

/** mulberry32：固定种子的伪随机数，返回 [0, 1) */
function prng(seed: number): Rand {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const span = (r: Rand, a: number, b: number) => a + (b - a) * r();
const samples = (sec: number) => Math.round(sec * SR);
const stereo = (sec: number): Pcm => [new Float32Array(samples(sec)), new Float32Array(samples(sec))];
/** 等功率声像：-1 左 … 1 右，居中时左右增益都是 1 */
function panGains(pan: number): [number, number] {
  const a = ((pan + 1) * Math.PI) / 4;
  return [Math.cos(a) * Math.SQRT2, Math.sin(a) * Math.SQRT2];
}
/** 指数衰减：t60 秒衰减 60 dB（t < 0 时为 0） */
const fall = (t: number, t60: number) => (t < 0 ? 0 : Math.exp((-LN1000 * t) / t60));
/** 用半个余弦升起 attack 秒，再按 t60 衰减 */
const hit = (t: number, attack: number, t60: number) =>
  t < 0 ? 0 : t < attack ? 0.5 - 0.5 * Math.cos((Math.PI * t) / attack) : fall(t - attack, t60);
/** 平滑的 0→1 过渡 */
function ramp(a: number, b: number, x: number) {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
}
function peakOf(a: Float32Array, b: Float32Array) {
  let p = 0;
  for (let i = 0; i < a.length; i++) p = Math.max(p, Math.abs(a[i]), Math.abs(b[i]));
  return p;
}

/**
 * 原地滤波（TPT 状态变量滤波器，频率每 16 个采样改一次也稳定）：
 * lp 低通 / bp 带通（中心增益 1）/ hp 高通；freq 可以是随时间变化的函数；order 级串联（更陡）。
 */
function filt(x: Float32Array, kind: "lp" | "bp" | "hp", freq: number | Env, q = Math.SQRT1_2, order = 1): Float32Array {
  const fn = typeof freq === "function" ? freq : undefined,
    k = 1 / q,
    n = x.length,
    block = fn ? 32 : n;
  for (let o = 0; o < order; o++) {
    let ic1 = 0,
      ic2 = 0;
    for (let b = 0; b < n; b += block) {
      const g = Math.tan((Math.PI * Math.min(Math.max(fn ? fn(b / SR) : (freq as number), 10), SR * 0.46)) / SR),
        a1 = 1 / (1 + g * (g + k)),
        a2 = g * a1,
        a3 = g * a2,
        end = Math.min(n, b + block);
      if (kind === "lp")
        for (let i = b; i < end; i++) {
          const v3 = x[i] - ic2,
            v1 = a1 * ic1 + a2 * v3,
            v2 = ic2 + a2 * ic1 + a3 * v3;
          ic1 = 2 * v1 - ic1;
          ic2 = 2 * v2 - ic2;
          x[i] = v2;
        }
      else if (kind === "bp")
        for (let i = b; i < end; i++) {
          const v3 = x[i] - ic2,
            v1 = a1 * ic1 + a2 * v3,
            v2 = ic2 + a2 * ic1 + a3 * v3;
          ic1 = 2 * v1 - ic1;
          ic2 = 2 * v2 - ic2;
          x[i] = k * v1;
        }
      else
        for (let i = b; i < end; i++) {
          const v0 = x[i],
            v3 = v0 - ic2,
            v1 = a1 * ic1 + a2 * v3,
            v2 = ic2 + a2 * ic1 + a3 * v3;
          ic1 = 2 * v1 - ic1;
          ic2 = 2 * v2 - ic2;
          x[i] = v0 - k * v1 - v2;
        }
    }
  }
  return x;
}

/** 白噪声 [-1, 1)：从 r 取一个种子，再用 xorshift32 快速生成（仍然完全确定） */
function white(len: number, r: Rand): Float32Array {
  const x = new Float32Array(len);
  let s = (r() * 4294967296) >>> 0 || 0x9e3779b9;
  for (let i = 0; i < len; i++) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    x[i] = (s >>> 0) / 2147483648 - 1;
  }
  return x;
}
/** 原地变成粉红噪声（Paul Kellet 近似，状态连续，可以放进 looped） */
function pinkify(x: Float32Array): Float32Array {
  let b0 = 0,
    b1 = 0,
    b2 = 0;
  for (let i = 0; i < x.length; i++) {
    const w = x[i];
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    x[i] = (b0 + b1 + b2 + w * 0.1848) * 0.25;
  }
  return x;
}
/** 原地变成褐噪声（漏积分） */
function brownify(x: Float32Array): Float32Array {
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    y = (y + 0.02 * x[i]) / 1.02;
    x[i] = y * 3.5;
  }
  return x;
}
const pink = (len: number, r: Rand) => pinkify(white(len, r));
const copy = (x: Float32Array) => Float32Array.from(x);

/** 归一到均方根 rms（噪声层先归一，几层之间的比例才好比较） */
function level(x: Float32Array, rms = 0.3): Float32Array {
  let e = 0;
  for (let i = 0; i < x.length; i++) e += x[i] * x[i];
  const g = e > 0 ? rms / Math.sqrt(e / x.length) : 0;
  for (let i = 0; i < x.length; i++) x[i] *= g;
  return x;
}
/** 原地乘包络 env(t) */
function shape(x: Float32Array, env: Env): Float32Array {
  for (let i = 0; i < x.length; i++) x[i] *= env(i / SR);
  return x;
}
/** 把 src 加到 dst 的 at 秒处 */
function mix(dst: Float32Array, src: Float32Array, gain = 1, at = 0): Float32Array {
  const s0 = Math.round(at * SR),
    end = Math.min(src.length, dst.length - s0);
  for (let i = Math.max(0, -s0); i < end; i++) dst[s0 + i] += src[i] * gain;
  return dst;
}
/** 一层（两个声道）缩放到峰值 p 后加进 L/R：每层的 p 就是它在这个声音里的分量 */
function layer(L: Float32Array, R: Float32Array, a: Float32Array, b: Float32Array, p: number) {
  const g = p / (peakOf(a, b) || 1);
  for (let i = 0; i < L.length; i++) {
    L[i] += a[i] * g;
    R[i] += b[i] * g;
  }
}
/** 单声道层缩放到峰值 p 后放进左右（pan 声像） */
function layerMono(L: Float32Array, R: Float32Array, x: Float32Array, p: number, pan = 0) {
  const [gl, gr] = panGains(pan);
  layer(L, R, x.map((v) => v * gl), x.map((v) => v * gr), p);
}
/** 频率随时间滑动的正弦（相位累加） */
function sine(len: number, freq: Env, env: Env, phase = 0): Float32Array {
  const x = new Float32Array(len);
  let ph = phase;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    x[i] = Math.sin(ph) * env(t);
    ph += (TAU * freq(t)) / SR;
  }
  return x;
}
/** 软饱和：峰值 1 仍是 1，小信号相对抬高，带出奇次泛音（低频在手机外放上也听得见） */
function saturate(x: Float32Array, drive: number): Float32Array {
  const n = Math.tanh(drive);
  for (let i = 0; i < x.length; i++) x[i] = Math.tanh(drive * x[i]) / n;
  return x;
}

/**
 * 一个振动模态：at 秒被敲响、t60 秒衰减 60 dB 的正弦（带衰减的复数旋转递推；t60 = Infinity 时是不衰减的纯音）。
 * wrap：越过结尾的部分绕回开头（循环素材）。
 */
function ring(out: Float32Array, at: number, freq: number, amp: number, t60: number, phase = 0, wrap = false) {
  const N = out.length,
    s0 = Math.round(at * SR);
  if (freq <= 0 || freq >= SR * 0.45 || !amp || s0 >= N || s0 < 0) return;
  const total = Math.min(Math.ceil(t60 * 1.1 * SR), wrap ? N : N - s0),
    head = Math.min(total, N - s0);
  const w = (TAU * freq) / SR,
    d = Math.exp(-LN1000 / (t60 * SR)),
    c = d * Math.cos(w),
    s = d * Math.sin(w);
  let re = amp * Math.cos(phase),
    im = amp * Math.sin(phase);
  for (let i = 0; i < head; i++) {
    out[s0 + i] += im;
    const nr = re * c - im * s;
    im = re * s + im * c;
    re = nr;
  }
  for (let i = 0; i < total - head; i++) {
    out[i] += im;
    const nr = re * c - im * s;
    im = re * s + im * c;
    re = nr;
  }
}
interface StrikeOptions {
  pan?: number;
  /** 左右差异：高处的模态左右相位、频率略有不同（0 = 完全相同） */
  width?: number;
  /** 每个模态旁再加一个略高的模态（幅度比例），两者相拍，听起来才像金属 */
  pairs?: number;
  wrap?: boolean;
}
/** 敲响一组模态（300 Hz 以下两声道相同） */
function strike(L: Float32Array, R: Float32Array, at: number, modes: Mode[], gain: number, r: Rand, o: StrikeOptions = {}) {
  const [gl, gr] = panGains(o.pan ?? 0),
    width = o.width ?? 0.4,
    pairs = o.pairs ?? 0.4;
  for (const [f, a, t60] of modes) {
    const amp = a * gain;
    if (f < 300) {
      ring(L, at, f, amp * gl, t60, 0, o.wrap);
      ring(R, at, f, amp * gr, t60, 0, o.wrap);
      continue;
    }
    const ph = r() * TAU,
      dph = width * (r() - 0.5),
      fr = f * (1 + width * 0.001 * (r() - 0.5));
    ring(L, at, f, amp * gl, t60, ph, o.wrap);
    ring(R, at, fr, amp * gr, t60, ph + dph, o.wrap);
    if (pairs > 0) {
      const f2 = f * (1 + span(r, 0.0015, 0.006)),
        ph2 = r() * TAU;
      ring(L, at, f2, amp * pairs * gl, t60 * 0.8, ph2, o.wrap);
      ring(R, at, (f2 * fr) / f, amp * pairs * gr, t60 * 0.8, ph2 + dph, o.wrap);
    }
  }
}
/** 一个模态被敲了好几下：只递推一遍，每次敲击把新的振动（幅度 amp、相位 ph）加进当前状态。hits 按时间排好 */
function phasor(out: Float32Array, freq: number, t60: number, hits: { s: number; amp: number; ph: number }[], dph: number) {
  const N = out.length,
    w = (TAU * freq) / SR,
    d = Math.exp(-LN1000 / (t60 * SR)),
    c = d * Math.cos(w),
    s = d * Math.sin(w),
    tail = Math.ceil(t60 * 1.1 * SR);
  let re = 0,
    im = 0;
  for (let h = 0; h < hits.length && hits[h].s < N; h++) {
    re += hits[h].amp * Math.cos(hits[h].ph + dph);
    im += hits[h].amp * Math.sin(hits[h].ph + dph);
    const end = Math.min(N, h + 1 < hits.length ? hits[h + 1].s : hits[h].s + tail);
    for (let i = hits[h].s; i < end; i++) {
      out[i] += im;
      const nr = re * c - im * s;
      im = re * s + im * c;
      re = nr;
    }
  }
}
/**
 * 同一组模态被敲好几下（灰锭弹跳、铃铛里的小珠子）：hits = [秒, 力度, 随机幅度 ±vary]（按时间排好）。
 * 每次敲到的位置不同，各模态的幅度随机变化；300 Hz 以下两声道相同。
 */
function strikes(L: Float32Array, R: Float32Array, hits: [number, number, number][], modes: Mode[], r: Rand, o: StrikeOptions = {}) {
  const width = o.width ?? 0.4,
    pairs = o.pairs ?? 0.4;
  for (const [f, a, t60] of modes) {
    const inject = hits.map(([at, g, vary]) => ({ s: samples(at), amp: a * g * (1 + vary * (2 * r() - 1)), ph: f < 300 ? 0 : r() * TAU }));
    if (f < 300) {
      phasor(L, f, t60, inject, 0);
      phasor(R, f, t60, inject, 0);
      continue;
    }
    const dph = width * (r() - 0.5),
      fr = f * (1 + width * 0.001 * (r() - 0.5));
    phasor(L, f, t60, inject, 0);
    phasor(R, fr, t60, inject, dph);
    if (pairs > 0) {
      const f2 = f * (1 + span(r, 0.0015, 0.006)),
        inj2 = inject.map((h) => ({ s: h.s, amp: h.amp * pairs, ph: r() * TAU }));
      phasor(L, f2, t60 * 0.8, inj2, 0);
      phasor(R, (f2 * fr) / f, t60 * 0.8, inj2, dph);
    }
  }
}
/** 接触脉冲：at 秒处宽 width 秒的半个正弦（面积 ≈ amp）。宽 = 软（指节、木头），窄 = 硬 */
function pulse(x: Float32Array, at: number, width: number, amp = 1) {
  const s0 = Math.round(at * SR),
    w = Math.max(2, Math.round(width * SR));
  for (let i = 0; i < w && s0 + i < x.length; i++) x[s0 + i] += ((amp * Math.PI) / (2 * w)) * Math.sin((Math.PI * (i + 0.5)) / w);
}
/** 激励送进一组二阶共振器（模态）：单位冲激时每个模态的峰值 ≈ 它的幅度；300 Hz 以下两声道相同 */
function resonate(exc: Float32Array, modes: Mode[], L: Float32Array, R: Float32Array, gain: number, r: Rand, width = 0.3) {
  for (const [f, a, t60] of modes) {
    const w = (TAU * f) / SR,
      rr = Math.exp(-LN1000 / (t60 * SR));
    const c1 = 2 * rr * Math.cos(w),
      c2 = -rr * rr,
      b0 = a * gain * Math.sin(w);
    const [gl, gr] = f < 300 ? [1, 1] : panGains(span(r, -width, width));
    let y1 = 0,
      y2 = 0;
    for (let i = 0; i < exc.length; i++) {
      const y = b0 * exc[i] + c1 * y1 + c2 * y2;
      y2 = y1;
      y1 = y;
      L[i] += y * gl;
      R[i] += y * gr;
    }
  }
}
/** 一粒短噪声（石子、碎屑、噼啪），同一份噪声按 gl / gr 写进左右 */
function burst(L: Float32Array, R: Float32Array, at: number, gl: number, gr: number, t60: number, r: Rand, wrap = false) {
  const N = L.length,
    s0 = Math.round(at * SR),
    len = Math.min(Math.ceil(t60 * SR), N),
    d = Math.exp(-LN1000 / (t60 * SR));
  let g = 1;
  for (let i = 0; i < len; i++) {
    let k = s0 + i;
    if (k >= N) {
      if (!wrap) break;
      k -= N;
    }
    const v = (r() * 2 - 1) * g;
    L[k] += v * gl;
    R[k] += v * gr;
    g *= d;
  }
}
/** 在 [t0, t1) 内按密度 rate(t)（每秒几粒）随机撒短噪声颗粒：幅度 amp(t) 乘长尾随机数（大多很轻，偶尔一粒很响），声像在 ±width 内 */
function scatter(L: Float32Array, R: Float32Array, t0: number, t1: number, rate: Env, amp: Env, t60: number, r: Rand, width = 0.6, wrap = false) {
  let t = t0;
  for (;;) {
    t += -Math.log(1 - r()) / Math.max(rate(t), 0.01);
    if (t >= t1) return;
    const a = amp(t) * (0.12 + 0.88 * Math.pow(r(), 2.5));
    const [gl, gr] = panGains(span(r, -width, width));
    burst(L, R, t, a * gl, a * gr, t60 * span(r, 0.6, 1.5), r, wrap);
  }
}
/** 平滑的随机曲线（0..1）：points 段铺满 len，Catmull-Rom 插值；loop 时首尾相接 */
function wander(len: number, points: number, r: Rand, loop = false): Float32Array {
  const cp = Array.from({ length: points + 1 }, () => r());
  const at = (k: number) => (loop ? cp[((k % points) + points) % points] : cp[Math.min(Math.max(k, 0), points)]);
  const out = new Float32Array(len);
  for (let k = 0; k < points; k++) {
    const p0 = at(k - 1),
      p1 = at(k),
      p2 = at(k + 1),
      p3 = at(k + 2);
    const c1 = 0.5 * (p2 - p0),
      c2 = 0.5 * (2 * p0 - 5 * p1 + 4 * p2 - p3),
      c3 = 0.5 * (3 * p1 - p0 - 3 * p2 + p3);
    const start = Math.ceil((k * len) / points),
      end = Math.min(len, Math.ceil(((k + 1) * len) / points)),
      du = points / len;
    let u = start * du - k;
    for (let i = start; i < end; i++, u += du) {
      const v = p1 + u * (c1 + u * (c2 + u * c3));
      out[i] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
  }
  return out;
}
/**
 * 循环素材：先把结尾 pre 秒接在前面预热（滤波、混响的状态绕回来），再处理整段——首尾无缝。
 * fn 的第二个参数把处理时的时间换算成循环里的采样序号（给随时间变化的滤波用）。
 */
function looped(x: Float32Array, fn: (y: Float32Array, at: (t: number) => number) => void, pre = 0.5): Float32Array {
  const N = x.length,
    P = Math.min(N, samples(pre)),
    y = new Float32Array(P + N);
  y.set(x.subarray(N - P));
  y.set(x, P);
  fn(y, (t) => (((Math.round(t * SR) - P) % N) + N) % N);
  x.set(y.subarray(P));
  return x;
}

interface Space {
  /** 混响时间（秒） */
  rt60: number;
  /** 湿声能量 ≈ wet² × 送进去的能量 */
  wet: number;
  /** 房间大小（延迟线长度的比例） */
  size?: number;
  /** 高频阻尼 0..0.5 */
  damp?: number;
  /** 预延迟（秒） */
  pre?: number;
  /** 这个频率以下不进混响（低频保持干净、单声道） */
  hp?: number;
}
const COMBS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
const ALLPASSES = [556, 441, 341, 225];
/** 立体声混响（Freeverb 结构，左右延迟错开），返回湿声 */
function reverb(L: Float32Array, R: Float32Array, o: Space): Pcm {
  const len = L.length,
    pre = samples(o.pre ?? 0.01),
    x = new Float32Array(len);
  for (let i = pre; i < len; i++) x[i] = (L[i - pre] + R[i - pre]) * 0.5;
  filt(x, "hp", o.hp ?? 200);
  const scale = (SR / 44100) * (o.size ?? 1),
    damp = o.damp ?? 0.3;
  const wet: Pcm = [new Float32Array(len), new Float32Array(len)];
  for (let ch = 0; ch < 2; ch++) {
    const y = wet[ch];
    for (const base of COMBS) {
      const D = Math.max(8, Math.round((base + ch * 23) * scale)),
        buf = new Float32Array(D),
        g = Math.pow(10, (-3 * D) / (o.rt60 * SR));
      let j = 0,
        store = 0;
      for (let k = 0; k < len; k++) {
        const out = buf[j];
        store = out * (1 - damp) + store * damp;
        buf[j] = x[k] + store * g;
        if (++j === D) j = 0;
        y[k] += out;
      }
    }
    for (const base of ALLPASSES) {
      const D = Math.max(4, Math.round((base + ch * 23) * scale)),
        buf = new Float32Array(D);
      let j = 0;
      for (let k = 0; k < len; k++) {
        const out = buf[j],
          v = y[k];
        buf[j] = v + out * 0.5;
        y[k] = out - v;
        if (++j === D) j = 0;
      }
    }
  }
  let ein = 0,
    eout = 0;
  for (let i = 0; i < len; i++) {
    ein += x[i] * x[i];
    eout += wet[0][i] * wet[0][i] + wet[1][i] * wet[1][i];
  }
  const g = eout > 0 ? o.wet * Math.sqrt((2 * ein) / eout) : 0;
  for (let i = 0; i < len; i++) {
    wet[0][i] *= g;
    wet[1][i] *= g;
  }
  return wet;
}
/** 加混响（一次性音效） */
function space(L: Float32Array, R: Float32Array, o: Space) {
  const [wl, wr] = reverb(L, R, o);
  mix(L, wl);
  mix(R, wr);
}
/** 循环素材的混响湿声：结尾一段先接在前面预热，尾巴绕回开头 */
function loopReverb(L: Float32Array, R: Float32Array, o: Space): Pcm {
  const N = L.length,
    P = Math.min(N, samples(o.rt60 + 0.3)),
    L2 = new Float32Array(P + N),
    R2 = new Float32Array(P + N);
  L2.set(L.subarray(N - P));
  L2.set(L, P);
  R2.set(R.subarray(N - P));
  R2.set(R, P);
  const [wl, wr] = reverb(L2, R2, o);
  return [wl.slice(P), wr.slice(P)];
}
/** 几次离散的早期反射（街两边的墙）：[延迟秒, 左, 右]，只反射 hp 以上 */
function echoes(L: Float32Array, R: Float32Array, taps: [number, number, number][], hp = 250) {
  const x = new Float32Array(L.length);
  for (let i = 0; i < x.length; i++) x[i] = (L[i] + R[i]) * 0.5;
  filt(x, "hp", hp);
  for (const [d, gl, gr] of taps) {
    const s0 = samples(d);
    for (let i = s0; i < x.length; i++) {
      L[i] += x[i - s0] * gl;
      R[i] += x[i - s0] * gr;
    }
  }
}

interface Finish {
  /** 结尾淡出秒数（一次性音效） */
  fadeOut?: number;
  /** 整体软饱和（让撞击更结实；0 = 不加） */
  glue?: number;
  /** 循环素材：不淡入淡出，滤波按循环处理 */
  loop?: boolean;
}
/** 收尾：低频并成单声道、去掉次声、软饱和、首尾防爆音、峰值归一到 0.7（约 -3 dBFS） */
function finish(L: Float32Array, R: Float32Array, o: Finish = {}): Pcm {
  const len = L.length,
    mid = new Float32Array(len),
    side = new Float32Array(len);
  // 万一哪里算出了无效值，先清掉（正常情况下不会有，峰值是有限数就跳过这一遍）
  if (!Number.isFinite(peakOf(L, R)))
    for (let i = 0; i < len; i++) {
      if (!Number.isFinite(L[i])) L[i] = 0;
      if (!Number.isFinite(R[i])) R[i] = 0;
    }
  for (let i = 0; i < len; i++) {
    mid[i] = (L[i] + R[i]) * 0.5;
    side[i] = (L[i] - R[i]) * 0.5;
  }
  const run = (x: Float32Array, fn: (y: Float32Array) => void) => (o.loop ? looped(x, fn) : fn(x));
  run(mid, (y) => filt(y, "hp", 22));
  run(side, (y) => filt(y, "hp", 150, Math.SQRT1_2, 2));
  for (let i = 0; i < len; i++) {
    L[i] = mid[i] + side[i];
    R[i] = mid[i] - side[i];
  }
  if (o.glue) {
    const p = peakOf(L, R) || 1,
      n = Math.tanh(o.glue);
    for (let i = 0; i < len; i++) {
      L[i] = Math.tanh((o.glue * L[i]) / p) / n;
      R[i] = Math.tanh((o.glue * R[i]) / p) / n;
    }
  }
  if (!o.loop) {
    const fi = samples(0.0004),
      fo = Math.min(len, samples(o.fadeOut ?? 0.04));
    for (let i = 0; i < fi; i++) {
      const g = 0.5 - 0.5 * Math.cos((Math.PI * i) / fi);
      L[i] *= g;
      R[i] *= g;
    }
    for (let i = 0; i < fo; i++) {
      const g = 0.5 - 0.5 * Math.cos((Math.PI * i) / fo);
      L[len - 1 - i] *= g;
      R[len - 1 - i] *= g;
    }
  }
  const p = peakOf(L, R),
    g = p > 0 ? 0.7 / p : 0;
  for (let i = 0; i < len; i++) {
    L[i] *= g;
    R[i] *= g;
  }
  return [L, R];
}

// ———————————————— 脚步 ————————————————

interface Foot {
  seed: number;
  dur: number;
  /** 低频「咚」：[起始 Hz, 落到 Hz, 下滑时间常数, t60] */
  sub: [number, number, number, number];
  drive: number;
  /** 胸腔感的身体：[起始 Hz, 落到 Hz, t60] */
  body: [number, number, number];
  /** 铁靴外壳的模态 */
  clank: Mode[];
  /** 各层峰值 */
  mix: { sub: number; body: number; puff: number; clank: number; crack: number; crunch: number; rattle: number };
  /** 靴子里晃动的石子颗数 */
  stones: number;
  room: number;
  fadeOut: number;
}
function foot(s: Foot): Pcm {
  const r = prng(s.seed);
  const [L, R] = stereo(s.dur);
  const len = L.length;
  // 低频「咚」：下滑的正弦，软饱和带出能在手机上听见的泛音
  const [f0, f1, glide, subT60] = s.sub;
  layerMono(L, R, saturate(sine(len, (t) => f1 + (f0 - f1) * Math.exp(-t / glide), (t) => hit(t, 0.0015, subT60)), s.drive), s.mix.sub);
  // 胸腔感的身体（110–140 Hz），加几个更高的地面模态（手机外放主要靠这一层听见「咚」）
  const [b0, b1, bT60] = s.body;
  const body = sine(len, (t) => b1 + (b0 - b1) * Math.exp(-t / 0.03), (t) => hit(t, 0.001, bT60), 0.5);
  ring(body, 0, b1 * 1.53, 0.5, bT60 * 0.65);
  ring(body, 0, b1 * 2.11, 0.35, bT60 * 0.45);
  ring(body, 0, b1 * 3.04, 0.2, bT60 * 0.3);
  layerMono(L, R, body, s.mix.body);
  // 踩起一团灰：低通粉红噪声的闷「噗」
  layerMono(L, R, shape(level(filt(pink(len, r), "lp", 480, 0.6, 2)), (t) => hit(t, 0.003, 0.15)), s.mix.puff);
  // 铁靴外壳的闷「当」：里面塞满石子，衰减很快
  const cl = new Float32Array(len),
    cr = new Float32Array(len);
  strike(cl, cr, 0, s.clank, 1, r, { width: 0.5, pairs: 0.35 });
  layer(L, R, cl, cr, s.mix.clank);
  // 鞋底砸上石板的硬瞬态
  layerMono(L, R, shape(level(filt(white(len, r), "hp", 1500)), (t) => hit(t, 0.0002, 0.02)), s.mix.crack);
  // 石板和灰里的砂砾被碾碎：带通噪声 + 稀疏的碎粒
  const gl = new Float32Array(len),
    gr = new Float32Array(len);
  scatter(gl, gr, 0.0005, 0.1, (t) => 1500 * fall(t, 0.07), (t) => fall(t, 0.1), 0.0012, r, 0.5);
  const crunch = shape(level(filt(white(len, r), "bp", 1500, 1.1)), (t) => hit(t, 0.0008, 0.07));
  for (let i = 0; i < len; i++) {
    gl[i] += crunch[i] * 0.3;
    gr[i] += crunch[i] * 0.3;
  }
  filt(gl, "bp", 2000, 0.8);
  filt(gr, "bp", 2000, 0.8);
  layer(L, R, gl, gr, s.mix.crunch);
  // 靴子里的石子晃一下：20–60 ms 后几颗小「嗒」
  const rl = new Float32Array(len),
    rr = new Float32Array(len);
  for (let j = 0; j < s.stones; j++) {
    const at = 0.02 + (0.04 * (j + r())) / s.stones,
      a = span(r, 0.5, 1) * (1 - 0.1 * j),
      pan = span(r, -0.5, 0.5),
      f = span(r, 2300, 4300);
    strike(rl, rr, at, [[f, a, 0.016], [f * span(r, 1.35, 1.7), a * 0.6, 0.01]], 1, r, { pan, pairs: 0 });
    const [pl, pr] = panGains(pan);
    burst(rl, rr, at, a * 0.8 * pl, a * 0.8 * pr, 0.003, r);
  }
  filt(rl, "hp", 1500);
  filt(rr, "hp", 1500);
  layer(L, R, rl, rr, s.mix.rattle);
  // 街两边的墙弹回来一点，再加一点空间（低频不进混响）
  echoes(L, R, [[0.031, 0.08, 0.05], [0.046, 0.04, 0.07], [0.077, 0.035, 0.035]]);
  space(L, R, { rt60: 0.9, wet: s.room, size: 1.1, damp: 0.35, pre: 0.012, hp: 220 });
  return finish(L, R, { fadeOut: s.fadeOut, glue: 1.2 });
}

/** 1. 她的铁靴（塞满石子）跺在石板上：标志性的「咚」。1 秒，主击 0 秒。 */
const stomp = () =>
  foot({
    seed: 0x5701,
    dur: 1,
    sub: [70, 38, 0.045, 0.42],
    drive: 1.6,
    body: [134, 112, 0.26],
    clank: [
      [520, 1, 0.2],
      [968, 0.85, 0.16],
      [1634, 0.65, 0.12],
      [2412, 0.45, 0.085],
      [3290, 0.28, 0.06],
      [4210, 0.18, 0.045],
    ],
    mix: { sub: 1, body: 1, puff: 0.4, clank: 0.75, crack: 0.45, crunch: 0.5, rattle: 0.14 },
    stones: 5,
    room: 0.2,
    fadeOut: 0.12,
  });

/** 2. 平常走路的一步（也用作别人的铁底鞋，调低音量）：低频少、更短、「当」更轻。0.45 秒，主击 0 秒。 */
const step = () =>
  foot({
    seed: 0x5702,
    dur: 0.45,
    sub: [84, 52, 0.035, 0.28],
    drive: 1.5,
    body: [152, 128, 0.16],
    clank: [
      [560, 1, 0.14],
      [1042, 0.8, 0.11],
      [1718, 0.6, 0.08],
      [2560, 0.4, 0.06],
      [3480, 0.22, 0.045],
    ],
    mix: { sub: 0.45, body: 0.75, puff: 0.3, clank: 0.6, crack: 0.45, crunch: 0.45, rattle: 0.1 },
    stones: 3,
    room: 0.16,
    fadeOut: 0.06,
  });

// ———————————————— 物件 ————————————————

/** 3. 十斤重的灰锭从九十八层掉下来砸在石头地上：猛烈的金属撞击 + 约 1.5 秒的不谐和余振 + 碎石。1.8 秒，主击 0 秒。 */
function clang(): Pcm {
  const r = prng(0xc1a6);
  const [L, R] = stereo(1.8);
  const len = L.length;
  // 沉重落地的低频：62 → 34 Hz
  layerMono(L, R, saturate(sine(len, (t) => 34 + 28 * Math.exp(-t / 0.04), (t) => hit(t, 0.001, 0.55)), 2), 1);
  // 石头地面被砸出的闷响
  const floor = new Float32Array(len);
  ring(floor, 0, 176, 1, 0.2);
  ring(floor, 0, 263, 0.6, 0.13);
  ring(floor, 0, 397, 0.35, 0.08);
  layerMono(L, R, floor, 0.35);
  // 灰锭：块状铸铁的不谐和模态（低的响两秒多，高的很快消失）；弹起来又砸了几下，每次敲到不同的面
  const ingot: Mode[] = [
    [412, 1, 2.4],
    [781, 0.6, 1.8],
    [1131, 0.9, 2.1],
    [1594, 0.55, 1.5],
    [2214, 0.7, 1.3],
    [2893, 0.4, 1],
    [3662, 0.45, 0.8],
    [4307, 0.3, 0.6],
    [5468, 0.22, 0.45],
    [6630, 0.15, 0.3],
  ];
  const ml = new Float32Array(len),
    mr = new Float32Array(len);
  const hits: [number, number, number][] = [
    [0, 1, 0],
    [0.212, 0.24, 0.73],
    [0.366, 0.1, 0.73],
    [0.471, 0.045, 0.73],
    [0.538, 0.022, 0.73],
  ];
  strikes(ml, mr, hits, ingot, r, { width: 0.6, pairs: 0.45 });
  layer(L, R, ml, mr, 0.85);
  // 撞击的瞬态：高通噪声的「锵」+ 宽带的「砰」，每次弹跳也各有一下
  const tl = new Float32Array(len),
    tr = new Float32Array(len);
  for (const [at, g] of hits) burst(tl, tr, at, g * span(r, 0.8, 1.1), g, at ? 0.02 : 0.035, r);
  filt(tl, "hp", 900);
  filt(tr, "hp", 900);
  layer(L, R, tl, tr, 0.8);
  layerMono(L, R, shape(level(filt(white(len, r), "lp", 3500, 0.7)), (t) => hit(t, 0.0005, 0.09)), 0.55);
  // 石头被砸裂：0–0.16 秒密集的碎粒
  const kl = new Float32Array(len),
    kr = new Float32Array(len);
  scatter(kl, kr, 0.001, 0.16, (t) => 2500 * fall(t, 0.08), (t) => fall(t, 0.15), 0.0015, r, 0.5);
  filt(kl, "bp", 1800, 0.7);
  filt(kr, "bp", 1800, 0.7);
  layer(L, R, kl, kr, 0.4);
  // 碎石四溅，在地上弹跳：每块一串越来越密、越来越轻的「嗒」
  const dl = new Float32Array(len),
    dr = new Float32Array(len);
  for (let k = 0; k < 16; k++) {
    let at = span(r, 0.03, 0.14),
      gap = span(r, 0.06, 0.2),
      a = span(r, 0.4, 1);
    const pan = span(r, -0.8, 0.8),
      f = span(r, 1800, 5200),
      [pl, pr] = panGains(pan);
    while (at < 1.3 && a > 0.05) {
      strike(dl, dr, at, [[f, a, 0.02], [f * 1.53, a * 0.5, 0.014]], 1, r, { pan, pairs: 0 });
      burst(dl, dr, at, a * 0.6 * pl, a * 0.6 * pr, 0.003, r);
      at += gap;
      gap *= span(r, 0.55, 0.75);
      a *= span(r, 0.45, 0.7);
    }
  }
  filt(dl, "hp", 1200);
  filt(dr, "hp", 1200);
  layer(L, R, dl, dr, 0.16);
  // 天井：高而空的回响
  echoes(L, R, [[0.027, 0.06, 0.1], [0.052, 0.08, 0.05]], 300);
  space(L, R, { rt60: 1.7, wet: 0.32, size: 1.25, damp: 0.3, pre: 0.018, hp: 180 });
  return finish(L, R, { fadeOut: 0.3, glue: 1.25 });
}

/** 4. 挂锁「咔」地锁上：明亮的金属瞬态，约 30 ms 后锁舌再咬一下。0.2 秒，主击 0 秒。 */
function click(): Pcm {
  const r = prng(0xc11c);
  const [L, R] = stereo(0.2);
  const len = L.length;
  // 锁体的闷「咯」：给声音一点分量
  const body = new Float32Array(len);
  ring(body, 0, 742, 1, 0.05);
  ring(body, 0, 1287, 0.6, 0.035);
  ring(body, 0.031, 806, 0.35, 0.04);
  layerMono(L, R, body, 0.22);
  // 锁舌弹进去的「咔」：小金属件的高频模态；30 ms 后咬住的第二下更轻、音高略不同
  const ml = new Float32Array(len),
    mr = new Float32Array(len);
  strike(ml, mr, 0, [[2210, 0.7, 0.045], [3480, 1, 0.035], [4870, 0.85, 0.028], [6950, 0.6, 0.02], [9210, 0.4, 0.012]], 1, r, { width: 0.3, pairs: 0.3 });
  strike(ml, mr, 0.031, [[2650, 0.5, 0.03], [4130, 0.6, 0.025], [5760, 0.4, 0.018], [8020, 0.25, 0.01]], 0.4, r, { width: 0.3, pairs: 0.3 });
  layer(L, R, ml, mr, 0.55);
  // 金属相撞的瞬态
  const tl = new Float32Array(len),
    tr = new Float32Array(len);
  burst(tl, tr, 0, 1, 1, 0.006, r);
  burst(tl, tr, 0.031, 0.4, 0.4, 0.004, r);
  burst(tl, tr, 0.0385, 0.12, 0.12, 0.003, r);
  filt(tl, "hp", 2500);
  filt(tr, "hp", 2500);
  layer(L, R, tl, tr, 0.6);
  space(L, R, { rt60: 0.35, wet: 0.12, size: 0.5, damp: 0.25, pre: 0.004, hp: 400 });
  return finish(L, R, { fadeOut: 0.04 });
}

/** 5. 指节敲一下薄薄的旧木门：门板的木头共鸣（180–260 Hz 为主）+ 指节的「嗒」。0.3 秒，主击 0 秒。 */
function knock(): Pcm {
  const r = prng(0x6e0c);
  const [L, R] = stereo(0.3);
  const len = L.length;
  // 软的接触脉冲激起门板的模态
  const exc = new Float32Array(len);
  pulse(exc, 0, 0.0007);
  const wl = new Float32Array(len),
    wr = new Float32Array(len);
  resonate(
    exc,
    [
      [96, 0.35, 0.12],
      [184, 1, 0.16],
      [239, 0.85, 0.13],
      [318, 0.6, 0.1],
      [431, 0.45, 0.075],
      [592, 0.32, 0.055],
      [818, 0.22, 0.04],
      [1135, 0.15, 0.03],
      [1570, 0.1, 0.022],
      [2210, 0.06, 0.015],
    ],
    wl,
    wr,
    1,
    r,
    0.25,
  );
  layer(L, R, wl, wr, 1);
  // 指节本身的「嗒」
  const kl = new Float32Array(len),
    kr = new Float32Array(len);
  burst(kl, kr, 0, 1, 1, 0.006, r);
  filt(kl, "bp", 2100, 0.9);
  filt(kr, "bp", 2100, 0.9);
  layer(L, R, kl, kr, 0.4);
  // 旧门在门框里晃一下的细碎声
  const ql = new Float32Array(len),
    qr = new Float32Array(len);
  for (const at of [0.009, 0.017, 0.028]) {
    const f = span(r, 1400, 2600),
      a = span(r, 0.5, 1),
      pan = span(r, -0.4, 0.4),
      [pl, pr] = panGains(pan);
    strike(ql, qr, at, [[f, a, 0.02], [f * 1.48, a * 0.5, 0.012]], 1, r, { pan, pairs: 0 });
    burst(ql, qr, at, a * 0.5 * pl, a * 0.5 * pr, 0.002, r);
  }
  layer(L, R, ql, qr, 0.06);
  // 楼道
  space(L, R, { rt60: 0.55, wet: 0.2, size: 0.8, damp: 0.35, pre: 0.008, hp: 180 });
  return finish(L, R, { fadeOut: 0.05, glue: 1.1 });
}

/** 6. 甩镜的「嗖」：带通噪声往上扫，0.38 秒最响，然后一下子收住。0.6 秒。 */
function whoosh(): Pcm {
  const r = prng(0x3005);
  const [L, R] = stereo(0.6);
  const len = L.length,
    P = 0.38;
  const env = (t: number) => (t < P ? Math.pow(t / P, 2.4) : Math.exp(-(t - P) / 0.045));
  // 中心频率：350 Hz → 2.6 kHz，越过之后往下掉一点（多普勒）
  const fc = (t: number) => (t < P ? 350 * Math.pow(2600 / 350, Math.pow(t / P, 1.4)) : 1500 + 1100 * Math.exp(-(t - P) / 0.05));
  const flutter = wander(len, 40, r);
  const common = white(len, r);
  const wl = new Float32Array(len),
    wr = new Float32Array(len);
  for (const out of [wl, wr]) {
    const own = white(len, r),
      src = new Float32Array(len);
    for (let i = 0; i < len; i++) src[i] = common[i] * 0.75 + own[i] * 0.66;
    const body = filt(copy(src), "bp", fc, 1.1);
    const swish = filt(copy(src), "bp", (t) => fc(t) * 1.7, 3.5);
    const air = filt(src, "hp", 5000);
    for (let i = 0; i < len; i++) {
      const e = env(i / SR);
      out[i] = e * (0.75 + 0.5 * flutter[i]) * (body[i] + 0.4 * swish[i] + 0.25 * air[i] * e);
    }
  }
  layer(L, R, wl, wr, 1);
  // 一点低频的「呼」，让甩镜有分量
  layerMono(L, R, shape(level(filt(pink(len, r), "bp", 120, 0.8)), env), 0.3);
  return finish(L, R, { fadeOut: 0.05 });
}

/** 7. 一个人升进燃烧的白里化成灰：越来越亮的闪光往上升，0.55 秒「轰」地一下柔软的闪燃，然后嘶嘶、噼啪、像灰一样落下来。2 秒。 */
function flare(): Pcm {
  const r = prng(0xf1a7e);
  const [L, R] = stereo(2);
  const len = L.length,
    P = 0.55;
  const rise = (t: number) => (t < P ? Math.pow(t / P, 2.2) : fall(t - P, 0.12));
  // 升起的光：一簇高频分音一起往上滑一个八度，各自闪烁
  const glide = new Float32Array(len),
    lift = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    glide[i] = Math.pow(2, Math.pow(Math.min(t, P) / P, 1.6));
    lift[i] = rise(t);
  }
  const sl = new Float32Array(len),
    sr = new Float32Array(len);
  for (let k = 0; k < 9; k++) {
    const f0 = span(r, 1300, 3400),
      a = span(r, 0.5, 1),
      [pl, pr] = panGains(span(r, -0.6, 0.6)),
      glint = wander(len, 70, r);
    let ph = r() * TAU;
    for (let i = 0; i < len; i++) {
      const v = Math.sin(ph) * lift[i] * (0.35 + 0.65 * glint[i]) * a;
      sl[i] += v * pl;
      sr[i] += v * pr;
      ph += (TAU * f0 * glide[i]) / SR;
    }
  }
  layer(L, R, sl, sr, 0.35);
  // 噪声的上扬：带通从 0.8 kHz 扫到 7 kHz
  const nl = new Float32Array(len),
    nr = new Float32Array(len);
  for (const out of [nl, nr]) {
    const x = filt(white(len, r), "bp", (t) => 800 * Math.pow(9, Math.pow(Math.min(t, P) / P, 1.3)), 1.3);
    for (let i = 0; i < len; i++) out[i] = x[i] * Math.pow(lift[i], 1.3);
  }
  layer(L, R, nl, nr, 0.3);
  // 「轰」：低通往下扫的噪声 + 柔软的低频
  layerMono(L, R, shape(level(filt(pink(len, r), "lp", (t) => 320 + 4800 * Math.exp(-Math.max(0, t - P) / 0.07), 0.8, 2)), (t) => hit(t - P, 0.012, 0.55)), 1);
  layerMono(L, R, saturate(sine(len, (t) => 46 + 60 * Math.exp(-Math.max(0, t - P) / 0.04), (t) => hit(t - P, 0.01, 0.45)), 1.5), 0.55);
  // 化成灰：嘶嘶的高频
  const hl = new Float32Array(len),
    hr = new Float32Array(len);
  const flick = wander(len, 50, r);
  for (const out of [hl, hr]) {
    const x = filt(white(len, r), "hp", 4500);
    for (let i = 0; i < len; i++) out[i] = x[i] * hit(i / SR - P, 0.02, 1.4) * (0.6 + 0.4 * flick[i]);
  }
  layer(L, R, hl, hr, 0.18);
  // 越来越稀的噼啪
  const cl = new Float32Array(len),
    cr = new Float32Array(len);
  scatter(cl, cr, P, 1.95, (t) => 180 * fall(t - P, 1.1), (t) => fall(t - P, 1.5), 0.0018, r, 0.9);
  filt(cl, "hp", 2500);
  filt(cr, "hp", 2500);
  layer(L, R, cl, cr, 0.3);
  // 飘落的火星：一闪一闪的细小高音
  const el = new Float32Array(len),
    er = new Float32Array(len);
  for (let k = 0; k < 16; k++) {
    const at = span(r, 0.6, 1.8);
    strike(el, er, at, [[span(r, 4500, 9000), span(r, 0.5, 1) * fall(at - P, 1.3), span(r, 0.08, 0.22)]], 1, r, { pan: span(r, -0.8, 0.8), pairs: 0.6, width: 0.8 });
  }
  layer(L, R, el, er, 0.12);
  // 像灰一样往下落：带通噪声从 6 kHz 慢慢滑到 1.8 kHz
  const al = new Float32Array(len),
    ar = new Float32Array(len);
  for (const out of [al, ar]) {
    const x = filt(white(len, r), "bp", (t) => 1800 + 4200 * Math.exp(-Math.max(0, t - P) / 0.5), 1.6);
    out.set(shape(x, (t) => hit(t - P - 0.05, 0.25, 1.2)));
  }
  layer(L, R, al, ar, 0.12);
  // 天很大
  space(L, R, { rt60: 2.2, wet: 0.35, size: 1.3, damp: 0.2, pre: 0.025, hp: 300 });
  return finish(L, R, { fadeOut: 0.35 });
}

/** 8. 白的声音：耳鸣一样细的高频（3.9–4.4 kHz 慢慢相拍，加一点 6.2 kHz 和极轻的噪声），音量恒定。8 秒，首尾无缝。 */
function hum(): Pcm {
  const r = prng(0x4b3d);
  const N = samples(8);
  const L = new Float32Array(N),
    R = new Float32Array(N);
  // 频率都是 1/8 Hz 的整数倍：8 秒正好整周期。右耳的拍略有不同，声音像在头里慢慢转
  const tones: [number, number][] = [
    [3937.5, 1],
    [3938.125, 0.75],
    [4062.5, 0.35],
    [4131.25, 0.55],
    [4131.625, 0.45],
    [4375, 0.22],
    [4375.875, 0.18],
    [6187.5, 0.07],
    [6188.25, 0.05],
  ];
  for (const [f, a] of tones) {
    const fr = f + 0.25 * Math.round(span(r, -1, 1));
    ring(L, 0, f, a, Infinity, r() * TAU);
    ring(R, 0, fr, a, Infinity, r() * TAU);
  }
  // 4 kHz 附近极轻的窄带「嘶」和更轻的宽带底噪（左右各一份；比纯音低 30 dB 以上，用 2 秒的无缝噪声铺满就够）
  const M = samples(2);
  for (const out of [L, R]) {
    const hiss = level(looped(white(M, r), (y) => filt(y, "bp", 4100, 3, 2)), 0.035);
    const air = level(looped(white(M, r), (y) => filt(y, "hp", 2000, Math.SQRT1_2, 2)), 0.006);
    for (let i = 0; i < N; i++) out[i] += hiss[i % M] + air[i % M];
  }
  return finish(L, R, { loop: true });
}

/** 9. 身体落地 / 人摔在地上：闷的低频（70–90 Hz）+ 衣服和软物的噪声。0.6 秒，主击 0 秒。 */
function thud(): Pcm {
  const r = prng(0x7d0d);
  const [L, R] = stereo(0.6);
  const len = L.length;
  // 身体落地的闷低频：92 → 68 Hz
  layerMono(L, R, saturate(sine(len, (t) => 68 + 24 * Math.exp(-t / 0.04), (t) => hit(t, 0.003, 0.3)), 1.8), 1);
  // 地板
  const floor = new Float32Array(len);
  ring(floor, 0, 148, 1, 0.12);
  ring(floor, 0, 227, 0.6, 0.08);
  ring(floor, 0, 341, 0.3, 0.05);
  layerMono(L, R, floor, 0.6);
  // 软的撞击
  layerMono(L, R, shape(level(filt(pink(len, r), "lp", 1300, 0.7, 2)), (t) => hit(t, 0.002, 0.09)), 0.8);
  // 衣服的「噗」和一点窸窣
  const cl = new Float32Array(len),
    cr = new Float32Array(len);
  const rustle = wander(len, 40, r);
  for (const out of [cl, cr]) {
    const puff = shape(level(filt(white(len, r), "bp", 1300, 0.6)), (t) => hit(t, 0.004, 0.13));
    const swish = level(filt(white(len, r), "bp", 2400, 0.9));
    for (let i = 0; i < len; i++) out[i] = puff[i] + 0.35 * swish[i] * rustle[i] * hit(i / SR - 0.03, 0.03, 0.25);
  }
  layer(L, R, cl, cr, 0.55);
  space(L, R, { rt60: 0.45, wet: 0.12, size: 0.7, damp: 0.35, pre: 0.006, hp: 200 });
  return finish(L, R, { fadeOut: 0.08, glue: 1.15 });
}

/** 10. 两块五的圆珠笔在光滑的河石上写三个字（明天见）：三下发涩的划写，中间短暂停顿。1 秒。 */
function pen(): Pcm {
  const r = prng(0x2e9);
  const [L, R] = stereo(1);
  const len = L.length;
  // 每个字 [开始, 结束]：笔画长短不一（点、短横、长撇），笔画之间笔尖抬一下
  const strokes: { t0: number; t1: number; speed: number; amp: number }[] = [];
  const chars: [number, number][] = [
    [0.03, 0.28],
    [0.37, 0.61],
    [0.71, 0.96],
  ];
  for (const [c0, c1] of chars)
    for (let t = c0; t < c1 - 0.03; ) {
      const kind = r(),
        d = Math.min(c1 - t, kind < 0.3 ? span(r, 0.025, 0.045) : kind < 0.7 ? span(r, 0.05, 0.08) : span(r, 0.09, 0.13));
      strokes.push({ t0: t, t1: t + d, speed: span(r, 0.8, 1.3), amp: span(r, 0.6, 1) });
      t += d + span(r, 0.012, 0.03);
    }
  const gate = new Float32Array(len),
    speed = new Float32Array(len).fill(1),
    pressure = wander(len, 60, r);
  for (const s of strokes)
    for (let i = samples(s.t0); i < samples(s.t1); i++) {
      const t = i / SR;
      gate[i] = s.amp * Math.max(0, Math.min(1, (t - s.t0) / 0.004, (s.t1 - t) / 0.008)) * (0.55 + 0.45 * pressure[i]);
      speed[i] = s.speed * (0.85 + 0.3 * Math.sin((Math.PI * (t - s.t0)) / (s.t1 - s.t0)));
    }
  // 粘滑摩擦：笔珠一卡一滑，噪声按不规则的周期一下一下涌出来
  const exc = new Float32Array(len),
    exc2 = new Float32Array(len);
  let phase = 0,
    rate = 140;
  for (let i = 0; i < len; i++) {
    if (gate[i] <= 0) continue;
    phase += rate / SR;
    if (phase >= 1) {
      phase -= 1;
      rate = 115 * speed[i] * span(r, 0.75, 1.3);
    }
    const slip = 0.3 + 0.7 * Math.exp(-phase * 7);
    exc[i] = (r() * 2 - 1) * gate[i] * slip;
    exc2[i] = (r() * 2 - 1) * gate[i] * slip;
  }
  const sp = (t: number) => speed[Math.min(len - 1, Math.round(t * SR))];
  const x = new Float32Array(len);
  mix(x, level(filt(copy(exc), "bp", (t) => 2600 * sp(t), 1.6)), 1);
  mix(x, level(filt(copy(exc), "bp", (t) => 4400 * sp(t), 2.2)), 0.7);
  mix(x, level(filt(copy(exc), "bp", (t) => 3300 * sp(t), 9, 2)), 0.3); // 笔尖在光滑石面上的一点「吱」
  const gl = level(filt(exc, "hp", 6000)),
    gr = level(filt(exc2, "hp", 6000));
  const pl = new Float32Array(len),
    pr = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    pl[i] = x[i] + 0.25 * gl[i];
    pr[i] = x[i] + 0.25 * gr[i];
  }
  layer(L, R, pl, pr, 1);
  // 每一笔落下时笔尖碰到石头的小「嗒」
  const tl = new Float32Array(len),
    tr = new Float32Array(len);
  for (const s of strokes) {
    const a = s.amp * span(r, 0.4, 1);
    strike(tl, tr, s.t0, [[span(r, 3300, 3900), a, 0.006], [span(r, 5200, 5800), a * 0.6, 0.004]], 1, r, { pairs: 0, width: 0.2 });
    burst(tl, tr, s.t0, a * 0.5, a * 0.5, 0.0015, r);
  }
  filt(tl, "hp", 1500);
  filt(tr, "hp", 1500);
  layer(L, R, tl, tr, 0.3);
  space(L, R, { rt60: 0.3, wet: 0.06, size: 0.4, damp: 0.3, pre: 0.003, hp: 500 });
  return finish(L, R, { fadeOut: 0.03 });
}

/** 11. 一颗小石子丢进塞满石子的靴子：两下清脆的「嗒嗒」（1.5–3 kHz），石子堆再往下坐一点。0.35 秒，主击 0 秒。 */
function stone(): Pcm {
  const r = prng(0x570e);
  const [L, R] = stereo(0.35);
  const len = L.length;
  const ml = new Float32Array(len),
    mr = new Float32Array(len);
  // 第一下砸在石子堆上，弹一下再落下
  strike(ml, mr, 0, [[1870, 0.8, 0.028], [2730, 1, 0.022], [3640, 0.65, 0.018], [5210, 0.45, 0.012], [7040, 0.25, 0.008]], 1, r, { pan: -0.05, pairs: 0.2 });
  strike(ml, mr, 0.052, [[1620, 0.6, 0.022], [2420, 0.8, 0.018], [3130, 0.5, 0.014], [4480, 0.35, 0.01]], 0.55, r, { pan: 0.1, pairs: 0.2 });
  // 石子堆的闷「笃」和铁靴极轻的一点余响
  strike(ml, mr, 0, [[690, 0.3, 0.035], [1150, 0.22, 0.025], [520, 0.05, 0.15], [968, 0.04, 0.12]], 1, r, { pairs: 0.3 });
  // 石子堆往下坐：几颗更小的「嗒」
  for (let k = 0; k < 5; k++) {
    const at = span(r, 0.085, 0.2),
      f = span(r, 2000, 5000);
    strike(ml, mr, at, [[f, span(r, 0.05, 0.14), 0.008]], 1, r, { pan: span(r, -0.4, 0.4), pairs: 0 });
  }
  layer(L, R, ml, mr, 0.8);
  // 相撞的瞬态
  const tl = new Float32Array(len),
    tr = new Float32Array(len);
  burst(tl, tr, 0, 1, 1, 0.005, r);
  burst(tl, tr, 0.052, 0.5, 0.55, 0.004, r);
  filt(tl, "hp", 1800);
  filt(tr, "hp", 1800);
  layer(L, R, tl, tr, 0.5);
  // 一点沙沙的滑动
  layerMono(L, R, shape(level(filt(white(len, r), "bp", 3500, 1)), (t) => hit(t - 0.09, 0.01, 0.06)), 0.05, 0.15);
  space(L, R, { rt60: 0.3, wet: 0.08, size: 0.4, damp: 0.3, pre: 0.003, hp: 500 });
  return finish(L, R, { fadeOut: 0.04 });
}

/** 12. 孩子脚踝上的小铜铃响两下（两步）：每下是铃里的小珠子连撞几次，高频不谐和分音（3.1/4.6/6.0 kHz）衰减很快。0.8 秒，第二下在 0.29 秒。 */
function bell(): Pcm {
  const r = prng(0xbe11);
  const [L, R] = stereo(0.8);
  const len = L.length;
  const modes: Mode[] = [
    [3100, 1, 0.38],
    [4630, 0.6, 0.26],
    [6010, 0.45, 0.19],
    [7470, 0.25, 0.13],
    [9170, 0.15, 0.08],
  ];
  const bl = new Float32Array(len),
    br = new Float32Array(len),
    hits: [number, number, number][] = [];
  for (const [t0, g] of [
    [0, 1],
    [0.29, 0.8],
  ]) {
    let t = t0,
      a = g;
    for (let k = 0; k < 4; k++) {
      hits.push([t, a * 0.95, 0.35]);
      burst(bl, br, t, a * 0.15, a * 0.15, 0.003, r);
      t += span(r, 0.008, 0.016) * (1 + k * 0.4);
      a *= span(r, 0.4, 0.65);
    }
  }
  strikes(bl, br, hits, modes, r, { width: 0.6, pairs: 0.5 });
  filt(bl, "hp", 1500);
  filt(br, "hp", 1500);
  layer(L, R, bl, br, 1);
  space(L, R, { rt60: 0.7, wet: 0.12, size: 0.9, damp: 0.3, pre: 0.01, hp: 1000 });
  return finish(L, R, { fadeOut: 0.12 });
}

// ———————————————— 环境（循环） ————————————————

/** 把 src 按 gl / gr 加到循环缓冲 L / R 的第 s0 个采样处（越过结尾的绕回开头；L、R 可以是同一个） */
function addWrapped(L: Float32Array, R: Float32Array, src: Float32Array, s0: number, gl: number, gr: number) {
  const N = L.length,
    head = Math.min(src.length, N - s0);
  for (let i = 0; i < head; i++) {
    L[s0 + i] += src[i] * gl;
    R[s0 + i] += src[i] * gr;
  }
  for (let i = head; i < src.length; i++) {
    L[s0 + i - N] += src[i] * gl;
    R[s0 + i - N] += src[i] * gr;
  }
}

/** 13. 远处的人群：很多铁底鞋在走（远近不同、被距离闷住的「当」），加一点城市低鸣；没有人声。10 秒，首尾无缝。 */
function crowd(): Pcm {
  const r = prng(0xc20d);
  const P = 10,
    N = samples(P),
    T = samples(0.1);
  const L = new Float32Array(N),
    R = new Float32Array(N),
    send = new Float32Array(N); // 混响先把左右并成单声道，送单声道就够
  // 四圈远近不同的人：越远越闷、越轻、混响越多
  const groups = [
    { walkers: 5, lp: 2600, gain: 1, dry: 1, send: 0.35 },
    { walkers: 8, lp: 1600, gain: 0.55, dry: 0.85, send: 0.55 },
    { walkers: 11, lp: 1000, gain: 0.32, dry: 0.7, send: 0.75 },
    { walkers: 14, lp: 650, gain: 0.2, dry: 0.55, send: 0.9 },
  ];
  for (const g of groups)
    for (let w = 0; w < g.walkers; w++) {
      const stride = span(r, 0.47, 0.63),
        base = span(r, 470, 950),
        amp = span(r, 0.55, 1) * g.gain,
        [pl, pr] = panGains(span(r, -0.9, 0.9));
      // 这个人的左右脚各一个声音：鞋底铁片的几个模态 + 脚跟的闷响 + 一点擦地声，按距离闷掉高频
      const feet = [1, 1.035].map((side) => {
        const x = new Float32Array(T);
        const shoe: Mode[] = [
          [base, 1, 0.09],
          [base * 1.87, 0.7, 0.07],
          [base * 3.07, 0.45, 0.05],
          [base * 4.6, 0.25, 0.035],
        ];
        for (const [f, m, d] of shoe) if (f < g.lp * 2.2) ring(x, 0, f * side, m, d, r() * TAU);
        ring(x, 0, 95 * side, 0.8, 0.07);
        const scuff = white(T, r),
          decay = Math.exp(-LN1000 / (0.02 * SR));
        for (let i = 0, n = 0.5; i < T; i++, n *= decay) x[i] += scuff[i] * n;
        return filt(x, "lp", g.lp, 0.7, 2);
      });
      for (let t = r() * stride, k = 0; t < P; t += stride * span(r, 0.95, 1.05), k++) {
        const a = amp * (k % 2 ? 0.85 : 1) * span(r, 0.75, 1.1),
          s0 = samples(t) % N,
          x = feet[k % 2];
        addWrapped(L, R, x, s0, a * pl * g.dry, a * pr * g.dry);
        addWrapped(send, send, x, s0, a * g.send * 0.5, a * g.send * 0.5);
      }
    }
  // 远处的街道：长一点的混响（越远的人送得越多）
  const [wl, wr] = loopReverb(send, send, { rt60: 2, wet: 0.8, size: 1.3, damp: 0.4, pre: 0.03, hp: 150 });
  const p = peakOf(L, R) || 1;
  // 城市的低鸣：褐噪声低通，缓慢起伏（单声道）
  const swell = wander(N, 5, r, true);
  const rumble = level(
    looped(white(N, r), (y) => {
      brownify(y);
      filt(y, "lp", 140, 0.7);
    }),
    0.3,
  );
  for (let i = 0; i < N; i++) {
    const low = rumble[i] * (0.75 + 0.25 * swell[i]) * 0.25 * p;
    L[i] += wl[i] + low;
    R[i] += wr[i] + low;
  }
  return finish(L, R, { loop: true });
}

/** 14. 靠近白的高空风：缓慢起伏的滤波噪声，阵风大时带一点哨音。8 秒，首尾无缝。 */
function wind(): Pcm {
  const r = prng(0x3140);
  const N = samples(8);
  const gust = wander(N, 6, r, true),
    turn = wander(N, 4, r, true),
    flick = wander(N, 64, r, true);
  const L = new Float32Array(N),
    R = new Float32Array(N);
  const common = white(N, r);
  for (const out of [L, R]) {
    const own = white(N, r),
      src = new Float32Array(N);
    for (let i = 0; i < N; i++) src[i] = 0.6 * common[i] + 0.8 * own[i];
    // 风的身体：低通，阵风大时更亮；中间一层「呜」
    const body = level(
      looped(copy(src), (y, at) => {
        pinkify(y);
        filt(y, "lp", (t) => 280 + 1100 * gust[at(t)], 0.6);
        filt(y, "hp", 70);
      }),
    );
    const whoo = level(
      looped(copy(src), (y, at) => {
        pinkify(y);
        filt(y, "bp", (t) => 420 + 700 * gust[at(t)], 1.6);
      }),
    );
    const air = level(looped(src, (y) => filt(y, "hp", 3800)));
    for (let i = 0; i < N; i++) {
      const g = gust[i];
      out[i] += body[i] * (0.35 + 0.65 * g) + whoo[i] * 0.55 * Math.pow(g, 1.5) + air[i] * 0.08 * g * g;
    }
  }
  // 哨音：很窄的带通，阵风大的时候才出来
  const w1 = level(looped(white(N, r), (y, at) => filt(y, "bp", (t) => 1150 + 420 * turn[at(t)], 40, 2)));
  const w2 = level(looped(white(N, r), (y, at) => filt(y, "bp", (t) => (1150 + 420 * turn[at(t)]) * 1.34, 50, 2)));
  for (let i = 0; i < N; i++) {
    const a = (0.05 + 0.3 * ramp(0.5, 0.9, gust[i])) * (0.7 + 0.3 * flick[i]);
    L[i] += a * (w1[i] + 0.4 * w2[i]);
    R[i] += a * (0.7 * w1[i] + 0.7 * w2[i]);
  }
  // 低处的呼呼声（单声道）
  const rumble = level(
    looped(white(N, r), (y) => {
      brownify(y);
      filt(y, "lp", 90, 0.7);
    }),
  );
  for (let i = 0; i < N; i++) {
    const v = rumble[i] * 0.25 * (0.5 + 0.5 * gust[i]);
    L[i] += v;
    R[i] += v;
  }
  return finish(L, R, { loop: true });
}

/** 15. 老电车车厢里：低沉的电机声、车身的颤响、每 0.6 秒一组铁轨接缝的「咔—嗒」。6 秒，首尾无缝。 */
function tram(): Pcm {
  const r = prng(0x7a4);
  const P = 6,
    N = samples(P);
  // 电机：46 Hz 和泛音，加齿轮 410 Hz 的细鸣；旁边的频率差 1/3–1/2 Hz，慢慢相拍。频率都是 1/6 Hz 的整数倍：6 秒整周期
  const motor = new Float32Array(N);
  const tones: [number, number][] = [
    [46, 1],
    [46 + 1 / 3, 0.3],
    [92, 0.55],
    [92.5, 0.15],
    [138, 0.35],
    [184, 0.2],
    [230, 0.12],
    [276, 0.07],
    [410, 0.05],
    [410.5, 0.03],
  ];
  for (const [f, a] of tones) ring(motor, 0, f, a, Infinity, r() * TAU);
  level(motor, 0.13);
  // 车厢里的低沉轰鸣（褐噪声）
  const rumble = level(
    looped(white(N, r), (y) => {
      brownify(y);
      filt(y, "lp", 130, 0.7);
    }),
    0.12,
  );
  // 车轮压过铁轨接缝：前后两根轴「咔—嗒」，车厢里听是闷的；每次之后车身一阵细碎的颤响
  const thump = new Float32Array(N),
    kl = new Float32Array(N),
    kr = new Float32Array(N),
    ql = new Float32Array(N),
    qr = new Float32Array(N);
  for (let k = 0; k < 10; k++) {
    const t = 0.06 + k * 0.6 + span(r, -0.008, 0.008);
    for (const [dt, g, pan] of [
      [0, 1, -0.15],
      [0.118, 0.8, 0.15],
    ]) {
      const a = g * span(r, 0.8, 1.1),
        at = t + dt,
        [pl, pr] = panGains(pan),
        v = span(r, 0.97, 1.03);
      ring(thump, at, 78 * v, a, 0.11, 0, true);
      strike(kl, kr, at, [[620 * v, 1, 0.11], [1340 * v, 0.75, 0.08], [2210 * v, 0.45, 0.05], [3080 * v, 0.25, 0.035]], a, r, { pan, pairs: 0.3, wrap: true });
      burst(kl, kr, at, a * 0.7 * pl, a * 0.7 * pr, 0.012, r, true);
    }
    scatter(ql, qr, t, t + 0.35, (u) => 260 * fall(u - t, 0.15), (u) => fall(u - t, 0.2), 0.0025, r, 0.8, true);
  }
  // 一直在轻轻响的窗玻璃
  scatter(ql, qr, 0, P, () => 35, () => 0.35, 0.002, r, 0.8, true);
  looped(kl, (y) => filt(y, "lp", 2600, 0.7));
  looped(kr, (y) => filt(y, "lp", 2600, 0.7));
  looped(ql, (y) => filt(y, "bp", 2300, 1.2));
  looped(qr, (y) => filt(y, "bp", 2300, 1.2));
  const L = new Float32Array(N),
    R = new Float32Array(N),
    pk = peakOf(kl, kr) || 1,
    pq = peakOf(ql, qr) || 1,
    pt = peakOf(thump, thump) || 1;
  for (let i = 0; i < N; i++) {
    const low = motor[i] + rumble[i] + (0.6 * thump[i]) / pt;
    L[i] = low + (0.6 * kl[i]) / pk + (0.15 * ql[i]) / pq;
    R[i] = low + (0.6 * kr[i]) / pk + (0.15 * qr[i]) / pq;
  }
  // 铁皮车厢的小空间
  const [wl, wr] = loopReverb(L, R, { rt60: 0.4, wet: 0.25, size: 0.55, damp: 0.3, pre: 0.005, hp: 250 });
  mix(L, wl);
  mix(R, wr);
  return finish(L, R, { loop: true });
}

// ———————————————— 门、绳、心跳 ————————————————

/** 16. 旧门「吱呀」一声转开，0.6 秒「嘭」地关上（木头闷响 + 门闩）。1 秒，重音在 0.6 秒。 */
function door(): Pcm {
  const r = prng(0xd002);
  const [L, R] = stereo(1);
  const len = L.length,
    HIT = 0.6;
  // 吱呀：合页的粘滑摩擦——一串不规则的脉冲送进木头和铁合页的共振
  const exc = new Float32Array(len),
    amp = wander(len, 40, r);
  for (let t = 0.04; t < 0.5; ) {
    const u = (t - 0.04) / 0.46;
    const f = 190 + 200 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, u * 1.25))), 0.8) + 40 * u;
    const a = Math.max(0, Math.min(1, (t - 0.04) / 0.03, (0.5 - t) / 0.05)) * (0.4 + 0.6 * amp[samples(t)]) * (r() < 0.08 ? 0.3 : 1);
    const k = samples(t);
    exc[k] += a;
    exc[k + 1] -= a * 0.5;
    t += (1 / f) * span(r, 0.88, 1.12);
  }
  const creak = new Float32Array(len);
  const creakModes: [number, number, number][] = [
    [620, 6, 1],
    [1180, 8, 0.8],
    [1460, 14, 0.5],
    [1940, 10, 0.6],
    [2920, 16, 0.4],
    [3150, 12, 0.35],
    [4350, 10, 0.2],
  ];
  for (const [fc, q, g] of creakModes) mix(creak, level(filt(copy(exc), "bp", fc, q)), g);
  layerMono(L, R, creak, 0.4, -0.15);
  // 门扇带起的一点风
  layerMono(L, R, shape(level(filt(pink(len, r), "lp", 500, 0.7, 2)), (t) => Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.1) / 0.5))), 2)), 0.08);
  // 关上：门板撞门框，木头闷响 + 低频
  const ex2 = new Float32Array(len);
  pulse(ex2, HIT, 0.0018);
  const wl = new Float32Array(len),
    wr = new Float32Array(len);
  resonate(
    ex2,
    [
      [72, 0.6, 0.2],
      [112, 0.7, 0.2],
      [151, 1, 0.2],
      [214, 0.8, 0.15],
      [306, 0.55, 0.1],
      [442, 0.4, 0.07],
      [688, 0.25, 0.05],
      [1052, 0.15, 0.035],
      [1610, 0.08, 0.025],
    ],
    wl,
    wr,
    1,
    r,
    0.2,
  );
  layer(L, R, wl, wr, 1);
  layerMono(L, R, shape(level(filt(white(len, r), "lp", 2200, 0.7)), (t) => hit(t - HIT, 0.0005, 0.03)), 0.35);
  // 门闩「咔」进去，门在框里晃两下
  const ll = new Float32Array(len),
    lr = new Float32Array(len);
  strike(ll, lr, HIT + 0.013, [[2380, 1, 0.03], [3810, 0.9, 0.025], [5140, 0.5, 0.02]], 1, r, { pan: 0.2, pairs: 0.3 });
  burst(ll, lr, HIT + 0.013, 0.6, 0.7, 0.003, r);
  for (const at of [HIT + 0.035, HIT + 0.058]) strike(ll, lr, at, [[span(r, 1500, 2500), span(r, 0.15, 0.3), 0.02]], 1, r, { pan: span(r, -0.3, 0.3), pairs: 0 });
  filt(ll, "hp", 1000);
  filt(lr, "hp", 1000);
  layer(L, R, ll, lr, 0.22);
  space(L, R, { rt60: 0.6, wet: 0.2, size: 0.9, damp: 0.35, pre: 0.01, hp: 200 });
  return finish(L, R, { fadeOut: 0.1, glue: 1.1 });
}

/** 17. 绳子一下拽紧，然后绷着「吱——」地响。0.6 秒，拽紧在 0 秒。 */
function rope(): Pcm {
  const r = prng(0x20be);
  const [L, R] = stereo(0.6);
  const len = L.length;
  // 拽紧：闷的「嘣」+ 绳子的颤 + 纤维的「嚓」
  layerMono(L, R, saturate(sine(len, (t) => 92 + 50 * Math.exp(-t / 0.03), (t) => hit(t, 0.002, 0.12)), 1.4), 0.45);
  const twang = new Float32Array(len);
  ring(twang, 0, 118, 1, 0.22);
  ring(twang, 0, 237, 0.5, 0.16);
  ring(twang, 0, 356, 0.25, 0.1);
  layerMono(L, R, twang, 0.25);
  layerMono(L, R, shape(level(filt(white(len, r), "bp", 1400, 0.8)), (t) => hit(t, 0.001, 0.05)), 0.45);
  // 绷着的「吱——」：纤维之间的粘滑摩擦，越拉越紧音越高
  const exc = new Float32Array(len),
    amp = wander(len, 30, r);
  for (let t = 0.035; t < 0.52; ) {
    const u = (t - 0.035) / 0.485;
    const f = 70 + 75 * u + 10 * Math.sin(u * 9);
    const a = Math.max(0, Math.min(1, (t - 0.035) / 0.04, (0.52 - t) / 0.08)) * (0.35 + 0.65 * amp[samples(t)]) * (r() < 0.1 ? 0.4 : 1);
    const k = samples(t);
    exc[k] += a;
    exc[k + 1] -= 0.6 * a;
    t += (1 / f) * span(r, 0.8, 1.2);
  }
  const creak = new Float32Array(len);
  const creakModes: [number, number, number][] = [
    [420, 4, 1],
    [780, 5, 0.8],
    [1350, 6, 0.55],
    [2300, 5, 0.35],
  ];
  for (const [fc, q, g] of creakModes) mix(creak, level(filt(copy(exc), "bp", fc, q)), g);
  // 纤维摩擦的毛刺：跟着粘滑脉冲的噪声
  const fiber = filt(white(len, r), "bp", 2600, 0.9);
  let env = 0;
  for (let i = 0; i < len; i++) {
    env = Math.max(Math.abs(exc[i]), env * 0.997);
    creak[i] += fiber[i] * env * 0.6;
  }
  layerMono(L, R, creak, 0.85, 0.1);
  space(L, R, { rt60: 0.4, wet: 0.1, size: 0.6, damp: 0.35, pre: 0.005, hp: 250 });
  return finish(L, R, { fadeOut: 0.06 });
}

/** 18. 一下深沉、柔软的心跳（扑—通）。0.8 秒，「扑」在 0 秒，「通」在 0.29 秒。 */
function heart(): Pcm {
  const r = prng(0x4ea7);
  const [L, R] = stereo(0.8);
  const len = L.length;
  const beat = (at: number, f0: number, f1: number, attack: number, t60: number) =>
    saturate(sine(len, (t) => f1 + (f0 - f1) * Math.exp(-Math.max(0, t - at) / 0.03), (t) => hit(t - at, attack, t60)), 2.4);
  const x = new Float32Array(len);
  mix(x, beat(0, 64, 48, 0.012, 0.24), 1);
  mix(x, beat(0.29, 74, 56, 0.008, 0.17), 0.75);
  // 胸腔里闷闷的一点噪声，和心瓣合上的一下软「嗒」（200–400 Hz，手机外放靠它听见）
  mix(x, shape(level(filt(pink(len, r), "lp", 180, 0.7, 2)), (t) => hit(t, 0.008, 0.09) + 0.7 * hit(t - 0.29, 0.006, 0.07)), 0.25);
  mix(x, shape(level(filt(pink(len, r), "bp", 260, 1.2)), (t) => hit(t - 0.004, 0.004, 0.05) + 0.8 * hit(t - 0.294, 0.003, 0.04)), 0.45);
  filt(x, "lp", 900);
  layerMono(L, R, x, 1);
  return finish(L, R, { fadeOut: 0.1 });
}

// ———————————————— 第一幕（重做版）补的几个 ————————————————

/** 19. 铁靴刹车：鞋底扎住往前滑、擦着石板（越擦越慢、越来越低的沙沙声，碾碎砂砾），0.22 秒停住踩实。0.5 秒，开始滑在 0 秒。 */
function skid(): Pcm {
  const r = prng(0x5c1d);
  const [L, R] = stereo(0.5);
  const len = L.length,
    S = 0.22;
  const env = (t: number) => (t < S ? Math.min(1, t / 0.012) * (1 - (0.4 * t) / S) : 0.6 * Math.exp(-(t - S) / 0.03));
  const nl = new Float32Array(len),
    nr = new Float32Array(len);
  for (const out of [nl, nr]) {
    const x = filt(white(len, r), "bp", (t) => 850 + 1700 * Math.max(0, 1 - t / S), 1.3);
    for (let i = 0; i < len; i++) out[i] = x[i] * env(i / SR);
  }
  layer(L, R, nl, nr, 0.75);
  // 砂砾被碾碎
  const gl = new Float32Array(len),
    gr = new Float32Array(len);
  scatter(gl, gr, 0, S, (t) => 1400 * (1 - t / S) + 120, () => 1, 0.0012, r, 0.5);
  filt(gl, "hp", 1600);
  filt(gr, "hp", 1600);
  layer(L, R, gl, gr, 0.45);
  // 铁靴压着地往前推的低频，停住那一下踩实
  layerMono(L, R, saturate(sine(len, (t) => 44 + 16 * Math.exp(-t / 0.08), (t) => hit(t, 0.008, 0.22)), 1.4), 0.55);
  layerMono(L, R, saturate(sine(len, (t) => 58 + 24 * Math.exp(-Math.max(0, t - S) / 0.03), (t) => hit(t - S, 0.002, 0.2)), 1.7), 0.8);
  space(L, R, { rt60: 0.7, wet: 0.16, size: 0.9, damp: 0.35, pre: 0.01, hp: 220 });
  return finish(L, R, { fadeOut: 0.08, glue: 1.1 });
}

/** 20. 公文包从高处砸在石板上：皮箱沉闷的「嘭」、两个铜锁扣「咔哒」弹开、弹起来又落下、纸哗啦飞出来。1.2 秒，主击 0 秒。 */
function briefcase(): Pcm {
  const r = prng(0xb71e);
  const [L, R] = stereo(1.2);
  const len = L.length;
  layerMono(L, R, saturate(sine(len, (t) => 54 + 38 * Math.exp(-t / 0.03), (t) => hit(t, 0.002, 0.3)), 2.2), 1);
  const box = new Float32Array(len);
  ring(box, 0, 208, 1, 0.13);
  ring(box, 0, 331, 0.6, 0.09);
  ring(box, 0, 468, 0.35, 0.06);
  layerMono(L, R, box, 0.45);
  // 皮面拍在石板上的「啪」
  layerMono(L, R, shape(level(filt(white(len, r), "bp", 1700, 0.9)), (t) => hit(t, 0.0005, 0.045)), 0.55);
  // 两个铜锁扣弹开
  const kl = new Float32Array(len),
    kr = new Float32Array(len);
  for (const [at, a] of [
    [0.045, 1],
    [0.074, 0.8],
  ] as const) {
    const pan = span(r, -0.35, 0.35);
    strike(kl, kr, at, [[3080, a, 0.032], [4690, a * 0.6, 0.02], [6910, a * 0.35, 0.012]], 1, r, { pan, pairs: 0.4 });
    const [pl, pr] = panGains(pan);
    burst(kl, kr, at, a * 0.6 * pl, a * 0.6 * pr, 0.003, r);
  }
  layer(L, R, kl, kr, 0.42);
  // 弹起来又落下
  layerMono(L, R, saturate(sine(len, (t) => 68 + 26 * Math.exp(-Math.max(0, t - 0.22) / 0.02), (t) => hit(t - 0.22, 0.002, 0.12)), 1.5), 0.35);
  layerMono(L, R, shape(level(filt(white(len, r), "bp", 1500, 0.9)), (t) => hit(t - 0.22, 0.0005, 0.03)), 0.2);
  // 纸哗啦飞出来：带通噪声一颤一颤
  const flutter = wander(len, 30, r);
  const pl = new Float32Array(len),
    pr = new Float32Array(len);
  for (const out of [pl, pr]) {
    const x = filt(white(len, r), "bp", 3400, 0.7);
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      out[i] = x[i] * hit(t - 0.07, 0.06, 0.65) * (0.35 + 0.65 * Math.abs(Math.sin(TAU * 17 * t + 6 * flutter[i])));
    }
  }
  layer(L, R, pl, pr, 0.26);
  space(L, R, { rt60: 0.9, wet: 0.22, size: 1.0, damp: 0.35, pre: 0.012, hp: 200 });
  return finish(L, R, { fadeOut: 0.2, glue: 1.2 });
}

/** 21. 砖在手里亮起来、变暖：一声很轻的、暖的「叮——」（G 大调和弦，和配乐同调），泛音慢慢亮起来又散开。2.4 秒，最亮在约 0.05 秒。 */
function warm(): Pcm {
  const r = prng(0xa4a1);
  const [L, R] = stereo(2.4);
  const len = L.length;
  const notes: [number, number][] = [
    [783.99, 1],
    [987.77, 0.7],
    [1174.66, 0.55],
    [1567.98, 0.32],
    [392.0, 0.45],
  ];
  for (const [f, a] of notes) {
    const [gl, gr] = panGains(span(r, -0.4, 0.4));
    let ph = r() * TAU;
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      const v = Math.sin(ph) * a * hit(t, 0.025, 1.9);
      ph += (TAU * f * (1 + 0.0025 * Math.sin(TAU * 4.6 * t))) / SR;
      L[i] += v * gl;
      R[i] += v * gr;
    }
  }
  // 一点玻璃似的泛音：光一闪
  strike(L, R, 0, [[3136, 0.22, 0.9], [4699, 0.13, 0.6], [6272, 0.08, 0.4]], 1, r, { width: 0.8, pairs: 0.6 });
  // 很轻的暖风（热气升起来）
  layerMono(L, R, shape(level(filt(pink(len, r), "lp", 900, 0.7)), (t) => hit(t, 0.4, 1.4)), 0.1);
  space(L, R, { rt60: 2.4, wet: 0.45, size: 1.3, damp: 0.25, pre: 0.02, hp: 250 });
  return finish(L, R, { fadeOut: 0.6 });
}

/** 22. 瓷茶杯举起来轻轻一碰：短的高音「叮」。0.5 秒，主击 0 秒。 */
function clink(): Pcm {
  const r = prng(0xc11c);
  const [L, R] = stereo(0.5);
  const len = L.length;
  const cl = new Float32Array(len),
    cr = new Float32Array(len);
  strike(cl, cr, 0, [[2390, 1, 0.34], [3610, 0.6, 0.24], [5130, 0.35, 0.15], [6880, 0.2, 0.09]], 1, r, { pan: -0.15, pairs: 0.5 });
  burst(cl, cr, 0, 0.4, 0.35, 0.002, r);
  layer(L, R, cl, cr, 1);
  space(L, R, { rt60: 0.6, wet: 0.14, size: 0.6, damp: 0.3, pre: 0.006, hp: 600 });
  return finish(L, R, { fadeOut: 0.1 });
}

/** 23. 一下短促的「嗖」（跃起、往下一拽）：带通噪声往上扫，0.12 秒最响。0.3 秒。 */
function swish(): Pcm {
  const r = prng(0x5715);
  const [L, R] = stereo(0.3);
  const len = L.length,
    P = 0.12;
  const env = (t: number) => (t < P ? Math.pow(t / P, 2) : Math.exp(-(t - P) / 0.04));
  const fc = (t: number) => (t < P ? 500 * Math.pow(3200 / 500, Math.pow(t / P, 1.3)) : 1900 + 1300 * Math.exp(-(t - P) / 0.04));
  const common = white(len, r);
  const wl = new Float32Array(len),
    wr = new Float32Array(len);
  for (const out of [wl, wr]) {
    const own = white(len, r),
      src = new Float32Array(len);
    for (let i = 0; i < len; i++) src[i] = common[i] * 0.75 + own[i] * 0.66;
    const body = filt(copy(src), "bp", fc, 1.2);
    const air = filt(src, "hp", 5000);
    for (let i = 0; i < len; i++) {
      const e = env(i / SR);
      out[i] = e * (body[i] + 0.25 * air[i] * e);
    }
  }
  layer(L, R, wl, wr, 1);
  layerMono(L, R, shape(level(filt(pink(len, r), "bp", 140, 0.8)), env), 0.25);
  return finish(L, R, { fadeOut: 0.04 });
}

/** 24. 一把攥住：手套抓住裤脚的「啪」、布一下绷紧。0.3 秒，主击 0 秒。 */
function grab(): Pcm {
  const r = prng(0x6ab0);
  const [L, R] = stereo(0.3);
  const len = L.length;
  layerMono(L, R, shape(level(filt(white(len, r), "bp", 1400, 1.4)), (t) => hit(t, 0.001, 0.05)), 1);
  layerMono(L, R, saturate(sine(len, (t) => 92 + 30 * Math.exp(-t / 0.02), (t) => hit(t, 0.002, 0.09)), 1.6), 0.7);
  layerMono(L, R, shape(level(filt(white(len, r), "bp", 700, 2)), (t) => hit(t - 0.02, 0.01, 0.12)), 0.35);
  space(L, R, { rt60: 0.4, wet: 0.1, size: 0.6, damp: 0.35, pre: 0.005, hp: 300 });
  return finish(L, R, { fadeOut: 0.05 });
}

/** 25. 镜头升上天：风声越来越大、越来越高，扑面而过，最后一下收住。1.8 秒，最响在 1.45 秒。 */
function rise(): Pcm {
  const r = prng(0x415e);
  const [L, R] = stereo(1.8);
  const len = L.length,
    P = 1.45;
  const env = (t: number) => (t < P ? Math.pow(t / P, 2.2) : Math.exp(-(t - P) / 0.09));
  const fc = (t: number) => 180 * Math.pow(2600 / 180, Math.pow(Math.min(t, P) / P, 1.5));
  const flutter = wander(len, 60, r);
  const wl = new Float32Array(len),
    wr = new Float32Array(len);
  for (const out of [wl, wr]) {
    const x = white(len, r);
    const body = filt(copy(x), "bp", fc, 0.9);
    const air = filt(x, "hp", 3500);
    for (let i = 0; i < len; i++) {
      const e = env(i / SR);
      out[i] = e * (0.75 + 0.5 * flutter[i]) * (body[i] + 0.3 * air[i] * e);
    }
  }
  layer(L, R, wl, wr, 1);
  layerMono(L, R, shape(level(filt(pink(len, r), "lp", 160, 0.8)), env), 0.35);
  space(L, R, { rt60: 1.6, wet: 0.25, size: 1.2, damp: 0.25, pre: 0.02, hp: 300 });
  return finish(L, R, { fadeOut: 0.15 });
}

/** 26. 最大的那只哑铃被一把夺过来：两片铸铁饼在怀里一撞的闷「铛」（低沉、很快收住，不是空心的叮）+ 抱住的一下闷响。0.7 秒，主击 0 秒。 */
function iron(): Pcm {
  const r = prng(0x1a0d);
  const [L, R] = stereo(0.7);
  const len = L.length;
  // 抱到怀里的那一下：低沉的闷响（衣服、身子吃住分量）
  layerMono(L, R, saturate(sine(len, (t) => 58 + 30 * Math.exp(-t / 0.03), (t) => hit(t, 0.002, 0.28)), 1.6), 0.8);
  // 铸铁饼：厚、实心，模态低、衰减快，相拍一点点
  const plate: Mode[] = [
    [318, 1, 0.42],
    [604, 0.75, 0.34],
    [933, 0.6, 0.28],
    [1467, 0.42, 0.2],
    [2164, 0.3, 0.14],
    [3010, 0.18, 0.09],
  ];
  const ml = new Float32Array(len),
    mr = new Float32Array(len);
  strikes(ml, mr, [[0, 1, 0], [0.045, 0.35, 0.5]], plate, r, { width: 0.5, pairs: 0.5 });
  layer(L, R, ml, mr, 0.7);
  // 撞上的瞬态
  const tl = new Float32Array(len),
    tr = new Float32Array(len);
  burst(tl, tr, 0, 1, 0.9, 0.012, r);
  burst(tl, tr, 0.045, 0.3, 0.35, 0.008, r);
  filt(tl, "bp", 1600, 0.8);
  filt(tr, "bp", 1600, 0.8);
  layer(L, R, tl, tr, 0.5);
  space(L, R, { rt60: 0.6, wet: 0.16, size: 0.7, damp: 0.35, pre: 0.008, hp: 220 });
  return finish(L, R, { fadeOut: 0.12 });
}

/** 27. 一把抓起铁链：一节节铁环互相撞的哗啦声（铸铁、闷一点），往上一提又响一串。0.5 秒，主击 0 秒。 */
function chain(): Pcm {
  const r = prng(0xc4a1);
  const [L, R] = stereo(0.5);
  const len = L.length;
  // 铁环：小块铸铁的模态，比铃铛低、衰减快
  const modes: Mode[] = [
    [1180, 1, 0.09],
    [1930, 0.7, 0.07],
    [2870, 0.55, 0.05],
    [4060, 0.35, 0.035],
  ];
  const cl = new Float32Array(len),
    cr = new Float32Array(len),
    hits: [number, number, number][] = [];
  // 抓起来的一串（越来越轻），往上一提又一串
  for (const [t0, g, n] of [
    [0, 1, 9],
    [0.2, 0.55, 6],
  ] as const) {
    let t = t0,
      a = g;
    for (let k = 0; k < n; k++) {
      hits.push([t, a, 0.5]);
      burst(cl, cr, t, a * 0.12, a * 0.12, 0.002, r);
      t += span(r, 0.012, 0.03);
      a *= span(r, 0.7, 0.88);
    }
  }
  hits.sort((x, y) => x[0] - y[0]);
  strikes(cl, cr, hits, modes, r, { width: 0.7, pairs: 0.4 });
  filt(cl, "hp", 700);
  filt(cr, "hp", 700);
  layer(L, R, cl, cr, 1);
  space(L, R, { rt60: 0.5, wet: 0.12, size: 0.7, damp: 0.3, pre: 0.006, hp: 500 });
  return finish(L, R, { fadeOut: 0.08 });
}

/** 28. 一根绷紧的细线「嘣」地断了：一下尖的崩声 + 往下掉的弦音 + 线头甩出去的一点风。0.5 秒，断在 0 秒。 */
function snap(): Pcm {
  const r = prng(0x5a4b);
  const [L, R] = stereo(0.5);
  const len = L.length;
  // 崩：极短的宽带瞬态
  const tl = new Float32Array(len),
    tr = new Float32Array(len);
  burst(tl, tr, 0, 1, 0.9, 0.004, r);
  burst(tl, tr, 0.006, 0.35, 0.4, 0.003, r);
  filt(tl, "hp", 1800);
  filt(tr, "hp", 1800);
  layer(L, R, tl, tr, 0.55);
  // 弦：绷着的线一断，音高往下掉
  layerMono(L, R, sine(len, (t) => 260 + 620 * Math.exp(-t / 0.08), (t) => hit(t, 0.0008, 0.2)), 0.5);
  layerMono(L, R, sine(len, (t) => 520 + 1240 * Math.exp(-t / 0.06), (t) => hit(t, 0.0005, 0.1)), 0.22, 0.1);
  // 线头甩出去
  layerMono(L, R, shape(level(filt(white(len, r), "bp", 2400, 0.9)), (t) => hit(t - 0.01, 0.012, 0.16)), 0.12, -0.2);
  space(L, R, { rt60: 0.5, wet: 0.14, size: 0.6, damp: 0.3, pre: 0.006, hp: 300 });
  return finish(L, R, { fadeOut: 0.08 });
}

/**
 * 29. 手伸进空了的铁靴里摸到底（第二幕⑦，今天的砖全送完了）：手套碰到铁皮的两下空洞的「咚、咚」——空靴筒像一只空铁桶，
 * 里面的空气柱（约 260 Hz）和薄铁皮的不谐和模态一起共鸣，没有砖压着，余音比铁饼长、比铃铛闷。手套是软的，没有尖的瞬态。
 * 0.7 秒，两下在 0 和 0.07 秒（第二下轻一点）。
 */
function hollow(): Pcm {
  const r = prng(0x401f);
  const [L, R] = stereo(0.7);
  const len = L.length;
  const exc = new Float32Array(len);
  pulse(exc, 0, 0.004, 1);
  pulse(exc, 0.07, 0.004, 0.6);
  // 靴筒里的空气柱
  const al = new Float32Array(len),
    ar = new Float32Array(len);
  resonate(
    exc,
    [
      [262, 1, 0.34],
      [528, 0.38, 0.2],
      [796, 0.18, 0.13],
    ],
    al,
    ar,
    1,
    r,
    0.2,
  );
  layer(L, R, al, ar, 0.8);
  // 铁皮：比铸铁饼薄，模态高一点、拖得长一点，相拍
  const shell: Mode[] = [
    [412, 1, 0.48],
    [687, 0.7, 0.4],
    [1043, 0.55, 0.31],
    [1528, 0.36, 0.22],
    [2216, 0.22, 0.15],
  ];
  const ml = new Float32Array(len),
    mr = new Float32Array(len);
  strikes(ml, mr, [[0, 1, 0], [0.07, 0.55, 0.4]], shell, r, { width: 0.4, pairs: 0.5 });
  layer(L, R, ml, mr, 0.42);
  // 手套擦着铁皮的一点沙沙声
  layerMono(L, R, shape(level(filt(white(len, r), "bp", 1800, 0.7)), (t) => hit(t, 0.01, 0.07) + 0.6 * hit(t - 0.07, 0.008, 0.05)), 0.08, 0.1);
  space(L, R, { rt60: 0.45, wet: 0.12, size: 0.5, damp: 0.3, pre: 0.005, hp: 200 });
  return finish(L, R, { fadeOut: 0.12 });
}

/**
 * 30. 耳鸣（终章慢放：她升到白的边上，别的声音都没了，只剩一声越来越响的细高的「嘤——」，到全曲最静的那一下断掉）：
 * 3.6 kHz 的正弦带一点慢的颤（5 Hz、±5 Hz），更轻的 7.2 kHz 泛音，底下一层极轻的高频气声；1.6 秒慢慢起来，之后持平。
 * 2.4 秒，起点 0 秒；片段在断掉的那一刻结束（fadeOut 0.02）。
 */
function tinnitus(): Pcm {
  const r = prng(0x7a11);
  const [L, R] = stereo(2.4);
  const len = L.length;
  const env = (t: number) => ramp(0, 1.6, t) * (0.92 + 0.08 * Math.sin(t * 2.2));
  const f = (t: number) => 3600 + 5 * Math.sin(TAU * 5 * t);
  layerMono(L, R, sine(len, f, env), 0.6, -0.05);
  layerMono(L, R, sine(len, (t) => 2 * f(t) + 3, (t) => 0.25 * env(t)), 0.12, 0.08);
  layerMono(L, R, shape(level(filt(white(len, r), "bp", 5200, 2.5)), (t) => 0.5 * env(t)), 0.05);
  return finish(L, R, { fadeOut: 0.02 });
}

const sfx = createPcmAudio(
  {
    stomp,
    step,
    clang,
    click,
    knock,
    whoosh,
    flare,
    hum,
    thud,
    pen,
    stone,
    bell,
    crowd,
    wind,
    tram,
    door,
    rope,
    heart,
    skid,
    briefcase,
    warm,
    clink,
    swish,
    grab,
    rise,
    iron,
    chain,
    snap,
    hollow,
    tinnitus,
  },
  SR,
  { lazy: true },
);

export const { generators, createAudio } = createAudioRack({ sfx });
