/**
 * 门卫室（《屏蔽》work-73c8f9bc，爸爸值夜班的地方），竖屏 1080×1920 设计坐标，人物另外画（./dad 的 drawDad）。
 * gateNight 雪夜的厂门口（伸缩门、厂名牌、钠灯光锥、雪地上的车辙和脚印、远处的厂房、烟囱和水塔）；
 * boothBack 室内朝窗（窗外就是 gateNight：结霜的铝合金窗、钥匙板、监控屏、暖水瓶、搪瓷杯冒热气、收音机、桌下小太阳）；
 * boothFront 室内背墙（挂钟、挂历、女儿小时候的蜡笔画、围巾、侧窗外的雪，blur 做景深）；
 * deskTop 值班桌俯拍（玻璃板下压着女儿的照片和手写便条、值班本、茶、钥匙）；
 * boothOutside 雪夜里的门卫室外景（屋顶厚雪、牌子、门灯、旧自行车；暖色窗里由 inside 画人）。
 * 厂名、LED 屏、监控时间、挂钟、挂历、便条和值班记录都是参数（默认是《屏蔽》里的）。雪是 ./snow。
 */
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, F, H, Pt, W, beginFrame, blob, fillBg, filtered, glow, hash, inkLine, loadFonts, oval, paint, poly, rbox, text, vgrad } from "../draw";
import { drawKid } from "../kid";
import { phoneBack } from "../phone";
import { drawDad } from "./dad";
import { snow } from "./snow";

/** the sodium lamp's colour (r,g,b): light from outside the booth */
export const LAMP = "255,168,86";

export const gateText = z.object({
  name: z.string().default("红星机械厂").describe("厂门上的厂名牌"),
  led: z.string().default("出入平安").describe("伸缩门上的 LED 小屏"),
});
export type GateText = z.input<typeof gateText>;
export const boothBackOptions = gateText.extend({
  cctv: z.string().default("02:49").describe("监控屏上的时间"),
});
export type BoothBackOptions = z.input<typeof boothBackOptions>;
export const boothFrontOptions = z.object({
  blur: z.number().min(0).max(12).default(0).describe("景深虚化（px），人物近景的背景用 6–8"),
  clock: z.number().min(0).max(24).default(2.8334).describe("挂钟的时间（小时，2.8334 = 2:50）"),
  month: z.string().default("一月").describe("挂历的月份"),
  day: z.string().default("14").describe("挂历的日子"),
  drawing: z.string().default("爸爸").describe("墙上蜡笔画写的字"),
});
export type BoothFrontOptions = z.input<typeof boothFrontOptions>;
export const deskOptions = z.object({
  note: z.string().default("囡囡生日 6月18日").describe("玻璃板下手写便条的第一行"),
  note2: z.string().default("别忘了打电话").describe("便条的第二行"),
  logTitle: z.string().default("值班记录").describe("值班本的标题"),
  log: z.array(z.string()).max(8).default(["22:00 巡逻一次", "23:30 正常", "00:40 正常", "01:50 下雪", "02:40"]).describe("值班本里的记录（最多 8 行）"),
  photos: z.boolean().default(true).describe("玻璃板下压着女儿从小到大的照片"),
});
export type DeskOptions = z.input<typeof deskOptions>;
export const boothOutsideOptions = gateText.extend({
  sign: z.string().default("门卫室").describe("门卫室的牌子"),
});
export type BoothOutsideOptions = z.input<typeof boothOutsideOptions>;

// ---------------------------------------------------------------- outside: the factory gate at night
/** The factory gate in the snow under a sodium lamp, in full-frame design units (the booth window crops it).
 *  `ox` shifts it sideways for parallax; `o.name` is the factory's name board, `o.led` the gate's LED sign. */
