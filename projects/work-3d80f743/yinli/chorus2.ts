// 副歌二 1:35.49–1:52 + 静 1:52–1:53.88：他抬头看白 → 她抓住他，两个人一起升 → 脱下铁靴套在他脚上 → 靴子里掉出一块她写给自己的「活下去」→ 她赤脚升天 → 静 → 白里的妈妈
import { type C, type Cam, type Shot, W, H, E, ph, kf, kcam, kick, shake, jolt, applyCam, vignette, caption, clamp, mix, sY, smearV, fill, writeOn } from "./core";
import { figure, pose, rope, stone, type Fig, type Pt, walk } from "./figure";
import { ash, BEDPOST, tower, sky, whiteBand, city, WHITE, ghost, crack, door } from "./world";
import { street, qinRoom } from "./sets";
import { bigBoot, crowd, hand } from "./props";

export const X4 = -3200;
const camVel = (f: (t: number) => Cam, t: number) => Math.abs(sY(f(t), 0) - sY(f(t - 1 / 60), 0));

/** 屏幕上方的白光：抬头看白的时候，白在画面顶上越来越亮，里面浮出一个人影 */
export function whiteGaze(c: C, t: number, a: number, ghostA: number, arms = 1, gx = W / 2, gy = 420, gs = 3.2) {
  if (a <= 0) return;
  const g = c.createLinearGradient(0, 0, 0, 1100);
  g.addColorStop(0, `rgba(255,255,255,${a})`);
  g.addColorStop(0.55, `rgba(255,255,255,${0.45 * a})`);
  g.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, W, 1100);
  if (ghostA > 0) {
    c.save();
    c.translate(gx, gy);
    c.scale(gs, gs);
    ghost(c, 0, 0, 1, ghostA, arms, t);
    c.restore();
  }
}

/** 穿着她那双大靴子的小石头 */
export function kidInBoots(c: C, t: number, f: Fig) {
  const j = figure(c, { kind: "kid", barefoot: true, bell: false, ...f }, t);
  bigBoot(c, j.anL[0], j.anL[1] + 2, 0.95, (f.facing ?? 1) as number);
  bigBoot(c, j.anR[0], j.anR[1] + 2, 0.95, (f.facing ?? 1) as number);
  return j;
}

// ---------- S43 95.49–95.97：天快亮，她醒来——两个人的绳结解开了 ----------
const s43: Shot = {
  a: 95.49,
  b: 95.97,
  draw(c, t) {
    const k = { x: -300, y: -110, z: 4.2 };
    c.save();
    applyCam(c, k);
    qinRoom(c, t, { night: 0.5, boots: 1, glare: 1 });
    figure(c, { x: -170, y: -110, grounded: false, kind: "qin", facing: 1, lean: -1.0, legL: 1.5, legR: 1.4, kneeL: 0.2, kneeR: 0.1, head: 0.6, eyes: "wide", barefoot: true, boots: false, rim: 0.6 }, t);
    rope(c, BEDPOST, [-260, -40], 40, 3.2);
    rope(c, [-330, -20], [-250, -6], 6, 2.6); // 松开的绳头
    c.restore();
    vignette(c, 0.55);
  },
};

// ---------- S44 95.97–97.92：街中间，小石头仰着头把那块「妈妈，明天见」举向白——白里浮出一个女人，朝他张开手；他的脚离了地 ----------
const kidLift = (t: number) => kf(t, [[95.97, 0], [96.9, 0], [97.92, 40, E.in2], [99.9, 330, E.in2], [101.91, 640, E.lin], [102.4, 700, E.out]]);
const s44: Shot = {
  a: 95.97,
  b: 97.92,
  draw(c, t) {
    const k = kcam(t, [[95.97, { x: X4 + 40, y: -330, z: 2.2 }], [97.92, { x: X4 + 40, y: -420, z: 2.6 }, E.io]]);
    street(c, k, t, { glow: 1 });
    c.save();
    applyCam(c, k);
    crowd(c, t, [X4 - 420, X4 - 300, X4 + 360, X4 + 480], 0, { tone: 0.35, seed: 21 });
    const h = kidLift(t);
    const j = figure(c, { x: X4 + 40, y: -h, grounded: true, kind: "kid", facing: 1, head: 1.0, aR: Math.PI - 0.25, aL: -0.3, float: clamp(h / 40) * 0.5, rim: 0.85, eyes: "open", bell: true }, t);
    stone(c, j.handR[0], j.handR[1] - 8, 11, "", 0.6);
    c.restore();
    whiteGaze(c, t, 0.35 + 0.45 * ph(t, 95.97, 97.0), 0.25 + 0.75 * ph(t, 96.2, 97.2), 1);
    ash(c, t, k, { n: 0.4 });
    vignette(c, 0.45);
  },
};

