// 第一幕 · 她的视角（0–32 拍）。开头是用户定的：她刚发出「下雪了」，评论区马上出现没头像的陌生号的评论「这么晚还不睡？🌹」、
// 通知也弹下来，镜头移到评论区那条评论 → 她打开消息列表，一路划下去全是这个灰头像（三年）→ 她的表情特写（5 秒内放完）→ 点进他的主页：只关注了她 → 拉黑
// → 关灯 → 又一个灰头像：「那个男生配不上你🌹」→ 锁屏，黑屏里她惊恐的脸。
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase } from "@frame/engine/math";
import { C, Ctx, H, W, backOut, blob, camera, castShadow, designScene, fillBg, filtered, glow, handheld, litFigure, paint, smear, smearV } from "@materials/s0rrow/code/draw";
import { SH, SW } from "@materials/s0rrow/code/phone";
import { drawKid } from "@materials/s0rrow/code/kid";
import { SHOT, WORD, at } from "./timeline";
import { ACC_A, ACC_B, BLOCK_AT, HISTORY_END, INBOX_AT, MENU_AT, POST_BTN, ROW_B, couplePhoto, pulseBox, say, snowPhoto, vidBanner, vidBlock, vidComments, vidCompose, vidFollowing, vidPost, vidProfile, slide } from "./ui";
import { LAMP_AT, bedFromAbove, herFace, herInBed, herPhoneBack, herRoomSnow, lapDuvet, roomBokeh } from "./world";
import { aim, decay, drawPhone, emph, enter, exit, fade, jolt, moveBlur, nudge, phoneXf, slow, snap, steps, tap, whip, zoomSteps, type PhoneSpec, type Xf } from "./shots";
import { PULL_START, pullOut } from "./journey";

const TIME = "02:47";
/** the phone in the opening shots: under the hook, with the post's comment area above the lyrics */
const OPEN: PhoneSpec = { cx: 540, cy: 960, s: 0.95, rot: -0.02 };
/** the out-of-focus room behind a phone close-up moves with the phone, at a small fraction of its travel */
const bokehShift = (P: PhoneSpec, rest: PhoneSpec = OPEN): [number, number] => [0.15 * (P.cx - rest.cx), 0.15 * (P.cy - rest.cy)];

export function createScene(options: SceneOptions) {
  return designScene(options, 0, (ctx, abs) => draw(ctx, abs));
}

function draw(c: Ctx, abs: number) {
  const s2 = at(SHOT.s2),
    s3 = at(SHOT.s3),
    s4 = at(SHOT.s4),
    s5 = at(SHOT.s5),
    s6 = at(SHOT.s6),
    s7 = at(SHOT.s7),
    s8 = at(SHOT.s8),
    s9 = at(SHOT.s9);
  if (abs < s2) shot1(c, abs);
  else if (abs < s3) shot2(c, abs, s2, s3);
  else if (abs < s4) shot3(c, abs, s3, s4);
  else if (abs < s5) shot4(c, abs, s4);
  else if (abs < s6) shot5(c, abs, s5);
  else if (abs < s7) shot6(c, abs, s6);
  else if (abs < s8) shot7(c, abs);
  else if (abs < s9) shot8(c, abs);
  else shot9(c, abs, s9);
}

/** her new post: the stranger's comment pops into the comment area on beat 1.5, the banner drops on beat 2 */
/** the stranger keeps coming (kept to three so it reads as harassment, not a flood): one the moment she posts, a second
 *  as the camera reaches it, a third when she is back on his page — then she blocks him */
