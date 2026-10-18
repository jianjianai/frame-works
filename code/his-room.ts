/**
 * 他的卧室（精细版，《unhappy》重置版画的）：床在右、床头柜和台灯在左、窗在床上方（月亮和城市 / 早上的太阳）、s0rrow 海报、
 * 一串暖白串灯夹着三张拍立得、闹钟、漫画书、耳机、地板和地毯。台灯 lamp 开关、串灯 lights、天亮 dawn（阳光从窗户进来）。
 * 画法照 bedroom-detail.ts：先画材质，再整体压暗（窗户自己发光不压），最后加有来源的光（台灯光池和光柱、浮尘、窗格月光）。
 * 配套：盖在腿上的蓝色星星被子 hisDuvet、按房间的光给坐在床上的他打光 hisInBed、蒙在被子里的他 hisRoomCurled、
 * 手机近景后面失焦的房间 hisBokeh。设计坐标 1080×1920，按绝对时间画。
 */
import { z } from "zod";
import { clamp } from "@frame/engine/math";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, F, H, Pt, W, beginFrame, blob, bokehDisc, camera, fillBg, glow, hash, inkLine, lightShaft, litFigure, loadFonts, motes, oval, paint, poly, rbox, text, vgrad } from "./draw";
import { mix } from "./places";
import { paneLight } from "./sets";
import { drawKid, type KidPose } from "./kid";
import { phoneBack } from "./phone";

export const hisRoomOptions = z.object({
  lamp: z.number().min(0).max(1).default(1).describe("床头柜上的台灯"),
  lights: z.number().min(0).max(1).default(0.7).describe("串灯"),
  dawn: z.number().min(0).max(1).default(0).describe("第二天早上：阳光从窗户进来，台灯不亮"),
  clock: z.string().optional().describe("闹钟上的时间（不写时夜里 23:30、早上 07:00）"),
});
export type HisRoomOptions = z.input<typeof hisRoomOptions>;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------- his room
/** where things are in his room (design units) */
export const ROOM = {
  /** the desk lamp's bulb, on the bedside table on the left */
  lamp: [232, 690] as Pt,
  /** the window above the bed (x, y, w, h) */
  win: [640, 236, 380, 460] as const,
  /** the moon in the window */
  moon: [912, 330] as Pt,
};

/** His room. `lamp` 0..1 the bedside lamp, `lights` 0..1 the string of warm bulbs, `dawn` 0..1 the next morning
 *  (sun through the window, no lamp). Draw him and the duvet after it. */
