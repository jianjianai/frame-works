// 间奏 0:53.94–1:11.97
// ① 53.94–60.9 一镜（十二年前，褪色的老照片）：她闭着的眼睛 → 同一个位置，七岁的她闭着的眼睛（匹配溶解），字「十二年前」。
//    她睁眼往上看——镜头顺着她的视线抬上去：一双光着的脚、锈红色的裙角正往上飘走；镜头退回来：她站在灰里，脚上是一双大得不像话的铁靴（妈妈的）；
//    天上一闪，灰落下来；打伞的人低着头从她身边走过。她想走，脚从大靴子里滑出来，摔坐在灰里；捡起一块砖，歪歪扭扭写上「活下去」，
//    塞进靴子——脚卡住了。站起来，一步「咚」：一拍一步，一步一年，她一路长成十九岁的秤砣（褪色的回忆慢慢有了颜色），
//    身后的街日夜交替；走着走着伸手把飘起来的人拽下来，一个，又一个——街上的人还是低着头。最后一步，她抬头看全城最高那栋楼——
// ② 60.9–69.5 一镜（现在，夜里她的屋子）：镜头顺着她的视线甩上去，落进她的屋子：她光着脚飘起来，倒着「坐」在推开了防飘栏的窗框上，
//    窗外就是白；脚绳从窗框一直绷到地上的椅子腿；她掏出小石头妈妈的那把刀，刀刃凑到绳子上又缩回来（犹豫），镜头直直地往刀刃上逼近；
//    笃、笃、笃，每一下一惊，第三下顺着视线甩到门上（她拽着绳子下来、脚跺进靴子，只听得见「咚」）；
//    门开了：小石头裹着妈妈的大外套，满身是灰，把那截割断的红绳举给她——镜头从他手里的红绳横过去，落到她手里的刀；
//    刀从她手里掉下去「当」，她跪下，把他的红绳和自己的脚绳系成一个结（镜头落到手上，越推越慢）
// ③ 69.5–71.97 夜里：天花板上她的床旁边钉了一张小床，两个人都倒着睡在天花板上，两根绳子系在一起
import { type C, type Cam, type Shot, W, H, E, ph, kick, shake, jolt, applyCam, vignette, caption, clamp, mix, buf, blit, smearV, smearH, camLerp, writeOn } from "./core";
import { figure, pose, rope, stone, type Fig, type Pt, walk } from "./figure";
import { ash, BEDPOST, crack, tower, sky, whiteBand, city, ground, net } from "./world";
import { facades, qinRoom } from "./sets";
import { bigBoot } from "./props";
import { X0, END_S, END_Z } from "./chorus1";
import { qinFloatSleep } from "./pre1";
import { LOOKS, PAL, crowdLook, UMBRELLAS, blend } from "./palette";

const lerpPt = (a: Pt, b: Pt, e: number): Pt => [mix(a[0], b[0], e), mix(a[1], b[1], e)];
const win = (t: number, a: number, b: number, c: number, d: number) => E.io(ph(t, a, b)) * (1 - E.io(ph(t, c, d)));
const aimC = (p: Pt, s: Pt, z: number): Cam => ({ x: p[0] - (s[0] - W / 2) / z, y: p[1] - (s[1] - H / 2) / z, z });
const toS = (k: Cam, p: Pt): Pt => [(p[0] - k.x) * k.z + W / 2, (p[1] - k.y) * k.z + H / 2];

/** 回忆：画进缓冲，再整幅洗成褪色的暖色老照片（amount 0 就是现在的颜色） */
function memory(c: C, draw: (c: C) => void, amount: number) {
  if (amount < 0.01) return draw(c);
  const b = buf(4);
  draw(b.c);
  blit(c, b, 1, `sepia(${0.6 * amount}) saturate(${1 - 0.2 * amount}) brightness(${1 + 0.06 * amount}) contrast(${1 - 0.1 * amount})`);
  const g = c.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 1150);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(1, `rgba(255,243,226,${0.55 * amount})`);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}

