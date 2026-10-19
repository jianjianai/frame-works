// 第二幕的姿势（约定同 lib/poses.ts：四肢 0 竖直往下、正往前摆；手臂按画面里的方向写，自动加上 lean；腿按脚对地面的角度写）。
// 姿势表里一律按「朝左」写（face 为负）；朝右的人在关键帧里把 face 改成正的，素材库整套镜像。
// 检查页：sheets/第二幕姿势.ts。

import type { Angles } from "@materials/剪纸角色/code/chengtuo";
import { CHEN, KNEEL, armL, armR, legL, legR, pose } from "./poses";

/** 坐在地上（膝盖立着、脚收在身前）：胯离地约 45，不自动着地 */
const SIT_LOW = { ground: false, lift: -235 };
/** 坐在楼顶上：两个膝盖立起来、脚收在身前踩着（和第一幕的周磊一样） */
const KNEES_UP = { ...legR(140, -110, 0), ...legL(132, -90, 0) };

// ——————————————————— 千斤（16 岁，红毛衣、黄发卡、齐肩短发） ———————————————————
// 门口：朝右（看着妈妈、看着门）；高空：朝左（沉沉从左边那栋最高的楼扑过来）。
// 她是短发：失重给 0.2 以内（头发垂着、被风带着），飘的感觉靠身子和四肢慢慢摆。
export const QJ = {
  /** 被红线拴着飘在门口：抱着膝盖缩成一团，仰着头望天上的白 */
  抱膝飘: pose(18, { face: 0.6, float: 0.18, ground: false, ...legL(118, -146, -40), ...legR(112, -140, -36), neck: 34, expression: "难过", lookX: 0.2, lookY: -0.9 }, (l) => ({
    ...armL(18, 40, 10, "relax", l),
    ...armR(28, 34, 8, "relax", l),
  })),
  /** 被一把一把拽下来：腿松开垂着（被拴住的近处那只脚在下面），手被往上带，低着头不挣 */
  被拽: pose(-4, { face: 0.6, float: 0.15, ground: false, ...legL(6, -16, -54), ...legR(28, -48, -46), neck: -22, expression: "难过", lookY: 0.8 }, (l) => ({
    ...armL(122, 26, 6, "relax", l),
    ...armR(104, 34, 6, "relax", l),
  })),
  /** 拽到地上坐下：被拴着的近处那条腿伸向妈妈，另一条腿立着，手撑在身后 */
  坐地: pose(4, { face: 0.6, ...SIT_LOW, ...legL(78, -12, 20), ...legR(124, -116, 0), neck: -14, expression: "难过", lookY: 0.7 }, (l) => ({
    ...armL(-34, 12, 20, "open", l),
    ...armR(-24, 14, 20, "open", l),
  })),
  /** 抱着锁在脚上的哑铃坐着：腿伸着（微微弯），哑铃横在腿上，两只手圈着它，低头看它 */
  抱哑铃坐: pose(24, { face: 0.6, ...SIT_LOW, ...legL(86, -26, 30), ...legR(98, -50, 20), neck: -22, expression: "难过", lookY: 0.8 }, (l) => ({
    ...armL(26, 102, 0, "relax", l),
    ...armR(36, 94, 0, "relax", l),
  })),
  /** 抬头看天：还抱着哑铃，眼泪往上飘 */
  抱哑铃抬头: pose(10, { face: 0.6, ...SIT_LOW, ...legL(86, -26, 30), ...legR(98, -50, 20), neck: 38, expression: "含泪", lookX: 0.1, lookY: -1 }, (l) => ({
    ...armL(26, 102, 0, "relax", l),
    ...armR(36, 94, 0, "relax", l),
  })),
  /** 抱着哑铃飘起来：腿软软地垂着，哑铃抱在胸前，仰着头 */
  抱哑铃飘: pose(6, { face: 0.6, float: 0.18, ground: false, ...legL(4, -26, -56), ...legR(20, -44, -54), neck: 22, expression: "含泪", lookY: -0.8 }, (l) => ({
    ...armL(24, 92, 0, "relax", l),
    ...armR(36, 84, 0, "relax", l),
  })),
  /** 高空（朝左）：一只手搂着哑铃，远处的手从头发上拔下发卡 */
  拔发卡: pose(6, { face: -0.6, float: 0.18, ground: false, ...legL(2, -24, -56), ...legR(18, -42, -54), neck: -6, expression: "坚定", lookY: 0.4 }, (l) => ({
    ...armL(24, 92, 0, "relax", l),
    ...armR(150, 128, 20, "grip", l),
  })),
  /** 蜷起来，把锁在脚踝上的锁拉到手边，拿发卡捅锁眼（哑铃夹在胸口和大腿之间） */
  开锁: pose(18, { face: -0.6, float: 0.18, ground: false, ...legL(124, -118, -10), ...legR(30, -60, -50), neck: -8, expression: "坚定", teeth: 0.3, lookY: 1 }, (l) => ({
    ...armL(40, 46, 0, "grip", l),
    ...armR(52, 38, 0, "grip", l),
  })),
  /** 松手：哑铃掉下去，手还张着，腿伸开 */
  松手: pose(0, { face: -0.6, float: 0.2, ground: false, ...legL(-2, -20, -58), ...legR(14, -36, -56), neck: 8, expression: "平常", lookY: 0.6 }, (l) => ({
    ...armL(34, 14, 0, "open", l),
    ...armR(44, 12, 0, "open", l),
  })),
  /** 没了分量：张开手、闭着眼往上飘（和片头光里的女人一样：远处的手伸向头顶的光，近处的手往后舒展） */
  张手飘: pose(-6, { face: -0.4, float: 0.22, ground: false, rot: -2, ...legL(-4, -58, -62), ...legR(10, -18, -64), neck: 26, expression: "哭着笑", blink: 1 }, (l) => ({
    ...armL(-96, -20, -16, "open", l),
    ...armR(158, 14, 10, "open", l),
  })),
  /** 被一把抱住：一惊，眼睛睁开，手被甩开 */
  一惊: pose(-10, { face: -0.6, float: 0.18, ground: false, ...legL(10, -30, -50), ...legR(30, -60, -44), neck: 6, expression: "惊", lookX: -0.4, lookY: 0.5 }, (l) => ({
    ...armL(110, 30, 0, "open", l),
    ...armR(150, 24, 0, "open", l),
  })),
  /** 挣：往后仰，手推开抱着她的人 */
  推开: pose(-20, { face: -0.6, float: 0.18, ground: false, ...legL(20, -50, -40), ...legR(-6, -20, -50), neck: 14, expression: "忍着哭", teeth: 0.4, lookX: -0.3, lookY: 0.3 }, (l) => ({
    ...armL(36, 22, 10, "open", l),
    ...armR(28, 30, 10, "open", l),
  })),
  /** 挣开一只手，伸手去够头顶的白 */
  够白: pose(-14, { face: -0.6, float: 0.2, ground: false, ...legL(14, -40, -46), ...legR(-4, -22, -52), neck: 34, expression: "仰望", lookX: 0.1, lookY: -1 }, (l) => ({
    ...armL(40, 30, 10, "open", l),
    ...armR(176, 4, 6, "open", l),
  })),
  /** 伸上去的手腕被攥住、拉了下来：一愣，低头看抱着她的人 */
  被拉住: pose(-4, { face: -0.6, float: 0.18, ground: false, ...legL(12, -34, -48), ...legR(2, -26, -50), neck: -18, expression: "惊", lookX: -0.4, lookY: 0.7 }, (l) => ({
    ...armL(40, 30, 10, "open", l),
    ...armR(58, 40, 0, "relax", l),
  })),
  /** 看着她，嘴一抖一抖（忍不住了） */
  看她: pose(0, { face: -0.6, float: 0.16, ground: false, ...legL(12, -34, -48), ...legR(2, -26, -50), neck: -22, expression: "忍着哭", lookX: -0.4, lookY: 0.8 }, (l) => ({
    ...armL(36, 34, 10, "relax", l),
    ...armR(54, 44, 0, "relax", l),
  })),
  /** 一把搂住她的脖子，把脸埋下去哭（不再往上够了） */
  搂住: pose(26, { face: -0.6, float: 0.12, ground: false, ...legL(22, -50, -40), ...legR(10, -40, -46), neck: -24, expression: "忍着哭", blink: 1 }, (l) => ({
    ...armL(64, 92, 10, "relax", l),
    ...armR(74, 84, 10, "relax", l),
  })),
  /** 落在楼顶：坐着，靠在她怀里哭（身子还轻，头发还往上漂） */
  怀里哭: pose(20, { face: -0.6, float: 0.12, ...SIT_LOW, ...KNEES_UP, neck: -16, expression: "忍着哭", blink: 1 }, (l) => ({
    ...armL(72, 70, 10, "relax", l),
    ...armR(82, 62, 10, "relax", l),
  })),
  /** 她递过来一块砖：直起身，两只手平摊着接（她放进手里） */
  接砖: pose(6, { face: -0.6, ...SIT_LOW, ...KNEES_UP, neck: -18, expression: "含泪", lookX: -0.2, lookY: 0.9 }, (l) => ({
    ...armL(34, 64, 0, "flat", l),
    ...armR(26, 74, -10, "flat", l),
  })),
  /** 砖很沉：两只手一下坠下去，人坐实了 */
  一沉: pose(8, { face: -0.6, ...SIT_LOW, ...KNEES_UP, neck: -10, expression: "惊", lookY: 0.9 }, (l) => ({
    ...armL(30, 44, 0, "flat", l),
    ...armR(22, 54, -10, "flat", l),
  })),
  /** 捧着砖，抬头看她，哭着笑 */
  哭着笑: pose(4, { face: -0.6, ...SIT_LOW, ...KNEES_UP, neck: 14, expression: "哭着笑", lookX: -0.5, lookY: -0.2 }, (l) => ({
    ...armL(30, 50, 0, "flat", l),
    ...armR(22, 60, -10, "flat", l),
  })),
};

