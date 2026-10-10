import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase, smooth } from "@frame/engine/math";
import { C, Ctx, F, H, Pt, W, backOut, beatAt, blob, bloom, bokehDisc, camera, card, designScene, devScale, easeIn, easeInOut, easeOut, figureMask, filtered, flash, glow, groundShadow, handheld, hash, inkLine, motes, onFigure, oval, paint, rbox, rimLight, shaded, text } from "@materials/s0rrow/code/draw";
import { KidPose, drawKid } from "@materials/s0rrow/code/kid";
import { ROOF, backpack, roofLight, roofReverse, rooftop } from "@materials/s0rrow/code/mirrors/roof";
import { Disguise, disguise } from "@materials/s0rrow/code/mirrors/story";
import { BOOK_H, BOOK_W, SKETCH_W, TOP_HIDE, bookHands, heldBook, holdPose, holdTop } from "@materials/s0rrow/code/mirrors/sketchbook";
import { EV } from "./timeline";

/** 第三幕（24.417 – 32.544，C 段 "I know what you want from me … wedding ring"）
 *  24.417 「第二天 放学后」天台，黄昏逆光：她背对着我们站在栏杆边看夕阳；他全副武装（帽子、口罩、墨镜）从楼梯门走出来。
 *         「I know what you want」镜头一路推到她脚边书包上的挂件——一只白猫（她的头像）。
 *  26.449 「really」她转过身来：向日葵发卡、雀斑——是教室后排那个画画的女生（第 5 秒）。逆光金边。
 *  27.465 他的脸：墨镜滑到鼻尖，瞪大眼睛「!!」。
 *  28.481 「I know why you talk to me」他转身就往门口跑，她伸手。
 *  30.513 「黑猫！」——他一只脚还悬在半空，定格。
 *  31.529 越过他的肩膀：她双手举起一本速写本（封面贴着白猫，角上一片小红叶子）。32.544 打开它（第四幕）。 */

const FULL: Disguise = { cap: 1, mask: 1, shades: 1 };
const GIRL: KidPose = { who: "girl", outfit: "cardigan" };
/** her at the railing in the wide shot (head centre), and her scale */
const HER_AT: Pt = [700, 760];
const HER_S = 0.5;
const SLIP = beatAt(54.5);

const swingAt = (abs: number) => 0.32 * Math.sin(abs * 3.4) + 0.08 * Math.sin(abs * 7.1);

/** backlit by the low sun: a figure's near side in soft shade, a gold rim round its far edges */
function backlit(ctx: Ctx, draw: (c: Ctx) => void, key: string, rim = 0.7, shade = 0.26) {
  const m = figureMask(ctx, draw, key);
  onFigure(ctx, m, (c) => {
    c.fillStyle = `rgba(70,36,56,${shade})`;
    c.fillRect(-500, -500, W + 1000, H + 1000);
  });
  rimLight(ctx, m, 0.5, -1, 6, "rgb(255,216,150)", rim, "lighter", 6);
  rimLight(ctx, m, 1, -0.1, 5, "rgb(255,200,140)", rim * 0.8, "lighter", 6);
}

// ================================================================ 24.417 – 26.449 the roof; her keychain
function shotWide(ctx: Ctx, abs: number) {
  const u = easeInOut(phase(abs, EV.pushIn[0], EV.pushIn[1]));
  const z = Math.pow(3.0, u);
  const pivot: Pt = [540 + (ROOF.charm[0] - 540) * u, 960 + (ROOF.charm[1] - 960) * u];
  const target: Pt = [540, 960 - 80 * u];
  const [hx, hy, hr] = handheld(abs, 3, 61);
  ctx.save();
  camera(ctx, pivot[0], pivot[1], z, hr, target[0] - pivot[0] + hx, target[1] - pivot[1] + hy);
  rooftop(ctx, abs);
  // her at the railing, facing the sun
  const her: KidPose = { ...GIRL, view: "back", body: "full", legs: "stand", arms: "down", tilt: 0.02 * Math.sin(abs * 1.3) };
  const drawHer = (c: Ctx) => drawKid(c, HER_AT[0], HER_AT[1], HER_S, her);
  // him, two steps out of the door, from behind
  const walk = phase(abs, EV.roof, EV.roof + 0.55);
  const him: KidPose = { view: "back", body: "full", legs: walk < 1 ? "walk" : "stand", walk: abs * 9, arms: "down" };
  const hs = 0.56 - 0.02 * walk;
  const hp: Pt = [236 + 90 * walk, 1282 - 20 * walk - 780 * hs];
  const drawHim = (c: Ctx) => {
    drawKid(c, hp[0], hp[1], hs, him);
    disguise(c, hp[0], hp[1], hs, him, FULL);
  };
  groundShadow(ctx, drawHer, [HER_AT[0], HER_AT[1] + 780 * HER_S], 470, [HER_AT[0] - 330, 1760], 0.28, 6);
  groundShadow(ctx, drawHim, [hp[0], hp[1] + 780 * hs], 520, [hp[0] - 300, 1620], 0.26, 6);
  drawHer(ctx);
  backlit(ctx, drawHer, "her3a");
  backpack(ctx, swingAt(abs));
  drawHim(ctx);
  backlit(ctx, drawHim, "him3a", 0.45, 0.3);
  roofLight(ctx);
  motes(ctx, abs, 820, 900, 360, 260, 18, 101, "255,226,170", 0.8, 2.4);
  ctx.restore();
  card(ctx, "第二天 放学后", 56, 330, 1 - phase(abs, EV.pushIn[0], EV.pushIn[0] + 0.3), 44);
}

