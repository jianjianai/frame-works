// 15 秒的大转场（用户要「镜头从窗户出来，飞到万米高空，移动到另外一个城市，降落到另外一个地方的手机屏幕上」）：
// 歌声停顿的一瞬，镜头从她的脸一路拉出她的窗户（整栋楼只有几扇亮着）→ 甩上去变成正上方俯瞰，一路爬升：她的屋顶 →
// 街道 → 整座城的灯网 → 穿过云层 → 万米高空 → 沿着高速公路的灯线飞过雪地、河和村庄 → 另一座小城 → 再穿过云层降下来
// → 冲进厂门口那盏暖灯 → 他的手机屏幕。
import { clamp, phase } from "@frame/engine/math";
import { Ctx, H, W, easeIn, easeInOut, fillBg, filtered, glow, hash, smearV, vgrad, zoomBlur } from "@materials/s0rrow/code/draw";
import { snow } from "@materials/s0rrow/code/blocked/snow";
import { SHOT, WORD, at } from "./timeline";

/** her window in the facade: centre and scale of the picture inside it */
const WIN: [number, number] = [540, 760];
const WK = 0.11;

/** The night facade of her building in the snow: an old tiled block, floor slabs and sills holding snow, aluminium
 *  windows (a few lit warm behind curtains, one TV-blue, the rest dark with the moon in them), AC units and a couple
 *  of security-grille cages; her window lit (with `inside` drawn in it at scale WK), fairy lights along its top. */
