// 副歌一②–⑥（43.92–55.98）的人和东西：小石头、妈妈、沉沉、红绳、外套、小刀。镜头在 lib/streetcam.ts（一个镜头）。
// 2026-10-22 用户重做（「注意按照情绪运镜，物理，和动作。运镜和动作是视频的核心」）：
//   ② 我们的周围并非没光亮（43.92–45.93）：儿子飘在空中，妈妈攥着红绳，自己也被带到了半空（离街面两层楼高）。她一把一把往下拽——
//      拽的时候她自己往上、儿子往下（她比他重一倍：她走 1/3，他走 2/3），两个人一直在往上飘。「亮」她把他拽进怀里。
//   ③ 只是太耀眼将我们灼伤（45.93–47.94）：抱在一起，她把缝着铅的外套脱下来裹在他身上；「灼」把他推开——
//      推出去的那一下两个人往两边分开：他有了外套的分量往下掉，她没了外套更轻、往上飘；48.02 红绳绷直，一顿。
//   ④ 在这个世界难免会迷茫（47.94–49.95）：沉沉从左边跑过来，「会」起跳，「茫」在最高点抓住他的脚踝——她的分量把一串人往下一坠，
//      惯性往下坠一点（铁靴不着地），拽不住，三个人接着往上飘。
//   ⑤ 但别再把小刀带在身上（49.95–51.93）：「但」50.017 铁靴离了地，三个人一起往上飘；妈妈低头看见铁靴离了地，哭着笑，掏出小刀，
//      「带」割断拴在自己手腕上的红绳——她一下往上飞走（越飞越快），两个人掉回街上（「身」落地）。
//   ⑥ 至少我还在为你而歌唱（51.93–53.94）：沉沉抱着他跪在街上，镜头不动；52.517 天上炸开彩色的光（她碰到了白，在画面外）。
//   ⑦ 在黑暗漫长的反乌托邦（53.94–55.98）：54.518 小刀从天上掉下来，「叮」扎在他们跟前的街面上，靠在她的铁靴上；两个人看着它，
//      沉沉抬头看着天——溶进十二年前（lib/memory.ts）。（2026-10-22 用户：「这里捡起小刀的情节删掉比较好」：原来沉沉拔起来、收进口袋）

import { CAST, type CastSpec, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type Angles, type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf, swapSides } from "@materials/剪纸角色/code/chengtuo";
import { type DrawOptions, type Look, type Rig, drawFigure } from "@materials/剪纸角色/code/figure";
import { beatAt } from "@frame/engine/tempo";
import { E, LANDSCAPE, ph } from "./cam";
import { INK, drawGlow, part } from "./world";
import { ARMS, LIMP, SMOOTH, live } from "./motion";
import { CHEN, armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";
import { MOM, MOM_X, STONE, pose } from "./dawn";
import { drawKnife as drawKnife0 } from "./knife";
import { leadBand, standCollar } from "./leadcoat";

type V2 = [number, number];
const mix = (a: V2, b: V2, k: number): V2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];

export const MT = {
  start: 43.92,
  /** ② 三把往下拽：[开始, 拉到胸前]（「周」卡拍、「非」「光」） */
  pull: [
    [44.31, beatAt(89)],
    [44.86, 45.06],
    [45.26, 45.45],
  ] as [number, number][],
  /** 两把之间另一只手往上够、攥住红绳 */
  reach: [
    [44.56, 44.82],
    [45.08, 45.24],
  ] as [number, number][],
  /** 「亮」把他拽进怀里，「只」抱住 */
  haul: 45.47,
  hug: 45.93,
  /** ③ 脱外套、裹上 */
  coat0: 46.17,
  coatOff: 46.4,
  wrap: 46.83,
  /** 「我们」搂紧，「灼」推开 */
  brace: 47.16,
  push: 47.46,
  /** 小节线：红绳绷直 */
  taut: beatAt(96),
  /** ④ 沉沉跑进来、蹲、「会」起跳、「茫」抓住 */
  run0: 47.92,
  crouch: 48.56,
  jump: 48.75,
  grab: 49.11,
  /** 她的分量把一串人往下坠，惯性坠到最低（铁靴还没着地），然后接着往上飘 */
  ground: 49.6,
  /** ⑤「但」小节线：铁靴离了地 */
  lift: beatAt(100),
  /** 妈妈低头看见铁靴离了地 */
  see: 50.19,
  /** 掏刀、伸到手腕上 */
  knife0: 50.34,
  knife1: 50.85,
  /** 「带」割断 */
  cut: 51.06,
  /** 「身」落回街上（下面按落地的时刻反算往下掉的加速度） */
  land: 51.43,
  /** ⑥ 她碰到白（画面外）：天上炸开彩色的光 */
  touch: beatAt(105),
  /** ⑦ 小刀扎在街面上 */
  knifeLand: beatAt(109),
  up: 55.95,
  end: 55.98,
};

const MOM_BARE: CastSpec = { ...MOM, coat: undefined };
const STONE_COAT = CAST.小石头穿妈妈的外套;

// ——————————————————— 姿势 ———————————————————
/** 差不多正对镜头、稍微朝左（|face| ≥ 0.25 两只鞋尖才都朝左；−0.2 时右脚鞋尖朝外，用户：「妈妈的右脚姿势奇怪」「是否能改成朝左」） */
const MF = { face: -0.26, ground: false } as const;
const SF = { face: 0.6, ground: false } as const;
const CF = { face: 1, ground: false } as const;

export const MOM_P = {
  /** 吊在红绳上：两只手举过头顶攥着，仰着头看他，担心；腿垂着 */
  攥: pose(-4, { ...MF, float: 0, ...legR(10, -24, -44), ...legL(-6, -16, -50), neck: 26, expression: "担心", lookX: -0.25, lookY: -1 }, (l) => ({
    ...armL(170, 20, 0, "grip", l),
    ...armR(160, 30, 0, "grip", l),
  })),
  /** 一把拽到胸前：膝盖跟着往上收（拽的劲把她自己往上带），咬着牙 */
  拽: pose(10, { ...MF, float: 0, ...legR(46, -72, -30), ...legL(32, -62, -36), neck: 16, expression: "使劲", teeth: 0.6, sad: 0.45, lookX: -0.25, lookY: -1 }, (l) => ({
    ...armL(60, 70, 0, "grip", l),
    ...armR(150, 30, 0, "grip", l),
  })),
  /** 抱住他：两只手环到他背上，低头贴着他，含着泪 */
  抱: pose(6, { ...MF, float: 0, ...legR(18, -36, -44), ...legL(-2, -22, -50), neck: -12, expression: "含泪", sad: 0.75, tears: 0.55, lookX: -0.5, lookY: 0.5 }, (l) => ({
    ...armL(50, 80, 0, "open", l),
    ...armR(40, 90, 0, "open", l),
  })),
  /** 脱外套：两只手抓着领子往后、往下褪 */
  脱: pose(4, { ...MF, float: 0, ...legR(14, -30, -40), ...legL(-4, -20, -50), neck: -8, expression: "坚定", sad: 0.6, lookX: -0.45, lookY: 0.5 }, (l) => ({
    ...armL(-30, 130, 0, "grip", l),
    ...armR(-24, 126, 0, "grip", l),
  })),
  /** 裹：两只手把外套绕到他肩膀上 */
  裹: pose(10, { ...MF, float: 0, ...legR(16, -34, -40), ...legL(-4, -22, -50), neck: -14, expression: "含泪", tears: 0.6, lookX: -0.45, lookY: 0.6 }, (l) => ({
    ...armL(40, 60, 0, "grip", l),
    ...armR(46, 56, 0, "grip", l),
  })),
  /** 看着他：额头低下来贴着他，哭着笑 */
  看他: pose(8, { ...MF, float: 0, ...legR(18, -36, -40), ...legL(0, -24, -50), neck: -18, expression: "哭着笑", lookX: -0.5, lookY: 0.6 }, (l) => ({
    ...armL(50, 80, 0, "grip", l),
    ...armR(40, 90, 0, "grip", l),
  })),
  /** 搂紧：闭上眼，攒劲 */
  搂紧: pose(12, { ...MF, float: 0, ...legR(24, -44, -40), ...legL(6, -30, -50), neck: -20, expression: "忍着哭", blink: 1, tears: 0.7 }, (l) => ({
    ...armL(50, 80, 0, "grip", l),
    ...armR(40, 90, 0, "grip", l),
  })),
  /** 推开：两只手往下推出去，身子被反推得往上、往后仰，腿往下甩；忍着哭 */
  推: pose(-14, { ...MF, float: 0, ...legR(-6, -14, -60), ...legL(-16, -8, -66), neck: -26, expression: "忍着哭", tears: 0.85, lookX: -0.3, lookY: 0.9 }, (l) => ({
    ...armL(24, 10, 0, "open", l),
    ...armR(34, 8, 0, "open", l),
  })),
  /** 吊着他：红绳拴在远处那只手腕上，胳膊被拽直，近处的手张着；低头看着他，含着泪 */
  坠: pose(2, { ...MF, float: 0, ...legR(14, -30, -46), ...legL(-4, -20, -52), neck: -26, expression: "含泪", sad: 0.8, tears: 0.6, lookX: -0.2, lookY: 1 }, (l) => ({
    ...armL(-40, 30, 0, "open", l),
    ...armR(4, 6, 0, "grip", l),
  })),
  /** 绷直那一下：一惊 */
  一顿: pose(6, { ...MF, float: 0, ...legR(30, -50, -36), ...legL(10, -36, -46), neck: -14, expression: "吓一跳", lookX: -0.2, lookY: 1 }, (l) => ({
    ...armL(-70, 40, 0, "open", l),
    ...armR(4, 6, 0, "grip", l),
  })),
  /** 看见她的铁靴离了地：睁大眼 */
  看见: pose(4, { ...MF, float: 0, ...legR(14, -30, -46), ...legL(-4, -20, -52), neck: -30, expression: "惊", sad: 0.6, lookX: -0.2, lookY: 1 }, (l) => ({
    ...armL(-30, 40, 0, "open", l),
    ...armR(4, 6, 0, "grip", l),
  })),
  /** 舍得：哭着笑，近处的手伸进口袋掏刀 */
  掏刀: pose(6, { ...MF, float: 0, ...legR(16, -32, -46), ...legL(-2, -22, -52), neck: -24, expression: "哭着笑", lookX: -0.2, lookY: 1 }, (l) => ({
    ...armL(-10, 60, 0, "grip", l),
    ...armR(4, 6, 0, "grip", l),
  })),
  /** 割：近处那只手拿着刀伸到远处的手腕上 */
  割: pose(8, { ...MF, float: 0, ...legR(18, -34, -46), ...legL(0, -24, -52), neck: -22, expression: "哭着笑", lookX: -0.2, lookY: 0.9 }, (l) => ({
    ...armL(20, 70, 0, "grip", l),
    ...armR(10, 10, 0, "grip", l),
  })),
  /** 割断了：两只手张开，往上飞走，低头看着他们 */
  飞走: pose(-6, { ...MF, float: 0.25, rot: -4, ...legR(6, -24, -58), ...legL(-10, -14, -62), neck: -30, expression: "哭着笑", lookX: -0.15, lookY: 1 }, (l) => ({
    ...armL(-60, 20, 0, "grip", l),
    ...armR(60, 20, 0, "open", l),
  })),
};

