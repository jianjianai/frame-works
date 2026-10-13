// 15 秒的大转场（用户要「更宏大，镜头穿越很远很远的地方，到达另一个手机屏幕」）：歌声停顿的一瞬，镜头从她的脸
// 一路拉出她的窗户（整栋楼只有几扇亮着）→ 甩上夜空 → 低空掠过城市灯海、高速公路的车灯、田野和远山，越飞越快
// → 远处一盏暖灯越来越近、镜头压低 → 冲进那盏灯 → 他的手机屏幕。
import { clamp, phase } from "@frame/engine/math";
import { Ctx, H, W, easeIn, easeInOut, fillBg, glow, hash, vgrad, zoomBlur } from "@materials/s0rrow/code/draw";
import { snow } from "@materials/s0rrow/code/blocked/snow";

/** her window in the facade: centre and scale of the picture inside it */
const WIN: [number, number] = [540, 760];
const WK = 0.11;

/** The night facade of her building in the snow: an old tiled block, floor slabs and sills holding snow, aluminium
 *  windows (a few lit warm behind curtains, one TV-blue, the rest dark with the moon in them), AC units and a couple
 *  of security-grille cages; her window lit (with `inside` drawn in it at scale WK), fairy lights along its top. */
function facade(c: Ctx, abs: number, inside: (c: Ctx) => void) {
  const ww = W * WK,
    wh = H * WK;
  const GX = 190,
    GY = 290;
  const ROOF = WIN[1] - 4 * GY - wh / 2 - 150;
  // sky above the roof
  fillBg(c, vgrad(c, ROOF - 1500, ROOF, [[0, "#05071a"], [1, "#141a3a"]]));
  for (let i = 0; i < 40; i++) {
    c.fillStyle = `rgba(255,255,255,${(0.3 + 0.5 * hash(i * 7.7)).toFixed(2)})`;
    c.fillRect(-300 + hash(i * 3.1) * (W + 600), ROOF - 1500 + hash(i * 5.9) * 1400, 3, 3);
  }
  // the wall: tiles lit faintly from the street lamps below
  c.fillStyle = vgrad(c, ROOF, WIN[1] + 5 * GY, [[0, "#1d2036"], [1, "#2c2c40"]]);
  c.fillRect(-400, ROOF, W + 800, 3000);
  c.strokeStyle = "rgba(0,0,0,0.12)";
  c.lineWidth = 2;
  for (let y = ROOF + 40; y < WIN[1] + 5 * GY; y += 40) {
    c.beginPath();
    c.moveTo(-400, y);
    c.lineTo(W + 400, y);
    c.stroke();
  }
  // pilasters between pairs of bays
  for (let gx = -4; gx <= 4; gx += 2) {
    const x = WIN[0] + (gx + 0.5) * GX - 14;
    c.fillStyle = "#24263b";
    c.fillRect(x, ROOF, 28, 3000);
  }
  // floor slabs, each with a ridge of snow
  for (let gy = -4; gy <= 5; gy++) {
    const y = WIN[1] + gy * GY + wh / 2 + 34;
    c.fillStyle = "#34364e";
    c.fillRect(-400, y, W + 800, 16);
    c.fillStyle = "rgba(235,240,255,0.8)";
    c.fillRect(-400, y - 5, W + 800, 6);
  }
  for (let gx = -3; gx <= 3; gx++)
    for (let gy = -4; gy <= 4; gy++) {
      if (gx === 0 && gy === 0) continue;
      const x = WIN[0] + gx * GX - ww / 2,
        y = WIN[1] + gy * GY - wh / 2;
      const r = hash(gx * 7.1 + gy * 3.3);
      const kind = r > 0.8 ? "warm" : r > 0.74 ? "tv" : "dark";
      // glass
      if (kind === "warm") {
        c.fillStyle = vgrad(c, y, y + wh, [[0, "#ffd79a"], [1, "#f0a860"]]);
        c.fillRect(x, y, ww, wh);
        // curtains half drawn
        c.fillStyle = hash(r * 91) > 0.5 ? "rgba(214,120,96,0.85)" : "rgba(230,200,150,0.85)";
        c.fillRect(x, y, ww * 0.28, wh);
        c.fillRect(x + ww * 0.78, y, ww * 0.22, wh);
      } else if (kind === "tv") {
        const fl = 0.6 + 0.4 * Math.sin(abs * 23 + gx) * Math.sin(abs * 7 + gy);
        c.fillStyle = `rgb(${Math.round(60 + 40 * fl)},${Math.round(90 + 50 * fl)},${Math.round(170 + 60 * fl)})`;
        c.fillRect(x, y, ww, wh);
      } else {
        c.fillStyle = "#0e1228";
        c.fillRect(x, y, ww, wh);
        // the moon's reflection sliding across the dark panes
        c.fillStyle = "rgba(140,160,230,0.12)";
        c.beginPath();
        c.moveTo(x + ww * 0.15, y + wh);
        c.lineTo(x + ww * 0.45, y + wh);
        c.lineTo(x + ww * 0.85, y);
        c.lineTo(x + ww * 0.55, y);
        c.closePath();
        c.fill();
      }
      // aluminium frame and the sliding sash's middle bar
      c.strokeStyle = "#8a90a6";
      c.lineWidth = 4;
      c.strokeRect(x, y, ww, wh);
      c.beginPath();
      c.moveTo(x + ww / 2, y);
      c.lineTo(x + ww / 2, y + wh);
      c.stroke();
      if (kind === "warm") glow(c, x + ww / 2, y + wh / 2, 170, "rgba(255,190,110,0.22)");
      // security-grille cage over a few windows
      if (hash(r * 37) > 0.78) {
        c.strokeStyle = "#565c70";
        c.lineWidth = 3;
        for (let k = 0; k <= 6; k++) {
          c.beginPath();
          c.moveTo(x - 10 + (k * (ww + 20)) / 6, y - 12);
          c.lineTo(x - 10 + (k * (ww + 20)) / 6, y + wh + 12);
          c.stroke();
        }
        c.strokeRect(x - 10, y - 12, ww + 20, wh + 24);
        c.fillStyle = "rgba(235,240,255,0.85)";
        c.fillRect(x - 14, y - 18, ww + 28, 7);
      }
      // the sill, holding snow
      c.fillStyle = "#3a3d55";
      c.fillRect(x - 8, y + wh, ww + 16, 10);
      c.fillStyle = "rgba(240,244,255,0.9)";
      c.beginPath();
      c.ellipse(x + ww / 2, y + wh - 1, ww / 2 + 8, 6, 0, Math.PI, 0);
      c.fill();
      // an AC unit beside some windows, snow on its lid
      if (hash(r * 53) > 0.45) {
        const ax = x + ww + 14,
          ay = y + wh - 70;
        c.fillStyle = "#c9ccd6";
        c.fillRect(ax, ay, 46, 54);
        c.strokeStyle = "#5b6072";
        c.lineWidth = 2;
        c.strokeRect(ax, ay, 46, 54);
        c.beginPath();
        c.arc(ax + 23, ay + 27, 16, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = "rgba(245,248,255,0.95)";
        c.fillRect(ax - 2, ay - 6, 50, 7);
      }
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
  c.strokeStyle = "#8a90a6";
  c.lineWidth = 4;
  c.strokeRect(x, y, ww, wh);
  // her pink curtains tied back, the fairy lights strung along the top of the frame
  c.fillStyle = "rgba(240,170,195,0.9)";
  c.beginPath();
  c.moveTo(x - 2, y);
  c.quadraticCurveTo(x + 18, y + wh * 0.5, x - 2, y + wh);
  c.fill();
  c.beginPath();
  c.moveTo(x + ww + 2, y);
  c.quadraticCurveTo(x + ww - 18, y + wh * 0.5, x + ww + 2, y + wh);
  c.fill();
  for (let k = 0; k < 7; k++) {
    const bx = x + 8 + (k * (ww - 16)) / 6,
      by = y + 8 + Math.sin(k * 1.4) * 3;
    glow(c, bx, by, 14, k % 3 === 0 ? "rgba(255,170,200,0.9)" : "rgba(255,220,150,0.9)");
  }
  c.fillStyle = "#3a3d55";
  c.fillRect(x - 8, y + wh, ww + 16, 10);
  c.fillStyle = "rgba(240,244,255,0.9)";
  c.beginPath();
  c.ellipse(x + ww / 2, y + wh - 1, ww / 2 + 8, 6, 0, Math.PI, 0);
  c.fill();
  glow(c, WIN[0], WIN[1], 260, "rgba(150,180,255,0.3)");
  // the roof: parapet with snow, a water tank and an aerial against the sky
  c.fillStyle = "#16182a";
  c.fillRect(-400, ROOF - 40, W + 800, 40);
  c.fillStyle = "rgba(240,244,255,0.9)";
  c.fillRect(-400, ROOF - 50, W + 800, 12);
  c.fillStyle = "#16182a";
  c.fillRect(170, ROOF - 210, 150, 170);
  c.fillStyle = "rgba(240,244,255,0.85)";
  c.fillRect(162, ROOF - 220, 166, 14);
  c.strokeStyle = "#16182a";
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(820, ROOF - 40);
  c.lineTo(820, ROOF - 330);
  c.moveTo(770, ROOF - 280);
  c.lineTo(870, ROOF - 280);
  c.moveTo(785, ROOF - 230);
  c.lineTo(855, ROOF - 230);
  c.stroke();
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
  // sky: stars, the moon, long thin clouds catching its light
  fillBg(c, vgrad(c, 0, H, [[0, "#050817"], [0.26, "#111633"], [0.33, "#2a2a52"], [0.335, "#121628"], [1, "#05060c"]]));
  for (let i = 0; i < 90; i++) {
    const tw = 0.6 + 0.4 * Math.sin(abs * 3 + i * 1.7);
    c.fillStyle = `rgba(255,255,255,${((0.25 + 0.55 * hash(i * 9.1)) * tw).toFixed(2)})`;
    const r = hash(i * 2.2) > 0.85 ? 3.5 : 2.2;
    c.fillRect(hash(i * 3.7) * W, hash(i * 5.3) * (HZ - 40), r, r);
  }
  const mx = 820 - 40 * s,
    my = 250;
  glow(c, mx, my, 420, "rgba(150,170,255,0.22)");
  glow(c, mx, my, 120, "rgba(230,236,255,0.5)");
  c.fillStyle = "#f4f1e0";
  c.beginPath();
  c.arc(mx, my, 54, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(190,186,170,0.45)";
  for (const [dx, dy, r] of [[-16, -10, 12], [14, 12, 9], [8, -22, 6], [-6, 22, 7]]) {
    c.beginPath();
    c.arc(mx + dx, my + dy, r, 0, Math.PI * 2);
    c.fill();
  }
  for (let i = 0; i < 5; i++) {
    const cy = 380 + i * 48 + hash(i * 3.3) * 20;
    const cx = ((((hash(i * 7.9) * 1700 - 260 * s * (1 + i * 0.4)) % 1700) + 1700) % 1700) - 400;
    const len = 380 + hash(i * 1.9) * 420;
    c.fillStyle = "rgba(40,46,86,0.75)";
    c.beginPath();
    c.ellipse(cx + len / 2, cy, len / 2, 14 + 6 * hash(i), 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(170,185,240,0.25)";
    c.beginPath();
    c.ellipse(cx + len / 2, cy - 6, len / 2 - 30, 4, 0, 0, Math.PI * 2);
    c.fill();
  }
  glow(c, 540, HZ, 900, "rgba(120,110,200,0.25)");
  // the ground: dark in the city, then snow-covered fields faintly lit by the moon, field edges rushing at us
  const mk = clamp((s - 0.25) / 0.2) * (1 - clamp((s - 0.92) / 0.08));
  if (mk > 0) {
    c.save();
    c.globalAlpha = mk;
    c.fillStyle = vgrad(c, HZ, H, [[0, "#3a4266"], [0.25, "#262c48"], [1, "#141828"]]);
    c.fillRect(-60, HZ, W + 120, H - HZ + 60);
    c.strokeStyle = "rgba(8,10,22,0.55)";
    c.lineCap = "round";
    // hedgerows across our path every 900 units, and the field boundaries running away from us
    for (let z = Math.ceil(camZ / 900) * 900; z < camZ + 16000; z += 900) {
      const dz = z - camZ;
      if (dz < 60) continue;
      const y = HZ + (camH * F) / dz;
      c.lineWidth = Math.max(1, Math.min(14, 9000 / dz));
      c.globalAlpha = mk * Math.min(1, 9000 / dz) * 0.9;
      c.beginPath();
      c.moveTo(-60, y);
      c.lineTo(W + 60, y);
      c.stroke();
    }
    c.globalAlpha = mk * 0.7;
    for (let x = -9000; x <= 9000; x += 1300) {
      if (Math.abs(x) < 300) continue;
      const z0 = 80,
        z1 = 16000;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(540 + (x * F) / z0, HZ + (camH * F) / z0);
      c.lineTo(540 + (x * F) / z1, HZ + (camH * F) / z1);
      c.stroke();
    }
    c.restore();
    // far snowy mountains: two ranges, the moonlit snow on their crests
    for (const [layer, col, top, amp0, seed] of [[0, "#1b2244", 40, 200, 3], [1, "#121831", 8, 120, 9]] as const) {
      const amp = amp0 * (0.75 + 0.5 * s);
      c.save();
      c.globalAlpha = mk;
      const pts: [number, number][] = [];
      for (let i = 0; i <= 30; i++) {
        const x = -80 + i * 42 - (layer ? 30 * s : 12 * s);
        const h = amp * Math.abs(Math.sin(i * (layer ? 0.9 : 0.6) + seed)) * (0.5 + 0.5 * hash(i + seed * 10));
        pts.push([x, HZ - top - h]);
      }
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(-80, HZ + 4);
      for (const [x, y] of pts) c.lineTo(x, y);
      c.lineTo(W + 80, HZ + 4);
      c.fill();
      c.fillStyle = layer ? "rgba(200,212,250,0.55)" : "rgba(200,212,250,0.4)";
      for (let i = 1; i < pts.length - 1; i++) {
        const [x, y] = pts[i];
        if (y > pts[i - 1][1] || y > pts[i + 1][1]) continue;
        const d = (HZ - top - y) * 0.35;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + d * 0.7, y + d);
        c.lineTo(x + d * 0.15, y + d * 0.75);
        c.lineTo(x - d * 0.4, y + d * 0.95);
        c.closePath();
        c.fill();
      }
      c.restore();
    }
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
