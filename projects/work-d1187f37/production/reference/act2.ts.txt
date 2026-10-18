import type { SceneOptions } from "../../../src/engine/types";
import { clamp, phase, smooth } from "../../../src/engine/math";
import { C, Ctx, F, H, Pt, W, addBlob, backOut, beatAt, camera, card, designScene, easeIn, easeOut, fillBg, flash, glow, paint, poly, pulse, rbox, shake, text } from "./lib/draw";
import { drawKid } from "./lib/kid";
import { CAST, Person, drawPerson, hahas } from "./lib/people";
import { feedScreen, lockScreen, phone } from "./lib/phone";
import { bedroom, lightPool } from "./lib/sets";

/** ACT 2 (16.96 – 33.39s): the drop. A day of "no friends" as a beat-cut montage. */
const T0 = beatAt(32); // 16.96
const B = beatAt(40); // 21.13
const Cc = beatAt(48); // 25.31
const D = beatAt(56); // 29.48
const END = 33.386;

const CROWD: Person[] = [CAST.a, CAST.b, CAST.c, CAST.d, CAST.e, CAST.jie, CAST.monitor, CAST.yu];

function rays(ctx: Ctx, cx: number, cy: number, abs: number, a: string, b: string) {
  fillBg(ctx, a);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(abs * 0.25);
  ctx.fillStyle = b;
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 2400, (i / 14) * Math.PI * 2, ((i + 0.5) / 14) * Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function stamp(ctx: Ctx, s: string, x: number, y: number, at: number, abs: number, size: number, color: string, rot: number) {
  if (abs < at) return;
  const k = backOut(phase(abs, at, at + 0.16));
  const sc = 1.8 - 0.8 * k;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(sc, sc);
  ctx.globalAlpha *= clamp(k * 1.5);
  text(ctx, s, 0, 0, { size, font: F.marker, fill: color, stroke: C.ink, lw: 16 });
  ctx.restore();
}

function shotNoFriends(ctx: Ctx, abs: number) {
  const p = pulse(abs);
  ctx.save();
  camera(ctx, 540, 900, 1.02 + 0.03 * p);
  rays(ctx, 540, 900, abs, "#1d3b8f", "#24479f");
  // the crowd orbits him; nobody looks at him
  const n = 8;
  const items: { x: number; y: number; z: number; p: Person; a: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (abs - T0) * 0.7;
    items.push({ a, p: CROWD[i], x: 540 + Math.cos(a) * 400, y: 720 + Math.sin(a) * 120, z: Math.sin(a) });
  }
  items.sort((u, v) => u.z - v.z);
  const back = items.filter((it) => it.z < 0);
  const front = items.filter((it) => it.z >= 0);
  for (const it of back)
    drawPerson(ctx, it.x, it.y, 0.48 + it.z * 0.08, { ...it.p, walk: abs * 8 + it.a, legs: "walk", arms: "phone", turn: Math.cos(it.a) > 0 ? 0.7 : -0.7 });
  drawKid(ctx, 540, 640, 0.62, { body: "full", eyes: "sleepy", mouth: "frown", look: [Math.sin(abs * 1.5) * 0.7, 0], headY: -p * 6 });
  for (const it of front)
    drawPerson(ctx, it.x, it.y + 40, 0.56 + it.z * 0.1, { ...it.p, walk: abs * 8 + it.a, legs: "walk", arms: "phone", turn: Math.cos(it.a) > 0 ? 0.7 : -0.7 });
  ctx.restore();
  // words slam on the sung syllables
  const L = 17.036;
  stamp(ctx, "I HAVE", 330, 420, L + 1.44, abs, 120, "#fff", -0.08);
  stamp(ctx, "NO", 750, 410, L + 1.96, abs, 170, "#ff4d5a", 0.06);
  stamp(ctx, "FRIENDS", 540, 560, L + 2.257, abs, 170, "#ffe45c", -0.03);
  stamp(ctx, "& I'M SO ALONE", 540, 1180, L + 2.76, abs, 80, "#fff", 0.02);
  flash(ctx, 0.85 * (1 - phase(abs, T0, T0 + 0.18)));
}

const CHECKS: { time: string; n: number; bg: [string, string]; label: string }[] = [
  { time: "08:03", n: 1, bg: ["#ffd98a", "#ffeec4"], label: "早上" },
  { time: "12:30", n: 12, bg: ["#9fd4f5", "#e6f5ff"], label: "中午" },
  { time: "17:45", n: 25, bg: ["#f59a5c", "#ffd0a8"], label: "傍晚" },
  { time: "21:16", n: 37, bg: ["#28306b", "#4b3f86"], label: "晚上" },
];
function shotChecks(ctx: Ctx, abs: number) {
  const i = Math.min(3, Math.floor((abs - B) / (2 * (60 / 115))));
  const c = CHECKS[i];
  const at = B + i * 2 * (60 / 115);
  const k = easeOut(phase(abs, at, at + 0.2));
  const p = pulse(abs);
  fillBg(ctx, c.bg[0]);
  glow(ctx, 540, 760, 900, c.bg[1], 0.8);
  ctx.save();
  camera(ctx, 540, 800, 1.06 - 0.06 * k + 0.02 * p, (i % 2 ? 1 : -1) * 0.02 * (1 - k));
  phone(ctx, 540, 790, 0.66, (i % 2 ? 0.04 : -0.04), (cx) => {
    lockScreen(cx, { time: c.time, airplane: true, battery: 0.9 - i * 0.22 }, { note: "0 条新消息" });
  });
  ctx.restore();
  // check counter sticker
  ctx.save();
  ctx.translate(820, 380);
  ctx.rotate(0.12);
  const bk = backOut(phase(abs, at + 0.05, at + 0.25));
  ctx.scale(bk, bk);
  text(ctx, `第${c.n}次查看`, 0, 0, { size: 64, font: F.cn, fill: "#fff", stroke: C.ink, lw: 12 });
  ctx.restore();
  card(ctx, `${c.label} ${c.time}`, 70, 330, 1, 40);
  if (abs - at < 0.1) flash(ctx, 0.5 * (1 - (abs - at) / 0.1));
}

const POSTS = [
  { name: "班长", text: "周末去海边啦~ 好朋友一辈子", people: [CAST.monitor, CAST.d, CAST.jie, CAST.a], bg: "#9fd4f5", likes: "86" },
  { name: "阿杰", text: "今天也超开心！！", people: [CAST.jie, CAST.c, CAST.e], bg: "#ffd98a", likes: "112" },
  { name: "小美", text: "姐妹们永远在一起", people: [CAST.d, CAST.b, CAST.monitor], bg: "#ffc2d6", likes: "203" },
  { name: "大刘", text: "开黑五连胜！！", people: [CAST.a, CAST.c, CAST.jie, CAST.e], bg: "#c9f2c7", likes: "64" },
];
const HIDE = beatAt(52); // 27.40, "I wanna hide away"
const QUILT = "#4b5c9e";
/** Quilt draped over his head like a hood; `c` closes the front opening (0 open → 1 shut). */
function quiltPaths(c: number, breathe: number) {
  const outer: Pt[] = [[540, 455], [690, 500], [790, 650], [850, 880], [930, 1140], [540, 1170], [150, 1140], [230, 880], [290, 650], [390, 500]].map(
    ([x, y]) => [540 + (x - 540) * breathe, 1170 + (y - 1170) * breathe] as Pt,
  );
  // the opening: narrow at the forehead, wider at the face, hanging apart at the bottom
  const rows: [number, number][] = [[590, 70], [650, 140], [760, 165], [900, 150], [1020, 175], [1160, 230]];
  const widthAt = (y: number) => {
    for (let i = 1; i < rows.length; i++)
      if (y <= rows[i][0]) {
        const [y0, w0] = rows[i - 1],
          [y1, w1] = rows[i];
        return w0 + ((w1 - w0) * (y - y0)) / (y1 - y0);
      }
    return rows[rows.length - 1][1];
  };
  // closing pulls the front flap down from the top: its hem sweeps from the forehead to the bed
  const hemY = 590 + (1160 - 590) * c;
  const below = rows.filter(([y]) => y > hemY + 4);
  const hw = widthAt(hemY);
  const hole: Pt[] = [
    [540 + hw, hemY],
    ...below.map(([y, w]) => [540 + w, y] as Pt),
    ...below.reverse().map(([y, w]) => [540 - w, y] as Pt),
    [540 - hw, hemY],
    [540, hemY + 16 * (1 - c)],
  ];
  return { outer, hole, open: c < 0.97, hemY };
}
function shotHide(ctx: Ctx, abs: number) {
  const c = easeOut(phase(abs, 28.1, 28.48));
  const p = pulse(abs);
  const [sx, sy] = shake(abs, abs > 28.12 && abs < 28.5 ? 7 : 0);
  ctx.save();
  camera(ctx, 540, 900, 1.02 + 0.05 * phase(abs, HIDE, D) + 0.015 * p, 0, sx, sy);
  bedroom(ctx, abs, 1);
  ctx.translate(0, -70);
  // bed: headboard, mattress top and front
  rbox(ctx, 170, 860, 740, 300, 36, 630, 2);
  paint(ctx, "#4a3322", C.ink, 7);
  poly(ctx, [[90, 1120], [990, 1120], [1040, 1200], [40, 1200]], 631, 1.5);
  paint(ctx, "#a5b0d6", C.ink, 6);
  // him, looking down at the phone in his hands (gone from view once the quilt is shut)
  if (c < 0.97)
    drawKid(ctx, 540, 790, 1.0, {
    body: "bust",
    arms: "phone",
    eyes: "sad",
    look: [0, 0.85],
    mouth: "frown",
    holding: (g) => phone(g, 0, 300, 0.22, 0, (s) => lockScreen(s, { time: "21:41", airplane: true }, { note: "0 条新消息" }), 612),
  });
  // the quilt
  const q = quiltPaths(c, c >= 1 ? 1 + 0.012 * p : 1);
  const path = () => {
    ctx.beginPath();
    addBlob(ctx, q.outer, 640, 2.2);
    if (q.open) addBlob(ctx, q.hole, 641, 1.4);
  };
  path();
  ctx.fillStyle = QUILT;
  ctx.fill("evenodd");
  ctx.lineWidth = 7;
  ctx.strokeStyle = C.ink;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.save();
  path();
  ctx.clip("evenodd");
  ctx.setLineDash([16, 12]);
  ctx.strokeStyle = "rgba(255,255,255,0.26)";
  ctx.lineWidth = 4;
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath();
    ctx.moveTo(540 + i * 110 - 400, 400);
    ctx.lineTo(540 + i * 110 + 400, 1300);
    ctx.moveTo(540 + i * 110 + 400, 400);
    ctx.lineTo(540 + i * 110 - 400, 1300);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.fillStyle = "#ffe7a3";
  for (const [x, y] of [[300, 1020], [780, 960], [690, 1100], [380, 640], [700, 600]] as Pt[]) {
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
      const r = k % 2 ? 7 : 16;
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.fill();
  }
  // soft fold shading along the opening edges
  if (q.open) {
    ctx.strokeStyle = "rgba(20,24,60,0.35)";
    ctx.lineWidth = 26;
    ctx.beginPath();
    addBlob(ctx, q.hole, 641, 1.4);
    ctx.stroke();
  }
  ctx.restore();
  // mattress front edge, in front of him and the quilt
  rbox(ctx, 40, 1196, 1000, 200, 18, 632, 1.5);
  paint(ctx, "#6b77a3", C.ink, 6);
  ctx.translate(0, 70);
  lightPool(ctx, 540, 860, 950, 0.7 + 0.15 * c, "rgba(120,160,255,0.16)");
  ctx.translate(0, -70);
  // shut: the phone light only leaks out along the bottom edge
  if (c > 0.7) {
    const a = (c - 0.7) / 0.3;
    glow(ctx, 540, 1175, 320, "rgba(140,180,255,0.85)", a * (0.6 + 0.4 * p));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = "#d8e6ff";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(400, 1168);
    ctx.quadraticCurveTo(540, 1182, 680, 1168);
    ctx.stroke();
    ctx.restore();
  }
  // a sticky note on the lump: "offline" (a quiet hint at the airplane-mode twist)
  if (abs > 28.8) {
    const k = backOut(phase(abs, 28.8, 29.05));
    ctx.save();
    ctx.translate(700, 800);
    ctx.rotate(0.12);
    ctx.scale(k, k);
    rbox(ctx, -100, -62, 200, 124, 6, 650, 1.2);
    paint(ctx, "#ffe680", C.ink, 5);
    text(ctx, "离线中", 0, 4, { size: 58, font: F.pen, fill: "#3a3a46" });
    ctx.restore();
  }
  ctx.restore();
}

function shotFeed(ctx: Ctx, abs: number) {
  const hide = abs >= HIDE;
  if (!hide) {
    fillBg(ctx, "#2a2f45");
    glow(ctx, 540, 800, 900, "rgba(160,190,255,0.35)");
    const scroll = Math.pow(phase(abs, Cc, HIDE), 1.3) * 1500;
    ctx.save();
    camera(ctx, 540, 800, 1 + 0.015 * pulse(abs));
    phone(ctx, 540, 790, 0.7, 0, (cx) => feedScreen(cx, { time: "21:40", airplane: true, dark: true }, POSTS, scroll));
    ctx.restore();
    // "fake" stamp on the word
    stamp(ctx, "FAKE", 800, 420, 25.359 + 1.28, abs, 130, "#ff4d5a", 0.18);
  } else shotHide(ctx, abs);
}

function shotLaughingWorld(ctx: Ctx, abs: number) {
  const p = pulse(abs);
  const t = abs - D;
  const fadeOut = phase(abs, 32.75, END);
  const [sx, sy] = shake(abs, 6 * p);
  ctx.save();
  camera(ctx, 540, 820, 1 + 0.04 * p + t * 0.03, 0, sx, sy);
  rays(ctx, 540, 820, abs, "#7a1222", "#8f1a2c");
  // giant laughing X-faces closing in
  const heads: [number, number, Person][] = [
    [80, 380, CAST.c],
    [1000, 420, CAST.e],
    [40, 1100, CAST.a],
    [1040, 1080, CAST.b],
    [540, 260, CAST.jie],
  ];
  heads.forEach(([x, y, q], i) => {
    const inward = smooth(phase(abs, D, D + 3)) * 0.2;
    const hx = x + (540 - x) * inward,
      hy = y + (820 - y) * inward;
    drawPerson(ctx, hx, hy, 1.15, { ...q, body: "bust", arms: "laugh", tilt: Math.sin(abs * 20 + i * 2) * 0.12 });
  });
  drawKid(ctx, 540, 770, 0.5, { body: "full", hood: true, eyes: "sad", mouth: "wobble", tears: smooth(phase(abs, 31, 32.5)), headY: 0 });
  hahas(ctx, 540, 760, 460, t * 0.6, 801, F.cn, 10);
  ctx.restore();
  stamp(ctx, "HA", 240, 600, 29.576 + 2.817, abs, 150, "#fff", -0.2);
  stamp(ctx, "HA", 840, 650, 29.576 + 3.047, abs, 150, "#ffe45c", 0.2);
  flash(ctx, 0.6 * (1 - phase(abs, D, D + 0.15)));
  flash(ctx, easeIn(fadeOut), "#f6c28b");
}

export function createScene(options: SceneOptions) {
  return designScene(options, T0, (ctx, abs) => {
    if (abs < B) shotNoFriends(ctx, abs);
    else if (abs < Cc) shotChecks(ctx, abs);
    else if (abs < D) shotFeed(ctx, abs);
    else shotLaughingWorld(ctx, abs);
  });
}
