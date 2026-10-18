// 39.36–43.92「只因为 / 你那渴望自由的心脏 / 困在一张没空隙的网」：窗外，夜里。
// 全城的人都拴着脚绳睡觉，一睡着就往天上飘；镜头从她的窗一路往后拉，越拉越远、越拉越快：
// 一扇扇窗里飘出睡着的人，每人一根红绳拴在楼上；绳子和绳子缠在一起，结成一张盖住整座城的网，网上挂满了人；
// 有人挣断了绳子，飘进白里一闪。她在全城最高那栋楼的顶上，飘得最高。
// 这一段跨第一幕和第二幕（39.99 是两幕的交界），两边用同一个 webDraw，接缝上画面完全一样。
import { type C, type Cam, type Shot, W, H, E, ph, kick, shake, jolt, applyCam, vignette, clamp, mix, seeded, camLerp } from "./core";
import { figure, type Pt } from "./figure";
import { ash, tower, sky, whiteBand, city, TOWER_TOP } from "./world";
import { PAL, crowdLook, blend } from "./palette";
import { qinFloatSleep } from "./pre1";
import { qin } from "./qin";
import { farBurn } from "./intro";

export const WEB_A = 39.36;
export const WEB_B = 43.92;
const T_NET = 41.94; // 「困在一张没空隙的网」

// ---------- 城：最高那栋楼（x=0）两边一排排高楼 ----------
interface Bld {
  x: number;
  w: number;
  h: number;
  col: string;
}
const rnd = seeded(2077);
const BLDS: Bld[] = [];
for (let x = -5400; x <= 5400; x += 400 + rnd() * 160) {
  if (Math.abs(x) < 760) continue;
  const near = 1 - Math.min(1, Math.abs(x) / 6200);
  BLDS.push({ x, w: 260 + rnd() * 200, h: 1500 + near * 2700 * (0.45 + 0.55 * rnd()), col: PAL.buildings[Math.floor(rnd() * PAL.buildings.length)] });
}

