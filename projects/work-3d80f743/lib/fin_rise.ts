// 重做的四声「活下去」（113.88–129.87）里人链往上长：谁、什么时候抓上来、整条人链顶上（他）升到多高（作品时间）。
// 草稿的做法（3d80f743 的 chain.ts）：最下面那个人站在街上抓着上面那个人的脚踝，人链往上一提，他被拽离地面（鞋留在街上），
// 下一个人正好跑到跟前举起手抓住他的脚踝——一直从地面连到天上，126.05 最顶上的他抓住她的脚踝。
// 这里只有纯数字（不依赖画人的文件）：他的位置（lib/fin_cast.ts）、人链里每个人（lib/fin_chain.ts）都从这里取。

import { CAST, type CastSpec, passerby } from "@materials/剪纸角色/code/cast";
import { STUDENT, UNCLE } from "./saved";
import { T9 } from "./fin_t";

type V2 = [number, number];

export interface Member {
  spec: CastSpec;
  name: string;
  /** 吊着时朝哪（正数朝右）：跑过来的那一边 */
  face: number;
  /** 从哪跑来（根的 x）、从门里出来的话门在哪 */
  from: number;
  door?: number;
}
/** 人链里的人，从上往下（他在最上面，不在这张表里）：老钟、她救过的人（认得出的先来），再是这些年她白天送过砖、拽下来过的人 */
export const MEMBERS: Member[] = [
  { spec: CAST.老钟, name: "老钟", face: -0.6, from: -1545 },
  { spec: CAST.周磊, name: "周磊", face: -0.6, from: -520 },
  { spec: CAST.千斤, name: "千斤", face: 0.6, from: -3300 },
  { spec: CAST.阿满, name: "阿满", face: 0.6, from: -2390, door: -2390 },
  { spec: CAST.老太太, name: "老太太", face: 0.6, from: -3150 },
  { spec: CAST.年轻人, name: "年轻人", face: -0.6, from: -1015, door: -1015 },
  { spec: UNCLE, name: "戴眼镜的大叔", face: -0.6, from: -300 },
  { spec: STUDENT, name: "扎马尾的女学生", face: 0.6, from: -3500 },
  ...[3, 11, 20, 7, 15, 24, 9, 18].map((n, i): Member => ({ spec: passerby(n), name: `路人${n}`, face: i % 2 ? -0.6 : 0.6, from: i % 2 ? -400 - 80 * i : -3300 - 60 * i })),
];
/** 吊着时两只手举直，手心在根上方多高；远处那只脚踝在根上方多高（按各人的骨架量的：lib/fin_rise 的数在 node 里量过） */
const HAND_UP: Record<string, number> = { 老钟: 561, 周磊: 620, 千斤: 549, 阿满: 608, 老太太: 515, 年轻人: 597, 戴眼镜的大叔: 608, 扎马尾的女学生: 526 };
const ANKLE_UP: Record<string, number> = { 老钟: 61, 周磊: 67, 千斤: 60, 阿满: 66, 老太太: 56, 年轻人: 65, 戴眼镜的大叔: 66, 扎马尾的女学生: 57 };
export const handUp = (m: Member) => HAND_UP[m.name] ?? 575 * (m.spec.scale / 0.99);
export const ankleUp = (m: Member) => ANKLE_UP[m.name] ?? 63 * (m.spec.scale / 0.99);
/** 站在街上把手举直能够多高（手心） */
export const reachUp = (m: Member) => handUp(m) + 3;
/** 他（最上面）的脚踝在根上方多高 */
export const KID_ANKLE_UP = 39;

/** 第 k 个人（0 = 老钟）站在街上抓住上面那个人的脚踝那一刻，他（最顶上）的根离地多高 */
function topAtJoin(k: number): number {
  let h = reachUp(MEMBERS[k]);
  for (let j = 0; j < k; j++) h += handUp(MEMBERS[j]) - ankleUp(MEMBERS[j]);
  return h - KID_ANKLE_UP;
}
/** 抓她的脚踝时他的根离地多高（举起远处那只手够到她的脚踝） */
export const TOP_H = topAtJoin(MEMBERS.length - 1);

// ——— 他离地多高：速度曲线（柔和起步、越升越快、到她跟前慢下来）积出来 ———
/** 老钟扑出窗口抓住他时他的根离地多高；周磊抓住老钟时 */
export const H_GRAB = 500;
const H_JOIN0 = topAtJoin(1);
/** 速度（每秒）随时间：119.35 起 [时刻, 速度] 的分段三次曲线 */
const VK: [number, number][] = [
  [T9.join0, 520],
  [120.4, 980],
  [121.6, 1380],
  [124.6, 1360],
  [125.5, 820],
  [T9.ankle, 0],
];
let TABLE: { t0: number; dt: number; h: Float64Array } | null = null;
function table() {
  if (TABLE) return TABLE;
  const dt = 1 / 240;
  const n = Math.ceil((T9.ankle - T9.join0) / dt) + 2;
  const v = (t: number) => {
    for (let i = 1; i < VK.length; i++) {
      if (t <= VK[i][0]) {
        const [a, va] = VK[i - 1];
        const [b, vb] = VK[i];
        const u = (t - a) / (b - a);
        return va + (vb - va) * u * u * (3 - 2 * u);
      }
    }
    return 0;
  };
  // 先积出形状，再整体缩放到正好从 H_JOIN0 升到 TOP_H
  const raw = new Float64Array(n);
  for (let i = 1; i < n; i++) raw[i] = raw[i - 1] + v(T9.join0 + (i - 0.5) * dt) * dt;
  const k = (TOP_H - H_JOIN0) / raw[n - 1];
  const h = new Float64Array(n);
  for (let i = 0; i < n; i++) h[i] = H_JOIN0 + raw[i] * k;
  TABLE = { t0: T9.join0, dt, h };
  return TABLE;
}
/** 他的根离地多高（119.35–126.05：人链一个个接上，往上长） */
export function topH(t: number): number {
  const T = table();
  const f = (t - T.t0) / T.dt;
  if (f <= 0) return T.h[0];
  if (f >= T.h.length - 1) return T.h[T.h.length - 1];
  const i = Math.floor(f);
  return T.h[i] + (T.h[i + 1] - T.h[i]) * (f - i);
}
/** 第 k 个人抓上来的时刻（他的根正好升到 topAtJoin(k)） */
export const JOIN_T: number[] = MEMBERS.map((_, k) => {
  if (k === 0) return T9.zhongGrab;
  const want = topAtJoin(k);
  const T = table();
  for (let i = 0; i < T.h.length; i++) if (T.h[i] >= want) return T.t0 + i * T.dt;
  return T9.ankle;
});

// ——— 横着：人链最下面在老钟家窗口左边一点（周磊抓住老钟的地方），最上面跟着她 ———
export const BASE_X = -1720;
/** 第 k 个人在人链里横着在哪：从下面的 BASE_X 往上斜到顶上的 top（她底下），越高越靠近 top；一节节轻轻地晃 */
export function chainX(top: number, h: number, hTop: number, t: number, k: number) {
  const u = Math.max(0, Math.min(1, h / Math.max(1, hTop)));
  const sway = Math.sin(t * 0.8 + k * 0.55) * 30 * Math.min(1, h / 1500);
  return BASE_X + (top - BASE_X) * Math.pow(u, 1.6) + sway;
}
export type { V2 };
