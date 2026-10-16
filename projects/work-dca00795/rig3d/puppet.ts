// 摆人物：每帧从静止姿势开始，按顺序给根节点位置和朝向、胯、腰背弯曲、头看向哪里、手伸到哪里（两节 IK）、
// 脚踩在哪里（两节 IK + 脚掌放平）、手指弯曲、表情。全部用世界坐标或人物自己的坐标（x 右、y 上、z 前），任意时刻都能算。
// VRoid 的骨头在静止时没有旋转：每根骨头的局部坐标轴和模型一样（模型的左边是 −x、前面是 −z），子骨头的位置就是这一节的方向。
import * as THREE from "three";
import type { VRMModel } from "./vrm";

const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4();

function worldPos(o: THREE.Object3D, out = new THREE.Vector3()) {
  return out.setFromMatrixPosition(o.matrixWorld);
}
function worldRot(o: THREE.Object3D, out = new THREE.Quaternion()) {
  o.matrixWorld.decompose(_p, out, _s);
  return out;
}

/** 让骨头在世界里指向 F（它到子骨头的那一节），并让它自己的 restU 轴尽量朝 U。 */
function orient(bone: THREE.Object3D, child: THREE.Object3D, restU: THREE.Vector3, F: THREE.Vector3, U: THREE.Vector3) {
  const rf = child.position.clone().normalize();
  const ru = restU.clone().sub(rf.clone().multiplyScalar(restU.dot(rf))).normalize();
  const rr = new THREE.Vector3().crossVectors(rf, ru);
  const f = F.clone().normalize();
  let u = U.clone().sub(f.clone().multiplyScalar(U.dot(f)));
  if (u.lengthSq() < 1e-8) u = new THREE.Vector3(0, 1, 0).sub(f.clone().multiplyScalar(f.y));
  u.normalize();
  const r = new THREE.Vector3().crossVectors(f, u);
  _m1.makeBasis(rf, ru, rr);
  _m2.makeBasis(f, u, r);
  const qw = new THREE.Quaternion().setFromRotationMatrix(_m2.multiply(_m1.transpose()));
  const qp = worldRot(bone.parent!, new THREE.Quaternion()).invert();
  bone.quaternion.copy(qp.multiply(qw));
  bone.updateMatrixWorld(true);
}

export type Side = "L" | "R";
const FINGERS = ["Index", "Middle", "Ring", "Little"];

