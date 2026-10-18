// 尾声 2:09.87–2:32 一镜到底：她握住了小石头的手——整条人链一下子沉了，把她从白里拽出来，灰从她身上像雪一样往下掉；
// 人链慢慢落回人间，她那栋楼的窗一扇扇亮起来，链上的人一个个落回街上；镜头落到街上：她那双铁靴空着立在原地（构图 A，
// 和 58.5、107.9 同一个构图）——这一次，她牵着他从上面落进画面：他先落地，她光脚踩在灰里，138.01 落地，留下一个脚印。
// 她跪在他面前；他掏出她那块「活下去」，翻过来，用两块五的笔在背面一笔一画地写：
// 「秤砣，明天见」（镜头推进他的手里，近景溶进来），放进她手心——142.01 砖沉得她的手一下坠下去，暖了：第一块写给她的砖。
// 她哭着笑了，把他抱进怀里；周围光着脚的人把手放在她的肩上、背上；她站起来，光着脚走了一步：148.01「咚」——和铁靴一样响。
// 远景：铺满空鞋的街上站满了光脚的人，灰还在下，白还在天上，家家窗口亮着灯。片名《引力》
import { type C, type Cam, type Shot, W, H, E, ph, kick, shake, jolt, applyCam, vignette, clamp, mix, fill, text, writeOn, camLerp, smearV, flash } from "./core";
import { figure, pose, stone, glowDot, walk, type Fig, type Pt } from "./figure";
import { ash, crack } from "./world";
import { hand, pen } from "./props";
import { towerWorld } from "./chorus2";
import { mirrorCam } from "./inter1";
import { bigBoot } from "./props";
import { drawChain, chainCount, memberHip, shoesOnStreet, CX, BX, QIN_HIP, MEMBERS, type ChainState } from "./chain";
import { qinTop, handMeet } from "./finale1";
import { PAL } from "./palette";

const lerpPt = (a: Pt, b: Pt, e: number): Pt => [mix(a[0], b[0], e), mix(a[1], b[1], e)];
const aimC = (p: Pt, s: Pt, z: number): Cam => ({ x: p[0] - (s[0] - W / 2) / z, y: p[1] - (s[1] - H / 2) / z, z });
const win = (t: number, a: number, b: number, c: number, d: number) => E.io(ph(t, a, b)) * (1 - E.io(ph(t, c, d)));

