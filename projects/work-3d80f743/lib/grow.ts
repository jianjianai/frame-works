// 间奏（64.02–72.02；小节线 64.023、66.024、68.025、70.026、72.027，每小节头上一下重的）。
// 2026-10-25 用户重做：「用过度的方法切两次地点……安排她救两个人，也是同样的，跑，拉，给」；第一版（一直在跑、背景横着拖成一片换地方）
// 用户：「屏幕向右太快了，把跑的去掉，改成站起来走两步场景切换，跳起来救人，给砖，之后站起来走两步，跳起来救人，给砖，场景用另外一种切换方式，
// 人物保持在中间。把时间都安排给 跳起来救人，给砖。最后一个给砖就不用站起来，直接切场景到回到她和小男孩抱在一起」。现在：
//   64.02 七岁的她把妈妈的木牌插进前面那只大铁靴里，站起来走两步——第二步落下去溶成秋天早上的公交站，她十岁；
//   公交站上空飘着一个戴眼镜的大叔：她停下来仰头、蹲下攒劲，跳到最高才攥住他的脚踝，66.024「咚」带着他摔下来、跪在地上（拼命）；
//     从靴筒里抽出砖放进他手里，66.77 砖暖暖地亮起来，他抬头看她（温暖：第一次把「活下去」交出去）；
//   她站起来走两步——第二步落下去溶成冬天傍晚的学校门口，她十六岁；刚飘起来的女学生，她一步跨上去攥住，68.52「咚」单膝稳稳落地（坚定）；
//     砖放进她手里亮起来，两只手把她的手合拢包住，看着她笑——像当年妈妈把木牌给她（温柔：传下去）；
//   砖放进她手里、包住她的手以后，低头闭上眼抱住（和现在一样的姿势）；70.026 不站起来，溶回现在：清晨的街上，她跪着抱着小石头；71.02 她抬起头看着天。
// 换地方：叠化（用户：「改成不硬切，用叠加的方式过度」；试过背景横着拖、四周虚掉、暖光漫过去、直接切）。第二步落脚前后 0.4 秒，
// 两边整幅画面叠着过去（前后两个地方、两个年纪的她），她在画面正中、位置不变。两个地方画在 lib/years.ts，按她的坐标摆。
// 溶回现在：「这里切回去的时候，主角姿势相同」——包住女学生的手以后，她低头闭眼、两只手合成和现在抱着小石头一模一样的姿势；
// 溶的 0.42 秒里回忆这边的她直接用现在那边的同一个姿势（按胯对齐、一样大），只有四周和怀里的人在换。
// 被救的人：落地以前画在背景那一层（她跳起来攥住的手在他前面），落地以后坐在她前面（和前奏周磊一样）。

