// 回忆 · 宿舍（三年前的晚上 21:15）。用户：「宿舍场景很乱，一点都不具有美感，光影也需要优化。人物动作也需要优化，
// 整体需要重做。」两层景深：前景是她（脸大、清楚），后面是坐在自己桌前的两个室友（就是评论里的阿琪和小雅，
// 她们在自己手机上也看到了爸爸的「多穿点🌹」）。她笑着看手机 → 室友笑出声、阿琪指着她 → 她愣住看过去、脸红 →
// 一把把手机按在胸口，转开脸。屋里只亮着台灯、串灯和雪夜的窗。
import { clamp, phase } from "@frame/engine/math";
import { C, Ctx, F, H, Pt, W, backOut, blob, bloom, camera, easeInOut, easeOut, fillBg, filtered, glow, hash, ik2, inkLine, lightShaft, litFigure, oval, paint, poly, rbox, vgrad } from "@materials/s0rrow/code/draw";
import { drawKid } from "@materials/s0rrow/code/kid";
import { drawPerson, type Person } from "@materials/s0rrow/code/people";
import { phoneBack } from "@materials/s0rrow/code/phone";
import { desk } from "@materials/s0rrow/code/sets";
import { snow } from "@materials/s0rrow/code/blocked/snow";
import { herPhoneBack } from "./world";

/** the room at night, only what the shot needs (the old one was the whole dorm, evenly lit — 「很乱」): the snowy
 *  window on the left with the city in it (the roommates sit under it, lit from behind), her bunk up on the right
 *  with a clip lamp on its rail (the key light on her), one small shelf under it, a string of fairy lights sagging
 *  across the top. Painted in night colours, no grade on top. Screen coordinates. */
