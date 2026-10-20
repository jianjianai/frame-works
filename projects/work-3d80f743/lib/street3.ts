// 三③「但是还想拯救你」（92.02–93.9；但 91.92 是 92.13 还 92.43 想 92.64 拯 92.82 救 93.18 你 93.27，照第二幕「妄想用它拯救你」的字距；
// 每秒一下重拍 92.02、93.02）：白天，街上。小节线上从屋里切到街上：阿满（绿帽子、棕夹克）已经飘到半空，闭着眼往上飘；
// 她跳起来，「是」一把攥住他的脚踝——可她一个人拽不住，铁靴也离了地，两个人一起往上带。小石头从右边跑过来，跳起来从后面抱住她的腿，
// 加上他那件缝着铅的外套，三个人慢慢停住、往下沉；93.02 两个人一起往下一拽，她的铁靴「咚」砸回街面（「救」），
// 阿满被拽回地上坐下。小石头还抱着她的腰，仰起头冲她笑。
// 镜头跟着三个人一起被往上带，最后猛地沉回街面、一震。
// 三⑤「就请你 / 放心大胆更妄为肆意」（95.55–97.98；就请你 95.5–95.97，放心大胆更妄为肆意 95.97 起；96.02 副歌二进来）：
// 镜头从④的整座城一下扎回她们身上，96.02 落定；她们往西回家：她的铁靴一拍一「咚」（96.02、96.52、97.02、97.52），
// 小石头松开她的腿，跟在她后面学她跺脚（晚半拍，每一下膝盖抬得老高、笑着跺下去）；她回头看他，笑了。阿满在④里已经站起来、回头冲她点了一下头，往西走远了。
// 三⑥「迈步向前别害怕失去」（97.98–99.96；迈步向前别害怕失去 97.98 起；98.02、99.02 重拍）：走着走着，小石头跺完最后一下（98.27），
// 抬头看见天上的白（妈妈飞走的地方），不跺了，脸一下垮下来；脚跟慢慢离了地，脚尖也离了地，跟在后面的那声跺脚没了。
// 她听见身后没声了，99.0 停下、回过身，跑回两步，一把牵住他伸着的手，往下一拽，99.52「咚」他落回地上。两个人牵着手。
// 世界坐标（和第一幕同一条街，街面 y = 0）：在街东头那栋带青绿色铺面的五层楼前面（x 2810–3330）。

import { type Angles, type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf, swapSides } from "@materials/剪纸角色/code/chengtuo";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { ARMS, SMOOTH, live } from "./motion";
import { CHEN, KID, armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { drawPerson } from "./people";

type V2 = [number, number];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

export const PULL_T = {
  start: beatAt(184),
  /** 「是」攥住他的脚踝 */
  grab: 92.13,
  /** 小石头跑过来、跳起来、从后面抱住她的腰 */
  run0: 92.02,
  jump: 92.4,
  hug: 92.52,
  /** 三个人不再往上 */
  stop: 92.8,
  /** 一起往下一拽；她的铁靴「咚」落地（「救」）；阿满被拽回地上坐下 */
  yank: beatAt(186),
  land: 93.18,
  sit: 93.36,
  end: 93.9,
};
const T = PULL_T;
export const WALK_T = {
  /** 镜头从整座城扎下来 */
  dive: 95.55,
  /** 小石头松开她的腿 */
  let: 95.86,
  /** 她迈第一步（落在副歌二进来那一拍上），一拍一步 */
  step0: beatAt(192),
  end: 97.98,
};
const WK = WALK_T;
export const MISS_T = {
  start: WALK_T.end,
  /** 他跺最后一下、抬头看见白 */
  lastStomp: WALK_T.step0 + 0.25 + 4 * 0.500042,
  look: 98.36,
  /** 脚跟离地 → 脚尖离地，飘起来 */
  tiptoe: 98.6,
  lift: 98.86,
  /** 她听见没声了（又往前走了两步）：停下、回过身、跑回两步、牵住他的手、往下一拽，他「咚」落回地上 */
  stop: 99.1,
  turn: 99.17,
  run1: 99.4,
  grab: 99.45,
  land: beatAt(199),
  end: 99.96,
};
const MS = MISS_T;

const AMAN = CAST.阿满;
const STONE = CAST.小石头穿妈妈的外套;
/** 阿满飘在哪（x），三个人都在这一竖条上 */
const AX = 3010;

/** 阿满的鞋底离地多高：往上飘 → 她攥住以后慢一点 → 小石头抱住以后停住、往下沉 → 一拽落下来 → 被拽到地上坐下 */
function amanLift(t: number) {
  const k: [number, number][] = [
    [T.start, 760],
    [T.grab, 800],
    [T.hug, 980],
    [T.stop, 1010],
    [T.yank, 985],
    [T.land, 540],
    [T.sit, 0],
  ];
  if (t <= k[0][0]) return k[0][1] + 300 * (t - k[0][0]);
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const u = (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      // 往下的两段越来越快（被拽下来）；往上的几段匀着慢下来
      const e = i >= 5 ? u * u : i === 4 ? E.soft(u) : E.soft(u) * 0.5 + u * 0.5;
      return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * e;
    }
  }
  return 0;
}
/** 阿满被拽下来坐在她左边（看得见） */
const SIT_X = AX - 285;

