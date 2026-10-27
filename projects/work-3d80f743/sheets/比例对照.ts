// 比例检查页（不在时间轴上）：主角和配角在同样的姿势里按各自身高并排（地面对齐），横线是主角的头顶、下巴、胯、膝、脚踝。
// 第 0 页站，第 1 页走，第 2 页吊着飘。配角的比例以主角为准（用户 2026-10-27）：只站着看不出来，要在动作里并排比。
import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { CAST, type CastSpec, lookOf } from "@materials/剪纸角色/code/cast";
import { type Angles, type Look, CHENGTUO, drawChengtuo, drawFigure, figurePose, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { STUDENT, UNCLE } from "../lib/saved";

interface Who {
  name: string;
  look: Look;
  spec?: CastSpec;
}
const PEOPLE: Who[] = [
  { name: "沉沉", look: CHENGTUO },
  ...([
    ["周磊", CAST.周磊],
    ["阿满", CAST.阿满],
    ["老钟", CAST.老钟],
    ["千斤", CAST.千斤],
    ["小石头的妈妈", CAST.小石头的妈妈],
    ["大叔", UNCLE],
    ["女学生", STUDENT],
    ["小石头", CAST.小石头],
    ["七岁的沉沉", CAST.小时候的秤砣],
  ] as [string, CastSpec][]).map(([name, spec]) => ({ name, look: lookOf(spec), spec })),
];
const ITEMS = { scarf: true, gloves: true, coat: true, band: true, boots: true, bricks: 2 };
const POSES: Angles[] = [
  { face: -0.75, wind: 0.3 },
  { face: -0.8, wind: 0.3, hipL: -14, kneeL: -6, ankleL: 8, hipR: 20, kneeR: -8, ankleR: -10, shoulderL: 18, elbowL: -20, shoulderR: -16, elbowR: 24 },
  { face: -0.7, float: 0.15, ground: false, hipR: 10, kneeR: -22, ankleR: -48, hipL: -6, kneeL: -34, ankleL: -24, shoulderL: 4, elbowL: 4, shoulderR: 12, elbowR: 22, neck: -30, lean: 10 },
];

export const sample: Sample = { duration: POSES.length };
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
      g.setTransform(width / W, 0, 0, height / H, 0, 0);
      const o = POSES[Math.min(POSES.length - 1, Math.floor(t))];
      const s = 0.62;
      // 两排：上排 5 个、下排 5 个；每排地面一条线
      PEOPLE.forEach((p, i) => {
        const row = Math.floor(i / 5);
        const x = 110 + (i % 5) * 215;
        const gy = 860 + row * 900;
        const pose = figurePose(o, 0.3, p.look, p.spec ? undefined : ITEMS);
        // 主角的刻度（只在每排第一个位置量一次，用主角）
        if (i % 5 === 0) {
          const hp = figurePose(o, 0.3, CHENGTUO, ITEMS);
          const j = jointsOf(hp);
          const marks: [string, number][] = [
            ["头顶", j.head[1] - 74],
            ["下巴", j.head[1] + 48],
            ["胯", j.hip[1]],
            ["膝", Math.max(j.kneeL[1], j.kneeR[1])],
            ["脚踝", Math.max(j.ankleL[1], j.ankleR[1])],
          ];
          for (const [m, v] of marks) {
            g.strokeStyle = "rgba(180,60,60,0.35)";
            g.beginPath();
            g.moveTo(0, gy + v * s);
            g.lineTo(W, gy + v * s);
            g.stroke();
            g.fillStyle = "#b03a3a";
            g.font = "16px sans-serif";
            g.fillText(m, 4, gy + v * s - 3);
          }
          g.fillStyle = "rgba(90,70,110,0.3)";
          g.fillRect(0, gy, W, 2);
        }
        g.save();
        g.translate(x, gy);
        if (p.spec) {
          g.scale(s * p.spec.scale, s * p.spec.scale);
          drawFigure(g, pose, p.look);
        } else {
          g.scale(s, s);
          drawChengtuo(g, pose);
        }
        g.restore();
        g.fillStyle = "#2b2630";
        g.font = "20px sans-serif";
        g.fillText(p.name, x - 40, gy + 40);
      });
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
