// 活下去 1:53.88–2:09.87：「咚！」小石头跺地叫醒全城 → 老钟推开窗抬头 → 全城脱鞋 → 人链往上长 → 周磊抓住她的脚踝 → 她握住了他的手
import { type C, type Cam, type Shot, W, H, E, ph, kf, kcam, kick, shake, jolt, applyCam, vignette, dissolve, clamp, mix, sY, smearV, fill, flash } from "./core";
import { figure, pose, glowDot, type Fig, type Pt, walk } from "./figure";
import { ash, sky, whiteBand, city, crack, tower, WHITE, ghost } from "./world";
import { street } from "./sets";
import { crowd } from "./props";
import { kidInBoots, whiteGaze, X4 } from "./chorus2";
import { drawChain, chainCount, memberHip, shoesOnStreet, CX, QIN_HIP, type ChainState } from "./chain";

export const STOMPS = [113.9, 114.513, 115.013, 115.513, 116.013, 116.513, 117.013, 117.513];
const camVel = (f: (t: number) => Cam, t: number) => Math.abs(sY(f(t), 0) - sY(f(t - 1 / 60), 0));

/** 她：停在白边上，往下伸手 */
export function qinTop(t: number, o: Partial<Fig> = {}): Fig {
  return { x: CX - 60, y: QIN_HIP, grounded: false, kind: "qin", facing: 1, float: 1, barefoot: true, boots: false, aL: -2.6 + Math.sin(t) * 0.08, aR: 2.5, head: -0.6, legL: -0.1, legR: 0.22, kneeL: 0.35, kneeR: 0.25, rim: 1, ...o };
}
function stompKid(t: number): Fig {
  let s = 0;
  for (const st of STOMPS) if (t >= st - 0.18 && t < st + 0.25) s = Math.max(s, t < st ? (t - st + 0.18) / 0.18 : 1 - (t - st) / 0.25);
  return { x: CX, y: -14, grounded: true, facing: 1, head: 1.0, legR: 0.35 * s, kneeR: 0.9 * s, aL: -0.8, aR: 0.8, lean: -0.05, rim: 0.9, eyes: "wide", tears: 0.7 };
}
function stompShake(t: number): [number, number] {
  let d: [number, number] = [0, 0];
  for (const st of STOMPS) {
    const q = shake(t, 12 * kick(t, st, 0.1), st);
    d = [d[0] + q[0], d[1] + q[1]];
  }
  return d;
}

// ---------- S54 113.88–117.90：「咚！」——他穿着她的靴子拼命跺地；她睁开眼往下看；老钟推开窗，抬起头 ----------
const s54: Shot = {
  a: 113.88,
  b: 117.9,
  draw(c, t) {
    if (t < 114.45) {
      const k = jolt({ x: CX + 10, y: -80, z: 4.2 }, stompShake(t));
      street(c, k, t, {});
      c.save();
      applyCam(c, k);
      for (const st of STOMPS) crack(c, CX + 10, 0, 90, ph(t, st, st + 0.15));
      kidInBoots(c, t, stompKid(t));
      c.restore();
      ash(c, t, k, { n: 0.5 });
      vignette(c, 0.45);
      return;
    }
    if (t < 115.3) {
      const k = { x: CX - 60, y: QIN_HIP - 140, z: 3.6 };
      sky(c, k, {});
      whiteBand(c, k, t, 1);
      fill(c, "#ffffff", 0.45);
      whiteGaze(c, t, 0.8, 0.85, 1, W / 2, 330, 3.6);
      c.save();
      applyCam(c, jolt(k, stompShake(t)));
      const look = E.io(ph(t, 114.55, 115.0));
      figure(c, qinTop(t, { aR: mix(Math.PI - 0.15, 1.6, look), head: mix(0.6, -1.1, look), eyes: look > 0.2 ? "wide" : "closed" }), t);
      c.restore();
      return;
    }
    // 老钟：听出脚步不对，推开十年没开的窗，抬起头
    const k = kcam(t, [[115.3, { x: -1080, y: -330, z: 3.2 }], [117.9, { x: -1080, y: -420, z: 2.5 }, E.io]]);
    street(c, jolt(k, stompShake(t)), t, {});
    c.save();
    applyCam(c, jolt(k, stompShake(t)));
    const open = E.out(ph(t, 115.6, 115.9));
    c.fillStyle = "#b9d1b1";
    c.fillRect(-1220, -560, 300, 560);
    c.fillStyle = "#ffd27a";
    c.globalAlpha = 0.85;
    c.fillRect(-1150, -380, 160, 150);
    c.globalAlpha = 1;
    // 窗扇往外推开
    c.fillStyle = "#b07d5e";
    c.fillRect(-1150 - open * 70, -380, 80 * (1 - open * 0.6), 150);
    c.fillRect(-990 + open * 20, -380, -80 * (1 - open * 0.6), 150);
    const up = E.io(ph(t, 115.9, 116.6));
    figure(c, { x: -1070, y: -230, kind: "old", facing: 1, head: mix(0.1, 1.1, up), lean: -0.15 * up, aR: 1.2 - up * 0.4, bendR: -1.4, aL: -0.6 - up * 0.8, tone: 0.05, stone: 0.8, rim: 0.6, eyes: up > 0.5 ? "wide" : "open", tears: up }, t);
    c.restore();
    ash(c, t, k, { n: 0.45 });
    vignette(c, 0.45);
  },
};

