// 小石头单人测试（不进时间轴）：t = 0 平常的衣服，t = 1 穿妈妈的橘色大外套。上：正面、侧面、背面；下：脸。
import * as THREE from "three";
import type { Scene, SceneOptions } from "@frame/engine/types";
import { disposeObject } from "@frame/engine/three-assets";
import { pose, express, setOutlineResolution, bonePos } from "../rig3d/vrm";
import { buildXiaoshitou } from "../cast3d/xiaoshitou";

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
  const kid = await buildXiaoshitou();
  const m = kid.model;
  scene.add(m.root);
  pose(m, { leftUpperArm: [0, 0, 1.2], rightUpperArm: [0, 0, -1.2], leftLowerArm: [0, -0.1, 0.06], rightLowerArm: [0, 0.1, -0.06], leftUpperLeg: [0, 0, -0.04], rightUpperLeg: [0, 0, 0.04] });
  express(m, {});
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 50);
  const shot = (x: number, y: number, w: number, h: number, rot: number, cx: number, cy: number, viewH: number, px: number) => {
    m.root.rotation.y = rot;
    m.root.position.set(0, kid.footLift, 0);
    kid.update(0);
    const aspect = w / h;
    cam.left = cx - (viewH * aspect) / 2;
    cam.right = cx + (viewH * aspect) / 2;
    cam.top = viewH / 2;
    cam.bottom = -viewH / 2;
    cam.position.set(0, cy, 10);
    cam.lookAt(0, cy, 0);
    cam.updateProjectionMatrix();
    setOutlineResolution(scene, w, h, px);
    renderer.setViewport(x, height - y - h, w, h);
    renderer.setScissor(x, height - y - h, w, h);
    renderer.render(scene, cam);
  };
  return {
    canvas: renderer.domElement,
    render(t) {
      renderer.setScissor(0, 0, width, height);
      renderer.clear();
      kid.setWear({ coat: Math.floor(t) % 2 === 1 });
      const W = width / 3;
      [0, -Math.PI / 2, Math.PI].forEach((r, i) => shot(i * W, 0, W, height * 0.55, r, 0, 0.56, 1.18, 0.8));
      m.root.rotation.y = 0;
      m.root.position.set(0, kid.footLift, 0);
      m.root.updateWorldMatrix(true, true);
      const hp = bonePos(m, "head");
      [0, -0.6, -Math.PI / 2].forEach((r, i) => shot(i * W, height * 0.55, W, height * 0.45, r, 0, hp.y + 0.05, 0.42, 0.8));
    },
    dispose() {
      disposeObject(scene);
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