function facade(c: Ctx, abs: number, inside: (c: Ctx) => void, deco = 1) {
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
        // a TV on in the dark: its light jumps when the picture cuts (a new level every few frames)
        const fl = 0.45 + 0.55 * hash(Math.floor(abs * 6 + hash(gx * 5.3 + gy) * 6) + gx * 31 + gy * 17);
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
  // her window's frame, curtains tied back, fairy lights along the top, sill and glow: they come in as the window
  // shrinks (at the start of the pull the window is the whole frame)
  c.save();
  c.globalAlpha = deco;
  c.strokeStyle = "#8a90a6";
  c.lineWidth = 4;
  c.strokeRect(x, y, ww, wh);
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
  c.restore();
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

/** 1 · pulled back out of the picture in her window, faster and faster (t0 → t1). */
function pullOut(c: Ctx, abs: number, t0: number, t1: number, inside: (c: Ctx) => void) {
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
      facade(k, abs, inside, clamp(e * 4));
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

// ---------------------------------------------------------------- the flight over the map
// 用户 2026-10-14：先要「镜头从窗户出来，飞到万米高空，移动到另外一个城市，降落到另外一个地方的手机屏幕上」；做成云海
// 透视飞行后又说「云太多太厚了，下面光点不够明显」，要「出来之后镜头向下，之后地图缩小，丝滑平移，到另外一个城市之后
// 放大，到一个父亲的房子里」，而且「缩小、平移、放大这几个动作可以一起进行，不要死板一步一步的」。
// So: out of her window the camera tips down onto her snowy roof, then one continuous zoom-and-pan over the night map
// (van Wijk & Nuij's smooth zooming and panning — the same path a map app flies: it rises while it starts moving,
// glides across at the top with both towns' lights in view, and comes down while it is still arriving) to his town and
// down onto the little gatehouse at the factory gate, warm light in its window; then into it (act2: his phone).
// The map is in metres; the screen shows `w` metres across.

/** the transition's timing (用户 2026-10-14：她的表情特写删掉，时间给转场): the pull out of her phone and her window starts
 *  where shot 9 used to; the facade; the camera tips down; the flight over the map; at CRASH_AT into the gatehouse */
export const PULL_AT = () => at(SHOT.s9);
export const FACADE_AT = 14.5,
  FLY_AT = 14.32,
  // (用户：这里需要加快一点，下一句一开始就切换到父亲查看女儿的照片) we're on his phone as 「Seeing you so happy」 starts
  CRASH_AT = WORD.seeing - 0.22;
type P2 = [number, number];
/** her building, and his gatehouse ~90 km away (the little house's middle) */
const HOME: P2 = [0, 0];
const BOOTH: P2 = [38000, -82000];
/** the two close-up neighbourhoods we leave from and come down into are drawn by hand (local streets, roofs, lamps);
 *  the towns' scattered lights keep out of them */
const LOCAL_R = 760;
const DIR = Math.atan2(BOOTH[1] - HOME[1], BOOTH[0] - HOME[0]);
/** the map's turn that points the way to him straight up the screen */
const YAW = -Math.PI / 2 - DIR;
/** how much ground the frame shows across (m), at the start (her street) and the end (the gatehouse and the gate) */
const W0 = 300,
  W1 = 44;
const smoother = (u: number) => {
  const v = clamp(u);
  return v * v * v * (v * (v * 6 - 15) + 10);
};

/** van Wijk & Nuij's optimal zoom-and-pan path from (HOME, W0) to (BOOTH, W1): s 0..1 → [x, y, w] */
const PATH = (() => {
  const R = Math.SQRT2;
  const [ux0, uy0] = HOME,
    [ux1, uy1] = BOOTH;
  const dx = ux1 - ux0,
    dy = uy1 - uy0,
    d1 = Math.hypot(dx, dy);
  const b0 = (W1 * W1 - W0 * W0 + 4 * d1 * d1) / (2 * W0 * 2 * d1),
    b1 = (W1 * W1 - W0 * W0 - 4 * d1 * d1) / (2 * W1 * 2 * d1);
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
    r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  const S = (r1 - r0) / R;
  return (t: number): [number, number, number] => {
    const s = clamp(t) * S;
    const u = (W0 / (2 * d1)) * (Math.cosh(r0) * Math.tanh(R * s + r0) - Math.sinh(r0));
    return [ux0 + u * dx, uy0 + u * dy, (W0 * Math.cosh(r0)) / Math.cosh(R * s + r0)];
  };
})();
/** the view at time abs: centre, width shown (m), and the map's turn */
function view(abs: number): { x: number; y: number; w: number; yaw: number } {
  // already moving as it takes over from the pull out of her window, easing in to the gatehouse
  const u = phase(abs, FLY_AT, CRASH_AT);
  const [x, y, w] = PATH(0.3 * u + 0.7 * smoother(u));
  return { x, y, w, yaw: YAW + 0.35 * (1 - smoother(phase(abs, FLY_AT, FLY_AT + 0.7))) };
}

/** how much journey() blurs the map: radial while it zooms fast, along the way while it pans fast */
function routeBlur(abs: number): { zoom: number; pan: number } {
  const d = 0.008;
  const a = view(abs - d),
    b = view(abs + d);
  const zoom = Math.abs(Math.log(b.w / a.w)) / (2 * d);
  const pan = (Math.hypot(b.x - a.x, b.y - a.y) / (2 * d)) * (W / view(abs).w);
  return { zoom: Math.min(0.022, zoom * 0.0035), pan: Math.min(14, pan / 200) };
}

/** the two towns: centre, radius (m), the turn of their street grids */
const CITY_A = { x: 2200, y: 2600, r: 15000, rot: 0.32 };
const CITY_B = { x: BOOTH[0] - 2600, y: BOOTH[1] - 2000, r: 7000, rot: -0.2 };
/** light colours: sodium orange, warm white, cold LED white */
const COLS = ["255,168,88", "255,214,160", "232,240,255"];
interface Dot {
  x: number;
  y: number;
  /** the light's pool on the ground (m) */
  s: number;
  c: number;
  b: number;
  /** a lamp of the hand-drawn neighbourhoods: a pool of light on the snow when we're close */
  pool?: boolean;
}
/** a street in one of the close-up neighbourhoods (local metres: from, to) and a building's roof */
type Street = [P2, P2];
interface Roof {
  u: number;
  v: number;
  w: number;
  h: number;
  t: number;
  /** a pitched roof (ridge along its length) rather than a flat one */
  ridge?: boolean;
}
interface Local {
  at: P2;
  rot: number;
  streets: Street[];
  roofs: Roof[];
  trees: [number, number, number][];
}
interface Route {
  dots: Dot[];
  road: P2[];
  river: P2[];
  villages: { x: number; y: number; r: number; n: number }[];
  wisps: { x: number; y: number; rx: number; ry: number; a: number; rot: number }[];
  locals: Local[];
}
let ROUTE: Route | null = null;

/** A town's lights from the air (fixed seeds): avenues out from the middle and ring roads (sodium orange),
 *  neighbourhoods of little street grids (warm and LED white), a bright centre, lights thinning out to the edge. */
function townLights(T: { x: number; y: number; r: number; rot: number }, seed: number, dots: Dot[], patches = 52) {
  const h = (i: number) => hash(seed * 17.3 + i * 1.731);
  const at = (d: number, a: number): P2 => [T.x + Math.cos(a) * d, T.y + Math.sin(a) * d];
  for (let a = 0; a < 10; a++) {
    const ang = (a / 10) * Math.PI * 2 + (h(a) - 0.5) * 0.5;
    for (let t = 0.03; t < 1.15; t += 0.005) {
      const p = at(t * T.r, ang + 0.12 * Math.sin(t * 5 + a));
      if (h(a * 1000 + t * 900) > 0.15) dots.push({ x: p[0], y: p[1], s: 10, c: 0, b: 1 - 0.4 * t });
    }
  }
  for (const ring of [0.2, 0.42, 0.68]) {
    const n = Math.round(Math.PI * 2 * ring * 200);
    for (let i = 0; i <= n; i++) {
      const th = (i / n) * Math.PI * 2;
      const p = at(ring * T.r * (1 + 0.04 * Math.sin(th * 5 + seed)), th);
      if (h(ring * 5000 + i) > 0.15) dots.push({ x: p[0], y: p[1], s: 10, c: 0, b: 0.95 - 0.3 * ring });
    }
  }
  const patch = (px: number, py: number, L: number, g: number, rot: number, k0: number, bright: number) => {
    const cr = Math.cos(rot),
      sr = Math.sin(rot);
    const n = Math.round(L / g);
    for (let i = -n; i <= n; i++)
      for (let dir = 0; dir < 2; dir++)
        for (let j = -n * 2; j <= n * 2; j++) {
          if (hash(k0 + i * 31.7 + j * 3.3 + dir * 77) < 0.25) continue;
          const u = i * g,
            v = (j * g) / 2;
          if (Math.hypot(u, v) > L) continue;
          const [lx, ly] = dir ? [v, u] : [u, v];
          const x = px + lx * cr - ly * sr,
            y = py + lx * sr + ly * cr;
          const fall = 1 - Math.hypot(x - T.x, y - T.y) / (T.r * 1.15);
          if (fall <= 0) continue;
          dots.push({ x, y, s: 6, c: hash(k0 + i * 5.1 + j * 7.9) > 0.55 ? 2 : 1, b: bright * (0.5 + 0.5 * fall) * (1 - 0.45 * (Math.hypot(u, v) / L)) });
        }
  };
  for (let i = 0; i < patches; i++) {
    const d = T.r * Math.pow(h(100 + i), 0.7) * 0.95,
      a = h(200 + i) * Math.PI * 2;
    const [px, py] = at(d, a);
    const L = T.r * (0.025 + 0.045 * h(300 + i));
    patch(px, py, L, L / 3, T.rot + (h(400 + i) - 0.5) * 0.6, seed * 1000 + i * 50, 0.8);
  }
  for (let i = 0; i < 700; i++) {
    const d = T.r * 0.15 * Math.sqrt(h(600 + i)),
      a = h(700 + i) * Math.PI * 2;
    const [x, y] = at(d, a);
    dots.push({ x, y, s: 10, c: h(800 + i) > 0.5 ? 1 : 2, b: 1 });
  }
  for (let i = 0; i < 1100; i++) {
    const d = T.r * Math.pow(h(900 + i), 0.6) * 1.15,
      a = h(1900 + i) * Math.PI * 2;
    const [x, y] = at(d, a);
    dots.push({ x, y, s: 6, c: h(2900 + i) > 0.4 ? 1 : 0, b: 0.4 + 0.45 * (1 - d / (T.r * 1.15)) });
  }
  return patch;
}

/** everything on the map (fixed seeds, built on first use) */
function route(): Route {
  if (ROUTE) return ROUTE;
  const all: Dot[] = [];
  const patchA = townLights(CITY_A, 1, all, 170);
  const patchB = townLights(CITY_B, 2, all, 90);
  // the streets round the two neighbourhoods, so the town is all round us as we rise and as we come down
  for (const [patch, [cx, cy], n, far, rot, k0] of [[patchA, HOME, 52, 3200, CITY_A.rot, 95000], [patchB, BOOTH, 48, 2400, CITY_B.rot, 96000]] as const)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 * 1.618 + hash(k0 + i) * 0.6,
        d = LOCAL_R * 0.9 + hash(k0 + i * 3.7) * (far - LOCAL_R * 0.9);
      const L = 260 + hash(k0 + i * 5.3) * 340;
      patch(cx + Math.cos(a) * d, cy + Math.sin(a) * d, L, L / 3, rot + (hash(k0 + i * 7.1) - 0.5) * 0.4, k0 + i * 40, 0.85);
    }
  const dots = all.filter((d) => Math.hypot(d.x - HOME[0], d.y - HOME[1]) > LOCAL_R && Math.hypot(d.x - BOOTH[0], d.y - BOOTH[1]) > LOCAL_R);
  const locals = [homeStreets(), gateStreets()];
  // the neighbourhoods' lamps: along their streets, every 28 m, either side in turn
  for (const L of locals) {
    const cr = Math.cos(L.rot),
      sr = Math.sin(L.rot);
    for (const [[u0, v0], [u1, v1]] of L.streets) {
      const len = Math.hypot(u1 - u0, v1 - v0);
      const nu = -(v1 - v0) / len,
        nv = (u1 - u0) / len;
      for (let d = 10, i = 0; d < len; d += 34, i++) {
        const side = i % 2 ? 6.5 : -6.5;
        const u = u0 + ((u1 - u0) * d) / len + nu * side,
          v = v0 + ((v1 - v0) * d) / len + nv * side;
        const rr = Math.hypot(u, v);
        if (rr > LOCAL_R - 120) continue;
        // dimmer toward the edge, so the hand-drawn streets melt into the town's lights round them
        dots.push({ x: L.at[0] + u * cr - v * sr, y: L.at[1] + u * sr + v * cr, s: 15, c: hash(u * 0.37 + v * 0.71) > 0.85 ? 2 : 1, b: 1 - 0.45 * clamp((rr - 380) / 260), pool: true });
      }
    }
  }
  const len = Math.hypot(BOOTH[0] - HOME[0], BOOTH[1] - HOME[1]);
  const ux = (BOOTH[0] - HOME[0]) / len,
    uy = (BOOTH[1] - HOME[1]) / len;
  const at = (t: number, off: number): P2 => [HOME[0] + ux * len * t - uy * off, HOME[1] + uy * len * t + ux * off];
  const road = Array.from({ length: 161 }, (_, i) => {
    const t = i / 160;
    return at(t, 4600 * Math.sin(Math.PI * t * 2.6) * Math.sin(Math.PI * t));
  });
  const river = Array.from({ length: 81 }, (_, i) => {
    const s = i / 80 - 0.5;
    return at(0.5 + 0.05 * Math.sin(s * 9) + 0.015 * Math.sin(s * 31), s * 110000);
  });
  const villages = [0.2, 0.29, 0.38, 0.47, 0.58, 0.67, 0.76, 0.33, 0.43, 0.62, 0.8, 0.25, 0.55].map((t, i) => {
    const off = i < 7 ? 4600 * Math.sin(Math.PI * t * 2.6) * Math.sin(Math.PI * t) + (hash(i * 3.3) - 0.5) * 2400 : (hash(i * 5.1) > 0.5 ? 1 : -1) * (8000 + hash(i * 2.7) * 14000);
    const [x, y] = at(t, off);
    return { x, y, r: 600 + hash(i * 7.9) * 900, n: 18 + Math.floor(hash(i * 4.4) * 22) };
  });
  // a few thin wisps of cloud under us at the top of the flight, nowhere near the towns
  const wisps: Route["wisps"] = [];
  for (let i = 0; wisps.length < 12 && i < 200; i++) {
    const [x, y] = at(0.12 + hash(i * 1.37) * 0.76, (hash(i * 2.91) - 0.5) * 70000);
    if (Math.hypot(x - CITY_A.x, y - CITY_A.y) < 16000 || Math.hypot(x - CITY_B.x, y - CITY_B.y) < 10000) continue;
    wisps.push({ x, y, rx: 5000 + hash(i * 3.71) * 7000, ry: 700 + hash(i * 6.1) * 900, a: 0.035 + hash(i * 5.17) * 0.05, rot: DIR + (hash(i * 8.3) - 0.5) * 0.5 });
  }
  ROUTE = { dots, road, river, villages, wisps, locals };
  return ROUTE;
}

/** her neighbourhood (local metres round her building, turned with her town): streets every 90 m with her building in
 *  the middle of a block, two or three buildings to a block, a little park with trees here and there */
function homeStreets(): Local {
  const streets: Street[] = [];
  const E = 560;
  for (let i = -6; i <= 6; i++) {
    const u = i * 90 + 45;
    if (Math.abs(u) < E) streets.push([[u, -E], [u, E]]);
  }
  for (let j = -6; j <= 6; j++) {
    const v = j * 90 + 45;
    if (Math.abs(v) < E) streets.push([[-E, v], [E, v]]);
  }
  const roofs: Roof[] = [],
    trees: [number, number, number][] = [];
  for (let i = -6; i <= 5; i++)
    for (let j = -6; j <= 5; j++) {
      const cu = i * 90,
        cv = j * 90;
      if (Math.hypot(cu, cv) > E - 40) continue;
      if (i === 0 && j === 0) {
        roofs.push({ u: 0, v: 0, w: 26, h: 72, t: 1 });
        roofs.push({ u: 26, v: -14, w: 18, h: 44, t: 0.4 });
        continue;
      }
      const t = hash(i * 7.3 + j * 13.1);
      const jit = (k: number) => (hash(t * 97 + k) - 0.5) * 6;
      if (t < 0.12) {
        // a little park: trees under snow
        for (let k = 0; k < 7; k++) trees.push([cu + (hash(k + t * 50) - 0.5) * 60, cv + (hash(k * 2.3 + t * 70) - 0.5) * 60, 4 + hash(k * 3.1 + t) * 3]);
        continue;
      }
      const kind = Math.floor(hash(t * 13) * 4);
      if (kind === 0) {
        // two slabs side by side
        roofs.push({ u: cu - 16 + jit(1), v: cv + jit(2), w: 22 + jit(3), h: 62, t: hash(t * 31) });
        roofs.push({ u: cu + 17 + jit(4), v: cv + jit(5), w: 20 + jit(6), h: 56, t: hash(t * 47) });
      } else if (kind === 1) {
        // an L of two wings round a yard, a tree in it
        roofs.push({ u: cu + jit(1), v: cv - 20, w: 62, h: 20, t: hash(t * 31) });
        roofs.push({ u: cu - 21, v: cv + 10, w: 20, h: 42, t: hash(t * 31) });
        trees.push([cu + 12, cv + 14, 5]);
      } else if (kind === 2) {
        // little old houses with pitched roofs
        for (let k = 0; k < 4; k++) roofs.push({ u: cu - 18 + (k % 2) * 36 + jit(k), v: cv - 16 + Math.floor(k / 2) * 32 + jit(k + 5), w: 16 + jit(k + 9), h: 22, t: hash(t * 31 + k), ridge: true });
      } else {
        // one long block across the plot
        roofs.push({ u: cu + jit(1), v: cv + jit(2), w: 60, h: 26 + jit(3), t: hash(t * 31) });
        trees.push([cu - 22, cv + 26, 4.5], [cu + 20, cv - 26, 4]);
      }
    }
  return { at: HOME, rot: CITY_A.rot, streets, roofs, trees };
}
/** the factory gate (local metres round his gatehouse, turned with his town): the road out through the gate with the
 *  house beside it, the main road across further out, the factory's big roofs behind the wall, trees along the road */
function gateStreets(): Local {
  const streets: Street[] = [
    [[-13, -260], [-13, 720]],
    [[-700, 560], [700, 560]],
    [[-700, -230], [-30, -230]],
    // the workers' estate on this side of the main road
    [[-330, 60], [-330, 540]],
    [[-190, 60], [-190, 540]],
    [[170, 60], [170, 540]],
    [[320, 60], [320, 540]],
    [[-600, 200], [-40, 200]],
    [[20, 200], [600, 200]],
    [[-600, 380], [-40, 380]],
    [[20, 380], [600, 380]],
  ];
  const roofs: Roof[] = [
    { u: -110, v: -110, w: 150, h: 120, t: 0.3 },
    { u: 90, v: -120, w: 130, h: 140, t: 0.6 },
    { u: -120, v: -330, w: 160, h: 90, t: 0.5 },
    { u: 110, v: -330, w: 120, h: 100, t: 0.2 },
    { u: 0, v: 0, w: 6, h: 8, t: 1, ridge: true },
  ];
  for (let i = 0; i < 8; i++) {
    const v = 120 + i * 55;
    roofs.push({ u: -60 - (i % 2) * 8, v, w: 22, h: 30, t: hash(i * 3.3), ridge: true });
    roofs.push({ u: 40 + (i % 2) * 6, v: v + 20, w: 20, h: 28, t: hash(i * 5.7), ridge: true });
  }
  for (const bu of [-400, -260, -120, 90, 245, 390])
    for (const bv of [130, 290, 470]) {
      const t = hash(bu * 0.13 + bv * 0.07);
      if (t < 0.15) continue;
      roofs.push({ u: bu - 22, v: bv + (t - 0.5) * 10, w: 20, h: 34, t, ridge: t > 0.5 });
      roofs.push({ u: bu + 22, v: bv - (t - 0.5) * 10, w: 22, h: 30, t: hash(t * 9), ridge: t > 0.5 });
    }
  const trees: [number, number, number][] = [];
  for (let i = 0; i < 16; i++) trees.push([i % 2 ? 2 : -28, 30 + i * 32 + hash(i) * 8, 3.5 + hash(i * 2.1) * 2]);
  return { at: BOOTH, rot: CITY_B.rot, streets, roofs, trees };
}

/** one close-up neighbourhood from straight above, at night in the snow (drawn in the map; `a` fades it with height) */
function neighbourhood(c: Ctx, L: Local, a: number, gate: boolean, abs: number) {
  c.save();
  c.globalAlpha = a;
  c.translate(L.at[0], L.at[1]);
  c.rotate(L.rot);
  // moonlit snow on the ground, fading out at the edge into the dark map
  const g = c.createRadialGradient(0, 0, 0, 0, 0, LOCAL_R);
  g.addColorStop(0, "rgba(40,47,82,1)");
  g.addColorStop(0.75, "rgba(32,38,68,0.9)");
  g.addColorStop(1, "rgba(22,27,50,0)");
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, LOCAL_R, 0, Math.PI * 2);
  c.fill();
  // the streets: ploughed dark, snow banked along their edges
  c.lineCap = "butt";
  for (const [[u0, v0], [u1, v1]] of L.streets) {
    c.strokeStyle = "rgba(170,182,222,0.22)";
    c.lineWidth = 15;
    c.beginPath();
    c.moveTo(u0, v0);
    c.lineTo(u1, v1);
    c.stroke();
    c.strokeStyle = "#141827";
    c.lineWidth = 11;
    c.stroke();
  }
  // trees: dark crowns with snow on top
  for (const [u, v, r] of L.trees) {
    c.fillStyle = "rgba(8,10,22,0.5)";
    c.beginPath();
    c.arc(u + 1.2, v + 1.2, r, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#161c30";
    c.beginPath();
    c.arc(u, v, r, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(170,182,224,0.55)";
    c.beginPath();
    c.arc(u - r * 0.25, v - r * 0.25, r * 0.6, 0, Math.PI * 2);
    c.fill();
  }
  // roofs under snow, each with its shadow on the snow
  for (const r of L.roofs) {
    if (gate && r.u === 0 && r.v === 0) continue;
    c.fillStyle = "rgba(6,8,18,0.45)";
    c.fillRect(r.u - r.w / 2 + 2.5, r.v - r.h / 2 + 3, r.w, r.h);
    c.fillStyle = "#1a1f33";
    c.fillRect(r.u - r.w / 2, r.v - r.h / 2, r.w, r.h);
    const house = gate && r.u === 0 && r.v === 0;
    if (r.ridge) {
      c.fillStyle = `rgba(${172 + Math.round(r.t * 30)},${182 + Math.round(r.t * 24)},226,0.9)`;
      c.fillRect(r.u - r.w / 2 + 0.6, r.v - r.h / 2 + 0.6, r.w / 2 - 0.6, r.h - 1.2);
      c.fillStyle = "rgba(112,124,172,0.9)";
      c.fillRect(r.u, r.v - r.h / 2 + 0.6, r.w / 2 - 0.6, r.h - 1.2);
    } else if (!house) {
      const big = r.w * r.h > 6000;
      c.fillStyle = big ? `rgba(${92 + Math.round(r.t * 24)},${102 + Math.round(r.t * 22)},${150 + Math.round(r.t * 20)},0.8)` : `rgba(${132 + Math.round(r.t * 40)},${142 + Math.round(r.t * 36)},${196 + Math.round(r.t * 24)},0.82)`;
      c.fillRect(r.u - r.w / 2 + 1.4, r.v - r.h / 2 + 1.4, r.w - 2.8, r.h - 2.8);
      // a few dark things standing on flat roofs (water tanks, vents)
      c.fillStyle = "#2a2f4a";
      c.fillRect(r.u - r.w / 4, r.v - r.h / 4, Math.min(6, r.w / 5), Math.min(6, r.h / 6));
    }
  }
  if (gate) {
    // the factory wall with snow along its top, the sliding gate across the road
    for (const [u0, u1] of [[-700, -19], [-7, 700]]) {
      c.fillStyle = "#2a2f4a";
      c.fillRect(u0, -12, u1 - u0, 2.4);
      c.fillStyle = "rgba(200,210,240,0.55)";
      c.fillRect(u0, -12.5, u1 - u0, 0.9);
    }
    c.strokeStyle = "rgba(150,160,190,0.85)";
    c.lineWidth = 0.3;
    c.beginPath();
    for (let u = -19; u <= -7; u += 1) {
      c.moveTo(u, -12);
      c.lineTo(u, -10.6);
    }
    c.stroke();
    gatehouse(c, abs);
  }
  c.restore();
}

function polyline(c: Ctx, pts: P2[]) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
}
/** a point `t` (0..1) of the way along a polyline */
function along(pts: P2[], t: number): P2 {
  const f = clamp(t) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(f));
  const u = f - i;
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
}

