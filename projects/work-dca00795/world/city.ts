// 沉州的楼群：一次画完几百栋楼（InstancedMesh），窗户、楼层线、底层、檐口在着色器里按米画，远处的楼淡进雾里。
// 坐标：米，y 朝上；主街沿 x 轴，在 z = 0（两边的楼面在 z = ±8）；镜头大多朝 −z 看。
// 「白」在头顶 300 米；她住的那栋最高的楼顶层离白只有一米。
import * as THREE from "three";
import { outlineMaterial, toonRamp } from "../rig3d/vrm";
import { WALLS, type Mood } from "./palette";

export interface Building {
  x: number; // 中心
  z: number;
  w: number; // x 方向宽
  d: number; // z 方向深
  h: number; // 高
  color: THREE.Color;
  bay: number; // 窗间距
  floor: number; // 层高
  seed: number;
  /** 亮灯的比例乘数（0 不亮） */
  lit: number;
}

export const WHITE_Y = 300;
/** 她住的那栋楼：主街北边，脚下是哑铃店 */
export const HERO_TOWER = { x: -19, z: -19, w: 18, d: 18, h: WHITE_Y - 1 };

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 生成整座城：一块块街区，每块 1–3 栋楼。keep(x, z, w, d) 返回 false 的位置留空（给手工搭的街景让位）。
 * 离主街越远越高（盆地往中间、往远处层层叠上去），靠镜头这一侧（z > 0）矮一些，镜头升起来时不挡住城。
 */
export function generateCity(seed = 7, keep: (b: Building) => boolean = () => true): Building[] {
  const r = rng(seed);
  const out: Building[] = [];
  const BX = 34, BZ = 38, STREET = 12;
  for (let gx = -18; gx <= 18; gx++)
    for (let gz = -26; gz <= 8; gz++) {
      const main = gz === 0 || gz === -1; // 主街两侧的第一排：老街，矮一些
      // 街在 x = k·(BX+STREET) + 0 和 z = k·(BZ+STREET) + 0 上（主街正好在 z = 0，半宽 STREET/2）
      const x0 = gx * (BX + STREET) + STREET / 2;
      const z0 = gz * (BZ + STREET) + STREET / 2 + (gz >= 0 ? 2 : -2); // 主街宽 16 米
      let x = x0;
      while (x < x0 + BX - 6) {
        const w = Math.min(x0 + BX - x, 8 + r() * 18);
        const dz = 14 + r() * (BZ - 14);
        const zc = z0 + BZ - dz / 2 - r() * (BZ - dz);
        const far = Math.min(1, Math.max(0, -zc / 700));
        const near = zc > 0;
        let h = 16 + (60 + 120 * far) * Math.pow(r(), 1.9);
        if (r() > 0.965 - 0.03 * far) h = 150 + r() * 110;
        if (near) h = Math.min(h, 22 + 40 * r());
        if (main) h = 10 + 16 * r();
        const b: Building = {
          x: x + w / 2,
          z: zc,
          w: w - 0.6,
          d: dz,
          h: Math.min(h, WHITE_Y - 12),
          color: WALLS[Math.floor(r() * WALLS.length)].clone(),
          bay: 2.6 + r() * 0.9,
          floor: 3.0 + r() * 0.4,
          seed: r() * 1000,
          lit: 0.6 + r() * 0.8,
        };
        if (keep(b)) out.push(b);
        x += w;
      }
    }
  // 她住的那栋楼
  const t = HERO_TOWER;
  const hero: Building = { x: t.x, z: t.z, w: t.w, d: t.d, h: t.h, color: new THREE.Color("#b9cfe0"), bay: 3.0, floor: 3.0, seed: 77, lit: 0.8 };
  return [...out.filter((b) => Math.abs(b.x - t.x) > (b.w + t.w) / 2 + 1 || Math.abs(b.z - t.z) > (b.d + t.d) / 2 + 1), hero];
}

