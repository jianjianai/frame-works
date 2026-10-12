// 第一幕（作品 0–15.20，第一遍副歌）：凌晨三点他的房间 → 回忆毕业那天。
// 分镜 1–2 一个手机镜头：双击点赞 → 冲向配文、展开（2 秒内）；3 他的脸（惊讶）；4 取消赞 → 松一口气 → 再看配文；
// 4 → 5 老式屏幕竖线转场进回忆；5 教室；6 走廊，黑场。
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase } from "@frame/engine/math";
import { C, Ctx, F, H, Pt, backOut, blob, bloom, bokehDisc, camera, curve, designScene, easeIn, easeInOut, easeOut, figureMask, fillBg, filtered, glow, handheld, hash, inkLine, lerp2, oldFilm, oldScreenCut, onFigure, oval, paint, poly, rimLight, shaded, shake, smear, text, vgrad } from "@materials/s0rrow/code/draw";
import { KidPose, drawKid } from "@materials/s0rrow/code/kid";
import { SH, SW, aimPhone, phone, phoneBack, tapRing, touchDot } from "@materials/s0rrow/code/mirrors/phoneui";
import { classroomAhead, classroomBehind, povDesk, povHandsBehind, povHandsFront } from "./flashback";
import { corridorScene, gradPhoto } from "./photo";
import { drawPerson } from "@materials/s0rrow/code/people";
import { LIKE_AT, PUBLISH_AT, PostView, heartBurst, postScreen, publishScreen, unfoldAt } from "./socials";
import { EV } from "./timeline";
import { ARMS, HIM, PARALLAX, PARALLAX_ZOOM, bedScene, bedPose, roomBokeh, screenLight } from "./present";

/** the phone in shot 1 (design units): below the hook words, the like button clear of the lyrics */
const PH1 = { cx: 540, cy: 1000, s: 1.1 };
/** where the thumb double-taps (screen units): on the photo, just above the boy's head */
const TAP: [number, number] = [300, 470];
/** her caption very close (shot 2, and 4c before the memory): screen point `aim` (the unfolded line) held at design
 *  point `at`, the phone at scale s0, pushing in to s1 */
const CAP = { s0: 2.0, s1: 2.3, at: [540, 860] as Pt, aim: [214, 1136] as Pt };

/** the like button through his three taps (shot 4): liked → unliked → liked again (oops) → unliked */
function likeState(abs: number) {
  const taps = [EV.tapA, EV.tapB, EV.tapC];
  let n = 0;
  for (const t of taps) if (abs >= t) n++;
  const liked = n % 2 === 0; // starts liked
  const last = n > 0 ? taps[n - 1] : -1;
  const k = last >= 0 ? phase(abs, last, last + 0.32) : 1;
  return { liked, pop: liked && n > 0 ? k : 1, shrink: !liked ? k : 1 };
}

/** her post as it looks tonight: liked by the double tap, the caption unfolded and highlighted (shot 2), unliked by
 *  his three taps (shot 4) */
function postAt(abs: number): PostView {
  const on = abs >= EV.tap2;
  const st = likeState(abs);
  return {
    time: "3:07",
    photo: (c, w, h) => gradPhoto(c, w, h),
    author: "小满",
    caption: "毕业了。",
    more: "如果他点赞，我就去表白。",
    expand: phase(abs, EV.tapMore, EV.tapMore + 0.3),
    highlight: easeInOut(phase(abs, EV.hl, EV.hl + 0.42)),
    date: "2023-06-09",
    liked: on && st.liked ? 1 : 0,
    likes: on && st.liked ? 1 : 0,
    likePop: !on ? 1 : abs < EV.tapA ? phase(abs, EV.tap2, EV.tap2 + 0.4) : st.pop,
    likeShrink: st.shrink,
  };
}

/** the same post three years ago, the moment she put it up (「刚刚」): his phone in the memory. He likes it (shot 5)
 *  and takes it back the moment she looks round for him (shot 6). */
function postThen(abs: number): PostView {
  const on = abs >= EV.likeThen2 && abs < EV.unlikeThen;
  return {
    ...postAt(abs),
    time: "17:42",
    date: "刚刚",
    liked: on ? 1 : 0,
    likes: on ? 1 : 0,
    likePop: on ? phase(abs, EV.likeThen2, EV.likeThen2 + 0.4) : 1,
    likeShrink: abs >= EV.unlikeThen ? phase(abs, EV.unlikeThen, EV.unlikeThen + 0.32) : 1,
    expand: 1,
    highlight: 0,
  };
}

/** shot 1's phone scale: a slow creep, and a jolt when the heart pops (oops) */
function likeZoom(abs: number) {
  const since = abs - EV.tap2;
  const jolt = since < 0 ? 0 : backOut(clamp(since / 0.16)) * (1 - clamp((since - 0.25) / 0.5));
  return PH1.s * (1 + 0.02 * phase(abs, 0, EV.rush) + 0.06 * jolt);
}

/** the phone (centre, scale) from the like to the caption: shot 1's framing, then a rush down and in until the
 *  caption's unfolded line sits at CAP.at, then a slow push in */
