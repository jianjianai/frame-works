// 现在（凌晨三点，她的房间）：和他那边镜像的构图（分镜 9、10、13）——她也醒着，坐在床上，手机的冷光从下往上照着脸；
// 房间是暖一点的暗紫，窗在右边（他的在左边），墙上一串粉色的小灯。
import { C, Ctx, H, Pt, blob, bokehDisc, camera, figureMask, fillBg, filtered, glow, hash, inkLine, onFigure, oval, paint, rimLight, shaded, vgrad } from "@materials/s0rrow/code/draw";
import { KidPose, drawKid } from "@materials/s0rrow/code/kid";
import { phoneBack } from "@materials/s0rrow/code/mirrors/phoneui";
import { PARALLAX, PARALLAX_ZOOM } from "./present";

/** where she sits up in bed: the same place and size as him (the mirror) */
export const HER = { x: 540, y: 580, s: 1.7 };
/** her face in the black glass of her phone at the end of shot 10 (design units, drawKid scale) — her memory (shot
 *  11) opens on her face at seventeen in exactly this place */
export const MIRROR_FACE = { x: 540, y: 640, s: 1.6 };
/** her arms (head units): elbows in, hands up at the phone under her chin */
const ARMS_HER = { elbowL: [-140, 420] as Pt, elbowR: [140, 420] as Pt, handL: [-56, 284] as Pt, handR: [56, 284] as Pt };

/** her phone, its back to us, and two round hands (head units, in drawKid's grip) */
function herPhoneHands(c: Ctx) {
  phoneBack(c, 0, 236, 108, 204, -0.03, false);
  for (const sd of [-1, 1]) {
    shaded(c, () => oval(c, sd * 56, 284, 29, 27, 9250 + sd, 0.8), C.skin, () => {
      oval(c, sd * 56 - 12, 298, 22, 18, 9252 + sd, 0.6);
      paint(c, "rgba(196,150,96,0.38)", null);
    }, C.ink, 5);
  }
}

/** her room behind her, far out of focus: the moonlit window on the right with the town's lights, a string of pink
 *  lights along the wall, the pillows behind her shoulders. `dawn` 0..1: the window turns pale blue (the night she
 *  stayed up, shot 12) */
export function herBack(ctx: Ctx, abs: number, dawn = 0) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, 990, 520, 520 + 260 * dawn, `rgba(${Math.round(150 - 40 * dawn)},${Math.round(130 + 60 * dawn)},235,${(0.2 + 0.32 * dawn).toFixed(3)})`);
  glow(ctx, 1020, 470, 200 + 120 * dawn, `rgba(205,${Math.round(190 + 40 * dawn)},255,${(0.18 + 0.3 * dawn).toFixed(3)})`);
  ctx.restore();
  for (let i = 0; i < 7; i++) bokehDisc(ctx, 820 + hash(i * 4.3 + 1) * 230, 600 + hash(i * 1.7 + 2) * 300, 12 + 10 * hash(i * 2.2 + 3), "255,214,150", 0.2);
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    const x = 920 - u * 960;
    const y = 300 + 110 * Math.sin(u * Math.PI * 0.9) + (i % 2) * 20;
    const tw = 0.85 + 0.15 * Math.sin(abs * 1.5 + i * 2.1);
    bokehDisc(ctx, x, y, 34 + 22 * hash(i * 5.7 + 7), "255,168,170", 0.3 * tw);
  }
  filtered(ctx, "blur(7px)", (c) => {
    c.fillStyle = "#24182f";
    c.fillRect(-60, 980, 1200, 1000);
    blob(c, [[990, 1010], [880, 940], [610, 930], [560, 1000], [580, 1230], [970, 1240]], 9260, 2);
    paint(c, "#3b2a4f", null);
    blob(c, [[500, 1000], [440, 930], [180, 936], [70, 1000], [80, 1240], [490, 1230]], 9261, 2);
    paint(c, "#37284a", null);
  }, "herBack");
}

/** the duvet over her knees (plum), the phone's light on the tops of the two hills */
const KNEES_HER: Pt[] = [[390, 1222], [682, 1222]];
function herBlanket(ctx: Ctx) {
  const edge: Pt[] = [
    [-60, 1366], [88, 1346], [188, 1302], [288, 1252], [390, 1222], [476, 1262], [540, 1296], [602, 1260], [682, 1222],
    [780, 1252], [880, 1304], [1000, 1352], [1140, 1372], [1140, 2000], [-60, 2000],
  ];
  shaded(ctx, () => blob(ctx, edge, 9270, 1.6), "#4a3360", () => {
    const g = ctx.createLinearGradient(0, 1210, 0, 1720);
    g.addColorStop(0, "rgba(190,190,255,0.32)");
    g.addColorStop(0.22, "rgba(190,190,255,0.06)");
    g.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = g;
    ctx.fillRect(-60, 1200, 1200, 800);
    for (const [kx, ky] of KNEES_HER) glow(ctx, kx, ky + 30, 150, "rgba(200,195,255,0.2)");
    for (const [kx, ky] of KNEES_HER) {
      inkLine(ctx, [[kx + 10, ky + 22], [kx + 44, ky + 110], [kx + 70, ky + 200]], 9271 + kx, 3, "#2e2142");
      inkLine(ctx, [[kx - 14, ky + 30], [kx - 40, ky + 120], [kx - 52, ky + 196]], 9272 + kx, 3, "#2e2142");
    }
    inkLine(ctx, [[540, 1306], [534, 1380], [542, 1460]], 9273, 3, "#2e2142");
  }, C.ink, 6);
}

