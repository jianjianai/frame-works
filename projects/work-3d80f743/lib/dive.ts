// 四③「希望这首歌能被记起」（109.95–111.95；希 109.89 望 110.1 这 110.31 首 110.52 歌 110.73 能 110.94 被 111.15 记 111.36 起 111.57，
// 约每字 0.21 秒；110.02、111.02 重拍）：镜头接着四②往上抬，越抬越快，越过飘着的他，顺着她家那栋楼一路甩到顶层她那扇窗（天快亮，
// 窗黑着，铁栅栏门关着），停一下；111.02「哐」铁栅栏门被撞开，她穿着铁靴从窗口扑出去，头朝下往下冲，镜头跟着她往下甩；
// 111.86 她在半空一把抱住往上飘的他（一震）。不拍她醒来。
// 坐标是世界坐标（和第一幕同一条街，街面 y = 0）；人按 1 倍画（这个世界里人本来就有两层楼高，从窗里扑出来时人比窗大）。

import { type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { castJoints } from "@materials/剪纸角色/code/cast";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { ARMS, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { homeWindow } from "./night";
import { coat4Cam, stoneC4 } from "./coatoff";
import { BOOTS5_T } from "./t5";
import { BRICK6_T } from "./t6";
import { WRITE7_T } from "./t7";
import { MORNING8_T } from "./t8";
import { GIVE_T } from "./t54";
import { LAND_T, landChest } from "./t55";

type V2 = [number, number];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

export const DIVE_T = {
  start: 109.95,
  /** 往上甩到她那扇窗（越抬越快，到窗前收住） */
  up1: 110.62,
  /** 「哐」铁栅栏门被撞开，她扑出去 */
  bang: beatAt(222),
  /** 扑出窗口以后头朝下往下冲（越冲越快）；镜头从这里起跟着她 */
  out: 111.12,
  /** 一把抱住他 */
  catch: 111.86,
  end: 111.95,
};
const T = DIVE_T;

/** 她那扇窗的中心（世界坐标） */
const winC = (): V2 => {
  const w = homeWindow();
  return [w.x + w.w / 2, w.y + w.h / 2];
};

/** 铁栅栏门转到哪（night.ts 的 setCage：1 关上，−0.32 往左开着）：「哐」一下甩开、撞到墙上弹回来一点 */
export function cageAt(t: number) {
  const d = t - T.bang;
  if (d <= 0) return 1;
  if (d < 0.07) return 1 - 1.5 * E.out(d / 0.07);
  return -0.32 - 0.18 * Math.exp(-(d - 0.07) / 0.06) * Math.cos((d - 0.07) * 40);
}

// ——— 她：朝右（他在窗的右下方，朝着他扑下去；朝右的人 rot 负数是往前栽、IK 的目标 x 取反） ———
const HER = {
  /** 扑出窗口：身子往前一探，两只手往前伸 */
  扑: pose(40, { face: 1, ground: false, rot: -50, ...legL(-46, -8, -40), ...legR(34, -60, -20), neck: 26, expression: "使劲", teeth: 0.5, lookX: -0.4, lookY: 0.6 }, (l) => ({
    ...armL(118, 10, 0, "open", l),
    ...armR(108, 14, 0, "open", l),
  })),
  /** 头朝下往下冲：两只手往下伸着够他（举过头顶就是朝下），腿在上面，咬着牙盯着他 */
  冲: pose(0, { face: 1, ground: false, rot: 165, ...legL(-14, -26, -20), ...legR(18, -40, -20), neck: 18, expression: "使劲", teeth: 0.6, lookX: 0, lookY: -0.8 }, (l) => ({
    ...armL(165, 10, 0, "open", l),
    ...armR(155, 14, 0, "open", l),
  })),
  /**
   * 四⑤ 把两只脚伸到他脚边（腿 IK 到他的脚踝上）：身子直起来，还抱着他。手臂的角度照着环在他背上时 IK 算出来的样子写
   * （上臂往下、前臂往前折），松手 IK 一撤，手臂从这里张开朝下伸向他，不会先弹回别的角度（原来写着 64/96，松手时两只手往上一举）
   */
  套靴: pose(6, { face: 1, ground: false, rot: 0, chestL: "over", ...legL(30, -60, -20), ...legR(40, -70, -20), neck: -24, expression: "坚定", lookX: 0.3, lookY: 0.9 }, (l) => ({
    ...armL(10, 50, 0, "grip", l),
    ...armR(10, 70, 0, "grip", l),
  })),
  /**
   * 四⑤ 松开手往上飘：光着脚，没了分量（头发、围巾往上漾）；身子往后仰一点（头朝左上、光脚朝着右下的他），两只手张着朝下伸向他
   * （刚把他推开），低头看着他——整个人是一条从他指向白的斜线
   */
  飘: pose(-4, { face: 1, ground: false, rot: 15, float: 0.5, ...legL(-8, -20, -40), ...legR(10, -34, -40), neck: -26, expression: "微笑", smile: 0.7, tears: 1, lookX: 0.2, lookY: 1 }, (l) => ({
    ...armL(28, 6, 0, "open", l),
    ...armR(14, 22, 0, "open", l),
  })),
  /** 一把抱住：身子甩过来，两只手臂环在他身上（IK） */
  抱: pose(18, { face: 1, ground: false, rot: -25, chestL: "over", ...legL(-20, -50, -30), ...legR(30, -80, -20), neck: -6, expression: "使劲", teeth: 0.4, lookX: 0.3, lookY: 0.4 }, (l) => ({
    ...armL(64, 96, 0, "grip", l),
    ...armR(76, 90, 0, "grip", l),
  })),
};
/** 四⑤ 仰起脸朝着白，两只手举起来（「释然」） */
const HER_UP = { ...HER.飘, neck: 26, expression: "释然", smile: 0.6, lookX: 0, lookY: -1, ...armL(150, 20, 0, "open", -4), ...armR(140, 20, 0, "open", -4) };
/**
 * 四⑧ 白的边上闭上眼睛、张开手：身子转过来一点（face 0.25，不过正面），近处那只手往后、远处那只往前上，朝两边张开
 * （和副歌一⑤妈妈张着手一个样子），闭着眼含泪笑
 */
const HER_OPEN = { ...HER.飘, face: 0.25, rot: 4, neck: 16, expression: "释然", smile: 0.55, tears: 1, lookX: 0, lookY: -0.5, ...armL(-70, 20, 0, "open", -4), ...armR(118, 18, 0, "open", -4) };
// ——— 五④ 他升到跟前，把她那块砖递上来（lib/t54.ts）———
/** 低头看见他升到跟前：一惊，身子往他那边探一点，两只手往下伸（底下的角度照着接砖时 IK 的样子写，IK 撤的时候不弹） */
const HER_SEE = pose(-2, { face: 0.3, ground: false, rot: -6, float: 0.5, ...legL(-6, -22, -40), ...legR(12, -36, -40), neck: -24, expression: "惊", tears: 1, lookX: 0.35, lookY: 0.9 }, (l) => ({
  ...armL(40, 40, 0, "open", l),
  ...armR(30, 36, 0, "open", l),
}));
/** 接住砖：两只手捏在两头（IK），含着泪 */
const HER_TAKE = { ...HER_SEE, expression: "含泪" as const, tears: 1, ...armL(30, 24, 0, "grip", -2), ...armR(24, 28, 0, "grip", -2) };
/** 捧到胸前看（她自己写的「活下去」）：两只手捏着两头（IK），低头看着砖 */
const HER_HOLD = pose(-2, { face: 0.3, ground: false, rot: -2, float: 0.5, ...legL(-6, -22, -40), ...legR(12, -36, -40), neck: -16, expression: "含泪", tears: 1, lookX: 0.25, lookY: 0.75 }, (l) => ({
  ...armL(40, 100, 0, "grip", l),
  ...armR(30, 92, 0, "grip", l),
}));
/** 翻过来看见背面的「沉沉，明天见」：忍着哭 */
const HER_READ = { ...HER_HOLD, expression: "忍着哭" as const, tears: 1 };
/** 砖亮起来：哭着笑；有了分量，头发、围巾落下来 */
const HER_GLOW = { ...HER_HOLD, expression: "哭着笑" as const, tears: 1, float: 0.15 };
/** 抱住他：身子往他那边弯下去，两只手环在他背上（IK；近处那只手臂压在他身上），低着头闭着眼哭着笑 */
const HER_HUG = pose(8, { face: 0.3, ground: false, rot: -10, float: 0.15, chestL: "over", ...legL(-6, -24, -40), ...legR(14, -40, -40), neck: -26, expression: "哭着笑", tears: 1, blink: 0.8, lookX: 0.3, lookY: 0.8 }, (l) => ({
  ...armL(60, 96, 0, "grip", l),
  ...armR(52, 104, 0, "grip", l),
}));
// ——— 五⑤ 落回街上（lib/t55.ts，故事时间）———
/** 快落地：还抱着他，两条腿往下伸 */
const HER_HUG_DOWN = { ...HER_HUG, rot: -4, ...legL(-4, -10, -20), ...legR(8, -14, -20) };
/** 光着脚站在街上抱着他（两只手环在他背上，IK） */
const HER_STAND = pose(4, { face: 0.3, ground: false, lift: 0, rot: 0, float: 0.15, chestL: "over", ...legL(-4, -6, 0), ...legR(6, -8, 0), neck: -14, expression: "哭着笑", tears: 1, lookX: 0.3, lookY: 0.5 }, (l) => ({
  ...armL(60, 96, 0, "grip", l),
  ...armR(52, 104, 0, "grip", l),
}));
/** 往前一步：远处那只脚（前脚）抬起来往前迈，近处那只往后蹬（钉在地上） */
const HER_STEP_UP = { ...HER_STAND, ...legR(34, -50, 0), ...legL(-12, -8, 0) };
/** 前脚落下去踩实 */
const HER_STEP_DOWN = { ...HER_STAND, ...legR(16, -6, 0), ...legL(-18, -8, 0) };
const herMove = live(
  [
    { t: T.bang - 0.2, x: 0, p: HER.扑 },
    { t: T.bang + 0.03, p: HER.扑 },
    { t: T.out + 0.16, ease: "inOut", p: HER.冲 },
    // 头朝下一直冲到他跟前，两只手环住他；抱住以后身子才甩过来（甩过来的大半在下一镜）
    { t: T.catch + 0.02, p: HER.冲 },
    { t: T.catch + 0.36, ease: "inOut", p: HER.抱 },
    // 四④ 抬头看一眼越来越近的白，再低头看着怀里的他
    { t: 113.05, p: HER.抱 },
    { t: 113.3, ease: "inOut", p: { ...HER.抱, neck: 30, expression: "平常", teeth: 0, lookX: 0.2, lookY: -1 } },
    { t: 113.48, p: { ...HER.抱, neck: 30, expression: "平常", teeth: 0, lookX: 0.2, lookY: -1 } },
    { t: 113.76, ease: "inOut", p: { ...HER.抱, neck: -22, expression: "心疼", teeth: 0, lookX: 0.4, lookY: 0.8 } },
    // 四⑤ 把脚伸到他脚边、抽出来；「下」松开手往上飘，低头冲他笑了一下；之后仰起脸朝着白
    { t: BOOTS5_T.legs0, p: { ...HER.抱, neck: -22, expression: "心疼", teeth: 0, lookX: 0.4, lookY: 0.8 } },
    { t: BOOTS5_T.legs1 + 0.04, ease: "inOut", p: HER.套靴 },
    { t: BOOTS5_T.release, p: HER.套靴 },
    { t: BOOTS5_T.release + 0.2, ease: "out", p: { ...HER.飘, smile: 0.3, rot: 0 } },
    { t: BOOTS5_T.smile1, ease: "inOut", p: { ...HER.飘, rot: 0 } },
    // 他坠到她脚底下以后身子才慢慢往后仰（早仰的话光脚扫过他）
    { t: 115.0, p: { ...HER.飘, rot: 0 } },
    { t: 115.5, ease: "inOut", p: HER.飘 },
    { t: BOOTS5_T.up0, p: HER.飘 },
    { t: BOOTS5_T.up1, ease: "inOut", p: HER_UP },
    // 四⑥ 从网中间穿过去；「去」低头看他一眼（两只手还举着，只有头低下去），笑一下，再仰起脸朝着白
    { t: BRICK6_T.down0, p: HER_UP },
    { t: BRICK6_T.down1, ease: "inOut", p: { ...HER_UP, neck: -26, expression: "微笑", smile: 0.75, lookX: -0.1, lookY: 1 } },
    { t: BRICK6_T.smile1, p: { ...HER_UP, neck: -26, expression: "微笑", smile: 0.75, lookX: -0.1, lookY: 1 } },
    { t: BRICK6_T.up1, ease: "inOut", p: HER_UP },
    // 四⑧ 白的边上：她闭上眼睛，张开手（身子转过来一点，两只手朝两边张开）
    { t: MORNING8_T.open0, p: HER_UP },
    { t: MORNING8_T.open1, ease: "inOut", p: HER_OPEN },
    // 五④ 他升到跟前：睁开眼（眼睛先往下），低头看见他，一惊；两只手伸下来接住砖，捧到胸前——是她自己写的「活下去」；
    // 翻过来，背面是「沉沉，明天见」，忍着哭；砖亮起来，哭着笑，头发落下来；看向他，抱住他
    { t: GIVE_T.eyes0, p: HER_OPEN },
    { t: GIVE_T.eyes0 + 0.12, ease: "out", p: { ...HER_OPEN, expression: "惊", tears: 1, lookX: 0.35, lookY: 0.9 } },
    { t: GIVE_T.look1, ease: "inOut", p: HER_SEE },
    { t: GIVE_T.give, ease: "inOut", p: HER_TAKE },
    { t: GIVE_T.hold1, ease: "inOut", p: HER_HOLD },
    { t: GIVE_T.turn1 + 0.04, p: HER_HOLD },
    { t: GIVE_T.glow - 0.06, ease: "inOut", p: HER_READ },
    { t: GIVE_T.glow + 0.32, ease: "inOut", p: HER_GLOW },
    { t: GIVE_T.hug0 - 0.08, p: HER_GLOW },
    { t: GIVE_T.hug0 + 0.06, ease: "out", p: { ...HER_GLOW, lookX: 0.4, lookY: 0.95 } },
    { t: GIVE_T.hug1, ease: "inOut", p: HER_HUG },
    // 五⑤ 抱着他慢慢往下落（天上）；跳过去以后快落地，两条腿往下伸，155.5 光着脚落在街上（膝盖一软）；抬起头看左边的千斤、
    // 右边的周磊，哭着笑；往前一步（前脚抬起来往前迈，后脚钉在地上），157.4「咚」
    { t: LAND_T.start + 1.5, p: HER_HUG },
    { t: LAND_T.street0, p: HER_HUG_DOWN },
    { t: LAND_T.land, ease: "inOut", squash: 0.05, p: HER_STAND },
    { t: LAND_T.land + 0.16, ease: "out", p: HER_STAND },
    { t: LAND_T.hand1 - 0.1, p: HER_STAND },
    { t: LAND_T.hand1 + 0.14, ease: "inOut", p: { ...HER_STAND, neck: 6, lookX: -0.7, lookY: 0.1 } },
    { t: LAND_T.hand2 - 0.06, p: { ...HER_STAND, neck: 6, lookX: -0.7, lookY: 0.1 } },
    { t: LAND_T.hand2 + 0.16, ease: "inOut", p: { ...HER_STAND, neck: 6, lookX: 0.7, lookY: 0.1 } },
    { t: LAND_T.step0, ease: "inOut", p: { ...HER_STAND, neck: -2, lookX: 0.45, lookY: 0.3 } },
    { t: LAND_T.step0 + 0.22, ease: "inOut", p: { ...HER_STEP_UP, neck: -2, lookX: 0.45, lookY: 0.3 } },
    { t: LAND_T.step, ease: "in", squash: 0.05, p: { ...HER_STEP_DOWN, neck: -2, lookX: 0.45, lookY: 0.3 } },
    { t: LAND_T.step + 0.2, ease: "out", p: { ...HER_STEP_DOWN, neck: -2, lookX: 0.45, lookY: 0.3 } },
    { t: 160, p: { ...HER_STEP_DOWN, neck: -2, lookX: 0.45, lookY: 0.3 } },
  ] as MoveKey[],
  { look: CHENGTUO, base: { chestL: "under", chestR: "under" }, idle: true, seed: 231, springs: ARMS, follow: 0 },
);
/** 四⑥ 风把她往右带多远：从她家那栋楼左半边的上空带到楼顶右边那张网里（三③窗口那一镜看得见的那片天里没有网） */
const SKY_DRIFT = 1150;
/** 四⑦⑧ 她最后停在哪（胸口的高度）：头顶挨着白的边（白在 −9200） */
const Y_HOVER = -8990;
/** 五④ 砖亮起来时往下沉多少 */
const SINK = 65;
/** 她胸口相对根的位置（按姿势） */
const chestOff = (p: PoseIn): V2 => {
  const j = jointsOf(p);
  return [(j.shoulderL[0] + j.shoulderR[0]) / 2, (j.shoulderL[1] + j.shoulderR[1]) / 2 + 40];
};
/** 他的胸口（世界坐标） */
function kidChest(t: number): V2 {
  const s = stoneC4(t);
  const j = castJoints(s.spec, s.pose);
  return [s.root[0] + (j.shoulderL[0] + j.shoulderR[0]) / 2, s.root[1] + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 30];
}
/**
 * 抱住的地方：头朝下扑到他跟前，她的胸口在他头顶上面一点（两只手往下环住他）；抱住以后身子甩过来，胸口挪到他左上方贴着他（四④）；
 * 四⑤ 把脚伸到他脚边时身子往上提一点、往他那边靠一点（腿才伸得直、光脚才有地方从靴筒里抽出来；手还够得着他的背）
 */
const meetAt = (t: number): V2 => {
  const c = kidChest(t);
  const k = E.io(ph(t, T.catch, T.catch + 0.36));
  const r = E.io(ph(t, BOOTS5_T.legs0, BOOTS5_T.legs1));
  return [c[0] - 20 - 50 * k + 25 * r, c[1] - 190 + 150 * k - 35 * r];
};
/** 她的胸口在哪：从窗口扑出来，越冲越快，正好在抱住那一刻到他跟前；抱住以后贴着他 */
function herChest(t: number): V2 {
  // 五⑤ 抱着他往下落、落回街上（lib/t55.ts）
  if (t > LAND_T.start) return landChest(t);
  const [wx, wy] = winC();
  const start: V2 = [wx, wy + 60];
  if (t < T.out) return mix([wx, wy], start, E.out(ph(t, T.bang, T.out)));
  const B5 = BOOTS5_T;
  if (t >= B5.release) {
    // 四⑤ 松开手：光着脚一下子轻了，越飘越快地往上，往左偏一点（离开他头顶）
    const c = meetAt(B5.release);
    const d = Math.min(t, BRICK6_T.start) - B5.release;
    const x = c[0] - 60 * E.out(Math.min(1, d / 1.2));
    const y = c[1] - (100 * d + 250 * d * d);
    if (t <= BRICK6_T.start) return [x, y];
    // 四⑥ 越往上越慢（照四⑤的速度一直冲的话 119.3 就撞进白里了）：速度按 1.53 秒衰减到每秒 50，121.89 停在白下面约 400
    // （第四声「活下去」才到白的边上）；到了楼顶以上，风把她往右带过去（楼顶右边那张网），120.2 以后只剩一点漂
    const v0 = 100 + 500 * d;
    const td = 1.53;
    const vEnd = 50;
    const yAt = (tau: number) => y - (vEnd * tau + (v0 - vEnd) * td * (1 - Math.exp(-tau / td)));
    const xAt = (tt: number) => x + SKY_DRIFT * E.io(ph(tt, BRICK6_T.start, 120.2)) + 40 * Math.max(0, tt - 120.2);
    if (t <= WRITE7_T.start) return [xAt(t), yAt(t - BRICK6_T.start)];
    // 四⑦⑧ 到了白底下慢慢停住（速度接上，往 Y_HOVER 贴过去）：头顶正好挨着白的边，第四声「活下去」她在那里闭上眼、发梢化成光；
    // 往右漂停下来、往回荡一点（停在网里左上那个人和右边那个人中间，张开手也碰不到他们）
    const t1 = WRITE7_T.start - BRICK6_T.start;
    const y1 = yAt(t1);
    const v1 = vEnd + (v0 - vEnd) * Math.exp(-t1 / td);
    const e = t - WRITE7_T.start;
    // 五④ 伸手接砖时往他那边探一点；砖亮起来那一下它第一次在她手里有了分量：往下一沉（离开白的边，五⑤ 接着慢慢落下去）；
    // 抱住他时弯下身子靠过去
    const G = GIVE_T;
    const reach = E.io(ph(t, G.reach0 - 0.15, G.give)) - 0.6 * E.io(ph(t, G.give, G.hold1));
    const sink = E.io(ph(t, G.glow, G.glow + 0.6));
    const hug = E.io(ph(t, G.hug0, G.hug1));
    return [
      xAt(WRITE7_T.start) - 20 * (1 - Math.exp(-e / 2)) + 10 * reach + 10 * hug,
      Y_HOVER + (y1 - Y_HOVER) * Math.exp((-e * v1) / (y1 - Y_HOVER)) + 14 * reach + SINK * sink + 26 * hug,
    ];
  }
  if (t >= T.catch) return meetAt(t);
  const d = t - T.out;
  const D = T.catch - T.out;
  const end = meetAt(T.catch);
  const v0 = 900;
  const a = (2 * (end[1] - start[1] - v0 * D)) / (D * D);
  return [start[0] + (end[0] - start[0]) * (d / D) ** 1.4, start[1] + v0 * d + 0.5 * a * d * d];
}
/** 她这一刻：姿势（风、头发往上甩）、根；抱住时两只手 IK 环在他身上 */
export function diveHer(t: number) {
  const p: PoseIn = { ...herMove(t).pose };
  // 往下冲：头发、围巾顺着身子往脚那头甩（受力 = 身子的「下」：头朝下时朝上，转正以后就是平常往下垂）；
  // 直接给朝上的受力，人一转正长发就竖成一根根尖
  // （动作引擎出来的 rot 已经是弧度；受力和身子在同一个没镜像的坐标里，朝右也不用改号，和 room.ts 躺进床里同一个算法；
  // 四⑤ 光着脚飘起来时再乘上失重）
  const B5 = BOOTS5_T;
  // 四⑤ 两只脚从铁靴里抽出来（铁靴留在他脚上，由 lib/boots5.ts 画）
  if (t >= B5.slipR) p.legR = { ...(p.legR as object), boot: false } as PoseIn["legR"];
  if (t >= B5.slipL) p.legL = { ...(p.legL as object), boot: false } as PoseIn["legL"];
  const fl = (p.float as number | undefined) ?? 0;
  const r = (p.rot as number | undefined) ?? 0;
  p.gravity = [-Math.sin(r) * (1 - 2 * fl), Math.cos(r) * (1 - 2 * fl)];
  const c = herChest(t);
  const off = chestOff(p);
  let root: V2 = [c[0] - off[0], c[1] - off[1]];
  // 五⑤ 往前一步：后脚（近处那只）钉在地上，根按它反推（脚不滑）；踩实以后就停在那里
  if (t >= LAND_T.step0) root = [stepPlant() - jointsOf(p).ankleL[0], root[1]];
  // 四⑤ 两只脚伸到他脚边：腿 IK 到他的脚踝上（朝右：目标 x 取反）；抽出来时光脚先顺着靴筒往上、再往她身后收
  // （从他的铁靴后面露出来，膝盖跪着似的折起来）；松手时收回到飘着的样子
  const wl = E.io(ph(t, B5.legs0, B5.legs1)) * (1 - E.io(ph(t, B5.release, B5.release + 0.2)));
  if (wl > 0) {
    const k = stoneC4(t);
    const loc = (q: V2): V2 => [-(q[0] - root[0]), q[1] - root[1]];
    const foot = (a: V2, dx: number, slip: number): V2 => {
      const u = ph(t, slip, slip + B5.pull);
      return [a[0] + dx - 140 * E.io(u), a[1] - 6 - 80 * E.out(u)];
    };
    p.legL = { ...(p.legL as object), to: loc(foot(k.ankleL, -4, B5.slipL)), ik: wl } as PoseIn["legL"];
    p.legR = { ...(p.legR as object), to: loc(foot(k.ankleR, 4, B5.slipR)), ik: wl } as PoseIn["legR"];
  }
  // 两只手环到他背上（他抱着砖在胸前）；四⑤「下」松开
  const w = E.io(ph(t, T.catch - 0.1, T.catch)) * (1 - E.io(ph(t, B5.release, B5.release + 0.15)));
  if (w > 0) {
    const k = kidChest(t);
    const loc = (q: V2): V2 => [-(q[0] - root[0]), q[1] - root[1]];
    p.armL = { ...(p.armL as object), to: loc([k[0] + 46, k[1] + 10]), ik: w } as PoseIn["armL"];
    p.armR = { ...(p.armR as object), to: loc([k[0] + 40, k[1] - 20]), ik: w } as PoseIn["armR"];
  }
  // 五④ 两只手接住砖、捧着、翻过来（IK 到砖的两头：近处那只在左头、远处那只在右头）；抱住他时从砖的两头挪到他背上
  const G = GIVE_T;
  const wg = E.io(ph(t, G.reach0, G.give));
  if (wg > 0) {
    const loc = (q: V2): V2 => [-(q[0] - root[0]), q[1] - root[1]];
    const b = brick5(t);
    const cs = Math.cos(b.rot);
    const sn = Math.sin(b.rot);
    const end = (dx: number): V2 => [b.c[0] + dx * cs - 4 * sn, b.c[1] + dx * sn + 4 * cs];
    const s5 = E.io(ph(t, G.hug0, G.hug1 - 0.05));
    let tl = end(-40);
    let tr = end(40);
    if (s5 > 0) {
      const k = kidChest(t);
      tl = mix(tl, [k[0] + 44, k[1] + 14], s5);
      tr = mix(tr, [k[0] + 38, k[1] - 22], s5);
    }
    p.armL = { ...(p.armL as object), to: loc(tl), ik: wg } as PoseIn["armL"];
    p.armR = { ...(p.armR as object), to: loc(tr), ik: wg } as PoseIn["armR"];
  }
  return { pose: p, root, chest: c };
}

/** 五⑤ 往前一步时钉在地上的那只脚（近处那只脚踝，世界的 x）：抬脚那一刻站着的位置 */
let PLANT: number | null = null;
function stepPlant() {
  if (PLANT === null) {
    const p = herMove(LAND_T.step0).pose;
    const c = herChest(LAND_T.step0);
    const off = chestOff(p);
    PLANT = c[0] - off[0] + jointsOf(p).ankleL[0];
  }
  return PLANT;
}
/** 五④ 她那块砖接住那一刻在哪（他举着的手里） */
let BRICK_GIVE: { c: V2; rot: number; flipY: number } | null = null;
/**
 * 五④ 她那块砖：中心、转角、翻面（负数「活下去」朝外，正数「沉沉，明天见」朝外）。146.02 以前在他举着的手里（lib/coatoff.ts，
 * 他升到跟前时翻过来，她写的「活下去」朝外）；接住以后跟着她的手走一小段弧线捧到胸前右边，绕长边翻过来；抱住他时夹在两个人中间
 */
export function brick5(t: number): { c: V2; rot: number; flipY: number } {
  const G = GIVE_T;
  if (t <= G.give) return stoneC4(t).herBrick!;
  BRICK_GIVE ??= stoneC4(G.give).herBrick!;
  const b0 = BRICK_GIVE;
  const c = herChest(t);
  const read: V2 = [c[0] + 55, c[1] + 18];
  const u = E.io(ph(t, G.give, G.hold1));
  const m = mix(b0.c, read, u);
  let at: V2 = [m[0] - 10 * Math.sin(Math.PI * u), m[1] - 14 * Math.sin(Math.PI * u)];
  const h = E.io(ph(t, G.hug0, G.hug1));
  if (h > 0) {
    const k = kidChest(t);
    at = mix(at, [(c[0] + k[0]) / 2 + 6, (c[1] + k[1]) / 2 + 4], h);
  }
  const flipY = t < G.turn0 ? b0.flipY : -Math.cos(Math.PI * E.io(ph(t, G.turn0, G.turn1)));
  return { c: at, rot: b0.rot * (1 - u) - 0.06 * u * (1 - h), flipY };
}
/** 她在不在画面里（扑出来以前在屋里） */
export const herOut = (t: number) => t >= T.bang;

/** 画她（世界坐标，人这一层） */
export function drawDiveHer(g: CanvasRenderingContext2D, t: number, z: number) {
  if (!herOut(t)) return;
  const h = diveHer(t);
  g.save();
  g.translate(h.root[0], h.root[1]);
  drawChengtuo(g, h.pose, { line: 1 / Math.sqrt(Math.max(0.3, z)) });
  g.restore();
}

/** 抱住以后画两个人（世界坐标）：他画在她的身子和近处那只手臂之间（beforeFrontArms，那只手臂 chest: over，环在他身上） */
export function drawHugPair(g: CanvasRenderingContext2D, t: number, z: number, drawKid: (g: CanvasRenderingContext2D) => void) {
  const h = diveHer(t);
  const line = 1 / Math.sqrt(Math.max(0.3, z));
  const M = g.getTransform();
  g.save();
  g.translate(h.root[0], h.root[1]);
  drawChengtuo(g, h.pose, {
    line,
    beforeFrontArms: (cc) => {
      cc.save();
      cc.setTransform(M);
      drawKid(cc);
      cc.restore();
    },
  });
  g.restore();
}

/**
 * 四③的镜头：接着四②（跟着他往上的那个取景）越抬越快地往上甩，越过他，顺着楼一路甩到她那扇窗（E.io，到窗前收住），
 * 停一下（很轻的漂）；「哐」一震；跟着她往下甩（她的胸口在画面 760，越冲越快），他从画面下面升上来；抱住那一下猛地停住、一震
 */
export function diveCam(t: number): Cam {
  const z = 0.9;
  const [wx, wy] = winC();
  // 接着四②那个跟着他往上的镜头（速度接上），越抬越快地甩到窗前
  const c0 = coat4Cam(t);
  const win = aim(wx, wy, 540, 900, z);
  const u = E.io(ph(t, T.start, T.up1));
  let c: Cam = { x: c0.x + (win.x - c0.x) * u, y: c0.y + (win.y - c0.y) * u, z: c0.z * Math.pow(z / c0.z, u), r: 0 };
  if (t >= T.out - 0.04) {
    // 她扑出来以后跟着她往下（从窗前的取景接过去，0.16 秒）
    const h = herChest(Math.max(t, T.out));
    const follow = aim(h[0] + 60, h[1], 540, 760 + 220 * ph(t, T.catch - 0.3, T.catch), z);
    c = camLerp(c, follow, E.io(ph(t, T.out - 0.04, T.out + 0.12)));
  }
  const kb = kick(t, T.bang, 0.08);
  const kc = kick(t, T.catch, 0.1);
  return { ...c, z: c.z * (1 + 0.03 * kb + 0.04 * kc), y: c.y + (6 * kb * Math.sin((t - T.bang) * 60) + 8 * kc * Math.sin((t - T.catch) * 55)) / c.z };
}
/** 镜头这一帧在画面上竖着走了多少像素（往上甩、往下甩时给背景拖影用；抱住那一帧以后不拖） */
export function diveSmear(t: number): number {
  if (t >= T.catch) return 0;
  const a = diveCam(t);
  const b = diveCam(t - 1 / 60);
  return (a.y - b.y) * a.z;
}
