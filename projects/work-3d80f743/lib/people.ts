// 片子里的人：女主和配角都来自素材库「剪纸角色」，路人用素材库的 passerby（几种衣服、发型轮着用）。
// 画人：世界坐标里 translate 到根（两脚之间的地面），描边按镜头倍数 1/√z 调细，近景不显得笨重。

import { type CastSpec, drawCast, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import { type DrawOptions, type GaitStep, type PoseIn, gait } from "@materials/剪纸角色/code/chengtuo";
import { seeded } from "@frame/engine/math";

// 低着头走：身子微微前倾，头垂着，手臂摆得小
const SLUMP: GaitStep[] = [
  { at: 0, p: { hipL: 16, kneeL: -4, ankleL: -6, hipR: -12, kneeR: -10, ankleR: 0, shoulderL: -9, elbowL: 10, shoulderR: 9, elbowR: 14, lean: 7, neck: -24 } },
  { at: 0.22, ease: "out", p: { hipL: 11, kneeL: -16, ankleL: 6, hipR: -15, kneeR: -22, ankleR: 8, shoulderL: -6, elbowL: 12, shoulderR: 6, elbowR: 16, lean: 8, neck: -24 } },
  { at: 0.5, p: { hipL: -2, kneeL: -4, ankleL: 6, hipR: 8, kneeR: -32, ankleR: 16, shoulderL: 0, elbowL: 12, shoulderR: 1, elbowR: 14, lean: 7, neck: -23 } },
  { at: 0.75, p: { hipL: -11, kneeL: -2, ankleL: 4, hipR: 18, kneeR: -14, ankleR: 0, shoulderL: 9, elbowL: 14, shoulderR: -9, elbowR: 12, lean: 7, neck: -24 } },
];

export interface Walker {
  spec: CastSpec;
  /** 起点（层坐标）、方向（−1 往左，1 往右）、一步几秒、第一步的时刻 */
  x0: number;
  dir: -1 | 1;
  step: number;
  t0: number;
  seed: number;
  /** 风（往画面右为正）：头发、衣角按素材库的 4 秒循环飘 */
  wind?: number;
}

export function makeWalkers(n: number, seed: number, xMin: number, xMax: number): Walker[] {
  const r = seeded(seed);
  return Array.from({ length: n }, (_, i) => ({
    spec: passerby(Math.floor(r() * 40)),
    x0: xMin + r() * (xMax - xMin),
    dir: r() < 0.5 ? -1 : 1,
    step: 0.52 + r() * 0.12,
    t0: -r() * 2,
    seed: i,
  }));
}

/** 路人在 t 时的根和姿势 */
export function walkerAt(w: Walker, t: number) {
  const f = gait(SLUMP, t, {
    look: lookOf(w.spec),
    step: w.step,
    t0: w.t0,
    base: { face: w.dir < 0 ? -0.85 : 0.85, expression: "低头看", smile: 0, sad: 0.25, lookY: 1, wind: w.wind ?? 0.85 },
    idle: true,
    seed: w.seed,
  });
  // 朝右的人整套镜像：步子算出来的根是按朝左算的，要取反
  return { pose: f.pose, x: w.x0 + (w.dir < 0 ? f.x : -f.x) * w.spec.scale };
}

/** 在世界坐标里画一个配角：根在 (x, y)，z 是画面上的倍数（描边按它调细） */
export function drawPerson(g: CanvasRenderingContext2D, spec: CastSpec, pose: PoseIn, x: number, y: number, z: number, opts: DrawOptions = {}) {
  g.save();
  g.translate(x, y);
  drawCast(g, spec, pose, { line: 1 / Math.sqrt(Math.max(0.3, z)), ...opts });
  g.restore();
}
