// 第一幕（0 – 16.43）· 主歌1 · 他的视角（重置版：剧情和时间点不变，画面、镜头、构图、光影按最新标准重做）
//  A 0–0.84    首帧先拍他：深夜坐在床上，刚把那一大段发出去（屏幕光在脸上一跳），屏住呼吸等 → 顺着视线往下甩
//  B 0.84–2.88 手机：「对方正在输入…」闪两次（镜头屏息往前凑、又退回）→ 1.86「嗯」到达：回弹急推、震、黄圈 → 愣住慢推、四周压暗
//  C 2.88–4.16 他的脸：急推一震 → 愣住 → 难过、低头、慢推、歪、光变冷
//  D 4.16–8.25 手机（稳）：往上翻到 7 月 → 停住 → 一下划回现在 → 点头像，朋友圈从右边滑进来 → 红圈「5分钟前」→ 推进合照
//  E 8.25–12.34 回忆（老式屏幕竖线）：越肩看她 → 她转身 → 课本挡脸 → 他低头 → 放学递牛奶，她被小美拉走 → 牛奶留在空桌上
//  F 12.34–16.43 手机：打一大段 → 全删 →「以后不打扰你了」→ 发送；他把手机扣下，伸手关灯
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase, smooth } from "@frame/engine/math";
import { C, Ctx, H, Pt, W, backOut, blob, bloom, camera, designScene, easeOut, fillBg, filtered, glow, inkLine, lightShaft, motes, oldFilm, oldScreenCut, oval, paint, poly, rimFigure, rr, shake, shaded, smearV, text, F, tubePts } from "@materials/s0rrow/code/draw";
import { drawKid } from "@materials/s0rrow/code/kid";
import { CAST, drawPerson } from "@materials/s0rrow/code/people";
import { bookFingers, classroomBoard, deskFront, strawberryMilk, textbook } from "@materials/s0rrow/code/places";
import { classroom } from "@materials/s0rrow/code/sets";
import { BACKSPACE_AT, bubbleAt, chatScreen2, momentsScreen, sendButtonAt } from "@materials/s0rrow/code/chat";
import type { FingerPos } from "@materials/s0rrow/code/hand";
import { SH, SW } from "@materials/s0rrow/code/phone";
import { GIVE_UP, HIS_DRAFT, REST_L, REST_R, deleted, hisNightChat, inWin, typed, typingThumbs } from "./story";
import { BAR, EV } from "./timeline";
import { PhoneSpec, aim, aimLerp, clueGlow, drawPhone, kick, lerp, onPhone, pulseRings, softStart, spotlight, tapAt, timeCard, vignette, whip } from "./shots";
import { ROOM, SIT, hisBokeh, hisDuvet, hisInBed, hisPhoneBack, hisRoom } from "./world";

// ---------------------------------------------------------------- his face, in his room
/** A close-up of him sitting up in bed: the room behind out of focus (it moves half as much as he does), him lit by
 *  the lamp, the phone under his chin and the moon behind. `z` is the zoom on his head, `fy` where his head sits on the
 *  frame, `rot` a dutch tilt, `dy` an extra shift (whips). */
function faceShot(c: Ctx, abs: number, o: { z: number; fy: number; rot?: number; dy?: number; jx?: number; jy?: number; lamp?: number; phone: number; cold?: number; flare?: number; pose: Parameters<typeof drawKid>[4]; phoneY?: number }) {
  const lamp = o.lamp ?? 1;
  const hx = SIT.x,
    hy = SIT.y;
  const zb = 1 + (o.z - 1) * 0.62;
  fillBg(c, "#0c0f1f");
  // the room behind him, a little soft (the string of lights, the polaroids, the moon in the window stay readable)
  filtered(c, `blur(${(1.6 + 0.9 * (o.z - 1.6)).toFixed(1)}px)`, (b) => {
    camera(b, hx, hy, zb, (o.rot ?? 0) * 0.6, 540 - hx + (o.jx ?? 0) * 0.5, o.fy - hy + (o.dy ?? 0) * 0.5 + (o.jy ?? 0) * 0.5);
    hisRoom(b, abs, { lamp });
  }, "faceRoom");
  c.save();
  camera(c, hx, hy, o.z, o.rot ?? 0, 540 - hx + (o.jx ?? 0), o.fy - hy + (o.dy ?? 0) + (o.jy ?? 0));
  const py = o.phoneY ?? 236;
  hisInBed(c, { ...o.pose, grip: (k) => hisPhoneBack(k, 0, py, 92, 176, 0) }, { lamp, phone: o.phone, phoneAt: [hx, hy + py * SIT.s] });
  hisDuvet(c, 1 - lamp, 0, true);
  // the screen's light spilling out over the top of the phone (it's the key light on his face)
  c.save();
  c.globalCompositeOperation = "screen";
  glow(c, hx, hy + (py - 96) * SIT.s, 170, `rgba(160,190,255,${(0.32 * Math.min(1, o.phone)).toFixed(3)})`);
  c.restore();
  // the screen's light flaring up out of the top of the phone onto his face (the message going)
  if (o.flare && o.flare > 0.01) {
    c.save();
    c.globalCompositeOperation = "screen";
    glow(c, hx, hy + (py - 100) * SIT.s, 220, `rgba(200,220,255,${(0.55 * o.flare).toFixed(3)})`);
    c.restore();
  }
  c.restore();
  // the screen's cold light coming up from below, and the edges closing in
  glow(c, 540, H + 80, 1000, `rgba(140,170,255,${(0.18 + 0.15 * (o.cold ?? 0)).toFixed(3)})`);
  if (o.cold) {
    c.save();
    c.globalCompositeOperation = "multiply";
    c.fillStyle = `rgba(150,170,230,${(0.35 * o.cold).toFixed(3)})`;
    c.fillRect(-60, -60, W + 120, H + 120);
    c.restore();
  }
  vignette(c, 0.42 + 0.2 * (o.cold ?? 0), 540, o.fy + 120, 360, 1250);
}