const NEW = [
  { text: "这么晚还不睡？", at: () => at(1.5) },
  { text: "窗户关好", at: () => at(3) },
  // one more the moment she gets back to his page — the last straw before she blocks him
  { text: "还在看手机？", at: () => at(15.1), hold: 0.45 },
];
/** the banner for the newest comment that has arrived by `abs` (it drops in, then slides away after a while) */
function newBanner(p: Ctx, abs: number) {
  let n = 0;
  NEW.forEach((c, i) => {
    if (abs >= c.at()) n = i + 1;
  });
  if (n === 0) return;
  const t = NEW[n - 1].at();
  // every banner slides away by itself after a while, like the real thing (a stale one used to flash up again at
  // the start of shot 5)
  const hold = (NEW[n - 1] as { hold?: number }).hold ?? 1.6;
  const shown = phase(abs, t, t + 0.2) * (1 - phase(abs, t + hold, t + hold + 0.2));
  vidBanner(p, shown, { name: ACC_A, body: NEW[n - 1].text, rose: true, details: true });
  if (shown <= 0) return;
  const bump = 0.4 + 0.6 * backOut(phase(abs, t + 0.04, t + 0.3));
  p.save();
  p.translate(540, -88 + 208 * (1 - Math.pow(1 - clamp(shown), 3)));
  p.scale(bump, bump);
  p.fillStyle = "#fe2c55";
  p.beginPath();
  p.arc(0, 0, 26, 0, Math.PI * 2);
  p.fill();
  say(p, String(n), 0, 1, 30, { weight: 700, align: "center" });
  p.restore();
}
/** the phone buzzes on each new comment */
const newBuzz = (abs: number) => NEW.reduce((m, c) => Math.max(m, abs > c.at() ? 1 - clamp((abs - c.at()) / 0.3) : 0), 0);
function postWithComment(p: Ctx, abs: number, mark = 0) {
  vidPost(p, {
    time: TIME,
    photo: snowPhoto,
    caption: "下雪了",
    ago: "刚刚",
    likes: 0,
    details: true,
    showComments: true,
    mark,
    comments: NEW.slice(0, 2).map((c) => ({ name: ACC_A, text: c.text, rose: true, ago: "刚刚", pop: phase(abs, c.at(), c.at() + 0.15) })),
  });
  newBanner(p, abs);
}
/** the first comment framed big (the second one drops in just under it as the camera arrives) */
const ON_COMMENT = () => aim(300, 880, 540, 800, 1.5);
/** 「瘦了🌹」 framed after the fling, low enough that the new banner clears the hook text */
const ON_ROW_B = () => aim(300, 556, 540, 990, 1.3);
/** The camera on her phone in shots 1–2 (the same phone, no cut). It holds still while she reads and moves in quick,
 *  separate moves that land on the beat: onto the first comment the moment it arrives (lands on 2½); a punch-in as the
 *  second one drops in (beat 3); back out to the whole phone as her thumb goes to 「互动消息」 (lands on 4¼, before the
 *  list's page push is under way and well before the fling); onto 「瘦了」 as the list brakes on it (lands on 6¼); then
 *  still until the whip. */
function openCam(abs: number): PhoneSpec {
  const land = at(SHOT.s2) + FLING_LAND;
  return steps(abs, OPEN, [
    { at: at(1.75), len: at(2.5) - at(1.75), to: ON_COMMENT() },
    { at: at(3), len: 0.16, to: nudge(ON_COMMENT(), 300, 880, 1.04), ease: snap },
    { at: at(3.625), len: at(4.25) - at(3.625), to: OPEN },
    { at: land + 0.02, len: at(6.25) - land - 0.02, to: ON_ROW_B() },
  ]);
}

/** 1 · she posts 「下雪了」 (her thumb on 「发布」 in the first frame); the post goes up and the comment is already in
 *  the comment area — then the banner drops and the phone buzzes; the camera moves onto that comment. */
function shot1(c: Ctx, abs: number) {
  const press = at(0.4);
  const P = openCam(abs);
  moveBlur(c, phoneXf(openCam(abs - 1 / 60)), phoneXf(P), (k) => shot1Frame(k, abs, P, press), "s1blur");
}
function shot1Frame(c: Ctx, abs: number, P: PhoneSpec, press: number) {
  roomBokeh(c, abs, { shift: bokehShift(P) });
  glow(c, P.cx, P.cy - 120 * P.s, 820 * P.s, "rgba(120,150,255,0.26)");
  drawPhone(c, abs, P, (p) => {
    const compose = (k: Ctx) => vidCompose(k, { time: TIME, photo: snowPhoto, caption: "下雪了", caret: abs < press, press: phase(abs, press - 0.05, press) });
    const posted = (k: Ctx) => postWithComment(k, abs, commentMark(abs));
    // publishing: the compose sheet drops away like a dismissed modal (accelerating), and the post underneath
    // comes forward from a slightly smaller, dimmed state — no cross-fade, so there's never a double image
    const k = phase(abs, press + 0.03, press + 0.27);
    if (k <= 0) compose(p);
    else if (k >= 1) posted(p);
    else {
      const rise = enter(k);
      p.save();
      p.translate(SW / 2, SH / 2);
      p.scale(0.93 + 0.07 * rise, 0.93 + 0.07 * rise);
      p.translate(-SW / 2, -SH / 2);
      posted(p);
      p.restore();
      p.fillStyle = `rgba(0,0,0,${(0.55 * (1 - rise)).toFixed(3)})`;
      p.fillRect(0, 0, SW, SH);
      const drop = exit(k);
      p.save();
      p.translate(0, SH * 1.05 * drop);
      compose(p);
      // a soft shadow above the falling sheet's top edge
      const sh = p.createLinearGradient(0, -40, 0, 0);
      sh.addColorStop(0, "rgba(0,0,0,0)");
      sh.addColorStop(1, "rgba(0,0,0,0.35)");
      p.fillStyle = sh;
      p.fillRect(0, -40, SW, 40);
      p.restore();
    }
  }, { buzz: newBuzz(abs), touches: [tap(abs, press, POST_BTN[0], POST_BTN[1]), tap(abs, at(SHOT.s2) - 0.04, INBOX_AT[0], INBOX_AT[1])] });
}

