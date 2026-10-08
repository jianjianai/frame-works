import { phase, smooth } from "../../../../src/engine/math";
import { C, Ctx, F, H, Pt, W, beatAt, blinkEyes, blob, camera, castShadow, devScale, easeIn, easeInOut, easeOut, filtered, flicker, glow, grade, handheld, hash, inkLine, jit, lerp2, measure, motes, oval, paint, poly, rbox, rr, shaded, smearV, text } from "./draw";
import { FingerKey, fingerAt, tapRipple, touchDot } from "./hand";
import { drawKid } from "./kid";
import { SH, SW, glassGlare, lockScreen, phone, phoneButtons } from "./phone";
import { screenSpill } from "./sets";
import { birthdayDesk } from "./shared";

/** 开头三个镜头（用户定的结构：主角自己在家过生日 → 另一个镜头 → 手机 0 条消息 → 回忆。这三个镜头决定 5 秒留存：
 *  场景要有美感、光影要舒服、过渡要丝滑。第二个镜头用户选的是「俯拍桌面」，班群那段去掉了。）
 *
 *  0     他一个人在家过生日：中景，戴派对帽对着一根蜡烛，镜头慢慢推近（背景串灯虚成光斑）。0.30 他自己吹响派对喇叭，
 *        纸卷「噗」地展开、停一下，又软软地垂下来缩回去一半；他叹口气，眼睛移到桌上黑着的手机
 *  1.42  镜头顺着他的视线往下甩（竖向动感模糊）……
 *  1.83  ……接上同一个方向的运动，落成正上方俯拍书桌：纸杯蛋糕和蜡烛在暖光圈中心，旁边是 6 顶装只剩 5 顶的派对帽
 *        （少的那顶在他头上）、没拉过的礼花筒、火柴盒和点蜡烛用过的那根火柴，窗格形状的月光落在桌角，手机屏幕朝上
 *        黑着（玻璃上映着烛光）。镜头很慢地转
 *  2.61  白色触点点亮屏幕，屏幕的冷光铺到桌面上 → 镜头推进手机，正好落成下一个镜头的大小和位置
 *  3.40  手机 0 条新消息：手机平躺在桌上铺满画面（左上方的烛光、右下的月光、屏幕自己的光）。3.66 下拉刷新、转圈，
 *        还是 0；4.44 镜头凑近「0 条新消息」；5.48 时间从 23:58 跳到 23:59（反转从 23:59 的锁屏开始）
 *  6.79  侧键息屏 → 黑屏里映出俯身看手机的他（身后墙上的串灯），镜头推向倒影的眼睛 → 8.09 竖线转场进回忆 */
export const TILT = beatAt(3); // 1.83 the cut to the overhead desk
export const WAKE = beatAt(4.5); // 2.61
export const PHONE = beatAt(6); // 3.40 the phone fills the frame
const PULL = beatAt(6.5); // 3.66 pull to refresh
const ZERO = beatAt(8); // 4.44 still nothing → lean in on it
const TICK = beatAt(10); // 5.48 23:58 → 23:59
export const OFF = beatAt(12.5); // 6.79 side button: the screen goes black
export const REW = beatAt(15); // 8.09 the old-screen cut into the memory
/** saturation of his world before the twist */
const GREY = 0.38;

// ---------------------------------------------------------------- 0 – 1.83 his birthday, alone
export function shotBirthday(ctx: Ctx, abs: number) {
  const push = easeInOut(phase(abs, 0, TILT - 0.25));
  const tilt = easeIn(phase(abs, TILT - 0.42, TILT));
  const zoom = 1.36 + 0.16 * push;
  const cx = 512 + 30 * push,
    cy = 845 + 25 * push + 560 * tilt;
  const [hx, hy, hr] = handheld(abs, 3, 1);
  // the party horn: blown (0.30), out, hanging there … and it sags back half rolled up
  const u = abs < 0.3 ? 0 : abs < 0.78 ? easeOut(phase(abs, 0.3, 0.46)) : 1 - 0.62 * easeInOut(phase(abs, 0.78, 1.3));
  const droop = easeInOut(phase(abs, 0.62, 1.3));
  const blowing = abs > 0.27 && abs < 0.66;
  const toPhone = smooth(phase(abs, 1.05, 1.3));
  const sigh = smooth(phase(abs, 0.8, 1.15));
  const kid = {
    eyes: (blowing && abs < 0.55 ? "shut" : "sleepy") as "shut" | "sleepy",
    mouth: (blowing ? "blow" : "flat") as "blow" | "flat",
    look: lerp2([-0.2, 0.55], [0.85, 0.85], toPhone),
    headY: Math.sin(abs * 1.6) * 3 + 7 * sigh - (blowing ? 3 : 0),
  };
  const shot = (c: Ctx, layer: "scene" | "flame") => {
    c.save();
    camera(c, cx, cy, zoom, hr, hx, hy);
    birthdayDesk(c, abs, { lit: 1, kid, layer, clue: 1, phoneOn: 0, bgBlur: 2.4 - 0.8 * push, horn: { u, droop } });
    c.restore();
  };
  const draw = (c: Ctx) => {
    grade(c, GREY, (g) => shot(g, "scene"));
    shot(c, "flame");
  };
  // the camera drops after his eyes, faster and faster: a vertical smear
  smearV(ctx, draw, 190 * tilt * tilt, "tiltOut");
}

