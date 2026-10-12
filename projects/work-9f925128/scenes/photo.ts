// 她 2023-06-09（毕业那天）发的那张照片：傍晚的教学楼走廊，一个穿校服的男生背对镜头站在窗边看夕阳，左手搭在窗台上，
// 手腕上一根红绳（彩蛋：和现在的他手腕上那根是同一根）。右边关着的那扇玻璃里，淡淡地映着他的脸（放大才看得清：反转）。
// 照片坐标 600×800（3:4），postScreen 把它画进手机里；后面放大倒影、回忆里也用同一张。
import { clamp } from "@frame/engine/math";
import { C, Ctx, Pt, blob, figureMask, filtered, glow, hash, inkLine, onFigure, paint, poly, rimLight, shaded, vgrad } from "@materials/s0rrow/code/draw";
import { KidPose, drawKid } from "@materials/s0rrow/code/kid";

export const PW = 600;
export const PH = 800;
/** the window opening, the closed right sash's glass, the top of the sill */
export const WIN = { x0: 34, x1: 566, y0: 70, y1: 618 };
export const GLASS = { x0: 316, x1: 552, y0: 182, y1: 606 };
export const SILL = 618;
/** the horizon outside */
const HZ = 540;
/** the boy: head centre and scale (photo units) */
export const BOY = { x: 338, y: 420, s: 0.44 };
export const BOY_POSE: KidPose = {
  view: "back",
  body: "bust",
  hair: "short",
  outfit: "uniform",
  bracelet: "red",
  arms: "custom",
  handL: [-236, 404],
  bendL: 1,
  shapeR: "hidden",
  seed: 77,
};
/** where the red string is (photo units), for the zoom later */
export const WRIST: Pt = [BOY.x - 236 * BOY.s, BOY.y + 404 * BOY.s];
/** his face reflected in the glass (front view, mirrored), right of his head */
export const REFLECT = { x: 470, y: 412, s: 0.36 };
export const REFLECT_POSE: KidPose = { body: "head", hair: "short", eyes: "sad", look: [-0.3, 0.1], mouth: "flat", seed: 78 };

const SUN: Pt = [128, HZ - 2];