/** her building from straight above: snow on the flat roof, the parapet, the water tank and the aerial */
function homeRoof(c: Ctx) {
  c.save();
  c.translate(HOME[0], HOME[1]);
  c.rotate(CITY_A.rot);
  c.fillStyle = "#151829";
  c.fillRect(-15, -38, 30, 76);
  c.fillStyle = "rgba(228,234,252,0.9)";
  c.fillRect(-13, -36, 26, 72);
  c.fillStyle = "#2a2e48";
  c.fillRect(-9, -30, 8, 9);
  c.fillStyle = "rgba(240,244,255,0.95)";
  c.fillRect(-9, -30, 8, 2);
  c.strokeStyle = "#2a2e48";
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(6, 20);
  c.lineTo(6, 30);
  c.moveTo(3, 24);
  c.lineTo(9, 24);
  c.stroke();
  c.restore();
}

/** his gatehouse, from straight above (local metres, its middle at 0, 0; the road runs past on its left): the window's
 *  warm light spilling across the snow to the road, the two slopes of its roof under snow, the stovepipe with a breath
 *  of smoke */
function gatehouse(c: Ctx, abs: number) {
  glow(c, -5, 0, 20, "rgba(255,184,104,0.6)");
  c.fillStyle = "rgba(255,200,120,0.3)";
  c.beginPath();
  c.moveTo(-3, -1.8);
  c.lineTo(-3, 1.8);
  c.lineTo(-11, 4.5);
  c.lineTo(-11, -4.5);
  c.closePath();
  c.fill();
  c.fillStyle = "rgba(4,6,14,0.5)";
  c.fillRect(-2.2, -3.2, 6.4, 8.4);
  c.fillStyle = "#1c2034";
  c.fillRect(-3.2, -4.2, 6.4, 8.4);
  c.fillStyle = "rgba(238,242,253,0.96)";
  c.fillRect(-3, -4, 3, 8);
  c.fillStyle = "rgba(190,200,234,0.92)";
  c.fillRect(0, -4, 3, 8);
  c.strokeStyle = "#3a3f5c";
  c.lineWidth = 0.16;
  c.beginPath();
  c.moveTo(0, -4);
  c.lineTo(0, 4);
  c.stroke();
  // the window's sill of light on the road side
  c.fillStyle = "#ffd894";
  c.fillRect(-3.45, -1.2, 0.3, 2.4);
  c.fillStyle = "#2b2f48";
  c.fillRect(1, -2.2, 0.7, 0.7);
  for (let i = 0; i < 4; i++) {
    const u = (abs * 0.6 + i * 0.25) % 1;
    c.fillStyle = `rgba(200,208,232,${(0.28 * (1 - u)).toFixed(3)})`;
    c.beginPath();
    c.arc(1.4 + u * 3.5, -1.9 - u * 1.4, 0.35 + u * 1.1, 0, Math.PI * 2);
    c.fill();
  }
}