// ================================================================ 26.449 – 27.465 she turns round
function sunFlare(ctx: Ctx, x: number, y: number, a = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, x, y, 320, `rgba(255,210,150,${(0.35 * a).toFixed(3)})`);
  for (const [k, r, al] of [[0.35, 42, 0.1], [0.6, 26, 0.09], [0.9, 64, 0.07]] as [number, number, number][]) {
    bokehDisc(ctx, x + (540 - x) * k * 2, y + (900 - y) * k * 2, r, "255,220,170", al * a);
  }
  ctx.restore();
}

/** a four-pointed glint (the light catching something) */
function glint(ctx: Ctx, x: number, y: number, r: number, k: number) {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.3);
  ctx.scale(k, k);
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, 0, 0, r * 1.6, "rgba(255,236,170,0.55)");
  ctx.fillStyle = "rgba(255,255,240,0.95)";
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2,
      rr = i % 2 ? r * 0.16 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** 26.449 – 27.465 "really really": close on her, the sun right behind her. She turns round (the bob swings), the
 *  low sun catches the sunflower clip — it's the girl from the back row — she sees him in his cap, mask and glasses,
 *  blinks, then smiles as if she'd know him anywhere and gives a little wave. */
const HER_T: Pt = [560, 790];
const HER_T_S = 2.15;
function shotTurn(ctx: Ctx, abs: number) {
  const t = abs - EV.turn;
  const [hx, hy, hr] = handheld(abs, 2.5, 63);
  const push = easeInOut(phase(abs, EV.turn, EV.recog));
  // the sunset behind her, out of focus
  ctx.save();
  camera(ctx, 720, 860, 1.85 + 0.08 * push, hr * 0.5, -160 + hx * 0.5, 30 + hy * 0.5);
  filtered(ctx, `blur(${(5.5 * devScale(ctx)).toFixed(1)}px)`, (c) => {
    rooftop(c, abs);
    roofLight(c);
  }, "roofBg");
  ctx.restore();
  sunFlare(ctx, 820, 900, 1.15);
  const front = t >= 0.2;
  const turnK = front ? 1 - smooth(clamp((t - 0.2) / 0.32)) : 0;
  const smile = smooth(phase(abs, EV.turn + 0.52, EV.turn + 0.64));
  const wave = smooth(phase(abs, EV.turn + 0.6, EV.turn + 0.78));
  // her left hand (screen right) comes up to wave: upper arm out a little, forearm swinging up past her side
  const ua = 1.45 + (1.14 - 1.45) * wave,
    fa = 1.5 + (-1.45 - 1.5) * wave + (wave >= 1 ? 0.24 * Math.sin((t - 0.78) * 17) : 0);
  const el: Pt = [92 + Math.cos(ua) * 134, 192 + Math.sin(ua) * 134];
  const wr: Pt = [el[0] + Math.cos(fa) * 128, el[1] + Math.sin(fa) * 128];
  const pose: KidPose = front
    ? {
        ...GIRL,
        body: "full",
        legs: "stand",
        eyes: smile > 0.5 ? "happy" : t > 0.38 && t < 0.44 ? "shut" : "open",
        brows: smile > 0.5 ? "flat" : "up",
        mouth: smile > 0.5 ? "smile" : "o",
        blush: 0.2 + 0.35 * smile,
        turn: 0.75 * turnK - 0.06,
        look: [-0.25, 0.05],
        tilt: -0.05 + 0.06 * turnK + 0.03 * smile,
        headY: -4 * smile,
        arms: "custom",
        handL: [-110, 446],
        elbowR: el,
        handR: wr,
        shapeR: wave > 0.5 ? "open" : "relax",
      }
    : { ...GIRL, view: "back", body: "full", legs: "stand", arms: "down", tilt: 0.04 * Math.sin(t * 20) };
  const P = HER_T,
    S = HER_T_S;
  ctx.save();
  camera(ctx, P[0], P[1], 1 + 0.05 * push, hr, hx, hy);
  const draw = (c: Ctx) => drawKid(c, P[0], P[1], S, pose);
  draw(ctx);
  backlit(ctx, draw, "her3b", 0.9, 0.16);
  // the swish of her hair as she turns
  if (t > 0.1 && t < 0.42) {
    const a = 1 - Math.abs((t - 0.26) / 0.16);
    ctx.save();
    ctx.globalAlpha = clamp(a);
    for (let i = 0; i < 3; i++) inkLine(ctx, [[P[0] + 270 + i * 22, P[1] - 200 + i * 80], [P[0] + 360 + i * 16, P[1] - 60 + i * 80], [P[0] + 300 + i * 8, P[1] + 70 + i * 80]], 9301 + i, 6, "#fff");
    ctx.restore();
  }
  // the sun catches her sunflower clip as she comes round
  if (front) {
    const k = Math.sin(Math.PI * clamp((t - 0.3) / 0.36));
    glint(ctx, P[0] + (-98 + 18) * S, P[1] + (-66 - 14 + (pose.headY ?? 0)) * S, 46, k);
  }
  ctx.restore();
}

