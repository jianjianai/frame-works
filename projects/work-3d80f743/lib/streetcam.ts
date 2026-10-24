// 副歌一②–⑥（43.92–55.98）的镜头：一个镜头（人和东西在 lib/mother.ts）。2026-10-22 用户重做：「注意按照情绪运镜，物理，和动作」。
// 43.92 从①整座城的夜里直接切过来（①的镜头在 lib/net.ts），之后不切。
//   ② 挣扎：先把街面、半空里的她和更高处的他一起框进来（看得出离地多高）；她每拽一把，镜头跟着两个人挤近一截——按两个人的上下间距自动取景，
//      用弹簧跟（晚一点到、带着惯性），每一把一顿；越拽越近，「亮」拽进怀里时已经是两个人的近景。
//   ③ 交出外套：柔和起步、一路减速地推到外套交过去的地方；「我们」屏着气很慢地凑近；「灼」推开——镜头被推得一震，
//      先快后慢地往后退开，把往上飘的她、往下掉的他和下面的街一起框进来；48.02 红绳绷直一顿。
//   ② 开头（2026-10-22 用户「这两段之间的运镜和情绪需要继续优化」）：切过来先贴在她的脸和攥着红绳的手上（歪 0.045），0.7 秒先快后慢地撤开、回正——她自己也悬在半空（惊）。
//   ④ 绷直以后远景屏住一下；沉沉跑进来，镜头落到街上跟着她跑（晚 0.06 秒，吊着的两个人在画面上边）；蹲下凑近 4%；起跳跟着往上（只平移），
//      「茫」抓住一冲一震，坠下去一沉；49.62 起让开到三个人和铁靴的远景，僵持着线性慢推。
//   ⑤「但」铁靴离了地一惊；「把小刀」推到妈妈的脸和手上，「带」割断一顿；她往上飞走（不追），镜头顺着掉下去的两个人往下甩，「身」落地一震。
//   ⑥ 用户：「主角和孩子拥抱，镜头不动，上方发出彩色的光，小刀从天上掉下来」；2026-10-24「运镜和情绪还有动作需要优化」：不震、不追拍，但跟着人和东西走——
//      落地让开以后顺着他伸向天上的手慢慢抬头往上看（屏着气）；「还」彩光炸开，镜头被光推开一点；之后跟着落下来的灰落回两个人身上，越推越慢地凑近两张脸。
//   ⑦ 小刀扎在街上以后，柔和起步、一路减速地凑近她和那把刀；之后 lib/memory.ts 推近她仰着的脸。

import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { castJoints } from "@materials/剪纸角色/code/cast";
import { netCam, netShake } from "./net";
import { MOM } from "./dawn";
import { MT, coatPoint, sceneAt } from "./mother";
import { ASH_T } from "./ash";

type V2 = [number, number];

// ——— ② 按两个人的上下间距自动取景，弹簧跟 ———
/** 想要的取景：上面到他的头顶，下面到她的脚（开头连街面也框进来） */
function frameA(t: number): [number, number, number] {
  const s = sceneAt(t);
  const top = s.stone.root[1] - 360;
  const feet = s.mom.root[1] + 70;
  const bottom = feet + (60 - feet) * (1 - E.io(ph(t, 44.4, 45.1)));
  const z = Math.max(0.9, Math.min(1.85, (0.9 * 1920) / (bottom - top)));
  const cx = (s.stone.root[0] + s.mom.root[0]) / 2 + 20;
  return [cx, (top + bottom) / 2 + 20 / z, Math.log(z)];
}
const DT = 1 / 120;
let TRACK: Float64Array[] | null = null;
function trackA() {
  if (TRACK) return TRACK;
  const n = Math.ceil((MT.hug + 0.5 - MT.start) / DT) + 2;
  const out = [new Float64Array(n), new Float64Array(n), new Float64Array(n)];
  // 弹簧：角频率 11、阻尼比 0.9（晚一点到，几乎不冲过头）
  const w = 11;
  const zeta = 0.9;
  let x = frameA(MT.start);
  let v = [0, -50, 0];
  for (let i = 0; i < n; i++) {
    const tgt = frameA(MT.start + i * DT);
    for (let k = 0; k < 3; k++) {
      const a = w * w * (tgt[k] - x[k]) - 2 * zeta * w * v[k];
      v[k] += a * DT;
      x[k] += v[k] * DT;
      out[k][i] = x[k];
    }
  }
  TRACK = out;
  return out;
}
function camA(t: number): Cam {
  const tr = trackA();
  const u = Math.max(0, Math.min(tr[0].length - 1.001, (t - MT.start) / DT));
  const i = Math.floor(u);
  const f = u - i;
  const at = (k: number) => tr[k][i] * (1 - f) + tr[k][i + 1] * f;
  return { x: at(0), y: at(1), z: Math.exp(at(2)), r: 0 };
}

