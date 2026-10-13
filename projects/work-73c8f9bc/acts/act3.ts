// 第三幕 · 多穿点（67 拍到结尾）：她的手机又亮了：「多穿点🌹」→ 推近这三个字，老式屏幕竖线转场 → 回忆（三年前）：
// 她朋友圈的聚会照下面「爸爸：多穿点🌹」，室友笑，她打开「不让他看」→ 现在：同一个开关，她关掉 → 她哭着笑了 →
// 发出「爸，这么晚还不睡？」→ 岗亭里他的手机亮了 → 他的脸 → 拉出窗外，雪夜里亮着的岗亭。
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase } from "@frame/engine/math";
import { C, Ctx, F, H, W, backOut, blob, camera, designScene, easeInOut, easeOut, fillBg, filtered, flash, glow, litFigure, measure, oldFilm, oldScreenCut, paint, smearV } from "@materials/s0rrow/code/draw";
import { phoneBack } from "@materials/s0rrow/code/phone";
import { drawKid } from "@materials/s0rrow/code/kid";
import { hahas } from "@materials/s0rrow/code/people";
import { SHOT, WORD, at } from "./timeline";
import { ACC_B, DAD_CALLS_HER, MOMENT_COMMENT_Y, PERM_ROW, SHE_CALLS_DAD, TOGGLE_AT, SEND_AT, slide, wxContact, dadLock, vidBanner, vidPost, couplePhoto, wxBanner, wxChat, wxMoment, wxPermission } from "./ui";
import { dorm, herFace, herPhoneBack, lumpInBed, roomBokeh, roommates } from "./world";
import { boothFront, boothOutside, deskTop } from "@materials/s0rrow/code/blocked/booth";
import { drawDad } from "@materials/s0rrow/code/blocked/dad";
import { aim, aimLerp, drawPhone, tap, timeCard, whip } from "./shots";

/** visual.json: act3 starts on beat 67. */
export const ACT3_START = 32.27483;
const REPLY = "爸，这么晚还不睡？";

export function createScene(options: SceneOptions) {
  return designScene(options, ACT3_START, (ctx, abs) => draw(ctx, abs));
}

function draw(c: Ctx, abs: number) {
  const s16b = at(SHOT.s16b),
    memIn = at(SHOT.memIn),
    memOut = at(SHOT.memOut),
    s18 = at(SHOT.s18),
    s20 = at(SHOT.s20),
    s21 = at(SHOT.s21),
    s21b = at(SHOT.s21b),
    s22 = at(SHOT.s22);
  if (abs < s16b) shot16(c, abs, ACT3_START);
  else if (abs < memIn) shot16b(c, abs, s16b, memIn, 0);
  else if (abs < memIn + 2 * (at(1) - at(0))) cutIntoMemory(c, abs, memIn);
  else if (abs < memOut) memory(c, abs, memOut);
  else if (abs < s18) shot19(c, abs, memOut);
  else if (abs < s20) shot18(c, abs, s18);
  else if (abs < s21) shot20(c, abs, s20);
  else if (abs < s21b) shot21(c, abs, s21);
  else if (abs < s22) shot21b(c, abs, s21b);
  else shot22(c, abs, s22);
}

/** 16 · the dark room; she is a lump under the duvet; the phone on the pillow lights; she peeks out. */
function shot16(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  camera(c, 540, 760, 1.35 + 0.05 * phase(u, 0, 0.8), 0, 0, 120);
  lumpInBed(c, abs, easeOut(phase(u, 0.28, 0.66)), phase(u, 0.02, 0.12));
}

/** where 「多穿点」 sits on her phone's banner, and on the memory's comment (screen units, the middle of the word) */
const BANNER_WORD: [number, number] = [140 + 60, 84 + 110];
function momentWord(c: Ctx): [number, number] {
  return [150 + measure(c, `${SHE_CALLS_DAD}：`, 40, F.ui, 700) + 60, MOMENT_COMMENT_Y];
}
const Q: [number, number] = [540, 760];
const QS = 2.6;

function herBannerScreen(p: Ctx, abs: number) {
  vidPost(p, { time: "02:52", photo: couplePhoto(false), caption: "周末～", ago: "3小时前" });
  vidBanner(p, phase(abs, ACT3_START + 0.1, ACT3_START + 0.35), { name: ACC_B, body: "多穿点", rose: true });
}

/** 16b · push in on 「多穿点🌹」 until the word fills the middle of the frame. */
function shot16b(c: Ctx, abs: number, t0: number, t1: number, _x: number) {
  roomBokeh(c, abs, { dark: 0.85 });
  const A = { cx: 540, cy: 930, s: 1 };
  const B = aim(BANNER_WORD[0], BANNER_WORD[1], Q[0], Q[1], QS);
  const P = aimLerp(A, B, easeInOut(phase(abs, t0, t1 + 0.1)));
  glow(c, P.cx, P.cy, 900 * P.s, "rgba(120,150,255,0.25)");
  drawPhone(c, abs, P, (p) => herBannerScreen(p, abs));
}

