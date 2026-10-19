// 第一幕（0 – 16.43）· 主歌1 · 他的视角（重置版：剧情和时间点不变，画面、镜头、构图、光影按最新标准重做）
//  A 0–0.84    首帧先拍他：深夜坐在床上，刚把那一大段发出去（屏幕光在脸上一跳），屏住呼吸等 → 顺着视线往下甩
//  B 0.84–2.88 手机：她的「正在输入」三个点的气泡闪两次（镜头屏息往前凑、又退回）→ 1.86 "k" 落在同一个位置：回弹急推、震、
//              黄圈 → 愣住慢推、四周压暗（YouTube 版：「嗯」= "k"，聊天是 Instagram 私信，见 dm.ts）
//  C 2.88–4.16 他的脸：急推一震 → 愣住 → 难过、低头、慢推、歪、光变冷
//  D 4.16–8.25 手机：往上翻到 7 月，停住时镜头落到近处读 → 点她 7 月消息旁的头像 → 朋友圈滑进来，镜头跟着弹到动态上，几乎不动、红圈「5分钟前」→ 越推越快进合照
//  E 8.25–12.34 回忆（老式屏幕竖线）：越过他的课桌看她 → 她转身 → 课本挡脸 → 他低头 → 放学他的主观镜头递牛奶，她被小美拉走 → 牛奶留在空桌上
//  F 12.34–16.43 手机上打一大段 → 输入框特写：全删、只打出「以后不打扰你了」→ 一镜到底：他的脸，按下发送，屏幕的光
//                一跳 → 镜头从脸上直接拉回整个房间，他把手机扣在被子上、伸手关灯 → 黑暗里又拿起手机
import "./locale";
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase, smooth } from "@frame/engine/math";
import { C, Ctx, H, Pt, W, backOut, blob, bloom, camera, designScene, easeOut, fillBg, filtered, glow, inkLine, lightShaft, motes, oldFilm, oldScreenCut, oval, paint, poly, rbox, rimFigure, rr, shake, shaded, smearV, text, F, tubePts, vgrad } from "@materials/s0rrow/code/draw";
import { drawHand, drawKid } from "@materials/s0rrow/code/kid";
import { CAST, drawPerson } from "@materials/s0rrow/code/people";
import { bookFingers, classroomBoard, deskFront, strawberryMilk, textbook } from "@materials/s0rrow/code/places";
import { classroom, paneLight } from "@materials/s0rrow/code/sets";
import { POST, avatarAt, bubbleAt, chatScreen2, postScreen, scrollTo, typingAt } from "./dm";
import type { FingerPos } from "@materials/s0rrow/code/hand";
import { SH, SW } from "@materials/s0rrow/code/phone";
import { GIVE_UP, HIS_DRAFT, deleted, hisNightChat, inWin, typed, typingK, typingThumbs } from "./story";
import { BAR, EV } from "./timeline";
import { SELFIE_FACE, fitPhoto, photoPoint, selfiePhoto } from "./photos";
import { PhoneSpec, aim, aimLerp, clueGlow, drawPhone, kick, lerp, onPhone, pulseRings, softStart, spotlight, tapAt, timeCard, vignette, whip } from "./shots";
import { ROOM, SIT, chairBack, classFromSeat, hisBokeh, hisDuvet, hisInBed, hisPhoneBack, hisRoom } from "./world";

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
/** his phone at night for the hook (keyboard still up from typing the long message). Her typing bubble shows twice;
 *  the chat makes room for it the first time and keeps the room, so her "k" lands right where the dots were. */
const hookView = (abs: number) =>
  hisNightChat(abs, {
    typing: abs < EV.um1 ? typingK(abs, [EV.typing1, EV.typing2]) : 0,
    typingRoom: abs < EV.um1 ? smooth(phase(abs, EV.typing1[0], EV.typing1[0] + 0.15)) : 0,
    keyboard: true,
  });
/** The chat with the keyboard up. The camera holds its breath and leans toward her typing bubble each time it shows
 *  (and backs off when it goes); her "k" lands in its place: a jolt and a rush onto it, two yellow rings; then it
 *  hardly moves — a 6% creep — while everything round the "k" slowly goes dark. */