// ——— 阿满 ———
const AMAN_P = {
  /** 往上飘：闭着眼，两只手软软地往上浮，腿垂着、脚尖朝下 */
  飘: pose(-6, { face: -0.3, ground: false, float: 0.12, ...legR(10, -22, -40), ...legL(-6, -16, -44), neck: 22, expression: "闭眼", sad: 0.8 }, (l) => ({
    ...armL(120, 34, 0, "relax", l),
    ...armR(104, 30, 0, "relax", l),
  })),
  /** 被攥住脚踝：一惊，睁开眼往下看 */
  惊: pose(-2, { face: -0.3, ground: false, float: 0.12, ...legR(16, -34, -30), ...legL(-4, -20, -40), neck: -18, expression: "惊", lookX: 0.1, lookY: 1 }, (l) => ({
    ...armL(80, 50, 0, "open", l),
    ...armR(60, 40, 0, "open", l),
  })),
  /** 坐在街上：膝盖立起来，愣愣地仰头看她 */
  坐: pose(4, { face: -0.3, headTurn: 0.75, ground: false, ...legR(132, -100, 0), ...legL(140, -110, 0), neck: 18, expression: "含泪", lookX: 0.5, lookY: -0.7 }, (l) => ({
    ...armL(-20, 30, 0, "relax", l),
    ...armR(-30, 30, 0, "relax", l),
  })),
};
/** ④ 阿满站起来的时候 */
const AMAN_UP = 94.0;
/** 他往西走（按第一幕那套走法，一拍一步） */
function amanWalk(): MoveKey[] {
  const out: MoveKey[] = [];
  const W: [number, Angles][] = [
    [0, CHEN.走_落地],
    [0.2, CHEN.走_下沉],
    [0.48, CHEN.走_经过],
    [0.74, CHEN.走_蹬地],
  ];
  for (let i = 0; i < 8; i++) {
    const foot = i % 2 === 0 ? "L" : "R";
    const prev = foot === "L" ? "R" : "L";
    for (const [at, q] of W) {
      const p = foot === "L" ? q : swapSides(q);
      out.push({ t: AMAN_UP + 0.6 + (i + at) * 0.5, ease: SMOOTH, plant: at === 0 ? prev : foot, p: { ...p, face: -0.85, expression: "笑" } } as MoveKey);
    }
  }
  return out;
}
const amanMove = live(
  [
    { t: 91.9, x: 0, p: AMAN_P.飘 },
    { t: T.grab, p: AMAN_P.飘 },
    { t: T.grab + 0.14, ease: "out", p: AMAN_P.惊 },
    { t: T.land, p: AMAN_P.惊 },
    { t: T.sit + 0.08, ease: "inOut", p: AMAN_P.坐 },
    // ④ 镜头往后退的时候：他站起来，回头冲她点一下头，往西走了（⑤ 她们往西回家时他已经走远，不挡在路上）
    { t: AMAN_UP, p: AMAN_P.坐 },
    { t: AMAN_UP + 0.24, ease: "inOut", plant: "R", p: { ...CHEN.站, face: -0.6, headTurn: 0.9, lean: 12, neck: -6, expression: "笑", lookX: 0.6, lookY: 0.1 } },
    { t: AMAN_UP + 0.5, ease: "inOut", plant: "R", p: { ...CHEN.站, face: -0.6, headTurn: 0.9, expression: "笑", lookX: 0.6, lookY: 0 } },
    ...amanWalk(),
  ] as MoveKey[],
  { look: lookOf(AMAN), base: { wind: 0.6 }, idle: true, seed: 101, springs: ARMS, follow: 0 },
);
function amanAt(t: number) {
  const p: PoseIn = { ...amanMove(t).pose };
  const j = castJoints(AMAN, p);
  // 坐下以后胯离地约 45；飘着的时候鞋底离地 amanLift
  const sitK = E.io(ph(t, T.land + 0.02, T.sit));
  const sole = Math.max(j.ankleL[1], j.ankleR[1]) + 26;
  const flyRoot: V2 = [AX + 10 * Math.sin(t * 1.3), -amanLift(t) - sole];
  const sitRoot: V2 = [SIT_X, -45 - j.hip[1]];
  let root = mix(flyRoot, sitRoot, sitK);
  // 鞋底、屁股不进地面
  const low = Math.max(j.ankleL[1] + 26, j.ankleR[1] + 26, j.hip[1] + 40);
  if (root[1] + low > 0) root = [root[0], -low];
  // ④ 站起来、往西走（脚钉在地上走）
  const up = E.io(ph(t, AMAN_UP, AMAN_UP + 0.24));
  if (up > 0) root = mix(root, [SIT_X + 30 + amanMove(t).x, -sole], up);
  return { pose: p, root, ankle: [root[0] + j.ankleL[0], root[1] + j.ankleL[1]] as V2 };
}

