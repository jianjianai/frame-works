// 配角的发型：每种发型是几块正面线稿（头的坐标：脸最宽处半宽 41、下巴 y = 48、眼睛 y ≈ 8、耳朵 x ±33..55、y 0..28、脸的上沿 y ≈ −53），
// 转到 3/4 时按脸的轮廓自动过渡（turnHair）：脸里面的点按这一行脸的左右边映射、中间往朝向那边多挪一点；
// 脸外面朝前那侧跟着脸边压窄，后脑勺那侧让出后脑勺。原来是正面轮廓直接往后平移：后脑勺成了一块方的，
// |face| 0.2…0.45 时刘海按脸边外推出一根长刺。
// 画法和秤砣一样：平涂、外轮廓描边、右下一道阴影；头发压在头发上的边不描；发梢分缝处往上一道由粗到细的发丝线。

import { type Ink, type P, type V2, clamp01, drawPart, fillShaded, lerp, loopSin, ribbonPts, rowSpan, smoothPath } from "./rig";
import { FACE_TURN, type HeadView, type Rig, rotateV } from "./figure";

export type HairStyle = "short" | "kid" | "curtain" | "bob" | "sidebob" | "bun" | "long" | "ponytail" | "highpony" | "receding" | "none";

/** 马尾：发根（正面、3/4 的头坐标）、长、发根处的宽、皮筋 */
interface Tail {
  root: V2;
  root3: V2;
  len: number;
  w: number;
  /** 垂着时的方向（弧度，0 = 竖直往下，正 = 往画面左、负 = 往画面右） */
  hang: number;
  /** 发根那几段硬一点（高马尾先往外翘出去再垂下来，正面时从头的一边露出来）：0 软 → 1 硬 */
  stiff?: number;
}

interface HairDef {
  /** 后面的头发（画在身子后面）：整个外轮廓，P 的第三项 1 是尖角 */
  back: P[];
  /** 压在脸上的（刘海、鬓角）：只描压在皮肤上的边 */
  front: P[][];
  /** 发丝线（第一个点粗、往后变细）：back 画在后面那片上，front 画在刘海上 */
  lines?: { back?: V2[][]; front?: V2[][] };
  /** 3/4 时后脑勺那侧往外让多少（脸外面的部分按这个比例拉宽） */
  occiput?: number;
  /** 披下来的部分从这个高度往下跟着受力飘 */
  pivot?: number;
  /** 漂起来时一缕一缕的长度 */
  float?: number;
  /** 头顶后面的髻：圆心（正面、3/4）、半径 */
  bun?: { c: V2; c3: V2; r: number };
  tail?: Tail;
}

// ——— 3/4 的过渡 ———
const ROW_Y0 = -50;
const ROW_Y1 = 44;
const ROW_DY = 2;
const ROWS: [V2, V2][] = Array.from({ length: (ROW_Y1 - ROW_Y0) / ROW_DY + 1 }, (_, i) => {
  const y = ROW_Y0 + i * ROW_DY;
  return [rowSpan(FACE_TURN[0], y) as V2, rowSpan(FACE_TURN[1], y) as V2];
});
function rowAt(y: number): [V2, V2] {
  const t = Math.max(0, Math.min(ROWS.length - 1.0001, (y - ROW_Y0) / ROW_DY));
  const i = Math.floor(t);
  const k = t - i;
  const [a, b] = ROWS[i];
  const [c, d] = ROWS[i + 1];
  return [
    [lerp(a[0], c[0], k), lerp(a[1], c[1], k)],
    [lerp(b[0], d[0], k), lerp(b[1], d[1], k)],
  ];
}
/** 脸里面那段中间往朝向那边多挪多少（眼睛、鼻子在 3/4 挤到朝向那边，刘海的中间跟着） */
const MID_SHIFT = 11;

/** 头发上的一点转到 3/4（uh：0 正面 → 1）：头的坐标 */
export function turnHair([x, y]: V2, uh: number, occiput = 0.5): V2 {
  if (uh <= 0) return [x, y];
  const [f, s] = rowAt(Math.max(ROW_Y0, Math.min(ROW_Y1, y)));
  const tl = lerp(f[0], s[0], uh);
  const tr = lerp(f[1], s[1], uh);
  // 脸的上沿往上一点（额头顶、头顶）中间多挪的量慢慢收掉：头顶还在后脑勺上面
  const midW = clamp01((y + 62) / 22);
  if (x < f[0]) return [tl + (x - f[0]) * lerp(1, 0.72, uh), y];
  if (x > f[1]) return [tr + (x - f[1]) * (1 + occiput * uh), y];
  const u = (x - f[0]) / (f[1] - f[0]);
  return [tl + u * (tr - tl) - MID_SHIFT * uh * midW * 4 * u * (1 - u), y];
}