// ---------- S55 117.90–121.89：门一扇扇打开，人们走上街，第一次抬头；周磊踢掉皮鞋飘起来；一个抓一个 ----------
const DOORS = [CX - 760, CX - 430, CX + 380, CX + 700];
const s55: Shot = {
  a: 117.9,
  b: 121.89,
  draw(c, t) {
    const n = chainCount(t);
    const st: ChainState = { n, drop: 0 };
    const topY = n > 0 ? memberHip(0, st, t)[1] : -200;
    const k = kcam(t, [
      [117.9, { x: CX, y: -430, z: 1.55 }],
      [119.4, { x: CX, y: -520, z: 1.4 }, E.io],
      [121.89, { x: CX, y: Math.min(-700, topY + 500), z: 0.85 }, E.io],
    ]);
    street(c, k, t, {});
    c.save();
    applyCam(c, k);
    shoesOnStreet(c, n);
    // 走上街、抬头的人（还没飞起来的）
    const out = ph(t, 118.0, 118.7);
    crowd(c, t, DOORS.map((d, i) => mix(d, d + (i < 2 ? 140 : -140), out)), 0, { tone: 0.15, seed: 44, umbrella: false, look: E.io(ph(t, 118.3, 118.8)) });
    // 周磊：踢掉皮鞋
    if (t < 118.8) {
      figure(c, { x: CX + 230, y: 0, kind: "man", facing: -1, tie: true, head: 1.0, legR: t > 118.55 ? 0.6 : 0, kneeR: t > 118.55 ? 0.3 : 0, stone: 0.8, rim: 0.7, eyes: "open" }, t);
    }
    drawChain(c, t, st, -20000, 400);
    kidInBoots(c, t, { x: CX, y: -14, grounded: true, facing: 1, head: 1.0, hR: n > 0 ? [CX + 4, BOTTOM_ANKLE(st, t)] : undefined, hL: n > 0 ? [CX - 6, BOTTOM_ANKLE(st, t) + 22] : undefined, aL: -0.8, aR: 0.8, rim: 0.9, eyes: "wide" });
    // 称重员脱掉全城最厚的铁靴
    const off = E.io(ph(t, 120.6, 121.1));
    figure(c, { x: CX - 300, y: 0, kind: "weigher", facing: 1, head: 0.9, boots: off < 0.5, barefoot: off >= 0.5, lean: 0.3 * Math.sin(off * Math.PI), tone: 0.05, rim: 0.6, eyes: "open" }, t);
    c.restore();
    ash(c, t, k, { n: 0.45 });
    vignette(c, 0.4);
  },
};
function BOTTOM_ANKLE(s: ChainState, t: number) {
  const k = Math.ceil(s.n) - 1;
  const [, y] = memberHip(k, s, t);
  return y + 92;
}

// ---------- S56 121.89–125.82：人链往上长：穿过破网，擦过一扇扇窗——原来每个人都是轻的 ----------
const camS56 = (t: number) => {
  const st: ChainState = { n: chainCount(t), drop: 0 };
  const topY = memberHip(0, st, t)[1];
  return { x: CX - 20, y: topY + 380, z: kf(t, [[121.89, 0.85], [125.82, 0.62, E.io]]) };
};
const s56: Shot = {
  a: 121.89,
  b: 125.82,
  draw(c, t) {
    const n = chainCount(t);
    const st: ChainState = { n, drop: 0 };
    const k = camS56(t);
    street(c, k, t, { lights: 0.2 });
    c.save();
    applyCam(c, k);
    c.save();
    c.translate(X4 + 1300, 0);
    tower(c, { lights: 0.25 });
    c.restore();
    figure(c, qinTop(t, { alpha: 1 }), t);
    const vy0 = k.y - H / 2 / k.z;
    const vy1 = k.y + H / 2 / k.z;
    drawChain(c, t, st, vy0, vy1, { glow: 70 });
    c.restore();
    ash(c, t, k, { n: 0.45, up: -(t - 121.89) * 300 });
    vignette(c, 0.4);
  },
};