// ---------------------------------------------------------------- A · 0 → 0.84
/** He has just sent the long message: the screen's light jumps on his face as it goes; he holds his breath and the
 *  camera creeps in (tension: linear); on the "and" of beat 1 it whips down along his gaze to the phone. */
function shotSent(c: Ctx, abs: number) {
  const [off, sm] = whip(abs, EV.whip1, -1150, 0.15, 0.24);
  const k = kick(abs, EV.sent, 0.12);
  const creep = clamp(abs / (EV.whip1 - 0.15));
  const z = (1.62 + 0.05 * creep) * (1 + 0.035 * k);
  const [jx, jy] = shake(abs, 6 * k, 3);
  const flare = Math.exp(-Math.max(0, abs - EV.sent) / 0.25);
  const eyes = abs < EV.sent ? "open" : abs < EV.sent + 0.22 ? "wide" : "open";
  smearV(c, (k2) => {
    faceShot(k2, abs, {
      z,
      fy: 800,
      dy: off,
      jx,
      jy,
      phone: 0.7 + 0.6 * (abs >= EV.sent ? flare : 0),
      flare: abs >= EV.sent ? flare : 0,
      pose: { arms: "custom", handL: [-50, 300], handR: [50, 300], shapeL: "hold", shapeR: "hold", thumbFlip: true, eyes, brows: "worried", mouth: abs < EV.sent ? "bite" : "flat", look: [0, 0.62] },
    });
  }, sm, "whipA");
}

// ---------------------------------------------------------------- B · 0.84 → 2.88
/** his phone at night for the hook (keyboard still up from typing the long message) */
const hookView = (abs: number) => hisNightChat(abs, { typing: inWin(abs, EV.typing1) || inWin(abs, EV.typing2), keyboard: true });
const TITLE: Pt = [300, 120];
/** The chat with the keyboard up. The camera holds its breath and leans toward the title each time 「对方正在输入…」
 *  shows (and backs off when it goes); her 「嗯」 lands: a jolt and a rush onto it, two yellow rings; then it hardly
 *  moves — a 6% creep — while everything round the 「嗯」 slowly goes dark. */
function hookPlacement(c: Ctx, abs: number): { p: PhoneSpec; um: Pt } {
  const view = hookView(Math.max(abs, EV.um1 + 0.2));
  const idx = view.items.length - 1;
  const b = bubbleAt(c, view, idx) ?? { x: 106, y: 700, w: 90, h: 86 };
  const um: Pt = [b.x + b.w / 2, b.y + b.h / 2];
  // under the hook text: the title bar just below it, the newest bubble around y 1000, the keyboard off the bottom
  const base = aim(300, 640, 540, 1110, 1.0);
  const breath = (w: readonly [number, number]) => smooth(phase(abs, w[0], w[0] + 0.2)) * (1 - smooth(phase(abs, w[1], w[1] + 0.28)));
  const lean = breath(EV.typing1) + breath(EV.typing2);
  let p = aimLerp(base, aim(TITLE[0], TITLE[1], 540, 600, 1.07), 0.6 * lean);
  if (abs >= EV.um1) {
    const hit = backOut(phase(abs, EV.um1, EV.um1 + 0.16));
    const creep = smooth(phase(abs, EV.um1 + 0.2, EV.hisFace));
    // stop low enough that his long message stays under the hook text, above the lyrics
    const land = aim(um[0], um[1], 500, 1080, 1.34, -0.035);
    const end = aim(um[0], um[1], 510, 1070, 1.34 * 1.06, -0.045);
    p = aimLerp(aimLerp(p, land, hit), end, creep);
    const j = kick(abs, EV.um1, 0.12);
    p = { ...p, cx: p.cx + Math.sin(abs * 90) * 16 * j, cy: p.cy + Math.cos(abs * 77) * 12 * j };
  }
  return { p, um };
}
function shotHook(c: Ctx, abs: number) {
  const [off, sm] = whip(abs, EV.whip1, -1150, 0.15, 0.24);
  smearV(c, (k) => {
    const { p, um } = hookPlacement(k, abs);
    const after = smooth(phase(abs, EV.um1 + 0.2, EV.hisFace));
    hisBokeh(k, abs, { shift: [0, off * 0.2], dark: 0.3 * after });
    k.save();
    k.translate(0, off);
    drawPhone(k, abs, p, (s) => chatScreen2(s, abs, hookView(abs)), { halo: 1, buzz: abs >= EV.um1 ? 1 - phase(abs, EV.um1, EV.um1 + 0.25) : 0 });
    // the clue at the top, for the audience (his eyes stay on the bottom of the screen)
    const [tx, ty] = onPhone(p, TITLE[0], TITLE[1]);
    for (const w of [EV.typing1, EV.typing2]) clueGlow(k, tx, ty, 260 * p.s, inWin(abs, w) ? 1 : 0);
    pulseRings(k, abs, tx, ty, 170 * p.s, 40 * p.s, [EV.typing1[0], EV.typing2[0]], p.rot ?? 0);
    const [ux, uy] = onPhone(p, um[0], um[1]);
    pulseRings(k, abs, ux, uy, 64 * p.s, 46 * p.s, [EV.um1 + 0.05, EV.um1 + 0.45], p.rot ?? 0);
    // the room closes in round her 「嗯」
    spotlight(k, ux, uy, 320, 0.75 * after);
    k.restore();
  }, sm, "whipB");
}

