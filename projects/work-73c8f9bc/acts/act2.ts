// 第二幕 · 另一部手机（32–67 拍）：同一时刻，一部旧手机（字号最大、贴膜裂了）放大她的笑脸 → 往后拉：岗亭里一个
// 戴帽子的背影，深夜一个人值班，他把手机放到桌上 → 甩镜到桌面：他用手写输入法一个字一个字写「我想你了」，写完就那么
// 看着，没再碰它，屏幕变暗、熄灭，黑屏里映出一张老人的脸 → 点亮：锁屏壁纸是年轻的他抱着小时候的她 → 解锁、点开
// 微信，「囡囡」的朋友圈只有一条横线 → 他慢慢写「多穿点」发出去（手一半藏在手机后面滑动；她收到的是陌生号的「多穿点」）。
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase } from "@frame/engine/math";
import { Ctx, F, camera, castShadow, designScene, easeInOut, easeOut, filtered, flash, glow, litFigure, oval, paint, rr, smearV, text, zoomBlur } from "@materials/s0rrow/code/draw";
import { SW, SH, phoneBack, statusBar } from "@materials/s0rrow/code/phone";
import { WECHAT_AT, appWindow, homeScreen } from "@materials/s0rrow/code/chat";
import { SHOT, WORD, at } from "./timeline";
import { ACC_B, DAD_CALLS_HER, MOMENTS_ROW, WALL_FACE, WALL_S, couplePhoto, dadLock, dadLockText, hwFinger, slide, vidHandwriting, wallpaperPhoto, wxContact, wxMomentsBlocked, type Guide } from "./ui";
import { boothBack, boothFront, boothFrontDesk, deskTop } from "@materials/s0rrow/code/blocked/booth";
import { drawDad } from "@materials/s0rrow/code/blocked/dad";
import { drawPhone, halo, tap, timeCard, whip, type Touch } from "./shots";
import { BOOTH_AT, CRASH_AT, journey } from "./journey";

/** visual.json: act2 starts on beat 32. */
export const ACT2_START = 15.41955;
/** the long flight (journey.ts: out of her window, over the clouds at 10 000 m, down onto another town) lands on his phone */
const ARRIVE_AT = WORD.seeing;
const COMMENT = [
  { name: ACC_B, text: "那个男生配不上你", rose: true, ago: "1分钟前" },
  { name: "阿琪", text: "好甜！！我酸了", ago: "2小时前" },
  { name: "小雅", text: "99", ago: "3小时前" },
];

// 用户 2026-10-14 给这一段定的情绪（镜头语言跟着走）：他看女儿和别的男生的合照，先看一会是心酸；放大女儿是想念；切到
// 岗亭全景是孤独；写完一直不发、直到熄屏是犹豫；看到自己的倒影是沉思；解锁想看她的朋友圈，看到之前是期待；看到被屏蔽是失望。

/** 心酸 → 想念: on the second 「so happy」 two fingers spread the photo open onto her face */
const MISS_AT = 17.55;
const lerpRgb = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(",");
const COOL = [140, 170, 255],
  WARM = [255, 196, 140];
/** how far into 心酸 (holding on the whole photo) and 想念 (opened onto her face) shot 10 is */
const heartache = (abs: number) => easeInOut(phase(abs, ARRIVE_AT, MISS_AT));
const missing = (abs: number) => easeInOut(phase(abs, MISS_AT, MISS_AT + 0.9));
/** the booth behind his phone in shot 10 sinks into the dark as he looks; shot 11 starts from where it ends */
const S10_BG = (abs: number) => 0.55 - 0.05 * heartache(abs) - 0.08 * missing(abs);
/** shot 10's dark round the phone and the screen's light round it (shot 11 starts from them) */
const S10_VIG = (abs: number) => 0.22 * heartache(abs) + 0.3 * missing(abs);
const S10_GLOW = (abs: number): [number, string] => [1 + 0.25 * missing(abs), lerpRgb(COOL, WARM, missing(abs))];
/** Shots 10 and 11 are one camera: in 10 it is right up at his phone, so behind the phone is the bit of the booth
 *  round it, close and out of focus; 11 backs out from exactly there. `e` 0 → 1 is the back-out, `z` the zoom. */
const HELD_AT = { x: 700, y: 1010 },
  HELD_S = 0.3;
function backout(c: Ctx, e: number, z: number) {
  c.translate(540 + (HELD_AT.x - 540) * e, 860 + (HELD_AT.y - 860) * e);
  c.scale(z, z);
  c.translate(-HELD_AT.x, -HELD_AT.y);
}
/** the dark closing in round the phone (shots 10 → 11) */
function phoneVignette(c: Ctx, a: number, cx = 540, cy = 860) {
  if (a <= 0.005) return;
  const v = c.createRadialGradient(cx, cy, 420, cx, cy, 1200);
  v.addColorStop(0, "rgba(4,6,12,0)");
  v.addColorStop(1, `rgba(4,6,12,${a.toFixed(3)})`);
  c.fillStyle = v;
  c.fillRect(-60, -60, 1200, 2040);
}