export function hisRoom(c: Ctx, abs: number, o: HisRoomOptions = {}) {
  const on = clamp(o.lamp ?? 1),
    dawn = clamp(o.dawn ?? 0),
    fairy = clamp(o.lights ?? 0.7) * (1 - dawn);
  const [lx, ly] = ROOM.lamp;
  fillBg(c, vgrad(c, 0, H, [[0, mix("#1d2340", "#8d93b4", dawn)], [0.55, mix("#1c223b", "#8a8aa8", dawn)], [1, mix("#141a2e", "#5f5f78", dawn)]]));
  // cornice and a faint plaster texture
  poly(c, [[-60, 0], [1140, 0], [1140, 92], [-60, 100]], 82000, 0.7);
  paint(c, mix("#262c4b", "#a0a6c4", dawn), null);
  inkLine(c, [[-60, 99], [1140, 91]], 82001, 3, "rgba(150,160,200,0.15)", 0.5);
  for (let i = 0; i < 60; i++) {
    const x = hash(i * 5.7 + 19) * W,
      y = 110 + hash(i * 8.3 + 21) * 1100;
    inkLine(c, [[x, y], [x + 8 + hash(i + 19) * 18, y + 2]], 82010 + i, 1, "rgba(160,170,210,0.05)", 0.2);
  }
  // floor: planks in perspective, a rug
  poly(c, [[-60, 1240], [1140, 1230], [1140, 2000], [-60, 2000]], 82100, 1);
  paint(c, mix("#2b2a3c", "#8c7764", dawn), C.ink, 4);
  for (let i = -5; i < 10; i++) {
    const end = -250 + i * 205,
      near = 520 + (end - 520) * 0.3;
    inkLine(c, [[near, 1240], [end, 2000]], 82110 + i, 2, "rgba(9,10,27,0.45)", 0.5);
    inkLine(c, [[near + 3, 1240], [end + 3, 2000]], 82130 + i, 1, "rgba(160,140,130,0.13)", 0.3);
  }
  for (const y of [1310, 1420, 1570, 1770, 1990]) inkLine(c, [[-60, y], [1140, y - 11]], 82150 + y, 1.8, "rgba(14,12,29,0.34)", 0.4);
  oval(c, 560, 1470, 540, 170, 82160, 1);
  paint(c, mix("#33415f", "#7d8fb0", dawn), "#1c2238", 4);
  oval(c, 560, 1467, 505, 148, 82161, 0.8);
  paint(c, null, "rgba(150,170,210,0.35)", 2);
  c.save();
  oval(c, 560, 1470, 525, 162, 82160, 0);
  c.clip();
  for (let y = 1310; y < 1640; y += 12) inkLine(c, [[20, y], [1100, y + 3]], 82170 + y, 1, "rgba(170,190,230,0.09)", 0.4);
  c.restore();
  windowScene(c, abs, dawn);
  // poster and the string of lights with three polaroids, on the wall left of the window
  rbox(c, 70, 250, 220, 280, 6, 82300, 1.2);
  paint(c, mix("#3a3158", "#8e86b0", dawn), C.ink, 5);
  oval(c, 180, 360, 56, 56, 82301, 1.2);
  paint(c, null, "#8d7bb8", 6);
  text(c, "s0rrow", 180, 478, { size: 34, font: F.marker, fill: "#8d7bb8" });
  polaroids(c, dawn);
  // the bedside table (left), the lamp on it, an alarm clock and comics
  bedsideTable(c, abs, dawn, o.clock ?? (dawn < 0.5 ? "23:30" : "07:00"));
  lampAt(c, lx, ly, on);
  // the bed (right): headboard, pillow, mattress
  oval(c, 790, 1255, 420, 70, 82400, 0.5);
  paint(c, "rgba(5,7,20,0.45)", null);
  poly(c, [[400, 700], [1140, 692], [1140, 1010], [404, 1016]], 82401, 1);
  paint(c, mix("#2f4664", "#6e86a8", dawn), C.ink, 5);
  inkLine(c, [[404, 712], [1140, 704]], 82402, 5, "rgba(140,170,210,0.3)", 0.6);
  for (let x = 480; x < 1140; x += 120) inkLine(c, [[x, 716], [x + 2, 990]], 82403 + x, 2, "rgba(12,20,40,0.35)", 0.5);
  blob(c, [[640, 760], [1040, 748], [1066, 860], [624, 872]], 82410, 1.2);
  paint(c, mix("#cdd6e6", "#eef2f8", dawn), C.ink, 4);
  inkLine(c, [[650, 774], [1030, 764], [1050, 846]], 82411, 2, "rgba(255,255,255,0.45)", 0.7);
  poly(c, [[380, 950], [1160, 940], [1160, 1150], [372, 1158]], 82420, 1);
  paint(c, mix("#aab3c8", "#d9deea", dawn), C.ink, 5);
  poly(c, [[372, 1150], [1160, 1142], [1160, 1268], [376, 1272]], 82421, 1);
  paint(c, mix("#5b6684", "#8e98b4", dawn), C.ink, 5);
  inkLine(c, [[376, 1162], [1150, 1155]], 82422, 3, "rgba(190,205,235,0.4)", 0.6);
  for (let x = 450; x < 1140; x += 150) inkLine(c, [[x, 1170], [x, 1236]], 82423 + x, 1.4, "rgba(20,24,44,0.25)", 0.4);
  // darken the materials (the window lights itself), then the light that has a source
  const [wx, wy, ww, wh] = ROOM.win;
  c.save();
  c.beginPath();
  c.rect(-60, -60, W + 120, H + 120);
  c.rect(wx, wy, ww, wh);
  c.clip("evenodd");
  c.fillStyle = `rgba(7,12,31,${((0.2 + 0.42 * (1 - on)) * (1 - dawn)).toFixed(3)})`;
  c.fillRect(-60, -60, W + 120, H + 120);
  c.restore();
  // the moon (or the morning sun) through the panes: onto the bed, the rug and the air
  const winRgb = dawn > 0.5 ? "255,214,160" : "124,153,218";
  const winA = lerp(1, 1.9, dawn);
  paneLight(c, [[540, 1010], [940, 1004], [760, 1500], [120, 1480]], winRgb, (0.1 + 0.08 * (1 - on)) * winA, 10, "his-floor-panes");
  lightShaft(c, [[660, 460], [1000, 500], [700, 1460], [150, 1300]], 820, 470, 420, 1400, winRgb, 0.06 * winA, 28, "his-air");
  if (on > 0 && dawn < 1) {
    const k = on * (1 - dawn);
    glow(c, lx, ly - 10, 520, "rgba(255,185,109,0.24)", k);
    lightShaft(c, [[lx - 45, ly + 17], [lx + 45, ly + 17], [lx + 160, ly + 175], [lx - 150, ly + 175]], lx, ly + 17, lx, ly + 215, "255,196,125", 0.18 * k, 12, "his-lamp-down");
    c.save();
    c.globalCompositeOperation = "lighter";
    glow(c, lx, ly + 18, 60, "rgba(255,219,163,0.36)", k);
    c.restore();
    motes(c, abs, lx + 20, ly + 50, 170, 150, 10, 82930, "241,209,170", 0.2, 1.5);
  }
  if (dawn > 0) {
    c.save();
    c.globalCompositeOperation = "lighter";
    glow(c, wx + ww * 0.5, wy + wh * 0.6, 760, "rgba(255,196,130,0.22)", dawn);
    c.restore();
    motes(c, abs, 700, 900, 300, 380, 16, 82940, "255,226,180", 0.3 * dawn, 1.8);
  }
  stringLights(c, abs, fairy);
}