/** The sky and the school grounds outside the window (drawn over the whole opening). */
function outside(ctx: Ctx) {
  const { x0, x1, y0, y1 } = WIN;
  ctx.fillStyle = vgrad(ctx, y0, HZ + 20, [
    [0, "#3a4380"],
    [0.32, "#8a5d93"],
    [0.62, "#e47f72"],
    [0.86, "#f7b46c"],
    [1, "#ffe0a3"],
  ]);
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  // long evening clouds, lit underneath
  const clouds: [number, number, number, number][] = [
    [60, 170, 230, 18],
    [230, 236, 300, 14],
    [10, 312, 170, 11],
    [330, 130, 260, 16],
    [150, 396, 210, 9],
  ];
  clouds.forEach(([cx, cy, w, h], i) => {
    blob(ctx, [[cx, cy], [cx + w * 0.3, cy - h], [cx + w * 0.7, cy - h * 0.8], [cx + w, cy], [cx + w * 0.6, cy + h * 0.5], [cx + w * 0.2, cy + h * 0.6]], 4200 + i, 1.2);
    paint(ctx, "rgba(176,104,150,0.55)", null);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = "rgba(255,186,140,0.6)";
    ctx.fillRect(cx, cy + h * 0.1, w, h);
    ctx.restore();
  });
  // the sun, low on the left, and its glow
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, SUN[0], SUN[1], 260, "rgba(255,170,90,0.55)");
  glow(ctx, SUN[0], SUN[1], 90, "rgba(255,236,190,0.9)");
  ctx.restore();
  ctx.fillStyle = "#fff6dc";
  ctx.beginPath();
  ctx.arc(SUN[0], SUN[1], 30, 0, Math.PI * 2);
  ctx.fill();
  // far hills and town in the haze
  poly(ctx, [[x0, HZ + 2], [80, HZ - 10], [150, HZ - 4], [210, HZ - 18], [300, HZ - 6], [380, HZ - 20], [470, HZ - 8], [x1, HZ - 14], [x1, HZ + 20], [x0, HZ + 20]], 4210, 1);
  paint(ctx, "rgba(150,86,110,0.75)", null);
  // a row of trees along the far edge of the field
  for (let i = 0; i < 9; i++) {
    const tx = x0 + 10 + i * 46 + hash(i * 3.3) * 18,
      r = 18 + hash(i * 7.1) * 12;
    blob(ctx, [[tx - r, HZ + 20], [tx - r * 0.8, HZ + 2 - r * 0.5], [tx, HZ - 4 - r * 0.9], [tx + r * 0.8, HZ + 2 - r * 0.5], [tx + r, HZ + 20]], 4220 + i, 1);
    paint(ctx, "#4b3a52", null);
  }
  // the sports field: green, then the red running track sweeping round, lit by the low sun
  poly(ctx, [[x0, HZ + 16], [x1, HZ + 12], [x1, y1], [x0, y1]], 4235, 0.6);
  paint(ctx, "#5f7a4c", null);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, HZ + 12, x1 - x0, y1 - HZ - 12);
  ctx.clip();
  ctx.lineWidth = 26;
  ctx.strokeStyle = "#c45a40";
  ctx.beginPath();
  ctx.ellipse(250, HZ + 112, 300, 80, -0.04, Math.PI * 1.02, Math.PI * 1.98);
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "rgba(255,240,225,0.75)";
  for (const d of [-9, 0, 9]) {
    ctx.beginPath();
    ctx.ellipse(250, HZ + 112, 300 + d, 80 + d * 0.3, -0.04, Math.PI * 1.02, Math.PI * 1.98);
    ctx.stroke();
  }
  ctx.restore();
  // the other teaching block across the field, in its own shadow (it is what the glass reflects him against)
  const b = { x: 392, y: 236 };
  shaded(ctx, () => poly(ctx, [[b.x, b.y + 8], [x1 + 30, b.y - 10], [x1 + 30, HZ + 24], [b.x, HZ + 24]], 4240, 0.8), "#3d3354", () => {
    // rows of windows, a few lit
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 6; c++) {
        const wx = b.x + 14 + c * 30,
          wy = b.y + 26 + r * 32 - c * 1.6;
        const lit = hash(r * 7.3 + c * 3.1) > 0.72;
        ctx.fillStyle = lit ? "rgba(255,206,140,0.85)" : "rgba(24,20,40,0.55)";
        ctx.fillRect(wx, wy, 18, 18);
      }
    // the roof edge catches the last of the sun
    inkLine(ctx, [[b.x, b.y + 9], [x1 + 30, b.y - 9]], 4250, 4, "rgba(255,170,120,0.9)", 0.4);
  }, null);
}

/** Inside the closed sash: a blue-grey tint, the corridor's tube lights and the boy's face, faint (`reflect`). */
function glassReflections(ctx: Ctx, reflect: number) {
  const { x0, x1, y0, y1 } = GLASS;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, x1 - x0, y1 - y0);
  ctx.clip();
  ctx.fillStyle = "rgba(120,140,190,0.16)";
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  // the corridor's tube lights behind the camera, reflected near the top of the pane
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const [lx, ly, lw] of [[350, 206, 120], [470, 214, 90]] as [number, number, number][]) {
    ctx.fillStyle = "rgba(225,235,255,0.4)";
    ctx.fillRect(lx, ly, lw, 5);
    glow(ctx, lx + lw / 2, ly + 2, lw * 0.7, "rgba(200,215,255,0.16)");
  }
  ctx.restore();
  // his face, mirrored, cold and very faint — the camera stands behind and to his left, so it shows right of his
  // head, against the dark block across the field. Only the face, its edges melting into the glass.
  if (reflect > 0.003) {
    filtered(
      ctx,
      "saturate(0.3) brightness(1.15)",
      (c) => {
        c.save();
        c.translate(REFLECT.x, 0);
        c.scale(-1, 1);
        c.translate(-REFLECT.x, 0);
        drawKid(c, REFLECT.x, REFLECT.y, REFLECT.s, REFLECT_POSE);
        c.restore();
        c.save();
        c.globalCompositeOperation = "destination-in";
        const g = c.createRadialGradient(REFLECT.x, REFLECT.y, 24, REFLECT.x, REFLECT.y, 100);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = g;
        c.fillRect(REFLECT.x - 130, REFLECT.y - 130, 260, 260);
        c.restore();
      },
      "photoReflect",
      clamp(reflect),
      "screen",
    );
  }
  // diagonal glare
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0.18, "rgba(255,255,255,0)");
  g.addColorStop(0.24, "rgba(255,255,255,0.12)");
  g.addColorStop(0.3, "rgba(255,255,255,0)");
  g.addColorStop(0.62, "rgba(255,255,255,0)");
  g.addColorStop(0.66, "rgba(255,255,255,0.08)");
  g.addColorStop(0.7, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.restore();
}

