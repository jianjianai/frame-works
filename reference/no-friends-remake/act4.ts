import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase, smooth } from "@frame/engine/math";
import { C, Ctx, F, H, Pt, W, backOut, beatAt, blinkEyes, blit, blob, bloom, buffer, camera, card, designScene, devScale, easeIn, easeInOut, easeOut, fillBg, filtered, flash, glow, grade, handheld, hash, ik2, inkLine, measure, oval, paint, poly, rr, shaded, shake, text, tubePts, vgrad, writeOn } from "@materials/s0rrow/code/draw";
import { KidPose, drawHand, drawKid } from "@materials/s0rrow/code/kid";
import { CAST } from "@materials/s0rrow/code/people";
import { Msg, SH, SW, chatScreen, phone, phoneBack } from "@materials/s0rrow/code/phone";
import { bigCake, bokeh, cupcake, screenSpill, street, streetBokeh } from "@materials/s0rrow/code/sets";
import { birthdayDesk } from "@materials/s0rrow/code/shared";

/** ACT 4 · 第三遍副歌「他试着开口」(song 50.48 – 67.05 = work 17.08 – 33.66; this act draws in song time, its layer
 *  sits 33.39 s earlier) · 重新设计版. Still his grey world: only the candle, the match and the red "!" are in colour.
 *  17.08 inside the cake shop, looking out: the big two-tier cake sharp in front, him behind the glass in the dark,
 *        both above the lyrics; the focus racks to his face; his eyes go from the big cake down to the tray of plain
 *        cupcakes — he'll get one of those (彩蛋: this big cake is the one the friends bring at 0:46). No clerk's hand
 *        (用户: hands look odd).
 *  19.05 walking home, toward us: the camera backs away in front of him down the pavement, the street lamps pass him
 *        and fall away behind (perspective), so he walks through pool after pool of lamplight — lit, then dark again —
 *        head down over his phone, the little cake box swinging from one hand; he slows to a stop to type
 *  21.13 the class group: 「其实…今天是我生日」 → sent 23.22 → red "!" 24.00 → push in
 *  25.31 long-press → 删除
 *  26.87 23:58, the desk (the cold open's framing): his hand brings a match to the wick (27.92), the warm light blooms,
 *        he puts on his own party hat
 *  29.48 许个愿吧 → eyes shut → 希望…有人记得我 → blows (31.86) → dark (32.21), the music muffled */
const T0 = 50.475;
const WALK = beatAt(100); // 52.44 (work 19.05)
const N2 = beatAt(104); // 54.53 (21.13) the class group
const SEND = beatAt(108); // 56.61 (23.22)
const FAIL = beatAt(109.5); // 57.40 (24.00) the red !
const N3 = beatAt(112); // 58.70 (25.31) long-press → delete
const N3b = beatAt(115); // 60.27 (26.87) the desk
const MATCH = beatAt(117); // 61.31 (27.92) the match touches the wick
const N4 = beatAt(120); // 62.87 (29.48) the wish
const BLOW = 65.25; // (31.86)
const OUT = 65.6; // (32.21)
const GREY = 0.38;
const MSG = "其实…今天是我生日";

// ---------------------------------------------------------------- 17.08 – 19.05 the cake shop window
// him outside the window: to the right of the cake, his face level with its top (and clear of the lyrics)
const BK = { x: 780, y: 640, s: 0.86 };
function outsideBakery(c: Ctx, abs: number) {
  street(c, abs, 380);
  const down = smooth(phase(abs, WALK - 0.85, WALK - 0.6)); // from the big cake down to the plain cupcakes
  drawKid(c, BK.x, BK.y + 6 * down, BK.s, {
    body: "full",
    arms: "pockets",
    eyes: down > 0.5 ? "sad" : blinkEyes(abs, 3, "open"),
    brows: down > 0.5 ? "sad" : undefined,
    look: down > 0.5 ? [0.05, 1] : [-0.85, 0.55],
    mouth: "flat",
  });
  // 光影: the shop's warm light falls out through the glass onto him and the pavement at his feet
  c.save();
  c.globalCompositeOperation = "lighter";
  glow(c, BK.x - 60, BK.y + 160, 460, "rgba(255,226,170,0.17)");
  c.translate(BK.x - 80, BK.y + 520);
  c.scale(1, 0.22);
  glow(c, 0, 0, 520, "rgba(255,226,170,0.22)");
  c.restore();
}

