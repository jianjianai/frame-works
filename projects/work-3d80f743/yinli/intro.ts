// 前奏 0:00–0:15.9（无人声），一镜到底，运镜是这一段的魂。顺序（用户 2026-10-15 第四次定）：化成灰 → 救人 → 整座城 → 哑铃店
// ① 0–1.15 化成灰：首帧就贴在一个人身上——张着手、闭着眼笑，眼泪往上飘，脚踝上一截割断的红绳；镜头屏着气几乎不动；
//    0.513 她碰到强光，五颜六色的光圈炸开，她从头到脚化成灰，镜头被光推开、歪着的画面回正
// ② 1.15–2.013 坠：镜头像那团灰一样往下坠——先慢、越坠越快，楼和窗糊成一道道，再刹住，第 2 小节落在半空中又一个往上飘的人（周磊）身上（冲过一点再落回）
// ③ 2.013–4.013 他在往上飘：慢慢逼近；称重员低着头从他底下走过去，公文包从他指间滑下去，掉在称重员脚后跟，称重员头也不回；
//    画外的「咚、咚」越来越近；镜头跟着公文包往下坠——落地的同一拍（第 3 小节），一只铁靴砸在它旁边
// ④ 4.013–6.013 她：镜头从铁靴往上抬，她仰着头；两个人同框，她一蹲；跳起来在空中抓住他的脚踝，带着惯性落下来，铁靴砸裂石板（第 4 小节）
// ⑤ 6.3–8.9 活下去：不切，镜头落到她的靴子上、跟着砖走到他手里，越推越慢；他哭着笑了
// ⑥ 8.9–13.1 城里人和她打招呼，只两个人：她起身从周磊身后走开，他低头抱着砖；抬头看窗后的老钟，老钟举杯；
//    小石头跑过来停在她前面一步远，她弯腰摸摸他的头，他跑回妈妈身边转身朝她挥手
// ⑦ 12.7–16.013 整座城（小小的震撼）：镜头先慢慢升起来（余韵），再越拉越快往后、往上退出整座城，14.013（第 8 小节）停稳：
//    她小得看不见了，城上空到处是往上飘的人，离白越近飘得越快；一拍一个被白吸进去，炸开一圈彩色的光，化成灰落下来；
//    停一下，15.2 越扎越快扎向她住的那栋楼脚下的哑铃店，16.013 落在店门口（主歌一第一镜接着拍，镜头是同一个 cityCam）。
//    「城里都说，她是最沉的人」从她出现一直留到镜头开始往后拉
import { type C, type Cam, type CamKey, type Shot, W, H, E, ph, kcam, kick, shake, jolt, applyCam, camLerp, smearV, buf, blit, env, text, caption, vignette, flash, clamp, mix, seeded, sX, sY } from "./core";
import { figure, pose, stone, walk, rope, type Fig, type Joints, type Pt } from "./figure";
import { ash, crack, sky, whiteBand, city, net, ground, tower, WHITE } from "./world";
import { facades } from "./sets";
import { PAL, UMBRELLAS, crowdLook, blend, KID_MOM_LOOK } from "./palette";
import { SHOP, shopScene } from "./shop";
import { qin, qinJoints, kneelLegs, type QinStyle } from "./qin";

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

// ---------- 时间（卡在小节上：0.013、2.013、4.013、6.013……） ----------
const FRONT = 26; // 前排（她、周磊）脚底；街边的人站在 y=0
const TOUCH = 0.513; // ① 她碰到强光
const DROP0 = 1.15; // ② 往下坠
const T_ZHOU = 2.013; // 落在周磊身上（第 2 小节）
const T_BOOT = 4.013; // ③ 公文包落地、她的铁靴砸下来（第 3 小节）
const T_LAND = 6.013; // ④ 两个人落地（第 4 小节）
const T_KNEE = T_LAND + 0.25; // 他被拽下来，膝盖着地
// ⑤ 活下去
const B_KNEEL = 6.3;
const B_BOOT = 6.55;
const B_PULL = 6.85;
const B_TURN = 7.15;
const B_GIVE = 7.45;
const B_BACK = 7.6;
const B_LOOK = 7.95;
const B_STAND = 8.35;
const T_UP = 8.9; // ⑥ 她接着往前走
// ⑦ 整座城
const RISE0 = 12.7; // 镜头升起来
const T_CITY = 14.013; // 第一个人被白吸进去（第 8 小节）
const T_WIDE = 14.1; // 拉开、停稳
const T_DIVE = 15.2; // 扎向哑铃店
export const T_SHOP = 16.013; // 落在店门口（主歌一第 1 小节）

