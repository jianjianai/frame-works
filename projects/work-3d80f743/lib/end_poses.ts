// 终章（lib/end_t.ts）里所有人的姿势：全部按关节角度写（不用素材库的动作预设），手臂按画面里的方向写（自动加上 lean）。
// 她：face 1 朝右（他在她右下方：楼在左边，他在老钟家这边）；他：face −0.7 朝左（朝着她、朝着楼）。
// 很多是 lib/fin_poses.ts 那一版的（扑、冲、抱、拔靴……），按新的调度改了表情和手。

import type { Angles } from "@materials/剪纸角色/code/chengtuo";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";

// ——————————————— 她 ———————————————
export const HER = {
  /** 撞开防飘栏扑出窗口：身子往前一探，两只手往前伸 */
  扑: pose(40, { face: 1, ground: false, rot: -50, ...legL(-46, -8, -40), ...legR(34, -60, -20), neck: 26, expression: "使劲", teeth: 0.5, lookX: -0.4, lookY: 0.6 }, (l) => ({
    ...armL(118, 10, 0, "open", l),
    ...armR(108, 14, 0, "open", l),
  })),
  /** 头朝下往下冲：两只手往下伸着够他，咬着牙盯着他 */
  冲: pose(0, { face: 1, ground: false, rot: 165, ...legL(-14, -26, -20), ...legR(18, -40, -20), neck: 18, expression: "使劲", teeth: 0.6, lookX: 0, lookY: -0.8 }, (l) => ({
    ...armL(165, 10, 0, "open", l),
    ...armR(155, 14, 0, "open", l),
  })),
  /** 一把抱住：身子甩过来，两只手臂环在他身上（IK） */
  抱: pose(18, { face: 1, ground: false, rot: -25, chestL: "over", ...legL(-20, -50, -30), ...legR(30, -80, -20), neck: -6, expression: "使劲", teeth: 0.4, lookX: 0.3, lookY: 0.4 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(14, 70, 0, "grip", l),
  })),
  /** 抱着他往下坠：身子直过来，两条腿并着往下伸，低头看着越来越近的街面 */
  抱坠: pose(6, { face: 1, ground: false, rot: -4, chestL: "over", ...legL(-6, -16, -40), ...legR(8, -22, -40), neck: -24, expression: "惊", lookX: 0.2, lookY: 1 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(14, 70, 0, "grip", l),
  })),
  /** 快到地面：两只脚使劲往下够石板（腿伸直、脚尖往下） */
  够地: pose(2, { face: 1, ground: false, rot: 0, chestL: "over", ...legL(-4, -2, -70), ...legR(6, -2, -66), neck: -30, expression: "使劲", teeth: 0.5, lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(14, 70, 0, "grip", l),
  })),
  /** 又飘起来了：看着他（心疼），含着泪 */
  抱升: pose(4, { face: 1, ground: false, rot: 0, chestL: "over", ...legL(-6, -18, -40), ...legR(10, -26, -40), neck: -18, expression: "心疼", tears: 1, lookX: 0.5, lookY: 0.6 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(14, 70, 0, "grip", l),
  })),
  /** 看一眼一扇扇关上的窗（在她身后左边） */
  看窗: pose(4, { face: 1, ground: false, rot: 0, chestL: "over", ...legL(-6, -18, -40), ...legR(10, -26, -40), neck: 4, headTurn: -0.25, expression: "难过", tears: 1, lookX: -0.9, lookY: -0.1 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(14, 70, 0, "grip", l),
  })),
  /** 看看自己的铁靴：低下头，定下心来 */
  看靴: pose(10, { face: 1, ground: false, rot: 0, chestL: "over", ...legL(-6, -18, -40), ...legR(10, -26, -40), neck: -34, expression: "坚定", tears: 1, lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(14, 70, 0, "grip", l),
  })),
  /** 拔近处那只（L）：近处那条腿抬起来，近处那只手攥住靴口 */
  拔L: pose(6, { face: 1, ground: false, rot: 0, chestL: "over", ...legL(72, -108, -30), ...legR(4, -20, -40), neck: -36, expression: "坚定", tears: 1, lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(40, 30, 0, "grip", l),
  })),
  /** 拔远处那只（R） */
  拔R: pose(6, { face: 1, ground: false, rot: 0, chestL: "over", ...legL(-6, -20, -46), ...legR(76, -112, -30), neck: -36, expression: "坚定", tears: 1, lookX: 0.2, lookY: 1 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(40, 30, 0, "grip", l),
  })),
  /** 光着脚抱着他（两只铁靴都给了他）：冲他笑，眼泪掉下来 */
  光脚抱: pose(6, { face: 1, ground: false, rot: 0, chestL: "over", float: 0.2, ...legL(-6, -20, -46), ...legR(10, -28, -46), neck: -22, expression: "微笑", smile: 0.55, tears: 1, sad: 0.6, lookX: 0.4, lookY: 0.7 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(14, 70, 0, "grip", l),
  })),
  /** 把他攥着围巾的手指一根根掰开（和他妈妈当年一样）：远处那只手（IK）在他手上，低头冲他笑 */
  掰: pose(8, { face: 1, ground: false, rot: 0, chestL: "over", float: 0.25, ...legL(-6, -20, -46), ...legR(10, -28, -46), neck: -26, expression: "微笑", smile: 0.6, tears: 1, sad: 0.8, blink: 0.3, lookX: 0.3, lookY: 0.8 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(50, 80, 0, "relax", l),
  })),
  /** 松手：光着脚一下子轻了，两只手张着朝下伸向他，低头冲他笑（含着泪） */
  放: pose(-4, { face: 1, ground: false, rot: 8, float: 0.5, ...legL(-8, -20, -40), ...legR(10, -34, -40), neck: -28, expression: "微笑", smile: 0.6, tears: 1, lookX: 0.2, lookY: 1 }, (l) => ({
    ...armL(28, 6, 0, "open", l),
    ...armR(18, 20, 0, "open", l),
  })),
  /** 越升越快：身子往后仰一点，两只手往下张着，一直低头看着他笑 */
  升: pose(-6, { face: 1, ground: false, rot: 12, float: 0.55, ...legL(-10, -24, -44), ...legR(8, -38, -44), neck: -26, expression: "微笑", smile: 0.6, tears: 1, lookX: -0.1, lookY: 1 }, (l) => ({
    ...armL(-20, 16, 0, "open", l),
    ...armR(30, 22, 0, "open", l),
  })),
  /** 冲他笑（眼泪往上飘） */
  笑: pose(-4, { face: 1, ground: false, rot: 8, float: 0.6, ...legL(-10, -24, -44), ...legR(8, -38, -44), neck: -34, expression: "微笑", smile: 0.85, tears: 1, sad: 0.5, lookX: -0.2, lookY: 1 }, (l) => ({
    ...armL(-28, 20, 0, "open", l),
    ...armR(36, 24, 0, "open", l),
  })),
  /** 仰起脸朝着白（释然） */
  仰: pose(-4, { face: 1, ground: false, rot: 12, float: 0.6, ...legL(-8, -20, -40), ...legR(10, -34, -40), neck: 24, expression: "释然", smile: 0.6, tears: 1, lookX: 0, lookY: -1 }, (l) => ({
    ...armL(96, 26, 0, "open", l),
    ...armR(84, 24, 0, "open", l),
  })),
  /** 白的边上：身子转过来一点，两只手朝两边张开，闭着眼含泪笑（和开场光里的女人一个样子） */
  开: pose(-4, { face: 0.3, ground: false, rot: 4, float: 0.7, ...legL(-8, -20, -40), ...legR(10, -34, -40), neck: 16, expression: "释然", smile: 0.55, tears: 1, lookX: 0, lookY: -0.5 }, () => ({
    ...armL(-74, 20, 0, "open", -4),
    ...armR(120, 18, 0, "open", -4),
  })),
  /** 睁开眼，想最后看他一眼：低头往下看 */
  睁眼: pose(-2, { face: 0.4, ground: false, rot: 4, float: 0.7, ...legL(-8, -20, -40), ...legR(10, -34, -40), neck: -26, expression: "含泪", tears: 1, lookX: 0.2, lookY: 1 }, () => ({
    ...armL(-60, 30, 0, "open", -2),
    ...armR(90, 30, 0, "open", -2),
  })),
  /** 看见他从靴子里出来往上追她：一惊 */
  看见: pose(4, { face: 0.5, ground: false, rot: 6, float: 0.7, ...legL(-8, -20, -40), ...legR(10, -34, -40), neck: -32, expression: "惊", tears: 1, lookX: 0.3, lookY: 1 }, () => ({
    ...armL(-30, 40, 0, "open", 4),
    ...armR(50, 40, 0, "open", 4),
  })),
  /** 翻身扑向栏杆：头朝下，两只手往下够 */
  翻: pose(30, { face: 0.6, ground: false, rot: 120, float: 0.7, ...legL(-30, -50, -30), ...legR(10, -70, -30), neck: 20, expression: "使劲", teeth: 0.6, tears: 1, lookX: 0, lookY: -0.6 }, (l) => ({
    ...armL(170, 10, 0, "open", l),
    ...armR(160, 14, 0, "open", l),
  })),
  /** 倒挂：两只手攥着楼顶栏杆（IK），身子被白往上拽成倒立，脚尖朝着白；脸朝下看着他（忍着哭） */
  倒挂: pose(0, { face: 0.35, ground: false, rot: 180, float: 0, ...legL(-3, -4, -50), ...legR(5, -8, -50), neck: 26, expression: "忍着哭", tears: 1, lookX: 0.15, lookY: -1 }, (l) => ({
    ...armL(172, 24, 0, "grip", l),
    ...armR(160, 26, 0, "grip", l),
  })),
  /** 倒挂着往下喊他（嘴张开一点，哭） */
  倒挂哭: pose(0, { face: 0.35, ground: false, rot: 180, float: 0, ...legL(-3, -4, -50), ...legR(5, -8, -50), neck: 30, expression: "忍着哭", tears: 1, sad: 1, open: 0.35, lookX: 0.2, lookY: -1 }, (l) => ({
    ...armL(172, 24, 0, "grip", l),
    ...armR(160, 26, 0, "grip", l),
  })),
  /** 远处那只手松开栏杆接住砖（IK），看着砖 */
  接: pose(0, { face: 0.35, ground: false, rot: 180, float: 0, ...legL(-3, -4, -50), ...legR(5, -8, -50), neck: 20, expression: "含泪", tears: 1, lookX: 0.3, lookY: -0.4 }, (l) => ({
    ...armL(172, 24, 0, "grip", l),
    ...armR(120, 60, 0, "grip", l),
  })),
  /** 看见背面的字：哭着笑 */
  哭笑: pose(0, { face: 0.35, ground: false, rot: 180, float: 0, ...legL(-3, -4, -50), ...legR(5, -8, -50), neck: 20, expression: "哭着笑", tears: 1, lookX: 0.3, lookY: -0.4 }, (l) => ({
    ...armL(172, 24, 0, "grip", l),
    ...armR(120, 60, 0, "grip", l),
  })),
  /** 松开栏杆，两只手抱住他（IK），慢慢转正；闭着眼哭着笑 */
  抱他: pose(10, { face: 0.4, ground: false, rot: 0, float: 0.3, chestL: "over", ...legL(-8, -20, -40), ...legR(10, -30, -40), neck: -16, expression: "哭着笑", tears: 1, blink: 0.6, lookX: 0.3, lookY: 0.6 }, (l) => ({
    ...armL(40, 70, 0, "grip", l),
    ...armR(50, 80, 0, "grip", l),
  })),
  /** 抱着他慢慢落下来：有了分量，头发落下来，低头看着他 */
  落: pose(6, { face: 0.4, ground: false, rot: -2, float: 0.12, chestL: "over", ...legL(-6, -20, -30), ...legR(8, -28, -30), neck: -20, expression: "哭着笑", tears: 1, lookX: 0.3, lookY: 0.8 }, (l) => ({
    ...armL(40, 70, 0, "grip", l),
    ...armR(50, 80, 0, "grip", l),
  })),
  /** 光着脚站在街上（抱着他） */
  站抱: pose(4, { face: 0.4, ground: true, lift: 0, float: 0, chestL: "over", ...legR(6, -6), ...legL(-4, -2), neck: -16, expression: "哭着笑", tears: 1, lookX: 0.3, lookY: 0.6 }, (l) => ({
    ...armL(40, 70, 0, "grip", l),
    ...armR(50, 80, 0, "grip", l),
  })),
  /** 把他放下来：弯一点腰，两只手扶着他 */
  放下: pose(26, { face: 0.4, ground: true, lift: 0, float: 0, ...legR(16, -20), ...legL(-6, -10), neck: -20, expression: "哭着笑", tears: 1, lookX: 0.3, lookY: 0.8 }, (l) => ({
    ...armL(30, 30, 0, "open", l),
    ...armR(40, 30, 0, "open", l),
  })),
  /** 单膝跪下（光着脚）：前腿 R 立着、后膝着地，看着他，两只手捧着砖 */
  跪: pose(6, { face: 0.4, ground: true, lift: 0, float: 0, ...legR(96, -98), ...legL(-6, -134, -140), thighR: 0.7, neck: -6, expression: "哭着笑", tears: 1, lookX: 0.4, lookY: 0.2 }, (l) => ({
    ...armL(40, 100, 0, "grip", l),
    ...armR(36, 104, 0, "grip", l),
  })),
  /** 跪着低头看手里的砖：哭着笑 */
  跪看砖: pose(12, { face: 0.4, ground: true, lift: 0, float: 0, ...legR(96, -98), ...legL(-6, -134, -140), thighR: 0.7, neck: -24, expression: "哭着笑", tears: 1, lookX: 0.2, lookY: 0.9 }, (l) => ({
    ...armL(44, 100, 0, "grip", l),
    ...armR(40, 104, 0, "grip", l),
  })),
  /** 站起来：砖抱在胸口 */
  站: pose(2, { face: 0.4, ground: true, lift: 0, float: 0, ...legR(6, -6), ...legL(-4, -2), thighR: 1, neck: -4, expression: "哭着笑", tears: 1, lookX: 0.4, lookY: 0.1 }, (l) => ({
    ...armL(40, 104, 0, "grip", l),
    ...armR(36, 108, 0, "grip", l),
  })),
  // ——— 用户 2026-10-25 第二次改：她停在白的边上一点点化成光，他被风荡到跟前把砖递给她；落地以后她给他穿上外套，光着脚跺一下 ———
  /** 他荡到跟前：两只手往下接砖（IK 放在砖的两头），一惊 */
  接2: pose(14, { face: 0.4, ground: false, rot: 4, float: 0.7, ...legL(-8, -20, -40), ...legR(10, -34, -40), neck: -30, expression: "惊", tears: 1, lookX: 0.3, lookY: 1 }, (l) => ({
    ...armL(30, 60, 0, "grip", l),
    ...armR(40, 60, 0, "grip", l),
  })),
  /** 低头看手里的砖：是她自己写的「活下去」，忍着哭 */
  看砖2: pose(8, { face: 0.4, ground: false, rot: 2, float: 0.6, ...legL(-8, -20, -40), ...legR(10, -34, -40), neck: -26, expression: "忍着哭", tears: 1, sad: 1, open: 0.2, lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(36, 100, 0, "grip", l),
    ...armR(40, 100, 0, "grip", l),
  })),
  /** 抬头看他：哭着笑 */
  哭笑2: pose(6, { face: 0.4, ground: false, rot: 2, float: 0.6, ...legL(-8, -20, -40), ...legR(10, -34, -40), neck: -18, expression: "哭着笑", tears: 1, lookX: 0.4, lookY: 0.8 }, (l) => ({
    ...armL(36, 100, 0, "grip", l),
    ...armR(40, 100, 0, "grip", l),
  })),
  /** 光着脚站着，两只手空着 */
  站空: pose(2, { face: 0.4, ground: true, lift: 0, float: 0, ...legR(6, -6), ...legL(-4, -2), neck: -8, expression: "哭着笑", tears: 1, lookX: 0.4, lookY: 0.3 }, (l) => ({
    ...armL(8, 20, 0, "relax", l),
    ...armR(10, 24, 0, "relax", l),
  })),
  /** 朝左走一步（去捡外套） */
  走左: pose(4, { face: -0.4, ground: true, lift: 0, float: 0, ...legR(22, -16), ...legL(-14, -12), neck: -10, expression: "含泪", tears: 1, lookX: -0.2, lookY: 0.5 }, (l) => ({
    ...armL(-16, 20, 0, "relax", l),
    ...armR(18, 24, 0, "relax", l),
  })),
  /** 弯腰捡起外套（朝左） */
  捡: pose(58, { face: -0.4, ground: true, lift: 0, float: 0, ...legR(28, -46), ...legL(-6, -18), neck: -12, expression: "含泪", tears: 1, lookX: 0, lookY: 0.8 }, (l) => ({
    ...armL(-8, 12, 0, "grip", l),
    ...armR(2, 12, 0, "grip", l),
  })),
  /** 拎着外套朝右走回他跟前 */
  走右: pose(4, { face: 0.4, ground: true, lift: 0, float: 0, ...legR(22, -16), ...legL(-14, -12), neck: -10, expression: "微笑", smile: 0.6, tears: 1, lookX: 0.4, lookY: 0.4 }, (l) => ({
    ...armL(40, 60, 0, "grip", l),
    ...armR(46, 60, 0, "grip", l),
  })),
  /** 跪在他跟前，两只手举着外套的领子给他披上（IK） */
  跪披: pose(4, { face: 0.4, ground: true, lift: 0, float: 0, ...legR(96, -98), ...legL(-6, -134, -140), thighR: 0.7, neck: 0, expression: "微笑", smile: 0.7, tears: 1, lookX: 0.4, lookY: -0.1 }, (l) => ({
    ...armL(90, 40, 0, "grip", l),
    ...armR(100, 40, 0, "grip", l),
  })),
  /** 抬起一只光脚（远处那条），憋一口气 */
  抬脚: pose(-6, { face: 0.4, ground: true, lift: 0, float: 0, ...legR(78, -84), ...legL(-6, -6), neck: 4, expression: "坚定", teeth: 0.4, tears: 1, lookX: 0.3, lookY: 0.4 }, (l) => ({
    ...armL(-20, 30, 0, "fist", l),
    ...armR(30, 40, 0, "fist", l),
  })),
  /** 跺下去：腿砸直，身子跟着往下一压 */
  跺2: pose(6, { face: 0.4, ground: true, lift: 0, float: 0, ...legR(10, -8), ...legL(-6, -10), neck: -10, expression: "坚定", teeth: 0.6, tears: 1, lookX: 0.3, lookY: 0.7 }, (l) => ({
    ...armL(-30, 30, 0, "fist", l),
    ...armR(-24, 34, 0, "fist", l),
  })),
  /** 跺完：看着他，哭着笑 */
  笑看: pose(2, { face: 0.4, ground: true, lift: 0, float: 0, ...legR(10, -8), ...legL(-6, -10), neck: -6, expression: "哭着笑", tears: 1, lookX: 0.5, lookY: 0.4 }, (l) => ({
    ...armL(8, 20, 0, "relax", l),
    ...armR(10, 24, 0, "relax", l),
  })),
};
/** 光脚往前一步：前脚（远处那条）抬起来往前迈，后脚钉在地上 */
export const HER_STEP_UP: Angles = { ...HER.站, ...legR(34, -50, 0), ...legL(-12, -8, 0) };
export const HER_STEP_DOWN: Angles = { ...HER.站, ...legR(16, -6, 0), ...legL(-18, -8, 0) };