function glass(c: Ctx, abs: number) {
  c.save();
  c.globalCompositeOperation = "lighter";
  c.fillStyle = "rgba(200,220,255,0.06)";
  c.beginPath();
  c.moveTo(120, -60);
  c.lineTo(300, -60);
  c.lineTo(60, 1300);
  c.lineTo(-120, 1300);
  c.fill();
  c.fillStyle = "rgba(200,220,255,0.04)";
  c.beginPath();
  c.moveTo(760, -60);
  c.lineTo(820, -60);
  c.lineTo(560, 1300);
  c.lineTo(500, 1300);
  c.fill();
  c.restore();
  // the shop's name painted on the glass, seen from inside: back to front (above his head, clear of the title)
  c.save();
  c.translate(800, 345);
  c.scale(-1, 1);
  text(c, "BAKERY", 0, 0, { size: 84, font: F.marker, fill: "rgba(255,245,230,0.45)" });
  c.restore();
  // his breath fogging the glass in front of his mouth
  glow(c, BK.x - 10, BK.y + 70, 80, `rgba(230,236,255,${(0.2 + 0.08 * Math.sin(abs * 3)).toFixed(3)})`);
}

const COUNTER = 1100; // the counter top: the cake and the tray of cupcakes stand on it, above the lyrics
function display(c: Ctx, abs: number) {
  // the display counter (the cake stand sits on it), a darker front edge — the lyrics sit on its front
  shaded(c, () => poly(c, [[-80, COUNTER], [W + 80, COUNTER - 8], [W + 80, H + 80], [-80, H + 80]], 2101, 1.5), "#d9cfc0", () => {
    c.fillStyle = "rgba(255,255,255,0.25)";
    c.fillRect(-80, COUNTER - 4, W + 160, 18);
    c.fillStyle = "rgba(60,40,20,0.35)";
    c.fillRect(-80, COUNTER + 70, W + 160, H);
  }, C.ink, 6);
  // the window frame edges (we are inside the shop, looking out)
  for (const x of [-40, W - 30]) {
    rr(c, x, -80, 70, COUNTER + 100, 6);
    c.fillStyle = "#2a2420";
    c.fill();
  }
  bigCake(c, 330, COUNTER + 20, 1.15, abs);
  // a tray of plain cupcakes beside it, right under his eyes
  rr(c, 640, COUNTER + 44, 420, 30, 10);
  c.fillStyle = "#cfc6b8";
  c.fill();
  c.strokeStyle = C.ink;
  c.lineWidth = 4;
  c.stroke();
  for (let i = 0; i < 3; i++) cupcake(c, 725 + i * 130, COUNTER + 36, 0.48, abs, 0, 0, 0);
}

function shotBakery(ctx: Ctx, abs: number) {
  // inside the shop looking out: the cake sharp in front, him blurred behind the glass → the focus racks to him
  const rack = easeInOut(phase(abs, T0 + 0.85, T0 + 1.45));
  const drift = easeInOut(phase(abs, T0, WALK));
  const [hx, hy, hr] = handheld(abs, 3, 21);
  grade(ctx, GREY, (g) => {
    g.save();
    camera(g, 540, 960, 1.04 + 0.04 * drift, hr, hx - 40 * drift, hy);
    filtered(g, `blur(${(6 * (1 - rack)).toFixed(2)}px)`, (b) => outsideBakery(b, abs), "bg");
    glass(g, abs);
    filtered(g, `blur(${(5 * rack).toFixed(2)}px)`, (b) => display(b, abs), "fg");
    // 光影: the shop's lights from above — the cake glows, a pool of light on the counter round it, the front of the
    // counter falls away into shadow (it was a flat grey slab under the lyrics)
    g.save();
    g.globalCompositeOperation = "lighter";
    glow(g, 340, COUNTER - 250, 420, "rgba(255,246,228,0.13)");
    g.translate(380, COUNTER + 40);
    g.scale(1, 0.24);
    glow(g, 0, 0, 560, "rgba(255,240,215,0.24)");
    g.restore();
    g.fillStyle = vgrad(g, COUNTER + 70, COUNTER + 560, [[0, "rgba(16,12,10,0)"], [1, "rgba(16,12,10,0.62)"]]);
    g.fillRect(-80, COUNTER + 70, W + 160, H);
    g.restore();
  });
  card(ctx, "21:52 · 回家的路上", 70, 330, smooth(phase(abs, T0 + 0.15, T0 + 0.45)) * (1 - phase(abs, WALK - 0.4, WALK - 0.1)));
  flash(ctx, 1 - phase(abs, T0, T0 + 0.4), "#0b0d1c");
}

