// 第二幕（16.43 – 32.79）· 副歌1（重置版：剧情和时间点不变，画面、镜头、光影按最新标准重做）
//  A 16.43–21.54 三个画面：手机升上来、按拍翻她的相册 → 他的脸被她照片的光照着（颜色随照片变，到向日葵那张变暖、笑了一下）→
//                向日葵头像铺满画面（pretty）→ 熄屏，他的倒影浮在她脸的位置（ugly）→ 低头
//  B 21.54–24.61 倒影的脸在同一位置变成他流泪的脸（身后是黑屋子）→ 镜头冲进他的眼睛 → 手机：聚光在 "k"（「嗯」）上，
//                她的「正在输入」气泡在下面闪两次（黄圈给观众）→ 沉进 "k"
//  C 24.61–26.40 从「嗯」里猛地收回、一下划掉关机 → 俯拍：他攥着被子边一把拉过头（月光）→ 同一构图的被子里流泪
//  D 26.40–28.10 一镜：退出他的窗 → 唱到 me 灯灭 → 甩过街 → 推进她亮着彩灯的窗
//  E 28.10–29.72 穿过玻璃：她也在哭，镜头一路慢推到她的脸，背景虚化、四周压暗
//  F 29.72–32.79 她的手机：整段话；拇指按住「发送」不松 → 划回主页（草莓牛奶壁纸）
import "./locale";
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase, smooth } from "@frame/engine/math";
import { C, Ctx, H, Pt, W, blob, bloom, camera, card, designScene, easeOut, fillBg, filtered, glow, hash, inkLine, litFigure, oval, paint, poly, pulse, rr, sinceBeat, vgrad, zoomBlur } from "@materials/s0rrow/code/draw";
import { drawKid } from "@materials/s0rrow/code/kid";
import { paneLight } from "@materials/s0rrow/code/sets";
import { powerOffScreen, profileScreen } from "@materials/s0rrow/code/chat";
import { APP_AT, appWindow, bubbleAt, chatScreen2, sendButtonAt, typingAt, typingOnly } from "./dm";
import type { FingerPos } from "@materials/s0rrow/code/hand";
import { SH, SW } from "@materials/s0rrow/code/phone";
import { GIVE_UP, HANDLE, HER_NIGHT_DRAFT, HIM, HISTORY, REST_R, UM, fromHer, herHome, hisNightChat, inWin, laidOut, typingK } from "./story";
import { BAR, EV, beatAt } from "./timeline";
import { HER_ALBUM } from "./photos";
import { PhoneSpec, clueGlow, drawPhone, lerp, pulseRings, touchDot, vignette } from "./shots";
import { HER_F0, HER_M0, HER_SIT, HER_WIN, HIS_F0, HIS_M0, HIS_WIN, SIT, Z_IN, hisBokeh, hisDuvet, hisRoom, herBokeh, herDuvet, herInBed, herPhoneBack, herRoomNight, hisPhoneBack, hisRoomCurled, nightStreet, winC } from "./world";

// ---------------------------------------------------------------- A · pretty / ugly
/** he flicks through her album on the beat (16.94 / 17.45 / 17.96) and ends on her sunflower portrait for "pretty" */
const FLICKS = [beatAt(33), beatAt(34), beatAt(35)];
const FLICK = 0.22;
/** A2 his face (17.45) and A3 her portrait (18.47) start on the beat */
const A_FACE = beatAt(34),
  A_PORTRAIT = beatAt(36);
/** the light each of her photos throws (the sunny classroom, the milk-tea shop at night, the blue sky on the roof,
 *  the sunflower portrait) */
const PHOTO_RGB = ["255,226,184", "255,184,140", "170,212,255", "255,212,120"];
const albumAt = (abs: number) => FLICKS.reduce((n, t) => n + smooth(phase(abs, t, t + FLICK)), 0);
const photoLight = (album: number) => {
  const i = Math.min(2, Math.floor(album)),
    f = album - i;
  const a = PHOTO_RGB[i].split(",").map(Number),
    b = PHOTO_RGB[Math.min(3, i + 1)].split(",").map(Number);
  return a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(",");
};
function albumThumb(abs: number): FingerPos {
  const flick = FLICKS.find((t) => abs > t - 0.05 && abs < t + FLICK + 0.02);
  return flick === undefined ? { ...REST_R, touch: 0 } : { x: lerp(470, 130, smooth(phase(abs, flick, flick + FLICK))), y: 560, touch: 1 };
}
/** A1 · 16.43 → 17.45 in the dark (the lamp just went off) the phone comes up into frame — he picked it up again —
 *  slowing as it arrives; he goes to her profile and flicks through her photos on the beat; the camera leans in a
 *  little with each one (missing her). */