const N = chainCount(129.87);
const LAND = 138.013; // 她的光脚落地
const QX = CX - 60;
const T_KNEEL = 138.4;
const T_CLOSE = 139.3; // 推进他的手里：近景溶进来
const T_GIVE = 141.25; // 放进她手心
const T_HEAVY = 142.013; // 手一坠
const T_OPEN = 142.75; // 近景溶回去
const T_HUG = 143.2;
const T_HANDS = 145.0; // 周围的人把手放在她肩上
const T_RISE = 147.4; // 她站起来
const T_STEP = 148.013; // 光脚的一声「咚」
const T_WIDE = 148.4;
/** 整条链沉下来的距离（先猛地一沉，再慢慢落） */
const dropAt = (t: number) => (-89 - QIN_HIP) * (0.06 * E.out(ph(t, 129.87, 130.2)) + 0.94 * E.io(ph(t, 129.95, LAND)));
const qinHipY = (t: number) => QIN_HIP + dropAt(t);
const KID_LEG = -pose({ kind: "kid", x: 0, y: 0, grounded: true, barefoot: true }).hip[1];
function sinking(t: number): ChainState {
  const y = qinHipY(t);
  const qj = pose(qinTop(t, { y }));
  return { n: N, drop: dropAt(t), qinAnkle: qj.anR, grab: 1, pull: 1, topHand: handMeet([QX, y]) };
}
/** 小石头挂在她手上，胯比她的胯低这么多（两个人一起往下落） */
const OFF_K = memberHip(0, sinking(129.87), 129.87)[1] - qinHipY(129.87);
const kidHipY = (t: number) => qinHipY(t) + OFF_K;
const KID_X = memberHip(0, sinking(129.87), 129.87)[0];
/** 小石头的脚落地的时刻（他挂在她身边，比她先落地） */
const KID_LAND = (() => {
  for (let t = 132; t < LAND; t += 0.005) if (kidHipY(t) + KID_LEG >= 0) return t;
  return LAND;
})();
/** 她：握着周磊的手被拽下来 → 光脚落地 → 跪在他面前 → 接住砖 → 抱住他 → 站起来走一步 */
function qinFig(t: number): Fig {
  if (t < LAND) {
    const y = qinHipY(t);
    const fl = clamp((-y - 400) / 3000);
    return qinTop(t, { x: QX, y, float: fl, aL: mix(-0.4, -2.6, fl), lean: 0.4 * clamp((-y - 150) / 600), hR: handMeet([QX, y]), head: -0.6, eyes: t < 131 ? "open" : "closed", tears: 1 });
  }
  const land = kick(t, LAND, 0.12);
  const kneel = E.io(ph(t, T_KNEEL, T_KNEEL + 0.35)) * (1 - E.io(ph(t, T_RISE, T_RISE + 0.4)));
  const hug = E.io(ph(t, T_HUG, T_HUG + 0.4)) * (1 - E.io(ph(t, T_RISE - 0.2, T_RISE + 0.2)));
  const step = E.in2(ph(t, T_STEP - 0.25, T_STEP));
  const walking = t > T_RISE + 0.35;
  const kj = pose(kidF(t));
  const f: Fig = { x: QX, y: 0, kind: "qin", facing: 1, barefoot: true, boots: false, legL: mix(0, 1.25, kneel) + (walking ? -0.15 : 0), kneeL: mix(0.5 * land, 1.75, kneel), legR: mix(0, 0.25, kneel) + (walking ? mix(0.5, 0.25, step) : 0), kneeR: mix(0.4 * land, 1.5, kneel) + (walking ? mix(0.6, 0, step) : 0), lean: 0.12 * kneel + 0.15 * hug, head: hug > 0.5 ? -0.5 : mix(0.4, -0.1, kneel), eyes: hug > 0.5 ? "closed" : t > T_HEAVY ? "smile" : "open", tears: 1, warm: 0.15 * E.io(ph(t, T_HEAVY, T_HEAVY + 0.6)), rim: 0.95 };
  if (hug > 0.02) return { ...f, hR: lerpPt([QX + 30, -110], [kj.neck[0] + 4, kj.neck[1] + 18], hug), hL: lerpPt([QX + 20, -100], [kj.hip[0] - 4, kj.hip[1] - 20], hug) };
  if (t < LAND + 0.25) return { ...f, hR: handMeet([QX, qinHipY(LAND)]) }; // 落地的那一下还牵着他的手
  if (t > T_KNEEL + 0.3 && t < T_HUG) {
    // 摊开手掌接住砖
    const fj = pose(f);
    return { ...f, hR: [fj.neck[0] + 30, fj.neck[1] + 60 + (t > T_HEAVY ? 18 : 0)], hL: [fj.neck[0] + 24, fj.neck[1] + 66 + (t > T_HEAVY ? 18 : 0)] };
  }
  return f;
}
const KID = { kind: "kid" as const, bell: true, barefoot: true, rim: 0.9, tears: 1 };
function kidF(t: number): Fig {
  // 挂在她手上往下落：右手握着她的手，左手还攥着她的脚踝
  if (t < KID_LAND) {
    const st = sinking(t);
    return { ...KID, x: KID_X, y: kidHipY(t), grounded: false, facing: -1, float: 0.5, head: 0.9, legL: -0.08, legR: 0.12, kneeL: 0.2, kneeR: 0.1, hR: st.topHand, hL: st.qinAnkle ? [st.qinAnkle[0] - 4, st.qinAnkle[1] + 28] : undefined, eyes: "open" };
  }
  const land = kick(t, KID_LAND, 0.14);
  const x = mix(KID_X, CX + 10, E.io(ph(t, LAND, LAND + 0.4)));
  const holding = t < LAND + 0.25; // 她落地以前还牵着她的手
  const lookUp = t < LAND ? 1.05 : mix(1.05, 0.2, E.io(ph(t, LAND, LAND + 0.4)));
  const write = win(t, 138.8, 139.1, T_GIVE + 0.2, T_GIVE + 0.5);
  const hug = E.io(ph(t, T_HUG, T_HUG + 0.4)) * (1 - E.io(ph(t, T_RISE - 0.2, T_RISE + 0.2)));
  return { ...KID, x, y: 0, grounded: true, facing: -1, kneeL: 0.9 * land, kneeR: 0.8 * land, head: hug > 0.5 ? 0.2 : lookUp - 0.5 * write, hR: holding ? handMeet([QX, Math.min(qinHipY(t), qinHipY(LAND))]) : undefined, aL: write > 0 ? -0.9 : hug > 0.5 ? 0.9 : 0.3, bendL: write > 0 ? 1.4 : hug > 0.5 ? -1.2 : 0, aR: write > 0 ? 0.8 : hug > 0.5 ? -0.9 : -0.2, bendR: write > 0 ? -1.4 : hug > 0.5 ? 1.2 : 0, eyes: hug > 0.5 ? "closed" : "open" };
}

