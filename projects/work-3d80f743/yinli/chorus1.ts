// 副歌一 0:39.99–0:53.94：她飘得最高 → 早上把自己拽下来 → 没拽回来的妈妈 → 灰雪 → 小刀 → 抱住他
import { type C, type Cam, type Shot, W, H, E, ph, kf, kcam, kick, shake, jolt, applyCam, vignette, dissolve, caption, clamp, mix, sY, flash, smearV } from "./core";
import { figure, pose, rope, type Fig, type Pt, walk } from "./figure";
import { ash, tower, sky, whiteBand, city, BEDPOST, TOWER_TOP, WHITE, ghost } from "./world";
import { street, qinRoom } from "./sets";
import { knife } from "./props";
import { qinFloatSleep } from "./pre1";
import { farBurn } from "./intro";
import { webShotB } from "./web";

const camVel = (f: (t: number) => Cam, t: number) => Math.abs(sY(f(t), 0) - sY(f(t - 1 / 60), 0));

// ---------- S17 39.99–41.94：反转——她睡着以后飘到绳子尽头，离白一米 ----------
export { qinFloatSleep };
function qinRoomFloat(c: C, t: number, p: number, o: Partial<Fig> = {}) {
  qinRoom(c, t, { night: 0.85, boots: 1 });
  const j = figure(c, qinFloatSleep(t, p, o), t);
  rope(c, BEDPOST, j.anR, mix(30, 0, clamp(p * 1.4)), 3.2);
  return j;
}
const s17: Shot = {
  a: 39.99,
  b: 41.94,
  draw(c, t) {
    const p = 1; // 前一镜她已经飘到天花板上那张倒着的床上睡着了
    const inside = (c: C) => {
      const k = kcam(t, [
        [39.99, { x: -260, y: -430, z: 2.45 }],
        [41.05, { x: -160, y: -330, z: 1.55 }, E.io],
      ]);
      c.save();
      applyCam(c, k);
      qinRoomFloat(c, t, p);
      c.restore();
      vignette(c, 0.55);
    };
    const outside = (c: C) => {
      const k = kcam(t, [
        [40.8, { x: 0, y: TOWER_TOP + 160, z: 3.4 }],
        [41.94, { x: 0, y: TOWER_TOP + 760, z: 0.62 }, E.soft],
      ]);
      sky(c, k, { night: 0.7 });
      whiteBand(c, k, t, 1);
      city(c, k, { layers: [0, 1], night: 0.8 });
      c.save();
      applyCam(c, k);
      tower(c, { night: 0.8, qinWindow: 1 });
      // 窗里：防飘栏后面浮着一个横着的人影
      c.save();
      c.beginPath();
      c.rect(-140, TOWER_TOP + 70, 280, 170);
      c.clip();
      figure(c, { ...qinFloatSleep(t, 1), x: 15, y: TOWER_TOP + 96, s: 0.55, rim: 0, tone: 0.1 }, t); // 贴着天花板
      c.restore();
      c.fillStyle = "#6b5a6e";
      for (let i = 0; i <= 6; i++) c.fillRect(-140 + i * 46, TOWER_TOP + 70, 6, 170);
      c.restore();
      ash(c, t, k, { n: 0.35 });
      vignette(c, 0.4);
    };
    dissolve(c, ph(t, 40.8, 41.05), inside, outside);
    caption(c, ["没人知道，", "她飘得最高"], t, 40.25, 41.94, 1420, 70);
  },
};

