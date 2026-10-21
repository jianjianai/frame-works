// 沉沉的屋子：全城最高那栋楼的顶层，最左那扇窗（第二幕⑨⑩ 在这里写砖，⑫ 脱靴飘到天花板的床上；副歌一从这扇窗退出去）。
// 用户以前定下来的（v2 草稿、v2.3）：地上没有床，只有一把椅子；天花板上倒钉着一张床（她一脱铁靴就会飘起来，睡在上面），
// 脚绳拴在椅子后腿上；灯下写砖，墙上一张她和妈妈的小照片，地上一堆写好了字的砖。
// 坐标：屋子自己的单位，⑨开头的画面正好是 x 0–1080、y 0–1920（推进窗时整间屋子缩小画在窗里：屋子的高 1920 = 窗的高）。
// 左右画得比画面宽（−700…1780）：窗比 9:16 宽，远看时窗的两边也是屋里。

import { type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf, swapSides } from "@materials/剪纸角色/code/chengtuo";
import { E, ph } from "./cam";
import { beatAt } from "@frame/engine/tempo";
import { COLORS as CHEN_COLORS } from "@materials/剪纸角色/code/chengtuo-draw";
import { BOOT } from "@materials/剪纸角色/code/chengtuo-costume";
import { REST, cubicPath, toLocal } from "@materials/剪纸角色/code/figure";
import { INK, addEllipse, drawGlow, part, rectPath } from "./world";
import { ARMS, SMOOTH, live } from "./motion";
import { CHEN2 } from "./poses2";
import { CHEN, armL, armR } from "./poses";
import { HAND_FONT } from "./note";

type V2 = [number, number];
const mixV = (a: V2, b: V2, k: number): V2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
/** 描边粗细倍数：推近时按 1/√倍数变细（画面上的线和远景差不多粗），见 drawRoom */
let LW = 1;
const L = (v: number) => v * LW;

export const ROOM = {
  x0: -700,
  x1: 1780,
  /** 天花板下沿、地板 */
  ceil: 210,
  floor: 1640,
  /** 桌子（左边，朝右的那头挨着她）：桌面上沿 */
  desk: { x0: 30, x1: 560, top: 1362 },
  /** 台灯：底座、灯泡 */
  lampBase: [128, 1362] as V2,
  bulb: [236, 1148] as V2,
  /** 椅子：座面中间、座面高（膝盖伸到桌面底下） */
  chair: { x: 640, seat: 1456 },
  /** 正在写的那块砖：底边中点（躺在桌上，就在她跟前） */
  brick: { x: 344, y: 1362, w: 116, h: 40 },
  /** 她画多大 */
  s: 1.22,
};

/**
 * ⑩「东拼西凑的词句」（33.9–35.88）：放下笔，坐在桌前看着刚写好的那块砖，「词」捧起来、「句」举到胸前看着它笑；
 * 镜头贴着地上码成墙的砖从暗处往右滑到她脚边，再升上去落在台灯底下的她身上（见 lib/write.ts 的 tenCam、tenNight）。2026-10-20 用户改成「展示写好的各种砖头」：原来她站起来、抱着砖冲出门
 * （⑪ 抱着砖跳到千斤家楼顶），现在⑪ 回到楼顶上两个人抱着的那一刻、砖从外套兜里掏出来，她不出门。站起来、跑、关门的时刻放到片子外面不用。
 */
export const TEN_T = {
  start: 33.9,
  /** 把笔放到桌上 */
  penDown: 34.05,
  /** 看着写好的那块砖 */
  look: 34.4,
  /** 「词」两只手捧起「活下去」，「句」举到眼前看着（坐着，不站起来） */
  grab: 34.86,
  lift: 35.3,
  /** （不用了：站起来、冲出门） */
  stand0: 99,
  stand1: 99.1,
  run: 99.4,
  /** 门一直关着 */
  slam0: 0,
  slam1: 0.01,
  end: 35.88,
};
/**
 * ⑫「顺便拯救我自己」（37.79–39.39：顺 37.86 便 38.19 拯 38.43 救 38.67 我 38.88 自 39.12 己 39.27；底鼓 38.016、39.016）：
 * 切回她的屋子（她回来了），脚绳已经拴在近处那条腿上（铁靴靴口上面、膝盖底下）。坐在椅子上弯腰拔远处那条腿的铁靴，
 * 脚一抽出来靴子就掉下去，38.016「咚」立在地上；收起近处那条腿一脚踢直，铁靴甩出去，38.43「咚」倒在地上。
 * 没了铁靴，她整个人慢慢飘起来（头发、围巾一下没了分量），飘到天花板上转成横着，钻进倒钉的那张床的被子里，头枕在枕头上，
 * 光脚露在被子外面；39.016 盘在椅子底下的脚绳一点点放完、绷直，把她拉住。
 */
export const TWELVE_T = {
  start: 37.79,
  /** 远处那条腿的铁靴脱下来（脚一抽）、落地 */
  off1: 37.87,
  boot1: beatAt(76),
  /** 近处那条腿一脚踢直（铁靴离脚）、落地 */
  kick: 38.29,
  boot2: 38.43,
  /** 离开椅子往上飘 → 躺进床里（脚绳绷直） */
  rise0: 38.36,
  bed: beatAt(78),
  end: 39.39,
};
/** 躺在床里时胯在哪（背贴着床垫，头枕在枕头上，脚伸到被子外面） */
/**
 * 天花板上那张床整体往左挪多少：床尾板的右沿和椅面的右沿对齐，床在桌子和椅子正上方，脚那头在椅子上面
 * （用户 2026-10-21：「把床向左移动，刚好和椅子对齐」→「床的右边和椅子对齐」；椅面 x 556–742，床尾板右沿原来在 1382）。
 * 床、被子、躺在床里的位置都按它挪，lib/morning.ts 也用它
 */
export const BED_DX = ROOM.chair.x + 102 - 1382;
const BED_HIP: V2 = [990 + BED_DX, 400];

/** 门：左边墙上（门外是黑着的楼梯间，通到楼顶） */
export const DOOR = { x0: -440, x1: -180, top: 840 };
/** 她站起来以后站在哪（根的 x） */
const STAND_X = 500;
/** ⑩ 地上靠墙码着的一排排写好的砖（从她椅子跟前一直码到门边）：[中心 x, 第几层, 字] */
const ROW: [number, number, string][] = [
  [458, 0, "你很重要"],
  [330, 0, "别怕"],
  [202, 0, "会好的"],
  [74, 0, "有我在"],
  [-54, 0, "吃饱饭"],
  [-118, 1, "抱抱你"],
  [394, 1, "我等你"],
  [266, 1, "天会亮的"],
  [138, 1, "再撑一下"],
  [10, 1, "慢慢来"],
  // 再往上码两层（⑩ 一路滑过去越码越高，到她脚边最高）
  [330, 2, "会过去的"],
  [202, 2, "你值得"],
  [74, 2, "晚安"],
  [266, 3, "多喝水"],
  [138, 3, "早点睡"],
  [458, 1, "不怪你"],
  [394, 2, "我在呢"],
];

/** 她写字时坐着：胯在椅面上一点 */
const HIP: V2 = [ROOM.chair.x - 6, ROOM.chair.seat - 22];