// ---------------------------------------------------------------- C · 2.88 → 4.16
/** his face (cut on the "and"): surprise (snap in, a jolt, wide eyes) → it sinks in (eyes drop to the phone) → sad (a
 *  slow push into his face, the frame tilting, the light going cold); at the end he lowers his eyes to the phone and
 *  the camera tilts down with them (a short whip) to the chat. */
function shotFace(c: Ctx, abs: number) {
  const f0 = EV.hisFace;
  const snap = backOut(phase(abs, f0, f0 + 0.13));
  const j = kick(abs, f0, 0.1);
  const sad = smooth(phase(abs, f0 + 0.6, BAR(2)));
  const z = 1.95 * (1 + 0.07 * snap) * (1 + 0.16 * sad);
  const [jx, jy] = shake(abs, 9 * j, 5);
  const [off, sm] = whip(abs, BAR(2), -900, 0.13, 0.22);
  const surprised = abs < f0 + 0.37,
    sinking = abs >= f0 + 0.37 && abs < f0 + 0.77;
  smearV(c, (k) =>
    faceShot(k, abs, {
      z,
      fy: 800,
      rot: -0.045 * sad,
      dy: off,
      jx,
      jy,
      phone: 0.65,
      cold: sad,
      pose: {
        arms: "custom",
        handL: [-50, 300],
        handR: [50, 300],
        shapeL: "hold",
        shapeR: "hold",
        thumbFlip: true,
        eyes: surprised ? "wide" : sinking ? "open" : "sad",
        brows: surprised ? "up" : sinking ? "worried" : "sad",
        mouth: surprised ? "o" : sinking ? "flat" : "frown",
        look: surprised ? [0, 0.5] : [0, 1],
        tilt: -0.06 * smooth(phase(abs, f0 + 0.75, f0 + 1.15)),
        headY: 10 * smooth(phase(abs, f0 + 0.75, f0 + 1.15)),
      },
    }), sm, "whipC");
}

// ---------------------------------------------------------------- D · 4.16 → 8.25
/** her avatar beside the latest 「嗯」 (screen coordinates, chat scrolled to now, no keyboard) */
const AVATAR_AT: Pt = [56, 1042];
/** the 朋友圈 photo (screen): her face in the selfie */
const PHOTO_FACE: Pt = [312, 796];
/** One steady phone shot: from October's 「嗯」「哦」 he scrolls back up to July — long, lively — and stays there; one
 *  quick flick down to now; a tap on her avatar; her 朋友圈 slides in like a page push; the camera moves in on
 *  「5分钟前」 (red circle), then on into the photo — the way into his memory of today's class. */
function historyPlacement(abs: number): PhoneSpec {
  const read = aim(300, 640, 540, 960, 0.95);
  const pk = smooth(phase(abs, 6.95, 7.4));
  const atMark = aim(160, 1040, 440, 1060, 1.3);
  const atPhoto = aim(PHOTO_FACE[0], PHOTO_FACE[1], 540, 880, 2.6);
  const mk = Math.pow(phase(abs, 7.45, EV.memIn), 2.2);
  return aimLerp(aimLerp(read, atMark, pk), atPhoto, mk);
}
function historyScreen(c: Ctx, abs: number) {
  const su = smooth(phase(abs, EV.scrollUp[0], EV.scrollUp[1]));
  const fd = phase(abs, EV.scrollDown[0], EV.scrollDown[1]);
  const sd = 1 - (1 - fd) * (1 - fd) * (1 - fd); // a flick: fast, then settling
  const scroll = 2150 * (su - sd);
  const push = smooth(phase(abs, EV.pagePush[0], EV.pagePush[1]));
  const mark = smooth(phase(abs, 7.0, 7.4));
  if (push < 1) {
    c.save();
    c.translate(-SW * 0.3 * push, 0);
    chatScreen2(c, abs, hisNightChat(abs, { scroll }));
    if (push > 0) {
      c.fillStyle = `rgba(0,0,0,${(0.35 * push).toFixed(3)})`;
      c.fillRect(0, 0, SW, SH);
    }
    c.restore();
  }
  if (push > 0) {
    c.save();
    c.translate(SW * (1 - push), 0);
    momentsScreen(c, abs, { dark: true, mark });
    c.fillStyle = "rgba(0,0,0,0.35)";
    c.fillRect(-14, 0, 14, SH);
    c.restore();
  }
}
function historyThumb(abs: number): FingerPos | null {
  if (inWin(abs, EV.scrollUp)) {
    const f = ((abs - EV.scrollUp[0]) * 3.4) % 1;
    return { x: 420, y: 520 + f * 420, touch: f < 0.8 ? 1 : 0 };
  }
  if (abs > EV.scrollDown[0] - 0.05 && abs < EV.scrollDown[0] + 0.14) {
    const f = phase(abs, EV.scrollDown[0] - 0.05, EV.scrollDown[0] + 0.12);
    return { x: 420, y: 1000 - f * 460, touch: f < 0.85 ? 1 : 0 };
  }
  return tapAt(abs, EV.tapAvatar, AVATAR_AT[0], AVATAR_AT[1]);
}
function shotHistory(c: Ctx, abs: number) {
  const [off, sm] = whip(abs, BAR(2), -900, 0.13, 0.22);
  const p = historyPlacement(abs);
  smearV(c, (k) => {
    hisBokeh(k, abs, { shift: [0, off * 0.2], dark: 0.25, zoom: 1 + 0.25 * smooth(phase(abs, 6.95, EV.memIn)) });
    k.save();
    k.translate(0, off);
    drawPhone(k, abs, p, (s) => historyScreen(s, abs), { thumbs: [historyThumb(abs)] });
    k.restore();
  }, sm, "whipD");
}