// ---------- 镜头 ----------
function camAt(t: number): Cam {
  // 握住手的近景 → 跟着她往下沉（越退越开，楼的窗一扇扇亮起来）→ 落到街上：构图 A
  const top = (s: number) => aimC([QX + 20, qinHipY(s) + mix(60, -40, E.io(ph(s, 129.87, 131)))], [W / 2, 880], mix(2.8, 1.0, E.io(ph(s, 129.87, 132.5))));
  const mc = (s: number) => mirrorCam(s, 136.3, BX - 40); // 构图 A：她那双铁靴空着立在街上
  let k = camLerp(top(t), mc(t), E.io(ph(t, 135.4, 136.6)));
  if (t < LAND) return k;
  // 她跪在他面前：凑近两个人
  const two = aimC([(QX + CX) / 2 + 10, -110], [W / 2, 1060], 2.7);
  k = camLerp(mc(t), two, E.io(ph(t, LAND + 0.1, T_KNEEL + 0.5)));
  // 推进他的手里（近景从这里溶进来）
  const hands = aimC([(QX + CX) / 2 + 20, -80], [W / 2, 1100], 4.6);
  k = camLerp(k, hands, E.in2(ph(t, 138.9, T_CLOSE + 0.1)));
  if (t < T_OPEN) return k;
  // 抱住他：一路往后舒一口气；周围的人围上来
  const hug = aimC([QX + 30, -130], [W / 2, 1050], 3.0);
  k = camLerp(hands, hug, E.out(ph(t, T_OPEN, T_HUG + 0.4)));
  const ring = aimC([QX + 20, -160], [W / 2, 1100], 1.9);
  k = camLerp(k, ring, E.io(ph(t, T_HANDS - 0.4, 146.8)));
  // 光脚落地的那一下：落到她的脚上
  const foot = aimC([QX + 50, -40], [W / 2, 1150], 3.6);
  k = camLerp(k, foot, E.io(ph(t, T_RISE, T_STEP - 0.05)));
  // 远景：铺满空鞋的街、光脚的人、亮着的窗、她那栋楼、白
  const wide = aimC([QX + 60, -1300], [W / 2, 900], 0.62);
  return camLerp(k, wide, E.soft(ph(t, T_WIDE, 151.5)));
}