// ---------------------------------------------------------------- 19.05 – 21.13 walking home, toward us
// The old shot had him walking on the spot in front of a street scrolling sideways (front-view legs + sideways scroll
// = sliding). Now the street is in perspective and the camera backs away in front of him: he walks toward us, the
// lamps pass him and recede behind him, and he walks through pool after pool of lamplight.
const HZ = 700, // horizon
  FOC = 1661, // focal length (px): camera 1.3 m up, him 3 m away → his feet at y ≈ 1420
  CAM_H = 1.3,
  KID_Z = 3,
  LAMP_GAP = 6.5, // m between lamps
  WALK_V = 3.2; // m/s (brisker than life, so a lamp passes him every two seconds)
const gx = (X: number, z: number) => 540 + (FOC * X) / z;
const gy = (h: number, z: number) => HZ + (FOC * (CAM_H - h)) / z; // h = height above the ground
/** distance walked: steady, then slowing to a stop as he starts to type */
function walked(abs: number) {
  const u = abs - WALK,
    a = 1.45,
    b = N2 - WALK - 0.08;
  if (u <= a) return WALK_V * Math.max(0, u);
  const v = Math.min(u, b) - a;
  return WALK_V * (a + v - (v * v) / (2 * (b - a)));
}
/** lamps, by depth (m in front of the camera) */
const lampZs = (travel: number) => Array.from({ length: 9 }, (_, k) => 1.2 + k * LAMP_GAP + (travel % LAMP_GAP)).filter((z) => z > 0.7);

function lamp(c: Ctx, z: number, k: number) {
  const w = (FOC * 0.11) / z;
  inkLine(c, [[gx(1.6, z), gy(0, z)], [gx(1.6, z), gy(4.3, z)]], 2400 + k, Math.max(2, w), "#3a3d48");
  inkLine(c, [[gx(1.6, z), gy(4.3, z)], [gx(1.2, z), gy(4.5, z)], [gx(0.7, z), gy(4.35, z)]], 2420 + k, Math.max(1.5, w * 0.6), "#3a3d48");
  const r = (FOC * 0.2) / z;
  oval(c, gx(0.7, z), gy(4.25, z), r, r * 0.5, 2440 + k, 0.4);
  paint(c, "#fff3d0", C.ink, Math.max(1.5, w * 0.3));
}

