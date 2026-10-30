// 第二幕（主歌一）里的人的姿势：和 lib/poses.ts 一样全部自己按关节角度写（不用素材库的动作预设），角度约定见 poses.ts 开头：
// 朝左写，face > 0 时整套镜像；四肢 0 = 竖直往下、正 = 往前；手臂按画面里的方向写（armL / armR 自动加上 lean）；
// 腿按「脚对地面的角度」写；远处那条腿（R）在前、近处那条（L）在后。
// 手要抓住会动的东西（哑铃）时，姿势只给大概的样子和肘往哪边拱，手掌由场景里用 IK 放到抓的地方。
// 检查页：sheets/第二幕姿势.ts。

import type { Angles } from "@materials/剪纸角色/code/chengtuo";
import { armL, armR, legL, legR } from "./poses";

function pose(lean: number, rest: Omit<Angles, "lean">, arms: (lean: number) => Angles): Angles {
  return { lean, ...rest, ...arms(lean) };
}

// ——————————————— 千斤的妈妈（紫外套、盘发）：在哑铃店门口抢下最大的那只 ———————————————
// 在店里朝右（face > 0）：展台在她右边。
export const MOM = {
  /** 弯腰伸手够展台上的哑铃：身子往前探，两只手往前下方伸，眼睛盯着它 */
  够: pose(26, { face: 0.85, ...legR(22, -14), ...legL(-14, -8), neck: -6, expression: "使劲", sad: 0.55, teeth: 0.3, lookY: 0.5 }, (l) => ({
    ...armL(62, 18, 10, "grip", l),
    ...armR(70, 14, 8, "grip", l),
  })),
  /** 两只手攥住把手往回拽：身子往后仰，前脚蹬住、重心压在后脚上 */
  拽: pose(-10, { face: 0.85, ...legR(30, -6, 8), ...legL(-18, -34, -10), neck: 4, expression: "使劲", sad: 0.5, teeth: 0.8, lookX: 0.4, lookY: 0.2 }, (l) => ({
    ...armL(84, 8, 0, "grip", l),
    ...armR(88, 6, 0, "grip", l),
  })),
  /** 夺回来：一把抱到胸口，往后退半步，身子仰着、两只胳膊收紧 */
  夺: pose(-16, { face: 0.85, ...legR(24, -10, 6), ...legL(-24, -28, -14), neck: -2, expression: "使劲", teeth: 0.4, lookX: 0.5, lookY: 0.3 }, (l) => ({
    ...armL(34, 96, 0, "grip", l),
    ...armR(40, 92, 0, "grip", l),
  })),
  /** 抱着：被压得弯下腰，两只胳膊箍在哑铃上，膝盖微弯，低着头，咬着嘴唇忍着哭 */
  抱着: pose(18, { face: 0.85, ...legR(16, -22), ...legL(-10, -18), neck: -16, expression: "忍着哭", lookY: 0.6 }, (l) => ({
    ...armL(22, 98, 0, "grip", l),
    ...armR(30, 92, 0, "grip", l),
  })),
};

// ——————————————— 和她抢的男人（排在队头的路人）：朝左 ———————————————
export const RIVAL = {
  /** 从队里探身出来，伸手抓住另一头的铁饼 */
  够: pose(24, { face: -0.85, ...legR(20, -12), ...legL(-14, -8), neck: -6, expression: "使劲", sad: 0.4, lookY: 0.4 }, (l) => ({
    ...armL(64, 16, 8, "grip", l),
    ...armR(72, 12, 6, "grip", l),
  })),
  /** 往回拽 */
  拽: pose(-8, { face: -0.85, ...legR(28, -6, 8), ...legL(-18, -32, -10), neck: 2, expression: "使劲", teeth: 0.6, lookX: -0.3 }, (l) => ({
    ...armL(82, 8, 0, "grip", l),
    ...armR(86, 6, 0, "grip", l),
  })),
  /** 被夺走：手一下脱开，往后踉跄，两只手还张着停在半空 */
  脱手: pose(-14, { face: -0.85, ...legR(26, -8, 6), ...legL(-26, -26, -16), neck: 6, expression: "吓一跳", lookX: -0.5, lookY: 0.2 }, (l) => ({
    ...armL(58, 30, 10, "open", l),
    ...armR(66, 24, 8, "open", l),
  })),
  /** 两手空空：手垂下来，低下头 */
  低头: pose(6, { face: -0.85, ...legR(10, -8), ...legL(-10, -6), neck: -26, expression: "难过", lookY: 1 }, (l) => ({
    ...armL(6, 22, 6, "relax", l),
    ...armR(10, 24, 0, "relax", l),
  })),
};

// ——————————————— 排队的人：低着头站着，等着进店（朝左） ———————————————
export const QUEUE = {
  站: pose(7, { face: -0.85, ...legR(6, -8), ...legL(-6, -4), neck: -24, expression: "低头看", sad: 0.35, lookY: 1 }, (l) => ({
    ...armL(-4, 18, 6, "relax", l),
    ...armR(6, 20, 0, "relax", l),
  })),
  /** 两只手各拎一只哑铃，被坠得肩膀往下、胳膊伸直 */
  拎着: pose(9, { face: -0.85, ...legR(6, -10), ...legL(-6, -6), neck: -22, expression: "低头看", sad: 0.4, lookY: 1 }, (l) => ({
    ...armL(-2, 4, 0, "grip", l),
    ...armR(4, 4, 0, "grip", l),
  })),
};

