// 小红书封面 3:4（1080×1440，双列信息流按 3:4 整张显示）。重点是点击率：
// - 画面：0:27.66 沉沉从楼顶扑出去、两只手伸向下面正往白里飘的千斤（千斤张着手、闭着眼笑，眼泪往上飘），两个人还差一截
//   没碰到——救不救得到，点进去才知道。满天发着光往上飘的人、头顶的白和彩虹边，一张图把世界讲清楚。不剧透（前半段）。
// - 字：成片首帧的设定字「这里的人，一绝望 / 就会飘起来」（「飘起来」暖赭红）：没看过的人一眼看懂这个世界，又和画面
//   一一对上（往上飘的人 = 绝望的人，扑出去的她 = 去拽人的人）。排法照抖音封面：两行横排压在顶上干净的白里，前半句小、
//   钩子大，不放片名。小红书视频笔记右上角有播放标，字居中、不碰右上角。
// 画法从 抖音封面画法.ts 借（shot、backdrop、line），字体就是成片设定字的子集（note），不用另截。
// 和 小红书封面-最沉.ts（反差钩子 + 夜里的暖灯）、小红书封面-谁来拽住她.ts（提问 + 两个人哭着笑的近景）三张 PK。
import type { Scene, SceneOptions, Still } from "@frame/engine/types";
import { createCompositionScene, type VisualDocument } from "@frame/engine/compositor";
import { FONTS, LOADERS, backdrop, line, loadFont, shot } from "./抖音封面画法";

export const still: Still = { width: 1080, height: 1440 };

/** 竖屏成片的设计尺寸 */
const FW = 1080;
const FH = 1920;
/** 她扑出楼顶、两手伸向千斤，两只眼睛都看得见、盯着千斤；千斤在左下张着手往上飘（设计坐标：她的头顶 y 585、铁靴到 x 850，
 *  千斤 x 293–539、鞋底 y 1665）。早一点她还在楼顶上，晚一点举起的胳膊挡住脸 */
const T_LEAP = 27.65;
/** 封面就是成片原大（竖屏宽 1080 正好铺满，不能再缩），设计 y 262–1702：头顶留出放字的白，千斤的鞋底离下沿 35 */
const FY = 982;

/** 竖屏成片这一刻的画面（全部图层，不带歌词），按设计尺寸的 q 倍画。直接用竖屏时间轴的图层（工作台开着横屏也一样） */
async function portraitFrame(options: SceneOptions, q: number, t: number, signal: AbortSignal) {
  const doc = (await import("../timelines/main/visual.json")).default as unknown as VisualDocument;
  const clips = doc.clips.filter((c) => !(c.source.kind === "scene" && c.source.module === "lyrics"));
  const film = createCompositionScene({ ...options, width: Math.round(FW * q), height: Math.round(FH * q) }, { ...doc, clips }, LOADERS);
  try {
    await film.prepareFrame!(t, { signal });
    await film.render(t);
    const c = document.createElement("canvas");
    c.width = film.canvas.width;
    c.height = film.canvas.height;
    c.getContext("2d")!.drawImage(film.canvas, 0, 0);
    return c;
  } finally {
    film.dispose();
  }
}

/** 比 shot 默认的再浓一点、反差再大一点（信息流里是一张小图） */
const LOOK = "saturate(1.06) contrast(1.05)";

/** 柔光：同一帧虚化后柔光、滤色各叠一层薄的——亮处（白、光点、脸）晕开，暗处更实，画面通透一点 */
function bloom(g: CanvasRenderingContext2D, k: number, frame: HTMLCanvasElement, q: number) {
  for (const [op, alpha, radius] of [["soft-light", 0.4, 14], ["screen", 0.12, 24]] as const) {
    g.save();
    g.globalCompositeOperation = op;
    g.globalAlpha = alpha;
    shot(g, frame, q, 540, FY, 540, 720, 1, [0, 0, 1080, 1440], `${LOOK} blur(${Math.round(radius * k)}px)`);
    g.restore();
  }
}

/** 左边缘 y 900 往下露出旁边那栋楼的楼顶（栏杆和楼角，设计 x 0–32）：拿它右边一竖条干净的天（设计 x 52）横着盖住，
 *  往右、往上羽化（天是上下渐变的，横着拉开就接得上） */
