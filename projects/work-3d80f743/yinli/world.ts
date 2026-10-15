// 沉州：天上的白、灰雾、落灰、地面、城、网、称重站、电车、天井、屋子。
import { type C, type Cam, W, H, sY, sX, clamp, mix, seeded, applyCam } from "./core";
import { figure } from "./figure";
import { PAL, blend, darker } from "./palette";

/** 白的下沿（世界坐标，地面是 0，往上为负） */
export const WHITE = -9000;
export const FLOOR = 300; // 楼层高

function hex(c: string): number[] {
  const v = parseInt(c.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
export function mixColor(a: string, b: string, t: number) {
  const x = hex(a);
  const y = hex(b);
  const k = clamp(t);
  return `rgb(${Math.round(mix(x[0], y[0], k))},${Math.round(mix(x[1], y[1], k))},${Math.round(mix(x[2], y[2], k))})`;
}

/** 天：从白往下到地面的渐变（画面坐标，先画）。night 0..1 */
export function sky(c: C, k: Cam, o: { night?: number } = {}) {
  const n = o.night ?? 0;
  const yw = sY(k, WHITE);
  const yg = sY(k, 0);
  const g = c.createLinearGradient(0, yw, 0, Math.max(yg, yw + 1));
  const stops = [0, 0.03, 0.12, 0.35, 0.7, 1];
  stops.forEach((p, i) => g.addColorStop(p, blend(PAL.skyDay[i], PAL.skyNight[i], n)));
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  if (yw > 0) {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, W, Math.min(H, yw));
  }
}

/** 白里藏着的颜色：从下面看是白的，越近越五颜六色 */
const PRISM = ["255,150,185", "255,192,128", "255,234,140", "150,228,190", "148,198,255", "200,168,255"];
const mixRGB = (a: string, b: string, k: number) => {
  const x = a.split(",").map(Number);
  const y = b.split(",").map(Number);
  return x.map((v, i) => Math.round(mix(v, y[i], k))).join(",");
};
/** 白本身：发光的天，下沿有柔和的光束。prism 0..1：光束和下沿带上彩虹色（五颜六色的强光） */
export function whiteBand(c: C, k: Cam, t: number, glow = 1, prism = 0.3) {
  const yw = sY(k, WHITE);
  if (yw < -H * 3) return;
  c.save();
  const depth = 260 + 1100 * Math.min(1, k.z);
  const g = c.createLinearGradient(0, yw, 0, yw + depth);
  g.addColorStop(0, `rgba(255,252,244,${0.95 * glow})`);
  g.addColorStop(0.35, `rgba(255,236,214,${0.45 * glow})`);
  g.addColorStop(1, "rgba(255,230,210,0)");
  c.fillStyle = g;
  c.fillRect(0, yw, W, depth);
  // 光束
  const n = 6 + Math.round(prism * 4);
  for (let i = 0; i < n; i++) {
    const x = ((i * 233 + t * (9 + i * 3)) % (W + 400)) - 200;
    const w = 90 + (i % 6) * 24;
    const colored = prism > 0.01 && i % 2 === 1;
    c.globalCompositeOperation = colored ? "source-over" : "lighter";
    const a = colored ? (0.06 + 0.03 * Math.sin(t * 0.9 + i)) * glow * prism * 1.6 : (0.05 + 0.03 * Math.sin(t * 0.7 + i)) * glow;
    const col = colored ? mixRGB("255,240,215", PRISM[i % 6], 0.85) : "255,240,215";
    const gr = c.createLinearGradient(0, yw, 0, yw + depth * 1.3);
    gr.addColorStop(0, `rgba(${col},${a})`);
    gr.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = gr;
    c.beginPath();
    c.moveTo(x, yw);
    c.lineTo(x + w, yw);
    c.lineTo(x + w * 1.8 + 120, yw + depth * 1.3);
    c.lineTo(x + 120, yw + depth * 1.3);
    c.closePath();
    c.fill();
  }
  // 白的下沿一道彩虹边
  if (prism > 0.01) {
    c.globalCompositeOperation = "source-over";
    const bh = Math.max(6, 9 * Math.min(2, k.z));
    PRISM.forEach((col, i) => {
      c.fillStyle = `rgba(${col},${0.3 * prism * glow})`;
      c.fillRect(0, yw + i * bh, W, bh + 1);
    });
  }
  c.restore();
}

/** 白里的人影：站在光里张开手（几乎是白的，带一点金色） */
export function ghost(c: C, x: number, y: number, s: number, a: number, arms = 1, t = 0) {
  if (a <= 0.01) return;
  figure(
    c,
    {
      x,
      y,
      s,
      kind: "woman",
      grounded: false,
      aL: -mix(0.3, 2.2, arms),
      aR: mix(0.3, 2.2, arms),
      bendL: 0.1,
      bendR: -0.1,
      float: 0.35,
      rim: 0,
      ink: 0.12,
      alpha: a * 0.6,
      eyes: "closed",
      look: { skin: "#fff6ea", hair: "#f1e3ff", top: "#fff3dc", bottom: "#fbe9ff", shoe: "#fff3dc", legs: "#fbe9ff" },
    },
    t,
  );
}

// ---------- 落灰：飘在城里的灰（不是贴在屏幕上的）----------
// 灰在世界坐标里往下落，分远、中、近三层：镜头横移、上下移、推拉时，灰跟着场景一起动，近的动得快、远的动得慢。
// 世界被切成一列列（宽 ASH_TW）、竖着每 ASH_TH 重复一次的块：竖向是周期的，灰从一块落进下一块是连续的；每一列用不同的排布，横向不重复。
const ASH_TW = 360;
const ASH_TH = 1440;
const ASH_N = 72;
const ASH_LAYERS = [
  { d: 0.82, s: 0.75, a: 0.5, seed: 7 },
  { d: 1.0, s: 1.0, a: 0.7, seed: 8 },
  { d: 1.2, s: 1.35, a: 0.85, seed: 9 },
].map((L) => {
  const r = seeded(L.seed);
  return { ...L, flakes: Array.from({ length: ASH_N }, () => ({ x: r(), y: r(), r: 1.2 + r() * 2.6, w: r() * 6.28, v: 0.6 + r() * 0.8, keep: r() })) };
});
const fract = (v: number) => v - Math.floor(v);
const colHash = (i: number, s: number) => fract(Math.sin(i * 127.1 + s * 311.7) * 43758.5453);
/** n：密度（0.5 是平常）；speed：落的快慢；up：再往上挪多少（画面像素，人物在升、在落时用） */
export function ash(c: C, t: number, k: Cam, o: { n?: number; speed?: number; up?: number } = {}) {
  const yw = sY(k, WHITE);
  const sp = o.speed ?? 1;
  // 远景一块里只画一部分、近景全画，画面上的密度大致不变；近景的灰大一点
  const fill = clamp((k.z * k.z) / 6) * clamp(o.n ?? 0.5) * 2;
  const grow = Math.min(2, Math.max(0.55, Math.sqrt(k.z / 2)));
  c.save();
  for (const L of ASH_LAYERS) {
    const cx = k.x * L.d;
    const cy = k.y * L.d - (o.up ?? 0) / k.z;
    const hw = (W / 2 + 40) / k.z;
    const hh = (H / 2 + 40) / k.z;
    const fall = t * 55 * sp;
    for (let ix = Math.floor((cx - hw) / ASH_TW); ix <= Math.floor((cx + hw) / ASH_TW); ix++) {
      const hx = colHash(ix, L.seed);
      const hy = colHash(ix + 977, L.seed);
      for (let iy = Math.floor((cy - hh) / ASH_TH); iy <= Math.floor((cy + hh) / ASH_TH); iy++) {
        for (const f of L.flakes) {
          if (f.keep >= fill) continue;
          const wx = (ix + fract(f.x + hx)) * ASH_TW + Math.sin(t * 0.6 + f.w) * 16;
          const wy = (iy + fract(f.y + hy + (fall * f.v) / ASH_TH)) * ASH_TH;
          const x = (wx - cx) * k.z + W / 2;
          const y = (wy - cy) * k.z + H / 2;
          if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
          const r = f.r * L.s * grow;
          c.globalAlpha = L.a;
          c.fillStyle = y < yw + 500 ? PAL.ashOnBright : PAL.ash;
          c.beginPath();
          c.ellipse(x, y, r * 1.3, r, f.w + t * 0.5, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
  }
  c.restore();
}

// ---------- 地面 ----------
export function ground(c: C, k: Cam, o: { y?: number; tone?: number } = {}) {
  // tone：夜里 0..1
  const gy = o.y ?? 0;
  const x0 = k.x - (W / 2 + 200) / k.z;
  const x1 = k.x + (W / 2 + 200) / k.z;
  const night = o.tone ?? 0;
  c.fillStyle = blend(PAL.groundDeep, PAL.groundNight, night);
  c.fillRect(x0, gy, x1 - x0, 5000);
  c.fillStyle = blend(PAL.ground, PAL.groundNight, night * 0.8);
  c.fillRect(x0, gy, x1 - x0, 90);
  c.fillStyle = "rgba(255,250,248,0.75)";
  c.fillRect(x0, gy, x1 - x0, 5);
  if (k.z > 0.6) {
    c.strokeStyle = "rgba(120,100,125,0.35)";
    c.lineWidth = 2;
    for (let r = 0; r < 5; r++) {
      const yy = gy + 22 + r * 34 * (1 + r * 0.35);
      const step = 64 * (1 + r * 0.4);
      const off = r % 2 ? step / 2 : 0;
      c.beginPath();
      for (let x = Math.floor(x0 / step) * step + off; x < x1; x += step) {
        c.moveTo(x, yy);
        c.quadraticCurveTo(x + step / 2, yy - 9, x + step - 6, yy);
      }
      c.stroke();
    }
  }
}
/** 石板裂纹，p 0..1 长出来 */
export function crack(c: C, x: number, y: number, size: number, p: number) {
  if (p <= 0) return;
  const rnd = seeded(Math.floor(x * 13 + 5));
  c.save();
  c.strokeStyle = "rgba(90,70,95,0.75)";
  c.lineWidth = 2.4;
  c.lineCap = "round";
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI + rnd() * 0.3;
    let px = x;
    let py = y + 4;
    c.beginPath();
    c.moveTo(px, py);
    for (let s = 0; s < 3; s++) {
      const l = size * (0.3 + rnd() * 0.4) * clamp(p * 3 - s);
      px += Math.cos(a + (rnd() - 0.5) * 0.6) * l;
      py += Math.abs(Math.sin(a)) * l * 0.25 + 1;
      c.lineTo(px, py);
    }
    c.stroke();
  }
  c.restore();
}

// ---------- 城 ----------
interface Bld {
  x: number;
  w: number;
  h: number;
  seed: number;
  col: string;
}
function genLayer(seed: number, x0: number, x1: number, wMin: number, wMax: number, hMin: number, hMax: number, towers = 0.08) {
  const rnd = seeded(seed);
  const out: Bld[] = [];
  let x = x0;
  while (x < x1) {
    const w = mix(wMin, wMax, rnd());
    const tall = rnd() < towers;
    const h = tall ? mix(7600, 8850, rnd()) : mix(hMin, hMax, Math.pow(rnd(), 1.4));
    out.push({ x, w, h, seed: Math.floor(rnd() * 1e6), col: PAL.buildings[Math.floor(rnd() * PAL.buildings.length)] });
    x += w + mix(10, 160, rnd());
  }
  return out;
}
// d：横向视差；haze：融进天色的程度（越远越淡）
const LAYERS = [
  { d: 0.3, haze: 0.62, list: genLayer(11, -16000, 16000, 380, 900, 2400, 7600, 0.14) },
  { d: 0.55, haze: 0.38, list: genLayer(23, -14000, 14000, 420, 1000, 1600, 6200, 0.1) },
  { d: 0.8, haze: 0.12, list: genLayer(37, -12000, 12000, 500, 1100, 900, 3800, 0.04) },
];
export function city(c: C, k: Cam, o: { lights?: number; layers?: number[]; night?: number; skipNear?: number } = {}) {
  const lights = o.lights ?? 0;
  const night = o.night ?? 0;
  const haze = blend(PAL.haze, PAL.hazeNight, night);
  for (const li of o.layers ?? [0, 1, 2]) {
    const L = LAYERS[li];
    c.save();
    const kk: Cam = { ...k, x: k.x * L.d };
    applyCam(c, kk);
    const vx0 = kk.x - (W / 2 + 100) / k.z;
    const vx1 = kk.x + (W / 2 + 100) / k.z;
    for (const b of L.list) {
      if (b.x + b.w < vx0 || b.x > vx1) continue;
      if (o.skipNear !== undefined && li === 2 && Math.abs(b.x + b.w / 2 - o.skipNear) < 900) continue;
      const base = blend(blend(b.col, "#4a4f86", night * 0.65), haze, L.haze);
      const g = c.createLinearGradient(0, -b.h, 0, 0);
      g.addColorStop(0, blend(base, "#fff4ec", 0.25 * (1 - night)));
      g.addColorStop(1, darker(base, 0.12));
      c.fillStyle = g;
      c.fillRect(b.x, -b.h, b.w, b.h + 2);
      // 屋顶的一条浅色边
      c.fillStyle = blend(base, "#ffffff", 0.35);
      c.fillRect(b.x - 6, -b.h - 10, b.w + 12, 12);
    }
    // 窗
    const winPx = 46 * k.z;
    if (winPx > 2.2) {
      for (const b of L.list) {
        if (b.x + b.w < vx0 || b.x > vx1) continue;
        const rnd = seeded(b.seed);
        const cols = Math.max(1, Math.floor((b.w - 60) / 130));
        const rows = Math.floor((b.h - 200) / FLOOR);
        const ys0 = Math.max(0, Math.floor((-(k.y + H / 2 / k.z) - 0) / FLOOR) - 1);
        const ys1 = Math.min(rows, Math.ceil(-(k.y - H / 2 / k.z) / FLOOR) + 1);
        const dark = blend(blend(blend(b.col, PAL.unlit, 0.55), PAL.unlitNight, night), haze, L.haze * 0.8);
        for (let r = 0; r < rows; r++) {
          for (let q = 0; q < cols; q++) {
            const lit = rnd() < lights;
            if (r < ys0 || r > ys1) continue;
            const wx = b.x + 50 + q * ((b.w - 100) / cols) + 20;
            const wy = -(r + 1) * FLOOR + 90;
            c.fillStyle = lit ? PAL.lit : dark;
            c.globalAlpha = lit ? 0.95 : 0.9;
            c.fillRect(wx, wy, 46, 92);
          }
        }
        c.globalAlpha = 1;
      }
    }
    c.restore();
  }
}

/** 全城最高的那栋楼（她住的），x=0 宽 1000，楼顶离白一米。淡青色 */
export const TOWER_TOP = WHITE + 100;
export function tower(c: C, o: { lights?: number; night?: number; qinWindow?: number } = {}) {
  const n = o.night ?? 0;
  const g = c.createLinearGradient(0, TOWER_TOP, 0, 0);
  g.addColorStop(0, blend("#cfe3df", "#6d78b0", n));
  g.addColorStop(1, blend("#7fa9a4", "#3d4580", n));
  c.fillStyle = g;
  c.fillRect(-500, TOWER_TOP, 1000, -TOWER_TOP + 2);
  c.fillStyle = blend("#eaf4f1", "#8f97c8", n);
  c.fillRect(-510, TOWER_TOP - 12, 1020, 14);
  const rnd = seeded(404);
  for (let r = 0; r < 29; r++) {
    for (let q = 0; q < 5; q++) {
      const lit = rnd() < (o.lights ?? 0);
      c.fillStyle = lit ? PAL.lit : blend("#5f8a86", "#2e3566", n);
      c.globalAlpha = lit ? 0.95 : 0.85;
      c.fillRect(-430 + q * 180, -(r + 1) * FLOOR + 80, 60, 110);
    }
  }
  c.globalAlpha = 1;
  // 顶层她的窗：防飘栏后面是白光
  if (o.qinWindow !== undefined) {
    const wy = TOWER_TOP + 70;
    c.fillStyle = blend("#fff3e2", "#ffffff", o.qinWindow);
    c.fillRect(-140, wy, 280, 170);
    c.fillStyle = "#6b5a6e";
    for (let i = 0; i <= 6; i++) c.fillRect(-140 + i * 46, wy, 6, 170);
  }
}

// ---------- 街上的东西 ----------
/** 接人的网（侧面看是一条下垂的网带，有破洞） */
export function net(c: C, x0: number, x1: number, y: number, t: number, hole?: [number, number]) {
  c.save();
  c.strokeStyle = "rgba(140,105,95,0.75)";
  c.lineWidth = 2.2;
  const sag = (x1 - x0) * 0.06;
  const yAt = (x: number) => y + Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * sag;
  for (let l = 0; l < 3; l++) {
    c.beginPath();
    let pen = false;
    for (let x = x0; x <= x1; x += 20) {
      const inHole = hole && x > hole[0] && x < hole[1];
      if (inHole) {
        pen = false;
        continue;
      }
      const yy = yAt(x) + l * 14;
      if (!pen) c.moveTo(x, yy);
      else c.lineTo(x, yy);
      pen = true;
    }
    c.stroke();
  }
  c.beginPath();
  for (let x = x0; x <= x1; x += 28) {
    if (hole && x > hole[0] && x < hole[1]) continue;
    c.moveTo(x, yAt(x));
    c.lineTo(x + 14, yAt(x) + 28);
  }
  c.stroke();
  // 挂着的灰团和断线
  c.fillStyle = "rgba(250,240,242,0.9)";
  const rnd = seeded(Math.floor(x0));
  for (let i = 0; i < (x1 - x0) / 180; i++) {
    const x = mix(x0, x1, rnd());
    if (hole && x > hole[0] - 20 && x < hole[1] + 20) continue;
    const len = 20 + rnd() * 50 + Math.sin(t * 1.3 + i) * 4;
    c.beginPath();
    c.moveTo(x, yAt(x) + 28);
    c.lineTo(x + 2, yAt(x) + 28 + len);
    c.stroke();
    c.beginPath();
    c.arc(x + 2, yAt(x) + 30 + len, 7, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** 称重站：大表盘（needle 0..1，1 是满秤）、秤台和牌子 */
export function scaleStation(c: C, x: number, needle: number, o: { sign?: boolean } = {}) {
  c.save();
  c.fillStyle = "#6f9c88";
  c.fillRect(x - 170, -22, 340, 22);
  c.fillStyle = "#cfe3d8";
  c.fillRect(x - 170, -24, 340, 4);
  c.fillStyle = "#5d8b78";
  c.fillRect(x + 150, -560, 22, 540);
  c.fillRect(x - 172, -560, 22, 540);
  // 表盘
  const cx = x;
  const cy = -470;
  c.fillStyle = "#5d8b78";
  c.beginPath();
  c.arc(cx, cy, 128, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#fff7ea";
  c.beginPath();
  c.arc(cx, cy, 112, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#4a3f55";
  c.lineWidth = 4;
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI * 1.25 + (i / 10) * Math.PI * 1.5;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * 92, cy + Math.sin(a) * 92);
    c.lineTo(cx + Math.cos(a) * 108, cy + Math.sin(a) * 108);
    c.stroke();
  }
  c.fillStyle = "#b8332c";
  c.font = `700 30px "YinliSerif", serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("斤", cx, cy + 52);
  const a = -Math.PI * 1.25 + clamp(needle) * Math.PI * 1.5;
  c.strokeStyle = "#a3241e";
  c.lineWidth = 7;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(cx, cy);
  c.lineTo(cx + Math.cos(a) * 96, cy + Math.sin(a) * 96);
  c.stroke();
  c.fillStyle = "#4a3f55";
  c.beginPath();
  c.arc(cx, cy, 12, 0, Math.PI * 2);
  c.fill();
  // 牌子
  if (o.sign === false) {
    c.restore();
    return;
  }
  c.fillStyle = "#41508a";
  c.fillRect(cx - 150, -700, 300, 84);
  c.fillStyle = "#fff4e2";
  c.font = `700 52px "YinliSerif", serif`;
  c.fillText("称 重 站", cx, -657);
  c.restore();
}

/** 门口一排空鞋 */
const SHOE_COLORS = ["#c95d50", "#5b7fc1", "#e0a53e", "#8a5a42", "#6f9f7a", "#a46fb0"];
export function shoes(c: C, x: number, y: number, n: number, s = 1, color?: string) {
  c.save();
  for (let i = 0; i < n; i++) {
    c.fillStyle = color && !color.startsWith("#3") && !color.startsWith("#2") ? color : SHOE_COLORS[Math.abs(Math.floor(x * 0.37 + i * 3)) % SHOE_COLORS.length];
    const px = x + i * 46 * s;
    for (const o of [0, 17]) {
      c.beginPath();
      c.ellipse(px + o * s, y - 6 * s, 9 * s, 6 * s, 0, 0, Math.PI * 2);
      c.fill();
      c.fillRect(px + o * s - 9 * s, y - 16 * s, 8 * s, 12 * s);
    }
  }
  c.restore();
}

/** 门（d 0..1 打开的程度），lit 门里的暖光 */
export function door(c: C, x: number, y: number, o: { open?: number; lit?: number; w?: number; h?: number } = {}) {
  const w = o.w ?? 110;
  const h = o.h ?? 220;
  c.save();
  c.fillStyle = o.lit ? mixColor("#4a3a4e", "#ffcf7d", o.lit) : "#4a3a4e";
  c.fillRect(x - w / 2, y - h, w, h);
  c.fillStyle = PAL.wood;
  const ow = w * (1 - 0.85 * clamp(o.open ?? 0));
  c.fillRect(x - w / 2, y - h, ow, h);
  c.fillStyle = PAL.woodDark;
  c.fillRect(x - w / 2 - 8, y - h - 8, w + 16, 8);
  c.restore();
}

// ---------- 天井（楼的剖面）：中间是空的，两边是楼梯和走廊 ----------
export const WELL = { void: 250, wall: 560, floors: 28 };
export function lightWell(c: C, k: Cam, t: number, o: { lights?: number } = {}) {
  const top = -WELL.floors * FLOOR - 480;
  const vy0 = k.y - (H / 2 + 300) / k.z;
  const vy1 = k.y + (H / 2 + 300) / k.z;
  // 天窗外的白和往下落的光
  const g = c.createLinearGradient(0, top, 0, 0);
  g.addColorStop(0, "#fffaf2");
  g.addColorStop(0.08, "#ffe6d2");
  g.addColorStop(0.5, "#e6c9cf");
  g.addColorStop(1, "#b8acc9");
  c.fillStyle = g;
  c.fillRect(-WELL.void, Math.max(top - 400, vy0), WELL.void * 2, Math.min(0, vy1) - Math.max(top - 400, vy0));
  c.fillStyle = "#ffffff";
  if (vy0 < top) c.fillRect(-WELL.wall - 400, vy0, (WELL.wall + 400) * 2, top - vy0);
  // 两边的墙
  c.fillStyle = "#e9d3c6";
  c.fillRect(-WELL.wall - 600, Math.max(top, vy0), 600 + WELL.wall - WELL.void, vy1 - Math.max(top, vy0));
  c.fillRect(WELL.void, Math.max(top, vy0), 600 + WELL.wall - WELL.void, vy1 - Math.max(top, vy0));
  const rnd = seeded(77);
  for (let n = 0; n <= WELL.floors; n++) {
    const y = -n * FLOOR;
    const lit = rnd() < (o.lights ?? 0);
    const shoe = rnd() < 0.35;
    if (y < vy0 - 400 || y > vy1 + 400) continue;
    for (const side of [-1, 1]) {
      // 走廊地面 + 栏杆
      c.fillStyle = "#b9978a";
      c.fillRect(side > 0 ? WELL.void : -WELL.wall, y - 14, WELL.wall - WELL.void, 14);
      c.strokeStyle = "#8f7484";
      c.lineWidth = 4;
      c.beginPath();
      const rx = side * WELL.void;
      c.moveTo(rx, y - 14);
      c.lineTo(rx, y - 110);
      c.moveTo(rx - side * 120, y - 110);
      c.lineTo(rx, y - 110);
      c.stroke();
      // 门
      const dx = side * (WELL.wall - 60);
      c.fillStyle = lit && side > 0 ? PAL.lit : PAL.wood;
      c.fillRect(dx - 45, y - 214, 90, 200);
      c.fillStyle = PAL.woodDark;
      c.fillRect(dx - 52, y - 222, 104, 8);
      if (shoe && side < 0) shoes(c, dx + 50, y - 14, 1, 0.9);
    }
    // 楼梯：两边都贴着墙斜着往上（每层一段）
    if (n < WELL.floors)
      for (const side of [-1, 1]) {
      c.strokeStyle = "#cdb0a6";
      c.lineWidth = 16;
      c.beginPath();
      c.moveTo(side * (WELL.void + 30), y - 14);
      c.lineTo(side * (WELL.wall - 20), y - FLOOR - 14);
      c.stroke();
      c.strokeStyle = "#8f7484";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(side * (WELL.void + 30), y - 110);
      c.lineTo(side * (WELL.wall - 20), y - FLOOR - 110);
      c.stroke();
    }
  }
  // 天窗格子
  c.fillStyle = "#8f7484";
  c.fillRect(-WELL.wall, top - 30, WELL.wall * 2, 30);
  c.fillStyle = "#ffffff";
  c.fillRect(-WELL.void + 10, top - 26, WELL.void * 2 - 20, 22);
  c.strokeStyle = "#8f7484";
  c.lineWidth = 8;
  for (let i = -2; i <= 2; i++) {
    c.beginPath();
    c.moveTo(i * 100, top - 30);
    c.lineTo(i * 100, top);
    c.stroke();
  }
}

// ---------- 屋子（剖面）：地板 y=0，墙 x ∈ [-480, 480]，天花板 y=-600 ----------
export interface RoomOpt {
  night?: number;
  lamp?: number; // 0..1 桌上的灯
  glare?: number; // 窗外白光强度
  bars?: boolean;
  slogan?: boolean;
  t?: number;
}
export function room(c: C, o: RoomOpt = {}) {
  const n = o.night ?? 0;
  c.fillStyle = blend("#c9b9cf", "#3e4378", n);
  c.fillRect(-1400, -1400, 2800, 2800);
  c.fillStyle = blend(o.slogan ? "#f1d9d6" : "#d7e3ef", "#4f5891", n);
  c.fillRect(-480, -600, 960, 600);
  // 墙上的一条腰线
  c.fillStyle = blend("#c3a99f", "#434a80", n);
  c.fillRect(-480, -170, 960, 10);
  // 窗
  const glare = o.glare ?? 1;
  c.fillStyle = blend("#f3e6dd", "#fffdf6", glare);
  c.fillRect(-120, -500, 300, 300);
  if (o.bars !== false) {
    c.fillStyle = "#7a5e66";
    for (let i = 0; i <= 6; i++) c.fillRect(-120 + i * 49, -500, 7, 300);
    c.fillRect(-120, -500, 300, 8);
    c.fillRect(-120, -208, 300, 8);
  }
  // 窗里落下来的白光
  c.save();
  c.globalAlpha = 0.22 * glare;
  c.fillStyle = "#fff6e6";
  c.beginPath();
  c.moveTo(-120, -200);
  c.lineTo(180, -200);
  c.lineTo(320, 0);
  c.lineTo(-60, 0);
  c.closePath();
  c.fill();
  c.restore();
  // 地板
  c.fillStyle = blend("#c49a7c", "#5d4c72", n);
  c.fillRect(-1400, 0, 2800, 600);
  c.fillStyle = blend("#a87e63", "#4d3f63", n);
  for (let x = -1400; x < 1400; x += 120) c.fillRect(x, 0, 3, 600);
  c.fillStyle = blend("#8f6a55", "#3e3356", n);
  c.fillRect(-480, -4, 960, 6);
  if (o.slogan) {
    c.fillStyle = "#fff4e2";
    c.fillRect(230, -520, 200, 300);
    c.fillStyle = "#a3241e";
    c.font = `700 52px "YinliSerif", serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    "乐园在上".split("").forEach((ch, i) => c.fillText(ch, 290, -478 + i * 62));
    "轻者先登".split("").forEach((ch, i) => c.fillText(ch, 370, -478 + i * 62));
  }
  // 灯
  if (o.lamp !== undefined) {
    const lp = clamp(o.lamp);
    if (lp > 0) {
      const g = c.createRadialGradient(300, -230, 10, 300, -230, 520);
      g.addColorStop(0, `rgba(255,196,120,${0.6 * lp})`);
      g.addColorStop(1, "rgba(255,170,90,0)");
      c.fillStyle = g;
      c.fillRect(-300, -800, 1200, 900);
    }
    c.fillStyle = PAL.woodDark;
    c.fillRect(170, -150, 260, 14);
    c.fillRect(190, -136, 12, 136);
    c.fillRect(400, -136, 12, 136);
    c.fillStyle = lp > 0 ? blend("#e8d7b8", "#ffd88f", lp) : "#cbb79a";
    c.beginPath();
    c.moveTo(270, -245);
    c.lineTo(330, -245);
    c.lineTo(345, -205);
    c.lineTo(255, -205);
    c.closePath();
    c.fill();
    c.fillStyle = PAL.woodDark;
    c.fillRect(296, -205, 8, 55);
  }
}
/** 床：床头柱在 x=-440（拴脚绳的地方） */
export function bed(c: C, n = 0) {
  c.fillStyle = blend(PAL.wood, "#4b3c62", n);
  c.fillRect(-450, -120, 22, 120);
  c.fillRect(-60, -80, 18, 80);
  c.fillStyle = blend("#efb7a3", "#7a6595", n);
  c.fillRect(-440, -78, 390, 34);
  c.fillStyle = blend("#fff7ef", "#a69bc6", n);
  c.fillRect(-430, -96, 120, 20);
}
/** 她屋里地上的那把椅子（地上没有床）：坐在上面脱靴子，脚绳拴在椅子后腿上。x 是椅面中心 */
export const CHAIR_X = -230;
export function chair(c: C, n = 0) {
  const x = CHAIR_X;
  c.fillStyle = blend(PAL.wood, "#4b3c62", n);
  c.fillRect(x - 40, -62, 80, 10); // 椅面
  c.fillRect(x - 40, -175, 10, 175); // 后腿连着靠背
  c.fillRect(x + 28, -54, 9, 54); // 前腿
  c.fillRect(x - 40, -160, 10, 70); // 靠背
  c.fillStyle = blend(PAL.woodDark, "#3b2f55", n);
  c.fillRect(x - 46, -180, 22, 10); // 靠背顶
  c.fillRect(x - 36, -24, 66, 6); // 横撑
}
/** 脚绳拴的地方：椅子后腿靠地的一截（以前是床头柱，名字没改） */
export const BEDPOST: [number, number] = [CHAIR_X - 35, -18];

/** 她的铁靴（放在地上的一对，full 0..1 塞满石子的程度） */
export function bootsPair(c: C, x: number, y: number, s = 1, full = 1) {
  c.save();
  for (const o of [0, 58]) {
    c.fillStyle = "#5d3f34";
    c.beginPath();
    c.moveTo(x + o * s - 22 * s, y - 70 * s);
    c.lineTo(x + o * s + 16 * s, y - 70 * s);
    c.lineTo(x + o * s + 18 * s, y - 22 * s);
    c.quadraticCurveTo(x + o * s + 46 * s, y - 20 * s, x + o * s + 44 * s, y);
    c.lineTo(x + o * s - 24 * s, y);
    c.closePath();
    c.fill();
    c.fillStyle = "#e3dad6";
    for (let i = 0; i < 5 * full; i++) {
      c.beginPath();
      c.ellipse(x + o * s - 14 * s + (i % 3) * 13 * s, y - 70 * s - 3 * s - Math.floor(i / 3) * 7 * s, 7 * s, 5 * s, 0.3 * i, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

/** 电车车厢剖面：车厢地板在 y=0，车顶在 y=-430，x ∈ [-760, 760] */
export function tram(c: C, t: number, o: { night?: number } = {}) {
  c.fillStyle = "#4f8f8a";
  c.fillRect(-800, -470, 1600, 40);
  c.fillRect(-800, 0, 1600, 70);
  c.fillStyle = blend("#f2e3cf", "#5b6299", o.night ?? 0);
  c.fillRect(-760, -430, 1520, 430);
  // 后窗：外面的灰街在往后走
  for (let i = 0; i < 5; i++) {
    const x = -680 + i * 290;
    c.fillStyle = "#f6d9d4";
    c.fillRect(x, -360, 220, 170);
    c.fillStyle = "#c9b2d8";
    const off = ((t * 420 + i * 97) % 260) - 40;
    c.fillRect(x + off * 0.7, -330, 26, 140);
    c.fillStyle = "#4f8f8a";
    c.fillRect(x - 6, -366, 232, 8);
  }
  // 车顶的网
  c.strokeStyle = "rgba(140,105,95,0.8)";
  c.lineWidth = 2;
  c.beginPath();
  for (let x = -740; x <= 740; x += 30) {
    c.moveTo(x, -426);
    c.lineTo(x + 15, -400);
    c.lineTo(x + 30, -426);
  }
  c.moveTo(-740, -400);
  c.lineTo(740, -400);
  c.stroke();
  // 吊环
  c.strokeStyle = "#8a6f7a";
  c.lineWidth = 4;
  for (let x = -600; x <= 600; x += 200) {
    c.beginPath();
    c.moveTo(x, -400);
    c.lineTo(x, -330);
    c.stroke();
    c.beginPath();
    c.arc(x, -318, 12, 0, Math.PI * 2);
    c.stroke();
  }
  // 座椅
  c.fillStyle = "#b5735e";
  for (let x = -640; x <= 560; x += 400) {
    c.fillRect(x, -100, 200, 24);
    c.fillRect(x + 10, -76, 14, 76);
    c.fillRect(x + 176, -76, 14, 76);
  }
}
