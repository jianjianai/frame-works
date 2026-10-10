/**
 * 其他人（同学、大人、兽医、医生……），和主角同样的精细画风：脸部明暗、带虹膜高光的眼睛、眉毛、发型发丝线、关节袖子和真实的手。
 * drawPerson(ctx, x, y, s, person)：(x, y) = 头中心。CAST 是常用的一组人（杰、雨、班长、a–e、兽医、小美、琪、学生 1–4）。
 * x（0..1）叠上封面那种被划掉的“X 脸”（反转前用），默认 1：不想要就写 x: 0。另有 xMark、生日横幅 banner、笑声涂鸦 hahas。
 */
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, F, Pt, beginFrame, blob, curve, hash, ik2, inkLine, lerp2, loadFonts, oval, paint, poly, shaded, tubePts } from "./draw";
import { HandShape, drawHand, handShape } from "./kid";

const point = z.tuple([z.number(), z.number()]);
const color = (fallback: string, what: string) => z.string().default(fallback).describe(`${what}颜色（#rrggbb）`);

/** Everyone else (adults/classmates), drawn in the same refined style as the protagonist:
 *  shaded face, eyes with iris + catchlights, brows, styled hair with lock lines, jointed sleeves and real hands.
 *  `x` (0..1) overlays the cover's crossed-out "X" face (used before a twist). (x, y) = head centre.
 *  重置版 added `handL/handR` (wrist target, head units) + `shapeL/shapeR` + `bendL/bendR`: they override one arm of any
 *  preset (e.g. one hand waving, the other holding a gift behind the back). */
export const personSchema = z.object({
  hair: z.enum(["short", "long", "bob", "pony", "buzz", "cap", "bun", "curly"]).default("short").describe("发型"),
  hairColor: color("#2a2220", "头发"),
  top: color("#888888", "上衣"),
  bottom: color("#334455", "裤子 / 裙子"),
  shoes: color("#1d1b1c", "鞋"),
  skin: color("#f3dcae", "皮肤"),
  x: z.number().min(0).max(1).default(1).describe("被划掉的 X 脸显示多少：默认 1（显示），不要就写 0"),
  face: z.enum(["smile", "laugh", "neutral", "o", "sad"]).default("smile").describe("表情"),
  arms: z.enum(["down", "laugh", "behind", "up", "phone", "handL", "handR", "point", "hold", "waveL", "thumb"]).default("down").describe("手臂预设（waveL 招手，thumb 竖拇指）"),
  wave: z.number().min(0).max(1).default(1).describe("waveL 时手举起多少"),
  legs: z.enum(["stand", "walk", "sit"]).default("stand").describe("腿"),
  walk: z.number().min(0).max(6.3).default(0).describe("步态相位（弧度）"),
  body: z.enum(["bust", "full"]).default("full").describe("半身 / 全身"),
  turn: z.number().min(-1).max(1).default(0).describe("转头 -1..1"),
  tilt: z.number().min(-0.6).max(0.6).default(0).describe("歪头（弧度）"),
  glasses: z.boolean().default(false).describe("眼镜"),
  coat: z.boolean().default(false).describe("白大褂"),
  mask: z.number().min(0).max(1).optional().describe("口罩：不写就没有；1 戴上，0 拉到下巴"),
  handL: point.optional().describe("覆盖预设的左手腕目标点（头部单位）"),
  handR: point.optional().describe("覆盖预设的右手腕目标点（头部单位）"),
  shapeL: handShape.optional().describe("左手形状"),
  shapeR: handShape.optional().describe("右手形状"),
  bendL: z.number().min(-1).max(1).optional().describe("左肘弯向"),
  bendR: z.number().min(-1).max(1).optional().describe("右肘弯向"),
  seed: z.number().int().default(500).describe("抖动线条的种子"),
});
export type Person = z.input<typeof personSchema> & {
  /** drawn between arms and hands */
  holding?: (ctx: Ctx) => void;
};

