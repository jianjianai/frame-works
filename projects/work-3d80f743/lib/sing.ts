// 副歌一⑤「至少我还在为你而歌唱」（51.93–53.94；至 51.93 少 52.17 我 52.38 还 52.44 在 52.71 为 52.86 你 53.07 而 53.34 歌 53.46 唱 53.67；
// 小节线 52.017、54.018）。接着④（同一个镜头）：镜头顺着街上母子俩的视线往上甩，追上往上飘的妈妈——她张着手，低头看着下面的儿子
// 哭着笑，越飘越快，楼一层层落到她脚下；「歌唱」她仰起脸迎着白，镜头追不上了，往后一退，她一个人往白的边上冲去。
// （54.018 她碰到白，下一镜。）

import { CAST, type CastSpec, castJoints } from "@materials/剪纸角色/code/cast";
import { type MoveKey, type PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, aim, camLerp, ph } from "./cam";
import { Y_WHITE, drawGlow } from "./world";
import { live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";
import { MOM, pose } from "./dawn";
import { MOM3_OPTS } from "./coat";
import { KNIFE_T, MOM4, MOM4_KEYS, momRoot4 } from "./knife";

type V2 = [number, number];

export const SING_T = {
  start: KNIFE_T.end,
  /** 镜头顺着视线往上甩、追上她（「我」） */
  catch: 52.38,
  /** 「为你」镜头不再跟，往后退到整座城；「歌唱」她仰起脸迎着白 */
  back0: 52.9,
  face: 53.3,
  /** 碰到白（小节线，下一镜） */
  touch: beatAt(108),
  end: 53.94,
};

const MOM_BARE: CastSpec = { ...MOM, coat: undefined };

const MOM5 = {
  /** 张开手往上飘，低头看着下面的儿子，哭着笑，头发飘起来 */
  看他: pose(-6, { face: -0.2, ground: false, float: 0.22, rot: -3, ...legR(8, -24, -54), ...legL(-6, -16, -56), neck: -30, expression: "含泪", smile: 0.5, lookX: 0.05, lookY: 1 }, (l) => ({
    ...armL(-72, 24, 0, "open", l),
    ...armR(124, 20, 0, "open", l),
  })),
  /** 仰起脸迎着白：远处的手伸向白、近处的手往后，闭着眼哭着笑——和片头光里的女人一样 */
  迎光: pose(-8, { face: -0.2, ground: false, float: 0.28, rot: -2, ...legR(4, -30, -60), ...legL(-8, -20, -60), neck: 26, expression: "哭着笑", blink: 1 }, (l) => ({
    ...armL(-80, -10, 0, "open", l),
    ...armR(160, 10, 0, "open", l),
  })),
};
const momMove5 = live(
  [
    ...MOM4_KEYS,
    { t: SING_T.start, p: MOM4.张手 },
    { t: SING_T.catch + 0.1, ease: "inOut", p: MOM5.看他 },
    { t: SING_T.face, p: MOM5.看他 },
    { t: SING_T.face + 0.4, ease: "inOut", p: MOM5.迎光 },
    { t: 56, p: MOM5.迎光 },
  ] as MoveKey[],
  MOM3_OPTS,
);

/** 她这一刻（世界坐标）：根接着④（割断以后越飘越快，54.018 举着的手正好碰到白的边） */
export function singAt(t: number) {
  const pose: PoseIn = { ...momMove5(t).pose };
  const root = momRoot4(t);
  const j = castJoints(MOM_BARE, pose);
  const chest: V2 = [root[0] + (j.shoulderL[0] + j.shoulderR[0]) / 2, root[1] + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 30];
  const palmR: V2 = [root[0] + j.palmR[0], root[1] + j.palmR[1]];
  return { pose, root, chest, palmR };
}

/** 画⑤的她（人这一层，世界坐标）：越靠近白身上那团光越亮；手腕上剩的一小截红绳 */
export function drawSing5(g: CanvasRenderingContext2D, t: number, z: number) {
  const m = singAt(t);
  const near = Math.min(1, Math.max(0, 1 - (m.chest[1] - Y_WHITE) / 6000));
  drawGlow(g, m.chest[0], m.chest[1], 260 + 220 * near + 20 / z, 0.25 + 0.55 * near * near);
  drawPerson(g, MOM_BARE, m.pose, m.root[0], m.root[1], z);
  g.save();
  g.lineCap = "round";
  g.strokeStyle = "#2e2530";
  g.lineWidth = 6.5;
  g.beginPath();
  g.moveTo(m.palmR[0], m.palmR[1]);
  g.lineTo(m.palmR[0] + 10, m.palmR[1] + 46);
  g.stroke();
  g.strokeStyle = "#d8352b";
  g.lineWidth = 3.6;
  g.stroke();
  g.restore();
}

/**
 * ⑤的镜头（以④的镜头为底）：顺着街上两个人的视线往上甩（E.io 0.45 秒），「我」追上她，锁在她身上跟着往上（她低头看着儿子，
 * 在画面里慢慢往上走：越飘越快，镜头跟得越来越吃力）；「为你」起一边跟着她、一边一路往后退到整座城（1.2 → 0.19 倍）：
 * 她一直在画面里、往画面顶上的白冲过去，退完时街面落在画面最下面（儿子和沉沉），白在最上面。只往后退，不往回推
 */
export function singCam(t: number, base: (t: number) => Cam): Cam {
  const T = SING_T;
  if (t <= T.start) return base(t);
  const m = singAt(t);
  const k1 = ph(t, T.catch, T.back0);
  const k2 = E.io(ph(t, T.back0, T.end));
  const z = 1.4 * Math.pow(1.2 / 1.4, k1) * Math.pow(0.19 / 1.2, k2);
  const follow = aim(m.chest[0] + 10, m.chest[1] + 60, 540, 900 - 220 * k1 - 380 * k2, z);
  return camLerp(base(t), follow, E.io(ph(t, T.start, T.catch)));
}