function phoneAt(abs: number): { c: Pt; s: number } {
  const e = easeInOut(phase(abs, EV.rush, EV.s2));
  if (e <= 0) return { c: [PH1.cx, PH1.cy], s: likeZoom(abs) };
  const sA = likeZoom(EV.rush);
  const sB = CAP.s0 * (1 + 0.06 * easeOut(phase(abs, EV.s2, EV.s3)));
  const s = sA * Math.pow(sB / sA, e);
  // the screen point under CAP.at in shot 1's framing slides to the caption's line
  const from: Pt = [SW / 2 + (CAP.at[0] - PH1.cx) / sA, SH / 2 + (CAP.at[1] - PH1.cy) / sA];
  const [ax, ay] = lerp2(from, CAP.aim, e);
  return { c: aimPhone(ax, ay, CAP.at[0], CAP.at[1], s), s };
}

/** 分镜 1–2（一个镜头）：凌晨三点，她三年前的照片铺满手机；拇指双击，屏幕中间炸开一颗红心，赞「赞」→「1」，镜头一顿（手滑）；
 *  马上冲向下面的配文（用户：看简介的镜头放到两秒之内开始），落地时拇指点「…展开」，第二行「如果他点赞，我就去表白。」展开，
 *  荧光笔划过；然后加速向上甩（接分镜 3 他的脸，切点落在唱 "numb" 上）。 */
function shot12(ctx: Ctx, abs: number) {
  const since = abs - EV.tap2;
  const [hx, hy, hr] = handheld(abs, 4, 7);
  const [sx, sy] = since > 0 ? shake(abs, 9 * Math.max(0, 1 - since / 0.32)) : [0, 0];
  // the whip: the picture drops away faster and faster as the camera tilts up to his face
  const dur = EV.s3 - EV.whip;
  const w = clamp((abs - EV.whip) / dur);
  const drop = 1800 * w * w * w;
  const speed = (3 * 1800 * w * w) / dur;
  const { c: pc, s } = phoneAt(abs);
  // the rush blurs along the caption line's path (how far it moves in a 1/48 s shutter)
  const lineAt = (q: { c: Pt; s: number }): Pt => [q.c[0] + (CAP.aim[0] - SW / 2) * q.s, q.c[1] + (CAP.aim[1] - SH / 2) * q.s];
  const prev = phoneAt(abs - 1 / 48);
  const [rx, ry] = [lineAt({ c: pc, s })[0] - lineAt(prev)[0], lineAt({ c: pc, s })[1] - lineAt(prev)[1]];
  const view = postAt(abs);
  const draw = (c: Ctx) => {
    // the dark of the room fills the frame whatever the camera does
    fillBg(c, vgrad(c, 0, H, [[0, "#0a0f22"], [0.55, "#111834"], [1, "#080b18"]]));
    // its lights are far behind the phone (parallax): they follow every move of the camera, about half as much as
    // the phone does (用户：光晕和手机一起动很奇怪；完全不动也奇怪)
    c.save();
    camera(c, PH1.cx, PH1.cy, 1 + PARALLAX_ZOOM * (s / PH1.s - 1), hr * 0.6, (hx + sx + pc[0] - PH1.cx) * PARALLAX, (hy + sy + pc[1] - PH1.cy) * PARALLAX + drop * 0.85);
    roomBokeh(c, abs);
    c.restore();
    c.save();
    camera(c, 540, 960, 1, hr, hx + sx, hy + sy + drop);
    screenLight(c, pc[0], pc[1], s, 1);
    phone(c, pc[0], pc[1], s, 0, (p) => {
      postScreen(p, view);
      heartBurst(p, TAP[0], TAP[1], phase(abs, EV.tap2, EV.tap2 + 0.95), -0.16);
      for (const tt of [EV.tap1, EV.tap2]) {
        touchDot(p, { x: TAP[0], y: TAP[1], touch: 1 - clamp(Math.abs(abs - tt) / 0.07) });
        tapRing(p, TAP[0], TAP[1], phase(abs, tt, tt + 0.32));
      }
      const [ux, uy] = unfoldAt(p, view.caption);
      touchDot(p, { x: ux, y: uy, touch: 1 - clamp(Math.abs(abs - EV.tapMore) / 0.08) });
      tapRing(p, ux, uy, phase(abs, EV.tapMore, EV.tapMore + 0.32));
    });
    c.restore();
  };
  const len = speed / 48;
  const [bx, by] = Math.hypot(rx, ry) > len ? [rx, ry] : [0, len];
  smear(ctx, draw, bx, by, "rush12", Math.min(28, 9 + Math.round(Math.hypot(bx, by) / 6)));
  bloom(ctx, 0.22, 24);
}

// ================================================================ 分镜 3：他的脸
/** 分镜 3：甩到他的脸。凌晨三点坐在床上，手机举在下巴前，屏幕的冷光从下往上照着瞪大的眼睛；第 7 拍反应过来：头往后一缩、
 *  集中线 +「!!」、冷汗流下来；最后眼睛落回手机，镜头跟着往下甩（接分镜 4 取消赞）。 */
