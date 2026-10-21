// 副歌一②「我们的周围并非没光亮 / 只是太耀眼将我们灼伤」（43.92–47.92）。字：我 43.92 们 44.19 的 44.37 周 44.46 围 44.76 并 44.85 非 45.06
// 没 45.36 光 45.45 亮 45.69；只 45.93 是 46.17 太 46.35 耀 46.47 眼 46.68 将 46.83 我 47.07 们 47.34 灼 47.46 伤 47.67。小节线 44.018、46.019、48.02。
// 2026-10-21 用户重做（「这里不要继续展示城市全景了，直接切下一个剧情，这句时间给下个剧情，小石头飘了起来，妈妈用红绳拉着他，
// 因为这里需要更多时间表达」）：43.92 从整座城的夜里直接切到天亮的街上（最高那栋楼右边那栋五层楼前）。小石头已经离了地，
// 在妈妈身边往上飘，仰着头冲天上的光笑；妈妈攥着拴在他脚踝上的红绳，仰头看着他。「周」红绳一下绷直（他一顿）；「围」「非」她两把往下拽，
// 拽一下他沉一下、又飘上去；「光」拽不住了，红绳在手腕上绕一圈，两只手被拽到头顶，身子往后坐。「只是」天上一道光照下来，「太耀眼」
// 他闭着眼张开手迎着光；「将」她被拖得踮起脚，「灼」她的脚离了地——她也是轻的（故事「二 她飘得最高」）。
// 镜头在 lib/streetcam.ts（②到⑥一个镜头）。

