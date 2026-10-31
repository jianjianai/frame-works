// 终章「这段胡乱拼凑的词语」（104.8–106.02）：第一视角——他低头：脚上是她那双大得不像话的铁靴，
// 她从天上丢下来的那块砖砸在靴尖前面；两只小手伸下去捡起来，捧到眼前：「活下去」，她写给自己的；两滴眼泪砸在字上，手一直在抖；
// 他抬头（105.84）：整个画面带着竖向拖影往下滑走，接她往上升的那一镜。用户 2026-10-25：「⑥ 简化一下，改成捡和看」（不翻、不下笔）。
// 设计坐标 1080×1920，自己画（不是世界里的镜头）；颜色、描边和街上一样。
// B 站横屏：同一张近景按横屏取一块（povFrame）：低头先看见脚下的铁靴和砖，捧起来时视线跟着抬到砖上；地面往两边铺开。

import { COLORS as CHEN_COLORS } from "@materials/剪纸角色/code/chengtuo";
import { E, H as FH, LANDSCAPE, W as FW, ph } from "./cam";
import { INK, part } from "./world";
import { TE, type V2, mix } from "./end_t";
import { drawEndBrick } from "./end_brick";
import { leadBand } from "./leadcoat";

const W = 1080;
const H = 1920;
/** 横屏往两边多画多少（竖屏不多画，画面和原来一模一样） */
const EX = () => (LANDSCAPE ? 1200 : 0);
const SKIN = "#f6d8c4";
const SKIN_SH = "#e7bea6";
const SLEEVE = "#f3efe8";
const SLEEVE_SH = "#ddd6cb";

/** 砖在画面上：落在地上 → 捡起来捧到眼前（中心、宽、转角） */
function brickAt(t: number): { c: V2; w: number; rot: number } {
  const ground = { c: [560, 1010] as V2, w: 250, rot: -0.12 };
  const held = { c: [540, 930] as V2, w: 760, rot: 0.03 };
  const u = E.io(ph(t, TE.grab + 0.04, TE.lift + 0.16));
  const shake: V2 = [2.2 * Math.sin(t * 37), 2.2 * Math.sin(t * 43 + 1)];
  const k = E.io(ph(t, TE.grab, TE.grab + 0.1));
  return {
    c: [ground.c[0] + (held.c[0] - ground.c[0]) * u + shake[0] * k, ground.c[1] + (held.c[1] - ground.c[1]) * u + shake[1] * k],
    w: ground.w * Math.pow(held.w / ground.w, u),
    rot: ground.rot + (held.rot - ground.rot) * u,
  };
}

/** 地面：人行道的地砖往远处收（低头看着脚下），蒙一层空气（焦点在砖上，身后虚一点） */
function drawGround(g: CanvasRenderingContext2D, blur: number) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#c9b39f");
  gr.addColorStop(0.55, "#dcc7b0");
  gr.addColorStop(1, "#e6d3bd");
  g.fillStyle = gr;
  // 横屏取景看得见两边（x −900…1980）：地面、地砖缝、斜光都往两边铺开（竖屏画面里看不见多出来的部分）
  const ex = EX();
  g.fillRect(-ex, 0, W + 2 * ex, H);
  g.strokeStyle = `rgba(90,64,70,${0.22 * (1 - 0.6 * blur)})`;
  g.lineWidth = 3;
  g.beginPath();
  for (let i = 0, y = 120; i < 10; i++) {
    g.moveTo(-ex, y);
    g.lineTo(W + ex, y);
    y += 90 + i * 34;
  }
  const nx = ex ? 9 : 0;
  for (let x = -600 - 210 * nx; x < W + 600 + 210 * nx; x += 210) {
    g.moveTo(540 + (x - 540) * 0.55, 0);
    g.lineTo(540 + (x - 540) * 1.6, H);
  }
  g.stroke();
  // 一道楼缝里漏下来的斜光
  g.fillStyle = `rgba(255,236,206,${0.22 * (1 - blur * 0.5)})`;
  // 斜光：照原来的斜度往两边延长（每 1080 往上 220）
  g.beginPath();
  g.moveTo(-ex, 340 + (220 * ex) / W);
  g.lineTo(W + ex, 120 - (220 * ex) / W);
  g.lineTo(W + ex, 520 - (220 * ex) / W);
  g.lineTo(-ex, 760 + (220 * ex) / W);
  g.closePath();
  g.fill();
}
/** 他妈妈那件外套（脱下来堆在左前方） */
function drawCoatHeap(g: CanvasRenderingContext2D) {
  const p = new Path2D();
  p.moveTo(-40, 700);
  p.quadraticCurveTo(80, 560, 250, 600);
  p.quadraticCurveTo(360, 630, 330, 760);
  p.quadraticCurveTo(250, 860, 60, 840);
  p.quadraticCurveTo(-40, 820, -40, 700);
  p.closePath();
  part(g, p, "#f29a4a", "#de8538", 5, [10, 8]);
  g.save();
  g.clip(p);
  leadBand(g, -60, 806, 420, 30, 20, 1.6);
  g.restore();
}
/** 脚上她的那双铁靴（从上往下看：靴口箍着他的大腿，在画面最底下；靴筒往前斜下去，靴尖在前面）。
 *  原来左边那只靴口插着「妈妈，明天见」；用户 2026-10-26 改成被她抱住那一下就掉了，靴口上不再有 */