// ——————————————————— 千斤的妈妈（紫外套、盘发） ———————————————————
// 店里、门口：朝左（展台和千斤都在她左边）；进门、窗里：朝右。
export const MOM = {
  /** 弯腰抱起展台上最大的那只：手攥住把手 */
  搬: pose(40, { face: -0.7, ...legR(30, -46), ...legL(-10, -34, -10), neck: -8, expression: "使劲", teeth: 0.4, lookY: 0.7 }, (l) => ({
    ...armL(30, 14, 0, "grip", l),
    ...armR(38, 10, 0, "grip", l),
  })),
  /** 抱到胸前站起来（很沉，身子往后仰着压住） */
  抱起: pose(-10, { face: -0.7, ...legR(14, -10), ...legL(-14, -12, -6), neck: 0, expression: "使劲", lookX: -0.3, lookY: 0.4 }, (l) => ({
    ...armL(16, 104, 0, "grip", l),
    ...armR(24, 98, 0, "grip", l),
  })),
  /** 另一只手抓住了另一头：被往前一拽 */
  被拽: pose(30, { face: -0.7, ...legR(34, -16, 10), ...legL(-24, -20, -20), neck: 6, expression: "吓一跳", lookX: -0.5, lookY: 0.2 }, (l) => ({
    ...armL(84, 8, 0, "grip", l),
    ...armR(90, 6, 0, "grip", l),
  })),
  /** 往回一夺：整个人往后坐，咬着牙把它拽回怀里 */
  夺回: pose(-24, { face: -0.7, ...legR(30, -4, 22), ...legL(-6, -40, -30), neck: -4, expression: "使劲", teeth: 0.7, lookX: -0.4, lookY: 0.3 }, (l) => ({
    ...armL(26, 96, 0, "grip", l),
    ...armR(32, 90, 0, "grip", l),
  })),
  /** 抱着它退开：护在怀里，喘着 */
  护着: pose(-10, { face: -0.7, ...legR(10, -14), ...legL(-16, -10, -8), neck: -6, expression: "难过", lookX: -0.4, lookY: 0.2 }, (l) => ({
    ...armL(16, 106, 0, "grip", l),
    ...armR(24, 100, 0, "grip", l),
  })),
  /** 门口：弯腰把哑铃放在铁桩边 */
  放下: pose(52, { face: -0.7, ...legR(40, -62), ...legL(-6, -48, -20), neck: -10, expression: "平常", lookY: 0.8 }, (l) => ({
    ...armL(30, 30, 0, "grip", l),
    ...armR(40, 24, 0, "grip", l),
  })),
  /** 抬头看飘在头顶的女儿 */
  抬头: pose(-6, { face: -0.7, ...legR(8, -8), ...legL(-10, -6), neck: 44, expression: "难过", lookX: -0.2, lookY: -1 }, (l) => ({
    ...armL(-4, 20, 6, "relax", l),
    ...armR(4, 22, 0, "relax", l),
  })),
  /** 一把一把拽红线（两只手轮流）：A 近处的手在上 */
  拽A: pose(-12, { face: -0.7, ...legR(20, -8, 6), ...legL(-14, -14, -8), neck: 30, expression: "使劲", lookY: -0.8 }, (l) => ({
    ...armL(150, 14, 0, "grip", l),
    ...armR(54, 52, 0, "grip", l),
  })),
  /** B 远处的手在上 */
  拽B: pose(-8, { face: -0.7, ...legR(20, -8, 6), ...legL(-14, -14, -8), neck: 24, expression: "使劲", lookY: -0.7 }, (l) => ({
    ...armL(50, 56, 0, "grip", l),
    ...armR(156, 12, 0, "grip", l),
  })),
  /** 跪下来，把铁链绕在女儿脚踝上、扣上锁（不看她的脸） */
  跪着锁: pose(52, { face: -0.7, ...KNEEL, neck: -10, expression: "平常", sad: 0.6, lookY: 0.9 }, (l) => ({
    ...armL(42, 34, 0, "grip", l),
    ...armR(52, 28, 0, "grip", l),
  })),
  /** 站起来，没看她 */
  站起: pose(4, { face: -0.7, ...legR(10, -12), ...legL(-10, -6), thighR: 1, neck: -12, expression: "难过", lookY: 0.4 }, (l) => ({
    ...armL(-4, 18, 6, "relax", l),
    ...armR(4, 20, 0, "relax", l),
  })),
  /** 屋里：坐在桌前，手肘撑着桌面，捂着脸（朝右，背对着窗外的女儿） */
  捂脸: pose(26, { face: 0.6, ground: false, lift: -150, ...legR(86, -86), ...legL(80, -80), neck: -24, expression: "忍着哭", blink: 1 }, (l) => ({
    ...armL(62, 128, 26, "open", l),
    ...armR(72, 122, 26, "open", l),
  })),
};

