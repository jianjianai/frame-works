// 第二幕（16.43 – 32.79）· 副歌1（重置版：剧情和时间点不变，画面、镜头、光影按最新标准重做）
//  A 16.43–21.54 关灯后的黑屋子里只有手机：按拍翻她的相册 → 停在向日葵头像（pretty）→ 屏幕熄灭，他的倒影浮在她脸的位置（ugly）→ 低头
//  B 21.54–24.61 倒影的脸亮成他流泪的脸 → 镜头穿过他的眼睛 → 手机：聚光在「嗯」上，「对方正在输入…」闪两次（黄圈给观众）→ 沉进「嗯」
//  C 24.61–26.40 一下划掉关机 → 被子蒙过头（月光）→ 被子里流泪
//  D 26.40–28.10 一镜：退出他的窗 → 唱到 me 灯灭 → 甩过街 → 推进她亮着彩灯的窗
//  E 28.10–29.72 穿过玻璃：她也在哭，镜头一路慢推到她的脸，背景虚化、四周压暗
//  F 29.72–32.79 她的手机：整段话；拇指按住「发送」不松 → 划回主页（草莓牛奶壁纸）
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase, smooth } from "@frame/engine/math";
import { C, Ctx, H, Pt, W, blob, bloom, camera, card, designScene, easeOut, fillBg, filtered, glow, hash, inkLine, litFigure, oval, paint, pulse, rr, sinceBeat, vgrad } from "@materials/s0rrow/code/draw";
import { drawKid } from "@materials/s0rrow/code/kid";
import { WECHAT_AT, appWindow, chatScreen2, powerOffScreen, profileScreen, sendButtonAt } from "@materials/s0rrow/code/chat";
import type { FingerPos } from "@materials/s0rrow/code/hand";
import { SH, SW } from "@materials/s0rrow/code/phone";
import { GIVE_UP, HER_NIGHT_DRAFT, HER_PHOTOS, HIM, HISTORY, REST_R, fromHer, herHome, hisNightChat, inWin } from "./story";
import { BAR, EV, beatAt } from "./timeline";
import { PhoneSpec, clueGlow, drawPhone, lerp, pulseRings, touchDot, vignette } from "./shots";
import { HER_F0, HER_M0, HER_SIT, HER_WIN, HIS_F0, HIS_M0, HIS_WIN, SIT, Z_IN, hisBokeh, herBokeh, herDuvet, herInBed, herPhoneBack, herRoomNight, hisPhoneBack, hisRoomCurled, nightStreet, winC } from "./world";

// ---------------------------------------------------------------- A · pretty / ugly
/** he flicks through her album on the beat (16.94 / 17.45 / 17.96) and stops on her sunflower portrait for "pretty" */
const FLICKS = [beatAt(33), beatAt(34), beatAt(35)];
const FLICK = 0.22;
/** In the dark room (the lamp went off at 16.17) the phone is the only light. Her photos, one after another, then her
 *  sunny portrait; the screen times out and his own face surfaces in the black glass exactly where hers was (match
 *  dissolve). On "ugly" a slow push, a glare sliding over his face, the edges closing in; then he can't hold his own
 *  gaze — eyes and head go down. */