// ——————————————— 他 ———————————————
/** 他的手臂举过头顶捏着砖的两头（手由 IK 放在砖的两头） */
const RAISED = (l: number): Angles => ({ shoulderL: 165 + l, elbowL: 20, wristL: 0, handL: "grip", shoulderR: 165 + l, elbowR: 20, wristR: 0, handR: "grip" });
/** 两只手把砖抱在胸前 */
const HUGB = (l: number): Angles => ({ ...armL(36, 110, 0, "grip", l), ...armR(40, 110, 0, "grip", l) });
/** 近处那只手把砖抱在胸口，远处那只伸上去（张开） */
const UPB = (l: number, up = 160): Angles => ({ ...armL(36, 110, 0, "grip", l), ...armR(up, 14, 0, "open", l) });
/** 被她抱住以后（他那块「妈妈，明天见」抱住那一下就掉了，用户 2026-10-26）：两只手往前攥着她的衣服 */
const HUGH = (l: number): Angles => ({ ...armL(64, 64, 0, "grip", l), ...armR(72, 56, 0, "grip", l) });
/** 两只手都往上伸着够她（手里没有砖） */
const UP2 = (l: number, up = 160): Angles => ({ ...armL(up - 28, 22, 0, "open", l), ...armR(up, 14, 0, "open", l) });
export const KID = {
  /** 穿着妈妈的外套，仰头看着白：近处那只手拎着砖垂在身边，含着泪 */
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
  举: pose(-6, { face: -0.7, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: 32, expression: "仰望", tears: 1, sad: 0.5, lookX: -0.2, lookY: -1 }, RAISED),
  /** 离了地：没了分量，腿软软地垂着，两只手举着砖朝着白，哭着笑（他是去找妈妈） */
  飘: pose(-6, { face: -0.7, ground: false, float: 0.3, ...legR(8, -22, -50), ...legL(-6, -18, -54), neck: 32, expression: "哭着笑", tears: 1, sad: 0.4, lookX: -0.2, lookY: -1 }, RAISED),
  /** 看见她从上面扑下来：一惊，把砖收到胸前两只手抱着 */
  惊: pose(-6, { face: -0.7, ground: false, float: 0.3, ...legR(8, -22, -50), ...legL(-6, -18, -54), neck: 26, expression: "吓一跳", tears: 1, lookX: -0.3, lookY: -1 }, HUGB),
  /** 被她抱着：砖抱在胸前，含着泪仰头看着她 */
  被抱: pose(-4, { face: -0.7, ground: false, float: 0.2, ...legR(8, -24, -50), ...legL(-6, -18, -54), neck: 22, expression: "含泪", tears: 1, lookX: -0.5, lookY: -0.6 }, HUGH),
  /** 快到地面：低头看着底下的街面（差一点） */
  看地: pose(-2, { face: -0.7, ground: false, float: 0.15, ...legR(10, -14, -60), ...legL(-4, -10, -60), neck: -24, expression: "含泪", tears: 1, lookX: -0.1, lookY: 1 }, HUGH),
  /** 她看自己的铁靴、一只一只拔下来：他看着她，不明白（担心） */
  看她: pose(-4, { face: -0.7, ground: false, float: 0.2, ...legR(8, -24, -50), ...legL(-6, -18, -54), neck: 18, expression: "担心", tears: 1, lookX: -0.5, lookY: -0.7 }, HUGH),
  /** 铁靴套上去：两条腿被坠直 */
  套: pose(-4, { face: -0.7, ground: false, float: 0.1, ...legR(4, -6, 0), ...legL(-4, -6, 0), neck: 18, expression: "担心", tears: 1, lookX: -0.5, lookY: -0.8 }, HUGH),
  /** 明白过来：远处那只手攥住她的围巾（IK），拼命摇头，哭 */
  攥: pose(-4, { face: -0.7, ground: false, float: 0.1, ...legR(4, -6, 0), ...legL(-4, -6, 0), neck: 22, expression: "忍着哭", tears: 1, sad: 1, open: 0.3, lookX: -0.4, lookY: -0.8 }, (l) => ({
    ...armL(36, 110, 0, "grip", l),
    ...armR(120, 40, 0, "grip", l),
  })),
  /** 铁靴一沉往下坠：两只手往上伸着够她，哭着仰头看她 */
  坠: pose(-4, { face: -0.7, ground: false, ...legR(4, -6, 0), ...legL(-4, -6, 0), neck: 28, expression: "含泪", tears: 1, sad: 1, open: 0.3, lookX: -0.2, lookY: -1 }, (l) => UP2(l, 165)),
  /** 穿着她的铁靴站在街上，仰着头，远处那只手还往上伸着，近处那只垂下来 */
  站仰: pose(-4, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: 32, expression: "仰望", tears: 1, sad: 0.8, lookX: -0.1, lookY: -1 }, (l) => ({ ...armL(-2, 18, 0, "relax", l), ...armR(120, 14, 0, "open", l) })),
  /** 天上掉下来的砖砸在靴尖前面：低头看着它，两只手垂下来 */
  看砖: pose(4, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: -26, expression: "含泪", tears: 1, sad: 0.8, lookX: -0.3, lookY: 1 }, (l) => ({ ...armL(14, 30, 0, "relax", l), ...armR(18, 34, 0, "open", l) })),
  /** 两只手抱着她的砖（「活下去」朝外），仰着头哭 */
  抱砖仰: pose(-4, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: 32, expression: "仰望", tears: 1, sad: 1, lookX: -0.1, lookY: -1 }, HUGB),
  /** 抬起一只铁靴：铁靴硬、高到他大腿，大腿抬平、小腿竖着，身子往后仰着压住；咬着牙 */
  抬靴: pose(-12, { face: -0.7, ground: false, ...legR(88, -88, 0), ...legL(-6, -4, 0), neck: 10, expression: "使劲", tears: 1, teeth: 0.7, lookX: -0.2, lookY: -0.4 }, HUGB),
  /** 跺下去：腿砸直，身子跟着往前一压 */
  跺: pose(8, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: -16, expression: "使劲", tears: 1, teeth: 0.8, lookX: -0.2, lookY: 0.6 }, HUGB),
  /** 跺完：抬头看天，哭 */
  仰: pose(-6, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: 32, expression: "坚定", tears: 1, sad: 0.8, lookX: -0.2, lookY: -1 }, HUGB),
  /** 一只脚从她的铁靴里抽出来（近处那条：膝盖提起来） */
  出L: pose(-6, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(70, -100, -30), neck: 30, expression: "坚定", tears: 1, lookX: -0.2, lookY: -1 }, (l) => UPB(l, 120)),
  /** 再一只（远处那条） */
  出R: pose(-6, { face: -0.7, ground: false, ...legR(64, -96, -30), ...legL(30, -60, -40), neck: 30, expression: "坚定", tears: 1, lookX: -0.2, lookY: -1 }, (l) => UPB(l, 150)),
  /** 离了地往上冲：腿软软地垂着，远处那只手伸上去够她 */
  飞: pose(-8, { face: -0.7, ground: false, float: 0.3, ...legR(8, -22, -50), ...legL(-6, -18, -54), neck: 32, expression: "坚定", tears: 1, lookX: -0.3, lookY: -1 }, (l) => UPB(l, 165)),
  /** 被抓住远处那只脚踝：那条腿被拽直，近处那条蜷起来，低头一看，一惊 */
  被拽: pose(-4, { face: -0.7, ground: false, float: 0.2, ...legR(2, -2, -30), ...legL(24, -56, -40), neck: -22, expression: "吓一跳", tears: 1, lookX: 0.2, lookY: 0.9 }, (l) => UPB(l, 150)),
  /** 仰起头接着往上挣（被抓住的那条腿还直着） */
  挣: pose(-6, { face: -0.7, ground: false, float: 0.2, ...legR(2, -2, -30), ...legL(18, -40, -44), neck: 30, expression: "坚定", tears: 1, lookX: -0.3, lookY: -1 }, (l) => UPB(l, 168)),
  /** 低头看见街上的人一个个抓上来：哭着笑 */
  看人: pose(-6, { face: -0.7, ground: false, float: 0.2, ...legR(2, -2, -30), ...legL(18, -40, -44), neck: -24, expression: "哭着笑", tears: 1, lookX: 0.1, lookY: 0.9 }, (l) => UPB(l, 150)),
  /** 两只手把砖举过头顶朝着她（「活下去」朝外） */
  举砖: pose(-6, { face: -0.7, ground: false, float: 0.2, ...legR(2, -2, -30), ...legL(18, -40, -44), neck: 30, expression: "坚定", tears: 1, lookX: -0.3, lookY: -1 }, RAISED),
  /** 到了她跟前：递给她，哭着笑 */
  递: pose(-6, { face: -0.7, ground: false, float: 0.2, ...legR(2, -2, -30), ...legL(18, -40, -44), neck: 30, expression: "哭着笑", tears: 1, lookX: -0.3, lookY: -1 }, RAISED),
  /** 交出去以后两只手还朝她伸着 */
  伸: pose(-6, { face: -0.7, ground: false, float: 0.2, ...legR(2, -2, -30), ...legL(18, -40, -44), neck: 28, expression: "哭着笑", tears: 1, lookX: -0.3, lookY: -1 }, (l) => ({
    ...armL(150, 30, 0, "open", l),
    ...armR(140, 30, 0, "open", l),
  })),
  /** 被她抱住：两只手搂着她，闭着眼哭着笑 */
  被抱2: pose(4, { face: -0.7, ground: false, float: 0.1, ...legR(6, -20, -40), ...legL(-4, -16, -40), neck: 8, expression: "哭着笑", tears: 1, blink: 0.85, lookX: -0.3, lookY: 0 }, (l) => ({
    ...armL(70, 80, 0, "open", l),
    ...armR(64, 90, 0, "open", l),
  })),
  /** 落回街上站着，仰头看着她，哭着笑 */
  站: pose(-4, { face: -0.7, ground: true, lift: 0, float: 0, ...legR(6, -6), ...legL(-4, -2), neck: 22, expression: "哭着笑", tears: 1, lookX: -0.3, lookY: -0.8 }, (l) => ({
    ...armL(10, 20, 0, "relax", l),
    ...armR(14, 24, 0, "relax", l),
  })),
  /** 弯腰捡起他妈妈的外套 */
  弯腰: pose(60, { face: 0.7, ground: true, lift: 0, float: 0, ...legR(30, -50), ...legL(-6, -20), neck: -10, expression: "含泪", tears: 1, lookX: 0, lookY: 0.8 }, (l) => ({
    ...armL(-10, 10, 0, "grip", l),
    ...armR(0, 10, 0, "grip", l),
  })),
  /** 把外套披到她肩上：两只手举着外套的领子 */
  披: pose(-6, { face: -0.7, ground: true, lift: 0, float: 0, ...legR(6, -6), ...legL(-4, -2), neck: 18, expression: "哭着笑", tears: 1, lookX: -0.3, lookY: -0.6 }, (l) => ({
    ...armL(140, 30, 0, "grip", l),
    ...armR(130, 34, 0, "grip", l),
  })),
  /** 高处被大家拽着：抱着砖，被攥着的那条腿拽直，随风晃，低头看着下面的人，哭着笑 */
  高处: pose(-4, { face: -0.7, ground: false, float: 0.3, ...legR(2, -2, -30), ...legL(18, -40, -44), neck: -12, expression: "哭着笑", tears: 1, lookX: 0.2, lookY: 0.7 }, HUGB),
  /** 抱着砖仰头找她 */
  高处仰: pose(-6, { face: -0.7, ground: false, float: 0.3, ...legR(2, -2, -30), ...legL(18, -40, -44), neck: 28, expression: "含泪", tears: 1, lookX: -0.4, lookY: -1 }, HUGB),
  /** 落回街上，被放下来：站着，仰头看她 */
  站看: pose(-2, { face: -0.7, ground: true, lift: 0, float: 0, ...legR(6, -6), ...legL(-4, -2), neck: 16, expression: "哭着笑", tears: 1, lookX: -0.3, lookY: -0.6 }, HUGB),
  /** 站在她旁边，牵着她的手 */
  牵: pose(0, { face: 0.6, ground: true, lift: 0, float: 0, ...legR(6, -6), ...legL(-4, -2), neck: 6, expression: "微笑", smile: 0.6, tears: 1, lookX: 0.3, lookY: 0 }, (l) => ({
    ...armL(10, 20, 0, "relax", l),
    ...armR(30, 20, 0, "grip", l),
  })),
};

