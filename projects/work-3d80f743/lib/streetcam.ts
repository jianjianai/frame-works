// 副歌一②–⑥（43.92–55.98）的镜头：一个镜头（2026-10-21 用户：「这段剧情全部按照新时间线重做，把动作表现形式情绪运镜做得更好」）。
// 43.92 从①整座城的夜里直接切过来（①的镜头在 lib/net.ts），之后不切：每一段的镜头都从前一段这一刻的镜头出发（camLerp），按剧情的拍子动。
//   ② 紧张：小石头和妈妈一竖条（她的脚踩在画面下面的街上，他在上面）；他往上飘，镜头跟着抬起来、往后让开一点；「周」红绳绷直一顿；
//      之后越拽越紧，线性地慢慢凑近；「灼」她的脚离了地，一惊，跟着两个人往上。
//   ③ 交出一样重要的东西：柔和起步、一路减速地推到妈妈怀里的儿子和那件外套上（推镜的中心就是外套交过去的地方，只推不横移）；
//      外套裹上暖光涌上来；他一沉，镜头跟着往下一沉，「茫」抱住脚踝一顿；之后往后让开，把整串人和街面框进来——沉沉的铁靴声先到，人后到。
//   ④ 「但」沉沉抓住脚踝一震；三个人一起往上，她的铁靴离了地（街面在画面最下面，看得见）；「把小刀」推到妈妈的脸和手上（哭着笑、掏刀），
//      「带」割断一顿；顺着掉下去的两个人往下甩，「在」落地一震。
//   ⑤ 死亡不追拍，拍地上的人：落地以后柔和起步往后、往上让开，落在「地上搂着儿子的沉沉、往上伸着的小手——天上低头看着他们、伸下手来的妈妈」
//      一竖条上，跟着她慢慢往上一点；「歌」她仰起脸飞出画面，镜头顺着他们的视线再往上抬一点，看着空了的天。
//   ⑥ 54.018 天上炸开彩色的光：镜头被光推开一点、一震；之后柔和起步、一路减速地落到抱在一起的两个人身上，灰从上面落下来。

import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { castJoints } from "@materials/剪纸角色/code/cast";
import { netCam, netShake } from "./net";
import { DAWN_T, MOM, MOM_X, momLift } from "./dawn";
import { COAT_T, coatAt } from "./coat";
import { KNIFE_T, knifeAt } from "./knife";
import { SING_T } from "./sing";
import { ASH_T, ashShake } from "./ash";

type V2 = [number, number];

/** ③ 外套交过去的地方：她的胸口（两个人抱在一起那一刻） */
function coatPoint(t: number): V2 {
  const c = coatAt(t);
  return [(c.mom.shL[0] + c.mom.shR[0]) / 2 + 10, (c.mom.shL[1] + c.mom.shR[1]) / 2 + 70];
}
/** ④ 推到她的脸和两只手（攥红绳的手腕、掏刀的手）中间 */
function knifePoint(t: number): V2 {
  const k = knifeAt(t);
  const j = castJoints(MOM, k.mom.pose);
  const head: V2 = [k.mom.root[0] + j.head[0], k.mom.root[1] + j.head[1]];
  return [(head[0] + k.mom.ropeHand[0]) / 2 + 10, head[1] * 0.42 + k.mom.ropeHand[1] * 0.58];
}
/** 沉沉的胸口（落地以后蹲着搂着他） */
function chenChest(t: number): V2 {
  const k = knifeAt(t);
  const j = jointsOf(k.chen.pose);
  return [k.chen.root[0] + (j.shoulderL[0] + j.shoulderR[0]) / 2, k.chen.root[1] + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 60];
}

