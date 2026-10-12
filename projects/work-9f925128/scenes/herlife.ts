// 她这三年的照片（分镜 7 她主页里的缩略图）和最新一条：夕阳下摩天轮前，她和男朋友接吻的剪影（她头上的向日葵发卡认得出是她）。
// 照片坐标 600×800（3:4），和 photo.ts 一样画进手机里。
import { C, Ctx, F, blob, figureMask, glow, hash, inkLine, oval, paint, poly, rimLight, text, vgrad } from "@materials/s0rrow/code/draw";
import { gradPhoto } from "./photo";

/** her posts, newest first; the graduation photo (2023-06-09) is this far down */
export const POSTS = 86;
export const GRAD_INDEX = 80;

const hsl = (h: number, s: number, l: number) => `hsl(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%)`;

/** two profiles kissing, as dark shapes: hers on the left (a bob, the sunflower clip), his on the right (short hair,
 *  glasses); photo units */
function her(c: Ctx) {
  blob(c, [
    [218, 330], [176, 340], [146, 372], [132, 420], [136, 470], [150, 504], [184, 514], [212, 506], [226, 520], [196, 560],
    [120, 640], [80, 820], [320, 820], [300, 640], [262, 560], [250, 506], [266, 492], [292, 476], [304, 464], [296, 452],
    [286, 446], [297, 434], [284, 410], [276, 388], [262, 372], [246, 346],
  ], 7101, 1);
}
function him(c: Ctx) {
  blob(c, [
    [392, 312], [438, 322], [474, 352], [488, 410], [480, 466], [462, 500], [452, 528], [490, 580], [580, 660], [600, 820],
    [330, 820], [352, 640], [392, 560], [402, 520], [372, 500], [338, 488], [306, 476], [298, 464], [304, 452], [314, 444],
    [301, 424], [318, 404], [322, 388], [332, 364], [350, 336],
  ], 7102, 1);
}