export function createScene(options: SceneOptions) {
  return designScene(options, ACT2_START, (ctx, abs) => draw(ctx, abs));
}

function draw(c: Ctx, abs: number) {
  const s11 = at(SHOT.s11),
    s12 = at(SHOT.s12),
    s14 = at(SHOT.s14),
    s15 = at(SHOT.s15);
  if (abs < CRASH_AT) {
    // the flight goes on from act1 (journey.ts): over the clouds to his town
    journey(c, abs, () => {});
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

/** the post on his phone: the café photo — first the whole of it, her laughing with that boy, barely moving (心酸);
 *  then pinched open onto her laugh and easing on in (想念). One photo the whole time (user: no panning across to the
 *  boyfriend). */
function hisPost(p: Ctx, abs: number) {
  // the photo opened full screen (no comments: the audience has read them already, and they'd fight the lyrics)
  const linger = easeOut(phase(abs, MISS_AT + 0.62, MISS_AT + 2.4));
  const zoom = (1 + 0.06 * heartache(abs)) * Math.pow(1.9 / 1.06, easeInOut(phase(abs, MISS_AT, MISS_AT + 0.62))) * (1 + 0.06 * linger);
  const [x, y, w, h] = [-180, 0, 960, 1280];
  p.save();
  // zoom about her face, drifting it toward the middle as it grows
  const Fx = x + w * HER_F[0],
    Fy = y + h * HER_F[1];
  const k = Math.min(1, (zoom - 1) / 0.8);
  p.translate(Fx + (300 - Fx) * k, Fy + (560 - Fy) * k);
  p.scale(zoom, zoom);
  p.translate(-Fx, -Fy);
  couplePhoto(false)(p, x, y, w, h);
  p.restore();
  // the viewer's chrome: status bar, page dots
  const g = p.createLinearGradient(0, 0, 0, 180);
  g.addColorStop(0, "rgba(0,0,0,0.45)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  p.fillStyle = g;
  p.fillRect(0, 0, 600, 180);
  statusBar(p, { time: "02:49", airplane: false, battery: 0.3 });
  for (let i = 0; i < 2; i++) {
    p.fillStyle = i === 0 ? "#fff" : "rgba(255,255,255,0.45)";
    p.beginPath();
    p.arc(285 + i * 30, 1230, 7, 0, Math.PI * 2);
    p.fill();
  }
}

/** 10 · the same post on another phone. 心酸: he looks at the whole photo — her laughing with that boy — for a while;
 *  the camera barely moves, the booth sinks into the dark round it. 想念: on the second 「so happy」 two fingers
 *  spread it open onto her face and it keeps easing in; the screen's light turns warm, the dark closes in. */
function shot10(c: Ctx, abs: number) {
  c.save();
  backout(c, 0, 1 / HELD_S);
  filtered(c, `blur(9px) brightness(${S10_BG(abs).toFixed(3)})`, (k) => boothBack(k, abs, { detailed: true, lonely: true }), "s10bg");
  c.restore();
  phoneVignette(c, S10_VIG(abs));
  const [ga, gc] = S10_GLOW(abs);
  halo(c, { cx: 540, cy: 860, s: 1 }, ga, gc);
  const pinch = (t0: number, t1: number) => {
    const k = phase(abs, t0, t1);
    const on = abs > t0 - 0.05 && abs < t1 + 0.05 ? 1 : 0;
    return [
      { x: 300 - 60 - 90 * k, y: 480 - 40 - 60 * k, k: on },
      { x: 300 + 60 + 90 * k, y: 480 + 40 + 60 * k, k: on },
    ];
  };
  drawPhone(c, abs, { cx: 540, cy: 860, s: 1 }, (p) => hisPost(p, abs), { old: true, touches: pinch(MISS_AT, MISS_AT + 0.62) });
}

/** where her face sits in the café photo (0..1) */
const HER_F = [0.36, 0.47];

/** 11 · 孤独 — 「Kissing someone else so happy / Makes me so lonely」: one move back out of his phone screen — a man
 *  in a cap seen from behind, on night duty alone in a tiny guard booth, snow falling on the empty gate outside; the
 *  camera doesn't stop when it gets there but keeps drifting away from him, and the warmth of her photo drains out of
 *  the picture; he looks out at the empty gate and sighs, his head goes down, and the camera whips down to the desk
 *  (shot 12 lands above it, the phone lying there). It starts exactly as shot 10 looks (the booth dark and out of
 *  focus behind the phone; his head slides in from the left as the camera backs out past him), so that cut can't be
 *  seen. */
function shot11(c: Ctx, abs: number, t0: number, end: number) {
  const [dy, sm] = whip(abs, end, -900, 0.14, 0.24);
  smearV(c, (k) => {
    k.translate(0, dy);
    boothAlone(k, abs, t0, end);
  }, sm, "s11w");
}
function boothAlone(c: Ctx, abs: number, t0: number, end: number) {
  const e = easeInOut(phase(abs, t0, t0 + 1.5));
  const drift = easeInOut(phase(abs, t0 + 1.5, end));
  // the phone held up by his face, beside his cap (it stays there: user — laying it down pulled every eye onto the
  // phone and onto the sigh; shot 12 just finds it on the desk)
  const P = HELD_AT;
  const ps = HELD_S;
  // backs out a little past the wide, then keeps on slowly away from him
  const z = Math.pow(1 / ps, 1 - e) * (1 + 0.1 * e - 0.1 * drift);
  // everything carries on from shot 10's last frame: the booth's brightness, the light round the phone, the dark
  const bg0 = S10_BG(t0);
  const [ga0, gc0] = S10_GLOW(t0);
  c.save();
  backout(c, e, z);
  filtered(c, `blur(${(9 * (1 - e)).toFixed(1)}px) brightness(${(bg0 + (1 - bg0) * e - 0.12 * drift).toFixed(3)}) saturate(${(1 - 0.4 * drift).toFixed(3)})`, (k) => boothBack(k, abs, { detailed: true, lonely: true }), "s11bg");
  // its soft shadow on the desk glass below it
  c.save();
  c.globalAlpha = 0.26;
  oval(c, P.x + 8, 1203, 96, 17, 88400, 0.4);
  paint(c, "#091520", null);
  c.restore();
  halo(c, { cx: P.x, cy: P.y, s: ps }, ga0 + (0.55 - ga0) * e, lerpRgb(gc0.split(",").map(Number), [150, 180, 255], e));
  drawPhone(c, abs, { cx: P.x, cy: P.y, s: ps }, (p) => hisPost(p, abs), { old: true });
  // him, from behind, dark against the window with a warm rim from the lamp outside; the camera backs out past him,
  // so his head slides in from the left as it goes (he's the nearest thing to the lens).
  // 孤独 (user: 「动作是否可以优化一下，看起来更孤独」): his head leans in toward her photo; as 「Makes me so lonely」
  // starts his eyes leave it for the empty gate out in the snow and he lets out a long breath — shoulders up, then
  // sinking lower than before — and his head goes down; all of it done well before the whip down to the desk (user:
  // the sigh came too late and got cut off)
  // The sigh (user: 「叹气动作感觉不够好」): a slow breath in — his back and shoulders rise and broaden, his head lifts
  // a little — a moment held at the top, then a longer breath out: the shoulders drop and round, the head goes down
  // with it, and he ends lower than he started; his breath shows as a pale cloud rising over his cap (it's cold in
  // the booth). He stretches and sinks about a point down at his hips, so the shoulders move more than the coat's hem.
  const mk = WORD.makes;
  const lookOut = easeInOut(phase(abs, mk - 0.45, mk - 0.05));
  const lean = easeInOut(phase(abs, t0 + 0.2, t0 + 1.3)) * (1 - lookOut);
  const IN0 = mk - 0.2,
    IN1 = mk + 0.32,
    OUT0 = mk + 0.44,
    OUT1 = mk + 1.0;
  const inhale = easeInOut(phase(abs, IN0, IN1));
  const exhale = easeOut(phase(abs, OUT0, OUT1));
  const chest = inhale * (1 - exhale);
  const sy = 1 + 0.04 * chest - 0.032 * exhale,
    sxs = 1 + 0.018 * chest - 0.008 * exhale;
  const headY = 11 * lean - 8 * lookOut * (1 - exhale) - 7 * chest + 26 * exhale;
  const tilt = 0.1 * lean - 0.02 * lookOut * (1 - exhale) + 0.07 * exhale;
  const hx = 510 - (420 * (1 - e)) / z;
  const HIP = 1880;
  // the breath, in front of his face: we only see it as it rises over his cap
  const puff = phase(abs, OUT0, OUT0 + 0.9);
  if (puff > 0 && puff < 1) {
    // straight up over the top of his cap, against the dark window (clear of the phone)
    const top = HIP - (HIP - (1170 - 168 * 1.12)) * sy + headY;
    for (let i = 0; i < 5; i++) {
      const k = clamp(puff * 1.2 - i * 0.07);
      if (k <= 0) continue;
      const a = 0.5 * Math.sin(Math.PI * Math.min(1, k * 1.15)) * (1 - i * 0.12);
      glow(c, hx - 30 + 30 * k + (i - 2) * 22 * k, top + 30 - 210 * k - i * 14, 34 + 80 * k + i * 8, `rgba(226,233,248,${Math.max(0, a).toFixed(3)})`);
    }
  }
  const dadSighing = (k: Ctx) => {
    k.save();
    k.translate(hx, HIP);
    k.scale(sxs, sy);
    k.translate(-hx, -HIP);
    drawDad(k, hx, 1170, 1.12, { view: "back", coat: true, backDetails: true, headY, tilt });
    k.restore();
  };
  litFigure(c, dadSighing, {
    // in the lonely booth's cold blue, the moon on his cap and shoulders
    shade: 0.55,
    shadeCol: "rgb(16,26,48)",
    lights: [
      { x: P.x, y: P.y, r: 285, rgb: "150,185,255", a: 0.34 },
      // moonlight through the window, from up on the left (the heater's off)
      { x: 300, y: 700, r: 650, rgb: "160,185,240", a: 0.14 },
    ],
    rim: { ux: -0.35, uy: -1, rgb: "190,210,255", a: 0.5, width: 7 },
  });
  c.restore();
  // the dark round her photo opens out as we back away, then closes in again, cold, round the man on his own
  phoneVignette(c, S10_VIG(t0) * (1 - e) + 0.4 * drift, 540, 860 + 40 * e);
}

/** shot 12 before the screen sleeps (audio.json tapBox): he taps 说点什么… under her photo and writes 我想你了 on his
 *  handwriting pad the quick modern way, one character straight over the last (连续叠写: the one underneath fades and
 *  the box has already read it); then he leaves it there, unsent, and just sits and looks at it — he doesn't touch
 *  the phone again; the clock turns 02:50; it dims, and sleeps on 「mirror」. */
const MISS_YOU = "我想你了";
const CANDIDATES = [["我", "找", "伐", "戎", "成"], ["想", "相", "箱", "湘", "象"], ["你", "称", "妳", "尔", "您"], ["了", "子", "孑", "乃", "3"]];
/** where his handwriting keyboard's input row starts: high enough that the pad stays above the lyrics on the desk */
const PAD_TOP = 500;
function writeTimes() {
  const box = at(44.25);
  const s0 = box + 0.2;
  const each = 0.2;
  return {
    box,
    /** when each character's first stroke goes down (the next one starts as soon as one is done) */
    write: [0, 1, 2, 3].map((i) => s0 + i * each),
    /** his finger lifts off the pad */
    end: s0 + 4 * each,
    /** and he sits and looks at it */
    think: s0 + 4 * each + 0.1,
    minute: at(48.5),
    dim: at(50),
  };
}
/** the four characters on the pad: how far each is written and how strong its ink still is (each fades as the next
 *  goes over it; the last fades once his finger lifts) */
function inksAt(abs: number) {
  const t = writeTimes();
  return t.write.map((w0, i) => {
    const w1 = i < 3 ? t.write[i + 1] : t.end;
    const fade = 1 - phase(abs, w1, w1 + (i < 3 ? 0.16 : 0.24));
    return { ch: MISS_YOU[i], k: phase(abs, w0, w1 - 0.02), alpha: abs < w0 ? 0 : abs < w1 ? 1 : fade };
  });
}
/** how many characters the box has read: each one as the next is started over it, the last as the finger lifts */
function recognised(abs: number) {
  const t = writeTimes();
  return t.write.filter((_, i) => abs >= (i < 3 ? t.write[i + 1] : t.end + 0.06)).length;
}
/** the character being written now (index), or -1 */
function writingNow(abs: number) {
  const t = writeTimes();
  return t.write.findIndex((w0, i) => abs >= w0 && abs < (i < 3 ? t.write[i + 1] : t.end));
}
/** his screen on the desk: the photo, the comment box and handwriting pad sliding up over it, what he has written;
 *  then the dim before it sleeps */
function hisDesk(p: Ctx, abs: number) {
  const t = writeTimes();
  const up = easeOut(phase(abs, t.box, t.box + 0.16));
  // the photo rides up with the keyboard, so her whole laugh stays above it
  p.save();
  p.translate(0, -330 * up);
  hisPost(p, abs);
  p.restore();
  // on the cold desk her photo is the one warm thing (user: 让手机里的画面暖一点): an amber cast over the picture,
  // and her laugh glows a little
  const photoBottom = SH - (SH - PAD_TOP) * up;
  p.save();
  p.globalCompositeOperation = "soft-light";
  p.fillStyle = "rgba(255,140,50,0.6)";
  p.fillRect(0, 0, SW, photoBottom);
  p.globalCompositeOperation = "screen";
  glow(p, SW * 0.42, photoBottom * 0.45, 420, "rgba(255,170,95,0.2)");
  p.restore();
  // its light falls a little way down over the pad, so the box with 我想你了 sits in her warmth too
  const spill = (q: Ctx) => {
    if (up <= 0) return;
    const g = q.createLinearGradient(0, photoBottom, 0, photoBottom + 360);
    g.addColorStop(0, `rgba(255,150,80,${(0.16 * up).toFixed(3)})`);
    g.addColorStop(1, "rgba(255,150,80,0)");
    q.save();
    q.globalCompositeOperation = "screen";
    q.fillStyle = g;
    q.fillRect(0, photoBottom, SW, 360);
    q.restore();
  };
  if (up > 0) statusBar(p, { time: abs < t.minute ? "02:49" : "02:50", airplane: false, battery: 0.3 });
  if (up < 1) {
    // the viewer's bottom bar
    p.save();
    p.globalAlpha = 1 - up;
    p.fillStyle = "rgba(20,21,29,0.72)";
    rr(p, 24, 1150, SW - 48, 64, 32);
    p.fill();
    text(p, "说点什么…", 60, 1182, { size: 30, font: F.ui, fill: "#b8b9c2", align: "left" });
    p.restore();
  }
  if (up > 0) {
    p.fillStyle = `rgba(0,0,0,${(0.08 * up).toFixed(3)})`;
    p.fillRect(0, 0, SW, PAD_TOP);
    const now = writingNow(abs);
    const n = recognised(abs);
    p.save();
    p.translate(0, (1 - up) * (SH - PAD_TOP));
    vidHandwriting(p, {
      draft: MISS_YOU.slice(0, n),
      caret: Math.floor(abs * 2) % 2 === 0,
      inks: inksAt(abs),
      cands: now >= 0 ? CANDIDATES[now] : n > 0 && abs < t.think ? CANDIDATES[n - 1] : undefined,
      top: PAD_TOP,
    });
    p.restore();
    spill(p);
  }
  // the 发送 he doesn't press: it warms a little while the camera hangs over it
  const hover = towardSend(abs);
  if (hover > 0.01) glow(p, SEND_AT[0], SEND_AT[1], 120, `rgba(255,70,100,${(0.6 * hover).toFixed(3)})`);
  // nobody touches it: it dims a moment before it sleeps
  const dim = 0.45 * clamp((abs - t.dim) / 0.12);
  if (dim > 0) {
    p.fillStyle = `rgba(0,0,0,${dim.toFixed(3)})`;
    p.fillRect(0, 0, SW, SH);
  }
}
/** where his fingertip is on the desk: the bar, then the strokes of each character */
function deskTouches(abs: number): Touch[] {
  const t = writeTimes();
  const now = writingNow(abs);
  const k = now >= 0 ? inksAt(abs)[now].k : 0;
  const pen = now >= 0 && k > 0 && k < 1 ? hwFinger(k, PAD_TOP) : null;
  return [tap(abs, t.box, 300, 1182), ...(pen ? [{ x: pen[0], y: pen[1], k: 1 }] : [])];
}

/** where the phone sits on screen through the desk shot (the camera moves round it): at rest while he writes; then,
 *  while he sits and thinks, a slow push in on the box with 我想你了 (his face will show right there in the black
 *  glass); held on his reflection and on the wallpaper that comes up in its place */
type Spot = { cx: number; cy: number; s: number; rot: number };
const between = (p: Spot, q: Spot, k: number): Spot => ({
  cx: p.cx + (q.cx - p.cx) * k,
  cy: p.cy + (q.cy - p.cy) * k,
  s: p.s * Math.pow(q.s / p.s, k),
  rot: p.rot + (q.rot - p.rot) * k,
});
/** 犹豫: written, but not sent — the camera drifts over to 发送, stops there, and backs off to the words again; then
 *  the screen sleeps. 沉思: on his reflection it keeps on in, very slowly. (The words and his reflected face sit at the
 *  same spot, so NEAR frames both.) */
const SEND_AT: [number, number] = [535, 560];
const NEAR = (s: number): Spot => ({ cx: 535, cy: 830 + (640 - WALL_FACE[1] * 1280) * s, s, rot: 0.035 });
const SEND_SPOT: Spot = { cx: 575 - (SEND_AT[0] - 300) * 1.8, cy: 820 - (SEND_AT[1] - 640) * 1.8, s: 1.8, rot: 0.045 };
/** how near the camera is to 发送 (0..1) */
function towardSend(abs: number) {
  const t = writeTimes();
  return 0.9 * easeInOut(phase(abs, t.think, t.think + 0.75)) * (1 - easeInOut(phase(abs, t.think + 0.95, WORD.mirror - 0.15)));
}
function deskPhone(abs: number, t0: number): Spot {
  const t = writeTimes();
  const rest: Spot = { cx: 540, cy: 880, s: 0.92 * (1 + 0.05 * easeInOut(phase(abs, t0, t.think))), rot: 0.06 };
  const go = easeInOut(phase(abs, t.think, t.think + 0.75));
  const back = easeInOut(phase(abs, t.think + 0.95, WORD.mirror - 0.15));
  const ponder = easeInOut(phase(abs, WORD.mirror, WORD.all));
  // 怀念 (whole-film camera pass): once the old face has melted into the wallpaper (young him holding little her) the
  // camera doesn't stop dead — it drifts down the photo from his face to hers, the way his eyes would go, and brings
  // her face up clear of the lyrics (at this size it sat right under them); the sudden thought then pulls it back
  const fond = easeInOut(phase(abs, WORD.all + 0.25, pullAt() + 0.15));
  const N = NEAR(1.6 * (1 + 0.09 * ponder) * (1 + 0.03 * fond));
  return between(between(rest, SEND_SPOT, 0.9 * go), { ...N, cy: N.cy - 170 * fond }, back);
}
/** once the wallpaper is up he wants to see her Moments (user: 「表达突然想看看女儿朋友圈了」): on beat 55 the camera
 *  comes back out of the close-in to the phone held up in front of him — quicker than a drift, but not a snap (user:
 *  0.3 s 「速度有点太快了」) — and settles exactly on the cut to 14, where he unlocks it, slowly */
const pullAt = () => at(55);
const pulled = (abs: number) => easeInOut(phase(abs, pullAt(), at(56.5)));
/** how far the camera has closed in on him thinking (0..1), for the dark and the soft focus round the phone */
function thinking(abs: number) {
  const t = writeTimes();
  return easeInOut(phase(abs, t.think, WORD.mirror)) * (1 - pulled(abs));
}

/** 12–13 · the phone on the desk from above, her laugh on it; he only looks, so it dims and on 「mirror」 sleeps — and
 *  where her face was, his shows in the black glass: an old man. He taps it awake and the face melts into the
 *  wallpaper: young him with little her in his arms. He unlocks it to his home screen (14 opens WeChat). It opens on
 *  the end of the whip down from shot 11 (he has just put the phone down): the desk slides up into place out of the
 *  blur. */
function shot12(c: Ctx, abs: number, t0: number, end: number) {
  if (abs >= t0 + 0.24) return deskShot(c, abs, t0, end);
  const [dy, sm] = whip(abs, t0, -900, 0.14, 0.24);
  smearV(c, (k) => {
    k.translate(0, dy);
    deskShot(k, abs, t0, end);
  }, sm, "s12w");
}
function deskShot(c: Ctx, abs: number, t0: number, end: number) {
  const off = WORD.mirror;
  const wake = WORD.all + 0.05;
  const lit = abs < writeTimes().dim ? 1 : abs < off ? 0.55 : abs < wake ? 0 : 1;
  const D = deskPhone(abs, t0);
  const th = thinking(abs);
  // the desk, moved with the phone lying on it; while he thinks it goes soft round the phone
  const desk = (k: Ctx) => {
    k.translate(D.cx, D.cy);
    k.rotate(D.rot - 0.06);
    k.scale(D.s / 0.92, D.s / 0.92);
    k.translate(-540, -880);
    deskTop(k, abs, { detailed: true, lonely: true, phoneLight: lit, phoneResting: true });
  };
  if (th > 0.02) filtered(c, `blur(${(3.5 * th).toFixed(1)}px)`, desk, "s12desk");
  else {
    c.save();
    desk(c);
    c.restore();
  }
  // the snap back into the close-up: the phone comes up off the desk, turns straight and settles where shot 14 holds
  // it, while the desk melts into the dark booth behind
  const e = pulled(abs);
  void end;
  if (e > 0) {
    filtered(c, "blur(9px) brightness(0.75)", (k) => boothFront(k, abs, { detailed: true, lonely: true }), "s12bg", e);
  }
  const P = between(D, { cx: 540, cy: 900, s: 1, rot: 0 }, e);
  if (e > 0) halo(c, P, e, "150,180,255");
  const [fx, fy] = [WALL_FACE[0] * 600, WALL_FACE[1] * 1280];
  drawPhone(c, abs, P, (p) => {
    if (abs < off) {
      hisDesk(p, abs);
      return;
    }
    // the black glass with his reflection
    const mix = clamp((abs - wake) / 0.55);
    if (mix < 1) {
      p.fillStyle = "#040507";
      p.fillRect(0, 0, 600, 1280);
      // drawn whole into its own buffer and faded as one picture, so his overlapping parts don't show through each other
      const ghost = 0.6 * clamp((abs - off) / 0.35) * (1 - mix);
      if (ghost > 0.005)
        filtered(p, "none", (q) => drawDad(q, fx, fy, WALL_S, { coat: true, eyes: "tired", look: [0, 0.2], brows: "worried", mouth: "flat", tilt: 0.03 }), "s12reflection", ghost);
      p.fillStyle = `rgba(4,8,20,${(0.5 * (1 - mix)).toFixed(3)})`;
      p.fillRect(0, 0, 600, 1280);
    }
    if (mix > 0) {
      // the lock screen fades in as one picture too (not shape by shape)
      const lock = (q: Ctx) => dadLock(q, { time: "02:51", date: "1月14日 星期二" });
      if (mix < 1) filtered(p, "none", lock, "s12lock", mix);
      else lock(p);
    }
  }, { old: true, touches: [...deskTouches(abs), tap(abs, wake, 300, 1100)] });
  // while he sits and thinks the world narrows to the box with 我想你了 (where his face will come up in the glass)
  if (th > 0.01) {
    const fy = P.cy - 77 * P.s;
    const v = c.createRadialGradient(P.cx, fy, 260, P.cx, fy + 60, 1150);
    v.addColorStop(0, "rgba(5,8,14,0)");
    v.addColorStop(0.5, `rgba(5,8,14,${(0.3 * th).toFixed(3)})`);
    v.addColorStop(1, `rgba(5,8,14,${(0.72 * th).toFixed(3)})`);
    c.fillStyle = v;
    c.fillRect(-60, -60, 1200, 2040);
  }
}

/** his phone: her WeChat profile — the Moments row shows nothing */
function herProfile(p: Ctx, abs: number, tapK: Guide = 0) {
  wxContact(p, { time: "02:51", name: DAD_CALLS_HER, who: "her", blocked: true, empty: true, big: true, tap: tapK });
  void abs;
}
/** his home screen: the same photo of the two of them under the icons; `press` darkens 微信 under his finger */
function hisHome(p: Ctx, abs: number, press = 0) {
  homeScreen(p, abs, {
    time: "02:51",
    press,
    art: (q) => {
      wallpaperPhoto(q, 0, 0, SW, SH);
      q.fillStyle = "rgba(0,0,0,0.22)";
      q.fillRect(0, 0, SW, SH);
    },
  });
}
/** 29.87 s: the falsetto high note the line lands on */
const HIGH_NOTE = 29.87;

/** 14 · close on his phone, at an old man's pace (user: 「老人操作手机没有这么快」): his thumb pushes the lock screen
 *  up slowly; a moment on the home screen, then he finds 微信 (so we see him go there from the stranger's app) and
 *  her profile flies out of the icon — Moments shows nothing; a moment more, then he taps Moments, the page opens on
 *  her cover, and on the high note a single grey line draws across: she hid her Moments from him.
 *  Sounds (audio.json): swipeUnlock, tapWechat, tap7. */
function shot14(c: Ctx, abs: number, t0: number) {
  // Face ID knows him (the padlock springs open), then his slow thumb swipes up
  const unlock = t0 + 0.04;
  const lockOpen = easeOut(phase(abs, t0 + 0.06, t0 + 0.24));
  const up = easeInOut(phase(abs, unlock + 0.18, unlock + 0.8));
  const wechatAt = at(59);
  const tapAt = HIGH_NOTE - 0.32;
  const open = (abs - tapAt - 0.02) / 0.22;
  const app = easeOut(phase(abs, wechatAt + 0.04, wechatAt + 0.28));
  // 期待: all the way to 朋友圈 the camera leans in, faster and faster, the light warming (that's what he came for)
  const hope = Math.pow(phase(abs, t0, tapAt + 0.25), 2.2);
  // 失望: the line draws on the high note; a beat on it; then the picture sinks and backs away, the warmth gone grey
  const fall = easeInOut(phase(abs, HIGH_NOTE + 0.25, at(SHOT.s15) + 0.05));
  const z = (1 + 0.17 * hope) * (1 - 0.2 * fall);
  filtered(c, `blur(9px) brightness(${(0.72 + 0.16 * hope - 0.36 * fall).toFixed(3)}) saturate(${(1 - 0.6 * fall).toFixed(3)})`, (k) => boothFront(k, abs, { detailed: true, lonely: true }), "s14bg");
  c.save();
  camera(c, 540, 900 + MOMENTS_ROW[1] - 640, z, 0.025 * fall, 0, 120 * fall);
  halo(c, { cx: 540, cy: 900, s: 1 }, 1 + 0.35 * hope - 0.55 * fall, lerpRgb([150, 180, 255], WARM, hope * (1 - fall)));
  drawPhone(c, abs, { cx: 540, cy: 900, s: 1 }, (p) => {
    if (app < 1) {
      const press = phase(abs, wechatAt - 0.06, wechatAt) * (1 - phase(abs, wechatAt + 0.04, wechatAt + 0.12));
      if (up < 1) {
        // the modern unlock: the wallpaper stays, softening a little; the lock layer rides up after his thumb and
        // fades; the home screen comes in from a touch larger, its icons settling into place
        p.save();
        p.filter = `blur(${(6 * Math.sin(Math.PI * Math.min(1, up * 1.3))).toFixed(1)}px)`;
        wallpaperPhoto(p, 0, 0, SW, SH);
        p.filter = "none";
        p.fillStyle = `rgba(0,0,0,${(0.12 + 0.1 * up).toFixed(3)})`;
        p.fillRect(0, 0, SW, SH);
        p.restore();
        const homeIn = easeOut(phase(up, 0.25, 1));
        if (homeIn > 0) {
          p.save();
          p.globalAlpha *= homeIn;
          const hs = 1.12 - 0.12 * homeIn;
          p.translate(SW / 2, SH / 2);
          p.scale(hs, hs);
          p.translate(-SW / 2, -SH / 2);
          hisHome(p, abs, press);
          p.restore();
        }
        dadLockText(p, { time: "02:51", date: "1月14日 星期二", open: lockOpen, lift: up });
      } else hisHome(p, abs, press);
    }
    appWindow(p, app, WECHAT_AT, (q) =>
      slide(q, open,
        (r) => herProfile(r, abs, { a: easeInOut(phase(abs, wechatAt + 0.45, tapAt - 0.1)), gap: 12 - 4 * hope, thump: Math.sin(Math.PI * phase(abs, tapAt - 0.04, tapAt + 0.2)) }),
        (r) => wxMomentsBlocked(r, { time: "02:51", name: DAD_CALLS_HER, line: easeOut(phase(abs, HIGH_NOTE, HIGH_NOTE + 0.18)), big: true })));
  }, {
    old: true,
    touches: [
      // a slow swipe up from the bottom
      { x: 300, y: 1230 - 620 * easeInOut(phase(abs, unlock + 0.16, unlock + 0.74)), k: abs > unlock + 0.12 && abs < unlock + 0.78 ? 1 : 0 },
      tap(abs, wechatAt, WECHAT_AT[0], WECHAT_AT[1]),
      tap(abs, tapAt, ...MOMENTS_ROW),
    ],
  });
  c.restore();
  phoneVignette(c, 0.55 * fall, 540, 1000);
}

/** 15 · his face over the phone, glasses pushed up, slowly writing 「多穿点」 and sending it. The screen faces him, so
 *  his hand is half hidden behind the phone (no finger drawn): it slides over the screen as he writes. */
function shot15(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  // 小心翼翼 (the camera language after 31 s, user: 「按照之前的方案优化一遍」): while he writes, the camera leans in
  // with him, very slowly, toward his eyes; the instant he sends it stops — the screen flares on his face and his
  // brows lift (it's gone) — then it creeps on toward him while he waits; her phone lights up on the cut
  const lean = easeInOut(phase(u, 0, SEND));
  const wait = phase(u, SEND + 0.12, 1.7);
  const flare = u < SEND ? 0 : Math.exp(-(u - SEND) / 0.2);
  const sent = u >= SEND + 0.04;
  // it opens still sunk in shot 14's 失望 (a little back and low, the dark round him), and lifts out of it as he
  // starts to write — he won't give up on her
  const sunk = 1 - easeOut(phase(u, 0, 0.45));
  const z = (1 + 0.085 * lean + 0.035 * wait) * (1 - 0.03 * sunk);
  // the push is about his face; the wall behind moves less (it's further away)
  const cam = (k: Ctx, depth = 1) => camera(k, 540, 620, 1 + (z - 1) * depth, 0, 0, 40 * sunk * depth);
  // the same lonely booth from the other side: cold blue, the moon in the side window; the one warm light in the room
  // is the phone under his chin (she's on it), on his face and hands
  c.save();
  cam(c, 0.45);
  boothFront(c, abs, { detailed: true, blur: 3.5, clock: 2 + 53 / 60, lonely: true });
  c.restore();
  c.save();
  cam(c);
  const phoneAt: [number, number] = [540 - 10 * 1.42, 600 + 400 * 1.42];
  const [hand, press] = handOnScreen(u);
  const dad = (k: Ctx) => drawDad(k, 540, 600, 1.42, { coat: true, frontDetails: true, screenReflection: 0.85, eyes: "down", brows: sent ? "up" : u < WRITE[0][0] ? "sad" : "worried", mouth: sent ? "flat" : "press", tilt: 0.04, arms: "type", typeHand: "half", handAt: hand, tap: press, holding: (q) => phoneBack(q, -10, 400, 150, 270, -0.08, 0, { detailed: true, caseColor: "#252d35", cameraColor: "#343e47" }) });
  // his shadow thrown on the wall by the moon through the window on the right
  castShadow(c, [960, 400], 1.13, dad, "#050a18", 25, 0.26, (k) => { k.beginPath(); k.rect(-60, -60, 745, 2040); k.clip(); });
  litFigure(c, dad, {
    shade: 0.56,
    shadeCol: "rgb(14,22,44)",
    lights: [
      // the screen's warm light from below: strongest under the chin, fading up the face to the cap's brim (it flares
      // as the message goes)
      { x: 535, y: 700, r: 290, rgb: "255,186,122", a: 0.36 + 0.2 * flare },
      { x: phoneAt[0], y: phoneAt[1] - 10, r: 210, rgb: "255,176,112", a: 0.2 + 0.15 * flare },
      // the moon from the side window, faint over his right shoulder
      { x: 940, y: 460, r: 520, rgb: "160,185,240", a: 0.12 },
    ],
    rim: { ux: 1, uy: -0.45, rgb: "190,210,255", a: 0.5, width: 6 },
  });
  filtered(c, "blur(0.7px)", (k) => boothFrontDesk(k, abs, { lonely: true }), "s15desk");
  c.restore();
  phoneVignette(c, 0.45 * sunk, 540, 760);
}
/** shot 15's writing: 多 · 穿 · 点 each start on a touch (the taps in audio.json), then 发送 */
const WRITE: [number, number][] = [[0.12, 0.42], [0.47, 0.68], [0.72, 0.9]];
const SEND = 0.96;
/** his hand on the screen behind the phone at shot time `u` (drawDad's head units) and how hard it presses */
function handOnScreen(u: number): [[number, number], number] {
  // above the lyrics, a bit more than half of it out past the phone's edge
  const REST: [number, number] = [76, 372],
    AT_SEND: [number, number] = [64, 330];
  let x = REST[0],
    y = REST[1];
  // each character: the hand slides about in short strokes, top to bottom
  for (const [a, b] of WRITE) {
    const k = phase(u, a, b);
    if (k <= 0 || k >= 1) continue;
    const env = Math.sin(Math.PI * k);
    const v = u - a;
    x += env * (13 * Math.sin(v * 23) - 5);
    y += env * (15 * Math.sin(v * 17 + 0.6) - 18 + 26 * k);
  }
  // up to 发送, press, and back down to rest
  const go = easeInOut(phase(u, WRITE[2][1], SEND - 0.02)) * (1 - easeInOut(phase(u, SEND + 0.12, SEND + 0.4)));
  x += (AT_SEND[0] - x) * go;
  y += (AT_SEND[1] - y) * go;
  return [[x, y], Math.sin(Math.PI * phase(u, SEND - 0.05, SEND + 0.08))];
}
