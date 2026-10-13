// 第一幕 · 她的视角（0–32 拍）。开头是用户定的：她刚发出「下雪了」，评论区马上出现没头像的陌生号的评论「这么晚还不睡？🌹」、
// 通知也弹下来，镜头移到评论区那条评论 → 她打开消息列表，一路划下去全是这个灰头像（三年）→ 她的表情特写（5 秒内放完）→ 点进他的主页：只关注了她 → 拉黑
// → 关灯 → 又一个灰头像：「那个男生配不上你🌹」→ 锁屏，黑屏里她惊恐的脸。
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase } from "@frame/engine/math";
import { C, Ctx, H, W, backOut, blob, camera, designScene, easeInOut, easeOut, fillBg, filtered, glow, paint, smear, smearV } from "@materials/s0rrow/code/draw";
import { phoneBack } from "@materials/s0rrow/code/phone";
import { herBlanket } from "@materials/s0rrow/code/places";
import { drawKid } from "@materials/s0rrow/code/kid";
import { SHOT, WORD, at } from "./timeline";
import { ACC_A, ACC_B, HISTORY_END, MENU_AT, POST_BTN, ROW_B, couplePhoto, pulseBox, say, snowPhoto, vidBanner, vidBlock, vidComments, vidCompose, vidFollowing, vidPost, vidProfile, slide } from "./ui";
import { herInBed, herRoomShade, herRoomSnow, roomBokeh } from "./world";
import { aim, aimLerp, drawPhone, tap, whip, type PhoneSpec } from "./shots";
import { pullOut } from "./journey";

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
  const hold = (NEW[n - 1] as { hold?: number }).hold;
  const shown = phase(abs, t, t + 0.2) * (hold ? 1 - phase(abs, t + hold, t + hold + 0.2) : 1);
  vidBanner(p, shown, { name: ACC_A, body: NEW[n - 1].text, rose: true });
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
function postWithComment(p: Ctx, abs: number, mark = 0) {
  vidPost(p, {
    time: TIME,
    photo: snowPhoto,
    caption: "下雪了",
    ago: "刚刚",
    likes: 0,
    showComments: true,
    mark,
    comments: NEW.slice(0, 2).map((c) => ({ name: ACC_A, text: c.text, rose: true, ago: "刚刚", pop: phase(abs, c.at(), c.at() + 0.15) })),
  });
  newBanner(p, abs);
}
/** the first comment framed big (the second one drops in just under it as the camera arrives) */
const ON_COMMENT = () => aim(300, 880, 540, 800, 1.5);

/** 1 · she posts 「下雪了」 (her thumb on 「发布」 in the first frame); the post goes up and the comment is already in
 *  the comment area — then the banner drops and the phone buzzes; the camera moves onto that comment. */
function shot1(c: Ctx, abs: number) {
  const press = at(0.4);
  const e = easeInOut(phase(abs, at(1.9), at(3.0)));
  const P = aimLerp(OPEN, ON_COMMENT(), e);
  roomBokeh(c, abs, { shift: [0, -120 * e] });
  glow(c, P.cx, P.cy - 120 * P.s, 820 * P.s, "rgba(120,150,255,0.26)");
  drawPhone(c, abs, P, (p) => {
    const compose = (k: Ctx) => vidCompose(k, { time: TIME, photo: snowPhoto, caption: "下雪了", caret: abs < press, press: phase(abs, press - 0.05, press) });
    const posted = (k: Ctx) => postWithComment(k, abs, phase(abs, at(3.3), at(3.3) + 0.6));
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
  }, { buzz: newBuzz(abs), touches: [tap(abs, press, POST_BTN[0], POST_BTN[1])] });
}

/** 2 · she opens her message list: the camera pulls back off the comment as the list slides in, and she flicks it —
 *  a fast fling through three years of the same grey avatar (motion-blurred) that lands, with a little overshoot, on
 *  「瘦了🌹」 (2023-06-18); the camera pushes onto that row; then whips up to her face. */
