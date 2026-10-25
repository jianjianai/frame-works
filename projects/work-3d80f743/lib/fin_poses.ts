// 1:35.5 起重做那一段（lib/fin_t.ts）的姿势：全部按关节角度写（用户 2026-10-18：不用素材库的动作预设）。
// 手臂按画面里的方向写（armL / armR 自动加上 lean）；腿按「脚对地面的角度」写。朝左写，face > 0 的人整套镜像。
// 她（沉沉）朝右（face 1）：从左上方她的窗口扑下来抱住右边的他；他（小石头）朝左（face −0.7）。

import type { Angles } from "@materials/剪纸角色/code/chengtuo";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";

// ——————————————— 她 ———————————————
export const HER = {
  /** 扑出窗口：身子往前一探，两只手往前伸（四③那一下） */
  扑: pose(40, { face: 1, ground: false, rot: -50, ...legL(-46, -8, -40), ...legR(34, -60, -20), neck: 26, expression: "使劲", teeth: 0.5, lookX: -0.4, lookY: 0.6 }, (l) => ({
    ...armL(118, 10, 0, "open", l),
    ...armR(108, 14, 0, "open", l),
  })),
  /** 头朝下往下冲：两只手往下伸着够他（举过头顶就是朝下），腿在上面，咬着牙盯着他 */
  冲: pose(0, { face: 1, ground: false, rot: 165, ...legL(-14, -26, -20), ...legR(18, -40, -20), neck: 18, expression: "使劲", teeth: 0.6, lookX: 0, lookY: -0.8 }, (l) => ({
    ...armL(165, 10, 0, "open", l),
    ...armR(155, 14, 0, "open", l),
  })),
  /** 一把抱住：身子甩过来，两只手臂环在他身上（IK），腿还在后面 */
  抱: pose(18, { face: 1, ground: false, rot: -25, chestL: "over", ...legL(-20, -50, -30), ...legR(30, -80, -20), neck: -6, expression: "使劲", teeth: 0.4, lookX: 0.3, lookY: 0.4 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(14, 70, 0, "grip", l),
  })),
  /** 抱着他往下坠：身子直过来，两条腿并着往下伸，低头看着越来越近的街面 */
  抱坠: pose(6, { face: 1, ground: false, rot: -4, chestL: "over", ...legL(-6, -16, -40), ...legR(8, -22, -40), neck: -24, expression: "惊", tears: 0, lookX: 0.2, lookY: 1 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(14, 70, 0, "grip", l),
  })),
  /** 快到地面：两只脚使劲往下够石板（腿伸直、脚尖往下） */
  够地: pose(2, { face: 1, ground: false, rot: 0, chestL: "over", ...legL(-4, -2, -70), ...legR(6, -2, -66), neck: -30, expression: "使劲", teeth: 0.5, lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(14, 70, 0, "grip", l),
  })),
  /** 又飘起来了：抱着他，看着他（心疼），含着泪 */
  抱升: pose(4, { face: 1, ground: false, rot: 0, chestL: "over", ...legL(-6, -18, -40), ...legR(10, -26, -40), neck: -18, expression: "心疼", tears: 1, lookX: 0.5, lookY: 0.6 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(14, 70, 0, "grip", l),
  })),
  /** 看看自己的铁靴：低下头，定下心来 */
  看靴: pose(10, { face: 1, ground: false, rot: 0, chestL: "over", ...legL(-6, -18, -40), ...legR(10, -26, -40), neck: -34, expression: "坚定", tears: 1, lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(14, 70, 0, "grip", l),
  })),
  /** 拔远处那只（R）：膝盖抬起来，远处那只手（IK）攥住靴口往下拽；近处那只还搂着他 */
  拔R: pose(6, { face: 1, ground: false, rot: 0, chestL: "over", ...legL(-6, -18, -40), ...legR(76, -112, -30), neck: -36, expression: "坚定", tears: 1, lookX: 0.2, lookY: 1 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(40, 30, 0, "grip", l),
  })),
  /** 拔近处那只（L）：近处那条腿抬起来，远处那只手伸过去攥住它的靴口 */
  拔L: pose(6, { face: 1, ground: false, rot: 0, chestL: "over", ...legL(72, -108, -30), ...legR(4, -20, -40), neck: -36, expression: "坚定", tears: 1, lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(40, 30, 0, "grip", l),
  })),
  /** 光着脚抱着他（两只铁靴都给了他） */
  光脚抱: pose(6, { face: 1, ground: false, rot: 0, chestL: "over", ...legL(-6, -20, -46), ...legR(10, -28, -46), neck: -26, expression: "心疼", tears: 1, lookX: 0.4, lookY: 0.8 }, (l) => ({
    ...armL(10, 60, 0, "grip", l),
    ...armR(14, 70, 0, "grip", l),
  })),
  /** 松手：光着脚一下子轻了，两只手张着朝下伸向他，低头冲他笑（含着泪） */
  放: pose(-4, { face: 1, ground: false, rot: 8, float: 0.5, ...legL(-8, -20, -40), ...legR(10, -34, -40), neck: -28, expression: "微笑", smile: 0.6, tears: 1, lookX: 0.2, lookY: 1 }, (l) => ({
    ...armL(28, 6, 0, "open", l),
    ...armR(18, 20, 0, "open", l),
  })),
  /** 往上升：身子往后仰一点（头朝上、光脚朝着下面的他），两只手往下张着，一直低头看着他 */
  升: pose(-6, { face: 1, ground: false, rot: 12, float: 0.55, ...legL(-10, -24, -44), ...legR(8, -38, -44), neck: -24, expression: "微笑", smile: 0.5, tears: 1, lookX: -0.1, lookY: 1 }, (l) => ({
    ...armL(-20, 16, 0, "open", l),
    ...armR(30, 22, 0, "open", l),
  })),
  /** 在网里低头冲他笑了一下（头发漾着） */
  笑: pose(-4, { face: 1, ground: false, rot: 8, float: 0.6, ...legL(-10, -24, -44), ...legR(8, -38, -44), neck: -34, expression: "微笑", smile: 0.85, tears: 1, lookX: -0.2, lookY: 1 }, (l) => ({
    ...armL(-28, 20, 0, "open", l),
    ...armR(36, 24, 0, "open", l),
  })),
  /** 仰起脸朝着白，两只手举起来（释然） */
  仰: pose(-4, { face: 1, ground: false, rot: 12, float: 0.6, ...legL(-8, -20, -40), ...legR(10, -34, -40), neck: 24, expression: "释然", smile: 0.6, tears: 1, lookX: 0, lookY: -1 }, (l) => ({
    ...armL(126, 26, 0, "open", l),
    ...armR(112, 24, 0, "open", l),
  })),
  /** 白的边上：身子转过来一点，两只手朝两边张开，闭着眼含泪笑（和开场光里的女人一个样子） */
  开: pose(-4, { face: 0.25, ground: false, rot: 4, float: 0.6, ...legL(-8, -20, -40), ...legR(10, -34, -40), neck: 16, expression: "释然", smile: 0.55, tears: 1, lookX: 0, lookY: -0.5 }, () => ({
    ...armL(-70, 20, 0, "open", -4),
    ...armR(118, 18, 0, "open", -4),
  })),
  /** 白里的妈妈朝她张开手：她把远处那只手伸过去（闭着眼） */
  伸: pose(-6, { face: 0.25, ground: false, rot: 4, float: 0.6, ...legL(-8, -20, -40), ...legR(10, -34, -40), neck: 24, expression: "释然", smile: 0.5, tears: 1, lookX: 0, lookY: -0.8 }, () => ({
    ...armL(-60, 24, 0, "open", -6),
    ...armR(160, 8, 0, "open", -6),
  })),
};

