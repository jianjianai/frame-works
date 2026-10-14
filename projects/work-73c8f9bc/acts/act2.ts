// 第二幕 · 另一部手机（32–67 拍）：同一时刻，一部旧手机（字号最大、贴膜裂了）放大她的笑脸、她男朋友 → 往后拉：
// 岗亭里一个戴帽子的背影 → 手机放在桌上熄屏，黑屏里映出一张老人的脸 → 点亮：锁屏壁纸是年轻的他扛着小时候的她
// → 微信「囡囡」的朋友圈只有一条横线 → 他用一根手指打字。
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase } from "@frame/engine/math";
import { Ctx, camera, castShadow, designScene, fillBg, filtered, flash, glow, handheld, litFigure, oval, paint, smearV, zoomBlur } from "@materials/s0rrow/code/draw";
import { phone, phoneBack, statusBar } from "@materials/s0rrow/code/phone";
import { SHOT, WORD, at } from "./timeline";
import { ACC_B, DAD_CALLS_HER, WALL_FACE, WALL_S, couplePhoto, dadLock, slide, vidPost, wxContact, wxMomentsBlocked } from "./ui";
import { boothBack, boothFront, boothFrontDesk, deskTop } from "@materials/s0rrow/code/blocked/booth";
import { drawDad } from "@materials/s0rrow/code/blocked/dad";
import { bump, drawPhone, emph, enter, exit, fade, moveBlur, nudge, phoneXf, slow, snap, steps, tap, timeCard, whip, zoomSteps, type Xf } from "./shots";
import { BOOTH_AT, flight, pullOut } from "./journey";
import { faceScared } from "./act1";

/** visual.json: act2 starts on beat 32. */
export const ACT2_START = 15.41955;
/** the long flight (journey.ts): up into the sky, across the country, into his phone */
const FLY_AT = 15.56;
const CRASH_AT = 16.4;
const ARRIVE_AT = 16.7;
/** the swipe from the first photo to the second (just after the zoom back out) */
const SWIPE_AT = WORD.kissing - 0.3;
/** the pinch that zooms the first photo back out before the swipe */
const PINCH_BACK = SWIPE_AT - 0.27;
/** two fingers spread on her laughing face (landing on beat 35¾), and later on him (landing on beat 39) */
const PINCH1: [number, number] = [ARRIVE_AT + 0.08, 17.225];
const PINCH2: [number, number] = [18.38, 18.79];
const COMMENT = [
  { name: ACC_B, text: "那个男生配不上你", rose: true, ago: "1分钟前" },
  { name: "阿琪", text: "好甜！！我酸了", ago: "2小时前" },
  { name: "小雅", text: "99", ago: "3小时前" },
];

export function createScene(options: SceneOptions) {
  return designScene(options, ACT2_START, (ctx, abs) => draw(ctx, abs));
}

