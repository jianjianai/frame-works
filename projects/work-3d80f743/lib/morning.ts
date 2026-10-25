// 三「明天见」①（模块 88.02–89.79，作品 82.02–83.79「其实还想要说很多」；2026-10-25 换掉原来「早上他把还睡着的她拉下来、推铁靴、
// 她踩进去」——和主歌二③夜里他把她拽下来重复了；用户：「她开门，他从上面下来和她一起就行，不用流泪」）。早上，沉沉家。一个镜头
// （接着主歌二⑧仰头看的天花板，往下摇回侧面的屋子，摇的时候溶过去，时间往后跳一点）：天花板上两张床，她的空了，他还在小床里睡着；
// 镜头往下摇到门口：她已经穿好铁靴（靴筒里插着砖），手搭在门把上，拧开门（门外是黑着的楼梯间）。他披上妈妈那件下摆缝着铅的外套，
// 一下子有了分量，从上面掉下来落在她身边，仰头看她；她回头看着他笑了一下，两个人站在开着的门口看着彼此（用户：「这里他们不用向前走」）。89.79「请你等等我」切到白天的街上（③ 阿满）。
// 坐标都是屋子坐标（lib/room.ts），屋子按 setRoomAway 画：他的小床、两个人、地上的光从这里的钩子画进去。

