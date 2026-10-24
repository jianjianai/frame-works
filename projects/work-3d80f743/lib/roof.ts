// 第二幕第七镜「请你等等我」（27.8–29.79，请 27.84 你 28.23 等 28.44 等 28.59 我 28.80）：
// 2026-10-20 用户重排（「请你等等我：主角冲出来抱住她，飘到另外一栋楼」）：原来⑥这一段整个往后挪一小节（2 秒，卡的底鼓不变）。
// 最高那栋楼的楼顶，白就压在头顶上。沉沉一直在楼顶晾衣绳边收白床单（第六镜退开时就在右上角：用户 2026-10-19
// 「这一幕主角应该就在右上角了。不用切镜头，改为运镜」）。一扯下来就看见千斤张着手往白里飘——一惊（底鼓），
// 床单脱手被风卷走，她踩着铁靴冲到楼边、蹬出去，「等」在千斤的手快碰到白的地方从身后一把抱住；两个人在天上带着往左的惯性
// 慢慢飘、慢慢往下落（用户：「抱住她之后，在天上慢慢往左边飘，惯性飘到左边的房子上」），29.51 千斤在半空里转过身来抱住她，
// 第二句「请你等等我」刚开头（30.01）正好飘到千斤家那栋楼的楼顶，**落下来就是坐着的**（2026-10-20 用户：「两人不要站着落地，
// 也不是蹲着，是直接落地就坐在地上」）：沉沉在半空里就把腿往前伸成坐的样子，屁股先着地、两只铁靴搁在前面。
// 镜头：第六镜往上退开的那个镜头接着走、不切；她一惊一顿；按两个人的距离推近（越近越近），抱住一震；跟着两个人往左飘，
// 慢慢退开一点，坐到楼顶上那一下轻轻一沉。⑧ 接着在这里抱着（还是同一个镜头）。

import { beatAt } from "@frame/engine/tempo";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf, swapSides } from "@materials/剪纸角色/code/chengtuo";
import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { INK, QJ_HOME, TOWER, drawGlow, part } from "./world";
import { drawPerson } from "./people";
import { ARMS, LIMP, fade, hitch, live, withDrag } from "./motion";
import { CHEN } from "./poses";
import { CHEN2, QIANJIN } from "./poses2";
import { TOWER_ROOF } from "./props";
import { type makeSky, skyCam } from "./sky";
import { WORD_BRICK, drawWordBrick } from "./brick";

type V2 = [number, number];
const b = beatAt;

export const ROOF_T = {
  /** 第六镜的镜头从这里交给这一镜（「请」27.84；不切镜头） */
  cut: 27.8,
  /** 把床单从绳子上扯下来、看见她 */
  pull: 27.84,
  see: 27.96,
  /** 一惊（小节线的底鼓） */
  shock: b(56),
  /** 床单脱手、冲 */
  letgo: 28.07,
  run0: 28.06,
  /** 蹬着楼边跳出去（她在巷子正中间，离楼边约 460：一步冲到楼边就跳，跳起来划一道弧、在往下落的那段抱住她） */
  jump: 28.17,
  /** 「等」半空里从身后抱住她 */
  catch: 28.46,
  /** 坐着落在千斤家那栋楼的楼顶（第二句「请你等等我」刚开头、鼓停的那一下） */
  land: b(60),
  /** 下一句「请你等等我」（第二句） */
  end: 29.79,
};

/**
 * ⑧「请你等等我」第二句（29.79–31.97，请 29.79 你 30.24 等 30.42 等 30.60 我 30.78–31.83；30.0–32.0 鼓停、低音悬着）：
 * 2026-10-20 用户：「两人坐在另外一栋楼上，拥抱着」「第二句请你等等我的时候刚好飘到，两人不要站着落地，也不是蹲着，是直接落地就坐在地上」。
 * 还是同一个镜头（⑥⑦⑧一镜到底）。29.51（底鼓）还在半空里，千斤一下转过身来抱住她，把脸埋在她胸口；两个人抱着慢慢落下来，
 * 30.01 鼓一停正好坐到千斤家楼顶上（沉沉屁股着地、腿往前伸，千斤坐在她怀里）；「等、等、我」沉沉在她耳边轻轻说，「我」千斤哭出来。
 * 音乐悬着的这两秒里天黑下来，城里的窗一组组亮（lib/night.ts 的 duskAt）——两个人一直这样抱着。
 * （原来这两句「请你等等我」是空靴子、按住她的手说「等等我」、跑走、千斤像风筝一样攥着栏杆等、飞进她亮起来的窗，2026-10-20 换掉；
 * ⑪ 她抱着砖回来时千斤还是攥着栏杆漂着的风筝，那几秒在⑨⑩ 屋里，看不见。）
 */
/** ⑧ 铁靴踩到楼顶以后抱着她坐下去（30.12–30.45）；千斤坐到她腿上以后才把腿折到身子底下 */
const SIT0 = b(60) + 0.11;
const SIT1 = b(60) + 0.44;
export const HUG_T = {
  start: 29.79,
  /** 抱住那一下她就扑进沉沉怀里（照草稿：一抱住就搂住、把脸埋进去，不先张着手愣着）：2026-10-24 从 29.01 挪到抱住后 0.12 */
  turn: 28.58,
  /** 两只手环到她背上、脸埋在她胸口 */
  hug1: 28.86,
  /** 「等、等、我」在她耳边说 */
  say: [30.42, 30.6, 30.78],
  /** 「我」千斤抬起头，靠在她身上 */
  lean: 30.8,
  /** 切进她的屋子（⑨） */
  end: 31.97,
};

