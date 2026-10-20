// 间奏「她一年一年长大」（64.02–72.02；小节线 64.023、66.024、68.025、70.026、72.027，每小节头上一下重的）。还在十二年前那条街：
// 七岁的她把妈妈的木牌插进前面那只大铁靴里，站起来，沿着街往右走——一拍一步，每落一步长大一岁：一步步长高，大铁靴慢慢合脚；
// 十岁穿上藏青外套，十三岁留起长发（换成现在的她：齐刘海长直发），靴筒里插上了砖，十五岁围上芥末黄围巾，十六岁戴上手套，十七岁戴上红袖标。
// 九岁看见头顶飘着一个戴眼镜的大叔，停下来，十岁跳起来抓住他的脚踝，66.024（小节线）「咚」带着他落下来跪下，从靴筒里抽出一块砖，
// 十二岁放进他手里（砖暖暖地亮起来），站起来接着走；十七岁一边走一边伸手把一个刚飘起来的女学生拽回地上，脚步都不停——
// 小时候拽一个人要拼命，长大了顺手就拽下来了。颜色一步步从旧照片回到现在。
// 70.026 十九岁的她跪下去张开手——溶回现在：清晨的街上，她跪着抱着小石头，灰还在落；71.02 她抬起头看着天，和七岁时一样。