import { type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, camLerp, kick, ph } from "./cam";
import { INK, drawGlow, part } from "./world";
import { ARMS, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { drawPerson } from "./people";
import { DOOR, KNOT, ROOM, type RoomAway, strokeRope } from "./room";
import { aimRoom } from "./write";
import { DOWN_PX, STONE_BED, downPx } from "./bed";

type V2 = [number, number];

export const MORN_T = {
  start: beatAt(176),
  /** 从仰头看的天花板溶回侧面的屋子（时间在这里跳过去：她已经起来了） */
  mix0: 88.1,
  mix1: 88.4,
  /** 侧面一边往下一边往左落到门口（溶完以后自己的 E.settle） */
  land0: 88.85,
  /** 拉开门（往屋里开，开大：门外是黑着的楼梯间） */
  open0: 88.42,
  open1: 88.86,
  /** 他披上外套从上面掉下来，落在她身边（膝盖一弯，弹一下） */
  fall0: 88.55,
  land: 88.93,
  /** 她回头看他、他仰头看她 */
  look0: 88.96,
  look1: 89.14,
  end: 89.79,
};
const M = MORN_T;
/** 仰头看的画面淡掉多少（侧面的屋子盖上来） */
export const morningMix = (t: number) => E.soft(ph(t, M.mix0, M.mix1));

/** 离窗越近画得越大（透视）：地板最里面（墙根）是屋里的大小，窗台那里是 1.6 倍 */
const depthK = (y: number) => ROOM.s * (1 + 0.6 * Math.max(0, Math.min(1, (y - ROOM.floor) / (1920 - ROOM.floor))));
/** 两个人站的那一排地（离墙根 60）、画多大 */
const FLOOR_Y = 1700;
const S = depthK(FLOOR_Y);

// ——— 地上那块光（门口，两个人站在光里） ———
const PATCH = { y0: 1652, y1: 1792, back: [-250, 40] as V2, front: [-300, 96] as V2 };
function sunPatch(g: CanvasRenderingContext2D, t: number) {
  const P = PATCH;
  const quad = (u0: number, u1: number, grow = 0) => {
    const p = new Path2D();
    const b = (u: number) => P.back[0] + (P.back[1] - P.back[0]) * u;
    const f = (u: number) => P.front[0] + (P.front[1] - P.front[0]) * u;
    p.moveTo(b(u0) - grow, P.y0 - grow * 0.4);
    p.lineTo(b(u1) + grow, P.y0 - grow * 0.4);
    p.lineTo(f(u1) + grow * 1.2, P.y1 + grow * 0.5);
    p.lineTo(f(u0) - grow * 1.2, P.y1 + grow * 0.5);
    p.closePath();
    return p;
  };
  const shimmer = 1 + 0.04 * Math.sin(t * 3.1);
  g.save();
  for (const [grow, a] of [
    [26, 0.12],
    [12, 0.18],
    [0, 0.26],
    [-14, 0.3],
  ]) {
    g.fillStyle = `rgba(255,240,206,${a * shimmer})`;
    g.fill(quad(0, 1, grow));
  }
  g.fillStyle = "rgba(150,100,84,0.2)";
  for (const u of [0.25, 0.5, 0.75]) g.fill(quad(u - 0.018, u + 0.018));
  g.restore();
}
/** 光里飘着的几粒灰（亮的） */
function motes(g: CanvasRenderingContext2D, t: number) {
  for (let i = 0; i < 9; i++) {
    const ph0 = i * 2.39;
    const x = -250 + ((i * 97) % 300) + 18 * Math.sin(t * 0.7 + ph0);
    const y = 1690 - ((t * 26 + i * 61) % 260) + 8 * Math.cos(t * 0.9 + ph0);
    const a = 0.35 * Math.max(0, Math.sin(Math.PI * (((t * 26 + i * 61) % 260) / 260)));
    drawGlow(g, x, y, 9, a);
  }
}

// ——— 门：她拧开一点（门外是黑着的楼梯间） ———
const doorAt = (t: number) => 0.8 * E.io(ph(t, M.open0, M.open1));
/** 门把手在哪（和 room.ts 的 doorFront 一样算：合页在右边门框上，门扇从侧着转过来） */
function knobAt(t: number): V2 {
  const W = DOOR.x1 - DOOR.x0;
  const w = W * Math.sin(((1 - doorAt(t)) * Math.PI) / 2);
  return [DOOR.x1 - w + 26 * (w / W), DOOR.top + 420];
}

// ——— 她：穿好铁靴站在门口，拧开门 → 他落在身边，回头看着他笑一下，站在门口不走 ———
const HER_X = -300;
const KNOB_BEND = -1;
const HER = {
  /** 站在门口，近处那只手（R）搭在门把上（IK），朝着门 */
  门口: pose(2, { face: -0.6, ...legR(5, -4, 0), ...legL(-4, -3, 0), neck: -4, expression: "平常", lookX: -0.7, lookY: 0.1 }, (l) => ({
    ...armL(6, 12, 0, "relax", l),
    // 搭在门把上的那只手由 IK 放；松开以后自然垂下来（这里写成往前举的话，IK 一撤胳膊会甩出去）
    ...armR(8, 16, 0, "grip", l),
  })),
};
const HER2 = {
  ...HER,
  /** 他落在身边：回过头低头看着他，笑了一下 */
  看他: { ...HER.门口, headTurn: -1, neck: -16, expression: "微笑" as const, smile: 0.5, lookX: -0.3, lookY: 0.6 },
};
const herMove = live(
  [
    { t: 87.9, x: 0, items: { boots: true, bricks: 2 }, p: HER2.门口 },
    { t: M.look0, p: HER2.门口 },
    // 不往外走（用户：「这里他们不用向前走」）：开着门站在门口，低头看着他笑，一直到切到街上
    { t: M.look1, ease: "inOut", p: HER2.看他 },
    { t: 94, p: HER2.看他 },
  ] as MoveKey[],
  { look: CHENGTUO, base: { wind: 0 }, idle: true, seed: 95, springs: ARMS, follow: 0 },
);

// ——— 他：天花板上的小床里睡着 → 披上外套从上面掉下来 → 落在她身边，仰头看着她笑 ———
const STONE = CAST.小石头穿妈妈的外套;
const FALL_X = -150;
/** 掉下来以前在画面上面外头（脚在这一高度） */
const FALL_Y0 = 760;
const HIM = {
  /** 往下坠：两只手往上甩着，腿并着垂下去 */
  坠: pose(-4, { face: -0.6, ground: false, ...legR(8, -14, -30), ...legL(-6, -20, -34), neck: 6, expression: "平常", lookX: -0.4, lookY: 0.4 }, (l) => ({
    ...armL(150, 30, 0, "open", l),
    ...armR(130, 40, 0, "open", l),
  })),
  /** 落地：膝盖一弯 */
  落: pose(14, { face: -0.6, ...legR(40, -70), ...legL(30, -64), neck: 0, expression: "平常", lookX: -0.6, lookY: 0.2 }, (l) => ({
    ...armL(40, 30, 0, "open", l),
    ...armR(30, 40, 0, "open", l),
  })),
  /** 站起来仰头看着她，笑 */
  看她: pose(-4, { face: -0.6, ...legR(8, -6), ...legL(-8, -6), neck: 24, expression: "笑", lookX: -0.4, lookY: -0.8 }, (l) => ({
    ...armL(8, 16, 0, "relax", l),
    ...armR(10, 20, 0, "relax", l),
  })),
};
const himMove = live(
  [
    { t: 87.9, x: 0, p: HIM.坠 },
    { t: M.land - 0.03, p: HIM.坠 },
    { t: M.land + 0.06, ease: "out", squash: 0.06, p: HIM.落 },
    { t: M.land + 0.16, ease: "out", squash: -0.02, p: { ...HIM.落, ...legR(20, -30), ...legL(14, -26) } },
    // 站在她身边仰头看着她笑，一直到切到街上
    { t: M.look1, ease: "inOut", squash: 0, p: HIM.看她 },
    { t: 94, p: HIM.看她 },
  ] as MoveKey[],
  { look: lookOf(STONE), base: { wind: 0 }, idle: true, seed: 97, springs: ARMS, follow: 0 },
);
function himAt(t: number) {
  const p: PoseIn = { ...himMove(t).pose };
  const u = ph(t, M.fall0, M.land);
  const y = t < M.land ? FALL_Y0 + (FLOOR_Y - FALL_Y0) * u * u : FLOOR_Y;
  const root: V2 = [FALL_X, y];
  return { pose: p, root, k: S, shown: t >= M.fall0 };
}

/** 她这一刻（站着按 ground 自动着地，根在两脚中间的地上）：近处那只手搭在门把上 */
function herAt(t: number) {
  const p: PoseIn = { ...herMove(t).pose };
  const root: V2 = [HER_X, FLOOR_Y];
  const s = S;
  const loc = (w: V2): V2 => [(w[0] - root[0]) / s, (w[1] - root[1]) / s];
  const W = (q: number[]): V2 => [root[0] + q[0] * s, root[1] + q[1] * s];
  // IK 对准的是手腕：按手心差多少再挪一次；肘往下垂（不然像叉腰）
  // 拉开门以后、回头看他的时候就松开门把
  const wKnob = 1 - E.io(ph(t, M.look0, M.look1 + 0.06));
  if (wKnob > 0.001) {
    const base = { ...(p.armR as object), bend: KNOB_BEND };
    const knob = knobAt(t);
    p.armR = { ...base, to: loc(knob), ik: 1 } as PoseIn["armR"];
    const palm = W(jointsOf(p).palmR);
    p.armR = { ...base, to: loc([2 * knob[0] - palm[0], 2 * knob[1] - palm[1]]), ik: wKnob } as PoseIn["armR"];
  }
  return { pose: p, root, s };
}

// ——— 天花板上他那张小床（在她的床前面，离镜头近一点）：他在里面睡着，掉下来以后空了 ———
const WOOD = "#8a5d47";
const WOOD_D = "#77503d";
const SMALL = { x0: 100, x1: 680, c: ROOM.ceil };
function smallBed(g: CanvasRenderingContext2D, t: number) {
  const { x0, x1, c } = SMALL;
  const lw = 3.6;
  const rect = (x: number, y: number, w: number, h: number) => {
    const p = new Path2D();
    p.rect(x, y, w, h);
    return p;
  };
  for (const x of [x0 + 44, x1 - 66]) part(g, rect(x, c - 4, 20, 64), WOOD, WOOD_D, lw, [4, 3]);
  part(g, rect(x0 + 4, c + 58, x1 - x0 - 8, 24), WOOD, WOOD_D, lw, [5, 4]);
  for (const [bx0, bx1, h] of [
    [x0 - 24, x0 + 4, 196],
    [x1 - 4, x1 + 24, 140],
  ]) {
    const board = new Path2D();
    board.moveTo(bx0, c + 50);
    board.lineTo(bx1, c + 50);
    board.lineTo(bx1, c + h);
    board.quadraticCurveTo((bx0 + bx1) / 2, c + h + 16, bx0, c + h);
    board.closePath();
    part(g, board, WOOD, WOOD_D, lw, [4, 3]);
  }
  const mat = new Path2D();
  mat.roundRect(x0 + 4, c + 82, x1 - x0 - 8, 46, 14);
  part(g, mat, "#efe6d8", "#ddd2c2", lw, [6, 5]);
  const pillow = new Path2D();
  pillow.roundRect(x0 + 16, c + 126, 104, 32, 14);
  part(g, pillow, "#f7f0e4", "#e6ddcf", lw * 0.9, [4, 4]);
  // 他：脱了外套、脱了鞋，躺着（倒钉的床，背贴着床垫），头枕在枕头上，睡着（掉下来以后就不在了）
  const asleep = t < M.fall0 - 0.05;
  if (asleep) {
    const p = pose(0, { face: -1, ground: false, ...legR(4, -6, -20), ...legL(0, -4, -16), neck: -10, expression: "闭眼", smile: 0.5, blush: 0.4 }, () => ({
      shoulderL: 14,
      elbowL: 20,
      wristL: 0,
      handL: "relax",
      shoulderR: 20,
      elbowR: 16,
      wristR: 0,
      handR: "relax",
    }));
    // 按胯放：胯在床垫底下，整个人转成横着（头朝左枕在枕头上，脸朝下）
    const k = ROOM.s * 1.04;
    const j = castJoints(STONE_BED, p as PoseIn);
    const hip: V2 = [x0 + 258, c + 178];
    g.save();
    g.translate(hip[0], hip[1]);
    g.rotate(-Math.PI / 2);
    g.scale(k, k);
    g.translate(-j.hip[0], -j.hip[1]);
    drawPerson(g, STONE_BED, p as PoseIn, 0, 0, 1.3);
    g.restore();
  }
  // 芥末黄的小方格被子（他在里面时鼓起来盖到胸口，空了以后平平地捆在床垫下面）
  const full = asleep ? 1 : 0;
  const q = new Path2D();
  const top = c + 120;
  const qx0 = x0 + 128;
  const qx1 = x1 - 30;
  const low = top + 24 + 62 * full;
  q.moveTo(qx0, top);
  q.quadraticCurveTo(qx0 - 4, low, qx0 + 40, low + 4);
  q.lineTo(qx1 - 40, low + 6);
  q.quadraticCurveTo(qx1, low + 2, qx1, top);
  q.closePath();
  part(g, q, "#d9a63a", "#c08e2a", lw, [5, 4]);
  g.save();
  g.clip(q);
  g.strokeStyle = "rgba(255,240,200,0.35)";
  g.lineWidth = 2;
  for (let x = qx0; x < qx1; x += 22) {
    g.beginPath();
    g.moveTo(x, top);
    g.lineTo(x, low + 10);
    g.stroke();
  }
  for (let y = top + 11; y < low + 10; y += 22) {
    g.beginPath();
    g.moveTo(qx0, y);
    g.lineTo(qx1, y);
    g.stroke();
  }
  g.restore();
}

/** 她解开以后扔在椅子边上的脚绳（一头还拴在椅子后腿上，松松地堆在地上） */
function looseRope(g: CanvasRenderingContext2D) {
  const p = new Path2D();
  p.moveTo(KNOT[0], KNOT[1]);
  p.quadraticCurveTo(KNOT[0] + 10, ROOM.floor + 20, KNOT[0] - 60, ROOM.floor + 26);
  p.ellipse(KNOT[0] - 100, ROOM.floor + 26, 44, 10, 0, 0, Math.PI * 1.8);
  p.quadraticCurveTo(KNOT[0] - 170, ROOM.floor + 34, KNOT[0] - 210, ROOM.floor + 30);
  strokeRope(g, p, 5);
  const box = new Path2D();
  box.rect(KNOT[0] - 10, KNOT[1] - 9, 20, 18);
  part(g, box, "#a08a6e", null, 3);
}

/** 这一刻屋里的样子：早上的光、灯灭着；天花板上她的床空了（被子平着），他的小床在前面；她、他画在门扇前面 */
export function morningAway(t: number): RoomAway {
  const her = herAt(t);
  const him = himAt(t);
  return {
    lamp: 0,
    day: 1,
    boots: false,
    quilt: 0,
    door: doorAt(t),
    floor: (g) => sunPatch(g, t),
    visitor: (g) => {
      smallBed(g, t);
      looseRope(g);
    },
    front: (g) => {
      // 他先画（站在她身后一点）
      if (him.shown) {
        g.save();
        g.translate(him.root[0], him.root[1]);
        g.scale(him.k, him.k);
        drawPerson(g, STONE, him.pose, 0, 0, 1.4);
        g.restore();
      }
      g.save();
      g.translate(her.root[0], her.root[1]);
      g.scale(her.s, her.s);
      drawChengtuo(g, her.pose, { line: 0.8 });
      g.restore();
    },
    after: (g) => {
      drawGlow(g, -110, 1700, 300, 0.24 + 0.04 * Math.sin(t * 2.7));
      motes(g, t);
    },
  };
}

/**
 * 侧面的镜头（屋子坐标的取景）：从天花板底下的两张床往下、往左摇到门口的她（溶的时候和仰头看的画面一起走；溶完自己 E.settle 落到门口），
 * 落在门口的她和她身边（他会从上面掉下来的地方）；之后很慢地凑近一点，他落地「咚」一沉
 */
export function morningCam(t: number): Cam {
  const z0 = 1.3;
  // 溶的时候跟着仰头看的画面一起往下走（downPx），溶完以后自己落到门口
  const k = Math.max(downPx(t) / DOWN_PX, E.settle(ph(t, M.start, M.land0)));
  const off = (1 - k) * (DOWN_PX / z0);
  const h = ph(t, M.land0 - 0.2, M.land0 + 0.3);
  const dx = 3 * h * (0.6 * Math.sin(t * 0.83) + 0.4 * Math.sin(t * 1.37 + 1.1));
  const dy = 3 * h * (0.6 * Math.sin(t * 0.71 + 2) + 0.4 * Math.sin(t * 1.19));
  let c = aimRoom([360 + (-230 - 360) * k + dx / z0, 1190 - off + dy / z0], 540, 960, z0);
  // 落到门口以后很慢地凑近一点（两个人站在门口不走）
  c = camLerp(c, aimRoom([-250, 1220], 540, 960, 1.4), E.soft(ph(t, M.land0, M.end + 0.3)));
  const kk = kick(t, M.land, 0.1);
  return { ...c, z: c.z * (1 + 0.015 * kk), y: c.y + (5 * kk * Math.sin((t - M.land) * 60)) / c.z };
}