// ——————————————— 他 ———————————————
/** 他的手臂举过头顶捏着砖的两头（手由 IK 放在砖的两头） */
const RAISED = (l: number): Angles => ({ shoulderL: 165 + l, elbowL: 20, wristL: 0, handL: "grip", shoulderR: 165 + l, elbowR: 20, wristR: 0, handR: "grip" });
export const KID = {
  /** 光着脚的（脱了外套）踮着脚，把「妈妈，明天见」举过头顶朝着白，仰着头哭 */
  踮: pose(-6, { face: -0.7, ...legR(4, -4, -34), ...legL(-4, -4, -34), neck: 32, expression: "仰望", tears: 1, sad: 0.6, lookX: -0.2, lookY: -1 }, RAISED),
  /** 离了地：没了分量，腿软软地垂着，两只手还举着砖 */
  飘: pose(-6, { face: -0.7, ground: false, float: 0.3, ...legR(8, -22, -50), ...legL(-6, -18, -54), neck: 32, expression: "仰望", tears: 1, sad: 0.5, lookX: -0.2, lookY: -1 }, RAISED),
  /** 看见她扑下来：一惊，把砖收到胸前两只手抱着，仰头看着她 */
  惊: pose(-6, { face: -0.7, ground: false, float: 0.3, ...legR(8, -22, -50), ...legL(-6, -18, -54), neck: 26, expression: "吓一跳", tears: 1, lookX: -0.3, lookY: -1 }, (l) => ({
    ...armL(40, 100, 0, "grip", l),
    ...armR(40, 100, 0, "grip", l),
  })),
  /** 被她抱着：砖抱在胸前，含着泪仰头看着她 */
  被抱: pose(-4, { face: -0.7, ground: false, float: 0.2, ...legR(8, -24, -50), ...legL(-6, -18, -54), neck: 22, expression: "含泪", tears: 1, lookX: -0.5, lookY: -0.6 }, (l) => ({
    ...armL(40, 100, 0, "grip", l),
    ...armR(40, 100, 0, "grip", l),
  })),
  /** 她看自己的铁靴、一只一只拔下来：他看着她，不明白（担心，含着泪） */
  看她: pose(-4, { face: -0.7, ground: false, float: 0.2, ...legR(8, -24, -50), ...legL(-6, -18, -54), neck: 18, expression: "担心", tears: 1, lookX: -0.5, lookY: -0.7 }, (l) => ({
    ...armL(40, 100, 0, "grip", l),
    ...armR(40, 100, 0, "grip", l),
  })),
  /** 快到地面：低头看着底下妈妈那件外套、街面（差一点） */
  看地: pose(-2, { face: -0.7, ground: false, float: 0.15, ...legR(10, -14, -60), ...legL(-4, -10, -60), neck: -24, expression: "含泪", tears: 1, lookX: -0.1, lookY: 1 }, (l) => ({
    ...armL(40, 100, 0, "grip", l),
    ...armR(40, 100, 0, "grip", l),
  })),
  /** 铁靴套上去：那条腿被坠直 */
  套: pose(-4, { face: -0.7, ground: false, float: 0.1, ...legR(4, -6, 0), ...legL(-4, -6, 0), neck: -18, expression: "含泪", tears: 1, lookX: 0.3, lookY: 0.7 }, (l) => ({
    ...armL(40, 100, 0, "grip", l),
    ...armR(40, 100, 0, "grip", l),
  })),
  /** 铁靴一沉往下坠：近处那只手把砖抱在胸前，远处那只往上伸着够她，哭着仰头看她 */
  坠: pose(-4, { face: -0.7, ground: false, ...legR(4, -6, 0), ...legL(-4, -6, 0), neck: 28, expression: "含泪", tears: 1, sad: 1, lookX: -0.2, lookY: -1 }, (l) => ({
    ...armL(40, 100, 0, "grip", l),
    ...armR(165, 10, 0, "open", l),
  })),
  /** 穿着她的铁靴站在街上，仰着头，远处那只手还往上伸着 */
  站仰: pose(-4, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: 32, expression: "仰望", tears: 1, sad: 0.7, lookX: -0.1, lookY: -1 }, (l) => ({
    ...armL(40, 100, 0, "grip", l),
    ...armR(120, 20, 0, "open", l),
  })),
  /** 低头看见靴尖旁边那块砖 */
  看砖: pose(-2, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: -28, expression: "含泪", tears: 1, sad: 0.6, lookX: -0.4, lookY: 1 }, (l) => ({
    ...armL(30, 90, 0, "grip", l),
    ...armR(20, 24, 0, "open", l),
  })),
  /** 腿在铁靴里直着，只能从腰那儿笨笨地折下去够地上的砖（两只手 IK 到砖的两头） */
  弯腰: pose(78, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: -10, expression: "含泪", tears: 1, sad: 0.6, lookX: -0.3, lookY: 0.7 }, (l) => ({
    ...armL(-4, 10, 0, "grip", l),
    ...armR(0, 8, 0, "grip", l),
  })),
  /** 直起身，两只手捧着砖举到脸前面看（她的字） */
  读: pose(-2, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: -24, expression: "含泪", tears: 1, sad: 1, wobble: 0.6, smile: -0.3, lookX: -0.45, lookY: 0.75 }, (l) => ({
    ...armL(50, 100, 0, "grip", l),
    ...armR(50, 100, 0, "grip", l),
  })),
  /** 把她的砖抱在胸口，仰头看她 */
  抱砖仰: pose(-4, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: 32, expression: "仰望", tears: 1, sad: 0.8, lookX: -0.1, lookY: -1 }, (l) => ({
    ...armL(36, 110, 0, "grip", l),
    ...armR(40, 110, 0, "grip", l),
  })),
  /** 和十二年前七岁的她一样：近处那只手抱着砖，远处那只手伸上去够，哭着喊她 */
  够她: pose(-6, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: 34, expression: "仰望", tears: 1, sad: 0.9, open: 0.3, lookX: -0.2, lookY: -1 }, (l) => ({
    ...armL(36, 110, 0, "grip", l),
    ...armR(160, 16, 0, "open", l),
  })),
};