/** 2 · she opens her message list: the camera pulls back off the comment as the list slides in, and she flicks it —
 *  a fast fling through three years of the same grey avatar (motion-blurred) that lands, with a little overshoot, on
 *  「瘦了🌹」 (2023-06-18); the camera pushes onto that row; then whips up to her face. */
const FLING_LAND = 0.78; // seconds into the shot
/** the first comment's yellow pulse, on the off-beat after the punch-in (it carries on into the list: same phone) */
const commentMark = (abs: number) => phase(abs, at(3.5), at(3.5) + 0.6);
function shot2(c: Ctx, abs: number, t0: number, end: number) {
  const [dy, sm] = whip(abs, end, 900);
  smearV(
    c,
    (k) => {
      k.save();
      k.translate(0, dy);
      const P = openCam(abs);
      moveBlur(k, phoneXf(openCam(abs - 1 / 60)), phoneXf(P), (q) => shot2Frame(q, abs, t0, P), "s2blur");
      k.restore();
    },
    sm,
    "w2",
  );
}
function shot2Frame(c: Ctx, abs: number, t0: number, P: PhoneSpec) {
  const u = abs - t0;
  // the room dims a little as the list opens (eased, not switched at the tap)
  roomBokeh(c, abs, { dark: 0.15 * fade(u / 0.25), shift: bokehShift(P) });
  glow(c, P.cx, P.cy - 120 * P.s, 820 * P.s, "rgba(120,150,255,0.26)");
  // the fling: very fast, braking hard onto 瘦了 — it runs 2% past and eases back (from rest, so the list never
  // jumps into the bounce)
  const span = FLING_LAND - 0.2;
  const f = clamp((u - 0.2) / span);
  const sc = u < FLING_LAND ? HISTORY_END * 1.02 * (1 - Math.pow(1 - f, 3.2)) : HISTORY_END * (1.02 - 0.02 * emph((u - FLING_LAND) / 0.3));
  const speed = u > 0.2 && u < FLING_LAND ? (HISTORY_END * 1.02 * 3.2 * Math.pow(1 - f, 2.2)) / span : 0;
  const blur = Math.min(180, speed / 48);
  drawPhone(c, abs, P, (p) => {
    const inbox = (q: Ctx) => vidComments(q, { scroll: sc, time: TIME, marks: [[ROW_B, phase(u, FLING_LAND, FLING_LAND + 0.6)]] });
    slide(p, (u - 0.04) / 0.26, (q) => postWithComment(q, abs, commentMark(abs)), (q) => smear(q, inbox, 0, blur, "fling"));
  }, {
    buzz: newBuzz(abs),
    touches: [
      // the tap on 「互动消息」 lifts off here (it went down at the end of shot 1)
      tap(abs, t0 - 0.04, INBOX_AT[0], INBOX_AT[1]),
      { x: 300, y: 1050 - 600 * exit((u - 0.13) / 0.13), k: fade((u - 0.09) / 0.04) * (1 - fade((u - 0.24) / 0.04)) },
    ],
  });
}