// ---------------------------------------------------------------- 1.83 – 8.09 the desk from above → the phone
// the overhead set (design units): the candle, and his phone lying face up
const LIGHT: Pt = [330, 640];
const P: Pt = [640, 1010],
  SP = 0.4,
  R0 = -0.04;
/** the phone once it fills the frame: chat-size text, the status bar (✈) clear of the title pill */
export const PS = 0.88,
  PY = 860;

// his thumb on the glass [time, screen x, screen y, touch]: tap to wake, pull down to refresh
const FINGER: FingerKey[] = [
  [TILT, 450, 1000, 0],
  [WAKE - 0.16, 405, 810, 0],
  [WAKE - 0.04, 390, 780, 1],
  [WAKE + 0.1, 390, 780, 1],
  [WAKE + 0.26, 450, 960, 0],
  [PULL - 0.22, 440, 320, 0],
  [PULL - 0.1, 430, 300, 1],
  [PULL + 0.4, 430, 410, 1],
  [PULL + 0.46, 430, 410, 1],
  [PULL + 0.64, 450, 960, 0],
];

/** The overhead camera: where the phone (P) sits on screen, the zoom and roll. It arrives still moving the way the
 *  tilt was going (the desk slides up into place), turns very slowly, then pushes into the phone so that it lands
 *  exactly at the phone shot's size and place (PS, PY). */
function viewAt(abs: number) {
  const [hx, hy, hr] = handheld(abs, 2, 7);
  const arrive = easeOut(phase(abs, TILT, TILT + 0.42));
  const drift = phase(abs, TILT, PHONE);
  const zw = 1 + 0.05 * drift,
    rw = 0.045 - 0.04 * drift;
  const s0: Pt = [540 + (P[0] - 540) * zw, 960 + (P[1] - 960) * zw + 430 * (1 - arrive)];
  const k = easeInOut(phase(abs, WAKE + 0.18, PHONE));
  const zf = PS / SP;
  return {
    z: zw * Math.pow(zf / zw, k),
    sx: s0[0] + (540 + hx - s0[0]) * k,
    sy: s0[1] + (PY + hy - s0[1]) * k,
    r: rw + (hr - rw) * k,
    arrive,
  };
}
/** leaning in on 「0 条新消息」 after the refresh, letting go before the screen goes off */
const leanAt = (abs: number) => easeInOut(phase(abs, ZERO - 0.05, ZERO + 0.55)) * (1 - easeInOut(phase(abs, TICK + 0.4, OFF - 0.25)));

/** The phone on screen (for the dive into his reflection and the match cut into the memory). */
export function phonePose(abs: number) {
  const v = viewAt(abs);
  const dive = 0.45 * easeInOut(phase(abs, OFF + 0.08, REW));
  const press = Math.sin(Math.PI * phase(abs, OFF - 0.06, OFF + 0.14));
  const s = v.z * SP,
    cx = v.sx,
    cy = v.sy,
    rot = v.r + R0;
  // his reflected eye in the black glass (reflection drawn at screen 300, 560 × 1.05)
  const ex = cx + (250 - SW / 2) * s,
    ey = cy + (598 - SH / 2) * s;
  return { v, dive, press, s, cx, cy, rot, ex, ey };
}
/** Where his reflected face sits on screen: [x, y, scale, rotation], so the memory starts on exactly that face. */
export function phoneReflectionAt(abs: number): [number, number, number, number] {
  const { dive, s, cx, cy, rot, ex, ey } = phonePose(abs);
  const z = 1 + 3.6 * dive;
  const lx = (300 - SW / 2) * s,
    ly = (560 - SH / 2) * s;
  const px = cx + lx * Math.cos(rot) - ly * Math.sin(rot),
    py = cy + lx * Math.sin(rot) + ly * Math.cos(rot);
  return [ex + (540 - ex) * dive + z * (px - ex), ey + (960 - ey) * dive + z * (py - ey), z * s * 1.05, rot];
}