export const CAST: Record<string, Person> = {
  jie: { hair: "short", hairColor: "#1f1a17", top: "#ef8a3a", bottom: "#3b4a63", shoes: "#f2f2f2", seed: 301 },
  yu: { hair: "curly", hairColor: "#2a1d18", top: C.maroon, bottom: "#3a4440", shoes: "#f3c6cf", skin: "#d9a77c", seed: 302 },
  monitor: { hair: "pony", hairColor: "#3a2414", top: "#f2c94c", bottom: "#2f3b4f", glasses: true, seed: 303 },
  a: { hair: "buzz", hairColor: "#222", top: "#5aa36b", bottom: "#2d2d3a", seed: 304 },
  b: { hair: "long", hairColor: "#5a3a22", top: "#e9e4dc", bottom: "#6b7fa8", seed: 305 },
  c: { hair: "cap", hairColor: "#222", top: "#7d63b8", bottom: "#333", seed: 306 },
  d: { hair: "bun", hairColor: "#191515", top: "#e46f78", bottom: "#41506b", seed: 307 },
  e: { hair: "bob", hairColor: "#6b4a2a", top: "#4f8fbf", bottom: "#2e2e2e", seed: 308 },
  vet: { hair: "short", hairColor: "#2a2220", top: "#8fc1d0", bottom: "#4f5f6e", shoes: "#e9e9e9", glasses: true, coat: true, x: 0, seed: 309 },
  mei: { hair: "pony", hairColor: "#2a1d18", top: "#9cc7e8", bottom: "#2f3d5c", skin: "#f6e0c4", x: 0, seed: 310 },
  qi: { hair: "bun", hairColor: "#3a2a20", top: "#f4c9d4", bottom: "#2f3d5c", glasses: true, skin: "#f2d9b8", x: 0, seed: 311 },
  stu1: { hair: "short", hairColor: "#1f1a17", top: "#e9e4dc", bottom: "#2f3d5c", x: 0, seed: 312 },
  stu2: { hair: "long", hairColor: "#2a2220", top: "#e9e4dc", bottom: "#2f3d5c", x: 0, seed: 313 },
  stu3: { hair: "buzz", hairColor: "#222", top: "#e9e4dc", bottom: "#2f3d5c", x: 0, seed: 314 },
  stu4: { hair: "bob", hairColor: "#4a3020", top: "#e9e4dc", bottom: "#2f3d5c", x: 0, seed: 315 },
};

function darker(hex: string, k = 0.75) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (sh: number) => Math.round(((n >> sh) & 255) * k);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

/** The crossed-out face from the cover art. */
export function xMark(ctx: Ctx, cx: number, cy: number, r: number, seed: number, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineCap = "round";
  for (const [a, b] of [
    [[-r, -r * 0.8], [r, r * 0.85]],
    [[r * 0.95, -r * 0.85], [-r * 0.9, r * 0.8]],
  ] as [Pt, Pt][]) {
    curve(ctx, [[cx + a[0], cy + a[1]], [cx + (a[0] + b[0]) / 2, cy + (a[1] + b[1]) / 2], [cx + b[0], cy + b[1]]], seed++, 2);
    ctx.strokeStyle = C.xBlue;
    ctx.lineWidth = r * 0.42;
    ctx.stroke();
    ctx.strokeStyle = C.xWhite;
    ctx.lineWidth = r * 0.24;
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- head
const FACE: Pt[] = [
  [-50, -88], [-86, -60], [-98, -14], [-96, 30], [-86, 64], [-66, 88], [-34, 102], [0, 106],
  [34, 101], [66, 86], [86, 62], [96, 28], [98, -14], [86, -60], [50, -88], [0, -96],
];

function hairBack(ctx: Ctx, p: Person, seed: number) {
  const hc = p.hairColor ?? "#2a2220";
  const sh = darker(hc, 0.7);
  if (p.hair === "long") {
    shaded(ctx, () => blob(ctx, [[-96, -40], [-114, 80], [-108, 220], [-64, 250], [64, 250], [108, 220], [114, 80], [96, -40], [0, -116]], seed, 1.8), hc, () => {
      for (let i = 0; i < 5; i++) inkLine(ctx, [[-80 + i * 40, 40], [-86 + i * 42, 160], [-80 + i * 40, 240]], seed + 1 + i, 2.4, sh);
    }, C.ink, 5);
  } else if (p.hair === "pony") {
    shaded(ctx, () => blob(ctx, [[60, -84], [146, -66], [170, 24], [146, 130], [118, 44], [82, -20]], seed, 1.8), hc, () => {
      inkLine(ctx, [[90, -50], [140, 20], [140, 110]], seed + 1, 2.4, sh);
    }, C.ink, 5);
    oval(ctx, 82, -70, 14, 12, seed + 2, 0.6);
    paint(ctx, "#e8505b", C.ink, 3.5);
  } else if (p.hair === "bun") {
    shaded(ctx, () => oval(ctx, 0, -112, 46, 40, seed, 1.4), hc, () => {
      inkLine(ctx, [[-30, -112], [0, -128], [28, -110]], seed + 1, 2.4, sh);
    }, C.ink, 5);
  } else if (p.hair === "curly") {
    const pts: Pt[] = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const r = i % 2 ? 120 : 104;
      pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.95 - 4]);
    }
    blob(ctx, pts, seed, 2);
    paint(ctx, hc, C.ink, 5);
  } else if (p.hair === "bob") {
    shaded(ctx, () => blob(ctx, [[-102, -20], [-110, 70], [-92, 112], [92, 112], [110, 70], [102, -20], [0, -114]], seed, 1.8), hc, () => {
      inkLine(ctx, [[-90, 20], [-96, 100]], seed + 1, 2.4, sh);
      inkLine(ctx, [[90, 20], [96, 100]], seed + 2, 2.4, sh);
    }, C.ink, 5);
  }
}

