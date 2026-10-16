// 主街（前奏、主歌二的戏都在这里）：沿 x 轴，街心 z = 0，北侧楼面在 z = −8，南侧在 z = +8（16 米宽）。
// 两边一排三到五层的老房子（粉、杏、薄荷、雾蓝、奶油），门、窗、窗框、窗台、楼层线、檐口在着色器里画；
// 往外凸的东西是真的几何体：条纹遮阳篷、阳台、窗台花箱、凸窗（老钟坐在里面）、台阶、灯杆。
// 街面是石板；头顶两层接人的网（破了洞、挂着灰）。
import * as THREE from "three";
import { outlineMaterial, toonRamp } from "../rig3d/vrm";
import { paintedToon } from "../rig3d/garment";

export const STREET = {
  north: -8, // 北侧楼面
  south: 8,
  x0: -20,
  x1: 120,
};

/** 前奏里几处固定的位置 */
export const SPOTS = {
  zhouLei: new THREE.Vector3(40, 2.1, -4.6), // 周磊飘着的地方（他身后二楼一个红白条纹遮阳篷）
  laoZhong: new THREE.Vector3(49.5, 0, -8), // 老钟的凸窗（一楼）
  kidDoor: new THREE.Vector3(58.5, 0, -8), // 小石头家的门
};

interface House {
  x: number; // 左边（x 小的那一边）
  w: number;
  h: number;
  side: 1 | -1; // 1 北侧（楼面朝 +z），-1 南侧（朝 −z）
  color: THREE.Color;
  floors: number;
  door: number; // 门在这栋楼的第几个开间（-1 没有门）
  bays: number; // 几个开间
  shutters: THREE.Color | null;
  seed: number;
}

const WALL = ["#eab7b3", "#f3cba3", "#bcdcc6", "#aac4dc", "#f2e3c4", "#cbbbdc", "#e9c6d9", "#c4d8d2", "#f0d2b8"];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    s ^= s >>> 13;
    return (s >>> 0) / 4294967296;
  };
}

/** 一栋房子的楼面：box 宽 w、高 h、深 6；花纹按「开间」排 */
function houseMesh(hs: House) {
  const D = 7;
  const geo = new THREE.BoxGeometry(hs.w, hs.h, D);
  geo.translate(hs.w / 2, hs.h / 2, -D / 2);
  geo.setAttribute("aRest", (geo.getAttribute("position") as THREE.BufferAttribute).clone());
  const bay = hs.w / hs.bays;
  const fl = (hs.h - 0.8) / hs.floors;
  const lit = hs.seed % 1;
  const paint = `
    vec3 wall = uC0;
    col = wall;
    // 只有朝街的那一面画门窗（z 接近 0），其余三面画几道楼层线
    float front = step(-0.05, rp.z);
    float u = rp.x, v = rp.y;
    // 勒脚和檐口
    if (v < 0.55) col = wall * 0.82;
    if (v > ${(hs.h - 0.55).toFixed(2)}) col = wall * 0.86;
    if (abs(v - ${(hs.h - 0.62).toFixed(2)}) < 0.05) col = wall * 0.72;
    float fl = ${fl.toFixed(3)};
    // 楼层线
    if (v > 0.8 && abs(fract((v - 0.8) / fl) - 0.0) * fl < 0.06) col = mix(col, wall * 0.88, 0.8);
    if (front > 0.5) {
      float bay = ${bay.toFixed(3)};
      float bi = floor(u / bay);
      vec2 p = vec2(u - (bi + 0.5) * bay, 0.0);
      float floorI = floor((v - 0.3) / fl);
      p.y = v - 0.3 - (floorI + 0.56) * fl;
      bool ground = floorI < 0.5;
      bool isDoor = ground && abs(bi - ${hs.door.toFixed(1)}) < 0.1;
      if (isDoor) {
        // 门：木门、门框、门把手、上面一小块玻璃
        vec2 q = vec2(u - (bi + 0.5) * bay, v - 1.15);
        float fr = rectAA(q, vec2(0.66, 1.2));
        float dr = rectAA(q, vec2(0.56, 1.12));
        col = mix(col, uC1, fr);
        col = mix(col, uC3, dr);
        float pane = rectAA(q - vec2(0.0, 0.75), vec2(0.38, 0.22));
        col = mix(col, uC2 * 1.1, pane);
        if (abs(q.x) < 0.53 && abs(q.y + 0.25) < 0.012) col = uC3 * 0.8;
        float knob = 1.0 - smoothstep(0.035, 0.05, length(q - vec2(0.38, -0.05)));
        col = mix(col, vec3(0.86, 0.7, 0.38), knob);
      } else if (v > 0.6 && v < ${(hs.h - 0.9).toFixed(2)}) {
        // 窗：窗框、玻璃（有的亮着暖灯）、窗台，两边的百叶窗
        vec2 hsz = ground ? vec2(min(0.75, bay * 0.32), 0.85) : vec2(min(0.6, bay * 0.27), 0.75);
        float fr = rectAA(p, hsz + 0.09);
        float gl = rectAA(p, hsz);
        float id = fract(sin(dot(vec2(bi, floorI), vec2(12.9898, 78.233)) + ${(hs.seed * 13.7).toFixed(2)}) * 43758.5453);
        vec3 glass = mix(uC2, uC2 * 1.25, smoothstep(-hsz.y, hsz.y, p.y));
        if (id < ${(0.12 + 0.2 * lit).toFixed(3)}) glass = uC5;
        col = mix(col, uC1, fr);
        col = mix(col, glass, gl);
        // 窗格
        if (gl > 0.5 && (abs(p.x) < 0.025 || abs(p.y - hsz.y * 0.15) < 0.025)) col = uC1;
        // 窗台
        if (abs(p.y + hsz.y + 0.13) < 0.05 && abs(p.x) < hsz.x + 0.18) col = uC1 * 0.92;
        ${hs.shutters ? `
        float sh = rectAA(p - vec2(hsz.x + 0.09 + hsz.x * 0.5, 0.0), vec2(hsz.x * 0.45, hsz.y)) + rectAA(p + vec2(hsz.x + 0.09 + hsz.x * 0.5, 0.0), vec2(hsz.x * 0.45, hsz.y));
        if (!ground) {
          vec3 sc = uC4 * (fract(p.y * 9.0) < 0.5 ? 1.0 : 0.88);
          col = mix(col, sc, clamp(sh, 0.0, 1.0));
        }` : ""}
      }
    }
  `;
  const mat = paintedToon(paint, [hs.color, "#f4efe6", "#8a90b6", "#8a5a3c", hs.shutters ?? "#000000", "#ffdc9a"]);
  mat.gradientMap = toonRamp(0.66);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.add(new THREE.Mesh(geo, outlineMaterial(1.3, 0x4d3a52, false)));
  // 放到街边：北侧楼面朝 +z，南侧转 180°
  if (hs.side === 1) mesh.position.set(hs.x, 0, STREET.north);
  else {
    mesh.rotation.y = Math.PI;
    mesh.position.set(hs.x + hs.w, 0, STREET.south);
  }
  return { mesh, bay, fl };
}

