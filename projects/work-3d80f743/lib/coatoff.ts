// 四②「但若你又找不到意义」（108.02–109.95；但 107.94 若 108.15 你 108.36 又 108.57 找 108.78 不 108.99 到 109.2 意 109.41 义 109.62，
// 约每字 0.21 秒；108.02、109.02 重拍）：拍子上切到天快亮的街上——她家（最高那栋楼）楼下，还是白天那条街，天边发白，街上一个人都没有。
// 他穿着妈妈那件橘色外套，一只手拎着「妈妈，明天见」，仰头看着天上的白；两只肩膀往后一耸，外套从身上滑下去，109.02「咚」掉在地上
// （下摆缝着铅）；他两只手把砖举过头顶，脚跟离了地，飘起来。
// 镜头：切过来是远景（白压在画面最上面，她家那栋楼一直通到白底下，他小小的一个人站在楼脚下），停一下，推到他身上；
// 外套落地那一下往前一顶，之后跟着他往上抬。
// 坐标是世界坐标（和第一幕同一条街，街面 y = 0）；人按 1 倍画。

import { type MoveKey, type PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { part } from "./world";
import { ARMS, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { drawPerson } from "./people";
import { BRICK_SIZE, drawGiftBrick, drawHerBrick, shenTip } from "./write5";
import { bootLow, drawPen } from "./room";
import { BOOTS5_T } from "./t5";
import { BRICK6_T } from "./t6";
import { WRITE7_T } from "./t7";
import { STOMP_T } from "./t51";
import { CHAIN_T } from "./t52";
import { LINK_T, linkDX, linkLift } from "./t53";
import { GIVE_T, HUG_PULL, KID_STOP } from "./t54";
import { KID_REL, LAND_T, landChest } from "./t55";

type V2 = [number, number];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

export const COAT4_T = {
  start: beatAt(216),
  /** 镜头从远景推到他身上 */
  push0: 108.28,
  push1: 108.9,
  /** 两只肩膀往后一耸，外套从肩上滑下去 */
  shrug0: 108.52,
  off: 108.64,
  /** 外套「咚」掉在地上（重拍） */
  thud: beatAt(218),
  /** 两只手把砖举过头顶 */
  raise0: 108.98,
  raise1: 109.28,
  /** 脚跟离了地，飘起来（越飘越快） */
  lift0: 109.3,
  end: 109.95,
  /** 四③ 他看见她扑下来，把砖收到胸前抱着（她要抱住他） */
  hug0: 111.5,
  hug1: 111.72,
};
const T = COAT4_T;

/** 他站在哪：她家那栋楼的楼脚下（楼 −3700…−2720，哑铃店在右边一半） */
export const STONE_X = -3390;
/**
 * 四⑤ 她松手时把他往右下推了一把：往下坠时横着匀速漂过去这么远（像扔出去的东西），落在他妈妈那件外套旁边
 * （外套堆在 STONE_X −105…+135，铁靴从脚踝往左伸 ~80），之后（四⑥）就站在 STONE_LAND_X
 */
const LAND_DX = 250;
export const STONE_LAND_X = STONE_X + LAND_DX;
/** 他这一刻横着在哪（五④ 起升到她跟前，见 giveAt） */
export function stoneX(t: number) {
  return t > GIVE_T.start ? giveAt(t)[0] : stoneX0(t);
}
function stoneX0(t: number) {
  return STONE_X + LAND_DX * ph(t, BOOTS5_T.release, BOOTS5_T.land) + SWEEP * E.io(ph(t, CHAIN_T.start, CHAIN_T.sweep1)) + 40 * Math.max(0, t - CHAIN_T.sweep1) + linkDX(t);
}
/** 三次 Hermite（一维）：从 a（速度 va）到 b（速度 vb），用 dt 秒，u 是 0–1 的进度 */
function herm(a: number, va: number, b: number, vb: number, dt: number, u: number) {
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * a + (u3 - 2 * u2 + u) * dt * va + (-2 * u3 + 3 * u2) * b + (u3 - u2) * dt * vb;
}
/** 五④ 从 144.02 的位置和速度接过去（五③越升越快、往左飘） */
let GIVE0: { x: number; vx: number; y: number; vy: number } | null = null;
/**
 * 五④ 他在哪（横着的 x、离地多高）：一路越升越慢地升到她右下方，145.85 停住（KID_STOP：举过头顶的砖正好在她伸手够得着的地方）；
 * 停住以后很轻地浮着；抱住时被她拉进怀里（HUG_PULL）
 */
function giveAt(t: number): V2 {
  // 五⑤ 在她怀里，跟着她往下落、落回街上（lib/t55.ts：她胸口的路线 + 他在她胸口的哪里；一镜到底）
  if (t > LAND_T.start) {
    const c = landChest(t);
    return [c[0] + KID_REL[0], -(c[1] + KID_REL[1])];
  }
  if (!GIVE0) {
    const t0 = GIVE_T.start;
    const d = 0.01;
    GIVE0 = { x: stoneX0(t0), vx: (stoneX0(t0) - stoneX0(t0 - d)) / d, y: liftAt0(t0), vy: (liftAt0(t0) - liftAt0(t0 - d)) / d };
  }
  const g = GIVE0;
  const T1 = GIVE_T.arrive - GIVE_T.start;
  const u = Math.min(1, (t - GIVE_T.start) / T1);
  const h = E.io(ph(t, GIVE_T.hug0, GIVE_T.hug1));
  const e = Math.max(0, t - GIVE_T.arrive);
  const bob = 5 * Math.sin(e * 2.4) * Math.min(1, e / 0.5);
  return [herm(g.x, g.vx, KID_STOP[0], 0, T1, u) + HUG_PULL[0] * h, herm(g.y, g.vy, -KID_STOP[1], 0, T1, u) + bob - HUG_PULL[1] * h];
}
const STONE = CAST.小石头穿妈妈的外套;
const STONE_BARE = { ...CAST.小石头, coat: undefined };
/** 街上的砖按 1 倍画（屋里的人是 1.22 倍） */
const BS = 1 / 1.22;
const [BW, BH] = BRICK_SIZE;

const P = {
  /** 仰头看着白（侧一点的脸仰起来才像仰头）：近处那只手拎着砖垂在身边，含着泪 */
  仰望: pose(-4, { face: -0.7, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: 30, expression: "仰望", tears: 1, sad: 0.5, lookX: -0.2, lookY: -1 }, (l) => ({
    shoulderL: -6 + l,
    elbowL: 10,
    wristL: 0,
    handL: "grip",
    shoulderR: 8 + l,
    elbowR: 12,
    wristR: 0,
    handR: "relax",
  })),
  /** 两只肩膀往后一耸，胳膊往后甩，外套从身上滑下去 */
  脱: pose(8, { face: -0.7, ...legR(4, -4, 10), ...legL(-8, -6, 14), neck: 18, expression: "使劲", tears: 1, lookX: -0.2, lookY: -0.8 }, (l) => ({
    shoulderL: -44 + l,
    elbowL: 20,
    wristL: 0,
    handL: "grip",
    shoulderR: -40 + l,
    elbowR: 20,
    wristR: 0,
    handR: "open",
  })),
  /** 两只手把砖举过头顶（手由 IK 放在砖的两头），仰着头 */
  举: pose(-6, { face: -0.7, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: 32, expression: "仰望", tears: 1, sad: 0.5, lookX: -0.2, lookY: -1 }, (l) => ({
    shoulderL: 165 + l,
    elbowL: 20,
    wristL: 0,
    handL: "grip",
    shoulderR: 165 + l,
    elbowR: 20,
    wristR: 0,
    handR: "grip",
  })),
  /** 四③ 看见她扑下来：一惊，把砖收到胸前两只手抱着，仰头看着她 */
  抱砖: pose(-6, { face: -0.7, ground: false, float: 0.3, ...legR(8, -22, -50), ...legL(-6, -18, -54), neck: 26, expression: "吓一跳", tears: 1, lookX: 0.3, lookY: -1 }, (l) => ({
    shoulderL: 40 + l,
    elbowL: 100,
    wristL: 0,
    handL: "grip",
    shoulderR: 40 + l,
    elbowR: 100,
    wristR: 0,
    handR: "grip",
  })),
  /** 四⑤ 铁靴一沉往下坠：腿被铁靴拽得直直的，近处那只手把砖抱在胸前，远处那只往上伸着够她，哭着仰头看她 */
  坠: pose(-4, { face: -0.7, ground: false, ...legR(4, -6, 0), ...legL(-4, -6, 0), neck: 28, expression: "含泪", tears: 1, sad: 1, lookX: -0.2, lookY: -1 }, (l) => ({
    shoulderL: 40 + l,
    elbowL: 100,
    wristL: 0,
    handL: "grip",
    shoulderR: 165 + l,
    elbowR: 10,
    wristR: 0,
    handR: "open",
  })),
  /** 四⑤ 穿着她的铁靴站在街上，仰着头看她越飘越高，远处那只手还往上伸着 */
  站仰: pose(-4, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: 32, expression: "仰望", tears: 1, sad: 0.7, lookX: -0.1, lookY: -1 }, (l) => ({
    shoulderL: 40 + l,
    elbowL: 100,
    wristL: 0,
    handL: "grip",
    shoulderR: 120 + l,
    elbowR: 20,
    wristR: 0,
    handR: "open",
  })),
  /** 四⑥ 低头看见靴尖旁边那块砖：抱在胸口的砖垂下来拎在身边，远处那只手松着 */
  看砖: pose(-2, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: -26, expression: "含泪", tears: 1, sad: 0.6, lookX: -0.5, lookY: 0.9 }, (l) => ({
    ...armL(0, 12, 0, "grip", l),
    ...armR(24, 24, 0, "open", l),
  })),
  /**
   * 四⑥ 弯腰够砖：腿在铁靴里直着（她的铁靴高到他大腿），只能从腰那儿笨笨地折下去（lean 80）；拎着自己那块的手往后甩着压住身子，
   * 远处那只手（IK）够靴子上斜靠着的那块砖靠上那一头
   */
  弯腰: pose(80, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: -12, expression: "含泪", tears: 1, sad: 0.6, lookX: -0.3, lookY: 0.7 }, (l) => ({
    ...armL(-60, 14, 0, "grip", l),
    ...armR(0, 8, 0, "open", l),
  })),
  /** 四⑥ 直起身，把砖拎到脸前面看（远处那只手 IK 捏着砖靠右那头），拎着自己那块的手垂在身边 */
  举砖: pose(-2, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: -14, expression: "含泪", tears: 1, sad: 0.9, lookX: -0.6, lookY: 0.35 }, (l) => ({
    ...armL(0, 12, 0, "grip", l),
    ...armR(60, 100, 0, "grip", l),
  })),
  /** 四⑥ 把她那块砖抱到胸口，仰头看她 */
  抱砖仰: pose(-4, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: 32, expression: "仰望", tears: 1, sad: 0.8, lookX: -0.1, lookY: -1 }, (l) => ({
    ...armL(0, 12, 0, "grip", l),
    ...armR(40, 110, 0, "grip", l),
  })),
  /**
   * 四⑦ 低头写字：砖横搁在他插在近处那只铁靴靴口上的那块上头（在他腰的高度，像一张小桌子；靴口本身在他大腿上，太低，
   * 要趴 45° 头才过得去、手也够不着砖的右头），身子微微往前探，低着头看笔尖，含着泪；两只手 IK（远处那只按住砖的左头，近处那只握笔）
   */
  趴写: pose(10, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: -28, expression: "含泪", tears: 1, sad: 0.7, lookX: 0.1, lookY: 0.95 }, (l) => ({
    ...armL(40, 70, 0, "grip", l),
    ...armR(40, 60, 0, "grip", l),
  })),
  /** 四⑦ 两只手把砖举过头顶朝着她（和四②举「妈妈，明天见」同一个动作，手 IK 在砖的两头），仰着头哭；铁靴把他拽在地上 */
  举向她: pose(-6, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: 32, expression: "仰望", tears: 1, sad: 0.8, lookX: -0.2, lookY: -1 }, (l) => ({
    shoulderL: 165 + l,
    elbowL: 20,
    wristL: 0,
    handL: "grip",
    shoulderR: 165 + l,
    elbowR: 20,
    wristR: 0,
    handR: "grip",
  })),
  /** 五① 把砖抱在胸口（两只手捏着两头），低头看着脚上她的铁靴，含着泪 */
  抱砖低头: pose(-2, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: -26, expression: "含泪", tears: 1, sad: 0.6, lookX: -0.1, lookY: 0.95 }, (l) => ({
    ...armL(30, 100, 0, "grip", l),
    ...armR(30, 100, 0, "grip", l),
  })),
  /**
   * 五① 抬起远处那只铁靴：铁靴硬、高到大腿，膝盖在靴筒里弯不了多少——大腿抬平、小腿竖着，铁靴直立着离地；
   * 身子往后仰着压住，咬着牙看着地
   */
  抬靴: pose(-10, { face: -0.7, ground: false, ...legR(88, -88, 0), ...legL(-6, -4, 0), neck: -18, expression: "坚定", tears: 1, sad: 0.3, lookX: -0.2, lookY: 0.8 }, (l) => ({
    ...armL(30, 100, 0, "grip", l),
    ...armR(30, 100, 0, "grip", l),
  })),
  /** 五① 跺下去：腿砸直，身子跟着往前一压 */
  跺: pose(8, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: -22, expression: "使劲", tears: 1, lookX: -0.2, lookY: 0.9 }, (l) => ({
    ...armL(30, 100, 0, "grip", l),
    ...armR(30, 100, 0, "grip", l),
  })),
  /** 五① 从铁靴里飘出来：没了分量，腿软软地垂着，两只手把砖举过头顶（IK 在砖的两头），仰着头 */
  飘举: pose(-6, { face: -0.7, ground: false, float: 0.15, ...legR(8, -22, -50), ...legL(-6, -18, -54), neck: 32, expression: "仰望", tears: 1, sad: 0.5, lookX: -0.2, lookY: -1 }, (l) => ({
    shoulderL: 165 + l,
    elbowL: 20,
    wristL: 0,
    handL: "grip",
    shoulderR: 165 + l,
    elbowR: 20,
    wristR: 0,
    handR: "grip",
  })),
  /** 五② 被抓住脚踝：远处那条腿被拽直往下，近处那条蜷起来，低头看见老钟，一惊；两只手还举着砖 */
  被拽住: pose(-4, { face: -0.7, ground: false, float: 0.15, ...legR(2, -2, -30), ...legL(24, -56, -40), neck: -22, expression: "吓一跳", tears: 1, lookX: 0.2, lookY: 0.9 }, (l) => ({
    shoulderL: 165 + l,
    elbowL: 20,
    wristL: 0,
    handL: "grip",
    shoulderR: 165 + l,
    elbowR: 20,
    wristR: 0,
    handR: "grip",
  })),
  /** 五② 仰起头接着往上（被抓住的那条腿还直着），咬着牙，带着老钟一起 */
  拽着往上: pose(-6, { face: -0.7, ground: false, float: 0.15, ...legR(2, -2, -30), ...legL(18, -40, -44), neck: 30, expression: "坚定", tears: 1, lookX: -0.1, lookY: -1 }, (l) => ({
    shoulderL: 165 + l,
    elbowL: 20,
    wristL: 0,
    handL: "grip",
    shoulderR: 165 + l,
    elbowR: 20,
    wristR: 0,
    handR: "grip",
  })),
  /** 五③ 低头看见街上的人一个个跳起来抓上来：哭着笑（被抓住的那条腿还直着，两只手还举着砖） */
  看人链: pose(-6, { face: -0.7, ground: false, float: 0.15, ...legR(2, -2, -30), ...legL(18, -40, -44), neck: -24, expression: "哭着笑", tears: 1, lookX: 0.1, lookY: 0.9 }, (l) => ({
    shoulderL: 165 + l,
    elbowL: 20,
    wristL: 0,
    handL: "grip",
    shoulderR: 165 + l,
    elbowR: 20,
    wristR: 0,
    handR: "grip",
  })),
  /** 五③ 仰起头朝左上方的她飞，咬着牙 */
  朝她: pose(-8, { face: -0.7, ground: false, float: 0.15, ...legR(2, -2, -30), ...legL(14, -36, -44), neck: 34, expression: "坚定", tears: 1, lookX: -0.5, lookY: -1 }, (l) => ({
    shoulderL: 165 + l,
    elbowL: 20,
    wristL: 0,
    handL: "grip",
    shoulderR: 165 + l,
    elbowR: 20,
    wristR: 0,
    handR: "grip",
  })),
  /** 五④ 升到她跟前，把砖递上去：仰着头看她，哭着笑（两只手 IK 在砖的两头） */
  递给她: pose(-8, { face: -0.7, ground: false, float: 0.15, ...legR(2, -2, -30), ...legL(14, -36, -44), neck: 34, expression: "哭着笑", tears: 1, lookX: -0.5, lookY: -1 }, (l) => ({
    shoulderL: 165 + l,
    elbowL: 20,
    wristL: 0,
    handL: "grip",
    shoulderR: 165 + l,
    elbowR: 20,
    wristR: 0,
    handR: "grip",
  })),
  /** 五④ 松了手：两只手还朝她伸着，看着她 */
  看她: pose(-6, { face: -0.7, ground: false, float: 0.15, ...legR(4, -8, -30), ...legL(16, -38, -44), neck: 30, expression: "哭着笑", tears: 1, lookX: -0.45, lookY: -1 }, (l) => ({
    ...armL(150, 30, 0, "open", l),
    ...armR(140, 36, 0, "open", l),
  })),
  /** 五④ 被她抱进怀里：头靠在她胸口，闭着眼哭着笑，两只手搂着她的腰（举高了手会盖住她的脸） */
  被抱: pose(-4, { face: -0.7, ground: false, float: 0.15, ...legR(4, -10, -30), ...legL(18, -44, -44), neck: 14, expression: "哭着笑", tears: 1, blink: 0.85, lookX: -0.3, lookY: -0.5 }, (l) => ({
    ...armL(78, 70, 0, "open", l),
    ...armR(70, 82, 0, "open", l),
  })),
  /** 飘起来：没了分量，腿垂着，两只手还举着砖 */
  飘: pose(-6, { face: -0.7, ground: false, float: 0.3, ...legR(8, -22, -50), ...legL(-6, -18, -54), neck: 32, expression: "仰望", tears: 1, sad: 0.5, lookX: -0.2, lookY: -1 }, (l) => ({
    shoulderL: 165 + l,
    elbowL: 20,
    wristL: 0,
    handL: "grip",
    shoulderR: 165 + l,
    elbowR: 20,
    wristR: 0,
    handR: "grip",
  })),
};
const move = live(
  [
    { t: T.start - 0.3, x: 0, p: P.仰望 },
    { t: T.shrug0, p: P.仰望 },
    { t: T.off + 0.08, ease: "inOut", p: P.脱 },
    { t: T.raise0, ease: "inOut", p: { ...P.仰望, neck: 26 } },
    { t: T.raise1, ease: "inOut", p: P.举 },
    { t: T.lift0 + 0.3, ease: "inOut", p: P.飘 },
    { t: T.hug0, p: P.飘 },
    { t: T.hug1, ease: "inOut", p: P.抱砖 },
    // 四④ 被她抱住：含着泪仰头看着她
    { t: 112.0, p: P.抱砖 },
    { t: 112.3, ease: "inOut", p: { ...P.抱砖, expression: "含泪", lookX: -0.5, lookY: -0.6 } },
    // 四⑤「活」铁靴套到脚上一只，那条腿就被坠直一条（远处那条、再近处那条）；
    // 「下」铁靴一沉，往下坠，伸手够她；「去」落地一压；站在铁靴里仰着头，手慢慢放下来一点
    { t: BOOTS5_T.slipR, p: { ...P.抱砖, expression: "含泪", lookX: -0.5, lookY: -0.6 } },
    { t: BOOTS5_T.slipR + 0.12, ease: "out", p: { ...P.抱砖, expression: "含泪", lookX: -0.5, lookY: -0.6, ...legR(4, -6, 0) } },
    { t: BOOTS5_T.slipL, p: { ...P.抱砖, expression: "含泪", lookX: -0.5, lookY: -0.6, ...legR(4, -6, 0) } },
    { t: BOOTS5_T.slipL + 0.12, ease: "out", p: { ...P.抱砖, expression: "含泪", lookX: -0.5, lookY: -0.6, ...legR(4, -6, 0), ...legL(-4, -6, 0) } },
    { t: BOOTS5_T.release, p: { ...P.抱砖, expression: "含泪", lookX: -0.5, lookY: -0.6, ...legR(4, -6, 0), ...legL(-4, -6, 0) } },
    { t: BOOTS5_T.release + 0.22, ease: "inOut", p: P.坠 },
    { t: BOOTS5_T.land - 0.02, p: P.坠 },
    { t: BOOTS5_T.land + 0.1, ease: "out", squash: 0.09, p: P.站仰 },
    { t: BOOTS5_T.land + 0.32, ease: "inOut", p: P.站仰 },
    { t: 117.2, p: P.站仰 },
    { t: 117.8, ease: "inOut", p: { ...P.站仰, shoulderR: 70 - 4, elbowR: 30 } },
    // 四⑥「活」低头看见靴尖旁边那块砖（抱着的砖垂下来拎在身边）；从腰那儿笨笨地折下去，远处那只手够砖；直起身把砖拎到脸前面，
    // 翻过来看见她的字；「下」把砖抱到胸口，抬头
    // （近处那只手这时还 IK 捏着砖：底下的角度先换成往下伸的样子，松手时手不跳）
    { t: BRICK6_T.start, ease: "inOut", p: { ...P.站仰, shoulderR: 70 - 4, elbowR: 30, ...armL(4, 14, 0, "grip", -4) } },
    { t: BRICK6_T.notice0, p: { ...P.站仰, shoulderR: 70 - 4, elbowR: 30, ...armL(4, 14, 0, "grip", -4) } },
    { t: BRICK6_T.bend0, ease: "inOut", p: P.看砖 },
    { t: BRICK6_T.bend1, ease: "inOut", p: P.弯腰 },
    { t: BRICK6_T.rise0, p: P.弯腰 },
    { t: BRICK6_T.rise1, ease: "inOut", p: P.举砖 },
    { t: BRICK6_T.look0, p: P.举砖 },
    { t: BRICK6_T.look1, ease: "inOut", p: P.抱砖仰 },
    // 四⑦「活」低头，把砖翻到背面搁到靴口上，趴下去；「下」一个字一个字写「沉沉，明天见」；「去」直起身把砖举过头顶朝着她，
    // 往上挣一下（身子一伸、头发漾一下），铁靴把他拽在地上
    { t: WRITE7_T.down0, p: P.抱砖仰 },
    // 眼睛先往下看、头再跟下去（一起转的话半路有一下正好直视镜头）
    { t: WRITE7_T.down0 + 0.08, ease: "out", p: { ...P.抱砖仰, neck: 22, lookX: 0, lookY: 0.85 } },
    { t: WRITE7_T.down1, ease: "inOut", p: P.趴写 },
    { t: WRITE7_T.done, p: P.趴写 },
    { t: WRITE7_T.up1, ease: "inOut", p: P.举向她 },
    { t: WRITE7_T.strain, p: P.举向她 },
    { t: WRITE7_T.strain + 0.12, ease: "out", squash: -0.05, p: { ...P.举向她, float: 0.12, neck: 36 } },
    { t: WRITE7_T.strain + 0.5, ease: "inOut", p: { ...P.举向她, float: 0.08 } },
    // 五①「在这反乌托邦里」：举着的砖放下来抱在胸口，低头看着她的铁靴，定下心来；抬起远处那只铁靴（沉，一点点抬），憋住；
    // 134.02 全片最重的一下跺下去（身子一压）；从铁靴里飘出来，把砖举过头顶
    { t: STOMP_T.start, p: { ...P.举向她, float: 0.08 } },
    { t: STOMP_T.lower1, ease: "inOut", p: P.抱砖低头 },
    { t: STOMP_T.set1, ease: "inOut", p: { ...P.抱砖低头, expression: "坚定", tears: 1, neck: -14, lookY: 0.6 } },
    { t: STOMP_T.lift0, p: { ...P.抱砖低头, expression: "坚定", tears: 1, neck: -14, lookY: 0.6 } },
    { t: STOMP_T.lift1, ease: "inOut", p: P.抬靴 },
    { t: STOMP_T.hold1, p: P.抬靴 },
    { t: STOMP_T.stomp, ease: "in", squash: 0.14, p: P.跺 },
    { t: STOMP_T.stomp + 0.18, ease: "out", p: P.跺 },
    { t: STOMP_T.rise0, p: { ...P.跺, expression: "坚定" } },
    { t: STOMP_T.up1, ease: "inOut", p: P.飘举 },
    // 五② 被风带着从老钟家门前飘过；138.02 老钟一把抓住他远处那只脚踝：那条腿被拽直、人往下一坠（一伸），低头看见老钟；
    // 再仰起头接着往上，把老钟也带起来
    { t: CHAIN_T.grab - 0.02, p: P.飘举 },
    { t: CHAIN_T.grab + 0.08, ease: "out", squash: -0.06, p: P.被拽住 },
    { t: CHAIN_T.grab + 0.4, ease: "inOut", p: P.被拽住 },
    { t: CHAIN_T.grab + 0.8, ease: "inOut", p: P.拽着往上 },
    // 五③ 周磊抓住老钟那一下他低头看见：街上的人一个个跳起来抓上来（哭着笑）；再仰起头朝左上方的她飞
    { t: LINK_T.grabs[0] + 0.08, p: P.拽着往上 },
    // 眼睛先往下、头再跟
    { t: LINK_T.grabs[0] + 0.16, ease: "out", p: { ...P.拽着往上, lookX: 0.1, lookY: 0.9 } },
    { t: LINK_T.grabs[0] + 0.45, ease: "inOut", p: P.看人链 },
    { t: LINK_T.grabs[2] - 0.1, p: P.看人链 },
    { t: LINK_T.grabs[2] - 0.02, ease: "out", p: { ...P.看人链, lookX: -0.4, lookY: -1 } },
    { t: LINK_T.grabs[2] + 0.35, ease: "inOut", p: P.朝她 },
    // 五④ 升到她跟前，把翻过来的砖递上去（哭着笑）；松手以后两只手还朝她伸着；被她抱进怀里
    { t: GIVE_T.arrive - 0.4, p: P.朝她 },
    { t: GIVE_T.arrive, ease: "inOut", p: P.递给她 },
    { t: GIVE_T.let1, p: P.递给她 },
    { t: GIVE_T.let1 + 0.3, ease: "inOut", p: P.看她 },
    { t: GIVE_T.hug0, p: P.看她 },
    { t: GIVE_T.hug1, ease: "inOut", p: P.被抱 },
    // 五⑤ 在她怀里落回街上：落地以后睁开眼，看着围过来的人笑
    { t: LAND_T.land + 0.05, p: P.被抱 },
    { t: LAND_T.land + 0.4, ease: "inOut", p: { ...P.被抱, blink: 0, neck: 8, lookX: 0.5, lookY: 0.2 } },
    { t: 175, p: { ...P.被抱, blink: 0, neck: 8, lookX: 0.5, lookY: 0.2 } },
  ] as MoveKey[],
  { look: lookOf(STONE), base: { wind: 0.85 }, idle: true, seed: 211, springs: ARMS, follow: 0 },
);
/** 离地多高：脚跟一离地，越飘越快（五④ 起升到她跟前，见 giveAt） */
export function liftAt(t: number) {
  return t > GIVE_T.start ? giveAt(t)[1] : liftAt0(t);
}
function liftAt0(t: number) {
  const d = t - (T.lift0 + 1);
  // 一秒以后接着越飘越快（四③ 接着往上飘：速度接上，再加速）
  if (d <= 0) return 260 * E.in2(ph(t, T.lift0, T.lift0 + 1));
  const up = (x: number) => 260 + 520 * x + 300 * x * x;
  // 四③ 111.86 她一把抱住他（lib/dive.ts 的 DIVE_T.catch）：连她的铁靴也拽不住两个人，只是慢下来——
  // 速度从抱住那一刻的一下子衰减下去（0.22 秒），之后两个人每秒往上飘 150
  const dc = PAIR_CATCH - (T.lift0 + 1);
  if (d <= dc) return up(d);
  const v0 = 520 + 600 * dc;
  const tau = 0.22;
  const pair = (tt: number) => {
    const e = tt - PAIR_CATCH;
    return up(dc) + (v0 - 150) * tau * (1 - Math.exp(-e / tau)) + 150 * e;
  };
  const B5 = BOOTS5_T;
  if (t < B5.release) return pair(t);
  // 四⑤「下」铁靴一沉：从她怀里往下坠，越坠越快，「去」116.02「咚」铁靴踩回街面（之后就站在铁靴里）
  const L0 = pair(B5.release);
  const u = Math.min(1, (t - B5.release) / (B5.land - B5.release));
  return bootLift() + (L0 - bootLift()) * (1 - u * u) + stompLift(t);
}
/**
 * 五① 跺下去那一下铁靴陷进坑里（24）；从铁靴里飘出来以后越飘越快（腿从靴筒里滑出来，铁靴留在坑里）。
 * 五② 被天上的风带住以后越升越慢（速度接上，往窗口上方那么高贴过去：远处那只脚踝离地约 940，站在窗台上的老钟扑起来够得着）；
 * 138.02 老钟抓住那一下往下一坠，之后带着老钟慢慢往上
 */