export const STONE_P = {
  /** 飘着：人一绝望才会飘起来——仰着脸、眼睛半闭、含着泪，两只手软软地张着，腿垂着 */
  飘: pose(-4, { ...SF, float: 0.15, rot: -6, ...legL(4, -40, -40), ...legR(14, -30, -36), neck: 28, expression: "含泪", sad: 0.8, blink: 0.55, smile: 0.1, tears: 0.6, lookY: -1 }, (l) => ({
    ...armL(40, 40, 0, "open", l),
    ...armR(120, 20, 0, "open", l),
  })),
  /** 被拽了一把：一惊，低头看妈妈 */
  一顿: pose(2, { ...SF, float: 0.1, rot: 14, ...legL(-2, -4, -40), ...legR(24, -46, -36), neck: -10, expression: "吓一跳", lookX: -0.3, lookY: 0.8 }, (l) => ({
    ...armL(70, 30, 0, "open", l),
    ...armR(110, 26, 0, "open", l),
  })),
  /** 哭着把手伸向妈妈 */
  伸向她: pose(8, { ...SF, float: 0.1, rot: 30, ...legL(-4, -20, -40), ...legR(10, -30, -36), neck: -20, expression: "忍着哭", tears: 0.8, lookX: -0.3, lookY: 0.8 }, (l) => ({
    ...armL(60, 20, 0, "open", l),
    ...armR(80, 16, 0, "open", l),
  })),
  /** 搂着妈妈的脖子（IK），脸埋着哭 */
  抱: pose(4, { ...SF, float: 0, rot: 0, ...legL(-2, -24, -40), ...legR(8, -30, -36), neck: -10, expression: "忍着哭", blink: 1, tears: 0.8 }, (l) => ({
    ...armL(120, 60, 0, "grip", l),
    ...armR(110, 70, 0, "grip", l),
  })),
  /** 裹在外套里：仰头看她 */
  看她: pose(0, { ...SF, float: 0, rot: 0, ...legL(-2, -20, -40), ...legR(6, -16, -36), neck: 18, expression: "含泪", tears: 0.7, lookX: -0.4, lookY: -0.7 }, (l) => ({
    ...armL(120, 60, 0, "grip", l),
    ...armR(110, 70, 0, "grip", l),
  })),
  /** 被推开：两只手往上够她，张着嘴哭 */
  被推: pose(-6, { ...SF, float: 0, rot: 4, ...legL(10, -40, -30), ...legR(24, -50, -30), neck: 30, expression: "吓一跳", sad: 0.8, tears: 1, lookX: -0.2, lookY: -1 }, (l) => ({
    ...armL(150, 20, 0, "open", l),
    ...armR(165, 16, 0, "open", l),
  })),
  /** 攥着红绳吊在下面（IK），仰头看着妈妈哭 */
  攥绳: pose(0, { ...SF, float: 0, rot: 0, ...legL(-6, -4, -40), ...legR(20, -36, -36), neck: 26, expression: "忍着哭", tears: 0.9, lookX: -0.2, lookY: -0.9 }, (l) => ({
    ...armL(165, 24, 0, "grip", l),
    ...armR(170, 20, 0, "grip", l),
  })),
  /** 看见刀：张嘴喊 */
  喊: pose(0, { ...SF, float: 0, rot: 0, ...legL(-6, -4, -40), ...legR(26, -44, -36), neck: 30, expression: "吓一跳", sad: 0.9, tears: 1, open: 0.7, lookX: -0.2, lookY: -1 }, (l) => ({
    ...armL(165, 24, 0, "grip", l),
    ...armR(170, 20, 0, "grip", l),
  })),
  /** 在沉沉怀里：腿蜷着，近处的手搂着她，远处的手伸向天上 */
  伸手: pose(-6, { ...SF, float: 0, rot: 0, ...legL(60, -80, -20), ...legR(70, -90, -20), neck: 34, expression: "忍着哭", tears: 0.9, lookX: -0.2, lookY: -1 }, (l) => ({
    ...armL(40, 70, 0, "relax", l),
    ...armR(165, 14, 0, "open", l),
  })),
  /** 落地以后：挺起身子、手伸得更高，张着嘴喊她 */
  伸手喊: pose(-10, { ...SF, float: 0, rot: 0, ...legL(56, -76, -20), ...legR(66, -86, -20), neck: 40, expression: "吓一跳", sad: 1, tears: 1, open: 0.75, lookX: -0.2, lookY: -1 }, (l) => ({
    ...armL(40, 70, 0, "relax", l),
    ...armR(175, 6, 0, "open", l),
  })),
  /** 彩光照下来：愣住，嘴合上一半，手还举着 */
  伸手愣: pose(-8, { ...SF, float: 0, rot: 0, ...legL(58, -78, -20), ...legR(68, -88, -20), neck: 38, expression: "含泪", sad: 1, tears: 1, open: 0.25, lookX: -0.2, lookY: -1 }, (l) => ({
    ...armL(40, 70, 0, "relax", l),
    ...armR(168, 12, 0, "open", l),
  })),
  /** 明白了：手慢慢落下来，手指收拢，头还仰着 */
  手落: pose(0, { ...SF, float: 0, rot: 0, ...legL(62, -82, -20), ...legR(72, -90, -20), neck: 22, expression: "忍着哭", tears: 1, lookX: -0.2, lookY: -0.6 }, (l) => ({
    ...armL(50, 80, 0, "relax", l),
    ...armR(95, 60, 0, "relax", l),
  })),
  /** 埋进沉沉怀里哭：两只手攥着她，头低下去，闭着眼 */
  埋头: pose(14, { ...SF, float: 0, rot: 0, ...legL(64, -84, -20), ...legR(74, -92, -20), neck: -22, expression: "忍着哭", blink: 1, lookY: 0.6 }, (l) => ({
    ...armL(70, 110, 0, "grip", l),
    ...armR(80, 104, 0, "grip", l),
  })),
  /** 扭过头看掉下来的刀，往后缩进她怀里（把她跟前让开） */
  看刀: pose(-8, { ...SF, float: 0, rot: 0, ...legL(70, -100, -20), ...legR(80, -108, -20), neck: 0, expression: "含泪", tears: 0.8, lookX: 0.5, lookY: 0.6 }, (l) => ({
    ...armL(70, 110, 0, "grip", l),
    ...armR(80, 104, 0, "grip", l),
  })),
};

const RUN = (p: Angles, swap: boolean) => ({ ...(swap ? swapSides(p) : p), face: 1 });
export const CHEN_P = {
  /** 刹住、蹲下攒劲：眼睛盯着他的脚踝 */
  蹲: { ...CHEN.蹲, face: 1, lift: 0 } as Angles,
  /** 起跳：全身伸直、两只手往上够 */
  起跳: { ...CHEN.起跳, face: 1, lift: 0 } as Angles,
  /** 吊在他脚踝上：两只手举直攥着（IK），铁靴坠着腿，咬着牙 */
  抓: pose(-2, { ...CF, ...legR(8, -10, -30), ...legL(-6, -8, -36), neck: 24, expression: "使劲", teeth: 0.5, lookX: -0.2, lookY: -1 }, (l) => ({
    ...armL(170, 10, 0, "grip", l),
    ...armR(175, 8, 0, "grip", l),
  })),
  /** 坠到最低：惯性把两条腿甩向前，铁靴悬在街面上，咬着牙攥紧 */
  悬: pose(-6, { ...CF, ...legR(30, -34, -20), ...legL(10, -30, -30), neck: 20, expression: "使劲", teeth: 0.8, lookX: -0.3, lookY: -0.9 }, (l) => ({
    ...armL(160, 12, 0, "grip", l),
    ...armR(165, 9, 0, "grip", l),
  })),
  /** 铁靴离了地：两条腿悬着，一惊，低头看自己的脚 */
  离地: pose(-4, { ...CF, ...legR(16, -30, -30), ...legL(-8, -40, -40), neck: -12, expression: "吓一跳", lookX: -0.2, lookY: 0.7 }, (l) => ({
    ...armL(165, 14, 0, "grip", l),
    ...armR(170, 10, 0, "grip", l),
  })),
  /** 抬头看妈妈掏出刀来 */
  看她: pose(-4, { ...CF, ...legR(16, -30, -30), ...legL(-8, -40, -40), neck: 28, expression: "惊", sad: 0.5, lookX: -0.2, lookY: -1 }, (l) => ({
    ...armL(165, 14, 0, "grip", l),
    ...armR(170, 10, 0, "grip", l),
  })),
  /** 落地接住：膝盖一弯跪下去，两只手搂住他（IK），仰头看天上 */
  接住: pose(12, { ...CF, ...legR(84, -96, 0), ...legL(36, -112, 0), neck: 42, expression: "难过", tears: 0.6, lookX: -0.2, lookY: -1 }, (l) => ({
    ...armL(60, 90, 0, "grip", l),
    ...armR(70, 84, 0, "grip", l),
  })),
  /** 天上那一下光：仰着脸，含着泪 */
  望光: pose(8, { ...CF, ...legR(84, -96, 0), ...legL(36, -112, 0), neck: 46, expression: "含泪", sad: 0.9, tears: 0.9, lookX: -0.1, lookY: -1 }, (l) => ({
    ...armL(60, 90, 0, "grip", l),
    ...armR(70, 84, 0, "grip", l),
  })),
  /** 紧紧抱住他：身子弯下来护着他，低头贴着他的头，闭着眼 */
  抱紧: pose(26, { ...CF, ...legR(84, -96, 0), ...legL(36, -112, 0), neck: -18, expression: "难过", blink: 0.9, lookY: 0.6 }, (l) => ({
    ...armL(60, 90, 0, "grip", l),
    ...armR(70, 84, 0, "grip", l),
  })),
  /** 刀扎下来：睁开眼，扭头看它 */
  看刀: pose(20, { ...CF, ...legR(84, -96, 0), ...legL(36, -112, 0), neck: -16, expression: "惊", sad: 0.6, lookX: 0.4, lookY: 0.8 }, (l) => ({
    ...armL(60, 90, 0, "grip", l),
    ...armR(70, 84, 0, "grip", l),
  })),
  /** 抬头看天：含着泪（溶进十二年前那个仰着头的她） */
  仰头: pose(8, { ...CF, ...legR(84, -96, 0), ...legL(36, -112, 0), neck: 44, expression: "难过", tears: 0.8, lookX: 0.1, lookY: -1 }, (l) => ({
    ...armL(-10, 40, 0, "relax", l),
    ...armR(70, 84, 0, "grip", l),
  })),
};

