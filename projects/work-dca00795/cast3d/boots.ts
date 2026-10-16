// 秤砣的铁靴：全片的签名道具（「咚」、踩裂的石板、靴口露出的「活下去」砖；后来套到小石头脚上）。
// 按脚踝为原点做好（y 朝上，脸朝 −z，单位米，大小按秤砣），挂到任何 VRoid 人物的小腿和脚上：
// 靴筒和砖跟小腿走，靴头和靴底跟脚走。是硬的铁，不蒙皮。
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { paintedToon, ringGeometry, type Ring } from "../rig3d/garment";
import { outlineMaterial } from "../rig3d/vrm";
import { brickMesh } from "../rig3d/parts";

const C = {
  iron: "#7a7380",
  ironDark: "#524c59",
  rope: "#d2bb8e",
  ropeDark: "#a48d64",
  rust: "#a8653f",
  sole: "#2f2b35",
  inside: "#2a2630",
  rivet: "#b9b2bd",
};

/** 靴底比脚底低多少（人站在地上时把人往上抬这么多） */
export const BOOT_SOLE = 0.02;
/** 靴口离脚踝多高 */
export const BOOT_TOP = 0.365;
/** 一块砖：宽、高、厚（米）。递到人手里能看清「活下去」 */
export const BRICK: [number, number, number] = [0.052, 0.105, 0.026];

// 靴筒的轮廓：从上到下（先是靴口里面那一圈往上，翻过靴口的厚边，再沿外面往下），[y, 左右半径, 前后半径]
const PROFILE: [number, number, number][] = [
  [0.335, 0.07, 0.083],
  [0.365, 0.071, 0.085],
  [0.367, 0.085, 0.099],
  [0.345, 0.085, 0.099],
  [0.342, 0.077, 0.091],
  [0.3, 0.074, 0.088],
  [0.232, 0.071, 0.083],
  [0.229, 0.078, 0.09],
  [0.201, 0.078, 0.09],
  [0.198, 0.071, 0.082],
  [0.142, 0.068, 0.079],
  [0.139, 0.075, 0.086],
  [0.111, 0.075, 0.086],
  [0.108, 0.068, 0.078],
  [0.06, 0.067, 0.077],
  [-0.035, 0.066, 0.075],
];
const AXIS_Z = 0.006; // 靴筒中心在脚踝后面一点（小腿肚）

const SHAFT_PAINT = `
  vec2 d = vec2(rp.x - uC9.x, rp.z - uC9.z);
  float ang = atan(d.y, d.x);
  float u = ang / 6.2831853;
  col = mix(uC1, uC0, smoothstep(-0.02, 0.3, rp.y));
  float n = vnoise(rp * 30.0) * 0.65 + vnoise(rp * 80.0 + 7.0) * 0.35;
  col = mix(col, uC4, smoothstep(0.64, 0.67, n) * 0.65);
  // 两道麻绳：斜着拧的纹
  bool rope = (rp.y > 0.11 && rp.y < 0.14) || (rp.y > 0.2 && rp.y < 0.23);
  if (rope) {
    float tw = fract(u * 40.0 + rp.y / 0.03 * 1.0);
    col = tw < 0.28 ? uC3 : uC2;
  }
  // 靴口的厚边 + 一圈铆钉
  if (rp.y > 0.343) {
    col = uC1;
    float k = fract(u * 14.0) - 0.5;
    vec2 q = vec2(k * 6.2831853 * 0.09 / 14.0, rp.y - 0.3555);
    if (length(q) < 0.0042) col = uC7;
  }
  if (!gl_FrontFacing) col = uC6;
`;

const FOOT_PAINT = `
  col = mix(uC1, uC0, smoothstep(-0.12, -0.02, rp.y));
  float n = vnoise(rp * 30.0) * 0.65 + vnoise(rp * 80.0 + 7.0) * 0.35;
  col = mix(col, uC4, smoothstep(0.64, 0.67, n) * 0.65);
  // 包铁的靴头：前面一截颜色深一点，边上一排铆钉
  if (rp.z < -0.13) col = mix(col, uC1, 0.6);
  vec2 q = vec2(fract(rp.x / 0.026 + 0.5) - 0.5, (rp.z + 0.13) / 0.026);
  if (abs(rp.z + 0.13) < 0.005 && length(q * 0.026) < 0.0045 && rp.y > -0.09) col = uC7;
`;