function shot3(ctx: Ctx, abs: number) {
  // whip in: the picture keeps coming down from above (as shot 2 left it), slowing to a stop
  const inDur = EV.s3land - EV.s3;
  const u = clamp((abs - EV.s3) / inDur);
  const fallIn = -1800 * Math.pow(1 - u, 3);
  const speedIn = (3 * 1800 * Math.pow(1 - u, 2)) / inDur;
  // whip out: down to the phone, so the picture goes up, faster and faster
  const outDur = EV.s4 - EV.whip2;
  const w = clamp((abs - EV.whip2) / outDur);
  const riseOut = -1800 * w * w * w;
  const speedOut = (3 * 1800 * w * w) / outDur;
  const hit = abs - EV.s3hit;
  const jolt = hit < 0 ? 0 : backOut(clamp(hit / 0.14)) * (1 - clamp((hit - 0.25) / 0.6));
  const [sx, sy] = hit > 0 ? shake(abs, 10 * Math.max(0, 1 - hit / 0.3), 3) : [0, 0];
  const [hx, hy, hr] = handheld(abs, 5, 13);
  const pose = bedPose({
    eyes: "wide",
    look: [0.05, abs >= EV.whip2 - 0.1 ? 1 : 0.72],
    brows: hit < 0 ? "up" : "worried",
    mouth: hit < 0 ? "o" : "wobble",
    headY: -14 * jolt,
    tilt: -0.03 * jolt,
  });
  const len = Math.max(speedIn, speedOut) / 48;
  smear(
    ctx,
    (c) =>
      bedScene(c, abs, {
        pose,
        zoom: 1 + 0.06 * jolt + 0.06 * easeInOut(phase(abs, EV.s3land, EV.s4)),
        rot: hr,
        dx: hx + sx,
        dy: hy + sy,
        whip: fallIn + riseOut,
        focus: phase(abs, EV.s3hit, EV.s3hit + 0.55),
        sweat: phase(abs, EV.s3sweat, EV.s3sweat + 0.6),
      }),
    0,
    len,
    "whip2",
    Math.min(28, 9 + Math.round(len / 6)),
  );
  // 「!!」 pops beside his head on the hit
  const pop = backOut(phase(abs, EV.s3hit, EV.s3hit + 0.18));
  if (pop > 0 && abs < EV.whip2) {
    ctx.save();
    ctx.translate(880, 560 + fallIn);
    ctx.rotate(0.12);
    ctx.scale(pop, pop);
    text(ctx, "!!", 0, 0, { size: 170, font: F.marker, fill: "#ffe45c", stroke: C.ink, lw: 16 });
    ctx.restore();
  }
  bloom(ctx, 0.25, 26);
}

// ================================================================ 分镜 4：取消赞
/** the like button, very close: the phone so big it fills the frame, the button where the eye can't miss it */
const PH3 = { s: 2.3, at: [690, 800] as Pt };
/** each frantic tap lands a little off the last (screen units) */
const TAPS3: Pt[] = [[528, 696], [542, 684], [532, 692]];

/** 分镜 4：疯狂取消赞。点赞键的大特写，镜头从下面甩上来；慌乱地点了三下：取消 → 手一抖又点上了 → 再取消，「1」→「赞」→「1」→「赞」；
 *  然后切到他（4b）：松一口气，眼睛又慢慢落回手机。 */
function shot4(ctx: Ctx, abs: number) {
  const inDur = EV.s4land - EV.s4;
  const u = clamp((abs - EV.s4) / inDur);
  const rise = 1800 * Math.pow(1 - u, 3);
  const speed = (3 * 1800 * Math.pow(1 - u, 2)) / inDur;
  const [hx, hy, hr] = handheld(abs, 8, 17);
  // a small jolt on every tap
  let jolt = 0;
  for (const t of [EV.tapA, EV.tapB, EV.tapC]) if (abs >= t) jolt = Math.max(jolt, Math.sin(Math.PI * clamp((abs - t) / 0.14)) * (abs - t < 0.14 ? 1 : 0));
  // after the last tap the camera eases in on the white heart and its 「赞」: phew
  const calm = easeInOut(phase(abs, EV.tapC + 0.05, EV.s4face));
  const zoom = 1 + 0.025 * jolt + 0.08 * calm;
  const [ax, ay] = PH3.at;
  const view = postAt(abs);
  const draw = (c: Ctx) => {
    fillBg(c, vgrad(c, 0, H, [[0, "#0a0f22"], [0.55, "#111834"], [1, "#080b18"]]));
    c.save();
    camera(c, ax, ay, 1 + PARALLAX_ZOOM * (zoom - 1), hr * 0.6, hx * PARALLAX, hy * PARALLAX + rise * 0.85);
    roomBokeh(c, abs);
    c.restore();
    c.save();
    camera(c, ax, ay, zoom, hr, hx, hy + rise);
    const [pcx, pcy] = aimPhone(LIKE_AT[0], LIKE_AT[1], ax, ay, PH3.s);
    screenLight(c, pcx, pcy, PH3.s, 1);
    phone(c, pcx, pcy, PH3.s, 0, (p) => {
      postScreen(p, view);
      [EV.tapA, EV.tapB, EV.tapC].forEach((t, i) => {
        const [x, y] = TAPS3[i];
        touchDot(p, { x, y, touch: 1 - clamp(Math.abs(abs - t) / 0.07) });
        tapRing(p, x, y, phase(abs, t, t + 0.3));
      });
    });
    c.restore();
  };
  const len = speed / 48;
  smear(ctx, draw, 0, len, "whip3", Math.min(28, 9 + Math.round(len / 6)));
  bloom(ctx, 0.2, 24);
}