// ——————————————————— 关键帧 ———————————————————
const T = MT;
const P = T.pull;
const momMove = live(
  [
    { t: 43.6, x: 0, p: MOM_P.攥 },
    { t: P[0][0], p: MOM_P.攥 },
    { t: P[0][1], ease: "out", p: MOM_P.拽 },
    { t: P[1][0] - 0.02, ease: "inOut", p: MOM_P.攥 },
    { t: P[1][1], ease: "out", p: MOM_P.拽 },
    { t: P[2][0] - 0.02, ease: "inOut", p: MOM_P.攥 },
    { t: P[2][1], ease: "out", p: MOM_P.拽 },
    { t: T.hug, ease: "inOut", p: MOM_P.抱 },
    { t: T.coat0, p: MOM_P.抱 },
    { t: T.coat0 + 0.18, ease: "inOut", p: MOM_P.脱 },
    { t: T.coatOff + 0.14, ease: "inOut", p: MOM_P.裹 },
    { t: T.wrap, p: MOM_P.裹 },
    { t: T.wrap + 0.24, ease: "inOut", p: MOM_P.看他 },
    { t: T.brace, p: MOM_P.看他 },
    { t: T.push - 0.04, ease: "inOut", p: MOM_P.搂紧 },
    { t: T.push + 0.12, ease: "out", p: MOM_P.推 },
    { t: T.taut - 0.02, p: MOM_P.推 },
    { t: T.taut + 0.08, ease: "out", p: MOM_P.一顿 },
    { t: T.taut + 0.5, ease: "inOut", p: MOM_P.坠 },
    { t: T.lift, p: MOM_P.坠 },
    { t: T.see, ease: "inOut", p: MOM_P.看见 },
    { t: T.knife0 - 0.02, p: MOM_P.看见 },
    { t: T.knife0 + 0.2, ease: "inOut", p: MOM_P.掏刀 },
    { t: T.knife1, ease: "inOut", p: MOM_P.割 },
    { t: T.cut + 0.02, p: MOM_P.割 },
    { t: T.cut + 0.3, ease: "out", p: MOM_P.飞走 },
    { t: 54, p: MOM_P.飞走 },
  ] as MoveKey[],
  { look: lookOf(MOM), base: { wind: 0.6 }, idle: true, seed: 41, springs: ARMS, follow: 0 },
);
const stoneMove = live(
  [
    { t: 43.6, x: 0, p: STONE_P.飘 },
    { t: P[0][1] - 0.04, p: STONE_P.飘 },
    { t: P[0][1] + 0.06, ease: "out", p: STONE_P.一顿 },
    { t: P[1][1], ease: "inOut", p: STONE_P.伸向她 },
    { t: T.haul + 0.1, p: STONE_P.伸向她 },
    { t: T.hug, ease: "inOut", p: STONE_P.抱 },
    { t: T.wrap - 0.05, p: STONE_P.抱 },
    { t: T.wrap + 0.2, ease: "inOut", p: STONE_P.看她 },
    { t: T.push - 0.02, p: STONE_P.看她 },
    { t: T.push + 0.1, ease: "out", p: STONE_P.被推 },
    { t: T.push + 0.32, p: STONE_P.被推 },
    { t: T.taut - 0.04, ease: "inOut", p: STONE_P.攥绳 },
    { t: T.knife1 - 0.25, p: STONE_P.攥绳 },
    { t: T.knife1 - 0.05, ease: "out", p: STONE_P.喊 },
    { t: T.cut + 0.05, p: STONE_P.喊 },
    { t: T.land, ease: "out", p: STONE_P.伸手 },
    { t: T.land + 0.3, ease: "out", p: STONE_P.伸手喊 },
    { t: T.touch - 0.04, p: STONE_P.伸手喊 },
    { t: T.touch + 0.14, ease: "out", p: STONE_P.伸手愣 },
    { t: 52.85, p: STONE_P.伸手愣 },
    { t: 53.15, ease: "inOut", p: STONE_P.手落 },
    { t: 53.45, ease: "inOut", p: STONE_P.埋头 },
    { t: T.knifeLand + 0.04, p: STONE_P.埋头 },
    { t: T.knifeLand + 0.3, ease: "inOut", p: STONE_P.看刀 },
    { t: 55.2, p: STONE_P.看刀 },
    { t: 55.6, ease: "inOut", p: STONE_P.埋头 },
    { t: 73, p: STONE_P.埋头 },
  ] as MoveKey[],
  { look: lookOf(STONE), base: { wind: 0.6 }, idle: true, seed: 43, springs: LIMP, follow: 0 },
);
// 沉沉：从最高那栋楼那边跑过来（一步 0.2 秒），刹住蹲下、起跳、抓住
const RUN0 = T.run0;
const chenMove = live(
  [
    { t: RUN0, x: 0, p: RUN(CHEN.跑_蹬地, false) },
    { t: RUN0 + 0.08, ease: SMOOTH, p: RUN(CHEN.跑_腾空, false) },
    { t: RUN0 + 0.13, ease: SMOOTH, p: RUN(CHEN.跑_落地, true) },
    { t: RUN0 + 0.2, ease: SMOOTH, p: RUN(CHEN.跑_蹬地, true) },
    { t: RUN0 + 0.28, ease: SMOOTH, p: RUN(CHEN.跑_腾空, true) },
    { t: RUN0 + 0.33, ease: SMOOTH, p: RUN(CHEN.跑_落地, false) },
    { t: RUN0 + 0.4, ease: SMOOTH, p: RUN(CHEN.跑_蹬地, false) },
    { t: RUN0 + 0.48, ease: SMOOTH, p: RUN(CHEN.跑_腾空, false) },
    { t: RUN0 + 0.53, ease: SMOOTH, p: RUN(CHEN.跑_落地, true) },
    { t: T.crouch + 0.12, ease: "out", squash: 0.1, p: CHEN_P.蹲 },
    { t: T.jump, p: CHEN_P.蹲 },
    { t: T.jump + 0.1, ease: "out", squash: 0, p: CHEN_P.起跳 },
    { t: T.grab - 0.04, ease: "inOut", p: CHEN_P.抓 },
    { t: T.ground, ease: "out", p: CHEN_P.悬 },
    { t: T.lift - 0.02, p: CHEN_P.悬 },
    { t: T.lift + 0.16, ease: "out", p: CHEN_P.离地 },
    { t: T.knife0 + 0.1, p: CHEN_P.离地 },
    { t: T.knife0 + 0.35, ease: "inOut", p: CHEN_P.看她 },
    { t: T.cut, p: CHEN_P.看她 },
    { t: T.land + 0.04, ease: "out", squash: 0.1, p: CHEN_P.接住 },
    { t: T.land + 0.22, ease: "out", squash: 0, p: CHEN_P.接住 },
    { t: T.touch - 0.1, p: CHEN_P.接住 },
    { t: T.touch + 0.2, ease: "out", p: CHEN_P.望光 },
    { t: 53.2, p: CHEN_P.望光 },
    { t: 53.65, ease: "inOut", p: CHEN_P.抱紧 },
    { t: T.knifeLand + 0.03, p: CHEN_P.抱紧 },
    { t: T.knifeLand + 0.2, ease: "out", p: CHEN_P.看刀 },
    { t: 54.85, p: CHEN_P.看刀 },
    { t: 55.15, ease: "inOut", p: { ...CHEN_P.看刀, expression: "忍着哭", tears: 0.8, lookX: 0.3, lookY: 0.9 } },
    { t: 55.35, p: { ...CHEN_P.看刀, expression: "忍着哭", tears: 0.8, lookX: 0.3, lookY: 0.9 } },
    { t: T.up, ease: "inOut", p: CHEN_P.仰头 },
    { t: 57.5, p: CHEN_P.仰头 },
    // 回忆里（看不见）：回到紧紧抱着他；间奏接回现在时抬起头看着天（和七岁时仰头看妈妈一样）
    { t: 59, ease: "inOut", p: CHEN_P.抱紧 },
    { t: 71.0, p: CHEN_P.抱紧 },
    { t: 71.45, ease: "inOut", p: { ...CHEN_P.接住, expression: "难过", tears: 0.8, lookX: 0.1, lookY: -1 } },
    { t: 73, p: { ...CHEN_P.接住, expression: "难过", tears: 0.8, lookX: 0.1, lookY: -1 } },
  ] as MoveKey[],
  { look: CHENGTUO, base: { wind: 0.6, chestL: "under", chestR: "under" }, idle: false, seed: 51, springs: ARMS, follow: 0 },
);
// B 站横屏（用户 2026-10-30 看着 0:47.93：「主角突然出现」）：竖屏她在画面左边外面起跑；横屏这一镜退到 0.6，起跑的地方就在画面里，
// 她一下子冒出来。横屏在前面多跑 CHEN_PRE 步（同样的步子，按起跑那一刻的速度），起跑那一刻接回原来那段（位置、速度、姿势都接得上）：
// 那时镜头还在半空的两个人身上，镜头退开、落到街上时她已经在跑。这几步另做一段、不带弹簧（原来那段起跑时手臂还没开始甩，
// 姿势就是关键帧本身），原来那段一点不动（竖屏、镜头、起跳的路线都照旧）
const CHEN_PRE = 4;
const chenPre = live(
  [
    ...Array.from({ length: CHEN_PRE }, (_, i) => {
      // 往前数第 n 步（n = CHEN_PRE … 1），和原来一样一步 0.2 秒：蹬地 → 腾空 → 换脚落地
      const n = CHEN_PRE - i;
      const sw = n % 2 === 1;
      const t0 = RUN0 - 0.2 * n;
      return [
        { t: t0, ease: SMOOTH, p: RUN(CHEN.跑_蹬地, sw) },
        { t: t0 + 0.08, ease: SMOOTH, p: RUN(CHEN.跑_腾空, sw) },
        { t: t0 + 0.13, ease: SMOOTH, p: RUN(CHEN.跑_落地, !sw) },
      ];
    }).flat(),
    { t: RUN0, ease: SMOOTH, p: RUN(CHEN.跑_蹬地, false) },
    { t: RUN0 + 0.08, ease: SMOOTH, p: RUN(CHEN.跑_腾空, false) },
    { t: RUN0 + 0.13, ease: SMOOTH, p: RUN(CHEN.跑_落地, true) },
  ] as MoveKey[],
  { look: CHENGTUO, base: { wind: 0.6, chestL: "under", chestR: "under" }, idle: false, seed: 51, follow: 0 },
);
/** 从这一刻起画她 */
const chenFrom = () => (LANDSCAPE ? RUN0 - 0.2 * CHEN_PRE : RUN0);