function stompLift(t: number) {
  const S = STOMP_T;
  const C = CHAIN_T;
  const sink = -24 * E.out(ph(t, S.stomp, S.stomp + 0.05));
  const d = t - S.rise0;
  if (d <= 0) return sink;
  if (t <= C.start) return sink + 70 * d + 170 * d * d;
  const d1 = C.start - S.rise0;
  const r1 = 70 * d1 + 170 * d1 * d1;
  const v1 = 70 + 340 * d1;
  const R_INF = 1025;
  let r = r1 + (R_INF - r1) * (1 - Math.exp((-(t - C.start) * v1) / (R_INF - r1)));
  const g = t - C.grab;
  if (g > 0) r += -45 * Math.exp(-g / 0.35) * Math.sin(Math.min(Math.PI, g * 9)) + 110 * g;
  // 五③ 人们一个抓住一个的脚踝：每接上一个人升一节、往下一坠，越升越快（lib/t53.ts）
  return sink + r + linkLift(t);
}
/** 五② 被天上的风往右带多远：从坑上方带到老钟家那扇窗的上方（138.02 远处那只脚踝正在窗口上方），之后跟着风慢慢漂 */
const SWEEP = 1615;
/** 穿着她的铁靴站在街上时他离地多高：铁靴最低的地方正好在街面上（铁靴按她的大小画，脚踝在他的脚踝上） */
let BOOT_LIFT: number | null = null;
function bootLift() {
  if (BOOT_LIFT === null) BOOT_LIFT = bootLow(0, 1) + castJoints(STONE_BARE, move(BOOTS5_T.land + 0.4).pose).ankleL[1];
  return BOOT_LIFT;
}
/** 四③ 她抱住他的时刻（和 lib/dive.ts 的 DIVE_T.catch 一样；那边要用这里的位置，这里不反过来引用那边） */
const PAIR_CATCH = 111.86;
/**
 * 两只手把砖举过头顶时砖的中心离脚多高：他的手举直了最多到离脚约 350（肩 254 + 胳膊 98），砖的两头要在手里——
 * 原来写的 470，四②、四⑦里砖一直悬在手上面 50–100
 */