export function shotDeskPhone(ctx: Ctx, abs: number) {
  const { v, dive, press, ex, ey } = phonePose(abs);
  const zero = leanAt(abs);
  const view = (c: Ctx) => {
    camera(c, ex, ey, 1 + 3.6 * dive, 0, (540 - ex) * dive, (960 - ey) * dive);
    camera(c, 540, PY + (568 - SH / 2) * PS, 1 + 0.14 * zero, 0, 0, 60 * zero);
    camera(c, P[0], P[1], v.z, v.r, v.sx - P[0], v.sy - P[1]);
  };
  const shot = (c: Ctx, layer: "scene" | "flame") => {
    c.save();
    view(c);
    overheadDesk(c, abs, layer, press);
    c.restore();
  };
  const draw = (c: Ctx) => {
    grade(c, GREY, (g) => shot(g, "scene"));
    shot(c, "flame");
  };
  smearV(ctx, draw, 170 * (1 - v.arrive) ** 2, "tiltIn");
}

// ---------------------------------------------------------------- the overhead set
function overheadDesk(c: Ctx, abs: number, layer: "scene" | "flame", press: number) {
  const fl = flicker(abs);
  const [lx, ly] = LIGHT;
  const off = abs >= OFF;
  const wake = smooth(phase(abs, WAKE, WAKE + 0.22));
  if (layer === "scene") {
    deskTop(c);
    // what's on the desk, each throwing a soft shadow away from the flame
    const items: [(k: Ctx) => void, number][] = [
      [books, 1.3],
      [matchbox, 1.1],
      [hatPack, 1.07],
      [popper, 1.12],
    ];
    for (const [d, k] of items) {
      castShadow(c, LIGHT, k, d, "#0b0604", 7, 0.55);
      d(c);
    }
    cupcakeTop(c, lx, ly);
    // the room's dark beyond the candle's reach
    const g = c.createRadialGradient(lx, ly, 90, lx, ly, 1250);
    g.addColorStop(0, "rgba(4,5,16,0)");
    g.addColorStop(0.3, "rgba(4,5,16,0.1)");
    g.addColorStop(0.65, "rgba(4,5,16,0.5)");
    g.addColorStop(1, "rgba(4,5,16,0.86)");
    c.fillStyle = g;
    c.fillRect(-500, -500, W + 1000, H + 1000);
    moonPanes(c);
    // the phone: its shadow, the cold light its screen throws on the desk, the phone
    castShadow(c, LIGHT, 1.035, phoneShape, "#0b0604", 5, 0.6);
    screenSpill(c, P[0], P[1], SP, off ? 0 : 0.9 * wake);
    phoneButtons(c, P[0], P[1], SP, R0, press);
    phone(c, P[0], P[1], SP, R0, (p) => phoneScreen(p, abs));
    return;
  }
  // flame layer (outside the grey grade): cool shadows, warm light
  c.save();
  c.globalCompositeOperation = "soft-light";
  const st = c.createRadialGradient(lx, ly, 150, lx, ly, 1100);
  st.addColorStop(0, "rgba(30,55,130,0)");
  st.addColorStop(1, "rgba(30,55,130,0.6)");
  c.fillStyle = st;
  c.fillRect(-500, -500, W + 1000, H + 1000);
  c.restore();
  c.save();
  c.globalCompositeOperation = "lighter";
  glow(c, lx, ly, 900, `rgba(255,160,70,${(0.26 * fl).toFixed(3)})`);
  glow(c, lx, ly, 420, `rgba(255,185,105,${(0.12 * fl).toFixed(3)})`);
  c.restore();
  // the candle's warm light grazing the black glass of the phone
  c.save();
  c.translate(P[0], P[1]);
  c.rotate(R0);
  c.scale(SP, SP);
  rr(c, -SW / 2, -SH / 2, SW, SH, 70);
  c.clip();
  const sh = c.createLinearGradient(-SW / 2, -SH / 2, SW * 0.1, SH * 0.05);
  sh.addColorStop(0, `rgba(255,190,120,${(0.26 * fl * (off ? 1 : 1 - 0.7 * wake)).toFixed(3)})`);
  sh.addColorStop(1, "rgba(255,190,120,0)");
  c.fillStyle = sh;
  c.fillRect(-SW / 2, -SH / 2, SW, SH);
  c.restore();
  flameTop(c, lx, ly, abs);
  c.save();
  c.globalCompositeOperation = "lighter";
  glow(c, lx, ly - 30, 90, `rgba(255,236,190,${(0.3 * fl).toFixed(3)})`);
  glow(c, lx, ly - 20, 300, `rgba(255,170,80,${(0.1 * fl).toFixed(3)})`);
  c.restore();
  motes(c, abs, lx + 20, ly - 30, 340, 300, 14, 51, "255,215,160", 0.75, 2.4);
}

