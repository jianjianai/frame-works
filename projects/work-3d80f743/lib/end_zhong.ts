// 终章的老钟和他家（第一幕同一条街，lib/dawn.ts 的 ZHONG_HOUSE；他一楼那扇窗就在小石头右边）：
// 天快亮他在屋里（窗里亮着灯，人不在窗前）；跺地那一下（109.02）窗玻璃震裂一道，他端着茶杯走到窗前；
// 静里（112.02）往外看：坑里站着小石头，穿着沉沉的铁靴——没有沉沉；明白过来，慢慢抬头看天。
// 「活」小石头从靴子里出来往上冲：他放下茶杯，推开窗，探出身子两只手攥住他的脚踝；被拽着往上，118.1 被拽出窗（之后在 lib/end_chain.ts 里吊着）。

import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type MoveKey, type PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { seeded } from "@frame/engine/math";
import { type Cam, E, ph, viewOf } from "./cam";
import { INK, addEllipse, drawGlow, drawTinted, part, rectPath } from "./world";
import { ARMS, live } from "./motion";
import { ZHONG_HOUSE } from "./dawn";
import { drawPerson } from "./people";
import { cupHold, drawHouse, drawHouseWindowFront } from "./props";
import { armL } from "./poses";
import { TE, type V2, mix } from "./end_t";
import { ZHONG } from "./end_poses";
import { kidAt } from "./end_pair";

export const OLD = CAST.老钟;
const WN = ZHONG_HOUSE.win;
/** 老钟在屋里站着时的根（窗台以下被墙挡住） */
export const ZHONG_IN: V2 = [WN.x + 10, -10];
/** 放下茶杯（窗台上） */
const CUP_DOWN = TE.zOpen - 0.16;

const KEYS: MoveKey[] = [
  { t: 111.6, x: 0, p: ZHONG.窗后 },
  { t: TE.zLook - 0.1, p: ZHONG.窗后 },
  { t: TE.zLook + 0.18, ease: "inOut", p: ZHONG.看 },
  { t: TE.zKnow - 0.05, p: ZHONG.看 },
  { t: TE.zKnow + 0.22, ease: "inOut", p: ZHONG.懂 },
  { t: TE.zUp - 0.05, p: ZHONG.懂 },
  { t: TE.zUp + 0.42, ease: "inOut", p: ZHONG.仰 },
  // 他从靴子里出来往上冲：一惊，放下茶杯，推开窗
  { t: TE.out1 + 0.1, p: ZHONG.仰 },
  { t: TE.out1 + 0.3, ease: "out", p: { ...ZHONG.看, expression: "吓一跳", neck: 10, lookY: -0.6 } },
  { t: CUP_DOWN, ease: "inOut", p: { ...ZHONG.看, expression: "吓一跳", neck: 10, lookY: -0.6, ...armL(10, 30, 0, "relax", 10) } },
  { t: TE.zOpen, ease: "inOut", p: ZHONG.推 },
  { t: TE.zOpen + 0.12, p: ZHONG.推 },
  // 探出窗口，两只手攥住他的脚踝；被拽着往上，咬着牙
  { t: TE.zGrab, ease: "out", p: ZHONG.扑 },
  { t: TE.zGrab + 0.3, ease: "inOut", p: ZHONG.拽 },
  { t: 125, p: ZHONG.拽 },
] as MoveKey[];
const move = live(KEYS, { look: lookOf(OLD), base: { wind: -0.6 }, idle: true, seed: 1131, springs: ARMS, follow: 0 });

