// 秤砣（19 岁，扫天的，三渲二）：身体、脸和骨架用 VRoid 样例模型「千駄ヶ谷篠」（全部允许使用、可修改）。
// 服装按剧情设计（2026-10-16 第三版，不再参考罗小黑）：
// - 藏青帆布工作外套：敞着怀，宽宽大大到大腿，袖子挽到小臂，胯两边两个大贴袋；左胸口袋插着那支两块五的圆珠笔；
//   左臂一圈红袖标，黄字「扫天」——一眼看出她是干什么的。
// - 里面米白粗针毛衣（敞开的衣襟和挽起的袖子里露出来），芥末黄长围巾绕脖子一圈、两头垂在胸前：失重时往上飘，人链里一眼认得出。
// - 炭灰工装裤塞进一双大得不像话的铁靴（靴口露出写着「活下去」的砖）。
// - 黑色长发在肩胛骨的位置用锈红色的绳松松扎住（妈妈的颜色）。
import * as THREE from "three";
import { loadVRM, toonify, hide, colorize, toBone, type VRMModel } from "../rig3d/vrm";
import { bodySource, shellGarment, bandGarment, hullRing, spanRing, grow, envelope, slicePoints, rigidPart, type Ring } from "../rig3d/garment";
import { Tube, hangChain } from "../rig3d/parts";
import { hairChain, aimChain } from "../rig3d/hairchain";
import { wearBoots, BOOT_SOLE } from "./boots";

export const SRC = "films/work-dca00795/models/Sendagaya_Shino.glb";

const TORSO = /Hips|Spine|Chest|Bust|Shoulder|Neck/;
const C = {
  coat: "#3b4769",
  coatDark: "#2a3350",
  coatLine: "#1f2538",
  coatInner: "#56628a",
  knit: "#efe6d4",
  knitDark: "#d9ccb4",
  scarf: "#dba63d",
  scarfDark: "#bf8b2b",
  pants: "#4a4652",
  armband: "#b8392e",
  armText: "#f4cf4f",
  hair: "#1c1a24",
  hairLight: "#4b4a5c",
  cord: "#b8432f",
};

export interface Character3D {
  model: VRMModel;
  /** 秤砣的铁靴（左、右）：可以拿掉靴口的砖、把整双靴子脱下来 */
  boots?: ReturnType<typeof wearBoots>;
  /** 每帧调用：t 时间、float 失重 0..1、wind 世界坐标的风（被速度往后拖） */
  update(t: number, opts?: { float?: number; wind?: THREE.Vector3 }): void;
  /** 脚底离模型原点的高度（靴底往下推出来的那一截），站在地上时 root.position.y 加上它 */
  footLift: number;
}