const WIN = { x0: 60, y0: 250, x1: 520, y1: 700 };
const LAMP: Pt = [936, 352];
function room(c: Ctx, abs: number) {
  fillBg(c, vgrad(c, 0, H, [[0, "#1b1322"], [0.3, "#2a1d2d"], [0.62, "#35252f"], [1, "#1f161d"]]));
  // the lamp's warmth on the wall behind her, the window's cold on the left
  glow(c, LAMP[0] - 60, LAMP[1] + 300, 700, "rgba(255,178,110,0.3)");
  glow(c, 290, 760, 560, "rgba(120,150,220,0.14)");
  // ---- the window
  const { x0, y0, x1, y1 } = WIN;
  rbox(c, x0 - 22, y0 - 22, x1 - x0 + 44, y1 - y0 + 44, 10, 95001, 0.4);
  paint(c, "#2c2333", "#120c16", 4);
  c.save();
  rbox(c, x0, y0, x1 - x0, y1 - y0, 6, 95002, 0.3);
  c.clip();
  fillBg(c, vgrad(c, y0, y1, [[0, "#162544"], [0.6, "#2e4268"], [1, "#4c5c80"]]));
  // the moon, high on the right of the glass
  glow(c, 420, 330, 150, "rgba(205,220,255,0.45)");
  oval(c, 420, 330, 24, 24, 95003, 0.3);
  paint(c, "#eef1f7", null);
  // the city across the campus: blocks with a few warm windows, the nearest darkest
  for (let i = 0; i < 7; i++) {
    const bx = x0 - 30 + i * 74,
      bh = 120 + hash(i * 3.1 + 2) * 150,
      by = y1 - bh;
    c.fillStyle = i % 2 ? "#18223d" : "#1e2a47";
    c.fillRect(bx, by, 66, bh);
    for (let r = 0; r < 6; r++)
      for (let q = 0; q < 3; q++) {
        if (hash(i * 7.3 + r * 2.9 + q * 1.7) < 0.62) continue;
        c.fillStyle = "rgba(255,206,130,0.85)";
        c.fillRect(bx + 9 + q * 19, by + 16 + r * 26, 8, 11);
      }
  }
  // snow on the roofs and in the air
  c.fillStyle = "rgba(220,228,245,0.55)";
  c.fillRect(x0, y1 - 14, x1 - x0, 14);
  snow(c, abs, { x: x0, y: y0, w: x1 - x0, h: y1 - y0, n: 40, seed: 95, speed: 45, size: 3, alpha: 0.75, drift: 12 });
  c.restore();
  for (const x of [(x0 + x1) / 2 - 5]) {
    rbox(c, x, y0, 10, y1 - y0, 2, 95010, 0.2);
    paint(c, "#3a3242", "#120c16", 2);
  }
  rbox(c, x0, (y0 + y1) / 2 - 4, x1 - x0, 9, 2, 95011, 0.2);
  paint(c, "#3a3242", "#120c16", 2);
  // the sill catches the window's light
  poly(c, [[x0 - 34, y1 + 18], [x1 + 34, y1 + 18], [x1 + 44, y1 + 40], [x0 - 44, y1 + 40]], 95012, 0.4);
  paint(c, "#4a4458", "#120c16", 3);
  inkLine(c, [[x0 - 30, y1 + 20], [x1 + 30, y1 + 20]], 95013, 2.5, "rgba(170,195,245,0.6)", 0.2);
  // curtains, gathered at both sides, the window's light along their inner folds
  for (const [cx, dir] of [[x0 - 30, 1], [x1 + 30, -1]] as [number, number][]) {
    const pts: Pt[] = [[cx - 40 * dir, y0 - 60], [cx + 34 * dir, y0 - 60], [cx + 20 * dir, y0 + 200], [cx + 30 * dir, y1 + 60], [cx - 46 * dir, y1 + 64], [cx - 52 * dir, y0 + 210]];
    poly(c, pts, 95020 + cx, 0.8);
    paint(c, "#6b3e52", "#170e15", 3.5);
    for (let i = 0; i < 4; i++) inkLine(c, [[cx - 30 * dir + i * 14 * dir, y0 - 50], [cx - 28 * dir + i * 12 * dir, y1 + 50]], 95030 + cx + i, 2, i % 2 ? "rgba(30,14,26,0.4)" : "rgba(190,150,190,0.22)", 0.4);
    inkLine(c, [[cx + 30 * dir, y0 - 50], [cx + 18 * dir, y0 + 200], [cx + 26 * dir, y1 + 50]], 95040 + cx, 3, "rgba(150,175,235,0.45)", 0.4);
  }
  inkLine(c, [[x0 - 90, y0 - 64], [x1 + 90, y0 - 64]], 95050, 6, "#151018", 0.2);
  // ---- her bunk up on the right: the rail, the mattress, her pink bed curtain pulled to the side
  poly(c, [[650, 150], [1140, 150], [1140, 318], [650, 318]], 95060, 0.4);
  paint(c, "#2a1f2b", "#120c16", 3);
  blob(c, [[690, 230], [760, 196], [1140, 200], [1140, 290], [690, 292]], 95061, 0.8);
  paint(c, "#7a5a75", "#1a1019", 3);
  for (const y of [300, 330]) {
    rbox(c, 640, y, 520, 16, 4, 95062 + y, 0.4);
    paint(c, "#5c5a6a", "#120c16", 3);
    inkLine(c, [[650, y + 3], [1140, y + 3]], 95064 + y, 2, "rgba(255,210,160,0.5)", 0.2);
  }
  poly(c, [[1010, 90], [1140, 90], [1140, 620], [1090, 640], [1040, 610], [1000, 330]], 95066, 0.6);
  paint(c, "#8a4d66", "#1a1019", 3.5);
  for (let i = 0; i < 4; i++) inkLine(c, [[1020 + i * 28, 100], [1012 + i * 30, 600]], 95067 + i, 1.8, "rgba(40,16,30,0.35)", 0.4);
  // the ladder down to her desk
  for (const x of [668, 712]) {
    inkLine(c, [[x, 330], [x, 1300]], 95070 + x, 9, "#3c3848", 0.3);
    inkLine(c, [[x - 2, 335], [x - 2, 1290]], 95071 + x, 2.5, "rgba(255,200,150,0.35)", 0.2);
  }
  for (let y = 440; y < 1300; y += 120) inkLine(c, [[668, y], [712, y]], 95072 + y, 8, "#3c3848", 0.2);
  // a small shelf under the bunk: a few books and a little plant, warm in the lamplight
  rbox(c, 760, 560, 330, 18, 3, 95080, 0.3);
  paint(c, "#6a4e3c", "#1a1019", 3);
  let bx = 790;
  for (const [w, h, col] of [[26, 96, "#b0745e"], [32, 112, "#5d7aa0"], [22, 86, "#c9a660"], [30, 104, "#8a5a78"]] as [number, number, string][]) {
    rbox(c, bx, 560 - h, w, h, 2, 95081 + bx, 0.3);
    paint(c, col, "#1a1019", 2.2);
    bx += w + 4;
  }
  poly(c, [[972, 520], [1010, 520], [1004, 560], [978, 560]], 95090, 0.3);
  paint(c, "#a8765a", "#1a1019", 2);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.45;
    oval(c, 991 + Math.cos(a) * 22, 506 + Math.sin(a) * 22, 8, 20, 95091 + i, 0.4, a + Math.PI / 2);
    paint(c, "#6f8d62", "#1a1019", 1.6);
  }
  // the clip lamp on the rail, and its cone of light down over her desk
  lightShaft(c, [[LAMP[0] - 30, LAMP[1] + 14], [LAMP[0] + 34, LAMP[1] + 14], [LAMP[0] + 240, 1320], [LAMP[0] - 420, 1320]], LAMP[0], LAMP[1] + 14, LAMP[0] - 80, 1300, "255,206,140", 0.2, 30, "memLampCone");
  inkLine(c, [[LAMP[0] + 30, 336], [LAMP[0] + 40, 300], [LAMP[0] + 6, 320]], 95100, 5, "#2e2c38", 0.3);
  blob(c, [[LAMP[0] - 34, LAMP[1] + 8], [LAMP[0] - 18, LAMP[1] - 18], [LAMP[0] + 22, LAMP[1] - 16], [LAMP[0] + 36, LAMP[1] + 10]], 95101, 0.5);
  paint(c, "#e8dcc4", "#1a1019", 3);
  oval(c, LAMP[0], LAMP[1] + 10, 34, 8, 95102, 0.3);
  paint(c, "#fff1c8", null);
  glow(c, LAMP[0], LAMP[1] + 14, 220, "rgba(255,214,150,0.55)");
  glow(c, LAMP[0], LAMP[1] + 14, 60, "rgba(255,244,214,0.9)");
  // ---- the fairy lights, sagging across the top in two loops; bulbs at uneven spacing, the near ones bigger
  const string = (t: number): Pt => {
    const loop = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
    const x = -40 + 1180 * t;
    const y = (t < 0.5 ? 120 : 150) + 120 * Math.sin(Math.PI * loop);
    return [x, y];
  };
  const wire: Pt[] = [];
  for (let i = 0; i <= 60; i++) wire.push(string(i / 60));
  inkLine(c, wire, 95110, 2, "#120c16", 0.2);
  c.save();
  c.globalCompositeOperation = "screen";
  for (let i = 0; i < 15; i++) {
    const t = (i + 0.3 + 0.4 * hash(i * 3.3)) / 15;
    const [x, y] = string(t);
    const tw = 0.85 + 0.15 * Math.sin(abs * (1.3 + hash(i * 2.1)) + i * 2.2);
    glow(c, x, y + 10, 60 + 20 * hash(i * 5.1), `rgba(${i % 4 === 1 ? "255,170,190" : "255,206,140"},${(0.5 * tw).toFixed(3)})`);
    oval(c, x, y + 10, 6, 9, 95120 + i, 0.2);
    paint(c, i % 4 === 1 ? "#ffd0dc" : "#ffeab8", null);
  }
  c.restore();
}

