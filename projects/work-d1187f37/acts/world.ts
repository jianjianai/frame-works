// 《unhappy》重置版的场景：他的卧室（素材库 code/his-room.ts，这里只传闹钟时间）、她的卧室（素材库 herRoom 精细版）和
// 她坐在床上的打光、手机近景后面她房间的虚化光斑、那条街（两栋楼对着，两扇窗里是真的房间）。
import { clamp, phase, smooth } from "@frame/engine/math";
import { C, Ctx, H, Pt, W, blob, bokehDisc, fillBg, glow, hash, inkLine, lightShaft, litFigure, motes, oval, paint, poly, rbox, rr, text, F, vgrad, camera, filtered } from "@materials/s0rrow/code/draw";
import { herRoom, mix } from "@materials/s0rrow/code/places";
import { paneLight } from "@materials/s0rrow/code/sets";
import { drawKid, type KidPose } from "@materials/s0rrow/code/kid";
import { phoneBack } from "@materials/s0rrow/code/phone";

import * as His from "@materials/s0rrow/code/his-room";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------- his room (素材库 s0rrow 的 code/his-room.ts)
// 他的精细卧室、坐在床上的打光、腿上的被子、蒙在被子里、手机后面的虚化房间都在素材库；这里只传这支片子的闹钟时间。
export const ROOM = His.ROOM;
export const SIT = His.HIS_SIT;
export const { hisDuvet, hisInBed, hisPhoneBack, hisBokeh } = His;
const clockAt = (dawn = 0) => (dawn > 0.5 ? "7:10" : "11:12");
export function hisRoom(c: Ctx, abs: number, o: His.HisRoomOptions = {}) {
  His.hisRoom(c, abs, { clock: clockAt(o.dawn), ...o });
}
export function hisRoomCurled(c: Ctx, abs: number, lamp: number) {
  His.hisRoomCurled(c, abs, lamp, { clock: "12:52" });
}

// ---------------------------------------------------------------- behind a phone close-up
const WARM = "255,206,140",
  PINK = "255,170,200";
/** Her room out of focus behind her phone: the fairy lights (warm and pink), the lamp, the moon window. */
const HER_LIGHTS: [number, number, number, number, string][] = [
  [30, 200, 132, 1, WARM],
  [1062, 1300, 136, 1, WARM],
  [980, 250, 62, 0.55, PINK],
  [150, 1760, 92, 0.75, PINK],
  [120, 1120, 30, 0.2, WARM],
  [905, 1830, 28, 0.2, WARM],
];
export function herBokeh(c: Ctx, abs: number, o: { dark?: number; shift?: [number, number]; warm?: number; zoom?: number } = {}) {
  const dark = o.dark ?? 0,
    warm = o.warm ?? 0;
  const [sx, sy] = o.shift ?? [0, 0];
  fillBg(c, vgrad(c, 0, H, [[0, "#2a1f38"], [1, "#120c1a"]]));
  c.save();
  if (o.zoom) camera(c, 540, 900, o.zoom);
  glow(c, 960, 1200, 700, "rgba(255,180,120,0.24)", 1 - dark * 0.85);
  glow(c, 880, 380, 520, "rgba(120,150,230,0.24)", 1 - dark * 0.4);
  c.restore();
  c.save();
  if (o.zoom) camera(c, 540, 900, Math.pow(o.zoom, 0.6));
  c.globalCompositeOperation = "screen";
  HER_LIGHTS.forEach(([x, y, r, depth, rgb], i) => {
    const tw = 0.8 + 0.2 * Math.sin(abs * (1.6 + 0.9 * hash(i * 6.1)) + i * 2.3);
    const par = 0.2 + 0.8 * depth;
    bokehDisc(c, x + sx * par, y + sy * par, r, rgb, (0.52 - 0.27 * depth) * tw * (1 - dark * 0.7) * (1 + 0.8 * warm));
  });
  c.restore();
  if (warm > 0) glow(c, 540, 900, 1000, "rgba(255,196,170,0.14)", warm);
  const v = c.createRadialGradient(540, 900, 200, 540, 900, 1150);
  v.addColorStop(0, "rgba(14,8,14,0.3)");
  v.addColorStop(0.5, "rgba(14,8,14,0.08)");
  v.addColorStop(1, `rgba(10,6,12,${(0.35 + 0.3 * dark).toFixed(3)})`);
  c.fillStyle = v;
  c.fillRect(-60, -60, W + 120, H + 120);
}

/** the whole room behind a close-up of him, out of focus (draw before the push, so it stays still) */
export function hisRoomBlur(c: Ctx, abs: number, o: { lamp?: number; dawn?: number; zoom?: number; cx?: number; cy?: number; blur?: number } = {}) {
  filtered(c, `blur(${(o.blur ?? 6).toFixed(1)}px)`, (b) => {
    camera(b, o.cx ?? SIT.x, o.cy ?? 600, o.zoom ?? 1.9, 0, 540 - (o.cx ?? SIT.x), 0);
    hisRoom(b, abs, { lamp: o.lamp ?? 1, dawn: o.dawn ?? 0 });
  }, "hisRoomBlur");
}