function streetAhead(c: Ctx, abs: number, travel: number, frontOnly: boolean) {
  const lamps = lampZs(travel);
  if (frontOnly) {
    // the lamps between him and the camera (passing at the right edge)
    lamps.filter((z) => z < KID_Z).forEach((z, k) => lamp(c, z, k));
    return;
  }
  // the night sky, stars, the moon
  fillBg(c, vgrad(c, 0, HZ, [[0, "#0b1030"], [1, "#2a2d4a"]]));
  for (let i = 0; i < 40; i++) {
    c.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(abs * 1.1 + i));
    c.fillStyle = "#fff";
    c.fillRect(hash(i * 1.7) * W, 60 + hash(i * 2.9) * 520, 3, 3);
  }
  c.globalAlpha = 1;
  glow(c, 880, 250, 170, "rgba(255,250,220,0.22)");
  oval(c, 880, 250, 44, 44, 2401, 0.6);
  paint(c, "#f4efd8", C.ink, 4);
  // the far end of the street: blocks of flats along the horizon, a few windows still lit
  for (let k = 0; k < 12; k++) {
    const x = -40 + k * 100 + hash(k * 3.1) * 30,
      bw = 80 + hash(k * 5.3) * 70,
      top = HZ - 60 - hash(k * 7.7) * 200;
    poly(c, [[x, top], [x + bw, top], [x + bw, HZ + 4], [x, HZ + 4]], 2460 + k, 0.8);
    paint(c, "#1b1d2e", C.ink, 3);
    for (let r = 0; r < 8; r++)
      for (let q = 0; q < 3; q++) {
        if (hash(k * 13 + r * 3.7 + q) < 0.72 || top + 18 + r * 26 > HZ - 10) continue;
        c.fillStyle = "rgba(255,226,160,0.75)";
        c.fillRect(x + 12 + q * (bw - 24) / 3, top + 16 + r * 26, 12, 14);
      }
  }
  // the ground: the road on the left, the pavement he walks on, the kerb between them
  c.fillStyle = "#26262c";
  c.fillRect(-60, HZ, W + 120, H - HZ + 60);
  const ZN = 0.65,
    ZF = 400;
  poly(c, [[gx(-0.9, ZF), HZ], [gx(1.9, ZF), HZ], [gx(1.9, ZN), gy(0, ZN)], [gx(-0.9, ZN), gy(0, ZN)]], 2470, 0.4);
  paint(c, "#45454e", null);
  inkLine(c, [[gx(-0.9, ZF), HZ], [gx(-0.9, ZN), gy(0, ZN)]], 2471, 5);
  // paving joints every metre and the road's centre dashes, moving away as the camera backs off
  for (let j = 0; j < 40; j++) {
    const z = 1 + j + (travel % 1);
    c.globalAlpha = Math.min(1, 6 / z) * 0.5;
    inkLine(c, [[gx(-0.9, z), gy(0, z)], [gx(1.9, z), gy(0, z)]], 2500 + j, Math.max(1, 30 / z), "#2e2e35");
  }
  for (let j = 0; j < 14; j++) {
    const z0 = 1 + j * 5 + (travel % 5);
    c.globalAlpha = Math.min(1, 8 / z0);
    poly(c, [[gx(-3.6, z0), gy(0, z0)], [gx(-3.4, z0), gy(0, z0)], [gx(-3.4, z0 + 2), gy(0, z0 + 2)], [gx(-3.6, z0 + 2), gy(0, z0 + 2)]], 2550 + j, 0.2);
    paint(c, "#bdbdb0", null);
  }
  c.globalAlpha = 1;
  // 光影: night haze where the street meets the sky, the far end fading into it
  c.save();
  c.globalCompositeOperation = "lighter";
  c.fillStyle = vgrad(c, HZ - 220, HZ + 260, [[0, "rgba(120,130,180,0)"], [0.45, "rgba(120,130,180,0.16)"], [1, "rgba(120,130,180,0)"]]);
  c.fillRect(-60, HZ - 220, W + 120, 480);
  c.restore();
  // pools of lamplight on the pavement, then the lamps behind him (far to near)
  c.save();
  c.globalCompositeOperation = "lighter";
  for (const z of lamps) {
    // the cone of light under each lamp, in the haze, and the lamp's halo
    const lx = gx(0.7, z),
      ly = gy(4.25, z),
      gyz = gy(0, z),
      half = (FOC * 0.9) / z;
    const cg = c.createLinearGradient(0, ly, 0, gyz);
    cg.addColorStop(0, `rgba(255,228,170,${Math.min(0.14, 0.5 / z).toFixed(3)})`);
    cg.addColorStop(1, "rgba(255,228,170,0.01)");
    c.fillStyle = cg;
    c.beginPath();
    c.moveTo(lx - half * 0.12, ly);
    c.lineTo(lx + half * 0.12, ly);
    c.lineTo(lx + half, gyz);
    c.lineTo(lx - half, gyz);
    c.closePath();
    c.fill();
    glow(c, lx, ly, (FOC * 0.55) / z, `rgba(255,238,200,${Math.min(0.35, 1.2 / z).toFixed(3)})`);
    const rx = (FOC * 1.7) / z,
      ry = Math.max(4, (FOC * CAM_H * 1.7) / (z * z));
    const g = c.createRadialGradient(gx(0.7, z), gy(0, z), 0, gx(0.7, z), gy(0, z), rx);
    g.addColorStop(0, "rgba(255,226,160,0.32)");
    g.addColorStop(1, "rgba(255,226,160,0)");
    c.save();
    c.translate(gx(0.7, z), gy(0, z));
    c.scale(1, ry / rx);
    c.translate(-gx(0.7, z), -gy(0, z));
    c.fillStyle = g;
    c.fillRect(gx(0.7, z) - rx, gy(0, z) - rx, rx * 2, rx * 2);
    c.restore();
  }
  c.restore();
  [...lamps].reverse().forEach((z, k) => {
    if (z >= KID_Z) lamp(c, z, k);
  });
  // the near pavement falls away into the dark below the lyrics
  c.fillStyle = vgrad(c, 1480, H + 60, [[0, "rgba(6,7,14,0)"], [1, "rgba(6,7,14,0.5)"]]);
  c.fillRect(-60, 1480, W + 120, H - 1420);
}

