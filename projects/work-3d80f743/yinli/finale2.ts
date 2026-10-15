// 尾声 2:09.87–2:32：整条人链沉下来 → 一串暖光落回人间 → 这一次有人回来了 → 背面的字 → 手一坠 → 光脚的一声「咚」
import { type C, type Shot, W, H, E, ph, kf, kcam, kick, shake, jolt, applyCam, vignette, clamp, mix, fill, text, writeOn } from "./core";
import { figure, pose, stone, glowDot, type Fig, type Pt } from "./figure";
import { ash, sky, whiteBand, city, tower } from "./world";
import { street } from "./sets";
import { hand, pen, crowd } from "./props";
import { kidInBoots, X4 } from "./chorus2";
import { drawChain, chainCount, shoesOnStreet, CX, QIN_HIP, type ChainState } from "./chain";
import { qinTop } from "./finale1";

const N = chainCount(129.87);
const LAND = 138.013;
/** 整条链沉下来的距离 */
const dropAt = (t: number) => (-89 - QIN_HIP) * E.io(ph(t, 129.87, LAND));
const qinHipY = (t: number) => QIN_HIP + dropAt(t);
const QX = CX - 60;
function sinking(t: number): ChainState {
  const qj = pose(qinTop(t, { y: qinHipY(t) }));
  return { n: N, drop: dropAt(t), qinAnkle: qj.anR, grab: 1 };
}
function qinDown(t: number, o: Partial<Fig> = {}): Fig {
  const y = qinHipY(t);
  const fl = clamp((-y - 400) / 3000);
  return qinTop(t, { x: QX, y, float: fl, aL: mix(-0.4, -2.6, fl), aR: mix(0.6, 1.2, fl), head: -0.4, eyes: "closed", ...o });
}