/** 条纹遮阳篷：斜着的一片，红白（或绿白）条 */
function awning(w: number, depth: number, colors: [string, string]) {
  const g = new THREE.BoxGeometry(w, 0.06, depth, 1, 1, 1);
  g.translate(0, 0, depth / 2);
  g.rotateX(0.38);
  g.setAttribute("aRest", (g.getAttribute("position") as THREE.BufferAttribute).clone());
  const stripes = Math.max(4, Math.round(w / 0.32));
  const mat = paintedToon(`col = fract((rp.x / ${w.toFixed(2)} + 0.5) * ${stripes.toFixed(1)}) < 0.5 ? uC0 : uC1;`, colors);
  const m = new THREE.Mesh(g, mat);
  m.add(new THREE.Mesh(g, outlineMaterial(1.3, 0x4d3a52, false)));
  // 垂下来的一排短边
  const valG = new THREE.BoxGeometry(w, 0.22, 0.04);
  valG.translate(0, -0.11 - Math.sin(0.38) * depth, Math.cos(0.38) * depth);
  valG.setAttribute("aRest", (valG.getAttribute("position") as THREE.BufferAttribute).clone());
  const val = new THREE.Mesh(valG, mat);
  m.add(val);
  return m;
}

/** 一块平板（阳台、窗台花箱、台阶）：普通卡通材质加描边 */
function slab(w: number, h: number, d: number, color: string, outline = 1.2) {
  const g = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, new THREE.MeshToonMaterial({ color, gradientMap: toonRamp(0.66) }));
  m.add(new THREE.Mesh(g, outlineMaterial(outline, 0x4d3a52, false)));
  return m;
}