function hairFront(ctx: Ctx, p: Person, seed: number) {
  const hc = p.hairColor ?? "#2a2220";
  const sh = darker(hc, 0.65);
  const hi = "rgba(255,255,255,0.18)";
  const locks = (n: number, y0: number) => {
    for (let i = 0; i < n; i++) {
      const x = -70 + (i * 140) / Math.max(1, n - 1);
      inkLine(ctx, [[x * 0.6, y0 - 60], [x * 0.85, y0 - 30], [x, y0]], seed + 10 + i, 2.4, sh);
    }
  };
  switch (p.hair ?? "short") {
    case "short":
      shaded(ctx, () => poly(ctx, [[-96, 4], [-104, -50], [-74, -98], [-20, -116], [42, -110], [92, -80], [104, -30], [98, 6], [76, -26], [52, -12], [36, -36], [8, -14], [-14, -36], [-40, -14], [-60, -36], [-78, -8]], seed, 1.3), hc, () => {
        locks(5, -22);
        inkLine(ctx, [[-60, -86], [-20, -100], [20, -98]], seed + 30, 5, hi);
      }, C.ink, 5);
      break;
    case "buzz":
      shaded(ctx, () => blob(ctx, [[-90, -22], [-80, -82], [0, -104], [80, -82], [90, -22], [40, -54], [-40, -54]], seed, 1.1), hc, () => {
        for (let i = 0; i < 14; i++) {
          const x = -70 + hash(seed + i) * 140,
            y = -90 + hash(seed + i * 2) * 40;
          inkLine(ctx, [[x, y], [x + 3, y + 5]], seed + 40 + i, 2, sh);
        }
      }, C.ink, 4);
      break;
    case "cap":
      shaded(ctx, () => blob(ctx, [[-98, -16], [-88, -88], [0, -114], [88, -88], [98, -16]], seed, 1.1), p.top ?? "#c33", () => {
        inkLine(ctx, [[0, -112], [0, -20]], seed + 1, 2.4, "rgba(0,0,0,0.3)");
      }, C.ink, 5);
      blob(ctx, [[-110, -18], [60, -30], [156, -8], [60, 2], [-100, 2]], seed + 2, 1.1);
      paint(ctx, p.top ?? "#c33", C.ink, 5);
      break;
    case "curly": {
      const pts: Pt[] = [];
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI + (i / 12) * Math.PI;
        const r = i % 2 ? 118 : 98;
        pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.95 - 4]);
      }
      pts.push([90, -10], [50, -40], [10, -18], [-40, -44], [-90, -8]);
      shaded(ctx, () => blob(ctx, pts, seed, 1.8), hc, () => {
        for (let i = 0; i < 8; i++) {
          const a = Math.PI * (1.1 + i * 0.1);
          oval(ctx, Math.cos(a) * 80, Math.sin(a) * 76 - 10, 12, 10, seed + 50 + i, 0.6);
          paint(ctx, null, sh, 2.4);
        }
      }, C.ink, 5);
      break;
    }
    default:
      shaded(ctx, () => blob(ctx, [[-100, 10], [-100, -60], [-50, -106], [20, -112], [86, -86], [104, -20], [100, 10], [70, -40], [10, -30], [-50, -46]], seed, 1.3), hc, () => {
        locks(4, -36);
        inkLine(ctx, [[-60, -86], [-20, -100], [20, -98]], seed + 30, 5, hi);
      }, C.ink, 5);
  }
}

