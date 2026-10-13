// 第三幕 · 多穿点（67 拍到结尾）：她的手机又亮了：「多穿点🌹」→ 推近这三个字，老式屏幕竖线转场 → 回忆（三年前）：
// 她朋友圈的聚会照下面「爸爸：多穿点🌹」，室友笑，她打开「不让他看」→ 现在：同一个开关，她关掉 → 她哭着笑了 →
// 发出「爸，这么晚还不睡？」→ 岗亭里他的手机亮了 → 他的脸 → 拉出窗外，雪夜里亮着的岗亭。
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase } from "@frame/engine/math";
import { C, Ctx, H, W, backOut, blob, camera, designScene, easeInOut, easeOut, fillBg, filtered, flash, glow, oldFilm, oldScreenCut, paint, smearV } from "@materials/s0rrow/code/draw";
import { phoneBack } from "@materials/s0rrow/code/phone";
import { drawKid } from "@materials/s0rrow/code/kid";
import { hahas } from "@materials/s0rrow/code/people";
import { SHOT, WORD, at } from "./timeline";
import { ACC_B, DAD_CALLS_HER, MOMENT_COMMENT_Y, PERM_ROW, SHE_CALLS_DAD, TOGGLE_AT, SEND_AT, slide, wxContact, dadLock, vidBanner, vidPost, couplePhoto, wxBanner, wxChat, wxMoment, wxPermission } from "./ui";
import { boothFront, boothOutside, deskTop, dorm, drawDad, herRoomShade, herRoomSnow, roomBokeh, roommates } from "./world";
import { aim, aimLerp, drawPhone, tap, timeCard, whip } from "./shots";
import { F } from "@materials/s0rrow/code/draw";
import { measure } from "@materials/s0rrow/code/draw";

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
  camera(c, 540, 760, 1.35, 0, 0, 120);
  herRoomSnow(c, abs, { lamp: 0 });
  const peek = easeOut(phase(u, 0.35, 0.75));
  drawKid(c, 300, 820 - 90 * peek, 0.95, { who: "girl", outfit: "pajamas", body: "head", eyes: peek > 0.5 ? "wide" : "tired", look: [0.6, 0.5] });
  // the duvet pulled over her
  blob(c, [[-80, 860], [200, 800], [460, 820], [640, 900], [660, 1180], [-80, 1180]], 6301, 3);
  paint(c, "#f2a7bd", C.ink, 6);
  herRoomShade(c, abs, { lamp: 0, phone: [470, 900, 0.9] });
  // the phone lying lit on the pillow
  glow(c, 470, 880, 260, "rgba(160,190,255,0.8)");
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
      drawKid(k, 540, 820, 1.0, { who: "girl", outfit: "uniform", body: "bust", eyes: hide > 0.5 ? "shut" : "open", mouth: hide > 0.5 ? "bite" : "o", blush: 0.4 + 0.6 * hide, arms: "phone", headY: 10 * hide });
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
  filtered(c, "blur(6px) brightness(0.55)", (k) => {
    camera(k, 540, 620, 1.9, 0, 0, 120);
    herRoomSnow(k, abs, { lamp: 0 });
  }, "s19bg");
  camera(c, 540, 780, 1 + 0.06 * phase(u, 0, 1));
  drawKid(c, 540, 780, 1.6, { who: "girl", outfit: "pajamas", body: "bust", eyes: "teary", mouth: "wobble", brows: "sad", tears: 0.3 + 0.7 * phase(u, 0, 0.7), headY: 4 * Math.sin(u * 14), arms: "phone" });
  glow(c, 540, 1300, 700, "rgba(150,180,255,0.4)");
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

/** 21b · his face: stunned, then the tears, then he laughs. */
function shot21b(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  boothFront(c, abs, { blur: 6 });
  camera(c, 540, 760, 1 + 0.12 * easeInOut(phase(u, 0, 2.2)));
  const face = u < 0.6 ? "o" : u < 1.5 ? "sad" : "laugh";
  drawDad(c, 540, 740, 1.5, { face, tilt: u < 1.5 ? 0.03 : -0.05, tears: phase(u, 0.7, 1.4) });
  glow(c, 540, 1180, 600, "rgba(150,180,255,0.45)");
  phoneBack(c, 540, 1440, 300, 560, -0.05, 0);
}

/** 22 · out through the booth window into the snow: the small warm booth, him bowed over the phone; the end. */
function shot22(c: Ctx, abs: number, t0: number) {
  const e = easeInOut(phase(abs, t0, t0 + 1.9));
  const z = 2.6 * Math.pow(1 / 2.6, e);
  camera(c, 590, 960, z, 0, 0, 130 * e);
  boothOutside(c, abs);
  void H;
  void W;
}