// ——————————————————— 物理 ———————————————————
/** 切过来时她的根（脚底）离街面多高：两层楼 */
const Y0 = -420;
/** 两个人一起往上飘（外套拉不住两个人） */
const VA = 50;
/** 拽的时候她走 1/3、他走 2/3（她比他重一倍） */
const W_PULL = 1 / 3;
/** 每一把手从头顶拉到胸前（她身上的坐标，红绳在她身上是竖直的）：头顶 O、胸前 C。
 *  她差不多正对镜头：R 的肩在画面左（约 (−50, −412)），L 的肩在右（约 (+30, −415)），头的中心约 x 0、半径 52。
 *  红绳走在 R 肩膀外侧、头的左边：R 在头顶伸直攥住（离肩 137），拉到肩膀下面一点、肘朝下收在身侧。
 *  （用户 2026-10-29，0:44.43：「胳膊被遮挡了」——原来 x −20 从脸中间穿下来；接着「胳膊弯曲非常奇怪」——让 L 去拉，L 的肩在另一边，
 *  胳膊横过整个身子和脸，头顶伸不直、拉到胸前又折成鸡翅膀） */
const C: V2 = [-85, -367];
const TRAVEL = 180;
const O: V2 = [C[0], C[1] - TRAVEL];
/** 她吊在往左上方斜着的红绳上：整个人顺着绳子斜过去（他也一样），「亮」拽进怀里以后回正 */
const TILT = (14 * Math.PI) / 180;
/** 三把拽完：他的脚刚好在她举起来的手上面一点（头顶上方），她一把抓住他的小腿，从她左边把他拽进怀里 */
const S3 = 620;
/** 切过来时从攥着的那只手到他脚踝多长 */
const R0 = S3 + C[1] + 2 * TRAVEL;
/** 整根红绳多长（他的脚踝到她远处那只手腕上的结）：多出来的在下面垂成一个弯 */
const ROPE = 750;
/** 他的脚踝比她的脚底高多少（顺着她的身子量）：切过来时 R0 − O，三把拽完 S3；「亮」拽进怀里 S_HUG */
const S0 = R0 - O[1];
const S_HUG = 180;
/** 抱着时他的胯在她身上的哪里（他在她左边、面对面，头在她下巴底下） */
const HUG_OFF: V2 = [-128, -272];
/** 推开以后吊着：他的胯在她根的哪里（红绳从她远处那只手腕垂下 420 到他举着的手上） */
const HANG_OFF: V2 = [-36, 352];
/** 他吊着时攥着的地方：胯上面多少（手举直）。176 是按他 0.79 的身高量的；缩到 0.72 以后够不着，近处那只手折下来按在脸上
 *  （用户 2026-10-29，0:50.43：「小石头拉绳子的动作有问题」）——跟着身高缩放 */
const HANDS_UP = 230 * (STONE.scale / 0.79);
/** 推开以后：他有了外套的分量，她没了外套——两个人差不多一样重，各走一半（他 0.47、她 0.53） */
const W_PUSH = 0.53;
/** 红绳绷直以后一起往上飘（慢一点） */
const VC = 25;
/** 割断那一下：绷着的红绳一松，她被弹上去的初速度 */
const V_REL = 1400;

const pullK = (t: number, i: number) => E.soft(ph(t, P[i][0], P[i][1]));
/** 他的脚踝比她的脚底高多少（②） */
function sep(t: number) {
  const s = S0 - TRAVEL * (pullK(t, 0) + pullK(t, 1) + pullK(t, 2));
  return s - (S3 - S_HUG) * E.io(ph(t, T.haul, T.hug));
}
/** ②她的根的高度 */
const momYA = (t: number) => Y0 - VA * (Math.max(t, T.start) - T.start) - W_PULL * (S0 - sep(t));
/** 推开以后两个人分开多少（0 → 1 到绷直）：推出去那一下有个初速度，之后各自被分量、浮力拉开，越分越快 */
function apart(t: number) {
  const u = ph(t, T.push, T.taut);
  return 0.45 * u + 0.55 * u * u;
}
/** 绷直那一下：红绳一抻，他往下多坠一点再弹回来 */
const tautBounce = (t: number) => (t > T.taut ? 46 * Math.exp(-(t - T.taut) / 0.13) * Math.sin((t - T.taut) * 26) : 0);
/** 他相对她的根（推开以后） */
function relAfterPush(t: number): V2 {
  const k = apart(t);
  const r = mix(HUG_OFF, HANG_OFF, k);
  return [r[0], r[1] + tautBounce(t)];
}
/** 推开以后她的根的高度（没有沉沉的分量时） */
function momYPush(t: number) {
  const y0 = momYA(T.hug) - VA * (T.push - T.hug);
  const tau = t - T.push;
  // 绷直以后一起飘得慢一点（速度连续地降下来）
  const drift = t < T.taut ? VA * tau : VA * (T.taut - T.push) + VC * (t - T.taut) + ((VA - VC) * 0.25) * (1 - Math.exp(-(t - T.taut) / 0.25));
  return y0 - drift - W_PUSH * (relAfterPush(t)[1] - HUG_OFF[1]);
}

let INIT: null | {
  /** 沉沉起跳前蹲着的根（地面）、抓住那一刻的根高度、坠下去多少、往下掉的加速度、妈妈往上飞的加速度、她刚好碰到白的时刻 */
  crouchRoot: number;
  grabRoot: number;
  dip: number;
  g: number;
  aMom: number;
  xJump: number;
} = null;
/** 靴底离根多高（站着的姿势按它把靴底放到街面上） */
function soleOf(p: PoseIn) {
  const j = jointsOf(p);
  return Math.max(j.ankleL[1], j.ankleR[1]) + 46;
}
/** 手举直时手心离根多高（按这个姿势） */
function reachOf(p: PoseIn) {
  const j = jointsOf(p);
  return -(j.shoulderL[1] + j.shoulderR[1]) / 2 + 150;
}

/** 一串人一起被往下坠、往上带了多少（加在妈妈和小石头的根上，正 = 往下） */
function chainY(t: number) {
  const I = init();
  // 抓住那一下惯性往下坠：开头最快、越坠越慢（匀减速），坠到最低速度正好为 0
  const dip = (I.dip - CLEAR) * (1 - (1 - ph(t, T.grab, T.ground)) ** 2);
  const tau = Math.max(0, t - T.ground);
  return dip - 0.5 * RISE_A * tau * tau;
}
/** 坠到最低时铁靴离街面多高：不着地 */
const CLEAR = 120;
/** 坠到最低以后三个人接着往上加速：割断时铁靴离地 250（比最低处高 130） */
const RISE_A = (2 * (250 - CLEAR)) / ((51.06 - 49.6) * (51.06 - 49.6));
/** 割断那一刻三个人往上的速度 */
const V_CUT = RISE_A * (51.06 - 49.6);

function init() {
  if (INIT) return INIT;
  // 起跳的地方：抓住那一刻他脚踝正下方（她举着手）
  const ankleGrab = stoneHang(T.grab, 0).ankle;
  const xJump = ankleGrab[0] - 12;
  const pc = chenMove(T.crouch + 0.12).pose;
  const crouchRoot = -soleOf(pc);
  const pg = chenMove(T.grab).pose;
  const grabRoot = ankleGrab[1] + reachOf(pg);
  // 坠到最低那一刻：铁靴底正好踩在街面上（chainY 里再减掉 CLEAR，不着地）
  const pd = chenMove(T.ground).pose;
  const ankleG = stoneHang(T.ground, 0).ankle;
  const dip = -soleOf(pd) - (ankleG[1] + reachOf(pd));
  INIT = { crouchRoot, grabRoot, dip, g: 0, aMom: 0, xJump };
  // 割断：往下掉的加速度按「身」落地反算；妈妈往上飞的加速度按 52.517 碰到白反算（头顶到 −8700）
  const vCut = V_CUT;
  const cRoot = chenAt(T.cut - 1e-4).root[1];
  const pl = chenMove(T.land).pose;
  const drop = -soleOf(pl) - cRoot;
  const tau = T.land - T.cut;
  INIT.g = (2 * (drop + vCut * tau)) / (tau * tau);
  const mY = momRoot(T.cut - 1e-4)[1];
  const tt = T.touch - T.cut;
  INIT.aMom = (2 * (mY - -8700 - (vCut + V_REL) * tt)) / (tt * tt);
  return INIT;
}

/** 妈妈的根（世界坐标） */
export function momRoot(t: number): V2 {
  const sway = 8 * Math.sin(t * 1.3);
  if (t < T.push) return [MOM_X + sway, t < T.hug ? momYA(t) : momYA(T.hug) - VA * (t - T.hug)];
  if (t < T.cut) return [MOM_X + sway, momYPush(t) + (t > T.grab ? chainY(t) : 0)];
  const I = init();
  const y0 = momYPush(T.cut) + chainY(T.cut);
  const v = V_CUT + V_REL;
  const tau = t - T.cut;
  return [MOM_X + sway - 30 * tau, y0 - v * tau - 0.5 * I.aMom * tau * tau];
}

// ——————————————————— 每一刻 ———————————————————
type MomState = { spec: CastSpec; pose: PoseIn; root: V2; palmL: V2; palmR: V2; wristR: V2; shL: V2; shR: V2; ropeHand: V2 | null; otherHand: V2 | null };

