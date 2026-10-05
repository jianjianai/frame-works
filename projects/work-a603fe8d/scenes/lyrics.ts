import type { Scene, SceneOptions } from "../../../src/engine/types";
import { assetUrl } from "../../../src/engine/types";
import { clamp, mix, phase, smooth, easeInOut, seeded } from "../../../src/engine/math";

// 歌曲素材里的起点（秒）：作品 0s = 歌曲 41.0s。audio.json 的 offset 要与它一致。
export const SONG_OFFSET = 41.0;
const COVER = "films/work-a603fe8d/cover.jpg";
const SONG = "films/work-a603fe8d/song.flac";
const FONT = `"Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", "STSong", "SimSun", serif`;
const RED = "#ff2a36";

type Effect = "none" | "hundred" | "mute" | "wrinkle" | "sin" | "final";
interface Line {
  t: number; // 作品时间
  rows: string[];
  big?: number[]; // 放大的行
  keys: string[]; // 标红的词
  fx: Effect;
}

// LRC 时间 - 41.0
const LINES: Line[] = [
  { t: 1.19, rows: ["妈", "我觉得我才是你", "一直没有赎完的罪"], keys: ["赎完的罪"], fx: "none" },
  { t: 6.16, rows: ["可是俺滴亲娘", "永远爱你"], big: [1], keys: ["永远爱你"], fx: "none" },
  { t: 9.52, rows: ["可是妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], fx: "hundred" },
  { t: 13.94, rows: ["原来长大就是要", "把疼痛", "咽成哑巴"], big: [2], keys: ["疼痛", "哑巴"], fx: "mute" },
  { t: 17.01, rows: ["妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], fx: "hundred" },
  { t: 20.65, rows: ["你的皱纹", "是折给我的", "护身符吗"], big: [2], keys: ["皱纹", "护身符"], fx: "wrinkle" },
  { t: 23.7, rows: ["妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], fx: "hundred" },
  { t: 27.39, rows: ["原来长大就是要", "把疼痛", "咽成哑巴"], big: [2], keys: ["疼痛", "哑巴"], fx: "mute" },
  { t: 30.69, rows: ["妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], fx: "hundred" },
  { t: 34.27, rows: ["要活到一百岁", "何时才能", "赎罪啊"], big: [2], keys: ["一百岁", "赎罪"], fx: "sin" },
  { t: 37.61, rows: ["妈妈"], big: [0], keys: [], fx: "final" },
];
const END = 39;
const DROP = 9.2;

// 镜头：每句歌词一个切点。fx/fy 是封面上的对焦点（0..1），zoom 1 = 封面高度铺满画面。
interface Shot { t: number; invert: boolean; z0: number; z1: number; fx: number; fy: number; dim: number; }
const SHOTS: Shot[] = [
  { t: 0, invert: true, z0: 1.0, z1: 1.12, fx: 0.5, fy: 0.55, dim: 0.75 },
  { t: 6.16, invert: true, z0: 1.55, z1: 1.75, fx: 0.48, fy: 0.55, dim: 0.85 },
  { t: DROP, invert: false, z0: 1.12, z1: 1.0, fx: 0.5, fy: 0.55, dim: 0.8 },
  { t: 13.94, invert: true, z0: 1.9, z1: 1.65, fx: 0.48, fy: 0.54, dim: 0.95 },
  { t: 17.01, invert: false, z0: 1.0, z1: 1.18, fx: 0.5, fy: 0.6, dim: 0.8 },
  { t: 20.65, invert: false, z0: 2.3, z1: 2.0, fx: 0.47, fy: 0.52, dim: 0.78 },
  { t: 23.7, invert: true, z0: 1.0, z1: 1.15, fx: 0.5, fy: 0.55, dim: 0.95 },
  { t: 27.39, invert: false, z0: 1.6, z1: 1.4, fx: 0.5, fy: 0.72, dim: 0.78 },
  { t: 30.69, invert: true, z0: 1.3, z1: 1.5, fx: 0.48, fy: 0.55, dim: 0.95 },
  { t: 34.27, invert: false, z0: 2.0, z1: 1.0, fx: 0.48, fy: 0.55, dim: 0.75 },
  { t: 37.61, invert: true, z0: 1.0, z1: 1.08, fx: 0.5, fy: 0.55, dim: 0.45 },
];

const bump = (t: number, a: number, b: number, c: number, d: number) =>
  smooth(phase(t, a, b)) * (1 - smooth(phase(t, c, d)));
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- 音频分析：解码歌曲，得到低频冲击包络（60 帧/秒），全部预先算好 ----------
const ENV_FPS = 60;
interface Envelope { pulse: Float32Array; level: Float32Array; }
const envelopeCache = new Map<string, Promise<Envelope | null>>();

function analyzeSong(): Promise<Envelope | null> {
  let p = envelopeCache.get(SONG);
  if (!p) {
    p = (async () => {
      try {
        const buf = await (await fetch(assetUrl(SONG))).arrayBuffer();
        const sr = 22050;
        const ctx = new OfflineAudioContext(1, sr, sr);
        const audio = await ctx.decodeAudioData(buf);
        const chs = Array.from({ length: audio.numberOfChannels }, (_, i) => audio.getChannelData(i));
        const rate = audio.sampleRate;
        const hop = Math.round(rate / ENV_FPS);
        const n = Math.ceil(END * ENV_FPS) + 2;
        const bass = new Float32Array(n);
        const full = new Float32Array(n);
        const a = 1 - Math.exp((-2 * Math.PI * 140) / rate);
        let lp = 0;
        const start = Math.floor(SONG_OFFSET * rate);
        for (let i = 0; i < n; i++) {
          let eb = 0, ef = 0;
          for (let k = 0; k < hop; k++) {
            const idx = start + i * hop + k;
            let s = 0;
            for (const ch of chs) s += idx < ch.length ? ch[idx] : 0;
            s /= chs.length;
            lp += a * (s - lp);
            eb += lp * lp;
            ef += s * s;
          }
          bass[i] = Math.sqrt(eb / hop);
          full[i] = Math.sqrt(ef / hop);
        }
        const onset = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          let avg = 0, c = 0;
          for (let j = Math.max(0, i - 10); j < i; j++) { avg += bass[j]; c++; }
          avg = c ? avg / c : bass[i];
          onset[i] = Math.max(0, bass[i] - avg * 1.15);
        }
        const sorted = Array.from(onset).sort((x, y) => x - y);
        const ref = sorted[Math.floor(sorted.length * 0.97)] || 1;
        const pulse = new Float32Array(n);
        const decay = Math.exp(-1 / (ENV_FPS * 0.13));
        for (let i = 0; i < n; i++) {
          const v = clamp(onset[i] / ref);
          pulse[i] = Math.max(v, i ? pulse[i - 1] * decay : 0);
        }
        const fs = Array.from(full).sort((x, y) => x - y);
        const fref = fs[Math.floor(fs.length * 0.95)] || 1;
        const level = full.map((v) => clamp(v / fref));
        return { pulse, level };
      } catch (err) {
        console.warn("[mv] 音频分析失败，改用固定节拍", err);
        return null;
      }
    })();
    envelopeCache.set(SONG, p);
  }
  return p;
}

// ---------- 场景 ----------
export async function createScene({ width: W, height: H, quality }: SceneOptions): Promise<Scene> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const u = W / 1080; // 设计单位

  const img = new Image();
  img.src = assetUrl(COVER);
  const [env] = await Promise.all([analyzeSong(), img.decode()]);
  try { await document.fonts.load(`900 80px ${FONT}`, "妈妈一百岁"); } catch { /* 字体回退 */ }

  // 封面：正片与反相两版，预先缩到合适尺寸
  const S = Math.min(2400, Math.round(H * 1.3));
  const makeCover = (invert: boolean) => {
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d")!;
    g.filter = invert ? "invert(1) contrast(1.15)" : "contrast(1.45) brightness(0.95)";
    g.drawImage(img, 0, 0, S, S);
    g.filter = "none";
    // 盖住封面顶部原有的标题字
    const grad = g.createLinearGradient(0, 0, 0, S * 0.12);
    const top = invert ? "32,32,32" : "38,38,38";
    grad.addColorStop(0, `rgb(${top})`);
    grad.addColorStop(0.75, `rgb(${top})`);
    grad.addColorStop(1, `rgba(${top},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S * 0.12);
    return c;
  };
  const coverN = makeCover(false);
  const coverI = makeCover(true);

  // 颗粒噪点
  const random = seeded(9);
  const grainW = Math.round(W / 3), grainH = Math.round(H / 3);
  const grains = Array.from({ length: quality === "draft" ? 2 : 4 }, () => {
    const c = document.createElement("canvas");
    c.width = grainW;
    c.height = grainH;
    const g = c.getContext("2d")!;
    const data = g.createImageData(grainW, grainH);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = random() * 255;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    g.putImageData(data, 0, 0);
    return c;
  });

  // 暗角
  const vignette = document.createElement("canvas");
  vignette.width = W;
  vignette.height = H;
  {
    const g = vignette.getContext("2d")!;
    const rg = g.createRadialGradient(W / 2, H * 0.48, H * 0.22, W / 2, H * 0.5, H * 0.75);
    rg.addColorStop(0, "rgba(0,0,0,0)");
    rg.addColorStop(1, "rgba(0,0,0,0.85)");
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);
    const lg = g.createLinearGradient(0, H * 0.5, 0, H);
    lg.addColorStop(0, "rgba(0,0,0,0)");
    lg.addColorStop(0.45, "rgba(0,0,0,0.55)");
    lg.addColorStop(1, "rgba(0,0,0,0.8)");
    g.fillStyle = lg;
    g.fillRect(0, H * 0.5, W, H * 0.5);
  }

  // 飘浮灰尘
  const dust = Array.from({ length: quality === "draft" ? 30 : 70 }, () => ({
    x: random(), y: random(), r: 0.6 + random() * 2.2, sp: 0.01 + random() * 0.03, ph: random() * 10,
  }));

  // 每句歌词的字符布局（固定种子的散开方向）
  const layouts = LINES.map((line, li) => {
    const total = line.rows.reduce((s, r) => s + r.length, 0);
    const next = LINES[li + 1]?.t ?? END + 1;
    const span = Math.min((next - line.t) * 0.72, total * 0.26);
    const chars: { ch: string; row: number; col: number; key: boolean; at: number; rx: number; ry: number; rr: number }[] = [];
    let k = 0;
    line.rows.forEach((row, ri) => {
      const keyMask = new Array(row.length).fill(false);
      for (const key of line.keys) {
        let i = row.indexOf(key);
        while (i >= 0) { for (let j = 0; j < key.length; j++) keyMask[i + j] = true; i = row.indexOf(key, i + 1); }
      }
      [...row].forEach((ch, ci) => {
        chars.push({
          ch, row: ri, col: ci, key: keyMask[ci], at: line.t + (k / Math.max(1, total)) * span,
          rx: random() - 0.5, ry: random(), rr: random() - 0.5,
        });
        k++;
      });
    });
    return { line, chars, next, span };
  });

  const pulseAt = (t: number) => {
    if (env) {
      const i = clamp(Math.floor(t * ENV_FPS), 0, env.pulse.length - 1);
      return env.pulse[i];
    }
    if (t < DROP) return 0;
    const b = 60 / 140;
    return Math.exp(-(((t - DROP) % b + b) % b) / 0.1);
  };
  const levelAt = (t: number) => (env ? env.level[clamp(Math.floor(t * ENV_FPS), 0, env.level.length - 1)] : 0.6);

  function shotAt(t: number) {
    let i = 0;
    while (i + 1 < SHOTS.length && SHOTS[i + 1].t <= t) i++;
    const s = SHOTS[i];
    const e = SHOTS[i + 1]?.t ?? END;
    return { s, p: phase(t, s.t, e), since: t - s.t, index: i };
  }

  function drawCover(t: number, pulse: number, shakeX: number, shakeY: number) {
    const { s, p } = shotAt(t);
    const z = mix(s.z0, s.z1, easeInOut(p)) * (1 + pulse * 0.025);
    const size = H * z;
    let x = W / 2 - s.fx * size;
    let y = H * 0.46 - s.fy * size;
    x = clamp(x, W - size, 0);
    y = clamp(y, H - size, 0);
    ctx.drawImage(s.invert ? coverI : coverN, x + shakeX, y + shakeY, size, size);
    // 压暗，给白字留出对比
    ctx.fillStyle = `rgba(0,0,0,${1 - s.dim})`;
    ctx.fillRect(0, 0, W, H);
    return s;
  }

  function charFont(size: number) {
    return `900 ${Math.round(size)}px ${FONT}`;
  }

  function drawLyrics(t: number, pulse: number) {
    for (const lay of layouts) {
      const { line, chars, next } = lay;
      if (t < line.t - 0.05 || t > next + 0.4) continue;
      const isFinal = line.fx === "final";
      const exitP = isFinal ? 0 : phase(t, next - 0.2, next + 0.15);
      const base = (isFinal ? 150 : 82) * u;
      const rowSize = line.rows.map((_, ri) => (line.big?.includes(ri) ? base * (isFinal ? 1.4 : 1.65) : base));
      const gap = 0.32;
      const heights = rowSize.map((s) => s * (1 + gap));
      const totalH = heights.reduce((a, b) => a + b, 0);
      const cy = isFinal ? H * 0.5 : H * 0.735;
      let y0 = cy - totalH / 2;
      const rowY = heights.map((h) => { const y = y0 + h / 2; y0 += h; return y; });

      for (const c of chars) {
        const local = t - c.at;
        if (local < 0) continue;
        const size = rowSize[c.row];
        const rowLen = line.rows[c.row].length;
        const track = size * (isFinal ? 1.35 : 1.08);
        const x = W / 2 + (c.col - (rowLen - 1) / 2) * track;
        const y = rowY[c.row];
        const inP = clamp(local / 0.2);
        const pop = 1 + (1 - easeOut(inP)) * (c.key ? 1.6 : 0.9);
        let a = inP;
        let dx = 0, dy = (1 - easeOut(inP)) * -10 * u, rot = 0, sc = pop;
        if (exitP > 0) {
          const e = easeIn(exitP);
          dx += c.rx * 160 * u * e;
          dy += -(40 + c.ry * 140) * u * e;
          rot += c.rr * 0.9 * e;
          sc *= 1 + e * 0.35;
          a *= 1 - e;
        }
        if (c.key && local > 0.05) {
          // 关键词随鼓点抖动
          dx += (hash(Math.floor(t * 30) + c.col * 7.3) - 0.5) * pulse * 10 * u;
          dy += (hash(Math.floor(t * 30) + c.col * 3.1 + 9) - 0.5) * pulse * 10 * u;
          sc *= 1 + pulse * 0.06;
        }
        if (isFinal) {
          a = smooth(clamp(local / 0.6));
          sc = mix(1.25, 1, easeOut(clamp(local / 1.2)));
          a *= 1 - smooth(phase(t, END - 0.6, END - 0.05)) * 0.0;
        }
        if (a <= 0.001) continue;
        ctx.save();
        ctx.translate(x + dx, y + dy);
        ctx.rotate(rot);
        ctx.scale(sc, sc);
        ctx.font = charFont(size);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = a;
        // 错位色散
        const split = (c.key ? 6 : 2.5) * u * (0.4 + pulse);
        if (split > 0.5 * u) {
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = "rgba(255,0,40,0.55)";
          ctx.fillText(c.ch, -split, 0);
          ctx.fillStyle = "rgba(0,200,255,0.4)";
          ctx.fillText(c.ch, split, 0);
          ctx.globalCompositeOperation = "source-over";
        }
        ctx.shadowColor = c.key ? "rgba(255,30,50,0.9)" : "rgba(0,0,0,0.9)";
        ctx.shadowBlur = (c.key ? 28 : 18) * u;
        ctx.fillStyle = c.key ? RED : "#f4f1ea";
        ctx.fillText(c.ch, 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // 「咽成哑巴」：一条黑色封条划过
      if (line.fx === "mute") {
        const lastRow = line.rows.length - 1;
        const last = chars[chars.length - 1];
        const sp = easeInOut(phase(t, last.at + 0.35, last.at + 0.7)) * (1 - exitP);
        if (sp > 0) {
          // 封住「哑巴」两个字
          const size = rowSize[lastRow];
          const row = line.rows[lastRow];
          const track = size * 1.08;
          const i0 = row.indexOf("哑巴");
          const left = (i0 - (row.length - 1) / 2 - 0.5) * track - 14 * u;
          const len = 2 * track + 28 * u;
          ctx.save();
          ctx.translate(W / 2, rowY[lastRow]);
          ctx.rotate(-0.05);
          ctx.fillStyle = "#050505";
          ctx.fillRect(left, -size * 0.52, len * sp, size * 1.04);
          ctx.fillStyle = RED;
          ctx.fillRect(left, -size * 0.52, len * sp, 5 * u);
          ctx.fillRect(left, size * 0.52 - 5 * u, len * sp, 5 * u);
          ctx.restore();
        }
      }
      // 「护身符」：红色符框
      if (line.fx === "wrinkle") {
        const lastRow = line.rows.length - 1;
        const first = chars.find((c) => c.row === lastRow)!;
        const fp = easeOut(phase(t, first.at, first.at + 0.5)) * (1 - exitP);
        if (fp > 0) {
          const size = rowSize[lastRow];
          const w = line.rows[lastRow].length * size * 1.08 + 50 * u;
          const h = size * 1.45;
          ctx.save();
          ctx.translate(W / 2, rowY[lastRow]);
          ctx.strokeStyle = RED;
          ctx.globalAlpha = fp;
          ctx.lineWidth = 4 * u;
          ctx.strokeRect(-w / 2 * fp, -h / 2, w * fp, h);
          ctx.lineWidth = 1.5 * u;
          ctx.strokeRect(-w / 2 * fp - 10 * u, -h / 2 - 10 * u, w * fp + 20 * u, h + 20 * u);
          ctx.restore();
        }
      }
    }
  }

  // 背景大数字：岁数从 0 数到 100
  function drawHundred(t: number, pulse: number) {
    for (const lay of layouts) {
      if (lay.line.fx !== "hundred" && lay.line.fx !== "sin") continue;
      const { line, chars, next } = lay;
      if (t < line.t || t > next + 0.2) continue;
      const hit = chars.find((c) => c.ch === "百")!.at;
      const n = Math.round(100 * Math.pow(clamp((t - line.t) / (hit - line.t)), 1.6));
      const a = smooth(phase(t, line.t, line.t + 0.3)) * (1 - smooth(phase(t, next - 0.25, next + 0.1)));
      const landed = t >= hit;
      const size = 470 * u * (landed ? 1 + pulse * 0.05 : 1);
      ctx.save();
      ctx.font = `900 ${Math.round(size)}px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = a * (landed ? 0.85 : 0.5);
      ctx.lineWidth = 3 * u;
      ctx.strokeStyle = landed ? RED : "rgba(255,255,255,0.8)";
      ctx.strokeText(String(n), W / 2, H * 0.36);
      ctx.font = `700 ${Math.round(56 * u)}px ${FONT}`;
      ctx.fillStyle = landed ? RED : "rgba(255,255,255,0.8)";
      ctx.textAlign = "left";
      const tw = (String(n).length * 0.55 + 0.05) * size / 2;
      ctx.fillText("岁", W / 2 + tw, H * 0.36 + size * 0.28);
      ctx.restore();
    }
  }

  // 「皱纹」：画面上慢慢折出的细纹
  function drawWrinkles(t: number) {
    const lay = layouts.find((l) => l.line.fx === "wrinkle")!;
    const { line, next } = lay;
    if (t < line.t || t > next + 0.2) return;
    const a = 1 - smooth(phase(t, next - 0.3, next + 0.1));
    const grow = easeOut(phase(t, line.t, line.t + 1.6));
    ctx.save();
    ctx.globalAlpha = 0.35 * a;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.6 * u;
    for (let i = 0; i < 9; i++) {
      const y = H * (0.2 + i * 0.045);
      ctx.beginPath();
      const len = W * grow;
      const x0 = i % 2 ? W - len : 0;
      for (let x = 0; x <= len; x += 12 * u) {
        const xx = x0 + x;
        const yy = y + Math.sin(xx * 0.012 / u + i * 1.7) * 9 * u + Math.sin(xx * 0.031 / u + i) * 4 * u;
        if (x === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTop(t: number) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // 开头钩子
    const hook = 1 - smooth(phase(t, 8.2, 8.6));
    if (hook > 0) {
      ctx.globalAlpha = hook * smooth(phase(t, 0.0, 0.4));
      ctx.font = `700 ${Math.round(44 * u)}px ${FONT}`;
      ctx.fillStyle = "#f4f1ea";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 14 * u;
      ctx.fillText("戴上耳机  ·  一定要听到最后", W / 2, H * 0.115);
    }
    // 歌名（像封面那样字距拉开）
    const title = smooth(phase(t, DROP, DROP + 0.6)) * (1 - smooth(phase(t, 37.3, 37.6)));
    if (title > 0) {
      ctx.globalAlpha = title;
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 12 * u;
      ctx.fillStyle = "#f4f1ea";
      ctx.font = `700 ${Math.round(46 * u)}px ${FONT}`;
      const text = "可是，妈妈";
      const step = 70 * u;
      [...text].forEach((ch, i) => ctx.fillText(ch, W / 2 + (i - (text.length - 1) / 2) * step, H * 0.1));
      ctx.font = `400 ${Math.round(26 * u)}px ${FONT}`;
      ctx.globalAlpha = title * 0.75;
      ctx.fillText("—  6moon9  —", W / 2, H * 0.1 + 58 * u);
    }
    ctx.restore();
  }

  function drawFinalCredit(t: number) {
    const a = smooth(phase(t, 38.1, 38.6));
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a * 0.8;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f4f1ea";
    ctx.font = `400 ${Math.round(32 * u)}px ${FONT}`;
    ctx.fillText("《可是，妈妈》  6moon9", W / 2, H * 0.66);
    ctx.restore();
  }

  function drawDust(t: number, lift: number) {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    for (const d of dust) {
      const y = ((d.y - t * d.sp - lift * 0.0) % 1 + 1) % 1;
      const x = d.x + Math.sin(t * 0.6 + d.ph) * 0.01;
      ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(t * 1.3 + d.ph));
      ctx.beginPath();
      ctx.arc(x * W, y * H, d.r * u, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function glitch(t: number, amount: number) {
    if (amount < 0.05) return;
    const f = Math.floor(t * 30);
    const slices = 2 + Math.floor(hash(f) * 5 * amount);
    for (let i = 0; i < slices; i++) {
      const sy = hash(f * 3.1 + i) * H;
      const sh = (8 + hash(f * 7.7 + i) * 70) * u;
      const off = (hash(f * 1.3 + i * 5) - 0.5) * 90 * u * amount;
      ctx.drawImage(canvas, 0, sy, W, sh, off, sy, W, sh);
    }
  }

  return {
    canvas,
    render(t) {
      const pulse = t >= DROP && t < 37.5 ? pulseAt(t) : pulseAt(t) * 0.35;
      const f = Math.floor(t * 30);
      const shakeAmt = (t >= DROP && t < 37.5 ? 16 : 4) * u * pulse;
      const shakeX = (hash(f + 0.5) - 0.5) * shakeAmt;
      const shakeY = (hash(f + 9.5) - 0.5) * shakeAmt;

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      const shot = drawCover(t, pulse, shakeX, shakeY);

      // 「赎罪」一句：画面逐渐染红
      const sinLine = LINES.find((l) => l.fx === "sin")!;
      const red = smooth(phase(t, sinLine.t, sinLine.t + 1.5)) * (1 - smooth(phase(t, 37.4, 37.7)));
      if (red > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = `rgba(255,${Math.round(mix(255, 40, red))},${Math.round(mix(255, 50, red))},1)`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      ctx.drawImage(vignette, 0, 0);
      drawDust(t, pulse);

      // 歌曲里的两处停顿：画面骤暗
      const black = Math.max(bump(t, 5.35, 5.5, 5.9, 6.16), bump(t, 8.15, 8.35, 9.1, DROP)) * 0.92
        + (1 - smooth(phase(t, 0, 0.5))) * 0.9;
      if (black > 0) {
        ctx.fillStyle = `rgba(0,0,0,${clamp(black)})`;
        ctx.fillRect(0, 0, W, H);
      }

      drawHundred(t, pulse);
      drawWrinkles(t);
      drawLyrics(t, pulse);
      drawTop(t);
      drawFinalCredit(t);

      // 颗粒
      ctx.save();
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = shot.invert ? 0.22 : 0.3;
      const g = grains[f % grains.length];
      const ox = hash(f * 2.3) * grainW, oy = hash(f * 4.1) * grainH;
      ctx.translate(-ox * 3, -oy * 3);
      for (let gx = 0; gx < 2; gx++) for (let gy = 0; gy < 2; gy++) ctx.drawImage(g, gx * W, gy * H, W, H);
      ctx.restore();

      // 切镜闪白 + 副歌爆发
      const { since, index } = shotAt(t);
      let flash = index > 0 ? Math.exp(-since / 0.09) * 0.35 : 0;
      flash = Math.max(flash, t >= DROP ? Math.exp(-(t - DROP) / 0.35) : 0);
      flash = Math.max(flash, t >= 37.61 ? Math.exp(-(t - 37.61) / 0.25) * 0.7 : 0);
      if (flash > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${clamp(flash)})`;
        ctx.fillRect(0, 0, W, H);
      }

      // 鼓点撕裂
      const lv = levelAt(t);
      const gAmt = t >= DROP && t < 37.5 ? clamp((pulse - 0.55) * 2.2) * (0.6 + lv * 0.4) : 0;
      glitch(t, gAmt + (index > 0 ? Math.exp(-since / 0.12) * 0.8 : 0));

      // 结尾淡出
      const out = smooth(phase(t, END - 0.5, END));
      if (out > 0) {
        ctx.fillStyle = `rgba(0,0,0,${out})`;
        ctx.fillRect(0, 0, W, H);
      }
    },
    dispose() {
      for (const c of [coverN, coverI, vignette, ...grains]) c.width = c.height = 1;
      canvas.width = canvas.height = 1;
    },
  };
}

function easeOut(x: number) { return 1 - Math.pow(1 - x, 3); }
function easeIn(x: number) { return x * x * x; }