/** The flight over the night map at time abs (FLY_AT → CRASH_AT). */
function mapRoute(c: Ctx, abs: number) {
  const V = view(abs);
  const k = W / V.w;
  const vr = Math.hypot(W, H) / 2 / k + 40;
  const R = route();
  fillBg(c, "#121730");
  c.save();
  c.translate(W / 2, H / 2);
  c.rotate(V.yaw);
  c.scale(k, k);
  c.translate(-V.x, -V.y);
  // the river: black water, a thin sheen of moon on it
  c.lineCap = "round";
  c.lineJoin = "round";
  polyline(c, R.river);
  c.strokeStyle = "#090c1c";
  c.lineWidth = Math.max(2.5 / k, 380);
  c.stroke();
  c.strokeStyle = "rgba(170,190,255,0.25)";
  c.lineWidth = Math.max(0.8 / k, 60);
  c.stroke();
  // the towns' dark built-up ground
  for (const T of [CITY_A, CITY_B]) if (Math.hypot(V.x - T.x, V.y - T.y) < vr + T.r * 1.3) glow(c, T.x, T.y, T.r * 1.1, "rgba(6,7,16,0.6)");
  // close up: her neighbourhood and the factory gate, drawn by hand
  const near = clamp((2300 - V.w) / 1100);
  if (near > 0) {
    const [home, gate] = R.locals;
    if (Math.hypot(V.x - HOME[0], V.y - HOME[1]) < vr + LOCAL_R) {
      neighbourhood(c, home, near, false, abs);
      c.save();
      c.globalAlpha = near;
      homeRoof(c);
      c.restore();
    }
    if (Math.hypot(V.x - BOOTH[0], V.y - BOOTH[1]) < vr + LOCAL_R) neighbourhood(c, gate, near, true, abs);
  }
  // the lights, added up so they bloom where they crowd: the towns' haze (it is what you see from up high), the
  // highway's thread with its cars, the villages, every street light
  c.globalCompositeOperation = "lighter";
  const haze = clamp((V.w - 4000) / 10000);
  if (haze > 0) {
    glow(c, CITY_A.x, CITY_A.y, CITY_A.r * 1.5, "rgba(255,138,56,0.48)", haze);
    glow(c, CITY_B.x, CITY_B.y, CITY_B.r * 1.6, "rgba(255,138,56,0.55)", haze);
  }
  polyline(c, R.road);
  c.strokeStyle = `rgba(255,178,104,${(0.75 * clamp((V.w - 1500) / 6000)).toFixed(3)})`;
  c.lineWidth = Math.max(2 / k, 24);
  c.stroke();
  const carR = Math.max(1.1 / k, 2.5);
  for (let i = 0; i < 160; i++) {
    const back = i % 2 === 1;
    const t = (hash(i * 4.7) + (back ? -1 : 1) * abs * 0.006 + 2) % 1;
    const [x, y] = along(R.road, t);
    if (Math.abs(x - V.x) > vr || Math.abs(y - V.y) > vr) continue;
    c.fillStyle = back ? "rgba(255,84,70,0.95)" : "rgba(255,250,232,0.95)";
    c.fillRect(x - carR, y - carR, carR * 2, carR * 2);
  }
  for (const v of R.villages) {
    if (Math.hypot(v.x - V.x, v.y - V.y) > vr + v.r * 2) continue;
    glow(c, v.x, v.y, v.r * 2.2, "rgba(255,150,70,0.22)");
    const sz = Math.max(1.8 / k, 5);
    for (let j = 0; j < v.n; j++) {
      const a = hash(j * 3.9 + v.r) * Math.PI * 2,
        d = Math.sqrt(hash(j * 6.1 + v.r)) * v.r;
      c.fillStyle = hash(j * 2.3) > 0.3 ? "rgba(255,206,140,0.95)" : "rgba(235,240,255,0.9)";
      c.fillRect(v.x + Math.cos(a) * d - sz / 2, v.y + Math.sin(a) * d - sz / 2, sz, sz);
    }
  }
  // street lights: a bright point from up high; the neighbourhoods' lamps a pool of light on the snow up close
  const px1 = 2.6 / k;
  for (const d of R.dots) {
    if (Math.abs(d.x - V.x) > vr || Math.abs(d.y - V.y) > vr) continue;
    const sz = d.s * k;
    if (!d.pool || sz < 5) {
      const q = Math.max(px1, d.pool ? d.s * 0.3 : 0);
      c.fillStyle = `rgba(${COLS[d.c]},${Math.min(1, d.b * (d.pool ? 1 : 1.35)).toFixed(3)})`;
      c.fillRect(d.x - q / 2, d.y - q / 2, q, q);
    } else {
      glow(c, d.x, d.y, d.s, d.c === 2 ? `rgba(215,228,255,${(0.42 * d.b).toFixed(3)})` : `rgba(255,186,108,${(0.62 * d.b).toFixed(3)})`);
      c.fillStyle = `rgba(255,246,226,${(0.95 * d.b).toFixed(3)})`;
      c.beginPath();
      c.arc(d.x, d.y, Math.max(1.3 / k, 0.7), 0, Math.PI * 2);
      c.fill();
    }
  }
  // his window: one warm point we're heading for, from the moment we leave (up close the house itself shows it)
  const far = clamp((V.w - 300) / 1200);
  glow(c, BOOTH[0], BOOTH[1], Math.max(14 / k, 30), "rgba(255,196,120,0.6)", far);
  glow(c, BOOTH[0], BOOTH[1], Math.max(4 / k, 6), "rgba(255,238,200,0.9)", far);
  c.globalCompositeOperation = "source-over";
  // a few thin wisps of cloud under us at the top, nearer than the ground so they slide a little faster
  const high = clamp((V.w - 9000) / 20000);
  if (high > 0) {
    for (const wsp of R.wisps) {
      const kx = 1.22;
      const x = V.x + (wsp.x - V.x) * kx,
        y = V.y + (wsp.y - V.y) * kx;
      if (Math.hypot(x - V.x, y - V.y) > vr + wsp.rx * kx) continue;
      c.save();
      c.translate(x, y);
      c.rotate(wsp.rot);
      c.scale(1, wsp.ry / wsp.rx);
      glow(c, 0, 0, wsp.rx * kx, `rgba(190,200,240,${(wsp.a * high).toFixed(3)})`);
      c.restore();
    }
  }
  c.restore();
  // snow falling past the lens near the ground
  const low = clamp(1 - V.w / 900);
  if (low > 0) snow(c, abs, { n: 50, seed: 71, speed: 240, size: 4, alpha: 0.6 * low, drift: 12 });
  const v = c.createRadialGradient(540, 960, 420, 540, 960, 1250);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, `rgba(0,0,8,${(0.45 + 0.2 * clamp(V.w / 40000)).toFixed(3)})`);
  c.fillStyle = v;
  c.fillRect(-60, -60, W + 120, H + 120);
}

