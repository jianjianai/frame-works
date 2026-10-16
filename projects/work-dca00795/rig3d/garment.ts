// 换衣服：从模型的身体网格里挑出一片（按顶点所在的骨头和静止姿势里的位置），沿法线往外推一点，
// 变成一件贴身的新衣服（和身体用同一副骨骼，跟着动）；花纹、镶边、条纹在片元着色器里按静止姿势的坐标画，边缘干净。
// 坐标都是模型自己的（VRM：y 朝上，人物左手在 −x，脸朝 −z），单位米。
import * as THREE from "three";
import { outlineMaterial, toonRamp } from "./vrm";
import type { VRMModel } from "./vrm";

/**
 * 硬的零件（铁靴、砖、扣子）：几何体按模型自己的坐标做好（静止姿势），挂到骨头上跟着走，不蒙皮；
 * 花纹按模型坐标 rp 画。在摆姿势之前调用。
 */
export function rigidPart(
  model: VRMModel,
  bone: THREE.Object3D,
  g: THREE.BufferGeometry,
  spec: { paint: string; colors: THREE.ColorRepresentation[]; outline?: number; side?: THREE.Side },
) {
  if (!g.getAttribute("aRest")) g.setAttribute("aRest", (g.getAttribute("position") as THREE.BufferAttribute).clone());
  const scene = model.root.children[0];
  scene.updateWorldMatrix(true, true);
  g.applyMatrix4(new THREE.Matrix4().copy(bone.matrixWorld).invert().multiply(scene.matrixWorld));
  const mesh = new THREE.Mesh(g, paintedToon(spec.paint, spec.colors, spec.side !== undefined ? { side: spec.side } : {}));
  mesh.frustumCulled = false;
  const w = spec.outline ?? 2.0;
  if (w > 0) {
    const line = new THREE.Mesh(g, outlineMaterial(w, 0x241c28, false));
    line.frustumCulled = false;
    mesh.add(line);
  }
  bone.add(mesh);
  return mesh;
}

export interface BodySource {
  mesh: THREE.SkinnedMesh; // 任一块身体网格（共享同一份顶点数据）
  index: number[]; // 身体皮肤所有三角形的顶点下标
  pos: THREE.BufferAttribute;
  nrm: THREE.BufferAttribute;
  skinIndex: THREE.BufferAttribute;
  skinWeight: THREE.BufferAttribute;
  bone: string[]; // 每个顶点权重最大的骨头名
}

/** 身体：模型里所有 Body_00_SKIN 网格合起来。 */
export function bodySource(model: VRMModel): BodySource {
  const list = [...model.byMaterial.entries()].filter(([n]) => /Body_00_SKIN/.test(n)).flatMap(([, l]) => l) as THREE.SkinnedMesh[];
  const mesh = list[0];
  const g = mesh.geometry;
  const index: number[] = [];
  for (const m of list) {
    const idx = m.geometry.index!;
    for (let i = 0; i < idx.count; i++) index.push(idx.getX(i));
  }
  const skinIndex = g.getAttribute("skinIndex") as THREE.BufferAttribute;
  const skinWeight = g.getAttribute("skinWeight") as THREE.BufferAttribute;
  const n = g.getAttribute("position").count;
  const bone: string[] = new Array(n);
  for (let i = 0; i < n; i++) {
    let best = 0, bi = 0;
    for (let k = 0; k < 4; k++) {
      const w = skinWeight.getComponent(i, k);
      if (w > best) {
        best = w;
        bi = skinIndex.getComponent(i, k);
      }
    }
    bone[i] = mesh.skeleton.bones[bi]?.name ?? "";
  }
  return { mesh, index, pos: g.getAttribute("position") as THREE.BufferAttribute, nrm: g.getAttribute("normal") as THREE.BufferAttribute, skinIndex, skinWeight, bone };
}

export interface GarmentSpec {
  name: string;
  /** 这个顶点属不属于这件衣服（p：静止姿势位置，bone：权重最大的骨头名） */
  select: (p: THREE.Vector3, bone: string) => boolean;
  /** 往外推多少米 */
  offset: (p: THREE.Vector3, bone: string) => number;
  /** GLSL：用 vec3 rp（静止姿势坐标）算出 vec3 col；可以用 uniforms 里的颜色（uC0…） */
  paint: string;
  colors: THREE.ColorRepresentation[];
  outline?: number;
  /** 花纹里用到的贴图（片段里叫 uT0、uT1…） */
  textures?: THREE.Texture[];
}

