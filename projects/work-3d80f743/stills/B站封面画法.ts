// B 站封面（stills/B站封面*.ts，4:3 1440×1080）几版共用的画法；这里不导出 createScene（不是静帧本身）。
// B 站 2023 年底起投稿封面是 4:3（1200×900 以上）：手机首页按 4:3 整张显示，电脑首页、搜索等多数居中裁成 16:9（y 135–945），
// 个人空间裁成 16:10。字和主角的脸都放在 16:9 那一条里；显示时左下角盖播放数和弹幕数、右下角盖时长。
// 底片是竖屏、横屏两张成片同一刻拼起来的（按竖屏设计坐标）：横屏是竖屏画面缩 k、竖屏的中心放到横屏 (960 + ox, 540 + oy)
// （lib/wide.ts 里那一刻的取景），横屏往两边多画了、竖屏上下多画了。中间铺竖屏、两边接横屏，接缝羽化；两张都没画到的角
// 拿竖屏边上一竖条横着拉开铺底。取景的时候别让封面伸到竖屏的上下沿外面（那里没有铺底）。
import type { Scene, SceneOptions } from "@frame/engine/types";
import { shot } from "./抖音封面画法";
import { type Doc, filmFrame } from "./小红书封面画法";

/** 横屏这一刻的取景（lib/wide.ts 的表） */
export type Lens = { k: number; ox?: number; oy?: number };
/** 封面的取景：设计 (fx, fy) 落在封面中心 (720, 540)，封面 1 像素 = 设计的 1/z */
export type Place = { z: number; fx: number; fy: number };
export type Frames = { portrait: HTMLCanvasElement; wide: HTMLCanvasElement; q: number; lens: Required<Lens> };

/** 比 shot 默认的再浓一点、反差再大一点（信息流里是一张小图） */
export const LOOK = "saturate(1.06) contrast(1.05)";

/** 两张成片这一刻的画面（不带歌词），都按设计的 q 倍画（横屏画布放大 1/k 倍，设计 1 像素在两张上一样大）；
 *  z 是封面上用到的倍数，再密 1.4 倍画（缩小时线条更干净） */
export async function loadFrames(options: SceneOptions, t: number, lens: Lens, z: number, k: number, signal: AbortSignal): Promise<Frames> {
  const full = { ox: 0, oy: 0, ...lens };
  const q = 1.4 * z * k;
  const main = (await import("../timelines/main/visual.json")).default as unknown as Doc;
  const bili = (await import("../timelines/bili/visual.json")).default as unknown as Doc;
  const portrait = await filmFrame(options, main, 1080 * q, 1920 * q, t, signal);
  const wide = await filmFrame(options, bili, (1920 * q) / full.k, (1080 * q) / full.k, t, signal);
  return { portrait, wide, q, lens: full };
}

/** 设计坐标 → 封面坐标 */
export const toCover = (p: Place, x: number, y: number): [number, number] => [720 + (x - p.fx) * p.z, 540 + (y - p.fy) * p.z];

/** 一张画在单独画布上的层，按 mask 渐隐后叠上来（两个函数都在封面坐标里画；mask 画不透明的地方） */
export function masked(g: CanvasRenderingContext2D, k: number, paint: (h: CanvasRenderingContext2D) => void, mask: (h: CanvasRenderingContext2D) => void) {
  const off = document.createElement("canvas");
  off.width = g.canvas.width;
  off.height = g.canvas.height;
  const h = off.getContext("2d")!;
  h.setTransform(k, 0, 0, k, 0, 0);
  paint(h);
  h.globalCompositeOperation = "destination-in";
  mask(h);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(off, 0, 0);
  g.restore();
}

/** 渐变遮罩：(x0, y0) 处透明，到 (x1, y1) 不透明，再往外都不透明 */
function ramp(h: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const gr = h.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, "rgba(0,0,0,0)");
  gr.addColorStop(1, "rgba(0,0,0,1)");
  return gr;
}

const ALL: [number, number, number, number] = [0, 0, 1440, 1080];

/** 拼好的底片画满封面（g 已经按封面像素缩放）。cols：铺底用竖屏哪两竖条（设计 x，各 8 宽），边上有东西时往里挪 */
export function paintMerged(g: CanvasRenderingContext2D, k: number, { portrait, wide, q, lens }: Frames, p: Place, look = LOOK, cols: [number, number] = [4, 1068]) {
  const [x0, y0] = toCover(p, 0, 0);
  const [x1, y1] = toCover(p, 1080, 1920);
  // 铺底：竖屏左右边上一竖条横着拉开（虚化一点），垫在两张都没画到的角里；要一直垫到竖屏羽化的那 50 以内，不然半透明的地方露出空画布
  g.save();
  g.filter = `saturate(1.12) contrast(1.06) ${look} blur(${Math.round(6 * k)}px)`;
  if (x0 > 0) g.drawImage(portrait, cols[0] * q, 0, 8 * q, portrait.height, -20, y0, x0 + 90, y1 - y0);
  if (x1 < 1440) g.drawImage(portrait, cols[1] * q, 0, 8 * q, portrait.height, x1 - 70, y0, 1460 - x1 + 70, y1 - y0);
  g.restore();
  // 横屏：画布像素 = q·(设计 + off)；上下边往里渐隐进铺底
  const offX = (960 + lens.ox) / lens.k - 540;
  const offY = (540 + lens.oy) / lens.k - 960;
  const top = toCover(p, 0, -offY)[1];
  const bottom = toCover(p, 0, 1080 / lens.k - offY)[1];
  masked(
    g,
    k,
    (h) => shot(h, wide, q, p.fx + offX, p.fy + offY, 720, 540, p.z, ALL, look),
    (h) => {
      h.fillStyle = ramp(h, 0, top, 0, top + 80);
      h.fillRect(...ALL);
      h.fillStyle = ramp(h, 0, bottom, 0, bottom - 60);
      h.fillRect(...ALL);
    },
  );
  // 竖屏铺在中间，左右边羽化着接上横屏
  masked(
    g,
    k,
    (h) => shot(h, portrait, q, p.fx, p.fy, 720, 540, p.z, [x0, 0, x1 - x0, 1080], look),
    (h) => {
      h.fillStyle = ramp(h, x0, 0, x0 + 50, 0);
      h.fillRect(x0, 0, 1440, 1080);
      h.fillStyle = ramp(h, x1, 0, x1 - 50, 0);
      h.fillRect(0, 0, x1, 1080);
    },
  );
}

/** 封面静帧的外壳：paint 在封面像素（设计宽 designWidth，默认 4:3 的 1440×1080；已经按 k 缩放）里画一次，之后每次 render 都是同一张 */
export function coverScene(options: SceneOptions, paint: (g: CanvasRenderingContext2D, k: number, signal: AbortSignal) => Promise<void>, designWidth = 1440): Scene {
  const k = options.width / designWidth;
  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const g = canvas.getContext("2d")!;
  let job: Promise<void> | null = null;
  const draw = (signal: AbortSignal) =>
    (job ??= (async () => {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.setTransform(k, 0, 0, k, 0, 0);
      await paint(g, k, signal);
    })().catch((error) => {
      job = null;
      throw error;
    }));
  return {
    canvas,
    prepareFrame: (_time, { signal }) => draw(signal),
    render: () => draw(new AbortController().signal),
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