// ---------- 睡着飘起来的人：每人一根绳拴在楼上（窗口或楼顶） ----------
interface Sleeper {
  a: Pt; // 绳子拴的地方
  p: Pt; // 飘到的地方（绳子拉直）
  t0: number; // 开始往上飘
  seed: number;
  face: 1 | -1;
}
const SL: Sleeper[] = [];
for (const b of BLDS) {
  // 每栋楼飘出好几个人：绳子从窗口、楼顶一直拉到天上，人都挂在楼顶和白之间的那一层天里
  const n = 5 + Math.floor(rnd() * 5);
  for (let i = 0; i < n; i++) {
    const roof = rnd() < 0.4;
    const side = rnd() < 0.5 ? -1 : 1;
    const ay = roof ? -b.h : -b.h * (0.35 + 0.6 * rnd());
    const ax = roof ? b.x + (rnd() - 0.5) * b.w * 0.8 : b.x + (side * b.w) / 2;
    const py = Math.min(ay - 400, -4700 - rnd() * 3800);
    const px = ax + (rnd() - 0.5) * 600;
    const far = Math.min(1, Math.abs(b.x) / 5400);
    SL.push({ a: [ax, ay], p: [px, py], t0: WEB_A + 0.3 + far * 1.4 + rnd() * 0.6, seed: Math.floor(rnd() * 1000), face: rnd() < 0.5 ? 1 : -1 });
  }
}
// 她那栋楼的窗里也飘出来几个（离她最近，最先看见）
for (let i = 0; i < 10; i++) {
  const side = i % 2 ? 1 : -1;
  const ay = TOWER_TOP + 420 + i * 260;
  SL.push({ a: [side * 500, ay], p: [side * (620 + rnd() * 300), ay - 160 - rnd() * 260], t0: WEB_A + 0.1 + i * 0.07, seed: 500 + i, face: side as 1 | -1 });
}
// ---------- 「只因为 / 你那渴望自由的心脏」：一个人从窗口往上飘，越飘越快，快到白的时候脚绳猛地绷直，把他拽住 ----------
const HB = BLDS.reduce((a, b) => (Math.abs(b.x + 1300) < Math.abs(a.x + 1300) ? b : a));
const HA: Pt = [HB.x + HB.w / 2, -HB.h * 0.62]; // 他的脚绳拴在这扇窗里
const HTOP = -8150; // 绳子到头：离白只差一点
const T_RISE0 = 39.45;
const T_SNAP = 41.013; // 绳子绷直（卡拍）
function heroAt(t: number): Pt {
  if (t < T_RISE0) return [HA[0] + 30, HA[1] - 40];
  if (t < T_SNAP) {
    const u = ph(t, T_RISE0, T_SNAP);
    return [HA[0] + 30 + 90 * u, mix(HA[1] - 40, HTOP, u ** 1.8)];
  }
  const s = t - T_SNAP;
  return [HA[0] + 120 + Math.sin(s * 3) * 8 * Math.exp(-s), HTOP - 50 * Math.exp(-s / 0.3) * Math.sin(s * 14) + Math.sin(t * 0.9) * 10 * (1 - Math.exp(-s))];
}
function heroFig(t: number) {
  const q = heroAt(t);
  const s = t - T_SNAP;
  const jerk = s > 0 ? Math.exp(-s / 0.22) : 0;
  const lookDown = s > 0 ? E.io(ph(t, T_SNAP + 0.1, T_SNAP + 0.35)) * (1 - E.io(ph(t, 41.5, 41.75))) : 0;
  const lookUp = E.io(ph(t, 41.5, 41.8));
  return {
    x: q[0],
    y: q[1],
    grounded: false,
    kind: "man" as const,
    facing: 1 as const,
    float: s > 0 ? 0.95 - 0.4 * jerk : 0.95,
    lean: 0.05 - 0.25 * jerk,
    aL: -2.6 + 1.6 * jerk + Math.sin(t * 1.3) * 0.1,
    aR: 2.6 - 1.4 * jerk + Math.sin(t * 1.1) * 0.1,
    legL: 0.15 + 0.4 * jerk,
    legR: -0.1 - 0.3 * jerk,
    kneeL: 0.3 + 0.6 * jerk,
    kneeR: 0.5,
    head: 0.75 - 1.3 * lookDown + 0.2 * lookUp,
    eyes: (s < 0 ? "closed" : s < 0.5 ? "wide" : "open") as "closed" | "wide" | "open",
    look: { top: "#9fc1e6", bottom: "#5f6f96" },
    tone: 0.05,
    rim: 0.9,
  };
}
// 他飘上去的那一条路上不放别人：先只看见他一个
for (let i = SL.length - 1; i >= 0; i--) if (Math.abs(SL[i].p[0] - HA[0] - 80) < 330 && SL[i].p[1] < HA[1]) SL.splice(i, 1); // 画面边上偶尔掠过别人（看得出他飞得多快）
for (const sl of SL) sl.t0 = 0; // 别人早就飘在那儿了，往后一拉才看见

// 网：每个人和离他最近的两三个人的绳子缠在一起
const LINKS: [number, number, number][] = [];
SL.forEach((s, i) => {
  const near = SL.map((o, j) => [j, Math.hypot(o.p[0] - s.p[0], o.p[1] - s.p[1])] as [number, number])
    .filter(([j, d]) => j !== i && d < 1300)
    .sort((x, y) => x[1] - y[1])
    .slice(0, 4);
  for (const [j, d] of near) if (j > i || !LINKS.some(([a, b]) => a === j && b === i)) LINKS.push([i, j, d]);
});
// 挣断绳子、飘进白里的人
const ESCAPES: [number, number][] = [
  [42.45, 3300],
  [43.3, -5200],
];

function sleeperAt(s: Sleeper, t: number): Pt {
  const e = E.out(ph(t, s.t0, s.t0 + 2.0));
  const bob = Math.sin(t * 0.9 + s.seed) * 14 * e;
  return [mix(s.a[0], s.p[0], e) + Math.sin(t * 0.6 + s.seed * 0.7) * 10 * e, mix(s.a[1], s.p[1], e) + bob];
}
const ankleOf = (s: Sleeper, q: Pt): Pt => [q[0] - s.face * 34, q[1] + 6];

