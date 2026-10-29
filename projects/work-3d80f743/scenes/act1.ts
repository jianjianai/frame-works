// 第一幕「最沉的人」（0–16 秒，就是前奏的 8 小节：介绍这个世界和主角），暖光老城区。
// 每段先定情绪，再定镜头（经验库「情绪运镜」）。镜头的快慢跟着剧情走：急、险、动作的时候快、干脆，情绪的时候慢、停得住，有起伏。
//   ① 0–0.5 屏息（唯美）：光里的女人张着手、闭着眼笑，眼泪往上飘，白的边一点点压下来；镜头几乎不动，只往里凑 3%。
//   ② 0.5 一震：她碰到白，从头到脚散成发亮的灰，彩色光环炸开、一闪，镜头被光猛地推开（0.4 秒）、歪着的画面回正；
//      灰往下落，镜头跟着慢慢落，1.2 秒起越来越快地往下甩（0.3 秒）。
//   ③ 1.5 绝望（紧张）：甩到街上落在周磊身上（0.25 秒落定），镜头跟着他往上飘；他闭上眼，手指松开，公文包滑到指尖。
//      对面人行道上的路人低着头走过去，没有人抬头。
//   ④ 2.5 急（主角登场）：卡拍切到贴地狂奔的铁靴，跟着跑抬起来露出整个人；镜头和她一样快。
//   ⑤ 3.7 险：她刹住、抬头，镜头接过去盯住掉下来的公文包，越落越快地推近，砸在靴尖跟前猛地停住、往前顶、震。
//   ⑥ 4.2 决心 → 爆发：镜头一口气退到她身上（0.3 秒），她抬头盯住他、蹲下攒劲（镜头停住、往里凑一点）；
//      蹬地那一下镜头跟着她往上冲，把头顶的他一起框进来；空中攥住脚踝，一口气拽回地面，落地一沉、一震。
//   ⑦ 5.6 心疼：她跪下，镜头很慢地凑近两个人；她从靴筒里掏出砖，递过去。
//   ⑧ 7.0 暖：砖落进他手里亮起来，镜头一下推上去（0.4 秒）、之后几乎不动；暖光涌上来、暗角松开；他捧着砖哭。
//      8.0 鼓进来：他抬头冲她哭着笑，镜头一顶。
//   ⑨ 8.1 轻快：她站起来往前走（一步一拍），镜头退开、跟着她，她在画面右边三分之一；从他身后经过时低头冲他笑。
//      抬头看见窗里的老钟，镜头顺着视线挤到两个人中间；小石头从左边跑过来，镜头往左接他，她边走边摸他的头，不停。
//   ⑩ 12.5 余韵 → 震撼：镜头从街上升起来，先慢、越升越快，穿过楼和电线，满天往上飘的人（每人一团暖光，像灯）一层层露出来，
//      14.0 停在整座城上：白在顶上，最高那栋楼差一点碰到它，她小得只剩一点；一拍一个人被白吸进去，炸开彩色的光，灰像雪一样落下来。
// 场景：暖光老城区（lib/world.ts），道具和老钟家（lib/props.ts）；姿势在 lib/poses.ts（不用素材库的动作预设）。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { beatAt } from "@frame/engine/tempo";
import { seeded } from "@frame/engine/math";
import { CAST, type CastSpec, castJoints, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import { type Angles, type HoldFn, type MoveKey, type PoseIn, CHENGTUO, drawChengtuo, drawFigure, figureJoints, figurePose, jointsOf, swapSides } from "@materials/剪纸角色/code/chengtuo";
import { type Cam, E, H, W, aim, applyCam, camLerp, clamp01, kick, ph, shake, toScreen, viewOf } from "../lib/cam";
import {
  type Block,
  QJ_HOME,
  STREET,
  TOWER,
  Y_WHITE,
  drawBlock,
  drawBlockGlow,
  drawAshFall,
  drawBurst,
  drawCity,
  drawGlow,
  drawGrade,
  drawMotes,
  drawSilhouette,
  drawSky,
  drawStreet,
  drawSunbeams,
  drawAfterglow,
  drawRays,
  drawWhite,
  makeGrain,
  prepareCity,
  whiteEdge,
} from "../lib/world";
import {
  CASE,
  type FgKind,
  type House,
  TOWER_ROOF,
  brickCenter,
  brickHold,
  cupHold,
  drawBriefcase,
  drawForegroundItem,
  drawHouse,
  drawHouseWindowFront,
  drawRoof,
  groundShadow,
} from "../lib/props";
import { type Note, drawNote, loadHandFont } from "../lib/note";
import { BIG_R, SHOP_SPAN, SHOP_T, drawDumbbell, drawShopShade, drawShopSpill, makeShop, shopCam, shopLook } from "../lib/shop";
import { drawDent } from "../lib/dent";
import { type Walker, drawPerson, walkerAt } from "../lib/people";
import { type Num, ARMS, LIMP, SMOOTH, fade, hitch, live, ring, smoothTrack, withDrag } from "../lib/motion";
import { CHEN, KID, WAVE_R, ZHONG, ZHOU as ZP, armL, armR, legL, legR } from "../lib/poses";
import { WOMAN_LOOK, WOMAN_SCALE } from "../lib/woman";

const ZHOU = CAST.周磊;
const STONE = CAST.小石头;
const OLD = CAST.老钟;
/**
 * 2026-10-24 用户：「让打工人左手拿公文包，右手拿杠铃，让杠铃掉下来，这样才显得惊险。掉下来是地面被砸裂，屏幕剧烈放大」：
 * 他近处的手（L，画面左边）拎着一只大铁哑铃，远处的手（R）拎着公文包（2026-10-24 用户：「拿公文包的手和拿杠铃的手要互换一下」）（哑铃店里那只的画法，缩小，两头厚铁饼）——买来压住自己的；
 * 掉下来、砸裂街面的是哑铃。公文包一直拎着，被她拽回地面那一下才脱手掉在身边。
 */
const BELL_S = 0.6;
/** 哑铃最大那片铁饼的半径：落地时中心离地面这么高 */
const BELL_R = BIG_R * BELL_S;
/** 哑铃的轴转多少（0 横着看侧面，越大铁饼越朝镜头） */
const BELL_PHI = 0.32;
/** 哑铃往下掉的加速度（世界单位 / 秒²；人 590 高 ≈ 1.7 米）。比真实重力大一倍：掉得快、砸得狠 */
const G = 6800;
/** 她跑过来刹住、停稳的位置（根）；哑铃落在她靴尖前面 */
const X_STOP = 330;
/** 哑铃落在她靴尖前面一点（靴尖在根前面约 185） */
const X_LAND = X_STOP - 185 - CASE.w / 2;
/** 她越过公文包跃起、落地，一共往左挪多少 */
const LEAP = 600;
/** 光里的女人 */
const WX = 200;
/** 风：往画面右边吹（她朝左，头发、围巾往后飘，不糊在脸上），天上大一点 */
const WIND = 0.85;
const WIND_SKY = 1.1;
/** 老钟的窗放在她举手打招呼时前面（左边）多远 */
const WIN_AHEAD = 560;

type V2 = [number, number];

function timeline() {
  const b = beatAt;
  return {
    /** 光里的女人碰到白 */
    burn: b(1),
    /** 镜头越来越快地往下甩 */
    whip: b(2) + 0.2,
    /** 切到街上（他） */
    cut: b(3),
    /** 切到她：跟着她跑 */
    her: b(5),
    /** 「赶不赶得上」（2026-10-24，情绪：险）：她边跑边抬头，镜头顺着她的视线摇到半空的他（slip0 起摇），停在他手上，提手一点点从指尖滑下去 →
     *  手一松，镜头跟着公文包往下坠、越落越快越近 → 砸地（slam，拍上）一声重响、猛停、震 → 她正好冲到公文包旁边刹住 → 镜头自然转到她身上。
     *  交叉剪辑被否（「画面切换太快了」「采用一个运镜的方式，不是切」）；摇回她身上也被否（「改成不切到主角，改成镜头跟着公文包下落」） */
    slip0: b(6.2),
    /** 公文包砸地。2026-10-24 砖亮起来挪到第 5 小节（8.013）：她跑过来的距离拉长、多跑 1 秒（用户：「应该改她跑过来的镜头，把距离拉长让她多跑一会」），
     *  砸地、起跳、抓住、落地、掏砖都整体晚 1 秒，动作之间的节奏和原来一样（中间加停顿看着像犹豫） */
    slam: b(9),
    /** 他松手（按重力反推，下面算） */
    drop: 3.4,
    /** 蹬地（脚离开地面） */
    launch: b(11) + 0.08,
    /** 空中攥住他的脚踝（跳到最高） */
    grab: b(12),
    /** 两个人一起落地 */
    land: b(13),
    /** 跪着喘口气、心疼地看他 → 一口气掏砖、递过去，前奏第二段（第 5 小节，整套鼓进来）落进他手里亮起来 */
    pull: b(14.5) + 0.05,
    take: b(16),
    /** 鼓进来（第 5 小节）= 砖亮起来 */
    drum: b(16),
    /** 他抬头冲她哭着笑，她也笑了、站起来 */
    smile: b(18),
    /** 往前走：第一步落地，一步一拍 */
    walk0: b(19),
    /** 老钟举杯、她挥手 */
    zhong: b(21),
    kidStop: b(24),
    pat: b(24) + 0.3,
    /** 镜头升起来 */
    r0: b(25),
    /** 停在整座城上 */
    wide: b(28),
    end: b(32),
    beat: (k: number) => b(k),
  };
}

// ——— 光里的女人（外观在 lib/woman.ts）：远处的手伸向头顶的光，近处的手往后舒展开，一条腿往后弯（像在水里跳舞），
// 仰着头、闭着眼笑，眼泪从眼角往上飘。失重 0.3：头发（借主角那套）顺着风漂开
const WOMAN_POSE: Angles = {
  face: -0.35,
  float: 0.3,
  ground: false,
  neck: 26,
  lean: -6,
  rot: -2,
  shoulderL: -96,
  elbowL: -20,
  wristL: -16,
  handL: "open",
  shoulderR: 158,
  elbowR: 14,
  wristR: 10,
  handR: "open",
  ...legL(-4, -62, -64),
  ...legR(10, -16, -66),
  expression: "哭着笑",
  blink: 1,
  // 脸上不画泪（闭着眼、3/4 侧脸时，库里远处那只眼的泪珠画到脸外面的头发上，成了一个灰点）：眼泪从眼角飘起来，见下面
  tears: 0,
};
const FLOAT_POSE: Angles = {
  face: -0.2,
  float: 0.2,
  ground: false,
  neck: 18,
  rot: 8,
  shoulderL: -110,
  elbowL: -20,
  handL: "open",
  shoulderR: 104,
  elbowR: 22,
  handR: "open",
  ...legL(-6, -30, -60),
  ...legR(6, -40, -60),
  expression: "闭眼",
  sad: 0.7,
};

/** 近景（离镜头比人更近的一层，D = 0.62）：镜头一动它们划得比人快。矮的只在画面底边露一截，高的路灯杆只在跟着跑时一闪而过 */
const FG_D = 0.62;
const FOREGROUND: { x: number; kind: FgKind }[] = [
  // 2026-10-24 她多跑了 1 秒、3.1 起镜头往上摇：路灯杆挪到她 2.75 秒左右（还在平着跟跑时）经过的地方，原来 880 正好落在往上摇的那段，一根清楚的光杆竖在画面正中
  { x: 2550, kind: "lamp" },
  { x: 1500, kind: "bollard" },
  { x: -1520, kind: "planter" },
  { x: -1950, kind: "bike" },
];

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
  // 跟着她跑时背景的横向拖影（人物、公文包画在拖影后面，保持清楚）
  const hbuf = document.createElement("canvas");
  hbuf.width = width;
  hbuf.height = height;
  const hctx = hbuf.getContext("2d")!;
  const base = new DOMMatrix([width / W, 0, 0, height / H, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  const T = timeline();
  // 第二幕第一镜的店和人：16.0 以后镜头扎下去落在店门口，落定以后第二幕接着画（同一套，lib/shop.ts）
  const shop = makeShop();

  // 同一时刻的姿势会被镜头、画面、拖影反复用到：按时间记住最近的结果（返回的东西不要改）
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

  // ——————————— 她 ———————————
  // 跑过来（一步 0.26 秒），最后一步 R 在公文包砸地前 0.4 秒落地、铁靴往前滑 0.2 秒刹住——公文包掉下来时她已经停住了。
  // 跑的根按 dx 匀速走（有腾空）；姿势表里站着那只脚的位置是按这个速度反算的，脚不滑
  const RUN_STEP = 0.26;
  const RUN_V = 1200;
  // 哑铃先砸地，她紧跟着冲到它旁边刹住
  const T_BRAKE = T.slam + 0.12;
  const RUN: [number, Angles, number][] = [
    [0, CHEN.跑_落地, 0.03],
    [0.19, CHEN.跑_踩实, 0.05],
    [0.38, CHEN.跑_蹬地, 0],
    [0.68, CHEN.跑_腾空, -0.02],
  ];
  // 画外的脚步从第一幕切到他之前就有（先听见再看见）
  const RUN_K0 = 1;
  const RUN_K1 = 15;
  const runKeys: MoveKey[] = [];
  for (let k = RUN_K0; k <= RUN_K1; k++) {
    const foot = k % 2 === 0 ? "L" : "R";
    for (const [at, p, squash] of RUN) {
      if (k === RUN_K1 && at > 0) break;
      const t = T_BRAKE - (RUN_K1 - k - at) * RUN_STEP;
      const last = runKeys[runKeys.length - 1];
      // 边跑边抬头盯着前上方的他（镜头顺着这道视线摇上去）
      const up = t >= T.slip0 - 0.15 ? { neck: ((p.neck as number) ?? 0) + 16, lookY: -0.9 } : {};
      runKeys.push({ t, ease: SMOOTH, squash, dx: last ? -RUN_V * (t - last.t) : undefined, p: { ...(foot === "L" ? p : swapSides(p)), ...up } });
    }
  }
  const SKID = 0.2;

  // 走（一步一拍，铁靴「咚」）：第 k 步 L / R 交替落地；站着的那只脚钉在地上
  const WALK_STEP = 0.5;
  const WALK: [number, Angles, number][] = [
    [0, CHEN.走_落地, 0.03],
    [0.2, CHEN.走_下沉, 0.05],
    [0.48, CHEN.走_经过, 0],
    [0.74, CHEN.走_蹬地, 0],
  ];
  const STEPS = 16;
  const walkKeys: MoveKey[] = [];
  for (let k = 0; k <= STEPS; k++) {
    const foot = k % 2 === 0 ? "L" : "R";
    const prev = k % 2 === 0 ? "R" : "L";
    const sw = (p: Angles) => (foot === "L" ? p : swapSides(p));
    for (const [at, p, squash] of WALK) {
      if (k === STEPS && at > 0) break;
      const t = T.walk0 + (k + at) * WALK_STEP;
      // 从他身后经过：头是正的、眼睛看着前面笑（用户 2026-10-19：「开始往前走的时候，不要低头」「眼睛看向前面就行」）；看见窗里的老钟：先抬头（镜头顺着她的视线过去），再把远处的手举起来挥一挥；
      // 小石头跑到跟前：边走边弯一点腰，近处的手掌心朝下在他头顶揉两下，脚步不停
      const wave = fade(t, T.zhong + 0.02, T.zhong + 0.25) * (1 - fade(t, T.zhong + 0.95, T.zhong + 1.25));
      const passing = t < T.walk0 + 1.2;
      const seeZhong = t >= T.zhong - 0.45 && t < T.zhong + 0.02;
      const pat = t >= T.pat - 0.3 && t < T.pat + 0.5;
      // 摸头时近处的手由 IK 放到他头顶（patAt）；远处的手往后收在胯后面、只小小地摆（弯着腰时垂下来正好挨着他的耳朵，像两只手捧着他的头）。
      // 手落下时弯腰到 28°，边揉边直起身：肩膀往后让，抵掉往前走的那一段，胳膊一直是伸着的，不折起来
      const farSwing = ((sw(p).shoulderR as number) - (p.lean as number)) * 0.3 - 26;
      // 小石头照参考图改成头大腿短、高到她胸口（用户 2026-10-28）：原来按矮小孩弯到 28°，肩膀比他头顶还低，胳膊从下往上斜着过去、
      // 揉的时候前臂横在他脸前面。现在只弯到 10°（肩膀高过他的头），边揉边直起身、往后仰一点到 −12°：肩膀往后让的和原来一样多，抵掉往前走的那一段
      const bow = t < T.pat + 0.12 ? 4 + 6 * clamp01((t - T.pat + 0.3) / 0.42) : 10 - 22 * clamp01((t - T.pat - 0.12) / 0.3);
      const extra: Angles = pat
        ? { lean: bow, ...armL(50 + (k % 2 ? -8 : 6), 26, -26, "flat", bow), ...armR(farSwing, 14, 0, "relax", bow), neck: -14, expression: "微笑", squint: 0.4, lookX: -0.4, lookY: 0.9 }
        : wave > 0.5
          ? { ...WAVE_R, shoulderR: (WAVE_R.shoulderR as number) + (k % 2 ? -14 : 14), neck: 18, expression: "笑", lookX: -0.7, lookY: -0.7 }
          : passing
            ? { neck: 4, expression: "微笑", lookX: -0.5, lookY: 0 }
            : seeZhong
              ? { neck: 14, expression: "微笑", lookX: -0.7, lookY: -0.6 }
              : {};
      walkKeys.push({ t, ease: SMOOTH, squash, plant: at === 0 ? prev : foot, p: { ...sw(p), ...extra } });
    }
  }
  const chenKeys: MoveKey[] = [
    ...runKeys,
    // 哑铃刚砸进前面的街面：她冲到它旁边，前脚 R 扎在地上往前滑着刹住，手被甩在身前，低头看一眼砸裂的地。
    // 跑的姿势不自动着地（ground: false）：刹住起换回自动着地，不然后面的姿势全都悬在地面上
    { t: T_BRAKE + SKID, ease: "out", squash: 0.08, dx: (-RUN_V * SKID) / 3, p: { ...CHEN.刹, ground: true, lift: 0, neck: -12, expression: "吓一跳", lookX: -0.3, lookY: 0.8 } },
    // 抬头盯住头顶的他（下定决心）→ 蹲下攒劲（拉满的弓）→ 蹬地弹出去，越过公文包斜着跃起来，最高处攥住他的脚踝 → 一口气带着他落下来
    { t: T_BRAKE + SKID + 0.28, ease: "out", plant: "R", squash: 0, p: CHEN.仰头 },
    { t: T.launch - 0.06, ease: "inOut", plant: "R", squash: 0.1, p: CHEN.蹲 },
    { t: T.launch + 0.06, ease: "in", squash: -0.1, dx: -90, p: CHEN.起跳 },
    { t: T.grab, ease: "out", squash: -0.02, dx: -LEAP * 0.36, p: CHEN.抓住 },
    { t: T.land, ease: "in", squash: -0.03, dx: -(LEAP - 90 - LEAP * 0.36), p: { ...CHEN.拽着坠, lift: 0, ...armR(30, 10, 4, "grip", CHEN.拽着坠.lean as number) } },
    // 落地直接单膝跪下：后脚 L 落地扎住、跪下去，前脚 R 顺着往前冲的势头迈出去，身子往前一压吃住分量；把他摔到地上的那一下就松手
    { t: T.land + 0.16, ease: "out", squash: 0.12, plant: "L", p: { ...CHEN.跪_缓冲, handR: "open" } },
    { t: T.land + 0.4, ease: "inOut", squash: 0, plant: "L", p: CHEN.单膝跪 },
    // 心疼地看他一眼 → 弯腰、手伸进身前那只靴筒 → 直起身把砖提到肚子前面（很沉）→ 身子往前倾、胳膊伸出去递到他手的正上方 →
    // 再往下一送，放到他搭在膝盖上的手里（他不伸手接）
    // （用户 2026-10-19：「手从里面拿，之后向前递出去，递出去的时候身体也要向前倾斜」「打工人的手就放在腿旁边，不做去接的动作……让主角递到手里」）
    { t: T.pull - 0.24, ease: "inOut", plant: "R", p: CHEN.跪_掏砖 },
    { t: T.pull - 0.08, ease: "inOut", plant: "R", p: { ...CHEN.跪_掏砖, neck: -14 } },
    { t: T.pull + 0.07, ease: "out", plant: "R", p: CHEN.跪_抽出 },
    { t: T.pull + 0.37, ease: "inOut", plant: "R", p: CHEN.跪_递 },
    { t: T.take - 0.03, ease: "inOut", plant: "R", p: CHEN.跪_放 },
    // 放下了：手一松开就垂下来，身子收回来一点，看着他；之后两只手一直自然垂着，不再做别的动作（用户 2026-10-19）
    { t: T.take + 0.2, ease: "out", plant: "R", p: { ...CHEN.跪_放, lean: 26, ...armL(12, 16, 6, "relax", 26), ...armR(0, 14, 0, "relax", 26), neck: -8 } },
    { t: T.take + 0.6, ease: "inOut", plant: "R", p: CHEN.跪_看他 },
    // 鼓进来、他抬头冲她哭着笑：她也笑了，边笑边站起来，直接迈出第一步（后脚 L）。起身 → 快站直 → 后脚往前收 → 第一步落地，
    // 一段 0.1–0.18 秒（原来起身和迈步的姿势之间只隔 0.04 秒，一下子从弯着腰跳到站直，用户：「这里跳帧了」）
    { t: T.smile + 0.02, ease: "out", plant: "R", p: { ...CHEN.跪_看他, expression: "微笑", lookX: -0.4, lookY: 0.4, neck: -2 } },
    { t: T.smile + 0.2, ease: "inOut", plant: "R", p: CHEN.起身 },
    { t: T.smile + 0.31, ease: "inOut", plant: "R", p: CHEN.起身_直 },
    { t: T.walk0 - 0.1, ease: "inOut", plant: "R", p: { ...swapSides(CHEN.走_经过), expression: "微笑", neck: 2, lookX: -0.5, lookY: 0 } },
    ...walkKeys,
  ];
  const chenMove = live(chenKeys, {
    look: CHENGTUO,
    // 围巾垂下来那头全程压在手臂上面、不被手臂挡（用户 2026-10-19：「改成全程不被手臂档就行」）：两只手臂一律 chest: under
    base: { wind: WIND, chestL: "under", chestR: "under" },
    idle: true,
    seed: 3,
    springs: ARMS,
    // 站着的时候重心很慢地晃，手也不是钉死的
    add: (t, o) => {
      const s = Math.sin(t * 0.9 + 1.3);
      o.lean += 0.9 * s;
      o.neck -= 0.7 * s;
      o.shoulderL += 1.5 * Math.sin(t * 1.15);
      o.shoulderR -= 1.5 * Math.sin(t * 1.05 + 0.7);
      // 跪着喘口气：肩膀随呼吸起伏
      const pant = fade(t, T.land + 0.2, T.land + 0.4) * (1 - fade(t, T.pull - 0.4, T.pull - 0.2));
      if (pant > 0) {
        const h = Math.sin(t * 9) * pant;
        o.lean += 2.2 * h;
        o.neck -= 1.6 * h;
      }
    },
  });
  // 刹住停稳那一刻正好在 X_STOP
  const xRest = chenMove(T_BRAKE + SKID).x;
  // 跳得比姿势参数能抬的（lift 最多 600）再高 100：根整个往上挪，和 lift 同样的快慢（上升 cubic out、下落 cubic in）
  const JUMP_EXTRA = 100;
  const jumpExtra = (t: number) => {
    const t0 = T.launch + 0.06;
    if (t <= t0 || t >= T.land) return 0;
    if (t < T.grab) return JUMP_EXTRA * E.out(ph(t, t0, T.grab));
    return JUMP_EXTRA * (1 - ph(t, T.grab, T.land) ** 3);
  };
  const chenAt = memoT((t: number) => {
    const f = chenMove(t);
    return { pose: f.pose, x: X_STOP + (f.x - xRest), y: -jumpExtra(t) };
  });
  const chenPalm = (t: number, side: "L" | "R"): V2 => {
    const c = chenAt(t);
    const j = jointsOf(c.pose);
    const p = side === "L" ? j.palmL : j.palmR;
    return [c.x + p[0], c.y + p[1]];
  };

  // ——————————— 周磊 ———————————
  // 拎着公文包往上飘（一直朝右，朝着她来的方向），人不动 → 手指一松，公文包自己滑下去 → 没了分量，手慢慢浮起来、闭着眼往上飘 →
  // 被抓住脚踝一惊 → 被一口气拽下来、屁股砸在地上 → 缩着低头哭，手软软地搭在膝盖上（不伸、不接）→ 她把砖放进他手里 →
  // 砖很沉，手一下坠下去，他一惊、睁眼看手里 → 两只手捧着低头哭 →
  // 鼓进来那一拍抬起头冲她哭着笑 → 她走了，把砖抱在怀里
  // 两只手都拎着东西：近处 L 拎哑铃，远处 R 拎公文包（手臂被坠得笔直）
  const TWO = (lean: number) => ({ ...armL(4, 4, -4, "grip", lean), ...armR(8, 6, -4, "grip", lean) });
  const zKeys = (drop: number): MoveKey[] => [
    { t: 0, p: { ...ZP.拎着飘, ...TWO(10) } },
    { t: T.cut + 0.4, p: { ...ZP.拎着飘, ...TWO(10), neck: -34 } },
    { t: T.her - 0.6, ease: "inOut", p: { ...ZP.拎着飘, ...TWO(10), neck: -32, expression: "忍着哭" } },
    { t: T.her - 0.12, ease: "inOut", p: { ...ZP.拎着飘, ...TWO(10), neck: -28, expression: "闭眼", sad: 0.9 } },
    // 镜头停在他手上：闭着眼，头越垂越低，拎哑铃的手指一根根松开
    { t: drop - 0.12, ease: "inOut", p: { ...ZP.拎着飘, ...TWO(10), neck: -38, expression: "闭眼", sad: 1, tears: 0.6, handL: "relax" } },
    { t: drop - 0.05, ease: "inOut", p: { ...ZP.松手, ...armR(8, 6, -4, "grip", 10) } },
    { t: drop + 0.2, ease: "out", p: { ...ZP.松手, ...armR(8, 6, -4, "grip", 10) } },
    // 没了哑铃的分量，往上飘：近处的手软软浮起来，远处的手还拎着公文包
    { t: drop + 1.2, ease: "inOut", p: { ...ZP.飘, ...armR(26, 24, 0, "grip", -4) } },
    { t: T.grab - 0.15, p: { ...ZP.飘, ...armR(26, 24, 0, "grip", -4) } },
    { t: T.grab + 0.12, ease: "out", p: { ...ZP.一惊, ...armR(40, 30, 0, "grip", 4) } },
    { t: T.grab + 0.34, ease: "inOut", p: { ...ZP.被拽, ...armR(70, 30, 0, "grip", -6) } },
    { t: T.land - 0.15, ease: "inOut", p: { ...ZP.被拽, ...armR(70, 30, 0, "grip", -6) } },
    { t: T.land + 0.03, ease: "in", squash: 0.08, p: ZP.坐下 },
    { t: T.land + 0.5, ease: "out", squash: 0, p: ZP.瘫坐 },
    // 手一直搭在膝盖上不动；砖落到手上那一刻手指才张开托住（手不往上迎）
    { t: T.take - 0.06, p: ZP.瘫坐 },
    { t: T.take, ease: "linear", p: { ...ZP.瘫坐, handL: "flat" } },
    // 砖很沉：手在原地往下一坠、弹回来一点、再往下一点、稳住（上下动一下，不往前伸，用户 2026-10-19：
    // 「打工人接到之后手不要向前伸出去，保持当前的y轴位置，上下动一下，因为重量沉」）；远处的手过来一起托着
    { t: T.take + 0.1, ease: "out", squash: 0.025, p: ZP.坐_一沉 },
    { t: T.take + 0.26, ease: "inOut", squash: 0, p: { ...ZP.坐_托稳, ...armL(35, 63, 0, "flat", 2) } },
    { t: T.take + 0.42, ease: "inOut", p: { ...ZP.坐_托稳, ...armL(35, 57, 0, "flat", 2) } },
    { t: T.take + 0.6, ease: "inOut", p: ZP.坐_托稳 },
    { t: T.take + 0.72, ease: "inOut", p: ZP.坐_捧着哭 },
    { t: T.smile - 0.12, ease: "inOut", p: { ...ZP.坐_捧着哭, neck: -16 } },
    { t: T.smile + 0.14, ease: "out", p: ZP.坐_哭着笑 },
    { t: T.walk0 + 0.9, ease: "inOut", p: { ...ZP.坐_哭着笑, neck: 20, lookY: -0.6 } },
    { t: T.walk0 + 1.8, ease: "inOut", p: ZP.坐_抱砖 },
  ];
  // 叠在关键帧上的连续动作
  const zAdd = (t: number, o: Num) => {
    // 飘着：四肢、身子像在水里一样慢慢摆（坐到地上就停）
    const a = 1 - fade(t, T.land - 0.3, T.land);
    if (a > 0) {
      const s = (f: number, p: number) => a * Math.sin(t * f + p);
      o.hipL += 6 * s(1.3, 0);
      o.kneeL -= 4 * (a + s(1.1, 1));
      o.hipR += 6 * s(1.2, 2.1);
      o.kneeR -= 4.5 * (a + s(0.95, 0.4));
      o.ankleL += 5 * s(1.7, 0.5);
      o.ankleR += 5 * s(1.5, 1.9);
      o.rot += 3 * s(0.8, 0.3);
      o.lean += 2 * s(0.7, 1);
      o.neck += 2.5 * s(0.9, 2);
      o.shoulderL += 4 * s(1.1, 0.3);
      o.shoulderR += 4 * s(1.0, 2.4);
      o.elbowL += 6 * s(1.3, 1.2);
      o.elbowR += 6 * s(1.2, 0.2);
    }
    // 被抓住的一下：身子还往上冲，绕着脚踝晃一下
    o.rot += 12 * ring(t, T.grab, 0.8, 0.4);
    o.shoulderL += 18 * ring(t, T.grab + 0.04, 0.5, 0.3);
    o.shoulderR += 14 * ring(t, T.grab + 0.08, 0.5, 0.3);
    // 坐在地上哭：肩膀一抽一抽
    // （看见她递过来的砖就停下来）
    const sob = fade(t, T.land + 0.4, T.land + 0.7) * (1 - fade(t, T.take - 0.35, T.take - 0.1)) + fade(t, T.take + 0.7, T.take + 0.9) * (1 - fade(t, T.smile - 0.1, T.smile + 0.1)) * 1.2;
    if (sob > 0) {
      const h = sob * hitch(t, 0.6);
      o.lean += 2.5 * h;
      o.neck -= 2 * h;
      o.shoulderL -= 3 * h;
      o.shoulderR -= 3 * h;
      o.elbowL += 2 * h;
    }
    // 素材库周磊的短发在 face ≈ ±0.2…0.45 时会画成一根长刺（库里的毛病）：不停在这一段
    if (Math.abs(o.face) > 0.2 && Math.abs(o.face) < 0.45) o.face = Math.sign(o.face) * (Math.abs(o.face) < 0.325 ? 0.2 : 0.45);
    // 整个人的歪按画面方向算：朝右时整套镜像，rot 要反过来
    if (o.face > 0) o.rot = -o.rot;
  };
  // 只有手臂、脖子、身子跟随（腿跟随的话坐到地上那一下腿慢半拍，会穿进地里；飘着时腿的晃靠 zAdd）
  const makeZ = (drop: number) =>
    live(zKeys(drop), { look: lookOf(ZHOU), base: { wind: WIND * 0.4 }, idle: true, seed: 5, follow: 0, springs: { ...ARMS, rot: LIMP.rot, lean: LIMP.lean }, add: zAdd });
  let zMove = makeZ(T.drop);
  const zPoseMemo = new Map<number, PoseIn>();
  const setZ = (drop: number) => {
    zMove = makeZ(drop);
    zPoseMemo.clear();
  };
  const zPose = (t: number) => {
    const k = Math.round(t * 1e4);
    let p = zPoseMemo.get(k);
    if (!p) {
      p = zMove(t).pose;
      if (zPoseMemo.size > 1200) zPoseMemo.clear();
      zPoseMemo.set(k, p);
    }
    return p;
  };
  const zAnkle = (pose: PoseIn): V2 => castJoints(ZHOU, pose).ankleL;
  const zPalms = (pose: PoseIn) => {
    const j = castJoints(ZHOU, pose);
    return { L: j.palmL, R: j.palmR };
  };
  // 抓住的那一刻：他的脚踝就在她手里
  const grabAt = chenPalm(T.grab, "R");
  const GRIP: V2 = [0, -6];
  let aGrab = zAnkle(zPose(T.grab));
  // 被风带着往右漂了多远（让松手时公文包正好在落点正上方，下面迭代时算）
  let DRIFT = -200;
  // 坐下以后的位置：她放砖那一刻，两个人手里的砖叠在一起；比她靠镜头一点（画面上低一点、画在她前面），她就像跪在他脚边
  let ZX_SIT = X_STOP - LEAP - 260;
  const ZY_SIT = 24;
  const driftK = (t: number) => 1 - E.soft(ph(t, T.cut - 1, T.grab));
  // 拎着公文包往上飘：松手那一刻脚踝比被抓住时低 D_DROP，松手以后轻了、越飘越快（匀加速），
  // 正好在她跳到最高时升到她手里
  // 切到他时他已经飘到路人头顶上面（鞋底离地约 620），每秒升 150；松手以后轻了，越飘越快
  const V_RISE = 150;
  const D_DROP = 310;
  const ankleBefore = (t: number, drop: number): V2 => {
    const span = T.grab - drop;
    let d: number;
    if (t < drop) d = D_DROP + V_RISE * (drop - t);
    else {
      const s = t - drop;
      const a = (2 * (D_DROP - V_RISE * span)) / (span * span);
      d = D_DROP - V_RISE * s - 0.5 * a * s * s;
    }
    return [grabAt[0] + GRIP[0] + DRIFT * driftK(t), grabAt[1] + GRIP[1] + d];
  };
  let settled = false;
  const zRootRaw = (t: number, drop: number): { x: number; y: number; pose: PoseIn } => {
    const pose = zPose(t);
    if (t < T.grab) {
      const p = ankleBefore(t, drop);
      return { x: p[0] - aGrab[0], y: p[1] - aGrab[1], pose };
    }
    const a = zAnkle(pose);
    const palm = chenPalm(t, "R");
    const pin = { x: palm[0] + GRIP[0] - a[0], y: palm[1] + GRIP[1] - a[1] };
    // 一口气拽下来：脚踝一直攥在她手里；快着地时身子往下一收，屁股砸在地上（中途不停、不绕圈）
    const w = ph(t, T.land - 0.06, T.land + 0.03);
    const wx = E.soft(w);
    const wy = w ** 1.7;
    return { x: pin.x + (ZX_SIT - pin.x) * wx, y: pin.y + (ZY_SIT - pin.y) * wy, pose };
  };
  // 头发、领带按他在世界里的速度甩
  const zMemo = memoT((t: number) => {
    const a = zRootRaw(t, T.drop);
    // 前一个时刻取在 1/30 秒的格子上：播放时就是上一帧，已经算过
    const tb = Math.round((t - 1 / 30) * 30) / 30;
    const dt = Math.max(1 / 60, t - tb);
    const b = zRootRaw(tb, T.drop);
    const pose = { ...a.pose };
    withDrag(pose, [(a.x - b.x) / dt, (a.y - b.y) / dt], 0.5, 0.25);
    return { ...a, pose };
  });
  const zRootAt = (t: number, drop = T.drop) => (settled && drop === T.drop ? zMemo(t) : zRootRaw(t, drop));

  // ——— 哑铃：近处的手拎着 → 镜头停在他手上时手指一根根松开、往下滑两下、越歪越厉害 → 手一松掉下去（按重力反推松手的时刻，落地正好砸在拍上）———
  const slipStep = (t: number) => 0.45 * E.out(ph(t, T.slip0 + 0.52, T.slip0 + 0.59)) + 0.55 * E.out(ph(t, T.slip0 + 0.7, T.slip0 + 0.77));
  const caseSlip = (t: number) => 22 * slipStep(t);
  const caseTilt = (t: number) => 0.2 * slipStep(t);
  const heldCase = (t: number, drop = T.drop): V2 => {
    const r = zRootAt(t, drop);
    const p = zPalms(r.pose);
    return [r.x + p.L[0], r.y + p.L[1] + 8 + caseSlip(t)];
  };
  let drop = T.drop;
  let v0: V2 = [0, 0];
  let tf = 0.6;
  for (let i = 0; i < 6; i++) {
    setZ(drop);
    aGrab = zAnkle(zPose(T.grab));
    const k = driftK(drop);
    const hands0 = heldCase(drop, drop);
    if (k > 0.05) DRIFT += (X_LAND - hands0[0]) / k;
    const p0 = heldCase(drop, drop);
    const h = -BELL_R - p0[1];
    tf = Math.sqrt((2 * h) / G);
    drop = T.slam - tf;
    v0 = [(X_LAND - p0[0]) / tf, 0];
  }
  T.drop = drop;
  setZ(drop);
  aGrab = zAnkle(zPose(T.grab));
  {
    const her = chenAt(T.take);
    const hb = brickCenter(CHENGTUO, her.pose);
    const zb = brickCenter(lookOf(ZHOU), zPose(T.take), ZHOU.scale, ZHOU.width ?? 1);
    ZX_SIT = her.x + hb[0] - zb[0];
  }
  settled = true;
  const P0 = heldCase(drop);
  const caseSway = (t: number) => 0.06 * Math.sin(t * 1.6) + 0.03 * Math.sin(t * 2.7 + 1);
  /** 哑铃这一刻（中心、歪多少）：拎着 → 直直往下掉、越掉越快 → 砸进街面（不弹，太沉了），陷下去一点、晃一下停住 */
  const caseAt = (t: number): { x: number; y: number; r: number } => {
    if (t < T.drop) {
      const p = heldCase(t);
      return { x: p[0], y: p[1], r: caseSway(t) + caseTilt(t) };
    }
    if (t < T.slam) {
      const s = t - T.drop;
      const u = s / tf;
      return { x: P0[0] + v0[0] * s, y: P0[1] + 0.5 * G * s * s, r: (caseSway(T.drop) + caseTilt(T.drop)) * (1 - u) + 0.12 * Math.sin(Math.PI * u) };
    }
    const a = t - T.slam;
    return { x: X_LAND, y: -BELL_R + 10 * E.out(Math.min(1, a / 0.06)), r: a < 0.4 ? 0.06 * Math.exp(-a / 0.1) * Math.sin(a * 40) : 0 };
  };
  const drawBell = (cc: CanvasRenderingContext2D, b: { x: number; y: number; r: number }, z: number) => drawDumbbell(cc, b.x, b.y, BELL_PHI, b.r, BELL_S, 3 / Math.sqrt(Math.max(0.5, z)));

  // ——— 公文包：远处的手一直拎着；被她拽回地面那一下手一张，从手里掉下去，落在他身边躺平 ———
  const CASE_REL = T.land + 0.02;
  const caseHeld = (t: number): V2 => {
    const r = zRootAt(t);
    const p = zPalms(r.pose);
    return [r.x + p.R[0], r.y + p.R[1] + CASE.h / 2 + 24];
  };
  let CASE_FROM: V2 | null = null;
  const briefAt = (t: number): { x: number; y: number; r: number } => {
    if (t < CASE_REL) return { x: caseHeld(t)[0], y: caseHeld(t)[1], r: 0.05 * Math.sin(t * 1.4) };
    CASE_FROM ??= caseHeld(CASE_REL);
    const s = t - CASE_REL;
    const ground = -CASE.h / 2 + 6;
    const y = Math.min(ground, CASE_FROM[1] + 0.5 * G * s * s);
    const landed = y >= ground;
    return { x: CASE_FROM[0] + 60 * Math.min(s, 0.3), y, r: landed ? 0.04 : -0.3 * Math.min(1, s / 0.2) };
  };

  // ——————————— 小石头：从左边跑过来（一步 0.25 秒，最后一步 R 落地停在她跟前），仰头冲她笑，被摸头，转过来挥手送她 ———————————
  const KID_STEP = 0.25;
  const KID_Y = 22;
  const KID_N = 5;
  const kid0 = T.kidStop - KID_STEP * KID_N;
  const KRUN: [number, Angles, number, number][] = [
    [0, KID.跑_落地, 0.04, 0],
    [0.22, KID.跑_下沉, 0.07, 0],
    [0.5, KID.跑_蹬地, 0, 8],
    [0.76, KID.跑_腾空, 0, 20],
  ];
  const kidKeys: MoveKey[] = [];
  for (let k = 0; k <= KID_N; k++) {
    const foot = k % 2 === 0 ? "L" : "R";
    const prev = k % 2 === 0 ? "R" : "L";
    for (const [at, p, squash, lift] of KRUN) {
      if (k === KID_N && at > 0) break;
      kidKeys.push({ t: kid0 + (k + at) * KID_STEP, ease: SMOOTH, squash, plant: k === 0 && at === 0 ? undefined : at === 0 ? prev : foot, p: { ...(foot === "L" ? p : swapSides(p)), lift } });
    }
  }
  kidKeys.push(
    { t: T.kidStop + 0.26, ease: "out", plant: "R", squash: 0, p: KID.仰头笑 },
    // 她的手伸过来时就缩脖子、眯眼，只低一半头、身子不往前倾（仰着的头整个低下来，头顶往她那边送 50 多，她的胳膊只能折起来）
    { t: T.pat + 0.06, ease: "inOut", plant: "R", p: { ...KID.被摸头, neck: 21, lean: -4 } },
    { t: T.pat + 0.45, ease: "inOut", plant: "R", p: { ...KID.被摸头, neck: 21, lean: -4 } },
    // 她摸完接着往前走：他转过来一点，仰着头笑着目送她、挥挥手
    { t: T.pat + 0.85, ease: "inOut", plant: "R", p: { ...KID.仰头笑, face: 0.45, lookX: -0.8 } },
    { t: T.pat + 1.2, ease: "inOut", plant: "R", p: { ...KID.挥手, face: 0.45 } },
    { t: T.pat + 1.45, ease: "inOut", plant: "R", p: { ...KID.挥手, face: 0.45, shoulderR: 132 } },
    { t: T.pat + 1.7, ease: "inOut", plant: "R", p: { ...KID.挥手, face: 0.45 } },
    { t: T.pat + 1.95, ease: "inOut", plant: "R", p: { ...KID.挥手, face: 0.45, shoulderR: 132 } },
  );
  const kidMove = live(kidKeys, { look: lookOf(STONE), base: { wind: WIND * 0.6 }, idle: true, seed: 7, springs: ARMS });

  // 摸头（用户 2026-10-26：「这里摸小石头没摸到」——原来近处的手是一个固定姿势，跟着她走从他头顶上方一滑而过，还画在他后面被头挡住；
  // 接着「这个手的姿势很奇怪，需要调整小石头的占位」——他站得太近，她肩膀快到他头顶正上方，胳膊折成 L 形、前臂横着按在头上）：
  // 他站在她前面，手从摆臂的位置伸出去、胳膊伸直落到他头顶（手腕 IK），手掌平贴着头发揉两下；她弯着腰边走边直起身，肩膀往后让，
  // 胳膊从伸直慢慢弯一点（肘往下、往后，和摆臂同一个方向）按在他头上，揉完顺着后脑勺往前（她走的方向）离开头发，一路接回摆臂。
  // 手离开头发以前，他画在她身子前面、她近处那只手后面（beforeFrontArms）
  const PAT_IN = T.pat - 0.2;
  const PAT_ON = T.pat + 0.12;
  const PAT_UP = T.pat + 0.38;
  const PAT_END = PAT_UP + 0.28;
  /** 揉的时候手掌中心沿着头形从头顶前面一点（θ 负，她那边）滑到后脑勺（θ 正，弧度）：原来沿切线直着往后滑 60，
   *  头半径只有 40 多，手滑出头外悬在后脑勺后面（用户 2026-10-29：「摸头动作没对上」） */
  const PAT_TH0 = -0.3;
  const PAT_TH1 = 0.25;
  /** 他的头顶（相对他的根）和头顶朝上的方向：头以脖子为中心放大 headScale 倍；头顶（头发底下）离头的中心 53 个头的单位 */
  const KID_HEAD_R = 53 * STONE.scale * (STONE.headScale ?? 1) - 1.1;
  const kidCrown = (pose: PoseIn): { top: V2; up: V2 } => {
    const j = castJoints(STONE, pose);
    const hs = STONE.headScale ?? 1;
    const d: V2 = [(j.head[0] - j.neck[0]) * hs, (j.head[1] - j.neck[1]) * hs];
    const l = Math.hypot(d[0], d[1]);
    const up: V2 = [d[0] / l, d[1] / l];
    return { top: [j.neck[0] + d[0] + up[0] * KID_HEAD_R, KID_Y + j.neck[1] + d[1] + up[1] * KID_HEAD_R], up };
  };
  // 他停在她前面：手落到头上那一刻，头顶在她肩膀前面 PAT_REACH（胳膊正好伸直）
  // 小石头改高以后（用户 2026-10-28）他的头顶和她肩膀差不多高（低头时差 29），手和肩膀一样高、胳膊得伸直：他站远一点（122 → 150）
  const PAT_REACH = 150;
  const kidX0 = (() => {
    const c = chenAt(PAT_ON);
    const f = kidMove(PAT_ON);
    return c.x + jointsOf(c.pose).shoulderL[0] - PAT_REACH - kidCrown(f.pose).top[0] + f.x;
  })();
  // 朝右的人整套镜像：脚钉在地上算出来的根的 x 要取反
  const kidAt = memoT((t: number) => {
    const f = kidMove(t);
    return { pose: f.pose, x: kidX0 - f.x };
  });
  const PAT_WRIST = 75 * (Math.PI / 180);
  const angleOf = (from: number[], to: number[]) => Math.atan2(-(to[0] - from[0]), to[1] - from[1]);
  const bez = (a: V2, b: V2, e: V2, s: number) => [0, 1].map((i) => (1 - s) ** 2 * a[i] + 2 * s * (1 - s) * b[i] + s * s * e[i]) as V2;
  /** 这一刻手心的位置、手的朝向（还没 IK） */
  const patPath = (t: number) => {
    const c = chenAt(t);
    const k = kidAt(t);
    const cr = kidCrown(k.pose);
    // 原来摆臂的手：伸过去从它出发，抬起来以后回到它（位置和手的朝向都接得上，不跳）
    const j0 = jointsOf(c.pose);
    const swing: V2 = [c.x + j0.palmL[0], c.y + j0.palmL[1]];
    const swingHand = angleOf(j0.wristL, j0.palmL);
    const u = ph(t, PAT_ON, PAT_UP);
    const rub = t > PAT_ON && t < PAT_UP ? Math.sin(4 * Math.PI * u) : 0;
    // 贴着头形：头的中心 + (R + d) 朝 θ 的方向（θ 从头顶往后脑勺量）；手指顺着头形的切线朝后脑勺、微微往头里扣
    const R = KID_HEAD_R;
    const ctr: V2 = [k.x + cr.top[0] - cr.up[0] * R, cr.top[1] - cr.up[1] * R];
    const perp: V2 = [-cr.up[1], cr.up[0]];
    const onHead = (th: number, d = 8): { at: V2; hand: number } => {
      const dir: V2 = [Math.cos(th) * cr.up[0] - Math.sin(th) * perp[0], Math.cos(th) * cr.up[1] - Math.sin(th) * perp[1]];
      const tan: V2 = [-Math.sin(th) * cr.up[0] - Math.cos(th) * perp[0], -Math.sin(th) * cr.up[1] - Math.cos(th) * perp[1]];
      const f: V2 = [tan[0] - 0.15 * dir[0], tan[1] - 0.15 * dir[1]];
      return { at: [ctr[0] + dir[0] * (R + d), ctr[1] + dir[1] * (R + d)], hand: Math.atan2(-f[0], f[1]) };
    };
    const first = onHead(PAT_TH0);
    const last = onHead(PAT_TH1);
    let palm: V2;
    let hand: number;
    if (t < PAT_ON) {
      const x = ph(t, PAT_IN, PAT_ON);
      palm = bez(swing, onHead(PAT_TH0 - 0.5, 66).at, first.at, x * (2 - x));
      hand = swingHand + (first.hand - swingHand) * E.out(x);
    } else if (t < PAT_UP) {
      // 边揉边顺着头形往后脑勺滑（她往前走、肩膀越来越近，手停在原地的话胳膊折下来、前臂挡在他脸前面，用户 2026-10-28）
      const h = onHead(PAT_TH0 + (PAT_TH1 - PAT_TH0) * E.io(u) + 0.12 * rub);
      palm = h.at;
      hand = h.hand;
    } else {
      const s = E.io(ph(t, PAT_UP, PAT_END));
      palm = bez(last.at, onHead(PAT_TH1 + 0.1, 80).at, swing, s);
      hand = last.hand + (swingHand - last.hand) * s;
    }
    // 手掌中心离他头的中心多远（离开头发以后胳膊回到他后面）
    const off = Math.hypot(palm[0] - (k.x + cr.top[0] - cr.up[0] * KID_HEAD_R), palm[1] - (cr.top[1] - cr.up[1] * KID_HEAD_R));
    return { c, palm, hand, off };
  };
  const firstAt = (t0: number, t1: number, ok: (t: number) => boolean) => {
    for (let t = t0; t < t1; t += 1 / 240) if (ok(t)) return t;
    return t1;
  };
  // 手离开头发：只换一次前后（收回摆臂时手还会从他后脑勺后面经过）
  const FRONT_OFF = firstAt(PAT_UP, PAT_END, (t) => patPath(t).off >= KID_HEAD_R + 34);
  const patAt = memoT((t: number): { pose: PoseIn; front: boolean } | null => {
    if (t <= PAT_IN || t >= PAT_END) return null;
    const { c, palm } = patPath(t);
    let { hand } = patPath(t);
    const front = t < FRONT_OFF;
    const p: PoseIn = { ...c.pose };
    const arm = p.armL as { a: number; b: number; h: number };
    // 肘只往正常的方向弯（bend −1，和摆臂一样；用户 2026-10-26：「手臂怎么能向下弯呢？这个拐弯不对」——肘往外拱时前臂反着折，是反关节）。
    // 前臂由 IK 定下来以后再转手腕，手掌保持平贴，手腕最多翻 75°
    for (let i = 0; i < 2; i++) {
      const wrist: V2 = [palm[0] + 17 * Math.sin(hand), palm[1] - 17 * Math.cos(hand)];
      p.armL = { ...arm, to: [wrist[0] - c.x, wrist[1] - c.y], ik: 1, bend: -1, chest: front ? "over" : "under" } as PoseIn["armL"];
      const j = jointsOf(p);
      const fa = angleOf(j.elbowL, j.wristL);
      hand = Math.min(hand, fa + PAT_WRIST);
      (p.armL as { h: number }).h = hand - fa;
    }
    return { pose: p, front };
  });

  // ——————————— 老钟：一楼窗后，看见她走过来，举起茶杯 ———————————
  const winX = chenAt(T.zhong + 0.6).x - WIN_AHEAD;
  const HOUSE: House = { x0: winX - 480, x1: winX + 320, top: -1480, win: { x: winX, w: 330, sill: -300, top: -660 } };
  // 老钟家左右的邻居（和人在同一层）：左边一排老居民楼，右边一间平房小铺子——升起来时看得出是一整条街，不是孤零零一栋房子
  const NEIGHBORS: Block[] = [
    { x: HOUSE.x1 + 60, w: 280, floors: 1, fh: 300, wall: "#e8c9a6", wallShade: "#d9b690", seed: 311, shop: "#c96a52", plainRoof: true },
    { x: HOUSE.x0 - 60 - 560, w: 560, floors: 5, fh: 230, wall: "#e6b39d", wallShade: "#d69f88", seed: 312, shop: "#6f8f86" },
    // 再往左是最高那栋楼（她家）、隔着巷子的千斤家那栋楼和后面两栋：lib/world.ts 的 TOWER、QJ_HOME、STREET
    ...STREET,
    QJ_HOME,
  ];
  const zhongMove = live(
    [
      { t: 0, p: ZHONG.窗后 },
      { t: T.zhong - 0.2, p: ZHONG.窗后 },
      { t: T.zhong + 0.25, ease: "out", p: ZHONG.举杯 },
      { t: T.zhong + 0.75, ease: "inOut", p: { ...ZHONG.举杯, neck: -2 } },
      { t: T.zhong + 1.15, ease: "inOut", p: ZHONG.举杯 },
      { t: T.pat + 0.4, ease: "inOut", p: { ...ZHONG.举杯, lookX: -0.6 } },
    ],
    { look: lookOf(OLD), base: { wind: 0 }, idle: true, seed: 11, springs: ARMS },
  );

  // ——— 光里的女人：往上飘，头发先碰到白 ———
  const W_SPEED = (t: number) => 260 * t + 80 * t * t;
  // 碰到白的那一刻伸向光的那只手的指尖正好碰到白的边（指尖在胯上面约 325，头顶约 280，脚尖在胯下面约 270）
  const W_HIP_BURN = Y_WHITE + 325;
  const WY0 = W_HIP_BURN + W_SPEED(T.burn);
  const womanHip = (t: number): V2 => [WX, WY0 - W_SPEED(Math.min(Math.max(t, 0), T.burn))];
  const W_HEAD = W_HIP_BURN - 330;
  const W_FEET = W_HIP_BURN + 280;
  const BURN_DUR = 0.4;
  // 她化成的灰：从头顶开始，一截一截散成发亮的光点（先是彩色的，散开以后变成暖白的灰，慢慢往下落）
  const ashBits = (() => {
    const r = seeded(31);
    return Array.from({ length: 230 }, () => {
      const y = W_HEAD + r() * (W_FEET - W_HEAD);
      const k = (y - W_HEAD) / (W_FEET - W_HEAD);
      const spread = 60 + 170 * Math.sin(Math.PI * Math.min(1, k * 1.25));
      const x = WX + (r() - 0.5) * 2 * spread;
      const ang = r() * Math.PI * 2;
      // 颜色只取肥皂泡那几种淡彩（粉、杏、淡黄、薄荷、天蓝、淡紫）
      const hue = [330, 25, 50, 150, 200, 265][Math.floor(r() * 6)] + (r() - 0.5) * 20;
      return { x, y, t0: T.burn + k * BURN_DUR, vx: Math.cos(ang) * (120 + r() * 300), vy: Math.sin(ang) * (90 + r() * 220) - 140, s: 7 + r() * 13, hue, ph: r() * 6 };
    });
  })();

  // ——— 路人、飘着的人 ———
  // 路人：在对面人行道（D = 2.2，远、小、蒙着空气）低着头慢慢走，没有人抬头。只是背景：
  // 用户 2026-10-19「这里背景有两个人，动作比这个打工人大，抢了视线」——原来在人行道靠里（D = 1.15），比他还显眼
  const WALKER_D = 2.2;
  const walkers: Walker[] = [
    { spec: passerby(2), x0: -900, dir: 1, step: 0.72, t0: 0, seed: 1 },
    { spec: passerby(12), x0: 260, dir: 1, step: 0.78, t0: 0.2, seed: 9 },
  ];
  // 开场的天上：她身边远远近近还有几个人在往上飘（各带一团暖光，像灯）
  const skyFloaters = (() => {
    const r = seeded(41);
    return [
      ...[-700, 1100].map((x, i) => ({ D: 4, x, y: -7400 - i * 500 - r() * 200, v: 40 + r() * 30, ph: r() * 6, h: 420 })),
      { D: 2.2, x: -620, y: -8350, v: 70, ph: r() * 6, h: 300 },
      { D: 2.2, x: 820, y: -8000, v: 55, ph: r() * 6, h: 280 },
      { D: 4, x: -150, y: -8900, v: 45, ph: r() * 6, h: 380 },
      { D: 2.2, x: -1100, y: -7600, v: 60, ph: r() * 6, h: 300 },
    ];
  })();
  // 全城往上飘的人：拉出全城时满天都是，离白越近越密、飘得越快；一拍一个被白吸进去。
  // 位置按「停在整座城上那一刻在画面上的哪里」排（远的层被透视压向画面中间，按世界坐标随便撒会挤成一条带），镜头定好以后再算（见镜头后面）。
  // 街上的镜头里不画他们；镜头升起来时离镜头近的几个（D < 1）一个个从旁边掠过去
  const BURN_BEATS = [27, 28, 29, 30, 31];
  interface Floater {
    x: number;
    D: number;
    /** 普通人：停在整座城上那一刻的高度（世界 y）；被吸进去的人：远的时候离白多远 */
    y0: number;
    tb: number;
    v: number;
    spec: CastSpec;
    ph: number;
    k: number;
  }
  const crowd: Floater[] = [];
  /**
   * 更远处满天往上飘的人（用户 2026-10-19：全城那个画面「中间有点空，把这个画面设计得美丽一点」）：城后面更远的天上，
   * 一大片小小的暖光往上飘，越靠近白越密——远看像放天灯，每一盏都是一个人。只在镜头拉开以后画（不进前面的街景）。
   */
  const lanterns: { x: number; y0: number; D: number; v: number; h: number; ph: number; a: number }[] = [];
  /** 被吸进去的人远的时候几乎悬着，越近越快（最后一下冲上去）；其他人慢慢往上飘 */
  const crowdY = (p: Floater, t: number) => {
    if (p.tb < 1e8) {
      if (t >= p.tb) return null;
      return Y_WHITE + 40 + p.y0 * (1 - Math.exp(-(p.tb - t) / 1.1));
    }
    return p.y0 - p.v * (t - T.wide);
  };
  /** 飘着的人画在哪一层的空气后面 */
  const layerOf = (D: number) => (D <= 1 ? 1 : D <= 1.3 ? 1.25 : D <= 1.9 ? 1.5 : D <= 2.8 ? 2.2 : 4);

  // ——— 字（介绍故事背景：整句一下子在，慢慢淡出）———
  // 都放在抖音的安全区里：上面 250 以下、下面 1450 以上（底下是标题、文案、音乐），右边 900 以内（下半截右边是点赞、评论那一列按钮），
  // 所以中心在 x 520。开头两句第一帧就一起在、在她鞋子下面；切到周磊以后（他就是「一绝望就飘起来」的人）开始慢慢淡出，
  // 2.45 秒淡完——2.51 她的铁靴从画面下面冲进来
  const notes: Note[] = [
    { text: "这里的人，一绝望就会飘起来", accent: "飘起来", x: 515, y: 1350, size: 56, in: -1, out: T.cut + 0.1, fade: 0.85 },
    { text: "飘进天上的强光，就会化成灰", accent: "化成灰", x: 515, y: 1430, size: 56, in: -1, out: T.cut + 0.1, fade: 0.85 },
    // 她把飘着的人一把拽回地面以后才上（刚证明了她有多沉），在上面的楼前；砖亮起来那一刻开始慢慢淡出，鼓进来之前淡完
    { text: "城里都说，她是最沉的人", accent: "最沉", x: 515, y: 330, size: 56, in: T.land + 0.25, out: T.take, fade: 0.9 },
  ];

  // ——————————— 镜头 ———————————
  // ① 天上：白在画面上面，她在中间；屏着气只往里凑 3%。碰到白：光把镜头猛地推开（E.out 0.4 秒），歪着的画面回正；
  //    灰往下落，镜头跟着慢慢落，再越来越快地往下甩
  // 白的边在画面上面约 260 处，她在下面往上升、一点点顶上去。1.35 倍：第一帧她的鞋停在 1280 左右，下面给设定字留出安全区里的位置
  // （原来 1.6 倍、白在 300，鞋到 1500，字只能放进抖音底下的文案区）
  const S1_Z = 1.35;
  const S1_Y = 260;
  const WHIP = 2600;
  const camS1 = (t: number): Cam => {
    if (t < T.burn) {
      const u = Math.max(0, t) / T.burn;
      return aim(WX, Y_WHITE, 540, S1_Y, S1_Z * (1 + 0.03 * u), -0.03 + 0.012 * u);
    }
    const u = E.out(ph(t, T.burn, T.burn + 0.4));
    const fall = 300 * Math.pow(ph(t, T.burn + 0.12, T.whip), 1.3);
    const w = ph(t, T.whip, T.cut) ** 3;
    return aim(WX, Y_WHITE + fall + WHIP * w, 540, S1_Y + 140 * u, S1_Z * 1.03 * (1 - 0.24 * u), -0.018 * (1 - u));
  };
  // ② 街上：镜头从上面落下来、停在他身上（中景），之后跟着他往上飘（弹簧追他的胸口）：身后的楼、树、电线往下沉，看得出在升
  const zChest = smoothTrack(
    (t) => {
      const r = zRootAt(t);
      const j = castJoints(ZHOU, r.pose);
      return [r.x + (j.shoulderL[0] + j.shoulderR[0]) / 2, r.y + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 40];
    },
    T.cut - 0.1,
    T.her + 0.1,
    4,
  );
  const holdCam = (t: number) => {
    const c = zChest(t);
    const c0 = zChest(T.cut);
    // 镜头只跟他升起来的一半多：他在画面里往上走，身后的楼、树、路人往下沉，两样一起看得出在升
    return aim(c[0], c[1] + (c0[1] - c[1]) * 0.42 + 40, 540, 880, 1.5);
  };
  const ARRIVE = 1000;
  const ARRIVE_T = 0.25;
  const arriveCam = (t: number): Cam => {
    const c = holdCam(t);
    return { ...c, y: c.y - ARRIVE * (1 - E.out(ph(t, T.cut, T.cut + ARRIVE_T))) };
  };
  // ③ 切到她（主角登场：急）：先贴着地面看见狂奔的铁靴，一边跟着跑一边抬起来露出整个人；之后镜头和她一样快，
  //    她在画面偏右、前面留出空，步子一下一下带着镜头轻轻颠。她刹住，镜头带着惯性往前多滑一点才停
  const xBrake = chenAt(T_BRAKE).x;
  const GLIDE_T = 0.36;
  const GLIDE = (RUN_V * GLIDE_T) / 3;
  const trackX = (t: number) => (t < T_BRAKE ? chenAt(t).x : xBrake - GLIDE * E.out(ph(t, T_BRAKE, T_BRAKE + GLIDE_T)));
  const RUN_SX = 700;
  const herCam = (t: number): Cam => {
    const x = trackX(t);
    const boots = aim(x - 40, -100, RUN_SX, 1320, 4);
    const full = aim(x, -380, RUN_SX, 1080, 1.25);
    const k = camLerp(boots, full, E.io(ph(t, T.her + 0.18, T.her + 0.8)));
    const bob = 6 * Math.cos(((t - T_BRAKE) / RUN_STEP) * 2 * Math.PI) * (1 - E.out(ph(t, T_BRAKE, T_BRAKE + 0.3)));
    return { ...k, y: k.y + bob / k.z };
  };
  // ③½ 2026-10-24 用户：「这里改成镜头拉远，把主角和打工人都放在屏幕里，之后杠铃砸地的时候镜头猛的放大到杠铃，之后快速缩小并对准主角」：
  //   她边跑边抬头时（slip0 起 0.5 秒）镜头往后拉远，把跑过来的她和头顶拎着哑铃的他（连哑铃）一起框进来，之后跟着两个人（平滑跟，她跑得快）；
  //   哑铃掉下来就在这个远景里掉；砸地那一下 0.08 秒猛放大到哑铃上（2.6 倍）、重震，停一下，再 0.36 秒快速缩小、对准她
  const SLIP_UP = 0.5;
  // 只框两个人（他的头到她的脚、她到他），边留得窄：两个人越近，镜头跟着越推越近（用户 2026-10-24：「随着两人距离缩短，镜头也跟着放大」）
  const twoBox = (t: number): [number, number, number] => {
    const c = chenAt(t);
    const cj = jointsOf(c.pose);
    const r = zRootAt(t);
    const zj = castJoints(ZHOU, r.pose);
    const xs = [c.x - 130, c.x + 130, r.x - 150, r.x + 150];
    const ys = [c.y + cj.head[1] - 90, c.y + Math.max(cj.ankleL[1], cj.ankleR[1]) + 70, r.y + zj.head[1] - 100, r.y + Math.max(zj.ankleL[1], zj.ankleR[1]) + 40];
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    const z = Math.max(0.55, Math.min(2.0, Math.min((W * 0.9) / (x1 - x0), (H * 0.86) / (y1 - y0))));
    // 竖着有富余时把脚下放到画面底边附近（1740），不空出一大块地；他的头不出画
    return [(x0 + x1) / 2, Math.min(y1 - 780 / z, y0 + 860 / z), z];
  };
  // 横着直接对准两个人的中间（按两个人的根算，不抖；平滑跟会落后她一大截——她每秒跑 1200——人就偏到画面一边）；
  // 竖着和倍数只轻轻平滑一下（跑步时头脚一颠一颠）
  const twoYZ = smoothTrack((t) => [twoBox(t)[1], Math.log(twoBox(t)[2])], T.slip0 - 0.1, T.slam + 0.1, 20);
  const twoCam = (t: number): Cam => {
    const [y, lz] = twoYZ(t);
    return { x: twoBox(t)[0], y, z: Math.exp(lz), r: 0 };
  };
  const CASE_Z = 2.6;
  const CASE_AT: V2 = [520, 1150];
  const caseCam = aim(X_LAND, -BELL_R, CASE_AT[0], CASE_AT[1], CASE_Z);
  /** 4.30 起镜头以哑铃为中心，跟着它往下掉、一路放大，落地正好推到 2.6 倍（用户：「这里镜头就应该开始把杠铃作为中心，放大并跟随杠铃」；
   *  之前是快落地前 0.15 秒才推，再之前是砸地以后 0.08 秒猛推——「放大太快了」） */
  const ZOOM0 = T.slam - 0.21;
  let BELL0: { z: number; s: V2 } | null = null;
  const bellCam = (t: number): Cam => {
    if (!BELL0) {
      const c0 = twoCam(ZOOM0);
      const p0 = caseAt(ZOOM0);
      BELL0 = { z: c0.z, s: toScreen(c0, p0.x, p0.y) };
    }
    const e = E.io(ph(t, ZOOM0, T.slam));
    const p = caseAt(Math.min(t, T.slam));
    return aim(p.x, Math.min(p.y, -BELL_R), BELL0.s[0] + (CASE_AT[0] - BELL0.s[0]) * e, BELL0.s[1] + (CASE_AT[1] - BELL0.s[1]) * e, Math.exp(Math.log(BELL0.z) + (Math.log(CASE_Z) - Math.log(BELL0.z)) * e));
  };
  // ⑤ 砸完停一下，快速缩小、对准她：她抬头盯住他、蹲下攒劲，镜头停住、跟着她往里凑一点；
  //    蹬地那一下跟着她往上冲、往后退，把头顶的他框进来（她留在画面里）
  // 砸地以后只停一下（0.06 秒，重震），马上快速缩小、对准她：4.67 她冲进来刹住时已经在画面里（用户：「这里应该已经缩小了，把主角显示进去」）
  const BACK0 = T.slam + 0.06;
  const BACK1 = BACK0 + 0.42;
  const UP_GO = T.launch - 0.03;
  const herHold = (() => {
    const c = chenAt(T.launch - 0.05);
    return aim(c.x + 20, -300, 560, 1090, 1.7);
  })();
  const herHoldAt = (t: number): Cam => ({ ...herHold, z: herHold.z * (1 + 0.035 * E.io(ph(t, BACK1, T.launch))) });
  // 跟着两个人：横着取两个人肩膀的中点；竖着取两个人整体的上下范围的中点，但她的脚一直在画面里
  const ACTION_Z = 1.35;
  const pairRaw = memoT((t: number): V2 => {
    const c = chenAt(t);
    const j = jointsOf(c.pose);
    const r = zRootAt(t);
    const k = castJoints(ZHOU, r.pose);
    const top = r.y + k.head[1] - 70;
    const bottom = c.y + Math.max(j.ankleL[1], j.ankleR[1]) + 70;
    const mid = (top + bottom) / 2;
    const y = Math.min(mid, bottom - (H / 2 - 150) / ACTION_Z);
    return [(c.x + (j.shoulderL[0] + j.shoulderR[0]) / 2 + r.x + (k.shoulderL[0] + k.shoulderR[0]) / 2) / 2, y];
  });
  // 前后 0.1 秒、9 个样本的平均（他被拽到地上那一下很快，不平均的话镜头会跟着一抖）
  const pairMid = (t: number): V2 => {
    const g0 = Math.floor(t * 40) / 40;
    const f = (t - g0) * 40;
    let x = 0;
    let y = 0;
    for (let i = -4; i <= 4; i++) {
      const p = pairRaw(g0 + i / 40);
      const q = pairRaw(g0 + (i + 1) / 40);
      x += (p[0] * (1 - f) + q[0] * f) / 9;
      y += (p[1] * (1 - f) + q[1] * f) / 9;
    }
    return [x, y];
  };
  // ⑥ 落地以后（交出一样重要的东西，不切）：镜头顺着两个人落下来，落定以后停在两个人身上、很慢地凑近（心疼）；
  //    砖落进他手里亮起来的那一刻一下推上去（0.4 秒），中心是砖（只推、不横移），之后几乎不动
  const BRICK_AT: V2 = (() => {
    const c = chenAt(T.take);
    const b = brickCenter(CHENGTUO, c.pose);
    return [c.x + b[0], c.y + b[1]];
  })();
  const BRICK_S: V2 = [548, 1010];
  const Z_LAND = ACTION_Z;
  const Z_PUSH = 2.1;
  const CREEP = 0.08;
  const PUSH_GO = T.take - 0.02;
  const PUSH_IN = T.take + 0.4;
  const brickCam = (t: number): Cam => {
    const e = E.out(ph(t, PUSH_GO, PUSH_IN));
    const creep = 1 + CREEP * E.soft(ph(t, T.land + 0.2, PUSH_GO));
    const zc = Z_LAND * creep;
    const z = zc * Math.pow(Z_PUSH / (Z_LAND * (1 + CREEP)), e) * (1 + 0.025 * E.soft(ph(t, PUSH_IN, T.smile)));
    return aim(BRICK_AT[0], BRICK_AT[1], BRICK_S[0], BRICK_S[1] + 150 * (1 - e), z);
  };
  // 两个人落定时在画面上的位置：正好是往砖推的镜头起步时的取景（往下拽的一路慢慢挪过去，落定不用再找位置）
  const LAND_S = toScreen(brickCam(T.land + 0.2), ...pairMid(T.land + 0.16));
  const actionCam = (t: number) => {
    const m = pairMid(t - 0.04);
    const k = E.io(ph(t, T.grab + 0.1, T.land + 0.05));
    return aim(m[0], m[1], 540 + (LAND_S[0] - 540) * k, 960 + (LAND_S[1] - 960) * k, ACTION_Z);
  };
  // ⑦ 鼓进来：镜头一顶；她站起来往前走：镜头退开到 1.35、移到她前面（她走的方向留空），之后只跟着她走，她在画面右边 1/3
  const herWalkX = smoothTrack((t) => [chenAt(t).x, 0], T.smile, T.r0 + 0.5, 14);
  const walkCam = (t: number): Cam => aim(herWalkX(t)[0], -10, 780, 1460, 1.35);
  // ⑧ 和老钟打招呼：镜头挤到她和窗里的老钟中间，两个人越走越近、镜头跟着越推越近（倍数按两人的距离算）
  const zhongX = HOUSE.win.x - 20;
  const greetCam = (t: number): Cam => {
    const hx = chenAt(t).x;
    const d = Math.abs(hx - zhongX);
    const z = Math.min(1.45, Math.max(1.15, 780 / d));
    return aim((hx + zhongX) / 2, -390, 540, 1020, z);
  };
  // ⑨ 小石头从左边跑过来：镜头往左带去接他（她留在画面右边），收成窗里的老钟、小石头、她三个人，慢慢推近
  const kidFit = smoothTrack(
    (t) => {
      const hx = chenAt(t).x;
      const kx = kidAt(t).x;
      const d = Math.max(1, hx - kx);
      const z = Math.min(1.55, Math.max(1.4, 860 / d));
      return [Math.max((hx + kx) / 2 - 40, hx + 110 - 480 / z), z];
    },
    T.kidStop - 1.2,
    T.end,
    7,
  );
  const kidCam = (t: number): Cam => {
    const [cx, z] = kidFit(t);
    return aim(cx, -380, 540, 1040, z * (1 + 0.04 * E.io(ph(t, T.pat, T.r0))));
  };
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
  const groundChain = chain([
    [T.land + 0.25, brickCam, lin],
    [T.smile + 0.08, brickCam, lin],
    // 站起来：退开、移到她前面（0.55 秒）
    [T.walk0 + 0.15, walkCam, E.io],
    [T.zhong - 0.5, walkCam, lin],
    // 她抬头看见窗里的老钟：镜头顺着视线挤到两个人中间（0.4 秒）
    [T.zhong - 0.1, greetCam, E.io],
    [T.kidStop - 0.75, greetCam, lin],
    // 小石头跑过来：往左接他（0.45 秒）
    [T.kidStop - 0.3, kidCam, E.io],
    [T.r0, kidCam, lin],
  ]);
  // ⑩ 升起来拉出全城：她脚下的一点从画面里滑到最底下，倍数对数插值；先慢（余韵）、越升越快，第 28 拍落在整座城上
  const Z_WIDE = 0.165;
  const WIDE_S: V2 = [470, 1830];
  const K = (() => {
    const startCam = groundChain(T.r0);
    const A: V2 = [chenAt(T.r0).x - 60, -300];
    return { startCam, A, s0: toScreen(startCam, A[0], A[1]) };
  })();
  // 他抬头冲她哭着笑：镜头一顶（鼓进来那一下就是砖亮起来、推上去）
  const DRUM_KICK = (t: number) => (t < T.smile ? 1 : 1 + 0.045 * Math.exp(-(t - T.smile) / 0.22) * (1 - Math.exp(-(t - T.smile) / 0.04)));
  const DIVE_OVER = 0.036;
  const diveE = (t: number) => {
    if (t <= SHOP_T.land) return Math.pow(ph(t, T.end, SHOP_T.land), 2.2);
    const u = ph(t, SHOP_T.land, SHOP_T.land + 0.28);
    return 1 + DIVE_OVER * Math.sin(Math.PI * u) * (1 - u);
  };
  const camBase = (t: number): Cam => {
    if (t < T.cut) return camS1(t);
    if (t < T.her) return arriveCam(t);
    // 拉远，把她和他（连哑铃）一起框进来；哑铃就在这个远景里掉下来
    if (t < ZOOM0) {
      const w = E.io(ph(t, T.slip0, T.slip0 + SLIP_UP));
      return w <= 0 ? herCam(t) : camLerp(herCam(t), twoCam(t), w);
    }
    // 4.30 起以哑铃为中心、跟着它往下掉、一路放大；砸地重震；停一下，再快速缩小、对准她
    if (t < T.slam) return bellCam(t);
    if (t < BACK0) return caseCam;
    if (t < BACK1) return camLerp(caseCam, herHoldAt(t), E.out(ph(t, BACK0, BACK1)));
    // 远景和跟跑镜头差不多大，硬切像跳了一帧：0.12 秒接过去
    if (t < UP_GO) return herHoldAt(t);
    if (t < T.launch + 0.26) return camLerp(herHoldAt(UP_GO), actionCam(t), E.soft(ph(t, UP_GO, T.launch + 0.26)));
    if (t < T.land + 0.25) return camLerp(actionCam(t), brickCam(t), E.io(ph(t, T.land + 0.1, T.land + 0.25)));
    if (t < T.r0) {
      const k = groundChain(t);
      return { ...k, z: k.z * DRUM_KICK(t) };
    }
    // ⑪ 16.0 起扎进第二幕：从整座城上顺着最高那栋楼越扎越快地扎到楼脚的哑铃店（pow 2.2，被吸进去），落点冲过一点再回来
    if (t > T.end) return camLerp(camBase(T.end), shopCam(t, shop.bigAt), diveE(t));
    const { A, startCam, s0 } = K;
    const x = ph(t, T.r0, T.wide);
    // 先慢慢升（余韵，柔和起步的那一小份），中间越升越快，落到整座城上时收住（第 28 拍）
    const p = 0.12 * E.settle(Math.min(1, x * 1.6)) + 0.88 * E.io(Math.pow(x, 1.35));
    const drift = ph(t, T.wide, T.end);
    const z = startCam.z * Math.pow(Z_WIDE / startCam.z, p) * (1 - 0.03 * E.soft(drift));
    return aim(A[0], A[1], s0[0] + (WIDE_S[0] - s0[0]) * p, s0[1] + (WIDE_S[1] - s0[1]) * p + 40 * drift, z);
  };
  // 满天的人（镜头停在整座城上那一刻的取景算好以后再排）
  {
    const cw = camBase(T.wide);
    const r = seeded(57);
    const at = (sx: number, sy: number, D: number): V2 => [cw.x + ((sx - W / 2) * D) / cw.z, cw.y + ((sy - H / 2) * D) / cw.z];
    // 被吸进去的五个：和白在同一层（D = 1），碰到白的地方在画面上散开，最后一个（第 31 拍、最大的那下）在正中间
    const bx = [200, 700, 330, 900, 540];
    BURN_BEATS.forEach((b, i) => crowd.push({ x: at(bx[i], 0, 1)[0], D: 1, y0: 650 + r() * 700, tb: T.beat(b), v: 0, spec: passerby(Math.floor(r() * 40)), ph: r() * 6, k: 0.42 }));
    for (let i = 0; i < 56; i++) {
      const D = [1.15, 1.4, 1.8, 2.4, 3.2][i % 5];
      const u = r();
      const sy = 420 + 1050 * Math.pow(u, 1.35);
      const [x, y] = at(-60 + r() * 1200, sy, D);
      crowd.push({ x, D, y0: y, tb: 1e9, v: 40 + 150 * (1 - u), spec: passerby(Math.floor(r() * 40)), ph: r() * 6, k: 0.36 + r() * 0.2 });
    }
    // 远处的一大片：三层（越远越小、越淡、飘得越慢），越往上越密
    for (let i = 0; i < 150; i++) {
      const D = [3.6, 4.8, 6.4][i % 3];
      const u = Math.pow(r(), 1.7);
      const sy = 470 + 640 * u;
      const [x, y] = at(-40 + r() * 1160, sy, D);
      lanterns.push({ x, y0: y, D, v: 25 + 90 * (1 - u), h: 590 * (0.26 + r() * 0.16), ph: r() * 6.28, a: (0.75 - 0.35 * u) * (D > 6 ? 0.7 : D > 4 ? 0.85 : 1) });
    }
    // 离镜头近的几个：镜头升起来时一个个从画面里掠过去（看得出是在人群里往上升）
    (
      [
        [-280, 0.82, -1900],
        [320, 0.9, -2900],
        [-580, 0.78, -4000],
        [570, 0.86, -5200],
        [-80, 0.94, -6400],
      ] as const
    ).forEach(([dx, D, y], i) => crowd.push({ x: K.A[0] + dx, D, y0: y, tb: 1e9, v: 70 + i * 12, spec: passerby(7 + i * 5), ph: i * 1.3, k: 0.5 }));
  }
  // 落地那一下画面往下一沉、往前顶 5% 再弹回来；全城有人被吸进去的一下，镜头一惊（凑近一点点）
  const camRaw = (t: number): Cam => {
    const k = camBase(t);
    const a = kick(t, T.land, 0.12);
    let b = 0;
    for (const bt of BURN_BEATS) b += kick(t, T.beat(bt), 0.18) * (bt === 31 ? 2.4 : 1);
    if (a < 0.001 && b < 0.001) return k;
    return { ...k, y: k.y - (16 * a) / k.z, z: k.z * (1 + 0.05 * a + 0.016 * b) };
  };
  // 平静的段落里镜头像手持一样很轻地呼吸（画面上 3 像素、0.4% 以内）；屏息、跟拍、险、跳、升起来的时候不加
  const calm = (t: number) => fade(t, T.land + 0.3, T.land + 0.8) * (1 - fade(t, T.r0 - 0.2, T.r0 + 0.2));
  const breathe = (c: Cam, t: number): Cam => {
    const k = calm(t);
    if (k <= 0) return c;
    const dx = k * (3 * Math.sin(t * 0.83 + 0.4) + 2 * Math.sin(t * 1.37 + 2.1));
    const dy = k * (2.5 * Math.sin(t * 0.71 + 1.3) + 1.5 * Math.sin(t * 1.53));
    return { ...c, x: c.x + dx / c.z, y: c.y + dy / c.z, z: c.z * (1 + k * 0.004 * Math.sin(t * 0.57 + 0.8)) };
  };
  const memo = new Map<number, Cam>();
  const camAt = (t: number): Cam => {
    const key = Math.round(t * 1000);
    const hit = memo.get(key);
    if (hit) return hit;
    const c = breathe(camRaw(t), t);
    if (memo.size > 400) memo.clear();
    memo.set(key, c);
    return c;
  };

  /** 跟着她跑、盯着公文包往下坠时背景拖多长（设计像素，横、竖）：画面的速度 ÷ 48 */
  const trackSmear = (t: number): V2 => {
    if (t < T.her || t >= T.slam) return [0, 0];
    const a = camAt(t);
    const b = t - 1 / 30 < T.her ? camAt(t + 1 / 30) : camAt(t - 1 / 30);
    // 摇上去看他那一段拖影减半（摇得快，全拖的话糊成一片）
    const k = ((a.z * 30) / 48) * (t > T.slip0 && t < T.slip0 + SLIP_UP ? 0.5 : 1);
    return [(a.x - b.x) * k, (a.y - b.y) * k];
  };
  const shakeAt = (t: number): [number, number] => {
    let k = 9 * kick(t, T.burn, 0.12) + 42 * kick(t, T.slam, 0.14) + 8 * kick(t, T.grab, 0.1) + 22 * kick(t, T.land, 0.1) + 6 * kick(t, T.drum, 0.12);
    for (const bt of BURN_BEATS) k += (bt === 31 ? 11 : 4) * kick(t, T.beat(bt), 0.1);
    return shake(t, k);
  };

  // 光里的女人：像在水里，手臂一节一节地晚一点摆（肩 → 肘 → 手腕），腿慢慢地踢，慢、舒展
  const womanPose = (t: number) => {
    const s = (f: number, p: number) => Math.sin(t * f + p);
    const fw = 2.4;
    return figurePose(
      {
        ...WOMAN_POSE,
        wind: 1.5,
        rot: -2 + 2.5 * s(1.1, 0),
        lean: -6 + 2 * s(0.9, 1),
        neck: 26 + 3 * s(1.2, 2),
        shoulderL: -96 + 7 * s(fw, 0),
        elbowL: -20 + 10 * s(fw, -0.9),
        wristL: -16 + 14 * s(fw, -1.8),
        shoulderR: 158 - 5 * s(fw * 0.9, 1),
        elbowR: 14 - 8 * s(fw * 0.9, 0.1),
        wristR: 10 - 12 * s(fw * 0.9, -0.8),
        ...legL(-4 + 5 * s(2.0, 0.4), -62 - 8 * s(2.0, -0.5), -64),
        ...legR(10 + 5 * s(2.0, 2.4), -16 - 6 * (1 + s(2.0, 1.5)), -66),
      },
      t,
      WOMAN_LOOK,
    );
  };
  // 满天往上飘的人：同一种慢慢的摆，各人错开
  const floatPose = (spec: CastSpec, t: number, ph0: number) => {
    const s = (f: number, p: number) => Math.sin(t * f + ph0 + p);
    return figurePose(
      {
        ...FLOAT_POSE,
        wind: WIND_SKY,
        rot: 8 * s(0.7, 0),
        neck: 18 + 4 * s(0.9, 1),
        shoulderL: -110 + 10 * s(1.3, 0),
        elbowL: -20 + 12 * s(1.3, -0.9),
        shoulderR: 104 - 10 * s(1.2, 1),
        elbowR: 22 - 12 * s(1.2, 0.1),
        ...legL(-6 + 6 * s(1.5, 0.3), -30 - 8 * (1 + s(1.5, -0.6)), -60),
        ...legR(6 + 6 * s(1.5, 2.2), -40 - 8 * (1 + s(1.5, 1.4)), -60),
      },
      t + ph0,
      lookOf(spec),
    );
  };
  /** 一个往上飘的人：身上一团暖光（远看像灯，近了才看出是人）；太小时画成剪影 */
  const drawFloater = (g: CanvasRenderingContext2D, p: Floater, y: number, t: number, zl: number) => {
    const hpx = 590 * p.k * zl;
    // 离白越近，身上的光越亮（被吸进去的人最后那一下最亮）
    const near = p.tb < 1e8 ? clamp01(1 - (y - Y_WHITE) / 900) : 0.35 * clamp01(1 - (y - Y_WHITE) / 5000);
    drawGlow(g, p.x, y - 590 * p.k * 0.45, 590 * p.k * (1.1 + 0.6 * near) + 26 / zl, 0.45 + 0.45 * near);
    if (hpx < 150) drawSilhouette(g, p.x, y, 590 * p.k * p.spec.scale, t, p.ph, 0.85, "104,70,88");
    else {
      g.save();
      g.translate(p.x, y);
      g.scale(p.k, p.k);
      drawPerson(g, p.spec, floatPose(p.spec, t, p.ph), 0, 280 * p.spec.scale, zl * p.k);
      g.restore();
    }
  };

  // ——— 每一段的光：暗角、暖光、背景虚一点（推近成近景时，背景淡一点、像虚了焦） ———
  const lookAt = (t: number, cam: Cam) => {
    // 暗角：他飘着（紧张）、险的时候收一点；砖亮起来时松开；全城敞开
    let vig = 0.12;
    vig += 0.1 * fade(t, T.cut, T.cut + 0.3) * (1 - fade(t, T.her - 0.05, T.her + 0.05));
    vig += 0.08 * fade(t, T.drop, T.slam) * (1 - fade(t, T.slam + 0.2, T.slam + 0.6));
    vig += 0.12 * fade(t, T.land + 0.3, T.pull) * (1 - fade(t, T.take, T.take + 0.5));
    vig -= 0.1 * fade(t, T.r0, T.wide);
    if (t < T.cut) vig = 0.04;
    const warm = 0.9 + 0.25 * fade(t, T.take, T.take + 0.5) * (1 - fade(t, T.walk0 + 1, T.walk0 + 2.5));
    const haze = 0.32 * clamp01((cam.z - 1.6) / 0.6) * (t > T.land ? 1 : 0);
    // 扎进哑铃店以后：第二幕这一场的光（lib/shop.ts，两边一样）
    if (t > T.end) {
      const s = shopLook(t);
      return { vig: s.vig, warm: s.warm, haze };
    }
    return { vig: Math.max(0, vig), warm, haze };
  };

  // ——— 画一帧 ———
  const drawFrame = (g: CanvasRenderingContext2D, t: number) => {
    const cam = camAt(t);
    const sh = shakeAt(t);
    const zl = (D = 1) => cam.z / D;
    const look = lookAt(t, cam);
    g.setTransform(1, 0, 0, 1, 0, 0);
    drawSky(g, base, cam);
    // 拉开到整座城上：远处天际线后面一层暖金色的余晖，远处的楼衬成剪影
    drawAfterglow(g, base, cam, clamp01((0.62 - cam.z) / 0.3));
    drawCity(
      g,
      base,
      cam,
      t,
      (D) => {
        if (D === 4 || D === 2.2) {
          // 远处天上也有人在往上飘：逆光的小剪影，身上一团暖光
          const v = viewOf(cam, D);
          for (const f of skyFloaters) {
            if (f.D !== D) continue;
            const y = f.y - f.v * t;
            if (f.x < v.x0 - 300 || f.x > v.x1 + 300 || y < v.y0 - 600 || y > v.y1 + 300) continue;
            drawGlow(g, f.x, y - f.h * 0.45, f.h * 0.9, 0.6);
            drawSilhouette(g, f.x, y, f.h, t, f.ph, D === 4 ? 0.45 : 0.65);
          }
        }
        // 对面人行道上低着头慢慢走的路人（蒙在这一层的空气后面，淡、小，不抢他的戏）
        if (D === WALKER_D && t > T.cut - 0.2 && t < T.her) {
          const v = viewOf(cam, D);
          for (const w of walkers) {
            const s = walkerAt(w, t);
            if (s.x < v.x0 - 200 || s.x > v.x1 + 200) continue;
            groundShadow(g, s.x + 14, 100, 0.22);
            drawPerson(g, w.spec, s.pose, s.x, 0, zl(D));
          }
        }
        // 对面人行道上拎着哑铃回家的人（shop.drawWalkers）第一幕不画：镜头在高处时这一层的街面被近处的楼挡着，
        // 他们像走在半空里；落到店门口以后又被最高那栋楼挡住，第二幕里也看不见
        // 全城往上飘的人（每一层画在那一层的空气后面，越远越淡）
        if (t > T.r0 - 0.5 && D > 1) {
          for (const p of crowd) {
            if (layerOf(p.D) !== D) continue;
            const y = crowdY(p, t);
            if (y === null) continue;
            applyCam(g, base, cam, p.D, sh);
            const v = viewOf(cam, p.D);
            if (p.x < v.x0 - 500 || p.x > v.x1 + 500 || y - 800 > v.y1 || y + 400 < v.y0) continue;
            drawFloater(g, p, y, t, zl(p.D));
          }
          applyCam(g, base, cam, D, sh);
        }
      },
      sh,
      { light: 1, haze: look.haze, wide: clamp01((0.62 - cam.z) / 0.3) },
    );
    // 更远处满天的小光点（镜头拉开到 0.6 倍以下才淡进来，扎回街上时淡出）
    {
      const k = clamp01((0.62 - cam.z) / 0.3);
      if (k > 0.01) {
        let lastD = 0;
        for (const p of lanterns) {
          if (p.D !== lastD) {
            applyCam(g, base, cam, p.D, sh);
            lastD = p.D;
          }
          const y = p.y0 - p.v * (t - T.wide);
          const s = cam.z / p.D;
          const [sx, sy] = [W / 2 + (p.x - cam.x) * s, H / 2 + (y - cam.y) * s];
          if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) continue;
          const tw = 0.75 + 0.25 * Math.sin(t * 2.3 + p.ph * 3);
          drawGlow(g, p.x, y - p.h * 0.45, p.h * 1.25 + 9 / s, p.a * tw * k);
          if (p.h * s > 4.5) drawSilhouette(g, p.x, y, p.h, t, p.ph, 0.55 * k, "112,76,94");
        }
      }
    }
    applyCam(g, base, cam, 1, sh);
    const view = viewOf(cam, 1);
    // 最高那栋楼（她住在顶层）、老钟家（一楼窗后是老钟）
    if (TOWER.x < view.x1 && TOWER.x + TOWER.w > view.x0) {
      drawBlock(g, TOWER, cam, 1, 2, 3.2, t);
      drawBlockGlow(g, TOWER, cam, 1);
      if (view.y1 > TOWER_ROOF - 600 && view.y0 < TOWER_ROOF + 200) drawRoof(g, t);
    }
    // 楼脚的哑铃店和门口排队的人：一直在（用户 2026-10-20：原来 16.0 以后才画，全城远景里左下角突然冒出来），
    // 镜头升起来时跟着楼一起露出来；街上的镜头看不到这一段，前面的画面不变
    const shopSeen = SHOP_SPAN.x0 < view.x1 && SHOP_SPAN.x1 > view.x0;
    if (shopSeen) shop.drawFront(g, t);
    for (const b of NEIGHBORS) {
      if (b.x > view.x1 + 50 || b.x + b.w < view.x0 - 50) continue;
      drawBlock(g, b, cam, 1, 2, 3.2, t);
      drawBlockGlow(g, b, cam, 1);
    }
    if (HOUSE.x0 < view.x1 + 200 && HOUSE.x1 > view.x0 - 200) {
      drawHouse(g, HOUSE, t);
      const W_ = HOUSE.win;
      if (W_.x + W_.w / 2 > view.x0 && W_.x - W_.w / 2 < view.x1) {
        const z = zhongMove(t);
        g.save();
        g.beginPath();
        g.rect(W_.x - W_.w / 2, W_.top, W_.w, W_.sill - W_.top);
        g.clip();
        drawPerson(g, OLD, z.pose, W_.x - 20, -10, zl(), { hold: { L: cupHold } });
        g.restore();
      }
      drawHouseWindowFront(g, HOUSE);
    }
    drawStreet(g, cam);
    if (t > T.end) {
      drawShopShade(g, base, t);
      applyCam(g, base, cam, 1, sh);
    }
    if (shopSeen) {
      drawShopSpill(g);
      shop.drawShadows(g, t);
      shop.drawPeople(g, t, cam.z);
    }
    // 跟着她跑：镜头横着走得很快，背景按 1/48 秒快门拖一下；盯着公文包往下坠时竖着拖。人物、公文包画在拖影后面，保持清楚
    const [smx, smy] = trackSmear(t);
    if (Math.hypot(smx, smy) > 3) {
      hctx.setTransform(1, 0, 0, 1, 0, 0);
      hctx.clearRect(0, 0, width, height);
      hctx.drawImage(g.canvas, 0, 0);
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      const n = 9;
      const px = (smx * width) / W;
      const py = (smy * height) / H;
      for (let i = 1; i < n; i++) {
        g.globalAlpha = 1 / (i + 1);
        g.drawImage(hbuf, (i / (n - 1) - 0.5) * px, (i / (n - 1) - 0.5) * py);
      }
      g.restore();
      applyCam(g, base, cam, 1, sh);
    }
    const bc = caseAt(t);
    const c = chenAt(t);
    const zr = zRootAt(t);
    // ——— 地上的影子：人站在地上才有分量（离地越高越淡、越小）；掉下来的公文包的影子越落越实——先告诉观众它会砸在哪 ———
    if (t >= T.cut) {
      if (c.x > view.x0 - 300 && c.x < view.x1 + 300) {
        const j = jointsOf(c.pose);
        const h = Math.max(0, -(c.y + Math.max(j.ankleL[1], j.ankleR[1])) - 64);
        groundShadow(g, c.x + (j.ankleL[0] + j.ankleR[0]) / 2 + 16, 125 / (1 + h / 260), 0.3 / (1 + h / 200));
      }
      const zj = castJoints(ZHOU, zr.pose);
      const zh = Math.max(0, -(zr.y + Math.max(zj.ankleL[1], zj.ankleR[1])) - 60);
      const sit = t >= T.land;
      groundShadow(g, sit ? zr.x + 80 : zr.x + (zj.ankleL[0] + zj.ankleR[0]) / 2 + 16, sit ? 175 : 115 / (1 + zh / 260), sit ? 0.3 : 0.3 / (1 + zh / 200), sit ? 6 + ZY_SIT : 6);
      if (t >= T.drop) {
        const bh = Math.max(0, -(bc.y + BELL_R));
        const near = Math.max(0, 1 - bh / 900);
        groundShadow(g, bc.x + 10, 70 + 40 * near, t < T.slam ? 0.38 * near * near : 0.3);
      }
      if (t > kid0 - 0.2) {
        const k = kidAt(t);
        if (k.x > view.x0 - 300 && k.x < view.x1 + 300) {
          const kj = castJoints(STONE, k.pose);
          const kh = Math.max(0, -Math.max(kj.ankleL[1], kj.ankleR[1]) - 40);
          groundShadow(g, k.x + (kj.ankleL[0] + kj.ankleR[0]) / 2 + 12, 80 / (1 + kh / 200), 0.28 / (1 + kh / 150), 6 + KID_Y);
        }
      }
    }
    const brickPos = { p: null as V2 | null };
    // 砖落进手里亮起来
    const warm = () => E.out(ph(t, T.take - 0.02, T.take + 0.45));
    const worldM = g.getTransform();
    const bf = briefAt(t);
    const caseHoldFn: HoldFn = (cc, _hand, _mir, info) => {
      if (info.layer !== "back") return;
      cc.save();
      cc.setTransform(worldM);
      drawBriefcase(cc, bf.x, bf.y, bf.r, 0);
      cc.restore();
    };
    const bellHoldFn: HoldFn = (cc, _hand, _mir, info) => {
      if (info.layer !== "back") return;
      cc.save();
      cc.setTransform(worldM);
      drawBell(cc, bc, cam.z);
      cc.restore();
    };
    const late: (() => void)[] = [];
    // 小石头：摸头时画在她身子和她近处那只手之间
    let kidDrawn = false;
    const drawKid = () => {
      kidDrawn = true;
      const k = kidAt(t);
      if (k.x > view.x0 - 300 && k.x < view.x1 + 300) drawPerson(g, STONE, k.pose, k.x, KID_Y, zl());
    };
    const pat = patAt(t);
    const drawHer = () => {
      if (c.x < view.x0 - 400 || c.x > view.x1 + 400) return;
      const hasBrick = t >= T.pull && t < T.take;
      const kidBetween = pat?.front
        ? (cc: CanvasRenderingContext2D) => {
            cc.save();
            cc.setTransform(worldM);
            drawKid();
            cc.restore();
          }
        : undefined;
      g.save();
      g.translate(c.x, c.y);
      drawChengtuo(g, pat ? pat.pose : c.pose, { line: 1 / Math.sqrt(cam.z), hold: hasBrick ? { L: brickHold(() => 0, brickPos, late) } : undefined, beforeFrontArms: kidBetween });
      g.restore();
    };
    const drawHim = () => {
      if (t < T.cut - 0.1) return;
      if (zr.x < view.x0 - 500 || zr.x > view.x1 + 500) return;
      drawPerson(g, ZHOU, zr.pose, zr.x, zr.y, zl(), t >= T.take ? { hold: { L: brickHold(warm, brickPos, late) } } : { hold: { L: t < T.drop ? bellHoldFn : undefined, R: t < CASE_REL ? caseHoldFn : undefined } });
    };
    if (t >= T.drop) {
      // 掉得越快、身后拖的几道速度线越长
      if (t < T.slam) {
        const v = G * (t - T.drop);
        const len = Math.min(320, v * 0.12);
        if (len > 20) {
          g.save();
          g.strokeStyle = "rgba(90,64,60,0.32)";
          g.lineCap = "round";
          g.lineWidth = 4;
          g.beginPath();
          for (const dx of [-BELL_R * 0.8, 0, BELL_R * 0.8]) {
            const top = bc.y - BELL_R - 18;
            g.moveTo(bc.x + dx, top);
            g.lineTo(bc.x + dx, top - len * (dx === 0 ? 1 : 0.7));
          }
          g.stroke();
          g.restore();
        }
      }
      // 砸裂的街面（坑和裂缝）在哑铃底下
      drawDent(g, X_LAND, T.slam, t, cam.z);
      if (t >= T.slam) drawBell(g, bc, cam.z);
    }
    // 公文包被拽回地面那一下脱手，掉在他身边躺着
    if (t >= CASE_REL) drawBriefcase(g, bf.x, bf.y, bf.r, 0);
    // 落地以后他坐在她前面（靠镜头一点）：先画她，再画他；她往前走时从他身后经过。托着的砖等两个人都画完再画
    if (t >= T.land) {
      drawHer();
      drawHim();
    } else {
      drawHim();
      drawHer();
    }
    for (const f of late) f();
    if (t >= T.drop && t < T.slam) drawBell(g, bc, cam.z);
    // 小石头
    if (t > kid0 - 0.2 && !kidDrawn) drawKid();
    // 尘土：砸地、刹车、落地
    const puff = (x0: number, t0: number, n: number, seed: number, dur: number, spread: number, rise: number, size: number, alpha: number) => {
      const a = t - t0;
      if (a < 0 || a > dur) return;
      const r = seeded(seed);
      for (let i = 0; i < n; i++) {
        const dir = r() < 0.5 ? -1 : 1;
        const sp = spread * (0.4 + r());
        const x = x0 + dir * (30 + sp * (1 - Math.exp(-a / 0.25)) * 0.6);
        const y = -8 - (rise * (0.4 + r())) * (1 - Math.exp(-a / 0.2)) + 40 * a * a;
        const s = (size * (0.5 + r())) * (0.6 + a);
        g.globalAlpha = Math.max(0, alpha * (1 - a / dur));
        g.fillStyle = r() < 0.5 ? "#e0d0bf" : "#cbb9a8";
        g.beginPath();
        g.arc(x, y, s, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    };
    puff(X_LAND, T.slam, 16, 8, 1.2, 260, 80, 16, 0.5);
    puff(c.x - 150, T_BRAKE, 10, 13, 0.6, 120, 50, 12, 0.45);
    puff(chenAt(T.launch).x, T.launch, 10, 17, 0.6, 140, 40, 13, 0.4);
    if (t >= T.land) puff(chenAt(T.land).x, T.land, 14, 19, 0.9, 200, 70, 16, 0.45);
    // 近景：比人离镜头更近的一层（扎进哑铃店以后不画：路灯杆会横在店门口）
    if (t >= T.cut && t <= T.end) {
      applyCam(g, base, cam, FG_D, sh);
      const fv = viewOf(cam, FG_D);
      for (const f of FOREGROUND) {
        if (f.x < fv.x0 - 300 || f.x > fv.x1 + 300) continue;
        drawForegroundItem(g, f.kind, f.x, t);
      }
      applyCam(g, base, cam, 1, sh);
    }
    // 离镜头近的飘着的人（D ≤ 1）：镜头升起来时从旁边掠过去；一拍一个被白吸进去的人也在这一层
    if (t > T.r0 - 0.3) {
      for (const p of crowd) {
        if (p.D > 1) continue;
        const y = crowdY(p, t);
        if (y === null) continue;
        applyCam(g, base, cam, p.D, sh);
        const v = viewOf(cam, p.D);
        if (p.x < v.x0 - 500 || p.x > v.x1 + 500 || y - 800 > v.y1 || y + 400 < v.y0) continue;
        drawFloater(g, p, y, t, zl(p.D));
      }
      applyCam(g, base, cam, 1, sh);
    }
    drawMotes(g, cam, t, 1, 1, 0.85);
    applyCam(g, base, cam, 0.7, sh);
    drawMotes(g, cam, t + 3.1, 0.7, 1.8, 0.5);
    // 光：斜照进来的暖光（离白越近越淡）
    drawSunbeams(g, base, cam, t, clamp01(1 - (-cam.y - 3000) / 4000));
    // 砖暖起来：只把亮处提暖（soft-light），砖本身一团光
    if (brickPos.p && t >= T.take - 0.05) {
      const w = warm();
      const [bx, by] = brickPos.p;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.save();
      g.globalCompositeOperation = "soft-light";
      const R = 620 * (width / W) * (0.6 + 0.4 * w);
      const gr = g.createRadialGradient(bx, by, 0, bx, by, R);
      gr.addColorStop(0, `rgba(255,170,80,${0.9 * w})`);
      gr.addColorStop(1, "rgba(255,170,80,0)");
      g.fillStyle = gr;
      g.fillRect(bx - R, by - R, R * 2, R * 2);
      g.restore();
      g.save();
      g.globalCompositeOperation = "lighter";
      const r2 = 150 * (width / W);
      const pulse = 1 + 0.06 * Math.sin(t * 5);
      const g2 = g.createRadialGradient(bx, by, 0, bx, by, r2 * pulse);
      g2.addColorStop(0, `rgba(255,196,120,${0.42 * w})`);
      g2.addColorStop(1, "rgba(255,196,120,0)");
      g.fillStyle = g2;
      g.fillRect(bx - r2 * 2, by - r2 * 2, r2 * 4, r2 * 4);
      g.restore();
    }
    drawGrade(g, base, grain, look.warm, look.vig);
    // 白（不在纸上：画在颗粒之后）
    drawWhite(g, base, cam, t, 0);
    // 拉开到整座城上：白往下打下来几道斜斜的光，穿过满天的人和城（扎回街上时退掉）
    drawRays(g, base, cam, t, clamp01((0.62 - cam.z) / 0.3));
    // 光里的女人画在白的光晕前面（不被眩光冲淡），碰到白以后从头顶开始散成光和灰
    if (t < T.cut) {
      applyCam(g, base, cam, 1, sh);
      if (t < T.burn + BURN_DUR + 0.05) {
        const h = womanHip(t);
        const pose = womanPose(t);
        const rootY = h[1] - (pose.hip?.[1] ?? -280.5) * WOMAN_SCALE;
        drawGlow(g, h[0], h[1] - 230, 620, 0.5);
        g.save();
        if (t > T.burn) {
          const line = W_HEAD - 30 + (W_FEET + 60 - W_HEAD) * E.in2((t - T.burn) / BURN_DUR);
          g.beginPath();
          g.rect(h[0] - 2000, line, 4000, 4000);
          g.clip();
        }
        g.save();
        g.translate(h[0], rootY);
        g.scale(WOMAN_SCALE, WOMAN_SCALE);
        drawFigure(g, pose, WOMAN_LOOK, { line: 1 / Math.sqrt(zl()) });
        g.restore();
        g.restore();
        // 眼泪往上飘（这里什么都往上飘）
        if (t < T.burn + 0.05) {
          const hj = figureJoints(pose, WOMAN_LOOK).head;
          const head = [hj[0] * WOMAN_SCALE, hj[1] * WOMAN_SCALE];
          g.fillStyle = "rgba(170,214,240,0.9)";
          for (let i = 0; i < 6; i++) {
            const k = (t * 0.7 + i / 6) % 1;
            const side = i % 2 ? 1 : -1;
            // 从两只眼角冒出来、往上飘，越飘越淡
            g.globalAlpha = Math.min(1, k * 8) * (1 - k) ** 0.8;
            const r = 3.2 + 2 * Math.min(1, k * 4);
            g.beginPath();
            g.ellipse(h[0] + head[0] - 2 + side * 28 + Math.sin(t * 2.3 + i) * 6 * k, rootY + head[1] + 28 - k * 230, r * 0.75, r, 0, 0, Math.PI * 2);
            g.fill();
          }
          g.globalAlpha = 1;
        }
      }
      // 她化成的光：先是彩色的碎光（像肥皂泡的颜色），散开以后变成淡紫灰的灰，慢慢往下落（白底上也看得见）
      if (t > T.burn - 0.01 && t < T.cut) {
        g.save();
        for (const p of ashBits) {
          const a = t - p.t0;
          if (a < 0) continue;
          const k = 1 - Math.exp(-a / 0.4);
          const x = p.x + p.vx * 0.4 * k + 30 * Math.sin(a * 2 + p.hue);
          const y = p.y + p.vy * 0.4 * k + 60 * a * a;
          const r = p.s * 0.36 * (1 - 0.35 * Math.min(1, a));
          const tw = 0.7 + 0.3 * Math.sin(a * 7 + p.ph);
          const alpha = Math.max(0, Math.min(1, 1.5 - a * 0.4)) * tw;
          const toAsh = clamp01((a - 0.15) / 0.5);
          g.beginPath();
          g.arc(x, y, r, 0, Math.PI * 2);
          if (toAsh < 1) {
            g.globalAlpha = alpha * (1 - toAsh);
            g.fillStyle = `hsl(${p.hue}, 72%, 78%)`;
            g.fill();
          }
          if (toAsh > 0) {
            g.globalAlpha = alpha * toAsh * 0.85;
            g.fillStyle = "#c4abbf";
            g.fill();
          }
        }
        g.restore();
      }
      drawBurst(g, base, cam, WX, W_HEAD, t - T.burn, 1.3);
    }
    // 碰到白的光圈、闪一下
    let flash = 0.5 * kick(t, T.burn, 0.14);
    for (const bt of BURN_BEATS) flash += (bt === 31 ? 0.3 : 0.08) * kick(t, T.beat(bt), 0.13);
    if (flash > 0.001) {
      g.setTransform(base);
      g.fillStyle = `rgba(255,251,244,${Math.min(1, flash)})`;
      g.fillRect(0, 0, W, H);
    }
    for (const p of crowd) {
      if (p.tb > 1e8 || t < p.tb) continue;
      const big = p.tb === T.beat(31) ? 1.7 : 1;
      drawBurst(g, base, cam, p.x, whiteEdge(p.x, p.tb), t - p.tb, 0.72 * big);
      drawAshFall(g, base, cam, p.x, whiteEdge(p.x, p.tb), t - p.tb, 0.95 * big);
    }
  };

  return {
    canvas,
    render(wallT) {
      const t = wallT;
      // 竖向拖影：往下甩、落到他身上的时候按每帧镜头的竖向位移拖（画面像素）；切镜头那一帧按切过去以后的镜头算
      const t0 = wallT - 1 / 30;
      const cutFrame = t >= T.cut && t0 < T.cut;
      const c1 = camAt(t);
      const c0 = cutFrame ? camAt(t + 1 / 30) : camAt(t0);
      const dy = (cutFrame ? c0.y - c1.y : c1.y - c0.y) * c1.z;
      const falling = t > T.whip && t < T.cut + 0.25;
      const blur = !falling ? 0 : Math.min(260, Math.max(0, Math.abs(dy) - 30) * 0.9);
      // 扎进哑铃店：按每帧镜头的推近和位移拖一下（从这一帧的样子往上一帧的样子叠 9 份，1/48 秒快门）
      const dive = t > T.end && t < SHOP_T.land + 0.05 ? (() => {
        const a = camAt(t);
        const p = camAt(t - 1 / 30);
        const r = a.z / p.z;
        // 这一帧画面上的一点在上一帧在哪：s0 = A·s1 + B
        const A = 1 / r;
        const Bx = W / 2 - (W / 2 + (p.x - a.x) * a.z) / r;
        const By = H / 2 - (H / 2 + (p.y - a.y) * a.z) / r;
        return { A, Bx, By, k: Math.abs(1 - A) + Math.hypot(Bx, By) / 1500 };
      })() : null;
      if (dive && dive.k > 0.004) {
        drawFrame(bctx, t);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.drawImage(buf, 0, 0);
        const n = 9;
        for (let i = 1; i < n; i++) {
          const l = (0.5 * i) / (n - 1);
          const m = 1 + l * (dive.A - 1);
          ctx.globalAlpha = 1 / (i + 1);
          ctx.setTransform(m, 0, 0, m, (l * dive.Bx * width) / W, (l * dive.By * height) / H);
          ctx.drawImage(buf, 0, 0);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
      } else if (blur < 4) {
        drawFrame(ctx, t);
      } else {
        drawFrame(bctx, t);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.drawImage(buf, 0, 0);
        const n = 9;
        const px = (blur * height) / H;
        for (let i = 1; i < n; i++) {
          ctx.globalAlpha = 1 / (i + 1);
          ctx.drawImage(buf, 0, (i / (n - 1) - 0.5) * px);
        }
        ctx.globalAlpha = 1;
      }
      for (const n of notes) drawNote(ctx, base, n, wallT);

    },
    dispose() {
      canvas.width = canvas.height = 1;
      buf.width = buf.height = 1;
      hbuf.width = hbuf.height = 1;
    },
  };
}
