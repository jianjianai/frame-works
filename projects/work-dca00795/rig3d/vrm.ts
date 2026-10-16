// 三渲二人物：读 VRoid 的 VRM 模型（VRM 0.x 就是 glTF），换成卡通材质（两阶明暗 + 等宽描边），
// 提供人体骨骼（humanoid 名字）、表情（VRM 的 blendShape 组）和按材质名隐藏、换色。
// 模型来源：VRoid Studio 的 CC0 / 「全部允许」样例模型（public/models/），身体骨架不动，衣服、发型、饰品按剧情换。
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { assetUrl } from "@frame/engine/types";

export type BoneName =
  | "hips" | "spine" | "chest" | "upperChest" | "neck" | "head"
  | "leftShoulder" | "leftUpperArm" | "leftLowerArm" | "leftHand"
  | "rightShoulder" | "rightUpperArm" | "rightLowerArm" | "rightHand"
  | "leftUpperLeg" | "leftLowerLeg" | "leftFoot" | "leftToes"
  | "rightUpperLeg" | "rightLowerLeg" | "rightFoot" | "rightToes"
  | "leftEye" | "rightEye" | string;

export interface Expression {
  binds: { mesh: THREE.Mesh; index: number; weight: number }[];
}

export interface VRMModel {
  /** 整个人（已经转成面朝 +Z），放进场景就行 */
  root: THREE.Group;
  bones: Map<BoneName, THREE.Object3D>;
  /** 静止姿势（T 字）每根骨头的局部旋转 */
  rest: Map<THREE.Object3D, THREE.Quaternion>;
  expressions: Map<string, Expression>;
  /** 按 VRM 材质名找网格（一个材质可能对应好几块） */
  byMaterial: Map<string, THREE.Mesh[]>;
  meshes: THREE.Mesh[];
  json: any;
}

/** 贴图缩小到不超过 max 像素（配角、远景人物省显存） */
function shrinkTextures(root: THREE.Object3D, max: number) {
  const done = new Set<THREE.Texture>();
  root.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    const tex = m?.map;
    if (!tex || done.has(tex)) return;
    done.add(tex);
    const img = tex.image as HTMLImageElement | ImageBitmap | undefined;
    if (!img || !("width" in img) || img.width <= max) return;
    const k = max / img.width;
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext("2d")!.drawImage(img as CanvasImageSource, 0, 0, c.width, c.height);
    tex.image = c;
    tex.needsUpdate = true;
  });
}

export async function loadVRM(src: string, opts: { maxTexture?: number } = {}): Promise<VRMModel> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(assetUrl(src));
  if (opts.maxTexture) shrinkTextures(gltf.scene, opts.maxTexture);
  const json = gltf.parser.json;
  const vrm = json.extensions?.VRM;
  const holder = new THREE.Group();
  holder.add(gltf.scene);
  // VRM 0.x 面朝 −Z，转过来面朝 +Z（镜头默认在 +Z）
  gltf.scene.rotation.y = Math.PI;
  const nodes: THREE.Object3D[] = await Promise.all((json.nodes as unknown[]).map((_: unknown, i: number) => gltf.parser.getDependency("node", i)));
  const bones = new Map<BoneName, THREE.Object3D>();
  for (const b of vrm?.humanoid?.humanBones ?? []) bones.set(b.bone, nodes[b.node]);
  const rest = new Map<THREE.Object3D, THREE.Quaternion>();
  gltf.scene.traverse((o) => rest.set(o, o.quaternion.clone()));
  // 表情
  const expressions = new Map<string, Expression>();
  const meshNodes = new Map<number, THREE.Mesh[]>();
  (json.nodes as any[]).forEach((n, i) => {
    if (n.mesh === undefined) return;
    const o = nodes[i];
    const list: THREE.Mesh[] = [];
    o.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) list.push(c as THREE.Mesh);
    });
    if ((o as THREE.Mesh).isMesh) list.push(o as THREE.Mesh);
    meshNodes.set(n.mesh, [...(meshNodes.get(n.mesh) ?? []), ...list]);
  });
  for (const g of vrm?.blendShapeMaster?.blendShapeGroups ?? []) {
    const key = (g.presetName && g.presetName !== "unknown" ? g.presetName : g.name).toLowerCase();
    const binds: Expression["binds"] = [];
    for (const b of g.binds ?? []) {
      for (const m of meshNodes.get(b.mesh) ?? []) {
        if (m.morphTargetInfluences && b.index < m.morphTargetInfluences.length) binds.push({ mesh: m, index: b.index, weight: b.weight / 100 });
      }
    }
    expressions.set(key, { binds });
  }
  const byMaterial = new Map<string, THREE.Mesh[]>();
  const meshes: THREE.Mesh[] = [];
  gltf.scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    meshes.push(m);
    const mat = m.material as THREE.Material;
    const name = mat.name;
    byMaterial.set(name, [...(byMaterial.get(name) ?? []), m]);
    m.frustumCulled = false;
  });
  return { root: holder, bones, rest, expressions, byMaterial, meshes, json };
}