/** 她身上的一点 → 世界坐标 / 反过来 IK 用的局部坐标（朝左不镜像） */
const momLoc = (root: V2, p: V2): V2 => [(p[0] - root[0]) / MOM.scale, (p[1] - root[1]) / MOM.scale];
const setIk = (pose: PoseIn, arm: "armL" | "armR", to: V2, w: number, bend?: number) => {
  if (w <= 0.001) return;
  pose[arm] = { ...(pose[arm] as object), to, ik: Math.min(1, w), ...(bend !== undefined ? { bend } : {}) } as PoseIn["armL"];
};

/** ②她斜着多少（弧度，画面里逆时针为负：头往左上方的红绳那边） */
const tiltAt = (t: number) => TILT * (1 - E.io(ph(t, T.haul, T.hug)));
/** 她身上的一点（她没斜时相对根的坐标）→ 世界坐标：绕胯转 a（顺时针为正） */
function bodyPt(root: V2, p: V2, a: number): V2 {
  const hip: V2 = [0, -275];
  const dx = p[0] - hip[0];
  const dy = p[1] - hip[1];
  const c = Math.cos(a);
  const sn = Math.sin(a);
  return [root[0] + hip[0] + dx * c - dy * sn, root[1] + hip[1] + dx * sn + dy * c];
}

/**
 * ②两只手：R（红绳那一侧）攥着红绳一把把从头顶拉到胸前；拉完 L 从胸前斜过来在下面攥住红绳（别让他飘回去），R 松开滑回头顶再拉下一把，
 * 下一把一开始 L 松开、垂到右边胯前（攥着多出来的那一截）
 */
function stageA(t: number) {
  const root: V2 = momRoot(t);
  const a = -tiltAt(t);
  const s = sep(t);
  let i = 0;
  if (t >= P[1][0]) i = 1;
  if (t >= P[2][0]) i = 2;
  const k = pullK(t, i);
  let holdW = bodyPt(root, [C[0], O[1] + TRAVEL * k], a);
  const ankle = bodyPt(root, [C[0], -s], a);
  // R 拉完以后滑回头顶（下一把从那儿开始）
  const r = MT.reach[i];
  if (r) holdW = mix(holdW, bodyPt(root, O, a), E.io(ph(t, r[0], r[1])));
  // L：平时垂在右边胯前；R 拉到胸前起在它下面攥住，下一把开始时松开
  const rest = bodyPt(root, [14, C[1] + 70], a);
  const clamp = bodyPt(root, [C[0] + 6, C[1] + 34], a);
  const on = E.io(ph(t, P[i][1] - 0.06, P[i][1] + 0.06)) * (r ? 1 : 0) + (i > 0 ? 1 - E.io(ph(t, P[i][0], P[i][0] + 0.12)) : 0);
  const grip = Math.min(1, on);
  const other = mix(rest, clamp, grip);
  return { root, ankle, holdW, other, grip, hold: "R" as "L" | "R", tilt: a };
}

/** 他吊在红绳上（推开以后）：胯在她根下面，两只手攥着头顶的红绳 */
function stoneHang(t: number, withChain = 1): { pose: PoseIn; root: V2; ankle: V2; hands: V2 } {
  const sp: PoseIn = { ...stoneMove(t).pose };
  const sk = STONE.scale;
  const sj = castJoints(STONE_COAT, sp);
  const mr = momRootPush(t, withChain);
  const rel = relAfterPush(t);
  const hip: V2 = [mr[0] + rel[0] + 6 * Math.sin(t * 2.3), mr[1] + rel[1]];
  const root: V2 = [hip[0] - sj.hip[0], hip[1] - sj.hip[1]];
  const hands: V2 = [hip[0] + 4, hip[1] - HANDS_UP];
  const sloc = (p: V2): V2 => [-(p[0] - root[0]) / sk, (p[1] - root[1]) / sk];
  const g = E.io(ph(t, T.push + 0.12, T.taut - 0.06));
  // 目标放在头顶上面够不着的地方：两只胳膊伸直举过头（他头大，原来的目标落在头里，近处那只胳膊折下来按在脸上）；
  // 红绳接到两只手实际攥着的地方
  setIk(sp, "armL", sloc([hands[0] + 6, hands[1] + 16]), g);
  setIk(sp, "armR", sloc([hands[0] - 4, hands[1] - 10]), g);
  const j = castJoints(STONE_COAT, sp);
  const grip: V2 = [root[0] + (j.palmL[0] + j.palmR[0]) / 2, root[1] + Math.min(j.palmL[1], j.palmR[1])];
  return { pose: sp, root, ankle: [root[0] + j.ankleL[0], root[1] + j.ankleL[1]], hands: mix(hands, grip, g) };
}
function momRootPush(t: number, withChain = 1): V2 {
  return [MOM_X + 8 * Math.sin(t * 1.3), momYPush(t) + (withChain && t > T.grab ? chainY(t) : 0)];
}

/** 沉沉这一刻：根、姿势（手 IK 到该攥的地方） */
function chenAt(t: number): { pose: PoseIn; root: V2 } {
  const I = init();
  // 横屏起跑以前多跑的那几步：按起跑那一刻的速度往回推
  const pre = LANDSCAPE && t < T.run0;
  const cp: PoseIn = { ...(pre ? chenPre(t) : chenMove(t)).pose };
  const cLoc = (root: V2, p: V2): V2 => [-(p[0] - root[0]), p[1] - root[1]];
  let root: V2;
  if (pre) root = [I.xJump - 760 - ((760 * 1.5) / (T.crouch - T.run0)) * (T.run0 - t), 0];
  else if (t < T.crouch) {
    // 跑：从画面左边外面冲进来，慢下来停在起跳的地方
    const u = ph(t, T.run0, T.crouch);
    const x0 = I.xJump - 760;
    root = [x0 + (I.xJump - x0) * (1 - Math.pow(1 - u, 1.5)), 0];
    root[1] = -soleOf(cp) * E.io(ph(t, T.crouch - 0.12, T.crouch + 0.02));
  } else if (t < T.jump) {
    root = [I.xJump, -soleOf(cp)];
  } else if (t < T.grab) {
    // 起跳：往上越来越慢（抛物线），最高点正好抓住
    const u = ph(t, T.jump, T.grab);
    const y = I.crouchRoot + (I.grabRoot - I.crouchRoot) * (1 - (1 - u) * (1 - u));
    root = [I.xJump + 12 * u, y];
  } else if (t < T.cut) {
    const st = stoneHang(t);
    const stand = -soleOf(cp);
    root = [I.xJump + 12, Math.min(stand, st.ankle[1] + reachOf(cp))];
  } else {
    // 割断：从割断那一刻的地方一起掉下来，「身」铁靴落回街面
    const c0 = chenAt(T.cut - 1e-4).root;
    const v = V_CUT;
    const tau = Math.min(t, T.land) - T.cut;
    const y = c0[1] - v * tau + 0.5 * I.g * tau * tau;
    root = [c0[0], t < T.land ? y : -soleOf(cp)];
  }
  // 手：起跳起两只手 IK 到他的脚踝；割断以后先还攥着，落地时搂住他（下面 sceneAt 里接）
  if (t >= T.jump && t < T.cut) {
    const a = stoneHang(t).ankle;
    const w = E.io(ph(t, T.grab - 0.12, T.grab));
    setIk(cp, "armL", cLoc(root, [a[0] - 4, a[1] + 8]), w);
    setIk(cp, "armR", cLoc(root, [a[0] + 6, a[1] - 6]), w);
  }
  return { pose: cp, root };
}

/** 他（这个姿势、这个根）近处那只脚踝在哪 */
function sAnkleOf(root: V2, pose: PoseIn): V2 {
  const j = castJoints(STONE, pose);
  return [root[0] + j.ankleL[0], root[1] + j.ankleL[1]];
}

/** 外套交过去的地方（两个人抱在一起那一刻）：给镜头用 */
export function coatPoint(t: number): V2 {
  const r = momRoot(t);
  return [r[0] + HUG_OFF[0] + 30, r[1] + HUG_OFF[1] - 60];
}

export type Scene2 = {
  mom: MomState;
  stone: { spec: CastSpec; pose: PoseIn; root: V2; ankle: V2; hands: V2 | null };
  chen: { pose: PoseIn; root: V2 } | null;
  /** 红绳（世界坐标的点，按顺序连起来） */
  rope: V2[][];
  coat: [V2, V2] | null;
  knife: { x: number; y: number; rot: number; glint: number; stuck: boolean } | null;
};

/**
 * ②③她（拽红绳、拽进怀里抱着、脱外套裹在他身上，到推开以前）：L 横过胸前时（攥红绳、搂他的腰、环到他背上）上臂压在外套上面。
 * 正面的画法上臂默认藏在身子后面，横过胸前时只露出前臂，像从外套里伸出来的（用户 2026-10-29，0:45.27「胳膊没正常显示」、
 * 0:45.73「还是被遮挡了」）；不横过胸前时照原来的画法
 */
const CROSS_LOOKS = new Map<CastSpec, Look>();
function drawMomCross(g: CanvasRenderingContext2D, spec: CastSpec, pose: PoseIn, root: V2, z: number, opts: DrawOptions = {}) {
  let look = CROSS_LOOKS.get(spec);
  if (!look) CROSS_LOOKS.set(spec, (look = { ...lookOf(spec), armsOver: (rig: Rig) => rig.arms.L.end[0] < rig.arms.L.root[0] - 30 }));
  g.save();
  g.translate(root[0], root[1]);
  g.scale(spec.scale, spec.scale);
  drawFigure(g, pose, look, { line: 1 / Math.sqrt(Math.max(0.3, z)), ...opts });
  g.restore();
}