/** the window above his bed: night sky, moon, a city of lit windows — or the sun coming up over it */
function windowScene(c: Ctx, abs: number, dawn: number) {
  const [x, y, w, h] = ROOM.win;
  rbox(c, x - 20, y - 20, w + 40, h + 50, 7, 82500, 0.8);
  paint(c, mix("#121729", "#7a7f96", dawn), C.ink, 5);
  rbox(c, x - 9, y - 8, w + 18, h + 18, 4, 82501, 0.5);
  paint(c, mix("#5f6b86", "#b9bdcc", dawn), "#19162a", 4);
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.fillStyle = vgrad(c, y, y + h, [[0, mix("#121a3a", "#8fb4dd", dawn)], [0.66, mix("#2c375e", "#ffd6a4", dawn)], [1, mix("#46446a", "#ffb47e", dawn)]]);
  c.fillRect(x, y, w, h);
  if (dawn < 0.8) {
    c.globalAlpha = 1 - dawn;
    for (let i = 0; i < 16; i++) {
      const sx = x + hash(i * 2.3 + 52) * w,
        sy = y + hash(i * 3.7 + 46) * h * 0.6;
      c.fillStyle = `rgba(204,221,254,${(0.3 + 0.22 * Math.sin(abs * 0.4 + i)).toFixed(3)})`;
      c.beginPath();
      c.arc(sx, sy, 1 + hash(i + 54), 0, Math.PI * 2);
      c.fill();
    }
    const [mx, my] = ROOM.moon;
    glow(c, mx, my, 120, "rgba(197,211,251,0.25)");
    oval(c, mx, my, 40, 40, 82505, 0.5);
    paint(c, "#ecead0", null);
    oval(c, mx + 14, my - 11, 35, 35, 82506, 0.5);
    paint(c, "#1a2244", null);
    c.globalAlpha = 1;
  }
  if (dawn > 0) glow(c, x + w * 0.4, y + h * 0.82, 260, "rgba(255,236,190,0.95)", dawn);
  // a thin cloud, then the city
  c.fillStyle = `rgba(110,120,160,${(0.1 * (1 - dawn)).toFixed(3)})`;
  c.beginPath();
  c.ellipse(800 + Math.sin(abs * 0.05) * 18, 380, 170, 12, -0.06, 0, Math.PI * 2);
  c.fill();
  for (let i = 0; i < 7; i++) {
    const bx = 622 + i * 62,
      bh = 80 + hash(i * 7.9) * 150,
      by = y + h + 10 - bh;
    c.fillStyle = mix(i % 2 ? "#18213a" : "#1f2842", "#7d7a90", dawn);
    c.fillRect(bx, by, 56, bh);
    c.fillStyle = mix("#4f5a75", "#a8a3b0", dawn);
    c.fillRect(bx - 2, by - 3, 60, 4);
    for (let k = 0; k < 10; k++)
      if (hash(i * 17 + k * 7.9) > 0.62) {
        c.fillStyle = `rgba(242,188,109,${((0.22 + hash(k * 3 + i) * 0.45) * (1 - dawn)).toFixed(2)})`;
        c.fillRect(bx + 8 + (k % 3) * 16, by + 16 + Math.floor(k / 3) * 28, 7, 12);
      }
  }
  poly(c, [[x + w - 40, y], [x + w - 8, y], [x + 110, y + h], [x + 76, y + h]], 82510, 0.2);
  paint(c, "rgba(174,202,239,0.07)", null);
  c.restore();
  // mullions, sill, a gathered curtain on the right
  for (const mx of [x, x + w / 2, x + w]) {
    inkLine(c, [[mx, y - 2], [mx, y + h + 2]], 82520 + mx, 7, mix("#30364a", "#5c6276", dawn), 0.4);
    inkLine(c, [[mx + 3, y + 1], [mx + 3, y + h - 1]], 82530 + mx, 1.6, "#8c97ad", 0.2);
  }
  inkLine(c, [[x, y + h * 0.45], [x + w, y + h * 0.45]], 82540, 8, mix("#30364a", "#5c6276", dawn), 0.4);
  poly(c, [[x - 15, y + h + 3], [x + w + 15, y + h + 3], [x + w + 34, y + h + 33], [x - 21, y + h + 33]], 82541, 0.7);
  paint(c, mix("#626d86", "#b4b4c4", dawn), C.ink, 4);
  // a little cactus on the sill
  rbox(c, x + 42, y + h - 28, 46, 34, 6, 82542, 0.6);
  paint(c, "#a8674a", C.ink, 3);
  blob(c, [[x + 52, y + h - 28], [x + 50, y + h - 70], [x + 65, y + h - 84], [x + 79, y + h - 70], [x + 78, y + h - 28]], 82543, 0.6);
  paint(c, mix("#3f6b52", "#6aa37c", dawn), C.ink, 3);
  inkLine(c, [[x - 30, y - 30], [x + w + 70, y - 30]], 82550, 6, "#3a3048", 0.5);
  const cur: Pt[] = [[x + w - 34, y - 22], [x + w + 66, y - 22], [x + w + 40, y + 230], [x + w + 80, y + h + 60], [x + w - 6, y + h + 70], [x + w + 8, y + 250], [x + w - 30, y + 220]];
  poly(c, cur, 82551, 1);
  paint(c, mix("#3e4a72", "#8e9ac0", dawn), C.ink, 4);
  c.save();
  poly(c, cur, 82551, 1);
  c.clip();
  for (let i = 0; i < 4; i++) {
    const px = x + w - 20 + i * 24;
    inkLine(c, [[px, y - 18], [px - 8, y + 230], [px + 22, y + h + 60]], 82560 + i, 9, "rgba(14,16,40,0.22)", 0.7);
    inkLine(c, [[px + 5, y - 18], [px - 3, y + 228], [px + 27, y + h + 58]], 82570 + i, 2, "rgba(190,200,230,0.28)", 0.4);
  }
  c.restore();
}