// ——— 发型 ———
// 下面的点都是正面（头的坐标），顺时针；smoothPath：普通点是控制点（曲线过相邻两点的中点），带 1 的是尖角（曲线过它）
const CAP_SIDES: P[] = [[-40, 8, 1], [-46, -10], [-51, -33], [-46, -58], [-30, -74], [-6, -81], [19, -79], [40, -67], [51, -46], [53, -24], [48, -4], [41, 8, 1]];
const NAPE: P[] = [[40, 20], [30, 31], [12, 35], [-12, 35], [-30, 31], [-40, 20]];
/** 刘海那块的外沿（比后面那片往里收一点，盖住后面那片的边，外轮廓只有后面那片描一圈） */
const FRONT_SIDES: P[] = [[-40, 8, 1], [-45, -10], [-49, -33], [-44, -56], [-29, -71], [-6, -77], [19, -75], [38, -64], [48, -45], [50, -24], [46, -4], [41, 8, 1]];

const HAIR: Record<Exclude<HairStyle, "none">, HairDef> = {
  // 男人的侧分短发（周磊、大叔、路人）：头顶有点蓬，左边分缝，右边一片往右下梳、两绺发梢落在额头上，鬓角到耳朵上面
  short: {
    back: [...CAP_SIDES, ...NAPE],
    front: [
      [
        ...FRONT_SIDES,
        [37, 0], [37, -13],
        [35, -21, 1], [29, -27], [24, -31, 1], [21, -26], [17, -23, 1], [12, -30], [4, -35], [-3, -39], [-9, -45, 1],
        [-14, -40], [-21, -37], [-27, -34, 1], [-31, -35], [-36, -27], [-38, -14], [-37, 0],
      ],
    ],
    lines: {
      front: [
        [[-9, -44], [-8, -53], [-5, -63], [0, -70]],
        [[17, -25], [15, -37], [9, -51], [1, -62]],
        [[34, -23], [33, -36], [27, -50], [18, -61]],
        [[-27, -35], [-30, -44], [-31, -53]],
      ],
    },
    occiput: 0.38,
  },
  // 小孩（小石头）：毛茸茸的圆头，刘海一撮一撮，头顶一根翘起来的呆毛，耳朵上面两边各翘一小撮
  kid: {
    back: [
      [-40, 12, 1], [-48, 2], [-56, -10, 1], [-55, -24], [-56, -50], [-42, -72], [-18, -85],
      [-4, -87], [2, -95], [12, -103, 1], [9, -94], [9, -87],
      [18, -86], [40, -76], [54, -56], [57, -30], [58, -12, 1], [51, 0], [42, 12, 1],
      [40, 24], [30, 34], [10, 38], [-10, 38], [-30, 34], [-40, 24],
    ],
    front: [
      [
        [-40, 12, 1], [-48, 2], [-53, -22], [-53, -49], [-41, -69], [-17, -81], [14, -81], [40, -70], [54, -49], [55, -24], [50, -2], [42, 12, 1],
        [38, 2], [38, -10], [37, -17, 1], [34, -24], [30, -30, 1], [27, -24], [22, -19, 1], [19, -27], [15, -33, 1], [10, -25], [4, -18, 1],
        [1, -26], [-3, -30, 1], [-8, -22], [-15, -16, 1], [-17, -25], [-21, -31, 1], [-26, -25], [-33, -21, 1], [-34, -28], [-37, -31, 1], [-39, -20], [-41, -12, 1], [-38, 0],
      ],
    ],
    lines: {
      front: [
        [[30, -29], [28, -40], [23, -50]],
        [[15, -32], [13, -44], [8, -54]],
        [[-3, -29], [-5, -41], [-9, -52]],
        [[-21, -30], [-24, -41], [-28, -50]],
      ],
    },
    occiput: 0.42,
  },
  // 年轻人的中分（年轻人）：头顶蓬一点，正中分开，两片往两边弯下来、发梢停在太阳穴
  curtain: {
    back: [[-40, 8, 1], [-46, -10], [-53, -33], [-50, -62], [-31, -80], [-6, -88], [20, -86], [43, -72], [53, -47], [55, -24], [48, -4], [41, 8, 1], ...NAPE],
    front: [
      [
        [-40, 8, 1], [-45, -10], [-51, -33], [-48, -60], [-30, -77], [-6, -84], [20, -82], [41, -69], [50, -46], [52, -24], [46, -4], [41, 8, 1],
        [38, 0], [38, -10], [36, -16, 1], [33, -19], [27, -21], [18, -25], [9, -32], [3, -42], [0, -52, 1],
        [-4, -42], [-10, -32], [-19, -25], [-28, -21], [-34, -19], [-37, -16, 1], [-38, -10], [-38, 0],
      ],
    ],
    lines: {
      front: [
        [[35, -18], [34, -34], [26, -52], [12, -66]],
        [[-36, -18], [-35, -34], [-28, -52], [-15, -66]],
        [[0, -51], [-1, -62], [-3, -76]],
        [[18, -26], [16, -42], [9, -58]],
        [[-19, -26], [-17, -42], [-11, -58]],
      ],
    },
    occiput: 0.4,
  },
  // 齐耳短发（七岁的她、路人）：齐刘海（两道细缝），两边垂到下巴、发梢往里收，后面一圈到下巴
  bob: {
    back: [
      [-50, 48], [-60, 28], [-62, -2], [-60, -32], [-50, -60], [-28, -78], [0, -82], [28, -78], [50, -60], [60, -32], [62, -2], [60, 28], [52, 48],
      [45, 56, 1], [34, 52], [24, 57, 1], [12, 53], [0, 58, 1], [-12, 53], [-24, 57, 1], [-34, 52], [-45, 56, 1],
    ],
    front: [
      [
        [-38, 46, 1], [-47, 40], [-54, 20], [-56, -10], [-54, -36], [-44, -58], [-22, -72], [0, -76], [22, -72], [44, -58], [54, -36], [56, -10], [54, 20], [47, 40],
        [38, 46, 1], [36, 30], [37, 10], [40, -4], [38, -8, 1],
        [16, -8, 1], [14, -22, 1], [12, -9, 1], [-10, -9, 1], [-12, -24, 1], [-14, -8, 1],
        [-38, -8, 1], [-40, -4], [-37, 10], [-36, 30],
      ],
    ],
    lines: {
      back: [
        [[24, 56], [26, 44], [28, 34]],
        [[-24, 56], [-26, 44], [-28, 34]],
        [[0, 57], [0, 46]],
      ],
      front: [
        [[38, 45], [41, 34], [44, 22]],
        [[-38, 45], [-41, 34], [-44, 22]],
      ],
    },
    pivot: 10,
    float: 70,
    occiput: 0.45,
  },
  // 侧分的齐耳短发（千斤）：右边分缝，刘海斜着往左下梳、压到左边眉梢，右边别在耳朵上面露出额头；发卡别住左边那片
  sidebob: {
    back: [
      [-50, 48], [-60, 28], [-62, -2], [-60, -32], [-50, -60], [-28, -78], [0, -82], [28, -78], [50, -60], [60, -32], [62, -2], [60, 28], [52, 48],
      [45, 56, 1], [34, 52], [24, 57, 1], [12, 53], [0, 58, 1], [-12, 53], [-24, 57, 1], [-34, 52], [-45, 56, 1],
    ],
    front: [
      [
        [-38, 46, 1], [-47, 40], [-54, 20], [-56, -10], [-54, -36], [-44, -58], [-22, -72], [0, -76], [22, -72], [44, -58], [54, -36], [56, -10], [54, 20], [47, 40],
        [38, 46, 1], [36, 30], [37, 10], [40, -6], [38, -22], [31, -34], [21, -43, 1],
        [14, -37], [5, -30], [-6, -24], [-17, -20], [-27, -16], [-34, -11, 1],
        [-31, -16], [-33, -10], [-39, -4, 1], [-38, 10], [-36, 30],
      ],
    ],
    lines: {
      back: [
        [[24, 56], [26, 44], [28, 34]],
        [[-24, 56], [-26, 44], [-28, 34]],
      ],
      front: [
        [[-33, -12], [-22, -24], [-8, -36], [8, -46]],
        [[-14, -22], [-2, -34], [12, -44], [22, -52]],
        [[38, 45], [41, 34], [44, 22]],
        [[-38, 45], [-41, 34], [-44, 22]],
      ],
    },
    pivot: 10,
    float: 70,
    occiput: 0.45,
  },
  // 盘发（千斤的妈妈、老太太）：往后梳得服服帖帖，额头露出来，几道梳子印往后脑勺收，头顶后面一个圆髻
  bun: {
    back: [[-40, 8, 1], [-46, -10], [-50, -32], [-46, -56], [-30, -71], [-6, -77], [18, -76], [38, -65], [49, -46], [51, -24], [46, -4], [41, 8, 1], ...NAPE],
    front: [
      [
        [-40, 8, 1], [-45, -10], [-48, -32], [-44, -54], [-29, -68], [-6, -74], [18, -73], [37, -63], [47, -45], [49, -24], [45, -4], [41, 8, 1],
        [38, -2], [36, -17], [30, -31], [17, -39], [0, -42], [-17, -39], [-30, -31], [-36, -17], [-38, -2],
      ],
    ],
    lines: {
      front: [
        [[0, -43], [3, -56], [9, -68]],
        [[-17, -40], [-14, -55], [-4, -67]],
        [[17, -40], [21, -53], [22, -65]],
        [[-31, -31], [-34, -45], [-27, -59]],
        [[31, -31], [35, -44], [34, -56]],
      ],
    },
    bun: { c: [17, -82], c3: [46, -66], r: 18 },
    occiput: 0.5,
  },
  // 长直发（秤砣的妈妈、路人）：中分，两边一缕垂到胸口，后面披到背上，发梢分成几绺
  long: {
    back: [
      [-62, 118], [-70, 20], [-66, -34], [-48, -66], [-12, -80], [22, -79], [52, -64], [68, -30], [72, 22], [64, 118],
      [60, 134, 1], [50, 126], [38, 138, 1], [26, 128], [14, 140, 1], [0, 130], [-14, 140, 1], [-26, 128], [-38, 138, 1], [-50, 126], [-58, 134, 1],
    ],
    front: [
      [[-44, 76, 1], [-53, 40], [-56, -20], [-44, -58], [-12, -72], [0, -60, 1], [-8, -42], [-25, -26], [-39, -6], [-42, 30], [-39, 60], [-36, 78, 1], [-40, 70]],
      [[44, 76, 1], [40, 70], [36, 78, 1], [39, 60], [42, 30], [39, -6], [25, -26], [8, -42], [0, -60, 1], [12, -72], [44, -58], [56, -20], [53, 40]],
    ],
    lines: {
      back: [
        [[38, 137], [40, 118], [42, 100]],
        [[-38, 137], [-40, 118], [-42, 100]],
        [[14, 139], [14, 118], [12, 104]],
        [[-14, 139], [-14, 118], [-12, 104]],
      ],
      front: [
        [[-40, 72], [-44, 50], [-46, 26]],
        [[40, 72], [44, 50], [46, 26]],
        [[-2, -58], [-12, -64], [-26, -66]],
        [[2, -58], [12, -64], [26, -66]],
      ],
    },
    pivot: 6,
    float: 150,
    occiput: 0.3,
  },
  // 低马尾（小石头的妈妈）：左边分缝，刘海往右扫到太阳穴，其余往后梳，脑后低低扎一把垂到肩上
  ponytail: {
    back: [...CAP_SIDES, ...NAPE],
    front: [
      [
        ...FRONT_SIDES,
        [38, -2], [37, -14], [33, -21, 1], [25, -25], [14, -31], [3, -37], [-8, -43], [-17, -48, 1],
        [-24, -41], [-31, -33], [-36, -19], [-38, -2],
      ],
    ],
    lines: {
      front: [
        [[33, -22], [28, -36], [16, -50], [2, -60]],
        [[18, -30], [10, -44], [-2, -56]],
        [[-17, -47], [-16, -58], [-12, -68]],
        [[-30, -34], [-34, -46], [-30, -58]],
      ],
    },
    tail: { root: [34, 10], root3: [44, 6], len: 92, w: 15, hang: 0.25 },
    occiput: 0.5,
  },
  // 高马尾（扎马尾的女学生）：一排碎刘海，耳朵前面两缕碎发，头顶后面高高扎一把
  highpony: {
    back: [...CAP_SIDES, ...NAPE],
    front: [
      [
        ...FRONT_SIDES,
        [38, -2], [38, -12], [36, -15, 1], [33, -23], [28, -27, 1], [25, -20], [20, -13, 1], [17, -23], [12, -28, 1], [8, -19], [3, -11, 1],
        [0, -21], [-4, -27, 1], [-9, -19], [-15, -12, 1], [-17, -22], [-21, -28, 1], [-26, -21], [-31, -15, 1], [-34, -22], [-37, -17, 1], [-38, -10], [-38, -2],
      ],
      [[-40, -6, 1], [-44, 4], [-44, 16], [-41, 24, 1], [-39, 12], [-38, 0]],
      [[40, -6, 1], [38, 0], [39, 12], [41, 24, 1], [44, 16], [44, 4]],
    ],
    lines: {
      front: [
        [[20, -14], [19, -30], [15, -46]],
        [[3, -12], [2, -28], [-1, -46]],
        [[-15, -13], [-16, -29], [-14, -46]],
      ],
    },
    tail: { root: [33, -70], root3: [46, -58], len: 112, w: 18, hang: -1.05, stiff: 0.5 },
    occiput: 0.5,
  },
  // 老钟：头顶秃了，耳朵上面、后脑勺一圈贴着头皮的白头发，两鬓翘出几小撮
  receding: {
    back: [
      [-40, 12, 1], [-45, 8], [-48, 2], [-47, -4], [-50, -9], [-49, -16], [-50, -22], [-46, -28], [-41, -34, 1], [-37, -12],
      [-30, 30], [0, 37], [30, 30],
      [37, -12], [41, -34, 1], [46, -28], [50, -22], [49, -16], [50, -9], [47, -4], [48, 2], [45, 8], [40, 12, 1],
    ],
    front: [
      [[-39, 6, 1], [-44, 3], [-47, -2], [-46, -6], [-48, -11], [-47, -17], [-48, -22], [-45, -27], [-41, -31, 1], [-39, -20], [-38, -8], [-38, 0]],
      [[39, 6, 1], [38, 0], [38, -8], [39, -20], [41, -31, 1], [45, -27], [48, -22], [47, -17], [48, -11], [46, -6], [47, -2], [44, 3]],
    ],
    lines: {
      front: [
        [[-47, -20], [-43, -19], [-40, -17]],
        [[-46, -6], [-43, -6], [-40, -5]],
        [[47, -20], [43, -19], [40, -17]],
        [[46, -6], [43, -6], [40, -5]],
      ],
    },
    occiput: 0.7,
  },
};

