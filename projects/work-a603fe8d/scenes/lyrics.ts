import type { Scene, SceneOptions } from "../../../src/engine/types";
import { DW, DH, RED, SERIF, clamp, mix, phase, smooth, easeOut, easeIn, seeded, hash, makeEnv, loadFonts, END } from "./lib";

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
  { t: 1.19, rows: ["妈", "我觉得我才是你", "一直没有赎完的罪"], keys: ["赎完的罪"], y: 0.72 },
  { t: 6.16, rows: ["可是俺滴亲娘", "永远爱你"], big: [1], keys: ["永远爱你"], y: 0.72 },
  { t: 9.52, rows: ["可是妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], y: 0.77 },
  { t: 13.94, rows: ["原来长大就是要把疼痛咽成哑巴"], keys: ["疼痛", "哑巴"], y: 0.5, size: 60, strip: true },
  { t: 17.01, rows: ["妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], y: 0.74 },
  { t: 20.65, rows: ["你的皱纹", "是折给我的", "护身符吗"], big: [2], keys: ["皱纹", "护身符"], y: 0.2 },
  { t: 23.7, rows: ["妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], y: 0.75 },
  { t: 27.39, rows: ["原来长大就是要把疼痛咽成哑巴"], keys: ["疼痛", "哑巴"], y: 0.5, size: 60, strip: true },
  { t: 30.69, rows: ["妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], y: 0.73 },
  { t: 34.27, rows: ["要活到一百岁", "何时才能", "赎罪啊"], big: [2], keys: ["一百岁", "赎罪"], y: 0.62 },
  { t: 37.61, rows: ["妈妈"], big: [0], keys: [], y: 0.2, size: 120 },
];

export async function createScene({ width: W, height: H, quality }: SceneOptions): Promise<Scene> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const env = await makeEnv(quality);
  await loadFonts();
  const s = W / DW;
  const random = seeded(5);
  const layouts = LINES.map((line, li) => {
    const total = line.rows.reduce((n, r) => n + r.length, 0);
    const next = LINES[li + 1]?.t ?? END + 1;
    const span = Math.min((next - line.t) * 0.72, total * 0.24);
    const chars: { ch: string; row: number; col: number; key: boolean; at: number; rx: number; ry: number; rr: number }[] = [];
    let k = 0;
    line.rows.forEach((row, ri) => {
      const mask = new Array(row.length).fill(false);
      for (const key of line.keys) {
        let i = row.indexOf(key);
        while (i >= 0) { for (let j = 0; j < key.length; j++) mask[i + j] = true; i = row.indexOf(key, i + 1); }
      }
      [...row].forEach((ch, ci) => {
        chars.push({ ch, row: ri, col: ci, key: mask[ci], at: line.t + (k / total) * span, rx: random() - 0.5, ry: random(), rr: random() - 0.5 });
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
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