/** the memory's first picture: her old phone, 「爸爸：多穿点🌹」 at the same place and size as the banner's word, pulling back */
function memoryPhone(c: Ctx, abs: number, t0: number) {
  fillBg(c, "#f3d9b0");
  const mw = momentWord(c);
  const A = aim(mw[0], mw[1], Q[0], Q[1], QS);
  const B = { cx: 540, cy: 900, s: 0.95 };
  const P = aimLerp(A, B, easeInOut(phase(abs, t0 + 0.5, t0 + 1.4)));
  drawPhone(c, abs, P, (p) => wxMoment(p, { mark: phase(abs, t0 + 0.55, t0 + 1.3) }));
}

/** the old-screen cut (two beats): her banner's word → the same word under her old Moments post */
function cutIntoMemory(c: Ctx, abs: number, t0: number) {
  const len = 2 * (at(1) - at(0));
  const p = (abs - t0) / len;
  oldScreenCut(
    c,
    abs,
    p,
    (k) => {
      roomBokeh(k, abs, { dark: 0.85 });
      drawPhone(k, abs, aim(BANNER_WORD[0], BANNER_WORD[1], Q[0], Q[1], QS), (s) => herBannerScreen(s, abs));
    },
    (k) => memoryPhone(k, abs, t0 + len * 0.5),
  );
}

/** 17 · the memory (old film): the comment, then the dorm — her roommates laugh 「哈哈哈」, she hides the phone, and
 *  switches on 「不让他（她）看」. */
function memory(c: Ctx, abs: number, end: number) {
  const len = 2 * (at(1) - at(0));
  const t0 = at(SHOT.memIn) + len * 0.5;
  const dormAt = t0 + 1.35,
    toggleAt = WORD.heart4 - 0.55;
  oldFilm(c, abs, (k) => {
    if (abs < dormAt) memoryPhone(k, abs, t0);
    else if (abs < toggleAt) {
      dorm(k, abs);
      const laugh = phase(abs, dormAt + 0.2, dormAt + 0.5);
      roommates(k, abs, laugh);
      const hide = phase(abs, dormAt + 0.7, dormAt + 1.0);
      // she presses her phone to her chest, screen in, so they can't read any more
      drawKid(k, 540, 820, 1.0, { who: "girl", outfit: "uniform", body: "bust", eyes: hide > 0.5 ? "shut" : "open", mouth: hide > 0.5 ? "bite" : "o", blush: 0.4 + 0.6 * hide, arms: "phone", headY: 10 * hide, grip: (q) => herPhoneBack(q, 0, 316 - 20 * hide, 96, 176, 0.04) });
      hahas(k, 540, 560, 360, laugh, 971, F.cn, 4);
    } else {
      fillBg(k, "#f3d9b0");
      const on = phase(abs, WORD.heart4 - 0.05, WORD.heart4 + 0.12);
      drawPhone(k, abs, { cx: 540, cy: 930, s: 1 }, (p) => wxPermission(p, on, { time: "21:20" }), { touches: [tap(abs, WORD.heart4, TOGGLE_AT[0], TOGGLE_AT[1])] });
    }
  });
  timeCard(c, abs, "三年前", t0 + 0.1, t0 + 2.2);
  void end;
}

/** 18 · now: the same switch on her phone — she turns it off. */
function shot18(c: Ctx, abs: number, t0: number) {
  roomBokeh(c, abs, { dark: 0.8 });
  glow(c, 540, 860, 900, "rgba(120,150,255,0.28)");
  const offAt = at(82.5);
  const on = 1 - phase(abs, offAt - 0.03, offAt + 0.15);
  drawPhone(c, abs, { cx: 540, cy: 930, s: 1 }, (p) => wxPermission(p, on, { time: "02:53" }), { touches: [tap(abs, offAt, TOGGLE_AT[0], TOGGLE_AT[1]), tap(abs, at(84) - 0.04, 40, 120)] });
  void t0;
}

/** 19 · straight out of the memory: her face, crying. */
function shot19(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  camera(c, 540, 780, 1 + 0.06 * phase(u, 0, 1));
  herFace(c, abs, { lamp: 0, top: 1070, grip: 1, s: 1.6, pose: { eyes: "teary", mouth: "wobble", brows: "sad", tears: 0.3 + 0.7 * phase(u, 0, 0.7), headY: 4 * Math.sin(u * 14) } });
}

