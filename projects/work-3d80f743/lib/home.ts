// 第二幕第二镜「把愿望敲碎成粉末」：千斤家门口（17.9–19.8）。
// 千斤家在最高那栋楼左边、隔一条巷子的那栋二十层老楼的一楼（lib/world.ts 的 QJ_HOME）。门口一根拴人的铁桩，
// 一根红线从铁桩上的铁环拴到千斤的脚踝上：她飘在两层楼高的地方，抱着膝盖缩成一团，仰头看着天上的白，眼泪往上飘。
// 哑铃店最后一帧推到妈妈怀里那只哑铃上 → 同一只哑铃、画面上同一个位置、同样大小，溶到家门口（妈妈抱着它到家了）；
// 她弯腰把哑铃放在铁桩旁边（18.51「咚」），直起腰，抬头看着女儿。镜头从哑铃上一边退开、一边顺着红线往上抬，落在
// 「门口的妈妈—铁桩—红线—半空的女儿」一竖条上停住，几乎不动（窒息）。下一镜妈妈攥着红线一把一把把她拽下来。

import { beatAt } from "@frame/engine/tempo";
import { editing } from "@frame/engine/editable";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import type { MoveKey, PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { type Cam, E, aim, camLerp, kick, ph, toScreen } from "./cam";
import { INK, QJ_HOME, addEllipse, drawGlow, part, rectPath } from "./world";
import { drawPerson } from "./people";
import { groundShadow } from "./props";
import { ARMS, LIMP, SMOOTH, fade, live, smoothTrack } from "./motion";
import { MOM, MOM_HOME, QIANJIN } from "./poses2";
import { BIG_R, type BarGrip, type GripKeys, MOM_HUG, drawDumbbell, drawShopShade, gripAt as barGripAt, holdBar } from "./shop";

type V2 = [number, number];
const b = beatAt;

export const HOME_T = {
  /** 从哑铃店溶过来（同一只哑铃） */
  dissolve0: 17.88,
  dissolve1: 18.2,
  /** 哑铃落地「咚」 */
  set: b(37),
  /** 镜头顺着红线往上抬 */
  rise0: 18.5,
  rise1: 19.42,
  /** 下一句「心灵也被挂上门锁」 */
  end: 19.8,
  // ——— ③「心灵也被挂上门锁」：拽三把（踩在底鼓上）、扣上锁 ———
  /** 三把往下拽 */
  pulls: [b(40), b(41), b(42)],
  /** 远处的手从哑铃上抓起铁链那一头 */
  chain: 21.24,
  /** 举到她脚踝上 */
  lift: 21.42,
  /** 「锁」咔哒扣上 */
  lock: 21.53,
  /** 下一句「看不清灯火」 */
  end3: 21.86,
  // ——— ④「看不清灯火」：妈妈松手进门，门「嘭」；千斤看着门；「火」灯灭；她闭上眼飘起来，哑铃被铁链拖离地面、吊在脚下（她的浮力比最重的哑铃还大），
  //      红线绷直，一下把她拽住 ———
  /** 妈妈松开红线和铁链，转身 */
  drop: 21.93,
  /** 门往里开（妈妈推开）、她进门 */
  open0: 22.16,
  open1: 22.3,
  inside: 22.3,
  /** 关门：门「嘭」（底鼓） */
  close0: 22.4,
  slam: b(45),
  /** 「火」门灯、门里的灯灭了 */
  dark: 22.8,
  /** 灯一灭：她闭上眼，身子轻了，慢慢往上飘；铁链一绷，哑铃在底鼓上被拖离地面，吊在她脚下荡 */
  rise: 22.88,
  liftOff: b(46),
  /** 窗帘拉上（灯还亮着，看不清了） */
  cur0: 22.86,
  cur1: 23.16,
  /** 红线绷直（最后一下底鼓）：一下被拽住，悬在半空——23.6 音乐空掉的那一拍里一直拽着 */
  taut: b(47),
  /** 下一句「但我还想做些什么」 */
  end4: 24.0,
  // ——— ⑤「但我还想做些什么」（2026-10-20 用户：「红绳断掉，慢慢向上飞」）：鼓整套进来，红线绷断；她吊着哑铃慢慢往上飘，
  //      睁开眼低头望着家门，近处的手朝门伸下去，又慢慢收回来 ———
  /** 红线绷断（鼓整套进来） */
  snap: b(48),
  /** 「做」睁开眼，低头望着家门 */
  look: 24.15,
  /** 「些」—「么」手朝门伸下去 */
  reach0: 24.36,
  reach1: 24.8,
  /** 手慢慢收回来 */
  back0: 25.4,
  back1: 25.95,
  /** 切到高空（下一句「其实还想要说很多」，lib/sky.ts） */
  end5: b(52),
};

// ——— ④ 门、灯、窗帘 ———
/** 门扇往里转过的角度（rad，合页在左边）：她走近时推开，进去以后关上「嘭」，门在框里弹一下 */
export function doorAngle(t: number) {
  const T = HOME_T;
  if (t <= T.open0) return 0;
  if (t < T.close0) return 1.3 * E.out(ph(t, T.open0, T.open1));
  if (t < T.slam) return 1.3 * (1 - E.in2(ph(t, T.close0, T.slam)));
  const a = t - T.slam;
  return 0.06 * Math.exp(-a / 0.035) * Math.abs(Math.sin(a * 50));
}
/** 门灯、门里的灯：「火」那一下关掉；灯丝还红一下 */
const filament = (t: number) => (t < HOME_T.dark ? 1 : Math.exp(-(t - HOME_T.dark) / 0.09));
const bump = (t: number, t0: number, w: number) => (t <= t0 || t >= t0 + w ? 0 : Math.sin((Math.PI * (t - t0)) / w));
/** 门灯亮多少：「灯」字上闪两下（先把人的眼睛引到灯上），「火」字上灭 */
const lampLevel = (t: number) => (t >= HOME_T.dark ? 0 : 1 - 0.62 * bump(t, 22.59, 0.08) - 0.38 * bump(t, 22.68, 0.06));
/** 窗帘拉上了多少 */
export const curtainShut = (t: number) => E.io(ph(t, HOME_T.cur0, HOME_T.cur1));
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
/** 两个颜色之间（k = 0 是 a） */
function mixColor(a: string, b: string, k: number) {
  if (k <= 0) return a;
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * Math.min(1, k))).join(",")})`;
}

// ——————————————— 门口（世界坐标，街面 y = 0） ———————————————
const HX = QJ_HOME.x;
export const HOME = {
  /** 一楼按人的尺度画，盖住楼的下面三层窗（到第 17 层的楼板线） */
  top: -796,
  door0: HX + 250,
  door1: HX + 410,
  doorTop: -650,
  win0: HX + 40,
  win1: HX + 200,
  winTop: -590,
  winBot: -290,
  /** 拴人的铁桩 */
  post: HX + 620,
  postH: 140,
  /** 妈妈站在门口（朝右），哑铃放在她和铁桩中间 */
  mom: HX + 290,
  bell: HX + 432,
};
/** 红线拴在铁桩上的铁环 */
export const RING: V2 = [HOME.post + 30, -HOME.postH + 26];
/** 红线多长（放着时）：她漂在两层楼高的地方 */
const THREAD = 1250;

/** 一楼的门脸：抹灰的墙、墨绿的铁门（门上贴着倒「福」）、窗里亮着灯、门口的台阶和一盆花、电表箱、门灯 */
export function drawHomeFront(g: CanvasRenderingContext2D, t: number, panel = true) {
  const lw = 3.2;
  const x0 = HX;
  const x1 = HX + QJ_HOME.w;
  // 墙：上面抹灰，下面一圈瓷砖
  part(g, rectPath(x0, HOME.top, x1 - x0, -HOME.top + 4), "#ead8bf", "#dcc6aa", lw, [10, 8]);
  // 墙上的旧水渍
  g.fillStyle = "rgba(150,110,90,0.12)";
  g.fillRect(x0 + 470, HOME.top + 10, 26, 260);
  g.fillRect(x0 + 640, HOME.top + 30, 18, 180);
  part(g, rectPath(x0, -118, x1 - x0, 122), "#c9b39b", "#b8a189", lw, [6, 5]);
  g.strokeStyle = "rgba(70,50,50,0.18)";
  g.lineWidth = 1.6;
  g.beginPath();
  for (let y = -82; y < 0; y += 36) {
    g.moveTo(x0, y);
    g.lineTo(x1, y);
  }
  for (let x = x0 + 40; x < x1; x += 60) {
    g.moveTo(x, -118);
    g.lineTo(x, 0);
  }
  g.stroke();
  // 窗：屋里亮着灯，一道布帘，外面是防飘栏
  {
    const x = HOME.win0;
    const w = HOME.win1 - HOME.win0;
    const y = HOME.winTop;
    const h = HOME.winBot - HOME.winTop;
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    const room = g.createLinearGradient(0, y, 0, y + h);
    room.addColorStop(0, "#f6cf93");
    room.addColorStop(1, "#d99a68");
    g.fillStyle = room;
    g.fillRect(x, y, w, h);
    drawGlow(g, x + w * 0.62, y + 70, 120, 0.8);
    // 布帘拉了一半；④ 妈妈进屋以后拉上了：灯还亮着，隔着帘子只透出一团暖
    const sway = 3 * Math.sin(t * 1.3);
    const k = curtainShut(t);
    const cur = new Path2D();
    cur.moveTo(x, y);
    cur.lineTo(x + w * (0.46 + 0.54 * k), y);
    cur.quadraticCurveTo(x + w * (0.36 + 0.64 * k) + sway, y + h * 0.5, x + w * (0.42 + 0.58 * k) + sway * (1 - k), y + h);
    cur.lineTo(x, y + h);
    cur.closePath();
    part(g, cur, mixColor("#a9c3cf", "#e6c6a2", 0.6 * k), mixColor("#93adba", "#d2ab88", 0.6 * k), lw * 0.8, [4, 3]);
    if (k > 0) {
      // 帘子的褶，和透过帘子的灯
      g.strokeStyle = "rgba(70,90,110,0.3)";
      g.lineWidth = 2;
      g.beginPath();
      for (const f of [0.22, 0.5, 0.78]) {
        const fx = x + w * (0.46 + 0.54 * k) * f;
        g.moveTo(fx, y + 6);
        g.quadraticCurveTo(fx - 4, y + h * 0.5, fx + 2, y + h - 4);
      }
      g.stroke();
      drawGlow(g, x + w * 0.62, y + 80, 150, 0.42 * k);
    }
    g.restore();
    g.strokeStyle = "#efe2cc";
    g.lineWidth = lw * 2;
    g.strokeRect(x, y, w, h);
    g.strokeStyle = INK;
    g.lineWidth = lw;
    g.strokeRect(x - 4, y - 4, w + 8, h + 8);
    // 防飘栏：凸出来的铁笼
    g.lineWidth = lw * 0.9;
    g.strokeRect(x - 14, y - 14, w + 28, h + 36);
    g.lineWidth = lw * 0.55;
    g.beginPath();
    for (let k = 1; k < 6; k++) {
      const bx = x - 14 + ((w + 28) * k) / 6;
      g.moveTo(bx, y - 14);
      g.lineTo(bx, y + h + 22);
    }
    g.moveTo(x - 14, y + h * 0.45);
    g.lineTo(x + w + 14, y + h * 0.45);
    g.stroke();
    part(g, rectPath(x - 22, y + h + 18, w + 44, 12), "#b3a9a3", null, lw * 0.7);
  }
  // 门：墨绿的铁门（往里开，合页在左边），门上一个小窗、一张倒贴的「福」（红纸菱形）；panel 为 false 时门扇另画（妈妈进门时画在她前面）
  {
    const x = HOME.door0;
    const w = HOME.door1 - HOME.door0;
    const y = HOME.doorTop;
    part(g, rectPath(x - 14, y - 14, w + 28, -y + 14), "#d9c7ad", null, lw);
    if (doorAngle(t) > 0) drawDoorway(g);
    if (panel) drawDoorPanel(g, t);
    drawDoorLamp(g, t);
    // 台阶
    part(g, rectPath(x - 30, -30, w + 60, 32), "#b9ad9f", "#a4988a", lw, [4, 4]);
  }
  // 电表箱、一根落水管
  part(g, rectPath(HX + 470, -560, 70, 90), "#c7c2b8", "#b2aca0", lw * 0.8, [3, 3]);
  part(g, rectPath(HX + 700, HOME.top, 20, -HOME.top), "#a39a91", null, lw * 0.7);
  // 门边一盆花（几团叶子挤成一丛）
  {
    const px = HOME.door1 + 48;
    const pot = new Path2D();
    pot.moveTo(px - 34, 0);
    pot.lineTo(px + 34, 0);
    pot.lineTo(px + 28, -64);
    pot.lineTo(px - 28, -64);
    pot.closePath();
    const sway = 3 * Math.sin(t * 1.2);
    const leaves = new Path2D();
    addEllipse(leaves, px - 24 + sway, -86, 26, 20, -0.5);
    addEllipse(leaves, px + 22 + sway, -88, 26, 20, 0.5);
    addEllipse(leaves, px + sway, -114, 24, 22, 0);
    part(g, leaves, "#7f9b5c", "#69844b", lw, [4, 3]);
    part(g, pot, "#c4775a", "#ad6448", lw, [4, 3]);
  }
}

/** 开着的门里：暖黄的走廊（门里的灯亮着），地上一截木地板 */
function drawDoorway(g: CanvasRenderingContext2D) {
  const x = HOME.door0;
  const w = HOME.door1 - HOME.door0;
  const y = HOME.doorTop;
  g.save();
  g.beginPath();
  g.rect(x, y, w, -y);
  g.clip();
  const gr = g.createLinearGradient(0, y, 0, 0);
  gr.addColorStop(0, "#f5cf92");
  gr.addColorStop(0.65, "#e2a971");
  gr.addColorStop(1, "#b8794f");
  g.fillStyle = gr;
  g.fillRect(x, y, w, -y);
  // 走廊往里拐：右边一面暗一点的墙
  g.fillStyle = "rgba(150,90,60,0.22)";
  g.fillRect(x + w * 0.66, y, w * 0.34, -y);
  g.fillStyle = "#a8714c";
  g.fillRect(x, -96, w, 96);
  g.strokeStyle = "rgba(70,40,30,0.35)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x, -96);
  g.lineTo(x + w, -96);
  g.stroke();
  drawGlow(g, x + w * 0.45, y + 70, 150, 0.75);
  g.restore();
}

/** 门扇本身（左边在 x） */
function doorLeaf(g: CanvasRenderingContext2D, x: number, t: number) {
  const lw = 3.2;
  const w = HOME.door1 - HOME.door0;
  const y = HOME.doorTop;
  part(g, rectPath(x, y, w, -y), "#45665c", "#3a574e", lw, [5, 4]);
  // 门上的小窗：里面透出一点暖光（门里的灯灭了以后暗下去）
  part(g, rectPath(x + 30, y + 40, w - 60, 90), mixColor("#f0c98e", "#5d5552", 1 - filament(t)), null, lw * 0.8);
  g.strokeStyle = INK;
  g.lineWidth = lw * 0.6;
  g.beginPath();
  for (let k = 1; k < 4; k++) {
    g.moveTo(x + 30 + ((w - 60) * k) / 4, y + 40);
    g.lineTo(x + 30 + ((w - 60) * k) / 4, y + 130);
  }
  g.stroke();
  // 门板上的凸棱
  g.strokeStyle = "rgba(30,50,44,0.5)";
  g.lineWidth = 2.4;
  g.strokeRect(x + 22, y + 170, w - 44, 180);
  g.strokeRect(x + 22, y + 380, w - 44, 220);
  // 福
  g.save();
  g.translate(x + w / 2, y + 260);
  g.rotate(Math.PI / 4);
  part(g, rectPath(-34, -34, 68, 68), "#c8473a", null, lw * 0.7);
  g.strokeStyle = "rgba(244,206,120,0.85)";
  g.lineWidth = 2.4;
  g.strokeRect(-26, -26, 52, 52);
  g.restore();
  // 门把手
  g.fillStyle = "#d8b65e";
  g.beginPath();
  g.arc(x + w - 26, y + 360, 8, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.stroke();
}

/** 门扇：关着时就是墙上的一扇门；开着时按转过的角度压窄（合页在左边），转开了、背着光，暗一点 */
export function drawDoorPanel(g: CanvasRenderingContext2D, t: number) {
  const th = doorAngle(t);
  const x = HOME.door0;
  if (th <= 0) {
    doorLeaf(g, x, t);
    return;
  }
  const w = HOME.door1 - HOME.door0;
  const y = HOME.doorTop;
  const c = Math.cos(th);
  const s = Math.sin(th);
  g.save();
  g.translate(x, 0);
  g.scale(Math.max(0.03, c), 1);
  doorLeaf(g, 0, t);
  g.restore();
  g.fillStyle = `rgba(36,28,30,${0.5 * s})`;
  g.fillRect(x, y, w * c, -y);
  // 门扇的厚度（锁那一边）
  if (s > 0.05) part(g, rectPath(x + w * c, y, 8 * s, -y), "#2e463f", null, 2.2);
}

/** 门上的灯：一个小罩子，天快黑了，亮着；「火」那一下灭了，灯丝还红一下 */
function drawDoorLamp(g: CanvasRenderingContext2D, t: number) {
  const lw = 3.2;
  const lx = HOME.door0 + (HOME.door1 - HOME.door0) / 2;
  const ly = HOME.doorTop - 60;
  drawLampGlow(g, t);
  const shade = new Path2D();
  shade.moveTo(lx - 28, ly);
  shade.lineTo(lx + 28, ly);
  shade.lineTo(lx + 18, ly + 24);
  shade.lineTo(lx - 18, ly + 24);
  shade.closePath();
  part(g, shade, "#5a4a44", null, lw * 0.8);
  g.fillStyle = t < HOME_T.dark ? mixColor("#fff1cf", "#e8a868", 1 - lampLevel(t)) : mixColor("#ffab5c", "#7d7068", 1 - filament(t));
  g.beginPath();
  g.arc(lx, ly + 28, 9, 0, Math.PI * 2);
  g.fill();
}
function drawLampGlow(g: CanvasRenderingContext2D, t: number) {
  const lx = HOME.door0 + (HOME.door1 - HOME.door0) / 2;
  const ly = HOME.doorTop - 60;
  if (t < HOME_T.dark) drawGlow(g, lx, ly + 22, 200, (0.6 + 0.04 * Math.sin(t * 7.3)) * lampLevel(t));
  else drawGlow(g, lx, ly + 28, 46, 0.6 * filament(t));
}

/** 拴人的铁桩：一根矮矮的铸铁柱子，顶上一个帽，侧面一个铁环（红线拴在这里），身上几块锈 */
export function drawPost(g: CanvasRenderingContext2D) {
  const lw = 3.2;
  const x = HOME.post;
  const h = HOME.postH;
  const body = new Path2D();
  body.moveTo(x - 30, 0);
  body.lineTo(x - 26, -h + 18);
  body.lineTo(x + 26, -h + 18);
  body.lineTo(x + 30, 0);
  body.closePath();
  part(g, body, "#3d393d", "#2f2c30", lw, [5, 4]);
  g.fillStyle = "rgba(160,84,52,0.55)";
  g.beginPath();
  addEllipse(g, x - 8, -50, 9, 6);
  addEllipse(g, x + 12, -96, 6, 5);
  g.fill();
  const cap = new Path2D();
  cap.roundRect(x - 38, -h, 76, 22, 8);
  part(g, cap, "#4a4549", "#3a363a", lw, [3, 3]);
  // 铁环
  g.strokeStyle = INK;
  g.lineWidth = 9;
  g.beginPath();
  g.arc(RING[0], RING[1] + 10, 13, -Math.PI * 0.4, Math.PI * 1.4);
  g.stroke();
  g.strokeStyle = "#6d676b";
  g.lineWidth = 4.5;
  g.stroke();
}

/** 红线：从铁环到她的脚踝，被她往上拽得绷着，风吹得中间往右鼓一点；末端在脚踝上绕两圈 */
export function drawThread(g: CanvasRenderingContext2D, from: V2, to: V2, t: number, slack = 0) {
  const mx = (from[0] + to[0]) / 2 + 30 + 22 * Math.sin(t * 1.7) + slack * 120;
  const my = (from[1] + to[1]) / 2 + slack * 160;
  g.save();
  g.lineCap = "round";
  g.strokeStyle = INK;
  g.lineWidth = 6.5;
  g.beginPath();
  g.moveTo(from[0], from[1]);
  g.quadraticCurveTo(mx, my, to[0], to[1]);
  g.stroke();
  g.strokeStyle = "#d8352b";
  g.lineWidth = 3.6;
  g.stroke();
  g.restore();
}

/** 红线（按一串点画成平滑的线） */
function drawThreadPts(g: CanvasRenderingContext2D, pts: V2[]) {
  if (pts.length < 2) return;
  const path = new Path2D();
  path.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) path.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  path.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = INK;
  g.lineWidth = 6.5;
  g.stroke(path);
  g.strokeStyle = "#d8352b";
  g.lineWidth = 3.6;
  g.stroke(path);
  g.restore();
}

/**
 * 一根铁链：沿着折线一节一节排（节和节一正一侧地扣在一起），深铁色、上沿一点高光。
 * wrap：末端在脚踝上绕两圈（画在腿前面）
 */
export function drawChain(g: CanvasRenderingContext2D, pts: V2[], wrapAt?: V2) {
  const step = 13;
  g.save();
  g.lineCap = "round";
  let carry = 0;
  let k = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    const ang = Math.atan2(by - ay, bx - ax);
    for (let d = carry; d < len; d += step, k++) {
      const x = ax + ((bx - ax) * d) / len;
      const y = ay + ((by - ay) * d) / len;
      const face = k % 2 === 0;
      g.save();
      g.translate(x, y);
      g.rotate(ang);
      g.beginPath();
      g.ellipse(0, 0, 10, face ? 6 : 2.2, 0, 0, Math.PI * 2);
      g.strokeStyle = INK;
      g.lineWidth = 5.2;
      g.stroke();
      g.strokeStyle = face ? "#5b565c" : "#4a464b";
      g.lineWidth = 2.6;
      g.stroke();
      if (face) {
        g.strokeStyle = "rgba(240,230,220,0.45)";
        g.lineWidth = 1.2;
        g.beginPath();
        g.ellipse(0, -1, 7, 3.6, 0, Math.PI * 1.1, Math.PI * 1.9);
        g.stroke();
      }
      g.restore();
      carry = d + step - len;
    }
    if (carry < 0) carry = 0;
  }
  if (wrapAt) {
    for (const dy of [-8, 6]) {
      g.beginPath();
      g.ellipse(wrapAt[0], wrapAt[1] + dy, 24, 8, -0.08, 0, Math.PI * 2);
      g.strokeStyle = INK;
      g.lineWidth = 6.5;
      g.stroke();
      g.strokeStyle = "#5b565c";
      g.lineWidth = 3.4;
      g.stroke();
    }
  }
  g.restore();
}

/** 一把黄铜挂锁：open 0 扣上、1 开着（锁梁翘起来） */
export function drawPadlock(g: CanvasRenderingContext2D, x: number, y: number, open: number, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  // 锁梁
  g.save();
  g.translate(-9, 0);
  g.rotate(-0.9 * open);
  g.translate(9, 0);
  g.beginPath();
  g.moveTo(-9, 2 - 8 * open);
  g.lineTo(-9, -10 - 8 * open);
  g.arc(0, -10 - 8 * open, 9, Math.PI, 0);
  g.lineTo(9, 2 - 8 * open * 0.2);
  g.strokeStyle = INK;
  g.lineWidth = 7;
  g.stroke();
  g.strokeStyle = "#b9b3ad";
  g.lineWidth = 3.4;
  g.stroke();
  g.restore();
  // 锁身
  const body = new Path2D();
  body.roundRect(-15, 0, 30, 26, 5);
  part(g, body, "#c99a45", "#ad8136", 3, [3, 3]);
  g.fillStyle = "#4a3a2a";
  g.beginPath();
  g.arc(0, 11, 3.4, 0, Math.PI * 2);
  g.fill();
  g.fillRect(-1.4, 11, 2.8, 8);
  g.restore();
}

// ——————————————— 人和哑铃 ———————————————
const MOM_SPEC = CAST.千斤的妈妈;
/**
 * 弯腰放下时（用户 2026-10-30：「后面放下杠铃的动作也需要重新调整」）：抱法（MOM_HUG）两只手都扣在朝着镜头那只铁饼上，原来一直按抱法抓，
 * 哑铃转回侧躺时那只铁饼转到最右边，手跟着伸出去、最后搭在铁饼顶上。现在远处的手（R）不松开那只铁饼，顺着它转到它的上沿
 * （弯法、前臂在前和抱着时一样，肘不翻面）；近处的手（L）滑到离她近那一头的把手上、从上面握住。最后一截哑铃掉下去（够不着，胳膊伸直跟着往下）。
 * 试过的：远处的手也握把手——把手太低，肘要从倒 V 翻成朝下，一帧里肘跳过去；近处的手扣离她近的那只铁饼上沿——铁饼就在她身前，
 * 手要往回折、还从脸前面扫过
 */
const MOM_PUT: Record<"L" | "R", BarGrip> = {
  L: { s: -52, h: -22, bend: "down", chest: "over" },
  R: { s: 110, h: -100, fore: "front" },
};
const QJ = CAST.千斤;
/** 拽红线时妈妈从门口往右挪多少（站到哑铃和铁桩中间） */
const PULL_DX = 270;
/** 每拽一把，她往下坠多少（红线在铁环那头收回来） */
const PULL_DROP = 285;
/** 拽完以后红线剩多长、斜多少：她悬在妈妈右上方（脚踝够得着，身子不压在妈妈头上） */
const LEN_END = THREAD - 3 * PULL_DROP;
const ANG_END = 0.165;
/** ④ 飘起来：从灯灭到红线绷直越飘越快，升 RISE_H、被风往右带 DRIFT（红线斜着拉到铁桩，哑铃吊在红线右边，不和红线叠在一起） */
const RISE_H = 394;
const DRIFT = 150;
/** ⑤ 红线断了以后：一下往上一窜，然后慢慢往上飘（V5 起步，越飘越快一点），被风慢慢往右带 */
const LURCH = 70;
const V5 = 140;
const A5 = 60;

export function makeHome() {
  const T = HOME_T;
  // ——— 妈妈：抱着哑铃（和哑铃店最后一帧一样）→ 弯腰放下 →「咚」→ 直起腰、撑一下后腰 → 抬头看着女儿 ———
  const momKeys: MoveKey[] = [
    { t: 17.4, x: 0, p: { ...MOM.抱着, neck: -20 } },
    { t: 18.0, p: { ...MOM.抱着, neck: -22, lean: 20 } },
    { t: 18.22, ease: "inOut", p: { ...MOM.抱着, neck: -18, lean: 24 } },
    { t: T.set - 0.02, ease: "inOut", squash: 0.04, p: MOM_HOME.放下 },
    { t: T.set + 0.14, ease: "out", squash: 0, p: { ...MOM_HOME.放下, lean: 40, neck: -4 } },
    { t: T.set + 0.46, ease: "inOut", p: MOM_HOME.直腰 },
    { t: T.set + 0.86, ease: "inOut", p: MOM_HOME.仰头 },
    { t: 19.5, p: MOM_HOME.仰头 },
    // 镜头在半空里的女儿身上时，她走到铁桩跟前、两只手攥住红线（站在哑铃和铁桩中间）
    { t: 19.88, ease: "inOut", dx: PULL_DX, p: MOM_HOME.拽上 },
    // 一把、一把、一把往下拽（踩在底鼓上）：手在线上倒着往上攥
    ...T.pulls.flatMap((P, k): MoveKey[] => [
      { t: P - 0.04, ease: "inOut", p: MOM_HOME.拽上 },
      { t: P + 0.13, ease: "out", squash: 0.035, p: MOM_HOME.拽下 },
      ...(k < 2 ? [{ t: P + 0.42, ease: "inOut", squash: 0, p: MOM_HOME.拽上 } as MoveKey] : []),
    ]),
    // 拽到够得着了：近处的手攥着线不松，弯腰从哑铃上抓起铁链，举到她脚踝上，扣上锁
    { t: T.chain, ease: "inOut", squash: 0, p: MOM_HOME.抓链 },
    { t: T.lift, ease: "out", p: MOM_HOME.锁 },
    { t: T.lock + 0.4, ease: "inOut", p: { ...MOM_HOME.锁, neck: 26 } },
    // ④ 松开红线和铁链，低下头，一句话不说转身往门里走（不回头）：两步半，推开门进去
    { t: T.drop + 0.09, ease: "inOut", p: MOM_HOME.松手 },
    { t: 22.14, ease: "inOut", dx: -14, p: MOM_HOME.走迈 },
    { t: 22.27, ease: SMOOTH, dx: -100, p: MOM_HOME.走过 },
    { t: 22.4, ease: SMOOTH, dx: -100, p: MOM_HOME.走迈2 },
    { t: 22.53, ease: SMOOTH, dx: -96, p: MOM_HOME.走过2 },
  ];
  const momMove = live(momKeys, {
    look: lookOf(MOM_SPEC),
    base: { wind: 0.5 },
    idle: true,
    seed: 21,
    springs: ARMS,
    add: (t, o) => {
      // 抱着走了一路：喘气，肩膀一起一伏；放下以后慢慢平下来
      const k = 1 - fade(t, T.set + 0.4, T.set + 1.2) * 0.6;
      o.lean += k * 1.6 * Math.sin(t * 7.5);
      o.neck -= k * 1.2 * Math.sin(t * 7.5);
    },
  });
  const momRoot = (t: number) => HOME.mom + momMove(t).x;
  /** 走到门口踏上台阶 */
  const momY = (x: number) => -30 * fade(-x, 4338, 4374);
  /** 抱在怀里时哑铃的中心（和哑铃店一样：胸口前面、低一点） */
  const momChest = (t: number): V2 => {
    const f = momMove(t);
    const j = castJoints(MOM_SPEC, f.pose);
    return [momRoot(t) + (j.shoulderL[0] + j.shoulderR[0]) / 2 + 92, j.hip[1] - 58];
  };
  /** 地上的哑铃：放在妈妈和铁桩中间，侧躺着 */
  const ON_GROUND: V2 = [HOME.bell, -BIG_R];
  const bigAt = (t: number): { x: number; y: number; phi: number; rot: number } => {
    const held = { phi: 1.16, rot: 0.05 };
    if (t < T.dissolve1) {
      const c = momChest(t);
      return { x: c[0], y: c[1] + 3 * Math.sin(t * 7.5), ...held };
    }
    if (t < T.set) {
      // 弯腰放下去：越往下越快（太沉了，最后一截是掉下去的），一边转回侧躺
      const u = ph(t, T.dissolve1, T.set);
      const from = momChest(T.dissolve1);
      const e = u * u;
      return {
        x: from[0] + (ON_GROUND[0] - from[0]) * E.out(u),
        y: from[1] + (ON_GROUND[1] - from[1]) * e,
        phi: held.phi + (0.3 - held.phi) * E.io(u),
        rot: held.rot * (1 - u),
      };
    }
    // ④ 吊在铁链上：被拖离地面，在她脚下荡着跟上去
    if (t > T.rise) return bell.at(t);
    // 落地：往下一顿、晃一下停住
    const a = t - T.set;
    return { x: ON_GROUND[0], y: ON_GROUND[1] + 4 * Math.exp(-a / 0.06) * Math.sin(a * 40), phi: 0.3, rot: 0.02 * Math.exp(-a / 0.1) * Math.sin(a * 30) };
  };

  /** 妈妈的手抓在哑铃上的哪里：抱着（MOM_HUG）→ 一弯腰换成放下的抓法（MOM_PUT） */
  const MOM_GRIPS: Record<"L" | "R", GripKeys> = {
    L: [
      [T.dissolve1, MOM_HUG.L],
      [T.dissolve1 + 0.22, MOM_PUT.L],
    ],
    R: [
      [T.dissolve1, MOM_HUG.R],
      [T.dissolve1 + 0.22, MOM_PUT.R],
    ],
  };
  // 妈妈的手：抱着、放下时箍在哑铃上（和哑铃店一样的抓法），放下以后松开
  const reach = (pose: PoseIn, rootX: number, side: "L" | "R", p: V2, w: number, rootY = 0, spec = MOM_SPEC) => {
    if (w <= 0) return;
    const k = spec.scale;
    const mir = (pose.face ?? 0) > 0 ? -1 : 1;
    const local: V2 = [((p[0] - rootX) / k) * mir, (p[1] - rootY) / k];
    const key = side === "L" ? "armL" : "armR";
    pose[key] = { ...(pose[key] as object), to: local, ik: Math.min(1, w) };
  };
  /** 拽红线时手攥着的地方：拽完的一把在胯前（GB），往上攥的一把在线上离 GB 210 的地方 */
  const gripAt = (t: number): V2 => {
    const x = momRoot(t);
    const GB: V2 = [x + 42, -262];
    const A = ankleAt(t);
    const along = (from: V2, d: number): V2 => {
      const dx = A[0] - from[0];
      const dy = A[1] - from[1];
      const l = Math.hypot(dx, dy) || 1;
      return [from[0] + (dx / l) * d, from[1] + (dy / l) * d];
    };
    // 第一次攥在铁环上面的线上
    if (t < P1 - 0.04) return along(RING, 200);
    const top = along(GB, 210);
    for (let k = 0; k < 3; k++) {
      const P = T.pulls[k];
      if (t < P - 0.04) return top;
      if (t < P + 0.13) {
        const from = k === 0 ? along(RING, 200) : top;
        const e = E.out(ph(t, P - 0.04, P + 0.13));
        return [from[0] + (GB[0] - from[0]) * e, from[1] + (GB[1] - from[1]) * e];
      }
      if (k === 2 || t < P + 0.42) {
        if (k === 2) return GB;
        const e = E.io(ph(t, P + 0.13, P + 0.42));
        return [GB[0] + (top[0] - GB[0]) * e, GB[1] + (top[1] - GB[1]) * e];
      }
    }
    return GB;
  };
  /** 搭在哑铃那只铁饼上的铁链一头（挂着一把开着的锁） */
  const chainRest = (): V2 => {
    const d = { x: ON_GROUND[0], y: ON_GROUND[1], phi: 0.3 };
    return [d.x + 118 * Math.cos(d.phi) + 16, d.y - 58];
  };
  /** 锁扣在她脚踝的哪里 */
  const lockAt = (t: number): V2 => {
    const A = ankleAt(t);
    return [A[0] + 4, A[1] + 22];
  };
  const momAt = (t: number) => {
    const f = momMove(t);
    const pose: PoseIn = { ...f.pose };
    const x = momRoot(t);
    const d = bigAt(t);
    // 抱着时和哑铃店最后一样的抱法（lib/shop.ts 的 MOM_HUG），弯腰放下时换成 MOM_PUT，放下以后松开
    const w = 1 - fade(t, T.set + 0.02, T.set + 0.18);
    holdBar(pose, MOM_SPEC, x, 0, "L", d, barGripAt(MOM_GRIPS.L, t), w);
    holdBar(pose, MOM_SPEC, x, 0, "R", d, barGripAt(MOM_GRIPS.R, t), w);
    // ③ 拽红线：两只手攥在线上（远处的手在近处那只的上面一点）；后来远处的手去抓铁链、举到她脚踝上
    const hold = fade(t, 19.72, 19.88) * (1 - fade(t, T.drop, T.drop + 0.1));
    if (hold > 0) {
      const G = gripAt(t);
      const A = ankleAt(t);
      const dx = A[0] - G[0];
      const dy = A[1] - G[1];
      const l = Math.hypot(dx, dy) || 1;
      reach(pose, x, "L", [G[0] - 10, G[1] - 6], hold);
      let farHand: V2 = [G[0] + (dx / l) * 34 - 10, G[1] + (dy / l) * 34 - 6];
      if (t > P3 + 0.13) {
        const toChain = E.io(ph(t, P3 + 0.13, T.chain));
        const toLock = E.out(ph(t, T.chain + 0.02, T.lift));
        const C = chainRest();
        const Lk = lockAt(t);
        const a: V2 = [farHand[0] + (C[0] - 6 - farHand[0]) * toChain, farHand[1] + (C[1] - 16 - farHand[1]) * toChain];
        farHand = [a[0] + (Lk[0] - 8 - a[0]) * toLock, a[1] + (Lk[1] - 12 - a[1]) * toLock];
      }
      reach(pose, x, "R", farHand, hold);
    }
    // ④ 走到门口，近处的手推开门（手跟着门扇的锁边走）
    const y = momY(x);
    const push = fade(t, 22.1, 22.17) * (1 - fade(t, T.open1 - 0.02, T.open1 + 0.06));
    if (push > 0) {
      const lx = HOME.door0 + (HOME.door1 - HOME.door0) * Math.cos(doorAngle(t));
      reach(pose, x, "L", [lx + 8, -330], push, y);
    }
    return { pose, x, y };
  };

  // ——— 千斤：漂在红线那头，抱着膝盖，像水里一样慢慢晃；仰头看着白，眼泪往上飘 ———
  const [P1, P2, P3] = T.pulls;
  const qjMove = live(
    [
      { t: 15, x: 0, p: QIANJIN.抱膝 },
      { t: P1 - 0.03, p: QIANJIN.抱膝 },
      // 一把拽下去：拴着的腿一下被扯直，手被甩到头顶；两次之间手慢慢落下来
      { t: P1 + 0.07, ease: "out", p: QIANJIN.被拽 },
      { t: P1 + 0.42, ease: "inOut", p: QIANJIN.被拽_漂 },
      { t: P2 + 0.07, ease: "out", p: QIANJIN.被拽 },
      { t: P2 + 0.42, ease: "inOut", p: QIANJIN.被拽_漂 },
      { t: P3 + 0.07, ease: "out", p: QIANJIN.被拽 },
      // 锁上以后：悬在脚踝上方，抱着自己低着头哭
      { t: T.lock + 0.25, ease: "inOut", p: QIANJIN.悬着 },
      { t: T.end3, p: QIANJIN.悬着 },
      // ④ 看着妈妈松手、转身走开：一只手捂着嘴，一只手朝她伸着；门「嘭」，手缩回来攥在胸口，盯着门
      { t: 21.99, ease: "out", p: QIANJIN.看妈妈 },
      { t: T.slam, p: QIANJIN.看妈妈 },
      { t: T.slam + 0.2, ease: "out", p: QIANJIN.望门 },
      { t: T.dark, p: QIANJIN.望门 },
      // 「火」灯一灭：闭上眼，头垂下去——身子轻了，往上飘；拴着的那条腿被铁链那头的哑铃坠直；红线绷直，被拽住（闭着眼）
      { t: T.dark + 0.18, ease: "inOut", p: QIANJIN.望门_闭眼 },
      { t: T.liftOff + 0.3, ease: "inOut", p: QIANJIN.吊着飘 },
      { t: T.snap, p: QIANJIN.吊着飘 },
      // ⑤ 红线断了：「做」睁开眼低头望着家门，「些」—「么」近处的手朝门伸下去；够不着，手慢慢收回来
      { t: T.look + 0.09, ease: "out", p: QIANJIN.回望 },
      { t: T.reach1, ease: "inOut", p: QIANJIN.回望_伸手 },
      { t: T.back0, p: QIANJIN.回望_伸手 },
      { t: T.back1, ease: "inOut", p: QIANJIN.回望 },
      { t: 30, p: QIANJIN.回望 },
    ],
    {
    look: lookOf(QJ),
    base: { wind: 0.85 },
    idle: true,
    seed: 61,
    springs: LIMP,
    add: (t, o) => {
      const s = (f: number, p: number) => Math.sin(t * f + p);
      o.rot += 4 * s(0.7, 0.4);
      o.lean += 2 * s(0.9, 1.1);
      o.neck += 3 * s(0.8, 2);
      o.shoulderL += 3 * s(1.1, 0.3);
      o.shoulderR += 3 * s(1.0, 2.4);
      o.hipL += 3 * s(0.9, 0.2);
      o.hipR += 3 * s(0.85, 1.7);
      // ④ 门「嘭」：一缩；哑铃离地那一下：分量从脚踝上吃进来，身子一沉一扭
      const fl = kick(t, T.slam, 0.14);
      o.rot -= 5 * fl;
      o.neck -= 10 * fl;
      o.lean += 5 * fl;
      const jl = kick(t, T.liftOff, 0.16);
      o.rot += 6 * jl;
      o.neck -= 8 * jl;
      // 红线绷直：被一把拽住，身子往下一顿、头一甩；绷断：往上一窜
      const jt = kick(t, T.taut, 0.14);
      o.rot += 8 * jt;
      o.neck -= 12 * jt;
      o.lean += 6 * jt;
      const js = kick(t, T.snap, 0.18);
      o.rot -= 6 * js;
      o.neck += 8 * js;
    },
  });
  /** 风把她往右推，红线绷着、慢慢晃 */
  const threadAngle = (t: number) => 0.26 + 0.035 * Math.sin(t * 0.8) + 0.018 * Math.sin(t * 1.9 + 1);
  /** 红线放出去多长：每拽一把收回 PULL_DROP（越拽越快、一下停住，她轻，被拽完还往上弹一点） */
  const threadLen = (t: number) => {
    let L = THREAD;
    for (const P of T.pulls) {
      const a = t - (P - 0.02);
      if (a <= 0) continue;
      L -= PULL_DROP * E.out(Math.min(1, a / 0.14));
      const b2 = a - 0.14;
      if (b2 > 0) L += 24 * (1 - Math.exp(-b2 / 0.06)) * Math.exp(-b2 / 0.3);
    }
    return L;
  };
  const ankle3 = (t: number): V2 => {
    const L = threadLen(t);
    // 越拽越短，风的斜度越小
    const k = Math.max(0, Math.min(1, (L - LEN_END) / (THREAD - LEN_END)));
    const a = ANG_END + (threadAngle(t) - ANG_END) * k;
    return [RING[0] + L * Math.sin(a), RING[1] - L * Math.cos(a)];
  };
  const A4 = ankle3(T.end3);
  /**
   * ④ 飘起来：越飘越快、被风往右带；哑铃离地那一下往下一顿；红线绷直那一下（底鼓）被拽住，往回一弹，悬在那里一下一下往上挣。
   * ⑤ 红线一断往上一窜，然后吊着哑铃慢慢往上飘
   */
  const ankleAt = (t: number): V2 => {
    if (t <= T.end3) return ankle3(t);
    const u = ph(t, T.rise, T.taut);
    const up = RISE_H * Math.pow(u, 1.6);
    const a = t - T.liftOff;
    const jerk = a > 0 ? 22 * (1 - Math.exp(-a / 0.03)) * Math.exp(-a / 0.16) : 0;
    const k = t - T.taut;
    const yank = k > 0 ? 34 * (1 - Math.exp(-k / 0.022)) * Math.exp(-k / 0.1) : 0;
    const tug = k > 0 && t < T.snap ? 5 * Math.max(0, Math.sin((k - 0.12) * 11)) * fade(t, T.taut + 0.12, T.taut + 0.2) : 0;
    const s = t - T.snap;
    const free = s > 0 ? LURCH * E.out(Math.min(1, s / 0.3)) + V5 * s + 0.5 * A5 * s * s : 0;
    const dx = DRIFT * E.io(u) + (s > 0 ? 34 * s : 0);
    return [A4[0] + dx, A4[1] - up + jerk + yank - tug - free];
  };
  const qjAt = (t: number) => {
    const f = qjMove(t);
    const j = castJoints(QJ, f.pose);
    const an = ankleAt(t);
    return { pose: f.pose, x: an[0] - j.ankleL[0], y: an[1] - j.ankleL[1], ankle: an, head: [an[0] - j.ankleL[0] + j.head[0], an[1] - j.ankleL[1] + j.head[1]] as V2 };
  };
  /** 她胸口的位置（镜头往上抬的落点） */
  const qjChest = (t: number): V2 => {
    const q = qjAt(t);
    const j = castJoints(QJ, q.pose);
    return [q.x + (j.shoulderL[0] + j.shoulderR[0]) / 2, q.y + (j.shoulderL[1] + j.shoulderR[1]) / 2 + 40];
  };

  // ——— ④ 哑铃吊在铁链上：她往上飘，铁链一绷，哑铃被拖离地面、在她脚下荡着跟上去（按一个有分量的摆算，开头一次算好） ———
  const bell = (() => {
    const t0 = T.rise;
    const t1 = T.end5 + 0.2;
    const DT = 1 / 240;
    const [gx, gy] = ON_GROUND;
    // 链长：她飘到「底鼓」那一刻正好绷直（之前铁链还搭在铁饼上）
    const La = lockAt(T.liftOff);
    const len = Math.hypot(La[0] - gx, La[1] - gy);
    let x = gx;
    let y = gy;
    let px = x;
    let py = y;
    let lifted = Infinity;
    const rec: number[] = [x, y];
    const steps = Math.ceil((t1 - t0) / DT);
    for (let k = 1; k <= steps; k++) {
      const t = t0 + k * DT;
      // 很沉：荡起来很快就被拽住（横着的速度衰减得快）
      const vx = (x - px) * 0.988;
      const vy = (y - py) * 0.997;
      px = x;
      py = y;
      x += vx;
      y += vy + 2600 * DT * DT;
      // 铁链只拉不推
      const L = lockAt(t);
      const dx = x - L[0];
      const dy = y - L[1];
      const d = Math.hypot(dx, dy);
      if (d > len) {
        x = L[0] + (dx / d) * len;
        y = L[1] + (dy / d) * len;
      }
      // 还在地上：被铁链拖着在地上往她脚下滑，拖到够陡了才离地
      if (y >= gy) {
        y = gy;
        py = gy;
        px = x - (x - px) * 0.97;
      } else if (lifted === Infinity && y < gy - 2) lifted = t;
      if (k % 4 === 0) rec.push(x, y);
    }
    const at = (t: number) => {
      const u = Math.max(0, Math.min(rec.length / 2 - 1, (t - t0) * 60));
      const i = Math.min(rec.length / 2 - 2, Math.floor(u));
      const f = u - i;
      const bx = rec[2 * i] + (rec[2 * i + 2] - rec[2 * i]) * f;
      const by = rec[2 * i + 1] + (rec[2 * i + 3] - rec[2 * i + 1]) * f;
      // 吊起来以后：铁饼随着摆歪一点，慢慢拧过来
      const L = lockAt(t);
      const swing = Math.atan2(bx - L[0], Math.max(1, by - L[1]));
      const hung = t > lifted ? 1 - Math.exp(-(t - lifted) / 0.5) : 0;
      return { x: bx, y: by, phi: 0.3 + 0.6 * hung, rot: -0.35 * swing * Math.min(1, hung * 4) };
    };
    return { at, lifted: () => lifted };
  })();
  /** 铁链（④）：哑铃还在地上时是 ③ 扣上时的样子（从把手搭过铁饼到锁上）；吊起来以后从铁杆中间直直地连到脚踝的锁上 */
  const chain4 = (t: number): V2[] => {
    const L = lockAt(t);
    const d = bigAt(t);
    if (t <= bell.lifted()) {
      const c = Math.cos(d.phi);
      return [[d.x - 40 * c, d.y - 4], [d.x + 106 * c, d.y - 98], L];
    }
    return [[d.x, d.y - 6], L];
  };

  // ——— ④⑤ 红线：妈妈松手以后按一根有分量的细线算（落到地上、被她带起来、绷直拽住她、断开、落下来），开头一次算好 ———
  const thread = (() => {
    const N = 40;
    const t0 = T.end3;
    const t1 = T.end5 + 0.2;
    const DT = 1 / 240;
    // 起点：③ 最后一帧画的样子（铁环 → 地上一堆 → 妈妈手里 → 她的脚踝）
    const G0 = gripAt(t0);
    const A0 = ankleAt(t0);
    const pile: V2 = [(G0[0] + RING[0]) / 2 - 10, Math.max(G0[1], RING[1]) + 70];
    const ctrl: V2 = [(G0[0] + A0[0]) / 2 + 30 + 22 * Math.sin(t0 * 1.7), (G0[1] + A0[1]) / 2];
    const dense: V2[] = [];
    const quad = (p0: V2, p1: V2, p2: V2, skipFirst: boolean) => {
      for (let i = skipFirst ? 1 : 0; i <= 40; i++) {
        const u = i / 40;
        dense.push([(1 - u) * (1 - u) * p0[0] + 2 * u * (1 - u) * p1[0] + u * u * p2[0], (1 - u) * (1 - u) * p0[1] + 2 * u * (1 - u) * p1[1] + u * u * p2[1]]);
      }
    };
    quad(RING, pile, G0, false);
    const gDense = dense.length - 1;
    quad(G0, ctrl, A0, true);
    const cum = [0];
    for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
    const total = cum[cum.length - 1];
    const px = new Float64Array(N);
    const py = new Float64Array(N);
    for (let i = 0, j = 0; i < N; i++) {
      const sTarget = (total * i) / (N - 1);
      while (j < cum.length - 2 && cum[j + 1] < sTarget) j++;
      const f = (sTarget - cum[j]) / (cum[j + 1] - cum[j] || 1);
      px[i] = dense[j][0] + (dense[j + 1][0] - dense[j][0]) * f;
      py[i] = dense[j][1] + (dense[j + 1][1] - dense[j][1]) * f;
    }
    const qx = Float64Array.from(px);
    const qy = Float64Array.from(py);
    const iG = Math.round(((N - 1) * cum[gDense]) / total);
    // 多长：她飘到「绷直」那一下正好拉直（之前多出来的一截堆在地上）
    const Ae = ankleAt(T.taut);
    const r = Math.max(total * 1.1, Math.hypot(Ae[0] - RING[0], Ae[1] - RING[1])) / (N - 1);
    /** 断在离脚踝三节的地方：上面一小截跟着她走，下面一长截弹回去、落下来 */
    const S = N - 4;
    const frames: Float32Array[] = [];
    const record = () => {
      const f = new Float32Array(N * 2);
      for (let i = 0; i < N; i++) {
        f[2 * i] = px[i];
        f[2 * i + 1] = py[i];
      }
      frames.push(f);
    };
    record();
    let snapped = false;
    const steps = Math.ceil((t1 - t0) / DT);
    for (let k = 1; k <= steps; k++) {
      const t = t0 + k * DT;
      if (!snapped && t >= T.snap) {
        snapped = true;
        for (let i = 1; i <= S; i++) {
          const dx = px[i] - px[i - 1];
          const dy = py[i] - py[i - 1];
          const l = Math.hypot(dx, dy) || 1;
          const v = 1500 * Math.pow(i / S, 1.3) * DT;
          qx[i] = px[i] + (dx / l) * v;
          qy[i] = py[i] + (dy / l) * v;
        }
      }
      for (let i = 0; i < N; i++) {
        const vx = (px[i] - qx[i]) * 0.993;
        const vy = (py[i] - qy[i]) * 0.993;
        qx[i] = px[i];
        qy[i] = py[i];
        px[i] += vx + 150 * (0.7 + 0.3 * Math.sin(t * 1.3 + i * 0.2)) * DT * DT;
        py[i] += vy + 2600 * DT * DT;
      }
      const held = t < T.drop;
      const G = held ? gripAt(t) : null;
      const A = ankleAt(t);
      const pinned = (i: number) => i === 0 || i === N - 1 || (held && i === iG);
      const pin = () => {
        px[0] = RING[0];
        py[0] = RING[1];
        px[N - 1] = A[0];
        py[N - 1] = A[1];
        if (G) {
          px[iG] = G[0];
          py[iG] = G[1];
        }
      };
      pin();
      for (let it = 0; it < 14; it++) {
        for (let i = 0; i < N - 1; i++) {
          if (snapped && i === S) continue;
          const dx = px[i + 1] - px[i];
          const dy = py[i + 1] - py[i];
          const d = Math.hypot(dx, dy);
          // 线只拉不推：松着时可以堆起来
          if (d <= r) continue;
          const wa = pinned(i) ? 0 : 1;
          const wb = pinned(i + 1) ? 0 : 1;
          if (wa + wb === 0) continue;
          const f = (d - r) / d / (wa + wb);
          px[i] += dx * f * wa;
          py[i] += dy * f * wa;
          px[i + 1] -= dx * f * wb;
          py[i + 1] -= dy * f * wb;
        }
        pin();
      }
      // 落在地上：贴着地，横着滑不动
      for (let i = 1; i < N - 1; i++) {
        if (py[i] > -2) {
          py[i] = -2;
          qx[i] = px[i] - (px[i] - qx[i]) * 0.4;
          qy[i] = py[i];
        }
      }
      if (k % 4 === 0) record();
    }
    /** 断开的地方（绷断那一刻） */
    const k0 = Math.min(frames.length - 1, Math.round((T.snap - t0) * 60));
    const at: V2 = [frames[k0][2 * S], frames[k0][2 * S + 1]];
    return (t: number): { lower: V2[]; upper: V2[] | null; at: V2 } => {
      const u = Math.max(0, Math.min(frames.length - 1, (t - t0) * 60));
      const i = Math.min(frames.length - 2, Math.floor(u));
      const f = u - i;
      const a = frames[i];
      const b2 = frames[i + 1];
      const pts: V2[] = [];
      for (let n = 0; n < N; n++) pts.push([a[2 * n] + (b2[2 * n] - a[2 * n]) * f, a[2 * n + 1] + (b2[2 * n + 1] - a[2 * n + 1]) * f]);
      if (t < T.snap) return { lower: pts, upper: null, at };
      return { lower: pts.slice(0, S + 1), upper: pts.slice(S + 1), at };
    };
  })();

  /** 眼泪：从眼角冒出来往上飘（这里什么都往上飘） */
  const drawTears = (g: CanvasRenderingContext2D, t: number) => {
    const q = qjAt(t);
    g.save();
    g.fillStyle = "rgba(170,214,240,0.9)";
    for (let i = 0; i < 5; i++) {
      const k = (t * 0.55 + i / 5) % 1;
      g.globalAlpha = Math.min(1, k * 8) * (1 - k) ** 0.8;
      const r = 5.5 + 2.5 * Math.min(1, k * 4);
      g.beginPath();
      g.ellipse(q.head[0] - 20 + (i % 2 ? 14 : -6) + 10 * Math.sin(t * 2 + i) * k, q.head[1] + 6 - k * 260, r * 0.75, r, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  };

  /** 画门口这一场（人这一层，世界坐标）：门脸、铁桩、红线、哑铃、妈妈、千斤 */
  /** 背着门里的光：人先画在一张小画布上压暗（只压人自己），再贴回来（不用 filter：软件渲染时 filter 一帧要一秒） */
  const backlit = document.createElement("canvas");
  const drawBacklit = (g: CanvasRenderingContext2D, k: number, cx: number, draw: (cc: CanvasRenderingContext2D) => void) => {
    if (k <= 0.002) {
      draw(g);
      return;
    }
    const M = g.getTransform();
    // 人在世界里的范围 → 画布上的像素范围
    const corners = [
      [cx - 200, -700],
      [cx + 200, -700],
      [cx - 200, 20],
      [cx + 200, 20],
    ].map(([x, y]) => M.transformPoint(new DOMPoint(x, y)));
    let x0 = Math.floor(Math.min(...corners.map((p) => p.x)));
    let y0 = Math.floor(Math.min(...corners.map((p) => p.y)));
    const x1 = Math.ceil(Math.max(...corners.map((p) => p.x)));
    const y1 = Math.ceil(Math.max(...corners.map((p) => p.y)));
    // 「调整画面」里小画布从画面左上角起：人登记的坐标（骨架手柄）就是画面上的坐标
    if (editing()) x0 = y0 = 0;
    const w = Math.max(1, x1 - x0);
    const h = Math.max(1, y1 - y0);
    if (backlit.width < w || backlit.height < h) {
      backlit.width = Math.max(backlit.width, w);
      backlit.height = Math.max(backlit.height, h);
    }
    const bc = backlit.getContext("2d")!;
    bc.setTransform(1, 0, 0, 1, 0, 0);
    bc.clearRect(0, 0, w, h);
    bc.setTransform(M.a, M.b, M.c, M.d, M.e - x0, M.f - y0);
    draw(bc);
    bc.setTransform(1, 0, 0, 1, 0, 0);
    bc.globalCompositeOperation = "source-atop";
    bc.fillStyle = `rgba(44,26,30,${k})`;
    bc.fillRect(0, 0, w, h);
    bc.globalCompositeOperation = "source-over";
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(backlit, 0, 0, w, h, x0, y0, w, h);
    g.restore();
  };
  /** 妈妈进了门、门还没关上：门扇另画在她前面 */
  const momInside = (t: number) => t >= T.inside && t < T.slam;
  const drawFront = (g: CanvasRenderingContext2D, t: number) => {
    drawHomeFront(g, t, !momInside(t));
  };
  /** 画在妈妈前面的门扇：和墙上那扇一样受光（门灯、楼影子的压暗），门关上那一下接回墙上 */
  const lateDoor = (g: CanvasRenderingContext2D, t: number, base?: DOMMatrix) => {
    const w = HOME.door1 - HOME.door0;
    g.save();
    g.beginPath();
    g.rect(HOME.door0 - 1, HOME.doorTop - 1, w * Math.cos(doorAngle(t)) + 10, -HOME.doorTop - 29);
    g.clip();
    drawDoorPanel(g, t);
    drawLampGlow(g, t);
    if (base) drawShopShade(g, base, t);
    lampLight(g, t);
    g.restore();
  };
  /** 铁链：先搭在哑铃那只铁饼上（一头挂着开着的锁），被她抓起来、举到脚踝上锁住 */
  const chainPath = (t: number, palmR: V2): { pts: V2[]; end: V2; locked: boolean } => {
    const d = { x: ON_GROUND[0], y: ON_GROUND[1], phi: 0.3 };
    const c = Math.cos(d.phi);
    const H0: V2 = [d.x - 40 * c, d.y - 4];
    const top: V2 = [d.x + 106 * c, d.y - 98];
    if (t < T.chain) return { pts: [H0, top, chainRest()], end: chainRest(), locked: false };
    if (t < T.lock) return { pts: [H0, top, palmR], end: palmR, locked: false };
    const L = lockAt(t);
    return { pts: [H0, top, L], end: L, locked: true };
  };
  const drawPeople = (g: CanvasRenderingContext2D, t: number, z: number, base?: DOMMatrix) => {
    const m = momAt(t);
    const d = bigAt(t);
    const q = qjAt(t);
    if (t > T.end3) {
      drawPeople4(g, t, z, base);
      return;
    }
    groundShadow(g, m.x + 18, 130, 0.3);
    groundShadow(g, HOME.post + 16, 70, 0.32);
    if (t >= T.set - 0.05) groundShadow(g, d.x + 18, 150, 0.34);
    drawPost(g);
    const worldM = g.getTransform();
    const big = () => drawDumbbell(g, d.x, d.y, d.phi, d.rot, 1, 3.2 / Math.sqrt(Math.max(0.3, z)));
    if (t >= 19.7) {
      // ③ 她站到哑铃和铁桩中间拽红线：先画她，哑铃在她小腿前面；红线从脚踝下来到她手里，手里多出来的一截垂到地上、拴在铁环上
      drawPerson(g, MOM_SPEC, m.pose, m.x, 0, z);
      big();
      const G = gripAt(t);
      drawThread(g, G, q.ankle, t, 0);
      const pile: V2 = [(G[0] + RING[0]) / 2 - 10, Math.max(G[1], RING[1]) + 70];
      g.save();
      g.lineCap = "round";
      g.strokeStyle = INK;
      g.lineWidth = 6.5;
      g.beginPath();
      g.moveTo(G[0], G[1]);
      g.quadraticCurveTo(pile[0], pile[1], RING[0], RING[1]);
      g.stroke();
      g.strokeStyle = "#d8352b";
      g.lineWidth = 3.6;
      g.stroke();
      g.restore();
      drawPerson(g, QJ, q.pose, q.x, q.y, z);
      // 铁链和锁：画在两个人前面（从哑铃斜着拉到她脚踝上，横过妈妈身前）
      const j = castJoints(MOM_SPEC, m.pose);
      const palm: V2 = [m.x + j.palmR[0], j.palmR[1]];
      const ch = chainPath(t, palm);
      drawChain(g, ch.pts, ch.locked ? q.ankle : undefined);
      const open = 1 - E.out(ph(t, T.lock - 0.03, T.lock + 0.03));
      drawPadlock(g, ch.end[0], ch.end[1] + (ch.locked ? 8 : 4), open, ch.locked ? 0.05 : 0.3);
      drawTears(g, t);
      return;
    }
    if (t < T.set) {
      // 还抱在怀里：画在她的身子和近处那只手臂之间（近处那只压在上面、远处那只的前臂在前面，跟着抓法 MOM_HUG）
      drawPerson(g, MOM_SPEC, m.pose, m.x, 0, z, {
        beforeFrontArms: (cc) => {
          cc.save();
          cc.setTransform(worldM);
          big();
          cc.restore();
        },
      });
    } else {
      big();
      drawPerson(g, MOM_SPEC, m.pose, m.x, 0, z);
    }
    // 红线从铁环拉到她的脚踝（画在她后面：从脚踝绕上去）
    drawThread(g, RING, q.ankle, t);
    drawPerson(g, QJ, q.pose, q.x, q.y, z);
    drawTears(g, t);
  };
  /** ④ 妈妈进门、千斤吊着哑铃飘走 */
  const drawPeople4 = (g: CanvasRenderingContext2D, t: number, z: number, base?: DOMMatrix) => {
    const m = momAt(t);
    const d = bigAt(t);
    const q = qjAt(t);
    const lw = 3.2 / Math.sqrt(Math.max(0.3, z));
    const inside = t >= T.inside;
    if (!inside) groundShadow(g, m.x + 18, 130, 0.3);
    groundShadow(g, HOME.post + 16, 70, 0.32);
    const lift = Math.max(0, Math.min(1, (-BIG_R - d.y) / 260));
    if (lift < 1) groundShadow(g, d.x + 18, 150 * (1 - 0.5 * lift), 0.34 * (1 - lift));
    drawPost(g);
    // 妈妈：在门外照常画；进了门：只画在门洞里（左边被门框挡住），背着门里的光暗下去，门扇画在她前面关上
    if (t < T.slam) {
      if (!inside) drawPerson(g, MOM_SPEC, m.pose, m.x, m.y, z);
      else {
        g.save();
        g.beginPath();
        g.rect(HOME.door0, HOME.doorTop, HOME.door1 - HOME.door0, 400 - HOME.doorTop);
        g.rect(HOME.door1, -4000, 4000, 4400);
        g.clip();
        drawBacklit(g, 0.44 * fade(t, T.inside, T.inside + 0.14), m.x, (cc) => drawPerson(cc, MOM_SPEC, m.pose, m.x, m.y, z));
        g.restore();
        lateDoor(g, t, base);
      }
    }
    // 红线：铁环 → 她的脚踝（断了以后两截）
    const th = thread(t);
    drawThreadPts(g, th.lower);
    if (th.upper) drawThreadPts(g, [q.ankle, ...th.upper.slice(0, -1).reverse()]);
    // 哑铃（地上时在妈妈小腿前面），她，铁链和锁画在她腿前面
    drawDumbbell(g, d.x, d.y, d.phi, d.rot, 1, lw);
    drawPerson(g, QJ, q.pose, q.x, q.y, z);
    drawChain(g, chain4(t), q.ankle);
    const Lk = lockAt(t);
    drawPadlock(g, Lk[0], Lk[1] + 8, 0, 0.05);
    drawTears(g, t);
    // 绷断的那一下：断口一闪，崩出几道短线（画在最上面：断口就在铁链和锁旁边，画在下面会被挡住）
    if (t >= T.snap && t < T.snap + 0.16) {
      const k = 1 - (t - T.snap) / 0.16;
      const [bx, by] = th.at;
      drawGlow(g, bx, by, 90 + 70 * (1 - k), 0.95 * k);
      const burst = new Path2D();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        const r0 = 18 + 40 * (1 - k);
        const r1 = r0 + 34 * k + 12;
        burst.moveTo(bx + Math.cos(a) * r0, by + Math.sin(a) * r0);
        burst.lineTo(bx + Math.cos(a) * r1, by + Math.sin(a) * r1);
      }
      g.save();
      g.lineCap = "round";
      g.strokeStyle = `rgba(58,38,41,${0.55 * k})`;
      g.lineWidth = 7.5;
      g.stroke(burst);
      g.strokeStyle = `rgba(255,246,228,${k})`;
      g.lineWidth = 4;
      g.stroke(burst);
      g.restore();
    }
  };
  /** 镜头跟着她往下坠：追她的胸口，晚一点到（每被拽一把，镜头跟着往下一沉） */
  const chestFollow = smoothTrack(qjChest, 19.9, 23, 11);
  /** ⑤ 镜头跟着她的胸口：红线一断她往上一窜，镜头晚一点被带上去（弹簧，不是死钉在她身上） */
  const chestFollow5 = smoothTrack(qjChest, T.taut, T.end5 + 0.4, 13);
  return { bigAt, momAt, qjAt, qjChest, chestFollow, chestFollow5, lockAt, momChest, ankleAt, drawFront, drawPeople };
}

/** 压暗以后再叠上去的灯：门灯照在台阶和墙上的一团、窗里的光（④ 帘子拉上以后弱下去）、开着的门里漫出来的光 */
export function drawHomeLights(g: CanvasRenderingContext2D, t: number) {
  lampLight(g, t);
  drawGlow(g, (HOME.win0 + HOME.win1) / 2, (HOME.winTop + HOME.winBot) / 2, 230, 0.28 * (1 - 0.6 * curtainShut(t)));
  doorSpill(g, t);
}
/** 门灯照在墙上、台阶上的光（「火」灭了只剩灯丝一点余光） */
function lampLight(g: CanvasRenderingContext2D, t: number) {
  const lx = (HOME.door0 + HOME.door1) / 2;
  const k = t < HOME_T.dark ? lampLevel(t) : 0.2 * filament(t);
  if (k < 0.003) return;
  drawGlow(g, lx, HOME.doorTop - 30, 300, (0.34 + 0.02 * Math.sin(t * 7.3)) * k);
  drawGlow(g, lx + 20, -10, 260, 0.22 * k);
}
/** 门开着：门里的暖光漫到台阶和人行道上；快关上时收成门缝里的一线 */
function doorSpill(g: CanvasRenderingContext2D, t: number) {
  const th = doorAngle(t);
  if (th <= 0) return;
  const w = HOME.door1 - HOME.door0;
  const open = Math.min(1, (1 - Math.cos(th)) * 1.5);
  const x0 = HOME.door0 + w * Math.cos(th);
  const x1 = HOME.door1;
  g.save();
  g.globalCompositeOperation = "lighter";
  const gr = g.createLinearGradient(0, -30, 0, 250);
  gr.addColorStop(0, `rgba(255,186,110,${0.3 * open})`);
  gr.addColorStop(1, "rgba(255,186,110,0)");
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(x0, -30);
  g.lineTo(x1, -30);
  g.lineTo(x1 + 150, 250);
  g.lineTo(x0 - 30, 250);
  g.closePath();
  g.fill();
  if (th < 0.4) {
    const a = 0.5 * Math.sqrt(th / 0.4);
    const cx = (x0 + x1) / 2;
    const line = g.createLinearGradient(cx - 22, 0, cx + 22, 0);
    line.addColorStop(0, "rgba(255,200,130,0)");
    line.addColorStop(0.5, `rgba(255,214,150,${a})`);
    line.addColorStop(1, "rgba(255,200,130,0)");
    g.fillStyle = line;
    g.fillRect(cx - 22, HOME.doorTop, 44, -HOME.doorTop - 30);
  }
  g.restore();
  drawGlow(g, (x0 + x1) / 2, -320, 260, 0.3 * open);
}

/** ④「火」灯灭了：整片暗下去一层（人画在它上面，不被染色） */
export function drawHomeDusk(g: CanvasRenderingContext2D, base: DOMMatrix, t: number) {
  const k = fade(t, HOME_T.dark, HOME_T.dark + 0.12);
  if (k <= 0) return;
  g.save();
  g.setTransform(base);
  g.globalCompositeOperation = "multiply";
  g.fillStyle = `rgba(150,128,168,${0.3 * k})`;
  g.fillRect(0, 0, 1080, 1920);
  g.restore();
}

/** 门口这一场的光：比哑铃店再压一点，镜头停住以后暗角慢慢收紧（窒息）；④ 灯灭以后再暗一层 */
export function homeLook(t: number) {
  const d = fade(t, HOME_T.dark, HOME_T.dark + 0.25);
  // ⑤ 红线一断：憋着的那口气松开，暗角松一点
  const free = fade(t, HOME_T.snap, HOME_T.snap + 0.5);
  // ③「锁」扣上：再收紧一点（关上门）
  const locked = fade(t, HOME_T.lock, HOME_T.lock + 0.3);
  return { vig: 0.24 + 0.1 * fade(t, HOME_T.rise1 - 0.3, HOME_T.end + 0.4) + 0.05 * locked + 0.1 * d - 0.1 * free, warm: 0.7 - 0.04 * locked - 0.1 * d + 0.08 * free };
}

// ——————————————— 镜头 ———————————————
/**
 * 溶过来时：哑铃在画面正中、2.5 倍（和哑铃店最后一帧一模一样）；
 * 她放下哑铃的时候镜头一边退开、一边顺着红线往上抬（柔和起步、匀着走、轻轻停住），
 * 落在一竖条上：下面门口的妈妈和铁桩，红线往上，半空里缩成一团的女儿；之后几乎不动，只极慢地凑近一点（窒息）。
 */
export function homeCam(
  t: number,
  h: { bigAt: (t: number) => { x: number; y: number }; qjChest: (t: number) => V2; chestFollow: (t: number) => V2; chestFollow5: (t: number) => V2; lockAt: (t: number) => V2 },
  /** 溶镜头时上一镜（哑铃店）里那只哑铃在画面上的位置和倍数：这边照着它，两边的哑铃一直叠在一起 */
  match?: (t: number) => { sx: number; sy: number; z: number },
): Cam {
  const T = HOME_T;
  if (t > T.end3) return cam4(t, homeCam(T.end3, h, match), h.chestFollow5);
  let c: Cam;
  if (t <= T.dissolve1) {
    // 溶的时候跟着怀里的哑铃（她站着喘气，哑铃一起一伏）：和哑铃店那一帧的哑铃同一个位置、同样大小（店里的镜头还在往里推）
    const d = h.bigAt(t);
    const m = match?.(t) ?? { sx: 540, sy: 1000, z: 2.5 };
    c = aim(d.x, d.y, m.sx, m.sy, m.z);
  } else {
    // ② 她弯腰放下哑铃：镜头跟着往下落一点（沉）；落地以后顺着红线往上抬，中途退开一点（整根红线、铁桩和她都在画面里），
    // 最后落在半空里的她身上（1.8 倍，她在画面上半截），之后几乎不动、只极慢地凑近
    const d0 = h.bigAt(T.dissolve1);
    const dn = h.bigAt(Math.min(t, T.rise0));
    const sink = E.io(ph(t, T.dissolve1, T.rise0));
    const from: V2 = [d0.x + (dn.x - d0.x) * 0.5 * sink, d0.y + (dn.y - d0.y) * 0.45 * sink];
    const u = E.io(ph(t, T.rise0, T.rise1));
    const q = h.qjChest(Math.min(t, T.rise1));
    let px = from[0] + (q[0] - from[0]) * u;
    let py = from[1] + (q[1] - from[1]) * u;
    let sx = 540 + (560 - 540) * u;
    let sy = 1000 + (900 - 1000) * u;
    const zA = 2.5;
    const zB = 1.8;
    const dip = Math.exp(-0.62 * Math.sin(Math.PI * u));
    let z = zA * Math.pow(zB / zA, u) * dip * (1 + 0.03 * E.soft(ph(t, T.rise1, T.end + 0.5)));
    // ③ 一把一把被拽下来：镜头追着她的胸口往下坠（晚一点到，每一把跟着一沉），一边退开把下面拽线的妈妈收进来；
    // 拽到够得着时落到她脚踝上那把锁上，「锁」一顿
    const [P1, , P3] = T.pulls;
    if (t > P1 - 0.08) {
      const w1 = E.io(ph(t, P1 - 0.08, P1 + 0.25));
      const f = h.chestFollow(t);
      const u3 = E.io(ph(t, P1, P3 + 0.25));
      const z3 = 1.854 * Math.pow(1.45 / 1.854, u3);
      const sy3 = 900 + (820 - 900) * u3;
      let ax = f[0];
      let ay = f[1];
      let bx = 560;
      let by = sy3;
      let zz = z3;
      if (t > P3 + 0.12) {
        const w2 = E.io(ph(t, P3 + 0.12, T.lift));
        const L = h.lockAt(t);
        ax += (L[0] - ax) * w2;
        ay += (L[1] - ay) * w2;
        by += (1010 - by) * w2;
        zz = z3 * Math.pow(1.62 / z3, E.out(ph(t, P3 + 0.15, T.lock)));
      }
      px += (ax - px) * w1;
      py += (ay - py) * w1;
      sx += (bx - sx) * w1;
      sy += (by - sy) * w1;
      z = z * Math.pow(zz / z, w1);
    }
    c = aim(px, py, sx, sy, z);
    for (const P of T.pulls) {
      const k = kick(t, P + 0.03, 0.1);
      c = { ...c, y: c.y + (16 * k) / c.z };
    }
    c = { ...c, z: c.z * (1 + 0.045 * kick(t, T.lock, 0.1)) };
  }
  // 哑铃落地「咚」：画面往下一沉
  const k = kick(t, T.set, 0.1);
  return { ...c, y: c.y - (10 * k) / c.z };
}

/**
 * ④ 锁上以后：跟着走开的妈妈往左移、退开，框住门、铁桩和半空里的她（门「嘭」那一下落定）；之后几乎不动，只极慢地凑近（心酸）。
 * 「火」灯一灭：画面往下一沉、往后退一点、微微歪过去（失望；歪着一直到⑤ 切走）。
 * 哑铃离地、她往上飘：镜头跟着往上抬、往右挪一点（越来越吃力地跟），红线绷直把她拽住的那一下一起停住、一顿；
 * 音乐空掉的那一拍屏住气不动：半空里被拽住的她、脚下吊着的哑铃、斜拉到铁桩的红线、黑了的门口。
 * ⑤ 鼓整套进来、红线一断：憋着的那口气一下松开——镜头被她带着往上一冲（跟着她的胸口，晚一点到），同时一下子往后打开
 * （先快后慢，1.1 → 0.76 倍）；之后漂着慢慢退：她一直在画面上半截，家门口一路沉到画面最下面、越来越小（不舍，离家越来越远）。
 * 2026-10-20 按情绪运镜重做（原来⑤ 是 E.settle 柔和起步、只退到 0.92 倍，红线断了以后两秒多画面几乎不动，和鼓整套进来的那一下对不上）。
 */
function cam4pre(t: number, c0: Cam): Cam {
  const T = HOME_T;
  const F = aim(HX + 505, 0, 540, 1700, 1.2);
  let c = camLerp(c0, F, E.io(ph(t, T.drop - 0.03, T.slam + 0.06)));
  const push = 1 + 0.04 * E.soft(ph(t, T.slam, 23.8));
  c = { ...c, z: c.z * push * (1 + 0.012 * kick(t, T.slam, 0.08)) };
  // 拽住：她在画面右上、红线从她脚踝斜着拉到右下的铁桩，门口在左下，地面在画面最下面
  const HOLD = aim(HX + 665, 0, 540, 1900, 1.1);
  c = camLerp(c, HOLD, E.io(ph(t, T.liftOff - 0.02, T.taut + 0.03)));
  // 屏住气：极慢地凑近一点
  c = { ...c, z: c.z * (1 + 0.012 * E.soft(ph(t, T.taut, T.snap))) };
  // 「火」灯灭：往后退一点、往下一沉（失望）
  const sag = E.out(ph(t, T.dark, T.dark + 0.5));
  return { ...c, z: c.z * (1 - 0.03 * sag), y: c.y - (14 * sag) / c.z };
}
function cam4(t: number, c0: Cam, follow5: (t: number) => V2): Cam {
  const T = HOME_T;
  let c = cam4pre(Math.min(t, T.snap), c0);
  if (t > T.snap) {
    // ⑤ 对准她的胸口（弹簧跟着），只插她在画面上的位置和倍数：一断就往后打开（E.out），她在画面里只往上走、不往下掉
    const C0 = c;
    const p0 = toScreen(C0, ...follow5(T.snap));
    const f = follow5(t);
    const zu = E.out(ph(t, T.snap, T.end5 + 0.3));
    const pu = E.io(ph(t, T.snap, T.end5 + 0.3));
    const z = C0.z * Math.pow(0.76 / C0.z, zu);
    c = aim(f[0], f[1], p0[0] + (560 - p0[0]) * pu, p0[1] + (Math.min(p0[1], 640) - p0[1]) * pu, z);
  }
  c = { ...c, z: c.z * (1 + 0.03 * kick(t, T.taut, 0.1) + 0.03 * kick(t, T.snap, 0.08)) };
  // 灯灭以后画面一直微微歪着（失望 → 离家）
  return { ...c, r: -0.018 * E.out(ph(t, T.dark, T.dark + 0.5)) - 0.012 * E.io(ph(t, T.snap, T.end5 + 0.3)) };
}

/** 门口这一场的抖：哑铃落地、每拽一把、锁扣上；④ 门「嘭」、哑铃被拖离地面、红线绷直；⑤ 红线绷断 */
export function homeShake(t: number) {
  let k = 5 * kick(t, HOME_T.set, 0.08) + 6 * kick(t, HOME_T.lock, 0.08);
  for (const P of HOME_T.pulls) k += 4 * kick(t, P + 0.02, 0.08);
  k += 5 * kick(t, HOME_T.slam, 0.08) + 3 * kick(t, HOME_T.liftOff, 0.07) + 6 * kick(t, HOME_T.taut, 0.07) + 7 * kick(t, HOME_T.snap, 0.08);
  return k;
}
