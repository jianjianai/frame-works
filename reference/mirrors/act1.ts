import type { SceneOptions } from "@frame/engine/types";
import { phase, smooth } from "@frame/engine/math";
import { C, Ctx, F, H, Pt, W, backOut, blinkEyes, blob, bloom, bokehDisc, camera, designScene, devScale, easeInOut, easeOut, figureMask, filtered, flash, glow, grade, handheld, hash, ik2, inkLine, motes, onFigure, oval, paint, poly, rbox, rimLight, shaded, shake, smear, text, tubePts, vgrad, zoomBlur } from "@materials/s0rrow/code/draw";
import { KidPose, drawKid } from "@materials/s0rrow/code/kid";
import { Person, drawPerson } from "@materials/s0rrow/code/people";
import { BATH, Cloth, HALL, SHEET_ON_MIRROR, bathLight, bathroom, classroomBack, classroomSun, clothSheet, deskAt, hallGlass, hallLight, hallMirrorFrame, hallMirrorShadow, hallPlant, hallRoom, hallwayNight } from "@materials/s0rrow/code/mirrors/sets";
import { MARK_AT, birthmark, newspaper, penHeart, penRing, px, redArrow, redNote, sleeveHand, tape, toDesign } from "@materials/s0rrow/code/mirrors/story";
import { EV } from "./timeline";
import { nightShots } from "./night";

/** 第一幕（0 – 16.29，A 段）：他把家里的镜子都蒙上了；「她说，想看看我的脸」。
 *  开头 5 秒是四个镜头，用运镜串起来（留存）：
 *  0      ① 浴室：镜子只剩左边一条没糊上，里面是他的脸（左脸的胎记）。他的手拿着最后一张报纸从右边盖过来，
 *         1.05「mirrors」啪地糊上；1.13 镜头向右甩（横向动态模糊）——
 *  1.305  ② ——甩进夜里的走廊：拱形木框的落地穿衣镜里是他抱着床单的倒影；左边壁灯暖光，右边窗外月亮和
 *         小城灯火、纱帘在动，月光铺在地板上，右下角一盆虚焦的绿植。他闭上眼举起双手，1.56 床单从镜头下方
 *         飞起、在灯光里展开（1.81），2.07 落下盖住镜子；镜头推进床单，白场——
 *  2.575  ③ ——白场里出来：他站在被盖住的镜子前（同一面墙，窗外的灯变成光斑），唱到 nose / eyes 时旁边
 *         冒出小爱心；镜头缓缓环绕推近，3.95 加速冲向他的胎记（径向模糊）——
 *  4.099  ④ 鼓进来：胎记大特写，画面褪色、冷闪、速度线，红笔圈住：「瑕疵」（停到 5.12）。
 *  5.115  教室（切在「jokes」）：后排的男生戳他的胎记，全班大笑；5.62 他跟着干笑（眉头还纠着、冒汗），手却托上来
 *         捏住胎记（手肘支在桌上），戳人的缩回手笑得后仰。一个连续运镜：先拍全班，再推近他、往右滑，
 *         窗边阳光里画画的她在他身后左边露出来；6.13 她抬头看他（向日葵发卡闪一下光，和天台呼应），
 *         焦点从他转到她（彩蛋：她第一次出现，第 5 秒）。
 *  6.638  夜里，他的手机：白猫的消息 → 视频通话挂断四次 → 美颜「瑕疵：0」→ 发送（night.ts） */

// ================================================================ 0 – 1.305 shot 1: the last uncovered strip of mirror
/** the last sheet starts here; the glass left of it still reflects him */
const STRIP_END = 478;
const SHEET_W = 142;
/** his reflection in that strip */
const REF: Pt = [407, 770];
const REF_S = 0.5;
/** the whip-pan out of shot 1 starts here; the picture travels this far left (screen px) by EV.whip */
const WHIP0 = 1.13;
const WHIP_PX = 820;

/** the last sheet's left edge: it speeds up into the slap, then settles */
function sheetX(abs: number) {
  const u = phase(abs, EV.paperIn, EV.slap);
  const x = STRIP_END - (STRIP_END - 336) * Math.pow(u, 1.7);
  const settle = abs > EV.slap ? -3 * Math.sin(Math.PI * phase(abs, EV.slap, EV.slap + 0.16)) : 0;
  return x + settle;
}

/** Shot 1's camera: close on the strip (his face centred under the hook), a slow push, a jolt on the slap, then a
 *  whip-pan to the right (the picture slides left, faster and faster, smeared) into shot 2. */
function shot1View(abs: number) {
  const z = 2.72 + 0.16 * easeInOut(phase(abs, 0, EV.whip));
  const pivot: Pt = [REF[0], 790];
  const [hx, hy, hr] = handheld(abs, 3, 11);
  const jolt = abs > EV.slap ? 7 * Math.exp(-(abs - EV.slap) * 16) : 0;
  const [jx, jy] = shake(abs, jolt, 3);
  const u = phase(abs, WHIP0, EV.whip);
  const pan = WHIP_PX * u * u * u;
  const speed = (3 * WHIP_PX * u * u) / (EV.whip - WHIP0); // screen px per second
  return { z, pivot, dx: 540 - pivot[0] + hx + jx - pan, dy: 905 - pivot[1] + hy + jy, rot: hr - 0.03 * u * u, blur: speed / 48 };
}

/** what the strip of glass shows: the dim room behind him, and his face (mirrored, so the birthmark on his left cheek
 *  is on the left), eyes squeezing shut just before the paper covers it */
function reflection(c: Ctx, abs: number) {
  const [gx0, gy0, gx1, gy1] = BATH.glass;
  c.fillStyle = vgrad(c, gy0, gy1, [[0, "#536570"], [1, "#2e3a41"]]);
  c.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
  c.strokeStyle = "rgba(30,44,52,0.35)";
  c.lineWidth = 1.6;
  for (let y = gy0 + 30; y < gy1; y += 34) {
    c.beginPath();
    c.moveTo(gx0, y);
    c.lineTo(gx1, y);
    c.stroke();
  }
  for (let x = gx0 + 20; x < gx1; x += 34) {
    c.beginPath();
    c.moveTo(x, gy0);
    c.lineTo(x, gy1);
    c.stroke();
  }
  c.save();
  c.globalCompositeOperation = "lighter";
  glow(c, gx0 - 10, 800, 200, "rgba(255,160,80,0.22)");
  c.restore();
  const shut = abs > EV.eyesShut;
  const pose: KidPose = {
    body: "bust",
    eyes: shut ? "shut" : blinkEyes(abs, 4, "sad"),
    look: [0.05, 0.05],
    brows: "sad",
    mouth: shut ? "bite" : "flat",
    headY: Math.sin(abs * 2.2) * 2 + (shut ? 3 : 0),
    tilt: 0.03,
    arms: "down",
  };
  c.save();
  c.translate(REF[0], 0);
  c.scale(-1, 1);
  c.translate(-REF[0], 0);
  drawKid(c, REF[0], REF[1], REF_S, pose);
  birthmark(c, REF[0], REF[1], REF_S, pose);
  c.restore();
  // the sconce beside the mirror lights his face from the side
  c.save();
  c.globalCompositeOperation = "lighter";
  glow(c, 330, 760, 170, "rgba(210,232,255,0.18)");
  c.restore();
}