// ---------------------------------------------------------------- her side
/** where she sits up in bed in her room (the library's furnished room: bed on the left, lamp on the right) */
export const HER_SIT = { x: 470, y: 640, s: 0.95 };
export const HER_LAMP: Pt = [830, 690];
/** her room at night (the library's furnished room, no snow), her own polaroids on the wall */
export function herRoomNight(c: Ctx, abs: number, o: { lamp?: number; lights?: number } = {}) {
  herRoom(c, abs, { detailed: true, lamp: o.lamp ?? 1, lampAt: HER_LAMP, lights: o.lights ?? 0.8, winter: false });
}
/** her pink duvet with little white hearts over her lap */
export function herDuvet(c: Ctx, dark: number) {
  const pts: Pt[] = [[-90, 958], [160, 940], [380, 962], [560, 948], [690, 972], [712, 1090], [690, 1170], [-90, 1172]];
  blob(c, pts, 83001, 2);
  paint(c, vgrad(c, 960, 1170, [[0, "#dda2b8"], [1, "#ae6b8b"]]), C.ink, 6);
  c.save();
  blob(c, pts, 83001, 2);
  c.clip();
  for (let i = 0; i < 11; i++) {
    c.save();
    c.translate(-60 + hash(83002 + i * 3.7) * 760, 970 + hash(83002 + i * 5.1) * 200);
    c.rotate((hash(83002 + i) - 0.5) * 0.8);
    c.fillStyle = "rgba(255,255,255,0.7)";
    c.beginPath();
    c.moveTo(0, 8);
    c.bezierCurveTo(-14, -2, -10, -12, -4, -12);
    c.bezierCurveTo(-1, -12, 0, -9, 0, -7);
    c.bezierCurveTo(0, -9, 1, -12, 4, -12);
    c.bezierCurveTo(10, -12, 14, -2, 0, 8);
    c.fill();
    c.restore();
  }
  inkLine(c, [[60, 1010], [150, 1080], [130, 1170]], 83003, 4, "rgba(170,70,100,0.45)");
  inkLine(c, [[330, 1000], [420, 1060], [520, 1050]], 83004, 4, "rgba(170,70,100,0.45)");
  inkLine(c, [[-90, 972], [160, 954], [380, 976], [560, 962], [690, 986]], 83005, 8, "rgba(255,225,235,0.45)");
  if (dark > 0) {
    c.fillStyle = `rgba(8,12,32,${(0.52 * dark).toFixed(3)})`;
    c.fillRect(-100, 900, 900, 300);
  }
  c.restore();
}
/** the back of her phone (pink case, a sunflower sticker) */
export function herPhoneBack(c: Ctx, x: number, y: number, w: number, h: number, rot = 0) {
  phoneBack(c, x, y, w, h, rot, 0, { detailed: true, triple: true, caseColor: "#e9a5bd", cameraColor: "#cf859f" });
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.translate(w * 0.12, h * 0.16);
  const s = (w * 0.12) / 26;
  c.scale(s, s);
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    oval(c, Math.cos(a) * 26, Math.sin(a) * 26, 16, 9, 83010 + k, 0.4, a);
    paint(c, "#ffd23a", C.ink, 2.5);
  }
  oval(c, 0, 0, 16, 16, 83020, 0.4);
  paint(c, "#7a4a24", C.ink, 3);
  c.restore();
}
/** her, sitting up in bed, lit by her lamp (warm, screen right), the phone under her chin (cold) and a cold rim from
 *  the window behind; `sob` shakes her a little */
export function herInBed(c: Ctx, pose: KidPose, o: { lamp: number; phone: number; x?: number; y?: number; s?: number; phoneAt?: Pt }) {
  const x = o.x ?? HER_SIT.x,
    y = o.y ?? HER_SIT.y,
    s = o.s ?? HER_SIT.s;
  const [px, py] = o.phoneAt ?? [x, y + 330 * s];
  litFigure(c, (k) => drawKid(k, x, y, s, { who: "girl", outfit: "pajamas", body: "bust", ...pose }), {
    shade: 0.2 + 0.28 * (1 - o.lamp),
    shadeCol: "rgb(22,14,40)",
    lights: [
      ...(o.phone > 0 ? [{ x: px, y: py - 60 * s, r: 400 * s, rgb: "175,200,255", a: Math.min(0.8, 0.42 * o.phone) }] : []),
      ...(o.lamp > 0 ? [{ x: HER_LAMP[0] + (x - HER_SIT.x), y: HER_LAMP[1] + 10, r: 560 * s, rgb: "255,190,120", a: 0.36 * o.lamp }] : []),
    ],
    rim: { ux: 1, uy: -0.3, rgb: "175,195,255", a: 0.4 },
  });
}