// ——————————————— 四声「活下去」+ 尾奏（scenes/act9.ts） ———————————————
/** 他：抱着她的砖（两只手），站在她的铁靴里 */
const HUGB = (l: number): Angles => ({ ...armL(36, 110, 0, "grip", l), ...armR(40, 110, 0, "grip", l) });
/** 他：近处那只手把她的砖抱在胸口，远处那只伸上去（张开） */
const UPB = (l: number, up = 160): Angles => ({ ...armL(36, 110, 0, "grip", l), ...armR(up, 14, 0, "open", l) });
export const KID9 = {
  /** 抱着她的砖低头看着脚上她的铁靴，咬住嘴唇 */
  定: pose(-2, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: -22, expression: "坚定", tears: 1, lookX: -0.1, lookY: 0.9 }, HUGB),
  /** 抬起远处那只铁靴：铁靴硬、高到大腿，大腿抬平、小腿竖着，身子往后仰着压住 */
  抬靴: pose(-10, { face: -0.7, ground: false, ...legR(88, -88, 0), ...legL(-6, -4, 0), neck: -18, expression: "坚定", tears: 1, teeth: 0.5, lookX: -0.2, lookY: 0.8 }, HUGB),
  /** 跺下去：腿砸直，身子跟着往前一压 */
  跺: pose(8, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: -22, expression: "使劲", tears: 1, lookX: -0.2, lookY: 0.9 }, HUGB),
  /** 抬头看天：她在那上面 */
  仰: pose(-6, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(-4, -4, 0), neck: 32, expression: "坚定", tears: 1, lookX: -0.2, lookY: -1 }, HUGB),
  /** 一只脚从她的铁靴里抽出来（近处那条：膝盖提起来，脚从靴口里出来） */
  出L: pose(-6, { face: -0.7, ground: false, ...legR(4, -4, 0), ...legL(70, -100, -30), neck: 30, expression: "坚定", tears: 1, lookX: -0.2, lookY: -1 }, (l) => UPB(l, 120)),
  /** 再一只（远处那条） */
  出R: pose(-6, { face: -0.7, ground: false, ...legR(64, -96, -30), ...legL(30, -60, -40), neck: 30, expression: "坚定", tears: 1, lookX: -0.2, lookY: -1 }, (l) => UPB(l, 150)),
  /** 光着脚（红帆布鞋）离了地往上飞：腿软软地垂着，远处那只手伸上去够她 */
  飞: pose(-8, { face: -0.7, ground: false, float: 0.3, ...legR(8, -22, -50), ...legL(-6, -18, -54), neck: 32, expression: "坚定", tears: 1, lookX: -0.3, lookY: -1 }, (l) => UPB(l, 165)),
  /** 被抓住远处那只脚踝：那条腿被拽直，近处那条蜷起来，低头一看，一惊 */
  被拽: pose(-4, { face: -0.7, ground: false, float: 0.2, ...legR(2, -2, -30), ...legL(24, -56, -40), neck: -22, expression: "吓一跳", tears: 1, lookX: 0.2, lookY: 0.9 }, (l) => UPB(l, 150)),
  /** 仰起头接着往上挣（被抓住的那条腿还直着） */
  挣: pose(-6, { face: -0.7, ground: false, float: 0.2, ...legR(2, -2, -30), ...legL(18, -40, -44), neck: 30, expression: "坚定", tears: 1, lookX: -0.3, lookY: -1 }, (l) => UPB(l, 168)),
  /** 低头看见街上的人一个个抓上来：哭着笑 */
  看人: pose(-6, { face: -0.7, ground: false, float: 0.2, ...legR(2, -2, -30), ...legL(18, -40, -44), neck: -24, expression: "哭着笑", tears: 1, lookX: 0.1, lookY: 0.9 }, (l) => UPB(l, 150)),
  /** 抓住她的脚踝（远处那只手 IK），仰头看着她，哭着笑 */
  抓: pose(-6, { face: -0.7, ground: false, float: 0.2, ...legR(2, -2, -30), ...legL(18, -40, -44), neck: 32, expression: "哭着笑", tears: 1, lookX: -0.3, lookY: -1 }, (l) => UPB(l, 170)),
  /** 挂在她手上往下落：仰头看着她 */
  挂: pose(-4, { face: -0.7, ground: false, float: 0.15, ...legR(6, -16, -40), ...legL(10, -30, -44), neck: 30, expression: "哭着笑", tears: 1, lookX: -0.3, lookY: -1 }, (l) => UPB(l, 170)),
  /** 落回街上站着，仰头看着她 */
  站: pose(-4, { face: -0.7, ground: true, lift: 0, float: 0, ...legR(6, -6), ...legL(-4, -2), neck: 26, expression: "哭着笑", tears: 1, lookX: -0.3, lookY: -0.8 }, (l) => UPB(l, 120)),
  /** 在她那块砖的背面写字：近处那只手托着砖，远处那只握着笔，低着头 */
  写: pose(10, { face: -0.7, ground: true, lift: 0, float: 0, ...legR(6, -6), ...legL(-4, -2), neck: -26, expression: "含泪", tears: 1, lookX: -0.1, lookY: 1 }, (l) => ({ ...armL(40, 80, 0, "flat", l), ...armR(40, 70, 0, "grip", l) })),
  /** 写完：抬起头看她，哭着笑 */
  看她: pose(0, { face: -0.7, ground: true, lift: 0, float: 0, ...legR(6, -6), ...legL(-4, -2), neck: 10, expression: "哭着笑", tears: 1, lookX: -0.6, lookY: 0.1 }, (l) => ({ ...armL(30, 80, 0, "relax", l), ...armR(10, 30, 0, "relax", l) })),
  /** 被她抱住：两只手搂着她，闭着眼哭着笑 */
  被抱: pose(4, { face: -0.7, ground: true, lift: 0, float: 0, ...legR(6, -6), ...legL(-4, -2), neck: 8, expression: "哭着笑", tears: 1, blink: 0.85, lookX: -0.3, lookY: 0 }, (l) => ({ ...armL(70, 80, 0, "open", l), ...armR(64, 90, 0, "open", l) })),
  /** 站在她旁边，牵着她的手，看着前面 */
  牵: pose(0, { face: 0.6, ground: true, lift: 0, float: 0, ...legR(6, -6), ...legL(-4, -2), neck: 6, expression: "微笑", smile: 0.6, tears: 1, lookX: 0.3, lookY: 0 }, (l) => ({ ...armL(10, 20, 0, "relax", l), ...armR(30, 20, 0, "grip", l) })),
};
/** 她（白的边上 → 落回街上） */
export const HER9 = {
  /** 睁开眼，低头往下看（一惊） */
  睁眼: pose(-4, { face: 0.3, ground: false, rot: 2, float: 0.6, ...legL(-8, -20, -40), ...legR(10, -34, -40), neck: -24, expression: "惊", tears: 1, lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(-30, 30, 0, "open", l),
    ...armR(40, 40, 0, "open", l),
  })),
  /** 看着底下的人一个个抓上来：含着泪，两只手收到胸前 */
  看: pose(-2, { face: 0.3, ground: false, rot: 0, float: 0.6, ...legL(-8, -20, -40), ...legR(10, -34, -40), neck: -26, expression: "含泪", tears: 1, lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(30, 100, 0, "relax", l),
    ...armR(24, 106, 0, "relax", l),
  })),
  /** 他抓住她的脚踝：一惊，低头看着他 */
  被抓: pose(4, { face: 0.3, ground: false, rot: 0, float: 0.6, ...legL(-8, -20, -40), ...legR(2, -8, -50), neck: -30, expression: "惊", tears: 1, lookX: 0.2, lookY: 1 }, (l) => ({
    ...armL(10, 50, 0, "open", l),
    ...armR(20, 40, 0, "open", l),
  })),
  /** 抬头看白里的妈妈（妈妈放下了手）：含着泪 */
  看妈妈: pose(-4, { face: 0.3, ground: false, rot: 0, float: 0.6, ...legL(-8, -20, -40), ...legR(2, -8, -50), neck: 26, expression: "含泪", tears: 1, lookX: 0, lookY: -1 }, (l) => ({
    ...armL(10, 50, 0, "relax", l),
    ...armR(20, 40, 0, "relax", l),
  })),
  /** 弯下腰，远处那只手伸下去握他的手（IK） */
  弯: pose(30, { face: 0.3, ground: false, rot: 0, float: 0.55, ...legL(-8, -20, -40), ...legR(2, -8, -50), neck: -20, expression: "哭着笑", tears: 1, lookX: 0.2, lookY: 1 }, (l) => ({
    ...armL(10, 50, 0, "relax", l),
    ...armR(0, 20, 0, "grip", l),
  })),
  /** 被拽着往下落：有了分量，头发落下来，握着他的手，低头看着他，哭着笑 */
  落: pose(8, { face: 0.3, ground: false, rot: -4, float: 0.15, ...legL(-6, -20, -30), ...legR(8, -28, -30), neck: -20, expression: "哭着笑", tears: 1, lookX: 0.2, lookY: 0.9 }, (l) => ({
    ...armL(-20, 30, 0, "open", l),
    ...armR(10, 20, 0, "grip", l),
  })),
  /** 光着脚站在街上 */
  站: pose(2, { face: 0.6, ground: true, lift: 0, float: 0, ...legR(6, -6), ...legL(-4, -2), neck: -6, expression: "哭着笑", tears: 1, lookX: 0.3, lookY: 0.4 }, (l) => ({
    ...armL(-6, 20, 0, "relax", l),
    ...armR(10, 20, 0, "grip", l),
  })),
};
/** 她落地以后（尾奏） */
export const HER9B = {
  /** 跪下来（光着脚）：前腿（远处那条）立着，后膝着地；看着他，哭着笑 */
  跪: pose(8, { face: 0.6, ground: true, lift: 0, float: 0, ...legR(96, -98), ...legL(-6, -134, -140), thighR: 0.7, neck: 0, expression: "哭着笑", tears: 1, lookX: 0.5, lookY: 0.1 }, (l) => ({
    ...armL(10, 30, 0, "relax", l),
    ...armR(14, 30, 0, "relax", l),
  })),
  /** 看着他在砖上写字：忍着哭 */
  看写: pose(12, { face: 0.6, ground: true, lift: 0, float: 0, ...legR(96, -98), ...legL(-6, -134, -140), thighR: 0.7, neck: -16, expression: "忍着哭", tears: 1, lookX: 0.4, lookY: 0.6 }, (l) => ({
    ...armL(40, 50, 0, "flat", l),
    ...armR(14, 30, 0, "relax", l),
  })),
  /** 砖放进手里：手一沉，低头看着字，哭着笑 */
  捧: pose(14, { face: 0.6, ground: true, lift: 0, float: 0, ...legR(96, -98), ...legL(-6, -134, -140), thighR: 0.7, neck: -22, expression: "哭着笑", tears: 1, lookX: 0.3, lookY: 0.8 }, (l) => ({
    ...armL(40, 50, 0, "flat", l),
    ...armR(14, 30, 0, "relax", l),
  })),
  /** 抱住他：身子往他那边倾过去，远处那只手环在他背上，近处那只把砖按在胸口；闭着眼哭着笑 */
  抱: pose(20, { face: 0.6, ground: true, lift: 0, float: 0, ...legR(96, -98), ...legL(-6, -134, -140), thighR: 0.7, neck: -10, expression: "哭着笑", tears: 1, blink: 0.85, lookX: 0.4, lookY: 0.3 }, (l) => ({
    ...armL(60, 100, 0, "grip", l),
    ...armR(70, 80, 0, "grip", l),
  })),
  /** 站起来：砖抱在胸口，远处那只手牵着他 */
  站: pose(2, { face: 0.6, ground: true, lift: 0, float: 0, ...legR(6, -6), ...legL(-4, -2), thighR: 1, neck: -4, expression: "哭着笑", tears: 1, lookX: 0.5, lookY: 0.1 }, (l) => ({
    ...armL(40, 110, 0, "grip", l),
    ...armR(14, 20, 0, "grip", l),
  })),
};
/** 往前一步：前脚（远处那条）抬起来往前迈，后脚钉在地上 */
export const HER9_STEP_UP = { ...HER9B.站, ...legR(34, -50, 0), ...legL(-12, -8, 0) };
export const HER9_STEP_DOWN = { ...HER9B.站, ...legR(16, -6, 0), ...legL(-18, -8, 0) };
