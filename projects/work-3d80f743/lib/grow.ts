// 间奏（64.02–72.02；小节线 64.023、66.024、68.025、70.026、72.027，每小节头上一下重的）。
// 2026-10-25 用户重做：「用过度的方法切两次地点……安排她救两个人，也是同样的，跑，拉，给」；第一版（一直在跑、背景横着拖成一片换地方）
// 用户：「屏幕向右太快了，把跑的去掉，改成站起来走两步场景切换，跳起来救人，给砖，之后站起来走两步，跳起来救人，给砖，场景用另外一种切换方式，
// 人物保持在中间。把时间都安排给 跳起来救人，给砖。最后一个给砖就不用站起来，直接切场景到回到她和小男孩抱在一起」。现在：
//   七岁的她跪着抱着妈妈的木牌望着天（⑧ 里画），64.013（间奏第一拍）溶成秋天早上的公交站，她十岁；
//   公交站上空飘着一个戴眼镜的大叔：她站着仰头望着他，蹲下攒劲，跳到最高才攥住他的脚踝，吊着拽下来，65.513「咚」跪在地上（拼命）；
//     从靴筒里抽出砖放进他手里，66.26 砖暖暖地亮起来，他抬头看她（温暖：第一次把「活下去」交出去）；
//   她站起来迈一步——这一步落下去溶成冬天傍晚的学校门口，她十六岁；刚飘起来的女学生，落脚一沉就跨上去攥住，68.013「咚」（小节线）单膝稳稳落地（坚定）；
//     砖放进她手里亮起来，两只手把她的手合拢包住，看着她笑——像当年妈妈把木牌给她（温柔：传下去）；
//   砖放进她手里、包住她的手以后，低头闭上眼抱住（和现在一样的姿势）；70.026 不站起来，溶回现在：清晨的街上，她跪着抱着小石头；71.02 她抬起头看着天。
// 换地方：叠化（用户：「改成不硬切，用叠加的方式过度」；试过背景横着拖、四周虚掉、暖光漫过去、直接切）。第二步落脚前后 0.4 秒，
// 两边整幅画面叠着过去（前后两个地方、两个年纪的她），她在画面正中、位置不变。两个地方画在 lib/years.ts，按她的坐标摆。
// 溶回现在：「这里切回去的时候，主角姿势相同」——包住女学生的手以后，她低头闭眼、两只手合成和现在抱着小石头一模一样的姿势；
// 溶的 0.42 秒里回忆这边的她直接用现在那边的同一个姿势（按胯对齐、一样大），只有四周和怀里的人在换。
// 被救的人：落地以前画在背景那一层（她跳起来攥住的手在他前面），落地以后坐在她前面（和前奏周磊一样）。

