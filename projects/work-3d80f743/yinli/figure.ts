// 剪影人偶：按关节角度或手脚目标点（反向运动学）摆姿势，顶光勾一圈亮边。
import { type C, clamp, mix } from "./core";
import { PAL, LOOKS, blend, darker, type Look } from "./palette";
import type { QinStyle } from "./qin";

export type Kind = "qin" | "kid" | "man" | "woman" | "girl" | "old" | "weigher" | "worker" | "little" | "plain";
export type Pt = [number, number];

export interface Fig {
  x: number;
  y: number; // grounded 时是脚底，否则是胯部
  s?: number;
  kind?: Kind;
  grounded?: boolean;
  facing?: 1 | -1;
  lean?: number; // 躯干倾斜，正 = 往 +x 倒
  head?: number; // 抬头为正
  hL?: Pt;
  hR?: Pt;
  aL?: number; // 手臂角度：0 垂下，π/2 指向 +x，π 举过头顶
  aR?: number;
  bendL?: number;
  bendR?: number;
  fL?: Pt;
  fR?: Pt;
  legL?: number;
  legR?: number;
  kneeL?: number;
  kneeR?: number;
  float?: number; // 0..1：头发衣角往上飘、脚尖朝下
  boots?: boolean;
  barefoot?: boolean;
  tone?: number; // 0 墨黑（近）→ 1 雾灰（远）
  rim?: number;
  alpha?: number;
  eyes?: "open" | "closed" | "smile" | "wide";
  tears?: number;
  hair?: "bob" | "long" | "short" | "kid" | "bald" | "cap";
  coat?: number; // 衣摆：0 到腰，1 到膝
  stone?: number; // 胸前挂着的小砖（她送的），值是暖光强度
  bell?: boolean;
  tie?: boolean;
  lock?: boolean; // 脚踝上锁着的灰锭
  bag?: boolean; // 手里的公文包（右手）
  broom?: number; // 扫帚：右手里，值是扫帚角度
  umbrella?: boolean; // 撑伞（左手）
  headScale?: number;
  warm?: number; // 身上被暖光照到
  look?: Partial<Look>; // 换衣服颜色
  umbrellaColor?: string;
  ink?: number; // 描边浓度
  ct?: QinStyle; // 秤砣换成素材库角色以后（qin.ts）另加的：表情、手形、手里的东西
}

export interface Joints {
  hip: Pt;
  neck: Pt;
  head: Pt;
  headR: number;
  shL: Pt;
  shR: Pt;
  elL: Pt;
  elR: Pt;
  handL: Pt;
  handR: Pt;
  knL: Pt;
  knR: Pt;
  anL: Pt;
  anR: Pt;
  toeL: Pt;
  toeR: Pt;
  top: number; // 头顶 y
}

const PRESET: Record<Kind, Partial<Fig>> = {
  qin: { hair: "bob", boots: true, coat: 0.78 },
  kid: { s: 0.6, headScale: 1.38, hair: "kid", coat: 0.3, bell: true },
  man: { hair: "short", coat: 0.35, tie: true },
  woman: { hair: "long", coat: 0.85 },
  girl: { s: 0.94, hair: "long", coat: 0.72 },
  old: { s: 0.95, hair: "bald", coat: 0.6, lean: 0.12 },
  weigher: { s: 1.08, hair: "cap", coat: 0.7, boots: true },
  worker: { hair: "cap", coat: 0.3 },
  little: { s: 0.6, headScale: 1.35, hair: "bob", coat: 0.6 },
  plain: { hair: "short", coat: 0.5 },
};

const L = { torso: 58, upper: 29, fore: 27, thigh: 42, shin: 41, head: 13, neck: 7 };

