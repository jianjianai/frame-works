// 前奏里所有人的姿势：全部自己按关节角度写，不用素材库的动作预设（用户 2026-10-18：素材库的动作预设有问题，姿势别扭）。
// 检查页：sheets/前奏姿势.ts（每个姿势单独画在地面上，看着地、看比例）。
//
// 角度约定（朝左写；face > 0 时整套镜像）：
// - 四肢 0 = 竖直往下，正 = 往前摆（顺时针）。膝往后弯是负。
// - 手臂的角度是相对胸口的：身子前倾 lean 度时，上臂在画面里的方向 = 肩 − lean。下面 arm() 按画面里的方向写，自动加上 lean。
// - 腿按「脚对地面的角度」写（0 = 鞋底放平，正 = 脚尖翘起），脚相对小腿的角自动算。
// - 她的铁靴是硬的：脚放平时小腿最多往前倾约 17°（胯 + 膝 ≥ −17），再多脚跟就会离地、靴子看着别扭；要蹲得深就多弯腰。
// - 站、停、蹲、跪这些姿势：远处那条腿（R）在前、近处那条腿（L）在后（用户 2026-10-18：朝左时画面左边那只脚在前，
//   朝右时画面右边那只脚在前）。3/4 朝左时近处的腿本来就在画面右边（身后那侧），让它往前迈会从远处那条腿前面横过去，两腿交叉。

import type { Angles } from "@materials/剪纸角色/code/chengtuo";

type Hand = "relax" | "open" | "fist" | "grip" | "point" | "pinky" | "flat";

/** 一条腿：胯（大腿往前抬为正）、膝（往后弯为负）、脚对地面的角度 */
export const legL = (hip: number, knee: number, foot = 0): Angles => ({ hipL: hip, kneeL: knee, ankleL: foot - hip - knee });
export const legR = (hip: number, knee: number, foot = 0): Angles => ({ hipR: hip, kneeR: knee, ankleR: foot - hip - knee });

/** 一只手臂：up = 上臂在画面里的方向（0 垂下，90 往前平举，180 举过头顶），lean = 这个姿势身子前倾多少 */
export const armL = (up: number, elbow: number, wrist: number, hand: Hand, lean: number): Angles => ({
  shoulderL: Math.max(-180, Math.min(180, up + lean)),
  elbowL: elbow,
  wristL: wrist,
  handL: hand,
});
export const armR = (up: number, elbow: number, wrist: number, hand: Hand, lean: number): Angles => ({
  shoulderR: Math.max(-180, Math.min(180, up + lean)),
  elbowR: elbow,
  wristR: wrist,
  handR: hand,
});

/** 写一个姿势：先定 lean，手臂按画面方向给 */
function pose(lean: number, rest: Omit<Angles, "lean">, arms: (lean: number) => Angles): Angles {
  return { lean, ...rest, ...arms(lean) };
}

// ——————————————————— 她（沉沉，铁靴，3/4 朝左） ———————————————————

