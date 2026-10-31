// 「独沉」封面的画法（2026-10-31 用户从 B 站海报几版里选定的那张），几个平台、两种尺寸共用；这里不导出 createScene。
// 黄昏：满城的人都在往天顶那片白里飘，从楼顶、街上一个个离了地，越往上越小，碰到白就散成光点；整座城只有一个人还站着——
// 楼顶正中间的她，穿着铁靴，攥着拳头仰头看。字「城里人都说，她是 / 最沉的人」压在中间的天上。
// 暖的黄昏、她一个人不动（孤独、对比），人很小、天很大，往上飘的人背着亮的天是一片暗的剪影——美在颜色和尺度，
// 神秘在「为什么只有她不飘」。近处左右两个飘过镜头的人（骨架）虚着、压暗，当前景，画面有了纵深。
// 两种摆法（Layout）：WIDE 4:3 1440×1080（stills/B站封面-独沉.ts、抖音横封面-独沉.ts，就是 B 站定稿那张，数值一个都不能动：
// B 站已经导出过），TALL 3:4 1080×1440（stills/小红书封面-独沉.ts、抖音竖封面-独沉.ts）。画法和其他几版共用的部分在 B站海报画法.ts。
import { passerby } from "@materials/剪纸角色/code/cast";
import { bloom } from "./小红书封面画法";
import {
  type V2,
  dissolve,
  floatPose,
  grain,
  heroine,
  litFigure,
  loadPosterFont,
  motes,
  person,
  posterLine,
  radial,
  seeded,
  silhouette,
  skyline,
  vertical,
  vignette,
  whiteCeiling,
} from "./B站海报画法";

type Layer = [number, number, number, string, number, string | null];

export type Layout = {
  /** 封面的设计尺寸 */
  W: number;
  H: number;
  /** 天顶的白的下沿、往下打的光柱 [x, 宽] */
  whiteY: number;
  cols: [number, number][];
  /** 光里的浮尘：中心 x、y、范围、颗数 */
  motes: [number, number, number, number];
  /** 正碰到白、散成光点的人：[x, 大小, 随机数] */
  dissolves: [number, number, number][];
  /** 往上飘的人：一共撒几个、从白下面往下撒多深、横着从哪到多宽；cx 画面中线；sparse 字附近少放（[上, 下, 半宽]，留 15%）；
   *  column 她头顶上方空着（[半宽, 从多高往下]）；clear 字的方框里一个不留（[上, 下, 半宽]）；near 刚离开楼顶的几个大的 [x, y, 身高] */
  rising: { n: number; ySpan: number; xMin: number; xSpan: number; cx: number; sparse: [number, number, number]; column: V2; clear: [number, number, number]; near: [number, number, number][] };
  /** 远处的城（skyline 的几层） */
  city: Layer[];
  /** 暗角：中心 x、y、里圈、外圈、压扁 */
  vignette: [number, number, number, number, number];
  /** 前景两个飘过镜头的人：[x, y, 倍数, 路人号, 朝向] */
  ghosts: [number, number, number, number, number][];
  /** 她：两脚之间的地面、倍数 */
  her: V2;
  herS: number;
  /** 字：第一行 y、字号，第二行 y、字号（都在画面中线上） */
  text: [number, number, number, number];
};

/** 4:3（B 站、抖音横封面）：B 站定稿的那张 */
export const WIDE: Layout = {
  W: 1440,
  H: 1080,
  whiteY: 140,
  cols: [[90, 90], [420, 70], [700, 120], [1010, 80], [1260, 100]],
  motes: [720, 240, 760, 160],
  dissolves: [[150, 13, 2], [380, 10, 4], [610, 14, 6], [905, 11, 9], [1130, 15, 12], [1330, 10, 15]],
  rising: {
    n: 170,
    ySpan: 500,
    xMin: -30,
    xSpan: 1500,
    cx: 720,
    sparse: [250, 560, 470],
    column: [110, 560],
    clear: [270, 555, 385],
    near: [[240, 620, 62], [420, 660, 54], [1050, 640, 58], [1230, 650, 50], [880, 590, 46], [560, 600, 44]],
  },
  city: [
    [985, 80, 220, "#5e3b5c", 0.06, "rgba(150,96,124,0.5)"],
    [1040, 50, 170, "#43294a", 0.09, "rgba(90,56,86,0.35)"],
    [1080, 30, 120, "#2c1a32", 0.12, null],
  ],
  vignette: [720, 520, 520, 1080, 0.8],
  ghosts: [
    [60, 860, 0.85, 4, 0.6],
    [1360, 620, 0.7, 2, -0.5],
  ],
  her: [720, 932],
  herS: 0.6,
  text: [330, 62, 462, 158],
};