export class Puppet {
  readonly b: Map<string, THREE.Object3D>;
  readonly scene: THREE.Object3D; // gltf.scene（转了 π、可能缩放过）
  /** 站直时胯离地多高（世界里的米，含缩放），用来算蹲下多少 */
  readonly hipHeight: number;
  pos = new THREE.Vector3();
  yaw = 0;
  constructor(readonly model: VRMModel, readonly footLift = 0) {
    this.b = model.bones as Map<string, THREE.Object3D>;
    this.scene = model.root.children[0];
    this.reset();
    model.root.position.set(0, 0, 0);
    model.root.rotation.set(0, 0, 0);
    model.root.updateMatrixWorld(true);
    this.hipHeight = worldPos(this.bone("hips")).y + footLift;
  }
  bone(n: string) {
    const o = this.b.get(n);
    if (!o) throw new Error("没有骨头 " + n);
    return o;
  }
  /** 回到静止姿势（只动人形骨头；头发、胸这些副骨头由人物自己的 update 管） */
  reset() {
    for (const [, o] of this.b) {
      const r = this.model.rest.get(o);
      if (r) o.quaternion.copy(r);
    }
    const hips = this.bone("hips");
    const hr = (hips.userData.restPos as THREE.Vector3 | undefined) ?? (hips.userData.restPos = hips.position.clone());
    hips.position.copy(hr);
  }
  /** 人物的前、右方向（世界） */
  get forward() {
    return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  }
  get right() {
    return new THREE.Vector3(-Math.cos(this.yaw), 0, Math.sin(this.yaw));
  }
  /** 人物自己的坐标 → 世界：x 右、y 上（离地）、z 前 */
  local(x: number, y: number, z: number, out = new THREE.Vector3()) {
    return out.copy(this.pos).addScaledVector(this.right, x).addScaledVector(this.forward, z).add(new THREE.Vector3(0, y, 0));
  }
  /** 放到地上 pos（脚底），朝 yaw（0 朝 +z） */
  place(pos: THREE.Vector3, yaw: number) {
    this.pos.copy(pos);
    this.yaw = yaw;
    this.model.root.position.set(pos.x, pos.y + this.footLift, pos.z);
    this.model.root.rotation.set(0, yaw, 0);
    this.model.root.updateMatrixWorld(true);
  }
  /** 胯：off 是人物坐标里的位移（米，x 右 y 上 z 前），rot = [前倾, 右倾, 左转]（弧度） */
  hips(off: [number, number, number] = [0, 0, 0], rot: [number, number, number] = [0, 0, 0]) {
    const hips = this.bone("hips");
    const w = this.local(off[0], 0, off[2]).sub(this.pos).add(new THREE.Vector3(0, off[1], 0));
    // 世界位移 → 胯的父节点里的位移
    const parent = hips.parent!;
    const a = worldPos(hips).clone();
    const target = parent.worldToLocal(a.add(w));
    hips.position.copy(target);
    hips.quaternion.copy(this.model.rest.get(hips)!).multiply(_q.setFromEuler(new THREE.Euler(-rot[0], rot[2], -rot[1], "YXZ")));
    hips.updateMatrixWorld(true);
  }
  /** 腰背：前弯、右倾、左转（弧度），分到 spine / chest / upperChest */
  spine(pitch: number, roll = 0, twist = 0) {
    const parts: [string, number][] = [["spine", 0.38], ["chest", 0.34], ["upperChest", 0.28]];
    for (const [n, k] of parts) {
      const o = this.b.get(n);
      if (!o) continue;
      o.quaternion.copy(this.model.rest.get(o)!).multiply(_q.setFromEuler(new THREE.Euler(-pitch * k, twist * k, -roll * k, "YXZ")));
    }
    this.bone("hips").updateMatrixWorld(true);
  }
  /** 头看向世界里的一点（weight 0..1；脖子分 40%，头 60%），或直接给 [抬头, 左转, 歪头] */
  look(target: THREE.Vector3 | [number, number, number], weight = 1) {
    const neck = this.bone("neck"), head = this.bone("head");
    let pitch = 0, yaw = 0, roll = 0;
    if (Array.isArray(target)) [pitch, yaw, roll] = target;
    else {
      neck.parent!.updateMatrixWorld(true);
      const from = worldPos(head);
      const d = target.clone().sub(from);
      // 换到上胸的坐标里（模型前面是 −z）
      const qi = worldRot(neck.parent!, new THREE.Quaternion()).invert();
      d.applyQuaternion(qi);
      yaw = Math.atan2(-d.x, -d.z);
      pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
      yaw = THREE.MathUtils.clamp(yaw, -1.3, 1.3) * weight;
      pitch = THREE.MathUtils.clamp(pitch, -0.9, 0.8) * weight;
    }
    neck.quaternion.copy(this.model.rest.get(neck)!).multiply(_q.setFromEuler(new THREE.Euler(pitch * 0.4, yaw * 0.4, -roll * 0.4, "YXZ")));
    head.quaternion.copy(this.model.rest.get(head)!).multiply(_q.setFromEuler(new THREE.Euler(pitch * 0.6, yaw * 0.6, -roll * 0.6, "YXZ")));
    neck.updateMatrixWorld(true);
  }
  /** 手伸到世界里的 target（手腕位置），手肘朝 pole 那边（世界里的一点） */
  arm(side: Side, target: THREE.Vector3, pole?: THREE.Vector3) {
    const s = side === "L" ? "left" : "right";
    const up = this.bone(s + "UpperArm"), lo = this.bone(s + "LowerArm"), hand = this.bone(s + "Hand");
    up.parent!.updateMatrixWorld(true);
    const pa = worldPos(up);
    const p = pole ?? this.local(side === "L" ? -0.45 : 0.45, worldPos(up).y - this.pos.y - 0.35, -0.35);
    this.ik(up, lo, hand, pa, target, p, new THREE.Vector3(0, 0, 1));
  }
  /** 脚踝踩到世界里的 target，膝盖朝 pole 那边；flat 时脚掌和人的朝向一致、放平（pitch 往上翘为正） */
  leg(side: Side, target: THREE.Vector3, pole?: THREE.Vector3, footPitch: number | null = 0) {
    const s = side === "L" ? "left" : "right";
    const up = this.bone(s + "UpperLeg"), lo = this.bone(s + "LowerLeg"), foot = this.bone(s + "Foot");
    up.parent!.updateMatrixWorld(true);
    const pa = worldPos(up);
    const p = pole ?? pa.clone().addScaledVector(this.forward, 1).add(new THREE.Vector3(0, -0.4, 0));
    this.ik(up, lo, foot, pa, target, p, new THREE.Vector3(0, 0, -1));
    if (footPitch !== null) {
      const want = worldRot(this.scene, new THREE.Quaternion()).multiply(_q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), footPitch));
      foot.quaternion.copy(worldRot(foot.parent!, new THREE.Quaternion()).invert().multiply(want));
      foot.updateMatrixWorld(true);
    }
  }
  private ik(a: THREE.Object3D, b: THREE.Object3D, c: THREE.Object3D, pa: THREE.Vector3, T: THREE.Vector3, P: THREE.Vector3, restU: THREE.Vector3) {
    const la = worldPos(b).distanceTo(pa);
    const lb = worldPos(c).distanceTo(worldPos(b));
    const toT = T.clone().sub(pa);
    const d = THREE.MathUtils.clamp(toT.length(), 1e-4, (la + lb) * 0.9995);
    const u = toT.normalize();
    const pv = P.clone().sub(pa);
    let v = pv.sub(u.clone().multiplyScalar(pv.dot(u)));
    if (v.lengthSq() < 1e-8) v = new THREE.Vector3(0, -1, 0);
    v.normalize();
    const cosA = THREE.MathUtils.clamp((la * la + d * d - lb * lb) / (2 * la * d), -1, 1);
    const sinA = Math.sqrt(1 - cosA * cosA);
    const pb = pa.clone().addScaledVector(u, la * cosA).addScaledVector(v, la * sinA);
    const tgt = pa.clone().addScaledVector(u, d);
    orient(a, b, restU, pb.clone().sub(pa), v);
    orient(b, c, restU, tgt.sub(pb), v);
  }
  /** 手腕的局部旋转（相对小臂）：[x, y, z] 弧度 */
  wrist(side: Side, e: [number, number, number]) {
    const h = this.bone((side === "L" ? "left" : "right") + "Hand");
    h.quaternion.copy(this.model.rest.get(h)!).multiply(_q.setFromEuler(new THREE.Euler(e[0], e[1], e[2], "XYZ")));
    h.updateMatrixWorld(true);
  }
  /** 手指弯曲 0..1（0 伸直，1 握拳）；thumb 单独给 */
  fingers(side: Side, curl: number, thumb = curl * 0.6) {
    const s = side === "L" ? "left" : "right";
    const sign = side === "L" ? 1 : -1;
    for (const f of FINGERS)
      ["Proximal", "Intermediate", "Distal"].forEach((seg, i) => {
        const o = this.b.get(s + f + seg);
        if (!o) return;
        o.quaternion.copy(this.model.rest.get(o)!).multiply(_q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), sign * curl * [1.1, 1.4, 1.0][i]));
      });
    ["Proximal", "Intermediate", "Distal"].forEach((seg, i) => {
      const o = this.b.get(s + "Thumb" + seg);
      if (!o) return;
      o.quaternion.copy(this.model.rest.get(o)!).multiply(_q.setFromEuler(new THREE.Euler(0, -sign * thumb * [0.5, 0.6, 0.6][i], sign * thumb * [0.2, 0.4, 0.4][i])));
    });
  }
  /** 关节（骨头）在世界里的位置 */
  at(n: string) {
    this.bone(n).updateMatrixWorld(true);
    return worldPos(this.bone(n));
  }
}

