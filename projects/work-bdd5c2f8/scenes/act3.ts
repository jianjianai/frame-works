import type { SceneOptions } from "../../../src/engine/types";
import { phase, sampleKeys, smooth } from "../../../src/engine/math";
import { C, Ctx, H, Pt, W, blob, camera, card, designScene, easeOut, flash, inkLine, paint, text, F } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { CAST, drawPerson } from "./lib/people";
import { heart, heartsRise, hedge, lampPost, parkSky, swingSet } from "./lib/sets";

/** ACT 3 (33.39 – 50.48s): the bridge. The swing set from the cover, couples walking past —
 *  and 小雨 on the other swing, trying to get his attention while he has his earbuds in. */
const T0 = 33.386;
const P2 = 37.6;
const P2b = 40.95;
const P3 = 41.75;
const P3b = 44.55;
const P4 = 47.75;
const END = 50.475;

const dusk = (abs: number) =>
  sampleKeys(abs, [
    [T0, 0.04],
    [P3, 0.28],
    [P4, 0.6],
    [END, 0.86],
  ]);

interface WideOpts {
  yu: boolean;
  yuTurn: number;
  yuWave: number;
  kidLook: [number, number];
  kidEyes?: "sleepy" | "angry" | "sad";
  reach?: number;
  emptySince?: number;
}
function wide(ctx: Ctx, abs: number, o: WideOpts) {
  const d = dusk(abs);
  parkSky(ctx, d);
  hedge(ctx, 1150, d);
  const kidAngle = 0.07 * Math.sin(abs * 1.7);
  let yuAngle = 0.05 * Math.sin(abs * 1.4 + 1);
  if (!o.yu && o.emptySince !== undefined) {
    const t = Math.max(0, abs - o.emptySince + 1.2);
    yuAngle = 0.22 * Math.exp(-t * 0.35) * Math.sin(t * 2.6);
  }
  swingSet(ctx, 540, 430, 0.95, d, {
    angles: [kidAngle, yuAngle],
    left: (c, sx, sy, a) => {
      c.save();
      c.translate(sx, sy);
      c.rotate(-a);
      drawKid(c, 0, -242, 0.55, {
        body: "full",
        legs: "sit",
        arms: o.reach ? "reach" : "swing",
        reach: o.reach,
        eyes: o.kidEyes ?? "sleepy",
        look: o.kidLook,
        mouth: "frown",
      });
      c.restore();
    },
    right: o.yu
      ? (c, sx, sy, a) => {
          c.save();
          c.translate(sx, sy);
          c.rotate(-a);
          drawPerson(c, 0, -212, 0.6, { ...CAST.yu, legs: "sit", arms: o.yuWave > 0 ? "waveL" : "hold", wave: o.yuWave, walk: abs * 3, turn: o.yuTurn });
          c.restore();
        }
      : undefined,
  });
}

function couple(ctx: Ctx, x: number, y: number, s: number, abs: number, a: typeof CAST.a, b: typeof CAST.a, seed: number) {
  const ph = abs * 7 + seed;
  drawPerson(ctx, x - 175 * s, y, s, { ...a, legs: "walk", walk: ph, arms: "handR", turn: 0.6 });
  drawPerson(ctx, x + 175 * s, y, s, { ...b, legs: "walk", walk: ph + Math.PI, arms: "handL", turn: -0.6 });
}

function shotCouples(ctx: Ctx, abs: number) {
  const t = abs - T0;
  // 小雨 keeps glancing at him (rewatch clue)
  const glance = (abs > 34.5 && abs < 35.7) || (abs > 36.3 && abs < 37.2) ? 1 : 0;
  ctx.save();
  camera(ctx, 540, 800, 1.04 - 0.04 * smooth(t / 4));
  wide(ctx, abs, { yu: true, yuTurn: glance ? -0.95 : 0.35, yuWave: 0, kidLook: [-0.9, 0.3] });
  // couples walking past in the foreground
  couple(ctx, -400 + t * 420, 1010, 0.62, abs, CAST.c, CAST.b, 1);
  couple(ctx, -1300 + t * 470, 1050, 0.66, abs, CAST.a, CAST.d, 2);
  heartsRise(ctx, abs, 6, 900, 0.8);
  ctx.restore();
  card(ctx, "傍晚 18:20 · 公园", 70, 330, smooth(phase(abs, T0 + 0.2, T0 + 0.5)) * (1 - phase(abs, P2 - 0.4, P2 - 0.1)));
  flash(ctx, 1 - phase(abs, T0, T0 + 0.6), "#f6c28b");
}

