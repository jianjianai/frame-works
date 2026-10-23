// 副歌一⑦「即便我们都在这黑暗漫长的反乌托邦」（55.98–60.02；即 55.98 便 56.04 我 56.37 们 56.61 都 56.91 在 57.18 这 57.51 黑 57.87 暗 58.02
// 漫 58.08 长 58.29 的 58.47 反 58.77 乌 59.01 托 59.07 邦 59.31，「邦」一直拖到 64；小节线 56.019、58.02、60.021）。
// 接着⑥：镜头推近沉沉闭着眼抱着小石头的脸，灰从她脸前飘过；「在这」她的脸溶成同一个位置、同样大小的另一张脸——十二年前，七岁的她
// （素材库「剪纸角色」的 小时候的秤砣：齐耳短发、黄毛衣、脚上一双大得不合脚的铁靴——是妈妈的）。镜头从她脸上拉开：同一条街，
// 颜色淡一些、旧一些；她仰着头，手伸向天上——她光着脚的妈妈（秤砣的妈妈：锈红色外套）正往天上飘，低头看着她，含着泪笑。
// 和小石头刚刚经历的一模一样：妈妈把自己的分量（铁靴）给了她。

import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type MoveKey, type PoseIn, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, H, W, aim, camLerp, ph, toScreen } from "./cam";
import { drawGlow } from "./world";
import { ARMS, LIMP, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";
import { pose } from "./dawn";
import { ASH_T } from "./ash";
import { knifeAt } from "./mother";

type V2 = [number, number];

export const MEM_T = {
  start: ASH_T.end,
  /** 推近她的脸 */
  push1: 57.0,
  /** 「在这」溶成十二年前那张脸 */
  dis0: 57.0,
  dis1: 57.45,
  /** 从小时候的脸上拉开 */
  pull1: 59.3,
  end: beatAt(120),
};

export const KID = CAST.小时候的秤砣;
export const MAMA = CAST.秤砣的妈妈;

export const KID_POSES = {
  /** 穿着妈妈的大铁靴站在街上，仰着头睁着眼看天上的妈妈，远处的手伸上去，忍着不哭 */
  仰头: pose(-4, { face: 0.72, ...legR(6, -6), ...legL(-6, -4), neck: 28, expression: "仰望", sad: 0.6, tears: 0.6, wobble: 0.5, smile: -0.3, blush: 0.5, lookX: 0.4, lookY: -1 }, (l) => ({
    ...armL(-10, 20, 0, "relax", l),
    ...armR(150, 20, 0, "open", l),
  })),
  /** 两只手都伸上去够，哭着喊她 */
  够: pose(-6, { face: 0.72, ...legR(8, -6), ...legL(-6, -4), neck: 34, expression: "仰望", sad: 0.85, tears: 0.9, open: 0.3, blush: 0.6, lookX: 0.3, lookY: -1 }, (l) => ({
    ...armL(130, 24, 0, "open", l),
    ...armR(160, 16, 0, "open", l),
  })),
};
export const MAMA_POSES = {
  /** 光着脚往上飘：近处的手伸下来够女儿（够不着），远处的手往后张开，低头看着她，含着泪笑 */
  看她: pose(-4, { face: -0.6, ground: false, float: 0.22, rot: -4, ...legR(10, -26, -54), ...legL(-6, -18, -56), neck: -30, expression: "含泪", smile: 0.5, lookX: -0.2, lookY: 1 }, (l) => ({
    ...armL(46, 6, -6, "open", l),
    ...armR(-56, 24, 0, "open", l),
  })),
};
/** 两个人的关键帧（⑧ 原样抄过去再往后接，弹簧不跳；最后一帧停在下一镜要动之前） */
export const KID7_KEYS: MoveKey[] = [
  { t: 56.5, x: 0, p: KID_POSES.仰头 },
  { t: 58.4, p: KID_POSES.仰头 },
  { t: 58.9, ease: "inOut", p: KID_POSES.够 },
  { t: 61.6, p: KID_POSES.够 },
] as MoveKey[];
export const KID_OPTS = { look: lookOf(KID), base: { wind: 0.4 }, idle: true, seed: 61, springs: ARMS, follow: 0 };
export const MAMA7_KEYS: MoveKey[] = [
  { t: 56.5, x: 0, p: MAMA_POSES.看她 },
  { t: 60.04, p: MAMA_POSES.看她 },
] as MoveKey[];
export const MAMA_OPTS = { look: lookOf(MAMA), base: { wind: 0.5 }, idle: true, seed: 63, springs: LIMP, follow: 0 };
const kidMove = live(KID7_KEYS, KID_OPTS);
const mamaMove = live(MAMA7_KEYS, MAMA_OPTS);

/** 十二年前：她站在哪（和现在抱着小石头的地方差不多，同一条街）；妈妈已经飘过了楼顶（脚底比楼顶高一截，不像站在楼顶上），在她右上方的天上慢慢往上 */
export const KID_X = -2420;
/** 妈妈的根：慢慢往上（舍不得走，一直低头看着她） */
export const mamaRoot = (t: number): V2 => [-2250 + 30 * Math.sin(t * 0.9), -1380 - 100 * (t - 58)];
export function thenAt(t: number) {
  const kp: PoseIn = { ...kidMove(t).pose };
  const mp: PoseIn = { ...mamaMove(t).pose };
  const mRoot = mamaRoot(t);
  const kj = castJoints(KID, kp);
  return { kid: { pose: kp, root: [KID_X, 0] as V2, head: [KID_X + kj.head[0], kj.head[1]] as V2 }, mama: { pose: mp, root: mRoot } };
}

/** 画十二年前的两个人（人这一层，世界坐标） */
export function drawThen(g: CanvasRenderingContext2D, t: number, z: number) {
  const s = thenAt(t);
  const mj = castJoints(MAMA, s.mama.pose);
  drawGlow(g, s.mama.root[0] + (mj.shoulderL[0] + mj.shoulderR[0]) / 2, s.mama.root[1] + mj.shoulderL[1] + 40, 340, 0.35);
  drawPerson(g, MAMA, s.mama.pose, s.mama.root[0], s.mama.root[1], z);
  // 她脚下一小块影子
  g.save();
  g.fillStyle = "rgba(96,62,70,0.22)";
  g.beginPath();
  g.ellipse(KID_X + 10, 6, 120, 18, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  drawPerson(g, KID, s.kid.pose, s.kid.root[0], s.kid.root[1], z);
}

/** 回忆的颜色：淡一些、旧一些（一层暖的米色把对比压下去、往旧照片的褐色上拉、四角暗一点）；k 是浓淡（间奏里一步步淡回现在） */
export function memoryGrade(g: CanvasRenderingContext2D, base: DOMMatrix, k = 1) {
  if (k <= 0.001) return;
  g.setTransform(base);
  g.save();
  g.globalCompositeOperation = "color";
  g.fillStyle = `rgba(196,158,120,${0.38 * k})`;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "source-over";
  g.fillStyle = `rgba(250,236,214,${0.2 * k})`;
  g.fillRect(0, 0, W, H);
  const v = g.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.45, H * 0.75);
  v.addColorStop(0, "rgba(80,52,44,0)");
  v.addColorStop(1, `rgba(80,52,44,${0.32 * k})`);
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
  g.restore();
}

// ——— 镜头 ———
/** 现在：推近沉沉的脸（她低头贴着小石头，闭着眼） */
function nowFace(t: number): V2 {
  const k = knifeAt(Math.min(t, MEM_T.dis1));
  const j = jointsOf(k.chen.pose);
  return [k.chen.root[0] + j.head[0], k.chen.root[1] + j.head[1]];
}
export function nowCam(t: number, base: (t: number) => Cam): Cam {
  if (t <= MEM_T.start) return base(t);
  const face = nowFace(t);
  return camLerp(base(t), aim(face[0], face[1], 540, 860, 3.2), E.io(ph(t, MEM_T.start, MEM_T.push1 + 0.2)));
}
/**
 * 十二年前：溶进来的那一刻，小时候的脸在画面上的位置、大小和现在那张脸一样（头的大小：0.58 × 1.42 ≈ 现在的 0.82）；
 * 再从她脸上拉开（E.settle，拉远时位置晚动：先看见大铁靴，「反乌」妈妈从脚开始露出来），落在「下面穿着大铁靴仰着头的她、
 * 上面天上的妈妈」上（她的脚底在画面下边、妈妈的头在画面上边），跟着妈妈慢慢往上一点
 */
export function thenCam(t: number, now: (t: number) => Cam): Cam {
  // 溶的时候两张脸一直叠在画面上同一个地方、一样大（现在那边还在推最后一点），溶完再拉开
  const match = (tt: number) => {
    const n = now(tt);
    const f = nowFace(tt);
    const s = toScreen(n, f[0], f[1]);
    const kh = thenAt(tt).kid.head;
    return aim(kh[0], kh[1], s[0], s[1], n.z / (KID.scale * (KID.headScale ?? 1)));
  };
  if (t <= MEM_T.dis1) return match(t);
  let c = match(MEM_T.dis1);
  const u = E.settle(ph(t, MEM_T.dis1, MEM_T.pull1));
  if (u > 0) c = camLerp(c, aim(-2340, -1090, 540, 960, 0.78), u);
  const up = E.io(ph(t, MEM_T.pull1 - 0.3, MEM_T.end + 0.6));
  return { ...c, y: c.y - 90 * up };
}