/** The whole transition from her phone to the plunge into his gatehouse (PULL_AT → CRASH_AT): act1 draws it up to
 *  the end of its layer, act2 carries on. `inside` is what we see through her window as we pull out of it. */
export function journey(c: Ctx, abs: number, inside: (c: Ctx) => void) {
  if (abs < FLY_AT) {
    pullOut(c, abs, PULL_AT(), FACADE_AT, inside);
    return;
  }
  // (用户：向下转镜头浪费时间) no tilt: as the pull out of her window ends, the facade melts into the map straight
  // above her building, already zooming out, and the flight carries on
  if (abs < FACADE_AT) {
    pullOut(c, abs, PULL_AT(), FACADE_AT, inside);
    filtered(c, "none", (k) => mapRoute(k, abs), "j0", smoother(phase(abs, FLY_AT, FACADE_AT)));
    return;
  }
  const b = routeBlur(abs);
  zoomBlur(c, (k) => smearV(k, (q) => mapRoute(q, abs), b.pan, "j2"), BOOTH_AT[0], BOOTH_AT[1], b.zoom + 0.3 * phase(abs, CRASH_AT - 0.1, CRASH_AT), "j3");
}

/** where the booth light sits on screen at the end of the flight (the crash into the phone zooms about it) */
export const BOOTH_AT: [number, number] = [W / 2, H / 2];

export { easeInOut };
