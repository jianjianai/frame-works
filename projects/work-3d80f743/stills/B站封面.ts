// B 站封面 4:3（1440×1080）。B 站 2023 年底起投稿封面是 4:3（1200×900 以上，16:10 不用了）：手机首页按 4:3 整张显示，
// 电脑首页、搜索等多数居中裁成 16:9（上下各裁 135），个人空间裁成 16:10。字和两个人的脸都放在中间 16:9 那一条（y 135–945）里；
// 显示时左下角盖播放数和弹幕数、右下角盖时长，下面两个角不放要看的东西。
// 重点是点击率，打法照小红书第一张（stills/小红书封面.ts）：
// - 画面：0:27.65 她从楼顶扑出去、两只手伸向下面正往白里飘的千斤，两个人还差一截没碰到——救不救得到，点进去才知道。
//   用 B 站横屏成片的这一刻（图层直接读 timelines/bili/visual.json，两条时间轴下一样）：横屏往两边多画的天上也飘满了发光的人，
//   右边沿是她跳下来的那栋楼。早一点她还在楼顶上，晚一点举起的胳膊挡住脸。不剧透（前半段）。
// - 字：首帧的设定字「这里的人，一绝望 / 就会飘起来」（「飘起来」暖赭红），没看过的人一眼看懂这个世界，又和满天往上飘的人对上。
//   两个人在右边，字在左边干净的天上；排法照抖音、小红书封面（前半句小、钩子大，不放片名）。
// 原来的 16:10 版（横屏 0:28.6 抱住 +「城里都说，她是 / 最沉的人」）没出过图，改成了这版。
import type { Scene, SceneOptions, Still } from "@frame/engine/types";
import { FONTS, line, loadFont, shot } from "./抖音封面画法";
import { bloom, type Doc, filmFrame } from "./小红书封面画法";

export const still: Still = { width: 1440, height: 1080 };

/** 她扑出楼顶、两手伸向千斤，两只眼睛都看得见、盯着千斤（竖屏设计坐标：她的头顶 y 585、铁靴到 x 850，千斤 x 293–539、
 *  鞋底 y 1665） */
const T_LEAP = 27.65;
/** 横屏这一刻的取景（lib/wide.ts 的 act2：k 0.72、不偏移）：横屏像素 = (960, 540) + K·(设计 − (540, 960)) */
const K = 0.72;
/** 封面 1 像素 = 设计的 1/Z；设计 (FX, FY) 落在封面中心。取设计 x −778–978、y 390–1707（横屏成片画到 x −793、y 1710）：
 *  她的头顶在封面 160（裁成 16:9 也看得见整个头），千斤的鞋底 1045（4:3 里从头到脚都在，裁成 16:9 只裁到小腿）；
 *  两个人在右边，左边是天 */
const Z = 0.82;
const FX = 100;
const FY = 1048;

/** 设计坐标 → 横屏成片的像素 */
const toWide = (x: number, y: number): [number, number] => [960 + K * (x - 540), 540 + K * (y - 960)];

/** 比 shot 默认的再浓一点、反差再大一点（信息流里是一张小图） */
const LOOK = "saturate(1.06) contrast(1.05)";

/** 左下角那栋矮楼的楼顶（栏杆、水箱、亮着的窗）离两个人很远、又大：同一帧虚化一层盖上去（从左下角往右上淡掉），退到后面，
 *  不和人抢（显示时左下角还要盖播放数） */
function recede(g: CanvasRenderingContext2D, k: number, frame: HTMLCanvasElement, q: number, z: number) {
  const off = document.createElement("canvas");
  off.width = g.canvas.width;
  off.height = g.canvas.height;
  const h = off.getContext("2d")!;
  h.setTransform(k, 0, 0, k, 0, 0);
  shot(h, frame, q, ...toWide(FX, FY), 720, 540, z, [0, 0, 1440, 1080], `${LOOK} blur(${Math.round(6 * k)}px)`);
  h.globalCompositeOperation = "destination-in";
  h.save();
  h.translate(250, 1080);
  h.scale(1.25, 1);
  const mask = h.createRadialGradient(0, 0, 260, 0, 0, 640);
  mask.addColorStop(0, "rgba(0,0,0,1)");
  mask.addColorStop(1, "rgba(0,0,0,0)");
  h.fillStyle = mask;
  h.fillRect(-1600, -1600, 3200, 3200);
  h.restore();
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(off, 0, 0);
  g.restore();
}

