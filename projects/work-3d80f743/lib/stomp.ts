// 五① 最后一句「在这反乌托邦里」（129.87 起，唱得轻、慢；134.02 尾奏进来）：
// 从白的边上的她切回街上：他站在她的铁靴里，把「沉沉，明天见」举着，仰着头。他把砖放下来抱在胸口，低头看着脚上她的铁靴，咬住嘴唇；
// 抬起远处那只铁靴（铁的、沉，腿直着从胯那儿一点点抬，身子往后仰着压住），憋住——134.02 全片最重的一下跺下去：镜头猛地一震、
// 画面一亮，街面以铁靴为中心陷下去一个大坑，裂缝在街上、楼脚的墙上一路裂开，碎块和灰扑起来，一圈震波荡出去；镜头被这一下推开，
// 露出坑和裂缝。他从铁靴里飘出来（腿从靴筒里滑出来，两只铁靴留在坑里立着，插着「妈妈，明天见」的那只也在），把砖举过头顶，
// 这次脚跟离了地，飘起来去找她；镜头跟着他往上。
// 坐标是世界坐标；他、砖、铁靴在 lib/coatoff.ts、lib/boots5.ts，时刻在 lib/t51.ts。

import { seeded } from "@frame/engine/math";
import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { STONE_LAND_X, stoneC4 } from "./coatoff";
import { STOMP_T } from "./t51";

type V2 = [number, number];
const T = STOMP_T;
export { STOMP_T };

/** 坑在哪：远处那只铁靴落下去的地方（铁靴底的中间），街面上 */
const CX = STONE_LAND_X - 32;
/** 坑有多大（街面是斜着看过去的，竖着压扁） */
const RX = 230;
const RY = 40;
/** 坑的中心比街面低一点（坑的后沿在墙根，前沿往镜头这边伸出来） */
const CY = 14;
/** 跺下去以后坑张开多少（0.06 秒张到底） */
const open = (t: number) => E.out(ph(t, T.stomp, T.stomp + 0.06));

/** 一条条裂缝：从坑边往外，街面上往左右、往镜头这边（竖着压扁），楼脚的墙上往上分叉；按种子一次算好折线 */
const CRACKS = (() => {
  const r = seeded(5101);
  const out: { pts: V2[]; wall: boolean; w: number }[] = [];
  const zig = (from: V2, dir: V2, len: number, squash: number, n: number): V2[] => {
    const pts: V2[] = [from];
    let [x, y] = from;
    for (let i = 1; i <= n; i++) {
      const step = len / n;
      const jx = (r() - 0.5) * step * 0.7;
      const jy = (r() - 0.5) * step * 0.7;
      x += dir[0] * step + jx * Math.abs(dir[1]);
      y += (dir[1] * step + jy * Math.abs(dir[0])) * squash;
      pts.push([x, y]);
    }
    return pts;
  };
  // 街面上：九条往四周（往后的那几条到墙根就停）
  for (let k = 0; k < 9; k++) {
    const a = Math.PI * (0.05 + (0.9 * k) / 8) + (r() - 0.5) * 0.2;
    const dir: V2 = [Math.cos(a) * (k % 2 ? 1 : -1), Math.sin(a)];
    const from: V2 = [CX + RX * 0.92 * dir[0], CY + RY * 0.92 * Math.abs(dir[1])];
    out.push({ pts: zig(from, [dir[0], Math.abs(dir[1])], 300 + r() * 420, 0.32, 7), wall: false, w: 1 - k * 0.04 });
  }
  // 楼脚的墙上：五条从坑的后沿往上裂，中途分个叉
  for (let k = 0; k < 5; k++) {
    const x0 = CX + (k - 2) * 95 + (r() - 0.5) * 40;
    const main = zig([x0, -8], [(r() - 0.5) * 0.5, -1], 260 + r() * 300, 1, 6);
    out.push({ pts: main, wall: true, w: 0.9 });
    const mid = main[3];
    out.push({ pts: zig(mid, [(r() < 0.5 ? -1 : 1) * 0.8, -0.6], 90 + r() * 120, 1, 3), wall: true, w: 0.6 });
  }
  return out;
})();
/** 碎块：跺下去那一下从坑边崩起来，转着落回坑的四周 */
const DEBRIS = (() => {
  const r = seeded(5102);
  return Array.from({ length: 22 }, () => {
    const a = Math.PI * (0.1 + 0.8 * r());
    return {
      x: CX + Math.cos(a) * RX * (0.5 + 0.4 * r()) * (r() < 0.5 ? 1 : -1),
      vx: (r() - 0.5) * 900,
      vy: -(500 + r() * 900),
      s: 7 + r() * 13,
      spin: (r() - 0.5) * 18,
      shade: r() < 0.5 ? "#9a8676" : "#b9a594",
    };
  });
})();