function mirrorGlass(c: Ctx, abs: number) {
  const [gx0, gy0, gx1, gy1] = BATH.glass;
  const sx = sheetX(abs);
  c.save();
  c.beginPath();
  c.rect(gx0, gy0, Math.max(0, Math.min(sx + 8, gx1) - gx0), gy1 - gy0);
  c.clip();
  reflection(c, abs);
  const g = c.createLinearGradient(gx0, gy0, gx0 + 240, gy1);
  g.addColorStop(0.3, "rgba(255,255,255,0)");
  g.addColorStop(0.46, "rgba(255,255,255,0.14)");
  g.addColorStop(0.6, "rgba(255,255,255,0)");
  c.fillStyle = g;
  c.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
  c.restore();
  // the sheets already up, and their tape
  newspaper(c, 462, 602, 284, 192, -0.012, 7300);
  newspaper(c, 458, 772, 288, 186, 0.01, 7310);
  tape(c, 478, 612, 62, 16, -0.62, 7320);
  tape(c, 736, 612, 60, 16, 0.55, 7321);
  tape(c, 600, 786, 130, 17, 0.02, 7322);
  tape(c, 738, 944, 62, 16, -0.5, 7323);
  // the last sheet, coming across in his hand
  newspaper(c, sx, 598, SHEET_W, 362, 0.012 * (1 - phase(abs, EV.paperIn, EV.slap)), 7330);
}

/** his hand (a simple round hand on the hoodie sleeve) holding the sheet's right edge; it presses on the slap, then
 *  goes back out of frame toward him */
function shot1Hand(c: Ctx, abs: number) {
  const away = smooth(phase(abs, EV.slap + 0.3, EV.slap + 0.66));
  if (away >= 0.999) return;
  const sx = sheetX(abs);
  const press = 1 - 0.07 * Math.sin(Math.PI * phase(abs, EV.slap, EV.slap + 0.2));
  // the palm flat on the sheet, pushing it across (on screen from the first frame)
  const at: Pt = [sx + 46 + away * 300, 772 + away * 130];
  c.save();
  c.globalAlpha *= 1 - away * away;
  sleeveHand(c, [at[0] + 330, at[1] + 200], at, 30 * press, 7350);
  c.restore();
}

function shot1(ctx: Ctx, abs: number) {
  const v = shot1View(abs);
  smear(ctx, (c) => {
    c.save();
    camera(c, v.pivot[0], v.pivot[1], v.z, v.rot, v.dx, v.dy);
    bathroom(c, abs);
    mirrorGlass(c, abs);
    shot1Hand(c, abs);
    bathLight(c, abs);
    motes(c, abs, 540, 770, 380, 300, 16, 61, "220,236,255", 0.6, 2.2);
    c.restore();
  }, v.blur, 0, "whip1", 12);
}

// ================================================================ 1.305 – 2.575 shot 2: the tall mirror in the hallway
/** his reflection in the tall mirror */
const REF2: Pt = [430, 846];
const REF2_S = 0.8;
/** the camera holds this point of the set (the middle of the mirror) at PIV2_AT on screen */
const PIV2: Pt = [430, 1000];
const PIV2_AT: Pt = [500, 1000];
/** the whip's tail: the picture arrives from the right, still sliding left, and settles by ARRIVE */
const ARRIVE = 1.54;
const ARRIVE_PX = 900;
/** from here the camera rushes into the sheet (white by EV.face) */
const RUSH2 = 2.3;

function shot2View(abs: number) {
  const a = phase(abs, EV.whip, ARRIVE);
  const pan = ARRIVE_PX * Math.pow(1 - a, 3);
  const speed = (3 * ARRIVE_PX * (1 - a) * (1 - a)) / (ARRIVE - EV.whip);
  const push = easeInOut(phase(abs, EV.sheetUp, RUSH2));
  const r = phase(abs, RUSH2, EV.face);
  const rush = r * r * r;
  const z = (1 + 0.06 * push) * (1 + 1.6 * rush);
  const [hx, hy, hr] = handheld(abs, 2.5, 17);
  return { z, dx: PIV2_AT[0] - PIV2[0] + pan + hx, dy: PIV2_AT[1] - PIV2[1] + hy - 24 * push, rot: hr - 0.03 * (1 - a) * (1 - a), blur: speed / 48, zoom: 0.16 * rush };
}

/** in the glass: he holds the folded sheet against his chest and looks at himself; shuts his eyes; lifts it up */
function reflection2Pose(abs: number): KidPose {
  const shut = abs > 1.44;
  const up = easeInOut(phase(abs, 1.46, EV.sheetUp + 0.05));
  // he shakes it open in front of his chest (kept under his chin: the head is drawn over the arms)
  const hand = (side: number): Pt => [side * (96 + 130 * up), 336 - 90 * up];
  return {
    body: "full",
    legs: "stand",
    eyes: shut ? "shut" : "sad",
    look: [0, 0.25],
    brows: "sad",
    mouth: shut ? "bite" : "flat",
    turn: 0.1 * smooth(phase(abs, 1.4, 1.5)),
    tilt: -0.03 - 0.04 * up,
    headY: 2 * Math.sin(abs * 2.4) + 6 * up,
    arms: "custom",
    handL: hand(-1),
    handR: hand(1),
    shapeL: "hold",
    shapeR: "hold",
    // elbows out while he holds it, under his arms once they are up (like the "up" preset)
    bendL: up > 0.5 ? 1 : -1,
    bendR: up > 0.5 ? -1 : 1,
    // the folded sheet between his hands, shaking out as he lifts it
    grip: (c) => {
      const cy = 340 - 16 * up,
        rx = 120 + 150 * up,
        ry = 66 + 92 * up;
      const pts: Pt[] = [[-rx, 6], [-rx * 0.6, -ry], [0, -ry * 0.8], [rx * 0.6, -ry], [rx, 6], [rx * 0.55, ry], [-rx * 0.5, ry * 0.9]];
      shaded(c, () => blob(c, pts.map(([x, y]) => [x, cy + y] as Pt), 7750, 3), "#efebe4", () => {
        inkLine(c, [[-rx * 0.5, cy - ry * 0.3], [0, cy + ry * 0.1], [rx * 0.5, cy - ry * 0.2]], 7751, 6, "rgba(120,130,160,0.35)");
        inkLine(c, [[-rx * 0.6, cy + ry * 0.4], [rx * 0.4, cy + ry * 0.5]], 7752, 6, "rgba(120,130,160,0.3)");
      }, C.ink, 4);
    },
  };
}