// ---------------------------------------------------------------- E · the class today, remembered (8.25 → 12.34)
/** his desk in the foreground: open notebook with a little sunflower doodle (her hair clip), the strawberry milk he
 *  bought her, his hand on a pen — warm sun across it from the window on the left */
function hisDesk(c: Ctx, abs: number) {
  shaded(c, () => poly(c, [[-140, 1330], [1220, 1318], [1320, 2000], [-240, 2000]], 3700, 1.4), "#d9a96c", () => {
    inkLine(c, [[-120, 1420], [1200, 1410]], 3701, 3, "rgba(120,80,40,0.28)");
    inkLine(c, [[-160, 1640], [1260, 1628]], 3702, 3, "rgba(120,80,40,0.22)");
  }, C.ink, 6);
  poly(c, [[330, 1430], [800, 1420], [850, 1760], [290, 1776]], 3703, 1.2);
  paint(c, "#fbfaf2", C.ink, 5);
  inkLine(c, [[565, 1424], [570, 1768]], 3704, 3, "#c8c1ae");
  for (let i = 0; i < 6; i++) {
    inkLine(c, [[340 - i * 6, 1480 + i * 46], [550, 1476 + i * 46]], 3705 + i, 2, "rgba(90,120,170,0.35)");
    inkLine(c, [[585, 1474 + i * 46], [795 + i * 8, 1470 + i * 46]], 3712 + i, 2, "rgba(90,120,170,0.35)");
  }
  c.save();
  c.globalAlpha = 0.85;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    inkLine(c, [[450 + Math.cos(a) * 17, 1610 + Math.sin(a) * 13], [450 + Math.cos(a) * 33, 1610 + Math.sin(a) * 26]], 3730 + k, 3, "#d9a020");
  }
  oval(c, 450, 1610, 13, 10, 3740, 0.6);
  paint(c, "#8a5a2a", null);
  c.restore();
  strawberryMilk(c, 150, 1530, 0.78, -0.06, 3720);
  const sway = Math.sin(abs * 3) * 4;
  const wrist: Pt = [800 + sway, 1660];
  blob(c, tubePts([[1200, 2080], [980, 1830], wrist], [124, 112, 100], false, true), 3721, 1.2);
  paint(c, "#f1f1ee", C.ink, 6);
  inkLine(c, [[1080, 1960], [960, 1810]], 3724, 18, "rgba(46,111,150,0.85)");
  inkLine(c, [[688 + sway, 1556], [790 + sway, 1644]], 3722, 10, C.ink);
  inkLine(c, [[688 + sway, 1556], [790 + sway, 1644]], 3722, 6, "#3d6fd1");
  roundHand(c, wrist[0] - 6, wrist[1] - 6, 46, 3723);
  // the sun from the window, warm across the desk
  c.save();
  c.globalCompositeOperation = "soft-light";
  const g = c.createLinearGradient(0, 1300, 1080, 1900);
  g.addColorStop(0, "rgba(255,226,170,0.7)");
  g.addColorStop(1, "rgba(120,80,40,0.4)");
  c.fillStyle = g;
  c.fillRect(-60, 1300, W + 120, 700);
  c.restore();
}
/** a simple round fist at the end of a sleeve */
function roundHand(c: Ctx, x: number, y: number, r: number, seed: number, skin: string = C.skin) {
  oval(c, x, y, r, r * 0.94, seed, 1);
  paint(c, skin, C.ink, 6);
  c.save();
  oval(c, x, y, r, r * 0.94, seed, 1);
  c.clip();
  oval(c, x + r * 0.45, y + r * 0.4, r * 0.75, r * 0.7, seed + 1, 1);
  paint(c, "rgba(196,140,90,0.3)", null);
  c.restore();
}

