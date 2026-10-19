// 第一幕姿势检查页（不在时间轴上）：lib/poses.ts 里每个姿势单独画在地面上，看着地、比例、别不别扭。
// 每秒一页、一页 6 个：依次是她、周磊、小石头、老钟。她那几页的红点是近处手掌，蓝点是前面那只靴筒口（远处 R 腿）。

import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { CAST, type CastSpec, drawCast, lookOf } from "@materials/剪纸角色/code/cast";
import { type Angles, CHENGTUO, drawChengtuo, figurePose, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { CHEN, KID, ZHONG, ZHOU } from "../lib/poses";

const PER = 6;
const GROUPS: { poses: Record<string, Angles>; spec: CastSpec | null }[] = [
  { poses: CHEN, spec: null },
  { poses: ZHOU, spec: CAST.周磊 },
  { poses: KID, spec: CAST.小石头 },
  { poses: ZHONG, spec: CAST.老钟 },
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
          const p = figurePose({ wind: 0.85, ...o }, 0.3, CHENGTUO);
          drawChengtuo(g, p);
          const j = jointsOf(p);
          g.fillStyle = "rgba(220,40,40,0.8)";
          g.beginPath();
          g.arc(j.palmL[0], j.palmL[1], 7, 0, Math.PI * 2);
          g.fill();
          const top = [j.ankleR[0] + 0.8 * (j.kneeR[0] - j.ankleR[0]), j.ankleR[1] + 0.8 * (j.kneeR[1] - j.ankleR[1])];
          g.fillStyle = "rgba(40,90,220,0.8)";
          g.beginPath();
          g.arc(top[0], top[1], 7, 0, Math.PI * 2);
          g.fill();
        } else drawCast(g, page.spec, figurePose({ wind: 0.4, ...o }, 0.3, lookOf(page.spec)));
      });
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