// ——— 受力 ———
/** 受力朝上的程度（0 垂着 → 1 失重漂起来） */
function upness(field: V2) {
  const fl = Math.hypot(field[0], field[1]) || 1;
  return clamp01((-field[1] / fl + 0.2) / 1.0);
}

/** 垂着、被风吹的头发：pivot 以下的点绕 (0, pivot) 往受力的左右方向转，越往下转得越多 */
function flowHair(pts: P[], field: V2, pivot: number | undefined, t: number): P[] {
  if (pivot === undefined) return pts;
  const side = Math.max(-1.3, Math.min(1.3, Math.atan2(-field[0], Math.max(0.25, Math.abs(field[1])))));
  return pts.map((p) => {
    const d = p[1] - pivot;
    if (d <= 0) return p;
    const w = clamp01(d / 110);
    const wob = 0.06 * loopSin(t, 3, p[0] * 0.05 + d * 0.02) * w * Math.min(1, Math.abs(field[0]) + 0.2);
    const q = rotateV([p[0], d], side * w * 0.8 + wob);
    return [q[0], pivot + q[1], p[2]] as P;
  });
}

/** 漂起来的头发：从头顶一圈长出一缕一缕，往外、往上漾（像在水里） */
function floatLocks(map: (p: V2) => V2, uh: number, length: number, t: number, field: V2): Path2D[] {
  const out: Path2D[] = [];
  const N = 9;
  const wind = Math.max(-1, Math.min(1, field[0]));
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1);
    const th = -Math.PI * (0.06 + 0.88 * k);
    const root: V2 = [Math.cos(th) * 50 + uh * 8, -18 + Math.sin(th) * 50];
    const out0: V2 = [Math.cos(th), Math.sin(th)];
    const dir0: V2 = [out0[0] * 0.75 + wind * 0.4, out0[1] * 0.4 - 1];
    const dl = Math.hypot(dir0[0], dir0[1]);
    const dir: V2 = [dir0[0] / dl, dir0[1] / dl];
    const L = length * (0.62 + 0.2 * Math.sin(i * 2.3 + 1)) * (1 - 0.35 * Math.abs(2 * k - 1));
    const left: V2[] = [];
    const right: V2[] = [];
    const M = 10;
    for (let j = 0; j <= M; j++) {
      const u = j / M;
      const sway = Math.sin(u * Math.PI) * 10 * Math.sin(t * 1.3 + i * 1.7) + u * u * 14 * Math.sin(t * 0.9 + i);
      const c: V2 = [root[0] + dir[0] * L * u - dir[1] * sway, root[1] + dir[1] * L * u + dir[0] * sway];
      const w = 22 * (1 - u * 0.8) * (1 - 0.3 * u * u) + 3;
      left.push([c[0] - dir[1] * w, c[1] + dir[0] * w]);
      right.push([c[0] + dir[1] * w, c[1] - dir[0] * w]);
    }
    out.push(smoothPath([...left, ...right.reverse()].map((p) => [...map(p)] as P)));
  }
  return out;
}

