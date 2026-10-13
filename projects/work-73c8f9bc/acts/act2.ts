// 第二幕 · 另一部手机（32–67 拍）：同一时刻，一部旧手机（字号最大、贴膜裂了）放大她的笑脸、她男朋友 → 往后拉：
// 岗亭里一个戴帽子的背影 → 手机放在桌上熄屏，黑屏里映出一张老人的脸 → 点亮：锁屏壁纸是年轻的他扛着小时候的她
// → 微信「囡囡」的朋友圈只有一条横线 → 他用一根手指打字。
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase } from "@frame/engine/math";
import { Ctx, camera, designScene, easeInOut, easeOut, fillBg, filtered, flash, glow, litFigure, smearV, zoomBlur } from "@materials/s0rrow/code/draw";
import { phone, phoneBack, statusBar } from "@materials/s0rrow/code/phone";
import { SHOT, WORD, at } from "./timeline";
import { ACC_B, DAD_CALLS_HER, WALL_FACE, WALL_S, couplePhoto, dadLock, slide, vidPost, wxContact, wxMomentsBlocked } from "./ui";
import { boothBack, boothFront, deskTop } from "@materials/s0rrow/code/blocked/booth";
import { drawDad } from "@materials/s0rrow/code/blocked/dad";
import { drawPhone, tap, timeCard, whip } from "./shots";
import { BOOTH_AT, facadeWide, flight } from "./journey";
import { faceScared } from "./act1";

/** visual.json: act2 starts on beat 32. */
export const ACT2_START = 15.41955;
/** the long flight (journey.ts): up into the sky, across the country, into his phone */
const FLY_AT = 15.56;
const CRASH_AT = 16.4;
const ARRIVE_AT = 16.7;
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
      facadeWide(k, abs, (q) => faceScared(q, abs, at(SHOT.s9)));
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
    }, sm, "j2"), BOOTH_AT[0], BOOTH_AT[1], 0.35 * phase(abs, CRASH_AT - 0.12, CRASH_AT), "j3");
  } else if (abs < ARRIVE_AT) {
    // crash through the booth light into his phone screen, braking
    const e = easeOut(phase(abs, CRASH_AT, ARRIVE_AT));
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
  else if (abs < s12) shot11(c, abs, s11, s12);
  else if (abs < s14) shot12(c, abs, s12, s14);
  else if (abs < s15) shot14(c, abs, s14);
  else shot15(c, abs, s15);
  timeCard(c, abs, "同一时刻", ARRIVE_AT + 0.05, ARRIVE_AT + 1.9);
}

