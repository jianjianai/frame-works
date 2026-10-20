// 主歌二⑦「请你等等我」第一句（83.85–85.8；请 83.85 你 84.24 等 84.45 等 84.6 我 84.81；85.0 重拍、85.52 一拍，85.6–86.0 音乐收住一下）：
// 时间往后跳一点。接着⑥手牵手浮在半空的两个人，镜头往上抬（越抬越快），一边抬一边溶成仰头看天花板：她那张倒钉着的床旁边
// 多了一张倒钉着的小床，两个人各自躺在床里，隔着两张床中间那道缝手牵着手；系在一起的两根绳子从两个人的脚踝垂下去（拴在下面的椅子腿上）。
// 镜头顺着绳子往上，落在两张脸和牵着的手上。她看着睡着的他，伸手拉一下床头的拉线开关，85.52「咔」台灯灭了；
// 屋里黑下来，窗外白的光透过铁栏照上天花板，一道一道。她闭上眼。
// 侧面看两张床只能头对头，他的胳膊太短，隔着两个床头够不着她的手——所以这里是仰头看：两张床并排钉在头顶，中间一道缝。
// 主歌二⑧「请你等等我」第二句（85.8–88.02；请 85.8 你 86.25 等 86.43 等 86.61 我 86.79；85.76–86.5 很静，86.5 起越来越满，88.02 下一段）：
// 还是这个镜头，一夜过去：冷光一道道慢慢移走、越来越淡；天亮了，屋里亮起来，晨光从脚那头一道道往上爬，87.85 爬到两张脸上
// （窗那边的他先照到）。两个人在睡梦里动了一下，手一直牵着；晨光照到他脸上，88.02 他睁开眼（下一段「三 明天见」：他先醒）。
// 镜头很慢地往后退、转一点点。
// 仰头看的画面另起一套坐标（「天花板坐标」）：画面里朝上是床头（屋子里的左边），朝右是窗那边（离镜头近的那边，小床在她的床和窗之间），
// 大小和屋子坐标一样（屋子坐标 x = 天花板坐标 y + 1020）。