/** 马尾：从发根一段一段垂下来，转向受力的方向，越往下越细，发梢分成两绺 */
function tailPath(tail: Tail, uh: number, field: V2, t: number, map: (p: V2) => V2): { path: Path2D; root: V2; dir: V2 } {
  const root: V2 = [lerp(tail.root[0], tail.root3[0], uh), lerp(tail.root[1], tail.root3[1], uh)];
  const N = 10;
  const seg = tail.len / N;
  const phi = Math.atan2(-field[0], field[1]);
  let a = tail.hang * (1 - clamp01(Math.abs(field[0]) * 0.6));
  const c: V2[] = [root];
  const angs: number[] = [];
  for (let i = 0; i < N; i++) {
    const k = (0.25 + 0.06 * i) * (1 - (tail.stiff ?? 0) * Math.max(0, 1 - i / 4));
    const d = Math.atan2(Math.sin(phi - a), Math.cos(phi - a));
    const upK = clamp01(-field[1] / (Math.hypot(field[0], field[1]) || 1) + 0.2);
    a += k * d + (0.05 + 0.16 * upK) * loopSin(t, 2, i * 0.6) * Math.min(1, Math.abs(field[0]) + 0.3 + upK) + upK * 0.09 * Math.sin(i * 0.9);
    angs.push(a);
    const p = c[c.length - 1];
    c.push([p[0] - Math.sin(a) * seg, p[1] + Math.cos(a) * seg]);
  }
  const L: P[] = [];
  const R: P[] = [];
  c.forEach((p, i) => {
    const a0 = angs[Math.min(i, N - 1)];
    const u = i / N;
    const w = tail.w * (1 - 0.75 * u) * (0.9 + 0.25 * Math.sin(Math.PI * Math.min(1, u * 1.6)));
    const n: V2 = [Math.cos(a0), Math.sin(a0)];
    L.push([p[0] - n[0] * w, p[1] - n[1] * w]);
    R.push([p[0] + n[0] * w, p[1] + n[1] * w]);
  });
  // 发梢：两绺尖，中间往上分开一道 V
  const end = c[N];
  const aN = angs[N - 1];
  const dir: V2 = [-Math.sin(aN), Math.cos(aN)];
  const n: V2 = [Math.cos(aN), Math.sin(aN)];
  const tipL: P = [end[0] - n[0] * 4 + dir[0] * 10, end[1] - n[1] * 4 + dir[1] * 10, 1];
  const tipR: P = [end[0] + n[0] * 3 + dir[0] * 4, end[1] + n[1] * 3 + dir[1] * 4, 1];
  const notch: P = [end[0] - dir[0] * 6, end[1] - dir[1] * 6, 1];
  const pts: P[] = [[root[0] - n[0] * 2, root[1] - 6, 1], ...L.slice(0, N), tipL, notch, tipR, ...R.slice(0, N).reverse()];
  return { path: smoothPath(pts.map(([x, y, k]) => [...map([x, y]), ...(k ? [k] : [])] as P)), root, dir };
}