function sleeveArm(ctx: Ctx, pts: [number, number][], color: string, seed: number, w = 120) {
  inkLine(ctx, pts, seed, w + 12, C.ink, 1.5);
  inkLine(ctx, pts, seed, w, color, 1.5);
}
// ---- clasped hands (inverted V): each hand is one silhouette (outline stroked, then filled),
// and each comes out of its sleeve. His hand (left, in front); her fingers curl over its back.
const HIS = "#f6e1b6";
const HERS = "#dfae74";
/** Hand seen from the back as one rounded shape: wrist at (wx, wy), pointing along angle `ang`. */
function handPts(wx: number, wy: number, ang: number, len: number, wid: number): Pt[] {
  const out: Pt[] = [];
  const n = 18;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const c = Math.cos(t),
      sn = Math.sin(t);
    const k = Math.pow(Math.pow(Math.abs(c), 2.6) + Math.pow(Math.abs(sn), 2.6), -1 / 2.6);
    // local: x from 0 (wrist) to 2·len (fingertips); a little wider across the knuckles
    const lx = len + c * len * k,
      ly = sn * wid * k * (c > 0 ? 1.05 : 0.85);
    out.push([wx + lx * Math.cos(ang) - ly * Math.sin(ang), wy + lx * Math.sin(ang) + ly * Math.cos(ang)]);
  }
  return out;
}
const along = (wx: number, wy: number, ang: number, lx: number, ly: number): Pt => [wx + lx * Math.cos(ang) - ly * Math.sin(ang), wy + lx * Math.sin(ang) + ly * Math.cos(ang)];
function silhouette(ctx: Ctx, shapes: Pt[][], seed: number, fill: string) {
  ctx.lineJoin = "round";
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 13;
  shapes.forEach((p, i) => {
    blob(ctx, p, seed + i, 1.3);
    ctx.stroke();
  });
  ctx.fillStyle = fill;
  shapes.forEach((p, i) => {
    blob(ctx, p, seed + i, 1.3);
    ctx.fill();
  });
}
/** A finger seen from the back: capsule from base to tip. */
function fingerPts(bx: number, by: number, tx: number, ty: number, w: number): Pt[] {
  const ang = Math.atan2(ty - by, tx - bx);
  const L = Math.hypot(tx - bx, ty - by);
  return [along(bx, by, ang, 0, -w), along(bx, by, ang, L - w * 0.9, -w), along(bx, by, ang, L, 0), along(bx, by, ang, L - w * 0.9, w), along(bx, by, ang, 0, w)];
}
/** Fingers interlaced: his and hers alternate across the middle, thumbs crossed on top. */
function claspedHands(ctx: Ctx, squeeze: number) {
  ctx.save();
  ctx.translate(540, 820);
  ctx.scale(1 + 0.06 * squeeze, 1 + 0.06 * squeeze);
  ctx.translate(-540, -820);
  const hisPalm: Pt[] = [[392, 880], [446, 790], [520, 760], [556, 792], [556, 880], [506, 930], [420, 940]];
  const herPalm: Pt[] = hisPalm.map(([x, y]) => [1080 - x, y] as Pt);
  const hisThumb = fingerPts(470, 800, 566, 728, 22);
  const herThumb = fingerPts(610, 800, 520, 738, 22);
  // her hand (behind) and his (in front): each palm + thumb is one silhouette
  silhouette(ctx, [herPalm, herThumb], 962, HERS);
  sleeveArm(ctx, [[1200, 1500], [880, 1080], [690, 905]], CAST.c.top!, 961);
  silhouette(ctx, [hisPalm, hisThumb], 966, HIS);
  sleeveArm(ctx, [[-120, 1500], [200, 1080], [390, 905]], CAST.b.top!, 960);
  // interlaced fingers: each one crosses over the other hand
  const rows = [778, 816, 854, 892];
  rows.forEach((y, i) => {
    const his = i % 2 === 0;
    const bx = his ? 508 : 572,
      tx = his ? 622 : 458,
      skin = his ? HIS : HERS;
    blob(ctx, fingerPts(bx, y - 4, tx, y + 12, 18.5), 980 + i, 0.6);
    paint(ctx, skin, C.ink, 5);
    // the finger grows out of its own palm: hide the outline at its base
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(bx + (his ? -6 : 6), y - 4, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // knuckle crease
    const mid = along(bx, y - 4, Math.atan2(16, tx - bx), Math.abs(tx - bx) * 0.55, 0);
    inkLine(ctx, [[mid[0], mid[1] - 9], [mid[0] + (his ? 3 : -3), mid[1]], [mid[0], mid[1] + 9]], 990 + i, 2.5, "#a8865c");
  });
  ctx.restore();
}
function shotHands(ctx: Ctx, abs: number) {
  if (abs < P2b) {
    const d = dusk(abs);
    parkSky(ctx, d);
    heartsRise(ctx, abs, 12, 950, 0.9);
    const squeeze = Math.max(0, Math.sin(phase(abs, 40.4, 40.95) * Math.PI));
    ctx.save();
    camera(ctx, 540, 820, 1 + 0.06 * phase(abs, P2, P2b) + 0.04 * squeeze);
    claspedHands(ctx, squeeze);
    if (squeeze > 0.05) {
      ctx.save();
      ctx.globalAlpha = squeeze;
      for (let i = 0; i < 5; i++) {
        const an = -Math.PI / 2 + (i - 2) * 0.45;
        inkLine(ctx, [[540 + Math.cos(an) * 200, 790 + Math.sin(an) * 200], [540 + Math.cos(an) * 250, 790 + Math.sin(an) * 250]], 995 + i, 7);
      }
      heart(ctx, 540, 520 - squeeze * 30, 34, "#ff6f9c", 999);
      ctx.restore();
    }
    ctx.restore();
  } else {
    // his own hand, gripping the cold chain alone
    const d = dusk(abs);
    parkSky(ctx, d);
    ctx.save();
    camera(ctx, 540, 820, 1.05 + 0.05 * phase(abs, P2b, P3));
    ctx.save();
    ctx.setLineDash([26, 14]);
    inkLine(ctx, [[560, -100], [560, 1700]], 980, 16, "#4b4f55");
    ctx.restore();
    sleeveArm(ctx, [[1200, 1400], [880, 1100], [600, 880]], C.hoodie, 981);
    blob(ctx, [[480, 800], [580, 760], [650, 820], [640, 940], [540, 960], [470, 900]], 982, 2);
    paint(ctx, C.skin, C.ink, 7);
    for (let i = 0; i < 3; i++) inkLine(ctx, [[500, 820 + i * 34], [560, 830 + i * 34]], 983 + i, 5);
    ctx.restore();
  }
}

function shotJealous(ctx: Ctx, abs: number) {
  if (abs < P3b) {
    // medium: she waves at him; he's glaring off at the couples and never sees her
    const wave = smooth(phase(abs, 42.5, 42.9)) * (1 - smooth(phase(abs, 43.9, 44.3)));
    ctx.save();
    camera(ctx, 540, 780, 1.55);
    wide(ctx, abs, { yu: true, yuTurn: -0.95, yuWave: wave, kidLook: [-1, 0.1] });
    ctx.restore();
    if (wave > 0.3) {
      ctx.save();
      ctx.globalAlpha = (wave - 0.3) / 0.7;
      ctx.translate(860, 450);
      ctx.rotate(0.08);
      text(ctx, "喂～", 0, 0, { size: 64, font: F.cn, fill: "#fff", stroke: C.ink, lw: 10 });
      ctx.restore();
    }
  } else {
    const hate = smooth(phase(abs, 44.55, 44.9));
    const jealous = smooth(phase(abs, 46.6, 47.0));
    parkSky(ctx, dusk(abs));
    heartsRise(ctx, abs, 10, 995, 0.7, jealous);
    ctx.save();
    camera(ctx, 540, 800, 1 + 0.08 * phase(abs, P3b, P4));
    ctx.save();
    ctx.setLineDash([26, 14]);
    inkLine(ctx, [[380, -100], [372, 920]], 996, 12, "#4b4f55");
    inkLine(ctx, [[700, -100], [708, 920]], 997, 12, "#4b4f55");
    ctx.restore();
    drawKid(ctx, 540, 760, 1.25, { body: "bust", arms: "swing", eyes: hate > 0.5 ? "angry" : "sleepy", look: [-0.8, 0], mouth: jealous > 0.5 ? "wobble" : "flat" });
    // scribble storm cloud
    if (hate > 0) {
      ctx.save();
      ctx.globalAlpha = hate;
      blob(ctx, [[360, 330], [400, 250], [480, 230], [540, 190], [630, 220], [700, 260], [730, 330], [660, 380], [540, 370], [420, 380]], 998, 4);
      paint(ctx, "#3a3a46", C.ink, 6);
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (let i = 0; i < 48; i++) {
        const a = i * 1.7 + Math.floor(abs * 8) * 0.9;
        const x = 545 + Math.cos(a) * (60 + (i % 5) * 26) * 1.5,
          y = 300 + Math.sin(a * 1.3) * 40;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // little lightning bolt
      inkLine(ctx, [[560, 380], [530, 440], [570, 440], [540, 510]], 999, 8, "#ffe45c");
      ctx.restore();
    }
    ctx.restore();
    if (jealous > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = `rgba(120,230,120,${0.45 * jealous})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }
}

function shotWhyNotMe(ctx: Ctx, abs: number) {
  const reach = easeOut(phase(abs, 48.4, 49.6));
  ctx.save();
  camera(ctx, 540, 800, 1.12 - 0.1 * smooth(phase(abs, P4, END)));
  wide(ctx, abs, { yu: false, yuTurn: 0, yuWave: 0, kidLook: [1, 0.2], kidEyes: "sad", reach, emptySince: P4 });
  lampPost(ctx, 80, 560, abs, 49.0);
  ctx.restore();
  // fade into night for act 4
  flash(ctx, phase(abs, 50.1, END) * 0.9, "#0b0d1c");
}

export function createScene(options: SceneOptions) {
  return designScene(options, T0, (ctx, abs) => {
    if (abs < P2) shotCouples(ctx, abs);
    else if (abs < P3) shotHands(ctx, abs);
    else if (abs < P4) shotJealous(ctx, abs);
    else shotWhyNotMe(ctx, abs);
  });
}