/** 分镜 4b：他松了一口气（闭眼、呼出一口气、头往后靠），然后眼睛又慢慢落回手机、眉头皱起来——好像想起了什么（切 4c 配文）。 */
function shot4face(ctx: Ctx, abs: number) {
  const [hx, hy, hr] = handheld(abs, 4, 19);
  const relief = phase(abs, EV.s4face, EV.s4face + 0.25);
  const dread = phase(abs, EV.s4dread, EV.s4dread + 0.35);
  const sink = easeInOut(relief) * (1 - easeInOut(dread));
  const pose = bedPose({
    eyes: abs < EV.s4dread ? "shut" : "tired",
    look: [0, 0.4 + 0.5 * easeInOut(dread)],
    brows: abs < EV.s4dread ? "flat" : "worried",
    mouth: abs < EV.s4dread ? "blow" : "flat",
    headY: -10 * sink,
    tilt: 0.06 * sink,
  });
  bedScene(ctx, abs, {
    pose,
    // closer than shot 3 (only his face and the phone's glow), a slow push in, a little faster once the worry comes back
    zoom: 1.32 + 0.06 * easeInOut(phase(abs, EV.s4face, EV.s4cap)) + 0.05 * easeInOut(dread),
    cx: 540,
    cy: 600,
    rot: hr,
    dx: hx,
    dy: hy,
    whip: 0,
    breath: phase(abs, EV.s4face + 0.05, EV.s4face + 0.85),
  });
  bloom(ctx, 0.25, 26);
}

/** 4c: the phone on her caption again (unliked now, the line still highlighted), the camera pushing in to the memory */
function captionFrame(c: Ctx, abs: number) {
  const [hx, hy, hr] = handheld(abs, 3, 23);
  const push = easeInOut(phase(abs, EV.s4cap, EV.cut5a + 0.2));
  const s = CAP.s0 + (CAP.s1 - CAP.s0) * push;
  const [ax, ay] = CAP.at;
  const [pcx, pcy] = aimPhone(CAP.aim[0], CAP.aim[1], ax, ay, s);
  fillBg(c, vgrad(c, 0, H, [[0, "#0a0f22"], [0.55, "#111834"], [1, "#080b18"]]));
  c.save();
  camera(c, ax, ay, 1 + PARALLAX_ZOOM * (s / CAP.s0 - 1), hr * 0.6, hx * PARALLAX, hy * PARALLAX);
  roomBokeh(c, abs);
  c.restore();
  c.save();
  camera(c, ax, ay, 1, hr, hx, hy);
  screenLight(c, pcx, pcy, s, 1);
  phone(c, pcx, pcy, s, 0, (p) => postScreen(p, postAt(abs)));
  c.restore();
}

/** 分镜 4c：再看一眼配文。硬切回配文的大特写，荧光笔还在「如果他点赞，我就去表白。」下面，镜头慢慢推近（唱 "need your heart"）。 */
function shot4cap(ctx: Ctx, abs: number) {
  captionFrame(ctx, abs);
  bloom(ctx, 0.2, 24);
}

/** 4c → 5：老式屏幕竖线转场（不配音效），竖线下面匹配剪辑：同一条动态、同一个位置和大小，换成三年前她刚发出来的那一刻（「刚刚」）。 */
function cut45(ctx: Ctx, abs: number) {
  const p = phase(abs, EV.cut5a, EV.cut5b);
  oldScreenCut(ctx, abs, p, (c) => {
    captionFrame(c, abs);
    bloom(c, 0.2, 24);
  }, (c) => pov5(c, abs));
}

// ================================================================ 分镜 5：回忆 · 毕业那天
/** where the phone ends up in his own view (design units, phone scale) */
const POV = { c: [540, 860] as Pt, s: 0.48 };

/** 分镜 5a：一镜到底从三年前的同一条动态往后拉：他的眼睛看出去——毕业那天傍晚的教室，黑板上「毕业快乐」，走廊那边的窗户里是夕阳；
 *  他把手机藏在课桌下面，两只手捧着，左手腕上的红绳是新的、鲜红的。拉完手机跟着心跳轻轻发抖。 */
function pov5(c: Ctx, abs: number) {
  const e = easeInOut(phase(abs, EV.cut5b, EV.s5pull));
  // the phone shrinks from the caption close-up (4c's framing) to his hands; the world comes with it
  const s = CAP.s1 * Math.pow(POV.s / CAP.s1, e);
  const anchor = lerp2(CAP.aim, [300, 640], e);
  const target = lerp2(CAP.at, POV.c, e);
  const [cx, cy] = aimPhone(anchor[0], anchor[1], target[0], target[1], s);
  const [tx, ty] = shake(abs, 2.2 * phase(abs, EV.s5pull - 0.25, EV.s5b), 9);
  const k = s / POV.s;
  const phoneSpace = (q: Ctx, f: (q: Ctx) => void) => {
    q.save();
    q.translate(POV.c[0], POV.c[1]);
    q.scale(POV.s, POV.s);
    q.translate(-SW / 2, -SH / 2);
    f(q);
    q.restore();
  };
  c.save();
  c.translate(cx + tx, cy + ty);
  c.scale(k, k);
  c.translate(-POV.c[0], -POV.c[1]);
  classroomAhead(c, abs);
  povDesk(c);
  phoneSpace(c, povHandsBehind);
  phone(c, POV.c[0], POV.c[1], POV.s, 0, (p) => {
    postScreen(p, postThen(abs));
    // he knows the boy at the window is him (the same red string): he double-taps it, on his heartbeat
    heartBurst(p, TAP[0], TAP[1], phase(abs, EV.likeThen2, EV.likeThen2 + 0.95), 0.12);
    for (const tt of [EV.likeThen1, EV.likeThen2]) {
      touchDot(p, { x: TAP[0], y: TAP[1], touch: 1 - clamp(Math.abs(abs - tt) / 0.07) });
      tapRing(p, TAP[0], TAP[1], phase(abs, tt, tt + 0.32));
    }
  });
  phoneSpace(c, povHandsFront);
  c.restore();
}