/** 接人的网：两侧楼之间的一张绳网（破了几个洞） */
function net(x0: number, x1: number, y: number, seed: number) {
  const r = rng(seed);
  const pts: number[] = [];
  const holes = Array.from({ length: 3 }, () => [x0 + r() * (x1 - x0), STREET.north + 1 + r() * 10, 1.2 + r() * 2.2]);
  const inHole = (x: number, z: number) => holes.some(([hx, hz, hr]) => Math.hypot(x - hx, z - hz) < hr);
  const sag = (x: number, z: number) => y - 0.6 * Math.sin(((z - STREET.north) / (STREET.south - STREET.north)) * Math.PI) - 0.15 * Math.sin(x * 0.7 + seed);
  const step = 0.9;
  for (let x = x0; x <= x1; x += step)
    for (let z = STREET.north; z < STREET.south; z += 0.25) {
      if (inHole(x, z) || inHole(x, z + 0.25)) continue;
      pts.push(x, sag(x, z), z, x, sag(x, z + 0.25), z + 0.25);
    }
  for (let z = STREET.north; z <= STREET.south; z += step)
    for (let x = x0; x < x1; x += 0.25) {
      if (inHole(x, z) || inHole(x + 0.25, z)) continue;
      pts.push(x, sag(x, z), z, x + 0.25, sag(x + 0.25, z), z);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: "#8b7f8f", transparent: true, opacity: 0.85 }));
}

/** 石板街面 */
function pavement() {
  const L = STREET.x1 - STREET.x0 + 60;
  const g = new THREE.PlaneGeometry(L, STREET.south - STREET.north + 0.2, 1, 1);
  g.rotateX(-Math.PI / 2);
  g.translate((STREET.x0 + STREET.x1) / 2, 0, 0);
  g.setAttribute("aRest", (g.getAttribute("position") as THREE.BufferAttribute).clone());
  const mat = paintedToon(
    `
      vec2 p = rp.xz;
      // 石板：错缝的长方块，缝是深一点的线，块和块颜色稍有不同
      float row = floor(p.y / 0.7);
      float off = fract(row * 0.5) * 1.1;
      vec2 c = vec2((p.x + off) / 1.1, p.y / 0.7);
      vec2 id = floor(c), f = fract(c);
      float n = fract(sin(dot(id, vec2(12.99, 78.23))) * 43758.5);
      col = mix(uC0, uC1, n * 0.6);
      float gx = min(f.x, 1.0 - f.x) * 1.1, gy = min(f.y, 1.0 - f.y) * 0.7;
      float gap = 1.0 - smoothstep(0.015, 0.03 + fwidth(p.x) * 1.5, min(gx, gy));
      col = mix(col, uC2, gap);
      // 靠墙两边积着一层灰
      float edge = smoothstep(6.4, 7.9, abs(p.y));
      col = mix(col, uC3, edge * 0.6);
    `,
    ["#c4b9c8", "#b4a9ba", "#968b9e", "#ece6ee"],
  );
  mat.gradientMap = toonRamp(0.8);
  return new THREE.Mesh(g, mat);
}

export interface StreetSet {
  group: THREE.Group;
  /** 老钟凸窗里的一块地方（他坐在这里）：世界坐标 */
  laoZhongSeat: THREE.Vector3;
}