function personEye(ctx: Ctx, cx: number, cy: number, side: number, p: Person, seed: number) {
  const f = p.face ?? "smile";
  if (f === "laugh" || f === "smile") {
    // happy closed arcs
    inkLine(ctx, [[cx - 18, cy + 6], [cx, cy - 6], [cx + 18, cy + 6]], seed, 4.6);
    return;
  }
  const open = f === "o" ? 1 : f === "sad" ? 0.6 : 0.8;
  const up: Pt[] = [[cx - 20 * side, cy + 2], [cx - 8 * side, cy - 15 * open], [cx + 10 * side, cy - 15 * open], [cx + 20 * side, cy + 2]];
  const lo: Pt[] = [[cx + 20 * side, cy + 3], [cx + 8 * side, cy + 11], [cx - 8 * side, cy + 11], [cx - 20 * side, cy + 3]];
  ctx.save();
  blob(ctx, [...up, ...lo], seed, 0.5);
  ctx.fillStyle = "#f7f3ea";
  ctx.fill();
  ctx.clip();
  const lx = (p.turn ?? 0) * 6;
  ctx.fillStyle = "#3a2a20";
  ctx.beginPath();
  ctx.arc(cx + lx, cy + 2, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(cx + lx, cy + 2, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx + lx - 3.5, cy - 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  curve(ctx, up, seed + 1, 0.5);
  paint(ctx, null, C.ink, 4.6);
  inkLine(ctx, [lo[0], lo[1], lo[2]], seed + 2, 2);
}

function face(ctx: Ctx, p: Person, seed: number) {
  const f = p.face ?? "smile";
  const tx = (p.turn ?? 0) * 26;
  const sad = f === "sad";
  // brows
  for (const side of [-1, 1]) {
    const cx = tx + side * 38;
    const yi = sad ? -30 : -24,
      yo = sad ? -18 : -26;
    curve(ctx, [[cx - 14 * side, yi], [cx, (yi + yo) / 2 - 3], [cx + 16 * side, yo]], seed + 20 + side, 0.6);
    ctx.lineCap = "round";
    ctx.strokeStyle = darker(p.hairColor ?? "#2a2220", 0.8);
    ctx.lineWidth = 6;
    ctx.stroke();
    personEye(ctx, cx, 4, side, p, seed + 30 + side * 3);
  }
  // nose
  inkLine(ctx, [[tx + 2, 22], [tx + 10, 36], [tx + 2, 42]], seed + 40, 3);
  // cheeks
  for (const side of [-1, 1]) {
    oval(ctx, tx + side * 54, 40, 15, 8, seed + 41 + side, 0.6);
    paint(ctx, "rgba(240,120,120,0.35)", null);
  }
  // mouth
  if (f === "laugh") {
    blob(ctx, [[tx - 26, 56], [tx + 26, 56], [tx + 16, 82], [tx - 16, 82]], seed + 50, 0.8);
    paint(ctx, "#5e2228", C.ink, 4);
    ctx.save();
    blob(ctx, [[tx - 26, 56], [tx + 26, 56], [tx + 16, 82], [tx - 16, 82]], seed + 50, 0.8);
    ctx.clip();
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(tx - 30, 52, 60, 9);
    ctx.restore();
  } else if (f === "o") {
    oval(ctx, tx, 66, 9, 12, seed + 51, 0.6);
    paint(ctx, "#5e2228", C.ink, 3.5);
  } else if (f === "smile") {
    inkLine(ctx, [[tx - 20, 58], [tx - 6, 68], [tx + 8, 68], [tx + 20, 58]], seed + 52, 4);
  } else if (sad) {
    inkLine(ctx, [[tx - 14, 68], [tx, 62], [tx + 14, 68]], seed + 53, 4);
  } else inkLine(ctx, [[tx - 12, 64], [tx + 12, 64]], seed + 54, 4);
  if (p.glasses) {
    for (const side of [-1, 1]) {
      oval(ctx, tx + side * 38, 4, 27, 23, seed + 60 + side, 0.6);
      paint(ctx, "rgba(220,240,255,0.18)", C.ink, 4);
      inkLine(ctx, [[tx + side * 38 - 12, -6], [tx + side * 38 - 4, -12]], seed + 62 + side, 2.4, "rgba(255,255,255,0.8)");
    }
    inkLine(ctx, [[tx - 11, 2], [tx + 11, 2]], seed + 64, 4);
  }
}

function surgicalMask(ctx: Ctx, p: Person, seed: number) {
  const on = p.mask ?? 0;
  const tx = (p.turn ?? 0) * 26;
  const dy = (1 - on) * 74; // pulled down under the chin
  ctx.save();
  ctx.translate(tx, dy);
  shaded(ctx, () => blob(ctx, [[-70, 24], [0, 16], [70, 24], [66, 86], [0, 104], [-66, 86]], seed, 0.8), "#bfe0ec", () => {
    for (let i = 0; i < 3; i++) inkLine(ctx, [[-60, 44 + i * 16], [60, 44 + i * 16]], seed + 1 + i, 2, "rgba(60,110,130,0.45)");
  }, C.ink, 3.5);
  ctx.restore();
  inkLine(ctx, [[-70 + tx, 30 + dy], [-92, 24]], seed + 5, 2.4, "#9cc4d2");
  inkLine(ctx, [[70 + tx, 30 + dy], [92, 24]], seed + 6, 2.4, "#9cc4d2");
}

// ---------------------------------------------------------------- body
interface ArmT {
  wrist: Pt;
  bend: number;
  shape: HandShape;
}
function armTargets(p: Person): [ArmT | null, ArmT | null] {
  const a = p.arms ?? "down";
  let L: ArmT | null = { wrist: [-112, 352], bend: -1, shape: "relax" },
    R: ArmT | null = { wrist: [112, 352], bend: 1, shape: "relax" };
  switch (a) {
    case "laugh":
      L = { wrist: [-40, 270], bend: -1, shape: "fist" };
      R = { wrist: [90, 120], bend: 1, shape: "open" };
      break;
    case "point":
      L = { wrist: [-50, 280], bend: -1, shape: "relax" };
      R = { wrist: [-230, 60], bend: 1, shape: "open" };
      break;
    case "up":
      L = { wrist: [-150, -110], bend: 1, shape: "open" };
      R = { wrist: [150, -110], bend: -1, shape: "open" };
      break;
    case "thumb":
      R = { wrist: [70, 230], bend: 1, shape: "fist" };
      break;
    case "hold":
      L = { wrist: [-140, 70], bend: -1, shape: "hold" };
      R = { wrist: [140, 70], bend: 1, shape: "hold" };
      break;
    case "phone":
      L = { wrist: [-30, 250], bend: -1, shape: "hold" };
      R = { wrist: [30, 250], bend: 1, shape: "hold" };
      break;
    case "handL":
      L = { wrist: [-180, 300], bend: -1, shape: "relax" };
      break;
    case "handR":
      R = { wrist: [180, 300], bend: 1, shape: "relax" };
      break;
    case "behind":
      L = R = null;
      break;
    case "waveL": {
      const w = p.wave ?? 1;
      L = { wrist: [-150 - 30 * w + Math.sin((p.walk ?? 0) * 3) * 18 * w, 60 - 190 * w], bend: 1, shape: "open" };
      R = { wrist: [140, 70], bend: 1, shape: "hold" };
      break;
    }
  }
  if (p.handL) L = { wrist: p.handL, bend: p.bendL ?? -1, shape: p.shapeL ?? "relax" };
  if (p.handR) R = { wrist: p.handR, bend: p.bendR ?? 1, shape: p.shapeR ?? "relax" };
  return [L, R];
}

function sleeve(ctx: Ctx, shoulder: Pt, t: ArmT, color: string, seed: number, mirror: boolean) {
  const [elbow, wrist] = ik2(shoulder, t.wrist, 128, 124, t.bend);
  const spine = [shoulder, lerp2(shoulder, elbow, 0.5), elbow, lerp2(elbow, wrist, 0.5), wrist];
  shaded(ctx, () => blob(ctx, tubePts(spine, [54, 50, 46, 42, 40], true, true), seed, 1), color, () => {
    blob(ctx, tubePts(spine.map(([x, y]) => [x + 12, y + 4]) as Pt[], [34, 30, 28, 26, 24], true, true), seed + 1, 1);
    paint(ctx, darker(color.startsWith("#") ? color : "#888888", 0.82), null);
  }, C.ink, 5);
  inkLine(ctx, [lerp2(elbow, shoulder, 0.15), elbow, lerp2(elbow, wrist, 0.15)], seed + 2, 2.2, "rgba(0,0,0,0.25)");
  return { wrist, ang: Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]), mirror };
}

