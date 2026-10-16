// 落灰：粉白色的灰像温柔的雪一直往下落（经验库：放在世界坐标里，镜头一动它跟着场景动，不能像贴在屏幕上）。
// 粒子在镜头周围一个盒子里，按世界坐标取余绕回：每一片都钉在世界里，只是飘出盒子时从另一边进来。
// 位置只由时间算（任意跳转都对）。
import * as THREE from "three";

const VS = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform vec3 uCam;
  uniform vec3 uBox;
  uniform float uSize;
  uniform float uFall;
  uniform vec3 uWind;
  varying float vA;
  varying float vFog;
  void main() {
    float sp = (0.55 + aSeed.w * 0.9) * uFall;
    vec3 p = aSeed.xyz * uBox;
    p.y -= uTime * sp;
    p.x += sin(uTime * (0.4 + aSeed.w * 0.5) + aSeed.y * 6.283) * 0.7 + uWind.x * uTime;
    p.z += cos(uTime * (0.33 + aSeed.x * 0.4) + aSeed.z * 6.283) * 0.7 + uWind.z * uTime;
    // 绕着镜头取余：世界里的一片灰，飘出盒子就从对面进来
    p = uCam + mod(p - uCam + 0.5 * uBox, uBox) - 0.5 * uBox;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float d = -mv.z;
    gl_PointSize = uSize * (0.45 + aSeed.y * 0.9) / max(d, 0.5);
    // 盒子边上淡出，远处淡进雾里
    vec3 q = abs(p - uCam) / (0.5 * uBox);
    vA = (1.0 - smoothstep(0.75, 1.0, max(q.x, max(q.y, q.z)))) * (0.55 + 0.45 * aSeed.z);
    vFog = smoothstep(0.0, 1.0, d / (0.5 * uBox.z));
  }
`;
const FS = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uFogColor;
  uniform float uOpacity;
  varying float vA;
  varying float vFog;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float a = (1.0 - smoothstep(0.25, 0.5, r)) * vA * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(mix(uColor, uFogColor, vFog * 0.5), a);
  }
`;

/** 一层落灰：count 片，在镜头周围 box（米）里；size 越大片越大 */
export function createAsh(count: number, box: [number, number, number], size: number, seed = 11) {
  const g = new THREE.BufferGeometry();
  const seeds = new Float32Array(count * 4);
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count * 4; i++) seeds[i] = r();
  g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  const u = {
    uTime: { value: 0 },
    uCam: { value: new THREE.Vector3() },
    uBox: { value: new THREE.Vector3(...box) },
    uSize: { value: size },
    uFall: { value: 1 },
    uWind: { value: new THREE.Vector3() },
    uColor: { value: new THREE.Color("#fbe9ef") },
    uFogColor: { value: new THREE.Color("#f1d3dc") },
    uOpacity: { value: 0.9 },
  };
  const points = new THREE.Points(
    g,
    new THREE.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, fog: false }),
  );
  points.frustumCulled = false;
  return {
    points,
    uniforms: u,
    update(t: number, camera: THREE.Camera, px: number) {
      u.uTime.value = t;
      u.uCam.value.copy(camera.position);
      // 点的大小按画面像素算（竖屏 1080 宽时 size 就是 1 米远处的像素）
      u.uSize.value = size * px;
    },
  };
}