const RAISE_Y = 355;
/** 举着的砖：先拎在近处那只手里垂在身边，再两只手举过头顶（中心、转角；拎着时砖的中心在手心下面一点） */
function brickAt(t: number, palmL: V2, root: V2): { c: V2; rot: number } {
  const hang: V2 = [palmL[0] - 6, palmL[1] + (BH * BS) / 2 + 4];
  const up: V2 = [root[0] - 8, root[1] - RAISE_Y];
  const u = E.io(ph(t, T.raise0, T.raise1));
  // 四③ 收到胸前抱着
  const h = E.io(ph(t, T.hug0, T.hug1));
  if (h > 0) return { c: mix(up, [root[0] - 30, root[1] - 250], h), rot: 0 };
  return { c: mix(hang, up, u), rot: -0.08 * (1 - u) };
}
/** 四⑥ 自己那块砖插进靴口插到哪了（0 还抱在胸口，1 插好了） */
const insertAt = (t: number) => E.io(ph(t, BRICK6_T.notice0, BRICK6_T.insert1));

// ——— 四⑤⑥ 她那块「活下去」：「咚」落地时从近处那只铁靴里震出来，翻着跟头斜靠到远处那只铁靴上（背面朝外）；四⑥ 他捡起来、翻过来 ———
const T6 = BRICK6_T;
/** 他捏着的地方：砖靠右那一头（砖自己的坐标，世界单位） */
const HER_GRIP = 43;
/** 站稳以后的几个位置（按「咚」以后站着的姿势算一次）：近处那只靴口、斜靠在远处那只铁靴上的砖（中心、转角、捏的地方） */
let HER_REST: { mouth: V2; c: V2; rot: number; grip: V2 } | null = null;
function herRest() {
  if (HER_REST) return HER_REST;
  const j = castJoints(STONE_BARE, move(BOOTS5_T.land + 0.4).pose);
  const y0 = -bootLift();
  const ankleL: V2 = [STONE_LAND_X + j.ankleL[0], y0 + j.ankleL[1]];
  const ankleR: V2 = [STONE_LAND_X + j.ankleR[0], y0 + j.ankleR[1]];
  // 几乎立着（79°）：下面那个角着地，右下角顶在远处那只铁靴的靴筒前沿（脚踝往前 34）——弯腰才够得着上头
  const rot = -1.38;
  const cs = Math.cos(rot);
  const sn = Math.sin(rot);
  const rp = (x: number, y: number): V2 => [x * cs - y * sn, x * sn + y * cs];
  const bottom = rp((-BW * BS) / 2, (BH * BS) / 2);
  const right = rp((BW * BS) / 2, (BH * BS) / 2);
  const c: V2 = [ankleR[0] - 34 - right[0], -bottom[1]];
  const g = rp(HER_GRIP, 0);
  HER_REST = { mouth: [ankleL[0] + 4, ankleL[1] - 78], c, rot, grip: [c[0] + g[0], c[1] + g[1]] };
  return HER_REST;
}
/**
 * 他远处那只手要去的地方：先是靠着的那块砖靠上那一头；捏住以后拎到脸前面（走一点弧线：先往上提、再往身前送）；
 * 「下」抱到胸口
 */