export function streetCam(t: number): Cam {
  const D = DAWN_T;
  const C = COAT_T;
  const K = KNIFE_T;
  const S = SING_T;
  const A = ASH_T;
  if (t < D.start) return netCam(t);
  // ② 一竖条：她的脚在画面下面（1650），他在上面；他往上飘时镜头跟着抬起来、往后让开（1.42 → 1.2）；「光」以后越拽越紧，线性慢推 10%
  const open = E.io(ph(t, 44.15, 45.5));
  const z1 = 1.42 * Math.pow(1.2 / 1.42, open) * (1 + 0.1 * ph(t, 45.5, D.lift));
  const up1 = t > D.lift ? momLift(t) - momLift(D.lift) : 0;
  let c = aim(MOM_X + 30, -486 - 214 * open - up1, 540, 960, z1);
  c = { ...c, z: c.z * (1 + 0.025 * kick(t, D.taut, 0.1) + 0.03 * kick(t, D.lift, 0.12)) };
  if (t <= C.start) return c;
  // ③ 柔和起步、一路减速地推到外套交过去的地方（她怀里的儿子），之后跟着两个人慢慢往上
  const p3 = coatPoint(Math.min(Math.max(t, 48.6), C.wrap));
  c = camLerp(c, aim(p3[0], p3[1], 540, 930, 2.15), E.settle(ph(t, C.start + 0.02, C.wrap - 0.08)));
  // 他一沉：镜头跟着往下一沉（「茫」抱住脚踝那一下一顿）
  c = { ...c, y: c.y + 120 * E.in2(ph(t, C.wrap, C.grab)), z: c.z * (1 + 0.015 * kick(t, C.grab, 0.1)) };
  // 往后让开：整串人和街面（沉沉从左边冲进来）
  c = camLerp(c, aim(-2385, -660, 540, 960, 1.3), E.out(ph(t, C.grab + 0.05, C.grab + 0.62)));
  if (t <= K.start) return c;
  // ④「但」抓住一震；她的铁靴离了地（街面一直在画面最下面）
  c = { ...c, z: c.z * (1 + 0.02 * kick(t, K.grab, 0.1)) };
  // 「把小刀」推到她的脸和手上（跟着她往上），「带」割断一顿
  const pk = knifePoint(Math.min(t, K.cut));
  c = camLerp(c, aim(pk[0], pk[1], 540, 900, 2.0), E.io(ph(t, 50.6, 50.9)));
  c = { ...c, z: c.z * (1 + 0.015 * kick(t, K.cut, 0.08)) };
  // 顺着掉下去的两个人往下甩，「在」落地一震
  if (t > K.whip0) {
    const ch = chenChest(K.land + 0.2);
    c = camLerp(c, aim(ch[0] + 40, ch[1] - 20, 540, 1150, 1.55), E.io(ph(t, K.whip0, K.land)));
  }
  c = { ...c, z: c.z * (1 + 0.04 * kick(t, K.land, 0.1)) };
  if (t <= K.land + 0.1) return c;
  // ⑤ 往后、往上让开，落在「地上的两个人—天上的妈妈」一竖条上；跟着她慢慢往上一点；「歌」她飞出画面，顺着视线再往上抬一点
  const yF = -930 - 70 * E.io(ph(t, 52.35, S.face)) - 60 * E.out(ph(t, S.face, A.touch));
  c = camLerp(c, aim(-2350, yF, 540, 960, 1.15), E.settle(ph(t, K.land + 0.12, 52.35)));
  if (t <= A.start) return c;
  // ⑥ 天上炸开彩色的光：镜头被推开一点；之后柔和起步、一路减速地落到抱在一起的两个人身上
  c = { ...c, z: c.z * (1 - 0.035 * kick(t, A.touch, 0.14)) };
  const ch = chenChest(55.9);
  return camLerp(c, aim(ch[0] + 30, ch[1], 540, 1240, 1.45), E.settle(ph(t, 54.3, 55.9)));
}

/** 画面一震：①的；②红绳绷直、她离地；④抓住、割断、落地；⑥炸开 */
export function streetShake(t: number) {
  return (
    netShake(t) +
    6 * kick(t, DAWN_T.taut, 0.08) +
    9 * kick(t, DAWN_T.lift, 0.08) +
    8 * kick(t, KNIFE_T.grab, 0.08) +
    4 * kick(t, KNIFE_T.cut, 0.05) +
    12 * kick(t, KNIFE_T.land, 0.07) +
    ashShake(t)
  );
}

/** 这一段的光：拽不住时暗角收一点；外套裹上去暖光涌上来、暗角松开；掏刀时收紧；炸开以后松开 */
export function streetLook(t: number, base: { vig: number; warm: number }) {
  const bump = (a: number, b: number, c: number, d: number) => E.io(ph(t, a, b)) * (1 - E.io(ph(t, c, d)));
  const vig = base.vig + 0.06 * bump(45.4, 46.8, 47.9, 48.6) - 0.06 * bump(48.9, 49.3, 49.9, 50.4) + 0.08 * bump(50.6, 50.9, 51.1, 51.6);
  const warm = base.warm + 0.16 * bump(48.85, 49.25, 49.8, 50.6);
  return { vig, warm };
}
