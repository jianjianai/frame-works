// 四⑧ 第四声「活下去」（125.82–129.87；活 ~126.0、下 ~126.5、去 ~128.0 拖到 129.9）：早上，全城。
// 不切：⑦的镜头接着往右沿街摇过去，太阳出来，一扇扇窗灭掉。摇到老钟家那扇窗（前奏里他举杯、挥手的那扇），他端着茶杯朝街口
// （她家那栋楼那边）望——街上空着，没有一拍一下的「咚」，等不到她。他放下茶杯，抬头看天；镜头顺着他的视线慢慢升起来，
// 越过早上的整座城、穿过天上那张网（这次是慢慢升，不是⑥那样甩），升到白的边上：她闭上眼睛，张开手，发梢碰到白，
// 开始化成一点点光、灰，往白里飘。镜头很慢地凑近她，白压在画面上面。
// 老钟家（两层老房子，一楼窗后是老钟）和它左右两栋邻居：和第一幕、副歌一同一条街（lib/dawn.ts 的 ZHONG_HOUSE、ZHONG_NEIGHBORS），
// 四这一幕原来没画，现在 act6 一直画着（②开头、⑤最后那两个远景里也看得见）。
// 坐标是世界坐标；她（lib/dive.ts）停在白底下、张开手，时刻在 lib/t8.ts。