// ---------------------------------------------------------------- 卡通材质

const ramps = new Map<number, THREE.DataTexture>();
/** 两阶明暗：暗面 dark（主光那一份乘多少），亮面 1。dark = 1 就是不分明暗（脸）。 */
export function toonRamp(dark = 0.5) {
  let ramp = ramps.get(dark);
  if (ramp) return ramp;
  const n = 8;
  const data = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const v = i < 3 ? Math.round(dark * 255) : 255;
    data.set([v, v, v, 255], i * 4);
  }
  ramp = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  ramps.set(dark, ramp);
  return ramp;
}

export interface ToonOptions {
  /** 描边像素宽（按 1080 宽的画面算）；0 不描边 */
  outline?: number;
  outlineColor?: THREE.ColorRepresentation;
  /** 这些材质不描边（眼睛、睫毛、高光……） */
  noOutline?: (materialName: string) => boolean;
  /** 这些材质不分明暗（脸：动画里脸基本是平涂的） */
  flat?: (materialName: string) => boolean;
}

/** 换成卡通材质：保留原来的贴图和透明设置，明暗两阶；身体、衣服、头发加等宽描边。 */
export function toonify(model: VRMModel, opts: ToonOptions = {}) {
  const width = opts.outline ?? 2.2;
  const noOutline = opts.noOutline ?? ((n: string) => /Eye|Brow|Mouth|Eyelash|Eyeline|Highlight|EyeExtra/i.test(n));
  const flat = opts.flat ?? ((n: string) => /_FACE$|_EYE$|Face_00_SKIN/.test(n));
  for (const mesh of model.meshes) {
    const old = mesh.material as THREE.MeshStandardMaterial;
    const mat = new THREE.MeshToonMaterial({
      name: old.name,
      map: old.map ?? null,
      color: old.color?.clone() ?? new THREE.Color(1, 1, 1),
      gradientMap: toonRamp(flat(old.name) ? 1 : 0.5),
      transparent: old.transparent,
      alphaTest: old.alphaTest,
      side: old.side,
      depthWrite: old.depthWrite,
    });
    if (old.map) old.map.colorSpace = THREE.SRGBColorSpace;
    mesh.material = mat;
    old.dispose();
    if (width > 0 && !noOutline(old.name) && (mesh as THREE.SkinnedMesh).isSkinnedMesh) {
      const sk = mesh as THREE.SkinnedMesh;
      const line = new THREE.SkinnedMesh(sk.geometry, outlineMaterial(width, opts.outlineColor ?? 0x241c28, true));
      line.name = sk.name + "_outline";
      line.bind(sk.skeleton, sk.bindMatrix);
      line.morphTargetInfluences = sk.morphTargetInfluences;
      line.morphTargetDictionary = sk.morphTargetDictionary;
      line.frustumCulled = false;
      line.renderOrder = -1;
      line.userData.outlineOf = sk;
      sk.parent!.add(line);
      sk.userData.outline = line;
    }
  }
}