const FACADE = /* glsl */ `
  float rectAA(vec2 p, vec2 hs) {
    vec2 d = abs(p) - hs;
    float dist = max(d.x, d.y);
    float w = fwidth(dist) + 1e-4;
    return 1.0 - smoothstep(-w, w, dist);
  }
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec3 facade(vec3 m, vec3 n, vec3 base, vec4 st, vec3 size) {
    if (n.y > 0.5) return base * 0.82;
    if (n.y < -0.5) return base * 0.6;
    // 这一面上的横坐标（米）
    float u = abs(n.x) > 0.5 ? m.z * sign(n.x) : -m.x * sign(n.z);
    float v = m.y;
    float bay = st.x, fl = st.y;
    vec3 col = base;
    // 底层：深一点的一道（店面、门洞那一层）
    if (v < fl * 1.15) col = base * 0.9;
    // 檐口
    if (v > size.y - 0.7) col = base * 0.88;
    if (v > fl * 1.15 && v < size.y - 1.0) {
      vec2 c = vec2(u / bay, v / fl);
      vec2 id = floor(c);
      vec2 p = (fract(c) - vec2(0.5, 0.55)) * vec2(bay, fl);
      float fr = rectAA(p, vec2(bay * 0.26 + 0.09, fl * 0.27 + 0.09));
      float win = rectAA(p, vec2(bay * 0.26, fl * 0.27));
      float lit = step(h21(mod(id, vec2(61.0, 53.0)) + vec2(fract(st.z * 0.013) * 37.0, 0.0)), uWindowsLit * st.w);
      vec3 glass = mix(uGlass, uGlass * 1.18, smoothstep(-0.8, 0.8, p.y));
      vec3 wc = mix(glass, uWindowLight, lit);
      col = mix(col, base * 1.12, fr);
      col = mix(col, wc, win);
      // 每层一道细线
      float ly = abs(fract(v / fl) - 0.02) * fl;
      col = mix(col, base * 0.85, (1.0 - smoothstep(0.0, 0.06 + fwidth(v) , ly)) * (1.0 - fr));
    }
    return col;
  }
`;

/** 实例化的楼群（加一层描边） */
export function buildingsMesh(list: Building[], mood: Mood) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  const n = list.length;
  const iColor = new Float32Array(n * 3), iSize = new Float32Array(n * 3), iStyle = new Float32Array(n * 4);
  const m = new THREE.Matrix4();
  list.forEach((b, i) => {
    iColor.set([b.color.r, b.color.g, b.color.b], i * 3);
    iSize.set([b.w, b.h, b.d], i * 3);
    iStyle.set([b.bay, b.floor, b.seed, b.lit], i * 4);
  });
  geo.setAttribute("iColor", new THREE.InstancedBufferAttribute(iColor, 3));
  geo.setAttribute("iSize", new THREE.InstancedBufferAttribute(iSize, 3));
  geo.setAttribute("iStyle", new THREE.InstancedBufferAttribute(iStyle, 4));
  const uniforms = {
    uGlass: { value: new THREE.Color(mood.glass) },
    uWindowLight: { value: new THREE.Color(mood.windowLight) },
    uWindowsLit: { value: mood.windowsLit },
  };
  const mat = new THREE.MeshToonMaterial({ gradientMap: toonRamp(0.62) });
  mat.customProgramCacheKey = () => "city-facade";
  mat.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, uniforms);
    s.vertexShader = s.vertexShader.replace(
      "void main() {",
      "attribute vec3 iColor;\nattribute vec3 iSize;\nattribute vec4 iStyle;\nvarying vec3 vM;\nvarying vec3 vNo;\nflat varying vec3 vCol;\nflat varying vec4 vSt;\nflat varying vec3 vSize;\nvoid main() {\n  vM = position * iSize;\n  vNo = normal;\n  vCol = iColor;\n  vSt = iStyle;\n  vSize = iSize;",
    );
    s.fragmentShader = s.fragmentShader
      .replace(
        "void main() {",
        "varying vec3 vM;\nvarying vec3 vNo;\nflat varying vec3 vCol;\nflat varying vec4 vSt;\nflat varying vec3 vSize;\nuniform vec3 uGlass;\nuniform vec3 uWindowLight;\nuniform float uWindowsLit;\n" + FACADE + "\nvoid main() {",
      )
      .replace("vec4 diffuseColor = vec4( diffuse, opacity );", "vec4 diffuseColor = vec4( facade(vM, vNo, vCol, vSt, vSize), opacity );");
  };
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  const line = new THREE.InstancedMesh(geo, outlineMaterial(1.1, 0x5b4a62, false), n);
  list.forEach((b, i) => {
    m.makeScale(b.w, b.h, b.d).setPosition(b.x, 0, b.z);
    mesh.setMatrixAt(i, m);
    line.setMatrixAt(i, m);
  });
  mesh.frustumCulled = false;
  line.frustumCulled = false;
  const group = new THREE.Group();
  group.add(mesh, line);
  return {
    group,
    setMood(md: Mood) {
      uniforms.uGlass.value.set(md.glass);
      uniforms.uWindowLight.value.set(md.windowLight);
      uniforms.uWindowsLit.value = md.windowsLit;
    },
  };
}