export function gateNight(c: Ctx, abs: number, ox = 0, o: GateText = {}) {
  fillBg(c, vgrad(c, 0, H, [[0, "#070b1d"], [0.45, "#141a33"], [0.62, "#231f35"], [1, "#2a2433"]]));
  c.save();
  c.translate(ox, 0);
  // stars, then far factory blocks, a chimney and a water tower
  for (let i = 0; i < 40; i++) {
    c.fillStyle = `rgba(255,255,255,${(0.25 + 0.4 * hash(i * 7.3)).toFixed(2)})`;
    c.fillRect(-200 + hash(i * 3.1) * 1500, hash(i * 5.7) * 520, 2.4, 2.4);
  }
  c.fillStyle = "#10142a";
  c.fillRect(-260, 600, 520, 520);
  c.fillRect(220, 680, 420, 440);
  c.fillRect(600, 560, 700, 560);
  poly(c, [[470, 330], [510, 330], [526, 690], [454, 690]], 6001, 1);
  paint(c, "#121733", "#0a0d1c", 3);
  for (let k = 0; k < 3; k++) {
    // smoke drifting from the chimney
    const t = (abs * 0.08 + k / 3) % 1;
    oval(c, 490 + t * 140, 320 - t * 160, 40 + t * 70, 26 + t * 40, 6002 + k, 2);
    paint(c, `rgba(150,150,170,${(0.18 * (1 - t)).toFixed(3)})`, null);
  }
  rbox(c, 980, 470, 120, 90, 10, 6005, 1);
  paint(c, "#141a36", "#0a0d1c", 3);
  inkLine(c, [[1000, 560], [990, 700]], 6006, 6, "#0f1430");
  inkLine(c, [[1080, 560], [1090, 700]], 6007, 6, "#0f1430");
  for (let i = 0; i < 14; i++) {
    const lit = hash(i * 2.7) > 0.62;
    c.fillStyle = lit ? "rgba(255,200,120,0.75)" : "rgba(50,58,90,0.7)";
    c.fillRect(-200 + (i % 7) * 70, 660 + Math.floor(i / 7) * 70, 38, 30);
    c.fillStyle = hash(i * 4.1) > 0.7 ? "rgba(255,200,120,0.7)" : "rgba(50,58,90,0.6)";
    c.fillRect(640 + (i % 7) * 80, 620 + Math.floor(i / 7) * 80, 40, 34);
  }
  // the gate: two brick pillars with snow caps, the factory's name board between them
  for (const px of [150, 830]) {
    rbox(c, px, 760, 110, 380, 6, 6010 + px, 1);
    paint(c, "#5a4d4a", C.ink, 5);
    for (let r = 0; r < 9; r++) inkLine(c, [[px + 6, 800 + r * 40], [px + 104, 800 + r * 40]], 6012 + r, 2, "rgba(0,0,0,0.3)");
    blob(c, [[px - 12, 764], [px + 55, 740], [px + 122, 764], [px + 116, 776], [px - 6, 776]], 6020 + px, 1);
    paint(c, "#eef1f7", C.ink, 4);
  }
  rbox(c, 230, 700, 620, 90, 8, 6030, 1);
  paint(c, "#1d2440", C.ink, 5);
  text(c, o.name ?? "红星机械厂", 540, 746, { size: 58, font: F.ui, weight: 700, fill: "#d9443a" });
  blob(c, [[220, 702], [540, 684], [860, 702], [852, 712], [228, 712]], 6031, 1);
  paint(c, "#eef1f7", null);
  // the retractable gate across the drive, its little LED board
  for (let k = 0; k < 18; k++) {
    const gx = 260 + k * 32;
    inkLine(c, [[gx, 1060], [gx + 16, 1130], [gx + 32, 1060]], 6040 + k, 3, "#9aa3b3");
  }
  inkLine(c, [[260, 1058], [836, 1058]], 6060, 5, "#c4cbd8");
  rbox(c, 780, 1020, 70, 40, 4, 6061, 0.6);
  paint(c, "#111", C.ink, 3);
  text(c, o.led ?? "出入平安", 815, 1040, { size: 13, font: F.ui, weight: 700, fill: "#ff5b4a" });
  // the lamp post and its cone of light
  c.fillStyle = "#1b2036";
  c.fillRect(960, 500, 16, 700);
  inkLine(c, [[968, 510], [900, 492]], 6070, 8, "#1b2036");
  blob(c, [[880, 484], [920, 484], [924, 498], [876, 498]], 6071, 0.6);
  paint(c, "#ffe2a8", C.ink, 3);
  blob(c, [[870, 474], [930, 474], [936, 486], [864, 486]], 6072, 0.6);
  paint(c, "#eef1f7", null);
  c.save();
  c.globalCompositeOperation = "lighter";
  const cone = c.createLinearGradient(0, 500, 0, 1200);
  cone.addColorStop(0, `rgba(${LAMP},0.35)`);
  cone.addColorStop(1, `rgba(${LAMP},0)`);
  c.fillStyle = cone;
  c.beginPath();
  c.moveTo(886, 498);
  c.lineTo(914, 498);
  c.lineTo(1120, 1220);
  c.lineTo(680, 1220);
  c.closePath();
  c.fill();
  c.restore();
  glow(c, 900, 494, 300, `rgba(${LAMP},0.65)`);
  // snowy ground: lit near the lamp, tyre tracks and footprints to the booth
  c.fillStyle = "#cfd3e0";
  c.fillRect(-300, 1130, 1700, 900);
  glow(c, 900, 1220, 520, `rgba(${LAMP},0.45)`);
  for (const dx of [-30, 30]) inkLine(c, [[420 + dx, 2000], [500 + dx, 1500], [560 + dx, 1140]], 6080 + dx, 8, "rgba(80,86,110,0.35)");
  for (let k = 0; k < 9; k++) {
    oval(c, 760 - k * 60 + (k % 2) * 18, 1180 + k * 70, 9, 14, 6090 + k, 0.4, 0.3);
    paint(c, "rgba(70,76,100,0.4)", null);
  }
  c.restore();
  // snow: far and small behind, near and soft in front
  snow(c, abs, { n: 150, seed: 41, speed: 90, size: 3.2, alpha: 0.85, drift: 26 });
  filtered(c, "blur(4px)", (k) => snow(k, abs, { n: 30, seed: 43, speed: 160, size: 9, alpha: 0.55, drift: 40 }), "gateSnow");
}