/** her desk in front: just the edge of it, a mug, warm under the lamp */
function frontDesk(c: Ctx, abs: number) {
  const y = 1262;
  desk(c, y, { props: false, wood: "#5a3f2e", detailed: true });
  glow(c, 860, y + 140, 520, "rgba(255,186,120,0.18)");
  // her mug on the right
  const mx = 905,
    my = y + 150;
  oval(c, mx + 10, my + 108, 82, 18, 95200, 0.4);
  paint(c, "rgba(20,10,16,0.4)", null);
  rbox(c, mx - 70, my - 40, 140, 150, 26, 95201, 0.6);
  paint(c, "#a8808e", "#1a1019", 4);
  oval(c, mx, my - 40, 70, 18, 95202, 0.4);
  paint(c, "#5a3a2a", "#1a1019", 3);
  rbox(c, mx + 62, my - 6, 46, 70, 22, 95203, 0.4);
  paint(c, null, "#1a1019", 9);
  rbox(c, mx + 62, my - 6, 46, 70, 22, 95203, 0.4);
  paint(c, null, "#a8808e", 5);
  for (let i = 0; i < 2; i++) {
    const sx = mx - 16 + i * 30,
      sh = Math.sin(abs * 1.3 + i * 2) * 6;
    c.beginPath();
    c.moveTo(sx, my - 50);
    c.bezierCurveTo(sx + 14 + sh, my - 90, sx - 14 + sh, my - 120, sx + 4, my - 160);
    c.strokeStyle = "rgba(240,225,220,0.22)";
    c.lineWidth = 4;
    c.stroke();
  }
  const v = c.createLinearGradient(0, y, 0, H);
  v.addColorStop(0, "rgba(20,10,16,0)");
  v.addColorStop(1, "rgba(20,10,16,0.55)");
  c.fillStyle = v;
  c.fillRect(-60, y - 20, W + 120, H - y + 80);
}