// ---------- S57 125.82–129.87：周磊抓住了她的脚踝；全城的手从地面连到天上；白里的妈妈放下了手；她握住了他的手 ----------
const s57: Shot = {
  a: 125.82,
  b: 129.87,
  draw(c, t) {
    const n = chainCount(t);
    const qj = pose(qinTop(t));
    const st: ChainState = { n, drop: 0, qinAnkle: qj.anR, grab: E.out(ph(t, 125.95, 126.25)) };
    if (t < 126.6 || t >= 128.4) {
      // 近景：抓住脚踝 / 她伸手握住他的手
      const late = t >= 128.4;
      const reach = E.io(ph(t, 128.9, 129.75));
      const zj = pose({ x: memberHip(0, st, t)[0], y: memberHip(0, st, t)[1], grounded: false, kind: "man" });
      const k = late ? kcam(t, [[128.4, { x: CX - 40, y: QIN_HIP + 60, z: 2.6 }], [129.87, { x: CX - 30, y: QIN_HIP + 110, z: 2.9 }, E.io]]) : kcam(t, [[125.82, { x: qj.anR[0] + 20, y: qj.anR[1] + 110, z: 3.3 }], [126.6, { x: qj.anR[0] + 30, y: qj.anR[1] + 140, z: 2.9 }, E.io]]);
      sky(c, k, {});
      whiteBand(c, k, t, 1);
      fill(c, "#ffffff", 0.3);
      whiteGaze(c, t, 0.6, late ? 0.5 * (1 - ph(t, 128.4, 129.2)) : 0.6, late ? 0 : 1, W / 2, 260, 3.4);
      c.save();
      applyCam(c, k);
      figure(c, qinTop(t, late ? { head: -1.1, hR: [mix(qj.handR[0], zj.handL[0] + 10, reach), mix(qj.handR[1], zj.handL[1] - 30, reach)], eyes: "open", tears: 0.8 } : { head: -0.9, eyes: "wide" }), t);
      drawChain(c, t, st, k.y - H / k.z, k.y + H / k.z);
      if (late && reach > 0.95) glowDot(c, zj.handL[0] + 10, zj.handL[1] - 30, 9, 1);
      c.restore();
      flash(c, 0.35 * kick(t, 129.75, 0.2), "#ffd9a8");
      vignette(c, 0.3);
      return;
    }
    // 远景：从地面连到白里的一整条手（一串暖光）
    const k = kcam(t, [[126.6, { x: CX, y: -4650, z: 0.2 }], [128.4, { x: CX, y: -4650, z: 0.195 }, E.lin]]);
    sky(c, k, { night: 0.4 });
    whiteBand(c, k, t, 1);
    city(c, k, { layers: [0, 1, 2], lights: 0.12, night: 0.6 });
    c.save();
    applyCam(c, k);
    c.save();
    c.translate(X4 + 1300, 0);
    tower(c, { lights: 0.1, night: 0.55 });
    c.restore();
    shoesOnStreet(c, n);
    // 白里的妈妈放下了手
    const lower = E.io(ph(t, 126.9, 127.9));
    c.save();
    c.translate(CX - 60, WHITE - 600);
    c.scale(5, 5);
    ghost(c, 0, 0, 1, 0.8 * (1 - lower * 0.6), 1 - lower, t);
    c.restore();
    figure(c, qinTop(t), t);
    drawChain(c, t, st, -20000, 400, { warm: 1, glow: 150 });
    kidInBoots(c, t, { x: CX, y: -14, grounded: true, facing: 1, head: 1.0, aL: Math.PI - 0.3, aR: Math.PI + 0.3, rim: 0.9 });
    crowd(c, t, [CX - 600, CX - 480, CX + 450, CX + 560], 0, { tone: 0.2, seed: 44, umbrella: false, look: 1 });
    c.restore();
    ash(c, t, k, { n: 0.5 });
  },
};

export const finale1Shots: Shot[] = [s54, s55, s56, s57];
void walk;
void dissolve;
void clamp;
void smearV;
void camVel;
export type { Pt };