// ——— 她：跳起来攥住他的脚踝，一起被带上去，「咚」落回街面，把他拽下来 ———
const CHEN_P = {
  /** 跳起来：两只手往上够 */
  跳: pose(-8, { face: -0.6, ground: false, ...legR(36, -64), ...legL(8, -20, 26), neck: 30, expression: "使劲", lookX: -0.1, lookY: -1 }, (l) => ({
    ...armL(168, 12, 0, "open", l),
    ...armR(158, 22, 0, "open", l),
  })),
  /** 吊在他脚踝上：两只手攥着，身子直直地垂着，铁靴悬空，咬着牙仰头 */
  吊: pose(-4, { face: -0.6, ground: false, ...legR(16, -26, 10), ...legL(-6, -14, 16), neck: 34, expression: "使劲", teeth: 0.4, lookX: -0.1, lookY: -1 }, (l) => ({
    ...armL(176, 4, 0, "grip", l),
    ...armR(170, 8, 0, "grip", l),
  })),
  /** 落地：膝盖一弯蹲下去 */
  落: pose(16, { face: -0.6, ground: false, ...legR(64, -96), ...legL(34, -74), neck: 22, expression: "使劲", teeth: 0.3, lookX: -0.1, lookY: -0.9 }, (l) => ({
    ...armL(150, 30, 0, "grip", l),
    ...armR(140, 36, 0, "grip", l),
  })),
  /** ⑥ 跑回来伸手够他（朝右）：近处那只手往前上方伸 */
  牵: pose(10, { face: 0.8, ...legR(30, -20), ...legL(-20, -24), neck: 20, expression: "担心", lookX: 0.4, lookY: -0.8 }, (l) => ({
    ...armL(130, 20, 0, "grip", l),
    ...armR(20, 30, 0, "relax", l),
  })),
  /** 往下一拽：身子往后坐 */
  拽: pose(-12, { face: 0.8, ...legR(30, -40), ...legL(-10, -30), neck: 10, expression: "使劲", lookX: 0.4, lookY: -0.4 }, (l) => ({
    ...armL(80, 30, 0, "grip", l),
    ...armR(-10, 30, 0, "relax", l),
  })),
  /** 站住牵着他，低头看着他，笑了一点 */
  牵站: pose(4, { face: 0.8, ...legR(8, -6), ...legL(-6, -4), neck: -14, expression: "微笑", smile: 0.5, lookX: 0.4, lookY: 0.6 }, (l) => ({
    ...armL(40, 30, 0, "grip", l),
    ...armR(-6, 20, 0, "relax", l),
  })),
  /** 站住：低头看着坐在地上的他，松一口气 */
  站: pose(6, { face: -0.6, ground: false, ...legR(12, -10), ...legL(-8, -6), neck: -12, expression: "微笑", smile: 0.45, lookX: -0.6, lookY: 0.6 }, (l) => ({
    ...armL(-6, 24, 0, "relax", l),
    ...armR(-10, 20, 0, "relax", l),
  })),
};
/** ⑤ 她走（朝左，按第一幕那套走法：落地 → 下沉 → 经过 → 蹬地，一拍一步） */
const WALK: [number, Angles, number][] = [
  [0, CHEN.走_落地, 0.03],
  [0.2, CHEN.走_下沉, 0.05],
  [0.48, CHEN.走_经过, 0],
  [0.74, CHEN.走_蹬地, 0],
];
function walkHome(): MoveKey[] {
  const out: MoveKey[] = [];
  for (let i = 0; i < 7; i++) {
    const foot = i % 2 === 0 ? "L" : "R";
    const prev = foot === "L" ? "R" : "L";
    // 第二步起回头看他（头往右后方转、笑），后面几步转回来看前面（⑥ 他在后面停下了，她还往前走了两步）
    const look = i >= 1 && i <= 3 ? { headTurn: 0.75, expression: "笑", lookX: 0.6, lookY: 0.3, neck: -2 } : { expression: "微笑", lookX: -0.5, lookY: 0 };
    for (const [at, q, squash] of WALK) {
      const t = WK.step0 + (i + at) * 0.500042;
      const p = foot === "L" ? q : swapSides(q);
      out.push({ t, ease: SMOOTH, squash, plant: at === 0 ? prev : foot, p: { ...p, ...look } } as MoveKey);
    }
  }
  return out;
}
const chenMove = live(
  [
    { t: 91.9, x: 0, items: { bricks: 2 }, p: CHEN_P.跳 },
    { t: T.grab - 0.02, p: CHEN_P.跳 },
    { t: T.grab + 0.12, ease: "out", p: CHEN_P.吊 },
    { t: T.yank, p: CHEN_P.吊 },
    { t: T.land - 0.03, ease: "inOut", p: { ...CHEN_P.吊, ...legR(30, -50), ...legL(10, -36) } },
    { t: T.land + 0.06, ease: "out", p: CHEN_P.落 },
    // 松开他的脚踝：手先放到身前，再垂下来
    { t: T.land + 0.24, ease: "inOut", p: { ...CHEN_P.落, ...legR(40, -60), ...legL(20, -44), shoulderL: 70, elbowL: 30, handL: "relax", shoulderR: 60, elbowR: 36, handR: "relax" } },
    { t: T.sit + 0.3, ease: "inOut", p: CHEN_P.站 },
    // ⑤ 往西回家：一拍一步（铁靴「咚」），第二步起回头看跟在后面跺脚的小石头，笑了
    { t: WK.step0 - 0.3, plant: "R", p: CHEN_P.站 },
    ...walkHome(),
    // ⑥ 听见身后没声了：停下（脚落稳）、扭头 → 转过身（朝右，快：过正面那一下在转身里）→ 跑回两步 → 伸手牵住他 → 往下一拽 → 站住牵着他
    { t: MS.stop, ease: "out", plant: "L", p: { ...CHEN.站, headTurn: 0.8, expression: "担心", lookX: 0.7, lookY: -0.2 } },
    { t: MS.turn, ease: "inOut", p: { ...swapSides(CHEN.跑_蹬地), face: 0.8, expression: "担心", lookX: 0.6, lookY: -0.4 } },
    { t: MS.turn + 0.08, ease: SMOOTH, p: { ...CHEN.跑_腾空, face: 0.8, expression: "担心", lookX: 0.6, lookY: -0.5 } },
    { t: MS.turn + 0.16, ease: SMOOTH, p: { ...swapSides(CHEN.跑_落地), face: 0.8, expression: "担心", lookX: 0.6, lookY: -0.5 } },
    { t: MS.run1, ease: "inOut", p: CHEN_P.牵 },
    { t: MS.land, ease: "out", p: CHEN_P.拽 },
    { t: MS.land + 0.3, ease: "inOut", p: CHEN_P.牵站 },
    { t: 102, p: CHEN_P.牵站 },
  ] as MoveKey[],
  { look: CHENGTUO, base: { wind: 0.6, chestL: "under", chestR: "under" }, idle: true, seed: 103, springs: ARMS, follow: 0 },
);
/** ⑥ 她跑回去多远：跑到离他一臂远（停下那一刻算一次） */
let RUN_BACK: number | null = null;
/** 她落地的地方（x）：落地前一刻吊着的位置 */
let LAND_X: number | null = null;
const landX = () => (LAND_X ??= chenAt(T.land - 1e-4, amanAt(T.land - 1e-4)).root[0]);
/** 她的靴底离地多高：跳起来够到他的脚踝 → 吊着跟他一起上去 → 落地 */
function chenAt(t: number, aman: ReturnType<typeof amanAt>) {
  const p: PoseIn = { ...chenMove(t).pose };
  const j0 = jointsOf(p);
  // 吊着：两只手在他的脚踝上（IK），根 = 他的脚踝 − 姿势里手的位置
  const hand: V2 = [aman.ankle[0] + 6, aman.ankle[1] + 8];
  const handPose: V2 = [(j0.palmL[0] + j0.palmR[0]) / 2, (j0.palmL[1] + j0.palmR[1]) / 2];
  const hang: V2 = [hand[0] - handPose[0], hand[1] - handPose[1]];
  // 跳上来那一下（切过来时已经在半空，往上够）
  const jump = 1 - E.out(ph(t, T.start, T.grab));
  let root: V2 = [hang[0] + 20 * jump, hang[1] + 90 * jump];
  // 落地：靴底不进地面；落地以后钉在落地的地方（他被拽到她左边坐下，她的手跟过去，人不跟着走）
  const sole = Math.max(j0.ankleL[1], j0.ankleR[1]) + 46;
  const ground = -sole;
  if (t >= T.land) root = [landX() + chenMove(t).x, ground];
  else if (root[1] > ground) root = [root[0], ground];
  const loc = (q: V2): V2 => [q[0] - root[0], q[1] - root[1]];
  const grip = E.io(ph(t, T.grab - 0.06, T.grab));
  // 她两只手攥着他的脚踝，落地以后把他拽下来就松开
  const letGo = E.io(ph(t, T.land + 0.04, T.land + 0.24));
  p.armL = { ...(p.armL as object), to: loc([hand[0] - 8, hand[1]]), ik: grip * (1 - letGo) } as PoseIn["armL"];
  p.armR = { ...(p.armR as object), to: loc([hand[0] + 10, hand[1] + 14]), ik: grip * (1 - letGo) } as PoseIn["armR"];
  // ⑥ 跑回两步（根往右挪），近处那只手牵住他的手（朝右的人整套镜像：IK 目标 x 取反）
  if (t >= MS.turn) {
    RUN_BACK ??= Math.max(60, stoneFreeRoot(MS.turn, 0)[0] - (landX() + chenMove(MS.turn).x) - 235);
    root = [root[0] + RUN_BACK * E.io(ph(t, MS.turn, MS.run1 + 0.02)), root[1]];
    const w = E.io(ph(t, MS.run1 - 0.12, MS.grab));
    if (w > 0.001) {
      const cl = claspAt(t);
      const face = (p.face as number | undefined) ?? 0;
      p.armL = { ...(p.armL as object), to: [(face > 0 ? -1 : 1) * (cl[0] - root[0]), cl[1] - root[1]], ik: w } as PoseIn["armL"];
    }
  }
  const j = jointsOf(p);
  const at = (q: number[]): V2 => [root[0] + q[0], root[1] + q[1]];
  return { pose: p, root, hip: at(j.hip), ankle: at(j.ankleR), knee: at(j.kneeR), sole: -root[1] - sole };
}

