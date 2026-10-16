// 三维人物设定：秤砣和小石头（三渲二）。给用户审核用，也放在时间轴上（scenes/people.ts）。
// 0–8 秒：两个人并排慢慢转一圈；8–12 秒：秤砣的表情；12–16 秒：小石头的表情；16–22 秒：小石头穿上妈妈的橘色外套，再转一圈。
import * as THREE from "three";
import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { disposeObject } from "@frame/engine/three-assets";
import { pose, express, setOutlineResolution, bonePos, type PoseMap } from "../rig3d/vrm";
import { buildChengtuo, type Character3D } from "../cast3d/chengtuo";
import { buildXiaoshitou } from "../cast3d/xiaoshitou";

export const sample: Sample = { duration: 22 };

const STAND: PoseMap = {
  leftUpperArm: [0, 0, 1.25],
  rightUpperArm: [0, 0, -1.25],
  leftLowerArm: [0, -0.1, 0.06],
  rightLowerArm: [0, 0.1, -0.06],
  leftUpperLeg: [0, 0, -0.05],
  rightUpperLeg: [0, 0, 0.05],
  leftLowerLeg: [0, 0, 0.012],
  rightLowerLeg: [0, 0, -0.012],
};

const EXPR: { name: string; w: Record<string, number> }[] = [
  { name: "平静", w: {} },
  { name: "开心", w: { joy: 1 } },
  { name: "微笑", w: { fun: 1 } },
  { name: "难过", w: { sorrow: 1 } },
  { name: "生气", w: { angry: 1 } },
  { name: "吃惊", w: { surprised: 1 } },
  { name: "闭眼", w: { blink: 1 } },
  { name: "哭着笑", w: { sorrow: 0.7, joy: 0.45 } },
];

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setScissorTest(true);
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xdfe3ff, 1.35));
  const key = new THREE.DirectionalLight(0xfff4e6, 1.9);
  key.position.set(-1.5, 2.5, 3);
  scene.add(key);
  const [ct, xs] = await Promise.all([buildChengtuo(), buildXiaoshitou()]);
  const cast: Character3D[] = [ct, xs];
  for (const c of cast) {
    scene.add(c.model.root);
    pose(c.model, STAND);
    express(c.model, {});
  }
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 50);
  const persp = new THREE.PerspectiveCamera(18, width / height, 0.1, 50);
  const S = Math.min(width / 1080, height / 1920);

  const view = (x: number, y: number, w: number, h: number) => {
    renderer.setViewport(x, height - y - h, w, h);
    renderer.setScissor(x, height - y - h, w, h);
  };
  const label = (text: string, x: number, y: number, size: number, color = "#3a3442", weight = 600) => {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${Math.round(size * S)}px "Noto Serif CJK SC", "Noto Serif SC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x * S, y * S);
  };

  /** 两个人并排转一圈（period 秒一圈） */
  const turntable = (t: number, period = 8) => {
    const turn = (t / period) * Math.PI * 2;
    ct.model.root.position.set(-0.27, ct.footLift, 0);
    xs.model.root.position.set(0.3, xs.footLift, 0);
    for (const c of cast) {
      c.model.root.visible = true;
      c.model.root.rotation.y = -turn;
      c.update(t);
    }
    persp.aspect = width / height;
    persp.position.set(0, 0.95, 7.6);
    persp.lookAt(0, 0.86, 0);
    persp.updateProjectionMatrix();
    setOutlineResolution(scene, width, height);
    view(0, 0, width, height);
    renderer.render(scene, persp);
  };

  /** 一格头部特写 */
  const face = (x: number, y: number, w: number, h: number, c: Character3D, e: Record<string, number>, t: number) => {
    for (const o of cast) o.model.root.visible = o === c;
    c.model.root.position.set(0, c.footLift, 0);
    c.model.root.rotation.y = -0.3;
    c.update(t);
    express(c.model, e);
    c.model.root.updateWorldMatrix(true, true);
    const hp = bonePos(c.model, "head");
    const k = c === xs ? 1.05 : 0.9;
    const viewH = 0.4 * k;
    const aspect = w / h;
    ortho.left = (-viewH * aspect) / 2;
    ortho.right = (viewH * aspect) / 2;
    ortho.top = viewH / 2;
    ortho.bottom = -viewH / 2;
    ortho.position.set(hp.x, hp.y + 0.05 * k, 10);
    ortho.lookAt(hp.x, hp.y + 0.05 * k, 0);
    ortho.updateProjectionMatrix();
    setOutlineResolution(scene, w, h, 0.9 * S);
    view(x, y, w, h);
    renderer.render(scene, ortho);
    express(c.model, {});
    for (const o of cast) o.model.root.visible = true;
  };

  const faces = (c: Character3D, title: string, t: number) => {
    const W = width / 2, H = (height * 0.88) / 4, top = height * 0.1;
    EXPR.forEach((e, i) => face((i % 2) * W, top + Math.floor(i / 2) * H, W, H, c, e.w, t));
    return { title, W, H, top };
  };

  return {
    canvas,
    render(t) {
      renderer.setScissor(0, 0, width, height);
      renderer.clear();
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, "#f6f1ea");
      g.addColorStop(1, "#e8e0d6");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      xs.setWear({ coat: t >= 16 });
      if (t < 8 || t >= 16) {
        turntable(t < 8 ? t : t - 16, t < 8 ? 8 : 6);
        ctx.drawImage(renderer.domElement, 0, 0);
        label("秤砣", 395, 1700, 54);
        label("19 岁 · 扫天的", 395, 1765, 30, "#6b6372", 400);
        label("小石头", 805, 1700, 54);
        label(t < 8 ? "7 岁" : "穿上妈妈的橘色外套（44 秒起）", t < 8 ? 805 : 760, 1765, 30, "#6b6372", 400);
        return;
      }
      const kid = t >= 12;
      const info = faces(kid ? xs : ct, kid ? "小石头 · 表情" : "秤砣 · 表情", t);
      ctx.drawImage(renderer.domElement, 0, 0);
      label(info.title, 540, 100, 50);
      EXPR.forEach((e, i) => {
        const cx = ((i % 2) + 0.5) * info.W, cy = info.top + (Math.floor(i / 2) + 1) * info.H - 26 * S;
        ctx.fillStyle = "rgba(246,241,234,0.85)";
        ctx.fillRect(cx - 70 * S, cy - 22 * S, 140 * S, 44 * S);
        label(e.name, cx / S, cy / S, 28, "#3a3442", 500);
      });
    },
    dispose() {
      disposeObject(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.width = canvas.height = 1;
    },
  };
}
