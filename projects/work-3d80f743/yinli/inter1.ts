// 间奏 0:53.94–1:11.97：十二年前（妈妈把铁靴套在她脚上）→ 夜里小刀抵着脚绳 → 敲门声 → 小石头 → 两根绳系在一起
import { type C, type Shot, W, H, E, ph, kf, kcam, kick, shake, jolt, applyCam, vignette, dissolve, caption, clamp, mix, buf, blit, flash, fill } from "./core";
import { figure, pose, rope, type Fig, type Pt, walk } from "./figure";
import { ash, BEDPOST } from "./world";
import { street, qinRoom } from "./sets";
import { knife, bigBoot, crowd } from "./props";
import { camS23 } from "./chorus1";
import { qinFloatSleep } from "./chorus1";
import { QIN_SIT } from "./pre1";
import { LOOKS } from "./palette";

const X0 = 3200; // 同一条街
const FB = "sepia(0.55) saturate(0.85) brightness(1.06) contrast(0.9)"; // 回忆：褪色的暖色老照片

/** 回忆里的画面：画进缓冲，再整幅洗白 */
function memory(c: C, draw: (c: C) => void, alpha = 1) {
  const b = buf(2);
  draw(b.c);
  blit(c, b, alpha, FB);
  // 白边
  const g = c.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 1150);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(1, `rgba(255,243,226,${0.6 * alpha})`);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}

// 回忆：妈妈（穿着铁靴）和七岁的她，一起飘起来
const momLift = (t: number) => kf(t, [[53.94, 60], [56.0, 210, E.io], [57.5, 260], [58.5, 330, E.in2], [60.6, 1500, E.in2]]);
function mom(t: number, o: Partial<Fig> = {}): Fig {
  const h = momLift(t);
  return { x: X0, y: -h - 89, grounded: false, kind: "woman", look: LOOKS.mom, facing: -1, float: 0.75, boots: true, aR: -0.5, aL: -2.0 + Math.sin(t) * 0.1, head: -0.5, rim: 0.6, ...o };
}
function little(t: number, hand: Pt | null, o: Partial<Fig> = {}): Fig {
  if (hand) return { x: hand[0] + 6, y: hand[1] + 80, grounded: false, kind: "little", facing: -1, float: 0.5, hL: hand, head: 0.7, legL: 0.1, legR: -0.15, kneeL: 0.3, kneeR: 0.2, rim: 0.7, ...o };
  return { x: X0 + 60, y: -14, kind: "little", facing: -1, head: 1.0, aL: 0.3, aR: -0.2, barefoot: true, rim: 0.7, ...o };
}

// ---------- S24 53.94–56.0：匹配剪辑到十二年前：七岁的她拉着妈妈的手，两个人一起离地 ----------
const s24: Shot = {
  a: 53.94,
  b: 56.0,
  draw(c, t) {
    const now = (c: C) => {
      const k = camS23(53.94);
      street(c, k, t, {});
      c.save();
      applyCam(c, k);
      figure(c, { x: X0 - 70, y: 0, kind: "kid", facing: -1, head: -0.2, rim: 0.75 }, t);
      figure(c, { x: X0 - 170, y: 0, kind: "qin", facing: 1, legL: 1.15, kneeL: 1.9, legR: 0.8, kneeR: 1.5, lean: 0.37, head: -0.25, rim: 0.85, eyes: "closed" }, t);
      c.restore();
      vignette(c, 0.65);
    };
    const then = (c: C) =>
      memory(c, (c) => {
        const k = kcam(t, [
          [53.94, { x: X0 + 40, y: -200, z: 4.0 }],
          [56.0, { x: X0 + 20, y: -330, z: 2.3 }, E.soft],
        ]);
        street(c, k, t, {});
        c.save();
        applyCam(c, k);
        crowd(c, t, [X0 - 520, X0 - 380, X0 + 400, X0 + 540], 0, { tone: 0.35, seed: 9 });
        const mj = figure(c, mom(t), t);
        figure(c, little(t, mj.handL, { y: mj.handL[1] + 80 + Math.max(0, 140 - (momLift(t) - 60)) * 0.0 }), t);
        c.restore();
        ash(c, t, k, { n: 0.4 });
      });
    dissolve(c, ph(t, 53.94, 54.35), now, then);
    caption(c, ["十二年前"], t, 54.15, 55.9, 260, 60);
  },
};