// ——— 小石头：从右边跑过来，跳起来从后面抱住她的腰，落地以后仰头冲她笑 ———
const KRUN: [number, Angles][] = [
  [0, KID.跑_落地 as Angles],
  [0.22, KID.跑_下沉 as Angles],
  [0.5, KID.跑_蹬地 as Angles],
  [0.76, KID.跑_腾空 as Angles],
];
const STONE_P = {
  /** 跳起来从后面抱住她的腿：两条腿蜷起来，脸贴着她的腿，仰头看她 */
  抱: pose(8, { face: -0.6, ground: false, ...legR(60, -90), ...legL(30, -80), neck: 20, expression: "使劲", lookX: -0.3, lookY: -0.8 }, (l) => ({
    ...armL(80, 60, 0, "grip", l),
    ...armR(70, 70, 0, "grip", l),
  })),
  /** 往下坠：腿伸下去够地 */
  坠: pose(6, { face: -0.6, ground: false, ...legR(20, -20, 10), ...legL(4, -16, 14), neck: 4, expression: "使劲", teeth: 0.4, lookX: -0.3, lookY: -0.3 }, (l) => ({
    ...armL(70, 60, 0, "grip", l),
    ...armR(60, 70, 0, "grip", l),
  })),
  /** 站在她身后抱着她的腰，仰起头冲她笑 */
  笑: pose(-6, { face: -0.6, ground: false, ...legR(10, -8), ...legL(-8, -6), neck: 26, expression: "笑", lookX: -0.4, lookY: -0.9 }, (l) => ({
    ...armL(70, 60, 0, "grip", l),
    ...armR(60, 70, 0, "grip", l),
  })),
};
const stoneKeys: MoveKey[] = [];
{
  const N = 3;
  const step = (T.jump - T.run0) / N;
  for (let k = 0; k <= N; k++) {
    for (const [at, q] of KRUN) {
      if (k === N && at > 0) break;
      const r = (k % 2 === 0 ? q : swapSides(q)) as Angles;
      stoneKeys.push({ t: T.run0 + (k + at) * step, ease: SMOOTH, p: { ...r, face: -0.85, expression: "使劲", lookX: -0.6, lookY: -0.6 } } as MoveKey);
    }
  }
  stoneKeys[0] = { ...stoneKeys[0], x: 0 } as MoveKey;
}
stoneKeys.push({ t: T.hug, ease: "inOut", p: STONE_P.抱 });
stoneKeys.push({ t: T.yank, p: STONE_P.抱 });
stoneKeys.push({ t: T.yank + 0.1, ease: "inOut", p: STONE_P.坠 });
stoneKeys.push({ t: T.land + 0.1, p: STONE_P.坠 });
stoneKeys.push({ t: T.sit + 0.3, ease: "inOut", p: STONE_P.笑 });
// ⑤ 松开她的腿，跟在她后面学她跺脚：晚她半拍，膝盖抬得老高、笑着跺下去（一步一拍）
const STOMP = {
  站: pose(0, { face: -0.85, ...legR(6, -6), ...legL(-6, -4), neck: 10, expression: "笑", lookX: -0.4, lookY: -0.3 }, (l) => ({
    ...armL(-10, 30, 0, "fist", l),
    ...armR(10, 30, 0, "fist", l),
  })),
  抬: pose(-6, { face: -0.85, ...legR(96, -110, 10), ...legL(-4, -6), neck: 16, expression: "笑", lookX: -0.4, lookY: -0.5 }, (l) => ({
    ...armL(70, 70, 0, "fist", l),
    ...armR(-50, 60, 0, "fist", l),
  })),
  跺: pose(6, { face: -0.85, ...legR(22, -8, 0), ...legL(-18, -12), neck: 2, expression: "笑", teeth: 0.2, lookX: -0.4, lookY: 0.2 }, (l) => ({
    ...armL(-30, 40, 0, "fist", l),
    ...armR(30, 40, 0, "fist", l),
  })),
};
stoneKeys.push({ t: WK.let + 0.12, ease: "inOut", plant: "L", p: STOMP.站 });
for (let i = 0; i < 5; i++) {
  const t0 = WK.step0 + 0.25 + i * 0.500042;
  const sw = i % 2 === 1;
  const q = (a: Angles) => (sw ? swapSides(a) : a) as Angles;
  const stand = sw ? "R" : "L";
  const lead = sw ? "L" : "R";
  // 膝盖慢慢抬到最高（0.2 秒）→ 猛地跺下去（0.08 秒，蹲一下）→ 重心换到跺下去的那只脚
  stoneKeys.push({ t: t0 - 0.1, ease: "out", plant: stand, p: q(STOMP.抬) });
  stoneKeys.push({ t: t0, ease: "in", plant: stand, squash: 0.07, p: q(STOMP.跺) });
  stoneKeys.push({ t: t0 + 0.1, ease: "out", plant: lead, squash: 0, p: q(STOMP.跺) });
}
// ⑥ 抬头看见白（妈妈飞走的地方）→ 脸垮下来 → 踮起脚（脚跟离地）→ 脚尖也离了地，两只手慢慢往上张开 → 被她牵住、往下一拽落地 → 牵着她的手，含着泪笑
const FLOAT = {
  看: pose(-4, { face: -0.6, ...legR(10, -6), ...legL(-8, -6), neck: 32, expression: "难过", sad: 0.8, lookX: 0.2, lookY: -1 }, (l) => ({
    ...armL(-6, 20, 0, "relax", l),
    ...armR(6, 20, 0, "relax", l),
  })),
  踮: pose(-6, { face: -0.6, ...legR(6, -4, 34), ...legL(-8, -6, 38), neck: 34, expression: "含泪", tears: 0.6, lookX: 0.2, lookY: -1 }, (l) => ({
    ...armL(20, 30, 0, "relax", l),
    ...armR(30, 30, 0, "relax", l),
  })),
  飘: pose(-6, { face: -0.6, ground: false, float: 0.25, ...legR(10, -24, -40), ...legL(-6, -18, -44), neck: 32, expression: "含泪", tears: 0.8, lookX: 0.2, lookY: -1 }, (l) => ({
    ...armL(78, 18, 0, "open", l),
    ...armR(140, 24, 0, "open", l),
  })),
  落: pose(10, { face: -0.6, ...legR(30, -40), ...legL(10, -30), neck: 0, expression: "吓一跳", tears: 0.8, lookX: 0.5, lookY: -0.4 }, (l) => ({
    ...armL(90, 20, 0, "grip", l),
    ...armR(20, 30, 0, "open", l),
  })),
  牵: pose(-2, { face: -0.6, headTurn: 0.85, ...legR(8, -6), ...legL(-6, -4), neck: 20, expression: "哭着笑", lookX: 0.5, lookY: -0.8 }, (l) => ({
    ...armL(70, 20, 0, "grip", l),
    ...armR(-6, 20, 0, "relax", l),
  })),
};
stoneKeys.push({ t: MS.look, ease: "inOut", plant: "L", p: FLOAT.看 });
stoneKeys.push({ t: MS.tiptoe + 0.2, ease: "inOut", plant: "L", p: FLOAT.踮 });
stoneKeys.push({ t: MS.lift + 0.3, ease: "inOut", p: FLOAT.飘 });
stoneKeys.push({ t: MS.grab, p: FLOAT.飘 });
stoneKeys.push({ t: MS.land, ease: "in", p: FLOAT.落 });
stoneKeys.push({ t: MS.land + 0.3, ease: "inOut", p: FLOAT.牵 });
stoneKeys.push({ t: 102, p: FLOAT.牵 });
const stoneMove = live(stoneKeys, { look: lookOf(STONE), base: { wind: 0.6 }, idle: true, seed: 105, springs: ARMS, follow: 0 });
/** 小石头松开她的腿那一刻站在哪 */
let STONE_LET: number | null = null;
function stoneAt(t: number, chen: ReturnType<typeof chenAt>): { pose: PoseIn; root: V2; lift: number } {
  const p: PoseIn = { ...stoneMove(t).pose };
  const k = STONE.scale;
  const j0 = castJoints(STONE, p);
  const sole = Math.max(j0.ankleL[1], j0.ankleR[1]) + 18;
  // 抱的地方：她小腿中间（吊着的时候）；他落地以后，抱在他胸口那么高的地方（她往下落，抱的地方顺着她的腿往上挪）
  const chest: V2 = [(j0.shoulderL[0] + j0.shoulderR[0]) / 2, (j0.shoulderL[1] + j0.shoulderR[1]) / 2 + 34 * k];
  const shin: V2 = mix(chen.ankle, chen.knee, 0.45);
  const hang: V2 = [shin[0] + 58 - chest[0], shin[1] - chest[1]];
  // 跑过来：从画面右边外面（每秒约 1100）跑到她身后；跳起来抱住
  const runX = AX + 700 - 1100 * Math.max(0, t - T.run0);
  const groundY = -sole;
  const jumpK = E.out(ph(t, T.jump, T.hug));
  const x0 = Math.max(runX, hang[0]);
  let root: V2 = [x0 + (hang[0] - x0) * jumpK, groundY + (hang[1] - groundY) * jumpK];
  if (root[1] > groundY) root = [root[0], groundY];
  const hold: V2 = root[1] >= groundY - 0.5 && t > T.hug ? [shin[0] + 6, Math.max(chen.knee[1] - 40, root[1] + chest[1])] : shin;
  // ⑤ 松开她的腿以后自己走（脚钉在地上走，起点是松开那一刻的位置）；⑥ 飘起来、被她拽下来
  if (t >= WK.let) root = stoneFreeRoot(t, groundY);
  // 两只手环在她腿上（⑤ 松开）
  const w = E.io(ph(t, T.jump, T.hug)) * (1 - E.io(ph(t, WK.let - 0.06, WK.let + 0.12)));
  const face = (p.face as number | undefined) ?? 0;
  const loc = (q: V2): V2 => [((face > 0 ? -1 : 1) * (q[0] - root[0])) / k, (q[1] - root[1]) / k];
  p.armL = { ...(p.armL as object), to: loc([hold[0] - 34, hold[1] + 6]), ik: w, chest: "over" } as PoseIn["armL"];
  p.armR = { ...(p.armR as object), to: loc([hold[0] - 14, hold[1] - 10]), ik: w } as PoseIn["armR"];
  // ⑥ 被她牵住的那只手（近处那只）跟着两只手牵着的地方走
  if (t >= MS.grab) p.armL = { ...(p.armL as object), to: loc(claspAt(t)), ik: 1, chest: "over" } as PoseIn["armL"];
  return { pose: p, root, lift: Math.max(0, groundY - root[1]) };
}
/** ⑥ 他飘起来多高（鞋底离地）：脚尖离地以后越飘越快，被她牵住往下一拽，「咚」落回地上 */
const stoneLift = (t: number) => (t < MS.lift ? 0 : t < MS.grab ? 170 * E.in2(ph(t, MS.lift, MS.grab)) : 170 * (1 - E.in2(ph(t, MS.grab, MS.land))));
/** 他松开她的腿以后的根（不靠她的位置算）：脚钉在地上走，⑥ 飘起来 */
function stoneFreeRoot(t: number, groundY: number): V2 {
  STONE_LET ??= stoneAt(WK.let - 1e-4, chenAt(WK.let - 1e-4, amanAt(WK.let - 1e-4))).root[0];
  return [STONE_LET + 70 * E.io(ph(t, WK.let, WK.let + 0.3)) + stoneMove(t).x - stoneMove(WK.let).x, groundY - stoneLift(t)];
}
/** ⑥ 两只手牵着的地方：牵住以前就是他往上张开的近处那只手；牵住以后跟着往下一拽，落在两个人中间 */
function claspAt(t: number): V2 {
  const at = (tt: number): V2 => {
    const p: PoseIn = { ...stoneMove(tt).pose };
    const j = castJoints(STONE, p);
    const groundY = -(Math.max(j.ankleL[1], j.ankleR[1]) + 18);
    const r = stoneFreeRoot(tt, groundY);
    return [r[0] + j.palmL[0], r[1] + j.palmL[1]];
  };
  if (t < MS.grab) return at(t);
  CLASP0 ??= at(MS.grab);
  const r = stoneFreeRoot(MS.land + 0.3, 0);
  return mix(CLASP0, [r[0] - 80, -262], E.io(ph(t, MS.grab, MS.land + 0.25)));
}
let CLASP0: V2 | null = null;
/** ⑥ 两只手牵着的地方（⑦ 溶到夜里时对着它） */
export const streetClasp = (t: number) => claspAt(t);
/** 小石头这一刻站在哪（x）、飘起来多高：⑥ 的镜头 */
export const stoneState = (t: number) => ({ x: stoneFreeRoot(t, 0)[0], lift: stoneLift(t) });