import { type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { CAST, type CastSpec, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, H, W, ph } from "./cam";
import { INK, TOWER_HOME, addEllipse, part } from "./world";
import { ARMS, live } from "./motion";
import { legL, legR } from "./poses";
import { pose } from "./dawn";
import { drawPerson } from "./people";
import { ROOM } from "./room";
import { FLOAT_T } from "./sill";
import { homeWindow } from "./night";

type V2 = [number, number];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

export const BED_T = {
  start: FLOAT_T.end,
  /** 溶成仰头看天花板（时间在这里跳过去） */
  mix0: 83.92,
  mix1: 84.25,
  /** 镜头一路往上抬：从⑥的取景柔和起步，溶完最快，一路减速落在两张脸和牵着的手上（84.7 走完八成，85.0 差不多停住） */
  tilt1: 85.3,
  /** 她伸手去够床头的拉线开关、「咔」拉下去、松手放回被子里 */
  reach: 85.12,
  click: beatAt(171),
  back: 85.57,
  /** 闭上眼 */
  close: 85.58,
  end: 85.8,
};
const B = BED_T;

export const DAWN_T = {
  start: BED_T.end,
  /** 夜深：冷光一道道往画面下面（屋子右边）慢慢移，越来越淡 */
  night0: 86.25,
  night1: 86.95,
  /** 天亮：屋里亮起来，晨光从脚那头一道道往上爬，爬到两张脸上 */
  dawn0: 86.85,
  dawn1: 87.85,
  /** 晨光照到他脸上，睁开眼（下一段第一拍） */
  wake: 87.94,
  end: beatAt(176),
};
const D = DAWN_T;

/**
 * 三①（88.02 起，lib/morning.ts）镜头往下摇回侧面的屋子（和⑦往上抬反过来）：仰头看的画面朝脚那头走（画面上的东西往上走），
 * 侧面的屋子往下摇，两边一起用这一个量（画面像素），溶的时候往同一个方向、同样快
 */
export const DOWN_PX = 600;
export const downPx = (t: number) => DOWN_PX * E.settle(ph(t, D.end, D.end + 1.08));

/** 镜头往上抬了多少（画面像素）：两个画面一起用这一个量，溶的时候侧面和仰头看的画面往同一个方向、同样快地走 */
export const TILT_PX = 900;
export const tiltPx = (t: number) => TILT_PX * E.settle(ph(t, B.start, B.tilt1));
/** 仰头看的画面盖上来多少 */
export const bedMix = (t: number) => E.soft(ph(t, B.mix0, B.mix1));

// ——— 两张床（天花板坐标；床板、床垫、枕头、床头板、床尾板，从下往上看） ———
export const HER_BED = { x0: -338, x1: -12, y0: -408, y1: 348 };
export const HIS_BED = { x0: 62, x1: 292, y0: -398, y1: 132 };
const WOOD = "#8c5f47";
const WOOD_D = "#74493a";

/** 她、他的头（脸的中心）枕在枕头上的地方 */
export const HER_HEAD: V2 = [-175, -318];
export const HIS_HEAD: V2 = [177, -300];
/** 两只手隔着缝牵在一起的地方（他的胳膊短：离他近一点） */
export const CLASP: V2 = [36, -196];
/** 床头板上的拉线开关（她的床头，靠她远处那只手那边） */
const SWITCH: V2 = [-246, -417];

const HER_S = ROOM.s;
/** 脱了外套、脱了鞋（鞋摆在下面地上，和她的铁靴在一起） */
export const STONE_BED: CastSpec = { ...CAST.小石头, coat: undefined, shoes: "bare" };

// ——— 两个人：正面躺着（从下往上看就是正面），腿伸直，被子盖到胸口 ———
// 正面躺着：face 不能过 0（过了 0 整个人镜像，左右手对调）；头往他那边转用 headTurn（正 = 往画面右边转）
export const HER = {
  /** 醒着，转过头看着睡着的他，嘴角带一点笑 */
  看他: pose(0, { face: -0.02, headTurn: 0.42, ground: false, ...legR(3, -2, 0), ...legL(-3, -2, 0), neck: 0, expression: "微笑", smile: 0.5, blush: 0.4, lookX: 0.9, lookY: 0.15 }, () => ({
    shoulderL: 30,
    elbowL: 20,
    wristL: 0,
    handL: "grip",
    shoulderR: 10,
    elbowR: 10,
    wristR: 0,
    handR: "relax",
  })),
  /** 抬眼看床头的开关，远处那只手伸上去 */
  够: pose(0, { face: -0.02, headTurn: -0.12, ground: false, ...legR(3, -2, 0), ...legL(-3, -2, 0), neck: -6, expression: "微笑", smile: 0.35, blush: 0.4, lookX: -0.45, lookY: -1 }, () => ({
    shoulderL: 30,
    elbowL: 20,
    wristL: 0,
    handL: "grip",
    shoulderR: 10,
    elbowR: 10,
    wristR: 0,
    handR: "grip",
  })),
  /** 关了灯：转回来看着他，闭上眼 */
  睡: pose(0, { face: -0.02, headTurn: 0.32, ground: false, ...legR(3, -2, 0), ...legL(-3, -2, 0), neck: 0, expression: "闭眼", smile: 0.45, blush: 0.4 }, () => ({
    shoulderL: 30,
    elbowL: 20,
    wristL: 0,
    handL: "grip",
    shoulderR: 10,
    elbowR: 10,
    wristR: 0,
    handR: "relax",
  })),
};
export const HIM = {
  /** 睡着了：脸朝着她那边，嘴角带笑 */
  睡: pose(0, { face: -0.3, headTurn: -0.08, ground: false, ...legR(3, -2, 0), ...legL(-3, -2, 0), neck: 0, expression: "闭眼", smile: 0.5, blush: 0.5 }, () => ({
    shoulderL: 10,
    elbowL: 10,
    wristL: 0,
    handL: "relax",
    shoulderR: -30,
    elbowR: -20,
    wristR: 0,
    handR: "grip",
  })),
};
const herMove = live(
  [
    { t: 83.8, x: 0, items: { boots: false, bricks: 0, gloves: false }, p: HER.看他 },
    { t: B.reach - 0.1, p: HER.看他 },
    { t: B.reach + 0.24, ease: "inOut", p: HER.够 },
    { t: B.click + 0.06, p: HER.够 },
    { t: B.back + 0.16, ease: "inOut", p: { ...HER.睡, expression: "微笑", lookX: 0.6, lookY: 0.1 } },
    { t: B.close + 0.16, ease: "inOut", p: HER.睡 },
    // ⑧ 睡梦里往他那边又转了一点
    { t: 86.36, p: HER.睡 },
    { t: 86.62, ease: "inOut", p: { ...HER.睡, headTurn: 0.5, smile: 0.55 } },
    { t: 90, p: { ...HER.睡, headTurn: 0.5, smile: 0.55 } },
  ] as MoveKey[],
  { look: CHENGTUO, base: { wind: 0 }, idle: true, seed: 91, springs: ARMS, follow: 0 },
);
const himMove = live(
  [
    { t: 83.8, x: 0, p: HIM.睡 },
    // ⑧ 睡梦里笑了一下；晨光照到脸上，睁开眼（先半睁，再睁开，往上看）
    { t: 86.7, p: HIM.睡 },
    { t: 86.95, ease: "inOut", p: { ...HIM.睡, smile: 0.7 } },
    { t: D.wake - 0.02, p: { ...HIM.睡, smile: 0.4 } },
    { t: D.wake, p: { ...HIM.睡, expression: "平常", blink: 0.6, smile: 0.15, lookX: -0.2, lookY: -0.3 } },
    { t: D.end, ease: "out", p: { ...HIM.睡, expression: "平常", blink: 0.22, smile: 0.15, lookX: -0.5, lookY: -0.1 } },
    { t: 90, p: { ...HIM.睡, expression: "平常", blink: 0.22, smile: 0.15, lookX: -0.5, lookY: -0.1 } },
  ] as MoveKey[],
  { look: lookOf(STONE_BED), base: { wind: 0 }, idle: true, seed: 93, springs: ARMS, follow: 0 },
);

/** 拉线开关的线头（珠子）在哪：垂向镜头（画面里朝画面中心外偏一点）；她攥住往下一拉，松手弹回去 */
function beadAt(t: number): V2 {
  const pull = E.in2(ph(t, B.click - 0.1, B.click)) * (1 - E.out(ph(t, B.click + 0.04, B.click + 0.2)));
  const sway = 3 * Math.sin(t * 2.2) * (1 - pull);
  return [SWITCH[0] - 10 - 12 * pull + sway, SWITCH[1] - 26 - 30 * pull];
}

function herAt(t: number) {
  return placeHer({ ...herMove(t).pose }, CLASP, mix([HER_BED.x0 + 70, -120], beadAt(t), E.io(ph(t, B.reach, B.reach + 0.3)) * (1 - E.io(ph(t, B.back, B.back + 0.22)))));
}
/** 她躺在床里（头枕在枕头上）：近处那只手 IK 到 hand（隔着缝牵手），远处那只到 far（平时在被子里） */
export function placeHer(p: PoseIn, hand: V2, far: V2) {
  const j0 = jointsOf(p);
  const root: V2 = [HER_HEAD[0] - j0.head[0] * HER_S, HER_HEAD[1] - j0.head[1] * HER_S];
  const loc = (q: V2): V2 => [(q[0] - root[0]) / HER_S, (q[1] - root[1]) / HER_S];
  // 近处（画面右边）那只手伸出被子，隔着缝攥着他的手（前臂搭在被子外面）
  p.armL = { ...(p.armL as object), to: loc(hand), ik: 1, chest: "over" } as PoseIn["armL"];
  // 远处那只手平时放在被子里身边；去够床头的开关时从被子里伸出来，攥住拉下去，松手放回去
  p.armR = { ...(p.armR as object), to: loc(far), ik: 1, chest: "under" } as PoseIn["armR"];
  const j = jointsOf(p);
  const at = (q: number[]): V2 => [root[0] + q[0] * HER_S, root[1] + q[1] * HER_S];
  return { pose: p, root, ankleL: at(j.ankleL), ankleR: at(j.ankleR) };
}
function himAt(t: number) {
  return placeHim({ ...himMove(t).pose }, CLASP, [HIS_BED.x1 - 50, -150]);
}
/** 他躺在床里：靠她那边那只手 IK 到 near（攥着她的手，搭在被子外面），另一只到 other（在被子里） */
export function placeHim(p: PoseIn, near: V2, other: V2) {
  const s = HER_S;
  const j0 = castJoints(STONE_BED, p);
  const root: V2 = [HIS_HEAD[0] - j0.head[0] * s, HIS_HEAD[1] - j0.head[1] * s];
  const sc = s * STONE_BED.scale;
  const loc = (q: V2): V2 => [(q[0] - root[0]) / sc, (q[1] - root[1]) / sc];
  // 靠她那边（画面左边）那只手伸出被子攥着她的手；另一只放在被子里
  p.armR = { ...(p.armR as object), to: loc(near), ik: 1, chest: "over" } as PoseIn["armR"];
  p.armL = { ...(p.armL as object), to: loc(other), ik: 1, chest: "under" } as PoseIn["armL"];
  const j = castJoints(STONE_BED, p);
  const at = (q: number[]): V2 => [root[0] + q[0] * s, root[1] + q[1] * s];
  return { pose: p, root, ankleL: at(j.ankleL), ankleR: at(j.ankleR) };
}

// ——— 画 ———
let LW = 1;
const L = (v: number) => v * LW;

/** 一张床从下往上看：床板（四周露出一圈）、床头板和床尾板（横着的一条木板）、床垫、枕头 */
function bedFrame(g: CanvasRenderingContext2D, b: { x0: number; y0: number; x1: number; y1: number }, pillow: [number, number, number, number]) {
  const board = new Path2D();
  board.roundRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 8);
  part(g, board, WOOD, WOOD_D, L(4), [5, 4]);
  const mat = new Path2D();
  mat.roundRect(b.x0 + 9, b.y0 + 6, b.x1 - b.x0 - 18, b.y1 - b.y0 - 12, 16);
  part(g, mat, "#efe6d8", "#ddd2c2", L(4), [6, 5]);
  const pl = new Path2D();
  pl.roundRect(pillow[0], pillow[1], pillow[2], pillow[3], 26);
  part(g, pl, "#f7f0e4", "#e6ddcf", L(3.5), [4, 4]);
  // 枕头中间一道压出来的凹
  g.strokeStyle = "rgba(200,188,170,0.6)";
  g.lineWidth = L(3);
  g.beginPath();
  g.moveTo(pillow[0] + 20, pillow[1] + pillow[3] * 0.55);
  g.quadraticCurveTo(pillow[0] + pillow[2] / 2, pillow[1] + pillow[3] * 0.75, pillow[0] + pillow[2] - 20, pillow[1] + pillow[3] * 0.55);
  g.stroke();
}
/** 床头板、床尾板（离镜头近：画在床垫、人的前面那一层之前，它们本来就在床的两头） */
function bedEnds(g: CanvasRenderingContext2D, b: { x0: number; y0: number; x1: number; y1: number }) {
  for (const [y, h] of [
    [b.y0 - 24, 30],
    [b.y1 - 8, 22],
  ]) {
    const p = new Path2D();
    p.roundRect(b.x0 - 8, y, b.x1 - b.x0 + 16, h, 6);
    part(g, p, WOOD, WOOD_D, L(4), [4, 3]);
  }
}