/** what the tall mirror shows: the dim hallway behind the camera (his bedroom door ajar, warm) and him */
function reflection2(c: Ctx, abs: number) {
  const { x0, x1, foot } = HALL.mirror;
  c.fillStyle = vgrad(c, 380, foot, [[0, "#30384c"], [0.75, "#283043"], [1, "#2a211f"]]);
  c.fillRect(x0, 380, x1 - x0, foot - 380);
  c.fillStyle = "#2b211d";
  c.fillRect(x0, 1400, x1 - x0, foot - 1400);
  inkLine(c, [[x0, 1400], [x1, 1400]], 7740, 3, "rgba(8,8,14,0.6)", 0.3);
  // his door across the hall, left ajar: a dark slab, a slit of warm light down its edge
  rbox(c, 516, 770, 104, 630, 3, 7741, 0.4);
  paint(c, "#1c1f2b", "rgba(8,8,14,0.8)", 3);
  c.fillStyle = vgrad(c, 770, 1400, [[0, "rgba(255,206,140,0.9)"], [1, "rgba(255,170,100,0.7)"]]);
  c.fillRect(604, 774, 12, 622);
  c.save();
  c.globalCompositeOperation = "lighter";
  glow(c, 610, 1080, 240, "rgba(255,170,100,0.2)");
  glow(c, 640, 1400, 160, "rgba(255,170,100,0.18)");
  glow(c, x0 + 30, 640, 260, "rgba(255,170,90,0.2)");
  c.restore();
  const pose = reflection2Pose(abs);
  const drawHim = (k: Ctx) => {
    k.save();
    k.translate(REF2[0], 0);
    k.scale(-1, 1);
    k.translate(-REF2[0], 0);
    drawKid(k, REF2[0], REF2[1], REF2_S, pose);
    birthmark(k, REF2[0], REF2[1], REF2_S, pose);
    k.restore();
  };
  drawHim(c);
  const m = figureMask(c, drawHim, "ref2");
  onFigure(c, m, (k) => {
    const g = k.createLinearGradient(REF2[0] - 260, 0, REF2[0] + 260, 0);
    g.addColorStop(0, "rgba(255,170,100,0.28)");
    g.addColorStop(1, "rgba(255,170,100,0)");
    k.fillStyle = g;
    k.fillRect(-500, -500, W + 1000, H + 1000);
  }, "screen");
  onFigure(c, m, (k) => {
    const g = k.createLinearGradient(REF2[0] - 200, 0, REF2[0] + 260, 0);
    g.addColorStop(0, "rgba(14,18,40,0.05)");
    g.addColorStop(1, "rgba(14,18,40,0.34)");
    k.fillStyle = g;
    k.fillRect(-500, -500, W + 1000, H + 1000);
  });
  rimLight(c, m, 1, -0.3, 4, "rgb(190,215,255)", 0.45, "lighter", 5);
  // a reflection is a little darker; then the glass's sheen
  c.fillStyle = "rgba(12,16,32,0.16)";
  c.fillRect(x0, 380, x1 - x0, foot - 380);
  const g = c.createLinearGradient(x0, 500, x1, 1100);
  g.addColorStop(0.18, "rgba(255,255,255,0)");
  g.addColorStop(0.3, "rgba(255,255,255,0.1)");
  g.addColorStop(0.4, "rgba(255,255,255,0)");
  g.addColorStop(0.62, "rgba(255,255,255,0)");
  g.addColorStop(0.68, "rgba(255,255,255,0.07)");
  g.addColorStop(0.74, "rgba(255,255,255,0)");
  c.fillStyle = g;
  c.fillRect(x0, 380, x1 - x0, foot - 380);
}

/** the sheet in flight: [time, cloth, depth-of-field blur] — up from below the frame (near the camera, out of focus),
 *  open in the lamplight, then down over the mirror */
const SHEET_KEYS: [number, Cloth, number][] = [
  [EV.sheetUp, [-330, 2080, 1300, 2050, 1380, 2900, -400, 2900, -50, 0.33, 0, 40], 24],
  [EV.sheetUp + 0.13, [-170, 600, 1150, 540, 1260, 2300, -260, 2350, -170, 0.33, 50, 70], 14],
  [EV.sheetMid, [30, 440, 900, 300, 850, 1340, 70, 1500, -70, 0.33, -50, 80], 5],
  [EV.sheetMid + 0.13, [160, 520, 720, 520, 740, 1520, 120, 1600, -150, 0.2, -16, 46], 1.2],
  [EV.sheetLand, SHEET_ON_MIRROR, 0],
];
function sheetAt(abs: number): { q: Cloth; blur: number } | null {
  const K = SHEET_KEYS;
  if (abs < K[0][0]) return null;
  const last = K.length - 1;
  if (abs >= K[last][0]) {
    // landed: a ripple runs out through the sides and the hem
    const t = abs - EV.sheetLand;
    const e = Math.exp(-t * 5) * (1 - Math.exp(-t * 30));
    const q = SHEET_ON_MIRROR.slice();
    q[10] += 20 * e * Math.sin(t * 16);
    q[11] += 26 * e;
    return { q, blur: 0 };
  }
  let i = 0;
  while (abs >= K[i + 1][0]) i++;
  let f = (abs - K[i][0]) / (K[i + 1][0] - K[i][0]);
  if (i === last - 1) f = easeOut(f); // it settles
  // Catmull-Rom through the keys, so it never stops at one
  const P = (j: number) => K[Math.max(0, Math.min(last, j))];
  const cr = (p0: number, p1: number, p2: number, p3: number) =>
    0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
  const q = P(i)[1].map((_, n) => cr(P(i - 1)[1][n], P(i)[1][n], P(i + 1)[1][n], P(i + 2)[1][n]));
  return { q, blur: Math.max(0, cr(P(i - 1)[2], P(i)[2], P(i + 1)[2], P(i + 2)[2])) };
}
function shot2Sheet(c: Ctx, abs: number) {
  const s = sheetAt(abs);
  if (!s) return;
  if (s.blur > 0.6) filtered(c, `blur(${(s.blur * devScale(c)).toFixed(1)}px)`, (k) => clothSheet(k, s.q, abs), "sheetDof");
  else clothSheet(c, s.q, abs);
}

function shot2(ctx: Ctx, abs: number) {
  const v = shot2View(abs);
  // while it is still nearer the camera than the plant, the sheet goes over everything
  const near = abs < EV.sheetUp + 0.2;
  const draw = (c: Ctx) => {
    c.save();
    camera(c, PIV2[0], PIV2[1], v.z, v.rot, v.dx, v.dy);
    hallRoom(c, abs);
    hallMirrorShadow(c);
    c.save();
    hallGlass(c);
    c.clip();
    reflection2(c, abs);
    c.restore();
    hallMirrorFrame(c);
    if (!near) shot2Sheet(c, abs);
    hallLight(c, abs);
    motes(c, abs, 700, 1560, 330, 380, 22, 81, "200,222,255", 0.75, 2.4);
    motes(c, abs, 170, 700, 260, 320, 14, 83, "255,222,170", 0.8, 2.4);
    if (abs > EV.sheetLand) motes(c, abs, 430, 1560, 340, 110, 20, 85, "255,236,210", 1.3 * Math.exp(-(abs - EV.sheetLand) * 2.5), 2.6);
    c.restore();
    // the plant by the camera moves more than the wall (parallax), out of focus
    c.save();
    camera(c, PIV2[0], PIV2[1], Math.pow(v.z, 1.35), v.rot, v.dx * 1.35, v.dy);
    filtered(c, `blur(${(9 * devScale(c)).toFixed(1)}px)`, (k) => hallPlant(k, abs), "hallPlant");
    c.restore();
    if (near) {
      c.save();
      camera(c, PIV2[0], PIV2[1], v.z, v.rot, v.dx, v.dy);
      shot2Sheet(c, abs);
      c.restore();
    }
  };
  if (v.blur > 2) smear(ctx, draw, v.blur, 0, "whip2", 12);
  else zoomBlur(ctx, draw, PIV2[0] + v.dx, PIV2[1] + v.dy, v.zoom, "rush2");
  // into the white of the sheet
  flash(ctx, 0.94 * smooth(phase(abs, 2.4, EV.face)), "#fff7ec");
}