// ---------- S18 41.94–43.92：早上，她抓着脚绳一把一把把自己拽回床上，脚塞进靴子：「咚」 ----------
const s18: Shot = {
  a: 41.94,
  b: 43.92,
  xin: 0.35,
  draw(c, t) {
    const k = jolt(kcam(t, [[41.94, { x: -200, y: -300, z: 2.1 }], [43.92, { x: -120, y: -230, z: 2.25 }, E.io]]), shake(t, 9 * kick(t, 43.513, 0.12), 6));
    c.save();
    applyCam(c, k);
    const pulls = (t - 41.94) / 0.24;
    const down = clamp(Math.floor(pulls) / 4 + E.io(pulls % 1) / 4);
    const p = 1 - down;
    if (t < 42.95) {
      qinRoom(c, t, { night: 0.15, boots: 1, glare: 1 });
      const fig = qinFloatSleep(t, p, { eyes: "open" });
      const pre = pose(fig);
      const hand: Pt = [mix(pre.anR[0], BEDPOST[0], 0.55), mix(pre.anR[1], BEDPOST[1], 0.55)];
      const j = figure(c, { ...fig, hR: hand, hL: [hand[0] + 30, hand[1] - 10 + Math.sin(pulls * Math.PI) * 15] }, t);
      rope(c, BEDPOST, j.anR, 0, 3.2);
    } else {
      const sit = E.io(ph(t, 42.95, 43.2));
      const into = E.io(ph(t, 43.2, 43.45));
      const stand = E.out(ph(t, 43.45, 43.6));
      const leave = ph(t, 43.65, 43.92);
      qinRoom(c, t, { night: 0.15, boots: into > 0.5 ? undefined : 1, glare: 1 });
      if (stand <= 0) {
        figure(c, { x: mix(-230, -100, into), y: -62 + into * 10, grounded: false, kind: "qin", facing: 1, legL: mix(1.35, 0.3, into), legR: mix(1.25, 0.2, into), kneeL: mix(1.4, 0.5, into), kneeR: mix(1.3, 0.4, into), lean: mix(-0.6, 0.25, sit), head: -0.4, boots: into > 0.5, barefoot: into <= 0.5, rim: 0.7, eyes: "open" }, t);
      } else {
        const w = walk(t * 2, 0.4 * leave);
        figure(c, { x: -60 + leave * 520, y: 0, kind: "qin", facing: 1, lean: 0.05, legL: w.legL, legR: w.legR, kneeL: w.kneeL, kneeR: w.kneeR, head: 0.1, rim: 0.7 }, t);
      }
    }
    c.restore();
    vignette(c, 0.5);
  },
};

// ---------- 街上的这一场（另一条街，x 往右挪 3200） ----------
const X0 = 3200;
const mumLift = (t: number) => kf(t, [[43.92, 150], [44.75, 205], [45.93, 300, E.in2], [46.5, 330]]);
function mum(t: number, o: Partial<Fig> = {}): Fig {
  const h = mumLift(t);
  return { x: X0, y: -h - 89, grounded: false, kind: "woman", facing: 1, float: 0.8, aL: -0.6, aR: 1.9 + Math.sin(t) * 0.2, head: -0.3, rim: 0.6, ...o };
}
function kidHanging(t: number, hand: Pt, o: Partial<Fig> = {}): Fig {
  return { x: hand[0] - 10, y: hand[1] + 82, grounded: false, kind: "kid", facing: 1, float: 0.5, hR: hand, aL: -0.3, head: 0.6, legL: -0.1, legR: 0.15, kneeL: 0.3, kneeR: 0.2, rim: 0.7, ...o };
}
const qinRunX = (t: number) => kf(t, [[43.92, X0 - 760], [44.6, X0 - 110, E.lin]]);
const s19: Shot = {
  a: 43.92,
  b: 45.93,
  draw(c, t) {
    const k = kcam(t, [
      [43.92, { x: X0 - 160, y: -330, z: 1.75 }],
      [45.93, { x: X0 - 70, y: -420, z: 2.05 }, E.io],
    ]);
    street(c, k, t, {});
    c.save();
    applyCam(c, k);
    const mj = figure(c, mum(t), t);
    const kj = figure(c, kidHanging(t, mj.handL), t);
    void kj;
    const grab = t > 44.75;
    const lift = E.io(ph(t, 45.1, 45.9)) * 34;
    if (!grab) {
      const w = walk(t * 2.4, 0.6);
      const jump = E.out(ph(t, 44.55, 44.75));
      figure(c, { x: qinRunX(t), y: -jump * 40, kind: "qin", facing: 1, lean: 0.3, legL: w.legL, legR: w.legR, kneeL: w.kneeL + 0.3, kneeR: w.kneeR + 0.3, aR: jump * 2.7, aL: jump * 2.3, head: 0.6, rim: 0.8, eyes: "wide" }, t);
    } else {
      figure(c, { x: X0 - 95, y: -lift, kind: "qin", facing: 1, lean: -0.3, legL: -0.3, legR: 0.2, kneeL: 0.35, kneeR: 0.25, hR: [mj.anR[0] - 2, mj.anR[1] + 4], hL: [mj.anR[0] - 4, mj.anR[1] + 28], head: 0.8, rim: 0.8, eyes: "wide" }, t);
    }
    c.restore();
    ash(c, t, k, { n: 0.45 });
    vignette(c, 0.45);
  },
};

// ---------- S20 45.93–47.94：她看见秤砣离地的靴跟，掰开儿子的手，自己升进白——一闪 ----------
const camS20b = (t: number) =>
  kcam(t, [
    [47.05, { x: X0 + 20, y: -900, z: 1.3 }],
    [47.66, { x: X0 + 60, y: -6800, z: 0.3 }, E.io],
    [47.94, { x: X0 + 60, y: -6500, z: 0.28 }, E.out],
  ]);