/** 被子：盖到胸口（上沿翻过来一道浅色的边），两根捆被子的带子；pattern 被面的花样 */
function quilt(g: CanvasRenderingContext2D, x0: number, x1: number, top: number, bottom: number, color: [string, string], kind: "grid" | "check", straps: number[], t: number) {
  const breath = 1.5 * Math.sin(t * 4.2);
  const path = new Path2D();
  path.moveTo(x0 - 4, top + 6);
  path.quadraticCurveTo((x0 + x1) / 2, top - 6 - breath, x1 + 4, top + 6);
  path.lineTo(x1 + 6, bottom - 14);
  path.quadraticCurveTo(x1 + 6, bottom + 4, x1 - 16, bottom + 2);
  path.quadraticCurveTo((x0 + x1) / 2, bottom + 10, x0 + 16, bottom + 2);
  path.quadraticCurveTo(x0 - 6, bottom + 4, x0 - 6, bottom - 14);
  path.closePath();
  part(g, path, color[0], color[1], L(4), [6, 5]);
  g.save();
  g.clip(path);
  if (kind === "grid") {
    g.strokeStyle = "rgba(240,236,228,0.35)";
    g.lineWidth = L(3);
    for (let x = x0 + 18; x < x1; x += 34) {
      g.beginPath();
      g.moveTo(x, top - 20);
      g.lineTo(x, bottom + 20);
      g.stroke();
    }
    for (let y = top + 30; y < bottom; y += 34) {
      g.beginPath();
      g.moveTo(x0 - 10, y);
      g.lineTo(x1 + 10, y);
      g.stroke();
    }
  } else {
    g.fillStyle = "rgba(255,246,214,0.22)";
    for (let y = top + 24; y < bottom; y += 44) for (let x = x0 + ((Math.floor((y - top) / 44) % 2) * 22); x < x1; x += 44) g.fillRect(x, y, 22, 22);
  }
  // 翻过来的上沿
  const fold = new Path2D();
  fold.moveTo(x0 - 4, top + 6);
  fold.quadraticCurveTo((x0 + x1) / 2, top - 6 - breath, x1 + 4, top + 6);
  fold.lineTo(x1 + 4, top + 30);
  fold.quadraticCurveTo((x0 + x1) / 2, top + 20 - breath, x0 - 4, top + 30);
  fold.closePath();
  g.fillStyle = "#f3ece0";
  g.fill(fold);
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = L(3);
  g.beginPath();
  g.moveTo(x0 - 4, top + 30);
  g.quadraticCurveTo((x0 + x1) / 2, top + 20 - breath, x1 + 4, top + 30);
  g.stroke();
  // 捆被子的带子（不捆着，被子就飘走了）
  for (const y of straps) {
    const s = new Path2D();
    s.rect(x0 - 10, y - 7, x1 - x0 + 20, 14);
    part(g, s, "#a08a6e", "#8c775c", L(3), [2, 2]);
  }
}