/** 3:4（小红书、抖音竖封面）：天更高，往上飘的人更多；字在上半截，她站在下面楼顶的正中间。
 *  小红书视频笔记右上角盖播放标、抖音个人主页左下角盖点赞数：那两个角只有白和城 */
export const TALL: Layout = {
  W: 1080,
  H: 1440,
  whiteY: 170,
  cols: [[40, 80], [290, 70], [520, 110], [790, 80]],
  motes: [540, 290, 640, 190],
  dissolves: [[110, 13, 2], [320, 10, 4], [540, 14, 6], [760, 11, 9], [960, 14, 12]],
  rising: {
    n: 200,
    ySpan: 740,
    xMin: -30,
    xSpan: 1140,
    cx: 540,
    sparse: [340, 670, 390],
    column: [100, 820],
    clear: [358, 652, 350],
    near: [[150, 900, 60], [320, 945, 52], [780, 925, 56], [950, 960, 50], [660, 840, 44], [420, 820, 42]],
  },
  city: [
    [1250, 90, 230, "#5e3b5c", 0.06, "rgba(150,96,124,0.5)"],
    [1320, 50, 170, "#43294a", 0.09, "rgba(90,56,86,0.35)"],
    [1440, 30, 130, "#2c1a32", 0.12, null],
  ],
  vignette: [540, 800, 560, 1180, 1.15],
  ghosts: [
    [30, 1230, 1.0, 4, 0.6],
    [1055, 760, 0.8, 2, -0.5],
  ],
  her: [540, 1266],
  herS: 0.68,
  text: [400, 60, 538, 150],
};

/** 黄昏的天：白下面是发亮的淡金，往下桃色、玫瑰色、灰紫，城上面是暗暗的梅子色 */
function sky(g: CanvasRenderingContext2D, L: Layout) {
  vertical(g, [0, 0, L.W, L.H], [
    [0, "#fff3e4"],
    [0.15, "#fde3c8"],
    [0.3, "#f7c2a2"],
    [0.48, "#e99a8c"],
    [0.66, "#b97790"],
    [0.84, "#6e4766"],
    [1, "#3e2742"],
  ]);
}

/** 往上飘的人：一股股从城里升起来，越往上越小、越淡；中间放字的地方留空 */
function rising(g: CanvasRenderingContext2D, L: Layout) {
  const { n, ySpan, xMin, xSpan, cx, sparse, column, clear, near } = L.rising;
  const r = seeded(17);
  const items: [number, number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const u = Math.pow(r(), 1.5); // 0 = 贴着白（远），1 = 离城最近
    const y = L.whiteY + 40 + u * ySpan;
    const x = xMin + r() * xSpan;
    // 字的地方（中间偏上）少放；她头顶上方留一条空的天
    if (y > sparse[0] && y < sparse[1] && Math.abs(x - cx) < sparse[2] && r() < 0.85) continue;
    if (Math.abs(x - cx) < column[0] && y > column[1]) continue;
    const h = 7 + u * u * 46 + r() * 5;
    // 字的方框里一个也不留：上面按随机数留下的那些在这里去掉（随机数照原来的顺序取完，别的人位置不变）
    if (y > clear[0] && y < clear[1] && Math.abs(x - cx) < clear[2]) continue;
    items.push([x, y, h, u]);
  }
  // 刚离开楼顶的几个：比别人大，脚下离楼顶还有一截（一看就是飘起来，不是站着举手）
  for (const [x, y, h] of near) items.push([x, y, h, 1]);
  items.sort((a, b) => a[3] - b[3]);
  for (const [x, y, h, u] of items) silhouette(g, x, y, h, x * 0.01, 0.35 + 0.55 * u, "74,42,70", 0.18);
}

/** 她站的那栋楼的楼顶：女儿墙上沿迎着光一线亮，左边一个楼梯间、右边一个水箱和天线，楼面上零星几扇亮着的窗（和远处的城接上，
 *  不是一个黑方块的底座）。都按她的位置摆 */