function draw(c: Ctx, abs: number) {
  const s11 = at(SHOT.s11),
    s12 = at(SHOT.s12),
    s14 = at(SHOT.s14),
    s15 = at(SHOT.s15);
  if (abs < FLY_AT) {
    // the end of the pull out of her window, whipped up into the night sky
    const [dy, sm] = whip(abs, FLY_AT, 1100, FLY_AT - ACT2_START, 0.22);
    smearV(c, (k) => {
      k.save();
      k.translate(0, dy);
      // the pull out of her window is still landing as the whip takes the camera up (journey.ts)
      pullOut(k, abs, (q) => faceScared(q, abs, at(SHOT.s9)));
      k.restore();
    }, sm, "j1");
  } else if (abs < CRASH_AT) {
    const [dy, sm] = whip(abs, FLY_AT, 1100, FLY_AT - ACT2_START, 0.22);
    const p = phase(abs, FLY_AT, CRASH_AT + 0.05);
    zoomBlur(c, (k) => smearV(k, (q) => {
      q.save();
      q.translate(0, dy);
      flight(q, abs, p);
      q.restore();
    }, sm, "j2"), BOOTH_AT[0], BOOTH_AT[1], 0.35 * exit(phase(abs, CRASH_AT - 0.12, CRASH_AT)), "j3");
  } else if (abs < ARRIVE_AT) {
    // crash through the booth light into his phone screen: the impact, then braking hard onto the phone
    const e = enter(phase(abs, CRASH_AT, ARRIVE_AT));
    const z = Math.pow(3.2, 1 - e);
    zoomBlur(c, (k) => {
      k.save();
      k.translate(BOOTH_AT[0] + (540 - BOOTH_AT[0]) * e, BOOTH_AT[1] + (860 - BOOTH_AT[1]) * e);
      k.scale(z, z);
      k.translate(-540, -860);
      shot10(k, abs);
      k.restore();
    }, 540, 860, 0.3 * (1 - e), "j4");
    flash(c, 0.7 * (1 - e) * (1 - e), "#fff3dd");
  } else if (abs < s11) shot10(c, abs);
  else if (abs < s12) shot11(c, abs, s11);
  else if (abs < s14) shot12(c, abs, s12, s14);
  else if (abs < s15) shot14(c, abs, s14);
  else shot15(c, abs, s15);
  timeCard(c, abs, "同一时刻", ARRIVE_AT + 0.05, ARRIVE_AT + 1.9);
}

