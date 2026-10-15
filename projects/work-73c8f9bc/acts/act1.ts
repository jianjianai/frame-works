// 第一幕 · 她的视角（0–32 拍）。开头是用户定的：她刚发出「下雪了」，评论区马上出现没头像的陌生号的评论「这么晚还不睡？🌹」、
// 通知也弹下来，镜头移到评论区那条评论 → 她打开消息列表，一路划下去全是这个灰头像（三年）→ 她的表情特写（5 秒内放完）→ 点进他的主页：只关注了她 → 拉黑
// → 关灯 → 又一个灰头像：「那个男生配不上你🌹」→ 锁屏，黑屏里她惊恐的脸。
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase } from "@frame/engine/math";
import { C, Ctx, H, W, backOut, blob, camera, castShadow, designScene, easeInOut, easeOut, fillBg, filtered, glow, litFigure, paint, shake, smear, smearV } from "@materials/s0rrow/code/draw";
import { SH, SW } from "@materials/s0rrow/code/phone";
import { drawKid } from "@materials/s0rrow/code/kid";
import { SHOT, WORD, at } from "./timeline";
import { ACC_A, ACC_B, BLOCK_AT, HISTORY_END, INBOX_AT, MENU_AT, POST_BTN, ROW_B, couplePhoto, guideBox, say, snowPhoto, type Guide, vidBanner, vidBlock, vidComments, vidCompose, vidFollowing, vidPost, vidProfile, slide } from "./ui";
import { LAMP_AT, SIT, SIT_CAM, SIT_HANDS, bedFromAbove, herFace, herFaceBg, herInBed, herPhoneBack, herRoomSnow, lapDuvet, roomBokeh } from "./world";
import { aim, aimLerp, drawPhone, halo, tap, whip, type PhoneSpec, type Touch } from "./shots";
import { journey } from "./journey";

const TIME = "02:47";
/** the phone in the opening shots: under the hook, with the post's comment area above the lyrics */
const OPEN: PhoneSpec = { cx: 540, cy: 960, s: 0.95, rot: -0.02 };

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
  else if (abs < s8) shot7(c, abs, s7, s8);
  else if (abs < s9) shot8(c, abs, s8);
  else shot9(c, abs);
}

/** her new post: the stranger's comment pops into the comment area on beat 1.5, the banner drops on beat 2 */
/** the stranger keeps coming (kept to three so it reads as harassment, not a flood): one the moment she posts, a second
 *  as the camera reaches it, a third while she is looking through her message list */