// ---------- 近景：他在砖的背面写「秤砣，明天见」，放进她手心；手一坠，暖了 ----------
function closeUp(c: C, t: number) {
  const warm = E.out(ph(t, T_HEAVY, T_HEAVY + 0.7));
  fill(c, "#f1dde0");
  const g = c.createRadialGradient(W / 2, 820, 60, W / 2, 900, 1100);
  g.addColorStop(0, `rgba(255,${Math.round(mix(238, 200, warm))},${Math.round(mix(242, 150, warm))},0.45)`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  const p = ph(t, T_CLOSE + 0.1, T_GIVE - 0.15);
  const give = E.io(ph(t, T_GIVE, T_GIVE + 0.5));
  const palm = E.out(ph(t, T_GIVE - 0.3, T_GIVE + 0.2));
  const dip = t > T_HEAVY ? 120 * (1 - Math.exp(-(t - T_HEAVY) / 0.07)) - 34 * kick(t, T_HEAVY + 0.18, 0.15) : 0;
  // 她摊开的手从下面伸过来
  hand(c, 520, 1500 - palm * 300 + dip, 2.5, -Math.PI / 2 + 0.1, { grip: 0.15 });
  const sx = mix(540, 545, give);
  const sy = mix(1020, 1160, give) + dip;
  stone(c, sx, sy, 140, writeOn("秤砣，明天见", p), warm, 0.07, "#2a2a3a");
  if (t < T_GIVE) {
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
  if (warm > 0.01) {
    const gg = c.createRadialGradient(sx, sy, 0, sx, sy, 700);
    gg.addColorStop(0, `rgba(${PAL.warmRGB},${0.35 * warm})`);
    gg.addColorStop(1, `rgba(${PAL.warmRGB},0)`);
    c.fillStyle = gg;
    c.fillRect(0, 0, W, H);
  }
  vignette(c, 0.55);
}

// ---------- 画 ----------
/** 围上来的人（链上的人落了地）：把手放在她的肩上、背上 */
const NEAR_WALK = T_HANDS - 1.1; // 她救过的那几个人从人群里走过来
const NEAR: [number, number][] = [
  [QX - 120, 2], // 周磊
  [QX - 230, 3], // 千斤
  [QX + 230, 1], // 老钟
  [QX + 330, 4], // 阿满
  [QX - 340, 5], // 窗口的老太太
];
function drawScene(c: C, t: number, k: Cam) {
  const lights = 0.9 * E.io(ph(t, 131.0, 136.5));
  towerWorld(c, t, k, { dawn: 1, lights });
  c.save();
  applyCam(c, k);
  // 她那栋楼的窗：人链落下去的地方一扇扇亮起来
  const topY = qinHipY(Math.min(t, LAND));
  c.fillStyle = PAL.lit;
  for (let r = 0; r < 29; r++) {
    const wy = -(r + 1) * 300 + 80;
    if (wy < topY) continue;
    for (let q = 0; q < 5; q++) {
      c.globalAlpha = 0.9 * clamp((wy - topY) / 500);
      c.fillRect(-430 + q * 180, wy, 60, 110);
    }
  }
  c.globalAlpha = 1;
  shoesOnStreet(c, N);
  // 她那双铁靴：小石头从里面走出来以后一直立在街上
  bigBoot(c, BX - 9, 2, 0.95, 1);
  bigBoot(c, BX + 11, 2, 0.95, 1);
  const st = sinking(Math.min(t, LAND + 3));
  const nearOn = t > NEAR_WALK;
  drawChain(c, t, st, k.y - H / k.z, k.y + H / k.z, { warm: 1, glow: k.z < 0.5 ? 120 : 0, top: kidF(t), skip: nearOn ? NEAR.map(([, mi]) => mi) : undefined });
  // 落了地的人里，她救过的那几个从站开的地方走过来：手放在她的肩上、背上
  if (nearOn) {
    const qj = pose(qinFig(t));
    NEAR.forEach(([nx, mi], i) => {
      const m = MEMBERS[mi];
      const from = memberHip(mi, st, t)[0];
      const go = E.io(ph(t, NEAR_WALK, T_HANDS - 0.1 + i * 0.15));
      const x = mix(from, nx, go);
      const w = walk((t - NEAR_WALK) * 2.2 + i * 0.4, go > 0 && go < 1 ? 0.4 : 0);
      const reach = E.io(ph(t, T_HANDS + i * 0.2, T_HANDS + 0.6 + i * 0.2)) * (1 - E.io(ph(t, T_RISE, T_RISE + 0.3)));
      figure(c, { x, y: 0, kind: m.kind, look: m.look, facing: nx < QX ? 1 : -1, barefoot: true, boots: false, tie: m.tie, head: -0.3, lean: (nx < QX ? 0.15 : -0.15) * reach, legL: w.legL, legR: w.legR, kneeL: w.kneeL, kneeR: w.kneeR, hR: reach > 0.02 ? lerpPt([x + (nx < QX ? 30 : -30), -110], [qj.shR[0] + (i - 2) * 8, qj.shR[1] + 4], reach) : undefined, stone: 0.9, rim: 0.7, tone: 0.05 }, t);
    });
  }
  const qj = figure(c, qinFig(t), t);
  // 灰从她身上像雪一样往下掉（她往下走得比灰快，灰就像从她身上往上飘走）
  if (t < 135) {
    c.fillStyle = "rgba(250,238,242,0.9)";
    for (let i = 0; i < 24; i++) {
      const u = ((t - 129.87) * 0.8 + i * 0.071) % 1;
      const a = i * 2.39;
      c.globalAlpha = (1 - u) * clamp((134.5 - t) / 2);
      c.beginPath();
      c.arc(qj.hip[0] + Math.cos(a) * (20 + u * 80), qj.hip[1] - 60 - u * 260 + Math.sin(a) * 30, 3 + (1 - u) * 3, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  }
  // 光脚落地：一个脚印；光脚走的那一步：石板也裂了
  if (t > LAND) {
    c.fillStyle = "rgba(120,100,125,0.35)";
    c.beginPath();
    c.ellipse(QX + 6, -2, 14, 4, 0, 0, Math.PI * 2);
    c.fill();
  }
  puff(c, t, LAND, QX, 120, 0.7);
  puff(c, t, KID_LAND, CX + 10, 80, 0.5);
  puff(c, t, T_STEP, QX + 52, 110, 0.7);
  crack(c, QX + 52, 0, 70, ph(t, T_STEP, T_STEP + 0.18));
  if (t > T_HEAVY && t < T_RISE) glowDot(c, qj.handR[0], qj.handR[1] + 4, 7, 1); // 她手里那块暖了的砖
  c.restore();
  ash(c, t, k, { n: 0.45, up: t < LAND ? (t - 129.87) * 200 : 0 });
}
function puff(c: C, t: number, at: number, x: number, size: number, dur: number) {
  const u = t - at;
  if (u < 0 || u > dur) return;
  c.save();
  c.fillStyle = PAL.ash;
  c.globalAlpha = 0.85 * (1 - u / dur);
  for (let i = 0; i < 12; i++) {
    const a = (i / 11) * Math.PI;
    const r = 12 + u * size * (0.7 + (i % 3) * 0.2);
    c.beginPath();
    c.ellipse(x + Math.cos(a) * r * 1.4, -6 - Math.sin(a) * r * 0.25 - u * 20, 8 + u * 22, 5 + u * 10, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
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
function endCard(c: C, t: number) {
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
}

const s58: Shot = {
  a: 129.87,
  b: 152.0,
  draw(c, t) {
    const k0 = camAt(t);
    const k = jolt({ ...k0, z: k0.z * (1 + 0.04 * kick(t, LAND, 0.12) + 0.05 * kick(t, T_STEP, 0.12)) }, shake(t, 14 * kick(t, 129.87, 0.15) + 8 * kick(t, LAND, 0.12) + 14 * kick(t, T_STEP, 0.12), 8));
    const kp = camAt(t - 1 / 60);
    const v = Math.abs((k0.y - kp.y) * k0.z);
    const scene = (c: C) => drawScene(c, t, k);
    if (v > 10 && t < LAND) smearV(c, Math.min(120, v * 0.4), scene);
    else scene(c);
    // 近景：推进他的手里溶进来，抱住时溶回去
    const ce = win(t, T_CLOSE - 0.15, T_CLOSE + 0.15, T_OPEN - 0.15, T_OPEN + 0.15);
    if (ce > 0.99) closeUp(c, t);
    else if (ce > 0.01) {
      c.save();
      c.globalAlpha = ce;
      closeUp(c, t);
      c.restore();
    }
    vignette(c, 0.38);
    flash(c, 0.3 * kick(t, T_HEAVY, 0.25), "#ffd9a8");
    endCard(c, t);
  },
};

export const finale2Shots: Shot[] = [s58];
export type { Pt };