function shotPretty(c: Ctx, abs: number) {
  const album = FLICKS.reduce((n, t) => n + smooth(phase(abs, t, t + FLICK)), 0);
  const flick = FLICKS.find((t) => abs > t - 0.05 && abs < t + FLICK + 0.02);
  const thumb: FingerPos = flick === undefined ? { ...REST_R, touch: 0 } : { x: lerp(470, 130, smooth(phase(abs, flick, flick + FLICK))), y: 560, touch: 1 };
  const out = smooth(phase(abs, 19.33, 19.75));
  const refl = abs < 19.4 ? 0 : 0.36 * smooth(phase(abs, 19.4, 19.9)) + 0.3 * smooth(phase(abs, 20.15, 20.6));
  const push = smooth(phase(abs, 19.8, EV.uglyEnd));
  const gaze = smooth(phase(abs, FLICKS[2] + FLICK, 19.33));
  const s = 1.2 + 0.06 * gaze + 0.19 * push;
  const ay = 805 + 45 * push; // where both faces sit on the frame (face at screen 300, 470)
  const cy = abs < 19.62 ? 1150 - 138 * smooth(phase(abs, 19.32, 19.62)) : ay + 170 * s;
  const avert = smooth(phase(abs, 20.55, 20.9)); // on "ugly"
  // the phone comes up into frame (he has just picked it up again in the dark), slowing as it arrives
  const rise = 1 - easeOut(phase(abs, BAR(8), BAR(8) + 0.3));
  const p: PhoneSpec = { cx: 540, cy: cy + 520 * rise * rise, s, rot: -0.02 + 0.04 * rise };
  hisBokeh(c, abs, { dark: 0.85, shift: [0, (cy - 1000) * 0.15 + 160 * rise] });
  drawPhone(c, abs, p, (k) => {
    if (out < 1) profileScreen(k, abs, { photos: HER_PHOTOS, at: album });
    if (out > 0) {
      k.fillStyle = `rgba(5,5,8,${out.toFixed(3)})`;
      k.fillRect(0, 0, SW, SH);
    }
    if (refl > 0) {
      // his reflection, whole (drawn into a buffer and laid over at once, so nothing shows through it)
      filtered(k, "grayscale(0.8) brightness(0.8)", (b) => {
        drawKid(b, SW / 2, 470, 1.15, {
          body: "bust",
          eyes: "sad",
          brows: avert > 0.5 ? "sad" : "worried",
          mouth: avert > 0.5 ? "frown" : "flat",
          look: [0, -0.1 + 1.0 * avert],
          headY: 14 * avert,
        });
        // below the chest he fades into the dark glass
        b.save();
        b.globalCompositeOperation = "destination-out";
        const g = b.createLinearGradient(0, 690, 0, 880);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, "rgba(0,0,0,1)");
        b.fillStyle = g;
        b.fillRect(0, 700, SW, 600);
        b.restore();
      }, "refl", refl);
      const gx = -320 + 760 * phase(abs, 19.6, EV.uglyEnd);
      k.fillStyle = "rgba(255,255,255,0.07)";
      k.beginPath();
      k.moveTo(gx + 160, 0);
      k.lineTo(gx + 300, 0);
      k.lineTo(gx + 40, SH);
      k.lineTo(gx - 100, SH);
      k.fill();
    }
    if (out > 0) {
      // the black glass: a soft sheen and the moonlit window mirrored in the corner
      const sheen = k.createLinearGradient(0, 0, SW * 0.7, SH * 0.45);
      sheen.addColorStop(0, `rgba(255,255,255,${(0.09 * out).toFixed(3)})`);
      sheen.addColorStop(1, "rgba(255,255,255,0)");
      k.fillStyle = sheen;
      k.fillRect(0, 0, SW, SH);
      k.strokeStyle = `rgba(170,190,255,${(0.16 * out).toFixed(3)})`;
      k.lineWidth = 6;
      k.strokeRect(430, 70, 120, 170);
      k.beginPath();
      k.moveTo(490, 70);
      k.lineTo(490, 240);
      k.moveTo(430, 150);
      k.lineTo(550, 150);
      k.stroke();
    }
  }, { thumbs: [thumb], halo: 1 - 0.75 * out, glare: 40 });
  // the room closes in round him
  vignette(c, 0.3 + 0.4 * smooth(phase(abs, 19.9, EV.uglyEnd)), 540, 860, 280, 1050);
}

// ---------------------------------------------------------------- B · his tears → through his eye → her 「嗯」
const T2 = [beatAt(42), beatAt(44), BAR(12)];
/** the camera sinks into her 「嗯」 from the beat the second 「对方正在输入...」 ends on */
const DIVE = [beatAt(46), 24.5];
/** his eyes relative to drawKid's head centre at s = 1 */
const EYE_DX = 52,
  EYE_DY = 36;
