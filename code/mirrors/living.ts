/**
 * 《mirrors》夜里的客厅（第一幕的手机镜头、第二幕的沙发）：沙发、糊着报纸的圆镜子、落地灯（暖色主光）、窗和月亮、边几上的闹钟。
 * livingRoom(ctx, abs, { clock, day, ring })、光照 livingLight / livingNight、闹钟 alarmClock、茶几 coffeeTable（画在沙发上的人之后）、
 * 手机特写的虚化背景 livingBokeh。
 */
import { z } from "zod";
import { clamp } from "@frame/engine/math";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, Pt, W, beginFrame, blob, bokehDisc, glow, inkLine, lightShaft, loadFonts, oval, paint, poly, rbox, shaded, vgrad } from "../draw";
import { newspaper, tape } from "./story";

/** 《瑕疵：0》 his living room at night (act 1's phone scenes, act 2's couch), drawn once at its wide framing in design
 *  units, facing the couch: the round mirror over it is papered over like every other mirror in the flat; a floor
 *  lamp on the left (the warm key), the window on the right (moonlight, the town), the alarm clock on the side table. */
export const LIVING = {
  vp: [540, 880] as Pt,
  floorY: 1290,
  window: [720, 330, 1010, 930] as [number, number, number, number],
  /** centre x, y and radius of the round mirror */
  mirror: [430, 640, 118] as [number, number, number],
  /** the lamp shade's centre */
  lamp: [110, 505] as Pt,
  clock: [968, 1100] as Pt,
};

/** mix two #rrggbb colours */
export function mixHex(a: string, b: string, t: number) {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const k = clamp(t);
  return `rgb(${[0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * k)).join(",")})`;
}

/** the alarm clock on the side table; `hours` (e.g. 23.8 = 23:48) sets the hands */
export function alarmClock(ctx: Ctx, x: number, y: number, s: number, hours: number, seed = 8800) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  for (const sd of [-1, 1]) {
    oval(ctx, sd * 24, -34, 13, 10, seed + sd, 0.4, sd * 0.5);
    paint(ctx, "#c9c3b8", C.ink, 3.5);
    inkLine(ctx, [[sd * 20, 30], [sd * 28, 44]], seed + 3 + sd, 4);
  }
  oval(ctx, 0, 0, 38, 38, seed + 5, 0.6);
  paint(ctx, "#d8d2c6", C.ink, 4.5);
  oval(ctx, 0, 0, 30, 30, seed + 6, 0.4);
  paint(ctx, "#fbf8f0", C.ink, 2.5);
  const h = ((hours % 12) / 12) * Math.PI * 2,
    m = (hours % 1) * Math.PI * 2;
  inkLine(ctx, [[0, 0], [Math.sin(h) * 15, -Math.cos(h) * 15]], seed + 7, 4, C.ink, 0.2);
  inkLine(ctx, [[0, 0], [Math.sin(m) * 23, -Math.cos(m) * 23]], seed + 8, 2.8, C.ink, 0.2);
  ctx.restore();
}

