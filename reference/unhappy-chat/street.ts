import { clamp } from "@frame/engine/math";
import { C, Ctx, fillBg, glow, hash, oval, paint, poly, rr, vgrad } from "@materials/s0rrow/code/draw";
import { mix } from "@materials/s0rrow/code/places";

/** The street between his block and hers, in world units (= design units at zoom 1): his block on the left, hers
 *  across the street. Every window sits on its block's grid; his and hers are 72×128 (the frame's shape) so the
 *  camera can go in or out through either one (the room behind the glass is the real room, with parallax).
 *  Used for the night his light goes out (act 2), the night passing into morning (act 3) and the last shot (act 4). */
export type Rect = { x: number; y: number; w: number; h: number };
export const HIS_WIN: Rect = { x: 150, y: 870, w: 72, h: 128 };
export const HER_WIN: Rect = { x: 720, y: 1100, w: 72, h: 128 };
export const winC = (r: Rect): [number, number] => [r.x + r.w / 2, r.y + r.h / 2];
/** the zoom at which a window fills the frame, its frame just out of shot */
export const Z_IN = 16.2;
/** the room behind the glass grows slower than the window as the camera gets closer (it is further away),
 *  so more of the room shows the closer we get */
export const DEPTH = 0.75;
/** each room's centre and scale at the moment its window fills the frame */
export const HIS_F0: [number, number] = [620, 920];
export const HIS_M0 = 1.08;
export const HER_F0: [number, number] = [480, 900];
export const HER_M0 = 1.04;

function plainWindow(ctx: Ctx, x: number, y: number, day: number) {
  rr(ctx, x, y, 72, 128, 4);
  ctx.fillStyle = mix("#0f1329", "#a9c0e6", day * 0.9);
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  ctx.fillStyle = `rgba(${day > 0.5 ? "255,255,255" : "170,185,255"},${0.06 + 0.2 * day})`;
  ctx.fillRect(x + 9, y + 9, 16, 110);
}

