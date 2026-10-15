// 导歌一 0:31.92–0:39.99：她在家里写砖 → 一屋子写着各种「活下去」的话的砖 → 一块块发给街上的人 → 夜里脱掉靴子，自己飘起来，睡到天花板上倒着的床上
import { type C, type Shot, W, H, E, ph, kcam, kick, applyCam, vignette, fill, mix, clamp, writeOn } from "./core";
import { figure, pose, stone, rope, walk, type Fig, type Pt } from "./figure";
import { ash, BEDPOST } from "./world";
import { GIRL_LOOK, highSet, HIGH_RB, HIGH_SIT } from "./verse1";
import { qinRoom, street } from "./sets";
import { hand, pen } from "./props";
import { PAL } from "./palette";

/** 近景：在砖上写字、递过去。recv 是接砖那只手的位置 */
export function writeClose(c: C, t: number, o: { t0: number; words: string; give: number; recv: [number, number]; warmAt: number; bg?: string; wEnd?: number; recvSleeve?: string }) {
  fill(c, o.bg ?? "#f1dde0");
  const g = c.createRadialGradient(W / 2, 700, 80, W / 2, 900, 1100);
  g.addColorStop(0, "rgba(255,248,240,0.6)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  const enter = E.out(ph(t, o.t0, o.t0 + 0.3));
  const give = E.io(ph(t, o.give, o.give + 0.4));
  const hx = mix(300, o.recv[0] - 180, give);
  const hy = 1240 + (1 - enter) * 300 - give * 60;
  hand(c, o.recv[0] + 150, o.recv[1] + 120 + (1 - E.out(ph(t, o.give - 0.5, o.give))) * 300, 2.0, Math.PI + 0.15, { grip: 0.15, tone: o.recvSleeve ?? "#f4abba", skin: "#f6d6c4" });
  hand(c, hx, hy, 2.4, -0.55 + give * 0.25, { grip: 0.3 });
  const sx = mix(450, o.recv[0], give);
  const sy = mix(hy - 120, o.recv[1], give);
  const p = ph(t, o.t0 + 0.12, o.wEnd ?? o.give - 0.12);
  stone(c, sx, sy, 118, writeOn(o.words, p), ph(t, o.warmAt, o.warmAt + 0.4), -0.06);
  if (t < o.give) {
    const n = o.words.length;
    const i = Math.min(n - 1, Math.floor(p * n));
    const wob = Math.sin(t * 38) * 10;
    const px = sx - (n - 1) * 30 + i * 60 + wob;
    const py = sy - 8 + Math.cos(t * 31) * 8;
    pen(c, px, py, -0.85, 2.2);
    hand(c, px + 250, py - 300, 2.2, 2.25, { grip: 0.75, left: true });
  }
}

const lerpPt = (a: Pt, b: Pt, e: number): Pt => [mix(a[0], b[0], e), mix(a[1], b[1], e)];
const win = (t: number, a: number, b: number, c: number, d: number) => E.io(ph(t, a, b)) * (1 - E.io(ph(t, c, d)));

// ---------- 她的屋子：桌边写砖（灯下） ----------
const DESK_X = 110; // 她坐的小凳
/** 坐在小凳上写砖：笔一下一下地动 */
function qinWriting(t: number): Fig {
  const wob = Math.sin(t * 26) * 3;
  return { x: DESK_X, y: -62, grounded: false, kind: "qin", facing: 1, legL: 1.35, legR: 1.2, kneeL: 1.4, kneeR: 1.3, lean: 0.3, head: -0.55, hR: [222 + wob, -160 + Math.cos(t * 21) * 2], hL: [250, -158], rim: 0.6, eyes: "open" };
}
/** 一屋子写好的砖：每块写着一句让人活下去的话 */
const WORDS = ["活下去", "别怕", "会好的", "慢慢来", "吃饱饭", "有我在", "你很重要", "活下去", "抱抱你", "春天会来", "睡个好觉", "天会亮的", "再撑一下", "不是你的错", "活下去", "我等你"];
const PILE_R = 16;
function brickPile(c: C, rows = 3) {
  const w = PILE_R * 2.05 + 4;
  const h = PILE_R * 1.18 + 3;
  let i = 0;
  for (let r = rows - 1; r >= 0; r--) {
    for (let q = 0; q < 26; q++) {
      const x = -470 + q * w + (r % 2) * w * 0.5;
      if (x > 470) continue;
      stone(c, x, -h * 0.5 - r * h + 6, PILE_R, WORDS[(q * 3 + r * 5 + i) % WORDS.length], 0, ((q * 7 + r * 3) % 5 - 2) * 0.02);
    }
    i += 1;
  }
}
function deskScene(c: C, t: number, o: { pile?: boolean } = {}) {
  qinRoom(c, t, { night: 0.55, lamp: 1, glare: 0.4, boots: undefined });
  // 小凳
  c.fillStyle = PAL.woodDark;
  c.fillRect(DESK_X - 26, -58, 52, 10);
  c.fillRect(DESK_X - 22, -48, 8, 48);
  c.fillRect(DESK_X + 14, -48, 8, 48);
  // 桌上：写好的一摞，和正在写的那块
  for (let i = 0; i < 4; i++) stone(c, 380, -158 - i * 13, 10, "", 0, 0.02 * (i % 2 ? 1 : -1));
  figure(c, qinWriting(t), t);
  stone(c, 236, -165, 10, "活下去", 0, -0.04);
  if (o.pile) brickPile(c);
}

// ---------- S13 31.92–32.65：「两块五的签字笔」——晚上，她在自己家里，灯下坐在桌边写砖；镜头推到桌上 ----------
const s13: Shot = {
  a: 31.92,
  b: 32.65,
  xin: 0.3,
  draw(c, t) {
    const k = kcam(t, [
      [31.92, { x: 100, y: -270, z: 1.75 }],
      [32.65, { x: 235, y: -175, z: 3.8 }, E.io],
    ]);
    c.save();
    applyCam(c, k);
    deskScene(c, t);
    c.restore();
    vignette(c, 0.45);
  },
};
// ---------- S13b 32.65–33.93：笔杆上「2.5 元」的价签，一笔一笔写「活下去」 ----------
const s13b: Shot = {
  a: 32.65,
  b: 33.93,
  xin: 0.25,
  draw(c, t) {
    writeClose(c, t, { t0: 32.65, words: "活下去", give: 99, recv: [700, 3200], warmAt: 99, bg: "#6c5c80", wEnd: 33.6 }); // 没有接砖的手：写给别人的，还没送出去
    vignette(c, 0.55);
  },
};

// ---------- S14 33.93–35.88：「东拼西凑的词句」——镜头贴着地上一排排写好的砖慢慢滑过：每块写着不一样的话；再退开，一屋子的砖，她还在灯下写 ----------
const s14: Shot = {
  a: 33.93,
  b: 35.88,
  xin: 0.25,
  draw(c, t) {
    const k = kcam(t, [
      [33.93, { x: -260, y: -34, z: 5.4 }],
      [35.1, { x: -110, y: -30, z: 5.0 }, E.io],
      [35.88, { x: 40, y: -230, z: 1.6 }, E.io],
    ]);
    c.save();
    applyCam(c, k);
    deskScene(c, t, { pile: true });
    c.restore();
    // 灯的暖光
    const g = c.createRadialGradient(W / 2, H * 0.55, 60, W / 2, H * 0.55, 1100);
    g.addColorStop(0, `rgba(${PAL.warmRGB},0.12)`);
    g.addColorStop(1, `rgba(${PAL.warmRGB},0)`);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    vignette(c, 0.45);
  },
};

// ---------- S15 35.88–37.80：「妄想用它拯救你」——回到楼顶（30.1 落下来的那一刻接着往下）：千斤靠在她肩上，身子还在往上浮。
// 她从靴筒里抽出一块「活下去」递过去——接住的那一下很沉：两只手一下坠到膝上，身子「咚」地坐回楼顶，头发落下来；
// 千斤抱着砖（砖暖了），抬头看她，哭着笑了。不切，情绪运镜：落到靴子上、跟着砖走，接住时一顿，然后越推越慢 ----------
const RB = HIGH_RB;
const QK = HIGH_SIT.qin; // 她跪在这里
const T_GOT = 36.95; // 接住：很沉
const kneelQin: Fig = { x: QK, y: RB, kind: "qin", facing: 1, legL: 1.3, kneeL: 1.7, legR: 1.1, kneeR: 1.5, lean: 0.1, head: -0.4, rim: 0.8, eyes: "open" };
function girlRoof(t: number): Fig {
  const upright = E.io(ph(t, 35.95, 36.3));
  const got = E.out(ph(t, T_GOT, T_GOT + 0.12));
  const hug = E.io(ph(t, T_GOT + 0.2, 37.45));
  const look = E.io(ph(t, 37.3, 37.6));
  const recv = E.io(ph(t, 36.55, T_GOT));
  const gx = QK + 72 + 6 * upright;
  const lift = (10 + 12 * E.io(ph(t, 35.9, 36.8))) * (0.6 + 0.4 * Math.sin(t * 2.2) ** 2) * (1 - got);
  const y = RB - 20 - lift + 4 * got * Math.exp(-(t - T_GOT) / 0.1) * (t > T_GOT ? 1 : 0);
  const base: Fig = {
    x: gx,
    y,
    grounded: false,
    kind: "girl",
    facing: -1,
    look: GIRL_LOOK,
    float: 0.55 * (1 - got),
    legL: 1.2,
    kneeL: 1.6,
    legR: 1.0,
    kneeR: 1.5,
    lean: mix(-0.42, -0.12, upright) + 0.28 * got * (1 - hug),
    head: -0.35 + 0.25 * recv - 0.45 * got * (1 - hug) + 0.9 * look,
    eyes: look > 0.5 ? "smile" : got > 0 ? "wide" : upright > 0.5 ? "open" : "closed",
    tears: 1,
    rim: 0.6,
  };
  const j = pose(base);
  let h: Pt;
  if (upright < 0.5) h = [QK + 28, RB - 106]; // 还搂着她的肩
  else if (got <= 0) h = lerpPt([j.hip[0] - 14, j.hip[1] - 10], [j.neck[0] - 32, j.neck[1] + 30], recv);
  else h = lerpPt(lerpPt([j.neck[0] - 30, j.neck[1] + 32], [j.hip[0] - 26, j.hip[1] - 6], got), [j.neck[0] - 20, j.neck[1] + 26], hug);
  return { ...base, hL: [h[0] - 5, h[1] + 2], hR: [h[0] + 6, h[1]] };
}
function qinRoof(t: number): Fig {
  const fj = pose(kneelQin);
  const gj = pose({ ...girlRoof(Math.min(t, T_GOT - 0.01)), hL: undefined, hR: undefined });
  const rest: Pt = [QK + 24, RB - 66];
  const bootTop: Pt = [fj.anR[0] + 4, fj.anR[1] - 26];
  const chestP: Pt = [QK + 30, RB - 108];
  const give: Pt = [gj.neck[0] - 26, gj.neck[1] + 24];
  let hand: Pt;
  if (t < 35.95) hand = [gj.hip[0] - 6, gj.hip[1] - 22];
  else if (t < 36.15) hand = lerpPt([gj.hip[0] - 6, gj.hip[1] - 22], bootTop, E.io(ph(t, 35.95, 36.15)));
  else if (t < 36.35) hand = [bootTop[0] + Math.sin(t * 30) * 1.5, bootTop[1] + 4];
  else if (t < 36.55) hand = lerpPt(bootTop, chestP, E.in2(ph(t, 36.35, 36.55)));
  else if (t < T_GOT) hand = lerpPt(chestP, give, E.io(ph(t, 36.55, T_GOT)));
  else hand = lerpPt(give, rest, E.io(ph(t, T_GOT + 0.15, T_GOT + 0.45)));
  const hug = t < 35.95 ? 1 - E.io(ph(t, 35.88, 35.95)) : 0;
  return { ...kneelQin, hL: hand, hR: hug > 0 ? [gj.neck[0] + 10, gj.neck[1] + 10] : [QK + 34, RB - 70], head: -0.4 + 0.15 * E.io(ph(t, 37.2, 37.5)), eyes: t > T_GOT + 0.3 ? "smile" : "open" };
}
function brickRoof(t: number): { p: Pt; rot: number; warm: number } | null {
  if (t < 36.2) return null;
  if (t < T_GOT) {
    const h = pose(qinRoof(t)).handL;
    const v = E.io(ph(t, 36.55, T_GOT));
    return { p: lerpPt([h[0], h[1] + 11], [h[0] + 12, h[1] + 2], v), rot: mix(Math.PI / 2 - 0.08, 0.05, v), warm: 0 };
  }
  const j = pose(girlRoof(t));
  const hp = lerpPt(j.handL, j.handR, 0.5);
  return { p: [hp[0], hp[1] - 9], rot: 0.05, warm: E.out(ph(t, T_GOT, T_GOT + 0.5)) };
}
const s15: Shot = {
  a: 35.88,
  b: 37.8,
  xin: 0.3,
  draw(c, t) {
    const gx = QK + 75;
    const k0 = kcam(t, [
      [35.88, { x: QK + 45, y: RB - 85, z: 3.1 }], // 接 31.92 之前楼顶最后的取景
      [36.3, { x: QK + 32, y: RB - 60, z: 3.4 }, E.soft], // 落到她的靴子上
      [T_GOT, { x: gx - 30, y: RB - 78, z: 3.6 }, E.io], // 跟着砖走到千斤手里
      [37.8, { x: gx - 18, y: RB - 95, z: 4.2 }, E.out], // 接住以后越推越慢，推到她的脸
    ]);
    const k = { ...k0, z: k0.z * (1 + 0.03 * kick(t, T_GOT, 0.12)), y: k0.y - 5 * kick(t, T_GOT, 0.12) };
    highSet(c, k, t);
    c.save();
    applyCam(c, k);
    figure(c, qinRoof(t), t);
    const gj = figure(c, girlRoof(t), t);
    c.strokeStyle = "rgba(190,70,60,0.85)";
    c.lineWidth = 2.5;
    c.beginPath();
    c.ellipse(gj.anR[0], gj.anR[1] - 3, 6, 2.5, 0, 0, Math.PI * 2);
    c.stroke();
    const br = brickRoof(t);
    if (br) stone(c, br.p[0], br.p[1], 12, "活下去", br.warm, br.rot);
    // 坐回楼顶的一下：一圈灰
    const u = t - T_GOT;
    if (u > 0 && u < 0.6) {
      c.fillStyle = `rgba(245,232,236,${0.8 * (1 - u / 0.6)})`;
      for (let i = 0; i < 8; i++) {
        c.beginPath();
        c.ellipse(gx - 30 + i * 10 + (i - 4) * u * 40, RB - 4 - u * 18 * (1 + (i % 2)), 5 + u * 10, 3 + u * 5, 0, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
    ash(c, t, k, { n: 0.4 });
    const warm = br ? br.warm : 0;
    if (warm > 0.01 && br) {
      const p: Pt = [(br.p[0] - k.x) * k.z + W / 2, (br.p[1] - k.y) * k.z + H / 2];
      const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], 560);
      g.addColorStop(0, `rgba(${PAL.warmRGB},${0.28 * warm})`);
      g.addColorStop(1, `rgba(${PAL.warmRGB},0)`);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    vignette(c, 0.4 - 0.15 * warm);
  },
};

export const QIN_SIT: Fig = { x: -230, y: -62, grounded: false, kind: "qin", facing: 1, legL: 1.35, legR: 1.25, kneeL: 1.4, kneeR: 1.3, head: -0.4, rim: 0.6, barefoot: true, boots: false };
export function qinLying(o: Partial<Fig> = {}): Fig {
  return { x: -260, y: -112, grounded: false, kind: "qin", facing: 1, lean: -1.52, legL: 1.5, legR: 1.45, kneeL: 0.05, kneeR: 0.1, aL: 0.6, aR: 0.4, head: 0.1, barefoot: true, boots: false, rim: 0.5, eyes: "closed", ...o };
}
/** 睡着以后飘起来：p=0 躺在地上的床上，p=1 贴着天花板上倒着钉的那张床睡（床垫底面 y≈-522） */
export function qinFloatSleep(t: number, p: number, o: Partial<Fig> = {}): Fig {
  return qinLying({
    x: mix(-260, -250, p),
    y: mix(-112, -498, p),
    float: 0.95 * p,
    aL: mix(0.6, Math.PI - 1.2, p) + Math.sin(t * 0.9) * 0.1 * p,
    aR: mix(0.4, Math.PI - 0.9, p) + Math.sin(t * 1.1 + 1) * 0.1 * p,
    legL: 1.5 + 0.3 * p,
    legR: 1.45 + 0.2 * p,
    kneeL: 0.15 * p,
    kneeR: 0.3 * p,
    head: 0.1 + 0.3 * p,
    ...o,
  });
}
/** 靴口里满满一靴子「活下去」 */
export function bootFull(c: C, t: number, drop: number) {
  fill(c, "#b58f78");
  c.save();
  c.translate(W / 2, 1040);
  c.fillStyle = "#3b2a2a";
  c.beginPath();
  c.ellipse(0, 0, 400, 230, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#5d3f34";
  c.lineWidth = 40;
  c.stroke();
  c.restore();
  const rnd = (i: number) => (Math.sin(i * 12.9898) * 43758.5453) % 1;
  for (let i = 0; i < 22; i++) {
    const a = Math.abs(rnd(i + 1));
    const b = Math.abs(rnd(i + 7));
    stone(c, W / 2 - 300 + a * 600, 900 + b * 260, 56 + (i % 3) * 6, "活下去", 0, (a - 0.5) * 0.8);
  }
  const y = mix(380, 1010, E.in2(drop));
  stone(c, W / 2 + 40, y, 80, "活下去", 0, -0.12);
  vignette(c, 0.7);
}
// ---------- S16 37.80–39.36：「顺便拯救我自己」——夜里回到家，坐在床边脱掉铁靴：「咚」「咚」；靴子一脱，她自己就飘了起来，
// 一直飘到天花板上那张倒着钉的床上，躺好，闭上眼睛（脚踝上的脚绳拴在床头柱上） ----------
const s16: Shot = {
  a: 37.8,
  b: 39.36,
  xin: 0.3,
  draw(c, t) {
    const k = kcam(t, [
      [37.8, { x: -230, y: -175, z: 2.6 }],
      [38.45, { x: -230, y: -165, z: 2.8 }, E.io],
      [39.25, { x: -255, y: -400, z: 2.3 }, E.io], // 跟着她往上飘
      [39.36, { x: -258, y: -415, z: 2.33 }, E.out],
    ]);
    c.save();
    applyCam(c, k);
    const off = t > 38.35; // 两只靴子都脱下来了
    qinRoom(c, t, { night: 0.85, boots: off ? 1 : undefined });
    const bend = win(t, 37.85, 38.0, 38.3, 38.45);
    const lie = E.io(ph(t, 38.45, 38.65));
    const p = E.io(ph(t, 38.6, 39.25));
    let fig: Fig;
    if (lie <= 0) {
      const j0 = pose({ ...QIN_SIT, boots: !off, barefoot: off });
      fig = { ...QIN_SIT, boots: !off, barefoot: off, lean: 0.35 + 0.45 * bend, head: -0.6, hL: bend > 0.05 ? lerpPt([-210, -90], [j0.anL[0], j0.anL[1] - 8], bend) : undefined, hR: bend > 0.05 ? lerpPt([-205, -88], [j0.anR[0], j0.anR[1] - 6], bend) : undefined, aL: 0.9, aR: 0.8, eyes: "open" };
    } else if (p <= 0) {
      fig = { ...qinLying(), lean: mix(0.35, -1.52, lie), x: mix(-230, -260, lie), y: mix(-62, -112, lie), legL: mix(1.35, 1.5, lie), kneeL: mix(1.4, 0.05, lie), legR: mix(1.25, 1.45, lie), kneeR: mix(1.3, 0.1, lie), float: 0.4 * lie, eyes: "open" };
    } else fig = { ...qinFloatSleep(t, p), eyes: t > 39.2 ? "closed" : "open" };
    const j = figure(c, fig, t);
    rope(c, BEDPOST, j.anR, mix(30, 0, clamp(p * 1.4)), 3.2);
    c.restore();
    vignette(c, 0.6);
  },
};

export const pre1Shots: Shot[] = [s13, s13b, s14, s15, s16];
