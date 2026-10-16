// 铁靴砸地：石板裂开（从落点往外放射的裂纹，0.08 秒长出来）、一圈灰沿地面散开。只由「砸下去以后的秒数」算。
import * as THREE from "three";

function crackTexture(seed: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  g.strokeStyle = "rgba(58, 44, 66, 0.95)";
  g.lineCap = "round";
  const branch = (x: number, y: number, a: number, len: number, w: number, depth: number) => {
    let px = x, py = y;
    const n = 6;
    for (let i = 0; i < n; i++) {
      a += (r() - 0.5) * 0.7;
      const nx = px + Math.cos(a) * (len / n), ny = py + Math.sin(a) * (len / n);
      g.lineWidth = w * (1 - i / n) + 0.6;
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(nx, ny);
      g.stroke();
      if (depth > 0 && r() < 0.35) branch(nx, ny, a + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.6), len * 0.45, w * 0.6, depth - 1);
      px = nx;
      py = ny;
    }
  };
  const arms = 7 + Math.floor(r() * 4);
  for (let i = 0; i < arms; i++) branch(256, 256, (i / arms) * Math.PI * 2 + r() * 0.4, 120 + r() * 120, 5, 2);
  // 中心压碎的一小块
  g.fillStyle = "rgba(70, 54, 78, 0.55)";
  g.beginPath();
  g.ellipse(256, 256, 34, 26, r(), 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** 裂纹：地上的一张贴花（size 米），age < 0 不显示，0–0.08 秒从中心长出来 */
export function crackDecal(size: number, seed: number) {
  const tex = crackTexture(seed);
  const u = { uMap: { value: tex }, uGrow: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D uMap; uniform float uGrow; varying vec2 vUv;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        vec4 c = texture2D(uMap, vUv);
        float a = c.a * (1.0 - smoothstep(uGrow - 0.08, uGrow, r));
        if (a < 0.02) discard;
        gl_FragColor = vec4(c.rgb, a);
      }`,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 2;
  return {
    mesh,
    update(age: number, at: THREE.Vector3) {
      mesh.visible = age >= 0;
      mesh.position.copy(at);
      u.uGrow.value = Math.min(1.05, age / 0.08);
    },
  };
}

/** 一圈灰：沿地面往外散开、变淡（0–0.9 秒） */
export function dustRing(size: number) {
  const u = { uAge: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uAge; varying vec2 vUv;
      float h(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.743); }
      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        float R = 0.25 + 0.75 * (1.0 - exp(-uAge * 4.0));
        float ring = exp(-pow((r - R) / (0.12 + 0.2 * uAge), 2.0));
        float puff = 0.6 + 0.4 * h(floor(vec2(atan(p.y, p.x) * 6.0, r * 8.0)));
        float a = ring * puff * (1.0 - smoothstep(0.35, 0.9, uAge)) * 0.75;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(0.95, 0.92, 0.95), a);
      }`,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size * 2, size * 2), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 3;
  return {
    mesh,
    update(age: number, at: THREE.Vector3) {
      mesh.visible = age >= 0 && age < 0.95;
      mesh.position.copy(at).add(new THREE.Vector3(0, 0.05, 0));
      u.uAge.value = age;
    },
  };
}