function herGripAt(t: number, root: V2): V2 {
  const R = herRest();
  if (t < T6.grab) return R.grip;
  const up: V2 = [root[0] - 65, root[1] - 265];
  const chest: V2 = [root[0] - 12, root[1] - 215];
  const u = E.io(ph(t, T6.grab, T6.rise1));
  const p = mix(R.grip, up, u);
  return mix([p[0] + 18 * Math.sin(Math.PI * u), p[1] - 10 * Math.sin(Math.PI * u)], chest, E.io(ph(t, T6.look0, T6.look1)));
}
// ——— 四⑦ 她那块砖翻到背面、搁在远处那只铁靴的靴口上当桌子，他在背面写「沉沉，明天见」；写完两只手举过头顶 ———
const T7 = WRITE7_T;
/**
 * 搁好时砖的中心：横搁在他插在近处那只铁靴靴口上的「妈妈，明天见」上头（那块露出靴口 50，上头在他腰的高度），
 * 往他身前偏一点（左头伸出去，远处那只手按着）
 */
export const rimBrick7 = () => rimBrick();
let RIM7: V2 | null = null;
function rimBrick(): V2 {
  if (RIM7) return RIM7;
  // 插好以后那块砖的中心在根 (+22, −124.5)，竖着，上头在中心往上半块砖长
  const root: V2 = [STONE_LAND_X, -bootLift()];
  const top = root[1] - 124.5 - (BW * BS) / 2;
  RIM7 = [root[0] + 22 - 32, top - (BH * BS) / 2];
  return RIM7;
}
/** 往上挣那一下（0 → 1 → 0，0.32 秒） */
const strainAt = (t: number) => {
  const d = t - T7.strain;
  return d <= 0 || d >= 0.32 ? 0 : Math.sin((Math.PI * d) / 0.32);
};
/** 四⑦ 她那块砖：从胸口往下送、一边绕长边翻到背面，搁到靴口上；写完两只手举过头顶（和四②举「妈妈，明天见」一样高），往上挣那一下跟着往上一窜 */
function herBrick7(t: number, root: V2): { c: V2; rot: number; flipY: number } {
  const g6 = herGripAt(T7.start, root);
  const rot6 = 0.08;
  const c6: V2 = [g6[0] - HER_GRIP * Math.cos(rot6), g6[1] - HER_GRIP * Math.sin(rot6)];
  const u = E.io(ph(t, T7.down0, T7.down1));
  const m = mix(c6, rimBrick(), u);
  let c: V2 = [m[0] - 14 * Math.sin(Math.PI * u), m[1]];
  const flipY = -Math.cos(Math.PI * E.io(ph(t, T7.down0 + 0.02, T7.down0 + 0.2)));
  const v = E.io(ph(t, T7.up0, T7.up1));
  const up = mix(c, [root[0] - 8, root[1] - RAISE_Y], v);
  c = [up[0] + 20 * Math.sin(Math.PI * v), up[1] - 6 * strainAt(t)];
  // 五① 放下来抱在胸口（两只手还捏着两头）；跺完飘起来时又举过头顶，跟着他往上走
  if (t >= STOMP_T.start) {
    const high: V2 = [root[0] - 8, root[1] - RAISE_Y];
    const chest: V2 = [root[0] - 30, root[1] - 245];
    c = mix(mix(high, chest, E.io(ph(t, STOMP_T.start + 0.08, STOMP_T.lower1))), high, E.io(ph(t, STOMP_T.rise0 + 0.1, STOMP_T.up1)));
  }
  // 五④ 升到她跟前时举着绕长边翻过来：她写的「活下去」朝外（把她的砖还给她）
  const f5 = t >= GIVE_T.flip0 ? Math.cos(Math.PI * E.io(ph(t, GIVE_T.flip0, GIVE_T.flip1))) : flipY;
  return { c, rot: rot6 * (1 - u), flipY: f5 };
}
/** 他握笔的手：从兜里掏出笔（近处那边的裤兜），笔尖跟着砖上写到的地方走（手心在笔尖右上），写完笔挪开 */
const PEN_GRIP: V2 = [36 * BS, -18 * BS];
function penAt7(t: number, root: V2): { palm: V2; tip: V2 } {
  const rim = rimBrick();
  const st = shenTip(t);
  const tip: V2 = [rim[0] + st[0] * BS, rim[1] + st[1] * BS];
  const write: V2 = [tip[0] + PEN_GRIP[0], tip[1] + PEN_GRIP[1]];
  const pocket: V2 = [root[0] + 30, root[1] - 172];
  const palm = mix(pocket, write, E.io(ph(t, T7.pen0 + 0.1, T7.pen1 + 0.04)));
  return { palm, tip: [palm[0] - PEN_GRIP[0], palm[1] - PEN_GRIP[1]] };
}
/** 四⑦ 两只手要去的地方：远处那只先捏着砖右头送下去，搁好以后挪到左头按住；近处那只掏笔、写字；写完两只手捏住砖的两头举起来 */
function hands7(t: number, root: V2, b: { c: V2; rot: number }) {
  const right: V2 = [b.c[0] + HER_GRIP * Math.cos(b.rot), b.c[1] + HER_GRIP * Math.sin(b.rot)];
  const raise = E.io(ph(t, T7.up0 - 0.06, T7.up0 + 0.1));
  const leftEnd = mix([b.c[0] - 40, b.c[1] - 12], [b.c[0] - 41.5, b.c[1] + 4], raise);
  const far = mix(right, leftEnd, E.io(ph(t, T7.down1, T7.down1 + 0.12)));
  const pen = penAt7(t, root);
  const near = mix(pen.palm, [b.c[0] + 41.5, b.c[1] + 4], E.io(ph(t, T7.stow - 0.04, T7.up0 + 0.08)));
  return { far, near, nearW: E.io(ph(t, T7.pen0, T7.pen0 + 0.1)) };
}