/** 一件贴身的衣服：身体网格的一片往外推。 */
export function shellGarment(src: BodySource, spec: GarmentSpec): THREE.SkinnedMesh {
  const keep = new Map<number, number>();
  const tri: number[] = [];
  const p = new THREE.Vector3();
  const inSet = (i: number) => {
    p.fromBufferAttribute(src.pos, i);
    return spec.select(p, src.bone[i]);
  };
  const cache = new Map<number, boolean>();
  const ok = (i: number) => {
    let v = cache.get(i);
    if (v === undefined) cache.set(i, (v = inSet(i)));
    return v;
  };
  for (let t = 0; t < src.index.length; t += 3) {
    const a = src.index[t], b = src.index[t + 1], c = src.index[t + 2];
    if (ok(a) && ok(b) && ok(c)) tri.push(a, b, c);
  }
  const verts = [...new Set(tri)];
  verts.forEach((v, i) => keep.set(v, i));
  const n = verts.length;
  const position = new Float32Array(n * 3), normal = new Float32Array(n * 3), rest = new Float32Array(n * 3);
  const skinIndex = new Uint16Array(n * 4), skinWeight = new Float32Array(n * 4);
  const nv = new THREE.Vector3();
  verts.forEach((v, i) => {
    p.fromBufferAttribute(src.pos, v);
    nv.fromBufferAttribute(src.nrm, v).normalize();
    const d = spec.offset(p, src.bone[v]);
    rest.set([p.x, p.y, p.z], i * 3);
    position.set([p.x + nv.x * d, p.y + nv.y * d, p.z + nv.z * d], i * 3);
    normal.set([nv.x, nv.y, nv.z], i * 3);
    for (let k = 0; k < 4; k++) {
      skinIndex[i * 4 + k] = src.skinIndex.getComponent(v, k);
      skinWeight[i * 4 + k] = src.skinWeight.getComponent(v, k);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(position, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
  g.setAttribute("aRest", new THREE.BufferAttribute(rest, 3));
  g.setAttribute("skinIndex", new THREE.BufferAttribute(skinIndex, 4));
  g.setAttribute("skinWeight", new THREE.BufferAttribute(skinWeight, 4));
  g.setIndex(tri.map((v) => keep.get(v)!));
  return dressMesh(g, src.mesh, spec);
}

/** 用给定的几何体做一件衣服网格（蒙皮到身体的骨骼上），配卡通材质和描边。 */
export function dressMesh(g: THREE.BufferGeometry, body: THREE.SkinnedMesh, spec: Pick<GarmentSpec, "name" | "paint" | "colors" | "outline" | "textures">): THREE.SkinnedMesh {
  const mat = paintedToon(spec.paint, spec.colors, {}, spec.textures);
  const mesh = new THREE.SkinnedMesh(g, mat);
  mesh.name = spec.name;
  mesh.bind(body.skeleton, body.bindMatrix);
  mesh.frustumCulled = false;
  body.parent!.add(mesh);
  const w = spec.outline ?? 2.2;
  if (w > 0) {
    const line = new THREE.SkinnedMesh(g, outlineMaterial(w, 0x241c28));
    line.bind(body.skeleton, body.bindMatrix);
    line.frustumCulled = false;
    body.parent!.add(line);
    mesh.userData.outline = line;
  }
  return mesh;
}

/** 卡通材质，底色由 GLSL 片段按静止姿势的坐标 rp 和法线 rn 算；textures 在片段里叫 uT0、uT1…（写字、图案）。 */
export function paintedToon(paint: string, colors: THREE.ColorRepresentation[], extra: Partial<THREE.MeshToonMaterialParameters> = {}, textures: THREE.Texture[] = []) {
  const mat = new THREE.MeshToonMaterial({ gradientMap: toonRamp(), ...extra });
  const uniforms: Record<string, { value: THREE.Color | THREE.Texture }> = {};
  colors.forEach((c, i) => (uniforms["uC" + i] = { value: new THREE.Color(c) }));
  textures.forEach((t, i) => (uniforms["uT" + i] = { value: t }));
  mat.userData.colors = uniforms;
  mat.customProgramCacheKey = () => "paint:" + paint + colors.length + ":" + textures.length;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", "attribute vec3 aRest;\nvarying vec3 vRest;\nvarying vec3 vRestN;\nvoid main() {\n  vRest = aRest;\n  vRestN = normal;")
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        `varying vec3 vRest;\nvarying vec3 vRestN;\n${colors.map((_, i) => `uniform vec3 uC${i};`).join("\n")}\n${textures.map((_, i) => `uniform sampler2D uT${i};`).join("\n")}\n` +
          `float band(float x, float a, float b, float s) { return smoothstep(a - s, a + s, x) * (1.0 - smoothstep(b - s, b + s, x)); }\n` +
          `float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }\n` +
          `float rectAA(vec2 p, vec2 hs) { vec2 d = abs(p) - hs; float dist = max(d.x, d.y); float w = fwidth(dist) + 1e-4; return 1.0 - smoothstep(-w, w, dist); }\n` +
          `float vnoise(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);\n` +
          `  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),\n` +
          `             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }\n` +
          `vec3 paintColor(vec3 rp, vec3 rn) {\n  vec3 col = uC0;\n${paint}\n  return col;\n}\nvoid main() {`,
      )
      .replace("vec4 diffuseColor = vec4( diffuse, opacity );", "vec4 diffuseColor = vec4( paintColor( vRest, normalize( vRestN ) ), opacity );");
  };
  return mat;
}

/** 身体在某个高度的横截面（静止姿势）：x、z 方向的半宽和中心。用来做裙摆、腰带这类绕身体一圈的东西。 */
export function crossSection(src: BodySource, y: number, band = 0.012, test: (bone: string) => boolean = () => true) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  const p = new THREE.Vector3();
  for (let i = 0; i < src.pos.count; i++) {
    p.fromBufferAttribute(src.pos, i);
    if (Math.abs(p.y - y) > band || !test(src.bone[i])) continue;
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  }
  return { cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2, rx: (maxX - minX) / 2, rz: (maxZ - minZ) / 2 };
}

/**
 * 一圈轮廓。默认绕竖直的 y 轴（身体、腿）：y 是高度，(cx, cz) 是中心，第 s 个方向的角度 s / seg · 2π 从 +x 转向 +z。
 * axis = "x" 时绕横着的 x 轴（静止姿势里平伸的胳膊）：y 字段存 x 坐标，(cx, cz) 存中心的 (y, z)，角度从 +y 转向 +z。
 */
export interface Ring {
  y: number;
  cx: number;
  cz: number;
  r: number[]; // seg + 1 个方向上的半径
  dy?: number[]; // 每个方向沿轴错开多少（圆弧下摆）
  axis?: Axis;
}
export type Axis = "y" | "x";

const along = (p: THREE.Vector3, axis: Axis) => (axis === "x" ? p.x : p.y);
const across = (p: THREE.Vector3, axis: Axis): [number, number] => (axis === "x" ? [p.y, p.z] : [p.x, p.z]);

/** 身体表面在 axis = h 处的横截面：和这个平面相交的三角形边上的交点（任一顶点属于 test 的骨头）。 */
export function slicePoints(src: BodySource, h: number, test: (bone: string) => boolean, axis: Axis = "y") {
  const pts: [number, number][] = [];
  const P = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  for (let t = 0; t < src.index.length; t += 3) {
    const i0 = src.index[t], i1 = src.index[t + 1], i2 = src.index[t + 2];
    if (!test(src.bone[i0]) && !test(src.bone[i1]) && !test(src.bone[i2])) continue;
    P[0].fromBufferAttribute(src.pos, i0);
    P[1].fromBufferAttribute(src.pos, i1);
    P[2].fromBufferAttribute(src.pos, i2);
    for (let e = 0; e < 3; e++) {
      const p = P[e], q = P[(e + 1) % 3];
      const hp = along(p, axis), hq = along(q, axis);
      if ((hp - h) * (hq - h) > 0 || hp === hq) continue;
      const k = (h - hp) / (hq - hp);
      const [pu, pv] = across(p, axis), [qu, qv] = across(q, axis);
      pts.push([pu + (qu - pu) * k, pv + (qv - pv) * k]);
    }
  }
  return pts;
}

/**
 * 身体在 h 处的一圈外轮廓（静止姿势）：横截面的凸包，从中心往 seg 个方向量到凸包的距离。
 * 腿分开的高度也能用（得到把两条腿都包住的一圈，前后不会凹进去）。
 */
export function hullRing(src: BodySource, y: number, test: (bone: string) => boolean, seg = 48, center?: { cx: number; cz: number }, axis: Axis = "y"): Ring {
  const hull = convexHull(slicePoints(src, y, test, axis));
  let cx = center?.cx ?? 0, cz = center?.cz ?? 0;
  if (!center) {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [x, z] of hull) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      z0 = Math.min(z0, z);
      z1 = Math.max(z1, z);
    }
    cx = (x0 + x1) / 2;
    cz = (z0 + z1) / 2;
  }
  const r: number[] = [];
  for (let s = 0; s <= seg; s++) {
    const a = (s / seg) * Math.PI * 2;
    const dx = Math.cos(a), dz = Math.sin(a);
    let best = 0;
    for (let k = 0; k < hull.length; k++) {
      const [x1, z1] = hull[k], [x2, z2] = hull[(k + 1) % hull.length];
      const ex = x2 - x1, ez = z2 - z1;
      const den = dx * ez - dz * ex;
      if (Math.abs(den) < 1e-12) continue;
      const qx = x1 - cx, qz = z1 - cz;
      const t = (qx * ez - qz * ex) / den;
      const u = (qx * dz - qz * dx) / den;
      if (u >= -1e-6 && u <= 1 + 1e-6 && t > best) best = t;
    }
    r.push(best);
  }
  return { y, cx, cz, r, axis };
}