/** 调色（按封面像素画在一张单独的画布上再叠上去）：
 *  - 下面和右边压一层暗紫（正片叠底）：满天的光点和两个人更跳，楼退后一点；左上放字的天不压
 *  - 左上再亮一层暖白（滤色）：像是头顶的白压下来的光，托住字 */
function grade(g: CanvasRenderingContext2D, k: number) {
  const off = document.createElement("canvas");
  off.width = g.canvas.width;
  off.height = g.canvas.height;
  const h = off.getContext("2d")!;
  h.setTransform(k, 0, 0, k, 0, 0);
  h.save();
  h.translate(860, 560);
  h.scale(1.35, 1);
  const edge = h.createRadialGradient(0, 0, 360, 0, 0, 820);
  edge.addColorStop(0, "rgba(118,62,128,0)");
  edge.addColorStop(1, "rgba(118,62,128,0.5)");
  h.fillStyle = edge;
  h.fillRect(-1600, -1600, 3200, 3200);
  h.restore();
  const down = h.createLinearGradient(0, 640, 0, 1080);
  down.addColorStop(0, "rgba(140,80,150,0)");
  down.addColorStop(1, "rgba(140,80,150,0.42)");
  h.fillStyle = down;
  h.fillRect(0, 0, 1440, 1080);
  // 左下角那栋矮楼再压一层
  h.save();
  h.translate(220, 1080);
  h.scale(1.3, 1);
  const corner = h.createRadialGradient(0, 0, 120, 0, 0, 600);
  corner.addColorStop(0, "rgba(96,52,116,0.5)");
  corner.addColorStop(1, "rgba(96,52,116,0)");
  h.fillStyle = corner;
  h.fillRect(-1600, -1600, 3200, 3200);
  h.restore();
  h.globalCompositeOperation = "destination-out";
  h.save();
  h.translate(360, 300);
  h.scale(1.5, 1);
  const keep = h.createRadialGradient(0, 0, 120, 0, 0, 420);
  keep.addColorStop(0, "rgba(0,0,0,1)");
  keep.addColorStop(1, "rgba(0,0,0,0)");
  h.fillStyle = keep;
  h.fillRect(-1000, -1000, 2000, 2000);
  h.restore();
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "multiply";
  g.drawImage(off, 0, 0);
  g.restore();
  g.save();
  g.globalCompositeOperation = "screen";
  g.translate(360, 200);
  g.scale(1.6, 1);
  const light = g.createRadialGradient(0, 0, 0, 0, 0, 460);
  light.addColorStop(0, "rgba(255,240,222,0.5)");
  light.addColorStop(1, "rgba(255,240,222,0)");
  g.fillStyle = light;
  g.fillRect(-1000, -1000, 2000, 2000);
  g.restore();
}

export async function createScene(options: SceneOptions): Promise<Scene> {
  const k = options.width / 1440;
  const font = "note" as const;
  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const g = canvas.getContext("2d")!;
  let job: Promise<void> | null = null;
  const draw = (signal: AbortSignal) =>
    (job ??= (async () => {
      await loadFont(font);
      // 横屏成片的 1 像素在封面上是 z 像素；按封面需要的大小再密一点画（缩小时线条更干净）
      const z = Z / K;
      const q = 1.25 * z * k;
      const bili = (await import("../timelines/bili/visual.json")).default as unknown as Doc;
      const frame = await filmFrame(options, bili, 1920 * q, 1080 * q, T_LEAP, signal);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.setTransform(k, 0, 0, k, 0, 0);
      shot(g, frame, q, ...toWide(FX, FY), 720, 540, z, [0, 0, 1440, 1080], LOOK);
      recede(g, k, frame, q, z);
      bloom(g, k);
      grade(g, k);
      line(g, k, FONTS[font].family, { text: "这里的人，一绝望", x: 380, y: 250, size: 66 });
      line(g, k, FONTS[font].family, { text: "就会飘起来", accent: ["飘起来"], x: 380, y: 390, size: 128 });
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
