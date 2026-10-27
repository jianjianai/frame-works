// 人物设计检查页（不在时间轴上）：第 0 页全体 3/4 站成一排（比轮廓、身高、标志色），第 1 页全体正面；
// 之后每秒一页、一页一个人：上面正面和 3/4 全身，中间头部放大（正面、3/4），下面风里走、失重、朝右。

import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { type Angles, type Look, type PoseIn, CHENGTUO, drawChengtuo, drawFigure, figureJoints, figurePose } from "@materials/剪纸角色/code/chengtuo";
import { CAST, type CastSpec, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import { STUDENT, UNCLE } from "../lib/saved";
import { WOMAN_LOOK, WOMAN_SCALE } from "../lib/woman";

interface Who {
  name: string;
  look: Look;
  scale: number;
  /** 秤砣用自己的画法（物品开关） */
  her?: boolean;
}
const who = (name: string, spec: CastSpec): Who => ({ name, look: lookOf(spec), scale: spec.scale });
const PEOPLE: Who[] = [
  { name: "沉沉", look: CHENGTUO, scale: 1, her: true },
  who("小石头", CAST.小石头),
  who("小石头·外套", CAST.小石头穿妈妈的外套),
  who("小石头的妈妈", CAST.小石头的妈妈),
  who("周磊", CAST.周磊),
  who("千斤", CAST.千斤),
  who("千斤的妈妈", CAST.千斤的妈妈),
  who("老钟", CAST.老钟),
  who("阿满", CAST.阿满),
  who("老太太", CAST.老太太),
  who("年轻人", CAST.年轻人),
  who("大叔", UNCLE),
  who("女学生", STUDENT),
  who("沉沉的妈妈", CAST.秤砣的妈妈),
  who("七岁的沉沉", CAST.小时候的秤砣),
  { name: "光里的女人", look: WOMAN_LOOK, scale: WOMAN_SCALE },
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => who(`路人${i}`, passerby(i))),
];

const ITEMS = { scarf: true, gloves: true, coat: true, band: true, boots: true, bricks: 2 };
function poseOf(p: Who, o: Angles, t: number): PoseIn {
  return figurePose(o, t, p.look, p.her ? ITEMS : undefined);
}
function draw(g: CanvasRenderingContext2D, p: Who, pose: PoseIn, line = 1) {
  if (p.her) drawChengtuo(g, pose, { line });
  else drawFigure(g, pose, p.look, { line });
}

const W = 1080;
const H = 1920;
const LINEUP = 2;
export const sample: Sample = { duration: LINEUP + PEOPLE.length };

export function createScene({ width, height }: SceneOptions): Scene {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  const base = () => g.setTransform(width / W, 0, 0, height / H, 0, 0);
  const label = (s: string, x: number, y: number, size = 24) => {
    base();
    g.fillStyle = "#2b2630";
    g.font = `${size}px sans-serif`;
    g.textAlign = "center";
    g.fillText(s, x, y);
  };
  /** 整个人：根在 (x, gy)，s 是画面上的倍数（再乘这个人的身高） */
  const body = (p: Who, o: Angles, x: number, gy: number, s: number, t: number) => {
    base();
    g.save();
    g.fillStyle = "rgba(90,70,110,0.14)";
    g.beginPath();
    g.ellipse(x, gy, 70 * s, 9 * s, 0, 0, Math.PI * 2);
    g.fill();
    g.translate(x, gy);
    const k = s * p.scale;
    g.scale(k, k);
    draw(g, p, poseOf(p, o, t), 1 / Math.sqrt(Math.max(1, s)));
    g.restore();
  };
  /** 头部放大：头的中心放到 (cx, cy) */
  const head = (p: Who, o: Angles, cx: number, cy: number, s: number, t: number, box: [number, number, number, number]) => {
    base();
    g.save();
    g.beginPath();
    g.rect(...box);
    g.clip();
    g.fillStyle = "#fbf4ee";
    g.fillRect(...box);
    const pose = poseOf(p, o, t);
    const j = figureJoints(pose, p.look);
    const k = s * p.scale;
    const hs = p.look.headScale ?? 1;
    // 头以脖子为中心放大过：头的中心跟着挪
    const hx = j.neck[0] + (j.head[0] - j.neck[0]) * hs;
    const hy = j.neck[1] + (j.head[1] - j.neck[1]) * hs;
    g.translate(cx - hx * k, cy - hy * k);
    g.scale(k, k);
    draw(g, p, pose, 1 / Math.sqrt(s));
    g.restore();
  };
  return {
    canvas,
    render(t) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = "#f3e7df";
      g.fillRect(0, 0, width, height);
      const page = Math.floor(t);
      if (page < LINEUP) {
        // 全体站成一排：三行，每行 8 个
        const face = page === 0 ? -0.75 : 0;
        const cols = 8;
        const cw = W / cols;
        PEOPLE.forEach((p, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const gy = 600 + r * 630;
          body(p, { face, wind: 0.3, idle: false }, cw * (c + 0.5), gy, 0.86, 0.3);
          label(p.name, cw * (c + 0.5), gy + 30, 20);
        });
        return;
      }
      const p = PEOPLE[Math.min(PEOPLE.length - 1, page - LINEUP)];
      const tt = t - page;
      label(`${p.name}`, W / 2, 44, 30);
      // 上：正面、3/4 全身
      body(p, { face: 0, wind: 0.25 }, 280, 880, 1.32, tt);
      body(p, { face: -1, wind: 0.25 }, 800, 880, 1.32, tt);
      // 中：头部放大
      head(p, { face: 0, wind: 0.2 }, 280, 1170, 2.6, tt, [20, 920, 520, 520]);
      head(p, { face: -1, wind: 0.2 }, 800, 1170, 2.6, tt, [540, 920, 520, 520]);
      // 下：风里走、失重、朝右
      const walk: Angles = { face: -0.8, wind: 1.3, hipL: -14, kneeL: -6, ankleL: 8, hipR: 20, kneeR: -8, ankleR: -10, shoulderL: 18, elbowL: -20, shoulderR: -16, elbowR: 24 };
      body(p, walk, 190, 1880, 0.62, tt);
      body(p, { face: -0.5, float: 0.9, ground: false, lift: 40, shoulderL: -60, elbowL: -20, shoulderR: 60, elbowR: 20, hipL: -4, kneeL: -30, hipR: 10, kneeR: -16, ankleL: -40, ankleR: -50 }, 540, 1880, 0.62, tt);
      body(p, { face: 0.85, wind: 0.5 }, 890, 1880, 0.62, tt);
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
