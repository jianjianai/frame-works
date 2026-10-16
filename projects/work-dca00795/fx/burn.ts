// 进白：一圈圈彩色光环炸开、人从头到脚化成五颜六色的火星，火星很快褪成灰白的灰，慢慢飘落。
// 火星的出生点取自人身上的顶点（在烧起来那一刻的姿势里），出生时间 = 切口扫到那个高度的时刻；全部只由时间算。
import * as THREE from "three";
import type { VRMModel } from "../rig3d/vrm";

const RING_FS = /* glsl */ `
  uniform float uAge;
  uniform float uOpacity;
  varying vec2 vUv;
  vec3 hue(float x) { return clamp(abs(fract(x + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    vec3 col = vec3(0.0);
    float a = 0.0;
    for (int i = 0; i < 4; i++) {
      float age = uAge - float(i) * 0.08;
      if (age < 0.0) continue;
      float R = 1.0 - exp(-age * 3.0);             // 半径 0 → 1，越来越慢
      float w = 0.008 + 0.016 * (1.0 - exp(-age * 4.0));
      float k = exp(-pow((r - R) / w, 2.0)) * exp(-age * 1.5);
      // 光环是一圈彩虹：沿半径从红到紫
      vec3 c = hue(float(i) * 0.22 + (r - R) / w * 0.12 + 0.02);
      col += c * k;
      a += k;
    }
    float core = exp(-r * r / 0.012) * exp(-uAge * 6.0);
    col += vec3(1.0, 0.97, 0.9) * core;
    a = clamp(a * 0.85 + core * 0.7, 0.0, 1.0);
    gl_FragColor = vec4(col / max(a, 0.001) * a, a * uOpacity);
  }
`;
const UV_VS = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

/** 彩色光环：一张总是朝着镜头的方片（size 米），age = 炸开以后的秒数 */
export function lightRings(size: number) {
  const u = { uAge: { value: -1 }, uOpacity: { value: 1 } };
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.ShaderMaterial({ uniforms: u, vertexShader: UV_VS, fragmentShader: RING_FS, transparent: true, depthWrite: false, fog: false }),
  );
  m.frustumCulled = false;
  return {
    mesh: m,
    update(age: number, camera: THREE.Camera, at: THREE.Vector3) {
      u.uAge.value = age;
      m.visible = age > 0 && age < 3;
      m.position.copy(at);
      m.quaternion.copy(camera.quaternion);
    },
  };
}

const SPARK_VS = /* glsl */ `
  attribute vec3 aPos;     // 出生点（世界）
  attribute vec4 aRnd;     // 随机数
  attribute float aBirth;  // 出生时间
  uniform float uTime;
  uniform float uPx;
  varying vec3 vCol;
  varying float vA;
  vec3 hue(float x) { return clamp(abs(fract(x + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
  void main() {
    float age = uTime - aBirth;
    if (age < 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; return; }
    // 往外迸一下，很快慢下来；之后变成灰，慢慢往下飘、左右晃
    vec3 dir = normalize(aRnd.xyz - 0.5 + vec3(0.0, 0.25, 0.0));
    float burst = (1.0 - exp(-age * 5.0)) * (0.25 + aRnd.w * 0.55);
    vec3 p = aPos + dir * burst;
    p.y += 0.25 * (1.0 - exp(-age * 2.0)) - max(age - 0.6, 0.0) * 0.35;
    p.x += sin(age * 2.0 + aRnd.x * 6.28) * 0.08 * age;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float ash = smoothstep(0.15, 0.7, age);
    // 刚迸出来是一粒发亮的彩色火星（中心发白），0.15–0.6 秒褪成灰白的灰
    vCol = mix(hue(aRnd.y + age * 0.3) * 0.9 + 0.15, vec3(0.66, 0.62, 0.7), ash);
    vA = (1.0 - smoothstep(2.4, 3.6, age)) * (1.0 - 0.35 * ash);
    gl_PointSize = uPx * (0.012 + 0.022 * aRnd.z * aRnd.z) * (1.0 + 1.4 * exp(-age * 7.0)) / max(-mv.z, 0.1);
  }
`;
const SPARK_FS = /* glsl */ `
  varying vec3 vCol;
  varying float vA;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = (1.0 - smoothstep(0.15, 0.5, r)) * vA;
    if (a < 0.01) discard;
    vec3 c = mix(vCol, vec3(1.0), (1.0 - smoothstep(0.0, 0.22, r)) * 0.55);
    gl_FragColor = vec4(c, a);
  }
`;