function deskTop(c: Ctx) {
  c.fillStyle = "#5a3d27";
  c.fillRect(-500, -500, W + 1000, H + 1000);
  for (let i = -3; i < 12; i++) {
    const y0 = -60 + i * 230;
    c.fillStyle = i % 2 ? "rgba(255,220,180,0.035)" : "rgba(0,0,0,0.07)";
    c.fillRect(-500, y0, W + 1000, 230);
    inkLine(c, [[-500, y0], [W / 2, y0 + jit(i, 3)], [W + 500, y0 - 2]], 3501 + i, 4, "#2b1a0f");
    c.save();
    c.globalAlpha = 0.45;
    for (let j = 0; j < 5; j++) {
      const gy = y0 + 30 + hash(i * 7 + j) * 170,
        gx = hash(i * 3.1 + j * 1.7) * W;
      inkLine(c, [[gx - 260, gy], [gx, gy - 5], [gx + 300, gy + 3]], 3520 + i * 7 + j, 2, "#6f4b31");
    }
    c.restore();
  }
}

/** the moon through the window, laid across the corner of the desk in four panes */
function moonPanes(c: Ctx) {
  filtered(
    c,
    `blur(${(6 * devScale(c)).toFixed(1)}px)`,
    (k) => {
      const q: Pt[] = [[740, 1170], [1080, 1215], [1030, 1580], [690, 1530]];
      const at = (u: number, v: number): Pt => [
        (1 - v) * ((1 - u) * q[0][0] + u * q[1][0]) + v * ((1 - u) * q[3][0] + u * q[2][0]),
        (1 - v) * ((1 - u) * q[0][1] + u * q[1][1]) + v * ((1 - u) * q[3][1] + u * q[2][1]),
      ];
      k.fillStyle = "rgba(165,185,255,0.15)";
      for (const [u0, u1] of [[0, 0.47], [0.53, 1]])
        for (const [v0, v1] of [[0, 0.46], [0.54, 1]]) {
          const p = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];
          k.beginPath();
          p.forEach(([x, y], i) => (i ? k.lineTo(x, y) : k.moveTo(x, y)));
          k.closePath();
          k.fill();
        }
    },
    "ohPanes",
    1,
    "lighter",
  );
}

function phoneShape(k: Ctx) {
  k.save();
  k.translate(P[0], P[1]);
  k.rotate(R0);
  k.scale(SP, SP);
  rr(k, -SW / 2 - 26, -SH / 2 - 26, SW + 52, SH + 52, 92);
  k.fillStyle = "#000";
  k.fill();
  k.restore();
}

