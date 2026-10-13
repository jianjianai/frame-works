// 15 秒的大转场（用户要「更宏大，镜头穿越很远很远的地方，到达另一个手机屏幕」）：歌声停顿的一瞬，镜头从她的脸
// 一路拉出她的窗户（整栋楼只有几扇亮着）→ 甩上夜空 → 低空掠过城市灯海、高速公路的车灯、田野和远山，越飞越快
// → 远处一盏暖灯越来越近、镜头压低 → 冲进那盏灯 → 他的手机屏幕。
import { clamp, phase } from "@frame/engine/math";
import { Ctx, H, W, easeIn, easeInOut, fillBg, glow, hash, vgrad, zoomBlur } from "@materials/s0rrow/code/draw";
import { snow } from "./world";

/** her window in the facade: centre and scale of the picture inside it */
const WIN: [number, number] = [540, 760];
const WK = 0.11;

/** The night facade of her building, her window lit (with `inside` drawn in it at scale WK). */
function facade(c: Ctx, abs: number, inside: (c: Ctx) => void) {
  fillBg(c, vgrad(c, 0, H, [[0, "#0b0f24"], [1, "#151a33"]]));
  c.fillStyle = "#1a1f38";
  c.fillRect(-200, -200, W + 400, H + 400);
  const ww = W * WK,
    wh = H * WK;
  for (let gx = -3; gx <= 3; gx++)
    for (let gy = -4; gy <= 4; gy++) {
      const x = WIN[0] + gx * 190 - ww / 2,
        y = WIN[1] + gy * 290 - wh / 2;
      if (gx === 0 && gy === 0) continue;
      const lit = hash(gx * 7.1 + gy * 3.3) > 0.78;
      c.fillStyle = lit ? "rgba(255,200,130,0.85)" : "#0d1124";
      c.fillRect(x, y, ww, wh);
      c.strokeStyle = "#0a0d1c";
      c.lineWidth = 6;
      c.strokeRect(x, y, ww, wh);
      if (lit) glow(c, x + ww / 2, y + wh / 2, 160, "rgba(255,190,110,0.25)");
    }
  // hers
  const x = WIN[0] - ww / 2,
    y = WIN[1] - wh / 2;
  c.save();
  c.beginPath();
  c.rect(x, y, ww, wh);
  c.clip();
  c.translate(x, y);
  c.scale(WK, WK);
  inside(c);
  c.restore();
  c.strokeStyle = "#0a0d1c";
  c.lineWidth = 6;
  c.strokeRect(x, y, ww, wh);
  glow(c, WIN[0], WIN[1], 260, "rgba(150,180,255,0.3)");
}

/** 1 · pulled out of her face into her window, faster and faster (t0 → t1). */
export function pullOut(c: Ctx, abs: number, t0: number, t1: number, inside: (c: Ctx) => void) {
  const e = easeIn(phase(abs, t0, t1));
  const Z = Math.pow(1 / WK, 1 - e);
  const sx = 540,
    sy = 960 + (WIN[1] - 960) * e;
  zoomBlur(
    c,
    (k) => {
      k.save();
      k.translate(sx, sy);
      k.scale(Z, Z);
      k.translate(-WIN[0], -WIN[1]);
      facade(k, abs, inside);
      k.restore();
    },
    sx,
    sy,
    0.22 * e * e,
    "pull",
  );
  // snow in front of the lens, coming in as the window falls away
  snow(c, abs, { n: 120, seed: 61, speed: 180, size: 4.5, alpha: 0.85 * e, drift: 20 });
}

/** the facade at the end of the pull (for the whip up out of it) */
export function facadeWide(c: Ctx, abs: number, inside: (c: Ctx) => void) {
  facade(c, abs, inside);
  snow(c, abs, { n: 120, seed: 61, speed: 180, size: 4.5, alpha: 0.85, drift: 20 });
}

// ---------------------------------------------------------------- the flight
interface Light {
  x: number;
  z: number;
  col: string;
  r: number;
}
let LIGHTS: Light[] | null = null;
const END_Z = 58000;
const BOOTH_Z = END_Z + 200;
function lights(): Light[] {
  if (LIGHTS) return LIGHTS;
  const out: Light[] = [];
  const h = (i: number, k: number) => hash(i * 12.17 + k * 3.71);
  // the city she lives in
  for (let sx = -4800; sx <= 4800; sx += 400)
    for (let z = 0; z < 15000; z += 160) {
      const i = sx * 7 + z;
      if (h(i, 1) < 0.25) continue;
      out.push({ x: sx + (h(i, 2) - 0.5) * 60, z: z + h(i, 3) * 80, col: h(i, 4) > 0.35 ? "255,200,130" : "225,235,255", r: 1.2 + h(i, 5) * 1.4 });
    }
  for (let z = 300; z < 15000; z += 650)
    for (let x = -4800; x <= 4800; x += 170) {
      const i = z * 3 + x;
      if (h(i, 6) < 0.3) continue;
      out.push({ x: x + h(i, 7) * 60, z, col: "255,214,150", r: 1.2 });
    }
  // the highway: two lanes, white going, red coming
  for (let i = 0; i < 260; i++) {
    const lane = h(i, 5) > 0.5 ? 1 : -1;
    out.push({ x: lane * (140 + h(i, 6) * 80), z: h(i, 7) * (END_Z - 3000), col: lane > 0 ? "255,90,80" : "255,250,230", r: 1.2 });
  }
  // villages far apart
  for (let i = 0; i < 140; i++) out.push({ x: (h(i, 8) - 0.5) * 16000, z: 15000 + h(i, 9) * 40000, col: "255,196,120", r: 1 + h(i, 10) });
  // his small town
  for (let i = 0; i < 70; i++) out.push({ x: (h(i, 11) - 0.5) * 2600, z: END_Z - 2500 + h(i, 12) * 2300, col: "255,190,110", r: 1 + h(i, 13) });
  LIGHTS = out;
  return out;
}