/** her pose in bed: pink pajamas, the phone under her chin (the face is the caller's) */
export const herPose = (face: KidPose): KidPose => ({
  who: "girl",
  body: "bust",
  outfit: "pajamas",
  arms: "custom",
  ...ARMS_HER,
  shapeL: "hidden",
  shapeR: "hidden",
  grip: herPhoneHands,
  seed: 62,
  ...face,
});

export interface HerShot {
  pose: KidPose;
  zoom: number;
  rot: number;
  dx: number;
  dy: number;
  cx?: number;
  cy?: number;
  /** 0..1 the screen's light on her (0 = the phone dark) */
  light?: number;
  /** 0..1 dawn coming up in the window behind her */
  dawn?: number;
}
/** Her sitting up in bed at 3 a.m. (his shot, mirrored): the room behind (parallax), the screen's cold light from under
 *  her chin, the pink lights' warm rim from the right, the duvet over her knees. */
export function herBedScene(c: Ctx, abs: number, o: HerShot) {
  const cx = o.cx ?? 540,
    cy = o.cy ?? 700;
  const light = o.light ?? 1;
  fillBg(c, vgrad(c, 0, H, [[0, "#140f26"], [0.6, "#1d1534"], [1, "#100b1f"]]));
  c.save();
  camera(c, cx, cy, 1 + PARALLAX_ZOOM * (o.zoom - 1), o.rot * 0.6, o.dx * PARALLAX, o.dy * PARALLAX);
  herBack(c, abs, o.dawn ?? 0);
  c.restore();
  c.save();
  camera(c, cx, cy, o.zoom, o.rot, o.dx, o.dy);
  const her = (k: Ctx) => drawKid(k, HER.x, HER.y, HER.s, o.pose);
  her(c);
  const m = figureMask(c, her, "bedHer");
  // (her pink pajamas and pale skin take the light more than his dark hoodie: a deeper dark, a softer screen light)
  onFigure(c, m, (k) => {
    const g = k.createRadialGradient(HER.x, HER.y + 60, 120, HER.x, HER.y + 60, 900);
    g.addColorStop(0, `rgba(16,10,36,${(0.4 + 0.3 * (1 - light)).toFixed(3)})`);
    g.addColorStop(1, `rgba(16,10,36,${(0.76 + 0.12 * (1 - light)).toFixed(3)})`);
    k.fillStyle = g;
    k.fillRect(-200, -200, 1500, 2400);
  });
  const chin = HER.y + 140 * HER.s;
  const phoneCut = (k: Ctx) => {
    k.beginPath();
    k.roundRect(HER.x - 56 * HER.s, HER.y + 133 * HER.s, 112 * HER.s, 208 * HER.s, 22 * HER.s);
    k.fill();
  };
  if (light > 0.01) {
    // screen-blended light greys the ink lines it covers: keep it to her chin and the lower face
    onFigure(c, m, (k) => {
      const g = k.createRadialGradient(HER.x, chin + 20, 20, HER.x, chin - 30, 400);
      g.addColorStop(0, "rgba(215,228,255,0.95)");
      g.addColorStop(0.35, "rgba(160,185,255,0.42)");
      g.addColorStop(1, "rgba(150,180,255,0)");
      k.fillStyle = g;
      k.fillRect(-200, -200, 1500, 2400);
    }, "screen", 0.5 * light, phoneCut);
  }
  // the pink lights and the window behind her on the right: a warm rim (the pale dawn, once it comes)
  rimLight(c, m, 1, -0.5, 6, (o.dawn ?? 0) > 0.5 ? "rgb(190,215,255)" : "rgb(255,170,190)", 0.45 + 0.25 * (o.dawn ?? 0), "lighter", 6);
  if (light > 0.01) {
    c.save();
    c.globalCompositeOperation = "lighter";
    glow(c, HER.x, chin + 4, 170, "rgba(190,210,255,0.22)", light);
    c.restore();
  }
  herBlanket(c);
  c.restore();
}