/** 这一刻所有的人和东西（世界坐标） */
export function sceneAt(t: number): Scene2 {
  const mSpec = t < T.coatOff ? MOM : MOM_BARE;
  const sSpec = t < T.wrap ? STONE : STONE_COAT;
  const sk = STONE.scale;
  const rope: V2[][] = [];
  let coat: [V2, V2] | null = null;
  let mp: PoseIn;
  let root: V2;
  let stone: Scene2["stone"];
  let chen: Scene2["chen"] = null;
  let ropeHand: V2 | null = null;
  let otherHand: V2 | null = null;

  if (t < T.push) {
    root = momRoot(t);
    mp = { ...momMove(t).pose };
    const a = t < T.hug ? stageA(t) : null;
    const tilt = tiltAt(t);
    mp.rot = ((mp.rot as number) ?? 0) - tilt;
    const sp: PoseIn = { ...stoneMove(t).pose };
    // 他也顺着红绳斜着（朝右的人镜像着画：画面里逆时针为正）
    sp.rot = ((sp.rot as number) ?? 0) + tilt;
    const sj = castJoints(STONE, sp);
    // 他：拽进怀里以前按脚踝放（红绳拴在近处那只脚踝上）；「亮」她抓住他的小腿，从她左边绕过来拽进怀里（胯在 HUG_OFF）
    const hugK = E.io(ph(t, T.haul, T.hug));
    const hugHip: V2 = [root[0] + HUG_OFF[0], root[1] + HUG_OFF[1] + 4 * Math.sin(t * 2.1)];
    let hip = hugHip;
    if (a) {
      const fromAnkle = (aa: { ankle: V2 }, j: typeof sj): V2 => [aa.ankle[0] - j.ankleL[0] + j.hip[0], aa.ankle[1] - j.ankleL[1] + j.hip[1]];
      if (t < T.haul) hip = fromAnkle(a, sj);
      else {
        const a0 = stageA(T.haul);
        const p0 = { ...stoneMove(T.haul).pose };
        p0.rot = ((p0.rot as number) ?? 0) + TILT;
        const r0 = momRoot(T.haul);
        const h0 = fromAnkle(a0, castJoints(STONE, p0));
        const rel0: V2 = [h0[0] - r0[0], h0[1] - r0[1]];
        const ctrl: V2 = [Math.min(rel0[0], HUG_OFF[0]) - 130, (rel0[1] + HUG_OFF[1]) / 2];
        const u = hugK;
        const rel: V2 = [
          (1 - u) * (1 - u) * rel0[0] + 2 * u * (1 - u) * ctrl[0] + u * u * HUG_OFF[0],
          (1 - u) * (1 - u) * rel0[1] + 2 * u * (1 - u) * ctrl[1] + u * u * HUG_OFF[1],
        ];
        hip = [root[0] + rel[0], root[1] + rel[1] + 4 * Math.sin(t * 2.1) * u];
      }
    }
    const sRoot: V2 = [hip[0] - sj.hip[0], hip[1] - sj.hip[1]];
    const sloc = (p: V2): V2 => [-(p[0] - sRoot[0]) / sk, (p[1] - sRoot[1]) / sk];
    const mj0 = castJoints(mSpec, mp);
    const neck: V2 = [root[0] + mj0.neck[0], root[1] + mj0.neck[1]];
    // 他搂着她的脖子（抱住起）
    const cling = E.io(ph(t, T.hug - 0.2, T.hug + 0.05));
    setIk(sp, "armL", sloc([neck[0] - 30, neck[1] + 26]), cling);
    setIk(sp, "armR", sloc([neck[0] + 40, neck[1] + 20]), cling);
    const sjNow = castJoints(sSpec, sp);
    const sAnkle: V2 = [sRoot[0] + sjNow.ankleL[0], sRoot[1] + sjNow.ankleL[1]];
    const sShoulder: V2 = [sRoot[0] + (sjNow.shoulderL[0] + sjNow.shoulderR[0]) / 2, sRoot[1] + (sjNow.shoulderL[1] + sjNow.shoulderR[1]) / 2];
    // 她的两只手（目标连续地换，权重不跳）：攥红绳 →「亮」环到他背上（他朝右，背在左边）→ 脱外套（交给姿势）→ 裹到他肩膀上 → 又环回他背上
    const backR: V2 = [sShoulder[0] - 56, sShoulder[1] + 50];
    const backL: V2 = [sShoulder[0] - 40, sShoulder[1] + 110];
    // 远处那只（R）攥着外套领子：用户 2026-10-30 在「调整画面」0:46.63 摆的（手腕往右下挪一点，肘往下弯，原来拱成倒 V）
    const wrapR: V2 = [sShoulder[0] - 50.2, sShoulder[1] + 20.7];
    const wrapL: V2 = [sShoulder[0] + 66, sShoulder[1] + 10];
    let tR: V2 = backR;
    let tL: V2 = backL;
    let w = 1;
    if (a) {
      // 「亮」：远处那只手（R）一把抓住他的小腿往下拽，近处那只手接住他的腰，再环到他背上
      const ropeR = a.hold === "R" ? a.holdW : a.other;
      const ropeL = a.hold === "L" ? a.holdW : a.other;
      const shin: V2 = [sAnkleOf(sRoot, sp)[0] + 6, sAnkleOf(sRoot, sp)[1] - 34];
      const waist: V2 = [hip[0] + 10, hip[1] - 20];
      tR = mix(mix(ropeR, shin, E.io(ph(t, T.haul - 0.06, T.haul + 0.1))), backR, E.io(ph(t, T.haul + 0.2, T.hug)));
      tL = mix(mix(ropeL, waist, E.io(ph(t, T.haul + 0.06, T.haul + 0.24))), backL, E.io(ph(t, T.haul + 0.26, T.hug + 0.04)));
    } else {
      w = 1 - E.io(ph(t, T.coat0, T.coat0 + 0.16)) + E.io(ph(t, T.coatOff, T.coatOff + 0.16));
      const toHold = E.io(ph(t, T.wrap + 0.04, T.wrap + 0.26));
      if (t > T.coat0 + 0.08) {
        tR = mix(wrapR, backR, toHold);
        tL = mix(wrapL, backL, toHold);
      }
    }
    // 拽绳子时 R 的肘朝外（头顶时在头外侧、拉下来时朝下收在身侧；默认的弯法肘朝头那边拱）
    setIk(mp, "armR", momLoc(root, tR), w, a ? -1 : t > T.coat0 + 0.16 ? -1 : undefined);
    setIk(mp, "armL", momLoc(root, tL), w);
    // R 是远处那只（默认画在身子后面）：拽绳子时举在头的外侧，整只胳膊画在前面
    if (a && t < T.haul + 0.1) mp.armR = { ...(mp.armR as object), layer: "front" } as PoseIn["armR"];
    stone = { spec: sSpec, pose: sp, root: sRoot, ankle: sAnkle, hands: null };
    const mj = castJoints(mSpec, mp);
    const palmL: V2 = add(root, mj.palmL as V2);
    const palmR: V2 = add(root, mj.palmR as V2);
    const wristR: V2 = add(root, mj.wristR as V2);
    // 红绳：拽进怀里以前从他的脚踝拉到她攥着的手、再到另一只手；多出来的一截在下面那只手和她远处那只手腕之间垂成一个弯
    const reeled = Math.min(1, (S0 - sep(t)) / (S0 - S3));
    if (a && t < T.haul + 0.12) {
      const holdP = a.hold === "L" ? palmL : palmR;
      const otherP = a.hold === "L" ? palmR : palmL;
      const yank = P.reduce((acc, p) => acc + (t > p[1] ? 30 * Math.exp(-(t - p[1]) / 0.08) * Math.sin((t - p[1]) * 70) : 0), 0);
      const letGo = E.io(ph(t, T.haul, T.haul + 0.12));
      rope.push(sagLine(sAnkle, holdP, 6 + 120 * letGo, yank));
      // L 在下面攥着时红绳从 R 接到 L，多出来的从 L 垂下去
      const otherOn = a.grip > 0.5;
      if (otherOn) rope.push([holdP, otherP]);
      const lower = otherOn ? otherP : holdP;
      rope.push(loop(lower, wristR, ROPE - R0 + (R0 - (S3 + C[1])) * reeled, t));
    } else {
      // 抱着：他脚踝上的红绳垂成一个大弯，拴回她远处那只手腕
      rope.push(loop(sAnkle, wristR, ROPE * 0.8, t));
    }
    // 外套：领子两头在她两只手里（刚脱下来时在她肩上）
    if (t >= T.coatOff && t < T.wrap) {
      const k = E.io(ph(t, T.coatOff, T.coatOff + 0.12));
      const shL: V2 = add(root, mj.shoulderL as V2);
      const shR: V2 = add(root, mj.shoulderR as V2);
      coat = [mix([shR[0] - 10, shR[1] - 6], palmR, k), mix([shL[0] + 10, shL[1] - 6], palmL, k)];
    }
    return {
      mom: { spec: mSpec, pose: mp, root, palmL, palmR, wristR, shL: add(root, mj.shoulderL as V2), shR: add(root, mj.shoulderR as V2), ropeHand, otherHand },
      stone,
      chen,
      rope,
      coat,
      knife: null,
    };
  }

  // ——— 推开以后（③④⑤⑥⑦） ———
  root = momRoot(t);
  mp = { ...momMove(t).pose };
  const mj0 = castJoints(MOM_BARE, mp);
  // 远处那只手腕拴着红绳：被拽得垂直往下（推出去那一下先往下推出去）
  const tension = E.io(ph(t, T.taut - 0.2, T.taut));
  const free = E.io(ph(t, T.cut + 0.04, T.cut + 0.3));
  const wristHang: V2 = [root[0] - 44, root[1] - 262];
  setIk(mp, "armR", momLoc(root, wristHang), tension * (1 - free));
  // 近处那只手：掏刀（口袋在胯前）、伸到远处的手腕上、割
  const pocket: V2 = [root[0] + 30, root[1] - 250];
  const wrist: V2 = [wristHang[0] + 16, wristHang[1] - 24];
  const kp = mix(pocket, wrist, E.io(ph(t, T.knife0 + 0.12, T.knife1)));
  const sl = E.out(ph(t, T.cut - 0.04, T.cut + 0.04));
  const slice: V2 = [kp[0] - 30 * sl, kp[1] + 10 * sl];
  const kIk = E.io(ph(t, T.knife0 - 0.04, T.knife0 + 0.12)) * (1 - free);
  setIk(mp, "armL", momLoc(root, slice), kIk);
  const mj = castJoints(MOM_BARE, mp);
  const palmL: V2 = add(root, mj.palmL as V2);
  const palmR: V2 = add(root, mj.palmR as V2);
  const wristR: V2 = add(root, mj.wristR as V2);
  const mom: MomState = { spec: MOM_BARE, pose: mp, root, palmL, palmR, wristR, shL: add(root, mj.shoulderL as V2), shR: add(root, mj.shoulderR as V2), ropeHand: null, otherHand: null };

  if (t < T.cut) {
    const st = stoneHang(t);
    stone = { spec: STONE_COAT, pose: st.pose, root: st.root, ankle: st.ankle, hands: st.hands };
    if (t >= chenFrom()) chen = chenAt(t);
    // 红绳：她的手腕 → 他攥着的地方（推出去以后先松着，绷直那一下抖一下）→ 顺着他的身子松松地垂到脚踝
    const d = Math.hypot(st.hands[0] - wristR[0], st.hands[1] - wristR[1]);
    const L = 420;
    const grabbed = t > T.push + 0.16;
    if (grabbed) {
      const slackK = Math.max(0, L - d);
      const buzz = t > T.taut ? 22 * Math.exp(-(t - T.taut) / 0.09) * Math.sin((t - T.taut) * 60) : 0;
      rope.push(sagLine(wristR, st.hands, Math.sqrt(slackK) * 6, buzz));
      rope.push(sideLoop(st.hands, st.ankle, 120, t));
    } else {
      rope.push(loop(wristR, st.ankle, 750, t));
    }
    return { mom, stone, chen, rope, coat: null, knife: t >= T.knife0 + 0.06 ? { x: palmL[0] - 6, y: palmL[1] + 4, rot: -0.3, glint: Math.exp(-Math.abs(t - T.cut) / 0.04), stuck: false } : null };
  }

  // 割断以后：两个人掉下来，他落进她怀里；之后跪在街上抱着
  const ch = chenAt(t);
  const cut = stoneHang(T.cut - 1e-4);
  const cutChen = chenAt(T.cut - 1e-4).root;
  const sp: PoseIn = { ...stoneMove(t).pose };
  const sj = castJoints(STONE_COAT, sp);
  const chest: V2 = [ch.root[0] + 64, ch.root[1] - 320];
  const fall = ch.root[1] - cutChen[1];
  const cutHip: V2 = [cut.root[0] + castJoints(STONE_COAT, cut.pose).hip[0], cut.root[1] + castJoints(STONE_COAT, cut.pose).hip[1]];
  const fallHip: V2 = [cutHip[0], cutHip[1] + fall];
  const shrink = 0;
  // 小石头照参考图改高、头改大以后（用户 2026-10-28），上身连头比原来（scale 0.6）高出约 80，头顶到她脸上：在她怀里坐低一点
  const sit = LAP_DROP;
  const hip = mix(fallHip, [chest[0] + 30 - 28 * shrink, chest[1] + 70 + sit - 16 * shrink], E.io(ph(t, T.cut + 0.08, T.land + 0.1)));
  const sRoot: V2 = [hip[0] - sj.hip[0], hip[1] - sj.hip[1]];
  const sjNow = castJoints(STONE_COAT, sp);
  const ankle: V2 = [sRoot[0] + sjNow.ankleL[0], sRoot[1] + sjNow.ankleL[1]];
  const cp = ch.pose;
  const cLoc = (p: V2): V2 => [-(p[0] - ch.root[0]), p[1] - ch.root[1]];
  const sh: V2 = [sRoot[0] + (sjNow.shoulderL[0] + sjNow.shoulderR[0]) / 2, sRoot[1] + (sjNow.shoulderL[1] + sjNow.shoulderR[1]) / 2 + 70];
  const hug = E.io(ph(t, T.cut + 0.02, T.land));
  // 两只手一直搂着他（小刀扎在跟前，只是看着它，不去捡）
  const kn = knifeAt2(t, [ch.root[0], 0]);
  // 近处那只（L）搂在他胸前、画在他前面（用户 2026-10-30 在「调整画面」0:54.13 摆的：「主角的左边的手不被小石头遮挡」；原来伸到他背后、被他挡住）
  const hugL: V2 = mix([ankle[0] - 4, ankle[1] + 8], [sh[0] - 27.3, sh[1] - 41.5], hug);
  setIk(cp, "armL", cLoc(hugL), 1);
  if (hug > 0) cp.armL = { ...(cp.armL as object), chest: "over" } as PoseIn["armL"];
  setIk(cp, "armR", cLoc(mix([ankle[0] + 6, ankle[1] - 6], [sh[0] - 20, sh[1] + 34], hug)), 1);
  chen = { pose: cp, root: ch.root };
  stone = { spec: STONE_COAT, pose: sp, root: sRoot, ankle, hands: null };
  // 红绳：下面那截还拴在他脚踝上，断头跟着掉下来、落在街上
  const u = E.out(ph(t, T.cut, T.land + 0.35));
  const endFall: V2 = [wristR[0], cut.hands[1] - 380 + fall];
  const endRest: V2 = [ankle[0] + 250, -4];
  const end = mix(endFall, endRest, u);
  if (t < T.cut + 0.6) {
    // 她手腕上剩的一小截跟着她飞走
    rope.push([wristR, [wristR[0] + 8, wristR[1] + 50]]);
  }
  rope.push(lying(ankle, end, t));
  // 小刀：她攥着往上飞走（碰到白以前）；之后从天上掉下来、靠在沉沉的铁靴上
  const knife = t < T.touch ? { x: palmL[0] - 6, y: palmL[1] + 4, rot: -0.3, glint: Math.exp(-Math.abs(t - T.cut) / 0.04), stuck: false } : kn.knife;
  return { mom, stone, chen, rope, coat: null, knife };
}