/** a small hand-drawn heart popping out beside him on a heartbeat (k 0..1 over its life) */
export function beatHeart(ctx: Ctx, x: number, y: number, k: number, rot: number, seed: number) {
  if (k <= 0 || k >= 1) return;
  const sc = backOut(clamp(k / 0.3)) * (1 + 0.2 * k);
  ctx.save();
  ctx.translate(x, y - 40 * k);
  ctx.rotate(rot);
  ctx.scale(sc, sc);
  ctx.globalAlpha *= 1 - clamp((k - 0.5) / 0.5);
  blob(ctx, [[0, 30], [-24, 8], [-36, -10], [-28, -28], [-12, -32], [0, -20], [12, -32], [28, -28], [36, -10], [24, 8]], seed, 0.8);
  paint(ctx, "#ff6f91", C.ink, 5);
  ctx.restore();
}

/** him at his desk three years ago (5b), lit by the sunset from the corridor windows on the right */
const HIM5 = { x: 540, y: 700, s: 1.8 };
/** the desk in front of him, cut at his chest: the top in perspective with the yearbook and his pencil case, the
 *  sunset warm across its right half; the front panel runs out of the frame */
function deskFront(ctx: Ctx) {
  shaded(ctx, () => poly(ctx, [[-120, 1250], [1200, 1240], [1290, 1640], [-210, 1650]], 6800, 1.2), "#c99d68", () => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(400, 0, 1200, 0);
    g.addColorStop(0, "rgba(255,160,90,0)");
    g.addColorStop(1, "rgba(255,160,90,0.4)");
    ctx.fillStyle = g;
    ctx.fillRect(-200, 1230, 1500, 440);
    ctx.restore();
    for (let i = 0; i < 6; i++) inkLine(ctx, [[-140, 1290 + i * 58], [1200, 1280 + i * 62]], 6801 + i, 1.6, "rgba(120,80,40,0.35)");
  }, C.ink, 6);
  poly(ctx, [[-210, 1648], [1290, 1638], [1290, 2000], [-210, 2000]], 6806, 1);
  paint(ctx, "#8e6a42", C.ink, 6);
  // the yearbook (closer, so bigger) and a pencil case
  shaded(ctx, () => poly(ctx, [[110, 1300], [470, 1290], [510, 1480], [70, 1494]], 6807, 0.8), "#3f6fa8", () => {
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fillRect(60, 1286, 470, 46);
  }, C.ink, 5);
  text(ctx, "毕业纪念册", 290, 1392, { size: 50, font: F.cn, fill: "#f6efe0" });
  shaded(ctx, () => blob(ctx, [[690, 1330], [930, 1316], [950, 1396], [700, 1412]], 6808, 1), "#f0b8c8", () => {
    inkLine(ctx, [[700, 1362], [944, 1350]], 6809, 3, "#d98ca0");
  }, C.ink, 5);
}

/** 分镜 5b：切到三年前的他（短发、校服）：脸红红的盯着桌下的手机，心跳两下（两颗小心心冒出来），咬了一下嘴唇；第 20.5 拍抬眼往右边的
 *  走廊看；5c：镜头顺着他的视线往右甩（接分镜 6 走廊）。 */