import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type Angles, type MoveKey, type PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { beatAt } from "@frame/engine/tempo";
import { E, ph } from "./cam";
import { type Block, INK, drawGlow } from "./world";
import { type House } from "./props";
import { ARMS, LIMP, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";

type V2 = [number, number];

export const DAWN_T = {
  /** 2026-10-21 用户：「这里不要继续展示城市全景了，直接切下一个剧情，这句时间给下个剧情」——43.92 直接切到天亮的街上 */
  start: 43.92,
  /** 天亮：切过来是刚亮的清晨（还有一点蓝），「并非没光亮」暖光一点点亮起来 */
  sky0: 43.92,
  sky1: 45.5,
  lights0: 43.92,
  lights1: 45.2,
  /** 天上的网收回窗里（画面外） */
  reel0: 44.0,
  reel1: 45.3,
  /** 「周」那一拍：拴在他脚踝上的红绳一下绷直（拍子） */
  taut: beatAt(89),
  /** 「围」「非」她两把往下拽（拽一下他沉一下，又飘上去） */
  pull1: 44.76,
  pull2: 45.06,
  /** 「光」拽不住了：红绳在手腕上绕一圈，两只手被拽到头顶，身子往后坐 */
  wrap: 45.45,
  /** 「只是」天上那道光照下来，「太耀眼」最亮 */
  beam: 45.93,
  dazzle: 46.35,
  /** 「将」她被拖得踮起脚 */
  drag: 46.83,
  /** 「灼」她的脚离了地 */
  lift: 47.46,
  end: 47.92,
};

/** [天黑了多少, 城里的窗亮了多少]：①整段是夜；切到街上是刚亮的清晨，暖光一点点亮起来（还留一点粉） */
export function dawnSky(t: number): [number, number] {
  const T = DAWN_T;
  if (t < T.start) return [1, 1];
  const u = E.io(ph(t, T.sky0, T.sky1));
  return [0.5 - 0.32 * u, 0.45 - 0.4 * Math.pow(ph(t, T.lights0, T.lights1), 0.8)];
}
/** 夜里人身上那团光：天亮了就没了 */
export const nightGlow = (t: number) => (t < DAWN_T.start ? 1 : 0);

// ——— 街上：最高那栋楼右边那栋五层楼前（第一幕老钟家左边那栋），和第一幕同一条街 ———
/** 第一幕老钟家（一楼窗后是老钟）和它左右的邻居：和 scenes/act1.ts 里的一样（老钟家 −2025…−1225） */
export const ZHONG_HOUSE: House = { x0: -2025, x1: -1225, top: -1480, win: { x: -1545, w: 330, sill: -300, top: -660 } };
export const ZHONG_NEIGHBORS: Block[] = [
  { x: ZHONG_HOUSE.x1 + 60, w: 280, floors: 1, fh: 300, wall: "#e8c9a6", wallShade: "#d9b690", seed: 311, shop: "#c96a52", plainRoof: true },
  { x: ZHONG_HOUSE.x0 - 60 - 560, w: 560, floors: 5, fh: 230, wall: "#e6b39d", wallShade: "#d69f88", seed: 312, shop: "#6f8f86" },
];

export const STONE = CAST.小石头;
export const MOM = CAST.小石头的妈妈;
/** 妈妈站在哪（根的 x）：五层楼的铺面前 */
export const MOM_X = -2330;

export function pose(lean: number, rest: Omit<Angles, "lean">, arms: (lean: number) => Angles): Angles {
  return { lean, ...rest, ...arms(lean) };
}
export const MOM_POSES = {
  /** 牵着红绳（两只手攥在胸前），仰头看着往上飘的他，担心 */
  牵绳: pose(0, { face: -0.2, ground: false, ...legR(6, -6, 0), ...legL(-6, -4, 0), neck: 26, expression: "担心", lookX: 0.2, lookY: -0.9 }, (l) => ({
    ...armL(30, 70, 0, "grip", l),
    ...armR(40, 64, 0, "grip", l),
  })),
  /** 往下拽：身子往后坐、前脚蹬住，咬着牙 */
  拽: pose(-10, { face: -0.2, ground: false, ...legR(28, -18, 0), ...legL(-18, -22, 0), neck: 16, expression: "使劲", teeth: 0.5, lookX: 0.15, lookY: -0.9 }, (l) => ({
    ...armL(40, 60, 0, "grip", l),
    ...armR(50, 50, 0, "grip", l),
  })),
  /** 拽不住了：红绳在手腕上绕一圈，两只手被拽到头顶（攥在头正上方，脸露在两条胳膊中间），身子往后坐，前脚蹬住 */
  拽绳: pose(-6, { face: -0.2, ground: false, ...legR(22, -12, 0), ...legL(-16, -14, 0), neck: 28, expression: "使劲", sad: 0.4, lookY: -1 }, (l) => ({
    ...armL(168, 34, 0, "grip", l),
    ...armR(168, 34, 0, "grip", l),
  })),
  /** 被他往上带：脚尖踮起来，身子被拉直 */
  踮脚: pose(-2, { face: -0.2, ground: false, ...legR(8, -4, -34), ...legL(-6, -6, -40), neck: 30, expression: "使劲", sad: 0.5, lookY: -1 }, (l) => ({
    ...armL(172, 24, 0, "grip", l),
    ...armR(172, 24, 0, "grip", l),
  })),
  /** 脚离了地：吊在红绳上，两条腿悬着乱蹬一下（她也是轻的），仰着头一惊 */
  离地: pose(0, { face: -0.2, ground: false, ...legR(16, -36, -40), ...legL(-4, -22, -50), neck: 26, expression: "吓一跳", lookY: -0.9 }, (l) => ({
    ...armL(174, 20, 0, "grip", l),
    ...armR(174, 20, 0, "grip", l),
  })),
};
export const STONE_POSES = {
  /** 飘着：仰着头冲天上的光笑，远处的手伸上去够，腿软软地垂着 */
  飘: pose(-4, { face: 0.6, ground: false, float: 0.15, rot: -6, ...legL(4, -40, -40), ...legR(14, -30, -36), neck: 30, expression: "笑", lookX: 0.2, lookY: -1 }, (l) => ({
    ...armL(40, 40, 0, "open", l),
    ...armR(150, 20, 0, "open", l),
  })),
  /** 红绳一下绷直：拴着的那条腿被扯直，两只手一甩，吓一跳 */
  一顿: pose(2, { face: 0.6, ground: false, float: 0.1, rot: 2, ...legL(-2, -4, -40), ...legR(24, -46, -36), neck: 4, expression: "吓一跳", lookX: -0.2, lookY: 0.6 }, (l) => ({
    ...armL(70, 30, 0, "open", l),
    ...armR(110, 26, 0, "open", l),
  })),
  /** 越飘越高：两只手都伸上去，闭着眼迎着光笑（太耀眼了） */
  够: pose(-6, { face: 0.6, ground: false, float: 0.2, rot: -8, ...legL(2, -30, -44), ...legR(12, -24, -40), neck: 34, expression: "笑", blink: 0.85, lookY: -1 }, (l) => ({
    ...armL(120, 20, 0, "open", l),
    ...armR(160, 16, 0, "open", l),
  })),
};
/** ②她的关键帧（③④⑤ 原样抄过去再往后接，弹簧不跳） */
export const DAWN_MOM_KEYS: MoveKey[] = [
  { t: 43.8, x: 0, p: MOM_POSES.牵绳 },
  { t: DAWN_T.taut - 0.02, p: MOM_POSES.牵绳 },
  { t: DAWN_T.taut + 0.1, ease: "out", p: { ...MOM_POSES.牵绳, expression: "吓一跳" } },
  { t: DAWN_T.pull1 - 0.06, ease: "inOut", p: MOM_POSES.拽 },
  { t: DAWN_T.pull2 + 0.22, p: MOM_POSES.拽 },
  { t: DAWN_T.wrap + 0.24, ease: "inOut", p: MOM_POSES.拽绳 },
  { t: DAWN_T.drag, p: MOM_POSES.拽绳 },
  { t: DAWN_T.drag + 0.32, ease: "inOut", p: MOM_POSES.踮脚 },
  { t: DAWN_T.lift - 0.04, p: MOM_POSES.踮脚 },
  { t: DAWN_T.lift + 0.2, ease: "out", p: MOM_POSES.离地 },
];
/** ②他的关键帧（③④ 原样抄过去再往后接） */
export const DAWN_STONE_KEYS: MoveKey[] = [
  { t: 43.8, x: 0, p: STONE_POSES.飘 },
  { t: DAWN_T.taut - 0.01, p: STONE_POSES.飘 },
  { t: DAWN_T.taut + 0.07, ease: "out", p: STONE_POSES.一顿 },
  { t: DAWN_T.taut + 0.5, ease: "inOut", p: STONE_POSES.飘 },
  { t: DAWN_T.beam - 0.1, p: STONE_POSES.飘 },
  { t: DAWN_T.beam + 0.42, ease: "inOut", p: STONE_POSES.够 },
];
const momMove = live([...DAWN_MOM_KEYS, { t: 49, p: MOM_POSES.离地 }], { look: lookOf(MOM), base: { wind: 0.6 }, idle: true, seed: 41, springs: ARMS, follow: 0 });
const stoneMove = live([...DAWN_STONE_KEYS, { t: 49, p: STONE_POSES.够 }], { look: lookOf(STONE), base: { wind: 0.6 }, idle: true, seed: 43, springs: LIMP, follow: 0 });

/** 妈妈离地多高：「将」踮起脚（踮脚的姿势脚尖往下伸，根往下放一点让脚尖踩在地上），「灼」以后整个人被带起来 */
export const momLift = (t: number) => -22 * E.io(ph(t, DAWN_T.drag, DAWN_T.lift - 0.08)) * (1 - E.out(ph(t, DAWN_T.lift - 0.04, DAWN_T.lift + 0.12))) + 120 * E.in2(ph(t, DAWN_T.lift, DAWN_T.end + 0.4));
/** 她被拖着往前蹭一点（往他底下去） */
export const momSkid = (t: number) => 34 * E.io(ph(t, DAWN_T.drag - 0.2, DAWN_T.lift));
/** 红绳绷直以后，她手上面那一段多长 */
const ROPE_L = 210;
/**
 * 她两只手攥在红绳上的地方（世界坐标）：先在胸前；「周」绷直那一下被拽上去一截；「围」「非」两把往下拽（他跟着沉一下）；
 * 拽不住了，「光」起被拽到头顶（和③开头一样：上面那只离头顶约 175，下面那只约 95）
 */
function grips(t: number, pose: PoseIn, root: V2) {
  const T = DAWN_T;
  const k = MOM.scale;
  const j = castJoints(MOM, pose);
  const chest: V2 = [root[0] + (j.shoulderL[0] + j.shoulderR[0]) / 2, root[1] + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 40];
  const head: V2 = [root[0] + j.head[0], root[1] + j.head[1]];
  const bump = (p: number) => Math.sin(Math.PI * ph(t, p - 0.1, p + 0.18));
  // 手在身子右前方（他在右上方），不挡脸：先在腰前，绷直那一下被拽到头那么高，往下拽两把（拽到腰前），越来越拽不住
  const up = -70 + 170 * E.out(ph(t, T.taut, T.taut + 0.12)) + 150 * E.io(ph(t, T.taut + 0.2, T.wrap)) - 125 * (bump(T.pull1) + bump(T.pull2));
  const o = E.io(ph(t, T.wrap, T.wrap + 0.3));
  const hiC: V2 = [chest[0] + 44, chest[1] - up];
  const loC: V2 = [chest[0] + 26, chest[1] - up + 82];
  const hiH: V2 = [head[0] + 4, head[1] - 175 * k];
  const loH: V2 = [head[0] - 2, head[1] - 95 * k];
  const mixV = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  return { hi: mixV(hiC, hiH, o), lo: mixV(loC, loH, o) };
}
let TAUT_AT: V2 | null = null;
/** 拴在他脚踝上的那一点（世界坐标）：切过来时他已经离地、在她右边飘着，越飘越快；「周」红绳绷直，被拽得一顿、弹两下；之后吊在她手上面 */
function stoneAnkle(t: number, hi: V2): V2 {
  const T = DAWN_T;
  const tied: V2 = [hi[0] + 10 + 8 * Math.sin(t * 1.4), hi[1] - ROPE_L + 6 * Math.sin(t * 2.1)];
  if (t >= T.taut) {
    const d = t - T.taut;
    return [tied[0], tied[1] + 70 * Math.exp(-d / 0.14) * Math.sin(d * 20)];
  }
  TAUT_AT ??= (() => {
    const p = { ...momMove(T.taut).pose };
    return [grips(T.taut, p, [MOM_X, 0]).hi[0] + 10, grips(T.taut, p, [MOM_X, 0]).hi[1] - ROPE_L] as V2;
  })();
  const a0: V2 = [MOM_X + 150, -300];
  const u = Math.pow(ph(t, T.start - 0.3, T.taut), 1.3);
  return [a0[0] + (TAUT_AT[0] - a0[0]) * u, a0[1] + (TAUT_AT[1] - a0[1]) * u];
}

/** 她和他这一刻：姿势、根，两只手攥着红绳（IK），红绳从他脚踝拉下来 */
export function streetAt(t: number) {
  const mp: PoseIn = { ...momMove(t).pose };
  const mRoot: V2 = [MOM_X + momSkid(t), -momLift(t)];
  const k = MOM.scale;
  const { hi, lo } = grips(t, mp, mRoot);
  const loc = (p: V2): V2 => [(p[0] - mRoot[0]) / k, (p[1] - mRoot[1]) / k];
  // 朝左（face < 0）不镜像：局部坐标就是画面方向
  mp.armR = { ...(mp.armR as object), to: loc(hi), ik: 1 } as PoseIn["armR"];
  mp.armL = { ...(mp.armL as object), to: loc(lo), ik: 1 } as PoseIn["armL"];
  const mj = castJoints(MOM, mp);
  const grip: V2 = [mRoot[0] + mj.palmL[0], mRoot[1] + mj.palmL[1]];
  const top: V2 = [mRoot[0] + mj.palmR[0], mRoot[1] + mj.palmR[1]];
  // 他：按脚踝放（红绳拴在近处那只脚踝上）
  const ankle = stoneAnkle(t, top);
  const sp: PoseIn = { ...stoneMove(t).pose };
  const sj = castJoints(STONE, sp);
  const sRoot: V2 = [ankle[0] - sj.ankleL[0], ankle[1] - sj.ankleL[1]];
  return { stone: { pose: sp, root: sRoot, ankle }, mom: { pose: mp, root: mRoot, grip, top } };
}

/**
 * 「太耀眼」：「只是」起天上往下照着他的一道光（越往上越亮、越宽），「太耀眼」最亮，他身上一团亮——他闭着眼往光里去
 * （画在人上面，screen 叠，只提亮）。③妈妈把他拽到怀里、裹上外套，那道光淡掉
 */
export function drawDazzle(g: CanvasRenderingContext2D, t: number) {
  const T = DAWN_T;
  const fade = 1 - E.io(ph(t, T.end + 0.08, T.end + 0.55));
  if (t < T.beam - 0.05 || fade <= 0.002) return;
  const s = streetAt(Math.min(t, T.end));
  const k = fade * (0.55 * E.io(ph(t, T.beam - 0.05, T.beam + 0.3)) + 0.45 * E.io(ph(t, T.beam + 0.2, T.dazzle + 0.1))) * (0.88 + 0.12 * Math.sin(t * 3.1));
  const head: V2 = [s.stone.root[0], s.stone.root[1] - 330];
  g.save();
  g.globalCompositeOperation = "screen";
  const top = head[1] - 2600;
  const beam = new Path2D();
  beam.moveTo(head[0] - 520, top);
  beam.lineTo(head[0] + 380, top);
  beam.lineTo(head[0] + 120, head[1] + 260);
  beam.lineTo(head[0] - 140, head[1] + 260);
  beam.closePath();
  const gr = g.createLinearGradient(0, top, 0, head[1] + 260);
  gr.addColorStop(0, `rgba(255,248,232,${0.6 * k})`);
  gr.addColorStop(0.75, `rgba(255,240,220,${0.24 * k})`);
  gr.addColorStop(1, "rgba(255,240,220,0)");
  g.fillStyle = gr;
  g.fill(beam);
  g.restore();
  drawGlow(g, head[0] + 10, head[1] + 60, 420, 0.6 * k);
}

/** 画街上的两个人和红绳（人这一层，世界坐标）：红绳从他脚踝拉到她手里（绷直以前松着、垂成一个弯），多出来的一截在她手腕上绕一圈、垂下来 */
export function drawStreet2(g: CanvasRenderingContext2D, t: number, z: number) {
  const T = DAWN_T;
  const s = streetAt(t);
  const lw = 1 / Math.sqrt(Math.max(0.3, z));
  // 地上她的一小块影子（离地以后淡下去、缩小）；他离地不高时脚下也有一小块
  const lift = -s.mom.root[1];
  g.save();
  g.fillStyle = `rgba(96,62,70,${0.22 * Math.max(0, 1 - lift / 200)})`;
  g.beginPath();
  g.ellipse(s.mom.root[0] + 10, 6, 150 * (1 - lift / 600), 22, 0, 0, Math.PI * 2);
  g.fill();
  const sh = Math.max(0, 1 + s.stone.ankle[1] / 700);
  if (sh > 0.01) {
    g.fillStyle = `rgba(96,62,70,${0.16 * sh})`;
    g.beginPath();
    g.ellipse(s.stone.ankle[0] + 6, 6, 90 * (0.5 + 0.5 * sh), 14, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  drawPerson(g, MOM, s.mom.pose, s.mom.root[0], s.mom.root[1], z);
  // 红绳：脚踝 → 她上面那只手（绷直以前松着垂成一个弯，绷直那一下抖两下）→ 下面那只手；多出来的一截从下面那只手垂到地上
  const A = s.stone.ankle;
  const U = s.mom.top;
  const sag = 150 * Math.pow(1 - ph(t, T.start - 0.3, T.taut), 1.4);
  const d = t - T.taut;
  const buzz = d > 0 ? 26 * Math.exp(-d / 0.1) * Math.sin(d * 60) : 0;
  const path = new Path2D();
  path.moveTo(A[0], A[1]);
  path.quadraticCurveTo((A[0] + U[0]) / 2 + 20 + buzz, Math.max(A[1], U[1]) + sag, U[0], U[1]);
  path.lineTo(s.mom.grip[0], s.mom.grip[1]);
  // 拽不住以后在下面那只手腕上绕一圈
  if (t > T.wrap) {
    path.moveTo(s.mom.grip[0] + 13, s.mom.grip[1] + 14);
    path.ellipse(s.mom.grip[0], s.mom.grip[1] + 14, 13, 6, 0.2, 0, Math.PI * 2);
  }
  // 多出来的一截：从下面那只手垂下来，拖在地上（离地以后跟着她晃）
  const G = s.mom.grip;
  const endY = Math.min(0, G[1] + 420);
  path.moveTo(G[0], G[1]);
  path.quadraticCurveTo(G[0] - 40 + 10 * Math.sin(t * 2.2), (G[1] + endY) / 2 + 40, G[0] - 70 + 16 * Math.sin(t * 1.6), endY);
  if (endY >= -1) path.lineTo(G[0] - 150, -2);
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = INK;
  g.lineWidth = 6.5 * Math.max(0.8, lw);
  g.stroke(path);
  g.strokeStyle = "#d8352b";
  g.lineWidth = 3.6 * Math.max(0.8, lw);
  g.stroke(path);
  g.restore();
  drawPerson(g, STONE, s.stone.pose, s.stone.root[0], s.stone.root[1], z);
  // 脚踝上绕的一圈
  g.save();
  g.strokeStyle = "#d8352b";
  g.lineWidth = 3.4;
  g.beginPath();
  g.ellipse(A[0], A[1], 11, 5, 0.2, 0, Math.PI * 2);
  g.stroke();
  g.restore();
}