/** The classroom in the sun, out of focus behind the people (it moves less than they do). */
function classBack(c: Ctx, abs: number, z: number, cx: number, cy: number, blur: number, dx = 0, dy = 0) {
  filtered(c, `blur(${blur.toFixed(1)}px)`, (b) => {
    camera(b, cx, cy, z, 0, dx, dy);
    classroomBoard(b, abs, { sun: 1 });
  }, "classBack");
}
/** warm sunlight from the window on the left: a shaft across the frame, dust in it, a soft wash */
function classSun(c: Ctx, abs: number, a = 1) {
  lightShaft(c, [[-60, 120], [260, 120], [900, 1500], [380, 1700]], 100, 200, 700, 1600, "255,228,170", 0.2 * a, 30, "classShaft");
  motes(c, abs, 380, 820, 300, 520, 22, 4100, "255,236,200", 0.45 * a, 2.4);
  glow(c, 40, 300, 900, "rgba(255,236,190,0.22)", a);
}

/** E1 · 8.25 → 9.79: from his seat, over his desk: she sits in front of him in the sun; on consecutive beats she turns
 *  round (their eyes meet), the textbook snaps up in front of her face — and we cut to him. The camera drifts in on
 *  her (layers moving at different speeds); a jolt when she turns; a quick push when the book goes up. */
function shotSeat(c: Ctx, abs: number) {
  const turned = abs >= EV.turn1;
  const hidden = abs >= EV.hide1;
  const gx = 540,
    gy = 860,
    gs = 1.05;
  const drift = smooth(phase(abs, EV.memIn, EV.classFace));
  const j = kick(abs, EV.turn1, 0.1);
  const push = backOut(phase(abs, EV.hide1, EV.hide1 + 0.2));
  const z = 1 + 0.05 * drift + 0.05 * push;
  classBack(c, abs, 1.1 + 0.02 * drift, 540, 900, 3.5, 0, -40);
  classSun(c, abs);
  c.save();
  const [sx, sy] = shake(abs, 7 * j, 9);
  camera(c, gx, gy + 120, z, 0, sx, sy);
  const girl = (k: Ctx) => {
    if (!turned) drawKid(k, gx, gy, gs, { who: "girl", outfit: "cardigan", body: "bust", view: "back", arms: "down", headY: 4 * Math.sin(abs * 1.6) });
    else if (!hidden) drawKid(k, gx, gy, gs, { who: "girl", outfit: "cardigan", body: "bust", eyes: "wide", mouth: "o", look: [0.05, 0.1], arms: "down", tilt: -0.04, blush: 0.55 });
    else drawKid(k, gx, gy, gs, { who: "girl", outfit: "cardigan", body: "bust", eyes: "shut", mouth: "bite", blush: 1, arms: "custom", handL: [-150, 170], handR: [150, 170], shapeL: "hidden", shapeR: "hidden" });
  };
  rimFigure(c, girl, -1, -0.4, "rgb(255,236,200)", 0.55, 6);
  if (hidden) {
    const up = backOut(phase(abs, EV.hide1, EV.hide1 + 0.16));
    const bx = gx + 6,
      by = gy + lerp(420, 110, up) * gs;
    const rot = -0.05 + 0.03 * Math.sin((abs - EV.hide1) * 18) * (1 - phase(abs, EV.hide1, EV.hide1 + 0.5));
    textbook(c, bx, by, gs, rot);
    bookFingers(c, bx, by, gs, rot);
  }
  c.restore();
  // his desk in front, closer (moves more)
  c.save();
  camera(c, 540, 1500, 1 + 0.09 * drift, 0, 0, 30 * drift);
  hisDesk(c, abs);
  c.restore();
}

/** E2 · 9.79 → 10.30: him at his desk, close, looking down at the milk he bought her; the sun behind him */
function hisClassFace(c: Ctx, abs: number, t0: number, mood: "sad" | "smile") {
  const smile = mood === "smile";
  const push = smooth(phase(abs, t0, t0 + 0.6));
  c.save();
  camera(c, 600, 640, 1.7 + 0.05 * push);
  filtered(c, "blur(4px)", (b) => classroom(b, abs, false), "classBack2");
  c.restore();
  classSun(c, abs, 0.8);
  c.save();
  camera(c, 540, 860, 1.14 + 0.05 * push, 0, 0, -40);
  rimFigure(c, (k) =>
    drawKid(k, 540, 880, 1.32, {
      body: "bust",
      outfit: "uniform",
      eyes: smile ? "happy" : "sad",
      mouth: smile ? "smile" : "flat",
      brows: smile ? undefined : "sad",
      blush: smile ? 0.45 : 0,
      look: smile ? [0, 0] : [-0.2, 0.9],
      tilt: smile ? -0.05 : 0.04,
      arms: "down",
    }), -1, -0.5, "rgb(255,236,200)", 0.6, 7);
  deskFront(c, 540, 1360, 1.32, 3572, (k) => strawberryMilk(k, -150, -110, 0.7, -0.05, 3592));
  c.restore();
}

/** E3 · 10.30 → 11.83 after class, over his shoulder (two layers of depth, no wide shot): his back big in the right
 *  foreground, a little soft; she's at her desk in the middle, packing up; 小美 waits behind her, smaller and soft.
 *  The bell; his hand comes up holding out the strawberry milk; she looks up, startled and red; 小美 grabs her wrist and
 *  pulls her out of frame to the left; his hand is left holding the milk out over the empty desk, and slowly sinks. */