// ---------------------------------------------------------------- inside, facing the window (his back to us)
const WIN = { x: 100, y: 250, w: 880, h: 760 };

/** an enamel mug (white, red rim, a red flower), steam rising (abs) */
function enamelMug(c: Ctx, x: number, y: number, s: number, abs: number, seed: number) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  blob(c, [[46, -10], [74, -6], [80, 20], [70, 44], [46, 46]], seed, 0.8);
  paint(c, null, C.ink, 6);
  rbox(c, -50, -60, 100, 120, 14, seed + 1, 0.8);
  paint(c, "#f2efe6", C.ink, 5);
  inkLine(c, [[-50, -52], [50, -52]], seed + 2, 6, "#c0392b");
  oval(c, -8, 6, 16, 14, seed + 3, 0.6);
  paint(c, "#d9443a", null);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    oval(c, -8 + Math.cos(a) * 16, 6 + Math.sin(a) * 14, 9, 7, seed + 4 + k, 0.4, a);
    paint(c, "#e86a5e", null);
  }
  c.restore();
  // steam
  for (let k = 0; k < 3; k++) {
    const t = (abs * 0.5 + k / 3) % 1;
    const sx = x + (k - 1) * 14 * s + Math.sin(abs * 2 + k * 2) * 10 * s;
    inkLine(c, [[sx, y - 70 * s - t * 90 * s], [sx + 10 * s, y - 100 * s - t * 90 * s], [sx - 4 * s, y - 130 * s - t * 90 * s]], seed + 20 + k, 4 * s, `rgba(230,236,250,${(0.4 * (1 - t)).toFixed(3)})`);
  }
}

/** a red thermos flask with a flower print */
function thermos(c: Ctx, x: number, y: number, s: number, seed: number) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  rbox(c, -40, -120, 80, 220, 30, seed, 1);
  paint(c, "#c0392b", C.ink, 5);
  rbox(c, -26, -150, 52, 36, 10, seed + 1, 0.8);
  paint(c, "#8f2a20", C.ink, 4);
  for (let k = 0; k < 3; k++) {
    oval(c, -10 + (k % 2) * 20, -60 + k * 50, 12, 10, seed + 2 + k, 0.5);
    paint(c, "#f3d37a", null);
  }
  inkLine(c, [[-30, -100], [-30, 80]], seed + 6, 5, "rgba(255,255,255,0.25)");
  c.restore();
}