export const CHEN = {
  /** 站：重心在后脚（近处的 L），前脚（远处的 R）放松；手自然垂着、肘微弯 */
  站: pose(2, { face: -1, ...legR(6, -9), ...legL(-5, -2), neck: 0 }, (l) => ({ ...armL(-6, 14, 6, "relax", l), ...armR(4, 16, -4, "relax", l) })),

  // ——— 跑（一步 0.26 秒：L 落地 0 → 踩实 0.19 → 蹬离地 0.38 → 腾空最高 0.68 → 下一步 R 落地），根匀速往前（用户 2026-10-19：「跑的再快一点」「跑步的动作一顿一顿的」）———
  // 不自动着地（ground: false），胯高直接给（lift = 胯高 − 280.5）：268 → 268 → 284 → 290 → 268。
  // 站着那只脚（L）按反算放在地上（大腿 125、小腿 92）：相对胯 +56 → −3 → −63（往前为正），正好是匀速 1200/秒在着地的 0.38 步里退的距离，
  // 根按 dx 匀速走、脚不滑。摆动那条腿（R）往后收、折起来从身子底下往前送、落地前稍微往回收一点（落地时脚和地面差不多一样快）。
  // 手臂和腿反着摆（L 腿在前时 L 手在后），按 −36·cos(π(u + 0.3)) 写：比腿早 0.3 步，抵消手臂弹簧慢半拍，摆到最前正好是对侧脚落地。
  跑_落地: pose(14, { face: -1, ground: false, lift: -12.5, ...legL(22.7, -17.8, 10), ...legR(-18, -70, -30), neck: 6, expression: "使劲" }, (l) => ({ ...armL(-21, 86, 0, "fist", l), ...armR(21, 86, 0, "fist", l) })),
  跑_踩实: pose(14, { face: -1, ground: false, lift: -12.5, ...legL(17.9, -44.8, -6), ...legR(12, -105, -20), neck: 6, expression: "使劲" }, (l) => ({ ...armL(-1, 86, 0, "fist", l), ...armR(1, 86, 0, "fist", l) })),
  跑_蹬地: pose(14, { face: -1, ground: false, lift: 3.5, ...legL(-4.5, -30.4, -22), ...legR(45, -85, -10), neck: 6, expression: "使劲" }, (l) => ({ ...armL(19, 86, 0, "fist", l), ...armR(-19, 86, 0, "fist", l) })),
  跑_腾空: pose(14, { face: -1, ground: false, lift: 9.5, ...legL(-28, -48, -30), ...legR(38, -35, 4), neck: 6, expression: "使劲" }, (l) => ({ ...armL(36, 86, 0, "fist", l), ...armR(-36, 86, 0, "fist", l) })),

  /** 刹住：前脚跟扎在地上，身子往后坐，手被惯性甩到前面 */
  刹: pose(-10, { face: -1, ...legR(30, -12, 10), ...legL(-20, -30, -14), neck: 8, expression: "吓一跳", lookX: -0.5, lookY: 0.7 }, (l) => ({
    ...armL(30, 56, 10, "open", l),
    ...armR(46, 60, 10, "open", l),
  })),
  /** 刹住的一瞬间公文包擦着手掉下来：脚还扎在原地（腿和「刹」一样，人不往后退，公文包砸在靴尖跟前），上身往后一仰、手猛地缩到胸前、头一缩 */
  刹_缩: pose(-18, { face: -1, ...legR(30, -12, 10), ...legL(-20, -30, -14), neck: -12, expression: "吓一跳", lookX: -0.6, lookY: 0.8 }, (l) => ({
    ...armL(6, 116, 14, "open", l),
    ...armR(14, 120, 10, "open", l),
  })),
  /** 公文包就砸在旁边：一缩（肩耸起来、头一缩，手收到胸前） */
  缩: pose(-4, { face: -1, ...legR(20, -16), ...legL(-16, -14), neck: -8, expression: "吓一跳", lookX: -0.6, lookY: 0.8 }, (l) => ({
    ...armL(10, 110, 14, "open", l),
    ...armR(18, 116, 10, "open", l),
  })),
  /** 低头看砸下来的公文包 */
  低头看: pose(8, { face: -1, ...legR(16, -12), ...legL(-14, -6), neck: -26, expression: "惊", lookX: -0.7, lookY: 1 }, (l) => ({ ...armL(2, 30, 8, "relax", l), ...armR(8, 32, 0, "relax", l) })),
  /** 仰头看他：身子微微往后仰，手垂在身边 */
  仰头: pose(-6, { face: -1, ...legR(12, -10), ...legL(-12, -6), neck: 36, expression: "仰望" }, (l) => ({ ...armL(-8, 16, 6, "relax", l), ...armR(-2, 20, 0, "relax", l) })),

  // ——— 跳起来抓住他的脚踝 ———
  /** 蹲（攒劲）：铁靴小腿前倾不超过 17°，蹲不深，靠弯腰；手甩到身后 */
  蹲: pose(34, { face: -1, ...legR(48, -62), ...legL(40, -54), neck: 38, expression: "使劲", lookY: -1 }, (l) => ({ ...armL(-56, 16, 10, "open", l), ...armR(-46, 20, 6, "open", l) })),
  /** 蹬地起跳：腿蹬直、脚尖朝下；远处的手往上够（近处的手举过头会横过脸，改往前甩） */
  起跳: pose(-4, { face: -1, ...legR(-2, -4, -46), ...legL(-12, -8, -52), neck: 30, lift: 140, expression: "使劲", teeth: 0, open: 0.3, lookY: -1 }, (l) => ({
    ...armL(70, 26, 0, "open", l),
    ...armR(166, 8, 6, "open", l),
  })),
  /** 空中抓住：远处的手攥住他的脚踝，近处的手往前张开保持平衡，一条腿收起来 */
  抓住: pose(-6, { face: -1, ...legR(44, -76, -30), ...legL(-4, -12, -46), neck: 34, lift: 560, expression: "使劲", lookY: -1 }, (l) => ({
    ...armL(50, 34, 0, "open", l),
    ...armR(176, 4, 4, "grip", l),
  })),
  /** 抓住以后带着他往下坠：手从头顶往前下方拽，腿伸下去准备着地 */
  拽着坠: pose(8, { face: -1, ...legR(20, -26, -10), ...legL(-6, -14, -20), neck: -4, lift: 140, expression: "使劲", lookX: -0.3, lookY: 0.5 }, (l) => ({
    ...armL(-24, 40, 10, "fist", l),
    ...armR(110, 10, 4, "grip", l),
  })),
  /** 落地：膝盖吃住分量，手已经把他拽到地上（手在身前低处还攥着他的脚踝） */
  落地拽住: pose(30, { face: -1, ...legR(44, -58), ...legL(32, -46), neck: -8, expression: "使劲", lookX: -0.3, lookY: 0.7 }, (l) => ({
    ...armL(-28, 40, 10, "fist", l),
    ...armR(16, 10, 4, "grip", l),
  })),
  /** 松手、直起身喘口气，看着瘫在地上的他 */
  喘: pose(10, { face: -1, ...legR(16, -14), ...legL(-10, -8), neck: -18, expression: "担心", lookX: -0.5, lookY: 0.8 }, (l) => ({ ...armL(-4, 24, 6, "relax", l), ...armR(12, 26, 0, "relax", l) })),

  // ——— 单膝跪下（前腿 R 踩稳、后膝 L 着地，铁靴是硬的：后腿小腿和靴子一起翘起来、靴尖点地），从前面那只靴筒里抽出砖递给他 ———
  单膝跪: pose(6, { face: -1, ...legR(96, -98), ...legL(-6, -134, -140), neck: -14, expression: "心疼", lookX: -0.4, lookY: 0.7 }, (l) => ({
    ...armL(28, 40, 6, "relax", l),
    ...armR(38, 12, 0, "relax", l),
  })),
  跪_掏砖: pose(28, { face: -1, ...legR(96, -98), ...legL(-6, -134, -140), neck: -18, expression: "平常", lookY: 0.9 }, (l) => ({ ...armL(16, 8, -6, "grip", l), ...armR(34, 14, 0, "relax", l) })),
  /** 抽出来：很沉，手臂吃劲，身子往后带 */
  跪_抽出: pose(10, { face: -1, ...legR(96, -98), ...legL(-6, -134, -140), neck: -6, expression: "使劲", teeth: 0.3, lookY: 0.4 }, (l) => ({ ...armL(36, 70, -20, "grip", l), ...armR(38, 12, 0, "relax", l) })),
  /** 递过去：近处的手弯着往前送、掌心朝上托着砖（他就坐在跟前，手不用伸直；砖递到他手的高度：离地约 195），看着他笑 */
  跪_递: pose(22, { face: -1, ...legR(96, -98), ...legL(-6, -134, -140), neck: 0, expression: "微笑", lookX: -0.4, lookY: 0.4 }, (l) => ({ ...armL(40, 34, -34, "flat", l), ...armR(38, 12, 0, "relax", l) })),
  /** 砖给出去以后：手收回来放在膝盖上，心疼地看着他 */
  跪_看他: pose(8, { face: -1, ...legR(96, -98), ...legL(-6, -134, -140), neck: -10, expression: "心疼", lookX: -0.4, lookY: 0.6 }, (l) => ({ ...armL(34, 60, 0, "relax", l), ...armR(38, 12, 0, "relax", l) })),

  // ——— 走（铁靴，一步一拍「咚」）：L 落地 → 下沉 → 经过 → 蹬地；脚抬得低、步子不大，抬着下巴 ———
  // 站着那只脚相对胯的前后距离按 0 / 0.2 / 0.48 / 0.74 / 1 匀速退：+65 → +39 → +3 → −31 → −65（腿长 125 + 92 算出来的角度），
  // 身子才匀速往前走；摆动那条腿到蹬地时伸到最前（24）、落地前收回一点（20）。前脚落地以后后脚还要再往后蹬一下
// （下沉时 −17、脚跟抬起）才往前摆：落地那一刻就往前收的话，平滑曲线在那一帧把它的速度算成 0，人每一步都刹一下。
  走_落地: pose(2, { face: -1, ...legL(20, -6, 10), ...legR(-12, -12, -18), neck: 4, expression: "微笑" }, (l) => ({ ...armL(-18, 18, 6, "relax", l), ...armR(18, 22, 0, "relax", l) })),
  走_下沉: pose(3, { face: -1, ...legL(18, -16, 0), ...legR(-17, -30, -34), neck: 4, expression: "微笑" }, (l) => ({ ...armL(-12, 20, 6, "relax", l), ...armR(12, 24, 0, "relax", l) })),
  走_经过: pose(2, { face: -1, ...legL(2.5, -4, 0), ...legR(10, -40, -8), neck: 4, expression: "微笑" }, (l) => ({ ...armL(0, 18, 6, "relax", l), ...armR(2, 22, 0, "relax", l) })),
  走_蹬地: pose(1, { face: -1, ...legL(-6.5, -4, -10), ...legR(24, -14, 4), neck: 4, expression: "微笑" }, (l) => ({ ...armL(14, 20, 6, "relax", l), ...armR(-14, 22, 0, "relax", l) })),
  /** 停下来站着（前脚 R） */
  站_笑: pose(3, { face: -1, ...legR(10, -10), ...legL(-8, -4), neck: 6, expression: "微笑", lookX: -0.4 }, (l) => ({ ...armL(-4, 16, 6, "relax", l), ...armR(4, 18, 0, "relax", l) })),
  /** 弯腰摸小石头的头：近处的手掌心朝下搭在他头顶 */
  摸头: pose(20, { face: -1, ...legR(14, -16), ...legL(-10, -6), neck: -18, expression: "微笑", squint: 0.4, lookX: -0.4, lookY: 0.9 }, (l) => ({
    ...armL(52, 26, -26, "flat", l),
    ...armR(-4, 20, 0, "relax", l),
  })),
};