// ---------- 位置：周磊飘在 ZX；她从右边跑来，救下他以后往左走 ----------
const ZX = 30;
const zhouH = (t: number) => 255 + 30 * (t - 2.0); // 他的脚离地多高（一直在慢慢往上飘）
const QS0 = ZX + 60; // 她跑来停住的地方（铁靴砸下来）
const RUN_V = 450;
const SKID = 0.15;
const REACH = 204; // 她两手举过头，手离脚多高
const GRAV = 2700;
const GRAV2 = 1900; // 抓住以后两个人一起落（她连铁靴重，他在飘、轻）
const Y_G = zhouH(5.6) + 6 - REACH; // 抓住时她的脚离地多高（跳到最高点正好够到他的脚踝）
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
const RX = -425; // 化成灰的那个人（就在周磊头顶的天上：镜头从她那里直直坠下去）
const BR = 12; // 砖的大小

// ---------- 她的位置 ----------
const slowArea = (t: number) => {
  if (t < 12.0) return 0;
  if (t < 12.2) return (t - 12.0) ** 2 / 0.4;
  if (t < 12.6) return 0.1 + (t - 12.2);
  if (t < 12.8) return 0.5 + (t - 12.6) - (t - 12.6) ** 2 / 0.4;
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

// ---------- ⑦ 全城往上飘的人（这座城里天天都是这样）：② 往下坠时从镜头边上掠过，⑦ 拉开以后满天都是 ----------
// 慢慢飘的人：有的刚离开屋顶，有的已经很高。T_CITY 时在 (x, y)，每秒往上 v；s 越大越近（飘得也越快）。
// 远远看去像满天的灯，近了才看出是人。y 都在 -2600 以上：前面街上的镜头里看不见他们
const DRIFTERS = (() => {
  const r = seeded(77);
  const out = [
    { x: 150, y: -6400, v: 90, s: 1.3, seed: 43 }, // ② 坠的时候从镜头边上掠过
    { x: -620, y: -4100, v: 70, s: 1.3, seed: 45 },
  ];
  for (let i = 0; i < 22; i++) {
    const s = mix(0.9, 1.9, Math.pow(r(), 1.6));
    out.push({ x: mix(-3700, 1750, (i + r() * 0.8) / 22), y: mix(-8300, -2700, r()), v: 35 + 45 * s * (0.6 + r() * 0.6), s, seed: 60 + i });
  }
  return out;
})();
// 被白吸进去的人：离白越近飘得越快，at 碰到白，化成灰（一拍一个）。第一个在 ② 坠的时候就在镜头边上悬着
const BURSTS = [
  { at: T_CITY, x: -350, seed: 51, big: 1.25 },
  { at: 14.513, x: 920, seed: 52, big: 1 },
  { at: 15.013, x: -2950, seed: 53, big: 1 },
  { at: 15.263, x: -1200, seed: 54, big: 0.75 },
];
const Y_BURN = WHITE + 150;
/** 离碰到白还有多远：远的时候几乎悬着不动，越近越快（最后 1 秒冲上去） */
const suckH = (t: number, at: number) => 1500 * (1 - Math.exp(-(at - t) / 1.3));
const onScreen = (k: Cam, x: number, y: number, m = 260) => {
  const px = sX(k, x);
  const py = sY(k, y);
  return px > -m && px < W + m && py > -m && py < H + m;
};
function riserFig(t: number, x: number, y: number, seed: number, reach = 0, s = 1.3): Fig {
  return { x, y, s, grounded: false, kind: "plain", float: 0.9, tone: 0.2, rim: 0.6, aL: -1.6 - 0.8 * reach, aR: 1.7 + 0.7 * reach, head: 0.3 + 0.3 * reach, eyes: "closed", look: crowdLook(seed) };
}
/** 往上飘的人身上带着一团暖光：远看像一盏盏灯，近了才看出是人 */
function drawRiser(c: C, k: Cam, f: Fig, t: number) {
  const s = f.s ?? 1;
  const cy = f.y - 40 * s;
  const r = Math.max(80 * s, (34 * s) / k.z);
  const g = c.createRadialGradient(f.x, cy, 0, f.x, cy, r);
  g.addColorStop(0, "rgba(255,226,170,0.85)");
  g.addColorStop(0.35, "rgba(255,196,160,0.42)");
  g.addColorStop(1, "rgba(255,210,190,0)");
  c.fillStyle = g;
  c.fillRect(f.x - r, cy - r, r * 2, r * 2);
  figure(c, f, t);
}
/** 一个人碰到白：从头到脚化掉，炸开一圈圈彩色的光，灰散开、慢慢落下来（大小按画面像素算，全景里也看得清） */
function cityBurst(c: C, k: Cam, t: number, b: (typeof BURSTS)[number]) {
  const u = t - b.at;
  const x = b.x + Math.sin(Math.min(t, b.at) * 0.7 + b.seed) * 20;
  if (u < 0) {
    const y = Y_BURN + suckH(t, b.at);
    if (onScreen(k, x, y)) drawRiser(c, k, riserFig(t, x, y, b.seed, clamp(1 - (b.at - t) / 1.6), 1.5), t);
    return;
  }
  if (u > 4.5 || !onScreen(k, x, Y_BURN, 700)) return;
  const px = 1 / k.z;
  const f = riserFig(b.at, x, Y_BURN, b.seed, 1, 1.5);
  const j = pose(f);
  const p = lerpPt(j.head, j.hip, 0.4);
  c.save();
  if (u < 0.3) {
    const bot = Math.max(j.toeL[1], j.toeR[1]) + 10;
    const line = mix(j.top - 20, bot, E.in2(u / 0.3));
    c.save();
    c.beginPath();
    c.rect(x - 400, line, 800, 1200);
    c.clip();
    figure(c, f, b.at);
    c.restore();
    c.fillStyle = "rgba(255,236,200,0.95)";
    c.fillRect(x - 70, line - 8, 140, 16);
  }
  if (u < 1.1) {
    const sp = 1 - Math.exp(-u * 3.2); // 光圈冲出去、越散越慢
    HOT.forEach((col, i) => {
      c.strokeStyle = col;
      c.globalAlpha = 0.85 * (1 - u / 1.1);
      c.lineWidth = (4 + u * 9) * b.big * px;
      c.beginPath();
      c.arc(p[0], p[1], (12 + sp * 330 * b.big * (1 + i * 0.1)) * px, 0, Math.PI * 2);
      c.stroke();
    });
    c.globalAlpha = 1;
    const R = (40 + sp * 380 * b.big) * px;
    const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], R);
    g.addColorStop(0, `rgba(255,252,240,${1 - u / 1.1})`);
    g.addColorStop(1, "rgba(255,240,220,0)");
    c.fillStyle = g;
    c.fillRect(p[0] - R, p[1] - R, R * 2, R * 2);
  }
  for (let i = 0; i < 40; i++) {
    const a = (i * 2.399) % 6.283;
    const r = (14 + (i % 7) * 12) * b.big * px * (1 - Math.exp(-u * 2.4));
    const ax = p[0] + Math.cos(a) * r + Math.sin(u * 1.7 + i) * 4 * px;
    const ay = p[1] + Math.sin(a) * r * 0.55 + u * 170 + u * u * 30;
    c.globalAlpha = clamp(1.5 - u * 0.35);
    c.fillStyle = blend("#c6aecb", HOT[i % 6], clamp(1 - u / 0.6));
    c.beginPath();
    c.arc(ax, ay, (1.6 + (i % 3) * 0.8) * px, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
function cityRisers(c: C, k: Cam, t: number) {
  for (const f of DRIFTERS) {
    const x = f.x + Math.sin(t * 0.7 + f.seed) * 20;
    const y = f.y - f.v * (t - T_CITY);
    if (onScreen(k, x, y)) drawRiser(c, k, riserFig(t, x, y, f.seed, 0, f.s), t);
  }
  for (const b of BURSTS) cityBurst(c, k, t, b);
}
/** 有人碰到白的那一下：白亮一下，整个画面跟着亮一下 */
const burstPulse = (t: number, decay: number) => BURSTS.reduce((s, b) => s + b.big * kick(t, b.at, decay), 0);

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
  const recv = E.io(ph(t, 7.0, 7.35));
  const look = E.io(ph(t, B_LOOK, B_LOOK + 0.4));
  const slump = E.io(ph(t, 9.7, 10.2));
  const y = mix(FRONT - 37 + bounce, FRONT - 22, slump);
  const hands: Pt = [ZK + 31, mix(FRONT - 70, y - 22, slump) + brickDip(t)];
  const down = E.io(ph(t, 9.7, 10.2)); // 她走了，他低头看着怀里的砖
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
    eyes: t < 7.0 ? "wide" : look > 0.5 ? "smile" : "open",
    tears: look > 0.3 ? 1 : 0,
  };
}
const zhouChest = (t: number): Pt => chest(pose(zhouFig(t)));