// ================================================================ 2.575 – 4.099 shot 3: "I love my nose, eyes and…"
/** a close-up in front of the covered mirror: face ~540px wide, between the hook (top) and the lyrics (bottom) */
const FACE3: Pt = [540, 900];
const FACE3_S = 2.3;
/** the camera rushes through his birthmark into shot 4 from here */
const RUSH3 = 3.95;
/** shot 4 holds the birthmark here on screen, his face this big */
const MARK4: Pt = [560, 900];
const FACE4_S = 4;

function facePose(abs: number, body: "bust" | "full"): KidPose {
  const flinch = smooth(phase(abs, EV.flaw, EV.flaw + 0.22));
  const hit = abs > EV.flaw && abs < EV.flaw + 0.32;
  return {
    body,
    legs: "stand",
    eyes: hit ? "shut" : abs > EV.flaw ? "sad" : blinkEyes(abs, 6, "sad"),
    look: [-0.5 - 0.25 * flinch, 0.75],
    brows: abs > EV.flaw ? "worried" : "sad",
    mouth: abs > EV.flaw ? "bite" : "flat",
    tilt: -0.04 - 0.05 * flinch,
    turn: -0.12 - 0.16 * flinch,
    headY: Math.sin(abs * 2.1) * 3 + 6 * flinch,
    arms: "pockets", // hands hidden in the hoodie pocket (shy); no stray fists at the bottom edge
  };
}

/** the birthmark's centre (design units) on a drawKid at (at, s) in pose p */
function markOn(at: Pt, s: number, p: KidPose): Pt {
  const lx = MARK_AT[0] + (p.turn ?? 0) * 14,
    ly = MARK_AT[1];
  const t = p.tilt ?? 0;
  return [at[0] + s * ((p.headX ?? 0) + lx * Math.cos(t) - ly * Math.sin(t)), at[1] + s * ((p.headY ?? 0) + lx * Math.sin(t) + ly * Math.cos(t))];
}

/** him, lit by the hallway: the lamp warm from the left, the window's moonlight cold from the right */
function litFace(ctx: Ctx, at: Pt, s: number, pose: KidPose, key: string) {
  const drawHim = (c: Ctx) => drawKid(c, at[0], at[1], s, pose);
  drawHim(ctx);
  birthmark(ctx, at[0], at[1], s, pose);
  const m = figureMask(ctx, drawHim, key);
  onFigure(ctx, m, (c) => {
    const g = c.createLinearGradient(at[0] - 150 * s, 0, at[0] + 160 * s, 0);
    g.addColorStop(0, "rgba(255,176,104,0.34)");
    g.addColorStop(0.5, "rgba(255,176,104,0.06)");
    g.addColorStop(1, "rgba(255,176,104,0)");
    c.fillStyle = g;
    c.fillRect(-2000, -2000, W + 4000, H + 4000);
  }, "screen");
  onFigure(ctx, m, (c) => {
    const g = c.createLinearGradient(at[0] - 70 * s, 0, at[0] + 200 * s, 0);
    g.addColorStop(0, "rgba(12,16,40,0)");
    g.addColorStop(1, "rgba(12,16,40,0.36)");
    c.fillStyle = g;
    c.fillRect(-2000, -2000, W + 4000, H + 4000);
  });
  rimLight(ctx, m, 1, -0.2, 6, "rgb(200,226,255)", 0.62, "lighter", 6.5);
  rimLight(ctx, m, -1, -0.35, 5, "rgb(255,200,140)", 0.34, "lighter", 6.5);
}

/** the town's lights and the moon through the window as out-of-focus discs (hall coordinates): x, y, r, rgb, alpha */
const BOKEH3: [number, number, number, string, number][] = [
  [752, 1010, 20, "255,200,120", 0.32],
  [806, 962, 15, "255,222,160", 0.28],
  [858, 1040, 24, "255,186,110", 0.3],
  [918, 995, 17, "255,232,184", 0.26],
  [972, 1052, 21, "205,222,255", 0.24],
  [907, 582, 46, "232,238,255", 0.22],
];

function shot3(ctx: Ctx, abs: number) {
  const pose = facePose(abs, "full");
  const mark = markOn(FACE3, FACE3_S, pose);
  // out of the white still moving in, then a slow push as the camera arcs round him; at the end a rush into the mark
  const arrive = easeOut(phase(abs, EV.face, EV.face + 0.45));
  const drift = easeInOut(phase(abs, EV.face, EV.flaw));
  const r = phase(abs, RUSH3, EV.flaw);
  const rush = r * r * r;
  const z = (0.9 + 0.1 * arrive + 0.05 * drift) * (1 + 0.75 * rush);
  const [hx, hy, hr] = handheld(abs, 3, 21);
  // the rush also carries the mark to where shot 4 holds it
  const tx = mark[0] + (MARK4[0] - mark[0]) * rush + hx,
    ty = mark[1] + (MARK4[1] - mark[1]) * rush + hy;
  const draw = (c: Ctx) => {
    // the same wall behind him (the sheet over the mirror on the left, the window on the right), out of focus;
    // it slides the other way as the camera arcs round him
    c.save();
    camera(c, mark[0], mark[1], 1 + (z - 1) * 0.6, hr * 0.6 + 0.015 - 0.03 * drift, tx - mark[0] + 70 - 140 * drift, ty - mark[1]);
    camera(c, 600, 900, 1.45, 0, -60, 0);
    filtered(c, `blur(${(5 * devScale(c)).toFixed(1)}px)`, (k) => hallwayNight(k, abs), "hallBg");
    c.save();
    c.globalCompositeOperation = "screen";
    for (const [x, y, br, rgb, a] of BOKEH3) bokehDisc(c, x, y, br, rgb, a * (0.85 + 0.15 * Math.sin(abs * 2 + x)));
    c.restore();
    c.restore();
    c.save();
    camera(c, mark[0], mark[1], z, hr - 0.01 + 0.02 * drift, tx - mark[0], ty - mark[1]);
    litFace(c, FACE3, FACE3_S, pose, "him3");
    // "I love my nose, eyes…": a heart pops beside each as it's sung, bobbing (in his head's frame: they follow him)
    c.translate(FACE3[0], FACE3[1]);
    c.scale(FACE3_S, FACE3_S);
    c.translate(pose.headX ?? 0, pose.headY ?? 0);
    c.rotate(pose.tilt ?? 0);
    const fx = (pose.turn ?? 0) * 20;
    const heart = (x: number, y: number, at: number, seed: number, size: number) => {
      const bobY = Math.sin((abs - at) * 6 + seed) * 3;
      penHeart(c, x, y + bobY, size, phase(abs, at, at + 0.22), seed);
    };
    heart(-30 + fx * 1.2, 80, EV.nose, 7401, 40);
    heart(-104 + fx, 12, EV.eyes, 7411, 38);
    heart(100 + fx, 4, EV.eyes + 0.06, 7421, 38);
    c.restore();
  };
  const blur = 0.1 * Math.pow(1 - phase(abs, EV.face, EV.face + 0.22), 2) + 0.24 * rush;
  zoomBlur(ctx, draw, tx, ty, blur, "rush3");
  // out of the white
  flash(ctx, 0.94 * (1 - smooth(phase(abs, EV.face, EV.face + 0.32))), "#fff7ec");
}