/** 画坑和裂缝（街面、墙上；人之前）：坑底一层深色、坑边一圈翻起来的亮边，裂缝深色描边、一侧亮边，跺下去以后 0.3 秒裂开 */
export function drawCrater(g: CanvasRenderingContext2D, t: number, z: number) {
  const k = open(t);
  if (k <= 0) return;
  const lw = 1 / Math.sqrt(Math.max(0.3, z));
  // 裂缝：长出来
  const grow = E.out(ph(t, T.stomp, T.stomp + 0.32));
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const c of CRACKS) {
    const n = c.pts.length - 1;
    const upto = grow * n;
    const path = new Path2D();
    path.moveTo(c.pts[0][0], c.pts[0][1]);
    for (let i = 1; i <= n; i++) {
      if (i - 1 > upto) break;
      const f = Math.min(1, upto - (i - 1));
      const [ax, ay] = c.pts[i - 1];
      const [bx, by] = c.pts[i];
      path.lineTo(ax + (bx - ax) * f, ay + (by - ay) * f);
    }
    g.strokeStyle = "rgba(255,240,220,0.55)";
    g.lineWidth = (c.wall ? 4 : 5) * c.w * lw;
    g.save();
    g.translate(2.5 * lw, 2.5 * lw);
    g.stroke(path);
    g.restore();
    g.strokeStyle = "#5a4640";
    g.lineWidth = (c.wall ? 3.4 : 4.4) * c.w * lw;
    g.stroke(path);
  }
  // 坑：深色的底、往下陷的阴影、一圈翻起来的亮边
  const rx = RX * k;
  const ry = RY * k;
  const pit = new Path2D();
  pit.ellipse(CX, CY, rx, ry, 0, 0, Math.PI * 2);
  const gr = g.createRadialGradient(CX, CY + ry * 0.2, 0, CX, CY, rx);
  gr.addColorStop(0, "#4a3a36");
  gr.addColorStop(0.7, "#6d5a52");
  gr.addColorStop(1, "#8d7a6c");
  g.fillStyle = gr;
  g.fill(pit);
  g.strokeStyle = "#3f322f";
  g.lineWidth = 3.4 * lw;
  g.stroke(pit);
  g.restore();
}
/** 坑的前沿（铁靴后画：靴底陷在坑里，前沿那一圈翻起来的边压在靴底前面） */
export function drawCraterFront(g: CanvasRenderingContext2D, t: number, z: number) {
  const k = open(t);
  if (k <= 0) return;
  const lw = 1 / Math.sqrt(Math.max(0.3, z));
  const rx = RX * k;
  const ry = RY * k;
  g.save();
  const lip = new Path2D();
  lip.ellipse(CX, CY, rx, ry, 0, 0.12 * Math.PI, 0.88 * Math.PI);
  lip.ellipse(CX, CY + 10, rx * 1.04, ry * 1.25, 0, 0.88 * Math.PI, 0.12 * Math.PI, true);
  lip.closePath();
  g.fillStyle = "#b8a391";
  g.fill(lip);
  g.strokeStyle = "#5a4640";
  g.lineWidth = 3 * lw;
  g.stroke(lip);
  g.restore();
}
/** 跺下去那一下扬起来的：碎块（转着崩起来、落回去）、灰（坑四周一团团往外散）、一圈震波（街面上荡出去） */
export function drawStompBurst(g: CanvasRenderingContext2D, t: number, z: number) {
  const d = t - T.stomp;
  if (d < 0 || d > 1.4) return;
  const lw = 1 / Math.sqrt(Math.max(0.3, z));
  g.save();
  // 震波：街面上一圈椭圆荡出去
  if (d < 0.45) {
    const u = d / 0.45;
    g.strokeStyle = `rgba(255,246,230,${0.7 * (1 - u)})`;
    g.lineWidth = (14 - 10 * u) * lw;
    g.beginPath();
    g.ellipse(CX, CY + 6, RX + 900 * E.out(u), RY + 160 * E.out(u), 0, 0, Math.PI * 2);
    g.stroke();
  }
  // 灰：一团团往外散、往上飘一点，越散越淡
  const u = Math.min(1, d / 1.2);
  const a = 0.6 * (1 - u) ** 1.3;
  g.fillStyle = `rgba(236,224,210,${a})`;
  for (const [dx, sz, kk] of [
    [-1, 1, 0],
    [1, 1.1, 1],
    [-0.55, 0.8, 2],
    [0.6, 0.85, 3],
    [-1.4, 0.65, 4],
    [1.45, 0.7, 5],
  ] as const) {
    g.beginPath();
    g.ellipse(CX + dx * (150 + 380 * E.out(u)), -30 - 90 * u - kk * 10, (110 + 170 * u) * sz, (50 + 70 * u) * sz, 0, 0, Math.PI * 2);
    g.fill();
  }
  // 碎块
  for (const p of DEBRIS) {
    const x = p.x + p.vx * d;
    const y = CY - 6 + p.vy * d + 0.5 * 3200 * d * d;
    if (y > CY + 30 && d > 0.15) continue;
    g.save();
    g.translate(x, y);
    g.rotate(p.spin * d);
    g.fillStyle = p.shade;
    g.strokeStyle = "#5a4640";
    g.lineWidth = 2.4 * lw;
    g.beginPath();
    g.moveTo(-p.s * 0.6, -p.s * 0.3);
    g.lineTo(p.s * 0.4, -p.s * 0.5);
    g.lineTo(p.s * 0.6, p.s * 0.35);
    g.lineTo(-p.s * 0.3, p.s * 0.5);
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();
  }
  g.restore();
}
/** 跺下去那一下画面一亮（给 drawAir 的 flash） */
export const stompFlash = (t: number) => 0.4 * kick(t, T.stomp, 0.1);
/** 跺下去那一下画面一震（像素） */
export const stompShake = (t: number) => 26 * kick(t, T.stomp, 0.12);

