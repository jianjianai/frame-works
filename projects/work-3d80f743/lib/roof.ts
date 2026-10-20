// 第二幕第六镜「其实还想要说很多」（25.8–27.84，其 25.83 实 26.16 还 26.37 想 26.46 要 26.67 说 26.91 很 27.18 多 27.33）：
// 最高那栋楼的楼顶，白就压在头顶上。沉沉一直在楼顶晾衣绳边收白床单（第五镜退开时就在右上角：用户 2026-10-19
// 「这一幕主角应该就在右上角了。不用切镜头，改为运镜」）。一扯下来就看见千斤张着手往白里飘——一惊（底鼓），
// 床单脱手被风卷走，她踩着铁靴冲到楼边、蹬出去，在千斤的手快碰到白的地方从身后一把抱住；两个人在天上带着往左的惯性
// 慢慢飘，落到加高了的千斤家那栋楼的楼顶（27.52，用户：「抱住她之后，在天上慢慢往左边飘，惯性飘到左边的房子上」）。
// 镜头：第五镜往上退开的那个镜头接着走、不切；她一惊一顿；按两个人的距离推近（越近越近），抱住一震；跟着两个人往左飘，
// 慢慢退开一点，落下来轻轻一沉。

import { beatAt } from "@frame/engine/tempo";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf, swapSides } from "@materials/剪纸角色/code/chengtuo";
import { COLORS as CHEN_COLORS, bootMap, drawBoot, rigOf } from "@materials/剪纸角色/code/chengtuo-draw";
import { BOOT } from "@materials/剪纸角色/code/chengtuo-costume";
import { REST, toLocal } from "@materials/剪纸角色/code/figure";
import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { INK, QJ_HOME, TOWER, part } from "./world";
import { drawPerson } from "./people";
import { ARMS, LIMP, SMOOTH, fade, live, withDrag } from "./motion";
import { CHEN } from "./poses";
import { CHEN2, QIANJIN } from "./poses2";
import { TOWER_ROOF } from "./props";
import { type makeSky, skyCam } from "./sky";
import { NIGHT_T } from "./night";
import { WORD_BRICK, drawWordBrick } from "./brick";

type V2 = [number, number];
const b = beatAt;

export const ROOF_T = {
  /** 第五镜的镜头从这里交给这一镜（「其」25.83；不切镜头） */
  cut: 25.8,
  /** 把床单从绳子上扯下来、看见她 */
  pull: 25.84,
  see: 25.96,
  /** 一惊（底鼓） */
  shock: b(52),
  /** 床单脱手、冲 */
  letgo: 26.07,
  run0: 26.08,
  /** 蹬着楼边扑出去 */
  jump: 26.28,
  /** 「想」半空里从身后抱住她 */
  catch: 26.46,
  /** 落在千斤家那栋楼的楼顶 */
  land: b(55),
  /** 下一句「请你等等我」 */
  end: 27.84,
};

/**
 * ⑦「请你等等我」（27.84–29.79，请 27.84 你 28.23 等 28.44 等 28.59 我 28.80）：落地以后千斤还往上漂，沉沉一只手攥着她的手腕，
 * 弯腰把另一只手伸进靴筒掏砖——28.02（底鼓）拿出来是空的（今天的砖全送完了），一愣；「你」抬头看她；「等等」把她的两只手按到栏杆上、
 * 攥紧；「我」凑过去看着她的眼睛说「等等我」；29.02（底鼓）转身往右（她家那栋楼的方向）跑走。千斤攥着栏杆，转过来看着她，望着她跑开。
 */
export const STAY_T = {
  start: 27.84,
  reach: 27.98,
  empty: b(56),
  look: 28.23,
  rail0: 28.34,
  rail1: 28.52,
  say: 28.8,
  go: b(58),
  end: 29.79,
};

/**
 * ⑪「妄想用它拯救你」（35.88–37.8：妄 35.91 想 36.12 用 36.42 它 36.63 拯 36.81 救 37.17 你 37.26；底鼓 36.016、37.016）：
 * 夜里的楼顶，千斤还像风筝一样攥着栏杆漂着。沉沉抱着砖从最高那栋楼的楼顶跳下来（镜头切过来时她在半空），落在千斤家楼顶，
 * 跑两步到她跟前，把「活下去」放进她攥着栏杆的那只手里——砖一沉，千斤松开栏杆坠下来，「咚」地坐回楼顶，不再往上飘；
 * 抱着砖抬头看着蹲在旁边的她，哭着笑了，砖暖暖地亮起来。（沉沉这一镜在 lib/give.ts）
 */
export const GIVE_T = {
  start: 35.88,
  leap: 35.62,
  land: b(72),
  run0: 36.1,
  stop: 36.38,
  give: 36.63,
  drop: 36.81,
  sit: b(74),
  smile: 37.17,
  end: 37.8,
};

const QJ = CAST.千斤;
/** 千斤家那栋楼的楼顶（女儿墙下沿） */
export const QJ_ROOF = (-QJ_HOME.floors * 128 - 60) * (QJ_HOME.fh / 128);
/** 沉沉一开始站在晾衣绳左头 */
const X_C0 = TOWER.x + 250;
/** 楼边（蹬出去的地方） */
const X_EDGE = TOWER.x + 18;
/** 抱着时千斤的胸口在沉沉胸口的哪里（她在前面、低一点） */
const HUG: V2 = [-46, 72];
/** 落在千斤家楼顶的地方（沉沉的根） */
const X_LAND = -4330;
/** ⑦ 千斤两只手攥在栏杆上的地方（两只手中间） */
const GRIP_X = X_LAND - 214;
/** ⑧ 倒过来漂成风筝：29.86 起，30.5 漂到 */
const KITE1 = 30.5;
const kiteK = (t: number) => E.io(ph(t, NIGHT_T.dusk0 + 0.02, KITE1));
/** 铁靴的靴口：翻边上沿的中点（靴子的局部坐标，画面左边那只） */
const RIM = toLocal(BOOT.rim, REST.ankleR, 0);
const MOUTH: V2 = [RIM.reduce((a, p) => a + p[0], 0) / RIM.length, Math.min(...RIM.map((p) => p[1])) + 6];