/** 3 · her face over the duvet in the phone's light: the whip lands on her, and on 「even」 (beat 8½) the fright hits — a
 *  snap push with a knock — as she yanks the duvet up to her nose, eyes darting; the camera whips back down to the phone. */
function shot3(c: Ctx, abs: number, t0: number, end: number) {
  const [dyIn, smIn] = whip(abs, t0, 900);
  const [dyOut, smOut] = whip(abs, end, -900);
  const dy = abs < t0 + 0.22 ? dyIn : abs > end - 0.15 ? dyOut : 0;
  const sm = abs < t0 + 0.22 ? smIn : abs > end - 0.15 ? smOut : 0;
  const hit = at(8.5);
  const z = zoomSteps(abs, 1, [{ at: hit, len: 0.16, to: 1.09, ease: snap }]);
  const [jx, jy] = jolt(abs, hit, 12, 12);
  const [hx, hy, hr] = handheld(abs, 4, 3);
  smearV(
    c,
    (k) => {
      k.save();
      k.translate(0, dy);
      camera(k, 540, 760, z, hr, hx + jx, hy + jy);
      // she yanks the duvet up to her nose as the fright hits; her eyes dart (quick jumps, not a slow swing)
      const up = emph(phase(abs, hit - 0.1, hit + 0.2));
      const darts = [0, 0.3, -0.25, 0.2, -0.3, 0.1];
      const look = darts[Math.min(darts.length - 1, Math.max(0, Math.floor((abs - hit) / 0.12) + 1))];
      herFace(k, abs, { lamp: 1, top: 1030 - 140 * up, grip: up, pose: { eyes: "wide", mouth: "o", brows: "up", look: [look, 0.55], blush: 0 } });
      k.restore();
    },
    sm,
    "w3",
  );
}

/** The phone in shots 4–5 (one camera, no cut): steady while she reads, a quick reframe for each clue once its page has
 *  landed, the pulse going out as the camera lands — 「关注 1」 on his profile (beat 11½), her own row as the only one
 *  he follows (beat 13½) — back out to the whole phone once his page has slid back (lands on 16¼, as she taps
 *  「···」), and in on the 「确定拉黑」 dialog as it pops up (beat 17¾). Page and camera never move at once. */
const PHONE: PhoneSpec = { cx: 540, cy: 930, s: 1 };
const ON_STATS = () => aim(294, 452, 540, 760, 1.3);
const ON_HER_ROW = () => aim(300, 261, 540, 640, 1.3);
const ON_DIALOG = () => aim(300, 640, 540, 900, 1.12);
function blockCam(abs: number): PhoneSpec {
  return steps(abs, PHONE, [
    { at: at(11.5) - 0.24, len: 0.24, to: ON_STATS() },
    { at: at(13), len: at(13.5) - at(13), to: ON_HER_ROW() },
    { at: at(15.75), len: at(16.25) - at(15.75), to: PHONE },
    { at: at(17.25), len: at(17.75) - at(17.25), to: ON_DIALOG() },
  ]);
}

/** 4 · back on the phone: she taps the grey avatar — 0 works, 0 fans, follows 1 — and the one it follows is her. */
function shot4(c: Ctx, abs: number, t0: number) {
  const [dy, sm] = whip(abs, t0, -900);
  const u = abs - t0;
  const P = blockCam(abs);
  smearV(
    c,
    (k) => {
      k.save();
      k.translate(0, abs < t0 + 0.22 ? dy : 0);
      moveBlur(k, phoneXf(blockCam(abs - 1 / 60)), phoneXf(P), (q) => {
        roomBokeh(q, abs, { dark: 0.2, shift: bokehShift(P, PHONE) });
        glow(q, P.cx, P.cy - 70 * P.s, 900 * P.s, "rgba(120,150,255,0.26)");
        drawPhone(q, abs, P, (p) => {
          const inbox = (r: Ctx) => vidComments(r, { scroll: HISTORY_END, time: TIME });
          // each clue's pulse goes out as the camera lands on it
          const profile = (r: Ctx) => vidProfile(r, { name: ACC_A, time: TIME, pulse: phase(abs, at(11.5), at(11.5) + 0.45) });
          const following = (r: Ctx) => vidFollowing(r, { time: TIME, pulse: phase(abs, at(13.5), at(13.5) + 0.6) });
          if (u < 0.25) inbox(p);
          else if (u < 1.18) slide(p, (u - 0.25) / 0.26, inbox, profile);
          else slide(p, (u - 1.18) / 0.26, profile, following);
        }, { buzz: newBuzz(abs), touches: [tap(abs, t0 + 0.23, 64, 246), tap(abs, t0 + 1.16, 294, 452)] });
      }, "s4blur");
      k.restore();
    },
    abs < t0 + 0.22 ? sm : 0,
    "w4",
  );
}

