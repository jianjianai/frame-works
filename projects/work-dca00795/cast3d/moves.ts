// 秤砣的动作：几个关键姿势（给动作测试页看）和按时间算的动作（跑、蹲、跳、落地、跪、递砖、走）。
// 坐标都是人物自己的：x 右、y 上（离地）、z 前；H = 站直时胯的高度。
import * as THREE from "three";
import { Puppet, type Side } from "../rig3d/puppet";

const O = new THREE.Vector3(0, 0, 0);

export interface Limbs {
  /** 胯：位移 [右, 上, 前]，转 [前倾, 右倾, 左转] */
  hips?: [number, number, number];
  hipsRot?: [number, number, number];
  /** 腰背 [前弯, 右倾, 左转] */
  spine?: [number, number, number];
  /** 头 [抬头, 左转, 歪] 或看向世界里一点 */
  look?: [number, number, number] | THREE.Vector3;
  /** 手腕位置（人物坐标）和手肘朝哪（人物坐标里的一点） */
  handL?: [number, number, number];
  handR?: [number, number, number];
  elbowL?: [number, number, number];
  elbowR?: [number, number, number];
  /** 手腕转、手指弯 */
  wristL?: [number, number, number];
  wristR?: [number, number, number];
  fingersL?: number;
  fingersR?: number;
  /** 脚踝位置（人物坐标）、膝盖朝哪、脚掌翘起（正值脚尖往上） */
  footL?: [number, number, number];
  footR?: [number, number, number];
  kneeL?: [number, number, number];
  kneeR?: [number, number, number];
  toeL?: number | null;
  toeR?: number | null;
}

/** 把一组肢体参数摆到人身上（先 place 好根节点） */
export function apply(p: Puppet, l: Limbs) {
  const H = p.hipHeight;
  p.hips(l.hips ?? [0, 0, 0], l.hipsRot ?? [0, 0, 0]);
  const sp = l.spine ?? [0, 0, 0];
  p.spine(sp[0], sp[1], sp[2]);
  const loc = (v: [number, number, number]) => p.local(v[0], v[1], v[2]);
  const leg = (s: Side, f?: [number, number, number], k?: [number, number, number], toe?: number | null) => {
    const def: [number, number, number] = s === "L" ? [-0.1, 0.1, 0.02] : [0.1, 0.1, 0.02];
    const knee = k ? loc(k) : loc([s === "L" ? -0.12 : 0.12, H * 0.55, 1]);
    p.leg(s, loc(f ?? def), knee, toe === undefined ? 0 : toe);
  };
  leg("L", l.footL, l.kneeL, l.toeL);
  leg("R", l.footR, l.kneeR, l.toeR);
  if (l.look) p.look(l.look);
  const arm = (s: Side, h?: [number, number, number], e?: [number, number, number]) => {
    const def: [number, number, number] = s === "L" ? [-0.22, H - 0.12, 0.02] : [0.22, H - 0.12, 0.02];
    const elbow = e ? loc(e) : loc([s === "L" ? -0.5 : 0.5, H + 0.05, -0.35]);
    p.arm(s, loc(h ?? def), elbow);
  };
  arm("L", l.handL, l.elbowL);
  arm("R", l.handR, l.elbowR);
  if (l.wristL) p.wrist("L", l.wristL);
  if (l.wristR) p.wrist("R", l.wristR);
  p.fingers("L", l.fingersL ?? 0.3);
  p.fingers("R", l.fingersR ?? 0.3);
}

/** 两组肢体参数插值（数组逐项；look 是世界里一点时取后一组的） */
export function mixLimbs(a: Limbs, b: Limbs, k: number): Limbs {
  const out: Limbs = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof Limbs>;
  for (const key of keys) {
    const va = a[key] as unknown, vb = b[key] as unknown;
    if (Array.isArray(va) && Array.isArray(vb)) (out as Record<string, unknown>)[key] = va.map((x: number, i: number) => x + ((vb as number[])[i] - x) * k);
    else if (typeof va === "number" && typeof vb === "number") (out as Record<string, unknown>)[key] = va + (vb - va) * k;
    else (out as Record<string, unknown>)[key] = k < 0.5 ? (va ?? vb) : (vb ?? va);
  }
  return out;
}

// ---------------------------------------------------------------- 关键姿势（站在原点、朝 +z）