function shot5face(ctx: Ctx, abs: number) {
  const [hx, hy, hr] = handheld(abs, 4, 29);
  const hb = [EV.hb1, EV.hb2].reduce((m, t) => Math.max(m, abs >= t ? Math.exp(-(abs - t) * 12) : 0), 0);
  const look = easeOut(phase(abs, EV.s5look, EV.s5look + 0.2));
  const zoom = 1 + 0.05 * easeInOut(phase(abs, EV.s5b, EV.whip5)) + 0.014 * hb;
  const outDur = EV.s6 - EV.whip5;
  const w = clamp((abs - EV.whip5) / outDur);
  const pan = -1900 * w * w * w;
  const speed = (3 * 1900 * w * w) / outDur;
  const pose: KidPose = {
    body: "bust",
    hair: "short",
    outfit: "uniform",
    bracelet: "red",
    arms: "down",
    shapeL: "hidden",
    shapeR: "hidden",
    eyes: "open",
    look: look > 0 ? [0.08 + 0.8 * look, 0.78 - 1.1 * look] : [0.08, 0.78],
    brows: look > 0.4 ? "up" : "flat",
    mouth: abs >= EV.s5look ? "flat" : abs >= EV.bite ? "bite" : "smile",
    blush: 0.62,
    headX: 10 * look,
    headY: 12 - 20 * look,
    tilt: 0.05 * look,
    seed: 31,
  };
  const draw = (c: Ctx) => {
    fillBg(c, vgrad(c, 0, H, [[0, "#e8dcc0"], [1, "#cdbb98"]]));
    c.save();
    camera(c, 540, 760, 1 + PARALLAX_ZOOM * (zoom - 1), hr * 0.6, hx * PARALLAX + pan * 0.85, hy * PARALLAX);
    classroomBehind(c, abs);
    c.restore();
    c.save();
    camera(c, 540, 760, zoom, hr, hx + pan, hy);
    const him = (q: Ctx) => drawKid(q, HIM5.x, HIM5.y, HIM5.s, pose);
    him(c);
    const m = figureMask(c, him, "him5");
    // the side away from the window falls into a cool shade; the sunset lights him warm from the right
    onFigure(c, m, (q) => {
      const g = q.createLinearGradient(160, 0, 940, 0);
      g.addColorStop(0, "rgba(70,60,120,0.32)");
      g.addColorStop(0.6, "rgba(70,60,120,0.06)");
      g.addColorStop(1, "rgba(70,60,120,0)");
      q.fillStyle = g;
      q.fillRect(0, 0, 1080, 1920);
    });
    onFigure(c, m, (q) => {
      const g = q.createRadialGradient(1060, 560, 60, 1060, 560, 820);
      g.addColorStop(0, "rgba(255,190,120,0.75)");
      g.addColorStop(1, "rgba(255,190,120,0)");
      q.fillStyle = g;
      q.fillRect(0, 0, 1080, 1920);
    }, "screen", 0.7);
    rimLight(c, m, 1, -0.25, 7, "rgb(255,196,130)", 0.85, "lighter", 6);
    deskFront(c);
    beatHeart(c, 880, 470, phase(abs, EV.hb1, EV.hb1 + 0.7), 0.25, 6820);
    beatHeart(c, 950, 570, phase(abs, EV.hb2, EV.hb2 + 0.7), -0.15, 6830);
    c.restore();
  };
  const len = speed / 48;
  smear(ctx, draw, len, 0, "whip5", Math.min(28, 9 + Math.round(len / 6)));
}

// ================================================================ 分镜 6：回忆 · 走廊
/** the corridor world (her photo's units) in the frame: scaled to the frame's height, like the photo itself */
export const COR = { s: 2.4, x: -180 };
/** the basketball player stands where the boy in her photo stood (his head on the boy's head); she is beside him */
export const GUY_AT = { x: 338, y: 398, s: 0.53 };
export const GIRL_AT = { x: 206, y: 440, s: 0.4 };

/** a basketball (people head units) */
function basketball(c: Ctx, x: number, y: number, r: number) {
  oval(c, x, y, r, r, 9101, 1);
  paint(c, "#e8823a", C.ink, 5);
  c.save();
  oval(c, x, y, r, r, 9101, 1);
  c.clip();
  c.strokeStyle = "#5a2a14";
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(x - r, y);
  c.lineTo(x + r, y);
  c.moveTo(x, y - r);
  c.lineTo(x, y + r);
  c.stroke();
  c.beginPath();
  c.arc(x - r * 1.25, y, r * 0.9, -0.9, 0.9);
  c.arc(x + r * 1.25, y, r * 0.9, Math.PI - 0.9, Math.PI + 0.9);
  c.stroke();
  c.restore();
}

/** her phone in her hands (her head units): at her chest while she waits, held out to him when she shows it */
function herPhone(show: number): { L: Pt; R: Pt; c: Pt; rot: number } {
  return {
    L: lerp2([-58, 330], [52, 262], show),
    R: lerp2([58, 330], [156, 248], show),
    c: lerp2([0, 282], [104, 200], show),
    rot: -0.18 * show,
  };
}

/** when things happen in the corridor moment (his shot 6, and her memory of it in shot 11): her phone pings with his
 *  like, she squeals, shows her friend, he pats her head, she turns to look for him; `fade` (her memory only) her
 *  face falls when she sees the like has gone */
export interface CorridorBeat {
  ping: number;
  squeal: number;
  show: number;
  pat: number;
  glance: number;
  /** how long she keeps looking round (s) */
  glanceFor?: number;
  fade?: number;
}

/** the two of them leaning back on the sill. Her phone pings (his like): she squeals, shows the basketball player, who
 *  leans in laughing and pats her head — from the classroom it looks like the two of them laughing at him. At
 *  `glance` she turns round to look for him at the classroom door, then back to her phone. */
