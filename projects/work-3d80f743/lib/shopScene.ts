// 哑铃店门口这一场（16–18.4 秒）：店里排着队、低着头的人，柜台后低头数钱的老板，拎着哑铃走出去的人；
// 门口展台上摆着最大的那只——千斤的妈妈（紫外套）弯腰把它抱起来，排在门口的男人抓住了另一头（「争」17.16 一拽），
// 她咬着牙夺回怀里（「夺」17.34），护着它往后退。
// 第一幕最后一下扎下来时也要画这里（16.0–16.51），所以单独放一个模块，两幕一起用。

import { CAST, type CastSpec, castJoints, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import type { Angles, HoldFn, MoveKey, PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { ARMS, type Num, fade, live } from "./motion";
import { type Walker, drawPerson, walkerAt } from "./people";
import { armL, armR, legL, legR, pose } from "./poses";
import { MOM } from "./poses2";
import { SHOP, STAND_DUMBBELL, drawDumbbell, drawShopBack, drawShopCounter, drawShopFacade } from "./act2set";
import { groundShadow } from "./props";
import { aim } from "./cam";

type V2 = [number, number];

/** 最大那只哑铃的大小（drawDumbbell 的 s） */
export const BIG = 0.82;
/** 这一场的风（往画面左吹） */
export const WIND_A2 = -0.7;

/** 落在店门口的取景（第一幕最后扎下来就停在这里，第二幕从这里接着）：招牌在上面三分之一，人在中间，脚下露一截人行道 */
export const SHOP_CAM = aim(1190, -440, 540, 1000, 1.15);

export const SHOP_T = {
  /** 第一幕扎下来、落在店门口 */
  land: 16.513,
  /** 她把它从展台上抱起来 */
  lift: 16.62,
  /** 「争」：门口的男人抓住了另一头，往他那边一拽 */
  zheng: 17.163,
  /** 「夺」：她夺回来 */
  duo: 17.343,
  /** 护着它往后退两步 */
  back: 17.62,
};

const MOM_SPEC = CAST.千斤的妈妈;
const MAN: CastSpec = passerby(6);
const SHOPKEEPER: CastSpec = passerby(14);
const Q1: CastSpec = passerby(3);
const Q2: CastSpec = passerby(9);

/** 小哑铃拎在手里（顺着手指往下垂，把手横在手心里） */
const smallDumbbell =
  (s: number): HoldFn =>
  (ctx, hand, _mir, info) => {
    if (info.layer !== "back") return;
    const f = hand.child(0, 26, 0);
    drawDumbbell(ctx, f.x, f.y, f.a, s, 2.6);
  };

/** 世界里的点 → 一个人自己的骨架坐标（IK 的目标点）：按身高、胖瘦缩放，朝右时 x 取反 */
const toLocal = (spec: CastSpec, pose: PoseIn, rootX: number, p: V2): V2 => {
  const k = spec.scale;
  const w = spec.width ?? 1;
  const mir = (pose.face ?? 0) > 0;
  return [((p[0] - rootX) / (k * w)) * (mir ? -1 : 1), p[1] / k];
};

/** 低着头站着（排队、挑哑铃）：身子微微前倾，一只手拎着哑铃 */
const STAND_DOWN = (face: number): Angles =>
  pose(8, { face, ...legR(6, -8), ...legL(-6, -4), neck: -14, expression: "低头看", smile: 0, sad: 0.3, lookY: 1 }, (l) => ({
    ...armL(-2, 14, 6, "grip", l),
    ...armR(6, 18, 0, "relax", l),
  }));

export function createShopScene() {
  const T = SHOP_T;
  // ——— 妈妈：朝左站在展台右边 ———
  const momKeys: MoveKey[] = [
    { t: 15.4, p: MOM.搬 },
    { t: T.lift, p: MOM.搬 },
    // 抱起来：很沉，先使劲、再直起腰
    { t: T.lift + 0.34, ease: "inOut", p: MOM.抱起 },
    { t: T.zheng - 0.03, ease: "inOut", p: { ...MOM.抱起, neck: -6, lookX: -0.6 } },
    // 被那边一拽：身子往前一扑
    { t: T.zheng + 0.1, ease: "out", p: MOM.被拽 },
    // 夺回来：整个人往后坐
    { t: T.duo + 0.1, ease: "out", p: MOM.夺回 },
    { t: T.back - 0.02, ease: "inOut", p: MOM.护着 },
    // 护着它往后退两步（脚往右边退）
    { t: T.back + 0.34, ease: "inOut", dx: 105, p: { ...MOM.护着, ...legR(-6, -10, -6), ...legL(-22, -8, -4) } },
    { t: T.back + 0.7, ease: "inOut", dx: 100, p: { ...MOM.护着, ...legR(8, -14), ...legL(-14, -10, -6) } },
    { t: T.back + 1.06, ease: "inOut", dx: 100, p: { ...MOM.护着, ...legR(-6, -10, -6), ...legL(-22, -8, -4) } },
  ];
  const momMove = live(momKeys, { look: lookOf(MOM_SPEC), base: { wind: WIND_A2 }, idle: true, seed: 21, springs: ARMS });
  // 两只手攥着把手：抱起来之前手在把手右半截（哑铃中心在手左边），抱到怀里时哑铃横在肚子前面
  const palmsOf = (spec: CastSpec, p: PoseIn): V2 => {
    const j = castJoints(spec, p);
    return [(j.palmL[0] + j.palmR[0]) / 2, (j.palmL[1] + j.palmR[1]) / 2];
  };
  const k0 = (t: number) => fade(t, T.lift, T.lift + 0.34);
  const heldAt = (t: number, x0: number) => {
    const f = momMove(t);
    const h = palmsOf(MOM_SPEC, f.pose);
    const k = k0(t);
    return [x0 + f.x + h[0] - 58 * (1 - k), h[1] + 10 * k] as V2;
  };
  // 她站的位置：抱起来那一刻，手里的哑铃正好在展台上它原来的位置
  const MOM_X = STAND_DUMBBELL[0] - (heldAt(T.lift, 0)[0] - 0);
  const liftDy = STAND_DUMBBELL[1] - heldAt(T.lift, MOM_X)[1];
  const momAt = (t: number) => {
    const f = momMove(t);
    return { pose: f.pose, x: MOM_X + f.x };
  };
  /** 最大那只哑铃：中心、转角 */
  const bigAt = (t: number): { p: V2; r: number } => {
    if (t <= T.lift) return { p: STAND_DUMBBELL, r: 0 };
    const h = heldAt(t, MOM_X);
    // 手和展台上的位置差的那一点在抱起来的前 0.12 秒里收掉
    const dy = liftDy * (1 - fade(t, T.lift, T.lift + 0.12));
    // 两个人一拽一夺，哑铃跟着歪一下
    const tilt = 0.08 * Math.sin(Math.PI * fade(t, T.zheng - 0.02, T.duo + 0.2)) * (t < T.duo ? 1 : -1);
    return { p: [h[0], h[1] + dy], r: tilt };
  };

  // ——— 排在门口的男人（朝右）：等着那只最大的，被她抢先抱走，伸手抓住另一头，一拽，脱了手 ———
  const MAN_X = SHOP.open.x0 + 104;
  const manMove = live(
    [
      { t: 15.4, p: STAND_DOWN(0.7) },
      { t: T.lift + 0.1, p: STAND_DOWN(0.7) },
      // 看见她抱起来了：抬头、伸手
      { t: T.zheng - 0.12, ease: "out", p: pose(22, { face: 0.7, ...legR(26, -10, 10), ...legL(-14, -14, -10), neck: 4, expression: "坚定", lookX: 0.6 }, (l) => ({ ...armL(74, 10, 0, "open", l), ...armR(82, 6, 0, "open", l) })) },
      // 攥住一拽
      { t: T.zheng + 0.08, ease: "out", p: pose(-16, { face: 0.7, ...legR(30, -4, 20), ...legL(-10, -30, -24), neck: 0, expression: "使劲", teeth: 0.5, lookX: 0.6 }, (l) => ({ ...armL(74, 12, 0, "grip", l), ...armR(80, 8, 0, "grip", l) })) },
      // 被夺走：往前一扑、手里空了
      { t: T.duo + 0.12, ease: "out", p: pose(30, { face: 0.7, ...legR(30, -20, 10), ...legL(-20, -20, -20), neck: -6, expression: "吓一跳", lookX: 0.6 }, (l) => ({ ...armL(90, 6, 0, "open", l), ...armR(96, 4, 0, "open", l) })) },
      { t: T.duo + 0.6, ease: "inOut", p: STAND_DOWN(0.7) },
    ],
    { look: lookOf(MAN), base: { wind: WIND_A2 * 0.3 }, idle: true, seed: 23, springs: ARMS },
  );
  // 他的两只手攥着哑铃左边那头：手的 IK 目标点（攥住到脱手之间）
  const manAt = (t: number) => {
    const f = manMove(t);
    const pose = { ...f.pose, armL: { ...f.pose.armL }, armR: { ...f.pose.armR } };
    const w = fade(t, T.zheng - 0.06, T.zheng + 0.02) * (1 - fade(t, T.duo, T.duo + 0.06));
    if (w > 0) {
      const b = bigAt(t);
      const end: V2 = [b.p[0] - 150 * BIG, b.p[1]];
      pose.armL.to = toLocal(MAN, pose, MAN_X, [end[0] - 6, end[1] - 26]);
      pose.armR.to = toLocal(MAN, pose, MAN_X, [end[0] + 10, end[1] + 18]);
      pose.armL.ik = w;
      pose.armR.ik = w;
    }
    return { pose, x: MAN_X };
  };

  // ——— 店里：排队的两个人（朝右，低着头，手里拎着挑好的哑铃）、柜台后低头数钱的老板（朝左） ———
  const idle = (spec: CastSpec, a: Angles, seed: number) =>
    live([{ t: 15, p: a }, { t: 19, p: a }], {
      look: lookOf(spec),
      base: { wind: 0 },
      idle: true,
      seed,
      springs: ARMS,
      add: (t, o: Num) => {
        o.lean += 1.2 * Math.sin(t * 0.8 + seed);
        o.neck += 1.5 * Math.sin(t * 0.6 + seed * 2);
      },
    });
  const q1 = idle(Q1, STAND_DOWN(0.75), 31);
  const q2 = idle(Q2, STAND_DOWN(0.75), 33);
  const keeper = idle(
    SHOPKEEPER,
    pose(14, { face: -0.75, ...legR(6, -8), ...legL(-6, -4), neck: -28, expression: "低头看", smile: 0, lookY: 1 }, (l) => ({ ...armL(40, 70, 10, "grip", l), ...armR(46, 64, 0, "relax", l) })),
    35,
  );
  // 拎着哑铃走出去的人（门口往左走，低着头）
  const walker: Walker = { spec: passerby(11), x0: SHOP.open.x0 + 40, dir: -1, step: 0.56, t0: 15.9, seed: 4, wind: WIND_A2 };

  /** 画这一场（世界坐标、人这一层的变换已经设好）。z 是镜头倍数（描边按它调细） */
  const draw = (g: CanvasRenderingContext2D, t: number, z: number) => {
    // 店里面
    drawShopBack(g, t);
    g.save();
    g.beginPath();
    g.rect(SHOP.open.x0, SHOP.open.top, SHOP.open.x1 - SHOP.open.x0, -SHOP.open.top);
    g.clip();
    drawPerson(g, SHOPKEEPER, keeper(t).pose, SHOP.open.x1 - 70, 0, z);
    drawShopCounter(g);
    drawPerson(g, Q2, q2(t).pose, SHOP.open.x0 + 222, 0, z, { hold: { L: smallDumbbell(0.32) } });
    drawPerson(g, Q1, q1(t).pose, SHOP.open.x0 + 336, 0, z, { hold: { L: smallDumbbell(0.28) } });
    const m = manAt(t);
    drawPerson(g, MAN, m.pose, m.x, 0, z);
    g.restore();
    // 门面、展台
    drawShopFacade(g, t);
    // 拎着哑铃走出去的人
    const wk = walkerAt(walker, t);
    groundShadow(g, wk.x + 12, 90, 0.22);
    drawPerson(g, walker.spec, wk.pose, wk.x, 0, z, { hold: { L: smallDumbbell(0.3) } });
    // 最大那只：在展台上，或者被她抱在怀里（画在她身子前面、前面那只手臂后面）
    const b = bigAt(t);
    const mo = momAt(t);
    groundShadow(g, mo.x + 14, 120, 0.26);
    if (t <= T.lift) drawDumbbell(g, b.p[0], b.p[1], b.r, BIG);
    const big = () => {
      g.save();
      g.setTransform(world);
      drawDumbbell(g, b.p[0], b.p[1], b.r, BIG);
      g.restore();
    };
    const world = g.getTransform();
    drawPerson(g, MOM_SPEC, mo.pose, mo.x, 0, z, t > T.lift ? { beforeFrontArms: big } : {});
  };

  return { draw, momAt, bigAt, MOM_X };
}