export const KEY = {
  stand: (H: number): Limbs => ({
    spine: [-0.04, 0, 0],
    handL: [-0.21, H - 0.14, 0.03],
    handR: [0.21, H - 0.14, 0.03],
  }),
  lookUp: (H: number): Limbs => ({
    spine: [-0.16, 0, 0],
    look: [0.62, 0, 0],
    handL: [-0.23, H - 0.12, 0.0],
    handR: [0.23, H - 0.12, 0.0],
  }),
  crouch: (H: number): Limbs => ({
    hips: [0, -0.3, -0.05],
    hipsRot: [0.42, 0, 0],
    spine: [0.18, 0, 0],
    look: [0.65, 0, 0],
    handL: [-0.3, H - 0.42, -0.32],
    handR: [0.3, H - 0.42, -0.32],
    elbowL: [-0.4, H - 0.1, -0.6],
    elbowR: [0.4, H - 0.1, -0.6],
    footL: [-0.13, 0.1, 0.06],
    footR: [0.13, 0.1, 0.0],
    fingersL: 0.6,
    fingersR: 0.6,
  }),
  reach: (H: number): Limbs => ({
    hips: [0, 0.02, 0],
    hipsRot: [-0.08, 0.06, 0],
    spine: [-0.2, -0.12, 0],
    look: [0.8, 0.1, 0],
    handR: [0.1, H + 1.02, 0.12],
    elbowR: [0.5, H + 0.6, -0.3],
    handL: [-0.32, H - 0.05, -0.15],
    footL: [-0.1, 0.18, -0.12],
    footR: [0.08, 0.3, -0.2],
    toeL: -0.5,
    toeR: -0.6,
    fingersR: 0.75,
  }),
  land: (H: number): Limbs => ({
    hips: [0, -0.3, 0.06],
    hipsRot: [0.3, 0, 0],
    spine: [0.32, 0, 0],
    look: [-0.1, 0, 0],
    handL: [-0.45, H - 0.25, 0.25],
    handR: [0.22, H + 0.2, 0.15],
    footL: [-0.2, 0.1, 0.08],
    footR: [0.19, 0.1, -0.06],
    fingersR: 0.8,
  }),
  kneelGive: (H: number): Limbs => ({
    hips: [0, -0.46, 0.02],
    hipsRot: [0.12, 0, 0],
    spine: [0.24, 0, 0],
    look: [-0.35, 0, 0],
    // 右膝着地：右脚踝在后面，膝盖朝前下方；左脚在前面踩着地，膝盖立起来
    footR: [0.12, 0.1, -0.5],
    kneeR: [0.12, -0.2, 0.6],
    toeR: 0.9,
    footL: [-0.14, 0.1, 0.32],
    kneeL: [-0.14, H, 1.2],
    handL: [-0.1, H - 0.18, 0.42],
    handR: [0.1, H - 0.18, 0.42],
    elbowL: [-0.4, H - 0.4, 0.1],
    elbowR: [0.4, H - 0.4, 0.1],
    wristL: [0, 0, 0.6],
    wristR: [0, 0, -0.6],
    fingersL: 0.35,
    fingersR: 0.35,
  }),
  run: (H: number): Limbs => ({
    hips: [0, -0.06, 0],
    hipsRot: [0.22, 0, 0.05],
    spine: [0.12, 0, -0.1],
    look: [0.1, 0, 0],
    footL: [-0.1, 0.32, 0.42],
    kneeL: [-0.1, H, 1.2],
    footR: [0.1, 0.42, -0.42],
    kneeR: [0.1, H * 0.4, 1.2],
    toeR: -0.6,
    handL: [-0.24, H - 0.05, -0.32],
    handR: [0.2, H + 0.32, 0.3],
    elbowL: [-0.4, H + 0.1, -0.6],
    elbowR: [0.4, H - 0.1, -0.2],
    fingersL: 0.7,
    fingersR: 0.7,
  }),
};

/** 动作测试页用：每个姿势站在不同位置 */
export const POSES: Record<string, (p: Puppet, t: number) => void> = Object.fromEntries(
  (Object.keys(KEY) as (keyof typeof KEY)[]).map((name, i) => [
    name,
    (p: Puppet) => {
      p.reset();
      p.place(new THREE.Vector3(i * 3, name === "reach" ? 0.5 : 0, 0), 0);
      apply(p, KEY[name](p.hipHeight));
    },
  ]),
);
void O;