/** The booth from inside, looking out of its window over his shoulder: drawn without him. */
export function boothBack(c: Ctx, abs: number, o: BoothBackOptions = {}) {
  // the view, cropped by the window
  c.save();
  c.beginPath();
  c.rect(WIN.x, WIN.y, WIN.w, WIN.h);
  c.clip();
  gateNight(c, abs, -40, o);
  // frost creeping in from the glass corners, a few condensation runs
  const frost = (fx: number, fy: number, r: number) => {
    const g = c.createRadialGradient(fx, fy, 0, fx, fy, r);
    g.addColorStop(0, "rgba(225,235,250,0.55)");
    g.addColorStop(0.6, "rgba(225,235,250,0.18)");
    g.addColorStop(1, "rgba(225,235,250,0)");
    c.fillStyle = g;
    c.fillRect(fx - r, fy - r, r * 2, r * 2);
  };
  frost(WIN.x, WIN.y + WIN.h, 300);
  frost(WIN.x + WIN.w, WIN.y + WIN.h, 260);
  frost(WIN.x, WIN.y, 160);
  frost(WIN.x + WIN.w, WIN.y, 160);
  for (let k = 0; k < 7; k++) {
    const rx = WIN.x + 40 + hash(k * 3.3) * (WIN.w - 80);
    inkLine(c, [[rx, WIN.y + WIN.h - 220 - hash(k) * 120], [rx + 3, WIN.y + WIN.h - 60]], 6100 + k, 2, "rgba(220,230,250,0.25)");
  }
  c.restore();
  // walls: green dado below, off-white above (dim)
  c.fillStyle = "#2b2e3d";
  c.fillRect(-60, -60, W + 120, WIN.y);
  c.fillRect(-60, -60, WIN.x, H + 120);
  c.fillRect(WIN.x + WIN.w, -60, W + 120 - WIN.x - WIN.w, H + 120);
  c.fillStyle = "#24372f";
  c.fillRect(-60, WIN.y + WIN.h, W + 120, H);
  // the window frame (aluminium), its sliding middle bar
  rbox(c, WIN.x - 12, WIN.y - 12, WIN.w + 24, WIN.h + 24, 6, 6110, 1);
  paint(c, null, "#9aa2b0", 18);
  rbox(c, WIN.x - 12, WIN.y - 12, WIN.w + 24, WIN.h + 24, 6, 6110, 1);
  paint(c, null, C.ink, 5);
  inkLine(c, [[WIN.x + WIN.w / 2, WIN.y], [WIN.x + WIN.w / 2, WIN.y + WIN.h]], 6111, 14, "#8c94a3");
  inkLine(c, [[WIN.x + WIN.w / 2 - 7, WIN.y], [WIN.x + WIN.w / 2 - 7, WIN.y + WIN.h]], 6112, 3, C.ink);
  // key board on the left wall
  rbox(c, -40, 420, 120, 220, 8, 6113, 1);
  paint(c, "#5a4634", C.ink, 4);
  for (let k = 0; k < 6; k++) {
    inkLine(c, [[-20 + (k % 3) * 34, 450 + Math.floor(k / 3) * 90], [-20 + (k % 3) * 34, 490 + Math.floor(k / 3) * 90]], 6114 + k, 4, "#c9c9c9");
    oval(c, -20 + (k % 3) * 34, 498 + Math.floor(k / 3) * 90, 7, 7, 6120 + k, 0.4);
    paint(c, ["#e8343c", "#3a8fd9", "#f3b30c"][k % 3], null);
  }
  // the desk under the window
  poly(c, [[-60, 1010], [1140, 1010], [1140, 1300], [-60, 1300]], 6130, 1);
  paint(c, "#6a4f37", C.ink, 6);
  inkLine(c, [[-60, 1030], [1140, 1030]], 6131, 4, "rgba(170,220,200,0.35)");
  // CCTV monitor with four grainy views and a timestamp
  rbox(c, 130, 760, 300, 250, 12, 6132, 1);
  paint(c, "#1a1c22", C.ink, 6);
  c.save();
  c.beginPath();
  c.rect(150, 780, 260, 190);
  c.clip();
  c.fillStyle = "#33424a";
  c.fillRect(150, 780, 260, 190);
  for (let q = 0; q < 4; q++) {
    const qx = 150 + (q % 2) * 130,
      qy = 780 + Math.floor(q / 2) * 95;
    c.fillStyle = "rgba(190,215,225,0.22)";
    c.fillRect(qx + 4, qy + 4, 122, 87);
    c.fillStyle = "rgba(230,240,245,0.35)";
    c.fillRect(qx + 10, qy + 60, 110, 20);
  }
  const f = Math.floor(abs * 15);
  for (let k = 0; k < 30; k++) {
    c.fillStyle = `rgba(255,255,255,${(0.15 * hash(f + k)).toFixed(3)})`;
    c.fillRect(150 + hash(f * 2 + k) * 260, 780 + hash(f * 3 + k) * 190, 2, 2);
  }
  text(c, o.cctv ?? "02:49", 380, 796, { size: 16, font: F.ui, weight: 700, fill: "#e8f4ff" });
  c.restore();
  glow(c, 280, 875, 300, "rgba(140,190,230,0.32)");
  thermos(c, 900, 900, 0.95, 6140);
  enamelMug(c, 760, 960, 0.8, abs, 6150);
  // a little radio
  rbox(c, 520, 930, 150, 80, 10, 6160, 0.8);
  paint(c, "#7b7b7b", C.ink, 4);
  oval(c, 560, 970, 22, 22, 6161, 0.5);
  paint(c, "#3a3a3a", C.ink, 3);
  inkLine(c, [[650, 930], [700, 860]], 6162, 3, "#bbb");
  // warm light from the lamp outside across the desk; the heater's glow from under it
  glow(c, 700, 1060, 620, `rgba(${LAMP},0.2)`);
  glow(c, 980, 1400, 420, "rgba(255,120,50,0.35)");
}

// ---------------------------------------------------------------- inside, facing him (the wall behind)
/** The back wall behind him: a clock (ten to three by default), the calendar, her crayon drawing, his scarf on a hook,
 *  the side window with snow and the lamp. `blur` softens it (depth of field). */