function phoneScreen(p: Ctx, abs: number) {
  if (abs < OFF) {
    const wake = smooth(phase(abs, WAKE, WAKE + 0.22));
    const pull = 110 * smooth(phase(abs, PULL - 0.1, PULL + 0.38)) * (1 - smooth(phase(abs, PULL + 0.44, PULL + 0.8)));
    const spinning = abs > PULL + 0.05 && abs < PULL + 0.85;
    const tick = phase(abs, TICK, TICK + 0.3);
    const note = { note: "0 条新消息", noteAlpha: smooth(phase(abs, WAKE + 0.3, WAKE + 0.55)) };
    p.save();
    p.translate(0, pull);
    lockScreen(p, { time: "", airplane: true, battery: 0.21 }, note);
    // the time, drawn here so a minute can go by: the last digit rolls over, 58 → 59, and still nothing (the twist
    // opens on this lock screen at 23:59)
    text(p, tick > 0.5 ? "23:59" : "23:58", 96, 46, { size: 30, font: F.ui, weight: 700, fill: "#fff" });
    const big = { size: 170, font: F.ui, weight: 700, fill: "rgba(255,255,255,0.95)", align: "left" as CanvasTextAlign };
    const x0 = SW / 2 - measure(p, "23:58", 170, F.ui, 700) / 2,
      xd = x0 + measure(p, "23:5", 170, F.ui, 700);
    text(p, "23:5", x0, 290, big);
    const e = easeInOut(tick);
    p.save();
    p.beginPath();
    p.rect(xd - 12, 196, 150, 190);
    p.clip();
    if (e < 1) text(p, "8", xd, 290 - 120 * e, { ...big, alpha: 1 - e });
    if (e > 0) text(p, "9", xd, 290 + 120 * (1 - e), { ...big, alpha: e });
    p.restore();
    // still 0: the pill brightens once
    const pu = phase(abs, ZERO, ZERO + 0.6);
    if (pu > 0 && pu < 1) {
      p.save();
      p.globalAlpha = 0.55 * Math.sin(Math.PI * pu);
      p.strokeStyle = "#fff";
      p.lineWidth = 4;
      rr(p, 70 - 10 * pu, 520 - 10 * pu, SW - 140 + 20 * pu, 96 + 20 * pu, 30 + 6 * pu);
      p.stroke();
      p.restore();
    }
    p.restore();
    if (spinning) {
      p.save();
      p.translate(SW / 2, 70 + pull * 0.6);
      p.rotate(abs * 10);
      p.strokeStyle = "#fff";
      p.lineWidth = 5;
      p.beginPath();
      p.arc(0, 0, 18, 0, Math.PI * 1.5);
      p.stroke();
      p.restore();
    }
    // asleep: the black glass
    p.fillStyle = `rgba(0,0,0,${(1 - wake).toFixed(3)})`;
    p.fillRect(0, 0, SW, SH);
    glassGlare(p, 0);
    touchDot(p, fingerAt(abs, FINGER));
    tapRipple(p, 390, 780, phase(abs, WAKE, WAKE + 0.45), 1.4);
    return;
  }
  // off: black glass, and in it him, leaning over the phone — a dim reflection, drawn solid then darkened (not
  // see-through, which read as a ghost), soft, fading out below his chest (no hands: they'd be holding nothing)
  p.fillStyle = "#060608";
  p.fillRect(0, 0, SW, SH);
  filtered(
    p,
    "blur(1.6px)",
    (r) => {
      // behind him, the fairy lights on his wall (his head in front of them)
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const x = 20 + t * 560,
          y = 140 + 280 * t * (1 - t);
        glow(r, x, y, 30, "rgba(255,230,190,0.85)");
        r.fillStyle = "#fff4dc";
        r.beginPath();
        r.arc(x, y, 5, 0, Math.PI * 2);
        r.fill();
      }
      r.translate(SW, 0);
      r.scale(-1, 1);
      drawKid(r, SW - 300, 560, 1.05, { body: "bust", hat: true, eyes: blinkEyes(abs, 3, "sleepy"), look: [0, 0.3], arms: "down" });
    },
    "reflection",
  );
  p.fillStyle = `rgba(4,4,6,${(0.97 - 0.27 * smooth(phase(abs, OFF, OFF + 0.3))).toFixed(3)})`;
  p.fillRect(0, 0, SW, SH);
  // the candle beside the phone still lights his face from the side, from below
  p.save();
  p.globalCompositeOperation = "lighter";
  glow(p, 160, 760, 340, "rgba(255,170,90,0.1)", smooth(phase(abs, OFF, OFF + 0.3)));
  p.restore();
  const fade = p.createLinearGradient(0, 760, 0, 1060);
  fade.addColorStop(0, "rgba(6,6,8,0)");
  fade.addColorStop(1, "rgba(6,6,8,1)");
  p.fillStyle = fade;
  p.fillRect(0, 760, SW, SH - 760);
  const g = p.createLinearGradient(0, 0, SW, SH);
  g.addColorStop(0.18, "rgba(255,255,255,0)");
  g.addColorStop(0.3, "rgba(255,255,255,0.07)");
  g.addColorStop(0.42, "rgba(255,255,255,0)");
  p.fillStyle = g;
  p.fillRect(0, 0, SW, SH);
}