import { CAST, type CastSpec, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type Angles, type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf, swapSides } from "@materials/剪纸角色/code/chengtuo";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, aim, camLerp, kick, ph, toScreen } from "./cam";
import { ARMS, SMOOTH, live } from "./motion";
import { CHEN, ZHOU, armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";
import { brickHold } from "./props";
import { pose } from "./dawn";
import { KID, KID_X } from "./memory";
import { BOARD, KID8_KEYS, SIGN_T, drawBoard, kidAt8 } from "./sign";
import { knifeAt } from "./knife";
import { STUDENT, UNCLE } from "./saved";

type V2 = [number, number];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const BEAT = () => beatAt(1) - beatAt(0);

export const GROW_T = {
  start: SIGN_T.end,
  /** 木牌插进前面那只靴筒（第一拍） */
  slide0: 64.06,
  slide1: 64.32,
  /** 站起来，第一步落地（八岁） */
  rise: 64.3,
  step0: beatAt(129),
  /** 九岁停下、蹲下；十岁跳起来抓住大叔，十一岁「咚」落地跪下（小节线），十二岁把砖放进他手里 */
  stop2: beatAt(130),
  jump2: beatAt(131),
  land2: beatAt(132),
  give2: beatAt(133),
  /** 十七岁一边走一边拽下刚飘起来的女学生 */
  pull1: beatAt(138),
  /** 十九岁：跪下去张开手（小节线），溶回现在 */
  kneel: beatAt(140),
  dis1: beatAt(140) + 0.42,
  /** 现在：她抬起头看天 */
  look: beatAt(142),
  end: beatAt(144),
};
const G = GROW_T;

/** 第几拍（按作品的节拍） */
const beatIndex = (t: number) => Math.floor((t - beatAt(0)) / BEAT() + 1e-6);
/** 这一刻几岁：第 129 拍落下第一步是八岁，每落一步长一岁，第 140 拍十九岁 */
export function ageAt(t: number) {
  return Math.max(7, Math.min(19, 7 + beatIndex(t) - 128));
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
const teenItems = (age: number, bricks = age >= 15 ? 2 : 1) => ({ coat: true, scarf: age >= 15, gloves: age >= 16, band: age >= 17, boots: true, bricks });

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

// ——— 她的动作 ———
const R = (p: Angles): Angles => ({ ...p, face: 1 });
const G8 = {
  /** 低头把木牌往前面那只靴筒里插（还跪着） */
  插: pose(30, { face: 0.72, ...legR(96, -98), ...legL(-6, -134, -140), thighR: 0.65, neck: -20, expression: "含泪", sad: 0.8, tears: 0.6, lookX: 0.3, lookY: 1 }, (l) => ({
    ...armL(40, 70, 0, "grip", l),
    ...armR(40, 70, 0, "grip", l),
  })),
  /** 十九岁：跪下去张开手，要接住什么（和现在抱着小石头是同一个姿势） */
  接: pose(26, { face: 1, ...legR(84, -96, 0), ...legL(36, -112, 0), neck: -18, expression: "难过", blink: 0.6, lookY: 0.6 }, (l) => ({
    ...armL(60, 90, 0, "grip", l),
    ...armR(70, 84, 0, "grip", l),
  })),
};
/** 走：一拍一步（铁靴「咚」），按第一幕那套走法，朝右；表情从忍着哭到坚定 */
const WALK: [number, Angles, number][] = [
  [0, CHEN.走_落地, 0.03],
  [0.2, CHEN.走_下沉, 0.05],
  [0.48, CHEN.走_经过, 0],
  [0.74, CHEN.走_蹬地, 0],
];
const faceOf = (age: number): Angles =>
  age <= 9 ? { expression: "含泪", sad: 0.6, tears: 0.3, lookX: 0.4, lookY: 0.1, neck: 0 } : { expression: "坚定", lookX: 0.5, lookY: -0.1, neck: 6 };
function walkKeys(n0: number, n1: number, firstFoot: "L" | "R"): MoveKey[] {
  const out: MoveKey[] = [];
  for (let n = n0; n <= n1; n++) {
    const i = n - n0;
    const foot = (i % 2 === 0) === (firstFoot === "L") ? "L" : "R";
    const prev = foot === "L" ? "R" : "L";
    for (const [at, p, squash] of WALK) {
      if (n === n1 && at > 0) break;
      const t = beatAt(n) + at * BEAT();
      const age = Math.max(7, Math.min(19, 7 + n - 128));
      const q = foot === "L" ? p : swapSides(p);
      out.push({ t, ease: SMOOTH, squash, plant: at === 0 ? prev : foot, items: age >= 13 ? teenItems(age) : undefined, p: { ...R(q), ...faceOf(age) } } as MoveKey);
    }
  }
  return out;
}
const KEYS: MoveKey[] = [
  ...KID8_KEYS,
  // 第一拍：低头把木牌插进前面那只靴筒；站起来（前脚钉在原地），迈出第一步
  { t: G.slide0 + 0.08, ease: "inOut", plant: "R", p: G8.插 },
  { t: G.slide1, plant: "R", p: G8.插 },
  { t: G.rise + 0.1, ease: "inOut", plant: "R", p: { ...R(CHEN.起身), ...faceOf(8) } },
  { t: G.step0 - 0.1, ease: "inOut", plant: "R", p: { ...R(swapSides(CHEN.走_经过)), ...faceOf(8) } },
  // 八、九岁走两步（最后一步 R 落地：停、蹲都是前脚 R）
  ...walkKeys(129, 130, "L"),
  // 九岁：看见头顶飘着的大叔，停下来仰头、蹲下攒劲；十岁蹬地跳起来抓住他的脚踝；十一岁「咚」带着他落下来跪下；
  // 从前面那只靴筒里抽出砖，十二岁放进他手里；站起来接着走
  { t: G.stop2 + 0.14, ease: "inOut", plant: "R", p: { ...R(CHEN.仰头), expression: "坚定" } },
  { t: G.jump2 - 0.12, ease: "inOut", plant: "R", squash: 0.1, p: R(CHEN.蹲) },
  { t: G.jump2, ease: "in", squash: -0.1, p: { ...R(CHEN.起跳), lift: 120 } },
  { t: G.jump2 + 0.2, ease: "out", squash: -0.02, p: { ...R(CHEN.抓住), lift: 260 } },
  { t: G.land2 - 0.12, ease: "in", squash: -0.03, p: { ...R(CHEN.拽着坠), lift: 90 } },
  { t: G.land2 + 0.06, ease: "out", squash: 0.12, plant: "L", p: { ...R(CHEN.跪_缓冲), lift: 0, handR: "open" } },
  { t: G.land2 + 0.16, ease: "inOut", squash: 0, plant: "R", p: R(CHEN.跪_掏砖) },
  { t: G.land2 + 0.3, ease: "out", plant: "R", p: R(CHEN.跪_抽出) },
  { t: G.give2 - 0.1, ease: "inOut", plant: "R", p: R(CHEN.跪_递) },
  { t: G.give2, ease: "inOut", plant: "R", p: R(CHEN.跪_放) },
  { t: G.give2 + 0.1, ease: "out", plant: "R", p: { ...R(CHEN.跪_看他), expression: "微笑", lookX: 0.4, lookY: 0.5 } },
  { t: G.give2 + 0.24, ease: "inOut", plant: "R", p: { ...R(CHEN.起身), ...faceOf(12) } },
  { t: G.give2 + 0.38, ease: "inOut", plant: "R", p: { ...R(CHEN.起身_直), ...faceOf(12) } },
  // 十三到十八岁一路走（69.02 一边走一边伸手拽下女学生，见 girlAt 的 IK），最后一步 R 落地
  ...walkKeys(134, 139, "L"),
  // 十九岁：跪下去张开手（前脚 R 钉住）
  { t: G.kneel, ease: "out", squash: 0.08, plant: "R", items: teenItems(19), p: G8.接 },
  { t: G.kneel + 0.2, ease: "out", squash: 0, plant: "R", p: G8.接 },
  { t: G.end, p: G8.接 },
];
const OPTS = { base: { wind: 0.4, chestL: "under", chestR: "under" }, idle: true, seed: 61, springs: ARMS, follow: 0 } as const;
/** 每个年纪一套（头、靴子的比例不一样，踩地的高度跟着算）；角度、步子都一样 */
const KID_LIVES = KIDS.map((spec) => live(KEYS, { ...OPTS, look: lookOf(spec) }));
const TEEN_LIVE = live(KEYS, { ...OPTS, look: CHENGTUO });
const moveOf = (age: number) => (age <= 12 ? KID_LIVES[age - 7] : TEEN_LIVE);

/** 她的根（世界里两脚之间的地面）：步子按每一步那一年的身高缩放，前脚钉在原地；朝右，素材库按朝左算的步子取反 */
let ROOT_KEYS: { t: number; X: number; x: number; s: number }[] | null = null;
function rootAt(t: number): number {
  if (!ROOT_KEYS) {
    const x0 = kidAt8(G.start).root[0];
    const ts = [G.start];
    for (let n = 129; n <= 140; n++) ts.push(beatAt(n));
    ts.push(G.end + 1);
    ROOT_KEYS = [];
    let X = x0;
    for (let i = 0; i < ts.length - 1; i++) {
      const age = ageAt(ts[i] + 1e-4);
      const s = SCALE[age - 7];
      const x = moveOf(age)(ts[i]).x;
      ROOT_KEYS.push({ t: ts[i], X, x, s });
      X += -(moveOf(age)(ts[i + 1]).x - x) * s;
    }
  }
  let k = ROOT_KEYS[0];
  for (const r of ROOT_KEYS) if (r.t <= t) k = r;
  const age = ageAt(t);
  return k.X - (moveOf(age)(t).x - k.x) * k.s;
}

// ——— 被她拽下来的两个人（高潮的人链里会回来；人在 lib/saved.ts） ———
export { STUDENT, UNCLE };
const S1 = {
  /** 站在街边低着头（还没飘起来） */
  站: pose(6, { face: -0.6, ...legR(6, -8), ...legL(-6, -4), neck: -26, expression: "难过", lookY: 1 }, (l) => ({
    ...armL(-4, 20, 0, "relax", l),
    ...armR(4, 24, 0, "relax", l),
  })),
  /** 刚飘起来：闭着眼，手往上浮 */
  飘: pose(-4, { face: -0.6, float: 0.12, ground: false, ...legR(-2, -26, -60), ...legL(8, -40, -60), neck: 18, expression: "闭眼", sad: 0.8, tears: 0.6 }, (l) => ({
    ...armL(100, 30, 8, "open", l),
    ...armR(112, 34, 6, "open", l),
  })),
  /** 被拽下来：一惊 */
  惊: pose(4, { face: -0.6, float: 0.08, ground: false, ...legL(-2, -4, -50), ...legR(30, -60, -40), neck: -24, expression: "吓一跳", lookY: 1 }, (l) => ({
    ...armL(130, 30, 0, "open", l),
    ...armR(150, 30, 0, "open", l),
  })),
  /** 站在地上，转过来看着她走远，哭了 */
  看她: pose(4, { face: 0.6, ...legR(6, -8), ...legL(-6, -4), neck: -6, expression: "忍着哭", lookX: 0.5, lookY: 0.2 }, (l) => ({
    ...armL(-6, 60, 0, "relax", l),
    ...armR(10, 90, 0, "relax", l),
  })),
};
const studentMove = live(
  [
    { t: 64, x: 0, p: S1.站 },
    { t: G.pull1 - 0.85, p: S1.站 },
    { t: G.pull1 - 0.4, ease: "inOut", p: { ...S1.飘, ground: false } },
    { t: G.pull1 - 0.04, p: S1.飘 },
    { t: G.pull1 + 0.08, ease: "out", p: S1.惊 },
    { t: G.pull1 + 0.22, ease: "inOut", p: { ...S1.惊, ground: true, lift: 0 } },
    { t: G.pull1 + 0.5, ease: "inOut", p: S1.看她 },
    { t: 72, p: S1.看她 },
  ] as MoveKey[],
  { look: lookOf(STUDENT), base: { wind: 0.4 }, idle: true, seed: 71, springs: ARMS, follow: 0 },
);
const U2 = {
  飘: { ...ZHOU.飘, face: -0.6 },
  一惊: { ...ZHOU.一惊, face: -0.6 },
  被拽: { ...ZHOU.被拽, face: -0.65 },
  坐下: { ...ZHOU.坐下, face: -0.75 },
  瘫坐: { ...ZHOU.瘫坐, face: -0.8 },
  坐_一沉: { ...ZHOU.坐_一沉, face: -0.8 },
  坐_托稳: { ...ZHOU.坐_托稳, face: -0.8 },
  坐_哭着笑: { ...ZHOU.坐_哭着笑, face: -0.8, lookX: -0.45 },
};
const uncleMove = live(
  [
    { t: 64, x: 0, p: U2.飘 },
    { t: G.jump2 + 0.17, p: U2.飘 },
    { t: G.jump2 + 0.27, ease: "out", p: U2.一惊 },
    { t: G.land2 - 0.08, ease: "inOut", p: U2.被拽 },
    { t: G.land2 + 0.04, ease: "out", p: U2.坐下 },
    { t: G.land2 + 0.3, ease: "inOut", p: U2.瘫坐 },
    { t: G.give2 + 0.04, ease: "out", p: U2.坐_一沉 },
    { t: G.give2 + 0.2, ease: "inOut", p: U2.坐_托稳 },
    { t: G.give2 + 0.6, ease: "inOut", p: U2.坐_哭着笑 },
    { t: 72, p: U2.坐_哭着笑 },
  ] as MoveKey[],
  { look: lookOf(UNCLE), base: { wind: 0.4 }, idle: true, seed: 73, springs: ARMS, follow: 0 },
);

/** 她这一刻没加 IK 的样子（姿势、根、年纪、关节） */
function girlBase(t: number) {
  const age = ageAt(t);
  const pose: PoseIn = { ...moveOf(age)(t).pose };
  const root: V2 = [rootAt(t), 0];
  return { age, pose, root, j0: girlJoints(pose, age) };
}
/** 她这一刻（世界坐标）：姿势、根、年纪；抱着木牌、伸手拽人的手按 IK */
export function girlAt(t: number) {
  const { age, pose, root, j0 } = girlBase(t);
  const s = age <= 12 ? KIDS[age - 7].scale : SCALE[age - 7];
  // 朝右（face > 0）整套镜像：角色坐标 x 取反、再除以身高
  const loc = (p: V2): V2 => [-(p[0] - root[0]) / s, (p[1] - root[1]) / s];
  // 第一拍：两只手扶着木牌插进靴筒，插到底松开
  const wb = 1 - E.io(ph(t, G.slide1 - 0.06, G.slide1 + 0.1));
  const b = wb > 0.001 ? boardGrow(t) : null;
  if (b) {
    const rotV = (p: V2, r: number): V2 => [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)];
    const top = Math.min(b.clip - 8, b.c[1] + 6);
    const eL = add([b.c[0], top], rotV([-(BOARD.w / 2 + 2), 0], b.rot));
    const eR = add([b.c[0], top], rotV([BOARD.w / 2 + 2, -4], b.rot));
    pose.armL = { ...(pose.armL as object), to: loc(eL), ik: wb } as PoseIn["armL"];
    pose.armR = { ...(pose.armR as object), to: loc(eR), ik: wb } as PoseIn["armR"];
  }
  // 66.024 远处那只手往前伸，攥住女学生的脚踝往下、往后一拽
  const w1 = E.io(ph(t, G.pull1 - 0.2, G.pull1 - 0.06)) * (1 - E.io(ph(t, G.pull1 + 0.2, G.pull1 + 0.36)));
  let grip1: V2 | null = null;
  if (w1 > 0.001) {
    grip1 = pull1Grip(t);
    pose.armR = { ...(pose.armR as object), to: loc(grip1), ik: w1, shape: "grip" } as PoseIn["armR"];
  }
  // 68.025 跳起来抓住大叔的脚踝，带着他落下来
  const w2 = E.io(ph(t, G.jump2 + 0.08, G.jump2 + 0.18)) * (1 - E.io(ph(t, G.land2 - 0.02, G.land2 + 0.12)));
  if (w2 > 0.001) pose.armR = { ...(pose.armR as object), to: loc(uncleAnkle(t)), ik: w2, shape: "grip" } as PoseIn["armR"];
  const j = girlJoints(pose, age);
  return { pose, root, age, j, j0, palmR: add(root, j.palmR as V2), palmL: add(root, j.palmL as V2), head: add(root, j.head as V2) };
}

// 女学生：飘在她前面一点、脚刚离地；被攥住脚踝以后脚踝跟着她的手往下、往后，落地站住
const STUDENT_X = () => rootAt(G.pull1) + 150;
function studentLift(t: number) {
  return 300 * E.in2(ph(t, G.pull1 - 0.8, G.pull1)) + 10 * Math.sin(t * 2.3) * ph(t, G.pull1 - 0.8, G.pull1 - 0.4);
}
/** 她攥住的地方（女学生近处那只脚踝）：攥住以前在女学生身上，攥住以后往下、往后拽到她胯边 */
function pull1Grip(t: number): V2 {
  const sp: PoseIn = { ...studentMove(Math.min(t, G.pull1)).pose };
  const sj = castJoints(STUDENT, sp);
  const ankle0: V2 = [STUDENT_X() + sj.ankleL[0], -studentLift(Math.min(t, G.pull1)) + sj.ankleL[1]];
  if (t <= G.pull1) return ankle0;
  // 往下、往后拽到她胯边（她接着往前走，女学生落在她身后）
  const gb = girlBase(G.pull1 + 0.2);
  const hip: V2 = [gb.root[0] + gb.j0.hip[0] - 210, gb.root[1] + gb.j0.hip[1] + 40];
  return mix(ankle0, hip, E.in2(ph(t, G.pull1, G.pull1 + 0.2)));
}
function studentAt(t: number) {
  const sp: PoseIn = { ...studentMove(t).pose };
  const sj = castJoints(STUDENT, sp);
  if (t <= G.pull1) return { pose: sp, root: [STUDENT_X(), -studentLift(t)] as V2 };
  // 脚踝跟着她的手（落地以前），落地以后站在落下来的地方
  const g = pull1Grip(Math.min(t, G.pull1 + 0.2));
  const fallRoot: V2 = [g[0] - sj.ankleL[0], g[1] - sj.ankleL[1]];
  const u = E.in2(ph(t, G.pull1, G.pull1 + 0.22));
  const y = Math.min(0, fallRoot[1] * (1 - u));
  return { pose: sp, root: [fallRoot[0], t >= G.pull1 + 0.22 ? 0 : y] as V2 };
}

// 大叔：飘得比她头顶高；她跳到最高处攥住他的脚踝，带着他一起落下来，他一屁股坐在她跟前
const UNCLE_X = () => rootAt(G.jump2) + 110;
function uncleLift(t: number) {
  return 470 + 30 * Math.max(0, t - 64.4) + 12 * Math.sin(t * 2.1);
}
function uncleAnkle(t: number): V2 {
  const up: PoseIn = { ...uncleMove(Math.min(t, G.jump2 + 0.2)).pose };
  const uj = castJoints(UNCLE, up);
  const a0: V2 = [UNCLE_X() + uj.ankleL[0], -uncleLift(Math.min(t, G.jump2 + 0.2)) + uj.ankleL[1]];
  if (t <= G.jump2 + 0.2) return a0;
  // 攥住以后：他的脚踝就在她攥着的手里，跟着她落下来（落地时在她跪下来那只手的地方）
  const gb = girlBase(G.land2 + 0.06);
  const end: V2 = [gb.root[0] + gb.j0.palmR[0] + 6, gb.root[1] + gb.j0.palmR[1]];
  return mix(a0, end, E.in2(ph(t, G.jump2 + 0.2, G.land2)));
}
function uncleAt(t: number) {
  const up: PoseIn = { ...uncleMove(t).pose };
  const uj = castJoints(UNCLE, up);
  if (t <= G.jump2 + 0.2) return { pose: up, root: [UNCLE_X(), -uncleLift(t)] as V2 };
  if (t < G.land2) {
    const a = uncleAnkle(t);
    return { pose: up, root: [a[0] - uj.ankleL[0], a[1] - uj.ankleL[1]] as V2 };
  }
  // 坐在地上（坐姿的胯直接放在地上，根就是地面）
  const a = uncleAnkle(G.land2 - 1e-4);
  const uj0 = castJoints(UNCLE, { ...uncleMove(G.land2 - 1e-4).pose });
  const x = a[0] - uj0.ankleL[0];
  const drop = E.out(ph(t, G.land2, G.land2 + 0.08));
  const y0 = a[1] - uj0.ankleL[1];
  return { pose: up, root: [x, y0 * (1 - drop)] as V2 };
}

// ——— 画 ———
/** 画间奏里的人（人这一层，世界坐标） */
export function drawGrow(g: CanvasRenderingContext2D, t: number, z: number) {
  const late: (() => void)[] = [];
  // 女学生（拽下来以后站在她身后看着她走远）
  if (t > G.pull1 - 1.6 && t < G.kneel + 0.5) {
    const s = studentAt(t);
    drawPerson(g, STUDENT, s.pose, s.root[0], s.root[1], z);
  }
  // 她（木牌插进靴筒以前抱在怀里：画在她身子和近处那只手臂之间）
  const k = girlAt(t);
  g.save();
  g.fillStyle = "rgba(96,62,70,0.22)";
  g.beginPath();
  g.ellipse(k.root[0] + 10, 6, 120 * (0.6 + 0.4 * (k.age - 7) / 12), 18, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  const b = boardGrow(t);
  const wm = g.getTransform();
  const brickIn = t >= G.land2 + 0.22 && t < G.give2;
  drawGirl(g, k.pose, k.root, k.age, z, {
    hold: brickIn ? { L: brickHold(() => 0, { p: null }, late) } : undefined,
  });
  // 大叔（坐在路边，比她离镜头近一点：她走过去时从他身后经过）
  if (t > 64.3 && t < G.kneel + 0.5) {
    const u = uncleAt(t);
    const warm = () => E.io(ph(t, G.give2 + 0.1, G.give2 + 0.7));
    drawPerson(g, UNCLE, u.pose, u.root[0], u.root[1], z, t >= G.give2 ? { hold: { L: brickHold(warm, { p: null }, late) } } : {});
  }
  for (const f of late) f();
  // 木牌往靴筒里插：靴筒口以下的那截看不见（插进去了）
  if (b) {
    g.save();
    g.setTransform(wm);
    if (b.clip < 1e4) {
      g.beginPath();
      g.rect(b.c[0] - 400, b.clip - 2000, 800, 2000);
      g.clip();
    }
    drawBoard(g, b.c, b.rot, t, z);
    g.restore();
  }
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
/** 跟着她横着走的取景：她在画面左边三分之一多一点（前面留空），地面在画面 1500，1.15 倍 */
const Z_WALK = 1.15;
let TRACK: ((t: number) => V2) | null = null;
function trackX(t: number) {
  if (!TRACK) {
    const n = Math.ceil((G.end + 0.5 - G.start) * 60);
    const xs = new Float64Array(n + 1);
    // 镜头按弹簧追她的根（她停下来拽人时镜头带着一点惯性慢慢停）
    let x = rootAt(G.start);
    let v = 0;
    const w = 5.5;
    for (let i = 0; i <= n; i++) {
      xs[i] = x;
      const target = rootAt(G.start + (i + 1) / 60) + 110;
      for (let s = 0; s < 4; s++) {
        const h = 1 / 240;
        v += (w * w * (target - x) - 2 * w * v) * h;
        x += v * h;
      }
    }
    TRACK = (tt: number): V2 => {
      const u = Math.max(0, Math.min(n - 1e-6, (tt - G.start) * 60));
      const i = Math.floor(u);
      return [xs[i] + (xs[i + 1] - xs[i]) * (u - i), 0];
    };
  }
  return TRACK(t)[0];
}
/**
 * 间奏的镜头（以⑧的镜头为底）：⑧的推近在 64.35 停住；之后柔和起步退到跟拍的取景（1.15 倍，她七岁时只到画面一半多），
 * 镜头 x 按弹簧追着她走（她停下来拽人时慢慢停住）；倍数不变，看得见她一步步长高。70.026 她跪下去，下一镜接回现在
 */
export function growCam(t: number, base: (t: number) => Cam): Cam {
  if (t <= G.start) return base(t);
  const walk = aim(trackX(t), -440, 470, 1500 - 440 * Z_WALK, Z_WALK);
  return camLerp(base(t), walk, E.settle(ph(t, 64.35, 65.4)));
}

/** 回忆的颜色一步步淡回现在：七岁 1 → 十九岁 0.35 */
export const memoryAmount = (t: number) => 1 - 0.65 * E.io(ph(t, G.step0, G.kneel));

/**
 * 接回现在的镜头：溶的时候现在那边的她（抱着小石头）在画面上和十九岁跪下来的她同一个地方、同样大小（按胯对齐，镜头和回忆那边一起跟着她）；
 * 溶完慢慢推近她的脸——71.02 她抬起头看着天
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
  const c0 = aim(hip[0], hip[1], hipS[0], hipS[1], pc.z);
  const up = knifeAt(G.look + 0.5);
  const uj = jointsOf(up.chen.pose);
  const face: V2 = [up.chen.root[0] + uj.head[0], up.chen.root[1] + uj.head[1]];
  return camLerp(c0, aim(face[0], face[1] + 40, 540, 860, 1.7), E.io(ph(t, G.dis1 - 0.05, G.end + 0.4)));
}
export { kick };
