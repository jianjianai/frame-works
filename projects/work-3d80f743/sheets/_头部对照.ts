// 临时：头部对照（不在时间轴上）。每页 8 个人，每人一格：左边正面、右边 3/4 的头，按头的单位一样大（不乘身高），头的中心对齐。
// 0 秒：照参考图做好的人；1、2 秒：头要改的人（用户 2026-10-29：「头看起来很长像是大头娃娃」）。
import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { type Angles, type Look, CHENGTUO, drawChengtuo, drawFigure, figureJoints, figurePose } from "@materials/剪纸角色/code/chengtuo";
import { CAST, type CastSpec, GLASSES_UNCLE, SCHOOLGIRL, lookOf, passerby } from "@materials/剪纸角色/code/cast";

interface Who {
  name: string;
  look: Look;
  her?: boolean;
}
const who = (name: string, spec: CastSpec): Who => ({ name, look: lookOf(spec) });
const PAGES: Who[][] = [
  [
    { name: "沉沉", look: CHENGTUO, her: true },
    who("周磊", CAST.周磊),
    who("千斤的妈妈", CAST.千斤的妈妈),
    who("小石头的妈妈", CAST.小石头的妈妈),
    who("老钟", CAST.老钟),
    who("小石头", CAST.小石头),
    who("老太太", CAST.老太太),
    who("光里的女人", CAST.光里的女人),
  ],
  [
    who("千斤", CAST.千斤),
    who("阿满", CAST.阿满),
    who("年轻人", CAST.年轻人),
    who("大叔", GLASSES_UNCLE),
    who("女学生", SCHOOLGIRL),
    who("沉沉的妈妈", CAST.秤砣的妈妈),
    who("七岁的沉沉", CAST.小时候的秤砣),
    who("路人0", passerby(0)),
  ],
  [1, 2, 3, 4, 5, 6, 7].map((i) => who(`路人${i}`, passerby(i))),
];
/** 之后每秒一页、一页一个人放大看：上面正面、3/4，下面一排转身（0 → −1）、朝右 3/4、风里、失重 */
const FOCUS: Who[] = [who("年轻人", CAST.年轻人), who("大叔", GLASSES_UNCLE), who("路人7", passerby(7)), who("路人2", passerby(2)), who("阿满", CAST.阿满), who("千斤", CAST.千斤), who("七岁的沉沉", CAST.小时候的秤砣), who("女学生", SCHOOLGIRL), who("沉沉的妈妈", CAST.秤砣的妈妈), who("路人0", passerby(0)), who("路人3", passerby(3)), who("路人6", passerby(6))];
export const sample: Sample = { duration: PAGES.length + FOCUS.length };

const ITEMS = { scarf: true, gloves: true, coat: true, band: true, boots: true, bricks: 0 };
const S = 1.75;

export function createScene({ width, height }: SceneOptions): Scene {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  const head = (p: Who, face: number, cx: number, cy: number, box: [number, number, number, number], s = S, extra: Partial<Angles> = {}) => {
    g.save();
    g.beginPath();
    g.rect(...box);
    g.clip();
    const pose = figurePose({ face, wind: 0.2, ...extra }, 0.3, p.look, p.her ? ITEMS : undefined);
    const j = figureJoints(pose, p.look);
    const hs = p.look.headScale ?? 1;
    const hx = j.neck[0] + (j.head[0] - j.neck[0]) * hs;
    const hy = j.neck[1] + (j.head[1] - j.neck[1]) * hs;
    g.translate(cx - hx * s, cy - hy * s);
    g.scale(s, s);
    if (p.her) drawChengtuo(g, pose, { line: 0.8 });
    else drawFigure(g, pose, p.look, { line: 0.8 });
    g.restore();
  };
  return {
    canvas,
    render(t) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = "#f3e7df";
      g.fillRect(0, 0, width, height);
      const r = width / 1080;
      g.setTransform(r, 0, 0, r, 0, 0);
      if (t >= PAGES.length) {
        const p = FOCUS[Math.min(FOCUS.length - 1, Math.floor(t) - PAGES.length)];
        g.fillStyle = "#fbf4ee";
        g.fillRect(4, 4, 1072, 1150);
        head(p, 0, 270, 560, [4, 4, 534, 1150], 3.6);
        head(p, -1, 810, 560, [542, 4, 534, 1150], 3.6);
        const row: [number, Partial<Angles>][] = [[-0.25, {}], [-0.5, {}], [-0.75, {}], [1, {}], [-0.8, { wind: 1.3 }], [-0.5, { float: 0.9, ground: false }]];
        row.forEach(([f, extra], i) => {
          const x0 = 4 + i * 179;
          g.fillStyle = "#fbf4ee";
          g.fillRect(x0, 1160, 175, 380);
          head(p, f, x0 + 87, 1330, [x0, 1160, 175, 380], 1.25, extra);
        });
        g.fillStyle = "#2b2630";
        g.font = "26px sans-serif";
        g.fillText(p.name, 16, 40);
        return;
      }
      const page = PAGES[Math.min(PAGES.length - 1, Math.floor(t))];
      page.forEach((p, i) => {
        const x0 = (i % 2) * 540;
        const y0 = Math.floor(i / 2) * 480;
        g.fillStyle = "#fbf4ee";
        g.fillRect(x0 + 4, y0 + 4, 532, 472);
        // 头的中心：头顶约在中心上面 75、下巴在下面 50
        head(p, 0, x0 + 135, y0 + 230, [x0 + 4, y0 + 4, 266, 472]);
        head(p, -1, x0 + 405, y0 + 230, [x0 + 270, y0 + 4, 266, 472]);
        // 参考线：头的中心上面 70（照参考图描的头发最高处）、下巴 48
        g.strokeStyle = "rgba(200,60,80,0.35)";
        g.lineWidth = 1;
        for (const dy of [-70 * S, 48 * S]) {
          g.beginPath();
          g.moveTo(x0 + 4, y0 + 230 + dy);
          g.lineTo(x0 + 536, y0 + 230 + dy);
          g.stroke();
        }
        g.fillStyle = "#2b2630";
        g.font = "22px sans-serif";
        g.fillText(p.name, x0 + 14, y0 + 32);
      });
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