/** 他在她怀里比原来（scale 0.6 时）坐低多少：上身（胯到脖子 162.7）多出来的那截 */
const LAP_DROP = 162.7 * (STONE.scale - 0.6);

// ——— 小刀 ———
/** 小刀砸在她前面那只铁靴跟前的街面上（落地的地方，相对她跪下来的根），弹一下靠在靴子上（和⑧十二年前那块木牌一样） */
const KNIFE_HIT = 215;
/** 靠在靴子上时：刀尖在街面上，刀柄斜靠着靴筒（刀的原点 = 刀柄和刀刃接口；刀刃朝右下） */
const KNIFE_REST = { x: 179, y: -63, rot: 1.165 };
/** 小刀这一刻（世界坐标）和她拿刀那只手该在哪 */
function knifeAt2(t: number, chenRoot: V2) {
  const bx = chenRoot[0];
  const hand: V2 = [bx + 160, -112];
  if (t < T.touch) return { knife: null as Scene2["knife"], hand };
  if (t < T.knifeLand) {
    // 她碰到白以后从天上掉下来（快到地面才进画面）：越掉越快，翻着，最后刀尖朝下
    const tt = T.knifeLand - T.touch;
    const g = (2 * 9000) / (tt * tt);
    const r = T.knifeLand - t;
    const rot = Math.PI / 2 + 0.3 + 9 * r;
    const y = -(g * tt * r - 0.5 * g * r * r) - 66 * Math.sin(rot);
    return { knife: { x: bx + KNIFE_HIT - 66 * Math.cos(rot) - 40 * r, y, rot, glint: 0.6 + 0.4 * Math.sin(t * 40), stuck: false }, hand };
  }
  const tl = t - T.knifeLand;
  // 「叮」刀尖砸在街面上，弹起来一点、翻过去，斜靠在靴子上；颤两下
  const u = E.out(Math.min(1, tl / 0.3));
  const r0 = Math.PI / 2 + 0.3;
  const p0: V2 = [bx + KNIFE_HIT - 66 * Math.cos(r0), -66 * Math.sin(r0)];
  const p1: V2 = [bx + KNIFE_REST.x, KNIFE_REST.y];
  const hop = 46 * Math.sin(Math.PI * Math.min(1, tl / 0.3));
  const wob = tl > 0.3 ? 0.06 * Math.exp(-(tl - 0.3) / 0.15) * Math.sin((tl - 0.3) * 40) : 0;
  const rest = { x: p0[0] + (p1[0] - p0[0]) * u, y: p0[1] + (p1[1] - p0[1]) * u - hop, rot: r0 + (KNIFE_REST.rot - r0) * u + wob, glint: Math.exp(-tl / 0.12), stuck: false };
  return { knife: rest, hand };
}

// ——— 红绳的形状 ———
/** 两点之间一根几乎拉直的绳：sag 往下垂多少，buzz 横着抖 */
function sagLine(a: V2, b: V2, sag: number, buzz = 0): V2[] {
  const out: V2[] = [];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    const w = 4 * u * (1 - u);
    out.push([a[0] + dx * u + nx * buzz * w + 0, a[1] + dy * u + sag * w]);
  }
  return out;
}
/** 两点之间垂下去的一个弯：绳长 len（两点距离以外的都垂成弯） */
function loop(a: V2, b: V2, len: number, t: number): V2[] {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const depth = Math.max(10, Math.sqrt(Math.max(0, len * len - d * d)) * 0.5);
  const out: V2[] = [];
  const sw = 18 * Math.sin(t * 1.7);
  for (let i = 0; i <= 20; i++) {
    const u = i / 20;
    const w = Math.sin(Math.PI * u);
    out.push([a[0] + (b[0] - a[0]) * u + sw * w, a[1] + (b[1] - a[1]) * u + depth * w]);
  }
  return out;
}
/** 他攥着的地方到脚踝：顺着身子松松地垂在旁边 */
function sideLoop(a: V2, b: V2, bulge: number, t: number): V2[] {
  const out: V2[] = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    const w = Math.sin(Math.PI * u);
    out.push([a[0] + (b[0] - a[0]) * u - bulge * w + 10 * Math.sin(t * 2 + u * 3) * w, a[1] + (b[1] - a[1]) * u + 30 * w]);
  }
  return out;
}
/** 割断以后下面那截：从脚踝甩到断头，落到街上贴着地 */
function lying(a: V2, b: V2, t: number): V2[] {
  const out: V2[] = [];
  for (let i = 0; i <= 18; i++) {
    const u = i / 18;
    const w = Math.sin(Math.PI * u);
    const y = a[1] + (b[1] - a[1]) * u + 60 * w;
    out.push([a[0] + (b[0] - a[0]) * u + 14 * Math.sin(t * 1.6 + u * 4) * w * (b[1] < -10 ? 1 : 0.2), Math.min(-3, y)]);
  }
  return out;
}

// ——— 画 ———
function strokeRope(g: CanvasRenderingContext2D, pts: V2[], z: number) {
  if (pts.length < 2) return;
  const lw = Math.max(0.8, 1 / Math.sqrt(Math.max(0.3, z)));
  const p = new Path2D();
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = INK;
  g.lineWidth = 6.5 * lw;
  g.stroke(p);
  g.strokeStyle = "#d8352b";
  g.lineWidth = 3.6 * lw;
  g.stroke(p);
  g.restore();
}

/**
 * 脱下来、裹过去的那件外套（橘色、下摆一圈铅）：领子两头在她两只手里，往下垂着、下摆张开一点。
 * 她身上那件短款的长短（领口到下摆约 165；用户 2026-10-28：「外套换成她现在这件」，原来按长外套 230）
 */
