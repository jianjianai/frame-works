// 第二幕「千斤」（16.5–40 秒：主歌一 + 导歌一）。分镜见 分镜表.md，地点见 地图.md。
// 这一幕一路往上走：楼脚的哑铃店 → 门口两层楼高的千斤 → 巷子顶上贴着白的边 → 全城最高的那间屋子，最沉的人自己飘得最高。
// 每段先定情绪，再定镜头（经验库「情绪运镜」），快慢跟着剧情走：
//   ① 16.5 压抑：店门口低着头排队买哑铃的人；千斤的妈妈抱起最大的那只，和人一争一夺。镜头线性慢推到她怀里的哑铃。
//   ② 18.0 窒息：同一只哑铃溶到她家门口；退开、顺着铁桩上的红线抬上去——红线那头拴着飘在半空的千斤。
//   ③ 19.7 孤：妈妈一把一把把她拽下来（踩在底鼓上），铁链绕上脚踝，「锁」字上「咔」地扣上：镜头一顿。
//   ④ 21.8 心酸 → 绝望：妈妈进门，门缝的光灭了；窗里的妈妈捂着脸；千斤抱着哑铃抬头看天，又飘了起来。镜头几乎不动、慢推、压暗。
//   ⑤ 24.0 决绝：高空，她拔下发卡打开锁，扔掉哑铃，张开手往上飘（片头那个女人的样子）。镜头直直落到锁上，一顿，再退开。
//   ⑥ 26.0 惊 → 急：楼顶上守着城的沉沉看见她，退两步、冲向楼边、扑出去。镜头跟着她跑，和她一样快。
//   ⑦ 28.0 拼命 → 抱住：半空一把抱住，就贴着白的边；千斤挣、伸手够白，被攥住手腕拉下来；第二句「请你等等我」她搂住沉沉，
//      两个人一沉，像一片叶子落下去。镜头越近推得越近，撞上 2 倍、一震、暖光；挣的时候线性慢逼；搂住以后往后舒一口气、跟着落下去。
//   ⑧ 31.0 温柔：落在楼顶，她跪着搂着她；慢慢推近。
//   ⑨ 32.0 暖（秘密）：夜里，台灯下她写砖；一排排写好的砖；塞进靴筒。
//   ⑩ 36.0 释然：靴筒对上切回楼顶，砖放进千斤手里，手一坠，人坐实了；往后舒一口气。
//   ⑪ 38.0 秘密：「咚」——夜里她脱下铁靴，整个人飘起来，飘进天花板上倒钉的床；镜头跟着转 180°。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { beatAt } from "@frame/engine/tempo";
import { seeded } from "@frame/engine/math";
import { CAST, type CastSpec, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { Frame } from "@materials/剪纸角色/code/rig";
import { type Angles, type HoldFn, type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, drawFigure, figureJoints, jointsOf, swapSides } from "@materials/剪纸角色/code/chengtuo";
import { type Cam, E, H, W, aim, applyCam, camLerp, clamp01, kick, ph, shake, toScreen, viewOf } from "../lib/cam";
import { TOWER, Y_WHITE, drawBlock, drawBlockGlow, drawCity, drawGlow, drawGrade, drawMotes, drawSilhouette, drawSky, drawStreet, drawSunbeams, drawWhite, makeGrain, prepareCity } from "../lib/world";
import { TOWER_ROOF, brickCenter, brickHold, drawRoof, groundShadow } from "../lib/props";
import { loadHandFont } from "../lib/note";
import { drawPerson } from "../lib/people";
import { ARMS, LIMP, type Num, SMOOTH, fade, hitch, live, ring, smoothTrack, withDrag } from "../lib/motion";
import { CHEN, armL, armR, legL, legR } from "../lib/poses";
import { CHEN2, CHEN_N, MOM, QJ } from "../lib/poses2";
import {
  HOME,
  NEIGHBOR,
  NEIGHBOR_ROOF,
  drawChain,
  drawDumbbell,
  drawHomeFacade,
  drawHomeInterior,
  drawHomeTable,
  drawPadlock,
  drawStake,
  drawThread,
  hairclipHold,
  stakeRing,
} from "../lib/act2set";
import { BIG, SHOP_CAM, SHOP_T, WIND_A2, createShopScene } from "../lib/shopScene";
import {
  NIGHT_LOOK,
  RING_AT,
  ROOM,
  ROW_WORDS,
  brickWords,
  drawStandingBrick,
  drawBlanket,
  drawBrickRows,
  drawCeilingBed,
  drawDesk,
  drawFloorRing,
  drawLampLight,
  drawLooseBoot,
  drawRoomBack,
} from "../lib/room";

type V2 = [number, number];
const QJ_SPEC = CAST.千斤;
/** 拔下发卡以后的千斤（头上没有发卡了） */
const QJ_NOCLIP: CastSpec = { ...CAST.千斤, hairclip: undefined };
const MOM_SPEC = CAST.千斤的妈妈;
/** 高处的风（往画面左吹，比街上大一点） */
const WIND_SKY = -0.95;

function timeline() {
  const b = beatAt;
  return {
    start: SHOP_T.land,
    /** 匹配溶解到千斤家门口 */
    dis: b(36),
    disEnd: b(36) + 0.3,
    /** 妈妈把哑铃放在地上、抬头 */
    setDown: 18.42,
    look: 18.66,
    /** 镜头顺着红线落在千斤身上 */
    up: b(38),
    /** 妈妈攥住红线（「心」19.80） */
    grab: 19.74,
    /** 三把拽（踩在底鼓上） */
    pulls: [b(40), b(41), b(42)],
    /** 千斤坐到地上 */
    down: 21.12,
    /** 「锁」21.54：挂锁扣上 */
    lock: b(43),
    stand: 21.74,
    /** 门关上（「灯」22.59 之前） */
    door: b(45),
    /** 千斤脚跟离地，抱着哑铃又飘起来 */
    rise: b(46),
    /** 切到高空 */
    sky: b(48),
    clip: b(49),
    open: b(50),
    drop: b(50.5),
    /** 切到楼顶的她 */
    roof: b(52),
    crash: 26.7,
    /** 扑出去 */
    leap: b(55),
    /** 半空抱住 */
    hug: b(56),
    push: 28.24,
    reach: 28.56,
    /** 攥住手腕拉下来 */
    wrist: b(58),
    /** 第二句「请你等等我」：千斤搂住她，不挣了 */
    hold: 29.79,
    /** 落在千斤家那栋楼的楼顶 */
    land: b(62),
    /** 夜里 */
    night: b(64),
    bricks: b(68),
    /** 回到楼顶（楼顶的时间 = t − 3.5：中间过了半秒） */
    back: b(72),
    /** 「拯」：千斤手一坠 */
    take: 36.813,
    /** 又回到夜里：一只靴子落地「咚」、另一只 */
    night2: b(76),
    boot2: b(77),
    float: 38.72,
    bed: 39.3,
    end: b(80),
  };
}

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  await loadHandFont();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const buf = document.createElement("canvas");
  buf.width = width;
  buf.height = height;
  const bctx = buf.getContext("2d")!;
  const base = new DOMMatrix([width / W, 0, 0, height / H, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  const T = timeline();
  const shop = createShopScene();
  /** 楼顶那一场自己的时间：36.0 切回来时，楼顶过了半秒（千斤挪了挪、坐好了） */
  const rt = (t: number) => (t >= T.back ? t - 3.5 : t);

  const memoT = <R,>(fn: (t: number) => R) => {
    const m = new Map<number, R>();
    return (t: number) => {
      const k = Math.round(t * 1e4);
      let v = m.get(k);
      if (v === undefined) {
        v = fn(t);
        if (m.size > 800) m.clear();
        m.set(k, v);
      }
      return v;
    };
  };

  // ———————————————————————— 千斤家门口：妈妈 ————————————————————————
  // 溶过来时她抱着哑铃站在铁桩右边（朝左）；弯腰把它放在面前地上（铁桩前面），直起来、抬头看飘在头顶的女儿；
  // 攥住红线一把一把拽下来；跪下把铁链绕在女儿脚踝上扣上锁；站起来、没看她，转身进门。之后在窗里坐着捂脸
  const MOM_X = HOME.stake + 120;
  const momKeys: MoveKey[] = [
    { t: 17.8, p: { ...MOM.护着, wind: WIND_A2 } },
    { t: T.dis + 0.15, ease: "inOut", p: { ...MOM.护着, neck: -14, lookY: 0.8 } },
    { t: T.setDown, ease: "inOut", p: MOM.放下 },
    { t: T.look, ease: "inOut", p: { ...MOM.抬头, neck: 20, lookY: -0.6 } },
    { t: T.up, ease: "inOut", p: MOM.抬头 },
    { t: T.grab - 0.06, ease: "inOut", p: MOM.拽A },
    { t: T.pulls[0] + 0.12, ease: "out", p: MOM.拽B },
    { t: T.pulls[1] + 0.12, ease: "out", p: MOM.拽A },
    { t: T.pulls[2] + 0.12, ease: "out", p: MOM.拽B },
    // 女儿坐到地上：跪下来（前腿往前迈一步、后膝着地），手伸到她脚踝上
    { t: T.down + 0.2, ease: "inOut", p: MOM.跪着锁 },
    { t: T.lock - 0.06, ease: "inOut", p: { ...MOM.跪着锁, ...armL(46, 30, 0, "grip", 34) } },
    { t: T.lock + 0.08, ease: "out", p: MOM.跪着锁 },
    { t: T.stand, ease: "inOut", p: MOM.站起 },
    // 转身（朝右）往门口走两步
    { t: T.stand + 0.12, ease: "inOut", p: { ...MOM.站起, face: 0.7, neck: -16 } },
    { t: T.stand + 0.32, ease: "inOut", dx: 160, p: { ...MOM.站起, face: 0.7, ...legR(-14, -10, -6), ...legL(18, -6, 6), neck: -16 } },
    { t: T.stand + 0.52, ease: "inOut", dx: 160, p: { ...MOM.站起, face: 0.7, ...legR(16, -8, 4), ...legL(-14, -12, -6), neck: -16 } },
    { t: T.stand + 0.68, ease: "inOut", dx: 60, p: { ...MOM.站起, face: 0.7, neck: -18 } },
  ];
  const momMove = live(momKeys, { look: lookOf(MOM_SPEC), base: { wind: WIND_A2 }, idle: true, seed: 41, springs: ARMS });
  /** 世界里的点 → 一个人自己的骨架坐标（IK 的目标点）：按身高、胖瘦缩放，朝右时 x 取反 */
  const toLocal = (spec: CastSpec, pose: PoseIn, root: V2, p: V2): V2 => {
    const k = spec.scale;
    const w = spec.width ?? 1;
    const mir = (pose.face ?? 0) > 0;
    return [((p[0] - root[0]) / (k * w)) * (mir ? -1 : 1), (p[1] - root[1]) / k];
  };
  const momAt = memoT((t: number) => {
    const f = momMove(t);
    const x = MOM_X + f.x;
    // 跪下锁脚踝：两只手伸到女儿的脚踝上（IK）
    const w = fade(t, T.down + 0.05, T.down + 0.25) * (1 - fade(t, T.lock + 0.1, T.stand - 0.05));
    if (w <= 0) return { pose: f.pose, x };
    const pose = { ...f.pose, armL: { ...f.pose.armL }, armR: { ...f.pose.armR } };
    const a = qjAnkle(t);
    pose.armL.to = toLocal(MOM_SPEC, pose, [x, 0], [a[0] + 18, a[1] - 6]);
    pose.armR.to = toLocal(MOM_SPEC, pose, [x, 0], [a[0] + 34, a[1] + 8]);
    pose.armL.ik = w;
    pose.armR.ik = w;
    return { pose, x };
  });
  // 窗里：从门那边走进来，坐在桌前捂着脸，肩膀一抽一抽（脸埋在手里，看不见窗外的女儿）
  const MOM_SIT: Angles = { ...MOM.捂脸, face: -0.6 };
  const momIn = live([
    { t: T.door, p: { ...MOM.站起, face: -0.7, neck: -20, ...legR(14, -8, 4), ...legL(-16, -12, -6) } },
    { t: T.door + 0.18, ease: "inOut", dx: -70, p: { ...MOM.站起, face: -0.7, neck: -24, ...legR(-12, -10, -6), ...legL(14, -6, 6) } },
    { t: T.door + 0.42, ease: "inOut", dx: -50, p: MOM_SIT },
    { t: 25, p: MOM_SIT },
  ], {
    look: lookOf(MOM_SPEC),
    base: { wind: 0 },
    idle: true,
    seed: 43,
    springs: ARMS,
    add: (t, o: Num) => {
      const h = hitch(t, 0.7);
      o.lean += 3 * h;
      o.neck -= 2.5 * h;
      o.shoulderL -= 3 * h;
      o.shoulderR -= 3 * h;
    },
  });
  /** 窗里的妈妈：进门以后从窗的右边走进来、坐下 */
  const MOM_IN_X = HOME.win.x1 + 30;
  const momInAt = (t: number) => {
    const f = momIn(t);
    return { pose: f.pose, x: MOM_IN_X + f.x };
  };

  // ——— 最大那只哑铃（门口）：溶过来时在她怀里 → 放在铁桩前面的地上 → 上锁以后千斤把它拖到怀里抱着 → 跟着她飘上去 → 松手掉下去 ———
  const palms = (spec: CastSpec, p: PoseIn): V2 => {
    const j = castJoints(spec, p);
    return [(j.palmL[0] + j.palmR[0]) / 2, (j.palmL[1] + j.palmR[1]) / 2];
  };
  const DB_GROUND: V2 = [HOME.stake - 70, -88 * BIG];
  const momHeld = (t: number): V2 => {
    const m = momAt(t);
    const h = palms(MOM_SPEC, m.pose);
    return [m.x + h[0], h[1] + 10];
  };

  // ———————————————————————— 千斤 ————————————————————————
  // 门口：被红线拴着、抱着膝盖飘在铁桩左上方（风把她往左吹，飘在巷子口上面）→ 被一把一把拽下来，坐在地上 → 锁上以后把哑铃拖到怀里 →
  // 看着关上的门、抬头看天 → 抱着哑铃又飘起来。高空：拔发卡开锁 → 松手 → 张开手往上飘 → 被抱住 → 挣、够白 → 手腕被攥住 → 看着她 → 搂住她 →
  // 一起落在楼顶，靠在她怀里哭 →（36.0 回来）接砖，手一坠，坐实了，哭着笑
  const qjKeys: MoveKey[] = [
    { t: 17.8, p: { ...QJ.抱膝飘, wind: WIND_A2 } },
    { t: T.grab, ease: "inOut", p: { ...QJ.抱膝飘, neck: 24, lookY: -0.5 } },
    { t: T.pulls[0] + 0.14, ease: "out", p: QJ.被拽 },
    { t: T.pulls[1] + 0.14, ease: "out", p: { ...QJ.被拽, neck: -26 } },
    { t: T.pulls[2] + 0.1, ease: "out", p: QJ.被拽 },
    { t: T.down, ease: "in", squash: 0.06, p: { ...QJ.坐地, float: 0 } },
    { t: T.down + 0.2, ease: "out", squash: 0, p: QJ.坐地 },
    { t: T.lock + 0.2, ease: "inOut", p: { ...QJ.坐地, neck: -22, lookY: 1 } },
    // 妈妈走了：把哑铃拖到怀里抱着
    { t: T.stand + 0.36, ease: "inOut", p: QJ.抱哑铃坐 },
    { t: T.door - 0.05, ease: "inOut", p: { ...QJ.抱哑铃坐, neck: -4, lookX: 0.9, lookY: 0.1, expression: "难过" } },
    { t: T.door + 0.3, ease: "inOut", p: { ...QJ.抱哑铃坐, neck: -8, lookX: 0.9, lookY: 0.2, expression: "含泪" } },
    { t: T.rise - 0.2, ease: "inOut", p: QJ.抱哑铃抬头 },
    { t: T.rise + 0.4, ease: "inOut", p: { ...QJ.抱哑铃飘, ground: false } },
    // 高空（切过来时已经朝左）
    { t: T.sky - 0.01, ease: "linear", p: { ...QJ.抱哑铃飘, face: -0.6 } },
    { t: T.clip - 0.1, ease: "inOut", p: { ...QJ.抱哑铃飘, face: -0.6, neck: 0, expression: "坚定", lookY: 0.3 } },
    { t: T.clip + 0.12, ease: "out", p: QJ.拔发卡 },
    { t: T.open - 0.18, ease: "inOut", p: QJ.开锁 },
    { t: T.open + 0.05, ease: "out", p: { ...QJ.开锁, teeth: 0, expression: "平常", lookY: 1 } },
    { t: T.drop + 0.12, ease: "out", p: QJ.松手 },
    { t: T.drop + 0.6, ease: "inOut", p: QJ.张手飘 },
    { t: T.hug - 0.02, ease: "linear", p: { ...QJ.张手飘, neck: 30 } },
    { t: T.hug + 0.1, ease: "out", p: QJ.一惊 },
    { t: T.push, ease: "inOut", p: QJ.推开 },
    { t: T.reach, ease: "out", p: QJ.够白 },
    { t: T.wrist - 0.04, ease: "inOut", p: { ...QJ.够白, neck: 38 } },
    { t: T.wrist + 0.12, ease: "out", p: QJ.被拉住 },
    { t: T.hold - 0.3, ease: "inOut", p: QJ.看她 },
    { t: T.hold + 0.22, ease: "out", p: QJ.搂住 },
    { t: T.land - 0.05, ease: "inOut", p: QJ.搂住 },
    { t: T.land + 0.3, ease: "inOut", p: QJ.怀里哭 },
    { t: 32.1, ease: "inOut", p: QJ.怀里哭 },
    // 楼顶的时间（36.0 = 32.5）：直起身，两只手摊着接她递过来的砖
    { t: 32.513, ease: "inOut", p: QJ.接砖 },
    { t: rt(T.take) - 0.03, ease: "inOut", p: QJ.接砖 },
    { t: rt(T.take) + 0.1, ease: "out", squash: 0.03, p: QJ.一沉 },
    { t: rt(T.take) + 0.3, ease: "inOut", squash: 0, p: { ...QJ.一沉, ...armL(30, 50, 0, "flat", 8), neck: -14 } },
    { t: rt(T.take) + 0.62, ease: "inOut", p: QJ.哭着笑 },
    { t: 35, ease: "inOut", p: QJ.哭着笑 },
  ];
  // 失重时四肢像在水里一样慢慢摆、哭的时候肩膀一抽一抽、坐着时身子还轻（还没接到砖之前一下一下往上浮）
  const qjAdd = (t: number, o: Num) => {
    const tt = rt(t);
    const floating = (fade(tt, 17, 17.2) * (1 - fade(tt, T.down - 0.15, T.down)) + fade(tt, T.rise, T.rise + 0.3) * (1 - fade(tt, T.land - 0.2, T.land))) * (1 - fade(tt, T.hug, T.hug + 0.1) * 0.5);
    if (floating > 0) {
      const s = (f: number, p: number) => floating * Math.sin(tt * f + p);
      o.hipL += 6 * s(1.3, 0);
      o.kneeL -= 5 * (floating + s(1.1, 1));
      o.hipR += 6 * s(1.2, 2.1);
      o.kneeR -= 5 * (floating + s(0.95, 0.4));
      o.rot += 3 * s(0.8, 0.3);
      o.shoulderL += 5 * s(1.1, 0.3);
      o.shoulderR += 5 * s(1.0, 2.4);
      o.elbowL += 6 * s(1.3, 1.2);
      o.elbowR += 6 * s(1.2, 0.2);
    }
    // 被抱住的一下：身子还往上冲，绕着腰晃一下
    o.rot += 8 * ring(tt, T.hug, 0.7, 0.35);
    const sob = fade(tt, T.door + 0.3, T.door + 0.6) * (1 - fade(tt, T.rise - 0.1, T.rise + 0.1)) + fade(tt, T.hold, T.hold + 0.3) * (1 - fade(tt, 32.4, 32.5));
    if (sob > 0) {
      const h = sob * hitch(tt, 0.62);
      o.lean += 2.5 * h;
      o.neck -= 2 * h;
      o.shoulderL -= 3 * h;
      o.shoulderR -= 3 * h;
    }
    if (o.face > 0) o.rot = -o.rot;
  };
  const qjMove = live(qjKeys, { look: lookOf(QJ_SPEC), base: { wind: WIND_A2 * 0.8 }, idle: true, seed: 51, springs: ARMS, follow: 0, add: qjAdd });
  const qjPose = memoT((t: number) => qjMove(rt(t)).pose);

  // ——— 千斤在门口的位置：飘着时根在铁桩左上方（踝上的红线拴着铁桩），一把一把被拽下来，坐在铁桩左边 ———
  const QJ_FLOAT: V2 = [HOME.stake - 128, -740];
  const QJ_SIT_X = HOME.stake - 214;
  const qjDoorRoot = (t: number): V2 => {
    if (t < T.pulls[0]) {
      const bob = 16 * Math.sin(t * 1.4) + 8 * Math.sin(t * 2.3 + 1);
      return [QJ_FLOAT[0] + 10 * Math.sin(t * 0.9), QJ_FLOAT[1] + bob];
    }
    // 每拽一把往下一截（先快后慢），身子还往上一弹
    let k = 0;
    T.pulls.forEach((p, i) => (k += (i < 2 ? 0.34 : 0.32) * E.out(ph(t, p, p + 0.26))));
    k = Math.min(1, k + 0.02 * fade(t, T.pulls[2] + 0.2, T.down));
    const x = QJ_FLOAT[0] + (QJ_SIT_X - QJ_FLOAT[0]) * E.io(k);
    const y = QJ_FLOAT[1] * (1 - k) + 18 * ring(t, T.pulls[0] + 0.2, 0.5, 0.2) + 14 * ring(t, T.pulls[1] + 0.2, 0.5, 0.2);
    if (t < T.rise) return [x, t < T.down ? y : 0];
    // 又飘起来：先慢慢离地，越飘越快（从画面上面出去）
    const u = t - T.rise;
    return [QJ_SIT_X - 40 * u, -(120 * u + 320 * u * u)];
  };

  // ———————————————————————— 沉沉（白天：楼顶 → 扑出去 → 半空抱住 → 落在楼顶 → 递砖） ————————————————————————
  // 楼顶朝巷子那头的楼边站着往下看城；看见了，往后退两步，冲两步，一脚蹬在楼边上扑出去
  const ROOF_X = 1180;
  const RUN_STEP = 0.24;
  const chenKeys: MoveKey[] = [
    { t: 25.5, p: { ...CHEN2.远望, wind: WIND_SKY } },
    { t: T.roof + 0.08, p: CHEN2.远望 },
    { t: T.roof + 0.26, ease: "out", p: CHEN2.看见 },
    // 退两步（还朝着那边）
    { t: T.roof + 0.48, ease: "inOut", dx: -70, p: { ...CHEN2.退, ...legR(10, -8, 4), ...legL(-24, -18, -14) } },
    { t: T.roof + 0.66, ease: "inOut", dx: -60, p: { ...CHEN2.退, ...legR(-18, -16, -10), ...legL(10, -10, 4) } },
    // 冲：三步，最后一步踩在楼边上
    { t: T.leap - 3 * RUN_STEP - 0.04, ease: SMOOTH, dx: 60, p: CHEN2.跑_蹬地 },
    { t: T.leap - 2 * RUN_STEP, ease: SMOOTH, dx: 110, p: swapSides(CHEN2.跑_落地) },
    { t: T.leap - RUN_STEP, ease: SMOOTH, dx: 120, p: CHEN2.跑_蹬地 },
    { t: T.leap - 0.07, ease: "out", dx: 70, p: CHEN2.蹬边 },
    { t: T.leap + 0.1, ease: "out", p: CHEN2.扑 },
    { t: T.hug - 0.04, ease: "inOut", p: { ...CHEN2.扑, ...armL(90, 24, 0, "open", 48), ...armR(100, 20, 0, "open", 48) } },
    { t: T.hug + 0.06, ease: "out", p: CHEN2.抱住 },
    { t: T.reach + 0.1, ease: "inOut", p: { ...CHEN2.抱住, neck: 26, lookY: -0.9 } },
    { t: T.wrist - 0.08, ease: "out", p: CHEN2.抓手腕 },
    { t: T.wrist + 0.2, ease: "inOut", p: CHEN2.看她 },
    { t: T.hold + 0.2, ease: "inOut", p: CHEN2.抱紧 },
    { t: T.land - 0.04, ease: "inOut", p: CHEN2.抱紧 },
    { t: T.land + 0.08, ease: "out", squash: 0.08, p: { ...CHEN2.落地, ground: true, lift: 0 } },
    { t: T.land + 0.36, ease: "inOut", squash: 0, plant: "L", p: CHEN2.跪着搂 },
    { t: 32.2, ease: "inOut", plant: "L", p: CHEN2.跪着搂 },
    // 楼顶的时间 32.5（= 36.0）起：手伸进靴筒 → 抽出来 → 身子往前倾，放进她手里 → 手一松就垂下来，看着她
    { t: 32.513, ease: "inOut", plant: "R", p: { ...CHEN.跪_掏砖, face: 0.8 } },
    { t: 32.72, ease: "inOut", plant: "R", p: { ...CHEN.跪_掏砖, face: 0.8, neck: -14 } },
    { t: 32.92, ease: "out", plant: "R", p: { ...CHEN.跪_抽出, face: 0.8 } },
    { t: 33.12, ease: "inOut", plant: "R", p: { ...CHEN.跪_递, face: 0.8 } },
    { t: rt(T.take) - 0.03, ease: "inOut", plant: "R", p: { ...CHEN.跪_放, face: 0.8 } },
    { t: rt(T.take) + 0.2, ease: "out", plant: "R", p: { ...CHEN.跪_放, face: 0.8, lean: 26, ...armL(12, 16, 6, "relax", 26), ...armR(0, 14, 0, "relax", 26), neck: -8 } },
    { t: rt(T.take) + 0.6, ease: "inOut", plant: "R", p: { ...CHEN.跪_看他, face: 0.8, expression: "微笑" } },
    { t: 35, ease: "inOut", plant: "R", p: { ...CHEN.跪_看他, face: 0.8, expression: "微笑" } },
  ];
  const chenAdd = (t: number, o: Num) => {
    const tt = rt(t);
    // 半空里：腿跟着慢慢晃（铁靴往下坠）
    const air = fade(tt, T.leap, T.leap + 0.1) * (1 - fade(tt, T.land - 0.15, T.land));
    if (air > 0) {
      const s = (f: number, p: number) => air * Math.sin(tt * f + p);
      o.hipL += 5 * s(1.4, 0.4);
      o.hipR += 5 * s(1.3, 2.1);
      o.kneeL -= 4 * (air + s(1.2, 1));
      o.kneeR -= 4 * (air + s(1.1, 0.2));
    }
    // 跪着喘口气
    const pant = fade(tt, T.land + 0.3, T.land + 0.5) * (1 - fade(tt, 32.4, 32.5));
    if (pant > 0) {
      const h = Math.sin(tt * 8) * pant;
      o.lean += 1.8 * h;
      o.neck -= 1.2 * h;
    }
    o.lean += 0.8 * Math.sin(tt * 0.9 + 1.3);
    if (o.face > 0) o.rot = -o.rot;
  };
  const chenMove = live(chenKeys, {
    look: CHENGTUO,
    base: { wind: WIND_SKY, chestL: "under", chestR: "under" },
    idle: true,
    seed: 61,
    springs: ARMS,
    add: chenAdd,
  });
  // 楼顶上的根（脚踩着楼顶）：朝右的人钉脚算出来的 x 要取反（dx 写的是画面方向，不用取反）
  const chenRoofX = (t: number) => ROOF_X + chenMove(t).x;
  const chenRaw = memoT((t: number) => chenMove(rt(t)).pose);
  // 攥住千斤伸上去的那只手腕：远处那只手 IK 到她的手腕上（攥住 → 跟着往下拉）
  const chenPose = memoT((t: number): PoseIn => {
    const p = chenRaw(t);
    const tt = rt(t);
    const w = fade(tt, T.wrist - 0.16, T.wrist - 0.04) * (1 - fade(tt, T.wrist + 0.3, T.hold));
    if (w <= 0) return p;
    const pose = { ...p, armR: { ...p.armR } };
    const r = chenRoot(t);
    const q = qjRoot(t);
    const j = castJoints(QJ_SPEC, qjPose(t));
    const wr: V2 = [q[0] + j.wristR[0], q[1] + j.wristR[1]];
    const mir = (pose.face ?? 0) > 0;
    pose.armR.to = [(wr[0] - r[0]) * (mir ? -1 : 1), wr[1] - r[1]];
    pose.armR.ik = w;
    return pose;
  });

  // ——— 扑出去、抱住：她蹬离楼边（根在楼边）按抛物线扑过去；抱住的一刻她的胸口正好在千斤的腰上 ———
  const EDGE: V2 = [chenRoofX(T.leap - 0.02), TOWER_ROOF];
  const LEAP_V: V2 = [520, -320];
  const G_LEAP = 3200;
  const leapAt = (t: number): V2 => {
    const u = t - T.leap;
    return [EDGE[0] + LEAP_V[0] * u, EDGE[1] + LEAP_V[1] * u + 0.5 * G_LEAP * u * u];
  };
  const CATCH = leapAt(T.hug);
  // 抱住那一刻两个人的相对位置：她两只胳膊圈住千斤的腰（她的胸口在千斤的胯前面一点）
  const chestOf = (p: PoseIn): V2 => {
    const j = jointsOf(p);
    return [(j.shoulderL[0] + j.shoulderR[0]) / 2, (j.shoulderL[1] + j.shoulderR[1]) / 2 + 60];
  };
  const hipOf = (spec: CastSpec, p: PoseIn): V2 => {
    const j = castJoints(spec, p);
    return [j.hip[0], j.hip[1]];
  };
  const pairOffset = (t: number): V2 => {
    const c = chestOf(chenRaw(t));
    const h = hipOf(QJ_SPEC, qjPose(t));
    // 挣的时候往后仰开一点，搂住以后贴紧
    const away = 40 * fade(t, T.push - 0.1, T.push + 0.1) * (1 - fade(t, T.hold, T.hold + 0.3));
    return [c[0] - h[0] + 62 + away, c[1] - h[1] + 6];
  };
  // 两个人一起：抱住那一下被她的分量拽着往下坠一截（又往右冲了一点），之后一个轻一个沉、悬着；
  // 挣的时候往上浮一点（离白更近）、手腕被攥住一沉；搂住以后像一片叶子慢慢落到千斤家那栋楼的楼顶上
  const LAND_X = 2390;
  const pairRoot = (t: number): V2 => {
    const u = t - T.hug;
    const sag = 200 * (1 - Math.exp(-u / 0.13));
    const drift = 150 * (1 - Math.exp(-u / 0.3));
    let y = CATCH[1] + sag;
    let x = CATCH[0] + drift;
    y -= 50 * fade(t, T.reach - 0.1, T.reach + 0.3) * (1 - fade(t, T.wrist, T.wrist + 0.15));
    y += 12 * Math.sin((t - T.hug) * 2.1) * (1 - fade(t, T.hold, T.hold + 0.3));
    const s = E.io(ph(t, T.hold + 0.1, T.land));
    y = y + (NEIGHBOR_ROOF - y) * s;
    x = x + (LAND_X - x) * E.soft(ph(t, T.hold - 0.2, T.land));
    // 像一片叶子：一边落一边左右轻轻荡
    x += 26 * Math.sin(Math.PI * 2 * ph(t, T.hold + 0.1, T.land)) * (1 - s);
    return [x, y];
  };
  /** 她（白天）的根：楼顶 → 扑 → 两个人一起 → 落在楼顶 */
  const chenRoot = memoT((t: number): V2 => {
    const tt = rt(t);
    if (tt < T.leap) return [chenRoofX(tt), TOWER_ROOF];
    if (tt < T.hug) return leapAt(tt);
    if (tt < T.land) return pairRoot(tt);
    // 落地以后：钉着脚算出来的横向挪动（她朝右，取反）
    return [LAND_X - (chenMove(tt).x - chenMove(T.land).x), NEIGHBOR_ROOF];
  });

  // ——— 千斤在高空的位置：从下面飘上来，抱着哑铃慢慢升；松手以后往上一蹿、接着往上飘，正好在抱住那一刻到她怀里 ———
  const QJ_HUG = (() => {
    const o = pairOffset(T.hug);
    return [CATCH[0] + o[0], CATCH[1] + o[1]] as V2;
  })();
  const qjSkyRoot = (t: number): V2 => {
    // 抱住之前：往左漂、往上升（离白越近越快一点）
    const v0 = 230;
    const tc = T.hug;
    const dt = tc - t;
    const lurch = 150 * (1 - fade(t, T.drop, T.drop + 0.35));
    const y = QJ_HUG[1] + v0 * dt + 18 * dt * dt + (t < T.drop ? 150 : lurch);
    const x = QJ_HUG[0] + 48 * dt;
    return [x, y];
  };
  const qjRoot = memoT((t: number): V2 => {
    const tt = rt(t);
    if (tt < T.sky) return qjDoorRoot(tt);
    if (tt < T.hug) return qjSkyRoot(tt);
    const r = chenRoot(t);
    const air = (u: number): V2 => {
      const c = u < T.land ? chenRoot(u) : pairRoot(T.land);
      const o = pairOffset(Math.min(u, T.land));
      return [c[0] + o[0], c[1] + o[1]];
    };
    if (tt < T.land - 0.1) {
      const o = pairOffset(tt);
      return [r[0] + o[0], r[1] + o[1]];
    }
    // 楼顶上：坐在她怀里（靠得近），回来时（接砖）往后挪一点、坐正
    const near = LAND_X + 150;
    const k = fade(tt, 32.1, 32.5);
    const seat: V2 = [near + (QJ_GIVE_X - near) * k, NEIGHBOR_ROOF];
    const w = E.out(ph(tt, T.land - 0.1, T.land + 0.3));
    if (w >= 1) return seat;
    const a = air(tt);
    return [a[0] + (seat[0] - a[0]) * w, a[1] + (seat[1] - a[1]) * w];
  });
  // 接砖：千斤坐的位置按「砖落进她手里那一刻，两个人手里的砖叠在一起」算（和第一幕一样）
  let QJ_GIVE_X = LAND_X + 300;
  {
    const tk = rt(T.take);
    const her = chenMove(tk);
    const hb = brickCenter(CHENGTUO, her.pose);
    const qb = brickCenter(lookOf(QJ_SPEC), qjMove(tk).pose, QJ_SPEC.scale, QJ_SPEC.width ?? 1);
    const hx = LAND_X - (her.x - chenMove(T.land).x);
    QJ_GIVE_X = hx + hb[0] - qb[0];
  }

  // ——— 哑铃：门口（地上 → 千斤怀里）→ 高空（她怀里 → 松手掉下去） ———
  // 抱在近处那只手臂里（另一只手去拔发卡、开锁时它还在怀里）：中心在近处那只手掌往身子那边一点
  const qjHeld = (t: number): V2 => {
    const r = qjRoot(t);
    const p = qjPose(t);
    const j = castJoints(QJ_SPEC, p);
    const toBody = (p.face ?? 0) > 0 ? -1 : 1;
    return [r[0] + j.palmL[0] + 22 * toBody, r[1] + j.palmL[1] + 62];
  };
  const DROP_FROM = () => qjHeld(T.drop);
  /** 千斤抱着的时候把手朝着镜头斜过去（看起来短一截，铁饼贴在她怀里，不挡脸） */
  const HUG_SX = 0.42;
  const dumbbellAt = (t: number): { p: V2; r: number; sx: number } | null => {
    if (t < T.dis) return null;
    if (t < T.setDown) return { p: momHeld(t), r: 0, sx: 1 };
    if (t < T.setDown + 0.12) {
      const a = momHeld(T.setDown);
      const k = E.out(ph(t, T.setDown, T.setDown + 0.12));
      return { p: [a[0] + (DB_GROUND[0] - a[0]) * k, a[1] + (DB_GROUND[1] - a[1]) * k], r: 0, sx: 1 };
    }
    const grabT = T.stand + 0.1;
    if (t < grabT) return { p: DB_GROUND, r: 0, sx: 1 };
    if (t < T.sky) {
      // 被她拖到怀里（0.3 秒，一边拖一边转过来），之后一直抱着
      const k = E.io(ph(t, grabT, grabT + 0.3));
      const h = qjHeld(t);
      return { p: [DB_GROUND[0] + (h[0] - DB_GROUND[0]) * k, DB_GROUND[1] + (h[1] - DB_GROUND[1]) * k], r: 0.12 * k, sx: 1 + (HUG_SX - 1) * k };
    }
    if (t < T.drop) return { p: qjHeld(t), r: 0.12, sx: HUG_SX };
    const u = t - T.drop;
    const p0 = DROP_FROM();
    if (u > 1.2) return null;
    // 掉下去的时候翻着跟头
    return { p: [p0[0] + 60 * u, p0[1] + 0.5 * 6800 * u * u], r: 0.12 + 1.6 * u, sx: HUG_SX + (1 - HUG_SX) * Math.abs(Math.sin(u * 5)) };
  };
  /** 千斤近处那只脚的脚踝（红线、铁链拴在这里） */
  const qjAnkle = (t: number): V2 => {
    const r = qjRoot(t);
    const j = castJoints(QJ_SPEC, qjPose(t));
    return [r[0] + j.ankleL[0], r[1] + j.ankleL[1]];
  };
  /** 哑铃上拴铁链的那一头（离脚踝近的那一头的卡箍） */
  const dbEnd = (d: { p: V2; r: number; sx: number }, side = -1): V2 => [d.p[0] + side * 86 * BIG * d.sx * Math.cos(d.r), d.p[1] + side * 86 * BIG * d.sx * Math.sin(d.r)];

  // ———————————————————————— 夜里的她（屋子的坐标） ————————————————————————
  // 伏在桌上写砖 → 拿起来看一眼 → 弯腰塞进靴筒 →（38.0）一只靴子已经脱下来落地「咚」，再脱另一只「咚」→ 脚跟离地，从椅子上浮起来 → 飘到天花板上的床里，闭上眼
  const nightKeys: MoveKey[] = [
    { t: 31.8, p: CHEN_N.写 },
    { t: 33.5, ease: "inOut", p: CHEN_N.写 },
    { t: 33.9, ease: "inOut", p: CHEN_N.拿砖 },
    { t: 35.3, ease: "inOut", p: { ...CHEN_N.拿砖, neck: -18, lookY: 0.9 } },
    { t: 35.62, ease: "inOut", p: CHEN_N.塞砖 },
    { t: 36.0, ease: "inOut", p: { ...CHEN_N.塞砖, ...armL(16, 0, -6, "relax", 58) } },
    // 第二次（38.0）：第一只靴子刚脱下来落地，正在脱第二只
    { t: 37.9, p: { ...CHEN_N.脱靴2 }, items: { bootL: true, bootR: false } },
    { t: T.boot2 - 0.05, ease: "inOut", p: { ...CHEN_N.脱靴2, ...armL(66, 30, 0, "grip", 44), ...armR(74, 26, 0, "grip", 44) } },
    { t: T.boot2, ease: "out", p: { ...CHEN_N.脱靴2, lean: 30, ...legL(96, -70, 10) }, items: { bootL: false, bootR: false } },
    { t: T.float - 0.08, ease: "inOut", p: { ...CHEN_N.写, ...armL(20, 30, 0, "relax", 26), ...armR(26, 30, 0, "relax", 26), neck: -10, expression: "平常" } },
    { t: T.float + 0.25, ease: "inOut", p: { ...CHEN_N.浮起, ground: false } },
    { t: T.bed - 0.1, ease: "inOut", p: { ...CHEN_N.浮起, rot: -60, float: 0.55 } },
    { t: T.bed + 0.2, ease: "out", p: CHEN_N.躺 },
    { t: T.end + 1, ease: "inOut", p: CHEN_N.躺 },
  ];
  const nightMove = live(nightKeys, { look: NIGHT_LOOK, base: { wind: 0 }, idle: true, seed: 71, springs: ARMS, follow: 0 });
  /** 夜里她手里正在写的那块砖（立在桌上，正面朝着镜头） */
  const DESK_BRICK: V2 = [ROOM.desk.x1 - 72, ROOM.desk.top - 4];
  /** 笔尖在砖上走到哪了：「活」「下」「去」一个字一个字，每个字里一笔一笔来回 */
  const W0 = T.night + 0.15;
  const W1 = 33.42;
  const penAt = (t: number): V2 => {
    const u = clamp01((t - W0) / (W1 - W0));
    const i = Math.min(2, Math.floor(u * 3));
    const k = u * 3 - i;
    const x0 = DESK_BRICK[0] - 14 + i * 10.5;
    const x = x0 + 8 * k + 2.5 * Math.sin(k * 23);
    const y = DESK_BRICK[1] - 20 + 9 * (0.5 + 0.5 * Math.sin(k * 17 + i));
    if (t > W1) {
      // 写完：笔抬起来一点
      const a = E.out(ph(t, W1, W1 + 0.3));
      return [DESK_BRICK[0] + 18 + 20 * a, DESK_BRICK[1] - 22 - 30 * a];
    }
    return [x, y];
  };
  const nightAt = memoT((t: number) => {
    const f = nightMove(t);
    // 浮起来：根往上、往床那边挪（屋子里没有风，头发是失重漂起来的）
    const u = E.io(ph(t, T.float, T.bed + 0.15));
    const x = ROOM.chair.x + (ROOM.bed.x0 + 300 - ROOM.chair.x) * u;
    const y = -600 * u;
    let pose = f.pose;
    const ik = (side: "L" | "R", p: V2, w: number) => {
      if (w <= 0) return;
      pose = { ...pose, [side === "L" ? "armL" : "armR"]: { ...(side === "L" ? pose.armL : pose.armR), to: [p[0] - x, p[1] - y], ik: w } };
    };
    // 写字：拿笔的手跟着笔尖走（笔从手里斜着伸出去，笔尖落在砖上），另一只手按着砖的左边
    const wW = 1 - fade(t, 33.6, 33.85);
    if (t < 34) {
      const tip = penAt(t);
      ik("L", [tip[0] + 40, tip[1] - 22], wW);
      ik("R", [DESK_BRICK[0] - 22, DESK_BRICK[1] - 22], wW);
    }
    // 脱第二只靴子：两只手抱住抬起来的那只靴子往下拔
    if (t > 37.8 && t < T.boot2 + 0.15) {
      const j = jointsOf(f.pose);
      const top: V2 = [x + j.ankleL[0] + 0.7 * (j.kneeL[0] - j.ankleL[0]), y + j.ankleL[1] + 0.7 * (j.kneeL[1] - j.ankleL[1])];
      const w = 1 - fade(t, T.boot2 - 0.02, T.boot2 + 0.12);
      ik("L", [top[0] - 10, top[1] + 10], w);
      ik("R", [top[0] + 16, top[1] + 30], w);
    }
    return { pose, x, y };
  });

  // ———————————————————————— 镜头 ————————————————————————
  type CamFn = (t: number) => Cam;
  const chain =
    (keys: [number, CamFn, (x: number) => number][]) =>
    (t: number): Cam => {
      if (t <= keys[0][0]) return keys[0][1](t);
      for (let i = 1; i < keys.length; i++) {
        const [t1, f1, e] = keys[i];
        if (t < t1) {
          const [t0, f0] = keys[i - 1];
          return camLerp(f0(t), f1(t), e((t - t0) / (t1 - t0)));
        }
      }
      return keys[keys.length - 1][1](t);
    };
  const lin = (x: number) => x;

  // ① 店门口（压抑）：接着第一幕扎下来的取景（冲过 4% 弹回来），之后线性慢推到她怀里的哑铃
  const bigTrack = smoothTrack((t) => shop.bigAt(t).p, SHOP_T.lift, T.disEnd, 6);
  const DB_S: V2 = [540, 1100];
  const Z_DB = 1.42;
  const camShop = (t: number): Cam => {
    const over = 1 + 0.04 * Math.exp(-(t - T.start) / 0.09);
    const c0 = { ...SHOP_CAM, z: SHOP_CAM.z * over };
    const k = ph(t, 16.62, T.dis);
    const target = aim(...bigTrack(t), DB_S[0], DB_S[1], SHOP_CAM.z * Math.pow(Z_DB / SHOP_CAM.z, 1));
    // 推近：倍数线性慢慢往上，取景中心从店门口挪到哑铃
    const w = E.soft(ph(t, 16.62, 17.5));
    const pos = camLerp(c0, target, w);
    return { ...pos, z: c0.z * Math.pow(Z_DB / SHOP_CAM.z, k) };
  };

  // ② 门口：从她怀里同样大小、同样位置的哑铃开始（匹配溶解）→ 她放下哑铃时往后退开、看清门口 → 顺着红线抬上去落在千斤身上
  const qjChest = (t: number): V2 => {
    const r = qjRoot(t);
    const j = castJoints(QJ_SPEC, qjPose(t));
    return [r[0] + (j.shoulderL[0] + j.shoulderR[0]) / 2, r[1] + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 50];
  };
  const homeOpen = (t: number): Cam => aim(...momHeld(Math.min(t, T.setDown - 0.05)), DB_S[0], DB_S[1], Z_DB);
  const homeWide = (_t: number): Cam => aim(HOME.stake + 40, -560, 540, 1180, 1.0);
  const onQj = (t: number): Cam => {
    const c = qjChest(Math.min(t, T.grab));
    return aim(c[0] + 40, c[1] + 120, 540, 900, 1.05);
  };
  // 被拽下来：跟着她往下（镜头追她的胸口，晚一点到），每拽一把画面一沉
  const qjTrack = smoothTrack(qjChest, T.grab, T.lock + 0.5, 6);
  const onPull = (t: number): Cam => {
    const c = qjTrack(t);
    return aim(c[0] + 60, Math.max(c[1] + 120, -620), 540, 960, 1.05);
  };
  const LOCK_S: V2 = [560, 1330];
  const onLock = (_t: number): Cam => {
    const a = qjAnkle(T.lock);
    return aim(a[0] + 40, a[1] - 60, LOCK_S[0], LOCK_S[1], 1.3);
  };
  // 心酸：千斤坐在左边，窗里的妈妈在右上——几乎不动，很慢地推近 6%
  const SAD: V2 = [HOME.win.x0 - 10, -470];
  const onSad = (t: number): Cam => aim(SAD[0], SAD[1], 540, 1060, 1.12 * (1 + 0.06 * E.soft(ph(t, T.stand, T.rise))));
  // 又飘起来：镜头跟着往上抬一点（只跟一小半，她从画面上面出去）
  const onRise = (t: number): Cam => {
    const c = onSad(T.rise);
    const u = Math.max(0, t - T.rise);
    return { ...c, y: c.y - 0.42 * (120 * u + 320 * u * u) };
  };
  const camHome = chain([
    [T.dis, homeOpen, lin],
    [T.setDown - 0.05, homeOpen, lin],
    [T.look, homeWide, E.io],
    [T.up - 0.35, homeWide, lin],
    [T.up, onQj, E.io],
    [T.grab, onQj, lin],
    [T.pulls[0] + 0.1, onPull, E.io],
    [T.down, onPull, lin],
    [T.lock - 0.06, onLock, E.io],
    [T.lock + 0.25, onLock, lin],
    [T.stand + 0.5, onSad, E.io],
    [T.rise, onSad, lin],
    [T.sky, onRise, lin],
  ]);
  const lockPunch = (t: number) => 1 + 0.018 * kick(t, T.lock, 0.12);

  // ③ 高空（决绝）：她从下面飘上来；拔发卡时镜头直直地落到锁上（0.3 秒），「咔」一顿；松手以后跟着她往上、往后退开，露出张着手的她和头顶的白
  const qjSkyTrack = smoothTrack(qjChest, T.sky - 0.2, T.roof + 0.1, 5);
  const skyIn = (t: number): Cam => {
    const c = qjChest(T.sky + 0.45);
    return aim(c[0], c[1], 650, 900 + 140 * (1 - E.out(ph(t, T.sky, T.sky + 0.5))), 1.1);
  };
  const onClip = (_t: number): Cam => {
    const a = qjAnkle(T.open);
    return aim(a[0] - 10, a[1] - 40, 540, 980, 2.0);
  };
  const onOpenArms = (t: number): Cam => {
    const c = qjSkyTrack(t);
    return aim(c[0], c[1], 600, 1330, 0.82);
  };
  const camSky = chain([
    [T.sky, skyIn, lin],
    [T.clip - 0.05, skyIn, lin],
    [T.clip + 0.27, onClip, E.out],
    [T.drop + 0.05, onClip, lin],
    [T.drop + 0.65, onOpenArms, E.out],
    [T.roof, onOpenArms, lin],
  ]);

  // ④ 楼顶（惊 → 急）：先停在她身上（白就在她头顶），看见了一惊；退两步时不动；冲出去时镜头和她一样快、往右带，千斤从画面右边进来
  const chenChest = (t: number): V2 => {
    const r = chenRoot(t);
    const c = chestOf(chenPose(t));
    return [r[0] + c[0], r[1] + c[1]];
  };
  const roofHold = (t: number): Cam => {
    const c = chenChest(T.roof + 0.1);
    return aim(c[0] + 60, c[1] + 40, 470, 1000, 1.18 * (1 + 0.03 * kick(t, T.roof + 0.22, 0.12)));
  };
  const runTrack = smoothTrack((t) => [chenRoot(t)[0], 0], T.roof + 0.5, T.hug + 0.2, 12);
  const roofRun = (t: number): Cam => {
    const x = runTrack(t)[0];
    return aim(x + 260, TOWER_ROOF - 300, 400, 1000, 1.0);
  };
  // ⑤ 扑出去到抱住：两个人都在画面里，越近推得越近，撞上的一刻正好 2 倍
  const both = (t: number): Cam => {
    const a = chenChest(t);
    const q = qjChest(t);
    const d = Math.hypot(q[0] - a[0], q[1] - a[1]);
    const z = Math.max(0.95, Math.min(2.0, 620 / Math.max(1, d)));
    return aim((a[0] + q[0]) / 2, (a[1] + q[1]) / 2 + 30, 540, 1060, z);
  };
  // 抱住以后（拼命 → 紧张）：两个人在画面中下方，头顶就是白的边；挣的时候线性慢慢逼近
  const pairTrack = smoothTrack((t) => {
    const a = chenChest(t);
    const q = qjChest(t);
    return [(a[0] + q[0]) / 2, (a[1] + q[1]) / 2];
  }, T.hug - 0.1, T.land + 1.2, 8);
  const onPair = (t: number): Cam => {
    const c = pairTrack(t);
    const z = 2.0 * (1 + 0.07 * ph(t, T.hug + 0.2, T.hold));
    return aim(c[0], c[1], 540, 1180, z);
  };
  // 搂住了（释然）：往后舒一口气，跟着两个人落下去
  const onFall = (t: number): Cam => {
    const c = pairTrack(t);
    return aim(c[0], c[1] + 40, 540, 1080, 1.2);
  };
  // 落在楼顶（温柔）：慢慢推近
  const onLanded = (t: number): Cam => {
    const c = pairTrack(T.land + 0.6);
    return aim(c[0] - 10, c[1] + 60, 540, 1080, 1.55 * (1 + 0.08 * E.soft(ph(t, T.land + 0.2, T.night))));
  };
  const camAir = chain([
    [T.roof, roofHold, lin],
    [T.roof + 0.62, roofHold, lin],
    [T.roof + 0.95, roofRun, E.io],
    [T.leap, roofRun, lin],
    [T.leap + 0.2, both, E.io],
    [T.hug, both, lin],
    [T.hug + 0.2, onPair, E.out],
    [T.hold + 0.05, onPair, lin],
    [T.hold + 0.85, onFall, E.out],
    [T.land, onFall, lin],
    [T.land + 0.35, onLanded, E.io],
  ]);
  const airPunch = (t: number) => 1 + 0.05 * kick(t, T.hug, 0.12) + 0.02 * kick(t, T.wrist, 0.1) + 0.02 * kick(t, T.land, 0.12);

  // ⑥ 夜里（屋子的坐标）：笔尖和砖的大特写，越推越慢 → 退开到地上那一排砖、贴着它们往左移（半拍一块）→ 跟着她的手推进靴筒
  const nightBootTop = (t: number): V2 => {
    const n = nightAt(t);
    const j = jointsOf(n.pose);
    return [n.x + j.ankleR[0] + 0.8 * (j.kneeR[0] - j.ankleR[0]), n.y + j.ankleR[1] + 0.8 * (j.kneeR[1] - j.ankleR[1])];
  };
  const BOOT_S: V2 = [540, 1000];
  const Z_BOOT = 3.4;
  // 先看见伏在灯下的她和手里的笔，再越推越慢地推到笔尖和砖上的字
  const onPen = (t: number): Cam => {
    const k = E.settle(ph(t, T.night, 33.7));
    const a = aim(DESK_BRICK[0] + 60, DESK_BRICK[1] - 150, 540, 1000, 2.9);
    const b = aim(DESK_BRICK[0], DESK_BRICK[1] - 14, 520, 1120, 4.8);
    return camLerp(a, b, k);
  };
  const ROW_Y = -18;
  const ROW_LAST = ROOM.row.x0 + (ROW_WORDS.length - 1) * ROOM.row.dx;
  const rowEnd = (): Cam => aim(ROW_LAST, ROW_Y - 20, 560, 1000, 5.4);
  const rowSlide = (t: number): Cam => {
    const k = ph(t, T.bricks + 0.42, 35.42);
    const x = ROW_LAST + (ROOM.row.x0 - 40 - ROW_LAST) * k;
    return aim(x, ROW_Y - 20, 560, 1000, 5.4);
  };
  const onBootN = (t: number): Cam => aim(...nightBootTop(Math.min(t, 36)), BOOT_S[0], BOOT_S[1], Z_BOOT);
  const camNightA = chain([
    [T.night, onPen, lin],
    [T.bricks, onPen, lin],
    [T.bricks + 0.42, rowEnd, E.io],
    [35.42, rowSlide, lin],
    [35.9, onBootN, E.out],
  ]);
  // ⑦ 回到楼顶（释然）：她的靴筒和夜里那只在画面上同一个位置、同样大小 → 跟着砖到千斤手里 → 坠的一下一顿 → 往后舒一口气
  const chenBootTop = (t: number): V2 => {
    const r = chenRoot(t);
    const j = jointsOf(chenPose(t));
    return [r[0] + j.ankleR[0] + 0.8 * (j.kneeR[0] - j.ankleR[0]), r[1] + j.ankleR[1] + 0.8 * (j.kneeR[1] - j.ankleR[1])];
  };
  const brickPos = { p: null as V2 | null };
  const giveBoot = (_t: number): Cam => aim(...chenBootTop(T.back), BOOT_S[0], BOOT_S[1], Z_BOOT);
  const giveFollow = (t: number): Cam => {
    const a = chenBootTop(T.back);
    const q = qjHeld(T.take);
    const k = E.io(ph(t, T.back + 0.35, T.take));
    return aim(a[0] + (q[0] - a[0]) * k, a[1] + (q[1] - a[1]) * k, 540, 1000 + 40 * k, 2.4);
  };
  const giveRelax = (t: number): Cam => {
    const q = qjHeld(T.take);
    const c = chenChest(T.take);
    return aim((q[0] + c[0]) / 2, (q[1] + c[1]) / 2 - 30, 540, 1050, 1.55 * (1 - 0.03 * E.soft(ph(t, T.take + 0.5, T.night2))));
  };
  const camGive = chain([
    [T.back, giveBoot, lin],
    [T.back + 0.35, giveBoot, lin],
    [T.take, giveFollow, lin],
    [T.take + 0.75, giveRelax, E.settle],
  ]);
  // ⑧ 夜里第二次（秘密）：脱下来的靴子落地 → 退开看见坐着的她 → 她浮起来，镜头跟着往上、慢慢转 180°，落在床上她是正着躺的
  const nightChest = (t: number): V2 => {
    const n = nightAt(t);
    const j = jointsOf(n.pose);
    return [n.x + (j.shoulderL[0] + j.shoulderR[0]) / 2, n.y + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 60];
  };
  const floatTrack = smoothTrack(nightChest, T.night2, T.end + 0.1, 7);
  const LOOSE_BOOT: V2 = [ROOM.boots[0], 0];
  const onLoose = (_t: number): Cam => aim(LOOSE_BOOT[0] - 70, -190, 560, 1150, 2.2);
  const onSit = (_t: number): Cam => aim(ROOM.chair.x - 60, -330, 540, 1100, 1.5);
  const onFloat = (t: number): Cam => {
    const c = floatTrack(t);
    const r = Math.PI * E.io(ph(t, T.float + 0.05, T.bed + 0.1));
    return { ...aim(c[0], c[1], 540, 960, 1.35), r };
  };
  const onBed = (t: number): Cam => {
    const c = floatTrack(T.bed + 0.3);
    return { ...aim(c[0], c[1], 540, 960, 1.35 * (1 - 0.1 * E.soft(ph(t, T.bed + 0.3, T.end)))), r: Math.PI };
  };
  const camNightB = chain([
    [T.night2, onLoose, lin],
    [T.boot2 + 0.02, onLoose, lin],
    [T.float - 0.02, onSit, E.io],
    [T.float + 0.05, onSit, lin],
    [T.bed + 0.1, onFloat, lin],
    [T.bed + 0.35, onBed, E.io],
  ]);

  type Phase = "shop" | "home" | "sky" | "air" | "night" | "give";
  const phaseOf = (t: number): Phase => (t < T.dis ? "shop" : t < T.sky ? "home" : t < T.roof ? "sky" : t < T.night ? "air" : t < T.back ? "night" : t < T.night2 ? "give" : "night");
  const camOf = (t: number, ph0: Phase = phaseOf(t)): Cam => {
    switch (ph0) {
      case "shop":
        return camShop(t);
      case "home": {
        const c = camHome(t);
        return { ...c, z: c.z * lockPunch(t) };
      }
      case "sky": {
        const c = camSky(t);
        return { ...c, z: c.z * (1 + 0.015 * kick(t, T.open, 0.1)) };
      }
      case "air": {
        const c = camAir(t);
        return { ...c, z: c.z * airPunch(t) };
      }
      case "give": {
        const c = camGive(t);
        return { ...c, z: c.z * (1 + 0.02 * kick(t, T.take, 0.1)) };
      }
      default:
        return t < T.back ? camNightA(t) : camNightB(t);
    }
  };
  const shakeAt = (t: number): [number, number] =>
    shake(t, 6 * kick(t, T.lock, 0.08) + 4 * kick(t, T.open, 0.08) + 14 * kick(t, T.hug, 0.1) + 5 * kick(t, T.wrist, 0.08) + 10 * kick(t, T.land, 0.1) + 3 * kick(t, T.take, 0.08));

  // ———————————————————————— 画 ————————————————————————
  /** 远处天上也有人在往上飘（高空镜头里）：逆光的小剪影，身上一团暖光 */
  const skyFloaters = (() => {
    const r = seeded(77);
    return Array.from({ length: 9 }, (_, i) => ({ D: i % 2 ? 4 : 2.2, x: -1500 + r() * 6000, y: -5200 - r() * 3200, v: 40 + r() * 50, ph: r() * 6, h: 300 + r() * 120 }));
  })();

  const late: (() => void)[] = [];
  const drawDay = (g: CanvasRenderingContext2D, t: number, phase: Phase) => {
    const cam = camOf(t, phase);
    const sh = shakeAt(t);
    const z = cam.z;
    g.setTransform(1, 0, 0, 1, 0, 0);
    drawSky(g, base, cam);
    drawCity(
      g,
      base,
      cam,
      t,
      (D) => {
        if ((phase === "sky" || phase === "air") && (D === 4 || D === 2.2)) {
          const v = viewOf(cam, D);
          for (const f of skyFloaters) {
            if (f.D !== D) continue;
            const y = f.y - f.v * t;
            if (f.x < v.x0 - 300 || f.x > v.x1 + 300 || y < v.y0 - 600 || y > v.y1 + 300) continue;
            drawGlow(g, f.x, y - f.h * 0.45, f.h * 0.9, 0.6);
            drawSilhouette(g, f.x, y, f.h, t, f.ph, D === 4 ? 0.45 : 0.65);
          }
        }
      },
      sh,
      { light: 1, haze: 0.25 * clamp01((z - 1.6) / 0.5) },
    );
    applyCam(g, base, cam, 1, sh);
    const view = viewOf(cam, 1);
    for (const b of [TOWER, NEIGHBOR]) {
      if (b.x > view.x1 + 50 || b.x + b.w < view.x0 - 50) continue;
      drawBlock(g, b, cam, 1, 2, 3.2, t);
      drawBlockGlow(g, b, cam, 1);
    }
    if (view.y1 > TOWER_ROOF - 700 && view.y0 < TOWER_ROOF + 300 && view.x0 < TOWER.x + TOWER.w) drawRoof(g, t);
    if (view.y1 > -40) drawStreet(g, cam);
    late.length = 0;
    const world = g.getTransform();

    if (phase === "shop") {
      shop.draw(g, t, z);
    } else if (phase === "home") {
      drawHomeDoor(g, t, z, world);
    } else {
      drawAir(g, t, z, world);
    }
    for (const f of late) f();
    drawMotes(g, cam, t, 1, 1, 0.85);
    applyCam(g, base, cam, 0.7, sh);
    drawMotes(g, cam, t + 3.1, 0.7, 1.8, 0.5);
    drawSunbeams(g, base, cam, t, clamp01(1 - (-cam.y - 3000) / 4000));
    // 暖光：抱住的一下炸开一团暖光、慢慢收；砖放进千斤手里亮起来
    const hugWarm = fade(t, T.hug - 0.02, T.hug + 0.1) * (1 - 0.6 * fade(t, T.hug + 0.2, T.hold)) * (1 - fade(t, T.night - 0.3, T.night));
    if (hugWarm > 0.01 && phase === "air") {
      const c = toScreen(cam, ...chenChest(t));
      warmGlow(g, c[0], c[1], 700, 0.75 * hugWarm);
    }
    if (phase === "give" && brickPos.p && t > T.take - 0.03) {
      const w = E.out(ph(t, T.take - 0.02, T.take + 0.45));
      g.setTransform(1, 0, 0, 1, 0, 0);
      const [bx, by] = brickPos.p;
      warmGlow(g, (bx * W) / width, (by * H) / height, 620 * (0.6 + 0.4 * w), 0.9 * w, true);
    }
    const look = lookAt(t, phase);
    drawGrade(g, base, grain, look.warm, look.vig);
    drawWhite(g, base, cam, t, 0);
  };

  /** 一团暖光（设计坐标的画面位置）：soft-light 只把亮处提暖，中间一小团 lighter */
  const warmGlow = (g: CanvasRenderingContext2D, sx: number, sy: number, R: number, a: number, core = false) => {
    g.save();
    g.setTransform(base);
    g.globalCompositeOperation = "soft-light";
    const gr = g.createRadialGradient(sx, sy, 0, sx, sy, R);
    gr.addColorStop(0, `rgba(255,170,80,${a})`);
    gr.addColorStop(1, "rgba(255,170,80,0)");
    g.fillStyle = gr;
    g.fillRect(sx - R, sy - R, R * 2, R * 2);
    g.globalCompositeOperation = "lighter";
    const r2 = core ? 150 : 260;
    const g2 = g.createRadialGradient(sx, sy, 0, sx, sy, r2);
    g2.addColorStop(0, `rgba(255,200,130,${0.36 * a})`);
    g2.addColorStop(1, "rgba(255,200,130,0)");
    g.fillStyle = g2;
    g.fillRect(sx - r2, sy - r2, r2 * 2, r2 * 2);
    g.restore();
  };

  /** 暗角、暖：门口心酸时压暗；抱住、砖亮起来时松开、暖起来 */
  const lookAt = (t: number, phase: Phase) => {
    let vig = 0.12;
    vig += 0.16 * fade(t, T.stand + 0.3, T.rise) * (1 - fade(t, T.sky - 0.1, T.sky));
    vig += 0.06 * fade(t, T.hug + 0.2, T.wrist) * (1 - fade(t, T.hold, T.hold + 0.5));
    let warm = 0.9;
    if (phase === "air") warm += 0.2 * fade(t, T.hold, T.hold + 0.6);
    if (phase === "give") warm += 0.25 * fade(t, T.take, T.take + 0.5);
    return { vig: Math.max(0, vig), warm };
  };

  /** 门口：窗里的屋子和妈妈、门面、铁桩、红线、哑铃、铁链和锁、千斤、妈妈 */
  const drawHomeDoor = (g: CanvasRenderingContext2D, t: number, z: number, world: DOMMatrix) => {
    drawHomeInterior(g, t, 1);
    if (t > T.door) {
      g.save();
      g.beginPath();
      g.rect(HOME.win.x0, HOME.win.top, HOME.win.x1 - HOME.win.x0, HOME.win.sill - HOME.win.top);
      g.clip();
      const m = momInAt(t);
      drawPerson(g, MOM_SPEC, m.pose, m.x, -150, z);
      g.restore();
    }
    drawHomeTable(g);
    const doorOpen = 1 - E.io(ph(t, T.door - 0.22, T.door));
    // 妈妈进门：走进门洞以后画在门洞的暖光前面、门板后面（门关上时把她挡住）
    const mo = momAt(t);
    const inDoor = t > T.stand + 0.5;
    drawHomeFacade(g, t, doorOpen, inDoor && t < T.door ? () => drawPerson(g, MOM_SPEC, mo.pose, mo.x, 0, z) : undefined);
    drawStake(g, HOME.stake);
    // 红线：拴在铁桩上，那头是她的脚踝；被拽的时候经过妈妈的两只手（下面多出来的一截垂在地上）
    const ring0 = stakeRing(HOME.stake);
    const ank = qjAnkle(t);
    if (t < T.lock - 0.15) {
      if (t < T.grab) drawThread(g, ring0, ank, 18);
      else {
        const j = castJoints(MOM_SPEC, mo.pose);
        const hands: V2[] = [
          [mo.x + j.palmL[0], j.palmL[1]],
          [mo.x + j.palmR[0], j.palmR[1]],
        ].sort((a, b) => a[1] - b[1]) as V2[];
        drawThread(g, ank, hands[0], 0);
        drawThread(g, hands[0], hands[1], 10);
        drawThread(g, hands[1], ring0, 90);
      }
    } else {
      // 解下来的红线掉在地上
      drawThread(g, ring0, [HOME.stake - 120, -6], 40);
    }
    // 哑铃、铁链、锁
    const db = dumbbellAt(t);
    const qr = qjRoot(t);
    const qp = qjPose(t);
    const heldByQj = t >= T.stand + 0.1;
    const drawDb = () => {
      if (!db) return;
      g.save();
      g.setTransform(world);
      drawDumbbell(g, db.p[0], db.p[1], db.r, BIG, 3, db.sx);
      g.restore();
    };
    const chainOn = t >= T.lock - 0.2;
    const chainDraw = () => {
      if (!chainOn || !db) return;
      g.save();
      g.setTransform(world);
      const a = qjAnkle(t);
      const e = dbEnd(db);
      drawChain(g, [a, [(a[0] + e[0]) / 2, Math.max(a[1], e[1]) + 26], e], 22, 2.6);
      drawPadlock(g, a[0] + 6, a[1] + 26, 0.2, 0, 0.9, 2.6);
      g.restore();
    };
    if (db && !heldByQj && t >= T.setDown) drawDb();
    // 地上的影子
    if (qr[1] > -40) groundShadow(g, qr[0] + 60, 150, 0.26);
    else groundShadow(g, qr[0] + 30, 110 / (1 + -qr[1] / 300), 0.24 / (1 + -qr[1] / 250));
    if (t < T.stand + 0.85) groundShadow(g, mo.x + 14, 120, 0.26);
    // 千斤（抱着哑铃时画在她身子和前面那只手臂之间）
    drawPerson(g, QJ_SPEC, qp, qr[0], qr[1], z, heldByQj ? { beforeFrontArms: () => { drawDb(); chainDraw(); } } : {});
    if (!heldByQj) chainDraw();
    // 妈妈：门口这段在千斤前面；走进门洞以后画在门面里（见上面）
    if (!inDoor) {
      const held = t < T.setDown + 0.05;
      drawPerson(g, MOM_SPEC, mo.pose, mo.x, 0, z, held ? { beforeFrontArms: drawDb } : {});
    }
  };

  /** 高空、楼顶：千斤、哑铃（铁链、锁、发卡）、她 */
  const drawAir = (g: CanvasRenderingContext2D, t: number, z: number, world: DOMMatrix) => {
    const tt = rt(t);
    const qr = qjRoot(t);
    const qp = qjPose(t);
    const db = tt < T.land ? dumbbellAt(tt) : null;
    const spec = tt >= T.clip + 0.05 ? QJ_NOCLIP : QJ_SPEC;
    const drawDb = () => {
      if (!db) return;
      g.save();
      g.setTransform(world);
      drawDumbbell(g, db.p[0], db.p[1], db.r, BIG, 3, db.sx);
      // 铁链：没开锁时拴在脚踝上；开锁以后从脚踝上滑下去，挂在哑铃上一起掉
      const e = dbEnd(db);
      const a = qjAnkle(tt);
      const off = fade(tt, T.open + 0.02, T.drop);
      const tail: V2 = [e[0] + (a[0] - e[0]) * (1 - off) - 30 * off, e[1] + (a[1] - e[1]) * (1 - off) + 120 * off];
      drawChain(g, [e, [(e[0] + tail[0]) / 2 + 20, (e[1] + tail[1]) / 2 + 30], tail], 22, 2.6);
      drawPadlock(g, tail[0] + 4, tail[1] + 22, 0.3 + off * 1.2, tt >= T.open ? 1 : 0, 0.9, 2.6);
      g.restore();
    };
    const holdClip = tt >= T.clip && tt < T.drop ? { R: hairclipHold } : undefined;
    const late2: (() => void)[] = [];
    const qjBrick = tt >= rt(T.take) ? { L: brickHold(() => E.out(ph(t, T.take - 0.02, T.take + 0.45)), brickPos, late2) } : undefined;
    const qjDraw = () => {
      const held = db && tt < T.drop;
      drawPerson(g, spec, qp, qr[0], qr[1], z, { hold: holdClip ?? qjBrick, beforeFrontArms: held ? drawDb : undefined });
      if (db && tt >= T.drop) drawDb();
    };
    // 她（白天）
    const showChen = tt >= T.roof - 0.01;
    const cr = chenRoot(t);
    const cp = chenPose(t);
    const hasBrick = tt >= 32.9 && tt < rt(T.take);
    const chenDraw = (front?: () => void) => {
      g.save();
      g.translate(cr[0], cr[1]);
      drawChengtuo(g, cp, { line: 1 / Math.sqrt(z), hold: hasBrick ? { L: brickHold(() => 0, brickPos, late2) } : undefined, beforeFrontArms: front });
      g.restore();
    };
    if (tt >= T.land) {
      groundShadow(g, cr[0] - 10, 140, 0.28, NEIGHBOR_ROOF + 6);
      groundShadow(g, qr[0] + 40, 150, 0.24, NEIGHBOR_ROOF + 6);
    } else if (showChen && tt < T.leap) groundShadow(g, cr[0] + 10, 120, 0.28, TOWER_ROOF + 6);
    if (!showChen) qjDraw();
    else if (tt < T.hug) {
      qjDraw();
      chenDraw();
    } else {
      // 抱在一起：她在后面，千斤在前面；她圈在千斤背上的那只手臂（近处那只）再画一遍压在千斤身上
      chenDraw();
      qjDraw();
      if (tt < T.land + 0.5) {
        const j = jointsOf(cp);
        const P = (v: V2): V2 => [cr[0] + v[0], cr[1] + v[1]];
        const a = P([j.shoulderL[0] + 0.8 * (j.elbowL[0] - j.shoulderL[0]), j.shoulderL[1] + 0.8 * (j.elbowL[1] - j.shoulderL[1])]);
        const b = P(j.elbowL);
        const c = P(j.wristL);
        const d = P(j.palmL);
        const arm = new Path2D();
        for (const [u, v] of [
          [a, b],
          [b, c],
          [c, d],
        ] as [V2, V2][]) {
          const dx = v[0] - u[0];
          const dy = v[1] - u[1];
          const L = Math.hypot(dx, dy) || 1;
          const nx = (-dy / L) * 34;
          const ny = (dx / L) * 34;
          arm.moveTo(u[0] + nx, u[1] + ny);
          arm.lineTo(v[0] + nx, v[1] + ny);
          arm.lineTo(v[0] - nx, v[1] - ny);
          arm.lineTo(u[0] - nx, u[1] - ny);
          arm.closePath();
        }
        arm.moveTo(d[0] + 46, d[1]);
        arm.arc(d[0], d[1], 46, 0, Math.PI * 2);
        g.save();
        g.clip(arm, "nonzero");
        chenDraw();
        g.restore();
      }
    }
    for (const f of late2) f();
  };

  /** 夜里的屋子 */
  const drawNight = (g: CanvasRenderingContext2D, t: number) => {
    const cam = camOf(t, "night");
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#1c1a2c";
    g.fillRect(0, 0, width, height);
    applyCam(g, base, cam, 1, [0, 0]);
    const z = cam.z;
    drawRoomBack(g, t);
    const n = nightAt(t);
    const inBed = fade(t, T.bed - 0.05, T.bed + 0.25);
    drawCeilingBed(g, t, null);
    drawFloorRing(g);
    const n0 = nightAt(t);
    {
      // 脚绳：地上的铁环 → 顺着地板（在那排砖后面）→ 她的脚踝；飘起来以后从地上拉起来，绷直
      const j0 = jointsOf(n0.pose);
      const ank: V2 = [n0.x + j0.ankleL[0], n0.y + j0.ankleL[1]];
      const lift = clamp01(-n0.y / 300);
      const mid: V2 = [ank[0] + 50 + (RING_AT[0] - ank[0] - 50) * 0.5 * lift, -6 + (ank[1] + RING_AT[1]) * 0.5 * lift];
      drawThread(g, RING_AT, mid, 4 * (1 - lift), 3);
      drawThread(g, mid, ank, 6 * (1 - lift), 3);
    }
    drawBrickRows(g);
    drawDesk(g, t);
    // 桌上她正在写的那一块（立着，正面朝镜头），写到哪了：「两块五的签字笔」唱完（33.42）正好写完
    const reveal = clamp01((t - T.night - 0.15) / 1.25);
    if (t < 33.9) drawStandingBrick(g, DESK_BRICK[0], DESK_BRICK[1], "活下去", 1, reveal, 2.4);
    // 脱下来的靴子：第一只（38.0 之前就脱了）落在椅子左边，第二只 38.5 落地
    if (t >= T.night2 - 0.02) {
      const d1 = Math.max(0, 1 - (t - (T.night2 - 0.02)) / 0.12);
      drawLooseBoot(g, LOOSE_BOOT[0], -60 * d1 * d1, 0.12 * d1, false, 3);
    }
    if (t >= T.boot2) {
      const d2 = Math.max(0, 1 - (t - T.boot2) / 0.12);
      drawLooseBoot(g, ROOM.boots[1], -70 * d2 * d2, -0.1 * d2, false, 3);
    }
    const j = jointsOf(n.pose);
    // 她
    const hold = t >= 33.9 && t < 35.95 ? { L: nightBrickHold(t) } : undefined;
    g.save();
    g.translate(n.x, n.y);
    drawFigure(g, n.pose, NIGHT_LOOK, { line: 1 / Math.sqrt(z), hold });
    g.restore();
    // 两块五的签字笔：从拿笔的手里斜着伸出去，笔尖落在砖上
    if (t < 33.9) drawPen(g, [n.x + j.palmL[0], n.y + j.palmL[1]], penAt(t));
    if (inBed > 0) {
      g.save();
      g.globalAlpha = inBed;
      drawBlanket(g, inBed);
      g.restore();
    }
    drawLampLight(g, 1);
    drawGrade(g, base, grain, 0.95, 0.24);
  };
  /** 签字笔：透明的笔杆、蓝色的笔帽套在笔尾；从手心那一点画到笔尖 */
  const drawPen = (g: CanvasRenderingContext2D, hand: V2, tip: V2) => {
    const dx = tip[0] - hand[0];
    const dy = tip[1] - hand[1];
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L;
    const uy = dy / L;
    const end: V2 = [hand[0] - ux * 26, hand[1] - uy * 26];
    const cap: V2 = [hand[0] - ux * 6, hand[1] - uy * 6];
    g.save();
    g.lineCap = "round";
    g.strokeStyle = "#2e2530";
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(end[0], end[1]);
    g.lineTo(tip[0], tip[1]);
    g.stroke();
    g.strokeStyle = "#eef2f5";
    g.lineWidth = 4.2;
    g.stroke();
    g.strokeStyle = "#5d7fc4";
    g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(cap[0], cap[1]);
    g.lineTo(tip[0] - ux * 3, tip[1] - uy * 3);
    g.stroke();
    g.strokeStyle = "#2e2530";
    g.lineWidth = 8;
    g.beginPath();
    g.moveTo(end[0], end[1]);
    g.lineTo(cap[0], cap[1]);
    g.stroke();
    g.strokeStyle = "#3f6fc6";
    g.lineWidth = 5;
    g.stroke();
    g.restore();
  };
  /** 她手里刚写好的砖（拿起来看、塞进靴筒）：托着，字朝着镜头 */
  const nightBrickHold =
    (_t: number): HoldFn =>
    (c, hand, _mir, info) => {
      if (info.layer !== "front") return;
      const f = hand.child(-9.5 * info.sx, 30, (-Math.PI / 2) * info.sx);
      const m = c.getTransform();
      const o = m.transformPoint(new DOMPoint(f.x, f.y));
      const k = Math.hypot(m.a, m.b);
      c.save();
      c.setTransform(k, 0, 0, k, o.x, o.y);
      drawStandingBrick(c, 0, 0, "活下去", 1, 1, 2.4);
      c.restore();
    };

  return {
    canvas,
    render(t) {
      const phase = phaseOf(t);
      if (phase === "night") {
        drawNight(ctx, t);
        return;
      }
      if (phase === "home" && t < T.disEnd) {
        // 匹配溶解：店门口那一镜还画着，盖在门口这一镜上面越来越淡
        drawDay(ctx, t, "home");
        drawDay(bctx, t, "shop");
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1 - E.soft(ph(t, T.dis, T.disEnd));
        ctx.drawImage(buf, 0, 0);
        ctx.globalAlpha = 1;
        return;
      }
      drawDay(ctx, t, phase);
    },
    dispose() {
      canvas.width = canvas.height = 1;
      buf.width = buf.height = 1;
    },
  };
}