function albumPhone(c: Ctx, abs: number) {
  const album = albumAt(abs);
  const rise = 1 - easeOut(phase(abs, BAR(8), BAR(8) + 0.3));
  const lean = smooth(phase(abs, BAR(8) + 0.2, A_FACE));
  const p: PhoneSpec = { cx: 540, cy: 1000 - 30 * lean + 520 * rise * rise, s: 1.16 + 0.07 * lean, rot: -0.02 + 0.04 * rise };
  hisBokeh(c, abs, { dark: 0.85, shift: [0, 160 * rise] });
  drawPhone(c, abs, p, (k) => profileScreen(k, abs, { photos: HER_ALBUM, at: album }), { thumbs: [albumThumb(abs)], halo: 1, haloRgb: photoLight(album), glare: 40 });
  vignette(c, 0.3, 540, 900, 380, 1200);
}
/** A2 · 17.45 → 18.47 his face over the phone in the dark, lit by her photos: the light on him changes with every
 *  flick (blue sky → the sunflower's gold, warming); a small, sad smile; a slow push (missing her). */
function albumFace(c: Ctx, abs: number) {
  const rgb = photoLight(albumAt(abs));
  const push = smooth(phase(abs, A_FACE, A_PORTRAIT));
  const warm = smooth(phase(abs, FLICKS[2], FLICKS[2] + 0.3));
  const z = 1.7 + 0.12 * push,
    fy = 790;
  const hx = SIT.x,
    hy = SIT.y;
  // his room with the lamp off, out of focus, moving about half as much as he does
  fillBg(c, "#0c0f1f");
  filtered(c, `blur(${(1.6 + 0.9 * (z - 1.6)).toFixed(1)}px)`, (b) => {
    camera(b, hx, hy, 1 + (z - 1) * 0.62, 0, 540 - hx, fy - hy);
    hisRoom(b, abs, { lamp: 0, lights: 0.25 });
  }, "albumRoom");
  c.save();
  camera(c, hx, hy, z, 0, 540 - hx, fy - hy);
  const py = 236;
  const top: Pt = [hx, hy + (py - 92) * SIT.s];
  // the dark takes him; the only light on his face is her photo, from just under his chin; the moon rims him
  litFigure(c, (k) =>
    drawKid(k, hx, hy, SIT.s, {
      body: "bust",
      arms: "custom",
      handL: [-50, 300],
      handR: [50, 300],
      shapeL: "hold",
      shapeR: "hold",
      thumbFlip: true,
      eyes: "open",
      brows: "sad",
      mouth: warm > 0.5 ? "smile" : "flat",
      blush: 0.25 * warm,
      look: [0, 0.62],
      grip: (g) => hisPhoneBack(g, 0, py, 92, 176, 0),
    }), {
    shade: 0.55,
    shadeCol: "rgb(12,14,40)",
    lights: [{ x: top[0], y: top[1], r: 310, rgb, a: 0.8 }],
    rim: { ux: 1, uy: -0.35, rgb: "160,185,255", a: 0.55, width: 8 },
  });
  hisDuvet(c, 1, 0, true);
  c.globalCompositeOperation = "screen";
  glow(c, top[0], top[1], 150, `rgba(${rgb},${(0.3 + 0.1 * warm).toFixed(3)})`);
  c.restore();
  vignette(c, 0.45, 540, fy + 120, 360, 1250);
}
/** A3 · 18.47 → 21.54 her sunflower portrait fills the frame (the phone right up close): the camera keeps creeping
 *  in on her face (pretty); the screen times out; in the black glass his own face surfaces exactly where hers was
 *  (match dissolve). On "ugly" a slow push that slows, a glare sliding over his face, the edges closing in; he can't
 *  hold his own gaze — eyes and head go down. Ends on his reflection's face, where the next shot's real face starts. */