/** the post on his phone: photo 1 (zoomed on her laugh) then photo 2 (the kiss, zoomed on the boyfriend) */
function hisPost(p: Ctx, abs: number) {
  // the photo opened full screen (no comments: the audience has read them already, and they'd fight the lyrics)
  const second = abs >= WORD.kissing - 0.3;
  // two fingers pinch the first photo back to its size, then the swipe follows straight on
  const back1 = emph(phase(abs, PINCH_BACK, SWIPE_AT - 0.02));
  // a swipe to the next photo: the first slides off to the left as the second comes in from the right
  const swipe = enter(phase(abs, SWIPE_AT, SWIPE_AT + 0.22));
  const zoom1 = 1 + 1.0 * emph(phase(abs, PINCH1[0], PINCH1[1])) * (1 - back1);
  const zoom2 = 1 + 0.45 * emph(phase(abs, PINCH2[0], PINCH2[1]));
  const [x, y, w, h] = [-180, 0, 960, 1280];
  const photo = (which: boolean, zoom: number, dx: number) => {
    const [fx, fy] = which ? [0.55, 0.43] : [0.36, 0.47];
    p.save();
    p.translate(dx, 0);
    // zoom about the face, drifting it toward the middle as it grows
    const Fx = x + w * fx,
      Fy = y + h * fy;
    const k = Math.min(1, (zoom - 1) / 0.8);
    p.translate(Fx + (300 - Fx) * k, Fy + (560 - Fy) * k);
    p.scale(zoom, zoom);
    p.translate(-Fx, -Fy);
    couplePhoto(which)(p, x, y, w, h);
    p.restore();
  };
  p.fillStyle = "#000";
  p.fillRect(0, 0, 600, 1280);
  if (swipe < 1) photo(false, zoom1, -632 * swipe);
  if (swipe > 0) photo(true, zoom2, 632 * (1 - swipe));
  // the viewer's chrome: status bar, page dots
  const g = p.createLinearGradient(0, 0, 0, 180);
  g.addColorStop(0, "rgba(0,0,0,0.45)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  p.fillStyle = g;
  p.fillRect(0, 0, 600, 180);
  statusBar(p, { time: "02:49", airplane: false, battery: 0.3 });
  void second;
  for (let i = 0; i < 2; i++) {
    p.fillStyle = (swipe > 0.5 ? 1 : 0) === i ? "#fff" : "rgba(255,255,255,0.45)";
    p.beginPath();
    p.arc(285 + i * 30, 1230, 7, 0, Math.PI * 2);
    p.fill();
  }
}

/** 10 · the same post on another phone; two fingers zoom in on her laughing, swipe, the kiss, the boyfriend. */
function shot10(c: Ctx, abs: number) {
  // the booth behind the phone, out of focus: the same patch of it (and the same framing) that shot 11 opens on, so
  // the cut into the pull-back doesn't change the background
  c.save();
  c.translate(540, 860);
  c.scale(1 / S11_PHONE, 1 / S11_PHONE);
  c.translate(-S11_AT[0], -S11_AT[1]);
  filtered(c, "blur(9px) brightness(0.55)", (k) => boothBack(k, abs, { detailed: true }), "s10bg");
  c.restore();
  glow(c, 540, 860, 900, "rgba(140,170,255,0.28)");
  const pinch = (t0: number, t1: number, closing = false) => {
    const m = emph(phase(abs, t0, t1));
    const k = closing ? 1 - m : m;
    const on = fade((abs - (t0 - 0.06)) / 0.05) * (1 - fade((abs - (t1 + 0.01)) / 0.05));
    return [
      { x: 300 - 60 - 90 * k, y: 480 - 40 - 60 * k, k: on },
      { x: 300 + 60 + 90 * k, y: 480 + 40 + 60 * k, k: on },
    ];
  };
  drawPhone(c, abs, { cx: 540, cy: 860, s: 1 }, (p) => hisPost(p, abs), {
    old: true,
    touches: [
      ...pinch(PINCH1[0], PINCH1[1]),
      ...pinch(PINCH_BACK, SWIPE_AT - 0.02, true),
      { x: 470 - 340 * enter(phase(abs, SWIPE_AT - 0.04, SWIPE_AT + 0.18)), y: 760, k: fade((abs - (SWIPE_AT - 0.08)) / 0.05) * (1 - fade((abs - (SWIPE_AT + 0.18)) / 0.05)) },
      ...pinch(PINCH2[0], PINCH2[1]),
    ],
  });
}

/** where his phone is in the booth at the start of shot 11 (booth design units) and its size there */
const S11_AT: [number, number] = [700, 1010];
const S11_PHONE = 0.3;
/** 11 · back out of the phone screen in two clean moves: over his shoulder (a man in a cap, from behind, the phone in
 *  his hand — lands on beat 41); he sets the phone down on the desk (beat 43); then wide on 「so lonely」 (lands on beat
 *  44½): the tiny guard booth, snow on the gate outside; he sighs. */
function shot11(c: Ctx, abs: number, t0: number) {
  const X = cam11(abs, t0);
  const down = emph(phase(abs, at(42), at(43)));
  const P = { x: S11_AT[0] + 30 * down, y: S11_AT[1] + 70 * down };
  const ps = S11_PHONE;
  // shot 10's dim, out-of-focus booth brightens and sharpens as we pull back (no jump in exposure at the cut)
  const lift = fade(phase(abs, t0, at(41)));
  moveBlur(c, cam11(abs - 1 / 60, t0), X, (k) => {
    k.save();
    k.translate(X.x, X.y);
    k.scale(X.z, X.z);
    shot11World(k, abs, t0, P, down, ps, lift);
    k.restore();
  }, "s11blur");
  // shot 10's cold screen glow lingers for a moment
  glow(c, 540, 860, 900, "rgba(140,170,255,0.28)", 1 - lift);
}
/** shot 11's framings: the booth point (fx, fy) placed at frame point (qx, qy), zoomed z */
interface Frame11 {
  fx: number;
  fy: number;
  qx: number;
  qy: number;
  z: number;
}
const lerp11 = (a: Frame11, b: Frame11, e: number): Frame11 => ({
  fx: a.fx + (b.fx - a.fx) * e,
  fy: a.fy + (b.fy - a.fy) * e,
  qx: a.qx + (b.qx - a.qx) * e,
  qy: a.qy + (b.qy - a.qy) * e,
  z: a.z * Math.pow(b.z / a.z, e),
});
/** Shot 11's camera at time t: from his phone exactly where shot 10 held it (at rest), out over his shoulder, still,
 *  then out to the whole booth, still — breathing a little like a hand-held camera. */
function cam11(t: number, t0: number): Xf {
  const START: Frame11 = { fx: S11_AT[0], fy: S11_AT[1], qx: 540, qy: 860, z: 1 / S11_PHONE };
  const SHOULDER: Frame11 = { fx: 640, fy: 1060, qx: 560, qy: 940, z: 1.55 };
  const WIDE: Frame11 = { fx: 540, fy: 960, qx: 540, qy: 960, z: 1 };
  const f = lerp11(lerp11(START, SHOULDER, emph(phase(t, t0, at(41)))), WIDE, emph(phase(t, at(43.5), at(44.5))));
  const [hx, hy] = handheld(t, 2, 11);
  const calm = phase(t, t0, at(41)); // no hand-held wobble on the phone screen at the cut
  return { x: f.qx - f.z * f.fx + hx * calm, y: f.qy - f.z * f.fy + hy * calm, z: f.z };
}
function shot11World(c: Ctx, abs: number, t0: number, P: { x: number; y: number }, down: number, ps: number, lift: number) {
  const sharp = emph(phase(abs, t0, at(41)));
  filtered(c, `blur(${(9 * (1 - sharp)).toFixed(1)}px) brightness(${(0.55 + 0.45 * lift).toFixed(3)})`, (k) => boothBack(k, abs, { detailed: true }), "s11bg");
  // A soft contact shadow settles onto the glass as the phone lowers.
  c.save();
  c.globalAlpha = 0.26 + 0.2 * down;
  oval(c, P.x + 8, 1203 - 49 * down, 96 + 14 * down, 17 + 8 * down, 88400, 0.4);
  paint(c, "#091520", null);
  c.restore();
  // the phone (in his hands, then lying on the desk)
  c.save();
  c.translate(P.x, P.y);
  c.scale(1, 1 - 0.55 * down);
  c.translate(-P.x, -P.y);
  glow(c, P.x, P.y + 35, 235, "rgba(150,180,255,0.24)");
  phone(c, P.x, P.y, ps, 0, (p) => hisPost(p, Math.min(abs, PINCH2[1])));
  c.restore();
  // him, from behind, dark against the window with a warm rim from the lamp outside; he lets his head drop, sighs.
  // Right after the cut he is a big shape in the foreground, out of focus, and comes into focus as we pull back.
  // the sigh once the booth is wide: his head sinks and comes back up, deepest on beat 46
  const sigh = bump(abs, at(46), 0.55);
  const him = (q: Ctx) =>
    litFigure(q, (k) => drawDad(k, 510, 1170 + 10 * sigh, 1.12, { view: "back", coat: true, backDetails: true, tilt: 0.04 * sigh, headY: 16 * sigh }), {
      shade: 0.38,
      shadeCol: "rgb(13,23,33)",
      lights: [
        { x: P.x, y: P.y, r: 285, rgb: "150,185,255", a: 0.3 * (1 - down) + 0.04 },
        { x: 280, y: 906, r: 355, rgb: "132,191,211", a: 0.12 },
        { x: 970, y: 1510, r: 445, rgb: "238,147,79", a: 0.13 },
      ],
      rim: { ux: 0.48, uy: -1, rgb: "255,191,125", a: 0.38, width: 7 },
    });
  const defocus = 14 * (1 - sharp);
  if (defocus > 0.3) filtered(c, `blur(${defocus.toFixed(1)}px) brightness(${(0.7 + 0.3 * lift).toFixed(3)})`, him, "s11him");
  else him(c);
}

/** 12–13 · the phone on the desk from above. On 「mirror」 the screen sleeps and his face shows in the black glass —
 *  an old man; he taps it awake and the face melts into the wallpaper: young him with little her on his shoulders. */
function shot12(c: Ctx, abs: number, t0: number, end: number) {
  // still while his photo is on the screen; when it goes dark on 「mirror」, one slow push into the black glass as his
  // face comes up in it, landing as he taps it awake; still again on the wallpaper
  const z = zoomSteps(abs, 1, [{ at: at(51), len: WORD.all + 0.05 - at(51), to: 1.16, ease: slow }]);
  const [hx, hy, hr] = handheld(abs, 1.5, 12);
  const off = WORD.mirror;
  const wake = WORD.all + 0.05;
  // the screen dims out in a beat (like a real phone going to sleep) and fades up when he wakes it
  const lit = abs < wake ? 1 - fade(phase(abs, off, off + 0.12)) : fade(phase(abs, wake, wake + 0.2));
  c.save();
  camera(c, 540, 880, z, hr, hx, hy);
  deskTop(c, abs, { detailed: true, phoneLight: lit, phoneResting: true });
  c.restore();
  // into the close-up: the phone lifts off the desk, turns straight and settles where shot 14 holds it, while the
  // desk melts into the dark booth behind
  const e = emph(phase(abs, end - 0.55, end));
  if (e > 0) {
    filtered(c, "blur(9px) brightness(0.75)", (k) => boothFront(k, abs, { detailed: true }), "s12bg", e);
    glow(c, 540, 860, 900, "rgba(150,180,255,0.3)", e);
  }
  const P = { cx: 540 + hx * (1 - e), cy: 880 + hy * (1 - e) + 20 * e, s: 0.92 * z * (1 - e) + e, rot: (0.06 + hr) * (1 - e) };
  const [fx, fy] = [WALL_FACE[0] * 600, WALL_FACE[1] * 1280];
  drawPhone(c, abs, P, (p) => {
    if (abs < off + 0.12) {
      hisPost(p, WORD.kissing + 0.8);
      p.fillStyle = `rgba(4,5,7,${(1 - lit).toFixed(3)})`;
      p.fillRect(0, 0, 600, 1280);
      return;
    }
    // the black glass with his reflection
    const mix = fade((abs - wake) / 0.45);
    if (mix < 1) {
      p.fillStyle = "#040507";
      p.fillRect(0, 0, 600, 1280);
      p.save();
      p.globalAlpha = 0.6 * fade((abs - off) / 0.35) * (1 - mix);
      drawDad(p, fx, fy, WALL_S, { coat: true, eyes: "tired", look: [0, 0.2], brows: "worried", mouth: "flat", tilt: 0.03 });
      p.restore();
      p.fillStyle = `rgba(4,8,20,${(0.5 * (1 - mix)).toFixed(3)})`;
      p.fillRect(0, 0, 600, 1280);
    }
    if (mix > 0) {
      const up = enter(phase(abs, UNLOCK_AT, UNLOCK_AT + 0.26));
      if (up > 0) herProfile(p, abs);
      p.save();
      p.globalAlpha = mix;
      p.translate(0, -1280 * up);
      dadLock(p, { time: "02:51", date: "1月14日 星期二" });
      p.restore();
    }
  }, { old: true, touches: [tap(abs, wake, 300, 1100), { x: 300, y: 1180 - 600 * enter(phase(abs, UNLOCK_AT - 0.04, UNLOCK_AT + 0.2)), k: fade((abs - (UNLOCK_AT - 0.08)) / 0.05) * (1 - fade((abs - (UNLOCK_AT + 0.18)) / 0.05)) }] });
}

/** his phone: her WeChat profile — the Moments row shows nothing */
function herProfile(p: Ctx, abs: number, tapK = 0) {
  wxContact(p, { time: "02:51", name: DAD_CALLS_HER, who: "her", blocked: true, empty: true, big: true, tap: tapK });
  void abs;
}
/** 28 s, the unlock (on the eighth before the cut to the close-up); 29.87 s the falsetto high note the line lands on */
const UNLOCK_AT = 27.7;
const HIGH_NOTE = 29.87;

/** 14 · close on his phone: her profile, Moments shows nothing; he taps Moments — the page opens on her cover, and on
 *  the high note a single grey line draws across: she hid her Moments from him. */
function shot14(c: Ctx, abs: number, t0: number) {
  const tapAt = HIGH_NOTE - 0.32;
  const open = (abs - tapAt - 0.02) / 0.26;
  // steady on her profile; a quick push onto the empty 「朋友圈」 row (lands on beat 59½, its pulse going out); steady
  // while he taps it; on the high note, as the line draws, a snap in on the line — then steady again
  const P0 = { cx: 540, cy: 900, s: 1 };
  const onRow = nudge(P0, 380, 595, 1.1);
  const P = steps(abs, P0, [
    { at: at(59.5) - 0.24, len: 0.24, to: onRow },
    { at: HIGH_NOTE, len: 0.18, to: nudge(onRow, 300, 760, 1.08), ease: snap },
  ]);
  // the booth behind moves with the phone at a fraction of its travel
  c.save();
  camera(c, 540, 900, 1 + 0.15 * (P.s - 1), 0, 0.15 * (P.cx - 540), 0.15 * (P.cy - 900));
  filtered(c, "blur(9px) brightness(0.75)", (k) => boothFront(k, abs, { detailed: true }), "s14bg");
  c.restore();
  glow(c, P.cx, P.cy - 40 * P.s, 900 * P.s, "rgba(150,180,255,0.3)");
  drawPhone(c, abs, P, (p) =>
    slide(p, open,
      (q) => herProfile(q, abs, phase(abs, at(59.5), at(59.5) + 0.6)),
      (q) => wxMomentsBlocked(q, { time: "02:51", name: DAD_CALLS_HER, line: enter(phase(abs, HIGH_NOTE, HIGH_NOTE + 0.18)), big: true })),
  { old: true, touches: [tap(abs, tapAt, 300, 595)] });
  void t0;
}

/** 15 · his face over the phone, glasses pushed up, typing with one finger. */
function shot15(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  boothFront(c, abs, { detailed: true, blur: 3.5, clock: 2 + 53 / 60 });
  // a quiet, steady close-up: all the movement is his one finger (the camera only breathes)
  const [hx, hy, hr] = handheld(abs, 2, 15);
  camera(c, 540, 760, 1.02, hr, hx, hy);
  // one finger, four slow taps (多 · 穿 · 点 · send)
  const taps = [0.12, 0.47, 0.72, 0.96];
  const tapK = taps.reduce((m, t) => Math.max(m, bump(u, t, 0.09)), 0);
  const phoneAt: [number, number] = [540 - 10 * 1.42, 600 + 400 * 1.42];
  const dad = (k: Ctx) => drawDad(k, 540, 600, 1.42, { coat: true, frontDetails: true, screenReflection: 0.85, eyes: "down", brows: "worried", mouth: "press", tilt: 0.04, arms: "type", tap: tapK, holding: (q) => phoneBack(q, -10, 400, 150, 270, -0.08, 0, { detailed: true, caseColor: "#252d35", cameraColor: "#343e47" }) });
  castShadow(c, [960, 400], 1.13, dad, "#071a21", 25, 0.17, (k) => { k.beginPath(); k.rect(-60, -60, 745, 2040); k.clip(); });
  litFigure(c, dad, {
    shade: 0.38,
    shadeCol: "rgb(12,27,39)",
    lights: [
      { x: phoneAt[0], y: 805, r: 310, rgb: "149,190,210", a: 0.27 },
      { x: phoneAt[0], y: phoneAt[1] - 10, r: 215, rgb: "144,183,201", a: 0.1 },
      { x: 220, y: 850, r: 490, rgb: "118,158,174", a: 0.075 },
      { x: 865, y: 555, r: 480, rgb: "245,178,106", a: 0.19 },
    ],
    rim: { ux: 1, uy: -0.4, rgb: "245,190,123", a: 0.34, width: 5 },
  });
  filtered(c, "blur(0.7px)", (k) => boothFrontDesk(k, abs), "s15desk");
}
