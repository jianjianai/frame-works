// 主歌二 1:11.97–1:27.93：主歌二的后四句和主歌一一字不差，所以每一句都放新剧情——
// S31 71.97–75.87 一镜（早上，她的屋子）：两个人都倒着睡在天花板上；他先醒，抓住两个人系在一起的绳子，一把一把把两个人拽下来——她被拽醒，
//     秘密被看见了；他落到地上，抓起椅子上妈妈那件缝了铅的外套穿上（一沉）；她把手指竖在嘴边。他伸出小拇指：别飞走。她看了一眼自己塞满了砖的靴子，还是勾住了（镜头落到两只手上）；脚跺进靴子：75.01「咚」
// S32 75.87–79.98 一镜（电车）：匹配剪辑——跺进靴子的那只脚 → 同一只靴子踩上电车台阶。一车人低头看脚，阿满（绿帽子）贴着车顶的网飘着；
//     她抓住他的脚踝往下拽，自己的靴跟却离了地；小石头从后面抱住她的腰往后坠，她一只脚勾住座椅腿，两个人一起把阿满拽回座位，塞给他一块砖
// S33 79.98–81.78 一镜（千斤家门口）：匹配溶解——阿满手里的砖 → 千斤手里的砖。千斤踩上拴过她的那根铁桩，把砖塞给楼上窗口飘出来的老太太；
//     镜头往街那头一摇：周磊抓住一个飘起来的年轻人的脚踝——被拽回来的人，开始拽别人
// S34 81.78–87.93 一镜（傍晚回家的路上）：甩过来：她在前面走，小石头裹着妈妈的大外套跟在后面学她跺脚，一大一小两个「咚」，她回头笑了；
//     83.79 小的那个「咚」没了：他站在街中间仰着头，白里一个橘色的影子朝他张开手，他的脚跟离了地；
//     她冲回去捂住他的眼睛，把他的头按在肩上，跺稳；自己却抬了一下头——白里也有一个锈红色的影子朝她张开手，她的靴跟也离了地一下；她闭上眼，低下头
import { type C, type Cam, type Shot, W, H, E, ph, kick, shake, jolt, applyCam, vignette, clamp, mix, smearH, camLerp } from "./core";
import { figure, pose, rope, stone, type Fig, type Pt, walk } from "./figure";
import { ash, BEDPOST, tram, door, shoes, tower } from "./world";
import { street, qinRoom } from "./sets";
import { bigBoot } from "./props";
import { qinFloatSleep } from "./pre1";
import { kidCeilingSleep, knotOnRope, sleepCam } from "./inter1";
import { HOME, GIRL_LOOK } from "./verse1";
import { PAL, LOOKS, crowdLook, UMBRELLAS, blend } from "./palette";
import { bootsPair } from "./world";

const lerpPt = (a: Pt, b: Pt, e: number): Pt => [mix(a[0], b[0], e), mix(a[1], b[1], e)];
const win = (t: number, a: number, b: number, c: number, d: number) => E.io(ph(t, a, b)) * (1 - E.io(ph(t, c, d)));
const aimC = (p: Pt, s: Pt, z: number): Cam => ({ x: p[0] - (s[0] - W / 2) / z, y: p[1] - (s[1] - H / 2) / z, z });
const toS = (k: Cam, p: Pt): Pt => [(p[0] - k.x) * k.z + W / 2, (p[1] - k.y) * k.z + H / 2];
const KID_COAT = { top: "#f39a5f", accent: "#e65a4f" };
const KID = { kind: "kid" as const, look: KID_COAT, coat: 1.55, bell: true, barefoot: true, rim: 0.8 };
/** 外套下摆缝的铅块 */
function hemWeights(c: C, j: ReturnType<typeof pose>, float = 0) {
  const len = 1.55 * 50 * 0.6 * (1 - 1.5 * float);
  c.fillStyle = "#6b6a80";
  for (let i = 0; i < 4; i++) c.fillRect(j.hip[0] - 12 + i * 7.2, j.hip[1] + len - 5, 4.5, 5);
}