// ——— 走路（妈妈、店里的人）：一步一拍左右，低着头 ———
export const WALK_SLOW: [number, Angles][] = [
  [0, { ...legL(18, -6, 8), ...legR(-12, -10, -16) }],
  [0.25, { ...legL(14, -14, 0), ...legR(-16, -26, -30) }],
  [0.5, { ...legL(2, -4, 0), ...legR(8, -36, -8) }],
  [0.75, { ...legL(-8, -4, -10), ...legR(20, -12, 4) }],
];

// ——————————————————— 沉沉（第二幕：楼顶白天、夜里在家） ———————————————————
const RUN_FACE_R = { face: 1 };
export const CHEN2 = {
  /** 楼顶（她家）朝巷子那头的楼边站着，往下看着城（每天都这样守着）：风把头发往左吹 */
  远望: pose(4, { face: 0.85, ...legR(8, -8), ...legL(-8, -4), neck: -16, expression: "平常", sad: 0.2, lookX: 0.2, lookY: 0.7 }, (l) => ({
    ...armL(-4, 16, 6, "relax", l),
    ...armR(6, 18, 0, "relax", l),
  })),
  /** 看见了：一惊，眼睛盯住巷子里往上飘的人，手一下抬起来 */
  看见: pose(-4, { face: 0.85, ...legR(10, -8), ...legL(-10, -6), neck: -8, expression: "惊", lookX: 0.8, lookY: 0.5 }, (l) => ({
    ...armL(30, 40, 6, "open", l),
    ...armR(40, 36, 0, "open", l),
  })),
  /** 楼顶收床单（朝左，面对晾衣绳）：两只手举到绳上 */
  收床单: pose(-4, { face: -0.75, ...legR(8, -8), ...legL(-6, -4), neck: 16, expression: "平常", lookX: -0.2, lookY: -0.6 }, (l) => ({
    ...armL(150, 30, 10, "grip", l),
    ...armR(166, 18, 10, "grip", l),
  })),
  /** 回头：身子还朝着床单，头转过来看右边（巷子那边往上飘的人） */
  回头: pose(-2, { face: -0.6, headTurn: -1, ...legR(8, -8), ...legL(-6, -4), neck: 6, expression: "惊", lookX: 0.6, lookY: 0.1 }, (l) => ({
    ...armL(120, 40, 10, "open", l),
    ...armR(136, 30, 10, "open", l),
  })),
  /** 转过身（朝右）往后退：先退两步拉开助跑 */
  退: pose(-6, { face: 1, ...legR(14, -10, 6), ...legL(-22, -20, -14), neck: 10, expression: "坚定", lookX: 0.2 }, (l) => ({
    ...armL(-30, 40, 6, "open", l),
    ...armR(-20, 44, 0, "open", l),
  })),
  /** 跑（朝右，用前奏的跑步姿势镜像） */
  跑_落地: { ...CHEN.跑_落地, ...RUN_FACE_R, expression: "使劲" } as Angles,
  跑_踩实: { ...CHEN.跑_踩实, ...RUN_FACE_R, expression: "使劲" } as Angles,
  跑_蹬地: { ...CHEN.跑_蹬地, ...RUN_FACE_R, expression: "使劲" } as Angles,
  跑_腾空: { ...CHEN.跑_腾空, ...RUN_FACE_R, expression: "使劲" } as Angles,
  /** 楼边最后一步：一只靴子踩在楼边上，身子压低往前 */
  蹬边: pose(30, { face: 1, ground: false, ...legR(64, -80, 0), ...legL(-30, -40, -30), lift: -40, neck: 30, expression: "使劲", teeth: 0.5, lookY: -0.4 }, (l) => ({
    ...armL(-50, 30, 6, "open", l),
    ...armR(-34, 34, 6, "open", l),
  })),
  /** 扑出去：整个人斜着往前飞，两只手往前伸，腿甩在后面 */
  扑: pose(48, { face: 1, ground: false, ...legL(-36, -30, -40), ...legR(-14, -50, -40), neck: 30, expression: "使劲", lookX: 0.3, lookY: -0.6 }, (l) => ({
    ...armL(96, 8, 6, "open", l),
    ...armR(112, 6, 6, "open", l),
  })),
  /** 半空里抱住：两只胳膊圈住她的腰，脸贴着她，腿垂下去（铁靴往下坠） */
  抱住: pose(14, { face: 0.8, ground: false, ...legL(-8, -30, -40), ...legR(14, -44, -30), neck: 16, expression: "使劲", lookX: 0.3, lookY: -0.7 }, (l) => ({
    ...armL(84, 30, 0, "relax", l),
    ...armR(74, 38, 0, "relax", l),
  })),
  /** 攥住她伸上去的手腕：远处的手往上一抓 */
  抓手腕: pose(10, { face: 0.8, ground: false, ...legL(-6, -28, -40), ...legR(12, -40, -30), neck: 30, expression: "使劲", lookX: 0.2, lookY: -1 }, (l) => ({
    ...armL(84, 30, 0, "relax", l),
    ...armR(160, 10, 0, "grip", l),
  })),
  /** 仰着脸看她：别走（眼里含着泪） */
  看她: pose(10, { face: 0.8, ground: false, ...legL(-6, -28, -40), ...legR(12, -40, -30), neck: 26, expression: "含泪", lookX: 0.2, lookY: -0.9 }, (l) => ({
    ...armL(84, 30, 0, "relax", l),
    ...armR(84, 40, 0, "grip", l),
  })),
  /** 两个人抱在一起慢慢往下落：她把脸埋在她肩上 */
  抱紧: pose(12, { face: 0.8, ground: false, ...legL(-4, -26, -36), ...legR(12, -38, -28), neck: -6, expression: "心疼", blink: 0.9 }, (l) => ({
    ...armL(62, 82, 0, "relax", l),
    ...armR(54, 90, 0, "relax", l),
  })),
  /** 落在楼顶：铁靴踩住，膝盖一弯接住两个人的分量 */
  落地: pose(22, { face: 0.8, ...legR(46, -70), ...legL(-14, -40, -10), neck: 0, expression: "使劲", lookX: 0.3, lookY: 0.4 }, (l) => ({
    ...armL(58, 82, 0, "relax", l),
    ...armR(50, 90, 0, "relax", l),
  })),
  /** 单膝跪下，把她搂在怀里 */
  跪着搂: pose(16, { face: 0.8, ...KNEEL, neck: -12, expression: "心疼", lookX: 0.3, lookY: 0.7 }, (l) => ({
    ...armL(44, 84, 0, "relax", l),
    ...armR(36, 92, 0, "relax", l),
  })),
};