// ================================================================ 4.099 – 5.115 shot 4: 「瑕疵」
/** speed lines from the frame's edges toward (cx, cy), for the hit */
function impactLines(ctx: Ctx, cx: number, cy: number, k: number, abs: number) {
  if (k <= 0.01) return;
  const f = Math.floor(abs * 24);
  ctx.save();
  ctx.fillStyle = `rgba(236,244,255,${(0.7 * k).toFixed(3)})`;
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2 + (hash(i * 7.1 + f) - 0.5) * 0.1;
    const r0 = 600 + hash(i * 3.3 + f * 1.7) * 300;
    const w = (5 + hash(i * 5.7) * 9) / 1600;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a + w) * 1600, cy + Math.sin(a + w) * 1600);
    ctx.lineTo(cx + Math.cos(a - w) * 1600, cy + Math.sin(a - w) * 1600);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** the drums: his birthmark, huge; the picture drains of colour and only the red pen stays red */
function shot4(ctx: Ctx, abs: number) {
  const pose = facePose(abs, "bust");
  // placed so that, once he has flinched, the mark sits at MARK4
  const m0 = markOn([0, 0], FACE4_S, facePose(EV.flaw + 0.4, "bust"));
  const at: Pt = [MARK4[0] - m0[0], MARK4[1] - m0[1]];
  const k = phase(abs, EV.flaw, EV.flaw + 0.26);
  const z = (0.8 + 0.2 * easeOut(k)) * (1 + 0.04 * easeInOut(phase(abs, EV.flaw + 0.26, EV.classroom)));
  const [hx, hy, hr] = handheld(abs, 3, 41);
  const [jx, jy] = shake(abs, 12 * Math.exp(-(abs - EV.flaw) * 8), 5);
  const sat = 1 - 0.62 * smooth(phase(abs, EV.flaw, EV.flaw + 0.2));
  const view = (c: Ctx) => camera(c, MARK4[0], MARK4[1], z, hr, hx + jx, hy + jy);
  const draw = (c: Ctx) => {
    grade(c, sat, (g) => {
      g.save();
      view(g);
      // behind him: the window, far out of focus
      g.save();
      camera(g, 864, 780, 1.8, 0, 36, 0);
      filtered(g, `blur(${(9 * devScale(g)).toFixed(1)}px)`, (b) => hallwayNight(b, abs), "hallBg4");
      g.restore();
      litFace(g, at, FACE4_S, pose, "him4");
      g.restore();
    }, "grade4");
    // the red pen stays red: a ring round the mark, in his head's own frame
    c.save();
    view(c);
    c.translate(at[0], at[1]);
    c.scale(FACE4_S, FACE4_S);
    c.translate(pose.headX ?? 0, pose.headY ?? 0);
    c.rotate(pose.tilt ?? 0);
    const mx = MARK_AT[0] + (pose.turn ?? 0) * 14,
      my = MARK_AT[1];
    penRing(c, mx, my, 60, 47, phase(abs, EV.flaw + 0.02, EV.flaw + 0.16), 7430, "#ff3b3b", px(c, 21), 0.3);
    const ringTop = toDesign(c, mx + 30, my - 52);
    c.restore();
    impactLines(c, MARK4[0], MARK4[1], 1 - phase(abs, EV.flaw, EV.flaw + 0.36), abs);
    // 「瑕疵」 in red pen above the ring (inside the frame, under the hook), with an arrow down to it
    const lx = Math.min(ringTop[0] - 40, 1040 - 300),
      ly = Math.max(520, ringTop[1] - 190);
    redArrow(c, [lx + 100, ly + 70], [ringTop[0] - 4, ringTop[1] + 4], phase(abs, EV.flaw + 0.08, EV.flaw + 0.26), 7440, "#ff3b3b", 10);
    redNote(c, "瑕疵", lx, ly, phase(abs, EV.flaw + 0.14, EV.flaw + 0.42), -0.08, 150);
  };
  zoomBlur(ctx, draw, MARK4[0], MARK4[1], 0.2 * Math.pow(1 - phase(abs, EV.flaw, EV.flaw + 0.2), 2), "crash4");
  flash(ctx, 0.34 * Math.exp(-(abs - EV.flaw) * 12), "#dfefff");
}

// ================================================================ 5.115 – 6.638 the jokes he laughs about
/** a seated student of scale s in the classroom set: head-centre y (desk front edge = head + 300·s, see CLASS) */
const seatY = (s: number) => 520 + 264 * s;
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const HIM3_S = 1.15;
const HIM3: Pt = [520, seatY(HIM3_S)];
/** her, in the back row by the window, in the sun (the Easter egg: her first appearance) */
const GIRL3_S = 0.42;
const GIRL3: Pt = [300, seatY(GIRL3_S)];
/** the boy in the row behind, on his right, leaning over his desk to point at the birthmark */
const PTR_S = 0.85;
const PTR: Pt = [905, seatY(PTR_S)];
/** his pointing hand's wrist (his head units): elbow on his desk, forearm up toward the cheek */
const PTR_WRIST: Pt = [-206, 212];

/** her sketchbook, held up in front of her (her local frame, same x, y, s as her drawKid) */
function sketchbook(ctx: Ctx, x: number, y: number, s: number, abs: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.translate(18, 262);
  ctx.rotate(-0.12);
  rbox(ctx, -98, -66, 196, 132, 6, 7700, 0.6);
  paint(ctx, "#fbf6ea", C.ink, 4.5);
  for (let i = 0; i < 8; i++) {
    oval(ctx, -84 + i * 24, -66, 5, 7, 7701 + i, 0.3);
    paint(ctx, null, "#8a8a8a", 2.4);
  }
  // pencil marks on the page (we can't see what she draws yet)
  inkLine(ctx, [[-50, -20], [-20, -34], [14, -26], [30, 0]], 7710, 2.4, "rgba(90,90,100,0.6)");
  inkLine(ctx, [[-40, 10], [-6, 24], [26, 16]], 7711, 2.4, "rgba(90,90,100,0.6)");
  // her pencil, moving a little
  const w = Math.sin(abs * 9) * 6;
  inkLine(ctx, [[46 + w, 2], [96 + w, -50]], 7712, 9, "#f2c14e");
  inkLine(ctx, [[46 + w, 2], [96 + w, -50]], 7712, 2.4, C.ink);
  // simple round hands on its edges
  for (const [hx, hy] of [[-96, 20], [56 + w, 6]] as Pt[]) {
    oval(ctx, hx, hy, 26, 24, 7720 + hx, 0.6);
    paint(ctx, "#f6e1c3", C.ink, 4);
  }
  ctx.restore();
}