// ---------------------------------------------------------------- the street between their blocks
/** World units (= design units at zoom 1): his block on the left, hers across the street. Every window sits on its
 *  block's grid; his and hers are 72×128 (the frame's shape) so the camera can go in or out through either one (the
 *  real room is behind the glass, with parallax). Night (act 2), night into morning (act 3), the last shot (act 4). */
export type Rect = { x: number; y: number; w: number; h: number };
export const HIS_WIN: Rect = { x: 150, y: 870, w: 72, h: 128 };
export const HER_WIN: Rect = { x: 720, y: 1100, w: 72, h: 128 };
export const winC = (r: Rect): [number, number] => [r.x + r.w / 2, r.y + r.h / 2];
/** the zoom at which a window fills the frame, its frame just out of shot */
export const Z_IN = 16.2;
/** the room behind the glass grows slower than the window as the camera comes in (it is further away) */
export const DEPTH = 0.75;
/** each room's focus point and scale at the moment its window fills the frame */
export const HIS_F0: Pt = [760, 900];
export const HIS_M0 = 1.08;
export const HER_F0: Pt = [480, 860];
export const HER_M0 = 1.04;

/** a dark window on a block: glass catching the moon (or the morning sky), a sill, sometimes a little balcony rail
 *  or an air-conditioner box beside it */
function plainWindow(c: Ctx, x: number, y: number, day: number, seed: number) {
  rr(c, x, y, 72, 128, 4);
  c.fillStyle = mix("#0e1228", "#a9c0e6", day * 0.9);
  c.fill();
  c.lineWidth = 2.5;
  c.strokeStyle = C.ink;
  c.stroke();
  c.fillStyle = `rgba(${day > 0.5 ? "255,255,255" : "170,185,255"},${(0.07 + 0.2 * day).toFixed(3)})`;
  c.fillRect(x + 9, y + 9, 14, 110);
  inkLine(c, [[x + 36, y + 2], [x + 36, y + 126]], seed, 1.6, "rgba(10,12,30,0.8)", 0.2);
  rr(c, x - 5, y + 128, 82, 6, 2);
  c.fillStyle = mix("#2a2f4e", "#c9c3d6", day);
  c.fill();
  const h = hash(seed * 1.7);
  if (h > 0.72) {
    // a balcony rail
    c.strokeStyle = mix("#3a4064", "#e6e2ee", day);
    c.lineWidth = 2;
    c.strokeRect(x - 10, y + 90, 92, 44);
    for (let k = 1; k < 6; k++) {
      c.beginPath();
      c.moveTo(x - 10 + k * 15.3, y + 90);
      c.lineTo(x - 10 + k * 15.3, y + 134);
      c.stroke();
    }
  } else if (h > 0.5) {
    // an air conditioner
    rr(c, x + 80, y + 70, 34, 26, 3);
    c.fillStyle = mix("#3b4062", "#e8e6ee", day);
    c.fill();
    c.strokeStyle = C.ink;
    c.lineWidth = 1.6;
    c.stroke();
  }
}

/** a window with its room behind the glass, for a camera at zoom Z */
function roomWindow(c: Ctx, r: Rect, Z: number, m: number, focus: Pt, room: (c: Ctx) => void, sill: string) {
  const s = (m * Math.pow(Z / Z_IN, DEPTH)) / Z;
  c.save();
  rr(c, r.x, r.y, r.w, r.h, 4);
  c.clip();
  c.save();
  c.translate(r.x + r.w / 2, r.y + r.h / 2);
  c.scale(s, s);
  c.translate(-focus[0], -focus[1]);
  room(c);
  c.restore();
  const sheen = clamp(Math.log(Z_IN / Z) / Math.log(3));
  if (sheen > 0) {
    const g = c.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h * 0.7);
    g.addColorStop(0, `rgba(255,255,255,${(0.18 * sheen).toFixed(3)})`);
    g.addColorStop(0.45, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(r.x, r.y, r.w, r.h);
  }
  c.restore();
  rr(c, r.x, r.y, r.w, r.h, 4);
  c.lineWidth = 3;
  c.strokeStyle = C.ink;
  c.stroke();
  rr(c, r.x - 6, r.y + r.h, r.w + 12, 6, 2);
  c.fillStyle = sill;
  c.fill();
}

