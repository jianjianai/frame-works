// 第三幕 · 多穿点（67 拍到结尾）：她的手机又亮了：「多穿点🌹」→ 推近这三个字，老式屏幕竖线转场 → 回忆（三年前）：
// 她朋友圈的聚会照下面「爸爸：多穿点🌹」，室友笑，她打开「不让他看」→ 现在：同一个开关，她关掉 → 她哭着笑了 →
// 发出「爸，这么晚还不睡？」→ 岗亭里他的手机亮了 → 他的脸 → 拉出窗外，雪夜里亮着的岗亭。
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase } from "@frame/engine/math";
import { C, Ctx, F, H, W, backOut, blob, camera, designScene, easeInOut, easeOut, fillBg, filtered, flash, glow, litFigure, measure, oldFilm, oldScreenCut, paint, shake, smearV } from "@materials/s0rrow/code/draw";
import { phoneBack } from "@materials/s0rrow/code/phone";
import { END, SHOT, WORD, at } from "./timeline";
import { ACC_B, DAD_CALLS_HER, MOMENT_COMMENT_Y, PERM_ROW, SHE_CALLS_DAD, SW, TOGGLE_AT, SEND_AT, guideBox, slide, wxContact, dadLock, vidBanner, vidPost, couplePhoto, wxBanner, wxChat, wxMoment, wxPermission } from "./ui";
import { SIT, SIT_CAM, SIT_HANDS, dormBokeh, herFace, herFaceBg, herInBed, herPhoneBack, herRoomSnow, lapDuvet, lumpInBed, roomBokeh } from "./world";
import { boothFront, boothFrontDesk, boothOutside, deskTop } from "@materials/s0rrow/code/blocked/booth";
import { drawDad } from "@materials/s0rrow/code/blocked/dad";
import { aim, aimLerp, drawPhone, halo, tap, timeCard, whip, type PhoneSpec } from "./shots";
import { dormLaugh } from "./memory";

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

/** 16 · the dark room; she is a lump under the duvet; the phone on the pillow lights; she peeks out.
 *  警觉 (it's that stranger again): the dark is still; the screen comes on and the camera starts with her (a jolt);
 *  as she peeks out, eyes wide, it creeps in on her and the phone, slow and straight (act1's 紧张). */
function shot16(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  const kick = abs < PHONE_ON ? 0 : Math.exp(-(abs - PHONE_ON) / 0.1);
  const [jx, jy] = kick > 0.02 ? shake(abs, 9 * kick, 16) : [0, 0];
  const creep = phase(u, 0.12, 0.8);
  // zoomed about her face (where it was on screen in the old fixed framing), drawing her in toward the middle
  camera(c, 300, 760, 1.35 * (1 + 0.035 * kick) * (1 + 0.14 * creep), 0, -84 + 70 * creep + jx, 120 - 20 * creep + jy);
  // the screen comes on at once with the message, a flare of light that settles
  const lit = abs >= PHONE_ON ? 1 : 0;
  lumpInBed(c, abs, easeOut(phase(u, 0.35, 0.75)), lit);
  if (lit) glow(c, 452, 790, 420, "rgba(190,210,255,0.5)", Math.exp(-(abs - PHONE_ON) / 0.18));
}
/** her phone lights on the pillow (the 「多穿点」 notification sound in audio.json) */
const PHONE_ON = 32.285;

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

/** 16b · push in on 「多穿点🌹」 until the word fills the middle of the frame.
 *  疑惑 → 熟悉: the phone tips a little (she tilts her head — those words…) and leans in; then the push into the word
 *  speeds up all the way, as if the memory pulls her in, and lands exactly where the old-screen cut begins. */
function shot16b(c: Ctx, abs: number, t0: number, t1: number, _x: number) {
  const puzzled = easeOut(phase(abs, t0, t0 + 0.2));
  const dive = Math.pow(phase(abs, t0 + 0.14, t1), 2.2);
  roomBokeh(c, abs, { dark: 0.85 + 0.1 * dive });
  const A = { cx: 540, cy: 930, s: 1 + 0.06 * puzzled, rot: 0.05 * puzzled };
  const B = aim(BANNER_WORD[0], BANNER_WORD[1], Q[0], Q[1], QS);
  const P = aimLerp(A, B, dive);
  halo(c, P);
  drawPhone(c, abs, P, (p) => herBannerScreen(p, abs));
}

