// 第二幕姿势检查页（不在时间轴上）：lib/poses2.ts 里每个姿势单独画在地面上，看着地、比例、别不别扭。一页 6 个。
// 飘着的（ground: false）画在地线上方，脚踝一个红点（红线拴在这里）。

import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { CAST, type CastSpec, castJoints, drawCast, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import { type Angles, CHENGTUO, drawChengtuo, figurePose, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { CHEN2, MOM, MOM_HOME, QIANJIN, QUEUE, RIVAL } from "../lib/poses2";

const PER = 6;
// spec 为 null：沉沉（铁靴、围巾，用 drawChengtuo 画）
const GROUPS: { poses: Record<string, Angles>; spec: CastSpec | null }[] = [
  { poses: { ...MOM, ...MOM_HOME }, spec: CAST.千斤的妈妈 },
  { poses: { ...RIVAL, ...QUEUE }, spec: passerby(5) },
  { poses: QIANJIN, spec: CAST.千斤 },
  { poses: CHEN2, spec: null },
];
const PAGES = GROUPS.flatMap((gr) => {
  const e = Object.entries(gr.poses);
  return Array.from({ length: Math.ceil(e.length / PER) }, (_, k) => ({ entries: e.slice(k * PER, k * PER + PER), spec: gr.spec }));
});

export const sample: Sample = { duration: PAGES.length };

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
      g.fillStyle = "#f7ede8";
      g.fillRect(0, 0, width, height);
      const page = PAGES[Math.min(PAGES.length - 1, Math.floor(t))];
      const cols = 3;
      const cw = W / cols;
      const rh = H / 2;
      const s = Math.min(0.62, (rh - 80) / 900);
      page.entries.forEach(([name, o], i) => {
        const cx = (i % cols) * cw + cw / 2;
        const gy = Math.floor(i / cols) * rh + rh - 40;
        g.setTransform(width / W, 0, 0, height / H, 0, 0);
        g.fillStyle = "rgba(90,70,110,0.25)";
        g.fillRect(cx - cw / 2 + 10, gy, cw - 20, 3);
        g.font = "26px sans-serif";
        g.textAlign = "center";
        g.fillStyle = "#2b2630";
        g.fillText(name, cx, gy + 30);
        g.translate(cx, gy);
        g.scale(s, s);
        if (!page.spec) {
          const p = figurePose({ wind: 0.85, chestL: "under", chestR: "under", ...o }, 0.3, CHENGTUO);
          drawChengtuo(g, p);
          if (o.ground === false) {
            const j = jointsOf(p);
            g.fillStyle = "rgba(220,40,40,0.85)";
            g.beginPath();
            g.arc(j.ankleL[0], j.ankleL[1], 8, 0, Math.PI * 2);
            g.fill();
          }
          return;
        }
        const p = figurePose({ wind: 0.85, ...o }, 0.3, lookOf(page.spec));
        drawCast(g, page.spec, p);
        if (o.ground === false) {
          const j = castJoints(page.spec, p);
          g.fillStyle = "rgba(220,40,40,0.85)";
          g.beginPath();
          g.arc(j.ankleL[0], j.ankleL[1], 8, 0, Math.PI * 2);
          g.fill();
        }
      });
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