function roof(g: CanvasRenderingContext2D, L: Layout) {
  const hx = L.her[0];
  const top = L.her[1] - 2;
  const wall = "#24152a";
  const lit = "rgba(255,230,200,0.4)";
  g.fillStyle = wall;
  g.fillRect(hx - 250, top, 500, L.H - top + 10);
  // 楼梯间
  g.fillRect(hx - 226, top - 46, 82, 46);
  g.fillStyle = "rgba(255,226,196,0.1)";
  g.fillRect(hx - 204, top - 34, 26, 34);
  // 水箱和天线
  g.fillStyle = wall;
  g.fillRect(hx + 136, top - 40, 62, 28);
  g.fillRect(hx + 142, top - 12, 5, 12);
  g.fillRect(hx + 187, top - 12, 5, 12);
  g.fillRect(hx + 182, top - 104, 3, 64);
  g.fillRect(hx + 170, top - 88, 27, 3);
  // 迎光的上沿
  g.fillStyle = lit;
  g.fillRect(hx - 250, top, 500, 2);
  g.fillRect(hx - 226, top - 46, 82, 2);
  g.fillRect(hx + 136, top - 40, 62, 2);
  // 楼面上的窗
  const r = seeded(57);
  for (let y = top + 34; y < L.H; y += 30) {
    for (let x = hx - 228; x < hx + 230; x += 26) {
      if (r() < 0.1) {
        g.fillStyle = `rgba(255,${190 + Math.floor(r() * 40)},${120 + Math.floor(r() * 50)},${0.4 + r() * 0.35})`;
        g.fillRect(x, y, 8, 11);
      }
    }
  }
  // 下面沉进暗里
  vertical(g, [hx - 250, top + 20, 500, L.H - top], [
    [0, "rgba(30,16,34,0)"],
    [1, "rgba(30,16,34,0.6)"],
  ]);
}

/** 按摆法 L 画整张封面（g 已经按封面的设计像素缩放，k 是设计 1 像素对画布的像素） */
export async function paintDuchen(g: CanvasRenderingContext2D, k: number, L: Layout) {
  await loadPosterFont();
  sky(g, L);
  const edge = whiteCeiling(g, L.whiteY, 700, 1.1, L.cols, false, L.W);
  motes(g, ...L.motes, 21, 0.7);
  for (const [x, rr, sd] of L.dissolves) dissolve(g, x, edge(x) + 6, rr, sd);
  rising(g, L);
  skyline(g, 23, L.city, L.W, L.H + 120);
  const [vx, vy, vin, vout, vsy] = L.vignette;
  vignette(g, vx, vy, vin, vout, "rgb(70,40,70)", 0.55, vsy, L.W);
  whiteCeiling(g, L.whiteY, 0, 1.1, [], true, L.W);
  // 前景：左右两个飘过镜头的人，很近、虚、暗
  for (const [x, y, s, n, face] of L.ghosts) {
    const p = person(passerby(n), floatPose(face, face > 0 ? 1 : -1));
    g.save();
    g.filter = `blur(${Math.round(7 * k)}px)`;
    g.globalAlpha = 0.72;
    litFigure(g, k, (h) => p.draw(h, x, y, s), { tint: ["#3a2240", 0.82] });
    g.restore();
  }
  roof(g, L);
  const her = heroine({
    face: -0.62,
    expression: "仰望",
    neck: 36,
    lookY: -1,
    lookX: -0.2,
    shoulderL: -8,
    elbowL: 16,
    handL: "fist",
    shoulderR: 8,
    elbowR: 14,
    handR: "fist",
    hipR: 6,
    kneeR: -4,
    hipL: -6,
    kneeL: -3,
    wind: 1.0,
    float: 0.3,
  });
  const tall = L.herS / 0.6;
  litFigure(g, k, (h) => her.draw(h, ...L.her, L.herS), {
    tint: ["#3c2440", 0.28],
    shade: ["#2a1630", 0.5],
    top: L.her[1] - 340 * tall,
    bottom: L.her[1],
    rim: ["#fff2dc", 0.85],
    dir: [0.4, 1.6],
    aura: ["#ffe4c4", 0.45, 12],
  });
  radial(g, L.her[0], L.her[1] - 300 * tall, 170, [
    [0, "rgba(255,236,210,0.18)"],
    [1, "rgba(255,236,210,0)"],
  ]);
  bloom(g, k);
  const ink = { color: "#3a2629", accentColor: "#b4472f", halo: "255,244,230", haloAlpha: 0.9 };
  posterLine(g, k, { text: "城里人都说，她是", x: L.W / 2, y: L.text[0], size: L.text[1], tracking: 0.14, ...ink });
  posterLine(g, k, { text: "最沉的人", accent: "最沉", x: L.W / 2, y: L.text[2], size: L.text[3], tracking: 0.1, ...ink });
  grain(g, 0.05);
}