export function corridorPeople(abs: number, T: CorridorBeat) {
  const look = T.glanceFor ?? 0.5;
  const g = clamp(Math.min((abs - T.glance) / 0.12, (T.glance + look - abs) / 0.15));
  const pinged = abs >= T.ping;
  const happy = abs >= T.squeal && !(T.fade !== undefined && abs >= T.fade);
  const fallen = T.fade !== undefined && abs >= T.fade;
  const squeal = phase(abs, T.squeal, T.squeal + 0.3);
  const hop = 16 * Math.sin(Math.PI * squeal);
  const show = easeInOut(phase(abs, T.show, T.show + 0.22)) * (1 - easeInOut(phase(abs, T.glance - 0.1, T.glance + 0.1)));
  const pat = phase(abs, T.pat, T.pat + 0.62);
  const laugh = happy ? Math.sin(abs * 13) * 3 : 0;
  const ph = herPhone(show);
  return (c: Ctx) => {
    // the basketball player: points at her screen, laughing, then pats her head; the ball on his other hip
    const pointing = abs >= T.show && abs < T.glance;
    const patting = pat > 0 && pat < 1;
    const handL: Pt | undefined = patting ? [-186, -12 + 10 * Math.sin(pat * Math.PI * 4)] : pointing ? [-150, 214] : undefined;
    drawPerson(c, GUY_AT.x, GUY_AT.y, GUY_AT.s, {
      hair: "short",
      hairColor: "#1b1716",
      uniform: true,
      bottom: "#2b3550",
      shoes: "#f2f2f2",
      x: 0,
      face: abs >= T.show ? "laugh" : "smile",
      turn: -0.35 - 0.25 * show,
      tilt: 0.04 + 0.06 * show,
      handR: [150, 236],
      shapeR: "hold",
      // patting: the elbow up and out to his side, so the hand comes down onto her head from the right
      ...(handL ? { handL, shapeL: patting ? ("flat" as const) : ("open" as const), bendL: patting ? -1 : 1 } : {}),
      body: "full",
      seed: 921,
      holding: (q) => basketball(q, 176, 214, 66),
    });
    drawKid(c, GIRL_AT.x, GIRL_AT.y + laugh * (1 - g) - hop, GIRL_AT.s, {
      who: "girl",
      outfit: "uniform",
      body: "full",
      eyes: g > 0.5 ? "open" : fallen ? "sad" : happy ? "happy" : pinged ? "wide" : "open",
      look: g > 0.5 ? [0, 0.05] : show > 0.5 ? [0.6, 0.2] : [0, 0.75],
      mouth: g > 0.5 ? "smile" : fallen ? "flat" : happy ? (squeal < 1 ? "open" : "laugh") : pinged ? "o" : "flat",
      turn: 0.45 * show,
      tilt: -0.06 * show + 0.05 * (patting ? 1 : 0),
      blush: happy ? 0.8 : 0.45,
      arms: "custom",
      handL: ph.L,
      handR: ph.R,
      shapeL: "hold",
      shapeR: "hold",
      // elbows down at her sides (the preset's elbows-out reads as wings on a small full figure)
      bendL: 1,
      bendR: -1,
      grip: (q) => phoneBack(q, ph.c[0], ph.c[1], 96, 182, ph.rot, true),
      seed: 41,
    });
    // two little hearts pop over her head when she squeals
    for (const [i, dx] of [[0, -40], [1, 46]] as const) {
      const k = phase(abs, T.squeal + i * 0.14, T.squeal + i * 0.14 + 0.8);
      if (k <= 0 || k >= 1) continue;
      c.save();
      c.translate(GIRL_AT.x + dx, GIRL_AT.y - 78 - hop);
      c.scale(0.42, 0.42);
      beatHeart(c, 0, 0, k, i ? 0.3 : -0.25, 9140 + i);
      c.restore();
    }
  };
}

/** 分镜 6：回忆 · 走廊。顺着他的视线甩到走廊：她拍照的那扇窗前，她和篮球队的男生靠着窗台；她的手机响了，她叫了一声，拿给男生看，
 *  两人笑成一团、男生揉她的头——在他看来是在笑他。他低头看手机，走廊虚掉——就在这时她回头往教室门口看了一眼（他没看到），
 *  他取消了赞，退出，打下「算了。」发布，把手机扣进课桌肚里，黑场。 */