/** her face in her sunflower profile photo (the library's portrait): his reflection sits exactly there */
const REFL_S = 1.15,
  REFL_Y = 470;
const portraitScale = (abs: number) => 1.72 + 0.1 * smooth(phase(abs, A_PORTRAIT, 19.33)) + 0.23 * easeOut(phase(abs, 19.6, EV.uglyEnd));
const PORTRAIT_FY = 780;
function portraitToReflection(c: Ctx, abs: number) {
  const out = smooth(phase(abs, 19.33, 19.75));
  const refl = abs < 19.4 ? 0 : 0.36 * smooth(phase(abs, 19.4, 19.9)) + 0.3 * smooth(phase(abs, 20.15, 20.6));
  const avert = smooth(phase(abs, 20.55, 20.9)); // on "ugly"
  const s = portraitScale(abs);
  const p: PhoneSpec = { cx: 540, cy: PORTRAIT_FY + (SH / 2 - REFL_Y) * s, s, rot: 0 };
  hisBokeh(c, abs, { dark: 0.85 + 0.1 * out });
  drawPhone(c, abs, p, (k) => {
    if (out < 1) profileScreen(k, abs, { photos: HER_ALBUM, at: 3 });
    if (out > 0) {
      k.fillStyle = `rgba(5,5,8,${out.toFixed(3)})`;
      k.fillRect(0, 0, SW, SH);
    }
    if (refl > 0) {
      // his reflection, whole (drawn into a buffer and laid over at once, so nothing shows through it)
      filtered(k, "grayscale(0.8) brightness(0.8)", (b) => {
        drawKid(b, SW / 2, REFL_Y, REFL_S, {
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
  }, { halo: 1 - 0.75 * out, haloRgb: PHOTO_RGB[3], glare: 40 });
  // the room closes in round him
  vignette(c, 0.3 + 0.45 * smooth(phase(abs, 19.9, EV.uglyEnd)), 540, PORTRAIT_FY + 40, 280, 1050);
}
/** where his reflected face is on the frame at the end of A (the next shot's real face starts there) */
const REFL_END = { y: PORTRAIT_FY + 14 * REFL_S * portraitScale(EV.uglyEnd), s: REFL_S * portraitScale(EV.uglyEnd) };
function shotPretty(c: Ctx, abs: number) {
  if (abs < A_FACE) albumPhone(c, abs);
  else if (abs < A_PORTRAIT) albumFace(c, abs);
  else portraitToReflection(c, abs);
}

// ---------------------------------------------------------------- B · his tears → through his eye → her 「嗯」
const T2 = [beatAt(42), beatAt(44), BAR(12)];
const SINK = beatAt(46); // the clue is gone for good — he sinks into the 「嗯」
/** his eyes relative to drawKid's head centre at s = 1 */
const EYE_DX = 52,
  EYE_DY = 36;
const EYE_DIVE = beatAt(43);

/** his chat while she types (and until he powers off): it keeps room for her typing bubble the whole time, so her "k"
 *  never moves while the dots come and go under his last message */
const typingView = (abs: number) => hisNightChat(abs, { typing: typingK(abs, [EV.typingA, EV.typingB]), typingRoom: 1 });
/** her "k" that night (index in his chat) and where it is on his screen */
const UM_AT = HISTORY.length;
function umOnScreen(c: Ctx): Pt {
  const b = bubbleAt(c, typingView(23), UM_AT) ?? { x: 84, y: 900, w: 64, h: 86 };
  return [b.x + b.w / 2, b.y + b.h / 2];
}
/** his phone at night, her "k" held at (ux, uy) under a spotlight that closes to darkness `dk`; it glows cold on
 *  every beat and sends out a thin white ring (what he's staring at); the clue he misses — her typing bubble under his
 *  last message — gets the film's yellow pulse, for us. */
/** the dark closing round her 「嗯」 at (ux, uy): `dk` 0..1 how far it has closed, `zs` the phone's scale */
function umSpotlight(c: Ctx, ux: number, uy: number, zs: number, dk: number) {
  const r0 = (110 - 64 * dk) * zs;
  const g = c.createRadialGradient(ux, uy, r0, ux, uy, r0 + 650 - 490 * dk);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${(0.4 + 0.58 * dk).toFixed(3)})`);
  c.fillStyle = g;
  c.fillRect(-60, -60, W + 120, H + 120);
}
function typingPhone(c: Ctx, abs: number, dk: number, zs: number, rot: number, ux = 390, uy = 1182) {
  const view = typingView(abs);
  const cos = Math.cos(rot),
    sin = Math.sin(rot);
  const at = (x: number, y: number): Pt => {
    const dx = (x - 300) * zs,
      dy = (y - 640) * zs;
    return [dx * cos - dy * sin, dx * sin + dy * cos];
  };
  const [mx, my] = umOnScreen(c);
  const [ox, oy] = at(mx, my);
  const zx = ux - ox,
    zy = uy - oy;
  hisBokeh(c, abs, { dark: 0.9 });
  drawPhone(c, abs, { cx: zx, cy: zy, s: zs, rot }, (k) => chatScreen2(k, abs, view), { halo: 1 - dk * 0.6 });
  umSpotlight(c, ux, uy, zs, dk);
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
  const dots = typingAt(c, view);
  const [qx, qy] = at(dots.x + dots.w / 2, dots.y + dots.h / 2);
  const tx = zx + qx,
    ty = zy + qy;
  const on = Math.max(...[EV.typingA, EV.typingB].map((w) => smooth(phase(abs, w[0], w[0] + 0.1)) * (1 - smooth(phase(abs, w[1], w[1] + 0.1)))));
  // the dots themselves stay out of the dark (the audience has to be able to read them)
  if (on > 0) {
    c.save();
    c.translate(zx, zy);
    c.rotate(rot);
    c.scale(zs, zs);
    c.translate(-SW / 2, -SH / 2);
    c.globalAlpha = 0.9;
    typingOnly(c, abs, view);
    c.restore();
  }
  clueGlow(c, tx, ty, 190 * zs, on);
  pulseRings(c, abs, tx, ty, (dots.w / 2 + 26) * zs, (dots.h / 2 + 16) * zs, [EV.typingA[0] + 0.02, EV.typingA[0] + 0.2, EV.typingB[0] + 0.02, EV.typingB[0] + 0.2], rot);
}
/** 22.56 → 24.61 out of his pupil onto her "k". Three speeds, one move:
 *  · he stares (22.56 → 23.59): a slow, straight, linear push (8%) on the "k" and a slight dutch tilt creeping in, the
 *    dark closing round it; the clue — her typing bubble coming up twice under his last message — gets the yellow
 *    pulse, and the camera doesn't so much as twitch towards it (he doesn't see it). The "k" sits high enough that the
 *    dots stay above the lyrics (and above YouTube's caption at the bottom).
 *  · the moment it stops for good (23.59) he's pulled in: faster and faster (pow 2.2) right into the 「嗯」, arriving
 *    on the echoed "love me" (24.30); the tilt straightens as it goes.
 *  · then it barely moves, the word alone in the dark — until the next shot snaps back out of it. */
const UM_IN = 24.3;
function umPlacement(abs: number): { zs: number; rot: number; ux: number; uy: number; dk: number } {
  const stare = phase(abs, T2[1], SINK);
  const z0 = 1.0 + 0.08 * stare;
  const d = Math.pow(phase(abs, SINK, UM_IN), 2.2);
  const z1 = 4.6 * (1 + 0.05 * smooth(phase(abs, UM_IN, BAR(12))));
  const zs = z0 * Math.pow(z1 / z0, d);
  // the 「嗯」 slides to the middle as the frame closes on it (by how much of the screen is still in view)
  const w = (1 / z0 - 1 / zs) / (1 / z0 - 1 / z1);
  return {
    zs,
    rot: (-0.025 - 0.025 * stare) * (1 - d),
    ux: lerp(400, 540, w),
    uy: lerp(850, 880, w),
    dk: Math.min(0.98, 0.45 + 0.45 * smooth(stare) + 0.08 * d),
  };
}
function umDive(c: Ctx, abs: number) {
  const u = umPlacement(abs);
  typingPhone(c, abs, u.dk, u.zs, u.rot, u.ux, u.uy);
}
/** 21.54 → 22.56: the black glass lights up (he's touched it): his reflected face becomes his real face, same place,
 *  same size, lit by the screen — nothing came. He cries; the camera moves in to his eyes (his dark room behind him,
 *  out of focus, the moonlit window), then rushes on through one of them (a zoom blur, the eye going dark round the
 *  pupil): what's reflected in his pupils is the real picture of his phone (9:16, framed like the frame), and it grows
 *  until it IS the picture. */
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
  // starts exactly on his reflection's face at the end of the last shot (same place, same size)
  const z0 = REFL_END.s / S;
  const z = u > 0 ? Math.exp(Math.log(3.3) + (Math.log(zEnd) - Math.log(3.3)) * smooth(u)) : Math.exp(Math.log(z0) + (Math.log(3.3) - Math.log(z0)) * into);
  const k = smooth(clamp(u / 0.6));
  const fx = 540 + (rx(1) - 540) * k,
    fy = (860 + (eyeY - 860) * into) * (1 - k) + ry * k;
  const ay = lerp(REFL_END.y, 900, into) + 60 * smooth(u);
  // his dark room behind him (the lamp off, the moon in the window), out of focus, moving about half as much
  hisBokeh(c, abs, { dark: 0.9, zoom: 1 + 0.6 * into + 3 * smooth(u) });
  filtered(c, `blur(${(3 + 5 * into).toFixed(1)}px)`, (b) => {
    const zb = 1 + (z - 1) * 0.5;
    b.translate(540, ay);
    b.scale(zb, zb);
    b.translate(-fx, -fy);
    b.translate(540, 860);
    b.scale(S / SIT.s, S / SIT.s);
    b.translate(-SIT.x, -SIT.y);
    hisRoom(b, abs, { lamp: 0, lights: 0.25 });
  }, "tearsRoom", 0.75 * (1 - smooth(u)));
  zoomBlur(c, (zc) => tearsFigure(zc, abs, z, fx, fy, ay, u), 540, ay, 0.4 * Math.sin(Math.PI * smooth(u)), "eyeRush");
  // round the pupil the eye goes dark as we rush in, so only the picture in it is left
  if (u > 0) {
    const r0 = Math.hypot(rw, rh) * 0.5 * z;
    const g = c.createRadialGradient(540, ay, r0, 540, ay, r0 * 1.8 + 40);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(2,3,10,${(0.92 * smooth(clamp(u * 1.6))).toFixed(3)})`);
    c.fillStyle = g;
    c.fillRect(-60, -60, W + 120, H + 120);
  }
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
/** him crying over the phone, with his phone reflected in both pupils (the camera: (fx, fy) at (540, ay), zoom z) */
function tearsFigure(c: Ctx, abs: number, z: number, fx: number, fy: number, ay: number, u: number) {
  const S = 1.25;
  const eyeY = 860 + EYE_DY * S;
  const rh = 11 * S,
    rw = (rh * 9) / 16,
    ry = eyeY + 3 * S;
  const rx = (side: number) => 540 + (side * EYE_DX + 3) * S;
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
}
function shotTyping(c: Ctx, abs: number) {
  if (abs < T2[1]) hisTears(c, abs);
  else umDive(c, abs);
}

// ---------------------------------------------------------------- C · power off → the duvet over his head → under it
/** where he lies, seen from just above his face (this shot and the one under the duvet share it) */
const LIE = { x: 540, y: 840, s: 1.55 };
/** the duvet's edge across his chest, where his fists hold it */
const LIE_EDGE = LIE.y + 262 * LIE.s - 26;
/** his two fists on the duvet's edge: just round shapes, no fingers sticking up */
function lyingFists(c: Ctx, top: number, tone = "#a99a86") {
  for (const side of [-1, 1]) {
    const fx = LIE.x + side * 74 * LIE.s,
      fy = top + 6;
    oval(c, fx, fy, 50, 46, 3728 + side, 0.8);
    paint(c, tone, C.ink, 5);
    c.save();
    oval(c, fx, fy, 50, 46, 3728 + side, 0.8);
    c.clip();
    oval(c, fx + 22, fy + 20, 40, 34, 3740 + side, 1);
    paint(c, "rgba(60,40,30,0.25)", null);
    c.restore();
  }
}
/** the duvet from above, its edge at `top` (stars, folds, the window's panes of moonlight across it) */
function duvetFromAbove(c: Ctx, top: number, dark: number) {
  const duv: Pt[] = [[-120, top + 40], [200, top + 10], [420, top + 24], [660, top + 6], [900, top + 30], [1200, top + 10], [1200, 2100], [-120, 2100]];
  blob(c, duv, 3727, 2.4);
  paint(c, vgrad(c, top, top + 900, [[0, dark > 0.5 ? "#2f3d63" : "#536a9c"], [1, dark > 0.5 ? "#151c33" : "#2d3c62"]]), C.ink, 7);
  c.save();
  blob(c, duv, 3727, 2.4);
  c.clip();
  for (let i = 0; i < 12; i++) {
    const sx = -40 + hash(i * 3.1 + 7) * 1160,
      sy = top + 70 + hash(i * 4.7 + 3) * 760;
    c.fillStyle = `rgba(230,236,255,${(0.45 * (1 - 0.6 * dark)).toFixed(3)})`;
    c.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2,
        r = k % 2 ? 5 : 12;
      c.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
    }
    c.fill();
  }
  // the folds pulled tight from his fists
  inkLine(c, [[200, top + 60], [300, top + 260], [260, top + 520]], 3711, 4, "rgba(20,28,60,0.5)");
  inkLine(c, [[880, top + 60], [780, top + 280], [830, top + 540]], 3712, 4, "rgba(20,28,60,0.5)");
  inkLine(c, [[-80, top + 52], [300, top + 22], [660, top + 18], [1200, top + 22]], 3713, 8, "rgba(200,215,255,0.3)");
  c.restore();
}
/** 25.12 → 25.63 the bed from just above his face, in the moonlight (the lamp off, the panes of the window across the
 *  pillow and the duvet): he's lying on his back crying, both fists on the duvet's edge at his chin — and he yanks it
 *  up over his head (fast: hiding). The duvet fills the frame; the next shot is under it, same framing, in the dark. */
function pillowShot(c: Ctx, abs: number, cover: number) {
  fillBg(c, "#1b2240");
  c.save();
  camera(c, 540, 860, 1.06 - 0.02 * cover, -0.03);
  // the headboard above him, the sheet, the pillow under his head
  poly(c, [[-100, -100], [1180, -100], [1180, 300], [-100, 330]], 3700, 1);
  paint(c, "#262c48", C.ink, 6);
  blob(c, [[90, 520], [990, 500], [1040, 1180], [60, 1200]], 3725, 2.4);
  paint(c, "#aab4cf", C.ink, 6);
  inkLine(c, [[200, 560], [520, 540], [880, 560]], 3726, 4, "rgba(255,255,255,0.35)");
  litFigure(c, (q) =>
    drawKid(q, LIE.x, LIE.y, LIE.s, {
      body: "bust",
      eyes: cover > 0.1 ? "shut" : "teary",
      tears: 0.5,
      look: [0.15, -0.35],
      mouth: cover > 0.1 ? "frown" : "wobble",
      brows: "sad",
      arms: "custom",
      handL: [-74, 262],
      handR: [74, 262],
      shapeL: "hidden",
      shapeR: "hidden",
    }), {
    shade: 0.42,
    shadeCol: "rgb(10,12,34)",
    lights: [{ x: 700, y: 260, r: 760, rgb: "140,170,240", a: 0.45 }],
    rim: { ux: 0.3, uy: -1, rgb: "170,190,255", a: 0.5 },
  });
  // the duvet's edge, with his fists on it, pulled up over his face and out of the top of the frame
  const top = lerp(LIE_EDGE, -260, cover);
  duvetFromAbove(c, top, 0);
  lyingFists(c, top);
  c.restore();
  // the moonlight through the window, in panes across the bed
  paneLight(c, [[420, 260], [1000, 220], [1160, 1500], [380, 1620]], "150,175,240", 0.16, 8, "bedPanes");
  vignette(c, 0.55, 540, 860, 320, 1150);
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
    drawKid(q, LIE.x, LIE.y + sob, LIE.s, {
      body: "bust",
      eyes: "teary",
      tears: 0.4 + 0.6 * smooth(p),
      look: [0.15, -0.35],
      mouth: "wobble",
      brows: "sad",
      arms: "custom",
      handL: [-74, 262],
      handR: [74, 262],
      shapeL: "hidden",
      shapeR: "hidden",
    }), {
    shade: 0.5,
    shadeCol: "rgb(6,8,26)",
    lights: [{ x: 640, y: 380, r: 640, rgb: "120,150,230", a: 0.42 }],
    rim: { ux: 0.3, uy: -1, rgb: "150,175,255", a: 0.5 },
  });
  // the duvet over his chest, his fists on top of its edge (just round fists)
  const top = LIE_EDGE + sob;
  duvetFromAbove(c, top, 1);
  lyingFists(c, top);
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
    // he's had enough: the power button — the screen dims under 滑动来关机 and the camera snaps straight back out of the
    // 「嗯」 to the whole phone with a jolt (decided: fast, no hesitating), the dark letting go as it goes
    const um = umPlacement(BAR(12));
    const back = easeOut(phase(abs, BAR(12), BAR(12) + 0.24));
    const zs = um.zs * Math.pow(1 / um.zs, back);
    const w = (1 / um.zs - 1 / zs) / (1 / um.zs - 1);
    const [mx, my] = umOnScreen(c);
    const ux = lerp(um.ux, 540 + (mx - 300), w),
      uy = lerp(um.uy, 960 + (my - 640), w);
    const jolt = Math.exp(-Math.max(0, abs - BAR(12)) / 0.1) * (1 - back);
    const jx = Math.sin(abs * 97) * 11 * jolt,
      jy = Math.cos(abs * 83) * 8 * jolt;
    const p: PhoneSpec = { cx: ux - (mx - 300) * zs + jx, cy: uy - (my - 640) * zs + jy, s: zs, rot: 0 };
    const dim = smooth(phase(abs, BAR(12), BAR(12) + 0.1));
    hisBokeh(c, abs, { dark: 0.85 + 0.15 * black });
    drawPhone(c, abs, p, (k) => {
      chatScreen2(k, abs, typingView(abs));
      k.save();
      k.globalAlpha = dim;
      powerOffScreen(k, abs, slide);
      k.restore();
      if (black > 0) {
        k.fillStyle = `rgba(0,0,0,${black.toFixed(3)})`;
        k.fillRect(0, 0, SW, SH);
      }
    }, { thumbs: [thumb], halo: 1 - black, buttons: abs > EV.powerOff - 0.25 && abs < EV.powerOff + 0.1 ? 1 : 0 });
    if (back < 1) umSpotlight(c, ux, uy, zs, um.dk * (1 - back));
    vignette(c, 0.4 + 0.4 * black, 540, 900, 300, 1100);
    return;
  }
  if (abs < EV.muffle[0]) {
    // a beat to see him crying, then the yank: fast, then easing as it closes over him
    pillowShot(c, abs, easeOut(phase(abs, EV.blanket + 0.08, EV.blanket + 0.38)));
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
  card(c, "12:52 AM", 70, 330, smooth(phase(abs, EV.leaveRoom + 0.1, EV.leaveRoom + 0.35)) * (1 - phase(abs, EV.twist - 0.3, EV.twist - 0.1)), 42);
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
  items.push({ t: "msg", me: true, text: UM });
  items.push({ t: "msg", text: GIVE_UP });
  return { title: HIM, handle: HANDLE[HIM], time: "12:52", me: "girl" as const, them: "boy" as const, items, dark: true, draft, caret: true, keyboard: true };
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
  const view = herNightView(laidOut(HER_NIGHT_DRAFT));
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
    if (appK < 1) herHome(q, abs, "12:52", { zoom: 1 + 0.08 * appK });
    appWindow(q, appK, APP_AT, (a) => {
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