/** 5 · block: back to his page — and another one comes in, 「还在看手机？🌹」; then 「···」, 「拉黑」, confirm, 「已拉黑」. */
function shot5(c: Ctx, abs: number, t0: number) {
  const P = blockCam(abs);
  moveBlur(c, phoneXf(blockCam(abs - 1 / 60)), phoneXf(P), (k) => shot5Frame(k, abs, t0, P), "s5blur");
}
function shot5Frame(c: Ctx, abs: number, t0: number, P: PhoneSpec) {
  roomBokeh(c, abs, { dark: 0.2, shift: bokehShift(P, PHONE) });
  glow(c, P.cx, P.cy - 70 * P.s, 900 * P.s, "rgba(120,150,255,0.26)");
  const u = abs - t0;
  drawPhone(c, abs, P, (p) => {
    const following = (q: Ctx) => vidFollowing(q, { time: TIME });
    const profile = (q: Ctx) => vidProfile(q, { name: ACC_A, time: TIME, menu: phase(u, 0.56, 0.64) * (1 - phase(u, 0.72, 0.8)), blocked: phase(u, 1.46, 1.6) });
    // back: the profile slides back in from the left
    if (u < 0.26) {
      const e = emph(u / 0.26);
      p.save();
      p.translate(-180 * (1 - e), 0);
      profile(p);
      p.restore();
      p.save();
      p.translate(600 * e, 0);
      following(p);
      p.restore();
    } else profile(p);
    newBanner(p, abs);
    vidBlock(p, { sheet: phase(u, 0.62, 0.8) * (1 - phase(u, 1.02, 1.1)), hot: phase(u, 0.94, 1.0), confirm: phase(u, 1.08, 1.2), done: phase(u, 1.46, 2.15) });
  }, {
    buzz: newBuzz(abs),
    touches: [tap(abs, t0 + 0.02, 40, 120), tap(abs, t0 + 0.6, MENU_AT[0], MENU_AT[1]), tap(abs, t0 + 0.98, BLOCK_AT[0], BLOCK_AT[1]), tap(abs, t0 + 1.42, 420, 720)],
  });
}