// ---------- 公文包：从他指间滑下去，按重力往下掉，落地正好在第 4 小节（她的铁靴同一拍砸下来） ----------
const BRIEF_REST: Pt = [ZX + 2, FRONT - 9]; // 落在她铁靴落点的左边一点，砸下来时看得见
const handAt = (t: number) => pose({ ...zhouFig(t), bag: true }).handR;
// 松手的时间按他手的高度反推：从那里自由落体，正好在 T_BOOT 落地
let T_DROP = 3.5;
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
/** 单膝跪下掏砖：前面立着的是远侧那条腿，砖从它的靴筒里抽出来 */
const kneelCt = (w: number): QinStyle => ({ legs: kneelLegs(w) });
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
    const w = walk((t - 2.5) * 2.4, 0.78);
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
    const crouch = E.io(ph(t, 4.85, T_JUMP));
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
    const f: Fig = { ...base, y: FRONT, lean: mix(-0.1, -0.42, kneel), legL: mix(-0.35, -1.35, kneel), kneeL: mix(0.6, 1.35, kneel), legR: mix(0.4, 0.35, kneel), kneeR: mix(0.6, 1.25, kneel), aR: 0.35, bendR: -0.4, head: -0.3, eyes: "open", ct: kneelCt(kneel) };
    // 靴筒口：跪稳以后前面那只靴子（秤砣远侧的腿）的位置
    const fj = qinJoints({ ...f, ct: kneelCt(1) });
    const bootTop: Pt = [fj.anL[0] - 2, fj.anL[1] - 20];
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
    return { ...f, hL: hand, head: mix(-0.3, 0.05, lookHim), eyes: t > B_GIVE + 0.05 ? "smile" : "open", ct: { ...kneelCt(kneel), layerFar: "front", handFar: t > B_GIVE ? "flat" : "grip", expression: t > B_GIVE + 0.05 ? "微笑" : t > B_TURN ? "心疼" : "低头看" } };
  }
  if (t < T_UP) {
    // 冲他笑了一下，站起来。伏笔：送出一块砖，她轻了——站起来时脚跟离地了一下
    const st = E.io(ph(t, B_STAND, B_STAND + 0.5));
    return { ...base, y: FRONT - 11 * Math.sin(Math.PI * ph(t, B_STAND + 0.38, B_STAND + 0.6)), lean: mix(-0.42, 0.04, st), legL: mix(-1.35, -0.1, st), kneeL: mix(1.35, 0.15, st), legR: mix(0.35, 0.1, st), kneeR: mix(1.25, 0.15, st), aL: -0.15, aR: 0.2, head: mix(0.05, -0.1, st), eyes: "smile", ct: kneelCt(1 - st) };
  }
  // 往前走，只和两个人打招呼：抬头看窗后的老钟，抬手、点头；弯腰摸摸跑过来的小石头的头
  const f = qinWalkAt(t);
  const toLao = win(t, 10.5, 10.75, 11.25, 11.5);
  const lift = Math.sin(Math.PI * ph(t, 10.65, 11.2));
  const nodL = Math.sin(Math.PI * ph(t, 10.9, 11.2));
  const pat = win(t, 12.05, 12.2, 12.4, 12.55);
  let hL: Pt | undefined;
  if (pat > 0.02) {
    const kj = pose(kidFig(t));
    hL = lerpPt([f.x - 10, f.y - 90], [kj.head[0] + 2, kj.top + 3 + Math.sin(t * 14) * 3], pat);
  } else if (lift > 0.02) hL = lerpPt([f.x - 10, f.y - 90], [f.x - 16 + Math.sin(t * 12) * 4, f.y - 178], lift);
  return {
    ...f,
    y: f.y - 12 * win(t, 9.0, 9.3, 9.85, 10.15), // 往里让一步，绕到他身后
    lean: 0.06 - 0.3 * pat, // 隔着一步远弯下腰去够他的头（两个人不叠在一起）
    aL: hL ? undefined : f.aL,
    hL,
    head: 0.05 + 0.5 * toLao - 0.3 * nodL - 0.45 * pat,
    eyes: toLao > 0.3 || pat > 0.3 ? "smile" : "open",
    // 朝窗后的老钟挥手：远侧的手举过头（素材库「挥手」），近侧的手会横过脸
    ct: { arms: { far: [138 + 8 * Math.sin(t * 12), 38, 8], w: lift }, handFar: lift > 0.25 ? "open" : pat > 0.3 ? "flat" : undefined },
  };
}