// ---------- S31 早上：他把两个人从天花板上拽下来；拉钩；「咚」 ----------
const PULLS = [72.42, 72.72, 73.02]; // 一把一把
const T_KID_WAKE = 72.0; // 他先醒
const T_WAKE = 72.78; // 她被拽醒
const T_COAT = 73.14; // 他落到地上，抓起椅子上妈妈的外套穿上
const T_DOWN = 73.25; // 她落下来，跪在他面前
const T_SHH = 73.4;
const T_PINKY = 73.9; // 他伸出小拇指
const T_HOOK = 74.32; // 她勾住
const T_STAND = 74.55;
const T_BOOT1 = 74.8;
const T_BOOT2 = 75.013; // 「咚」
const BOOTS_X = -96; // 地上那双塞满了砖的靴子
const QK = -168; // 她跪下来的地方
const KID_S = -300; // 他落地的地方（椅子旁边）
const KID_P = -246; // 走到她面前
/** 两个人往下落了多少（0 还在天花板上，1 落到底）：一把一把 */
const descend = (t: number) => PULLS.reduce((a, p) => a + E.io(ph(t, p, p + 0.2)) / 3, 0);
function kidMorning(t: number): Fig {
  const wake = E.io(ph(t, T_KID_WAKE, T_KID_WAKE + 0.2));
  const d = descend(t);
  const coatOn = t > T_COAT + 0.12;
  const look = coatOn ? KID_COAT : {};
  const coat = coatOn ? 1.55 : 0.3;
  if (t < PULLS[0] - 0.14) {
    // 倒着睡在天花板上的小床底下，醒了，扭头看她
    return { ...kidCeilingSleep(t, { eyes: wake > 0.5 ? "open" : "closed", head: mix(0.2, -0.5, wake) }), look, coat };
  }
  const qa = pose(qinFloatSleep(t, 1 - d)).anR;
  if (t < T_COAT) {
    // 翻过身抓住绳子，一把一把往下拽，两个人一起往下落
    const grab = E.io(ph(t, PULLS[0] - 0.14, PULLS[0] + 0.04));
    const pull = PULLS.reduce((a, p) => a + Math.sin(Math.PI * ph(t, p, p + 0.2)), 0);
    const hip = lerpPt([112, -530], [KID_S + 30, -60], E.io(d));
    const hand1 = lerpPt(BEDPOST, qa, mix(0.5, 0.22, d) - 0.04 * pull);
    return { ...KID, look, coat, x: hip[0], y: hip[1], grounded: false, facing: 1, lean: mix(1.52, -0.12, grab), legL: mix(-1.5, 0.15, grab), legR: mix(-1.42, -0.1, grab), kneeL: mix(0.1, 0.4, grab), kneeR: 0.25, float: mix(0.9, 0.25, d), hR: hand1, hL: [hand1[0] - 4, hand1[1] + 20], head: 0.65, eyes: "wide", tears: 0 };
  }
  // 落到地上：抓起椅子上的外套穿上（一沉）→ 走到她面前 → 伸出小拇指
  const reachCoat = win(t, T_COAT - 0.02, T_COAT + 0.06, T_COAT + 0.12, T_COAT + 0.2);
  const sink = kick(t, T_COAT + 0.12, 0.12);
  const walkTo = E.io(ph(t, T_DOWN + 0.2, T_PINKY - 0.05));
  const x = mix(KID_S + 30, KID_P, walkTo);
  const pinky = E.io(ph(t, T_PINKY - 0.15, T_PINKY + 0.1)) * (1 - E.io(ph(t, T_STAND, T_STAND + 0.2)));
  const w = walk((t - T_DOWN) * 2.2, walkTo > 0 && walkTo < 1 ? 0.35 : 0);
  return {
    ...KID,
    look,
    coat,
    x,
    y: 0,
    facing: 1,
    lean: 0.05 + 0.15 * reachCoat,
    head: 0.3,
    legL: w.legL,
    legR: w.legR,
    kneeL: w.kneeL + 0.5 * sink,
    kneeR: w.kneeR + 0.4 * sink,
    hR: reachCoat > 0.02 ? lerpPt([x + 10, -60], [-240, -72], reachCoat) : pinky > 0.02 ? lerpPt([x + 10, -60], [(KID_P + QK) / 2 + 2, -92], pinky) : undefined,
    eyes: "wide",
    tears: 0,
  };
}
function qinMorning(t: number): { f: Fig; float: boolean } {
  const d = descend(t);
  if (t < T_DOWN) {
    const woke = t > T_WAKE;
    return { f: qinFloatSleep(t, 1 - d, { eyes: woke ? "wide" : "closed", head: woke ? 0.1 + 0.4 * E.io(ph(t, T_WAKE, T_WAKE + 0.15)) : 0.4 }), float: true };
  }
  // 翻身下来，跪在他面前；把手指竖在嘴边；勾住小拇指；站起来去穿靴子
  const right = E.io(ph(t, T_DOWN, T_DOWN + 0.22));
  const stand = E.io(ph(t, T_STAND, T_STAND + 0.22));
  const shh = win(t, T_SHH, T_SHH + 0.15, T_PINKY - 0.05, T_PINKY + 0.1);
  const hook = E.io(ph(t, T_HOOK - 0.2, T_HOOK)) * (1 - stand);
  const glance = win(t, T_PINKY + 0.05, T_PINKY + 0.2, T_HOOK - 0.22, T_HOOK - 0.1); // 看了一眼靴子
  const toBoots = E.io(ph(t, T_STAND, T_BOOT1));
  const x = mix(QK, BOOTS_X + 8, toBoots);
  const kneel: Fig = { x, y: 0, kind: "qin", facing: stand > 0.5 ? 1 : -1, barefoot: true, boots: false, legL: mix(-1.3, 0, stand), kneeL: mix(1.75, 0, stand), legR: mix(0.25, 0, stand), kneeR: mix(1.5, 0, stand), lean: mix(0.1, 0, stand), head: 0.25 - 0.9 * glance, rim: 0.85, eyes: "open" };
  const kj = pose(kneel);
  const hL: Pt | undefined = shh > 0.02 ? lerpPt([kj.neck[0] - 10, kj.neck[1] + 40], [kj.head[0] - 12, kj.head[1] + 8], shh) : hook > 0.02 ? lerpPt([kj.neck[0] - 10, kj.neck[1] + 40], [(KID_P + QK) / 2 - 2, -92], hook) : undefined;
  if (right < 1) {
    // 从躺着翻过来
    const a = qinFloatSleep(T_DOWN, 0, {});
    return { f: { ...kneel, x: mix(a.x, x, right), y: mix(a.y, 0, right), grounded: right > 0.6, lean: mix(a.lean ?? 0, 0.1, right), legL: mix(a.legL ?? 0, -1.3, right), kneeL: mix(0.15, 1.75, right), legR: mix(a.legR ?? 0, 0.25, right), kneeR: mix(0.3, 1.5, right), eyes: "wide", head: 0.2 }, float: false };
  }
  // 两只脚一前一后踩进靴子
  const w = walk((t - T_BOOT2) * 1.9, t > T_BOOT2 + 0.05 ? 0.38 : 0);
  const walking = t > T_BOOT2 + 0.05;
  const xw = walking ? x + 160 * (t - T_BOOT2 - 0.05) : x;
  return { f: { ...kneel, x: xw, hL, legL: walking ? w.legL : kneel.legL, legR: walking ? w.legR : kneel.legR, kneeL: walking ? w.kneeL : kneel.kneeL, kneeR: walking ? w.kneeR : kneel.kneeR, boots: t > T_BOOT2, barefoot: t <= T_BOOT2 }, float: false };
}
/** 拉钩：两只小拳头，小拇指勾在一起，大拇指按了一下（镜头推得很近时才画） */
function pinkyHook(c: C, p: Pt, e: number, press: number) {
  if (e <= 0.01) return;
  c.save();
  c.translate(p[0], p[1]);
  c.globalAlpha *= clamp(e * 1.5);
  c.lineCap = "round";
  const fist = (x: number, skin: string, sleeve: string, dir: number) => {
    c.fillStyle = sleeve;
    c.strokeStyle = PAL.ink;
    c.lineWidth = 1.2;
    c.beginPath();
    c.roundRect(x - dir * 13 - 5, -4, 10, 9, 2);
    c.fill();
    c.stroke();
    c.fillStyle = skin;
    c.beginPath();
    c.arc(x, 0, 5.2, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    // 大拇指（按一下）
    c.strokeStyle = skin;
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(x + dir * 2, -4);
    c.lineTo(x + dir * (5 + 2 * press), -7 - 2 * press);
    c.stroke();
  };
  fist(-7, "#f7dac7", KID_COAT.top, -1);
  fist(7, "#f5d3bf", LOOKS.qin.top, 1);
  // 两根小拇指勾在一起
  c.strokeStyle = "#f2c9b4";
  c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(-4, 4);
  c.quadraticCurveTo(0, 10 * e, 3, 5);
  c.moveTo(4, 4);
  c.quadraticCurveTo(0, 9 * e, -3, 6);
  c.stroke();
  c.restore();
}
function camS31(t: number): Cam {
  // 接上一镜：天花板上倒着睡的两个人 → 跟着两个人一把一把落下来 → 两个人同框；推到两只勾在一起的小拇指；落到跺进靴子的那只脚
  const k0 = sleepCam(71.97);
  const two = (s: number) => aimC([-190, mix(-430, -150, E.io(descend(s)))], [W / 2, 900], mix(1.85, 2.4, E.io(descend(s))));
  let k = camLerp(k0, two(t), E.io(ph(t, 72.2, 72.6)));
  const face = aimC([(KID_P + QK) / 2 - 10, -110], [W / 2, 960], 2.9);
  k = camLerp(k, face, E.io(ph(t, T_DOWN, T_SHH + 0.2)));
  const pinky = aimC([(KID_P + QK) / 2, -92], [W / 2, 1000], 6.2);
  k = camLerp(k, pinky, E.io(ph(t, T_PINKY - 0.05, T_HOOK)));
  const boot = (s: number) => aimC([qinMorningBoot(s)[0], -24], BOOT_S, BOOT_Z);
  return camLerp(k, boot(t), E.io(ph(t, T_HOOK + 0.2, T_BOOT2)));
}
const BOOT_S: Pt = [W / 2, 1180]; // 跺进靴子的那只脚在画面上的位置（电车那一镜从这里接）
const BOOT_Z = 3.6;
const qinMorningBoot = (t: number): Pt => {
  const j = pose(qinMorning(t).f);
  return t < T_BOOT2 ? [BOOTS_X + 26, 0] : j.anR;
};
const s31: Shot = {
  a: 71.97,
  b: 75.87,
  draw(c, t) {
    const k = jolt(camS31(t), shake(t, 9 * kick(t, T_BOOT2, 0.1) + 3 * PULLS.reduce((a, p) => a + kick(t, p + 0.18, 0.08), 0), 4));
    c.save();
    applyCam(c, k);
    qinRoom(c, t, { night: mix(0.35, 0.12, ph(t, 71.97, 73)), glare: 1, kidBed: true, coatOnChair: t < T_COAT + 0.1 });
    // 地上那双塞满了砖的靴子（她穿上以前）
    if (t < T_BOOT1) bootsPair(c, BOOTS_X, 0, 1, 1);
    else if (t < T_BOOT2) bootsPair(c, BOOTS_X + 58, 0, 1, 1); // 一只已经穿上了
    const q = qinMorning(t);
    const qj = figure(c, q.f, t);
    if (t >= T_BOOT1 && t < T_BOOT2) bigBoot(c, qj.anR[0], qj.anR[1] + 2, 1, 1, 0);
    const kj = figure(c, kidMorning(t), t);
    hemWeights(c, kj, 0);
    pinkyHook(c, [(KID_P + QK) / 2, -92], E.io(ph(t, T_HOOK - 0.1, T_HOOK + 0.05)) * (1 - E.io(ph(t, T_STAND - 0.05, T_STAND + 0.1))), E.io(ph(t, T_HOOK + 0.1, T_HOOK + 0.2)));
    // 两根系在一起的绳子：她的脚踝 → 椅子腿；他的脚踝 → 她绳子上的结
    rope(c, BEDPOST, qj.anR, q.float ? 0 : 30, 3.2);
    const kn = knotOnRope(qj.anR);
    rope(c, kj.anL, kn, q.float ? 20 : 30, 2.6);
    c.fillStyle = "#d65a4c";
    c.beginPath();
    c.arc(kn[0], kn[1], 6, 0, Math.PI * 2);
    c.fill();
    c.restore();
    vignette(c, 0.4);
    // 早上：窗里的光
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "rgba(255,236,220,0.16)");
    g.addColorStop(1, "rgba(255,236,220,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  },
};

// ---------- S32 电车：一车人低头看脚，阿满贴着车顶的网飘着 ----------
const T_STEP = 76.013; // 踩上台阶「咚」
const T_GRABA = 76.95; // 抓住阿满的脚踝
const T_LIFT = 77.45; // 她的靴跟离了地
const T_HOOKF = 77.9; // 一只脚勾住座椅腿
const T_KIDPULL = 78.0; // 小石头从后面抱住她往后坠
const T_SEAT = 78.95; // 阿满被拽回座位
const T_GIVE = 79.25; // 塞给他一块砖
const AX = 140; // 阿满飘着的地方
const QX = 96; // 她站的地方
const KX = 34; // 小石头从后面抱住她
const ROOF = -400; // 车顶的网
/** 阿满：贴着网飘着 → 被拽下来 → 坐进座位，抱着砖 */
function aman(t: number): Fig {
  const L = { kind: "worker" as const, rim: 0.7, tie: false };
  const down = E.in2(ph(t, T_KIDPULL + 0.2, T_SEAT));
  const tug = Math.sin(Math.PI * ph(t, T_GRABA, T_GRABA + 0.25)) * 14 + Math.sin(Math.PI * ph(t, 77.2, 77.45)) * 14;
  if (t < T_SEAT) {
    const y = mix(ROOF + 60, -150, down) + tug;
    return { ...L, x: mix(AX, 250, down), y, grounded: false, facing: -1, lean: mix(-1.35, -0.2, down), float: mix(0.95, 0.4, down), legL: mix(1.5, 0.2, down) * -1, legR: mix(1.4, 0.1, down) * -1, kneeL: 0.2, kneeR: 0.3, aL: mix(-2.9, -1, down), aR: mix(2.9, 1, down), head: mix(0.3, 0.6, down), eyes: t < T_GRABA ? "closed" : "wide" };
  }
  const take = E.io(ph(t, T_GIVE, T_GIVE + 0.25));
  const sj = pose({ ...L, x: 250, y: -110, grounded: false, facing: -1, legL: -1.4, legR: -1.3, kneeL: 1.4, kneeR: 1.35 });
  const brick: Pt = [sj.neck[0] - 18, sj.neck[1] + 48];
  return { ...L, x: 250, y: -110 + 8 * kick(t, T_SEAT, 0.15) - 6 * take, grounded: false, facing: -1, legL: -1.4, legR: -1.3, kneeL: 1.4, kneeR: 1.35, lean: 0.1 * take, head: mix(0.4, -0.5, take), eyes: "open", tears: take, hL: take > 0.02 ? brick : undefined, hR: take > 0.02 ? [brick[0] + 10, brick[1] + 2] : undefined };
}
function qinTram(t: number): Fig {
  const L = { kind: "qin" as const, rim: 0.85, boots: true, facing: 1 as const };
  // 踩上台阶走进来
  if (t < 76.6) {
    const go = E.io(ph(t, 75.87, 76.6));
    const w = walk((t - 75.87) * 2.1, 0.4 * (1 - ph(t, 76.4, 76.6)));
    return { ...L, x: mix(-330, QX, go), y: -14 * (1 - E.io(ph(t, 75.87, T_STEP))), legL: w.legL, legR: w.legR, kneeL: w.kneeL, kneeR: w.kneeR, head: 0.5, eyes: "open" };
  }
  // 抬头，伸手抓住他的脚踝往下拽；靴跟离了地；一只脚勾住座椅腿
  const reach = E.io(ph(t, 76.6, T_GRABA));
  const a = pose(aman(Math.min(t, T_SEAT - 0.01)));
  const lift = 26 * E.io(ph(t, T_LIFT - 0.1, T_LIFT + 0.25)) * (1 - E.io(ph(t, T_KIDPULL + 0.2, T_SEAT)));
  const hook = E.io(ph(t, T_HOOKF - 0.15, T_HOOKF));
  const give = E.io(ph(t, T_GIVE - 0.3, T_GIVE)) * (1 - E.io(ph(t, T_GIVE + 0.3, T_GIVE + 0.5)));
  const b = pose({ ...L, x: QX, y: -lift });
  let hR: Pt = lerpPt([b.neck[0] + 10, b.neck[1] + 50], [a.anL[0] + 4, a.anL[1] + 2], reach);
  let hL: Pt = lerpPt([b.neck[0] + 4, b.neck[1] + 50], [a.anR[0] - 2, a.anR[1] + 6], reach);
  if (t > T_SEAT - 0.1) {
    // 从靴子里抽出一块砖，塞进他手里
    const aa = pose(aman(t));
    const toBoot = E.io(ph(t, T_SEAT, T_GIVE - 0.3));
    hR = lerpPt(lerpPt(hR, [QX + 20, -40], toBoot), [aa.neck[0] - 16, aa.neck[1] + 46], give);
    hL = lerpPt(hL, [b.neck[0] + 6, b.neck[1] + 60], toBoot);
  }
  const strain = (t > T_GRABA ? 1 : 0) * (1 - E.io(ph(t, T_SEAT, T_SEAT + 0.3)));
  return { ...L, x: QX, y: -lift, grounded: true, lean: -0.12 * strain + 0.15 * give, head: mix(0.5, 0.95, reach) * (1 - give) + 0.1 * give, legL: mix(0, -0.6, hook), kneeL: mix(0, 0.9, hook), fL: hook > 0.02 ? [QX - 30 + 10 * (1 - hook), -12] : undefined, hR, hL, eyes: lift > 5 ? "wide" : "open" };
}
function kidTram(t: number): Fig {
  const go = E.io(ph(t, 76.1, 76.9));
  const grab = E.io(ph(t, T_KIDPULL - 0.15, T_KIDPULL + 0.05));
  const lean = -0.35 * grab * (1 - E.io(ph(t, T_SEAT, T_SEAT + 0.3)));
  const w = walk((t - 76.1) * 2.6, go > 0 && go < 1 ? 0.45 : 0);
  const q = pose(qinTram(t));
  const worried = E.io(ph(t, T_GIVE + 0.25, T_GIVE + 0.45));
  return { ...KID, x: mix(-420, KX, go), y: 0, facing: 1, lean, legL: w.legL - 0.3 * grab, legR: w.legR + 0.25 * grab, kneeL: w.kneeL + 0.3 * grab, kneeR: w.kneeR, head: t < T_LIFT ? 0.6 : 0.2 - 0.8 * worried, hR: grab > 0.02 ? lerpPt([KX + 16, -60], [q.hip[0] - 4, q.hip[1] - 4], grab) : undefined, hL: grab > 0.02 ? lerpPt([KX + 10, -60], [q.hip[0] - 10, q.hip[1] + 6], grab) : undefined, eyes: t > T_LIFT ? "wide" : "open" };
}
/** 一车低着头看脚的人（谁也没抬头） */
function passengers(c: C, t: number) {
  const seated: [number, number][] = [
    [-620, 12],
    [-535, 18],
    [600, 37],
    [690, 43],
  ];
  seated.forEach(([x, seed]) => {
    figure(c, { x, y: -110, grounded: false, kind: (["plain", "woman", "man", "worker"] as const)[seed % 4], facing: x < 0 ? 1 : -1, legL: (x < 0 ? 1 : -1) * 1.4, legR: (x < 0 ? 1 : -1) * 1.3, kneeL: 1.4, kneeR: 1.35, lean: (x < 0 ? 1 : -1) * 0.15, head: -0.85, look: crowdLook(seed), tie: false, tone: 0.12, rim: 0.45 }, t);
  });
  // 站着拉吊环的人
  figure(c, { x: 470, y: 0, kind: "plain", facing: -1, head: -0.9, hL: [440, -318], look: crowdLook(51), tone: 0.12, rim: 0.45 }, t);
}
const BRICK_S: Pt = [W / 2, 1000]; // 阿满手里那块砖在画面上的位置（千斤那一镜从这里接）
const BRICK_Z = 3.4;
const amanBrick = (t: number): Pt => {
  const a = pose(aman(Math.max(t, T_GIVE + 0.3)));
  return [a.neck[0] - 18, a.neck[1] + 48];
};
function camS32(t: number): Cam {
  // 匹配剪辑：同一只靴子在画面同一个位置踩上台阶 → 镜头抬起来，一车人和贴着网的阿满
  const step = aimC([pose(qinTram(t)).anR[0], -24], BOOT_S, BOOT_Z);
  const car = aimC([30, -230], [W / 2, 1000], 1.45);
  let k = camLerp(step, car, E.io(ph(t, T_STEP + 0.05, 76.75)));
  // 抓住他往下拽：推近一点；她的靴跟离了地——镜头落到靴跟，再退开看小石头抱住她
  const pull = aimC([QX + 20, -250], [W / 2, 960], 2.0);
  k = camLerp(k, pull, E.io(ph(t, 76.8, T_GRABA + 0.2)));
  const heel = aimC([QX, -30], [W / 2, 1150], 3.0);
  k = camLerp(k, heel, E.io(ph(t, T_LIFT, T_LIFT + 0.3)) * (1 - E.io(ph(t, T_HOOKF + 0.05, T_KIDPULL + 0.3))));
  const team = aimC([120, -170], [W / 2, 1000], 2.0);
  k = camLerp(k, team, E.io(ph(t, T_HOOKF + 0.05, T_KIDPULL + 0.4)));
  // 砖放进他手里：推到砖上，越推越慢（下一镜千斤手里的砖从同一个位置接）
  const brick = aimC(amanBrick(t), BRICK_S, BRICK_Z * (1 + 0.04 * E.out(ph(t, T_GIVE + 0.3, 79.98))));
  return camLerp(k, brick, E.io(ph(t, T_GIVE - 0.1, T_GIVE + 0.45)));
}
const s32: Shot = {
  a: 75.87,
  b: 79.98,
  draw(c, t) {
    const k = jolt(camS32(t), shake(t, 9 * kick(t, T_STEP, 0.1) + 6 * kick(t, T_GRABA, 0.1) + 5 * kick(t, T_SEAT, 0.1), 5));
    // 车窗外的街在往后走
    c.fillStyle = "#e9d6da";
    c.fillRect(0, 0, W, H);
    c.save();
    applyCam(c, k);
    tram(c, t, {});
    passengers(c, t);
    const aj = figure(c, aman(t), t);
    const qj = figure(c, qinTram(t), t);
    const kj = figure(c, kidTram(t), t);
    hemWeights(c, kj, 0);
    // 她离地时靴底掉下的灰
    if (t > T_LIFT && t < T_SEAT) {
      c.fillStyle = "rgba(250,240,242,0.9)";
      for (let i = 0; i < 5; i++) {
        const s = (t * 2 + i * 0.3) % 1;
        c.beginPath();
        c.arc(qj.toeR[0] - 8 + i * 5, qj.toeR[1] + 6 + s * 60, 2.2, 0, Math.PI * 2);
        c.fill();
      }
    }
    // 砖：在她手里 → 他手里，变暖
    const give = E.io(ph(t, T_GIVE - 0.3, T_GIVE));
    if (t > T_SEAT + 0.1 && t < T_GIVE) stone(c, qj.handR[0] + 4, qj.handR[1] + 2, 13, "活下去", 0, -0.1);
    if (t >= T_GIVE) {
      const b = amanBrick(t);
      stone(c, b[0], b[1] + 4 * kick(t, T_GIVE, 0.15), 13, "活下去", E.io(ph(t, T_GIVE, T_GIVE + 0.5)), -0.06);
    }
    void give;
    void aj;
    c.restore();
    // 砖暖起来
    const warm = E.io(ph(t, T_GIVE + 0.1, T_GIVE + 0.6));
    if (warm > 0.01) {
      const p = toS(k, amanBrick(t));
      const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], 560);
      g.addColorStop(0, `rgba(${PAL.warmRGB},${0.26 * warm})`);
      g.addColorStop(1, `rgba(${PAL.warmRGB},0)`);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    vignette(c, 0.42);
  },
};

// ---------- S33 千斤家门口：被拽回来的人，开始拽别人 ----------
const POST = HOME.post;
const T_CLIMB = 80.25; // 踩上铁桩
const T_HAND = 80.62; // 砖塞进老太太手里
const T_SINK = 80.85; // 老太太一沉，坐回窗台
const WIN_X = 4636; // 楼上那扇窗（老太太从里面飘出来）
const WIN_SILL = -210;
const ZL_X = 5260; // 周磊在街那头
const T_ZL = 81.25; // 周磊抓住年轻人的脚踝
function qianjin(t: number): Fig {
  const climb = E.io(ph(t, 79.98, T_CLIMB));
  const reach = E.io(ph(t, T_CLIMB - 0.1, T_HAND));
  const back = E.io(ph(t, T_SINK + 0.1, T_SINK + 0.4));
  const g = pose({ x: POST, y: -HOME.postH, kind: "girl", look: GIRL_LOOK, facing: 1 });
  const hand: Pt = lerpPt([g.neck[0] - 6, g.neck[1] + 30], [WIN_X - 10, WIN_SILL - 50], reach * (1 - back));
  return { x: POST + 2, y: -HOME.postH * climb, kind: "girl", look: GIRL_LOOK, facing: 1, lean: -0.05, head: mix(0.4, 0.9, reach), hR: hand, hL: [hand[0] - 6, hand[1] + 6], legR: -0.1 * (1 - climb), eyes: "open", rim: 0.7, float: 0, tears: 0 };
}
function oldWoman(t: number): Fig {
  const sink = E.io(ph(t, T_HAND, T_SINK));
  const bob = Math.sin(t * 2) * 5 * (1 - sink);
  return { x: WIN_X + 10, y: mix(WIN_SILL - 150, WIN_SILL - 60, sink) + bob, grounded: false, kind: "woman", facing: -1, look: { hair: "#eee6df", top: "#b7a3cf", bottom: "#8f7fae", legs: "#6f6283" }, float: 0.8 * (1 - sink), lean: mix(-0.25, 0, sink), legL: mix(-0.2, 1.2, sink) * -1, legR: mix(0.1, 1.1, sink) * -1, kneeL: mix(0.3, 1.4, sink), kneeR: mix(0.4, 1.3, sink), aL: -1.9 + 1.2 * sink, aR: 1.8 - 1.0 * sink, head: mix(0.5, -0.5, sink), eyes: sink > 0.5 ? "open" : "closed", tears: sink, rim: 0.6 };
}
function zhouLei(t: number): { zl: Fig; young: Fig } {
  const pull = E.in2(ph(t, T_ZL, T_ZL + 0.3));
  const yh = mix(170, 0, pull) + Math.sin(t * 2) * 5 * (1 - pull);
  const young: Fig = { x: ZL_X + 30, y: -yh - 58, grounded: false, kind: "plain", facing: -1, look: crowdLook(77), float: 0.85 * (1 - pull), aL: -2.3, aR: 2.3, legL: 0.1, legR: -0.1, kneeL: 0.3 + pull, kneeR: 0.4 + pull, head: 0.6 - pull, eyes: pull > 0.5 ? "wide" : "closed", rim: 0.6 };
  const yj = pose(young);
  const reach = E.io(ph(t, T_ZL - 0.35, T_ZL));
  const zl: Fig = { x: ZL_X - 30, y: 0, kind: "man", facing: 1, tie: true, head: 0.8 - 0.6 * pull, lean: -0.1 * pull, hR: lerpPt([ZL_X - 10, -100], [yj.anL[0], yj.anL[1] + 4], reach), hL: lerpPt([ZL_X - 20, -100], [yj.anR[0] - 4, yj.anR[1] + 8], reach), kneeL: 0.4 * pull, kneeR: 0.5 * pull, rim: 0.7, eyes: "open", stone: 0.8 };
  return { zl, young };
}
const qjBrick = (t: number): Pt => {
  const j = pose(qianjin(t));
  return [j.handR[0] + 2, j.handR[1] - 2];
};
function camS33(t: number): Cam {
  // 匹配溶解：千斤手里的砖在画面同一个位置 → 退开：她踩上铁桩，楼上窗口飘出来的老太太 → 往街那头摇：周磊
  const brick = aimC(qjBrick(79.98), BRICK_S, BRICK_Z * 1.04);
  const wide = aimC([WIN_X - 20, -230], [W / 2, 900], 2.0);
  let k = camLerp(brick, wide, E.out(ph(t, 79.98, 80.45)));
  const zl = aimC([ZL_X, -170], [W / 2, 960], 2.0);
  k = camLerp(k, zl, E.io(ph(t, 80.9, T_ZL + 0.1)));
  // 甩过去：接回家的路
  const off = E.in2(ph(t, 81.45, 81.78));
  return { ...k, x: k.x + 900 * off };
}
const s33: Shot = {
  a: 79.98,
  b: 81.78,
  xin: 0.3,
  draw(c, t) {
    const k = camS33(t);
    const v = Math.abs((k.x - camS33(t - 1 / 60).x) * k.z);
    const scene = (c: C) => {
      street(c, k, t, { glow: 1 });
      c.save();
      applyCam(c, k);
      c.save();
      c.translate(-2050, 0);
      tower(c, {});
      c.restore();
      // 千斤家：门、门口爸爸的空鞋、拴过她的那根铁桩
      door(c, HOME.door, 0, { open: 0, w: 120, h: 240 });
      shoes(c, HOME.door + 78, 0, 1, 1.1, "#5b7fc1");
      c.fillStyle = "#5d5a72";
      c.fillRect(POST - 9, -HOME.postH, 18, HOME.postH);
      c.fillStyle = "#7c7894";
      c.fillRect(POST - 12, -HOME.postH - 6, 24, 8);
      // 楼上的窗开着，老太太从里面飘出来
      c.fillStyle = "#3f3a55";
      c.fillRect(WIN_X - 45, -330, 90, 120);
      const ow = figure(c, oldWoman(t), t);
      const qj = figure(c, qianjin(t), t);
      // 砖：千斤手里 → 老太太手里，暖了
      if (t < T_HAND) stone(c, qjBrick(t)[0], qjBrick(t)[1], 13, "活下去", 0.3, -0.08);
      else stone(c, ow.handL[0] + 4, ow.handL[1] + 6, 13, "活下去", E.io(ph(t, T_HAND, T_HAND + 0.4)), -0.1);
      void qj;
      const z = zhouLei(t);
      figure(c, z.young, t);
      figure(c, z.zl, t);
      c.restore();
      ash(c, t, k, { n: 0.45 });
    };
    if (v > 8) smearH(c, Math.min(160, v * 0.5), scene);
    else scene(c);
    vignette(c, 0.35);
  },
};

// ---------- S34 傍晚回家：她在前面走，他在后面学她跺脚；他看见了白里的妈妈；她也看见了自己的 ----------
const STEP_Q = [82.013, 82.513, 83.013, 83.513, 84.013]; // 她的「咚」
const STEP_K = [82.263, 82.763, 83.263]; // 他的「咚」（83.763 那一下没了）
const T_STOP = 83.79; // 他停下来，仰着头
const T_TURN = 84.15; // 她回头
const T_HE_LIFT = 84.9; // 他的脚跟离了地
const T_RUN = 85.45; // 她冲回去
const T_HOLD = 85.85; // 抱住他，捂住眼睛
const T_STOMP = 86.013; // 跺稳
const T_SHE_LOOK = 86.35; // 她自己抬了一下头
const T_SHE_LIFT = 86.9; // 她的靴跟也离了地一下
const T_CLOSE = 87.25; // 闭上眼，低下头
const T_STOMP2 = 87.513;
const Q0 = 420; // 她在前面往左走（紫房子、粉房子、两栋房子中间的空当）
const qinWalkX = (t: number) => {
  if (t < T_TURN) return Q0 - 118 * (Math.min(t, 84.1) - 81.78);
  const xs = Q0 - 118 * (84.1 - 81.78);
  if (t < T_RUN) return xs;
  return mix(xs, kidStopX() - 40, E.io(ph(t, T_RUN, T_HOLD)));
};
const KID_GAP = 150;
const kidX = (t: number) => (t < T_STOP ? Q0 + KID_GAP - 118 * (t - 81.78) : kidStopX());
const kidStopX = () => Q0 + KID_GAP - 118 * (T_STOP - 81.78);
function qinHome(t: number): Fig {
  const L = { kind: "qin" as const, rim: 0.85, boots: true };
  const x = qinWalkX(t);
  const walking = t < 84.1;
  const running = t > T_RUN && t < T_HOLD;
  const w = walk((t - 81.763) * 1.0, walking ? 0.4 : running ? 0.75 : 0);
  const lookBack = win(t, 82.65, 82.85, 83.25, 83.45);
  const turned = t > T_TURN;
  const hold = E.io(ph(t, T_HOLD - 0.1, T_HOLD + 0.1));
  const lookUp = win(t, T_SHE_LOOK, T_SHE_LOOK + 0.2, T_CLOSE, T_CLOSE + 0.2);
  const lift = 16 * win(t, T_SHE_LIFT - 0.1, T_SHE_LIFT + 0.05, T_CLOSE, T_STOMP2);
  const f: Fig = { ...L, x, y: -lift, facing: turned ? 1 : -1, lean: running ? 0.3 : 0.04, legL: w.legL, legR: w.legR, kneeL: w.kneeL, kneeR: w.kneeR, aL: w.aL, aR: w.aR, head: turned ? 0.2 + 0.85 * lookUp - 0.8 * E.io(ph(t, T_CLOSE, T_CLOSE + 0.2)) : 0.1 * lookBack, eyes: t > T_CLOSE ? "closed" : lookBack > 0.5 ? "smile" : turned && t < T_RUN ? "wide" : "open", tears: t > T_CLOSE ? 1 : 0, float: lift > 2 ? 0.3 : 0 };
  if (hold > 0) {
    // 抱住他：一只手捂住他的眼睛，一只手把他的头按在自己肩上
    const k = pose(kidHome(Math.min(t, T_HOLD + 0.2)));
    return { ...f, hL: lerpPt([x + 20, -110], [k.head[0] + 8, k.head[1] + 2], hold), hR: lerpPt([x + 10, -100], [k.neck[0] - 6, k.neck[1] + 10], hold), lean: 0.1, kneeL: 0.5 * hold, kneeR: 0.4 * hold };
  }
  // 回头看他：脸转过来一点（往后的那一下）
  return { ...f, facing: lookBack > 0.5 ? 1 : f.facing };
}
function kidHome(t: number): Fig {
  const x = kidX(t);
  const walking = t < T_STOP;
  const w = walk((t - 82.013) * 1.0 + 0.5, walking ? 0.5 : 0);
  const stomp = STEP_K.reduce((a, s) => a + Math.max(0, Math.sin(Math.PI * ph(t, s - 0.2, s))), 0); // 学她跺脚：腿抬得老高
  const up = E.io(ph(t, T_STOP, T_STOP + 0.25));
  const lift = 22 * E.io(ph(t, T_HE_LIFT - 0.2, T_HOLD)) * (1 - E.io(ph(t, T_HOLD, T_STOMP + 0.1)));
  const reach = E.io(ph(t, 84.6, 85.0)) * (1 - E.io(ph(t, T_HOLD - 0.1, T_HOLD + 0.1)));
  const held = E.io(ph(t, T_HOLD, T_HOLD + 0.2));
  return { ...KID, x, y: -lift, facing: t < T_STOP ? -1 : 1, lean: 0.1 * held, legL: w.legL - 0.5 * stomp, legR: w.legR, kneeL: w.kneeL + 0.9 * stomp, kneeR: w.kneeR, head: t < T_STOP ? 0.2 : mix(0.2, 1.05, up) * (1 - held) - 0.3 * held, aL: walking ? -0.6 : reach > 0.02 ? -2.4 * reach : -0.3, aR: walking ? 0.6 : reach > 0.02 ? 2.2 * reach : 0.3, eyes: held > 0.5 ? "closed" : up > 0.5 ? "open" : "smile", tears: up > 0.5 ? 1 : 0, float: lift > 2 ? 0.45 : 0 };
}
/** 白里的人影：朝下面的人张开手（橘色是他妈妈，锈红色是她妈妈）。画在画面坐标里：抬头看久了才看得见 */
function vision(c: C, x: number, y: number, s: number, a: number, col: string, t: number) {
  if (a <= 0.01) return;
  c.save();
  const g = c.createRadialGradient(x, y, 0, x, y, 420 * s);
  g.addColorStop(0, `rgba(255,252,246,${0.7 * a})`);
  g.addColorStop(1, "rgba(255,252,246,0)");
  c.fillStyle = g;
  c.fillRect(x - 420 * s, y - 420 * s, 840 * s, 840 * s);
  c.translate(x, y);
  c.scale(s, s);
  figure(c, { x: 0, y: 0, grounded: false, kind: "woman", facing: 1, aL: -2.2, aR: 2.2, bendL: 0.1, bendR: -0.1, float: 0.35, rim: 0, ink: 0.1, alpha: a * 0.65, eyes: "closed", look: { skin: "#fff3ea", hair: blend(col, "#ffffff", 0.55), top: blend(col, "#ffffff", 0.45), bottom: blend(col, "#ffffff", 0.55), shoe: "#fff3ea", legs: blend(col, "#ffffff", 0.6) } }, t);
  c.restore();
}
function camS34(t: number): Cam {
  // 甩过来：跟着两个人横着走（她在前、他在后）；他停下来仰头——镜头留在他身上，往上让出天；她冲回来抱住他；她抬头——再往上让一点
  const walkK = aimC([(qinWalkX(t) + kidX(t)) / 2 + 10, -120], [W / 2, 1200], 2.25);
  const kin = { ...walkK, x: walkK.x - 900 * (1 - E.out(ph(t, 81.78, 82.1))) };
  // 他停下来仰着头：镜头落到他身上，头顶让出一大片天（白里的人影在上面）
  const kidUp = aimC([kidStopX() - 10, -110], [W / 2, 1420], 2.6);
  let k = camLerp(kin, kidUp, E.io(ph(t, T_STOP + 0.05, 84.6)));
  // 她冲回来抱住他：两个人
  const pair = aimC([kidStopX() - 30, -120], [W / 2, 1400], 2.5);
  k = camLerp(k, pair, E.io(ph(t, T_RUN, T_HOLD + 0.2)));
  // 她抬头又闭上眼：推到她的脸（下一镜灯下的屋子从这里溶进去）
  const close = aimC([kidStopX() - 40, -165], [W / 2, 1200], 3.3);
  return camLerp(k, close, E.io(ph(t, T_CLOSE - 0.1, 87.93)));
}
const s34: Shot = {
  a: 81.78,
  b: 87.93,
  draw(c, t) {
    const k0 = camS34(t);
    const k = jolt(k0, shake(t, 7 * kick(t, T_STOMP, 0.1) + 5 * kick(t, T_STOMP2, 0.1) + 2 * STEP_Q.reduce((a, s) => a + kick(t, s, 0.07), 0), 6));
    const v = Math.abs((k0.x - camS34(t - 1 / 60).x) * k0.z);
    const dusk = mix(0.15, 0.4, ph(t, 81.78, 87.93));
    const scene = (c: C) => {
      street(c, k, t, { night: dusk, lights: dusk });
      c.save();
      applyCam(c, k);
      // 路上低着头的人
      const p = walk(t * 1.3, 0.3);
      figure(c, { x: -1500 + 70 * (t - 81.78), y: -30, s: 0.8, kind: "plain", facing: 1, head: -0.8, legL: p.legL, legR: p.legR, kneeL: p.kneeL, kneeR: p.kneeR, umbrella: true, umbrellaColor: UMBRELLAS[5], look: crowdLook(88), aL: -0.5, bendL: -1.6, tone: 0.4, rim: 0.3 }, t);
      const kj = figure(c, kidHome(t), t);
      hemWeights(c, kj, kidHome(t).float ?? 0);
      figure(c, qinHome(t), t);
      c.restore();
      ash(c, t, k, { n: 0.5 });
      // 白里的人影：他看见了妈妈；她也看见了自己的妈妈
      const his = win(t, T_STOP + 0.35, 84.75, T_HOLD, T_HOLD + 0.3);
      vision(c, W / 2 - 30, 300, 1.9, his, "#f39a5f", t);
      const hers = win(t, T_SHE_LOOK + 0.1, T_SHE_LOOK + 0.45, T_CLOSE, T_CLOSE + 0.35);
      vision(c, W / 2 + 60, 280, 2.0, hers, "#cc6d58", t);
      // 抬头的时候白光压下来
      const glare = Math.max(his, hers);
      if (glare > 0.01) {
        const g = c.createLinearGradient(0, 0, 0, H * 0.6);
        g.addColorStop(0, `rgba(255,250,240,${0.45 * glare})`);
        g.addColorStop(1, "rgba(255,250,240,0)");
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
      }
    };
    if (v > 8) smearH(c, Math.min(160, v * 0.5), scene);
    else scene(c);
    vignette(c, 0.38 + 0.15 * E.io(ph(t, T_CLOSE, 87.93)));
  },
};

export const verse2Shots: Shot[] = [s31, s32, s33, s34];
void LOOKS;
void clamp;
