// 前奏 0:00–0:15.9（无人声），一镜到底，运镜是这一段的魂：
// ① 0–1.15 化成灰：首帧就贴在一个人身上——张着手、闭着眼笑，眼泪往上飘，脚踝上一截割断的红绳；镜头屏着气几乎不动；
//    0.513 她碰到强光，五颜六色的光圈炸开，她从头到脚化成灰，镜头被光推开、歪着的画面回正
// ② 1.15–2.95 整座城：镜头一路往后拉、往下沉，那团灰缩成天边的一点，整座城铺开，到处在落灰；远处还有人在往上飘，又一个在光里一闪；停一下，让人看清这座城
// ③ 2.95–4.013 又一个：镜头先往下摇、再越推越快扎进街道，穿过两层接人的网，第 3 小节重拍落在半空中的周磊身上（冲过一点再稳住）
// ④ 4.013–6.013 他在往上飘：慢慢逼近；称重员低着头从他底下走过去，公文包从他指间滑下去，掉在称重员脚后跟，称重员头也不回；
//    画外的「咚、咚」越来越近；镜头跟着公文包往下坠——落地的同一拍（第 4 小节），一只铁靴砸在它旁边
// ⑤ 6.013–8.013 她：镜头从铁靴往上抬，她仰着头；两个人同框，她一蹲；跳起来在空中抓住他的脚踝，带着惯性落下来，铁靴砸裂石板（第 5 小节）
// ⑥ 8.3–10.9 活下去：不切，镜头落到她的靴子上、跟着砖走到他手里，越推越慢；他哭着笑了
// ⑦ 10.9–15.9 城里人和她打招呼，只两个人：第 6 小节她起身从周磊身后走开，他低头抱着砖；第 7 小节抬头看窗后的老钟，老钟举杯；
//    第 8 小节小石头跑过来停在她前面一步远，她弯腰摸摸他的头，他跑回妈妈身边转身朝她挥手；镜头慢慢升起来，交给主歌一。
//    「城里都说，她是最沉的人」从她出现一直留到前奏结束
import { type C, type Cam, type CamKey, type Shot, W, H, E, ph, kcam, kick, shake, jolt, applyCam, camLerp, smearV, buf, blit, env, text, caption, vignette, flash, clamp, mix, seeded } from "./core";
import { figure, pose, stone, walk, rope, type Fig, type Joints, type Pt } from "./figure";
import { ash, crack, sky, whiteBand, city, net, ground, tower, WHITE } from "./world";
import { facades } from "./sets";
import { PAL, UMBRELLAS, crowdLook, blend } from "./palette";

export const beat = (k: number) => 0.013 + 0.5 * k;
const lerpPt = (a: Pt, b: Pt, e: number): Pt => [mix(a[0], b[0], e), mix(a[1], b[1], e)];
/** 只在 [a,b] 里升到 1、[c,d] 里落回 0 */
const win = (t: number, a: number, b: number, c: number, d: number) => E.io(ph(t, a, b)) * (1 - E.io(ph(t, c, d)));