/** 她那块砖这一刻：中心、转角、翻面（正数背面朝外，负数翻过来看见字）；落地以前还在靴筒里（null）。grip：捏住以后跟着手走 */
function herBrickAt(t: number, grip: V2 | null, root: V2): { c: V2; rot: number; flipY: number } | null {
  const land = BOOTS5_T.land;
  if (t < land) return null;
  if (t >= T7.start) return herBrick7(t, root);
  const R = herRest();
  const FLY = 0.48;
  const d = t - land;
  if (d < FLY) {
    // 从靴口弹出来，翻着跟头飞一小段弧线（越转越慢），落下去靠到远处那只铁靴上
    const g = 3000;
    const y0 = R.mouth[1] - 10;
    const vy = (R.c[1] - y0 - 0.5 * g * FLY * FLY) / FLY;
    const u = d / FLY;
    return { c: [R.mouth[0] + (R.c[0] - R.mouth[0]) * u, y0 + vy * d + 0.5 * g * d * d], rot: -Math.PI / 2 + (R.rot - 2 * Math.PI + Math.PI / 2) * E.out(u), flipY: 1 };
  }
  if (!grip) {
    const e = d - FLY;
    return { c: R.c, rot: R.rot + 0.14 * Math.exp(-e / 0.05) * Math.sin(e * 45), flipY: 1 };
  }
  // 拎起来时砖跟着转平；抱到胸口时歪一点；绕长边一翻（手捏着的那一头在长边上，不动）
  const rot = R.rot * (1 - E.io(ph(t, T6.grab, T6.rise1))) + 0.08 * E.io(ph(t, T6.look0, T6.look1));
  const flipY = t < T6.flip0 ? 1 : t > T6.flip1 ? -1 : Math.cos(Math.PI * E.io(ph(t, T6.flip0, T6.flip1)));
  return { c: [grip[0] - HER_GRIP * Math.cos(rot), grip[1] - HER_GRIP * Math.sin(rot)], rot, flipY };
}