/** a window with its room behind the glass, for a camera at zoom Z (see DEPTH) */
export function roomWindow(ctx: Ctx, r: Rect, Z: number, m: number, focus: [number, number], room: (c: Ctx) => void, sill: string) {
  const s = (m * Math.pow(Z / Z_IN, DEPTH)) / Z; // world units per room unit
  ctx.save();
  rr(ctx, r.x, r.y, r.w, r.h, 4);
  ctx.clip();
  ctx.save();
  ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
  ctx.scale(s, s);
  ctx.translate(-focus[0], -focus[1]);
  room(ctx);
  ctx.restore();
  // the glass: a soft sheen that fades as we get close enough to go through
  const sheen = clamp(Math.log(Z_IN / Z) / Math.log(3));
  if (sheen > 0) {
    const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h * 0.7);
    g.addColorStop(0, `rgba(255,255,255,${0.18 * sheen})`);
    g.addColorStop(0.45, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  ctx.restore();
  rr(ctx, r.x, r.y, r.w, r.h, 4);
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  rr(ctx, r.x - 6, r.y + r.h, r.w + 12, 6, 2);
  ctx.fillStyle = sill;
  ctx.fill();
}

/** a string of fairy lights over her window, outside (`on` 0..1) */
export function fairyString(ctx: Ctx, abs: number, r: Rect, on = 1) {
  const at = (u: number): [number, number] => [r.x - 8 + u * (r.w + 16), r.y - 7 + Math.sin(u * Math.PI) * 5];
  ctx.strokeStyle = "#1a1530";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const [x, y] = at(i / 12);
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const [x, y] = at((i + 0.5) / 7);
    if (on > 0) glow(ctx, x, y + 3, 10, i % 2 ? "rgba(255,150,190,0.8)" : "rgba(255,230,150,0.8)", on * (0.7 + 0.3 * Math.sin(abs * 2.3 + i * 1.7)));
    ctx.fillStyle = i % 2 ? "#ffb3cf" : "#fff1a8";
    ctx.beginPath();
    ctx.arc(x, y + 3, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export interface StreetOpts {
  /** 0 night … 1 morning: the sky, the moon setting and the sun coming up, the glass catching the light */
  day?: number;
  hisLit: boolean;
  herLit: boolean;
  hisRoom: (c: Ctx) => void;
  herRoom: (c: Ctx) => void;
}

/** the street through a camera centred on world point `cam` at zoom `Z` */
export function street(ctx: Ctx, abs: number, cam: [number, number], Z: number, o: StreetOpts) {
  const day = clamp(o.day ?? 0);
  fillBg(ctx, mix("#0b1030", "#7fa6dd", day));
  ctx.save();
  ctx.translate(540, 960);
  ctx.scale(Z, Z);
  ctx.translate(-cam[0], -cam[1]);
  // sky, moon, stars — and the sun coming up between the blocks
  ctx.fillStyle = vgrad(ctx, 200, 1500, [
    [0, mix("#0b1030", "#7fa6dd", day)],
    [1, mix("#28315f", "#ffd0a6", day)],
  ]);
  ctx.fillRect(-400, -300, 2000, 2700);
  if (day < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - day;
    glow(ctx, 360, 590 + 120 * day, 110, "rgba(243,236,207,0.22)");
    oval(ctx, 360, 590 + 120 * day, 30, 30, 3760, 0.5);
    paint(ctx, "#f3eccf", null);
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.45 * hash(i * 9.1)})`;
      ctx.fillRect(-220 + hash(i * 3.1) * 1500, 240 + hash(i * 5.3) * 560, 2.5, 2.5);
    }
    ctx.restore();
  }
  if (day > 0) {
    const sy = 980 - 400 * day;
    ctx.save();
    ctx.globalAlpha = clamp(day / 0.35);
    glow(ctx, 490, sy, 420, `rgba(255,200,130,${0.55 * day})`);
    oval(ctx, 490, sy, 46, 46, 3762, 0.5);
    paint(ctx, mix("#ff9a6a", "#ffe9a8", day), null);
    ctx.restore();
  }
  // far blocks between the two, every window dark
  for (let i = 0; i < 9; i++) {
    const bx = -180 + i * 170,
      top = 560 + hash(i * 2.7) * 280;
    ctx.fillStyle = mix("#151a37", "#8e8fb6", day);
    ctx.fillRect(bx, top, 172, 2400 - top); // no gaps: the low sun must not show through slits
  }
  // his block (left)…
  poly(ctx, [[-280, 652], [432, 640], [438, 2400], [-280, 2400]], 3770, 0.6);
  paint(ctx, mix("#1c2140", "#a59fc4", day), C.ink, 4);
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 4; c++) {
      const x = -90 + c * 120,
        y = 700 + r * 170;
      if (x !== HIS_WIN.x || y !== HIS_WIN.y) plainWindow(ctx, x, y, day);
    }
  // …and hers across the street
  poly(ctx, [[548, 712], [1380, 700], [1380, 2400], [542, 2400]], 3771, 0.6);
  paint(ctx, mix("#221f46", "#bba6cc", day), C.ink, 4);
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 6; c++) {
      const x = 600 + c * 120,
        y = 760 + r * 170;
      if (x !== HER_WIN.x || y !== HER_WIN.y) plainWindow(ctx, x, y, day);
    }
  // the two windows, each with its room behind the glass; a lamp left on glows out into the night
  const night = 1 - day;
  const [hx, hy] = winC(HIS_WIN);
  if (o.hisLit && night > 0) glow(ctx, hx, hy, 140, "rgba(255,205,140,0.45)", night);
  roomWindow(ctx, HIS_WIN, Z, HIS_M0, HIS_F0, o.hisRoom, o.hisLit || day > 0.5 ? "#6d5b55" : "#2b3050");
  const [gx, gy] = winC(HER_WIN);
  if (o.herLit && night > 0) glow(ctx, gx, gy, 150, "rgba(255,190,150,0.48)", night);
  roomWindow(ctx, HER_WIN, Z, HER_M0, HER_F0, o.herRoom, o.herLit || day > 0.5 ? "#6d5560" : "#2e2a4a");
  fairyString(ctx, abs, HER_WIN, o.herLit ? 1 : 0.25 * night);
  ctx.restore();
}