// ---------- 镜头：贴着他往上走（他在画面下面，头顶慢慢露出白）；绳子绷直的一下镜头冲过头再落回来；
// 「困在一张没空隙的网」往后拉，越拉越远：他只是千千万万挂在网上的人里的一个 ----------
const S_HERO: Pt = [540, 1230];
const heroCam = (t: number): Cam => {
  const p = heroAt(t);
  const z = mix(1.9, 1.25, E.io(ph(t, T_RISE0, 40.6)));
  const over = t > T_SNAP ? 140 * Math.exp(-(t - T_SNAP) / 0.16) * Math.sin(Math.min(Math.PI, (t - T_SNAP) * 9)) : 0; // 冲过头
  return { x: p[0] - (S_HERO[0] - W / 2) / z, y: p[1] - (S_HERO[1] - H / 2) / z - over, z };
};
const K2: Cam = { x: 0, y: -5000, z: 0.2 }; // 整片天：上面是白，下面是楼顶，中间挂满了人的网
const K3: Cam = { x: 150, y: -5300, z: 0.15, r: 0.03 }; // 再退远一点：网一直铺到画外，整座城都挂在上面
export function webCam(t: number): Cam {
  if (t < T_NET) return heroCam(t);
  const k = camLerp(heroCam(T_NET), K2, E.io(ph(t, T_NET, 43.2)));
  return camLerp(k, K3, E.io(ph(t, 43.0, WEB_B)));
}