function shot6(ctx: Ctx, abs: number) {
  const inDur = EV.s6land - EV.s6;
  const u = clamp((abs - EV.s6) / inDur);
  const panIn = 1900 * Math.pow(1 - u, 3);
  const speedIn = (3 * 1900 * Math.pow(1 - u, 2)) / inDur;
  const [hx, hy, hr] = handheld(abs, 4, 37);
  const tilt = easeInOut(phase(abs, EV.s6down, EV.s6down + 0.32));
  const sink = phase(abs, EV.s6drawer, EV.s6black);
  // closer on the two of them than the photo's framing, creeping in
  const push = 1.24 + 0.06 * easeInOut(phase(abs, EV.s6land, EV.s6down));
  const blur = 4 * tilt;
  const people = corridorPeople(abs, { ping: EV.herPing, squeal: EV.herSqueal, show: EV.herShow, pat: EV.guyPat, glance: EV.s6glance });
  const draw = (c: Ctx) => {
    fillBg(c, "#20182a");
    const corridor = (q: Ctx) => {
      q.save();
      camera(q, 470, 1060, push, hr, hx + panIn, hy - 760 * tilt - 300 * easeOut(sink));
      q.translate(COR.x, 0);
      q.scale(COR.s, COR.s);
      corridorScene(q, people);
      // backlit by the sunset: they sit in their own shade, a warm rim all round
      const m = figureMask(q, people, "corPeople");
      onFigure(q, m, (k) => {
        k.fillStyle = vgrad(k, 300, 760, [[0, "rgba(60,36,80,0.22)"], [1, "rgba(50,30,70,0.42)"]]);
        k.fillRect(-100, 200, 900, 700);
      });
      rimLight(q, m, -0.6, -1, 5, "rgb(255,198,132)", 0.85, "lighter", 6);
      q.restore();
    };
    if (blur > 0.2) filtered(c, `blur(${blur.toFixed(2)}px)`, corridor, "corBlur");
    else corridor(c);
    // his phone rising into view as his eyes drop (b), into the desk (d)
    if (tilt > 0.001) {
      const s = 0.75 - 0.33 * easeIn(sink);
      const py = 2500 - 1450 * tilt - 520 * easeInOut(sink);
      const phoneSpace = (q: Ctx, f: (q: Ctx) => void) => {
        q.save();
        q.translate(540, py);
        q.rotate(-0.25 * easeIn(sink));
        q.scale(s, s);
        q.translate(-SW / 2, -SH / 2);
        f(q);
        q.restore();
      };
      // the desk's front edge and the dark of its compartment come down over the top as he pushes the phone in
      phoneSpace(c, povHandsBehind);
      c.save();
      c.translate(540, py);
      c.rotate(-0.25 * easeIn(sink));
      phone(c, 0, 0, s, 0, (p) => phone6(p, abs));
      c.restore();
      phoneSpace(c, povHandsFront);
      if (sink > 0) {
        const dy = -600 + 1150 * easeInOut(sink);
        c.save();
        c.fillStyle = "#0b0a10";
        c.fillRect(-60, dy - 1400, 1200, 1400 + 120 * sink);
        shaded(c, () => poly(c, [[-80, dy - 80], [1160, dy - 90], [1200, dy + 30], [-120, dy + 40]], 9120, 1.2), "#c99d68", null, C.ink, 6);
        c.restore();
        // into the dark
        c.fillStyle = `rgba(4,3,8,${easeIn(phase(abs, EV.s6drawer + 0.25, EV.s6black)).toFixed(3)})`;
        c.fillRect(-60, -60, 1200, 2040);
      }
    }
  };
  const len = speedIn / 48;
  smear(ctx, draw, len, 0, "whip6", Math.min(28, 9 + Math.round(len / 6)));
}

/** what his phone shows in shot 6: her post (liked) → he takes the like back → back → his text post 「算了。」 → 发布 →
 *  发布成功 */
function phone6(p: Ctx, abs: number) {
  const out = easeInOut(phase(abs, EV.s6back + 0.05, EV.s6back + 0.3));
  const typed = ["", "算", "算了", "算了。"][[EV.s6type, EV.s6type + 0.12, EV.s6type + 0.24].filter((t) => abs >= t).length];
  if (out < 1) {
    p.save();
    p.translate(SW * out, 0);
    postScreen(p, postThen(abs));
    p.restore();
  }
  if (out > 0) {
    p.save();
    p.translate(-SW * 0.3 * (1 - out), 0);
    publishScreen(p, {
      time: "17:43",
      text: typed,
      caret: abs < EV.s6post && Math.floor(abs * 4) % 2 === 0,
      press: abs >= EV.s6post && abs < EV.s6post + 0.15 ? 1 : 0,
      toast: phase(abs, EV.s6post + 0.06, EV.s6drawer + 0.1),
    });
    if (out < 1) {
      p.fillStyle = `rgba(0,0,0,${(0.4 * (1 - out)).toFixed(3)})`;
      p.fillRect(0, 0, SW, SH);
    }
    p.restore();
  }
  touchDot(p, { x: LIKE_AT[0], y: LIKE_AT[1], touch: 1 - clamp(Math.abs(abs - EV.unlikeThen) / 0.07) });
  tapRing(p, LIKE_AT[0], LIKE_AT[1], phase(abs, EV.unlikeThen, EV.unlikeThen + 0.3));
  touchDot(p, { x: 40, y: 122, touch: 1 - clamp(Math.abs(abs - EV.s6back) / 0.07) });
  tapRing(p, 40, 122, phase(abs, EV.s6back, EV.s6back + 0.3));
  touchDot(p, { x: PUBLISH_AT[0], y: PUBLISH_AT[1], touch: 1 - clamp(Math.abs(abs - EV.s6post) / 0.07) });
  tapRing(p, PUBLISH_AT[0], PUBLISH_AT[1], phase(abs, EV.s6post, EV.s6post + 0.3));
}

export function createScene(options: SceneOptions) {
  return designScene(options, 0, (ctx, abs) => {
    // an opaque base: motion blur averages up to 28 faint copies and their alpha rounds down a little, which let the
    // storyboard layer below show through the dark parts
    fillBg(ctx, "#0b1024");
    if (abs < EV.s3) shot12(ctx, abs);
    else if (abs < EV.s4) shot3(ctx, abs);
    else if (abs < EV.s4face) shot4(ctx, abs);
    else if (abs < EV.s4cap) shot4face(ctx, abs);
    else if (abs < EV.cut5a) shot4cap(ctx, abs);
    else if (abs < EV.cut5b) cut45(ctx, abs);
    else if (abs < EV.s5b) oldFilm(ctx, abs, (c) => pov5(c, abs));
    else if (abs < EV.s6) oldFilm(ctx, abs, (c) => shot5face(c, abs));
    else if (abs < EV.s6black) oldFilm(ctx, abs, (c) => shot6(c, abs));
    else {
      // black through the stop in the music, until the present comes back (act 2)
      fillBg(ctx, "#040308");
    }
  });
}