/** 走路时挥手（叠在走路的手臂上）：远处的手举起来，近处的手举过头会横过脸 */
export const WAVE_R: Angles = { shoulderR: 150, elbowR: 36, wristR: 10, handR: "open" };

// ——————————————————— 他（周磊，皮鞋，一直朝右：朝着她跑来的方向，拽下来时不转身、不换位置） ———————————————————
// 他是短发：失重 ≥ 0.5 时素材库把短发画成一根根往上竖的尖（像两只猫耳朵），0.5 左右加上风又会整片横着甩出去；
// 所以飘着时失重只给 0.15（头发还垂着、跟着风轻轻摆），飘的感觉靠身子和四肢。face 不要停在 ±0.2…0.45（头发会画成一根长刺）。
// 他的姿势一律不自动着地（ground: false）：飘着时根由脚踝在哪算出来，坐下时胯直接放在地上，中间切换时胯不会跳。

/**
 * 坐在地上：两个膝盖立起来、脚收在身前踩着地（用户 2026-10-19：「打工人和主角距离近一点」——腿伸平的话脚伸出去近 300，
 * 她只能跪在他脚外面）。这个角色的脚很高（脚踝离地 65）：大腿往前上方抬、小腿往前下方伸到脚踝离地 65，鞋底正好放平。
 * 素材库按「最低的点着地」放人，坐着时会被脚撑起来，所以坐姿不自动着地，胯直接放到离地约 45 的高度（站着时胯高 280，lift = −235）。
 * 3/4 朝右时远处的肩（R）比近处的靠前约 80，远处的手要多弯一点才和近处的手凑到一起。
 */