function drawCoat(g: CanvasRenderingContext2D, a: V2, b: V2, t: number) {
  const len = 165;
  const sw = 8 * Math.sin(t * 5);
  const mid: V2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const lo = Math.max(a[1], b[1]) + len;
  const p = new Path2D();
  p.moveTo(a[0], a[1]);
  p.quadraticCurveTo(mid[0], mid[1] + 26, b[0], b[1]);
  p.quadraticCurveTo(b[0] + 12, b[1] + len * 0.5, b[0] + 20 + sw, lo - 12);
  p.quadraticCurveTo(b[0] + 20 + sw, lo + 5, b[0] + 6 + sw, lo + 4);
  p.lineTo(a[0] - 6 + sw, lo + 4);
  p.quadraticCurveTo(a[0] - 20 + sw, lo + 5, a[0] - 20 + sw, lo - 12);
  p.quadraticCurveTo(a[0] - 12, a[1] + len * 0.5, a[0], a[1]);
  p.closePath();
  part(g, p, "#f29a4a", "#de8538", 3, [6, 5]);
  g.save();
  g.clip(p);
  leadBand(g, Math.min(a[0], b[0]) - 80, lo - 8, Math.abs(b[0] - a[0]) + 160, 12, 11);
  standCollar(g, a, [mid[0], mid[1] + 26], b, 9);
  g.strokeStyle = "rgba(160,80,30,0.45)";
  g.lineWidth = 3;
  for (const k of [0.36, 0.64]) {
    g.beginPath();
    g.moveTo(a[0] + (b[0] - a[0]) * k, mid[1] + 30);
    g.quadraticCurveTo(a[0] + (b[0] - a[0]) * k + sw * 0.6, mid[1] + len * 0.6, a[0] + (b[0] - a[0]) * k + sw, lo - 26);
    g.stroke();
  }
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.stroke(p);
}

/** 小刀：在手里、往下掉（拖一道亮）、扎在街面上（插进地里的那截不画，扎下去那一下一闪、崩起一点灰） */
function drawKnifeState(g: CanvasRenderingContext2D, k: NonNullable<Scene2["knife"]>, t: number, palm: V2 | null) {
  let { x, y } = k;
  if (Number.isNaN(x) && palm) [x, y] = [palm[0] - 4, palm[1] + 2];
  if (Number.isNaN(x)) return;
  // 画大一点（这一段它是主角之一）：以它的中心放大
  const drawKnife = (gg: CanvasRenderingContext2D, kx: number, ky: number, rot: number) => {
    gg.save();
    gg.translate(kx, ky);
    gg.scale(1.5, 1.5);
    drawKnife0(gg, 0, 0, rot);
    gg.restore();
  };
  if (k.stuck) {
    g.save();
    g.beginPath();
    g.rect(x - 200, -4000, 400, 4000 - 2);
    g.clip();
    // 刀刃的中心往下偏：刀尖插进街面
    drawKnife(g, x + Math.cos(k.rot) * -20, y + Math.sin(k.rot) * -20 - 6, k.rot);
    g.restore();
    const tl = t - MT.knifeLand;
    if (tl < 0.5) {
      g.save();
      g.fillStyle = `rgba(150,120,110,${0.4 * (1 - tl / 0.5)})`;
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI * (0.15 + 0.7 * (i / 5));
        const r = 20 + 70 * E.out(tl / 0.5);
        g.beginPath();
        g.arc(x + Math.cos(a) * r, -4 + Math.sin(a) * r * 0.5, 5 + 3 * (i % 2), 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    }
  } else {
    // 往下掉的时候拖一道亮（快门里走过的路）
    if (t > MT.touch && t < MT.knifeLand) {
      g.save();
      g.globalCompositeOperation = "lighter";
      const gr = g.createLinearGradient(x, y - 520, x, y);
      gr.addColorStop(0, "rgba(255,250,235,0)");
      gr.addColorStop(1, "rgba(255,250,235,0.55)");
      g.strokeStyle = gr;
      g.lineWidth = 7;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(x - 20, y - 520);
      g.lineTo(x, y);
      g.stroke();
      g.restore();
    }
    drawKnife(g, x, y, k.rot);
  }
  if (k.glint > 0.05) {
    g.save();
    g.globalCompositeOperation = "lighter";
    g.fillStyle = `rgba(255,250,230,${0.85 * k.glint})`;
    g.beginPath();
    g.ellipse(x + 14, y - 4, 40 * k.glint, 6 * k.glint, -0.4, 0, Math.PI * 2);
    g.ellipse(x + 14, y - 4, 6 * k.glint, 30 * k.glint, -0.4, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}

/** 画这一刻的人和东西（人这一层，世界坐标） */
export function drawMothers(g: CanvasRenderingContext2D, t: number, z: number) {
  const s = sceneAt(t);
  const wm = g.getTransform();
  const m = s.mom;
  // 地上的影子：沉沉落回街上以后
  if (s.chen && s.chen.root[1] > -260) {
    const lift = -s.chen.root[1];
    g.save();
    g.fillStyle = `rgba(96,62,70,${0.22 * Math.max(0, 1 - lift / 260)})`;
    g.beginPath();
    g.ellipse(s.chen.root[0] + 30, 6, 170, 22, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  const hugging = t < MT.push && t > MT.haul;
  if (hugging) {
    // 抱在一起：他画在她身子和两只手臂之间；红绳的大弯、外套先画
    for (const r of s.rope) strokeRope(g, r, z);
    drawMomCross(g, m.spec, m.pose, m.root, z, {
      beforeFrontArms: (cc) => {
        cc.save();
        cc.setTransform(wm);
        if (s.coat) drawCoat(cc, s.coat[0], s.coat[1], t);
        drawPerson(cc, s.stone.spec, s.stone.pose, s.stone.root[0], s.stone.root[1], z);
        cc.restore();
      },
    });
  } else {
    if (t < MT.haul) drawMomCross(g, m.spec, m.pose, m.root, z);
    else if (m.root[1] > -4000) drawPerson(g, m.spec, m.pose, m.root[0], m.root[1], z);
    for (const r of s.rope) strokeRope(g, r, z);
    if (!s.chen || t < MT.cut) {
      drawPerson(g, s.stone.spec, s.stone.pose, s.stone.root[0], s.stone.root[1], z);
      if (s.chen) {
        g.save();
        g.translate(s.chen.root[0], s.chen.root[1]);
        drawChengtuo(g, s.chen.pose, { line: 1 / Math.sqrt(Math.max(0.3, z)) });
        g.restore();
      }
    } else {
      // 落地以后：他画在她的身子和近处那只手臂之间；那只手臂压在他身子上、被他的头挡住
      // （用户 2026-10-30，0:52.16：「主角的胳膊需要被小石头的头遮挡，但是不能被小石头的身体遮挡」）。
      // 按部位排先后：她（不画近处那只胳膊）→ 他的身子 → 她近处那只胳膊（他的 beforeHead）→ 他的头、举到脸上的手
      const line = 1 / Math.sqrt(Math.max(0.3, z));
      const chenPose = s.chen.pose;
      g.save();
      g.translate(s.chen.root[0], s.chen.root[1]);
      const chenM = g.getTransform();
      drawChengtuo(g, chenPose, {
        line,
        skipArms: ["L"],
        beforeFrontArms: (cc) => {
          cc.save();
          cc.setTransform(wm);
          drawPerson(cc, s.stone.spec, s.stone.pose, s.stone.root[0], s.stone.root[1], z, {
            beforeHead: (c2) => {
              c2.save();
              c2.setTransform(chenM);
              drawChengtuo(c2, chenPose, { line, onlyArm: "L" });
              c2.restore();
            },
          });
          cc.restore();
        },
      });
      g.restore();
    }
  }
  // 脚踝上绕的一圈
  g.save();
  g.strokeStyle = "#d8352b";
  g.lineWidth = 3.4;
  g.beginPath();
  g.ellipse(s.stone.ankle[0], s.stone.ankle[1], 11, 5, 0.2, 0, Math.PI * 2);
  g.stroke();
  g.restore();
  // 小刀：她手里的跟着她走；掉下来以后靠在沉沉的铁靴上
  if (s.knife) drawKnifeState(g, s.knife, t, null);
}

/**
 * 「太耀眼」：「只是」起天上往下照着抱在一起的两个人的一道光（越往上越亮、越宽），「太耀眼」最亮——白在叫他们；推开以后淡掉
 * （画在人上面，screen 叠，只提亮）
 */
export function drawDazzle(g: CanvasRenderingContext2D, t: number) {
  const fade = 1 - E.io(ph(t, T.push, T.push + 0.4));
  if (t < T.hug - 0.1 || fade <= 0.002) return;
  const r = momRoot(Math.min(t, T.push));
  const head: V2 = [r[0] - 40, r[1] - 470];
  const k = fade * (0.55 * E.io(ph(t, T.hug - 0.1, T.hug + 0.3)) + 0.45 * E.io(ph(t, T.hug + 0.2, 46.45))) * (0.88 + 0.12 * Math.sin(t * 3.1));
  g.save();
  g.globalCompositeOperation = "screen";
  const top = head[1] - 2600;
  const beam = new Path2D();
  beam.moveTo(head[0] - 560, top);
  beam.lineTo(head[0] + 420, top);
  beam.lineTo(head[0] + 170, head[1] + 380);
  beam.lineTo(head[0] - 190, head[1] + 380);
  beam.closePath();
  const gr = g.createLinearGradient(0, top, 0, head[1] + 380);
  gr.addColorStop(0, `rgba(255,248,232,${0.5 * k})`);
  gr.addColorStop(0.75, `rgba(255,240,220,${0.14 * k})`);
  gr.addColorStop(1, "rgba(255,240,220,0)");
  g.fillStyle = gr;
  g.fill(beam);
  g.restore();
  drawGlow(g, head[0], head[1] + 120, 420, 0.3 * k);
}

/** 给镜头、⑦、间奏用：这一刻沉沉、小石头、妈妈在哪（和旧的 knifeAt 一样的字段） */
export function knifeAt(t: number) {
  const s = sceneAt(t);
  const chen = s.chen ?? { pose: chenMove(t).pose, root: [-3300, 0] as V2 };
  return { mom: { pose: s.mom.pose, root: s.mom.root, palmL: s.mom.palmL, palmR: s.mom.palmR }, stone: { pose: s.stone.pose, root: s.stone.root, ankle: s.stone.ankle }, chen };
}