function drawBootsFromAbove(g: CanvasRenderingContext2D) {
  const K = CHEN_COLORS;
  for (const [cx, tilt] of [
    [300, -0.16],
    [790, 0.14],
  ] as const) {
    g.save();
    g.translate(cx, 1560);
    g.rotate(tilt);
    g.scale(0.82, 0.82);
    // 鞋底的边：靴尖底下露出一圈
    const sole = new Path2D();
    sole.moveTo(-150, -150);
    sole.quadraticCurveTo(-140, -330, 0, -352);
    sole.quadraticCurveTo(140, -330, 150, -150);
    sole.closePath();
    part(g, sole, K.sole, null, 6);
    // 靴身：从画面底下伸上来，靴尖圆圆的
    const body = new Path2D();
    body.moveTo(-200, 520);
    body.lineTo(-180, 40);
    body.quadraticCurveTo(-160, -250, 0, -300);
    body.quadraticCurveTo(160, -250, 180, 40);
    body.lineTo(200, 520);
    body.closePath();
    part(g, body, K.boot, K.bootShade, 6, [10, 8]);
    // 靴面上的光
    g.fillStyle = "rgba(255,255,255,0.12)";
    g.beginPath();
    g.ellipse(-60, -120, 40, 120, -0.1, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = K.rust;
    for (const [x, y, rx, ry] of [
      [-90, -60, 30, 20],
      [70, 60, 24, 34],
      [-40, 200, 36, 22],
      [100, -170, 20, 14],
    ]) {
      g.beginPath();
      g.ellipse(x, y, rx, ry, 0.4, 0, Math.PI * 2);
      g.fill();
    }
    // 麻绳绑了两道
    g.strokeStyle = K.rope;
    g.lineWidth = 10;
    g.beginPath();
    g.moveTo(-182, 120);
    g.quadraticCurveTo(0, 150, 182, 120);
    g.moveTo(-178, 240);
    g.quadraticCurveTo(0, 270, 178, 240);
    g.stroke();
    g.fillStyle = K.rivet;
    for (const [x, y] of [
      [-150, 20],
      [150, 20],
      [-160, 320],
      [160, 320],
      [-120, -150],
      [120, -150],
    ]) {
      g.beginPath();
      g.arc(x, y, 9, 0, Math.PI * 2);
      g.fill();
    }
    // 靴口（大腿在里面）
    const rim = new Path2D();
    rim.ellipse(0, 450, 215, 90, 0, 0, Math.PI * 2);
    part(g, rim, K.bootRim, K.bootShade, 6, [6, 6]);
    const leg = new Path2D();
    leg.ellipse(0, 470, 160, 70, 0, 0, Math.PI * 2);
    part(g, leg, "#4f5f86", "#435276", 5, [4, 4]);
    g.restore();
  }
}
/** 一只小手和前臂：从画面底下伸上来，圆圆的手压在砖的一头上 */
function drawHand(g: CanvasRenderingContext2D, from: V2, hand: V2) {
  const dx = hand[0] - from[0];
  const dy = hand[1] - from[1];
  const len = Math.hypot(dx, dy);
  const a = Math.atan2(dy, dx);
  g.save();
  g.translate(from[0], from[1]);
  g.rotate(a);
  // 袖子（前臂）：近粗远细
  const arm = new Path2D();
  arm.moveTo(0, -90);
  arm.lineTo(len - 90, -46);
  arm.lineTo(len - 90, 46);
  arm.lineTo(0, 90);
  arm.closePath();
  part(g, arm, SLEEVE, SLEEVE_SH, 6, [8, 6]);
  // 手腕
  const wrist = new Path2D();
  wrist.moveTo(len - 100, -40);
  wrist.lineTo(len - 40, -40);
  wrist.lineTo(len - 40, 40);
  wrist.lineTo(len - 100, 40);
  wrist.closePath();
  part(g, wrist, SKIN, SKIN_SH, 5, [4, 4]);
  // 手：不画手指，一个描边的肤色圆压在砖的一头上（用户 2026-10-30，1:45.46：「这里就不画手指了，用圆圈代替就行」）
  const fist = new Path2D();
  fist.arc(len, 0, 60, 0, Math.PI * 2);
  part(g, fist, SKIN, SKIN_SH, 5, [5, 5]);
  g.restore();
}
/** 两滴眼泪：从画面上面（他的脸）掉下来，砸在字上洇开 */
function drawTears(g: CanvasRenderingContext2D, t: number, b: { c: V2; w: number; rot: number }) {
  const k = b.w / 116;
  TE.tears.forEach((tt, i) => {
    const hit: V2 = [b.c[0] + (i === 0 ? -0.28 : 0.2) * b.w, b.c[1] + (i === 0 ? 0.02 : -0.05) * b.w];
    const fall = 0.26;
    const u = (t - (tt - fall)) / fall;
    if (u > 0 && u < 1) {
      const p: V2 = [hit[0] + (i === 0 ? 30 : -24) * (1 - u), -60 + (hit[1] + 60) * u * u];
      const s = 13 + 8 * u;
      g.save();
      g.fillStyle = "rgba(226,240,255,0.95)";
      g.strokeStyle = "rgba(110,130,185,0.85)";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(p[0], p[1] - s * 1.7);
      g.quadraticCurveTo(p[0] + s * 1.05, p[1] + s * 0.1, p[0], p[1] + s);
      g.quadraticCurveTo(p[0] - s * 1.05, p[1] + s * 0.1, p[0], p[1] - s * 1.7);
      g.fill();
      g.stroke();
      g.restore();
    }
    const d = t - tt;
    if (d >= 0) {
      if (d < 0.18) {
        const v = d / 0.18;
        g.save();
        g.fillStyle = `rgba(226,240,255,${0.85 * (1 - v)})`;
        for (let n = 0; n < 6; n++) {
          const a = -Math.PI * (0.05 + 0.18 * n);
          g.beginPath();
          g.arc(hit[0] + Math.cos(a) * 60 * v, hit[1] + Math.sin(a) * 30 * v, 5 * (1 - v) + 2, 0, Math.PI * 2);
          g.fill();
        }
        g.restore();
      }
      // 湿印：洇开，留在砖上
      const w = E.out(Math.min(1, d / 0.35));
      g.save();
      g.translate(hit[0], hit[1]);
      g.rotate(b.rot);
      g.fillStyle = "rgba(70,60,100,0.24)";
      g.beginPath();
      g.ellipse(0, 0, (3 + 7 * w) * k, (2 + 4 * w) * k, 0.2, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  });
}

/**
 * 横屏取景：这张竖着画的近景缩到 s 倍，竖着的 cy 放在横屏画面正中（横着 540 在正中）。
 * 低头时看脚下（铁靴的靴尖、砖、外套都在画面里），捧起来时视线跟着砖往上抬，砖在画面中间偏上一点
 */
function povFrame(base: DOMMatrix, t: number): DOMMatrix {
  if (!LANDSCAPE) return base;
  const s = 0.74;
  const up = E.io(ph(t, TE.grab + 0.02, TE.lift + 0.22));
  const cy = 1165 + (1010 - 1165) * up;
  return base.translate(FW / 2, FH / 2).scale(s, s).translate(-540, -cy);
}

/** 画第一视角（base 是设计坐标到画布像素的缩放）；slide：抬头时整个画面往下滑走多少（像素） */
export function drawPov(g: CanvasRenderingContext2D, base0: DOMMatrix, t: number) {
  const base = povFrame(base0, t);
  const slide = 2200 * E.in2(ph(t, TE.lookUp, TE.smile));
  const blur = E.io(ph(t, TE.grab, TE.lift + 0.1));
  g.setTransform(base);
  g.translate(0, slide);
  // 低头：画面先往下沉一点（他的头低下去）
  const bow = 60 * E.out(ph(t, TE.pov, TE.pov + 0.3)) - 30 * blur;
  g.translate(0, -bow);
  drawGround(g, blur);
  drawCoatHeap(g);
  drawBootsFromAbove(g);
  // 焦点在砖上：地面、靴子蒙一层空气（虚一点）
  if (blur > 0.01) {
    g.fillStyle = `rgba(232,214,198,${0.4 * blur})`;
    g.fillRect(-100 - EX(), -100 - slide, W + 200 + 2 * EX(), H + 400);
  }
  const b = brickAt(t);
  // 砖（「活下去」朝上：她写给自己的那块）
  drawEndBrick(g, "her", b.c, b.rot, b.w / 116, -1, 0, Math.max(1, b.w / 116 / 2.4));
  drawTears(g, t, b);
  // 两只手：伸下去、攥住两头、捧上来
  const reach = E.io(ph(t, TE.pov + 0.08, TE.grab));
  if (reach > 0) {
    const cs = Math.cos(b.rot);
    const sn = Math.sin(b.rot);
    const endL: V2 = [b.c[0] - (b.w / 2) * cs - 6, b.c[1] - (b.w / 2) * sn];
    const endR: V2 = [b.c[0] + (b.w / 2) * cs + 6, b.c[1] + (b.w / 2) * sn];
    const fromL: V2 = mix([80, 2100], [120, 1950], blur);
    const fromR: V2 = mix([1000, 2100], [960, 1950], blur);
    const handL = mix([150, 1950], endL, reach);
    const handR = mix([930, 1950], endR, reach);
    drawHand(g, fromL, handL);
    drawHand(g, fromR, handR);
  }
  // 暗角、暖光
  g.setTransform(base);
  const v = g.createRadialGradient(540, 900, 420, 540, 900, 1250);
  v.addColorStop(0, "rgba(60,40,44,0)");
  v.addColorStop(1, "rgba(60,40,44,0.32)");
  g.fillStyle = v;
  if (LANDSCAPE) g.fillRect(-EX(), -600, W + 2 * EX(), H + 1200);
  else g.fillRect(0, 0, W, H);
  void INK;
}