const EYE_DIVE = beatAt(43);

/** his phone at night, her 「嗯」 (screen 145, 948) held at (ux, uy) under a spotlight that closes to darkness `dk`; it
 *  glows cold on every beat and sends out a thin white ring (what he's staring at); the clue he misses — 「对方正在输入...」
 *  in the title bar — gets the film's yellow pulse, for us. */
function typingPhone(c: Ctx, abs: number, dk: number, zs: number, rot: number, ux = 390, uy = 1182) {
  const typing = inWin(abs, EV.typingA) || inWin(abs, EV.typingB);
  const cos = Math.cos(rot),
    sin = Math.sin(rot);
  const at = (x: number, y: number): Pt => {
    const dx = (x - 300) * zs,
      dy = (y - 640) * zs;
    return [dx * cos - dy * sin, dx * sin + dy * cos];
  };
  const [ox, oy] = at(145, 948);
  const zx = ux - ox,
    zy = uy - oy;
  hisBokeh(c, abs, { dark: 0.9 });
  drawPhone(c, abs, { cx: zx, cy: zy, s: zs, rot }, (k) => chatScreen2(k, abs, hisNightChat(abs, { typing })), { halo: 1 - dk * 0.6 });
  const r0 = (110 - 64 * dk) * zs;
  const g = c.createRadialGradient(ux, uy, r0, ux, uy, r0 + 650 - 490 * dk);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${(0.4 + 0.58 * dk).toFixed(3)})`);
  c.fillStyle = g;
  c.fillRect(-60, -60, W + 120, H + 120);
  const beat = pulse(abs, 6);
  c.save();
  c.globalCompositeOperation = "lighter";
  glow(c, ux, uy, 120 * zs, `rgba(150,180,255,${(0.16 + 0.2 * beat).toFixed(3)})`);
  c.restore();
  const k = sinceBeat(abs) / 0.5;
  if (k < 1) {
    c.save();
    c.globalAlpha = 0.55 * (1 - k);
    c.strokeStyle = "#e8eeff";
    c.lineWidth = 4;
    c.beginPath();
    c.ellipse(ux, uy, (52 + 46 * k) * zs, (40 + 36 * k) * zs, rot, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
  const [qx, qy] = at(300, 120);
  const tx = zx + qx,
    ty = zy + qy;
  const on = Math.max(...[EV.typingA, EV.typingB].map((w) => smooth(phase(abs, w[0], w[0] + 0.1)) * (1 - smooth(phase(abs, w[1], w[1] + 0.1)))));
  clueGlow(c, tx, ty, 220 * zs, on);
  pulseRings(c, abs, tx, ty, 150 * zs, 40 * zs, [EV.typingA[0] + 0.02, EV.typingA[0] + 0.2, EV.typingB[0] + 0.02, EV.typingB[0] + 0.2], rot);
}
/** 22.56 → 24.61 her 「嗯」 under the spotlight, the clue flickering twice; then the camera sinks into it */
function umDive(c: Ctx, abs: number) {
  const d = smooth(phase(abs, DIVE[0], DIVE[1]));
  const zs = Math.exp(Math.log(1.02) + (Math.log(6) - Math.log(1.02)) * d);
  const dk = Math.min(0.98, 0.5 + 0.45 * smooth(phase(abs, T2[1], DIVE[0])) + 0.03 * d);
  typingPhone(c, abs, dk, zs, -0.03 * (1 - d), 390 + (540 - 390) * d, 1182 + (880 - 1182) * d);
}
/** 21.54 → 22.56: the black glass lights up (he's touched it): the reflected face becomes his face, lit by the screen
 *  — nothing came. He cries; the camera moves in to his eyes, then on through one of them: what's reflected in his
 *  pupils is the real picture of his phone (9:16, framed like the frame), and it grows until it IS the picture. */
function hisTears(c: Ctx, abs: number) {
  const S = 1.25;
  const eyeY = 860 + EYE_DY * S;
  const rh = 11 * S,
    rw = (rh * 9) / 16,
    ry = eyeY + 3 * S;
  const rx = (side: number) => 540 + (side * EYE_DX + 3) * S;
  const into = smooth(phase(abs, T2[0] + 0.15, EYE_DIVE));
  const u = phase(abs, EYE_DIVE, T2[1]);
  const zEnd = 1920 / rh;
  const z = u > 0 ? Math.exp(Math.log(3.3) + (Math.log(zEnd) - Math.log(3.3)) * smooth(u)) : Math.exp(Math.log(1.3) + (Math.log(3.3) - Math.log(1.3)) * into);
  const k = smooth(clamp(u / 0.6));
  const fx = 540 + (rx(1) - 540) * k,
    fy = (860 + (eyeY - 860) * into) * (1 - k) + ry * k;
  const ay = 900 + 60 * smooth(u);
  // the dark room behind him: the moonlit window, out of focus, sliding away as we go in
  hisBokeh(c, abs, { dark: 0.9, zoom: 1 + 0.6 * into + 3 * smooth(u) });
  c.save();
  c.translate(540, ay);
  c.scale(z, z);
  c.translate(-fx, -fy);
  const tears = 0.45 + 0.55 * smooth(phase(abs, T2[0], T2[0] + 0.6));
  litFigure(c, (q) => drawKid(q, 540, 860, S, { body: "bust", eyes: "teary", brows: "sad", mouth: "wobble", look: [0, 0.85], tears, arms: "custom", handL: [-52, 340], handR: [52, 340], shapeL: "hold", shapeR: "hold", thumbFlip: true, grip: (k) => hisPhoneBack(k, 0, 280, 92, 176, 0) }), {
    shade: 0.34,
    shadeCol: "rgb(10,12,34)",
    lights: [{ x: 540, y: 1180, r: 460, rgb: "160,190,255", a: 0.36 }],
    rim: { ux: 1, uy: -0.4, rgb: "160,185,255", a: 0.45 },
  });
  for (const side of [-1, 1]) {
    const x0 = rx(side) - rw / 2,
      y0 = ry - rh / 2;
    c.save();
    rr(c, x0, y0, rw, rh, 1.6 * S * (1 - smooth(u)));
    c.clip();
    c.translate(x0, y0);
    c.scale(rw / W, rh / H);
    umDive(c, abs);
    c.fillStyle = `rgba(150,180,255,${(0.35 * (1 - smooth(u))).toFixed(3)})`;
    c.fillRect(0, 0, W, H);
    c.restore();
  }
  c.restore();
  // the screen's cold light from below, the dark closing round his face; gone as we go through
  const a = 1 - smooth(u);
  if (a > 0) {
    c.save();
    c.globalAlpha = a;
    vignette(c, 0.85, 540, 900, 260, 950);
    c.restore();
  }
  // the moment the glass lights up: a cold flash
  const flash = 1 - phase(abs, T2[0], T2[0] + 0.25);
  if (flash > 0) {
    c.fillStyle = `rgba(190,210,255,${(0.25 * flash * flash).toFixed(3)})`;
    c.fillRect(-60, -60, W + 120, H + 120);
  }
}
function shotTyping(c: Ctx, abs: number) {
  if (abs < T2[1]) hisTears(c, abs);
  else umDive(c, abs);
}

// ---------------------------------------------------------------- C · power off → the duvet over his head → under it
/** his pillow and duvet in the moonlight, seen from just above the pillow */
function pillowShot(c: Ctx, abs: number, cover: number) {
  fillBg(c, vgrad(c, 0, H, [[0, "#0d1128"], [1, "#070914"]]));
  c.save();
  camera(c, 540, 820, 1.04 + 0.03 * cover);
  blob(c, [[150, 700], [930, 680], [980, 1020], [110, 1040]], 3700, 2);
  paint(c, "#bcc6dc", C.ink, 6);
  litFigure(c, (q) => drawKid(q, 540, 800, 1.1, { body: "head", eyes: "sad", look: [0, -0.4], mouth: "frown", tears: 0.3 }), {
    shade: 0.45,
    shadeCol: "rgb(10,12,34)",
    rim: { ux: 1, uy: -0.6, rgb: "170,190,255", a: 0.55 },
  });
  const top = lerp(980, 500, cover);
  blob(c, [[-80, top + 30], [300, top - 20], [780, top - 10], [1160, top + 40], [1160, 2000], [-80, 2000]], 3710, 3);
  paint(c, vgrad(c, top, top + 900, [[0, "#4a5f8f"], [1, "#2a3858"]]), C.ink, 7);
  c.save();
  blob(c, [[-80, top + 30], [300, top - 20], [780, top - 10], [1160, top + 40], [1160, 2000], [-80, 2000]], 3710, 3);
  c.clip();
  for (let i = 0; i < 14; i++) {
    const sx = -40 + hash(i * 3.1 + 7) * 1160,
      sy = top + 60 + hash(i * 4.7 + 3) * 700;
    c.fillStyle = "rgba(230,236,255,0.45)";
    c.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2,
        r = k % 2 ? 5 : 12;
      c.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
    }
    c.fill();
  }
  inkLine(c, [[100, top + 120], [400, top + 80], [700, top + 140]], 3711, 4, "rgba(20,28,60,0.5)");
  inkLine(c, [[300, top + 300], [600, top + 260], [960, top + 330]], 3712, 4, "rgba(20,28,60,0.5)");
  c.restore();
  c.restore();
  // moonlight across the bed from the window (upper right), the rest dark
  c.save();
  c.globalCompositeOperation = "lighter";
  const g = c.createLinearGradient(1000, 0, 300, 1920);
  g.addColorStop(0, "rgba(120,150,230,0)");
  g.addColorStop(0.42, "rgba(120,150,230,0.16)");
  g.addColorStop(0.6, "rgba(120,150,230,0)");
  c.fillStyle = g;
  c.fillRect(-60, -60, W + 120, H + 120);
  c.restore();
  vignette(c, 0.7, 540, 820, 260, 1100);
  void abs;
}
/** Under the duvet with him (the music muffled): from just above his face. He lies on the pillow with the duvet pulled
 *  up to his chin, both fists clutching its edge; it closes over the top of the frame like a tent, and the only light
 *  is a thin slice of moonlight getting in at the top. A tear runs out of the corner of each eye towards the pillow;
 *  he sobs; the camera creeps in, slower and slower. */
function underBlanket(c: Ctx, abs: number) {
  const [m0, m1] = EV.muffle;
  const p = phase(abs, m0, m1);
  const sob = (Math.sin(abs * 8.5) + 0.5 * Math.sin(abs * 21)) * 3;
  fillBg(c, "#04050c");
  c.save();
  camera(c, 540, 860, 1.06 + 0.08 * (1 - Math.pow(1 - p, 2)), -0.03);
  // the pillow under his head, in the dark
  blob(c, [[90, 520], [990, 500], [1040, 1180], [60, 1200]], 3725, 2.4);
  paint(c, "#2c3452", C.ink, 6);
  inkLine(c, [[200, 560], [520, 540], [880, 560]], 3726, 4, "rgba(150,170,220,0.18)");
  litFigure(c, (q) =>
    drawKid(q, 540, 840 + sob, 1.55, {
      body: "bust",
      eyes: "teary",
      tears: 0.4 + 0.6 * smooth(p),
      look: [0.15, -0.35],
      mouth: "wobble",
      brows: "sad",
      arms: "custom",
      handL: [-74, 262],
      handR: [74, 262],
      shapeL: "fist",
      shapeR: "fist",
    }), {
    shade: 0.5,
    shadeCol: "rgb(6,8,26)",
    lights: [{ x: 640, y: 380, r: 640, rgb: "120,150,230", a: 0.42 }],
    rim: { ux: 0.3, uy: -1, rgb: "150,175,255", a: 0.5 },
  });
  // the duvet over his chest, his fists on top of its edge
  const top = 840 + sob + 262 * 1.55 - 26;
  const duv: Pt[] = [[-120, top + 40], [200, top + 10], [420, top + 24], [660, top + 6], [900, top + 30], [1200, top + 10], [1200, 2100], [-120, 2100]];
  blob(c, duv, 3727, 2.4);
  paint(c, vgrad(c, top, top + 700, [[0, "#2f3d63"], [1, "#151c33"]]), C.ink, 7);
  for (const side of [-1, 1]) {
    const fx = 540 + side * 74 * 1.55,
      fy = top + 6;
    oval(c, fx, fy, 50, 44, 3728 + side, 0.8);
    paint(c, "#a99a86", C.ink, 5);
    for (let k = 0; k < 3; k++) inkLine(c, [[fx - 24 + k * 22, fy + 8], [fx - 22 + k * 22, fy + 30]], 3730 + k + side * 4, 2.4, "rgba(80,60,40,0.6)");
  }
  c.restore();
  // the duvet closing over the top of the frame like a tent: heavy folds hanging in, a slice of moonlight at the top
  const tent: Pt[] = [[-80, -80], [1160, -80], [1160, 360], [980, 300], [820, 250], [660, 200], [540, 190], [400, 215], [240, 270], [80, 330], [-80, 380]];
  blob(c, tent, 3732, 3);
  paint(c, "#141a30", C.ink, 6);
  c.save();
  blob(c, tent, 3732, 3);
  c.clip();
  for (let k = 0; k < 6; k++) inkLine(c, [[80 + k * 190, -40], [120 + k * 180, 160 + (k % 2) * 60]], 3733 + k, 6, "rgba(4,6,18,0.6)");
  c.restore();
  // the gap at the very top where the moonlight gets in
  c.save();
  c.globalCompositeOperation = "lighter";
  glow(c, 600, 170, 380, "rgba(120,150,235,0.22)");
  c.restore();
  vignette(c, 0.7, 540, 900, 300, 1050);
}

function shotOff(c: Ctx, abs: number) {
  if (abs < EV.blanket) {
    // one quick swipe across 滑动来关机, landing on the "and", and the screen goes black — the room goes with it
    const slide = smooth(phase(abs, EV.powerOff - 0.2, EV.powerOff));
    const thumb: FingerPos = abs < EV.powerOff - 0.23 ? { ...REST_R, touch: 0 } : { x: lerp(115, 485, slide), y: 255, touch: abs < EV.powerOff + 0.02 ? 1 : 0 };
    const black = smooth(phase(abs, EV.powerOff, EV.powerOff + 0.12));
    hisBokeh(c, abs, { dark: 0.85 + 0.15 * black });
    drawPhone(c, abs, { cx: 540, cy: 960, s: 1.0, rot: 0 }, (k) => {
      powerOffScreen(k, abs, slide, (q) => chatScreen2(q, abs, hisNightChat(abs)));
      if (black > 0) {
        k.fillStyle = `rgba(0,0,0,${black.toFixed(3)})`;
        k.fillRect(0, 0, SW, SH);
      }
    }, { thumbs: [thumb], halo: 1 - black, buttons: abs > EV.powerOff - 0.25 && abs < EV.powerOff + 0.1 ? 1 : 0 });
    vignette(c, 0.4 + 0.4 * black, 540, 900, 300, 1100);
    return;
  }
  if (abs < EV.muffle[0]) {
    pillowShot(c, abs, smooth(phase(abs, EV.blanket + 0.03, EV.muffle[0] - 0.04)));
    return;
  }
  underBlanket(c, abs);
}

// ---------------------------------------------------------------- D · 00:52 — out of his window, in through hers
/** her room at 00:52: sitting up in bed, crying over her phone (we see its pink back), thumbs going */
function herRoomTears(c: Ctx, abs: number, blur = 0) {
  if (blur > 0.3) filtered(c, `blur(${blur.toFixed(1)}px)`, (b) => herRoomNight(b, abs), "herRoomBg");
  else herRoomNight(c, abs);
  const sob = (Math.sin(abs * 9) + 0.5 * Math.sin(abs * 23)) * 2.5;
  const tap = Math.sin(abs * 26) * 4;
  herInBed(c, {
    eyes: "teary",
    tears: 1,
    mouth: "wobble",
    brows: "sad",
    look: [0, 0.9],
    tilt: 0.05,
    arms: "custom",
    handL: [-50, 300 + tap],
    handR: [50, 300 - tap],
    shapeL: "hold",
    shapeR: "hold",
    thumbFlip: true,
    grip: (k) => herPhoneBack(k, 0, 236, 92, 176, 0),
  }, { lamp: 1, phone: 1, y: HER_SIT.y + sob });
  herDuvet(c, 0);
}
/** "…live without me / That makes me": the camera backs out of his room through his window; his light goes out on
 *  "me"; then it swings across the street to the only window still lit — hers — and in through it */
function shotWindows(c: Ctx, abs: number) {
  const his = winC(HIS_WIN),
    hers = winC(HER_WIN);
  const hold: Pt = [his[0] + 40, his[1] + 30];
  const zHold = 2.3;
  let cam: Pt, Z: number;
  if (abs < EV.herWindow[0]) {
    const out = smooth(phase(abs, EV.leaveRoom, EV.leaveRoom + 0.55));
    Z = Math.exp(lerp(Math.log(Z_IN), Math.log(zHold), out)) * (1 - 0.08 * phase(abs, EV.leaveRoom + 0.55, EV.herWindow[0]));
    cam = [lerp(his[0], hold[0], out), lerp(his[1], hold[1], out)];
  } else {
    const w = phase(abs, EV.herWindow[0], EV.herWindow[1]);
    const k = smooth(clamp(w / 0.55));
    cam = [lerp(hold[0], hers[0], k), lerp(hold[1], hers[1], k)];
    const z0 = zHold * 0.92;
    const g = -1.4 * w * w * w + 2.4 * w * w;
    Z = Math.exp(Math.log(z0) + Math.log(Z_IN / z0) * g - 0.42 * Math.sin(Math.PI * clamp(w / 0.6)) ** 2);
  }
  const lit = abs < EV.hisLightOff;
  nightStreet(c, abs, cam, Z, { day: 0, hisLit: lit, herLit: true, hisRoom: (k) => hisRoomCurled(k, abs, lit ? 1 : 0), herRoom: (k) => herRoomTears(k, abs) });
  card(c, "00:52", 70, 330, smooth(phase(abs, EV.leaveRoom + 0.1, EV.leaveRoom + 0.35)) * (1 - phase(abs, EV.twist - 0.3, EV.twist - 0.1)), 42);
  void HIS_F0;
  void HIS_M0;
  void SIT;
}

// ---------------------------------------------------------------- E · she is crying too
const HER_FACE: Pt = [470, 690];
/** carried in through her window, the camera keeps creeping in on her face — slower and slower, tilting a little, the
 *  room going soft behind her (she stays sharp) and the edges closing in */
function shotHerTears(c: Ctx, abs: number) {
  const p = phase(abs, EV.twist, EV.hesitate);
  const f = 0.9 * (1 - Math.pow(1 - p, 2.7)) + 0.1 * p; // picks up the speed it came through the window with
  const S = HER_M0 * Math.pow(2.4 / HER_M0, f);
  const m = smooth(p);
  const tx = lerp(HER_F0[0], HER_FACE[0], m),
    ty = lerp(HER_F0[1], HER_FACE[1], m);
  fillBg(c, "#120c1a");
  c.save();
  c.translate(540, lerp(960, 860, m));
  c.rotate(-0.035 * m);
  c.scale(S, S);
  c.translate(-tx, -ty);
  herRoomTears(c, abs, 7 * m);
  c.restore();
  vignette(c, 0.62 * m, 540, 820, 240, 1000);
}

// ---------------------------------------------------------------- F · the paragraph she can't send
function herNightView(draft: string) {
  const items = fromHer(HISTORY);
  items.push({ t: "msg", me: true, text: "嗯" });
  items.push({ t: "msg", text: GIVE_UP });
  return { title: HIM, time: "00:52", me: "girl" as const, them: "boy" as const, items, dark: true, draft, caret: true, keyboard: true };
}
/** tears landing on the glass, in screen units */
function tearDrops(c: Ctx, abs: number, t0: number, n = 3) {
  for (let i = 0; i < n; i++) {
    const t = t0 + i * 0.45;
    if (abs < t) continue;
    const k = clamp((abs - t) / 0.2);
    const x = 140 + hash(i * 7.1) * 320,
      y = 420 + hash(i * 3.3) * 420;
    c.save();
    c.globalAlpha = 0.55;
    c.fillStyle = "rgba(200,225,255,0.5)";
    c.beginPath();
    c.ellipse(x, y, 22 * k, 18 * k, 0.3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.8)";
    c.beginPath();
    c.ellipse(x - 6, y - 6, 5 * k, 4 * k, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}
/** 29.72 → 32.79 "I should get a piercing through my heart": her phone, close enough to read the whole paragraph (steady:
 *  reading). 31.25 her thumb comes down on 发送 and stays there — she never lets go, so it never sends; 32.02 she swipes
 *  the app away (it shrinks back into 微信 on her home screen) — and on into her memory. */
export function shotHesitate(c: Ctx, abs: number) {
  const view = herNightView(HER_NIGHT_DRAFT);
  const sb = sendButtonAt(c, view);
  const land = smooth(phase(abs, EV.pressSend - 0.22, EV.pressSend));
  const down = abs >= EV.pressSend && abs < EV.toHome + 0.06;
  const appK = 1 - smooth(phase(abs, EV.toHome, EV.toHome + 0.3));
  const swipe = phase(abs, EV.toHome - 0.04, EV.toHome + 0.26);
  const right: FingerPos = { x: sb[0] - 4, y: sb[1] + 30 * (1 - land), touch: down ? 1 : abs > EV.pressSend - 0.25 && abs < EV.toHome ? 0.7 : 0 };
  const left: FingerPos = { x: 300, y: lerp(1255, 950, swipe), touch: swipe > 0 && swipe < 1 ? 1 : 0 };
  const k = smooth(phase(abs, 30.5, EV.pressSend));
  const e = smooth(phase(abs, EV.toHome - 0.05, EV.toHome + 0.32));
  const s = lerp(1.34 + 0.06 * smooth(phase(abs, EV.hesitate, EV.pressSend)) + 0.06 * smooth(phase(abs, EV.pressSend, EV.toHome)), 1.0, e);
  const fx = lerp(lerp(284, 336, k), 300, e),
    fy = lerp(lerp(606, 636, k) + 16 * smooth(phase(abs, EV.hesitate, 30.5)), 640, e);
  herBokeh(c, abs, { dark: 0.15, zoom: lerp(1.25, 1, e) });
  drawPhone(c, abs, { cx: 540 - (fx - 300) * s, cy: lerp(930, 960, e) - (fy - 640) * s, s, rot: 0 }, (q) => {
    if (appK < 1) herHome(q, abs, "00:52", { zoom: 1 + 0.08 * appK });
    appWindow(q, appK, WECHAT_AT, (a) => {
      chatScreen2(a, abs, { ...view, sendHot: down ? 1 : 0 });
      tearDrops(a, abs, 31.45, 2);
    });
  }, { thumbs: [right, left], haloRgb: "255,170,210", halo: 0.9 });
  vignette(c, 0.3, 540, 900, 420, 1200);
  void touchDot;
}

export function createScene(options: SceneOptions) {
  return designScene(options, BAR(8), (c, abs) => {
    if (abs < EV.uglyEnd) shotPretty(c, abs);
    else if (abs < BAR(12)) shotTyping(c, abs);
    else if (abs < EV.leaveRoom) shotOff(c, abs);
    else if (abs < EV.twist) shotWindows(c, abs);
    else if (abs < EV.hesitate) shotHerTears(c, abs);
    else shotHesitate(c, abs);
    bloom(c, 0.22, 24);
  });
}