function shotMilk(c: Ctx, abs: number) {
  const offer = smooth(phase(abs, EV.milkOffer - 0.22, EV.milkOffer + 0.1));
  const flee = easeOut(phase(abs, EV.flee, EV.flee + 0.34));
  const grab = smooth(phase(abs, EV.flee - 0.22, EV.flee));
  const sink = smooth(phase(abs, EV.flee + 0.4, EV.milkLeft));
  const push = smooth(phase(abs, BAR(5), EV.milkLeft));
  classBack(c, abs, 1.3, 560, 760, 5, 0, 60);
  classSun(c, abs, 0.9);
  c.save();
  camera(c, 520, 980, 1 + 0.05 * push);
  // 小美 behind her (further back: smaller, soft), stepping in to grab her wrist, then running off left
  const mx = lerp(lerp(250, 330, grab), -560, flee);
  filtered(c, "blur(2px)", (k) =>
    drawPerson(k, mx, 640, 0.78, { ...CAST.mei, x: 0, face: abs >= EV.flee - 0.2 ? "o" : "smile", body: "bust", arms: grab > 0.2 ? "handR" : "down", tilt: flee > 0 ? -0.15 : 0.05 }), "mei");
  // her: packing up, then startled by the milk, then pulled away left
  if (abs < EV.flee) {
    const startled = abs > EV.milkOffer;
    rimFigure(c, (k) => drawKid(k, 440, 960, 1.16, { who: "girl", outfit: "cardigan", body: "bust", eyes: startled ? "wide" : "open", mouth: startled ? "o" : "flat", look: startled ? [0.7, -0.15] : [0.1, 0.9], arms: "down", blush: startled ? 1 : 0.35, headY: startled ? -6 : 4 }), -1, -0.4, "rgb(255,236,200)", 0.5, 6);
  } else {
    const x = lerp(440, -460, flee);
    c.save();
    c.translate(x, 960);
    c.rotate(-0.16 * (1 - flee * 0.3));
    drawKid(c, 0, 0, 1.1, { who: "girl", outfit: "cardigan", body: "bust", eyes: "shut", mouth: "bite", blush: 1, arms: "custom", handL: [-260, 150], handR: [80, 340], shapeL: "open", shapeR: "fist" });
    c.restore();
    c.save();
    c.globalAlpha = 1 - phase(abs, EV.flee + 0.2, EV.flee + 0.45);
    for (let k = 0; k < 4; k++) inkLine(c, [[x + 260 + k * 20, 760 + k * 120], [x + 420 + k * 30, 770 + k * 120]], 3760 + k, 5);
    c.restore();
  }
  deskFront(c, 440, 1460, 1.2, 3573);
  c.restore();
  // him, in the foreground right, seen from behind (closer: moves more, a little soft); his left arm comes up and
  // out towards her with the milk — then, after she's gone, sinks
  c.save();
  camera(c, 520, 980, 1 + 0.08 * push);
  const hx = 1010,
    hy = 820,
    hs = 1.85;
  const hand: Pt = [lerp(720, 600, offer), lerp(1500, 1010, offer) + 150 * sink];
  const lh: Pt = [(hand[0] - hx) / hs, (hand[1] - hy) / hs];
  filtered(c, "blur(1.4px)", (k) => {
    drawKid(k, hx, hy, hs, { view: "back", outfit: "uniform", body: "bust", arms: "custom", handL: lh, handR: [110, 430], shapeL: "hidden", headY: 6 * sink, tilt: -0.04 - 0.05 * sink });
    if (offer > 0.02) {
      strawberryMilk(k, hand[0] - 10, hand[1] - 95, 0.95, -0.1 + 0.12 * sink, 3590);
      roundHand(k, hand[0] + 8, hand[1] + 2, 56, 3782);
    }
  }, "himFg");
  c.restore();
  const bell = 1 - phase(abs, 10.85, 11.05);
  if (abs >= BAR(5) && bell > 0) text(c, "叮铃铃～", 250, 360, { size: 60, font: F.cn, fill: "#fff", stroke: C.ink, lw: 10, alpha: bell * clamp((abs - BAR(5)) / 0.08) });
}

/** E4 · 11.83 → 12.34: he puts the milk down on her empty desk and his hand pulls back out of frame */
function shotMilkLeft(c: Ctx, abs: number) {
  const down = smooth(phase(abs, EV.milkLeft, EV.milkLeft + 0.15));
  const away = smooth(phase(abs, EV.milkLeft + 0.17, EV.milkLeft + 0.38));
  c.save();
  camera(c, 380, 900, 1.6);
  filtered(c, "blur(5px)", (b) => classroom(b, abs, false), "classBack2");
  c.restore();
  classSun(c, abs, 1);
  deskFront(c, 540, 1180, 2.0, 3913);
  strawberryMilk(c, 500, lerp(820, 900, down), 2.0, 0.03, 3914);
  const wrist: Pt = [lerp(760, 960, away), lerp(lerp(640, 720, down), 260, away)];
  blob(c, tubePts([[1240, -120], [1080, 260], wrist], [190, 176, 160], false, true), 3915, 1.2);
  paint(c, "#f1f1ee", C.ink, 7);
  roundHand(c, wrist[0] - 10, wrist[1] + 10, 92, 3916);
}