/** Draw a person with head centre at (x, y). */
export function drawPerson(ctx: Ctx, x: number, y: number, s: number, p: Person) {
  const seed = p.seed ?? 500;
  const skin = p.skin ?? C.skin;
  const top = p.top ?? "#888888";
  const xa = p.x ?? 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const body = p.body ?? "full";
  if (body === "full") {
    const ph = p.walk ?? 0;
    for (const side of [-1, 1]) {
      const sw = p.legs === "walk" ? Math.sin(ph) * side : 0;
      const hip: Pt = [side * 46, 350];
      const foot: Pt = p.legs === "sit" ? [side * 70, 560] : [side * 44 + sw * 30, 690 - (p.legs === "walk" ? Math.max(0, Math.cos(ph) * side) * 30 : 0)];
      const knee: Pt = p.legs === "sit" ? [side * 60, 450] : lerp2(hip, foot, 0.5);
      shaded(ctx, () => blob(ctx, tubePts([hip, knee, foot], [80, 66, 58], true, true), seed + side, 1.2), p.bottom ?? "#334455", () => {
        blob(ctx, tubePts([[hip[0] + 16, hip[1]], [knee[0] + 14, knee[1]], [foot[0] + 12, foot[1]]], [40, 34, 30], true, true), seed + 2 + side, 1);
        paint(ctx, "rgba(0,0,0,0.18)", null);
      }, C.ink, 5);
      blob(ctx, [[foot[0] - 40, foot[1] + 10], [foot[0] + 6 * side, foot[1] - 8], [foot[0] + 46, foot[1] + 12], [foot[0] + 30, foot[1] + 30], [foot[0] - 34, foot[1] + 30]], seed + 4 + side, 0.9);
      paint(ctx, p.shoes ?? "#1d1b1c", C.ink, 4.5);
    }
  }
  // neck
  blob(ctx, [[-30, 80], [30, 80], [34, 140], [-34, 140]], seed + 9, 0.8);
  paint(ctx, darker(skin.startsWith("#") ? skin : "#f3dcae", 0.92), C.ink, 4.5);
  // torso (shirt) and optional lab coat
  const torso: Pt[] = [[-60, 124], [-96, 140], [-108, 220], [-104, 350], [0, 360], [104, 350], [108, 220], [96, 140], [60, 124], [0, 134]];
  shaded(ctx, () => blob(ctx, torso, seed + 10, 1.2), top, () => {
    blob(ctx, [[50, 124], [120, 150], [120, 380], [60, 380], [74, 240]], seed + 11, 1.2);
    paint(ctx, "rgba(0,0,0,0.16)", null);
  }, C.ink, 5.5);
  if (p.coat) {
    for (const side of [-1, 1]) {
      shaded(ctx, () => poly(ctx, [[side * 20, 132], [side * 100, 142], [side * 114, 230], [side * 112, 400], [side * 40, 404], [side * 34, 250]], seed + 12 + side, 1.2), "#f6f7f8", () => {
        poly(ctx, [[side * 70, 150], [side * 120, 160], [side * 120, 420], [side * 84, 420]], seed + 14 + side, 1);
        paint(ctx, "rgba(150,170,180,0.25)", null);
      }, C.ink, 5);
      // lapel
      poly(ctx, [[side * 22, 134], [side * 58, 136], [side * 40, 200]], seed + 16 + side, 0.8);
      paint(ctx, "#e4e8ea", C.ink, 3.5);
    }
    // pocket with pens
    poly(ctx, [[-96, 250], [-50, 250], [-52, 300], [-94, 300]], seed + 18, 0.8);
    paint(ctx, null, "rgba(0,0,0,0.35)", 3);
    inkLine(ctx, [[-84, 236], [-84, 256]], seed + 19, 4, "#2f6fb0");
    inkLine(ctx, [[-70, 232], [-70, 256]], seed + 20, 4, "#c0392b");
  }
  const [L, R] = armTargets(p);
  const coatCol = p.coat ? "#f6f7f8" : top;
  const al = L ? sleeve(ctx, [-90, 156], L, coatCol, seed + 22, true) : null;
  const ar = R ? sleeve(ctx, [90, 156], R, coatCol, seed + 26, false) : null;
  p.holding?.(ctx);
  if (al && L) drawHand(ctx, al.wrist[0], al.wrist[1], 0.86, al.ang, L.shape, true, false, seed + 30);
  if (ar && R) drawHand(ctx, ar.wrist[0], ar.wrist[1], 0.86, ar.ang, R.shape, false, false, seed + 31);
  if (p.arms === "thumb" && ar) {
    // thumb up
    ctx.save();
    ctx.translate(ar.wrist[0] + 30, ar.wrist[1] - 26);
    blob(ctx, [[-8, 10], [-10, -30], [0, -40], [10, -30], [8, 10]], seed + 32, 0.6);
    paint(ctx, skin, C.ink, 4);
    ctx.restore();
  }
  // head
  ctx.save();
  ctx.rotate(p.tilt ?? 0);
  hairBack(ctx, p, seed + 40);
  for (const side of [-1, 1]) {
    oval(ctx, side * 96, 14, 14, 21, seed + 44 + side, 0.8);
    paint(ctx, skin, C.ink, 4);
  }
  shaded(ctx, () => blob(ctx, FACE, seed + 50, 1.1), skin, () => {
    blob(ctx, [[50, 106], [90, 64], [104, 10], [120, 80], [70, 130]], seed + 51, 1);
    paint(ctx, "rgba(200,150,95,0.3)", null);
  }, C.ink, 5);
  if (xa < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - xa;
    face(ctx, p, seed + 60);
    ctx.restore();
  }
  if (p.mask !== undefined) surgicalMask(ctx, p, seed + 66);
  hairFront(ctx, p, seed + 70);
  xMark(ctx, (p.turn ?? 0) * 26, 10, 60, seed + 80, xa);
  ctx.restore();
  ctx.restore();
}