// ---------- ① 十二年前 ----------
export const GZ0 = X0 - 200; // 七岁的她站的地方（1:47.9 小石头站在同一个地方，同一个构图）
const T_EYES = 54.35; // 睁开眼，往上看
const T_FLASH = 55.3; // 妈妈进了白：天上一闪
const T_STEP0 = 55.62; // 想走：脚从大靴子里滑出来
const T_SIT = 55.85; // 摔坐在灰里
const T_BRICK = 55.95; // 捡起一块砖
const WRITE: [number, number] = [56.12, 56.85]; // 写「活下去」
const T_STUFF = 56.9; // 塞进靴子
const T_FOOT = 57.12; // 脚伸进去，卡住了
const T_UP = 57.25; // 站起来
const STEPS = [57.513, 58.013, 58.513, 59.013, 59.513, 60.013, 60.513]; // 一拍一步，一步一年
const T_LAST = 60.513;
const T_WHIP = 60.56; // 顺着她的视线甩上去
const ROOM_IN = 60.9;
const WALK_TO = GZ0 - 640;
/** 她长到几岁（0 = 七岁，1 = 十九岁） */
const age = (t: number) => E.io(ph(t, 57.45, 60.35));
const LITTLE = LOOKS.little;
const QIN = LOOKS.qin;
function girlLook(a: number) {
  return { top: blend(LITTLE.top, QIN.top, a), bottom: blend(LITTLE.bottom, QIN.bottom, a), legs: blend(LITTLE.legs!, QIN.legs!, a), accent: blend(LITTLE.top, QIN.accent!, a), skin: QIN.skin, hair: QIN.hair, shoe: QIN.shoe };
}
const girlX = (t: number) => {
  if (t < STEPS[0] - 0.05) return GZ0;
  // 一拍一步，每一步往前冲一下（时间在跳）
  const u = ph(t, STEPS[0] - 0.05, T_LAST + 0.02);
  const steps = u * (STEPS.length - 1);
  const frac = steps - Math.floor(steps);
  return GZ0 + (WALK_TO - GZ0) * ((Math.floor(steps) + E.io(frac)) / (STEPS.length - 1));
};
/** 路上飘起来的人：她走过去，伸手把他们拽下来 */
const FLOATERS = [
  { x: GZ0 - 210, t: 58.6, seed: 61, kind: "man" as const },
  { x: GZ0 - 430, t: 59.62, seed: 66, kind: "woman" as const },
];
function floaterFig(fl: (typeof FLOATERS)[number], t: number): Fig {
  const pulled = E.in2(ph(t, fl.t, fl.t + 0.22));
  const bob = Math.sin(t * 2 + fl.seed) * 6;
  const h = mix(150 + bob, 0, pulled);
  const sit = E.io(ph(t, fl.t + 0.18, fl.t + 0.35));
  return { x: fl.x, y: -h - 60 * (1 - sit) - 30 * sit, grounded: false, kind: fl.kind, facing: 1, float: 0.85 * (1 - pulled), lean: -0.05, legL: mix(-0.1, 1.4, sit), legR: mix(0.15, 1.3, sit), kneeL: mix(0.3, 1.5, sit), kneeR: mix(0.45, 1.4, sit), aL: mix(-2.4, -0.3, pulled), aR: mix(2.4, 0.4, pulled), head: mix(0.5, -0.4, sit), eyes: pulled > 0.5 ? "open" : "closed", look: crowdLook(fl.seed), tone: 0.05, rim: 0.6, tie: false };
}
function girlFig(t: number): { f: Fig; boots: [Pt | null, Pt | null]; brick: { p: Pt; rot: number; words: string } | null } {
  const a = age(t);
  const s = mix(0.6, 1, a);
  const L: Fig = { x: GZ0, y: 0, kind: "qin", s, headScale: mix(1.35, 1, a), coat: mix(0.6, 0.78, a), look: girlLook(a), barefoot: true, rim: 0.75, tears: t < 57.4 ? 1 : 0 };
  const lift = 16 - 6 * s; // 大靴子的靴底比光脚厚
  // 站着仰着头（刚被放回地上）
  if (t < T_STEP0) {
    const up = E.io(ph(t, T_EYES, T_EYES + 0.3));
    const f: Fig = { ...L, y: -lift, facing: -1, head: mix(-0.1, 1.0, up), aL: -0.15, aR: 0.15, eyes: t < T_EYES ? "closed" : "open" };
    const j = pose(f);
    return { f, boots: [j.anL, j.anR], brick: null };
  }
  // 往前迈一步，左脚从靴子里滑出来，摔坐在灰里；捡起一块砖写字，塞进靴子
  if (t < T_UP) {
    const fall = E.in2(ph(t, T_STEP0 + 0.08, T_SIT));
    const step = E.io(ph(t, T_STEP0, T_STEP0 + 0.16));
    const j0 = pose({ ...L, y: -lift, facing: -1 });
    const bootL: Pt = j0.anL; // 左脚那只靴子留在原地
    const sitY = -lift * 0.3;
    const pick = E.io(ph(t, T_BRICK, T_BRICK + 0.15));
    const writing = ph(t, WRITE[0], WRITE[1]);
    const stuff = E.io(ph(t, T_STUFF - 0.05, T_FOOT));
    const footIn = E.io(ph(t, T_FOOT - 0.08, T_FOOT + 0.05));
    const f: Fig = {
      ...L,
      grounded: false,
      x: GZ0 + 6 * fall,
      y: mix(-lift - 52 * s, sitY - 26 * s, fall),
      facing: -1,
      lean: mix(0, 0.25, fall) - 0.2 * pick * (1 - stuff),
      legL: mix(-0.35 * step, -1.35, fall),
      kneeL: mix(0.3 * step, 0.5, fall),
      legR: mix(0, -1.2, fall),
      kneeR: mix(0, 0.9, fall),
      head: mix(1.0, -0.45, E.io(ph(t, T_STEP0, T_BRICK))),
      eyes: "open",
    };
    const j = pose(f);
    const lap: Pt = [j.hip[0] - 22 * s, j.hip[1] - 18 * s];
    const ground0: Pt = [GZ0 - 48, -10];
    const writePos: Pt = [lap[0] - 4, lap[1] - 10];
    let bp: Pt = lerpPt(ground0, writePos, pick);
    bp = lerpPt(bp, [bootL[0] + 2, bootL[1] - 18], stuff);
    const brick = t < T_FOOT ? { p: bp, rot: mix(0.3, -0.06, pick) + 1.2 * stuff, words: writeOn("活下去", writing) } : null;
    // 一只手拿砖，一只手写；写完塞进靴子；光着的左脚伸回靴子里
    const hR: Pt = lerpPt([j.neck[0] - 10, j.neck[1] + 30], [bp[0] + 8, bp[1] + 2], pick);
    const pen: Pt = [writePos[0] + 10 - 16 * writing + Math.sin(t * 40) * 3 * (writing > 0 && writing < 1 ? 1 : 0), writePos[1] - 6];
    const hL: Pt = writing > 0 && stuff < 0.5 ? pen : lerpPt([j.neck[0] - 6, j.neck[1] + 34], [bp[0] - 6, bp[1]], stuff);
    const fLeft: Pt | undefined = footIn > 0 ? lerpPt(j.anL, [bootL[0], bootL[1]], footIn) : undefined;
    const ff = { ...f, hL, hR, fL: fLeft };
    const jj = pose(ff);
    return { f: ff, boots: [footIn >= 1 ? jj.anL : bootL, jj.anR], brick };
  }
  // 站起来，一拍一步往前走，一步一年
  const rise = E.io(ph(t, T_UP, STEPS[0]));
  const x = girlX(t);
  const walking = t > STEPS[0] - 0.05 && t < T_LAST;
  const w = walk((t - STEPS[0]) * 1.0 + 0.25, walking ? mix(0.36, 0.42, a) : 0);
  const look = E.io(ph(t, T_LAST - 0.05, T_LAST + 0.12)); // 最后一步，抬头看那栋楼
  let hR: Pt | undefined;
  // 路上伸手把飘起来的人拽下来
  for (const fl of FLOATERS) {
    const g = win(t, fl.t - 0.22, fl.t - 0.05, fl.t + 0.12, fl.t + 0.3);
    if (g > 0.01) {
      const fj = pose(floaterFig(fl, Math.min(t, fl.t)));
      const j0 = pose({ ...L, x, y: -lift, facing: -1 });
      hR = lerpPt([j0.neck[0] - 10, j0.neck[1] + 30], [fj.anL[0], fj.anL[1] + 4], g);
    }
  }
  const f: Fig = { ...L, x, y: -lift - 26 * s * (1 - rise), facing: -1, lean: mix(0.25, 0.04, rise), legL: w.legL, legR: w.legR, kneeL: w.kneeL + 0.6 * (1 - rise), kneeR: w.kneeR + 0.6 * (1 - rise), aL: w.aL, aR: w.aR, head: mix(0.0, 1.05, look), eyes: "open", hR };
  const j = pose(f);
  return { f, boots: [j.anL, j.anR], brick: null };
}
/** 妈妈光着的脚和锈红色的裙角，往上飘走 */
function momLeaving(c: C, t: number) {
  if (t > T_FLASH) return;
  const h = 300 + 520 * E.in2(ph(t, 53.94, T_FLASH));
  figure(c, { x: GZ0 + 30, y: -h, grounded: false, kind: "woman", facing: -1, look: LOOKS.mom, barefoot: true, float: 1, aL: -2.6, aR: 2.6, legL: 0.05, legR: -0.08, kneeL: 0.2, kneeR: 0.3, head: 0.6, eyes: "closed", rim: 0.5 }, t);
}
/** 十二年前的街上：打伞的人低着头走过去（她长大的那几步里，走得飞快，像快进） */
function passers(c: C, t: number) {
  const fast = E.io(ph(t, 57.3, 57.6));
  const people: [number, 1 | -1, number, number][] = [
    [GZ0 + 260, -1, 70, 3],
    [GZ0 - 330, 1, 60, 9],
    [GZ0 + 520, -1, 80, 15],
  ];
  people.forEach(([x0, dir, v, seed], i) => {
    const slow = Math.min(t, 57.45) - 54.6;
    const quick = Math.max(0, t - 57.45);
    const x = x0 + dir * (v * slow + v * 6 * quick);
    const wk = walk(t * (1.4 + 3 * fast) + i * 0.4, 0.3);
    figure(c, { x, y: -44, s: 0.74, kind: (["man", "woman", "worker"] as const)[i % 3], facing: dir, head: -0.75, legL: wk.legL, legR: wk.legR, kneeL: wk.kneeL, kneeR: wk.kneeR, umbrella: true, umbrellaColor: UMBRELLAS[(i * 3 + 1) % UMBRELLAS.length], look: crowdLook(seed), aL: -0.5, bendL: -1.6, tie: false, tone: 0.5, rim: 0.25 }, t);
  });
}
// 构图 A：她（以后是小石头）站在画面下面三分之一，头顶是一大片天
export const MIRROR_S: Pt = [W / 2, 1290];
export const MIRROR_Z = 1.55;
export const mirrorCam = (t: number, t0: number, x = GZ0): Cam => {
  const e = E.out(ph(t, t0, t0 + 3));
  return aimC([x, -60], [MIRROR_S[0], mix(MIRROR_S[1], 1350, e)], MIRROR_Z * mix(1, 0.88, e));
};
/** 副歌一最后一帧，秤砣闭着的眼睛在画面 END_S；七岁的她的脸从同一个位置、同样大小开始 */
const FACE_Z = (END_Z * 13) / (13 * 0.6 * 1.35);
const follow = (s: number) => aimC([girlX(s) - 60, -200 - 60 * age(s)], [W / 2, 1180], mix(2.3, 1.65, age(s)));
function pastCam(t: number): Cam {
  const head = pose(girlFig(Math.min(t, T_STEP0 - 0.01)).f).head;
  const k0 = aimC(head, END_S, FACE_Z * (1 - 0.04 * ph(t, 53.94, T_EYES)));
  // 顺着她的视线抬上去：光着的脚往上飘走
  const up = aimC([GZ0 + 10, -420], [W / 2, 900], 1.9);
  let k = camLerp(k0, up, E.io(ph(t, T_EYES + 0.1, 54.95)));
  // 退回来：她站在灰里，一双大靴子（构图 A）
  k = camLerp(k, mirrorCam(t, 55.0), E.io(ph(t, 54.95, 55.6)));
  // 摔倒、写字：镜头凑过去，落到砖上
  const brick = aimC([GZ0 - 20, -40], [W / 2, 1040], 3.3);
  k = camLerp(k, brick, E.io(ph(t, T_SIT - 0.1, WRITE[0] + 0.2)));
  // 站起来走：镜头跟着她横着走，越退越开（时间在快进）
  k = camLerp(k, follow(t), E.io(ph(t, T_FOOT, STEPS[0] + 0.2)));
  // 最后一步：她抬头看那栋楼——镜头顺着视线甩上去
  if (t > T_WHIP) {
    const u = ph(t, T_WHIP, ROOM_IN);
    const kw = follow(T_WHIP);
    return { ...kw, y: kw.y - 2600 * E.in2(u) };
  }
  return k;
}
/** 时间在快进：天一明一暗，最后一步落在夜里 */
const nightAt = (t: number) => (t < 57.5 ? 0 : t > T_LAST ? mix(0.8, 0.9, ph(t, T_LAST, ROOM_IN)) : 0.4 - 0.4 * Math.cos((2 * Math.PI * (t - 57.5)) / 1.2));
const TOWER_X = -2050;
function drawPast(c: C, t: number) {
  const k0 = pastCam(t);
  const k = jolt(k0, shake(t, 5 * STEPS.reduce((a, s) => a + kick(t, s, 0.08), 0) + 7 * kick(t, T_SIT, 0.1), 2));
  const kp = pastCam(t - 1 / 60);
  const vy = Math.abs((k0.y - kp.y) * k0.z);
  const vx = Math.abs((k0.x - kp.x) * k0.z);
  const night = nightAt(t);
  const scene = (c: C) => {
    sky(c, k, { night });
    whiteBand(c, k, t, 1, 0.6);
    city(c, k, { layers: [0, 1, 2], lights: night * 0.6, night });
    c.save();
    applyCam(c, k);
    if (k.x - W / 2 / k.z < TOWER_X + 520) {
      c.save();
      c.translate(TOWER_X, 0);
      tower(c, { night, lights: night * 0.4 });
      c.restore();
    }
    facades(c, k, { night, lights: night });
    net(c, -5200, 5200, -1350, t, [-140, 140]);
    ground(c, k, { tone: night });
    momLeaving(c, t);
    passers(c, t);
    for (const fl of FLOATERS) if (t > fl.t - 0.75) figure(c, { ...floaterFig(fl, t), alpha: clamp((t - fl.t + 0.75) / 0.3) }, t); // 快进里的某一天，有人飘了起来
    const g = girlFig(t);
    figure(c, g.f, t);
    // 大靴子（妈妈的）：一直是大人的尺寸；她长大了，靴子就合脚了。靴口里的砖越塞越多
    const a = age(t);
    g.boots.forEach((b, i) => {
      if (!b) return;
      bigBoot(c, b[0], b[1] + 2, 1, -1, 0);
      const bricks = Math.floor(a * 4 + (t > T_FOOT ? 1 : 0));
      if (i === 0 && bricks > 0) {
        c.fillStyle = "#e3dad6";
        for (let q = 0; q < Math.min(4, bricks); q++) c.fillRect(b[0] - 12 + (q % 2) * 12, b[1] - 36 - Math.floor(q / 2) * 6, 10, 6);
      }
    });
    if (g.brick) stone(c, g.brick.p[0], g.brick.p[1], 15, g.brick.words, 0, g.brick.rot);
    crack(c, girlX(t), 0, 40, ph(t, T_LAST, T_LAST + 0.15) * 0.8);
    c.restore();
    ash(c, t, k, { n: t > T_FLASH ? 0.9 : 0.4 });
    // 天上一闪：妈妈进了白
    const f = kick(t, T_FLASH, 0.35) * (t > T_FLASH ? 1 : 0);
    if (f > 0.01) {
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, `rgba(255,250,240,${0.85 * f})`);
      gr.addColorStop(1, "rgba(255,240,230,0)");
      c.fillStyle = gr;
      c.fillRect(0, 0, W, H);
    }
  };
  const sep = 1 - E.io(ph(t, 58.6, 60.3));
  memory(c, (c) => (vy > 4 ? smearV(c, Math.min(220, vy * 0.6), scene) : vx > 8 ? smearH(c, Math.min(60, vx * 0.4), scene) : scene(c)), sep);
  vignette(c, 0.3 + 0.2 * night);
}
const s24: Shot = {
  a: 53.94,
  b: ROOM_IN,
  xin: 0.45,
  draw(c, t) {
    drawPast(c, t);
    caption(c, ["十二年前"], t, 54.25, 56.0, 260, 60);
  },
};