// ================================================================ 27.465 – 28.481 it's her
/** what his sunglasses reflect: the sunset and, small and dark against it, her (his head frame, before the slip) */
function lensReflections(ctx: Ctx, x: number, y: number, s: number, p: KidPose, shadesY: number, abs: number) {
  const fx = (p.turn ?? 0) * 20;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.translate(p.headX ?? 0, p.headY ?? 0);
  ctx.rotate(p.tilt ?? 0);
  ctx.translate(fx, shadesY);
  for (const sd of [-1, 1]) {
    const cx = sd * 50;
    ctx.save();
    blob(ctx, [[cx - 40, 14], [cx + 40, 14], [cx + 42, 60], [cx - 42, 60]], 9320 + sd, 0.2);
    ctx.beginPath();
    ctx.roundRect(cx - 42, 12, 84, 54, 22);
    ctx.clip();
    const g = ctx.createLinearGradient(0, 12, 0, 66);
    g.addColorStop(0, "rgba(255,176,120,0.62)");
    g.addColorStop(0.62, "rgba(232,120,128,0.5)");
    g.addColorStop(1, "rgba(70,40,70,0.6)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - 50, 0, 100, 80);
    glow(ctx, cx + 16, 36, 16, "rgba(255,240,200,0.95)");
    ctx.fillStyle = "rgba(40,26,40,0.55)";
    ctx.fillRect(cx - 50, 46, 100, 3);
    // her, against the sun: a bob (round crown, hair square to the jaw), a neck, sloping shoulders
    const bx = cx - 4 + Math.sin(abs * 3) * 0.6;
    ctx.fillStyle = "rgba(30,18,30,0.92)";
    ctx.beginPath();
    ctx.arc(bx, 30, 8, Math.PI, 0);
    ctx.lineTo(bx + 9, 40);
    ctx.quadraticCurveTo(bx, 42, bx - 9, 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(bx - 2.5, 39, 5, 6);
    ctx.beginPath();
    ctx.moveTo(bx - 4, 44);
    ctx.quadraticCurveTo(bx - 14, 46, bx - 17, 66);
    ctx.lineTo(bx + 17, 66);
    ctx.quadraticCurveTo(bx + 14, 46, bx + 4, 44);
    ctx.closePath();
    ctx.fill();
    // the sun rims her hair
    ctx.strokeStyle = "rgba(255,226,170,0.7)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(bx, 30, 8, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    // the glare across the lens
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 34, 30);
    ctx.lineTo(cx - 14, 18);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/** manga "focus lines": thin dark wedges from off-screen in toward (cx, cy), stopping short at rIn; flickering */
function focusLines(ctx: Ctx, cx: number, cy: number, rIn: number, k: number, abs: number, color = "rgba(58,32,46,0.5)") {
  if (k <= 0) return;
  const fr = Math.floor(abs * 24);
  ctx.save();
  ctx.globalAlpha = k;
  ctx.fillStyle = color;
  for (let i = 0; i < 84; i++) {
    const a = (i / 84) * Math.PI * 2 + (hash(9330 + i + fr * 13) - 0.5) * 0.05;
    const r0 = rIn * (1 + hash(9331 + i * 7 + fr) * 0.45);
    const w = 0.004 + hash(9332 + i * 5 + fr * 3) * 0.012;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a - w) * 1800, cy + Math.sin(a - w) * 1800);
    ctx.lineTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a + w) * 1800, cy + Math.sin(a + w) * 1800);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** 27.465 – 28.481 "good at everything": close on him. In his sunglasses, the sunset and her, small and dark against
 *  it. On the slip the glasses slide down his nose: his eyes, wide, pupils shaking — it's HER (the girl from the back
 *  row) — "!!", focus lines, a jolt, sweat; then his eyes dart to the door (he's about to run). */
const HIM_R: Pt = [540, 860];
const HIM_R_S = 2.55;
const SHADES_DOWN = 38;
function shotRecog(ctx: Ctx, abs: number) {
  const slip = easeOut(phase(abs, SLIP - 0.05, SLIP + 0.07));
  const shock = abs >= SLIP;
  const jump = backOut(phase(abs, SLIP, SLIP + 0.16));
  const creep = easeInOut(phase(abs, EV.recog, SLIP));
  const [hx, hy, hr] = handheld(abs, 2.5, 65);
  const [jx, jy] = shock ? [Math.sin(abs * 61) * 7 * Math.exp(-(abs - SLIP) * 6), Math.cos(abs * 53) * 5 * Math.exp(-(abs - SLIP) * 6)] : [0, 0];
  ctx.save();
  camera(ctx, 540, 900, 1.8, hr * 0.5, (hx + jx) * 0.5, (hy + jy) * 0.5);
  filtered(ctx, `blur(${(6 * devScale(ctx)).toFixed(1)}px)`, (c) => roofReverse(c), "roofRev");
  ctx.restore();
  const P = HIM_R,
    S = HIM_R_S;
  const eyeY = P[1] + 36 * S;
  focusLines(ctx, P[0], eyeY, 470, smooth(phase(abs, SLIP, SLIP + 0.06)) * (1 - 0.6 * phase(abs, SLIP + 0.3, EV.run)), abs);
  // his eyes: frozen on her; after the slip, wide and trembling; at the end they dart to the door
  const dart = smooth(phase(abs, EV.run - 0.3, EV.run - 0.18));
  const tremble = shock ? 0.06 : 0;
  const pose: KidPose = {
    body: "bust",
    eyes: "wide",
    brows: shock ? "up" : "worried",
    mouth: "flat",
    look: [0.05 - 0.9 * dart + tremble * Math.sin(abs * 47), -0.02 + tremble * Math.cos(abs * 41)],
    headY: -12 * jump + 4 * creep,
    tilt: shock ? -0.03 : 0.01,
    arms: "down",
  };
  const shadesY = SHADES_DOWN * slip;
  const d: Disguise = { ...FULL, shadesY };
  const draw = (c: Ctx) => {
    drawKid(c, P[0], P[1], S, pose);
    disguise(c, P[0], P[1], S, pose, d);
  };
  ctx.save();
  camera(ctx, P[0], eyeY, 1 + 0.05 * creep + 0.07 * jump, hr, hx + jx, hy + jy);
  draw(ctx);
  lensReflections(ctx, P[0], P[1], S, pose, shadesY, abs);
  // the low sun full in his face
  const m = figureMask(ctx, draw, "him3c");
  onFigure(ctx, m, (c) => {
    const g = c.createLinearGradient(100, 0, 1000, 0);
    g.addColorStop(0, "rgba(255,190,120,0.3)");
    g.addColorStop(1, "rgba(255,190,120,0.08)");
    c.fillStyle = g;
    c.fillRect(-500, -500, W + 1000, H + 1000);
  }, "screen");
  rimLight(ctx, m, -1, -0.3, 5, "rgb(255,220,170)", 0.45, "lighter", 6.5);
  // sweat breaking out at his temples
  for (const [sx, sy, at, sd] of [[-158, -20, 0.2, 9310], [150, 10, 0.32, 9311]] as [number, number, number, number][]) {
    const k = smooth(phase(abs, SLIP + at, SLIP + at + 0.14));
    if (k <= 0) continue;
    ctx.save();
    ctx.translate(P[0] + sx * S, P[1] + (sy + (pose.headY ?? 0)) * S + 40 * phase(abs, SLIP + at + 0.14, EV.run));
    ctx.scale(k * 1.7, k * 1.7);
    blob(ctx, [[0, -26], [12, -2], [10, 12], [0, 18], [-10, 12], [-12, -2]], sd, 0.5);
    paint(ctx, "#bfe6ff", C.ink, 3.5);
    ctx.restore();
  }
  ctx.restore();
  if (shock) flash(ctx, 0.3 * Math.exp(-(abs - SLIP) * 14), "#fff8e8");
  const k = backOut(phase(abs, SLIP + 0.02, SLIP + 0.18));
  if (k > 0) {
    ctx.save();
    ctx.translate(880, 360);
    ctx.rotate(0.16);
    ctx.scale(k, k);
    text(ctx, "!!", 0, 0, { size: 170, font: F.marker, fill: "#ffd166", stroke: C.ink, lw: 16 });
    ctx.restore();
  }
}

// ================================================================ 28.481 – 29.24 he runs for it (wide), 29.24 – 31.529 at us
const RUN_FROM: Pt = [470, 1215];
/** off the left edge of the frame: he's out of the wide shot by the cut */
const RUN_TO: Pt = [-230, 1345];
const RUN2 = beatAt(57.5);
/** he leans into the run (rad, toward the door on the left) */
const RUN_LEAN = -0.08;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** One arm of a front-view run, right side (mirrored for the left): f = 0 swung back (hand beside the hip),
 *  f = 1 pumped forward (fist up in front of the chest). The elbow stays by his side; the forearm swings through
 *  the front and looks shorter as it points at the camera. Returns [elbow, wrist] in head units. */
function runArm(f: number, side: number): [Pt, Pt] {
  const ex = lerp(142, 126, f) + 10 * Math.sin(Math.PI * f),
    ey = lerp(298, 302, f);
  const ang = lerp(1.43, 3.82, f); // down → across the body → up toward the chest
  const len = lerp(96, 88, f) - 22 * Math.sin(Math.PI * f);
  const w: Pt = [ex + Math.cos(ang) * len, ey + Math.sin(ang) * len];
  return [
    [side * ex, ey],
    [side * w[0], w[1]],
  ];
}

/** both arms for gait phase ph: each arm swings against the opposite leg (legs "run": left leg forward when sin > 0) */
function runArms(ph: number, shape: "fist" | "open"): KidPose {
  const c = Math.sin(ph);
  const [eL, wL] = runArm((1 - c) / 2, -1);
  const [eR, wR] = runArm((1 + c) / 2, 1);
  return { arms: "custom", elbowL: eL, handL: wL, elbowR: eR, handR: wR, shapeL: shape, shapeR: shape };
}

/** draw a figure leaning by `lean` about its feet */
function leaning(ctx: Ctx, foot: Pt, lean: number, draw: () => void) {
  ctx.save();
  ctx.translate(foot[0], foot[1]);
  ctx.rotate(lean);
  ctx.translate(-foot[0], -foot[1]);
  draw();
  ctx.restore();
}

function runner(abs: number): { foot: Pt; s: number; pose: KidPose; bounce: number } {
  const t = abs - EV.run;
  const k = easeIn(clamp((t - 0.22) / (RUN2 - EV.run - 0.22)));
  const foot: Pt = [RUN_FROM[0] + (RUN_TO[0] - RUN_FROM[0]) * k, RUN_FROM[1] + (RUN_TO[1] - RUN_FROM[1]) * k];
  const s = 0.5 + 0.2 * k;
  const ph = abs * 17;
  const pose: KidPose =
    t < 0.2
      ? { view: "back", body: "full", legs: "stand", arms: "down" }
      : { body: "full", legs: "run", walk: ph, ...runArms(ph, "fist"), eyes: "wide", brows: "up", mouth: "flat", turn: -0.25, look: [-0.5, 0], tilt: -0.04 + 0.03 * Math.sin(ph) };
  // up a little in each stride's flight
  const bounce = t < 0.2 ? 0 : -14 * Math.abs(Math.cos(ph));
  return { foot, s, pose, bounce };
}

/** her left arm swinging up from her side to reach after him: [upper-arm angle, length, forearm angle, length] */
const HER_ARM_DOWN = [1.736, 122, 1.638, 118];
const HER_ARM_OUT = [3.057, 118, 3.42, 116];
function drawHerReaching(ctx: Ctx, abs: number, reach: number) {
  const sh: Pt = [-92, 192];
  const a = HER_ARM_DOWN.map((v, i) => lerp(v, HER_ARM_OUT[i], reach));
  const elbow: Pt = [sh[0] + Math.cos(a[0]) * a[1], sh[1] + Math.sin(a[0]) * a[1]];
  const wrist: Pt = [elbow[0] + Math.cos(a[2]) * a[3], elbow[1] + Math.sin(a[2]) * a[3]];
  const her: KidPose = { ...GIRL, body: "full", legs: "stand", arms: "custom", elbowL: elbow, handL: wrist, handR: [112, 430], shapeL: reach > 0.4 ? "open" : "relax", eyes: "open", brows: "worried", mouth: reach > 0.5 ? "o" : "flat", turn: -0.3, look: [-0.4, 0] };
  const feet: Pt = [HER_AT[0], HER_AT[1] + 780 * HER_S];
  const draw = (c: Ctx) => leaning(c, feet, -0.035 * reach, () => drawKid(c, HER_AT[0], HER_AT[1], HER_S, her));
  draw(ctx);
  backlit(ctx, draw, "her3d", 0.7, 0.2);
  void abs;
}

function shotRun(ctx: Ctx, abs: number) {
  const t = abs - EV.run;
  const { foot, s, pose, bounce } = runner(abs);
  const head: Pt = [foot[0], foot[1] - 780 * s + bounce * s];
  const [hx, hy, hr] = handheld(abs, 5, 67);
  ctx.save();
  camera(ctx, 540, 1000, 1.12, hr, hx, -20 + hy);
  rooftop(ctx, abs);
  drawHerReaching(ctx, abs, smooth(phase(abs, EV.run + 0.4, EV.run + 0.8)));
  backpack(ctx, swingAt(abs));
  const d: Disguise = { ...FULL, shadesY: 34 };
  const lean = t < 0.2 ? 0 : RUN_LEAN;
  const draw = (c: Ctx) =>
    leaning(c, foot, lean, () => {
      drawKid(c, head[0], head[1], s, pose);
      disguise(c, head[0], head[1], s, pose, d);
    });
  groundShadow(ctx, draw, foot, 780 * s, [foot[0] - 260, foot[1] + 260], 0.26, 6);
  // speed lines behind him
  if (t > 0.25) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 6; i++) {
      const y = head[1] + 40 + i * 70 * s;
      inkLine(ctx, [[head[0] + 140 * s + i * 8, y], [head[0] + 330 * s + i * 14, y - 30]], 9320 + i, 4, "#fff");
    }
    ctx.restore();
  }
  draw(ctx);
  backlit(ctx, draw, "him3d", 0.5, 0.18);
  // the dust he kicks up as he spins round
  const p = phase(abs, EV.run + 0.12, EV.run + 0.5);
  if (p > 0 && p < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - p;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI + Math.PI;
      oval(ctx, RUN_FROM[0] + Math.cos(a) * 60 * (0.5 + p), RUN_FROM[1] - 10 + Math.sin(a) * 20 * (0.5 + p), 26 * (0.6 + p), 18 * (0.6 + p), 9330 + i, 1);
      paint(ctx, "#f3e6d2", "rgba(23,22,26,0.5)", 3);
    }
    ctx.restore();
  }
  roofLight(ctx);
  ctx.restore();
}