/** Pink rolled/unrolled banner "生日快乐". `open` 0 = rolled, 1 = fully open. */
export function banner(ctx: Ctx, x: number, y: number, w: number, open: number, label: string, seed: number, fontFamily: string) {
  const h = 150;
  const ww = Math.max(40, w * open);
  ctx.save();
  poly(ctx, [[x - ww / 2, y - h / 2], [x + ww / 2, y - h / 2 + 6], [x + ww / 2, y + h / 2], [x - ww / 2, y + h / 2 - 6]], seed, 2);
  paint(ctx, "#ff7fb0", C.ink, 5);
  if (open > 0.6) {
    ctx.globalAlpha *= (open - 0.6) / 0.4;
    ctx.font = `400 96px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 10;
    ctx.strokeStyle = C.ink;
    ctx.strokeText(label, x, y + 6);
    ctx.fillStyle = "#fff6c9";
    ctx.fillText(label, x, y + 6);
  }
  ctx.restore();
  for (const side of [-1, 1]) {
    oval(ctx, x + (side * ww) / 2, y, 22, h / 2 + 8, seed + side, 1);
    paint(ctx, "#ff9cc3", C.ink, 5);
  }
}

/** Little "哈哈哈" laugh scribbles around a point. */
export function hahas(ctx: Ctx, cx: number, cy: number, r: number, t: number, seed: number, fontFamily: string, count = 6) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < count; i++) {
    const a = hash(seed + i) * Math.PI * 2;
    const rr = r * (0.6 + hash(seed + i * 3) * 0.5);
    const born = hash(seed + i * 7) * 0.8;
    const k = Math.max(0, Math.min(1, (t - born) * 4));
    if (k <= 0) continue;
    const sz = 44 + hash(seed + i * 5) * 30;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    ctx.rotate((hash(seed + i * 9) - 0.5) * 0.7);
    ctx.scale(k, k);
    ctx.font = `400 ${sz}px ${fontFamily}`;
    ctx.lineWidth = 8;
    ctx.strokeStyle = C.ink;
    ctx.strokeText("哈哈哈", 0, 0);
    ctx.fillStyle = i % 2 ? "#ffe45c" : "#fff";
    ctx.fillText("哈哈哈", 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- resources (preview and catalog)
export const resources = defineResources({
  person: resource({
    kind: "character",
    title: "其他人（同学、大人、兽医）",
    description:
      "主角以外的人物，和主角同样的画风。默认带封面那种被划掉的 X 脸（x: 1，反转前的“陌生人”），正常的人写 x: 0。预设是常用的一组人（CAST）：杰、雨、班长、a–e、兽医、小美、琪、学生 1–4。单独覆盖一只手臂用 handL/handR + shapeL/R + bendL/R（一只手招手，另一只把礼物藏在身后）。",
    tags: ["人物", "同学", "路人", "兽医", "医生", "X脸"],
    usage: "drawPerson(ctx, x, y, s, { ...CAST.jie, face: \"laugh\", x: 0 })  // (x, y) 头中心",
    params: personSchema,
    presets: {
      杰: CAST.jie,
      雨: CAST.yu,
      班长: CAST.monitor,
      a: CAST.a,
      b: CAST.b,
      c: CAST.c,
      d: CAST.d,
      e: CAST.e,
      兽医: CAST.vet,
      小美: CAST.mei,
      琪: CAST.qi,
      学生1: CAST.stu1,
      学生2: CAST.stu2,
      学生3: CAST.stu3,
      学生4: CAST.stu4,
      大笑: { ...CAST.jie, face: "laugh", arms: "laugh", x: 0 },
      招手: { ...CAST.mei, arms: "waveL" },
      竖拇指: { ...CAST.vet, arms: "thumb", mask: 0 },
    },
    preview: {
      width: 600,
      height: 1100,
      duration: 2,
      time: 0,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        drawPerson(ctx, 300, 230, 1, { ...p, walk: p.walk + (p.legs === "walk" ? t * 7 : 0) });
      },
    },
  }),
  xMark: resource({
    kind: "effect",
    title: "X 脸（被划掉的脸）",
    description: "封面里画在人脸上的蓝白大叉。drawPerson 的 x 参数自带它；也可以单独画在任何东西上，alpha 做淡入淡出。",
    tags: ["X", "划掉", "封面"],
    usage: "xMark(ctx, cx, cy, r, seed, alpha)",
    params: z.object({ alpha: z.number().min(0).max(1).default(1).describe("不透明度") }),
    preview: {
      width: 400,
      height: 400,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        xMark(ctx, 200, 200, 130, 7, p.alpha);
      },
    },
  }),
  banner: resource({
    kind: "prop",
    title: "生日横幅",
    description: "粉色横幅，open 0 卷着、1 完全展开，label 是上面的字。",
    tags: ["生日", "横幅", "派对"],
    usage: "banner(ctx, x, y, w, open, label, seed, F.cn)",
    params: z.object({
      open: z.number().min(0).max(1).default(1).describe("展开程度"),
      label: z.string().default("生日快乐").describe("文字"),
    }),
    preview: {
      width: 800,
      height: 400,
      duration: 1.5,
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        banner(ctx, 400, 200, 620, p.open, p.label, 31, F.cn);
      },
    },
  }),
  hahas: resource({
    kind: "effect",
    title: "哈哈哈（笑声涂鸦）",
    description: "一圈“哈哈哈”手写字绕着一个点跳动，用在被嘲笑、哄堂大笑的镜头。t 用作品时间。",
    tags: ["笑", "嘲笑", "文字", "涂鸦"],
    usage: "hahas(ctx, cx, cy, r, abs, seed, F.cn, count)",
    params: z.object({ count: z.number().int().min(1).max(12).default(6).describe("几个“哈”") }),
    preview: {
      width: 600,
      height: 600,
      duration: 2,
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        hahas(ctx, 300, 300, 200, t, 3, F.cn, p.count);
      },
    },
  }),
});