/** 推开以后的远景：她的头在画面上边、街面在画面下边（按绷直那一刻算一次，之后不动） */
let WIDE: Cam | null = null;
function wide(): Cam {
  if (WIDE) return WIDE;
  const s = sceneAt(MT.taut + 0.3);
  const top = s.mom.root[1] - 640;
  const bottom = 90;
  const z = 1920 / (bottom - top);
  WIDE = { x: s.mom.root[0] - 40, y: (top + bottom) / 2, z, r: 0 };
  return WIDE;
}
/** ⑤ 推到她的脸和两只手（拴着红绳的手腕、掏刀的手）中间 */
function knifePoint(t: number): V2 {
  const s = sceneAt(t);
  const j = castJoints(MOM, s.mom.pose);
  const head: V2 = [s.mom.root[0] + j.head[0], s.mom.root[1] + j.head[1]];
  return [(head[0] + s.mom.wristR[0]) / 2 + 20, head[1] * 0.45 + s.mom.wristR[1] * 0.55];
}
/** 沉沉的胸口 */
function chenChest(t: number): V2 {
  const s = sceneAt(t);
  if (!s.chen) return [0, 0];
  const j = jointsOf(s.chen.pose);
  return [s.chen.root[0] + (j.shoulderL[0] + j.shoulderR[0]) / 2, s.chen.root[1] + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 60];
}
/** ⑥ 彩光以后跟着灰落回两个人身上：从这一刻起 */
const HUG_T0 = 53.0;
/** 落回去推近的取景：两张脸中间偏下（脚下的铁靴和小刀落的地方也在画面里） */
let HUG: Cam | null = null;
function hugFrame(): Cam {
  if (HUG) return HUG;
  const s = sceneAt(53.7);
  const j = jointsOf(s.chen!.pose);
  const head: V2 = [s.chen!.root[0] + j.head[0], s.chen!.root[1] + j.head[1]];
  HUG = aim(head[0] + 30, head[1] + 130, 540, 1000, 1.95);
  return HUG;
}
/** ⑥ 落地以后让开的那个取景：跪着抱在一起的两个人在画面下面，头顶留一大片天（光和小刀从上面来） */
let STILL: Cam | null = null;
function still(): Cam {
  if (STILL) return STILL;
  const s = sceneAt(MT.land + 0.4);
  STILL = aim(s.chen!.root[0] + 120, 0, 540, 1600, 1.55);
  return STILL;
}