/** 远处一个人飘进白里：一闪，下起灰（副歌一、导歌一、前奏的全景都用） */
export function farBurn(c: C, t: number, at: number, x: number, s = 1.4) {
  const y0 = WHITE + 1300;
  const y1 = WHITE + 200;
  if (t < at) {
    const p = ph(t, at - 1.6, at);
    figure(c, { x, y: mix(y0, y1, E.in2(p)), s, grounded: false, kind: "plain", float: 0.9, tone: 0.55, rim: 0, aL: -2.3, aR: 2.3, alpha: clamp((t - at + 1.6) * 3) }, t);
    return;
  }
  const u = t - at;
  if (u < 0.7) {
    const g = c.createRadialGradient(x, y1 - 60, 0, x, y1 - 60, 120 + u * 900);
    g.addColorStop(0, `rgba(255,255,255,${1 - u / 0.7})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(x - 900, y1 - 1000, 1800, 1800);
  }
  // 灰从那一点散下来
  c.fillStyle = "rgba(196,170,200,0.8)";
  for (let i = 0; i < 26; i++) {
    const a = (i * 2.399) % 6.283;
    const r = (40 + (i % 7) * 30) * Math.min(1, u * 1.6);
    const px = x + Math.cos(a) * r + Math.sin(u * 2 + i) * 20;
    const py = y1 - 60 + Math.abs(Math.sin(a)) * r * 0.4 + u * u * 160 + u * 140;
    c.globalAlpha = clamp(1.4 - u * 0.35);
    c.beginPath();
    c.arc(px, py, 5 + (i % 3) * 2, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
}

// ---------- 时间（卡在小节上：0.013、2.013、4.013、6.013、8.013……） ----------
const FRONT = 26; // 前排（她、周磊）脚底；街边的人站在 y=0
const TOUCH = 0.513; // ① 她碰到强光
const REVEAL0 = 1.15; // ② 往后拉出整座城
const REVEAL1 = 2.6;
const DIVE0 = 2.95; // ③ 扎下去
const T_ZHOU = 4.013; // 落在周磊身上（第 3 小节）
const T_BOOT = 6.013; // ④ 公文包落地、她的铁靴砸下来（第 4 小节）
const T_LAND = 8.013; // ⑤ 两个人落地（第 5 小节）
const T_KNEE = T_LAND + 0.25; // 他被拽下来，膝盖着地
// ⑥ 活下去
const B_KNEEL = 8.3;
const B_BOOT = 8.55;
const B_PULL = 8.85;
const B_TURN = 9.15;
const B_GIVE = 9.45;
const B_BACK = 9.6;
const B_LOOK = 9.95;
const B_STAND = 10.35;
const T_UP = 10.9; // ⑦ 她接着往前走

// ---------- 位置：周磊飘在 ZX；她从右边跑来，救下他以后往左走 ----------
const ZX = 30;
const zhouH = (t: number) => 255 + 30 * (t - 4.0); // 他的脚离地多高（一直在慢慢往上飘）
const QS0 = ZX + 60; // 她跑来停住的地方（铁靴砸下来）
const RUN_V = 450;
const SKID = 0.15;
const REACH = 204; // 她两手举过头，手离脚多高
const GRAV = 2700;
const GRAV2 = 1900; // 抓住以后两个人一起落（她连铁靴重，他在飘、轻）
const Y_G = zhouH(7.6) + 6 - REACH; // 抓住时她的脚离地多高（跳到最高点正好够到他的脚踝）
const TAU_G = Math.sqrt((2 * Y_G) / GRAV); // 起跳到最高点
const VY0 = GRAV * TAU_G;
const PAIR_VY = 30 / 3; // 抓住以后，他往上飘的劲分给两个人
const TAU_L = (PAIR_VY + Math.sqrt(PAIR_VY * PAIR_VY + 2 * GRAV2 * Y_G)) / GRAV2;
const T_GRAB = T_LAND - TAU_L;
const T_JUMP = T_GRAB - TAU_G;
const X_G = ZX + 21; // 抓住时她的位置（手在他脚踝上）
const JUMP_VX = (X_G - QS0) / TAU_G;
const PAIR_VX = (2 * JUMP_VX) / 3;
const X_L = X_G + PAIR_VX * TAU_L;
const QL = X_L - 10; // 落地滑一点，停在这里
const ZK = QL - 100; // 周磊跪下的地方（和她隔开，砖在两个人中间）
const WALK_V = 130;
const SLOW = 108; // 摸小石头的头时几乎停下（少走的距离正好一步，脚步还落在拍子上）
// 街边的人
const LAO_X = QL - 350; // 老钟的窗
const MOM_X = QL - 710; // 小石头的妈妈站在家门口
const KID0 = MOM_X + 32; // 小石头一开始站在妈妈旁边
const P2X = QL - 860; // 路边打伞的人
const TOWER_X = -2050; // 她住的那栋楼（和主歌一同一个位置）
const RX = -425; // 化成灰的那个人（全景里她在天边正中，左边是那栋最高的楼）
const BR = 12; // 砖的大小

// ---------- 她的位置 ----------
const slowArea = (t: number) => {
  if (t < 14.0) return 0;
  if (t < 14.2) return (t - 14.0) ** 2 / 0.4;
  if (t < 14.6) return 0.1 + (t - 14.2);
  if (t < 14.8) return 0.5 + (t - 14.6) - (t - 14.6) ** 2 / 0.4;
  return 0.6;
};
export function qinX(t: number) {
  const s0 = T_BOOT - SKID;
  if (t < s0) return QS0 + (RUN_V * SKID) / 2 + RUN_V * (s0 - t);
  if (t < T_BOOT) return QS0 + (RUN_V * (T_BOOT - t) ** 2) / (2 * SKID);
  if (t < T_JUMP) return QS0;
  if (t < T_GRAB) return QS0 + JUMP_VX * (t - T_JUMP);
  if (t < T_LAND) return X_G + PAIR_VX * (t - T_GRAB);
  if (t < T_UP) return mix(X_L, QL, E.out(ph(t, T_LAND, T_LAND + 0.16)));
  return QL - WALK_V * (t - T_UP) + SLOW * slowArea(t);
}
/** 她的脚离地多高 */
function qinH(t: number) {
  if (t < T_JUMP || t >= T_LAND) return 0;
  if (t < T_GRAB) {
    const s = t - T_JUMP;
    return VY0 * s - 0.5 * GRAV * s * s;
  }
  const s = t - T_GRAB;
  return Math.max(0, Y_G + PAIR_VY * s - 0.5 * GRAV2 * s * s);
}
/** 空中她两手举着他脚踝的位置 */
const heldAt = (t: number): Pt => [qinX(t) - 20, FRONT - qinH(t) - REACH];
/** 砖落进他手里以后，手往下一坠（弹一下） */
const brickDip = (t: number) => (t > B_GIVE ? 9 * (1 - Math.exp(-(t - B_GIVE) / 0.07)) - 3 * kick(t, B_GIVE + 0.12, 0.12) : 0);

// ---------- ① 化成灰的那个人 ----------
function riser(t: number): Fig {
  const u = Math.min(t, TOUCH);
  return {
    x: RX + Math.sin(u * 0.9) * 6,
    y: mix(-8890, -8909, ph(u, 0, TOUCH)),
    grounded: false,
    kind: "woman",
    facing: 1,
    float: 1,
    lean: -0.06 + Math.sin(u * 1.1) * 0.03,
    head: 0.55,
    aL: -2.45 + Math.sin(u * 2.1) * 0.06,
    aR: 2.5 + Math.sin(u * 1.9 + 1) * 0.06,
    bendL: 0.15,
    bendR: -0.15,
    legL: 0.05,
    legR: -0.12,
    kneeL: 0.25,
    kneeR: 0.5,
    barefoot: true,
    boots: false,
    eyes: "smile",
    rim: 1,
    warm: 0.6 + 0.4 * ph(t, 0, TOUCH),
    look: { top: "#f29a86", bottom: "#f29a86", legs: "#8a6f8f", hair: "#3a2b2b", shoe: "#7a4b52" },
  };
}
const chest = (j: Joints): Pt => lerpPt(j.head, j.hip, 0.45);
const riserChest = (t: number): Pt => chest(pose(riser(t)));
const BURN = riserChest(TOUCH);
/** 眼泪往上飘（这里什么都往上飘） */
function tearsUp(c: C, j: Joints, t: number, a: number) {
  if (a <= 0.01) return;
  const hr = j.headR;
  const ex = j.head[0] + hr * 0.2;
  const ey = j.head[1] + hr * 0.1;
  c.save();
  c.fillStyle = "#9fd0f0";
  for (let i = 0; i < 6; i++) {
    const k = (t * 0.6 + i / 6) % 1;
    const side = i % 2 ? 1 : -1;
    c.globalAlpha = a * 0.9 * Math.sin(Math.PI * k);
    c.beginPath();
    c.ellipse(ex + side * hr * 0.36 + Math.sin(t * 2.3 + i) * hr * 0.2, ey - k * hr * 4, hr * 0.12, hr * 0.17, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
/** 脚踝上一截割断的红绳：自己割断了脚绳的人 */
function cutRope(c: C, an: Pt, t: number, len = 44) {
  const end: Pt = [an[0] + Math.sin(t * 2.3) * 7, an[1] + len];
  rope(c, an, end, 6 + Math.sin(t * 3) * 4, 2.6);
  c.save();
  c.strokeStyle = "#d65a4c";
  c.lineWidth = 1.2;
  for (let i = -1; i <= 1; i++) {
    c.beginPath();
    c.moveTo(end[0], end[1]);
    c.lineTo(end[0] + i * 4, end[1] + 6);
    c.stroke();
  }
  c.restore();
}
const HOT = ["#ff9ab9", "#ffc080", "#ffe68c", "#96e4be", "#94c6ff", "#c8a8ff"];
const rgbaHex = (h: string, a: number) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
/** 她在五颜六色的光里；碰到强光以后从头到脚烧掉（烧着的那一道是彩色的边） */
function riserDraw(c: C, t: number) {
  if (t > TOUCH + 0.5) return;
  const f = riser(t);
  const j = pose(f);
  if (t < TOUCH) {
    const ch = lerpPt(j.head, j.hip, 0.4);
    HOT.forEach((col, i) => {
      const a = t * 0.8 + (i * Math.PI) / 3;
      const px = ch[0] + Math.cos(a) * 26;
      const py = ch[1] + Math.sin(a) * 34 - 20;
      const gg = c.createRadialGradient(px, py, 0, px, py, 130);
      gg.addColorStop(0, rgbaHex(col, 0.42));
      gg.addColorStop(1, rgbaHex(col, 0));
      c.fillStyle = gg;
      c.fillRect(px - 130, py - 130, 260, 260);
    });
    cutRope(c, j.anR, t);
  }
  const bot = Math.max(j.toeL[1], j.toeR[1]) + 10;
  const line = mix(j.top - 30, bot, E.in2(ph(t, TOUCH, TOUCH + 0.45)));
  c.save();
  if (t >= TOUCH) {
    c.beginPath();
    c.rect(j.hip[0] - 500, line, 1000, 2000);
    c.clip();
  }
  figure(c, f, t);
  tearsUp(c, j, t, 1 - ph(t, TOUCH - 0.1, TOUCH + 0.05));
  c.restore();
  if (t >= TOUCH) {
    const g = c.createLinearGradient(j.hip[0] - 60, 0, j.hip[0] + 60, 0);
    ["255,150,185", "255,214,140", "150,228,190", "148,198,255", "200,168,255"].forEach((col, i, a) => g.addColorStop(i / (a.length - 1), `rgba(${col},0.95)`));
    c.fillStyle = g;
    c.fillRect(j.hip[0] - 60, line - 6, 120, 12);
  }
}
const DUST = (() => {
  const r = seeded(31);
  return Array.from({ length: 200 }, (_, i) => ({ u: r(), dx: r() * 2 - 1, vx: r() * 2 - 1, vy: r(), s: 2.4 + r() * 4.6, w: r() * 6.28, hue: i % 6 }));
})();
/** 一团灰：先是五颜六色的火星，散开、变成灰白的灰，慢慢往下落 */
function dustCloud(c: C, t: number) {
  const u = t - TOUCH;
  if (u <= 0 || u > 3) return;
  const j = pose(riser(TOUCH));
  const bot = Math.max(j.toeL[1], j.toeR[1]);
  c.save();
  for (const d of DUST) {
    const a = u - d.u * 0.42;
    if (a <= 0) continue;
    const spread = 1 - Math.exp(-a * 2.3);
    const x = j.hip[0] + d.dx * 24 + d.vx * 190 * spread + Math.sin(a * 1.7 + d.w) * 12;
    const y = mix(j.top - 10, bot, d.u) - (0.25 + d.vy * 0.75) * 80 * spread + a * a * 90;
    c.globalAlpha = clamp(1.7 - a * 0.45);
    c.fillStyle = blend("#c6aecb", HOT[d.hue], clamp(1 - a / 0.55));
    c.beginPath();
    c.ellipse(x, y, d.s * 1.25, d.s, d.w + a, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
/** 碰到强光的一下：五颜六色的光圈一圈圈散开 */
function touchFlash(c: C, t: number) {
  const u = t - TOUCH;
  if (u < 0 || u > 0.8) return;
  const p = BURN;
  c.save();
  HOT.forEach((col, i) => {
    const r = 40 + (u * 520 + i * 26) * (1 + i * 0.08);
    c.strokeStyle = col;
    c.globalAlpha = 0.75 * (1 - u / 0.8);
    c.lineWidth = 10 + u * 20;
    c.beginPath();
    c.arc(p[0], p[1], r, 0, Math.PI * 2);
    c.stroke();
  });
  c.globalAlpha = 1;
  const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], 90 + u * 600);
  g.addColorStop(0, `rgba(255,252,240,${1 - u / 0.8})`);
  g.addColorStop(1, "rgba(255,240,220,0)");
  c.fillStyle = g;
  c.fillRect(p[0] - 700, p[1] - 700, 1400, 1400);
  c.restore();
}

// ---------- ② 全景里远处那些往上飘的人（这座城里天天都是这样） ----------
const FLOATERS = [
  { dx: -900, y0: -6400, seed: 1 },
  { dx: 1300, y0: -4800, seed: 2 },
  { dx: 600, y0: -3400, seed: 3 },
];
function floaters(c: C, k: Cam, t: number) {
  for (const f of FLOATERS) {
    const x = RX + f.dx + Math.sin(t * 0.7 + f.seed) * 20;
    const y = f.y0 - 45 * t;
    const r = Math.max(60, 46 / k.z);
    const g = c.createRadialGradient(x, y - 40, 0, x, y - 40, r);
    g.addColorStop(0, "rgba(255,190,170,0.5)");
    g.addColorStop(1, "rgba(255,220,200,0)");
    c.fillStyle = g;
    c.fillRect(x - r, y - 40 - r, r * 2, r * 2);
    figure(c, { x, y, grounded: false, kind: "plain", float: 0.9, tone: 0.2, rim: 0.6, aL: -1.6, aR: 1.7, head: 0.3, eyes: "closed", look: crowdLook(f.seed) }, t);
  }
}

// ---------- ④ 周磊 ----------
function zhouFig(t: number): Fig {
  const base: Fig = { x: ZX, y: 0, kind: "man", facing: 1, rim: 0.7 };
  if (t < T_GRAB) {
    // 已经飘在半空：低着头，手往上飘；公文包从指间滑下去
    return { ...base, grounded: false, x: ZX + Math.sin(t * 0.9) * 6, y: FRONT - zhouH(t) - 89, float: 0.85, head: -0.55, bag: t < T_DROP, aL: -1.0, aR: 0.95 - 0.5 * E.io(ph(t, T_DROP - 0.3, T_DROP)), bendL: 0.4, bendR: -0.5, legL: 0.06, legR: -0.04, kneeL: 0.35, kneeR: 0.5, eyes: "closed", lean: Math.sin(t * 0.7) * 0.05 };
  }
  if (t < T_LAND) {
    // 被抓住的一下：身子荡一荡（惯性），跟着她往下落
    const a = heldAt(t);
    const sw = 0.35 * Math.sin((t - T_GRAB) * 14) * Math.exp(-(t - T_GRAB) / 0.3);
    return { ...base, grounded: false, x: a[0] + 2, y: a[1] - 83, float: 0.75, lean: -0.2 + sw, head: -0.3, aL: -1.4, aR: 1.3, bendL: 0.5, bendR: -0.5, legL: 0.05, legR: 0.02, kneeL: 0.1, kneeR: 0.15, eyes: "wide" };
  }
  if (t < T_KNEE) {
    // 她落地以后顺势一拽，他越落越快，膝盖砸在地上
    const e = E.in2(ph(t, T_LAND, T_KNEE));
    const a0 = heldAt(T_LAND - 0.001);
    const ank: Pt = [mix(a0[0], ZK - 5, e), mix(a0[1], FRONT - 6, e)];
    return { ...base, grounded: false, x: mix(ank[0] - 2, ZK, e), y: mix(ank[1] - 83, FRONT - 37, e), float: 0.6 * (1 - e), lean: mix(-0.2, 0.12, e), head: -0.3, aL: mix(-1.2, 0.2, e), aR: mix(1.1, 0.3, e), legL: 1.3 * e, legR: 1.1 * e, kneeL: 2.5 * e, kneeR: 2.4 * e, eyes: "wide" };
  }
  // 跪着：抬起两手接住砖，手一坠；看着砖，再抬头看她，哭着笑了；她起身从他身后绕过去，他仰头看着她；
  // 她走远了，他坐下去，低头抱着怀里的砖
  const bounce = 7 * kick(t, T_KNEE, 0.09);
  const recv = E.io(ph(t, 9.0, 9.35));
  const look = E.io(ph(t, B_LOOK, B_LOOK + 0.4));
  const slump = E.io(ph(t, 11.7, 12.2));
  const y = mix(FRONT - 37 + bounce, FRONT - 22, slump);
  const hands: Pt = [ZK + 31, mix(FRONT - 70, y - 22, slump) + brickDip(t)];
  const down = E.io(ph(t, 11.7, 12.2)); // 她走了，他低头看着怀里的砖
  return {
    ...base,
    grounded: false,
    x: ZK,
    y,
    lean: mix(0.12, -0.25, slump) + 0.14 * down,
    head: mix(0.5, 0.35, slump) * look + mix(-0.2, -0.55, recv) * (1 - look) - 0.75 * down,
    legL: mix(1.3, 1.45, slump),
    legR: mix(1.1, 1.25, slump),
    kneeL: mix(2.5, 0.35, slump),
    kneeR: mix(2.4, 0.6, slump),
    hL: recv > 0 ? lerpPt([ZK + 10, FRONT - 30], [hands[0] - 5, hands[1] + 2], recv) : undefined,
    hR: recv > 0 ? lerpPt([ZK + 14, FRONT - 28], [hands[0] + 5, hands[1]], recv) : undefined,
    aL: 0.3,
    aR: 0.4,
    eyes: t < 9.0 ? "wide" : look > 0.5 ? "smile" : "open",
    tears: look > 0.3 ? 1 : 0,
  };
}
const zhouChest = (t: number): Pt => chest(pose(zhouFig(t)));

// ---------- 公文包：从他指间滑下去，按重力往下掉，落地正好在第 4 小节（她的铁靴同一拍砸下来） ----------
const BRIEF_REST: Pt = [ZX + 2, FRONT - 9]; // 落在她铁靴落点的左边一点，砸下来时看得见
const handAt = (t: number) => pose({ ...zhouFig(t), bag: true }).handR;
// 松手的时间按他手的高度反推：从那里自由落体，正好在 T_BOOT 落地
let T_DROP = 5.5;
for (let i = 0; i < 3; i++) {
  const h = handAt(T_DROP);
  T_DROP = T_BOOT - Math.sqrt((2 * (BRIEF_REST[1] - (h[1] + 12))) / GRAV);
}
const BRIEF0: Pt = (() => {
  const h = handAt(T_DROP);
  return [h[0], h[1] + 12];
})();
function briefPos(t: number): Pt {
  const u = ph(t, T_DROP, T_BOOT);
  return [mix(BRIEF0[0], BRIEF_REST[0], u), mix(BRIEF0[1], BRIEF_REST[1], u * u)]; // 越落越快，正好落在 BRIEF_REST
}
function briefcase(c: C, t: number) {
  if (t < T_DROP) return;
  const p = briefPos(t);
  const bounce = t > T_BOOT ? 10 * Math.abs(Math.sin((t - T_BOOT) * 18)) * Math.exp(-(t - T_BOOT) / 0.1) : 0;
  c.save();
  c.translate(p[0], p[1] - bounce);
  c.rotate(t < T_BOOT ? (t - T_DROP) * 3.2 : 0.06);
  c.fillStyle = "#8a5a3e";
  c.strokeStyle = PAL.ink;
  c.lineWidth = 3;
  c.beginPath();
  c.rect(-13, -10, 26, 19);
  c.fill();
  c.stroke();
  c.fillStyle = "#6b432e";
  c.fillRect(-5, -14, 10, 4);
  c.restore();
}

// ---------- ⑤⑥⑦ 她 ----------
function qinWalkAt(t: number): Fig {
  const x = qinX(t);
  // 步子按走过的路算：摸小石头的头时几乎停住，脚步也跟着慢下来；每一步落在拍子上
  const w = walk((QL - x) / WALK_V + (T_UP - 10.763), 0.36);
  const y = FRONT - w.bob * 0.6;
  return { x, y, kind: "qin", facing: -1, lean: 0.06, legL: w.legL, legR: w.legR, kneeL: w.kneeL, kneeR: w.kneeR, aL: w.aL, aR: w.aR, head: 0.1, rim: 0.8, eyes: "open" };
}
/** 接着往前走（主歌一第一镜也画她） */
export function qinWalking(t: number): Fig {
  return qinWalkAt(t);
}
function qinFig(t: number): Fig {
  const x = qinX(t);
  const base = { x, kind: "qin" as const, facing: -1 as const, rim: 0.8 };
  if (t < T_BOOT - SKID) {
    // 从画外冲过来
    const w = walk((t - 4.5) * 2.4, 0.78);
    return { ...base, y: FRONT - w.bob * 1.4, lean: -0.36, legL: w.legL, legR: w.legR, kneeL: w.kneeL * 1.5, kneeR: w.kneeR * 1.5, aL: w.aL * 2.2, aR: w.aR * 2.2, bendL: -1.2, bendR: -1.2, head: 0.5, eyes: "wide" };
  }
  if (t < T_BOOT) {
    // 刹住：身子往后仰，前脚往前一蹬
    const e = E.out(ph(t, T_BOOT - SKID, T_BOOT));
    return { ...base, y: FRONT, lean: mix(-0.36, 0.22, e), legL: mix(-0.3, -0.62, e), kneeL: mix(0.6, 0.1, e), legR: mix(0.3, 0.45, e), kneeR: mix(0.6, 0.9, e), aL: mix(-0.6, 0.5, e), aR: mix(0.6, 0.9, e), bendL: -0.6, bendR: -0.6, head: mix(0.5, 0.8, e), eyes: "wide" };
  }
  if (t < T_JUMP) {
    // 铁靴砸下来、站稳，仰头盯着他；然后一蹲（攒劲）
    const squash = kick(t, T_BOOT, 0.12);
    const settle = E.io(ph(t, T_BOOT, T_BOOT + 0.35));
    const crouch = E.io(ph(t, 6.85, T_JUMP));
    return {
      ...base,
      y: FRONT,
      lean: mix(0.22, 0.02, settle) - 0.18 * crouch,
      legL: mix(-0.62, -0.18, settle) - 0.55 * crouch,
      kneeL: mix(0.1, 0.2, settle) + 0.5 * squash + 1.3 * crouch,
      legR: mix(0.45, 0.2, settle) + 0.2 * crouch,
      kneeR: mix(0.9, 0.25, settle) + 0.4 * squash + 1.1 * crouch,
      aL: mix(0.5, -0.2, settle) + 0.9 * crouch,
      aR: mix(0.9, 0.2, settle) + 0.8 * crouch,
      bendL: -0.5,
      bendR: -0.5,
      head: mix(0.8, 0.95, settle),
      eyes: settle > 0.6 ? "open" : "wide",
    };
  }
  if (t < T_GRAB) {
    // 跳起来，两手伸向他的脚踝
    const zj = pose(zhouFig(t));
    const h = qinH(t);
    const reach = E.out(ph(t, T_JUMP, T_GRAB));
    const ank: Pt = [zj.anR[0] + 1, zj.anR[1] + 4];
    return { ...base, y: FRONT - h, lean: -0.1, legL: mix(-0.4, -0.9, reach), kneeL: mix(0.3, 1.5, reach), legR: mix(0.3, 0.55, reach), kneeR: mix(0.2, 0.4, reach), hL: lerpPt([x - 20, FRONT - h - 130], ank, reach), hR: lerpPt([x - 2, FRONT - h - 120], [ank[0] + 4, ank[1] + 16], reach), head: 0.95, eyes: "wide" };
  }
  if (t < T_LAND) {
    // 抓住了：两手举着他的脚踝一起往下落，快落地时腿伸直
    const h = qinH(t);
    const a = heldAt(t);
    const brace = E.io(ph(t, T_LAND - 0.2, T_LAND));
    return { ...base, y: FRONT - h, lean: 0.08, legL: mix(-0.6, -0.28, brace), kneeL: mix(1.0, 0.3, brace), legR: mix(0.45, 0.22, brace), kneeR: mix(0.8, 0.25, brace), hL: [a[0] - 2, a[1] + 2], hR: [a[0] + 3, a[1] + 14], head: 0.9, eyes: "open" };
  }
  if (t < B_KNEEL) {
    // 落地：铁靴砸在石板上，膝盖一沉，两手顺势把他拽下来
    const s = t - T_LAND;
    const squash = Math.min(1, s / 0.05) * Math.exp(-s / 0.18);
    const zj = pose(zhouFig(t));
    const hold = t < T_KNEE;
    return {
      ...base,
      y: FRONT,
      lean: -0.32 * squash - 0.1 * E.io(ph(t, T_LAND, T_KNEE)),
      legL: -0.32 - 0.35 * squash,
      kneeL: 0.3 + 1.4 * squash,
      legR: 0.28 + 0.25 * squash,
      kneeR: 0.3 + 1.3 * squash,
      hL: hold ? [zj.anR[0] - 1, zj.anR[1] + 3] : [x - 30, FRONT - 74],
      hR: hold ? [zj.anR[0] + 4, zj.anR[1] + 15] : undefined,
      aR: 0.4,
      head: mix(0.7, -0.2, E.io(ph(t, T_LAND, T_KNEE))),
      eyes: "open",
    };
  }
  if (t < B_STAND) {
    // 单膝跪下，手伸进前面那只靴筒，抽出一块砖（很沉），放进他手里
    const kneel = E.io(ph(t, B_KNEEL, B_BOOT));
    const f: Fig = { ...base, y: FRONT, lean: mix(-0.1, -0.42, kneel), legL: mix(-0.35, -1.35, kneel), kneeL: mix(0.6, 1.35, kneel), legR: mix(0.4, 0.35, kneel), kneeR: mix(0.6, 1.25, kneel), aR: 0.35, bendR: -0.4, head: -0.3, eyes: "open" };
    const fj = pose(f);
    const bootTop: Pt = [fj.anL[0] - 2, fj.anL[1] - 24];
    const chestP: Pt = [x - 26, FRONT - 98];
    const give: Pt = [ZK + 31 + BR, FRONT - 70 - BR * 0.62 - 2];
    let hand: Pt;
    if (t < B_BOOT) hand = lerpPt([x - 30, FRONT - 74], bootTop, E.io(ph(t, B_KNEEL, B_BOOT)));
    else if (t < B_PULL) hand = [bootTop[0] + Math.sin(t * 30) * 1.5, bootTop[1] + 5];
    else if (t < B_TURN) hand = lerpPt(bootTop, chestP, E.in2(ph(t, B_PULL, B_TURN)));
    else if (t < B_GIVE) hand = lerpPt(chestP, give, E.io(ph(t, B_TURN, B_GIVE)));
    else if (t < B_BACK) hand = [give[0], give[1] + brickDip(t)];
    else hand = lerpPt([give[0], give[1] + brickDip(B_BACK)], [x - 16, FRONT - 52], E.io(ph(t, B_BACK, B_BACK + 0.3)));
    const lookHim = E.io(ph(t, B_TURN, B_GIVE));
    return { ...f, hL: hand, head: mix(-0.3, 0.05, lookHim), eyes: t > B_GIVE + 0.05 ? "smile" : "open" };
  }
  if (t < T_UP) {
    // 冲他笑了一下，站起来。伏笔：送出一块砖，她轻了——站起来时脚跟离地了一下
    const st = E.io(ph(t, B_STAND, B_STAND + 0.5));
    return { ...base, y: FRONT - 11 * Math.sin(Math.PI * ph(t, B_STAND + 0.38, B_STAND + 0.6)), lean: mix(-0.42, 0.04, st), legL: mix(-1.35, -0.1, st), kneeL: mix(1.35, 0.15, st), legR: mix(0.35, 0.1, st), kneeR: mix(1.25, 0.15, st), aL: -0.15, aR: 0.2, head: mix(0.05, -0.1, st), eyes: "smile" };
  }
  // 往前走，只和两个人打招呼：抬头看窗后的老钟，抬手、点头；弯腰摸摸跑过来的小石头的头
  const f = qinWalkAt(t);
  const toLao = win(t, 12.5, 12.75, 13.25, 13.5);
  const lift = Math.sin(Math.PI * ph(t, 12.65, 13.2));
  const nodL = Math.sin(Math.PI * ph(t, 12.9, 13.2));
  const pat = win(t, 14.05, 14.22, 14.45, 14.6);
  let hL: Pt | undefined;
  if (pat > 0.02) {
    const kj = pose(kidFig(t));
    hL = lerpPt([f.x - 10, f.y - 90], [kj.head[0] + 2, kj.top + 3 + Math.sin(t * 14) * 3], pat);
  } else if (lift > 0.02) hL = lerpPt([f.x - 10, f.y - 90], [f.x - 16 + Math.sin(t * 12) * 4, f.y - 178], lift);
  return {
    ...f,
    y: f.y - 12 * win(t, 11.0, 11.3, 11.85, 12.15), // 往里让一步，绕到他身后
    lean: 0.06 - 0.3 * pat, // 隔着一步远弯下腰去够他的头（两个人不叠在一起）
    aL: hL ? undefined : f.aL,
    hL,
    head: 0.05 + 0.5 * toLao - 0.3 * nodL - 0.45 * pat,
    eyes: toLao > 0.3 || pat > 0.3 ? "smile" : "open",
  };
}

/** 那块砖：她从靴筒里竖着抽出来，转平了递过去，落进他手里变暖 */
function brickAt(t: number): { p: Pt; rot: number; warm: number } | null {
  if (t < B_PULL) return null;
  if (t < B_GIVE) {
    const h = pose(qinFig(t)).handL;
    const v = E.io(ph(t, B_TURN, B_GIVE));
    return { p: lerpPt([h[0], h[1] + BR * 0.95], [h[0] - BR, h[1] + 2], v), rot: mix(Math.PI / 2 - 0.08, -0.05, v), warm: 0 };
  }
  const zj = pose(zhouFig(t));
  const hp = lerpPt(zj.handL, zj.handR, 0.5);
  return { p: [hp[0], hp[1] - BR * 0.62], rot: -0.05, warm: E.out(ph(t, B_GIVE, B_GIVE + 0.5)) };
}

// ---------- 街上的人 ----------
function cup(c: C, x: number, y: number) {
  c.save();
  c.fillStyle = "#fff4e6";
  c.strokeStyle = PAL.ink;
  c.lineWidth = 2;
  c.beginPath();
  c.rect(x - 6, y - 12, 12, 13);
  c.fill();
  c.stroke();
  c.fillStyle = "#c98f5a";
  c.fillRect(x - 5, y - 11, 10, 3);
  c.restore();
}
/** 老钟：一楼的窗后面，她走过来时举起茶杯 */
function laoZhong(c: C, t: number) {
  c.fillStyle = "#b9d1b1";
  c.fillRect(LAO_X - 150, -560, 300, 560);
  c.fillStyle = "#ffd27a";
  c.globalAlpha = 0.85;
  c.fillRect(LAO_X - 80, -380, 160, 150);
  c.globalAlpha = 1;
  const up = win(t, 12.45, 12.8, 13.5, 13.85);
  const j = figure(c, { x: LAO_X, y: -230, kind: "old", facing: 1, head: -0.1 + 0.3 * up, aR: 1.2 + up * 0.9, bendR: -1.4 - up * 0.4, tone: 0.05, stone: 0.7, rim: 0.5, eyes: up > 0.2 ? "smile" : "open" }, t);
  cup(c, j.handR[0], j.handR[1]);
  c.fillStyle = "#eef5ea";
  c.fillRect(LAO_X - 92, -232, 184, 10);
}
/** 称重员：全城最厚的铁靴。周磊飘在头顶上，他低着头从底下走过去，公文包掉在他脚后跟，他头也不回——和全城的人一样不抬头 */
function weigher(c: C, t: number) {
  const g = walk(t * 1.6, 0.3);
  figure(c, { x: ZX + 140 - 120 * (t - 4.0), y: 0, kind: "weigher", facing: -1, head: -0.75, legL: g.legL, legR: g.legR, kneeL: g.kneeL, kneeR: g.kneeR, aL: g.aL, aR: g.aR, tone: 0.08, rim: 0.45 }, t);
}
/** 小石头：一直看着她；她走近时跑过去，停在她前面一步远，仰着头让她摸头；然后跑回妈妈身边，转过身朝走过来的她挥手（她不从他身前走过，不挡住他） */
const T_KR0 = 13.25;
const T_KR1 = 14.05;
const T_BK0 = 14.75; // 跑回妈妈身边
const T_BK1 = 15.35;
const KID_STOP = qinX(T_KR1) - 72;
function kidX(t: number) {
  if (t < T_KR0) return KID0;
  if (t < T_KR1) return mix(KID0, KID_STOP, E.io(ph(t, T_KR0, T_KR1)));
  if (t < T_BK0) return KID_STOP;
  return mix(KID_STOP, KID0, E.io(ph(t, T_BK0, T_BK1)));
}
function kidFig(t: number): Fig {
  const running = (t > T_KR0 && t < T_KR1) || (t > T_BK0 && t < T_BK1);
  const g = walk(t * 3.0, running ? 0.55 : 0);
  const wave = ph(t, 15.4, 15.9);
  const waving = wave > 0 && wave < 1;
  const x = kidX(t);
  const facing = t > T_BK0 && t < T_BK1 ? -1 : 1;
  const kj = pose({ x, y: 0, kind: "kid", facing });
  const hand: Pt = [x + facing * (16 + Math.sin(t * 15) * 7), kj.top - 14];
  return {
    x,
    y: 0,
    kind: "kid",
    facing,
    lean: running ? 0.2 : 0,
    legL: g.legL,
    legR: g.legR,
    kneeL: g.kneeL,
    kneeR: g.kneeR,
    aL: running ? g.aL * 2 : -0.2,
    aR: running ? g.aR * 2 : 0.2,
    head: t > 13.7 && t < T_BK0 ? 0.8 : 0.35,
    hR: waving && facing === 1 ? hand : undefined,
    hL: waving && facing === -1 ? hand : undefined,
    eyes: t > 13.6 ? "smile" : "open",
    tone: 0.04,
    rim: 0.6,
  };
}
function kidAndMom(c: C, t: number) {
  // 妈妈撑着伞站在家门口，看着儿子跑过去（只是背景，不和她打招呼）
  const watch = E.io(ph(t, 13.4, 13.8));
  figure(c, { x: MOM_X, y: 0, kind: "woman", facing: 1, head: -0.5 + 0.4 * watch, umbrella: true, umbrellaColor: "#7d8fd6", aL: -0.5, bendL: -1.6, aR: 0.2, tone: 0.1, rim: 0.45 }, t);
  figure(c, kidFig(t), t);
}
/** 打伞低头走路的人（周磊飘在头顶上，没人抬头），和路边打伞低着头的人 */
function walkers(c: C, t: number) {
  const x = ZX - 60 - 120 * (t - 4.0);
  const g = walk(t * 1.6, 0.32);
  figure(c, { x, y: 0, s: 0.95, kind: "plain", facing: -1, head: -0.7, legL: g.legL, legR: g.legR, kneeL: g.kneeL, kneeR: g.kneeR, umbrella: true, umbrellaColor: UMBRELLAS[4], look: crowdLook(13), aL: -0.5, bendL: -1.6, tie: false, tone: 0.2, rim: 0.35 }, t);
  figure(c, { x: P2X, y: 0, s: 0.97, kind: "man", facing: 1, head: -0.7, umbrella: true, umbrellaColor: UMBRELLAS[1], look: crowdLook(21), aL: -0.5, bendL: -1.6, tie: false, tone: 0.15, rim: 0.4 }, t);
}
/** 街上的人（主歌一第一镜也画，镜头摇走之前他们还在） */
export function introStreetLife(c: C, t: number) {
  laoZhong(c, t);
  walkers(c, t);
  weigher(c, t);
  kidAndMom(c, t);
}
/** 脚下扬起的灰：她的脚步、铁靴砸下来、起跳、落地 */
function puffs(c: C, t: number) {
  c.save();
  c.fillStyle = PAL.ash;
  const steps = [11.013, 11.513, 12.013, 12.513, 13.013, 13.513, 14.013, 15.013, 15.513];
  for (const b of steps) {
    const u = t - b;
    if (u < 0 || u > 0.5) continue;
    const x = qinX(b);
    c.globalAlpha = 0.8 * (1 - u / 0.5);
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.ellipse(x - 30 + i * 15 + (i - 2) * u * 50, FRONT - 4 - u * 30 * (1 + (i % 2)), 7 + u * 14, 4 + u * 7, 0, 0, Math.PI * 2);
      c.fill();
    }
  }
  const ring = (at: number, x: number, size: number, dur: number) => {
    const u = t - at;
    if (u < 0 || u > dur) return;
    c.globalAlpha = 0.85 * (1 - u / dur);
    for (let i = 0; i < 14; i++) {
      const a = (i / 13) * Math.PI;
      const r = 20 + u * size * (0.7 + (i % 3) * 0.2);
      c.beginPath();
      c.ellipse(x + Math.cos(a) * r * 1.4, FRONT - 6 - Math.sin(a) * r * 0.25 - u * 20, 10 + u * 26, 6 + u * 12, 0, 0, Math.PI * 2);
      c.fill();
    }
  };
  ring(T_BOOT, QS0 - 14, 120, 0.6);
  ring(T_JUMP, QS0, 90, 0.5);
  ring(T_LAND, X_L - 10, 220, 0.9);
  c.restore();
}

// ---------- 背景：天、五颜六色的强光、城、她住的那栋楼、临街的房子、网、地面 ----------
function introStreet(c: C, k: Cam, t: number, blurPx: number) {
  const draw = (c: C) => {
    sky(c, k);
    whiteBand(c, k, t, 1, 1);
    city(c, k, { layers: [0, 1, 2] });
    c.save();
    applyCam(c, k);
    if (k.x - W / 2 / k.z < TOWER_X + 520) {
      c.save();
      c.translate(TOWER_X, 0);
      tower(c, {});
      c.restore();
    }
    facades(c, k, {});
    net(c, -5200, 5200, -1350, t, [-140, 140]);
    net(c, -5200, 5200, -2300, t, [300, 520]);
    ground(c, k, {});
    c.restore();
  };
  if (blurPx < 0.3) return draw(c);
  const B = buf(2);
  draw(B.c);
  blit(c, B, 1, `blur(${(blurPx * env.width) / W}px)`);
}

// ---------- 镜头（一镜到底） ----------
/** 把世界里的一点放到画面上的某个位置 */
const aim = (p: Pt, s: Pt, z: number): Cam => ({ x: p[0] - (s[0] - W / 2) / z, y: p[1] - (s[1] - H / 2) / z, z });
const toScreen = (k: Cam, p: Pt): Pt => [(p[0] - k.x) * k.z + W / 2, (p[1] - k.y) * k.z + H / 2];
// ① 贴近她：脸在画面偏上，头顶是强光；整个人在设定字的上面
const S_CLOSE: Pt = [540, 700];
const Z_CLOSE = 3.7;
// ② 全景：那团灰缩到天边，整座城在下面铺开，左边是她住的那栋最高的楼
const S_WIDE: Pt = [500, 70];
const Z_WIDE = 0.24;
// ③ 周磊：胸口放在画面这里
const S_ZHOU: Pt = [560, 900];
const Z_ZHOU = 1.95;
// ④ 公文包落地、她的铁靴：贴着地面（称重员的靴子刚走出画面左边）
const LOW: Cam = { x: QS0 + 6, y: -40, z: 4.0 };
// ⑤ 两个人同框：她在下面仰着头，他在上面
const zhouHeadY = (t: number) => FRONT - zhouH(t) - 185;
const TWO = (t: number): Cam => ({ x: (QS0 + ZX) / 2 + 5, y: (FRONT + zhouHeadY(t)) / 2 - 30, z: 1.72 });
/** ⑤ 跟着两个人跳起、落下：稍微落后一点（惯性） */
function actionCam(t: number): Cam {
  const s = t - 0.06;
  const zj = pose(zhouFig(s));
  return { x: mix(qinX(s), zj.hip[0], 0.45) - 10, y: mix(FRONT - qinH(s) - 110, zj.hip[1], 0.4) - 20, z: 1.85 };
}
function revealCam(t: number): Cam {
  // 往后拉、往下沉：那团灰从画面中间滑到天边；拉到全景后再极慢地退一点（喘口气，看清这座城）
  const e = E.io(ph(t, REVEAL0, REVEAL1));
  const drift = ph(t, REVEAL1, DIVE0);
  const z = Math.exp(mix(Math.log(2.9), Math.log(Z_WIDE), e)) * (1 - 0.03 * drift);
  return aim(BURN, [mix(S_CLOSE[0], S_WIDE[0], e) + 14 * drift, mix(S_CLOSE[1], S_WIDE[1], e)], z);
}
const WIDE_END = revealCam(DIVE0);
const ZHOU_FROM = toScreen(WIDE_END, zhouChest(DIVE0));
function zhouCam(t: number): Cam {
  if (t < T_ZHOU) {
    // 扎下去：先往下摇（他从画面底下升上来），再越推越快（被吸进去），落点冲过一点
    const e = ph(t, DIVE0, T_ZHOU);
    const z = Math.exp(mix(Math.log(WIDE_END.z), Math.log(Z_ZHOU * 1.035), Math.pow(e, 2.2)));
    const es = E.io(e);
    return aim(zhouChest(t), [mix(ZHOU_FROM[0], S_ZHOU[0], es), mix(ZHOU_FROM[1], S_ZHOU[1], es)], z);
  }
  // 稳住，然后直直地慢慢逼近（紧张）
  const settle = E.out(ph(t, T_ZHOU, T_ZHOU + 0.25));
  const z = mix(Z_ZHOU * 1.035, Z_ZHOU, settle) + 0.15 * ph(t, T_ZHOU + 0.25, T_DROP);
  return aim(zhouChest(t), S_ZHOU, z);
}
const DROP_FROM = zhouCam(T_DROP);
const BRIEF_S0 = toScreen(DROP_FROM, BRIEF0);
const BRIEF_S1 = toScreen(LOW, BRIEF_REST);
let emoKeys: CamKey[] | null = null;
function emoCam(t: number): Cam {
  emoKeys ??= [
    [B_KNEEL, actionCam(B_KNEEL), E.soft], // 慢慢落到她的靴子上
    [B_PULL, { x: QL - 32, y: -46, z: 3.4 }, E.soft], // 跟着砖往上走
    [B_GIVE, { x: (QL + ZK) / 2 - 4, y: -76, z: 4.1 }, E.out], // 砖落进他手里：越推越慢
    [B_STAND, { x: (QL + ZK) / 2 - 6, y: -82, z: 4.8 }, E.soft], // 他哭着笑了：往后舒一口气
    [T_UP, { x: (QL + ZK) / 2 - 30, y: -120, z: 3.6 }],
  ];
  return kcam(t, emoKeys);
}
// ⑦ 跟着她走；每个人和她打招呼时，镜头挪到两个人中间，把两个人框在一起
const FOLLOW = (t: number): Cam => ({ x: qinX(t) - 120, y: -250, z: 1.9 });
const G_ZHOU = (t: number): Cam => ({ x: mix(qinX(t), ZK, 0.5) - 50, y: -190, z: 2.3 });
const G_LAO = (t: number): Cam => ({ x: mix(qinX(t), LAO_X, 0.5) - 10, y: -300, z: 2.15 });
const G_KID = (t: number): Cam => ({ x: mix(qinX(t), kidX(t), 0.5) - 30, y: -190, z: 2.35 });
/** 前奏最后一刻的镜头：主歌一第一镜从这里接着往左摇 */
export const INTRO_END: Cam = { x: qinX(15.9) - 100, y: -300, z: 1.8 }; // 头顶的网停在字幕上面
function walkCam(t: number): Cam {
  // 她起身：镜头退开，跟着她走过周磊（肩上按一下）
  let k = camLerp(emoCam(T_UP), G_ZHOU(t), E.io(ph(t, T_UP, T_UP + 0.7)));
  k = camLerp(k, FOLLOW(t), E.io(ph(t, 11.85, 12.45)));
  k = camLerp(k, G_LAO(t), win(t, 12.25, 12.6, 13.35, 13.7));
  k = camLerp(k, G_KID(t), win(t, 13.5, 13.85, 14.55, 14.9));
  // 最后镜头慢慢升起来、往前带（余韵），把妈妈、小石头和她框在一起，交给主歌一
  return camLerp(k, INTRO_END, E.io(ph(t, 14.7, 15.9)));
}
function camIntro(t: number): Cam {
  if (t < TOUCH) return { ...aim(riserChest(t), S_CLOSE, Z_CLOSE * (1 + 0.03 * ph(t, 0, TOUCH))), r: -0.03 }; // 屏着气，几乎不动
  if (t < REVEAL0) {
    // 被光推开，歪着的画面回正
    const e = E.out(ph(t, TOUCH, REVEAL0));
    return { ...aim(BURN, S_CLOSE, mix(Z_CLOSE * 1.03, 2.9, e)), r: -0.03 * (1 - e) };
  }
  if (t < DIVE0) return revealCam(t);
  if (t < T_DROP) return zhouCam(t);
  if (t < T_BOOT) {
    // 跟着公文包往下坠（越落越快），落地那一下停住
    const e = E.in2(ph(t, T_DROP, T_BOOT));
    const z = Math.exp(mix(Math.log(DROP_FROM.z), Math.log(LOW.z), e));
    return aim(briefPos(t), lerpPt(BRIEF_S0, BRIEF_S1, e), z);
  }
  if (t < 6.15) return LOW;
  if (t < 6.85) return camLerp(LOW, TWO(t), E.soft(ph(t, 6.15, 6.85))); // 从铁靴往上抬，露出仰着头的她，再到他
  if (t < T_JUMP - 0.05) {
    const k = TWO(t);
    return { ...k, z: k.z * (1 + 0.035 * E.io(ph(t, 6.85, T_JUMP))) }; // 她一蹲：镜头跟着凑近半步
  }
  if (t < B_KNEEL) {
    const k0 = TWO(T_JUMP - 0.05);
    return camLerp({ ...k0, z: k0.z * 1.035 }, actionCam(t), E.io(ph(t, T_JUMP - 0.05, T_JUMP + 0.25)));
  }
  if (t < T_UP) return emoCam(t);
  return walkCam(t);
}
/** 震：铁靴砸地、起跳、抓住、落地、膝盖着地 */
function impact(t: number, k: Cam): Cam {
  const a = kick(t, T_LAND, 0.12);
  const b = kick(t, T_BOOT, 0.1);
  const s = shake(t, 24 * kick(t, T_LAND, 0.11) + 13 * kick(t, T_BOOT, 0.09) + 9 * kick(t, T_KNEE, 0.1) + 6 * kick(t, T_GRAB, 0.08) + 5 * kick(t, T_JUMP, 0.08), 3);
  return jolt({ ...k, z: k.z * (1 + 0.05 * a + 0.03 * b), y: k.y - (14 * a + 8 * b) / k.z }, s);
}

// ---------- 一镜到底 0–15.9 ----------
const HOOK = ["这里的人，一绝望就会飘起来", "飘进天上的强光，就会化成灰"];
const s01: Shot = {
  a: 0,
  b: 15.9,
  draw(c, t) {
    const k = impact(t, camIntro(t));
    const prev = camIntro(t - 1 / 60);
    // 跟着公文包往下坠的最后一段：竖着糊一点
    const vV = t > T_DROP + 0.2 && t < T_BOOT ? Math.abs((k.y - prev.y) * k.z) : 0;
    const blurPx = 2.6 * E.io(ph(t, 9.2, 10.0)) * (1 - E.io(ph(t, T_UP, T_UP + 0.6)));
    const scene = (c: C) => {
      introStreet(c, k, t, blurPx);
      c.save();
      applyCam(c, k);
      if (t < DIVE0 + 1) {
        riserDraw(c, t);
        dustCloud(c, t);
        touchFlash(c, t);
        floaters(c, k, t);
        farBurn(c, t, 2.3, RX + 1700);
      }
      introStreetLife(c, t);
      briefcase(c, t);
      crack(c, QS0 - 16, FRONT, 80, ph(t, T_BOOT, T_BOOT + 0.18));
      crack(c, QS0 + 6, FRONT, 50, ph(t, T_JUMP, T_JUMP + 0.15) * 0.8);
      crack(c, X_L - 14, FRONT, 130, ph(t, T_LAND, T_LAND + 0.22));
      crack(c, X_L + 26, FRONT, 70, ph(t, T_LAND + 0.03, T_LAND + 0.2));
      crack(c, ZK + 40, FRONT, 50, ph(t, T_KNEE, T_KNEE + 0.15) * 0.7);
      const br = brickAt(t);
      if (br && t < B_PULL + 0.15) stone(c, br.p[0], br.p[1], BR, "活下去", br.warm, br.rot);
      // 起身以后她从周磊身后绕过去：先画她，他挡在前面
      const behind = t > 11.1;
      if (behind) figure(c, qinFig(t), t);
      const zj = figure(c, zhouFig(t), t);
      if (t < T_LAND) cutRope(c, zj.anR, t, 40); // 他脚踝上也拖着一截割断的红绳
      if (!behind) figure(c, qinFig(t), t);
      if (br && t >= B_PULL + 0.15) stone(c, br.p[0], br.p[1], BR, "活下去", br.warm, br.rot);
      puffs(c, t);
      c.restore();
    };
    if (vV > 2) smearV(c, vV * 0.7, scene);
    else scene(c);
    ash(c, t, k, { n: 0.5 });
    // 砖落进他手里：暖光涌上来，暗角松开
    const warm = win(t, B_GIVE, B_GIVE + 0.55, T_UP + 0.1, T_UP + 0.9);
    if (warm > 0.01) {
      const b = brickAt(Math.min(t, T_UP));
      if (b) {
        const sp = toScreen(k, b.p);
        const g = c.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], 640);
        g.addColorStop(0, `rgba(${PAL.warmRGB},${0.32 * warm})`);
        g.addColorStop(1, `rgba(${PAL.warmRGB},0)`);
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
      }
    }
    vignette(c, t < DIVE0 ? 0.25 : 0.35 - 0.2 * warm);
    flash(c, 0.45 * kick(t, TOUCH, 0.12), "#fff8ee");
    // 世界的核心设定：首帧就在，城铺开以后退场
    const ha = 1 - ph(t, 2.85, 3.15);
    HOOK.forEach((s, i) => text(c, s, W / 2, 1390 + i * 96, 60, { shadow: 20, weight: 800, alpha: ha }));
    // 她一出现就上，一直到前奏结束
    caption(c, ["城里都说，", "她是最沉的人"], t, 6.55, 15.9, 260, 64); // 镜头从铁靴抬上去、周磊的头过了字的位置再上
  },
};

export const introShots: Shot[] = [s01];