/** three polaroids clipped under the string of lights (his friends, a basketball court, the class photo) */
function polaroids(c: Ctx, dawn: number) {
  const frames: [number, number, number, string][] = [
    [380, 330, -0.1, "#7aa0c4"],
    [496, 310, 0.07, "#d49a7a"],
    [596, 340, -0.04, "#8f86b8"],
  ];
  frames.forEach(([x, y, r, col], i) => {
    c.save();
    c.translate(x, y);
    c.rotate(r);
    poly(c, [[-46, -52], [52, -52], [54, 64], [-42, 64]], 82600 + i, 0.5);
    paint(c, "rgba(7,8,25,0.32)", null);
    poly(c, [[-48, -56], [48, -56], [48, 60], [-48, 60]], 82610 + i, 0.7);
    paint(c, mix("#dcd8cc", "#f6f2e6", dawn), C.ink, 3);
    poly(c, [[-38, -46], [38, -46], [38, 30], [-38, 30]], 82620 + i, 0.4);
    paint(c, mix(col, "#e8e2d6", dawn * 0.3), null);
    // tiny figures: two heads (friends), a hoop, a row of heads
    c.fillStyle = "rgba(30,26,40,0.55)";
    if (i === 0) for (const dx of [-14, 14]) (c.beginPath(), c.arc(dx, 0, 11, 0, Math.PI * 2), c.fill());
    if (i === 1) {
      c.strokeStyle = "rgba(30,26,40,0.6)";
      c.lineWidth = 3;
      c.strokeRect(-16, -30, 32, 22);
      c.beginPath();
      c.ellipse(0, -4, 10, 4, 0, 0, Math.PI * 2);
      c.stroke();
    }
    if (i === 2) for (let k = 0; k < 5; k++) (c.beginPath(), c.arc(-28 + k * 14, 2 + (k % 2) * 4, 6, 0, Math.PI * 2), c.fill());
    poly(c, [[-14, -64], [12, -66], [16, -48], [-13, -47]], 82630 + i, 0.5);
    paint(c, "#2b2a36", null);
    c.restore();
  });
}

