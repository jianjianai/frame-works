// 秤砣动作样片：走进来（一步一咚）→ 停下仰头 → 蹲、跳、空中抓住 → 带着铁靴的分量坠下来落地 →
// 单膝跪下、从靴筒里抽出一块砖递出去 → 站起来，笑一下，脚跟轻轻离地一下（送出一块砖，她轻了）。
// 周磊只画一截腿和接砖的手，用来看动作。
import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { BODY, LEG_K, NEUTRAL, STAND34, alive, drawChengtuo, footAt, hipAt, holdBrick, jointsOf, jumpGrab, kneelGive, walk, walkSteps, type PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { type V2, blend, breathAt, clamp01, ease, lerp } from "@materials/剪纸角色/code/rig";

export const sample: Sample = { duration: 9.4 };

const W = 1080;
const H = 1920;
const S = 1.12;
const GY = 1480;
const X0 = 760;

const WALK = { t0: 0.5, period: 1, stride: 92, lift: 44 };
const STOP = 2.0;
const JUMP = 2.55;
const KNEEL = 4.85;
const GIVE = 7.35;
const UP = 7.55;
const GRAB: V2 = [-84, -790];

const phase = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

interface State {
  x: number;
  pose: PoseIn;
  brick: boolean;
}

function stateAt(t: number): State {
  if (t < STOP) {
    const w = walk(t, WALK);
    return { x: w.x, pose: w.pose, brick: false };
  }
  const w = walk(STOP, WALK);
  const xEnd = w.x;
  const wL = w.pose.legL!.to![0];
  const wR = w.pose.legR!.to![0];
  // 停下：前脚踩住不动，身体移到前脚上，后脚收上来
  const shift = wR - footAt(-26, 0)[0];
  const xStop = xEnd + shift;
  if (t < JUMP) {
    const p = ease.inOut(phase(t, STOP, 2.45));
    const q = ease.inOut(phase(t, 2.08, 2.45));
    const j0 = jumpGrab(0);
    const pose = blend(w.pose, j0, p);
    pose.legL = { ...j0.legL, to: [lerp(wL - shift * p, footAt(22, 0)[0], q), footAt(0, -34 - 20 * Math.sin(Math.PI * q))[1]], f: 0.12 * Math.sin(Math.PI * q) };
    pose.legR = { ...j0.legR, to: [wR - shift * p, -BODY.ankleBare], f: 0 };
    pose.t = t;
    pose.expr = alive(blend(w.pose.expr ?? NEUTRAL, j0.expr ?? NEUTRAL, p) as typeof NEUTRAL, t);
    return { x: xEnd + shift * p, pose, brick: false };
  }
  if (t < KNEEL - 0.35) {
    const pose = jumpGrab(t - JUMP);
    pose.breath = breathAt(t) * 0.5;
    return { x: xStop, pose, brick: false };
  }
  if (t < KNEEL) {
    const p = ease.inOut(phase(t, KNEEL - 0.35, KNEEL));
    const pose = blend(jumpGrab(KNEEL - 0.35 - JUMP), kneelGive(0).pose, p);
    pose.t = t;
    return { x: xStop, pose, brick: false };
  }
  if (t < UP) {
    const k = kneelGive(t - KNEEL);
    return { x: xStop, pose: k.pose, brick: k.hasBrick && t < GIVE };
  }
  // 站起来：前脚踩住，身体压上去，后腿收回来
  const kp = kneelGive(UP - KNEEL).pose;
  const shift2 = -88 - -26;
  const p = ease.inOut(phase(t, UP, 8.25));
  const q = ease.inOut(phase(t, UP + 0.12, 8.25));
  const end: PoseIn = {
    ...STAND34,
    face: -0.55,
    neck: 0.06,
    lean: 0.02,
    armL: { a: -0.12, b: 0.25, h: 0, to: [-84, -150], ik: 0, bend: -1, shape: "relax" },
    armR: { a: 0.16, b: 0.3, h: 0, shape: "relax" },
    expr: { ...NEUTRAL, smile: 0.85, happy: 0.75, blush: 0.6, look: [-0.5, 0] },
  };
  const pose = blend(kp, end, p);
  // 脚跟离地一下：送出去一块砖，她轻了
  const lift = Math.sin(Math.PI * phase(t, 8.45, 8.95)) * 9;
  pose.legL = { ...end.legL, to: footAt(lerp(165 - shift2 * p, 22, q), lerp(-74, -34, q) - 26 * Math.sin(Math.PI * q) - lift), f: lerp(-1.1, 0, ease.out(q)) + 0.06 * lift / 9, bend: 1 };
  pose.legR = { ...end.legR, to: footAt(-88 - shift2 * p, -34 - lift), f: 0.06 * lift / 9, bend: 1 };
  pose.hip = [lerp(kp.hip![0], 0, p), lerp(kp.hip![1], hipAt(-297), p) - lift * LEG_K];
  pose.breath = breathAt(t) * 0.6;
  pose.items = { ...pose.items, bricks: 1 };
  pose.t = t;
  pose.expr = alive(pose.expr as typeof NEUTRAL, t, 5);
  pose.expr.look = [lerp(-0.5, -0.2, phase(t, 8.45, 8.9)), lerp(0, 0.7, Math.sin(Math.PI * phase(t, 8.4, 9.1)))];
  return { x: xStop + shift2 * LEG_K * p, pose, brick: false };
}

// ——— 地上的灰：每一脚扬起一圈 ———
interface Puff {
  t: number;
  x: number;
  size: number;
}
const PUFFS: Puff[] = (() => {
  const out: Puff[] = [];
  for (const st of walkSteps(0, STOP, WALK)) {
    const s = stateAt(st + 0.001);
    const j = jointsOf(s.pose);
    const front = Math.min(j.ankleL[0], j.ankleR[0]);
    out.push({ t: st, x: s.x + front, size: 1 });
  }
  const land = JUMP + 1.42;
  const s = stateAt(land);
  out.push({ t: land, x: s.x - 30, size: 2.2 });
  out.push({ t: KNEEL + 0.55, x: stateAt(KNEEL + 0.55).x + 40, size: 0.8 });
  return out;
})();

function drawPuff(ctx: CanvasRenderingContext2D, t: number, p: Puff) {
  const k = (t - p.t) / (0.55 + 0.25 * p.size);
  if (k < 0 || k > 1) return;
  const e = ease.out(k);
  ctx.save();
  ctx.translate(X0 + p.x * S, GY);
  ctx.globalAlpha = (1 - k) * 0.55;
  ctx.fillStyle = "#fff6f2";
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const r = (10 + i * 7) * p.size * (0.5 + e);
      ctx.beginPath();
      ctx.ellipse(s * (30 + i * 26) * p.size * (0.4 + e), -r * 0.5 - i * 4 * e, r, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  // 落地那一下石板裂开
  if (p.size > 2 && t > p.t) {
    ctx.save();
    ctx.translate(X0 + p.x * S, GY + 6);
    ctx.strokeStyle = "rgba(120,96,120,0.55)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    const g = ease.out(clamp01((t - p.t) / 0.12));
    for (const [a, l] of [
      [-0.3, 120],
      [0.25, 90],
      [3.0, 110],
      [3.4, 70],
    ]) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * l * g, Math.sin(a) * l * g * 0.18);
      ctx.lineTo(Math.cos(a + 0.2) * l * 1.3 * g, Math.sin(a + 0.2) * l * 1.3 * g * 0.18);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ——— 周磊：一截腿（被抓住前悬着晃，抓住后跟着她的手下来）和接砖的手 ———
function drawLegAbove(ctx: CanvasRenderingContext2D, t: number, st: State) {
  const tau = t - JUMP;
  const fade = 1 - phase(t, KNEEL - 0.5, KNEEL - 0.1);
  if (fade <= 0) return;
  let ankle: V2 = [GRAB[0] + Math.sin(t * 1.3) * 6, GRAB[1] - 12 + Math.sin(t * 0.9) * 4];
  if (tau >= 0.97) {
    const j = jointsOf(st.pose);
    const w = j.palmR;
    ankle = [w[0] + 2, w[1] - 14];
  }
  const sx = X0 + st.x * S;
  // 抓住前：她的根停在 xStop，脚踝挂在 GRAB
  const ax = sx + ankle[0] * S;
  const ay = GY + ankle[1] * S;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#2a2b40";
  ctx.lineWidth = 46;
  ctx.beginPath();
  ctx.moveTo(ax + 10, ay - 30);
  ctx.lineTo(ax + 40, -40);
  ctx.stroke();
  ctx.strokeStyle = "#8c95ad";
  ctx.lineWidth = 40;
  ctx.stroke();
  // 皮鞋
  ctx.fillStyle = "#3b3346";
  ctx.strokeStyle = "#2a2b40";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(ax - 10, ay + 4, 34, 16, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // 割断的红绳
  ctx.strokeStyle = "#d4483d";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(ax + 6, ay - 22);
  ctx.quadraticCurveTo(ax - 6, ay + 10, ax + 4, ay + 34 + Math.sin(t * 2) * 4);
  ctx.stroke();
  ctx.restore();
}

function drawTaker(ctx: CanvasRenderingContext2D, t: number, brickAt: V2 | null) {
  const inn = ease.inOut(phase(t, 6.75, GIVE));
  const out = ease.inOut(phase(t, GIVE + 0.1, GIVE + 0.75));
  const v = inn - out;
  if (v <= 0.001) return null;
  const target: V2 = brickAt ?? [360, 1150];
  const hx = lerp(-140, target[0] - 30, v);
  const hy = lerp(target[1] + 90, target[1] + 22, v);
  ctx.save();
  ctx.lineCap = "round";
  for (const dy of [26, -6]) {
    ctx.strokeStyle = "#2a2b40";
    ctx.lineWidth = 50;
    ctx.beginPath();
    ctx.moveTo(-60, hy + dy + 70);
    ctx.lineTo(hx - 40, hy + dy);
    ctx.stroke();
    ctx.strokeStyle = "#8c95ad";
    ctx.lineWidth = 44;
    ctx.stroke();
    ctx.fillStyle = "#fde8d6";
    ctx.strokeStyle = "#2a2b40";
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.ellipse(hx - 4, hy + dy, 24, 16, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  return [hx + 12, hy - 4] as V2;
}

function background(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, GY);
  g.addColorStop(0, "#f7d9d6");
  g.addColorStop(0.6, "#fbe9df");
  g.addColorStop(1, "#fdf1e8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, GY);
  const g2 = ctx.createLinearGradient(0, GY, 0, H);
  g2.addColorStop(0, "#e9d3d8");
  g2.addColorStop(1, "#dcc4cf");
  ctx.fillStyle = g2;
  ctx.fillRect(0, GY, W, H - GY);
  ctx.strokeStyle = "rgba(150,120,140,0.25)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const y = GY + 30 + i * i * 14;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

export function createScene({ width, height }: SceneOptions): Scene {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  return {
    canvas,
    render(t) {
      ctx.setTransform(width / W, 0, 0, height / H, 0, 0);
      background(ctx);
      const st = stateAt(t);
      const j = jointsOf(st.pose);
      const sx = X0 + st.x * S;
      // 影子：离地越高越小越淡
      const footY = Math.max(j.ankleL[1], j.ankleR[1]);
      const air = clamp01((-BODY.ankleBare - footY) / 215);
      ctx.fillStyle = `rgba(110,80,110,${0.16 * (1 - air * 0.6)})`;
      ctx.beginPath();
      ctx.ellipse(sx + ((j.ankleL[0] + j.ankleR[0]) / 2) * S, GY, 120 * (1 - air * 0.4), 16, 0, 0, Math.PI * 2);
      ctx.fill();
      for (const p of PUFFS) drawPuff(ctx, t, p);
      drawLegAbove(ctx, t, st);
      ctx.save();
      ctx.translate(sx, GY);
      ctx.scale(S, S);
      drawChengtuo(ctx, st.pose, st.brick ? { hold: { L: holdBrick } } : {});
      ctx.restore();
      // 砖递出去以后在接的人手里
      const palm: V2 = [sx + j.palmL[0] * S, GY + j.palmL[1] * S];
      const hand = drawTaker(ctx, t, t < GIVE ? palm : stateBrickAt(t));
      if (t >= GIVE && hand) {
        ctx.save();
        ctx.translate(hand[0], hand[1]);
        ctx.scale(S, S);
        ctx.fillStyle = "#dcd7cd";
        ctx.strokeStyle = "#2a2b40";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-18, -13, 36, 27, 3);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}

function stateBrickAt(t: number): V2 {
  void t;
  const st = stateAt(GIVE - 0.001);
  const j = jointsOf(st.pose);
  return [X0 + st.x * S + j.palmL[0] * S, GY + j.palmL[1] * S];
}