// ---------- S25 56.0–58.5：妈妈在半空中脱下铁靴，套在她脚上；她掉回地面，妈妈松开手 ----------
const s25: Shot = {
  a: 56.0,
  b: 58.5,
  draw(c, t) {
    memory(c, (c) => {
      const k = jolt(kcam(t, [[56.0, { x: X0 + 20, y: -330, z: 2.3 }], [58.5, { x: X0 + 40, y: -260, z: 2.0 }, E.io]]), shake(t, 9 * kick(t, 57.513, 0.12), 2));
      street(c, k, t, {});
      c.save();
      applyCam(c, k);
      crowd(c, t, [X0 - 520, X0 - 380, X0 + 400, X0 + 540], 0, { tone: 0.35, seed: 9 });
      const bend = E.io(ph(t, 56.05, 56.45)) * (1 - E.io(ph(t, 57.2, 57.5)));
      const off = E.io(ph(t, 56.35, 57.15));
      const drop = E.in2(ph(t, 57.25, 57.513));
      const mj = figure(c, mom(t, { boots: off < 0.05, barefoot: off >= 0.05, lean: -0.5 * bend, head: -0.9, hR: bend > 0.3 ? undefined : undefined, aR: mix(-0.5, 0.3, bend), eyes: "open", tears: 1 }), t);
      // 小的她：拉着妈妈的手 → 掉回地面，脚上是那双大靴子
      const held = t < 57.25;
      const lp = held ? little(t, mj.handL) : little(t, null);
      const ground = mix(mj.handL[1] + 80, -14, drop);
      const lj = figure(c, held ? lp : { ...lp, y: ground, grounded: drop >= 1, x: X0 + 30, ...(drop < 1 ? { grounded: false, y: mix(mj.handL[1] + 80, -70, drop) } : {}) }, t);
      // 两只铁靴：从妈妈脚上 → 小的她脚上
      for (const [i, an] of [mj.anL, mj.anR].entries()) {
        const target = i === 0 ? lj.anL : lj.anR;
        const p = E.io(ph(t, 56.35 + i * 0.25, 56.9 + i * 0.25));
        bigBoot(c, mix(an[0], target[0], p), mix(an[1] + 4, target[1] + 2, p), 1, -1, (1 - Math.abs(p - 0.5) * 2) * 0.6);
      }
      c.restore();
      ash(c, t, k, { n: 0.4 });
    });
  },
};