function bedsideTable(c: Ctx, abs: number, dawn: number, clock: string) {
  poly(c, [[60, 820], [400, 820], [394, 1150], [66, 1156]], 82700, 1);
  paint(c, mix("#3e3a52", "#857c94", dawn), C.ink, 5);
  poly(c, [[400, 820], [420, 802], [414, 1118], [394, 1150]], 82701, 0.6);
  paint(c, mix("#2b2840", "#6a6280", dawn), C.ink, 4);
  poly(c, [[80, 886], [380, 886], [376, 1110], [84, 1112]], 82702, 0.5);
  paint(c, mix("#1e1c30", "#4a4560", dawn), "#2b2238", 4);
  poly(c, [[82, 844], [382, 844], [380, 902], [84, 903]], 82703, 0.6);
  paint(c, mix("#5a5470", "#a29ab4", dawn), "#362a43", 3);
  inkLine(c, [[205, 869], [255, 869]], 82704, 5, "#a09ab0", 0.5);
  // comics on the lower shelf
  for (let i = 0; i < 5; i++) {
    const x = 110 + i * 46,
      h = 100 + (i % 3) * 16;
    poly(c, [[x, 1105 - h], [x + 36, 1105 - h], [x + 38, 1106], [x, 1107]], 82710 + i, 0.6);
    paint(c, ["#3f6f96", "#c46a5a", "#d9b25c", "#6a8c6e", "#7d6aa8"][i], C.ink, 2.5);
    inkLine(c, [[x + 8, 1120 - h], [x + 28, 1120 - h]], 82720 + i, 1.5, "rgba(230,220,210,0.45)", 0.2);
  }
  for (const x of [88, 380]) {
    poly(c, [[x, 1150], [x + 17, 1150], [x + 14, 1206], [x - 1, 1206]], 82730 + x, 0.5);
    paint(c, "#2e2a3c", C.ink, 3);
  }
  // the top
  poly(c, [[44, 788], [410, 782], [432, 806], [56, 824]], 82740, 0.7);
  paint(c, mix("#6e6488", "#b5aac6", dawn), C.ink, 4);
  poly(c, [[56, 824], [432, 806], [432, 820], [57, 837]], 82741, 0.5);
  paint(c, mix("#443e58", "#7a7090", dawn), C.ink, 3);
  // a digital alarm clock (the time comes from the film)
  rbox(c, 300, 742, 92, 50, 9, 82750, 0.6);
  paint(c, "#1f1f28", C.ink, 3);
  text(c, clock, 346, 768, { size: 26, font: F.ui, weight: 700, fill: "#ff8f6a" });
  glow(c, 346, 768, 70, "rgba(255,120,80,0.18)", 1 - dawn);
  // headphones lying on the table
  inkLine(c, [[96, 790], [110, 756], [150, 744], [186, 760], [196, 792]], 82760, 6, "#2a2a34", 0.5);
  oval(c, 96, 796, 16, 12, 82761, 0.4);
  paint(c, "#2a2a34", C.ink, 2.5);
  oval(c, 196, 796, 16, 12, 82762, 0.4);
  paint(c, "#2a2a34", C.ink, 2.5);
  void abs;
}

function lampAt(c: Ctx, x: number, y: number, on: number) {
  inkLine(c, [[x + 10, y + 110], [x + 100, y + 122], [x + 140, y + 180], [x + 136, y + 330]], 82800, 2.7, "#302338", 0.7);
  oval(c, x + 4, y + 114, 40, 11, 82801, 0.5);
  paint(c, "rgba(17,13,28,0.5)", null);
  oval(c, x, y + 108, 35, 10, 82802, 0.5);
  paint(c, "#4c5a72", C.ink, 3);
  oval(c, x, y + 105, 28, 6, 82803, 0.4);
  paint(c, "#7a8aa6", null);
  inkLine(c, [[x, y + 15], [x, y + 100]], 82804, 7, "#55627c", 0.3);
  inkLine(c, [[x + 2, y + 20], [x + 2, y + 99]], 82805, 1.8, "#a9b6cc", 0.2);
  const shade: Pt[] = [[x - 50, y + 18], [x + 50, y + 18], [x + 30, y - 46], [x - 30, y - 46]];
  poly(c, shade, 82807, 0.8);
  paint(c, on ? "#d8c49a" : "#6c7186", C.ink, 4);
  c.save();
  poly(c, shade, 82807, 0.8);
  c.clip();
  c.fillStyle = vgrad(c, y - 46, y + 20, [[0, on ? "#c4a57a" : "#5a5e72"], [1, on ? "#fbdca0" : "#8a8ea0"]]);
  c.fillRect(x - 52, y - 52, 104, 76);
  for (let i = -2; i <= 2; i++) inkLine(c, [[x + i * 10, y - 41], [x + i * 16, y + 13]], 82810 + i, 1.4, on ? "rgba(156,118,73,0.38)" : "rgba(31,29,48,0.25)", 0.2);
  c.restore();
  inkLine(c, [[x - 47, y + 17], [x + 47, y + 17]], 82820, 3, on ? "#ffe5ae" : "#8a8ea0", 0.3);
  if (on > 0) glow(c, x, y + 17, 60, "rgba(255,220,150,0.65)", on);
}

