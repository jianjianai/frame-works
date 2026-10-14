// 第三幕 · 多穿点（67 拍到结尾）：她的手机又亮了：「多穿点🌹」→ 推近这三个字，老式屏幕竖线转场 → 回忆（三年前）：
// 她朋友圈的聚会照下面「爸爸：多穿点🌹」，室友笑，她打开「不让他看」→ 现在：同一个开关，她关掉 → 她哭着笑了 →
// 发出「爸，这么晚还不睡？」→ 岗亭里他的手机亮了 → 他的脸 → 拉出窗外，雪夜里亮着的岗亭。
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase } from "@frame/engine/math";
import { C, Ctx, F, H, W, backOut, blob, camera, castShadow, designScene, fillBg, filtered, flash, glow, handheld, litFigure, measure, oldFilm, oldScreenCut, paint, smearV } from "@materials/s0rrow/code/draw";
import { phoneBack } from "@materials/s0rrow/code/phone";
import { drawKid } from "@materials/s0rrow/code/kid";
import { hahas } from "@materials/s0rrow/code/people";
import { dormDesk } from "@materials/s0rrow/code/dorm";
import { SHOT, WORD, at } from "./timeline";
import { ACC_B, DAD_CALLS_HER, MOMENT_COMMENT_Y, PERM_ROW, SHE_CALLS_DAD, TOGGLE_AT, SEND_AT, slide, wxContact, dadLock, vidBanner, vidPost, couplePhoto, wxBanner, wxChat, wxMoment, wxPermission } from "./ui";
import { dorm, herFace, herPhoneBack, lumpInBed, roomBokeh, roommates } from "./world";
import { boothFront, boothFrontDesk, boothOutside, deskTop } from "@materials/s0rrow/code/blocked/booth";
import { drawDad } from "@materials/s0rrow/code/blocked/dad";
import { aim, decay, drawPhone, emph, enter, fade, jolt, moveBlur, nudge, phoneXf, slow, snap, steps, tap, timeCard, whip, zoomSteps, type PhoneSpec } from "./shots";

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
  else if (abs < memIn) shot16b(c, abs);
  else if (abs < memIn + CUT_LEN()) cutIntoMemory(c, abs, memIn);
  else if (abs < memOut) memory(c, abs, memOut);
  else if (abs < s18) shot19(c, abs, memOut);
  else if (abs < s20) shot18(c, abs);
  else if (abs < s21) shot20(c, abs, s20);
  else if (abs < s21b) shot21(c, abs, s21);
  else if (abs < s22) shot21b(c, abs, s21b);
  else shot22(c, abs, s22);
}