export function boothFront(c: Ctx, abs: number, o: BoothFrontOptions = {}) {
  const draw = (k: Ctx) => {
    fillBg(k, vgrad(k, 0, H, [[0, "#30333f"], [0.62, "#2a2d39"], [0.62, "#253a30"], [1, "#1c2b24"]]));
    // the side window: snow and the orange lamp
    k.save();
    k.beginPath();
    k.rect(700, 260, 300, 420);
    k.clip();
    fillBg(k, "#151a33");
    glow(k, 900, 360, 260, `rgba(${LAMP},0.7)`);
    snow(k, abs, { x: 690, y: 250, w: 320, h: 440, n: 40, seed: 71, speed: 80, size: 3.4, alpha: 0.85, drift: 16 });
    k.restore();
    rbox(k, 700, 260, 300, 420, 6, 6200, 1);
    paint(k, null, "#9aa2b0", 14);
    inkLine(k, [[850, 260], [850, 680]], 6201, 10, "#8c94a3");
    // wall clock (o.clock hours, 2:50 by default)
    oval(k, 220, 330, 80, 80, 6202, 1);
    paint(k, "#f4efe3", C.ink, 6);
    const hours = o.clock ?? 2.8334;
    const ma = ((hours % 1) * 60 / 60) * Math.PI * 2,
      ha = ((hours % 12) / 12) * Math.PI * 2;
    inkLine(k, [[220, 330], [220 + Math.sin(ha) * 40, 330 - Math.cos(ha) * 40]], 6203, 6);
    inkLine(k, [[220, 330], [220 + Math.sin(ma) * 58, 330 - Math.cos(ma) * 58]], 6204, 4);
    // the calendar, a red header, today circled
    rbox(k, 340, 300, 190, 240, 6, 6205, 1);
    paint(k, "#efe6d2", C.ink, 5);
    k.fillStyle = "#c0392b";
    k.fillRect(342, 302, 186, 50);
    text(k, o.month ?? "一月", 435, 328, { size: 30, font: F.ui, weight: 700, fill: "#fff" });
    text(k, o.day ?? "14", 435, 450, { size: 96, font: F.ui, weight: 700, fill: "#333" });
    // her crayon drawing: a big man and a little girl holding hands, 「爸爸」
    k.save();
    k.translate(180, 610);
    k.rotate(-0.06);
    poly(k, [[-110, -90], [110, -90], [110, 90], [-110, 90]], 6206, 1);
    paint(k, "#fbf6ea", C.ink, 4);
    inkLine(k, [[-40, -30], [-40, 40]], 6207, 6, "#3a6ad8");
    oval(k, -40, -48, 18, 18, 6208, 0.8);
    paint(k, null, "#3a6ad8", 5);
    inkLine(k, [[30, 0], [30, 44]], 6209, 6, "#e8508a");
    oval(k, 30, -12, 13, 13, 6210, 0.8);
    paint(k, null, "#e8508a", 5);
    inkLine(k, [[-40, 10], [30, 20]], 6211, 5, "#f2a33a");
    oval(k, 70, -60, 14, 14, 6212, 0.6);
    paint(k, "#f6c445", null);
    text(k, o.drawing ?? "爸爸", -10, 72, { size: 30, font: F.pen, fill: "#e8508a" });
    k.restore();
    // a scarf on a hook
    inkLine(k, [[560, 600], [560, 630]], 6213, 6, "#888");
    blob(k, [[530, 620], [590, 620], [600, 900], [570, 960], [540, 900]], 6214, 1.4);
    paint(k, "#9b2d3a", C.ink, 4);
    // heater glow at the bottom left
    glow(k, 160, 1500, 460, "rgba(255,130,60,0.45)");
  };
  const b = o.blur ?? 0;
  if (b > 0.2) filtered(c, `blur(${b.toFixed(1)}px)`, draw, "boothFront");
  else draw(c);
}

// ---------------------------------------------------------------- the desk from above
/** a little photo under the desk glass (drawn content `pic` in a 120×150 frame) */
function photo(c: Ctx, x: number, y: number, rot: number, s: number, seed: number, pic: (c: Ctx) => void) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  poly(c, [[-72, -90], [72, -90], [72, 96], [-72, 96]], seed, 0.8);
  paint(c, "#f7f3ea", C.ink, 3.5);
  c.save();
  c.beginPath();
  c.rect(-60, -78, 120, 150);
  c.clip();
  pic(c);
  c.restore();
  c.restore();
}

/** The desk from above: wood under a sheet of glass, her photos from baby to graduation pressed beneath it and a
 *  note in his hand (`note`, `note2`); the duty log (`logTitle`, `log`), a pen, the enamel mug of tea, his keys. The
 *  phone lies at (540, 880) (drawn by the shot). */