export function streetCam(t: number): Cam {
  if (t < MT.start) return netCam(t);
  // ② 自动取景、弹簧跟；每拽一把一顿
  let c = camA(Math.min(t, MT.hug + 0.4));
  // 切过来先贴在她的脸和攥着红绳的手上（歪着、喘不过气），0.7 秒里先快后慢地往后撤、回正——露出她自己也悬在半空、离地好几层楼（惊）
  const open = 1 - E.out(ph(t, MT.start, 44.62));
  if (open > 0.001) {
    const s0 = sceneAt(t);
    const j0 = castJoints(MOM, s0.mom.pose);
    const head: V2 = [s0.mom.root[0] + j0.head[0], s0.mom.root[1] + j0.head[1]];
    c = camLerp(c, { ...aim(head[0] + 30, head[1] - 40, 540, 860, 2.1), r: -0.045 }, open);
  }
  const pullKick = MT.pull.reduce((a, p) => a + kick(t, p[1], 0.1), 0);
  c = { ...c, z: c.z * (1 + 0.022 * pullKick) };
  if (t <= MT.hug - 0.1) return c;
  // ③ 柔和起步、一路减速地推到外套交过去的地方；「我们」屏着气很慢地凑近
  const cp = coatPoint(Math.min(Math.max(t, 46.2), MT.wrap));
  c = camLerp(c, aim(cp[0], cp[1], 540, 900, 2.15), E.settle(ph(t, MT.hug - 0.1, 46.75)));
  c = { ...c, z: c.z * (1 + 0.035 * ph(t, 46.85, MT.push)) };
  if (t <= MT.push) return c;
  // 「灼」推开：一震，先快后慢地往后退开（两个人一上一下分开），绷直一顿
  c = camLerp(c, wide(), E.out(ph(t, MT.push + 0.02, MT.taut + 0.12)));
  c = { ...c, z: c.z * (1 + 0.03 * kick(t, MT.push, 0.1) + 0.03 * kick(t, MT.taut, 0.1)) };
  // ④ 先听见铁靴：绷直以后远景屏住；沉沉一进画面，镜头往下落到街上跟着她跑（比她慢 0.06 秒，头顶吊着的两个人还在画面上边）；
  //   蹲下攒劲往里凑一点；起跳跟着她往上（倍数不变，只平移），「茫」抓住一冲一震；她的分量把一串人坠下去，镜头跟着一沉；
  //   之后往后让开，把吊着的三个人和踩在街上的铁靴一起框进来，僵持着线性地慢慢逼近（紧张）
  if (t > MT.taut + 0.1) {
    const W0 = wide();
    const tl = Math.max(MT.run0 + 0.15, t - 0.06);
    const sc = sceneAt(tl);
    const cc = chenChest(tl);
    const fx = 0.6 * cc[0] + 0.4 * sc.stone.ankle[0];
    const zf = W0.z * 1.6 * (1 + 0.04 * E.io(ph(t, MT.crouch, MT.jump)));
    let f = aim(fx, cc[1], 540, 1230, zf);
    f = { ...f, z: f.z * (1 + 0.05 * kick(t, MT.grab, 0.1)), y: f.y + (28 * kick(t, MT.ground, 0.12)) / f.z };
    c = camLerp(c, f, E.io(ph(t, MT.taut + 0.1, 48.45)));
    // 僵持：三个人和街上的铁靴，线性慢推
    const hold = { ...W0, y: W0.y + 60 / W0.z, z: W0.z * 1.08 * (1 + 0.06 * ph(t, 49.7, MT.lift + 0.3)) };
    c = camLerp(c, hold, E.io(ph(t, 49.62, 49.98)));
  }
  if (t <= MT.lift) return c;
  // ⑤「但」铁靴离了地一惊；「把小刀」推到她的脸和手上（跟着她往上），「带」割断一顿
  c = { ...c, z: c.z * (1 + 0.02 * kick(t, MT.lift, 0.1)) };
  const pk = knifePoint(Math.min(t, MT.cut));
  c = camLerp(c, aim(pk[0], pk[1], 540, 880, 2.0), E.io(ph(t, 50.3, 50.78)));
  c = { ...c, z: c.z * (1 + 0.018 * kick(t, MT.cut, 0.08)) };
  // 她往上飞走（不追）；顺着掉下去的两个人往下甩，「身」落地一震
  if (t > MT.cut + 0.1) {
    const ch = chenChest(MT.land + 0.2);
    c = camLerp(c, aim(ch[0] + 40, ch[1] - 30, 540, 1180, 1.7), E.io(ph(t, MT.cut + 0.1, MT.land)));
  }
  c = { ...c, z: c.z * (1 + 0.04 * kick(t, MT.land, 0.1)) };
  if (t <= MT.land + 0.06) return c;
  // ⑥ 往后让开一点，把头顶的天让出来
  c = camLerp(c, still(), E.settle(ph(t, MT.land + 0.06, 51.92)));
  // 「至少我」：顺着他伸向天上的手，屏着气线性地慢慢抬头往上看（人沉到画面下面，头顶的天越来越大，等着）
  c = { ...c, y: c.y - (150 * ph(t, 51.8, MT.touch)) / c.z, z: c.z * (1 - 0.03 * ph(t, 51.8, MT.touch)) };
  // 「还」彩光炸开：镜头被光推开、再往上让一点（不震）——光照在两张仰着的脸上
  const pushed = E.out(ph(t, MT.touch, MT.touch + 0.45));
  c = { ...c, y: c.y - (50 * pushed) / c.z, z: c.z * (1 - 0.05 * pushed) };
  // 「在为你而歌唱」：跟着落下来的灰慢慢落回两个人身上，越推越慢地凑近两张脸（心碎）；脚下留着铁靴跟前那块地（小刀会掉在那里）
  if (t > HUG_T0) c = camLerp(c, hugFrame(), E.settle(ph(t, HUG_T0, ASH_T.start + 0.3)));
  if (t <= MT.knifeLand + 0.1) return c;
  // ⑦ 小刀扎在街上以后：柔和起步、一路减速地凑近她和那把刀
  const s0 = sceneAt(55.2);
  const j = jointsOf(s0.chen!.pose);
  const mid: V2 = [s0.chen!.root[0] + j.head[0] + 60, s0.chen!.root[1] + j.head[1] + 150];
  return camLerp(c, aim(mid[0], mid[1], 540, 980, 2.0), E.settle(ph(t, MT.knifeLand + 0.12, 55.85)));
}