const SIT = { ...legR(140, -110, 0), ...legL(132, -90, 0), ground: false, lift: -235 };

export const ZHOU = {
  /** 拎着公文包往上飘：近处的手拎着提手、手臂被坠得伸直，远处的手软软垂着；低着头看越来越远的地面，两条腿软软地垂着、脚尖朝下 */
  拎着飘: pose(10, { face: 0.7, float: 0.15, ground: false, ...legR(10, -22, -60), ...legL(-6, -34, -64), neck: -30, expression: "难过", lookY: 1 }, (l) => ({
    ...armL(4, 4, -4, "grip", l),
    ...armR(12, 22, 0, "relax", l),
  })),
  /** 手指松开（不扔、不使劲）：公文包自己从手里滑下去，手还停在原处，闭上眼 */
  松手: pose(10, { face: 0.7, float: 0.15, ground: false, ...legR(10, -22, -60), ...legL(-6, -34, -64), neck: -26, expression: "闭眼", sad: 0.9, lookY: 1 }, (l) => ({
    ...armL(6, 10, 4, "open", l),
    ...armR(12, 22, 0, "relax", l),
  })),
  /** 没了分量，往上飘：手软软地浮起来，闭着眼 */
  飘: pose(-4, { face: 0.6, float: 0.15, ground: false, ...legR(-2, -30, -60), ...legL(8, -44, -60), neck: 20, expression: "闭眼", sad: 0.85, smile: -0.15, tears: 0.7 }, (l) => ({
    ...armL(96, 30, 8, "open", l),
    ...armR(110, 34, 6, "open", l),
  })),
  /** 被抓住脚踝：一惊，低头看她；被抓的那条腿（近处的 L）直直往下伸到她手里，近处的手往她那边伸 */
  一惊: pose(4, { face: 0.6, float: 0.15, ground: false, ...legL(-2, -4, -50), ...legR(30, -64, -40), neck: -30, expression: "惊", lookY: 1 }, (l) => ({
    ...armL(40, 40, 0, "open", l),
    ...armR(150, 40, 0, "open", l),
  })),
  /** 被一路拽下来：手被甩到头顶，另一条腿收着 */
  被拽: pose(-6, { face: 0.65, float: 0.1, ground: false, ...legL(20, -6, -30), ...legR(50, -70, -30), neck: -10, expression: "吓一跳", lookY: 0.8 }, (l) => ({
    ...armL(150, 20, 0, "open", l),
    ...armR(160, 24, 0, "open", l),
  })),
  /** 屁股砸到地上的一下：被攥着的那条腿（L）还被她提着、往前上方伸着，另一条腿弹起来，整个人往后一仰、手撑在身后 */
  坐下: pose(-8, { face: 0.75, ...SIT, ...legL(140, -4, 60), ...legR(116, -60, 20), neck: 4, expression: "吓一跳", lookY: 0.5 }, (l) => ({ ...armL(-36, 10, 20, "open", l), ...armR(-42, 10, 20, "open", l) })),
  /** 瘫坐在地上：整个人塌下去，近处的手搭在膝盖上耷拉着、远处的手搭在远处的膝盖上（3/4 时远处的肩靠前，手垂下来会伸到她靴子上），低着头哭 */
  瘫坐: pose(16, { face: 0.8, ...SIT, neck: -40, expression: "忍着哭", lookY: 1 }, (l) => ({ ...armL(46, 40, 10, "relax", l), ...armR(-45, 150, 0, "relax", l) })),
  /** 抬头看她手里的砖：手还搭在膝盖上 */
  坐_抬头: pose(14, { face: 0.8, ...SIT, neck: -4, expression: "担心", lookX: 0.35, lookY: 0.1 }, (l) => ({ ...armL(40, 50, 0, "relax", l), ...armR(-45, 150, 0, "relax", l) })),
  /** 伸手去接：近处的手越过膝盖往前伸、掌心朝上，和她递砖的手一样高 */
  坐_接: pose(10, { face: 0.8, ...SIT, neck: 6, expression: "含泪", lookX: 0.3, lookY: 0.2 }, (l) => ({ ...armL(90, 6, -20, "flat", l), ...armR(-45, 150, 0, "relax", l) })),
  /** 砖很沉：手一下坠下去，坠到膝盖前面 */
  坐_一沉: pose(14, { face: 0.8, ...SIT, neck: -12, expression: "惊", lookX: 0.1, lookY: 0.8 }, (l) => ({ ...armL(56, 30, -10, "flat", l), ...armR(-45, 150, 0, "relax", l) })),
  /** 另一只手赶紧托住 */
  坐_两手托: pose(16, { face: 0.8, ...SIT, neck: -18, expression: "含泪", lookY: 0.9 }, (l) => ({ ...armL(52, 54, -14, "flat", l), ...armR(10, 120, -14, "flat", l) })),
  /** 捧到胸口，弓着背哭（砖在膝盖上面、贴着胸口） */
  坐_捧着哭: pose(18, { face: 0.8, ...SIT, neck: -26, expression: "忍着哭", lookY: 0.9 }, (l) => ({ ...armL(14, 124, -24, "flat", l), ...armR(4, 124, 0, "relax", l) })),
  /** 抬起头，哭着笑 */
  坐_哭着笑: pose(8, { face: 0.8, ...SIT, neck: 14, expression: "哭着笑", lookX: 0.45, lookY: -0.4 }, (l) => ({ ...armL(14, 124, -24, "flat", l), ...armR(4, 124, 0, "relax", l) })),
};