/** 夜里在家（脱了外套、围巾、手套）：朝左坐在桌前 */
export const CHEN_N = {
  /** 伏在桌上写字：近处的手拿着笔，远处的手按着砖 */
  写: pose(26, { face: -0.8, ...legR(84, -80), ...legL(76, -74), neck: -26, expression: "平常", smile: 0.25, lookX: -0.2, lookY: 0.9 }, (l) => ({
    ...armL(36, 54, 10, "grip", l),
    ...armR(50, 50, 0, "grip", l),
  })),
  /** 写完了，拿起砖看一眼 */
  拿砖: pose(14, { face: -0.8, ...legR(84, -80), ...legL(76, -74), neck: -10, expression: "微笑", lookX: -0.3, lookY: 0.4 }, (l) => ({
    ...armL(48, 70, 0, "flat", l),
    ...armR(20, 30, 0, "relax", l),
  })),
  /** 弯腰把砖塞进靴筒（前面那只） */
  塞砖: pose(58, { face: -0.8, ...legR(84, -80), ...legL(76, -74), neck: -20, expression: "平常", lookY: 0.9 }, (l) => ({
    ...armL(20, 4, -6, "grip", l),
    ...armR(-10, 30, 0, "relax", l),
  })),
  /** 坐着脱靴子：抬起一条腿，两只手抱住靴筒往下拔 */
  脱靴: pose(44, { face: -0.8, ...legR(118, -64, 30), ...legL(76, -74), neck: -16, expression: "使劲", lookY: 0.8 }, (l) => ({
    ...armL(72, 16, 0, "grip", l),
    ...armR(84, 10, 0, "grip", l),
  })),
  /** 另一只 */
  脱靴2: pose(44, { face: -0.8, ...legR(84, -80), ...legL(116, -64, 30), neck: -16, expression: "使劲", lookY: 0.8 }, (l) => ({
    ...armL(70, 18, 0, "grip", l),
    ...armR(80, 14, 0, "grip", l),
  })),
  /** 脱掉了：脚跟一下离了地，整个人从椅子上浮起来（失重，头发像在水里一样漂起来） */
  浮起: pose(-4, { face: -0.8, float: 0.6, ground: false, ...legR(40, -60, -30), ...legL(30, -50, -36), neck: 14, expression: "平常", lookY: -0.6 }, (l) => ({
    ...armL(50, 30, 6, "open", l),
    ...armR(70, 24, 6, "open", l),
  })),
  /** 飘到天花板上的床里（整个人横过来，背贴着倒钉在天花板上的床垫），闭上眼 */
  躺: pose(0, { face: -0.8, float: 0.5, ground: false, rot: -90, ...legR(4, -6, -30), ...legL(-2, -4, -30), neck: 4, expression: "闭眼", smile: 0.2 }, (l) => ({
    ...armL(10, 20, 6, "relax", l),
    ...armR(20, 24, 6, "relax", l),
  })),
};