// ——————————————— 千斤家门口：妈妈抱着哑铃回到家，放在铁桩旁边，抬头看着飘在半空的女儿 ———————————————
// 朝右（和哑铃店最后一帧同一个朝向：同一只哑铃溶过来，人也是同一个样子）。
export const MOM_HOME = {
  /** 弯腰把哑铃放到地上：膝盖弯下去、身子往前压，两只手还箍着它 */
  放下: pose(44, { face: 0.85, ...legR(40, -64), ...legL(-6, -56, -12), neck: -10, expression: "使劲", sad: 0.5, teeth: 0.5, lookY: 0.8 }, (l) => ({
    ...armL(-10, 40, 0, "grip", l),
    ...armR(-4, 36, 0, "grip", l),
  })),
  /** 直起腰：一只手撑着后腰（那么沉的东西抱了一路），喘口气 */
  直腰: pose(-4, { face: 0.85, ...legR(10, -8), ...legL(-8, -6), neck: 4, expression: "难过", sad: 0.7, lookY: 0.2 }, (l) => ({
    ...armL(-30, 70, 20, "open", l),
    ...armR(8, 20, 0, "relax", l),
  })),
  /** 抬头看着女儿：手垂着，眼睛红红的 */
  仰头: pose(-6, { face: 0.85, ...legR(10, -8), ...legL(-8, -6), neck: 34, expression: "心疼", sad: 0.9, smile: -0.2, lookX: 0.2, lookY: -1 }, (l) => ({
    ...armL(-6, 18, 6, "relax", l),
    ...armR(6, 22, 0, "relax", l),
  })),
  /** 两只手攥住红线（往右上方伸过去够住），准备往下拽；仰着头盯着女儿（手的位置由 IK 放到线上） */
  拽上: pose(-6, { face: 0.85, ...legR(18, -10, 6), ...legL(-16, -12, -8), neck: 26, expression: "使劲", sad: 0.6, teeth: 0.4, lookX: 0.3, lookY: -0.9 }, (l) => ({
    ...armL(110, 20, 0, "grip", l),
    ...armR(120, 16, 0, "grip", l),
  })),
  /** 一把拽下来：身子往后一坐、膝盖一沉，两只手拽到胯边 */
  拽下: pose(-14, { face: 0.85, ...legR(30, -34, 6), ...legL(-14, -40, -12), neck: 14, expression: "使劲", sad: 0.6, teeth: 0.8, lookX: 0.3, lookY: -0.7 }, (l) => ({
    ...armL(30, 60, 0, "grip", l),
    ...armR(40, 54, 0, "grip", l),
  })),
  /** 近处的手攥着红线不松，弯腰用远处的手从哑铃上抓起铁链的一头 */
  抓链: pose(30, { face: 0.85, ...legR(30, -40), ...legL(-10, -34, -10), neck: -6, expression: "难过", sad: 0.8, lookX: 0.2, lookY: 0.7 }, (l) => ({
    ...armL(10, 50, 0, "grip", l),
    ...armR(50, 20, 0, "grip", l),
  })),
  /** ④ 松开红线和铁链：两只手垂下来，低下头 */
  松手: pose(4, { face: 0.85, ...legR(12, -8), ...legL(-10, -6), neck: -14, expression: "难过", sad: 1, smile: -0.4, lookY: 0.9 }, (l) => ({
    ...armL(-4, 16, 6, "relax", l),
    ...armR(4, 18, 0, "relax", l),
  })),
  /** 转身往门里走（朝左）：低着头，不回头。迈 = 远处的腿在前，迈2 = 近处的腿在前；过 = 后腿收过来 */
  走迈: pose(9, { face: -0.85, ...legR(22, -8, 4), ...legL(-18, -12, -8), neck: -20, expression: "难过", sad: 1, lookY: 0.8 }, (l) => ({
    ...armL(14, 20, 6, "relax", l),
    ...armR(-12, 22, 0, "relax", l),
  })),
  走过: pose(8, { face: -0.85, ...legR(-4, -6), ...legL(10, -36, -10), neck: -22, expression: "难过", sad: 1, lookY: 0.8 }, (l) => ({
    ...armL(2, 18, 6, "relax", l),
    ...armR(0, 20, 0, "relax", l),
  })),
  走迈2: pose(9, { face: -0.85, ...legL(22, -8, 4), ...legR(-18, -12, -8), neck: -22, expression: "难过", sad: 1, lookY: 0.8 }, (l) => ({
    ...armL(-12, 22, 6, "relax", l),
    ...armR(14, 20, 0, "relax", l),
  })),
  走过2: pose(8, { face: -0.85, ...legL(-4, -6), ...legR(10, -36, -10), neck: -24, expression: "难过", sad: 1, lookY: 0.8 }, (l) => ({
    ...armL(0, 18, 6, "relax", l),
    ...armR(2, 20, 0, "relax", l),
  })),
  /** 直起身，远处的手把铁链举到女儿的脚踝上扣上锁；仰着头，眼睛红红的、嘴抿着 */
  锁: pose(-6, { face: 0.85, ...legR(16, -10, 4), ...legL(-14, -10, -8), neck: 30, expression: "难过", sad: 0.9, smile: -0.4, lookX: 0.3, lookY: -0.8 }, (l) => ({
    ...armL(20, 50, 0, "grip", l),
    ...armR(118, 30, 0, "grip", l),
  })),
};