/** 从 y0 到 y1 这一段身体的外轮廓（每隔 1 厘米切一刀，逐个方向取最大）：衣服的两圈之间是直的，要盖住中间鼓出来的地方。 */
export function spanRing(src: BodySource, y: number, y0: number, y1: number, test: (bone: string) => boolean, seg = 48, center?: { cx: number; cz: number }, axis: Axis = "y"): Ring {
  const lo = Math.min(y0, y1), hi = Math.max(y0, y1);
  const n = Math.max(1, Math.ceil((hi - lo) / 0.01));
  const first = hullRing(src, lo, test, seg, center, axis);
  const c = center ?? { cx: first.cx, cz: first.cz };
  const rings = [first];
  for (let i = 1; i <= n; i++) rings.push(hullRing(src, lo + ((hi - lo) * i) / n, test, seg, c, axis));
  return maxRing(rings, y);
}

/** 几圈轮廓逐个方向取最大（腰带要盖住上下一段身体里最粗的地方）。 */
export function maxRing(rings: Ring[], y: number): Ring {
  return { y, cx: rings[0].cx, cz: rings[0].cz, axis: rings[0].axis, r: rings[0].r.map((_, s) => Math.max(...rings.map((q) => q.r[s]))) };
}

function convexHull(pts: [number, number][]) {
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [], upper: [number, number][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/** 把一圈轮廓放大：r × k + m（米）；kz 单独给前后方向的倍数。 */
export function grow(ring: Ring, y: number, k: number, m: number, kz = k): Ring {
  const seg = ring.r.length - 1;
  return {
    y,
    cx: ring.cx,
    cz: ring.cz,
    dy: ring.dy,
    axis: ring.axis,
    r: ring.r.map((v, i) => {
      const a = (i / seg) * Math.PI * 2;
      const kk = Math.sqrt((k * Math.cos(a)) ** 2 + (kz * Math.sin(a)) ** 2);
      return v * kk + m;
    }),
  };
}

/** 衣褶：半径按方向起伏（n 道褶，amp 相对半径的幅度）。 */
export function folds(ring: Ring, n: number, amp: number, phase = 0): Ring {
  const seg = ring.r.length - 1;
  return { ...ring, r: ring.r.map((v, s) => v * (1 + amp * Math.sin((s / seg) * Math.PI * 2 * n + phase))) };
}

/** 从上到下每一圈都不比上一圈小（衣摆只会往下垂、往外张，不会往里收）。 */
export function envelope(rings: Ring[]): Ring[] {
  const out: Ring[] = [];
  rings.forEach((ring, i) => {
    const prev = out[i - 1];
    out.push(prev ? { ...ring, r: ring.r.map((v, s) => Math.max(v, prev.r[s])) } : ring);
  });
  return out;
}

/** 一圈轮廓在角度 a（弧度）处的半径（按 r 数组插值）。 */
function radiusAt(ring: Ring, a: number) {
  const seg = ring.r.length - 1;
  const t = ((((a / (Math.PI * 2)) % 1) + 1) % 1) * seg;
  const i = Math.floor(t), f = t - i;
  return ring.r[i] * (1 - f) + ring.r[Math.min(seg, i + 1)] * f;
}

export interface RingOptions {
  /** 前面敞开（外套）：开口正中的角度（身体正前方是 1.5π）和每一圈开口的半角 */
  open?: { at: number; half: number[] };
}

/** 一圈一圈连成的筒（裙摆、腰带、靴筒、袖口）：三角形朝外。open 时是一片前面敞开的。 */
export function ringGeometry(rings: Ring[], opts: RingOptions = {}) {
  const nr = rings.length;
  const seg = rings[0].r.length - 1;
  const axis = rings[0].axis ?? "y";
  const position: number[] = [];
  const angle = (ri: number, s: number) => {
    if (!opts.open) return (s / seg) * Math.PI * 2;
    const h = opts.open.half[ri] ?? opts.open.half[opts.open.half.length - 1];
    return opts.open.at + h + (s / seg) * (Math.PI * 2 - 2 * h);
  };
  rings.forEach((ring, ri) => {
    for (let s = 0; s <= seg; s++) {
      const a = angle(ri, s);
      const r = opts.open ? radiusAt(ring, a) : ring.r[s];
      const u = ring.cx + Math.cos(a) * r, v = ring.cz + Math.sin(a) * r;
      const h = ring.y + (opts.open ? 0 : ring.dy?.[s] ?? 0);
      if (axis === "x") position.push(h, u, v);
      else position.push(u, h, v);
    }
  });
  const index: number[] = [];
  for (let r = 0; r < nr - 1; r++)
    for (let s = 0; s < seg; s++) {
      const a = r * (seg + 1) + s, b = a + 1, c = a + seg + 1, d = c + 1;
      index.push(a, b, c, b, d, c);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  g.setAttribute("aRest", new THREE.Float32BufferAttribute(position.slice(), 3));
  g.setIndex(index);
  g.computeVertexNormals();
  // 三角形要朝外：看中间那一圈（靴筒这类第一圈是往里翻的口沿，不能拿它看）的一个点的法线是不是背着中心，不是就整体翻过来
  {
    const n = g.getAttribute("normal") as THREE.BufferAttribute;
    const mid = Math.floor(nr / 2);
    const i = mid * (seg + 1) + Math.floor(seg / 2);
    const p = new THREE.Vector3(position[i * 3], position[i * 3 + 1], position[i * 3 + 2]);
    const c = axis === "x" ? new THREE.Vector3(p.x, rings[mid].cx, rings[mid].cz) : new THREE.Vector3(rings[mid].cx, p.y, rings[mid].cz);
    if (new THREE.Vector3(n.getX(i), n.getY(i), n.getZ(i)).dot(p.sub(c)) < 0) {
      for (let k = 0; k < index.length; k += 3) [index[k + 1], index[k + 2]] = [index[k + 2], index[k + 1]];
      g.setIndex(index);
      g.computeVertexNormals();
    }
  }
  if (!opts.open) {
    // 接缝两边的法线取平均，接缝处不出现明暗台阶
    const n = g.getAttribute("normal") as THREE.BufferAttribute;
    for (let r = 0; r < nr; r++) {
      const i0 = r * (seg + 1), i1 = i0 + seg;
      const x = n.getX(i0) + n.getX(i1), y = n.getY(i0) + n.getY(i1), z = n.getZ(i0) + n.getZ(i1);
      const l = Math.hypot(x, y, z) || 1;
      n.setXYZ(i0, x / l, y / l, z / l);
      n.setXYZ(i1, x / l, y / l, z / l);
    }
  }
  return { g, seg, nr };
}

/**
 * 绕身体一圈的裙摆（外套下摆、大外套）：rings 从上到下。
 * 蒙皮：最上面一圈全跟胯骨，往下越来越多地跟两条大腿（左边跟左腿，右边跟右腿），前后正中两条腿各一半。
 */
export function skirtGarment(body: THREE.SkinnedMesh, rings: Ring[], spec: Pick<GarmentSpec, "name" | "paint" | "colors" | "outline">, legFollow = 0.55): THREE.SkinnedMesh {
  const bones = body.skeleton.bones;
  const bi = (name: string) => bones.findIndex((b) => b.name === name);
  const hips = bi("J_Bip_C_Hips"), lLeg = bi("J_Bip_L_UpperLeg"), rLeg = bi("J_Bip_R_UpperLeg");
  const { g, seg, nr } = ringGeometry(rings);
  const sIdx: number[] = [], sW: number[] = [];
  for (let ri = 0; ri < nr; ri++) {
    const k = nr > 1 ? ri / (nr - 1) : 0;
    for (let s = 0; s <= seg; s++) {
      const a = (s / seg) * Math.PI * 2;
      const w = legFollow * k;
      // 往左（−x）的一侧跟左腿；正前、正后两条腿平分
      const side = Math.cos(a);
      const wl = w * THREE.MathUtils.clamp(0.5 - side * 1.5, 0, 1);
      const wr = w - wl;
      sIdx.push(hips, lLeg, rLeg, 0);
      sW.push(1 - w, wl, wr, 0);
    }
  }
  g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(sIdx, 4));
  g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sW, 4));
  const mesh = dressMesh(g, body, spec);
  (mesh.material as THREE.Material).side = THREE.DoubleSide;
  return mesh;
}