function couch(ctx: Ctx) {
  const base = "#8c4b32",
    top = "#a55a3c",
    dark = "#6f3925";
  // back
  shaded(ctx, () => rbox(ctx, 180, 950, 680, 190, 46, 8801, 1.2), top, () => {
    const g = ctx.createLinearGradient(0, 950, 0, 1140);
    g.addColorStop(0, "rgba(255,220,190,0.12)");
    g.addColorStop(1, "rgba(60,20,10,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(170, 940, 700, 210);
    inkLine(ctx, [[520, 968], [522, 1120]], 8802, 2.4, "rgba(70,30,18,0.5)");
  }, C.ink, 5);
  // pillows
  shaded(ctx, () => blob(ctx, [[232, 1010], [300, 990], [370, 1004], [376, 1090], [360, 1130], [290, 1136], [226, 1120], [222, 1060]], 8803, 1.5), "#6f86a3", () => {
    inkLine(ctx, [[240, 1100], [300, 1060], [356, 1030]], 8804, 2.4, "rgba(40,54,76,0.5)");
  }, C.ink, 4.5);
  shaded(ctx, () => blob(ctx, [[690, 1004], [760, 994], [826, 1012], [830, 1088], [812, 1132], [748, 1136], [688, 1122], [682, 1060]], 8805, 1.5), "#d3a54c", () => {
    inkLine(ctx, [[700, 1040], [756, 1070], [816, 1110]], 8806, 2.4, "rgba(120,80,20,0.45)");
  }, C.ink, 4.5);
  // seat cushions
  for (const [x0, seed] of [[228, 8807], [520, 8808]] as [number, number][]) {
    shaded(ctx, () => rbox(ctx, x0, 1112, 292, 86, 26, seed, 1), top, () => {
      ctx.fillStyle = "rgba(255,226,200,0.1)";
      ctx.fillRect(x0, 1112, 292, 26);
    }, C.ink, 4.5);
  }
  // arms
  for (const [x0, seed] of [[140, 8809], [800, 8810]] as [number, number][]) {
    shaded(ctx, () => rbox(ctx, x0, 1036, 100, 236, 40, seed, 1.1), base, () => {
      ctx.fillStyle = "rgba(255,220,190,0.1)";
      ctx.fillRect(x0, 1036, 100, 30);
    }, C.ink, 5);
  }
  // front
  shaded(ctx, () => rbox(ctx, 222, 1190, 596, 76, 14, 8811, 1), dark, null, C.ink, 4.5);
  for (const x of [250, 790]) {
    rbox(ctx, x - 12, 1262, 24, 26, 4, 8812 + x, 0.4);
    paint(ctx, "#2a1c16", C.ink, 3);
  }
}

/** the room (no lighting pass); `clock` = the time on the alarm clock in hours, `day` 0 night … 1 dawn (the sky in the
 *  window), `ring` 0..1 the alarm going off (the clock shakes) */
export function livingRoom(ctx: Ctx, abs: number, o: { clock?: number; day?: number; ring?: number } = {}) {
  const fy = LIVING.floorY;
  const day = clamp(o.day ?? 0);
  // wall with a faint stripe
  ctx.fillStyle = vgrad(ctx, -400, fy, [[0, "#222a40"], [1, "#2f3752"]]);
  ctx.fillRect(-400, -400, W + 800, fy + 400);
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for (let x = -400; x < W + 400; x += 64) ctx.fillRect(x, -400, 3, fy + 400);
  // floor: boards running toward the vanishing point
  ctx.fillStyle = "#33271f";
  ctx.fillRect(-400, fy, W + 800, 1000);
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = 2.5;
  const [vx, vy] = LIVING.vp;
  for (let i = -9; i <= 9; i++) {
    const x = vx + i * 120;
    ctx.beginPath();
    ctx.moveTo(x, fy);
    ctx.lineTo(vx + (x - vx) * ((fy + 1000 - vy) / (fy - vy)), fy + 1000);
    ctx.stroke();
  }
  ctx.fillStyle = "#1a1e2c";
  ctx.fillRect(-400, fy - 26, W + 800, 26);
  inkLine(ctx, [[-400, fy - 26], [W + 400, fy - 26]], 8820, 3, "rgba(10,10,16,0.8)", 0.5);
  inkLine(ctx, [[-400, fy], [W + 400, fy]], 8821, 4, C.ink, 0.6);
  // rug
  oval(ctx, 520, 1452, 470, 84, 8822, 1.2);
  paint(ctx, "#3a4462", C.ink, 4);
  oval(ctx, 520, 1452, 430, 68, 8823, 1);
  paint(ctx, null, "rgba(255,255,255,0.12)", 3);

  // the window: night sky, the moon, the town; curtains half drawn
  const [wx0, wy0, wx1, wy1] = LIVING.window;
  rbox(ctx, wx0, wy0, wx1 - wx0, wy1 - wy0, 6, 8824, 0.8);
  paint(ctx, "#c9ccd2", C.ink, 5);
  const gx0 = wx0 + 20,
    gy0 = wy0 + 20,
    gx1 = wx1 - 20,
    gy1 = wy1 - 20;
  ctx.save();
  ctx.beginPath();
  ctx.rect(gx0, gy0, gx1 - gx0, gy1 - gy0);
  ctx.clip();
  ctx.fillStyle = vgrad(ctx, gy0, gy1, [[0, mixHex("#0d1630", "#8fa3d6", day)], [0.6, mixHex("#1b2a50", "#f2b6a4", day)], [1, mixHex("#27375e", "#ffd79c", day)]]);
  ctx.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
  ctx.fillStyle = `rgba(255,250,230,${(0.8 * (1 - day)).toFixed(3)})`;
  for (let i = 0; i < 9; i++) {
    const sx = gx0 + ((i * 97) % (gx1 - gx0)),
      sy = gy0 + 20 + ((i * 61) % 260);
    ctx.fillRect(sx, sy, 2.5, 2.5);
  }
  const moonA = clamp(1 - day * 1.6);
  if (moonA > 0) {
    ctx.save();
    ctx.globalAlpha *= moonA;
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, 925, 430 + 120 * day, 160, "rgba(200,215,255,0.35)");
    ctx.restore();
    ctx.save();
    ctx.globalAlpha *= moonA;
    oval(ctx, 925, 430 + 120 * day, 28, 28, 8825, 0.4);
    paint(ctx, "#fff5d8", null);
    ctx.restore();
  }
  if (day > 0) {
    // dawn: the sky over the roofs turns gold
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, 900, gy1 - 40, 260, `rgba(255,190,120,${(0.5 * day).toFixed(3)})`);
    ctx.restore();
  }
  // the town
  const town = mixHex("#0a0f20", "#4c4f6c", day);
  ctx.fillStyle = town;
  let bx = gx0 - 10;
  let i = 0;
  while (bx < gx1) {
    const bw = 40 + ((i * 37) % 50),
      bh = 70 + ((i * 53) % 120);
    ctx.fillRect(bx, gy1 - bh, bw, bh);
    ctx.fillStyle = `rgba(255,206,120,${(0.85 * (1 - day)).toFixed(3)})`;
    for (let wy = gy1 - bh + 14; wy < gy1 - 10; wy += 22) for (let wx = bx + 8; wx < bx + bw - 8; wx += 16) if ((wx * 7 + wy * 3 + i) % 5 === 0) ctx.fillRect(wx, wy, 6, 8);
    ctx.fillStyle = town;
    bx += bw + 6;
    i++;
  }
  ctx.restore();
  // mullions
  ctx.fillStyle = "#c9ccd2";
  ctx.fillRect((wx0 + wx1) / 2 - 7, gy0, 14, gy1 - gy0);
  ctx.fillRect(gx0, 600, gx1 - gx0, 14);
  inkLine(ctx, [[gx0, gy0], [gx1, gy0], [gx1, gy1], [gx0, gy1], [gx0, gy0]], 8826, 3, "rgba(23,22,26,0.7)", 0.4);
  // curtains and the rail
  inkLine(ctx, [[670, 300], [1060, 300]], 8827, 8, "#3a3530");
  for (const [x0, x1, seed] of [[680, 760, 8828], [972, 1056, 8829]] as [number, number, number][]) {
    shaded(ctx, () => blob(ctx, [[x0, 300], [x1, 300], [x1 + 6, 700], [x1 + 14, 1020], [x0 - 8, 1024], [x0 - 2, 700]], seed, 1.6), "#8794ad", () => {
      for (let k = 1; k < 4; k++) inkLine(ctx, [[x0 + k * ((x1 - x0) / 4), 310], [x0 + k * ((x1 - x0) / 4) + 4, 1010]], seed + k, 2.4, "rgba(40,48,70,0.45)");
    }, C.ink, 4.5);
  }

  // the round mirror over the couch — newspaper and an X of tape
  const [mx, my, mr] = LIVING.mirror;
  inkLine(ctx, [[mx - 70, my - mr + 14], [mx, my - mr - 70], [mx + 70, my - mr + 14]], 8830, 2.4, "#1b1a1e", 0.6);
  oval(ctx, mx, my - mr - 72, 6, 6, 8831, 0.3);
  paint(ctx, "#8a8a8a", C.ink, 2.5);
  oval(ctx, mx, my, mr + 14, mr + 14, 8832, 0.8);
  paint(ctx, "#8a6646", C.ink, 5);
  ctx.save();
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.clip();
  newspaper(ctx, mx - mr - 10, my - mr - 10, mr * 2 + 20, mr * 2 + 20, 0.05, 8833);
  ctx.restore();
  oval(ctx, mx, my, mr, mr, 8834, 0.6);
  paint(ctx, null, C.ink, 3.5);
  tape(ctx, mx, my, 270, 30, 0.72, 8835);
  tape(ctx, mx, my, 270, 30, -0.72, 8836);

  // the floor lamp
  const [lx, ly] = LIVING.lamp;
  oval(ctx, lx, fy - 6, 62, 14, 8837, 0.6);
  paint(ctx, "#23201d", C.ink, 4);
  inkLine(ctx, [[lx, fy - 10], [lx + 2, ly + 40]], 8838, 9, C.ink);
  inkLine(ctx, [[lx, fy - 10], [lx + 2, ly + 40]], 8838, 5, "#4a423a");
  shaded(ctx, () => poly(ctx, [[lx - 52, ly - 52], [lx + 52, ly - 52], [lx + 82, ly + 48], [lx - 82, ly + 48]], 8839, 1), "#f6e2b8", () => {
    const g = ctx.createLinearGradient(lx - 82, 0, lx + 82, 0);
    g.addColorStop(0, "rgba(255,255,240,0.4)");
    g.addColorStop(1, "rgba(200,140,70,0.25)");
    ctx.fillStyle = g;
    ctx.fillRect(lx - 90, ly - 60, 180, 120);
  }, C.ink, 4.5);

  couch(ctx);
  // side table with the alarm clock and a mug
  rbox(ctx, 900, 1150, 150, 18, 4, 8840, 0.6);
  paint(ctx, "#5b4334", C.ink, 4);
  for (const x of [918, 1032]) inkLine(ctx, [[x, 1166], [x, fy - 2]], 8841 + x, 6, "#3c2c22");
  const ring = o.ring ?? 0;
  ctx.save();
  ctx.translate(LIVING.clock[0], LIVING.clock[1] + 30);
  ctx.rotate(ring > 0 ? Math.sin(abs * 70) * 0.16 * ring : 0);
  ctx.translate(-LIVING.clock[0], -LIVING.clock[1] - 30);
  alarmClock(ctx, LIVING.clock[0], LIVING.clock[1] - (ring > 0 ? Math.abs(Math.sin(abs * 47)) * 6 * ring : 0), 1, o.clock ?? 23.8);
  ctx.restore();
  rbox(ctx, 1004, 1104, 34, 44, 6, 8842, 0.5);
  paint(ctx, "#d9dde4", C.ink, 3.5);
  void abs;
}