/** 2 · the flight at progress p (0..1): camera z, height and speed follow p. */
export function flight(c: Ctx, abs: number, p: number) {
  const s = clamp(p);
  // smootherstep distance: slow off the roofs, very fast in the middle, braking onto the town
  const zf = (u: number) => u * u * u * (u * (u * 6 - 15) + 10);
  const camZ = END_Z * zf(s);
  const speed = END_Z * 30 * s * s * (1 - s) * (1 - s); // d(camZ)/dp
  const camH = 700 * (1 - 0.95 * easeIn(s));
  const F = 900,
    HZ = 640;
  // sky and the far glow of the horizon
  fillBg(c, vgrad(c, 0, H, [[0, "#060818"], [0.3, "#121633"], [0.36, "#2a2648"], [0.38, "#0b0d1a"], [1, "#05060c"]]));
  for (let i = 0; i < 70; i++) {
    c.fillStyle = `rgba(255,255,255,${(0.3 + 0.5 * hash(i * 9.1)).toFixed(2)})`;
    c.fillRect(hash(i * 3.7) * W, hash(i * 5.3) * (HZ - 40), 2.5, 2.5);
  }
  glow(c, 540, HZ, 900, "rgba(120,110,200,0.25)");
  // far mountains once we're out of the city
  const mk = clamp((s - 0.25) / 0.2) * (1 - clamp((s - 0.9) / 0.1));
  if (mk > 0) {
    c.save();
    c.globalAlpha = mk;
    c.fillStyle = "#0c0f22";
    c.beginPath();
    c.moveTo(-60, HZ + 4);
    for (let i = 0; i <= 24; i++) {
      const x = -60 + i * 50;
      c.lineTo(x, HZ - 30 - 70 * Math.abs(Math.sin(i * 1.3 + 0.4)) * (0.6 + 0.4 * hash(i)));
    }
    c.lineTo(W + 60, HZ + 4);
    c.fill();
    c.restore();
  }
  const haze = 1 - clamp((s - 0.15) / 0.2);
  if (haze > 0) glow(c, 540, HZ + 260, 1100, "rgba(255,170,90,0.28)", haze);
  // ground lights, streaked by speed
  c.save();
  c.globalCompositeOperation = "lighter";
  c.lineCap = "round";
  const dt = 0.025;
  const back = speed * dt * 0.35;
  for (const L of lights()) {
    const dz = L.z - camZ;
    if (dz < 40 || dz > 26000) continue;
    const px = 540 + (L.x * F) / dz,
      py = HZ + (camH * F) / dz;
    if (px < -100 || px > W + 100 || py > H + 100) continue;
    const dz0 = dz + back;
    const qx = 540 + (L.x * F) / dz0,
      qy = HZ + (camH * F) / dz0;
    const fade = Math.min(1, 6000 / dz) * (dz > 18000 ? 1 - (dz - 18000) / 8000 : 1);
    const r = Math.min(10, L.r * (1 + 1500 / dz));
    c.strokeStyle = `rgba(${L.col},${(0.85 * fade).toFixed(3)})`;
    c.lineWidth = r;
    c.beginPath();
    c.moveTo(qx, qy);
    c.lineTo(px + 0.01, py);
    c.stroke();
  }
  c.restore();
  // the one warm light we're heading for: his booth
  const bdz = BOOTH_Z - camZ;
  const by = HZ + (camH * F) / bdz;
  const br = Math.min(320, 26000 / bdz);
  glow(c, 540, by, br * 2.4, "rgba(255,190,110,0.55)", clamp((s - 0.55) / 0.3));
  glow(c, 540, by, br * 0.6, "rgba(255,236,190,0.9)", clamp((s - 0.55) / 0.3));
  // speed lines (snow flying past the lens)
  const sl = Math.min(1, speed / 60000);
  if (sl > 0.05) {
    c.save();
    c.strokeStyle = `rgba(230,240,255,${(0.35 * sl).toFixed(3)})`;
    c.lineWidth = 3;
    for (let i = 0; i < 60; i++) {
      const a = hash(i * 4.3) * Math.PI * 2;
      const d0 = 120 + ((hash(i * 2.9) + abs * (2 + 3 * hash(i))) % 1) * 1100;
      const len = 40 + 260 * sl;
      c.beginPath();
      c.moveTo(540 + Math.cos(a) * d0, HZ + Math.sin(a) * d0);
      c.lineTo(540 + Math.cos(a) * (d0 + len), HZ + Math.sin(a) * (d0 + len));
      c.stroke();
    }
    c.restore();
  }
  // vignette
  const v = c.createRadialGradient(540, 860, 300, 540, 860, 1200);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.6)");
  c.fillStyle = v;
  c.fillRect(-60, -60, W + 120, H + 120);
}

/** where the booth light sits on screen at the end of the flight (the crash into the phone zooms about it) */
export const BOOTH_AT: [number, number] = [540, 640 + (700 * 0.05 * 900) / (BOOTH_Z - END_Z)];

export { easeInOut };