// ——— 镜头 ———
/** 手持呼吸：画面上约 3 像素 */
const breath = (t: number): V2 => [
  3 * (0.6 * Math.sin(t * 0.83) + 0.4 * Math.sin(t * 1.37 + 1.1)),
  3 * (0.6 * Math.sin(t * 0.71 + 2) + 0.4 * Math.sin(t * 1.19)),
];
/**
 * 五①的镜头：切过来是他举着砖站在铁靴里（1.8 倍，砖和脚底都在画面里）；放下砖、抬靴子时越憋越紧地慢慢推近、往下沉一点（2.2 倍）；
 * 134.02 跺下去那一下猛地一震、往里一顶，随即被推开（E.out，0.68 秒退到 0.85 倍）露出坑和裂缝；他飘起来以后跟着他往上（晚一点跟）
 */
export function cam51(t: number): Cam {
  const [bx, by] = breath(t);
  const s = stoneC4(Math.min(t, T.rise0));
  const z0 = 1.8;
  const a = aim(s.root[0] - 30 + bx / z0, s.root[1] - 215 + by / z0, 540, 1040, z0);
  const z1 = 2.2;
  const b = aim(s.root[0] - 40 + bx / z1, s.root[1] - 175 + by / z1, 540, 1060, z1);
  let c = camLerp(a, b, E.io(ph(t, T.start + 0.2, T.hold1)));
  // 被这一下推开：坑、裂缝、他和铁靴都在画面里
  const z2 = 0.85;
  const wide = aim(CX + 60 + bx / z2, -260 + by / z2, 540, 1180, z2);
  c = camLerp(c, wide, E.out(ph(t, T.stomp, T.stomp + 0.68)));
  // 飘起来：跟着他的胸口往上（只跟上去一半的高度，他在画面里慢慢往上走）
  const up = Math.max(0, t - T.rise0);
  if (up > 0) {
    const now = stoneC4(t);
    const lift = s.root[1] - now.root[1];
    c = { ...c, y: c.y - lift * 0.6 * E.io(Math.min(1, up / 0.6)) };
  }
  const kk = kick(t, T.stomp, 0.12);
  return { ...c, z: c.z * (1 + 0.06 * kk) };
}
