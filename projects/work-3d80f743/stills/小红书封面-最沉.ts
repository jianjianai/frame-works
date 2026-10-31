// 小红书封面 3:4 的第二张，和 小红书封面.ts、小红书封面-谁来拽住她.ts 三张 PK（比点击率）。三张拉开打法：
// - 第一张：世界观钩子（「这里的人，一绝望 / 就会飘起来」）+ 白天粉紫的天里她扑出去救人，动作、悬念。
// - 这张：反差钩子——字是成片的设定字「城里都说，她是 / 最沉的人」，画面却是她自己飘起来：0:38.60 夜里台灯下，她脱了铁靴，
//   光着脚从椅子上浮起来，闭着眼笑，脚踝上拴着绳子连到椅子腿，两只空铁靴倒在地上、桌下堆着写好字的砖。主角的脸大，
//   暖灯夜景，和第一张的颜色、景别、情绪都不一样。她一脱靴子就会飘起来是 0:38 就交代的设定，不碰结局。
// - 第三张：提问、情绪（「她拽住了全城飘起来的人 / 可谁来拽住她？」）+ 夜里楼顶两个人哭着笑、中间的砖亮着。
// 竖屏这一帧放不下「字 + 从头顶到铁靴」（头顶在设计 y 315、铁靴到 1811，3:4 宽 1080 铺满时只有 1440 高）：
// 封面按 0.78 倍取景（设计 1385×1846），中间用竖屏成片，两边接横屏成片同一刻（横屏这一镜是竖屏画面缩 0.72、中心对中心，
// 屋子往两边多画了，lib/room.ts），两边都没有的四个角和顶上一条用屋里的暗角补。
import type { Scene, SceneOptions, Still } from "@frame/engine/types";
import { FONTS, loadFont, shot } from "./抖音封面画法";
import { bloom, type Doc, filmFrame, nightLine } from "./小红书封面画法";

export const still: Still = { width: 1080, height: 1440 };

/** 她光着脚从椅子上浮起来，脚绳还松着垂到椅子腿（设计坐标：头顶 y 315、脚 1418，空铁靴 x 0–261、y 1474–1811） */
const T_FLOAT = 38.6;
/** 横屏这一刻的取景（lib/wide.ts act2 的 37.79 起）：竖屏画面缩 K、中心对中心 */
const K = 0.72;
/** 封面 1 像素 = 设计的 1/Z；设计 (FX, FY) 落在封面中心 */
const Z = 0.78;
const FX = 540;
const FY = 895;
/** 屋里暗角的颜色（铺底） */
const DARK = "#2b1b1c";

/** 一张画在单独画布上的层，按 mask 渐隐后叠上来（mask 在封面坐标里画不透明的地方） */
function masked(g: CanvasRenderingContext2D, k: number, paint: (h: CanvasRenderingContext2D) => void, mask: (h: CanvasRenderingContext2D) => void) {
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

/** 设计坐标 → 封面坐标 */
const cx = (x: number) => 540 + (x - FX) * Z;
const cy = (y: number) => 720 + (y - FY) * Z;

/** 渐变遮罩：(x0, y0) 处透明，到 (x1, y1) 不透明，再往外都不透明 */
function ramp(h: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const gr = h.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, "rgba(0,0,0,0)");
  gr.addColorStop(1, "rgba(0,0,0,1)");
  return gr;
}

/** 两张成片都没画到的地方先铺上竖屏边上的墙：左右各取一竖条（设计 x 40、1032，躲开左上角的架子）横着拉开，
 *  顶上（设计 y 0 往上）取最上面一横条竖着拉高，都虚化一点；上面再盖暗角，看不出是拉出来的 */
function fillGaps(g: CanvasRenderingContext2D, k: number, portrait: HTMLCanvasElement, q: number) {
  g.save();
  g.filter = `saturate(1.12) contrast(1.06) blur(${Math.round(6 * k)}px)`;
  const top = cy(0);
  const h = 1920 * Z;
  g.drawImage(portrait, 40 * q, 0, 8 * q, portrait.height, -20, top, cx(44) + 20, h);
  g.drawImage(portrait, 1032 * q, 0, 8 * q, portrait.height, cx(1036), top, 1100 - cx(1036), h);
  g.drawImage(portrait, 0, 0, portrait.width, 8 * q, -20, -20, 1120, top + 26);
  g.restore();
}