// ——————————————— 千斤（红毛衣、黄发卡、齐肩短发） ———————————————
// 朝左：风往画面右边吹，她被吹得漂在铁桩的右上方，身子朝着家门口（妈妈），眼睛看着天上的白。
// 齐肩短发失重大了、头又低下去或仰得很高时会画成一圈竖起的尖：飘着时失重给 0。
export const QIANJIN = {
  /** 飘在半空，抱着膝盖缩成一团，仰着头看天上的白：近处的手臂从膝盖前面箍过去，远处的手搭在膝盖上
   *  （用户 2026-10-30 在「调整画面」0:19.71 摆的；原来上臂往前举、前臂往下折成倒 V，人做不出来）。
   *  失重给 0：头仰到 60 时失重一给到 0.2，齐肩短发就画成一圈竖起来的虚影尖刺（素材库的毛病）；飘的感觉靠身子和红线 */
  抱膝: pose(14, { face: -0.6, float: 0, ground: false, ...legR(128, -150, -30), ...legL(120, -150, -40), neck: 40, expression: "难过", sad: 0.8, lookX: -0.1, lookY: -1 }, (l) => ({
    ...armL(-6.5, 87, 0, "relax", l),
    ...armR(-38.7, 140, -5, "relax", l),
  })),
  /** 被脚踝上的红线一把拽下去：拴着的那条腿（近处的 L）被扯直，另一条往后蜷（不往前伸：拽到底时会踩到妈妈头上），
   *  两只手被甩到头顶；她不挣，低着头、闭着眼 */
  被拽: pose(-8, { face: -0.6, float: 0, ground: false, rot: 8, ...legL(-8, -6, -44), ...legR(-16, -76, -30), neck: -18, expression: "闭眼", sad: 0.95, smile: -0.3 }, (l) => ({
    ...armL(142, 30, 10, "open", l),
    ...armR(162, 22, 10, "open", l),
  })),
  /** 两次拽之间：手慢慢落下来，身子往上漂一点 */
  被拽_漂: pose(-2, { face: -0.6, float: 0, ground: false, rot: 10, ...legL(-6, -8, -44), ...legR(-12, -70, -30), neck: -22, expression: "闭眼", sad: 0.95, smile: -0.3 }, (l) => ({
    ...armL(96, 40, 10, "open", l),
    ...armR(112, 34, 10, "open", l),
  })),
  /** 被锁住以后：悬在脚踝上方，两只手抱着自己，低着头掉眼泪 */
  悬着: pose(6, { face: -0.6, float: 0, ground: false, rot: 16, ...legL(-8, -6, -44), ...legR(-10, -66, -30), neck: -24, expression: "难过", sad: 1, lookY: 0.8 }, (l) => ({
    ...armL(36, 104, 0, "relax", l),
    ...armR(46, 98, 0, "relax", l),
  })),
  /** ④ 看着妈妈松手、转身：一只手捂着嘴，忍着哭 */
  看妈妈: pose(2, { face: -0.6, float: 0, ground: false, rot: 14, ...legL(-8, -6, -44), ...legR(-10, -66, -30), neck: -12, expression: "忍着哭", lookX: -0.9, lookY: 0.6 }, (l) => ({
    ...armL(40, 124, 0, "relax", l),
    ...armR(16, 34, 0, "relax", l),
  })),
  /** 门关上了：伸着的那只手垂下来，另一只还捂着嘴，盯着门 */
  望门: pose(4, { face: -0.6, float: 0, ground: false, rot: 16, ...legL(-8, -6, -44), ...legR(-10, -66, -30), neck: -20, expression: "难过", sad: 1, lookX: -0.9, lookY: 0.6 }, (l) => ({
    ...armL(40, 124, 0, "relax", l),
    ...armR(-6, 14, 0, "relax", l),
  })),
  /** 「火」灯灭了：闭上眼，头垂下去 */
  望门_闭眼: pose(6, { face: -0.6, float: 0, ground: false, rot: 16, ...legL(-8, -6, -44), ...legR(-10, -66, -30), neck: -28, expression: "闭眼", sad: 1, smile: -0.4 }, (l) => ({
    ...armL(34, 112, 0, "relax", l),
    ...armR(-8, 12, 0, "relax", l),
  })),
  /** 往上飘：拴着的那条腿被铁链那头的哑铃坠得笔直，另一条往后蜷，两只手垂着落在后面，闭着眼、头垂着（不挣） */
  吊着飘: pose(-2, { face: -0.6, float: 0, ground: false, rot: 6, ...legL(-2, -4, -46), ...legR(-16, -64, -30), neck: -24, expression: "闭眼", sad: 1, smile: -0.4 }, (l) => ({
    ...armL(-22, 24, 0, "relax", l),
    ...armR(-14, 30, 0, "relax", l),
  })),
  // ——— ⑤「但我还想做些什么」（2026-10-20 改）：红线断了，吊着哑铃慢慢往上飘，睁开眼低头望着家门，近处的手朝门伸下去 ———
  /** 睁开眼，低头望着下面的家门（妈妈在里面），忍着哭；拴着的腿被哑铃坠直 */
  回望: pose(12, { face: -0.6, float: 0, ground: false, rot: 8, ...legL(-2, -4, -46), ...legR(-16, -64, -30), neck: -32, expression: "忍着哭", lookX: -0.5, lookY: 1 }, (l) => ({
    ...armL(-12, 28, 0, "relax", l),
    ...armR(-14, 30, 0, "relax", l),
  })),
  /** 近处的手朝家门伸下去（还想再做点什么），身子往下探 */
  回望_伸手: pose(20, { face: -0.6, float: 0, ground: false, rot: 10, ...legL(-2, -4, -46), ...legR(-16, -64, -30), neck: -28, expression: "忍着哭", lookX: -0.6, lookY: 1 }, (l) => ({
    ...armL(30, 10, -10, "open", l),
    ...armR(-12, 30, 0, "relax", l),
  })),
  // ——— ⑥「其实还想要说很多」高空（2026-10-20 从⑤挪过来）：睁眼 → 拔下发卡 → 蜷起拴着的腿去开锁 → 锁开了，张开手往上飘 ———
  /** 睁开眼，低头盯着脚踝上的锁（不哭了） */
  睁眼看锁: pose(4, { face: -0.6, float: 0, ground: false, rot: 4, ...legL(-2, -4, -46), ...legR(-16, -64, -30), neck: -30, expression: "低头看", sad: 0.35, fierce: 0.45, lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(-18, 26, 0, "relax", l),
    ...armR(-10, 30, 0, "relax", l),
  })),
  /** 近处的手伸到头上拔发卡（手由 IK 放到发卡上），头往那只手偏一点 */
  拔发卡: pose(2, { face: -0.6, float: 0, ground: false, rot: 2, ...legL(-2, -4, -46), ...legR(-16, -64, -30), neck: -18, expression: "低头看", sad: 0.3, fierce: 0.55, lookX: 0.2, lookY: 1 }, (l) => ({
    ...armL(150, 120, 0, "grip", l),
    ...armR(-8, 30, 0, "relax", l),
  })),
  /** 把拴着的腿蜷到胸口、脚收在身子底下，弯下腰，两只手凑到脚踝的锁上（手由 IK 放到锁上；腿不蜷到这么紧手够不着脚踝） */
  弯腰开锁: pose(60, { face: -0.6, float: 0, ground: false, rot: 0, ...legL(120, -160, -20), ...legR(-6, -60, -30), neck: -16, expression: "低头看", sad: 0.2, fierce: 0.7, lookY: 1 }, (l) => ({
    ...armL(30, 40, 0, "grip", l),
    ...armR(36, 34, 0, "grip", l),
  })),
  /** 锁开了：远处的手伸向头顶的白，近处的手往后舒展开，一条腿往后弯，仰着头、闭着眼笑（和片头光里的女人一个样子） */
  张手: pose(-6, { face: -0.6, float: 0, ground: false, rot: -2, ...legL(-4, -62, -64), ...legR(10, -16, -66), neck: 24, expression: "哭着笑", blink: 1 }, (l) => ({
    ...armL(-96, -20, -16, "open", l),
    ...armR(158, 14, 10, "open", l),
  })),
  // ——— ⑥「其实还想要说很多」：快碰到白时被沉沉从身后一把抱住，一起往下坠，落在自己家楼顶 ———
  /** 被一把抱住：一惊睁开眼，张着的手一下收回来，腿被带得往前一甩 */
  被抱住: pose(-10, { face: -0.6, float: 0, ground: false, rot: -6, ...legL(24, -40, -30), ...legR(40, -76, -30), neck: -6, expression: "吓一跳", lookX: 0.4, lookY: 0.2 }, (l) => ({
    ...armL(70, 60, 0, "open", l),
    ...armR(100, 40, 0, "open", l),
  })),
  /** 往下坠：两只手攥着环在身前的胳膊，闭着眼缩着，腿垂下去 */
  被抱着坠: pose(4, { face: -0.6, float: 0, ground: false, rot: 0, ...legL(-2, -24, -40), ...legR(12, -56, -40), neck: -16, expression: "闭眼", sad: 0.6 }, (l) => ({
    ...armL(30, 110, 0, "grip", l),
    ...armR(40, 104, 0, "grip", l),
  })),
  /** 落地以后：还被抱着，身子还在往上飘，睁开眼回头看她 */
  落地_回头: pose(-4, { face: -0.6, float: 0, ground: false, rot: -4, ...legL(-6, -20, -40), ...legR(8, -50, -40), neck: 8, expression: "难过", sad: 0.6, lookX: 0.8, lookY: -0.2, headTurn: -0.6 }, (l) => ({
    ...armL(30, 110, 0, "grip", l),
    ...armR(40, 104, 0, "grip", l),
  })),
  // ——— ⑧「请你等等我」第二句（2026-10-20）：她抱着坐下来，千斤在她怀里转过身来抱住她，把脸埋在她胸口哭 ———
  /** 转身之前：手脚收拢（转身是一下子转过来的，前后两个样子差不多对称，转过来那一帧不跳），低着头 */
  转身前: pose(6, { face: -0.6, float: 0, ground: false, rot: 0, wind: 0.2, ...legL(10, -30, -20), ...legR(16, -40, -20), neck: -14, expression: "忍着哭", blink: 0.6, tears: 1, lookY: 0.7 }, (l) => ({
    ...armL(10, 70, 0, "relax", l),
    ...armR(14, 66, 0, "relax", l),
  })),
  /** 在她怀里转过身来（朝右，对着她），两只手抱住她（手由 IK 放到她背后），把脸埋在她胸口，忍着哭；跪坐在她腿上（膝盖朝着她、小腿往后折在身子底下，
   *  脚背朝下）——膝盖立到胸口、鞋底踩在楼顶上的话像蹲着（用户 2026-10-20：「也不是蹲着，是直接落地就坐在地上」） */
  转身抱: pose(26, { face: 0.6, float: 0, ground: false, rot: 0, wind: 0.2, ...legL(84, -166, -166), ...legR(90, -166, -164), neck: -18, expression: "忍着哭", blink: 0.9, tears: 1, lookY: 0.6 }, (l) => ({
    ...armL(70, 60, 0, "grip", l),
    ...armR(80, 50, 0, "grip", l),
  })),
  /** 半空里抱住她时：腿还软软地垂着、往后拖一点（不提前折到身子底下；用户 2026-10-20：「腿不要提前收，而是落地之后收」），落地以后才跪坐下去 */
  转身抱_垂腿: pose(2, { face: 0.6, float: 0, ground: false, rot: 0, wind: 0.2, ...legL(4, -40, -30), ...legR(16, -58, -30), neck: -18, expression: "忍着哭", blink: 0.9, tears: 1, lookY: 0.6 }, (l) => ({
    ...armL(70, 60, 0, "grip", l),
    ...armR(80, 50, 0, "grip", l),
  })),
  /** 「我」哭出来：脸埋得更深，闭着眼 */
  转身抱_哭: pose(30, { face: 0.6, float: 0, ground: false, rot: 0, wind: 0.2, ...legL(84, -166, -166), ...legR(90, -166, -164), neck: -24, expression: "闭眼", sad: 0.9, smile: -0.2, tears: 1 }, (l) => ({
    ...armL(70, 60, 0, "grip", l),
    ...armR(80, 50, 0, "grip", l),
  })),
  // ——— ⑪「妄想用它拯救你」（2026-10-20 改：回到楼顶上两个人抱着坐着的那一刻，沉沉从外套兜里掏出「活下去」放进她手里）———
  /** 她松开一点：千斤从她胸口抬起头看着她，两只手从她背上放下来、垂在身前（还跪坐在她腿上） */
  抬头看她: pose(10, { face: 0.6, float: 0, ground: false, rot: 0, wind: 0.2, ...legL(84, -166, -166), ...legR(90, -166, -164), neck: 4, expression: "含泪", tears: 1, lookX: 0.5, lookY: -0.3 }, (l) => ({
    ...armL(16, 46, 0, "relax", l),
    ...armR(10, 52, 0, "relax", l),
  })),
  /** 砖放进手里：低头看着，一愣（两只手由 IK 托着砖的两头） */
  捧砖_看: pose(10, { face: 0.6, float: 0, ground: false, rot: 0, wind: 0.2, ...legL(84, -166, -166), ...legR(90, -166, -164), neck: -12, expression: "惊", tears: 1, lookX: 0.2, lookY: 0.9 }, (l) => ({
    ...armL(30, 90, 0, "grip", l),
    ...armR(24, 96, 0, "grip", l),
  })),
  /** 砖暖起来：抬起头看着她，哭着笑 */
  捧砖_哭着笑: pose(8, { face: 0.6, float: 0, ground: false, rot: 0, wind: 0.2, ...legL(84, -166, -166), ...legR(90, -166, -164), neck: 6, expression: "哭着笑", tears: 1, lookX: 0.5, lookY: -0.3 }, (l) => ({
    ...armL(30, 90, 0, "grip", l),
    ...armR(24, 96, 0, "grip", l),
  })),
  // ——— （2026-10-20 前的）⑦「请你等等我」：落地以后还往上漂，被沉沉攥着手腕；被按到栏杆上，转过来看着她（现在没用） ———
  /** 往上漂、近处那只手被她牵着（像牵着一只气球，胳膊往右下方伸直，手由 IK 放进她手里；两条腿往左前方漂着，脚不垂到她跟前），另一只手飘起来，低头看着她 */
  被牵着漂: pose(-4, { face: -0.6, float: 0, ground: false, rot: 8, ...legL(40, -24, -30), ...legR(54, -34, -24), neck: -26, expression: "难过", sad: 0.6, lookX: 0.5, lookY: 1 }, (l) => ({
    ...armL(-32, 6, 0, "grip", l),
    ...armR(100, 30, 10, "relax", l),
  })),
  /**
   * 两只手攥着栏杆（手由 IK 放到栏杆上），身子轻飘飘地浮在栏杆上面，回过头看着她。身子还是朝左，两条腿往左上方漂起来
   * （平伸着像坐在栏杆上；转成朝右的话腿会从她跟前甩过去，和她的腿缠在一起）
   */
  攥栏杆: pose(4, { face: -0.6, float: 0, ground: false, rot: 10, ...legL(104, -30, 0), ...legR(116, -40, 0), neck: -10, headTurn: -0.8, expression: "难过", sad: 0.7, lookX: 0.6, lookY: 0.1 }, (l) => ({
    ...armL(10, 20, 0, "grip", l),
    ...armR(16, 16, 0, "grip", l),
  })),
  /** 听她说「等等我」：扭过头看着她，忍着哭 */
  攥栏杆_听: pose(6, { face: -0.6, float: 0, ground: false, rot: 10, ...legL(110, -30, 0), ...legR(122, -40, 0), neck: -4, headTurn: -1, expression: "忍着哭", lookX: 0.6, lookY: -0.1 }, (l) => ({
    ...armL(10, 20, 0, "grip", l),
    ...armR(16, 16, 0, "grip", l),
  })),
  /**
   * ⑧ 天黑下来，白把她往上拽：身子被提起来、胳膊绷直往下攥着栏杆（手由 IK 放到栏杆上），两条腿往左上方漂起来——
   * 整个人像一只风筝；扭过头望着右边那栋楼，忍着哭。（试过整个人倒过来：近看脸是倒的、胳膊横在脸前，短发也会翘成尖）
   * 头不要歪太多（rot + neck ≲ 36°）、风小一点：头歪到 50° 以上时往右吹的风在头的坐标里朝头顶，短发翘成一圈尖
   */
  风筝: pose(-6, { face: -0.6, float: 0, ground: false, rot: 40, wind: 0.5, ...legL(138, -30, 28), ...legR(150, -42, 30), neck: -14, headTurn: -1, expression: "忍着哭", lookX: 0.8, lookY: -0.3 }, (l) => ({
    ...armL(-20, 0, 0, "grip", l),
    ...armR(-12, 0, 0, "grip", l),
  })),
  // ——— ⑪「妄想用它拯救你」：沉沉把「活下去」放进她攥着栏杆的那只手里，砖一沉，她松开栏杆坠下来，坐回楼顶，抱着砖哭着笑 ———
  // （这几个姿势风都给 0–0.2：头一歪，往右吹的风在头的坐标里就朝头顶，短发翘出尖；
  //  头一律转到 headTurn −1：face −0.6 加 headTurn −0.3 或 −0.9（头转 |0.3| 左右）时短发像帽檐一样往外翻，关键帧之间也别经过那一段）
  /** 砖放进手里那一下：还漂着，低头看手里的砖，一愣 */
  风筝_看砖: pose(-4, { face: -0.6, float: 0, ground: false, rot: 18, wind: 0, ...legL(126, -30, 22), ...legR(138, -42, 24), neck: -28, headTurn: -1, expression: "惊", lookX: 0.4, lookY: 0.9 }, (l) => ({
    ...armL(-20, 0, 0, "grip", l),
    ...armR(-12, 0, 0, "grip", l),
  })),
  /** 坠下来：砖拽着近处那只手往下，另一只手松开栏杆甩上去，腿往下放 */
  坠: pose(4, { face: -0.6, float: 0, ground: false, rot: 6, wind: 0, ...legL(60, -50, 0), ...legR(76, -60, 0), neck: -10, headTurn: -1, expression: "吓一跳", lookX: 0.4, lookY: 0.6 }, (l) => ({
    ...armL(10, 30, 0, "grip", l),
    ...armR(150, 20, 10, "open", l),
  })),
  /** 坐在楼顶上（膝盖立起来、脚踩在身前），两只手把砖抱在胸前（手由 IK 扶着砖的两头），低头看着它，忍着哭 */
  坐_抱砖: pose(14, { face: -0.6, float: 0, ground: false, rot: 0, wind: 0.2, ...legL(124, -100, 0), ...legR(134, -108, 0), neck: -14, headTurn: -1, expression: "忍着哭", lookX: 0.2, lookY: 0.8 }, (l) => ({
    ...armL(30, 100, 0, "grip", l),
    ...armR(40, 94, 0, "grip", l),
  })),
  /** 抬头看着蹲在旁边的她，哭着笑了 */
  坐_哭着笑: pose(6, { face: -0.6, float: 0, ground: false, rot: 0, wind: 0.2, ...legL(124, -100, 0), ...legR(134, -108, 0), neck: 8, headTurn: -1, expression: "哭着笑", lookX: 0.7, lookY: -0.25 }, (l) => ({
    ...armL(30, 100, 0, "grip", l),
    ...armR(40, 94, 0, "grip", l),
  })),
  /** 她跑走了：攥着栏杆，扭头望着她跑开的方向；身子慢慢往左歪着漂起来（⑧ 像一只风筝） */
  攥栏杆_望: pose(2, { face: -0.6, float: 0, ground: false, rot: 30, ...legL(116, -24, 6), ...legR(128, -34, 6), neck: 4, headTurn: -1, expression: "难过", sad: 0.8, lookX: 0.9, lookY: 0 }, (l) => ({
    ...armL(10, 20, 0, "grip", l),
    ...armR(16, 16, 0, "grip", l),
  })),
};