// ---------- S45/S46 97.92–101.91：她冲出楼门追过去，抓住他的手——两个人一起往上升；窗里的人拉上窗帘 ----------
const qinRunOut = (t: number) => kf(t, [[97.92, X4 + 760], [98.7, X4 - 20, E.in2]]);
const s45: Shot = {
  a: 97.92,
  b: 101.91,
  draw(c, t) {
    const h = kidLift(t);
    const k = kcam(t, [
      [97.92, { x: X4 + 360, y: -330, z: 1.7 }],
      [98.9, { x: X4 + 60, y: -360, z: 1.9 }, E.io],
      [101.91, { x: X4 + 40, y: -h - 420, z: 1.75 }, E.io],
    ]);
    street(c, k, t, {});
    c.save();
    applyCam(c, k);
    c.save();
    c.translate(X4 + 1300, 0);
    tower(c, {});
    c.restore();
    door(c, X4 + 820, 0, { open: 1, w: 160, h: 300 });
    // 窗里的人低下头、拉上窗帘
    const shut = ph(t, 99.9, 101.4);
    crowd(c, t, [X4 - 420, X4 - 300, X4 + 360, X4 + 480], 0, { tone: 0.35, seed: 21, head: -0.9 });
    const kj = figure(c, { x: X4 + 40, y: -h, grounded: true, kind: "kid", facing: 1, head: 1.0, aR: Math.PI - 0.25, aL: -0.4, float: clamp(h / 40) * 0.6, rim: 0.85, eyes: "open", bell: true }, t);
    const grab = t > 98.9;
    if (!grab) {
      const w = walk(t * 2.6, 0.65);
      const jump = E.out(ph(t, 98.7, 98.9));
      figure(c, { x: qinRunOut(t), y: -jump * 50, kind: "qin", facing: -1, lean: -0.3, legL: w.legL, legR: w.legR, kneeL: w.kneeL + 0.3, kneeR: w.kneeR + 0.3, aL: -jump * 2.6, head: 0.7, rim: 0.8, eyes: "wide" }, t);
    } else {
      const lift = Math.max(0, h - 30);
      figure(c, { x: X4 - 30, y: -lift, grounded: true, kind: "qin", facing: 1, lean: -0.15, hR: [kj.handL[0] - 2, kj.handL[1] + 2], hL: [kj.handL[0] - 6, kj.handL[1] + 20], legL: -0.2, legR: 0.25, kneeL: 0.3, kneeR: 0.2, float: clamp(lift / 200) * 0.5, head: 0.5, rim: 0.8, eyes: "wide" }, t);
    }
    // 窗户一扇扇暗下去（窗帘）
    if (shut > 0) {
      c.fillStyle = "rgba(120,100,150,0.85)";
      for (let i = 0; i < 6; i++) {
        const q = clamp(shut * 6 - i);
        if (q <= 0) continue;
        const wx = X4 - 560 + i * 230;
        const wy = -h - 900 + (i % 2) * 220;
        c.fillRect(wx, wy, 90 * q, 120);
      }
    }
    c.restore();
    ash(c, t, k, { n: 0.45 });
    vignette(c, 0.45);
  },
};