/** a drop of sweat at his temple when he forces the laugh (his head frame) */
function sweatDrop(ctx: Ctx, at: Pt, s: number, pose: KidPose, abs: number) {
  const k = smooth(phase(abs, EV.laughAlong, EV.laughAlong + 0.2));
  if (k <= 0) return;
  ctx.save();
  ctx.translate(at[0], at[1]);
  ctx.scale(s, s);
  ctx.translate(pose.headX ?? 0, pose.headY ?? 0);
  ctx.rotate(pose.tilt ?? 0);
  const slide = 14 * phase(abs, EV.laughAlong + 0.2, EV.next);
  ctx.translate(140, -60 + slide);
  ctx.scale(k, k);
  blob(ctx, [[0, -26], [12, -2], [10, 12], [0, 18], [-10, 12], [-12, -2]], 7730, 0.5);
  paint(ctx, "#bfe6ff", C.ink, 3.5);
  ctx.restore();
}

/** an index finger out of a fist (the hand drawPerson drew at wrist w along ang; mirror = his screen-left hand),
 *  in that person's head units */
function indexFinger(ctx: Ctx, w: Pt, ang: number, mirror: boolean, seed: number) {
  ctx.save();
  ctx.translate(w[0], w[1]);
  ctx.rotate(ang);
  ctx.scale(0.86, mirror ? -0.86 : 0.86);
  shaded(ctx, () => blob(ctx, tubePts([[44, -15], [74, -18], [104, -17]], [23, 22, 20]), seed, 0.5), C.skin, () => {
    blob(ctx, [[70, -8], [104, -10], [104, -4], [70, -2]], seed + 1, 0.4);
    paint(ctx, "rgba(200,150,95,0.3)", null);
  }, C.ink, 4.5);
  inkLine(ctx, [[72, -27], [74, -20]], seed + 2, 2, "#a8865c");
  inkLine(ctx, [[96, -24], [104, -22]], seed + 3, 2.2, "#c99f75");
  ctx.restore();
}

/** on his desk: an open exercise book, his pencil case, a pen (desk-local units; the top runs y -64 … 0) */
function hisDeskThings(c: Ctx) {
  c.save();
  c.translate(-30, -30);
  c.rotate(-0.04);
  shaded(c, () => poly(c, [[-124, -24], [0, -27], [0, 24], [-132, 20]], 7801, 0.6), "#fbf8ef", () => {
    for (let i = 0; i < 3; i++) inkLine(c, [[-112, -12 + i * 12], [-14, -14 + i * 12]], 7802 + i, 1.6, "rgba(90,120,170,0.45)");
  }, C.ink, 3.5);
  shaded(c, () => poly(c, [[0, -27], [126, -24], [132, 20], [0, 24]], 7806, 0.6), "#f4efe2", () => {
    for (let i = 0; i < 3; i++) inkLine(c, [[14, -14 + i * 12], [112, -12 + i * 12]], 7807 + i, 1.6, "rgba(90,120,170,0.45)");
  }, C.ink, 3.5);
  c.restore();
  rbox(c, 128, -56, 88, 30, 12, 7811, 0.6);
  paint(c, "#6f9fd0", C.ink, 3.5);
  inkLine(c, [[-200, -18], [-150, -40]], 7812, 8, "#e9534c");
  inkLine(c, [[-200, -18], [-150, -40]], 7813, 2, C.ink);
}

/** the front row, nearest the camera and out of focus: a boy turned round in his seat to look at him (the back of
 *  his head and shoulders, bottom left — brown hair with the sun on it, not a dark blot) and the next desk's corner
 *  (bottom right) */
function frontRow(c: Ctx, abs: number) {
  const bob = Math.sin(abs * 15) * 6;
  shaded(c, () => blob(c, [[-200, 2000], [-120, 1830], [20, 1770], [250, 1766], [400, 1830], [480, 2000]], 7901, 2), "#f1f2ee", () => {
    blob(c, [[200, 1776], [400, 1840], [480, 2000], [260, 2000]], 7902, 2);
    paint(c, "rgba(0,0,0,0.1)", null);
  }, C.ink, 6);
  blob(c, [[110, 1786], [186, 1786], [192, 1740], [106, 1740]], 7903, 1);
  paint(c, "#e8cda4", C.ink, 5);
  shaded(c, () => oval(c, 150, 1650 + bob, 132, 140, 7904, 3), "#5b4130", () => {
    inkLine(c, [[60, 1580 + bob], [130, 1540 + bob], [210, 1552 + bob]], 7905, 22, "rgba(255,214,160,0.35)");
    inkLine(c, [[50, 1640 + bob], [90, 1600 + bob]], 7907, 10, "rgba(255,214,160,0.25)");
  }, C.ink, 6);
  oval(c, 14, 1666 + bob, 17, 26, 7906, 1);
  paint(c, "#ecd0a6", C.ink, 5);
  deskAt(c, 1090, 1650, 2.1, 7910);
}