// ---------- S26 58.5–61.65：妈妈升进白。七岁的她穿着大靴子站在灰里仰着头，整条街的人都低着头 ----------
export const MIRROR_CAM = { x: X0 + 30, y: -413, z: 1.55 };
const s26: Shot = {
  a: 58.5,
  b: 61.65,
  draw(c, t) {
    memory(c, (c) => {
      const k = kcam(t, [[58.5, { x: X0 + 40, y: -330, z: 1.9 }], [59.4, MIRROR_CAM, E.io], [61.65, { ...MIRROR_CAM, z: 1.62 }, E.lin]]);
      street(c, k, t, {});
      c.save();
      applyCam(c, k);
      crowd(c, t, [X0 - 470, X0 - 350, X0 - 230, X0 + 300, X0 + 420, X0 + 540], 0, { tone: 0.3, seed: 9, head: -0.8 });
      if (t < 60.6) figure(c, mom(t, { barefoot: true, boots: false, float: 1, aL: -2.4, aR: 2.4, head: 0.4 }), t);
      const lj = figure(c, little(t, null), t);
      bigBoot(c, lj.anL[0], lj.anL[1] + 2, 1, -1);
      bigBoot(c, lj.anR[0], lj.anR[1] + 2, 1, -1);
      c.restore();
      ash(c, t, k, { n: t > 60.7 ? 0.9 : 0.35 });
    });
    // 头顶一闪
    const f = kick(t, 60.6, 0.3);
    if (f > 0.01) {
      const g = c.createLinearGradient(0, 0, 0, 700);
      g.addColorStop(0, `rgba(255,255,255,${0.9 * f})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, 700);
    }
  },
};

// ---------- S27 61.65–64.0：夜。她坐在床边，小刀抵着脚绳——笃、笃、笃 ----------
const KNOCKS = [62.013, 62.513, 63.013];
const s27: Shot = {
  a: 61.65,
  b: 64.0,
  xin: 0.45,
  draw(c, t) {
    let shk: [number, number] = [0, 0];
    for (const kt of KNOCKS) {
      const s = shake(t, 7 * kick(t, kt, 0.09), kt);
      shk = [shk[0] + s[0], shk[1] + s[1]];
    }
    const k = jolt(
      kcam(t, [
        [61.65, { x: -175, y: -30, z: 6.0 }],
        [62.1, { x: -175, y: -32, z: 6.3 }, E.lin],
        [63.2, { x: -120, y: -150, z: 3.0 }, E.io],
        [64.0, { x: 120, y: -220, z: 2.0 }, E.io],
      ]),
      shk,
    );
    c.save();
    applyCam(c, k);
    qinRoom(c, t, { night: 0.9, boots: 1 });
    const turn = E.io(ph(t, 62.55, 63.1));
    const rise = E.io(ph(t, 63.4, 64.0));
    const sit: Fig = { ...QIN_SIT, head: mix(-0.7, 0.1, turn), lean: mix(0.35, 0.05, turn), eyes: "open" };
    const sj = pose(sit);
    const knifeAt: Pt = [mix(sj.anR[0] - 6, sj.anR[0] + 40, rise), mix(sj.anR[1] - 30, sj.anR[1] - 120, rise)];
    const j = figure(c, rise > 0 ? { ...sit, x: mix(-230, -150, rise), y: mix(-62, -150, rise), legL: mix(1.35, 0.1, rise), legR: mix(1.25, -0.1, rise), kneeL: mix(1.4, 0.1, rise), kneeR: mix(1.3, 0.1, rise), hR: knifeAt } : { ...sit, hR: knifeAt, hL: [sj.anR[0] - 24, sj.anR[1] - 26] }, t);
    rope(c, BEDPOST, j.anR, 34, 3.2);
    knife(c, knifeAt[0] - 4, knifeAt[1] + 4, 0.55, rise > 0 ? -0.9 : 0.5);
    c.restore();
    vignette(c, 0.6);
  },
};

// ---------- S28 64.0–67.0：门外是小石头：攥着妈妈割断的绳头，喘着气 ----------
function kidAtDoor(t: number, o: Partial<Fig> = {}): Fig {
  const pant = Math.sin(t * 9) * 0.04;
  return { x: 640, y: 0, kind: "kid", facing: -1, lean: 0.12 + pant, head: 0.35, aR: 0.9, bendR: -1.3, aL: -0.2, rim: 0.85, eyes: "open", bell: true, ...o };
}
const s28: Shot = {
  a: 64.0,
  b: 67.0,
  draw(c, t) {
    const k = kcam(t, [
      [64.0, { x: 120, y: -220, z: 2.0 }],
      [64.6, { x: 470, y: -200, z: 2.6 }, E.io],
      [67.0, { x: 520, y: -170, z: 3.1 }, E.io],
    ]);
    c.save();
    applyCam(c, k);
    const open = E.out(ph(t, 64.0, 64.5));
    qinRoom(c, t, { night: 0.9, boots: 1, doorOpen: open });
    const kj = figure(c, kidAtDoor(t), t);
    // 他手里的绳头
    rope(c, kj.handR, [kj.handR[0] + 6, kj.handR[1] + 60], 6, 2.6);
    const w = walk(t * 2, 0.3 * (1 - ph(t, 64.3, 64.6)));
    const kneel = E.io(ph(t, 65.6, 66.3));
    figure(c, { x: mix(300, 430, E.io(ph(t, 64.0, 64.6))), y: 0, kind: "qin", facing: 1, legL: mix(w.legL, 1.2, kneel), kneeL: mix(w.kneeL, 2.0, kneel), legR: mix(w.legR, 0.4, kneel), kneeR: mix(w.kneeR, 1.7, kneel), lean: 0.05 + 0.15 * kneel, head: mix(0.0, 0.2, kneel), hR: [mix(470, 520, kneel), mix(-120, -70, kneel)], rim: 0.75, eyes: "open" }, t);
    knife(c, mix(470, 520, kneel), mix(-120, -70, kneel), 0.55, -0.9);
    c.restore();
    vignette(c, 0.55);
  },
};

// ---------- S29 67.0–69.5：小刀放下。她把他的绳头和自己的脚绳系成一个结，两人躺下 ----------
const s29: Shot = {
  a: 67.0,
  b: 69.5,
  draw(c, t) {
    const tie = (c: C) => {
      const k = kcam(t, [[67.0, { x: 520, y: -170, z: 3.1 }], [68.6, { x: 580, y: -70, z: 3.8 }, E.io]]);
      c.save();
      applyCam(c, k);
      qinRoom(c, t, { night: 0.9, boots: 1, doorOpen: 1 });
      const kj = figure(c, kidAtDoor(t, { aR: 0.2, bendR: -0.4, head: -0.5 }), t);
      const qj = figure(c, { x: 430, y: 0, kind: "qin", facing: 1, legL: 1.2, kneeL: 2.0, legR: 0.4, kneeR: 1.7, lean: 0.3, head: -0.6, hR: [kj.anR[0] - 30, kj.anR[1] - 8], hL: [kj.anR[0] - 46, kj.anR[1] - 4], rim: 0.75, eyes: "open" }, t);
      // 两根绳：他的绳头 ← 结 → 她的脚绳
      const knot: Pt = [kj.anR[0] - 38, kj.anR[1] - 6];
      rope(c, kj.anR, knot, 8, 2.6);
      rope(c, qj.anR, knot, 14, 3.2);
      c.fillStyle = "#d9d2c1";
      c.beginPath();
      c.arc(knot[0], knot[1], 5 * E.out(ph(t, 67.8, 68.4)), 0, Math.PI * 2);
      c.fill();
      knife(c, 360, -152, 0.6, 0.2); // 放在桌上
      c.restore();
      vignette(c, 0.6);
    };
    const lie = (c: C) => {
      const k = { x: -200, y: -200, z: 2.3 };
      c.save();
      applyCam(c, k);
      qinRoom(c, t, { night: 0.9, boots: 1 });
      bedPair(c, t, 0);
      c.restore();
      vignette(c, 0.6);
    };
    dissolve(c, ph(t, 68.75, 69.2), tie, lie);
  },
};

/** 床上：她（飘起来的程度 p）和小石头（攥着她的衣角） */
function bedPair(c: C, t: number, p: number) {
  const kid: Fig = { x: -300, y: -100, grounded: false, kind: "kid", facing: 1, lean: -1.5, legL: 1.5, legR: 1.45, kneeL: 0.2, kneeR: 0.1, head: 0.1, rim: 0.6, eyes: "closed", barefoot: true };
  const kp = pose(kid);
  const qin = qinFloatSleep(t, p * 0.55, { eyes: "closed" });
  const qj = pose(qin);
  const sleeve: Pt = [mix(qj.neck[0], qj.hip[0], 0.6), mix(qj.neck[1], qj.hip[1], 0.6) + 8];
  figure(c, { ...kid, hR: [mix(kp.shR[0], sleeve[0], 1), mix(kp.shR[1], sleeve[1], 1)] }, t);
  const j = figure(c, qin, t);
  rope(c, BEDPOST, j.anR, mix(30, 4, p), 3.2);
  rope(c, kp.anR, [mix(BEDPOST[0], j.anR[0], 0.55), mix(BEDPOST[1], j.anR[1], 0.55)], 20, 2.6);
}

// ---------- S30 69.5–71.97：她又飘起来了——这次只飘到半空：他的手攥着她的衣角 ----------
const s30: Shot = {
  a: 69.5,
  b: 71.97,
  draw(c, t) {
    const k = kcam(t, [[69.5, { x: -200, y: -200, z: 2.3 }], [71.97, { x: -230, y: -260, z: 2.05 }, E.io]]);
    c.save();
    applyCam(c, k);
    qinRoom(c, t, { night: mix(0.9, 0.3, ph(t, 71.2, 71.97)), boots: 1 });
    bedPair(c, t, E.io(ph(t, 69.7, 70.9)));
    c.restore();
    vignette(c, 0.6);
    flash(c, 0.0);
    fill(c, "#ffffff", 0);
  },
};

export const inter1Shots: Shot[] = [s24, s25, s26, s27, s28, s29, s30];
export { bedPair };
void clamp;