/** 一道由粗到细的发丝线：第一个点粗 */
function strand(ctx: CanvasRenderingContext2D, pts: V2[], ink: Ink, map: (p: V2) => V2, w = 0.36) {
  const m = pts.map(map);
  const widths = m.map((_, j) => ink.lw * (w - (w - 0.05) * (j / (m.length - 1))));
  ctx.fillStyle = ink.line;
  ctx.fill(smoothPath(ribbonPts(m, widths, 0.4)));
}

/** 画面上这个头大不大（每个单位多少像素）：太小时细节（发丝线）不画 */
export function pxPerUnit(ctx: CanvasRenderingContext2D) {
  const m = ctx.getTransform();
  return Math.hypot(m.a, m.b);
}

export interface HairPaint {
  style: HairStyle;
  color: string;
  shade: string;
  /** 皮筋、发簪的颜色 */
  tie?: string;
}

const turned = (pts: P[], uh: number, occ: number): P[] => pts.map((p) => [...turnHair([p[0], p[1]], uh, occ), ...(p[2] ? [p[2]] : [])] as P);

/** 后面的头发（Look.backHair） */
export function drawBackHair(ctx: CanvasRenderingContext2D, rig: Rig, ink: Ink, hp: HairPaint) {
  if (hp.style === "none") return;
  const hair = HAIR[hp.style];
  const { head, thh, field, pose } = rig;
  const uh = clamp01(-thh / 0.62);
  const f = rotateV(field, -head.a);
  const up = hair.pivot === undefined ? 0 : upness(f);
  const occ = hair.occiput ?? 0.5;
  const map = (p: V2) => head.p(p[0], p[1]);
  const fine = pxPerUnit(ctx) * 130 > 60;
  // 马尾、髻画在最后面
  if (hair.tail) {
    const tl = tailPath(hair.tail, uh, f, pose.t, map);
    drawPart(ctx, tl.path, hp.color, hp.shade, ink, ink.lw * 0.9);
  }
  if (hair.bun) {
    const c = lerpV2(hair.bun.c, hair.bun.c3, uh);
    const r = hair.bun.r;
    const bun = new Path2D();
    const o = map(c);
    bun.ellipse(o[0], o[1], r, r * 0.92, head.a, 0, Math.PI * 2);
    drawPart(ctx, bun, hp.color, hp.shade, ink, ink.lw * 0.9);
    if (hp.tie) {
      // 发簪：斜着穿过髻，一头一颗珠子
      const a = map([c[0] - r * 1.25, c[1] + r * 0.55]);
      const b = map([c[0] + r * 1.2, c[1] - r * 0.6]);
      ctx.strokeStyle = ink.line;
      ctx.lineCap = "round";
      ctx.lineWidth = ink.lw * 1.5;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
      ctx.strokeStyle = "#c9a45c";
      ctx.lineWidth = ink.lw * 0.7;
      ctx.stroke();
      const bead = new Path2D();
      bead.arc(b[0], b[1], 3.6, 0, Math.PI * 2);
      drawPart(ctx, bead, hp.tie, null, ink, ink.lw * 0.45);
    }
    if (fine) {
      // 髻上绕的一道
      ctx.save();
      ctx.clip(bun);
      ctx.strokeStyle = ink.line;
      ctx.lineWidth = ink.lw * 0.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let i = 0; i <= 14; i++) {
        const a = -2.4 + i * 0.3;
        const rr = r * (0.82 - i * 0.035);
        const q = map([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr * 0.9]);
        if (i) ctx.lineTo(q[0], q[1]);
        else ctx.moveTo(q[0], q[1]);
      }
      ctx.stroke();
      ctx.restore();
    }
  }
  // 垂着的一整片和漂起来的一缕一缕之间交叉淡入淡出
  const aDown = 1 - clamp01((up - 0.35) / 0.3);
  if (aDown > 0) {
    const pts = flowHair(turned(hair.back, uh, occ), f, hair.pivot, pose.t);
    const path = smoothPath(pts.map(([x, y, c]) => [...map([x, y]), ...(c ? [c] : [])] as P));
    ctx.save();
    ctx.globalAlpha *= aDown;
    drawPart(ctx, path, hp.color, hp.shade, ink, ink.lw * 0.9);
    if (fine && hair.lines?.back) {
      ctx.save();
      ctx.clip(path);
      for (const l of hair.lines.back) {
        const q = flowHair(turned(l as P[], uh, occ), f, hair.pivot, pose.t);
        strand(ctx, q.map((p) => [p[0], p[1]] as V2), ink, map);
      }
      ctx.restore();
    }
    ctx.restore();
  }
  // 马尾的皮筋压在后面那片头发上（正面时被头、刘海挡住）
  if (hair.tail && hp.tie) {
    const root = lerpV2(hair.tail.root, hair.tail.root3, uh);
    const o = map([root[0], root[1] + 2]);
    const band = new Path2D();
    band.ellipse(o[0], o[1], hair.tail.w * 0.62, 4.2, head.a + 0.25, 0, Math.PI * 2);
    drawPart(ctx, band, hp.tie, null, ink, ink.lw * 0.6);
  }
  if (aDown < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - aDown;
    const locks = floatLocks(map, uh, hair.float ?? 120, pose.t, f);
    ctx.strokeStyle = ink.line;
    ctx.lineWidth = ink.lw * 1.8;
    ctx.lineJoin = "round";
    for (const l of locks) ctx.stroke(l);
    for (const l of locks) fillShaded(ctx, l, hp.color, hp.shade, ink);
    // 头顶那一层还在
    const cap = smoothPath(turned([...CAP_SIDES, ...NAPE], uh, occ).map(([x, y, c]) => [...map([x * 1.04, y]), ...(c ? [c] : [])] as P));
    drawPart(ctx, cap, hp.color, hp.shade, ink, ink.lw * 0.9);
    ctx.restore();
  }
}