// ---------------------------------------------------------------- 时间曲线

export const E = {
  lin: (x: number) => x,
  in2: (x: number) => x * x,
  out2: (x: number) => 1 - (1 - x) * (1 - x),
  io: (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
  out3: (x: number) => 1 - Math.pow(1 - x, 3),
  in3: (x: number) => x * x * x,
  smooth: (x: number) => x * x * (3 - 2 * x),
  /** 柔和起步、一路减速 */
  soft: (x: number) => 1 - Math.pow(1 - x, 3) * (1 + 3 * x),
  back: (x: number, k = 1.70158) => 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2),
};
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ph = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const vlerp = (a: THREE.Vector3, b: THREE.Vector3, k: number) => a.clone().lerp(b, k);

/**
 * 关键帧：[{ t, v }]，在相邻两帧之间按后一帧的 ease 插值（数字或数组）。
 */
export function keys<T extends number | number[]>(t: number, ks: { t: number; v: T; e?: (x: number) => number }[]): T {
  if (t <= ks[0].t) return ks[0].v;
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i].t) {
      const a = ks[i - 1], b = ks[i];
      const k = (b.e ?? E.smooth)((t - a.t) / (b.t - a.t));
      if (typeof a.v === "number") return (a.v + ((b.v as number) - a.v) * k) as T;
      return (a.v as number[]).map((x, j) => x + ((b.v as number[])[j] - x) * k) as T;
    }
  }
  return ks[ks.length - 1].v;
}

/**
 * 步态：给每一步落地的时间和落脚点（世界坐标，交替左右），算出 t 时刻两只脚踝的位置和胯的上下起伏。
 * steps[i] = { t: 落地时间, at: 落脚点, side }；脚离地的时间 = 同一只脚下一步落地前 swing 秒。
 */
export interface Step {
  t: number;
  at: THREE.Vector3;
  side: Side;
}
export function gait(t: number, steps: Step[], swing: number, lift = 0.12) {
  const foot = (side: Side) => {
    const mine = steps.filter((s) => s.side === side);
    let prev = mine[0], next: Step | undefined;
    for (const s of mine) {
      if (s.t <= t) prev = s;
      else {
        next = s;
        break;
      }
    }
    if (!next || t < next.t - swing || t < prev.t) return { pos: prev.at.clone(), air: 0, k: 1 };
    const k = clamp01((t - (next.t - swing)) / swing);
    const e = E.io(k);
    const pos = prev.at.clone().lerp(next.at, e);
    const air = Math.sin(Math.PI * k);
    pos.y += lift * air;
    return { pos, air, k };
  };
  const L = foot("L"), R = foot("R");
  // 胯：落地那一下最低，两步中间最高
  let bob = 0;
  for (const s of steps) {
    const dt = t - s.t;
    if (dt > -0.25 && dt < 0.35) bob = Math.min(bob, -Math.exp(-((dt - 0.05) ** 2) / 0.012));
  }
  return { L, R, bob };
}
