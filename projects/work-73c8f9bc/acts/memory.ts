// 回忆 · 宿舍（三年前的晚上 21:15）。用户：「宿舍场景很乱，一点都不具有美感，光影也需要优化。人物动作也需要优化，
// 整体需要重做。」两层景深：前景是她（脸大、清楚），后面是坐在自己桌前的两个室友（就是评论里的阿琪和小雅，
// 她们在自己手机上也看到了爸爸的「多穿点🌹」）。她笑着看手机 → 室友笑出声、阿琪指着她 → 她愣住看过去、脸红 →
// 一把把手机按在胸口，转开脸。屋里只亮着台灯、串灯和雪夜的窗。
import { clamp, phase } from "@frame/engine/math";
import { C, Ctx, F, H, Pt, W, backOut, bloom, camera, easeInOut, easeOut, filtered, ik2, litFigure } from "@materials/s0rrow/code/draw";
import { drawKid } from "@materials/s0rrow/code/kid";
import { drawPerson, type Person } from "@materials/s0rrow/code/people";
import { phoneBack } from "@materials/s0rrow/code/phone";
import { herPhoneBack } from "./world";
import { DORM_NIGHT_LAMP, dormNight, dormNightDesk } from "@materials/s0rrow/code/dorm-night";

/** the room behind them and her desk in front are the library's dormNight / dormNightDesk (they were drawn here
 *  first, then moved into the s0rrow library as reusable sets); the clip lamp there is the key light on her */
const LAMP = DORM_NIGHT_LAMP;

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
    dormNight(k, abs);
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
    dormNightDesk(k2, abs);
  }, "memDormDesk");
  const v = c.createRadialGradient(FX - 60, FY + 60, 380, 540, 900, 1250);
  v.addColorStop(0, "rgba(20,10,22,0)");
  v.addColorStop(1, `rgba(20,10,22,${(0.55 + 0.25 * shame).toFixed(3)})`);
  c.fillStyle = v;
  c.fillRect(-60, -60, W + 120, H + 120);
  // the lamp, the fairy lights and the window glow a little into the dark
  bloom(c, 0.25);
}