/** a sun glint (a little four-pointed star) */
function glint(ctx: Ctx, x: number, y: number, r: number, a: number) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, x, y, r * 2.4, `rgba(255,236,180,${(0.55 * a).toFixed(3)})`);
  ctx.fillStyle = `rgba(255,255,240,${a.toFixed(3)})`;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4 + 0.2;
    const rr = i % 2 ? r * 0.2 : r;
    ctx[i ? "lineTo" : "moveTo"](x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The camera is one move: it holds on the class laughing (sliding in a little from the cut), then — as he laughs
 *  along — pushes in and drifts so that he slides right and she, by the window in the sun, opens up behind him on the
 *  left; at EV.herLook the focus racks from him to her. The layers move by depth (back row 0.6, him 1, front row 1.6). */
const CLASS_PIV: Pt = [520, 830];
function classView(abs: number) {
  const push = easeInOut(phase(abs, EV.laughAlong - 0.1, EV.herLook + 0.08));
  const drift = easeInOut(phase(abs, EV.herLook, EV.next));
  const intro = 1 - easeOut(phase(abs, EV.classroom, EV.classroom + 0.5));
  const [hx, hy, hr] = handheld(abs, 2.5, 31);
  return {
    z: 1.02 + 0.3 * push + 0.07 * drift,
    dx: 160 * push + 24 * drift - 30 * intro + hx,
    dy: 40 * push + hy,
    rot: hr + 0.012 * push,
    focus: easeInOut(phase(abs, EV.herLook - 0.04, EV.herLook + 0.3)),
  };
}
function classLayer(c: Ctx, v: ReturnType<typeof classView>, d: number) {
  camera(c, CLASS_PIV[0], CLASS_PIV[1], 1 + (v.z - 1) * d, v.rot * d, v.dx * d, v.dy * d);
}

/** him: eyes down, biting his lip, turned away from the finger; on "laugh" he laughs along — eyes squeezed shut,
 *  worried brows, a bead of sweat — and his hand comes up and covers the mark, his elbow on the desk (cheek in hand).
 *  `cover` 0..1 is how far the hand has come; `palm`, `wrist`, `elbow` in body units. */
const PALM_ON: Pt = [100, 94];
function classHim(abs: number) {
  if (abs < EV.laughAlong) {
    const pose: KidPose = { body: "bust", eyes: blinkEyes(abs, 12, "sad"), look: [-0.4, 0.55], brows: "worried", mouth: "bite", turn: -0.18, tilt: -0.05, headY: 6, arms: "down", shapeL: "hidden", shapeR: "hidden" };
    return { pose, cover: 0, palm: [0, 0] as Pt, elbow: [0, 0] as Pt, wrist: [0, 0] as Pt };
  }
  const up = backOut(phase(abs, EV.laughAlong, EV.laughAlong + 0.22));
  const laugh = Math.sin(abs * 14);
  const tilt = 0.04 + 0.06 * Math.min(1, up) + 0.015 * laugh,
    headY = laugh * 2.5,
    turn = -0.06;
  // the palm over the mark, in his head's frame → body units
  const hx = PALM_ON[0] + turn * 14,
    hy = PALM_ON[1];
  const target: Pt = [hx * Math.cos(tilt) - hy * Math.sin(tilt), headY + hx * Math.sin(tilt) + hy * Math.cos(tilt)];
  const palm: Pt = [mix(130, target[0], up), mix(470, target[1], up)];
  const elbow: Pt = [mix(150, 232, up), mix(330, 262, up)];
  const len = Math.hypot(elbow[0] - palm[0], elbow[1] - palm[1]);
  const wrist: Pt = [palm[0] + ((elbow[0] - palm[0]) / len) * 44, palm[1] + ((elbow[1] - palm[1]) / len) * 44];
  const pose: KidPose = { body: "bust", eyes: "happy", brows: "worried", mouth: "grin", turn, tilt, headY, arms: "custom", elbowR: elbow, handR: wrist, shapeR: "hidden", handL: [-120, 432], shapeL: "hidden" };
  return { pose, cover: up, palm, elbow, wrist };
}

/** the forearm again in front of his chin (drawKid draws arms behind the head) and his hand flat over the mark,
 *  fingers together up toward his eye (body units) */
function coverHand(c: Ctx, elbow: Pt, wrist: Pt, palm: Pt, seed: number) {
  const cuffStart: Pt = [elbow[0] + (wrist[0] - elbow[0]) * 0.84, elbow[1] + (wrist[1] - elbow[1]) * 0.84];
  const mid: Pt = [(elbow[0] + cuffStart[0]) / 2, (elbow[1] + cuffStart[1]) / 2];
  shaded(c, () => blob(c, tubePts([elbow, mid, cuffStart], [54, 50, 47], true, false), seed, 1), C.hoodie, () => {
    blob(c, tubePts([[elbow[0] + 14, elbow[1] + 4], [mid[0] + 14, mid[1] + 4], [cuffStart[0] + 14, cuffStart[1] + 4]], [36, 34, 32], true, false), seed + 1, 1);
    paint(c, C.hoodieDark, null);
  }, C.ink, 5.5);
  blob(c, tubePts([cuffStart, wrist], [48, 44], false, false), seed + 2, 0.8);
  paint(c, C.hoodieDark, C.ink, 4.5);
  const ang = Math.atan2(palm[1] - wrist[1], palm[0] - wrist[0]);
  c.save();
  c.translate(palm[0], palm[1]);
  c.rotate(ang);
  shaded(c, () => blob(c, [[-40, -30], [6, -36], [38, -31], [56, -14], [58, 10], [40, 29], [6, 35], [-40, 30], [-48, 0]], seed + 3, 0.8), C.skin, () => {
    oval(c, -12, 16, 34, 18, seed + 4, 0.6);
    paint(c, "rgba(196,150,96,0.3)", null);
  }, C.ink, 4.5);
  for (const y of [-15, 0, 15]) inkLine(c, [[20, y], [52, y * 0.88]], seed + 5 + y, 2.2, "#c99f75");
  c.restore();
}

function shotClass(ctx: Ctx, abs: number) {
  const v = classView(abs);
  const burst = smooth(phase(abs, EV.jokes - 0.12, EV.jokes + 0.1));
  const rock = (seed: number) => burst * Math.sin(abs * 16 + seed) * 0.05;
  const laughFace = (k: number) => (burst > k ? "laugh" : "smile") as "laugh" | "smile";
  // ---- the room and the back row (soft focus, sharpening when the focus racks to her): two laughing; her by the
  //      window in the sun, drawing — on EV.herLook she looks up at him (the sunflower clip glints, as on the roof)
  const look = smooth(phase(abs, EV.herLook, EV.herLook + 0.16));
  const girl: KidPose = { who: "girl", outfit: "cardigan", body: "bust", eyes: "open", look: [mix(0.1, 0.85, look), mix(0.9, 0.2, look)], brows: look > 0.5 ? "worried" : "flat", mouth: "flat", arms: "custom", handL: [-30, 300], handR: [70, 286], shapeL: "hidden", shapeR: "hidden", turn: mix(0.05, 0.3, look), headY: 10 * (1 - look), tilt: 0.06 * (1 - look), seed: 41 };
  ctx.save();
  classLayer(ctx, v, 0.6);
  filtered(ctx, `blur(${(mix(1.8, 0.3, v.focus) * devScale(ctx)).toFixed(1)}px)`, (c) => {
    classroomBack(c, abs);
    const back = (x: number, s: number, p: Person) => {
      drawPerson(c, x, seatY(s), s, { body: "bust", top: "#eef1f0", x: 0, arms: "down", ...p });
      deskAt(c, x, seatY(s) + 300 * s, s, (p.seed ?? 0) + 7000);
    };
    back(735, 0.42, { hair: "buzz", hairColor: "#222", face: laughFace(0.5), turn: -0.45, tilt: rock(1), seed: 801 });
    back(972, 0.44, { hair: "bob", hairColor: "#4a3020", face: laughFace(0.4), turn: -0.6, tilt: rock(2) - 0.04, seed: 802 });
    drawKid(c, GIRL3[0], GIRL3[1], GIRL3_S, girl);
    sketchbook(c, GIRL3[0], GIRL3[1], GIRL3_S, abs);
    deskAt(c, GIRL3[0], GIRL3[1] + 300 * GIRL3_S, GIRL3_S, 7540);
  }, "class3bg");
  classroomSun(ctx, abs);
  motes(ctx, abs, 330, 600, 200, 260, 18, 71, "255,240,205", 0.8, 2.4);
  // she sits in the sun: it warms her as the focus comes to her; her clip catches it when she looks up
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, GIRL3[0] - 10, GIRL3[1] + 10, 150, `rgba(255,214,150,${(0.12 + 0.16 * v.focus).toFixed(3)})`);
  ctx.restore();
  const clip: Pt = [GIRL3[0] - 98 * GIRL3_S, GIRL3[1] + (-66 + 10 * (1 - look)) * GIRL3_S];
  glint(ctx, clip[0], clip[1], 26, Math.sin(Math.PI * phase(abs, EV.herLook + 0.08, EV.herLook + 0.4)));
  ctx.restore();
  // ---- the middle: the row behind him and him (sharp, going soft when the focus racks to her)
  const he = classHim(abs);
  const pose = he.pose;
  // the pointer pulls his finger back and rocks with laughing when he laughs along
  const back = smooth(phase(abs, EV.laughAlong - 0.06, EV.laughAlong + 0.18));
  const jab = Math.sin(abs * 18) * 5 * burst * (1 - back);
  const wrist: Pt = [mix(PTR_WRIST[0] + jab, -118, back), mix(PTR_WRIST[1] - jab * 0.4, 300, back)];
  const ptr: Person = { hair: "short", hairColor: "#2a1d18", top: "#e9edf2", face: laughFace(0.2), arms: "down", handL: wrist, bendL: 1, shapeL: back > 0.5 ? "relax" : "fist", body: "bust", turn: -0.6 + 0.2 * back, tilt: rock(4) - 0.1 + 0.14 * back, x: 0, seed: 804 };
  const middle = (k: Ctx) => {
    drawPerson(k, 150, seatY(0.72), 0.72, { hair: "short", hairColor: "#1f1a17", top: "#eef1f0", face: laughFace(0.3), arms: "down", body: "bust", turn: 0.55, tilt: rock(3) + 0.05, x: 0, seed: 803 });
    deskAt(k, 150, seatY(0.72) + 300 * 0.72, 0.72, 7550);
    drawPerson(k, PTR[0], PTR[1], PTR_S, ptr);
    deskAt(k, PTR[0] + 40, PTR[1] + 300 * PTR_S, PTR_S, 7570);
    // his forearm rests on the desk top: draw the arm again over the desk, then the finger
    k.save();
    k.beginPath();
    k.rect(PTR[0] - 420 * PTR_S, PTR[1] + 150 * PTR_S, 318 * PTR_S, 146 * PTR_S);
    k.clip();
    drawPerson(k, PTR[0], PTR[1], PTR_S, ptr);
    k.restore();
    if (back < 0.5) {
      k.save();
      k.translate(PTR[0], PTR[1]);
      k.scale(PTR_S, PTR_S);
      const [pEl, pWr] = ik2([-90, 156], wrist, 128, 124, 1);
      indexFinger(k, pWr, Math.atan2(pWr[1] - pEl[1], pWr[0] - pEl[0]), true, 7580);
      k.restore();
    }
    // him, out of the sun: a cool shade, only a faint warm edge from the windows
    const shade = (c: Ctx) => {
      const g = c.createLinearGradient(300, 0, 760, 0);
      g.addColorStop(0, "rgba(40,50,90,0.1)");
      g.addColorStop(1, "rgba(40,50,90,0.24)");
      c.fillStyle = g;
      c.fillRect(-500, -500, W + 1000, H + 1000);
    };
    const drawHim = (c: Ctx) => {
      drawKid(c, HIM3[0], HIM3[1], HIM3_S, pose);
      birthmark(c, HIM3[0], HIM3[1], HIM3_S, pose);
    };
    drawHim(k);
    const m = figureMask(k, drawHim, "him3");
    onFigure(k, m, shade);
    rimLight(k, m, -1, -0.5, 5, "rgb(255,222,170)", 0.35, "lighter", 6.5);
    sweatDrop(k, HIM3, HIM3_S, pose, abs);
    deskAt(k, HIM3[0], HIM3[1] + 300 * HIM3_S, HIM3_S, 7560, hisDeskThings);
    // his forearm on the desk and the hand over the mark go over the desk top (and his chin); below the desk's
    // front edge they stay hidden while the hand comes up
    if (he.cover > 0) {
      const drawCover = (c: Ctx) => {
        c.save();
        c.translate(HIM3[0], HIM3[1]);
        c.scale(HIM3_S, HIM3_S);
        c.beginPath();
        c.rect(-600, -600, 1200, 896);
        c.clip();
        coverHand(c, he.elbow, he.wrist, he.palm, 7590);
        c.restore();
      };
      drawCover(k);
      onFigure(k, figureMask(k, drawCover, "him3hand"), shade);
    }
  };
  ctx.save();
  classLayer(ctx, v, 1);
  const soft = 2.2 * v.focus;
  if (soft > 0.2) filtered(ctx, `blur(${(soft * devScale(ctx)).toFixed(1)}px)`, middle, "class3mid");
  else middle(ctx);
  // ---- 哈哈哈 around the laughers (never over a face), popping in one after another
  const haha = (x: number, y: number, size: number, rot: number, at: number, fill: string) => {
    const k = backOut(phase(abs, at, at + 0.16));
    if (k <= 0) return;
    ctx.save();
    ctx.translate(x, y + Math.sin(abs * 17 + x) * 4);
    ctx.rotate(rot + Math.sin(abs * 13 + y) * 0.04);
    ctx.scale(k, k);
    text(ctx, "哈哈哈", 0, 0, { size, font: F.cn, fill, stroke: C.ink, lw: size * 0.16 });
    ctx.restore();
  };
  haha(930, 372, 62, 0.08, EV.jokes - 0.1, "#ffe45c");
  haha(150, 430, 54, -0.12, EV.jokes + 0.1, "#fff");
  haha(830, 470, 50, -0.1, EV.jokes + 0.3, "#fff");
  haha(200, 330, 44, 0.1, EV.laughAlong + 0.1, "#ffe45c");
  ctx.restore();
  // ---- the front row, out of focus (it slides out of the frame as the camera pushes in)
  ctx.save();
  classLayer(ctx, v, 1.6);
  filtered(ctx, `blur(${(9 * devScale(ctx)).toFixed(1)}px)`, (c) => frontRow(c, abs), "class3fg");
  ctx.restore();
}