import { type MoveKey, type PoseIn, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { seeded } from "@frame/engine/math";
import { type Cam, E, aim, camLerp, ph, viewOf } from "./cam";
import { drawTinted } from "./world";
import { ARMS, live } from "./motion";
import { ZHONG, armL, armR, legL, legR } from "./poses";
import { ZHONG_HOUSE, pose } from "./dawn";
import { STOMP_T } from "./t51";
import { CHAIN_T } from "./t52";
import { LINK_T } from "./t53";
import { LAND_T } from "./t55";
import { stoneC4 } from "./coatoff";
import { cupHold, drawHouse, drawHouseWindowFront } from "./props";
import { drawPerson } from "./people";
import { MORNING8_T } from "./t8";
import { diveHer } from "./dive";
import { cam7 } from "./write7";

type V2 = [number, number];
const T = MORNING8_T;
export { MORNING8_T };

/** 天色：⑦以前天快亮（0.5，亮着的窗 0.35）；⑧ 太阳出来，天亮一点、暖一点，亮着的窗一组组灭掉 */
export function duskAt8(t: number): [number, number] {
  const u = E.io(ph(t, T.start, T.sun1));
  return [0.5 - 0.22 * u, 0.35 * (1 - u)];
}

// ——— 老钟：一楼窗后，端着茶杯朝她家那栋楼那边望（朝左），等不到她；放下茶杯，抬头看天 ———
const OLD = CAST.老钟;
const Z_WAIT = { ...ZHONG.窗后, face: -0.6, neck: 4, expression: "担心", lookX: -0.6, lookY: 0.1 };
const Z_LOWER = { ...Z_WAIT, ...armL(4, 34, 0, "grip", 4) };
const Z_UP = { ...Z_LOWER, neck: 26, expression: "难过", lookX: -0.2, lookY: -1 };
// 五② 被他跺地那一下震得一惊；扶着窗框探出身子朝那边看，看见他被风带着飘过来；一脚踩上窗台，扑出去两只手抓住他的脚踝，吊在他脚下
/** 一惊（跺地那一下） */
const Z_JOLT = { ...Z_UP, neck: 8, expression: "吓一跳", lookX: -0.7, lookY: 0.2 };
/** 扶着窗框探出身子，朝他家那栋楼那边往下看 */
const Z_LEAN = pose(22, { face: -0.6, ...legR(6, -6), ...legL(-4, -2), neck: -8, expression: "吓一跳", lookX: -0.8, lookY: 0.3 }, (l) => ({
  ...armL(70, 30, 0, "open", l),
  ...armR(60, 40, 0, "open", l),
}));
/** 抬头看见他飘过来 */
const Z_SEE = { ...Z_LEAN, neck: 26, expression: "吓一跳", lookX: -0.4, lookY: -0.9 };
/** 一脚踩上窗台，两只手扒着窗框，盯着他 */
const Z_SILL = pose(24, { face: -0.6, ground: false, ...legR(80, -100), ...legL(-10, -20), neck: 22, expression: "坚定", lookX: -0.3, lookY: -0.9 }, (l) => ({
  ...armL(120, 20, 0, "open", l),
  ...armR(110, 24, 0, "open", l),
}));
/** 扑出去：全身伸直，两只手往上够 */
const Z_LEAP = pose(-6, { face: -0.6, ground: false, ...legR(-10, -20, -30), ...legL(-30, -40, -30), neck: 28, expression: "使劲", lookX: -0.2, lookY: -1 }, (l) => ({
  ...armL(170, 6, 0, "open", l),
  ...armR(165, 8, 0, "open", l),
}));
/** 吊在他脚下：两只手攥着他的脚踝（IK），腿悬着，仰着头 */
const Z_HANG = pose(-4, { face: -0.6, ground: false, ...legR(6, -24, -40), ...legL(-8, -16, -44), neck: 24, expression: "坚定", lookX: -0.1, lookY: -1 }, (l) => ({
  ...armL(170, 6, 0, "grip", l),
  ...armR(166, 8, 0, "grip", l),
}));
/** 五③ 周磊一把抓住他远处那只脚踝：那条腿被拽直，低头一看，一惊 */
const Z_PULLED = pose(-4, { face: -0.6, ground: false, ...legR(2, -2, -30), ...legL(22, -54, -40), neck: -20, expression: "惊", lookX: 0.1, lookY: 0.9 }, (l) => ({
  ...armL(170, 6, 0, "grip", l),
  ...armR(166, 8, 0, "grip", l),
}));
/** 再仰起头接着往上 */
const Z_PULLED_UP = { ...Z_PULLED, ...legL(16, -40, -44), neck: 26, expression: "坚定" as const, lookX: -0.2, lookY: -1 };
/** 五⑤ 最后一个松开手，往下飘：两只手往上张开，仰头看着她抱着他，哭着笑 */
const Z_DRIFT = pose(-4, { face: -0.6, ground: false, ...legR(12, -32, -30), ...legL(-10, -44, -36), neck: 24, expression: "哭着笑", tears: 1, lookX: -0.1, lookY: -0.8 }, (l) => ({
  ...armL(124, 30, 0, "open", l),
  ...armR(114, 36, 0, "open", l),
}));
/** 落回街上站着，看着她笑 */
const Z_STAND = pose(2, { face: -0.6, ground: false, ...legR(6, -6), ...legL(-4, -2), neck: 6, expression: "微笑", lookX: -0.6, lookY: 0.1 }, (l) => ({
  ...armL(8, 24, 0, "relax", l),
  ...armR(10, 26, 0, "relax", l),
}));
/** 五⑤ 落回街上以后站在哪（根）：她右边靠前 */
const Z_SPOT: V2 = [-2590, 80];
const zhongMove = live(
  [
    { t: 100, x: 0, p: Z_WAIT },
    { t: T.cup0, p: Z_WAIT },
    { t: T.cup1, ease: "inOut", p: Z_LOWER },
    { t: T.look1, ease: "inOut", p: Z_UP },
    { t: STOMP_T.stomp, p: Z_UP },
    { t: STOMP_T.stomp + 0.12, ease: "out", p: Z_JOLT },
    { t: CHAIN_T.lean1, ease: "inOut", p: Z_LEAN },
    { t: CHAIN_T.see0, p: Z_LEAN },
    { t: CHAIN_T.see1, ease: "inOut", p: Z_SEE },
    { t: CHAIN_T.sill0, p: Z_SEE },
    { t: CHAIN_T.sill1, ease: "inOut", p: Z_SILL },
    { t: CHAIN_T.leap0, p: Z_SILL },
    { t: CHAIN_T.grab, ease: "out", p: Z_LEAP },
    { t: CHAIN_T.grab + 0.3, ease: "inOut", p: Z_HANG },
    { t: LINK_T.grabs[0] - 0.02, p: Z_HANG },
    // 眼睛先往下、头再跟
    { t: LINK_T.grabs[0] + 0.08, ease: "out", squash: -0.05, p: { ...Z_PULLED, neck: 12, lookY: 0.7 } },
    { t: LINK_T.grabs[0] + 0.35, ease: "inOut", p: Z_PULLED },
    { t: LINK_T.grabs[0] + 0.7, p: Z_PULLED },
    { t: LINK_T.grabs[0] + 1.05, ease: "inOut", p: Z_PULLED_UP },
    // 五⑤ 最后一个松开手往下飘；落回街上站着（跳过去的那几秒里换的）
    { t: LAND_T.zhongRelease - 0.02, p: Z_PULLED_UP },
    { t: LAND_T.zhongRelease + 0.35, ease: "out", p: Z_DRIFT },
    { t: 151, p: Z_DRIFT },
    { t: 153.5, ease: "inOut", p: Z_STAND },
    { t: 160, p: Z_STAND },
  ] as MoveKey[],
  { look: lookOf(OLD), base: { wind: 0 }, idle: true, seed: 81, springs: ARMS },
);
/** 他攥着的地方：小石头远处那只脚踝；吊着时根在那里往下（两只手举直时手心在根上方约 560） */
const HANG: V2 = [34, 560];
/**
 * 老钟这一刻：姿势、根、还在不在屋里（在屋里就裁在窗里画）。五② 踩上窗台（根从屋里地上挪到窗台上），扑出去（落到抓住时的位置），
 * 之后吊在他脚下跟着走，两只手 IK 攥着他的脚踝
 */
export function zhongAt(t: number) {
  const W = ZHONG_HOUSE.win;
  const C = CHAIN_T;
  const p: PoseIn = { ...zhongMove(t).pose };
  // 五⑤ 松了手：天上接着松手那一刻的速度往左飘开、越落越快一点；落回街上以后站在她右边靠前
  const L = LAND_T;
  if (t >= L.zhongRelease) {
    if (t >= L.street0 - 1) return { pose: p, root: Z_SPOT, inside: false };
    ZR ??= (() => {
      const a = hangAt(L.zhongRelease);
      const b = hangAt(L.zhongRelease - 0.02);
      return { root: a, v: [(a[0] - b[0]) / 0.02, (a[1] - b[1]) / 0.02] as V2 };
    })();
    const d = t - L.zhongRelease;
    const w = 1 - E.io(ph(t, L.zhongRelease, L.zhongRelease + 0.12));
    const root: V2 = [ZR.root[0] + ZR.v[0] * d - (140 * d + 90 * d * d), ZR.root[1] + ZR.v[1] * d + 160 * d * d];
    if (w > 0) {
      const a = stoneC4(t).ankleR;
      const sc = OLD.scale;
      const loc = (q: V2): V2 => [(q[0] - root[0]) / sc, (q[1] - root[1]) / sc];
      p.armL = { ...(p.armL as object), to: loc([a[0] - 5, a[1] + 2]), ik: w } as PoseIn["armL"];
      p.armR = { ...(p.armR as object), to: loc([a[0] + 6, a[1] + 12]), ik: w } as PoseIn["armR"];
    }
    return { pose: p, root, inside: false };
  }
  const inside: V2 = [W.x + 10, -10];
  const sill: V2 = [W.x - 10, W.sill];
  let root: V2 = t > C.sill0 ? mix(inside, sill, E.io(ph(t, C.sill0, C.sill1))) : inside;
  if (t > C.leap0) {
    const a = stoneC4(Math.max(t, C.grab)).ankleR;
    const hang: V2 = [a[0] + HANG[0] + 6 * Math.sin(t * 2.1), a[1] + HANG[1]];
    root = t >= C.grab ? hang : mix(sill, hang, E.out(ph(t, C.leap0, C.grab)));
    const w = E.io(ph(t, C.grab - 0.06, C.grab + 0.04));
    if (w > 0) {
      const sc = OLD.scale;
      const loc = (q: V2): V2 => [(q[0] - root[0]) / sc, (q[1] - root[1]) / sc];
      p.armL = { ...(p.armL as object), to: loc([a[0] - 5, a[1] + 2]), ik: w } as PoseIn["armL"];
      p.armR = { ...(p.armR as object), to: loc([a[0] + 6, a[1] + 12]), ik: w } as PoseIn["armR"];
    }
  }
  return { pose: p, root, inside: t < C.sill1 };
}
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
/** 吊在他脚下时的根（五⑤ 松手那一刻接着往下飘用） */
function hangAt(t: number): V2 {
  const a = stoneC4(t).ankleR;
  return [a[0] + HANG[0] + 6 * Math.sin(t * 2.1), a[1] + HANG[1]];
}
let ZR: { root: V2; v: V2 } | null = null;
/** 五③ 老钟远处那只脚踝（世界坐标）：周磊抓的地方 */
export function zhongAnkle(t: number): V2 {
  const z = zhongAt(t);
  const j = castJoints(OLD, z.pose);
  return [z.root[0] + j.ankleR[0], z.root[1] + j.ankleR[1]];
}

/** 老钟家（人这一层，世界坐标）：墙、门、二楼的窗，一楼窗里亮着灯、老钟站在窗后（裁在窗里，窗台以下被墙挡住），窗框压在他前面 */
export function drawZhongHouse(g: CanvasRenderingContext2D, t: number, cam: Cam) {
  const H = ZHONG_HOUSE;
  const v = viewOf(cam, 1);
  const z = zhongAt(t);
  if (!(H.x0 > v.x1 + 200 || H.x1 < v.x0 - 200 || v.y1 < H.top - 300))
    drawTinted(g, [H.x0 - 120, H.top - 260, H.x1 + 160, 60], (gg) => {
      drawHouse(gg, H, t);
      const W = H.win;
      // 茶杯：五② 扶窗框以前放下了
      const hold = t < STOMP_T.stomp ? { hold: { L: cupHold } } : {};
      if (z.inside && W.x + W.w / 2 > v.x0 && W.x - W.w / 2 < v.x1) {
        gg.save();
        gg.beginPath();
        gg.rect(W.x - W.w / 2, W.top, W.w, W.sill - W.top);
        gg.clip();
        drawPerson(gg, OLD, z.pose, z.root[0], z.root[1], cam.z, hold);
        gg.restore();
      }
      drawHouseWindowFront(gg, H);
    });
  // 五② 出了窗：站在窗台上、扑出去、吊在他脚下，画在窗框前面（五③ 被人链带得比房子还高：单独蒙色，不裁在房子那一块里）
  // 五⑤ 落回街上以后和大家一起按远近画（lib/link.ts 的 drawLink）
  if (!z.inside && t < LAND_T.street0 - 1 && z.root[0] > v.x0 - 400 && z.root[0] < v.x1 + 400 && z.root[1] - 700 < v.y1 && z.root[1] + 150 > v.y0)
    drawTinted(g, [z.root[0] - 420, z.root[1] - 720, z.root[0] + 420, z.root[1] + 140], (gg) => drawPerson(gg, OLD, z.pose, z.root[0], z.root[1], cam.z));
}

// ——— 她的发梢化成光 ———
/** 她头顶在哪（世界坐标） */
function herHead(t: number): V2 {
  const h = diveHer(t);
  const j = jointsOf(h.pose);
  return [h.root[0] + j.head[0], h.root[1] + j.head[1]];
}
/**
 * 一点点光：从发梢（头顶那一圈、两边垂下来的头发上半截）冒出来，往上飘进白里，越往后越多；肥皂泡那几种彩色（和片头光里的女人
 * 化成的光一样），飘着飘着淡掉
 */
const MOTES = (() => {
  const r = seeded(808);
  return Array.from({ length: 110 }, () => {
    const u = r();
    return {
      t0: T.ash0 + (T.end + 0.4 - T.ash0) * Math.sqrt(u),
      a: (r() - 0.5) * Math.PI * 1.25,
      vx: (r() - 0.5) * 80,
      vy: -(60 + r() * 120),
      s: 3.2 + r() * 4.6,
      hue: [330, 25, 50, 150, 200, 265][Math.floor(r() * 6)] + (r() - 0.5) * 20,
      ph: r() * 6,
    };
  });
})();
/**
 * 画她发梢化成的光（世界坐标）：画在白的上面（发梢就在白的边上，光点往上飘进白里，画在白下面会被白盖掉）；
 * 光点一颗颗从发梢冒出来往上飘、一闪一闪地淡掉，发梢那一圈蒙一层淡淡的白光
 */
export function drawHerAsh(g: CanvasRenderingContext2D, t: number) {
  if (t < T.ash0) return;
  const head = herHead(t);
  const tip: V2 = [head[0] - 4, head[1] - 60];
  const k = E.io(ph(t, T.ash0, T.end));
  g.save();
  const rg = g.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 120);
  rg.addColorStop(0, `rgba(255,250,240,${0.5 * k})`);
  rg.addColorStop(1, "rgba(255,250,240,0)");
  g.fillStyle = rg;
  g.fillRect(tip[0] - 120, tip[1] - 120, 240, 240);
  for (const m of MOTES) {
    const a = t - m.t0;
    if (a < 0 || a > 1.3) continue;
    const x = tip[0] + 78 * Math.sin(m.a) + m.vx * a + 10 * Math.sin(a * 3 + m.ph);
    const y = tip[1] - 30 * Math.cos(m.a) + 40 * (1 - Math.cos(m.a)) + m.vy * a;
    const alpha = Math.min(1, a * 6) * (1 - a / 1.3) ** 1.1 * (0.7 + 0.3 * Math.sin(a * 8 + m.ph));
    g.globalAlpha = alpha;
    g.fillStyle = `hsl(${m.hue}, 82%, ${70 + 12 * Math.min(1, a)}%)`;
    g.beginPath();
    g.arc(x, y, m.s * (1 - 0.35 * a), 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

// ——— 镜头 ———
/** 手持呼吸：画面上约 3 像素 */
const breath = (t: number): V2 => [
  3 * (0.6 * Math.sin(t * 0.83) + 0.4 * Math.sin(t * 1.37 + 1.1)),
  3 * (0.6 * Math.sin(t * 0.71 + 2) + 0.4 * Math.sin(t * 1.19)),
];
/**
 * 四⑧的镜头：接着⑦的远景（不切）往右沿街摇到老钟那扇窗（E.io，倍数从 0.85 到 0.95）；他抬头时顺着他的视线慢慢升起来——位置 E.io，
 * 倍数中途退到约 0.22（越过整座城、穿过天上那张网，画面上走得不快，不拖影），到她身上收住（0.9 倍，她的头在画面 920，白压在上面）；
 * 之后很慢地凑近她（到 1.12 倍）；叠手持呼吸
 */
export function cam8(t: number): Cam {
  const [bx, by] = breath(t);
  const zw = 0.95;
  const win = aim(ZHONG_HOUSE.win.x - 30 + bx / zw, -430 + by / zw, 540, 1000, zw);
  let c = camLerp(cam7(t), win, E.io(ph(t, T.start, T.pan1)));
  const e = E.io(ph(t, T.rise0, T.rise1));
  if (e > 0) {
    const head = herHead(t);
    const zh = 0.9 * Math.pow(1.24, E.io(ph(t, T.rise1 - 0.1, T.end + 0.7)));
    const her = aim(head[0] + bx / zh, head[1] + by / zh, 540, 920, zh);
    c = { x: c.x + (her.x - c.x) * e, y: c.y + (her.y - c.y) * e, z: c.z * Math.pow(her.z / c.z, e) * Math.exp(-1.44 * Math.sin(Math.PI * e)), r: 0 };
  }
  return c;
}
