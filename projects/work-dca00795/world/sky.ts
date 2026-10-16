// 天：头顶 300 米是一整片「白」（发光的暖白，官方叫它乐园），白的下沿一圈彩虹边，几道光柱垂下来；
// 白和地面之间是粉橙到淡紫的雾（远处的楼淡进雾里）。全部不受雾影响、不受光照。
import * as THREE from "three";
import { WHITE_Y } from "./city";
import type { Mood } from "./palette";

const SKY_VS = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
  }
`;
const SKY_FS = /* glsl */ `
  uniform vec3 uWhite, uHigh, uHaze, uLow;
  varying vec3 vDir;
  void main() {
    float e = vDir.y;                 // 仰角的正弦
    vec3 c = mix(uLow, uHaze, smoothstep(-0.25, 0.02, e));
    c = mix(c, uHigh, smoothstep(0.02, 0.16, e));
    c = mix(c, uWhite, smoothstep(0.14, 0.3, e));
    gl_FragColor = vec4(c, 1.0);
  }
`;

/** 白的下表面：中间亮，远处淡进天色（不画雾） */
const WHITE_FS = /* glsl */ `
  uniform vec3 uWhite, uHigh;
  uniform float uFlash;
  varying vec2 vXZ;
  float h(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.743); }
  float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
  void main() {
    float r = length(vXZ);
    // 一点慢慢流动的明暗（像光在里面翻涌）
    float k = n2(vXZ / 180.0) * 0.6 + n2(vXZ / 60.0 + 17.0) * 0.4;
    vec3 c = uWhite * (1.0 + 0.06 * (k - 0.5)) + uFlash * vec3(0.25);
    c = mix(c, uHigh, smoothstep(1200.0, 2600.0, r) * 0.6);
    gl_FragColor = vec4(c, 1.0);
  }
`;

/** 彩虹边：一圈竖着的光带，从白的下沿往下淡掉 */
const RAINBOW_FS = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  vec3 hue(float x) { return clamp(abs(fract(x + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
  void main() {
    float v = vUv.y;                       // 0 底，1 顶（贴着白）
    // 从下往上：红、橙、黄、绿、蓝、紫，贴着白的地方化成白光
    vec3 c = mix(hue(0.0 + v * 0.78) * 0.85 + 0.15, vec3(1.0), smoothstep(0.82, 1.0, v));
    float a = smoothstep(0.0, 0.35, v) * (1.0 - 0.4 * smoothstep(0.9, 1.0, v));
    gl_FragColor = vec4(c, a * uOpacity);
  }
`;

/** 光柱：上面亮、往下淡，两边柔边 */
const SHAFT_FS = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float x = abs(vUv.x - 0.5) * 2.0;
    float side = pow(max(0.0, 1.0 - x * x), 3.0);
    float a = side * pow(vUv.y, 2.2) * smoothstep(1.0, 0.94, vUv.y) * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }
`;
const UV_VS = /* glsl */ `
  varying vec2 vUv;
  varying vec2 vXZ;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vXZ = w.xz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

export function createSky(mood: Mood) {
  const group = new THREE.Group();
  const skyU = {
    uWhite: { value: new THREE.Color(mood.white) },
    uHigh: { value: new THREE.Color(mood.skyHigh) },
    uHaze: { value: new THREE.Color(mood.haze) },
    uLow: { value: new THREE.Color(mood.hazeLow) },
  };
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(4000, 32, 16),
    new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false, fog: false }),
  );
  dome.renderOrder = -10;
  dome.frustumCulled = false;
  group.add(dome);

  const whiteU = { uWhite: skyU.uWhite, uHigh: skyU.uHigh, uFlash: { value: 0 } };
  const white = new THREE.Mesh(
    new THREE.PlaneGeometry(9000, 9000, 1, 1),
    new THREE.ShaderMaterial({ uniforms: whiteU, vertexShader: UV_VS, fragmentShader: WHITE_FS, side: THREE.DoubleSide, fog: false }),
  );
  white.rotation.x = Math.PI / 2;
  white.position.y = WHITE_Y;
  group.add(white);

  const rainbowU = { uOpacity: { value: 0.42 } };
  const rainbow = new THREE.Mesh(
    new THREE.CylinderGeometry(1700, 1700, 26, 96, 1, true),
    new THREE.ShaderMaterial({
      uniforms: rainbowU,
      vertexShader: UV_VS,
      fragmentShader: RAINBOW_FS,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    }),
  );
  rainbow.position.y = WHITE_Y - 13;
  rainbow.frustumCulled = false;
  group.add(rainbow);

  // 光柱：几道从白里垂下来的光（固定位置，跟着镜头转向）
  const shaftU = { uColor: { value: new THREE.Color("#fff3df") }, uOpacity: { value: 0.1 } };
  const shaftMat = new THREE.ShaderMaterial({
    uniforms: shaftU,
    vertexShader: UV_VS,
    fragmentShader: SHAFT_FS,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
  });
  const shafts: THREE.Mesh[] = [];
  const spots: [number, number, number][] = [
    [-140, -260, 70],
    [60, -420, 110],
    [-320, -620, 140],
    [240, -180, 60],
    [10, -900, 180],
    [-60, -120, 40],
  ];
  for (const [x, z, w] of spots) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WHITE_Y - 20), shaftMat);
    m.position.set(x, (WHITE_Y + 20) / 2, z);
    m.frustumCulled = false;
    shafts.push(m);
    group.add(m);
  }
  return {
    group,
    /** 每帧：光柱转向镜头；flash 白闪一下（有人进白时） */
    update(camera: THREE.Camera, flash = 0) {
      for (const s of shafts) {
        const dx = camera.position.x - s.position.x, dz = camera.position.z - s.position.z;
        s.rotation.y = Math.atan2(dx, dz);
      }
      dome.position.copy(camera.position);
      whiteU.uFlash.value = flash;
    },
    setMood(md: Mood) {
      skyU.uWhite.value.set(md.white);
      skyU.uHigh.value.set(md.skyHigh);
      skyU.uHaze.value.set(md.haze);
      skyU.uLow.value.set(md.hazeLow);
    },
    rainbow: rainbowU,
    shafts: shaftU,
  };
}
