// 副歌一②「我们的周围并非没光亮 / 只是太耀眼将我们灼伤」（43.92–47.92）。字：我 43.92 们 44.19 的 44.37 周 44.46 围 44.76 并 44.85 非 45.06
// 没 45.36 光 45.45 亮 45.69；只 45.93 是 46.17 太 46.35 耀 46.47 眼 46.68 将 46.83 我 47.07 们 47.34 灼 47.46 伤 47.67。小节线 44.018、46.019、48.02。
// 接着①停在整座城上（同一个镜头）：天从夜里亮起来（深蓝 → 粉橙的晨光），满城的窗一组组灭；天上被拴着的人被家里人一个个收回窗里，
// 红绳网一根根收进城里。「只是」镜头越扎越快地扎到街上：最高那栋楼右边那栋五层楼前，小石头飘了起来，妈妈两只手攥着拴在他脚踝上的红绳，
// 往后仰着拽；他仰着头冲天上的光笑，越飘越高；「灼」她的脚跟离了地——她也是轻的（故事「二 她飘得最高」）。

import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type Angles, type MoveKey, type PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { type Block, INK, drawGlow } from "./world";
import { type House } from "./props";
import { ARMS, LIMP, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";

type V2 = [number, number];

export const DAWN_T = {
  start: 43.92,
  /** 天亮起来（夜 → 粉橙的晨光）、满城的窗一组组灭 */
  sky0: 43.95,
  sky1: 45.9,
  lights0: 44.0,
  lights1: 45.5,
  /** 天上的人被一个个收回窗里（各人起收的时刻在这一段里） */
  reel0: 44.0,
  reel1: 45.3,
  /** 越扎越快地扎到街上，落在「耀」（第 93 拍） */
  dive0: 45.72,
  land: beatAt(93),
  /** 「灼」她的脚跟离了地 */
  lift: 47.46,
  end: 47.92,
};

/** [天黑了多少, 城里的窗亮了多少]：①整段是夜，②天亮成清晨（还留一点粉） */
export function dawnSky(t: number): [number, number] {
  const T = DAWN_T;
  const u = E.io(ph(t, T.sky0, T.sky1));
  return [1 - 0.82 * u, 1 - 0.95 * Math.pow(ph(t, T.lights0, T.lights1), 0.8)];
}
/** 夜里人身上那团光：天亮了就淡下去 */
export const nightGlow = (t: number) => 1 - E.io(ph(t, DAWN_T.sky0, DAWN_T.sky1 - 0.4));

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
  /** 两只手举过头顶攥着红绳往下拽（攥在头正上方，脸露在两条胳膊中间），身子往后坐，前脚蹬住，仰头看着他 */
  拽绳: pose(-6, { face: -0.2, ground: false, ...legR(22, -12, 0), ...legL(-16, -14, 0), neck: 28, expression: "担心", lookY: -1 }, (l) => ({
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
  /** 越飘越高：两只手都伸上去 */
  够: pose(-6, { face: 0.6, ground: false, float: 0.2, rot: -8, ...legL(2, -30, -44), ...legR(12, -24, -40), neck: 34, expression: "笑", blink: 0.4, lookY: -1 }, (l) => ({
    ...armL(120, 20, 0, "open", l),
    ...armR(160, 16, 0, "open", l),
  })),
};
const momMove = live(
  [
    { t: 45.5, x: 0, p: MOM_POSES.拽绳 },
    { t: DAWN_T.land + 0.1, p: MOM_POSES.拽绳 },
    { t: 47.0, ease: "inOut", p: MOM_POSES.踮脚 },
    { t: DAWN_T.lift - 0.04, p: MOM_POSES.踮脚 },
    { t: DAWN_T.lift + 0.2, ease: "out", p: MOM_POSES.离地 },
    { t: 49, p: MOM_POSES.离地 },
  ] as MoveKey[],
  { look: lookOf(MOM), base: { wind: 0.6 }, idle: true, seed: 41, springs: ARMS, follow: 0 },
);
const stoneMove = live(
  [
    { t: 45.5, x: 0, p: STONE_POSES.飘 },
    { t: 46.7, p: STONE_POSES.飘 },
    { t: 47.3, ease: "inOut", p: STONE_POSES.够 },
    { t: 49, p: STONE_POSES.够 },
  ] as MoveKey[],
  { look: lookOf(STONE), base: { wind: 0.6 }, idle: true, seed: 43, springs: LIMP, follow: 0 },
);

/** 妈妈离地多高：「灼」以后脚跟先离地，再整个人被带起来一点 */
export const momLift = (t: number) => 70 * E.io(ph(t, DAWN_T.lift - 0.25, DAWN_T.lift + 0.06)) * 0.4 + 120 * E.in2(ph(t, DAWN_T.lift, DAWN_T.end + 0.4));
/** 红绳拴在他脚踝上的那一点（世界坐标）：在她头顶上方、往左一点，被他越带越高 */
function stoneAnkle(t: number): V2 {
  const up = 60 * ph(t, 45.5, 47.0) + 90 * E.in2(ph(t, 46.9, DAWN_T.end + 0.4));
  return [MOM_X + 6 + 14 * Math.sin(t * 1.4), -1330 - up - momLift(t) + 8 * Math.sin(t * 2.1)];
}

/** 她和他这一刻：姿势、根，两只手攥着红绳（IK），红绳从他脚踝拉下来 */
export function streetAt(t: number) {
  const ankle = stoneAnkle(t);
  // 他：按脚踝放（红绳拴在近处那只脚踝上）
  const sp: PoseIn = { ...stoneMove(t).pose };
  const sj = castJoints(STONE, sp);
  const sRoot: V2 = [ankle[0] - sj.ankleL[0], ankle[1] - sj.ankleL[1]];
  // 她：根在地上（离地以后往上带）；两只手按 IK 攥在红绳上（上面那只离他脚踝近一点）
  const mp: PoseIn = { ...momMove(t).pose };
  const mRoot: V2 = [MOM_X, -momLift(t)];
  const k = MOM.scale;
  // 两只手攥在头正上方的红绳上（上面那只离头顶约 170，下面那只约 90），脸露在两条胳膊中间
  const sj0 = castJoints(MOM, mp);
  const head: V2 = [mRoot[0] + sj0.head[0], mRoot[1] + sj0.head[1]];
  const hi: V2 = [head[0] + 4, head[1] - 175 * k];
  const lo: V2 = [head[0] - 2, head[1] - 95 * k];
  const loc = (p: V2): V2 => [(p[0] - mRoot[0]) / k, (p[1] - mRoot[1]) / k];
  // 朝左（face < 0）不镜像：局部坐标就是画面方向
  mp.armR = { ...(mp.armR as object), to: loc(hi), ik: 1 } as PoseIn["armR"];
  mp.armL = { ...(mp.armL as object), to: loc(lo), ik: 1 } as PoseIn["armL"];
  const mj = castJoints(MOM, mp);
  const grip: V2 = [mRoot[0] + mj.palmL[0], mRoot[1] + mj.palmL[1]];
  const top: V2 = [mRoot[0] + mj.palmR[0], mRoot[1] + mj.palmR[1]];
  return { stone: { pose: sp, root: sRoot, ankle }, mom: { pose: mp, root: mRoot, grip, top } };
}

/**
 * 「太耀眼」：天上往下照着他的一道光（越往上越亮、越宽），他身上一团亮——他仰着头往光里去（画在人上面，screen 叠，只提亮）
 */
export function drawDazzle(g: CanvasRenderingContext2D, t: number) {
  // ③ 妈妈把他拽下来、裹上外套，那道光淡掉
  const fade = 1 - E.io(ph(t, DAWN_T.end + 0.08, DAWN_T.end + 0.55));
  if (t < DAWN_T.dive0 || fade <= 0.002) return;
  const s = streetAt(Math.min(t, DAWN_T.end));
  const k = fade * E.io(ph(t, DAWN_T.dive0, DAWN_T.land)) * (0.85 + 0.15 * Math.sin(t * 3.1));
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
  gr.addColorStop(0, `rgba(255,248,232,${0.55 * k})`);
  gr.addColorStop(0.75, `rgba(255,240,220,${0.22 * k})`);
  gr.addColorStop(1, "rgba(255,240,220,0)");
  g.fillStyle = gr;
  g.fill(beam);
  g.restore();
  drawGlow(g, head[0] + 10, head[1] + 60, 420, 0.55 * k);
}

/** 画街上的两个人和红绳（人这一层，世界坐标）：红绳从他脚踝拉到她手里，多出来的一截在她手腕上绕一圈、垂下来 */
export function drawStreet2(g: CanvasRenderingContext2D, t: number, z: number) {
  const s = streetAt(t);
  const lw = 1 / Math.sqrt(Math.max(0.3, z));
  // 地上她的一小块影子（离地以后淡下去、缩小）
  const lift = -s.mom.root[1];
  g.save();
  g.fillStyle = `rgba(96,62,70,${0.22 * Math.max(0, 1 - lift / 200)})`;
  g.beginPath();
  g.ellipse(MOM_X + 10, 6, 150 * (1 - lift / 600), 22, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  drawPerson(g, MOM, s.mom.pose, s.mom.root[0], s.mom.root[1], z);
  // 红绳：脚踝 → 她上面那只手 → 下面那只手，在下面那只手腕上绕一圈
  const path = new Path2D();
  path.moveTo(s.stone.ankle[0], s.stone.ankle[1]);
  path.lineTo(s.mom.top[0], s.mom.top[1]);
  path.lineTo(s.mom.grip[0], s.mom.grip[1]);
  path.moveTo(s.mom.grip[0] + 13, s.mom.grip[1] + 14);
  path.ellipse(s.mom.grip[0], s.mom.grip[1] + 14, 13, 6, 0.2, 0, Math.PI * 2);
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
  g.ellipse(s.stone.ankle[0], s.stone.ankle[1], 11, 5, 0.2, 0, Math.PI * 2);
  g.stroke();
  g.restore();
}

// ——— 镜头 ———
/** 街上的取景：她在画面下面（脚在 1830），他在上面、背后是五层楼的楼顶和清晨的天 */
const STREET = aim(MOM_X - 30, -700, 540, 1150, 1.0);
/**
 * ②的镜头：接着①停在整座城上（base 是①的镜头），天亮这一段不动；「只是」越扎越快地扎到街上（pow 2.2，位置按看得见的范围走，
 * 像朝那一点扎下去），「耀」落地冲过 4% 再回来；之后跟着他们往上抬一点
 */
export function dawnCam(t: number, base: (t: number) => Cam): Cam {
  const T = DAWN_T;
  if (t <= T.dive0) return base(t);
  const from = base(T.dive0);
  const u = ph(t, T.dive0, T.land);
  let c = camLerp(from, STREET, Math.pow(u, 2.2));
  // 落地：冲过一点再回来
  const d = t - T.land;
  if (d > 0) c = { ...c, z: c.z * (1 + 0.04 * Math.exp(-d / 0.12) * Math.sin(Math.min(Math.PI, d * 14))) };
  // 他们被带起来：镜头往上抬一点（跟着，不推）
  const up = E.io(ph(t, T.lift - 0.2, T.end + 0.4));
  if (up > 0) c = { ...c, y: c.y - 140 * up };
  return c;
}
/** 落地那一下画面一震 */
export const dawnShake = (t: number) => 9 * kick(t, DAWN_T.land, 0.07);