/** 他这一刻：姿势、根、手里的砖（世界坐标）；外套脱下来以后换成没穿外套的样子 */
export function stoneC4(t: number) {
  const spec = t >= T.off ? STONE_BARE : STONE;
  const p: PoseIn = { ...move(t).pose };
  const lift = liftAt(t);
  const root: V2 = [stoneX(t), -lift];
  const sc = spec.scale;
  const loc = (q: V2): V2 => [(q[0] - root[0]) / sc, (q[1] - root[1]) / sc];
  const j0 = castJoints(spec, p);
  const palm0: V2 = [root[0] + j0.palmL[0], root[1] + j0.palmL[1]];
  let b = brickAt(t, palm0, root);
  // 举起来时两只手在砖的两头
  const u = E.io(ph(t, T.raise0, T.raise1));
  if (u > 0) {
    const half = (BW * BS) / 2 - 6;
    // 四⑤ 往下坠以后只剩近处那只手抱着砖，远处那只松开去够她
    const far = u * (1 - E.io(ph(t, BOOTS5_T.release, BOOTS5_T.release + 0.15)));
    let tgt: V2 = [b.c[0] + half, b.c[1] + 4];
    let near = u;
    // 四⑥ 他捏着自己那块靠右那头，一边往下送一边竖过来，插进近处那只铁靴的靴口（插进去一小半，上头露出 50），插好就松手——
    // 腾出手来去捡她那块（靴口在他手刚够得着的地方：胳膊 98，肩到靴口上方那一头 86）
    const ins = insertAt(t);
    if (ins > 0) {
      // 五① 他从铁靴里飘出来以后，这块还插在靴口上（跟着铁靴留在坑里）
      const rootB: V2 = t >= STOMP_T.rise0 ? [stoneX(STOMP_T.rise0), -liftAt(STOMP_T.rise0)] : root;
      const grip: V2 = [rootB[0] + 26, rootB[1] - 166];
      const g2 = mix(tgt, grip, ins);
      const a = (-Math.PI / 2) * ins;
      tgt = [g2[0] + 14 * Math.sin(Math.PI * ins), g2[1]];
      b = { c: [tgt[0] - (half * Math.cos(a) - 4 * Math.sin(a)), tgt[1] - (half * Math.sin(a) + 4 * Math.cos(a))], rot: a };
      near = u * (1 - E.io(ph(t, T6.insert1, T6.insert1 + 0.16)));
    }
    if (near > 0) p.armL = { ...(p.armL as object), to: loc(tgt), ik: near } as PoseIn["armL"];
    if (far > 0) p.armR = { ...(p.armR as object), to: loc([b.c[0] - half, b.c[1] + 4]), ik: far } as PoseIn["armR"];
  }
  // 四⑥ 远处那只手：弯腰时伸到她那块砖靠上那一头，捏住以后跟着砖走（拎起来、翻过来、抱到胸口）
  const w6 = E.io(ph(t, T6.bend0 + 0.06, T6.grab - 0.02));
  const grip6 = herGripAt(t, root);
  if (w6 > 0) p.armR = { ...(p.armR as object), to: loc(grip6), ik: w6 } as PoseIn["armR"];
  const herBrick = herBrickAt(t, t >= T6.grab ? grip6 : null, root);
  // 四⑦ 两只手：远处那只送砖、按砖、举砖，近处那只掏笔、写字、举砖（近处那只手画在砖前面：chest over，砖在 beforeFrontArms 里画）
  if (t >= T7.start && herBrick) {
    // 五④ 递给她以后松手：两只手停在交出去的地方，IK 慢慢撤掉（底下的姿势是举着的样子，撤的时候不弹）
    const tb = Math.min(t, GIVE_T.give);
    const rootB: V2 = tb < t ? [stoneX(tb), -liftAt(tb)] : root;
    const h = hands7(tb, rootB, tb < t ? herBrick7(tb, rootB) : herBrick);
    const rel = 1 - E.io(ph(t, GIVE_T.give + 0.03, GIVE_T.let1));
    if (rel > 0) {
      p.armR = { ...(p.armR as object), to: loc(h.far), ik: rel } as PoseIn["armR"];
      p.armL = { ...(p.armL as object), to: loc(h.near), ik: h.nearW * rel, chest: "over" } as PoseIn["armL"];
    }
  }
  const j = castJoints(spec, p);
  const at = (q: number[]): V2 => [root[0] + q[0], root[1] + q[1]];
  return {
    spec,
    pose: p,
    root,
    lift,
    brick: b,
    herBrick,
    shoulderL: at(j.shoulderL),
    shoulderR: at(j.shoulderR),
    ankleL: at(j.ankleL),
    ankleR: at(j.ankleR),
    kneeL: at(j.kneeL),
    kneeR: at(j.kneeR),
  };
}