/** 20 · the chat with 爸爸: his unanswered 「吃饭了吗🌹」 「降温了 多穿点🌹」; she sends 「爸，这么晚还不睡？」. */
function shot20(c: Ctx, abs: number, t0: number) {
  roomBokeh(c, abs, { dark: 0.8 });
  glow(c, 540, 860, 900, "rgba(120,150,255,0.28)");
  const sendAt = at(85.5);
  const typed = Array.from(REPLY).slice(0, Math.round(Array.from(REPLY).length * clamp((abs - t0 - 0.22) / 0.45))).join("");
  const sent = abs >= sendAt;
  const back = 1 - Math.pow(1 - phase(abs, t0, t0 + 0.2), 3);
  drawPhone(c, abs, { cx: 540, cy: 930, s: 1 }, (p) => {
    // back from the permission page to the chat (the chat comes in from the left, the page leaves to the right)
    p.save();
    p.translate(-180 * (1 - back), 0);
    chatNow(p);
    p.fillStyle = `rgba(0,0,0,${(0.4 * (1 - back)).toFixed(3)})`;
    p.fillRect(0, 0, 600, 1280);
    p.restore();
    if (back < 1) {
      p.save();
      p.translate(600 * back, 0);
      wxPermission(p, 0, { time: "02:53" });
      p.restore();
    }
  }, { touches: [tap(abs, sendAt, SEND_AT[0], SEND_AT[1])] });
  function chatNow(p: Ctx) {
    wxChat(p, {
      time: "02:54",
      title: SHE_CALLS_DAD,
      mine: "her",
      keyboard: true,
      items: [
        { text: "吃饭了吗", rose: true },
        { text: "降温了 多穿点", rose: true },
        ...(sent ? [{ me: true, text: REPLY, pop: phase(abs, sendAt, sendAt + 0.15) }] : []),
      ],
      draft: sent ? "" : typed,
      caret: !sent,
      sendHot: phase(abs, sendAt - 0.08, sendAt) * (sent ? 0 : 1),
    });
  }
}

/** 21 · the booth: his phone on the desk lights — her message over his wallpaper. */
function shot21(c: Ctx, abs: number, t0: number) {
  const z = 1.08 + 0.06 * phase(abs, t0, t0 + 0.8);
  camera(c, 540, 880, z);
  deskTop(c, abs);
  const drop = at(86.5);
  glow(c, 540, 880, 520, "rgba(150,180,255,0.45)");
  drawPhone(c, abs, { cx: 540, cy: 880, s: 0.92, rot: 0.06 }, (p) => {
    dadLock(p, { time: "02:54", date: "1月14日 星期二" });
    wxBanner(p, phase(abs, drop, drop + 0.25), DAD_CALLS_HER, REPLY, true);
  }, { old: true, buzz: abs > drop && abs < drop + 0.4 ? 1 - (abs - drop) / 0.4 : 0 });
}

/** 21b · his face as her message sinks in: stunned (eyes wide, mouth open) → his hand over his mouth, the tears
 *  coming → he laughs through them. Lit by the phone in his hands. */
function shot21b(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  boothFront(c, abs, { blur: 7 });
  c.fillStyle = "rgba(6,8,20,0.4)";
  c.fillRect(-60, -60, 1200, 2040);
  camera(c, 540, 700, 1 + 0.12 * easeInOut(phase(u, 0, 2.2)));
  const stage = u < 0.55 ? 0 : u < 1.45 ? 1 : 2;
  const pose =
    stage === 0
      ? { eyes: "wide" as const, brows: "up" as const, mouth: "o" as const, arms: "phone" as const }
      : stage === 1
        ? { eyes: "teary" as const, brows: "sad" as const, mouth: "wobble" as const, arms: "mouth" as const }
        : { eyes: "happy" as const, mouth: "laugh" as const, arms: "phone" as const };
  const phoneHeld = (q: Ctx) => (stage === 1 ? phoneBack(q, -70, 500, 140, 260, 0.2, 0) : phoneBack(q, 0, 420, 150, 270, 0, 0));
  const shake = stage === 2 ? Math.sin(u * 22) * 4 : 0;
  litFigure(c, (k) => drawDad(k, 540 + shake, 600, 1.42, { coat: true, ...pose, tears: phase(u, 0.6, 1.3), tilt: stage === 2 ? -0.05 : 0.02, holding: phoneHeld }), {
    shade: 0.28,
    lights: [
      { x: 540, y: 1060, r: 430, rgb: "160,195,255", a: 0.4 },
      { x: 1040, y: 300, r: 520, rgb: "255,170,90", a: 0.15 + 0.12 * (stage === 2 ? 1 : 0) },
    ],
    rim: { ux: 1, uy: -0.4, rgb: "255,190,120", a: 0.5 },
  });
}

/** 22 · out through the booth window into the snow: the small warm booth, him bowed over the phone typing his reply
 *  with one finger, smiling; the end. */
function shot22(c: Ctx, abs: number, t0: number) {
  const e = easeInOut(phase(abs, t0, t0 + 1.9));
  const z = 2.6 * Math.pow(1 / 2.6, e);
  camera(c, 590, 960, z, 0, 0, 130 * e);
  const u = abs - t0;
  const tapK = Math.max(0, Math.sin(u * 9)) ** 3;
  boothOutside(c, abs, (k) => {
    litFigure(k, (q) => drawDad(q, 590, 925, 0.4, { coat: true, eyes: "happy", mouth: "smile", arms: "type", tap: tapK, holding: (r) => phoneBack(r, -10, 400, 150, 270, -0.08, 0) }), {
      lights: [{ x: 586, y: 1060, r: 200, rgb: "170,200,255", a: 0.45 }],
    });
  });
  void H;
  void W;
}
