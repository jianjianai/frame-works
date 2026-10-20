// 第二幕第一镜「反乌托邦中的争夺」：全城最高那栋楼脚下的哑铃店（16.0–18.0）。
// 第一幕停在整座城上，16.0 起镜头顺着最高那栋楼越扎越快地扎下来，16.51 落在店门口（第一幕里画到这里，scenes/act1.ts）；
// 之后第二幕（scenes/act2.ts）接着画。两边用这里同一套东西：店、店门口的人、镜头 shopCam、这一场的光 shopLook。
//
// 店：楼脚下一间老铺面——酱红的招牌「哑铃」、条纹遮阳棚、卷帘门拉上去一半，屋里一盏灯泡，一排排铁架上摆满哑铃，柜台上一台磅秤；
// 门口一个木头展台，铺着红布，摆着最大的那只。门外排着队，每个人都低着头；对面人行道上的人拎着刚买的哑铃回家。
// 戏：千斤的妈妈（紫外套、盘发）和队头的男人同时抓住最大的那只——「争」17.16 他往回一拽，「夺」17.34 她一把夺到怀里，
// 弯着腰抱住；他两手空空，低下头。

import { beatAt } from "@frame/engine/tempo";
import { CAST, type CastSpec, castJoints, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import type { HoldFn, MoveKey, PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { type Cam, E, aim, clamp01, kick, ph, viewOf } from "./cam";
import { INK, TOWER, addEllipse, drawGlow, part, rectPath } from "./world";
import { HAND_FONT } from "./note";
import { groundShadow } from "./props";
import { drawPerson, walkerAt, type Walker } from "./people";
import { ARMS, fade, live } from "./motion";
import { MOM, QUEUE, RIVAL } from "./poses2";

type V2 = [number, number];
const b = beatAt;

/** 这一场的时间（作品的绝对时间） */
export const SHOP_T = {
  /** 第一幕停在整座城上，镜头开始往下扎 */
  dive: b(32),
  /** 扎到店门口（落点冲过一点再回来） */
  land: b(33),
  /** 第二幕从这一刻接着画（落定以后） */
  handoff: b(33) + 0.3,
  /** 她两只手攥住把手 */
  reach: 16.66,
  /** 队头的男人探身出来、抓住另一头 */
  rival: 16.86,
  /** 「争」：他往回一拽 */
  tug: 17.16,
  /** 「夺」：她一把夺到怀里 */
  yank: 17.34,
  /** 下一句「把」17.88，小节线 18.01 */
  end: b(36),
};

// ——————————————— 店（世界坐标，街面 y = 0；在最高那栋楼的一楼，按楼的位置算） ———————————————
const TX = TOWER.x;
export const SHOP = {
  x0: TX + 390,
  x1: TX + 962,
  /** 门脸最上面（招牌上沿） */
  top: -884,
  signBot: -748,
  awnBot: -692,
  door0: TX + 594,
  door1: TX + 944,
  doorTop: -664,
  win0: TX + 412,
  win1: TX + 574,
  winTop: -640,
  winBot: -196,
};
/** 门口的展台（木箱铺红布），最大的那只哑铃摆在上面 */
export const STAND = { x: TX + 610, w: 196, h: 168 };

// ——————————————— 哑铃 ———————————————
/** 一段圆柱：轴上从 s0 到 s1，半径 r；kind 决定颜色 */
type Cyl = [number, number, number, "bar" | "plate" | "plate2" | "collar"];
/** 最大的那只：把手、两层铁饼、卡箍（轴上的长度，单位同人；人 590 高） */
const BIG: Cyl[] = [
  [-64, 64, 14, "bar"],
  [64, 90, 80, "plate2"],
  [90, 128, 95, "plate"],
  [128, 142, 24, "collar"],
  [-90, -64, 80, "plate2"],
  [-128, -90, 95, "plate"],
  [-142, -128, 24, "collar"],
];
/** 一般的哑铃：一层铁饼 */
const SMALL: Cyl[] = [
  [-40, 40, 9, "bar"],
  [40, 64, 34, "plate"],
  [-64, -40, 34, "plate"],
];
export const BIG_R = 95;

const IRON = { side: "#2e2a2f", face: "#46414a", rim: "#5d5762", hub: "#9a948e" };

/**
 * 画一只哑铃：中心 (cx, cy)，轴在画面里先绕竖直方向转 phi（0 = 横着，看见铁饼的侧面；越大越朝着镜头，铁饼看得越圆），
 * 再在画面里歪 rot。s 缩放，lw 描边。
 */
export function drawDumbbell(g: CanvasRenderingContext2D, cx: number, cy: number, phi: number, rot = 0, s = 1, lw = 3, big = true) {
  const parts = big ? BIG : SMALL;
  const c = Math.cos(phi);
  const sn = Math.sin(phi);
  // 远的先画：sin(phi) > 0 时轴的 + 端朝着镜头
  const order = [...parts].sort((a, b2) => (sn >= 0 ? a[0] - b2[0] : b2[0] - a[0]));
  g.save();
  g.translate(cx, cy);
  g.rotate(rot);
  g.scale(s, s);
  g.lineJoin = "round";
  const L = lw / s;
  for (const [s0, s1, r, kind] of order) {
    const xa = s0 * c;
    const xb = s1 * c;
    const x0 = Math.min(xa, xb);
    const x1 = Math.max(xa, xb);
    const rx = Math.max(1.2, r * Math.abs(sn));
    // 侧面（圆柱的身子）：两头的椭圆和中间连起来的一块
    const body = new Path2D();
    body.moveTo(x0, -r);
    body.lineTo(x1, -r);
    body.ellipse(x1, 0, rx, r, 0, -Math.PI / 2, Math.PI / 2);
    body.lineTo(x0, r);
    body.ellipse(x0, 0, rx, r, 0, Math.PI / 2, (Math.PI * 3) / 2);
    body.closePath();
    const sideCol = kind === "bar" ? "#8f8a84" : kind === "collar" ? "#6d6870" : IRON.side;
    g.fillStyle = sideCol;
    g.fill(body);
    // 侧面上面一道亮（太阳在左上）、下面暗一点
    g.save();
    g.clip(body);
    g.fillStyle = kind === "bar" ? "rgba(255,248,236,0.45)" : "rgba(255,240,226,0.16)";
    g.fillRect(x0 - rx, -r, x1 - x0 + rx * 2, r * 0.42);
    g.fillStyle = "rgba(30,20,30,0.25)";
    g.fillRect(x0 - rx, r * 0.45, x1 - x0 + rx * 2, r);
    if (kind === "bar") {
      // 把手上的防滑纹
      g.strokeStyle = "rgba(60,52,56,0.55)";
      g.lineWidth = 2;
      g.beginPath();
      for (let x = x0 + 6; x < x1 - 4; x += 7) {
        g.moveTo(x, -r);
        g.lineTo(x + 5, r);
      }
      g.stroke();
    }
    g.restore();
    g.strokeStyle = INK;
    g.lineWidth = L;
    g.stroke(body);
    // 朝着镜头的那一面（+ 轴那面）：铁饼的圆面、中间的轴套
    const fx = sn >= 0 ? xb : xa;
    if (Math.abs(sn) > 0.05 && kind !== "bar") {
      const face = new Path2D();
      addEllipse(face, fx, 0, rx, r);
      g.fillStyle = kind === "collar" ? "#7d7880" : IRON.face;
      g.fill(face);
      if (kind !== "collar") {
        g.save();
        g.clip(face);
        // 左上被照亮的一块
        g.fillStyle = "rgba(255,236,214,0.13)";
        g.beginPath();
        addEllipse(g, fx - rx * 0.25, -r * 0.3, rx * 0.8, r * 0.7);
        g.fill();
        g.restore();
        // 铁饼的边一圈、轴套
        g.strokeStyle = IRON.rim;
        g.lineWidth = Math.max(1, r * 0.06);
        g.beginPath();
        addEllipse(g, fx, 0, rx * 0.84, r * 0.84);
        g.stroke();
        if (kind === "plate") {
          g.strokeStyle = "rgba(170,60,48,0.85)";
          g.lineWidth = Math.max(1, r * 0.07);
          g.beginPath();
          addEllipse(g, fx, 0, rx * 0.62, r * 0.62);
          g.stroke();
        }
        g.fillStyle = IRON.hub;
        g.beginPath();
        addEllipse(g, fx, 0, Math.max(1, rx * 0.22), r * 0.22);
        g.fill();
        g.fillStyle = "#2a262b";
        g.beginPath();
        addEllipse(g, fx, 0, Math.max(0.6, rx * 0.09), r * 0.09);
        g.fill();
      }
      g.strokeStyle = INK;
      g.lineWidth = L;
      g.stroke(face);
    }
  }
  g.restore();
}

/** 哑铃把手上系着的一张红纸签（被风吹着）：挂在 (x, y) */
function drawTag(g: CanvasRenderingContext2D, x: number, y: number, t: number, lw: number) {
  const sw = 0.25 + 0.12 * Math.sin(t * 2.3) + 0.05 * Math.sin(t * 5.1);
  g.save();
  g.translate(x, y);
  g.strokeStyle = INK;
  g.lineWidth = lw * 0.6;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(Math.sin(sw) * 34, Math.cos(sw) * 34);
  g.stroke();
  g.translate(Math.sin(sw) * 34, Math.cos(sw) * 34);
  g.rotate(-sw * 0.8);
  const p = new Path2D();
  p.roundRect(-15, 0, 30, 46, 4);
  part(g, p, "#c8473a", "#ad3b30", lw * 0.8, [3, 3]);
  g.fillStyle = "#fff3dc";
  g.beginPath();
  g.arc(0, 8, 3, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

// ——————————————— 店面 ———————————————
let SIGN: HTMLCanvasElement | null = null;
/** 招牌上的字只画一次（龙藏体，像刷上去的） */
function signImage() {
  if (SIGN) return SIGN;
  const cv = document.createElement("canvas");
  cv.width = 520;
  cv.height = 160;
  const g = cv.getContext("2d")!;
  g.font = `118px ${HAND_FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#fbefd6";
  g.fillText("哑 铃", 260, 86);
  SIGN = cv;
  return cv;
}

/** 店面（门脸、招牌、遮阳棚、橱窗、门里的屋子）。inside(g) 画在门里（店主、柜台前的人），在门框之前 */
export function drawShopFront(g: CanvasRenderingContext2D, t: number, inside?: (g: CanvasRenderingContext2D) => void) {
  const S = SHOP;
  const lw = 3.2;
  // 门脸：刷成墨绿的木框
  const front = rectPath(S.x0, S.top, S.x1 - S.x0, -S.top + 4);
  part(g, front, "#47665d", "#3d584f", lw, [10, 8]);
  // 门里：暖暖的屋子
  {
    const x = S.door0;
    const w = S.door1 - S.door0;
    const y = S.doorTop;
    g.save();
    g.beginPath();
    g.rect(x, y, w, -y);
    g.clip();
    const room = g.createLinearGradient(0, y, 0, 0);
    room.addColorStop(0, "#7a5440");
    room.addColorStop(0.45, "#a46f4c");
    room.addColorStop(1, "#5e4034");
    g.fillStyle = room;
    g.fillRect(x, y, w, -y);
    // 灯泡照亮的一团
    drawGlow(g, x + w * 0.42, y + 150, 330, 0.75);
    // 后墙上的铁架：三层，摆满一对对哑铃（越往下越大）
    const rows = [
      { y: -470, s: 0.42, n: 7 },
      { y: -330, s: 0.55, n: 6 },
      { y: -175, s: 0.7, n: 5 },
    ];
    for (const r of rows) {
      part(g, rectPath(x + 8, r.y + 30 * r.s + 2, w - 16, 9), "#5a5155", null, lw * 0.6);
      for (let k = 0; k < r.n; k++) {
        const cx = x + 40 + ((w - 80) * (k + 0.5)) / r.n;
        drawDumbbell(g, cx, r.y, 0.55, 0, r.s, lw * 0.7, false);
      }
      // 一张张手写的价签
      for (let k = 0; k < r.n; k += 2) {
        const cx = x + 40 + ((w - 80) * (k + 0.5)) / r.n;
        part(g, rectPath(cx - 12, r.y + 30 * r.s + 12, 24, 15), "#f4ead7", null, lw * 0.5);
      }
    }
    inside?.(g);
    // 吊着的灯泡
    const bx = x + w * 0.42;
    g.strokeStyle = INK;
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(bx, y);
    g.lineTo(bx, y + 120);
    g.stroke();
    g.fillStyle = "#fff4d6";
    g.beginPath();
    g.arc(bx, y + 134, 15, 0, Math.PI * 2);
    g.fill();
    drawGlow(g, bx, y + 134, 110, 0.9);
    g.restore();
    // 卷帘门：拉上去，卷在门楣下面，还垂下来一截
    part(g, rectPath(x - 6, y - 4, w + 12, 30), "#8d8a87", "#77736f", lw, [4, 4]);
    const sh = 52 + 4 * Math.sin(t * 0.7);
    g.fillStyle = "#b7b2ab";
    g.fillRect(x, y + 26, w, sh);
    g.strokeStyle = "rgba(60,50,56,0.4)";
    g.lineWidth = 1.6;
    g.beginPath();
    for (let yy = y + 34; yy < y + 26 + sh; yy += 9) {
      g.moveTo(x, yy);
      g.lineTo(x + w, yy);
    }
    g.stroke();
    g.strokeStyle = INK;
    g.lineWidth = lw * 0.8;
    g.strokeRect(x, y + 26, w, sh);
    g.strokeStyle = INK;
    g.lineWidth = lw;
    g.strokeRect(x, y, w, -y);
  }
  // 橱窗：玻璃后面码着一座哑铃塔
  {
    const x = S.win0;
    const w = S.win1 - S.win0;
    const y = S.winTop;
    const h = S.winBot - S.winTop;
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    const glass = g.createLinearGradient(0, y, 0, y + h);
    glass.addColorStop(0, "#8a6c5c");
    glass.addColorStop(1, "#5b4642");
    g.fillStyle = glass;
    g.fillRect(x, y, w, h);
    drawGlow(g, x + w * 0.5, y + h * 0.55, 200, 0.4);
    const pyr: [number, number][] = [
      [0, 0],
      [1, 0],
      [2, 0],
      [0.5, 1],
      [1.5, 1],
      [1, 2],
    ];
    for (const [i, j] of pyr) drawDumbbell(g, x + 34 + i * 46, y + h - 26 - j * 44, 0.9, 0, 0.36, lw * 0.6, false);
    // 玻璃上的反光
    g.fillStyle = "rgba(255,240,226,0.2)";
    g.beginPath();
    g.moveTo(x + w * 0.1, y + h);
    g.lineTo(x + w * 0.5, y);
    g.lineTo(x + w * 0.72, y);
    g.lineTo(x + w * 0.32, y + h);
    g.closePath();
    g.fill();
    g.restore();
    g.strokeStyle = "#e9dcc4";
    g.lineWidth = lw * 2.2;
    g.strokeRect(x, y, w, h);
    g.strokeStyle = INK;
    g.lineWidth = lw;
    g.strokeRect(x - 3, y - 3, w + 6, h + 6);
    // 橱窗下面的矮墙（瓷砖）
    part(g, rectPath(x - 8, S.winBot + 8, w + 16, -S.winBot - 8), "#cdb9a2", "#b9a48e", lw, [5, 4]);
    g.strokeStyle = "rgba(60,40,50,0.18)";
    g.lineWidth = 1.6;
    g.beginPath();
    for (let yy = S.winBot + 40; yy < 0; yy += 36) {
      g.moveTo(x - 8, yy);
      g.lineTo(x + w + 8, yy);
    }
    g.stroke();
  }
  // 招牌：酱红的板子，米白的字，两头各一只哑铃
  {
    const p = new Path2D();
    p.roundRect(S.x0 + 18, S.top + 8, S.x1 - S.x0 - 36, S.signBot - S.top - 14, 8);
    part(g, p, "#9c3e34", "#86342b", lw, [6, 5]);
    g.strokeStyle = "rgba(251,239,214,0.75)";
    g.lineWidth = 3;
    const inner = new Path2D();
    inner.roundRect(S.x0 + 32, S.top + 20, S.x1 - S.x0 - 64, S.signBot - S.top - 38, 6);
    g.stroke(inner);
    const img = signImage();
    const cx = (S.x0 + S.x1) / 2;
    const cy = (S.top + S.signBot) / 2;
    g.drawImage(img, cx - 175, cy - 54, 350, 108);
    for (const sx of [-1, 1]) {
      const ix = cx + sx * 205;
      g.save();
      g.translate(ix, cy + 2);
      g.rotate(-0.35 * sx);
      g.fillStyle = "#fbefd6";
      g.fillRect(-22, -4, 44, 8);
      for (const k of [-1, 1]) {
        const r1 = new Path2D();
        r1.roundRect(k < 0 ? -32 : 16, -24, 16, 48, 6);
        g.fill(r1);
        const r2 = new Path2D();
        r2.roundRect(k < 0 ? -42 : 32, -15, 10, 30, 4);
        g.fill(r2);
      }
      g.restore();
    }
  }
  // 遮阳棚：酱红和米白的条纹，往外斜出来
  {
    const y0 = S.signBot + 2;
    const aw = new Path2D();
    aw.moveTo(S.x0 - 8, y0);
    aw.lineTo(S.x1 + 8, y0);
    aw.lineTo(S.x1 + 30, S.awnBot);
    aw.lineTo(S.x0 - 30, S.awnBot);
    aw.closePath();
    part(g, aw, "#b0473b", null, lw);
    g.save();
    g.clip(aw);
    g.fillStyle = "rgba(255,246,232,0.85)";
    for (let xx = S.x0 - 30; xx < S.x1 + 30; xx += 52) {
      g.beginPath();
      g.moveTo(xx, y0);
      g.lineTo(xx + 24, y0);
      g.lineTo(xx + 24 + 6, S.awnBot);
      g.lineTo(xx + 6, S.awnBot);
      g.closePath();
      g.fill();
    }
    g.restore();
    // 棚子下沿一排小波浪
    g.beginPath();
    for (let xx = S.x0 - 30; xx < S.x1 + 30; xx += 26) {
      g.moveTo(xx, S.awnBot);
      g.arc(xx + 13, S.awnBot, 13, Math.PI, 0, true);
    }
    g.fillStyle = "#b0473b";
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = lw * 0.8;
    g.stroke();
  }
}

/**
 * 楼影子里的傍晚：楼和街面整体压暗一点、偏一点紫（multiply，越往上越重——头顶是全城最高那栋楼），
 * 然后店里的灯和漫到街上的暖光再亮出来。画在人之前：人不被压暗、不被染色。
 */
export function drawShopShade(g: CanvasRenderingContext2D, base: DOMMatrix, t: number) {
  const k = fade(t, SHOP_T.dive + 0.2, SHOP_T.land + 0.3);
  if (k <= 0.001) return;
  g.save();
  g.setTransform(base);
  g.globalCompositeOperation = "multiply";
  const gr = g.createLinearGradient(0, 0, 0, 1920);
  gr.addColorStop(0, `rgba(146,112,150,${0.36 * k})`);
  gr.addColorStop(0.55, `rgba(184,150,172,${0.26 * k})`);
  gr.addColorStop(1, `rgba(206,178,190,${0.16 * k})`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 1080, 1920);
  g.restore();
}

/** 门里的暖光漫到人行道上、门里那团灯光（压暗以后再叠上去，人画在它上面） */
export function drawShopSpill(g: CanvasRenderingContext2D) {
  drawGlow(g, SHOP.door0 + (SHOP.door1 - SHOP.door0) * 0.42, SHOP.doorTop + 150, 300, 0.32);
  const S = SHOP;
  g.save();
  g.globalCompositeOperation = "lighter";
  const gr = g.createLinearGradient(0, 0, 0, 260);
  gr.addColorStop(0, "rgba(255,186,110,0.28)");
  gr.addColorStop(1, "rgba(255,186,110,0)");
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(S.door0, 0);
  g.lineTo(S.door1, 0);
  g.lineTo(S.door1 + 160, 260);
  g.lineTo(S.door0 - 60, 260);
  g.closePath();
  g.fill();
  g.restore();
}

/** 展台：一只木箱，上面铺着红布（布边垂下来、被风吹得轻轻动） */
export function drawStand(g: CanvasRenderingContext2D, t: number) {
  const { x, w, h } = STAND;
  const lw = 3.2;
  const box = rectPath(x - w / 2, -h, w, h + 4);
  part(g, box, "#b98a5e", "#a27650", lw, [6, 5]);
  g.strokeStyle = "rgba(90,60,40,0.45)";
  g.lineWidth = 2.2;
  g.beginPath();
  for (const k of [0.33, 0.66]) {
    g.moveTo(x - w / 2, -h + h * k);
    g.lineTo(x + w / 2, -h + h * k);
  }
  g.moveTo(x - w / 2 + 12, -h + 8);
  g.lineTo(x + w / 2 - 12, -8);
  g.stroke();
  const sway = 4 * Math.sin(t * 1.7) + 2 * Math.sin(t * 3.1);
  const cloth = new Path2D();
  cloth.moveTo(x - w / 2 - 10, -h - 6);
  cloth.lineTo(x + w / 2 + 10, -h - 6);
  cloth.lineTo(x + w / 2 + 12 + sway * 0.4, -h + 46);
  cloth.quadraticCurveTo(x + w / 4, -h + 36 + sway * 0.3, x, -h + 50);
  cloth.quadraticCurveTo(x - w / 4, -h + 38, x - w / 2 - 12 + sway * 0.4, -h + 44);
  cloth.closePath();
  part(g, cloth, "#c64a3c", "#ab3d31", lw, [5, 4]);
}

// ——————————————— 人 ———————————————
const MOM_SPEC = CAST.千斤的妈妈;
/** 和她抢的男人：队头的路人（蓝外套、短发） */
const RIVAL_SPEC: CastSpec = passerby(5);
const QUEUE_SPECS: CastSpec[] = [passerby(9), passerby(14), passerby(11), passerby(6)];
/** 妈妈、男人站在展台两边 */
const MOM_X = TX + 422;
const RIVAL_X = TX + 906;
/**
 * 排队的人：从门口往右，一个挨一个。店一直在第一幕的世界里（镜头升起来时露出来），队尾不能伸到她走的路上：
 * 原来 5 个人、隔 178，队尾在 TX + 1742，镜头刚开始慢慢升（13.0–13.2）就站在她身边抢视线。
 * 第二幕店里的镜头只看得到队头那一个（TX + 1030 不动）
 */
const QUEUE_X0 = TX + 1030;
const QUEUE_GAP = 145;
/** 店和门口的人在世界里横着占的范围（含遮阳棚、伸出去的手、影子）：画面看不到这一段就不用画 */
export const SHOP_SPAN = { x0: SHOP.x0 - 260, x1: QUEUE_X0 + (QUEUE_SPECS.length - 1) * QUEUE_GAP + 260 };

/** 这一场的人和哑铃：按时间算，第一幕（扎下来那 0.8 秒）和第二幕共用 */
export function makeShop() {
  const T = SHOP_T;
  // ——— 最大的那只哑铃：在展台上 → 「争」被他拽过去一点 → 「夺」被她一把拽到怀里、转过来朝着镜头（不挡她的脸） ———
  const REST: V2 = [STAND.x, -STAND.h - 2 - BIG_R];
  const PHI0 = 0.36;
  const PHI1 = 1.16;
  // 妈妈的动作：伸手 → 攥住 → 往后拽（被拽过去一点）→ 夺 → 抱着、往后退一步
  const momKeys: MoveKey[] = [
    { t: 15.9, x: 0, p: { ...MOM.够, lean: 18, neck: 0 } },
    { t: T.reach, ease: "inOut", p: MOM.够 },
    { t: T.tug - 0.05, ease: "inOut", p: { ...MOM.拽, lean: -6 } },
    // 「争」：被他一下拽过去，往前一个踉跄
    { t: T.tug + 0.1, ease: "out", dx: 26, p: { ...MOM.拽, lean: 14, neck: -4, expression: "吓一跳" } },
    // 站稳、咬牙往后坐
    { t: T.yank - 0.03, ease: "inOut", p: { ...MOM.拽, lean: -12 } },
    { t: T.yank + 0.12, ease: "out", squash: 0.04, dx: -46, p: MOM.夺 },
    { t: T.yank + 0.42, ease: "inOut", squash: 0, dx: -30, p: MOM.抱着 },
    { t: T.yank + 0.75, ease: "inOut", p: { ...MOM.抱着, neck: -20 } },
    { t: T.end + 0.6, ease: "inOut", p: { ...MOM.抱着, neck: -22, lean: 20 } },
  ];
  const momMove = live(momKeys, {
    look: lookOf(MOM_SPEC),
    base: { wind: 0.5 },
    idle: true,
    seed: 21,
    springs: ARMS,
    add: (t, o) => {
      // 抱着那么沉的东西：喘气，肩膀一起一伏
      const k = fade(t, T.yank + 0.3, T.yank + 0.6);
      o.lean += k * 1.6 * Math.sin(t * 7.5);
      o.neck -= k * 1.2 * Math.sin(t * 7.5);
    },
  });
  const rivalKeys: MoveKey[] = [
    { t: 15.9, x: 0, p: QUEUE.站 },
    { t: T.rival - 0.2, p: QUEUE.站 },
    { t: T.rival, ease: "inOut", dx: -40, p: RIVAL.够 },
    { t: T.tug - 0.05, ease: "inOut", p: { ...RIVAL.拽, lean: 4 } },
    // 「争」：他猛地往回一拽
    { t: T.tug + 0.1, ease: "out", dx: 22, p: { ...RIVAL.拽, lean: -14 } },
    { t: T.yank - 0.03, ease: "inOut", dx: -10, p: { ...RIVAL.拽, lean: -2 } },
    { t: T.yank + 0.14, ease: "out", dx: 40, squash: 0.03, p: RIVAL.脱手 },
    { t: T.yank + 0.6, ease: "inOut", squash: 0, p: RIVAL.低头 },
  ];
  const rivalMove = live(rivalKeys, { look: lookOf(RIVAL_SPEC), base: { wind: 0.5 }, idle: true, seed: 22, springs: ARMS });

  // 她夺到以后，哑铃跟着她胸口走（抱在肚子前面、低一点）
  const momRaw = (t: number) => momMove(t);
  const momChest = (t: number): V2 => {
    const f = momRaw(t);
    const j = castJoints(MOM_SPEC, f.pose);
    const x = MOM_X + f.x;
    // 朝右：胸口前面 = 画面右边
    return [x + (j.shoulderL[0] + j.shoulderR[0]) / 2 + 92, j.hip[1] - 58];
  };
  const bigAt = (t: number): { x: number; y: number; phi: number; rot: number } => {
    if (t < T.tug) return { x: REST[0], y: REST[1], phi: PHI0, rot: 0 };
    if (t < T.yank) {
      // 被他往回一拽：在展台上滑过去一点、歪一下
      const u = E.out(ph(t, T.tug, T.tug + 0.12)) - 0.3 * E.io(ph(t, T.tug + 0.12, T.yank));
      return { x: REST[0] + 52 * u, y: REST[1] - 10 * Math.sin(Math.PI * clamp01((t - T.tug) / 0.16)), phi: PHI0, rot: 0.06 * u };
    }
    // 夺：从展台上被一把拽起来，划一道弧落到她怀里，一边转过来
    const u = ph(t, T.yank, T.yank + 0.2);
    const e = E.out(u);
    const from: V2 = [REST[0] + 52 * 0.7, REST[1]];
    const to = momChest(t);
    const lift = -46 * Math.sin(Math.PI * Math.min(1, u * 1.1));
    // 到怀里以后：被抱着，跟着她喘气一起一伏
    const bob = 3 * Math.sin(t * 7.5) * fade(t, T.yank + 0.3, T.yank + 0.6);
    return {
      x: from[0] + (to[0] - from[0]) * e,
      y: from[1] + (to[1] - from[1]) * e + lift + bob,
      phi: PHI0 + (PHI1 - PHI0) * E.io(ph(t, T.yank, T.yank + 0.3)),
      rot: -0.12 * Math.sin(Math.PI * u) + 0.05 * E.out(ph(t, T.yank + 0.2, T.yank + 0.5)),
    };
  };

  /** 把手抓到世界里的某一点：改 pose 的手臂 IK（角色坐标：按身高、胖瘦缩放，朝右的人 x 取反） */
  const reach = (pose: PoseIn, spec: CastSpec, rootX: number, side: "L" | "R", p: V2, w: number) => {
    if (w <= 0) return;
    const k = spec.scale;
    const wd = spec.width ?? 1;
    const mir = (pose.face ?? 0) > 0 ? -1 : 1;
    const local: V2 = [((p[0] - rootX) / (k * wd)) * mir, p[1] / k];
    const key = side === "L" ? "armL" : "armR";
    pose[key] = { ...(pose[key] as object), to: local, ik: Math.min(1, w) };
  };

  // 抓的地方：她两只手在把手靠她这边，他两只手扣在他那头铁饼的上沿
  const momGrip = (t: number): [V2, V2] => {
    const d = bigAt(t);
    const c = Math.cos(d.phi);
    if (t < T.yank + 0.16) {
      return [
        [d.x - 50 * c, d.y - 18],
        [d.x - 16 * c, d.y - 22],
      ];
    }
    // 抱着：近处的手箍在朝着镜头那只铁饼的下沿，远处的手从后面托着
    return [
      [d.x + 70 * c - 10, d.y + 54],
      [d.x - 70 * c - 30, d.y + 6],
    ];
  };
  const rivalGrip = (t: number): [V2, V2] => {
    const d = bigAt(t);
    const c = Math.cos(d.phi);
    return [
      [d.x + 126 * c + 12, d.y - 62],
      [d.x + 138 * c + 20, d.y - 8],
    ];
  };

  const momAt = (t: number) => {
    const f = momRaw(t);
    const pose: PoseIn = { ...f.pose };
    const x = MOM_X + f.x;
    const [gL, gR] = momGrip(t);
    const hold = t < T.yank + 0.12 ? fade(t, T.reach - 0.2, T.reach) : 1;
    // 手掌中心在手腕往指尖 17：IK 给的是手腕，往回收一点
    reach(pose, MOM_SPEC, x, "L", [gL[0] - 6, gL[1] - 14], hold);
    reach(pose, MOM_SPEC, x, "R", [gR[0] - 6, gR[1] - 14], hold);
    return { pose, x };
  };
  const rivalAt = (t: number) => {
    const f = rivalMove(t);
    const pose: PoseIn = { ...f.pose };
    const x = RIVAL_X + f.x;
    const w = fade(t, T.rival - 0.1, T.rival + 0.05) * (1 - fade(t, T.yank + 0.02, T.yank + 0.1));
    const [gL, gR] = rivalGrip(t);
    reach(pose, RIVAL_SPEC, x, "L", [gL[0] + 8, gL[1] - 10], w);
    reach(pose, RIVAL_SPEC, x, "R", [gR[0] + 8, gR[1] - 10], w);
    return { pose, x };
  };

  // ——— 排队的人：门外一字排开、低着头，偶尔挪一步 ———
  const queue = QUEUE_SPECS.map((spec, i) => {
    const x0 = QUEUE_X0 + i * QUEUE_GAP;
    const step = 15.2 + i * 0.37;
    const move = live(
      [
        { t: 15.0, x: 0, p: QUEUE.站 },
        { t: step, p: QUEUE.站 },
        { t: step + 0.6, ease: "inOut", p: { ...QUEUE.站, neck: -27, lean: 9 } },
        { t: 19, p: QUEUE.站 },
      ],
      { look: lookOf(spec), base: { wind: 0.5 }, idle: true, seed: 40 + i, springs: ARMS },
    );
    return { spec, x0, move };
  });
  // 对面人行道上拎着哑铃回家的人（远、小、蒙着空气）
  const walkers: Walker[] = [
    { spec: passerby(3), x0: TX - 130, dir: 1, step: 0.74, t0: 0, seed: 3, wind: 0.5 },
    { spec: passerby(8), x0: TX + 1470, dir: -1, step: 0.8, t0: 0.3, seed: 8, wind: 0.5 },
    { spec: passerby(12), x0: TX + 2170, dir: -1, step: 0.77, t0: 0.1, seed: 12, wind: 0.5 },
  ];
  const WALK_D = 2.2;
  /** 拎在手里的一只哑铃（画在手的后面，跟着人一起缩放、镜像） */
  const smallDumbbellHold: HoldFn = (cc, hand, _mir, info) => {
    if (info.layer !== "back") return;
    const p = hand.p(0, 22);
    drawDumbbell(cc, p[0], p[1] + 8, 0.5, 0, 0.42, 2.4, false);
  };

  /**
   * 画店门口的这一场（人这一层，世界坐标）：门里的人、门脸、展台、哑铃、人。z 是镜头倍数（描边按它调细）。
   * 调用前已经按人这一层设好变换（applyCam(…, 1)）。
   */
  const drawFront = (g: CanvasRenderingContext2D, t: number) => {
    drawShopFront(g, t);
    drawStand(g, t);
  };
  const drawPeople = (g: CanvasRenderingContext2D, t: number, z: number) => {
    // 排队的人（门外，从门口往右排）
    for (const q of queue) {
      const f = q.move(t);
      drawPerson(g, q.spec, f.pose, q.x0 + f.x, 0, z);
    }
    const d = bigAt(t);
    const big = () => {
      // 红纸签系在把手靠远处那只铁饼的一头：抱起来转过来以后藏在近处那只铁饼后面
      drawTag(g, d.x - 42 * Math.cos(d.phi), d.y + 4, t, 3.2);
      drawDumbbell(g, d.x, d.y, d.phi, d.rot, 1, 3.2 / Math.sqrt(Math.max(0.3, z)));
    };
    const m = momAt(t);
    const r = rivalAt(t);
    const worldM = g.getTransform();
    if (t < T.yank) {
      // 还在展台上：先画哑铃，再画两个人（两个人的手扣在上面）
      big();
      drawPerson(g, MOM_SPEC, m.pose, m.x, 0, z);
      drawPerson(g, RIVAL_SPEC, r.pose, r.x, 0, z);
    } else {
      // 夺到怀里：画在她的身子和近处那只手臂之间（近处的手箍在上面，远处的手在后面托着）
      drawPerson(g, RIVAL_SPEC, r.pose, r.x, 0, z);
      drawPerson(g, MOM_SPEC, { ...m.pose, armL: { ...(m.pose.armL as object), chest: "over" } }, m.x, 0, z, {
        beforeFrontArms: (cc) => {
          cc.save();
          cc.setTransform(worldM);
          big();
          cc.restore();
        },
      });
    }
  };
  /** 对面人行道上拎着哑铃的人（画在 D = 2.2 那一层的空气后面） */
  const drawWalkers = (g: CanvasRenderingContext2D, t: number, cam: Cam) => {
    const v = viewOf(cam, WALK_D);
    for (const w of walkers) {
      const s = walkerAt(w, t);
      if (s.x < v.x0 - 200 || s.x > v.x1 + 200) continue;
      drawPerson(g, w.spec, s.pose, s.x, 0, cam.z / WALK_D, { hold: { L: smallDumbbellHold, R: smallDumbbellHold } });
    }
  };
  /** 地上的软影子（太阳在左上，往右偏一点） */
  const drawShadows = (g: CanvasRenderingContext2D, t: number) => {
    groundShadow(g, STAND.x + 24, 150, 0.32);
    for (const q of queue) groundShadow(g, q.x0 + q.move(t).x + 16, 110, 0.26);
    groundShadow(g, MOM_X + momRaw(t).x + 18, 130, 0.3);
    groundShadow(g, RIVAL_X + rivalMove(t).x + 18, 120, 0.3);
  };
  return { bigAt, momAt, rivalAt, momChest, drawFront, drawPeople, drawWalkers, drawShadows, WALK_D };
}

// ——————————————— 镜头 ———————————————
/**
 * 落在店门口以后：先停在门脸上（排队的人、招牌、展台和抢哑铃的两个人都在画面里），线性慢慢往展台推（压抑）；
 * 「争」一惊、「夺」一顿；夺到以后越推越快地扎进她怀里那只哑铃（下一镜从同一只哑铃溶到她家门口）。
 */
export function shopCam(t: number, bigAt: (t: number) => { x: number; y: number }): Cam {
  const T = SHOP_T;
  // 落定的取景：招牌在上面三分之一、地面在画面下面（抖音的字幕区里只有脚），展台在正中
  const u = ph(t, T.land, T.yank);
  // 压抑：线性慢推，1.22 → 1.42，往展台上那只哑铃凑
  const z0 = 1.22 + 0.2 * u;
  let c = aim(STAND.x, -300 + 40 * u, 540, 1154 + 20 * u, z0);
  if (t > T.yank) {
    // 夺到以后：越推越快地扎进她怀里的哑铃（pow 2.2），哑铃停在画面正中
    const d = bigAt(t);
    const w = Math.pow(ph(t, T.yank + 0.05, T.end), 2.2);
    const far = c;
    const near = aim(d.x, d.y, 540, 1000, 2.5);
    const z = far.z * Math.pow(near.z / far.z, w);
    const k = (1 / far.z - 1 / z) / (1 / far.z - 1 / near.z || 1);
    c = { x: far.x + (near.x - far.x) * k, y: far.y + (near.y - far.y) * k, z, r: 0 };
  }
  // 「争」一惊、「夺」一顿
  const jolt = 0.025 * kick(t, T.tug, 0.1) + 0.035 * kick(t, T.yank, 0.12);
  return { ...c, z: c.z * (1 + jolt) };
}

/** 抖：「争」「夺」各一下 */
export function shopShake(t: number) {
  return 5 * kick(t, SHOP_T.tug, 0.08) + 8 * kick(t, SHOP_T.yank, 0.1);
}

/** 这一场的光：比前奏走路那段压一点（暗角收紧、暖光收一点），像楼影子里 */
export function shopLook(t: number) {
  const k = fade(t, SHOP_T.dive + 0.2, SHOP_T.land + 0.4);
  return { vig: 0.02 + 0.2 * k, warm: 0.9 - 0.18 * k };
}
