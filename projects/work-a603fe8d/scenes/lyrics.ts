import type { Scene, SceneOptions } from "../../../src/engine/types";
import { DW, DH, RED, SERIF, SANS, clamp, mix, phase, smooth, easeOut, easeIn, seeded, hash, makeEnv, loadFonts, END, vocalFlux, FLUX_FPS } from "./lib";

const DEBUG = false; // 调试：画出人声起音曲线与每个字的时间

/** 找人声起音峰：起音强度 = 谐波通量 + 人声能量的上升；取所有局部极大，强度用相对两侧低谷的突起高度 */
function findPeaks(v: Float32Array, level: Float32Array) {
  const n = v.length;
  const raw = new Float32Array(n);
  for (let i = 2; i < n; i++) raw[i] = v[i] + Math.max(0, level[i] - level[i - 2]) * 0.5;
  const sm = new Float32Array(n);
  for (let i = 0; i < n; i++) sm[i] = (raw[Math.max(0, i - 1)] + raw[i] * 2 + raw[Math.min(n - 1, i + 1)]) / 4;
  const peaks: { t: number; s: number }[] = [];
  for (let i = 10; i < n - 10; i++) {
    let isMax = true;
    for (let j = i - 3; j <= i + 3; j++) if (sm[j] > sm[i]) { isMax = false; break; }
    if (!isMax) continue;
    let lo1 = sm[i], lo2 = sm[i];
    for (let j = i - 10; j < i; j++) lo1 = Math.min(lo1, sm[j]);
    for (let j = i + 1; j <= i + 10; j++) lo2 = Math.min(lo2, sm[j]);
    const prom = sm[i] - Math.max(lo1, lo2);
    if (prom > 0) peaks.push({ t: i / FLUX_FPS, s: prom });
  }
  return { sm, peaks };
}

/** 把一句的 N 个字按顺序分配到起音峰上：总强度最大，相邻字至少隔 0.07s，第一个字靠近 LRC 时间 */
function alignLine(peaks: { t: number; s: number }[], ts: number, te: number, n: number): number[] {
  const cand = peaks.filter((p) => p.t >= ts - 0.15 && p.t <= te - 0.06);
  const even = () => Array.from({ length: n }, (_, i) => ts + i * Math.min(0.24, (te - ts - 0.3) / Math.max(1, n)));
  if (cand.length < n) return even();
  const maxS = Math.max(...cand.map((p) => p.s)) || 1;
  const m = cand.length;
  const NEG = -1e9;
  const dp = Array.from({ length: n }, () => new Float64Array(m).fill(NEG));
  const from = Array.from({ length: n }, () => new Int32Array(m).fill(-1));
  for (let j = 0; j < m; j++) dp[0][j] = cand[j].s / maxS - 3 * Math.abs(cand[j].t - ts);
  for (let i = 1; i < n; i++)
    for (let j = i; j < m; j++) {
      const sj = cand[j].s / maxS;
      for (let k = i - 1; k < j; k++) {
        if (dp[i - 1][k] <= NEG / 2) continue;
        const gap = cand[j].t - cand[k].t;
        if (gap < 0.09) continue;
        // 唱一个字一般 0.13–0.5s：太挤或拖太久都扣分
        const v = dp[i - 1][k] + sj - (gap < 0.13 ? (0.13 - gap) * 12 : 0) - (gap > 0.7 ? (gap - 0.7) * 1.2 : 0);
        if (v > dp[i][j]) { dp[i][j] = v; from[i][j] = k; }
      }
    }
  let best = -1, bv = NEG;
  for (let j = 0; j < m; j++) if (dp[n - 1][j] > bv) { bv = dp[n - 1][j]; best = j; }
  if (best < 0) return even();
  const out = new Array(n);
  for (let i = n - 1, j = best; i >= 0; i--) { out[i] = cand[j].t; j = from[i][j]; }
  return out;
}