// ——— 她：坐在椅子上朝左伏在桌上写砖（铁靴踩在地上，手套摘了） ———
const chenMove = live(
  [
    { t: 0, x: 0, items: { bricks: 0, gloves: false }, p: CHEN2.写字 },
    { t: 32.0, p: CHEN2.写字 },
    // ⑨ 笔悬在空白的砖面上想一想：头歪一点
    { t: 32.5, ease: "inOut", p: { ...CHEN2.写字, neck: -26, headTurn: 0.1, lookX: -0.45, lookY: 0.85 } },
    { t: 32.8, ease: "inOut", p: CHEN2.写字 },
    { t: 33.66, p: CHEN2.写字 },
    // 写完：嘴角动了一下
    { t: 33.86, ease: "out", p: { ...CHEN2.写字, neck: -24, smile: 0.35, lookY: 0.8 } },
    // ⑩ 放下笔，坐直一点，看着写好的那块砖（嘴角带一点笑）
    { t: 34.05, p: { ...CHEN2.写字, neck: -24, smile: 0.35, lookY: 0.8 } },
    { t: TEN_T.look, ease: "inOut", p: { ...CHEN2.写字, lean: 18, neck: -22, smile: 0.5, lookX: -0.3, lookY: 0.75 } },
    { t: TEN_T.grab - 0.12, p: { ...CHEN2.写字, lean: 20, neck: -22, smile: 0.5, lookX: -0.3, lookY: 0.8 } },
    // 捧起来抱进怀里、坐直，闭上眼笑（像许了个愿：「妄想用它拯救你」）
    { t: TEN_T.lift - 0.1, ease: "inOut", p: { ...CHEN2.写字, lean: 6, neck: -10, smile: 0.7, lookX: -0.4, lookY: 0.6 } },
    { t: TEN_T.lift + 0.12, ease: "out", p: { ...CHEN2.写字, lean: 4, neck: -14, expression: "闭眼", smile: 0.85 } },
    { t: 36, p: { ...CHEN2.写字, lean: 3, neck: -15, expression: "闭眼", smile: 0.9 } },
    // ⑫ 回来了：坐在椅子上拔靴子 → 脚一抽（靴子掉下去）→ 收腿、一脚踢掉另一只 → 松一口气，飘起来 → 转成横着躺进床里
    { t: TWELVE_T.start, p: CHEN2.脱靴 },
    { t: TWELVE_T.off1 - 0.03, ease: "inOut", p: { ...CHEN2.脱靴, lean: 57 } },
    { t: TWELVE_T.off1 + 0.06, ease: "out", p: CHEN2.脱靴_拔 },
    // 手先放回椅面上（手臂有弹簧会晚到：要是和身子一起改，身子一直起来手就往前伸着）
    { t: TWELVE_T.boot1 + 0.06, ease: "inOut", p: { ...CHEN2.脱靴_拔, ...armL(-22, 22, 0, "grip", 40), ...armR(-16, 18, 0, "grip", 40) } },
    { t: TWELVE_T.kick - 0.07, ease: "inOut", p: CHEN2.抬腿 },
    { t: TWELVE_T.kick, ease: "in", p: CHEN2.踢靴 },
    { t: TWELVE_T.boot2 + 0.04, ease: "out", p: CHEN2.松口气 },
    { t: TWELVE_T.rise0 + 0.3, ease: "inOut", p: CHEN2.飘起来 },
    { t: TWELVE_T.bed - 0.03, ease: "inOut", p: CHEN2.躺床 },
    { t: 44, p: CHEN2.躺床 },
  ] as MoveKey[],
  {
  look: CHENGTUO,
  base: { chestL: "under", chestR: "under" },
  idle: true,
  seed: 11,
  springs: ARMS,
  follow: 0,
});
/** ⑩ 抱着砖往左跑（跑的腿照前奏那套，两只手抱着砖不摆） */
function runLeft(): MoveKey[] {
  const hold = (lean: number) => ({ ...armL(28, 104, 0, "grip", lean), ...armR(38, 98, 0, "grip", lean) });
  const R = (p: typeof CHEN.跑_落地, swap: boolean) => {
    const q = swap ? swapSides(p) : p;
    return { ...q, ...hold(q.lean as number), face: -1, expression: "坚定" as const, lookX: -0.6, lookY: 0 };
  };
  const t0 = TEN_T.run;
  const keys: MoveKey[] = [{ t: t0 + 0.06, ease: "inOut", p: R(CHEN.跑_蹬地, false) }];
  let t = t0 + 0.06;
  for (let k = 0; k < 4; k++) {
    const sw = k % 2 === 1;
    keys.push({ t: t + 0.08, ease: SMOOTH, p: R(CHEN.跑_腾空, sw) });
    keys.push({ t: t + 0.13, ease: SMOOTH, p: R(CHEN.跑_落地, !sw) });
    keys.push({ t: t + 0.2, ease: SMOOTH, p: R(CHEN.跑_蹬地, !sw) });
    t += 0.2;
  }
  keys.push({ t: 36.0, p: R(CHEN.跑_蹬地, false) });
  return keys;
}
/** 靴底离根多高（根在两脚之间的地面：站着的姿势按它把靴底放到地板上） */
function soleOf(pose: PoseIn) {
  const j = jointsOf(pose);
  return Math.max(j.ankleL[1], j.ankleR[1]) + 46;
}

/**
 * ⑨「两块五的签字笔」（32.0–33.9：两 32.16 块 32.25 五 32.52 的 32.67 签 32.82 字 33.15 笔 33.42）：她把笔抬起来，悬在一块空白的砖面上
 * 想一想，「签、字、笔」一个字写一个——活、下、去（和写字声 a9_pen 对齐：audio.json 里 rate 1.1，三个字在 0.03/0.34/0.65 秒起）；
 * 写完抬起笔，嘴角动了一下
 */
export const WRITE_T = {
  start: 31.97,
  lift: 32.0,
  poise: 32.4,
  chars: [
    [32.82, 33.05],
    [33.13, 33.35],
    [33.44, 33.66],
  ] as [number, number][],
  end: 33.9,
};
const WORD = "活下去";
/** 砖面上第 i 个字的中心 */
const charC = (i: number): V2 => [ROOM.brick.x - 34 + i * 34, ROOM.brick.y - 28];
/** 每个字三行，来回划（第一行往右、第二行往左……）；字跟着笔尖一行一行出来 */
const ROWS = 3;
function charStroke(i: number, u: number): V2 {
  const [cx, cy] = charC(i);
  const k = Math.min(ROWS - 1e-6, Math.max(0, u) * ROWS);
  const r = Math.floor(k);
  const v = k - r;
  const dir = r % 2 === 0 ? 1 : -1;
  return [cx + dir * (-13 + 26 * v), cy - 10 + r * 10 + 2.5 * Math.sin(v * Math.PI * 4 + i * 1.7 + r)];
}
/** ⑧ 窗里远远看见的：笔尖在砖上来回划 */
function scribble(t: number): V2 {
  const B = ROOM.brick;
  const k = (t / 0.3) % 4;
  const i = Math.floor(k);
  const u = k - i;
  const x = B.x - 34 + i * 20 + 9 * Math.sin(u * Math.PI * 5) + 4 * u;
  const lift = u > 0.82 ? (u - 0.82) * 40 : 0;
  return [x, B.y - B.h - 6 + 3 * Math.cos(u * Math.PI * 7) - lift];
}
/** 笔尖在哪（屋子坐标） */
export function penTip(t: number): V2 {
  const W = WRITE_T;
  if (t < W.lift) return scribble(t);
  const a0 = W.chars[0][0];
  const start = charStroke(0, 0);
  if (t < a0) {
    // 抬起来、移到「活」的起笔上方悬着，笔尖轻轻画小圈（想写什么），落笔
    const hover: V2 = [start[0] + 4, start[1] - 24];
    let p = mixV(scribble(W.lift), hover, E.io(ph(t, W.lift, W.poise)));
    const k = ph(t, W.poise, a0 - 0.08);
    p = [p[0] + 3 * Math.sin(t * 9) * k, p[1] + 2 * Math.cos(t * 7) * k];
    return mixV(p, start, E.in2(ph(t, a0 - 0.1, a0)));
  }
  for (let i = 0; i < 3; i++) {
    const [a, b] = W.chars[i];
    if (t <= b) return charStroke(i, ph(t, a, b));
    const next = i < 2 ? W.chars[i + 1][0] : b + 0.2;
    if (t < next) {
      // 抬笔挪到下一个字（写完最后一个：抬起来）
      const from = charStroke(i, 1);
      const to: V2 = i < 2 ? charStroke(i + 1, 0) : [from[0] + 44, from[1] - 62];
      const u = E.io(ph(t, b, next));
      const p = mixV(from, to, u);
      return [p[0], p[1] - (i < 2 ? 10 * Math.sin(Math.PI * u) : 0)];
    }
  }
  const last = charStroke(2, 1);
  return [last[0] + 44, last[1] - 62];
}