/** 他脱下来的那件橘色外套：从肩上滑下去、往下掉，「咚」掉在他脚边堆成一团（下摆那圈铅先着地；和主歌二⑥同一个画法） */
let COAT_FROM: { a: V2; b: V2 } | null = null;
function drawLooseCoat(g: CanvasRenderingContext2D, t: number) {
  if (t < T.off) return;
  if (!COAT_FROM) {
    const s0 = stoneC4(T.off - 0.001);
    COAT_FROM = { a: s0.shoulderR, b: s0.shoulderL };
  }
  const { a, b } = COAT_FROM;
  const floor = 6;
  const k = 1;
  const len = 170;
  const lw = 3.2;
  const orange = "#f29a4a";
  const shade = "#de8538";
  const d = t - T.off;
  const fall = Math.min(1, d / (T.thud - T.off));
  const top0 = Math.min(a[1], b[1]);
  const yTop = top0 + (floor - 30 - top0) * fall * fall;
  const lo = Math.min(yTop + len, floor);
  const h = lo - yTop;
  const spread = 1 + 0.8 * Math.max(0, 1 - h / len);
  const cx = (a[0] + b[0]) / 2 + 10 * fall;
  const half = (Math.abs(b[0] - a[0]) / 2 + 14) * spread;
  if (t < T.thud) {
    const A: V2 = [cx - half, yTop];
    const B: V2 = [cx + half, yTop];
    const path = new Path2D();
    path.moveTo(A[0], A[1]);
    path.quadraticCurveTo(cx, yTop + 24 * k, B[0], B[1]);
    path.quadraticCurveTo(B[0] + 14 * k * spread, yTop + h * 0.5, B[0] + 26 * k * spread, lo);
    path.lineTo(A[0] - 26 * k * spread, lo);
    path.quadraticCurveTo(A[0] - 14 * k * spread, yTop + h * 0.5, A[0], A[1]);
    path.closePath();
    part(g, path, orange, shade, lw, [5, 4]);
    g.save();
    g.clip(path);
    g.fillStyle = "#8a6a5a";
    g.fillRect(cx - 200, lo - 24, 400, 30);
    g.strokeStyle = "rgba(160,80,30,0.45)";
    g.lineWidth = 3;
    for (const f of [-0.35, 0.35]) {
      g.beginPath();
      g.moveTo(cx + half * f, yTop + 30);
      g.quadraticCurveTo(cx + half * f * 1.2, yTop + h * 0.6, cx + half * f * 1.4, lo - 26);
      g.stroke();
    }
    g.restore();
    return;
  }
  // 堆在地上的一团（落地一弹；五① 他跺下去那一下被震得蹦起来、掀一下）
  const ds = t - STOMP_T.stomp;
  const settle = Math.exp(-(t - T.thud) / 0.06) * Math.sin((t - T.thud) * 40) * 8 + (ds > 0 ? Math.exp(-ds / 0.12) * Math.abs(Math.sin(ds * 26)) * 30 : 0);
  const w = 115;
  const ht = 46;
  const heap = new Path2D();
  heap.moveTo(cx - w, floor);
  heap.quadraticCurveTo(cx - w * 0.95, floor - ht * 0.9 - settle, cx - w * 0.2, floor - ht - settle);
  heap.quadraticCurveTo(cx + w * 0.45, floor - ht * 1.12 - settle, cx + w * 0.92, floor - ht * 0.45);
  heap.quadraticCurveTo(cx + w * 1.08, floor - 4, cx + w * 0.86, floor);
  heap.closePath();
  part(g, heap, orange, shade, lw, [5, 4]);
  g.save();
  g.clip(heap);
  g.fillStyle = "#8a6a5a";
  g.fillRect(cx - w * 1.2, floor - ht * 0.32, w * 2.4, ht);
  g.strokeStyle = "rgba(160,80,30,0.45)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cx - w * 0.3, floor - ht * 0.9);
  g.quadraticCurveTo(cx - w * 0.12, floor - ht * 0.55, cx - w * 0.22, floor - ht * 0.2);
  g.moveTo(cx + w * 0.3, floor - ht * 0.95);
  g.quadraticCurveTo(cx + w * 0.46, floor - ht * 0.55, cx + w * 0.4, floor - ht * 0.2);
  g.stroke();
  g.restore();
}