/** The low coffee table in front of the couch — draw it after whoever sits on the couch (it hides his legs): his maths
 *  workbook (the homework she reminded him about), a pencil, a mug. */
export function coffeeTable(ctx: Ctx) {
  for (const x of [262, 778]) {
    rbox(ctx, x - 14, 1250, 28, 112, 6, 8870 + x, 0.6);
    paint(ctx, "#4a3326", C.ink, 4);
  }
  shaded(ctx, () => blob(ctx, [[236, 1168], [804, 1168], [846, 1236], [194, 1236]], 8873, 1.2), "#7a5638", () => {
    ctx.fillStyle = "rgba(255,220,180,0.12)";
    ctx.fillRect(190, 1168, 660, 14);
    inkLine(ctx, [[300, 1200], [520, 1198], [760, 1206]], 8875, 2.2, "rgba(60,36,20,0.4)");
  }, C.ink, 5);
  shaded(ctx, () => rbox(ctx, 194, 1234, 652, 28, 6, 8874, 0.8), "#5c3f2a", null, C.ink, 4.5);
  // the workbook (blue band), a pencil across it
  shaded(ctx, () => poly(ctx, [[338, 1186], [478, 1182], [490, 1222], [328, 1227]], 8876, 0.6), "#eef2f6", () => {
    ctx.fillStyle = "#6f93c4";
    ctx.fillRect(320, 1180, 175, 13);
  }, C.ink, 3.5);
  inkLine(ctx, [[392, 1216], [470, 1196]], 8877, 7, "#f2c14e");
  inkLine(ctx, [[392, 1216], [470, 1196]], 8877, 2, C.ink);
  // a mug
  shaded(ctx, () => rbox(ctx, 640, 1170, 46, 50, 8, 8878, 0.6), "#d9dde4", () => {
    ctx.fillStyle = "rgba(60,70,90,0.25)";
    ctx.fillRect(668, 1166, 24, 60);
  }, C.ink, 4);
  oval(ctx, 694, 1192, 12, 13, 8879, 0.4);
  paint(ctx, null, C.ink, 4);
}