function ik(a: Pt, t: Pt, l1: number, l2: number, bend: number): [Pt, Pt] {
  let dx = t[0] - a[0];
  let dy = t[1] - a[1];
  let d = Math.hypot(dx, dy) || 1e-6;
  const max = l1 + l2 - 0.01;
  if (d > max) {
    dx *= max / d;
    dy *= max / d;
    d = max;
  }
  const ang = Math.atan2(dy, dx);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const el: Pt = [a[0] + Math.cos(ang + bend * A) * l1, a[1] + Math.sin(ang + bend * A) * l1];
  return [el, [a[0] + dx, a[1] + dy]];
}
const dir = (a: number, len: number): Pt => [Math.sin(a) * len, Math.cos(a) * len];
const add = (p: Pt, q: Pt): Pt => [p[0] + q[0], p[1] + q[1]];

/** 只算关节位置（不画），用来把绳子、手接到别的东西上 */
export function pose(f0: Fig): Joints {
  const f = { ...PRESET[f0.kind ?? "plain"], ...f0 };
  const s = f.s ?? 1;
  const fa = f.facing ?? 1;
  const fl = f.float ?? 0;
  const solve = (hip: Pt) => {
    const lean = f.lean ?? 0;
    const neck = add(hip, [Math.sin(lean) * L.torso * s, -Math.cos(lean) * L.torso * s]);
    const hs = f.headScale ?? 1;
    const hr = L.head * s * hs;
    const headA = lean - (f.head ?? 0) * fa * 0.35;
    const head = add(neck, [Math.sin(headA) * (L.neck * s + hr), -Math.cos(headA) * (L.neck * s + hr)]);
    const px = Math.cos(lean);
    const py = Math.sin(lean);
    const shL: Pt = [neck[0] - px * 9 * s, neck[1] - py * 9 * s + 4 * s];
    const shR: Pt = [neck[0] + px * 9 * s, neck[1] + py * 9 * s + 4 * s];
    const hpL: Pt = [hip[0] - px * 6 * s, hip[1] - py * 6 * s];
    const hpR: Pt = [hip[0] + px * 6 * s, hip[1] + py * 6 * s];
    const arm = (sh: Pt, target: Pt | undefined, ang: number | undefined, bend: number | undefined, side: number): [Pt, Pt] => {
      if (target) return ik(sh, target, L.upper * s, L.fore * s, side > 0 ? -1 : 1);
      const a = ang ?? side * (0.12 + fl * 0.5);
      const b = bend ?? -side * 0.25;
      const el = add(sh, dir(a, L.upper * s));
      return [el, add(el, dir(a + b, L.fore * s))];
    };
    const [elL, handL] = arm(shL, f.hL, f.aL, f.bendL, -1);
    const [elR, handR] = arm(shR, f.hR, f.aR, f.bendR, 1);
    const leg = (hp: Pt, target: Pt | undefined, ang: number | undefined, knee: number | undefined, side: number): [Pt, Pt] => {
      if (target) return ik(hp, target, L.thigh * s, L.shin * s, fa > 0 ? 1 : -1);
      const g = ang ?? side * 0.05 + fl * side * 0.12;
      const k = knee ?? fl * 0.5;
      const kn = add(hp, dir(g, L.thigh * s));
      return [kn, add(kn, dir(g - k * fa, L.shin * s))];
    };
    const [knL, anL] = leg(hpL, f.fL, f.legL, f.kneeL, -1);
    const [knR, anR] = leg(hpR, f.fR, f.legR, f.kneeR, 1);
    const footLen = (f.boots && !f.barefoot ? 30 : 19) * s;
    const toeA = fl * 1.1; // 飘起来时脚尖朝下
    const toe = (an: Pt): Pt => [an[0] + fa * Math.cos(toeA) * footLen, an[1] + Math.sin(toeA) * footLen * 0.9 + 5 * s];
    return { hip, neck, head, headR: hr, shL, shR, elL, elR, handL, handR, knL, knR, anL, anR, toeL: toe(anL), toeR: toe(anR), top: head[1] - hr };
  };
  if (f.grounded === false) return solve([f.x, f.y]);
  const probe = solve([0, 0]);
  const bootH = f.boots && !f.barefoot ? 13 : 6;
  const low = Math.max(probe.anL[1], probe.anR[1]) + bootH * s;
  return solve([f.x, f.y - low]);
}

