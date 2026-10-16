// 三维人物测试（不进时间轴）：秤砣换好衣服、发型以后的正面、侧面、背面。t = 页码。
import * as THREE from "three";
import type { Scene, SceneOptions } from "@frame/engine/types";
import { pose, express, setOutlineResolution } from "../rig3d/vrm";
import { buildChengtuo } from "../cast3d/chengtuo";

const ARMS_DOWN = {
  leftUpperArm: [0, 0, 1.25] as [number, number, number],
  rightUpperArm: [0, 0, -1.25] as [number, number, number],
  leftLowerArm: [0, -0.1, 0.06] as [number, number, number],
  rightLowerArm: [0, 0.1, -0.06] as [number, number, number],
  leftUpperLeg: [0, 0, -0.05] as [number, number, number],
  rightUpperLeg: [0, 0, 0.05] as [number, number, number],
  leftLowerLeg: [0, 0, 0.012] as [number, number, number],
  rightLowerLeg: [0, 0, -0.012] as [number, number, number],
};

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height);
  renderer.setClearColor(0xf3efe9, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setScissorTest(true);
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xdfe3ff, 1.35));
  const key = new THREE.DirectionalLight(0xfff4e6, 1.9);
  key.position.set(-1.5, 2.5, 3);
  scene.add(key);
  const ct = await buildChengtuo();
  scene.add(ct.model.root);
  pose(ct.model, ARMS_DOWN);
  express(ct.model, {});
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 50);
  /** 在画面的一格里画：人转到 rotY，取景中心 (cx, cy)、取景高 h。 */
  const cell = (x: number, y: number, w: number, h: number, rotY: number, cy: number, viewH: number, t: number) => {
    ct.model.root.rotation.y = rotY;
    ct.model.root.position.set(0, ct.footLift, 0);
    ct.update(t);
    const aspect = w / h;
    camera.left = (-viewH * aspect) / 2;
    camera.right = (viewH * aspect) / 2;
    camera.top = viewH / 2;
    camera.bottom = -viewH / 2;
    camera.position.set(0, cy, 10);
    camera.lookAt(0, cy, 0);
    camera.updateProjectionMatrix();
    setOutlineResolution(scene, w, h, 0.75);
    renderer.setViewport(x, height - y - h, w, h);
    renderer.setScissor(x, height - y - h, w, h);
    renderer.render(scene, camera);
  };
  return {
    canvas: renderer.domElement,
    render(t) {
      const page = Math.floor(t);
      renderer.setScissor(0, 0, width, height);
      renderer.clear();
      const W = width / 3;
      if (page === 0) {
        [0, -Math.PI / 2, Math.PI].forEach((r, i) => cell(i * W, 0, W, height * 0.62, r, 0.86, 1.85, t));
        // 下面：头部特写三个角度
        [0, -Math.PI / 2, Math.PI].forEach((r, i) => cell(i * W, height * 0.62, W, height * 0.38, r, 1.38, 0.5, t));
      } else {
        [0, -Math.PI / 4, -Math.PI / 2].forEach((r, i) => cell(i * W, 0, W, height * 0.5, r, 1.15, 1.0, t));
        [Math.PI * 0.75, Math.PI, Math.PI / 4].forEach((r, i) => cell(i * W, height * 0.5, W, height * 0.5, r, 1.15, 1.0, t));
      }
    },
    dispose() {
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