// ---------- S47 101.91–103.92：她看看他，看看自己的铁靴——在半空中脱下靴子，套在他脚上 ----------
const PAIR_Y = (t: number) => -kidLift(t);
const s47: Shot = {
  a: 101.91,
  b: 103.92,
  draw(c, t) {
    const y0 = PAIR_Y(t);
    const k = kcam(t, [
      [101.91, { x: X4 + 10, y: y0 - 130, z: 3.0 }],
      [102.5, { x: X4 + 10, y: y0 - 110, z: 3.3 }, E.io],
      [103.92, { x: X4 + 20, y: y0 - 60, z: 2.8 }, E.io],
    ]);
    street(c, k, t, {});
    c.save();
    applyCam(c, k);
    const look = ph(t, 101.95, 102.5);
    const off = E.io(ph(t, 102.55, 103.5));
    const kidY = y0;
    const kj = figure(c, { x: X4 + 40, y: kidY, grounded: true, kind: "kid", facing: 1, head: 0.6, aR: Math.PI - 0.6, aL: -0.4, float: 0.6, rim: 0.85, eyes: "wide", barefoot: true, bell: false }, t);
    const qj = figure(
      c,
      {
        x: X4 - 30,
        y: kidY + 10,
        grounded: true,
        kind: "qin",
        facing: 1,
        lean: -0.1 - 0.3 * off,
        hR: [kj.handL[0] - 2, kj.handL[1] + 2],
        hL: off > 0 ? [mix(X4 - 40, kj.anR[0] - 10, off), mix(kidY - 10, kj.anR[1] - 6, off)] : undefined,
        legL: -0.2 + 0.6 * off,
        legR: 0.25,
        kneeL: 0.3 + 1.2 * off,
        kneeR: 0.2,
        float: 0.5,
        head: look < 0.5 ? 0.3 : mix(0.3, -0.9, E.io(look * 2 - 1)) + off * 0.6,
        boots: off < 0.15,
        barefoot: off >= 0.15,
        rim: 0.8,
        eyes: "open",
      },
      t,
    );
    for (const [i, an] of [qj.anL, qj.anR].entries()) {
      const target = i === 0 ? kj.anL : kj.anR;
      const p = E.io(ph(t, 102.55 + i * 0.3, 103.2 + i * 0.3));
      if (p > 0) bigBoot(c, mix(an[0], target[0], p), mix(an[1] + 4, target[1] + 2, p), 0.95, 1, (1 - Math.abs(p - 0.5) * 2) * 0.6);
    }
    c.restore();
    ash(c, t, k, { n: 0.4 });
    vignette(c, 0.5);
  },
};

// ---------- S48 103.92–105.93：他坠回地面——「咚」；一块砖从靴口掉出来：她写给自己的「活下去」 ----------
const camS48 = (t: number) =>
  kcam(t, [
    [103.92, { x: X4 + 30, y: PAIR_Y(103.92) - 60, z: 2.8 }],
    [104.013, { x: X4 + 40, y: -160, z: 2.6 }, E.in2],
    [104.9, { x: X4 + 60, y: -110, z: 3.2 }, E.io],
  ]);
