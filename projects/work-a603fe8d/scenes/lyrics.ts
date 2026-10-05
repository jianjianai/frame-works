import type { Scene, SceneOptions } from "../../../src/engine/types";
import { DW, DH, RED, SERIF, clamp, mix, phase, smooth, easeOut, easeIn, seeded, hash, makeEnv, loadFonts, END } from "./lib";

// 歌词叠加层（铺满全片，time = 作品时间）。
// 逐字时间来自酷狗官方逐字歌词（KRC，id 462463574），换算成作品时间（歌曲时间 − 41.0s）；
// at = 每个字开始唱的时间，dur = 这个字唱多久。与频谱人工核对过（如「我」1.84、「亲」6.97、「永」7.57）。
interface Line {
  rows: string[];
  keys: string[];
  y: number; // 0..1 中心位置
  size?: number;
  big?: number[];
  at: number[];
  dur: number[];
}
const LINES: Line[] = [
  { rows: ["妈", "我觉得我才是你", "一直没有赎完的罪"], keys: ["赎完的罪"], y: 0.78,
    at: [0.968, 1.838, 1.998, 2.126, 2.309, 2.502, 2.663, 2.822, 3.006, 3.206, 3.422, 3.574, 3.718, 3.895, 4.038, 4.23],
    dur: [0.201, 0.16, 0.128, 0.183, 0.193, 0.161, 0.159, 0.184, 0.2, 0.216, 0.152, 0.144, 0.177, 0.143, 0.192, 0.128] },
  { rows: ["可是俺滴亲娘", "永远爱你"], big: [1], keys: ["永远爱你"], y: 0.78,
    at: [6.246, 6.446, 6.645, 6.822, 6.966, 7.158, 7.574, 7.742, 7.886, 8.094],
    dur: [0.2, 0.199, 0.177, 0.144, 0.192, 0.144, 0.168, 0.144, 0.208, 0.12] },
  { rows: ["可是妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], y: 0.78,
    at: [9.713, 9.872, 10.08, 10.264, 11.299, 11.465, 11.601, 11.809, 12.025, 12.257, 12.425, 12.673, 12.849, 13.057, 13.273],
    dur: [0.159, 0.208, 0.184, 0.529, 0.166, 0.136, 0.208, 0.216, 0.232, 0.168, 0.248, 0.176, 0.208, 0.216, 0.424] },
  { rows: ["原来长大就是要", "把疼痛", "咽成哑巴"], big: [2], keys: ["疼痛", "哑巴"], y: 0.78,
    at: [13.897, 14.073, 14.337, 14.505, 14.785, 14.977, 15.225, 15.401, 15.666, 15.833, 16.105, 16.281, 16.481, 16.689],
    dur: [0.176, 0.264, 0.168, 0.28, 0.192, 0.248, 0.176, 0.265, 0.167, 0.272, 0.176, 0.2, 0.208, 0.265] },
  { rows: ["妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], y: 0.78,
    at: [16.954, 17.115, 18.106, 18.266, 18.419, 18.627, 18.786, 19.042, 19.194, 19.45, 19.625, 19.81, 20.026],
    dur: [0.161, 0.751, 0.16, 0.153, 0.208, 0.159, 0.256, 0.152, 0.256, 0.175, 0.185, 0.216, 0.152] },
  { rows: ["你的皱纹", "是折给我的", "护身符吗"], big: [2], keys: ["皱纹", "护身符"], y: 0.78,
    at: [20.594, 20.802, 21.09, 21.258, 21.586, 21.826, 22.05, 22.274, 22.49, 22.7, 22.9, 23.204, 23.516],
    dur: [0.208, 0.288, 0.168, 0.328, 0.24, 0.224, 0.224, 0.216, 0.21, 0.2, 0.304, 0.312, 0.128] },
  { rows: ["妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], y: 0.78,
    at: [23.98, 24.132, 25.036, 25.188, 25.341, 25.532, 25.7, 25.949, 26.1, 26.348, 26.508, 26.708, 26.972],
    dur: [0.152, 0.704, 0.152, 0.153, 0.191, 0.168, 0.249, 0.151, 0.248, 0.16, 0.2, 0.264, 0.24] },
  { rows: ["原来长大就是要", "把疼痛", "咽成哑巴"], big: [2], keys: ["疼痛", "哑巴"], y: 0.78,
    at: [27.484, 27.66, 27.988, 28.157, 28.444, 28.62, 28.924, 29.1, 29.348, 29.516, 29.741, 29.924, 30.156, 30.38],
    dur: [0.176, 0.328, 0.169, 0.287, 0.176, 0.304, 0.176, 0.248, 0.168, 0.225, 0.183, 0.232, 0.224, 0.251] },
  { rows: ["妈妈", "为什么人要活到", "一百岁啊"], big: [2], keys: ["一百岁"], y: 0.78,
    at: [30.631, 30.799, 31.807, 31.975, 32.118, 32.351, 32.519, 32.767, 32.919, 33.159, 33.319, 33.503, 33.727],
    dur: [0.168, 0.784, 0.168, 0.143, 0.233, 0.168, 0.248, 0.152, 0.24, 0.16, 0.184, 0.224, 0.16] },
  { rows: ["要活到一百岁", "何时才能", "赎罪啊"], big: [2], keys: ["一百岁", "赎罪"], y: 0.78,
    at: [34.319, 34.511, 34.671, 34.887, 35.038, 35.247, 36.087, 36.295, 36.463, 36.639, 36.871, 37.038, 37.28],
    dur: [0.192, 0.16, 0.216, 0.151, 0.209, 0.136, 0.208, 0.168, 0.176, 0.232, 0.167, 0.242, 0.287] },
  { rows: ["妈妈"], big: [0], keys: [], y: 0.2, size: 120,
    at: [37.567, 37.719],
    dur: [0.152, 0.216] },
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
    const start = line.at[0];
    const next = LINES[li + 1]?.at[0] ?? END + 1;
    const chars: { ch: string; row: number; col: number; key: boolean; at: number; dur: number; rx: number; ry: number; rr: number }[] = [];
    let k = 0;
    line.rows.forEach((row, ri) => {
      const mask = new Array(row.length).fill(false);
      for (const key of line.keys) {
        let i = row.indexOf(key);
        while (i >= 0) { for (let j = 0; j < key.length; j++) mask[i + j] = true; i = row.indexOf(key, i + 1); }
      }
      [...row].forEach((ch, ci) => {
        // 每个字在开始唱的那一刻弹出（提前 0.04s，弹出动画的峰值正好落在字头上）
        chars.push({ ch, row: ri, col: ci, key: mask[ci], at: line.at[k] - 0.04, dur: line.dur[k], rx: random() - 0.5, ry: random(), rr: random() - 0.5 });
        k++;
      });
    });
    return { line, chars, next, start };
  });

  return {
    canvas,
    render(t) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.setTransform(s, 0, 0, s, 0, 0);
      const pulse = env.pulse(t);
      for (const { line, chars, next, start } of layouts) {
        if (t < start - 0.1 || t > next + 0.35) continue;
        const final = line === LINES[LINES.length - 1];
        const exitP = final ? 0 : phase(t, next - 0.18, next + 0.12);
        const base = line.size ?? 80;
        const rowSize = line.rows.map((_, ri) => (line.big?.includes(ri) ? base * (final ? 1.25 : 1.6) : base));
        const heights = rowSize.map((v) => v * 1.3);
        const totalH = heights.reduce((a, b) => a + b, 0);
        let y0 = line.y * DH - totalH / 2;
        const rowY = heights.map((h) => { const y = y0 + h / 2; y0 += h; return y; });
        for (const c of chars) {
          const local = t - c.at;
          if (local < 0) continue;
          const size = rowSize[c.row];
          const len = line.rows[c.row].length;
          const track = size * (final ? 1.45 : 1.08);
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
          // 正在唱的这个字：轻轻放大一点、发光（卡拉 OK 式的「吐字」感）
          const singing = local >= 0 && local < c.dur + 0.04 ? Math.sin(clamp(local / (c.dur + 0.04)) * Math.PI) : 0;
          sc *= 1 + 0.08 * singing;
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
          ctx.shadowBlur = (c.key ? 26 : 20) + singing * 14;
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