// ——————————————— 老钟 ———————————————
export const ZHONG = {
  /** 端着茶杯站在窗后（被跺地那一下引到窗口），往外看 */
  窗后: pose(4, { face: -0.6, ...legR(6, -6), ...legL(-4, -2), neck: 2, expression: "担心", lookX: -0.6, lookY: 0.2 }, (l) => ({ ...armL(10, 90, -10, "grip", l), ...armR(4, 20, 0, "relax", l) })),
  /** 低头看见窗外坑里的他，穿着她的铁靴 */
  看: pose(10, { face: -0.6, ...legR(6, -6), ...legL(-4, -2), neck: -18, expression: "吓一跳", lookX: -0.6, lookY: 0.9 }, (l) => ({ ...armL(10, 80, -10, "grip", l), ...armR(4, 20, 0, "relax", l) })),
  /** 明白过来：没有她（脸色变了） */
  懂: pose(8, { face: -0.6, ...legR(6, -6), ...legL(-4, -2), neck: -14, expression: "难过", sad: 1, open: 0.2, lookX: -0.6, lookY: 0.8 }, (l) => ({ ...armL(4, 50, 0, "grip", l), ...armR(4, 20, 0, "relax", l) })),
  /** 顺着他的目光慢慢抬头看天 */
  仰: pose(-2, { face: -0.6, ...legR(6, -6), ...legL(-4, -2), neck: 28, expression: "难过", sad: 1, lookX: -0.3, lookY: -1 }, (l) => ({ ...armL(4, 40, 0, "grip", l), ...armR(4, 20, 0, "relax", l) })),
  /** 两只手推开窗 */
  推: pose(16, { face: -0.6, ...legR(6, -6), ...legL(-4, -2), neck: 14, expression: "吓一跳", lookX: -0.8, lookY: -0.5 }, (l) => ({ ...armL(84, 20, 0, "open", l), ...armR(78, 24, 0, "open", l) })),
  /** 探出窗口：身子往左探出去，两只手攥住他的脚踝 */
  扑: pose(50, { face: -0.6, ...legR(10, -8), ...legL(-14, -6), neck: 34, expression: "使劲", teeth: 0.4, lookX: -0.3, lookY: -1 }, (l) => ({ ...armL(120, 20, 0, "grip", l), ...armR(140, 10, 0, "grip", l) })),
  /** 死死攥着，被他往上拽：身子绷直，咬着牙 */
  拽: pose(30, { face: -0.6, ...legR(10, -8, -20), ...legL(-14, -6, -20), neck: 34, expression: "使劲", teeth: 0.8, lookX: -0.3, lookY: -1 }, (l) => ({ ...armL(150, 6, 0, "grip", l), ...armR(160, 6, 0, "grip", l) })),
};