/** 6 · she lets out a breath, puts the phone face down, the lamp goes off. */
function shot6(c: Ctx, abs: number, t0: number) {
  const off = at(21); // lamp off on the beat (the switch's click is in audio.json)
  const lamp = abs < off ? 1 : 0;
  const u = abs - t0;
  const k = off - t0; // when the lamp goes off, in shot time
  // a still, quiet frame: all the movement is hers (the camera only breathes)
  const [hx, hy, hr] = handheld(abs, 2.5, 6);
  camera(c, 540, 700, 1.25, hr, hx, 160 + hy);
  herRoomSnow(c, abs, { lamp });
  if (!lamp) {
    glow(c, LAMP_AT[0], LAMP_AT[1] + 20, 60, "rgba(255,170,90,0.6)", decay(abs, off, 0.45));
  }
  // her hands: both on the phone → the left lays it face down on the pillow beside her while the right reaches for
  // the lamp → both back under the duvet
  const lerp2 = (a: [number, number], b: [number, number], e: number): [number, number] => [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e];
  const LAMP_R: [number, number] = [(LAMP_AT[0] - HX) / HS, (LAMP_AT[1] + 40 - HY) / HS];
  // she breathes out (to beat 20), lays the phone down on it (lands on 20½), reaches for the lamp — the click is beat
  // 21 — and her hands go back under the duvet; each move quick off the mark and soft on landing
  const put = emph(phase(abs, at(20), at(20.5))),
    settle = emph(phase(abs, at(20.5) + 0.04, at(21) - 0.02)),
    reach = emph(phase(abs, at(20.25), off - 0.02)),
    back = emph(phase(abs, off + 0.16, off + 0.5));
  const handL = settle > 0 ? lerp2(PILLOW_L, REST_L, settle) : lerp2([-58, 330], PILLOW_L, put);
  const handR = back > 0 ? lerp2(LAMP_R, REST_R, back) : lerp2([58, 330], LAMP_R, reach);
  const holding = put < 1;
  // the phone, turning flat as it goes down onto the pillow (head units, in her hand's space)
  const phoneIn = (q: Ctx, e: number, p: [number, number]) => {
    q.save();
    q.translate(p[0] + 40 * (1 - e), p[1] - 10);
    q.scale(1, 1 - 0.58 * e);
    herPhoneBack(q, 0, 0, 92, 176, -0.1 + (Math.PI / 2 + 0.35) * e);
    q.restore();
  };
  if (!holding) {
    c.save();
    c.translate(HX, HY);
    c.scale(HS, HS);
    phoneIn(c, 1, PILLOW_L);
    c.restore();
  }
  const her = (q: Ctx) =>
    herInBed(q, HX, HY, HS, {
      eyes: abs < at(20) - 0.04 ? "shut" : "tired",
      mouth: abs < at(20) - 0.04 ? "o" : "flat",
      look: u >= k + 0.1 ? [0.6, -0.4] : reach > 0.3 ? [0.9, -0.1] : put > 0 ? [-0.6, 0.5] : [0.1, 0.7],
      // the sigh lifts out of her slowly; she leans toward the lamp and back (no snapping between poses)
      headY: 6 * (1 - emph(phase(abs, t0 + 0.06, at(20)))),
      tilt: 0.08 * reach * (1 - back),
      arms: "custom",
      handL,
      handR,
      shapeL: holding ? "hold" : "relax",
      shapeR: reach === 0 ? "hold" : back < 0.5 ? "flat" : "relax",
      grip: (q) => holding && phoneIn(q, put, put > 0 ? handL : [-18, 330]),
    });
  if (lamp) {
    // Cast away from the bedside bulb onto the wall and upholstered headboard.
    castShadow(c, LAMP_AT, 1.25, her, "#0b1026", 12, 0.36, (q) => {
      q.beginPath(); q.rect(-100, 0, 1300, 960); q.rect(632, 230, 406, 510); q.clip("evenodd");
    });
    litFigure(c, her, { shade: 0.2, shadeCol: "rgb(22,17,44)", lights: [{ x: LAMP_AT[0], y: LAMP_AT[1], r: 520, rgb: "255,186,110", a: 0.35 }], rim: { ux: 1, uy: -0.25, rgb: "255,205,150", a: 0.4 } });
  }
  else
    litFigure(c, her, { shade: 0.5, shadeCol: "rgb(12,14,40)", lights: [{ x: 880, y: 420, r: 760, rgb: "120,150,240", a: 0.22 }], rim: { ux: 0.7, uy: -0.7, rgb: "170,195,255", a: 0.48 } });
  lapDuvet(c, 1 - lamp);
}
/** where she sits in shot 6 (head centre, scale) */
const HX = 470,
  HY = 640,
  HS = 0.95;
/** her hands in shot 6 (head units): the phone goes down on the pillow at her left; at rest they're under the duvet */
const PILLOW_L: [number, number] = [-232, 190],
  REST_L: [number, number] = [-70, 420],
  REST_R: [number, number] = [70, 420];

/** 7 · the dark, from straight above: her phone face down on the pillow; light leaks out round its edges onto the
 *  pillowcase and it buzzes; it turns over (the screen's light floods the pillow). */
function shot7(c: Ctx, abs: number) {
  pillowShot(c, abs);
}
/** Shots 7 and 8 share one world: the bed from straight above and her phone on the pillow at PILLOW_PHONE. `u` is the
 *  time into shot 7 (the phone turns over at 0.75–1.05); `screen` draws extra things on the phone's screen. */
const PILLOW_PHONE: PhoneSpec = { cx: 540, cy: 900, s: 0.55 };
/** The camera over the pillow (shots 7–8, no cut): still while the phone buzzes and turns over; on beat 25½ a crash
 *  zoom onto the banner — there in a quarter of a second (beat 26), knocked on arrival as the pulses go out — then still
 *  while it sinks in. */