function shotClass(c: Ctx, abs: number) {
  if (abs < EV.classFace) shotSeat(c, abs);
  else if (abs < BAR(5)) hisClassFace(c, abs, EV.classFace, "sad");
  else if (abs < EV.milkLeft) shotMilk(c, abs);
  else shotMilkLeft(c, abs);
}
/** the class today, through the old screen; a time card */
function memory(c: Ctx, abs: number) {
  oldFilm(c, abs, (k) => shotClass(k, abs), "memory");
  timeCard(c, abs, "今天 · 物理课", BAR(4) + 0.15, EV.classFace - 0.05);
}
/** D → E: the push into the photo carries on through the old-screen cut; her face in the photo becomes her, in class */
function intoMemory(c: Ctx, abs: number) {
  const p = phase(abs, EV.memIn, BAR(4));
  oldScreenCut(c, abs, p, (k) => shotHistory(k, abs), (k) => shotClass(k, abs), 0.5);
}

// ---------------------------------------------------------------- F · 12.34 → 16.43
function thumbsGiveUp(abs: number, sendAt: Pt): { right: FingerPos; left: FingerPos } {
  if (inWin(abs, EV.type1)) return typingThumbs(abs, EV.type1[0], EV.type1[1], 11);
  if (inWin(abs, EV.type2)) return typingThumbs(abs, EV.type2[0], EV.type2[1], 13);
  if (inWin(abs, EV.del1)) {
    const f = ((abs - EV.del1[0]) * 10) % 1;
    return { right: { x: BACKSPACE_AT[0], y: BACKSPACE_AT[1], touch: f < 0.5 ? 1 : 0.4 }, left: REST_L };
  }
  if (abs >= EV.type2[1] && abs < EV.send1 + 0.2) {
    const press = abs > EV.send1 - 0.06;
    const hover = smooth(phase(abs, EV.type2[1], EV.type2[1] + 0.35));
    return { right: { x: lerp(REST_R.x, sendAt[0], hover), y: lerp(REST_R.y, sendAt[1], hover), touch: press ? 1 : 0.15 }, left: REST_L };
  }
  return { right: REST_R, left: REST_L };
}
/** Typing a paragraph, deleting all of it, typing the one line — then sending it. The camera: still while reading,
 *  creeping in while he types (careful), a stop on the delete, onto the one line; when his thumb goes to 发送 it goes
 *  straight there (no hovering: decided) — a check on the press, a 1% kick — and the bubble goes up. */
function shotGiveUp(c: Ctx, abs: number) {
  let draft = "";
  if (abs < EV.del1[0]) draft = typed(HIS_DRAFT, abs, EV.type1[0], EV.type1[1]);
  else if (abs < EV.type2[0]) draft = deleted(HIS_DRAFT, abs, EV.del1[0], EV.del1[1]);
  else if (abs < EV.send1) draft = typed(GIVE_UP, abs, EV.type2[0], EV.type2[1]);
  const view = hisNightChat(abs, { draft: abs < EV.send1 ? draft : "", caret: abs < EV.send1, keyboard: true, sendHot: abs > EV.send1 - 0.06 && abs < EV.send1 + 0.1 ? 1 : 0 });
  const sendAt = sendButtonAt(c, { ...view, draft: GIVE_UP });
  const base = aim(300, 640, 540, 960, 0.95);
  const typing = smooth(phase(abs, EV.type1[0], EV.del1[0]));
  const onLine = aim(300, 830, 540, 1010, 1.1);
  const toSend = aim(sendAt[0], sendAt[1], 760, 1120, 1.12);
  let p = aimLerp(base, onLine, 0.6 * typing);
  p = aimLerp(p, onLine, smooth(phase(abs, EV.type2[0], EV.type2[1])));
  p = aimLerp(p, toSend, easeOut(phase(abs, EV.type2[1], EV.type2[1] + 0.3)));
  const j = kick(abs, EV.send1, 0.12) + kick(abs, EV.del1[0], 0.1) * 0.6;
  p = { ...p, s: p.s * (1 + 0.012 * j) };
  // after the send: it breathes out, a little back
  p = aimLerp(p, aim(300, 640, 540, 960, 1.0), softStart(phase(abs, EV.send1 + 0.02, EV.room)));
  hisBokeh(c, abs, { dark: 0.2 + 0.15 * typing, shift: [0, (p.cy - 900) * 0.1] });
  drawPhone(c, abs, p, (s) => chatScreen2(s, abs, view), { thumbs: [thumbsGiveUp(abs, sendAt).right, thumbsGiveUp(abs, sendAt).left] });
  vignette(c, 0.35, 540, 900, 420, 1200);
}

/** 15.41 → 16.43: his room. He puts the phone down on the duvet, face down, and reaches over for the lamp — off on
 *  the "and" of beat 31. The room goes cold: moonlight from the window, the bulbs dimmed. */