export function makeRoof(sky: ReturnType<typeof makeSky>) {
  const T = ROOF_T;
  const S = STAY_T;
  // ——— 沉沉 ———
  const run = (p: typeof CHEN.跑_落地, swap: boolean) => ({ ...(swap ? swapSides(p) : p), expression: "坚定", lookX: -0.7, lookY: -0.2 });
  const chenMove = live(
    [
      // 背对着千斤（朝右）在收床单：攥着床单左头往下扯
      // 靴筒里的砖今天全送完了（⑦ 伸手进去掏是空的）
      { t: 23.9, x: 0, items: { bricks: 0 }, p: { ...CHEN2.收床单, face: 1, ground: false, lift: -8 } },
      { t: T.pull, p: { ...CHEN2.收床单, face: 1, ground: false, lift: -8 } },
      // 扯下来：两只手往下一拽，回头——
      { t: T.see, ease: "out", p: { ...CHEN2.收床单, face: 1, ground: false, lift: -8, neck: 2, ...pull(), headTurn: -0.9, lookX: -0.9 } },
      // ——一下转过身来，一惊
      { t: T.shock, ease: "out", p: { ...CHEN2.一惊, ground: false, lift: -8, headTurn: 0 } },
      // 冲：一步半（铁靴，一步 0.2 秒）
      { t: T.run0, ease: "inOut", p: run(CHEN.跑_蹬地, false) },
      { t: T.run0 + 0.08, ease: "out", p: run(CHEN.跑_腾空, false) },
      { t: T.run0 + 0.13, ease: "inOut", p: run(CHEN.跑_落地, true) },
      { t: T.jump - 0.03, ease: "inOut", p: run(CHEN.跑_蹬地, true) },
      { t: T.jump + 0.08, ease: "out", p: CHEN2.扑 },
      { t: T.catch, ease: "out", p: CHEN2.抱住 },
      // 抱着她在天上飘：腿软软地垂着
      { t: T.catch + 0.35, ease: "inOut", p: CHEN2.抱着飘 },
      // 快到楼顶：腿伸下去准备落地
      { t: T.land - 0.05, ease: "inOut", p: CHEN2.抱着坠 },
      { t: T.land + 0.12, ease: "out", squash: 0.06, p: CHEN2.落地 },
      { t: T.land + 0.34, ease: "inOut", squash: 0, p: CHEN2.落地_起 },
      // ⑦ 一只手攥着往上漂的她，弯腰掏靴筒 → 空的 → 抬头 → 把她的手按到栏杆上 → 凑过去说「等等我」→ 转身往右跑
      { t: S.start, p: CHEN2.落地_起 },
      { t: S.reach, ease: "out", p: CHEN2.掏靴筒 },
      { t: S.empty + 0.04, ease: "out", p: CHEN2.空手 },
      { t: S.look - 0.02, p: CHEN2.空手 },
      { t: S.look + 0.08, ease: "inOut", p: CHEN2.抬头看她 },
      { t: S.rail1, ease: "inOut", p: CHEN2.按手 },
      { t: S.say, ease: "inOut", p: { ...CHEN2.按手, lean: 30, neck: 16 } },
      { t: S.go - 0.02, p: { ...CHEN2.按手, lean: 30, neck: 16 } },
      ...runRight(),

    ] as MoveKey[],
    {
      look: CHENGTUO,
      base: { wind: 1.1, chestL: "under", chestR: "under" },
      // 不随机眨眼：一惊、冲出去那几帧不能闭着眼
      idle: false,
      seed: 4,
      springs: ARMS,
      follow: 0,
      add: (t, o) => {
        const k = kick(t, T.catch, 0.12);
        o.lean += 6 * k;
        o.neck -= 6 * k;
        // 「等、等、我」：嘴一张一合
        const say = (t0: number, a: number) => (t > t0 - 0.02 && t < t0 + 0.16 ? a * Math.sin((Math.PI * (t - t0 + 0.02)) / 0.18) : 0);
        const m = say(28.44, 0.55) + say(28.59, 0.55) + say(28.8, 0.75);
        if (m > 0) o.open = Math.max(o.open ?? 0, m);
      },
    },
  );
  /** ⑦ 转身往右跑：三步（跑的姿势朝右，face 1） */
  function runRight(): MoveKey[] {
    const R = (p: typeof CHEN.跑_落地, swap: boolean) => ({ ...(swap ? swapSides(p) : p), face: 1, expression: "坚定" as const, lookX: 0.6, lookY: -0.1 });
    const keys: MoveKey[] = [];
    const t0 = S.go;
    keys.push({ t: t0 + 0.08, ease: "inOut", p: R(CHEN.跑_蹬地, false) });
    let t = t0 + 0.08;
    for (let k = 0; k < 4; k++) {
      const sw = k % 2 === 1;
      keys.push({ t: t + 0.08, ease: SMOOTH, p: R(CHEN.跑_腾空, sw) });
      keys.push({ t: t + 0.13, ease: SMOOTH, p: R(CHEN.跑_落地, !sw) });
      keys.push({ t: t + 0.2, ease: SMOOTH, p: R(CHEN.跑_蹬地, !sw) });
      t += 0.2;
    }
    keys.push({ t: 32, p: R(CHEN.跑_蹬地, false) });
    return keys;
  }
  /** 扯床单那一下：手往下拽到胸口 */
  function pull() {
    return { shoulderL: 50, elbowL: 50, shoulderR: 62, elbowR: 44 };
  }

  // ——— 两个人的路线：沉沉的根（两脚之间） ———
  const chenChestOff = (pose: PoseIn): V2 => {
    const j = jointsOf(pose);
    return [(j.shoulderL[0] + j.shoulderR[0]) / 2, (j.shoulderL[1] + j.shoulderR[1]) / 2 + 40];
  };
  // 抱住那一刻千斤的胸口（按第五镜她往上飘的路线算）→ 反算沉沉的根
  const qjCatch = sky.chestOf(sky.qjAt(T.catch));
  const hugPose = chenMove(T.catch).pose;
  const cc = chenChestOff(hugPose);
  const P_CATCH: V2 = [qjCatch[0] - HUG[0] - cc[0], qjCatch[1] - HUG[1] - cc[1]];
  const P_EDGE: V2 = [X_EDGE, TOWER_ROOF];
  /** 落地那一刻根的高度：靴底正好踩在楼顶上 */
  const Y_LAND = QJ_ROOF - soleOf(chenMove(T.land).pose);
  const rootAt = (t: number): V2 => {
    if (t <= T.run0) return [X_C0, TOWER_ROOF];
    if (t <= T.jump) {
      // 冲：从慢到快（第一步蹬出去）
      const u = ph(t, T.run0, T.jump);
      return [X_C0 + (X_EDGE - X_C0) * (0.55 * u + 0.45 * u * u), TOWER_ROOF];
    }
    if (t <= T.catch) {
      // 扑出去：横着飞、略往上拱一点
      const u = ph(t, T.jump, T.catch);
      return [P_EDGE[0] + (P_CATCH[0] - P_EDGE[0]) * u, P_EDGE[1] + (P_CATCH[1] - P_EDGE[1]) * u - 70 * Math.sin(Math.PI * u)];
    }
    if (t <= T.land) {
      // 抱住以后：她轻、她沉，两个人差不多悬住了——带着扑出去的惯性慢慢往左飘（越来越慢），先被千斤往上带一点，再慢慢沉下去
      const u = ph(t, T.catch, T.land);
      const x = P_CATCH[0] + (X_LAND - P_CATCH[0]) * (1 - Math.pow(1 - u, 1.7));
      const y = P_CATCH[1] + (Y_LAND - P_CATCH[1]) * Math.pow(u, 1.9) - 46 * Math.sin(Math.PI * Math.min(1, u / 0.6)) * (1 - u);
      return [x, y];
    }
    // 落地以后：铁靴的底踩在楼顶上（按这一刻的姿势算脚多高；蹲下去时根跟着往下）；⑦ 29.02 起转身往右跑（跑的姿势按根在地面上写的）
    const d = t - S.go;
    if (d > 0) return [X_LAND + (d < 0.15 ? (1300 * d * d) / 0.3 : 1300 * (d - 0.075)), QJ_ROOF];
    return [X_LAND, QJ_ROOF - soleOf(chenMove(t).pose)];
  };
  /** 靴底离根多高（根在两脚之间的地面：脚抬起来时是负的） */
  function soleOf(pose: PoseIn) {
    const j = jointsOf(pose);
    return Math.max(j.ankleL[1], j.ankleR[1]) + 46;
  }
  /** 根的速度（头发、围巾按它往反方向甩） */
  const velAt = (t: number): V2 => {
    const a = rootAt(t - 0.02);
    const c = rootAt(t + 0.02);
    return [(c[0] - a[0]) / 0.04, (c[1] - a[1]) / 0.04];
  };
  const chenAt = (t: number) => {
    const f = chenMove(t);
    const pose: PoseIn = { ...f.pose };
    const v = velAt(t);
    withDrag(pose, [v[0], Math.max(-2000, Math.min(2000, v[1]))], 0.9);
    const r = rootAt(t);
    return { pose, x: r[0], y: r[1] };
  };
  const chenChest = (t: number): V2 => {
    const c = chenAt(t);
    const o = chenChestOff(c.pose);
    return [c.x + o[0], c.y + o[1]];
  };

  // ——— 千斤：抱住以前按第五镜的路线往上飘；抱住以后贴在她身前 ———
  const qjMove = live(
    [
      { t: T.catch - 0.5, x: 0, p: QIANJIN.张手 },
      { t: T.catch, p: QIANJIN.张手 },
      { t: T.catch + 0.1, ease: "out", p: QIANJIN.被抱住 },
      { t: T.catch + 0.45, ease: "inOut", p: QIANJIN.被抱着坠 },
      { t: T.land + 0.05, p: QIANJIN.被抱着坠 },
      { t: T.land + 0.3, ease: "inOut", p: QIANJIN.落地_回头 },
      // ⑦ 一松开就往上漂，一只手被她牵着；被按到栏杆上，转过来看着她；她跑走了，扭头望着
      { t: S.start, p: QIANJIN.落地_回头 },
      { t: S.empty, ease: "out", p: QIANJIN.被牵着漂 },
      { t: S.rail0, p: QIANJIN.被牵着漂 },
      { t: S.rail1, ease: "inOut", p: QIANJIN.攥栏杆 },
      { t: S.say, ease: "inOut", p: QIANJIN.攥栏杆_听 },
      { t: S.go + 0.25, ease: "out", p: QIANJIN.攥栏杆_望 },
      // ⑧ 天黑下来，被白往上拽：倒过来斜着漂起来，像一只风筝
      { t: NIGHT_T.dusk0 + 0.02, p: QIANJIN.攥栏杆_望 },
      { t: KITE1, ease: "inOut", p: QIANJIN.风筝 },
      // ⑪ 砖放进手里：低头看；一沉，坠下来，坐回楼顶抱着砖；抬头看着她哭着笑
      { t: GIVE_T.give - 0.04, p: QIANJIN.风筝 },
      { t: GIVE_T.give + 0.1, ease: "out", p: QIANJIN.风筝_看砖 },
      { t: GIVE_T.drop, p: QIANJIN.风筝_看砖 },
      { t: GIVE_T.drop + 0.1, ease: (x: number) => x * x, p: QIANJIN.坠 },
      { t: GIVE_T.sit, ease: "out", p: QIANJIN.坐_抱砖 },
      { t: GIVE_T.smile, p: QIANJIN.坐_抱砖 },
      { t: GIVE_T.smile + 0.22, ease: "inOut", p: QIANJIN.坐_哭着笑 },
      { t: 40, p: QIANJIN.坐_哭着笑 },
    ] as MoveKey[],
    // 不随机眨眼：⑦ 她抬头看沉沉、听「等等我」那几下要睁着眼
    { look: lookOf(QJ), base: { wind: 1.1 }, idle: false, seed: 63, springs: LIMP, follow: 0 },
  );
  const qjPose = (t: number): PoseIn => {
    const pose: PoseIn = { ...qjMove(t).pose };
    // 抱着时和她一起飘：头发、衣服按两个人的速度甩；⑦ 松开以后她自己几乎不动
    const v = velAt(Math.min(t, S.start));
    withDrag(pose, [v[0], Math.max(-2000, Math.min(2000, v[1]))], 0.9);
    // ⑧ 被白往上拽：两条腿在风里一下一下地飘
    const kk = kiteK(t);
    if (kk > 0) {
      const lL = pose.legL as { a: number };
      const lR = pose.legR as { a: number };
      pose.legL = { ...(pose.legL as object), a: lL.a + 0.12 * kk * Math.sin(t * 7.3) } as PoseIn["legL"];
      pose.legR = { ...(pose.legR as object), a: lR.a + 0.12 * kk * Math.sin(t * 6.1 + 1.2) } as PoseIn["legR"];
    }
    return pose;
  };
  const qjChestOff = (pose: PoseIn): V2 => {
    const j = castJoints(QJ, pose);
    return [(j.shoulderL[0] + j.shoulderR[0]) / 2, (j.shoulderL[1] + j.shoulderR[1]) / 2 + 40];
  };
  /** 她还轻飘飘的：脚不着地（沉沉蹲下去时她不跟着往下压，鞋底离楼顶至少 24） */
  const floating = (pose: PoseIn, x: number, y: number) => {
    const j = castJoints(QJ, pose);
    const low = Math.max(j.ankleL[1], j.ankleR[1]) + 40;
    return { pose, x, y: Math.min(y, QJ_ROOF - 24 - low) };
  };
  /** 抱着时她在哪（抱住以前按第五镜的路线）：胸口贴在沉沉胸口前面 */
  const qjHugAt = (t: number) => {
    if (t < T.catch) {
      const q = sky.qjAt(t);
      return { pose: q.pose as PoseIn, x: q.x, y: q.y };
    }
    const pose = qjPose(t);
    const qc = qjChestOff(pose);
    const c = chenChest(t);
    // 抱住那一下从她自己飘的位置贴过去（0.06 秒）
    const w = E.out(ph(t, T.catch, T.catch + 0.06));
    const own = sky.chestOf(sky.qjAt(Math.min(t, T.catch + 0.06)));
    const at = mixP(own, [c[0] + HUG[0], c[1] + HUG[1]], w);
    return floating(pose, at[0] - qc[0], at[1] - qc[1]);
  };

  // ——— ⑦ 两个人的手 ———
  /** 栏杆上两只手的地方：右边是牵着的那一对（沉沉的远手 R 握着千斤的近手 L，一起按下去），左边是沉沉的近手（L）盖着千斤的远手（R） */
  const GL: V2 = [GRIP_X - 22, RAIL_TOP + 2];
  const GR: V2 = [GRIP_X + 24, RAIL_TOP + 2];
  /** 她身前那只铁靴（R）的靴口（世界坐标） */
  const mouthAt = (c: { pose: PoseIn; x: number; y: number }): V2 => {
    const rig = rigOf(c.pose);
    const p = bootMap(rig, "R")(MOUTH);
    return [c.x + (rig.mir ? -p[0] : p[0]), c.y + p[1]];
  };
  /**
   * 沉沉连两只手一起（IK 的目标都不看千斤这一刻在哪，千斤的手跟着她的手走）：抱住时环在她腰上；⑦ 近处那只伸进靴口掏两下 →
   * 拿出来交给姿势（空手摊在眼前）→「等等」按到栏杆上；远处那只交给姿势（往前上方举着牵住她）→ 按到栏杆上；跑的时候松开
   */
  const chenPosed = (t: number) => {
    const c = chenAt(t);
    const hugW = fade(t, T.catch - 0.04, T.catch + 0.02);
    if (hugW <= 0) return c;
    const pose: PoseIn = { ...c.pose };
    const q0 = qjHugAt(Math.min(t, S.start));
    const jq = castJoints(QJ, q0.pose);
    const waist: V2 = [q0.x + jq.hip[0], q0.y + jq.hip[1] - 60];
    let tl: V2 = [waist[0] - 34, waist[1] + 4];
    let tr: V2 = [waist[0] - 6, waist[1] - 20];
    let wl = hugW;
    let wr = hugW;
    if (t > S.start) {
      const m = mouthAt(c);
      // 手腕停在靴口上面一点：手掌和手指伸进靴口里（被重画的靴子盖住），翻两下
      const dig: V2 = [m[0] - 4 + 5 * Math.sin(t * 70), m[1] - 22 + 7 * Math.max(0, Math.cos(t * 52))];
      tl = mixP(tl, dig, E.io(ph(t, S.start, S.reach)));
      wl = 1 - E.out(ph(t, S.empty - 0.02, S.empty + 0.1));
      wr = 1 - E.io(ph(t, S.start, S.start + 0.14));
      const k = E.io(ph(t, S.rail0, S.rail1));
      if (k > 0) {
        tl = [GL[0] + 4, GL[1] - 14];
        tr = [GR[0] + 4, GR[1] - 14];
        wl = k;
        wr = k;
      }
    }
    const let_ = 1 - fade(t, S.go - 0.02, S.go + 0.1);
    const mx = (pose.face ?? -1) > 0 ? -1 : 1;
    pose.armL = { ...(pose.armL as object), to: [(tl[0] - c.x) * mx, tl[1] - c.y], ik: wl * let_ };
    pose.armR = { ...(pose.armR as object), to: [(tr[0] - c.x) * mx, tr[1] - c.y], ik: wr * let_ };
    return { pose, x: c.x, y: c.y };
  };
  /** 沉沉的手心（世界坐标） */
  const chenPalm = (t: number, side: "L" | "R"): V2 => {
    const c = chenPosed(t);
    const j = jointsOf(c.pose);
    const p = side === "L" ? j.palmL : j.palmR;
    return [c.x + p[0], c.y + p[1]];
  };
  /**
   * 千斤在哪：⑦ 一松开就往上漂，近处那只手的手腕在沉沉举着的手心里（像牵着一只气球，身子慢半拍跟着那只手），
   * 「等等」被拽下来、两只手按在栏杆上，身子浮在栏杆上面；她跑走以后被风带起来一点（⑧ 接着漂成风筝）
   */
  /** ⑪ 坐在楼顶上：胯离楼顶约 44，就在她攥着栏杆的那个地方底下 */
  const SIT_X = GRIP_X - 34;
  let atDrop: { pose: PoseIn; x: number; y: number } | null = null;
  const qjAt = (t: number) => {
    if (t > GIVE_T.drop) {
      // 砖一沉：从风筝的地方往下坠（越坠越快），「咚」坐到楼顶上
      atDrop ??= qjAtKite(GIVE_T.drop);
      const pose = qjPose(t);
      const j = castJoints(QJ, pose);
      const sit: V2 = [SIT_X - j.hip[0], QJ_ROOF - 44 - j.hip[1]];
      const u = Math.pow(ph(t, GIVE_T.drop, GIVE_T.sit), 1.7);
      const r = mixP([atDrop.x, atDrop.y], sit, u);
      return { pose, x: r[0], y: r[1] };
    }
    return qjAtKite(t);
  };
  const qjAtKite = (t: number) => {
    if (t <= S.start) return qjHugAt(t);
    const pose = qjPose(t);
    const qc = qjChestOff(pose);
    const h = chenPalm(t - 0.05, "R");
    const bob: V2 = [4 * Math.sin(t * 1.7), 6 * Math.sin(t * 2.1)];
    const tether: V2 = [h[0] + TETHER[0] + bob[0], h[1] + TETHER[1] + bob[1]];
    const hug = qjHugAt(t);
    let at = mixP([hug.x + qc[0], hug.y + qc[1]], tether, E.io(ph(t, S.start, S.start + 0.15)));
    const k = E.io(ph(t, S.rail0, S.rail1));
    if (k > 0) {
      // 肩膀在栏杆上面约 115：胳膊微微弯着往下够到栏杆；她跑走以后身子往左歪着漂起来，胳膊绷直斜着拉住栏杆
      const lift = E.io(ph(t, S.go, S.end + 0.4));
      at = mixP(at, [GRIP_X + 14 - 50 * lift, RAIL_TOP - 78 + bob[1] - 8 * lift], k);
    }
    let root: V2 = [at[0] - qc[0], at[1] - qc[1]];
    // ⑧ 风筝：被提起来，两肩差不多就在两只手的正上方、胳膊绷直（够得着栏杆的最高处），一下一下被往上扯
    const kk = kiteK(t);
    if (kk > 0) {
      const j = castJoints(QJ, pose);
      const sm: V2 = [(j.shoulderL[0] + j.shoulderR[0]) / 2, (j.shoulderL[1] + j.shoulderR[1]) / 2];
      const tug = 7 * Math.max(0, Math.sin(t * 5.2)) ** 3;
      const sx = GRIP_X - 26 + 5 * Math.sin(t * 2.3);
      const sy = RAIL_TOP - 122 + 4 * Math.sin(t * 1.9) - tug;
      root = mixP(root, [sx - sm[0], sy - sm[1]], kk);
    }
    return floating(pose, root[0], root[1]);
  };
  /** 被牵着时她的胸口在手腕的哪里（按「被牵着漂」站稳以后的姿势算：胳膊伸直，身子在手的左上方） */
  const TETHER: V2 = (() => {
    const p = qjPose(S.rail0);
    const j = castJoints(QJ, p);
    const o = qjChestOff(p);
    return [o[0] - j.wristL[0], o[1] - j.wristL[1]];
  })();
  /** 千斤连两只手一起：近处那只在沉沉手心里 → 跟着她的手按到栏杆上；远处那只「等等」也按到栏杆上 */
  const qjPosed = (t: number) => {
    const q = qjAt(t);
    if (t <= S.start) return q;
    const pose: PoseIn = { ...q.pose };
    const k = QJ.scale;
    const mir = (pose.face ?? 0) > 0 ? -1 : 1;
    const loc = (p: V2): V2 => [((p[0] - q.x) / k) * mir, (p[1] - q.y) / k];
    const kr = t > S.rail1 ? 1 : E.io(ph(t, S.rail0, S.rail1));
    // ⑪ 砖一沉：两只手松开（交给「坠」的姿势），坐下以后两只手扶着砖的两头抱在胸前
    const free = 1 - E.io(ph(t, GIVE_T.drop, GIVE_T.drop + 0.08));
    pose.armL = { ...(pose.armL as object), to: loc(mixP(chenPalm(t, "R"), GR, kr)), ik: E.io(ph(t, S.start, S.start + 0.12)) * free };
    if (kr > 0) pose.armR = { ...(pose.armR as object), to: loc(GL), ik: kr * free };
    const hug = E.io(ph(t, GIVE_T.sit - 0.06, GIVE_T.sit + 0.12));
    if (hug > 0) {
      const c = hugBrick(q);
      const hw = WORD_BRICK.w / 2 - 6;
      pose.armL = { ...(pose.armL as object), to: loc([c[0] + hw, c[1] + 4]), ik: hug };
      pose.armR = { ...(pose.armR as object), to: loc([c[0] - hw, c[1] + 4]), ik: hug };
    }
    return { ...q, pose };
  };
  /** ⑪ 坐下以后抱在胸前的砖的中心（按她这一刻的身子算：胸口前面、偏下） */
  const hugBrick = (q: { pose: PoseIn; x: number; y: number }): V2 => {
    const j = castJoints(QJ, q.pose);
    return [q.x + (j.shoulderL[0] + j.shoulderR[0]) / 2 - 24, q.y + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 74];
  };
  /** ⑪ 那块砖在千斤手里时的中心（世界坐标）：放进她攥着栏杆的那只手里 → 跟着那只手坠下来 → 抱在胸前；交出来以前返回 null */
  const qjBrickAt = (t: number): V2 | null => {
    if (t < GIVE_T.give) return null;
    const q = qjPosed(t);
    const j = castJoints(QJ, q.pose);
    const palm: V2 = [q.x + j.palmL[0], q.y + j.palmL[1] + WORD_BRICK.h / 2 - 4];
    return mixP(palm, hugBrick(q), E.io(ph(t, GIVE_T.sit - 0.06, GIVE_T.sit + 0.12)));
  };
  /** ⑪ 砖暖起来多少（坐下那一下起） */
  const brickWarm = (t: number) => E.io(ph(t, GIVE_T.sit - 0.04, GIVE_T.sit + 0.4));

  // ——— 白床单：在绳子上 → 左半边被她扯下来、右头还挂在绳子上 → 一惊脱手，被风卷着往右上飞走、翻着，融进白里 ———
  const LINE_Y = TOWER_ROOF - 284;
  const A0: V2 = [TOWER.x + 205, LINE_Y];
  const B0: V2 = [TOWER.x + 545, LINE_Y];
  const SHEET_H = 230;
  const drawSheet = (g: CanvasRenderingContext2D, t: number) => {
    if (t >= T.letgo + 1.1) return;
    const flap = 18 * Math.sin(t * 2.2) + 10 * Math.sin(t * 3.7 + 1);
    // 四个角：上沿两个（tl、tr），下沿两个（bl、br）
    let tl: V2 = A0;
    let tr: V2 = B0;
    let bl: V2 = [A0[0] + 12 + flap * 0.4, A0[1] + SHEET_H];
    let br: V2 = [B0[0] + 10 + flap, B0[1] + SHEET_H - 10];
    let alpha = 1;
    if (t >= T.pull) {
      const c = chenAt(Math.min(t, T.letgo));
      const j = jointsOf(c.pose);
      const hand: V2 = [c.x + (j.palmL[0] + j.palmR[0]) / 2, c.y + (j.palmL[1] + j.palmR[1]) / 2];
      const u = E.out(ph(t, T.pull, T.see));
      // 左头扯到她手里；右头还挂在绳子上；下沿被风吹得往右鼓
      tl = [A0[0] + (hand[0] - A0[0]) * u, A0[1] + (hand[1] - A0[1]) * u];
      bl = [tl[0] + 40 + flap * 0.5, tl[1] + SHEET_H * (1 - 0.35 * u)];
      br = [B0[0] + 30 + flap * 1.4, B0[1] + SHEET_H * (1 - 0.2 * u)];
      if (t >= T.letgo) {
        // 脱手：整块被风卷起来往右上飞，翻着，越飞越快，飘进白里
        const d = t - T.letgo;
        const lift = (p: V2, k: number): V2 => [p[0] + (420 + 120 * k) * d + 260 * d * d, p[1] - (300 + 160 * k) * d - 420 * d * d + 40 * Math.sin(d * 9 + k * 2)];
        tl = lift(tl, 0);
        tr = lift(tr, 1);
        bl = lift(bl, 0.4);
        br = lift(br, 1.3);
        alpha = 1 - fade(t, T.letgo + 0.55, T.letgo + 1.1);
      }
    }
    const mid = (p: V2, q: V2, k: number): V2 => [(p[0] + q[0]) / 2 + k, (p[1] + q[1]) / 2 + k * 0.4];
    const sheet = new Path2D();
    sheet.moveTo(tl[0], tl[1]);
    const mt = mid(tl, tr, 0);
    sheet.quadraticCurveTo(mt[0], mt[1] + 28, tr[0], tr[1]);
    const mr = mid(tr, br, 30 + flap);
    sheet.quadraticCurveTo(mr[0], mr[1], br[0], br[1]);
    const mb = mid(br, bl, 0);
    sheet.quadraticCurveTo(mb[0] + flap * 0.8, mb[1] + 34, bl[0], bl[1]);
    const ml = mid(bl, tl, -18);
    sheet.quadraticCurveTo(ml[0], ml[1], tl[0], tl[1]);
    sheet.closePath();
    g.save();
    g.globalAlpha = alpha;
    part(g, sheet, "#f8f5ef", "#e6e0d6", 3, [8, 6]);
    // 布上一道褶
    g.strokeStyle = "rgba(170,160,150,0.5)";
    g.lineWidth = 2.4;
    g.beginPath();
    const f0 = mid(tl, tr, 0);
    const f1 = mid(bl, br, flap * 0.5);
    g.moveTo(f0[0], f0[1] + 30);
    g.quadraticCurveTo((f0[0] + f1[0]) / 2 + 20, (f0[1] + f1[1]) / 2, f1[0], f1[1] - 20);
    g.stroke();
    g.restore();
  };

  /** 沉沉（抱住以前）：床单、她（第五镜退开时也在画面右上角） */
  const drawChen = (g: CanvasRenderingContext2D, t: number, z: number) => {
    const c = chenAt(t);
    drawSheet(g, t);
    g.save();
    g.translate(c.x, c.y);
    drawChengtuo(g, c.pose, { line: 1 / Math.sqrt(Math.max(0.3, z)) });
    g.restore();
  };
  /**
   * 画这一场的人（世界坐标）。抱住以前：千斤照第五镜画（drawQj：铁链、锁、眼泪、脚踝上的半截红线都接着），沉沉和床单；
   * 抱住以后：千斤画在沉沉的身子和近处那只手臂之间；⑦ 她漂开以后两个人分开画（千斤在后面，沉沉的手盖在她手上）
   */
  const drawPeople = (g: CanvasRenderingContext2D, t: number, z: number, drawQj: (g: CanvasRenderingContext2D) => void) => {
    const line = 1 / Math.sqrt(Math.max(0.3, z));
    if (t < T.catch) {
      drawQj(g);
      drawChen(g, t, z);
      return;
    }
    const c = chenPosed(t);
    const q = qjPosed(t);
    const qSpec = { ...QJ, hairclip: undefined };
    drawSheet(g, t);
    drawDust(g, t);
    const jq = castJoints(QJ, q.pose);
    // 脚踝上还拴着那半截红线
    const an: V2 = [q.x + jq.ankleL[0], q.y + jq.ankleL[1]];
    g.save();
    g.translate(c.x, c.y);
    if (t > S.start + 0.12) {
      g.save();
      g.translate(-c.x, -c.y);
      drawRedEnd(g, an, t);
      // ⑪ 她手里的砖：画在身子和近处那只手臂之间
      const qb = qjBrickAt(t);
      const wm = g.getTransform();
      drawPerson(g, qSpec, q.pose, q.x, q.y, z, qb
        ? {
            beforeFrontArms: (cc) => {
              cc.save();
              cc.setTransform(wm);
              drawWordBrick(cc, qb[0], qb[1], "活下去", -0.03, brickWarm(t), 3 * line);
              cc.restore();
            },
          }
        : {});
      g.restore();
      // 跑到楼边就不见了（跳到隔壁那栋楼去了：⑧ 退开时只剩千斤一个人）
      if (!(t > S.go && c.x > QJ_HOME.x + QJ_HOME.w - 30)) drawChengtuo(g, c.pose, { line });
    } else {
      const worldM = g.getTransform();
      drawChengtuo(g, c.pose, {
        line,
        beforeFrontArms: (cc) => {
          cc.save();
          cc.setTransform(worldM);
          cc.translate(-c.x, -c.y);
          drawRedEnd(cc, an, t);
          drawPerson(cc, qSpec, q.pose, q.x, q.y, z);
          cc.restore();
        },
      });
    }
    // 手伸在靴筒里：那只靴子再画一遍盖在手上（只画靴口附近）
    if (t > S.start + 0.12 && t < S.empty + 0.14) {
      const rig = rigOf(c.pose);
      const m = bootMap(rig, "R")(MOUTH);
      if (rig.mir) g.scale(-1, 1);
      const near = new Path2D();
      near.arc(m[0], m[1] + 40, 92, 0, Math.PI * 2);
      g.clip(near);
      drawBoot(g, rig, "R", { line: CHEN_COLORS.line, lw: 3 * line, shade: [rig.mir ? -4 : 4, 4] });
    }
    g.restore();
  };

  /** 落地：铁靴踩到楼顶上，两边扬起一小团灰 */
  function drawDust(g: CanvasRenderingContext2D, t: number) {
    const d = t - T.land;
    if (d < 0 || d > 0.6) return;
    const [x, y] = rootAt(T.land);
    g.save();
    for (const [dx, sz, k] of [
      [-90, 1, 0],
      [80, 1.1, 1],
      [-170, 0.7, 2],
      [170, 0.75, 3],
    ] as const) {
      const u = Math.min(1, d / 0.5);
      const a = 0.3 * (1 - u) ** 1.4;
      g.fillStyle = `rgba(214,196,180,${a})`;
      g.beginPath();
      g.ellipse(x + dx * (0.6 + 0.8 * u), y - 30 - 40 * u - k * 6, (50 + 70 * u) * sz, (26 + 30 * u) * sz, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  /** ⑦ 镜头要用的点：她身前那只靴口、她的脸和空着的手中间、两个人的脸 */
  const bootAt = (t: number): V2 => mouthAt(chenAt(t));
  const faceHandAt = (t: number): V2 => {
    const c = chenAt(t);
    const j = jointsOf(c.pose);
    const p = chenPalm(t, "L");
    return [(c.x + j.head[0] + p[0]) / 2, (c.y + j.head[1] + p[1]) / 2];
  };
  const facesAt = (t: number): [V2, V2] => {
    const c = chenAt(t);
    const q = qjAt(t);
    const jc = jointsOf(c.pose);
    const jq = castJoints(QJ, q.pose);
    return [
      [c.x + jc.head[0], c.y + jc.head[1]],
      [q.x + jq.head[0], q.y + jq.head[1]],
    ];
  };

  /** 千斤的头（世界坐标） */
  const qjHeadAt = (t: number): V2 => {
    const q = qjPosed(t);
    const j = castJoints(QJ, q.pose);
    return [q.x + j.head[0], q.y + j.head[1]];
  };

  return { chenAt, qjAt, qjPosed, qjBrickAt, qjHeadAt, brickWarm, chenChest, rootAt, drawPeople, drawChen, bootAt, faceHandAt, facesAt, qjChestOf: (t: number) => qjChest(t) };

  function qjChest(t: number): V2 {
    const q = qjAt(t);
    const o = qjChestOff(q.pose);
    return [q.x + o[0], q.y + o[1]];
  }
}

const mixP = (a: V2, b: V2, k: number): V2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** 她脚踝上拴着的那半截红线（第四镜绷断的，跟着她飘） */
function drawRedEnd(g: CanvasRenderingContext2D, an: V2, t: number) {
  const sw = 10 * Math.sin(t * 2.3);
  g.save();
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(an[0], an[1]);
  g.quadraticCurveTo(an[0] + 8, an[1] + 26, an[0] - 4 + sw, an[1] + 58);
  g.strokeStyle = INK;
  g.lineWidth = 6.5;
  g.stroke();
  g.strokeStyle = "#d8352b";
  g.lineWidth = 3.6;
  g.stroke();
  g.restore();
}

/** 千斤家楼顶沿着女儿墙的一圈铁栏杆（⑦ 沉沉把她的两只手按在上面） */
export const RAIL_TOP = QJ_ROOF - 290;
export function drawQjRail(g: CanvasRenderingContext2D) {
  const x0 = QJ_HOME.x + 10;
  const x1 = QJ_HOME.x + QJ_HOME.w - 10;
  const y = QJ_ROOF - 34;
  g.save();
  g.lineCap = "round";
  const pipe = new Path2D();
  pipe.moveTo(x0, RAIL_TOP);
  pipe.lineTo(x1, RAIL_TOP);
  pipe.moveTo(x0, RAIL_TOP + 120);
  pipe.lineTo(x1, RAIL_TOP + 120);
  for (let x = x0; x <= x1 + 1; x += (x1 - x0) / 8) {
    pipe.moveTo(x, RAIL_TOP);
    pipe.lineTo(x, y);
  }
  g.strokeStyle = INK;
  g.lineWidth = 8;
  g.stroke(pipe);
  g.strokeStyle = "#7d8a94";
  g.lineWidth = 4.2;
  g.stroke(pipe);
  // 上沿一道高光
  g.strokeStyle = "rgba(240,236,228,0.6)";
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(x0, RAIL_TOP - 1.2);
  g.lineTo(x1, RAIL_TOP - 1.2);
  g.stroke();
  g.restore();
}

// ——————————————— 镜头 ———————————————
/**
 * ⑥ 的镜头：接着第五镜往上退开的那个镜头（不切）。她一惊一顿；中心挪到两个人中间，按两人的距离推近（越近越近），抱住一震；
 * 抱住以后跟着两个人往左飘、慢慢退开一点（看得见下面千斤家的楼顶），落下来轻轻一沉。
 */
export function roofCam(t: number, r: ReturnType<typeof makeRoof>, sky: ReturnType<typeof makeSky>): Cam {
  const T = ROOF_T;
  let c = skyCam(t, sky);
  // 两个人越近推得越近
  const w2 = E.io(ph(t, T.cut + 0.05, T.jump));
  if (w2 > 0) {
    const ch = r.chenChest(Math.min(t, T.catch));
    const q = r.qjChestOf(Math.min(t, T.catch));
    const d = Math.hypot(ch[0] - q[0], ch[1] - q[1]);
    const z = Math.max(1, Math.min(1.6, 700 / Math.max(1, d)));
    c = camLerp(c, aim((ch[0] + q[0]) / 2, (ch[1] + q[1]) / 2, 540, 1000, z), w2);
  }
  // 抱住以后：跟着两个人往左飘，慢慢退开（1.6 → 1.15），两个人在画面左中，下面千斤家的楼顶飘过来
  const w3 = E.io(ph(t, T.catch + 0.04, T.catch + 0.4));
  if (w3 > 0) {
    const a = r.chenChest(t);
    const b2 = r.qjChestOf(t);
    const u = E.io(ph(t, T.catch, T.land + 0.2));
    c = camLerp(c, aim((a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2, 540 - 100 * u, 940, 1.6 * Math.pow(1.15 / 1.6, u)), w3);
  }
  // ⑦ 一路推近、不往回拉：跟着她弯腰、手伸进靴筒（1.5 倍，靴口在画面下方，上面是被她牵着往上漂的千斤）；空手一顿，
  // 跟着手拿出来往上推到她的脸和手（1.75）；「你」她抬头、把千斤拽下来按到栏杆上，落到两张脸中间（1.85）；「我」推到 2.2；
  // 她跑走了，镜头留在千斤脸上，再慢慢退开
  const S = STAY_T;
  if (t > S.start) {
    const m = r.bootAt(Math.min(t, S.empty));
    c = camLerp(c, aim(m[0] + 20, m[1], 610, 1290, 1.5), E.io(ph(t, S.start, S.reach + 0.04)));
    const wB = E.io(ph(t, S.empty, S.look + 0.02));
    if (wB > 0) {
      const f = r.faceHandAt(Math.min(t, S.look));
      c = camLerp(c, aim(f[0], f[1], 610, 1120, 1.75), wB);
    }
    const [f1, f2] = r.facesAt(Math.min(t, S.go));
    const mid: V2 = [(f1[0] + f2[0]) / 2, (f1[1] + f2[1]) / 2];
    const wC = E.io(ph(t, S.look, S.rail1 + 0.06));
    if (wC > 0) c = camLerp(c, aim(mid[0], mid[1], 540, 900, 1.85), wC);
    const wD = E.out(ph(t, S.rail1 + 0.06, S.say + 0.06));
    if (wD > 0) c = camLerp(c, aim(mid[0], mid[1], 540, 880, 2.2), wD);
    const wE = E.io(ph(t, S.go, S.go + 0.5));
    if (wE > 0) {
      const qf = r.facesAt(t)[1];
      c = camLerp(c, aim(qf[0], qf[1] + 40, 480, 880, 2.2), wE);
    }
    // 只剩她一个人：慢慢退开，露出整个人往左歪着漂起来、攥着栏杆（⑧ 接着退）
    const wF = E.io(ph(t, S.go + 0.3, S.end + 0.6));
    if (wF > 0) {
      const q = r.qjChestOf(t);
      c = camLerp(c, aim(q[0], q[1], 640, 940, 1.8), wF);
    }
  }
  // 一惊一顿、抱住一震、落地轻轻一沉；⑦ 空手一顿
  c = { ...c, z: c.z * (1 + 0.04 * kick(t, T.shock, 0.1) + 0.06 * kick(t, T.catch, 0.09) + 0.02 * kick(t, T.land, 0.1) + 0.03 * kick(t, STAY_T.empty, 0.1)) };
  c = { ...c, y: c.y - (16 * kick(t, T.land, 0.12)) / c.z };
  return c;
}

export function roofShake(t: number) {
  return 6 * kick(t, ROOF_T.shock, 0.07) + 10 * kick(t, ROOF_T.catch, 0.08) + 5 * kick(t, ROOF_T.land, 0.08);
}