const NEW = [
  { text: "这么晚还不睡？", at: () => at(1.5) },
  { text: "窗户关好", at: () => at(3) },
  // one more while she is in her message list, just as the camera settles on 瘦了 — he knows she is looking
  { text: "还在看手机？", at: () => at(6.5) },
];
/** the banner for the newest comment that has arrived by `abs` (it drops in, then slides away after a while) */
function newBanner(p: Ctx, abs: number) {
  let n = 0;
  NEW.forEach((c, i) => {
    if (abs >= c.at()) n = i + 1;
  });
  if (n === 0) return;
  const t = NEW[n - 1].at();
  const hold = (NEW[n - 1] as { hold?: number }).hold;
  const shown = phase(abs, t, t + 0.2) * (hold ? 1 - phase(abs, t + hold, t + hold + 0.2) : 1);
  vidBanner(p, shown, { name: ACC_A, body: NEW[n - 1].text, rose: true, details: true });
  if (shown <= 0) return;
  const bump = 1 + 0.25 * (1 - phase(abs, t, t + 0.15));
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
function postWithComment(p: Ctx, abs: number, mark: Guide = 0) {
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
/** the same comment, leaning in with a small quizzical tilt — she has read 「这么晚还不睡？」 (shot 2 starts from here) */
const PUZZLED = (): PhoneSpec => ({ ...aim(300, 880, 556, 800, 1.58), rot: 0.055 });
/** The guide boxes keep time with the camera and her feelings. A heartbeat's flare on the box (0..1, gone in 0.3 s). */
const thump = (abs: number, t: number) => (abs < t || abs > t + 0.3 ? 0 : 1 - (abs - t) / 0.3);
/** audio.json: heartThin (stops on 瘦了), heartWatched (还在看手机) */
const HEART_THIN = 2.713,
  HEART_WATCHED = 3.42;
/** the first comment's box: it pops as the camera springs onto it (excited), then stays, dimmer, while she reads it
 *  (puzzled) */
function commentGuide(abs: number): Guide {
  const land = NEW[0].at() + 0.22;
  return { ring: phase(abs, land, land + 0.42), a: phase(abs, land, land + 0.08) * (1 - 0.45 * easeInOut(phase(abs, 1.25, 1.7))), gap: 10 };
}
/** the room's light follows the camera a little (parallax) */
const roomShift = (P: PhoneSpec): [number, number] => [(P.cx - OPEN.cx) * 0.2, (P.cy - OPEN.cy) * 0.2];

/** 1 · she posts 「下雪了」 (her thumb on 「发布」 in the first frame); the post goes up and a comment is already in
 *  the comment area. Excited first: the phone hops up to her, the camera springs onto the comment and the room's
 *  lights brighten. Then puzzled: it is 「这么晚还不睡？」 from a grey avatar — the light drains back, the camera slows,
 *  leans in and tilts like a head cocked at it, while 「窗户关好」 drops in under it. */
function shot1(c: Ctx, abs: number) {
  const press = at(0.4);
  const arrive = NEW[0].at();
  const hop = Math.sin(Math.PI * phase(abs, arrive, arrive + 0.3));
  const go = backOut(phase(abs, arrive + 0.1, arrive + 0.5));
  const tilt = easeInOut(phase(abs, 1.25, at(SHOT.s2)));
  const bright = phase(abs, arrive, arrive + 0.12) * (1 - easeInOut(phase(abs, 1.15, 1.6)));
  const A = aimLerp(aimLerp(OPEN, ON_COMMENT(), go), PUZZLED(), tilt);
  const P = { ...A, s: A.s * (1 + 0.05 * hop) };
  roomBokeh(c, abs, { shift: roomShift(P), bright });
  halo(c, P, 1 + 0.35 * bright);
  drawPhone(c, abs, P, (p) => {
    const compose = (k: Ctx) => vidCompose(k, { time: TIME, photo: snowPhoto, caption: "下雪了", caret: abs < press, press: phase(abs, press - 0.05, press) });
    const posted = (k: Ctx) => postWithComment(k, abs, commentGuide(abs));
    // the compose page gives way to the post (pushed up, the way an app returns to the new post)
    const k = phase(abs, press + 0.06, press + 0.3);
    if (k <= 0) compose(p);
    else if (k >= 1) posted(p);
    else {
      posted(p);
      p.save();
      p.globalAlpha = 1 - k;
      p.translate(0, -160 * k);
      compose(p);
      p.restore();
    }
  }, { buzz: newBuzz(abs), touches: [tap(abs, press, POST_BTN[0], POST_BTN[1]), inboxTouch(abs)] });
}
/** her thumb on 「互动消息」: it goes down just before the cut to the list and lifts as the list starts to slide in */
function inboxTouch(abs: number): Touch {
  const t = at(SHOT.s2);
  const k = clamp((abs - (t - 0.1)) / 0.05) * (1 - clamp((abs - (t + 0.02)) / 0.08));
  return { x: INBOX_AT[0], y: INBOX_AT[1], k };
}

/** 2 · she opens her message list: the camera pulls back off the comment (the tilt rights itself) as the list slides
 *  in, and she flicks it — a fast fling through three years of the same grey avatar (motion-blurred) that lands, with
 *  a little overshoot, on 「瘦了🌹」 (2023-06-18). Tense: he knows how her body has changed — the camera creeps in on
 *  that row while the room goes dark. Watched: a new one drops in, 「还在看手机？🌹」 — the camera snaps onto it, her
 *  hand starts to shake, the dark closes in; then it whips up to her face. */
const FLING_LAND = 0.78; // seconds into the shot
/** 瘦了's row (low enough that the new banner clears the hook text); `s` grows as the camera creeps in */
const ON_ROW_B = (s = 1.22) => aim(300, 556, 540, 990, s);
/** the new banner big, under the hook text */
const ON_WATCH = () => aim(300, 128, 540, 650, 1.75);
function shot2(c: Ctx, abs: number, t0: number, end: number) {
  const [dy, sm] = whip(abs, end, 900);
  const u = abs - t0;
  const watch = NEW[2].at() - t0;
  const back = easeInOut(phase(u, 0, 0.3));
  const land = easeOut(phase(u, FLING_LAND - 0.05, FLING_LAND + 0.3));
  const creep = phase(u, FLING_LAND + 0.15, watch + 0.05);
  const snap = 1 - Math.pow(1 - phase(u, watch + 0.04, watch + 0.2), 3);
  const held = aimLerp(aimLerp(aimLerp(PUZZLED(), OPEN, back), ON_ROW_B(1.22 + 0.18 * creep), land), ON_WATCH(), snap);
  const [jx, jy] = u > watch ? shake(abs, 7 * phase(u, watch, watch + 0.12), 23) : [0, 0];
  const P = { ...held, cx: held.cx + jx, cy: held.cy + jy, rot: (held.rot ?? 0) + jx * 0.002 };
  const dark = 0.15 + 0.35 * easeInOut(phase(u, FLING_LAND, watch)) + 0.25 * easeOut(phase(u, watch, watch + 0.3));
  smearV(
    c,
    (k) => {
      k.save();
      k.translate(0, dy);
      roomBokeh(k, abs, { dark, shift: roomShift(held) });
      halo(k, P, 1 - 0.35 * phase(u, FLING_LAND, watch + 0.3));
      // the fling: very fast, braking hard onto 瘦了 (2% past it, then back)
      const span = FLING_LAND - 0.2;
      const f = clamp((u - 0.2) / span);
      const sc = u < FLING_LAND ? HISTORY_END * 1.02 * (1 - Math.pow(1 - f, 3.2)) : HISTORY_END * (1.02 - 0.02 * easeOut((u - FLING_LAND) / 0.25));
      const speed = u > 0.2 && u < FLING_LAND ? (HISTORY_END * 1.02 * 3.2 * Math.pow(1 - f, 2.2)) / span : 0;
      const blur = Math.min(180, speed / 48);
      drawPhone(k, abs, P, (p) => {
        // 瘦了's box closes in with the creeping camera (tense), flares on the heartbeat, and lets go when the new one comes
        const thin: Guide = { a: phase(u, FLING_LAND, FLING_LAND + 0.08) * (1 - phase(u, watch, watch + 0.1)), gap: 8 + 40 * (1 - easeOut(phase(u, FLING_LAND, watch + 0.05))), thump: thump(abs, HEART_THIN) };
        const inbox = (q: Ctx) => vidComments(q, { scroll: sc, time: TIME, marks: [[ROW_B, thin]] });
        slide(p, (u - 0.04) / 0.2, (q) => postWithComment(q, abs, commentGuide(abs)), (q) => smear(q, inbox, 0, blur, "fling"));
        if (abs >= NEW[2].at()) {
          newBanner(p, abs);
          // watched: the box clamps onto the banner as the camera lands on it, and flares on the second heartbeat
          guideBox(p, 18, 84, 564, 172, { a: phase(u, watch + 0.18, watch + 0.22), gap: 6, thump: thump(abs, HEART_WATCHED) });
        }
      }, { buzz: newBuzz(abs), touches: [inboxTouch(abs), { x: 300, y: 1050 - 600 * clamp((u - 0.14) / 0.12), k: u > 0.1 && u < 0.27 ? 1 : 0 }] });
      k.restore();
    },
    sm,
    "w2",
  );
}

/** 3 · her face over the duvet in the phone's light: eyes wide, she pulls the duvet up to her nose; a small push;
 *  the camera whips back down to the phone. */
function shot3(c: Ctx, abs: number, t0: number, end: number) {
  const [dyIn, smIn] = whip(abs, t0, 900);
  const [dyOut, smOut] = whip(abs, end, -900);
  const dy = abs < t0 + 0.22 ? dyIn : abs > end - 0.15 ? dyOut : 0;
  const sm = abs < t0 + 0.22 ? smIn : abs > end - 0.15 ? smOut : 0;
  smearV(
    c,
    (k) => {
      k.save();
      k.translate(0, dy);
      // the room, out of focus behind her (still while she is pushed in)
      herFaceBg(k, abs, 1);
      // 被监视: 「还在看手机？」— someone can see her. On the push her eyes snap to the window (the one he told her to
      // shut; it's the window the camera leaves through in shot 9), her head turning after them and the camera leaning
      // that way; then back to the phone before the whip
      const glance = easeOut(phase(abs, t0 + 0.3, t0 + 0.42)) * (1 - easeInOut(phase(abs, t0 + 0.68, t0 + 0.82)));
      const push = 1 + 0.08 * backOut(phase(abs, t0 + 0.3, t0 + 0.5));
      camera(k, 540, 760, push, 0, -22 * glance, 0);
      // she clutches the duvet and pulls it up to her nose, eyes darting
      const up = easeOut(phase(abs, t0 + 0.1, t0 + 0.55));
      // her hands come up and grab the edge first, then haul it up
      const grab = easeOut(phase(abs, t0 + 0.02, t0 + 0.16));
      const dart = 0.25 * Math.sin((abs - t0) * 9);
      herFace(k, abs, { lamp: 1, bg: false, top: 1030 - 140 * up, grip: grab, pose: { eyes: "wide", mouth: "o", brows: "up", look: [dart * (1 - glance) + 0.85 * glance, 0.55 - 0.8 * glance], turn: 0.22 * glance, blush: 0 } });
      k.restore();
    },
    sm,
    "w3",
  );
}

/** 4 · back on the phone: she taps the grey avatar — 0 works, 0 fans, follows 1. The camera pushes onto 「1 关注」; she
 *  taps it and the camera rides the page onto the only account it follows: her. It creeps in while the room darkens —
 *  then on the beat it recoils (a jolt out past the phone, shaking, a heartbeat in audio.json) and settles where shot 5
 *  takes over, for the block. */
const HELD: PhoneSpec = { cx: 540, cy: 930, s: 1 };
/** 「1 关注」 big, the 0 获赞 / 0 粉丝 either side of it */
const ON_FOLLOWS = () => aim(294, 452, 540, 780, 2.4);
/** her row in his following list, 「TA 的关注（1）」 above it and 「已显示全部关注」 under it */
const ON_HER = (s: number) => aim(300, 262, 540, 760, s);
function shot4(c: Ctx, abs: number, t0: number) {
  const [dy, sm] = whip(abs, t0, -900);
  const u = abs - t0;
  const end = at(SHOT.s5) - t0;
  const recoil = at(14) - t0;
  let P = aimLerp(HELD, ON_FOLLOWS(), easeInOut(phase(u, 0.48, 0.84)));
  P = aimLerp(P, ON_HER(1.75 + 0.17 * easeInOut(phase(u, 1.55, recoil))), easeInOut(phase(u, 1.2, 1.55)));
  if (u > recoil) {
    // the recoil: a hard pull out a little past the held framing, then it eases back onto it for the cut
    const jolt = 1 - Math.pow(1 - phase(u, recoil, recoil + 0.2), 4);
    P = aimLerp(aimLerp(ON_HER(1.92), { cx: 540, cy: 955, s: 0.92 }, jolt), HELD, easeInOut(phase(u, recoil + 0.2, end)));
  }
  const [sx, sy] = u > recoil ? shake(abs, 11 * (1 - phase(u, recoil, recoil + 0.42)), 41) : [0, 0];
  // the room sinks into the dark while she stares at her own name, and comes back as the camera pulls out
  const dark = 0.2 + 0.32 * easeInOut(phase(u, 1.3, recoil)) * (1 - easeInOut(phase(u, recoil + 0.05, end)));
  smearV(
    c,
    (k) => {
      k.save();
      k.translate(sx, (abs < t0 + 0.22 ? dy : 0) + sy);
      roomBokeh(k, abs, { dark, shift: [(P.cx - HELD.cx) * 0.12, (P.cy - HELD.cy) * 0.12] });
      halo(k, P);
      drawPhone(k, abs, P, (p) => {
        const inbox = (q: Ctx) => vidComments(q, { scroll: HISTORY_END, time: TIME });
        // 「1 关注」 pops as the camera lands on it; her row's box closes in with the creep and snaps off on the recoil
        const profile = (q: Ctx) => vidProfile(q, { name: ACC_A, time: TIME, pulse: { ring: phase(u, 0.8, 1.2), a: phase(u, 0.8, 0.86), gap: 10 } });
        const following = (q: Ctx) => vidFollowing(q, { time: TIME, pulse: { a: phase(u, 1.52, 1.6) * (1 - phase(u, recoil, recoil + 0.06)), gap: 8 + 36 * (1 - easeOut(phase(u, 1.52, recoil))) } });
        if (u < 0.25) inbox(p);
        else if (u < 1.18) slide(p, (u - 0.25) / 0.2, inbox, profile);
        else slide(p, (u - 1.18) / 0.2, profile, following);
      }, {
        buzz: newBuzz(abs), touches: [tap(abs, t0 + 0.23, 64, 246), tap(abs, t0 + 1.16, 294, 452)] });
      k.restore();
    },
    abs < t0 + 0.22 ? sm : 0,
    "w4",
  );
}

/** 5's camera, as where the phone sits on screen (whole-film camera pass, user: 「把全片都优化一下」). 害怕 → 决绝 →
 *  松一口气: it starts where shot 4's recoil settled; when the sheet comes up it goes straight and firm onto 「拉黑」
 *  (no creeping: she has made up her mind), the tap lands with a dead stop; it moves up onto 「确定拉黑对方吗？」 and holds
 *  it, leaning in a hair; the confirm lands with another stop — and then it breathes out onto 「已拉黑」 (shot 6 opens on
 *  her sigh). */
function blockPlacement(u: number): PhoneSpec {
  const toSheet = easeInOut(phase(u, 0.62, 0.9));
  const toDialog = easeInOut(phase(u, 1.04, 1.24));
  const lean = phase(u, 1.24, 1.42);
  const breathe = easeOut(phase(u, 1.48, 2.17));
  const stop = (t: number) => (u < t ? 0 : Math.exp(-(u - t) / 0.07));
  // (his name stays under the title capsule's band)
  let P = aimLerp(HELD, aim(300, 746, 540, 900, 1.2), toSheet);
  P = aimLerp(P, aim(300, 640, 540, 820, 1.3), toDialog);
  P = { ...P, s: P.s * (1 + 0.03 * lean) };
  P = aimLerp(P, aim(300, 560, 540, 880, 1.1), breathe);
  return { ...P, s: P.s * (1 + 0.012 * (stop(0.98) + stop(1.42))) };
}
/** 5 · block: back to his page; 「···」, 「拉黑」, confirm, 「已拉黑」. */
function shot5(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  const P = blockPlacement(u);
  // the room closes in while she does it, and lets go once it's done
  const doing = easeInOut(phase(u, 0.6, 1.42));
  const relief = easeOut(phase(u, 1.46, 2.1));
  roomBokeh(c, abs, { dark: 0.2 + 0.2 * doing - 0.3 * relief, bright: 0.25 * relief, shift: [(P.cx - HELD.cx) * 0.12, (P.cy - HELD.cy) * 0.12] });
  halo(c, P, 1 - 0.2 * doing + 0.3 * relief);
  drawPhone(c, abs, P, (p) => {
    const following = (q: Ctx) => vidFollowing(q, { time: TIME });
    const profile = (q: Ctx) => vidProfile(q, { name: ACC_A, time: TIME, menu: phase(u, 0.56, 0.64) * (1 - phase(u, 0.72, 0.8)), blocked: phase(u, 1.5, 1.7) });
    // back: the profile slides back in from the left
    if (u < 0.2) {
      const e = 1 - Math.pow(1 - clamp(u / 0.2), 3);
      p.save();
      p.translate(-180 * (1 - e), 0);
      profile(p);
      p.restore();
      p.save();
      p.translate(600 * e, 0);
      following(p);
      p.restore();
    } else profile(p);
    vidBlock(p, { sheet: phase(u, 0.62, 0.8) * (1 - phase(u, 1.02, 1.1)), hot: phase(u, 0.94, 1.0), confirm: phase(u, 1.08, 1.2), done: phase(u, 1.46, 2.15) });
  }, {
    touches: [tap(abs, t0 + 0.02, 40, 120), tap(abs, t0 + 0.6, MENU_AT[0], MENU_AT[1]), tap(abs, t0 + 0.98, BLOCK_AT[0], BLOCK_AT[1]), tap(abs, t0 + 1.42, 420, 720)],
  });
}

/** 6 · she lets out a breath, puts the phone face down, the lamp goes off.
 *  松一口气 → 以为结束了: the camera breathes out with her sigh (settling back a touch, carrying on shot 5's breath);
 *  when the lamp goes off it starts to creep, slow and straight, toward the phone she laid face down on the pillow,
 *  the dark closing in round it — it isn't over (shot 7 is that phone from above, buzzing). */
function shot6(c: Ctx, abs: number, t0: number) {
  const off = at(21); // lamp off on the beat (the switch's click is in audio.json)
  const lamp = abs < off ? 1 : 0;
  const u = abs - t0;
  const k = off - t0; // when the lamp goes off, in shot time
  const exhale = easeOut(phase(u, 0, 0.5));
  const creep = phase(u, k + 0.1, at(SHOT.s7) - t0);
  c.save();
  // zoomed about the phone on the pillow (design 246, 826 — on screen at 172.5, 1017.5 in the room shot's framing),
  // drawing it in toward the middle as the camera creeps
  camera(c, 246, 826, SIT_CAM.z * (1 + 0.025 * (1 - exhale)) * (1 + 0.12 * creep), 0, -73.5 + 70 * creep, 191.5 - 40 * creep);
  herRoomSnow(c, abs, { lamp });
  // the bulb's filament dies a moment after the click
  if (!lamp) glow(c, LAMP_AT[0], LAMP_AT[1] + 20, 70, "rgba(255,170,90,0.65)", Math.exp(-(abs - off) / 0.1));
  // her hands (head units). The left one takes the phone over in an arc and lays it face down on the pillow; the right
  // lets go and goes out to the lamp, presses the switch on the beat; then both come back under the duvet.
  const mix = (a: Pt2, b: Pt2, e: number, lift = 0): Pt2 => [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e - lift * Math.sin(Math.PI * e)];
  const SWITCH: Pt2 = [(LAMP_AT[0] - 20 - HX) / HS, (LAMP_AT[1] + 60 - HY) / HS];
  const carry = easeInOut(phase(u, 0.24, 0.5)),
    homeL = easeInOut(phase(u, 0.56, 0.86)),
    reach = easeInOut(phase(u, 0.3, k - 0.04)),
    homeR = easeInOut(phase(u, k + 0.14, k + 0.5));
  const press = Math.sin(Math.PI * phase(u, k - 0.05, k + 0.07));
  const handL = homeL > 0 ? mix(ON_PILLOW, UNDER_L, homeL, 30) : mix(HOLD_L, ON_PILLOW, carry, 30);
  const handR = homeR > 0 ? mix(SWITCH, UNDER_R, homeR, 20) : mix(HOLD_R, SWITCH, reach, 60);
  if (homeR <= 0) handR[1] += 14 * press;
  const holding = carry < 1;
  // the phone in her left hand: upright with its back to us, rolling flat (face down) as it comes down on the pillow
  const phoneAt = (q: Ctx, p: Pt2, e: number) => {
    q.save();
    q.translate(p[0] + 26 * (1 - e), p[1] - 14 * (1 - e));
    q.scale(1, 1 - 0.55 * e);
    herPhoneBack(q, 0, 0, 92, 176, -0.08 + 1.7 * e);
    q.restore();
  };
  if (!holding) {
    c.save();
    c.translate(HX, HY);
    c.scale(HS, HS);
    phoneAt(c, ON_PILLOW, 1);
    c.restore();
  }
  const her = (q: Ctx) =>
    herInBed(q, HX, HY, HS, {
      eyes: u < 0.3 ? "sad" : u < 0.9 ? "shut" : "tired",
      mouth: u < 0.9 ? "o" : "flat",
      look: [0.5, -0.2],
      headY: u > 0.2 && u < 0.9 ? 8 : 0,
      tilt: 0.07 * reach * (1 - homeR),
      arms: "custom",
      handL,
      handR,
      shapeL: holding ? "hold" : homeL > 0.5 ? "relax" : "flat",
      shapeR: reach <= 0 ? "hold" : homeR > 0.5 ? "relax" : "open",
      grip: (q) => holding && phoneAt(q, carry > 0 ? handL : [-40, 330], carry),
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
  c.restore();
  if (creep > 0) {
    const v = c.createRadialGradient(240 + 70 * creep, 980, 260, 400, 900, 1250);
    v.addColorStop(0, "rgba(4,4,14,0)");
    v.addColorStop(1, `rgba(4,4,14,${(0.45 * creep).toFixed(3)})`);
    c.fillStyle = v;
    c.fillRect(-60, -60, W + 120, H + 120);
  }
}
/** where she sits in shot 6 (head centre, scale; shared with act3 shot 19, world.ts SIT) */
const HX = SIT.x,
  HY = SIT.y,
  HS = SIT.s;
type Pt2 = [number, number];
/** her hands in shot 6 (head units): on the phone; where the phone goes down on the pillow at her left; at rest under
 *  the duvet */
const HOLD_L: Pt2 = SIT_HANDS.holdL,
  HOLD_R: Pt2 = SIT_HANDS.holdR,
  ON_PILLOW: Pt2 = SIT_HANDS.pillow,
  UNDER_L: Pt2 = SIT_HANDS.underL,
  UNDER_R: Pt2 = SIT_HANDS.underR;

/** 7 · the dark, from straight above: her phone face down on the pillow; light leaks out round its edges onto the
 *  pillowcase and it buzzes; it turns over (the screen's light floods the pillow). */
function shot7(c: Ctx, abs: number, t0: number, end: number) {
  const u = abs - t0;
  // dread: she thought it was over. Two buzzes (bzz… bzz) in the dark, the camera starting at each like she does, then
  // creeping in on the phone
  const kick = BUZZES.reduce((m, [a]) => Math.max(m, u < a ? 0 : Math.exp(-(u - a) / 0.09)), 0);
  const z = (1 + 0.25 * easeInOut(phase(u, 0, end - t0))) * (1 + 0.03 * kick);
  // once the banner is in, the camera lifts off the pillow onto the phone and runs straight on into shot 8's push
  const lift = abs >= end - LIFT_IN ? liftPush(abs, t0, end) : null;
  const cam = () => (lift ? camera(c, 540, 900, lift.s / 0.55, 0, lift.cx - 540, lift.cy - 900) : camera(c, 540, 900, z));
  // the pillow sinks into her dark room's bokeh as the phone comes up to the lens
  const mix = easeInOut(phase(abs, end - 0.3, end));
  c.save();
  cam();
  // the bed at the phone's scale: the pillow fills the frame
  c.save();
  c.translate(540, 900);
  c.scale(1.9, 1.9);
  c.translate(-540, -900);
  bedFromAbove(c, abs);
  c.restore();
  const flip = phase(u, 0.75, 1.05);
  const sx = Math.cos(flip * Math.PI);
  const buzz = BUZZES.reduce((m, [a, b]) => Math.max(m, u >= a && u < b ? 1 - 0.4 * (u - a) / (b - a) : 0), 0);
  const jx = buzz > 0 ? Math.sin(abs * 90) * 6 * buzz : 0;
  const rot = -0.25 + 0.25 * flip;
  // Both sides use the same outer shell dimensions, including the screen's frame.
  const phoneScale = 0.55, pw = (SW + 52) * phoneScale, ph = (SH + 52) * phoneScale;
  // light spilling onto the pillowcase (a rim round the case while face down, a flood once it's up)
  c.save();
  c.globalCompositeOperation = "lighter";
  glow(c, 540 + jx, 900, 430 + 380 * flip, "rgba(110,140,230,0.55)", 0.7 + 0.3 * flip);
  c.restore();
  c.restore();
  if (mix > 0) {
    c.save();
    c.globalAlpha = mix;
    roomBokeh(c, abs, { dark: 0.6 });
    c.restore();
  }
  cam();
  c.save();
  c.translate(540 + jx, 900);
  c.rotate(rot);
  const w = Math.abs(sx) < 0.02 ? 0.02 : sx;
  const edge = Math.sin(flip * Math.PI);
  // A soft cast shadow plus a tight contact edge follows the width of the turning phone.
  c.save();
  c.scale(Math.max(0.1, Math.abs(w)), 1);
  c.globalAlpha = 1 - mix;
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
    });
  }
  c.restore();
}
/** How long before shot 8 the camera starts lifting off the pillow, and when the push lands on the banner. */
const LIFT_IN = 0.36;
/** when the push slams into the banner, after shot 8 starts (audio.json heartNew is on it) */
const LIFT_OUT = 0.41;
/** shot 7's two buzzes (shot time) */
const BUZZES: [number, number][] = [[0, 0.24], [0.34, 0.58]];
/** One push from the phone lying on the pillow (shot 7, s7–s8) onto the banner's message (shot 8): where the phone is on
 *  screen. Reluctant, then a rush that slams into the words (a small bump past them and back). */
function liftPush(abs: number, s7: number, s8: number): PhoneSpec {
  const from = s8 - LIFT_IN;
  const z = 1 + 0.25 * easeInOut(phase(from - s7, 0, s8 - s7));
  const A: PhoneSpec = { cx: 540, cy: 900, s: 0.55 * z };
  const B = aim(330, 176, 540, 760, 1.9); // the banner's message
  const P = aimLerp(A, B, Math.pow(phase(abs, from, s8 + LIFT_OUT), 2.4));
  const bump = Math.sin(Math.PI * phase(abs, s8 + LIFT_OUT, s8 + LIFT_OUT + 0.24));
  return bump > 0 ? aim(330, 176, 540, 760, 1.9 * (1 + 0.05 * bump)) : P;
}
/** audio.json heartFast: four quick beats from here, 0.4 s apart (they run on over her face) */
const HEART_FAST = 13.1;
function rrPath(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

/** 8 · the new message: another grey avatar, a new name, on her photo with her boyfriend — blocking didn't work. The
 *  camera hesitates, then rushes and slams into 「那个男生配不上你🌹」 (a jolt, a heavy heartbeat, the box clamps on).
 *  Then it sinks in: the room swells round the phone while the phone eases back a touch (a dolly zoom — the floor
 *  going), the dark closes in, her hand trembles, the box flares on each quickening heartbeat. */
function shot8(c: Ctx, abs: number, t0: number) {
  const impact = t0 + LIFT_OUT;
  const sink = easeInOut(phase(abs, impact + 0.15, at(SHOT.s9)));
  c.save();
  camera(c, 540, 900, 1 + 0.35 * sink);
  roomBokeh(c, abs, { dark: 0.6 + 0.25 * sink });
  c.restore();
  const L = liftPush(abs, at(SHOT.s7), t0);
  const [jx, jy] = abs > impact ? shake(abs, 10 * (1 - phase(abs, impact, impact + 0.35)) + 3 * phase(abs, impact, impact + 0.5), 61) : [0, 0];
  const P = abs > impact ? aim(330, 176, 540 + jx, 760 + jy, L.s * (1 - 0.06 * sink)) : L;
  halo(c, P, 1 - 0.3 * sink);
  const beat = Math.max(thump(abs, impact), ...[0, 0.4, 0.8].map((d) => thump(abs, HEART_FAST + d)));
  drawPhone(c, abs, P, (p) => {
    vidPost(p, { time: "02:49", photo: couplePhoto(false), caption: "周末～", ago: "3小时前", details: true });
    vidBanner(p, 1, { name: ACC_B, body: "那个男生配不上你", rose: true, details: true });
    guideBox(p, 18, 84, 564, 172, { ring: phase(abs, impact, impact + 0.35), a: phase(abs, impact, impact + 0.04), gap: 6, thump: beat });
  });
  // the dark closing in from the edges, over the phone too, leaving only the words
  if (sink > 0) {
    const g = c.createRadialGradient(540, 820, 240, 540, 900, 1250);
    g.addColorStop(0, "rgba(4,4,12,0)");
    g.addColorStop(1, `rgba(4,4,12,${(0.72 * sink).toFixed(3)})`);
    c.fillStyle = g;
    c.fillRect(-60, -60, W + 120, H + 120);
  }
}

/** 9 · (her close-up is gone — user: shot 8's camera already says it; the time goes to the transition) straight on
 *  into the journey: the camera pulls back off her phone, through her window — her in the dark room, frozen in bed,
 *  only the phone lighting her — out to the snowy facade, and up into the sky (journey.ts; act2 carries on). */
function shot9(c: Ctx, abs: number) {
  journey(c, abs, (k) => throughWindow(k, abs));
}
/** what we see through her window as we pull back out of it: the message on her phone, giving way to her room */
function throughWindow(k: Ctx, abs: number) {
  const t0 = at(SHOT.s9);
  const phone = 1 - easeInOut(phase(abs, t0 + 0.06, t0 + 0.3));
  if (phone < 1) darkRoom(k, abs);
  if (phone > 0) filtered(k, "none", (q) => shot8(q, abs, at(SHOT.s8)), "s9phone", phone);
}
/** her room after the message: the lamp off, her sitting up in bed, frozen, the phone in her hands lighting her face */
function darkRoom(c: Ctx, abs: number) {
  c.save();
  camera(c, 540, 700, 1.29, 0, 0, 160);
  herRoomSnow(c, abs, { lamp: 0 });
  const PH: Pt2 = [432, 886];
  const her = (q: Ctx) => herInBed(q, HX, HY, HS, { eyes: "wide", mouth: "o", brows: "worried", look: [0, 0.5], headY: 6 });
  litFigure(c, her, {
    shade: 0.55,
    shadeCol: "rgb(12,14,40)",
    lights: [
      { x: PH[0], y: PH[1] - 40, r: 420, rgb: "165,195,255", a: 0.5 },
      { x: 880, y: 420, r: 760, rgb: "120,150,240", a: 0.18 },
    ],
    rim: { ux: 0.7, uy: -0.7, rgb: "170,195,255", a: 0.42 },
  });
  lapDuvet(c, 1);
  glow(c, PH[0], PH[1], 260, "rgba(150,180,255,0.35)");
  c.restore();
}