function vignette(ctx: Ctx, a: number) {
  const g = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.3, W / 2, H * 0.46, H * 0.78);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${a.toFixed(2)})`);
  ctx.fillStyle = g;
  ctx.fillRect(-60, -60, W + 120, H + 120);
}

export function createScene(options: SceneOptions) {
  return designScene(options, 0, (ctx, abs) => {
    if (abs < EV.whip) shot1(ctx, abs);
    else if (abs < EV.face) shot2(ctx, abs);
    else if (abs < EV.flaw) shot3(ctx, abs);
    else if (abs < EV.classroom) shot4(ctx, abs);
    else if (abs < EV.next) shotClass(ctx, abs);
    else nightShots(ctx, abs);
    // after the shot chain: the lens
    if (abs < EV.whip) bloom(ctx, 0.24, 24, 2.6);
    else if (abs < EV.face) bloom(ctx, 0.32, 26, 2.3);
    else if (abs < EV.flaw) bloom(ctx, 0.2, 22, 2.6);
    else if (abs < EV.classroom) bloom(ctx, 0.12, 22, 2.8);
    else if (abs >= EV.next) bloom(ctx, 0.2, 24, 2.6);
    if (abs < EV.next) vignette(ctx, abs < EV.classroom ? 0.42 : 0.22);
    else vignette(ctx, abs >= EV.face4 && abs < EV.dialog ? 0.5 : 0.36);
  });
}