/** Night (day 0): the lamp is the only warm light (the wall and couch near it glow), the window throws a little cold
 *  moonlight, the rest of the room sinks into blue dark. Dawn (day 1): the window lifts the dark, a warm shaft of
 *  early light falls across the floor and the couch, the lamp (still on: he never slept) fades into it. */
export function livingLight(ctx: Ctx, abs: number, day = 0) {
  const [lx, ly] = LIVING.lamp;
  const n = 1 - clamp(day);
  const cx = lx + 60 + (865 - lx - 60) * day,
    cy = ly + 140 + (640 - ly - 140) * day;
  const shade = ctx.createRadialGradient(cx, cy, 160, cx, cy, 1500);
  shade.addColorStop(0, "rgba(6,8,22,0)");
  shade.addColorStop(0.4, `rgba(6,8,22,${(0.42 * n + 0.1 * day).toFixed(3)})`);
  shade.addColorStop(1, `rgba(6,8,22,${(0.72 * n + 0.3 * day).toFixed(3)})`);
  ctx.fillStyle = shade;
  ctx.fillRect(-400, -400, W + 800, 2800);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const fl = 1 + 0.01 * Math.sin(abs * 2.1);
  glow(ctx, lx, ly + 20, 620, `rgba(255,160,80,${(0.26 * fl * (1 - 0.6 * day)).toFixed(3)})`);
  glow(ctx, lx, ly, 150, "rgba(255,226,170,0.55)");
  glow(ctx, 865, 620, 420, `rgba(130,160,255,${(0.12 * n).toFixed(3)})`);
  if (day > 0) glow(ctx, 865, 700, 700, `rgba(255,196,160,${(0.22 * day).toFixed(3)})`);
  ctx.restore();
  if (day > 0.01) lightShaft(ctx, [[730, 340], [1000, 340], [760, 1700], [40, 1560]], 865, 600, 420, 1560, "255,212,176", 0.2 * day, 30, "dawnShaft");
}
export const livingNight = (ctx: Ctx, abs: number) => livingLight(ctx, abs, 0);