/** the string of warm bulbs along the top of the wall (drawn last so the room's shade can't put them out) */
export const BULBS: Pt[] = Array.from({ length: 13 }, (_, i) => {
  const u = (i + 0.5) / 13;
  return [-20 + u * 640, 196 + Math.sin(u * Math.PI * 2.2) * 26 + u * 30 + 16] as Pt;
});
function stringLights(c: Ctx, abs: number, k: number) {
  const wire: Pt[] = [];
  for (let i = 0; i <= 30; i++) {
    const u = i / 30;
    wire.push([-20 + u * 640, 196 + Math.sin(u * Math.PI * 2.2) * 26 + u * 30]);
  }
  inkLine(c, wire, 82900, 2.3, "#181729", 0.4);
  BULBS.forEach(([x, y], i) => {
    const tw = k * (0.9 + 0.1 * Math.sin(abs * 1.2 + i));
    inkLine(c, [[x, y - 16], [x, y - 6]], 82910 + i, 2, "#343344", 0.2);
    glow(c, x, y, 64, "rgba(255,204,142,0.34)", tw);
    oval(c, x, y, 6.5, 10, 82930 + i, 0.3);
    paint(c, k > 0.05 ? "#d8ba87" : "#6a6470", C.ink, 1.7);
    oval(c, x - 1, y - 2, 2.6, 5, 82950 + i, 0.1);
    paint(c, k > 0.05 ? "#ffe5b0" : "#8a8490", null);
  });
}

/** where he sits up in bed (head centre, scale) in the full room */
export const HIS_SIT = { x: 500, y: 640, s: 0.95 };

/** His blue duvet over his lap (the room's bed), wide enough to cover the mattress; `dark` 0..1 = lamp off. */
export function hisDuvet(c: Ctx, dark: number, dawn = 0, wide = false) {
  // `wide`: in close-ups the duvet runs out of frame on the left too (he is in the middle of the bed)
  const pts: Pt[] = wide
    ? [[-200, 1060], [120, 1036], [330, 1050], [560, 1026], [760, 1040], [940, 1024], [1160, 1044], [1160, 1260], [-200, 1260]]
    : [[400, 968], [560, 942], [760, 960], [940, 944], [1160, 966], [1160, 1176], [392, 1174], [380, 1060]];
  blob(c, pts, 82990, 2);
  paint(c, vgrad(c, 950, 1176, [[0, mix("#5b74a6", "#7f97c4", dawn)], [1, mix("#3b4f7c", "#5f74a0", dawn)]]), C.ink, 6);
  c.save();
  blob(c, pts, 82990, 2);
  c.clip();
  // little stars on the cover
  for (let i = 0; i < 12; i++) {
    const sx = (wide ? -150 : 420) + hash(i * 3.1 + 7) * (wide ? 1300 : 720),
      sy = (wide ? 1070 : 990) + hash(i * 4.7 + 3) * 170;
    c.fillStyle = "rgba(230,236,255,0.55)";
    c.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2,
        r = k % 2 ? 4 : 10;
      c.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
    }
    c.fill();
  }
  inkLine(c, [[460, 1010], [560, 1080], [540, 1170]], 82991, 4, "rgba(30,40,80,0.45)");
  inkLine(c, [[760, 990], [860, 1060], [960, 1050]], 82992, 4, "rgba(30,40,80,0.45)");
  inkLine(c, wide ? [[-200, 1072], [120, 1048], [330, 1062], [560, 1038], [760, 1052], [940, 1036], [1160, 1056]] : [[400, 980], [560, 954], [760, 972], [940, 956], [1160, 978]], 82993, 8, "rgba(200,215,255,0.35)");
  if (dark > 0) {
    c.fillStyle = `rgba(6,10,30,${(0.5 * dark).toFixed(3)})`;
    c.fillRect(wide ? -220 : 360, 900, wide ? 1400 : 820, 320);
  }
  c.restore();
}

/** him, sitting up in bed, lit by the room: the lamp (warm, screen left), the phone under his chin (cold), the moon
 *  behind on the right (a cold rim). `phone` 0..1 how bright the screen is on his face; `lamp` 0..1. */
export function hisInBed(c: Ctx, pose: KidPose, o: { lamp: number; phone: number; x?: number; y?: number; s?: number; dawn?: number; phoneAt?: Pt }) {
  const x = o.x ?? HIS_SIT.x,
    y = o.y ?? HIS_SIT.y,
    s = o.s ?? HIS_SIT.s;
  const dawn = o.dawn ?? 0;
  const [px, py] = o.phoneAt ?? [x, y + 330 * s];
  litFigure(c, (k) => drawKid(k, x, y, s, { body: "bust", ...pose }), {
    shade: (0.34 + 0.24 * (1 - o.lamp)) * (1 - dawn),
    shadeCol: "rgb(16,18,44)",
    lights: [
      // the screen, right under his chin: cold, small
      ...(o.phone > 0 ? [{ x: px, y: py - 70 * s, r: 330 * s, rgb: "170,195,255", a: Math.min(0.85, 0.5 * o.phone) }] : []),
      // the lamp, off to his right (screen left): a warm side light that falls off across his face
      ...(o.lamp > 0 ? [{ x: x - 330 * s, y: y + 40 * s, r: 520 * s, rgb: "255,186,112", a: 0.5 * o.lamp * (1 - dawn) }] : []),
      ...(dawn > 0 ? [{ x: x + 300 * s, y: y - 200 * s, r: 900 * s, rgb: "255,214,160", a: 0.35 * dawn }] : []),
    ],
    rim: { ux: 1, uy: -0.35, rgb: dawn > 0.5 ? "255,226,180" : "160,185,255", a: 0.45 + 0.2 * (1 - o.lamp), width: 8 },
  });
}