const ON_BANNER = () => aim(330, 176, 540, 760, 1.9);
function pillowCam(abs: number): PhoneSpec {
  return steps(abs, PILLOW_PHONE, [{ at: at(25.5), len: at(26) - at(25.5), to: ON_BANNER() }]);
}
/** the pillow world's map to the frame for a placement of its phone (plus the camera's own shake) */
const pillowXf = (P: PhoneSpec, d: [number, number] = [0, 0]): Xf => {
  const k = P.s / PILLOW_PHONE.s;
  return { x: P.cx - k * PILLOW_PHONE.cx + d[0], y: P.cy - k * PILLOW_PHONE.cy + d[1], z: k };
};
function pillowShot(c: Ctx, abs: number, screen?: (p: Ctx) => void) {
  const [jx, jy] = jolt(abs, at(26), 14, 13);
  const X = pillowXf(pillowCam(abs), [jx, jy]);
  moveBlur(c, pillowXf(pillowCam(abs - 1 / 60)), X, (q) => {
    q.save();
    q.translate(X.x, X.y);
    q.scale(X.z, X.z);
    pillowWorld(q, abs, abs - at(SHOT.s7), screen);
    q.restore();
  }, "pillowBlur");
}
function pillowWorld(c: Ctx, abs: number, u: number, screen?: (p: Ctx) => void) {
  // the bed at the phone's scale: the pillow fills the frame
  c.save();
  c.translate(540, 900);
  c.scale(1.9, 1.9);
  c.translate(-540, -900);
  bedFromAbove(c, abs);
  c.restore();
  const flip = emph(phase(u, 0.75, 1.05));
  const sx = Math.cos(flip * Math.PI);
  const buzz = decay(u, 0, 0.6);
  const jx = buzz > 0 ? Math.sin(abs * 90) * 6 * buzz : 0;
  const rot = -0.25 + 0.25 * flip;
  // Both sides use the same outer shell dimensions, including the screen's frame.
  const phoneScale = 0.55, pw = (SW + 52) * phoneScale, ph = (SH + 52) * phoneScale;
  // light spilling onto the pillowcase (a rim round the case while face down, a flood once it's up)
  c.save();
  c.globalCompositeOperation = "lighter";
  glow(c, 540 + jx, 900, 430 + 380 * flip, "rgba(110,140,230,0.55)", 0.7 + 0.3 * flip);
  c.restore();
  c.save();
  c.translate(540 + jx, 900);
  c.rotate(rot);
  const w = Math.abs(sx) < 0.02 ? 0.02 : sx;
  const edge = Math.sin(flip * Math.PI);
  // A soft cast shadow plus a tight contact edge follows the width of the turning phone.
  c.save();
  c.scale(Math.max(0.1, Math.abs(w)), 1);
  c.shadowColor = "rgba(3,3,12,0.58)";
  c.shadowBlur = 22 + 12 * edge;
  c.shadowOffsetX = 9 + 8 * edge; c.shadowOffsetY = 14 + 14 * edge;
  c.fillStyle = "rgba(4,4,14,0.38)";
  rrPath(c, -pw / 2 + 7, -ph / 2 + 10, pw, ph, 55);
  c.fill();
  c.restore();
  // Faint creases where the pillow gives under the two lower corners.
  if (flip < 0.5) {
    c.save(); c.globalAlpha = 0.3 * (1 - 2 * flip);
    c.lineCap = "round"; c.lineWidth = 2.2;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const x = side * (pw / 2 - 5), y = ph / 2 - 84 + i * 19;
        c.strokeStyle = "rgba(10,12,28,0.7)";
        c.beginPath(); c.moveTo(x, y);
        c.quadraticCurveTo(x + side * 24, y + 7, x + side * (45 + i * 13), y + 30 + i * 7); c.stroke();
      }
    }
    c.restore();
  }
  // A narrow metal rail stays visible when the handset is exactly on its edge.
  if (edge > 0.02) {
    const thickness = 16 * edge, edgeX = -pw / 2 * Math.abs(w);
    const metal = c.createLinearGradient(edgeX - thickness, 0, edgeX + thickness, 0);
    metal.addColorStop(0, "#554252"); metal.addColorStop(0.45, "#b09ab5"); metal.addColorStop(1, "#382c43");
    c.fillStyle = metal;
    rrPath(c, edgeX - thickness / 2, -ph / 2 + 7, thickness, ph - 14, thickness / 2);
    c.fill();
  }
  c.scale(w, 1);
  if (sx > 0) {
    // Screen light leaks onto the cloth under the case, with a soft edge rather than a solid neon rim.
    c.save();
    c.globalCompositeOperation = "lighter";
    c.shadowColor = "rgba(150,183,255,0.6)"; c.shadowBlur = 18;
    c.strokeStyle = "rgba(160,190,245,0.32)";
    c.lineWidth = 7;
    rrPath(c, -pw / 2 - 3, -ph / 2 - 3, pw + 6, ph + 6, 58);
    c.stroke();
    c.restore();
    herPhoneBack(c, 0, 0, pw, ph);
    // the back faces up into the dark: only the leak round its edges lights it
    c.fillStyle = "rgba(10,8,26,0.42)";
    rrPath(c, -pw / 2, -ph / 2, pw, ph, 55);
    c.fill();
  } else {
    c.scale(-1, 1);
    drawPhone(c, abs, { cx: 0, cy: 0, s: phoneScale }, (p) => {
      vidPost(p, { time: "02:49", photo: couplePhoto(false), caption: "周末～", ago: "3小时前", details: true });
      vidBanner(p, phase(u, 1.05, 1.3), { name: ACC_B, body: "那个男生配不上你", rose: true, details: true });
      screen?.(p);
    });
  }
  c.restore();
}
function rrPath(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

/** 8 · the new message: the grey avatar again, on her photo with her boyfriend — the camera rushes onto the banner
 *  「那个男生配不上你🌹」 (two yellow pulses) and holds while it sinks in. */
function shot8(c: Ctx, abs: number) {
  // no cut: the same pillow and phone as shot 7, and the slow push there turns into a rush onto the banner
  pillowShot(c, abs, (p) => pulseBox(p, 18, 84, 564, 172, phase(abs, at(26), at(26) + 0.7)));
}

/** 9 · her face, not in a reflection: frozen over the duvet in the dark, only the phone lighting her from below; a
 *  slow push; on the song's stop the camera pulls out through her window (journey.ts). */
function shot9(c: Ctx, abs: number, t0: number) {
  // on the song's stop the camera pulls out of her face, out of her window — the start of the long flight to him
  if (abs >= PULL_START) pullOut(c, abs, (k) => faceScared(k, abs, t0));
  else faceScared(c, abs, t0);
}
export function faceScared(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  // the cut lands on her with a start (the frame knocked), then the dread: one slow push in until the song stops
  const [jx, jy] = jolt(abs, t0, 10, 11);
  const [hx, hy, hr] = handheld(abs, 3, 9);
  const z = 1.04 * zoomSteps(abs, 1, [{ at: t0 + 0.3, len: WORD.stop - t0 - 0.3, to: 1.1, ease: slow }]);
  camera(c, 540, 760, z, hr, hx + jx, hy + jy);
  // surprise first (brows up, she jerks back), then fear: brows knit, she shrinks down and trembles
  const start = snap(phase(u, 0, 0.16)) * (1 - emph(phase(u, 0.16, 0.45)));
  const scared = emph(phase(u, 0.4, 0.62));
  const tremble = scared * Math.sin(abs * 38) * 3;
  herFace(c, abs, {
    lamp: 0,
    top: 1050 - 30 * scared,
    grip: scared,
    x: 540 + tremble,
    y: 780 - 26 * start + 22 * scared,
    s: 1.6,
    // once afraid, her eyes flick about (quick jumps, not a slow swing)
    pose: { eyes: "wide", mouth: "o", brows: scared > 0.5 ? "worried" : "up", look: [scared * [0, 0.15, -0.12, 0.1, -0.15, 0.05, -0.08][Math.floor(u / 0.17) % 7], 0.45], headY: 10 * scared },
  });
  // a bead of cold sweat
  if (scared > 0) {
    c.save();
    c.globalAlpha = scared;
    c.fillStyle = "#bfe3ff";
    c.strokeStyle = C.ink;
    c.lineWidth = 4;
    c.beginPath();
    const sx = 690,
      sy = 770 + 22 * scared + 34 * exit(phase(u, 0.6, 1.2));
    c.moveTo(sx, sy - 26);
    c.quadraticCurveTo(sx + 18, sy, sx, sy + 12);
    c.quadraticCurveTo(sx - 18, sy, sx, sy - 26);
    c.fill();
    c.stroke();
    c.restore();
  }
}