/** The newest post: the two of them kissing in silhouette in front of the Ferris wheel at sunset. */
export function kissPhoto(c: Ctx, w: number, h: number) {
  c.save();
  c.scale(w / 600, h / 800);
  c.beginPath();
  c.rect(0, 0, 600, 800);
  c.clip();
  c.fillStyle = vgrad(c, 0, 620, [[0, "#35346f"], [0.45, "#a45a86"], [0.8, "#f19a5c"], [1, "#ffd08a"]]);
  c.fillRect(0, 0, 600, 800);
  // the sun right between them
  c.save();
  c.globalCompositeOperation = "lighter";
  glow(c, 300, 470, 330, "rgba(255,170,90,0.6)");
  glow(c, 300, 470, 120, "rgba(255,236,190,0.9)");
  c.restore();
  // the Ferris wheel behind, its lights coming on
  c.save();
  c.strokeStyle = "#4a3352";
  c.lineWidth = 7;
  c.beginPath();
  c.arc(430, 380, 250, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = 3;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    c.beginPath();
    c.moveTo(430, 380);
    c.lineTo(430 + Math.cos(a) * 250, 380 + Math.sin(a) * 250);
    c.stroke();
    oval(c, 430 + Math.cos(a) * 250, 380 + Math.sin(a) * 250 + 14, 16, 18, 7110 + i, 0.6);
    paint(c, "#4a3352", null);
    c.fillStyle = "rgba(255,214,140,0.9)";
    c.beginPath();
    c.arc(430 + Math.cos(a + 0.2) * 250, 380 + Math.sin(a + 0.2) * 250, 3.2, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  // the town along the bottom
  poly(c, [[0, 700], [60, 660], [120, 690], [180, 640], [240, 680], [320, 650], [400, 690], [480, 640], [600, 680], [600, 800], [0, 800]], 7120, 1);
  paint(c, "#2c2140", null);
  for (let i = 0; i < 26; i++) {
    c.fillStyle = "rgba(255,206,140,0.8)";
    c.fillRect(hash(i * 3.1) * 600, 690 + hash(i * 1.7) * 90, 4, 4);
  }
  // the two of them
  const both = (q: Ctx) => {
    her(q);
    paint(q, "#231a30", C.ink, 5);
    him(q);
    paint(q, "#20182c", C.ink, 5);
    // where their faces meet there is no light between them
    blob(q, [[290, 436], [306, 430], [310, 470], [292, 474]], 7103, 0.6);
    paint(q, "#211a2e", null);
  };
  both(c);
  const m = figureMask(c, both, "kissPair");
  rimLight(c, m, 0, -0.4, 6, "rgb(255,196,130)", 0.95, "lighter", 5);
  // his glasses and her sunflower clip catch the light
  c.save();
  c.strokeStyle = "rgba(255,206,150,0.9)";
  c.lineWidth = 3.5;
  c.beginPath();
  c.roundRect(334, 398, 30, 22, 7);
  c.moveTo(364, 406);
  c.lineTo(430, 400);
  c.stroke();
  c.restore();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    oval(c, 186 + Math.cos(a) * 14, 360 + Math.sin(a) * 14, 9, 5, 7130 + k, 0.3, a);
    paint(c, "#ffcc33", C.ink, 2);
  }
  oval(c, 186, 360, 8, 8, 7140, 0.3);
  paint(c, "#7a4a1e", C.ink, 2);
  // a little heart sticker she put on it
  c.save();
  c.translate(510, 120);
  c.rotate(0.2);
  blob(c, [[0, 26], [-22, 6], [-32, -10], [-24, -26], [-10, -28], [0, -16], [10, -28], [24, -26], [32, -10], [22, 6]], 7150, 0.6);
  paint(c, "#ff6f91", "#ffffff", 5);
  c.restore();
  c.restore();
}

/** A thumbnail of her post i (w × h at the origin): little pictures of three years — milk tea, the sea, a cat, cake,
 *  snow, the campus gate, cherry blossom, the city at night, friends… the newest are the two of them. */
export function tileArt(c: Ctx, i: number, w: number, h: number) {
  if (i === 0) return kissPhoto(c, w, h);
  if (i === GRAD_INDEX) return gradPhoto(c, w, h);
  c.save();
  c.scale(w / 198, h / 264);
  const theme = i < 4 ? [100, 101, 102][i - 1] : Math.floor(hash(i * 7.31) * 12);
  const hue = hash(i * 2.17) * 360;
  const bg = (a: string, b: string) => {
    c.fillStyle = vgrad(c, 0, 264, [[0, a], [1, b]]);
    c.fillRect(0, 0, 198, 264);
  };
  switch (theme) {
    case 100: // two milk teas, side by side
      bg("#f6dcc8", "#d8a98a");
      for (const [x, col] of [[70, "#c98d6a"], [128, "#f2a7b8"]] as [number, string][]) {
        poly(c, [[x - 26, 110], [x + 26, 110], [x + 20, 210], [x - 20, 210]], 7200 + x, 0.6);
        paint(c, col, C.ink, 3);
        inkLine(c, [[x + 6, 112], [x + 18, 70]], 7210 + x, 5, "#3a2a2a");
      }
      break;
    case 101: // two cinema tickets
      bg("#2b2b44", "#4a3a5e");
      for (const [x, y, r] of [[60, 110, -0.2], [118, 150, 0.15]] as [number, number, number][]) {
        c.save();
        c.translate(x, y);
        c.rotate(r);
        poly(c, [[-40, -24], [40, -24], [40, 24], [-40, 24]], 7220 + x, 0.6);
        paint(c, "#f3c96a", C.ink, 3);
        inkLine(c, [[14, -24], [14, 24]], 7225 + x, 2, "#8a6a2a");
        c.restore();
      }
      break;
    case 102: // a bunch of flowers
      bg("#fbe8ee", "#f2c9d4");
      for (let k = 0; k < 6; k++) {
        oval(c, 70 + (k % 3) * 28, 100 + Math.floor(k / 3) * 28, 18, 18, 7230 + k, 0.8);
        paint(c, ["#ff7a9a", "#ffd166", "#ff9e7a"][k % 3], C.ink, 2.5);
      }
      poly(c, [[70, 150], [130, 150], [110, 230], [90, 230]], 7240, 0.6);
      paint(c, "#7fb069", C.ink, 3);
      break;
    case 0: // the sea at sunset
      bg(hsl(hue, 50, 62), hsl(hue + 30, 60, 75));
      oval(c, 99, 140, 34, 34, 7300 + i, 0.6);
      paint(c, "#fff1c4", null);
      c.fillStyle = hsl(210, 45, 40);
      c.fillRect(0, 150, 198, 114);
      for (let k = 0; k < 4; k++) inkLine(c, [[20, 170 + k * 22], [80, 166 + k * 22], [170, 172 + k * 22]], 7310 + k, 2, "rgba(255,255,255,0.5)");
      break;
    case 1: // a cat
      bg(hsl(hue, 30, 85), hsl(hue, 30, 70));
      for (const sd of [-1, 1]) {
        poly(c, [[99 + sd * 50, 110], [99 + sd * 46, 60], [99 + sd * 20, 92]], 7320 + sd, 0.6);
        paint(c, "#f0a04b", C.ink, 3);
      }
      oval(c, 99, 140, 60, 52, 7330, 1);
      paint(c, "#f0a04b", C.ink, 3);
      inkLine(c, [[76, 136], [84, 132]], 7331, 3);
      inkLine(c, [[114, 132], [122, 136]], 7332, 3);
      break;
    case 2: // birthday cake
      bg("#2a2440", "#4a3060");
      poly(c, [[50, 150], [148, 150], [148, 210], [50, 210]], 7340 + i, 0.6);
      paint(c, "#f6e1e8", C.ink, 3);
      for (let k = 0; k < 3; k++) {
        inkLine(c, [[76 + k * 24, 150], [76 + k * 24, 124]], 7345 + k, 4, "#9ad0ff");
        oval(c, 76 + k * 24, 116, 5, 8, 7350 + k, 0.3);
        paint(c, "#ffd166", null);
      }
      break;
    case 3: // snow
      bg("#9fb8d9", "#e8f0f8");
      for (let k = 0; k < 30; k++) {
        c.fillStyle = "#fff";
        c.beginPath();
        c.arc(hash(i + k * 3.3) * 198, hash(i * 2 + k) * 264, 3, 0, Math.PI * 2);
        c.fill();
      }
      oval(c, 99, 200, 36, 34, 7360, 0.8);
      paint(c, "#ffffff", C.ink, 3);
      oval(c, 99, 150, 24, 22, 7361, 0.6);
      paint(c, "#ffffff", C.ink, 3);
      break;
    case 4: // the university gate
      bg(hsl(200, 60, 75), hsl(200, 40, 90));
      poly(c, [[30, 230], [30, 120], [99, 80], [168, 120], [168, 230], [130, 230], [130, 150], [68, 150], [68, 230]], 7370, 0.8);
      paint(c, "#e8dcc6", C.ink, 3);
      break;
    case 5: // cherry blossom
      bg("#f8e1ea", "#cfe3f2");
      inkLine(c, [[0, 180], [80, 140], [198, 100]], 7380, 6, "#6a4a3a");
      for (let k = 0; k < 16; k++) {
        oval(c, hash(k * 1.3 + i) * 198, 60 + hash(k * 2.1 + i) * 120, 8, 8, 7390 + k, 0.4);
        paint(c, "#ffb7c9", null);
      }
      break;
    case 6: // the city at night
      bg("#141b33", "#2a2f55");
      for (let k = 0; k < 5; k++) {
        poly(c, [[k * 40, 264], [k * 40, 140 + hash(k + i) * 60], [k * 40 + 34, 140 + hash(k + i) * 60], [k * 40 + 34, 264]], 7400 + k, 0.6);
        paint(c, "#20264a", null);
      }
      for (let k = 0; k < 24; k++) {
        c.fillStyle = "rgba(255,210,140,0.9)";
        c.fillRect(hash(k * 3.7 + i) * 198, 160 + hash(k * 1.9 + i) * 100, 4, 5);
      }
      break;
    case 7: // a bowl of noodles
      bg("#f3e3c8", "#d9b98c");
      oval(c, 99, 160, 70, 40, 7410 + i, 1);
      paint(c, "#f6efe2", C.ink, 3);
      oval(c, 99, 150, 60, 26, 7411 + i, 0.8);
      paint(c, "#e0703a", null);
      break;
    case 8: // friends, three faces
      bg(hsl(hue, 55, 75), hsl(hue + 40, 55, 82));
      for (let k = 0; k < 3; k++) {
        oval(c, 50 + k * 50, 150 + (k % 2) * 10, 26, 28, 7420 + k, 0.8);
        paint(c, "#f6e1c3", C.ink, 3);
        inkLine(c, [[42 + k * 50, 156 + (k % 2) * 10], [50 + k * 50, 162 + (k % 2) * 10], [58 + k * 50, 156 + (k % 2) * 10]], 7425 + k, 2.4);
      }
      break;
    case 9: // mountains
      bg(hsl(hue, 40, 80), hsl(hue, 30, 92));
      poly(c, [[0, 230], [60, 120], [110, 190], [150, 110], [198, 200], [198, 264], [0, 264]], 7430 + i, 0.8);
      paint(c, hsl(hue + 180, 25, 45), C.ink, 3);
      break;
    case 10: // books and coffee
      bg("#e9dcc6", "#c9b48f");
      for (let k = 0; k < 3; k++) {
        poly(c, [[40, 200 - k * 22], [140, 200 - k * 22], [140, 220 - k * 22], [40, 220 - k * 22]], 7440 + k, 0.5);
        paint(c, ["#5b7fb0", "#c05a4a", "#e8c35a"][k], C.ink, 2.5);
      }
      oval(c, 160, 120, 18, 22, 7445, 0.5);
      paint(c, "#8a5a3a", C.ink, 2.5);
      break;
    default: // concert lights
      bg("#1a1030", "#3a1f5a");
      for (let k = 0; k < 14; k++) {
        c.fillStyle = `hsla(${(hue + k * 25) % 360},80%,65%,0.8)`;
        c.beginPath();
        c.arc(hash(k * 2.3 + i) * 198, 120 + hash(k * 1.1 + i) * 140, 6 + hash(k) * 6, 0, Math.PI * 2);
        c.fill();
      }
  }
  // the older ones: school things before graduation
  if (i > GRAD_INDEX) {
    text(c, i % 2 ? "高考加油" : "倒计时 " + (i - GRAD_INDEX) * 7 + " 天", 99, 60, { size: 24, font: F.cn, fill: "#ffffff", stroke: C.ink, lw: 5 });
  }
  c.restore();
}

/** likes on post i: the two of them get more */
export const tileLikes = (i: number) => (i === 0 ? 128 : i === GRAD_INDEX ? 0 : 6 + Math.floor(hash(i * 5.7) * 60));