/** 光影: his shadow on the pavement from a lamp at depth z — swinging round him as he walks past it: long toward us
 *  when the lamp is behind him, sideways as it passes, running ahead of him (up the street) once it is behind us.
 *  His silhouette is sheared onto the ground from his feet to where the lamp throws the top of his head. */
function walkShadow(g: Ctx, draw: (k: Ctx) => void, z: number, strength: number) {
  if (strength <= 0.02) return;
  const zg = 5 - 0.667 * z; // the top of his head, thrown onto the ground (lamp 4.25 m up, 0.7 m to his right)
  if (zg < 0.9) return;
  const fx = 540,
    fy = gy(0, KID_Z),
    hk = 860;
  const kx = (gx(-0.467, zg) - fx) / -hk,
    ky = (gy(0, zg) - fy) / -hk,
    sx = Math.min(1.25, Math.max(0.55, KID_Z / zg));
  const b = buffer(g, "walkShadow");
  b.save();
  b.transform(sx, 0, kx, ky, fx - sx * fx - kx * fy, fy - ky * fy);
  draw(b);
  b.restore();
  b.save();
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.globalCompositeOperation = "source-in";
  b.fillStyle = "#04050b";
  b.fillRect(0, 0, b.canvas.width, b.canvas.height);
  b.restore();
  blit(g, b, "source-over", strength, `blur(${((2 + Math.abs(zg - KID_Z) * 2.5) * devScale(g)).toFixed(1)}px)`);
}

function shotWalk(ctx: Ctx, abs: number) {
  const travel = walked(abs);
  const moving = abs < N2 - 0.12;
  // lit when a lamp is right over him
  const light = Math.max(0, ...lampZs(travel).map((z) => Math.exp(-(((z - KID_Z) / 1.5) ** 2))));
  const [hx, hy, hr] = handheld(abs, 4, 7);
  const push = easeInOut(phase(abs, WALK, N2));
  const KY = 693; // his head (feet at ≈ 1420)
  const bob = moving ? -Math.abs(Math.sin(travel * 2.2)) * 7 : 0;
  grade(ctx, GREY, (g) => {
    g.save();
    camera(g, 540, 760, 1.0 + 0.08 * push, hr, hx, hy);
    streetAhead(g, abs, travel, false);
    // a cone of light down onto him when he's under a lamp
    if (light > 0.02) {
      g.save();
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = light * 0.5;
      const cone = g.createLinearGradient(0, 0, 0, 1300);
      cone.addColorStop(0, "rgba(255,230,170,0.35)");
      cone.addColorStop(1, "rgba(255,230,170,0)");
      g.fillStyle = cone;
      g.beginPath();
      g.moveTo(620, -60);
      g.lineTo(760, -60);
      g.lineTo(900, 1300);
      g.lineTo(240, 1300);
      g.closePath();
      g.fill();
      g.restore();
    }
    const walker = (k0: Ctx) =>
    drawKid(k0, 540, KY + bob, 0.93, {
      body: "full",
      legs: moving ? "walk" : "stand",
      walk: travel * 2.2,
      eyes: blinkEyes(abs, 3, "sleepy"),
      look: [0.15, 0.95],
      headY: 8,
      arms: "custom",
      handL: [-108 + 6 * Math.sin(travel * 2.2), 440],
      handR: [50, 300],
      // both hands are drawn in grip below, with their thumbs the right way round (用户: drawKid's hands came out
      // reversed here — the right thumb underneath the phone, the left thumb on the outside of the box's string)
      shapeL: "hidden",
      shapeR: "hidden",
      grip: (k) => {
        // the little cake box hanging from his left hand: string from inside the fist, the box swinging with it;
        // the hand unmirrored, so its thumb is on the inside, toward his body
        const [eL, wL] = ik2([-100, 192], [-108 + 6 * Math.sin(travel * 2.2), 440], 142, 134, -1);
        const aL = Math.atan2(wL[1] - eL[1], wL[0] - eL[0]);
        const fx = wL[0] + Math.cos(aL) * 34,
          fy = wL[1] + Math.sin(aL) * 34;
        inkLine(k, [[fx, fy], [fx - 6, fy + 30], [fx, fy + 58]], 2201, 3, "#d9658f");
        shaded(k, () => rr(k, fx - 60, fy + 56, 120, 92, 8), "#f4efe6", () => {
          k.fillStyle = "rgba(255,143,184,0.85)";
          k.fillRect(fx - 9, fy + 56, 18, 92);
          k.fillStyle = "rgba(0,0,0,0.08)";
          k.fillRect(fx + 20, fy + 56, 40, 92);
        }, C.ink, 4);
        drawHand(k, wL[0], wL[1], 1, aL, "hold", false, false, 2280);
        // his phone in the right hand, its back to us (he's reading it), the fist round its lower half, thumb up
        // along its edge (用户: 大拇指应该朝上) — the same IK as drawKid's right arm, mirrored hand
        const [elbow, wrist] = ik2([100, 192], [50, 300], 142, 134, 1);
        const ang = Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]);
        phoneBack(k, wrist[0] + Math.cos(ang) * 30, wrist[1] + Math.sin(ang) * 30 - 44, 68, 124, -0.08);
        drawHand(k, wrist[0], wrist[1], 1, ang, "hold", true, false, 2290);
      },
    });
    // his shadows from the lamps near him, swinging round as he walks past them
    for (const z of lampZs(travel)) walkShadow(g, walker, z, 0.55 * Math.exp(-(((z - KID_Z) / 2.4) ** 2)));
    filtered(g, `brightness(${(0.62 + 0.48 * light).toFixed(3)})`, walker, "walker");
    // the phone's light on his face
    glow(g, 540 + 0.93 * 20, KY + bob + 0.93 * 170, 260, "rgba(170,205,255,0.28)");
    streetAhead(g, abs, travel, true);
    g.restore();
  });
}