// ——————————————— 沉沉（第二幕⑥ 最高那栋楼的楼顶：收床单 → 看见她 → 冲 → 扑出去抱住 → 一起坠下去 → 落在千斤家楼顶）———————————————
// 朝左（face −1），和前奏里一样。铁靴是硬的：脚放平时小腿最多往前倾约 17°。
export const CHEN2 = {
  /** 在晾衣绳边收床单：两只手攥着床单上沿往下扯，抬头看着绳子 */
  收床单: pose(4, { face: -1, ...legR(10, -8), ...legL(-8, -4), neck: 14, expression: "平常", lookX: -0.2, lookY: -0.4 }, (l) => ({
    ...armL(80, 40, 0, "grip", l),
    ...armR(96, 30, 0, "grip", l),
  })),
  /** 看见她：一惊，身子往后一挺，眼睛瞪大盯着左上方（手里还攥着床单） */
  一惊: pose(-10, { face: -1, ...legR(14, -10), ...legL(-10, -6), neck: 18, expression: "惊", lookX: -0.9, lookY: -0.5 }, (l) => ({
    ...armL(64, 50, 0, "open", l),
    ...armR(80, 40, 0, "open", l),
  })),
  /** 蹬着楼边扑出去：身子往前扑平，两只手往前伸，后腿蹬直 */
  扑: pose(40, { face: -1, ground: false, ...legL(-46, -8, -40), ...legR(34, -60, -20), neck: 26, expression: "使劲", teeth: 0.5, lookX: -0.6, lookY: -0.3 }, (l) => ({
    ...armL(118, 10, 0, "open", l),
    ...armR(108, 14, 0, "open", l),
  })),
  /** 半空里从身后抱住她：两只手臂环在她身前（近处那只画在她前面），身子贴上去，腿收起来 */
  抱住: pose(18, { face: -1, ground: false, chestL: "over", ...legL(-20, -50, -30), ...legR(30, -80, -20), neck: -6, expression: "使劲", teeth: 0.4, lookX: -0.4, lookY: 0.2 }, (l) => ({
    ...armL(64, 96, 0, "grip", l),
    ...armR(76, 90, 0, "grip", l),
  })),
  /** 抱着她在天上慢慢飘：腿软软地垂着、往后蜷一点，脸贴在她头边 */
  抱着飘: pose(10, { face: -1, ground: false, chestL: "over", ...legL(-14, -34, -30), ...legR(14, -50, -24), neck: -10, expression: "使劲", teeth: 0.2, lookX: -0.3, lookY: 0.3 }, (l) => ({
    ...armL(60, 100, 0, "grip", l),
    ...armR(72, 94, 0, "grip", l),
  })),
  /** 快到楼顶：腿伸下去准备落地，低头看着下面的楼顶 */
  抱着坠: pose(6, { face: -1, ground: false, chestL: "over", ...legL(-6, -14, -30), ...legR(16, -30, -24), neck: -24, expression: "使劲", teeth: 0.5, lookY: 0.9 }, (l) => ({
    ...armL(60, 100, 0, "grip", l),
    ...armR(72, 94, 0, "grip", l),
  })),
  /** 落地：铁靴踩到楼顶上，膝盖一弯吃住分量（轻轻落下，不是砸），手还环着她 */
  落地: pose(18, { face: -1, ground: false, chestL: "over", ...legR(44, -60), ...legL(30, -50), thighL: 0.85, thighR: 0.85, neck: -8, expression: "使劲", teeth: 0.3, lookY: 0.4 }, (l) => ({
    ...armL(60, 100, 0, "grip", l),
    ...armR(72, 94, 0, "grip", l),
  })),
  /** 站稳：直起来一点，还抱着她 */
  落地_起: pose(8, { face: -1, ground: false, chestL: "over", ...legR(16, -18), ...legL(-6, -12), thighL: 1, thighR: 1, neck: -4, expression: "心疼", lookX: -0.3, lookY: 0.3 }, (l) => ({
    ...armL(60, 100, 0, "grip", l),
    ...armR(72, 94, 0, "grip", l),
  })),
  // ——— ⑧「请你等等我」第二句（2026-10-20）：抱着她飘下来，落下来就是坐着的（用户：「两人不要站着落地，也不是蹲着，是直接落地就坐在地上」） ———
  // 坐姿的胯直接放在离地 45 的地方（lift −235，根就是楼顶，同周磊的 SIT）；两条腿往前伸、膝盖微微立起来，
  // 铁靴是硬的：跟着小腿一起翘起来（foot = 胯 + 膝），靴跟搁在楼顶上。远处那条腿（R）膝盖立得高一点、近处那条（L）伸得平一点。
  /** 快到楼顶：还在半空里，腿已经往前伸成坐的样子（不伸下去够地），抱着她 */
  抱着坐飘: pose(10, { face: -1, ground: false, lift: -235, chestL: "over", ...legR(112, -62, 50), ...legL(98, -34, 64), neck: -18, expression: "心疼", tears: 0.4, lookX: -0.3, lookY: 0.7 }, (l) => ({
    ...armL(60, 100, 0, "grip", l),
    ...armR(72, 94, 0, "grip", l),
  })),
  /** 坐在楼顶上（屁股着地、腿往前伸），她坐在怀里扑在胸口，两只手臂环在她背上（IK），低头看着她，心疼 */
  坐地抱: pose(12, { face: -1, ground: false, lift: -235, chestL: "over", ...legR(124, -80, 44), ...legL(102, -36, 66), neck: -26, expression: "心疼", tears: 0.5, lookX: -0.4, lookY: 1 }, (l) => ({
    ...armL(60, 100, 0, "grip", l),
    ...armR(72, 94, 0, "grip", l),
  })),
  /** ⑪ 松开一点、往后靠一点，睁开眼看着她（心疼） */
  坐地_看她: pose(4, { face: -1, ground: false, lift: -235, chestL: "over", ...legR(124, -80, 44), ...legL(102, -36, 66), neck: -10, expression: "心疼", tears: 0.5, lookX: -0.5, lookY: 0.3 }, (l) => ({
    ...armL(40, 100, 0, "grip", l),
    ...armR(70, 96, 0, "grip", l),
  })),
  /** ⑪ 砖暖起来：看着她，含着泪笑 */
  坐地_笑: pose(12, { face: -1, ground: false, lift: -235, chestL: "over", ...legR(124, -80, 44), ...legL(102, -36, 66), neck: -22, expression: "哭着笑", tears: 0.6, lookX: -0.5, lookY: 0.35 }, (l) => ({
    ...armL(40, 100, 0, "grip", l),
    ...armR(70, 96, 0, "grip", l),
  })),
  /** 下巴凑到她头上，闭上眼（「等等我」说完了），含着泪 */
  坐地抱_贴脸: pose(16, { face: -1, ground: false, lift: -235, chestL: "over", ...legR(124, -80, 44), ...legL(102, -36, 66), neck: -24, expression: "闭眼", smile: 0.3, tears: 0.6 }, (l) => ({
    ...armL(58, 102, 0, "grip", l),
    ...armR(70, 96, 0, "grip", l),
  })),
  // ——— （2026-10-20 前的）⑦「请你等等我」（现在没用） ———
  /** 远处那只手往前上方伸着、牵住往上漂的她，弯下腰、屈膝，近处那只手伸进身前那只靴筒里掏砖（手由 IK 放进靴口）。
   *  （肩的角度最多 180：身子前倾 74°，上臂在画面里最多举到 106°，所以弯着肘把手举到头顶上） */
  掏靴筒: pose(74, { face: -1, ground: false, ...legR(58, -74), ...legL(18, -34), neck: -24, expression: "平常", lookX: -0.2, lookY: 1 }, (l) => ({
    ...armL(-10, 10, 0, "open", l),
    ...armR(100, 50, 0, "grip", l),
  })),
  /** 手拿出来，是空的：手心朝上托在身前——和前奏里递砖一个手势（托着，flat），上面什么也没有；低头看着它愣住（牵着她的那只手还举着） */
  空手: pose(26, { face: -1, ground: false, ...legR(30, -44), ...legL(8, -22), neck: -16, expression: "担心", wide: 0.5, lookX: -0.4, lookY: 0.6 }, (l) => ({
    ...armL(26, 40, 40, "flat", l),
    ...armR(148, 4, 0, "grip", l),
  })),
  /** 抬头看着她，下定了决心（空着的手攥起来） */
  抬头看她: pose(4, { face: -1, ground: false, ...legR(16, -18), ...legL(-6, -10), neck: 24, expression: "坚定", lookX: -0.4, lookY: -0.8 }, (l) => ({
    ...armL(24, 76, -10, "fist", l),
    ...armR(150, 4, 0, "grip", l),
  })),
  /**
   * ⑧⑨ 夜里在自己屋里，坐在椅子上朝左对着桌子写砖（铁靴踩在地上，腿弯成直角）：远处那只手握笔、近处那只搁在桌上砖的右边（两只手由 IK 放好，
   * lib/room.ts），低着头看笔尖。用户 2026-10-30 在「调整画面」0:32.30 摆的：坐直一点（原来前倾 24、头低 −30，伏在桌上）、
   * 大腿朝镜头压短，原来近处那只握笔、远处那只按砖；握笔那只上臂朝镜头伸着、压短（upperArmR，素材库 2026-10-30 为这里加的参数）
   */
  写字: pose(14.3, { face: -1, ground: false, ...legR(86, -86), ...legL(80, -82), thighL: 0.63, thighR: 0.61, upperArmR: 0.62, neck: -13.5, expression: "平常", lookX: -0.3, lookY: 0.95 }, (l) => ({
    ...armL(60, 60, -4, "relax", l),
    ...armR(70, 50, -45, "grip", l),
  })),
  // ——— ⑪ 抱着砖从最高那栋楼的楼顶跳下来，落在千斤家楼顶，跑过去把砖放进她手里，蹲在她旁边 ———
  /** 抱着砖从高处跳下来：前腿伸出去准备落地、后腿收着，两只手抱紧砖（手由 IK 扶着砖） */
  跳下抱砖: pose(8, { face: -1, ground: false, ...legR(44, -56, -10), ...legL(-24, -50, -24), neck: 4, expression: "坚定", lookX: -0.6, lookY: 0.3 }, (l) => ({
    ...armL(28, 104, 0, "grip", l),
    ...armR(38, 98, 0, "grip", l),
  })),
  /** 落地：铁靴砸在楼顶上，膝盖一弯吃住分量，砖护在胸前 */
  落地抱砖: pose(24, { face: -1, ground: false, ...legR(56, -72), ...legL(30, -46), neck: -6, expression: "使劲", teeth: 0.3, lookX: -0.5, lookY: 0.2 }, (l) => ({
    ...armL(28, 104, 0, "grip", l),
    ...armR(38, 98, 0, "grip", l),
  })),
  /** 把砖递到她攥着栏杆的那只手里：身子往前倾、胳膊伸出去（手由 IK 扶着砖），仰头看着她 */
  递砖: pose(30, { face: -1, ground: false, ...legR(24, -22), ...legL(-14, -6), neck: 18, expression: "心疼", lookX: -0.6, lookY: -0.5 }, (l) => ({
    ...armL(70, 30, 0, "grip", l),
    ...armR(76, 26, 0, "grip", l),
  })),
  /** 砖交出去以后：手还在砖底下护着一下，跟着她往下 */
  护着: pose(30, { face: -1, ground: false, ...legR(30, -34), ...legL(-6, -18), neck: -6, expression: "担心", lookX: -0.6, lookY: 0.5 }, (l) => ({
    ...armL(40, 30, 10, "open", l),
    ...armR(46, 26, 10, "open", l),
  })),
  /** 蹲在她旁边（大腿放平、胯往后坐），手搭在膝盖上，看着她，眼里含着泪笑 */
  蹲着看她: pose(16, { face: -1, ground: false, ...legR(84, -100), ...legL(70, -86), thighR: 0.8, thighL: 0.8, neck: -4, expression: "含泪", lookX: -0.6, lookY: 0.2 }, (l) => ({
    ...armL(40, 70, 0, "relax", l),
    ...armR(50, 64, 0, "relax", l),
  })),
  // ——— ⑫「顺便拯救我自己」：回到屋里，坐在椅子上脱铁靴，一脱就飘起来，飘到天花板上倒钉的床里，脚绳拴在椅子后腿上 ———
  /** 弯下腰，两只手攥住前面那只铁靴（R）的靴口往下拔 */
  脱靴: pose(52, { face: -1, ground: false, ...legR(100, -74), ...legL(80, -82), neck: -22, expression: "使劲", teeth: 0.2, lookX: -0.2, lookY: 0.9 }, (l) => ({
    ...armL(14, 20, 0, "grip", l),
    ...armR(20, 16, 0, "grip", l),
  })),
  /** 拔出来：腿往上一抽（靴子掉到地上） */
  脱靴_拔: pose(40, { face: -1, ground: false, ...legR(118, -96), ...legL(80, -82), neck: -16, expression: "使劲", teeth: 0.2, lookX: -0.2, lookY: 0.8 }, (l) => ({
    ...armL(20, 40, 0, "open", l),
    ...armR(26, 36, 0, "open", l),
  })),
  /** 往后坐，把还穿着铁靴的那条腿（近处）的膝盖收到胸前，准备一脚踢掉它；两只手撑着椅面 */
  抬腿: pose(2, { face: -1, ground: false, ...legR(72, -84), ...legL(104, -116), neck: -8, expression: "坚定", lookX: -0.4, lookY: 0.7 }, (l) => ({
    ...armL(-22, 22, 0, "grip", l),
    ...armR(-16, 18, 0, "grip", l),
  })),
  /** 一脚往前踢直，铁靴从脚上甩出去；身子往后一仰，两只手撑在身后 */
  踢靴: pose(-14, { face: -1, ground: false, ...legR(66, -72), ...legL(84, -18, 16), neck: -4, expression: "使劲", teeth: 0.3, lookX: -0.5, lookY: 0.5 }, (l) => ({
    ...armL(-38, 26, 0, "grip", l),
    ...armR(-32, 22, 0, "grip", l),
  })),
  /** 两只铁靴都脱了：光着脚垂着，手撑在椅面上，闭上眼松了一口气 */
  松口气: pose(4, { face: -1, ground: false, ...legR(78, -86, -16), ...legL(70, -78, -14), neck: 8, expression: "释然", blink: 0.85, smile: 0.45 }, (l) => ({
    ...armL(-14, 16, 0, "relax", l),
    ...armR(-10, 14, 0, "relax", l),
  })),
  /** 没了铁靴，整个人慢慢飘起来：头往后仰一点，两条腿软软地垂着、脚尖朝下，两只手松松地浮起来，闭着眼 */
  飘起来: pose(-8, { face: -1, ground: false, float: 0.5, ...legR(22, -34, -34), ...legL(8, -24, -30), neck: 14, expression: "释然", blink: 1, smile: 0.45 }, (l) => ({
    ...armL(22, 48, 8, "relax", l),
    ...armR(38, 40, 6, "relax", l),
  })),
  /** 躺进天花板上倒钉的床里：整个人横过来（头枕在枕头上，背贴着床垫，脸朝下），两条腿伸直、两只手放在身边（都盖在被子里），睡着了 */
  躺床: pose(0, { face: -1, ground: false, rot: -90, ...legR(6, -8, -24), ...legL(2, -4, -18), neck: -16, expression: "闭眼", smile: 0.4 }, (l) => ({
    ...armL(4, 12, 0, "relax", l),
    ...armR(-10, 10, 0, "relax", l),
  })),
  /** ⑩ 放下笔站起来，探身去捧桌上那块刚写好的砖（两只手由 IK 放到砖的两头） */
  捧砖: pose(30, { face: -1, ground: false, ...legR(14, -12), ...legL(-8, -6), neck: -16, expression: "坚定", lookX: -0.3, lookY: 0.7 }, (l) => ({
    ...armL(60, 30, 0, "grip", l),
    ...armR(66, 26, 0, "grip", l),
  })),
  /** 把砖抱在胸前（两只手由 IK 扶着砖的两头），转头望着门——要去楼顶给千斤 */
  抱砖: pose(6, { face: -1, ground: false, ...legR(12, -10), ...legL(-8, -6), neck: 4, expression: "坚定", lookX: -0.9, lookY: 0 }, (l) => ({
    ...armL(28, 104, 0, "grip", l),
    ...armR(38, 98, 0, "grip", l),
  })),
  /** 把她的两只手按在栏杆上、攥紧（手由 IK 盖在她手上），凑过去看着她的眼睛 */
  按手: pose(24, { face: -1, ground: false, ...legR(20, -20), ...legL(-12, -10), neck: 10, expression: "坚定", lookX: -0.5, lookY: -0.3 }, (l) => ({
    ...armL(50, 20, 0, "grip", l),
    ...armR(56, 16, 0, "grip", l),
  })),
};
