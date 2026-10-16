// 动作测试（不进时间轴）：秤砣的几个关键姿势并排（跑、站着抬头、蹲下攒劲、起跳伸手、落地、单膝跪着递砖）。t = 0 正面，1 侧面。
import * as THREE from "three";
import type { Scene, SceneOptions } from "@frame/engine/types";
import { disposeObject } from "@frame/engine/three-assets";
import { express, setOutlineResolution } from "../rig3d/vrm";
import { Puppet } from "../rig3d/puppet";
import { buildChengtuo } from "../cast3d/chengtuo";
import { POSES } from "../cast3d/moves";

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
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
  const p = new Puppet(ct.model, ct.footLift);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ color: 0xd9d0dc }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 50);
  const names = Object.keys(POSES);
  return {
    canvas: renderer.domElement,
    render(t) {
      renderer.setScissor(0, 0, width, height);
      renderer.clear();
      const side = Math.floor(t) % 2 === 1;
      const cols = 3, rows = Math.ceil(names.length / cols);
      const W = width / cols, H = height / rows;
      names.forEach((n, i) => {
        POSES[n](p, t);
        express(ct.model, {});
        ct.update(t);
        const x = (i % cols) * W, y = Math.floor(i / cols) * H;
        const vh = 2.6;
        cam.left = (-vh * (W / H)) / 2;
        cam.right = (vh * (W / H)) / 2;
        cam.top = vh / 2;
        cam.bottom = -vh / 2;
        const c = new THREE.Vector3(p.pos.x, 1.1, p.pos.z);
        cam.position.copy(c).add(side ? new THREE.Vector3(10, 0, 0) : new THREE.Vector3(0, 0, 10));
        cam.lookAt(c);
        cam.updateProjectionMatrix();
        setOutlineResolution(scene, W, H, 0.7);
        renderer.setViewport(x, height - y - H, W, H);
        renderer.setScissor(x, height - y - H, W, H);
        renderer.render(scene, cam);
      });
    },
    dispose() {
      disposeObject(scene);
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