function hookPlacement(c: Ctx, abs: number): { p: PhoneSpec; um: Pt; dots: { x: number; y: number; w: number; h: number } } {
  const view = hookView(Math.max(abs, EV.um1 + 0.2));
  const idx = view.items.length - 1;
  const b = bubbleAt(c, view, idx) ?? { x: 84, y: 626, w: 64, h: 86 };
  const um: Pt = [b.x + b.w / 2, b.y + b.h / 2];
  const dots = typingAt(c, hookView(EV.typing2[0] + 0.1));
  // under the hook text: the newest bubble low in the frame, the keyboard off the bottom
  const base = aim(300, 640, 540, 1110, 1.0);
  const breath = (w: readonly [number, number]) => smooth(phase(abs, w[0], w[0] + 0.2)) * (1 - smooth(phase(abs, w[1], w[1] + 0.28)));
  const lean = breath(EV.typing1) + breath(EV.typing2);
  let p = aimLerp(base, aim(dots.x + dots.w / 2, dots.y + dots.h / 2, 430, 1090, 1.08), 0.6 * lean);
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
  return { p, um, dots };
}
function shotHook(c: Ctx, abs: number) {
  const [off, sm] = whip(abs, EV.whip1, -1150, 0.15, 0.24);
  smearV(c, (k) => {
    const { p, um, dots } = hookPlacement(k, abs);
    const after = smooth(phase(abs, EV.um1 + 0.2, EV.hisFace));
    hisBokeh(k, abs, { shift: [0, off * 0.2], dark: 0.3 * after });
    k.save();
    k.translate(0, off);
    drawPhone(k, abs, p, (s) => chatScreen2(s, abs, hookView(abs)), { halo: 1, buzz: abs >= EV.um1 ? 1 - phase(abs, EV.um1, EV.um1 + 0.25) : 0 });
    // the clue, for the audience: her typing bubble, twice
    const [tx, ty] = onPhone(p, dots.x + dots.w / 2, dots.y + dots.h / 2);
    for (const w of [EV.typing1, EV.typing2]) clueGlow(k, tx, ty, 200 * p.s, inWin(abs, w) ? 1 : 0);
    pulseRings(k, abs, tx, ty, (dots.w / 2 + 26) * p.s, (dots.h / 2 + 16) * p.s, [EV.typing1[0], EV.typing2[0]], p.rot ?? 0);
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
/** how far back he scrolls: July, with its date just under the header */
const julyScroll = (c: Ctx) => scrollTo(c, hisNightChat(4.5), 0, 172);
/** her "btw strawberry milk is my favorite" in July (index in the chat) — he taps her avatar beside it */
const MILK_MSG = 5;
/** the post's photo: the selfie fitted into the post's square (kept a little above centre: the faces and the cups),
 *  and where her face lands on the screen */
const POST_PHOTO = { ...POST.photo, fy: 0.45 };
const PHOTO_FACE: Pt = photoPoint(POST_PHOTO.x, POST_PHOTO.y, POST_PHOTO.w, POST_PHOTO.h, SELFIE_FACE[0], SELFIE_FACE[1], 0.5, POST_PHOTO.fy);
/** her avatar beside the July "strawberry milk" message (screen coordinates, chat scrolled back to July) */
function julyAvatar(c: Ctx): Pt {
  return avatarAt(c, hisNightChat(4.5, { scroll: julyScroll(c) }), MILK_MSG) ?? [44, 900];
}
/** The lyric "It looks like you are losing interest", one phone, the camera moving with what he does (user: stop on
 *  July, no flick back down, straight into her 朋友圈). Rhythm: quick on his actions, still on what hurts.
 *  · 4.16 the whip lands on the chat; he scrolls back — the camera leans in a little as it runs (he's looking for
 *    something), and on the stop (4.93) it lands close on July with a small overshoot: big, long, lively messages.
 *  · it reads them top to bottom, slowly and steadily, down to 「对了我最喜欢草莓牛奶了」, and creeps toward her avatar
 *    beside it — 6.21 he taps it (a small jolt).
 *  · her 朋友圈 slides in and the camera springs back with it onto her post (surprise — she was happy, 5 minutes ago):
 *    「今天好开心～」, the selfie; then it barely moves (a 5% creep, the edges going dark) while 「5分钟前」 gets its red
 *    circle — and from 7.45 it speeds up into the photo, her face: the way into his memory of today's class. */
function historyPlacement(abs: number, avatar: Pt): PhoneSpec {
  const read = aim(300, 640, 540, 960, 1.0);
  const look = smooth(phase(abs, EV.scrollUp[0], EV.scrollUp[1]));
  let p = aimLerp(read, aim(300, 640, 540, 940, 1.12), look);
  const land = backOut(phase(abs, EV.scrollUp[1] - 0.06, EV.scrollUp[1] + 0.22));
  const drift = smooth(phase(abs, EV.scrollUp[1] + 0.22, EV.tapAvatar - 0.3));
  // (English messages run longer: a little wider than the Chinese 1.7, the July date just under the label)
  const julyTop = aim(300, 206, 540, 330, 1.55, -0.015);
  const julyEnd = aim(300, avatar[1] - 30, 540, 840, 1.78, -0.01);
  p = aimLerp(p, aimLerp(julyTop, julyEnd, drift), land);
  // toward the avatar he's about to tap, then a jolt on the tap
  const toTap = smooth(phase(abs, EV.tapAvatar - 0.3, EV.tapAvatar));
  p = aimLerp(p, aim(avatar[0] + 140, avatar[1] - 20, 500, 860, 1.84, -0.01), 0.35 * toTap);
  const j = kick(abs, EV.tapAvatar, 0.1);
  p = { ...p, s: p.s * (1 + 0.012 * j) };
  // the page slides in; the camera springs back onto the post with it
  const onPost = backOut(phase(abs, EV.pagePush[0] - 0.02, EV.pagePush[1] + 0.06));
  const post = aim(170, 960, 450, 1000, 1.28, 0);
  const hold = smooth(phase(abs, EV.pagePush[1] + 0.06, 7.45));
  p = aimLerp(p, aimLerp(post, aim(200, 950, 470, 990, 1.28 * 1.05, 0), hold), onPost);
  // into the photo, faster and faster
  const mk = Math.pow(phase(abs, 7.45, EV.memIn), 2.2);
  return aimLerp(p, aim(PHOTO_FACE[0], PHOTO_FACE[1], 540, 880, 2.6), mk);
}
function historyScreen(c: Ctx, abs: number) {
  const su = smooth(phase(abs, EV.scrollUp[0], EV.scrollUp[1]));
  const scroll = julyScroll(c) * su;
  const push = smooth(phase(abs, EV.pagePush[0], EV.pagePush[1]));
  const mark = smooth(phase(abs, 6.95, 7.3));
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
    postScreen(c, abs, { dark: true, mark, photo: (k, x, y, w, h) => fitPhoto(k, x, y, w, h, selfiePhoto, 0.5, POST_PHOTO.fy) });
    c.fillStyle = "rgba(0,0,0,0.35)";
    c.fillRect(-14, 0, 14, SH);
    c.restore();
  }
}
function historyThumb(abs: number, avatar: Pt): FingerPos | null {
  if (inWin(abs, EV.scrollUp)) {
    const f = ((abs - EV.scrollUp[0]) * 3.4) % 1;
    return { x: 420, y: 520 + f * 420, touch: f < 0.8 ? 1 : 0 };
  }
  return tapAt(abs, EV.tapAvatar, avatar[0], avatar[1]);
}
function shotHistory(c: Ctx, abs: number) {
  const [off, sm] = whip(abs, BAR(2), -900, 0.13, 0.22);
  const avatar = julyAvatar(c);
  const p = historyPlacement(abs, avatar);
  const sad = smooth(phase(abs, EV.pagePush[1], 7.45));
  smearV(c, (k) => {
    hisBokeh(k, abs, { shift: [0, off * 0.2 + (p.cy - 960) * 0.12], dark: 0.25 + 0.2 * sad, zoom: 1 + 0.25 * smooth(phase(abs, EV.pagePush[0], EV.memIn)) });
    k.save();
    k.translate(0, off);
    drawPhone(k, abs, p, (s) => historyScreen(s, abs), { thumbs: [historyThumb(abs, avatar)] });
    k.restore();
  }, sm, "whipD");
  // while he looks at her post, the edges close in
  vignette(c, 0.3 * sad, 540, 960, 420, 1200);
}

// ---------------------------------------------------------------- E · the class today, remembered (8.25 → 12.34)
/** his desk in the foreground: open notebook with a little sunflower doodle (her hair clip), the strawberry milk he
 *  bought her, his hand on a pen — warm sun across it from the window on the left */
export function hisDesk(c: Ctx, abs: number) {
  const top: Pt[] = [[-140, 1330], [1220, 1318], [1320, 2000], [-240, 2000]];
  shaded(c, () => poly(c, top, 3700, 1.4), "#d9a96c", () => {
    // wood grain
    for (let k = 0; k < 9; k++) inkLine(c, [[-160, 1370 + k * 70], [400, 1366 + k * 70 + 8], [1260, 1362 + k * 70 - 4]], 3701 + k, 2.2, "rgba(130,85,40,0.22)", 1.2);
    // the desk's front edge catching the light
    inkLine(c, [[-140, 1336], [1220, 1324]], 3710, 6, "rgba(255,236,200,0.6)");
  }, C.ink, 6);
  // a pencil case and an eraser
  c.save();
  c.translate(860, 1470);
  c.rotate(0.12);
  rbox(c, -120, -36, 240, 72, 30, 3711, 0.8);
  paint(c, "#5d8fc9", C.ink, 5);
  inkLine(c, [[-100, -4], [100, -8]], 3712, 3, "#3d6fae");
  c.restore();
  rbox(c, 660, 1370, 70, 40, 8, 3713, 0.6);
  paint(c, "#f4a6b4", C.ink, 4);
  // the open notebook, and in its margin the little sunflower he keeps drawing (her hair clip)
  poly(c, [[330, 1430], [800, 1420], [850, 1760], [290, 1776]], 3703, 1.2);
  paint(c, "#fbfaf2", C.ink, 5);
  inkLine(c, [[565, 1424], [570, 1768]], 3704, 3, "#c8c1ae");
  for (let i = 0; i < 6; i++) {
    inkLine(c, [[340 - i * 6, 1480 + i * 46], [550, 1476 + i * 46]], 3705 + i, 2, "rgba(90,120,170,0.35)");
    inkLine(c, [[585, 1474 + i * 46], [795 + i * 8, 1470 + i * 46]], 3720 + i, 2, "rgba(90,120,170,0.35)");
  }
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    inkLine(c, [[450 + Math.cos(a) * 24, 1600 + Math.sin(a) * 19], [450 + Math.cos(a) * 46, 1600 + Math.sin(a) * 36]], 3730 + k, 3.5, "#d9a020");
  }
  oval(c, 450, 1600, 20, 16, 3740, 0.6);
  paint(c, "#8a5a2a", C.ink, 2.5);
  inkLine(c, [[380, 1680], [520, 1676]], 3741, 2.5, "rgba(90,120,170,0.5)");
  strawberryMilk(c, 150, 1530, 0.78, -0.06, 3742);
  const sway = Math.sin(abs * 3) * 4;
  const wrist: Pt = [800 + sway, 1660];
  blob(c, tubePts([[1200, 2080], [980, 1830], wrist], [124, 112, 100], false, true), 3743, 1.2);
  paint(c, C.hoodie, C.ink, 6);
  inkLine(c, [[1100, 1990], [990, 1850]], 3744, 14, C.hoodieDark);
  inkLine(c, [[880, 1745], [842, 1705]], 3747, 20, C.hoodieDark);
  inkLine(c, [[688 + sway, 1556], [790 + sway, 1644]], 3745, 10, C.ink);
  inkLine(c, [[688 + sway, 1556], [790 + sway, 1644]], 3745, 6, "#3d6fd1");
  roundHand(c, wrist[0] - 6, wrist[1] - 6, 46, 3746);
  // the window's panes of sun across the desk
  paneLight(c, [[-60, 1360], [480, 1350], [700, 1960], [-60, 1980]], "255,232,180", 0.2, 10, "deskPanes");
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
  // the room behind her, soft, moving less than she does
  filtered(c, "blur(3.2px)", (b) => {
    camera(b, 540, 900, 1.08 + 0.02 * drift + 0.025 * push, 0, 0, -30);
    classFromSeat(b, abs, { sun: 1 });
  }, "classSeat");
  c.save();
  const [sx, sy] = shake(abs, 7 * j, 9);
  camera(c, gx, gy + 120, z, 0, sx, sy);
  const chairY = gy + 300 * gs;
  // where her hand rests on the chair back once she's turned round (screen left, her right hand)
  const rest: Pt = [gx - 136 * gs, chairY + 4];
  const girl = (k: Ctx) => {
    if (!turned) drawKid(k, gx, gy, gs, { who: "girl", outfit: "cardigan", body: "bust", view: "back", arms: "down", headY: 4 * Math.sin(abs * 1.6) });
    else if (!hidden) drawKid(k, gx, gy, gs, { who: "girl", outfit: "cardigan", body: "bust", eyes: "wide", mouth: "o", look: [0.05, 0.1], arms: "custom", handL: [(rest[0] - gx) / gs, (rest[1] - gy) / gs], shapeL: "hidden", handR: [118, 430], tilt: -0.04, turn: 0.15, blush: 0.55 });
    else drawKid(k, gx, gy, gs, { who: "girl", outfit: "cardigan", body: "bust", eyes: "shut", mouth: "bite", blush: 1, arms: "custom", handL: [-150, 170], handR: [150, 170], shapeL: "hidden", shapeR: "hidden" });
  };
  rimFigure(c, girl, -1, -0.4, "rgb(255,236,200)", 0.6, 6);
  // her chair's back, in front of her (she sits in the row in front of his)
  chairBack(c, gx, chairY, gs);
  if (turned && !hidden) drawHand(c, rest[0], rest[1] + 6, gs, Math.PI / 2 + 0.25, "flat", false, false, 3790, true);
  if (hidden) {
    const up = backOut(phase(abs, EV.hide1, EV.hide1 + 0.16));
    const bx = gx + 6,
      by = gy + lerp(420, 110, up) * gs;
    const rot = -0.05 + 0.03 * Math.sin((abs - EV.hide1) * 18) * (1 - phase(abs, EV.hide1, EV.hide1 + 0.5));
    textbook(c, bx, by, gs, rot);
    bookFingers(c, bx, by, gs, rot);
  }
  c.restore();
  // dust in the sun between her and him
  motes(c, abs, 360, 900, 320, 420, 14, 3795, "255,240,205", 0.5, 3);
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

/** her schoolbag standing open on her desk, the physics book half in, a strawberry charm on the zip; (x, y) = the
 *  middle of the bag */
export function herBag(c: Ctx, x: number, y: number, s: number, rot = -0.05) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  rbox(c, -130, -70, 260, 200, 46, 3812, 1);
  paint(c, "#2b3966", C.ink, 5);
  c.save();
  c.translate(10, -70);
  c.rotate(0.1);
  rbox(c, -92, -96, 184, 120, 6, 3813, 0.8);
  paint(c, "#5d8fc9", C.ink, 4.5);
  rbox(c, -92, -96, 184, 22, 4, 3814, 0.6);
  paint(c, "#e8524a", C.ink, 3);
  text(c, "PHYSICS", 0, -38, { size: 40, font: F.cn, fill: "#fff" });
  c.restore();
  shaded(c, () => rbox(c, -136, -40, 272, 180, 44, 3815, 1), "#34477a", () => {
    oval(c, 70, 110, 140, 90, 3816, 1);
    paint(c, "rgba(0,0,0,0.18)", null);
  }, C.ink, 5);
  rbox(c, -86, 30, 172, 96, 26, 3817, 0.8);
  paint(c, "#2b3966", C.ink, 4);
  inkLine(c, [[-120, -30], [120, -32]], 3818, 3, "#c9d2e6");
  // the strawberry charm on the zip
  inkLine(c, [[96, -30], [100, 10]], 3819, 2.5, C.ink);
  blob(c, [[86, 12], [100, 6], [114, 12], [110, 34], [100, 42], [90, 34]], 3820, 0.6);
  paint(c, "#ff4d6a", C.ink, 3);
  c.restore();
}

/** her desk seen from where he stands (a little from above, so the top shows): her open schoolbag with the physics
 *  book half in and a strawberry charm on the zip, the window's sun across it (she leaves it behind — and comes back
 *  for it, and finds the milk). It runs off the left of
 *  the frame, so it hides her and 小美 below the chest wherever they are. */
function herDesk(c: Ctx) {
  inkLine(c, [[800, 1700], [808, 1990]], 3800, 14, "#5a5a62");
  inkLine(c, [[110, 1720], [104, 1990]], 3801, 14, "#5a5a62");
  shaded(c, () => poly(c, [[-170, 1470], [870, 1450], [860, 1720], [-160, 1744]], 3802, 1.2), "#b78a52", () => {
    inkLine(c, [[-170, 1494], [870, 1474]], 3803, 22, "rgba(0,0,0,0.12)");
  }, C.ink, 5.5);
  paneLight(c, [[-160, 1520], [380, 1500], [470, 1740], [-160, 1760]], "255,232,180", 0.16, 6, "herDeskFront");
  shaded(c, () => poly(c, [[-130, 1246], [800, 1234], [872, 1452], [-176, 1474]], 3804, 1.2), "#ddb074", () => {
    for (let k = 0; k < 4; k++) inkLine(c, [[-160, 1292 + k * 46], [380, 1286 + k * 46], [860, 1278 + k * 46]], 3805 + k, 2, "rgba(130,85,40,0.2)", 1);
    inkLine(c, [[-176, 1468], [872, 1446]], 3809, 6, "rgba(255,236,200,0.6)");
  }, C.ink, 5.5);
  herBag(c, 104, 1330, 1);
  paneLight(c, [[-180, 1250], [420, 1240], [560, 1460], [-180, 1480]], "255,232,180", 0.18, 8, "herDeskPanes");
}

/** His right arm seen from his own eyes, reaching out: the hoodie sleeve comes in from the bottom-right corner, wide
 *  close to us and narrowing to the cuff at `wrist` (foreshortened), a slight bend at the elbow, folds across it, the
 *  side away from the window in shade, ribbing at the cuff. The hand is drawn by the caller. */
function hisArmPov(c: Ctx, wrist: Pt) {
  const base: Pt = [1170, 2130];
  const d = Math.atan2(wrist[1] - base[1], wrist[0] - base[0]);
  const nx = -Math.sin(d),
    ny = Math.cos(d);
  const at = (t: number, bulge = 0): Pt => [lerp(base[0], wrist[0], t) - nx * bulge, lerp(base[1], wrist[1], t) - ny * bulge];
  const spine = [base, at(0.45, 30), at(0.8, 8), wrist];
  shaded(c, () => blob(c, tubePts(spine, [600, 380, 214, 126], false, true), 3770, 1.2), C.hoodie, () => {
    // the side away from the window in shade
    blob(c, tubePts(spine.map(([x, y]) => [x - nx * 110, y - ny * 110] as Pt), [420, 220, 110, 60], false, true), 3771, 1);
    paint(c, "rgba(20,40,90,0.25)", null);
    // folds where the sleeve bunches at the elbow and the forearm
    for (const [t, w] of [[0.3, 150], [0.45, 110], [0.6, 80]] as [number, number][]) {
      const [x, y] = at(t, 24);
      inkLine(c, [[x + nx * w, y + ny * w], [x + Math.cos(d) * 18, y + Math.sin(d) * 18], [x - nx * w * 0.6, y - ny * w * 0.6]], 3772 + t * 100, 4, C.hoodieDark);
    }
    // ribbing at the cuff
    const [cx, cy] = at(0.93);
    inkLine(c, [[cx + nx * 70, cy + ny * 70], [cx - nx * 70, cy - ny * 70]], 3778, 34, C.hoodieDark);
    for (let k = -2; k <= 2; k++) inkLine(c, [[cx + nx * k * 22 - Math.cos(d) * 14, cy + ny * k * 22 - Math.sin(d) * 14], [cx + nx * k * 22 + Math.cos(d) * 14, cy + ny * k * 22 + Math.sin(d) * 14]], 3779 + k, 2.5, "rgba(20,40,90,0.4)");
  }, C.ink, 7);
}

/** E3 · 10.30 → 11.83 after class, from his eyes (his POV — the label says 他的视角; three layers of depth: his arm big and
 *  soft in the corner, her at her desk, the classroom): she's packing her bag; 小美 waits behind her, smaller and soft.
 *  The bell; 小美 waves her to come; his arm comes up holding out the strawberry milk; she looks up at him (at us),
 *  startled and red; 小美 dashes off, yanks her by the wrist from outside the frame and she's gone; his hand is left
 *  holding the milk out over the empty desk, and slowly sinks as he looks down. */
function shotMilk(c: Ctx, abs: number) {
  const offer = smooth(phase(abs, EV.milkOffer - 0.24, EV.milkOffer + 0.08));
  const grab = smooth(phase(abs, EV.flee - 0.22, EV.flee));
  const flee = easeOut(phase(abs, EV.flee, EV.flee + 0.34));
  const sink = smooth(phase(abs, EV.flee + 0.4, EV.milkLeft));
  const push = smooth(phase(abs, BAR(5), EV.milkLeft));
  const startled = abs > EV.milkOffer;
  // the same classroom as in class (from his side, towards the board), emptying out
  filtered(c, "blur(4.5px)", (b) => {
    camera(b, 560, 860 + 30 * sink, 1.32 + 0.03 * push, 0, 0, 40);
    classFromSeat(b, abs, { sun: 1, students: false });
  }, "classMilk");
  c.save();
  // when she's gone he looks down: everything sinks a little
  camera(c, 480, 1000 + 50 * sink, 1 + 0.05 * push);
  const dx = -900 * flee;
  const dash = smooth(phase(abs, EV.flee - 0.22, EV.flee - 0.06));
  const yank = backOut(phase(abs, EV.flee - 0.1, EV.flee + 0.02));
  // 小美, further back (smaller, soft): waves her to come → dashes off left → (out of frame) yanks her by the wrist
  const gx = 450 + dx,
    gy = 900,
    gs = 1.2;
  const mx = lerp(150, -300, dash) + dx,
    my = lerp(740, 790, dash),
    ms = lerp(0.74, 0.9, dash);
  const wave = abs < EV.milkOffer ? clamp((abs - BAR(5)) / 0.12) * (0.6 + 0.4 * Math.sin(abs * 22)) : 0;
  filtered(c, "blur(2px)", (k) =>
    drawPerson(k, mx, my, ms, {
      ...CAST.mei,
      x: 0,
      face: dash > 0.05 ? "laugh" : abs >= EV.milkOffer ? "o" : "smile",
      body: "full",
      arms: wave > 0 ? "waveL" : "down",
      wave,
      tilt: -0.2 * dash,
      seed: 3760,
    }), "mei");
  // her: packing her bag → startled by the milk, looks up at it, red → yanked away left by the wrist
  const handL: Pt = [lerp(-140, -300, yank), lerp(400, 150, yank)];
  const wristG: Pt = [gx + handL[0] * gs, gy + handL[1] * gs];
  const girl = (k: Ctx) =>
    drawKid(k, gx, gy, gs, {
      who: "girl",
      outfit: "cardigan",
      body: "bust",
      eyes: abs >= EV.flee - 0.06 ? "shut" : startled ? "wide" : "open",
      mouth: abs >= EV.flee - 0.06 ? "bite" : startled ? "o" : "flat",
      look: startled ? [0.12, -0.32] : [-0.5, 0.8],
      blush: startled ? 1 : 0.35,
      headY: startled ? -8 : 6,
      headX: -14 * yank,
      tilt: abs >= EV.flee - 0.06 ? -0.16 : startled ? 0.05 : -0.04,
      turn: startled && abs < EV.flee - 0.06 ? 0.08 : 0,
      ...(yank > 0.01 ? { arms: "custom" as const, handL, shapeL: "hidden" as const, handR: [140, 420] as Pt } : { arms: "down" as const }),
    });
  rimFigure(c, girl, -1, -0.4, "rgb(255,236,200)", 0.5, 6);
  // 小美's arm coming in from the left edge, her fist round the wrist
  if (yank > 0.01) {
    blob(c, tubePts([[wristG[0] - 300, wristG[1] - 70], [wristG[0] - 120, wristG[1] - 20], wristG], [70, 62, 56], false, false), 3764, 1);
    paint(c, CAST.mei.top ?? "#8fc1e8", C.ink, 5);
    roundHand(c, wristG[0], wristG[1], 36, 3765, CAST.mei.skin ?? C.skin);
  }
  if (flee > 0) {
    c.save();
    c.globalAlpha = 1 - phase(abs, EV.flee + 0.2, EV.flee + 0.45);
    for (let k = 0; k < 4; k++) inkLine(c, [[gx + 220 + k * 24, 800 + k * 110], [gx + 400 + k * 30, 806 + k * 110]], 3766 + k, 5);
    c.restore();
  }
  herDesk(c);
  c.restore();
  // his arm, from his eyes: in from the bottom-right corner (close: big, soft, moves most), holding out the milk —
  // and after she's gone it stays out over the empty desk, then sinks
  c.save();
  camera(c, 480, 1000 + 70 * sink, 1 + 0.08 * push);
  const wrist: Pt = [lerp(980, 730, offer) + 40 * sink, lerp(2200, 1130, offer) + 220 * sink];
  const tip = -0.06 + 0.16 * sink;
  const inCarton = (h: Ctx, draw: () => void) => {
    h.save();
    h.translate(wrist[0] - 64, wrist[1] - 129);
    h.rotate(tip);
    h.scale(0.92, 0.92);
    draw();
    h.restore();
  };
  if (offer > 0.01)
    filtered(c, "blur(2.6px)", (k) =>
      rimFigure(k, (f) => {
        strawberryMilk(f, wrist[0] - 64, wrist[1] - 129, 0.92, tip, 3790);
        hisArmPov(f, wrist);
        // the carton sits in his hand: the back of his hand on its right, the fingers wrapped across the front
        inCarton(f, () => {
          shaded(f, () => blob(f, [[16, 26], [60, 8], [94, 34], [98, 116], [64, 150], [18, 132]], 3791, 0.8), C.skin, () => {
            oval(f, 80, 120, 50, 50, 3792, 1);
            paint(f, "rgba(196,140,90,0.3)", null);
          }, C.ink, 6);
          for (let j = 0; j < 4; j++) {
            rr(f, -48 + j * 6, 34 + j * 28, 84 - j * 8, 26, 13);
            paint(f, C.skin, C.ink, 4.5);
          }
        });
      }, -1, -0.3, "rgb(255,232,190)", 0.55, 9), "himFg");
  c.restore();
  const bell = 1 - phase(abs, 10.85, 11.05);
  if (abs >= BAR(5) && bell > 0) text(c, "RIIING!", 250, 360, { size: 60, font: F.cn, fill: "#fff", stroke: C.ink, lw: 10, alpha: bell * clamp((abs - BAR(5)) / 0.08) });
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
  // her bag is still there (she was dragged off without it)
  herBag(c, 110, 940, 1.5, -0.04);
  strawberryMilk(c, 500, lerp(820, 900, down), 2.0, 0.03, 3914);
  const wrist: Pt = [lerp(760, 960, away), lerp(lerp(640, 720, down), 260, away)];
  blob(c, tubePts([[1240, -120], [1080, 260], wrist], [190, 176, 160], false, true), 3915, 1.2);
  paint(c, C.hoodie, C.ink, 7);
  inkLine(c, [[wrist[0] + 60, wrist[1] - 120], [wrist[0] + 20, wrist[1] - 40]], 3917, 26, C.hoodieDark);
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
  timeCard(c, abs, "Today · Physics class", BAR(4) + 0.15, EV.classFace - 0.05);
}
/** D → E: the push into the photo carries on through the old-screen cut; her face in the photo becomes her, in class */
function intoMemory(c: Ctx, abs: number) {
  const p = phase(abs, EV.memIn, BAR(4));
  oldScreenCut(c, abs, p, (k) => shotHistory(k, abs), (k) => shotClass(k, abs), 0.5);
}

// ---------------------------------------------------------------- F · 12.34 → 16.43
/** F1 · 12.34 → 13.36 back in his room at night, on the phone: under her 「嗯」 he starts a long paragraph. The camera
 *  settles quickly from a little wide and tilted, then leans in slowly on the words as they come (careful, hoping). */
function shotTypeLong(c: Ctx, abs: number) {
  const view = hisNightChat(abs, { draft: typed(HIS_DRAFT, abs, EV.type1[0], EV.type1[1]), caret: true, keyboard: true });
  // the input box's last line (the box grows upward from the keyboard as he types)
  const inY = SH - 420 - 70;
  const settle = easeOut(phase(abs, BAR(6), BAR(6) + 0.22));
  const lean = smooth(phase(abs, BAR(6) + 0.18, EV.type1[1]));
  let p = aimLerp(aim(300, inY - 260, 540, 860, 0.98, 0.04), aim(300, inY - 200, 540, 900, 1.1, 0.015), settle);
  p = aimLerp(p, aim(270, inY - 60, 540, 930, 1.3, 0), lean);
  const t = typingThumbs(abs, EV.type1[0], EV.type1[1], 11);
  hisBokeh(c, abs, { dark: 0.2 + 0.1 * lean, shift: [0, (p.cy - 900) * 0.1] });
  drawPhone(c, abs, p, (k) => chatScreen2(k, abs, view), { thumbs: [t.right, t.left] });
  vignette(c, 0.35 + 0.1 * lean, 540, 900, 420, 1200);
}

/** F2 · 13.36 → 14.39 right up on the input box (her 「嗯」 above it): he holds delete and the whole paragraph goes —
 *  the picture jolts with the key; the box is empty for a breath; then, slowly, one line: 「以后不打扰你了」. The
 *  camera pushes in on it as it's typed. */
function shotRetype(c: Ctx, abs: number) {
  const draft = abs < EV.type2[0] ? deleted(HIS_DRAFT, abs, EV.del1[0], EV.del1[1]) : typed(GIVE_UP, abs, EV.type2[0], EV.type2[1]);
  const view = hisNightChat(abs, { draft, caret: true, keyboard: true });
  const j = kick(abs, EV.del1[0], 0.12);
  const deleting = inWin(abs, EV.del1) ? 1 : 0;
  const press = deleting * (((abs - EV.del1[0]) * 10) % 1 < 0.5 ? 1 : 0);
  const push = smooth(phase(abs, EV.type2[0], EV.type2[1] + 0.2));
  let p = aimLerp(aim(250, 790, 540, 840, 2.15, -0.035), aim(240, 800, 540, 860, 2.4, -0.015), push);
  p = { ...p, s: p.s * (1 + 0.015 * j), cy: p.cy + 5 * press + 10 * j };
  hisBokeh(c, abs, { dark: 0.35, shift: [0, 0] });
  drawPhone(c, abs, p, (k) => chatScreen2(k, abs, view));
  vignette(c, 0.45 + 0.1 * push, 540, 860, 360, 1150);
}

/** the duvet pulled over his lap runs on over the edge of the bed by the bedside table and hangs down (it covers the
 *  bottom of his hoodie on that side, close up and wide alike); `dark` 0..1 = lamp off, as hisDuvet */
function lapDrape(c: Ctx, dark: number) {
  const pts: Pt[] = [[520, 980], [400, 972], [320, 986], [252, 1008], [230, 1060], [226, 1150], [250, 1226], [330, 1258], [420, 1250], [500, 1200], [520, 1100]];
  blob(c, pts, 3850, 2);
  paint(c, vgrad(c, 990, 1256, [[0, "#5b74a6"], [1, "#3b4f7c"]]), C.ink, 6);
  c.save();
  blob(c, pts, 3850, 2);
  c.clip();
  for (const [x, y] of [[300, 1080], [410, 1150], [330, 1200]] as Pt[]) {
    c.fillStyle = "rgba(230,236,255,0.55)";
    c.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2,
        r = k % 2 ? 4 : 10;
      c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    c.fill();
  }
  inkLine(c, [[270, 1040], [290, 1130], [280, 1220]], 3851, 4, "rgba(30,40,80,0.45)");
  inkLine(c, [[350, 1010], [370, 1110], [350, 1230]], 3852, 4, "rgba(30,40,80,0.45)");
  inkLine(c, [[256, 1018], [320, 998], [400, 984], [500, 990]], 3853, 8, "rgba(200,215,255,0.35)");
  if (dark > 0) {
    c.fillStyle = `rgba(6,10,30,${(0.5 * dark).toFixed(3)})`;
    c.fillRect(200, 960, 320, 320);
  }
  c.restore();
}

/** F3 · 14.39 → 16.43 one shot, no cut. His face over the phone: he looks at that one line, eyes wet; the camera
 *  creeps in (holding back). He sends it — straight down on 发送, the screen's light jumps on his face (the same flare
 *  as the long message at 0:00; this time it's the last one), a jolt, his eyes shut. Then the camera pulls straight
 *  back off his face into the room (fast, then easing) as he puts the phone face down on the duvet; the room comes
 *  into focus, the blur and the cold go. He reaches over and switches the lamp off on the "and" of beat 31 — the room
 *  goes cold and dark; and in the dark he can't leave it: his hand goes back to the phone and lifts it, its light on
 *  his face — the move carries on into the next shot, where the phone rises into frame. */
function shotLetGo(c: Ctx, abs: number) {
  const on = abs < EV.lampOff ? 1 : 0;
  const sent = abs >= EV.send1;
  const creep = smooth(phase(abs, EV.type2[1], EV.send1));
  const k = kick(abs, EV.send1, 0.12);
  const after = smooth(phase(abs, EV.send1, EV.room));
  const flare = sent ? Math.exp(-(abs - EV.send1) / 0.22) : 0;
  const pull = smooth(phase(abs, EV.send1 + 0.12, EV.room + 0.32));
  const settle = softStart(phase(abs, EV.room + 0.32, BAR(8)));
  const down = smooth(phase(abs, EV.room + 0.02, EV.room + 0.32));
  const reach = smooth(phase(abs, EV.lampOff - 0.34, EV.lampOff - 0.03));
  const back = smooth(phase(abs, EV.lampOff + 0.05, EV.lampOff + 0.3));
  const grab = smooth(phase(abs, EV.lampOff + 0.02, EV.lampOff + 0.14));
  const lift = smooth(phase(abs, EV.lampOff + 0.13, BAR(8)));
  const sx = 420,
    sy = 640,
    ss = 0.95;
  // the camera: on his face (head at 540, 790), pulling back to the room (world 420, 760 at 540, 820)
  const zClose = (1.72 + 0.16 * creep) * (1 + 0.03 * k);
  const zWide = 1.32 - 0.04 * settle;
  const z = zClose * Math.pow(zWide / zClose, pull);
  const ay = lerp(sy, 760, pull),
    qy = lerp(790, 820, pull);
  const rot = 0.03 * creep * (1 - pull);
  const [jx, jy] = shake(abs, 7 * k, 4);
  // the room behind him: soft and moving less while we're close (parallax), sharp and locked once we're back
  const zb = 1 + (z - 1) * lerp(0.62, 1, pull);
  const blur = 2.4 * (1 - pull);
  const room = (b: Ctx) => {
    camera(b, sx, ay, zb, rot * 0.6, 540 - sx + jx * 0.5, qy - ay + jy * 0.5);
    hisRoom(b, abs, { lamp: on, lights: on ? 0.7 : 0.25 });
  };
  if (blur > 0.1) filtered(c, `blur(${blur.toFixed(1)}px)`, room, "letGoRoom");
  else {
    c.save();
    room(c);
    c.restore();
  }
  c.save();
  camera(c, sx, ay, z, rot, 540 - sx + jx, qy - ay + jy);
  // his hands: holding the phone up under his chin → down to the duvet (the phone laid face down) → the left one out
  // to the lamp and back → the right one back to the phone, lifting it
  const hand: Pt = reach > 0 && back < 1 ? [lerp(lerp(-50, -40, down), (ROOM.lamp[0] - sx) / ss + 10, reach * (1 - back)), lerp(lerp(300, 460, down), (ROOM.lamp[1] + 40 - sy) / ss, reach * (1 - back))] : [lerp(-50, -40, down), lerp(300, 460, down)];
  const lying: Pt = [sx + 120, 1040];
  const lyingH: Pt = [(lying[0] - sx) / ss, (lying[1] - sy) / ss];
  const rest: Pt = [lerp(50, 40, down), lerp(300, 460, down)];
  const handR: Pt = abs < EV.lampOff ? rest : lift > 0 ? [lerp(lyingH[0], 52, lift), lerp(lyingH[1], 300, lift)] : [lerp(rest[0], lyingH[0], grab), lerp(rest[1], lyingH[1], grab)];
  const holding = abs < EV.room + 0.02;
  const shut = sent && abs < EV.room + 0.1;
  hisInBed(c, {
    arms: "custom",
    handL: hand,
    handR,
    shapeL: reach > 0.5 && back < 0.5 ? "open" : "hold",
    shapeR: "hold",
    thumbFlip: holding,
    eyes: !sent ? "teary" : shut ? "shut" : lift > 0.5 ? "open" : "sad",
    brows: "sad",
    mouth: !sent ? "wobble" : shut ? "frown" : "flat",
    look: holding ? [0, 0.65] : lift > 0.2 ? [0, 0.7] : reach > 0.3 && back < 0.6 ? [-0.8, 0.2] : [-0.2, 0.8],
    tears: sent ? lerp(0.35, 0.8, after) : 0.15 * creep,
    tilt: holding ? 0.04 * creep : 0.05,
    grip: holding ? (g) => hisPhoneBack(g, 0, 236, 92, 176, 0) : undefined,
  }, { lamp: on, phone: holding ? 0.65 + 0.6 * flare : lift > 0.5 ? (lift - 0.5) * 2 : 0, x: sx, y: sy, s: ss, phoneAt: holding ? [sx, sy + 236 * ss] : [sx + handR[0] * ss, sy + (handR[1] - 50) * ss] });
  lapDrape(c, 1 - on);
  hisDuvet(c, 1 - on);
  // the phone: in his hands (drawn with him) → put down face down on the duvet (upright → a flat dark slab) → lifted
  c.save();
  if (holding) {
    // the screen's light spilling out over the top of the phone onto his face, and the flare as it sends
    c.globalCompositeOperation = "screen";
    glow(c, sx, sy + 140 * ss, 170, `rgba(160,190,255,${(0.32 * (1 - pull)).toFixed(3)})`);
    if (flare > 0.01) glow(c, sx, sy + 136 * ss, 220, `rgba(200,220,255,${(0.55 * flare).toFixed(3)})`);
  } else if (lift > 0) {
    const hx = sx + handR[0] * ss,
      hy = sy + (handR[1] - 60) * ss;
    if (lift < 0.35) {
      c.translate(hx, hy);
      c.rotate(0.12 * (1 - lift / 0.35));
      rr(c, -80, -22 - 30 * lift, 160, 44 + 90 * lift, 14);
      paint(c, "#1d2333", C.ink, 5);
    } else {
      hisPhoneBack(c, hx, hy, 92 * ss, 176 * ss * Math.min(1, (lift - 0.2) / 0.5), 0);
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
  // close up: the screen's cold light from below and a cold wash that grows after the send — gone as we pull back
  const cold = (0.25 + 0.3 * after) * (1 - pull);
  if (cold > 0.01) {
    glow(c, 540, H + 80, 1000, `rgba(140,170,255,${(0.18 + 0.15 * cold).toFixed(3)})`);
    c.save();
    c.globalCompositeOperation = "multiply";
    c.fillStyle = `rgba(150,170,230,${(0.35 * cold).toFixed(3)})`;
    c.fillRect(-60, -60, W + 120, H + 120);
    c.restore();
  }
  if (!on) {
    // after the click: a cold, dark room — only the moon through the window
    c.save();
    c.globalCompositeOperation = "multiply";
    c.fillStyle = "rgba(120,140,200,0.55)";
    c.fillRect(-60, -60, W + 120, H + 120);
    c.restore();
    vignette(c, 0.75, 540, 900, 260, 1150);
  } else vignette(c, lerp(0.42 + 0.2 * cold, 0.35, pull), 540, lerp(910, 900, pull), lerp(360, 380, pull), lerp(1250, 1250, pull));
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
    else if (abs < EV.del1[0]) shotTypeLong(c, abs);
    else if (abs < EV.type2[1]) shotRetype(c, abs);
    else shotLetGo(c, abs);
    bloom(c, 0.22, 24);
  });
}