/** 脚下一块软影子（离地越高越淡越小） */
function shadow(g: CanvasRenderingContext2D, x: number, lift: number, w: number) {
  const k = Math.max(0, 1 - lift / 900);
  if (k <= 0.02) return;
  g.save();
  g.fillStyle = `rgba(70,46,52,${0.26 * k})`;
  g.beginPath();
  g.ellipse(x + 12, 4, w * (0.5 + 0.5 * k), 16 * (0.6 + 0.4 * k), 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** 画街上的他（世界坐标，人这一层）：影子、掉下来的外套、他、手里的砖（举过头顶时在两只手之间、头顶上） */
export function drawCoat4(g: CanvasRenderingContext2D, t: number, z: number, ground = true) {
  const s = stoneC4(t);
  // ground：地上的影子、外套、铁靴里那块（五⑤ 在她怀里落回街上时这些先画，见 drawCoatGround / drawGiftStay，人站在它们前面）
  if (ground) {
    shadow(g, s.root[0], s.lift, 70);
    drawLooseCoat(g, t);
  }
  const raised = t > (T.raise0 + T.raise1) / 2;
  // 四⑥ 往靴口里插的时候起画在两只铁靴中间（drawGiftInBoot：近处那只铁靴盖住插进去的那一截）
  const brick = () => t < T6.notice0 && drawGiftBrick(g, t, s.brick.c, s.brick.rot, BS);
  if (!raised) brick();
  // 四⑦ 她那块砖画在他身子前面、近处那只手臂后面（写字、捏着砖头的那只手压在砖上）
  const hb = s.herBrick;
  const M = g.getTransform();
  const before =
    t >= T7.start && hb
      ? (cc: CanvasRenderingContext2D) => {
          // 回调里的变换是人自己的（原点在脚底、按身高缩放）：换回世界的再画；插在近处那只铁靴里的那块也挪到这一层
          // （写最后几个字时握笔的手从它前面过），近处那只铁靴后画，照样盖住插进去的那一截
          cc.save();
          cc.setTransform(M);
          // 五④ 起她那块砖画在所有人上面（lib/meet.ts：他递给她、她捧着，两个人的手都捏在两头后面）
          if (t < GIVE_T.start) drawHerBrick(cc, t, hb.c, hb.rot, BS, hb.flipY);
          if (ground) drawGiftBrick(cc, t, s.brick.c, s.brick.rot, BS);
          cc.restore();
        }
      : undefined;
  drawPerson(g, s.spec, s.pose, s.root[0], s.root[1], z, before ? { beforeFrontArms: before } : {});
  if (raised) brick();
}
/** 五⑤ 地上的：他的影子、他妈妈那件外套（街上的人站在它们前面，先画） */
export function drawCoatGround(g: CanvasRenderingContext2D, t: number) {
  const s = stoneC4(t);
  shadow(g, s.root[0], s.lift, 70);
  drawLooseCoat(g, t);
}
/** 五⑤ 插在坑里那只铁靴靴口上的「妈妈，明天见」（画在两只铁靴中间：drawKidBoots 的 between） */
export function drawGiftStay(g: CanvasRenderingContext2D, t: number) {
  const s = stoneC4(t);
  drawGiftBrick(g, t, s.brick.c, s.brick.rot, BS);
}
/** 四⑦ 他手里那支两块五的笔（掏出来以后、收起来以前；按街上的大小画：屋里的 1/1.22） */
export function drawPen7(g: CanvasRenderingContext2D, t: number, z: number) {
  if (t < T7.pen0 + 0.1 || t >= T7.stow) return;
  const { palm, tip } = penAt7(t, stoneC4(t).root);
  g.save();
  g.translate(tip[0], tip[1]);
  g.scale(BS, BS);
  drawPen(g, [(palm[0] - tip[0]) / BS, (palm[1] - tip[1]) / BS], [0, 0], 1 / Math.sqrt(Math.max(0.3, z)));
  g.restore();
}
/** 四⑥ 他自己那块往近处那只铁靴里插、插好以后（画在远处那只铁靴后面、近处那只前面：靴筒盖住插进去的那一截） */
export function drawGiftInBoot(g: CanvasRenderingContext2D, t: number) {
  // 四⑦ 起在 drawCoat4 里画（近处那只手臂后面）
  if (t < T6.notice0 || t >= T7.start) return;
  const s = stoneC4(t);
  drawGiftBrick(g, t, s.brick.c, s.brick.rot, BS);
}
/** 四⑤⑥ 画在铁靴前面的砖：她那块（震出来、靠在靴子上、他拿着） */
export function drawStoneBricks(g: CanvasRenderingContext2D, t: number) {
  // 四⑦ 起画在他身子前面、近处那只手臂后面（drawCoat4）
  if (t >= T7.start) return;
  const s = stoneC4(t);
  if (s.herBrick) drawHerBrick(g, t, s.herBrick.c, s.herBrick.rot, BS, s.herBrick.flipY);
}

/** 远景到近景的倍数（远处那几栋高楼按它淡进来） */
export const COAT4_WIDE = 0.14;
/** 只画他和手里的砖（四④ 被她抱着时画在她的身子和手臂之间；地上的外套、影子不画） */
export function drawStone4(g: CanvasRenderingContext2D, t: number, z: number) {
  const s = stoneC4(t);
  drawPerson(g, s.spec, s.pose, s.root[0], s.root[1], z);
  drawGiftBrick(g, t, s.brick.c, s.brick.rot, BS);
}

/**
 * 四②的镜头：切过来是远景（白压在画面最上面，她家那栋楼一直通到白底下，他小小的一个人站在楼脚下，画面 1380），停一下；
 * 108.28 起推到他身上（E.io，0.95 倍，他的腰在画面 1210）；外套「咚」落地那一下往前一顶、一震；脚跟离地以后跟着他往上抬
 * （他在画面上慢慢往上走），不往回拉
 */
export function coat4Cam(t: number): Cam {
  const wide = aim(STONE_X + 40, 0, 540, 1380, COAT4_WIDE);
  const close = aim(STONE_X + 40, -180, 540, 1210, 0.95);
  let c = camLerp(wide, close, E.io(ph(t, T.push0, T.push1)));
  const lift = liftAt(t);
  const up = aim(STONE_X + 40, -180 - lift, 540, 1210 - 260 * E.io(ph(t, T.lift0, T.end + 0.3)), 0.97);
  c = camLerp(c, up, E.io(ph(t, T.lift0 - 0.05, T.lift0 + 0.25)));
  const kk = kick(t, T.thud, 0.1);
  return { ...c, z: c.z * (1 + 0.04 * kk), y: c.y + (6 * kk * Math.sin((t - T.thud) * 55)) / c.z };
}