/** 夜里的暗角：四个角和顶上压进屋里的暗处（两张成片都没画到的角落就藏在里面），台灯那边留着光；顶上暗下来托住浅色的字 */
function vignette(g: CanvasRenderingContext2D) {
  g.save();
  g.translate(480, 820);
  g.scale(1, 1.3);
  const edge = g.createRadialGradient(0, 0, 360, 0, 0, 760);
  edge.addColorStop(0, "rgba(43,27,28,0)");
  edge.addColorStop(0.6, "rgba(43,27,28,0.45)");
  edge.addColorStop(1, "rgba(43,27,28,0.9)");
  g.fillStyle = edge;
  g.fillRect(-1000, -1000, 2000, 2000);
  g.restore();
  // 下面两个角（横屏画到设计 y 1710 为止）
  for (const x of [0, 1080]) {
    const corner = g.createRadialGradient(x, 1440, 0, x, 1440, 220);
    corner.addColorStop(0, "rgba(43,27,28,0.95)");
    corner.addColorStop(1, "rgba(43,27,28,0)");
    g.fillStyle = corner;
    g.fillRect(0, 1100, 1080, 340);
  }
  const top = g.createLinearGradient(0, 0, 0, 360);
  top.addColorStop(0, "rgba(36,22,24,0.92)");
  top.addColorStop(0.55, "rgba(36,22,24,0.55)");
  top.addColorStop(1, "rgba(36,22,24,0)");
  g.fillStyle = top;
  g.fillRect(0, 0, 1080, 360);
}

export async function createScene(options: SceneOptions): Promise<Scene> {
  const k = options.width / 1080;
  const font = "note" as const;
  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const g = canvas.getContext("2d")!;
  let job: Promise<void> | null = null;
  const draw = (signal: AbortSignal) =>
    (job ??= (async () => {
      await loadFont(font);
      // 两张成片都按设计的 q 倍画（横屏画布放大 1/K 倍，设计 1 像素在两张上一样大），比封面上用到的密一点
      const q = 1.4 * Z * k;
      const main = (await import("../timelines/main/visual.json")).default as unknown as Doc;
      const bili = (await import("../timelines/bili/visual.json")).default as unknown as Doc;
      const portrait = await filmFrame(options, main, 1080 * q, 1920 * q, T_FLOAT, signal);
      const wide = await filmFrame(options, bili, (1920 * q) / K, (1080 * q) / K, T_FLOAT, signal);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.setTransform(k, 0, 0, k, 0, 0);
      const all: [number, number, number, number] = [0, 0, 1080, 1440];
      g.fillStyle = DARK;
      g.fillRect(...all);
      fillGaps(g, k, portrait, q);
      // 横屏：画布像素 = q·(设计 x + 960/K − 540, 设计 y + 540/K − 960)；上下边（设计 y 210、1710）往里渐隐进暗角
      const ox = 960 / K - 540;
      const oy = 540 / K - 960;
      masked(
        g,
        k,
        (h) => shot(h, wide, q, FX + ox, FY + oy, 540, 720, Z, all),
        (h) => {
          h.fillStyle = ramp(h, 0, cy(-oy), 0, cy(-oy) + 90);
          h.fillRect(...all);
          h.fillStyle = ramp(h, 0, cy(1080 / K - oy), 0, cy(1080 / K - oy) - 60);
          h.fillRect(...all);
        },
      );
      // 竖屏铺在中间，左右边羽化着接上横屏
      masked(
        g,
        k,
        (h) => shot(h, portrait, q, FX, FY, 540, 720, Z, [cx(0), 0, cx(1080) - cx(0), 1440]),
        (h) => {
          h.fillStyle = ramp(h, cx(0), 0, cx(0) + 50, 0);
          h.fillRect(cx(0), 0, 1080, 1440);
          h.fillStyle = ramp(h, cx(1080), 0, cx(1080) - 50, 0);
          h.fillRect(0, 0, cx(1080), 1440);
        },
      );
      bloom(g, k);
      vignette(g);
      nightLine(g, k, FONTS[font].family, "城里都说，她是", "", 540, 76, 68);
      nightLine(g, k, FONTS[font].family, "最沉的人", "最沉", 540, 186, 132);
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
