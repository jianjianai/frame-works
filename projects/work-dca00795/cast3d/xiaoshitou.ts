// 小石头（7 岁，男孩，三渲二）：身体、脸和骨架用 VRoid 样例模型「HairSample_Male」（CC0）。
// 成年男性 → 7 岁男孩：整个人缩小，头放大，腿缩短；眼睛稍微睁大、下半张脸收短（小孩的脸）；刘海剪短，露出眼睛。
// 服装按剧情设计（2026-10-16，「妈妈手缝的」）：
// - 豆绿小棉袄：横着一道道绗线、立领、一排布扣；右胳膊肘打着一块橘色补丁（用妈妈那件外套的布）。
// - 棕色灯芯绒长裤，左膝打补丁，裤脚卷起一道。
// - 黑布鞋，钉着铁鞋底（城里人人穿铁底鞋）。右脚踝一根红绳拴着小铜铃（听得见铃声，孩子就还在地上）。
// - 44 秒以后穿妈妈那件橘色大外套（setWear({ coat: true })）：大到拖到小腿、袖子盖住手，下摆缝着一圈铅块。
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { loadVRM, toonify, hide, colorize, setBaseMorphs, express, type VRMModel } from "../rig3d/vrm";
import { bodySource, shellGarment, bandGarment, hullRing, spanRing, grow, envelope, folds, rigidPart, type Ring } from "../rig3d/garment";
import type { Character3D } from "./chengtuo";

export const SRC = "films/work-dca00795/models/HairSample_Male.glb";

/** 小孩的比例 */
const KID = { root: 0.62, head: 1.42, neck: 1.08, leg: 0.75, arm: 1.0, shoulder: 0.86 };
const HIP_Y = 0.964; // 大腿根（腿从这里缩）

const TORSO = /Hips|Spine|Chest|Shoulder|Neck/;
const C = {
  green: "#93b07f",
  greenDark: "#6f8c60",
  greenLine: "#4f6744",
  patch: "#e58e3c",
  button: "#efe6d2",
  cord: "#c0402f",
  brown: "#8b6a4e",
  brownDark: "#735640",
  brownLight: "#a98a6a",
  shoe: "#2a272e",
  iron: "#77717d",
  ironDark: "#55505b",
  brass: "#d4a548",
  brassDark: "#8f6a26",
  hair: "#1d1b22",
  hairLight: "#4a4856",
  coat: "#e58e3c",
  coatDark: "#c4722d",
  coatLine: "#8a4a1c",
  coatLining: "#f3c690",
  coatButton: "#6b4a2f",
  lead: "#7b736f",
};

function smooth(x: number) {
  const v = Math.min(1, Math.max(0, x));
  return v * v * (3 - 2 * v);
}

/**
 * 小孩的脸：眼睛以下往上收（下半张脸短一点），下巴两边稍微放宽（圆一点）。
 * 脸上几块网格（皮肤、嘴、睫毛……）共用同一份顶点，每份顶点只改一次。
 */
function childFace(m: VRMModel, y0: number, k: number, widen: number) {
  const done = new Set<THREE.BufferAttribute>();
  for (const mesh of m.meshes) {
    const n = (mesh.material as THREE.Material).name;
    if (!/_FACE$|Face_00_SKIN/.test(n)) continue;
    const pos = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
    if (done.has(pos)) continue;
    done.add(pos);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i), z = pos.getZ(i);
      if (y >= y0 || z > 0.04) continue;
      const d = y0 - y;
      pos.setY(i, y0 - d * k);
      pos.setX(i, pos.getX(i) * (1 + widen * smooth(d / 0.06)));
    }
    pos.needsUpdate = true;
  }
  for (const mesh of m.meshes) if (/_FACE$|Face_00_SKIN/.test((mesh.material as THREE.Material).name)) mesh.geometry.computeBoundingSphere();
}

export interface Kid3D extends Character3D {
  /** 穿什么：coat 妈妈的橘色大外套 */
  setWear(w: { coat?: boolean }): void;
}