/** the post on his phone: photo 1 (zoomed on her laugh) then photo 2 (the kiss, zoomed on the boyfriend) */
function hisPost(p: Ctx, abs: number) {
  // the photo opened full screen (no comments: the audience has read them already, and they'd fight the lyrics)
  const second = abs >= WORD.kissing - 0.3;
  const back1 = phase(abs, WORD.kissing - 0.5, WORD.kissing - 0.3);
  const zoom = second
    ? 1 + 0.45 * easeInOut(phase(abs, WORD.kissing + 0.1, WORD.kissing + 0.8))
    : 1 + 1.0 * easeInOut(phase(abs, ARRIVE_AT + 0.05, ARRIVE_AT + 0.65)) * (1 - back1);
  const [x, y, w, h] = [-180, 0, 960, 1280];
  const [fx, fy] = second ? [0.55, 0.43] : [0.36, 0.47];
  p.save();
  // zoom about the face, drifting it toward the middle as it grows
  const Fx = x + w * fx,
    Fy = y + h * fy;
  const k = Math.min(1, (zoom - 1) / 0.8);
  p.translate(Fx + (300 - Fx) * k, Fy + (560 - Fy) * k);
  p.scale(zoom, zoom);
  p.translate(-Fx, -Fy);
  couplePhoto(second)(p, x, y, w, h);
  p.restore();
  // the viewer's chrome: status bar, page dots
  const g = p.createLinearGradient(0, 0, 0, 180);
  g.addColorStop(0, "rgba(0,0,0,0.45)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  p.fillStyle = g;
  p.fillRect(0, 0, 600, 180);
  statusBar(p, { time: "02:49", airplane: false, battery: 0.3 });
  for (let i = 0; i < 2; i++) {
    p.fillStyle = (second ? 1 : 0) === i ? "#fff" : "rgba(255,255,255,0.45)";
    p.beginPath();
    p.arc(285 + i * 30, 1230, 7, 0, Math.PI * 2);
    p.fill();
  }
}

/** 10 · the same post on another phone; two fingers zoom in on her laughing, swipe, the kiss, the boyfriend. */
function shot10(c: Ctx, abs: number) {
  filtered(c, "blur(9px) brightness(0.55)", (k) => boothBack(k, abs), "s10bg");
  glow(c, 540, 860, 900, "rgba(140,170,255,0.28)");
  const pinch = (t0: number, t1: number) => {
    const k = phase(abs, t0, t1);
    const on = abs > t0 - 0.05 && abs < t1 + 0.05 ? 1 : 0;
    return [
      { x: 300 - 60 - 90 * k, y: 480 - 40 - 60 * k, k: on },
      { x: 300 + 60 + 90 * k, y: 480 + 40 + 60 * k, k: on },
    ];
  };
  drawPhone(c, abs, { cx: 540, cy: 860, s: 1 }, (p) => hisPost(p, abs), {
    old: true,
    touches: [...pinch(ARRIVE_AT + 0.05, ARRIVE_AT + 0.65), ...pinch(WORD.kissing + 0.1, WORD.kissing + 0.8)],
  });
}

/** 11 · one move back from the phone screen: a man in a cap seen from behind in a tiny guard booth, snow on the
 *  gate outside; he puts the phone down on the desk, rubs his eyes. */
function shot11(c: Ctx, abs: number, t0: number, end: number) {
  const e = easeInOut(phase(abs, t0, t0 + 1.6));
  // where the phone sits in the wide shot (held up by his face, beside his cap), then down on the desk
  const down = easeInOut(phase(abs, t0 + 1.25, t0 + 1.95));
  const P = { x: 700 + 30 * down, y: 1010 + 70 * down };
  const ps = 0.3;
  const Z0 = 1 / ps;
  const z = Math.pow(Z0, 1 - e);
  const sx = 540 + (P.x - 540) * e,
    sy = 900 + (P.y - 900) * e;
  c.save();
  c.translate(sx, sy);
  c.scale(z, z);
  c.translate(-P.x, -P.y);
  filtered(c, `blur(${(7 * (1 - e)).toFixed(1)}px)`, (k) => boothBack(k, abs), "s11bg");
  // the phone (in his hands, then lying on the desk)
  c.save();
  c.translate(P.x, P.y);
  c.scale(1, 1 - 0.55 * down);
  c.translate(-P.x, -P.y);
  glow(c, P.x, P.y, 300, "rgba(150,180,255,0.4)");
  phone(c, P.x, P.y, ps, 0, (p) => hisPost(p, Math.min(abs, WORD.kissing + 0.8)));
  c.restore();
  // him, from behind, dark against the window with a warm rim from the lamp outside; he lets his head drop, sighs
  const sigh = Math.sin(phase(abs, t0 + 2.1, t0 + 3.4) * Math.PI);
  litFigure(c, (k) => drawDad(k, 510, 1170 + 10 * sigh, 1.12, { view: "back", coat: true, tilt: 0.04 * sigh, headY: 16 * sigh }), {
    shade: 0.45,
    lights: [{ x: P.x, y: P.y, r: 320, rgb: "150,185,255", a: 0.35 * (1 - down) }],
    rim: { ux: 0.3, uy: -1, rgb: "255,190,120", a: 0.55, width: 8 },
  });
  c.restore();
  void end;
}

/** 12–13 · the phone on the desk from above. On 「mirror」 the screen sleeps and his face shows in the black glass —
 *  an old man; he taps it awake and the face melts into the wallpaper: young him with little her on his shoulders. */
function shot12(c: Ctx, abs: number, t0: number, end: number) {
  const z = 1 + 0.2 * easeInOut(phase(abs, t0, end));
  const off = WORD.mirror;
  const wake = WORD.all + 0.05;
  const lit = abs < off ? 1 : abs < wake ? 0 : 1;
  c.save();
  camera(c, 540, 880, z);
  deskTop(c, abs);
  glow(c, 540, 880, 520, "rgba(150,180,255,0.4)", lit ? 1 : 0.15);
  c.restore();
  // into the close-up: the phone lifts off the desk, turns straight and settles where shot 14 holds it, while the
  // desk melts into the dark booth behind
  const e = easeInOut(phase(abs, end - 0.55, end));
  if (e > 0) {
    filtered(c, "blur(9px) brightness(0.5)", (k) => boothFront(k, abs), "s12bg", e);
    glow(c, 540, 860, 900, "rgba(150,180,255,0.3)", e);
  }
  const P = { cx: 540, cy: 880 + 20 * e, s: 0.92 * z * (1 - e) + e, rot: 0.06 * (1 - e) };
  const [fx, fy] = [WALL_FACE[0] * 600, WALL_FACE[1] * 1280];
  drawPhone(c, abs, P, (p) => {
    if (abs < off) {
      hisPost(p, WORD.kissing + 0.8);
      return;
    }
    // the black glass with his reflection
    const mix = clamp((abs - wake) / 0.55);
    if (mix < 1) {
      p.fillStyle = "#040507";
      p.fillRect(0, 0, 600, 1280);
      p.save();
      p.globalAlpha = 0.6 * clamp((abs - off) / 0.35) * (1 - mix);
      drawDad(p, fx, fy, WALL_S, { coat: true, eyes: "tired", look: [0, 0.2], brows: "worried", mouth: "flat", tilt: 0.03 });
      p.restore();
      p.fillStyle = `rgba(4,8,20,${(0.5 * (1 - mix)).toFixed(3)})`;
      p.fillRect(0, 0, 600, 1280);
    }
    if (mix > 0) {
      const up = easeInOut(phase(abs, UNLOCK_AT, UNLOCK_AT + 0.3));
      if (up > 0) herProfile(p, abs);
      p.save();
      p.globalAlpha = mix;
      p.translate(0, -1280 * up);
      dadLock(p, { time: "02:51", date: "1月14日 星期二" });
      p.restore();
    }
  }, { old: true, touches: [tap(abs, wake, 300, 1100), { x: 300, y: 1180 - 600 * phase(abs, UNLOCK_AT - 0.05, UNLOCK_AT + 0.2), k: abs > UNLOCK_AT - 0.08 && abs < UNLOCK_AT + 0.22 ? 1 : 0 }] });
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
  filtered(c, "blur(9px) brightness(0.5)", (k) => boothFront(k, abs), "s14bg");
  glow(c, 540, 860, 900, "rgba(150,180,255,0.3)");
  const tapAt = HIGH_NOTE - 0.32;
  const open = (abs - tapAt - 0.02) / 0.22;
  const z = 1 + 0.08 * easeOut(phase(abs, HIGH_NOTE, HIGH_NOTE + 0.5));
  camera(c, 540, 1000, z);
  drawPhone(c, abs, { cx: 540, cy: 900, s: 1 }, (p) =>
    slide(p, open,
      (q) => herProfile(q, abs, phase(abs, t0 + 0.4, tapAt + 0.1)),
      (q) => wxMomentsBlocked(q, { time: "02:51", name: DAD_CALLS_HER, line: easeOut(phase(abs, HIGH_NOTE, HIGH_NOTE + 0.18)), big: true })),
  { old: true, touches: [tap(abs, tapAt, 300, 595)] });
}

/** 15 · his face over the phone, glasses pushed up, typing with one finger. */
function shot15(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  const dark = (k: Ctx) => {
    boothFront(k, abs, { blur: 7 });
    k.fillStyle = "rgba(6,8,20,0.45)";
    k.fillRect(-60, -60, 1200, 2040);
  };
  dark(c);
  camera(c, 540, 760, 1 + 0.05 * phase(u, 0, 1.5));
  // one finger, four slow taps (多 · 穿 · 点 · send)
  const taps = [0.12, 0.47, 0.72, 0.96];
  const tapK = taps.reduce((m, t) => Math.max(m, 1 - Math.min(1, Math.abs(u - t) / 0.07)), 0);
  const phoneAt: [number, number] = [540 - 10 * 1.42, 600 + 400 * 1.42];
  litFigure(c, (k) => drawDad(k, 540, 600, 1.42, { coat: true, eyes: "down", brows: "worried", mouth: "press", tilt: 0.04, arms: "type", tap: tapK, holding: (q) => phoneBack(q, -10, 400, 150, 270, -0.08, 0) }), {
    shade: 0.3,
    lights: [
      { x: phoneAt[0], y: phoneAt[1] - 160, r: 430, rgb: "160,195,255", a: 0.4 },
      { x: 1040, y: 300, r: 520, rgb: "255,170,90", a: 0.18 },
    ],
    rim: { ux: 1, uy: -0.4, rgb: "255,190,120", a: 0.45 },
  });
  // the screen's light caught in his reading glasses
  for (const side of [-1, 1]) glow(c, 540 + side * 50 * 1.42, 600 + 42 * 1.42, 60, "rgba(190,215,255,0.5)");
}