// ================================================================ 30.513 – 31.529 「黑猫！」
/** a speech bubble; `flip` puts the tail on the left (toward a speaker down-left of it) */
function speechBubble(ctx: Ctx, s: string, x: number, y: number, k: number, flip = false) {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.rotate(-0.05);
  ctx.save();
  if (flip) ctx.scale(-1, 1);
  blob(ctx, [[-170, -70], [0, -86], [170, -70], [190, 0], [170, 70], [60, 82], [140, 150], [10, 84], [-170, 70], [-192, 0]], 9340, 2);
  paint(ctx, "#fff", C.ink, 7);
  ctx.restore();
  text(ctx, s, 0, 2, { size: 92, font: F.ui, weight: 700, fill: C.ink });
  ctx.restore();
}

/** 29.24 – 31.529, from the stair door: he comes running straight at us in a panic — fists pumping, sweat flying,
 *  zoom lines — with her small at the fence behind him, reaching after him. On 「黑猫！」 (30.51) he stops dead
 *  mid-stride, one foot in the air: a flash, the world behind him drains of colour and holds; then his head creaks
 *  round toward her voice. */
function shotCharge(ctx: Ctx, abs: number) {
  const frozen = abs >= EV.freeze;
  const tf = Math.min(abs, EV.freeze);
  const k = clamp((tf - RUN2) / (EV.freeze - RUN2));
  // coming at us at a steady speed: his size grows as 1 / distance, his feet on the roof, his head about at our eyes
  const s = 0.78 / (1 - k * (1 - 0.78 / 1.5));
  const ph = 0.7 + (tf - EV.freeze) * 15; // the stride he's frozen in has his right foot up
  const bounce = frozen ? 0 : -12 * Math.abs(Math.cos(ph));
  const foot: Pt = [lerp(300, 410, k), 830 + 700 * s];
  const head: Pt = [foot[0], foot[1] - 780 * s + bounce * s];
  const turnBack = smooth(phase(abs, EV.freeze + 0.42, EV.freeze + 0.74));
  const jolt = frozen ? backOut(phase(abs, EV.freeze, EV.freeze + 0.14)) * (1 - phase(abs, EV.freeze + 0.14, EV.freeze + 0.3)) : 0;
  const [hx, hy, hr] = handheld(abs, frozen ? 1.5 : 6, 89);
  // the roof behind him, her at the fence reaching after him, out of focus; drained of colour once time stops
  ctx.save();
  camera(ctx, 700, 900, 1.15, hr * 0.5, -110 + hx * 0.5, -60 + hy * 0.5); // the stair housing (where we stand) all but out of frame
  filtered(ctx, `blur(${(3.5 * devScale(ctx)).toFixed(1)}px)${frozen ? " saturate(0.3)" : ""}`, (c) => {
    rooftop(c, abs);
    drawHerReaching(c, abs, 1);
    backpack(c, swingAt(tf));
    roofLight(c);
  }, "roofCh");
  ctx.restore();
  if (!frozen) focusLines(ctx, head[0], head[1] + 120 * s, 380 + 260 * s, 0.9, abs, "rgba(255,250,236,0.4)");
  const pose: KidPose = {
    body: "full",
    legs: "run",
    walk: ph,
    ...runArms(ph, frozen ? "open" : "fist"),
    eyes: "wide",
    brows: "up",
    mouth: "flat",
    turn: 0.4 * turnBack,
    look: [0.85 * turnBack, -0.08],
    tilt: frozen ? 0.06 * turnBack : 0.05 * Math.sin(ph),
    headY: -8 * jolt,
  };
  const d: Disguise = { ...FULL, shadesY: 34 };
  const draw = (c: Ctx) => {
    drawKid(c, head[0], head[1], s, pose);
    disguise(c, head[0], head[1], s, pose, d);
  };
  ctx.save();
  camera(ctx, 540, 900, 1 + 0.04 * jolt, hr, hx, hy);
  groundShadow(ctx, draw, foot, 780 * s, [foot[0], foot[1] + 260 * s], 0.24, 6);
  draw(ctx);
  backlit(ctx, draw, "him3e", 0.55, 0.2);
  // sweat: flying off him as he runs; three drops jumping off when he freezes
  const drops: [number, number, number][] = frozen
    ? [[-150, -120, 0], [0, -200, 0.05], [150, -120, 0.1]]
    : [[-170, -40, 0], [170, -60, 0.33]];
  drops.forEach(([dx, dy, dt], i) => {
    const q = frozen ? smooth(phase(abs, EV.freeze + 0.05 + dt, EV.freeze + 0.25 + dt)) : ((abs * 2.2 + dt) % 1);
    if (q <= 0) return;
    ctx.save();
    ctx.globalAlpha = frozen ? 1 : 1 - q;
    ctx.translate(head[0] + (dx + Math.sign(dx) * 70 * q) * s, head[1] + (dy - 60 * q) * s);
    ctx.scale(1.3 * s, 1.3 * s);
    blob(ctx, [[0, -20], [10, -2], [8, 10], [0, 14], [-8, 10], [-10, -2]], 9350 + i, 0.4);
    paint(ctx, "#bfe6ff", C.ink, 3);
    ctx.restore();
  });
  // the shock lines when he freezes
  if (frozen) {
    const q = phase(abs, EV.freeze, EV.freeze + 0.3);
    ctx.save();
    ctx.globalAlpha = 1 - 0.6 * q;
    for (let i = 0; i < 4; i++) {
      const a = -2.5 + i * 0.42;
      const r0 = 250 * s,
        r1 = (300 + 30 * q) * s;
      inkLine(ctx, [[head[0] + Math.cos(a) * r0, head[1] - 40 * s + Math.sin(a) * r0], [head[0] + Math.cos(a) * r1, head[1] - 40 * s + Math.sin(a) * r1]], 9356 + i, 7, C.ink);
    }
    ctx.restore();
  }
  ctx.restore();
  if (frozen) flash(ctx, 0.5 * Math.exp(-(abs - EV.freeze) * 12), "#fff8e8");
  // her voice, from behind him
  speechBubble(ctx, "黑猫！", 850, 330, 0.85 * backOut(phase(abs, EV.freeze + 0.03, EV.freeze + 0.2)), true);
}