/** 画面一震：①的；② 每拽一把；③ 推开、绷直；④ 抓住、铁靴落地；⑤ 铁靴离地、割断、落地（⑥ 镜头不动，不震） */
export function streetShake(t: number) {
  const pulls = MT.pull.reduce((a, p) => a + kick(t, p[1], 0.07), 0);
  return (
    netShake(t) +
    5 * pulls +
    10 * kick(t, MT.push, 0.07) +
    12 * kick(t, MT.taut, 0.08) +
    8 * kick(t, MT.grab, 0.08) +
    3 * kick(t, MT.ground, 0.07) +
    4 * kick(t, MT.lift, 0.07) +
    4 * kick(t, MT.cut, 0.05) +
    12 * kick(t, MT.land, 0.07)
  );
}

/** 这一段的光：越拽越紧暗角收一点；抱在一起、裹上外套暖光涌上来、暗角松开；推开收紧；掏刀时收紧 */
export function streetLook(t: number, base: { vig: number; warm: number }) {
  const bump = (a: number, b: number, c: number, d: number) => E.io(ph(t, a, b)) * (1 - E.io(ph(t, c, d)));
  // ⑥ 彩光照下来：暖光涌一下、暗角松开，之后慢慢收回来（她不在了）
  const lit = bump(MT.touch, MT.touch + 0.15, MT.touch + 0.6, MT.touch + 1.8);
  const vig =
    base.vig + 0.05 * bump(44.3, 45.45, 45.7, 46.2) - 0.06 * bump(45.9, 46.4, MT.push - 0.1, MT.push + 0.1) + 0.07 * bump(MT.push, MT.push + 0.1, 48.2, 48.9) + 0.08 * bump(50.3, 50.78, 51.1, 51.6) - 0.06 * lit + 0.04 * bump(53.2, 53.9, 55.5, 56);
  const warm = base.warm + 0.16 * bump(45.9, 46.4, MT.push - 0.05, MT.push + 0.3) + 0.14 * lit;
  return { vig, warm };
}
export { ASH_T };