const s20: Shot = {
  a: 45.93,
  b: 47.94,
  draw(c, t) {
    if (t < 47.05) {
      const k = jolt(kcam(t, [[45.93, { x: X0 - 40, y: -470, z: 2.6 }], [46.6, { x: X0 - 40, y: -430, z: 2.7 }, E.io], [47.05, { x: X0 - 60, y: -330, z: 2.2 }, E.io]]), shake(t, 10 * kick(t, 47.013, 0.12), 2));
      street(c, k, t, {});
      c.save();
      applyCam(c, k);
      const pry = E.io(ph(t, 45.95, 46.4));
      const push = E.io(ph(t, 46.4, 46.75));
      const away = E.in2(ph(t, 46.6, 47.05));
      const mj = figure(c, mum(t, { y: -mumLift(t) - 89 - away * 700, head: -0.9, aL: -0.6 - push * 0.6, hR: pry < 1 ? [mix(X0 + 40, X0 - 26, pry), mix(-mumLift(t) - 89 + 20, -mumLift(t) - 89 + 64, pry)] : undefined, eyes: "open", tears: 1 }), t);
      const fallK = E.in2(ph(t, 46.6, 47.013));
      const kidHand: Pt = push > 0 ? [mix(mj.handL[0], X0 - 120, push), mix(mj.handL[1], -150, fallK)] : mj.handL;
      const qy = -34 * (1 - fallK);
      if (push <= 0) figure(c, kidHanging(t, kidHand, { eyes: "wide" }), t);
      else figure(c, { x: X0 - 110, y: mix(-100, -4, fallK) + qy * 0, kind: "kid", facing: 1, grounded: true, float: 0.3 * (1 - fallK), head: 0.8, aR: 2.6 - fallK * 1.6, rim: 0.7, eyes: "wide" }, t);
      figure(c, { x: X0 - 160, y: qy, kind: "qin", facing: 1, lean: mix(-0.3, 0.2, push), legL: -0.3, legR: 0.2, kneeL: 0.35 + fallK * 0.8, kneeR: 0.25 + fallK * 0.7, hR: push > 0 ? [X0 - 118, mix(-170, -90, fallK)] : [mj.anR[0] - 2, mj.anR[1] + 4], hL: push > 0 ? [X0 - 126, mix(-140, -60, fallK)] : [mj.anR[0] - 4, mj.anR[1] + 28], head: 0.8, rim: 0.8, eyes: "wide" }, t);
      c.restore();
      ash(c, t, k, { n: 0.45 });
      vignette(c, 0.45);
      return;
    }
    const k = camS20b(t);
    smearV(c, camVel(camS20b, t) * 0.45, (c) => {
      street(c, k, t, {});
      c.save();
      applyCam(c, k);
      const up = E.in2(ph(t, 46.6, 47.66));
      if (t < 47.66) figure(c, mum(t, { y: mix(-450, WHITE + 300, up), s: 1.25, float: 1, aL: -2.6, aR: 2.6, head: 0.6 }), t);
      farBurn(c, t, 47.66, X0, 1.25);
      // 地上的两个人
      figure(c, { x: X0 - 160, y: 0, kind: "qin", facing: 1, legL: 1.2, kneeL: 1.8, legR: 0.9, kneeR: 1.6, head: 1.0, rim: 0.8 }, t);
      figure(c, { x: X0 - 100, y: 0, kind: "kid", facing: 1, head: 1.0, aR: 2.4, rim: 0.7 }, t);
      c.restore();
      ash(c, t, k, { n: 0.6 });
    });
    flash(c, 0.55 * kick(t, 47.66, 0.25));
  },
};