export function deskTop(c: Ctx, abs: number, o: DeskOptions = {}) {
  fillBg(c, "#5a3f2a");
  for (let i = 0; i < 14; i++) inkLine(c, [[-40, 80 + i * 140 + Math.sin(i) * 20], [W + 40, 100 + i * 140]], 6300 + i, 3, "rgba(30,18,8,0.35)");
  for (let i = 0; i < 6; i++) {
    oval(c, 200 + i * 150, 300 + (i % 3) * 500, 40, 14, 6320 + i, 1);
    paint(c, null, "rgba(30,18,8,0.3)", 2);
  }
  // under the glass: her photos, the note
  if (o.photos ?? true) {
    photo(c, 170, 1260, -0.12, 1.2, 6330, (k) => {
      k.fillStyle = "#f4c9d4";
      k.fillRect(-60, -78, 120, 150);
      drawKid(k, 0, -6, 0.3, { who: "girl", outfit: "pajamas", body: "bust", eyes: "shut", mouth: "smile", blush: 0.6 });
    });
    photo(c, 900, 1320, 0.1, 1.2, 6331, (k) => {
      k.fillStyle = "#9fd0f0";
      k.fillRect(-60, -78, 120, 150);
      drawKid(k, 0, -4, 0.33, { who: "girl", outfit: "cardigan", body: "bust", eyes: "happy", mouth: "grin", blush: 0.5 });
    });
    photo(c, 860, 230, 0.16, 1.1, 6332, (k) => {
      k.fillStyle = "#cfe8c4";
      k.fillRect(-60, -78, 120, 150);
      drawKid(k, 0, -2, 0.34, { who: "girl", outfit: "uniform", body: "bust", eyes: "open", mouth: "smile" });
    });
  }
  c.save();
  c.translate(250, 1560);
  c.rotate(-0.05);
  poly(c, [[-150, -60], [150, -60], [150, 60], [-150, 60]], 6333, 0.8);
  paint(c, "#fdf6d8", C.ink, 3);
  text(c, o.note ?? "囡囡生日 6月18日", 0, -10, { size: 38, font: F.pen, fill: "#283a7a" });
  text(c, o.note2 ?? "别忘了打电话", 0, 32, { size: 30, font: F.pen, fill: "#283a7a" });
  c.restore();
  // the glass sheet: a green edge, long reflections
  c.save();
  c.globalAlpha = 0.9;
  inkLine(c, [[60, -60], [60, H + 60]], 6340, 10, "rgba(120,200,170,0.5)");
  c.restore();
  const g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0.3, "rgba(255,255,255,0)");
  g.addColorStop(0.36, "rgba(255,255,255,0.07)");
  g.addColorStop(0.42, "rgba(255,255,255,0)");
  g.addColorStop(0.7, "rgba(255,255,255,0)");
  g.addColorStop(0.73, "rgba(255,255,255,0.05)");
  g.addColorStop(0.76, "rgba(255,255,255,0)");
  c.fillStyle = g;
  c.fillRect(-60, -60, W + 120, H + 120);
  // on top: the duty log, open, a pen
  c.save();
  c.translate(150, 520);
  c.rotate(-0.18);
  poly(c, [[-180, -250], [180, -250], [180, 250], [-180, 250]], 6350, 1);
  paint(c, "#f1e9d8", C.ink, 5);
  inkLine(c, [[0, -250], [0, 250]], 6351, 3, "rgba(0,0,0,0.25)");
  text(c, o.logTitle ?? "值班记录", -90, -200, { size: 34, font: F.ui, weight: 700, fill: "#333" });
  for (let i = 0; i < 8; i++) {
    inkLine(c, [[-160, -140 + i * 46], [-20, -140 + i * 46]], 6352 + i, 2, "rgba(60,60,90,0.4)");
    inkLine(c, [[20, -140 + i * 46], [160, -140 + i * 46]], 6362 + i, 2, "rgba(60,60,90,0.4)");
  }
  const log = o.log ?? ["22:00 巡逻一次", "23:30 正常", "00:40 正常", "01:50 下雪", "02:40"];
  for (let i = 0; i < Math.min(8, log.length); i++) text(c, log[i], -90, -122 + i * 46, { size: 22, font: F.pen, fill: "#2a3a7a" });
  c.restore();
  inkLine(c, [[300, 760], [420, 690]], 6380, 12, "#1d3a7a");
  // the enamel mug of tea from above
  oval(c, 930, 560, 120, 120, 6381, 1.2);
  paint(c, "#f2efe6", C.ink, 6);
  oval(c, 930, 560, 96, 96, 6382, 1);
  paint(c, "#7a4a1c", "#c0392b", 6);
  for (let k = 0; k < 5; k++) {
    oval(c, 900 + hash(k) * 60, 530 + hash(k * 2) * 60, 14, 6, 6383 + k, 0.5, k);
    paint(c, "#4f6b2a", null);
  }
  blob(c, [[1040, 540], [1086, 548], [1084, 590], [1040, 596]], 6390, 0.8);
  paint(c, null, C.ink, 7);
  // keys on a ring
  oval(c, 960, 1080, 30, 30, 6391, 0.6);
  paint(c, null, "#b9b9b9", 5);
  for (let k = 0; k < 3; k++) {
    const a = 0.6 + k * 0.5;
    inkLine(c, [[960 + Math.cos(a) * 30, 1080 + Math.sin(a) * 30], [960 + Math.cos(a) * 90, 1080 + Math.sin(a) * 90]], 6392 + k, 10, ["#c9a24a", "#c0c0c0", "#c9a24a"][k]);
  }
  // light: the lamp outside (warm, top left), the dark round the edges
  glow(c, 380, 260, 1000, `rgba(${LAMP},0.18)`);
  const v = c.createRadialGradient(540, 880, 300, 540, 880, 1200);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.55)");
  c.fillStyle = v;
  c.fillRect(-60, -60, W + 120, H + 120);
  void abs;
}

