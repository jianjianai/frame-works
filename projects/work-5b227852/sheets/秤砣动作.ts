// 秤砣动作样片（开场救周磊那一段）：从画面右边走进来（一步一咚）→ 停下、仰头 → 蹲、跳、空中抓住他的脚踝 →
// 带着铁靴的分量坠下来落地 → 单膝跪下、从靴筒里抽出一块砖递出去 → 站起来，笑一下，脚跟轻轻离地一下（送出一块砖，她轻了）。
// 周磊只画一截腿和接砖的手，用来看动作。全部只依赖时间，可以任意跳转。
import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import {
  JUMP_GRAB,
  KNEEL_GIVE,
  POSES,
  drawChengtuo,
  holdBrick,
  jointsOf,
  jumpGrabKeys,
  kneelGiveKeys,
  legR,
  playMove,
  shiftKeys,
  walk,
  walkSteps,
  type MoveFrame,
  type MoveKey,
} from "@materials/剪纸角色/code/chengtuo";
import { type V2, clamp01, ease, lerp } from "@materials/剪纸角色/code/rig";
import { CHENGTUO } from "@materials/剪纸角色/code/chengtuo-draw";

export const sample: Sample = { duration: 10 };

const W = 1080;
const H = 1920;
const S = 1.1;
const GY = 1480;
const X0 = 1240;

// 时间表
const STEP = 0.5;
const STOP = 2.0;
const JUMP = STOP + 0.55;
const JUMP_END = JUMP + 2.6;
/** 跪下递砖那段从这里算（它的第一帧站着去掉，直接从落地站稳的姿势跪下去） */
const KB = JUMP_END + 0.15;
const KNEEL = KB + KNEEL_GIVE.kneel;
const GRAB_T = JUMP + JUMP_GRAB.grab;
const LAND_T = JUMP + JUMP_GRAB.land;
const GIVE_T = KB + KNEEL_GIVE.give;

const phase = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

// 停下以后是一整串关键帧：前脚踩住、后脚收上来、仰头 → 跳起来抓 → 跪下递砖（跪下从落地的姿势直接过去）
const STOP_FRAME = walk(STOP, { step: STEP });
const KEYS: MoveKey[] = [
  { t: STOP, p: STOP_FRAME.options, x: STOP_FRAME.x },
  { t: STOP + 0.22, ease: "out", plant: "L", p: { ...STOP_FRAME.options, ...legR(6, -46, -20), lean: 4 } },
  ...shiftKeys(jumpGrabKeys(), JUMP).map((k, i) => (i === 0 ? { ...k, plant: "L" as const } : k)),
  ...shiftKeys(kneelGiveKeys(), KB, true),
];

function stateAt(t: number): MoveFrame & { brick: boolean } {
  if (t < STOP) return { ...walk(t, { step: STEP }), brick: false };
  const f = playMove(KEYS, t, { look: CHENGTUO, idle: t < JUMP || t > KB + KNEEL_GIVE.stood, seed: 3 });
  const k = t - KB;
  return { ...f, brick: k >= KNEEL_GIVE.pull - 0.05 && t < GIVE_T + 0.05 };
}

// 抓住的那一刻手在哪：他的脚踝就挂在那里
const GRAB_AT: V2 = (() => {
  const f = stateAt(GRAB_T);
  const p = jointsOf(f.pose).palmR;
  return [f.x + p[0], p[1] - 8];
})();

// ——— 地上的灰：每一脚扬起一圈 ———
interface Puff {
  t: number;
  x: number;
  size: number;
}
const PUFFS: Puff[] = (() => {
  const out: Puff[] = [];
  for (const st of walkSteps(0, STOP, { step: STEP })) {
    const s = stateAt(st + 0.001);
    const j = jointsOf(s.pose);
    out.push({ t: st, x: s.x + Math.min(j.ankleL[0], j.ankleR[0]), size: 1 });
  }
  const s = stateAt(LAND_T);
  out.push({ t: LAND_T, x: s.x, size: 2.2 });
  out.push({ t: KNEEL, x: stateAt(KNEEL).x + 60, size: 0.8 });
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
function drawLegAbove(ctx: CanvasRenderingContext2D, t: number, st: MoveFrame) {
  const fade = 1 - phase(t, KNEEL - 0.3, KNEEL + 0.1);
  if (fade <= 0) return;
  let ankle: V2 = [GRAB_AT[0] + Math.sin(t * 1.3) * 6, GRAB_AT[1] + Math.sin(t * 0.9) * 4];
  if (t >= GRAB_T) {
    const p = jointsOf(st.pose).palmR;
    ankle = [st.x + p[0], p[1] - 8];
  }
  const ax = X0 + ankle[0] * S;
  const ay = GY + ankle[1] * S;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#2a2b40";
  ctx.lineWidth = 46;
  ctx.beginPath();
  ctx.moveTo(ax + 10, ay - 30);
  ctx.lineTo(ax + 40, ay - 420);
  ctx.stroke();
  ctx.strokeStyle = "#8c95ad";
  ctx.lineWidth = 40;
  ctx.stroke();
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

function drawTaker(ctx: CanvasRenderingContext2D, t: number, target: V2) {
  const inn = ease.inOut(phase(t, GIVE_T - 0.6, GIVE_T));
  const out = ease.inOut(phase(t, GIVE_T + 0.15, GIVE_T + 0.8));
  const v = inn - out;
  if (v <= 0.001) return null;
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

/** 砖在她手里时的位置（递出去的那一刻） */
const BRICK_AT: V2 = (() => {
  const f = stateAt(GIVE_T - 0.001);
  const p = jointsOf(f.pose).palmL;
  return [X0 + (f.x + p[0]) * S, GY + p[1] * S];
})();

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
      const air = clamp01((st.pose.hip![1] + 280) / -230);
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
      const hand = drawTaker(ctx, t, t < GIVE_T ? palm : BRICK_AT);
      if (t >= GIVE_T + 0.05 && hand) {
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