/** the beats, seconds from the start of the shot */
const B = { laugh: 0.4, notice: 0.56, snatch: 0.86, held: 1.04 };

// ---- her pose: reading (arms "phone") → the phone clutched to her chest, one forearm across it (elbows given
// directly, so the arms swing through the move instead of folding into chicken wings)
const SH_L: Pt = [-92, 192],
  SH_R: Pt = [92, 192];
const READ_L: Pt = [-58, 330],
  READ_R: Pt = [58, 330];
const READ_EL = ik2(SH_L, READ_L, 134, 128, -1)[0],
  READ_ER = ik2(SH_R, READ_R, 134, 128, 1)[0];
const HUG_EL: Pt = [-104, 322],
  HUG_L: Pt = [6, 352],
  HUG_ER: Pt = [84, 318],
  HUG_R: Pt = [-44, 250];
const mix = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** the two roommates at their desks across the room (阿琪 left, 小雅 right of her), looking at their own phones */
function roommate(c: Ctx, abs: number, u: number, who: 0 | 1) {
  const laugh = easeOut(phase(u, B.laugh + 0.06 * who, B.laugh + 0.2 + 0.06 * who));
  const bounce = laugh > 0 ? Math.abs(Math.sin(abs * 19 + who * 1.3)) * 7 * laugh : 0;
  // 小雅 (who 1) on the left, 阿琪 (who 0) nearer her, pointing
  const [x, y] = who === 0 ? [352, 872] : [150, 892];
  const s = 0.84;
  const hip: Pt = [x, y + 350 * s];
  const phone = (q: Ctx) => phoneBack(q, 0, 238, 62, 112, 0.05, 0, { caseColor: who ? "#6f8fb5" : "#e6c56a", cameraColor: "#333" });
  const base: Person = who === 0
    ? // a ponytail (long hair drawn from the front hangs over her chest like a beard)
      { x: 0, hair: "pony", hairColor: "#3a2414", top: "#f2c94c", bottom: "#586e77", seed: 961 }
    : { x: 0, hair: "bun", hairColor: "#191515", top: "#4f8fbf", bottom: "#536a7c", seed: 962 };
  const pose: Person = laugh < 0.3
    ? { arms: "phone", face: "smile", tilt: who ? -0.06 : 0.05, holding: phone }
    : who === 0
      ? // 阿琪 points at her, her phone still in the other hand
        { arms: "phone", face: "laugh", tilt: -0.12, handR: [128, -46], shapeR: "open", bendR: 1, holding: phone }
      : // 小雅 doubles up, both fists at her stomach
        { arms: "laugh", face: "laugh", tilt: 0.16, handL: [-40, 280], shapeL: "fist", handR: [40, 292], shapeR: "fist" };
  const lean = who === 0 ? -0.06 * laugh : 0.1 * laugh;
  const draw = (q: Ctx) => {
    q.save();
    q.translate(hip[0], hip[1]);
    q.rotate(lean);
    q.translate(-hip[0], -hip[1]);
    drawPerson(q, x, y - bounce, s, { ...base, ...pose, body: "full", legs: "sit" });
    q.restore();
  };
  litFigure(c, draw, {
    shade: 0.3,
    shadeCol: "rgb(46,28,54)",
    lights: [
      // the fairy lights above, warm on their faces
      { x, y: y - 260, r: 420, rgb: "255,200,150", a: 0.24 },
      // their own phones on their faces until they look up laughing
      { x, y: y + 240 * s, r: 200, rgb: "215,226,255", a: 0.3 * (1 - laugh) },
    ],
    // the window behind and above them
    rim: { ux: 0.1, uy: -1, rgb: "170,195,245", a: 0.55, width: 5 },
  });
}

