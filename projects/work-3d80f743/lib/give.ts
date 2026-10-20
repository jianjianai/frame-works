// 第二幕⑪「妄想用它拯救你」（35.88–37.8，时间见 lib/roof.ts 的 GIVE_T）：沉沉这一边、这一镜的镜头、砖的暖光。
// 她抱着「活下去」从最高那栋楼的楼顶跳下来（⑩ 往左冲出门，这里接着往左；镜头切过来时她在半空），36.016「咚」落在千斤家楼顶，
// 跑两步到千斤跟前，身子往前倾把砖递进千斤攥着栏杆的那只手里（千斤不伸手：是她放进去的），手在砖底下护一下，蹲在她旁边，含着泪笑。
// 镜头（「交出一样重要的东西」）：切过来是夜里的楼顶，她从右上方落进来；落地一沉一震；跟着砖推近、越推越慢；砖一沉跟着往下坠，
// 坐下那一下一顿；推近她抱着砖哭着笑，最后往后舒一口气。

import { type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, jointsOf, swapSides } from "@materials/剪纸角色/code/chengtuo";
import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { TOWER, drawGlow } from "./world";
import { ARMS, SMOOTH, live } from "./motion";
import { CHEN, armL, armR } from "./poses";
import { CHEN2 } from "./poses2";
import { TOWER_ROOF } from "./props";
import { GIVE_T, QJ_ROOF, type makeRoof } from "./roof";
import { WORD_BRICK, drawWordBrick } from "./brick";

type V2 = [number, number];
const mixP = (a: V2, b: V2, k: number): V2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** 起跳的地方（最高那栋楼的楼顶左边）、落地的地方、跑到千斤跟前站住的地方 */
const P_LEAP: V2 = [TOWER.x + 10, TOWER_ROOF];
const X_LAND = -4200;
/** 跑到这里站住，身子往前倾把砖递过去（再近两个人的头就叠在一起）；交出去以后往前挪一点蹲在她旁边 */
const X_STOP = -4296;
const X_CROUCH = -4392;