function patchLeftEdge(g: CanvasRenderingContext2D, k: number, frame: HTMLCanvasElement, q: number) {
  const off = document.createElement("canvas");
  off.width = g.canvas.width;
  off.height = g.canvas.height;
  const h = off.getContext("2d")!;
  h.setTransform(k, 0, 0, k, 0, 0);
  h.filter = `saturate(1.12) contrast(1.06) ${LOOK} blur(${Math.round(3 * k)}px)`;
  h.drawImage(frame, 52 * q, 0, 6 * q, frame.height, -12, 720 - FY, 84, FH);
  h.filter = "none";
  h.globalCompositeOperation = "destination-in";
  const across = h.createLinearGradient(0, 0, 66, 0);
  across.addColorStop(0, "rgba(0,0,0,1)");
  across.addColorStop(0.55, "rgba(0,0,0,1)");
  across.addColorStop(1, "rgba(0,0,0,0)");
  h.fillStyle = across;
  h.fillRect(0, 0, 1080, 1440);
  const down = h.createLinearGradient(0, 860, 0, 940);
  down.addColorStop(0, "rgba(0,0,0,0)");
  down.addColorStop(1, "rgba(0,0,0,1)");
  h.fillStyle = down;
  h.fillRect(0, 0, 1080, 1440);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(off, 0, 0);
  g.restore();
}

/** 调色（按封面像素画在一张单独的画布上再叠上去，k 是封面 1 像素对画布的像素）：
 *  - 下面和两边压一层暗紫（正片叠底）：满天的光点和两个人更跳，右边的楼退后一点；从 y 300 往上慢慢不压，顶上放字的白不动
 *  - 顶上再亮一层暖白（滤色）：白像是从上面压下来的光 */
function grade(g: CanvasRenderingContext2D, k: number) {
  const off = document.createElement("canvas");
  off.width = g.canvas.width;
  off.height = g.canvas.height;
  const h = off.getContext("2d")!;
  h.setTransform(k, 0, 0, k, 0, 0);
  h.save();
  h.translate(500, 900);
  h.scale(1, 1.3);
  const edge = h.createRadialGradient(0, 0, 340, 0, 0, 800);
  edge.addColorStop(0, "rgba(118,62,128,0)");
  edge.addColorStop(1, "rgba(118,62,128,0.5)");
  h.fillStyle = edge;
  h.fillRect(-1200, -1200, 2400, 2400);
  h.restore();
  const down = h.createLinearGradient(0, 700, 0, 1440);
  down.addColorStop(0, "rgba(140,80,150,0)");
  down.addColorStop(1, "rgba(140,80,150,0.4)");
  h.fillStyle = down;
  h.fillRect(0, 0, 1080, 1440);
  h.globalCompositeOperation = "destination-in";
  const keepTop = h.createLinearGradient(0, 300, 0, 720);
  keepTop.addColorStop(0, "rgba(0,0,0,0)");
  keepTop.addColorStop(1, "rgba(0,0,0,1)");
  h.fillStyle = keepTop;
  h.fillRect(0, 0, 1080, 1440);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "multiply";
  g.drawImage(off, 0, 0);
  g.restore();
  g.save();
  g.globalCompositeOperation = "screen";
  const light = g.createRadialGradient(540, -160, 0, 540, -160, 620);
  light.addColorStop(0, "rgba(255,240,222,0.55)");
  light.addColorStop(1, "rgba(255,240,222,0)");
  g.fillStyle = light;
  g.fillRect(0, 0, 1080, 1440);
  g.restore();
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
      // 成片按封面需要的大小再密一点画（缩小时线条更干净）
      const q = 1.4 * k;
      const frame = await portraitFrame(options, q, T_LEAP, signal);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.setTransform(k, 0, 0, k, 0, 0);
      shot(g, frame, q, 540, FY, 540, 720, 1, [0, 0, 1080, 1440], LOOK);
      bloom(g, k, frame, q);
      patchLeftEdge(g, k, frame, q);
      grade(g, k);
      backdrop(g, [0, 0, 1080, 380], 0, 0, 0, 380, 0.5);
      line(g, k, FONTS[font].family, { text: "这里的人，一绝望", x: 540, y: 90, size: 72 });
      line(g, k, FONTS[font].family, { text: "就会飘起来", accent: ["飘起来"], x: 540, y: 220, size: 150 });
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
