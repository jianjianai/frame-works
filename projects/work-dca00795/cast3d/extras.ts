// 配角：都用 VRoid 样例模型（许可见作品 AGENTS.md），尽量保留原来的衣服换颜色，按剧情加几样东西。
// 贴图缩到 1024（配角在画面里不会太大，省显存）。
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { loadVRM, toonify, hide, colorize, toBone, outlineMaterial, type VRMModel } from "../rig3d/vrm";
import { bodySource, hullRing, rigidPart, paintedToon } from "../rig3d/garment";
import { hairChain, aimChain } from "../rig3d/hairchain";
import type { Character3D } from "./chengtuo";

const M = (n: string) => `films/work-dca00795/models/${n}.glb`;

/** 脚踝上一截割断的红绳：一圈 + 垂下来的一小段（他们自己割断了脚绳） */
function cutCord(model: VRMModel, side: "left" | "right", y: number, legRe: RegExp) {
  const src = bodySource(model);
  const leg = model.bones.get(side + "LowerLeg")!;
  const ar = hullRing(src, y, (b) => legRe.test(b), 24);
  const rr = Math.max(...ar.r) + 0.004;
  const ring = new THREE.TorusGeometry(rr, 0.0045, 6, 26);
  ring.rotateX(Math.PI / 2);
  ring.translate(ar.cx, y, ar.cz);
  rigidPart(model, leg, ring, { colors: ["#c0402f"], paint: ``, outline: 1.2 });
  // 断掉的那一截：从脚踝后面垂下来，末端散开一点
  const tail = new THREE.CylinderGeometry(0.0042, 0.0032, 0.16, 6, 4);
  tail.translate(0, -0.08, 0);
  tail.rotateZ(0.25);
  tail.translate(ar.cx + rr * 0.7, y, ar.cz + rr * 0.6);
  rigidPart(model, leg, tail, { colors: ["#c0402f"], paint: ``, outline: 1.2 });
}

export interface Extra extends Character3D {
  /** 头发（有骨头链的长发）失重时往上飘：每帧在 puppet 摆完以后调 */
  hair?: (t: number, float: number) => void;
}

/**
 * 开场那个女人：飘在强光里，张着手、闭着眼笑，眼泪往上飘，脚踝上一截割断的红绳。
 * HairSample_Female（CC0）：原来的白色连衣裙染成淡紫，赤脚，双马尾的头发失重时往上飘。
 */
export async function buildWoman(): Promise<Extra> {
  const model = await loadVRM(M("HairSample_Female"), { maxTexture: 1024 });
  toonify(model, { outline: 1.8 });
  hide(model, (n) => /Shoes|HAIR_02/.test(n));
  colorize(model, (n) => /Tops/.test(n), "#8f7aa8", "#efe6f6", 0.25, 0.95);
  colorize(model, (n) => /HAIR/.test(n), "#2a1f2a", "#6b5560", 0.08, 0.6);
  colorize(model, (n) => /EyeIris/.test(n), "#2a1c1a", "#8a6050", 0.05, 0.75);
  colorize(model, (n) => /Body_00_SKIN/.test(n), "#000000", "#000000", 0, 1, { below: 0.3, color: "#efc4b4" });
  cutCord(model, "right", 0.165, /R_(LowerLeg|Foot)/);
  // 头发的骨头链（双马尾和后面的长发）：失重时整串往上飘
  const chains: THREE.Object3D[][] = [];
  model.root.traverse((o) => {
    if (/HairJoint/.test(o.name) && !/HairJoint/.test(o.parent?.name ?? "")) chains.push(hairChain(model, o.name.slice(10, 18)));
  });
  const tmp = new THREE.Vector3();
  const hair = (t: number, float: number) => {
    const ff = float * float * (3 - 2 * float);
    chains.forEach((c, i) => {
      if (c.length < 3) return;
      aimChain(c, (k, at) => {
        const sway = Math.sin(t * 1.3 + i * 1.7 - k * 0.7) * (0.15 + 0.35 * ff);
        void at;
        return tmp.set(sway, -1 + 2.2 * ff, Math.cos(t * 1.1 + i - k * 0.6) * 0.25 * ff);
      });
    });
  };
  return { model, update: () => {}, footLift: -0.02, hair };
}

/**
 * 周磊（35 岁，职员）：那天早上丢了工作，在街上站着站着就飘了起来，公文包从手里滑下去。
 * Base_Male（CC0）：原来的白衬衫、马甲、领带、西裤换成灰蓝的一身，蓝领带，黑发，眼镜；脚踝上一截割断的红绳。
 */
export async function buildZhouLei(): Promise<Extra & { glasses: THREE.Object3D }> {
  const model = await loadVRM(M("Base_Male"), { maxTexture: 1024 });
  toonify(model, { outline: 1.8 });
  colorize(model, (n) => /Tops/.test(n), "#3d4a66", "#e8edf6", 0.12, 0.8);
  colorize(model, (n) => /Tie/.test(n), "#1f3c7a", "#4f7bd0", 0.05, 0.7);
  colorize(model, (n) => /Bottoms/.test(n), "#3a4560", "#6f7d9c", 0.05, 0.6);
  colorize(model, (n) => /Shoes/.test(n), "#2a2023", "#5a4640", 0.05, 0.6);
  colorize(model, (n) => /HAIR/.test(n), "#1d1a20", "#4a4650", 0.1, 0.7);
  colorize(model, (n) => /EyeIris/.test(n), "#1e1614", "#6a5040", 0.05, 0.75);
  cutCord(model, "left", 0.15, /L_(LowerLeg|Foot)/);
  // 眼镜：细框，挂在头上
  const head = model.bones.get("head")!;
  const glasses = new THREE.Group();
  const frameMat = new THREE.MeshBasicMaterial({ color: "#2b2530" });
  const lensGeo = new THREE.TorusGeometry(0.019, 0.0016, 6, 24);
  for (const sx of [-1, 1]) {
    const lens = new THREE.Mesh(lensGeo, frameMat);
    lens.scale.set(1.15, 0.85, 1);
    lens.position.set(sx * 0.03, 0, 0);
    glasses.add(lens);
  }
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.0013, 0.0013, 0.02, 5), frameMat);
  bridge.rotation.z = Math.PI / 2;
  glasses.add(bridge);
  glasses.position.copy(toBone(model, head, new THREE.Vector3(0, 1.605, -0.092)));
  glasses.rotation.y = Math.PI;
  head.add(glasses);
  return { model, update: () => {}, footLift: 0, glasses };
}

/** 公文包（棕色皮的）：自己是一个物体，挂在手上或者自己往下掉 */
export function briefcase() {
  const g = new THREE.Group();
  const body = new RoundedBoxGeometry(0.4, 0.29, 0.09, 3, 0.02);
  const mat = paintedToon(
    `
      col = uC0;
      if (abs(rp.y - 0.06) < 0.004) col = uC1;
      if (abs(rp.x) < 0.035 && rp.y > 0.035 && rp.y < 0.085 && abs(rp.z) > 0.04) col = uC2;
    `,
    ["#7a4f36", "#5c3a28", "#d6b25c"],
  );
  body.setAttribute("aRest", (body.getAttribute("position") as THREE.BufferAttribute).clone());
  const m = new THREE.Mesh(body, mat);
  m.add(new THREE.Mesh(body, outlineMaterial(1.6, 0x241c28, false)));
  g.add(m);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.009, 6, 16, Math.PI), new THREE.MeshToonMaterial({ color: "#5c3a28" }));
  handle.position.y = 0.145;
  g.add(handle);
  return g;
}