/** 等宽描边：背面朝外，顶点沿法线在屏幕上推出 width × 像素倍数（setOutlineResolution 设置）。 */
export function outlineMaterial(width: number, color: THREE.ColorRepresentation, skinned = true) {
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  mat.name = "outline";
  mat.userData.width = { value: width };
  mat.userData.res = { value: new THREE.Vector2(1080, 1920) };
  mat.userData.px = { value: 1 };
  mat.customProgramCacheKey = () => "outline-" + (skinned ? "s" : "n");
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uOutline = mat.userData.width;
    shader.uniforms.uRes = mat.userData.res;
    shader.uniforms.uPx = mat.userData.px;
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", "uniform float uOutline;\nuniform vec2 uRes;\nuniform float uPx;\nvoid main() {")
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vec3 outN = normalMatrix * ${skinned ? "objectNormal" : "vec3( normal )"}; // 背面材质的 transformedNormal 被翻过，自己算
        vec4 clipN = projectionMatrix * vec4( normalize( outN ), 0.0 );
        vec2 dirPx = normalize( clipN.xy * uRes + vec2( 1e-6 ) );
        gl_Position.xy += dirPx * uOutline * uPx * 2.0 / uRes * gl_Position.w;`,
      );
  };
  return mat;
}

/**
 * 告诉描边材质现在画到多大的画面上（描边按画面像素算）：w × h 是这次渲染的视口，
 * px 是线宽倍数（默认按短边 1080 为 1；设定图里一格很小，可以单独给）。
 */
export function setOutlineResolution(root: THREE.Object3D, width: number, height: number, px = Math.min(width, height) / 1080) {
  root.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (m && m.name === "outline") {
      m.userData.res.value.set(width, height);
      m.userData.px.value = px;
    }
  });
}

// ---------------------------------------------------------------- 外观

/** 隐藏这些材质的网格（换衣服：把原来的上衣、裙子、鞋拿掉）。 */
export function hide(model: VRMModel, test: (materialName: string) => boolean) {
  for (const [name, list] of model.byMaterial) {
    if (!test(name)) continue;
    for (const m of list) {
      m.visible = false;
      if (m.userData.outline) m.userData.outline.visible = false;
    }
  }
}

/**
 * 按亮度重新上色：贴图的亮度从 lo 到 hi 映射成 dark → light 两个颜色（把蓝灰头发染成黑发、把青色眼睛染成褐色）。
 * 保留贴图里的明暗和发丝纹理，只换颜色。fix：只改亮度低于 below、或者和 near 差得比 tol 远的地方
 * （把黑指甲、身体贴图上画的袜子和鞋带改回肤色），其余不动。
 */
export function colorize(
  model: VRMModel,
  test: (materialName: string) => boolean,
  dark: THREE.ColorRepresentation,
  light: THREE.ColorRepresentation,
  lo = 0.05,
  hi = 0.6,
  fix?: { below?: number; near?: THREE.ColorRepresentation; tol?: number; color: THREE.ColorRepresentation },
) {
  for (const [name, list] of model.byMaterial) {
    if (!test(name)) continue;
    for (const m of list) {
      const mat = m.material as THREE.MeshToonMaterial;
      const u = {
        uDark: { value: new THREE.Color(dark) },
        uLight: { value: new THREE.Color(light) },
        uLo: { value: lo },
        uHi: { value: hi },
        uBelow: { value: fix?.below ?? -1 },
        uFix: { value: new THREE.Color(fix?.color ?? 0) },
        uNear: { value: new THREE.Color(fix?.near ?? 0) },
        uTol: { value: fix?.near !== undefined ? (fix?.tol ?? 0.2) : -1 },
      };
      mat.customProgramCacheKey = () => (fix ? "colorize-fix" : "colorize");
      mat.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, u);
        shader.fragmentShader = shader.fragmentShader
          .replace("void main() {", "uniform vec3 uDark;\nuniform vec3 uLight;\nuniform float uLo;\nuniform float uHi;\nuniform float uBelow;\nuniform vec3 uFix;\nuniform vec3 uNear;\nuniform float uTol;\nvoid main() {")
          .replace(
            "#include <map_fragment>",
            fix
              ? "#include <map_fragment>\n  { float lum = dot( diffuseColor.rgb, vec3( 0.299, 0.587, 0.114 ) );\n    float keep = smoothstep( uBelow - 0.05, uBelow, lum );\n    if ( uTol > 0.0 ) keep *= 1.0 - smoothstep( uTol, uTol + 0.04, distance( diffuseColor.rgb, uNear ) );\n    diffuseColor.rgb = mix( uFix, diffuseColor.rgb, keep ); }"
              : "#include <map_fragment>\n  { float lum = dot( diffuseColor.rgb, vec3( 0.299, 0.587, 0.114 ) );\n    diffuseColor.rgb = mix( uDark, uLight, clamp( ( lum - uLo ) / ( uHi - uLo ), 0.0, 1.0 ) ); }",
          );
      };
      mat.needsUpdate = true;
    }
  }
}

/** 给材质换色：贴图乘上一个颜色（把蓝头发染成黑的、把衣服染成别的颜色）。 */
export function tint(model: VRMModel, test: (materialName: string) => boolean, color: THREE.ColorRepresentation) {
  for (const [name, list] of model.byMaterial) {
    if (!test(name)) continue;
    for (const m of list) (m.material as THREE.MeshToonMaterial).color.set(color);
  }
}

// ---------------------------------------------------------------- 姿势和表情

/** 欧拉角（弧度，XYZ，相对静止姿势的局部旋转）。 */
export type PoseMap = Partial<Record<BoneName, [number, number, number]>>;

const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();

/** 摆姿势：每根骨头 = 静止旋转 × 给定的局部旋转。没给的骨头回到静止姿势。 */
export function pose(model: VRMModel, p: PoseMap) {
  for (const [name, bone] of model.bones) {
    const r = model.rest.get(bone);
    if (!r) continue;
    const e = p[name];
    if (e) {
      tmpE.set(e[0], e[1], e[2], "XYZ");
      tmpQ.setFromEuler(tmpE);
      bone.quaternion.copy(r).multiply(tmpQ);
    } else bone.quaternion.copy(r);
  }
}

/**
 * 一直带着的脸部变形（按网格里的变形名，例如 Fcl_EYE_Surprised 0.3：眼睛睁大一点，看起来更小）。
 * 记在模型上，express 每次在它的基础上叠表情。
 */
export function setBaseMorphs(model: VRMModel, w: Record<string, number>) {
  (model as VRMModel & { base?: Record<string, number> }).base = w;
}

/** 表情：名字 → 0..1（joy、angry、sorrow、fun、surprised、blink、blink_l、blink_r、a、i、u、e、o）。 */
export function express(model: VRMModel, w: Record<string, number>) {
  for (const m of model.meshes) if (m.morphTargetInfluences) m.morphTargetInfluences.fill(0);
  const base = (model as VRMModel & { base?: Record<string, number> }).base;
  if (base) {
    // 表情里眼睛有动作（闭眼、笑眼……）时，常驻的眼睛变形跟着退掉
    const eyeBusy = Math.min(1, Math.max(0, ...["blink", "blink_l", "blink_r", "joy", "fun", "sorrow", "angry", "surprised"].map((k) => w[k] ?? 0)));
    for (const m of model.meshes) {
      if (!m.morphTargetDictionary || !m.morphTargetInfluences) continue;
      for (const [name, value] of Object.entries(base)) {
        const key = Object.keys(m.morphTargetDictionary).find((k) => k.endsWith(name));
        if (key !== undefined) m.morphTargetInfluences[m.morphTargetDictionary[key]] = /_EYE_/.test(name) ? value * (1 - eyeBusy) : value;
      }
    }
  }
  for (const [key, value] of Object.entries(w)) {
    const ex = model.expressions.get(key);
    if (!ex || !value) continue;
    for (const b of ex.binds) b.mesh.morphTargetInfluences![b.index] = Math.min(1, b.mesh.morphTargetInfluences![b.index] + b.weight * value);
  }
}

/** 模型自己坐标（静止姿势，和网格顶点同一个坐标系）里的点 → 某根骨头的局部坐标。在摆姿势之前调用。 */
export function toBone(model: VRMModel, bone: THREE.Object3D, p: THREE.Vector3) {
  const scene = model.root.children[0];
  scene.updateWorldMatrix(true, true);
  return bone.worldToLocal(p.clone().applyMatrix4(scene.matrixWorld));
}

/** 骨头在世界坐标里的位置。 */
export function bonePos(model: VRMModel, name: BoneName) {
  const b = model.bones.get(name);
  const v = new THREE.Vector3();
  if (b) {
    b.updateWorldMatrix(true, false);
    v.setFromMatrixPosition(b.matrixWorld);
  }
  return v;
}

// ---------------------------------------------------------------- 化成灰

/**
 * 从上往下化掉：世界坐标高于 cut 的部分不画，切口一圈彩色的光（碰到白的人从头到脚化成五颜六色的火星）。
 * 返回 uniforms：cut（世界 y）、edge（发光带宽，米）、time。给模型里每一个材质（连描边）都加上。
 */
export function addDissolve(model: VRMModel) {
  const u = { uCut: { value: 1e6 }, uEdge: { value: 0.07 }, uDisTime: { value: 0 } };
  const patch = (mat: THREE.Material, isOutline: boolean) => {
    if (mat.userData.dissolve) return;
    mat.userData.dissolve = true;
    const prev = mat.onBeforeCompile;
    const prevKey = mat.customProgramCacheKey?.bind(mat);
    mat.onBeforeCompile = (shader, r) => {
      prev?.call(mat, shader, r);
      Object.assign(shader.uniforms, u);
      shader.vertexShader = shader.vertexShader
        .replace("void main() {", "varying float vDisY;\nvoid main() {")
        .replace("#include <project_vertex>", "#include <project_vertex>\n  vDisY = (modelMatrix * vec4(transformed, 1.0)).y;");
      shader.fragmentShader = shader.fragmentShader
        .replace("void main() {", "uniform float uCut;\nuniform float uEdge;\nuniform float uDisTime;\nvarying float vDisY;\nvec3 disHue(float x) { return clamp(abs(fract(x + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }\nvoid main() {\n  if (vDisY > uCut) discard;")
        .replace(
          /}\s*$/,
          isOutline
            ? "  if (vDisY > uCut - uEdge) gl_FragColor.rgb = disHue(vDisY * 4.0 + uDisTime) * 0.9;\n}"
            : "  float dz = smoothstep(uCut - uEdge, uCut, vDisY);\n  gl_FragColor.rgb = mix(gl_FragColor.rgb, disHue(vDisY * 4.0 + uDisTime) * 1.1, dz);\n}",
        );
    };
    mat.customProgramCacheKey = () => (prevKey ? prevKey() : "") + ":dissolve" + (isOutline ? "o" : "");
    mat.needsUpdate = true;
  };
  model.root.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!m) return;
    for (const mm of Array.isArray(m) ? m : [m]) patch(mm, mm.name === "outline");
  });
  return u;
}