export interface ZhongNow {
  pose: PoseIn;
  root: V2;
  /** 端不端着茶杯 */
  cup: boolean;
  /** 还在屋里（裁在窗里画）/ 探出窗外（窗台以上画在窗框前面） */
  where: "in" | "lean";
  /** 两扇玻璃窗推开了多少 */
  open: number;
}
/** 两只手心的中点落在他远处那只脚踝上时，老钟的根在哪（远处那只手攥脚踝、近处那只攥在下面一点） */
function reach(t: number, p: PoseIn): V2 {
  const a = kidAt(t).ankleR;
  const j = castJoints(OLD, p);
  return [a[0] + 4 - (j.palmL[0] + j.palmR[0]) / 2, a[1] + 12 - (j.palmL[1] + j.palmR[1]) / 2];
}
/** 扑出去那一下根往左挪到窗洞的左半边（脚还在屋里地上） */
let LUNGE: V2 | null = null;
export function zhongNow(t: number): ZhongNow {
  const p: PoseIn = { ...move(t).pose };
  const open = E.out(ph(t, TE.zOpen + 0.02, TE.zOpen + 0.26));
  const cup = t < CUP_DOWN;
  const where: ZhongNow["where"] = t < TE.zGrab - 0.18 ? "in" : "lean";
  let root: V2 = ZHONG_IN;
  if (t >= TE.zGrab - 0.2) {
    if (!LUNGE) LUNGE = [reach(TE.zGrab, move(TE.zGrab).pose)[0], ZHONG_IN[1]];
    root = mix(ZHONG_IN, LUNGE, E.io(ph(t, TE.zGrab - 0.2, TE.zGrab)));
  }
  if (t >= TE.zGrab) {
    // 攥住以后两只手跟着他的脚踝：他往上升就把老钟拽离地面，身子从窗台上被拖出去（脚出窗台以前，根不出窗洞）
    const want = reach(t, p);
    const y = Math.min(ZHONG_IN[1], want[1]);
    const out = E.io(ph(-y, 260, 380));
    const x = out * want[0] + (1 - out) * Math.max(want[0], WN.x - WN.w / 2 + 24);
    root = mix(root, [x, y], E.io(ph(t, TE.zGrab, TE.zGrab + 0.3)));
  }
  const sc = OLD.scale;
  const loc = (q: V2): V2 => [(q[0] - root[0]) / sc, (q[1] - root[1]) / sc];
  if (t >= TE.zGrab - 0.15) {
    // 两只手攥住他远处那只脚踝
    const a = kidAt(t).ankleR;
    const w = E.io(ph(t, TE.zGrab - 0.15, TE.zGrab));
    p.armR = { ...(p.armR as object), to: loc([a[0] + 6, a[1] + 4]), ik: w } as PoseIn["armR"];
    p.armL = { ...(p.armL as object), to: loc([a[0] + 2, a[1] + 20]), ik: w } as PoseIn["armL"];
  }
  return { pose: p, root, cup, where, open };
}

/** 窗玻璃上震出来的裂纹（左边那扇：坑在左边） */
const CRACK = (() => {
  const r = seeded(7311);
  const o: V2 = [WN.x - WN.w / 2 + 46, WN.sill - 70];
  const lines: V2[][] = [];
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI * (0.05 + (0.9 * k) / 6) + (r() - 0.5) * 0.3;
    const pts: V2[] = [o];
    let [x, y] = o;
    const len = 60 + r() * 120;
    for (let i = 0; i < 4; i++) {
      x += Math.cos(a) * (len / 4) + (r() - 0.5) * 12;
      y += Math.sin(a) * (len / 4) + (r() - 0.5) * 12;
      pts.push([x, y]);
    }
    lines.push(pts);
  }
  return { o, lines };
})();

