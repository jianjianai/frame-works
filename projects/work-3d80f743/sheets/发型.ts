// 发型检查页（不在时间轴上）：每页 5 种发型，每种一行：正面、转身一半（−0.35，原来短发出刺的角度）、3/4、风里、失重。

import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { type Angles, type Look, drawFigure, figureJoints, figurePose } from "@materials/剪纸角色/code/chengtuo";
import { type HairPaint, HAIR_STYLES, drawBackHair, drawFrontHair } from "@materials/剪纸角色/code/cast-hair";

const COLORS: Record<string, string> = {
  short: "#2f2e33",
  kid: "#2f2e33",
  curtain: "#3b3035",
  bob: "#2c2a30",
  sidebob: "#2c2a30",
  bun: "#3a3036",
  long: "#2c2a30",
  ponytail: "#5b3f33",
  highpony: "#2f2e33",
  receding: "#ecebe6",
};
const looks: Look[] = HAIR_STYLES.map((style) => {
  const hp: HairPaint = { style, color: COLORS[style], shade: style === "receding" ? "#d6d4cc" : COLORS[style], tie: "#c0504a" };
  return {
    colors: { top: "#e6e3de", topShade: "#d4d0c9" },
    backHair: (ctx, rig, ink) => drawBackHair(ctx, rig, ink, hp),
    frontHair: (ctx, h, ink) => {
      drawFrontHair(ctx, h, ink, hp);
    },
  };
});

const STATES: [string, Angles][] = [
  ["正面", { face: 0 }],
  ["−0.35", { face: -0.35 }],
  ["3/4", { face: -1 }],
  ["风", { face: -0.8, wind: 1.6 }],
  ["失重", { face: -0.5, float: 0.85, ground: false }],
];

const W = 1080;
const H = 1920;
const PER = 5;
export const sample: Sample = { duration: Math.ceil(HAIR_STYLES.length / PER) };

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
      const page = Math.floor(t);
      const cw = W / STATES.length;
      const rh = H / PER;
      for (let r = 0; r < PER; r++) {
        const i = page * PER + r;
        if (i >= HAIR_STYLES.length) break;
        STATES.forEach(([name, o], c) => {
          g.setTransform(width / W, 0, 0, height / H, 0, 0);
          g.save();
          g.beginPath();
          g.rect(c * cw + 2, r * rh + 2, cw - 4, rh - 4);
          g.clip();
          g.fillStyle = (r + c) % 2 ? "#fbf4ee" : "#f7eee6";
          g.fillRect(c * cw, r * rh, cw, rh);
          g.fillStyle = "#2b2630";
          g.font = "18px sans-serif";
          g.fillText(`${HAIR_STYLES[i]} · ${name}`, c * cw + 8, r * rh + 22);
          const pose = figurePose({ ...o }, (t - page) * 4 + 0.3, looks[i]);
          const j = figureJoints(pose, looks[i]);
          const s = 1.15;
          g.translate(c * cw + cw / 2 - j.head[0] * s, r * rh + rh * 0.52 - j.head[1] * s);
          g.scale(s, s);
          drawFigure(g, pose, looks[i], { line: 0.9 });
          g.restore();
        });
      }
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