export function buildStreet(seed = 3): StreetSet {
  const r = rng(seed);
  const group = new THREE.Group();
  group.add(pavement());
  // 两排房子
  const shutters = ["#7fa7a0", "#c98c7c", "#8f9cc4", null, null];
  for (const side of [1, -1] as const) {
    let x = STREET.x0;
    while (x < STREET.x1) {
      let w = 6 + Math.floor(r() * 4) * 1.5;
      // 前奏的几处房子固定尺寸（周磊身后、老钟的窗、小石头家）
      if (side === 1 && x < 36 && x + w > 36) w = 36 - x;
      const floors = 3 + Math.floor(r() * 3);
      const h = floors * 3.3 + 0.8;
      const bays = Math.max(2, Math.round(w / 2.6));
      const hs: House = {
        x,
        w,
        h,
        side,
        color: new THREE.Color(WALL[Math.floor(r() * WALL.length)]),
        floors,
        door: Math.floor(r() * bays),
        bays,
        shutters: (() => {
          const c = shutters[Math.floor(r() * shutters.length)];
          return c ? new THREE.Color(c) : null;
        })(),
        seed: r() * 100,
      };
      if (side === 1 && x === 36) {
        // 周磊身后这栋：杏色，四层，二楼正中一个红白条纹遮阳篷
        hs.w = 9;
        hs.color = new THREE.Color("#f0c3b2");
        hs.floors = 4;
        hs.h = 4 * 3.3 + 0.8;
        hs.bays = 3;
        hs.door = 0;
      }
      if (side === 1 && x === 45) {
        // 老钟家：薄荷绿，一楼一个凸窗
        hs.w = 9;
        hs.color = new THREE.Color("#bfdccb");
        hs.bays = 3;
        hs.door = 2;
      }
      if (side === 1 && x === 54) {
        // 小石头家：雾蓝，三层，门在中间
        hs.w = 9;
        hs.color = new THREE.Color("#b3c8dd");
        hs.floors = 3;
        hs.h = 3 * 3.3 + 0.8;
        hs.bays = 3;
        hs.door = 1;
      }
      const { mesh, bay, fl } = houseMesh(hs);
      group.add(mesh);
      // 一些窗外的遮阳篷、阳台
      const fz = side === 1 ? STREET.north : STREET.south;
      const out = side === 1 ? 1 : -1;
      for (let f = 1; f < hs.floors; f++)
        for (let b = 0; b < hs.bays; b++) {
          const k = r();
          const cx = hs.x + (b + 0.5) * bay;
          const cy = 0.3 + (f + 0.56) * fl;
          if (k < 0.12) {
            const a = awning(Math.min(1.9, bay * 0.8), 0.85, r() < 0.5 ? ["#d9574a", "#f6efe6"] : ["#5f9d86", "#f6efe6"]);
            a.position.set(cx, cy + 1.0, fz);
            if (side === -1) a.rotation.y = Math.PI;
            group.add(a);
          } else if (k < 0.24) {
            const bal = slab(Math.min(2.2, bay * 0.85), 0.14, 0.9, "#efe7dc");
            bal.position.set(cx, cy - 0.95, fz + out * 0.45);
            group.add(bal);
            const rail = slab(Math.min(2.2, bay * 0.85), 0.9, 0.05, "#7a6f84", 0.8);
            rail.position.set(cx, cy - 0.45, fz + out * 0.88);
            group.add(rail);
          } else if (k < 0.38) {
            const box = slab(1.1, 0.24, 0.3, "#9b6b4f");
            box.position.set(cx, cy - 0.68, fz + out * 0.16);
            group.add(box);
            const flowers = slab(1.0, 0.16, 0.24, r() < 0.5 ? "#e58aa0" : "#86b46f", 0.6);
            flowers.position.set(cx, cy - 0.5, fz + out * 0.16);
            group.add(flowers);
          }
        }
      // 门前的台阶
      const step = slab(1.6, 0.18, 0.5, "#b8adbe");
      step.position.set(hs.x + (hs.door + 0.5) * bay, 0.09, fz + out * 0.25);
      group.add(step);
      if (side === 1 && x === 36) {
        const a = awning(2.3, 1.0, ["#d9574a", "#f6efe6"]);
        a.position.set(hs.x + 1.5 * bay, 0.3 + 1.56 * fl + 1.05, fz);
        group.add(a);
      }
      x += hs.w;
    }
  }
  // 老钟的凸窗：一楼往外凸出 0.85 米的一个亮着暖灯的小间（他坐在里面，背后是墙上的窗）
  const bayX = SPOTS.laoZhong.x;
  const bw = 2.4, bh = 1.9, bd = 0.85;
  const room = new THREE.Group();
  const frameMat = new THREE.MeshToonMaterial({ color: "#f4efe6", gradientMap: toonRamp(0.7) });
  const inside = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), new THREE.MeshToonMaterial({ color: "#ffd99a", side: THREE.BackSide, gradientMap: toonRamp(0.85), emissive: new THREE.Color("#5a3a10") }));
  inside.position.set(0, 0, bd / 2);
  room.add(inside);
  for (const [w, h, x, y] of [
    [bw + 0.24, 0.16, 0, bh / 2 + 0.08],
    [bw + 0.24, 0.22, 0, -bh / 2 - 0.11],
    [0.14, bh, -bw / 2 - 0.05, 0],
    [0.14, bh, bw / 2 + 0.05, 0],
  ] as const) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, bd + 0.06), frameMat);
    f.position.set(x, y, bd / 2);
    f.add(new THREE.Mesh(f.geometry, outlineMaterial(1.3, 0x4d3a52, false)));
    room.add(f);
  }
  const roof = slab(bw + 0.5, 0.12, bd + 0.3, "#9b6b4f");
  roof.position.set(0, bh / 2 + 0.22, bd / 2 + 0.05);
  room.add(roof);
  room.position.set(bayX, 0.75 + bh / 2, STREET.north + 0.01);
  group.add(room);
  // 头顶两层网
  group.add(net(STREET.x0, STREET.x1, 13.5, 5), net(STREET.x0, STREET.x1, 27, 9));
  // 灯杆
  for (let lx = STREET.x0 + 8; lx < STREET.x1; lx += 18) {
    const pole = slab(0.14, 5.2, 0.14, "#5e5468", 0.9);
    pole.position.set(lx, 2.6, STREET.south - 0.7);
    group.add(pole);
    const lamp = slab(0.5, 0.32, 0.5, "#fff2cf", 0.9);
    lamp.position.set(lx, 5.3, STREET.south - 0.95);
    group.add(lamp);
  }
  return { group, laoZhongSeat: new THREE.Vector3(bayX, 0.75, STREET.north + 0.42) };
}