// ---------------------------------------------------------------- the booth from outside
/** The guard booth in the snow at the factory gate: thick snow on the roof, 「门卫室」, a bulb over the door, his old
 *  bicycle; in its warm window `inside` draws him (in the window's own coordinates: the window spans 430–750 ×
 *  830–1080). */
export function boothOutside(c: Ctx, abs: number, inside: (c: Ctx) => void, o: BoothOutsideOptions = {}) {
  gateNight(c, abs, 60, o);
  // the booth body: white walls with a blue band
  rbox(c, 380, 760, 420, 560, 8, 6400, 1.4);
  paint(c, "#d5dbe5", C.ink, 7);
  c.fillStyle = "#2f5d9e";
  c.fillRect(384, 1110, 412, 40);
  // window, warm, with him inside
  c.save();
  c.beginPath();
  c.rect(430, 830, 320, 250);
  c.clip();
  fillBg(c, "#3a2c22");
  glow(c, 590, 960, 380, "rgba(255,190,110,0.6)");
  inside(c);
  c.restore();
  rbox(c, 430, 830, 320, 250, 6, 6401, 1);
  paint(c, null, "#9aa2b0", 12);
  rbox(c, 430, 830, 320, 250, 6, 6401, 1);
  paint(c, null, C.ink, 4);
  inkLine(c, [[590, 830], [590, 1080]], 6402, 6, "#8c94a3");
  glow(c, 590, 1000, 420, "rgba(255,190,110,0.35)");
  // the sign and the door bulb
  rbox(c, 470, 772, 240, 50, 6, 6403, 0.8);
  paint(c, "#f4f2ea", C.ink, 4);
  text(c, o.sign ?? "门卫室", 590, 798, { size: 34, font: F.ui, weight: 700, fill: "#c0392b" });
  oval(c, 780, 840, 12, 12, 6404, 0.5);
  paint(c, "#fff1c8", C.ink, 3);
  glow(c, 780, 850, 200, "rgba(255,214,150,0.6)");
  // flat roof under thick snow, icicles
  blob(c, [[352, 772], [380, 728], [600, 712], [820, 728], [832, 772], [800, 790], [380, 790]], 6405, 1.4);
  paint(c, "#f4f6fb", C.ink, 5);
  for (let k = 0; k < 7; k++) {
    const ix = 400 + k * 62;
    poly(c, [[ix - 6, 790], [ix + 6, 790], [ix, 812 + hash(k) * 22]], 6406 + k, 0.4);
    paint(c, "#e6f0fb", "rgba(0,0,0,0.4)", 2);
  }
  // his old bicycle against the wall, snow on the seat
  c.save();
  c.translate(300, 1250);
  for (const wx of [-70, 70]) {
    oval(c, wx, 0, 58, 58, 6420 + wx, 0.8);
    paint(c, null, "#1b1b22", 6);
  }
  inkLine(c, [[-70, 0], [-10, -70], [70, 0]], 6424, 6, "#2a3a6a");
  inkLine(c, [[-10, -70], [40, -70], [70, 0]], 6425, 6, "#2a3a6a");
  inkLine(c, [[40, -70], [50, -110], [80, -112]], 6426, 5, "#2a3a6a");
  blob(c, [[-34, -88], [8, -88], [10, -76], [-30, -76]], 6427, 0.6);
  paint(c, "#f4f6fb", C.ink, 3);
  c.restore();
  // snow round the booth's feet
  blob(c, [[340, 1320], [600, 1296], [860, 1320], [860, 1360], [340, 1360]], 6430, 1.6);
  paint(c, "#e9ecf4", null);
}

/** the centre of the booth's window in boothOutside */
export const BOOTH_WINDOW: Pt = [590, 955];

const typing = (t: number) => 0.5 + 0.5 * Math.sin(t * 9);
const heldPhone = (k: Ctx) => phoneBack(k, -10, 400, 150, 270, -0.08);