const FLING_LAND = 0.78; // seconds into the shot
const ON_ROW_B = () => aim(300, 556, 540, 990, 1.3); // low enough that the new banner clears the hook text
function shot2(c: Ctx, abs: number, t0: number, end: number) {
  const [dy, sm] = whip(abs, end, 900);
  smearV(
    c,
    (k) => {
      k.save();
      k.translate(0, dy);
      const u = abs - t0;
      const back = easeInOut(phase(u, 0, 0.3));
      const push = easeInOut(phase(u, FLING_LAND - 0.05, FLING_LAND + 0.45));
      const P = aimLerp(aimLerp(ON_COMMENT(), OPEN, back), ON_ROW_B(), push);
      roomBokeh(k, abs, { dark: 0.15, shift: [0, -120 * (1 - back) + 60 * push] });
      glow(k, P.cx, P.cy - 120 * P.s, 820 * P.s, "rgba(120,150,255,0.26)");
      // the fling: very fast, braking hard onto 瘦了 (2% past it, then back)
      const span = FLING_LAND - 0.2;
      const f = clamp((u - 0.2) / span);
      const sc = u < FLING_LAND ? HISTORY_END * 1.02 * (1 - Math.pow(1 - f, 3.2)) : HISTORY_END * (1.02 - 0.02 * easeOut((u - FLING_LAND) / 0.25));
      const speed = u > 0.2 && u < FLING_LAND ? (HISTORY_END * 1.02 * 3.2 * Math.pow(1 - f, 2.2)) / span : 0;
      const blur = Math.min(180, speed / 48);
      drawPhone(k, abs, P, (p) => {
        const inbox = (q: Ctx) => vidComments(q, { scroll: sc, time: TIME, marks: [[ROW_B, phase(u, FLING_LAND, FLING_LAND + 0.6)]] });
        slide(p, (u - 0.04) / 0.2, (q) => postWithComment(q, abs, 1), (q) => smear(q, inbox, 0, blur, "fling"));
      }, { buzz: newBuzz(abs), touches: [{ x: 300, y: 1050 - 600 * clamp((u - 0.14) / 0.12), k: u > 0.1 && u < 0.27 ? 1 : 0 }] });
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
      // the room, out of focus behind her
      filtered(k, "blur(5px)", (b) => {
        camera(b, 540, 620, 1.9, 0, 0, 120);
        herRoomSnow(b, abs, { lamp: 1 });
      }, "s3room");
      const push = 1 + 0.08 * backOut(phase(abs, t0 + 0.3, t0 + 0.5));
      camera(k, 540, 760, push);
      const up = easeOut(phase(abs, t0 + 0.1, t0 + 0.55));
      herInBed(k, 540, 780, 1.55, { eyes: "wide", mouth: "o", look: [0.25 * Math.sin((abs - t0) * 9), 0.55], arms: "down", blush: 0 });
      // the duvet, pulled up to her nose
      const top = 1010 - 125 * up;
      blob(k, [[-80, top + 40], [300, top - 10], [560, top + 10], [800, top - 6], [1160, top + 30], [1160, H + 80], [-80, H + 80]], 6101, 2);
      paint(k, "#f2a7bd", C.ink, 7);
      // phone light from below
      glow(k, 540, 1300, 760, "rgba(140,170,255,0.38)");
      k.restore();
    },
    sm,
    "w3",
  );
}