// ---------- S58/S59 129.87–136.0：整条人链一下子沉了；一串暖光从天上落回人间，经过的窗一扇扇亮起来 ----------
const s58: Shot = {
  a: 129.87,
  b: 136.0,
  draw(c, t) {
    const y = qinHipY(t);
    const k = { x: QX + 20, y: y - 60 + kf(t, [[129.87, 0], [132, 300], [136, 200]]), z: kf(t, [[129.87, 2.4], [132.0, 1.0, E.io], [136.0, 0.75, E.io]]) };
    const lights = 0.85 * E.io(ph(t, 131.5, 136.0));
    street(c, k, t, { lights });
    c.save();
    applyCam(c, k);
    c.save();
    c.translate(X4 + 1300, 0);
    tower(c, { lights: lights * 0.9 });
    c.restore();
    shoesOnStreet(c, N);
    const st = sinking(t);
    drawChain(c, t, st, k.y - H / k.z, k.y + H / k.z, { warm: 1, glow: 80 });
    const qj = figure(c, qinDown(t), t);
    // 灰从她身上像雪一样往下掉（她往下走得比灰快，灰就像从她身上往上飘走）
    c.fillStyle = "rgba(250,238,242,0.9)";
    for (let i = 0; i < 24; i++) {
      const u = ((t - 129.87) * 0.8 + i * 0.071) % 1;
      const a = i * 2.39;
      c.globalAlpha = (1 - u) * clamp((134 - t) / 2);
      c.beginPath();
      c.arc(qj.hip[0] + Math.cos(a) * (20 + u * 80), qj.hip[1] - 60 - u * 260 + Math.sin(a) * 30, 3 + (1 - u) * 3, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
    kidInBoots(c, t, { x: CX, y: -14, grounded: true, facing: 1, head: 1.0, aL: -0.6, aR: 0.6, rim: 0.9 });
    c.restore();
    ash(c, t, k, { n: 0.45, up: (t - 129.87) * 260 });
    vignette(c, 0.4);
  },
};

// ---------- S60 136.0–139.0：地面：他穿着大靴子仰着头——她从上面落进画面（十二年前那个镜头，这一次有人回来了） ----------
const s60: Shot = {
  a: 136.0,
  b: 139.0,
  draw(c, t) {
    const k = jolt({ x: CX - 20, y: -413, z: 1.55 }, shake(t, 6 * kick(t, LAND, 0.12), 4));
    street(c, k, t, { lights: 0.85 });
    c.save();
    applyCam(c, k);
    shoesOnStreet(c, N);
    const st = sinking(t);
    drawChain(c, t, st, -3000, 400, { warm: 1 });
    figure(c, qinDown(t, { eyes: t > LAND ? "open" : "closed", head: t > LAND ? 0.2 : -0.4 }), t);
    kidInBoots(c, t, { x: CX + 40, y: -14, grounded: true, facing: -1, head: mix(1.0, 0.4, ph(t, LAND, 138.6)), aL: 0.3, aR: -0.2, rim: 0.9, eyes: "open", tears: 1 });
    // 光脚落地：灰扬起来，留下一个脚印
    if (t > LAND) {
      const u = t - LAND;
      c.fillStyle = `rgba(245,232,236,${0.8 * Math.exp(-u * 2.5)})`;
      for (let i = 0; i < 8; i++) {
        c.beginPath();
        c.arc(QX + (i - 3.5) * 16 * (1 + u * 3), -8 - u * 30, 8 + u * 22, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
    ash(c, t, k, { n: 0.4 });
    vignette(c, 0.45);
  },
};

// ---------- S61 139.0–142.0：他把那块「活下去」翻过来，用两块五的笔在背面一笔一画地写：「秤砣，明天见」，放进她手心 ----------
function darkClose(c: C, warm = 0) {
  fill(c, "#f1dde0");
  const g = c.createRadialGradient(W / 2, 820, 60, W / 2, 900, 1100);
  g.addColorStop(0, `rgba(${Math.round(mix(235, 255, warm))},${Math.round(mix(238, 200, warm))},${Math.round(mix(242, 150, warm))},0.42)`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}
const s61: Shot = {
  a: 139.0,
  b: 142.0,
  draw(c, t) {
    darkClose(c);
    const p = ph(t, 139.3, 141.0);
    const give = E.io(ph(t, 141.2, 141.85));
    const palm = E.out(ph(t, 140.9, 141.4));
    // 她摊开的手从下面伸过来
    hand(c, 520, 1500 - palm * 300, 2.5, -Math.PI / 2 + 0.1, { grip: 0.1 });
    const sx = mix(540, 545, give);
    const sy = mix(1020, 1160, give);
    stone(c, sx, sy, 140, writeOn("秤砣，明天见", p), 0, 0.07, "#2a2a3a");
    if (t < 141.15) {
      const n = 6;
      const i = Math.min(n - 1, Math.floor(p * n));
      const wob = Math.sin(t * 22) * 13;
      const px = sx - 2.5 * 46 + i * 46 + wob;
      const py = sy + Math.cos(t * 17) * 9;
      pen(c, px, py, -0.95, 2.2);
      hand(c, px + 200, py - 240, 1.45, 2.2, { grip: 0.85, left: true, tone: "#6fb07a", skin: "#f7dac7" });
    } else {
      hand(c, 820 + give * 60, 1000 - give * 120, 1.45, Math.PI + 0.6, { grip: 0.2, tone: "#6fb07a", skin: "#f7dac7" });
    }
    vignette(c, 0.55);
  },
};

// ---------- S62 142.0–148.0：砖沉得她的手一下坠下去——第一块写给她的、暖的砖。她哭着笑了，抱住他；周围光着脚的人把手放在她肩上 ----------
const s62: Shot = {
  a: 142.0,
  b: 148.0,
  draw(c, t) {
    if (t < 143.4) {
      darkClose(c, ph(t, 142.0, 142.8));
      const dip = t > 142.013 ? 110 * (1 - Math.exp(-(t - 142.013) / 0.07)) - 30 * kick(t, 142.2, 0.15) : 0;
      hand(c, 520, 1200 + dip, 2.5, -Math.PI / 2 + 0.1, { grip: 0.25 });
      stone(c, 545, 1160 + dip, 140, "秤砣，明天见", E.out(ph(t, 142.0, 142.7)), 0.07, "#2a2a3a");
      vignette(c, 0.5);
      return;
    }
    if (t < 145.0) {
      const k = { x: QX + 10, y: -150, z: kf(t, [[143.4, 5.2], [145.0, 5.6, E.lin]]) };
      street(c, k, t, { lights: 0.85 });
      c.save();
      applyCam(c, k);
      figure(c, { x: QX, y: 0, kind: "qin", facing: 1, barefoot: true, boots: false, head: -0.2, aR: 0.7, bendR: -1.6, rim: 0.9, eyes: "smile", tears: 1, warm: 0.15, stone: undefined }, t);
      c.restore();
      vignette(c, 0.5);
      return;
    }
    const hug = E.io(ph(t, 145.0, 145.6));
    const out = E.io(ph(t, 146.2, 148.0));
    const k = { x: QX + 30, y: mix(-140, -230, out), z: mix(3.6, 2.2, out) };
    street(c, k, t, { lights: 0.85 });
    c.save();
    applyCam(c, k);
    shoesOnStreet(c, N);
    const kj = pose({ x: CX - 10, y: -14, grounded: true, kind: "kid", facing: -1 });
    kidInBoots(c, t, { x: CX - 10, y: -14, grounded: true, facing: -1, head: 0.3, aL: 0.9, bendL: -1.2, aR: -0.9, bendR: 1.2, rim: 0.9, eyes: "closed", tears: 0.8 });
    figure(c, { x: QX, y: 0, kind: "qin", facing: 1, barefoot: true, boots: false, legL: mix(0, 1.1, hug), kneeL: mix(0, 1.9, hug), legR: mix(0, 0.7, hug), kneeR: mix(0, 1.5, hug), lean: 0.2 * hug, head: mix(-0.2, -0.4, hug), hR: hug > 0.3 ? [kj.neck[0] + 4, kj.neck[1] + 18] : undefined, hL: hug > 0.3 ? [kj.hip[0] - 4, kj.hip[1] - 20] : undefined, rim: 0.9, eyes: "closed", tears: 1, warm: 0.12 }, t);
    // 周围的人：手放在她的肩上、背上
    const near: [number, Fig["kind"], boolean][] = [
      [QX - 120, "man", true],
      [QX - 230, "girl", false],
      [QX + 210, "old", false],
      [QX + 320, "worker", false],
      [QX - 340, "weigher", false],
    ];
    const qj = pose({ x: QX, y: 0, kind: "qin", facing: 1, legL: 1.1, kneeL: 1.9, legR: 0.7, kneeR: 1.5, lean: 0.2 });
    near.forEach(([x, kind, tie], i) => {
      const reach = E.io(ph(t, 146.4 + i * 0.25, 147.0 + i * 0.25));
      figure(c, { x, y: 0, kind, facing: x < QX ? 1 : -1, barefoot: true, boots: false, tie, head: -0.3, lean: (x < QX ? 0.15 : -0.15) * reach, hR: reach > 0 ? [mix(x + 30, qj.shR[0] + (i - 2) * 8, reach), mix(-110, qj.shR[1] + 4, reach)] : undefined, stone: 0.9, rim: 0.7, tone: 0.05 }, t);
    });
    c.restore();
    ash(c, t, k, { n: 0.35 });
    vignette(c, 0.45);
  },
};

// ---------- S63 148.0–149.0：她站起来，光着脚走了一步：「咚」——和铁靴一样响 ----------
const s63: Shot = {
  a: 148.0,
  b: 149.0,
  draw(c, t) {
    const k = jolt({ x: QX + 40, y: -40, z: 5.5 }, shake(t, 12 * kick(t, 148.013, 0.12), 8));
    street(c, k, t, { lights: 0.85 });
    c.save();
    applyCam(c, k);
    const step = E.in2(ph(t, 147.8, 148.013));
    figure(c, { x: QX, y: 0, kind: "qin", facing: 1, barefoot: true, boots: false, legR: mix(0.5, 0.25, step), kneeR: mix(0.6, 0, step), legL: -0.15, rim: 0.9, warm: 0.2 }, t);
    if (t > 148.013) {
      const u = t - 148.013;
      c.fillStyle = `rgba(245,232,236,${0.85 * Math.exp(-u * 2.5)})`;
      for (let i = 0; i < 9; i++) {
        const r = Math.abs(Math.sin(i * 7.3));
        c.beginPath();
        c.arc(QX + 40 + (i - 4) * (8 + r * 9) * (1 + u * 4), -4 - u * (14 + r * 30), (4 + r * 6) + u * (10 + r * 14), 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
    vignette(c, 0.5);
  },
};

// ---------- S64 149.0–152.0：远景：铺满空鞋的街上站满了光脚的人，灰还在下，白还在天上，家家窗口亮着灯。片名 ----------
function heart(c: C, x: number, y: number, s: number, a: number) {
  c.save();
  c.globalAlpha = a;
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = "#ff4f6a";
  c.beginPath();
  c.moveTo(0, 30);
  c.bezierCurveTo(-60, -10, -40, -60, 0, -30);
  c.bezierCurveTo(40, -60, 60, -10, 0, 30);
  c.fill();
  c.restore();
}
const s64: Shot = {
  a: 149.0,
  b: 152.0,
  draw(c, t) {
    const k = kcam(t, [[149.0, { x: QX, y: -900, z: 0.9 }], [152.0, { x: QX, y: -1300, z: 0.62 }, E.soft]]);
    street(c, k, t, { lights: 0.9 });
    c.save();
    applyCam(c, k);
    c.save();
    c.translate(X4 + 1300, 0);
    tower(c, { lights: 0.9 });
    c.restore();
    shoesOnStreet(c, N);
    drawChain(c, t, sinking(LAND + 2), -3000, 400, { warm: 1 });
    figure(c, { x: QX, y: 0, kind: "qin", facing: 1, barefoot: true, boots: false, head: 0.6, rim: 0.9 }, t);
    kidInBoots(c, t, { x: CX + 20, y: -14, grounded: true, facing: -1, head: 0.6, hR: [QX + 22, -95], rim: 0.9 });
    crowd(c, t, [QX - 900, QX - 760, QX + 700, QX + 860], 0, { tone: 0.2, seed: 61, umbrella: false, look: 1 });
    c.restore();
    ash(c, t, k, { n: 0.5 });
    vignette(c, 0.45);
    // 片名和引导（盖在最后的画面上，黑场前一直在）
    fill(c, "#000000", E.io(ph(t, 151.2, 152.0)) * 0.85);
    text(c, "《引力》", W / 2, 400, 112, { alpha: E.out(ph(t, 149.25, 149.9)), shadow: 26, weight: 800 });
    const g = ph(t, 150.0, 150.4);
    if (t > 150.0) {
      const u = t - 150.0;
      c.save();
      c.strokeStyle = `rgba(255,255,255,${0.7 * Math.exp(-u * 2.5)})`;
      c.lineWidth = 6;
      for (const d of [0, 0.15]) {
        if (u < d) continue;
        c.beginPath();
        c.arc(W / 2, 1080, 60 + (u - d) * 420, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
      heart(c, W / 2, 1080, E.back(ph(t, 150.05, 150.35)) * 2.4, clamp(1.6 - u * 0.25));
    }
    text(c, "点赞的人，明天都有人等你", W / 2, 1300, 54, { alpha: g, shadow: 18, weight: 700 });
    text(c, "在评论区写一句「明天见」", W / 2, 1405, 48, { alpha: ph(t, 150.3, 150.7), shadow: 16, weight: 700 });
    text(c, "给一个你想拉住的人", W / 2, 1475, 48, { alpha: ph(t, 150.3, 150.7), shadow: 16, weight: 700 });
    // 往下的箭头
    const ar = ph(t, 150.5, 150.9);
    if (ar > 0) {
      c.save();
      c.globalAlpha = ar;
      c.strokeStyle = "#f4f1ea";
      c.lineWidth = 6;
      c.lineCap = "round";
      const ay = 1530 + Math.sin(t * 6) * 8;
      c.beginPath();
      c.moveTo(W / 2, ay);
      c.lineTo(W / 2, ay + 60);
      c.moveTo(W / 2 - 22, ay + 38);
      c.lineTo(W / 2, ay + 62);
      c.lineTo(W / 2 + 22, ay + 38);
      c.stroke();
      c.restore();
    }
  },
};

export const finale2Shots: Shot[] = [s58, s60, s61, s62, s63, s64];
void sky;
void whiteBand;
void city;
void glowDot;
export type { Pt };