// ---------------------------------------------------------------- 21.13 – 26.87 the class group: sent, failed, deleted
/** Where chatScreen draws the red "!" of my (last, one-line) message, in phone screen units. */
function failMark(ctx: Ctx, keyboard: boolean): Pt {
  const bw = measure(ctx, MSG, 30, F.ui) + 44;
  const inputY = SH - 120 - (keyboard ? 420 : 0);
  const bh = 42 + 36;
  const y = inputY - 40 - bh;
  return [SW - 106 - bw - 34, y + bh / 2];
}

function chat(abs: number) {
  const typing = phase(abs, 54.9, 56.45);
  const sent = abs >= SEND;
  const deleting = phase(abs, 59.55, 59.95);
  const msgs: Msg[] = [
    { from: "班长", text: "明天记得交数学作业", avatar: CAST.monitor, time: "10:12" },
    { from: "大刘", text: "收到", avatar: CAST.a },
  ];
  if (sent && deleting < 1)
    msgs.push({
      me: true,
      text: MSG,
      sending: abs < FAIL ? abs - SEND : 0,
      failed: abs >= FAIL ? easeOut(phase(abs, FAIL, FAIL + 0.2)) : 0,
    });
  const input = sent ? "" : writeOn(MSG, typing);
  const caret = !sent && Math.floor(abs * 3) % 2 === 0;
  return (c: Ctx) => {
    chatScreen(c, { time: "21:53", airplane: true }, "高二(3)班 (46)", msgs, input, caret, { keyboard: abs < 59.0 });
    // long-press menu → 删除
    const menu = phase(abs, 58.95, 59.15) * (1 - phase(abs, 59.5, 59.6));
    if (menu > 0) {
      c.save();
      c.globalAlpha = menu;
      c.fillStyle = "#4c4c4c";
      rr(c, 150, 960, 400, 92, 16);
      c.fill();
      ["复制", "转发", "撤回", "删除"].forEach((label, i) => {
        const hot = label === "删除" && abs > 59.35;
        if (hot) {
          c.fillStyle = "#6a6a6a";
          rr(c, 160 + i * 96, 968, 92, 76, 10);
          c.fill();
        }
        text(c, label, 206 + i * 96, 1006, { size: 28, font: F.ui, fill: hot ? "#ff6b6b" : "#fff" });
      });
      c.restore();
    }
  };
}