type Pass = "rim" | "outline" | "color" | "tint";
const SKIRT = new Set<Kind>(["qin", "woman", "girl", "little"]);

function limb(c: C, pts: Pt[], w: number, ox: number, oy: number) {
  c.lineWidth = w;
  c.beginPath();
  c.moveTo(pts[0][0] + ox, pts[0][1] + oy);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0] + ox, pts[i][1] + oy);
  c.stroke();
}
function dot(c: C, p: Pt, r: number, ox: number, oy: number) {
  c.beginPath();
  c.arc(p[0] + ox, p[1] + oy, r, 0, Math.PI * 2);
  c.fill();
}

/** 画一遍身体。pass：rim 顶光、outline 描边（加粗）、color 上色、tint 暖光罩色 */
function body(c: C, f: Fig, j: Joints, L: Look, pass: Pass, t: number) {
  const s = f.s ?? 1;
  const fa = f.facing ?? 1;
  const fl = f.float ?? 0;
  const ow = pass === "outline" ? 3.4 * s : 0;
  const oy = pass === "rim" ? -2.6 * s : 0;
  const ox = 0;
  const solid = pass === "rim" ? "#fff4e4" : pass === "outline" ? PAL.ink : pass === "tint" ? PAL.warm : "";
  const pick = (col: string) => solid || col;
  const set = (col: string) => {
    c.fillStyle = pick(col);
    c.strokeStyle = pick(col);
  };
  const fillShape = () => {
    c.fill();
    if (ow > 0) {
      c.lineWidth = ow;
      c.stroke();
    }
  };
  c.lineCap = "round";
  c.lineJoin = "round";
  const skirt = SKIRT.has(f.kind ?? "plain") || !!f.look?.legs;
  const legCol = skirt ? (L.legs ?? darker(L.bottom, 0.35)) : L.bottom;
  // 后面的腿和手
  set(legCol);
  limb(c, [j.hip, j.knL, j.anL], 12 * s + ow, ox, oy);
  set(L.top);
  limb(c, [j.shL, j.elL, j.handL], 8.5 * s + ow, ox, oy);
  set(L.skin);
  dot(c, j.handL, 4.6 * s + ow / 2, ox, oy);
  // 躯干
  const lean = f.lean ?? 0;
  const px = Math.cos(lean);
  const py = Math.sin(lean);
  const sw = 15 * s;
  const hw = 12 * s;
  set(L.top);
  c.beginPath();
  c.moveTo(j.neck[0] - px * sw + ox, j.neck[1] - py * sw + 5 * s + oy);
  c.lineTo(j.neck[0] + px * sw + ox, j.neck[1] + py * sw + 5 * s + oy);
  c.lineTo(j.hip[0] + px * hw + ox, j.hip[1] + py * hw + oy);
  c.lineTo(j.hip[0] - px * hw + ox, j.hip[1] - py * hw + oy);
  c.closePath();
  c.fill();
  c.lineWidth = 7 * s + ow;
  c.stroke();
  // 衣摆 / 裙子（飘起来时往上翻）
  const coat = f.coat ?? 0.4;
  if (coat > 0.05) {
    set(skirt ? L.bottom : L.top);
    const len = coat * 50 * s;
    const lift = fl * 1.5;
    const wav = Math.sin(t * 5 + j.hip[0] * 0.01) * fl * 6 * s;
    const hy = j.hip[1] + len * (1 - lift) + oy;
    const flare = (16 + coat * 8 + fl * 12) * s;
    c.beginPath();
    c.moveTo(j.hip[0] - px * 13 * s + ox, j.hip[1] - py * 13 * s - 6 * s + oy);
    c.lineTo(j.hip[0] + px * 13 * s + ox, j.hip[1] + py * 13 * s - 6 * s + oy);
    c.quadraticCurveTo(j.hip[0] + flare + ox, hy - len * 0.2 * (1 - lift), j.hip[0] + flare * 0.9 + wav + ox, hy);
    c.lineTo(j.hip[0] - flare * 0.9 + wav + ox, hy);
    c.quadraticCurveTo(j.hip[0] - flare + ox, hy - len * 0.2 * (1 - lift), j.hip[0] - px * 13 * s + ox, j.hip[1] - 6 * s + oy);
    c.closePath();
    fillShape();
  }
  // 脖子和头
  set(L.skin);
  limb(c, [j.neck, [mix(j.neck[0], j.head[0], 0.5), mix(j.neck[1], j.head[1], 0.5)]], 8 * s + ow, ox, oy);
  const hr = j.headR;
  const hx = j.head[0] + ox;
  const hy = j.head[1] + oy;
  c.beginPath();
  c.arc(hx, hy, hr, 0, Math.PI * 2);
  fillShape();
  if (pass === "color") face(c, f, j, L, t);
  // 头发
  const hair = f.hair ?? "short";
  set(hair === "cap" ? (L.cap ?? L.hair) : L.hair);
  if (hair === "bob" || hair === "long") {
    const long = hair === "long" ? 1.9 : 1.05;
    const sway = Math.sin(t * 3.1 + hx * 0.01) * fl * 0.25;
    c.beginPath();
    c.arc(hx, hy - hr * 0.1, hr * 1.12, Math.PI * 0.95, Math.PI * 2.05);
    for (const side of [-1, 1]) {
      const bx = hx + side * hr * 1.08;
      const by = hy + hr * 0.1;
      const ty = by + hr * long * (1 - 2.3 * fl);
      const tx = bx + side * hr * (0.25 + fl * 0.9) + sway * hr * 3;
      c.moveTo(bx, by - hr * 0.6);
      c.quadraticCurveTo(bx + side * hr * 0.35, mix(by, ty, 0.5), tx, ty);
      c.lineTo(bx - side * hr * 0.45, by);
    }
    fillShape();
    c.lineWidth = hr * 0.5 + ow;
    c.beginPath();
    for (const side of [-1, 1]) {
      const bx = hx + side * hr * 0.95;
      c.moveTo(bx, hy - hr * 0.4);
      c.quadraticCurveTo(bx + side * hr * (0.3 + fl * 0.4), hy + hr * long * 0.5 * (1 - 2.3 * fl), bx + side * hr * (0.2 + fl), hy + hr * long * (1 - 2.4 * fl));
    }
    c.stroke();
    // 刘海
    c.beginPath();
    c.ellipse(hx + fa * hr * 0.15, hy - hr * 0.55, hr * 0.95, hr * 0.42, -fa * 0.15, 0, Math.PI * 2);
    c.fill();
  } else if (hair === "kid") {
    c.beginPath();
    c.arc(hx, hy - hr * 0.15, hr * 1.06, Math.PI * 0.9, Math.PI * 2.1);
    fillShape();
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(hx + i * hr * 0.35 - hr * 0.15, hy - hr * 0.9);
      c.lineTo(hx + i * hr * 0.4, hy - hr * (1.35 + fl * 0.4));
      c.lineTo(hx + i * hr * 0.35 + hr * 0.15, hy - hr * 0.9);
      fillShape();
    }
  } else if (hair === "cap") {
    c.beginPath();
    c.ellipse(hx, hy - hr * 0.55, hr * 1.15, hr * 0.62, 0, Math.PI, Math.PI * 2);
    fillShape();
    c.beginPath();
    c.rect(hx - hr * (fa > 0 ? 0.3 : 1.7), hy - hr * 0.62, hr * 2, hr * 0.22);
    fillShape();
  } else if (hair === "short") {
    c.beginPath();
    c.arc(hx, hy - hr * 0.12, hr * 1.07, Math.PI * 0.95, Math.PI * 2.05);
    fillShape();
  } else if (hair === "bald") {
    for (const side of [-1, 1]) {
      c.beginPath();
      c.ellipse(hx + side * hr * 0.9, hy - hr * 0.05, hr * 0.32, hr * 0.42, 0, 0, Math.PI * 2);
      fillShape();
    }
  }
  // 前面的腿
  set(legCol);
  limb(c, [j.hip, j.knR, j.anR], 12 * s + ow, ox, oy);
  // 鞋 / 靴 / 光脚
  for (const [an, toe] of [
    [j.anL, j.toeL],
    [j.anR, j.toeR],
  ] as [Pt, Pt][]) {
    if (f.barefoot) {
      set(L.skin);
      limb(c, [an, toe], 6 * s + ow, ox, oy);
    } else if (f.boots) {
      set(f.kind === "qin" ? "#5d3f34" : L.shoe);
      const bh = 15 * s;
      c.beginPath();
      c.moveTo(an[0] - fa * 9 * s + ox, an[1] - bh * 1.5 + oy);
      c.lineTo(an[0] + fa * 9 * s + ox, an[1] - bh * 1.5 + oy);
      c.lineTo(an[0] + fa * 10 * s + ox, an[1] + oy);
      c.quadraticCurveTo(toe[0] + fa * 4 * s + ox, toe[1] - 9 * s + oy, toe[0] + fa * 2 * s + ox, toe[1] + 3 * s + oy);
      c.lineTo(an[0] - fa * 11 * s + ox, toe[1] + 4 * s + oy);
      c.closePath();
      fillShape();
    } else {
      set(L.shoe);
      limb(c, [an, toe], 8.5 * s + ow, ox, oy);
    }
  }
  // 前面的手
  set(L.top);
  limb(c, [j.shR, j.elR, j.handR], 8.5 * s + ow, ox, oy);
  set(L.skin);
  dot(c, j.handR, 4.6 * s + ow / 2, ox, oy);
  // 围巾 / 领带
  if (L.accent && (f.kind === "qin" || f.kind === "kid")) {
    set(L.accent);
    const nx = j.neck[0] + ox;
    const ny = j.neck[1] + 4 * s + oy;
    limb(c, [[nx - 9 * s, ny], [nx + 9 * s, ny]], 6 * s + ow, 0, 0);
    const wav = Math.sin(t * 6 + nx * 0.02) * (3 + fl * 6) * s;
    const up = fl > 0.3 ? -1 : 1;
    limb(c, [[nx - fa * 6 * s, ny], [nx - fa * 14 * s + wav, ny + up * 16 * s], [nx - fa * 20 * s - wav, ny + up * 26 * s]], 5 * s + ow, 0, 0);
  }
  if (f.tie) {
    set(L.accent ?? "#3a72d8");
    const up = fl > 0.3;
    const tx = j.neck[0] + ox + fa * 2 * s;
    const ty = j.neck[1] + 6 * s + oy;
    const wav = Math.sin(t * 7 + tx) * 5 * s * fl;
    // 飘起来时领带往后飘过肩膀（不要盖在脸上）
    const end: Pt = up ? [tx - fa * 20 * s * fl + wav, ty + (1 - fl) * 26 * s - 10 * s * fl] : [tx + wav, ty + 26 * s];
    limb(c, [[tx, ty], end], 4.5 * s + ow, 0, 0);
  }
  if (f.bag) {
    set("#8a5a3e");
    const h = j.handR;
    c.beginPath();
    c.rect(h[0] - 13 * s + ox, h[1] + 3 * s + oy, 26 * s, 19 * s);
    fillShape();
  }
  if (f.broom !== undefined) {
    const h = j.handR;
    const a = f.broom;
    const e: Pt = [h[0] + Math.sin(a) * 120 * s, h[1] + Math.cos(a) * 120 * s];
    const b: Pt = [h[0] - Math.sin(a) * 40 * s, h[1] - Math.cos(a) * 40 * s];
    set(PAL.wood);
    limb(c, [b, e], 4 * s + ow, ox, oy);
    set("#e2c27a");
    c.beginPath();
    const nx = Math.cos(a);
    const ny = -Math.sin(a);
    c.moveTo(e[0] + nx * 4 * s + ox, e[1] + ny * 4 * s + oy);
    c.lineTo(e[0] + Math.sin(a) * 34 * s + nx * 16 * s + ox, e[1] + Math.cos(a) * 34 * s + ny * 16 * s + oy);
    c.lineTo(e[0] + Math.sin(a) * 34 * s - nx * 16 * s + ox, e[1] + Math.cos(a) * 34 * s - ny * 16 * s + oy);
    c.lineTo(e[0] - nx * 4 * s + ox, e[1] - ny * 4 * s + oy);
    c.closePath();
    fillShape();
  }
  if (f.umbrella) {
    const h = j.handL;
    set("#5a4a4a");
    limb(c, [h, [h[0] + 4 * s, h[1] - 62 * s]], 2.5 * s + ow, ox, oy);
    set(f.umbrellaColor ?? "#e65a4f");
    c.beginPath();
    c.ellipse(h[0] + 4 * s + ox, h[1] - 58 * s + oy, 44 * s, 24 * s, 0, Math.PI, Math.PI * 2);
    c.closePath();
    fillShape();
  }
  if (f.lock) {
    set("#5b6075");
    const a = j.anL;
    c.beginPath();
    c.rect(a[0] - 11 * s + ox, a[1] + 2 * s + oy, 22 * s, 13 * s);
    fillShape();
  }
}