// ——————————————————— 小石头（7 岁，朝右：从左边跑过来迎她） ———————————————————
export const KID = {
  跑_落地: pose(12, { face: 0.85, ...legL(26, -12, 8), ...legR(-24, -40, -24), neck: 10, expression: "笑" }, (l) => ({ ...armL(-36, 80, 0, "fist", l), ...armR(32, 84, 0, "fist", l) })),
  跑_下沉: pose(14, { face: 0.85, ...legL(22, -30, 0), ...legR(-32, -56, -34), neck: 10, expression: "笑" }, (l) => ({ ...armL(-24, 84, 0, "fist", l), ...armR(20, 88, 0, "fist", l) })),
  跑_蹬地: pose(14, { face: 0.85, ...legL(-2, -12, -24), ...legR(38, -66, -12), neck: 10, expression: "笑" }, (l) => ({ ...armL(22, 82, 0, "fist", l), ...armR(-26, 80, 0, "fist", l) })),
  跑_腾空: pose(13, { face: 0.85, ...legL(-5, -40, -20), ...legR(36, -30, 2), neck: 10, expression: "笑" }, (l) => ({ ...armL(32, 78, 0, "fist", l), ...armR(-34, 76, 0, "fist", l) })),
  /** 跑到她跟前站住，仰着头冲她笑（前脚 R） */
  仰头笑: pose(-4, { face: 0.85, ...legR(12, -10), ...legL(-10, -4), neck: 32, expression: "笑", lookX: 0.3, lookY: -0.8 }, (l) => ({ ...armL(-20, 30, 10, "relax", l), ...armR(-16, 34, 0, "relax", l) })),
  /** 被摸头：缩着脖子、眯着眼笑 */
  被摸头: pose(2, { face: 0.85, ...legR(12, -10), ...legL(-10, -4), neck: 10, expression: "笑", blink: 0.85 }, (l) => ({ ...armL(-16, 40, 10, "relax", l), ...armR(-12, 44, 0, "relax", l) })),
};

// ——————————————————— 老钟（一楼窗后，朝右：看着她从右边走过来） ———————————————————
export const ZHONG = {
  窗后: pose(4, { face: 0.6, ...legR(6, -6), ...legL(-4, -2), neck: 2, expression: "微笑", lookX: 0.5 }, (l) => ({ ...armL(10, 90, -10, "grip", l), ...armR(4, 20, 0, "relax", l) })),
  /** 举起茶杯冲她笑 */
  举杯: pose(2, { face: 0.6, ...legR(6, -6), ...legL(-4, -2), neck: 8, expression: "笑", lookX: 0.6, lookY: 0.2 }, (l) => ({ ...armL(64, 80, -20, "grip", l), ...armR(4, 20, 0, "relax", l) })),
};
