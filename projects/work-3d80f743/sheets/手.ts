// 手的检查页（不在时间轴上）：素材库手掌、大拇指 + 重新排的四根手指（放大 9 倍），手套色和光手各一只，几种角度。
// 2026-10-24 定稿，同样的生成方法已经搬进素材库 剪纸角色/code/figure.ts 的 FINGERS（改手指先在这里看，再同步到库里）。

import type { Sample, Scene, SceneOptions } from "@frame/engine/types";

type V2 = [number, number];
const PALM: V2[] = [[111.49, -16.15], [111.49, -16.15], [130.19, 10.63], [133.38, 11.68], [136.56, 12.74], [148.67, 1.28], [148.46, -1.06], [148.26, -3.39], [125.73, -27.61], [125.65, -27.79], [125.57, -27.96], [111.5, -16.15], [111.5, -16.15]];
const THUMB: V2[] = [[129.33, 5.53], [129.33, 5.53], [133.16, 18.7], [128.48, 20.83], [123.81, 22.95], [111.7, -6.37], [116.79, -16.15], [121.89, -25.92], [129.33, 5.52], [129.33, 5.52]];

/** 四根手指：沿着指根那条边（食指 → 小指）均匀排，指根藏进手掌一点，往外微微张开 */
export function makeFingers(): V2[][] {
  const I: V2 = [133.38, 11.68];
  const P: V2 = [148.46, -1.06];
  const W: V2 = [(111.5 + 125.65) / 2, (-16.15 - 27.79) / 2];
  const K: V2 = [(I[0] + P[0]) / 2, (I[1] + P[1]) / 2];
  const al = Math.hypot(K[0] - W[0], K[1] - W[1]);
  const a: V2 = [(K[0] - W[0]) / al, (K[1] - W[1]) / al];
  const n: V2 = [a[1], -a[0]];
  const spec: [number, number, number, number][] = [
    // [沿指根的位置 0..1, 露出来的长度, 宽, 张开的角度（度，往小指那边为正）]
    [0.12, 15.5, 6.8, -8],
    [0.37, 17.5, 6.8, -2],
    [0.62, 16.0, 6.5, 4],
    [0.86, 12.5, 5.8, 11],
  ];
  const inset = 4;
  return spec.map(([s, len, w, deg]) => {
    const r = (deg * Math.PI) / 180;
    const d: V2 = [a[0] * Math.cos(r) + n[0] * Math.sin(r), a[1] * Math.cos(r) + n[1] * Math.sin(r)];
    const m: V2 = [d[1], -d[0]];
    // 指根那条边微微往外鼓：中间两根往外一点
    const bulge = 1.6 * Math.sin(Math.PI * s);
    const b: V2 = [I[0] + (P[0] - I[0]) * s + a[0] * (bulge - inset), I[1] + (P[1] - I[1]) * s + a[1] * (bulge - inset)];
    const L: V2 = [b[0] - (m[0] * w) / 2, b[1] - (m[1] * w) / 2];
    const R: V2 = [b[0] + (m[0] * w) / 2, b[1] + (m[1] * w) / 2];
    const T: V2 = [b[0] + d[0] * (len + inset), b[1] + d[1] * (len + inset)];
    const k = 0.62 * w;
    const sideL: V2 = [L[0] + d[0] * (len + inset) * 0.55, L[1] + d[1] * (len + inset) * 0.55];
    const sideR: V2 = [R[0] + d[0] * (len + inset) * 0.55, R[1] + d[1] * (len + inset) * 0.55];
    return [L, sideL, [T[0] - m[0] * k, T[1] - m[1] * k], T, [T[0] + m[0] * k, T[1] + m[1] * k], sideR, R, R, L, L];
  });
}

function cubic(g: CanvasRenderingContext2D, pts: V2[]) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i + 2 < pts.length; i += 3) g.bezierCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], pts[i + 2][0], pts[i + 2][1]);
  g.closePath();
}

function hand(g: CanvasRenderingContext2D, fill: string, lw: number, fingers: V2[][]) {
  g.lineJoin = "round";
  g.strokeStyle = "#3a2c2a";
  g.lineWidth = lw;
  g.fillStyle = fill;
  for (const f of fingers) {
    cubic(g, f);
    g.fill();
    g.stroke();
  }
  cubic(g, PALM);
  g.fill();
  // 手掌描边扣掉手指盖住的地方（和素材库 drawGlove 一样）
  g.save();
  for (const f of fingers) {
    const out = new Path2D();
    out.rect(-1e4, -1e4, 2e4, 2e4);
    const fp = new Path2D();
    fp.moveTo(f[0][0], f[0][1]);
    for (let i = 1; i + 2 < f.length; i += 3) fp.bezierCurveTo(f[i][0], f[i][1], f[i + 1][0], f[i + 1][1], f[i + 2][0], f[i + 2][1]);
    fp.closePath();
    out.addPath(fp);
    g.clip(out, "evenodd");
  }
  cubic(g, PALM);
  g.stroke();
  g.restore();
  cubic(g, THUMB);
  g.fill();
  g.save();
  cubic(g, PALM);
  g.rect(-1e4, -1e4, 2e4, 2e4);
  g.clip("evenodd");
  cubic(g, THUMB);
  g.stroke();
  g.restore();
}

export const sample: Sample = { duration: 1 };

export function createScene({ width, height }: SceneOptions): Scene {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  const fingers = makeFingers();
  return {
    canvas,
    render() {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = "#f3e7df";
      g.fillRect(0, 0, width, height);
      const sc = width / 1080;
      const cells: [number, number, number, string][] = [
        [270, 380, 0, "#f6dcc4"],
        [810, 380, 0, "#3b3d4a"],
        [270, 1000, -2.2, "#f6dcc4"],
        [810, 1000, -2.2, "#3b3d4a"],
        [270, 1600, 1.2, "#f6dcc4"],
        [810, 1600, 2.6, "#3b3d4a"],
      ];
      for (const [x, y, rot, fill] of cells) {
        g.setTransform(sc, 0, 0, sc, 0, 0);
        g.translate(x, y);
        g.rotate(rot);
        g.scale(9, 9);
        g.translate(-132, -2);
        hand(g, fill, 0.9, fingers);
      }
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