export const resources = defineResources({
  gateNight: resource({
    kind: "set",
    title: "厂门口（雪夜）",
    description:
      "老工厂的大门口，下着雪的深夜：两根砖柱顶着雪、中间的厂名牌（name）、伸缩门和它的 LED 小屏（led）、钠灯和橙色光锥、雪地上的车辙和一串脚印、远处的厂房（零星亮着的窗）、冒烟的烟囱和水塔。ox 左右平移做视差。也是门卫室窗外的景。",
    tags: ["工厂", "厂门", "大门", "雪夜", "路灯", "伸缩门", "冬天", "夜晚", "保安"],
    usage: "gateNight(ctx, abs, ox, { name, led })",
    params: gateText.extend({ ox: z.number().min(-200).max(200).default(0).describe("左右平移（视差）") }),
    presets: { 换个厂名: { name: "第三纺织厂", led: "欢迎回家" } },
    preview: {
      width: 1080,
      height: 1920,
      duration: 4,
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        gateNight(ctx, t, p.ox, p);
      },
    },
  }),
  boothBack: resource({
    kind: "set",
    title: "门卫室·朝窗（背对镜头）",
    description:
      "从门卫室里朝窗外看（他背对镜头坐在桌前）：窗外是雪夜的厂门口，窗角结霜、有水汽流下的痕；铝合金窗框、墙上的钥匙板、桌上的监控屏（cctv 是屏上的时间）、红色暖水瓶、冒热气的搪瓷杯、收音机，桌下小太阳的暖光。人物在它之后画（预览里是 drawDad 的背影）。",
    tags: ["门卫室", "岗亭", "保安", "值班", "室内", "窗", "雪夜", "监控", "搪瓷杯", "暖水瓶"],
    usage: 'boothBack(ctx, abs, { cctv, name, led }); drawDad(ctx, 510, 1170, 1.12, { view: "back", coat: true })',
    params: boothBackOptions,
    preview: {
      width: 1080,
      height: 1920,
      duration: 4,
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        boothBack(ctx, t, p);
        drawDad(ctx, 510, 1170, 1.12, { view: "back", coat: true });
      },
    },
  }),
  boothFront: resource({
    kind: "set",
    title: "门卫室·背墙",
    description:
      "门卫室里他身后的那面墙（正面拍他时的背景）：挂钟（clock，小时）、红头挂历（month、day）、女儿小时候的蜡笔画（drawing 是画上的字）、钩子上的围巾、侧窗外的雪和路灯、绿墙裙、小太阳的暖光。blur 做景深虚化，人物近景用 6–8；人物在它之后画。",
    tags: ["门卫室", "岗亭", "室内", "挂钟", "挂历", "蜡笔画", "背景", "雪夜"],
    usage: 'boothFront(ctx, abs, { blur: 7, clock, month, day, drawing }); drawDad(ctx, 540, 600, 1.42, { coat: true, arms: "phone", holding })',
    params: boothFrontOptions,
    presets: { 人物近景的背景: { blur: 7 } },
    preview: {
      width: 1080,
      height: 1920,
      duration: 4,
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        boothFront(ctx, t, p);
        if (p.blur > 2) drawDad(ctx, 540, 600, 1.42, { coat: true, arms: "phone", eyes: "down", brows: "worried", holding: heldPhone });
      },
    },
  }),
  deskTop: resource({
    kind: "set",
    title: "值班桌俯拍",
    description:
      "俯拍门卫室的值班桌：木桌上压着一块玻璃板，玻璃下是女儿从小到大的照片（photos）和他手写的便条（note、note2）；上面摊着值班本（logTitle、log）、一支笔、一杯茶、一串钥匙，外面的路灯从左上照进来，四周压暗。桌子中间 (540, 880) 留给手机，由镜头自己画。",
    tags: ["桌面", "俯拍", "值班", "门卫室", "照片", "便条", "玻璃板", "父亲", "茶杯", "钥匙"],
    usage: "deskTop(ctx, abs, { note, note2, logTitle, log, photos }); /* 手机放在 (540, 880) */",
    params: deskOptions,
    preview: {
      width: 1080,
      height: 1920,
      duration: 2,
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        deskTop(ctx, t, p);
      },
    },
  }),
  boothOutside: resource({
    kind: "set",
    title: "门卫室外景（雪夜）",
    description:
      "雪夜里厂门口的门卫室：屋顶厚厚的雪和冰溜子、白墙蓝腰线、窗上的牌子（sign）、门口的灯泡、靠墙的旧自行车，背后是 gateNight。暖色的窗里由 inside 画人（窗在 430–750 × 830–1080，中心 BOOTH_WINDOW）；适合结尾从窗里拉出来的长镜头。",
    tags: ["门卫室", "岗亭", "外景", "雪夜", "暖窗", "自行车", "工厂", "结尾"],
    usage: 'boothOutside(ctx, abs, (k) => drawDad(k, 590, 925, 0.4, { coat: true, arms: "type", holding }), { sign, name, led })',
    params: boothOutsideOptions,
    preview: {
      width: 1080,
      height: 1920,
      duration: 4,
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        boothOutside(ctx, t, (k) => drawDad(k, 590, 925, 0.4, { coat: true, eyes: "happy", mouth: "smile", arms: "type", tap: typing(t), holding: heldPhone }), p);
      },
    },
  }),
});