export function dormLaugh(c: Ctx, abs: number, t0: number) {
  const u = abs - t0;
  const notice = easeOut(phase(u, B.notice, B.notice + 0.14));
  const hug = easeInOut(phase(u, B.snatch, B.held));
  const jolt = backOut(phase(u, B.snatch, B.snatch + 0.24));
  // 难堪: the camera carries on the memory phone's drift back while she reads (calm, warm); when the laugh breaks it
  // starts to close in on her; the snatch jolts it in; then it keeps creeping and tips a little while the room — the
  // roommates first — goes soft and dark round her (she wants to disappear)
  const settle = easeOut(phase(u, 0, B.laugh));
  const press = easeInOut(phase(u, B.laugh, B.snatch));
  const shame = easeInOut(phase(u, B.held, 1.63));
  const z = 1.05 - 0.05 * settle + 0.05 * press + 0.07 * jolt + 0.05 * shame;
  const rot = -0.01 * press - 0.025 * shame;
  const FX = 690,
    FY = 720;
  const cam = (k: Ctx, depth = 1) => camera(k, FX, FY, 1 + (z - 1) * depth, rot * depth, -14 * jolt * depth, 0);
  filtered(c, "blur(3px)", (k) => {
    cam(k, 0.45);
    room(k, abs);
  }, "memDormBg");
  // the roommates, a little soft (the focus is on her), softer still as she shrinks into herself
  filtered(c, `blur(${(1.4 + 2.2 * shame).toFixed(2)}px)`, (k) => {
    cam(k, 0.6);
    roommate(k, abs, u, 1);
    roommate(k, abs, u, 0);
  }, "memRoommates");
  // 哈哈哈 over them, one at a time, never over a face
  c.save();
  cam(c, 0.6);
  c.textAlign = "center";
  c.textBaseline = "middle";
  for (const [x, y, sz, rot, born] of [
    [140, 690, 62, -0.2, B.laugh + 0.04],
    [330, 626, 72, 0.14, B.laugh + 0.14],
    [236, 566, 48, -0.06, B.laugh + 0.3],
  ] as [number, number, number, number, number][]) {
    const k = backOut(clamp((u - born) / 0.16));
    if (k <= 0) continue;
    c.save();
    c.translate(x, y + Math.sin(abs * 26 + x) * 4);
    c.rotate(rot);
    c.scale(k, k);
    c.font = `400 ${sz}px ${F.cn}`;
    c.lineWidth = 8;
    c.strokeStyle = C.ink;
    c.strokeText("哈哈哈", 0, 0);
    c.fillStyle = "#fff1d2";
    c.fillText("哈哈哈", 0, 0);
    c.restore();
  }
  c.restore();
  // ---- her, close, at her desk
  c.save();
  cam(c);
  const s = 1.3;
  const hx = FX,
    hy = FY - 10 * hug;
  const sw = clamp((u - B.snatch) / (B.held - B.snatch));
  const k = hug;
  const tremble = hug > 0.9 ? Math.sin(abs * 31) * 1.5 : 0;
  const phoneAt = mix([0, 316], [-8, 282], k);
  const phone = (p: Ctx) => herPhoneBack(p, phoneAt[0], phoneAt[1], 96, 176, 0.04 - 0.12 * k);
  const girl = (q: Ctx) =>
    drawKid(q, hx + tremble, hy, s, {
      who: "girl", outfit: "uniform", body: "bust", seed: 971,
      eyes: k > 0.35 ? "shut" : notice > 0.4 ? "wide" : "open",
      look: notice > 0.4 ? [-0.8, -0.1] : [0, 0.75],
      brows: k > 0.35 ? "worried" : notice > 0.4 ? "up" : undefined,
      mouth: k > 0.35 ? "bite" : notice > 0.4 ? "o" : "smile",
      blush: 0.35 + 0.3 * notice + 0.4 * k,
      // she turns away from them, ducks, and her shoulders come up
      turn: -0.15 * notice * (1 - k) + 0.4 * k,
      tilt: 0.1 * k,
      // a little start when they burst out laughing, then she ducks
      headY: 14 * k - 9 * Math.sin(Math.PI * phase(u, B.laugh + 0.04, B.laugh + 0.26)),
      arms: "custom",
      elbowL: mix(READ_EL, HUG_EL, k), handL: mix(READ_L, HUG_L, k), shapeL: sw < 0.5 ? "hold" : "fist",
      elbowR: mix(READ_ER, HUG_ER, k), handR: mix(READ_R, HUG_R, k), shapeR: sw < 0.5 ? "hold" : "fist",
      ...(sw < 0.5 ? { grip: phone } : { holding: phone }),
    });
  litFigure(c, girl, {
    shade: 0.34,
    shadeCol: "rgb(46,28,54)",
    lights: [
      // her clip lamp, up on the right: the key
      { x: LAMP[0] + 20, y: LAMP[1] + 80, r: 820, rgb: "255,196,130", a: 0.46 },
      // the screen on her face while she reads
      { x: hx, y: hy + 300 * s, r: 400, rgb: "215,226,255", a: 0.36 * (1 - k) },
    ],
    // the window, behind on the left
    rim: { ux: -1, uy: -0.55, rgb: "170,195,245", a: 0.45, width: 6 },
  });
  c.restore();
  // ---- her desk in front, soft
  filtered(c, "blur(2.5px)", (k2) => {
    cam(k2, 1.2);
    frontDesk(k2, abs);
  }, "memDormDesk");
  const v = c.createRadialGradient(FX - 60, FY + 60, 380, 540, 900, 1250);
  v.addColorStop(0, "rgba(20,10,22,0)");
  v.addColorStop(1, `rgba(20,10,22,${(0.55 + 0.25 * shame).toFixed(3)})`);
  c.fillStyle = v;
  c.fillRect(-60, -60, W + 120, H + 120);
  // the lamp, the fairy lights and the window glow a little into the dark
  bloom(c, 0.25);
}