/** 16 · the dark room; she is a lump under the duvet; the phone on the pillow lights; she peeks out. */
function shot16(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  // still on the dark lump; as she peeks out at the light, one quick push in on her (lands on beat 68)
  const z = zoomSteps(abs, 1.35, [{ at: at(68) - 0.26, len: 0.26, to: 1.5 }]);
  const [hx, hy, hr] = handheld(abs, 2, 16);
  camera(c, 540, 760, z, hr, hx, 120 + hy);
  lumpInBed(c, abs, emph(phase(abs, at(68) - 0.3, at(68))), fade(phase(u, 0.02, 0.12)));
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

/** 16b → the old-screen cut: one push in, over the beat she stares at it, until 「多穿点🌹」 fills the middle of the frame
 *  (lands as the lines begin, beat 69½), then held dead still through them, so the memory's word can take its place
 *  exactly. */
function duoCam(abs: number): PhoneSpec {
  const A = { cx: 540, cy: 930, s: 1 };
  const B = aim(BANNER_WORD[0], BANNER_WORD[1], Q[0], Q[1], QS);
  const t0 = at(SHOT.s16b);
  return steps(abs, A, [{ at: t0, len: at(SHOT.memIn) - t0, to: B }]);
}
const CUT_LEN = () => 2 * (at(1) - at(0));
function duoFrame(c: Ctx, abs: number) {
  const P = duoCam(abs);
  moveBlur(c, phoneXf(duoCam(abs - 1 / 60)), phoneXf(P), (k) => {
    roomBokeh(k, abs, { dark: 0.85 });
    glow(k, P.cx, P.cy, 900 * P.s, "rgba(120,150,255,0.25)");
    drawPhone(k, abs, P, (p) => herBannerScreen(p, abs));
  }, "duoBlur");
}
/** 16b · push in on 「多穿点🌹」. */
function shot16b(c: Ctx, abs: number) {
  duoFrame(c, abs);
}

/** the memory's first picture: her old phone, 「爸爸：多穿点🌹」 at the same place and size as the banner's word, pulling back */
function memoryPhone(c: Ctx, abs: number, t0: number) {
  const mw = momentWord(c);
  const A = aim(mw[0], mw[1], Q[0], Q[1], QS);
  // the whole post, with 「爸爸：多穿点🌹」 kept above the lyrics band (it used to sit under the English line)
  const B = aim(300, MOMENT_COMMENT_Y, 540, 1150, 0.85);
  // held on the matched word until the lines have cleared, then one pull back to the whole post (lands on beat 72½),
  // where the comment gets its pulse
  const cam = (t: number) => steps(t, A, [{ at: at(71.5), len: at(72.5) - at(71.5), to: B }]);
  const P = cam(abs);
  moveBlur(c, phoneXf(cam(abs - 1 / 60)), phoneXf(P), (k) => {
    fillBg(k, "#f3d9b0");
    drawPhone(k, abs, P, (p) => wxMoment(p, { mark: phase(abs, at(72.5), at(72.5) + 0.55) }));
  }, "memBlur");
  void t0;
}

/** the old-screen cut (two beats): her banner's word → the same word under her old Moments post */
function cutIntoMemory(c: Ctx, abs: number, t0: number) {
  const len = CUT_LEN();
  const p = (abs - t0) / len;
  oldScreenCut(
    c,
    abs,
    p,
    (k) => duoFrame(k, abs),
    (k) => memoryPhone(k, abs, t0 + len * 0.5),
  );
}

/** 17 · the memory (old film): the comment, then the dorm — her roommates laugh 「哈哈哈」, she hides the phone, and
 *  switches on 「不让他（她）看」. */
function memory(c: Ctx, abs: number, end: number) {
  const len = CUT_LEN();
  const t0 = at(SHOT.memIn) + len * 0.5;
  const dormAt = t0 + 1.35,
    toggleAt = WORD.heart4 - 0.55;
  oldFilm(c, abs, (k) => {
    if (abs < dormAt) memoryPhone(k, abs, t0);
    else if (abs < toggleAt) {
      // still on the room while they lean in and laugh (beat 74); as she hides the phone, blushing, one quick push in
      // on her (lands on beat 75½)
      camera(k, 540, 820, zoomSteps(abs, 1, [{ at: at(75), len: at(75.5) - at(75), to: 1.12 }]));
      dorm(k, abs);
      const laugh = emph(phase(abs, at(73.5), at(74)));
      roommates(k, abs, laugh);
      const hide = emph(phase(abs, at(75), at(75.5)));
      // She presses her phone to her chest; her unchanged pose is lit by the actual room sources.
      const girl = (q: Ctx) => drawKid(q, 540, 820, 1.0, { who: "girl", outfit: "uniform", body: "bust", eyes: hide > 0.5 ? "shut" : "open", mouth: hide > 0.5 ? "bite" : "o", blush: 0.4 + 0.6 * hide, arms: "phone", headY: 10 * hide, grip: (p) => herPhoneBack(p, 0, 316 - 20 * hide, 96, 176, 0.04) });
      castShadow(k, [218, 610], 1.08, girl, "#263e45", 19, 0.20, (q) => { q.beginPath(); q.rect(360, 619, 365, 650); q.clip(); });
      litFigure(k, girl, { shade: 0.13, shadeCol: "#263c49", lights: [{ x: 329, y: 786, r: 620, rgb: "249,218,164", a: 0.29 }, { x: 675, y: 718, r: 400, rgb: "153,194,219", a: 0.16 }], rim: { ux: 0.65, uy: -0.8, rgb: "161,204,223", a: 0.32, width: 5 } });
      dormDesk(k, abs, { y: 1250, lamp: 1 });
      hahas(k, 540, 560, 360, laugh, 971, F.cn, 4);
    } else {
      fillBg(k, "#f3d9b0");
      const on = phase(abs, WORD.heart4 - 0.05, WORD.heart4 + 0.12);
      // steady; one quick push onto the switch as her thumb goes to it (lands on beat 77½), and she flips it on
      const P = steps(abs, NOW, [{ at: at(77), len: at(77.5) - at(77), to: ON_SWITCH() }]);
      void end;
      drawPhone(k, abs, P, (p) => wxPermission(p, on, { time: "21:20" }), { touches: [tap(abs, WORD.heart4, TOGGLE_AT[0], TOGGLE_AT[1])] });
    }
  }, "dormMemory", abs >= dormAt && abs < toggleAt ? 0.68 : 1);
  timeCard(c, abs, "三年前", t0 + 0.1, t0 + 2.2);
}

/** her phone in shots 18–20 (the same phone, no cut). It opens on exactly the framing the memory's switch page ended
 *  on — the same switch, now — and holds still until she turns it off (a small push in on the click); it pulls back to
 *  the whole phone as the chat slides in (lands on beat 84½), and snaps in on her message the moment it is sent (beat
 *  85½). */
const NOW: PhoneSpec = { cx: 540, cy: 930, s: 1 };
const ON_SWITCH = () => aim(TOGGLE_AT[0], TOGGLE_AT[1], 690, 760, 1.15);
/** where her sent bubble sits in the chat (screen units) */
const MY_BUBBLE: [number, number] = [313, 525];
function nowCam(abs: number): PhoneSpec {
  return steps(abs, ON_SWITCH(), [
    // as she switches it off (beat 82½), a small quick push in on the switch
    { at: at(82.5), len: 0.22, to: nudge(ON_SWITCH(), TOGGLE_AT[0], TOGGLE_AT[1], 1.06) },
    { at: at(84), len: at(84.5) - at(84), to: NOW },
    { at: at(85.5), len: 0.16, to: nudge(NOW, MY_BUBBLE[0], MY_BUBBLE[1], 1.1), ease: snap },
  ]);
}
/** the room and the phone's own glow behind her phone in shots 18–20 */
function nowBack(c: Ctx, abs: number, P: PhoneSpec) {
  roomBokeh(c, abs, { dark: 0.8, shift: [0.15 * (P.cx - NOW.cx), 0.15 * (P.cy - NOW.cy)] });
  glow(c, P.cx, P.cy - 70 * P.s, 900 * P.s, "rgba(120,150,255,0.28)");
}

/** 18 · now: the same switch on her phone — she turns it off. */
function shot18(c: Ctx, abs: number) {
  const P = nowCam(abs);
  nowBack(c, abs, P);
  // (the camera is still here: the same switch, the same framing as three years ago)
  const offAt = at(82.5);
  const on = 1 - phase(abs, offAt - 0.03, offAt + 0.15);
  drawPhone(c, abs, P, (p) => wxPermission(p, on, { time: "02:53" }), { touches: [tap(abs, offAt, TOGGLE_AT[0], TOGGLE_AT[1]), tap(abs, at(84) - 0.04, 40, 120)] });
}

/** 19 · straight out of the memory: her face, crying. */
function shot19(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  // one of the film's few slow pushes: her crying face, a little unsteady
  const [hx, hy, hr] = handheld(abs, 2.5, 19);
  camera(c, 540, 780, zoomSteps(abs, 1, [{ at: t0, len: at(SHOT.s18) - t0, to: 1.07, ease: slow }]), hr, hx, hy);
  herFace(c, abs, { lamp: 0, top: 1070, grip: 1, s: 1.6, pose: { eyes: "teary", mouth: "wobble", brows: "sad", tears: 0.3 + 0.7 * enter(phase(u, 0, 0.7)), headY: 4 * Math.sin(u * 14) } });
}

/** 20 · the chat with 爸爸: his unanswered 「吃饭了吗🌹」 「降温了 多穿点🌹」; she sends 「爸，这么晚还不睡？」. */
function shot20(c: Ctx, abs: number, t0: number) {
  const P = nowCam(abs);
  moveBlur(c, phoneXf(nowCam(abs - 1 / 60)), phoneXf(P), (k) => shot20Frame(k, abs, t0, P), "s20blur");
}
function shot20Frame(c: Ctx, abs: number, t0: number, P: PhoneSpec) {
  nowBack(c, abs, P);
  const sendAt = at(85.5);
  const typed = Array.from(REPLY).slice(0, Math.round(Array.from(REPLY).length * clamp((abs - t0 - 0.22) / 0.45))).join("");
  const sent = abs >= sendAt;
  const back = emph(phase(abs, t0, t0 + 0.26));
  drawPhone(c, abs, P, (p) => {
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
  // still on the phone on his desk; as her message drops onto it (beat 86½), a snap in with a knock
  const drop = at(86.5);
  const z = zoomSteps(abs, 1.08, [{ at: drop, len: 0.16, to: 1.16, ease: snap }]);
  const [jx, jy] = jolt(abs, drop, 7, 12);
  const [hx, hy, hr] = handheld(abs, 1.5, 21);
  camera(c, 540, 880, z, hr, hx + jx, hy + jy);
  void t0;
  deskTop(c, abs, { detailed: true, phoneLight: 1, phoneResting: true });
  drawPhone(c, abs, { cx: 540, cy: 880, s: 0.92, rot: 0.06 }, (p) => {
    dadLock(p, { time: "02:54", date: "1月14日 星期二" });
    wxBanner(p, phase(abs, drop, drop + 0.25), DAD_CALLS_HER, REPLY, true);
  }, { old: true, buzz: decay(abs, drop, 0.45) });
}

/** 21b · his face as her message sinks in: stunned (eyes wide, mouth open) → his hand over his mouth, the tears
 *  coming → he laughs through them. Lit by the phone in his hands. */
function shot21b(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  boothFront(c, abs, { detailed: true, blur: 3.5, clock: 2.9 });
  // the other slow push: into his face as it sinks in — it lands, at rest, exactly on the framing the window shot
  // opens on (the match cut)
  camera(c, 540, 700, zoomSteps(abs, 1, [{ at: t0, len: at(SHOT.s22) - t0, to: 1.12, ease: slow }]));
  const stage = u < 0.55 ? 0 : u < 1.45 ? 1 : 2;
  // the hand comes up off the phone to his mouth, and later goes back down to it — animated, not swapped
  const mk = emph(phase(u, 0.4, 0.66)) * (1 - emph(phase(u, 1.38, 1.62)));
  // a blink hides each change of expression (wide → teary → laughing)
  const blink = (u > 0.51 && u < 0.6) || (u > 1.41 && u < 1.5);
  const face =
    stage === 0
      ? { eyes: "wide" as const, brows: "up" as const, mouth: "o" as const }
      : stage === 1
        ? { eyes: "teary" as const, brows: "sad" as const, mouth: "wobble" as const }
        : { eyes: "happy" as const, mouth: "laugh" as const };
  const pose = { ...face, ...(blink ? { eyes: "shut" as const } : {}), arms: mk > 0.001 ? ("mouth" as const) : ("phone" as const), mouthK: mk };
  const phoneFinish = { detailed: true, caseColor: "#252d35", cameraColor: "#343e47" };
  // the phone goes down and to the side in his other hand while the right hand is at his mouth
  const phoneHeld = (q: Ctx) => phoneBack(q, -70 * mk, 420 + 80 * mk, 150 - 10 * mk, 270 - 10 * mk, 0.2 * mk, 0, phoneFinish);
  const laughIn = emph(phase(u, 1.45, 1.8));
  const shake = Math.sin(u * 22) * 4 * laughIn;
  litFigure(c, (k) => drawDad(k, 540 + shake, 600, 1.42, { coat: true, frontDetails: true, screenReflection: 0.65 - 0.35 * mk, ...pose, tears: enter(phase(u, 0.6, 1.3)), tilt: 0.02 - 0.07 * laughIn, holding: phoneHeld }), {
    shade: 0.35,
    shadeCol: "rgb(12,27,39)",
    lights: [
      { x: 535, y: 815, r: 320, rgb: "149,190,210", a: 0.25 - 0.07 * mk },
      { x: 535, y: 1180, r: 215, rgb: "144,183,201", a: 0.1 },
      { x: 865, y: 555, r: 480, rgb: "245,178,106", a: 0.19 + 0.12 * laughIn },
    ],
    rim: { ux: 1, uy: -0.4, rgb: "245,190,123", a: 0.34 + 0.09 * laughIn, width: 5 },
  });
  filtered(c, "blur(0.7px)", (k) => boothFrontDesk(k, abs), "s21bdesk");
}

/** 22 · out through the booth window into the snow: the small warm booth, him bowed over the phone typing his reply
 *  with one finger, smiling; the end. */
function shot22(c: Ctx, abs: number, t0: number) {
  // Overscan the night sky before the final downward camera offset exposes the top edge.
  fillBg(c, "#070b1d");
  // A match cut on his face: the shot opens with his head exactly where shot 21b left it (screen (540, 588), the
  // same size), now seen through the booth's window from outside, and pulls all the way back into the snowy night.
  // The end framing is the old one (his head at screen (590, 1055), zoom 1).
  const HEAD: [number, number] = [590, 925]; // his head in the booth (design units of boothOutside)
  // one pull back out into the snow: off the mark fast, a long soft landing, then still under the end cards
  const e = emph(phase(abs, t0, t0 + 1.9));
  const Z0 = (1.42 * 1.12) / 0.4;
  const z = Z0 * Math.pow(1 / Z0, e);
  c.translate(540 + 50 * e, 588 + 467 * e);
  c.scale(z, z);
  c.translate(-HEAD[0], -HEAD[1]);
  const u = abs - t0;
  const tapK = Math.max(0, Math.sin(u * 9)) ** 3;
  boothOutside(c, abs, (k) => {
    litFigure(k, (q) => drawDad(q, 590, 925, 0.4, { coat: true, frontDetails: true, screenReflection: 0.5, eyes: "happy", mouth: u < 1.1 ? "laugh" : "smile" /* settles to a smile once he is small in the window, not while his face fills the frame */, tears: 1 - fade(phase(u, 0.3, 1.5)), arms: "type", tap: tapK, holding: (r) => phoneBack(r, -10, 400, 150, 270, -0.08, 0, { detailed: true, caseColor: "#252d35", cameraColor: "#343e47" }) }), {
      shade: 0.24,
      shadeCol: "#1c3443",
      lights: [
        { x: 586, y: 1048, r: 124, rgb: "158,194,211", a: 0.26 },
        { x: 690, y: 875, r: 256, rgb: "246,192,121", a: 0.30 },
      ],
      rim: { ux: 0.8, uy: -0.5, rgb: "249,201,130", a: 0.38, width: 1.8 },
    });
  }, { detailed: true });
  void H;
  void W;
}
