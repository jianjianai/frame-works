// 大人和小孩的身高对照（不在时间轴上）：用户 2026-10-28 给的大人和小孩站在一起的参考图（public/ref/比例参考-大人和小孩.png）。
// 上面左边参考图、右边我们的周磊和小石头按同样取景画（地面对齐，周磊缩放到和参考图里的大人一样高，小石头用同一个倍数，
// 各自的 scale 不动：看的是两个人之间的比例）；下面把我们的半透明叠在参考图上。
// 第 1 页（1–2 秒）：十九岁的沉沉和七岁的她站在一起（同样的取景，按十九岁的她和参考图里的大人一样高），下面七岁的她和小石头并排。
import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { assetUrl } from "@frame/engine/types";
import { CAST, type CastSpec, lookOf } from "@materials/剪纸角色/code/cast";
import { drawChengtuo, drawFigure, figurePose } from "@materials/剪纸角色/code/chengtuo";

interface Who {
  name: string;
  /** 不写是十九岁的沉沉（素材库的秤砣） */
  spec?: CastSpec;
  /** 参考图里这个人的中心 x（参考图像素） */
  cx: number;
}
const ADULT: Who = { name: "周磊", spec: CAST.周磊, cx: 168 };
const KID: Who = { name: "小石头", spec: CAST.小石头, cx: 388 };
const CHEN: Who = { name: "沉沉", cx: 168 };
const CHEN7: Who = { name: "七岁的沉沉", spec: CAST.小时候的秤砣, cx: 388 };
const ITEMS = { scarf: true, gloves: true, coat: true, band: true, boots: true, bricks: 0 };
/** 参考图里大人的头顶（头发）、两个人的地面（鞋底），参考图像素 */
const TOP = 87;
const GROUND = 965;

export const sample: Sample = { duration: 2 };
const W = 1080;
const H = 1920;

function drawWho(g: CanvasRenderingContext2D, w: Who) {
  if (!w.spec) {
    drawChengtuo(g, figurePose({ face: 0 }, 0.3, undefined, ITEMS));
    return;
  }
  g.scale(w.spec.scale, w.spec.scale);
  drawFigure(g, figurePose({ face: 0 }, 0.3, lookOf(w.spec)), lookOf(w.spec));
}

/** 这个人正面站着时从头顶（含头发）到地面多高（角色单位，乘过 scale）：画到一张小画布上量 */
function heightOf(w: Who): number {
  const c = document.createElement("canvas");
  c.width = 400;
  c.height = 900;
  const g = c.getContext("2d")!;
  g.translate(200, 850);
  drawWho(g, w);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 40) return 850 - y;
  return 590;
}

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  const im = new Image();
  im.src = assetUrl("films/work-3d80f743/ref/比例参考-大人和小孩.png");
  await im.decode();
  // 周磊画出来和参考图里的大人一样高，小石头用同一个倍数
  const k = (GROUND - TOP) / heightOf(ADULT);
  const kidH = heightOf(KID);
  const adultH = heightOf(ADULT);
  // 第 1 页：十九岁的沉沉和参考图里的大人一样高，七岁的她用同一个倍数
  const kc = (GROUND - TOP) / heightOf(CHEN);
  const chenH = heightOf(CHEN);
  const chen7H = heightOf(CHEN7);
  const draw = (pair: Who[], scale: number, x0: number, y0: number, s: number, alpha = 1) => {
    for (const w of pair) {
      g.save();
      g.globalAlpha = alpha;
      g.translate(x0 + w.cx * s, y0 + GROUND * s);
      g.scale(scale * s, scale * s);
      drawWho(g, w);
      g.restore();
    }
  };
  return {
    canvas,
    render(t) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = "#f3e7df";
      g.fillRect(0, 0, width, height);
      g.setTransform(width / W, 0, 0, height / H, 0, 0);
      if (t >= 1) {
        g.drawImage(im, 20, 40, im.width, im.height);
        draw([CHEN, CHEN7], kc, 554, 40, 1);
        g.fillStyle = "#2b2630";
        g.font = "26px sans-serif";
        g.fillText("参考：大人和小孩", 30, 30);
        g.fillText(`我们的：沉沉、七岁的她 ${CHEN7.spec!.scale}`, 564, 30);
        g.font = "22px sans-serif";
        g.fillText(`小孩 / 大人：参考 ${((GROUND - 336) / (GROUND - TOP)).toFixed(3)}`, 30, 1100);
        g.fillText(`我们的 ${(chen7H / chenH).toFixed(3)}`, 564, 1100);
        // 下：七岁的她和小石头并排（同一个倍数：周磊那一页的）
        g.fillText("小石头和七岁的她（同样的倍数）", 30, 1140);
        draw([{ ...KID, cx: 200 }, { ...CHEN7, cx: 420 }], k, 0, 1150 - 90 * 0.78, 0.78);
        return;
      }
      const ours = (x0: number, y0: number, s: number, alpha = 1) => {
        for (const w of [ADULT, KID]) {
          g.save();
          g.globalAlpha = alpha;
          g.translate(x0 + w.cx * s, y0 + GROUND * s);
          g.scale(k * s, k * s);
          drawWho(g, w);
          g.restore();
        }
      };
      // 上：参考图 | 我们的
      g.drawImage(im, 20, 40, im.width, im.height);
      ours(554, 40, 1);
      g.fillStyle = "#2b2630";
      g.font = "26px sans-serif";
      g.fillText("参考：大人和小孩", 30, 30);
      g.fillText(`我们的：${ADULT.name} ${ADULT.spec!.scale}、${KID.name} ${KID.spec!.scale}`, 564, 30);
      // 身高比：参考图量的、我们的
      g.font = "22px sans-serif";
      g.fillText(`小孩 / 大人：参考 ${((GROUND - 336) / (GROUND - TOP)).toFixed(3)}`, 30, 1100);
      g.fillText(`我们的 ${(kidH / adultH).toFixed(3)}`, 564, 1100);
      // 下：叠在一起（参考图上半透明画我们的） | 参考图
      const s = 0.78;
      g.drawImage(im, 20, 1120, im.width * s, im.height * s);
      ours(20, 1120, s, 0.55);
      g.drawImage(im, 554, 1120, im.width * s, im.height * s);
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