/** The backdrop for the phone close-ups: the same room, far out of focus — the lamp's warm haze and big soft discs
 *  on the left, the window's cold light and the town's specks on the right. (dx, dy) = a little parallax. */
export function livingBokeh(ctx: Ctx, dx = 0, dy = 0) {
  ctx.fillStyle = vgrad(ctx, 0, 1920, [[0, "#121630"], [0.55, "#0c0f22"], [1, "#07080f"]]);
  ctx.fillRect(-60, -60, W + 120, 2040);
  ctx.save();
  ctx.translate(dx, dy);
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, 40, 520, 680, "rgba(255,150,70,0.22)");
  bokehDisc(ctx, 70, 470, 124, "255,184,110", 0.2);
  bokehDisc(ctx, 196, 640, 70, "255,196,130", 0.13);
  bokehDisc(ctx, -10, 780, 92, "255,170,96", 0.12);
  glow(ctx, 1030, 620, 540, "rgba(120,150,255,0.18)");
  bokehDisc(ctx, 990, 500, 66, "170,196,255", 0.17);
  bokehDisc(ctx, 1052, 700, 46, "255,226,150", 0.15);
  bokehDisc(ctx, 936, 770, 34, "255,214,140", 0.13);
  bokehDisc(ctx, 1030, 880, 56, "150,180,255", 0.11);
  ctx.restore();
}