// ================================================================ 31.529 – 32.544 her sketchbook
/** her, a step away from him, holding the sketchbook (head centre, scale) */
const HER_HOLD: Pt = [600, 540];
const HER_HOLD_S = 1.9;
/** where act4's book shot has the page: centre and page-unit scale on screen (BOOK_C, BOOK_S there) */
const BOOK4_C: Pt = [540, 870];
const BOOK4_S = 1.42;

/** 31.529 – 32.544: over his shoulder, she brings the closed sketchbook up to her nose and peeks over it at him,
 *  blushing (her white-cat sticker on the cover, the little red leaf in the corner). On the last beat she hides her
 *  whole face behind it while the camera rushes in, landing on the book exactly where act4 has it — which opens the
 *  cover on the downbeat (32.544), so the cut is invisible. */
const HIDE = EV.twist - 0.3;
function shotHoldUp(ctx: Ctx, abs: number) {
  const t = abs - EV.holdUp;
  const raise = backOut(phase(abs, EV.holdUp + 0.04, EV.holdUp + 0.3));
  const hide = easeInOut(phase(abs, HIDE, HIDE + 0.2));
  const creep = easeInOut(phase(abs, EV.holdUp, HIDE));
  const rush = easeIn(phase(abs, HIDE, EV.twist));
  const mixN = (a: number, b: number, k: number) => a + (b - a) * k;
  const [hx, hy, hr] = handheld(abs, 2.5, 69).map((v) => v * (1 - rush));
  // the roof behind her, out of focus (ending on act4's background)
  ctx.save();
  camera(ctx, 700, 860, mixN(1.3 + 0.05 * creep, 1.5, rush), hr * 0.5, mixN(-60, -160, rush) + hx * 0.5, 40 + hy * 0.5);
  filtered(ctx, `blur(${(mixN(4.5, 5, rush) * devScale(ctx)).toFixed(1)}px)`, (c) => {
    rooftop(c, abs);
    roofLight(c);
  }, "roofBg2");
  ctx.restore();
  sunFlare(ctx, 930, 900, 0.8 * (1 - rush));
  // her: the book comes up from her chest to her nose; she peeks over it, swaying a little; then up over her face
  const top = holdTop(raise, hide);
  const peek = raise > 0.55;
  const her = holdPose(raise, hide, Math.sin(t * 6.5) * 0.03 * raise * (1 - hide));
  const P = HER_HOLD,
    S = HER_HOLD_S;
  const draw = (c: Ctx) => {
    drawKid(c, P[0], P[1], S, her);
    c.save();
    c.translate(P[0], P[1]);
    c.scale(S, S);
    heldBook(c, top);
    c.restore();
    bookHands(c, P[0], P[1], S, top);
  };
  // the camera: creeps in, then rushes in so the book (up over her face) lands on act4's framing of it
  const pivot: Pt = [P[0], P[1] + (TOP_HIDE + BOOK_H / 2) * S];
  const z0 = 1 + 0.06 * creep,
    z1 = (BOOK4_S * SKETCH_W) / (BOOK_W * S);
  ctx.save();
  camera(ctx, pivot[0], pivot[1], z0 * Math.pow(z1 / z0, rush), hr, mixN(hx, BOOK4_C[0] - pivot[0], rush), mixN(hy, BOOK4_C[1] - pivot[1], rush));
  draw(ctx);
  backlit(ctx, draw, "her3f", 0.7 * (1 - rush), 0.14 * (1 - rush));
  // shy: three little lines by her cheek
  if (peek && hide < 1) {
    ctx.save();
    ctx.globalAlpha = smooth(phase(abs, EV.holdUp + 0.3, EV.holdUp + 0.45)) * (1 - hide);
    for (let i = 0; i < 3; i++) inkLine(ctx, [[P[0] + 236 + i * 18, P[1] - 40 + i * 22], [P[0] + 268 + i * 18, P[1] - 56 + i * 22]], 9390 + i, 5, "#e2483f");
    ctx.restore();
  }
  ctx.restore();
  // him in the foreground, his back to us (cap), out of focus; he slides out of frame as the camera rushes in
  filtered(ctx, `blur(${(4 * devScale(ctx)).toFixed(1)}px)`, (c) => {
    const him: KidPose = { view: "back", body: "bust", arms: "down" };
    const hx0 = 70 - 420 * rush,
      hy0 = 1330 + 200 * rush;
    drawKid(c, hx0, hy0, 1.5, him);
    disguise(c, hx0, hy0, 1.5, him, FULL);
  }, "himFg");
}

function vignette(ctx: Ctx, a: number) {
  const g = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.3, W / 2, H * 0.46, H * 0.78);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${a.toFixed(2)})`);
  ctx.fillStyle = g;
  ctx.fillRect(-60, -60, W + 120, H + 120);
}

export function createScene(options: SceneOptions) {
  return designScene(options, EV.roof, (ctx, abs) => {
    if (abs < EV.turn) shotWide(ctx, abs);
    else if (abs < EV.recog) shotTurn(ctx, abs);
    else if (abs < EV.run) shotRecog(ctx, abs);
    else if (abs < RUN2) shotRun(ctx, abs);
    else if (abs < EV.holdUp) shotCharge(ctx, abs);
    else shotHoldUp(ctx, abs);
    bloom(ctx, 0.22, 26, 2.6);
    vignette(ctx, 0.3);
  });
}