// ——————————————— 屋里（用户 2026-10-25：「房子里装修漂亮点，重点是要有一个钟，这个钟跳动了两下」） ———————————————
/** 墙上那只钟：秒针每秒跳一下（跳的那一刻在 .40，TE.tick 的两下就在全曲最静的两秒里），跳过去冲一点再弹回来；下面挂着钟摆 */
const CLOCK: V2 = [WN.x + 104, -588];
const secondAngle = (t: number) => {
  const s = Math.floor(t - 0.4);
  const d = t - 0.4 - s;
  const kick = d < 0.25 ? Math.exp(-d / 0.05) * Math.sin(d * 60) * 0.06 : 0;
  return ((s % 60) / 60) * Math.PI * 2 + kick;
};
/** 窗洞里看得见的屋子：暖色的条纹墙纸、护墙板、壁灯、相框、木头挂钟、架子上的花和茶壶（画在老钟后面） */
function drawRoom(g: CanvasRenderingContext2D, t: number, lw: number) {
  const x0 = WN.x - WN.w / 2;
  const top = WN.top;
  const sill = WN.sill;
  g.save();
  g.beginPath();
  g.rect(x0, top, WN.w, sill - top);
  g.clip();
  // 墙纸：奶油色，细细的竖条纹，条纹之间一排小花
  const wall = g.createLinearGradient(0, top, 0, sill);
  wall.addColorStop(0, "#fbe6c2");
  wall.addColorStop(1, "#f1cf9e");
  g.fillStyle = wall;
  g.fillRect(x0, top, WN.w, sill - top);
  g.fillStyle = "rgba(214,150,110,0.16)";
  for (let x = x0 + 6; x < x0 + WN.w; x += 30) g.fillRect(x, top, 6, sill - top);
  g.fillStyle = "rgba(200,110,100,0.32)";
  for (let x = x0 + 21, i = 0; x < x0 + WN.w; x += 30, i++) {
    for (let y = top + 22 + (i % 2) * 22; y < sill - 70; y += 44) {
      g.beginPath();
      addEllipse(g, x, y, 3.2, 3.2);
      g.fill();
    }
  }
  // 护墙板（下面一截木头）和腰线
  part(g, rectPath(x0 - 10, sill - 70, WN.w + 20, 80), "#b98a63", "#a67b56", 2.2 * lw, [4, 3]);
  g.strokeStyle = "rgba(90,56,40,0.35)";
  g.lineWidth = 2 * lw;
  for (let x = x0 + 30; x < x0 + WN.w; x += 64) g.strokeRect(x, sill - 58, 46, 50);
  part(g, rectPath(x0 - 10, sill - 78, WN.w + 20, 10), "#8f6448", null, 2 * lw);
  // 左边一盏壁灯：暖光晕
  drawGlow(g, x0 + 34, top + 120, 120, 0.7);
  part(g, rectPath(x0 + 30, top + 96, 8, 22), "#7a5a44", null, 1.8 * lw);
  const sh = new Path2D();
  sh.moveTo(x0 + 18, top + 92);
  sh.lineTo(x0 + 50, top + 92);
  sh.lineTo(x0 + 44, top + 118);
  sh.lineTo(x0 + 24, top + 118);
  sh.closePath();
  part(g, sh, "#ffe6ae", "#f6d38c", 2 * lw, [2, 2]);
  // 相框：他和老伴年轻时候（两个小小的人影、一抹蓝天）
  const fx = x0 + 50;
  const fy = top + 150;
  part(g, rectPath(fx, fy, 50, 62), "#8a5c3e", null, 2.2 * lw);
  g.fillStyle = "#cfe0e6";
  g.fillRect(fx + 6, fy + 6, 38, 50);
  g.fillStyle = "#e9d7b8";
  g.fillRect(fx + 6, fy + 40, 38, 16);
  g.fillStyle = "#6a5a62";
  for (const [hx, hh] of [
    [fx + 18, 0],
    [fx + 32, 4],
  ] as const) {
    g.beginPath();
    addEllipse(g, hx, fy + 26 + hh, 5, 5);
    g.fill();
    g.fillRect(hx - 5, fy + 31 + hh, 10, 16 - hh);
  }
  // 架子：一瓶花、一把茶壶
  const shx = WN.x + 52;
  const shy = sill - 128;
  part(g, rectPath(shx, shy, 112, 10), "#9a6a4c", null, 2 * lw);
  part(g, rectPath(shx + 14, shy - 40, 22, 40), "#7f9fb8", "#6d8ca5", 2 * lw, [2, 2]);
  for (const [dx, dy, c] of [
    [-8, -50, "#e9877a"],
    [6, -58, "#f0c86e"],
    [16, -48, "#e9877a"],
  ] as const) {
    g.fillStyle = c;
    g.beginPath();
    addEllipse(g, shx + 25 + dx, shy + dy, 7, 7);
    g.fill();
  }
  g.strokeStyle = "#6f8f58";
  g.lineWidth = 2.4 * lw;
  g.beginPath();
  g.moveTo(shx + 25, shy - 40);
  g.lineTo(shx + 17, shy - 50);
  g.moveTo(shx + 25, shy - 40);
  g.lineTo(shx + 31, shy - 56);
  g.moveTo(shx + 25, shy - 40);
  g.lineTo(shx + 41, shy - 48);
  g.stroke();
  const pot = new Path2D();
  addEllipse(pot, shx + 76, shy - 18, 22, 17);
  part(g, pot, "#f3efe6", "#dcd5c8", 2 * lw, [2, 2]);
  g.strokeStyle = INK;
  g.lineWidth = 2.4 * lw;
  g.beginPath();
  g.moveTo(shx + 96, shy - 22);
  g.quadraticCurveTo(shx + 110, shy - 30, shx + 106, shy - 40);
  g.stroke();
  // 挂钟：木头钟壳，下面玻璃匣子里挂着铜钟摆
  const [cx, cy] = CLOCK;
  const box = rectPath(cx - 26, cy + 26, 52, 80);
  part(g, box, "#8a5c3e", "#764e34", 2.4 * lw, [3, 2]);
  g.fillStyle = "rgba(255,240,214,0.55)";
  g.fillRect(cx - 18, cy + 34, 36, 64);
  const sw = 0.22 * Math.sin(Math.PI * (t - 0.4));
  g.save();
  g.translate(cx, cy + 32);
  g.rotate(sw);
  g.strokeStyle = "#a07a3a";
  g.lineWidth = 2.6 * lw;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(0, 50);
  g.stroke();
  g.fillStyle = "#e0b45a";
  g.beginPath();
  addEllipse(g, 0, 54, 9, 9);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 1.6 * lw;
  g.stroke();
  g.restore();
  const face = new Path2D();
  addEllipse(face, cx, cy, 34, 34);
  part(g, face, "#8a5c3e", null, 2.6 * lw);
  const dial = new Path2D();
  addEllipse(dial, cx, cy, 27, 27);
  g.fillStyle = "#fbf4e4";
  g.fill(dial);
  g.strokeStyle = "rgba(46,37,48,0.75)";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = i % 3 === 0 ? 19 : 22;
    g.lineWidth = (i % 3 === 0 ? 2.6 : 1.4) * lw;
    g.beginPath();
    g.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0);
    g.lineTo(cx + Math.sin(a) * 25, cy - Math.cos(a) * 25);
    g.stroke();
  }
  // 六点二十：时针、分针；秒针（红的）每秒跳一下
  const hand = (a: number, len: number, w: number, c: string) => {
    g.strokeStyle = c;
    g.lineWidth = w * lw;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(cx - Math.sin(a) * len * 0.18, cy + Math.cos(a) * len * 0.18);
    g.lineTo(cx + Math.sin(a) * len, cy - Math.cos(a) * len);
    g.stroke();
  };
  hand(Math.PI * (6 + 20 / 60) / 6, 14, 3.4, INK);
  hand((20 / 60) * Math.PI * 2, 21, 2.4, INK);
  hand(secondAngle(t), 23, 1.4, "#c8443a");
  g.fillStyle = INK;
  g.beginPath();
  addEllipse(g, cx, cy, 2.6, 2.6);
  g.fill();
  g.restore();
}
/** 窗边两幅系起来的窗帘（老钟前面、玻璃后面） */
function drawCurtains(g: CanvasRenderingContext2D, lw: number) {
  const x0 = WN.x - WN.w / 2;
  const x1 = WN.x + WN.w / 2;
  for (const side of [-1, 1]) {
    const edge = side < 0 ? x0 : x1;
    const p = new Path2D();
    p.moveTo(edge, WN.top);
    p.lineTo(edge - side * 46, WN.top);
    p.quadraticCurveTo(edge - side * 30, WN.top + 120, edge - side * 16, WN.top + 190);
    p.quadraticCurveTo(edge - side * 34, WN.top + 260, edge - side * 30, WN.sill - 4);
    p.lineTo(edge, WN.sill - 4);
    p.closePath();
    part(g, p, "#e9a58d", "#d98f78", 2.2 * lw, [3, 2]);
    g.strokeStyle = "rgba(150,70,60,0.35)";
    g.lineWidth = 1.6 * lw;
    g.beginPath();
    g.moveTo(edge - side * 30, WN.top + 10);
    g.quadraticCurveTo(edge - side * 22, WN.top + 110, edge - side * 12, WN.top + 186);
    g.stroke();
    part(g, rectPath(edge - side * 26 - 8, WN.top + 184, 16, 10), "#c9a24f", null, 1.6 * lw);
  }
}