/** 脸：眼睛、腮红、嘴（头在画面上太小时不画） */
function face(c: C, f: Fig, j: Joints, L: Look, t: number) {
  const m = c.getTransform();
  const hr = j.headR;
  if (hr * Math.hypot(m.a, m.b) < 5) return;
  const fa = f.facing ?? 1;
  const ex = j.head[0] + fa * hr * 0.2;
  const ey = j.head[1] + hr * 0.12 - (f.head ?? 0) * hr * 0.12;
  const eyes = f.eyes ?? "open";
  c.save();
  // 腮红
  c.fillStyle = "rgba(240,120,130,0.35)";
  for (const side of [-1, 1]) {
    c.beginPath();
    c.ellipse(ex + side * hr * 0.5, ey + hr * 0.3, hr * 0.18, hr * 0.1, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "#2c2233";
  c.strokeStyle = "#2c2233";
  c.lineWidth = Math.max(0.8, hr * 0.1);
  c.lineCap = "round";
  for (const side of [-1, 1]) {
    const x = ex + side * hr * 0.36;
    c.beginPath();
    if (eyes === "open" || eyes === "wide") {
      const ry = hr * (eyes === "wide" ? 0.19 : 0.14);
      c.ellipse(x, ey, hr * (eyes === "wide" ? 0.13 : 0.1), ry, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#ffffff";
      c.beginPath();
      c.arc(x + hr * 0.035, ey - ry * 0.4, hr * 0.04, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#2c2233";
    } else if (eyes === "closed") {
      c.moveTo(x - hr * 0.15, ey);
      c.quadraticCurveTo(x, ey + hr * 0.1, x + hr * 0.15, ey);
      c.stroke();
    } else {
      c.moveTo(x - hr * 0.15, ey + hr * 0.04);
      c.quadraticCurveTo(x, ey - hr * 0.12, x + hr * 0.15, ey + hr * 0.04);
      c.stroke();
    }
  }
  // 嘴
  c.beginPath();
  const mx = ex;
  const my = ey + hr * 0.42;
  if (eyes === "smile") {
    c.moveTo(mx - hr * 0.16, my - hr * 0.03);
    c.quadraticCurveTo(mx, my + hr * 0.14, mx + hr * 0.16, my - hr * 0.03);
    c.stroke();
  } else if (eyes === "wide") {
    c.ellipse(mx, my, hr * 0.06, hr * 0.08, 0, 0, Math.PI * 2);
    c.fill();
  } else {
    c.moveTo(mx - hr * 0.08, my);
    c.lineTo(mx + hr * 0.08, my);
    c.stroke();
  }
  if (f.tears) {
    c.fillStyle = `rgba(150,200,240,${0.85 * clamp(f.tears)})`;
    for (const side of [-1, 1]) {
      const k = (t * 0.7 + (side > 0 ? 0.4 : 0)) % 1;
      c.beginPath();
      c.ellipse(ex + side * hr * 0.38, ey + hr * (0.2 + k * 0.6), hr * 0.06, hr * 0.1, 0, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
  void L;
}

/** 远近：越远越融进天色 */
function hazeLook(L: Look, tone: number): Look {
  if (tone <= 0.01) return L;
  const k = tone * 0.8;
  const h = (x: string) => blend(x, PAL.haze, k);
  return { ...L, skin: h(L.skin), hair: h(L.hair), top: h(L.top), bottom: h(L.bottom), shoe: h(L.shoe), legs: L.legs ? h(L.legs) : undefined, accent: L.accent ? h(L.accent) : undefined, cap: L.cap ? h(L.cap) : undefined };
}

/** 画一个人。返回关节位置 */
export function figure(c: C, f0: Fig, t = 0): Joints {
  const f = { ...PRESET[f0.kind ?? "plain"], ...f0 };
  const j = pose(f);
  const s = f.s ?? 1;
  const alpha = f.alpha ?? 1;
  if (alpha <= 0.003) return j;
  const tone = f.tone ?? 0;
  const L = hazeLook({ ...LOOKS[f.kind ?? "plain"], ...(f.look ?? {}) } as Look, tone);
  c.save();
  c.globalAlpha *= alpha;
  const rim = f.rim ?? 0.55;
  if (rim > 0) {
    c.save();
    c.globalAlpha *= rim * 0.55;
    body(c, f, j, L, "rim", t);
    c.restore();
  }
  c.save();
  c.globalAlpha *= (f.ink ?? 0.85) * (1 - tone * 0.7);
  body(c, f, j, L, "outline", t);
  c.restore();
  body(c, f, j, L, "color", t);
  if (f.warm) {
    c.save();
    c.globalAlpha *= clamp(f.warm) * 0.3;
    body(c, f, j, L, "tint", t);
    c.restore();
  }
  // 胸前挂着的小砖
  if (f.stone !== undefined) {
    const p: Pt = [mix(j.neck[0], j.hip[0], 0.32), mix(j.neck[1], j.hip[1], 0.32)];
    c.strokeStyle = "#8a6a5a";
    c.lineWidth = 1.2 * s;
    c.beginPath();
    c.moveTo(j.neck[0] - 6 * s, j.neck[1] + 3 * s);
    c.lineTo(p[0], p[1]);
    c.lineTo(j.neck[0] + 6 * s, j.neck[1] + 3 * s);
    c.stroke();
    glowDot(c, p[0], p[1] + 3 * s, 4.5 * s, f.stone);
  }
  if (f.bell) {
    const a = j.anR;
    c.fillStyle = "#f2c64a";
    c.beginPath();
    c.arc(a[0] + 4 * s, a[1] - 4 * s, 3.4 * s, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  return j;
}

/** 一个暖光点：胸前挂着、手里攥着的小砖（被人放在心上的东西） */
export function glowDot(c: C, x: number, y: number, r: number, warm: number) {
  c.save();
  const k = clamp(warm);
  if (k > 0.01) {
    const g = c.createRadialGradient(x, y, 0, x, y, r * 5);
    g.addColorStop(0, `rgba(255,190,110,${0.55 * k})`);
    g.addColorStop(1, "rgba(255,170,90,0)");
    c.fillStyle = g;
    c.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
  }
  c.fillStyle = blend("#d8c9c6", "#ec9a6c", k);
  c.strokeStyle = PAL.ink;
  c.lineWidth = Math.max(0.6, r * 0.18);
  c.beginPath();
  c.rect(x - r, y - r * 0.6, r * 2, r * 1.2);
  c.fill();
  c.stroke();
  c.restore();
}

/** 一块写了字的砖（她靴子里装的就是这个）。warm 0..1：别人送你的会变暖、发光；她写给自己的是灰白的。
 *  r 约等于半宽；字里有「，」时分两行 */
export function stone(c: C, x: number, y: number, r: number, words: string, warm = 0, rot = -0.08, ink = "#1d2a44") {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  const k = clamp(warm);
  const w = r * 2.05;
  const h = r * 1.18;
  const d = r * 0.2;
  if (k > 0.01) {
    const g = c.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.8);
    g.addColorStop(0, `rgba(255,186,105,${0.55 * k})`);
    g.addColorStop(1, "rgba(255,170,90,0)");
    c.fillStyle = g;
    c.fillRect(-r * 3, -r * 3, r * 6, r * 6);
  }
  c.lineJoin = "round";
  c.strokeStyle = PAL.ink;
  c.lineWidth = Math.max(0.8, r * 0.045);
  const face = blend("#d8c9c6", "#ec9a6c", k);
  // 顶面和侧面：有一点厚度，看得出是砖
  c.fillStyle = blend("#ece2df", "#f6bb90", k);
  c.beginPath();
  c.moveTo(-w / 2, -h / 2);
  c.lineTo(-w / 2 + d, -h / 2 - d * 0.75);
  c.lineTo(w / 2 + d, -h / 2 - d * 0.75);
  c.lineTo(w / 2, -h / 2);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = blend("#b4a3a6", "#c46a48", k);
  c.beginPath();
  c.moveTo(w / 2, -h / 2);
  c.lineTo(w / 2 + d, -h / 2 - d * 0.75);
  c.lineTo(w / 2 + d, h / 2 - d * 0.75);
  c.lineTo(w / 2, h / 2);
  c.closePath();
  c.fill();
  c.stroke();
  const g2 = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  g2.addColorStop(0, blend(face, "#ffffff", 0.18));
  g2.addColorStop(1, blend(face, "#6b4a5a", 0.12));
  c.fillStyle = g2;
  c.beginPath();
  c.rect(-w / 2, -h / 2, w, h);
  c.fill();
  c.stroke();
  // 砖面上的小坑
  if (r > 20) {
    c.fillStyle = blend(face, "#6b4a5a", 0.2);
    for (const [px, py, pr] of [
      [-0.36, 0.3, 0.05],
      [0.31, -0.28, 0.04],
      [0.4, 0.33, 0.03],
      [-0.2, -0.36, 0.03],
    ]) {
      c.beginPath();
      c.ellipse(px * w, py * h, pr * w, pr * w * 0.7, 0, 0, Math.PI * 2);
      c.fill();
    }
  }
  if (words) {
    const cut = words.indexOf("，");
    const lines = cut >= 0 ? [words.slice(0, cut + 1), words.slice(cut + 1)].filter((l) => l) : [words];
    const longest = Math.max(1, ...lines.map((l) => l.length));
    const size = Math.min((w * 0.8) / longest, h * (lines.length > 1 ? 0.36 : 0.58));
    c.font = `600 ${size}px "YinliSerif", "Noto Serif CJK SC", serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = ink;
    lines.forEach((l, i) => c.fillText(l, 0, (i - (lines.length - 1) / 2) * size * 1.12 + h * 0.02));
  }
  c.restore();
}

/** 一根绳子：两点之间下垂（sag 为正往下坠，负数往上飘） */
export function rope(c: C, a: Pt, b: Pt, sag: number, w = 3, color = "#d65a4c") {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = w;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(a[0], a[1]);
  c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag, b[0], b[1]);
  c.stroke();
  c.restore();
}

/** 走路：给步频相位，返回两条腿的角度和膝盖弯曲、身体起伏 */
export function walk(p: number, stride = 0.42) {
  const a = Math.sin(p * Math.PI * 2);
  const b = Math.sin(p * Math.PI * 2 + Math.PI);
  return {
    legL: a * stride,
    legR: b * stride,
    kneeL: Math.max(0, -Math.cos(p * Math.PI * 2)) * 0.7,
    kneeR: Math.max(0, Math.cos(p * Math.PI * 2)) * 0.7,
    aL: -a * 0.35 * 0.0 - b * 0.4,
    aR: -a * 0.4,
    bob: Math.abs(Math.cos(p * Math.PI * 2)) * 3,
  };
}