/** aluminium window frame: jambs, header, a transom with fixed panes above, and the closed right sash */
function windowFrame(ctx: Ctx) {
  const AL = "#cfd4da",
    ALD = "#9aa2ad";
  const bar = (x: number, y: number, w: number, h: number, seed: number) => {
    shaded(ctx, () => poly(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], seed, 0.6), AL, () => {
      ctx.fillStyle = ALD;
      if (w > h) ctx.fillRect(x, y + h * 0.62, w, h);
      else ctx.fillRect(x + w * 0.62, y, w, h);
    }, C.ink, 3);
  };
  // fixed upper panes (the transom row): a faint tint
  ctx.fillStyle = "rgba(120,140,190,0.12)";
  ctx.fillRect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, 100);
  bar(WIN.x0 - 16, 56, WIN.x1 - WIN.x0 + 32, 16, 4300); // header
  bar(WIN.x0 - 16, 56, 16, SILL - 56, 4301); // left jamb
  bar(WIN.x1, 56, 16, SILL - 56, 4302); // right jamb
  bar(WIN.x0, 166, WIN.x1 - WIN.x0, 14, 4303); // transom
  bar(300, 72, 10, 94, 4304); // mullion between the fixed panes
  // the closed right sash: its frame around GLASS
  bar(GLASS.x0 - 16, 180, 16, SILL - 180, 4305);
  bar(GLASS.x1, 180, 14, SILL - 180, 4306);
  bar(GLASS.x0 - 16, GLASS.y1, GLASS.x1 - GLASS.x0 + 30, 12, 4307);
  // the latch
  poly(ctx, [[GLASS.x0 - 14, 440], [GLASS.x0 - 2, 440], [GLASS.x0 - 2, 468], [GLASS.x0 - 14, 468]], 4308, 0.4);
  paint(ctx, "#6d7480", C.ink, 2);
}

/** the sill, the wall below it and the bits of wall either side of the window */
function wall(ctx: Ctx) {
  // the wall round the window (the caller clips the window out)
  ctx.fillStyle = vgrad(ctx, 0, SILL, [[0, "#cdbd9f"], [1, "#e6d7bd"]]);
  ctx.fillRect(0, 0, PW, SILL);
  // below: cream wall, then the green painted dado
  ctx.fillStyle = vgrad(ctx, SILL, PH, [[0, "#e9d9bb"], [1, "#d8c4a2"]]);
  ctx.fillRect(0, SILL, PW, PH - SILL);
  ctx.fillStyle = "#86a18c";
  ctx.fillRect(0, 724, PW, PH - 724);
  inkLine(ctx, [[0, 724], [PW / 2, 725], [PW, 723]], 4310, 3, "#5d7563");
  // the sill: a lit top and a front face
  shaded(ctx, () => poly(ctx, [[-10, SILL - 4], [PW + 10, SILL - 6], [PW + 10, SILL + 16], [-10, SILL + 18]], 4311, 0.8), "#f1ede4", () => {
    ctx.fillStyle = "rgba(255,190,120,0.35)";
    ctx.fillRect(0, SILL - 10, 300, 30);
  }, C.ink, 4);
  shaded(ctx, () => poly(ctx, [[-10, SILL + 17], [PW + 10, SILL + 15], [PW + 10, SILL + 40], [-10, SILL + 42]], 4312, 0.8), "#c8c2b6", null, C.ink, 4);
  // the evening light lies warm across the wall from the left, falling off to the right
  const g = ctx.createLinearGradient(0, 0, PW, 0);
  g.addColorStop(0, "rgba(255,160,90,0.28)");
  g.addColorStop(0.6, "rgba(255,160,90,0.05)");
  g.addColorStop(1, "rgba(40,30,70,0.2)");
  ctx.fillStyle = g;
  ctx.fillRect(0, SILL + 42, PW, PH - SILL - 42);
}