/** 绳子（墨线描边、麻色或红色），w 宽 */
function strokeRope(g: CanvasRenderingContext2D, path: Path2D, w: number, color: string) {
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = INK;
  g.lineWidth = L(w + 4);
  g.stroke(path);
  g.strokeStyle = color;
  g.lineWidth = L(w);
  g.stroke(path);
}
/**
 * 系在一起的两根绳子：从两个人的脚踝垂下去（朝着镜头，越往下离镜头越近、越粗），往一处收，拴在下面的椅子腿上（在画面外）。
 * 一段一段画，越往下越粗
 */
function ropes(g: CanvasRenderingContext2D, her: V2, him: V2, untie = 0) {
  const meet: V2 = [-20, 1000];
  const N = 14;
  // 他的红绳从脚踝上解下来以后，绳头顺着绳子往下掉（越掉越快）
  const f = untie * untie;
  const hisTop: V2 = [him[0] + (meet[0] - him[0]) * 0.5 * f, him[1] + (meet[1] - him[1]) * f];
  for (const [a, color, w0] of [
    [hisTop, "#d8352b", 3.6],
    [her, "#a08a6e", 5],
  ] as [V2, string, number][]) {
    const c: V2 = [a[0] * 0.85 + meet[0] * 0.15, a[1] + 300];
    const pts: V2[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      pts.push([(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * c[0] + u * u * meet[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * c[1] + u * u * meet[1]]);
    }
    // 先把整根的墨线描完，再上色（一段一段接着画会在接头露出墨点）
    g.lineCap = "round";
    for (const [extra, col] of [
      [4, INK],
      [0, color],
    ] as [number, string][]) {
      g.strokeStyle = col;
      for (let i = 1; i <= N; i++) {
        g.lineWidth = L(w0 * (1 + 1.6 * ((i - 0.5) / N)) + extra);
        g.beginPath();
        g.moveTo(pts[i - 1][0], pts[i - 1][1]);
        g.lineTo(pts[i][0], pts[i][1]);
        g.stroke();
      }
    }
  }
}
/** 脚踝上绕的一圈 */
function ankleLoop(g: CanvasRenderingContext2D, a: V2, w: number, color: string) {
  const p = new Path2D();
  addEllipse(p, a[0], a[1] + 4, 16, 6);
  strokeRope(g, p, w, color);
}

/** 拉线开关：床头板上一个白色的小圆盒，一根线垂下来，线头一颗珠子；还有一根电线顺着床头往左牵出去（牵到下面桌上的台灯） */
function lightSwitch(g: CanvasRenderingContext2D, t: number) {
  const [sx, sy] = SWITCH;
  g.strokeStyle = INK;
  g.lineWidth = L(4);
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(sx, sy);
  g.lineTo(-352, sy - 2);
  g.quadraticCurveTo(-380, sy - 4, -420, sy - 60);
  g.lineTo(-700, sy - 400);
  g.stroke();
  const box = new Path2D();
  addEllipse(box, sx, sy, 18, 14);
  part(g, box, "#f4efe6", "#ddd6ca", L(3), [2, 2]);
  const b = beadAt(t);
  g.strokeStyle = "#e9e0cf";
  g.lineWidth = L(2.4);
  g.beginPath();
  g.moveTo(sx, sy);
  g.lineTo(b[0], b[1]);
  g.stroke();
  const bead = new Path2D();
  addEllipse(bead, b[0], b[1], 8, 8);
  part(g, bead, "#f4efe6", "#d9d0c0", L(2.4), [1.5, 1.5]);
}

/** 天花板：和屋子一样的深色，一道道很淡的木条（屋顶板） */
function ceiling(g: CanvasRenderingContext2D) {
  g.fillStyle = "#6a5260";
  g.fillRect(-1600, -2000, 3200, 4000);
  g.strokeStyle = "rgba(40,24,34,0.16)";
  g.lineWidth = L(3);
  for (let y = -1980; y < 2000; y += 96) {
    g.beginPath();
    g.moveTo(-1600, y);
    g.lineTo(1600, y);
    g.stroke();
  }
}

/** 窗上那扇铁栅栏门的竖条在天花板坐标里的位置（窗外的光透过它们，在天花板上投下一道道影子） */
let BARS: number[] | null = null;
function barsY() {
  if (BARS) return BARS;
  const w = homeWindow();
  const u = TOWER_HOME.fh / 128;
  const kr = w.h / 1920;
  const hx = w.x - 8 * u;
  const span = w.w + 16 * u;
  BARS = [];
  for (let k = 0; k <= 9; k++) BARS.push(540 + (hx + (span * k) / 9 - (w.x + w.w / 2)) / kr - 1020);
  return BARS;
}

/** 台灯亮着多少（「咔」一下灭掉，灯丝暗下去那一下） */
export function bedLamp(t: number) {
  const d = t - B.click;
  if (d <= 0) return 1;
  return d < 0.03 ? 0.35 : d < 0.06 ? 0.12 : 0;
}
/** 窗外白的冷光：关了灯以后眼睛慢慢适应，一道道亮起来 */
export function bedMoon(t: number) {
  return E.soft(ph(t, B.click + 0.05, B.click + 0.85));
}

/** 夜里的冷光 → 天亮：冷光强弱、往下移了多少，屋里亮了多少，晨光爬到了哪（这一 y 以下照得到） */
function nightAt(t: number) {
  const moon = bedMoon(t) * (1 - 0.92 * E.soft(ph(t, D.night0, D.night1)));
  const drift = 230 * E.in2(ph(t, B.click + 0.4, D.night1));
  const dawn = E.soft(ph(t, D.dawn0, D.dawn1 + 0.1));
  const edge = 700 - 1450 * E.soft(ph(t, D.dawn0, D.dawn1));
  const sun = E.soft(ph(t, D.dawn0, D.dawn0 + 0.45));
  return { moon, drift, dawn, edge, sun };
}

/** 铁栏之间一道道的光：斜着（往右每走 1，往上 slant），往下挪 shift；每道光两边各收一层（边是软的），clip 里按 fill 画 */
function barBands(g: CanvasRenderingContext2D, shift: number, slant: number, alphas: [number, number], fill: (a: number) => void) {
  const bars = barsY();
  for (const [inset, a] of [
    [8, alphas[0]],
    [20, alphas[1]],
  ]) {
    const band = new Path2D();
    for (let i = 0; i + 1 < bars.length; i++) band.rect(-1600, bars[i] + shift + inset, 3200, bars[i + 1] - bars[i] - 2 * inset);
    g.save();
    g.transform(1, -slant, 0, 1, 0, 0);
    g.clip(band);
    g.setTransform(g.getTransform().multiply(new DOMMatrix([1, slant, 0, 1, 0, 0])));
    fill(a);
    g.restore();
  }
}

/**
 * 灯光：台灯在下面桌上（画面左上方外面，靠墙那边），把天花板照暖；灭了以后屋里是深蓝的黑，只剩窗那边（画面右边）透进来的冷光，
 * ⑧ 冷光移走、淡下去；天亮以后屋里亮起来（窗那边亮），晨光一道道从脚那头往上爬
 */
function light(g: CanvasRenderingContext2D, t: number) {
  const on = bedLamp(t);
  const n = nightAt(t);
  const L0: V2 = [-400, -560];
  const W0: V2 = [760, -160];
  const mixA = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const lampC = [
    [255, 248, 236],
    [242, 216, 194],
    [172, 132, 142],
    [80, 58, 86],
  ];
  const nightC = [
    [52, 56, 92],
    [52, 56, 92],
    [40, 44, 78],
    [26, 28, 54],
  ];
  const mornC = [
    [255, 248, 236],
    [248, 230, 212],
    [214, 190, 178],
    [160, 138, 138],
  ];
  const c = [0, 0.32, 0.62, 1].map((k, i) => [k, mixA(mixA(nightC[i], mornC[i], n.dawn), lampC[i], on)] as [number, number[]]);
  const C: V2 = [L0[0] + (W0[0] - L0[0]) * n.dawn, L0[1] + (W0[1] - L0[1]) * n.dawn];
  g.save();
  g.globalCompositeOperation = "multiply";
  const gr = g.createRadialGradient(C[0], C[1], 0, C[0], C[1], 1900);
  for (const [k, col] of c) gr.addColorStop(k, `rgb(${col.join(",")})`);
  g.fillStyle = gr;
  g.fillRect(-1600, -2000, 3200, 4000);
  g.restore();
  for (const [P, k, col] of [
    [L0, 0.9 * on, "255,190,110"],
    [W0, 0.35 * n.dawn, "255,200,150"],
  ] as [V2, number, string][]) {
    if (k <= 0.01) continue;
    g.save();
    g.globalCompositeOperation = "soft-light";
    const warm = g.createRadialGradient(P[0], P[1], 0, P[0], P[1], 1100);
    warm.addColorStop(0, `rgba(${col},${k})`);
    warm.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = warm;
    g.fillRect(-1600, -2000, 3200, 4000);
    g.restore();
  }
  g.save();
  if (n.moon > 0.01) {
    // 冷光：先把暗处提起来一点（眼睛适应了），再一道道光（铁栏的竖条之间）。光用 color-dodge 叠：按比例提亮（墨线还是黑的、
    // 颜色还在，不像 screen 那样蒙一层雾）
    g.globalCompositeOperation = "screen";
    g.fillStyle = `rgba(52,62,104,${0.16 * n.moon})`;
    g.fillRect(-1600, -2000, 3200, 4000);
    g.globalCompositeOperation = "color-dodge";
    barBands(g, BAR_SHIFT + n.drift, BAR_SLANT, [0.45, 0.45], (a) => {
      const cg = g.createLinearGradient(420, 0, -520, 0);
      cg.addColorStop(0, `rgba(100,110,132,${a * n.moon})`);
      cg.addColorStop(0.5, `rgba(90,100,124,${a * 0.65 * n.moon})`);
      cg.addColorStop(1, "rgba(80,90,116,0)");
      g.fillStyle = cg;
      g.fillRect(-1600, -2000, 3200, 4000);
    });
  }
  if (n.sun > 0.01) {
    // 晨光：只照到爬上来的那条边以下（边是软的：边上 256 宽分八条，一条比一条亮），窗那边（他）亮、往墙那边淡
    g.globalCompositeOperation = "color-dodge";
    const steps = 8;
    const ramp = 32;
    barBands(g, sunShift(), SUN_SLANT, [0.44, 0.46], (a) => {
      for (let i = 0; i <= steps; i++) {
        const k = i < steps ? (i + 0.5) / steps : 1;
        const cg = g.createLinearGradient(420, 0, -560, 0);
        cg.addColorStop(0, `rgba(136,118,94,${a * k * n.sun})`);
        cg.addColorStop(0.5, `rgba(122,106,86,${a * 0.7 * k * n.sun})`);
        cg.addColorStop(1, "rgba(110,96,80,0)");
        g.fillStyle = cg;
        g.fillRect(-1600, n.edge + i * ramp, 3200, i < steps ? ramp : 4000);
      }
    });
    g.globalCompositeOperation = "screen";
    // 晨光落在他脸上那一下：脸上一团暖光
    const f = E.soft(ph(t, D.dawn1 - 0.2, D.wake));
    if (f > 0.01) {
      const sg = g.createRadialGradient(HIS_HEAD[0], HIS_HEAD[1], 0, HIS_HEAD[0], HIS_HEAD[1], 110);
      sg.addColorStop(0, `rgba(255,222,170,${0.35 * f})`);
      sg.addColorStop(1, "rgba(255,222,170,0)");
      g.fillStyle = sg;
      g.fillRect(HIS_HEAD[0] - 120, HIS_HEAD[1] - 120, 240, 240);
    }
  }
  g.restore();
}
/** 铁栏的影子斜多少（往右每走 1，往上 BAR_SLANT） */
const BAR_SLANT = 0.32;
/** 铁栏的影子往下（往屋子右边）挪多少：挪到两张脸落在一道光里 */
const BAR_SHIFT = 90;
/** 晨光斜得平一点（太阳低） */
const SUN_SLANT = 0.18;
/** 晨光的一道光正好落在他脸上：按铁栏的位置算挪多少 */
let SUN_SHIFT: number | null = null;
function sunShift() {
  if (SUN_SHIFT !== null) return SUN_SHIFT;
  const bars = barsY();
  const want = HIS_HEAD[1] + SUN_SLANT * HIS_HEAD[0];
  let best = 0;
  for (let i = 0; i + 1 < bars.length; i++) {
    const d = want - (bars[i] + bars[i + 1]) / 2;
    if (i === 0 || Math.abs(d) < Math.abs(best)) best = d;
  }
  return (SUN_SHIFT = best);
}

/**
 * 画仰头看的天花板（画布已经按 base 设好；cam 是天花板坐标里的镜头）：天花板、两张床、床里的两个人、被子、牵着的手、
 * 系在一起的两根绳子、拉线开关，最后是灯光
 */
/**
 * 别的段落用这个画面时换掉的东西：两个人（按 placeHer / placeHim 放好）、灯光按主歌二的哪一刻算、他的红绳解下来了多少、
 * 他那床被子的上沿
 */
export interface CeilingCast {
  her: ReturnType<typeof placeHer>;
  him: ReturnType<typeof placeHim>;
  lightT: number;
  untie?: number;
  hisQuiltTop?: number;
}
export function drawCeiling(g: CanvasRenderingContext2D, base: DOMMatrix, t: number, cam: Cam, cast?: CeilingCast) {
  g.setTransform(base);
  g.translate(W / 2, H / 2);
  if (cam.r) g.rotate(cam.r);
  g.scale(cam.z, cam.z);
  g.translate(-cam.x, -cam.y);
  LW = Math.max(0.45, Math.min(1, 1 / Math.sqrt(cam.z)));
  ceiling(g);
  const her = cast?.her ?? herAt(t);
  const him = cast?.him ?? himAt(t);
  bedFrame(g, HER_BED, [-300, -394, 250, 84]);
  bedFrame(g, HIS_BED, [90, -372, 176, 72]);
  // 两个人：被子画在身子前面、两只前臂后面（前臂搭在被子外面）
  const ceilM = g.getTransform();
  const underArms = (fn: () => void) => (cc: CanvasRenderingContext2D) => {
    cc.save();
    cc.setTransform(ceilM);
    fn();
    cc.restore();
  };
  g.save();
  g.translate(her.root[0], her.root[1]);
  g.scale(HER_S, HER_S);
  drawChengtuo(g, her.pose, { line: LW, beforeFrontArms: underArms(() => quilt(g, HER_BED.x0 + 8, HER_BED.x1 - 8, -230, 196, ["#7f93a8", "#6d8196"], "grid", [-160, 10], t)) });
  g.restore();
  g.save();
  g.translate(him.root[0], him.root[1]);
  g.scale(HER_S, HER_S);
  drawPerson(g, STONE_BED, him.pose, 0, 0, 1 / (LW * LW), { beforeFrontArms: underArms(() => quilt(g, HIS_BED.x0 + 8, HIS_BED.x1 - 8, cast?.hisQuiltTop ?? -250, 4, ["#d8b056", "#c49c48"], "check", [-170, -60], t + 0.7)) });
  g.restore();
  bedEnds(g, HER_BED);
  bedEnds(g, HIS_BED);
  // 脚踝上拴着的绳子（她：近处那只脚，靠他那边；他：靠她那边那只）
  const untie = cast?.untie ?? 0;
  ropes(g, her.ankleL, him.ankleR, untie);
  ankleLoop(g, her.ankleL, 4, "#a08a6e");
  if (untie < 0.08) ankleLoop(g, him.ankleR, 3, "#d8352b");
  lightSwitch(g, t);
  light(g, cast?.lightT ?? t);
}
/**
 * 仰头看的镜头（天花板坐标）：⑦ 顺着绳子往上，落在两张脸和牵着的手上；停住以后叠一点很慢的漂（手持呼吸：画面上约 3 像素、0.4%，
 * 不留一秒完全不动的画面）。⑧ 一夜过去：很慢地往后退（1.5 → 1.26）、转一点点、往他那边挪一点，中间（天亮）快一点，88.02 前慢慢收住
 */
export function bedCam(t: number): Cam {
  const z0 = 1.5;
  const off = (TILT_PX - tiltPx(t)) / z0;
  const k = E.soft(ph(t, D.start, D.end + 0.4));
  const z = z0 * Math.pow(1.26 / z0, k);
  const h = ph(t, 84.8, 85.4);
  const dx = (3 * h * (0.6 * Math.sin(t * 0.83) + 0.4 * Math.sin(t * 1.37 + 1.1))) / z;
  const dy = (3 * h * (0.6 * Math.sin(t * 0.71 + 2) + 0.4 * Math.sin(t * 1.19))) / z;
  return { x: -23 + 18 * k + dx, y: -40 + off + dy + downPx(t) / z, z: z * (1 + 0.003 * h * Math.sin(t * 0.57)), r: -0.05 * k };
}