/** 砖面上写出来的字：笔尖划过一行，那一行就出来（来回划，所以第二行从右往左出来）；歪歪扭扭，每个字转一点、高低不一 */
function drawWritten(g: CanvasRenderingContext2D, t: number) {
  const W = WRITE_T;
  if (t <= W.chars[0][0]) return;
  for (let i = 0; i < 3; i++) {
    const [a, b] = W.chars[i];
    if (t <= a) continue;
    const [cx, cy] = charC(i);
    const u = ph(t, a, b);
    g.save();
    if (u < 1) {
      const clip = new Path2D();
      const k = u * ROWS;
      const r = Math.floor(k);
      const v = k - r;
      const top = cy - 17;
      const rowH = 34 / ROWS;
      if (r > 0) clip.rect(cx - 18, top, 36, rowH * r);
      const w = 36 * v;
      clip.rect(r % 2 === 0 ? cx - 18 : cx + 18 - w, top + rowH * r, w, rowH);
      g.clip(clip);
    }
    g.translate(cx, cy + [1, -1, 2][i]);
    g.rotate([-0.05, 0.04, -0.02][i]);
    g.fillStyle = "#3f3140";
    g.font = `31px ${HAND_FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(WORD[i], 0, 0);
    g.restore();
  }
}

/** 两块五的签字笔：笔尖在砖上，笔杆斜着压在虎口里；笔杆上贴着一张手写的「2.5元」价签（小卖部的老板拿红笔写的） */
export function drawPen(g: CanvasRenderingContext2D, palm: V2, tip: V2, lw = LW) {
  const L = (v: number) => v * lw;
  const dx = palm[0] - tip[0];
  const dy = palm[1] - tip[1];
  const len = Math.hypot(dx, dy) || 1;
  const total = Math.max(72, len * 1.55);
  g.save();
  g.translate(tip[0], tip[1]);
  // 局部 +x 从笔尖指向笔帽那头
  g.rotate(Math.atan2(dy, dx));
  const nib = new Path2D();
  nib.moveTo(0, 0);
  nib.lineTo(11, -2.6);
  nib.lineTo(11, 2.6);
  nib.closePath();
  part(g, nib, "#c9c4bb", null, L(1.6));
  const barrel = new Path2D();
  barrel.roundRect(10, -4.2, total - 10, 8.4, 3);
  part(g, barrel, "#2f3a5a", "#252e48", L(2.4), [1.2, 1.2]);
  // 笔夹（笔帽那头）
  const clip = new Path2D();
  clip.roundRect(total - 24, -7.5, 20, 3.4, 1.5);
  part(g, clip, "#9aa1ad", null, L(1.4));
  // 价签
  const tx = total * 0.5;
  part(g, rectPath(tx - 15, -7.5, 30, 15), "#fffaf0", "#ece4d4", L(1.6), [1.2, 1.2]);
  g.fillStyle = "#d24b3f";
  g.font = `13px ${HAND_FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("2.5元", tx, 0.8);
  g.restore();
}

/** 她这一刻的姿势、根（屋子坐标），两只手按 IK 放好：写字时近处那只握着笔、远处那只按着砖；⑩ 两只手捧着那块砖 */
export function roomChen(t: number) {
  const T = TEN_T;
  const pose: PoseIn = { ...chenMove(t).pose };
  const S = ROOM.s;
  const j0 = jointsOf(pose);
  if (t >= TWELVE_T.start) {
    // ⑫ 脱掉的靴子不再画在腿上；坐着时胯钉在椅面上，两只都脱了就飘起来：先往上、快到天花板时往右漂，胯一路漂到床里
    const W = TWELVE_T;
    if (t >= W.off1) pose.legR = { ...(pose.legR as object), boot: false } as PoseIn["legR"];
    if (t >= W.kick) pose.legL = { ...(pose.legL as object), boot: false } as PoseIn["legL"];
    const j = jointsOf(pose);
    const u = ph(t, W.rise0, W.bed);
    const sy = u * u * (3 - 2 * u);
    const ux = ph(u, 0.15, 1);
    const sx = ux * ux * (3 - 2 * ux);
    const hip: V2 = [HIP[0] + (BED_HIP[0] - HIP[0]) * sx, HIP[1] + (BED_HIP[1] - HIP[1]) * sy + bedBreath(t)];
    // 头发、围巾：飘起来时没了分量（float 0.5）；转成横着、躺进床里以后顺着身子垂（压在背后、盖在被子里），不朝天花板竖起来
    const fl = (pose.float as number | undefined) ?? 0;
    const r = (pose.rot as number | undefined) ?? 0;
    pose.gravity = [-Math.sin(r) * (1 - 2 * fl), Math.cos(r) * (1 - 2 * fl)];
    return { pose, root: [hip[0] - j.hip[0] * S, hip[1] - j.hip[1] * S] as V2, brick: [-9999, -9999] as V2 };
  }
  // 坐着：胯钉在椅面上；站起来：靴底踩在地板上；跑：根贴着地板往左（起步 0.12 秒加速到每秒 2100）
  let root: V2 = [HIP[0] - j0.hip[0] * S, HIP[1] - j0.hip[1] * S];
  const ks = E.io(ph(t, T.stand0, T.stand1));
  const standY = ROOM.floor - soleOf(pose) * S;
  if (ks > 0) root = mixV(root, [STAND_X, standY], ks);
  const d = t - T.run;
  if (d > 0) {
    const dist = d < 0.12 ? (2100 * d * d) / 0.24 : 2100 * (d - 0.06);
    root = [STAND_X - dist, standY + (ROOM.floor - standY) * ph(t, T.run, T.run + 0.1)];
  }
  const loc = (p: V2): V2 => [(p[0] - root[0]) / S, (p[1] - root[1]) / S];
  const B = ROOM.brick;
  if (t < T.penDown) {
    const tip = penTip(t);
    // 握笔的手：手腕在笔尖右上方（笔斜着握），肘往下垂（胳膊从右上方伸过来，不横过脸）
    pose.armL = { ...(pose.armL as object), to: loc([tip[0] + 34, tip[1] - 44]), ik: 1, bend: 1 };
    // 按着砖的手：扶在砖的右头外面（不挡着写的字）
    pose.armR = { ...(pose.armR as object), to: loc([B.x + B.w / 2 + 26, B.y - B.h - 22]), ik: 1 };
    return { pose, root, brick: [B.x, B.y - 8] as V2 };
  }
  // ⑩ 放下笔以后：坐着，近处那只手搁在桌上砖的旁边，远处那只还扶着砖
  if (t < T.grab) {
    pose.armL = { ...(pose.armL as object), to: loc([B.x + B.w / 2 + 70, B.y - 18]), ik: 1, bend: 1 };
    pose.armR = { ...(pose.armR as object), to: loc([B.x + B.w / 2 + 26, B.y - B.h - 22]), ik: 1 };
    return { pose, root, brick: [B.x, B.y - 8] as V2 };
  }
  // （不用了）捧砖（两只手伸到砖的两头）→ 抱到胸前，一直扶着
  const bp = brickPos(t, pose, root);
  const w = E.io(ph(t, T.grab - 0.16, T.grab));
  pose.armL = { ...(pose.armL as object), to: loc([bp[0] + 50, bp[1] - 24]), ik: w };
  pose.armR = { ...(pose.armR as object), to: loc([bp[0] - 50, bp[1] - 24]), ik: w };
  return { pose, root, brick: bp };
}
/** 那块「活下去」在哪（底边中点）：桌上 → 捧起来 → 抱在胸前（跟着她的胸口） */
function brickPos(t: number, pose: PoseIn, root: V2): V2 {
  const T = TEN_T;
  const B = ROOM.brick;
  const desk: V2 = [B.x, B.y - 8];
  if (t <= T.grab) return desk;
  const j = jointsOf(pose);
  const S = ROOM.s;
  // 抱进怀里：贴在胸口（她朝左，前面是 −x）；捧起来先抬一点再收进怀里，抱住那一下往怀里紧一紧
  const chest: V2 = [root[0] + ((j.shoulderL[0] + j.shoulderR[0]) / 2 - 30) * S, root[1] + ((j.shoulderL[1] + j.shoulderR[1]) / 2 + 92) * S];
  const u = E.io(ph(t, T.grab, T.lift));
  const p = mixV(desk, chest, u);
  const squeeze = 6 * Math.sin(Math.PI * ph(t, T.lift - 0.05, T.lift + 0.25));
  return [p[0] + squeeze, p[1] - 30 * Math.sin(Math.PI * u)];
}

// ——— 画 ———
const WALL = "#cdae97";
const WOOD = "#8c5f47";
const WOOD_D = "#74493a";

/** 墙上那张小照片：她和妈妈（妈妈的盘发、紫外套） */
function photo(g: CanvasRenderingContext2D) {
  const x = 300;
  const y = 860;
  part(g, rectPath(x, y, 104, 82), "#ead9c4", "#d8c3aa", L(4), [5, 4]);
  g.fillStyle = "#b9c7cf";
  g.fillRect(x + 10, y + 10, 84, 62);
  // 妈妈
  g.fillStyle = "#7b5a8c";
  g.beginPath();
  g.roundRect(x + 24, y + 40, 26, 32, 8);
  g.fill();
  g.fillStyle = "#f2d6c4";
  g.beginPath();
  g.arc(x + 37, y + 32, 9, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#3a3036";
  g.beginPath();
  g.arc(x + 37, y + 22, 6, 0, Math.PI * 2);
  g.fill();
  // 她（小时候，齐刘海）
  g.fillStyle = "#353f55";
  g.beginPath();
  g.roundRect(x + 58, y + 50, 20, 22, 6);
  g.fill();
  g.fillStyle = "#f2d6c4";
  g.beginPath();
  g.arc(x + 68, y + 43, 8, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#35343a";
  g.beginPath();
  g.arc(x + 68, y + 39, 8.5, Math.PI, Math.PI * 2);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = L(3);
  g.strokeRect(x + 10, y + 10, 84, 62);
}

/** 墙上一块搁板，上面码着写好的砖；旁边一本撕到今天的日历 */
function wallShelf(g: CanvasRenderingContext2D) {
  const y = 700;
  part(g, rectPath(-260, y, 520, 18), WOOD, WOOD_D, L(4), [4, 3]);
  for (const x of [-200, 200]) part(g, rectPath(x, y + 18, 12, 40), WOOD_D, null, L(3));
  const words = ["睡个好觉", "春天会来", "不是你的错", "我等你"];
  words.forEach((w, i) => brickAt(g, -190 + i * 124, y, 112, 40, w));
  brickAt(g, -128, y - 40, 112, 40, "抱抱你");
  brickAt(g, -4, y - 40, 112, 40, "别怕");
  // 日历
  part(g, rectPath(820, 780, 120, 150), "#f3ede2", "#e0d8ca", L(4), [4, 4]);
  g.fillStyle = "#c95b4c";
  g.fillRect(820, 780, 120, 34);
  g.fillStyle = "#5a4656";
  g.font = `64px ${HAND_FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("19", 880, 878);
  g.strokeStyle = INK;
  g.lineWidth = L(3);
  g.strokeRect(820, 780, 120, 150);
}

/**
 * 天花板上倒钉着的床（被子在前面另画，见 quilt）：床腿钉在天花板上，床板、床垫、枕头都朝下；床头在左边（椅子正上方），
 * 床比她长一截（她躺下有 650 多长：头顶挨着床头板，脚伸到床尾）
 */
function bedBack(g: CanvasRenderingContext2D) {
  const c = ROOM.ceil;
  for (const x of [660 + BED_DX, 1300 + BED_DX]) part(g, rectPath(x, c - 4, 22, 56), WOOD, WOOD_D, L(4), [4, 3]);
  part(g, rectPath(636 + BED_DX, c + 50, 740, 26), WOOD, WOOD_D, L(4), [5, 4]);
  // 床头板、床尾板（倒过来朝下；床尾板矮一点）
  for (const [x0, x1, h] of [
    [612 + BED_DX, 646 + BED_DX, 214],
    [1352 + BED_DX, 1382 + BED_DX, 150],
  ]) {
    const board = new Path2D();
    board.moveTo(x0, c + 40);
    board.lineTo(x1, c + 40);
    board.lineTo(x1, c + h);
    board.quadraticCurveTo((x0 + x1) / 2, c + h + 18, x0, c + h);
    board.closePath();
    part(g, board, WOOD, WOOD_D, L(4), [4, 3]);
  }
  const mat = new Path2D();
  mat.roundRect(646 + BED_DX, c + 76, 706, 52, 14);
  part(g, mat, "#efe6d8", "#ddd2c2", L(4), [6, 5]);
  const pillow = new Path2D();
  pillow.roundRect(660 + BED_DX, c + 126, 128, 36, 16);
  part(g, pillow, "#f7f0e4", "#e6ddcf", L(3.5), [4, 4]);
}

/** 被子下沿（从左到右）：没人时平平地捆在床垫下面；⑫ 她钻进来以后鼓起来盖住她（左头挨着枕头，右头在脚踝前面，光脚露在外面） */
const QUILT_EMPTY: V2[] = [
  [796 + BED_DX, 340],
  [798 + BED_DX, 362],
  [812 + BED_DX, 378],
  [880 + BED_DX, 380],
  [940 + BED_DX, 381],
  [1000 + BED_DX, 380],
  [1070 + BED_DX, 381],
  [1140 + BED_DX, 380],
  [1200 + BED_DX, 380],
  [1238 + BED_DX, 374],
  [1250 + BED_DX, 352],
];
const QUILT_FULL: V2[] = [
  [790 + BED_DX, 344],
  [786 + BED_DX, 414],
  [818 + BED_DX, 478],
  [880 + BED_DX, 498],
  [940 + BED_DX, 491],
  [1000 + BED_DX, 487],
  [1070 + BED_DX, 499],
  [1130 + BED_DX, 496],
  [1170 + BED_DX, 490],
  [1190 + BED_DX, 474],
  [1200 + BED_DX, 420],
];
/** ⑫ 她躺进床里了多少（被子跟着鼓起来） */
function bedK(t: number) {
  return t < TWELVE_T.start ? 0 : E.io(ph(t, TWELVE_T.bed - 0.14, TWELVE_T.bed + 0.06));
}
/** 躺在床里一起一伏地呼吸 */
function bedBreath(t: number) {
  const d = t - TWELVE_T.bed;
  return d > 0 ? 2.5 * Math.sin(d * 4.2) * ph(d, 0, 0.3) : 0;
}
/** 被子下沿这一刻的样子，和 x 处下沿的高 */
/** 她那床被子这一刻鼓起来多少 */
const quiltK = (t: number) => (AWAY ? (AWAY.quilt ?? 0) : bedK(t));
function quiltEdge(t: number): V2[] {
  const k = quiltK(t);
  const b = bedBreath(t) * k;
  return QUILT_EMPTY.map((p, i) => {
    const q = QUILT_FULL[i];
    return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k + (i > 0 && i < QUILT_FULL.length - 1 ? b : 0)];
  });
}
function edgeY(pts: V2[], x: number) {
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const [a, b] = [pts[i - 1], pts[i]];
      return a[1] + ((b[1] - a[1]) * (x - a[0])) / Math.max(1e-6, b[0] - a[0]);
    }
  }
  return pts[pts.length - 1][1];
}
/** 被子（画在她前面）：下沿按点连成圆滑的线，上沿塞在床垫底下；被面上的小格子，捆被子的两根带子 */
function quilt(g: CanvasRenderingContext2D, t: number) {
  const c = ROOM.ceil;
  const pts = quiltEdge(t);
  // 上沿塞在床垫底下（她钻进来以后往上掖一点，盖住贴着床垫的胳膊）
  const top = c + 126 - 12 * quiltK(t);
  const first = pts[0];
  const last = pts[pts.length - 1];
  const path = new Path2D();
  path.moveTo(first[0], top);
  path.lineTo(last[0] - 4, top);
  path.quadraticCurveTo(last[0] + 4, top, last[0], last[1]);
  // 下沿从右往左：过相邻两点的中点连二次曲线（圆滑）
  for (let i = pts.length - 2; i > 0; i--) {
    const m: V2 = [(pts[i][0] + pts[i - 1][0]) / 2, (pts[i][1] + pts[i - 1][1]) / 2];
    path.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  path.quadraticCurveTo(first[0], first[1], first[0], top);
  path.closePath();
  part(g, path, "#7f93a8", "#6d8196", L(4), [5, 4]);
  // 被面上的小格子
  g.save();
  g.clip(path);
  g.strokeStyle = "rgba(240,236,228,0.35)";
  g.lineWidth = L(3);
  for (let x = 820; x < 1260; x += 34) {
    g.beginPath();
    g.moveTo(x, c + 120);
    g.lineTo(x, c + 300);
    g.stroke();
  }
  g.restore();
  // 捆被子的两根带子（绕过鼓起来的被子）
  g.strokeStyle = "#a08a6e";
  g.lineWidth = L(7);
  for (const x of [860, 1030]) {
    g.beginPath();
    g.moveTo(x, c + 70);
    g.lineTo(x + 4, edgeY(pts, x + 4) - 4);
    g.stroke();
  }
}

/** 脚绳拴在椅子后腿上的那个结 */
export const KNOT: V2 = [ROOM.chair.x + 78, ROOM.floor - 70];
/**
 * 主歌二：她不在屋里（坐在窗框上，lib/sill.ts 另画）——屋里不画她，被子是空的，脚绳从椅子后腿绷直拉到窗口（rope：屋子坐标里绳子出窗的那一点）。
 * 按场景设置一次（和 setDusk 一样），画完设回 null
 */
let AWAY: RoomAway | null = null;
export interface RoomAway {
  /** 脚绳从椅子后腿绷直拉到的那一点（屋子坐标：出窗的地方、她的脚踝）；不写就不画（场景自己画） */
  rope?: V2;
  /** 门开了多少（0 关着，1 开到底）；不写是关着 */
  door?: number;
  /** 站在门洞里的人（画在门洞的暗里、门扇前面），屋子坐标 */
  visitor?: (g: CanvasRenderingContext2D) => void;
  /** ⑫ 脱下来倒在地上的两只铁靴画不画（三 早上：被他摆进了那块光里，场景自己画）；不写是画 */
  boots?: boolean;
  /** 台灯亮着多少（不写按 drawRoom 给的） */
  lamp?: number;
  /** 白天的光（0–1）：早上窗外照进来的光，屋里亮起来 */
  day?: number;
  /** 画在地板、墙上，家具之前（地上的一块光） */
  floor?: (g: CanvasRenderingContext2D) => void;
  /** 她那床被子鼓起来多少（1 = 她躺在里面）；不写是空的 */
  quilt?: number;
  /** 床里的她（画在她平常那一层：家具前面、被子底下），屋子坐标 */
  sleeper?: (g: CanvasRenderingContext2D) => void;
  /** 灯光之后再画（光晕） */
  after?: (g: CanvasRenderingContext2D) => void;
  /** 桌上那支放下的笔画不画（三⑦ 笔在两个人手里，场景自己画）；不写是画 */
  pen?: boolean;
}
export function setRoomAway(a: RoomAway | null) {
  AWAY = a;
}
/** ⑫ 脚绳拴在她腿上的那一点：先在近处那条腿的膝盖底下（铁靴靴口上面），铁靴踢掉以后滑到脚踝上 */
function ropeEnd(t: number): V2 {
  const c = roomChen(t);
  const j = jointsOf(c.pose);
  const f = 0.08 + 0.92 * E.in2(ph(t, TWELVE_T.kick + 0.04, TWELVE_T.kick + 0.2));
  const p = mixV(j.kneeL as V2, j.ankleL as V2, f);
  return [c.root[0] + p[0] * ROOM.s, c.root[1] + p[1] * ROOM.s];
}
/** ⑫ 脚绳多长：她躺在床里时正好绷直 */
let ropeLen = 0;
function ropeLength() {
  if (!ropeLen) ropeLen = Math.hypot(...(([a, b]) => [a[0] - b[0], a[1] - b[1]])([ropeEnd(TWELVE_T.bed + 0.001), KNOT]));
  return ropeLen;
}
/** 画一段绳子（墨线描边、麻色） */
export function strokeRope(g: CanvasRenderingContext2D, path: Path2D, w = 5) {
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = INK;
  g.lineWidth = L(w + 4);
  g.stroke(path);
  g.strokeStyle = "#a08a6e";
  g.lineWidth = L(w);
  g.stroke(path);
}

/**
 * 脚绳：⑧–⑩ 从床尾垂下来，拴在椅子后腿上；⑫ 拴在她腿上，多出来的盘在椅子底下的地上——她飘上去，绳子一圈圈放完、
 * 离开地面、越来越直，躺进床里时绷直（弹两下）
 */
function footRope(g: CanvasRenderingContext2D, t: number) {
  const a: V2 = [1066, ROOM.ceil + 168];
  const b = KNOT;
  if (t >= TWELVE_T.start) {
    const e = ropeEnd(t);
    const d = Math.hypot(e[0] - b[0], e[1] - b[1]);
    const slack = Math.max(0, ropeLength() - d);
    const mid: V2 = [(e[0] + b[0]) / 2, (e[1] + b[1]) / 2];
    // 松着往下垂（抛物线：多出来的长度 ≈ 8h²/3d）；垂到地上就贴着地，再多的盘成一圈圈
    const floorY = ROOM.floor - 8;
    let h = Math.sqrt((3 * d * slack) / 8);
    const lowest = (hh: number) => {
      const cy = mid[1] + 2 * hh;
      const den = e[1] - 2 * cy + b[1];
      const u = Math.abs(den) < 1e-6 ? 0.5 : Math.min(1, Math.max(0, (e[1] - cy) / den));
      return { y: (1 - u) ** 2 * e[1] + 2 * (1 - u) * u * cy + u * u * b[1], u };
    };
    let coil = 0;
    if (lowest(h).y > floorY) {
      let lo = 0;
      let hi = h;
      for (let i = 0; i < 24; i++) {
        const m = (lo + hi) / 2;
        if (lowest(m).y > floorY) hi = m;
        else lo = m;
      }
      coil = slack - (8 * lo * lo) / (3 * Math.max(1, d));
      h = lo;
    }
    // 绷直以后弹两下
    const tw = t > TWELVE_T.bed ? 16 * Math.exp(-(t - TWELVE_T.bed) / 0.09) * Math.sin((t - TWELVE_T.bed) * 2 * Math.PI * 9) : 0;
    const n: V2 = [-(e[1] - b[1]) / Math.max(1, d), (e[0] - b[0]) / Math.max(1, d)];
    const cx = mid[0] + n[0] * 2 * tw;
    const cy = mid[1] + 2 * h + n[1] * 2 * tw;
    g.save();
    // 盘在地上的那几圈（多出来的长度一圈约 260）
    if (coil > 1) {
      const lw = lowest(h);
      const px = (1 - lw.u) ** 2 * e[0] + 2 * (1 - lw.u) * lw.u * cx + lw.u * lw.u * b[0];
      const loops = Math.min(4, coil / 260);
      const coilPath = new Path2D();
      for (let i = 0; i < Math.ceil(loops); i++) {
        const frac = Math.min(1, loops - i);
        const oy = floorY - 2 - i * 7;
        coilPath.ellipse(px + (i % 2 ? 6 : -4), oy, 46 - i * 3, 11, 0, Math.PI * 0.5, Math.PI * 0.5 + Math.PI * 2 * frac);
      }
      strokeRope(g, coilPath, 5);
    }
    const rope = new Path2D();
    rope.moveTo(e[0], e[1]);
    rope.quadraticCurveTo(cx, cy, b[0], b[1]);
    strokeRope(g, rope, 5);
    part(g, rectPath(b[0] - 10, b[1] - 9, 20, 18), "#a08a6e", null, L(3));
    g.restore();
    return;
  }
  const sway = 10 * Math.sin(t * 1.3);
  g.save();
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(a[0], a[1]);
  g.bezierCurveTo(a[0] + 30 + sway, a[1] + 420, b[0] + 120, b[1] - 520, b[0], b[1]);
  g.strokeStyle = INK;
  g.lineWidth = L(9);
  g.stroke();
  g.strokeStyle = "#a08a6e";
  g.lineWidth = L(5);
  g.stroke();
  // 绳结
  part(g, rectPath(b[0] - 10, b[1] - 9, 20, 18), "#a08a6e", null, L(3));
  g.restore();
}

/** ⑫ 绕在她腿上的那一圈脚绳（画在腿前面） */
function ropeLoop(g: CanvasRenderingContext2D, t: number) {
  const c = roomChen(t);
  const j = jointsOf(c.pose);
  const ang = Math.atan2(j.ankleL[1] - j.kneeL[1], j.ankleL[0] - j.kneeL[0]);
  const e = ropeEnd(t);
  g.save();
  g.translate(e[0], e[1]);
  g.rotate(ang);
  const p = new Path2D();
  p.ellipse(0, 0, 6, 18, 0, 0, Math.PI * 2);
  strokeRope(g, p, 4);
  g.restore();
}

/** 一块砖（底边中点 x、y），正面写着字 */
function brickAt(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, word: string, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  const p = new Path2D();
  p.roundRect(-w / 2, -h, w, h, 5);
  part(g, p, "#cbc6bd", "#b2ada4", L(3.5), [4, 4]);
  if (word) {
    g.fillStyle = "#5a4656";
    g.font = `${h * 0.56}px ${HAND_FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(word, 0, -h / 2 + 1, w - 10);
  }
  g.restore();
}
/** 地上一堆写好的砖：每块写着不一样的话 */
const PILE: [number, number, string, number][] = [
  [900, 0, "抱抱你", 0.01],
  [1020, 0, "你很重要", -0.01],
  [960, -44, "天会亮的", 0.02],
  [1150, 0, "再撑一下", 0],
];

function desk(g: CanvasRenderingContext2D) {
  const D = ROOM.desk;
  for (const x of [D.x0 + 26, D.x1 - 40]) part(g, rectPath(x, D.top + 20, 18, ROOM.floor - D.top - 20), WOOD_D, null, L(4));
  part(g, rectPath(D.x0 + 200, D.top + 24, 220, 70), WOOD, WOOD_D, L(4), [4, 4]);
  g.fillStyle = "#c9a35a";
  g.beginPath();
  g.arc(D.x0 + 310, D.top + 58, 6, 0, Math.PI * 2);
  g.fill();
  // 桌面（上沿露出一条桌面）
  part(g, rectPath(D.x0, D.top - 8, D.x1 - D.x0, 30), WOOD, WOOD_D, L(4.5), [5, 4]);
}

function lamp(g: CanvasRenderingContext2D, on: number) {
  const [bx, by] = ROOM.lampBase;
  const base = new Path2D();
  addEllipse(base, bx, by - 10, 58, 14);
  part(g, base, "#6f7f74", "#5d6c62", L(4), [3, 3]);
  // 两节灯臂
  const j1: V2 = [bx - 34, by - 190];
  const head: V2 = [ROOM.bulb[0] - 30, ROOM.bulb[1] - 52];
  g.lineCap = "round";
  for (const [w, c] of [
    [16, INK],
    [9, "#7f8f84"],
  ] as const) {
    g.strokeStyle = c;
    g.lineWidth = L(w);
    g.beginPath();
    g.moveTo(bx, by - 18);
    g.lineTo(j1[0], j1[1]);
    g.lineTo(head[0], head[1]);
    g.stroke();
  }
  // 灯罩：斜着朝右下（照着桌上那块砖）
  g.save();
  g.translate(head[0], head[1]);
  g.rotate(0.55);
  const shade = new Path2D();
  shade.moveTo(-30, -18);
  shade.lineTo(30, -18);
  shade.lineTo(70, 64);
  shade.lineTo(-70, 64);
  shade.closePath();
  part(g, shade, "#6f8f7e", "#5c7a6a", L(4.5), [5, 4]);
  // 灯泡露出来一点
  g.fillStyle = on > 0.05 ? `rgba(255,244,210,${0.4 + 0.6 * on})` : "#9a9488";
  g.beginPath();
  g.ellipse(0, 64, 40, 12, 0, 0, Math.PI);
  g.fill();
  g.restore();
}

function chair(g: CanvasRenderingContext2D, front: boolean) {
  const C = ROOM.chair;
  if (!front) {
    // 椅背、后腿（在她后面）
    part(g, rectPath(C.x + 70, C.seat - 300, 18, ROOM.floor - C.seat + 300), WOOD_D, null, L(4));
    part(g, rectPath(C.x + 58, C.seat - 300, 42, 26), WOOD, null, L(4));
    part(g, rectPath(C.x + 58, C.seat - 200, 42, 20), WOOD, null, L(4));
    return;
  }
  // 座面、前腿（压在她腿后面一点：先画）
  part(g, rectPath(C.x - 84, C.seat - 6, 186, 24), WOOD, WOOD_D, L(4), [4, 3]);
  part(g, rectPath(C.x - 74, C.seat + 18, 16, ROOM.floor - C.seat - 18), WOOD_D, null, L(4));
}

/** 灯下的光：近处暖、亮，屋角暗下去（multiply 只压暗，不染色）；灯泡一团光，灯罩底下一道光 */
function light(g: CanvasRenderingContext2D, on: number) {
  const [lx, ly] = ROOM.bulb;
  const R = ROOM;
  const day = AWAY?.day ?? 0;
  const mix = (a: number[], b: number[], k = on) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const off = [46, 48, 78];
  // 白天：窗在镜头这边，光从前面照进来，靠窗的地上最亮、往天花板暗下去
  const dayC = [
    [255, 250, 242],
    [246, 230, 214],
    [204, 180, 180],
    [156, 134, 144],
  ];
  const stops: [number, number[]][] = [
    [0, mix(mix(off, [255, 250, 240]), dayC[0], day)],
    [0.3, mix(mix(off, [232, 206, 186]), dayC[1], day)],
    [0.62, mix(mix(off, [148, 112, 128]), dayC[2], day)],
    [1, mix(mix([30, 32, 60], [62, 46, 74]), dayC[3], day)],
  ];
  const cx = lx + (560 - lx) * day;
  const cy = ly + 120 + (1960 - ly - 120) * day;
  g.save();
  g.globalCompositeOperation = "multiply";
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 1500 + 700 * day);
  for (const [k, c] of stops) gr.addColorStop(k, `rgb(${c.join(",")})`);
  g.fillStyle = gr;
  g.fillRect(R.x0, -600, R.x1 - R.x0, 3200);
  g.restore();
  if (day > 0.01) {
    g.save();
    g.globalCompositeOperation = "soft-light";
    const warm = g.createRadialGradient(560, 1800, 0, 560, 1800, 1300);
    warm.addColorStop(0, `rgba(255,206,150,${0.7 * day})`);
    warm.addColorStop(1, "rgba(255,206,150,0)");
    g.fillStyle = warm;
    g.fillRect(R.x0, -600, R.x1 - R.x0, 3200);
    g.restore();
  }
  if (on <= 0.01) return;
  g.save();
  g.globalCompositeOperation = "soft-light";
  const warm = g.createRadialGradient(lx, ly + 160, 0, lx, ly + 160, 760);
  warm.addColorStop(0, `rgba(255,190,110,${0.75 * on})`);
  warm.addColorStop(1, "rgba(255,190,110,0)");
  g.fillStyle = warm;
  g.fillRect(R.x0, -600, R.x1 - R.x0, 3200);
  // 灯罩底下照到桌面的一道光
  g.globalCompositeOperation = "screen";
  const cone = new Path2D();
  cone.moveTo(lx - 30, ly + 4);
  cone.lineTo(lx + 44, ly - 20);
  cone.lineTo(ROOM.brick.x + 150, ROOM.desk.top);
  cone.lineTo(ROOM.brick.x - 150, ROOM.desk.top);
  cone.closePath();
  const cg = g.createLinearGradient(lx, ly, lx, ROOM.desk.top);
  cg.addColorStop(0, `rgba(255,232,180,${0.32 * on})`);
  cg.addColorStop(1, `rgba(255,232,180,${0.08 * on})`);
  g.fillStyle = cg;
  g.fill(cone);
  g.restore();
  drawGlow(g, lx, ly + 10, 150, 0.85 * on);
}

/**
 * ⑩ 暖：屋角只轻轻压一点（柔和扁平风，暗角 ≤ 0.25），灯下一大团暖光，她把砖抱进怀里时暖光涌上来；灯光里慢慢浮着的灰尘。
 * （第一版压成深紫的夜、只剩一圈灯光，用户：「感觉有点压抑」）
 * k：浓淡（⑩ 开头 0.4 秒里起来，只有 ⑩ 用）
 */
function tenNight(g: CanvasRenderingContext2D, t: number, k: number) {
  if (k <= 0.01) return;
  const [lx, ly] = ROOM.bulb;
  const R = ROOM;
  g.save();
  g.globalCompositeOperation = "multiply";
  const cx = lx + 160;
  const cy = ly + 240;
  const gr = g.createRadialGradient(cx, cy, 200, cx, cy, 1300);
  const m = (a: number[]) => a.map((v) => Math.round(255 + (v - 255) * k)).join(",");
  gr.addColorStop(0, `rgb(${m([255, 255, 255])})`);
  gr.addColorStop(0.6, `rgb(${m([246, 236, 236])})`);
  gr.addColorStop(1, `rgb(${m([214, 196, 214])})`);
  g.fillStyle = gr;
  g.fillRect(R.x0, -600, R.x1 - R.x0, 3200);
  g.restore();
  // 暖：灯下一大团暖光（soft-light），她把砖抱进怀里时涌上来
  const hug = E.io(ph(t, TEN_T.lift - 0.2, TEN_T.end));
  g.save();
  g.globalCompositeOperation = "soft-light";
  const wx = lx + 260 * hug;
  const wy = ly + 140;
  const warm = g.createRadialGradient(wx, wy, 0, wx, wy, 900);
  warm.addColorStop(0, `rgba(255,196,120,${k * (0.45 + 0.35 * hug)})`);
  warm.addColorStop(1, "rgba(255,196,120,0)");
  g.fillStyle = warm;
  g.fillRect(R.x0, -600, R.x1 - R.x0, 3200);
  g.restore();
  // 灰尘：灯光里慢慢往上浮、左右飘，离灯越近越亮
  g.save();
  g.globalCompositeOperation = "screen";
  for (let i = 0; i < 46; i++) {
    const h1 = Math.sin(i * 12.9898) * 43758.5453;
    const h2 = Math.sin(i * 78.233) * 12543.137;
    const r1 = h1 - Math.floor(h1);
    const r2 = h2 - Math.floor(h2);
    const x = lx - 260 + r1 * 820 + 22 * Math.sin(t * 0.9 + i);
    const span = 760;
    const y = ly - 200 + ((((r2 * span - t * (14 + 10 * r1)) % span) + span) % span);
    const d = Math.hypot(x - (lx + 80), y - (ly + 200)) / 520;
    const a = k * 0.55 * Math.max(0, 1 - d) * (0.6 + 0.4 * Math.sin(t * 2.3 + i * 1.7));
    if (a <= 0.01) continue;
    g.fillStyle = `rgba(255,226,170,${a})`;
    g.beginPath();
    g.arc(x, y, 2.2 + 2.6 * r2, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** 铁靴在靴子自己的坐标里（脚踝在原点，画面左边那只的线稿） */
const LOOSE = {
  body: toLocal(BOOT.body, REST.ankleR, 0),
  rim: toLocal(BOOT.rim, REST.ankleR, 0),
  sole: toLocal(BOOT.sole, REST.ankleR, 0),
  rust: BOOT.rust.map((r) => toLocal(r, REST.ankleR, 0)),
  rivets: BOOT.rivets.map((d) => ({ c: toLocal([d.c], REST.ankleR, 0)[0], r: d.r })),
};
/** 一只脱下来的铁靴：脚踝点在 (x, y)，转 rot（弧度），按她的大小画（s：离镜头近的地方画大一点） */
export function looseBoot(g: CanvasRenderingContext2D, x: number, y: number, rot: number, s = ROOM.s) {
  const K = CHEN_COLORS;
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  const lw = L(3) / s;
  const id = (p: V2): V2 => p;
  part(g, cubicPath(LOOSE.body, id), K.boot, K.bootShade, lw, [4, 3]);
  g.fillStyle = K.rust;
  for (const r of LOOSE.rust) g.fill(cubicPath(r, id));
  part(g, cubicPath(LOOSE.rim, id), K.bootRim, K.bootShade, lw, [2, 2]);
  g.fillStyle = K.rivet;
  for (const d of LOOSE.rivets) {
    g.beginPath();
    g.arc(d.c[0], d.c[1], d.r, 0, Math.PI * 2);
    g.fill();
  }
  part(g, cubicPath(LOOSE.sole, id), K.sole, null, lw);
  g.restore();
}
/** 铁靴外形上的点（靴子自己的坐标）：算转过去以后最低点离脚踝多远（按她的大小），好把它放到地上 */
const BOOT_PTS: V2[] = [...LOOSE.body, ...LOOSE.sole];
export function bootLow(rot: number, s = ROOM.s) {
  const c = Math.cos(rot);
  const sn = Math.sin(rot);
  let m = -1e9;
  for (const [x, y] of BOOT_PTS) m = Math.max(m, x * sn + y * c);
  return m * s;
}
/** 脱靴子那一刻靴子在哪（她那条腿的脚踝，屋子坐标） */
const ankleAt = (t: number, side: "L" | "R"): V2 => {
  const c = roomChen(t);
  const j = jointsOf(c.pose);
  const a = side === "L" ? j.ankleL : j.ankleR;
  return [c.root[0] + a[0] * ROOM.s, c.root[1] + a[1] * ROOM.s];
};
let boot1From: V2 | null = null;
let boot2From: V2 | null = null;
/**
 * ⑫ 先脱的那只（远处那条腿）：脚一抽出来就从脚上掉下去，38.016 立着砸在地上（弹一下、晃一晃）。
 * 后脱的那只（近处那条腿）：一脚踢直时甩出去，往左前方翻着跟头落下，38.43 侧着砸在地上，滑一点、晃一下停住。
 */
function droppedBoot(g: CanvasRenderingContext2D, t: number, which: 1 | 2) {
  const W = TWELVE_T;
  const f = ROOM.floor;
  if (which === 1) {
    if (t < W.off1) return;
    boot1From ??= ankleAt(W.off1, "R");
    const [x0, y0] = boot1From;
    const q = ph(t, W.off1, W.boot1);
    const d = t - W.boot1;
    const rock = d > 0 ? 0.07 * Math.exp(-d / 0.12) * Math.sin(d * 30) : 0;
    const hop = d > 0 ? 9 * Math.max(0, Math.sin(Math.PI * ph(d, 0, 0.1))) : 0;
    const rot = 0.06 * (1 - q) + rock;
    const yF = f - bootLow(rot);
    looseBoot(g, x0 - 30 * q, y0 + (yF - y0) * q * q - hop, rot);
    return;
  }
  if (t < W.kick) return;
  boot2From ??= ankleAt(W.kick, "L");
  const [x0, y0] = boot2From;
  const r0 = 0.28;
  const r1 = 1.45;
  const xL = x0 - 62;
  const dt = W.boot2 - W.kick;
  if (t < W.boot2) {
    const tau = t - W.kick;
    const g0 = 6000;
    const yL = f - bootLow(r1);
    const vy = (yL - y0 - 0.5 * g0 * dt * dt) / dt;
    looseBoot(g, x0 + ((xL - x0) * tau) / dt, y0 + vy * tau + 0.5 * g0 * tau * tau, r0 + ((r1 - r0) * tau) / dt);
    return;
  }
  const d = t - W.boot2;
  const rot = Math.PI / 2 + (r1 - Math.PI / 2) * Math.exp(-d / 0.05) * Math.cos(d * 38);
  looseBoot(g, xL - 16 * E.out(ph(d, 0, 0.16)), f - bootLow(rot), rot);
}

/** 左边墙上的门洞：门外是黑着的楼梯间，几级台阶往上（通到楼顶）；门框 */
function doorBack(g: CanvasRenderingContext2D) {
  const D = DOOR;
  const f = ROOM.floor;
  const hole = rectPath(D.x0, D.top, D.x1 - D.x0, f - D.top);
  const gr = g.createLinearGradient(D.x1, D.top, D.x0, f);
  gr.addColorStop(0, "#3a2c34");
  gr.addColorStop(1, "#1e161c");
  g.fillStyle = gr;
  g.fill(hole);
  g.save();
  g.clip(hole);
  g.strokeStyle = "rgba(150,118,112,0.32)";
  g.lineWidth = L(4);
  for (let k = 0; k < 7; k++) {
    const y = f - 46 - k * 64;
    const x = D.x0 + 30 + k * 30;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(D.x1, y);
    g.lineTo(D.x1, y + 64);
    g.stroke();
  }
  g.restore();
  // 门框：两边的门框、上面的门楣
  const frame = new Path2D();
  frame.rect(D.x0 - 22, D.top - 24, 22, f - D.top + 24);
  frame.rect(D.x1, D.top - 24, 22, f - D.top + 24);
  frame.rect(D.x0 - 22, D.top - 24, D.x1 - D.x0 + 44, 24);
  part(g, frame, WOOD, WOOD_D, L(4), [4, 3]);
}
/** 门洞前面：进了门洞的人蒙一层暗（楼梯间是黑的）；门扇关上（合页在右边门框上，从侧着的一条转过来盖住门洞） */
function doorFront(g: CanvasRenderingContext2D, t: number) {
  const D = DOOR;
  const f = ROOM.floor;
  g.fillStyle = "rgba(16,10,18,0.5)";
  g.fill(rectPath(D.x0, D.top, D.x1 - D.x0, f - D.top));
  // 主歌二：门洞里站着的人（楼梯间的暗只压一半，屋里的光照到他身上）、门往里开
  AWAY?.visitor?.(g);
  const u = AWAY ? 1 - (AWAY.door ?? 0) : E.in2(ph(t, TEN_T.slam0, TEN_T.slam1));
  if (u <= 0) return;
  const w = (D.x1 - D.x0) * Math.sin((u * Math.PI) / 2);
  const leaf = rectPath(D.x1 - w, D.top, w, f - D.top);
  part(g, leaf, "#8a5d47", "#77503d", L(4), [4, 3]);
  // 门板上两块凹进去的板子、门把手（在活动的那边）
  g.save();
  g.clip(leaf);
  g.strokeStyle = "rgba(60,36,30,0.45)";
  g.lineWidth = L(3);
  const k = w / (D.x1 - D.x0);
  for (const [y0, y1] of [
    [D.top + 40, D.top + 330],
    [D.top + 380, f - 50],
  ])
    g.strokeRect(D.x1 - w + 30 * k, y0, w - 60 * k, y1 - y0);
  g.restore();
  g.fillStyle = "#c9a35a";
  g.beginPath();
  g.ellipse(D.x1 - w + 26 * k, D.top + 420, 9 * k + 1, 9, 0, 0, Math.PI * 2);
  g.fill();
}
/** ⑩ 放在桌上的那支笔（她站起来以前放下的） */
function penOnDesk(g: CanvasRenderingContext2D) {
  const y = ROOM.desk.top - 6;
  drawPen(g, [496, y - 8], [416, y]);
}

/**
 * 画整间屋子（屋子坐标）：墙、天花板、地板、照片、天花板上的床、脚绳、桌子、台灯、砖、椅子、她、灯下的光。
 * on：台灯亮了多少（0 黑着，只有窗外一点夜色）；lw：描边粗细倍数（推近时 1/√倍数，远景 1）
 */
export function drawRoom(g: CanvasRenderingContext2D, t: number, on: number, lw = 1) {
  LW = lw;
  if (AWAY?.lamp !== undefined) on = AWAY.lamp;
  const R = ROOM;
  // 墙：一道道很淡的旧墙纸竖纹
  g.fillStyle = WALL;
  g.fillRect(R.x0, R.ceil, R.x1 - R.x0, R.floor - R.ceil);
  g.fillStyle = "rgba(140,104,96,0.08)";
  for (let x = R.x0; x < R.x1; x += 64) g.fillRect(x, R.ceil, 26, R.floor - R.ceil);
  // 天花板、地板、踢脚线
  // （往上、往下多画一截：⑫ 退到整间屋子时镜头比 1 倍还远一点）
  g.fillStyle = "#5c4752";
  g.fillRect(R.x0, -600, R.x1 - R.x0, R.ceil + 600);
  g.fillStyle = "#4a3943";
  g.fillRect(R.x0, R.ceil - 16, R.x1 - R.x0, 16);
  g.fillStyle = "#7b5646";
  g.fillRect(R.x0, R.floor, R.x1 - R.x0, 2600 - R.floor);
  g.strokeStyle = "rgba(60,36,30,0.4)";
  g.lineWidth = L(3);
  for (let y = R.floor + 46; y < 2600; y += 62) {
    g.beginPath();
    g.moveTo(R.x0, y);
    g.lineTo(R.x1, y);
    g.stroke();
  }
  g.fillStyle = "#5e4038";
  g.fillRect(R.x0, R.floor - 18, R.x1 - R.x0, 18);
  g.strokeStyle = INK;
  g.lineWidth = L(4);
  g.beginPath();
  g.moveTo(R.x0, R.floor);
  g.lineTo(R.x1, R.floor);
  g.moveTo(R.x0, R.ceil);
  g.lineTo(R.x1, R.ceil);
  g.stroke();
  AWAY?.floor?.(g);
  photo(g);
  wallShelf(g);
  bedBack(g);
  // 地上一堆写好的砖
  for (const [x, dy, w, r] of PILE) brickAt(g, x, R.floor + dy, 112, 42, w, r);
  chair(g, false);
  if (!AWAY) footRope(g, t);
  desk(g);
  // 桌上：一摞还没写的砖（台灯旁边）、正在写的那块（⑩ 捧起来以后跟着她）
  for (let i = 0; i < 3; i++) brickAt(g, 238, R.desk.top - 8 - i * 40, 112, 40, "");
  const c = roomChen(t);
  const B = R.brick;
  const workBrick = (gg: CanvasRenderingContext2D) => {
    gg.save();
    gg.translate(c.brick[0] - B.x, c.brick[1] - (B.y - 8));
    brickAt(gg, B.x, B.y - 8, B.w, B.h, "");
    drawWritten(gg, t);
    gg.restore();
  };
  const inHands = t > TEN_T.grab && t < TWELVE_T.start;
  if (t <= TEN_T.grab) workBrick(g);
  if (t >= TEN_T.penDown && AWAY?.pen !== false) penOnDesk(g);
  lamp(g, on);
  chair(g, true);
  // ⑩ 地上靠墙码着的一排排写好的砖（在桌子前面）
  ROW.forEach(([x, row, w], i) => brickAt(g, x, R.floor - row * 42, 112, 42, w, ((i * 37) % 7) * 0.006 - 0.018));
  doorBack(g);
  // ⑫ 先脱下来的那只铁靴（在她脚后面）
  const boots = t >= TWELVE_T.start && AWAY?.boots !== false;
  if (boots) droppedBoot(g, t, 1);
  if (AWAY?.rope) {
    // 主歌二：脚绳从椅子后腿绷直拉到窗口（画在地上的砖、靴子前面，看得见）
    const rope = new Path2D();
    rope.moveTo(KNOT[0], KNOT[1]);
    rope.lineTo(AWAY.rope[0], AWAY.rope[1]);
    strokeRope(g, rope, 6);
    part(g, rectPath(KNOT[0] - 10, KNOT[1] - 9, 20, 18), "#a08a6e", null, L(3));
  }
  // 她（冲出门时：过了左边门框的那部分被墙挡住，像进门往左拐了）；捧着的砖画在身子和近处那只手臂之间
  g.save();
  if (t > TEN_T.run) {
    const clip = new Path2D();
    clip.rect(DOOR.x0, -100, R.x1 - DOOR.x0, 2200);
    g.clip(clip);
  }
  const roomM = g.getTransform();
  AWAY?.sleeper?.(g);
  g.translate(c.root[0], c.root[1]);
  g.scale(R.s, R.s);
  if (!AWAY) drawChengtuo(g, c.pose, {
    line: LW,
    beforeFrontArms: inHands
      ? (cc) => {
          cc.save();
          cc.setTransform(roomM);
          workBrick(cc);
          cc.restore();
        }
      : undefined,
  });
  g.restore();
  if (t >= TWELVE_T.start) {
    // ⑫ 腿上那圈脚绳、踢出去的那只铁靴（在她前面）；躺进床里时被子盖在她身上
    if (!AWAY) ropeLoop(g, t);
    if (boots) droppedBoot(g, t, 2);
  }
  quilt(g, t);
  doorFront(g, t);
  if (t < TEN_T.penDown) {
    // 两块五的签字笔：笔尖在砖上，笔杆压在手心里
    const j = jointsOf(c.pose);
    const palm: V2 = [c.root[0] + j.palmL[0] * R.s, c.root[1] + j.palmL[1] * R.s];
    drawPen(g, palm, penTip(t));
  }
  light(g, on);
  if (!AWAY && t >= TEN_T.start && t < TWELVE_T.start) tenNight(g, t, E.io(ph(t, TEN_T.start, TEN_T.start + 0.4)));
  AWAY?.after?.(g);
}