// 歌词叠加层（铺满全片，time = 作品时间）。时间 = LRC 时间 − 41.0
interface Line {
  t: number;
  rows: string[];
  keys: string[];
  y: number; // 0..1 中心位置
  size?: number;
  big?: number[];
  strip?: boolean; // 分屏中间的单行条
}
const LINES: Line[] = [
  { t: 1.19, rows: ["妈", "我觉得我才是你", "一直没有赎完的罪"], keys: ["赎完的罪"], y: 0.78 },
  { t: 6.16, rows: ["可是俺滴亲娘", "永远爱你"], big: [1], keys: ["永远爱你"], y: 0.78 },
  { t: 9.52, rows: ["可是妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], y: 0.78 },
  { t: 13.94, rows: ["原来长大就是要", "把疼痛", "咽成哑巴"], big: [2], keys: ["疼痛", "哑巴"], y: 0.78 },
  { t: 17.01, rows: ["妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], y: 0.78 },
  { t: 20.65, rows: ["你的皱纹", "是折给我的", "护身符吗"], big: [2], keys: ["皱纹", "护身符"], y: 0.78 },
  { t: 23.7, rows: ["妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], y: 0.78 },
  { t: 27.39, rows: ["原来长大就是要", "把疼痛", "咽成哑巴"], big: [2], keys: ["疼痛", "哑巴"], y: 0.78 },
  { t: 30.69, rows: ["妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], y: 0.78 },
  { t: 34.27, rows: ["要活到一百岁", "何时才能", "赎罪啊"], big: [2], keys: ["一百岁", "赎罪"], y: 0.78 },
  { t: 37.61, rows: ["妈妈"], big: [0], keys: [], y: 0.2, size: 120 },
];

export async function createScene({ width: W, height: H, quality }: SceneOptions): Promise<Scene> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const env = await makeEnv(quality);
  const vf = await vocalFlux();
  const det = vf ? findPeaks(vf.vocal, vf.level) : null;
  await loadFonts();
  const s = W / DW;
  const random = seeded(5);
  // 1) 每句单独对齐到人声起音
  const texts = LINES.map((l) => l.rows.join(""));
  const aligned = LINES.map((line, li) => {
    const next = LINES[li + 1]?.t ?? END + 1;
    return det ? alignLine(det.peaks, line.t, li === LINES.length - 1 ? line.t + 1.2 : next, texts[li].length) : null;
  });
  // 2) 同一段旋律重复出现时（副歌），取各次的中位数做节奏模板，避免个别字被鼓点带偏
  const templates = new Map<string, number[]>();
  for (const key of new Set(texts)) {
    const idx = texts.map((x, i) => (x === key ? i : -1)).filter((i) => i >= 0 && aligned[i]);
    if (idx.length < 2) continue;
    const rel = idx.map((i) => aligned[i]!.map((v) => v - aligned[i]![0]));
    templates.set(key, rel[0].map((_, k) => {
      const vals = rel.map((r) => r[k]).sort((x, y) => x - y);
      return vals.length % 2 ? vals[vals.length >> 1] : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2;
    }));
  }
  const timed = aligned.map((on, li) => {
    if (!on) return on;
    const text = texts[li];
    for (const [key, tpl] of templates) {
      if (!text.endsWith(key) || key.length < 8) continue;
      const off = text.length - key.length; // 例如「可是」+ 副歌
      const anchor = on[off];
      return on.map((v, k) => (k < off ? v : anchor + tpl[k - off]));
    }
    return on;
  });
  const layouts = LINES.map((line, li) => {
    const total = line.rows.reduce((n, r) => n + r.length, 0);
    const next = LINES[li + 1]?.t ?? END + 1;
    const span = Math.min((next - line.t) * 0.72, total * 0.24);
    const onsets = timed[li];
    const chars: { ch: string; row: number; col: number; key: boolean; at: number; rx: number; ry: number; rr: number }[] = [];
    let k = 0;
    line.rows.forEach((row, ri) => {
      const mask = new Array(row.length).fill(false);
      for (const key of line.keys) {
        let i = row.indexOf(key);
        while (i >= 0) { for (let j = 0; j < key.length; j++) mask[i + j] = true; i = row.indexOf(key, i + 1); }
      }
      [...row].forEach((ch, ci) => {
        // 每个字在它被唱出来的那一刻弹出（略提前 0.03s，让弹出动画的峰值落在字头上）
        const at = onsets ? onsets[k] - 0.03 : line.t + (k / total) * span;
        chars.push({ ch, row: ri, col: ci, key: mask[ci], at, rx: random() - 0.5, ry: random(), rr: random() - 0.5 });
        k++;
      });
    });
    return { line, chars, next };
  });

  return {
    canvas,
    render(t) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.setTransform(s, 0, 0, s, 0, 0);
      const pulse = env.pulse(t);
      for (const { line, chars, next } of layouts) {
        if (t < line.t - 0.05 || t > next + 0.35) continue;
        const final = line === LINES[LINES.length - 1];
        const exitP = final ? 0 : phase(t, next - 0.18, next + 0.12);
        const base = line.size ?? 80;
        const rowSize = line.rows.map((_, ri) => (line.big?.includes(ri) ? base * (final ? 1.25 : 1.6) : base));
        const heights = rowSize.map((v) => v * 1.3);
        const totalH = heights.reduce((a, b) => a + b, 0);
        let y0 = line.y * DH - totalH / 2;
        const rowY = heights.map((h) => { const y = y0 + h / 2; y0 += h; return y; });
        if (line.strip) {
          // 分屏中间的黑条
          const a = smooth(phase(t, line.t - 0.05, line.t + 0.1)) * (1 - exitP);
          ctx.fillStyle = `rgba(0,0,0,${a})`;
          ctx.fillRect(0, line.y * DH - 60, DW, 120);
          ctx.fillStyle = `rgba(255,42,54,${a})`;
          ctx.fillRect(0, line.y * DH - 60, DW * smooth(phase(t, line.t, line.t + 0.5)), 3);
        }
        for (const c of chars) {
          const local = t - c.at;
          if (local < 0) continue;
          const size = rowSize[c.row];
          const len = line.rows[c.row].length;
          const track = size * (final ? 1.45 : line.strip ? 1.02 : 1.08);
          const x = DW / 2 + (c.col - (len - 1) / 2) * track;
          const y = rowY[c.row];
          const inP = clamp(local / 0.2);
          let sc = 1 + (1 - easeOut(inP)) * (c.key ? 1.6 : 0.9);
          let a = inP, dx = 0, dy = (1 - easeOut(inP)) * -10, rot = 0;
          if (exitP > 0) {
            const e = easeIn(exitP);
            dx += c.rx * 160 * e;
            dy -= (40 + c.ry * 140) * e;
            rot += c.rr * 0.9 * e;
            sc *= 1 + e * 0.35;
            a *= 1 - e;
          }
          if (c.key && local > 0.05) {
            const f = Math.floor(t * 30);
            dx += (hash(f + c.col * 7.3) - 0.5) * pulse * 10;
            dy += (hash(f + c.col * 3.1 + 9) - 0.5) * pulse * 10;
            sc *= 1 + pulse * 0.06;
          }
          if (final) {
            a = smooth(clamp(local / 0.5)) * (1 - smooth(phase(t, END - 0.68, END - 0.4)));
            sc = mix(1.3, 1, easeOut(clamp(local / 1.2)));
          }
          if (a <= 0.001) continue;
          ctx.save();
          ctx.translate(x + dx, y + dy);
          ctx.rotate(rot);
          ctx.scale(sc, sc);
          ctx.font = `900 ${Math.round(size)}px ${SERIF}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.globalAlpha = a;
          const split = (c.key ? 6 : 2.5) * (0.4 + pulse);
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = "rgba(255,0,40,0.5)";
          ctx.fillText(c.ch, -split, 0);
          ctx.fillStyle = "rgba(0,200,255,0.35)";
          ctx.fillText(c.ch, split, 0);
          ctx.globalCompositeOperation = "source-over";
          ctx.shadowColor = c.key ? "rgba(255,30,50,0.9)" : final ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.95)";
          ctx.shadowBlur = c.key ? 26 : 20;
          ctx.fillStyle = c.key ? RED : final ? "#141414" : "#f6f3ec";
          ctx.fillText(c.ch, 0, 0);
          ctx.restore();
        }
      }
      if (DEBUG && det) {
        const x0 = 40, x1 = DW - 40, y0 = 260, h = 260, span = 3;
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(x0 - 10, y0 - 20, x1 - x0 + 20, h + 90);
        const tx = (tt: number) => x0 + ((tt - (t - span / 2)) / span) * (x1 - x0);
        let mx = 0;
        const f0 = Math.max(0, Math.floor((t - span / 2) * FLUX_FPS)), f1 = Math.min(det.sm.length - 1, Math.ceil((t + span / 2) * FLUX_FPS));
        for (let f = f0; f <= f1; f++) mx = Math.max(mx, det.sm[f]);
        ctx.strokeStyle = "#7fd";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let f = f0; f <= f1; f++) { const x = tx(f / FLUX_FPS), y = y0 + h - (det.sm[f] / (mx || 1)) * h; f === f0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
        ctx.fillStyle = "#ff0";
        for (const p of det.peaks) if (Math.abs(p.t - t) < span / 2) { ctx.beginPath(); ctx.arc(tx(p.t), y0 + h + 10, 4, 0, Math.PI * 2); ctx.fill(); }
        ctx.font = `700 26px ${SANS}`;
        ctx.textAlign = "center";
        for (const { chars } of layouts) for (const c of chars) {
          const at = c.at + 0.03;
          if (Math.abs(at - t) > span / 2) continue;
          ctx.fillStyle = RED;
          ctx.fillRect(tx(at) - 1, y0, 2, h);
          ctx.fillStyle = "#fff";
          ctx.fillText(c.ch, tx(at), y0 + h + 44);
        }
        // 当前这句每个字相对句首的时间
        const cur = layouts.find((L) => t >= L.line.t - 0.1 && t < L.next);
        if (cur) {
          ctx.textAlign = "left";
          ctx.font = `600 24px ${SANS}`;
          let lx = x0, ly = y0 + h + 84;
          for (const c of cur.chars) {
            const str = `${c.ch}${(c.at + 0.03 - cur.line.t).toFixed(2)} `;
            const w = ctx.measureText(str).width;
            if (lx + w > x1) { lx = x0; ly += 32; }
            ctx.fillStyle = "#fff";
            ctx.fillText(str, lx, ly);
            lx += w;
          }
          ctx.textAlign = "center";
        }
        ctx.fillStyle = "#fff";
        ctx.fillRect(tx(t) - 1, y0 - 10, 3, h + 20);
        ctx.fillText(t.toFixed(2), tx(t), y0 - 26);
      }
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
