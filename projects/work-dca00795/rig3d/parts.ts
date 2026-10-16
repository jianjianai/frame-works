// 跟着骨头走、每帧重新算形状的小零件：马尾、腰带垂下来的带子；以及写着字的砖。
// 都在世界坐标里按重力、失重、风算形状（跟 2D 版一样：只看时间，不存状态）。
import * as THREE from "three";
import { outlineMaterial } from "./vrm";
import { paintedToon } from "./garment";

export interface TubeOptions {
  segments: number; // 沿长度几节
  radial: number; // 一圈几个点
  radius: (k: number) => number; // k 0..1 从根到梢的半径（米）
  flat?: number; // 横截面压扁（带子用 <1）
  paint: string;
  colors: THREE.ColorRepresentation[];
  outline?: number;
}

/** 一根管子（马尾、带子）：形状每帧按给定的中心线重建。 */
export class Tube {
  readonly mesh: THREE.Mesh;
  readonly line: THREE.Mesh | null;
  private geo: THREE.BufferGeometry;
  private pos: Float32Array;
  private nrm: Float32Array;
  constructor(readonly o: TubeOptions) {
    const n = (o.segments + 1) * (o.radial + 1);
    this.pos = new Float32Array(n * 3);
    this.nrm = new Float32Array(n * 3);
    const rest = new Float32Array(n * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(this.nrm, 3));
    // aRest：x = 沿长度 0..1，y = 绕一圈 0..1（给花纹用）
    for (let i = 0; i <= o.segments; i++)
      for (let j = 0; j <= o.radial; j++) rest.set([i / o.segments, j / o.radial, 0], (i * (o.radial + 1) + j) * 3);
    g.setAttribute("aRest", new THREE.BufferAttribute(rest, 3));
    const idx: number[] = [];
    for (let i = 0; i < o.segments; i++)
      for (let j = 0; j < o.radial; j++) {
        const a = i * (o.radial + 1) + j, b = a + 1, c = a + o.radial + 1, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    g.setIndex(idx);
    this.geo = g;
    this.mesh = new THREE.Mesh(g, paintedToon(o.paint, o.colors, { side: THREE.DoubleSide }));
    this.mesh.frustumCulled = false;
    const w = o.outline ?? 2.2;
    this.line = w > 0 ? new THREE.Mesh(g, outlineMaterial(w, 0x241c28, false)) : null;
    if (this.line) this.line.frustumCulled = false;
  }
  add(parent: THREE.Object3D) {
    parent.add(this.mesh);
    if (this.line) parent.add(this.line);
  }
  set visible(v: boolean) {
    this.mesh.visible = v;
    if (this.line) this.line.visible = v;
  }
  /** 中心线 pts（segments + 1 个点，父坐标里）；up 用来定横截面的朝向（扁带子的宽面朝 up × 切线）。 */
  update(pts: THREE.Vector3[], up = new THREE.Vector3(0, 0, 1)) {
    const { segments: S, radial: R, radius, flat = 1 } = this.o;
    const t = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), q = new THREE.Vector3();
    for (let i = 0; i <= S; i++) {
      const p = pts[i];
      t.subVectors(pts[Math.min(S, i + 1)], pts[Math.max(0, i - 1)]).normalize();
      a.crossVectors(t, up);
      if (a.lengthSq() < 1e-6) a.set(1, 0, 0);
      a.normalize();
      b.crossVectors(a, t).normalize();
      const r = radius(i / S);
      for (let j = 0; j <= R; j++) {
        const ang = (j / R) * Math.PI * 2;
        const c = Math.cos(ang), s = Math.sin(ang) * flat;
        q.copy(a).multiplyScalar(c).addScaledVector(b, s);
        const k = (i * (R + 1) + j) * 3;
        this.pos[k] = p.x + q.x * r;
        this.pos[k + 1] = p.y + q.y * r;
        this.pos[k + 2] = p.z + q.z * r;
        q.copy(a).multiplyScalar(c * flat).addScaledVector(b, Math.sin(ang)).normalize();
        this.nrm[k] = q.x;
        this.nrm[k + 1] = q.y;
        this.nrm[k + 2] = q.z;
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.normal.needsUpdate = true;
    this.geo.computeBoundingSphere();
  }
}

/**
 * 垂下来的一串点（马尾、带子）：从 root 出发，第一节朝 start 方向，之后每节往「该垂的方向」转过去。
 * hang：重力（世界 −y）、失重时朝上（float 0..1）、风（wind，世界坐标的方向和大小）。wave：每节加一点摆动。
 */
export function hangChain(root: THREE.Vector3, start: THREE.Vector3, n: number, seg: number, float: number, wind: THREE.Vector3, follow: number, wave: (i: number) => THREE.Vector3) {
  const ff = float * float * (3 - 2 * float);
  const target = new THREE.Vector3(0, -1 + 2 * ff, 0).add(wind);
  if (target.lengthSq() < 1e-6) target.set(0, 1, 0);
  target.normalize();
  const pts = [root.clone()];
  const d = start.clone().normalize();
  const p = root.clone();
  for (let i = 0; i < n; i++) {
    d.lerp(target, follow).add(wave(i)).normalize();
    p.addScaledVector(d, seg);
    pts.push(p.clone());
  }
  return pts;
}

// ---------------------------------------------------------------- 砖

let brickTex: THREE.CanvasTexture | null = null;
/** 砖的贴图：米白的砖面，圆珠笔写的红字「活下去」（竖着写）。 */
export function brickTexture() {
  if (brickTex) return brickTex;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#e6ddd2";
  g.fillRect(0, 0, 128, 256);
  g.fillStyle = "rgba(150,130,115,0.35)";
  for (let i = 0; i < 26; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const y = (Math.sin(i * 78.233) * 12345.678) % 1;
    g.beginPath();
    g.arc(Math.abs(x) * 128, Math.abs(y) * 256, 2 + (i % 3), 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#b3372f";
  g.font = `700 64px "Noto Serif CJK SC", "Noto Serif SC", serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  ["活", "下", "去"].forEach((ch, i) => {
    g.save();
    g.translate(64 + Math.sin(i * 2.1) * 4, 52 + i * 76);
    g.rotate(Math.sin(i * 1.7) * 0.07);
    g.fillText(ch, 0, 0);
    g.restore();
  });
  brickTex = new THREE.CanvasTexture(c);
  brickTex.colorSpace = THREE.SRGBColorSpace;
  return brickTex;
}

/** 一块砖（宽 w、厚 d、高 h，米），字写在 +z 那一面。 */
export function brickMesh(w: number, d: number, h: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  const tex = brickTexture();
  const face = new THREE.MeshToonMaterial({ map: tex });
  const plain = new THREE.MeshToonMaterial({ color: 0xd8cfc4 });
  const mesh = new THREE.Mesh(g, [plain, plain, plain, plain, face, plain]);
  const line = new THREE.Mesh(g, outlineMaterial(1.6, 0x3a302c, false));
  mesh.add(line);
  return mesh;
}