function shotLampOff(c: Ctx, abs: number) {
  const on = abs < EV.lampOff ? 1 : 0;
  const down = smooth(phase(abs, EV.room + 0.02, EV.room + 0.32));
  const reach = smooth(phase(abs, EV.lampOff - 0.34, EV.lampOff - 0.03));
  const back = smooth(phase(abs, EV.lampOff + 0.05, EV.lampOff + 0.3));
  // in the dark he can't leave it: his right hand goes back to the phone and lifts it, its light comes up on his face
  // — the move carries on into the next shot, where the phone rises into frame
  const grab = smooth(phase(abs, EV.lampOff + 0.02, EV.lampOff + 0.14));
  const lift = smooth(phase(abs, EV.lampOff + 0.13, BAR(8)));
  const settle = softStart(phase(abs, EV.room, BAR(8)));
  const sx = 420,
    sy = 640,
    ss = 0.95;
  c.save();
  camera(c, 420, 760, 1.32 - 0.04 * settle, 0, 120, 60);
  hisRoom(c, abs, { lamp: on, lights: on ? 0.7 : 0.25 });
  const hand: Pt = reach > 0 && back < 1 ? [lerp(lerp(-58, -40, down), (ROOM.lamp[0] - sx) / ss + 10, reach * (1 - back)), lerp(lerp(330, 460, down), (ROOM.lamp[1] + 40 - sy) / ss, reach * (1 - back))] : [lerp(-58, -40, down), lerp(330, 460, down)];
  // where the phone lies on the duvet (design) and in his head units
  const lying: Pt = [sx + 120, 1040];
  const lyingH: Pt = [(lying[0] - sx) / ss, (lying[1] - sy) / ss];
  const rest: Pt = [lerp(58, 40, down), lerp(330, 460, down)];
  const handR: Pt = abs < EV.lampOff ? rest : lift > 0 ? [lerp(lyingH[0], 52, lift), lerp(lyingH[1], 300, lift)] : [lerp(rest[0], lyingH[0], grab), lerp(rest[1], lyingH[1], grab)];
  hisInBed(c, {
    arms: "custom",
    handL: hand,
    handR,
    shapeL: reach > 0.5 && back < 0.5 ? "open" : "hold",
    shapeR: "hold",
    eyes: lift > 0.5 ? "open" : "sad",
    brows: "sad",
    mouth: "flat",
    look: lift > 0.2 ? [0, 0.7] : reach > 0.3 && back < 0.6 ? [-0.8, 0.2] : [-0.2, 0.8],
    tilt: 0.05,
  }, { lamp: on, phone: lift > 0.5 ? (lift - 0.5) * 2 : 0, x: sx, y: sy, s: ss, phoneAt: [sx + handR[0] * ss, sy + (handR[1] - 50) * ss] });
  hisDuvet(c, 1 - on);
  // the phone: put down face down on the duvet (upright in his hands → a flat dark slab); then lifted again
  c.save();
  if (lift > 0) {
    const hx = sx + handR[0] * ss,
      hy = sy + (handR[1] - 60) * ss;
    if (lift < 0.35) {
      c.translate(hx, hy);
      c.rotate(0.12 * (1 - lift / 0.35));
      rr(c, -80, -22 - 30 * lift, 160, 44 + 90 * lift, 14);
      paint(c, "#1d2333", C.ink, 5);
    } else {
      hisPhoneBack(c, hx, hy, 92 * ss, 176 * ss * Math.min(1, (lift - 0.2) / 0.5), 0);
      // the screen's light spilling over the top edge, onto his face
      c.save();
      c.globalCompositeOperation = "screen";
      glow(c, hx, hy - 90 * ss, 260, `rgba(160,190,255,${(0.45 * (lift - 0.35) / 0.65).toFixed(3)})`);
      c.restore();
    }
  } else {
    const px = lerp(sx, lying[0], down),
      py = lerp(sy + 236 * ss, lying[1], down);
    if (down < 0.6) hisPhoneBack(c, px, py, 92 * ss, 176 * ss * (1 - (0.6 * down) / 0.6), 0.2 * down);
    else {
      c.translate(px, py);
      c.rotate(0.12);
      rr(c, -80, -22, 160, 44, 14);
      paint(c, "#1d2333", C.ink, 5);
      inkLine(c, [[-66, -12], [60, -14]], 3796, 2, "rgba(170,190,230,0.35)", 0.3);
    }
  }
  c.restore();
  c.restore();
  if (!on) {
    // after the click: a cold, dark room — only the moon through the window
    c.save();
    c.globalCompositeOperation = "multiply";
    c.fillStyle = "rgba(120,140,200,0.55)";
    c.fillRect(-60, -60, W + 120, H + 120);
    c.restore();
    vignette(c, 0.75, 540, 900, 260, 1150);
  } else vignette(c, 0.35, 540, 900, 380, 1250);
}

// ---------------------------------------------------------------- the act
export function createScene(options: SceneOptions) {
  return designScene(options, 0, (c, abs) => {
    if (abs < EV.whip1) shotSent(c, abs);
    else if (abs < EV.hisFace) shotHook(c, abs);
    else if (abs < BAR(2)) shotFace(c, abs);
    else if (abs < EV.memIn) shotHistory(c, abs);
    else if (abs < BAR(4)) intoMemory(c, abs);
    else if (abs < BAR(6)) memory(c, abs);
    else if (abs < EV.room) shotGiveUp(c, abs);
    else shotLampOff(c, abs);
    bloom(c, 0.22, 24);
  });
}