/** 两扇玻璃窗：关着时盖住窗洞（玻璃上一道斜的反光、跺地以后一圈裂纹），推开时往两边甩、窄成一条 */
function panes(g: CanvasRenderingContext2D, t: number, open: number, lw: number) {
  const x0 = WN.x - WN.w / 2;
  const x1 = WN.x + WN.w / 2;
  const top = WN.top;
  const sill = WN.sill;
  const half = WN.w / 2;
  const crack = E.out(ph(t, TE.stomp, TE.stomp + 0.08));
  for (const side of [-1, 1]) {
    const hinge = side < 0 ? x0 : x1;
    const w = half * (1 - 0.86 * open);
    const xa = side < 0 ? hinge : hinge - w;
    const p = rectPath(xa, top, w, sill - top);
    g.fillStyle = `rgba(196,214,226,${0.22 + 0.25 * open})`;
    g.fill(p);
    if (open < 0.05) {
      g.save();
      g.clip(p);
      g.fillStyle = "rgba(255,255,255,0.28)";
      g.beginPath();
      g.moveTo(xa + w * 0.2, sill);
      g.lineTo(xa + w * 0.55, top);
      g.lineTo(xa + w * 0.78, top);
      g.lineTo(xa + w * 0.43, sill);
      g.closePath();
      g.fill();
      if (side < 0 && crack > 0) {
        g.strokeStyle = "rgba(255,255,255,0.85)";
        g.lineWidth = 2.6 * lw;
        g.lineCap = "round";
        for (const ln of CRACK.lines) {
          g.beginPath();
          g.moveTo(ln[0][0], ln[0][1]);
          const n = ln.length - 1;
          for (let i = 1; i <= n; i++) {
            if (i - 1 > crack * n) break;
            const f = Math.min(1, crack * n - (i - 1));
            g.lineTo(ln[i - 1][0] + (ln[i][0] - ln[i - 1][0]) * f, ln[i - 1][1] + (ln[i][1] - ln[i - 1][1]) * f);
          }
          g.stroke();
        }
        g.strokeStyle = "rgba(80,90,110,0.55)";
        g.lineWidth = 1.2 * lw;
        for (const ln of CRACK.lines) {
          g.beginPath();
          g.moveTo(ln[0][0], ln[0][1]);
          for (let i = 1; i < ln.length; i++) g.lineTo(ln[i][0], ln[i][1]);
          if (crack > 0.99) g.stroke();
        }
      }
      g.restore();
    }
    g.strokeStyle = "#8f6f58";
    g.lineWidth = 9 * lw;
    g.strokeRect(xa, top, w, sill - top);
    g.strokeStyle = INK;
    g.lineWidth = 2.2 * lw;
    g.strokeRect(xa - 4.5 * lw, top - 4.5 * lw, w + 9 * lw, sill - top + 9 * lw);
  }
}
/** 窗台上放下的茶杯 */
function sillCup(g: CanvasRenderingContext2D, t: number) {
  if (t < CUP_DOWN + 0.05) return;
  const x = WN.x - WN.w / 2 + 60;
  const y = WN.sill + 12;
  const cup = new Path2D();
  cup.moveTo(x - 17, y - 38);
  cup.lineTo(x + 17, y - 38);
  cup.lineTo(x + 13, y);
  cup.quadraticCurveTo(x, y + 6, x - 13, y);
  cup.closePath();
  part(g, cup, "#f4f0e8", "#ddd6ca", 3, [3, 3]);
  part(g, rectPath(x - 16, y - 24, 32, 7), "#7aa0b8", null, 0);
}