export function makeGive(roof: ReturnType<typeof makeRoof>) {
  const T = GIVE_T;
  const hold = (lean: number) => ({ ...armL(28, 104, 0, "grip", lean), ...armR(38, 98, 0, "grip", lean) });
  const R = (p: typeof CHEN.跑_落地, swap: boolean) => {
    const q = swap ? swapSides(p) : p;
    return { ...q, ...hold(q.lean as number), face: -1, expression: "坚定" as const, lookX: -0.6, lookY: -0.2 };
  };
  const chenMove = live(
    [
      { t: T.leap, x: 0, items: { bricks: 0 }, p: CHEN2.跳下抱砖 },
      { t: T.land - 0.06, p: CHEN2.跳下抱砖 },
      { t: T.land + 0.05, ease: "out", squash: 0.07, p: CHEN2.落地抱砖 },
      // 起来、跑两步（抱着砖不摆手）
      { t: T.run0, ease: "inOut", squash: 0, p: R(CHEN.跑_蹬地, false) },
      { t: T.run0 + 0.08, ease: SMOOTH, p: R(CHEN.跑_腾空, false) },
      { t: T.run0 + 0.13, ease: SMOOTH, p: R(CHEN.跑_落地, true) },
      { t: T.run0 + 0.2, ease: SMOOTH, p: R(CHEN.跑_蹬地, true) },
      { t: T.stop, ease: "out", p: CHEN2.递砖 },
      // 递进她手里，手在砖底下护一下，跟着她往下；蹲下来看着她
      { t: T.give + 0.06, p: CHEN2.递砖 },
      { t: T.drop + 0.12, ease: "inOut", p: CHEN2.护着 },
      { t: T.sit + 0.25, ease: "inOut", p: CHEN2.蹲着看她 },
      { t: 40, p: CHEN2.蹲着看她 },
    ] as MoveKey[],
    { look: CHENGTUO, base: { wind: 1.1, chestL: "under", chestR: "under" }, idle: false, seed: 21, springs: ARMS, follow: 0 },
  );
  /** 靴底离根多高（站着的姿势按它把靴底放到楼顶上） */
  const soleOf = (pose: PoseIn) => {
    const j = jointsOf(pose);
    return Math.max(j.ankleL[1], j.ankleR[1]) + 46;
  };
  /** 根：从楼顶跳下来（越落越快）→ 落地 → 跑两步 → 站住 */
  const rootAt = (t: number, pose: PoseIn): V2 => {
    const yStand = QJ_ROOF - soleOf(pose);
    if (t < T.land) {
      const u = ph(t, T.leap, T.land);
      return [P_LEAP[0] + (X_LAND - P_LEAP[0]) * u, P_LEAP[1] + (yStand - P_LEAP[1]) * u ** 1.8 - 60 * Math.sin(Math.PI * u) * (1 - u)];
    }
    if (t < T.run0) return [X_LAND, yStand];
    const u = E.io(ph(t, T.run0, T.stop));
    const y = t < T.stop ? QJ_ROOF : yStand;
    const step = E.io(ph(t, T.drop + 0.08, T.sit + 0.25));
    return [X_LAND + (X_STOP - X_LAND) * u + (X_CROUCH - X_STOP) * step, y];
  };
  const chenAt = (t: number) => {
    const pose: PoseIn = { ...chenMove(t).pose };
    const r = rootAt(t, pose);
    return { pose, x: r[0], y: r[1] };
  };
  /** 砖在她手里时的中心：抱在胸前 → 递进千斤手里（交出去以后 null） */
  const brickAt = (t: number, c: { pose: PoseIn; x: number; y: number }): V2 | null => {
    if (t >= T.give) return null;
    const j = jointsOf(c.pose);
    const chest: V2 = [c.x + (j.shoulderL[0] + j.shoulderR[0]) / 2 - 30, c.y + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 76];
    const into = roof.qjBrickAt(T.give) ?? chest;
    return mixP(chest, into, E.io(ph(t, T.stop - 0.06, T.give)));
  };
  /** 她这一刻（两只手按 IK 扶着砖；交出去以后手在砖底下护一下，再交给姿势） */
  const chenPosed = (t: number) => {
    const c = chenAt(t);
    const pose = c.pose;
    const b = brickAt(t, c) ?? roof.qjBrickAt(t);
    const w = t < T.give ? 1 : 1 - E.io(ph(t, T.give + 0.04, T.drop + 0.1));
    if (b && w > 0.001) {
      const hw = WORD_BRICK.w / 2 - 4;
      pose.armL = { ...(pose.armL as object), to: [b[0] + hw - c.x, b[1] + 6 - c.y], ik: w };
      pose.armR = { ...(pose.armR as object), to: [b[0] - hw - c.x, b[1] + 6 - c.y], ik: w };
    }
    // 坐下以后：蹲在旁边，近处那只手摸摸她的头（和前奏里摸小石头的头一样）
    const pat = E.io(ph(t, T.sit + 0.06, T.smile + 0.1));
    if (pat > 0) {
      const head = roof.qjHeadAt(t);
      const rub = 5 * Math.sin((t - T.smile) * 11) * E.io(ph(t, T.smile, T.smile + 0.2));
      pose.armL = { ...(pose.armL as object), to: [head[0] + 12 + rub - c.x, head[1] - 52 - c.y], ik: pat, bend: 1 };
    }
    return { ...c, brick: brickAt(t, c) };
  };

  /** 画她（世界坐标）：手里的砖画在身子和近处那只手臂之间 */
  const draw = (g: CanvasRenderingContext2D, t: number, z: number) => {
    if (t < T.start - 0.05) return;
    const c = chenPosed(t);
    const line = 1 / Math.sqrt(Math.max(0.3, z));
    const wm = g.getTransform();
    g.save();
    g.translate(c.x, c.y);
    drawChengtuo(g, c.pose, {
      line,
      beforeFrontArms: c.brick
        ? (cc) => {
            cc.save();
            cc.setTransform(wm);
            drawWordBrick(cc, c.brick![0], c.brick![1], "活下去", 0.02, 0, 3 * line);
            cc.restore();
          }
        : undefined,
    });
    g.restore();
    // 落地扬起的一小团灰
    const d = t - T.land;
    if (d > 0 && d < 0.55) {
      const k = d / 0.5;
      g.save();
      for (const [dx, sz] of [
        [-80, 1],
        [70, 1.1],
        [-150, 0.7],
        [150, 0.75],
      ]) {
        g.fillStyle = `rgba(170,150,170,${0.32 * (1 - Math.min(1, k)) ** 1.4})`;
        g.beginPath();
        g.ellipse(X_LAND + dx * (0.6 + 0.8 * k), QJ_ROOF - 26 - 36 * k, (46 + 64 * k) * sz, (22 + 26 * k) * sz, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    }
  };
  /** 砖暖起来时漫开的一团光（画在蒙色的人和夜色上面）；照在千斤脸上 */
  const drawGlowOver = (g: CanvasRenderingContext2D, t: number) => {
    const w = roof.brickWarm(t);
    const b = roof.qjBrickAt(t);
    if (!b || w <= 0.01) return;
    drawGlow(g, b[0], b[1], 150 + 140 * w, 0.85 * w);
    drawGlow(g, b[0], b[1] - 60, 260 + 120 * w, 0.32 * w);
  };

  /** ⑪ 的镜头 */
  const cam = (t: number): Cam => {
    // 切过来：夜里的楼顶，千斤在左边漂着，她从右上方落进来
    let c = aim(-4300, -8200, 540, 960, 0.9);
    // 落地以后：跟着砖推近、越推越慢（中心是砖：从她胸口挪到千斤手里）
    const ch = chenPosed(Math.min(t, T.give));
    const bb = ch.brick ?? roof.qjBrickAt(T.give)!;
    const w1 = E.settle(ph(t, T.land + 0.02, T.give + 0.1));
    c = camLerp(c, aim(bb[0], bb[1] - 30, 540, 1000, 1.7), w1);
    // 砖一沉：跟着砖往下坠，坐下那一下一顿；推近她抱着砖（暖光）
    if (t > T.drop) {
      const qb = roof.qjBrickAt(t)!;
      c = camLerp(c, aim(qb[0] + 30, qb[1] - 60, 540, 1000, 1.85), E.io(ph(t, T.drop, T.sit)));
      c = camLerp(c, aim(qb[0] + 40, qb[1] - 90, 540, 1000, 2.05), E.settle(ph(t, T.sit, T.smile + 0.1)));
      // 她哭着笑了：往后舒一口气，把蹲在旁边的沉沉也框进来
      c = camLerp(c, aim(qb[0] + 90, qb[1] - 110, 540, 1000, 1.65), E.io(ph(t, T.smile + 0.05, T.end)));
    }
    // 落地一沉、坐下一顿
    const kl = kick(t, T.land, 0.12);
    const ks = kick(t, T.sit, 0.12);
    c = { ...c, z: c.z * (1 + 0.04 * kl + 0.03 * ks) };
    c = { ...c, y: c.y - (16 * kl + 12 * ks) / c.z };
    return c;
  };
  const shakeK = (t: number) => 14 * kick(t, T.land, 0.08) + 7 * kick(t, T.sit, 0.08);

  return { draw, drawGlowOver, cam, shakeK, chenAt: chenPosed };
}

