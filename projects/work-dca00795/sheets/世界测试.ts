// 世界测试（不进时间轴）：城、天、白、落灰。t = 页码：0 街上平视，1 街上抬头，2 升到高处看全城，3 白底下（开场）。
import * as THREE from "three";
import type { Scene, SceneOptions } from "@frame/engine/types";
import { disposeObject } from "@frame/engine/three-assets";
import { generateCity, buildingsMesh, HERO_TOWER, WHITE_Y } from "../world/city";
import { createSky } from "../world/sky";
import { createAsh } from "../world/ash";
import { DAY } from "../world/palette";
import { setOutlineResolution } from "../rig3d/vrm";

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const mood = DAY;
  scene.fog = new THREE.FogExp2(new THREE.Color(mood.haze), mood.fog);
  const hemi = new THREE.HemisphereLight(mood.hemiSky, mood.hemiGround, mood.hemi);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(mood.sun, mood.sunI);
  sun.position.set(-0.4, 1, 0.5);
  scene.add(sun);
  const city = buildingsMesh(generateCity(7), mood);
  scene.add(city.group);
  const sky = createSky(mood);
  scene.add(sky.group);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshToonMaterial({ color: "#c9bfd2" }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const ashNear = createAsh(1400, [40, 40, 40], 60, 3);
  const ashFar = createAsh(1600, [260, 260, 260], 140, 9);
  scene.add(ashNear.points, ashFar.points);
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 9000);
  const views: [THREE.Vector3, THREE.Vector3, number][] = [
    [new THREE.Vector3(30, 1.7, 3), new THREE.Vector3(-30, 6, -2), 40],
    [new THREE.Vector3(4, 1.6, 2), new THREE.Vector3(-10, 120, -30), 55],
    [new THREE.Vector3(70, 160, 330), new THREE.Vector3(HERO_TOWER.x, 150, HERO_TOWER.z), 42],
    [new THREE.Vector3(0, WHITE_Y - 14, 40), new THREE.Vector3(0, WHITE_Y - 12, 0), 40],
  ];
  return {
    canvas: renderer.domElement,
    render(t) {
      const [pos, look, fov] = views[Math.min(views.length - 1, Math.floor(t))];
      camera.fov = fov;
      camera.aspect = width / height;
      camera.position.copy(pos);
      camera.lookAt(look);
      camera.updateProjectionMatrix();
      sky.update(camera);
      ashNear.update(t, camera, width / 1080);
      ashFar.update(t, camera, width / 1080);
      setOutlineResolution(scene, width, height);
      renderer.render(scene, camera);
    },
    dispose() {
      disposeObject(scene);
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