/** 她这一刻站在哪（x）：⑤ 的镜头跟着她走 */
export const herX = (t: number) => chenAt(t, amanAt(t)).root[0];

/** 脚下一块软影子（离地越高越淡越小） */
function shadow(g: CanvasRenderingContext2D, x: number, lift: number, w: number) {
  const k = Math.max(0, 1 - lift / 900);
  if (k <= 0.02) return;
  g.save();
  g.fillStyle = `rgba(70,46,52,${0.26 * k})`;
  g.beginPath();
  g.ellipse(x + 12, 4, w * (0.5 + 0.5 * k), 16 * (0.6 + 0.4 * k), 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** 画三个人（人这一层，世界坐标）：阿满在最后面（上面），她，小石头抱在她身后 */
export function drawPull3(g: CanvasRenderingContext2D, t: number, z: number) {
  const a = amanAt(t);
  const c = chenAt(t, a);
  const s = stoneAt(t, c);
  shadow(g, a.root[0] + 20, amanLift(t), 130);
  shadow(g, c.root[0], Math.max(0, c.sole), 120);
  shadow(g, s.root[0], s.lift, 70);
  const line = 1 / Math.sqrt(Math.max(0.3, z));
  drawPerson(g, AMAN, a.pose, a.root[0], a.root[1], z);
  g.save();
  g.translate(c.root[0], c.root[1]);
  drawChengtuo(g, c.pose, { line });
  g.restore();
  drawPerson(g, STONE, s.pose, s.root[0], s.root[1], z);
}

/**
 * ③的镜头：切过来是三个人那一竖条的中景（1.2 倍），跟着往上带（对准点跟着阿满往上走八成），一拽一起往下冲，
 * 「咚」落地猛地停住、往里一顶、一震，落在街上的三个人身上
 */
export function pullCam(t: number): Cam {
  const lift = amanLift(t);
  const up = Math.min(lift, 1010) - 760;
  const c0 = aim(AX + 20, -600 - 0.6 * up, 540, 960, 1.05);
  // 落在街上的三个人：坐着的他、站着的她和抱着她腿的小石头，一起框进来
  const c1 = aim((SIT_X - 90 + landX() + 70) / 2, -390, 540, 960, 1.4);
  const c = camLerp(c0, c1, E.in2(ph(t, T.yank, T.land)));
  const kk = kick(t, T.land, 0.12);
  return { ...c, z: c.z * (1 + 0.035 * kk), y: c.y + (8 * kk * Math.sin((t - T.land) * 55)) / c.z };
}