/** a string of fairy lights over her window, outside (`on` 0..1) */
function fairyString(c: Ctx, abs: number, r: Rect, on = 1) {
  const at = (u: number): Pt => [r.x - 8 + u * (r.w + 16), r.y - 7 + Math.sin(u * Math.PI) * 5];
  c.strokeStyle = "#1a1530";
  c.lineWidth = 1.2;
  c.beginPath();
  for (let i = 0; i <= 12; i++) {
    const [x, y] = at(i / 12);
    if (i) c.lineTo(x, y);
    else c.moveTo(x, y);
  }
  c.stroke();
  for (let i = 0; i < 7; i++) {
    const [x, y] = at((i + 0.5) / 7);
    if (on > 0) glow(c, x, y + 3, 12, i % 2 ? "rgba(255,150,190,0.85)" : "rgba(255,230,150,0.85)", on * (0.7 + 0.3 * Math.sin(abs * 2.3 + i * 1.7)));
    c.fillStyle = i % 2 ? "#ffb3cf" : "#fff1a8";
    c.beginPath();
    c.arc(x, y + 3, 2.2, 0, Math.PI * 2);
    c.fill();
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

/** The street through a camera centred on world point `cam` at zoom `Z`: a deep night sky with the moon, the far city
 *  in a haze, the two blocks facing each other (balconies, air conditioners, a drainpipe, a water tank on the roof),
 *  moonlight along their edges, the warm street lamps below washing up the walls; their two windows with the real
 *  rooms behind the glass. */
export function nightStreet(c: Ctx, abs: number, cam: Pt, Z: number, o: StreetOpts) {
  const day = clamp(o.day ?? 0),
    night = 1 - day;
  fillBg(c, mix("#090d28", "#7fa6dd", day));
  c.save();
  c.translate(540, 960);
  c.scale(Z, Z);
  c.translate(-cam[0], -cam[1]);
  c.fillStyle = vgrad(c, 100, 1500, [[0, mix("#070b26", "#7fa6dd", day)], [0.6, mix("#1a2250", "#ffd9b0", day)], [1, mix("#2c2f5e", "#ffc596", day)]]);
  c.fillRect(-500, -400, 2200, 2900);
  if (night > 0) {
    c.save();
    c.globalAlpha = night;
    for (let i = 0; i < 40; i++) {
      c.fillStyle = `rgba(255,255,255,${(0.3 + 0.5 * hash(i * 9.1) * (0.7 + 0.3 * Math.sin(abs * 1.3 + i))).toFixed(3)})`;
      const sz = 1.5 + hash(i * 4.4) * 2;
      c.fillRect(-300 + hash(i * 3.1) * 1700, 150 + hash(i * 5.3) * 640, sz, sz);
    }
    const my = 560 + 140 * day;
    glow(c, 380, my, 180, "rgba(220,226,255,0.25)");
    glow(c, 380, my, 60, "rgba(240,240,255,0.4)");
    oval(c, 380, my, 32, 32, 3760, 0.5);
    paint(c, "#f3eccf", null);
    oval(c, 392, my - 8, 28, 28, 3761, 0.5);
    paint(c, mix("#121a44", "#7fa6dd", day), null);
    // thin clouds drifting past the moon
    c.fillStyle = "rgba(120,130,180,0.12)";
    c.beginPath();
    c.ellipse(320 + Math.sin(abs * 0.07) * 30, 600, 220, 14, -0.04, 0, Math.PI * 2);
    c.ellipse(560 + Math.sin(abs * 0.05) * 40, 470, 160, 10, 0.03, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  if (day > 0) {
    const sy = 980 - 400 * day;
    const rise = Math.sin(Math.PI * clamp(day)); // strongest while it is coming up
    c.save();
    c.globalAlpha = clamp(day / 0.35);
    // the dawn band along the horizon, then the sun and its rays fanning up between the blocks
    c.fillStyle = vgrad(c, sy - 500, sy + 300, [[0, "rgba(255,170,140,0)"], [0.7, `rgba(255,170,130,${(0.35 * rise + 0.1).toFixed(3)})`], [1, "rgba(255,200,150,0)"]]);
    c.fillRect(-500, sy - 500, 2200, 800);
    c.save();
    c.globalCompositeOperation = "lighter";
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI / 2 + (k - 4) * 0.2 + Math.sin(abs * 0.3 + k) * 0.02;
      const g = c.createLinearGradient(490, sy, 490 + Math.cos(a) * 900, sy + Math.sin(a) * 900);
      g.addColorStop(0, `rgba(255,214,160,${(0.16 * rise).toFixed(3)})`);
      g.addColorStop(1, "rgba(255,214,160,0)");
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(490, sy);
      c.lineTo(490 + Math.cos(a - 0.05) * 900, sy + Math.sin(a - 0.05) * 900);
      c.lineTo(490 + Math.cos(a + 0.05) * 900, sy + Math.sin(a + 0.05) * 900);
      c.closePath();
      c.fill();
    }
    c.restore();
    glow(c, 490, sy, 520, `rgba(255,200,130,${(0.6 * day).toFixed(3)})`);
    oval(c, 490, sy, 46, 46, 3762, 0.5);
    paint(c, mix("#ff9a6a", "#ffe9a8", day), null);
    // clouds lit from below, pink at sunrise
    for (const [cx0, cy0, w] of [[300, 520, 200], [700, 430, 160], [180, 380, 120]] as [number, number, number][]) {
      c.fillStyle = `rgba(255,${Math.round(170 + 50 * day)},${Math.round(170 + 30 * day)},${(0.5 * rise + 0.15).toFixed(3)})`;
      c.beginPath();
      c.ellipse(cx0 + Math.sin(abs * 0.05) * 20, cy0, w, 13, -0.03, 0, Math.PI * 2);
      c.ellipse(cx0 + w * 0.3, cy0 - 10, w * 0.5, 11, 0.02, 0, Math.PI * 2);
      c.fill();
    }
    // a few birds crossing
    c.strokeStyle = `rgba(40,30,50,${(0.6 * clamp((day - 0.3) / 0.3)).toFixed(3)})`;
    c.lineWidth = 2.4;
    c.lineCap = "round";
    for (let k = 0; k < 4; k++) {
      const bx = ((abs * (40 + k * 6) + k * 230) % 1400) - 300,
        by = 470 + k * 34 + Math.sin(abs * 2 + k) * 8,
        fl = 6 + 4 * Math.sin(abs * 12 + k * 2);
      c.beginPath();
      c.moveTo(bx - 10, by - fl * 0.4);
      c.quadraticCurveTo(bx - 4, by - fl, bx, by);
      c.quadraticCurveTo(bx + 4, by - fl, bx + 10, by - fl * 0.4);
      c.stroke();
    }
    c.restore();
  }
  // the far city between the two blocks: dark towers, a few lit windows, a haze of city light at their feet
  for (let i = 0; i < 9; i++) {
    const bx = -180 + i * 170,
      top = 560 + hash(i * 2.7) * 280;
    c.fillStyle = mix("#141938", "#8e8fb6", day);
    c.fillRect(bx, top, 172, 2400 - top);
    if (night > 0)
      for (let k = 0; k < 12; k++)
        if (hash(i * 31 + k * 7.7) > 0.8) {
          c.fillStyle = `rgba(255,200,130,${(0.35 * night).toFixed(3)})`;
          c.fillRect(bx + 20 + (k % 4) * 36, top + 30 + Math.floor(k / 4) * 46, 10, 14);
        }
  }
  c.fillStyle = vgrad(c, 900, 1500, [[0, "rgba(255,170,120,0)"], [1, `rgba(255,170,120,${(0.16 * night).toFixed(3)})`]]);
  c.fillRect(-500, 900, 2200, 600);
  // his block (left)…
  poly(c, [[-280, 652], [432, 640], [438, 2400], [-280, 2400]], 3770, 0.6);
  paint(c, mix("#1b2040", "#a59fc4", day), C.ink, 4);
  for (let y = 840; y < 2400; y += 170) inkLine(c, [[-280, y], [436, y - 2]], 3790 + y, 2, "rgba(8,10,26,0.35)", 0.4);
  // a water tank and an aerial on his roof
  rbox(c, 30, 560, 110, 92, 8, 3772, 0.6);
  paint(c, mix("#232947", "#9e9ab8", day), C.ink, 3);
  inkLine(c, [[300, 640], [300, 520], [270, 540], [330, 540]], 3773, 2.5, mix("#232947", "#6f6b88", day));
  // a drainpipe down the edge
  inkLine(c, [[410, 660], [410, 2400]], 3774, 7, mix("#262c4a", "#8f8aa8", day), 0.3);
  for (let r = 0; r < 8; r++)
    for (let k = 0; k < 4; k++) {
      const x = -90 + k * 120,
        y = 700 + r * 170;
      if (x !== HIS_WIN.x || y !== HIS_WIN.y) plainWindow(c, x, y, day, 3800 + r * 7 + k);
    }
  // moonlight along the edge of his block
  inkLine(c, [[428, 646], [434, 2400]], 3775, 5, `rgba(170,190,255,${(0.35 * night).toFixed(3)})`, 0.3);
  // …and hers across the street
  poly(c, [[548, 712], [1380, 700], [1380, 2400], [542, 2400]], 3771, 0.6);
  paint(c, mix("#221f46", "#bba6cc", day), C.ink, 4);
  for (let y = 900; y < 2400; y += 170) inkLine(c, [[544, y], [1380, y - 2]], 3795 + y, 2, "rgba(8,10,26,0.35)", 0.4);
  for (let r = 0; r < 8; r++)
    for (let k = 0; k < 6; k++) {
      const x = 600 + k * 120,
        y = 760 + r * 170;
      if (x !== HER_WIN.x || y !== HER_WIN.y) plainWindow(c, x, y, day, 3900 + r * 7 + k);
    }
  inkLine(c, [[550, 716], [546, 2400]], 3776, 5, `rgba(170,190,255,${(0.28 * night).toFixed(3)})`, 0.3);
  // the street lamps below, washing warm light up both walls
  for (const x of [470, 520]) glow(c, x, 2200, 520, `rgba(255,190,120,${(0.3 * night).toFixed(3)})`);
  if (day > 0) {
    // the morning sun from between the blocks: warm on the walls that face the gap, a warm edge on each block
    c.save();
    c.globalCompositeOperation = "soft-light";
    const gl = c.createLinearGradient(440, 0, 0, 0);
    gl.addColorStop(0, `rgba(255,200,140,${(0.7 * day).toFixed(3)})`);
    gl.addColorStop(1, "rgba(255,200,140,0)");
    c.fillStyle = gl;
    c.fillRect(-280, 640, 718, 1760);
    const gr = c.createLinearGradient(545, 0, 1100, 0);
    gr.addColorStop(0, `rgba(255,200,140,${(0.7 * day).toFixed(3)})`);
    gr.addColorStop(1, "rgba(255,200,140,0)");
    c.fillStyle = gr;
    c.fillRect(542, 700, 838, 1700);
    c.restore();
    inkLine(c, [[430, 646], [436, 2400]], 3777, 6, `rgba(255,214,160,${(0.6 * day).toFixed(3)})`, 0.3);
    inkLine(c, [[548, 716], [544, 2400]], 3778, 6, `rgba(255,214,160,${(0.6 * day).toFixed(3)})`, 0.3);
    // a few windows catching the sun
    c.save();
    c.globalCompositeOperation = "lighter";
    for (let k = 0; k < 10; k++) {
      const left = k % 2 === 0;
      const col = Math.floor(hash(k * 3.3) * (left ? 4 : 6)),
        row = Math.floor(hash(k * 5.1) * 7);
      const x = left ? -90 + col * 120 : 600 + col * 120,
        y = (left ? 700 : 760) + row * 170;
      if ((left && x === HIS_WIN.x && y === HIS_WIN.y) || (!left && x === HER_WIN.x && y === HER_WIN.y)) continue;
      const tw = 0.6 + 0.4 * Math.sin(abs * 1.5 + k);
      glow(c, x + 36, y + 50, 60, `rgba(255,224,170,${(0.35 * day * tw).toFixed(3)})`);
    }
    c.restore();
  }
  // the two windows, each with its room behind the glass; a lamp left on glows out into the night
  const [hx, hy] = winC(HIS_WIN);
  if (o.hisLit && night > 0) glow(c, hx, hy, 150, "rgba(255,205,140,0.5)", night);
  roomWindow(c, HIS_WIN, Z, HIS_M0, HIS_F0, o.hisRoom, o.hisLit || day > 0.5 ? "#6d5b55" : "#2b3050");
  const [gx, gy] = winC(HER_WIN);
  if (o.herLit && night > 0) glow(c, gx, gy, 160, "rgba(255,190,150,0.52)", night);
  roomWindow(c, HER_WIN, Z, HER_M0, HER_F0, o.herRoom, o.herLit || day > 0.5 ? "#6d5560" : "#2e2a4a");
  fairyString(c, abs, HER_WIN, o.herLit ? 1 : 0.25 * night);
  c.restore();
  // a faint night haze over everything
  if (night > 0) {
    c.fillStyle = `rgba(20,24,60,${(0.12 * night).toFixed(3)})`;
    c.fillRect(-60, -60, W + 120, H + 120);
  }
  void phase;
  void smooth;
}

// ---------------------------------------------------------------- the classroom, from his seat (his memory of today)
/** a classmate seen from behind at his/her desk: head and hair, the school uniform (white, blue shoulders), the chair
 *  back in front of the lower back, the desk's corners showing either side */
function backStudent(c: Ctx, x: number, y: number, s: number, hair: string, seed: number, girl = false) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  // desk corners (in front of them, so mostly hidden by the body)
  poly(c, [[-210, 150], [210, 150], [230, 190], [-230, 190]], seed, 0.8);
  paint(c, "#c99a62", C.ink, 4);
  // shoulders and back
  blob(c, [[-120, 70], [-60, 30], [60, 30], [120, 70], [140, 260], [-140, 260]], seed + 1, 1);
  paint(c, "#f2f2ee", C.ink, 5);
  blob(c, [[-120, 70], [-60, 30], [-40, 60], [-110, 120]], seed + 2, 0.6);
  paint(c, "#3d6fae", null);
  blob(c, [[120, 70], [60, 30], [40, 60], [110, 120]], seed + 3, 0.6);
  paint(c, "#3d6fae", null);
  // head
  oval(c, 0, -30, 68, 74, seed + 4, 1.2);
  paint(c, hair, C.ink, 5);
  if (girl) {
    blob(c, [[-62, 0], [-70, 70], [70, 70], [62, 0]], seed + 5, 1);
    paint(c, hair, C.ink, 4);
  }
  inkLine(c, [[-30, -70], [-10, -30], [20, -60]], seed + 6, 3, "rgba(255,255,255,0.18)");
  // the chair back
  rbox(c, -150, 200, 300, 56, 12, seed + 7, 0.8);
  paint(c, "#b98a55", C.ink, 4);
  c.restore();
}

/** The classroom seen from his seat: the blackboard with the physics problem he stayed up for, the clock, a big bank of
 *  windows on the left wall (sky, the tree outside, curtains), the late-morning sun slanting across the room in
 *  shafts with dust, panes of light on the desks and the floor, two rows of classmates from behind (near ones bigger).
 *  The middle of the frame is left clear for her. Draw it out of focus behind the people. */
export function classFromSeat(c: Ctx, abs: number, o: { sun?: number; students?: boolean } = {}) {
  const sun = o.sun ?? 1;
  fillBg(c, vgrad(c, 0, H, [[0, "#efe6cf"], [0.6, "#e6dbbd"], [1, "#d9c9a4"]]));
  // ceiling and its lights
  poly(c, [[-60, -60], [1140, -60], [1140, 160], [-60, 175]], 84000, 1.2);
  paint(c, "#f6f2e6", C.ink, 5);
  for (const [a, b] of [[220, 470], [640, 890]]) inkLine(c, [[a, 92], [b, 90]], 84001 + a, 12, "#fffbe8");
  // the windows on the left wall, in perspective: sky, the tree outside, white frames, a curtain tied back
  const wins: [number, number][] = [[-70, 120], [130, 300]];
  wins.forEach(([x0, x1], i) => {
    const t0 = 180 + i * 50,
      t1 = 230 + i * 44,
      b0 = 1090 - i * 50,
      b1 = 1040 - i * 44;
    const q: Pt[] = [[x0, t0], [x1, t1], [x1, b1], [x0, b0]];
    poly(c, q, 84010 + i, 0.8);
    paint(c, vgrad(c, t0, b0, [[0, "#bfe2f5"], [0.6, "#e6f4fa"], [1, "#fff6dc"]]), C.ink, 5);
    c.save();
    poly(c, q, 84010 + i, 0.8);
    c.clip();
    for (let k = 0; k < 6; k++) {
      oval(c, x0 + (x1 - x0) * (0.2 + 0.15 * k), t0 + 120 + (k % 3) * 70, 70, 56, 84020 + i * 10 + k, 1.4);
      paint(c, k % 2 ? "#8fc27a" : "#a7d18b", null);
    }
    c.fillStyle = "rgba(255,255,255,0.35)";
    c.fillRect(x0, t0, x1 - x0, b0 - t0);
    c.restore();
    inkLine(c, [[(x0 + x1) / 2, (t0 + t1) / 2], [(x0 + x1) / 2, (b0 + b1) / 2]], 84030 + i, 7, "#f4f2ea");
    inkLine(c, [[x0, t0 + (b0 - t0) * 0.42], [x1, t1 + (b1 - t1) * 0.42]], 84032 + i, 7, "#f4f2ea");
    // the curtain bunched at the far edge
    blob(c, [[x1 - 10, t1 - 10], [x1 + 34, t1 - 6], [x1 + 26, (t1 + b1) / 2], [x1 + 40, b1 + 20], [x1 - 4, b1 + 24], [x1 + 6, (t1 + b1) / 2]], 84034 + i, 1);
    paint(c, "#cfe0c4", C.ink, 3.5);
  });
  // the blackboard in its frame, the physics problem in chalk
  rbox(c, 300, 290, 720, 460, 12, 84040, 1);
  paint(c, "#8a6844", C.ink, 6);
  rbox(c, 320, 310, 680, 420, 6, 84041, 0.8);
  paint(c, "#2f4a3c", C.ink, 4);
  const chalk = "rgba(238,242,234,0.88)";
  poly(c, [[380, 680], [660, 680], [380, 510]], 84042, 0.8);
  paint(c, null, chalk, 4);
  c.save();
  c.translate(520, 600);
  c.rotate(Math.atan2(170, 280));
  poly(c, [[-38, -56], [38, -56], [38, 0], [-38, 0]], 84043, 0.8);
  paint(c, null, chalk, 3.5);
  c.restore();
  text(c, "Q3", 440, 370, { size: 44, font: F.pen, fill: chalk });
  text(c, "F = ma", 860, 440, { size: 60, font: F.marker, fill: chalk });
  text(c, "a = ?", 850, 545, { size: 52, font: F.marker, fill: chalk });
  inkLine(c, [[770, 600], [950, 596]], 84044, 3, chalk);
  rbox(c, 310, 742, 700, 18, 4, 84045, 0.8);
  paint(c, "#7a5a3a", C.ink, 4);
  // the clock above it, a little class flag
  oval(c, 660, 222, 40, 40, 84046, 0.8);
  paint(c, "#fbfaf4", C.ink, 4);
  inkLine(c, [[660, 222], [660, 196]], 84047, 4, C.ink);
  inkLine(c, [[660, 222], [680, 230]], 84048, 4, C.ink);
  poly(c, [[930, 200], [1010, 210], [1000, 260], [928, 252]], 84049, 0.8);
  paint(c, "#e8524a", C.ink, 3);
  // the right wall: a notice board with pinned sheets
  poly(c, [[1030, 360], [1140, 340], [1140, 780], [1030, 760]], 84050, 0.8);
  paint(c, "#c9a77a", C.ink, 4);
  for (let k = 0; k < 4; k++) {
    poly(c, [[1045, 380 + k * 95], [1110, 372 + k * 95], [1110, 440 + k * 95], [1045, 448 + k * 95]], 84051 + k, 0.6);
    paint(c, ["#fff4c8", "#d8ecff", "#ffe0e8", "#e6f6dc"][k], C.ink, 2.5);
  }
  // the floor: boards running away to the board
  poly(c, [[-60, 1120], [1140, 1110], [1140, 2000], [-60, 2000]], 84060, 1);
  paint(c, "#c8a676", C.ink, 5);
  for (let k = -6; k < 12; k++) inkLine(c, [[560 + (k - 3) * 40, 1115], [560 + (k - 3) * 240, 2000]], 84061 + k, 2, "rgba(110,80,40,0.25)", 0.5);
  // the classmates in the two rows ahead (her own desk is in the middle, left clear)
  if (o.students !== false) {
    backStudent(c, 230, 1000, 0.36, "#2a2220", 84100);
    backStudent(c, 850, 990, 0.34, "#3a2a20", 84110, true);
    backStudent(c, 470, 960, 0.3, "#1f1a18", 84120);
    backStudent(c, 90, 1150, 0.5, "#2c221c", 84130, true);
    backStudent(c, 990, 1140, 0.5, "#241c18", 84140);
  } else
    // after class: empty desks and chairs, a schoolbag left on one
    for (const [x, y, sc] of [[230, 1100, 0.36], [850, 1090, 0.34], [90, 1250, 0.5], [990, 1240, 0.5]] as [number, number, number][]) {
      c.save();
      c.translate(x, y);
      c.scale(sc, sc);
      poly(c, [[-210, 0], [210, 0], [230, 50], [-230, 50]], 84160 + x, 0.8);
      paint(c, "#c99a62", C.ink, 4);
      rbox(c, -150, 60, 300, 56, 12, 84170 + x, 0.8);
      paint(c, "#b98a55", C.ink, 4);
      c.restore();
    }
  // the sun from the windows: shafts across the room, panes of light on the desks and the floor, dust
  if (sun > 0) {
    lightShaft(c, [[0, 230], [300, 300], [1040, 1500], [520, 1640]], 150, 300, 800, 1600, "255,232,180", 0.22 * sun, 34, "classA");
    lightShaft(c, [[0, 640], [240, 660], [820, 1820], [420, 1900]], 120, 660, 640, 1850, "255,232,180", 0.14 * sun, 30, "classB");
    paneLight(c, [[260, 1180], [700, 1190], [980, 1700], [380, 1680]], "255,226,170", 0.22 * sun, 8, "classPanes");
    glow(c, 60, 560, 700, "rgba(255,244,210,0.35)", sun);
    motes(c, abs, 420, 900, 380, 520, 26, 84150, "255,240,205", 0.55 * sun, 2.6);
  }
  // the far right of the room in a little shade
  const sh = c.createLinearGradient(700, 0, 1140, 0);
  sh.addColorStop(0, "rgba(90,70,40,0)");
  sh.addColorStop(1, "rgba(90,70,40,0.16)");
  c.fillStyle = sh;
  c.fillRect(700, 0, 440, H);
}

/** her chair's back, in front of her lower back (she sits in the row in front of him); (x, y) = the middle of the top rail */
export function chairBack(c: Ctx, x: number, y: number, s: number) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  for (const px of [-150, 150]) {
    rbox(c, px - 14, 0, 28, 220, 8, 84200 + px, 0.6);
    paint(c, "#a67a48", C.ink, 4);
  }
  rbox(c, -175, -10, 350, 74, 16, 84203, 0.8);
  paint(c, vgrad(c, -10, 64, [[0, "#c99a62"], [1, "#a67a48"]]), C.ink, 5);
  inkLine(c, [[-150, 8], [150, 4]], 84204, 3, "rgba(255,236,200,0.5)");
  inkLine(c, [[-140, 40], [120, 44]], 84205, 2, "rgba(110,70,30,0.35)");
  c.restore();
}
