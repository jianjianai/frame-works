// 主角正面、3/4 的胳膊和外套对照（不在时间轴上）：用户 2026-10-28 给的参考图（public/ref/比例参考-沉沉-胳膊.png，左正面、右 3/4 朝左）。
// 上：参考图；中：我们的沉沉按同样取景画（头顶、鞋底对齐，正面、3/4 的中心对到参考图里两个人的中心）；下：我们的半透明叠在参考图上。
import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { assetUrl } from "@frame/engine/types";
import { type Angles, drawChengtuo, figurePose } from "@materials/剪纸角色/code/chengtuo";

/** 参考图里两个人的中心 x、头顶、鞋底（参考图像素） */
const CX = [264, 760];
const TOP = 42;
const GROUND = 626;
const ITEMS = { scarf: true, gloves: true, coat: true, band: true, boots: true, bricks: 2 };
const VIEWS: Angles[] = [{ face: 0 }, { face: -1 }];

export const sample: Sample = { duration: 1 };
const W = 1080;
const H = 1920;
/** 参考图缩放到多宽 */
const S = 0.95;

function drawHer(g: CanvasRenderingContext2D, o: Angles) {
  drawChengtuo(g, figurePose(o, 0.3, undefined, ITEMS));
}
/** 正面站着时从头顶（头发）到鞋底多高（角色单位） */
function heightOf(): number {
  const c = document.createElement("canvas");
  c.width = 500;
  c.height = 900;
  const g = c.getContext("2d")!;
  g.translate(250, 850);
  drawHer(g, VIEWS[0]);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let top = 850;
  for (let y = 0; y < c.height && top === 850; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 40) {
    top = y;
    break;
  }
  let bottom = 850;
  for (let y = c.height - 1; y > 0 && bottom === 850; y--) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 40) {
    bottom = y;
    break;
  }
  return bottom - top;
}

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  const im = new Image();
  im.src = assetUrl("films/work-3d80f743/ref/比例参考-沉沉-胳膊.png");
  await im.decode();
  const k = (GROUND - TOP) / heightOf();
  return {
    canvas,
    render() {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = "#f3e7df";
      g.fillRect(0, 0, width, height);
      g.setTransform(width / W, 0, 0, height / H, 0, 0);
      const x0 = (W - im.width * S) / 2;
      const ours = (y0: number, alpha = 1) => {
        VIEWS.forEach((o, v) => {
          g.save();
          g.globalAlpha = alpha;
          g.translate(x0 + CX[v] * S, y0 + GROUND * S);
          g.scale(k * S, k * S);
          drawHer(g, o);
          g.restore();
        });
      };
      const PH = im.height * S + 20;
      g.drawImage(im, x0, 10, im.width * S, im.height * S);
      ours(10 + PH);
      g.drawImage(im, x0, 10 + 2 * PH, im.width * S, im.height * S);
      ours(10 + 2 * PH, 0.55);
      g.fillStyle = "#2b2630";
      g.font = "24px sans-serif";
      g.fillText("参考", 20, 36);
      g.fillText("我们的", 20, 36 + PH);
      g.fillText("叠在一起", 20, 36 + 2 * PH);
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