// ——————————————— 人链里的人（f：朝向，正数朝右） ———————————————
/** 跑的一步：身子前压，上臂前后摆，肘弯着 */
export const STRIDE = (f: number, a: boolean, run = true): Angles => {
  const k = a ? 1 : -1;
  const lean = run ? 16 : 4;
  return pose(lean, { face: f, ground: false, ...legR(k * (run ? 38 : 22), run ? -40 : -14, 0), ...legL(-k * (run ? 32 : 18), run ? -50 : -22, 0), neck: run ? 14 : 8, expression: "坚定", lookY: -0.6 }, (l) => ({
    ...armL(-k * (run ? 46 : 20), run ? 80 : 20, 0, run ? "fist" : "relax", l),
    ...armR(k * (run ? 46 : 20), run ? 80 : 20, 0, run ? "fist" : "relax", l),
  }));
};
/** 站在街上第一次抬头看天：吓一跳 */
export const LOOKUP = (f: number, point: boolean): Angles =>
  pose(-4, { face: f, ground: false, ...legR(6, -6), ...legL(-4, -2), neck: 30, expression: "吓一跳", lookX: 0, lookY: -1 }, (l) => ({
    ...armL(10, 20, 0, "relax", l),
    ...(point ? armR(150, 10, 0, "point", l) : armR(14, 24, 0, "relax", l)),
  }));