/** The red "!" over the grey screen — the only colour in the shot. */
function redMark(ctx: Ctx, abs: number, x: number, y: number, s: number) {
  const k = clamp(easeOut(phase(abs, FAIL, FAIL + 0.2)));
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * (0.4 + 0.6 * k), s * (0.4 + 0.6 * k));
  glow(ctx, 0, 0, 70, "rgba(240,67,67,0.45)", k);
  ctx.fillStyle = "#f04343";
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, "!", 0, 1, { size: 30, font: F.ui, weight: 700, fill: "#fff" });
  ctx.restore();
}

function shotChat(ctx: Ctx, abs: number) {
  const zoom = easeIn(phase(abs, FAIL, FAIL + 0.35)) * (1 - smooth(phase(abs, 58.6, 59.0)));
  const [sx, sy] = shake(abs, zoom > 0.9 && abs < FAIL + 0.6 ? 8 : 0);
  const [hx, hy, hr] = handheld(abs, 4, 8);
  const ps = 0.72;
  const [mx, my] = failMark(ctx, true);
  const fx = 540 + (mx - SW / 2) * ps,
    fy = 800 + (my - SH / 2) * ps;
  const view = (c: Ctx) => camera(c, fx, fy, 1 + 0.05 * easeInOut(phase(abs, N2, FAIL)) + zoom * 0.9, hr, sx + hx, sy + hy);
  // 光影: the street behind the phone, far out of focus (the lamp he stopped under, the ones further on)
  streetBokeh(ctx, abs, hx);
  grade(ctx, GREY, (g) => {
    g.save();
    view(g);
    screenSpill(g, 540, 800, ps, 1);
    phone(g, 540, 800, ps, 0, chat(abs));
    g.restore();
  });
  if (abs >= FAIL) {
    ctx.save();
    view(ctx);
    redMark(ctx, abs, fx, fy, ps);
    ctx.restore();
  }
  if (abs > FAIL + 0.3 && abs < 58.65) {
    const k = backOut(phase(abs, FAIL + 0.3, FAIL + 0.55));
    ctx.save();
    ctx.translate(760, 470);
    ctx.rotate(0.1);
    ctx.scale(k, k);
    text(ctx, "发送失败", 0, 0, { size: 86, font: F.cn, fill: "#ff4d4d", stroke: "#fff", lw: 14 });
    ctx.restore();
  }
}

function shotDelete(ctx: Ctx, abs: number) {
  const [hx, hy, hr] = handheld(abs, 4, 8);
  const ps = 0.72;
  streetBokeh(ctx, abs, hx);
  grade(ctx, GREY, (g) => {
    screenSpill(g, 540 + hx, 800 + hy, ps, 1);
    phone(g, 540 + hx, 800 + hy, ps, hr, chat(abs));
  });
  if (abs < 59.55) {
    const [mx, my] = failMark(ctx, abs < 59.0);
    redMark(ctx, abs, 540 + hx + (mx - SW / 2) * ps, 800 + hy + (my - SH / 2) * ps, ps);
  }
}