/**
 * ⑪「妄想用它拯救你」（35.88–37.8：妄 35.91 想 36.12 用 36.42 它 36.63 拯 36.81 救 37.17 你 37.26；底鼓 36.016、37.016）：
 * 2026-10-20 用户改：「两块五的签字笔：主角写砖头 / 东拼西凑的词句：展示写好的各种砖头 / 妄想用它拯救你：回到之前救下另外一个人的场景，把砖递给她」。
 * 切回楼顶上两个人抱着坐着的那一刻（和⑧最后同一个样子、同一个取景）：沉沉松开一点，千斤从她胸口抬起头、两只手放下来；
 * 沉沉近处那只手伸进外套兜里，掏出一块写着「活下去」的砖，放进千斤垂在身前的两只手里（千斤不伸手去接：是她放进去的）；
 * 砖一沉，千斤的手往下一坠、人往下一沉，愣愣地低头看；37.016 砖暖起来、亮起来，千斤抬起头哭着笑了，沉沉歪过头靠着她笑。
 * （原来是千斤一个人攥着栏杆漂成风筝、沉沉抱着刚写好的砖从最高那栋楼跳过来递给她，⑩ 里她抱着砖冲出门；2026-10-20 换掉）
 */
export const GIVE_T = {
  start: 35.88,
  /** 沉沉松开一点、往后靠；千斤抬起头，两只手从她背上放下来 */
  loosen0: 35.92,
  loosen1: 36.3,
  /** 近处那只手伸进外套兜里、掏出砖 */
  pocket0: 36.08,
  pocket1: 36.34,
  /** 放进千斤手里（「它」） */
  show: 36.47, give: 36.68,
  /** 砖一沉（「拯」） */
  drop: 36.81,
  /** 砖暖起来（底鼓） */
  warm: b(74),
  /** 千斤抬起头哭着笑（「救」）、沉沉歪过头靠着她（「你」） */
  smile: 37.17,
  pat: 37.26,
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
/** ⑧ 转过身来抱着：千斤的头在沉沉的头左边多远（脸贴着脸，两张脸都露出来） */
const CRADLE_X = -54;
/** ⑧ 半空里抱着时千斤身子直着，比坐好的位置再往沉沉那边贴多少 */
const AIR_DX = 72;
/** 落在千斤家楼顶的地方（沉沉的根） */
const X_LAND = QJ_HOME.x + 540;
/** ⑪ 千斤两只手攥在栏杆上的地方（两只手中间） */
const GRIP_X = X_LAND - 214;
/** ⑪ 风筝：她回家写砖那几秒（⑨⑩ 在屋里，看不见）千斤一个人攥着栏杆漂起来；KITE0 起换成风筝，KITE1 漂到 */
const KITE0 = 99;
const KITE1 = 100;
const kiteK = (t: number) => E.io(ph(t, KITE0, KITE1));

/** 抱着飘：抱住了，松一口气，闭着眼、嘴角带一点笑，脸贴在她头边（2026-10-24 用户：「被抱住到飘到对面是一种很温暖的感觉」） */
const FLOAT_SOFT = { ...CHEN2.抱着飘, expression: "闭眼", teeth: 0, smile: 0.4, neck: -18 } as PoseIn;

export function makeRoof(sky: ReturnType<typeof makeSky>) {
  const T = ROOF_T;
  const S = HUG_T;
  // ——— 沉沉 ———
  const run = (p: typeof CHEN.跑_落地, swap: boolean) => ({ ...(swap ? swapSides(p) : p), expression: "坚定", lookX: -0.7, lookY: -0.2 });
  const chenMove = live(
    [
      // 背对着千斤（朝右）在收床单：攥着床单左头往下扯
      // 靴筒里的砖今天全送完了（第二幕里她的靴筒一律是空的）
      { t: 25.9, x: 0, items: { bricks: 0 }, p: { ...CHEN2.收床单, face: 1, ground: false, lift: -8 } },
      { t: T.pull, p: { ...CHEN2.收床单, face: 1, ground: false, lift: -8 } },
      // 扯下来：两只手往下一拽，回头——
      { t: T.see, ease: "out", p: { ...CHEN2.收床单, face: 1, ground: false, lift: -8, neck: 2, ...pull(), headTurn: -0.9, lookX: -0.9 } },
      // ——一下转过身来，一惊
      { t: T.shock, ease: "out", p: { ...CHEN2.一惊, ground: false, lift: -8, headTurn: 0 } },
      // 冲：一大步冲到楼边（铁靴），另一只脚踩上楼边蹬出去
      { t: T.run0, ease: "inOut", p: run(CHEN.跑_蹬地, false) },
      { t: T.run0 + 0.05, ease: "out", p: run(CHEN.跑_腾空, false) },
      { t: T.jump - 0.03, ease: "inOut", p: run(CHEN.跑_落地, true) },
      { t: T.jump - 0.01, ease: "inOut", p: run(CHEN.跑_蹬地, true) },
      { t: T.jump + 0.08, ease: "out", p: CHEN2.扑 },
      { t: T.catch, ease: "out", p: CHEN2.抱住 },
      // 抱着她在天上飘：抱住了——松一口气，慢慢闭上眼、嘴角松开，脸贴在她头边（腿软软地垂着）
      { t: T.catch + 0.45, ease: "inOut", p: FLOAT_SOFT },
      // 快到楼顶：睁开眼低头看楼顶，腿伸下去，铁靴先踩到楼顶上（膝盖一弯吃住分量），再抱着她坐下去（用户 2026-10-20：「主角应该脚先触地之后再坐下」）
      { t: T.land - 0.55, p: FLOAT_SOFT },
      { t: T.land - 0.25, ease: "inOut", p: { ...CHEN2.抱着坠, expression: "心疼", teeth: 0 } },
      { t: T.land, ease: "out", squash: 0.05, p: CHEN2.落地 },
      { t: SIT0, p: CHEN2.落地 },
      { t: SIT1, ease: "inOut", p: CHEN2.坐地抱 },
      { t: SIT1 + 0.12, ease: "out", squash: 0.04, p: CHEN2.坐地抱 },
      { t: SIT1 + 0.3, ease: "inOut", squash: 0, p: CHEN2.坐地抱 },
      // ⑧「等、等、我」低头在她耳边说；之后闭着眼抱着
      { t: S.say[2] + 0.3, ease: "inOut", p: CHEN2.坐地抱_贴脸 },
      // ⑪ 回到这一刻：松开一点、往后靠，睁开眼看着她；掏出砖放进她手里；砖暖起来，含着泪笑
      { t: GIVE_T.loosen0, p: CHEN2.坐地抱_贴脸 },
      { t: GIVE_T.loosen1, ease: "inOut", p: CHEN2.坐地_看她 },
      // 递：身子往她那边倾过去，看着她的脸，嘴角带着笑；放进她手里以后靠回来一点
      { t: GIVE_T.pocket1, p: CHEN2.坐地_看她 },
      { t: GIVE_T.give, ease: "inOut", p: { ...CHEN2.坐地_看她, lean: 18, neck: -14, smile: 0.4 } },
      { t: GIVE_T.drop + 0.12, p: { ...CHEN2.坐地_看她, lean: 18, neck: -14, smile: 0.4 } },
      { t: GIVE_T.warm, ease: "inOut", p: { ...CHEN2.坐地_看她, lean: 8, smile: 0.3 } },
      { t: GIVE_T.smile, ease: "inOut", p: CHEN2.坐地_笑 },
      { t: 40, p: CHEN2.坐地_笑 },
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
        // ⑧「等、等、我」：贴着她的头轻轻说，嘴一张一合
        const say = (t0: number, a: number) => (t > t0 - 0.02 && t < t0 + 0.16 ? a * Math.sin((Math.PI * (t - t0 + 0.02)) / 0.18) : 0);
        const m = say(S.say[0], 0.4) + say(S.say[1], 0.4) + say(S.say[2], 0.55);
        if (m > 0) o.open = Math.max(o.open ?? 0, m);
        // 坐下来以后抱着她轻轻地晃（哄她）
        const rock = fade(t, SIT1 + 0.2, SIT1 + 0.6);
        o.lean += 2.5 * rock * Math.sin((t - SIT1 - 0.2) * 3.4);
      },
    },
  );
  /** 扯床单那一下：手往下拽到胸口 */
  function pull() {
    return { shoulderL: 50, elbowL: 50, shoulderR: 62, elbowR: 44 };
  }

  // ——— 两个人的路线：沉沉的根（两脚之间的地面；坐着时是屁股底下的地面） ———
  const chenChestOff = (pose: PoseIn): V2 => {
    const j = jointsOf(pose);
    return [(j.shoulderL[0] + j.shoulderR[0]) / 2, (j.shoulderL[1] + j.shoulderR[1]) / 2 + 40];
  };
  // 抱住那一刻千斤的胸口（按第六镜她往上飘的路线算）→ 反算沉沉的根
  const qjCatch = sky.chestOf(sky.qjAt(T.catch));
  const hugPose = chenMove(T.catch).pose;
  const cc = chenChestOff(hugPose);
  const P_CATCH: V2 = [qjCatch[0] - HUG[0] - cc[0], qjCatch[1] - HUG[1] - cc[1]];
  const P_EDGE: V2 = [X_EDGE, TOWER_ROOF];
  /** 抱住那一刻、坐在楼顶上那一刻她的胸口：抱着飘的这一段按胸口走（半空里腿慢慢收成坐姿、胯的高度变了，人不跟着跳） */
  const C_CATCH: V2 = [P_CATCH[0] + cc[0], P_CATCH[1] + cc[1]];
  const C_LAND: V2 = (() => {
    const o = chenChestOff(chenMove(T.land).pose);
    return [X_LAND + o[0], QJ_ROOF + o[1]];
  })();
  /**
   * 抱着飘的这一段胸口在哪（2026-10-24 照草稿重做；用户：「你看看草稿为什么可以给人这种感觉，这里却没有」）：
   * 最沉的人抱住了最轻的人——扑下来的那一沉（DIP_K 的落差）0.18 秒就被她的「轻」托住，之后两个人几乎悬着、很慢很慢地往下飘；
   * 往左：扑过来的冲劲很快散掉（XM_K 的距离），剩下的柔和起步、柔和停住地飘过巷子，30.01 刚好落在千斤家楼顶。
   * 不要先被往上带、悬着再落，不要在楼顶上空竖着掉，不要靠降低楼顶做速度感。
   */
  const DIP_K = 0.6;
  const XM_K = 0.12;
  const chestPath = (t: number): V2 => {
    const s = Math.max(0, t - T.catch);
    const S0 = T.land - T.catch;
    const u = ph(t, T.catch, T.land);
    const m = (1 - Math.exp(-u / 0.08)) / (1 - Math.exp(-1 / 0.08));
    // 退远的那一段（29.0–29.65）她们还悬在巷子中间，29.55 前后才飘过千斤家楼顶的边
    const v = ph(u, 0.15, 1);
    const x = C_CATCH[0] + (C_LAND[0] - C_CATCH[0]) * (XM_K * m + (1 - XM_K) * v * v * (3 - 2 * v));
    const dip = (1 - Math.exp(-s / 0.18)) / (1 - Math.exp(-S0 / 0.18));
    const y = C_CATCH[1] + (C_LAND[1] - C_CATCH[1]) * (DIP_K * dip + (1 - DIP_K) * (s / S0));
    return [x, y];
  };
  const rootAt = (t: number): V2 => {
    if (t <= T.run0) return [X_C0, TOWER_ROOF];
    if (t <= T.jump) {
      // 冲：从慢到快（第一步蹬出去）
      const u = ph(t, T.run0, T.jump);
      return [X_C0 + (X_EDGE - X_C0) * (0.55 * u + 0.45 * u * u), TOWER_ROOF];
    }
    if (t <= T.catch) {
      // 扑下去：蹬出去先略往上拱一点，接着越落越快，往左下扑到她身上（抱住那一下带着往下的速度）
      const u = ph(t, T.jump, T.catch);
      return [P_EDGE[0] + (P_CATCH[0] - P_EDGE[0]) * u, P_EDGE[1] + (P_CATCH[1] - P_EDGE[1]) * u * u - 60 * Math.sin(Math.PI * u)];
    }
    if (t <= T.land) {
      // 抱住以后：她轻、她沉，两个人差不多悬住了——按胸口的路线慢慢往左飘、慢慢落下来
      const p = chestPath(t);
      const o = chenChestOff(chenMove(t).pose);
      return [p[0] - o[0], p[1] - o[1]];
    }
    // 坐在楼顶上：坐姿的胯离根 45（lift −235），根就是楼顶
    return [X_LAND, QJ_ROOF];
  };
  /** 身子的速度（头发、围巾按它往反方向甩）：抱住以前按根，抱住以后按胸口（半空里收腿时根会跟着动，身子没动） */
  const velAt = (t: number): V2 => {
    const d = (f: (s: number) => V2): V2 => {
      const a = f(t - 0.02);
      const c = f(t + 0.02);
      return [(c[0] - a[0]) / 0.04, (c[1] - a[1]) / 0.04];
    };
    const w = fade(t, T.catch, T.catch + 0.15);
    if (w <= 0) return d(rootAt);
    const vc = d((s) => {
      const r = rootAt(s);
      const o = chenChestOff(chenMove(s).pose);
      return [r[0] + o[0], r[1] + o[1]];
    });
    return w >= 1 ? vc : mixP(d(rootAt), vc, w);
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
      // 被接住：一惊（0.06 秒），接着就扑进她怀里——两只手环到她背上、脸埋在她胸口哭（她本来就朝右、对着沉沉，不用转身；
      // S.turn 那一帧只是把朝左写的姿势换成朝右写的，朝向不变）
      { t: T.catch + 0.06, ease: "out", p: QIANJIN.被抱住 },
      { t: S.turn - 0.01, p: QIANJIN.被抱住 },
      { t: S.turn, ease: "hold", p: { ...QIANJIN.被抱住, face: 0.6 } },
      // 腿在半空里软软地垂着，落到楼顶以后才折到身子底下跪坐在她腿上（不提前收）
      { t: S.hug1, ease: "out", p: QIANJIN.转身抱_垂腿 },
      // 两个人一起坐下来：沉沉往下坐的同时千斤把腿折到身子底下，同一刻坐稳（用户 2026-10-20：「他们两个人要一起坐下来」）
      { t: SIT0 - 0.06, p: QIANJIN.转身抱_垂腿 },
      { t: SIT0 + 0.2, ease: "inOut", p: QIANJIN.转身抱 },
      { t: S.lean - 0.02, p: QIANJIN.转身抱 },
      { t: S.lean + 0.3, ease: "inOut", p: QIANJIN.转身抱_哭 },
      // ⑪ 回到这一刻：抬起头看着她，两只手放下来；砖放进手里，低头看，一愣；砖暖起来，抬头哭着笑
      { t: GIVE_T.loosen0, p: QIANJIN.转身抱_哭 },
      { t: GIVE_T.loosen1, ease: "inOut", p: QIANJIN.抬头看她 },
      { t: GIVE_T.show - 0.14, p: QIANJIN.抬头看她 },
      { t: GIVE_T.show + 0.1, ease: "inOut", p: { ...QIANJIN.抬头看她, neck: -6, expression: "惊", lookX: 0.4, lookY: 0.5 } },
      { t: GIVE_T.give, p: { ...QIANJIN.抬头看她, neck: -6, expression: "惊", lookX: 0.4, lookY: 0.5 } },
      { t: GIVE_T.drop + 0.08, ease: "out", p: QIANJIN.捧砖_看 },
      { t: GIVE_T.smile - 0.04, p: QIANJIN.捧砖_看 },
      { t: GIVE_T.smile + 0.4, ease: "inOut", p: QIANJIN.捧砖_哭着笑 },
      { t: 40, p: QIANJIN.捧砖_哭着笑 },
    ] as MoveKey[],
    {
      look: lookOf(QJ),
      base: { wind: 1.1 },
      idle: false,
      seed: 63,
      springs: LIMP,
      follow: 0,
      add: (t, o) => {
        // 上一镜（高空开锁）起她朝右（lib/sky.ts）：抱住以后也不转回去，一直朝右——沉沉从右边扑过来，正好面对面抱住；
        // 姿势表里抱住、转身前这几个是朝左写的，这里翻过来（「我」以后的底鼓那一下本来是翻成朝右，现在前后都是朝右，不翻了）
        // （用户 2026-10-20：「这里不要转回去啊」）
        if (t < S.turn) {
          o.face = -o.face;
          if (typeof o.wind === "number") o.wind = -o.wind;
        }
        // ⑧ 埋在她怀里哭：肩膀一抽一抽
        const k = fade(t, S.hug1 - 0.1, S.hug1 + 0.2) * (1 - fade(t, GIVE_T.loosen0, GIVE_T.loosen1));
        const h = hitch(t, 0.62, 0.1);
        o.neck -= 4 * k * h;
        o.lean += 3 * k * h;
        o.shoulderL += 4 * k * h;
        o.shoulderR += 4 * k * h;
      },
    },
  );
  const qjPose = (t: number): PoseIn => {
    const pose: PoseIn = { ...qjMove(t).pose };
    // 抱着时和她一起飘：头发、衣服按两个人的速度甩；⑪ 她一个人攥着栏杆，几乎不动
    const v = t < KITE0 ? velAt(t) : [0, 0];
    // 踩到楼顶以后抱着坐下去那一下胸口往下走得快：千斤的齐肩短发按这个速度会往上甩成一圈尖，只给一点
    // 抱住以后带着往下的惯性一路往下沉（每秒一千多）：齐肩短发同样会往上甩成尖，也只给一点
    const vmax = t > T.catch - 0.05 && t < KITE0 ? 300 : 2000;
    const hmax = t > T.catch - 0.05 && t < KITE0 ? 700 : 4000;
    withDrag(pose, [Math.max(-hmax, Math.min(hmax, v[0])), Math.max(-vmax, Math.min(vmax, v[1]))], 0.9);
    // ⑪ 被白往上拽：两条腿在风里一下一下地飘
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
  /** 她还轻飘飘的：脚不着地（沉沉蹲下去时她不跟着往下压，鞋底离楼顶至少 gap；⑧ 被搂着坐下来时脚可以挨着楼顶） */
  const floating = (pose: PoseIn, x: number, y: number, gap = 24) => {
    const j = castJoints(QJ, pose);
    const low = Math.max(j.ankleL[1], j.ankleR[1]) + 40;
    return { pose, x, y: Math.min(y, QJ_ROOF - gap - low) };
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
    let at = mixP(own, [c[0] + HUG[0], c[1] + HUG[1]], w);
    // ⑧ 转过身来抱住她：和她贴成一个整体一起落下来（相对她胸口的位置按「坐到楼顶上那一刻」算：千斤的脚刚好在楼顶上、脸贴着她的脸），
    // 两个人同一刻着地——千斤要是按自己的头去够，腿会比沉沉的屁股先碰到楼顶，像蹲着先落了地
    const wc = E.io(ph(t, S.turn, S.hug1));
    if (wc > 0) {
      const c2 = chenChest(t);
      const root: V2 = [c2[0] + HUG_REL()[0], c2[1] + HUG_REL()[1]];
      at = mixP(at, [root[0] + qc[0], root[1] + qc[1]], wc);
      // 半空里她身子是直的（不往前倾，用户 2026-10-20：「红衣服的身体不要向前倾斜，和主角贴近一点」）：整个人往沉沉那边贴 AIR_DX，
      // 坐下去时（跪坐、身子前倾）收回到坐好的位置
      at = [at[0] + AIR_DX * wc * (1 - E.io(ph(t, SIT0, SIT1))), at[1]];
    }
    return floating(pose, at[0] - qc[0], at[1] - qc[1], 24 - 30 * wc);
  };
  /** ⑧ 抱在一起时千斤的根在沉沉胸口的哪里：按坐到楼顶上、腿折好跪坐下去那一刻算（她的脚离楼顶 4、头在沉沉的头左边 60） */
  let hugRel: V2 | null = null;
  const HUG_REL = (): V2 => {
    if (hugRel) return hugRel;
    const cp = chenMove(SIT1 + 0.4).pose;
    const cj = jointsOf(cp);
    const co = chenChestOff(cp);
    const qp = qjMove(SIT1 + 0.4).pose;
    const qj = castJoints(QJ, qp);
    const low = Math.max(qj.ankleL[1], qj.ankleR[1]) + 40;
    const rx = X_LAND + cj.head[0] + CRADLE_X - qj.head[0];
    const ry = QJ_ROOF - 4 - low;
    hugRel = [rx - (X_LAND + co[0]), ry - (QJ_ROOF + co[1])];
    return hugRel;
  };

  // ——— ⑪ 千斤攥着栏杆的两只手 ———
  /** 栏杆上两只手的地方：右边是近处那只（L），左边是远处那只（R） */
  const GL: V2 = [GRIP_X - 22, RAIL_TOP + 2];
  const GR: V2 = [GRIP_X + 24, RAIL_TOP + 2];
  /** 沉沉连两只手一起：抱住以后两只手臂环在她腰上（⑧ 坐下来也一直抱着） */
  const chenPosed = (t: number) => {
    const c = chenAt(t);
    const hugW = fade(t, T.catch - 0.04, T.catch + 0.02);
    if (hugW <= 0) return c;
    const pose: PoseIn = { ...c.pose };
    const q0 = qjHugAt(t);
    const jq = castJoints(QJ, q0.pose);
    const waist: V2 = [q0.x + jq.hip[0], q0.y + jq.hip[1] - 60];
    let tl: V2 = [waist[0] - 34, waist[1] + 4];
    let tr: V2 = [waist[0] - 6, waist[1] - 20];
    // ⑧ 她转过身来扑在怀里：两只手臂环到她背上（她朝右，背在左边）
    const wc = E.io(ph(t, S.turn, S.hug1));
    if (wc > 0) {
      const chest: V2 = [q0.x + (jq.shoulderL[0] + jq.shoulderR[0]) / 2, q0.y + (jq.shoulderL[1] + jq.shoulderR[1]) / 2 + 40];
      tl = mixP(tl, [chest[0] - 46, chest[1] + 20], wc);
      tr = mixP(tr, [chest[0] - 30, chest[1] - 24], wc);
    }
    // ⑪ 近处那只手：从她背上松开 → 伸进外套兜里 → 掏出砖、托着送到她身前、放进她手里 → 手一直在砖底下护着（擦眼泪、摸头都试过：胳膊会横过自己或她的脸）
    if (t > GIVE_T.loosen0) {
      const G = GIVE_T;
      const pk = pocketAt(t);
      tl = mixP(tl, [pk[0] + 6, pk[1] - 10], E.io(ph(t, G.pocket0, G.pocket1 - 0.04)));
      const b = brick11(t);
      if (b) tl = mixP(tl, [b[0] + WORD_BRICK.w / 2 - 4, b[1] - 8], E.io(ph(t, G.pocket1 - 0.06, G.pocket1 + 0.04)));
      if (t > G.give) {
        // 她把砖抱进怀里：这只手跟上去，托在她捧着砖的手下面（砖右头底下，不挡字），胳膊弯着
        const bb = brick11(t);
        if (bb) tl = mixP(tl, [bb[0] + WORD_BRICK.w / 2 + 8, bb[1] + 26], E.io(ph(t, G.warm + 0.05, G.warm + 0.5)));

      }
    }
    const mx = (pose.face ?? -1) > 0 ? -1 : 1;
    pose.armL = { ...(pose.armL as object), to: [(tl[0] - c.x) * mx, tl[1] - c.y], ik: hugW };
    pose.armR = { ...(pose.armR as object), to: [(tr[0] - c.x) * mx, tr[1] - c.y], ik: hugW };
    return { pose, x: c.x, y: c.y };
  };
  /** 千斤在哪：抱住以前、⑦⑧⑪ 被抱着（贴在沉沉身前）；⑪ 砖放进手里那一下往下一沉 */
  const qjAt = (t: number) => {
    const q = qjHugAt(t);
    const d = t - GIVE_T.drop;
    if (d <= 0) return q;
    // 砖一沉：整个人往下一坠，再回来一点（有了分量）
    const sink = 26 * (1 - Math.exp(-d / 0.05)) - 12 * (1 - Math.exp(-d / 0.3));
    return { ...q, y: q.y + sink };
  };
  /** 千斤连两只手一起：⑪ 两只手攥在栏杆上（IK） */
  const qjPosed = (t: number) => {
    const q = qjAt(t);
    const pose: PoseIn = { ...q.pose };
    const k = QJ.scale;
    const mir = (pose.face ?? 0) > 0 ? -1 : 1;
    const loc = (p: V2): V2 => [((p[0] - q.x) / k) * mir, (p[1] - q.y) / k];
    {
      // ⑧ 转过身来抱住她：两只手环到她背后（近处那只露在她身侧，远处那只藏在她身后）；⑪ 她松开时两只手放下来
      const wk = fade(t, S.turn, S.hug1 + 0.05) * (1 - E.io(ph(t, GIVE_T.loosen0, GIVE_T.loosen0 + 0.3)));
      if (wk > 0) {
        const ch = chenChest(t);
        pose.armL = { ...(pose.armL as object), to: loc([ch[0] + 34, ch[1] + 40]), ik: wk };
        pose.armR = { ...(pose.armR as object), to: loc([ch[0] + 20, ch[1] - 6]), ik: wk };
      }
      // ⑪ 她不伸手：松开以后两只手软软地放在腿上（就是砖要落下来的地方），沉沉把砖放进来，手才托住它（读成沉沉主动给，不是她讨要）
      const wb = E.io(ph(t, GIVE_T.loosen0 + 0.15, GIVE_T.loosen1 + 0.1));
      const b = wb > 0 ? (t < GIVE_T.give ? lapAt(t) : brick11(t)) : null;
      if (b) {
        const hw = WORD_BRICK.w / 2 - 6;
        const hk = hugBrickK(t);
        // 抱进怀里：近处那只手（画在砖前面）挪到离自己近的左头底下托着，远处那只（在身子后面）去右头——
        // 近处那只手还去右头的话，胳膊斜着横过砖上的字（用户：「砖被挡住了」）
        const nearX = b[0] + hw - (2 * hw - 6) * hk;
        pose.armL = { ...(pose.armL as object), to: loc([nearX, b[1] + 8 + 20 * hk]), ik: wb };
        pose.armR = { ...(pose.armR as object), to: loc([b[0] - hw + (2 * hw - 10) * hk, b[1] + 8 - 4 * hk]), ik: wb };
      }
    }
    return { ...q, pose };
  };
  /** ⑪ 沉沉外套兜在哪（她胸口右下、外套下摆那个兜） */
  const pocketAt = (t: number): V2 => {
    const c = chenAt(t);
    const j = jointsOf(c.pose);
    return [c.x + (j.shoulderL[0] + j.shoulderR[0]) / 2 + 44, c.y + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 190];
  };
  /** ⑪ 放进她手里的地方：她身前、两个人中间、肚子那么高（跟着她的身子） */
  const lapAt = (t: number): V2 => {
    const q = qjHugAt(t);
    const j = castJoints(QJ, q.pose);
    const d = t - GIVE_T.drop;
    const sink = d > 0 ? 26 * (1 - Math.exp(-d / 0.05)) - 12 * (1 - Math.exp(-d / 0.3)) : 0;
    return [q.x + (j.shoulderL[0] + j.shoulderR[0]) / 2 + 58, q.y + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 112 + sink];
  };
  /** ⑪ 那块「活下去」的中心（世界坐标）：从兜里掏出来 → 送到她身前 → 放进她手里（砖一沉跟着往下）；掏出来以前 null */
  const brick11 = (t: number): V2 | null => {
    if (t < GIVE_T.pocket1 - 0.06) return null;
    const p = pocketAt(Math.min(t, GIVE_T.pocket1));
    const up: V2 = [p[0] - 10, p[1] - 70];
    const out = mixP(p, up, E.out(ph(t, GIVE_T.pocket1 - 0.06, GIVE_T.pocket1 + 0.1)));
    // 举到她眼前给她看（在她胸前、两个人中间停一下），再慢慢放进她腿上的手里
    const show: V2 = [lapAt(t)[0] + 6, lapAt(t)[1] - 82];
    const held = mixP(out, show, E.io(ph(t, GIVE_T.pocket1 + 0.02, GIVE_T.show)));
    const lap = mixP(held, lapAt(t), E.io(ph(t, GIVE_T.show + 0.06, GIVE_T.give)));
    return mixP(lap, hugBrickAt(t), hugBrickK(t));
  };
  /** ⑪ 砖暖起来：千斤把它从腿上捧起来、抱进怀里（贴在胸口；和⑩ 沉沉在屋里抱着它是同一个样子） */
  const hugBrickK = (t: number) => E.io(ph(t, GIVE_T.warm - 0.02, GIVE_T.warm + 0.42));
  const hugBrickAt = (t: number): V2 => {
    const l = lapAt(t);
    return [l[0] - 6, l[1] - 62];
  };
  const qjBrickAt = (t: number): V2 | null => brick11(t);
  const brickWarm = (t: number) => E.io(ph(t, GIVE_T.warm - 0.04, GIVE_T.warm + 0.4));

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
   * 画这一场的人（世界坐标）。抱住以前：千斤照第六镜画（drawQj：铁链、锁、眼泪、脚踝上的半截红线都接着），沉沉和床单；
   * 抱住以后（⑦⑧）：千斤画在沉沉的身子和近处那只手臂之间（缩在她怀里）；⑪ 千斤一个人攥着栏杆（沉沉在 lib/give.ts 画）
   */
  const drawPeople = (g: CanvasRenderingContext2D, t: number, z: number, drawQj: (g: CanvasRenderingContext2D) => void) => {
    const line = 1 / Math.sqrt(Math.max(0.3, z));
    if (t < T.catch) {
      drawQj(g);
      drawChen(g, t, z);
      return;
    }
    const q = qjPosed(t);
    const qSpec = { ...QJ, hairclip: undefined };
    const jq = castJoints(QJ, q.pose);
    // 脚踝上还拴着那半截红线
    const an: V2 = [q.x + jq.ankleL[0], q.y + jq.ankleL[1]];
    if (t >= KITE0) {
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
      return;
    }
    const c = chenPosed(t);
    drawSheet(g, t);
    drawDust(g, t);
    g.save();
    g.translate(c.x, c.y);
    const worldM = g.getTransform();
    drawChengtuo(g, c.pose, {
      line,
      beforeFrontArms: (cc) => {
        cc.save();
        cc.setTransform(worldM);
        cc.translate(-c.x, -c.y);
        drawRedEnd(cc, an, t);
        // ⑪ 那块砖：画在千斤的身子和她近处那只手臂之间（她托着的手压在砖上；沉沉近处那只手在最外面）
        const qb = brick11(t);
        const qm = cc.getTransform();
        drawPerson(cc, qSpec, q.pose, q.x, q.y, z, qb
          ? {
              beforeFrontArms: (c3) => {
                c3.save();
                c3.setTransform(qm);
                drawWordBrick(c3, qb[0], qb[1], "活下去", -0.03, brickWarm(t), 3 * line);
                c3.restore();
              },
            }
          : {});
        drawHugTears(cc, t, q);
        cc.restore();
      },
    });
    g.restore();
  };
  /** ⑧ 缩在她怀里哭：眼泪从眼角冒出来往上飘（这里什么都往上飘） */
  const drawHugTears = (g: CanvasRenderingContext2D, t: number, q: { pose: PoseIn; x: number; y: number }) => {
    const k = fade(t, S.turn, S.hug1);
    if (k <= 0) return;
    const j = castJoints(QJ, q.pose);
    const hx = q.x + j.head[0];
    const hy = q.y + j.head[1];
    g.save();
    g.fillStyle = "rgba(170,214,240,0.9)";
    for (let i = 0; i < 4; i++) {
      const u = (t * 0.6 + i / 4) % 1;
      g.globalAlpha = k * Math.min(1, u * 8) * (1 - u) ** 0.8;
      const r = 5 + 2.5 * Math.min(1, u * 4);
      g.beginPath();
      g.ellipse(hx - 18 + (i % 2 ? 14 : -6) + 10 * Math.sin(t * 2 + i) * u, hy + 8 - u * 230, r * 0.75, r, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  };
  /** ⑧ 两个人抱着坐下来以后：她们身上一团暖光（天黑下来、满城都是冷的夜色，只有她们这里是暖的） */
  const drawHugGlow = (g: CanvasRenderingContext2D, t: number) => {
    if (t < T.catch || t >= KITE0) return;
    // 抱住那一下就暖起来（照草稿：抱住一闪，飘着的时候一直是一团暖光裹着两个人），坐到楼顶上天黑下来也一直暖着
    const w = Math.max(E.io(ph(t, T.catch, T.catch + 0.5)), E.io(ph(t, T.land, S.say[2] + 0.4)));
    if (w <= 0.01) return;
    const a = chenChest(t);
    const b2 = qjChest(t);
    const m: V2 = [(a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2];
    drawGlow(g, m[0], m[1] - 30, 300 + 60 * w, 0.2 * w);
    drawGlow(g, m[0], m[1] - 60, 560, 0.1 * w);
    const fl = kick(t, T.catch, 0.12);
    if (fl > 0.01) drawGlow(g, m[0], m[1] - 30, 700, 0.35 * fl);
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

  /** ⑧ 镜头要用的点：两个人的脸 */
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

  /** ⑧ 抱在一起以后：夜色在她们身上蒙得浅一点（只有她们这里是暖的） */
  const hugLight = (t: number) => (t < KITE0 ? E.io(ph(t, T.land - 0.3, T.land + 0.5)) : 0);
  return { chenAt, qjAt, qjPosed, qjBrickAt, qjHeadAt, lapAt, brickWarm, chenChest, rootAt, drawPeople, drawChen, drawHugGlow, hugLight, facesAt, qjChestOf: (t: number) => qjChest(t) };

  function qjChest(t: number): V2 {
    const q = qjAt(t);
    const o = qjChestOff(q.pose);
    return [q.x + o[0], q.y + o[1]];
  }
}

const mixP = (a: V2, b: V2, k: number): V2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** 她脚踝上拴着的那半截红线（第五镜绷断的，跟着她飘） */
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

/** 千斤家楼顶沿着女儿墙的一圈铁栏杆（⑪ 她一个人攥着它漂成风筝） */
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
 * ⑦ 的镜头：接着第六镜往上退开的那个镜头（不切）。她一惊一顿；中心挪到两个人中间，按两人的距离推近（越近越近），抱住一震；
 * 抱住以后跟着两个人往左飘、往下落、慢慢退开一点（看得见下面千斤家的楼顶），坐到楼顶上那一下轻轻一沉。
 * ⑧ 坐下来抱着：柔和起步、一路减速地推近两张脸（越推越慢），「我」以后几乎不动、极慢地再凑近一点（屏住气，天黑下来）。
 */
export function roofCam(t: number, r: ReturnType<typeof makeRoof>, sky: ReturnType<typeof makeSky>): Cam {
  const T = ROOF_T;
  let c = skyCam(t, sky);
  // 2026-10-24 用户：「抱住之前不要放大镜头，抱住之后暖光+放大，之后缓慢缩小，落地之后放大」
  // 抱住以前：倍数不变（接⑥ 退开的 0.78），只跟着两个人平移，把冲过来、扑出去的沉沉和千斤一起框住
  const z0 = c.z;
  const w2 = E.io(ph(t, T.cut + 0.05, T.jump));
  if (w2 > 0) {
    const ch = r.chenChest(Math.min(t, T.catch));
    const q = r.qjChestOf(Math.min(t, T.catch));
    c = camLerp(c, aim((ch[0] + q[0]) / 2, (ch[1] + q[1]) / 2, 540, 1060, z0), w2);
  }
  // 抱住：暖光一闪，镜头推近抱在一起的两个人（0.78 → 1.2，E.out，0.5 秒越推越慢）；
  // 之后缓慢地退开（→ 0.95，E.io 到落地），两个人飘过巷子、千斤家楼顶从左下上来；落地以后再推近（下面的 w8）
  const w3 = E.io(ph(t, T.catch - 0.02, T.catch + 0.2));
  if (w3 > 0) {
    const a = r.chenChest(t);
    const b2 = r.qjChestOf(t);
    const mid: V2 = [(a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2];
    const zin = z0 * Math.pow(1.2 / z0, E.out(ph(t, T.catch, T.catch + 0.5)));
    // 2026-10-24 用户：「这里的镜头缩小去掉看看」——推近以后不再缓慢退开（原来 1.2 → 0.95），一直 1.2 跟着到落地
    const z = zin;
    const sy = 980 + 60 * E.io(ph(t, T.catch + 0.5, T.land));
    c = camLerp(c, aim(mid[0], mid[1], 540, sy, z), w3);
  }
  // ⑧ 坐到楼顶上以后：推近两张脸（越推越慢，落点按「我」以后两张脸的位置算）
  const S = HUG_T;
  const w8 = E.settle(ph(t, T.land + 0.03, S.say[2] + 0.36));
  if (w8 > 0) {
    const [f1, f2] = r.facesAt(S.say[2] + 0.36);
    c = camLerp(c, aim((f1[0] + f2[0]) / 2, (f1[1] + f2[1]) / 2 + 30, 540, 900, 2.45), w8);
    c = { ...c, z: c.z * (1 + 0.025 * E.soft(ph(t, S.say[2] + 0.36, S.end))) };
  }
  // 一惊一顿、抱住一震、落地轻轻一沉
  // 抱住那一下不砸：轻轻一凑（被软软地接住）
  c = { ...c, z: c.z * (1 + 0.04 * kick(t, T.shock, 0.1) + 0.03 * kick(t, T.catch, 0.16) + 0.02 * kick(t, T.land, 0.1)) };
  c = { ...c, y: c.y - (16 * kick(t, T.land, 0.12)) / c.z };
  return c;
}

export function roofShake(t: number) {
  return 6 * kick(t, ROOF_T.shock, 0.07) + 3 * kick(t, ROOF_T.catch, 0.08) + 5 * kick(t, ROOF_T.land, 0.08);
}