/**
 * 火星：在 tBurn 时刻按模型当时的姿势取 n 个顶点当出生点，切口从 top 扫到 bottom 用 dur 秒。
 * 先 capture() 再用；update(t) 每帧调。
 */
export function sparks(n: number) {
  const g = new THREE.BufferGeometry();
  const aPos = new Float32Array(n * 3), aRnd = new Float32Array(n * 4), aBirth = new Float32Array(n);
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute("aPos", new THREE.BufferAttribute(aPos, 3));
  g.setAttribute("aRnd", new THREE.BufferAttribute(aRnd, 4));
  g.setAttribute("aBirth", new THREE.BufferAttribute(aBirth, 1));
  const u = { uTime: { value: 0 }, uPx: { value: 1000 } };
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: u, vertexShader: SPARK_VS, fragmentShader: SPARK_FS, transparent: true, depthWrite: false, fog: false }));
  pts.frustumCulled = false;
  let s = 1234567;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return {
    points: pts,
    /** 按模型现在的姿势取出生点；切口从 top 往下扫到 bottom，用 dur 秒，从 t0 开始 */
    capture(model: VRMModel, t0: number, dur: number) {
      const skinned: THREE.SkinnedMesh[] = [];
      model.root.updateMatrixWorld(true);
      model.root.traverse((o) => {
        const m = o as THREE.SkinnedMesh;
        if (m.isSkinnedMesh && m.visible && (m.material as THREE.Material).name !== "outline") skinned.push(m);
      });
      const v = new THREE.Vector3();
      const all: THREE.Vector3[] = [];
      for (const m of skinned) {
        m.skeleton.update();
        const pos = m.geometry.getAttribute("position");
        const step = Math.max(1, Math.floor(pos.count / 400));
        for (let i = 0; i < pos.count; i += step) {
          m.getVertexPosition(i, v);
          all.push(v.clone().applyMatrix4(m.matrixWorld));
        }
      }
      let top = -Infinity, bottom = Infinity;
      for (const p of all) {
        top = Math.max(top, p.y);
        bottom = Math.min(bottom, p.y);
      }
      for (let i = 0; i < n; i++) {
        const p = all[Math.floor(r() * all.length)];
        aPos.set([p.x, p.y, p.z], i * 3);
        aRnd.set([r(), r(), r(), r()], i * 4);
        aBirth[i] = t0 + ((top - p.y) / Math.max(top - bottom, 0.01)) * dur + r() * 0.04;
      }
      g.attributes.aPos.needsUpdate = true;
      g.attributes.aRnd.needsUpdate = true;
      g.attributes.aBirth.needsUpdate = true;
      return { top, bottom };
    },
    update(t: number, px: number) {
      u.uTime.value = t;
      u.uPx.value = px;
    },
  };
}

/** 眼泪：从眼角往上飘的几滴（失重的人），按时间一滴滴冒出来 */
export function floatingTears(count = 6) {
  const g = new THREE.SphereGeometry(1, 8, 6);
  const mat = new THREE.MeshBasicMaterial({ color: "#eaf6ff", transparent: true, opacity: 0.9 });
  const drops = Array.from({ length: count }, () => new THREE.Mesh(g, mat));
  const group = new THREE.Group();
  for (const d of drops) group.add(d);
  return {
    group,
    /** eyes：两只眼角的世界位置；up：往哪边飘 */
    update(t: number, eyes: THREE.Vector3[], up: THREE.Vector3, on: number) {
      drops.forEach((d, i) => {
        const period = 0.9;
        const ph = ((t + i * (period / count) * 1.7) % period) / period;
        const eye = eyes[i % eyes.length];
        d.position.copy(eye).addScaledVector(up, ph * 0.22).add(new THREE.Vector3(Math.sin(i * 2.3 + t) * 0.01, 0, 0));
        const s = 0.006 * (1 - ph * 0.5) * on;
        d.scale.setScalar(Math.max(s, 1e-5));
        d.visible = on > 0.01;
      });
    },
  };
}