/** 蹲下攒劲（拉满的弓） */
export const CROUCH = (f: number): Angles =>
  pose(30, { face: f, ground: false, ...legR(70, -110, 0), ...legL(40, -100, 0), neck: 30, expression: "坚定", lookY: -1 }, (l) => ({
    ...armL(-40, 30, 0, "fist", l),
    ...armR(-30, 30, 0, "fist", l),
  }));
/** 跳起来，两只手往上够 */
export const LEAP = (f: number): Angles =>
  pose(-4, { face: f, ground: false, ...legR(-6, -10, -40), ...legL(-14, -30, -40), neck: 32, expression: "使劲", teeth: 0.4, lookY: -1 }, (l) => ({
    ...armL(172, 4, 0, "open", l),
    ...armR(168, 6, 0, "open", l),
  }));
/** 吊着：两只手攥着上面那个人的脚踝，腿悬着，仰着头 */
export const HANG = (f: number, k: number): Angles =>
  pose(-2, {
    face: f,
    ground: false,
    float: 0.1,
    ...legR(6 + 4 * Math.sin(k * 1.7), -20 - 8 * Math.cos(k), -40),
    ...legL(-8 + 3 * Math.sin(k * 2.3), -14 - 6 * Math.sin(k), -44),
    neck: 26,
    expression: k % 3 === 0 ? "使劲" : k % 3 === 1 ? "哭着笑" : "坚定",
    tears: k % 3 === 1 ? 1 : 0,
    lookY: -1,
  }, (l) => ({ ...armL(176, 4, 0, "grip", l), ...armR(170, 6, 0, "grip", l) }));