/** The photo at the origin, scaled into w × h. `reflect` = how much of his reflection the glass shows (0.07 as she
 *  took it; the reveal turns it up while zooming in). */
export function gradPhoto(ctx: Ctx, w: number, h: number, o: { reflect?: number } = {}) {
  ctx.save();
  ctx.scale(w / PW, h / PH);
  ctx.beginPath();
  ctx.rect(0, 0, PW, PH);
  ctx.clip();
  outside(ctx);
  glassReflections(ctx, o.reflect ?? 0.07);
  windowFrame(ctx);
  // the corridor wall around the window is drawn after the frame's jambs
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, PW, PH);
  ctx.rect(WIN.x0 - 16, 56, WIN.x1 - WIN.x0 + 32, SILL - 56);
  ctx.clip("evenodd");
  wall(ctx);
  ctx.restore();
  // the boy, backlit: a warm rim all round (strongest toward the sun), his back a little in shadow
  const boy = (c: Ctx) => drawKid(c, BOY.x, BOY.y, BOY.s, BOY_POSE);
  boy(ctx);
  const m = figureMask(ctx, boy, "photoBoy");
  onFigure(ctx, m, (c) => {
    c.fillStyle = vgrad(c, 350, 620, [[0, "rgba(70,40,80,0.2)"], [1, "rgba(50,26,64,0.42)"]]);
    c.fillRect(0, 290, PW, 360);
  });
  rimLight(ctx, m, -1, -0.15, 6, "rgb(255,196,130)", 0.9, "lighter", 6);
  rimLight(ctx, m, 0.6, -1, 4, "rgb(255,214,170)", 0.35, "lighter", 6);
  // the sill in front of his waist (the wall layer drew it under him; lay its top again over his hips)
  shaded(ctx, () => poly(ctx, [[150, SILL - 4], [520, SILL - 6], [520, SILL + 16], [150, SILL + 18]], 4311, 0.8), "#f1ede4", null, C.ink, 4);
  shaded(ctx, () => poly(ctx, [[150, SILL + 17], [520, SILL + 15], [520, SILL + 40], [150, SILL + 42]], 4312, 0.8), "#c8c2b6", null, C.ink, 4);
  // the hand on the sill sits on top of it: redraw just the hand and its red string over the sill
  ctx.save();
  ctx.beginPath();
  ctx.rect(WRIST[0] - 70, SILL - 70, 110, 70);
  ctx.clip();
  boy(ctx);
  ctx.restore();
  // the photo's look: warm, a soft glow round the sun, a gentle vignette
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = "rgba(255,170,110,0.35)";
  ctx.fillRect(0, 0, PW, PH);
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, SUN[0], SUN[1], 200, "rgba(255,190,120,0.18)");
  ctx.restore();
  const v = ctx.createRadialGradient(PW / 2, PH * 0.45, PH * 0.35, PW / 2, PH * 0.45, PH * 0.78);
  v.addColorStop(0, "rgba(20,10,30,0)");
  v.addColorStop(1, "rgba(20,10,30,0.3)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, PW, PH);
  ctx.restore();
}