/** 刘海、鬓角（Look.frontHair），再画马尾的皮筋 */
export function drawFrontHair(ctx: CanvasRenderingContext2D, h: HeadView, ink: Ink, hp: HairPaint) {
  if (hp.style === "none") return;
  const hair = HAIR[hp.style];
  const f = rotateV(h.rig.field, -h.rig.head.a);
  const up = hair.pivot === undefined ? 0 : upness(f);
  const uh = clamp01(h.uh);
  const occ = hair.occiput ?? 0.5;
  const map = (p: V2) => h.H(p[0], p[1]);
  const fine = pxPerUnit(ctx) * 130 > 60;
  const paths: Path2D[] = [];
  for (const part of hair.front) {
    const flowed = flowHair(turned(part, uh, occ), f, hair.pivot, h.rig.pose.t);
    // 漂起来时垂在脸边的那缕往外、往上翻（绕它的上端转）
    const pts =
      up > 0 && hair.pivot !== undefined
        ? flowed.map((p) => {
            const d = p[1] - hair.pivot!;
            if (d <= 0) return p;
            const s = p[0] < 0 ? -1 : 1;
            const q = rotateV([p[0] - s * 44, d], -s * up * 2.2 * clamp01(d / 60));
            return [s * 44 + q[0], hair.pivot! + q[1], p[2]] as P;
          })
        : flowed;
    const path = smoothPath(pts.map(([x, y, c]) => [...map([x, y]), ...(c ? [c] : [])] as P));
    fillShaded(ctx, path, hp.color, null, ink);
    h.strokeOnSkin(path, []);
    paths.push(path);
  }
  if (fine && hair.lines?.front && up < 0.3) {
    ctx.save();
    const clip = new Path2D();
    for (const p of paths) clip.addPath(p);
    ctx.clip(clip);
    for (const l of hair.lines.front) {
      const q = flowHair(turned(l as P[], uh, occ), f, hair.pivot, h.rig.pose.t);
      strand(ctx, q.map((p) => [p[0], p[1]] as V2), ink, map);
    }
    ctx.restore();
  }
}

function lerpV2(a: V2, b: V2, t: number): V2 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

export const HAIR_STYLES = Object.keys(HAIR) as Exclude<HairStyle, "none">[];
/** 这个发型有没有披下来、能飘起来的部分 */
export const hairFloats = (style: HairStyle) => style !== "none" && HAIR[style].pivot !== undefined;