/** 下面的人抓住了自己的脚踝：那条腿被拽直，另一条蜷一点 */
export const PULLED = (f: number, k: number): Angles => ({ ...HANG(f, k), ...legR(2, -2, -30), ...legL(20, -50, -40) });
/** 最后一个人：站在街上不离地，两腿蹬开、身子往后坐，两只手举着攥住上面那个人的脚踝（人链钉在地上的那一点） */
export const ANCHOR = (f: number): Angles =>
  pose(-34, { face: f, ground: true, lift: 0, float: 0, ...legR(72, -104), ...legL(-14, -66), neck: 30, expression: "使劲", teeth: 0.8, lookY: -1 }, (l) => ({
    ...armL(100, 8, 0, "grip", l),
    ...armR(94, 10, 0, "grip", l),
  }));
/** 松了手往下飘：两只手张开，像落叶，仰着头看她，哭着笑 */
export const DRIFT = (f: number, k: number): Angles =>
  pose(-4, { face: f, ground: false, float: 0.35, ...legR(10, -30, -40), ...legL(-10, -24, -40), neck: 20, expression: "哭着笑", tears: 1, lookX: k % 2 ? 0.3 : -0.3, lookY: -0.8 }, (l) => ({
    ...armL(120, 30, 0, "open", l),
    ...armR(100, 30, 0, "open", l),
  }));
/** 落回街上站着，看着她，哭着笑 */
export const WATCH = (f: number, lx = 0): Angles =>
  pose(-2, { face: f, ground: false, ...legR(6, -6), ...legL(-4, -2), neck: 6, expression: "哭着笑", tears: 1, lookX: lx, lookY: 0.1 }, (l) => ({
    ...armL(8, 24, 0, "relax", l),
    ...armR(10, 26, 0, "relax", l),
  }));
/** 走过来把远处那只手放在她肩上（IK） */
export const TOUCH = (f: number, lx = 0): Angles => ({ ...WATCH(f, lx), ...armR(96, 30, 0, "open", 0) });