/** 4 · back on the phone: she taps the grey avatar — 0 works, 0 fans, follows 1 — and the one it follows is her. */
function shot4(c: Ctx, abs: number, t0: number) {
  const [dy, sm] = whip(abs, t0, -900);
  const u = abs - t0;
  smearV(
    c,
    (k) => {
      k.save();
      k.translate(0, abs < t0 + 0.22 ? dy : 0);
      roomBokeh(k, abs, { dark: 0.2 });
      glow(k, 540, 860, 900, "rgba(120,150,255,0.26)");
      drawPhone(k, abs, { cx: 540, cy: 930, s: 1 }, (p) => {
        const inbox = (q: Ctx) => vidComments(q, { scroll: HISTORY_END, time: TIME });
        const profile = (q: Ctx) => vidProfile(q, { name: ACC_A, time: TIME, pulse: phase(u, 0.55, 1.2) });
        const following = (q: Ctx) => vidFollowing(q, { time: TIME, pulse: phase(u, 1.45, 2.1) });
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

/** 5 · block: back to his page — and another one comes in, 「还在看手机？🌹」; then 「···」, 「拉黑」, confirm, 「已拉黑」. */
function shot5(c: Ctx, abs: number, t0: number) {
  roomBokeh(c, abs, { dark: 0.2 });
  glow(c, 540, 860, 900, "rgba(120,150,255,0.26)");
  const u = abs - t0;
  const z = 1 + 0.06 * easeInOut(phase(u, 0, 2.1));
  camera(c, 540, 900, z);
  drawPhone(c, abs, { cx: 540, cy: 930, s: 1 }, (p) => {
    const following = (q: Ctx) => vidFollowing(q, { time: TIME });
    const profile = (q: Ctx) => vidProfile(q, { name: ACC_A, time: TIME, menu: phase(u, 0.56, 0.64) * (1 - phase(u, 0.72, 0.8)) });
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
    newBanner(p, abs);
    vidBlock(p, { sheet: phase(u, 0.62, 0.8) * (1 - phase(u, 1.02, 1.1)), hot: phase(u, 0.94, 1.0), confirm: phase(u, 1.08, 1.2), done: phase(u, 1.46, 2.15) });
  }, {
    buzz: newBuzz(abs),
    touches: [tap(abs, t0 + 0.02, 40, 120), tap(abs, t0 + 0.6, MENU_AT[0], MENU_AT[1]), tap(abs, t0 + 0.98, 300, 975), tap(abs, t0 + 1.42, 420, 720)],
  });
}

/** 6 · she lets out a breath, puts the phone face down, the lamp goes off. */
function shot6(c: Ctx, abs: number, t0: number) {
  const off = at(21); // lamp off on the beat
  const lamp = abs < off ? 1 : 0;
  const u = abs - t0;
  camera(c, 540, 700, 1.25 + 0.04 * phase(u, 0, 1.4), 0, 0, 160);
  herRoomSnow(c, abs, { lamp });
  const holding = u < 0.45;
  herInBed(c, 540, 640, 0.95, { eyes: u < 0.3 ? "sad" : u < 0.9 ? "shut" : "tired", mouth: u < 0.9 ? "o" : "flat", arms: holding ? "phone" : "down", headY: u > 0.2 && u < 0.9 ? 8 : 0 });
  herBlanket(c);
  herRoomShade(c, abs, { lamp, phone: holding ? [560, 900, 0.6] : undefined });
}

/** 7 · the dark; the phone face down on the pillow lights round its edges and buzzes; she turns it over. */
function shot7(c: Ctx, abs: number, t0: number, end: number) {
  const u = abs - t0;
  const z = 1 + 0.25 * easeInOut(phase(u, 0, end - t0));
  fillBg(c, "#0c0b16");
  camera(c, 540, 900, z);
  // pillow and duvet from above
  blob(c, [[120, 520], [960, 500], [1000, 1300], [90, 1320]], 6201, 3);
  paint(c, "#3a2f45", C.ink, 6);
  blob(c, [[-60, 1250], [1140, 1200], [1140, 2000], [-60, 2000]], 6202, 3);
  paint(c, "#4a2b3a", C.ink, 6);
  const lit = abs >= t0 + 0.0;
  const flip = phase(u, 0.75, 1.05);
  const sx = Math.cos(flip * Math.PI);
  const buzz = u < 0.6 ? 1 - u / 0.6 : 0;
  c.save();
  c.translate(540 + (buzz > 0 ? Math.sin(abs * 90) * 6 * buzz : 0), 900);
  c.rotate(-0.25 + 0.25 * flip);
  c.scale(Math.abs(sx) < 0.02 ? 0.02 : sx, 1);
  if (sx > 0) {
    if (lit) glow(c, 0, 0, 380, "rgba(150,180,255,0.55)");
    phoneBack(c, 0, 0, 330, 680, 0, 0);
  } else {
    c.scale(-1, 1);
    glow(c, 0, 0, 520, "rgba(150,180,255,0.6)");
    drawPhone(c, abs, { cx: 0, cy: 0, s: 0.55 }, (p) => {
      vidPost(p, { time: "02:49", photo: couplePhoto(false), caption: "周末～", ago: "3小时前" });
      vidBanner(p, phase(u, 1.05, 1.3), { name: ACC_B, body: "那个男生配不上你", rose: true });
    });
  }
  c.restore();
}

/** 8 · the new message: the grey avatar again, on her photo with her boyfriend — the camera rushes onto the banner
 *  「那个男生配不上你🌹」 (two yellow pulses) and holds while it sinks in. */
function shot8(c: Ctx, abs: number, t0: number) {
  roomBokeh(c, abs, { dark: 0.6 });
  const A = { cx: 540, cy: 930, s: 1 };
  const B = aim(330, 176, 540, 760, 1.9); // the banner's message
  const e = easeInOut(phase(abs, t0 + 0.12, t0 + 0.62));
  const P = aimLerp(A, B, e);
  glow(c, P.cx, P.cy - 120 * P.s, 900 * P.s, "rgba(120,150,255,0.3)");
  drawPhone(c, abs, P, (p) => {
    vidPost(p, { time: "02:49", photo: couplePhoto(false), caption: "周末～", ago: "3小时前" });
    vidBanner(p, 1, { name: ACC_B, body: "那个男生配不上你", rose: true });
    pulseBox(p, 18, 84, 564, 172, phase(abs, t0 + 0.55, t0 + 1.25));
  });
}

/** 9 · her face, not in a reflection: frozen over the duvet in the dark, only the phone lighting her from below; a
 *  slow push; on the song's stop the camera pulls out through her window (journey.ts). */
function shot9(c: Ctx, abs: number, t0: number) {
  // on the song's stop the camera pulls out of her face, out of her window — the start of the long flight to him
  if (abs >= WORD.stop) pullOut(c, abs, WORD.stop, ACT2_AT, (k) => faceScared(k, abs, t0));
  else faceScared(c, abs, t0);
}
/** the start of act 2 (visual.json) */
const ACT2_AT = 15.41955;
export function faceScared(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  filtered(c, "blur(6px) brightness(0.45)", (b) => {
    camera(b, 540, 620, 1.9, 0, 0, 120);
    herRoomSnow(b, abs, { lamp: 0 });
  }, "s9room");
  camera(c, 540, 760, 1.04 + 0.1 * easeOut(phase(u, 0, 1.2)));
  // surprise first (brows up, a jolt back), then fear: brows knit, she shrinks down and trembles
  const jolt = backOut(phase(u, 0, 0.18)) * (1 - phase(u, 0.18, 0.5));
  const scared = phase(u, 0.4, 0.6);
  const tremble = scared * Math.sin(abs * 38) * 3;
  herInBed(c, 540 + tremble, 780 - 26 * jolt + 22 * scared, 1.6, { eyes: "wide", mouth: "o", brows: scared > 0.5 ? "worried" : "up", look: [0.15 * Math.sin(u * 7) * scared, 0.45], headY: 10 * scared, arms: "down" });
  // a bead of cold sweat
  if (scared > 0) {
    c.save();
    c.globalAlpha = scared;
    c.fillStyle = "#bfe3ff";
    c.strokeStyle = C.ink;
    c.lineWidth = 4;
    c.beginPath();
    const sx = 690, sy = 770 + 22 * scared + 34 * phase(u, 0.6, 1.2);
    c.moveTo(sx, sy - 26);
    c.quadraticCurveTo(sx + 18, sy, sx, sy + 12);
    c.quadraticCurveTo(sx - 18, sy, sx, sy - 26);
    c.fill();
    c.stroke();
    c.restore();
  }
  blob(c, [[-80, 1060], [300, 1010], [560, 1030], [800, 1012], [1160, 1050], [1160, H + 80], [-80, H + 80]], 6111, 2);
  paint(c, "#7a4f66", C.ink, 7);
  // the phone's cold light from below, the rest of the room dark
  glow(c, 540, 1250, 820, "rgba(140,170,255,0.5)");
  const v = c.createRadialGradient(540, 760, 260, 540, 760, 1000);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(2,3,10,0.7)");
  c.fillStyle = v;
  c.fillRect(-60, -60, W + 120, H + 120);
}