const s48: Shot = {
  a: 103.92,
  b: 105.93,
  draw(c, t) {
    if (t >= 105.4) {
      // 近景：他手心里那块砖
      fill(c, "#f1dde0");
      const g = c.createRadialGradient(W / 2, 800, 50, W / 2, 900, 1100);
      g.addColorStop(0, "rgba(255,248,240,0.6)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      hand(c, 660, 1180, 1.6, Math.PI + 0.2, { grip: 0.15, tone: "#6fb07a", skin: "#f7dac7" });
      stone(c, 530, 1060, 150, "活下去", 0, -0.06);
      vignette(c, 0.55);
      return;
    }
    const k = jolt(camS48(t), shake(t, 16 * kick(t, 104.013, 0.13), 7));
    smearV(c, t < 104.02 ? camVel(camS48, t) * 0.8 : 0, (c) => {
      street(c, k, t, {});
      c.save();
      applyCam(c, k);
      crack(c, X4 + 40, 0, 110, ph(t, 104.013, 104.2));
      const fallY = mix(PAIR_Y(103.92), 0, E.in2(ph(t, 103.92, 104.013)));
      const pick = E.io(ph(t, 104.85, 105.3));
      const kj = kidInBoots(c, t, { x: X4 + 40, y: fallY - 14, grounded: true, facing: 1, head: mix(0.9, -0.6, pick), kneeL: 0.6 * pick + kick(t, 104.013, 0.2) * 0.8, kneeR: 0.5 * pick + kick(t, 104.013, 0.2) * 0.8, lean: 0.25 * pick, hR: pick > 0 ? [mix(X4 + 70, X4 + 120, pick), mix(-90, -14, Math.sin(pick * Math.PI))] : undefined, rim: 0.85, eyes: "wide" });
      // 砖：从靴口掉出来，落地，被他捡起
      const out = ph(t, 104.1, 104.5);
      if (pick < 0.5) {
        const sx = mix(kj.anR[0] + 10, X4 + 120, out);
        const sy = mix(kj.anR[1] - 30, -6, out) - Math.sin(out * Math.PI) * 60;
        stone(c, sx, sy, 7, "", 0);
      } else stone(c, kj.handR[0], kj.handR[1] - 4, 7, "", 0);
      c.restore();
      ash(c, t, k, { n: 0.45 });
      vignette(c, 0.45);
    });
  },
};

// ---------- S49 105.93–107.94：她赤着脚往上升，比全城任何人都快。她低头看着他，笑了一下 ----------
const qinRise = (t: number) => kf(t, [[105.93, 820], [106.9, 1300, E.in2], [107.94, 3200, E.in2], [109.89, 6000, E.lin], [112.0, 8500, E.out2], [113.88, 8560]]);
const s49: Shot = {
  a: 105.93,
  b: 107.94,
  draw(c, t) {
    const y = -qinRise(t);
    const close = t < 106.9;
    const k = close ? kcam(t, [[105.93, { x: X4 - 20, y: y - 140, z: 4.6 }], [106.9, { x: X4 - 20, y: y - 150, z: 4.8 }, E.lin]]) : kcam(t, [[106.9, { x: X4 - 40, y: y - 200, z: 1.6 }], [107.94, { x: X4 - 40, y: -2200, z: 0.6 }, E.io]]);
    street(c, k, t, {});
    c.save();
    applyCam(c, k);
    figure(c, { x: X4 - 20, y, grounded: false, kind: "qin", facing: 1, float: 1, barefoot: true, boots: false, aL: -2.5 + Math.sin(t * 1.3) * 0.15, aR: 2.4 + Math.sin(t) * 0.15, head: -0.7, legL: -0.15, legR: 0.2, kneeL: 0.5, kneeR: 0.3, rim: 0.9, eyes: close ? "smile" : undefined, tears: close ? 0.6 : 0 }, t);
    if (!close) kidInBoots(c, t, { x: X4 + 40, y: -14, grounded: true, facing: 1, head: 1.0, aR: 0.4, rim: 0.85 });
    c.restore();
    ash(c, t, k, { n: 0.5, up: (t - 105.93) * 400 });
    vignette(c, 0.4);
  },
};

// ---------- S50 107.94–109.89：小石头穿着那双大靴子站在灰里仰着头——和十二年前同一个构图 ----------
const s50: Shot = {
  a: 107.94,
  b: 109.89,
  draw(c, t) {
    const k = kcam(t, [[107.94, { x: X4 + 30, y: -413, z: 1.55 }], [109.89, { x: X4 + 30, y: -413, z: 1.62 }, E.lin]]);
    street(c, k, t, {});
    c.save();
    applyCam(c, k);
    crowd(c, t, [X4 - 470, X4 - 350, X4 - 230, X4 + 300, X4 + 420, X4 + 540], 0, { tone: 0.3, seed: 9, head: -0.8 });
    const y = -qinRise(t);
    figure(c, { x: X4 + 20, y: Math.max(y, -1000), grounded: false, kind: "qin", facing: 1, float: 1, barefoot: true, boots: false, aL: -2.5, aR: 2.4, head: -0.6, rim: 0.6, alpha: clamp((y + 1150) / 200) }, t);
    kidInBoots(c, t, { x: X4 + 60, y: -14, grounded: true, facing: -1, head: 1.0, aL: 0.3, aR: -0.2, rim: 0.85, eyes: "open" });
    stone(c, X4 + 76, -66, 6, "", 0);
    c.restore();
    ash(c, t, k, { n: 0.5 });
    vignette(c, 0.45);
  },
};

// ---------- S51 109.89–112.0：她穿过最高那栋楼的楼顶，升进刺眼的光里，城在脚下越来越小 ----------
const s51: Shot = {
  a: 109.89,
  b: 112.0,
  draw(c, t) {
    const y = -qinRise(t);
    const k = { x: X4 - 20 + (t - 109.89) * 40, y: y - 120, z: mix(0.55, 1.6, E.io(ph(t, 109.89, 112.0))) };
    sky(c, k, {});
    whiteBand(c, k, t, 1);
    city(c, k, { layers: [0, 1, 2] });
    c.save();
    applyCam(c, k);
    c.save();
    c.translate(X4 + 1300, 0);
    tower(c, {});
    c.restore();
    figure(c, { x: X4 - 20, y, grounded: false, kind: "qin", facing: 1, float: 1, barefoot: true, boots: false, aL: -2.6 + Math.sin(t) * 0.1, aR: 2.5, head: -0.8, legL: -0.1, legR: 0.25, kneeL: 0.4, kneeR: 0.3, rim: 0.9, eyes: "closed" }, t);
    c.restore();
    ash(c, t, k, { n: 0.4 });
    whiteGaze(c, t, 0.4 * ph(t, 110.8, 112.0), 0);
  },
};

// ---------- 静 112.0–113.88：整座城没有她的脚步声；白的边上，白里的妈妈朝她张开手 ----------
const s52: Shot = {
  a: 112.0,
  b: 112.9,
  draw(c, t) {
    const k = { x: -1080, y: -300, z: 3.0 };
    street(c, k, t, { lights: 0 });
    c.save();
    applyCam(c, k);
    c.fillStyle = "#b9d1b1";
    c.fillRect(-1220, -560, 300, 560);
    c.fillStyle = "#ffd27a";
    c.globalAlpha = 0.85;
    c.fillRect(-1150, -380, 160, 150);
    c.globalAlpha = 1;
    figure(c, { x: -1070, y: -230, kind: "old", facing: 1, head: 0.1 + 0.15 * ph(t, 112.0, 112.8), lean: 0.05, aR: 1.2, bendR: -1.4, tone: 0.05, stone: 0.7, rim: 0.4, eyes: "open" }, t);
    c.restore();
    ash(c, t, k, { n: 0.35, speed: 0.4 });
    vignette(c, 0.6);
  },
};
const s53: Shot = {
  a: 112.9,
  b: 113.88,
  draw(c, t) {
    const y = -8560;
    const k = { x: X4 - 20, y: y - 150, z: 4.0 };
    sky(c, k, {});
    whiteBand(c, k, t, 1);
    fill(c, "#ffffff", 0.55);
    whiteGaze(c, t, 0.85, 0.4 + 0.5 * ph(t, 112.9, 113.5), 1, W / 2, 330, 3.6);
    c.save();
    applyCam(c, k);
    const reach = E.io(ph(t, 113.15, 113.8));
    figure(c, { x: X4 - 20, y, grounded: false, kind: "qin", facing: 1, float: 1, barefoot: true, boots: false, aL: -2.6, aR: mix(2.5, Math.PI - 0.15, reach), bendR: -0.1, head: mix(-0.3, 0.6, reach), rim: 1, eyes: "closed" }, t);
    // 头发边缘化成灰往上飘
    c.fillStyle = "rgba(205,182,212,0.85)";
    for (let i = 0; i < 18; i++) {
      const u = ((t * 0.9 + i * 0.137) % 1) * 1.0;
      c.beginPath();
      c.arc(X4 - 20 + Math.sin(i * 2.1) * 26 + Math.sin(t * 2 + i) * 6, y - 175 - u * 140, 2.5 * (1 - u) + 1, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    vignette(c, 0.3, 420, 1250, "255,255,255");
  },
};

export const chorus2Shots: Shot[] = [s43, s44, s45, s47, s48, s49, s50, s51, s52, s53];
void caption;
void writeOn;
void pose;
void sky;
void WHITE;
void qinRoom;
export type { Pt };