import { type CastSpec, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type Angles, type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf, swapSides } from "@materials/剪纸角色/code/chengtuo";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, aim, camLerp, kick, ph, toScreen } from "./cam";
import { ARMS, type LiveOpts, SMOOTH, hitch, live } from "./motion";
import { CHEN, ZHOU, armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";
import { brickHold } from "./props";
import { pose } from "./dawn";
import { KID } from "./memory";
import { BOARD, KID8_KEYS, SIGN_T, drawBoard, kidAt8 } from "./sign";
import { knifeAt } from "./mother";
import { STUDENT, UNCLE } from "./saved";
import { drawGlow } from "./world";

type V2 = [number, number];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const b = beatAt;
const BEAT = () => beatAt(1) - beatAt(0);

export const GROW_T = {
  start: SIGN_T.end,
  /** 木牌插进前面那只靴筒（第一拍） */
  slide0: 64.06,
  slide1: 64.32,
  rise: 64.3,
  /** 站起来走两步（一拍一步）：第一步（七岁）；第二步落下去的那一下直接切到公交站，她十岁，站住 */
  step0: b(129),
  sw1: b(130),
  stop1: b(130),
  /** 仰头看见飘着的大叔；蹲下攒劲、蹬地；跳到最高攥住他的脚踝；「咚」带着他摔下来跪下（小节线） */
  look1: b(130.2),
  jump1: b(131),
  grab1: b(131.5),
  land1: b(132),
  /** 砖放进他手里，暖暖地亮起来 */
  give1: b(133.5),
  /** 站起来走两步：第一步；第二步落下去的那一下直接切到学校门口，她十六岁，站住 */
  rise1: b(134),
  step1: b(134.5),
  sw2: b(135.5),
  stop2: b(135.5),
  /** 仰头看见刚飘起来的女学生；一步跨上去攥住；「咚」单膝稳稳落地 */
  look2: b(135.7),
  jump2: b(136.4),
  grab2: b(136.75),
  land2: b(137),
  /** 砖放进她手里亮起来；两只手把她的手合拢包住 */
  give2: b(138.5),
  wrap: b(138.65),
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
/** 身高（相对十九岁的她） */
const SCALE = [0.58, 0.62, 0.66, 0.7, 0.74, 0.78, 0.82, 0.86, 0.9, 0.93, 0.96, 0.98, 1];
const NAVY = { color: "#353f55", shade: "#2b3346" };
/** 七到十二岁：素材库「小时候的秤砣」照着年纪长高——头的比例一年年变小；靴子还是妈妈那双（世界里一样大），相对身子越来越合脚；十岁穿上藏青外套 */
const KIDS: CastSpec[] = [0, 1, 2, 3, 4, 5].map((i) => ({
  ...KID,
  name: `${7 + i}岁的秤砣`,
  scale: SCALE[i],
  headScale: 1.42 - 0.04 * i,
  bootScale: (KID.scale * (KID.bootScale ?? 1)) / SCALE[i],
  coat: i >= 3 ? { ...NAVY } : undefined,
}));
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

// ——— 她的动作 ———
/** 前奏那套姿势是朝左写的：朝右时翻 face，眼睛看的左右也翻过来 */
const R = (p: Angles): Angles => ({ ...p, face: 1, ...(typeof p.lookX === "number" ? { lookX: -p.lookX } : {}) });
const G8 = {
  /** 低头把木牌往前面那只靴筒里插（还跪着） */
  插: pose(30, { face: 0.72, ...legR(96, -98), ...legL(-6, -134, -140), thighR: 0.65, neck: -20, expression: "含泪", sad: 0.8, tears: 0.6, lookX: 0.3, lookY: 1 }, (l) => ({
    ...armL(40, 70, 0, "grip", l),
    ...armR(40, 70, 0, "grip", l),
  })),
};
/** 走（铁靴，一拍一步「咚」）：落地 → 下沉 → 经过 → 蹬地，前奏那套 */
const WALK: [number, Angles, number][] = [
  [0, CHEN.走_落地, 0.03],
  [0.2, CHEN.走_下沉, 0.05],
  [0.48, CHEN.走_经过, 0],
  [0.74, CHEN.走_蹬地, 0],
];
/** 走两步：t0 第一步落地，一拍一步；第二步只到落地（站住），后面接仰头 */
function walkKeys(t0: number, face: (t: number) => Angles, items?: (t: number) => object | undefined): MoveKey[] {
  const out: MoveKey[] = [];
  for (let k = 0; k < 2; k++) {
    const foot = k === 0 ? "L" : "R";
    const prev = k === 0 ? "R" : "L";
    for (const [at, p, squash] of WALK) {
      if (k === 1 && at > 0) break;
      const t = t0 + (k + at) * BEAT();
      out.push({ t, ease: SMOOTH, squash, plant: at === 0 ? prev : foot, items: items?.(t), p: { ...R(foot === "L" ? p : swapSides(p)), ...face(t) } } as MoveKey);
    }
  }
  return out;
}
/** 每个年纪走路的脸：七岁含着泪；十岁、十六岁坚定，眼睛看着前面 */
const FACE7: Angles = { expression: "忍着哭", sad: 0.55, tears: 0.5, lookX: 0.5, lookY: 0, neck: 4 };
const FACE10: Angles = { expression: "坚定", tears: 0.15, lookX: 0.5, lookY: -0.1, neck: 6 };
const FACE16: Angles = { expression: "坚定", lookX: 0.5, lookY: -0.1, neck: 6 };
/** 跳起来往前飞多远（素材库单位：十岁的她拼命跳得高、往前冲一点；十六岁一步跨上去） */
const LEAP1 = 240;
const LEAP2 = 200;
/** 十六岁浅浅一蹲 */
const GATHER2: Angles = { ...CHEN.蹲, lean: 22, ...legR(54, -66), ...legL(46, -58), thighL: 0.8, thighR: 0.8 };
/** 包住女学生的手以后：抬眼看着她，温柔地笑（不站起来，直接溶回现在） */
const HOLD: Angles = { ...R(CHEN.跪_放), lean: 36, neck: 6, expression: "微笑", smile: 0.75, tears: 0.4, lookX: 0.4, lookY: 0.05 };
/** 低头闭眼抱住：和现在抱着小石头的「抱紧」同一组角度（lib/mother.ts 的 CHEN_P.抱紧，风也一样大），溶回现在时姿势一模一样 */
const HUG: Angles = pose(26, { face: 1, ...legR(84, -96, 0), ...legL(36, -112, 0), thighR: 1, neck: -18, expression: "难过", blink: 0.9, lookY: 0.6, wind: 0.6 }, (l) => ({
  ...armL(60, 90, 0, "grip", l),
  ...armR(70, 84, 0, "grip", l),
}));
const KEYS: MoveKey[] = [
  ...KID8_KEYS,
  // 第一拍：低头把木牌插进前面那只靴筒；站起来（前脚钉在原地），迈出第一步
  { t: G.slide0 + 0.08, ease: "inOut", plant: "R", p: G8.插 },
  { t: G.slide1, plant: "R", p: G8.插 },
  { t: G.rise + 0.1, ease: "inOut", plant: "R", p: { ...R(CHEN.起身), ...FACE7 } },
  { t: G.step0 - 0.1, ease: "inOut", plant: "R", p: { ...R(swapSides(CHEN.走_经过)), ...FACE7 } },
  ...walkKeys(G.step0, (t) => (t < G.sw1 ? FACE7 : FACE10)),
  // 公交站：停下来仰头，看见飘着的大叔（下定决心）→ 蹲下攒劲（拉满的弓）→ 蹬地弹出去 → 跳到最高攥住他的脚踝 → 一口气带着他摔下来，「咚」跪下
  { t: G.look1, ease: "inOut", plant: "R", p: { ...R(CHEN.仰头), expression: "坚定", tears: 0.2 } },
  { t: G.jump1 - 0.1, ease: "inOut", plant: "R", squash: 0.1, p: { ...R(CHEN.蹲), tears: 0.2 } },
  { t: G.jump1 + 0.05, ease: "in", squash: -0.1, dx: -LEAP1 * 0.25, p: { ...R(CHEN.起跳), lift: 160 } },
  { t: G.grab1, ease: "out", squash: -0.02, dx: -LEAP1 * 0.45, p: { ...R(CHEN.抓住), lift: 340 } },
  { t: G.land1 - 0.02, ease: "in", squash: -0.03, dx: -LEAP1 * 0.3, p: { ...R(CHEN.拽着坠), lift: 0 } },
  { t: G.land1 + 0.06, ease: "out", squash: 0.14, plant: "L", p: { ...R(CHEN.跪_缓冲), lift: 0, handR: "open" } },
  // 跪着喘一口气、心疼地看着他 → 弯腰手伸进前面那只靴筒 → 抽出砖（很沉）→ 身子往前倾递过去 → 放进他搭在膝盖上的手里
  { t: G.land1 + 0.24, ease: "inOut", squash: 0, plant: "L", p: { ...R(CHEN.单膝跪), expression: "心疼", tears: 0.3 } },
  { t: G.land1 + 0.36, ease: "inOut", plant: "R", p: R(CHEN.跪_掏砖) },
  { t: G.land1 + 0.46, ease: "out", plant: "R", p: R(CHEN.跪_抽出) },
  { t: G.give1 - 0.12, ease: "inOut", plant: "R", p: R(CHEN.跪_递) },
  { t: G.give1, ease: "inOut", plant: "R", p: R(CHEN.跪_放) },
  // 放下了：手一松开就垂下来，身子收回来一点，含着泪冲他笑（第一次把「活下去」交出去）
  { t: G.give1 + 0.16, ease: "out", plant: "R", p: { ...R(CHEN.跪_看他), expression: "哭着笑", tears: 0.45, lookX: 0.4, lookY: 0.3 } },
  // 站起来走两步（换到学校门口，十六岁）
  { t: G.rise1 + 0.1, ease: "inOut", plant: "R", p: { ...R(CHEN.起身), ...FACE10 } },
  { t: G.step1 - 0.08, ease: "inOut", plant: "R", p: { ...R(swapSides(CHEN.走_经过)), ...FACE10 } },
  ...walkKeys(G.step1, (t) => (t < G.sw2 ? FACE10 : FACE16), (t) => (t >= G.sw2 ? teenItems(16) : undefined)),
  // 学校门口：仰头看见刚飘起来的女学生 → 浅浅一蹲、一步跨上去攥住她的脚踝 → 带着她落下来，单膝稳稳跪住
  { t: G.look2, ease: "inOut", plant: "R", p: { ...R(CHEN.仰头), expression: "坚定" } },
  { t: G.jump2 - 0.08, ease: "inOut", plant: "R", squash: 0.07, p: { ...R(GATHER2), expression: "坚定", teeth: 0, lookX: 0.2, lookY: -1 } },
  { t: G.jump2 + 0.04, ease: "in", squash: -0.07, dx: -LEAP2 * 0.25, p: { ...R(CHEN.起跳), lift: 120, expression: "坚定", open: 0.1 } },
  { t: G.grab2, ease: "out", squash: -0.02, dx: -LEAP2 * 0.45, p: { ...R(CHEN.抓住), lift: 230, expression: "坚定" } },
  { t: G.land2 - 0.02, ease: "in", squash: -0.02, dx: -LEAP2 * 0.3, p: { ...R(CHEN.拽着坠), lift: 0, expression: "坚定" } },
  { t: G.land2 + 0.06, ease: "out", squash: 0.08, plant: "L", p: { ...R(CHEN.跪_缓冲), lift: 0, handR: "open", expression: "坚定" } },
  // 心疼地看她一眼 → 掏砖、递过去，放进她手里（比公交站那次慢一点，稳一点）
  { t: G.land2 + 0.28, ease: "inOut", squash: 0, plant: "L", p: { ...R(CHEN.单膝跪), expression: "心疼" } },
  { t: G.land2 + 0.44, ease: "inOut", plant: "R", p: R(CHEN.跪_掏砖) },
  { t: G.land2 + 0.58, ease: "out", plant: "R", p: R(CHEN.跪_抽出) },
  { t: G.give2 - 0.16, ease: "inOut", plant: "R", p: R(CHEN.跪_递) },
  { t: G.give2, ease: "inOut", plant: "R", items: teenItems(16, 1), p: R(CHEN.跪_放) },
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
    const pant = ph(t, G.land1 + 0.1, G.land1 + 0.2) * (1 - ph(t, G.land1 + 0.3, G.land1 + 0.4)) + ph(t, G.land2 + 0.1, G.land2 + 0.2) * (1 - ph(t, G.land2 + 0.34, G.land2 + 0.44));
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
    { t: T.grab + 0.08, ease: "out", p: P.一惊 },
    { t: T.land - 0.08, ease: "inOut", p: P.被拽 },
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
    // 看着手里亮起来的砖，眼泪掉下来 → 抬起头看她，哭着笑 → 她走了，望着她
    { t: G.give1 + 0.32, ease: "inOut", p: U2.坐_捧着哭 },
    { t: G.rise1 + 0.2, ease: "out", p: U2.坐_哭着笑 },
    { t: G.step1 + 0.2, ease: "inOut", p: U2.坐_望她 },
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
  const ankle = (t: number): V2 => {
    const a0 = grabPt();
    if (t <= T.grab) return [a0[0] + 18 * Math.sin(t * 1.3), a0[1] + rise * (T.grab - t) + 6 * Math.sin(t * 2.1)];
    return mix(a0, endPt(), E.in2(ph(t, T.grab, T.land)));
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

/** 她这一刻（世界坐标）：姿势、根、年纪；插木牌、攥人、包住女学生的手按 IK */
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
  const wb = 1 - E.io(ph(t, G.slide1 - 0.06, G.slide1 + 0.1));
  const bd = wb > 0.001 ? boardGrow(t) : null;
  if (bd) {
    const rotV = (p: V2, r: number): V2 => [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)];
    const top = Math.min(bd.clip - 8, bd.c[1] + 6);
    ik("L", add([bd.c[0], top], rotV([-(BOARD.w / 2 + 2), 0], bd.rot)), wb);
    ik("R", add([bd.c[0], top], rotV([BOARD.w / 2 + 2, -4], bd.rot)), wb);
  }
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
  const up = Math.max(0, hip - 280 * scaleOf(k.age)) / 300;
  g.save();
  g.fillStyle = `rgba(96,62,70,${0.22 * Math.max(0.3, 1 - up)})`;
  g.beginPath();
  g.ellipse(k.root[0] + 10, 6, 120 * (0.6 + (0.4 * (k.age - 7)) / 12) * Math.max(0.5, 1 - up * 0.5), 18, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  const bd = boardGrow(t);
  const wm = g.getTransform();
  const brickIn = (t >= G.land1 + 0.4 && t < G.give1) || (t >= G.land2 + 0.52 && t < G.give2);
  drawGirl(g, k.pose, k.root, k.age, z, {
    hold: brickIn ? { L: brickHold(() => 0, { p: null }, late) } : undefined,
  });
  // 木牌往靴筒里插：靴筒口以下的那截看不见（插进去了）
  if (bd) {
    g.save();
    g.setTransform(wm);
    if (bd.clip < 1e4) {
      g.beginPath();
      g.rect(bd.c[0] - 400, bd.clip - 2000, 800, 2000);
      g.clip();
    }
    drawBoard(g, bd.c, bd.rot, t, z);
    g.restore();
  }
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

/** 木牌：从怀里挪到前面那只靴筒口上面，竖着插下去（clip = 靴筒口的高度） */
function boardGrow(t: number): { c: V2; rot: number; clip: number } | null {
  if (t >= G.slide1 + 0.02) return null;
  const a = kidAt8(G.start);
  const k = girlBase(Math.min(t, G.slide1));
  const knee = add(k.root, k.j0.kneeR as V2);
  const ankle = add(k.root, k.j0.ankleR as V2);
  const mouth: V2 = [ankle[0] + (knee[0] - ankle[0]) * 0.82, ankle[1] + (knee[1] - ankle[1]) * 0.82];
  const above: V2 = [mouth[0], mouth[1] - BOARD.h / 2 - 4];
  const inside: V2 = [mouth[0], mouth[1] + BOARD.h / 2 + 6];
  const u1 = E.io(ph(t, G.slide0, G.slide0 + 0.14));
  const u2 = E.in2(ph(t, G.slide0 + 0.14, G.slide1));
  const c = u2 > 0 ? mix(above, inside, u2) : mix(a.boardC, above, u1);
  return { c, rot: a.boardRot * (1 - u1), clip: u1 >= 1 ? mouth[1] : 1e5 };
}

// ——— 镜头 ———
/** 走着的时候她在画面正中，脚下的地面在画面 1500；倍数一个地方比一个地方近，只推不拉：十二年前和公交站 1.2，第一次递砖推到 1.5，第二次推到 1.8 */
const Z0 = 1.2;
const Z1 = 1.5;
const Z2 = 1.8;
const GY = 1500;
/** 镜头跟着她的根走：按 0.12 秒的高斯平滑（不追每一步的起伏，停下来时也是慢慢停），不滞后 */
let TRACK: Float64Array | null = null;
const TR0 = 63.5;
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
  const up1 = 230 * E.io(ph(t, G.look1 - 0.1, G.look1 + 0.32));
  let c = camLerp(base(t), midFrame(t, Z0, up1), E.io(ph(t, 64.36, 64.95)));
  c = { ...c, z: c.z * (1 + 0.05 * kick(t, G.land1, 0.12)), y: c.y - (26 * kick(t, G.land1, 0.1)) / c.z };
  // 第一次递砖：推到砖上
  const gp = givePt(G.give1);
  c = camLerp(c, aim(gp[0] + 20, gp[1], 540, 1180, Z1), E.settle(ph(t, G.land1 + 0.05, G.give1 + 0.3)));
  // 站起来走两步：她回到画面正中；学校门口仰头时往上抬
  const up2 = 300 * E.io(ph(t, G.look2 - 0.1, G.look2 + 0.32));
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