// ---------------------------------------------------------------- resources (preview and catalog)
export const resources = defineResources({
  livingRoom: resource({
    kind: "set",
    title: "夜里的客厅",
    description:
      "朝着沙发的客厅：沙发上方糊着报纸的圆镜子、左边的落地灯（暖色主光）、右边的窗（月光和小城）、边几上的闹钟。clock 是闹钟的时间（小时，23.8 = 23:48），day 0 夜 … 1 天亮（窗外），ring 0..1 闹钟响（抖动）。之后画 livingLight（day 同样传）；坐在沙发上的人之后画 coffeeTable。",
    tags: ["客厅", "沙发", "夜晚", "台灯", "闹钟", "镜子"],
    usage: "livingRoom(ctx, abs, { clock, day, ring }); /* 沙发上的人 */; coffeeTable(ctx); livingLight(ctx, abs, day)",
    params: z.object({
      clock: z.number().min(0).max(24).default(23.8).describe("闹钟时间（小时）"),
      day: z.number().min(0).max(1).default(0).describe("0 夜 … 1 天亮"),
      ring: z.number().min(0).max(1).default(0).describe("闹钟响"),
    }),
    presets: { 天亮闹钟响: { clock: 7, day: 1, ring: 1 } },
    preview: {
      width: 1080,
      height: 1920,
      duration: 3,
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        livingRoom(ctx, t, p);
        coffeeTable(ctx);
        livingLight(ctx, t, p.day);
      },
    },
  }),
  alarmClock: resource({
    kind: "prop",
    title: "闹钟",
    description: "边几上的闹钟，hours 设定指针（23.8 = 23:48）。",
    tags: ["闹钟", "时钟", "时间"],
    usage: "alarmClock(ctx, x, y, s, hours)",
    params: z.object({ hours: z.number().min(0).max(24).default(23.8).describe("时间（小时）") }),
    preview: {
      width: 400,
      height: 400,
      duration: 3,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        alarmClock(ctx, 200, 220, 2.2, p.hours + t * 0.2);
      },
    },
  }),
  livingBokeh: resource({
    kind: "effect",
    title: "客厅的虚化背景（手机特写用）",
    description: "手机特写的背景：同一个客厅完全虚化，左边台灯的暖色光晕和大光斑，右边窗户的冷光。dx、dy 跟着手持镜头小幅移动。",
    tags: ["虚化", "光斑", "背景", "客厅", "夜晚"],
    usage: "livingBokeh(ctx, dx, dy)",
    preview: {
      width: 1080,
      height: 1920,
      draw(ctx) {
        livingBokeh(ctx);
      },
    },
  }),
});