function buildings(c: C, k: Cam, night = 0.8) {
  c.fillStyle = blend("#b9aac4", "#4a4f86", night / 0.8);
  c.fillRect(-12000, 0, 24000, 6000);
  for (const b of BLDS) {
    c.fillStyle = blend(b.col, "#3a4180", 0.9 * night);
    c.fillRect(b.x - b.w / 2, -b.h, b.w, b.h);
    // 亮着的窗（夜里很少）
    c.fillStyle = PAL.lit;
    const step = 300;
    for (let y = -b.h + 120; y < -60; y += step) {
      const lit = (Math.sin(b.x * 0.013 + y * 0.07) + 1) / 2 > 0.82;
      if (lit) c.fillRect(b.x - 30, y, Math.max(40, 2 / k.z), Math.max(60, 3 / k.z));
    }
  }
}
function sleeperBody(c: C, s: Sleeper, q: Pt, t: number, k: Cam, alpha: number, awake = false) {
  if (k.z > 0.55) {
    figure(c, { x: q[0], y: q[1], grounded: false, kind: "plain", facing: s.face, lean: -1.5 * s.face, float: 0.9, legL: 1.6 * s.face, legR: 1.5 * s.face, kneeL: 0.2, kneeR: 0.3, aL: (Math.PI - 0.6) * s.face, aR: (Math.PI - 0.3) * s.face, head: awake ? 0.9 : 0.2, eyes: awake ? "wide" : "closed", look: crowdLook(s.seed), tone: 0.15, rim: 0.7, alpha }, t);
    return;
  }
  // 远了：一个横着的、发着光的小人影（屏幕上至少几个像素，看得见）
  const L = Math.max(120, 17 / k.z);
  const th = Math.max(24, 4.4 / k.z);
  c.save();
  c.globalAlpha = alpha;
  const g = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], L);
  g.addColorStop(0, "rgba(255,230,210,0.45)");
  g.addColorStop(1, "rgba(255,230,210,0)");
  c.fillStyle = g;
  c.fillRect(q[0] - L, q[1] - L, L * 2, L * 2);
  const look = crowdLook(s.seed);
  c.fillStyle = blend(look.top ?? "#c9b4d6", "#ffffff", 0.25);
  c.beginPath();
  c.ellipse(q[0] - (s.face * L) / 10, q[1], L / 2, th / 2, 0.05 * s.face, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "rgba(255,244,228,0.9)";
  c.lineWidth = th * 0.25;
  c.stroke();
  c.fillStyle = "#f4d6c6";
  c.beginPath();
  c.arc(q[0] + (s.face * L) / 2, q[1] - th * 0.2, th * 0.75, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** dawn：0 夜里；1 天亮（网上的人都把自己拽回楼里了，天褪成早晨）。cam 不给就用这一镜自己的镜头。
 *  noQin：窗里不画睡着的她（副歌二她已经出去了）；wake：网上离 (wake.x, wake.y) 不远的人睁开眼看着（她从他们中间飞过去） */
export function webDraw(c: C, t: number, o: { cam?: Cam; dawn?: number; noQin?: boolean; wake?: { x: number; y: number; r: number } } = {}) {
  const dawn = o.dawn ?? 0;
  const night = mix(0.8, 0.12, dawn);
  const k0 = o.cam ?? webCam(t);
  const k = jolt(k0, shake(t, 16 * kick(t, T_SNAP, 0.12), 4));
  sky(c, k, { night });
  whiteBand(c, k, t, 1.15);
  c.save();
  applyCam(c, k);
  buildings(c, k, night);
  // 她那栋楼，顶层是她的窗：防飘栏后面，她贴着天花板睡着
  tower(c, { night, qinWindow: 1, lights: 0.12 * (1 - dawn) });
  if (!o.noQin) {
    c.save();
    c.beginPath();
    c.rect(-140, TOWER_TOP + 70, 280, 170);
    c.clip();
    qin(c, { ...qinFloatSleep(t, 1), x: 15, y: TOWER_TOP + 96, s: 0.55, rim: 0, tone: 0.1 }, t);
    c.restore();
    c.fillStyle = "#6b5a6e";
    for (let i = 0; i <= 6; i++) c.fillRect(-140 + i * 46, TOWER_TOP + 70, 6, 170);
  }

  // 天亮：网上的人一个个顺着绳子把自己拽回楼里
  const back = SL.map((s, i) => E.io(clamp(dawn * 1.6 - (i % 9) * 0.07)));
  const pos = SL.map((s, i) => {
    const q = sleeperAt(s, t);
    return [mix(q[0], s.a[0], back[i]), mix(q[1], s.a[1], back[i])] as Pt;
  });
  const lw = Math.max(2.4, 2.1 / k.z) * (1 + 0.6 * kick(t, T_NET, 0.35));
  const red = blend("#d65a4c", "#ff8a6a", 0.6 * kick(t, T_NET, 0.5));
  c.lineCap = "round";
  // 每人的脚绳
  c.strokeStyle = red;
  c.lineWidth = lw;
  SL.forEach((s, i) => {
    if (t < s.t0) return;
    const an = ankleOf(s, pos[i]);
    c.globalAlpha = 0.9 * clamp((t - s.t0) * 4) * (1 - back[i]);
    c.beginPath();
    c.moveTo(s.a[0], s.a[1]);
    c.quadraticCurveTo((s.a[0] + an[0]) / 2 + 20, (s.a[1] + an[1]) / 2, an[0], an[1]);
    c.stroke();
  });
  // 缠成一张网：相邻的人的绳子绞在一起
  c.lineWidth = lw * 0.85;
  for (const [i, j, d] of LINKS) {
    const s = SL[i];
    const o = SL[j];
    const on = clamp((t - Math.max(s.t0, o.t0) - 0.7) / 0.6) * (1 - Math.max(back[i], back[j]));
    if (on <= 0) continue;
    const ai = ankleOf(s, pos[i]);
    const aj = ankleOf(o, pos[j]);
    // 从一个人绳子的半截，搭到另一个人绳子的半截，往下坠一点
    const mi: Pt = [mix(s.a[0], ai[0], 0.55), mix(s.a[1], ai[1], 0.55)];
    const mj: Pt = [mix(o.a[0], aj[0], 0.55), mix(o.a[1], aj[1], 0.55)];
    const end: Pt = [mix(mi[0], mj[0], on), mix(mi[1], mj[1], on)];
    c.globalAlpha = 0.75 * on;
    c.beginPath();
    c.moveTo(mi[0], mi[1]);
    c.quadraticCurveTo((mi[0] + end[0]) / 2, (mi[1] + end[1]) / 2 + d * 0.12 * on, end[0], end[1]);
    c.stroke();
    // 打结的地方
    if (on > 0.95 && k.z < 0.6) {
      c.fillStyle = red;
      c.beginPath();
      c.arc(mj[0], mj[1], lw * 1.3, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.globalAlpha = 1;
  // 睡着的人
  SL.forEach((s, i) => {
    if (t < s.t0) return;
    const awake = !!o.wake && Math.hypot(pos[i][0] - o.wake.x, pos[i][1] - o.wake.y) < o.wake.r;
    if (back[i] < 0.98) sleeperBody(c, s, pos[i], t, k, clamp((t - s.t0) * 3) * (1 - back[i]), awake);
  });
  // 他：脚绳从窗里一直拉到他脚踝；绷直以前是松的
  if (t >= T_RISE0 - 0.2 && t < 50 && dawn < 0.5) {
    const hf = heroFig(t);
    const hj = figure(c, hf, t);
    const taut = t > T_SNAP;
    c.strokeStyle = red;
    c.lineWidth = Math.max(3, 2.4 / k.z) * (taut ? 1 + 0.8 * Math.exp(-(t - T_SNAP) / 0.2) : 1);
    c.beginPath();
    c.moveTo(HA[0], HA[1]);
    const sag = taut ? 0 : 160 * (1 - ph(t, T_RISE0, T_SNAP));
    c.quadraticCurveTo((HA[0] + hj.anR[0]) / 2 + sag, (HA[1] + hj.anR[1]) / 2, hj.anR[0], hj.anR[1] + 4);
    c.stroke();
    // 往后拉的时候，他的绳子也被别人的绳子缠上
    const on = clamp((t - 42.0) / 0.6);
    if (on > 0) {
      const mid: Pt = [mix(HA[0], hj.anR[0], 0.55), mix(HA[1], hj.anR[1], 0.55)];
      const near = SL.map((o, j) => [j, Math.hypot(pos[j][0] - mid[0], pos[j][1] - mid[1])] as [number, number]).sort((x, y) => x[1] - y[1]).slice(0, 3);
      c.lineWidth = lw * 0.85;
      c.globalAlpha = 0.8 * on;
      for (const [j] of near) {
        const o = SL[j];
        const aj = ankleOf(o, pos[j]);
        const mj: Pt = [mix(o.a[0], aj[0], 0.55), mix(o.a[1], aj[1], 0.55)];
        const end: Pt = [mix(mid[0], mj[0], on), mix(mid[1], mj[1], on)];
        c.beginPath();
        c.moveTo(mid[0], mid[1]);
        c.quadraticCurveTo((mid[0] + end[0]) / 2, (mid[1] + end[1]) / 2 + 120 * on, end[0], end[1]);
        c.stroke();
      }
      c.globalAlpha = 1;
    }
  }
  // 挣断了绳子的人飘进白里
  for (const [at, x] of ESCAPES) farBurn(c, t, at, x, 2.6);
  c.restore();
  ash(c, t, k, { n: 0.5 });
  // 头顶的白在「网」那一句亮一下
  const glow = 0.25 * kick(t, T_NET, 0.6) + 0.12 * E.io(ph(t, 40.6, T_NET));
  if (glow > 0.01) {
    const g = c.createLinearGradient(0, 0, 0, H * 0.5);
    g.addColorStop(0, `rgba(255,250,240,${glow})`);
    g.addColorStop(1, "rgba(255,250,240,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }
  vignette(c, 0.35 * (1 - dawn));
}

/** 第一幕里的那一截（39.36–39.99） */
export const webShotA: Shot = { a: WEB_A, b: 39.99, xin: 0.3, draw: (c, t) => webDraw(c, t) };
/** 第二幕里的那一截（39.99–43.92） */
export const webShotB: Shot = { a: 39.99, b: WEB_B, draw: (c, t) => webDraw(c, t) };