import { type CastSpec, castJoints, lookOf, youngChengtuo } from "@materials/剪纸角色/code/cast";
import { type Angles, type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf, swapSides } from "@materials/剪纸角色/code/chengtuo";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, aim, camLerp, kick, ph, toScreen } from "./cam";
import { ARMS, type LiveOpts, SMOOTH, hitch, live } from "./motion";
import { CHEN, ZHOU, armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";
import { brickHold } from "./props";
import { pose } from "./dawn";
import { SIGN_T, kidAt8 } from "./sign";
import { knifeAt } from "./mother";
import { STUDENT, UNCLE } from "./saved";
import { drawGlow } from "./world";

type V2 = [number, number];
const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const b = beatAt;

export const GROW_T = {
  start: SIGN_T.end,
  /**
   * 七岁的她跪着抱着木牌望着天（⑧ 里画，lib/sign.ts），不再做别的动作；间奏第一拍溶到公交站，十岁的她已经站在那里仰头望着飘着的大叔
   * （2026-10-26 用户：「把前面的几个镜头缩短时间给这几个镜头，但是需要对上音乐的节奏」：溶过去从 65.013 提前到间奏第一拍 64.013，
   * 多出来的 1 秒两次救人各分一半；接着「这个改成她拿着砖看天空，不做其他动作了」：插木牌、站起来、迈步都去掉）
   */
  step0: b(128),
  sw1: b(128),
  stop1: b(128),
  /**
   * 落脚时已经仰头看见飘着的大叔，站着望他一下；蹲下攒劲、蹬地；第 130 拍跳到最高攥住他的脚踝；
   * 吊在他脚踝上往下一拽，拽着他坠下来（0.5 秒，和前奏攥住周磊一样），「咚」跪下
   */
  look1: b(128),
  jump1: b(129.6),
  grab1: b(130),
  land1: b(131),
  /** 手伸进靴筒、抽出砖（小节线）；砖放进他手里，暖暖地亮起来 */
  dig1: b(131.74),
  pull1: b(132.02),
  give1: b(132.5),
  /**
   * 看着他、他抬头冲她哭着笑，停一下；站起来（眼睛还看着他）迈一步，这一步落下去就溶成学校门口，她十六岁
   * （2026-10-26 用户：「我感觉应该做减法」：原来站起来走两步才换，省下的一拍给学校门口）
   */
  rise1: b(133.4),
  step1: b(134),
  sw2: b(134),
  stop2: b(134),
  /** 迈出去时已经仰头看见刚飘起来的女学生，站着望她一下；浅浅一蹲、一步跨上去攥住；「咚」单膝稳稳落地（小节线） */
  look2: b(134),
  jump2: b(135.3),
  grab2: b(135.62),
  land2: b(136),
  /** 心疼地看她一眼，掏砖；砖放进她手里亮起来；两只手把她的手合拢包住，看着她笑，女学生抬头哭着笑（时间留给这里） */
  dig2: b(136.84),
  pull2: b(137.14),
  give2: b(137.66),
  wrap: b(137.84),
  /** 低头闭眼抱住（和现在抱着小石头一样的姿势） */
  hug: b(139.3),
  /** 不站起来，溶回现在（小节线；名字沿用以前的「跪下」，act3 按它溶） */
  kneel: b(140),
  dis1: b(140) + 0.42,
  /** 现在：她抬起头看天 */
  look: b(142),
  end: b(144),
};
const G = GROW_T;
const SWITCHES = [G.sw1, G.sw2];

// ——— 换地方：叠化 ———
/** 在第几个地方：0 十二年前的街，1 公交站，2 学校门口 */
export const segAt = (t: number) => (t < G.sw1 ? 0 : t < G.sw2 ? 1 : 2);
/** 一层画面：哪个地方、几岁的她 */
export interface Layer {
  seg: number;
  age: number;
}
/** 换地方叠化多久的一半（以第二步落脚为中心） */
const DIS = 0.2;
/** 换地方的那 0.4 秒：from 那一层在下面，to 那一层按 w 叠上去 */
export function growDissolve(t: number): { from: Layer; to: Layer; w: number } | null {
  for (let i = 0; i < SWITCHES.length; i++) {
    const s = SWITCHES[i];
    if (t > s - DIS && t < s + DIS) return { from: { seg: i, age: i === 0 ? 7 : 10 }, to: { seg: i + 1, age: AGES[i][1] }, w: E.io(ph(t, s - DIS, s + DIS)) };
  }
  return null;
}

// ——— 七到十九岁的她 ———
/**
 * 十三岁起是现在的她（大人的头身比）照着年纪缩小（SCALE[age − 7]；七到十二岁的身高在素材库 youngChengtuo 里）。
 * 原来七岁只有 0.58（三四岁的个子）、十岁 0.7，头身比和十九岁的她一样（用户 2026-10-28：「先改沉沉」——小时候的她像大人的缩小版）。
 * 十六岁 0.93 没变（学校门口溶回现在的镜头按它算）
 */
const SCALE = [0.75, 0.78, 0.81, 0.835, 0.85, 0.865, 0.88, 0.9, 0.915, 0.93, 0.96, 0.98, 1];
/**
 * 七到十二岁：素材库的 youngChengtuo（七岁是小孩的头身比，头、腿长、裤腿宽一年年往十三岁过渡，身高按年纪；
 * 靴子还是妈妈那双，十岁穿上藏青外套）。原来写在这里，2026-10-28 搬进素材库（资源面板里「小时候的秤砣」能调年纪看）
 */
const KIDS: CastSpec[] = [7, 8, 9, 10, 11, 12].map(youngChengtuo);
/** 十三岁起是现在的她（素材库的秤砣：齐刘海长直发、藏青外套），照着年纪缩小；围巾、手套、袖标一年年添上 */
const teenItems = (age: number, bricks = 2) => ({ coat: true, scarf: age >= 15, gloves: age >= 16, band: age >= 17, boots: true, bricks });

/** 这一刻几岁：十二年前七岁，公交站十岁，学校门口十六岁（叠化的时候长大） */
const AGES: [number, number][] = [
  [G.sw1, 10],
  [G.sw2, 16],
];
export function ageAt(t: number) {
  let a = 7;
  for (const [t0, v] of AGES) if (t >= t0) a = v;
  return a;
}
/** 画这一刻的她（人这一层，世界坐标）：root 是两脚之间的地面 */
function drawGirl(g: CanvasRenderingContext2D, pose: PoseIn, root: V2, age: number, z: number, opts: Parameters<typeof drawChengtuo>[2] = {}) {
  if (age <= 12) {
    drawPerson(g, KIDS[age - 7], pose, root[0], root[1], z, opts);
    return;
  }
  const s = SCALE[age - 7];
  g.save();
  g.translate(root[0], root[1]);
  g.scale(s, s);
  drawChengtuo(g, pose, { line: 1 / Math.sqrt(Math.max(0.3, z * s)), ...opts });
  g.restore();
}
/** 她的关节（世界坐标里相对根） */
function girlJoints(pose: PoseIn, age: number) {
  if (age <= 12) return castJoints(KIDS[age - 7], pose);
  const s = SCALE[age - 7];
  const j = jointsOf(pose);
  const out = {} as typeof j;
  for (const k of Object.keys(j) as (keyof typeof j)[]) out[k] = [j[k][0] * s, j[k][1] * s];
  return out;
}
const scaleOf = (age: number) => (age <= 12 ? KIDS[age - 7].scale : SCALE[age - 7]);
/** 这个年纪站直时胯离地多高（世界单位）：小孩腿短（legLength） */
const standHip = (age: number) => (age <= 12 ? (65.1 + 215.4 * (KIDS[age - 7].legLength ?? 1)) * KIDS[age - 7].scale : 280 * SCALE[age - 7]);

// ——— 她的动作 ———
/** 前奏那套姿势是朝左写的：朝右时翻 face，眼睛看的左右也翻过来 */
const R = (p: Angles): Angles => ({ ...p, face: 1, ...(typeof p.lookX === "number" ? { lookX: -p.lookX } : {}) });
/** 每个年纪走路的脸：十岁、十六岁坚定，眼睛看着前面 */
const FACE10: Angles = { expression: "坚定", tears: 0.15, lookX: 0.5, lookY: -0.1, neck: 6 };
const FACE16: Angles = { expression: "坚定", lookX: 0.5, lookY: -0.1, neck: 6 };
/** 迈一步落下去（换地方）时已经仰头看见要救的人 */
const UP16: Angles = { ...FACE16, lookX: 0.2, lookY: -1, neck: 22 };
/** 跳起来往前飞多远（素材库单位：十岁的她拼命跳得高、往前冲一点；十六岁一步跨上去） */
const LEAP1 = 240;
const LEAP2 = 200;
/** 站着仰头望着要救的人（L 在前，左右对调、钉 L） */
const LOOKUP: Angles = R(swapSides(CHEN.仰头));
/** 十六岁浅浅一蹲 */
const GATHER2: Angles = { ...CHEN.蹲, lean: 22, ...legR(54, -66), ...legL(46, -58), thighL: 0.8, thighR: 0.8 };
/** 包住女学生的手以后：抬眼看着她，温柔地笑（不站起来，直接溶回现在） */
const HOLD: Angles = { ...R(CHEN.跪_放), lean: 30, neck: 6, expression: "微笑", smile: 0.75, tears: 0.4, lookX: 0.4, lookY: 0.05 };
/** 低头闭眼抱住：和现在抱着小石头的「抱紧」同一组角度（lib/mother.ts 的 CHEN_P.抱紧，风也一样大），溶回现在时姿势一模一样 */
const HUG: Angles = pose(26, { face: 1, ...legR(84, -96, 0), ...legL(36, -112, 0), thighR: 1, neck: -18, expression: "难过", blink: 0.9, lookY: 0.6, wind: 0.6 }, (l) => ({
  ...armL(60, 90, 0, "grip", l),
  ...armR(70, 84, 0, "grip", l),
}));
const KEYS: MoveKey[] = [
  // 七岁那一层在 ⑧ 里画（跪着抱着木牌望着天，lib/sign.ts 的 kidAt8）；这里从十岁开始：
  // 公交站：溶过来时她已经站在那里仰头望着飘着的大叔（和七岁的她望天叠在一起）→ 蹲下攒劲（拉满的弓）→ 蹬地弹出去 →
  // 跳到最高攥住他的脚踝 → 吊在他脚踝上往下一拽（膝盖收起来，他还往上飘，坠得慢）→ 越坠越快，带着他摔下来，「咚」跪下
  { t: G.start, x: 0, p: { ...LOOKUP, tears: 0.2 } },
  { t: G.jump1 - 0.32, plant: "L", p: { ...LOOKUP, tears: 0.2 } },
  { t: G.jump1 - 0.08, ease: "inOut", plant: "L", squash: 0.1, p: { ...R(swapSides(CHEN.蹲)), tears: 0.2 } },
  { t: G.jump1 + 0.04, ease: "in", squash: -0.1, dx: -LEAP1 * 0.25, p: { ...R(CHEN.起跳), lift: 160 } },
  { t: G.grab1, ease: "out", squash: -0.02, dx: -LEAP1 * 0.4, p: { ...R(CHEN.抓住), lift: 340 } },
  { t: G.grab1 + 0.2, ease: "inOut", squash: -0.02, dx: -LEAP1 * 0.1, p: { ...R(CHEN.拽着坠), lift: 290 } },
  { t: G.land1 - 0.02, ease: "in", squash: -0.03, dx: -LEAP1 * 0.25, p: { ...R(CHEN.拽着坠), lift: 0 } },
  { t: G.land1 + 0.06, ease: "out", squash: 0.14, plant: "L", p: { ...R(CHEN.跪_缓冲), lift: 0, handR: "open" } },
  // 跪着喘一口气、心疼地看着他 → 弯腰手伸进前面那只靴筒 → 抽出砖（很沉）→ 身子往前倾递过去，放进他搭在膝盖上的手里
  // （递是一口气送过去：抽出 → 递 加速、递 → 放 减速，中间不停）
  { t: G.land1 + 0.24, ease: "inOut", squash: 0, plant: "L", p: { ...R(CHEN.单膝跪), expression: "心疼", tears: 0.3 } },
  { t: G.dig1, ease: "inOut", plant: "R", p: R(CHEN.跪_掏砖) },
  { t: G.pull1, ease: "inOut", plant: "R", p: R(CHEN.跪_抽出) },
  { t: (G.pull1 + G.give1) / 2, ease: "in", plant: "R", p: R(CHEN.跪_递) },
  { t: G.give1, ease: "out", plant: "R", p: R(CHEN.跪_放) },
  // 放下了：手一松开就垂下来，身子收回来一点，含着泪冲他笑（第一次把「活下去」交出去）；他抬头冲她哭着笑，停一下
  { t: G.give1 + 0.2, ease: "out", plant: "R", p: { ...R(CHEN.跪_看他), expression: "哭着笑", tears: 0.45, lookX: 0.4, lookY: 0.3 } },
  { t: G.rise1, ease: "inOut", plant: "R", p: { ...R(CHEN.跪_看他), expression: "哭着笑", smile: 0.7, tears: 0.45, lookX: 0.4, lookY: 0.4, neck: -4 } },
  // 站起来（眼睛还看着他）迈一步，迈出去时抬头看向前上方，这一步落下去就换到学校门口（十六岁）
  { t: G.rise1 + 0.16, ease: "in", plant: "R", p: { ...R(CHEN.起身), expression: "微笑", tears: 0.3 } },
  { t: G.sw2 - 0.08, ease: SMOOTH, plant: "R", p: { ...R(swapSides(CHEN.走_经过)), ...FACE10, lookY: -0.6, neck: 14 } },
  { t: G.sw2, ease: SMOOTH, squash: 0.03, plant: "R", items: teenItems(16), p: { ...R(CHEN.走_落地), ...UP16 } },
  // 学校门口：仰头看见刚飘起来的女学生，站着望她一下 → 浅浅一蹲、一步跨上去攥住她的脚踝 → 带着她落下来，单膝稳稳跪住。
  // 迈的是近处那只脚（L 在前），站、蹲都用左右对调的、钉 L
  { t: G.sw2 + 0.22, ease: "out", plant: "L", p: { ...LOOKUP, expression: "坚定" } },
  { t: G.jump2 - 0.3, plant: "L", p: { ...LOOKUP, expression: "坚定" } },
  { t: G.jump2 - 0.08, ease: "inOut", plant: "L", squash: 0.07, p: { ...R(swapSides(GATHER2)), expression: "坚定", teeth: 0, lookX: 0.2, lookY: -1 } },
  { t: G.jump2 + 0.04, ease: "in", squash: -0.07, dx: -LEAP2 * 0.25, p: { ...R(CHEN.起跳), lift: 120, expression: "坚定", open: 0.1 } },
  { t: G.grab2, ease: "out", squash: -0.02, dx: -LEAP2 * 0.45, p: { ...R(CHEN.抓住), lift: 230, expression: "坚定" } },
  { t: G.land2 - 0.02, ease: "in", squash: -0.02, dx: -LEAP2 * 0.3, p: { ...R(CHEN.拽着坠), lift: 0, expression: "坚定" } },
  { t: G.land2 + 0.06, ease: "out", squash: 0.08, plant: "L", p: { ...R(CHEN.跪_缓冲), lift: 0, handR: "open", expression: "坚定" } },
  // 心疼地看她一眼 → 掏砖、递过去，放进她手里（比公交站那次稳一点）。她比十岁时高、女学生坐得近，身子不用压那么低
  // （原来照十岁那次前倾 46°，头压到女学生的头上；抽出和递只隔 0.01 秒，一下跳过去）
  { t: G.land2 + 0.26, ease: "inOut", squash: 0, plant: "L", p: { ...R(CHEN.单膝跪), expression: "心疼" } },
  { t: G.dig2, ease: "inOut", plant: "R", p: R(CHEN.跪_掏砖) },
  { t: G.pull2, ease: "inOut", plant: "R", p: R(CHEN.跪_抽出) },
  { t: (G.pull2 + G.give2) / 2, ease: "in", plant: "R", p: { ...R(CHEN.跪_递), lean: 24 } },
  { t: G.give2, ease: "out", plant: "R", items: teenItems(16, 1), p: { ...R(CHEN.跪_放), lean: 28 } },
  // 两只手把她的手合拢包住（手按 IK，见 girlAt），抬眼看着她，温柔地笑；不站起来，四周虚掉，溶回现在
  { t: G.wrap + 0.2, ease: "inOut", plant: "R", p: { ...HOLD, smile: 0.4, lookY: 0.15, neck: 2 } },
  { t: G.hug, ease: "inOut", plant: "R", p: HOLD },
  // 低头闭上眼抱住（两只手按 IK 合到和现在抱着小石头一样的地方，见 girlAt），之后溶回现在
  { t: G.kneel - 0.06, ease: "inOut", plant: "R", p: HUG },
  { t: G.end, plant: "R", p: HUG },
];
const OPTS: Omit<LiveOpts, "look"> = {
  base: { wind: 0.4, chestL: "under", chestR: "under" },
  idle: true,
  seed: 61,
  springs: ARMS,
  follow: 0,
  // 摔下来跪住以后喘一口气：肩膀随呼吸起伏
  add: (t: number, o: Record<string, number>) => {
    const pant = ph(t, G.land1 + 0.1, G.land1 + 0.2) * (1 - ph(t, G.land1 + 0.3, G.land1 + 0.4)) + ph(t, G.land2 + 0.1, G.land2 + 0.2) * (1 - ph(t, G.land2 + 0.3, G.land2 + 0.4));
    if (pant > 0) {
      const h = Math.sin(t * 9) * pant;
      o.lean += 2.2 * h;
      o.neck -= 1.6 * h;
    }
  },
};
/** 每个年纪一套（头、靴子的比例不一样，踩地的高度跟着算）；角度、步子都一样 */
const LIVES = new Map<number, ReturnType<typeof live>>();
function moveOf(age: number) {
  const key = age <= 12 ? age : 13;
  let m = LIVES.get(key);
  if (!m) LIVES.set(key, (m = live(KEYS, { ...OPTS, look: age <= 12 ? lookOf(KIDS[age - 7]) : CHENGTUO })));
  return m;
}

/** 她的根（世界里两脚之间的地面）：每一段按那时候的年纪（身高）缩放；朝右，素材库按朝左算的步子取反 */
let ROOT_KEYS: { t: number; X: number; x: number; s: number; age: number }[] | null = null;
function rootAt(t: number): number {
  if (!ROOT_KEYS) {
    const x0 = kidAt8(G.start).root[0];
    const ts = [G.start, ...AGES.map(([t0]) => t0), G.end + 1];
    ROOT_KEYS = [];
    let X = x0;
    for (let i = 0; i < ts.length - 1; i++) {
      const age = ageAt(ts[i] + 1e-4);
      const s = scaleOf(age);
      const x = moveOf(age)(ts[i]).x;
      ROOT_KEYS.push({ t: ts[i], X, x, s, age });
      X += -(moveOf(age)(ts[i + 1]).x - x) * s;
    }
  }
  let k = ROOT_KEYS[0];
  for (const r of ROOT_KEYS) if (r.t <= t) k = r;
  return k.X - (moveOf(k.age)(t).x - k.x) * k.s;
}

/** 她这一刻没加 IK 的样子（姿势、根、年纪、关节）；age 给了就按那个年纪画（换地方溶过去时） */
function girlBase(t: number, ageOverride?: number) {
  const age = ageOverride ?? ageAt(t);
  const pose: PoseIn = { ...moveOf(age)(t).pose };
  // 换地方叠化的那几帧不随机眨眼（抱住时闭眼是表情本身，不管）
  if (SWITCHES.some((c) => Math.abs(t - c) < 0.25)) pose.expr = { ...(pose.expr as object), blink: 0 } as PoseIn["expr"];
  let root: V2 = [rootAt(t), 0];
  let pose2 = pose;
  // 溶回现在：直接用现在那边的同一个姿势（同一个 PoseIn），胯放在她原来胯的地方（按胯对齐，脚、膝盖也就落在原来的地方）
  if (t >= G.kneel && age >= 13) {
    const j = girlJoints(pose, age);
    const hip: V2 = [root[0] + j.hip[0], root[1] + j.hip[1]];
    pose2 = { ...(knifeAt(t).chen.pose as object) } as PoseIn;
    const jn = girlJoints(pose2, age);
    root = [hip[0] - jn.hip[0], hip[1] - jn.hip[1]];
  }
  return { age, pose: pose2, root, j0: girlJoints(pose2, age) };
}
const palmOf = (k: ReturnType<typeof girlBase>, side: "L" | "R"): V2 => add(k.root, (side === "L" ? k.j0.palmL : k.j0.palmR) as V2);

// ——— 被她拽下来的两个人（高潮的人链里会回来；人在 lib/saved.ts） ———
export { STUDENT, UNCLE };
/** 前奏周磊那一套，朝左（朝着走过来的她） */
const U2: Record<string, Angles> = {
  飘: { ...ZHOU.飘, face: -0.6 },
  一惊: { ...ZHOU.一惊, face: -0.6 },
  被拽: { ...ZHOU.被拽, face: -0.65 },
  坐下: { ...ZHOU.坐下, face: -0.75 },
  瘫坐: { ...ZHOU.瘫坐, face: -0.8 },
  坐_一沉: { ...ZHOU.坐_一沉, face: -0.8 },
  坐_托稳: { ...ZHOU.坐_托稳, face: -0.8 },
  坐_捧着哭: { ...ZHOU.坐_捧着哭, face: -0.8 },
  坐_哭着笑: { ...ZHOU.坐_哭着笑, face: -0.8, lookX: -0.45 },
  /** 她走了：抬着头往右看她，把砖抱在怀里 */
  坐_望她: { ...ZHOU.坐_抱砖, face: -0.8, neck: 6, expression: "哭着笑", lookX: 0.6, lookY: -0.1 },
};
/** 一个被拽下来的人的整套动作：飘着（闭眼哭）→ 被攥住一惊 → 被拽下来 → 一屁股坐在地上 → 砖放进手里一沉 → 托稳 → after */
function savedKeys(T: { grab: number; land: number; give: number }, P: Record<string, Angles>, after: MoveKey[]): MoveKey[] {
  return [
    { t: 60, x: 0, p: P.飘 },
    { t: T.grab - 0.03, p: P.飘 },
    { t: T.grab + Math.min(0.08, (T.land - T.grab) * 0.3), ease: "out", p: P.一惊 },
    { t: T.land - Math.min(0.08, (T.land - T.grab) * 0.3), ease: "inOut", p: P.被拽 },
    { t: T.land + 0.04, ease: "out", squash: 0.08, p: P.坐下 },
    { t: T.land + 0.3, ease: "inOut", squash: 0, p: P.瘫坐 },
    { t: T.give - 0.04, p: P.瘫坐 },
    { t: T.give, ease: "linear", p: { ...P.瘫坐, handL: "flat" } },
    { t: T.give + 0.1, ease: "out", squash: 0.025, p: P.坐_一沉 },
    { t: T.give + 0.24, ease: "inOut", squash: 0, p: P.坐_托稳 },
    ...after,
  ] as MoveKey[];
}
/** 坐着哭：肩膀一抽一抽（砖放进手里就停） */
const sobAdd = (T: { land: number; give: number }) => (t: number, o: Record<string, number>) => {
  const sob = ph(t, T.land + 0.3, T.land + 0.45) * (1 - ph(t, T.give - 0.1, T.give));
  if (sob > 0) {
    const h = sob * hitch(t, 0.5);
    o.lean += 2.5 * h;
    o.neck -= 2 * h;
  }
};
const uncleMove = live(
  savedKeys({ grab: G.grab1, land: G.land1, give: G.give1 }, U2, [
    // 看着手里亮起来的砖，眼泪掉下来 → 抬起头看她，哭着笑（她还跪着，两个人对看一下）→ 她站起来走了，望着她
    { t: G.give1 + 0.3, ease: "inOut", p: U2.坐_捧着哭 },
    { t: G.rise1 - 0.02, ease: "inOut", p: U2.坐_哭着笑 },
    { t: G.rise1 + 0.3, ease: "inOut", p: U2.坐_望她 },
    { t: 72, p: U2.坐_望她 },
  ]),
  { look: lookOf(UNCLE), base: { wind: 0.4 }, idle: true, seed: 73, springs: ARMS, follow: 0, add: sobAdd({ land: G.land1, give: G.give1 }) },
);
/** 女学生：同一套，脸朝左；被两只手包住时抬起头看她，哭着笑 */
const S2: Record<string, Angles> = {
  ...U2,
  飘: { ...ZHOU.飘, face: -0.6, expression: "闭眼", sad: 0.9, tears: 0.7 },
  一惊: { ...ZHOU.一惊, face: -0.6, expression: "吓一跳" },
  坐_抬头: { ...ZHOU.坐_托稳, face: -0.8, neck: 8, expression: "含泪", lookX: -0.5, lookY: -0.3 },
  坐_哭着笑: { ...ZHOU.坐_哭着笑, face: -0.8, neck: 10, lookX: -0.5, lookY: -0.3 },
};
const studentMove = live(
  savedKeys({ grab: G.grab2, land: G.land2, give: G.give2 }, S2, [
    { t: G.wrap + 0.2, ease: "inOut", p: S2.坐_抬头 },
    { t: G.wrap + 0.6, ease: "inOut", p: S2.坐_哭着笑 },
    { t: 72, p: S2.坐_哭着笑 },
  ]),
  { look: lookOf(STUDENT), base: { wind: 0.4 }, idle: true, seed: 71, springs: ARMS, follow: 0, add: sobAdd({ land: G.land2, give: G.give2 }) },
);

/** 摔下来坐在地上以后比她靠镜头一点（画面上低一点、画在她前面：她走开时从他身后经过，和前奏一样） */
const SIT_Y = 24;
/**
 * 一个被拽下来的人飘在哪、怎么被拽下来、坐在哪（世界坐标，她的坐标系）：
 * 攥住那一刻他的脚踝就在她跳到最高时那只手的地方；之前慢慢往上飘；攥住以后脚踝跟着她的手往下，落地时在她跪下来那只手的地方，一屁股坐下
 */
function makeSaved(spec: CastSpec, move: ReturnType<typeof live>, T: { grab: number; land: number }, rise: number, closer: number) {
  let A0: V2 | null = null;
  let END: V2 | null = null;
  const grabPt = () => (A0 ??= add(palmOf(girlBase(T.grab), "R"), [4, -6]));
  const endPt = () => (END ??= add(palmOf(girlBase(T.land + 0.06), "R"), [8, 0]));
  const wob = (t: number): V2 => [18 * Math.sin(t * 1.3), 6 * Math.sin(t * 2.1)];
  const ankle = (t: number): V2 => {
    const a0 = grabPt();
    if (t <= T.grab) {
      const w = wob(t);
      const w0 = wob(T.grab);
      return [a0[0] + w[0] - w0[0], a0[1] + rise * (T.grab - t) + w[1] - w0[1]];
    }
    // 攥住以后：横着匀匀地往她跪下来的地方挪，竖着越坠越快（原来横竖一起越来越快，最后 0.1 秒一下甩到她右边）
    const e = endPt();
    const u = ph(t, T.grab, T.land);
    return [a0[0] + (e[0] - a0[0]) * E.io(u), a0[1] + (e[1] - a0[1]) * E.in2(u)];
  };
  const at = (t: number) => {
    const p: PoseIn = { ...move(t).pose };
    const j = castJoints(spec, p);
    if (t < T.land) {
      const a = ankle(t);
      return { pose: p, root: [a[0] - j.ankleL[0], a[1] - j.ankleL[1]] as V2 };
    }
    const a = ankle(T.land - 1e-4);
    const j0 = castJoints(spec, { ...move(T.land - 1e-4).pose });
    const x = a[0] - j0.ankleL[0];
    const y0 = a[1] - j0.ankleL[1];
    const u = E.out(ph(t, T.land, T.land + 0.08));
    // 摔下来以后往她那边挪一点（2026-10-25 用户：「主角离被救的人太远了，贴近一点」）
    return { pose: p, root: [x - closer * E.io(ph(t, T.land, T.land + 0.3)), y0 * (1 - u) + SIT_Y * u] as V2 };
  };
  return { ankle, at };
}
const UNC = makeSaved(UNCLE, uncleMove, { grab: G.grab1, land: G.land1 }, 60, 70);
const STU = makeSaved(STUDENT, studentMove, { grab: G.grab2, land: G.land2 }, 110, 80);

/** 她落地跪下的地方（两个地方按它摆） */
export const landX = (i: 1 | 2) => rootAt(i === 1 ? G.land1 + 0.3 : G.land2 + 0.3);

/** 她这一刻（世界坐标）：姿势、根、年纪；攥人、递砖、包住女学生的手按 IK */
export function girlAt(t: number, ageOverride?: number) {
  const { age, pose, root, j0 } = girlBase(t, ageOverride);
  const s = scaleOf(age);
  // 朝右（face > 0）整套镜像：角色坐标 x 取反、再除以身高
  const loc = (p: V2): V2 => [-(p[0] - root[0]) / s, (p[1] - root[1]) / s];
  const ik = (side: "L" | "R", to: V2, w: number, shape?: string) => {
    const k = side === "L" ? "armL" : "armR";
    pose[k] = { ...(pose[k] as object), to: loc(to), ik: w, ...(shape ? { shape } : {}) } as PoseIn["armL"];
  };
  // 第一拍：两只手扶着木牌插进靴筒，插到底松开
  // 跳到最高攥住他（她）的脚踝，带着落下来，落地就松手
  const w1 = E.io(ph(t, G.jump1 + 0.1, G.grab1 - 0.02)) * (1 - E.io(ph(t, G.land1 - 0.02, G.land1 + 0.1)));
  if (w1 > 0.001) ik("R", UNC.ankle(t), w1, "grip");
  const w2 = E.io(ph(t, G.jump2 + 0.06, G.grab2 - 0.02)) * (1 - E.io(ph(t, G.land2 - 0.02, G.land2 + 0.1)));
  if (w2 > 0.001) ik("R", STU.ankle(t), w2, "grip");
  // 递砖：拿着砖的手按 IK 送到他（她）搭在膝盖上的那只手上（挪近了以后砖正好放进手里）
  const putTo = (sv: typeof UNC, spec: CastSpec, give: number) => {
    const w = E.io(ph(t, give - 0.22, give - 0.04)) * (1 - E.io(ph(t, give + 0.06, give + 0.2)));
    if (w < 0.001) return;
    const sp = sv.at(t);
    const sj = castJoints(spec, sp.pose);
    ik("L", add(sp.root, [sj.palmL[0] - 4, sj.palmL[1] - 14]), w);
  };
  putTo(UNC, UNCLE, G.give1);
  putTo(STU, STUDENT, G.give2);
  // 两只手把女学生捧着砖的手合拢包住；抱住时松开
  const ww = E.io(ph(t, G.wrap - 0.04, G.wrap + 0.22)) * (1 - E.io(ph(t, G.hug, G.hug + 0.2)));
  if (ww > 0.001 && t < G.kneel) {
    const c = studentBrick(t);
    ik("L", add(c, [-34, 10]), ww, "open");
    ik("R", add(c, [30, -2]), ww, "open");
  }
  // 抱住：两只手合到和现在抱着小石头一模一样的地方（按胯换算现在那边 IK 的目标）
  const wh = E.io(ph(t, G.hug, G.kneel - 0.04));
  if (wh > 0.001 && t < G.kneel && age >= 13) {
    const now = knifeAt(t).chen.pose;
    const nj = jointsOf(now);
    const nHip: V2 = [-nj.hip[0], nj.hip[1]];
    const pHip: V2 = [-j0.hip[0] / s, j0.hip[1] / s];
    for (const k of ["armL", "armR"] as const) {
      const a = now[k] as { to?: V2; ik?: number } | undefined;
      if (!a?.to) continue;
      pose[k] = { ...(pose[k] as object), to: [pHip[0] + a.to[0] - nHip[0], pHip[1] + a.to[1] - nHip[1]], ik: wh * (a.ik ?? 1) } as PoseIn["armL"];
    }
  }
  const j = girlJoints(pose, age);
  return { pose, root, age, j, j0, palmR: add(root, j.palmR as V2), palmL: add(root, j.palmL as V2), head: add(root, j.head as V2) };
}

/** 女学生手里那块砖的地方（她近处那只手的掌心，世界坐标） */
function studentBrick(t: number): V2 {
  const s = STU.at(t);
  const j = castJoints(STUDENT, s.pose);
  return add(s.root, [j.palmL[0] - 4, j.palmL[1] - 18]);
}

// ——— 画 ———
const UNCLE_BRICK = { p: null as V2 | null };
const STUDENT_BRICK = { p: null as V2 | null };
/** 被她拽下来的那个人：落地以前画在背景那一层（她跳起来攥住的手在他前面），落地以后坐在她前面（front） */
export function drawSaved(g: CanvasRenderingContext2D, t: number, z: number, seg: number, front: boolean, late: (() => void)[]) {
  if (seg === 1 && front === t >= G.land1) {
    const u = UNC.at(t);
    const warm = () => E.io(ph(t, G.give1 + 0.02, G.give1 + 0.5));
    drawPerson(g, UNCLE, u.pose, u.root[0], u.root[1], z, t >= G.give1 ? { hold: { L: brickHold(warm, UNCLE_BRICK, late) } } : {});
  } else if (seg === 2 && front === t >= G.land2) {
    const s = STU.at(t);
    const warm = () => E.io(ph(t, G.give2 + 0.02, G.give2 + 0.5));
    drawPerson(g, STUDENT, s.pose, s.root[0], s.root[1], z, t >= G.give2 ? { hold: { L: brickHold(warm, STUDENT_BRICK, late) } } : {});
  }
}
/** 这一层画面里有没有人坐在她前面（落地以后）：有的话是那个地方，没有是 0 */
export const frontSeg = (t: number, seg: number) => ((seg === 1 && t >= G.land1) || (seg === 2 && t >= G.land2) ? seg : 0);
/** 她胸口在哪（世界坐标）：暖光从这里漫开 */
export function girlChest(t: number): V2 {
  const k = girlBase(t);
  return add(k.root, [(k.j0.hip[0] + k.j0.neck[0]) / 2, (k.j0.hip[1] + k.j0.neck[1]) / 2] as V2);
}

/** 她（木牌插进靴筒以前抱在怀里；抽出砖到放进别人手里之间砖在她手上）。托着的砖放进 late，等坐在她前面的人画完再画 */
export function drawGrowFront(g: CanvasRenderingContext2D, t: number, z: number, late: (() => void)[], ageOverride?: number) {
  const k = girlAt(t, ageOverride);
  // 脚下一小块影子（跳起来时变淡、变小）
  const hip = -k.j.hip[1];
  const up = Math.max(0, hip - standHip(k.age)) / 300;
  g.save();
  g.fillStyle = `rgba(96,62,70,${0.22 * Math.max(0.3, 1 - up)})`;
  g.beginPath();
  g.ellipse(k.root[0] + 10, 6, (k.age === 7 ? 120 : 120 * (0.6 + (0.4 * (k.age - 7)) / 12)) * Math.max(0.5, 1 - up * 0.5), 18, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  const brickIn = (t >= G.dig1 + 0.04 && t < G.give1) || (t >= G.dig2 + 0.04 && t < G.give2);
  drawGirl(g, k.pose, k.root, k.age, z, {
    hold: brickIn ? { L: brickHold(() => 0, { p: null }, late) } : undefined,
  });
}

/** 砖亮起来：一团暖光从他（她）手里的砖上漫开（画在最上面，lighter；画布像素坐标） */
export function drawGrowGlow(g: CanvasRenderingContext2D, t: number, px: number, seg: number) {
  const one = (at: { p: V2 | null }, t0: number, t1: number) => {
    if (!at.p || t < t0 || t > t1) return;
    const a = E.out(ph(t, t0, t0 + 0.35)) * (1 - ph(t, t1 - 0.25, t1));
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    drawGlow(g, at.p[0], at.p[1], 260 * px * (1 + 0.15 * Math.sin(t * 5)), 0.55 * a);
    drawGlow(g, at.p[0], at.p[1], 90 * px, 0.7 * a);
    g.restore();
  };
  if (seg === 1) one(UNCLE_BRICK, G.give1, G.sw2 + DIS);
  if (seg === 2) one(STUDENT_BRICK, G.give2, G.dis1);
}

// ——— 镜头 ———
/** 走着的时候她在画面正中，脚下的地面在画面 1500；倍数一个地方比一个地方近，只推不拉：十二年前和公交站 1.2，第一次递砖推到 1.5，第二次推到 1.8 */
const Z0 = 1.2;
const Z1 = 1.5;
const Z2 = 1.8;
const GY = 1500;
/** 镜头跟着她的根走：按 0.12 秒的高斯平滑（不追每一步的起伏，停下来时也是慢慢停），不滞后 */
let TRACK: Float64Array | null = null;
const TR0 = 63;
const TR1 = 72.5;
function trackX(t: number) {
  if (!TRACK) {
    const n = Math.ceil((TR1 - TR0) * 60);
    const raw = new Float64Array(n + 1);
    for (let i = 0; i <= n; i++) raw[i] = rootAt(Math.max(G.start, TR0 + i / 60));
    const sig = 0.12 * 60;
    const K = Math.ceil(sig * 3);
    const w: number[] = [];
    let ws = 0;
    for (let k = -K; k <= K; k++) {
      const v = Math.exp(-(k * k) / (2 * sig * sig));
      w.push(v);
      ws += v;
    }
    TRACK = new Float64Array(n + 1);
    for (let i = 0; i <= n; i++) {
      let acc = 0;
      for (let k = -K; k <= K; k++) acc += w[k + K] * raw[Math.max(0, Math.min(n, i + k))];
      TRACK[i] = acc / ws;
    }
  }
  const u = Math.max(0, Math.min(TRACK.length - 1 - 1e-6, (t - TR0) * 60));
  const i = Math.floor(u);
  return TRACK[i] + (TRACK[i + 1] - TRACK[i]) * (u - i);
}
/** 她在画面正中（up：镜头顺着她的视线往上抬多少画面像素） */
const midFrame = (t: number, z: number, up = 0) => aim(trackX(t), 0, 540, GY + up, z);
/** 递砖那一下砖在哪（她递出去的那只手，世界坐标） */
const givePt = (t: number): V2 => palmOf(girlBase(t), "L");

/**
 * 间奏的镜头（以⑧的镜头为底）：
 *   出发：⑧推近的取景（2.1 倍）跟着她站起来走，打开到 1.2 倍，她在画面正中；换地方时镜头照常跟着她走（四周虚掉、换掉）。
 *   公交站：她仰头时镜头顺着她的视线往上抬（倍数不变），把飘着的大叔框进来；跳、攥住只跟着平移；「咚」往下一沉、推近 5%、重重一震；
 *     递砖：柔和起步、越推越慢地推到砖上（→ 1.5 倍）；她站起来走，镜头接着让她在画面正中（不往回拉）。
 *   学校门口：1.5 倍，同样的抬、跟、「咚」（轻一点）；递砖、包住她的手：推得更慢、更近（→ 1.8 倍），中心一开始就对准她，再溶回现在。
 */
export function growCam(t: number, base: (t: number) => Cam): Cam {
  if (t <= G.start) return base(t);
  // 她跪着望天时镜头慢慢退开、顺着她的视线往上抬，溶过去正好是公交站里她仰头望着大叔的取景
  const up1 = 230 * E.io(ph(t, G.sw1 - 0.5, G.sw1 + 0.5));
  let c = camLerp(base(t), midFrame(t, Z0, up1), E.io(ph(t, G.start, G.sw1 + 0.25)));
  c = { ...c, z: c.z * (1 + 0.05 * kick(t, G.land1, 0.12)), y: c.y - (26 * kick(t, G.land1, 0.1)) / c.z };
  // 第一次递砖：推到砖上
  const gp = givePt(G.give1);
  c = camLerp(c, aim(gp[0] + 20, gp[1], 540, 1180, Z1), E.settle(ph(t, G.land1 + 0.05, G.give1 + 0.3)));
  // 站起来迈一步：她回到画面正中；换到学校门口时顺着她的视线往上抬
  const up2 = 300 * E.io(ph(t, G.sw2 - 0.1, G.sw2 + 0.5));
  c = camLerp(c, midFrame(t, Z1, up2), E.io(ph(t, G.rise1, G.step1 + 0.25)));
  c = { ...c, z: c.z * (1 + 0.03 * kick(t, G.land2, 0.1)), y: c.y - (14 * kick(t, G.land2, 0.1)) / c.z };
  // 第二次递砖、包住她的手、抱住：落地以后一路推得更慢、更近，中心一开始就对准她（她的头放在画面正中偏上，被救的人在她右边），
  // 溶回现在时她已经在画面正中（2026-10-25 用户：「这里需要把镜头中心移动到主角之后再切」「移的太快了，应该提前就对准主角」）
  const hd = girlHead(G.kneel - 0.02);
  return camLerp(c, aim(hd[0], hd[1] + 60, 540, 900, Z2), E.settle(ph(t, G.land2 + 0.05, G.kneel - 0.04)));
}
/** 她的头（世界坐标，没加 IK 的姿势） */
function girlHead(t: number): V2 {
  const k = girlBase(t);
  return add(k.root, k.j0.head as V2);
}
/** 「咚」：公交站那一下重（十岁的她摔下来），学校门口那一下轻 */
export const growShake = (t: number) => 22 * kick(t, G.land1, 0.08) + 9 * kick(t, G.land2, 0.07);

/** 画面的光：砖亮起来时暖光涌上来、暗角松开 */
export function growLook(t: number) {
  const g1 = E.out(ph(t, G.give1, G.give1 + 0.4)) * (1 - E.io(ph(t, G.sw2 - 0.3, G.sw2)));
  const g2 = E.out(ph(t, G.give2, G.give2 + 0.5));
  return { warm: 0.9 + 0.35 * g1 + 0.35 * g2, vig: 0.18 - 0.08 * g1 - 0.08 * g2 };
}
/** 傍晚（学校门口）有多暗：换过来就是傍晚 */
export const growDusk = (seg: number) => (seg === 2 ? 0.5 : 0);

/** 回忆的颜色一层层淡回现在：十二年前 1 → 公交站 0.62 → 学校门口 0.3（每个地方一层，叠化时两层各用各的） */
export const memoryAmount = (seg: number) => [1, 0.62, 0.3][seg];

/**
 * 接回现在的镜头：溶的时候现在那边的她（抱着小石头）在画面上和回忆里抱着的她同一个地方、同样大小（按胯对齐，同一个姿势）；
 * 溶完慢慢落到她的脸——71.02 她抬起头看着天
 */
export function backCam(t: number, base: (t: number) => Cam, past: (t: number) => Cam): Cam {
  if (t < G.kneel) return base(t);
  const tm = Math.min(t, G.dis1);
  const k = girlAt(tm);
  const pc = past(tm);
  const hipS = toScreen(pc, k.root[0] + k.j.hip[0], k.root[1] + k.j.hip[1]);
  const now = knifeAt(tm);
  const cj = jointsOf(now.chen.pose);
  const hip: V2 = [now.chen.root[0] + cj.hip[0], now.chen.root[1] + cj.hip[1]];
  // 回忆里十六岁的她按身高缩小画（0.93）：现在那边的镜头跟着缩一点，两边的她一样大
  const c0 = aim(hip[0], hip[1], hipS[0], hipS[1], pc.z * scaleOf(k.age));
  const up = knifeAt(G.look + 0.5);
  const uj = jointsOf(up.chen.pose);
  const face: V2 = [up.chen.root[0] + uj.head[0], up.chen.root[1] + uj.head[1]];
  return camLerp(c0, aim(face[0], face[1] + 40, 540, 860, 1.7), E.io(ph(t, G.dis1 - 0.05, G.end + 0.4)));
}
export { kick };