function partMesh(g: THREE.BufferGeometry, paint: string, extra: Partial<THREE.MeshToonMaterialParameters> = {}, outline = 2.0) {
  if (!g.getAttribute("aRest")) g.setAttribute("aRest", (g.getAttribute("position") as THREE.BufferAttribute).clone());
  const colors = [C.iron, C.ironDark, C.rope, C.ropeDark, C.rust, C.sole, C.inside, C.rivet, "#000000", "#000000"];
  const mat = paintedToon(paint, colors, extra);
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  const line = new THREE.Mesh(g, outlineMaterial(outline, 0x241c28, false));
  line.frustumCulled = false;
  mesh.add(line);
  return mesh;
}

export interface Boot {
  /** 挂到小腿上（位置 = 脚踝在小腿骨里的位置） */
  shaft: THREE.Group;
  /** 挂到脚上（原点 = 脚踝） */
  foot: THREE.Group;
  /** 靴口露出的三块砖（第 0 块在正前面，递给人的就是它） */
  bricks: THREE.Object3D[];
}

/** 一只铁靴。side：-1 左脚（人物左边是 −x），1 右脚。 */
export function buildBoot(side: -1 | 1): Boot {
  const out = side * 0.006; // 靴子比脚踝稍微往外
  const seg = 40;
  const rings: Ring[] = PROFILE.map(([y, rx, rz]) => ({
    y,
    cx: out,
    cz: AXIS_Z,
    r: Array.from({ length: seg + 1 }, (_, s) => {
      const a = (s / seg) * Math.PI * 2;
      return 1 / Math.hypot(Math.cos(a) / rx, Math.sin(a) / rz);
    }),
  }));
  const { g: shaftGeo } = ringGeometry(rings);
  const shaftMesh = partMesh(shaftGeo, SHAFT_PAINT, { side: THREE.DoubleSide });
  // uC9 当作靴筒中心用（花纹里算角度）
  ((shaftMesh.material as THREE.Material).userData.colors.uC9.value as THREE.Color).setRGB(out, 0, AXIS_Z);
  const shaft = new THREE.Group();
  shaft.add(shaftMesh);
  // 靴口里露出的砖：三块，前面、前外侧、外侧，上面往外斜一点
  const outer = side < 0 ? Math.PI : 0;
  const front = Math.PI * 1.5;
  const bricks: THREE.Object3D[] = [];
  [front, (front + outer + (side < 0 ? 0 : Math.PI * 2)) / 2, outer + side * -0.25].forEach((a, k) => {
    const rx = 0.07 - 0.016, rz = 0.083 - 0.016;
    const r = 1 / Math.hypot(Math.cos(a) / rx, Math.sin(a) / rz);
    const b = brickMesh(BRICK[0], BRICK[2], BRICK[1]);
    b.position.set(out + Math.cos(a) * r, 0.375 + [0.012, 0, -0.008][k], AXIS_Z + Math.sin(a) * r);
    b.rotation.order = "YXZ";
    b.rotation.set(0.12, Math.atan2(Math.cos(a), Math.sin(a)), [0.03, -0.05, 0.06][k]);
    shaft.add(b);
    bricks.push(b);
  });
  // 靴头和靴底
  const foot = new THREE.Group();
  const toe = new RoundedBoxGeometry(0.13, 0.105, 0.3, 4, 0.045);
  toe.translate(out * 0.6, -0.04, -0.06);
  foot.add(partMesh(toe, FOOT_PAINT));
  const sole = new RoundedBoxGeometry(0.142, 0.035, 0.31, 2, 0.012);
  sole.translate(out * 0.6, -0.105 - BOOT_SOLE + 0.0175, -0.062);
  foot.add(partMesh(sole, `col = uC5;`));
  return { shaft, foot, bricks };
}

/**
 * 把一双铁靴穿到人物身上：bones 是小腿和脚（humanoid 名字），scale 是人物骨头上的缩放（小石头的骨头缩过，靴子要保持秤砣的大小）。
 * 返回两只靴子（可以再拿下来、换到别人脚上）。
 */
export function wearBoots(bones: Map<string, THREE.Object3D>, scale = 1) {
  const pair = ([-1, 1] as const).map((side) => {
    const L = side < 0;
    const leg = bones.get(L ? "leftLowerLeg" : "rightLowerLeg")!;
    const foot = bones.get(L ? "leftFoot" : "rightFoot")!;
    const boot = buildBoot(side);
    boot.shaft.position.copy(foot.position);
    boot.shaft.scale.setScalar(1 / scale);
    leg.add(boot.shaft);
    boot.foot.scale.setScalar(1 / scale);
    foot.add(boot.foot);
    return boot;
  });
  return pair;
}