// ---------- ② 现在：夜里她的屋子 ----------
const KNOCKS = [62.013, 62.513, 63.013];
const T_DOOR = 64.0;
const KID_X = 540; // 门口
const T_KNIFE_OUT = 61.12; // 从兜里掏出刀
const T_BLADE = 61.45; // 刀刃抵上脚绳
const T_OFF = 63.12; // 第三下敲门：她从窗台上下来
const T_DROP = 67.013; // 刀掉在地上「当」
const TIE: [number, number] = [67.25, 68.7];
const SILL_Y = -200; // 窗台
/** 屋子右边：楼梯间的剖面，一层一层往下转（她住在全城最高那栋楼的最顶上） */
function stairwell(c: C, k: Cam) {
  const x0 = 600;
  const x1 = 1180;
  const vy1 = k.y + (H / 2 + 200) / k.z;
  c.fillStyle = "#2c2950"; // 楼梯间外面：楼里的黑
  c.fillRect(x1, -1400, 3000, Math.max(0, vy1 + 1400));
  c.fillStyle = "#3f4478";
  c.fillRect(x0, -620, x1 - x0, Math.max(0, vy1 + 620));
  for (let n = 0; n < 60; n++) {
    const y = n * 300;
    if (y > vy1 + 300) break;
    const fade = Math.exp(-n * 0.16);
    c.fillStyle = `rgba(150,138,178,${0.95 * fade + 0.05})`;
    c.fillRect(x0, y - 10, x1 - x0, 10);
    const dir = n % 2 ? -1 : 1;
    const sx = dir > 0 ? x0 + 60 : x1 - 60;
    const ex = dir > 0 ? x1 - 60 : x0 + 60;
    c.strokeStyle = `rgba(170,156,196,${0.9 * fade + 0.05})`;
    c.lineWidth = 12;
    c.beginPath();
    c.moveTo(sx, y);
    c.lineTo(ex, y + 300);
    c.stroke();
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(sx, y - 70);
    c.lineTo(ex, y + 230);
    c.stroke();
    c.fillStyle = `rgba(90,82,130,${fade})`;
    c.fillRect(x1 - 120, y - 200, 70, 190);
    // 他一路踩上来的灰脚印
    if (n < 30) {
      c.fillStyle = `rgba(255,245,240,${0.5 * fade})`;
      for (let q = 0; q < 5; q++) {
        const u = (q + 0.5) / 5;
        c.beginPath();
        c.ellipse(mix(sx, ex, u) + (q % 2 ? 6 : -6), y + 300 * u - 8, 7, 3, 0, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
  const g = c.createLinearGradient(0, 200, 0, 4200);
  g.addColorStop(0, "rgba(40,40,80,0)");
  g.addColorStop(1, "rgba(30,30,70,0.97)");
  c.fillStyle = g;
  c.fillRect(x0, 200, x1 - x0, 4000);
}
/** 推开的防飘栏和窗外的白 */
function openWindow(c: C, t: number) {
  const g = c.createLinearGradient(0, -500, 0, -200);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#ffe9dc");
  c.fillStyle = g;
  c.fillRect(-120, -500, 300, 300);
  const cols = ["255,150,185", "255,192,128", "255,234,140", "150,228,190", "148,198,255", "200,168,255"];
  cols.forEach((col, i) => {
    c.fillStyle = `rgba(${col},${0.35 + 0.1 * Math.sin(t * 2 + i)})`;
    c.fillRect(-120, -500 + i * 9, 300, 9);
  });
  // 推开的栏杆（合页在左边）
  c.save();
  c.translate(-120, -500);
  c.transform(0.32, 0.08, 0, 1, 0, 0);
  c.fillStyle = "#7a5e66";
  for (let i = 0; i <= 6; i++) c.fillRect(i * 49 - 8, 0, 7, 300);
  c.fillRect(-8, 0, 300, 8);
  c.fillRect(-8, 292, 300, 8);
  c.restore();
  c.fillStyle = "#b9a6bd";
  c.fillRect(-140, SILL_Y - 4, 340, 12);
  c.save();
  c.globalAlpha = 0.3;
  const lg = c.createLinearGradient(0, -200, 0, 0);
  lg.addColorStop(0, "rgba(255,240,250,0.9)");
  lg.addColorStop(1, "rgba(255,240,250,0)");
  c.fillStyle = lg;
  c.beginPath();
  c.moveTo(-120, -200);
  c.lineTo(180, -200);
  c.lineTo(360, 0);
  c.lineTo(-80, 0);
  c.closePath();
  c.fill();
  c.restore();
}
/** 光着脚的她飘得起来：倒着「坐」在窗框上沿（用户 2026-10-15：「她没穿鞋，应该飘起来倒着坐在窗户上，拿着小刀犹豫」）。
 *  画法：在以窗框上沿为镜面的镜像坐标里画一个坐在窗台上的人，镜像回去就是倒挂在窗框下面 */
const LINTEL = -500;
const SIT_LOCAL: Pt = [-30, -16];
const realOf = (p: Pt): Pt => [p[0], LINTEL - p[1]];
const T_BOOTS_ON = 63.513; // 第三下敲门以后顺着脚绳把自己拽下来，脚跺进靴子「咚」（镜头这时在门上，只听得见）
function qinNow(t: number): { f: Fig; knife: { p: Pt; rot: number; fold: number } | null; mirrored: boolean } {
  // 倒挂在窗框上 → 掏出刀，凑到脚绳上又缩回来（犹豫）→ 三声敲门，一惊 → 拽着脚绳下来、穿上靴子、走到门口开门 → 刀掉在地上 → 跪下系结
  if (t < T_OFF) {
    const flinch = KNOCKS.reduce((a, kt) => a + kick(t, kt, 0.12), 0);
    const turn = E.io(ph(t, 62.55, 62.75));
    const base: Fig = { x: SIT_LOCAL[0], y: SIT_LOCAL[1], grounded: false, kind: "qin", facing: 1, barefoot: true, boots: false, float: 0, lean: -0.1 + 0.2 * (1 - turn) - 0.1 * flinch, fL: [SIT_LOCAL[0] + 52, 0], fR: [SIT_LOCAL[0] + 62, 0], head: mix(-0.5, 0.15, turn) + 0.3 * flinch, eyes: flinch > 0.3 ? "wide" : "open", rim: 0.9, tears: t < 62 ? 1 : 0 };
    const j = pose(base);
    const out = E.io(ph(t, T_KNIFE_OUT - 0.2, T_KNIFE_OUT));
    // 犹豫：刀刃凑到绳子上，又缩回来；第一声敲门以后缩回去不动了
    const reach = E.io(ph(t, T_KNIFE_OUT + 0.08, T_BLADE));
    const waver = t < T_BLADE ? 1 : 0.62 + 0.38 * Math.cos(((t - T_BLADE) * 2 * Math.PI) / 0.62);
    const knocked = E.io(ph(t, KNOCKS[0], KNOCKS[0] + 0.15));
    const approach = reach * mix(waver, 0.15, knocked);
    const tremble = Math.sin(t * 47) * 1.6 * approach;
    const pocket: Pt = [j.hip[0] + 8, j.hip[1] - 4];
    const blade: Pt = [j.anR[0] - 4, j.anR[1] - 16];
    const away: Pt = [j.neck[0] + 26, j.neck[1] + 44];
    let hR: Pt = lerpPt([j.neck[0] + 20, j.neck[1] + 50], pocket, out);
    hR = lerpPt(hR, lerpPt(away, [blade[0] + tremble, blade[1]], approach), reach);
    const hL: Pt = [j.anR[0] + 6, j.anR[1] - 22];
    const unfold = 1 - E.io(ph(t, T_KNIFE_OUT, T_KNIFE_OUT + 0.18));
    return { f: { ...base, hR, hL }, knife: out > 0.5 ? { p: [hR[0] + 2, hR[1] + 2], rot: mix(-0.9, 2.9, reach), fold: unfold } : null, mirrored: true };
  }
  // 拽着脚绳下来、穿上靴子（镜头在门上），攥着刀走进画面、走到门口
  const go = ph(t, T_BOOTS_ON + 0.05, T_DOOR - 0.05);
  const x = mix(60, KID_X - 120, E.io(go));
  if (t < 66.6) {
    const w = walk((t - T_BOOTS_ON) * 2.1, go > 0 && go < 1 ? 0.42 : 0);
    const hand: Pt = [x + 18, -95];
    const open = win(t, T_DOOR - 0.15, T_DOOR, T_DOOR + 0.25, T_DOOR + 0.45);
    const f: Fig = { x, y: 0, kind: "qin", facing: 1, boots: t > T_BOOTS_ON, barefoot: t <= T_BOOTS_ON, legL: w.legL, legR: w.legR, kneeL: w.kneeL, kneeR: w.kneeR, lean: 0.06, head: t > T_DOOR + 0.6 ? -0.25 : 0.0, hR: hand, hL: open > 0 ? [x + 60, -120] : undefined, aL: -0.3, rim: 0.85, eyes: t > T_DOOR + 0.2 ? "wide" : "open" };
    return { f, knife: { p: [hand[0] + 2, hand[1] + 2], rot: 1.9, fold: 0 }, mirrored: false };
  }
  // 刀从手里掉下去「当」；跪下，把他的红绳和自己的脚绳系成一个结
  const fallK = ph(t, 66.6, T_DROP);
  const kneel = E.io(ph(t, T_DROP, T_DROP + 0.35));
  const xk = KID_X - 116;
  const f: Fig = { x: xk, y: 0, kind: "qin", facing: 1, boots: true, legL: mix(-0.1, 1.25, kneel), kneeL: mix(0.1, 2.0, kneel), legR: mix(0.1, 0.35, kneel), kneeR: mix(0.1, 1.7, kneel), lean: mix(0.06, 0.3, kneel), head: mix(0.0, -0.6, kneel), rim: 0.85, eyes: "open", tears: 1 };
  const fj = pose(f);
  const knot = knotAt();
  const tie = E.io(ph(t, TIE[0], TIE[0] + 0.3));
  const twist = Math.sin(t * 9) * 4 * clamp(ph(t, TIE[0] + 0.3, TIE[1] - 0.3)) * (1 - ph(t, TIE[1] - 0.3, TIE[1]));
  const rest: Pt = [fj.neck[0] + 22, fj.neck[1] + 54];
  const hR: Pt = tie > 0 ? lerpPt(rest, [knot[0] + 7, knot[1] - 4 + twist], tie) : rest;
  const hL: Pt = tie > 0 ? lerpPt([fj.neck[0] + 10, fj.neck[1] + 60], [knot[0] - 8, knot[1] - 2 - twist], tie) : [fj.neck[0] + 10, fj.neck[1] + 60];
  const lookUp = E.io(ph(t, TIE[1], TIE[1] + 0.4));
  const kp: Pt = fallK < 1 ? [mix(KID_X - 102 + 2, xk - 34, fallK), mix(-93, -6, fallK * fallK)] : [xk - 34, -6];
  return { f: { ...f, hR, hL, head: f.head! + 0.7 * lookUp, eyes: lookUp > 0.5 ? "smile" : "open" }, knife: { p: kp, rot: fallK < 1 ? 1.9 + fallK * 5 : 0.08, fold: 0 }, mirrored: false };
}
const knotAt = (): Pt => [KID_X - 50, -12];
const KID_COAT = { top: "#f39a5f", accent: "#e65a4f" };
function kidNow(t: number): Fig {
  const pant = Math.sin(t * 9) * 0.05 * (1 - ph(t, 66.0, 67.5));
  const smile = E.io(ph(t, TIE[1] + 0.1, TIE[1] + 0.5));
  const offer = win(t, 64.5, 64.85, TIE[0], TIE[0] + 0.3); // 把那截红绳举给她：拴住我
  return { x: KID_X, y: 0, kind: "kid", look: KID_COAT, coat: 1.55, facing: -1, lean: 0.14 + pant - 0.1 * offer, head: mix(0.35, 0.1, ph(t, 65.4, 66.0)) + 0.15 * smile, aR: mix(0.9, 0.4, offer), bendR: mix(-1.3, -0.4, offer), aL: -0.2 - 1.75 * offer, bendL: 0.35 * offer, rim: 0.85, eyes: smile > 0.5 ? "smile" : "open", tears: 1, bell: true, barefoot: true };
}
function nowCam(t: number): Cam {
  // 甩进来：倒挂在窗框下面的她 → 直直地、慢慢地逼近刀和绳子（刀一下一下凑上去又缩回来）
  const sit = aimC([0, -400], [W / 2, 900], 2.3);
  const blade = aimC([30, -470], [W / 2, 860], 4.3);
  let k = camLerp(sit, blade, 0.25 * E.io(ph(t, 61.2, 61.65)) + 0.75 * ph(t, 61.65, 63.0));
  // 第三下敲门：顺着她的视线甩到门上
  const doorCam = aimC([KID_X - 60, -140], [W / 2, 1000], 2.5);
  k = camLerp(k, doorCam, E.io(ph(t, 63.05, 63.38)));
  if (t < T_DOOR + 0.3) return k;
  // 门开了：推到喘着气的小石头 → 落到他举起来的那截红绳 → 横过去落到她手里的刀（一个要把绳子割断，一个拿着绳子来拴住她）
  // → 退回两个人 → 结 → 两张脸
  const kj = pose(kidNow(t));
  const qj = pose(qinNow(t).f);
  const kid = aimC([KID_X - 10, -110], [W / 2, 980], 3.0);
  const ropeK = aimC([kj.handL[0] - 6, kj.handL[1] + 18], [W / 2, 980], 4.0);
  const knifeK = aimC([qj.handR[0] + 6, qj.handR[1] + 4], [W / 2, 980], 4.0);
  const two = aimC([KID_X - 70, -110], [W / 2, 1030], 2.8);
  const knot = aimC(knotAt(), [W / 2, 1040], 4.4);
  const faces = aimC([KID_X - 62, -140], [W / 2, 1000], 3.1);
  k = camLerp(k, kid, E.io(ph(t, 64.25, 64.75)));
  k = camLerp(k, ropeK, E.io(ph(t, 64.85, 65.3)));
  k = camLerp(k, knifeK, E.io(ph(t, 65.4, 65.9)));
  k = camLerp(k, two, E.io(ph(t, 66.0, 66.5)));
  k = camLerp(k, knot, E.io(ph(t, T_DROP - 0.1, TIE[0] + 0.3)) * 0.6 + 0.4 * E.out(ph(t, TIE[0], TIE[1])));
  return camLerp(k, faces, E.io(ph(t, TIE[1] - 0.05, TIE[1] + 0.6)));
}
function drawFoldKnife(c: C, p: Pt, rot: number, fold: number) {
  c.save();
  c.translate(p[0], p[1]);
  c.rotate(rot);
  c.scale(0.62, 0.62);
  c.fillStyle = "#3a2c22";
  c.fillRect(-34, -5, 36, 11);
  c.rotate(-fold * 2.9);
  c.fillStyle = "#d4d7dc";
  c.beginPath();
  c.moveTo(0, -4);
  c.lineTo(46, -1);
  c.lineTo(52, 3);
  c.lineTo(0, 5);
  c.closePath();
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.85)";
  c.fillRect(6, -3, 34, 2);
  c.restore();
}
function drawNow(c: C, t: number, kOverride?: Cam) {
  let shk: [number, number] = [0, 0];
  for (const kt of KNOCKS) {
    const s = shake(t, 9 * kick(t, kt, 0.09), kt);
    shk = [shk[0] + s[0], shk[1] + s[1]];
  }
  const k0 = kOverride ?? nowCam(t);
  const k = kOverride ? k0 : { ...jolt(k0, shk), z: k0.z * (1 + KNOCKS.reduce((a, kt) => a + 0.02 * kick(t, kt, 0.1), 0)) };
  const kp = nowCam(t - 1 / 60);
  const vx = kOverride ? 0 : Math.abs((k0.x - kp.x) * k0.z);
  const vy = kOverride ? 0 : Math.abs((k0.y - kp.y) * k0.z);
  const scene = (c: C) => {
    c.save();
    applyCam(c, k);
    qinRoom(c, t, { night: 0.88, boots: t < T_BOOTS_ON ? 1 : undefined, glare: 1, doorOpen: E.out(ph(t, T_DOOR, T_DOOR + 0.45)) });
    openWindow(c, t);
    stairwell(c, k);
    const q = qinNow(t);
    let qj: ReturnType<typeof pose>;
    if (q.mirrored) {
      // 倒挂在窗框下面：在镜像坐标里画
      c.save();
      c.translate(0, LINTEL);
      c.scale(1, -1);
      const jl = figure(c, q.f, t);
      if (q.knife) drawFoldKnife(c, q.knife.p, q.knife.rot, q.knife.fold);
      c.restore();
      qj = { ...jl, anR: realOf(jl.anR), anL: realOf(jl.anL), handR: realOf(jl.handR), handL: realOf(jl.handL), head: realOf(jl.head) };
      // 她的脚绳：从窗框上的脚踝一直绷到地上的椅子腿——她就是被这根绳子拴着才没飘出窗外
      rope(c, BEDPOST, qj.anR, 0, 3.2);
    } else {
      qj = figure(c, q.f, t);
      // 她的脚绳：从椅子腿拴到脚踝
      rope(c, BEDPOST, qj.anR, 40, 3.2);
    }
    if (t > T_DOOR - 0.05) {
      const kj = figure(c, kidNow(t), t);
      const tied = t > TIE[1] - 0.4;
      const end: Pt = tied ? knotAt() : [kj.handL[0] - 4, kj.handL[1] + 46];
      rope(c, kj.handL, end, 8, 2.6); // 他攥着的那截红绳（他妈妈割断的）
      if (t > TIE[0]) rope(c, [qj.anR[0], qj.anR[1]], knotAt(), 10, 3.2);
      const kn = E.out(ph(t, TIE[1] - 0.4, TIE[1]));
      if (kn > 0) {
        c.fillStyle = "#d65a4c";
        c.beginPath();
        c.arc(knotAt()[0], knotAt()[1], 7 * kn, 0, Math.PI * 2);
        c.fill();
      }
      // 他身上的灰
      c.fillStyle = "rgba(255,248,246,0.8)";
      for (let i = 0; i < 9; i++) {
        c.beginPath();
        c.arc(KID_X - 14 + (i % 3) * 9, -96 + Math.floor(i / 3) * 18 + (i % 2) * 4, 2.2, 0, Math.PI * 2);
        c.fill();
      }
    }
    if (q.knife && !q.mirrored) drawFoldKnife(c, q.knife.p, q.knife.rot, q.knife.fold);
    c.restore();
  };
  if (vx > 6) smearH(c, Math.min(130, vx * 0.5), scene);
  else if (vy > 6) smearV(c, Math.min(130, vy * 0.5), scene);
  else scene(c);
  // 打好结：一点暖
  const warm = E.io(ph(t, TIE[1] - 0.3, TIE[1] + 0.3));
  if (warm > 0.01) {
    const p = toS(k, knotAt());
    const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], 760);
    g.addColorStop(0, `rgba(${PAL.warmRGB},${0.26 * warm})`);
    g.addColorStop(1, `rgba(${PAL.warmRGB},0)`);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }
  vignette(c, 0.55 - 0.15 * warm);
}
const s27: Shot = {
  a: ROOM_IN,
  b: 69.5,
  draw(c, t) {
    if (t < ROOM_IN + 0.25) {
      // 甩上去的拖影里落进她的屋子：街 → 屋子
      const e = E.io(ph(t, ROOM_IN - 0.02, ROOM_IN + 0.25));
      const k = nowCam(t);
      const kIn = { ...k, y: k.y + 900 * (1 - e) ** 2 };
      smearV(c, 180 * (1 - e) + 4, (c) => {
        drawPast(c, Math.min(t, ROOM_IN - 0.001));
        c.save();
        c.globalAlpha = e;
        drawNow(c, t, kIn);
        c.restore();
      });
      return;
    }
    drawNow(c, t);
  },
};

// ---------- ③ 夜里：天花板上她的床旁边钉了一张小床，两个人都倒着睡在天花板上（用户 2026-10-15）；
// 他把妈妈那件缝了铅的外套叠在椅子上才飘得上去；两根绳子系在一起，拴在椅子腿上 ----------
/** 小石头倒着睡在天花板上那张小床底下（头朝右，脚朝她） */
export function kidCeilingSleep(t: number, o: Partial<Fig> = {}): Fig {
  return { x: 112, y: -530, grounded: false, kind: "kid", facing: 1, lean: 1.52, legL: -1.5, legR: -1.42, kneeL: 0.1, kneeR: 0.2, aL: Math.PI - 1.1 + Math.sin(t * 0.9 + 1) * 0.1, aR: Math.PI - 0.8 + Math.sin(t * 1.1) * 0.1, head: 0.2, float: 0.95, eyes: "closed", rim: 0.6, bell: true, barefoot: true, ...o };
}
/** 他的绳子系在她脚绳上的那个结 */
export const knotOnRope = (qa: Pt): Pt => [mix(BEDPOST[0], qa[0], 0.62), mix(BEDPOST[1], qa[1], 0.62)];
/** 画两根系在一起的绳子：她的脚踝 → 椅子腿；他的脚踝 → 结 */
export function tiedRopes(c: C, qa: Pt, ka: Pt, sag = 0) {
  rope(c, BEDPOST, qa, sag, 3.2);
  const kn = knotOnRope(qa);
  rope(c, ka, kn, 26, 2.6);
  c.fillStyle = "#d65a4c";
  c.beginPath();
  c.arc(kn[0], kn[1], 6, 0, Math.PI * 2);
  c.fill();
}
function sleepers(c: C, t: number) {
  const j = figure(c, qinFloatSleep(t, 1, { eyes: "closed" }), t);
  const kj = figure(c, kidCeilingSleep(t), t);
  tiedRopes(c, j.anR, kj.anL);
}
export function sleepCam(t: number): Cam {
  // 从地上（椅子、叠着的外套、她的靴子）抬上去：天花板上倒着睡的两个人
  const floor = aimC([-180, -80], [W / 2, 1150], 2.7);
  const both = aimC([-84, -440], [W / 2, 820], 1.8);
  const k = camLerp(floor, both, E.io(ph(t, 69.8, 70.95)));
  return { ...k, z: k.z * (1 + 0.06 * E.out(ph(t, 70.95, 71.97))) };
}
function drawSleep(c: C, t: number) {
  const k = sleepCam(t);
  c.save();
  applyCam(c, k);
  qinRoom(c, t, { night: mix(0.95, 0.35, ph(t, 71.2, 71.97)), boots: 1, kidBed: true, coatOnChair: true });
  sleepers(c, t);
  c.restore();
  const g = c.createLinearGradient(W, 0, 0, H);
  g.addColorStop(0, "rgba(220,226,255,0.18)");
  g.addColorStop(1, "rgba(220,226,255,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  vignette(c, 0.55);
}
const s30: Shot = {
  a: 69.5,
  b: 71.97,
  xin: 0.4, // 系好的结 → 地上的椅子
  draw(c, t) {
    drawSleep(c, t);
  },
};

export const inter1Shots: Shot[] = [s24, s27, s30];