/** 那块砖：她从靴筒里竖着抽出来，转平了递过去，落进他手里变暖 */
function brickAt(t: number): { p: Pt; rot: number; warm: number } | null {
  if (t < B_PULL) return null;
  if (t < B_GIVE) {
    const h = qinJoints(qinFig(t), t).handL;
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
  const up = win(t, 10.45, 10.8, 11.5, 11.85);
  const j = figure(c, { x: LAO_X, y: -230, kind: "old", facing: 1, head: -0.1 + 0.3 * up, aR: 1.2 + up * 0.9, bendR: -1.4 - up * 0.4, tone: 0.05, stone: 0.7, rim: 0.5, eyes: up > 0.2 ? "smile" : "open" }, t);
  cup(c, j.handR[0], j.handR[1]);
  c.fillStyle = "#eef5ea";
  c.fillRect(LAO_X - 92, -232, 184, 10);
}
/** 称重员：全城最厚的铁靴。周磊飘在头顶上，他低着头从底下走过去，公文包掉在他脚后跟，他头也不回——和全城的人一样不抬头 */
function weigher(c: C, t: number) {
  if (t > 8) return; // 走出画面以后拐进了巷子（不再走进后面的全城和哑铃店）
  const g = walk(t * 1.6, 0.3);
  figure(c, { x: ZX + 140 - 120 * (t - 2.0), y: 0, kind: "weigher", facing: -1, head: -0.75, legL: g.legL, legR: g.legR, kneeL: g.kneeL, kneeR: g.kneeR, aL: g.aL, aR: g.aR, tone: 0.08, rim: 0.45 }, t);
}
/** 小石头：一直看着她；她走近时跑过去，停在她前面一步远，仰着头让她摸头；然后跑回妈妈身边，转过身朝走过来的她挥手（她不从他身前走过，不挡住他） */
const T_KR0 = 11.25;
const T_KR1 = 12.05;
const T_BK0 = 12.6; // 跑回妈妈身边
const T_BK1 = 13.1;
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
  const wave = ph(t, 13.15, 14.4); // 镜头升起来的时候还在挥手
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
    head: t > 11.7 && t < T_BK0 ? 0.8 : 0.35,
    hR: waving && facing === 1 ? hand : undefined,
    hL: waving && facing === -1 ? hand : undefined,
    eyes: t > 11.6 ? "smile" : "open",
    tone: 0.04,
    rim: 0.6,
  };
}
function kidAndMom(c: C, t: number) {
  // 妈妈撑着伞站在家门口，看着儿子跑过去（只是背景，不和她打招呼）
  const watch = E.io(ph(t, 11.4, 11.8));
  figure(c, { x: MOM_X, y: 0, kind: "woman", look: KID_MOM_LOOK, facing: 1, head: -0.5 + 0.4 * watch, umbrella: true, umbrellaColor: "#7d8fd6", aL: -0.5, bendL: -1.6, aR: 0.2, tone: 0.1, rim: 0.45 }, t);
  figure(c, kidFig(t), t);
}
/** 打伞低头走路的人（周磊飘在头顶上，没人抬头），和路边打伞低着头的人 */
function walkers(c: C, t: number) {
  const x = ZX - 60 - 120 * (t - 2.0);
  const g = walk(t * 1.6, 0.32);
  if (t < 8) figure(c, { x, y: 0, s: 0.95, kind: "plain", facing: -1, head: -0.7, legL: g.legL, legR: g.legR, kneeL: g.kneeL, kneeR: g.kneeR, umbrella: true, umbrellaColor: UMBRELLAS[4], look: crowdLook(13), aL: -0.5, bendL: -1.6, tie: false, tone: 0.2, rim: 0.35 }, t);
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
  const steps = [9.013, 9.513, 10.013, 10.513, 11.013, 11.513, 12.013, 13.013, 13.513];
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

// ---------- 背景：天、五颜六色的强光、城、临街的房子、网、地面、她住的那栋楼和楼脚下的哑铃店 ----------
// 画的顺序和主歌一第一镜（verse1 的 s05）一样：镜头从全城扎进哑铃店，跨过 15.9 时画面不跳
function introStreet(c: C, k: Cam, t: number, blurPx: number) {
  const draw = (c: C) => {
    sky(c, k);
    whiteBand(c, k, t, 1 + 0.8 * burstPulse(t, 0.35), 1);
    city(c, k, { layers: [0, 1, 2] });
    c.save();
    applyCam(c, k);
    facades(c, k, {});
    net(c, -5200, 5200, -1350, t, [-140, 140]);
    net(c, -5200, 5200, -2300, t, [300, 520]);
    ground(c, k, {});
    if (k.x - W / 2 / k.z < TOWER_X + 520) {
      c.save();
      c.translate(TOWER_X, 0);
      tower(c, {});
      c.restore();
      shopScene(c, t);
    }
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
// ② 坠：像那团灰一样往下掉。先慢（灰刚开始落），越坠越快，中间退开一点、楼和窗糊成一道道（只看得见很高、很深，整座城留到最后），
//    快到他时刹住，冲过一点（他在画面上偏高 OVR），再落回来
const PUSHED = aim(BURN, S_CLOSE, 2.9); // 被光推开以后的取景
const OVR = 70;
function dropCam(t: number): Cam {
  const x = ph(t, DROP0, T_ZHOU);
  const k = camLerp(PUSHED, aim(zhouChest(t), [S_ZHOU[0], S_ZHOU[1] - OVR], Z_ZHOU * 1.035), E.io(x));
  return { ...k, z: k.z * Math.exp(-0.8 * Math.sin(Math.PI * x)) };
}
function zhouCam(t: number): Cam {
  // 稳住（冲过的那一点落回来），然后直直地慢慢逼近（紧张）
  const settle = E.out(ph(t, T_ZHOU, T_ZHOU + 0.3));
  const z = mix(Z_ZHOU * 1.035, Z_ZHOU, settle) + 0.15 * ph(t, T_ZHOU + 0.3, T_DROP);
  return aim(zhouChest(t), [S_ZHOU[0], S_ZHOU[1] - OVR * (1 - settle)], z);
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
function walkCam(t: number): Cam {
  // 她起身：镜头退开，跟着她走过周磊（肩上按一下）
  let k = camLerp(emoCam(T_UP), G_ZHOU(t), E.io(ph(t, T_UP, T_UP + 0.7)));
  k = camLerp(k, FOLLOW(t), E.io(ph(t, 9.85, 10.45)));
  k = camLerp(k, G_LAO(t), win(t, 10.25, 10.6, 11.35, 11.7));
  return camLerp(k, G_KID(t), win(t, 11.5, 11.85, 12.55, 12.9));
}
// ⑦ 整座城：竖着一整条，从白一直到街面；她住的那栋最高的楼在左边，楼顶差一点就碰到白，楼脚下是哑铃店；她在右边的街上，小得看不见
const WIDE: Cam = { x: -1000, y: -4895, z: 0.19 };
const RISE_P: Pt = [mix(qinX(13.1), MOM_X, 0.5), -60]; // 她和小石头母子之间的街面：往后拉时它滑到画面最底下
/** 升起来、往后拉：先慢慢升（小石头还在挥手），越拉越快，楼顶、网、满天往上飘的人一层层露出来，14.1 停稳 */
function riseCam(t: number): Cam {
  const k0 = walkCam(t);
  const e = E.io(Math.pow(ph(t, RISE0, T_WIDE), 1.5));
  return aim(RISE_P, lerpPt(toScreen(k0, RISE_P), toScreen(WIDE, RISE_P), e), Math.exp(mix(Math.log(k0.z), Math.log(WIDE.z), e)));
}
const SHOP_DOOR: Pt = [SHOP + 20, -330]; // 主歌一第一镜的取景中心（店门口）
const SHOP_FROM = toScreen(WIDE, SHOP_DOOR);
/** 前奏结尾的镜头（主歌一第一镜在 T_SHOP 之前也用它）：升起来拉出整座城 → 停一下、极慢地往她那栋楼脚下凑 → 越扎越快扎进哑铃店门口，冲过一点 */
export function cityCam(t: number): Cam {
  if (t < T_WIDE) return riseCam(t);
  const z0 = WIDE.z * (1 + 0.025 * ph(t, T_WIDE, T_DIVE));
  const e = Math.pow(ph(t, T_DIVE, T_SHOP), 2.2);
  return aim(SHOP_DOOR, lerpPt(SHOP_FROM, [W / 2, H / 2], e), Math.exp(mix(Math.log(z0), Math.log(1.6 * 1.04), e)));
}
function camIntro(t: number): Cam {
  if (t < TOUCH) return { ...aim(riserChest(t), S_CLOSE, Z_CLOSE * (1 + 0.03 * ph(t, 0, TOUCH))), r: -0.03 }; // 屏着气，几乎不动
  if (t < DROP0) {
    // 被光推开，歪着的画面回正
    const e = E.out(ph(t, TOUCH, DROP0));
    return { ...aim(BURN, S_CLOSE, mix(Z_CLOSE * 1.03, 2.9, e)), r: -0.03 * (1 - e) };
  }
  if (t < T_ZHOU) return dropCam(t);
  if (t < T_DROP) return zhouCam(t);
  if (t < T_BOOT) {
    // 跟着公文包往下坠（越落越快），落地那一下停住
    const e = E.in2(ph(t, T_DROP, T_BOOT));
    const z = Math.exp(mix(Math.log(DROP_FROM.z), Math.log(LOW.z), e));
    return aim(briefPos(t), lerpPt(BRIEF_S0, BRIEF_S1, e), z);
  }
  if (t < 4.15) return LOW;
  if (t < 4.85) return camLerp(LOW, TWO(t), E.soft(ph(t, 4.15, 4.85))); // 从铁靴往上抬，露出仰着头的她，再到他
  if (t < T_JUMP - 0.05) {
    const k = TWO(t);
    return { ...k, z: k.z * (1 + 0.035 * E.io(ph(t, 4.85, T_JUMP))) }; // 她一蹲：镜头跟着凑近半步
  }
  if (t < B_KNEEL) {
    const k0 = TWO(T_JUMP - 0.05);
    return camLerp({ ...k0, z: k0.z * 1.035 }, actionCam(t), E.io(ph(t, T_JUMP - 0.05, T_JUMP + 0.25)));
  }
  if (t < T_UP) return emoCam(t);
  if (t < RISE0) return walkCam(t);
  return cityCam(t);
}
/** 震：铁靴砸地、起跳、抓住、落地、膝盖着地；全城第一个人碰到白的那一下，镜头一惊（凑近一点点） */
function impact(t: number, k: Cam): Cam {
  const a = kick(t, T_LAND, 0.12);
  const b = kick(t, T_BOOT, 0.1);
  const s = shake(t, 24 * kick(t, T_LAND, 0.11) + 13 * kick(t, T_BOOT, 0.09) + 9 * kick(t, T_KNEE, 0.1) + 6 * kick(t, T_GRAB, 0.08) + 5 * kick(t, T_JUMP, 0.08), 3);
  return jolt({ ...k, z: k.z * (1 + 0.05 * a + 0.03 * b + 0.018 * kick(t, T_CITY, 0.2)), y: k.y - (14 * a + 8 * b) / k.z }, s);
}

// ---------- 一镜到底 0–15.9 ----------
const HOOK = ["这里的人，一绝望就会飘起来", "飘进天上的强光，就会化成灰"];
const s01: Shot = {
  a: 0,
  b: 15.9,
  draw(c, t) {
    const k = impact(t, camIntro(t));
    const prev = camIntro(t - 1 / 60);
    // 往下坠、跟着公文包往下坠的最后一段：竖着糊
    const vV = (t > DROP0 && t < T_ZHOU) || (t > T_DROP + 0.2 && t < T_BOOT) ? Math.abs((k.y - prev.y) * k.z) : 0;
    const blurPx = 2.6 * E.io(ph(t, 7.2, 8.0)) * (1 - E.io(ph(t, T_UP, T_UP + 0.6)));
    const scene = (c: C) => {
      introStreet(c, k, t, blurPx);
      c.save();
      applyCam(c, k);
      if (t < 4) {
        riserDraw(c, t);
        dustCloud(c, t);
        touchFlash(c, t);
      }
      cityRisers(c, k, t);
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
      const behind = t > 9.1;
      if (behind) qin(c, qinFig, t);
      const zj = figure(c, zhouFig(t), t);
      if (t < T_LAND) cutRope(c, zj.anR, t, 40); // 他脚踝上也拖着一截割断的红绳
      if (!behind) qin(c, qinFig, t);
      if (br && t >= B_PULL + 0.15) stone(c, br.p[0], br.p[1], BR, "活下去", br.warm, br.rot);
      puffs(c, t);
      c.restore();
    };
    if (vV > 2) smearV(c, Math.min(260, vV * 0.7), scene);
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
    // 暗角：整座城的天是敞开的（最轻）；扎进哑铃店时收到主歌一第一镜的 0.4
    const open = t < T_ZHOU ? 1 : E.io(ph(t, RISE0, T_WIDE)) * (1 - E.io(ph(t, T_DIVE, 15.9)));
    vignette(c, t > T_DIVE ? mix(0.4, 0.25, open) : mix(0.35 - 0.2 * warm, 0.25, open));
    flash(c, 0.45 * kick(t, TOUCH, 0.12) + 0.13 * burstPulse(t, 0.12), "#fff8ee");
    // 世界的核心设定：首帧就在，落到周磊身上、读完以后退场
    const ha = 1 - ph(t, 2.75, 3.1);
    HOOK.forEach((s, i) => text(c, s, W / 2, 1390 + i * 96, 60, { shadow: 20, weight: 800, alpha: ha }));
    // 她一出现就上；镜头开始往后拉出整座城时退场，让城自己说话
    caption(c, ["城里都说，", "她是最沉的人"], t, 4.55, 13.4, 260, 64); // 镜头从铁靴抬上去、周磊的头过了字的位置再上
  },
};

export const introShots: Shot[] = [s01];