// ---------------------------------------------------------------- props, from above
/** the cupcake from above: the pleated paper case, the frosting swirl, sprinkles, the candle end-on */
function cupcakeTop(c: Ctx, x: number, y: number) {
  glow(c, x + 8, y + 10, 160, "rgba(8,4,2,0.55)");
  oval(c, x, y, 118, 112, 3410, 1.2);
  paint(c, "#ff8fb8", C.ink, 6);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    inkLine(c, [[x + Math.cos(a) * 100, y + Math.sin(a) * 95], [x + Math.cos(a) * 115, y + Math.sin(a) * 109]], 3411 + i, 2.5, "#d9658f");
  }
  // the frosting, piped in three rings, each rounding off toward its edge
  ([[98, 3440], [72, 3442], [46, 3443]] as [number, number][]).forEach(([r, s], i) => {
    oval(c, x + i * 2, y - i * 3, r, r * 0.94, s, 1.4);
    const g = c.createRadialGradient(x - r * 0.2, y - r * 0.3, r * 0.2, x, y, r);
    g.addColorStop(0, "#fcf1f4");
    g.addColorStop(1, "#e7bccb");
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = i ? "#b07d8f" : C.ink;
    c.lineWidth = i ? 3 : 5;
    c.stroke();
  });
  for (let i = 0; i < 14; i++) {
    const a = hash(i * 3.3) * Math.PI * 2,
      r = 24 + hash(i * 7.1) * 62;
    c.save();
    c.translate(x + Math.cos(a) * r, y + Math.sin(a) * r);
    c.rotate(hash(i * 5.5) * 3);
    c.fillStyle = ["#ff5a7a", "#ffd84a", "#59c3ff", "#7ee081"][i % 4];
    c.fillRect(-7, -2.5, 14, 5);
    c.restore();
  }
  oval(c, x, y, 13, 13, 3450, 0.4);
  paint(c, "#cfe8ff", C.ink, 3);
  c.strokeStyle = "#5aa7ff";
  c.lineWidth = 3;
  c.beginPath();
  c.arc(x, y, 9, 0.3, 2.2);
  c.stroke();
}
/** the flame, seen from above and a little in front */
function flameTop(c: Ctx, x: number, y: number, abs: number) {
  const fl = 1 + Math.sin(abs * 23) * 0.08 + Math.sin(abs * 37) * 0.05;
  glow(c, x, y - 18, 110, "rgba(255,190,90,0.45)");
  c.save();
  c.translate(x, y - 2);
  c.rotate(Math.sin(abs * 5) * 0.1);
  c.scale(0.62 * fl, 0.62 * (fl + Math.sin(abs * 17) * 0.06));
  blob(c, [[0, -78], [22, -30], [20, 0], [0, 12], [-20, 0], [-22, -30]], 3401, 1.2);
  paint(c, "#ffb43a", "#e0701a", 3);
  blob(c, [[0, -46], [11, -16], [0, 2], [-11, -16]], 3402, 0.8);
  paint(c, "#fff6c2", null);
  c.restore();
}
/** a party hat lying flat (tip up), pink with yellow stripes and a white pompom — the same as his */
function hatCone(c: Ctx, x: number, y: number, seed: number) {
  c.save();
  c.translate(x, y);
  const tri: Pt[] = [[0, -44], [27, 40], [-27, 40]];
  c.save();
  poly(c, tri, seed, 0.5);
  c.clip();
  c.fillStyle = "#e46f9f";
  c.fillRect(-30, -50, 60, 95);
  c.strokeStyle = "#f6d36a";
  c.lineWidth = 9;
  for (let k = -2; k < 4; k++) {
    c.beginPath();
    c.moveTo(-30, -30 + k * 26);
    c.lineTo(30, -50 + k * 26);
    c.stroke();
  }
  c.restore();
  poly(c, tri, seed, 0.5);
  paint(c, null, C.ink, 3);
  oval(c, 0, -46, 8, 8, seed + 1, 0.4);
  paint(c, "#fff8ee", C.ink, 2.5);
  c.restore();
}
/** the pack of six party hats, five still in it: the missing one is on his head */
function hatPack(c: Ctx) {
  c.save();
  c.translate(850, 650);
  c.rotate(0.22);
  rbox(c, -112, -96, 224, 252, 12, 3601, 0.8);
  paint(c, "rgba(200,220,255,0.16)", C.ink, 3);
  const slots: Pt[] = [[-64, -18], [0, -18], [64, -18], [-64, 92], [0, 92], [64, 92]];
  slots.forEach(([x, y], i) => {
    if (i === 1) {
      c.save();
      c.setLineDash([7, 7]);
      c.strokeStyle = "rgba(230,240,255,0.55)";
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(x, y - 42);
      c.lineTo(x + 26, y + 40);
      c.lineTo(x - 26, y + 40);
      c.closePath();
      c.stroke();
      c.restore();
      return;
    }
    hatCone(c, x, y, 3610 + i);
  });
  c.save();
  c.globalAlpha = 0.3;
  inkLine(c, [[-96, 130], [-40, -80]], 3620, 6, "#ffffff");
  c.restore();
  rbox(c, -116, -150, 232, 62, 6, 3602, 0.6);
  paint(c, "#f3d36b", C.ink, 4);
  text(c, "PARTY HATS x6", 0, -118, { size: 26, font: F.marker, fill: "#c0396b" });
  c.restore();
}
/** a party popper, never pulled */
function popper(c: Ctx) {
  c.save();
  c.translate(220, 1030);
  c.rotate(-0.6);
  inkLine(c, [[0, 66], [12, 100], [-4, 128], [8, 150]], 3701, 2.5, "#e9e2d0");
  oval(c, 8, 160, 11, 11, 3702, 0.3);
  paint(c, null, "#e9e2d0", 3);
  const body: Pt[] = [[-26, -70], [26, -70], [9, 66], [-9, 66]];
  c.save();
  poly(c, body, 3703, 0.6);
  c.clip();
  c.fillStyle = "#f2c14e";
  c.fillRect(-30, -80, 60, 150);
  c.strokeStyle = "#ff7fb0";
  c.lineWidth = 8;
  for (let k = -3; k < 5; k++) {
    c.beginPath();
    c.moveTo(-30, -40 + k * 24);
    c.lineTo(30, -60 + k * 24);
    c.stroke();
  }
  c.restore();
  poly(c, body, 3703, 0.6);
  paint(c, null, C.ink, 4);
  oval(c, 0, -70, 26, 8, 3704, 0.4);
  paint(c, "#fff3d6", C.ink, 3.5);
  c.restore();
}
/** the matchbox, its tray half out, and the match he lit the candle with, burnt out */
function matchbox(c: Ctx) {
  c.save();
  c.translate(610, 600);
  c.rotate(-0.18);
  rbox(c, -10, -30, 110, 60, 4, 3801, 0.4);
  paint(c, "#efe6d2", C.ink, 3);
  for (let k = 0; k < 5; k++) {
    const y = -20 + k * 10;
    c.fillStyle = "#d8b07a";
    c.fillRect(4, y - 2, 84, 4);
    c.fillStyle = "#c0392b";
    c.beginPath();
    c.arc(4, y, 4.2, 0, Math.PI * 2);
    c.fill();
  }
  rbox(c, -80, -36, 100, 72, 5, 3802, 0.5);
  paint(c, "#d9534f", C.ink, 4);
  c.fillStyle = "rgba(255,240,220,0.8)";
  c.fillRect(-70, -10, 80, 20);
  c.restore();
  c.save();
  c.translate(520, 720);
  c.rotate(0.5);
  c.fillStyle = "#d8b07a";
  c.fillRect(-40, -2.5, 66, 5);
  c.fillStyle = "#2a1d18";
  c.fillRect(14, -3, 14, 6);
  c.beginPath();
  c.arc(30, 0, 5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
/** his textbooks stacked at the left edge of the desk */
function books(c: Ctx) {
  const stack: [number, number, number, string][] = [[-60, 1420, 0.08, "#3f6fa0"], [-40, 1400, -0.05, "#c9a14a"], [-50, 1385, 0.03, "#b8534d"]];
  stack.forEach(([x, y, r, col], i) => {
    c.save();
    c.translate(x, y);
    c.rotate(r);
    shaded(c, () => rbox(c, -150, -110, 300, 220, 6, 3901 + i, 0.8), col, () => {
      c.fillStyle = "rgba(250,246,232,0.85)";
      c.fillRect(-150, -110, 300, 16);
    }, C.ink, 5);
    c.restore();
  });
}