/** 红袖标上的字 */
function armbandTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = C.armband;
  g.fillRect(0, 0, 256, 128);
  g.fillStyle = C.armText;
  g.font = `900 92px "Noto Sans CJK SC", "Noto Sans SC", "Noto Serif CJK SC", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("扫天", 128, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** 身体正面在 (x, y) 处最靠前的 z（静止姿势；身体朝 −z） */
function frontZ(src: ReturnType<typeof bodySource>, x: number, y: number, test: (b: string) => boolean) {
  let best = 0;
  for (const [px, pz] of slicePoints(src, y, test)) if (Math.abs(px - x) < 0.012 && pz < best) best = pz;
  return best;
}

export async function buildChengtuo(): Promise<Character3D> {
  const model = await loadVRM(SRC);
  toonify(model, { outline: 2.0 });
  // 原来的校服、鞋、发夹拿掉
  hide(model, (n) => /Tops|Accessory|Bottoms|Shoes/.test(n) || /HAIR_02/.test(n));
  colorize(model, (n) => /HAIR/.test(n), C.hair, C.hairLight, 0.08, 0.55);
  // 深色虹膜（原来是琥珀色）；涂了黑指甲油的指甲改回肉色
  colorize(model, (n) => /EyeIris/.test(n), "#1e1614", "#7a5644", 0.05, 0.75);
  colorize(model, (n) => /Body_00_SKIN/.test(n), "#000000", "#000000", 0, 1, { below: 0.3, color: "#efc4b4" });

  const src = bodySource(model);
  const ax = (p: THREE.Vector3) => Math.abs(p.x);
  const torso = (b: string) => TORSO.test(b);
  // 胸前收一点（宽松的外套里）
  model.root.traverse((o) => {
    if (/Bust1/.test(o.name)) o.scale.set(0.9, 0.9, 0.55);
  });

  // ---------------------------------------------------------------- 裤子
  shellGarment(src, {
    name: "pants",
    select: (p, b) => (/Hips/.test(b) && p.y < 0.97) || /UpperLeg/.test(b) || (/LowerLeg/.test(b) && p.y > 0.12),
    offset: (p) => 0.007 + 0.009 * smooth((p.y - 0.45) / 0.3) * (1 - smooth((p.y - 0.8) / 0.1)),
    colors: [C.pants, "#3c3943"],
    paint: `if (abs(rp.x) < 0.004 && rp.z < 0.0 && rp.y > 0.86) col = uC1;`,
  });

  // ---------------------------------------------------------------- 毛衣（只做露出来的地方：敞开的衣襟里、挽起的袖子下面）
  // 粗针毛衣的竖罗纹：按位置画直的竖条（按法线画会在胸前扭成波纹）
  const KNIT = `
    col = fract(atan(rp.z, rp.x) * 10.5) < 0.5 ? uC0 : uC1;
  `;
  shellGarment(src, {
    name: "sweater",
    select: (p, b) => torso(b) && p.y > 0.95 && p.y < 1.21,
    offset: () => 0.005,
    colors: [C.knit, C.knitDark],
    paint: KNIT,
  });
  // 毛衣下摆：直筒，到胯，一道罗纹边
  const sweaterRings = envelope([
    grow(spanRing(src, 1.0, 0.98, 1.02, torso, 48), 1.0, 1, 0.009),
    grow(spanRing(src, 0.92, 0.88, 1.0, (b) => torso(b) || /UpperLeg/.test(b), 48), 0.92, 1, 0.013),
    grow(spanRing(src, 0.86, 0.85, 0.92, (b) => torso(b) || /UpperLeg/.test(b), 48), 0.86, 1, 0.015),
  ]);
  bandGarment(src, sweaterRings, {
    name: "sweaterHem",
    colors: [C.knit, C.knitDark],
    paint: KNIT + `if (rp.y < 0.885) col = fract(atan(rp.z, rp.x) * 21.0) < 0.5 ? uC0 : uC1;`,
  }, (b) => torso(b) || /UpperLeg/.test(b));
  // 毛衣袖子：挽起的外套袖口下面到手腕，手腕一圈罗纹
  shellGarment(src, {
    name: "sweaterSleeve",
    select: (p, b) => /LowerArm|Hand/.test(b) && ax(p) > 0.37 && ax(p) < 0.536,
    offset: () => 0.006,
    colors: [C.knit, C.knitDark],
    paint: `
      float ang = atan(rn.z, rn.y);
      col = fract(ang * 10.5) < 0.5 ? uC0 : uC1;
    `,
  });
  for (const L of [true, false]) {
    const sx = L ? -1 : 1;
    const arm = (b: string) => (L ? /L_(LowerArm|Hand)/ : /R_(LowerArm|Hand)/).test(b);
    const c0 = hullRing(src, sx * 0.52, arm, 24, undefined, "x");
    const ctr = { cx: c0.cx, cz: c0.cz };
    const at = (x: number, m: number) => grow(spanRing(src, sx * x, sx * (x - 0.012), sx * (x + 0.012), arm, 24, ctr, "x"), sx * x, 1, m);
    bandGarment(src, [at(0.506, 0.006), at(0.51, 0.011), at(0.532, 0.011), at(0.536, 0.006)], {
      name: "cuffRib",
      colors: [C.knit, C.knitDark],
      paint: `col = fract(atan(rn.z, rn.y) * 3.3) < 0.5 ? uC0 : uC1;`,
    }, arm);
  }

  // ---------------------------------------------------------------- 外套
  // 衣襟在胸口开成一个 V：上身这一片（肩、胸、背）和身体贴着，前面开口里画成毛衣；往下是直筒、真的敞开的衣身
  const openW = `(0.018 + max(rp.y - 1.16, 0.0) * 0.26)`;
  const pocketTex = armbandTexture();
  shellGarment(src, {
    name: "coat",
    select: (p, b) =>
      (torso(b) && p.y > 1.115 && !(/Neck/.test(b) && p.y > 1.338)) || /UpperArm/.test(b) || (/Shoulder/.test(b)) || (/LowerArm/.test(b) && ax(p) < 0.418),
    offset: (p, b) => (/Arm/.test(b) ? 0.011 + 0.01 * smooth((ax(p) - 0.3) / 0.1) : 0.012),
    colors: [C.coat, C.coatDark, C.knit, C.knitDark, C.coatLine, C.armband, C.armText],
    textures: [pocketTex],
    paint: `
      bool front = rp.z < 0.0;
      float w = ${openW};
      float ex = abs(rp.x) - w;
      if (front && rp.y < 1.35 && ex < 0.0) {
        col = fract(rp.x * 105.0) < 0.5 ? uC2 : uC3;
        if (rp.y > 1.3) col = fract(rp.x * 210.0) < 0.5 ? uC2 : uC3;   // 领口罗纹
      }
      // 衣襟的边：一道深线
      if (front && rp.y < 1.35 && abs(ex) < 0.0032 * clamp(-rn.z, 0.3, 1.0) + 0.0008) col = uC4;
      // 左胸口袋（人物左边是 −x）：一圈明线，上面一道袋口
      vec2 pk = vec2(rp.x + 0.066, rp.y - 1.175);
      if (front && abs(pk.x) < 0.032 && abs(pk.y) < 0.046) {
        float e = min(0.032 - abs(pk.x), 0.046 - abs(pk.y));
        if (e < 0.0022) col = uC4;
        if (abs(pk.y - 0.036) < 0.0012) col = uC4;
      }
      // 肩线
      if (abs(abs(rp.x) - 0.118) < 0.0012 && rp.y > 1.25) col = uC1;
      // 左臂红袖标：一圈红布，外侧印黄字「扫天」
      if (rp.x < -0.18 && rp.x > -0.238) {
        col = uC5;
        float a = atan(rp.z - 0.003, rp.y - 1.296);
        vec2 uv = vec2((a + 1.45) / 1.6, (rp.x + 0.238) / 0.058);
        if (uv.x > 0.0 && uv.x < 1.0) col = texture2D(uT0, uv).rgb;
        if (abs(rp.x + 0.18) < 0.0015 || abs(rp.x + 0.238) < 0.0015) col = uC4;
      }
    `,
  });
  // 衣身：从胸口往下直筒，到大腿一半，前面敞开（越往下开得越大），胯两边两个大贴袋，下摆一道明线
  const body = (b: string) => torso(b) || /UpperLeg/.test(b);
  const cc = hullRing(src, 1.0, torso);
  const cctr = { cx: cc.cx, cz: cc.cz };
  const sr = (y: number, a: number, b2: number) => spanRing(src, y, a, b2, body, 48, cctr);
  const coatRings: Ring[] = [
    grow(sr(1.17, 1.12, 1.17), 1.17, 1, 0.006),
    ...envelope([
      grow(sr(1.14, 1.05, 1.17), 1.14, 1, 0.021),
      grow(sr(1.0, 0.93, 1.14), 1.0, 1, 0.025),
      grow(sr(0.86, 0.8, 1.0), 0.86, 1, 0.029),
      grow(sr(0.75, 0.7, 0.86), 0.75, 1.03, 0.033),
      grow(sr(0.64, 0.62, 0.75), 0.64, 1.06, 0.037),
    ]),
  ];
  const half = [0.12, 0.13, 0.17, 0.22, 0.28, 0.33];
  // 着色器里要知道衣身中心和开口的半角（按高度插值）
  const halfAt = `(rp.y > 1.0 ? mix(0.17, 0.13, (rp.y - 1.0) / 0.14) : rp.y > 0.86 ? mix(0.22, 0.17, (rp.y - 0.86) / 0.14) : rp.y > 0.75 ? mix(0.28, 0.22, (rp.y - 0.75) / 0.11) : mix(0.33, 0.28, (rp.y - 0.64) / 0.11))`;
  bandGarment(src, coatRings, {
    name: "coatBody",
    colors: [C.coat, C.coatDark, C.coatInner, C.coatLine],
    paint: `
      vec2 d = rp.xz - vec2(${cctr.cx.toFixed(4)}, ${cctr.cz.toFixed(4)});
      float r = length(d);
      float a = atan(d.y, d.x);              // 正前方是 -π/2
      float off = abs(a + 1.5707963);        // 离正前方多少弧度
      if (off > 3.1415926) off = 6.2831853 - off;
      float h = ${halfAt};
      if (!gl_FrontFacing) col = uC2;        // 衣服里子
      if (gl_FrontFacing && (off - h) * r < 0.004) col = uC3;   // 衣襟的边
      // 胯两边的大贴袋
      float pa = (off - 0.82) * r;
      if (gl_FrontFacing && abs(pa) < 0.055 && rp.y > 0.73 && rp.y < 0.87) {
        float e = min(0.055 - abs(pa), min(rp.y - 0.73, 0.87 - rp.y));
        if (e < 0.0022) col = uC3;
        if (abs(rp.y - 0.855) < 0.0012) col = uC3;
      }
      // 下摆明线
      if (gl_FrontFacing && abs(rp.y - 0.655) < 0.0011) col = uC3;
    `,
  }, body, { open: { at: Math.PI * 1.5, half }, skirtBelow: 0.9, legFollow: 0.55 });
  // 翻领：领口一圈往外翻下来，前面开着
  const neck = (b: string) => /Neck|UpperChest|Shoulder/.test(b);
  const nr = hullRing(src, 1.335, neck);
  bandGarment(src, [grow(nr, 1.352, 1, 0.01), grow(nr, 1.345, 1, 0.022), grow(nr, 1.312, 1.08, 0.04), grow(nr, 1.305, 1.08, 0.036)], {
    name: "collar",
    colors: [C.coat, C.coatLine],
    paint: `if (rp.y < 1.309) col = uC1;`,
  }, neck, { open: { at: Math.PI * 1.5, half: [0.55, 0.6, 0.85, 0.85] } });
  // 挽起来的袖口：小臂上一圈厚边
  for (const L of [true, false]) {
    const sx = L ? -1 : 1;
    const arm = (b: string) => (L ? /L_LowerArm/ : /R_LowerArm/).test(b);
    const c0 = hullRing(src, sx * 0.41, arm, 24, undefined, "x");
    const ctr = { cx: c0.cx, cz: c0.cz };
    const at = (x: number, m: number) => grow(spanRing(src, sx * x, sx * (x - 0.02), sx * (x + 0.02), arm, 24, ctr, "x"), sx * x, 1, m);
    bandGarment(src, [at(0.388, 0.014), at(0.393, 0.028), at(0.43, 0.028), at(0.435, 0.014)], {
      name: "rolledCuff",
      colors: [C.coat, C.coatInner, C.coatLine],
      paint: `
        float u = abs(rp.x);
        if (u > 0.404 && u < 0.416) col = uC1;
        if (abs(u - 0.404) < 0.0012 || abs(u - 0.416) < 0.0012) col = uC2;
      `,
    }, arm);
  }

  // ---------------------------------------------------------------- 围巾：脖子上绕一圈，两头垂在胸前
  const scarfRing = hullRing(src, 1.36, (b) => /Neck/.test(b), 32);
  bandGarment(src, [grow(scarfRing, 1.392, 1, 0.017), grow(scarfRing, 1.385, 1, 0.032), grow(scarfRing, 1.33, 1.05, 0.036), grow(scarfRing, 1.318, 1.05, 0.022)], {
    name: "scarfWrap",
    colors: [C.scarf, C.scarfDark],
    paint: `
      float t = fract(rp.y * 95.0 + atan(rp.z, rp.x) * 0.6);
      col = t < 0.45 ? uC0 : uC1;
    `,
  }, (b) => /Neck|UpperChest|Shoulder|Head/.test(b));
  // 垂下来的两头：贴着身体前面往下垂（胸前鼓出来的地方挂住，往下直直地垂）
  const chest = model.bones.get("upperChest") ?? model.bones.get("chest")!;
  const curve = (x: number, y0: number, y1: number, dz: number, n: number) => {
    const pts: THREE.Vector3[] = [];
    let z = 0;
    for (let i = 0; i <= n; i++) {
      const y = y0 + ((y1 - y0) * i) / n;
      z = Math.min(z, frontZ(src, x, y, torso) - dz);
      pts.push(toBone(model, chest, new THREE.Vector3(x + i * 0.0012, y, z)));
    }
    return pts;
  };
  const tailRest = [curve(0.02, 1.33, 0.9, 0.034, 14), curve(0.056, 1.325, 0.99, 0.05, 14)];
  const SCARF_TAIL = `
    // rp.x：沿长度 0..1；rp.y：绕一圈 0..1
    col = fract(rp.y * 8.0) < 0.5 ? uC0 : uC1;
    if (rp.x > 0.94) col = fract(rp.y * 16.0) < 0.5 ? uC1 : uC0;   // 穗子
  `;
  const tails = [0, 1].map(
    (k) =>
      new Tube({
        segments: 14,
        radial: 8,
        radius: (s) => (k ? 0.033 : 0.036) * (1 - 0.08 * s),
        flat: 0.26,
        colors: [k ? C.scarfDark : C.scarf, k ? "#a87a24" : C.scarfDark],
        paint: SCARF_TAIL,
      }),
  );

  // ---------------------------------------------------------------- 圆珠笔：插在左胸口袋里，露出一截（笔帽蓝色）
  {
    const z = frontZ(src, -0.066, 1.2, torso) - 0.02;
    const pen = new THREE.CylinderGeometry(0.0042, 0.0042, 0.13, 10);
    pen.translate(-0.075, 1.205, z);
    rigidPart(model, chest, pen, {
      colors: ["#f3f1ea", "#3d5aa8", "#d84a3a"],
      paint: `
        if (rp.y > 1.235) col = uC1;                         // 笔帽
        if (rp.y > 1.215 && rp.y < 1.223) col = vec3(0.95); // 价签
      `,
      outline: 1.4,
    });
    const clip = new THREE.BoxGeometry(0.0022, 0.03, 0.0035);
    clip.translate(-0.075, 1.255, z - 0.0055);
    rigidPart(model, chest, clip, { colors: ["#3d5aa8"], paint: ``, outline: 1.0 });
  }

  // ---------------------------------------------------------------- 铁靴（硬的铁，挂在小腿和脚上），靴口露出写着「活下去」的砖
  const boots = wearBoots(model.bones);

  // ---------------------------------------------------------------- 头发：后面的三串长发在肩胛骨的位置扎住；两边支出去的几缕垂下来
  const pony = [
    { chain: hairChain(model, "17dd99c0"), aim: 3, side: -1 },
    { chain: hairChain(model, "b47a78b7"), aim: 3, side: 0 },
    { chain: hairChain(model, "d89208f3"), aim: 4, side: 1 },
  ];
  const wisps = [hairChain(model, "5e784232"), hairChain(model, "795840ac"), hairChain(model, "a37fc5ef")];
  const tieLocal = toBone(model, chest, new THREE.Vector3(0, 1.25, 0.15));
  const ramp = (src.mesh.material as THREE.MeshToonMaterial).gradientMap;
  const cordGeo = new THREE.TorusGeometry(0.03, 0.0075, 8, 24);
  const cord = new THREE.Mesh(cordGeo, new THREE.MeshToonMaterial({ color: C.cord, gradientMap: ramp }));

  // 围巾的两头、扎绳挂在人物的根节点下（跟着人物移动、显示和隐藏）；形状每帧按世界坐标算好再换回根节点坐标
  const root = model.root;
  for (const tl of tails) tl.add(root);
  root.add(cord);
  const tmp = new THREE.Vector3();
  const qa = new THREE.Quaternion();
  const inv = new THREE.Matrix4();
  const invQ = new THREE.Quaternion();
  const update = (t: number, opts: { float?: number; wind?: THREE.Vector3 } = {}) => {
    const f = opts.float ?? 0;
    const ff = f * f * (3 - 2 * f);
    const wind = opts.wind ?? new THREE.Vector3();
    root.updateWorldMatrix(true, true);
    inv.copy(root.matrixWorld).invert();
    root.getWorldQuaternion(invQ).invert();
    const cq = chest.getWorldQuaternion(qa);
    const back = new THREE.Vector3(0, 0, 1).applyQuaternion(cq);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cq);
    // 围巾的两头：平时贴着胸前垂下；失重时从脖子那里往上飘
    tails.forEach((tl, k) => {
      const rest = tailRest[k].map((p) => chest.localToWorld(p.clone()));
      let pts = rest;
      if (ff > 0.001 || wind.lengthSq() > 1e-6) {
        const n = rest.length - 1;
        const seg = rest[0].distanceTo(rest[n]) / n;
        const flown = hangChain(rest[0], new THREE.Vector3(0, 1, 0).sub(back.clone().multiplyScalar(0.6)), n, seg, f, wind, 0.22, (i) =>
          new THREE.Vector3(Math.sin(t * 1.3 - i * 0.55 + k * 1.7) * 0.12 * ff, 0, Math.cos(t * 1.1 - i * 0.5 + k) * 0.08 * ff));
        const w = Math.min(1, ff + wind.length());
        pts = rest.map((p, i) => p.clone().lerp(flown[i], w * Math.min(1, i / 3)));
      }
      // 两头的宽面不完全平行（第二头拧过去一点），看起来是软的毛线，不是两块板
      const face = back.clone().negate().applyAxisAngle(new THREE.Vector3(0, 1, 0).applyQuaternion(cq), k ? 0.55 : -0.15);
      tl.update(pts.map((p) => p.clone().applyMatrix4(inv)), face.applyQuaternion(invQ));
    });
    // 长发：前几节收向扎绳，之后按重力垂下（贴着背、稍微往后），失重时往上飘
    const tie = chest.localToWorld(tieLocal.clone());
    for (const { chain, aim, side } of pony) {
      aimChain(chain, (i, at) => {
        if (i < aim) return tmp.subVectors(tie, at);
        const k = i - aim;
        const sway = Math.sin(t * (1.1 + 0.5 * f) - k * 0.8 + side) * (0.04 + 0.5 * ff);
        return tmp
          .set(0, -1 + 2 * ff, 0)
          .addScaledVector(back, 0.28 + 0.2 * ff)
          .addScaledVector(right, side * 0.07 + sway)
          .add(wind);
      });
    }
    // 两边支出去的几缕：垂下来（贴着头发往外一点）
    wisps.forEach((chain, n) => {
      const out = n === 1 ? -1 : 1;
      aimChain(chain, (i) => tmp.set(0, -1 + 2 * ff, 0).addScaledVector(right, out * (0.18 + 0.05 * i)).addScaledVector(back, 0.15).add(wind));
    });
    // 扎绳：套在头发收拢的地方
    cord.position.copy(tie).applyMatrix4(inv);
    cord.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0).addScaledVector(back, 0.35).normalize().applyQuaternion(invQ));
  };
  return { model, update, footLift: BOOT_SOLE, boots };
}

function smooth(x: number) {
  const v = Math.min(1, Math.max(0, x));
  return v * v * (3 - 2 * v);
}
