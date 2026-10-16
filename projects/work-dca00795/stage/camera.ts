// 情绪运镜的镜头：每一段写成「把世界里的一点 P 放到画面的 (sx, sy) 处，这一点所在的深度上画面高 fh 米」，
// 再加上镜头朝向（yaw 左右、pitch 俯仰、roll 歪）。段与段之间只插值这几个数（fh 按对数插值），推拉时人不乱跑。
// 画面比例来自相机：竖屏、横屏都按同一个 fh 取景（横屏左右多出来），所以留了横屏的口子。
import * as THREE from "three";

export interface Shot {
  P: THREE.Vector3; // 世界里的锚点
  sx: number; // 画面上的位置，0 左 1 右
  sy: number; // 0 上 1 下
  fh: number; // 锚点深度上画面的高（米）
  yaw: number; // 镜头朝向：0 朝 −z，正值往左转
  pitch: number; // 正值抬头
  roll: number; // 正值逆时针歪
  fov?: number; // 竖直视角（度），默认 35
}

export function shot(P: THREE.Vector3 | [number, number, number], sx: number, sy: number, fh: number, yaw = 0, pitch = 0, roll = 0, fov = 35): Shot {
  return { P: Array.isArray(P) ? new THREE.Vector3(...P) : P.clone(), sx, sy, fh, yaw, pitch, roll, fov };
}

/** 两个取景之间插值：位置线性、高度按对数、角度线性 */
export function mixShot(a: Shot, b: Shot, k: number): Shot {
  return {
    P: a.P.clone().lerp(b.P, k),
    sx: a.sx + (b.sx - a.sx) * k,
    sy: a.sy + (b.sy - a.sy) * k,
    fh: Math.exp(Math.log(a.fh) + (Math.log(b.fh) - Math.log(a.fh)) * k),
    yaw: a.yaw + (b.yaw - a.yaw) * k,
    pitch: a.pitch + (b.pitch - a.pitch) * k,
    roll: a.roll + (b.roll - a.roll) * k,
    fov: (a.fov ?? 35) + ((b.fov ?? 35) - (a.fov ?? 35)) * k,
  };
}

/** 甩镜：位置照常插值，中途往一个更远的取景（fh 更大）靠一下 */
export function whip(a: Shot, b: Shot, k: number, fhMid: number): Shot {
  const s = mixShot(a, b, k);
  const w = Math.sin(Math.PI * k);
  s.fh = Math.exp(Math.log(s.fh) + (Math.log(fhMid) - Math.log(s.fh)) * w);
  return s;
}

/** 把取景放到相机上 */
export function applyShot(cam: THREE.PerspectiveCamera, s: Shot, aspect: number) {
  cam.fov = s.fov ?? 35;
  cam.aspect = aspect;
  const e = new THREE.Euler(s.pitch, s.yaw, s.roll, "YXZ");
  cam.quaternion.setFromEuler(e);
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
  const d = s.fh / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
  const W = s.fh * aspect;
  cam.position
    .copy(s.P)
    .addScaledVector(fwd, -d)
    .addScaledVector(right, -(s.sx - 0.5) * W)
    .addScaledVector(up, -(0.5 - s.sy) * s.fh);
  cam.near = Math.max(0.05, d * 0.02);
  cam.far = 9000;
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
}

/** 世界里的一点在画面上的位置（0..1） */
export function toScreen(cam: THREE.Camera, p: THREE.Vector3) {
  const v = p.clone().project(cam);
  return { x: (v.x + 1) / 2, y: (1 - v.y) / 2, z: v.z };
}

/** 一惊：镜头冲一下再回来（dt 秒前发生），返回缩放乘数和抖动 */
export function kick(t: number, at: number, amount = 0.035, decay = 0.1) {
  if (t < at) return 0;
  return amount * Math.exp(-(t - at) / decay);
}

/** 平滑的抖（固定种子，按时间） */
export function shake(t: number, amp: number, freq = 18, seed = 1) {
  const n = (x: number) => Math.sin(x * 12.9898 + seed * 78.233) * 0.5 + Math.sin(x * 4.1 + seed) * 0.5;
  return { x: amp * n(t * freq), y: amp * n(t * freq + 19.7) };
}