/**
 * 绕身体一圈的衣服（腰带、直筒的上衣、袖口、敞开的外套）：rings 按轴排好；每个点的蒙皮照抄离它最近的身体顶点，
 * 弯腰、抬胳膊时跟着身体走。skirtBelow：低于这个高度的几圈改成裙摆的蒙皮（跟胯和两条腿），走路时下摆不会被一条腿扯走。
 */
export function bandGarment(
  src: BodySource,
  rings: Ring[],
  spec: Pick<GarmentSpec, "name" | "paint" | "colors" | "outline" | "textures">,
  test: (bone: string) => boolean,
  opts: RingOptions & { skirtBelow?: number; legFollow?: number } = {},
): THREE.SkinnedMesh {
  const { g, seg, nr } = ringGeometry(rings, opts);
  const axis = rings[0].axis ?? "y";
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const hs = rings.map((r) => r.y);
  const h0 = Math.min(...hs) - 0.03, h1 = Math.max(...hs) + 0.03;
  const cand: number[] = [];
  const p = new THREE.Vector3(), q = new THREE.Vector3();
  for (let i = 0; i < src.pos.count; i++) {
    p.fromBufferAttribute(src.pos, i);
    const h = along(p, axis);
    if (h > h0 && h < h1 && test(src.bone[i])) cand.push(i);
  }
  const bones = src.mesh.skeleton.bones;
  const bi = (name: string) => bones.findIndex((b) => b.name === name);
  const hips = bi("J_Bip_C_Hips"), lLeg = bi("J_Bip_L_UpperLeg"), rLeg = bi("J_Bip_R_UpperLeg");
  const below = rings.map((r) => opts.skirtBelow !== undefined && r.y < opts.skirtBelow);
  const firstBelow = below.indexOf(true);
  const nBelow = below.filter(Boolean).length;
  const sIdx = new Uint16Array(pos.count * 4), sW = new Float32Array(pos.count * 4);
  for (let v = 0; v < pos.count; v++) {
    const ri = Math.floor(v / (seg + 1));
    q.fromBufferAttribute(pos, v);
    if (below[ri]) {
      const k = nBelow > 1 ? (ri - firstBelow + 1) / nBelow : 1;
      const w = (opts.legFollow ?? 0.5) * k;
      const wl = w * THREE.MathUtils.clamp(0.5 - (q.x - rings[ri].cx) / 0.05, 0, 1);
      sIdx.set([hips, lLeg, rLeg, 0], v * 4);
      sW.set([1 - w, wl, w - wl, 0], v * 4);
      continue;
    }
    let best = Infinity, bv = cand[0];
    for (const i of cand) {
      p.fromBufferAttribute(src.pos, i);
      const d = p.distanceToSquared(q);
      if (d < best) {
        best = d;
        bv = i;
      }
    }
    for (let k = 0; k < 4; k++) {
      sIdx[v * 4 + k] = src.skinIndex.getComponent(bv, k);
      sW[v * 4 + k] = src.skinWeight.getComponent(bv, k);
    }
  }
  void nr;
  g.setAttribute("skinIndex", new THREE.BufferAttribute(sIdx, 4));
  g.setAttribute("skinWeight", new THREE.BufferAttribute(sW, 4));
  const mesh = dressMesh(g, src.mesh, spec);
  if (opts.open) (mesh.material as THREE.Material).side = THREE.DoubleSide;
  return mesh;
}