export async function buildXiaoshitou(): Promise<Kid3D> {
  const model = await loadVRM(SRC);
  toonify(model, { outline: 2.0 });
  hide(model, (n) => /Tops|Bottoms|Shoes|Accessory/.test(n));
  colorize(model, (n) => /HAIR/.test(n), C.hair, C.hairLight, 0.1, 0.6);
  colorize(model, (n) => /EyeIris/.test(n), "#1e1614", "#7a5644", 0.05, 0.75);
  // 眼线、睫毛不用纯黑（小孩的眼睛软一点）
  colorize(model, (n) => /FaceEyeline|FaceEyelash/.test(n), "#3a2a26", "#8a6a5e", 0.05, 0.9);
  childFace(model, 1.592, 0.88, 0.05);
  setBaseMorphs(model, { Fcl_EYE_Surprised: 0.3 });
  express(model, {});
  // 刘海剪短（妈妈剪的）：正中那一缕往回收，两边的稍微短一点
  model.root.traverse((o) => {
    if (o.name.includes("82c4c5e8")) o.scale.setScalar(0.6);
    if (o.name.includes("49aba0e8") || o.name.includes("bc61f9e8")) o.scale.setScalar(0.85);
  });

  const src = bodySource(model);
  const ax = (p: THREE.Vector3) => Math.abs(p.x);
  const torso = (b: string) => TORSO.test(b);

  // ---------------------------------------------------------------- 灯芯绒长裤
  const CORD = `
    float lx = rp.x < 0.0 ? -0.075 : 0.075;
    float ang = atan(rp.z - 0.005, rp.x - lx);
    col = fract(ang * 9.0) < 0.38 ? uC1 : uC0;
    if (rp.y > 0.93) col = fract(rp.x * 140.0) < 0.38 ? uC1 : uC0;
  `;
  shellGarment(src, {
    name: "trousers",
    select: (p, b) => (/Hips/.test(b) && p.y < 1.0) || (/UpperLeg/.test(b) && p.y > 0.86),
    offset: () => 0.01,
    colors: [C.brown, C.brownDark],
    paint: CORD,
  });
  // 裤腿：宽松的直筒（小孩的裤子不贴腿），左膝打补丁
  for (const L of [true, false]) {
    const leg = (b: string) => (L ? /L_(UpperLeg|LowerLeg)/ : /R_(UpperLeg|LowerLeg)/).test(b);
    const r0 = hullRing(src, 0.6, leg, 32);
    const c0 = { cx: r0.cx, cz: r0.cz };
    const at = (y: number, a: number, b2: number, m: number) => grow(spanRing(src, y, a, b2, leg, 32, c0), y, 1, m);
    bandGarment(src, [
      at(0.9, 0.86, 0.92, 0.006),
      at(0.86, 0.78, 0.9, 0.016),
      at(0.7, 0.6, 0.78, 0.02),
      at(0.55, 0.45, 0.62, 0.024),
      at(0.38, 0.3, 0.45, 0.026),
      at(0.19, 0.16, 0.3, 0.026),
    ], {
      name: "trouserLeg",
      colors: [C.brown, C.brownDark, C.brownLight],
      paint: CORD + `
        vec2 q = vec2(rp.x + 0.07, rp.y - 0.575);
        if (rp.z < -0.02 && abs(q.x) < 0.042 && abs(q.y) < 0.048) {
          col = uC2;
          float e = min(0.042 - abs(q.x), 0.048 - abs(q.y));
          if (e < 0.004 && fract((q.x + q.y) * 90.0) < 0.5) col = uC1;
        }
      `,
    }, leg);
  }
  // 卷起来的裤脚
  for (const L of [true, false]) {
    const leg = (b: string) => (L ? /L_LowerLeg/ : /R_LowerLeg/).test(b);
    const r0 = hullRing(src, 0.17, leg, 32);
    const c0 = { cx: r0.cx, cz: r0.cz };
    const at = (y: number, m: number) => grow(spanRing(src, y, y - 0.02, y + 0.02, leg, 32, c0), y, 1, m);
    bandGarment(src, [at(0.2, 0.024), at(0.195, 0.036), at(0.152, 0.036), at(0.147, 0.024)], {
      name: "trouserCuff",
      colors: [C.brownLight, C.brownDark],
      paint: `if (abs(rp.y - 0.17) < 0.0015) col = uC1;`,
    }, leg);
  }

  // ---------------------------------------------------------------- 豆绿小棉袄
  // 绗线：身上横着一道道，袖子上绕着胳膊一道道；正中一排布扣
  const QUILT = `
    bool front = rp.z < -0.02;
    bool arm = abs(rp.x) > 0.16 && rp.y > 1.33;
    if (!arm && abs(fract((rp.y - 0.93) / 0.055) - 0.5) > 0.465) col = uC1;
    if (arm && abs(fract((abs(rp.x) - 0.1) / 0.055) - 0.5) > 0.465) col = uC1;
    if (front && !arm && abs(rp.x) < 0.0022) col = uC2;
    for (int i = 0; i < 4; i++) {
      vec2 q = vec2(rp.x, rp.y - (1.39 - float(i) * 0.105));
      if (front && length(q) < 0.0085) col = uC3;
      if (front && abs(length(q) - 0.0085) < 0.0013) col = uC2;
    }
  `;
  shellGarment(src, {
    name: "jacket",
    select: (p, b) => (torso(b) && p.y > 1.265 && !(/Neck/.test(b) && p.y > 1.428)) || /Shoulder|UpperArm/.test(b) || (/LowerArm/.test(b) && ax(p) < 0.592),
    offset: (p, b) => (/Arm/.test(b) ? 0.016 + 0.004 * smooth((ax(p) - 0.3) / 0.2) : 0.016),
    colors: [C.green, C.greenDark, C.greenLine, C.button, C.patch],
    paint: QUILT + `
      // 右胳膊肘的橘色补丁（妈妈外套的布）
      vec2 pe = vec2(rp.x - 0.37, rp.z - 0.03);
      if (rp.x > 0.0 && abs(pe.x) < 0.035 && rp.z > 0.0) {
        col = uC4;
        if (0.035 - abs(pe.x) < 0.004 && fract(rp.y * 120.0) < 0.5) col = uC2;
      }
    `,
  });
  const jb = (b: string) => torso(b) || /UpperLeg/.test(b);
  const jc = hullRing(src, 1.15, torso);
  const jctr = { cx: jc.cx, cz: jc.cz };
  const js = (y: number, a: number, b2: number) => spanRing(src, y, a, b2, jb, 48, jctr);
  bandGarment(src, [
    grow(js(1.3, 1.26, 1.3), 1.3, 1, 0.006),
    ...envelope([
      grow(js(1.27, 1.2, 1.3), 1.27, 1, 0.025),
      grow(js(1.15, 1.06, 1.27), 1.15, 1, 0.028),
      grow(js(1.03, 0.97, 1.15), 1.03, 1, 0.03),
      grow(js(0.93, 0.92, 1.03), 0.93, 1.03, 0.033),
    ]),
  ], {
    name: "jacketBody",
    colors: [C.green, C.greenDark, C.greenLine, C.button],
    paint: QUILT + `if (rp.y < 0.95) col = uC1;`,
  }, jb);
  // 立领
  const neck = (b: string) => /Neck|UpperChest|Shoulder/.test(b);
  const nr = hullRing(src, 1.43, neck);
  const jacketCollar = bandGarment(src, [grow(nr, 1.472, 1, 0.009), grow(nr, 1.467, 1, 0.017), grow(nr, 1.414, 1, 0.026), grow(nr, 1.408, 1, 0.018)], {
    name: "jacketCollar",
    colors: [C.greenDark, C.greenLine],
    paint: `if (rp.y > 1.46) col = uC1;`,
  }, neck);
  // 袖口
  for (const L of [true, false]) {
    const sx = L ? -1 : 1;
    const arm = (b: string) => (L ? /L_(LowerArm|Hand)/ : /R_(LowerArm|Hand)/).test(b);
    const c0 = hullRing(src, sx * 0.585, arm, 24, undefined, "x");
    const ctr = { cx: c0.cx, cz: c0.cz };
    const at = (x: number, m: number) => grow(spanRing(src, sx * x, sx * (x - 0.012), sx * (x + 0.012), arm, 24, ctr, "x"), sx * x, 1, m);
    bandGarment(src, [at(0.568, 0.014), at(0.572, 0.024), at(0.596, 0.024), at(0.6, 0.014)], {
      name: "jacketCuff",
      colors: [C.greenDark, C.greenLine],
      paint: ``,
    }, arm);
  }

  // ---------------------------------------------------------------- 铁底黑布鞋
  shellGarment(src, {
    name: "shoes",
    select: (p, b) => /Foot|Toe/.test(b) && p.y < 0.085,
    offset: () => 0.007,
    colors: [C.shoe],
    paint: ``,
  });
  for (const L of [true, false]) {
    const foot = model.bones.get(L ? "leftFoot" : "rightFoot")!;
    const sx = L ? -1 : 1;
    const sole = new RoundedBoxGeometry(0.1, 0.024, 0.27, 2, 0.008);
    sole.translate(sx * 0.052, 0.008, -0.043);
    rigidPart(model, foot, sole, {
      colors: [C.iron, C.ironDark, "#c9c3cc"],
      paint: `
        col = mix(uC1, uC0, smoothstep(-0.004, 0.02, rp.y));
        vec2 q = vec2(fract(rp.z / 0.045) - 0.5, abs(rp.x) - 0.052);
        if (rp.y > 0.012 && abs(abs(q.y) - 0.04) < 0.006 && abs(q.x) < 0.12) col = uC2;
      `,
    });
  }
  // 右脚踝：红绳 + 小铜铃（拴在卷起的裤脚上面）
  {
    const leg = model.bones.get("rightLowerLeg")!;
    const ar = hullRing(src, 0.21, (b) => /R_LowerLeg/.test(b), 24);
    const rr = Math.max(...ar.r) + 0.016;
    const cordGeo = new THREE.TorusGeometry(rr, 0.0055, 6, 28);
    cordGeo.rotateX(Math.PI / 2);
    cordGeo.translate(ar.cx, 0.212, ar.cz);
    rigidPart(model, leg, cordGeo, { colors: [C.cord], paint: ``, outline: 1.4 });
    const bx = ar.cx + rr + 0.009, by = 0.196, bz = ar.cz - 0.006;
    const bell = new THREE.SphereGeometry(0.016, 16, 12);
    bell.translate(bx, by, bz);
    rigidPart(model, leg, bell, {
      colors: [C.brass, C.brassDark],
      paint: `
        vec3 c = rp - vec3(${bx.toFixed(4)}, ${by.toFixed(4)}, ${bz.toFixed(4)});
        if (c.y < -0.003 && abs(c.x) < 0.0022) col = uC1;
        if (abs(c.y + 0.002) < 0.0016) col = uC1;
      `,
      outline: 1.4,
    });
  }

  // ---------------------------------------------------------------- 妈妈的橘色大外套（穿上以后盖住小棉袄）
  const coat: THREE.Object3D[] = [];
  {
    const COAT = `
      bool front = rp.z < -0.02;
      if (!gl_FrontFacing) col = uC3;
      if (gl_FrontFacing && front && abs(rp.x - 0.02) < 0.0025 && rp.y < 1.42) col = uC2;   // 门襟
      for (int i = 0; i < 3; i++) {
        vec2 q = vec2(rp.x - 0.045, rp.y - (1.3 - float(i) * 0.16));
        if (gl_FrontFacing && front && length(q) < 0.014) col = uC4;
        if (gl_FrontFacing && front && abs(length(q) - 0.014) < 0.0018) col = uC2;
      }
    `;
    const coatShell = shellGarment(src, {
      name: "coat",
      select: (p, b) => (torso(b) && p.y > 1.33 && !(/Neck/.test(b) && p.y > 1.432)) || /Shoulder|UpperArm|LowerArm/.test(b),
      offset: (p, b) => (/Arm/.test(b) ? 0.036 + 0.01 * smooth((ax(p) - 0.3) / 0.3) : 0.034),
      colors: [C.coat, C.coatDark, C.coatLine, C.coatLining, C.coatButton],
      paint: COAT,
    });
    coat.push(coatShell);
    // 衣身：从肩膀下面直到小腿，越往下越张开
    const cb = (b: string) => torso(b) || /UpperLeg|LowerLeg/.test(b);
    const cs = (y: number, a: number, b2: number) => spanRing(src, y, a, b2, cb, 48, jctr);
    const coatRings: Ring[] = [
      grow(cs(1.38, 1.34, 1.4), 1.38, 1, 0.022),
      ...envelope([
        grow(cs(1.33, 1.25, 1.38), 1.33, 1, 0.045),
        grow(cs(1.18, 1.05, 1.33), 1.18, 1, 0.05),
        grow(cs(1.0, 0.9, 1.18), 1.0, 1, 0.055),
        grow(cs(0.78, 0.7, 1.0), 0.78, 1.06, 0.062),
        grow(cs(0.58, 0.5, 0.78), 0.58, 1.13, 0.07),
        grow(cs(0.47, 0.42, 0.58), 0.47, 1.18, 0.076),
      ]).map((r, i) => folds(r, 6, [0, 0, 0.004, 0.012, 0.022, 0.03][i], 0.4)),
    ];
    // 下摆缝着一圈铅块：最下面加一道厚边，一块一块鼓起来
    const last = coatRings[coatRings.length - 1];
    const lumps = (ring: Ring, amp: number): Ring => ({
      ...ring,
      r: ring.r.map((v, s) => v + amp * Math.max(0, Math.sin((s / (ring.r.length - 1)) * Math.PI * 2 * 10)) ** 0.6),
    });
    coatRings.push(grow(last, 0.465, 1, 0.004), lumps(grow(last, 0.455, 1, 0.01), 0.02), lumps(grow(last, 0.41, 1, 0.01), 0.02), grow(last, 0.4, 1, -0.006));
    const coatBody = bandGarment(src, coatRings, {
      name: "coatBody",
      colors: [C.coat, C.coatDark, C.coatLine, C.coatLining, C.coatButton, C.lead],
      paint: COAT + `
        if (gl_FrontFacing && rp.y < 0.462) {
          float a = atan(rp.z - ${jctr.cz.toFixed(4)}, rp.x - ${jctr.cx.toFixed(4)});
          float u = fract(a / 6.2831853 * 10.0);
          col = uC1;
          if (u < 0.5) col = mix(uC1, uC5, 0.35);                         // 鼓起来的铅块
          if (abs(u - 0.5) < 0.02 || u < 0.02 || u > 0.98) col = uC2;     // 铅块之间的缝线
        }
        if (gl_FrontFacing && abs(rp.y - 0.462) < 0.0016) col = uC2;
      `,
    }, cb, { skirtBelow: 0.95, legFollow: 0.5 });
    (coatBody.material as THREE.Material).side = THREE.DoubleSide;
    coat.push(coatBody);
    // 大翻领
    const cn = hullRing(src, 1.44, (b) => /Neck/.test(b));
    coat.push(
      bandGarment(src, [grow(cn, 1.476, 1, 0.02), grow(cn, 1.47, 1, 0.03), grow(cn, 1.41, 1.06, 0.058), grow(cn, 1.403, 1.06, 0.054)], {
        name: "coatCollar",
        colors: [C.coat, C.coatLine, C.coatLining],
        paint: `if (rp.y < 1.405) col = uC1; if (!gl_FrontFacing) col = uC2;`,
      }, neck, { open: { at: Math.PI * 1.5, half: [0.4, 0.45, 0.7, 0.7] } }),
    );
    // 袖子太长，盖住手：手腕往外再接一截袖筒
    for (const L of [true, false]) {
      const sx = L ? -1 : 1;
      const arm = (b: string) => (L ? /L_(LowerArm|Hand|Index|Middle|Ring|Little|Thumb)/ : /R_(LowerArm|Hand|Index|Middle|Ring|Little|Thumb)/).test(b);
      const c0 = hullRing(src, sx * 0.59, arm, 24, undefined, "x");
      const ctr = { cx: c0.cx, cz: c0.cz };
      const base = grow(spanRing(src, sx * 0.59, sx * 0.55, sx * 0.62, arm, 24, ctr, "x"), sx * 0.56, 1, 0.046);
      const ext = bandGarment(src, [base, { ...grow(base, sx * 0.7, 1.04, 0.004), y: sx * 0.7 }, { ...grow(base, sx * 0.79, 1.08, 0.008), y: sx * 0.79 }, { ...grow(base, sx * 0.795, 1.0, 0.0), y: sx * 0.795 }], {
        name: "coatSleeveEnd",
        colors: [C.coat, C.coatDark, C.coatLine],
        paint: `if (!gl_FrontFacing) col = uC2; if (abs(rp.x) > 0.775) col = uC1;`,
      }, arm);
      (ext.material as THREE.Material).side = THREE.DoubleSide;
      coat.push(ext);
    }
  }
  const setWear = (w: { coat?: boolean }) => {
    for (const m of coat) {
      m.visible = !!w.coat;
      if (m.userData.outline) m.userData.outline.visible = !!w.coat;
    }
    // 穿上外套时，小棉袄的立领收在外套领子里面
    jacketCollar.visible = !w.coat;
    if (jacketCollar.userData.outline) jacketCollar.userData.outline.visible = !w.coat;
  };
  setWear({ coat: false });

  // ---------------------------------------------------------------- 小孩的比例
  model.root.children[0].scale.setScalar(KID.root);
  const b = model.bones;
  b.get("head")!.scale.setScalar(KID.head);
  b.get("neck")!.scale.setScalar(KID.neck);
  for (const n of ["leftUpperLeg", "rightUpperLeg"]) b.get(n)!.scale.setScalar(KID.leg);
  // 肩膀收窄（成年男人的肩太宽）：肩骨缩小，胳膊再放回原来的大小
  for (const n of ["leftShoulder", "rightShoulder"]) b.get(n)?.scale.setScalar(KID.shoulder);
  for (const n of ["leftUpperArm", "rightUpperArm"]) b.get(n)!.scale.setScalar(KID.arm / KID.shoulder);

  const update = (_t: number, _opts: { float?: number; wind?: THREE.Vector3 } = {}) => {};
  // 铁鞋底的底面在模型坐标 −0.004；腿从大腿根缩过、整个人又缩过：鞋底离原点多高，就往下放多少
  const soleY = (HIP_Y - (HIP_Y + 0.004) * KID.leg) * KID.root;
  return { model, update, footLift: -soleY, setWear };
}
