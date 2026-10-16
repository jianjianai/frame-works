// VRoid 模型自己的头发骨头（HairJoint-…，一串一串的）：按世界方向一节一节摆，
// 用来把后面的长发收成马尾、让鬓发自然垂下、失重时往上飘。静止时这些骨头没有旋转，子骨头的位置就是这一节的方向。
import * as THREE from "three";
import type { VRMModel } from "./vrm";

/** 从名字里带 id 的那根骨头开始，沿子骨头往下的一串。 */
export function hairChain(model: VRMModel, id: string): THREE.Object3D[] {
  let start: THREE.Object3D | undefined;
  model.root.traverse((o) => {
    if (!start && o.name.includes(id)) start = o;
  });
  const out: THREE.Object3D[] = [];
  let o = start;
  while (o) {
    out.push(o);
    o = o.children.find((c) => /HairJoint/.test(c.name));
  }
  return out;
}

const pq = new THREE.Quaternion();
const at = new THREE.Vector3();
const want = new THREE.Vector3();
const rest = new THREE.Vector3();
const tp = new THREE.Vector3(), ts = new THREE.Vector3();

/** 每一节朝 dir(i, 这一节起点的世界坐标) 给的世界方向。 */
export function aimChain(chain: THREE.Object3D[], dir: (i: number, at: THREE.Vector3) => THREE.Vector3) {
  if (!chain.length) return;
  chain[0].parent!.updateWorldMatrix(true, false);
  for (let i = 0; i < chain.length - 1; i++) {
    const j = chain[i];
    j.quaternion.identity();
    j.updateWorldMatrix(false, false);
    at.setFromMatrixPosition(j.matrixWorld);
    j.parent!.matrixWorld.decompose(tp, pq, ts);
    pq.invert();
    want.copy(dir(i, at)).normalize().applyQuaternion(pq);
    rest.copy(chain[i + 1].position).normalize();
    j.quaternion.setFromUnitVectors(rest, want);
    j.updateWorldMatrix(false, false);
  }
}

/** 一串骨头回到静止。 */
export function resetChain(chain: THREE.Object3D[]) {
  for (const j of chain) j.quaternion.identity();
}
