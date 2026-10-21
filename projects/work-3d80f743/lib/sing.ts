// 副歌一⑤「至少我还在为你而歌唱」（51.93–53.94；至 51.93 少 52.17 我 52.38 还 52.44 在 52.71 为 52.86 你 53.07 而 53.34 歌 53.46 唱 53.67；
// 小节线 52.017、54.018）。2026-10-21 重做：割断以后（51.06）妈妈一下松开往上一窜，之后舍不得走，慢慢往上飘——
// 近处的手伸下来够着地上的儿子（够不着），远处的手往后张开，低头看着他，含着泪笑，眼泪一颗颗往上飘（她已经是轻的了）；
// 地上沉沉搂着他，他哭着把手伸向她——一上一下两只手够不着，和⑦十二年前那一幕一模一样。「歌」她仰起脸迎着光，闭上眼，
// 越飘越快，飞出画面（碰到白在画面外，54.018，下一镜：天上炸开彩色的光）。镜头在地上看着她（lib/streetcam.ts）：死亡不追拍。
// 她从割断那一刻起由这里画（act3），之前在 lib/knife.ts。

import { type CastSpec, castJoints } from "@materials/剪纸角色/code/cast";
import { type MoveKey, type PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { beatAt } from "@frame/engine/tempo";
import { E, ph } from "./cam";
import { drawGlow } from "./world";
import { live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { drawPerson } from "./people";
import { MOM, pose } from "./dawn";
import { MOM3_OPTS } from "./coat";
import { KNIFE_T, MOM4, MOM4_KEYS, MOM_AWAY, momRoot4 } from "./knife";

type V2 = [number, number];

export const SING_T = {
  /** 从割断那一刻起她由这里画 */
  start: KNIFE_T.cut,
  /** 近处的手伸下来够他 */
  look: 51.75,
  /** 「歌」仰起脸迎着光，越飘越快 */
  face: 53.4,
  away: MOM_AWAY,
  /** 碰到白（小节线，画面外，下一镜） */
  touch: beatAt(108),
  end: 53.94,
};

const MOM_BARE: CastSpec = { ...MOM, coat: undefined };

const MOM5 = {
  /** 近处的手伸下来够地上的儿子（够不着），远处的手往后张开，低头看着他，含着泪笑（和十二年前秤砣的妈妈一样） */
  看他: pose(6, { face: -0.6, ground: false, float: 0.22, rot: -4, ...legR(10, -26, -54), ...legL(-6, -18, -56), neck: -34, expression: "含泪", smile: 0.55, tears: 0.6, lookX: -0.15, lookY: 1 }, (l) => ({
    ...armL(40, 6, -6, "open", l),
    ...armR(-56, 24, 0, "open", l),
  })),
  /** 仰起脸迎着光：远处的手伸向白、近处的手往后，闭着眼哭着笑——和片头光里的女人一样 */
  迎光: pose(-8, { face: -0.2, ground: false, float: 0.28, rot: -2, ...legR(4, -30, -60), ...legL(-8, -20, -60), neck: 26, expression: "哭着笑", blink: 1 }, (l) => ({
    ...armL(-80, -10, 0, "open", l),
    ...armR(160, 10, 0, "open", l),
  })),
};
const momMove5 = live(
  [
    ...MOM4_KEYS,
    { t: KNIFE_T.cut + 0.36, p: MOM4.张手 },
    { t: SING_T.look, ease: "inOut", p: MOM5.看他 },
    { t: SING_T.face, p: MOM5.看他 },
    { t: SING_T.face + 0.32, ease: "inOut", p: MOM5.迎光 },
    { t: 56, p: MOM5.迎光 },
  ] as MoveKey[],
  MOM3_OPTS,
);

/** 她这一刻（世界坐标）：根接着④（割断以后先慢慢往上飘，「歌」起越飘越快） */
export function singAt(t: number) {
  const pose: PoseIn = { ...momMove5(t).pose };
  const root = momRoot4(t);
  const j = castJoints(MOM_BARE, pose);
  const chest: V2 = [root[0] + (j.shoulderL[0] + j.shoulderR[0]) / 2, root[1] + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 30];
  const palmR: V2 = [root[0] + j.palmR[0], root[1] + j.palmR[1]];
  const head: V2 = [root[0] + j.head[0], root[1] + j.head[1]];
  return { pose, root, chest, palmR, head };
}

/** 她的眼泪：从眼角冒出来往上飘（她已经是轻的了，这里什么都往上飘）；仰起脸以后不画 */
function drawTears(g: CanvasRenderingContext2D, t: number, head: V2) {
  const k = E.io(ph(t, SING_T.start + 0.15, SING_T.look)) * (1 - E.io(ph(t, SING_T.face, SING_T.face + 0.2)));
  if (k <= 0.01) return;
  g.save();
  g.fillStyle = "rgba(170,214,240,0.9)";
  for (let i = 0; i < 5; i++) {
    const u = (t * 0.7 + i / 5) % 1;
    g.globalAlpha = k * Math.min(1, u * 8) * (1 - u) ** 0.8;
    const r = 4.5 + 2.5 * Math.min(1, u * 4);
    g.beginPath();
    g.ellipse(head[0] - 16 + (i % 2 ? 26 : -4) + 10 * Math.sin(t * 2 + i) * u, head[1] + 14 - u * 240, r * 0.75, r, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** 画⑤的她（人这一层，世界坐标）：身上一团淡淡的光；手腕上剩的一小截红绳；往上飘的眼泪 */
export function drawSing5(g: CanvasRenderingContext2D, t: number, z: number) {
  const m = singAt(t);
  drawGlow(g, m.chest[0], m.chest[1], 300 + 20 / z, 0.3 + 0.25 * E.io(ph(t, SING_T.face, SING_T.away + 0.3)));
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
  drawTears(g, t, m.head);
}
