// 鞋子检查页（不在时间轴上）：每秒一页、一页一个人 6 个姿势（站、走、踮脚蹬地、飘着脚尖朝下、坐着、正面）。
// 每格上面是整个人（看比例），下面是膝盖以下放大（看袜子接不接得住裤脚、鞋头鞋底的样子）。鞋是素材库 cast.ts 的 drawShoe。

import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { CAST, type CastSpec, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import { type Angles, type Look, drawFigure, figureJoints, figurePose } from "@materials/剪纸角色/code/chengtuo";
import { legL, legR } from "../lib/poses";
import { WOMAN_LOOK, WOMAN_SCALE } from "../lib/woman";

interface Who {
  name: string;
  look: Look;
  scale: number;
}
const who = (name: string, spec: CastSpec): Who => ({ name, look: lookOf(spec), scale: spec.scale });
const PEOPLE: Who[] = [
  { name: "光里的女人", look: WOMAN_LOOK, scale: WOMAN_SCALE },
  who("周磊", CAST.周磊),
  who("小石头", CAST.小石头),
  who("老钟", CAST.老钟),
  who("老太太", CAST.老太太),
  who("年轻人", CAST.年轻人),
  ...[0, 1, 2, 3].map((i) => who(`路人${i}`, passerby(i))),
];

const POSES: [string, Angles][] = [
  ["站", { face: -0.7 }],
  ["走", { face: -0.7, hipL: -14, kneeL: -6, ankleL: 8, hipR: 20, kneeR: -8, ankleR: -10 }],
  ["蹬地", { face: -0.7, ...legL(-24, -30, -38), ...legR(16, -4, 0) }],
  ["飘", { face: -0.5, float: 0.2, ground: false, ...legL(-4, -62, -64), ...legR(10, -16, -66) }],
  ["坐", { face: 0.8, ...legR(140, -110, 0), ...legL(132, -90, 0), ground: false, lift: -235 }],
  ["正面", { face: 0 }],
];

export const sample: Sample = { duration: PEOPLE.length };

const W = 1080;
const H = 1920;

export function createScene({ width, height }: SceneOptions): Scene {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  return {
    canvas,
    render(t) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = "#f3e7df";
      g.fillRect(0, 0, width, height);
      const p = PEOPLE[Math.min(PEOPLE.length - 1, Math.floor(t))];
      const cols = 3;
      const cw = W / cols;
      const rh = H / 2;
      POSES.forEach(([name, o], i) => {
        const x0 = (i % cols) * cw;
        const y0 = Math.floor(i / cols) * rh;
        const pose = figurePose({ wind: 0.4, ...o }, 0.3, p.look);
        const base = () => g.setTransform(width / W, 0, 0, height / H, 0, 0);
        base();
        g.fillStyle = "#2b2630";
        g.font = "24px sans-serif";
        g.textAlign = "left";
        g.fillText(`${p.name} · ${name}`, x0 + 12, y0 + 30);
        // 整个人
        base();
        g.save();
        g.beginPath();
        g.rect(x0, y0 + 40, cw, rh * 0.42);
        g.clip();
        const s1 = 0.62 * p.scale;
        const gy1 = y0 + 40 + rh * 0.42 - 16;
        g.fillStyle = "rgba(90,70,110,0.25)";
        g.fillRect(x0 + 10, gy1, cw - 20, 2);
        g.translate(x0 + cw / 2, gy1);
        g.scale(s1, s1);
        drawFigure(g, pose, p.look);
        g.restore();
        // 膝盖以下放大
        base();
        g.save();
        const by = y0 + 40 + rh * 0.42 + 8;
        const bh = rh - (by - y0) - 8;
        g.beginPath();
        g.rect(x0 + 4, by, cw - 8, bh);
        g.clip();
        g.fillStyle = "#fbf4ee";
        g.fillRect(x0 + 4, by, cw - 8, bh);
        const s2 = 1.7 * p.scale;
        const gy2 = by + bh - 40;
        g.fillStyle = "rgba(90,70,110,0.25)";
        g.fillRect(x0 + 4, gy2, cw - 8, 2);
        // 两只脚放在放大框的中间、最低的鞋底贴着地线
        const j = figureJoints(pose, p.look);
        const low = Math.max(j.ankleL[1], j.ankleR[1]) + 66;
        const mx = (j.ankleL[0] + j.ankleR[0]) / 2 - 20;
        g.translate(x0 + cw / 2 - mx * s2, gy2 - low * s2);
        g.scale(s2, s2);
        drawFigure(g, pose, p.look, { line: 1 / Math.sqrt(1.7) });
        g.restore();
      });
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