/** the back of his phone in his hands (he's reading it): dark case, the screen's light spilling round the top edge */
export function hisPhoneBack(c: Ctx, x: number, y: number, w: number, h: number, rot = 0) {
  phoneBack(c, x, y, w, h, rot, 0, { detailed: true, caseColor: "#2a3346", cameraColor: "#1d2433" });
}

// ---------------------------------------------------------------- him under the duvet (seen through his window)
/** His bed at night with him curled up under the duvet, a tuft of hair on the pillow; the room as hisRoom. */
export function hisRoomCurled(c: Ctx, abs: number, lamp: number, room: HisRoomOptions = {}) {
  hisRoom(c, abs, { lamp, lights: lamp ? 0.7 : 0.2, ...room });
  poly(c, [[690, 862], [700, 812], [722, 838], [742, 800], [762, 836], [786, 806], [798, 846], [812, 866]], 82995, 1);
  paint(c, C.hair, C.ink, 4);
  const mound: Pt[] = [[560, 1010], [640, 900], [790, 860], [950, 820], [1080, 850], [1160, 920], [1160, 1180], [520, 1186]];
  blob(c, mound, 82996, 2);
  paint(c, vgrad(c, 820, 1186, [[0, "#5b74a6"], [1, "#3b4f7c"]]), C.ink, 6);
  inkLine(c, [[680, 960], [820, 910], [960, 940]], 82997, 4, "rgba(30,40,80,0.45)");
  inkLine(c, [[640, 1080], [880, 1040], [1120, 1090]], 82998, 4, "rgba(30,40,80,0.45)");
  if (!lamp) {
    c.fillStyle = "rgba(6,10,30,0.4)";
    c.fillRect(480, 780, 700, 420);
  }
}

// ---------------------------------------------------------------- behind a phone close-up
const WARM = "255,206,140",
  COLD = "150,180,255";
/** His room out of focus behind the phone: the lamp's warm pool low left, the moonlit window up right, a few
 *  bulbs. Only about six discs, on the diagonals round the phone, near ones big and faint (they move more with the
 *  camera: `shift`). `dark` 0..1 closes it in (lamp off), `warm` 0..1 lifts it with warm light. */
const HIS_LIGHTS: [number, number, number, number, string][] = [
  [40, 230, 128, 1, WARM],
  [1050, 1330, 130, 1, COLD],
  [990, 260, 58, 0.55, COLD],
  [120, 1700, 96, 0.75, WARM],
  [110, 1110, 30, 0.2, WARM],
  [930, 1820, 28, 0.2, WARM],
];
export function hisBokeh(c: Ctx, abs: number, o: { dark?: number; shift?: [number, number]; warm?: number; zoom?: number; day?: number } = {}) {
  const dark = o.dark ?? 0,
    warm = o.warm ?? 0,
    day = o.day ?? 0;
  const [sx, sy] = o.shift ?? [0, 0];
  fillBg(c, vgrad(c, 0, H, [[0, mix("#1a1f38", "#c9b6a8", day)], [1, mix("#0b0d1a", "#6e6070", day)]]));
  if (day > 0) {
    // the morning: the sun in the window behind, a warm haze
    glow(c, 900, 300, 1100, `rgba(255,222,170,${(0.55 * day).toFixed(3)})`);
    glow(c, 160, 1500, 800, `rgba(255,200,150,${(0.2 * day).toFixed(3)})`);
  }
  c.save();
  if (o.zoom) camera(c, 540, 900, o.zoom);
  c.translate(sx * 0.3, sy * 0.3);
  glow(c, 120, 1350, 760, "rgba(255,178,104,0.26)", 1 - dark * 0.85);
  glow(c, 920, 420, 560, "rgba(120,150,230,0.28)", 1 - dark * 0.4);
  c.restore();
  c.save();
  if (o.zoom) camera(c, 540, 900, Math.pow(o.zoom, 0.6));
  c.globalCompositeOperation = "screen";
  HIS_LIGHTS.forEach(([x, y, r, depth, rgb], i) => {
    const tw = 0.8 + 0.2 * Math.sin(abs * (1.6 + 0.9 * hash(i * 5.3)) + i * 1.9);
    const par = 0.2 + 0.8 * depth;
    const a = (0.5 - 0.27 * depth) * tw * (rgb === WARM ? 1 - dark * 0.85 : 1 - dark * 0.3) * (1 + 0.8 * warm);
    bokehDisc(c, x + sx * par, y + sy * par, r, rgb, a);
  });
  c.restore();
  if (warm > 0) glow(c, 540, 900, 1000, "rgba(255,196,150,0.14)", warm);
  // darker middle so the screen stands off it
  const v = c.createRadialGradient(540, 900, 200, 540, 900, 1150);
  v.addColorStop(0, "rgba(6,8,18,0.3)");
  v.addColorStop(0.5, "rgba(6,8,18,0.08)");
  v.addColorStop(1, `rgba(4,6,14,${((0.35 + 0.3 * dark) * (1 - 0.6 * day)).toFixed(3)})`);
  c.fillStyle = v;
  c.fillRect(-60, -60, W + 120, H + 120);
}

