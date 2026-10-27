// 配角比例对照页（不在时间轴上）：用户 2026-10-27 给的生图参考（public/ref/比例参考-*.png，和主角同一套横线、同样的身高）。
// 每页一种人：上面左边参考图、右边我们的人按同样取景画（地面对齐，身高缩放到和参考里一样，只比比例）；
// 下面把我们的人半透明叠在参考图上。第 0 页是主角自己（核对取景）。
import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { assetUrl } from "@frame/engine/types";
import { CAST, type CastSpec, lookOf } from "@materials/剪纸角色/code/cast";
import { type Angles, type Look, CHENGTUO, drawChengtuo, drawFigure, figurePose } from "@materials/剪纸角色/code/chengtuo";

interface Pair {
  ref: string;
  name: string;
  look: Look;
  spec?: CastSpec;
  /** 参考图里正面、3/4 两个人的中心 x、头顶、地面（参考图像素） */
  cx: [number, number];
  top: number;
  ground: number;
}
const PAIRS: Pair[] = [
  { ref: "沉沉", name: "沉沉", look: CHENGTUO, cx: [140, 373], top: 158, ground: 886 },
  { ref: "男人", name: "周磊", look: lookOf(CAST.周磊), spec: CAST.周磊, cx: [138, 372], top: 158, ground: 886 },
  { ref: "小孩", name: "小石头", look: lookOf(CAST.小石头), spec: CAST.小石头, cx: [140, 380], top: 161, ground: 896 },
  { ref: "老人", name: "老钟", look: lookOf(CAST.老钟), spec: CAST.老钟, cx: [140, 380], top: 161, ground: 900 },
  { ref: "女人", name: "千斤的妈妈", look: lookOf(CAST.千斤的妈妈), spec: CAST.千斤的妈妈, cx: [140, 385], top: 96, ground: 965 },
];
const ITEMS = { scarf: true, gloves: true, coat: true, band: true, boots: true, bricks: 2 };
const VIEWS: Angles[] = [{ face: 0 }, { face: -1 }];

export const sample: Sample = { duration: PAIRS.length };
const W = 1080;
const H = 1920;

function drawWho(g: CanvasRenderingContext2D, p: Pair, o: Angles) {
  const pose = figurePose(o, 0.3, p.look, p.spec ? undefined : ITEMS);
  if (p.spec) {
    g.scale(p.spec.scale, p.spec.scale);
    drawFigure(g, pose, p.look);
  } else drawChengtuo(g, pose);
}

/** 这个人正面站着时从头顶（含头发、帽子）到地面多高（角色单位）：画到一张小画布上量 */
function heightOf(p: Pair): number {
  const c = document.createElement("canvas");
  c.width = 400;
  c.height = 900;
  const g = c.getContext("2d")!;
  g.translate(200, 850);
  g.scale(1, 1);
  drawWho(g, p, VIEWS[0]);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 40) return 850 - y;
  return 590;
}

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  const imgs = await Promise.all(
    PAIRS.map(async (p) => {
      const im = new Image();
      im.src = assetUrl(`films/work-3d80f743/ref/比例参考-${p.ref}.png`);
      await im.decode();
      return im;
    }),
  );
  const heights = PAIRS.map(heightOf);
  return {
    canvas,
    render(t) {
      const i = Math.min(PAIRS.length - 1, Math.floor(t));
      const p = PAIRS[i];
      const im = imgs[i];
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = "#f3e7df";
      g.fillRect(0, 0, width, height);
      g.setTransform(width / W, 0, 0, height / H, 0, 0);
      const k = (p.ground - p.top) / heights[i];
      const ours = (x0: number, y0: number, s: number, alpha = 1) => {
        VIEWS.forEach((o, v) => {
          g.save();
          g.globalAlpha = alpha;
          g.translate(x0 + p.cx[v] * s, y0 + p.ground * s);
          g.scale(k * s, k * s);
          drawWho(g, p, o);
          g.restore();
        });
      };
      // 上：参考图 | 我们的
      g.drawImage(im, 20, 30, im.width, im.height);
      ours(560, 30, 1);
      g.fillStyle = "#2b2630";
      g.font = "26px sans-serif";
      g.fillText(`参考：${p.ref}`, 30, 30);
      g.fillText(`我们的：${p.name}`, 570, 30);
      // 下：叠在一起（参考图上半透明画我们的）
      const s = 0.82;
      g.drawImage(im, 20, 1080, im.width * s, im.height * s);
      ours(20, 1080, s, 0.55);
      g.drawImage(im, 560, 1080, im.width * s, im.height * s);
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