// ---------------------------------------------------------------- 26.87 – 29.48 23:58, he lights the candle himself
function shotDesk(ctx: Ctx, abs: number) {
  const lit = smooth(phase(abs, MATCH + 0.15, MATCH + 0.5));
  const reach = smooth(phase(abs, MATCH - 0.5, MATCH - 0.08)) * (1 - smooth(phase(abs, MATCH + 0.4, MATCH + 0.8)));
  const [hx, hy, hr] = handheld(abs, 5, 9);
  const zoom = 1.08 - 0.08 * easeInOut(phase(abs, N3b, N4));
  // his left hand brings the match to the wick (kid units: the wick is at about -190, 145)
  const hand: Pt = [-92 + (-150 + 92) * reach, 396 + (100 - 396) * reach];
  const kid: KidPose = {
    hat: abs > 62.2,
    eyes: blinkEyes(abs, 3, "sleepy"),
    look: reach > 0.3 ? [-0.9, 0.8] : [-0.55, 0.7],
    headY: Math.sin(abs * 1.6) * 3,
    arms: "custom",
    handL: hand,
    handR: [92, 396],
    shapeL: reach > 0.4 ? "hold" : "flat",
    shapeR: "flat",
    grip: reach > 0.2 ? (k) => inkLine(k, [hand, [hand[0] - 40, hand[1] + 38]], 2301, 4, "#d8b07a") : undefined,
  };
  // 光影: the match flares at the wick and for a moment it is the light in the room — out of the dark his face
  // jumps up warm, his shadow leaps up the wall — then the candle takes over, steady
  const fT = phase(abs, MATCH - 0.1, MATCH + 0.62);
  const flare = fT <= 0 || fT >= 1 ? 0 : Math.min(1, (abs - MATCH + 0.1) / 0.05) * (1 - easeIn(fT)) * (0.92 + 0.08 * Math.sin(abs * 47));
  const head: Pt = [600 + 1.1 * (hand[0] - 40), 810 + 1.1 * (hand[1] + 38)];
  const shot = (c: Ctx, layer: "scene" | "flame") => {
    c.save();
    camera(c, 540, 900, zoom, hr, hx, hy);
    birthdayDesk(c, abs, { lit, kid, phoneOn: 1 - phase(abs, N3b, N3b + 1.2), dark: 0.93, layer, clue: 1, light: { at: head, k: 0.95 * flare } });
    c.restore();
  };
  grade(ctx, GREY, (g) => shot(g, "scene"));
  shot(ctx, "flame");
  // the match flaring at the wick (warm, over the grey)
  if (abs > MATCH - 0.12 && abs < MATCH + 0.6) {
    const f = phase(abs, MATCH - 0.12, MATCH + 0.6);
    ctx.save();
    camera(ctx, 540, 900, zoom, hr, hx, hy);
    glow(ctx, 392, 958, 260, "rgba(255,200,120,0.9)", Math.sin(Math.PI * f));
    ctx.restore();
  }
  card(ctx, "23:58", 70, 330, smooth(phase(abs, N3b + 0.2, N3b + 0.5)));
}

// ---------------------------------------------------------------- 29.48 – 33.66 the wish, blown out
function shotWish(ctx: Ctx, abs: number) {
  const wishWrite = phase(abs, 63.9, 65.0);
  const blow = abs >= BLOW;
  const out = abs >= OUT;
  const smoke = phase(abs, OUT, 67.0);
  const [hx, hy, hr] = handheld(abs, 4, 10);
  const z = 1 + 0.16 * easeInOut(phase(abs, N4, OUT));
  const kid: KidPose = {
    hat: true,
    eyes: abs > 63.6 ? "shut" : blinkEyes(abs, 3, "sleepy"),
    mouth: blow && !out ? "blow" : "frown",
    look: [-0.5, 0.6],
  };
  const shot = (c: Ctx, layer: "scene" | "flame") => {
    c.save();
    camera(c, 520, 860, z, hr, hx, hy);
    birthdayDesk(c, abs, { lit: out ? 0 : 1, smoke: out ? smoke : 0, kid, dark: out ? 0.96 : 0.86, layer, clue: 1 });
    c.restore();
  };
  grade(ctx, GREY, (g) => shot(g, "scene"));
  shot(ctx, "flame");
  if (!out) {
    const a = smooth(phase(abs, N4 + 0.3, N4 + 0.6));
    text(ctx, "许个愿吧", 540, 380, { size: 64, font: F.cn, fill: "#ffe7b0", alpha: a * (1 - phase(abs, 63.7, 63.9)), stroke: C.ink, lw: 10 });
    if (wishWrite > 0) {
      ctx.save();
      ctx.translate(540, 390);
      ctx.rotate(-0.03);
      text(ctx, writeOn("希望…有人记得我", wishWrite), 0, 0, { size: 84, font: F.pen, fill: "#fff3d6", stroke: C.ink, lw: 12 });
      ctx.restore();
    }
  } else {
    // in the dark, the wish lingers and fades
    text(ctx, "希望…有人记得我", 540, 390, { size: 84, font: F.pen, fill: "#fff3d6", alpha: 0.6 * (1 - phase(abs, OUT, 66.8)) });
  }
}

export function createScene(options: SceneOptions) {
  return designScene(options, T0, (ctx, abs) => {
    if (abs < WALK) shotBakery(ctx, abs);
    else if (abs < N2) shotWalk(ctx, abs);
    else if (abs < N3) shotChat(ctx, abs);
    else if (abs < N3b) shotDelete(ctx, abs);
    else if (abs < N4) shotDesk(ctx, abs);
    else shotWish(ctx, abs);
    // night (光影): lamps, screens and the flame bleed a soft glow into the dark
    bloom(ctx, 0.3);
  });
}