// ---------------------------------------------------------------- resources (preview and catalog)
const FRAME = { width: 1080, height: 1920, duration: 3, prepare: loadFonts };
const unit = z.number().min(0).max(1);
export const resources = defineResources({
  hisRoom: resource({
    kind: "set",
    title: "他的卧室（精细，夜 / 早上）",
    description: "男生卧室精细版：床在右、床头柜和台灯在左、窗在床上方（月亮和城市灯光，dawn 时太阳升起）、s0rrow 海报、串灯夹拍立得、闹钟（clock 传时间）、漫画书、耳机、地毯。lamp 关掉后整间变成冷蓝月光、窗格光落在床和地毯上。坐在床上的他用 hisInBed 按同样的光打光，再画 hisDuvet 盖住腿；hisRoomCurled 是他蒙在被子里。",
    tags: ["卧室", "男生", "房间", "台灯", "月光", "夜晚", "早上", "串灯"],
    usage: "hisRoom(ctx, abs, { lamp: 1, lights: 0.7, dawn: 0, clock: \"23:12\" }); hisInBed(ctx, pose, { lamp: 1, phone: 1 }); hisDuvet(ctx, 0)",
    params: z.object({ lamp: unit.default(1).describe("台灯"), lights: unit.default(0.7).describe("串灯"), dawn: unit.default(0).describe("早上"), sitting: z.boolean().default(true).describe("预览里让他坐在床上看手机"), curled: z.boolean().default(false).describe("预览里他蒙在被子里") }),
    presets: { 开灯: { lamp: 1 }, 关灯: { lamp: 0, lights: 0.25 }, 早上: { lamp: 0, dawn: 1 }, 蒙在被子里: { lamp: 1, sitting: false, curled: true } },
    preview: {
      ...FRAME,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        if (p.curled) {
          hisRoomCurled(ctx, t, p.lamp);
          return;
        }
        hisRoom(ctx, t, p);
        if (!p.sitting) return;
        hisInBed(ctx, { arms: "custom", handL: [-50, 300], handR: [50, 300], shapeL: "hold", shapeR: "hold", thumbFlip: true, eyes: "open", look: [0, 0.6], grip: (c) => hisPhoneBack(c, 0, 236, 92, 176, 0) }, { lamp: p.lamp, phone: p.dawn > 0.5 ? 0 : 1, dawn: p.dawn });
        hisDuvet(ctx, 1 - p.lamp, p.dawn);
      },
    },
  }),
  hisBokeh: resource({
    kind: "effect",
    title: "手机近景后面的他的房间（虚化光斑）",
    description: "手机特写的背景：他房间失焦后的样子——左下台灯的暖光、右上月光窗的冷光，六个对角摆的光斑（近大远小、近的跟镜头移得多）。dark 关灯后收暗，warm 暖起来，day 早上的暖色日光，shift 跟着镜头视差移动，zoom 跟着推镜。",
    tags: ["光斑", "虚化", "手机背景", "房间", "夜晚", "早上"],
    usage: "hisBokeh(ctx, abs, { dark, warm, day, shift: [dx, dy], zoom }); // 然后画手机",
    params: z.object({ dark: unit.default(0).describe("关灯"), warm: unit.default(0).describe("暖起来"), day: unit.default(0).describe("早上") }),
    presets: { 关灯: { dark: 0.85 }, 早上: { day: 0.85, warm: 0.5 } },
    preview: { ...FRAME, draw(ctx, t, p) { beginFrame(ctx, t); hisBokeh(ctx, t, p); } },
  }),
});