/** her old phone's glow in the warm dorm */
const MEMORY_GLOW = "255,214,170";
/** the dark closing in round a point (a: how dark the corners get) */
function darkRound(c: Ctx, a: number, cx = 540, cy = 860) {
  if (a <= 0.005) return;
  const v = c.createRadialGradient(cx, cy, 380, cx, cy, 1200);
  v.addColorStop(0, "rgba(4,6,12,0)");
  v.addColorStop(1, `rgba(4,6,12,${a.toFixed(3)})`);
  c.fillStyle = v;
  c.fillRect(-60, -60, W + 120, H + 120);
}
/** the memory's first picture: her old phone, 「爸爸：多穿点🌹」 at the same place and size as the banner's word, pulling back */
function memoryPhone(c: Ctx, abs: number, t0: number) {
  const back = easeInOut(phase(abs, t0 + 0.5, t0 + 1.4));
  // 怀念: once it has pulled back it doesn't stop — it floats on, drifting back and turning a hair, into the dorm
  // (whose camera carries the drift on)
  const drift = phase(abs, t0 + 1.0, t0 + 1.35);
  dormBokeh(c, abs, 1 + 0.25 * (1 - back) - 0.03 * drift);
  const mw = momentWord(c);
  const A = aim(mw[0], mw[1], Q[0], Q[1], QS);
  const B = { cx: 540, cy: 900 - 14 * drift, s: 0.95 * (1 - 0.035 * drift), rot: -0.012 * drift };
  const P = aimLerp(A, B, back);
  halo(c, P, 0.8, MEMORY_GLOW);
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

/** 17 · the memory (old film): the comment, then the dorm (memory.ts dormLaugh) — her roommates laugh 「哈哈哈」, she
 *  clutches the phone to her chest — and she switches on 「不让他（她）看」. */
function memory(c: Ctx, abs: number, end: number) {
  const len = 2 * (at(1) - at(0));
  const t0 = at(SHOT.memIn) + len * 0.5;
  const dormAt = t0 + 1.35,
    toggleAt = WORD.heart4 - 0.55;
  oldFilm(c, abs, (k) => {
    if (abs < dormAt) memoryPhone(k, abs, t0);
    else if (abs < toggleAt) dormLaugh(k, abs, dormAt);
    else {
      // 关上门 (a cold little decision): the camera goes slowly in on 「不让他（她）看」; on the click it stops dead, and
      // the warmth drains out of the room behind her phone while the dark closes in
      const go = easeInOut(phase(abs, toggleAt, WORD.heart4 - 0.02));
      const click = abs < WORD.heart4 ? 0 : Math.exp(-(abs - WORD.heart4) / 0.07);
      const cold = easeInOut(phase(abs, WORD.heart4 + 0.02, WORD.heart4 + 0.5));
      const P0 = aimLerp({ cx: 540, cy: 930, s: 1 }, aim(300, 500, 540, 830, 1.24), go);
      const P = { ...P0, s: P0.s * (1 + 0.012 * click) };
      filtered(k, `saturate(${(1 - 0.75 * cold).toFixed(3)}) brightness(${(1 - 0.35 * cold).toFixed(3)})`, (q) => dormBokeh(q, abs), "memToggleBg");
      halo(k, P, 0.8 * (1 - 0.6 * cold), MEMORY_GLOW);
      const on = phase(abs, WORD.heart4 - 0.05, WORD.heart4 + 0.12);
      drawPhone(k, abs, P, (p) => wxPermission(p, on, { time: "21:20" }), { touches: [tap(abs, WORD.heart4, TOGGLE_AT[0], TOGGLE_AT[1])] });
      darkRound(k, 0.6 * cold, P.cx, P.cy - 120);
    }
  }, "dormMemory", abs >= dormAt && abs < toggleAt ? 0.68 : 1);
  timeCard(c, abs, "三年前", t0 + 0.1, t0 + 2.2);
  void end;
}

/** 18 · now: the same switch on her phone — she turns it off. It opens on the end of the whip down from her face
 *  (19): the phone comes up into place out of the blur. */
/** the switch goes off a beat after the phone lands (shot 19 got a beat longer for picking the phone up) */
const OFF_AT = () => at(83);
/** 18's camera, as where the phone sits on screen. 决心: it lands from the whip at full size and goes steadily in on
 *  the switch's row — the very framing of the night she switched it on (memory) — and on the click, warmth comes back
 *  into the room and the camera breathes out a little (20 carries on from where this ends). */
function permPlacement(abs: number): PhoneSpec {
  const push = easeInOut(phase(abs, at(SHOT.s18) + 0.12, OFF_AT() - 0.02));
  const click = abs < OFF_AT() ? 0 : Math.exp(-(abs - OFF_AT()) / 0.07);
  const out = easeInOut(phase(abs, OFF_AT() + 0.12, at(SHOT.s20)));
  const P = aimLerp(aimLerp({ cx: 540, cy: 930, s: 1 }, aim(300, 500, 540, 830, 1.24), push), aim(300, 560, 540, 880, 1.08), out);
  return { ...P, s: P.s * (1 + 0.012 * click) };
}
/** how far the warmth has come back into her room after the switch (0..1) */
const warmBack = (abs: number) => easeInOut(phase(abs, OFF_AT() + 0.02, OFF_AT() + 0.4));
const COLD_HALO = [150, 180, 255],
  WARM_HALO = [255, 206, 150];
const mixRgb = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(",");
function shot18(c: Ctx, abs: number, t0: number) {
  const draw = (k: Ctx) => {
    const P = permPlacement(abs);
    const warm = warmBack(abs);
    const push = easeInOut(phase(abs, t0 + 0.12, OFF_AT() - 0.02));
    roomBokeh(k, abs, { dark: 0.8 - 0.35 * warm, bright: 0.7 * warm });
    halo(k, P, 1 + 0.2 * warm, mixRgb(COLD_HALO, WARM_HALO, warm));
    const on = 1 - phase(abs, OFF_AT() - 0.03, OFF_AT() + 0.15);
    drawPhone(k, abs, P, (p) => wxPermission(p, on, { time: "02:53" }), { touches: [tap(abs, OFF_AT(), TOGGLE_AT[0], TOGGLE_AT[1]), tap(abs, at(84) - 0.04, 40, 120)] });
    darkRound(k, 0.45 * push * (1 - warm), P.cx, P.cy - 120);
  };
  if (abs >= t0 + WHIP_IN) return draw(c);
  const [dy, sm] = whip(abs, t0, -900, WHIP_OUT, WHIP_IN);
  smearV(c, (k) => {
    k.translate(0, dy);
    draw(k);
  }, sm, "s18w");
}

/** 19 · out of the memory, now (user: 「不应该放被子的场景，应该放坐在床上的场景，做一个拿起手机的动作」): she has sat
 *  up in bed in the dark — the same shot as act1's shot 6, where she put the phone down and switched the lamp off —
 *  crying; her phone lies face up on the pillow at her side, lit. She reaches over, picks it up, and as it comes up in
 *  front of her it turns its screen to her (its light moves from the pillow onto her face); she looks down at it, and
 *  the camera whips down along her look onto the phone (18). Sound: audio.json whipCry. */
const WHIP_OUT = 0.16,
  WHIP_IN = 0.24;
function shot19(c: Ctx, abs: number, t0: number) {
  const end = at(SHOT.s18);
  const [dy, sm] = whip(abs, end, -900, WHIP_OUT, WHIP_IN);
  if (sm === 0) return picksUp(c, abs, abs - t0, end - t0);
  smearV(c, (k) => {
    // below her the duvet and the dark floor (what the whip passes over on its way down)
    k.fillStyle = "#140f24";
    k.fillRect(-60, -60, W + 120, H + 120);
    k.translate(0, dy);
    picksUp(k, abs, abs - t0, end - t0);
  }, sm, "s19w");
}
type P2 = [number, number];
const lerpArc = (a: P2, b: P2, e: number, lift = 0): P2 => [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e - lift * Math.sin(Math.PI * e)];
/** her phone in head units, `up` 0 lying face up on the pillow → 1 upright in her hands with its screen to her: seen
 *  from the camera (a little above) it shows its lit screen squashed flat, goes edge-on, then shows its back */
function pickedPhone(q: Ctx, p: P2, up: number) {
  const tilt = up * Math.PI / 2,
    el = 0.47;
  const face = Math.sin(el - tilt); // > 0: we see the screen
  q.save();
  q.translate(p[0] + 26 * (1 - up), p[1] - 14 * (1 - up));
  // squashed on the screen's vertical (the camera looks down on it a little), then turned in its own plane
  q.scale(1, Math.max(0.04, Math.abs(face)));
  q.rotate(-0.08 + 1.62 * (1 - up));
  if (face > 0) {
    q.beginPath();
    q.roundRect(-46, -88, 92, 176, 16);
    q.fillStyle = "#17161d";
    q.fill();
    q.lineWidth = 5;
    q.strokeStyle = C.ink;
    q.stroke();
    q.beginPath();
    q.roundRect(-39, -80, 78, 160, 11);
    q.fillStyle = "#dfe7fb";
    q.fill();
    // the permission page she left open, a white list with one green switch
    q.fillStyle = "#c9d2e6";
    for (let i = 0; i < 4; i++) q.fillRect(-32, -60 + i * 26, 46, 7);
    q.fillStyle = "#45c26b";
    q.fillRect(18, -36, 14, 8);
  } else herPhoneBack(q, 0, 0, 92, 176, 0);
  q.restore();
}
function picksUp(c: Ctx, abs: number, u: number, len: number) {
  const { holdL, holdR, pillow, underL, underR } = SIT_HANDS;
  // the left hand goes out to the pillow, takes the phone and brings it up, turning it; the right comes to meet it;
  // her eyes follow it down
  const reach = easeInOut(phase(u, 0.28, 0.6));
  const up = easeInOut(phase(u, 0.64, 1.0));
  const right = easeInOut(phase(u, 0.78, 1.06));
  const look = easeInOut(phase(u, 0.98, 1.22));
  // 后悔: one slow push in on her face that keeps slowing (still moving when it whips away), tipping a little while
  // the room goes dark round her; it leans after her hand as she reaches over to the pillow, and comes back with it
  const push = easeOut(phase(u, 0, len));
  const lean = Math.sin(Math.PI * phase(u, 0.2, 0.95));
  c.save();
  // about her face (design 470, 640 — on screen at 452.5, 785 in the room shot's framing), drifting up a little so
  // the phone in her hands stays above the lyrics
  camera(c, SIT.x, SIT.y, SIT_CAM.z + 0.16 * push, -0.025 * push, -17.5 + 30 * lean, 145 - 40 * push);
  herRoomSnow(c, abs, { lamp: 0 });
  const handL = up > 0 ? lerpArc(pillow, holdL, up, 40) : lerpArc(underL, pillow, reach, 30);
  const handR = lerpArc(underR, holdR, right, 10);
  const held = up > 0;
  const phoneAt: P2 = held ? handL : pillow;
  // where the phone's light is (design units): on the pillow, then under her chin
  const lx = SIT.x + phoneAt[0] * SIT.s,
    ly = SIT.y + phoneAt[1] * SIT.s;
  const onPillow = 1 - up;
  if (!held) {
    c.save();
    c.translate(SIT.x, SIT.y);
    c.scale(SIT.s, SIT.s);
    pickedPhone(c, pillow, 0);
    c.restore();
  }
  // the screen lights the pillow round it while it lies there
  if (onPillow > 0) glow(c, lx, ly - 10, 260, "rgba(175,200,255,0.4)", onPillow);
  const sob = 4 * Math.sin(u * 14) * (1 - look);
  const her = (q: Ctx) =>
    herInBed(q, SIT.x, SIT.y, SIT.s, {
      eyes: "teary",
      brows: "sad",
      mouth: "wobble",
      tears: 0.45 + 0.55 * phase(u, 0, 0.7),
      // she looks across at it on the pillow, then down at it in her hands
      look: look > 0 ? [0, 0.85 * look] : [-0.7 * Math.max(0.4, reach), 0.45],
      headY: sob + 12 * look,
      tilt: -0.07 * reach * (1 - up),
      arms: "custom",
      handL,
      handR,
      shapeL: reach > 0.8 || held ? "hold" : "relax",
      shapeR: right > 0.5 ? "hold" : "relax",
      grip: (q2) => held && pickedPhone(q2, handL, up),
    });
  litFigure(c, her, {
    shade: 0.5,
    shadeCol: "rgb(12,14,40)",
    lights: [
      { x: 880, y: 420, r: 760, rgb: "120,150,240", a: 0.22 },
      // the phone: from the pillow at her side, then — once its screen turns to her — up under her chin, only on
      // her face (a big screen light over the chest washes the pyjamas and the phone out to a grey fog)
      { x: lx + 30 * up, y: ly - 190 * up, r: 380 - 60 * up, rgb: "175,200,255", a: 0.3 + 0.06 * up },
    ],
    rim: { ux: 0.7, uy: -0.7, rgb: "170,195,255", a: 0.48 },
  });
  lapDuvet(c, 1);
  c.restore();
  darkRound(c, 0.5 * push, 470, 760);
}

/** 20's camera, as where the phone sits on screen. 愧疚 → 鼓起勇气: from where 18 left off it settles on his
 *  unanswered 「吃饭了吗🌹」「降温了 多穿点🌹」 and the box she's typing in, and creeps closer while she types; on send
 *  it springs up onto her new bubble (act1's 兴奋, softer). 21 opens with his phone in exactly this place. */
const SEND_REPLY = () => at(85.5);
function chatPlacement(abs: number): PhoneSpec {
  const t0 = at(SHOT.s20);
  const read = easeInOut(phase(abs, t0, t0 + 0.3));
  const A = aimLerp(permPlacement(t0), aim(300, 540, 540, 870, 1.1), read);
  const creep = 1 + 0.035 * phase(abs, t0 + 0.3, SEND_REPLY());
  const pop = backOut(phase(abs, SEND_REPLY(), SEND_REPLY() + 0.22));
  return aimLerp({ ...A, s: A.s * creep }, aim(330, 500, 540, 800, 1.2), pop);
}
/** 20 · the chat with 爸爸: his unanswered 「吃饭了吗🌹」 「降温了 多穿点🌹」; she sends 「爸，这么晚还不睡？」. */
function shot20(c: Ctx, abs: number, t0: number) {
  const sendAt = SEND_REPLY();
  const P = chatPlacement(abs);
  // the room: from 18's returned warmth it dims a little over his unanswered messages, and lights up warm as she sends
  const guilt = easeInOut(phase(abs, t0, t0 + 0.3)) * (1 - phase(abs, sendAt, sendAt + 0.25));
  const glad = easeOut(phase(abs, sendAt, sendAt + 0.3));
  roomBokeh(c, abs, { dark: 0.45 + 0.15 * guilt - 0.2 * glad, bright: 0.7 - 0.4 * guilt + 0.3 * glad });
  halo(c, P, 1.2 + 0.25 * glad, mixRgb(COLD_HALO, WARM_HALO, 1));
  const typed = Array.from(REPLY).slice(0, Math.round(Array.from(REPLY).length * clamp((abs - t0 - 0.22) / 0.45))).join("");
  const sent = abs >= sendAt;
  const back = 1 - Math.pow(1 - phase(abs, t0, t0 + 0.2), 3);
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

/** 21 · the booth: his phone on the desk lights — her message over his wallpaper.
 *  同一时刻、另一部手机: it opens with his phone exactly where hers was as she sent (a match cut), and the camera backs
 *  off to show his desk; 意外: as her banner drops the camera jumps in on it (backOut), the phone buzzes, two yellow
 *  rings go out round her message and the warm light comes up off the desk. */
const P21: PhoneSpec = { cx: 540, cy: 880, s: 0.92, rot: 0.06 };
function shot21(c: Ctx, abs: number, t0: number) {
  const drop = at(86.5);
  const reveal = easeInOut(phase(abs, t0, t0 + 0.22));
  const surprise = backOut(phase(abs, drop + 0.04, drop + 0.2));
  const creep = phase(abs, drop + 0.2, at(SHOT.s21b));
  const S0 = aimLerp(aimLerp(chatPlacement(t0), P21, reveal), aim(300, 167, 540, 700, 1.3), surprise);
  const S = { ...S0, s: S0.s * (1 + 0.04 * creep) };
  // the camera is wherever it has to be for his phone (lying at P21 on the desk) to sit at S on screen
  c.save();
  camera(c, P21.cx, P21.cy, S.s / P21.s, (S.rot ?? 0) - (P21.rot ?? 0), S.cx - P21.cx, S.cy - P21.cy);
  deskTop(c, abs, { detailed: true, phoneLight: 1, phoneResting: true });
  const lit = easeOut(phase(abs, drop, drop + 0.3));
  if (lit > 0) glow(c, P21.cx, P21.cy - 200, 700, "rgba(255,200,140,0.22)", lit);
  drawPhone(c, abs, P21, (p) => {
    dadLock(p, { time: "02:54", date: "1月14日 星期二" });
    wxBanner(p, phase(abs, drop, drop + 0.25), DAD_CALLS_HER, REPLY, true);
    guideBox(p, 18, 70, SW - 36, 195, { ring: phase(abs, drop + 0.14, drop + 0.8) });
  }, { old: true, buzz: abs > drop && abs < drop + 0.4 ? 1 - (abs - drop) / 0.4 : 0 });
  c.restore();
}

/** 21b · his face as her message sinks in: stunned (eyes wide, mouth open) → his hand over his mouth, the tears
 *  coming → he laughs through them. Lit by the phone in his hands. */
/** 21b's camera zoom (about his face, design 540, 590) at shot time u. 震惊: the cut lands with a jolt in and then
 *  nothing moves (he's frozen); 泪: as his hand comes up over his mouth it goes slowly in to his eyes, the room
 *  going soft and dark round him; 笑: when the laugh breaks through it lets go a little and the warm light behind
 *  him comes up. 22 starts with his face exactly where this leaves it. */
function faceZoom(u: number) {
  return 1 + 0.07 * backOut(phase(u, 0, 0.18)) + 0.2 * easeInOut(phase(u, 0.6, 1.5)) - 0.08 * easeInOut(phase(u, 1.5, 2.17));
}
const FACE_AT: [number, number] = [540, 590];
function shot21b(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  const z = faceZoom(u);
  const tearsK = easeInOut(phase(u, 0.6, 1.5));
  const release = easeInOut(phase(u, 1.5, 2.17));
  const jolt = Math.exp(-u / 0.1);
  const [jx, jy] = u < 0.35 ? shake(abs, 8 * jolt, 21) : [0, 0];
  const cam = (k: Ctx, depth = 1) => camera(k, FACE_AT[0], FACE_AT[1], 1 + (z - 1) * depth, 0, jx * depth, jy * depth);
  c.save();
  cam(c, 0.45);
  boothFront(c, abs, { detailed: true, blur: 3.5 + 2.5 * tearsK - 1 * release, clock: 2.9 });
  if (release > 0) glow(c, 865, 520, 620, "rgba(255,190,120,0.18)", release);
  c.restore();
  c.save();
  cam(c);
  const stage = u < 0.6 ? 0 : u < 1.5 ? 1 : 2;
  const face =
    stage === 0
      ? { eyes: "wide" as const, brows: "up" as const, mouth: "o" as const }
      : stage === 1
        ? { eyes: "teary" as const, brows: "sad" as const, mouth: "wobble" as const }
        : { eyes: "happy" as const, mouth: "laugh" as const };
  // his right hand: it leaves the phone and comes up over his mouth as the tears start, holds there, and comes back
  // down to the phone as the laugh breaks through
  const cover = easeOut(phase(u, 0.62, 0.9)) * (1 - easeInOut(phase(u, 1.42, 1.7)));
  const phoneFinish = { detailed: true, caseColor: "#252d35", cameraColor: "#343e47" };
  // the phone goes low in his left hand while the right is up
  const phoneHeld = (q: Ctx) => phoneBack(q, -70 * cover, 420 + 80 * cover, 150 - 10 * cover, 270 - 10 * cover, 0.2 * cover, 0, phoneFinish);
  // the laugh shakes him in little bounces (shoulders and head up together)
  const laugh = phase(u, 1.5, 1.62);
  const bounce = -7 * laugh * Math.abs(Math.sin((u - 1.5) * 13));
  litFigure(c, (k) => drawDad(k, 540, 600 + bounce, 1.42, { coat: true, frontDetails: true, screenReflection: 0.65 - 0.35 * cover, ...face, arms: cover > 0 ? "mouth" : "phone", mouthK: cover, tears: phase(u, 0.7, 1.4), tilt: u < 1.5 ? 0.03 : -0.05, holding: phoneHeld }), {
    shade: 0.35,
    shadeCol: "rgb(12,27,39)",
    lights: [
      { x: 535, y: 815, r: 320, rgb: "149,190,210", a: 0.25 - 0.07 * cover },
      { x: 535, y: 1180, r: 215, rgb: "144,183,201", a: 0.1 },
      { x: 865, y: 555, r: 480, rgb: "245,178,106", a: 0.19 + 0.12 * laugh },
    ],
    rim: { ux: 1, uy: -0.4, rgb: "245,190,123", a: 0.34 + 0.09 * laugh + 0.08 * release, width: 5 },
  });
  filtered(c, "blur(0.7px)", (k) => boothFrontDesk(k, abs), "s21bdesk");
  c.restore();
  darkRound(c, 0.4 * tearsK * (1 - 0.6 * release), 540, 640);
}

/** 22 · out through the booth window into the snow: the small warm booth, him bowed over the phone typing his reply
 *  with one finger, smiling; the end. */
function shot22(c: Ctx, abs: number, t0: number) {
  // Overscan the night sky before the final downward camera offset exposes the top edge.
  fillBg(c, "#070b1d");
  // 温暖、余韵: one move out through the window. It starts with his face exactly where 21b left it (the room inside
  // the window is 21b's room at 0.28169 scale, so his head is at 590, 925 here, s 0.4) and slows all the way to the
  // end, still drifting as the song ends
  // a soft start (21b's camera had come to rest), quickly up to speed, then slowing all the way to the end
  const x = phase(abs, t0, END);
  const e = 1 - Math.pow(1 - x, 3) * (1 + 3 * x);
  const zEnd = faceZoom(at(SHOT.s22) - at(SHOT.s21b));
  const s0 = (1.42 * zEnd) / 0.4;
  const z = s0 * Math.pow(1 / s0, e);
  // where his head is on screen: from 21b's last frame (head 540, 600 zoomed about FACE_AT) to the wide's
  const hx = 540 + (590 - 540) * e,
    hy = FACE_AT[1] + (600 - FACE_AT[1]) * zEnd + (1055 - FACE_AT[1] - (600 - FACE_AT[1]) * zEnd) * e;
  camera(c, 590, 925, z, 0, hx - 590, hy - 925);
  // his reply, one finger, one key on each beat: a quick press, a slower lift
  const tapK = [92.5, 93.5, 94.5, 95.5].reduce((m, b) => {
    const d = abs - at(b);
    return Math.max(m, d < -0.05 || d > 0.16 ? 0 : d < 0 ? 1 + d / 0.05 : 1 - d / 0.16);
  }, 0);
  // he is still laughing through his tears as we leave him (as 21b ended), then settles into a smile over his reply
  const settle = phase(abs, t0, t0 + 0.6);
  boothOutside(c, abs, (k) => {
    litFigure(k, (q) => drawDad(q, 590, 925, 0.4, { coat: true, frontDetails: true, screenReflection: 0.5, eyes: "happy", mouth: settle < 0.6 ? "laugh" : "smile", tears: 1 - phase(abs, t0 + 0.2, t0 + 1.0), tilt: -0.05 * (1 - settle), arms: "type", tap: tapK, holding: (r) => phoneBack(r, -10, 400, 150, 270, -0.08, 0, { detailed: true, caseColor: "#252d35", cameraColor: "#343e47" }) }), {
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