/** 老钟家（人这一层，世界坐标）：墙、门、二楼的窗；一楼窗里亮着灯，老钟（112 以后）站在窗后，玻璃窗、窗框压在他前面；探出窗外时窗台以上的身子压在窗框前面 */
export function drawZhongHouse(g: CanvasRenderingContext2D, t: number, cam: Cam) {
  const H = ZHONG_HOUSE;
  const v = viewOf(cam, 1);
  if (H.x0 > v.x1 + 200 || H.x1 < v.x0 - 200 || v.y1 < H.top - 300 || v.y0 > 200) return;
  const lw = 1 / Math.sqrt(Math.max(0.3, cam.z));
  const here = t > 111.6 && t < TE.zOut;
  const z = here ? zhongNow(t) : null;
  const hold = z?.cup ? { hold: { L: cupHold } } : {};
  drawTinted(g, [H.x0 - 120, H.top - 260, H.x1 + 160, 60], (gg) => {
    drawHouse(gg, H, t);
    drawRoom(gg, t, lw);
    if (z && z.where === "in") {
      gg.save();
      gg.beginPath();
      gg.rect(WN.x - WN.w / 2, WN.top, WN.w, WN.sill - WN.top);
      gg.clip();
      drawPerson(gg, OLD, z.pose, z.root[0], z.root[1], cam.z, hold);
      gg.restore();
    }
    drawCurtains(gg, lw);
    panes(gg, t, z ? z.open : t >= TE.zOut ? 1 : 0, lw);
    drawHouseWindowFront(gg, H);
    sillCup(gg, t);
    if (z && z.where === "lean") {
      // 探出窗外：窗台以上的身子、手压在窗框、玻璃窗前面（窗台以下还被墙挡着）
      gg.save();
      gg.beginPath();
      gg.rect(H.x0 - 1200, H.top - 2400, H.x1 - H.x0 + 2400, WN.sill - (H.top - 2400));
      gg.clip();
      drawPerson(gg, OLD, z.pose, z.root[0], z.root[1], cam.z, hold);
      gg.restore();
    }
  });
}
