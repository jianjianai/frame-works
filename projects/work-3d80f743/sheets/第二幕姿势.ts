// 第二幕姿势检查页（不在时间轴上）：每页 9 个姿势，每个单独站在一条地线上（飘着的人胯停在站着的高度）。
// 红点是两只手掌，蓝点是两只脚踝。

import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { CAST, lookOf } from "@materials/剪纸角色/code/cast";
import { type Angles, type Look, CHENGTUO, CHENGTUO_ITEMS, drawFigure, figureJoints, figurePose } from "@materials/剪纸角色/code/chengtuo";
import { CHEN2, CHEN_N, MOM, QJ } from "../lib/poses2";

type Who = "千斤" | "妈妈" | "沉沉" | "沉沉夜";
const LOOKS: Record<Who, { look: Look; scale: number; items?: Record<string, boolean | number> }> = {
  千斤: { look: lookOf(CAST.千斤), scale: CAST.千斤.scale },
  妈妈: { look: lookOf(CAST.千斤的妈妈), scale: CAST.千斤的妈妈.scale },
  沉沉: { look: CHENGTUO, scale: 1 },
  沉沉夜: { look: CHENGTUO, scale: 1, items: { ...CHENGTUO_ITEMS, coat: false, scarf: false, gloves: false, band: false } },
};
const ALL: [string, Who, Angles][] = [
  ...Object.entries(QJ).map(([k, v]) => [`千斤·${k}`, "千斤", v] as [string, Who, Angles]),
  ...Object.entries(MOM).map(([k, v]) => [`妈妈·${k}`, "妈妈", v] as [string, Who, Angles]),
  ...Object.entries(CHEN2).map(([k, v]) => [`沉沉·${k}`, "沉沉", v] as [string, Who, Angles]),
  ...Object.entries(CHEN_N).map(([k, v]) => [`夜·${k}`, "沉沉夜", v] as [string, Who, Angles]),
];
const PAGES = Math.ceil(ALL.length / 9);
export const sample: Sample = { duration: 6 };

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
      g.setTransform(width / W, 0, 0, height / H, 0, 0);
      g.fillStyle = "#f3e7df";
      g.fillRect(0, 0, W, H);
      const page = Math.min(PAGES - 1, Math.floor(t));
      const list = ALL.slice(page * 9, page * 9 + 9);
      list.forEach(([name, who, a], i) => {
        const cx = (i % 3) * 360 + 180;
        const gy = Math.floor(i / 3) * 640 + 590;
        const L = LOOKS[who];
        const pose = figurePose({ wind: -0.5, ...a }, 0.3, L.look, L.items);
        g.save();
        g.fillStyle = "rgba(90,70,110,0.25)";
        g.fillRect(cx - 160, gy, 320, 2);
        g.fillStyle = "#2b2630";
        g.font = "22px sans-serif";
        g.textAlign = "center";
        g.fillText(name, cx, gy + 34);
        const s = 0.74 * L.scale;
        g.translate(cx, gy);
        g.scale(s, s);
        drawFigure(g, pose, L.look);
        const j = figureJoints(pose, L.look);
        g.fillStyle = "#e0403a";
        for (const p of [j.palmL, j.palmR]) {
          g.beginPath();
          g.arc(p[0], p[1], 6, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = "#3a6fd0";
        for (const p of [j.ankleL, j.ankleR]) {
          g.beginPath();
          g.arc(p[0], p[1], 6, 0, Math.PI * 2);
          g.fill();
        }
        g.restore();
      });
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