// ---------- S21 47.94–49.95：灰雪落在他们身上；他仰着头，她捂住他的眼睛 ----------
function pair(c: C, t: number, o: { cover?: number; hug?: number; kidFloat?: number; look?: number } = {}) {
  const cover = clamp(o.cover ?? 0);
  const hug = clamp(o.hug ?? 0);
  const kf2 = clamp(o.kidFloat ?? 0);
  const kid: Fig = { x: X0 - 70, y: -kf2 * 18, kind: "kid", facing: -1, head: mix(1.0, -0.2, hug), aR: 2.3 * (1 - hug), aL: -0.3, float: kf2 * 0.6, rim: 0.75, eyes: cover > 0.6 ? undefined : "open", tears: 0.8, bell: true };
  const kj = pose(kid);
  const qin: Fig = {
    x: X0 - 170,
    y: 0,
    kind: "qin",
    facing: 1,
    legL: 1.15,
    kneeL: 1.9,
    legR: 0.8,
    kneeR: 1.5,
    lean: 0.12 + 0.25 * hug,
    head: mix(o.look ?? 0.9, -0.25, Math.max(cover * 0.5, hug)),
    hR: hug > 0 ? [mix(kj.head[0] - 8, kj.neck[0] + 10, hug), mix(kj.head[1] + 4, kj.neck[1] + 20, hug)] : cover > 0 ? [mix(X0 - 110, kj.head[0] + 6, cover), mix(-90, kj.head[1] + 2, cover)] : undefined,
    hL: hug > 0 ? [kj.hip[0] + 6, kj.hip[1] - 10] : undefined,
    aR: 0.6,
    rim: 0.85,
    eyes: hug > 0.6 ? "closed" : "open",
  };
  figure(c, kid, t);
  const qj = figure(c, qin, t);
  return { kj, qj };
}
const s21: Shot = {
  a: 47.94,
  b: 49.95,
  draw(c, t) {
    const k = kcam(t, [
      [47.94, { x: X0 - 120, y: -150, z: 3.0 }],
      [49.95, { x: X0 - 110, y: -140, z: 3.35 }, E.io],
    ]);
    street(c, k, t, {});
    c.save();
    applyCam(c, k);
    pair(c, t, { cover: E.io(ph(t, 48.55, 48.95)) });
    c.restore();
    ash(c, t, k, { n: 1, speed: 0.8 });
    vignette(c, 0.5);
  },
};

// ---------- S22 49.95–51.93：石板上一把小刀，割断的绳头还拴在他脚踝上；她捡起来揣进兜里 ----------
const s22: Shot = {
  a: 49.95,
  b: 51.93,
  draw(c, t) {
    const k = kcam(t, [
      [49.95, { x: X0 + 40, y: -20, z: 6.5 }],
      [50.6, { x: X0 - 40, y: -25, z: 6.2 }, E.io],
      [51.93, { x: X0 - 50, y: -70, z: 4.0 }, E.io],
    ]);
    street(c, k, t, {});
    c.save();
    applyCam(c, k);
    const { kj, qj } = pair(c, t, { cover: 1, look: 0.2 });
    void qj;
    // 脚踝上割断的绳头
    const an = kj.anR;
    c.strokeStyle = "#c9c2b2";
    c.lineWidth = 2.6;
    c.beginPath();
    c.ellipse(an[0], an[1] - 4, 6, 2.5, 0, 0, Math.PI * 2);
    c.moveTo(an[0] + 5, an[1] - 3);
    c.quadraticCurveTo(an[0] + 20, an[1] + 2, an[0] + 34, an[1] - 1);
    c.stroke();
    // 小刀：被她的手捡起来
    const pick = E.io(ph(t, 50.95, 51.35));
    const pocket = E.io(ph(t, 51.4, 51.85));
    const kx = mix(X0 + 40, X0 - 150, pocket);
    const ky = mix(-3, -100, Math.max(pick * 0.4, pocket));
    knife(c, kx, ky, 0.9, mix(0.15, -1.2, pocket));
    if (pick > 0) {
      c.fillStyle = "#f5d3bf";
      c.beginPath();
      c.arc(kx - 20, ky, 7, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#465f93";
      c.lineWidth = 8;
      c.beginPath();
      c.moveTo(kx - 20, ky);
      c.lineTo(mix(X0 - 60, kx - 20, 0.3), mix(-180, ky, 0.3));
      c.stroke();
    }
    c.restore();
    ash(c, t, k, { n: 0.7, speed: 0.8 });
    vignette(c, 0.55);
  },
};

// ---------- S23 51.93–53.94：他的脚尖又离了地；她把他死死抱住，贴着他的头发哼歌 ----------
export const camS23 = (t: number) =>
  kcam(t, [
    [51.93, { x: X0 - 110, y: -110, z: 3.0 }],
    [53.94, { x: X0 - 105, y: -130, z: 4.0 }, E.io],
  ]);
const s23: Shot = {
  a: 51.93,
  b: 53.94,
  draw(c, t) {
    const k = camS23(t);
    street(c, k, t, {});
    c.save();
    applyCam(c, k);
    const lift = Math.sin(Math.PI * ph(t, 51.95, 52.7));
    pair(c, t, { cover: 0, hug: E.io(ph(t, 52.3, 52.8)), kidFloat: lift });
    c.restore();
    ash(c, t, k, { n: 0.6, speed: 0.7 });
    vignette(c, 0.55 + 0.1 * ph(t, 52.8, 53.9));
  },
};

export const chorus1Shots: Shot[] = [webShotB, s19, s20, s21, s22, s23];
void s17;
void s18;
void W;
void H;
void ghost;
